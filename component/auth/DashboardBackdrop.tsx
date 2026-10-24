"use client";

import Image from "next/image";
import {
  FaBalanceScale,
  FaBookOpen,
  FaCalendarCheck,
  FaChartLine,
  FaComments,
  FaFlag,
  FaHandHoldingUsd,
  FaMoneyBillWave,
  FaPercent,
  FaPoundSign,
  FaSearch,
  FaStar,
  FaStethoscope,
  FaUserCheck,
  FaUserShield,
  FaUsers,
  FaWallet,
} from "react-icons/fa";
import { IoMdHome, IoMdNotificationsOutline } from "react-icons/io";

/*
 * Decorative, blurred picture of the dashboard overview shown behind the
 * sign-in card. Everything here is made-up sample data; nothing is fetched.
 */

const menu = [
  { icon: IoMdHome, label: "Dashboard", active: true },
  { icon: FaUserShield, label: "Patients" },
  { icon: FaStethoscope, label: "Doctors" },
  { icon: FaCalendarCheck, label: "Consultations" },
  { icon: FaStar, label: "Doctor Reviews" },
  { icon: FaFlag, label: "Reports" },
  { icon: FaBalanceScale, label: "Chat Moderation" },
  { icon: FaComments, label: "Chat Monitoring" },
  { icon: FaMoneyBillWave, label: "Payments" },
  { icon: FaWallet, label: "Payouts" },
  { icon: FaBookOpen, label: "Community Stories" },
  { icon: FaChartLine, label: "Analytics" },
];

const stats = [
  { label: "Revenue this month", value: "£48,250", sub: "+12% vs last month", icon: FaPoundSign, tone: "bg-blue-100 text-blue-600" },
  { label: "Our commission (15%)", value: "£7,238", sub: "+9% vs last month", icon: FaPercent, tone: "bg-emerald-100 text-emerald-600" },
  { label: "Consultations this month", value: "1,284", sub: "312 this week", icon: FaCalendarCheck, tone: "bg-violet-100 text-violet-600" },
  { label: "Patients", value: "9,412", sub: "7,960 active · 418 new", icon: FaUsers, tone: "bg-rose-100 text-rose-600" },
];

const revenue = [
  { m: "Nov", v: 52 }, { m: "Dec", v: 61 }, { m: "Jan", v: 48 }, { m: "Feb", v: 66 },
  { m: "Mar", v: 72 }, { m: "Apr", v: 58 }, { m: "May", v: 79 }, { m: "Jun", v: 84 },
  { m: "Jul", v: 70 }, { m: "Aug", v: 88 }, { m: "Sep", v: 93 }, { m: "Oct", v: 100 },
];

const tasks = [
  { label: "Doctors to verify", value: 6, icon: FaUserCheck, tone: "bg-amber-100 text-amber-600" },
  { label: "Withdrawal requests", value: 4, icon: FaHandHoldingUsd, tone: "bg-emerald-100 text-emerald-600" },
  { label: "Open reports", value: 3, icon: FaFlag, tone: "bg-red-100 text-red-600" },
  { label: "Flagged chat messages", value: 9, icon: FaBalanceScale, tone: "bg-orange-100 text-orange-600" },
  { label: "Reviews on hold", value: 2, icon: FaStar, tone: "bg-yellow-100 text-yellow-600" },
];

const payments = [
  { name: "Sarah Mitchell", doctor: "Dr. Emily Carter", amount: "£120.00", status: "Paid", tone: "bg-green-100 text-green-700" },
  { name: "Olivia Brown", doctor: "Dr. Hannah Lewis", amount: "£85.00", status: "Paid", tone: "bg-green-100 text-green-700" },
  { name: "Amelia Clarke", doctor: "Dr. Rachel Green", amount: "£150.00", status: "Pending", tone: "bg-amber-100 text-amber-700" },
  { name: "Grace Wilson", doctor: "Dr. Emily Carter", amount: "£95.00", status: "Paid", tone: "bg-green-100 text-green-700" },
  { name: "Chloe Taylor", doctor: "Dr. Sophie Hall", amount: "£60.00", status: "Refunded", tone: "bg-gray-100 text-gray-600" },
];

