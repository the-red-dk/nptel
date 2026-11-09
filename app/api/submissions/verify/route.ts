import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";
import { submissionSchema } from "@/lib/schemas";
import { passed } from "@/lib/config";
import { hashOtp } from "@/lib/otp";
import { hit } from "@/lib/rate-limit";
import { z } from "zod";
import { readJson } from "@/lib/http";

const schema = z.object({ otpId: z.string().min(1).max(64), code: z.string().regex(/^\d{6}$/).optional(), action: z.enum(["OVERWRITE", "ANOTHER", "CANCEL"]).optional() });

function publicValues(row: { year: number; session: string | null; semester: number | null; assignmentScore: number; examScore: number; overallPercent: number; hasNumericals: boolean; tier: string | null }) {
  return { year: row.year, session: row.session, semester: row.semester, assignmentScore: row.assignmentScore, examScore: row.examScore, overallPercent: row.overallPercent, hasNumericals: row.hasNumericals, tier: row.tier };
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-real-ip")?.trim() || req.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() || "unknown";
  if (!(await hit(`verify-ip:${ip}`, 20, 60 * 60_000))) return NextResponse.json({ error: "Too many verification requests. Try again later." }, { status: 429 });
  const parsed = schema.safeParse(await readJson(req, 2 * 1024));
  if (!parsed.success) return NextResponse.json({ error: "Enter the six-digit code." }, { status: 400 });
  const otp = await db.otp.findUnique({ where: { id: parsed.data.otpId } });
  if (!otp) return NextResponse.json({ error: "Code expired. Please submit again." }, { status: 410 });
  if (otp.expiresAt < new Date()) { await db.otp.delete({ where: { id: otp.id } }); return NextResponse.json({ error: "Code expired. Please submit again." }, { status: 410 }); }

  // A verified challenge with a duplicate is kept briefly so the email owner can choose an action.
  if (otp.verifiedAt) {
    if (!otp.duplicateId) return NextResponse.json({ error: "This verification has already been used." }, { status: 409 });
    if (!parsed.data.action) return NextResponse.json({ error: "Choose how to handle your existing result." }, { status: 400 });
    if (parsed.data.action === "CANCEL") { await db.otp.delete({ where: { id: otp.id } }); return NextResponse.json({ cancelled: true }); }
    const data = submissionSchema.parse(otp.payload);
    const result = await db.$transaction(async tx => {
      if (parsed.data.action === "OVERWRITE") {
        const existing = await tx.submission.findFirst({ where: { id: otp.duplicateId!, email: otp.email, courseId: data.courseId }, select: { id: true } });
        if (!existing) return null;
        return tx.submission.update({ where: { id: existing.id }, data: { year: data.year, session: data.session ?? null, semester: data.semester ?? null, purpose: data.purpose ?? null, name: data.name, assignmentScore: data.assignmentScore, examScore: data.examScore, overallPercent: data.overallPercent, hasNumericals: data.hasNumericals, passed: passed(data.assignmentScore, data.examScore), tier: data.tier ?? null } });
      }
      const highest = await tx.submission.findFirst({ where: { email: otp.email, courseId: data.courseId }, orderBy: { attemptNumber: "desc" }, select: { attemptNumber: true } });
      return tx.submission.create({ data: { ...data, email: otp.email, session: data.session ?? null, semester: data.semester ?? null, purpose: data.purpose ?? null, tier: data.tier ?? null, passed: passed(data.assignmentScore, data.examScore), attemptNumber: (highest?.attemptNumber ?? 0) + 1 } });
    });
    if (!result) return NextResponse.json({ error: "The existing result was removed. Please submit again." }, { status: 409 });
    await db.otp.delete({ where: { id: otp.id } });
    return NextResponse.json({ saved: true });
  }

  if (!parsed.data.code) return NextResponse.json({ error: "Enter the six-digit code." }, { status: 400 });
  if (otp.attempts >= 5) { await db.otp.delete({ where: { id: otp.id } }); return NextResponse.json({ error: "Too many attempts. Please submit again." }, { status: 429 }); }
  const got = Buffer.from(hashOtp(parsed.data.code), "hex"), expected = Buffer.from(otp.codeHash, "hex");
  if (got.length !== expected.length || !timingSafeEqual(got, expected)) {
    await db.otp.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    return NextResponse.json({ error: `Incorrect code. ${4 - otp.attempts} attempts remaining.` }, { status: 400 });
  }

  const data = submissionSchema.parse(otp.payload);
  const existing = await db.submission.findFirst({ where: { email: otp.email, courseId: data.courseId }, orderBy: { attemptNumber: "desc" }, select: { id: true, year: true, session: true, semester: true, assignmentScore: true, examScore: true, overallPercent: true, hasNumericals: true, tier: true } });
  if (existing) {
    await db.otp.update({ where: { id: otp.id }, data: { duplicateId: existing.id, verifiedAt: new Date() } });
    return NextResponse.json({ verified: true, duplicate: { existing: publicValues(existing), newValues: publicValues({ ...data, session: data.session ?? null, semester: data.semester ?? null, tier: data.tier ?? null }) } });
  }

  const result = await db.$transaction(async tx => {
    const highest = await tx.submission.findFirst({ where: { email: otp.email, courseId: data.courseId }, orderBy: { attemptNumber: "desc" }, select: { attemptNumber: true } });
    return tx.submission.create({ data: { ...data, email: otp.email, session: data.session ?? null, semester: data.semester ?? null, purpose: data.purpose ?? null, tier: data.tier ?? null, passed: passed(data.assignmentScore, data.examScore), attemptNumber: (highest?.attemptNumber ?? 0) + 1 } });
  });
  await db.otp.delete({ where: { id: otp.id } });
  return NextResponse.json({ saved: true, id: result.id });
}
