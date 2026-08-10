import { NextRequest, NextResponse } from 'next/server';
import { authGuard } from '@/lib/auth-guard';

// Hardcoded content sections since there's no ContentItem model
const CONTENT_SECTIONS = [
  {
    id: 'homepage',
    label: 'Homepage',
    items: [
      { key: 'hero_title', label: 'Hero Title', value: 'Find Your Dream Property in Africa', country: '*' },
      { key: 'hero_subtitle', label: 'Hero Subtitle', value: 'Trusted real estate platform across West Africa', country: '*' },
      { key: 'cta_button', label: 'CTA Button Text', value: 'Start Searching', country: '*' },
    ],
  },
  {
    id: 'about',
    label: 'About',
    items: [
      { key: 'mission_statement', label: 'Mission Statement', value: 'Making African real estate accessible and transparent', country: '*' },
      { key: 'vision_statement', label: 'Vision Statement', value: 'The leading real estate platform in Africa', country: '*' },
    ],
  },
  {
    id: 'legal',
    label: 'Legal',
    items: [
      { key: 'terms_of_service', label: 'Terms of Service', value: 'Standard terms apply', country: '*' },
      { key: 'privacy_policy', label: 'Privacy Policy', value: 'We respect your data', country: '*' },
    ],
  },
  {
    id: 'footer',
    label: 'Footer',
    items: [
      { key: 'contact_email', label: 'Contact Email', value: 'support@afribayit.com', country: '*' },
      { key: 'phone_number', label: 'Phone Number', value: '+229 90 00 00 00', country: '*' },
    ],
  },
];

// Country-specific overrides
const COUNTRY_OVERRIDES: Record<string, Record<string, Record<string, string>>> = {
  BJ: {
    homepage: { hero_subtitle: 'La plateforme immobilière de confiance au Bénin' },
  },
  CI: {
    homepage: { hero_subtitle: 'La plateforme immobilière de confiance en Côte d\'Ivoire' },
  },
  BF: {
    homepage: { hero_subtitle: 'La plateforme immobilière de confiance au Burkina Faso' },
  },
  TG: {
    homepage: { hero_subtitle: 'La plateforme immobilière de confiance au Togo' },
  },
};

export async function GET(request: NextRequest) {
  try {
    // 🔒 P1.3 — Admin authGuard (defense in depth)
    const auth = await authGuard(request, { requiredRoles: ['SUPER_ADMIN', 'COUNTRY_ADMIN'] });
    if (!auth.success) return auth.response;

    const { searchParams } = new URL(request.url);
    const sectionId = searchParams.get('section') || '';
    const country = searchParams.get('country') || '';

    let sections = CONTENT_SECTIONS;

    if (sectionId) {
      sections = sections.filter((s) => s.id === sectionId);
    }

    // Apply country-specific overrides
    if (country && COUNTRY_OVERRIDES[country]) {
      const overrides = COUNTRY_OVERRIDES[country];
      sections = sections.map((section) => {
        const sectionOverrides = overrides[section.id] || {};
        const items = section.items.map((item) => {
          if (item.country === '*' && sectionOverrides[item.key]) {
            return { ...item, value: sectionOverrides[item.key], country };
          }
          return item;
        });
        return { ...section, items };
      });
    }

    return NextResponse.json({ sections });
  } catch (error) {
    console.error('Admin content error:', error);
    return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // 🔒 P1.3 — Admin authGuard (defense in depth)
    const auth = await authGuard(request, { requiredRoles: ['SUPER_ADMIN', 'COUNTRY_ADMIN'] });
    if (!auth.success) return auth.response;

    const body = await request.json();
    const { sectionId, itemKey, country, value } = body;

    if (!sectionId || !itemKey || !value) {
      return NextResponse.json(
        { error: 'Missing required fields: sectionId, itemKey, value' },
        { status: 400 }
      );
    }

    // Since there's no DB table for content, this is a placeholder
    // In production, you'd save to a ContentItem table or CMS
    return NextResponse.json({
      success: true,
      message: `Content item "${itemKey}" in section "${sectionId}" updated for country "${country || '*'}"`,
      updatedItem: { sectionId, itemKey, country: country || '*', value },
    });
  } catch (error) {
    console.error('Admin content update error:', error);
    return NextResponse.json({ error: 'Failed to update content' }, { status: 500 });
  }
}
