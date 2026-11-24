import {
  ColorRole,
  ContrastLevel,
  DesignTokenState,
  ElevationStyle,
  HarmonyMode,
  PaletteColor,
  ShadeScale,
} from '../types/tokens';
import {
  buildAllScales,
  deriveSemanticTheme,
  isValidHex,
  normalizeHex,
  ROLE_LABELS,
  SHADE_STEPS,
} from './colorEngine';
import { getGoogleFontsImportUrl } from '../data/googleFonts';
import { auditContrast, formatRatio, MODE_LABELS } from './contrastAudit';

export interface DerivedShadows {
  light: { sm: string; md: string; lg: string };
  dark: { sm: string; md: string; lg: string };
}

export function getElevationShadows(style: ElevationStyle): DerivedShadows {
  switch (style) {
    case 'flat':
      return {
        light: {
          sm: '0 0 0 1px rgba(15, 23, 42, 0.06)',
          md: '0 0 0 1px rgba(15, 23, 42, 0.09)',
          lg: '0 2px 4px rgba(15, 23, 42, 0.05), 0 0 0 1px rgba(15, 23, 42, 0.1)',
        },
        dark: {
          sm: '0 0 0 1px rgba(255, 255, 255, 0.07)',
          md: '0 0 0 1px rgba(255, 255, 255, 0.10)',
          lg: '0 2px 6px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.12)',
        },
      };
    case 'crisp':
      return {
        light: {
          sm: '0 1px 2px rgba(15, 23, 42, 0.07), 0 0 0 1px rgba(15, 23, 42, 0.05)',
          md: '0 4px 10px -2px rgba(15, 23, 42, 0.09), 0 0 0 1px rgba(15, 23, 42, 0.05)',
          lg: '0 14px 28px -6px rgba(15, 23, 42, 0.14), 0 0 0 1px rgba(15, 23, 42, 0.06)',
        },
        dark: {
          sm: '0 1px 2px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.06)',
          md: '0 6px 14px -2px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.08)',
          lg: '0 16px 32px -6px rgba(0, 0, 0, 0.70), 0 0 0 1px rgba(255, 255, 255, 0.10)',
        },
      };
    case 'elevated':
      return {
        light: {
          sm: '0 2px 6px -1px rgba(15, 23, 42, 0.08), 0 1px 2px rgba(15, 23, 42, 0.04)',
          md: '0 10px 25px -5px rgba(15, 23, 42, 0.11), 0 4px 10px -4px rgba(15, 23, 42, 0.05)',
          lg: '0 22px 45px -10px rgba(15, 23, 42, 0.18), 0 8px 18px -6px rgba(15, 23, 42, 0.08)',
        },
        dark: {
          sm: '0 2px 6px -1px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.06)',
          md: '0 12px 28px -5px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.08)',
          lg: '0 24px 50px -10px rgba(0, 0, 0, 0.80), 0 0 0 1px rgba(255, 255, 255, 0.11)',
        },
      };
    case 'soft':
    default:
      return {
        light: {
          sm: '0 1px 3px rgba(15, 23, 42, 0.05), 0 1px 2px rgba(15, 23, 42, 0.03)',
          md: '0 6px 16px -4px rgba(15, 23, 42, 0.07), 0 2px 6px -2px rgba(15, 23, 42, 0.04)',
          lg: '0 16px 36px -8px rgba(15, 23, 42, 0.11), 0 6px 14px -4px rgba(15, 23, 42, 0.05)',
        },
        dark: {
          sm: '0 1px 3px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          md: '0 8px 20px -4px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.07)',
          lg: '0 18px 40px -8px rgba(0, 0, 0, 0.72), 0 0 0 1px rgba(255, 255, 255, 0.09)',
        },
      };
  }
}

