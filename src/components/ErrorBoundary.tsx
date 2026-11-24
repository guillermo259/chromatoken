import React from 'react';
import { LocaleContext } from '../i18n/LocaleProvider';
import { translator } from '../i18n/messages';

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  static contextType = LocaleContext;
  declare context: React.ContextType<typeof LocaleContext>;

  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  handleReset = () => {
    try {
      localStorage.removeItem('chromatoken_workspace_v1');
      localStorage.removeItem('chromatoken_contrast_level');
    } catch {
      // Ignore storage access errors
    }
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    window.location.reload();
  };

  render() {
    const t = translator(this.context);
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-ground px-6 text-ink">
          <div className="w-full max-w-md rounded-xl border border-line bg-sheet p-6">
            <h1 className="font-ui-display text-xl font-bold tracking-tight">
              {t('No pudimos cargar esta configuración')}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              {t('Los datos guardados o el enlace compartido contenían un formato incompleto. Puedes restablecer los valores por defecto sin perder el acceso a la herramienta.')}
            </p>
            <button
              type="button"
              onClick={this.handleReset}
              className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-ink px-4 text-sm font-semibold text-ground transition-opacity hover:opacity-90"
            >
              {t('Restablecer valores por defecto')}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
