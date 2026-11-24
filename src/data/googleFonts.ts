import { GoogleFontSpec, TypographyPairing } from '../types/tokens';

export const GOOGLE_FONTS_CATALOG: GoogleFontSpec[] = [
  // Geometric & Neo-Grotesque Sans
  {
    family: 'Plus Jakarta Sans',
    category: 'sans-serif',
    weights: [400, 500, 600, 700, 800],
    recommendedFor: 'both',
  },
  {
    family: 'Outfit',
    category: 'sans-serif',
    weights: [400, 500, 600, 700, 800],
    recommendedFor: 'heading',
  },
  {
    family: 'Bricolage Grotesque',
    category: 'sans-serif',
    weights: [400, 500, 600, 700, 800],
    recommendedFor: 'heading',
  },
  {
    family: 'Manrope',
    category: 'sans-serif',
    weights: [400, 500, 600, 700, 800],
    recommendedFor: 'both',
  },
  {
    family: 'DM Sans',
    category: 'sans-serif',
    weights: [400, 500, 600, 700],
    recommendedFor: 'both',
  },
  {
    family: 'Urbanist',
    category: 'sans-serif',
    weights: [400, 500, 600, 700, 800],
    recommendedFor: 'heading',
  },
  {
    family: 'Public Sans',
    category: 'sans-serif',
    weights: [300, 400, 500, 600, 700],
    recommendedFor: 'body',
  },
  {
    family: 'Sora',
    category: 'sans-serif',
    weights: [400, 500, 600, 700, 800],
    recommendedFor: 'heading',
  },
  {
    family: 'Work Sans',
    category: 'sans-serif',
    weights: [400, 500, 600, 700],
    recommendedFor: 'body',
  },
  {
    family: 'Rubik',
    category: 'sans-serif',
    weights: [400, 500, 600, 700],
    recommendedFor: 'both',
  },
  {
    family: 'Archivo',
    category: 'sans-serif',
    weights: [400, 500, 600, 700, 800],
    recommendedFor: 'heading',
  },
  // Condensed & Editorial Impact
  {
    family: 'Barlow Condensed',
    category: 'sans-serif',
    weights: [500, 600, 700, 800],
    recommendedFor: 'heading',
  },
  {
    family: 'Oswald',
    category: 'sans-serif',
    weights: [400, 500, 600, 700],
    recommendedFor: 'heading',
  },
  {
    family: 'Syne',
    category: 'display',
    weights: [500, 600, 700, 800],
    recommendedFor: 'heading',
  },
  // Editorial & Luxury Serif
  {
    family: 'Fraunces',
    category: 'serif',
    weights: [400, 500, 600, 700, 800],
    recommendedFor: 'heading',
  },
  {
    family: 'Playfair Display',
    category: 'serif',
    weights: [400, 500, 600, 700, 800],
    recommendedFor: 'heading',
  },
  {
    family: 'Cormorant Garamond',
    category: 'serif',
    weights: [400, 500, 600, 700],
    recommendedFor: 'heading',
  },
  {
    family: 'Lora',
    category: 'serif',
    weights: [400, 500, 600, 700],
    recommendedFor: 'both',
  },
  {
    family: 'Source Serif 4',
    category: 'serif',
    weights: [400, 500, 600, 700],
    recommendedFor: 'both',
  },
  {
    family: 'Merriweather',
    category: 'serif',
    weights: [300, 400, 700],
    recommendedFor: 'body',
  },
  {
    family: 'Bitter',
    category: 'serif',
    weights: [400, 500, 600, 700],
    recommendedFor: 'both',
  },
  // Monospace
  {
    family: 'JetBrains Mono',
    category: 'monospace',
    weights: [400, 500, 600, 700],
    recommendedFor: 'mono',
  },
  {
    family: 'IBM Plex Mono',
    category: 'monospace',
    weights: [400, 500, 600],
    recommendedFor: 'mono',
  },
  {
    family: 'Space Mono',
    category: 'monospace',
    weights: [400, 700],
    recommendedFor: 'mono',
  },
  {
    family: 'Fira Code',
    category: 'monospace',
    weights: [400, 500, 600, 700],
    recommendedFor: 'mono',
  },
];

