import React, { useEffect, useRef, useState } from 'react';
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ArrowRight,
  ChevronDown,
  Copy,
  GripVertical,
  Lock,
  Redo2,
  Shuffle,
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
  getWcagLabel,
  hexToHsl,
  hslToHex,
  isValidHex,
  normalizeHex,
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  SHADE_STEPS,
} from '../utils/colorEngine';
import { ContrastControls, ContrastMenu, RoleContrastBadge } from './ContrastPanel';

interface PaletteBoardProps {
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
  onMoveColor: (fromIndex: number, toIndex: number) => void;
  onApplyPreset: (presetId: string) => void;
  onCopy: (text: string, label?: string) => void;
  onContinue: () => void;
  contrast: ContrastControls;
}

const HARMONY_OPTIONS: Array<{ value: HarmonyMode; label: string; hint: string }> = [
  { value: 'curated', label: 'Curada', hint: 'Combinaciones equilibradas para producto' },
  { value: 'analogous', label: 'Análoga', hint: 'Tonos vecinos en el círculo cromático' },
  { value: 'complementary', label: 'Complementaria', hint: 'Tonos opuestos, máximo contraste de matiz' },
  { value: 'triadic', label: 'Triádica', hint: 'Tres tonos repartidos a 120°' },
  { value: 'monochromatic', label: 'Monocromática', hint: 'Un solo matiz en distintas luminosidades' },
  { value: 'high-contrast', label: 'Alto contraste', hint: 'Prioriza legibilidad y diferencia de luminosidad' },
];

const INK = '#0F172A';

/**
 * Whether a global shortcut should leave this key event alone.
 * Text fields, open dialogs and drag handles always keep their keys. Buttons keep them only
 * when they were reached with the keyboard: after a mouse click, Space should still generate.
 */
function shouldIgnoreShortcut(target: EventTarget | null, viaKeyboard: boolean): boolean {
  const el = target as HTMLElement | null;
  if (!el || !el.closest) return false;
  if (
    el.isContentEditable ||
    el.closest('input, textarea, select, [role="dialog"], [role="listbox"], [aria-roledescription="sortable"]')
  ) {
    return true;
  }
  return viaKeyboard && !!el.closest('button, a');
}

/* -------------------------------------------------------------------------- */
/*  Swatch card                                                               */
/* -------------------------------------------------------------------------- */

interface SwatchCardProps {
  item: PaletteColor;
  isOverlay?: boolean;
  isPlaceholder?: boolean;
  dragHandle?: React.ReactNode;
  tunerOpen?: boolean;
  onToggleLock?: () => void;
  onOpenTuner?: () => void;
  onCloseTuner?: () => void;
  onCopy?: (text: string, label?: string) => void;
  onUpdate?: (hex: string) => void;
}

