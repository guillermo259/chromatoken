import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Lock,
  Redo2,
  RefreshCw,
  SlidersHorizontal,
  Undo2,
  Unlock,
  X,
} from 'lucide-react';
import { ColorRole, HarmonyMode, PaletteColor } from '../types/tokens';
import {
  CURATED_PRESETS,
  generateShadeScale,
  getAccessibleTextColor,
  getContrastRatio,
  getNearestColorName,
  hexToHsl,
  hslToHex,
  isValidHex,
  normalizeHex,
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  SHADE_STEPS,
} from '../utils/colorEngine';

interface CoolorsGeneratorProps {
  colors: PaletteColor[];
  harmonyMode: HarmonyMode;
  canUndo: boolean;
  canRedo: boolean;
  onHarmonyChange: (mode: HarmonyMode) => void;
  onGenerate: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onUpdateColor: (role: ColorRole, hex: string) => void;
  onToggleLock: (role: ColorRole) => void;
  onSwapRoles: (indexA: number, indexB: number) => void;
  onApplyPreset: (presetId: string) => void;
  onContinueToStudio: () => void;
}

const HARMONY_OPTIONS: Array<{ value: HarmonyMode; label: string }> = [
  { value: 'curated', label: 'Armonía Curada' },
  { value: 'analogous', label: 'Análoga' },
  { value: 'complementary', label: 'Complementaria' },
  { value: 'triadic', label: 'Triádica' },
  { value: 'monochromatic', label: 'Monocromática' },
  { value: 'high-contrast', label: 'Alto Contraste' },
];