export function getTypeScale(baseSize: number, ratio: number) {
  const round = (n: number) => Math.round(n * 10) / 10;
  return {
    xs: round(baseSize / Math.pow(ratio, 1.5)),
    sm: round(baseSize / ratio),
    base: baseSize,
    lg: round(baseSize * ratio),
    xl: round(baseSize * Math.pow(ratio, 1.5)),
    '2xl': round(baseSize * Math.pow(ratio, 2)),
    '3xl': round(baseSize * Math.pow(ratio, 3)),
    '4xl': round(baseSize * Math.pow(ratio, 4)),
  };
}

export function getRadiusScale(base: number) {
  if (base === 0) {
    return { sm: 0, md: 0, lg: 0, xl: 0, full: 9999 };
  }
  return {
    sm: Math.max(2, Math.round(base * 0.5)),
    md: base,
    lg: Math.round(base * 1.5),
    xl: Math.round(base * 2),
    full: 9999,
  };
}

export function getSpacingScale(unit: number) {
  return {
    1: unit,
    2: unit * 2,
    3: unit * 3,
    4: unit * 4,
    6: unit * 6,
    8: unit * 8,
    12: unit * 12,
  };
}

function getRawColorMap(state: DesignTokenState): Record<ColorRole, string> {
  return state.colors.reduce(
    (acc, item) => {
      acc[item.role] = item.hex;
      return acc;
    },
    {} as Record<ColorRole, string>
  );
}

export function generateTokensJson(state: DesignTokenState): string {
  const scales = buildAllScales(state.colors);
  const raw = getRawColorMap(state);
  const light = deriveSemanticTheme(scales, raw, 'light', state.contrastLevel);
  const dark = deriveSemanticTheme(scales, raw, 'dark', state.contrastLevel);
  const typeScale = getTypeScale(state.typography.baseSize, state.typography.scaleRatio);
  const radii = getRadiusScale(state.geometry.radiusBase);
  const spacing = getSpacingScale(state.geometry.spacingUnit);
  const shadows = getElevationShadows(state.geometry.elevationStyle);

  const buildRamp = (scale: ShadeScale) => {
    const out: Record<string, { $value: string; $type: string }> = {};
    for (const step of SHADE_STEPS) {
      out[String(step)] = { $value: scale[step], $type: 'color' };
    }
    return out;
  };

  const buildSemanticMode = (t: typeof light) => ({
    canvas: { $value: t.canvas, $type: 'color' },
    surface: { $value: t.surface, $type: 'color' },
    surfaceRaised: { $value: t.surfaceRaised, $type: 'color' },
    surfaceMuted: { $value: t.surfaceMuted, $type: 'color' },
    border: { $value: t.border, $type: 'color' },
    borderStrong: { $value: t.borderStrong, $type: 'color' },
    text: { $value: t.text, $type: 'color' },
    textSecondary: { $value: t.textSecondary, $type: 'color' },
    textMuted: { $value: t.textMuted, $type: 'color' },
    primary: { $value: t.primary, $type: 'color' },
    primaryHover: { $value: t.primaryHover, $type: 'color' },
    onPrimary: { $value: t.onPrimary, $type: 'color' },
    secondary: { $value: t.secondary, $type: 'color' },
    onSecondary: { $value: t.onSecondary, $type: 'color' },
    accent: { $value: t.accent, $type: 'color' },
    onAccent: { $value: t.onAccent, $type: 'color' },
    success: { $value: t.success, $type: 'color' },
    successSurface: { $value: t.successSurface, $type: 'color' },
    warning: { $value: t.warning, $type: 'color' },
    warningSurface: { $value: t.warningSurface, $type: 'color' },
    destructive: { $value: t.destructive, $type: 'color' },
    destructiveSurface: { $value: t.destructiveSurface, $type: 'color' },
  });

  const payload = {
    $schema: 'https://tr.designtokens.org/format/',
    brand: state.brandName || 'Untitled System',
    contrastLevel: state.contrastLevel,
    color: {
      palette: {
        primary: { base: { $value: raw.primary, $type: 'color' }, ...buildRamp(scales.primary) },
        secondary: {
          base: { $value: raw.secondary, $type: 'color' },
          ...buildRamp(scales.secondary),
        },
        accent: { base: { $value: raw.accent, $type: 'color' }, ...buildRamp(scales.accent) },
        neutral: { base: { $value: raw.neutral, $type: 'color' }, ...buildRamp(scales.neutral) },
      },
      semantic: {
        light: buildSemanticMode(light),
        dark: buildSemanticMode(dark),
      },
    },
    typography: {
      fontFamily: {
        heading: { $value: state.typography.headingFont, $type: 'fontFamily' },
        body: { $value: state.typography.bodyFont, $type: 'fontFamily' },
        mono: { $value: state.typography.monoFont, $type: 'fontFamily' },
      },
      fontWeight: {
        heading: { $value: state.typography.headingWeight, $type: 'fontWeight' },
        body: { $value: state.typography.bodyWeight, $type: 'fontWeight' },
      },
      letterSpacing: {
        heading: { $value: `${state.typography.headingTracking}em`, $type: 'dimension' },
      },
      lineHeight: {
        body: { $value: state.typography.lineHeight, $type: 'number' },
      },
      fontSize: Object.fromEntries(
        Object.entries(typeScale).map(([k, v]) => [k, { $value: `${v}px`, $type: 'dimension' }])
      ),
    },
    radius: {
      sm: { $value: `${radii.sm}px`, $type: 'dimension' },
      md: { $value: `${radii.md}px`, $type: 'dimension' },
      lg: { $value: `${radii.lg}px`, $type: 'dimension' },
      xl: { $value: `${radii.xl}px`, $type: 'dimension' },
      full: { $value: `${radii.full}px`, $type: 'dimension' },
    },
    spacing: {
      unit: { $value: `${state.geometry.spacingUnit}px`, $type: 'dimension' },
      cardPadding: { $value: `${state.geometry.cardPadding}px`, $type: 'dimension' },
      elementGap: { $value: `${state.geometry.elementGap}px`, $type: 'dimension' },
      scale: Object.fromEntries(
        Object.entries(spacing).map(([k, v]) => [k, { $value: `${v}px`, $type: 'dimension' }])
      ),
    },
    elevation: {
      style: state.geometry.elevationStyle,
      light: shadows.light,
      dark: shadows.dark,
    },
  };

  return JSON.stringify(payload, null, 2);
}