const ContrastChip: React.FC<{ bg: string; fg: string; label: string }> = ({ bg, fg, label }) => {
  const ratio = getContrastRatio(bg, fg);
  const grade = getWcagLabel(ratio);
  const fails = grade === 'Bajo';
  return (
    <div
      className="flex items-center gap-2 rounded-md px-2 py-1"
      style={{ backgroundColor: fg === '#FFFFFF' ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.07)' }}
      title={`Texto ${label} sobre este color: ${ratio}:1`}
    >
      <span className="font-ui-display text-[15px] font-bold leading-none" style={{ color: fg }}>
        Aa
      </span>
      <span className="font-ui-mono text-[11px] leading-none" style={{ color: fg, opacity: 0.85 }}>
        {ratio.toFixed(1)}
      </span>
      <span
        className="rounded-sm px-1 py-0.5 text-[10px] font-bold leading-none"
        style={{
          color: fails ? fg : bg,
          backgroundColor: fails ? 'transparent' : fg,
          boxShadow: fails ? `inset 0 0 0 1px ${fg}` : undefined,
        }}
        title={
          grade === 'AA Large'
            ? 'Cumple AA solo en texto grande (18px o 14px en negrita)'
            : fails
              ? 'No cumple contraste mínimo'
              : `Cumple WCAG ${grade}`
        }
      >
        {grade === 'AA Large' ? 'Grande' : fails ? 'No' : grade}
      </span>
    </div>
  );
};

const SwatchCard: React.FC<SwatchCardProps> = ({
  item,
  isOverlay = false,
  isPlaceholder = false,
  dragHandle,
  tunerOpen = false,
  onToggleLock,
  onOpenTuner,
  onCloseTuner,
  onCopy,
  onUpdate,
}) => {
  const fg = getAccessibleTextColor(item.hex);
  const onDark = fg === '#FFFFFF';
  const subtle = onDark ? 'rgba(255,255,255,0.72)' : 'rgba(15,23,42,0.66)';
  const controlBg = onDark ? 'rgba(255,255,255,0.14)' : 'rgba(15,23,42,0.08)';
  const controlBgHover = onDark ? 'rgba(255,255,255,0.24)' : 'rgba(15,23,42,0.14)';
  const scale = generateShadeScale(item.hex);
  const name = getNearestColorName(item.hex);
  const label = ROLE_LABELS[item.role];

  if (isPlaceholder) {
    return (
      <div className="bg-checker flex h-full min-h-[240px] items-center justify-center rounded-xl border-2 border-dashed border-ink/30 lg:min-h-[440px]">
        <span className="rounded-md bg-ground px-2.5 py-1 text-xs font-semibold text-muted">
          Suelta en otro rol
        </span>
      </div>
    );
  }

  const iconButton =
    'flex h-9 w-9 items-center justify-center rounded-lg transition-[background-color,transform] duration-150 active:scale-95 hover:[background-color:var(--ctl-hover)]';

  return (
    <div
      style={
        {
          backgroundColor: item.hex,
          color: fg,
          '--ctl-hover': controlBgHover,
        } as React.CSSProperties
      }
      className={`relative flex h-full min-h-[240px] flex-col overflow-hidden rounded-xl transition-[background-color] duration-300 lg:min-h-[440px] ${
        isOverlay
          ? 'rotate-[1.5deg] scale-[1.02] shadow-[0_30px_60px_-20px_rgba(22,22,20,0.55)] ring-1 ring-black/10'
          : 'ring-1 ring-black/5'
      }`}
    >
      {/* Control row */}
      <div className="flex items-center justify-between p-2.5">
        {dragHandle}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onToggleLock}
            aria-pressed={item.locked}
            aria-label={item.locked ? `Desbloquear ${label}` : `Bloquear ${label}`}
            title={item.locked ? 'Bloqueado: no cambia al generar' : 'Bloquear para conservarlo al generar'}
            className={iconButton}
            style={{
              backgroundColor: item.locked ? fg : controlBg,
              color: item.locked ? item.hex : fg,
            }}
          >
            {item.locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={onOpenTuner}
            aria-label={`Ajustar ${label}`}
            aria-expanded={tunerOpen}
            title="Ajustar matiz, saturación y luminosidad"
            className={iconButton}
            style={{ backgroundColor: controlBg }}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onCopy?.(item.hex)}
            aria-label={`Copiar ${item.hex}`}
            title="Copiar HEX"
            className={iconButton}
            style={{ backgroundColor: controlBg }}
          >
            <Copy className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Identity block */}
      <div className="mt-auto px-4 pb-4">
        {item.locked && (
          <span
            className="mb-2 inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[11px] font-semibold"
            style={{ backgroundColor: fg, color: item.hex }}
          >
            <Lock className="h-3 w-3" /> Fijo
          </span>
        )}
        <button
          type="button"
          onClick={() => onCopy?.(item.hex)}
          className="font-ui-mono block text-left text-[28px] font-semibold uppercase leading-none tracking-tight transition-opacity hover:opacity-75 lg:text-[32px]"
          title="Copiar HEX"
        >
          {item.hex}
        </button>
        <p className="mt-1.5 text-sm font-medium" style={{ color: subtle }}>
          {name}
        </p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          <ContrastChip bg={item.hex} fg="#FFFFFF" label="blanco" />
          <ContrastChip bg={item.hex} fg={INK} label="oscuro" />
        </div>
      </div>

      {/* Ramp strip */}
      <div className="grid grid-cols-11" role="group" aria-label={`Escala de ${label}`}>
        {SHADE_STEPS.map((step) => {
          const shade = scale[step];
          const isCurrent = shade.toUpperCase() === item.hex.toUpperCase();
          return (
            <button
              key={step}
              type="button"
              onClick={() => onUpdate?.(shade)}
              title={`${step} · ${shade}`}
              aria-label={`Usar tono ${step} (${shade})`}
              style={{ backgroundColor: shade }}
              className="relative h-9 transition-[height] duration-150 hover:h-11"
            >
              {isCurrent && (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-1/2 top-1.5 h-1.5 w-1.5 -translate-x-1/2 rounded-full"
                  style={{ backgroundColor: getAccessibleTextColor(shade) }}
                />
              )}
            </button>
          );
        })}
      </div>

      {tunerOpen && onUpdate && onCloseTuner && (
        <ColorTuner item={item} onUpdate={onUpdate} onClose={onCloseTuner} />
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  HSL tuner (overlays the card)                                             */
/* -------------------------------------------------------------------------- */

const ColorTuner: React.FC<{
  item: PaletteColor;
  onUpdate: (hex: string) => void;
  onClose: () => void;
}> = ({ item, onUpdate, onClose }) => {
  const [draft, setDraft] = useState(item.hex);
  const ref = useRef<HTMLDivElement>(null);
  const hsl = hexToHsl(item.hex);
  const label = ROLE_LABELS[item.role];

  useEffect(() => setDraft(item.hex), [item.hex]);

  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('input[type="text"]')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const slider = (
    name: string,
    value: number,
    unit: string,
    min: number,
    max: number,
    onChange: (v: number) => void,
    track?: string
  ) => (
    <label className="block">
      <span className="mb-1.5 flex justify-between text-xs font-medium text-ink-soft">
        {name}
        <span className="font-ui-mono text-ink">
          {value}
          {unit}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={track ? { background: track } : undefined}
        className="studio-slider w-full"
      />
    </label>
  );

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={`Ajuste de ${label}`}
      className="animate-pop-in absolute inset-2 z-10 flex flex-col rounded-lg bg-sheet p-4 text-ink shadow-[0_20px_40px_-16px_rgba(22,22,20,0.45)]"
    >
      <div className="mb-4 flex items-center justify-between">
        <span className="font-ui-display text-sm font-bold">Ajustar {label}</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar ajuste"
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-line-soft hover:text-ink"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-5 flex items-center gap-2">
        <input
          type="color"
          value={item.hex}
          onChange={(e) => onUpdate(normalizeHex(e.target.value))}
          aria-label={`Selector visual para ${label}`}
          className="h-10 w-11 shrink-0 rounded-md border border-line bg-transparent p-0.5"
        />
        <input
          type="text"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            if (isValidHex(e.target.value)) onUpdate(normalizeHex(e.target.value));
          }}
          onBlur={() => setDraft(item.hex)}
          maxLength={7}
          spellCheck={false}
          aria-label={`Código HEX de ${label}`}
          className="font-ui-mono h-10 w-full rounded-md border border-line bg-panel px-3 text-sm font-semibold uppercase focus:border-ink focus:outline-none"
        />
      </div>

      <div className="space-y-4">
        {slider(
          'Matiz',
          hsl.h,
          '°',
          0,
          359,
          (v) => onUpdate(hslToHex(v, hsl.s, hsl.l)),
          `linear-gradient(to right, ${[0, 60, 120, 180, 240, 300, 359]
            .map((h) => hslToHex(h, Math.max(hsl.s, 40), 55))
            .join(', ')})`
        )}
        {slider(
          'Saturación',
          hsl.s,
          '%',
          0,
          100,
          (v) => onUpdate(hslToHex(hsl.h, v, hsl.l)),
          `linear-gradient(to right, ${hslToHex(hsl.h, 0, hsl.l)}, ${hslToHex(hsl.h, 100, hsl.l)})`
        )}
        {slider(
          'Luminosidad',
          hsl.l,
          '%',
          6,
          95,
          (v) => onUpdate(hslToHex(hsl.h, hsl.s, v)),
          `linear-gradient(to right, ${hslToHex(hsl.h, hsl.s, 6)}, ${hslToHex(hsl.h, hsl.s, 50)}, ${hslToHex(hsl.h, hsl.s, 95)})`
        )}
      </div>

      <button
        type="button"
        onClick={onClose}
        className="mt-auto h-10 rounded-lg bg-ink text-sm font-semibold text-ground transition-transform active:scale-[0.98]"
      >
        Listo
      </button>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  Sortable wrapper                                                          */
/* -------------------------------------------------------------------------- */

const SortableSwatch: React.FC<
  Omit<SwatchCardProps, 'dragHandle' | 'isPlaceholder' | 'isOverlay'> & { id: string }
> = ({ id, item, ...rest }) => {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const handle = (
    <button
      type="button"
      ref={setActivatorNodeRef}
      {...attributes}
      {...listeners}
      aria-label={`Mover ${ROLE_LABELS[item.role]}. Arrastra a otro rol, o pulsa Espacio y usa las flechas`}
      title="Arrastra para mover a otro rol"
      className="flex h-9 w-9 touch-none items-center justify-center rounded-lg transition-[background-color] hover:[background-color:var(--ctl-hover)] cursor-grab active:cursor-grabbing"
    >
      <GripVertical className="h-5 w-5" />
    </button>
  );

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className="h-full"
    >
      <SwatchCard item={item} isPlaceholder={isDragging} dragHandle={handle} {...rest} />
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  Presets menu                                                              */
/* -------------------------------------------------------------------------- */

const PresetMenu: React.FC<{ onApply: (id: string) => void }> = ({ onApply }) => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="inline-flex h-9 items-center gap-2 rounded-lg border border-line bg-sheet px-3 text-[13px] font-semibold transition-colors hover:border-ink"
      >
        Paletas base
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div
          role="listbox"
          aria-label="Paletas base"
          className="animate-pop-in absolute left-0 top-11 z-20 w-72 rounded-xl border border-line bg-sheet p-1.5 shadow-[0_20px_40px_-18px_rgba(22,22,20,0.4)]"
        >
          {CURATED_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              role="option"
              aria-selected={false}
              onClick={() => {
                onApply(preset.id);
                setOpen(false);
              }}
              className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm font-medium hover:bg-panel"
            >
              <span className="flex h-7 w-20 shrink-0 overflow-hidden rounded-md ring-1 ring-black/5">
                {(['primary', 'secondary', 'accent', 'neutral'] as ColorRole[]).map((r) => (
                  <span key={r} className="flex-1" style={{ backgroundColor: preset.colors[r] }} />
                ))}
              </span>
              {preset.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  Board                                                                     */
/* -------------------------------------------------------------------------- */

export const PaletteBoard: React.FC<PaletteBoardProps> = ({
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
  onMoveColor,
  onApplyPreset,
  onCopy,
  onContinue,
  contrast,
}) => {
  const [openTuner, setOpenTuner] = useState<ColorRole | null>(null);
  const [contrastOpen, setContrastOpen] = useState(false);
  const [contrastFocus, setContrastFocus] = useState<ColorRole | null>(null);
  // Stable sortable ids that travel with each color value while role slots stay fixed
  const [order, setOrder] = useState<string[]>(() => colors.map((_, i) => `swatch-${i}`));
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Last input modality: Tab/arrow navigation means the user is driving focus by keyboard
  const keyboardNav = useRef(false);
  useEffect(() => {
    const onPointer = () => {
      keyboardNav.current = false;
    };
    const onNavKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab' || e.key.startsWith('Arrow')) keyboardNav.current = true;
    };
    window.addEventListener('pointerdown', onPointer, true);
    window.addEventListener('keydown', onNavKey, true);
    return () => {
      window.removeEventListener('pointerdown', onPointer, true);
      window.removeEventListener('keydown', onNavKey, true);
    };
  }, []);

  // Space generates, Ctrl/Cmd+Z undoes, Shift+Ctrl/Cmd+Z or Ctrl+Y redoes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (activeId || openTuner || contrastOpen || e.defaultPrevented) return;
      if (shouldIgnoreShortcut(e.target, keyboardNav.current)) return;
      const mod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();
      if (mod && (key === 'z' || key === 'y')) {
        e.preventDefault();
        if (key === 'y' || e.shiftKey) onRedo();
        else onUndo();
        return;
      }
      if (e.code === 'Space' && !mod && !e.repeat) {
        e.preventDefault();
        onGenerate();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onGenerate, onUndo, onRedo, activeId, openTuner, contrastOpen]);

  const indexOfId = (id: string) => order.indexOf(id);

  const handleDragStart = (e: DragStartEvent) => {
    setOpenTuner(null);
    setActiveId(String(e.active.id));
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    if (!e.over || e.active.id === e.over.id) return;
    const from = indexOfId(String(e.active.id));
    const to = indexOfId(String(e.over.id));
    if (from < 0 || to < 0) return;
    setOrder((prev) => arrayMove(prev, from, to));
    onMoveColor(from, to);
  };

  const activeIndex = activeId ? indexOfId(activeId) : -1;
  const roleAt = (id: string | number) => {
    const i = indexOfId(String(id));
    return i >= 0 ? ROLE_LABELS[colors[i].role] : '';
  };

  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] flex-col">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 border-b border-line px-4 py-3 sm:px-6 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <div
            role="group"
            aria-label="Regla de armonía"
            className="-mx-1 flex max-w-full items-center gap-1 overflow-x-auto px-1"
          >
            {HARMONY_OPTIONS.map((opt) => {
              const active = harmonyMode === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onHarmonyChange(opt.value)}
                  title={opt.hint}
                  className={`h-9 shrink-0 rounded-lg px-3 text-[13px] font-semibold transition-colors ${
                    active
                      ? 'bg-ink text-ground'
                      : 'text-muted hover:bg-line-soft hover:text-ink'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          <span aria-hidden="true" className="mx-1 hidden h-5 w-px bg-line sm:block" />
          <PresetMenu onApply={onApplyPreset} />
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onUndo}
              disabled={!canUndo}
              title="Deshacer (Ctrl+Z)"
              aria-label="Deshacer"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-line-soft disabled:opacity-35 disabled:hover:bg-transparent"
            >
              <Undo2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onRedo}
              disabled={!canRedo}
              title="Rehacer (Ctrl+Shift+Z)"
              aria-label="Rehacer"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-line-soft disabled:opacity-35 disabled:hover:bg-transparent"
            >
              <Redo2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ContrastMenu
            contrast={contrast}
            colors={colors}
            open={contrastOpen}
            focusRole={contrastFocus}
            onOpenChange={(v) => {
              setContrastOpen(v);
              if (!v) setContrastFocus(null);
            }}
            placement="sm:left-0 xl:left-auto xl:right-0"
          />
          <button
            type="button"
            onClick={onGenerate}
            className="group inline-flex h-10 min-w-0 flex-1 items-center justify-center gap-2.5 rounded-lg bg-signal pl-3.5 pr-2 text-sm font-bold text-ink transition-transform active:scale-[0.97] sm:flex-none"
          >
            <Shuffle className="h-4 w-4 transition-transform duration-300 group-hover:rotate-180" />
            Generar
            <kbd className="hidden rounded-md bg-ink/12 px-1.5 py-0.5 text-[11px] font-medium sm:inline">
              Espacio
            </kbd>
          </button>
          <button
            type="button"
            onClick={onContinue}
            aria-label="Siguiente: sistema"
            className="group inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border border-ink px-3 text-sm font-semibold whitespace-nowrap transition-colors hover:bg-ink hover:text-ground sm:px-3.5"
          >
            <span className="sm:hidden">Siguiente</span>
            <span className="hidden sm:inline">Siguiente: sistema</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>

      {/* Role slots */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
        accessibility={{
          screenReaderInstructions: {
            draggable:
              'Pulsa Espacio para tomar el color. Usa las flechas para elegir otro rol y Espacio para soltarlo. Escape cancela.',
          },
          announcements: {
            onDragStart: ({ active }) => `Tomaste el color de ${roleAt(active.id)}.`,
            onDragOver: ({ over }) => (over ? `Sobre el rol ${roleAt(over.id)}.` : 'Fuera de los roles.'),
            onDragEnd: ({ over }) =>
              over ? `Color movido a ${roleAt(over.id)}.` : 'Movimiento cancelado.',
            onDragCancel: () => 'Movimiento cancelado.',
          },
        }}
      >
        <SortableContext items={order} strategy={rectSortingStrategy}>
          <div className="grid flex-1 grid-cols-1 gap-3 p-3 sm:p-4 md:grid-cols-2 lg:grid-cols-4">
            {colors.map((item, i) => (
              <section key={item.role} aria-label={ROLE_LABELS[item.role]} className="flex flex-col">
                <header className="mb-2.5 px-1">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-ui-display text-base font-extrabold leading-tight tracking-[-0.02em]">
                      {ROLE_LABELS[item.role]}
                    </h2>
                    <RoleContrastBadge
                      report={contrast.report}
                      role={item.role}
                      onClick={() => {
                        setContrastFocus(item.role);
                        setContrastOpen(true);
                      }}
                    />
                  </div>
                  <p className="mt-0.5 text-xs leading-snug text-muted">{ROLE_DESCRIPTIONS[item.role]}</p>
                </header>
                <div className="flex-1">
                  <SortableSwatch
                    id={order[i]}
                    item={item}
                    tunerOpen={openTuner === item.role}
                    onToggleLock={() => onToggleLock(item.role)}
                    onOpenTuner={() => setOpenTuner(item.role)}
                    onCloseTuner={() => setOpenTuner(null)}
                    onCopy={onCopy}
                    onUpdate={(hex) => onUpdateColor(item.role, hex)}
                  />
                </div>
              </section>
            ))}
          </div>
        </SortableContext>

        <DragOverlay dropAnimation={{ duration: 220, easing: 'cubic-bezier(0.2, 0.9, 0.25, 1)' }}>
          {activeIndex >= 0 ? (
            <SwatchCard
              item={colors[activeIndex]}
              isOverlay
              dragHandle={
                <span className="flex h-9 w-9 cursor-grabbing items-center justify-center">
                  <GripVertical className="h-5 w-5" />
                </span>
              }
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      <p className="hidden px-6 pb-4 text-xs text-muted lg:block">
        <kbd className="rounded border border-line bg-sheet px-1.5 py-0.5 text-[11px] text-ink">Espacio</kbd>{' '}
        genera colores nuevos para los roles sin bloquear. Arrastra el asa{' '}
        <GripVertical className="inline h-3.5 w-3.5 align-[-2px]" /> para cambiar un color de rol.
        Clic en un tono de la escala para usarlo.
      </p>
    </main>
  );
};
