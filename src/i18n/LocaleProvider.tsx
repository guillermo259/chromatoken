import { createContext, Fragment, useContext, useEffect, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import { DEFAULT_LOCALE, resolveLocale, translator } from './messages';
import type { Locale } from './messages';

export const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

const translators = {
  es: translator('es'),
  en: translator('en'),
};

export function useLocale() {
  return useContext(LocaleContext);
}

export function useTranslation() {
  return translators[useLocale()];
}

export function richMessage(message: string, ...values: ReactNode[]) {
  return message.split(/(\{\d+\})/).map((part, index) =>
    index % 2 === 0 ? part : <Fragment key={index}>{values[Number(part.slice(1, -1))]}</Fragment>
  );
}

function getBrowserLocale() {
  return resolveLocale([navigator.language, ...(navigator.languages ?? [])]);
}

function subscribe(onChange: () => void) {
  window.addEventListener('languagechange', onChange);
  return () => window.removeEventListener('languagechange', onChange);
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(subscribe, getBrowserLocale, () => DEFAULT_LOCALE);

  useEffect(() => {
    const t = translators[locale];
    document.documentElement.lang = locale;
    document.title = t('ChromaToken · De una paleta a un sistema de diseño');
    document.querySelector('meta[name="description"]')?.setAttribute(
      'content',
      t('Genera paletas en OKLCH, valida el contraste WCAG en claro y oscuro, define tipografía y forma, y exporta tus design tokens a CSS, Tailwind v4, JSON, Markdown, variables de Figma y Tokens Studio.')
    );
  }, [locale]);

  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}
