import { ColorRole, DesignTokenState } from '../types/tokens';
import {
  buildAllScales,
  deriveSemanticTheme,
  hexToRgb,
  normalizeHex,
  SemanticThemeColors,
  SHADE_STEPS,
} from './colorEngine';
import { getElevationShadows, getRadiusScale, getSpacingScale, getTypeScale } from './tokenExporters';

/**
 * Exportadores para Figma.
 *
 * - Variables nativas de Figma: un archivo DTCG por modo (Light / Dark). Figma
 *   crea un modo por archivo importado, así que cada archivo es autocontenido
 *   (paleta + semánticos) y los alias apuntan dentro del mismo archivo.
 * - Tokens Studio: un único JSON con token sets, $themes y $metadata. Incluye
 *   además tipografías compuestas y sombras, que Figma nativo no admite.
 */

export interface ExportFile {
  filename: string;
  content: string;
  mimeType: string;
}

const ROLES: ColorRole[] = ['primary', 'secondary', 'accent', 'neutral'];

type Json = Record<string, unknown>;

function buildModel(state: DesignTokenState) {
  const scales = buildAllScales(state.colors);
  const raw = Object.fromEntries(state.colors.map((c) => [c.role, normalizeHex(c.hex)])) as Record<
    ColorRole,
    string
  >;

  // hex -> referencia a la paleta, para que los semánticos queden como alias.
  // Los colores ajustados por contraste que no coinciden con un tono quedan como valor directo.
  const aliasByHex = new Map<string, string>();
  for (const role of ROLES) {
    const add = (key: string, hex: string) => {
      const h = normalizeHex(hex);
      if (!aliasByHex.has(h)) aliasByHex.set(h, `palette.${role}.${key}`);
    };
    add('base', raw[role]);
    for (const step of SHADE_STEPS) add(String(step), scales[role][step]);
  }

  return {
    scales,
    raw,
    aliasByHex,
    light: deriveSemanticTheme(scales, raw, 'light', state.contrastLevel),
    dark: deriveSemanticTheme(scales, raw, 'dark', state.contrastLevel),
    typeScale: getTypeScale(state.typography.baseSize, state.typography.scaleRatio),
    radii: getRadiusScale(state.geometry.radiusBase),
    spacing: getSpacingScale(state.geometry.spacingUnit),
    shadows: getElevationShadows(state.geometry.elevationStyle),
  };
}

type Model = ReturnType<typeof buildModel>;

function toKebab(key: string) {
  return key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}

function aliasOr(model: Model, hex: string): string | null {
  const ref = model.aliasByHex.get(normalizeHex(hex));
  return ref ? `{${ref}}` : null;
}

/* ------------------------------------------------------------------ */
/* Variables nativas de Figma                                          */
/* ------------------------------------------------------------------ */

function figmaColor(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const round = (n: number) => Math.round((n / 255) * 10000) / 10000;
  return {
    colorSpace: 'srgb',
    components: [round(r), round(g), round(b)],
    alpha: 1,
    hex: normalizeHex(hex).toLowerCase(),
  };
}

const px = (value: number) => ({ $type: 'dimension', $value: { value, unit: 'px' } });

function buildFigmaMode(state: DesignTokenState, model: Model, theme: SemanticThemeColors): Json {
  const palette: Json = {};
  for (const role of ROLES) {
    const group: Json = { base: { $type: 'color', $value: figmaColor(model.raw[role]) } };
    for (const step of SHADE_STEPS) {
      group[String(step)] = { $type: 'color', $value: figmaColor(model.scales[role][step]) };
    }
    palette[role] = group;
  }

  const color: Json = {};
  for (const [key, hex] of Object.entries(theme)) {
    color[toKebab(key)] = { $type: 'color', $value: aliasOr(model, hex) ?? figmaColor(hex) };
  }

  const t = state.typography;
  const g = state.geometry;

  return {
    palette,
    color,
    font: {
      family: {
        heading: { $type: 'fontFamily', $value: t.headingFont },
        body: { $type: 'fontFamily', $value: t.bodyFont },
        mono: { $type: 'fontFamily', $value: t.monoFont },
      },
      weight: {
        heading: { $type: 'number', $value: t.headingWeight },
        body: { $type: 'number', $value: t.bodyWeight },
      },
      size: Object.fromEntries(Object.entries(model.typeScale).map(([k, v]) => [k, px(v)])),
      'line-height': {
        body: { $type: 'number', $value: t.lineHeight },
      },
    },
    radius: Object.fromEntries(Object.entries(model.radii).map(([k, v]) => [k, px(v)])),
    spacing: {
      ...Object.fromEntries(Object.entries(model.spacing).map(([k, v]) => [k, px(v)])),
      'card-padding': px(g.cardPadding),
      'element-gap': px(g.elementGap),
    },
  };
}

export function generateFigmaVariables(state: DesignTokenState): ExportFile[] {
  const model = buildModel(state);
  return (['Light', 'Dark'] as const).map((mode) => ({
    filename: `${mode}.json`,
    mimeType: 'application/json',
    content: JSON.stringify(
      buildFigmaMode(state, model, mode === 'Light' ? model.light : model.dark),
      null,
      2
    ),
  }));
}

/* ------------------------------------------------------------------ */
/* Tokens Studio                                                       */
/* ------------------------------------------------------------------ */

