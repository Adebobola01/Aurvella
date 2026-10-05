# Aurvella

Aurvella is a jewelry marketplace built with Next.js App Router. The initial
implementation includes protected administrator sign-in, a SQLite-backed
product dashboard, and product creation/editing with inventory quantities,
fixed product categories, and Cloudflare Images uploads. The public storefront
is the next development step.

## Administrator authentication setup

1. Copy `.env.example` to `.env.local` and copy the `DATABASE_URL` entry into
   `.env` as well. Prisma CLI reads `.env` when creating and applying database
   migrations; Next.js reads `.env.local` when running the app.
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
