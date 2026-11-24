import React, { useMemo } from 'react';
import { ArrowLeft, Copy, Download, Link2 } from 'lucide-react';
import { DesignTokenState, ExportTab } from '../types/tokens';
import {
  generateCssVariables,
  generateDesignTokenMd,
  generateTailwindConfig,
  generateTokensJson,
} from '../utils/tokenExporters';

interface ExportPanelProps {
  state: DesignTokenState;
  activeTab: ExportTab;
  onTabChange: (tab: ExportTab) => void;
  onCopy: (text: string, label?: string) => void;
  onShare: () => void;
  onBack: () => void;
}

interface ExportFormat {
  id: Exclude<ExportTab, 'visual'>;
  filename: string;
  name: string;
  useFor: string;
  mimeType: string;
  build: (s: DesignTokenState) => string;
}

const FORMATS: ExportFormat[] = [
  {
    id: 'css',
    filename: 'tokens.css',
    name: 'Variables CSS',
    useFor: 'Cualquier proyecto web. Incluye :root, .dark y la importación de Google Fonts.',
    mimeType: 'text/css',
    build: generateCssVariables,
  },
  {
    id: 'tailwind',
    filename: 'tailwind-theme.css',
    name: 'Tailwind v4',
    useFor: 'Bloque @theme listo para pegar en tu CSS principal.',
    mimeType: 'text/css',
    build: generateTailwindConfig,
  },
  {
    id: 'json',
    filename: 'tokens.json',
    name: 'JSON (formato W3C)',
    useFor: 'Figma Tokens Studio, Style Dictionary y otras herramientas.',
    mimeType: 'application/json',
    build: generateTokensJson,
  },
  {
    id: 'markdown',
    filename: 'designtoken.md',
    name: 'Documento Markdown',
    useFor: 'Especificación legible para el equipo o para agentes de código.',
    mimeType: 'text/markdown',
    build: generateDesignTokenMd,
  },
];

function download(filename: string, code: string, mimeType: string) {
  const blob = new Blob([code], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function formatBytes(n: number) {
  return n < 1024 ? `${n} B` : `${(n / 1024).toFixed(1)} KB`;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({
  state,
  activeTab,
  onTabChange,
  onCopy,
  onShare,
  onBack,
}) => {
  const outputs = useMemo(
    () => Object.fromEntries(FORMATS.map((f) => [f.id, f.build(state)])) as Record<ExportFormat['id'], string>,
    [state]
  );
  const current = FORMATS.find((f) => f.id === activeTab) ?? FORMATS[0];
  const code = outputs[current.id];
  const lines = code.split('\n');

  return (
    <main className="mx-auto grid max-w-[1400px] grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:py-8">
      <div className="space-y-5">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted transition-colors hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al sistema
          </button>
          <h1 className="font-ui-display text-3xl font-extrabold leading-[0.95] tracking-[-0.035em]">
            Exportar {state.brandName || 'tokens'}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            Todos los archivos salen de la misma configuración. Elige el formato que usa tu proyecto.
          </p>
        </div>

        <div className="flex h-3 overflow-hidden rounded-full" aria-hidden="true">
          {state.colors.map((c) => (
            <span key={c.role} className="flex-1" style={{ backgroundColor: c.hex }} />
          ))}
        </div>

        <div role="radiogroup" aria-label="Formato de exportación" className="space-y-2">
          {FORMATS.map((f) => {
            const active = f.id === current.id;
            return (
              <button
                key={f.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onTabChange(f.id)}
                className={`block w-full rounded-xl border p-3.5 text-left transition-colors ${
                  active ? 'border-ink bg-sheet' : 'border-line hover:border-ink-soft hover:bg-panel'
                }`}
              >
                <span className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-bold">{f.name}</span>
                  <span className="font-ui-mono text-[11px] text-muted">{f.filename}</span>
                </span>
                <span className="mt-1 block text-[13px] leading-snug text-ink-soft">{f.useFor}</span>
              </button>
            );
          })}
        </div>

        <div className="rounded-xl border border-dashed border-line p-3.5">
          <p className="text-sm font-bold">Enlace editable</p>
          <p className="mt-1 text-[13px] leading-snug text-ink-soft">
            Un enlace que reabre esta configuración para seguir ajustándola.
          </p>
          <button
            type="button"
            onClick={onShare}
            className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg border border-line bg-sheet px-3 text-[13px] font-semibold transition-colors hover:border-ink"
          >
            <Link2 className="h-4 w-4" />
            Copiar enlace
          </button>
        </div>
      </div>

      <section aria-label={`Contenido de ${current.filename}`} className="min-w-0">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[13px] text-muted">
            <span className="font-ui-mono font-medium text-ink">{current.filename}</span>
            <span className="mx-2" aria-hidden="true">/</span>
            <span className="font-ui-mono">
              {lines.length} líneas, {formatBytes(new Blob([code]).size)}
            </span>
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onCopy(code, current.filename)}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-line bg-sheet px-3 text-[13px] font-semibold transition-colors hover:border-ink"
            >
              <Copy className="h-4 w-4" />
              Copiar
            </button>
            <button
              type="button"
              onClick={() => download(current.filename, code, current.mimeType)}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-ink px-3.5 text-[13px] font-semibold text-ground transition-transform active:scale-[0.97]"
            >
              <Download className="h-4 w-4" />
              Descargar
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl bg-ink text-[#E8E7E1]">
          <div className="max-h-[calc(100vh-12rem)] overflow-auto">
            <pre className="font-ui-mono grid grid-cols-[auto_1fr] py-4 text-[12.5px] leading-[1.7]">
              <code aria-hidden="true" className="select-none border-r border-white/10 pl-4 pr-3 text-right text-white/30">
                {lines.map((_, i) => (
                  <span key={i} className="block">
                    {i + 1}
                  </span>
                ))}
              </code>
              <code className="px-4">{code}</code>
            </pre>
          </div>
        </div>
      </section>
    </main>
  );
};
