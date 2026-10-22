// SAMPLE DATA for the Money pages until payments go live on the backend.
// The rules below are the real ones the backend will follow:
//   - the patient pays the platform;
//   - the platform keeps COMMISSION_RATE, the rest is the doctor's;
//   - the doctor's share clears (like Fiverr) when the consultation's free
//     follow-up ends: SESSION_HOURS + FOLLOW_UP_DAYS after it starts;
//   - cleared money can be withdrawn by bank transfer, at least MIN_WITHDRAWAL.

export const COMMISSION_RATE = 0.2;
export const SESSION_HOURS = 24;
export const FOLLOW_UP_DAYS = 7;
export const MIN_WITHDRAWAL_GBP = 20;

export type PaymentStatus = "clearing" | "cleared" | "refunded";
export type WithdrawalStatus = "requested" | "processing" | "paid" | "rejected";
export type PaymentMethod = "card" | "local" | "wallet";
/** Same regions and multipliers as webapp/lib/locale/regions.ts. */
export type SampleRegion = "europe" | "north_america" | "middle_east" | "south_asia";

export interface SampleDoctor {
  id: string;
  name: string;
  specialization: string;
  feeGBP: number;
  bank: { accountName: string; bankName: string; last4: string };
}

export interface SamplePayment {
  id: string;
  /** Booking reference the patient sees. */
  consultationRef: string;
  patient: string;
  doctor: SampleDoctor;
  /** What the patient paid, converted to GBP. */
  amountGBP: number;
  /** What the patient actually paid. */
  paid: { amount: number; currency: string };
  regionId: SampleRegion;
  method: PaymentMethod;
  methodDetail: string;
  commissionGBP: number;
  doctorShareGBP: number;
  status: PaymentStatus;
  paidAt: string;
  /** When the doctor's share becomes available (follow-up ends). */
  clearsAt: string;
  refundedAt?: string;
  refundReason?: string;
}

export interface SampleWithdrawal {
  id: string;
  doctor: SampleDoctor;
  amountGBP: number;
  status: WithdrawalStatus;
  requestedAt: string;
  paidAt?: string;
  /** Bank transfer reference, once paid. */
  transferRef?: string;
  rejectionReason?: string;
}

export interface DoctorBalance {
  doctor: SampleDoctor;
  /** Earned, waiting for the follow-up to end. */
  clearingGBP: number;
  /** Cleared, not yet withdrawn or requested. */
  availableGBP: number;
  /** Asked for, not yet paid. */
  requestedGBP: number;
  paidOutGBP: number;
  lifetimeGBP: number;
  consultations: number;
}

export const REGION_NAMES: Record<SampleRegion, string> = {
  europe: "Europe & UK",
  north_america: "North America",
  middle_east: "Middle East",
  south_asia: "South Asia",
};
const REGION_MULTIPLIER: Record<SampleRegion, number> = { europe: 1, north_america: 1, middle_east: 0.8, south_asia: 0.25 };
const GBP_TO_USD = 1.3;

export const SAMPLE_DOCTORS: SampleDoctor[] = [
  { id: "d1", name: "Dr Amelia Hart", specialization: "General Gynaecology", feeGBP: 45, bank: { accountName: "Amelia Hart", bankName: "Barclays", last4: "4821" } },
  { id: "d2", name: "Dr Grace Okafor", specialization: "Pregnancy Care", feeGBP: 40, bank: { accountName: "Grace Okafor", bankName: "HSBC UK", last4: "1937" } },
  { id: "d3", name: "Dr Priya Menon", specialization: "Menopause & HRT", feeGBP: 55, bank: { accountName: "Priya Menon", bankName: "Lloyds", last4: "6604" } },
  { id: "d4", name: "Dr Sophie Clarke", specialization: "Urogynaecology & Pelvic Health", feeGBP: 50, bank: { accountName: "Sophie Clarke", bankName: "Monzo", last4: "2290" } },
  { id: "d5", name: "Dr Nadia Rahman", specialization: "Reproductive Medicine", feeGBP: 35, bank: { accountName: "Nadia Rahman", bankName: "Dutch-Bangla Bank", last4: "7713" } },
];

export const SAMPLE_PATIENTS = ["Ayesha K.", "Fatima R.", "Sarah M.", "Nusrat J.", "Emily T.", "Tasnim A.", "Olivia B.", "Rupa D.", "Hannah W.", "Mim S.", "Zara P.", "Lucy C."];

const MS_DAY = 86_400_000;
const round = (n: number) => Math.round(n * 100) / 100;

/** Small seeded random, so the sample looks the same every load. */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1_103_515_245 + 12_345) % 2 ** 31;
    return s / 2 ** 31;
  };
}

const ref = (prefix: string, n: number) => `${prefix}-${(n * 7919 + 104_729).toString(36).toUpperCase().slice(-6).padStart(6, "X")}`;

