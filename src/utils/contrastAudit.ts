import { ColorRole, ContrastLevel, PaletteColor } from '../types/tokens';
import {
  buildAllScales,
  contrastRatioExact,
  deriveSemanticTheme,
  hexToHsl,
  hslToHex,
  SemanticThemeColors,
} from './colorEngine';

/**
 * Contrast audit over the pairs the design system actually renders.
 *
 * Every check reads two colors from the semantic theme (light and dark), so it judges what
 * ships in the exported tokens, not a color against an arbitrary white or black.
 * Thresholds follow WCAG 2.2: 1.4.3 / 1.4.6 for text, 1.4.11 for non-text UI.
 */

export type CheckKind = 'text' | 'ui';
export type ThemeMode = 'light' | 'dark';
export type CheckRole = ColorRole | 'system';

interface CheckSpec {
  id: string;
  /** Palette role whose HEX is adjusted to fix this pair, or 'system' for fixed status pairs */
  role: CheckRole;
  kind: CheckKind;
  label: string;
  fg: (t: SemanticThemeColors) => string;
  bg: (t: SemanticThemeColors) => string;
}

export interface ContrastCheck {
  key: string;
  id: string;
  role: CheckRole;
  kind: CheckKind;
  mode: ThemeMode;
  label: string;
  fg: string;
  bg: string;
  ratio: number;
  required: number;
  passes: boolean;
}

export interface RoleFix {
  role: ColorRole;
  from: string;
  to: string;
  /** True when the suggestion clears every check of the role, not only some of them */
  complete: boolean;
}

export interface ContrastReport {
  level: ContrastLevel;
  checks: ContrastCheck[];
  failures: ContrastCheck[];
  passed: number;
  total: number;
  failingRoles: ColorRole[];
  fixes: Partial<Record<ColorRole, RoleFix>>;
}

const CHECKS: CheckSpec[] = [
  {
    id: 'on-primary',
    role: 'primary',
    kind: 'text',
    label: 'Texto sobre botón primario',
    fg: (t) => t.onPrimary,
    bg: (t) => t.primary,
  },
  {
    id: 'primary-ui',
    role: 'primary',
    kind: 'ui',
    label: 'Primario como foco, icono o borde activo',
    fg: (t) => t.primary,
    bg: (t) => t.surface,
  },
  {
    id: 'on-secondary',
    role: 'secondary',
    kind: 'text',
    label: 'Texto sobre botón secundario',
    fg: (t) => t.onSecondary,
    bg: (t) => t.secondary,
  },
  {
    id: 'on-accent',
    role: 'accent',
    kind: 'text',
    label: 'Texto sobre acento',
    fg: (t) => t.onAccent,
    bg: (t) => t.accent,
  },
  {
    id: 'text',
    role: 'neutral',
    kind: 'text',
    label: 'Texto principal sobre el lienzo',
    fg: (t) => t.text,
    bg: (t) => t.canvas,
  },
  {
    id: 'text-secondary',
    role: 'neutral',
    kind: 'text',
    label: 'Texto secundario sobre superficie',
    fg: (t) => t.textSecondary,
    bg: (t) => t.surface,
  },
  {
    id: 'text-muted',
    role: 'neutral',
    kind: 'text',
    label: 'Texto atenuado sobre superficie',
    fg: (t) => t.textMuted,
    bg: (t) => t.surface,
  },
  {
    id: 'text-muted-surface-muted',
    role: 'neutral',
    kind: 'text',
    label: 'Texto atenuado sobre superficie atenuada',
    fg: (t) => t.textMuted,
    bg: (t) => t.surfaceMuted,
  },
  {
    id: 'text-muted-surface-raised',
    role: 'neutral',
    kind: 'text',
    label: 'Texto atenuado sobre tarjeta elevada',
    fg: (t) => t.textMuted,
    bg: (t) => t.surfaceRaised,
  },
  {
    id: 'border-input',
    role: 'neutral',
    kind: 'ui',
    label: 'Borde de campos y controles sobre lienzo',
    fg: (t) => t.borderStrong,
    bg: (t) => t.canvas,
  },
  {
    id: 'status-success',
    role: 'system',
    kind: 'text',
    label: 'Aviso de éxito sobre su fondo',
    fg: (t) => t.success,
    bg: (t) => t.successSurface,
  },
  {
    id: 'status-warning',
    role: 'system',
    kind: 'text',
    label: 'Aviso de advertencia sobre su fondo',
    fg: (t) => t.warning,
    bg: (t) => t.warningSurface,
  },
  {
    id: 'status-destructive',
    role: 'system',
    kind: 'text',
    label: 'Aviso de error sobre su fondo',
    fg: (t) => t.destructive,
    bg: (t) => t.destructiveSurface,
  },
];

const MODES: ThemeMode[] = ['light', 'dark'];

