# NPTELBoard

Public course search and anonymous aggregate NPTEL course statistics, with private, unverified result submissions.

## Local development

Requirements: Node.js 22+, npm, and PostgreSQL 14+. Copy `.env.example` to `.env`, set `DATABASE_URL`, then generate separate random secrets for `ADMIN_PASSWORD` and `RATE_LIMIT_SECRET` (each at least 32 bytes). For example, `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Set the secrets locally; do not commit `.env`.

```sh
npm ci
npx prisma generate
npm run db:push
npm run db:seed
npm run dev
```

Open `http://localhost:3000`. For Prisma's local development database, append `pgbouncer=true` to the connection URL.

The dev launcher uses a separate `.next-dev-<port>` directory for each server. Stop an existing process with Ctrl+C before restarting on its port; `npm run dev -- --port 3001` starts on 3001.

## Production configuration

Use a shared PostgreSQL service (such as Supabase or a managed PostgreSQL provider) so every visitor and app instance sees the same submissions. Set these environment variables in the host:

- `DATABASE_URL`: production PostgreSQL connection string. Use the provider's transaction-pooling URL with `pgbouncer=true` if required by the provider.
- `ADMIN_PASSWORD`: a unique random secret of at least 32 bytes.
- `RATE_LIMIT_SECRET`: a different unique random secret of at least 32 bytes. This HMAC-protects distributed rate-limit keys.

Submissions are saved immediately without email verification and rate-limited by IP and email. Email addresses are kept private, used for attempt grouping, and are not verified. Configure HTTPS at the platform or ingress. Production responses include CSP, frame protections, HSTS, and related security headers.

## Database migrations and catalog

`prisma/schema.prisma` defines courses, submissions, course requests, and shared rate-limit buckets. Local development can use `npm run db:push`; deployments use committed migrations via `npm run db:migrate:deploy`. The GitHub Actions database initializer can run migrations and seed the catalog using the configured `DATABASE_URL` secret. `data/nptel_courses.csv` is a small starter catalog; replace or bulk-import the full approved catalog before inviting users.

## GitHub Actions

The workflow in `.github/workflows/ci.yml` checks types, tests, and builds the app on pull requests and pushes to `main`. The manually triggered database initializer is in `.github/workflows/initialize-database.yml` and requires a `DATABASE_URL` repository secret.

For a shared public site, use Vercel with a managed PostgreSQL database such as Supabase. Run `npm run db:migrate:deploy` against the database, set the production environment variables above, and connect the GitHub repository to Vercel.

## NPTEL score bands

For most courses, assignment ≥10/25 and exam ≥30/75 are required to pass. Certificate bands are: below 40% no certificate; 40–59% successfully completed; 60–74% Elite; 75–89% Elite with Silver medal; and 90–100% Elite with Gold medal. Topper is a rank-based stamp (1%, 2%, or 5%), not a fixed score tier. Some courses publish different pass criteria; verify course-specific rules. See the [NPTEL FAQ](https://www.nptel.ac.in/faq), [NPTEL topper criteria](https://archive.nptel.ac.in/content/college_assets/spoc_refdocs/CriteriaandcalculationfortoppersfortheNPTELOnlineCertificationExams.pdf), and an [NPTEL certificate announcement explaining Silver/Gold ranges](https://onlinecourses-archive.nptel.ac.in/noc19_cs28/announcements).

## Security and privacy

Public endpoints return course aggregates, never individual submissions. The email entered on a submission is not verified; it is stored privately for grouping attempts and can be entered falsely. Production IP/email limits are shared through PostgreSQL; local development uses an in-memory limiter. Admin routes require a timing-safe password check and an HTTP-only, Secure-in-production, SameSite cookie; login attempts are throttled. Public POST bodies are size-limited. Names and emails are not selected by public pages; admin moderation returns names but not emails.

## Checks

Run `npx tsc --noEmit`, `npm test`, and `npm audit`. Database-backed verification needs `DATABASE_URL`. The repository does not yet contain a full browser end-to-end test for submissions.
