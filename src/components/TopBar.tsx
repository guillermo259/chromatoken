import React from 'react';
import { WorkspaceSection } from '../types/tokens';

interface TopBarProps {
  activeSection: WorkspaceSection;
  onNavigate: (section: WorkspaceSection) => void;
  onExportClick: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeSection,
  onNavigate,
  onExportClick,
}) => {
  const navItems: Array<{ id: WorkspaceSection; label: string }> = [
    { id: 'palette', label: '1. Paleta' },
    { id: 'studio', label: '2. Tipografía y UI' },
    { id: 'export', label: '3. Exportar' },
  ];

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-8 border-b border-slate-200 bg-white/95 px-6 backdrop-blur-sm">
      {/* Zone 1: Single text element wordmark */}
      <button
        type="button"
        onClick={() => onNavigate('palette')}
        className="font-ui-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-900"
      >
        ChromaToken
      </button>

      {/* Zone 2: Clean single-line text navigation links */}
      <nav aria-label="Navegación principal" className="hidden md:flex items-center gap-7">
        {navItems.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`relative py-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-900 ${
                isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {item.label}
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 -bottom-[15px] h-0.5 bg-slate-900"
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Zone 3: Single primary action */}
      <div className="flex items-center shrink-0">
        <button
          type="button"
          onClick={onExportClick}
          className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
        >
          Exportar Tokens
        </button>
      </div>
    </header>
  );
};
