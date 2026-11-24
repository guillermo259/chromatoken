import {
  ColorRole,
  ContrastLevel,
  HarmonyMode,
  PaletteColor,
  ShadeScale,
  ShadeStep,
} from '../types/tokens';

export const SHADE_STEPS: ShadeStep[] = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

export const ROLE_LABELS: Record<ColorRole, string> = {
  primary: 'Primary',
  secondary: 'Secondary',
  accent: 'Accent',
  neutral: 'Neutral',
};

export const ROLE_DESCRIPTIONS: Record<ColorRole, string> = {
  primary: 'Acción principal, marca y foco',
  secondary: 'Superficies de apoyo y acciones secundarias',
  accent: 'Énfasis visual, destacados y llamadas clave',
  neutral: 'Lienzos, textos, bordes y fondos Light/Dark',
};

export function normalizeHex(input: string): string {
  const cleaned = input.trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{3}$/.test(cleaned)) {
    const r = cleaned[0] + cleaned[0];
    const g = cleaned[1] + cleaned[1];
    const b = cleaned[2] + cleaned[2];
    return `#${r}${g}${b}`.toUpperCase();
  }
  if (/^[0-9a-fA-F]{6}$/.test(cleaned)) {
    return `#${cleaned}`.toUpperCase();
  }
  return '#000000';
}

export function isValidHex(input: string): boolean {
  const cleaned = input.trim().replace(/^#/, '');
  return /^[0-9a-fA-F]{6}$/.test(cleaned) || /^[0-9a-fA-F]{3}$/.test(cleaned);
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const norm = normalizeHex(hex).slice(1);
  return {
    r: parseInt(norm.slice(0, 2), 16),
    g: parseInt(norm.slice(2, 4), 16),
    b: parseInt(norm.slice(4, 6), 16),
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  return (
    '#' +
    [clamp(r), clamp(g), clamp(b)]
      .map((x) => x.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  );
}

export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = (gn - bn) / d + (gn < bn ? 6 : 0);
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      case bn:
        h = (rn - gn) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360) % 360,
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  const hn = (((h % 360) + 360) % 360) / 360;
  const sn = Math.max(0, Math.min(100, s)) / 100;
  const ln = Math.max(0, Math.min(100, l)) / 100;

  if (sn === 0) {
    const val = Math.round(ln * 255);
    return { r: val, g: val, b: val };
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    let tn = t;
    if (tn < 0) tn += 1;
    if (tn > 1) tn -= 1;
    if (tn < 1 / 6) return p + (q - p) * 6 * tn;
    if (tn < 1 / 2) return q;
    if (tn < 2 / 3) return p + (q - p) * (2 / 3 - tn) * 6;
    return p;
  };

  const q = ln < 0.5 ? ln * (1 + sn) : ln + sn - ln * sn;
  const p = 2 * ln - q;

  return {
    r: Math.round(hue2rgb(p, q, hn + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, hn) * 255),
    b: Math.round(hue2rgb(p, q, hn - 1 / 3) * 255),
  };
}

export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHsl(r, g, b);
}

export function hslToHex(h: number, s: number, l: number): string {
  const { r, g, b } = hslToRgb(h, s, l);
  return rgbToHex(r, g, b);
}

/* -------------------------------------------------------------------------- */
/*  OKLCH Perceptual Color Space (CSS Color Level 4)                          */
/* -------------------------------------------------------------------------- */

