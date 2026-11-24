import { english } from './en';

export type Locale = 'es' | 'en';
export type Translate = (message: string, ...values: Array<string | number>) => string;

export const DEFAULT_LOCALE: Locale = 'es';

export function resolveLocale(languages: readonly string[]): Locale {
  for (const language of languages) {
    const base = language.toLowerCase().split('-')[0];
    if (base === 'en' || base === 'es') return base;
  }
  return DEFAULT_LOCALE;
}

export function translator(locale: Locale): Translate {
  return (message, ...values) => {
    const text = locale === 'en' && Object.hasOwn(english, message) ? english[message] : message;
    return text.replace(/\{(\d+)\}/g, (placeholder, index) => String(values[Number(index)] ?? placeholder));
  };
}

export const roleNames = {
  primary: 'Primario',
  secondary: 'Secundario',
  accent: 'Acento',
  neutral: 'Neutro',
} as const;
