import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { LocaleProvider } from './i18n/LocaleProvider';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <LocaleProvider>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </LocaleProvider>
);
