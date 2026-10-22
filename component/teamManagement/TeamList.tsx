"use client";
import {
  addMember,
  getPermissions,
  getTeam,
  removeMember,
  savePermissions,
  setMemberPassword,
  updateMember,
  type Permissions,
  type StaffRole,
  type TeamMember,
} from "@/app/actions/teamAction";
import SideDrawer from "@/component/shared/SideDrawer";
import StatCards, { type StatCard } from "@/component/shared/StatCards";
import TablePagination from "@/component/shared/TablePagination";
import { actionBtn, FilterPills, formatDate, formatDateTime, initials } from "@/component/shared/ui";
import { usePagedList } from "@/component/shared/usePagedList";
import type { AccessLevel, AreaKey } from "@/lib/access";
import { useSidebar } from "@/lib/SidebarContext";
import { useCallback, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  FaBan,
  FaCheck,
  FaCrown,
  FaEdit,
  FaEye,
  FaEyeSlash,
  FaHistory,
  FaKey,
  FaLock,
  FaPlus,
  FaRedo,
  FaSearch,
  FaShieldAlt,
  FaTrashAlt,
  FaUndo,
  FaUserCheck,
  FaUserShield,
  FaUsers,
} from "react-icons/fa";

const ROLE_ORDER: StaffRole[] = ["superadmin", "admin", "moderator"];
const ROLE_INFO: Record<StaffRole, { label: string; summary: string }> = {
  superadmin: { label: "Super admin", summary: "Everything, always. Sets what the other roles can open." },
  admin: { label: "Admin", summary: "Runs the platform day to day." },
  moderator: { label: "Moderator", summary: "Keeps the community safe: reviews, reports, chats and stories." },
};
const ROLE_TONE: Record<StaffRole, { light: string; dark: string; icon: typeof FaCrown }> = {
  superadmin: { light: "bg-purple-100 text-purple-700", dark: "bg-purple-900/60 text-purple-200", icon: FaCrown },
  admin: { light: "bg-blue-100 text-blue-700", dark: "bg-blue-900/60 text-blue-200", icon: FaUserShield },
  moderator: { light: "bg-teal-100 text-teal-700", dark: "bg-teal-900/60 text-teal-200", icon: FaShieldAlt },
};
const LEVEL_LABEL: Record<AccessLevel, string> = { manage: "Manage", view: "View", none: "No access" };

/** "5 min ago", "3 hours ago", "2 days ago". */
function lastSeen(iso: string | undefined, now: string) {
  if (!iso) return "Never signed in";
  const minutes = Math.round((new Date(now).getTime() - new Date(iso).getTime()) / 60_000);
  if (minutes < 60) return `${Math.max(1, minutes)} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function RoleBadge({ role, isDarkMode }: { role: StaffRole; isDarkMode: boolean }) {
  const tone = ROLE_TONE[role];
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${isDarkMode ? tone.dark : tone.light}`}>
      <tone.icon size={10} /> {ROLE_INFO[role].label}
    </span>
  );
}

interface TeamListProps {
  initialMembers: TeamMember[];
  initialManageable: StaffRole[];
  initialPermissions: Permissions | null;
  teamError?: string;
  now: string;
}