export function generateCssVariables(state: DesignTokenState): string {
  const scales = buildAllScales(state.colors);
  const raw = getRawColorMap(state);
  const light = deriveSemanticTheme(scales, raw, 'light', state.contrastLevel);
  const dark = deriveSemanticTheme(scales, raw, 'dark', state.contrastLevel);
  const typeScale = getTypeScale(state.typography.baseSize, state.typography.scaleRatio);
  const radii = getRadiusScale(state.geometry.radiusBase);
  const spacing = getSpacingScale(state.geometry.spacingUnit);
  const shadows = getElevationShadows(state.geometry.elevationStyle);
  const fontsUrl = getGoogleFontsImportUrl(
    state.typography.headingFont,
    state.typography.bodyFont,
    state.typography.monoFont
  );

  const rampLines = (role: ColorRole) =>
    SHADE_STEPS.map((s) => `  --color-${role}-${s}: ${scales[role][s]};`).join('\n');

  const semanticBlock = (t: typeof light) => `  --color-canvas: ${t.canvas};
  --color-surface: ${t.surface};
  --color-surface-raised: ${t.surfaceRaised};
  --color-surface-muted: ${t.surfaceMuted};
  --color-border: ${t.border};
  --color-border-strong: ${t.borderStrong};
  --color-text: ${t.text};
  --color-text-secondary: ${t.textSecondary};
  --color-text-muted: ${t.textMuted};
  --color-primary: ${t.primary};
  --color-primary-hover: ${t.primaryHover};
  --color-on-primary: ${t.onPrimary};
  --color-secondary: ${t.secondary};
  --color-on-secondary: ${t.onSecondary};
  --color-accent: ${t.accent};
  --color-on-accent: ${t.onAccent};
  --color-success: ${t.success};
  --color-success-surface: ${t.successSurface};
  --color-warning: ${t.warning};
  --color-warning-surface: ${t.warningSurface};
  --color-destructive: ${t.destructive};
  --color-destructive-surface: ${t.destructiveSurface};`;

  return `/* ${state.brandName || 'Design System'} — Generated Design Tokens (${state.contrastLevel}) */
@import url("${fontsUrl}");

:root {
  /* Base & Scale Colors */
  --color-primary-base: ${raw.primary};
${rampLines('primary')}

  --color-secondary-base: ${raw.secondary};
${rampLines('secondary')}

  --color-accent-base: ${raw.accent};
${rampLines('accent')}

  --color-neutral-base: ${raw.neutral};
${rampLines('neutral')}

  /* Semantic Tokens (Light Mode) */
${semanticBlock(light)}

  /* Typography */
  --font-heading: "${state.typography.headingFont}", sans-serif;
  --font-body: "${state.typography.bodyFont}", sans-serif;
  --font-mono: "${state.typography.monoFont}", monospace;
  --font-weight-heading: ${state.typography.headingWeight};
  --font-weight-body: ${state.typography.bodyWeight};
  --tracking-heading: ${state.typography.headingTracking}em;
  --leading-body: ${state.typography.lineHeight};
  --text-xs: ${typeScale.xs}px;
  --text-sm: ${typeScale.sm}px;
  --text-base: ${typeScale.base}px;
  --text-lg: ${typeScale.lg}px;
  --text-xl: ${typeScale.xl}px;
  --text-2xl: ${typeScale['2xl']}px;
  --text-3xl: ${typeScale['3xl']}px;
  --text-4xl: ${typeScale['4xl']}px;

  /* Geometry & Spacing */
  --radius-sm: ${radii.sm}px;
  --radius-md: ${radii.md}px;
  --radius-lg: ${radii.lg}px;
  --radius-xl: ${radii.xl}px;
  --spacing-unit: ${state.geometry.spacingUnit}px;
  --spacing-card-padding: ${state.geometry.cardPadding}px;
  --spacing-gap: ${state.geometry.elementGap}px;
  --space-1: ${spacing[1]}px;
  --space-2: ${spacing[2]}px;
  --space-3: ${spacing[3]}px;
  --space-4: ${spacing[4]}px;
  --space-6: ${spacing[6]}px;
  --space-8: ${spacing[8]}px;

  /* Elevations (Light Mode) */
  --shadow-sm: ${shadows.light.sm};
  --shadow-md: ${shadows.light.md};
  --shadow-lg: ${shadows.light.lg};
}

.dark {
  /* Semantic Tokens (Dark Mode) */
${semanticBlock(dark)}

  /* Elevations (Dark Mode) */
  --shadow-sm: ${shadows.dark.sm};
  --shadow-md: ${shadows.dark.md};
  --shadow-lg: ${shadows.dark.lg};
}
`;
}

