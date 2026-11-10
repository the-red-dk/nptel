import { z } from "zod";
import { CONFIG } from "@/lib/config";
export const submissionSchema = z.object({
  courseId: z.string().min(1, "Choose a course from the list"), year: z.coerce.number().int().min(2020).max(new Date().getFullYear()),
  session: z.enum(["JAN_APR", "JUL_OCT"]).optional().nullable(), semester: z.coerce.number().int().min(1).max(8).optional().nullable(),
  purpose: z.enum(["LEARNING", "CREDITS"]).optional().nullable(), name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254), assignmentScore: z.coerce.number().min(0).max(CONFIG.assignmentMax),
  examScore: z.coerce.number().min(0).max(CONFIG.examMax), overallPercent: z.coerce.number().min(0).max(CONFIG.overallMax),
  hasNumericals: z.coerce.boolean(), tier: z.enum(CONFIG.tiers).optional().nullable(), website: z.string().max(0).optional(),
}).refine(v => !CONFIG.semesterRequired || v.semester != null, { path: ["semester"], message: "Choose your semester" });
export type SubmissionInput = z.infer<typeof submissionSchema>;
