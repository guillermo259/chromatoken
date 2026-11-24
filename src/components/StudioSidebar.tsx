import React, { useState } from 'react';
import { Lock, Shuffle, SquarePen } from 'lucide-react';
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
import { getElevationShadows } from '../utils/tokenExporters';
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
  onOpenPalette: () => void;
}

type PanelTab = 'color' | 'type' | 'shape';

const TABS: Array<{ id: PanelTab; label: string }> = [
  { id: 'color', label: 'Color' },
  { id: 'type', label: 'Tipografía' },
  { id: 'shape', label: 'Forma' },
];

const RADIUS_PRESETS = [0, 4, 8, 12, 16, 24];

const ELEVATION_OPTIONS: Array<{ value: ElevationStyle; label: string }> = [
  { value: 'flat', label: 'Plana' },
  { value: 'soft', label: 'Suave' },
  { value: 'crisp', label: 'Definida' },
  { value: 'elevated', label: 'Elevada' },
];

/* ---------------------------- small primitives ---------------------------- */

const inputBase =
  'w-full rounded-lg border border-line bg-sheet px-3 text-sm text-ink transition-colors hover:border-ink-soft focus:border-ink focus:outline-none';

const Group: React.FC<{ title: string; children: React.ReactNode; aside?: React.ReactNode }> = ({
  title,
  children,
  aside,
}) => (
  <section className="border-b border-line-soft px-5 py-5 last:border-b-0">
    <div className="mb-4 flex items-center justify-between gap-3">
      <h3 className="font-ui-display text-[13px] font-extrabold tracking-[-0.01em]">{title}</h3>
      {aside}
    </div>
    <div className="space-y-4">{children}</div>
  </section>
);

const Field: React.FC<{ label: string; htmlFor?: string; value?: string; children: React.ReactNode }> = ({
  label,
  htmlFor,
  value,
  children,
}) => (
  <div>
    <div className="mb-1.5 flex items-baseline justify-between">
      <label htmlFor={htmlFor} className="text-[13px] font-medium text-ink-soft">
        {label}
      </label>
      {value && <span className="font-ui-mono text-xs font-medium text-ink">{value}</span>}
    </div>
    {children}
  </div>
);