export function generateTailwindConfig(state: DesignTokenState): string {
  const scales = buildAllScales(state.colors);
  const raw = getRawColorMap(state);
  const light = deriveSemanticTheme(scales, raw, 'light', state.contrastLevel);
  const dark = deriveSemanticTheme(scales, raw, 'dark', state.contrastLevel);
  const radii = getRadiusScale(state.geometry.radiusBase);
  const shadows = getElevationShadows(state.geometry.elevationStyle);
  const fontsUrl = getGoogleFontsImportUrl(
    state.typography.headingFont,
    state.typography.bodyFont,
    state.typography.monoFont
  );

  const tailwindRamp = (role: ColorRole) =>
    SHADE_STEPS.map((s) => `  --color-${role}-${s}: ${scales[role][s]};`).join('\n');

  const semanticVarLines = (t: typeof light) => `  --semantic-canvas: ${t.canvas};
  --semantic-surface: ${t.surface};
  --semantic-surface-raised: ${t.surfaceRaised};
  --semantic-surface-muted: ${t.surfaceMuted};
  --semantic-border: ${t.border};
  --semantic-border-strong: ${t.borderStrong};
  --semantic-text: ${t.text};
  --semantic-text-secondary: ${t.textSecondary};
  --semantic-text-muted: ${t.textMuted};
  --semantic-primary: ${t.primary};
  --semantic-primary-hover: ${t.primaryHover};
  --semantic-on-primary: ${t.onPrimary};
  --semantic-secondary: ${t.secondary};
  --semantic-on-secondary: ${t.onSecondary};
  --semantic-accent: ${t.accent};
  --semantic-on-accent: ${t.onAccent};
  --semantic-success: ${t.success};
  --semantic-success-surface: ${t.successSurface};
  --semantic-warning: ${t.warning};
  --semantic-warning-surface: ${t.warningSurface};
  --semantic-destructive: ${t.destructive};
  --semantic-destructive-surface: ${t.destructiveSurface};`;

  return `/* Tailwind CSS v4 Theme Configuration — ${state.brandName || 'Design System'} (${state.contrastLevel}) */
@import url("${fontsUrl}");
@import "tailwindcss";
@custom-variant dark (&:where(.dark, .dark *));

@theme {
  /* Fonts */
  --font-display: "${state.typography.headingFont}", sans-serif;
  --font-sans: "${state.typography.bodyFont}", sans-serif;
  --font-mono: "${state.typography.monoFont}", monospace;

  /* Color Scales */
${tailwindRamp('primary')}
${tailwindRamp('secondary')}
${tailwindRamp('accent')}
${tailwindRamp('neutral')}

  /* Semantic Aliases */
  --color-canvas: var(--semantic-canvas);
  --color-surface: var(--semantic-surface);
  --color-surface-raised: var(--semantic-surface-raised);
  --color-surface-muted: var(--semantic-surface-muted);
  --color-border: var(--semantic-border);
  --color-border-strong: var(--semantic-border-strong);
  --color-text: var(--semantic-text);
  --color-text-secondary: var(--semantic-text-secondary);
  --color-text-muted: var(--semantic-text-muted);
  --color-primary: var(--semantic-primary);
  --color-primary-hover: var(--semantic-primary-hover);
  --color-on-primary: var(--semantic-on-primary);
  --color-secondary: var(--semantic-secondary);
  --color-on-secondary: var(--semantic-on-secondary);
  --color-accent: var(--semantic-accent);
  --color-on-accent: var(--semantic-on-accent);
  --color-success: var(--semantic-success);
  --color-success-surface: var(--semantic-success-surface);
  --color-warning: var(--semantic-warning);
  --color-warning-surface: var(--semantic-warning-surface);
  --color-destructive: var(--semantic-destructive);
  --color-destructive-surface: var(--semantic-destructive-surface);

  /* Border Radius */
  --radius-sm: ${radii.sm}px;
  --radius-md: ${radii.md}px;
  --radius-lg: ${radii.lg}px;
  --radius-xl: ${radii.xl}px;

  /* Spacing & Layout */
  --spacing-card: ${state.geometry.cardPadding}px;
  --spacing-gap: ${state.geometry.elementGap}px;

  /* Shadows */
  --shadow-card: var(--semantic-shadow-sm);
  --shadow-raised: var(--semantic-shadow-md);
  --shadow-floating: var(--semantic-shadow-lg);
}

:root {
${semanticVarLines(light)}
  --semantic-shadow-sm: ${shadows.light.sm};
  --semantic-shadow-md: ${shadows.light.md};
  --semantic-shadow-lg: ${shadows.light.lg};
}

.dark {
${semanticVarLines(dark)}
  --semantic-shadow-sm: ${shadows.dark.sm};
  --semantic-shadow-md: ${shadows.dark.md};
  --semantic-shadow-lg: ${shadows.dark.lg};
}
`;
}

