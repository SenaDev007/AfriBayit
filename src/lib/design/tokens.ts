// AfriBayit — Design Token System
// CDC §2 — Système de tokens de design
//
// All tokens from the CDC:
// - Color tokens (Principal, Gold, Innovation, Validation, Alert, Neutral)
// - Typography scale
// - Spacing tokens
// - Animation config
// - Shadow tokens
// - Exported as both JS constants and CSS custom properties

// ============ COLOR TOKENS (CDC §2.1) ============

export const colors = {
  /** Principal — Navy #003087 */
  principal: {
    50: '#e6eef9',
    100: '#c4d8f3',
    200: '#9ebfeb',
    300: '#78a6e3',
    400: '#5b8fdc',
    500: '#003087',
    600: '#002b78',
    700: '#002468',
    800: '#001f5c',
    900: '#001440',
  },
  /** Gold — #D4AF37 */
  gold: {
    50: '#faf6e6',
    100: '#f2e9be',
    200: '#e6c65c',
    300: '#FFD700',
    400: '#D4AF37',
    500: '#b8961f',
    600: '#9c7d16',
    700: '#80650f',
    800: '#6b530d',
    900: '#4a3808',
  },
  /** Innovation — Blue #009CDE */
  innovation: {
    50: '#e6f5fc',
    100: '#b3e3f6',
    200: '#80d1f0',
    300: '#4dbfea',
    400: '#26b3e4',
    500: '#009CDE',
    600: '#008bc5',
    700: '#007aab',
    800: '#006992',
    900: '#004a66',
  },
  /** Validation — Green #00A651 */
  validation: {
    50: '#e6f7ed',
    100: '#b3ebcc',
    200: '#80dfab',
    300: '#4dd38a',
    400: '#26ca73',
    500: '#00A651',
    600: '#009348',
    700: '#00803e',
    800: '#006d35',
    900: '#004d24',
  },
  /** Alert — Red #D93025 */
  alert: {
    50: '#fde8e7',
    100: '#f8c2bf',
    200: '#f39c97',
    300: '#ee756f',
    400: '#ea5951',
    500: '#D93025',
    600: '#c2261c',
    700: '#ab1d14',
    800: '#94170e',
    900: '#6b0f0a',
  },
  /** Neutral — Gray scale */
  neutral: {
    50: '#f5f7fa',
    100: '#f0f4f8',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#2C2E2F',
    900: '#1a1d24',
    950: '#0f1117',
  },
} as const;

// ============ TYPOGRAPHY SCALE (CDC §2.2) ============

export const typography = {
  /** Hero Title: 72-80px */
  heroTitle: {
    fontSize: 'clamp(48px, 6vw, 80px)',
    lineHeight: 1.05,
    fontWeight: 700,
    fontFamily: 'var(--font-cormorant), Georgia, serif',
    letterSpacing: '-0.02em',
  },
  /** Section Title: 40-56px */
  sectionTitle: {
    fontSize: 'clamp(32px, 4vw, 56px)',
    lineHeight: 1.15,
    fontWeight: 700,
    fontFamily: 'var(--font-cormorant), Georgia, serif',
    letterSpacing: '-0.01em',
  },
  /** Card Title: 18-22px */
  cardTitle: {
    fontSize: 'clamp(18px, 2vw, 22px)',
    lineHeight: 1.3,
    fontWeight: 600,
    fontFamily: 'var(--font-cormorant), Georgia, serif',
    letterSpacing: '0em',
  },
  /** Body: 14-16px */
  body: {
    fontSize: 'clamp(14px, 1.2vw, 16px)',
    lineHeight: 1.6,
    fontWeight: 400,
    fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
    letterSpacing: '0em',
  },
  /** Caption: 11-12px */
  caption: {
    fontSize: 'clamp(11px, 1vw, 12px)',
    lineHeight: 1.5,
    fontWeight: 500,
    fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
    letterSpacing: '0.02em',
  },
  /** Mono Data: for prices and numbers */
  monoData: {
    fontSize: 'clamp(14px, 1.2vw, 18px)',
    lineHeight: 1.3,
    fontWeight: 600,
    fontFamily: 'var(--font-dm-mono), monospace',
    letterSpacing: '-0.01em',
  },
} as const;

// ============ SPACING / RADIUS TOKENS (CDC §2.3) ============

export const spacing = {
  /** 4px */
  radiusSm: 4,
  /** 8px */
  radiusMd: 8,
  /** 16px */
  radiusLg: 16,
  /** 24px */
  radiusXl: 24,
  /** 32px */
  radius2xl: 32,
  /** Full (pill) */
  radiusFull: 9999,
} as const;

export const padding = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
} as const;

export const gap = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
} as const;

