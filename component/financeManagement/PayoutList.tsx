"use client";
import {
  getBalances,
  getWithdrawalsPage,
  rejectWithdrawal,
  sendWithStripe,
  type BalanceRow,
  type StripeStatus,
  type WithdrawalPageResponse,
  type WithdrawalPagination,
  type WithdrawalRecord,
  type WithdrawalStats,
  type WithdrawalStatus,
} from "@/app/actions/payoutAction";
import SideDrawer from "@/component/shared/SideDrawer";
import StatCards, { type StatCard } from "@/component/shared/StatCards";
import TablePagination from "@/component/shared/TablePagination";
import { actionBtn, DetailRows, FilterPills, formatDate, formatDateTime, initials, relativeDays, StatusPill } from "@/component/shared/ui";
import { usePagedList } from "@/component/shared/usePagedList";
import { useSidebar } from "@/lib/SidebarContext";
import Link from "next/link";
import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { FaCopy, FaExternalLinkAlt, FaEye, FaHandHoldingUsd, FaPaperPlane, FaRedo, FaSearch, FaStripeS, FaTimes, FaUniversity, FaWallet } from "react-icons/fa";
import { WITHDRAWAL_STATUS } from "./financeMeta";
import { MoneyRowsSkeleton } from "./FinanceSkeletons";

const PAGE_SIZE = 10;
const gbp = (n: number) => `£${n.toLocaleString("en-GB", { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })}`;
const doctorName = (w: WithdrawalRecord) => w.doctor?.user?.fullName || "Doctor removed";
const open = (w: WithdrawalRecord) => w.status === "requested" || w.status === "processing";

const STRIPE_STATE: Record<StripeStatus["status"], { label: string; hint: string; className: { light: string; dark: string } }> = {
  ready: { label: "Stripe ready", hint: "Can be paid now", className: { light: "bg-green-50 text-green-700 border-green-200", dark: "bg-green-900/40 text-green-200 border-green-800" } },
  review: { label: "Needs details", hint: "Stripe needs more from the doctor", className: { light: "bg-amber-50 text-amber-700 border-amber-200", dark: "bg-amber-900/40 text-amber-200 border-amber-800" } },
  incomplete: { label: "Not finished", hint: "The doctor didn't finish Stripe's form", className: { light: "bg-amber-50 text-amber-700 border-amber-200", dark: "bg-amber-900/40 text-amber-200 border-amber-800" } },
  not_connected: { label: "No Stripe", hint: "The doctor hasn't set up Stripe", className: { light: "bg-gray-100 text-gray-600 border-gray-200", dark: "bg-gray-700 text-gray-300 border-gray-600" } },
};

