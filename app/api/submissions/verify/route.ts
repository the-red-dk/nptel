import { NextRequest, NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";
import { submissionSchema } from "@/lib/schemas";
import { passed } from "@/lib/config";
import { z } from "zod";
const schema = z.object({ otpId: z.string(), code: z.string().regex(/^\d{6}$/), action: z.enum(["OVERWRITE", "ANOTHER", "CANCEL"]).optional() });
export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter the six-digit code." }, { status: 400 });
  const otp = await db.otp.findUnique({ where: { id: parsed.data.otpId } });
  if (!otp) return NextResponse.json({ error: "Code expired. Please submit again." }, { status: 410 });
  if (otp.expiresAt < new Date()) { await db.otp.delete({ where: { id: otp.id } }); return NextResponse.json({ error: "Code expired. Please submit again." }, { status: 410 }); }
  if (otp.attempts >= 5) { await db.otp.delete({ where: { id: otp.id } }); return NextResponse.json({ error: "Too many attempts. Please submit again." }, { status: 429 }); }
  if (otp.duplicateId && !parsed.data.action) return NextResponse.json({ error: "Choose how to handle your existing result." }, { status: 400 });
  const got = createHash("sha256").update(parsed.data.code).digest(), expected = Buffer.from(otp.codeHash, "hex");
  if (got.length !== expected.length || !timingSafeEqual(got, expected)) { await db.otp.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } }); return NextResponse.json({ error: `Incorrect code. ${4 - otp.attempts} attempts remaining.` }, { status: 400 }); }
  if (parsed.data.action === "CANCEL") { await db.otp.delete({ where: { id: otp.id } }); return NextResponse.json({ cancelled: true }); }
  const data = submissionSchema.parse(otp.payload);
  const action = parsed.data.action;
  const result = await db.$transaction(async tx => {
    if (otp.duplicateId && action === "OVERWRITE") return tx.submission.update({ where: { id: otp.duplicateId }, data: { year: data.year, session: data.session ?? null, semester: data.semester ?? null, purpose: data.purpose ?? null, name: data.name, assignmentScore: data.assignmentScore, examScore: data.examScore, overallPercent: data.overallPercent, hasNumericals: data.hasNumericals, passed: passed(data.overallPercent), tier: data.tier ?? null } });
    const highest = await tx.submission.findFirst({ where: { email: data.email.toLowerCase(), courseId: data.courseId }, orderBy: { attemptNumber: "desc" }, select: { attemptNumber: true } });
    return tx.submission.create({ data: { ...data, email: data.email.toLowerCase(), year: data.year, session: data.session ?? null, semester: data.semester ?? null, purpose: data.purpose ?? null, tier: data.tier ?? null, passed: passed(data.overallPercent), attemptNumber: (highest?.attemptNumber ?? 0) + 1 } });
  });
  await db.otp.delete({ where: { id: otp.id } });
  return NextResponse.json({ saved: true, id: result.id });
}
