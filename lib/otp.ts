import { Resend } from "resend";
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
