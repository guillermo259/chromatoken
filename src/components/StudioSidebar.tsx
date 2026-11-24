import React, { useState } from 'react';
import { Check, Link2, Palette, RefreshCw } from 'lucide-react';
import {
  ColorRole,
  DesignTokenState,
  ElevationStyle,
  GeometryConfig,
  TypographyConfig,
} from '../types/tokens';
import {
  buildAllScales,
  isValidHex,
  normalizeHex,
  ROLE_LABELS,
  SHADE_STEPS,
} from '../utils/colorEngine';
import {
  CURATED_PAIRINGS,
  getAvailableWeightsForFont,
  GOOGLE_FONTS_CATALOG,
  SCALE_RATIOS,
} from '../data/googleFonts';

interface StudioSidebarProps {
  state: DesignTokenState;
  onBrandNameChange: (name: string) => void;
  onUpdateColor: (role: ColorRole, hex: string) => void;
  onUpdateTypography: (patch: Partial<TypographyConfig>) => void;
  onApplyPairing: (pairingId: string) => void;
  onUpdateGeometry: (patch: Partial<GeometryConfig>) => void;
  onRegenerateUnlocked: () => void;
  onOpenCoolors: () => void;
  onShareUrl: () => Promise<boolean>;
}

const RADIUS_PRESETS = [
  { value: 0, label: '0px' },
  { value: 4, label: '4px' },
  { value: 8, label: '8px' },
  { value: 12, label: '12px' },
  { value: 16, label: '16px' },
  { value: 24, label: '24px' },
];

const ELEVATION_OPTIONS: Array<{ value: ElevationStyle; label: string }> = [
  { value: 'flat', label: 'Plano (Hairline)' },
  { value: 'soft', label: 'Suave' },
  { value: 'crisp', label: 'Definido' },
  { value: 'elevated', label: 'Elevado' },
];

