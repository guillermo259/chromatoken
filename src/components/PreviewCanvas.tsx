import React from 'react';
import { Columns2, Moon, Sun } from 'lucide-react';
import { DesignTokenState, ExportTab, PreviewThemeMode } from '../types/tokens';
import {
  generateCssVariables,
  generateDesignTokenMd,
  generateTailwindConfig,
  generateTokensJson,
} from '../utils/tokenExporters';
import { VisualShowcaseSurface } from './VisualShowcaseSurface';
import { ExportCodeView } from './ExportCodeView';

interface PreviewCanvasProps {
  state: DesignTokenState;
  activeTab: ExportTab;
  themeMode: PreviewThemeMode;
  onTabChange: (tab: ExportTab) => void;
  onThemeModeChange: (mode: PreviewThemeMode) => void;
}

const TABS: Array<{ id: ExportTab; label: string }> = [
  { id: 'visual', label: 'Vista Previa UI' },
  { id: 'markdown', label: 'designtoken.md' },
  { id: 'json', label: 'tokens.json' },
  { id: 'css', label: 'CSS Variables' },
  { id: 'tailwind', label: 'Tailwind v4' },
];

export const PreviewCanvas: React.FC<PreviewCanvasProps> = ({
  state,
  activeTab,
  themeMode,
  onTabChange,
  onThemeModeChange,
}) => {
  return (
    <div className="flex-1 min-w-0 bg-[#F4F5F7]">
      {/* Workspace Tab + Light/Dark/Split Toolbar */}
      <div className="sticky top-14 z-20 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-6 py-2.5 backdrop-blur-sm">
        <div className="flex items-center gap-5 overflow-x-auto">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`relative py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {tab.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-[11px] h-0.5 bg-slate-900"
                  />
                )}
              </button>
            );
          })}
        </div>

        {activeTab === 'visual' && (
          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => onThemeModeChange('light')}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                themeMode === 'light'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sun className="h-3.5 w-3.5" />
              Light
            </button>
            <button
              type="button"
              onClick={() => onThemeModeChange('dark')}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                themeMode === 'dark'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Moon className="h-3.5 w-3.5" />
              Dark
            </button>
            <button
              type="button"
              onClick={() => onThemeModeChange('split')}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                themeMode === 'split'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Columns2 className="h-3.5 w-3.5" />
              Ambos
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="p-5 lg:p-7">
        {activeTab === 'visual' && (
          <>
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
          </>
        )}

        {activeTab === 'markdown' && (
          <ExportCodeView
            filename="designtoken.md"
            title="Especificación designtoken.md"
            description="Documento Markdown legible para equipos y agentes de programación"
            code={generateDesignTokenMd(state)}
            mimeType="text/markdown"
          />
        )}

        {activeTab === 'json' && (
          <ExportCodeView
            filename="tokens.json"
            title="W3C Design Tokens (JSON)"
            description="Estructura jerárquica estándar compatible con Figma, Style Dictionary y Tokens Studio"
            code={generateTokensJson(state)}
            mimeType="application/json"
          />
        )}

        {activeTab === 'css' && (
          <ExportCodeView
            filename="tokens.css"
            title="CSS Custom Properties (:root & .dark)"
            description="Variables CSS listas para importar con Google Fonts y soporte nativo Light/Dark"
            code={generateCssVariables(state)}
            mimeType="text/css"
          />
        )}

        {activeTab === 'tailwind' && (
          <ExportCodeView
            filename="tailwind-theme.css"
            title="Tailwind CSS v4 (@theme)"
            description="Directiva @theme y variantes Light/Dark para copiar directo en src/index.css"
            code={generateTailwindConfig(state)}
            mimeType="text/css"
          />
        )}
      </div>
    </div>
  );
};
