import { ColorRole, DesignTokenState, ElevationStyle, ShadeScale } from '../types/tokens';
import {
  buildAllScales,
  deriveSemanticTheme,
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
  const light = deriveSemanticTheme(scales, raw, 'light');
  const dark = deriveSemanticTheme(scales, raw, 'dark');
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

  const payload = {
    $schema: 'https://tr.designtokens.org/format/',
    brand: state.brandName || 'Untitled System',
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
        light: {
          canvas: { $value: light.canvas, $type: 'color' },
          surface: { $value: light.surface, $type: 'color' },
          surfaceMuted: { $value: light.surfaceMuted, $type: 'color' },
          border: { $value: light.border, $type: 'color' },
          text: { $value: light.text, $type: 'color' },
          textSecondary: { $value: light.textSecondary, $type: 'color' },
          textMuted: { $value: light.textMuted, $type: 'color' },
          primary: { $value: light.primary, $type: 'color' },
          onPrimary: { $value: light.onPrimary, $type: 'color' },
          secondary: { $value: light.secondary, $type: 'color' },
          onSecondary: { $value: light.onSecondary, $type: 'color' },
          accent: { $value: light.accent, $type: 'color' },
          onAccent: { $value: light.onAccent, $type: 'color' },
        },
        dark: {
          canvas: { $value: dark.canvas, $type: 'color' },
          surface: { $value: dark.surface, $type: 'color' },
          surfaceMuted: { $value: dark.surfaceMuted, $type: 'color' },
          border: { $value: dark.border, $type: 'color' },
          text: { $value: dark.text, $type: 'color' },
          textSecondary: { $value: dark.textSecondary, $type: 'color' },
          textMuted: { $value: dark.textMuted, $type: 'color' },
          primary: { $value: dark.primary, $type: 'color' },
          onPrimary: { $value: dark.onPrimary, $type: 'color' },
          secondary: { $value: dark.secondary, $type: 'color' },
          onSecondary: { $value: dark.onSecondary, $type: 'color' },
          accent: { $value: dark.accent, $type: 'color' },
          onAccent: { $value: dark.onAccent, $type: 'color' },
        },
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
  const light = deriveSemanticTheme(scales, raw, 'light');
  const dark = deriveSemanticTheme(scales, raw, 'dark');
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

  return `/* ${state.brandName || 'Design System'} — Generated Design Tokens */
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
  --color-canvas: ${light.canvas};
  --color-surface: ${light.surface};
  --color-surface-muted: ${light.surfaceMuted};
  --color-border: ${light.border};
  --color-border-strong: ${light.borderStrong};
  --color-text: ${light.text};
  --color-text-secondary: ${light.textSecondary};
  --color-text-muted: ${light.textMuted};
  --color-primary: ${light.primary};
  --color-primary-hover: ${light.primaryHover};
  --color-on-primary: ${light.onPrimary};
  --color-secondary: ${light.secondary};
  --color-on-secondary: ${light.onSecondary};
  --color-accent: ${light.accent};
  --color-on-accent: ${light.onAccent};

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
  --color-canvas: ${dark.canvas};
  --color-surface: ${dark.surface};
  --color-surface-muted: ${dark.surfaceMuted};
  --color-border: ${dark.border};
  --color-border-strong: ${dark.borderStrong};
  --color-text: ${dark.text};
  --color-text-secondary: ${dark.textSecondary};
  --color-text-muted: ${dark.textMuted};
  --color-primary: ${dark.primary};
  --color-primary-hover: ${dark.primaryHover};
  --color-on-primary: ${dark.onPrimary};
  --color-secondary: ${dark.secondary};
  --color-on-secondary: ${dark.onSecondary};
  --color-accent: ${dark.accent};
  --color-on-accent: ${dark.onAccent};

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
  const light = deriveSemanticTheme(scales, raw, 'light');
  const dark = deriveSemanticTheme(scales, raw, 'dark');
  const radii = getRadiusScale(state.geometry.radiusBase);
  const shadows = getElevationShadows(state.geometry.elevationStyle);
  const fontsUrl = getGoogleFontsImportUrl(
    state.typography.headingFont,
    state.typography.bodyFont,
    state.typography.monoFont
  );

  const tailwindRamp = (role: ColorRole) =>
    SHADE_STEPS.map((s) => `  --color-${role}-${s}: ${scales[role][s]};`).join('\n');

  return `/* Tailwind CSS v4 Theme Configuration — ${state.brandName || 'Design System'} */
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
  --color-border: var(--semantic-border);
  --color-ink: var(--semantic-text);
  --color-brand: var(--semantic-primary);
  --color-brand-accent: var(--semantic-accent);

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
  --semantic-canvas: ${light.canvas};
  --semantic-surface: ${light.surface};
  --semantic-border: ${light.border};
  --semantic-text: ${light.text};
  --semantic-primary: ${light.primary};
  --semantic-accent: ${light.accent};
  --semantic-shadow-sm: ${shadows.light.sm};
  --semantic-shadow-md: ${shadows.light.md};
  --semantic-shadow-lg: ${shadows.light.lg};
}

.dark {
  --semantic-canvas: ${dark.canvas};
  --semantic-surface: ${dark.surface};
  --semantic-border: ${dark.border};
  --semantic-text: ${dark.text};
  --semantic-primary: ${dark.primary};
  --semantic-accent: ${dark.accent};
  --semantic-shadow-sm: ${shadows.dark.sm};
  --semantic-shadow-md: ${shadows.dark.md};
  --semantic-shadow-lg: ${shadows.dark.lg};
}
`;
}

export function generateDesignTokenMd(state: DesignTokenState): string {
  const scales = buildAllScales(state.colors);
  const raw = getRawColorMap(state);
  const light = deriveSemanticTheme(scales, raw, 'light');
  const dark = deriveSemanticTheme(scales, raw, 'dark');
  const typeScale = getTypeScale(state.typography.baseSize, state.typography.scaleRatio);
  const radii = getRadiusScale(state.geometry.radiusBase);
  const shadows = getElevationShadows(state.geometry.elevationStyle);
  const fontsUrl = getGoogleFontsImportUrl(
    state.typography.headingFont,
    state.typography.bodyFont,
    state.typography.monoFont
  );

  return `# ${state.brandName || 'Design System'} — designtoken.md

> Especificación de tokens de diseño lista para desarrollo web y agentes de código.

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
| \`border\` | \`${light.border}\` | \`${dark.border}\` |
| \`text\` | \`${light.text}\` | \`${dark.text}\` |
| \`text-muted\` | \`${light.textMuted}\` | \`${dark.textMuted}\` |
| \`primary\` | \`${light.primary}\` | \`${dark.primary}\` |
| \`on-primary\` | \`${light.onPrimary}\` | \`${dark.onPrimary}\` |

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
  const report = auditContrast(state.colors, 'AA');
  const rows = report.checks
    .map(
      (c) =>
        `| ${c.label} | ${MODE_LABELS[c.mode]} | \`${c.fg}\` sobre \`${c.bg}\` | ${formatRatio(c.ratio)}:1 | ${c.required}:1 | ${c.passes ? 'Cumple' : '**No cumple**'} |`
    )
    .join('\n');
  return `## 4. Accesibilidad (contraste WCAG 2.2 AA)

${report.passed} de ${report.total} combinaciones cumplen. Texto: 4.5:1. Elementos de interfaz: 3:1.

| Combinación | Modo | Colores | Ratio | Mínimo | Estado |
| --- | --- | --- | --- | --- | --- |
${rows}
`;
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

export function decodeStateFromHash(hash: string): DesignTokenState | null {
  try {
    const cleaned = hash.replace(/^#state=/, '').trim();
    if (!cleaned) return null;
    const bin = atob(cleaned);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(json) as DesignTokenState;
    if (parsed && Array.isArray(parsed.colors) && parsed.typography && parsed.geometry) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}
