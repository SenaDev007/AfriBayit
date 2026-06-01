---
Task ID: 1-8
Agent: Main
Task: Fix 8 AfriBayit platform issues

Work Log:
- Fixed NotaryModule toLowerCase error by adding null-safe string handling
- Fixed CommunityModule React error #31 by properly mapping events and groups API data to component interfaces
- Fixed Profile API to return demo profile when userId not found (instead of 404)
- Updated ProfessionalProfileModule to use auth store user ID
- Added 7 ShortTermRental seed records for Location Courte Durée (BJ, CI, TG, BF)
- Added 3 ProfessionalProfile seed records (admin, agent BJ, agent CI)
- Added BF short-term rental to existing seed section
- Added AfriBayit logo + text to login and register pages
- Verified search page already correctly filters by transaction type (achat/location/investissement)
- Verified Artisans page has existing seed data (6 artisans)
- Verified Academie has existing seed data (6 courses + enrollments)
- Build passes with 0 errors
- Pushed to GitHub

Stage Summary:
- All 8 issues addressed
- Short-term rentals now have 7 test listings across all 4 countries
- Professional profiles have seed data for 3 users
- Notaire/GeoTrust toLowerCase error fixed with null-safe access
- Communauté module properly maps API data
- Profil page returns demo profile instead of error
- Login pages now show logo image + AfriBayit text
- Database seeded with new data