function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  label,
  columns,
}: {
  options: Array<{ value: T; label: React.ReactNode }>;
  value: T;
  onChange: (v: T) => void;
  label: string;
  columns?: number;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="grid gap-1 rounded-lg bg-line-soft p-1"
      style={{ gridTemplateColumns: `repeat(${columns ?? options.length}, minmax(0, 1fr))` }}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={`h-8 rounded-md text-xs font-semibold transition-colors ${
              active ? 'bg-sheet text-ink shadow-[0_1px_2px_rgba(22,22,20,0.12)]' : 'text-muted hover:text-ink'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/* --------------------------------- panel --------------------------------- */

export const StudioSidebar: React.FC<StudioSidebarProps> = ({
  state,
  onBrandNameChange,
  onUpdateColor,
  onUpdateTypography,
  onApplyPairing,
  onUpdateGeometry,
  onRegenerateUnlocked,
  onOpenPalette,
}) => {
  const [tab, setTab] = useState<PanelTab>('color');
  const [hexDrafts, setHexDrafts] = useState<Record<string, string>>({});
  const { typography: t, geometry: g } = state;

  const scales = buildAllScales(state.colors);
  const headingWeights = getAvailableWeightsForFont(t.headingFont);
  const bodyWeights = getAvailableWeightsForFont(t.bodyFont);
  const headingFontOptions = GOOGLE_FONTS_CATALOG.filter(
    (f) => f.recommendedFor === 'heading' || f.recommendedFor === 'both'
  );
  const bodyFontOptions = GOOGLE_FONTS_CATALOG.filter(
    (f) => f.recommendedFor === 'body' || f.recommendedFor === 'both'
  );
  const monoFontOptions = GOOGLE_FONTS_CATALOG.filter((f) => f.recommendedFor === 'mono');

  const setColor = (role: ColorRole, hex: string) => {
    setHexDrafts((p) => ({ ...p, [role]: hex }));
    onUpdateColor(role, hex);
  };

  return (
    <aside className="w-full shrink-0 border-b border-line bg-panel lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)] lg:w-[min(360px,calc(100%_-_75vw))] lg:border-b-0 lg:border-r">
      <div className="flex h-full flex-col">
        {/* System name */}
        <div className="border-b border-line px-5 pb-4 pt-5">
          <label htmlFor="brand-name-input" className="text-[13px] font-medium text-ink-soft">
            Nombre del sistema
          </label>
          <input
            id="brand-name-input"
            type="text"
            value={state.brandName}
            onChange={(e) => onBrandNameChange(e.target.value)}
            placeholder="Ej. Acme Studio"
            className="font-ui-display mt-1 w-full border-0 bg-transparent p-0 text-xl font-extrabold tracking-[-0.02em] text-ink placeholder:text-muted/60 focus:outline-none focus-visible:outline-none"
          />
        </div>

        {/* Tabs */}
        <div role="tablist" aria-label="Ajustes del sistema" className="flex border-b border-line px-3">
          {TABS.map((item) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                id={`panel-tab-${item.id}`}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls={`panel-${item.id}`}
                onClick={() => setTab(item.id)}
                className={`relative px-3 py-3 text-[13px] font-semibold transition-colors ${
                  active ? 'text-ink' : 'text-muted hover:text-ink'
                }`}
              >
                {item.label}
                <span
                  aria-hidden="true"
                  className={`absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-ink transition-transform duration-200 ${
                    active ? 'scale-x-100' : 'scale-x-0'
                  }`}
                />
              </button>
            );
          })}
        </div>

        <div
          id={`panel-${tab}`}
          role="tabpanel"
          aria-labelledby={`panel-tab-${tab}`}
          className="flex-1 overflow-y-auto"
        >
          {tab === 'color' && (
            <>
              <Group
                title="Roles de color"
                aside={
                  <button
                    type="button"
                    onClick={onOpenPalette}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink underline decoration-line underline-offset-4 hover:decoration-ink"
                  >
                    <SquarePen className="h-3.5 w-3.5" />
                    Editar en el lienzo
                  </button>
                }
              >
                {state.colors.map((item) => {
                  const scale = scales[item.role];
                  const draft = hexDrafts[item.role] ?? item.hex;
                  return (
                    <div key={item.role}>
                      <div className="flex items-center gap-2">
                        <label
                          className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg ring-1 ring-black/10"
                          style={{ backgroundColor: item.hex }}
                          title={`Elegir color para ${ROLE_LABELS[item.role]}`}
                        >
                          <input
                            type="color"
                            value={item.hex}
                            onChange={(e) => setColor(item.role, normalizeHex(e.target.value))}
                            aria-label={`Selector de color ${ROLE_LABELS[item.role]}`}
                            className="absolute inset-0 h-full w-full opacity-0"
                          />
                        </label>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
                            {ROLE_LABELS[item.role]}
                            {item.locked && (
                              <Lock className="h-3 w-3 text-muted" aria-label="Bloqueado" />
                            )}
                          </div>
                          <input
                            type="text"
                            value={draft}
                            maxLength={7}
                            spellCheck={false}
                            onChange={(e) => {
                              const val = e.target.value;
                              setHexDrafts((p) => ({ ...p, [item.role]: val }));
                              if (isValidHex(val)) onUpdateColor(item.role, normalizeHex(val));
                            }}
                            onBlur={() => setHexDrafts((p) => ({ ...p, [item.role]: item.hex }))}
                            aria-label={`HEX ${ROLE_LABELS[item.role]}`}
                            className="font-ui-mono w-full border-0 bg-transparent p-0 text-sm font-medium uppercase text-ink focus:outline-none focus-visible:underline"
                          />
                        </div>
                      </div>
                      <div className="mt-2 grid grid-cols-11 overflow-hidden rounded-md">
                        {SHADE_STEPS.map((step) => (
                          <button
                            key={step}
                            type="button"
                            onClick={() => setColor(item.role, scale[step])}
                            title={`${ROLE_LABELS[item.role]} ${step}: ${scale[step]}`}
                            aria-label={`Usar ${ROLE_LABELS[item.role]} ${step}`}
                            style={{ backgroundColor: scale[step] }}
                            className="h-5 transition-transform hover:z-10 hover:scale-y-125"
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </Group>
              <div className="px-5 pb-5">
                <button
                  type="button"
                  onClick={onRegenerateUnlocked}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-ink text-sm font-semibold transition-colors hover:bg-ink hover:text-ground"
                >
                  <Shuffle className="h-4 w-4" />
                  Generar colores sin bloquear
                </button>
              </div>
            </>
          )}

          {tab === 'type' && (
            <>
              <Group title="Combinación">
                <Field label="Punto de partida" htmlFor="pairing-select">
                  <select
                    id="pairing-select"
                    value={t.pairingId}
                    onChange={(e) => onApplyPairing(e.target.value)}
                    className={`${inputBase} h-10`}
                  >
                    {CURATED_PAIRINGS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}: {p.headingFont} + {p.bodyFont}
                      </option>
                    ))}
                    {t.pairingId === 'custom' && <option value="custom">Personalizada</option>}
                  </select>
                </Field>
                <div className="rounded-lg border border-line bg-sheet p-4">
                  <div
                    style={{
                      fontFamily: `"${t.headingFont}", sans-serif`,
                      fontWeight: t.headingWeight,
                      letterSpacing: `${t.headingTracking}em`,
                    }}
                    className="truncate text-2xl leading-tight text-ink"
                  >
                    {state.brandName || 'Titular de prueba'}
                  </div>
                  <p
                    style={{ fontFamily: `"${t.bodyFont}", sans-serif`, fontWeight: t.bodyWeight }}
                    className="mt-1.5 text-[13px] leading-relaxed text-ink-soft"
                  >
                    Un párrafo corto para juzgar ritmo, peso y color del texto.
                  </p>
                  <code
                    style={{ fontFamily: `"${t.monoFont}", monospace` }}
                    className="mt-2 block text-xs text-muted"
                  >
                    --radius-md: {g.radiusBase}px;
                  </code>
                </div>
              </Group>

              <Group title="Familias">
                <div className="grid grid-cols-[1fr_5.5rem] gap-2">
                  <Field label="Títulos" htmlFor="heading-font-select">
                    <select
                      id="heading-font-select"
                      value={t.headingFont}
                      onChange={(e) => {
                        const weights = getAvailableWeightsForFont(e.target.value);
                        onUpdateTypography({
                          pairingId: 'custom',
                          headingFont: e.target.value,
                          headingWeight: weights.includes(t.headingWeight)
                            ? t.headingWeight
                            : weights[weights.length - 1],
                        });
                      }}
                      className={`${inputBase} h-10`}
                    >
                      {headingFontOptions.map((f) => (
                        <option key={f.family} value={f.family}>
                          {f.family}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Peso" htmlFor="heading-weight-select">
                    <select
                      id="heading-weight-select"
                      value={t.headingWeight}
                      onChange={(e) =>
                        onUpdateTypography({ pairingId: 'custom', headingWeight: Number(e.target.value) })
                      }
                      className={`${inputBase} font-ui-mono h-10`}
                    >
                      {headingWeights.map((w) => (
                        <option key={w} value={w}>
                          {w}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
                <div className="grid grid-cols-[1fr_5.5rem] gap-2">
                  <Field label="Texto" htmlFor="body-font-select">
                    <select
                      id="body-font-select"
                      value={t.bodyFont}
                      onChange={(e) => {
                        const weights = getAvailableWeightsForFont(e.target.value);
                        onUpdateTypography({
                          pairingId: 'custom',
                          bodyFont: e.target.value,
                          bodyWeight: weights.includes(t.bodyWeight) ? t.bodyWeight : weights[0],
                        });
                      }}
                      className={`${inputBase} h-10`}
                    >
                      {bodyFontOptions.map((f) => (
                        <option key={f.family} value={f.family}>
                          {f.family}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Peso" htmlFor="body-weight-select">
                    <select
                      id="body-weight-select"
                      value={t.bodyWeight}
                      onChange={(e) =>
                        onUpdateTypography({ pairingId: 'custom', bodyWeight: Number(e.target.value) })
                      }
                      className={`${inputBase} font-ui-mono h-10`}
                    >
                      {bodyWeights.map((w) => (
                        <option key={w} value={w}>
                          {w}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
                <Field label="Monoespaciada (código y cifras)" htmlFor="mono-font-select">
                  <select
                    id="mono-font-select"
                    value={t.monoFont}
                    onChange={(e) => onUpdateTypography({ pairingId: 'custom', monoFont: e.target.value })}
                    className={`${inputBase} h-10`}
                  >
                    {monoFontOptions.map((f) => (
                      <option key={f.family} value={f.family}>
                        {f.family}
                      </option>
                    ))}
                  </select>
                </Field>
              </Group>

              <Group title="Escala y ritmo">
                <Field label="Proporción de escala" htmlFor="scale-ratio-select">
                  <select
                    id="scale-ratio-select"
                    value={t.scaleRatio}
                    onChange={(e) => onUpdateTypography({ scaleRatio: Number(e.target.value) })}
                    className={`${inputBase} h-10`}
                  >
                    {SCALE_RATIOS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Tamaño base" htmlFor="base-size" value={`${t.baseSize}px`}>
                  <input
                    id="base-size"
                    type="range"
                    min={14}
                    max={18}
                    step={1}
                    value={t.baseSize}
                    onChange={(e) => onUpdateTypography({ baseSize: Number(e.target.value) })}
                    className="studio-slider w-full"
                  />
                </Field>
                <Field label="Interlineado" htmlFor="line-height" value={t.lineHeight.toFixed(2)}>
                  <input
                    id="line-height"
                    type="range"
                    min={1.35}
                    max={1.75}
                    step={0.05}
                    value={t.lineHeight}
                    onChange={(e) => onUpdateTypography({ lineHeight: Number(e.target.value) })}
                    className="studio-slider w-full"
                  />
                </Field>
                <Field
                  label="Espaciado de títulos"
                  htmlFor="heading-tracking"
                  value={`${t.headingTracking.toFixed(3)}em`}
                >
                  <input
                    id="heading-tracking"
                    type="range"
                    min={-0.04}
                    max={0.02}
                    step={0.005}
                    value={t.headingTracking}
                    onChange={(e) => onUpdateTypography({ headingTracking: Number(e.target.value) })}
                    className="studio-slider w-full"
                  />
                </Field>
              </Group>
            </>
          )}

          {tab === 'shape' && (
            <>
              <Group title="Radio de esquinas">
                <div role="radiogroup" aria-label="Radio base" className="grid grid-cols-6 gap-1.5">
                  {RADIUS_PRESETS.map((r) => {
                    const active = g.radiusBase === r;
                    return (
                      <button
                        key={r}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => onUpdateGeometry({ radiusBase: r })}
                        className={`flex flex-col items-center gap-1.5 rounded-lg border py-2 transition-colors ${
                          active ? 'border-ink bg-sheet' : 'border-transparent hover:border-line'
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`h-5 w-5 border-l-2 border-t-2 ${active ? 'border-ink' : 'border-muted'}`}
                          style={{ borderTopLeftRadius: `${Math.min(r, 20)}px` }}
                        />
                        <span className="font-ui-mono text-[11px] text-ink-soft">{r}</span>
                      </button>
                    );
                  })}
                </div>
              </Group>

              <Group title="Espaciado">
                <Field label="Unidad de rejilla">
                  <Segmented
                    label="Unidad de rejilla"
                    value={g.spacingUnit}
                    onChange={(v) => onUpdateGeometry({ spacingUnit: v })}
                    options={[
                      { value: 4, label: '4 px' },
                      { value: 8, label: '8 px' },
                    ]}
                  />
                </Field>
                <Field label="Relleno de tarjetas" htmlFor="card-padding" value={`${g.cardPadding}px`}>
                  <input
                    id="card-padding"
                    type="range"
                    min={16}
                    max={36}
                    step={4}
                    value={g.cardPadding}
                    onChange={(e) => onUpdateGeometry({ cardPadding: Number(e.target.value) })}
                    className="studio-slider w-full"
                  />
                </Field>
                <Field label="Separación entre elementos" htmlFor="element-gap" value={`${g.elementGap}px`}>
                  <input
                    id="element-gap"
                    type="range"
                    min={8}
                    max={32}
                    step={4}
                    value={g.elementGap}
                    onChange={(e) => onUpdateGeometry({ elementGap: Number(e.target.value) })}
                    className="studio-slider w-full"
                  />
                </Field>
              </Group>

              <Group title="Elevación">
                <div role="radiogroup" aria-label="Estilo de elevación" className="grid grid-cols-2 gap-2">
                  {ELEVATION_OPTIONS.map((opt) => {
                    const active = g.elevationStyle === opt.value;
                    const preview = getElevationShadows(opt.value).light;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => onUpdateGeometry({ elevationStyle: opt.value })}
                        className={`flex items-center gap-3 rounded-lg border p-2.5 text-left text-[13px] font-semibold transition-colors ${
                          active ? 'border-ink bg-sheet' : 'border-line hover:border-ink-soft'
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className="h-7 w-7 shrink-0 rounded-md border border-line-soft bg-sheet"
                          style={{ boxShadow: preview.md }}
                        />
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </Group>
            </>
          )}
        </div>
      </div>
    </aside>
  );
};