/** Dashboard staff (from the backend), and what each role can open. */
const TeamList = ({ initialMembers, initialManageable, initialPermissions, teamError, now: serverNow }: TeamListProps) => {
  const { isDarkMode } = useSidebar();
  const [members, setMembers] = useState(initialMembers);
  const [manageable, setManageable] = useState(initialManageable);
  const [permissions, setPermissions] = useState(initialPermissions);
  const [error, setError] = useState(teamError ?? "");
  const [now, setNow] = useState(serverNow);
  const [tab, setTab] = useState<"team" | "roles">("team");
  const [role, setRole] = useState<StaffRole | "all" | "suspended">("all");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const closeDrawer = useCallback(() => setEditingId(null), []);
  const editing = editingId === "new" ? "new" : members.find((m) => m._id === editingId) ?? null;

  const muted = isDarkMode ? "text-gray-400" : "text-gray-500";

  /** Reads the team (and counts) again after a change. */
  const reload = async () => {
    const [team, perms] = await Promise.all([getTeam(), getPermissions()]);
    setNow(new Date().toISOString());
    if (team.success && team.data) {
      setMembers(team.data.members);
      setManageable(team.data.manageableRoles);
      setError("");
    } else setError(team.error || "Failed to load the team");
    if (perms.success && perms.data) setPermissions(perms.data);
  };

  /** Runs a change, shows the result, reloads. */
  const run = async (id: string, action: () => Promise<{ success: boolean; message?: string; error?: string }>) => {
    setBusyId(id);
    const result = await action();
    if (result.success) {
      toast.success(result.message || "Saved");
      await reload();
    } else toast.error(result.error || "Something went wrong");
    setBusyId(null);
    return result.success;
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return members
      .filter((m) => (role === "all" ? true : role === "suspended" ? !m.isActive : m.role === role))
      .filter((m) => !q || [m.fullName, m.email ?? "", m.phone ?? ""].some((v) => v.toLowerCase().includes(q)))
      .sort((a, b) => Number(b.isYou) - Number(a.isYou) || ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role) || a.fullName.localeCompare(b.fullName));
  }, [members, role, search]);
  const paged = usePagedList(filtered, 10, `${role}|${search}`);

  const count = (r: StaffRole) => members.filter((m) => m.role === r).length;
  const suspended = members.filter((m) => !m.isActive).length;
  const activeWeek = members.filter((m) => m.lastLoginAt && new Date(now).getTime() - new Date(m.lastLoginAt).getTime() < 7 * 86_400_000).length;
  const statCards: StatCard[] = [
    { label: "Team members", value: members.length, sub: `${activeWeek} signed in this week${suspended ? ` · ${suspended} suspended` : ""}`, icon: FaUsers, tone: "slate" },
    { label: "Super admins", value: count("superadmin"), sub: "Full access", icon: FaCrown, tone: "purple" },
    { label: "Admins", value: count("admin"), sub: "Day-to-day running", icon: FaUserShield, tone: "blue" },
    { label: "Moderators", value: count("moderator"), sub: "Safety and reviews", icon: FaShieldAlt, tone: "teal" },
  ];

  const tabBtn = (value: typeof tab, label: string) => (
    <button
      type="button"
      onClick={() => setTab(value)}
      className={`border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
        tab === value ? (isDarkMode ? "border-white text-white" : "border-black text-black") : `border-transparent ${muted} hover:text-current`
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className={isDarkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}>
      <StatCards cards={statCards} isDarkMode={isDarkMode} />

      {error && (
        <div
          role="alert"
          className={`mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
            isDarkMode ? "border-red-800 bg-red-900/30 text-red-200" : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {error}
          <button type="button" onClick={reload} className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700">
            <FaRedo size={10} /> Try again
          </button>
        </div>
      )}

      <div className={`mb-6 flex gap-6 border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
        {tabBtn("team", "Team")}
        {tabBtn("roles", "Roles and permissions")}
      </div>

      {tab === "team" ? (
        <div className={`rounded-lg shadow-sm border overflow-hidden ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
          <div className={`flex flex-col gap-3 border-b p-4 xl:flex-row xl:items-center xl:justify-between ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative w-full lg:w-[300px]">
                <FaSearch size={13} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name, email or phone"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm ${
                    isDarkMode ? "bg-gray-900 border-gray-700 text-gray-100 placeholder-gray-500" : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>
              <FilterPills
                value={role}
                onChange={setRole}
                isDarkMode={isDarkMode}
                options={[
                  { value: "all", label: "All", count: members.length },
                  { value: "superadmin", label: "Super admins", count: count("superadmin") },
                  { value: "admin", label: "Admins", count: count("admin") },
                  { value: "moderator", label: "Moderators", count: count("moderator") },
                  ...(suspended ? [{ value: "suspended" as const, label: "Suspended", count: suspended }] : []),
                ]}
              />
            </div>
            {manageable.length > 0 && (
              <button
                type="button"
                onClick={() => setEditingId("new")}
                className="flex items-center justify-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white ring-1 ring-white/20 hover:bg-gray-800"
              >
                <FaPlus size={11} /> Add member
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={isDarkMode ? "bg-gray-700" : "bg-gray-50"}>
                <tr>
                  {["Member", "Phone", "Role", "Status", "Last signed in", "Added"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                  <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
                {paged.items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-14 text-center">
                      <FaUsers className={`mx-auto mb-3 text-4xl ${isDarkMode ? "text-gray-600" : "text-gray-300"}`} />
                      <p className="font-medium">No team members match</p>
                    </td>
                  </tr>
                ) : (
                  paged.items.map((m) => {
                    const busy = busyId === m._id;
                    const why = m.isYou ? "You can't change your own account here" : `Your role can't change ${ROLE_INFO[m.role].label.toLowerCase()}s`;
                    return (
                      <tr key={m._id} className={`transition-opacity ${busy ? "opacity-50" : ""} ${!m.isActive ? (isDarkMode ? "bg-gray-900/40" : "bg-gray-50/80") : ""} ${isDarkMode ? "hover:bg-gray-700/50" : "hover:bg-gray-50"}`}>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <span className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold ${isDarkMode ? "bg-gray-700 text-gray-200" : "bg-gray-100 text-gray-700"}`}>
                              {initials(m.fullName)}
                            </span>
                            <div>
                              <div className="flex items-center gap-2 text-sm font-medium">
                                {m.fullName}
                                {m.isYou && <span className="rounded-full bg-black px-2 py-0.5 text-[10px] font-semibold text-white ring-1 ring-white/20">You</span>}
                              </div>
                              <div className={`text-xs ${muted}`}>{m.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className={`px-5 py-4 whitespace-nowrap text-sm ${m.phone ? "" : muted}`}>{m.phone || "—"}</td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <RoleBadge role={m.role} isDarkMode={isDarkMode} />
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          {m.isActive ? (
                            <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${isDarkMode ? "text-green-300" : "text-green-700"}`}>
                              <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Active
                            </span>
                          ) : (
                            <span
                              title={m.suspensionReason}
                              className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${isDarkMode ? "bg-red-900/40 text-red-200" : "bg-red-50 text-red-700"}`}
                            >
                              <FaBan size={9} /> Suspended
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm">
                          <span className="flex items-center gap-2">
                            {m.lastLoginAt && new Date(now).getTime() - new Date(m.lastLoginAt).getTime() < 3_600_000 && (
                              <span className="h-2 w-2 rounded-full bg-green-500" title="Signed in within the last hour" />
                            )}
                            <span className={m.lastLoginAt ? "" : muted}>{lastSeen(m.lastLoginAt, now)}</span>
                          </span>
                        </td>
                        <td className={`px-5 py-4 whitespace-nowrap text-sm ${muted}`}>{formatDate(m.createdAt)}</td>
                        <td className="px-5 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button type="button" disabled={!m.canManage || busy} onClick={() => setEditingId(m._id)} className={actionBtn("amber", isDarkMode)} title={m.canManage ? "Edit" : why}>
                              <FaEdit size={13} />
                            </button>
                            <button
                              type="button"
                              disabled={!m.canManage || busy}
                              onClick={() => run(m._id, () => updateMember(m._id, { isActive: !m.isActive }))}
                              className={actionBtn(m.isActive ? "slate" : "green", isDarkMode)}
                              title={!m.canManage ? why : m.isActive ? "Suspend (can't sign in)" : "Reactivate"}
                              aria-label={m.isActive ? `Suspend ${m.fullName}` : `Reactivate ${m.fullName}`}
                            >
                              {m.isActive ? <FaBan size={12} /> : <FaUserCheck size={13} />}
                            </button>
                            <button
                              type="button"
                              disabled={!m.canManage || busy}
                              onClick={() => run(m._id, () => removeMember(m._id))}
                              className={actionBtn("rose", isDarkMode)}
                              title={m.canManage ? "Remove from team" : why}
                              aria-label={`Remove ${m.fullName}`}
                            >
                              <FaTrashAlt size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <TablePagination {...paged} itemLabel="members" isDarkMode={isDarkMode} onPageChange={paged.setPage} />
        </div>
      ) : permissions ? (
        <RolesMatrix permissions={permissions} isDarkMode={isDarkMode} onSaved={reload} />
      ) : (
        <p className={`rounded-xl border px-4 py-6 text-center text-sm ${muted} ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>Couldn&apos;t load the permissions.</p>
      )}

      <SideDrawer
        open={editing !== null}
        title={editing === "new" ? "Add a team member" : editing ? `Edit ${editing.fullName}` : ""}
        subtitle={editing === "new" ? "They sign in to this dashboard with their email and password." : editing ? editing.email : undefined}
        isDarkMode={isDarkMode}
        onClose={closeDrawer}
      >
        {editing !== null && (
          <MemberForm
            key={editing === "new" ? "new" : editing._id}
            member={editing === "new" ? null : editing}
            allowedRoles={manageable}
            existing={members}
            busy={busyId !== null}
            isDarkMode={isDarkMode}
            onCreate={async (input) => {
              if (await run("new", () => addMember(input))) setEditingId(null);
            }}
            onUpdate={(id, changes) => run(id, () => updateMember(id, changes))}
            onPassword={(id, password) => run(id, () => setMemberPassword(id, password))}
            onRemove={async (id) => {
              if (await run(id, () => removeMember(id))) setEditingId(null);
            }}
          />
        )}
      </SideDrawer>
    </div>
  );
};

