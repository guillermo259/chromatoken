import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ChevronDown, Copy, Download, Link2 } from 'lucide-react';
import { DesignTokenState, ExportTab } from '../types/tokens';
import {
  generateCssVariables,
  generateDesignTokenMd,
  generateTailwindConfig,
  generateTokensJson,
} from '../utils/tokenExporters';
import { ExportFile, generateFigmaVariables, generateTokensStudio } from '../utils/figmaExporters';

interface ExportPanelProps {
  state: DesignTokenState;
  activeTab: ExportTab;
  onTabChange: (tab: ExportTab) => void;
  onCopy: (text: string, label?: string) => void;
  onShare: () => void;
  onBack: () => void;
}

interface ImportGuide {
  title: string;
  steps: React.ReactNode[];
  notes: React.ReactNode[];
}

interface ExportFormat {
  id: ExportTab;
  group: 'code' | 'figma';
  label: string;
  name: string;
  useFor: string;
  build: (s: DesignTokenState) => ExportFile[];
  guide?: ImportGuide;
}

const single =
  (filename: string, mimeType: string, fn: (s: DesignTokenState) => string) =>
  (s: DesignTokenState): ExportFile[] => [{ filename, mimeType, content: fn(s) }];

const Ui: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="font-semibold text-ink">{children}</span>
);

const FORMATS: ExportFormat[] = [
  {
    id: 'css',
    group: 'code',
    label: 'tokens.css',
    name: 'Variables CSS',
    useFor: 'Cualquier proyecto web. Incluye :root, .dark y la importación de Google Fonts.',
    build: single('tokens.css', 'text/css', generateCssVariables),
  },
  {
    id: 'tailwind',
    group: 'code',
    label: 'tailwind-theme.css',
    name: 'Tailwind v4',
    useFor: 'Bloque @theme listo para pegar en tu CSS principal.',
    build: single('tailwind-theme.css', 'text/css', generateTailwindConfig),
  },
  {
    id: 'json',
    group: 'code',
    label: 'tokens.json',
    name: 'JSON (formato W3C)',
    useFor: 'Style Dictionary y otras herramientas que leen tokens DTCG.',
    build: single('tokens.json', 'application/json', generateTokensJson),
  },
  {
    id: 'markdown',
    group: 'code',
    label: 'designtoken.md',
    name: 'Documento Markdown',
    useFor: 'Especificación legible para el equipo o para agentes de código.',
    build: single('designtoken.md', 'text/markdown', generateDesignTokenMd),
  },
  {
    id: 'figma',
    group: 'figma',
    label: 'Light.json + Dark.json',
    name: 'Variables de Figma',
    useFor: 'Importación nativa, sin plugins. Colores, tamaños, radios y espaciado con modos Light y Dark.',
    build: generateFigmaVariables,
    guide: {
      title: 'Cómo importar en Figma',
      steps: [
        <>
          Descarga los dos archivos con <Ui>Descargar todos</Ui>.
        </>,
        <>
          En Figma, sin nada seleccionado, abre <Ui>Local variables</Ui> en el panel derecho y crea una
          colección nueva.
        </>,
        <>
          Arrastra <Ui>Light.json</Ui> y <Ui>Dark.json</Ui> juntos a la ventana de variables. Cada archivo
          crea un modo de la colección.
        </>,
        <>
          Para actualizar más adelante, haz clic derecho sobre un modo, elige <Ui>Import mode</Ui> y
          selecciona el archivo de ese modo.
        </>,
      ],
      notes: [
        'Requiere un plan Professional o superior de Figma.',
        'Los colores semánticos quedan enlazados a la paleta cuando coinciden con un tono.',
        'Las variables de Figma no admiten estilos de texto ni sombras. Para eso usa la opción Tokens Studio.',
      ],
    },
  },
  {
    id: 'tokens-studio',
    group: 'figma',
    label: 'tokens-studio.json',
    name: 'Tokens Studio',
    useFor: 'Para el plugin Tokens Studio. Además de las variables, crea estilos de texto y de sombra.',
    build: single('tokens-studio.json', 'application/json', generateTokensStudio),
    guide: {
      title: 'Cómo importar con Tokens Studio',
      steps: [
        <>
          Instala el plugin <Ui>Tokens Studio for Figma</Ui> desde la Comunidad de Figma y ábrelo.
        </>,
        <>
          Pulsa el botón <Ui>Load and export</Ui> (abajo a la izquierda), elige{' '}
          <Ui>Load from file/folder</Ui>, luego <Ui>Choose file</Ui> y selecciona{' '}
          <Ui>tokens-studio.json</Ui>.
        </>,
        <>
          Pulsa <Ui>Styles &amp; Variables</Ui>, luego <Ui>Export styles &amp; variables</Ui>, y marca
          variables y estilos.
        </>,
      ],
      notes: [
        <>
          Exportar por <Ui>Themes</Ui> crea una colección con modos Light y Dark, pero requiere un plan de
          pago de Tokens Studio. Con <Ui>Token sets</Ui> (gratis), Light y Dark quedan como colecciones
          separadas.
        </>,
        'Incluye los estilos de texto Display, H1 a H3, Body, Small y Code, y las sombras sm, md y lg por modo.',
        <>
          El plugin ya viene configurado con el formato <Ui>W3C DTCG</Ui>, que es el de este archivo. Puedes
          comprobarlo en <Ui>Settings</Ui>, junto a <Ui>Local document</Ui>.
        </>,
      ],
    },
  },
];