export const StudioSidebar: React.FC<StudioSidebarProps> = ({
  state,
  onBrandNameChange,
  onUpdateColor,
  onUpdateTypography,
  onApplyPairing,
  onUpdateGeometry,
  onRegenerateUnlocked,
  onOpenCoolors,
  onShareUrl,
}) => {
  const [hexDrafts, setHexDrafts] = useState<Record<string, string>>({});
  const [sharedCopied, setSharedCopied] = useState(false);

  const scales = buildAllScales(state.colors);
  const headingWeights = getAvailableWeightsForFont(state.typography.headingFont);
  const bodyWeights = getAvailableWeightsForFont(state.typography.bodyFont);

  const headingFontOptions = GOOGLE_FONTS_CATALOG.filter(
    (f) => f.recommendedFor === 'heading' || f.recommendedFor === 'both'
  );
  const bodyFontOptions = GOOGLE_FONTS_CATALOG.filter(
    (f) => f.recommendedFor === 'body' || f.recommendedFor === 'both'
  );
  const monoFontOptions = GOOGLE_FONTS_CATALOG.filter((f) => f.recommendedFor === 'mono');

  const handleShare = async () => {
    const ok = await onShareUrl();
    if (ok) {
      setSharedCopied(true);
      setTimeout(() => setSharedCopied(false), 1800);
    }
  };

  return (
    <aside className="w-full shrink-0 border-b border-slate-200 bg-white lg:w-[360px] lg:border-r lg:border-b-0">
      <div className="divide-y divide-slate-200 lg:max-h-[calc(100vh-56px)] lg:overflow-y-auto">
        {/* Brand Name */}
        <div className="p-5">
          <label
            htmlFor="brand-name-input"
            className="block text-[11px] font-semibold tracking-wide text-slate-500 uppercase"
          >
            Nombre del Sistema
          </label>
          <input
            id="brand-name-input"
            type="text"
            value={state.brandName}
            onChange={(e) => onBrandNameChange(e.target.value)}
            placeholder="Ej. Acme Studio"
            className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:border-slate-900 focus:outline-none"
          />
        </div>

        {/* Colors */}
        <div className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
              Paleta Base
            </span>
            <button
              type="button"
              onClick={onOpenCoolors}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 cursor-pointer"
            >
              <Palette className="h-3.5 w-3.5" />
              Modo Coolors
            </button>
          </div>

          <div className="space-y-4">
            {state.colors.map((item) => {
              const scale = scales[item.role];
              const draft = hexDrafts[item.role] ?? item.hex;
              return (
                <div key={item.role}>
                  <div className="flex items-center justify-between text-xs font-medium text-slate-700">
                    <span>{ROLE_LABELS[item.role]}</span>
                    {item.locked && (
                      <span className="text-[11px] text-slate-400">Bloqueado</span>
                    )}
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <input
                      type="color"
                      value={item.hex}
                      onChange={(e) => {
                        const next = normalizeHex(e.target.value);
                        setHexDrafts((p) => ({ ...p, [item.role]: next }));
                        onUpdateColor(item.role, next);
                      }}
                      aria-label={`Selector de color ${ROLE_LABELS[item.role]}`}
                      className="h-9 w-10 shrink-0 cursor-pointer rounded-md border border-slate-200 bg-transparent p-0.5"
                    />
                    <input
                      type="text"
                      value={draft}
                      maxLength={7}
                      spellCheck={false}
                      onChange={(e) => {
                        const val = e.target.value;
                        setHexDrafts((p) => ({ ...p, [item.role]: val }));
                        if (isValidHex(val)) {
                          onUpdateColor(item.role, normalizeHex(val));
                        }
                      }}
                      onBlur={() =>
                        setHexDrafts((p) => ({ ...p, [item.role]: item.hex }))
                      }
                      aria-label={`HEX ${ROLE_LABELS[item.role]}`}
                      className="font-ui-mono w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-900 uppercase focus:border-slate-900 focus:outline-none"
                    />
                  </div>
                  {/* 11-step mini ramp strip matching designtoken.md */}
                  <div className="mt-2 grid grid-cols-11 gap-0.5 overflow-hidden rounded">
                    {SHADE_STEPS.map((step) => (
                      <button
                        key={step}
                        type="button"
                        onClick={() => {
                          const next = scale[step];
                          setHexDrafts((p) => ({ ...p, [item.role]: next }));
                          onUpdateColor(item.role, next);
                        }}
                        title={`${ROLE_LABELS[item.role]} ${step}: ${scale[step]}`}
                        style={{ backgroundColor: scale[step] }}
                        className="h-4 w-full transition-opacity hover:opacity-80 cursor-pointer"
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Typography (Google Fonts) */}
        <div className="p-5">
          <span className="block text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
            Tipografía · Google Fonts
          </span>

          {/* Curated pairing quick selector */}
          <div className="mt-3">
            <label
              htmlFor="pairing-select"
              className="block text-xs font-medium text-slate-700"
            >
              Combinación base
            </label>
            <select
              id="pairing-select"
              value={state.typography.pairingId}
              onChange={(e) => onApplyPairing(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-slate-900 focus:outline-none"
            >
              {CURATED_PAIRINGS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.headingFont} + {p.bodyFont})
                </option>
              ))}
              {state.typography.pairingId === 'custom' && (
                <option value="custom">Personalizada</option>
              )}
            </select>
          </div>

          {/* Live specimen mini card */}
          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50/60 p-3">
            <div
              style={{
                fontFamily: `"${state.typography.headingFont}", sans-serif`,
                fontWeight: state.typography.headingWeight,
                letterSpacing: `${state.typography.headingTracking}em`,
              }}
              className="text-base text-slate-900 truncate"
            >
              Muestra de Titular
            </div>
            <div
              style={{
                fontFamily: `"${state.typography.bodyFont}", sans-serif`,
                fontWeight: state.typography.bodyWeight,
              }}
              className="mt-1 text-xs text-slate-600"
            >
              Párrafo de lectura continua para validar ritmo y peso visual.
            </div>
          </div>

          {/* Heading Font + Weight */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label
                htmlFor="heading-font-select"
                className="block text-xs font-medium text-slate-700"
              >
                Fuente Títulos
              </label>
              <select
                id="heading-font-select"
                value={state.typography.headingFont}
                onChange={(e) => {
                  const nextFont = e.target.value;
                  const weights = getAvailableWeightsForFont(nextFont);
                  const nextWeight = weights.includes(state.typography.headingWeight)
                    ? state.typography.headingWeight
                    : weights[weights.length - 1];
                  onUpdateTypography({
                    pairingId: 'custom',
                    headingFont: nextFont,
                    headingWeight: nextWeight,
                  });
                }}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-900 focus:border-slate-900 focus:outline-none"
              >
                {headingFontOptions.map((f) => (
                  <option key={f.family} value={f.family}>
                    {f.family}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="heading-weight-select"
                className="block text-xs font-medium text-slate-700"
              >
                Peso
              </label>
              <select
                id="heading-weight-select"
                value={state.typography.headingWeight}
                onChange={(e) =>
                  onUpdateTypography({
                    pairingId: 'custom',
                    headingWeight: Number(e.target.value),
                  })
                }
                className="font-ui-mono mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-900 focus:border-slate-900 focus:outline-none"
              >
                {headingWeights.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Body Font + Weight */}
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label
                htmlFor="body-font-select"
                className="block text-xs font-medium text-slate-700"
              >
                Fuente Párrafos
              </label>
              <select
                id="body-font-select"
                value={state.typography.bodyFont}
                onChange={(e) => {
                  const nextFont = e.target.value;
                  const weights = getAvailableWeightsForFont(nextFont);
                  const nextWeight = weights.includes(state.typography.bodyWeight)
                    ? state.typography.bodyWeight
                    : weights[0];
                  onUpdateTypography({
                    pairingId: 'custom',
                    bodyFont: nextFont,
                    bodyWeight: nextWeight,
                  });
                }}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-900 focus:border-slate-900 focus:outline-none"
              >
                {bodyFontOptions.map((f) => (
                  <option key={f.family} value={f.family}>
                    {f.family}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="body-weight-select"
                className="block text-xs font-medium text-slate-700"
              >
                Peso
              </label>
              <select
                id="body-weight-select"
                value={state.typography.bodyWeight}
                onChange={(e) =>
                  onUpdateTypography({
                    pairingId: 'custom',
                    bodyWeight: Number(e.target.value),
                  })
                }
                className="font-ui-mono mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-900 focus:border-slate-900 focus:outline-none"
              >
                {bodyWeights.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Monospace Font */}
          <div className="mt-3">
            <label
              htmlFor="mono-font-select"
              className="block text-xs font-medium text-slate-700"
            >
              Fuente Monospace (Código y Tablas)
            </label>
            <select
              id="mono-font-select"
              value={state.typography.monoFont}
              onChange={(e) =>
                onUpdateTypography({ pairingId: 'custom', monoFont: e.target.value })
              }
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-900 focus:border-slate-900 focus:outline-none"
            >
              {monoFontOptions.map((f) => (
                <option key={f.family} value={f.family}>
                  {f.family}
                </option>
              ))}
            </select>
          </div>

          {/* Type Scale Ratio */}
          <div className="mt-3">
            <label
              htmlFor="scale-ratio-select"
              className="block text-xs font-medium text-slate-700"
            >
              Escala Jerárquica
            </label>
            <select
              id="scale-ratio-select"
              value={state.typography.scaleRatio}
              onChange={(e) =>
                onUpdateTypography({ scaleRatio: Number(e.target.value) })
              }
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-900 focus:border-slate-900 focus:outline-none"
            >
              {SCALE_RATIOS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sliders: Base Size, Line Height, Heading Tracking */}
          <div className="mt-4 space-y-3">
            <div>
              <div className="mb-1 flex justify-between text-xs text-slate-600">
                <span>Tamaño base párrafo</span>
                <span className="font-ui-mono font-semibold text-slate-900">
                  {state.typography.baseSize}px
                </span>
              </div>
              <input
                type="range"
                min={14}
                max={18}
                step={1}
                value={state.typography.baseSize}
                onChange={(e) =>
                  onUpdateTypography({ baseSize: Number(e.target.value) })
                }
                className="studio-slider w-full"
              />
            </div>

            <div>
              <div className="mb-1 flex justify-between text-xs text-slate-600">
                <span>Interlineado (Line Height)</span>
                <span className="font-ui-mono font-semibold text-slate-900">
                  {state.typography.lineHeight.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min={1.35}
                max={1.75}
                step={0.05}
                value={state.typography.lineHeight}
                onChange={(e) =>
                  onUpdateTypography({ lineHeight: Number(e.target.value) })
                }
                className="studio-slider w-full"
              />
            </div>

            <div>
              <div className="mb-1 flex justify-between text-xs text-slate-600">
                <span>Tracking títulos</span>
                <span className="font-ui-mono font-semibold text-slate-900">
                  {state.typography.headingTracking.toFixed(3)}em
                </span>
              </div>
              <input
                type="range"
                min={-0.04}
                max={0.02}
                step={0.005}
                value={state.typography.headingTracking}
                onChange={(e) =>
                  onUpdateTypography({ headingTracking: Number(e.target.value) })
                }
                className="studio-slider w-full"
              />
            </div>
          </div>
        </div>

        {/* Geometry: Border Radius, Spacing & Elevation */}
        <div className="p-5">
          <span className="block text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
            Radio, Espaciado y Elevación
          </span>

          {/* Border Radius */}
          <div className="mt-3">
            <div className="mb-1.5 flex items-center justify-between text-xs text-slate-700">
              <span className="font-medium">Border Radius</span>
              <span className="font-ui-mono font-semibold text-slate-900">
                {state.geometry.radiusBase}px
              </span>
            </div>
            <div className="grid grid-cols-6 gap-1">
              {RADIUS_PRESETS.map((preset) => {
                const active = state.geometry.radiusBase === preset.value;
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => onUpdateGeometry({ radiusBase: preset.value })}
                    className={`rounded-md border py-1.5 font-ui-mono text-[11px] font-medium transition-colors cursor-pointer ${
                      active
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card Padding */}
          <div className="mt-4">
            <div className="mb-1 flex justify-between text-xs text-slate-700">
              <span className="font-medium">Padding de Cards</span>
              <span className="font-ui-mono font-semibold text-slate-900">
                {state.geometry.cardPadding}px
              </span>
            </div>
            <input
              type="range"
              min={16}
              max={36}
              step={4}
              value={state.geometry.cardPadding}
              onChange={(e) =>
                onUpdateGeometry({ cardPadding: Number(e.target.value) })
              }
              className="studio-slider w-full"
            />
          </div>

          {/* Element Gap */}
          <div className="mt-3">
            <div className="mb-1 flex justify-between text-xs text-slate-700">
              <span className="font-medium">Espaciado (Gap)</span>
              <span className="font-ui-mono font-semibold text-slate-900">
                {state.geometry.elementGap}px
              </span>
            </div>
            <input
              type="range"
              min={8}
              max={32}
              step={4}
              value={state.geometry.elementGap}
              onChange={(e) =>
                onUpdateGeometry({ elementGap: Number(e.target.value) })
              }
              className="studio-slider w-full"
            />
          </div>

          {/* Spacing Unit */}
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-700">Unidad de rejilla</span>
            <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
              {[4, 8].map((unit) => (
                <button
                  key={unit}
                  type="button"
                  onClick={() => onUpdateGeometry({ spacingUnit: unit })}
                  className={`rounded-md px-2.5 py-1 font-ui-mono text-xs font-medium transition-colors cursor-pointer ${
                    state.geometry.spacingUnit === unit
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {unit}px
                </button>
              ))}
            </div>
          </div>

          {/* Elevation & Shadows */}
          <div className="mt-4">
            <span className="block text-xs font-medium text-slate-700">
              Elevación y Sombras
            </span>
            <div className="mt-1.5 grid grid-cols-2 gap-1.5">
              {ELEVATION_OPTIONS.map((opt) => {
                const active = state.geometry.elevationStyle === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onUpdateGeometry({ elevationStyle: opt.value })}
                    className={`rounded-lg border px-2.5 py-2 text-left text-xs font-medium transition-colors cursor-pointer ${
                      active
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="space-y-2 p-5">
          <button
            type="button"
            onClick={onRegenerateUnlocked}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Generar Nueva Paleta
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-50 cursor-pointer"
          >
            {sharedCopied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                Enlace copiado al portapapeles
              </>
            ) : (
              <>
                <Link2 className="h-3.5 w-3.5" />
                Compartir configuración
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
};
