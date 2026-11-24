import React, { useState } from 'react';
import { ArrowRight, Columns2, Moon, Sun } from 'lucide-react';
import { DesignTokenState, PreviewThemeMode } from '../types/tokens';
import { VisualShowcaseSurface } from './VisualShowcaseSurface';
import { ContrastControls, ContrastMenu } from './ContrastPanel';

interface PreviewCanvasProps {
  state: DesignTokenState;
  themeMode: PreviewThemeMode;
  onThemeModeChange: (mode: PreviewThemeMode) => void;
  onContinue: () => void;
  contrast: ContrastControls;
}

const MODES: Array<{ id: PreviewThemeMode; label: string; icon: React.ElementType }> = [
  { id: 'light', label: 'Claro', icon: Sun },
  { id: 'dark', label: 'Oscuro', icon: Moon },
  { id: 'split', label: 'Ambos', icon: Columns2 },
];

export const PreviewCanvas: React.FC<PreviewCanvasProps> = ({
  state,
  themeMode,
  onThemeModeChange,
  onContinue,
  contrast,
}) => {
  const [contrastOpen, setContrastOpen] = useState(false);

  return (
    <div className="min-w-0 flex-1">
      <div className="z-20 flex flex-wrap items-center justify-between gap-3 border-b border-line bg-ground/92 px-4 py-2.5 backdrop-blur-md sm:px-6 md:sticky md:top-14">
        <div className="flex items-center gap-3">
          <h1 className="font-ui-display text-sm font-extrabold tracking-[-0.01em]">Vista previa</h1>
          <div role="radiogroup" aria-label="Modo de la vista previa" className="flex gap-1 rounded-lg bg-line-soft p-1">
            {MODES.map(({ id, label, icon: Icon }) => {
              const active = themeMode === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => onThemeModeChange(id)}
                  className={`inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold transition-colors ${
                    active ? 'bg-sheet text-ink shadow-[0_1px_2px_rgba(22,22,20,0.12)]' : 'text-muted hover:text-ink'
                  } ${id === 'split' ? 'hidden xl:inline-flex' : ''}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ContrastMenu
            contrast={contrast}
            colors={state.colors}
            open={contrastOpen}
            onOpenChange={setContrastOpen}
          />
          <button
            type="button"
            onClick={onContinue}
            className="group inline-flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border border-ink px-3 text-[13px] font-semibold transition-colors hover:bg-ink hover:text-ground"
          >
            Siguiente: exportar
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8">
        {themeMode === 'split' ? (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <VisualShowcaseSurface state={state} mode="light" compact />
            <VisualShowcaseSurface state={state} mode="dark" compact />
          </div>
        ) : (
          <div className="mx-auto max-w-5xl">
            <VisualShowcaseSurface state={state} mode={themeMode} />
          </div>
        )}
      </div>
    </div>
  );
};
