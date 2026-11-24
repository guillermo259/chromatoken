import React from 'react';
import { ArrowUpRight, Link2 } from 'lucide-react';
import { PaletteColor, WorkspaceSection } from '../types/tokens';

interface TopBarProps {
  colors: PaletteColor[];
  activeSection: WorkspaceSection;
  onNavigate: (section: WorkspaceSection) => void;
  onShare: () => void;
}

const STEPS: Array<{ id: WorkspaceSection; label: string; short: string }> = [
  { id: 'palette', label: 'Color', short: 'Color' },
  { id: 'studio', label: 'Sistema', short: 'Sistema' },
  { id: 'export', label: 'Exportar', short: 'Exportar' },
];

/** Logomark built from the live palette, so the brand mark changes with the work. */
const LiveMark: React.FC<{ colors: PaletteColor[] }> = ({ colors }) => (
  <span
    aria-hidden="true"
    className="flex h-7 w-7 items-end gap-0.5 rounded-md bg-ink p-1.25"
  >
    {colors.map((c, i) => (
      <span
        key={c.role}
        className="w-full rounded-[1.5px] transition-[background-color,height] duration-300"
        style={{ backgroundColor: c.hex, height: `${100 - i * 18}%` }}
      />
    ))}
  </span>
);

export const TopBar: React.FC<TopBarProps> = ({ colors, activeSection, onNavigate, onShare }) => {
  const activeIndex = STEPS.findIndex((s) => s.id === activeSection);

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-ground/92 backdrop-blur-md">
      {/* Three-column grid: the steps sit in the middle track, so they never shift
          when the actions on the right change (Export hides its own button). */}
      <div className="grid h-14 grid-cols-[1fr_auto] items-center gap-4 px-4 sm:px-6 md:grid-cols-[1fr_auto_1fr]">
        <button
          type="button"
          onClick={() => onNavigate('palette')}
          className="group flex shrink-0 items-center gap-2.5 justify-self-start rounded-md"
          aria-label="ChromaToken, volver al inicio"
        >
          <LiveMark colors={colors} />
          <span className="font-ui-display font-wide text-[15px] font-extrabold tracking-[-0.03em]">
            ChromaToken
          </span>
        </button>

        <nav aria-label="Pasos" className="hidden md:block">
          <ol className="flex items-center rounded-lg border border-line bg-panel p-1">
            {STEPS.map((step, i) => {
              const isActive = step.id === activeSection;
              const isDone = i < activeIndex;
              return (
                <li key={step.id}>
                  <button
                    type="button"
                    onClick={() => onNavigate(step.id)}
                    aria-current={isActive ? 'step' : undefined}
                    className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
                      isActive
                        ? 'bg-ink text-ground'
                        : 'text-muted hover:bg-line-soft hover:text-ink'
                    }`}
                  >
                    <span
                      className={`font-ui-mono text-[11px] ${
                        isActive ? 'text-signal' : isDone ? 'text-ink' : 'text-muted'
                      }`}
                    >
                      {i + 1}
                    </span>
                    {step.label}
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="flex shrink-0 items-center gap-2 justify-self-end">
          <button
            type="button"
            onClick={onShare}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-line bg-sheet px-3 text-[13px] font-semibold text-ink transition-colors hover:border-ink"
            title="Copiar un enlace con toda la configuración"
          >
            <Link2 className="h-4 w-4" />
            <span className="hidden sm:inline md:hidden lg:inline">Compartir</span>
          </button>
          {activeSection !== 'export' && (
            <button
              type="button"
              onClick={() => onNavigate('export')}
              className="group inline-flex h-9 items-center gap-1.5 rounded-lg bg-ink px-3.5 text-[13px] font-semibold text-ground transition-transform active:scale-[0.97]"
            >
              Exportar
              <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </button>
          )}
        </div>
      </div>

      {/* Phone step switcher: same control, full width */}
      <nav aria-label="Pasos" className="border-t border-line px-4 py-2 md:hidden">
        <ol className="grid grid-cols-3 gap-1 rounded-lg border border-line bg-panel p-1">
          {STEPS.map((step, i) => {
            const isActive = step.id === activeSection;
            return (
              <li key={step.id}>
                <button
                  type="button"
                  onClick={() => onNavigate(step.id)}
                  aria-current={isActive ? 'step' : undefined}
                  className={`flex w-full items-center justify-center gap-1.5 rounded-md py-2 text-[13px] font-semibold ${
                    isActive ? 'bg-ink text-ground' : 'text-muted'
                  }`}
                >
                  <span className={`font-ui-mono text-[11px] ${isActive ? 'text-signal' : ''}`}>
                    {i + 1}
                  </span>
                  {step.short}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
    </header>
  );
};
