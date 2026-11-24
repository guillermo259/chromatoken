import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, ChevronDown, Lock, ShieldAlert, ShieldCheck, Wand2, X } from 'lucide-react';
import { ColorRole, ContrastLevel, PaletteColor } from '../types/tokens';
import { ROLE_LABELS } from '../utils/colorEngine';
import { ContrastCheck, ContrastReport, formatRatio, MODE_LABELS } from '../utils/contrastAudit';

interface ContrastPanelProps {
  report: ContrastReport;
  colors: PaletteColor[];
  open: boolean;
  focusRole?: ColorRole | null;
  onOpenChange: (open: boolean) => void;
  onLevelChange: (level: ContrastLevel) => void;
  onApplyFix: (role: ColorRole, hex: string) => void;
  onFixAll: () => void;
  /** Tailwind classes that anchor the panel horizontally from the sm breakpoint up */
  placement?: string;
}

const ROLE_ORDER: ColorRole[] = ['primary', 'secondary', 'accent', 'neutral'];

const PairSample: React.FC<{ check: ContrastCheck }> = ({ check }) => (
  <span
    aria-hidden="true"
    className="flex h-9 w-12 shrink-0 items-center justify-center rounded-md ring-1 ring-black/10"
    style={{ backgroundColor: check.bg }}
  >
    {check.kind === 'text' ? (
      <span className="font-ui-display text-[15px] font-bold" style={{ color: check.fg }}>
        Aa
      </span>
    ) : (
      <span className="h-4 w-4 rounded-full" style={{ boxShadow: `0 0 0 2.5px ${check.fg}` }} />
    )}
  </span>
);

const CheckRow: React.FC<{ check: ContrastCheck }> = ({ check }) => (
  <li className="flex items-center gap-3 py-2">
    <PairSample check={check} />
    <div className="min-w-0 flex-1">
      <p className="text-[13px] font-medium leading-snug text-ink">{check.label}</p>
      <p className="mt-0.5 text-xs text-muted">
        Modo {MODE_LABELS[check.mode].toLowerCase()} · {check.kind === 'text' ? 'texto' : 'elemento de interfaz'}
      </p>
    </div>
    <div className="shrink-0 text-right">
      <p className={`font-ui-mono text-[13px] font-semibold ${check.passes ? 'text-ink' : 'text-signal-ink'}`}>
        {formatRatio(check.ratio)}
      </p>
      <p className="font-ui-mono text-[11px] text-muted">mín. {check.required}</p>
    </div>
  </li>
);

/** Toolbar indicator. Shows the pass count and opens the panel. */
export const ContrastIndicator: React.FC<{
  report: ContrastReport;
  open: boolean;
  onClick: () => void;
}> = ({ report, open, onClick }) => {
  const ok = report.failures.length === 0;
  return (
    <button
      type="button"
      onClick={onClick}
      data-contrast-trigger=""
      aria-expanded={open}
      aria-haspopup="dialog"
      title={`${report.passed} de ${report.total} combinaciones cumplen WCAG ${report.level}`}
      className={`inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-[13px] font-semibold transition-colors ${
        ok ? 'border-line bg-sheet hover:border-ink' : 'border-signal/60 bg-signal/10 hover:border-signal'
      }`}
    >
      {ok ? (
        <ShieldCheck className="h-4 w-4 text-ink" />
      ) : (
        <ShieldAlert className="h-4 w-4 text-signal-ink" />
      )}
      Contraste
      <span className={`font-ui-mono text-xs ${ok ? 'text-muted' : 'text-signal-ink'}`}>
        {report.passed}/{report.total}
      </span>
    </button>
  );
};

