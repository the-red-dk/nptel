import { Resend } from "resend";
import { createHmac, randomBytes } from "node:crypto";

const developmentSecret = randomBytes(32).toString("hex");
export function hashOtp(code: string) {
  const secret = process.env.OTP_SECRET;
  if (process.env.NODE_ENV === "production" && (!secret || Buffer.byteLength(secret) < 32)) throw new Error("OTP_SECRET must be at least 32 bytes in production");
  return createHmac("sha256", secret || developmentSecret).update(code).digest("hex");
}

export async function sendOtp(email: string, code: string) {
  if (!process.env.RESEND_API_KEY) {
    if (process.env.NODE_ENV === "production") throw new Error("Email delivery is not configured");
    console.info(`[NPTELBoard development OTP] ${email}: ${code}`);
    return;
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({ from: process.env.EMAIL_FROM ?? "NPTELBoard <onboarding@resend.dev>", to: email, subject: "Your NPTELBoard verification code", text: `Your verification code is ${code}. It expires in 10 minutes.` });
  if (error) throw new Error("Could not send verification email");
}
