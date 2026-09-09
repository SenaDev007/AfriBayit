-- AfriBayit — Add PropertyView table (audit-11)
-- Replaces the in-memory listing-views stub with persistent DB storage.
-- CDC §5.9.1: Track profile/listing views with visitor metadata for analytics.

CREATE TABLE "property_views" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "viewerId" TEXT,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT NOT NULL DEFAULT 'direct',
    "country" TEXT,
    "city" TEXT,
    "device" TEXT NOT NULL DEFAULT 'desktop',
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "property_views_pkey" PRIMARY KEY ("id")
);

-- Foreign key to properties (cascade delete when property is deleted)
ALTER TABLE "property_views"
  ADD CONSTRAINT "property_views_propertyId_fkey"
  FOREIGN KEY ("propertyId") REFERENCES "properties"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Indexes for common query patterns
CREATE INDEX "property_views_propertyId_viewedAt_idx" ON "property_views"("propertyId", "viewedAt");
CREATE INDEX "property_views_viewerId_viewedAt_idx" ON "property_views"("viewerId", "viewedAt");
CREATE INDEX "property_views_propertyId_isAnonymous_idx" ON "property_views"("propertyId", "isAnonymous");