/** Per-role badge used on palette cards. Renders nothing when the role is clean. */
export const RoleContrastBadge: React.FC<{
  report: ContrastReport;
  role: ColorRole;
  onClick: () => void;
}> = ({ report, role, onClick }) => {
  const count = report.failures.filter((f) => f.role === role).length;
  if (count === 0) {
    return (
      <span
        className="inline-flex items-center gap-1 text-[11px] font-medium text-muted"
        title={`Todas las combinaciones de ${ROLE_LABELS[role]} cumplen WCAG ${report.level}`}
      >
        <Check className="h-3 w-3" /> {report.level}
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      data-contrast-trigger=""
      className="inline-flex items-center gap-1 rounded-md bg-signal/12 px-1.5 py-0.5 text-[11px] font-semibold text-signal-ink transition-colors hover:bg-signal/20"
    >
      <ShieldAlert className="h-3 w-3" />
      {count} {count === 1 ? 'aviso' : 'avisos'}
    </button>
  );
};

export const ContrastPanel: React.FC<ContrastPanelProps> = ({
  report,
  colors,
  open,
  focusRole,
  onOpenChange,
  onLevelChange,
  onApplyFix,
  onFixAll,
  placement = 'sm:right-0',
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [showPassing, setShowPassing] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (ref.current?.contains(target) || target.closest('[data-contrast-trigger]')) return;
      onOpenChange(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    document.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) return;
    const target = focusRole ? ref.current?.querySelector(`[data-role-group="${focusRole}"]`) : null;
    (target as HTMLElement | null)?.scrollIntoView({ block: 'nearest' });
    ref.current?.focus();
  }, [open, focusRole]);

  if (!open) return null;

  const locked = new Set(colors.filter((c) => c.locked).map((c) => c.role));
  const fixableUnlocked = ROLE_ORDER.filter((r) => report.fixes[r] && !locked.has(r));
  const lockedWithIssues = report.failingRoles.filter((r) => locked.has(r));
  const passing = report.checks.filter((c) => c.passes);

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="Validación de contraste"
      tabIndex={-1}
      className={`animate-pop-in fixed inset-x-3 bottom-3 z-40 flex max-h-[75vh] flex-col rounded-xl border border-line bg-sheet text-ink shadow-[0_24px_60px_-20px_rgba(22,22,20,0.45)] focus:outline-none sm:absolute sm:inset-x-auto sm:bottom-auto sm:top-11 sm:w-[420px] ${placement}`}
    >
      <div className="flex items-start justify-between gap-3 border-b border-line-soft p-4">
        <div>
          <h2 className="font-ui-display text-[15px] font-extrabold tracking-[-0.01em]">Contraste</h2>
          <p className="mt-0.5 text-[13px] text-ink-soft">
            {report.passed} de {report.total} combinaciones cumplen WCAG {report.level}, en modo claro y oscuro.
          </p>
        </div>
        <div className="flex items-center gap-1">
          <div role="radiogroup" aria-label="Nivel WCAG" className="flex rounded-lg bg-line-soft p-0.5">
            {(['AA', 'AAA'] as ContrastLevel[]).map((lvl) => (
              <button
                key={lvl}
                type="button"
                role="radio"
                aria-checked={report.level === lvl}
                onClick={() => onLevelChange(lvl)}
                title={lvl === 'AA' ? 'Texto 4.5:1, interfaz 3:1' : 'Texto 7:1, interfaz 3:1'}
                className={`h-7 rounded-md px-2.5 text-xs font-semibold ${
                  report.level === lvl ? 'bg-sheet shadow-[0_1px_2px_rgba(22,22,20,0.12)]' : 'text-muted hover:text-ink'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Cerrar"
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-line-soft hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="overflow-y-auto p-4">
        {report.failures.length === 0 ? (
          <div className="flex items-center gap-3 rounded-lg bg-panel p-3">
            <ShieldCheck className="h-5 w-5 shrink-0" />
            <p className="text-[13px] leading-snug">
              Todo cumple con el nivel {report.level} tanto en modo claro como oscuro.
            </p>
          </div>
        ) : (
          <>
            {fixableUnlocked.length > 0 && (
              <button
                type="button"
                onClick={onFixAll}
                className="mb-1 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-ink text-sm font-semibold text-ground transition-transform active:scale-[0.98]"
              >
                <Wand2 className="h-4 w-4" />
                Corregir {fixableUnlocked.length === 1 ? '1 color' : `${fixableUnlocked.length} colores`}
              </button>
            )}
            {lockedWithIssues.length > 0 && (
              <p className="mb-1 mt-2 flex items-start gap-1.5 text-xs leading-snug text-muted">
                <Lock className="mt-0.5 h-3 w-3 shrink-0" />
                Los colores bloqueados no se corrigen en bloque. Puedes corregirlos uno a uno abajo.
              </p>
            )}

            {ROLE_ORDER.filter((r) => report.failingRoles.includes(r)).map((role) => {
              const fix = report.fixes[role];
              const items = report.failures.filter((f) => f.role === role);
              return (
                <section
                  key={role}
                  data-role-group={role}
                  className={`mt-4 rounded-lg ${focusRole === role ? 'bg-panel p-2 -mx-2' : ''}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="flex items-center gap-1.5 text-[13px] font-bold">
                      {ROLE_LABELS[role]}
                      {locked.has(role) && <Lock className="h-3 w-3 text-muted" aria-label="bloqueado" />}
                    </h3>
                    {fix ? (
                      <button
                        type="button"
                        onClick={() => onApplyFix(role, fix.to)}
                        title={
                          fix.complete
                            ? 'Ajusta solo la luminosidad hasta cumplir'
                            : 'Mejora el contraste, pero no resuelve todas las combinaciones'
                        }
                        className="group inline-flex h-8 items-center gap-1.5 rounded-lg border border-line px-2 text-xs font-semibold transition-colors hover:border-ink"
                      >
                        <span className="h-3.5 w-3.5 rounded-sm ring-1 ring-black/10" style={{ backgroundColor: fix.from }} />
                        <ArrowRight className="h-3 w-3 text-muted" />
                        <span className="h-3.5 w-3.5 rounded-sm ring-1 ring-black/10" style={{ backgroundColor: fix.to }} />
                        <span className="font-ui-mono">{fix.to}</span>
                        {fix.complete ? 'Corregir' : 'Mejorar'}
                      </button>
                    ) : (
                      <span className="text-xs text-muted">Sin ajuste automático</span>
                    )}
                  </div>
                  <ul className="divide-y divide-line-soft">
                    {items.map((check) => (
                      <CheckRow key={check.key} check={check} />
                    ))}
                  </ul>
                </section>
              );
            })}
          </>
        )}

        {passing.length > 0 && (
          <div className="mt-4 border-t border-line-soft pt-3">
            <button
              type="button"
              onClick={() => setShowPassing((v) => !v)}
              aria-expanded={showPassing}
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-soft hover:text-ink"
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${showPassing ? 'rotate-180' : ''}`} />
              {showPassing ? 'Ocultar' : 'Ver'} las {passing.length} que cumplen
            </button>
            {showPassing && (
              <ul className="mt-1 divide-y divide-line-soft">
                {passing.map((check) => (
                  <CheckRow key={check.key} check={check} />
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export interface ContrastControls {
  report: ContrastReport;
  onLevelChange: (level: ContrastLevel) => void;
  onApplyFix: (role: ColorRole, hex: string) => void;
  onFixAll: () => void;
}

/** Indicator button plus its panel, positioned under the button on desktop. */
export const ContrastMenu: React.FC<{
  contrast: ContrastControls;
  colors: PaletteColor[];
  open: boolean;
  focusRole?: ColorRole | null;
  onOpenChange: (open: boolean) => void;
  placement?: string;
}> = ({ contrast, colors, open, focusRole, onOpenChange, placement }) => (
  <div className="relative">
    <ContrastIndicator report={contrast.report} open={open} onClick={() => onOpenChange(!open)} />
    <ContrastPanel
      report={contrast.report}
      colors={colors}
      open={open}
      focusRole={focusRole}
      onOpenChange={onOpenChange}
      onLevelChange={contrast.onLevelChange}
      onApplyFix={contrast.onApplyFix}
      onFixAll={contrast.onFixAll}
      placement={placement}
    />
  </div>
);