// ============ ANIMATION CONFIG (CDC §2.4) ============

export const animation = {
  /** Primary easing — cubic-bezier(0.16, 1, 0.3, 1) */
  easeOut: [0.16, 1, 0.3, 1] as const,
  /** Spring config for interactive elements */
  spring: { stiffness: 300, damping: 25 },
  /** Spring config for page transitions */
  springPage: { stiffness: 200, damping: 20 },
  /** Duration: fast — 150ms */
  durationFast: 150,
  /** Duration: normal — 280ms */
  durationNormal: 280,
  /** Duration: slow — 500ms */
  durationSlow: 500,
  /** Stagger delay between items */
  staggerDelay: 0.08,
} as const;

// ============ SHADOW TOKENS (CDC §2.5) ============

export const shadows = {
  /** Gold glow for premium elements */
  goldGlow: '0 0 20px rgba(212, 175, 55, 0.3), 0 0 60px rgba(212, 175, 55, 0.1)',
  /** Card shadow for elevated cards */
  cardShadow: '0 2px 16px rgba(0, 0, 0, 0.06), 0 0 1px rgba(0, 0, 0, 0.08)',
  /** Navy shadow for branded elements */
  navyShadow: '0 4px 24px rgba(0, 48, 135, 0.12), 0 1px 4px rgba(0, 48, 135, 0.06)',
  /** Glassmorphism shadow */
  glassShadow: '0 8px 32px rgba(0, 0, 0, 0.08), 0 0 1px rgba(0, 0, 0, 0.1)',
  /** Deep shadow for modals/overlays */
  deepShadow: '0 16px 48px rgba(0, 0, 0, 0.15), 0 0 1px rgba(0, 0, 0, 0.1)',
} as const;

// ============ GLASSMORPHISM TOKENS (CDC §2.6) ============

export const glassmorphism = {
  /** Light glass — white background */
  light: {
    background: 'rgba(255, 255, 255, 0.78)',
    border: 'rgba(255, 255, 255, 0.3)',
    blur: '20px',
    saturate: '180%',
  },
  /** Navy glass — dark navy background */
  navy: {
    background: 'rgba(0, 48, 135, 0.85)',
    border: 'rgba(255, 255, 255, 0.1)',
    blur: '20px',
    saturate: '180%',
  },
  /** Dark glass — for dark mode */
  dark: {
    background: 'rgba(15, 17, 23, 0.85)',
    border: 'rgba(255, 255, 255, 0.1)',
    blur: '20px',
    saturate: '180%',
  },
} as const;

// ============ CSS CUSTOM PROPERTIES EXPORT ============

/**
 * Generate CSS custom properties string for use in globals.css or inline styles.
 * All tokens are exported as CSS variables with --afri- prefix.
 */
export function generateCSSCustomProperties(): string {
  const vars: string[] = [];

  // Colors
  for (const [palette, shades] of Object.entries(colors)) {
    for (const [shade, value] of Object.entries(shades)) {
      vars.push(`  --afri-color-${palette}-${shade}: ${value};`);
    }
  }

  // Radius
  for (const [name, value] of Object.entries(spacing)) {
    vars.push(`  --afri-radius-${name}: ${value}px;`);
  }

  // Animation
  vars.push(`  --afri-ease-out: cubic-bezier(${animation.easeOut.join(', ')});`);
  vars.push(`  --afri-duration-fast: ${animation.durationFast}ms;`);
  vars.push(`  --afri-duration-normal: ${animation.durationNormal}ms;`);
  vars.push(`  --afri-duration-slow: ${animation.durationSlow}ms;`);

  // Shadows
  for (const [name, value] of Object.entries(shadows)) {
    vars.push(`  --afri-shadow-${name}: ${value};`);
  }

  return `:root {\n${vars.join('\n')}\n}`;
}

/**
 * Get all design tokens as a flat object (for JS usage).
 */
export function getAllTokens(): Record<string, string | number> {
  const tokens: Record<string, string | number> = {};

  for (const [palette, shades] of Object.entries(colors)) {
    for (const [shade, value] of Object.entries(shades)) {
      tokens[`color.${palette}.${shade}`] = value;
    }
  }

  for (const [name, value] of Object.entries(spacing)) {
    tokens[`radius.${name}`] = value;
  }

  tokens['animation.easeOut'] = `cubic-bezier(${animation.easeOut.join(', ')})`;
  tokens['animation.durationFast'] = animation.durationFast;
  tokens['animation.durationNormal'] = animation.durationNormal;
  tokens['animation.durationSlow'] = animation.durationSlow;

  for (const [name, value] of Object.entries(shadows)) {
    tokens[`shadow.${name}`] = value;
  }

  return tokens;
}
