// Unit tests for the design system tokens (CDC §2).
// Verifies color palette, typography, motion, spacing match the CDC spec.

import { describe, it, expect } from 'vitest';
import { colors, typography, spacing, animation, shadows } from '@/lib/design/tokens';

describe('Design tokens — Colors (CDC §2.1)', () => {
  it('has 6 color palettes', () => {
    expect(Object.keys(colors)).toHaveLength(6);
    expect(colors.principal).toBeDefined();
    expect(colors.gold).toBeDefined();
    expect(colors.innovation).toBeDefined();
    expect(colors.validation).toBeDefined();
    expect(colors.alert).toBeDefined();
    expect(colors.neutral).toBeDefined();
  });

  it('principal 500 is the brand navy', () => {
    expect(colors.principal[500]).toMatch(/^#00[0-9a-fA-F]{4}$/);
  });

  it('gold has both bright (#FFCC00) and bronze (#D4AF37) variants', () => {
    expect(colors.gold[300]).toBe('#FFCC00');
    expect(colors.gold[400]).toBe('#D4AF37');
  });

  it('validation 500 is green #00A651', () => {
    expect(colors.validation[500]).toBe('#00A651');
  });

  it('alert 500 is red #D93025', () => {
    expect(colors.alert[500]).toBe('#D93025');
  });

  it('neutral 800 is #2C2E2F (Gris Premium)', () => {
    expect(colors.neutral[800]).toBe('#2C2E2F');
  });

  it('each palette has at least 10 shades (50-900)', () => {
    for (const [name, palette] of Object.entries(colors)) {
      const keys = Object.keys(palette);
      expect(keys.length).toBeGreaterThanOrEqual(10);
      expect(palette[50]).toBeDefined();
      expect(palette[900]).toBeDefined();
    }
  });
});

describe('Design tokens — Typography (CDC §2.3-2.4)', () => {
  it('has 6 typography levels (heroTitle, sectionTitle, cardTitle, body, caption, monoData)', () => {
    expect(Object.keys(typography)).toHaveLength(6);
    expect(typography.heroTitle).toBeDefined();
    expect(typography.sectionTitle).toBeDefined();
    expect(typography.cardTitle).toBeDefined();
    expect(typography.body).toBeDefined();
    expect(typography.caption).toBeDefined();
    expect(typography.monoData).toBeDefined();
  });

  it('hero title uses Cormorant Garamond', () => {
    expect(typography.heroTitle.fontFamily).toContain('cormorant');
  });

  it('body uses DM Sans', () => {
    expect(typography.body.fontFamily).toContain('dm-sans');
  });

  it('caption uses DM Sans', () => {
    expect(typography.caption.fontFamily).toContain('dm-sans');
  });

  it('monoData uses DM Mono', () => {
    expect(typography.monoData.fontFamily).toContain('dm-mono');
  });

  it('hero title has line-height 1.05', () => {
    expect(typography.heroTitle.lineHeight).toBe(1.05);
  });

  it('section title has line-height 1.15', () => {
    expect(typography.sectionTitle.lineHeight).toBe(1.15);
  });

  it('body has line-height 1.6', () => {
    expect(typography.body.lineHeight).toBe(1.6);
  });
});

describe('Design tokens — Spacing & Radius (CDC §2.6)', () => {
  it('has 6 radius tokens', () => {
    expect(Object.keys(spacing)).toHaveLength(6);
  });

  it('radius-sm is 4px', () => {
    expect(spacing.radiusSm).toBe(4);
  });

  it('radius-md is 8px', () => {
    expect(spacing.radiusMd).toBe(8);
  });

  it('radius-lg is 16px', () => {
    expect(spacing.radiusLg).toBe(16);
  });

  it('radius-xl is 24px', () => {
    expect(spacing.radiusXl).toBe(24);
  });

  it('radius-full is 9999px (pill)', () => {
    expect(spacing.radiusFull).toBe(9999);
  });
});

describe('Design tokens — Animation (CDC §2.8)', () => {
  it('easeOut is cubic-bezier(0.16, 1, 0.3, 1)', () => {
    expect(animation.easeOut).toEqual([0.16, 1, 0.3, 1]);
  });

  it('has 3 standard durations', () => {
    expect(animation.durationFast).toBe(150);
    expect(animation.durationNormal).toBe(280);
    expect(animation.durationSlow).toBe(500);
  });

  it('stagger delay is 0.08s (80ms)', () => {
    expect(animation.staggerDelay).toBe(0.08);
  });

  it('has spring configs', () => {
    expect(animation.spring).toBeDefined();
    expect(animation.spring.stiffness).toBe(300);
    expect(animation.spring.damping).toBe(25);
  });
});

describe('Design tokens — Shadows (CDC §2.6)', () => {
  it('has 6 shadow tokens', () => {
    expect(Object.keys(shadows)).toHaveLength(6);
    expect(shadows.goldGlow).toBeDefined();
    expect(shadows.cardShadow).toBeDefined();
    expect(shadows.navyShadow).toBeDefined();
    expect(shadows.glassShadow).toBeDefined();
    expect(shadows.deepShadow).toBeDefined();
    expect(shadows.innovationGlow).toBeDefined();
  });

  it('goldGlow contains gold color', () => {
    expect(shadows.goldGlow).toContain('255, 204, 0');
  });

  it('innovationGlow contains innovation blue', () => {
    expect(shadows.innovationGlow).toContain('51, 153, 255');
  });
});

describe('Design tokens — CSS export', () => {
  it('generateCSSCustomProperties returns a string with :root', async () => {
    const { generateCSSCustomProperties } = await import('@/lib/design/tokens');
    const css = generateCSSCustomProperties();
    expect(css).toContain(':root');
    expect(css).toContain('--afri-color-');
    expect(css).toContain('--afri-radius-');
    expect(css).toContain('--afri-ease-out');
    expect(css).toContain('--afri-shadow-');
  });

  it('getAllTokens returns a flat object', async () => {
    const { getAllTokens } = await import('@/lib/design/tokens');
    const tokens = getAllTokens();
    expect(tokens['color.principal.500']).toBeDefined();
    expect(tokens['radius.radiusSm']).toBeDefined();
    expect(tokens['animation.easeOut']).toContain('cubic-bezier');
  });
});
