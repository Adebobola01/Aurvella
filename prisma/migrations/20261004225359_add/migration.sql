-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL,
    "priceInMinorUnits" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "currencyCode" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Product" ("category", "createdAt", "currencyCode", "description", "id", "name", "priceInMinorUnits", "slug", "status", "updatedAt") SELECT "category", "createdAt", "currencyCode", "description", "id", "name", "priceInMinorUnits", "slug", "status", "updatedAt" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");
CREATE INDEX "Product_status_updatedAt_idx" ON "Product"("status", "updatedAt");
CREATE INDEX "Product_category_idx" ON "Product"("category");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
