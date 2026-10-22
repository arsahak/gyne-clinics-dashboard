// SAMPLE DATA for /doctor-analytics until the backend records these numbers.
import { COMMISSION_RATE, SAMPLE_DOCTORS, type SampleDoctor } from "./finance";

const DAY = 86_400_000;

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1_103_515_245 + 12_345) % 2 ** 31;
    return s / 2 ** 31;
  };
}

export interface DailyPoint {
  date: string;
  appOpens: number;
  signUps: number;
  consultations: number;
  revenueGBP: number;
}

export interface DoctorPerformance {
  doctor: SampleDoctor;
  consultations: number;
  rating: number;
  reviews: number;
  /** Median minutes to the first reply. */
  firstReplyMinutes: number;
  /** Consultations finished without a refund. */
  completionRate: number;
  repeatPatients: number;
  revenueGBP: number;
}

export interface AnalyticsSample {
  daily: DailyPoint[];
  regions: { name: string; patients: number }[];
  topics: { name: string; consultations: number }[];
  hours: { hour: number; messages: number }[];
  doctors: DoctorPerformance[];
}

/** 90 days of numbers, growing slowly, quieter at weekends. */
export function sampleAnalytics(now = new Date()): AnalyticsSample {
  const rand = seeded(5);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const daily: DailyPoint[] = Array.from({ length: 90 }, (_, i) => {
    // Midday, so the day reads the same in any time zone.
    const date = new Date(today.getTime() - (89 - i) * DAY + 12 * 3_600_000);
    const weekend = date.getDay() === 0 || date.getDay() === 6;
    const growth = 1 + i / 90;
    const appOpens = Math.round((260 + rand() * 120) * growth * (weekend ? 0.8 : 1));
    const signUps = Math.round(appOpens * (0.035 + rand() * 0.02));
    const consultations = Math.max(0, Math.round((1 + rand() * 3.2) * growth * (weekend ? 0.7 : 1)));
    return {
      date: date.toISOString(),
      appOpens,
      signUps,
      consultations,
      revenueGBP: Math.round(consultations * (26 + rand() * 14) * 100) / 100,
    };
  });

  const doctors = SAMPLE_DOCTORS.map((doctor, i) => {
    const consultations = [52, 47, 39, 33, 28][i];
    const revenueGBP = Math.round(consultations * doctor.feeGBP * 0.72);
    return {
      doctor,
      consultations,
      rating: [4.9, 4.8, 4.6, 4.4, 4.7][i],
      reviews: Math.round(consultations * 0.6),
      firstReplyMinutes: [12, 18, 27, 64, 22][i],
      completionRate: [0.98, 0.97, 0.95, 0.88, 0.96][i],
      repeatPatients: [14, 11, 9, 4, 8][i],
      revenueGBP,
    };
  });

  return {
    daily,
    regions: [
      { name: "Europe & UK", patients: 1240 },
      { name: "South Asia", patients: 860 },
      { name: "Middle East", patients: 310 },
      { name: "North America", patients: 205 },
      { name: "Africa", patients: 140 },
      { name: "East Asia & Pacific", patients: 95 },
      { name: "Latin America", patients: 40 },
    ],
    topics: [
      { name: "Periods", consultations: 118 },
      { name: "Menopause", consultations: 86 },
      { name: "Pregnancy", consultations: 74 },
      { name: "Fertility", consultations: 61 },
      { name: "Pelvic Health", consultations: 38 },
      { name: "Wellness", consultations: 22 },
    ],
    // Patients write most in the evening.
    hours: Array.from({ length: 24 }, (_, hour) => ({
      hour,
      messages: Math.round(20 + 180 * Math.exp(-((hour - 21) ** 2) / 10) + 90 * Math.exp(-((hour - 13) ** 2) / 8) + (hour < 6 ? 0 : 25) + rand() * 15),
    })),
    doctors,
  };
}

export const commissionOf = (revenueGBP: number) => Math.round(revenueGBP * COMMISSION_RATE * 100) / 100;
