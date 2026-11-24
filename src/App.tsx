import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ColorRole,
  ContrastLevel,
  DesignTokenState,
  ExportTab,
  GeometryConfig,
  HarmonyMode,
  PreviewThemeMode,
  TypographyConfig,
  WorkspaceSection,
} from './types/tokens';
import { CURATED_PAIRINGS, injectGoogleFontsLink } from './data/googleFonts';
import { CURATED_PRESETS, generateHarmoniousPalette } from './utils/colorEngine';
import {
  decodeStateFromHash,
  encodeStateToHash,
  sanitizeDesignTokenState,
} from './utils/tokenExporters';
import { auditContrast, enforceContrast } from './utils/contrastAudit';
import { TopBar } from './components/TopBar';
import { PaletteBoard } from './components/PaletteBoard';
import { StudioSidebar } from './components/StudioSidebar';
import { PreviewCanvas } from './components/PreviewCanvas';
import type { PreviewPlatform, PreviewTemplate } from './components/InterfacePreview';
import { ExportPanel } from './components/ExportPanel';
import { Toast } from './components/Toast';
import { Footer } from './components/Footer';
import { richMessage, useTranslation } from './i18n/LocaleProvider';
import { roleNames } from './i18n/messages';

const STORAGE_KEY = 'chromatoken_workspace_v1';
const LEGACY_LEVEL_KEY = 'chromatoken_contrast_level';
const HISTORY_LIMIT = 40;
const COALESCE_WINDOW_MS = 380;

const DEFAULT_STATE: DesignTokenState = {
  brandName: 'Acme Studio',
  harmonyMode: 'curated',
  contrastLevel: 'AA',
  colors: [
    { role: 'primary', label: 'Primary', hex: '#4A7C59', locked: false },
    { role: 'secondary', label: 'Secondary', hex: '#64748B', locked: false },
    { role: 'accent', label: 'Accent', hex: '#D97706', locked: false },
    { role: 'neutral', label: 'Neutral', hex: '#6B6E6B', locked: false },
  ],
  typography: {
    pairingId: 'modern-saas',
    headingFont: 'Plus Jakarta Sans',
    headingWeight: 700,
    headingTracking: -0.025,
    bodyFont: 'DM Sans',
    bodyWeight: 400,
    monoFont: 'JetBrains Mono',
    baseSize: 16,
    scaleRatio: 1.25,
    lineHeight: 1.6,
  },
  geometry: {
    radiusBase: 8,
    spacingUnit: 4,
    cardPadding: 24,
    elementGap: 16,
    elevationStyle: 'soft',
  },
};

interface InitialWorkspaceLoad {
  state: DesignTokenState;
  conflictingSavedState: DesignTokenState | null;
}

function loadInitialWorkspace(): InitialWorkspaceLoad {
  if (typeof window !== 'undefined') {
    let savedState: DesignTokenState | null = null;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        const sanitized = sanitizeDesignTokenState(parsed, DEFAULT_STATE);
        if (sanitized) {
          // Migrate legacy contrast level preference if present on older saved states
          const rawObj = parsed as Record<string, unknown>;
          savedState =
            !('contrastLevel' in rawObj) && localStorage.getItem(LEGACY_LEVEL_KEY) === 'AAA'
              ? { ...sanitized, contrastLevel: 'AAA' }
              : sanitized;
        }
      }
    } catch {
      savedState = null;
    }

    const fromHash = decodeStateFromHash(window.location.hash, DEFAULT_STATE);
    if (fromHash) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      const isDifferent =
        savedState !== null && JSON.stringify(savedState) !== JSON.stringify(fromHash);
      if (isDifferent) {
        // Keep the prior saved workspace intact until the user confirms or starts editing
        return { state: fromHash, conflictingSavedState: savedState };
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fromHash));
        localStorage.setItem(LEGACY_LEVEL_KEY, fromHash.contrastLevel);
      } catch {
        // Ignore storage quota errors
      }
      return { state: fromHash, conflictingSavedState: null };
    }

    if (savedState) {
      return { state: savedState, conflictingSavedState: null };
    }
  }
  return { state: DEFAULT_STATE, conflictingSavedState: null };
}

interface HistoryStore {
  entries: DesignTokenState[];
  index: number;
  lastCoalesceKey: string | null;
  lastTimestamp: number;
}

