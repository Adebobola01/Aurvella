# Aurvella

Aurvella is a jewelry marketplace built with Next.js App Router. The initial
implementation includes protected administrator sign-in, a SQLite-backed
product dashboard, and product creation/editing with inventory quantities,
fixed product categories, and Cloudflare Images uploads. The public storefront
is the next development step.

## Database

Local development uses a SQLite file at `prisma/prisma/dev.db`. Vercel
deployments use [Turso](https://turso.tech/), a hosted SQLite-compatible
database, because serverless function instances do not share a persistent local
database file.

1. Create a Turso database and an authentication token with the Turso CLI.
2. Set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` in the Vercel project's
   environment variables for every environment you deploy. To run migrations
   locally, set the same values in `.env.local`.
3. Apply all pending migrations, in order, by running:

   ```bash
   npm run db:migrate:turso
   ```

   The script records applied migration names in the database and can be run
   again safely. Run it before deploying code that depends on a new migration.
   Prisma Migrate does not apply migrations directly to Turso.
4. Redeploy the project. If the existing local SQLite database contains product
   data you need in production, migrate that data separately; applying these
   files creates the schema but does not copy local records.

If you already applied the migrations manually with `turso db shell`, initialize
the migration record table once without reapplying the SQL:

```bash
npm run db:migrate:turso -- --baseline
```

This baseline option verifies the current product tables and columns before
recording the existing migrations. Do not use it on a new or partially migrated
database.

Dependency installation runs `prisma generate`, so the deployed Prisma Client
is generated from the checked-in schema.

When `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` are absent, development uses
the local SQLite database. Production intentionally fails with a configuration
error rather than silently attempting to open a non-persistent SQLite file.

## Administrator authentication setup

1. Copy `.env.example` to `.env.local` for Next.js. The local SQLite file path
   is configured in `prisma/schema.prisma`.
2. Generate a password hash in an interactive terminal:

   ```bash
   node scripts/generate-admin-password-hash.mjs
   ```

   Use a strong password with at least 12 characters. The password is entered
   without being echoed. Copy the printed `ADMIN_PASSWORD_HASH` value into
   `.env.local`.
3. Set `ADMIN_EMAIL` to the administrator's email address.
4. Set `SESSION_SECRET` to a cryptographically random secret of at least 32
   bytes. For example, generate one with:

   ```bash
   node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
   ```

5. Apply the database migrations and start the development server:

   ```bash
   npx prisma migrate dev
   npm run dev
   ```

   Visit `/admin/login` to sign in and `/admin` to open the product dashboard.
6. To upload product images, set `CLOUDFLARE_ACCOUNT_ID`,
   `CLOUDFLARE_ACCOUNT_HASH`, and `CLOUDFLARE_API_TOKEN` in `.env.local` (and in
   production secrets). The API token needs permission to upload and read
   Cloudflare Images for that account. Image uploads use one-time direct upload
   URLs; API credentials stay on the server. Configure the account hash used by
   your Cloudflare Images delivery URLs. Published products need at least one
   image; drafts may be saved without images.

Product categories are selected from the fixed list in the admin forms instead
of entered as free text. Inventory quantity is a non-negative whole number.

The admin session is stored in a signed, HttpOnly, SameSite=Strict cookie and
expires after eight hours. Set environment variables in the deployment
platform's secret manager in production; do not commit `.env.local` or expose
these values to client-side code. Apply request rate limiting at the hosting
edge before exposing the login endpoint publicly.

## Development

Install dependencies and run the development server:

```bash
npm install
npx prisma migrate dev
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Available scripts

- `npm run dev` — start the development server.
- `npm run build` — create a production build.
- `npm run start` — run the production server.
- `npm run lint` — run ESLint.
