import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ColorRole,
  ContrastLevel,
  DesignTokenState,
  ExportTab,
  GeometryConfig,
  HarmonyMode,
  PaletteColor,
  PreviewThemeMode,
  TypographyConfig,
  WorkspaceSection,
} from './types/tokens';
import { CURATED_PAIRINGS, injectGoogleFontsLink } from './data/googleFonts';
import { CURATED_PRESETS, generateHarmoniousPalette } from './utils/colorEngine';
import { decodeStateFromHash, encodeStateToHash } from './utils/tokenExporters';
import { auditContrast, enforceContrast } from './utils/contrastAudit';
import { TopBar } from './components/TopBar';
import { PaletteBoard } from './components/PaletteBoard';
import { StudioSidebar } from './components/StudioSidebar';
import { PreviewCanvas } from './components/PreviewCanvas';
import { ExportPanel } from './components/ExportPanel';
import { Toast } from './components/Toast';
import { Footer } from './components/Footer';

const STORAGE_KEY = 'chromatoken_workspace_v1';
const LEVEL_KEY = 'chromatoken_contrast_level';
const HISTORY_LIMIT = 30;

const DEFAULT_STATE: DesignTokenState = {
  brandName: 'Acme Studio',
  harmonyMode: 'curated',
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

function loadInitialState(): DesignTokenState {
  if (typeof window !== 'undefined') {
    const fromHash = decodeStateFromHash(window.location.hash);
    if (fromHash) return fromHash;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as DesignTokenState;
        if (parsed && Array.isArray(parsed.colors) && parsed.typography && parsed.geometry) {
          return parsed;
        }
      }
    } catch {
      // Ignore invalid localStorage payload
    }
  }
  return DEFAULT_STATE;
}