/** About 70 payments over the last 45 days. */
export function samplePayments(now = new Date()): SamplePayment[] {
  const rand = seeded(42);
  const list: SamplePayment[] = [];
  for (let i = 0; i < 70; i += 1) {
    const doctor = SAMPLE_DOCTORS[Math.floor(rand() * SAMPLE_DOCTORS.length)];
    const paidAt = new Date(now.getTime() - rand() * 45 * MS_DAY);
    const clearsAt = new Date(paidAt.getTime() + SESSION_HOURS * 3_600_000 + FOLLOW_UP_DAYS * MS_DAY);
    const roll = rand();
    // Most patients are in the UK; others pay the regional price in USD (counted here in GBP).
    const regionId: SampleRegion = roll < 0.5 ? "europe" : roll < 0.8 ? "south_asia" : roll < 0.9 ? "middle_east" : "north_america";
    const method: PaymentMethod = regionId === "south_asia" ? (rand() < 0.8 ? "local" : "card") : rand() < 0.75 ? "card" : "wallet";
    const multiplier = REGION_MULTIPLIER[regionId];
    const usd = regionId !== "europe";
    const paidUSD = Math.max(1, Math.round(doctor.feeGBP * GBP_TO_USD * multiplier));
    const amountGBP = usd ? round(paidUSD / GBP_TO_USD) : round(doctor.feeGBP * multiplier);
    const refunded = rand() < 0.06;
    const commissionGBP = refunded ? 0 : round(amountGBP * COMMISSION_RATE);
    list.push({
      id: ref("PAY", i + 1),
      consultationRef: ref("GC", i + 101),
      patient: SAMPLE_PATIENTS[Math.floor(rand() * SAMPLE_PATIENTS.length)],
      doctor,
      amountGBP,
      paid: usd ? { amount: paidUSD, currency: "USD" } : { amount: amountGBP, currency: "GBP" },
      regionId,
      method,
      methodDetail:
        method === "card" ? `Visa •••• ${1000 + Math.floor(rand() * 8999)}` : method === "local" ? `bKash •••• ${100 + Math.floor(rand() * 899)}` : "Apple Pay",
      commissionGBP,
      doctorShareGBP: refunded ? 0 : round(amountGBP - commissionGBP),
      status: refunded ? "refunded" : clearsAt > now ? "clearing" : "cleared",
      paidAt: paidAt.toISOString(),
      clearsAt: clearsAt.toISOString(),
      ...(refunded && {
        refundedAt: new Date(paidAt.getTime() + 13 * 3_600_000).toISOString(),
        refundReason: "No reply within 12 hours",
      }),
    });
  }
  return list.sort((a, b) => b.paidAt.localeCompare(a.paidAt));
}

/** Withdrawal requests: some waiting, some being sent, most paid. */
export function sampleWithdrawals(now = new Date()): SampleWithdrawal[] {
  const day = (n: number) => new Date(now.getTime() - n * MS_DAY).toISOString();
  const [d1, d2, d3, d4, d5] = SAMPLE_DOCTORS;
  return [
    { id: ref("WD", 1), doctor: d3, amountGBP: 176, status: "requested", requestedAt: day(0.2) },
    { id: ref("WD", 2), doctor: d1, amountGBP: 108, status: "requested", requestedAt: day(1.1) },
    { id: ref("WD", 3), doctor: d4, amountGBP: 80, status: "processing", requestedAt: day(2.3) },
    { id: ref("WD", 4), doctor: d2, amountGBP: 96, status: "paid", requestedAt: day(6), paidAt: day(5), transferRef: "BT-20261017-0412" },
    { id: ref("WD", 5), doctor: d5, amountGBP: 42, status: "paid", requestedAt: day(9), paidAt: day(8), transferRef: "BT-20261014-0377" },
    { id: ref("WD", 6), doctor: d1, amountGBP: 144, status: "paid", requestedAt: day(16), paidAt: day(15), transferRef: "BT-20261007-0291" },
    { id: ref("WD", 7), doctor: d3, amountGBP: 15, status: "rejected", requestedAt: day(12), rejectionReason: `Below the £${MIN_WITHDRAWAL_GBP} minimum` },
  ];
}

/** Each doctor's money: clearing, available, requested, paid out. */
export function doctorBalances(payments: SamplePayment[], withdrawals: SampleWithdrawal[]): DoctorBalance[] {
  return SAMPLE_DOCTORS.map((doctor) => {
    const mine = payments.filter((p) => p.doctor.id === doctor.id && p.status !== "refunded");
    const clearingGBP = round(mine.filter((p) => p.status === "clearing").reduce((s, p) => s + p.doctorShareGBP, 0));
    const clearedGBP = round(mine.filter((p) => p.status === "cleared").reduce((s, p) => s + p.doctorShareGBP, 0));
    const w = withdrawals.filter((x) => x.doctor.id === doctor.id);
    const paidOutGBP = round(w.filter((x) => x.status === "paid").reduce((s, x) => s + x.amountGBP, 0));
    const requestedGBP = round(w.filter((x) => x.status === "requested" || x.status === "processing").reduce((s, x) => s + x.amountGBP, 0));
    return {
      doctor,
      clearingGBP,
      availableGBP: Math.max(0, round(clearedGBP - paidOutGBP - requestedGBP)),
      requestedGBP,
      paidOutGBP,
      lifetimeGBP: round(clearingGBP + clearedGBP),
      consultations: mine.length,
    };
  }).sort((a, b) => b.lifetimeGBP - a.lifetimeGBP);
}

/** Money taken per day, for the last `days` days (oldest first). */
export function dailyRevenue(payments: SamplePayment[], now = new Date(), days = 30) {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1));
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(start.getTime() + i * MS_DAY);
    const key = date.toDateString();
    const dayPayments = payments.filter((p) => p.status !== "refunded" && new Date(p.paidAt).toDateString() === key);
    return {
      // Midday, so the day reads the same in any time zone.
      date: new Date(date.getTime() + 12 * 3_600_000).toISOString(),
      revenueGBP: round(dayPayments.reduce((s, p) => s + p.amountGBP, 0)),
      commissionGBP: round(dayPayments.reduce((s, p) => s + p.commissionGBP, 0)),
      consultations: dayPayments.length,
    };
  });
}

export const gbp = (n: number) => `£${n.toLocaleString("en-GB", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