/** "Stripe ready" / "Needs details" / … */
function StripePill({ status, isDarkMode }: { status: StripeStatus; isDarkMode: boolean }) {
  const s = STRIPE_STATE[status.status];
  return (
    <span title={s.hint} className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${isDarkMode ? s.className.dark : s.className.light}`}>
      <FaStripeS size={9} /> {s.label}
    </span>
  );
}

interface PayoutListProps {
  initial: WithdrawalPageResponse;
  initialBalances: BalanceRow[];
  balancesError?: string;
  now: string;
  /** Super admins send money; admins can only look. */
  canManage: boolean;
}

/** Withdrawal requests (sent with Stripe Connect) and every doctor's balance. */
const PayoutList = ({ initial, initialBalances, balancesError, now: serverNow, canManage }: PayoutListProps) => {
  const { isDarkMode } = useSidebar();
  const [items, setItems] = useState<WithdrawalRecord[]>(initial.data ?? []);
  const [pagination, setPagination] = useState<WithdrawalPagination>(initial.pagination ?? { total: 0, page: 1, limit: PAGE_SIZE, pages: 1 });
  const [stats, setStats] = useState<WithdrawalStats | undefined>(initial.stats);
  const [balances, setBalances] = useState(initialBalances);
  const [error, setError] = useState(initial.success ? "" : initial.error || "Failed to fetch withdrawals");
  const [now, setNow] = useState(serverNow);
  const [tab, setTab] = useState<"requests" | "balances">("requests");
  const [query, setQuery] = useState<{ status: WithdrawalStatus | "todo" | "all"; search: string }>({ status: "todo", search: "" });
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedCache, setSelectedCache] = useState<WithdrawalRecord | null>(null);
  const closeDrawer = useCallback(() => setSelectedId(null), []);
  const selected = items.find((w) => w._id === selectedId) ?? (selectedCache?._id === selectedId ? selectedCache : null);
  const pagedBalances = usePagedList(balances, 10);

  const muted = isDarkMode ? "text-gray-400" : "text-gray-500";
  const panel = `rounded-lg shadow-sm border overflow-hidden ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`;

  /** Reads requests (and balances) through the server actions. `quiet` skips the skeleton. */
  const load = async (page: number, changes: Partial<typeof query> = {}, quiet = false) => {
    const next = { ...query, ...changes };
    setQuery(next);
    if (!quiet) setLoading(true);
    const [response, bal] = await Promise.all([getWithdrawalsPage({ ...next, page, limit: PAGE_SIZE }), quiet ? getBalances() : Promise.resolve(null)]);
    setLoading(false);
    setNow(new Date().toISOString());
    if (bal?.success && bal.data) setBalances(bal.data);
    if (!response.success) {
      setError(response.error || "Failed to fetch withdrawals");
      return null;
    }
    setError("");
    setItems(response.data ?? []);
    if (response.pagination) setPagination(response.pagination);
    if (response.stats) setStats(response.stats);
    return response.data ?? [];
  };

  const act = async (w: WithdrawalRecord, run: () => Promise<{ success: boolean; message?: string; error?: string }>, patch: Partial<WithdrawalRecord>) => {
    setBusyId(w._id);
    const result = await run();
    if (result.success) {
      toast.success(result.message || "Updated");
      const list = await load(pagination.page, {}, true);
      setSelectedCache(list?.find((x) => x._id === w._id) ?? { ...w, ...patch });
    } else toast.error(result.error || "Failed to update");
    setBusyId(null);
    return result.success;
  };

  const stripeBalance = stats?.stripeAvailableGBP;
  const statCards: StatCard[] = [
    { label: "Waiting to send", value: gbp(stats?.requested.sumGBP ?? 0), sub: `${stats?.requested.count ?? 0} request${stats?.requested.count === 1 ? "" : "s"}`, icon: FaHandHoldingUsd, tone: "amber" },
    {
      label: "Stripe balance",
      value: stripeBalance == null ? "—" : gbp(stripeBalance),
      sub: stripeBalance == null ? "Couldn't reach Stripe" : stripeBalance < (stats?.requested.sumGBP ?? 0) ? "Not enough for every request" : "Available to send now",
      icon: FaStripeS,
      tone: "blue",
    },
    { label: "Sent", value: gbp(stats?.paid.sumGBP ?? 0), sub: `${stats?.paid.count ?? 0} Stripe transfer${stats?.paid.count === 1 ? "" : "s"}`, icon: FaUniversity, tone: "green" },
    { label: "Available to doctors", value: gbp(stats?.availableGBP ?? 0), sub: "Cleared, not asked for yet", icon: FaWallet, tone: "violet" },
  ];

  const tabBtn = (value: typeof tab, label: string, badge?: number) => (
    <button
      type="button"
      onClick={() => setTab(value)}
      className={`flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
        tab === value ? (isDarkMode ? "border-white text-white" : "border-black text-black") : `border-transparent ${muted} hover:text-current`
      }`}
    >
      {label}
      {badge ? <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-semibold text-white">{badge}</span> : null}
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
          <button type="button" onClick={() => load(pagination.page)} className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700">
            <FaRedo size={10} /> Try again
          </button>
        </div>
      )}

      <div className={`mb-4 flex gap-6 border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
        {tabBtn("requests", "Withdrawal requests", stats?.requested.count)}
        {tabBtn("balances", "Doctor balances")}
      </div>

      {tab === "requests" ? (
        <div className={panel}>
          <div className={`flex flex-col gap-3 border-b p-4 xl:flex-row xl:items-center xl:justify-between ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
            <FilterPills
              value={query.status}
              onChange={(status) => load(1, { status })}
              isDarkMode={isDarkMode}
              options={[
                { value: "todo", label: "To send", count: stats?.requested.count },
                { value: "paid", label: "Sent", count: stats?.paid.count },
                { value: "rejected", label: "Rejected", count: stats?.rejected.count },
                { value: "all", label: "All" },
              ]}
            />
            <form
              onSubmit={(e) => {
                e.preventDefault();
                load(1, { search: searchText });
              }}
              className="relative w-full xl:w-[300px]"
            >
              <button type="submit" aria-label="Search" className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                <FaSearch size={13} />
              </button>
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search doctor, account or Stripe transfer"
                className={`w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm ${
                  isDarkMode ? "bg-gray-900 border-gray-700 text-gray-100 placeholder-gray-500" : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
            </form>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full" aria-busy={loading}>
              <thead className={isDarkMode ? "bg-gray-700" : "bg-gray-50"}>
                <tr>
                  {["Doctor", "Paid to", "Amount", "Requested", "Status"].map((h) => (
                    <th key={h} className={`px-5 py-3 text-xs font-medium uppercase tracking-wider whitespace-nowrap ${h === "Amount" ? "text-right" : "text-left"}`}>
                      {h}
                    </th>
                  ))}
                  <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
                {loading ? (
                  <MoneyRowsSkeleton cols={6} rows={Math.min(PAGE_SIZE, Math.max(3, items.length))} />
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-14 text-center">
                      <FaHandHoldingUsd className={`mx-auto mb-3 text-4xl ${isDarkMode ? "text-gray-600" : "text-gray-300"}`} />
                      <p className="font-medium">{query.status === "todo" ? "Nothing to send right now" : "No requests here"}</p>
                      <p className={`mt-1 text-sm ${muted}`}>Doctors ask to withdraw from Earnings in their app; you send it here with Stripe.</p>
                    </td>
                  </tr>
                ) : (
                  items.map((w) => {
                    const busy = busyId === w._id;
                    return (
                      <tr
                        key={w._id}
                        className={`transition-opacity ${busy ? "opacity-50" : ""} ${w.status === "requested" ? (isDarkMode ? "bg-amber-900/10" : "bg-amber-50/40") : ""} ${
                          isDarkMode ? "hover:bg-gray-700/50" : "hover:bg-gray-50"
                        }`}
                      >
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${isDarkMode ? "bg-gray-700 text-gray-200" : "bg-gray-100 text-gray-700"}`}>
                              {initials(doctorName(w))}
                            </span>
                            <div>
                              <button type="button" onClick={() => setSelectedId(w._id)} className="text-sm font-medium hover:underline">
                                {doctorName(w)}
                              </button>
                              <div className={`text-xs ${muted}`}>{w.doctor?.specialization}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm">
                          <div>{w.destination}</div>
                          {open(w) && (
                            <div className="mt-1">
                              <StripePill status={w.stripe} isDarkMode={isDarkMode} />
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-right text-sm font-semibold tabular-nums">{gbp(w.amountGBP)}</td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm">
                          {formatDate(w.createdAt)}
                          <div className={`text-xs ${muted}`}>{relativeDays(w.createdAt, now)}</div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <StatusPill tone={WITHDRAWAL_STATUS[w.status]} isDarkMode={isDarkMode} />
                          {w.transferRef && <div className={`mt-1 max-w-[180px] truncate font-mono text-[11px] ${muted}`}>{w.transferRef}</div>}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            {canManage && open(w) && w.stripe.status === "ready" && (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => act(w, () => sendWithStripe(w._id), { status: "paid", paidAt: new Date().toISOString() })}
                                className={actionBtn("green", isDarkMode)}
                                title={`Send ${gbp(w.amountGBP)} with Stripe`}
                                aria-label={`Send ${gbp(w.amountGBP)} to ${doctorName(w)} with Stripe`}
                              >
                                <FaPaperPlane size={12} />
                              </button>
                            )}
                            <button type="button" onClick={() => setSelectedId(w._id)} className={actionBtn("blue", isDarkMode)} title="Open request">
                              <FaEye size={14} />
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
          <TablePagination
            page={pagination.page}
            pages={pagination.pages}
            limit={pagination.limit}
            total={pagination.total}
            itemLabel="requests"
            isDarkMode={isDarkMode}
            disabled={loading}
            onPageChange={(page) => load(page)}
          />
        </div>
      ) : (
        <div className={panel}>
          {balancesError && <p className="border-b px-5 py-3 text-sm text-red-500">{balancesError}</p>}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={isDarkMode ? "bg-gray-700" : "bg-gray-50"}>
                <tr>
                  {["Doctor", "Paid consultations", "Clearing", "Available", "Requested", "Paid out", "Total earned"].map((h) => (
                    <th key={h} className={`px-5 py-3 text-xs font-medium uppercase tracking-wider whitespace-nowrap ${h === "Doctor" ? "text-left" : "text-right"}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
                {pagedBalances.items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className={`px-6 py-14 text-center text-sm ${muted}`}>
                      No doctor has earnings yet.
                    </td>
                  </tr>
                ) : (
                  pagedBalances.items.map((b) => (
                    <tr key={b.doctor._id} className={isDarkMode ? "hover:bg-gray-700/50" : "hover:bg-gray-50"}>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <Link href={`/doctors/${b.doctor._id}`} className="text-sm font-medium hover:underline">
                          {b.doctor.name}
                        </Link>
                        <div className={`mt-0.5 flex items-center gap-2 text-xs ${muted}`}>
                          <StripePill status={b.stripe} isDarkMode={isDarkMode} />
                          {b.stripe.destination}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right text-sm tabular-nums">{b.consultations}</td>
                      <td className={`px-5 py-4 text-right text-sm tabular-nums ${isDarkMode ? "text-amber-300" : "text-amber-700"}`}>{gbp(b.clearingGBP)}</td>
                      <td className={`px-5 py-4 text-right text-sm font-semibold tabular-nums ${isDarkMode ? "text-green-300" : "text-green-700"}`}>{gbp(b.availableGBP)}</td>
                      <td className="px-5 py-4 text-right text-sm tabular-nums">{gbp(b.requestedGBP)}</td>
                      <td className={`px-5 py-4 text-right text-sm tabular-nums ${muted}`}>{gbp(b.paidOutGBP)}</td>
                      <td className="px-5 py-4 text-right text-sm font-semibold tabular-nums">{gbp(b.lifetimeGBP)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <TablePagination {...pagedBalances} itemLabel="doctors" isDarkMode={isDarkMode} onPageChange={pagedBalances.setPage} />
          <p className={`border-t px-5 py-3 text-xs ${muted} ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
            In pounds. Clearing = waiting for the 7-day follow-up to end. Available = the doctor can ask to withdraw it (at least £{stats?.minWithdrawalGBP ?? 20}), once their Stripe account is ready.
          </p>
        </div>
      )}

      <WithdrawalDrawer
        withdrawal={selected}
        busy={busyId === selected?._id}
        now={now}
        canManage={canManage}
        isDarkMode={isDarkMode}
        onClose={closeDrawer}
        stripeBalance={stripeBalance ?? null}
        onSend={(w) => act(w, () => sendWithStripe(w._id), { status: "paid", paidAt: new Date().toISOString() })}
        onReject={(w, reason) => act(w, () => rejectWithdrawal(w._id, reason), { status: "rejected", rejectionReason: reason })}
      />
    </div>
  );
};

interface WithdrawalDrawerProps {
  withdrawal: WithdrawalRecord | null;
  busy: boolean;
  now: string;
  canManage: boolean;
  isDarkMode: boolean;
  stripeBalance: number | null;
  onClose: () => void;
  onSend: (w: WithdrawalRecord) => Promise<boolean>;
  onReject: (w: WithdrawalRecord, reason: string) => Promise<boolean>;
}

/** One request: where Stripe pays the doctor, then send it with Stripe or reject. */
function WithdrawalDrawer({ withdrawal: w, busy, now, canManage, isDarkMode, stripeBalance, onClose, onSend, onReject }: WithdrawalDrawerProps) {
  const [reason, setReason] = useState("");
  const muted = isDarkMode ? "text-gray-400" : "text-gray-500";
  const box = `rounded-xl border p-4 ${isDarkMode ? "border-gray-700 bg-gray-900/40" : "border-gray-200 bg-gray-50"}`;
  const input = `w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
    isDarkMode ? "border-gray-700 bg-gray-900 text-gray-100" : "border-gray-300 bg-white"
  }`;
  const isOpen = w && open(w);
  const ready = w?.stripe.status === "ready";
  const lowBalance = w && stripeBalance != null && stripeBalance < w.amountGBP;
  const copy = (text: string) => navigator.clipboard?.writeText(text).then(() => toast.success("Copied"), () => undefined);

  return (
    <SideDrawer open={Boolean(w)} title={w ? (w.doctor?.user?.fullName ?? "Doctor") : "Withdrawal"} subtitle={w ? `Asked ${formatDateTime(w.createdAt)}` : undefined} isDarkMode={isDarkMode} onClose={onClose}>
      {w && (
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <StatusPill tone={WITHDRAWAL_STATUS[w.status]} isDarkMode={isDarkMode} />
            <span className={`text-right text-xs ${muted}`}>{WITHDRAWAL_STATUS[w.status].hint}</span>
          </div>

          <div className="text-center">
            <p className={`text-sm ${muted}`}>{w.status === "paid" ? "Sent" : "Amount to send"}</p>
            <p className="text-4xl font-bold tabular-nums">{gbp(w.amountGBP)}</p>
            <p className={`text-xs ${muted}`}>
              Requested {formatDateTime(w.createdAt)} · {relativeDays(w.createdAt, now)}
            </p>
          </div>

          <section className={box}>
            <h3 className={`mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide ${muted}`}>
              <FaStripeS /> Paid through Stripe Connect
            </h3>
            <DetailRows
              isDarkMode={isDarkMode}
              rows={[
                ["Stripe pays it into", w.stripe.destination ?? w.destination],
                ["Doctor's Stripe", <StripePill key="s" status={w.stripe} isDarkMode={isDarkMode} />],
                ...(w.bank
                  ? ([
                      ["Old bank details", `${w.bank.accountName} · ${w.bank.bankName}`],
                      [
                        "Account number",
                        <span key="a" className="inline-flex items-center gap-2">
                          <span className="font-mono">{w.bank.iban || w.bank.accountNumber}</span>
                          <button type="button" onClick={() => copy(w.bank!.iban || w.bank!.accountNumber)} aria-label="Copy account number" className={`${muted} hover:text-current`}>
                            <FaCopy size={11} />
                          </button>
                        </span>,
                      ],
                    ] as [string, React.ReactNode][])
                  : []),
              ]}
            />
            {isOpen && !ready && (
              <p className={`mt-3 text-xs ${isDarkMode ? "text-amber-300" : "text-amber-700"}`}>
                {STRIPE_STATE[w.stripe.status].hint}. It can be sent once their Stripe account is ready.
              </p>
            )}
          </section>

          {w.status === "paid" && (
            <section className={box}>
              <DetailRows
                isDarkMode={isDarkMode}
                rows={[
                  ["Sent", formatDateTime(w.paidAt)],
                  [
                    "Stripe transfer",
                    w.stripeTransferUrl ? (
                      <a key="t" href={w.stripeTransferUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-mono text-blue-600 hover:underline">
                        {w.transferRef} <FaExternalLinkAlt size={10} />
                      </a>
                    ) : (
                      <span key="t" className="font-mono">{w.transferRef}</span>
                    ),
                  ],
                  ["By", w.handledBy?.fullName ?? "Team"],
                ]}
              />
            </section>
          )}
          {w.status === "rejected" && (
            <section className={`rounded-xl border p-4 text-sm ${isDarkMode ? "border-red-800 bg-red-900/30 text-red-200" : "border-red-200 bg-red-50 text-red-700"}`}>
              <span className="font-medium">Reason:</span> {w.rejectionReason}
              <p className="mt-1 text-xs opacity-80">The amount went back to the doctor&apos;s available balance.</p>
            </section>
          )}

          {isOpen &&
            (canManage ? (
              <section className="space-y-3">
                <div className="space-y-2">
                  <button
                    type="button"
                    disabled={busy || !ready}
                    onClick={() => onSend(w)}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white ring-1 ring-white/20 hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <FaPaperPlane size={12} /> {busy ? "Sending…" : `Send ${gbp(w.amountGBP)} with Stripe`}
                  </button>
                  <p className={`text-xs ${lowBalance ? (isDarkMode ? "text-amber-300" : "text-amber-700") : muted}`}>
                    {lowBalance
                      ? `Your Stripe balance (${gbp(stripeBalance!)}) is lower than this. Stripe will refuse it until more payments become available.`
                      : "Moves the money from our Stripe balance to the doctor's Stripe account. Stripe then pays it into their bank or card."}
                  </p>
                </div>
                <div className={`rounded-lg border p-3 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                  <label htmlFor="reject-reason" className={`mb-1.5 block text-xs font-medium ${muted}`}>
                    Reason, if you reject (the doctor sees it)
                  </label>
                  <textarea
                    id="reject-reason"
                    rows={2}
                    value={reason}
                    maxLength={300}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g. We're checking a refund on one of these consultations."
                    className={`${input} mb-2 resize-y`}
                  />
                  <button
                    type="button"
                    disabled={busy}
                    onClick={async () => {
                      if (reason.trim().length < 3) {
                        toast.error("Say why, so the doctor knows");
                        return;
                      }
                      if (await onReject(w, reason.trim())) setReason("");
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    <FaTimes size={12} /> Reject
                  </button>
                </div>
              </section>
            ) : (
              <p className={`text-xs ${muted}`}>Your role can view payouts but not send them.</p>
            ))}
        </div>
      )}
    </SideDrawer>
  );
}

export default PayoutList;