export default function App() {
  const [state, setState] = useState<DesignTokenState>(loadInitialState);
  const [activeSection, setActiveSection] = useState<WorkspaceSection>('palette');
  const [activeExportTab, setActiveExportTab] = useState<ExportTab>('css');
  const [themeMode, setThemeMode] = useState<PreviewThemeMode>('light');
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);
  const [contrastLevel, setContrastLevel] = useState<ContrastLevel>(() => {
    try {
      return localStorage.getItem(LEVEL_KEY) === 'AAA' ? 'AAA' : 'AA';
    } catch {
      return 'AA';
    }
  });
  const contrastReport = useMemo(
    () => auditContrast(state.colors, contrastLevel),
    [state.colors, contrastLevel]
  );

  // Undo/redo history for palette-level changes (generate, presets, reorder)
  const [history, setHistory] = useState<PaletteColor[][]>(() => [state.colors]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

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
    try {
      localStorage.setItem(LEVEL_KEY, contrastLevel);
    } catch {
      // Preference only; ignore storage errors
    }
  }, [contrastLevel]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage unavailable or full: the session still works in memory
    }
  }, [state]);

  const commitPalette = useCallback(
    (nextColors: PaletteColor[]) => {
      setState((prev) => ({ ...prev, colors: nextColors }));
      setHistory((prev) => [...prev.slice(0, historyIndex + 1), nextColors].slice(-HISTORY_LIMIT));
      setHistoryIndex((prev) => Math.min(prev + 1, HISTORY_LIMIT - 1));
    },
    [historyIndex]
  );

  const handleGeneratePalette = useCallback(() => {
    if (state.colors.every((c) => c.locked)) {
      notify('Todos los colores están bloqueados');
      return;
    }
    commitPalette(generateHarmoniousPalette(state.colors, state.harmonyMode));
  }, [state.colors, state.harmonyMode, commitPalette, notify]);

  const handleApplyContrastFix = useCallback(
    (role: ColorRole, hex: string) => {
      commitPalette(state.colors.map((c) => (c.role === role ? { ...c, hex } : c)));
      notify(`${role.charAt(0).toUpperCase()}${role.slice(1)} ajustado a ${hex}`);
    },
    [state.colors, commitPalette, notify]
  );

  const handleFixAllContrast = useCallback(() => {
    const next = enforceContrast(state.colors, contrastLevel);
    const changed = next.filter((c, i) => c.hex !== state.colors[i].hex).length;
    if (changed === 0) return;
    commitPalette(next);
    notify(changed === 1 ? '1 color ajustado' : `${changed} colores ajustados`);
  }, [state.colors, contrastLevel, commitPalette, notify]);

  const contrastProps = {
    report: contrastReport,
    onLevelChange: setContrastLevel,
    onApplyFix: handleApplyContrastFix,
    onFixAll: handleFixAllContrast,
  };

  const handleUndo = useCallback(() => {
    if (historyIndex <= 0) return;
    const nextIdx = historyIndex - 1;
    setHistoryIndex(nextIdx);
    setState((prev) => ({ ...prev, colors: history[nextIdx] }));
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    const nextIdx = historyIndex + 1;
    setHistoryIndex(nextIdx);
    setState((prev) => ({ ...prev, colors: history[nextIdx] }));
  }, [history, historyIndex]);

  const handleUpdateColor = useCallback((role: ColorRole, hex: string) => {
    setState((prev) => ({
      ...prev,
      colors: prev.colors.map((c) => (c.role === role ? { ...c, hex } : c)),
    }));
  }, []);

  const handleToggleLock = useCallback((role: ColorRole) => {
    setState((prev) => ({
      ...prev,
      colors: prev.colors.map((c) => (c.role === role ? { ...c, locked: !c.locked } : c)),
    }));
  }, []);

  /**
   * Roles are fixed slots (primary, secondary, accent, neutral). Dragging a swatch
   * from one slot to another moves the color value and its lock; the slots stay put.
   */
  const handleMoveColor = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex) return;
      const values = state.colors.map(({ hex, locked }) => ({ hex, locked }));
      const [moved] = values.splice(fromIndex, 1);
      values.splice(toIndex, 0, moved);
      commitPalette(state.colors.map((slot, i) => ({ ...slot, ...values[i] })));
    },
    [state.colors, commitPalette]
  );

  const handleApplyPreset = useCallback(
    (presetId: string) => {
      const preset = CURATED_PRESETS.find((p) => p.id === presetId);
      if (!preset) return;
      commitPalette(
        state.colors.map((c) => ({ ...c, hex: preset.colors[c.role], locked: false }))
      );
      notify(`Paleta «${preset.name}» aplicada`);
    },
    [state.colors, commitPalette, notify]
  );

  const handleUpdateTypography = useCallback((patch: Partial<TypographyConfig>) => {
    setState((prev) => ({ ...prev, typography: { ...prev.typography, ...patch } }));
  }, []);

  const handleApplyPairing = useCallback((pairingId: string) => {
    const pairing = CURATED_PAIRINGS.find((p) => p.id === pairingId);
    if (!pairing) return;
    setState((prev) => ({
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
  }, []);

  const handleUpdateGeometry = useCallback((patch: Partial<GeometryConfig>) => {
    setState((prev) => ({ ...prev, geometry: { ...prev.geometry, ...patch } }));
  }, []);

  const handleShareUrl = useCallback(async () => {
    const encoded = encodeStateToHash(state);
    if (!encoded) return;
    const shareUrl = `${window.location.origin}${window.location.pathname}#state=${encoded}`;
    window.history.replaceState(null, '', `#state=${encoded}`);
    try {
      await navigator.clipboard.writeText(shareUrl);
      notify('Enlace copiado. Quien lo abra verá esta misma configuración');
    } catch {
      notify('No se pudo copiar. El enlace quedó en la barra de direcciones');
    }
  }, [state, notify]);

  const handleCopy = useCallback(
    async (text: string, label?: string) => {
      try {
        await navigator.clipboard.writeText(text);
        notify(`${label ?? text} copiado`);
      } catch {
        notify('El navegador bloqueó el portapapeles');
      }
    },
    [notify]
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
        Saltar al área de trabajo
      </a>

      <TopBar
        colors={state.colors}
        activeSection={activeSection}
        onNavigate={navigate}
        onShare={handleShareUrl}
      />

      <div id="workspace">
        {activeSection === 'palette' && (
          <PaletteBoard
            colors={state.colors}
            harmonyMode={state.harmonyMode}
            canUndo={historyIndex > 0}
            canRedo={historyIndex < history.length - 1}
            onHarmonyChange={(mode: HarmonyMode) =>
              setState((prev) => ({ ...prev, harmonyMode: mode }))
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
              onBrandNameChange={(brandName) => setState((prev) => ({ ...prev, brandName }))}
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