export const MODE_LABELS: Record<ThemeMode, string> = { light: 'Claro', dark: 'Oscuro' };

export { contrastRatioExact };

export function requiredRatio(kind: CheckKind, level: ContrastLevel): number {
  if (kind === 'ui') return 3; // WCAG has no AAA tier for non-text contrast
  return level === 'AAA' ? 7 : 4.5;
}

/** Truncate for display so a shown value never rounds up past a threshold it misses. */
export function formatRatio(ratio: number): string {
  return (Math.floor(ratio * 100) / 100).toFixed(2);
}

function themesFor(colors: PaletteColor[], level: ContrastLevel): Record<ThemeMode, SemanticThemeColors> {
  const scales = buildAllScales(colors);
  const raw = Object.fromEntries(colors.map((c) => [c.role, c.hex])) as Record<ColorRole, string>;
  return {
    light: deriveSemanticTheme(scales, raw, 'light', level),
    dark: deriveSemanticTheme(scales, raw, 'dark', level),
  };
}

function runChecks(colors: PaletteColor[], level: ContrastLevel, only?: ColorRole): ContrastCheck[] {
  const themes = themesFor(colors, level);
  const out: ContrastCheck[] = [];
  for (const mode of MODES) {
    for (const spec of CHECKS) {
      if (only && spec.role !== only) continue;
      const fg = spec.fg(themes[mode]);
      const bg = spec.bg(themes[mode]);
      const ratio = contrastRatioExact(fg, bg);
      const required = requiredRatio(spec.kind, level);
      out.push({
        key: `${spec.id}:${mode}`,
        id: spec.id,
        role: spec.role,
        kind: spec.kind,
        mode,
        label: spec.label,
        fg,
        bg,
        ratio,
        required,
        passes: ratio >= required,
      });
    }
  }
  return out;
}

function withHex(colors: PaletteColor[], role: ColorRole, hex: string): PaletteColor[] {
  return colors.map((c) => (c.role === role ? { ...c, hex } : c));
}

/**
 * Nearest HEX for `role` that clears its checks, moving only lightness so hue and saturation
 * (the harmony the user chose) survive. Scans outward one lightness point at a time in both
 * directions; the shade scale and the theme are rebuilt for every candidate because neutral
 * text tokens come from the scale, not the base HEX.
 */
export function findRoleFix(colors: PaletteColor[], role: ColorRole, level: ContrastLevel): RoleFix | null {
  const current = colors.find((c) => c.role === role);
  if (!current) return null;
  const before = runChecks(colors, level, role);
  const failingBefore = before.filter((c) => !c.passes).length;
  if (failingBefore === 0) return null;

  const { h, s, l } = hexToHsl(current.hex);
  let partial: { hex: string; failing: number } | null = null;

  for (let delta = 1; delta <= 92; delta++) {
    for (const dir of [-1, 1]) {
      const nextL = l + dir * delta;
      if (nextL < 4 || nextL > 96) continue;
      const hex = hslToHex(h, s, nextL);
      if (hex.toUpperCase() === current.hex.toUpperCase()) continue;
      const failing = runChecks(withHex(colors, role, hex), level, role).filter((c) => !c.passes).length;
      if (failing === 0) return { role, from: current.hex, to: hex, complete: true };
      if (failing < failingBefore && (!partial || failing < partial.failing)) {
        partial = { hex, failing };
      }
    }
  }

  return partial ? { role, from: current.hex, to: partial.hex, complete: false } : null;
}

export function auditContrast(colors: PaletteColor[], level: ContrastLevel): ContrastReport {
  const checks = runChecks(colors, level);
  const failures = checks.filter((c) => !c.passes);
  const failingRoles = [...new Set(failures.map((f) => f.role).filter((r): r is ColorRole => r !== 'system'))];
  const fixes: Partial<Record<ColorRole, RoleFix>> = {};
  for (const role of failingRoles) {
    const fix = findRoleFix(colors, role, level);
    if (fix) fixes[role] = fix;
  }
  return {
    level,
    checks,
    failures,
    passed: checks.length - failures.length,
    total: checks.length,
    failingRoles,
    fixes,
  };
}

/**
 * Applied right after generating: nudges unlocked colors until their pairs pass.
 * Locked colors are never touched; they surface in the report instead.
 */
export function enforceContrast(colors: PaletteColor[], level: ContrastLevel): PaletteColor[] {
  let next = colors;
  // Neutral first: it defines text and surfaces that other roles are measured against
  const order: ColorRole[] = ['neutral', 'primary', 'secondary', 'accent'];
  for (const role of order) {
    const slot = next.find((c) => c.role === role);
    if (!slot || slot.locked) continue;
    const fix = findRoleFix(next, role, level);
    if (fix) next = withHex(next, role, fix.to);
  }
  return next;
}