export function generateDesignTokenMd(state: DesignTokenState): string {
  const scales = buildAllScales(state.colors);
  const raw = getRawColorMap(state);
  const light = deriveSemanticTheme(scales, raw, 'light', state.contrastLevel);
  const dark = deriveSemanticTheme(scales, raw, 'dark', state.contrastLevel);
  const typeScale = getTypeScale(state.typography.baseSize, state.typography.scaleRatio);
  const radii = getRadiusScale(state.geometry.radiusBase);
  const shadows = getElevationShadows(state.geometry.elevationStyle);
  const fontsUrl = getGoogleFontsImportUrl(
    state.typography.headingFont,
    state.typography.bodyFont,
    state.typography.monoFont
  );

  return `# ${state.brandName || 'Design System'} — tokens.md

> Especificación de tokens de diseño lista para desarrollo web y agentes de código (nivel objetivo: WCAG 2.2 ${state.contrastLevel}).

## 1. Paleta Cromática

| Rol | HEX Base | Uso Principal |
| --- | --- | --- |
| Primary | \`${raw.primary}\` | Acciones primarias, CTAs, enlaces activos y foco |
| Secondary | \`${raw.secondary}\` | Botones secundarios, etiquetas estructurales |
| Accent | \`${raw.accent}\` | Indicadores destacados, acentos clave |
| Neutral | \`${raw.neutral}\` | Fondos Light/Dark, bordes y jerarquía de texto |

### Tokens Semánticos (Light Mode vs Dark Mode)

| Token | Light Mode | Dark Mode |
| --- | --- | --- |
| \`canvas\` | \`${light.canvas}\` | \`${dark.canvas}\` |
| \`surface\` | \`${light.surface}\` | \`${dark.surface}\` |
| \`surface-raised\` | \`${light.surfaceRaised}\` | \`${dark.surfaceRaised}\` |
| \`surface-muted\` | \`${light.surfaceMuted}\` | \`${dark.surfaceMuted}\` |
| \`border\` | \`${light.border}\` | \`${dark.border}\` |
| \`border-strong\` | \`${light.borderStrong}\` | \`${dark.borderStrong}\` |
| \`text\` | \`${light.text}\` | \`${dark.text}\` |
| \`text-secondary\` | \`${light.textSecondary}\` | \`${dark.textSecondary}\` |
| \`text-muted\` | \`${light.textMuted}\` | \`${dark.textMuted}\` |
| \`primary\` | \`${light.primary}\` | \`${dark.primary}\` |
| \`primary-hover\` | \`${light.primaryHover}\` | \`${dark.primaryHover}\` |
| \`on-primary\` | \`${light.onPrimary}\` | \`${dark.onPrimary}\` |
| \`secondary\` | \`${light.secondary}\` | \`${dark.secondary}\` |
| \`on-secondary\` | \`${light.onSecondary}\` | \`${dark.onSecondary}\` |
| \`accent\` | \`${light.accent}\` | \`${dark.accent}\` |
| \`on-accent\` | \`${light.onAccent}\` | \`${dark.onAccent}\` |
| \`success\` / \`success-surface\` | \`${light.success}\` / \`${light.successSurface}\` | \`${dark.success}\` / \`${dark.successSurface}\` |
| \`warning\` / \`warning-surface\` | \`${light.warning}\` / \`${light.warningSurface}\` | \`${dark.warning}\` / \`${dark.warningSurface}\` |
| \`destructive\` / \`destructive-surface\` | \`${light.destructive}\` / \`${light.destructiveSurface}\` | \`${dark.destructive}\` / \`${dark.destructiveSurface}\` |

## 2. Tipografía (Google Fonts)

- **Import**: \`${fontsUrl}\`
- **Títulos (Display / Headings)**: \`${state.typography.headingFont}\` · Weight \`${state.typography.headingWeight}\` · Tracking \`${state.typography.headingTracking}em\`
- **Párrafos y UI (Body)**: \`${state.typography.bodyFont}\` · Weight \`${state.typography.bodyWeight}\` · Line Height \`${state.typography.lineHeight}\`
- **Monospace**: \`${state.typography.monoFont}\`

### Escala Tipográfica (Ratio \`${state.typography.scaleRatio}\` desde \`${state.typography.baseSize}px\`)

- \`display\`: \`${typeScale['4xl']}px\`
- \`h1\`: \`${typeScale['3xl']}px\`
- \`h2\`: \`${typeScale['2xl']}px\`
- \`h3\`: \`${typeScale.xl}px\`
- \`body\`: \`${typeScale.base}px\`
- \`sm\`: \`${typeScale.sm}px\`
- \`xs\`: \`${typeScale.xs}px\`

## 3. Geometría, Espaciado y Elevación

- **Border Radius**: \`sm: ${radii.sm}px\` · \`md: ${radii.md}px\` · \`lg: ${radii.lg}px\` · \`xl: ${radii.xl}px\`
- **Unidad Base**: \`${state.geometry.spacingUnit}px\`
- **Card Padding**: \`${state.geometry.cardPadding}px\`
- **Element Gap**: \`${state.geometry.elementGap}px\`
- **Estilo de Elevación**: \`${state.geometry.elevationStyle}\`
  - Light \`shadow-md\`: \`${shadows.light.md}\`
  - Dark \`shadow-md\`: \`${shadows.dark.md}\`

${contrastSection(state)}`;
}

