# Aurvella Jewelry Marketplace — Implementation Plan

## Goal

Turn the current Next.js starter into a responsive, black-and-white jewelry
catalog with searchable and filterable product listings, product detail pages,
and a protected admin area for managing products, prices, and images.

## Current starting point

- The repository is a minimal Next.js 16 App Router starter.
- The app currently has only the root page, root layout, and global stylesheet.
- There is no database, authentication, product catalog, or image-upload
  integration yet.
- Keep the existing App Router and build the marketplace into it.

## Recommended scope and defaults

- Treat the customer-facing experience as a product catalog. Shopping cart,
  checkout, payments, customer accounts, and order management are not included
  unless requested later.
- Use SQLite for product data, accessed through Prisma, with schema changes
  managed by migrations.
- Start with one administrator account configured through deployment
  environment variables. Do not provide public admin registration.
- Store the current price and currency on each product. Admin price edits
  replace the current price; historical price tracking can be added if needed.
- Use Cloudflare Images for product media. Keep Cloudflare credentials on the
  server and persist image identifiers and delivery URLs, not image binaries,
  in SQLite.
- Use a restrained black-and-white visual system, with product photography
  providing the main color.

## Proposed routes

### Customer-facing

- `/` — marketplace landing page, featured products, and product browsing.
- `/products/[slug]` — product details, image gallery, price, description, and
  availability.

### Admin

- `/admin/login` — administrator sign-in.
- `/admin` — protected product-management dashboard.
- `/admin/products/new` — create a product and upload product images.
- `/admin/products/[id]/edit` — edit product details, images, price, and
  visibility.

Use App Router server-side data loading for catalog and detail pages. Keep
interactive controls such as search, filters, image selection, and mobile
navigation in focused client components.

## Data model outline

### Product

- ID and unique slug.
- Name, description, category, and optional material/metal details.
- Current integer price in the smallest currency unit, plus currency code.
- Non-negative whole-number inventory quantity.
- Category selected from a fixed list in the admin UI.
- Availability/publication status (for example, draft, published, or sold out).
- Created and updated timestamps.

### Product image

- ID, product relation, Cloudflare image ID, delivery URL, and display order.
- Optional alt text for accessibility.

Define the product-to-image relationship explicitly so an admin can add,
reorder, and remove a product's images without losing the product record.

## Phased implementation

### 1. Foundation and database

- Replace starter metadata and establish shared layout and route structure.
- Add Prisma and configure the SQLite datasource through environment
  configuration.
- Define and migrate the product and product-image schema.
- Add typed database access and validation for product inputs.
- Document required environment variables and local database setup.

### 2. Storefront and responsive design

- Build a shared header, footer, marketplace landing page, and product-card
  grid.
- Apply a consistent monochrome palette, typography, spacing, and focus states.
- Implement the mobile hamburger menu with keyboard-accessible open/close
  behavior.
- Make the catalog, filters, detail page, and admin forms usable on mobile,
  tablet, and desktop.
- Add empty, loading, not-found, and error states where appropriate.

### 3. Catalog search, filters, and details

- Add server-backed product listing and search by product name and relevant
  descriptive fields.
- Add category and price-range filters, plus an explicit way to clear filters.
- Preserve search/filter state in URL query parameters so results can be
  bookmarked and navigated with browser history.
- Implement `/products/[slug]` with product images, full product details,
  current price, and availability.
- Show only published products in the public storefront.

### 4. Admin authentication and authorization

- Implement the administrator sign-in page using the configured admin
  credentials and a securely hashed password.
- Create a server-validated session in a secure, HttpOnly, SameSite cookie.
- Protect admin pages and every admin mutation on the server; hiding links in
  the UI is not authorization.
- Add sign-out, invalid-credentials feedback, and session expiration.
- Keep secrets out of source control and client-side bundles.

### 5. Admin product and price management

- Build the protected product dashboard with product status and edit actions.
- Add validated create and edit forms for product details, a category dropdown,
  inventory quantity, availability, and current price.
- Support draft/published visibility and prevent incomplete products from being
  published.
- Provide a dedicated create-product page with validated details, price,
  currency, category, draft/published status, and Cloudflare Images upload.
- Add clear success and failure feedback for create, update, and delete/archive
  actions.
- Confirm destructive actions and avoid hard-deleting products that should
  remain in the catalog history.

### 6. Cloudflare Images integration

- Configure Cloudflare account identifiers and API credentials as server-only
  environment variables.
- Have the server request a short-lived, one-time direct-upload URL, then let
  the browser upload the selected image to Cloudflare.
- Validate image type and size before upload and present progress and errors.
- Save the returned Cloudflare image ID and delivery URL against the product.
- Support multiple images, reordering, alt text, removal, and a primary image.
- Ensure failed product saves or image uploads are reported clearly and do not
  leave misleading success states.

### 7. Verification and release readiness

- Test product validation, search/filter behavior, publication visibility,
  admin authorization, product CRUD, price updates, and image metadata handling.
- Verify the hamburger menu and forms with keyboard navigation and screen
  readers.
- Check responsive layouts at mobile, tablet, and desktop widths.
- Run the repository's lint and production build commands.
- Confirm the chosen hosting environment provides persistent storage and
  backups for SQLite. If deployment uses ephemeral/serverless filesystems,
  revisit the database choice before release while preserving SQLite as the
  local development database.
- Configure production environment variables and Cloudflare Images access
  before enabling uploads.

## Acceptance criteria

- An unauthenticated visitor cannot access the admin dashboard or perform
  product-management actions.
- An authenticated administrator can create, edit, publish, archive, and update
  the price of a product.
- An administrator can upload and manage product images through Cloudflare
  Images without exposing Cloudflare secrets in the browser.
- Published products appear in the storefront, are searchable/filterable, and
  have working detail pages; drafts do not appear publicly.
- Search and filters can be shared as URL links and can be cleared.
- Storefront and admin pages remain usable on small screens, including a
  keyboard-accessible hamburger menu.
- The design consistently uses the requested black-and-white interface.
- Database migrations, lint, and production build complete successfully.

## Decisions to revisit only if requirements change

- Whether the catalog should support multiple currencies, variants, inventory
  counts, or historical price records.
- Whether customer accounts, favorites, cart, checkout, payments, or order
  management are needed.
- Whether more than one administrator or role-based permissions are needed.
- Whether product images need transformations, video, or separate galleries per
  variant.
