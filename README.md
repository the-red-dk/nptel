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

The dev launcher gives each requested port a separate `.next-dev-<port>` output folder. If another instance is already using port 3000, start this one with `npm run dev -- --port 3001`; stop an older instance with Ctrl+C before reusing its port.

## Docker Compose

Copy `.env.compose.example` to `.env.compose`, replace both passwords, then run `docker compose --env-file .env.compose up --build`. Compose starts PostgreSQL, applies the schema, seeds the starter course list, and serves the app at the configured `APP_PORT` (3000 by default). To stop it, run `docker compose --env-file .env.compose down`; add `-v` only if you intend to remove the database volume and its data.

## CI/CD and deployment examples

- `.github/workflows/ci.yml` runs TypeScript, unit tests, and a production build on pushes and pull requests. A push to `main` also publishes a container image to GitHub Container Registry (`ghcr.io`). Enable Actions and package publishing on the GitHub repository first.
- `Jenkinsfile` defines checkout, install, validation, build, and Docker image stages. The Jenkins agent needs Node.js 20, Docker, and the Workspace Cleanup plugin.
- `ansible/deploy.yml` installs Docker on an Ubuntu host, checks out the repository, writes secrets from Ansible variables, and deploys using Compose. Copy `ansible/inventory.ini.example`, replace the host and repository placeholders, install the `community.docker` collection, then provide passwords through Ansible Vault or extra vars.
- `k8s/` includes a PostgreSQL Deployment/PVC/Service and the app Deployment/NodePort Service. Follow `k8s/README.md` to create Kubernetes secrets outside Git and apply the manifests. Replace the example GHCR image name first.

These files prepare the project for GitHub, Jenkins, Ansible, and Kubernetes. Actual CI runs and deployment require a GitHub remote, a configured Jenkins agent, an SSH-accessible Docker host, or a Kubernetes cluster respectively.

Without `RESEND_API_KEY`, development OTPs are printed to the server console. Configure a Resend API key and a verified `EMAIL_FROM` for email delivery. OTPs are hashed in storage and expire after ten minutes. The development rate limiter is in-memory; use a shared store such as Redis for multi-instance production deployment. Configure Cloudflare Turnstile keys before exposing a public deployment; the current form also uses a honeypot.

## Database and seed

`prisma/schema.prisma` defines courses, submissions, OTP challenges, and course requests. `data/nptel_courses.csv` is an illustrative starter list; replace it with the course catalog you intend to support. The seed upserts by slug and can be rerun safely.

## Tests

Run `npm test` for the pass threshold and aggregate best-attempt unit tests. Configure `DATABASE_URL` before running database-backed routes. The requested submit-to-OTP end-to-end scenario still needs a local PostgreSQL fixture and a mail capture provider; this repository does not include an automated Playwright test for that full flow.

## Deployment

Deploy the Next.js app to Vercel and provision PostgreSQL (for example, Supabase). Set `DATABASE_URL`, `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_PASSWORD`, and Turnstile site/secret keys in the deployment environment. Run Prisma generation and apply the schema before launch, then import the production catalog. For production, replace process-local throttling with a shared store and require Turnstile verification in the submission endpoint.

## Privacy notes

Public course pages return aggregate calculations only; names and emails are not selected for public views. Email is used server-side for duplicate detection and OTP delivery. Admin submissions expose the name to help moderation but do not select the email.