export const CURATED_PAIRINGS: TypographyPairing[] = [
  {
    id: 'modern-saas',
    name: 'Modern Sans',
    description: 'Geométrica limpia para productos digitales y SaaS',
    headingFont: 'Plus Jakarta Sans',
    headingWeight: 700,
    headingTracking: -0.025,
    bodyFont: 'DM Sans',
    bodyWeight: 400,
    monoFont: 'JetBrains Mono',
    scaleRatio: 1.25,
  },
  {
    id: 'editorial-serif',
    name: 'Editorial Serif',
    description: 'Contraste cálido entre serif expresiva y sans legible',
    headingFont: 'Fraunces',
    headingWeight: 600,
    headingTracking: -0.02,
    bodyFont: 'Public Sans',
    bodyWeight: 400,
    monoFont: 'IBM Plex Mono',
    scaleRatio: 1.25,
  },
  {
    id: 'neo-grotesque',
    name: 'Neo-Grotesque',
    description: 'Carácter arquitectónico y ritmo firme en UI',
    headingFont: 'Bricolage Grotesque',
    headingWeight: 700,
    headingTracking: -0.03,
    bodyFont: 'Manrope',
    bodyWeight: 400,
    monoFont: 'JetBrains Mono',
    scaleRatio: 1.25,
  },
  {
    id: 'luxury-classic',
    name: 'Classic Luxury',
    description: 'Elegancia editorial para marcas y catálogos premium',
    headingFont: 'Playfair Display',
    headingWeight: 600,
    headingTracking: -0.015,
    bodyFont: 'Source Serif 4',
    bodyWeight: 400,
    monoFont: 'IBM Plex Mono',
    scaleRatio: 1.333,
  },
  {
    id: 'technical-precision',
    name: 'Technical Studio',
    description: 'Ingeniería visual nítida para consolas y herramientas',
    headingFont: 'Outfit',
    headingWeight: 600,
    headingTracking: -0.02,
    bodyFont: 'Work Sans',
    bodyWeight: 400,
    monoFont: 'Fira Code',
    scaleRatio: 1.2,
  },
  {
    id: 'bold-impact',
    name: 'Condensed Impact',
    description: 'Titulares condensados de alta presencia y cuerpo claro',
    headingFont: 'Barlow Condensed',
    headingWeight: 700,
    headingTracking: -0.01,
    bodyFont: 'Manrope',
    bodyWeight: 400,
    monoFont: 'Space Mono',
    scaleRatio: 1.333,
  },
];

export const SCALE_RATIOS = [
  { value: 1.125, label: '1.125 · Major Second (Compacta)' },
  { value: 1.2, label: '1.200 · Minor Third (UI Densa)' },
  { value: 1.25, label: '1.250 · Major Third (Equilibrada)' },
  { value: 1.333, label: '1.333 · Perfect Fourth (Editorial)' },
];

export function getGoogleFontsImportUrl(
  headingFont: string,
  bodyFont: string,
  monoFont: string
): string {
  const uniqueFamilies = Array.from(new Set([headingFont, bodyFont, monoFont]));
  const params = uniqueFamilies
    .map((family) => {
      const spec = GOOGLE_FONTS_CATALOG.find((f) => f.family === family);
      const weights = spec ? spec.weights.join(';') : '400;500;600;700';
      const encoded = family.trim().replace(/\s+/g, '+');
      return `family=${encoded}:wght@${weights}`;
    })
    .join('&');

  return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}

export function injectGoogleFontsLink(
  headingFont: string,
  bodyFont: string,
  monoFont: string
): void {
  if (typeof document === 'undefined') return;
  const href = getGoogleFontsImportUrl(headingFont, bodyFont, monoFont);
  const linkId = 'chromatoken-dynamic-google-fonts';
  let link = document.getElementById(linkId) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.id = linkId;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }
  if (link.href !== href) {
    link.href = href;
  }
}

export function getAvailableWeightsForFont(family: string): number[] {
  const spec = GOOGLE_FONTS_CATALOG.find((f) => f.family === family);
  return spec ? spec.weights : [400, 500, 600, 700];
}
