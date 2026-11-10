export const CONFIG = {
  assignmentMax: 25,
  examMax: 75,
  overallMax: 100,
  passAssignmentMin: 10,
  passExamMin: 30,
  passPercent: 40,
  tiers: ["ELITE", "SILVER", "GOLD", "TOPPER"] as const,
  tierRanges: {
    ELITE: "60–74%",
    SILVER: "75–89%",
    GOLD: "90–100%",
    TOPPER: "Top 1%, 2%, or 5% of eligible candidates; score ≥60%",
  },
  semesterRequired: false,
  analyticsBestAttemptOnly: true,
  lowSampleThreshold: 10,
  purposeSampleThreshold: 10,
  passRateMinEntries: 10,
} as const;

export function passed(assignmentScore: number, examScore: number) {
  return assignmentScore >= CONFIG.passAssignmentMin &&
    examScore >= CONFIG.passExamMin &&
    assignmentScore + examScore >= CONFIG.passPercent;
}
