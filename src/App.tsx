import { useCallback, useEffect, useState } from 'react';
import {
  ColorRole,
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
import { TopBar } from './components/TopBar';
import { CoolorsGenerator } from './components/CoolorsGenerator';
import { StudioSidebar } from './components/StudioSidebar';
import { PreviewCanvas } from './components/PreviewCanvas';

const STORAGE_KEY = 'chromatoken_workspace_v1';

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
  const [activeExportTab, setActiveExportTab] = useState<ExportTab>('visual');
  const [themeMode, setThemeMode] = useState<PreviewThemeMode>('light');

  // Undo/Redo palette history stack
  const [history, setHistory] = useState<PaletteColor[][]>(() => [state.colors]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Inject selected Google Fonts dynamically into document head
  useEffect(() => {
    injectGoogleFontsLink(
      state.typography.headingFont,
      state.typography.bodyFont,
      state.typography.monoFont
    );
  }, [
    state.typography.headingFont,
    state.typography.bodyFont,
    state.typography.monoFont,
  ]);

  // Persist workspace state locally
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage quota ignored
    }
  }, [state]);

  const commitPalette = useCallback(
    (nextColors: PaletteColor[]) => {
      setState((prev) => ({ ...prev, colors: nextColors }));
      setHistory((prev) => {
        const sliced = prev.slice(0, historyIndex + 1);
        return [...sliced, nextColors].slice(-30);
      });
      setHistoryIndex((prev) => Math.min(prev + 1, 29));
    },
    [historyIndex]
  );

  const handleGeneratePalette = useCallback(() => {
    const nextColors = generateHarmoniousPalette(state.colors, state.harmonyMode);
    commitPalette(nextColors);
  }, [state.colors, state.harmonyMode, commitPalette]);

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
      colors: prev.colors.map((c) =>
        c.role === role ? { ...c, locked: !c.locked } : c
      ),
    }));
  }, []);

  const handleSwapRoles = useCallback(
    (indexA: number, indexB: number) => {
      const next = state.colors.map((c) => ({ ...c }));
      const hexA = next[indexA].hex;
      const lockA = next[indexA].locked;
      next[indexA].hex = next[indexB].hex;
      next[indexA].locked = next[indexB].locked;
      next[indexB].hex = hexA;
      next[indexB].locked = lockA;
      commitPalette(next);
    },
    [state.colors, commitPalette]
  );

  const handleApplyPreset = useCallback(
    (presetId: string) => {
      const preset = CURATED_PRESETS.find((p) => p.id === presetId);
      if (!preset) return;
      const nextColors = state.colors.map((c) => ({
        ...c,
        hex: preset.colors[c.role],
        locked: false,
      }));
      commitPalette(nextColors);
    },
    [state.colors, commitPalette]
  );

  const handleUpdateTypography = useCallback((patch: Partial<TypographyConfig>) => {
    setState((prev) => ({
      ...prev,
      typography: { ...prev.typography, ...patch },
    }));
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
    setState((prev) => ({
      ...prev,
      geometry: { ...prev.geometry, ...patch },
    }));
  }, []);

  const handleShareUrl = useCallback(async (): Promise<boolean> => {
    const encoded = encodeStateToHash(state);
    if (!encoded) return false;
    const shareUrl = `${window.location.origin}${window.location.pathname}#state=${encoded}`;
    window.history.replaceState(null, '', `#state=${encoded}`);
    try {
      await navigator.clipboard.writeText(shareUrl);
      return true;
    } catch {
      return false;
    }
  }, [state]);

  const handleNavigate = (section: WorkspaceSection) => {
    setActiveSection(section);
    if (section === 'studio') {
      setActiveExportTab('visual');
    } else if (section === 'export') {
      if (activeExportTab === 'visual') {
        setActiveExportTab('css');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-slate-900">
      <TopBar
        activeSection={activeSection}
        onNavigate={handleNavigate}
        onExportClick={() => {
          setActiveSection('export');
          setActiveExportTab('css');
        }}
      />

      {/* Mobile section switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-2 md:hidden">
        {(
          [
            { id: 'palette', label: '1. Paleta' },
            { id: 'studio', label: '2. Tipografía y UI' },
            { id: 'export', label: '3. Exportar' },
          ] as Array<{ id: WorkspaceSection; label: string }>
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => handleNavigate(item.id)}
            className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
              activeSection === item.id
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {activeSection === 'palette' ? (
        <CoolorsGenerator
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
          onSwapRoles={handleSwapRoles}
          onApplyPreset={handleApplyPreset}
          onContinueToStudio={() => handleNavigate('studio')}
        />
      ) : (
        <main className="flex flex-col lg:flex-row">
          <StudioSidebar
            state={state}
            onBrandNameChange={(brandName) =>
              setState((prev) => ({ ...prev, brandName }))
            }
            onUpdateColor={handleUpdateColor}
            onUpdateTypography={handleUpdateTypography}
            onApplyPairing={handleApplyPairing}
            onUpdateGeometry={handleUpdateGeometry}
            onRegenerateUnlocked={handleGeneratePalette}
            onOpenCoolors={() => setActiveSection('palette')}
            onShareUrl={handleShareUrl}
          />
          <PreviewCanvas
            state={state}
            activeTab={activeExportTab}
            themeMode={themeMode}
            onTabChange={(tab) => {
              setActiveExportTab(tab);
              setActiveSection(tab === 'visual' ? 'studio' : 'export');
            }}
            onThemeModeChange={setThemeMode}
          />
        </main>
      )}
    </div>
  );
}
