# NPTELBoard

Public course search and anonymous aggregate NPTEL course statistics, with private email-verified result submissions.

## Local development

Requirements: Node.js 22+, npm, and PostgreSQL 14+. Copy `.env.example` to `.env`, set `DATABASE_URL`, then generate separate random secrets for `ADMIN_PASSWORD` and `OTP_SECRET` (each at least 32 bytes). For example, `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Set the secrets locally; do not commit `.env`.

```sh
npm ci
npx prisma generate
npm run db:push
npm run db:seed
npm run dev
```

Open `http://localhost:3000`. For Prisma's local development database, append `pgbouncer=true` to the connection URL. The development OTP is printed to the server console when `RESEND_API_KEY` is not set.

The dev launcher uses a separate `.next-dev-<port>` directory for each server. Stop an existing process with Ctrl+C before restarting on its port; `npm run dev -- --port 3001` starts on 3001.

## Production configuration

Use a shared PostgreSQL service (such as Supabase or a managed PostgreSQL provider) so every visitor and app instance sees the same submissions. Set these environment variables in the host:

- `DATABASE_URL`: production PostgreSQL connection string. Use the provider's transaction-pooling URL with `pgbouncer=true` if required by the provider.
- `ADMIN_PASSWORD`: a unique random secret of at least 32 bytes.
- `OTP_SECRET`: a different unique random secret of at least 32 bytes. This HMAC-protects OTPs and distributed rate-limit keys.
- `RESEND_API_KEY` and `EMAIL_FROM`: Resend credentials and a verified sender address.

Submissions require email verification and are rate-limited by IP and email. Configure HTTPS at the platform or ingress. Production responses include CSP, frame protections, HSTS, and related security headers.

## Database migrations and catalog

`prisma/schema.prisma` defines courses, submissions, email OTP challenges, course requests, and shared rate-limit buckets. Local development can use `npm run db:push`; deployments use committed migrations via `npm run db:migrate:deploy`. The container applies migrations and runs the idempotent seed before starting the app. `data/nptel_courses.csv` is a small starter catalog; replace or bulk-import the full approved catalog before inviting users.

## Docker Compose

Copy `.env.compose.example` to `.env.compose`. Generate distinct random hex values for the Postgres password, `ADMIN_PASSWORD`, and `OTP_SECRET`; set Resend credentials and a verified `EMAIL_FROM`. Then run:

```sh
docker compose --env-file .env.compose up --build
```

The app listens on the configured `APP_PORT` (3000 by default). Stop with `docker compose --env-file .env.compose down`. Add `-v` only if you intend to erase the database volume.

## DevOps files

- GitHub Actions (`.github/workflows/ci.yml`) checks types/tests/builds on pull requests and publishes a GHCR image on `main`; store credentials and deploy-only secrets in GitHub/host secrets.
- `Jenkinsfile` runs checkout, install, checks, tests, build, and a Docker image build on `main`. Its agent needs Node.js 22, Docker, and the Workspace Cleanup plugin.
- `ansible/deploy.yml` configures an Ubuntu Docker host and deploys with Compose. Install `community.docker`; provide the repo URL and credentials through Ansible Vault or extra vars.
- `k8s/` contains PostgreSQL storage/service/deployment and the app deployment/service. Follow `k8s/README.md`; create secrets outside Git.

For a shared public site, the simplest hosted route is Vercel + managed PostgreSQL (for example Supabase). Create the database, run `npm run db:migrate:deploy` against its URL, set the production environment variables above, and connect the GitHub repository to Vercel. Alternatively, the Compose/Ansible/Kubernetes path runs the whole stack on your own host.

## NPTEL score bands

For most courses, assignment ≥10/25 and exam ≥30/75 are required to pass. Certificate bands are: below 40% no certificate; 40–59% successfully completed; 60–74% Elite; 75–89% Elite with Silver medal; and 90–100% Elite with Gold medal. Topper is a rank-based stamp (1%, 2%, or 5%), not a fixed score tier. Some courses publish different pass criteria; verify course-specific rules. See the [NPTEL FAQ](https://www.nptel.ac.in/faq), [NPTEL topper criteria](https://archive.nptel.ac.in/content/college_assets/spoc_refdocs/CriteriaandcalculationfortoppersfortheNPTELOnlineCertificationExams.pdf), and an [NPTEL certificate announcement explaining Silver/Gold ranges](https://onlinecourses-archive.nptel.ac.in/noc19_cs28/announcements).

## Security and privacy

Public endpoints return course aggregates, never individual submissions. Duplicate comparisons are returned only after email OTP verification. OTPs are HMAC-protected, short-lived, limited to five attempts, and resend is throttled. Production IP/email limits are shared through PostgreSQL; local development uses an in-memory limiter. Admin routes require a timing-safe password check and an HTTP-only, Secure-in-production, SameSite cookie; login attempts are throttled. Public POST bodies are size-limited. Names and emails are not selected by public pages; admin moderation returns names but not emails.

## Checks

Run `npx tsc --noEmit`, `npm test`, and `npm audit`. Database-backed verification needs `DATABASE_URL`; a real production submission also needs Resend credentials. The repository does not yet contain a full browser end-to-end test for the email delivery flow.