function contrastSection(state: DesignTokenState): string {
  const level = state.contrastLevel;
  const report = auditContrast(state.colors, level);
  const textMin = level === 'AAA' ? '7:1' : '4.5:1';
  const rows = report.checks
    .map(
      (c) =>
        `| ${c.label} | ${MODE_LABELS[c.mode]} | \`${c.fg}\` sobre \`${c.bg}\` | ${formatRatio(c.ratio)}:1 | ${c.required}:1 | ${c.passes ? 'Cumple' : '**No cumple**'} |`
    )
    .join('\n');
  return `## 4. Accesibilidad (contraste WCAG 2.2 ${level})

${report.passed} de ${report.total} combinaciones cumplen. Texto: ${textMin}. Elementos de interfaz y bordes: 3:1.

| Combinación | Modo | Colores | Ratio | Mínimo | Estado |
| --- | --- | --- | --- | --- | --- |
${rows}
`;
}

const VALID_HARMONIES: HarmonyMode[] = [
  'curated',
  'analogous',
  'complementary',
  'split-complementary',
  'triadic',
  'tetradic',
  'monochromatic',
  'high-contrast',
];

const VALID_ELEVATIONS: ElevationStyle[] = ['flat', 'soft', 'crisp', 'elevated'];
const REQUIRED_ROLES: ColorRole[] = ['primary', 'secondary', 'accent', 'neutral'];

