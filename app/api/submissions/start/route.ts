import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { submissionSchema } from "@/lib/schemas";
import { sendOtp } from "@/lib/otp";
import { createHash, randomInt } from "node:crypto";
import { hit } from "@/lib/rate-limit";
export async function POST(req: NextRequest) {
  const data = await req.json().catch(() => null);
  const parsed = submissionSchema.safeParse(data);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  if (parsed.data.website) return NextResponse.json({ error: "Submission rejected." }, { status: 400 });
  const course = await db.course.findFirst({ where: { id: parsed.data.courseId, status: "APPROVED" }, select: { id: true } });
  if (!course) return NextResponse.json({ error: { courseId: ["Choose an approved course"] } }, { status: 400 });
  const email = parsed.data.email.toLowerCase();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!hit(`ip:${ip}`, 8, 60 * 60_000) || !hit(`email:${email}`, 3, 60 * 60_000)) return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  const duplicate = await db.submission.findFirst({ where: { email, courseId: course.id }, orderBy: { attemptNumber: "desc" } });
  const code = String(randomInt(100000, 1000000));
  await db.otp.deleteMany({ where: { email } });
  const otp = await db.otp.create({ data: { email, codeHash: createHash("sha256").update(code).digest("hex"), expiresAt: new Date(Date.now() + 10 * 60_000), payload: { ...parsed.data, email }, duplicateId: duplicate?.id ?? null } });
  try { await sendOtp(email, code); } catch { await db.otp.delete({ where: { id: otp.id } }); return NextResponse.json({ error: "Could not send the verification code. Please try again." }, { status: 503 }); }
  return NextResponse.json({ otpId: otp.id, duplicate: duplicate ? { id: duplicate.id, year: duplicate.year, session: duplicate.session, semester: duplicate.semester, assignmentScore: duplicate.assignmentScore, examScore: duplicate.examScore, overallPercent: duplicate.overallPercent, hasNumericals: duplicate.hasNumericals, tier: duplicate.tier, newValues: { year: parsed.data.year, session: parsed.data.session, semester: parsed.data.semester, assignmentScore: parsed.data.assignmentScore, examScore: parsed.data.examScore, overallPercent: parsed.data.overallPercent, hasNumericals: parsed.data.hasNumericals, tier: parsed.data.tier } } : null });
}
