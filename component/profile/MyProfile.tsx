"use client";
import type { MyAccount } from "@/app/actions/account";
import { formatDate, formatDateTime, initials } from "@/component/shared/ui";
import type { Area, StaffRole } from "@/app/actions/teamAction";
import type { AccessLevel, AreaKey } from "@/lib/access";
import { useSidebar } from "@/lib/SidebarContext";
import { FaCheckCircle, FaCrown, FaEnvelope, FaEye, FaInfoCircle, FaPhoneAlt, FaShieldAlt, FaUserShield } from "react-icons/fa";

const ROLE_STYLE: Record<StaffRole, { icon: typeof FaCrown; light: string; dark: string; banner: string }> = {
  superadmin: { icon: FaCrown, light: "bg-purple-100 text-purple-700", dark: "bg-purple-900/60 text-purple-200", banner: "from-purple-500 to-pink-500" },
  admin: { icon: FaUserShield, light: "bg-blue-100 text-blue-700", dark: "bg-blue-900/60 text-blue-200", banner: "from-blue-500 to-indigo-500" },
  moderator: { icon: FaShieldAlt, light: "bg-teal-100 text-teal-700", dark: "bg-teal-900/60 text-teal-200", banner: "from-teal-500 to-emerald-500" },
};

const ROLE_INFO: Record<StaffRole, { label: string; summary: string }> = {
  superadmin: { label: "Super admin", summary: "Everything, always. Sets what the other roles can open." },
  admin: { label: "Admin", summary: "Runs the platform day to day." },
  moderator: { label: "Moderator", summary: "Keeps the community safe: reviews, reports, chats and stories." },
};

const isStaffRole = (role: string): role is StaffRole => role in ROLE_INFO;

/** Your own account, read only, and what your role can open (from Team & Roles). */
const MyProfile = ({
  account,
  error,
  areas = [],
  mine = {},
}: {
  account: MyAccount;
  error?: string;
  areas?: Area[];
  mine?: Partial<Record<AreaKey, AccessLevel>>;
}) => {
  const { isDarkMode } = useSidebar();
  const muted = isDarkMode ? "text-gray-400" : "text-gray-500";
  const card = `rounded-2xl border shadow-sm ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`;
  const role = isStaffRole(account.role) ? account.role : null;
  const style = role ? ROLE_STYLE[role] : null;

  const verified = (ok: boolean) =>
    ok ? (
      <span className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-green-600">
        <FaCheckCircle size={10} /> Verified
      </span>
    ) : null;

  const rows: [string, React.ReactNode][] = [
    ["Full name", account.fullName],
    [
      "Email",
      account.email ? (
        <>
          {account.email}
          {verified(account.emailVerified)}
        </>
      ) : (
        <span className={muted}>Not added</span>
      ),
    ],
    [
      "Phone",
      account.phone ? (
        <>
          {account.phone}
          {verified(account.phoneVerified)}
        </>
      ) : (
        <span className={muted}>Not added</span>
      ),
    ],
    ["Role", role ? ROLE_INFO[role].label : account.role],
    ["Member since", account.createdAt ? formatDate(account.createdAt) : "—"],
    ["Last signed in", account.lastLoginAt ? formatDateTime(account.lastLoginAt) : "—"],
  ];

  const manage = areas.filter((a) => mine[a.key] === "manage");
  const view = areas.filter((a) => mine[a.key] === "view");

  return (
    <div className={`mx-auto max-w-4xl space-y-6 ${isDarkMode ? "text-gray-100" : "text-gray-900"}`}>
      {error && (
        <p className={`rounded-xl border px-4 py-3 text-sm ${isDarkMode ? "border-amber-800 bg-amber-900/30 text-amber-200" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
          {error}. Showing the details saved when you signed in.
        </p>
      )}

      {/* Header */}
      <section className={`${card} overflow-hidden`}>
        <div className={`h-24 bg-gradient-to-r ${style?.banner ?? "from-gray-500 to-gray-700"}`} />
        <div className="flex flex-col gap-4 px-6 pb-6 sm:flex-row sm:items-end">
          {account.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={account.avatar} alt="" className={`-mt-12 h-24 w-24 rounded-2xl border-4 object-cover ${isDarkMode ? "border-gray-800" : "border-white"}`} />
          ) : (
            <span
              className={`-mt-12 inline-flex h-24 w-24 items-center justify-center rounded-2xl border-4 text-2xl font-bold ${
                isDarkMode ? "border-gray-800 bg-gray-700 text-gray-100" : "border-white bg-gray-100 text-gray-700"
              }`}
            >
              {initials(account.fullName)}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-2xl font-bold">{account.fullName}</h1>
            <div className={`mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm ${muted}`}>
              {account.email && (
                <span className="flex items-center gap-1.5">
                  <FaEnvelope size={11} /> {account.email}
                </span>
              )}
              {account.phone && (
                <span className="flex items-center gap-1.5">
                  <FaPhoneAlt size={11} /> {account.phone}
                </span>
              )}
            </div>
          </div>
          {role && style && (
            <span className={`inline-flex items-center gap-1.5 self-start rounded-full px-3 py-1 text-sm font-medium sm:self-center ${isDarkMode ? style.dark : style.light}`}>
              <style.icon size={12} /> {ROLE_INFO[role].label}
            </span>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Details */}
        <section className={`${card} p-6 lg:col-span-3`}>
          <h2 className="mb-4 font-semibold">Account details</h2>
          <dl className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-100"}`}>
            {rows.map(([label, value]) => (
              <div key={label} className="grid grid-cols-3 gap-4 py-3 text-sm">
                <dt className={muted}>{label}</dt>
                <dd className="col-span-2 font-medium break-words">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Access */}
        <section className={`${card} p-6 lg:col-span-2`}>
          <h2 className="font-semibold">What you can do</h2>
          <p className={`mb-4 text-sm ${muted}`}>{role ? ROLE_INFO[role].summary : "Your role decides what you can open."}</p>
          {manage.length > 0 && (
            <>
              <p className={`mb-2 text-xs font-semibold uppercase tracking-wide ${muted}`}>Manage</p>
              <div className="mb-4 flex flex-wrap gap-1.5">
                {manage.map((p) => (
                  <span key={p.key} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ${isDarkMode ? "bg-green-900/50 text-green-200" : "bg-green-50 text-green-700"}`}>
                    <FaCheckCircle size={9} /> {p.label}
                  </span>
                ))}
              </div>
            </>
          )}
          {view.length > 0 && (
            <>
              <p className={`mb-2 text-xs font-semibold uppercase tracking-wide ${muted}`}>View only</p>
              <div className="flex flex-wrap gap-1.5">
                {view.map((p) => (
                  <span key={p.key} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ${isDarkMode ? "bg-blue-900/50 text-blue-200" : "bg-blue-50 text-blue-700"}`}>
                    <FaEye size={9} /> {p.label}
                  </span>
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      <p className={`flex items-start gap-2 text-sm ${muted}`}>
        <FaInfoCircle className="mt-0.5 shrink-0" />
        This page is for viewing only. If something is wrong, or you need a new password, ask a super admin.
      </p>
    </div>
  );
};

export default MyProfile;