function clampNum(val: unknown, min: number, max: number, fallback: number): number {
  return typeof val === 'number' && Number.isFinite(val) ? Math.min(max, Math.max(min, val)) : fallback;
}

/**
 * Validates and normalizes an untrusted parsed JSON object (from localStorage or URL hash)
 * into a complete DesignTokenState. Returns null if the core color roles are invalid/missing.
 */
export function sanitizeDesignTokenState(
  raw: unknown,
  fallback: DesignTokenState
): DesignTokenState | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;

  if (!Array.isArray(obj.colors)) return null;
  const normalizedColors: PaletteColor[] = [];
  for (const role of REQUIRED_ROLES) {
    const found = obj.colors.find(
      (c): c is Record<string, unknown> =>
        !!c && typeof c === 'object' && (c as Record<string, unknown>).role === role
    );
    if (!found || typeof found.hex !== 'string' || !isValidHex(found.hex)) {
      return null;
    }
    normalizedColors.push({
      role,
      label: ROLE_LABELS[role],
      hex: normalizeHex(found.hex),
      locked: Boolean(found.locked),
    });
  }

  const typoObj =
    obj.typography && typeof obj.typography === 'object'
      ? (obj.typography as Record<string, unknown>)
      : {};
  const geoObj =
    obj.geometry && typeof obj.geometry === 'object'
      ? (obj.geometry as Record<string, unknown>)
      : {};

  const harmonyMode =
    typeof obj.harmonyMode === 'string' && VALID_HARMONIES.includes(obj.harmonyMode as HarmonyMode)
      ? (obj.harmonyMode as HarmonyMode)
      : fallback.harmonyMode;

  const contrastLevel: ContrastLevel =
    obj.contrastLevel === 'AAA' || obj.contrastLevel === 'AA'
      ? obj.contrastLevel
      : fallback.contrastLevel;

  const elevationStyle =
    typeof geoObj.elevationStyle === 'string' &&
    VALID_ELEVATIONS.includes(geoObj.elevationStyle as ElevationStyle)
      ? (geoObj.elevationStyle as ElevationStyle)
      : fallback.geometry.elevationStyle;

  return {
    brandName:
      typeof obj.brandName === 'string' ? obj.brandName.slice(0, 60) : fallback.brandName,
    harmonyMode,
    contrastLevel,
    colors: normalizedColors,
    typography: {
      pairingId:
        typeof typoObj.pairingId === 'string' && typoObj.pairingId.trim()
          ? typoObj.pairingId
          : fallback.typography.pairingId,
      headingFont:
        typeof typoObj.headingFont === 'string' && typoObj.headingFont.trim()
          ? typoObj.headingFont
          : fallback.typography.headingFont,
      headingWeight: clampNum(typoObj.headingWeight, 300, 900, fallback.typography.headingWeight),
      headingTracking: clampNum(
        typoObj.headingTracking,
        -0.06,
        0.05,
        fallback.typography.headingTracking
      ),
      bodyFont:
        typeof typoObj.bodyFont === 'string' && typoObj.bodyFont.trim()
          ? typoObj.bodyFont
          : fallback.typography.bodyFont,
      bodyWeight: clampNum(typoObj.bodyWeight, 300, 800, fallback.typography.bodyWeight),
      monoFont:
        typeof typoObj.monoFont === 'string' && typoObj.monoFont.trim()
          ? typoObj.monoFont
          : fallback.typography.monoFont,
      baseSize: clampNum(typoObj.baseSize, 12, 22, fallback.typography.baseSize),
      scaleRatio: clampNum(typoObj.scaleRatio, 1.05, 1.5, fallback.typography.scaleRatio),
      lineHeight: clampNum(typoObj.lineHeight, 1.2, 2.0, fallback.typography.lineHeight),
    },
    geometry: {
      radiusBase: clampNum(geoObj.radiusBase, 0, 32, fallback.geometry.radiusBase),
      spacingUnit: geoObj.spacingUnit === 8 ? 8 : 4,
      cardPadding: clampNum(geoObj.cardPadding, 12, 48, fallback.geometry.cardPadding),
      elementGap: clampNum(geoObj.elementGap, 4, 40, fallback.geometry.elementGap),
      elevationStyle,
    },
  };
}

export function encodeStateToHash(state: DesignTokenState): string {
  try {
    const json = JSON.stringify(state);
    const bytes = new TextEncoder().encode(json);
    let bin = '';
    bytes.forEach((b) => {
      bin += String.fromCharCode(b);
    });
    return btoa(bin);
  } catch {
    return '';
  }
}

export function decodeStateFromHash(
  hash: string,
  fallback: DesignTokenState
): DesignTokenState | null {
  try {
    const cleaned = hash.replace(/^#state=/, '').trim();
    if (!cleaned) return null;
    const bin = atob(cleaned);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    const parsed: unknown = JSON.parse(json);
    return sanitizeDesignTokenState(parsed, fallback);
  } catch {
    return null;
  }
}