interface MemberFormProps {
  member: TeamMember | null;
  allowedRoles: StaffRole[];
  existing: TeamMember[];
  busy: boolean;
  isDarkMode: boolean;
  onCreate: (input: { fullName: string; email: string; phone?: string; role: StaffRole; password: string }) => Promise<void>;
  onUpdate: (id: string, changes: Parameters<typeof updateMember>[1]) => Promise<boolean>;
  onPassword: (id: string, password: string) => Promise<boolean>;
  onRemove: (id: string) => Promise<void>;
}

const makePassword = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  return Array.from(crypto.getRandomValues(new Uint32Array(12)), (v) => chars[v % chars.length]).join("");
};

/** Add or edit: details and role, a new password, suspend, remove. Same checks as the backend. */
function MemberForm({ member, allowedRoles, existing, busy, isDarkMode, onCreate, onUpdate, onPassword, onRemove }: MemberFormProps) {
  const isNew = !member;
  const [fullName, setFullName] = useState(member?.fullName ?? "");
  const [email, setEmail] = useState(member?.email ?? "");
  const [phone, setPhone] = useState(member?.phone ?? "");
  const [role, setRole] = useState<StaffRole>(member?.role ?? allowedRoles[allowedRoles.length - 1] ?? "moderator");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [reason, setReason] = useState("");
  const [tried, setTried] = useState(false);

  const muted = isDarkMode ? "text-gray-400" : "text-gray-500";
  const input = `w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
    isDarkMode ? "border-gray-700 bg-gray-900 text-gray-100 placeholder-gray-500" : "border-gray-300 bg-white placeholder-gray-400"
  }`;
  const label = "mb-1.5 block text-sm font-medium";
  const box = `rounded-xl border p-3 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`;
  const outlineBtn = `flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium disabled:opacity-50 ${
    isDarkMode ? "border-gray-700 text-gray-200 hover:bg-gray-700" : "border-gray-300 text-gray-700 hover:bg-gray-100"
  }`;

  const others = existing.filter((m) => m._id !== member?._id);
  const errors = {
    fullName: !fullName.trim() ? "Full name is required" : "",
    email: !email.trim()
      ? "Email is required for staff accounts"
      : !/^\S+@\S+\.\S+$/.test(email.trim())
        ? "Please enter a valid email address"
        : others.some((m) => m.email?.toLowerCase() === email.trim().toLowerCase())
          ? "Email is already registered"
          : "",
    phone: phone.trim() && !/^\+?[1-9]\d{7,14}$/.test(phone.replace(/\s/g, "")) ? "Please enter a valid phone number, e.g. +447700900123" : "",
    password: isNew && password.length < 6 ? "Password must be at least 6 characters" : "",
  };
  const show = (key: keyof typeof errors) => (tried && errors[key] ? <p className="mt-1 text-xs text-red-500">{errors[key]}</p> : null);

  const submit = async () => {
    setTried(true);
    if (Object.values(errors).some(Boolean)) return;
    const details = { fullName: fullName.trim(), email: email.trim().toLowerCase(), phone: phone.replace(/\s/g, "") };
    if (isNew) {
      await onCreate({ ...details, phone: details.phone || undefined, role, password });
      return;
    }
    const changes: Parameters<typeof updateMember>[1] = {};
    if (details.fullName !== member.fullName) changes.fullName = details.fullName;
    if (details.email !== (member.email ?? "")) changes.email = details.email;
    if (details.phone !== (member.phone ?? "")) changes.phone = details.phone;
    if (role !== member.role) changes.role = role;
    if (Object.keys(changes).length === 0) {
      toast("Nothing to save", { icon: "ℹ️" });
      return;
    }
    await onUpdate(member._id, changes);
  };

  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="tm-name" className={label}>
          Full name
        </label>
        <input id="tm-name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Maya Chowdhury" className={input} />
        {show("fullName")}
      </div>
      <div>
        <label htmlFor="tm-email" className={label}>
          Email <span className={`font-normal ${muted}`}>(used to sign in)</span>
        </label>
        <input id="tm-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@gyneclinics.com" className={input} />
        {show("email")}
      </div>
      <div>
        <label htmlFor="tm-phone" className={label}>
          Phone <span className={`font-normal ${muted}`}>(optional)</span>
        </label>
        <input id="tm-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+447700900123" className={input} />
        {show("phone")}
      </div>

      <fieldset>
        <legend className={label}>Role</legend>
        <div className="space-y-2">
          {ROLE_ORDER.map((r) => {
            const allowed = allowedRoles.includes(r);
            const tone = ROLE_TONE[r];
            return (
              <label
                key={r}
                className={`flex gap-3 rounded-xl border-2 p-3 transition-colors ${allowed ? "cursor-pointer" : "cursor-not-allowed opacity-50"} ${
                  role === r ? (isDarkMode ? "border-white" : "border-black") : isDarkMode ? "border-gray-700" : "border-gray-200"
                }`}
              >
                <input type="radio" name="tm-role" value={r} checked={role === r} disabled={!allowed} onChange={() => setRole(r)} className="mt-1 h-4 w-4 accent-black" />
                <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${isDarkMode ? tone.dark : tone.light}`}>
                  <tone.icon size={13} />
                </span>
                <span>
                  <span className="block text-sm font-medium">{ROLE_INFO[r].label}</span>
                  <span className={`block text-xs ${muted}`}>{allowed ? ROLE_INFO[r].summary : "Your role can't give this role."}</span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {isNew && (
        <div>
          <label htmlFor="tm-password" className={label}>
            Password
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                id="tm-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className={`${input} pr-10`}
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? "Hide password" : "Show password"} className={`absolute right-3 top-1/2 -translate-y-1/2 ${muted}`}>
                {showPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                setPassword(makePassword());
                setShowPassword(true);
              }}
              className={outlineBtn}
            >
              <FaKey size={11} /> Make one
            </button>
          </div>
          {show("password")}
          <p className={`mt-1 text-xs ${muted}`}>Share it with them privately.</p>
        </div>
      )}

      <button
        type="button"
        disabled={busy}
        onClick={submit}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white ring-1 ring-white/20 hover:bg-gray-800 disabled:opacity-50"
      >
        {isNew ? <FaPlus size={11} /> : <FaCheck size={11} />} {busy ? "Saving…" : isNew ? "Add to team" : "Save changes"}
      </button>

      {member && (
        <>
          <div className={box}>
            <p className="text-sm font-medium">New password</p>
            <p className={`mb-2 text-xs ${muted}`}>If they forgot theirs. Share it with them privately.</p>
            <div className="flex gap-2">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                aria-label="New password"
                autoComplete="new-password"
                className={`${input} flex-1`}
              />
              <button
                type="button"
                onClick={() => {
                  setPassword(makePassword());
                  setShowPassword(true);
                }}
                className={outlineBtn}
                title="Make one"
              >
                <FaKey size={11} />
              </button>
            </div>
            <button
              type="button"
              disabled={busy || password.length < 6}
              onClick={async () => {
                if (await onPassword(member._id, password)) setShowPassword(true);
              }}
              className={`${outlineBtn} mt-2 w-full justify-center`}
            >
              <FaLock size={11} /> Set password
            </button>
          </div>

          <div className={box}>
            {member.isActive ? (
              <>
                <p className="text-sm font-medium">Suspend</p>
                <p className={`mb-2 text-xs ${muted}`}>They can&apos;t sign in until reactivated. Nothing is deleted.</p>
                <input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} placeholder="Why (optional, only the team sees it)" aria-label="Suspension reason" className={input} />
                <button type="button" disabled={busy} onClick={() => onUpdate(member._id, { isActive: false, suspensionReason: reason.trim() })} className={`${outlineBtn} mt-2 w-full justify-center`}>
                  <FaBan size={11} /> Suspend {member.fullName.split(" ")[0]}
                </button>
              </>
            ) : (
              <>
                <p className="text-sm font-medium">Suspended</p>
                <p className={`mb-2 text-xs ${muted}`}>{member.suspensionReason || "They can't sign in."}</p>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onUpdate(member._id, { isActive: true })}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  <FaUserCheck size={12} /> Reactivate
                </button>
              </>
            )}
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={() => onRemove(member._id)}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            <FaTrashAlt size={11} /> Remove from team
          </button>
        </>
      )}
    </div>
  );
}

type Matrix = Record<"admin" | "moderator", Record<AreaKey, AccessLevel>>;

/** What each role can open. Super admins edit admins' and moderators' access; it applies right away. */
function RolesMatrix({ permissions, isDarkMode, onSaved }: { permissions: Permissions; isDarkMode: boolean; onSaved: () => Promise<void> }) {
  const saved: Matrix = { admin: permissions.roles.admin, moderator: permissions.roles.moderator };
  const [draft, setDraft] = useState<Matrix>(saved);
  const [saving, setSaving] = useState(false);
  const muted = isDarkMode ? "text-gray-400" : "text-gray-500";
  const { areas, canEdit, counts, canAdd, history } = permissions;
  const changed = (["admin", "moderator"] as const).flatMap((r) => areas.filter((a) => draft[r][a.key] !== saved[r][a.key]).map((a) => ({ role: r, area: a.key })));
  const dirty = changed.length > 0;

  const set = (role: "admin" | "moderator", area: AreaKey, level: AccessLevel) => setDraft((d) => ({ ...d, [role]: { ...d[role], [area]: level } }));
  const save = async () => {
    setSaving(true);
    const roles = { admin: {} as Record<string, AccessLevel>, moderator: {} as Record<string, AccessLevel> };
    for (const c of changed) roles[c.role][c.area] = draft[c.role][c.area];
    const result = await savePermissions(roles);
    setSaving(false);
    if (!result.success) {
      toast.error(result.error || "Failed to save");
      return;
    }
    toast.success(result.message || "Saved");
    await onSaved();
  };

  const pill = (a: AccessLevel) =>
    a === "manage" ? (
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${isDarkMode ? "bg-green-900/50 text-green-200" : "bg-green-50 text-green-700"}`}>
        <FaCheck size={9} /> Manage
      </span>
    ) : a === "view" ? (
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${isDarkMode ? "bg-blue-900/50 text-blue-200" : "bg-blue-50 text-blue-700"}`}>
        <FaEye size={9} /> View
      </span>
    ) : (
      <span className={`text-xs ${isDarkMode ? "text-gray-600" : "text-gray-300"}`} aria-label="No access">
        —
      </span>
    );
  const selectTone = (a: AccessLevel) =>
    a === "manage"
      ? isDarkMode
        ? "border-green-800 bg-green-900/40 text-green-200"
        : "border-green-200 bg-green-50 text-green-700"
      : a === "view"
        ? isDarkMode
          ? "border-blue-800 bg-blue-900/40 text-blue-200"
          : "border-blue-200 bg-blue-50 text-blue-700"
        : isDarkMode
          ? "border-gray-700 bg-gray-900 text-gray-400"
          : "border-gray-200 bg-white text-gray-500";

  return (
    <div className="space-y-6 pb-20">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {ROLE_ORDER.map((r) => {
          const tone = ROLE_TONE[r];
          const adds = canAdd[r] ?? [];
          return (
            <div key={r} className={`rounded-2xl border p-5 shadow-sm ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
              <div className="mb-2 flex items-center gap-3">
                <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${isDarkMode ? tone.dark : tone.light}`}>
                  <tone.icon size={15} />
                </span>
                <div>
                  <p className="font-semibold">{ROLE_INFO[r].label}</p>
                  <p className={`text-xs ${muted}`}>
                    {counts[r] ?? 0} member{counts[r] === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
              <p className={`text-sm ${muted}`}>{ROLE_INFO[r].summary}</p>
              <p className={`mt-3 text-xs ${muted}`}>
                Can add: <span className="font-medium">{adds.length ? adds.map((x) => ROLE_INFO[x].label.toLowerCase() + "s").join(", ") : "nobody"}</span>
              </p>
            </div>
          );
        })}
      </div>

      <div className={`overflow-hidden rounded-2xl border shadow-sm ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={isDarkMode ? "bg-gray-700" : "bg-gray-50"}>
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider">Area</th>
                {ROLE_ORDER.map((r) => (
                  <th key={r} className="px-5 py-3 text-center text-xs font-medium uppercase tracking-wider whitespace-nowrap">
                    {ROLE_INFO[r].label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {areas.flatMap((a, i) => {
                const rows = [];
                if (a.group !== areas[i - 1]?.group) {
                  rows.push(
                    <tr key={`g-${a.group}`} className={isDarkMode ? "bg-gray-900/40" : "bg-gray-50/70"}>
                      <td colSpan={4} className={`px-5 py-2 text-[11px] font-semibold uppercase tracking-wide ${muted}`}>
                        {a.group}
                      </td>
                    </tr>,
                  );
                }
                rows.push(
                  <tr key={a.key} className={`border-t ${isDarkMode ? "border-gray-700" : "border-gray-100"}`}>
                    <td className="px-5 py-3">
                      <p className="text-sm">{a.label}</p>
                      <p className={`text-xs ${muted}`}>{a.levels.includes("manage") ? `Manage: ${a.manage}` : "Read only"}</p>
                    </td>
                    <td className="px-5 py-3 text-center" title="Super admins always have full access">
                      {pill(a.levels.includes("manage") ? "manage" : "view")}
                    </td>
                    {(["admin", "moderator"] as const).map((r) => {
                      const value = draft[r][a.key];
                      const isChanged = value !== saved[r][a.key];
                      return (
                        <td key={r} className="px-5 py-3 text-center">
                          {canEdit ? (
                            <select
                              value={value}
                              onChange={(e) => set(r, a.key, e.target.value as AccessLevel)}
                              aria-label={`${ROLE_INFO[r].label}s: ${a.label}`}
                              className={`rounded-full border px-2.5 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 ${selectTone(value)} ${isChanged ? "ring-2 ring-amber-400" : ""}`}
                            >
                              {a.levels
                                .slice()
                                .reverse()
                                .map((l) => (
                                  <option key={l} value={l}>
                                    {LEVEL_LABEL[l]}
                                  </option>
                                ))}
                            </select>
                          ) : (
                            pill(value)
                          )}
                        </td>
                      );
                    })}
                  </tr>,
                );
                return rows;
              })}
            </tbody>
          </table>
        </div>
        <p className={`flex items-center gap-2 border-t px-5 py-3 text-xs ${muted} ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
          <FaLock size={10} />
          {canEdit
            ? "Super admins always have full access. Changes apply right away: the sidebar, the pages and the server all follow them."
            : "Only a super admin can change these."}
        </p>
      </div>

      <div className={`rounded-2xl border p-5 shadow-sm ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
        <h3 className="mb-3 flex items-center gap-2 font-semibold">
          <FaHistory className={muted} size={14} /> Change history
        </h3>
        {history.length === 0 ? (
          <p className={`text-sm ${muted}`}>No changes yet. The default plan is in use.</p>
        ) : (
          <ol className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
            {history.slice(0, 10).map((h) => (
              <li key={h.at} className="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6">
                <p className={`w-44 shrink-0 text-xs ${muted}`}>
                  {formatDateTime(h.at)}
                  <span className="block">{h.by ?? "Team"}</span>
                </p>
                <ul className="space-y-0.5 text-sm">
                  {h.changes.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        )}
      </div>

      {canEdit && dirty && (
        <div
          className={`fixed bottom-4 left-1/2 z-40 flex w-[min(640px,calc(100%-2rem))] -translate-x-1/2 items-center justify-between gap-3 rounded-2xl border px-5 py-3 shadow-xl ${
            isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
          }`}
        >
          <p className="text-sm font-medium">
            {changed.length} change{changed.length === 1 ? "" : "s"} not saved
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => setDraft(saved)}
              className={`flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-50 ${isDarkMode ? "border-gray-700 text-gray-200 hover:bg-gray-700" : "border-gray-300 text-gray-700 hover:bg-gray-100"}`}
            >
              <FaUndo size={11} /> Undo
            </button>
            <button type="button" disabled={saving} onClick={save} className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white ring-1 ring-white/20 hover:bg-gray-800 disabled:opacity-50">
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeamList;
