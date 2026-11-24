import React, { useRef, useState } from 'react';
import { ArrowRight, ChevronDown, Columns2, Moon, Sun } from 'lucide-react';
import { DesignTokenState, PreviewThemeMode } from '../types/tokens';
import { InterfacePreview, PREVIEW_TEMPLATES, PreviewPlatform, PreviewTemplate } from './InterfacePreview';
import { VisualShowcaseSurface } from './VisualShowcaseSurface';
import { ContrastControls, ContrastMenu } from './ContrastPanel';
import { useTranslation } from '../i18n/LocaleProvider';

interface PreviewCanvasProps {
  state: DesignTokenState;
  themeMode: PreviewThemeMode;
  onThemeModeChange: (mode: PreviewThemeMode) => void;
  template: PreviewTemplate;
  onTemplateChange: (template: PreviewTemplate) => void;
  platform: PreviewPlatform;
  onPlatformChange: (platform: PreviewPlatform) => void;
  onContinue: () => void;
  contrast: ContrastControls;
}

const MODES: Array<{ id: PreviewThemeMode; label: string; icon: React.ElementType }> = [
  { id: 'light', label: 'Claro', icon: Sun },
  { id: 'dark', label: 'Oscuro', icon: Moon },
  { id: 'split', label: 'Ambos', icon: Columns2 },
];

const PLATFORMS = [
  { id: 'web', label: 'Web' },
  { id: 'app', label: 'App móvil' },
] as const satisfies ReadonlyArray<{ id: PreviewPlatform; label: string }>;

export const PreviewCanvas: React.FC<PreviewCanvasProps> = ({
  state,
  themeMode,
  onThemeModeChange,
  template,
  onTemplateChange,
  platform,
  onPlatformChange,
  onContinue,
  contrast,
}) => {
  const t = useTranslation();
  const [contrastOpen, setContrastOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const templateToggle = useRef<HTMLButtonElement>(null);
  const modes = themeMode === 'split' ? (['light', 'dark'] as const) : [themeMode];
  const selectedTemplate = PREVIEW_TEMPLATES.find(({ id }) => id === template);

  const closeTemplateList = () => {
    setTemplatesOpen(false);
    templateToggle.current?.focus();
  };

  return (
    <div className="min-w-0 flex-1 lg:min-w-[75vw]">
      <div className="z-20 flex flex-wrap items-center justify-between gap-3 border-b border-line bg-ground/92 px-4 py-2.5 backdrop-blur-md sm:px-6 md:sticky md:top-14">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <h1 className="font-ui-display text-sm font-extrabold tracking-[-0.01em]">{t('Vista previa')}</h1>
          <div role="group" aria-label={t('Modo de la vista previa')} className="flex gap-1 rounded-lg bg-line-soft p-1">
            {MODES.map(({ id, label, icon: Icon }) => {
              const active = themeMode === id;
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onThemeModeChange(id)}
                  className={`inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold transition-colors ${
                    active ? 'bg-sheet text-ink shadow-[0_1px_2px_rgba(22,22,20,0.12)]' : 'text-muted hover:text-ink'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {t(label)}
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
            aria-label={t('Siguiente: exportar')}
            className="group inline-flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border border-ink px-3 text-[13px] font-semibold transition-colors hover:bg-ink hover:text-ground"
          >
            <span className="sm:hidden">{t('Exportar')}</span>
            <span className="hidden sm:inline">{t('Siguiente: exportar')}</span>
            <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_9.5rem] lg:p-8">
        <div className="flex items-start justify-end gap-2 lg:sticky lg:top-32 lg:col-start-2 lg:row-start-1 lg:flex-col">
          <div role="group" aria-label={t('Formato de interfaz')} className="rounded-xl border border-line bg-panel px-1.5 py-1 lg:w-full">
            <span className="block px-1.5 text-[11px] text-muted">{t('Formato')}</span>
            <div className="flex gap-0.5">
              {PLATFORMS.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={template !== 'components' && platform === id}
                  onClick={() => {
                    onPlatformChange(id);
                    if (template === 'components') onTemplateChange('landing');
                  }}
                  className="min-h-7 flex-1 whitespace-nowrap rounded-md px-1.5 text-[11px] font-semibold text-ink-soft transition-colors hover:bg-line-soft aria-pressed:bg-ink aria-pressed:text-ground"
                >
                  {t(label)}
                </button>
              ))}
            </div>
          </div>
          <nav
            aria-label={t('Tipo de interfaz')}
            className="w-44 min-w-0 lg:w-full"
            onKeyDown={(event) => {
              if (event.key === 'Escape' && templatesOpen) closeTemplateList();
            }}
          >
            <button
              ref={templateToggle}
              type="button"
              aria-expanded={templatesOpen}
              aria-controls="preview-template-options"
              onClick={() => setTemplatesOpen(!templatesOpen)}
              className="flex w-full items-center justify-between gap-2 rounded-xl border border-line bg-panel px-3 py-2 text-left lg:hidden"
            >
              <span>
                <span className="block text-[11px] text-muted">{t('Tipo de interfaz')}</span>
                <span className="block text-xs font-semibold">{selectedTemplate && t(selectedTemplate.label)}</span>
              </span>
              <ChevronDown aria-hidden="true" className={`h-4 w-4 ${templatesOpen ? 'rotate-180' : ''}`} />
            </button>
            <div id="preview-template-options" className={`rounded-xl border border-line bg-panel p-2.5 lg:block ${templatesOpen ? 'mt-1.5' : 'hidden'} lg:mt-0`}>
              <h2 className="mb-2 hidden px-1 text-xs font-semibold text-ink-soft lg:block">{t('Tipo de interfaz')}</h2>
              <ul className="grid gap-1">
                {PREVIEW_TEMPLATES.map(({ id, label, icon: Icon }) => (
                  <li key={id}>
                    <button
                      type="button"
                      aria-pressed={template === id}
                      onClick={() => {
                        onTemplateChange(id);
                        if (templatesOpen) closeTemplateList();
                      }}
                      className="flex min-h-9 w-full items-center gap-2 rounded-md px-2 text-left text-xs font-semibold text-ink-soft transition-colors hover:bg-line-soft aria-pressed:bg-ink aria-pressed:text-ground"
                    >
                      <Icon aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                      {t(label)}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        </div>

        <div className={`min-w-0 lg:col-start-1 lg:row-start-1 ${themeMode === 'split' ? 'grid grid-cols-[repeat(auto-fit,minmax(min(100%,23rem),1fr))] items-start gap-4' : ''}`}>
          {modes.map((mode) => template === 'components' ? (
            <VisualShowcaseSurface
              key={themeMode === 'split' ? mode : 'components'}
              state={state}
              mode={mode}
              compact={themeMode === 'split'}
              contrastReport={contrast.report}
            />
          ) : (
            <InterfacePreview key={mode} state={state} mode={mode} template={template} platform={platform} />
          ))}
        </div>
      </div>
    </div>
  );
};