export const CoolorsGenerator: React.FC<CoolorsGeneratorProps> = ({
  colors,
  harmonyMode,
  canUndo,
  canRedo,
  onHarmonyChange,
  onGenerate,
  onUndo,
  onRedo,
  onUpdateColor,
  onToggleLock,
  onSwapRoles,
  onApplyPreset,
  onContinueToStudio,
}) => {
  const [openTunerRole, setOpenTunerRole] = useState<ColorRole | null>(null);
  const [copiedRole, setCopiedRole] = useState<ColorRole | null>(null);
  const [hexDrafts, setHexDrafts] = useState<Record<string, string>>({});

  // Spacebar shortcut for Coolors-style rapid generation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }
      e.preventDefault();
      onGenerate();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onGenerate]);

  const handleCopyHex = async (role: ColorRole, hex: string) => {
    try {
      await navigator.clipboard.writeText(hex);
      setCopiedRole(role);
      setTimeout(() => setCopiedRole((prev) => (prev === role ? null : prev)), 1400);
    } catch {
      // Clipboard fallback ignored
    }
  };

  const handleHexInputChange = (role: ColorRole, val: string) => {
    setHexDrafts((prev) => ({ ...prev, [role]: val }));
    if (isValidHex(val)) {
      onUpdateColor(role, normalizeHex(val));
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-56px)] bg-white">
      {/* Sub-toolbar for Coolors generator */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-slate-50/70 px-6 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <span className="whitespace-nowrap">Regla cromática</span>
            <select
              value={harmonyMode}
              onChange={(e) => onHarmonyChange(e.target.value as HarmonyMode)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 focus:border-slate-900 focus:outline-none"
            >
              {HARMONY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <span className="whitespace-nowrap">Base curada</span>
            <select
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) {
                  onApplyPreset(e.target.value);
                  e.target.value = '';
                }
              }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 focus:border-slate-900 focus:outline-none"
            >
              <option value="" disabled>
                Elegir preset...
              </option>
              {CURATED_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-center gap-1 border-l border-slate-200 pl-3">
            <button
              type="button"
              onClick={onUndo}
              disabled={!canUndo}
              title="Deshacer paleta"
              aria-label="Deshacer paleta"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Undo2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onRedo}
              disabled={!canRedo}
              title="Rehacer paleta"
              aria-label="Rehacer paleta"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Redo2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="hidden xl:inline text-xs text-slate-500">
            Pulsa <kbd className="font-ui-mono font-semibold text-slate-700">Espacio</kbd> para generar · Bloquea tonos con el candado
          </span>
          <button
            type="button"
            onClick={onGenerate}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-900 transition-colors hover:bg-slate-100 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Generar paleta
          </button>
          <button
            type="button"
            onClick={onContinueToStudio}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
          >
            Continuar a Tipografía y Tokens
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* 4-column Coolors-style interactive canvas */}
      <div className="grid flex-1 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {colors.map((item, idx) => {
          const textColor = getAccessibleTextColor(item.hex);
          const isDarkText = textColor === '#0F172A';
          const subtleText = isDarkText ? 'rgba(15, 23, 42, 0.68)' : 'rgba(255, 255, 255, 0.74)';
          const surfaceControlBg = isDarkText
            ? 'rgba(15, 23, 42, 0.08)'
            : 'rgba(255, 255, 255, 0.14)';
          const surfaceControlBorder = isDarkText
            ? 'rgba(15, 23, 42, 0.14)'
            : 'rgba(255, 255, 255, 0.22)';

          const hsl = hexToHsl(item.hex);
          const colorName = getNearestColorName(item.hex);
          const whiteContrast = getContrastRatio(item.hex, '#FFFFFF');
          const darkContrast = getContrastRatio(item.hex, '#0F172A');
          const isTunerOpen = openTunerRole === item.role;
          const shadeScale = generateShadeScale(item.hex);
          const currentDraft = hexDrafts[item.role] ?? item.hex;

          return (
            <section
              key={item.role}
              aria-label={`Color ${ROLE_LABELS[item.role]}`}
              style={{ backgroundColor: item.hex, color: textColor }}
              className="relative flex min-h-[380px] flex-col justify-between p-6 transition-colors duration-200 lg:min-h-[540px]"
            >
              {/* Top role header & contrast readout */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-ui-display text-lg font-bold tracking-tight">
                    {ROLE_LABELS[item.role]}
                  </h2>
                  <p className="mt-0.5 text-xs leading-snug" style={{ color: subtleText }}>
                    {ROLE_DESCRIPTIONS[item.role]}
                  </p>
                </div>

                {/* Role swap controls */}
                <div className="flex items-center gap-1">
                  {idx > 0 && (
                    <button
                      type="button"
                      onClick={() => onSwapRoles(idx, idx - 1)}
                      title="Intercambiar con el rol anterior"
                      aria-label={`Mover ${ROLE_LABELS[item.role]} a la izquierda`}
                      style={{
                        backgroundColor: surfaceControlBg,
                        borderColor: surfaceControlBorder,
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border transition-transform active:scale-95 cursor-pointer"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {idx < colors.length - 1 && (
                    <button
                      type="button"
                      onClick={() => onSwapRoles(idx, idx + 1)}
                      title="Intercambiar con el siguiente rol"
                      aria-label={`Mover ${ROLE_LABELS[item.role]} a la derecha`}
                      style={{
                        backgroundColor: surfaceControlBg,
                        borderColor: surfaceControlBorder,
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border transition-transform active:scale-95 cursor-pointer"
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Center Manual H/S/L Tuner Panel (when open) or Interactive Action Buttons */}
              <div className="my-6 flex flex-col items-center justify-center">
                {isTunerOpen ? (
                  <div
                    className="w-full max-w-xs rounded-xl border border-slate-200 bg-white p-4 text-slate-900 shadow-lg"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="font-ui-display text-xs font-bold text-slate-900">
                        Ajuste manual · {ROLE_LABELS[item.role]}
                      </span>
                      <button
                        type="button"
                        onClick={() => setOpenTunerRole(null)}
                        aria-label="Cerrar ajuste manual"
                        className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Direct HEX + native picker */}
                    <div className="mb-3 flex items-center gap-2">
                      <input
                        type="color"
                        value={item.hex}
                        onChange={(e) => {
                          const next = normalizeHex(e.target.value);
                          setHexDrafts((p) => ({ ...p, [item.role]: next }));
                          onUpdateColor(item.role, next);
                        }}
                        aria-label={`Selector de color para ${ROLE_LABELS[item.role]}`}
                        className="h-9 w-11 shrink-0 cursor-pointer rounded-md border border-slate-200 bg-transparent p-0.5"
                      />
                      <input
                        type="text"
                        value={currentDraft}
                        onChange={(e) => handleHexInputChange(item.role, e.target.value)}
                        onBlur={() =>
                          setHexDrafts((p) => ({ ...p, [item.role]: item.hex }))
                        }
                        maxLength={7}
                        spellCheck={false}
                        aria-label={`Código HEX para ${ROLE_LABELS[item.role]}`}
                        className="font-ui-mono w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-900 uppercase focus:border-slate-900 focus:outline-none"
                      />
                    </div>

                    {/* HSL Sliders */}
                    <div className="space-y-2.5">
                      <div>
                        <div className="mb-1 flex justify-between text-[11px] font-medium text-slate-600">
                          <span>Matiz (H)</span>
                          <span className="font-ui-mono tabular-nums">{hsl.h}°</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={359}
                          value={hsl.h}
                          onChange={(e) => {
                            const next = hslToHex(Number(e.target.value), hsl.s, hsl.l);
                            setHexDrafts((p) => ({ ...p, [item.role]: next }));
                            onUpdateColor(item.role, next);
                          }}
                          style={{
                            background:
                              'linear-gradient(to right, #ef4444, #eab308, #22c55e, #06b6d4, #3b82f6, #a855f7, #ef4444)',
                          }}
                          className="studio-slider w-full"
                        />
                      </div>

                      <div>
                        <div className="mb-1 flex justify-between text-[11px] font-medium text-slate-600">
                          <span>Saturación (S)</span>
                          <span className="font-ui-mono tabular-nums">{hsl.s}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={hsl.s}
                          onChange={(e) => {
                            const next = hslToHex(hsl.h, Number(e.target.value), hsl.l);
                            setHexDrafts((p) => ({ ...p, [item.role]: next }));
                            onUpdateColor(item.role, next);
                          }}
                          className="studio-slider w-full"
                        />
                      </div>

                      <div>
                        <div className="mb-1 flex justify-between text-[11px] font-medium text-slate-600">
                          <span>Luminosidad (L)</span>
                          <span className="font-ui-mono tabular-nums">{hsl.l}%</span>
                        </div>
                        <input
                          type="range"
                          min={6}
                          max={95}
                          value={hsl.l}
                          onChange={(e) => {
                            const next = hslToHex(hsl.h, hsl.s, Number(e.target.value));
                            setHexDrafts((p) => ({ ...p, [item.role]: next }));
                            onUpdateColor(item.role, next);
                          }}
                          className="studio-slider w-full"
                        />
                      </div>
                    </div>

                    {/* Quick Shade Strip Picker */}
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <div className="mb-1.5 text-[11px] font-medium text-slate-500">
                        Elegir tono de su escala (50–950)
                      </div>
                      <div className="grid grid-cols-11 gap-1">
                        {SHADE_STEPS.map((step) => (
                          <button
                            key={step}
                            type="button"
                            onClick={() => {
                              const picked = shadeScale[step];
                              setHexDrafts((p) => ({ ...p, [item.role]: picked }));
                              onUpdateColor(item.role, picked);
                            }}
                            title={`${step}: ${shadeScale[step]}`}
                            style={{ backgroundColor: shadeScale[step] }}
                            className={`h-6 rounded transition-transform hover:scale-110 cursor-pointer ${
                              shadeScale[step] === item.hex
                                ? 'ring-2 ring-slate-900 ring-offset-1'
                                : ''
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onToggleLock(item.role)}
                      aria-label={
                        item.locked
                          ? `Desbloquear ${ROLE_LABELS[item.role]}`
                          : `Bloquear ${ROLE_LABELS[item.role]}`
                      }
                      style={{
                        backgroundColor: item.locked
                          ? textColor
                          : surfaceControlBg,
                        color: item.locked ? item.hex : textColor,
                        borderColor: surfaceControlBorder,
                      }}
                      className="inline-flex h-10 items-center gap-2 rounded-lg border px-3.5 text-xs font-semibold transition-all hover:opacity-90 cursor-pointer"
                    >
                      {item.locked ? (
                        <>
                          <Lock className="h-3.5 w-3.5" />
                          Bloqueado
                        </>
                      ) : (
                        <>
                          <Unlock className="h-3.5 w-3.5" />
                          Bloquear
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setOpenTunerRole(item.role)}
                      style={{
                        backgroundColor: surfaceControlBg,
                        borderColor: surfaceControlBorder,
                      }}
                      className="inline-flex h-10 items-center gap-2 rounded-lg border px-3.5 text-xs font-semibold transition-all hover:opacity-90 cursor-pointer"
                    >
                      <SlidersHorizontal className="h-3.5 w-3.5" />
                      Ajustar
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyHex(item.role, item.hex)}
                      aria-label={`Copiar código ${item.hex}`}
                      style={{
                        backgroundColor: surfaceControlBg,
                        borderColor: surfaceControlBorder,
                      }}
                      className="flex h-10 w-10 items-center justify-center rounded-lg border transition-all hover:opacity-90 cursor-pointer"
                    >
                      {copiedRole === item.role ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Bottom Coolors-style HEX, Name & Contrast */}
              <div className="flex flex-col items-center text-center">
                <button
                  type="button"
                  onClick={() => handleCopyHex(item.role, item.hex)}
                  className="font-ui-mono text-2xl font-bold tracking-wider uppercase transition-opacity hover:opacity-80 cursor-pointer"
                  title="Haz clic para copiar HEX"
                >
                  {copiedRole === item.role ? 'COPIADO' : item.hex.replace('#', '')}
                </button>
                <span className="mt-1 text-xs font-medium" style={{ color: subtleText }}>
                  {colorName}
                </span>
                <div
                  className="font-ui-mono mt-3 flex items-center gap-2 text-[11px] tabular-nums"
                  style={{ color: subtleText }}
                >
                  <span>Claro {whiteContrast}:1</span>
                  <span aria-hidden="true">·</span>
                  <span>Oscuro {darkContrast}:1</span>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};