const DashboardBackdrop = () => (
  <div
    aria-hidden="true"
    className="pointer-events-none fixed inset-0 select-none overflow-hidden bg-gray-50"
  >
    {/* The mock screen, blurred and slightly scaled so the blur has no hard edges */}
    <div className="flex h-full w-full scale-105 blur-[5px]">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-gray-200 bg-white lg:flex">
        <div className="flex h-16 items-center justify-center border-b border-gray-200">
          <Image src="/assets/logo/gyneclinics-logo.webp" alt="" width={150} height={51} className="h-auto w-[150px]" />
        </div>
        <nav className="space-y-1 p-3">
          {menu.map(({ icon: Icon, label, active }) => (
            <div
              key={label}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                active ? "bg-brand-primary text-white" : "text-gray-600"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </div>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6">
          <span className="text-lg font-semibold text-gray-900">Dashboard</span>
          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-400 md:flex">
              <FaSearch className="h-3.5 w-3.5" /> Search…
            </div>
            <IoMdNotificationsOutline className="h-6 w-6 text-gray-500" />
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-primary text-sm font-semibold text-white">
              JD
            </span>
          </div>
        </header>

        <main className="flex-1 space-y-6 overflow-hidden p-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Good morning, Admin</h2>
            <p className="text-sm text-gray-500">Here&apos;s what&apos;s happening across Gyneclinics this month.</p>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            {stats.map(({ label, value, sub, icon: Icon, tone }) => (
              <div key={label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{label}</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
                    <p className="mt-1 text-xs text-emerald-600">{sub}</p>
                  </div>
                  <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            {/* Revenue chart */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm xl:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <p className="font-semibold text-gray-900">Revenue — last 12 months</p>
                <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs text-gray-500">GBP</span>
              </div>
              <div className="flex h-56 items-end gap-3 border-b border-gray-100">
                {revenue.map(({ m, v }) => (
                  <div key={m} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                    <div className="w-full rounded-t-md bg-gradient-to-t from-brand-primary to-brand-secondary/70" style={{ height: `${v}%` }} />
                  </div>
                ))}
              </div>
              <div className="mt-2 flex gap-3">
                {revenue.map(({ m }) => (
                  <span key={m} className="flex-1 text-center text-xs text-gray-400">{m}</span>
                ))}
              </div>
            </div>

            {/* Needs attention */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="mb-4 font-semibold text-gray-900">Needs your attention</p>
              <ul className="divide-y divide-gray-100">
                {tasks.map(({ label, value, icon: Icon, tone }) => (
                  <li key={label} className="flex items-center gap-3 py-3">
                    <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${tone}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="flex-1 text-sm font-medium text-gray-700">{label}</span>
                    <span className="text-sm font-bold text-gray-900">{value}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Recent payments */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="mb-4 font-semibold text-gray-900">Recent payments</p>
            <div className="divide-y divide-gray-100">
              {payments.map(({ name, doctor, amount, status, tone }) => (
                <div key={name} className="flex items-center gap-4 py-3 text-sm">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
                    {name.split(" ").map((p) => p[0]).join("")}
                  </span>
                  <span className="flex-1 font-medium text-gray-800">{name}</span>
                  <span className="hidden flex-1 text-gray-500 md:block">{doctor}</span>
                  <span className="w-20 text-right font-semibold text-gray-900">{amount}</span>
                  <span className={`w-20 rounded-full px-2.5 py-1 text-center text-xs font-medium ${tone}`}>{status}</span>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>

    {/* Brand-coloured wash so the page isn't flat white and the card stands out */}
    <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/35 via-white/40 to-brand-accent/25" />
    <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-brand-primary/25 blur-3xl" />
    <div className="absolute -bottom-40 -right-24 h-[28rem] w-[28rem] rounded-full bg-brand-accent/20 blur-3xl" />
  </div>
);

export default DashboardBackdrop;