const GROUPS: { id: ExportFormat['group']; title: string }[] = [
  { id: 'code', title: 'Para código' },
  { id: 'figma', title: 'Para Figma' },
];

function download(file: ExportFile) {
  const blob = new Blob([file.content], { type: file.mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function downloadAll(files: ExportFile[]) {
  // Un pequeño intervalo evita que el navegador descarte descargas consecutivas.
  files.forEach((f, i) => window.setTimeout(() => download(f), i * 250));
}

function formatBytes(n: number) {
  return n < 1024 ? `${n} B` : `${(n / 1024).toFixed(1)} KB`;
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
    () => Object.fromEntries(FORMATS.map((f) => [f.id, f.build(state)])) as Record<ExportTab, ExportFile[]>,
    [state]
  );
  const current = FORMATS.find((f) => f.id === activeTab) ?? FORMATS[0];
  const files = outputs[current.id];

  const [fileIndex, setFileIndex] = useState(0);
  useEffect(() => setFileIndex(0), [current.id]);
  const file = files[Math.min(fileIndex, files.length - 1)];
  const code = file.content;
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

        <div role="radiogroup" aria-label="Formato de exportación" className="space-y-4">
          {GROUPS.map((group) => (
            <div key={group.id} className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{group.title}</p>
              {FORMATS.filter((f) => f.group === group.id).map((f) => {
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
                      <span className="font-ui-mono text-right text-[11px] text-muted">{f.label}</span>
                    </span>
                    <span className="mt-1 block text-[13px] leading-snug text-ink-soft">{f.useFor}</span>
                  </button>
                );
              })}
            </div>
          ))}
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

      <section aria-label={`Contenido de ${file.filename}`} className="min-w-0">
        {current.guide && (
          <details open className="group mb-4 rounded-xl border border-line bg-sheet">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 [&::-webkit-details-marker]:hidden">
              <span className="text-sm font-bold">{current.guide.title}</span>
              <ChevronDown className="h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-180" />
            </summary>
            <div className="border-t border-line px-4 pb-4 pt-3">
              <ol className="space-y-2">
                {current.guide.steps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-[13px] leading-snug text-ink-soft">
                    <span className="font-ui-mono flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink text-[11px] font-semibold text-ground">
                      {i + 1}
                    </span>
                    <span className="pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
              <ul className="mt-3 space-y-1 border-t border-dashed border-line pt-3">
                {current.guide.notes.map((note, i) => (
                  <li key={i} className="text-[12px] leading-snug text-muted">
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          </details>
        )}

        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {files.length > 1 ? (
              <div role="tablist" aria-label="Archivos" className="inline-flex rounded-lg border border-line p-0.5">
                {files.map((f, i) => (
                  <button
                    key={f.filename}
                    type="button"
                    role="tab"
                    aria-selected={f === file}
                    onClick={() => setFileIndex(i)}
                    className={`font-ui-mono rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors ${
                      f === file ? 'bg-ink text-ground' : 'text-muted hover:text-ink'
                    }`}
                  >
                    {f.filename}
                  </button>
                ))}
              </div>
            ) : (
              <span className="font-ui-mono text-[13px] font-medium text-ink">{file.filename}</span>
            )}
            <span className="font-ui-mono text-[13px] text-muted">
              {lines.length} líneas, {formatBytes(new Blob([code]).size)}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onCopy(code, file.filename)}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-line bg-sheet px-3 text-[13px] font-semibold transition-colors hover:border-ink"
            >
              <Copy className="h-4 w-4" />
              Copiar
            </button>
            {files.length > 1 && (
              <button
                type="button"
                onClick={() => download(file)}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-line bg-sheet px-3 text-[13px] font-semibold transition-colors hover:border-ink"
              >
                <Download className="h-4 w-4" />
                {file.filename}
              </button>
            )}
            <button
              type="button"
              onClick={() => (files.length > 1 ? downloadAll(files) : download(file))}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-ink px-3.5 text-[13px] font-semibold text-ground transition-transform active:scale-[0.97]"
            >
              <Download className="h-4 w-4" />
              {files.length > 1 ? `Descargar todos (${files.length})` : 'Descargar'}
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
