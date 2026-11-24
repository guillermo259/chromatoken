import {
  ColorRole,
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

const TARGET_LIGHTNESS: Record<ShadeStep, number> = {
  50: 97,
  100: 93,
  200: 85,
  300: 74,
  400: 62,
  500: 50,
  600: 40,
  700: 31,
  800: 22,
  900: 15,
  950: 9,
};

/**
 * Generates an 11-step 50-950 scale anchored smoothly around the user's chosen hex,
 * preserving the exact user HEX at its closest lightness step (between 200 and 800).
 */
export function generateShadeScale(hex: string): ShadeScale {
  const normalized = normalizeHex(hex);
  const { h, s, l } = hexToHsl(normalized);

  // Find closest anchor step among 200..800 so 50/100 stay light and 900/950 stay deep
  const anchorCandidates: ShadeStep[] = [200, 300, 400, 500, 600, 700, 800];
  let anchorStep: ShadeStep = 500;
  let minDiff = Infinity;
  for (const step of anchorCandidates) {
    const diff = Math.abs(TARGET_LIGHTNESS[step] - l);
    if (diff < minDiff) {
      minDiff = diff;
      anchorStep = step;
    }
  }

  const anchorIndex = SHADE_STEPS.indexOf(anchorStep);
  const scale = {} as ShadeScale;

  SHADE_STEPS.forEach((step, idx) => {
    if (idx === anchorIndex) {
      scale[step] = normalized;
      return;
    }

    if (idx < anchorIndex) {
      // Interpolate lightness up toward 97.5% at step 50
      const t = (anchorIndex - idx) / anchorIndex; // 0..1
      const nextL = l + (97.5 - l) * Math.pow(t, 0.92);
      // Slight saturation softening at very bright tints while keeping neutral clean
      const nextS = s <= 12 ? Math.max(0, s * (1 - t * 0.35)) : Math.max(8, s * (1 - t * 0.25));
      scale[step] = hslToHex(h, nextS, nextL);
    } else {
      // Interpolate lightness down toward 8.5% at step 950
      const remaining = SHADE_STEPS.length - 1 - anchorIndex;
      const t = (idx - anchorIndex) / remaining; // 0..1
      const nextL = l - (l - 8.5) * Math.pow(t, 0.95);
      const nextS = s <= 12 ? Math.min(14, s * (1 + t * 0.15)) : Math.min(95, s * (1 + t * 0.08));
      scale[step] = hslToHex(h, nextS, nextL);
    }
  });

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
  { name: 'Burnt Sienna', hex: '#C2410C' },
  { name: 'Crimson Coral', hex: '#E11D48' },
  { name: 'Terracotta', hex: '#B4533C' },
  { name: 'Sage Moss', hex: '#4A7C59' },
  { name: 'Forest Pine', hex: '#1B4332' },
  { name: 'Emerald Leaf', hex: '#10B981' },
  { name: 'Teal Harbor', hex: '#0D9488' },
  { name: 'Nordic Cyan', hex: '#0284C7' },
  { name: 'Cobalt Ink', hex: '#1D4ED8' },
  { name: 'Royal Indigo', hex: '#4338CA' },
  { name: 'Midnight Navy', hex: '#1E293B' },
  { name: 'Steel Blue', hex: '#64748B' },
  { name: 'Plum Velvet', hex: '#6D28D9' },
  { name: 'Muted Mauve', hex: '#8B5CF6' },
  { name: 'Dusty Rose', hex: '#BE185D' },
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

export function generateHarmoniousPalette(
  current: PaletteColor[],
  mode: HarmonyMode
): PaletteColor[] {
  const lockedPrimary = current.find((c) => c.role === 'primary' && c.locked);
  const baseHue = lockedPrimary
    ? hexToHsl(lockedPrimary.hex).h
    : Math.floor(Math.random() * 360);

  let primaryH = baseHue;
  let primaryS = Math.round(randomBetween(48, 80));
  let primaryL = Math.round(randomBetween(32, 50));

  let secondaryH = baseHue;
  let secondaryS = Math.round(randomBetween(18, 42));
  let secondaryL = Math.round(randomBetween(36, 54));

  let accentH = baseHue;
  let accentS = Math.round(randomBetween(68, 92));
  let accentL = Math.round(randomBetween(46, 58));

  switch (mode) {
    case 'analogous':
      secondaryH = (baseHue + 28) % 360;
      accentH = (baseHue + 56) % 360;
      break;
    case 'complementary':
      secondaryH = (baseHue + 18) % 360;
      secondaryS = Math.round(randomBetween(16, 30));
      accentH = (baseHue + 180) % 360;
      break;
    case 'triadic':
      secondaryH = (baseHue + 120) % 360;
      accentH = (baseHue + 240) % 360;
      break;
    case 'monochromatic':
      secondaryH = baseHue;
      secondaryS = Math.max(14, primaryS - 25);
      secondaryL = Math.min(68, primaryL + 16);
      accentH = baseHue;
      accentS = Math.min(92, primaryS + 18);
      accentL = Math.max(36, primaryL - 8);
      break;
    case 'high-contrast':
      primaryS = Math.round(randomBetween(10, 26));
      primaryL = Math.round(randomBetween(14, 24));
      secondaryH = (baseHue + 20) % 360;
      secondaryS = Math.round(randomBetween(12, 24));
      secondaryL = Math.round(randomBetween(36, 48));
      accentH = (baseHue + 150) % 360;
      accentS = Math.round(randomBetween(80, 96));
      accentL = Math.round(randomBetween(48, 56));
      break;
    case 'curated':
    default: {
      const offsets = [
        [24, 165],
        [-30, 145],
        [195, 35],
        [35, 210],
      ];
      const pick = offsets[Math.floor(Math.random() * offsets.length)];
      secondaryH = (baseHue + pick[0] + 360) % 360;
      accentH = (baseHue + pick[1] + 360) % 360;
      break;
    }
  }

  const neutralH = primaryH;
  const neutralS = Math.round(randomBetween(4, 10));
  const neutralL = Math.round(randomBetween(40, 52));

  const targetByRole: Record<ColorRole, string> = {
    primary: hslToHex(primaryH, primaryS, primaryL),
    secondary: hslToHex(secondaryH, secondaryS, secondaryL),
    accent: hslToHex(accentH, accentS, accentL),
    neutral: hslToHex(neutralH, neutralS, neutralL),
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

export function deriveSemanticTheme(
  scales: Record<ColorRole, ShadeScale>,
  rawColors: Record<ColorRole, string>,
  mode: 'light' | 'dark'
): SemanticThemeColors {
  if (mode === 'light') {
    const primary = rawColors.primary;
    const secondary = rawColors.secondary;
    const accent = rawColors.accent;
    return {
      canvas: scales.neutral[50],
      surface: '#FFFFFF',
      surfaceRaised: '#FFFFFF',
      surfaceMuted: scales.neutral[100],
      border: scales.neutral[200],
      borderStrong: scales.neutral[300],
      text: scales.neutral[950],
      textSecondary: scales.neutral[700],
      textMuted: scales.neutral[500],
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

  // Dark Mode with automatic contrast safeguard for dark primary/secondary picks
  const darkSurface = scales.neutral[900];
  const primaryContrast = getContrastRatio(rawColors.primary, darkSurface);
  const darkPrimary = primaryContrast >= 3.0 ? rawColors.primary : scales.primary[400];

  const secondaryContrast = getContrastRatio(rawColors.secondary, darkSurface);
  const darkSecondary = secondaryContrast >= 3.0 ? rawColors.secondary : scales.secondary[400];

  const accentContrast = getContrastRatio(rawColors.accent, darkSurface);
  const darkAccent = accentContrast >= 3.0 ? rawColors.accent : scales.accent[400];

  return {
    canvas: scales.neutral[950],
    surface: darkSurface,
    surfaceRaised: scales.neutral[800],
    surfaceMuted: scales.neutral[800],
    border: scales.neutral[800],
    borderStrong: scales.neutral[700],
    text: scales.neutral[50],
    textSecondary: scales.neutral[300],
    textMuted: scales.neutral[400],
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
