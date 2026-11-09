export const CONFIG = {
  assignmentMax: 25,
  examMax: 75,
  overallMax: 100,
  passPercent: 40,
  tiers: ["ELITE", "SILVER", "GOLD", "TOPPER"] as const,
  semesterRequired: false,
  analyticsBestAttemptOnly: true,
  lowSampleThreshold: 10,
  purposeSampleThreshold: 10,
  passRateMinEntries: 10,
  otpMinutes: 10,
  otpMaxAttempts: 5,
  otpCooldownSeconds: 30,
} as const;

export function passed(overallPercent: number) {
  return overallPercent >= CONFIG.passPercent;
}
