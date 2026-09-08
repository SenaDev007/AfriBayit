-- AfriBayit — Add ContentItem table (audit-9)
CREATE TABLE "content_items" (
    "id" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT '*',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "content_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "content_items_section_key_country_key" ON "content_items"("section", "key", "country");
CREATE INDEX "content_items_section_idx" ON "content_items"("section");
CREATE INDEX "content_items_country_idx" ON "content_items"("country");

INSERT INTO "content_items" ("id", "section", "key", "label", "value", "country", "updatedAt") VALUES
  (gen_random_uuid(), 'homepage', 'hero_title', 'Hero Title', 'Find Your Dream Property in Africa', '*', NOW()),
  (gen_random_uuid(), 'homepage', 'hero_subtitle', 'Hero Subtitle', 'Trusted real estate platform across West Africa', '*', NOW()),
  (gen_random_uuid(), 'homepage', 'cta_button', 'CTA Button Text', 'Start Searching', '*', NOW()),
  (gen_random_uuid(), 'about', 'mission_statement', 'Mission Statement', 'Making African real estate accessible and transparent', '*', NOW()),
  (gen_random_uuid(), 'about', 'vision_statement', 'Vision Statement', 'The leading real estate platform in Africa', '*', NOW()),
  (gen_random_uuid(), 'legal', 'terms_of_service', 'Terms of Service', 'Standard terms apply', '*', NOW()),
  (gen_random_uuid(), 'legal', 'privacy_policy', 'Privacy Policy', 'We respect your data', '*', NOW()),
  (gen_random_uuid(), 'footer', 'contact_email', 'Contact Email', 'support@afribayit.com', '*', NOW()),
  (gen_random_uuid(), 'footer', 'phone_number', 'Phone Number', '+229 90 00 00 00', '*', NOW()),
  (gen_random_uuid(), 'homepage', 'hero_subtitle', 'Hero Subtitle', 'La plateforme immobiliere de confiance au Benin', 'BJ', NOW()),
  (gen_random_uuid(), 'homepage', 'hero_subtitle', 'Hero Subtitle', 'La plateforme immobiliere de confiance en Cote d Ivoire', 'CI', NOW()),
  (gen_random_uuid(), 'homepage', 'hero_subtitle', 'Hero Subtitle', 'La plateforme immobiliere de confiance au Burkina Faso', 'BF', NOW()),
  (gen_random_uuid(), 'homepage', 'hero_subtitle', 'Hero Subtitle', 'La plateforme immobiliere de confiance au Togo', 'TG', NOW());
