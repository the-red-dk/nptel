import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { submissionSchema } from "@/lib/schemas";
import { hashOtp, sendOtp } from "@/lib/otp";
import { randomInt } from "node:crypto";
import { hit } from "@/lib/rate-limit";
import { readJson } from "@/lib/http";
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-real-ip")?.trim() || req.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() || "unknown";
  if (!(await hit(`ip:${ip}`, 8, 60 * 60_000))) return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  const data = await readJson(req, 16 * 1024);
  const parsed = submissionSchema.safeParse(data);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  if (parsed.data.website) return NextResponse.json({ error: "Submission rejected." }, { status: 400 });
  const email = parsed.data.email.toLowerCase();
  if (!(await hit(`email:${email}`, 3, 60 * 60_000))) return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  const course = await db.course.findFirst({ where: { id: parsed.data.courseId, status: "APPROVED" }, select: { id: true } });
  if (!course) return NextResponse.json({ error: { courseId: ["Choose an approved course"] } }, { status: 400 });
  const code = String(randomInt(100000, 1000000));
  await db.otp.deleteMany({ where: { email } });
  const { website: _website, ...payload } = parsed.data;
  const otp = await db.otp.create({ data: { email, codeHash: hashOtp(code), expiresAt: new Date(Date.now() + 10 * 60_000), payload: { ...payload, email } } });
  try { await sendOtp(email, code); } catch { await db.otp.delete({ where: { id: otp.id } }); return NextResponse.json({ error: "Could not send the verification code. Please try again." }, { status: 503 }); }
  return NextResponse.json({ otpId: otp.id, needsVerification: true });
}
