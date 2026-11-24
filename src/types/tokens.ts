export type ColorRole = 'primary' | 'secondary' | 'accent' | 'neutral';

export type ShadeStep = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950;

export type ShadeScale = Record<ShadeStep, string>;

export interface PaletteColor {
  role: ColorRole;
  label: string;
  hex: string;
  locked: boolean;
}

export type HarmonyMode =
  | 'curated'
  | 'analogous'
  | 'complementary'
  | 'triadic'
  | 'monochromatic'
  | 'high-contrast';

export interface GoogleFontSpec {
  family: string;
  category: 'sans-serif' | 'serif' | 'display' | 'monospace';
  weights: number[];
  recommendedFor: 'heading' | 'body' | 'both' | 'mono';
}

export interface TypographyPairing {
  id: string;
  name: string;
  description: string;
  headingFont: string;
  headingWeight: number;
  headingTracking: number;
  bodyFont: string;
  bodyWeight: number;
  monoFont: string;
  scaleRatio: number;
}

export interface TypographyConfig {
  pairingId: string;
  headingFont: string;
  headingWeight: number;
  headingTracking: number; // em, e.g. -0.025
  bodyFont: string;
  bodyWeight: number;
  monoFont: string;
  baseSize: number; // px, e.g. 16
  scaleRatio: number; // e.g. 1.25
  lineHeight: number; // e.g. 1.6
}

export type ElevationStyle = 'flat' | 'soft' | 'crisp' | 'elevated';

export interface GeometryConfig {
  radiusBase: number; // px: 0, 4, 8, 12, 16, 24
  spacingUnit: number; // px: 4 or 8
  cardPadding: number; // px: 16, 20, 24, 32
  elementGap: number; // px: 8, 12, 16, 24
  elevationStyle: ElevationStyle;
}

export interface DesignTokenState {
  brandName: string;
  harmonyMode: HarmonyMode;
  colors: PaletteColor[];
  typography: TypographyConfig;
  geometry: GeometryConfig;
}

export type WorkspaceSection = 'palette' | 'studio' | 'export';
export type PreviewThemeMode = 'light' | 'dark' | 'split';
export type ExportTab = 'visual' | 'markdown' | 'json' | 'css' | 'tailwind';

export type ContrastLevel = 'AA' | 'AAA';
