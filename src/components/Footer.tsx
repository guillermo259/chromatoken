import React from 'react';

const AUTHORS = [
  { handle: 'guillermo259', url: 'https://github.com/guillermo259' },
  { handle: 'lorspi', url: 'https://github.com/lorspi' },
];

const linkClass =
  'rounded-sm text-ink-soft underline decoration-line underline-offset-[3px] transition-colors hover:text-ink hover:decoration-ink';

export const Footer: React.FC = () => (
  <footer className="border-t border-line px-4 py-5 sm:px-6">
    <div className="flex flex-col items-center justify-between gap-2 text-xs text-muted sm:flex-row">
      <p>
        Hecho por{' '}
        {AUTHORS.map((a, i) => (
          <React.Fragment key={a.handle}>
            {i > 0 && ' y '}
            <a href={a.url} target="_blank" rel="noopener noreferrer" className={linkClass}>
              @{a.handle}
            </a>
          </React.Fragment>
        ))}
      </p>
      <p>ChromaToken · Ejecución 100% en el navegador</p>
    </div>
  </footer>
);
