import { NextRequest, NextResponse } from "next/server";
import { randomInt } from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashOtp, sendOtp } from "@/lib/otp";
import { hit } from "@/lib/rate-limit";
import { readJson } from "@/lib/http";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-real-ip")?.trim() || req.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() || "unknown";
  if (!(await hit(`resend-ip:${ip}`, 8, 60 * 60_000))) return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  const parsed = z.object({ otpId: z.string().min(1).max(64) }).safeParse(await readJson(req, 2 * 1024));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const otp = await db.otp.findUnique({ where: { id: parsed.data.otpId } });
  if (!otp || otp.verifiedAt || otp.expiresAt < new Date()) return NextResponse.json({ error: "Code expired. Please submit again." }, { status: 410 });
  if (Date.now() - otp.lastSentAt.getTime() < 30_000) return NextResponse.json({ error: "Please wait 30 seconds before requesting another code." }, { status: 429 });
  if (!(await hit(`resend-email:${otp.email}`, 3, 60 * 60_000))) return NextResponse.json({ error: "Resend limit reached. Try later." }, { status: 429 });
  const code = String(randomInt(100000, 1000000));
  await db.otp.update({ where: { id: otp.id }, data: { codeHash: hashOtp(code), lastSentAt: new Date(), attempts: 0, expiresAt: new Date(Date.now() + 10 * 60_000) } });
  try { await sendOtp(otp.email, code); }
  catch { return NextResponse.json({ error: "Could not send code." }, { status: 503 }); }
  return NextResponse.json({ sent: true });
}
