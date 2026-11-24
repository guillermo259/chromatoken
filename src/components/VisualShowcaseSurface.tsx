import React, { useMemo, useState } from 'react';
import { AlertCircle, AlertTriangle, Check, CheckCircle2, ArrowUpRight } from 'lucide-react';
import { ColorRole, DesignTokenState } from '../types/tokens';
import {
  buildAllScales,
  contrastRatioExact,
  deriveSemanticTheme,
  getAccessibleTextColor,
  getWcagLabel,
  SHADE_STEPS,
} from '../utils/colorEngine';
import {
  getElevationShadows,
  getRadiusScale,
  getSpacingScale,
  getTypeScale,
} from '../utils/tokenExporters';
import { roleNames } from '../i18n/messages';
import { auditContrast, ContrastReport, formatRatio } from '../utils/contrastAudit';
import { useTranslation } from '../i18n/LocaleProvider';

interface VisualShowcaseSurfaceProps {
  state: DesignTokenState;
  mode: 'light' | 'dark';
  compact?: boolean;
  contrastReport?: ContrastReport;
}

export const VisualShowcaseSurface: React.FC<VisualShowcaseSurfaceProps> = ({
  state,
  mode,
  compact = false,
  contrastReport: providedContrastReport,
}) => {
  const t = useTranslation();
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [switchActive, setSwitchActive] = useState(true);
  const [inputValue, setInputValue] = useState('design-system@acme.studio');
  const [inputFocused, setInputFocused] = useState(false);
  const [selectedBtn, setSelectedBtn] = useState<{ label: string; token: string; hex: string } | null>(null);
  const [reportExpanded, setReportExpanded] = useState(false);

  const scales = buildAllScales(state.colors);
  const rawMap = state.colors.reduce(
    (acc, item) => {
      acc[item.role] = item.hex;
      return acc;
    },
    {} as Record<ColorRole, string>
  );

  const theme = deriveSemanticTheme(scales, rawMap, mode, state.contrastLevel);
  const contrastReport = useMemo(
    () => providedContrastReport ?? auditContrast(state.colors, state.contrastLevel),
    [providedContrastReport, state.colors, state.contrastLevel]
  );
  const typeScale = getTypeScale(state.typography.baseSize, state.typography.scaleRatio);
  const radii = getRadiusScale(state.geometry.radiusBase);
  const spacing = getSpacingScale(state.geometry.spacingUnit);
  const allShadows = getElevationShadows(state.geometry.elevationStyle);
  const shadows = mode === 'light' ? allShadows.light : allShadows.dark;

  const headingStyle: React.CSSProperties = {
    fontFamily: `"${state.typography.headingFont}", sans-serif`,
    fontWeight: state.typography.headingWeight,
    letterSpacing: `${state.typography.headingTracking}em`,
    color: theme.text,
  };

  const bodyStyle: React.CSSProperties = {
    fontFamily: `"${state.typography.bodyFont}", sans-serif`,
    fontWeight: state.typography.bodyWeight,
    lineHeight: state.typography.lineHeight,
    color: theme.textSecondary,
  };

  const monoStyle: React.CSSProperties = {
    fontFamily: `"${state.typography.monoFont}", monospace`,
    fontVariantNumeric: 'tabular-nums',
  };

  const handleCopy = async (hex: string) => {
    try {
      await navigator.clipboard.writeText(hex);
      setCopiedHex(hex);
      setTimeout(() => setCopiedHex((prev) => (prev === hex ? null : prev)), 1200);
    } catch {
      // Clipboard fallback ignored
    }
  };

  const primaryContrastOnSurface = contrastRatioExact(theme.primary, theme.surface);
  const textContrastOnSurface = contrastRatioExact(theme.text, theme.surface);

  return (
    <div
      style={{
        backgroundColor: theme.canvas,
        color: theme.text,
        borderColor: theme.border,
        borderRadius: `${radii.xl}px`,
      }}
      className="border transition-colors duration-200"
    >
      <div
        style={{
          padding: compact ? '20px' : '32px',
          gap: `${Math.max(24, state.geometry.elementGap * 1.5)}px`,
        }}
        className="flex flex-col"
      >
        {/* Top Mode & Brand Summary Strip */}
        <div
          style={{ borderColor: theme.border }}
          className="flex flex-wrap items-baseline justify-between gap-4 border-b pb-4"
        >
          <div>
            <div
              style={{ ...monoStyle, color: theme.textMuted }}
              className="text-[11px] font-medium uppercase tracking-wider"
            >
              {mode === 'light' ? t('Modo claro') : t('Modo oscuro')} · {state.brandName || t('Sistema de diseño')}
            </div>
            <h2
              style={{
                ...headingStyle,
                fontSize: `${compact ? typeScale.xl : typeScale['2xl']}px`,
              }}
              className="mt-1"
            >
              {t('Tokens aplicados a componentes reales')}
            </h2>
          </div>

          <div
            style={{ ...monoStyle, color: theme.textMuted }}
            className="flex items-center gap-3 text-xs"
          >
            <span>
              {t('Texto')}{' '}{formatRatio(textContrastOnSurface)}:1 ({t(getWcagLabel(textContrastOnSurface))})
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {t('Primario')} {formatRatio(primaryContrastOnSurface)}:1 ({t(getWcagLabel(primaryContrastOnSurface))})
            </span>
          </div>
        </div>

        {/* 01. Color Palette & Ramps */}
        <section>
          <div className="mb-3 flex items-baseline justify-between gap-2">
            <h3
              style={{ ...monoStyle, color: theme.textMuted }}
              className="text-xs font-medium uppercase tracking-wider"
            >
              {t('Escalas de color, 50 a 950')}
            </h3>
            {copiedHex && (
              <span
                style={{ ...monoStyle, color: theme.primary }}
                className="inline-flex items-center gap-1 text-xs font-medium"
              >
                <Check className="h-3 w-3" />
                {t('Copiado {0}', copiedHex)}
              </span>
            )}
          </div>

          <div className="space-y-2.5">
            {state.colors.map((item) => {
              const ramp = scales[item.role];
              return (
                <div
                  key={item.role}
                  className="grid grid-cols-1 gap-2 sm:grid-cols-[92px_1fr] sm:items-center"
                >
                  <div className="flex items-baseline justify-between sm:block">
                    <span style={bodyStyle} className="text-xs font-semibold">
                      {t(roleNames[item.role])}
                    </span>
                    <div
                      style={{ ...monoStyle, color: theme.textMuted }}
                      className="text-[11px]"
                    >
                      {item.hex}
                    </div>
                  </div>
                  <div className="grid grid-cols-11 gap-1">
                    {SHADE_STEPS.map((step) => {
                      const hex = ramp[step];
                      const isBase = hex === item.hex;
                      return (
                        <button
                          key={step}
                          type="button"
                          onClick={() => handleCopy(hex)}
                          title={t('{0} {1}: {2} (clic para copiar)', t(roleNames[item.role]), step, hex)}
                          style={{
                            backgroundColor: hex,
                            borderRadius: `${radii.sm}px`,
                          }}
                          className={`group relative h-8 w-full transition-transform hover:scale-105 cursor-pointer ${
                            isBase ? 'ring-2 ring-offset-1' : ''
                          }`}
                        >
                          {isBase && (
                            <span
                              style={{
                                backgroundColor:
                                  contrastRatioExact(hex, '#FFFFFF') >= 4.5
                                    ? '#FFFFFF'
                                    : '#0F172A',
                              }}
                              className="mx-auto block h-1.5 w-1.5 rounded-full"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Semantic Surfaces Strip */}
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { name: 'Lienzo', hex: theme.canvas },
              { name: 'Superficie', hex: theme.surface },
              { name: 'Borde', hex: theme.border },
              { name: 'Primario', hex: theme.primary },
            ].map((token) => (
              <button
                key={t(token.name)}
                type="button"
                onClick={() => handleCopy(token.hex)}
                style={{
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  borderRadius: `${radii.md}px`,
                }}
                className="flex items-center gap-2.5 border p-2 text-left transition-opacity hover:opacity-85 cursor-pointer"
              >
                <span
                  style={{
                    backgroundColor: token.hex,
                    borderColor: theme.borderStrong,
                    borderRadius: `${radii.sm}px`,
                  }}
                  className="h-6 w-6 shrink-0 border"
                />
                <span className="min-w-0">
                  <span
                    style={{ color: theme.text }}
                    className="block truncate text-xs font-medium"
                  >
                    {t(token.name)}
                  </span>
                  <span
                    style={{ ...monoStyle, color: theme.textMuted }}
                    className="block text-[10px]"
                  >
                    {token.hex}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* 02. Typography Hierarchy */}
        <section
          style={{ borderColor: theme.border }}
          className="border-t pt-6"
        >
          <h3
            style={{ ...monoStyle, color: theme.textMuted }}
            className="mb-4 text-xs font-medium uppercase tracking-wider"
          >
            {t('Jerarquía tipográfica')}
          </h3>

          <div className="space-y-4">
            <div>
              <div
                style={{ ...monoStyle, color: theme.textMuted }}
                className="mb-1 text-[11px]"
              >
                Display · {state.typography.headingFont} · {state.typography.headingWeight} ·{' '}
                {typeScale['4xl']}px
              </div>
              <div
                style={{
                  ...headingStyle,
                  fontSize: `${compact ? typeScale['2xl'] : typeScale['4xl']}px`,
                  lineHeight: 1.12,
                }}
              >
                {t('Sistemas visuales consistentes')}
              </div>
            </div>

            <div>
              <div
                style={{ ...monoStyle, color: theme.textMuted }}
                className="mb-1 text-[11px]"
              >
                Heading H2 · {state.typography.headingFont} · {state.typography.headingWeight} ·{' '}
                {typeScale['2xl']}px
              </div>
              <div
                style={{
                  ...headingStyle,
                  fontSize: `${compact ? typeScale.xl : typeScale['2xl']}px`,
                  lineHeight: 1.22,
                }}
              >
                {t('Escala proporcional de títulos y bloques')}
              </div>
            </div>

            <div>
              <div
                style={{ ...monoStyle, color: theme.textMuted }}
                className="mb-1 text-[11px]"
              >
                Body · {state.typography.bodyFont} · {state.typography.bodyWeight} ·{' '}
                {typeScale.base}px / {state.typography.lineHeight}
              </div>
              <p
                style={{
                  ...bodyStyle,
                  fontSize: `${typeScale.base}px`,
                }}
                className="max-w-[65ch]"
              >
                {t('Los tokens de diseño conectan la intención visual con el código en producción. Esta tipografía equilibra legibilidad sostenida en párrafos largos con una jerarquía clara en interfaces complejas.')}
              </p>
            </div>

            <div className="flex flex-wrap items-baseline justify-between gap-4 pt-1">
              <span
                style={{
                  ...bodyStyle,
                  fontSize: `${typeScale.sm}px`,
                  color: theme.textMuted,
                }}
              >
                {t('Caption ({0}px): Etiquetas secundarias, fechas y anotaciones de interfaz.', typeScale.sm)}
              </span>
              <span
                style={{
                  ...monoStyle,
                  fontSize: `${typeScale.sm}px`,
                  color: theme.text,
                }}
              >
                24,890.50 € · +14.2%
              </span>
            </div>
          </div>
        </section>

        {/* 03. Buttons & Interactive Controls */}
        <section
          style={{ borderColor: theme.border }}
          className="border-t pt-6"
        >
          <h3
            style={{ ...monoStyle, color: theme.textMuted }}
            className="mb-4 text-xs font-medium uppercase tracking-wider"
          >
            {t('Botones e interacción')}
          </h3>

          <div className="flex flex-wrap items-center gap-3">
            {[
              {
                label: 'Primario',
                token: '--color-primary',
                hex: theme.primary,
                style: {
                  backgroundColor: theme.primary,
                  color: theme.onPrimary,
                  boxShadow: shadows.sm,
                },
                border: false,
              },
              {
                label: 'Secundario',
                token: '--color-secondary',
                hex: theme.secondary,
                style: {
                  backgroundColor: theme.secondary,
                  color: theme.onSecondary,
                },
                border: false,
              },
              {
                label: 'Acento',
                token: '--color-accent',
                hex: theme.accent,
                style: {
                  backgroundColor: theme.accent,
                  color: theme.onAccent,
                },
                border: false,
              },
              {
                label: 'Contorno',
                token: '--color-border-strong',
                hex: theme.borderStrong,
                style: {
                  backgroundColor: theme.surface,
                  color: theme.text,
                  borderColor: theme.borderStrong,
                },
                border: true,
              },
              {
                label: 'Fantasma',
                token: '--color-text-secondary',
                hex: theme.textSecondary,
                style: {
                  backgroundColor: 'transparent',
                  color: theme.textSecondary,
                },
                border: false,
              },
              {
                label: 'Destructivo',
                token: '--color-destructive',
                hex: theme.destructive,
                style: {
                  backgroundColor: theme.destructive,
                  color: getAccessibleTextColor(theme.destructive),
                },
                border: false,
              },
            ].map((btn) => {
              const isSelected = selectedBtn?.label === btn.label;
              return (
                <button
                  key={t(btn.label)}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() =>
                    setSelectedBtn(
                      isSelected ? null : { label: btn.label, token: btn.token, hex: btn.hex }
                    )
                  }
                  style={{
                    ...btn.style,
                    borderRadius: `${radii.md}px`,
                    fontFamily: bodyStyle.fontFamily,
                    fontWeight: 600,
                    fontSize: `${typeScale.sm}px`,
                    outline: isSelected ? `2px solid ${theme.primary}` : undefined,
                    outlineOffset: isSelected ? '2px' : undefined,
                  }}
                  className={`${btn.border ? 'border ' : ''}px-4 py-2 transition-opacity hover:opacity-90 cursor-pointer whitespace-nowrap`}
                >
                  {t(btn.label)}
                </button>
              );
            })}
          </div>
          {selectedBtn && (
            <p
              style={{ ...monoStyle, color: theme.textMuted }}
              className="mt-3 text-xs"
            >
              {t('Botón «{0}» · {1} ({2})', t(selectedBtn.label), selectedBtn.token, selectedBtn.hex)}
            </p>
          )}
        </section>

        {/* 04. Cards, Elevations & Spacing */}
        <section
          style={{ borderColor: theme.border }}
          className="border-t pt-6"
        >
          <h3
            style={{ ...monoStyle, color: theme.textMuted }}
            className="mb-4 text-xs font-medium uppercase tracking-wider"
          >
            {t('Elevación, radio y espaciado ({0}px de relleno · {1}px de radio)', state.geometry.cardPadding, radii.lg)}
          </h3>

          <div
            style={{ gap: `${state.geometry.elementGap}px` }}
            className={`grid grid-cols-1 ${compact ? '' : 'md:grid-cols-3'}`}
          >
            {[
              {
                tier: 'Elevación 1 · sm',
                title: 'Superficie base',
                desc: 'Contenedores estándar y paneles de datos.',
                shadow: shadows.sm,
                bg: theme.surface,
              },
              {
                tier: 'Elevación 2 · md',
                title: 'Tarjeta elevada',
                desc: 'Elementos interactivos y tarjetas destacadas.',
                shadow: shadows.md,
                bg: theme.surface,
              },
              {
                tier: 'Elevación 3 · lg',
                title: 'Capa flotante',
                desc: 'Menús contextuales, popovers y modales.',
                shadow: shadows.lg,
                bg: theme.surfaceRaised,
              },
            ].map((card) => (
              <div
                key={card.tier}
                style={{
                  backgroundColor: card.bg,
                  borderColor: theme.border,
                  borderRadius: `${radii.lg}px`,
                  padding: `${state.geometry.cardPadding}px`,
                  boxShadow: card.shadow,
                }}
                className="border transition-all"
              >
                <div
                  style={{ ...monoStyle, color: theme.primary }}
                  className="text-[11px] font-semibold"
                >
                  {t(card.tier)}
                </div>
                <h4
                  style={{
                    ...headingStyle,
                    fontSize: `${typeScale.lg}px`,
                  }}
                  className="mt-1.5"
                >
                  {t(card.title)}
                </h4>
                <p
                  style={{
                    ...bodyStyle,
                    fontSize: `${typeScale.sm}px`,
                  }}
                  className="mt-1.5"
                >
                  {t(card.desc)}
                </p>
              </div>
            ))}
          </div>

          {/* Spacing Scale Visual Ruler */}
          <div className="mt-5">
            <div
              style={{ ...monoStyle, color: theme.textMuted }}
              className="mb-2 text-[11px]"
            >
              {t('Escala de espaciado (unidad {0}px)', state.geometry.spacingUnit)}
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4">
              {Object.entries(spacing).map(([key, px]) => (
                <div key={key} className="flex items-center gap-2.5">
                  <span
                    style={{ ...monoStyle, color: theme.textMuted }}
                    className="w-16 text-[11px]"
                  >
                    s-{key} ({px}px)
                  </span>
                  <div
                    style={{
                      width: `${Math.min(px * 1.4, 96)}px`,
                      backgroundColor: theme.primary,
                      borderRadius: `${Math.min(radii.sm, 4)}px`,
                    }}
                    className="h-2 shrink-0"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 05. Inputs, Semantic Alerts & Mini Product Composition */}
        <section
          style={{ borderColor: theme.border }}
          className="border-t pt-6"
        >
          <h3
            style={{ ...monoStyle, color: theme.textMuted }}
            className="mb-4 text-xs font-medium uppercase tracking-wider"
          >
            {t('Formularios, estados y una pantalla de ejemplo')}
          </h3>

          <div
            style={{ gap: `${state.geometry.elementGap}px` }}
            className={`grid grid-cols-1 ${compact ? '' : 'lg:grid-cols-2'}`}
          >
            {/* Form + Semantic notices */}
            <div
              style={{
                backgroundColor: theme.surface,
                borderColor: theme.border,
                borderRadius: `${radii.lg}px`,
                padding: `${state.geometry.cardPadding}px`,
                boxShadow: shadows.sm,
                gap: `${state.geometry.elementGap}px`,
              }}
              className="flex flex-col border"
            >
              <div>
                <label
                  style={{ ...bodyStyle, color: theme.text }}
                  className="block text-xs font-semibold"
                >
                  {t('Correo de notificación')}
                </label>
                <input
                  type="email"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  style={{
                    backgroundColor: theme.canvas,
                    color: theme.text,
                    borderColor: inputFocused ? theme.primary : theme.borderStrong,
                    borderRadius: `${radii.md}px`,
                    fontFamily: bodyStyle.fontFamily,
                    fontSize: `${typeScale.sm}px`,
                    outline: inputFocused ? `2px solid ${theme.primary}33` : 'none',
                  }}
                  className="mt-1.5 w-full border px-3 py-2 transition-all"
                />
              </div>

              <div className="flex items-center justify-between">
                <span
                  style={{ ...bodyStyle, color: theme.text }}
                  className="text-xs font-medium"
                >
                  {t('Sincronizar variables automáticas')}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={switchActive}
                  onClick={() => setSwitchActive((v) => !v)}
                  style={{
                    backgroundColor: switchActive ? theme.primary : theme.borderStrong,
                  }}
                  className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer"
                >
                  <span
                    style={{
                      transform: switchActive ? 'translateX(22px)' : 'translateX(3px)',
                    }}
                    className="inline-block h-4 w-4 rounded-full bg-white transition-transform"
                  />
                </button>
              </div>

              {/* Semantic state banners (icon + text label, no hue-only signaling) */}
              <div className="space-y-2 pt-1">
                <div
                  style={{
                    backgroundColor: theme.successSurface,
                    color: theme.success,
                    borderRadius: `${radii.md}px`,
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-medium"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>
                    {contrastReport.failures.length === 0
                      ? t('Contraste {0} verificado ({1}/{2}).', state.contrastLevel, contrastReport.passed, contrastReport.total)
                      : t('Sistema sincronizado ({0}/{1} pares {2}).', contrastReport.passed, contrastReport.total, state.contrastLevel)}
                  </span>
                </div>
                <div
                  style={{
                    backgroundColor: theme.warningSurface,
                    color: theme.warning,
                    borderRadius: `${radii.md}px`,
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-medium"
                >
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>
                    {contrastReport.failures.length > 0
                      ? t(
                          contrastReport.failures.length === 1
                            ? 'Atención: {0} combinación requiere ajuste para {1}.'
                            : 'Atención: {0} combinaciones requieren ajuste para {1}.',
                          contrastReport.failures.length,
                          state.contrastLevel
                        )
                      : t('Atención: Revisa el peso en cuerpos menores a 13px.')}
                  </span>
                </div>
                <div
                  style={{
                    backgroundColor: theme.destructiveSurface,
                    color: theme.destructive,
                    borderRadius: `${radii.md}px`,
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-medium"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{t('Error: Token obsoleto detectado en el paquete.')}</span>
                </div>
              </div>
            </div>

            {/* Cohesive Mini App UI Card */}
            <div
              style={{
                backgroundColor: theme.surface,
                borderColor: theme.border,
                borderRadius: `${radii.lg}px`,
                padding: `${state.geometry.cardPadding}px`,
                boxShadow: shadows.md,
              }}
              className="flex flex-col justify-between border"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span
                    style={{ ...monoStyle, color: theme.accent }}
                    className="text-[11px] font-semibold uppercase tracking-wider"
                  >
                    {t('Resumen Mensual')}
                  </span>
                  <span
                    style={{ ...monoStyle, color: theme.textMuted }}
                    className="text-xs"
                  >
                    Nov 2026
                  </span>
                </div>

                <h4
                  style={{
                    ...headingStyle,
                    fontSize: `${typeScale.xl}px`,
                  }}
                  className="mt-2"
                >
                  {t('{0} Analytics', state.brandName || t('Producto Digital'))}
                </h4>
                <p
                  style={{
                    ...bodyStyle,
                    fontSize: `${typeScale.sm}px`,
                  }}
                  className="mt-1.5"
                >
                  {t(mode === 'light'
                    ? 'Vista combinada con tu tipografía, espaciado de tarjeta, bordes y jerarquía de color sobre fondo claro.'
                    : 'Vista combinada con tu tipografía, espaciado de tarjeta, bordes y jerarquía de color sobre fondo oscuro.'
                  )}
                </p>

                <div
                  style={{
                    backgroundColor: theme.surfaceMuted,
                    borderRadius: `${Math.max(0, radii.lg - 4)}px`,
                  }}
                  className="mt-4 flex items-baseline justify-between p-3.5"
                >
                  <div>
                    <div
                      style={{ color: theme.textMuted }}
                      className="text-[11px] font-medium"
                    >
                      {t('Conversión neta')}
                    </div>
                    <div
                      style={{
                        ...headingStyle,
                        fontSize: `${typeScale['2xl']}px`,
                      }}
                      className="mt-0.5 tabular-nums"
                    >
                      4.82%
                    </div>
                  </div>
                  <div
                    style={{ ...monoStyle, color: theme.primary }}
                    className="text-xs font-semibold"
                  >
                    {t('+0.64% vs oct')}
                  </div>
                </div>
                {reportExpanded && (
                  <div
                    style={{
                      borderColor: theme.border,
                      color: theme.textSecondary,
                    }}
                    className="mt-3 space-y-1.5 border-t pt-3 text-xs"
                  >
                    <div className="flex justify-between">
                      <span>{t('Tráfico orgánico')}</span>
                      <span style={monoStyle}>2.91%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('Acceso directo')}</span>
                      <span style={monoStyle}>1.18%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('Campañas')}</span>
                      <span style={monoStyle}>0.73%</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-5 flex items-center justify-between gap-3">
                <span
                  style={{ ...bodyStyle, color: theme.textMuted }}
                  className="text-xs"
                >
                  {t('Actualizado hoy')}
                </span>
                <button
                  type="button"
                  aria-expanded={reportExpanded}
                  onClick={() => setReportExpanded((v) => !v)}
                  style={{
                    backgroundColor: theme.primary,
                    color: theme.onPrimary,
                    borderRadius: `${radii.md}px`,
                    fontFamily: bodyStyle.fontFamily,
                    fontWeight: 600,
                    fontSize: `${typeScale.sm}px`,
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 transition-opacity hover:opacity-90 cursor-pointer whitespace-nowrap"
                >
                  {reportExpanded ? t('Ocultar detalle') : t('Explorar reporte')}
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