function srgbToLinear(c: number): number {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function linearToSrgb(v: number): number {
  const clamped = Math.max(0, Math.min(1, v));
  const srgb =
    clamped <= 0.0031308
      ? clamped * 12.92
      : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
  return Math.round(srgb * 255);
}

function linearSrgbToOklab(r: number, g: number, b: number): { L: number; a: number; b: number } {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  return {
    L: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  };
}

function oklabToLinearSrgb(L: number, a: number, b: number): { r: number; g: number; b: number } {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  return {
    r: +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    g: -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    b: -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  };
}

function inLinearGamut(rgb: { r: number; g: number; b: number }): boolean {
  const eps = -0.0005;
  const max = 1.0005;
  return rgb.r >= eps && rgb.r <= max && rgb.g >= eps && rgb.g <= max && rgb.b >= eps && rgb.b <= max;
}

export function hexToOklch(hex: string): { l: number; c: number; h: number } {
  const { r, g, b } = hexToRgb(hex);
  const lab = linearSrgbToOklab(srgbToLinear(r), srgbToLinear(g), srgbToLinear(b));
  const c = Math.sqrt(lab.a * lab.a + lab.b * lab.b);
  let h = (Math.atan2(lab.b, lab.a) * 180) / Math.PI;
  if (h < 0) h += 360;
  return {
    l: Math.max(0, Math.min(1, lab.L)),
    c,
    h: c < 0.0001 ? 0 : h,
  };
}

/**
 * Converts OKLCH (L in 0..1, C in 0..0.37, H in 0..360) to HEX, preserving exact
 * perceptual lightness and hue while binary-clamping chroma to the sRGB gamut.
 */
export function oklchToHex(l: number, c: number, h: number): string {
  const clampedL = Math.max(0.02, Math.min(0.99, l));
  const clampedC = Math.max(0, c);
  const hueRad = ((((h % 360) + 360) % 360) * Math.PI) / 180;
  const cosH = Math.cos(hueRad);
  const sinH = Math.sin(hueRad);

  const probe = (chroma: number) =>
    oklabToLinearSrgb(clampedL, chroma * cosH, chroma * sinH);

  let rgb = probe(clampedC);
  if (!inLinearGamut(rgb)) {
    let low = 0;
    let high = clampedC;
    for (let i = 0; i < 16; i++) {
      const mid = (low + high) / 2;
      if (inLinearGamut(probe(mid))) {
        low = mid;
      } else {
        high = mid;
      }
    }
    rgb = probe(low);
  }

  return rgbToHex(linearToSrgb(rgb.r), linearToSrgb(rgb.g), linearToSrgb(rgb.b));
}

export function getRelativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const toLinear = (v: number) => {
    const srgb = v / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

export function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = getRelativeLuminance(hex1);
  const l2 = getRelativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

export function getAccessibleTextColor(bgHex: string): '#FFFFFF' | '#0F172A' {
  const whiteContrast = getContrastRatio(bgHex, '#FFFFFF');
  const darkContrast = getContrastRatio(bgHex, '#0F172A');
  return whiteContrast >= darkContrast ? '#FFFFFF' : '#0F172A';
}

export function getWcagLabel(ratio: number): 'AAA' | 'AA' | 'AA Large' | 'Bajo' {
  if (ratio >= 7) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  if (ratio >= 3) return 'AA Large';
  return 'Bajo';
}

const TARGET_OKLCH_L: Record<ShadeStep, number> = {
  50: 0.98,
  100: 0.94,
  200: 0.875,
  300: 0.785,
  400: 0.695,
  500: 0.59,
  600: 0.49,
  700: 0.40,
  800: 0.31,
  900: 0.22,
  950: 0.14,
};

/**
 * Generates an 11-step 50-950 scale in OKLCH anchored smoothly around the user's chosen hex,
 * preserving the exact user HEX at its closest lightness step (50..950) and guaranteeing
 * monotonic decreasing luminance from step 50 (lightest) to step 950 (darkest).
 */
export function generateShadeScale(hex: string): ShadeScale {
  const normalized = normalizeHex(hex);
  const { l, c, h } = hexToOklch(normalized);
  const baseLum = getRelativeLuminance(normalized);

  let anchorStep: ShadeStep = 500;
  let minDiff = Infinity;
  for (const step of SHADE_STEPS) {
    const diff = Math.abs(TARGET_OKLCH_L[step] - l);
    if (diff < minDiff) {
      minDiff = diff;
      anchorStep = step;
    }
  }

  const anchorIndex = SHADE_STEPS.indexOf(anchorStep);
  const topL = Math.min(0.995, Math.max(0.982, l + (1 - l) * 0.6));
  const bottomL = Math.max(0.02, Math.min(0.14, l * 0.55));
  const scale = {} as ShadeScale;

  SHADE_STEPS.forEach((step, idx) => {
    if (idx === anchorIndex) {
      scale[step] = normalized;
      return;
    }

    if (idx < anchorIndex) {
      const t = (anchorIndex - idx) / anchorIndex; // 0..1 toward 50
      const nextL = l + (topL - l) * Math.pow(t, 0.92);
      const nextC = c * (1 - t * 0.85);
      scale[step] = oklchToHex(nextL, nextC, h);
    } else {
      const remaining = SHADE_STEPS.length - 1 - anchorIndex;
      const t = (idx - anchorIndex) / remaining; // 0..1 toward 950
      const nextL = l - (l - bottomL) * Math.pow(t, 0.95);
      const nextC = c * (1 - t * 0.45);
      scale[step] = oklchToHex(nextL, nextC, h);
    }
  });

  // Enforce strict monotonic luminance around the anchored user color even after 8-bit sRGB rounding
  for (let i = anchorIndex - 1; i >= 0; i--) {
    const prevHex = scale[SHADE_STEPS[i + 1]];
    const currStep = SHADE_STEPS[i];
    const prevLum = getRelativeLuminance(prevHex);
    if (getRelativeLuminance(scale[currStep]) < prevLum) {
      const targetStepL = Math.min(0.998, hexToOklch(prevHex).l + 0.015 * (anchorIndex - i));
      scale[currStep] = targetStepL > 0.99 ? '#FFFFFF' : oklchToHex(targetStepL, c * 0.15, h);
      if (getRelativeLuminance(scale[currStep]) < prevLum) {
        scale[currStep] = prevHex;
      }
    }
  }

  for (let i = anchorIndex + 1; i < SHADE_STEPS.length; i++) {
    const prevHex = scale[SHADE_STEPS[i - 1]];
    const currStep = SHADE_STEPS[i];
    const prevLum = getRelativeLuminance(prevHex);
    if (getRelativeLuminance(scale[currStep]) > prevLum) {
      const targetStepL = Math.max(0.01, hexToOklch(prevHex).l - 0.015 * (i - anchorIndex));
      scale[currStep] = targetStepL <= 0.015 ? '#000000' : oklchToHex(targetStepL, c * 0.5, h);
      if (getRelativeLuminance(scale[currStep]) > prevLum) {
        scale[currStep] = prevHex;
      }
    }
  }

  // Ensure the exact user input stays intact at its anchor
  if (baseLum >= 0) {
    scale[anchorStep] = normalized;
  }

  return scale;
}

const NAMED_COLORS: Array<{ name: string; hex: string }> = [
  { name: 'Graphite', hex: '#2A2B2E' },
  { name: 'Obsidian Ink', hex: '#14171C' },
  { name: 'Charcoal Slate', hex: '#4B505C' },
  { name: 'Ash Stone', hex: '#78716C' },
  { name: 'Warm Sand', hex: '#D6CFC7' },
  { name: 'Alabaster', hex: '#F5F4F0' },
  { name: 'Mint Cream', hex: '#F3FAF4' },
  { name: 'Tiger Flame', hex: '#F86624' },
  { name: 'Amber Ochre', hex: '#D97706' },
  { name: 'Saffron Gold', hex: '#FACC15' },
  { name: 'Burnt Sienna', hex: '#C2410C' },
  { name: 'Crimson Coral', hex: '#E11D48' },
  { name: 'Soft Coral', hex: '#FB7185' },
  { name: 'Terracotta', hex: '#B4533C' },
  { name: 'Burgundy Wine', hex: '#7F1D1D' },
  { name: 'Sage Moss', hex: '#4A7C59' },
  { name: 'Forest Pine', hex: '#1B4332' },
  { name: 'Lime Leaf', hex: '#84CC16' },
  { name: 'Emerald Leaf', hex: '#10B981' },
  { name: 'Teal Harbor', hex: '#0D9488' },
  { name: 'Aqua Mint', hex: '#5EEAD4' },
  { name: 'Nordic Cyan', hex: '#0284C7' },
  { name: 'Sky Mist', hex: '#7DD3FC' },
  { name: 'Cobalt Ink', hex: '#1D4ED8' },
  { name: 'Royal Indigo', hex: '#4338CA' },
  { name: 'Midnight Navy', hex: '#1E293B' },
  { name: 'Steel Blue', hex: '#64748B' },
  { name: 'Electric Violet', hex: '#7C3AED' },
  { name: 'Lavender Mist', hex: '#C4B5FD' },
  { name: 'Plum Velvet', hex: '#6D28D9' },
  { name: 'Magenta Bloom', hex: '#DB2777' },
  { name: 'Blush Rose', hex: '#F9A8D4' },
  { name: 'Marigold Sun', hex: '#EAB308' },
  { name: 'Olive Grove', hex: '#65A30D' },
];

export function getNearestColorName(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  const { s, l } = rgbToHsl(r, g, b);

  if (l >= 96 && s < 15) return 'Pure Mist';
  if (l <= 7 && s < 20) return 'Deep Pitch';

  let bestName = 'Custom Tone';
  let bestDist = Infinity;

  for (const item of NAMED_COLORS) {
    const irgb = hexToRgb(item.hex);
    const dist =
      Math.pow(r - irgb.r, 2) + Math.pow(g - irgb.g, 2) + Math.pow(b - irgb.b, 2);
    if (dist < bestDist) {
      bestDist = dist;
      bestName = item.name;
    }
  }
  return bestName;
}

export interface PalettePreset {
  id: string;
  name: string;
  colors: Record<ColorRole, string>;
}

export const CURATED_PRESETS: PalettePreset[] = [
  {
    id: 'botanical-sage',
    name: 'Botanical Sage',
    colors: {
      primary: '#4A7C59',
      secondary: '#64748B',
      accent: '#D97706',
      neutral: '#6B6E6B',
    },
  },
  {
    id: 'graphite-flame',
    name: 'Graphite & Flame',
    colors: {
      primary: '#2A2B2E',
      secondary: '#5A5A66',
      accent: '#F86624',
      neutral: '#71717A',
    },
  },
  {
    id: 'cobalt-editorial',
    name: 'Cobalt Editorial',
    colors: {
      primary: '#1E40AF',
      secondary: '#475569',
      accent: '#0D9488',
      neutral: '#64748B',
    },
  },
  {
    id: 'nordic-ocean',
    name: 'Nordic Ocean',
    colors: {
      primary: '#0F766E',
      secondary: '#334155',
      accent: '#E11D48',
      neutral: '#68737E',
    },
  },
  {
    id: 'ochre-arch',
    name: 'Ochre Architecture',
    colors: {
      primary: '#B45309',
      secondary: '#3F3F46',
      accent: '#0369A1',
      neutral: '#78716C',
    },
  },
];

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

type PaletteMood = 'vibrant' | 'editorial' | 'pastel' | 'earthy';

function pickMood(): PaletteMood {
  const moods: PaletteMood[] = ['vibrant', 'editorial', 'pastel', 'earthy'];
  return moods[Math.floor(Math.random() * moods.length)];
}

export function generateHarmoniousPalette(
  current: PaletteColor[],
  mode: HarmonyMode
): PaletteColor[] {
  const lockedPrimary = current.find((c) => c.role === 'primary' && c.locked);
  const lockedPrimaryOklch = lockedPrimary ? hexToOklch(lockedPrimary.hex) : null;

  const baseHue = lockedPrimaryOklch
    ? lockedPrimaryOklch.h
    : Math.floor(Math.random() * 360);

  const mood = pickMood();

  // Base perceptual lightness & chroma profiles per mood
  let primaryL = randomBetween(0.50, 0.66);
  let primaryC = randomBetween(0.14, 0.23);

  let secondaryL = randomBetween(0.55, 0.72);
  let secondaryC = randomBetween(0.11, 0.19);

  let accentL = randomBetween(0.60, 0.78);
  let accentC = randomBetween(0.16, 0.26);

  if (mood === 'editorial') {
    primaryL = randomBetween(0.36, 0.50);
    primaryC = randomBetween(0.10, 0.18);
    secondaryL = randomBetween(0.48, 0.65);
    secondaryC = randomBetween(0.08, 0.15);
    accentL = randomBetween(0.62, 0.78);
    accentC = randomBetween(0.15, 0.24);
  } else if (mood === 'pastel') {
    primaryL = randomBetween(0.72, 0.84);
    primaryC = randomBetween(0.09, 0.15);
    secondaryL = randomBetween(0.76, 0.88);
    secondaryC = randomBetween(0.08, 0.14);
    accentL = randomBetween(0.58, 0.74);
    accentC = randomBetween(0.14, 0.22);
  } else if (mood === 'earthy') {
    primaryL = randomBetween(0.45, 0.62);
    primaryC = randomBetween(0.07, 0.14);
    secondaryL = randomBetween(0.56, 0.72);
    secondaryC = randomBetween(0.06, 0.13);
    accentL = randomBetween(0.58, 0.74);
    accentC = randomBetween(0.12, 0.20);
  }

  let primaryH = baseHue;
  let secondaryH = baseHue;
  let accentH = baseHue;
  let neutralH = baseHue;
  let neutralC = randomBetween(0.008, 0.024);
  let neutralL = randomBetween(0.38, 0.68);

  switch (mode) {
    case 'analogous': {
      const dir = Math.random() > 0.5 ? 1 : -1;
      secondaryH = (baseHue + dir * randomBetween(26, 36) + 360) % 360;
      accentH = (baseHue + dir * randomBetween(54, 72) + 360) % 360;
      break;
    }
    case 'complementary': {
      secondaryH = (baseHue + randomBetween(-22, 22) + 360) % 360;
      secondaryL = primaryL > 0.6 ? primaryL - 0.16 : primaryL + 0.16;
      secondaryC = Math.max(0.05, primaryC * 0.65);
      accentH = (baseHue + 180) % 360;
      break;
    }
    case 'split-complementary': {
      secondaryH = (baseHue + 150) % 360;
      accentH = (baseHue + 210) % 360;
      break;
    }
    case 'triadic': {
      secondaryH = (baseHue + 120) % 360;
      accentH = (baseHue + 240) % 360;
      break;
    }
    case 'tetradic': {
      // Cuadrática: 4 ángulos a 90° en el círculo cromático OKLCH
      secondaryH = (baseHue + 90) % 360;
      accentH = (baseHue + 180) % 360;
      neutralH = (baseHue + 270) % 360;
      neutralC = randomBetween(0.018, 0.036);
      break;
    }
    case 'monochromatic': {
      secondaryH = baseHue;
      accentH = baseHue;
      primaryL = randomBetween(0.36, 0.48);
      primaryC = randomBetween(0.11, 0.20);
      secondaryL = randomBetween(0.64, 0.78);
      secondaryC = randomBetween(0.06, 0.13);
      accentL = randomBetween(0.52, 0.66);
      accentC = randomBetween(0.16, 0.25);
      break;
    }
    case 'high-contrast': {
      const darkBase = Math.random() > 0.35;
      primaryL = darkBase ? randomBetween(0.22, 0.32) : randomBetween(0.80, 0.88);
      primaryC = randomBetween(0.04, 0.10);
      secondaryH = (baseHue + 28) % 360;
      secondaryL = darkBase ? randomBetween(0.40, 0.52) : randomBetween(0.56, 0.68);
      secondaryC = randomBetween(0.07, 0.14);
      accentH = (baseHue + 155) % 360;
      accentL = randomBetween(0.62, 0.75);
      accentC = randomBetween(0.19, 0.27);
      break;
    }
    case 'curated':
    default: {
      const offsets = [
        [28, 160],
        [-32, 145],
        [195, 38],
        [42, 215],
        [-24, 178],
      ];
      const pick = offsets[Math.floor(Math.random() * offsets.length)];
      secondaryH = (baseHue + pick[0] + 360) % 360;
      accentH = (baseHue + pick[1] + 360) % 360;
      break;
    }
  }

  // Allow Neutral to alternate smoothly between warm stone, cool slate, or primary-tinted
  if (mode !== 'tetradic') {
    const neutralMode = Math.floor(Math.random() * 3);
    if (neutralMode === 0) {
      neutralH = randomBetween(55, 85); // warm stone / sand
    } else if (neutralMode === 1) {
      neutralH = randomBetween(235, 265); // cool slate
    } else {
      neutralH = primaryH;
    }
  }

  const targetByRole: Record<ColorRole, string> = {
    primary: oklchToHex(primaryL, primaryC, primaryH),
    secondary: oklchToHex(secondaryL, secondaryC, secondaryH),
    accent: oklchToHex(accentL, accentC, accentH),
    neutral: oklchToHex(neutralL, neutralC, neutralH),
  };

  return current.map((item) => {
    if (item.locked) return item;
    return {
      ...item,
      hex: targetByRole[item.role],
    };
  });
}

export interface SemanticThemeColors {
  canvas: string;
  surface: string;
  surfaceRaised: string;
  surfaceMuted: string;
  border: string;
  borderStrong: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryHover: string;
  onPrimary: string;
  secondary: string;
  onSecondary: string;
  accent: string;
  onAccent: string;
  success: string;
  successSurface: string;
  warning: string;
  warningSurface: string;
  destructive: string;
  destructiveSurface: string;
}

export function buildAllScales(colors: PaletteColor[]): Record<ColorRole, ShadeScale> {
  const map = {} as Record<ColorRole, ShadeScale>;
  for (const c of colors) {
    map[c.role] = generateShadeScale(c.hex);
  }
  return map;
}

function pickContrastStep(
  scale: ShadeScale,
  steps: ShadeStep[],
  againstHex: string,
  minRatio: number,
  fallback: ShadeStep
): string {
  for (const step of steps) {
    if (getContrastRatio(scale[step], againstHex) >= minRatio) {
      return scale[step];
    }
  }
  return scale[fallback];
}

export function deriveSemanticTheme(
  scales: Record<ColorRole, ShadeScale>,
  rawColors: Record<ColorRole, string>,
  mode: 'light' | 'dark',
  contrastLevel: ContrastLevel = 'AA'
): SemanticThemeColors {
  const textTarget = contrastLevel === 'AAA' ? 7.0 : 4.5;

  if (mode === 'light') {
    const primary = rawColors.primary;
    const secondary = rawColors.secondary;
    const accent = rawColors.accent;
    const surface = '#FFFFFF';
    const canvas = scales.neutral[50];

    const text = pickContrastStep(scales.neutral, [950, 900], canvas, textTarget, 950);
    const textSecondary = pickContrastStep(
      scales.neutral,
      contrastLevel === 'AAA' ? [800, 900, 950] : [700, 800, 900, 950],
      surface,
      textTarget,
      800
    );
    const textMuted = pickContrastStep(
      scales.neutral,
      contrastLevel === 'AAA' ? [700, 800, 900, 950] : [600, 700, 800, 900],
      surface,
      textTarget,
      600
    );
    const borderStrong = pickContrastStep(
      scales.neutral,
      [500, 600, 700, 800, 900],
      canvas,
      3.0,
      500
    );

    return {
      canvas,
      surface,
      surfaceRaised: '#FFFFFF',
      surfaceMuted: scales.neutral[100],
      border: scales.neutral[200],
      borderStrong,
      text,
      textSecondary,
      textMuted,
      primary,
      primaryHover: scales.primary[700],
      onPrimary: getAccessibleTextColor(primary),
      secondary,
      onSecondary: getAccessibleTextColor(secondary),
      accent,
      onAccent: getAccessibleTextColor(accent),
      success: '#15803D',
      successSurface: '#F0FDF4',
      warning: '#B45309',
      warningSurface: '#FFFBEB',
      destructive: '#DC2626',
      destructiveSurface: '#FEF2F2',
    };
  }

  // Dark Mode with contrast safeguards matching selected WCAG level
  const darkSurface = scales.neutral[900];
  const darkCanvas = scales.neutral[950];

  const promoteDarkRole = (rawHex: string, scale: ShadeScale): string => {
    const onRaw = getAccessibleTextColor(rawHex);
    const rawOnSurfaceOk = getContrastRatio(rawHex, darkSurface) >= 3.0;
    const rawTextOk = getContrastRatio(onRaw, rawHex) >= textTarget;
    if (rawOnSurfaceOk && rawTextOk) return rawHex;

    // Try lighter scale steps (400 -> 100) that satisfy both darkSurface UI contrast and button text contrast
    for (const step of [400, 300, 200, 100] as ShadeStep[]) {
      const candidate = scale[step];
      const onCandidate = getAccessibleTextColor(candidate);
      if (
        getContrastRatio(candidate, darkSurface) >= 3.0 &&
        getContrastRatio(onCandidate, candidate) >= textTarget
      ) {
        return candidate;
      }
    }
    return rawOnSurfaceOk ? rawHex : scale[300];
  };

  const darkPrimary = promoteDarkRole(rawColors.primary, scales.primary);
  const darkSecondary = promoteDarkRole(rawColors.secondary, scales.secondary);
  const darkAccent = promoteDarkRole(rawColors.accent, scales.accent);

  const text = pickContrastStep(scales.neutral, [50, 100], darkCanvas, textTarget, 50);
  const textSecondary = pickContrastStep(
    scales.neutral,
    contrastLevel === 'AAA' ? [200, 100, 50] : [300, 200, 100, 50],
    darkSurface,
    textTarget,
    200
  );
  const textMuted = pickContrastStep(
    scales.neutral,
    contrastLevel === 'AAA' ? [300, 200, 100, 50] : [400, 300, 200, 100],
    darkSurface,
    textTarget,
    400
  );
  const borderStrong = pickContrastStep(
    scales.neutral,
    [500, 400, 300, 200, 100],
    darkCanvas,
    3.0,
    500
  );

  return {
    canvas: darkCanvas,
    surface: darkSurface,
    surfaceRaised: scales.neutral[800],
    surfaceMuted: scales.neutral[800],
    border: scales.neutral[800],
    borderStrong,
    text,
    textSecondary,
    textMuted,
    primary: darkPrimary,
    primaryHover: scales.primary[300],
    onPrimary: getAccessibleTextColor(darkPrimary),
    secondary: darkSecondary,
    onSecondary: getAccessibleTextColor(darkSecondary),
    accent: darkAccent,
    onAccent: getAccessibleTextColor(darkAccent),
    success: '#4ADE80',
    successSurface: '#052E16',
    warning: '#FBBF24',
    warningSurface: '#2A1803',
    destructive: '#F87171',
    destructiveSurface: '#2C0B0E',
  };
}
