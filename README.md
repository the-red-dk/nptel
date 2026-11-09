# NPTELBoard

Student-submitted course results and anonymous aggregate NPTEL course insights. The visual direction takes cues from the supplied editorial marketplace screenshot; the content and branding are original.

## Stack

Next.js App Router, TypeScript, Tailwind CSS, PostgreSQL, Prisma, Zod, Recharts, Radix-compatible UI primitives, and Resend. All pass and score limits are centralized in `lib/config.ts`.

## Local setup

1. Install Node.js 20+ and PostgreSQL 14+.
2. Copy `.env.example` to `.env` and set `DATABASE_URL` and a strong `ADMIN_PASSWORD`.
3. Run `npm install`.
4. Run `npx prisma generate`, `npm run db:push`, and `npm run db:seed`.
5. Run `npm run dev` and open `http://localhost:3000`.

Without `RESEND_API_KEY`, development OTPs are printed to the server console. Configure a Resend API key and a verified `EMAIL_FROM` for email delivery. OTPs are hashed in storage and expire after ten minutes. The development rate limiter is in-memory; use a shared store such as Redis for multi-instance production deployment. Configure Cloudflare Turnstile keys before exposing a public deployment; the current form also uses a honeypot.

## Database and seed

`prisma/schema.prisma` defines courses, submissions, OTP challenges, and course requests. `data/nptel_courses.csv` is an illustrative starter list; replace it with the course catalog you intend to support. The seed upserts by slug and can be rerun safely.

## Tests

Run `npm test` for the pass threshold and aggregate best-attempt unit tests. Configure `DATABASE_URL` before running database-backed routes. The requested submit-to-OTP end-to-end scenario still needs a local PostgreSQL fixture and a mail capture provider; this repository does not include an automated Playwright test for that full flow.

## Deployment

Deploy the Next.js app to Vercel and provision PostgreSQL (for example, Supabase). Set `DATABASE_URL`, `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_PASSWORD`, and Turnstile site/secret keys in the deployment environment. Run Prisma generation and apply the schema before launch, then import the production catalog. For production, replace process-local throttling with a shared store and require Turnstile verification in the submission endpoint.

## Privacy notes

Public course pages return aggregate calculations only; names and emails are not selected for public views. Email is used server-side for duplicate detection and OTP delivery. Admin submissions expose the name to help moderation but do not select the email.