export default function App() {
  const t = useTranslation();
  const [{ state: initialState, conflictingSavedState }] =
    useState<InitialWorkspaceLoad>(loadInitialWorkspace);
  const [savedBackup, setSavedBackup] = useState<DesignTokenState | null>(conflictingSavedState);
  const [storagePaused, setStoragePaused] = useState<boolean>(conflictingSavedState !== null);
  const [historyStore, setHistoryStore] = useState<HistoryStore>(() => ({
    entries: [initialState],
    index: 0,
    lastCoalesceKey: null,
    lastTimestamp: 0,
  }));

  const state = historyStore.entries[historyStore.index];
  const canUndo = historyStore.index > 0;
  const canRedo = historyStore.index < historyStore.entries.length - 1;

  const [activeSection, setActiveSection] = useState<WorkspaceSection>('palette');
  const [activeExportTab, setActiveExportTab] = useState<ExportTab>('css');
  const [themeMode, setThemeMode] = useState<PreviewThemeMode>('light');
  const [previewTemplate, setPreviewTemplate] = useState<PreviewTemplate>('components');
  const [previewPlatform, setPreviewPlatform] = useState<PreviewPlatform>('web');
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  const contrastReport = useMemo(
    () => auditContrast(state.colors, state.contrastLevel),
    [state.colors, state.contrastLevel]
  );

  const notify = useCallback((message: string) => {
    window.clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), message });
    toastTimer.current = window.setTimeout(() => setToast(null), 2200);
  }, []);

  useEffect(() => {
    injectGoogleFontsLink(
      state.typography.headingFont,
      state.typography.bodyFont,
      state.typography.monoFont
    );
  }, [state.typography.headingFont, state.typography.bodyFont, state.typography.monoFont]);

  useEffect(() => {
    if (storagePaused) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      localStorage.setItem(LEGACY_LEVEL_KEY, state.contrastLevel);
    } catch {
      // Storage unavailable or full: the session still works in memory
    }
  }, [state, storagePaused]);

  /**
   * Commits any state transformation to the unified undo/redo history.
   * When `coalesceKey` matches a continuous edit within COALESCE_WINDOW_MS (e.g. slider drag
   * or typing), the top entry is updated in place so Ctrl+Z undoes the whole gesture cleanly.
   */
  const commitState = useCallback(
    (updater: (prev: DesignTokenState) => DesignTokenState, coalesceKey: string | null = null) => {
      setStoragePaused(false);
      const now = Date.now();
      setHistoryStore((store) => {
        const current = store.entries[store.index];
        const next = updater(current);
        if (next === current) return store;

        const shouldCoalesce =
          coalesceKey !== null &&
          store.lastCoalesceKey === coalesceKey &&
          now - store.lastTimestamp < COALESCE_WINDOW_MS &&
          store.index > 0;

        if (shouldCoalesce) {
          const updated = store.entries.slice(0, store.index + 1);
          updated[store.index] = next;
          return {
            entries: updated,
            index: store.index,
            lastCoalesceKey: coalesceKey,
            lastTimestamp: now,
          };
        }

        const sliced = store.entries.slice(0, store.index + 1);
        const entries = [...sliced, next].slice(-HISTORY_LIMIT);
        return {
          entries,
          index: entries.length - 1,
          lastCoalesceKey: coalesceKey,
          lastTimestamp: now,
        };
      });
    },
    []
  );

  const handleUndo = useCallback(() => {
    setHistoryStore((store) => {
      if (store.index <= 0) return store;
      return {
        ...store,
        index: store.index - 1,
        lastCoalesceKey: null,
        lastTimestamp: 0,
      };
    });
  }, []);

  const handleRedo = useCallback(() => {
    setHistoryStore((store) => {
      if (store.index >= store.entries.length - 1) return store;
      return {
        ...store,
        index: store.index + 1,
        lastCoalesceKey: null,
        lastTimestamp: 0,
      };
    });
  }, []);

  // Global Undo/Redo keyboard shortcuts across all workspace views
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      ) {
        const inputType = (target as HTMLInputElement).type;
        if (inputType !== 'range' && inputType !== 'color') {
          return;
        }
      }
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const key = e.key.toLowerCase();
      if (key === 'z' || key === 'y') {
        e.preventDefault();
        if (key === 'y' || e.shiftKey) handleRedo();
        else handleUndo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleUndo, handleRedo]);

  const handleGeneratePalette = useCallback(() => {
    if (state.colors.every((c) => c.locked)) {
      notify(t('Todos los colores están bloqueados'));
      return;
    }
    commitState((prev) => ({
      ...prev,
      colors: generateHarmoniousPalette(prev.colors, prev.harmonyMode),
    }));
  }, [state.colors, commitState, notify, t]);

  const handleApplyContrastFix = useCallback(
    (role: ColorRole, hex: string) => {
      commitState((prev) => ({
        ...prev,
        colors: prev.colors.map((c) => (c.role === role ? { ...c, hex } : c)),
      }));
      notify(t('{0} ajustado a {1}', t(roleNames[role]), hex));
    },
    [commitState, notify, t]
  );

  const handleFixAllContrast = useCallback(() => {
    const nextColors = enforceContrast(state.colors, state.contrastLevel);
    const changed = nextColors.filter((c, i) => c.hex !== state.colors[i].hex).length;
    if (changed === 0) return;
    commitState((prev) => ({ ...prev, colors: nextColors }));
    const after = auditContrast(nextColors, state.contrastLevel);
    const baseMsg = changed === 1 ? t('1 color ajustado') : t('{0} colores ajustados', changed);
    if (after.failures.length > 0) {
      const count = after.failures.length;
      notify(t(count === 1 ? '{0} · queda {1} aviso' : '{0} · quedan {1} avisos', baseMsg, count));
    } else {
      notify(baseMsg);
    }
  }, [state.colors, state.contrastLevel, commitState, notify, t]);

  const contrastProps = {
    report: contrastReport,
    onLevelChange: (contrastLevel: ContrastLevel) =>
      commitState((prev) => ({ ...prev, contrastLevel })),
    onApplyFix: handleApplyContrastFix,
    onFixAll: handleFixAllContrast,
  };

  const handleUpdateColor = useCallback(
    (role: ColorRole, hex: string) => {
      commitState(
        (prev) => ({
          ...prev,
          colors: prev.colors.map((c) => (c.role === role ? { ...c, hex } : c)),
        }),
        `color-${role}`
      );
    },
    [commitState]
  );

  const handleToggleLock = useCallback(
    (role: ColorRole) => {
      commitState((prev) => ({
        ...prev,
        colors: prev.colors.map((c) => (c.role === role ? { ...c, locked: !c.locked } : c)),
      }));
    },
    [commitState]
  );

  /**
   * Roles are fixed slots (primary, secondary, accent, neutral). Dragging a swatch
   * from one slot to another moves the color value and its lock; the slots stay put.
   */
  const handleMoveColor = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex) return;
      commitState((prev) => {
        const values = prev.colors.map(({ hex, locked }) => ({ hex, locked }));
        const [moved] = values.splice(fromIndex, 1);
        values.splice(toIndex, 0, moved);
        return {
          ...prev,
          colors: prev.colors.map((slot, i) => ({ ...slot, ...values[i] })),
        };
      });
    },
    [commitState]
  );

  const handleApplyPreset = useCallback(
    (presetId: string) => {
      const preset = CURATED_PRESETS.find((p) => p.id === presetId);
      if (!preset) return;
      commitState((prev) => ({
        ...prev,
        colors: prev.colors.map((c) => ({ ...c, hex: preset.colors[c.role], locked: false })),
      }));
      notify(t('Paleta «{0}» aplicada', preset.name));
    },
    [commitState, notify, t]
  );

  const handleUpdateTypography = useCallback(
    (patch: Partial<TypographyConfig>) => {
      const coalesce =
        'baseSize' in patch || 'lineHeight' in patch || 'headingTracking' in patch
          ? `typo-${Object.keys(patch).join(',')}`
          : null;
      commitState(
        (prev) => ({ ...prev, typography: { ...prev.typography, ...patch } }),
        coalesce
      );
    },
    [commitState]
  );

  const handleApplyPairing = useCallback(
    (pairingId: string) => {
      const pairing = CURATED_PAIRINGS.find((p) => p.id === pairingId);
      if (!pairing) return;
      commitState((prev) => ({
        ...prev,
        typography: {
          ...prev.typography,
          pairingId: pairing.id,
          headingFont: pairing.headingFont,
          headingWeight: pairing.headingWeight,
          headingTracking: pairing.headingTracking,
          bodyFont: pairing.bodyFont,
          bodyWeight: pairing.bodyWeight,
          monoFont: pairing.monoFont,
          scaleRatio: pairing.scaleRatio,
        },
      }));
    },
    [commitState]
  );

  const handleUpdateGeometry = useCallback(
    (patch: Partial<GeometryConfig>) => {
      const coalesce =
        'cardPadding' in patch || 'elementGap' in patch
          ? `geo-${Object.keys(patch).join(',')}`
          : null;
      commitState(
        (prev) => ({ ...prev, geometry: { ...prev.geometry, ...patch } }),
        coalesce
      );
    },
    [commitState]
  );

  const handleShareUrl = useCallback(async () => {
    const encoded = encodeStateToHash(state);
    if (!encoded) return;
    const shareUrl = `${window.location.origin}${window.location.pathname}#state=${encoded}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      notify(t('Enlace copiado. Quien lo abra verá esta misma configuración.'));
    } catch {
      window.history.replaceState(null, '', `#state=${encoded}`);
      notify(t('No se pudo copiar. El enlace quedó en la barra de direcciones'));
    }
  }, [state, notify, t]);

  const handleCopy = useCallback(
    async (text: string, label?: string) => {
      try {
        await navigator.clipboard.writeText(text);
        notify(t('{0} copiado', label ?? text));
      } catch {
        notify(t('El navegador bloqueó el portapapeles'));
      }
    },
    [notify, t]
  );

  const navigate = (section: WorkspaceSection) => {
    setActiveSection(section);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="min-h-screen bg-ground text-ink">
      <a
        href="#workspace"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-ink focus:px-3 focus:py-2 focus:text-sm focus:text-ground"
      >
        {t('Saltar al área de trabajo')}
      </a>

      <TopBar
        colors={state.colors}
        activeSection={activeSection}
        onNavigate={navigate}
        onShare={handleShareUrl}
      />

      {savedBackup && (
        <div
          role="region"
          aria-label={t('Enlace compartido')}
          className="border-b border-line bg-sheet px-4 py-2.5 sm:px-6"
        >
          <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-2.5 text-xs">
            <p className="text-ink-soft">
              {richMessage(
                t('Abriste un enlace compartido. Tu espacio anterior ({0}) sigue guardado.'),
                <span className="font-semibold text-ink">{savedBackup.brandName || t('Sin nombre')}</span>
              )}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const previous = savedBackup;
                  setSavedBackup(null);
                  setStoragePaused(false);
                  setHistoryStore({
                    entries: [previous],
                    index: 0,
                    lastCoalesceKey: null,
                    lastTimestamp: 0,
                  });
                  notify(t('Espacio anterior restaurado'));
                }}
                className="inline-flex h-8 items-center rounded-lg border border-line bg-ground px-2.5 font-semibold text-ink transition-colors hover:border-ink"
              >
                {t('Volver a mi espacio')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSavedBackup(null);
                  setStoragePaused(false);
                  notify(t('Enlace guardado en tu espacio'));
                }}
                className="inline-flex h-8 items-center rounded-lg bg-ink px-2.5 font-semibold text-ground transition-opacity hover:opacity-90"
              >
                {t('Guardar este en su lugar')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div id="workspace">
        {activeSection === 'palette' && (
          <PaletteBoard
            colors={state.colors}
            harmonyMode={state.harmonyMode}
            canUndo={canUndo}
            canRedo={canRedo}
            onHarmonyChange={(harmonyMode: HarmonyMode) =>
              commitState((prev) => ({ ...prev, harmonyMode }))
            }
            onGenerate={handleGeneratePalette}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onUpdateColor={handleUpdateColor}
            onToggleLock={handleToggleLock}
            onMoveColor={handleMoveColor}
            onApplyPreset={handleApplyPreset}
            onCopy={handleCopy}
            onContinue={() => navigate('studio')}
            contrast={contrastProps}
          />
        )}

        {activeSection === 'studio' && (
          <main className="flex flex-col lg:flex-row">
            <StudioSidebar
              state={state}
              onBrandNameChange={(brandName) =>
                commitState((prev) => ({ ...prev, brandName }), 'brand-name')
              }
              onUpdateColor={handleUpdateColor}
              onUpdateTypography={handleUpdateTypography}
              onApplyPairing={handleApplyPairing}
              onUpdateGeometry={handleUpdateGeometry}
              onRegenerateUnlocked={handleGeneratePalette}
              onOpenPalette={() => navigate('palette')}
            />
            <PreviewCanvas
              state={state}
              themeMode={themeMode}
              onThemeModeChange={setThemeMode}
              template={previewTemplate}
              onTemplateChange={setPreviewTemplate}
              platform={previewPlatform}
              onPlatformChange={setPreviewPlatform}
              onContinue={() => navigate('export')}
              contrast={contrastProps}
            />
          </main>
        )}

        {activeSection === 'export' && (
          <ExportPanel
            state={state}
            activeTab={activeExportTab}
            onTabChange={setActiveExportTab}
            onCopy={handleCopy}
            onShare={handleShareUrl}
            onBack={() => navigate('studio')}
          />
        )}
      </div>

      <Footer />

      <Toast toast={toast} />
    </div>
  );
}