function rgbaToHex8(input: string): string {
  const m = input.match(/rgba?\(([^)]+)\)/i);
  if (!m) return input.startsWith('#') ? input.toLowerCase() : input;
  const [r, g, b, a = '1'] = m[1].split(',').map((s) => s.trim());
  const hex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${hex(+r)}${hex(+g)}${hex(+b)}${hex(parseFloat(a) * 255)}`;
}

/** Convierte un box-shadow CSS en el formato boxShadow de Tokens Studio. */
export function parseCssShadow(css: string) {
  const layers = css.split(/,(?![^(]*\))/).map((s) => s.trim()).filter(Boolean);
  return layers.map((layer) => {
    const colorMatch = layer.match(/rgba?\([^)]*\)|#[0-9a-f]{3,8}/i);
    const lengths = layer
      .replace(colorMatch?.[0] ?? '', '')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((v) => String(parseFloat(v)));
    const [x = '0', y = '0', blur = '0', spread = '0'] = lengths;
    return {
      x,
      y,
      blur,
      spread,
      color: colorMatch ? rgbaToHex8(colorMatch[0]) : '#00000000',
      type: /\binset\b/.test(layer) ? 'innerShadow' : 'dropShadow',
    };
  });
}

const pct = (n: number) => `${Math.round(n * 1000) / 10}%`;

function buildStudioSemantic(model: Model, theme: SemanticThemeColors, mode: 'light' | 'dark'): Json {
  const color: Json = {};
  for (const [key, hex] of Object.entries(theme)) {
    color[toKebab(key)] = { $type: 'color', $value: aliasOr(model, hex) ?? normalizeHex(hex) };
  }
  const shadow = Object.fromEntries(
    Object.entries(model.shadows[mode]).map(([k, v]) => [
      k,
      { $type: 'boxShadow', $value: parseCssShadow(v) },
    ])
  );
  return { color, shadow };
}

export function generateTokensStudio(state: DesignTokenState): string {
  const model = buildModel(state);
  const t = state.typography;
  const g = state.geometry;

  const palette: Json = {};
  for (const role of ROLES) {
    const group: Json = { base: { $type: 'color', $value: model.raw[role] } };
    for (const step of SHADE_STEPS) {
      group[String(step)] = { $type: 'color', $value: model.scales[role][step] };
    }
    palette[role] = group;
  }

  const dim = (type: string, v: number) => ({ $type: type, $value: `${v}px` });

  const primitives = {
    palette,
    fontFamilies: {
      heading: { $type: 'fontFamilies', $value: t.headingFont },
      body: { $type: 'fontFamilies', $value: t.bodyFont },
      mono: { $type: 'fontFamilies', $value: t.monoFont },
    },
    fontWeights: {
      heading: { $type: 'fontWeights', $value: String(t.headingWeight) },
      body: { $type: 'fontWeights', $value: String(t.bodyWeight) },
      mono: { $type: 'fontWeights', $value: '400' },
    },
    fontSizes: Object.fromEntries(
      Object.entries(model.typeScale).map(([k, v]) => [k, dim('fontSizes', v)])
    ),
    lineHeights: {
      display: { $type: 'lineHeights', $value: '112%' },
      heading: { $type: 'lineHeights', $value: '122%' },
      body: { $type: 'lineHeights', $value: pct(t.lineHeight) },
    },
    letterSpacing: {
      heading: { $type: 'letterSpacing', $value: pct(t.headingTracking) },
      body: { $type: 'letterSpacing', $value: '0%' },
    },
    borderRadius: Object.fromEntries(
      Object.entries(model.radii).map(([k, v]) => [k, dim('borderRadius', v)])
    ),
    spacing: {
      ...Object.fromEntries(Object.entries(model.spacing).map(([k, v]) => [k, dim('spacing', v)])),
      'card-padding': dim('spacing', g.cardPadding),
      'element-gap': dim('spacing', g.elementGap),
    },
  };

  const textStyle = (
    family: string,
    weight: string,
    size: string,
    lineHeight: string,
    letterSpacing: string
  ) => ({
    $type: 'typography',
    $value: {
      fontFamily: `{fontFamilies.${family}}`,
      fontWeight: `{fontWeights.${weight}}`,
      fontSize: `{fontSizes.${size}}`,
      lineHeight: `{lineHeights.${lineHeight}}`,
      letterSpacing: `{letterSpacing.${letterSpacing}}`,
    },
  });

  const typography = {
    text: {
      display: textStyle('heading', 'heading', '4xl', 'display', 'heading'),
      h1: textStyle('heading', 'heading', '3xl', 'display', 'heading'),
      h2: textStyle('heading', 'heading', '2xl', 'heading', 'heading'),
      h3: textStyle('heading', 'heading', 'xl', 'heading', 'heading'),
      body: textStyle('body', 'body', 'base', 'body', 'body'),
      small: textStyle('body', 'body', 'sm', 'body', 'body'),
      code: textStyle('mono', 'mono', 'sm', 'body', 'body'),
    },
  };

  const sets = ['primitives', 'typography', 'light', 'dark'] as const;
  const theme = (id: 'light' | 'dark', name: string) => ({
    id,
    name,
    group: 'Mode',
    selectedTokenSets: {
      primitives: 'enabled',
      typography: 'enabled',
      [id]: 'enabled',
    },
  });

  const payload = {
    primitives,
    typography,
    light: buildStudioSemantic(model, model.light, 'light'),
    dark: buildStudioSemantic(model, model.dark, 'dark'),
    $themes: [theme('light', 'Light'), theme('dark', 'Dark')],
    $metadata: { tokenSetOrder: [...sets] },
  };

  return JSON.stringify(payload, null, 2);
}
