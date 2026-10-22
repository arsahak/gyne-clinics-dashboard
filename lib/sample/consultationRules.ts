// The consultation rules the app uses today, copied from the webapp:
//   webapp/lib/consultation.ts (CONSULTATION_POLICY, payment methods)
//   webapp/lib/availability.ts (schedule options)
//   webapp/lib/locale/regions.ts (regional prices)
//   webapp/lib/chat-guard.ts (blocked contact details)
//   backend/utils/video.ts (video call limits)
// Until the backend stores them, the dashboard shows these values and keeps edits on the page.

export interface RegionRule {
  id: string;
  name: string;
  currency: "GBP" | "USD";
  multiplier: number;
  localMethods: string[];
}

export interface ConsultationRules {
  sessionHours: number;
  followUpDays: number;
  replyGuaranteeHours: number;
  slotHoldMinutes: number;

  freeMessagesDefault: boolean;
  paidConsultationDefault: boolean;
  doctorsChooseMessaging: boolean;
  instantChatDefault: boolean;

  slotMinutesDefault: number;
  bookingWindowDaysDefault: number;
  minNoticeHoursDefault: number;
  doctorsEditSchedule: boolean;

  minFeeGBP: number;
  maxFeeGBP: number;
  allowFreeConsultations: boolean;
  gbpToUsd: number;
  regions: RegionRule[];

  videoEnabled: boolean;
  videoMaxMinutes: number;
  videoRecording: boolean;

  blockPhone: boolean;
  blockEmail: boolean;
  blockLinks: boolean;
  blockSocial: boolean;
  emergencyMessage: string;
}

export const SLOT_LENGTHS = [15, 20, 30, 45, 60];
export const BOOKING_WINDOWS = [7, 14, 30];
export const MIN_NOTICE = [1, 2, 4, 12, 24];

export const CURRENT_RULES: ConsultationRules = {
  sessionHours: 24,
  followUpDays: 7,
  replyGuaranteeHours: 12,
  slotHoldMinutes: 10,

  freeMessagesDefault: false,
  paidConsultationDefault: true,
  doctorsChooseMessaging: true,
  instantChatDefault: true,

  slotMinutesDefault: 30,
  bookingWindowDaysDefault: 14,
  minNoticeHoursDefault: 2,
  doctorsEditSchedule: true,

  minFeeGBP: 0,
  maxFeeGBP: 150,
  allowFreeConsultations: true,
  gbpToUsd: 1.3,
  regions: [
    { id: "europe", name: "Europe & UK", currency: "GBP", multiplier: 1, localMethods: [] },
    { id: "north_america", name: "North America", currency: "USD", multiplier: 1, localMethods: [] },
    { id: "middle_east", name: "Middle East", currency: "USD", multiplier: 0.8, localMethods: ["Benefit Pay", "STC Pay", "Bank transfer"] },
    { id: "asia_pacific", name: "East Asia & Pacific", currency: "USD", multiplier: 0.6, localMethods: [] },
    { id: "latin_america", name: "Latin America", currency: "USD", multiplier: 0.45, localMethods: ["PIX", "Mercado Pago"] },
    { id: "africa", name: "Africa", currency: "USD", multiplier: 0.35, localMethods: ["M-Pesa", "MTN MoMo", "Airtel Money"] },
    { id: "south_asia", name: "South Asia", currency: "USD", multiplier: 0.25, localMethods: ["bKash", "Nagad", "Rocket", "UPI"] },
  ],

  videoEnabled: true,
  videoMaxMinutes: 30,
  videoRecording: false,

  blockPhone: true,
  blockEmail: true,
  blockLinks: true,
  blockSocial: true,
  emergencyMessage: "If you have heavy bleeding, severe pain, or feel faint, call 999 (or your local emergency number) or go to A&E now.",
};

/** Same rounding as webapp regionalFee(): whole numbers in the region's currency. */
export function regionalPrice(baseFeeGBP: number, region: RegionRule, gbpToUsd: number) {
  if (baseFeeGBP <= 0) return "Free";
  const amount = Math.max(1, Math.round(region.currency === "GBP" ? baseFeeGBP * region.multiplier : baseFeeGBP * gbpToUsd * region.multiplier));
  return region.currency === "GBP" ? `£${amount}` : `$${amount}`;
}
