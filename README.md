# Aurvella

Aurvella is a jewelry marketplace built with Next.js App Router. The initial
implementation includes protected administrator sign-in, a SQLite-backed
product dashboard, and product creation/editing with inventory quantities,
fixed product categories, and Cloudflare R2 image uploads. The public storefront
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
6. To upload product images, create an R2 bucket, enable public access using a
   custom domain, and create an R2 API token with Object Read & Write access to
   that bucket. Set `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`,
   `R2_BUCKET_NAME`, and `R2_PUBLIC_URL` in `.env.local` and in production
   secrets. `R2_PUBLIC_URL` is the HTTPS origin (and optional path prefix) for
   the bucket's custom domain, without a trailing slash.

   In the bucket's **Settings → CORS Policy**, allow `PUT` from
   `http://localhost:3000` and your deployed app origins, with these request
   headers:

   ```json
   [
     {
       "AllowedOrigins": [
         "http://localhost:3000",
         "https://aurvella.vercel.app"
       ],
       "AllowedMethods": ["PUT"],
       "AllowedHeaders": ["*"],
       "ExposeHeaders": ["ETag"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```

   Add each Vercel preview origin separately if you upload from previews. CORS
   origins must be origins only (no paths or trailing slash). Uploads use
   short-lived presigned URLs, so the R2 access key and secret stay on the
   server. Existing Cloudflare Images URLs continue to work. Published products
   need at least one image; drafts may be saved without images.

R2's monthly free tier includes 10 GB-month of Standard storage, 1 million
Class A operations, and 10 million Class B operations; internet egress is free.
Usage beyond the included amounts is billed. R2 stores and serves the original
image files; it does not provide Cloudflare Images' named image variants or
transformations. See [R2 pricing](https://developers.cloudflare.com/r2/pricing/).

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
