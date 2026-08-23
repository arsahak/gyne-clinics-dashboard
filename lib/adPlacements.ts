export const AD_PLACEMENTS = ["patient_home", "learn_feed", "doctor_home", "help_screen"] as const;
export type AdPlacement = (typeof AD_PLACEMENTS)[number];

export const AD_PLACEMENT_LABELS: Record<AdPlacement, string> = {
  patient_home: "Patient Home",
  learn_feed: "Learn Feed",
  doctor_home: "Doctor Home",
  help_screen: "Get Help (Doctor Discovery)",
};
