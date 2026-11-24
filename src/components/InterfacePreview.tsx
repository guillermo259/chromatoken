import { useId, useMemo, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import {
  ArrowDownLeft, ArrowRight, ArrowUpRight, BatteryFull, Bookmark, BookOpen,
  ChartNoAxesColumnIncreasing, ChevronRight, CreditCard, Globe, House, Layers3,
  LayoutDashboard, LayoutTemplate, Maximize2, Moon, Search, Settings, ShoppingBag,
  Smartphone, Sparkles, Sun, Users, Wallet, Wifi, X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ColorRole, DesignTokenState } from '../types/tokens';
import { buildAllScales, deriveSemanticTheme } from '../utils/colorEngine';
import { getElevationShadows, getRadiusScale, getTypeScale } from '../utils/tokenExporters';
import './InterfacePreview.css';
import { useLocale, useTranslation } from '../i18n/LocaleProvider';
import type { Locale } from '../i18n/messages';

export const PREVIEW_TEMPLATES = [
  { id: 'components', label: 'Componentes', icon: Layers3 },
  { id: 'landing', label: 'Landing', icon: LayoutTemplate },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'finance', label: 'Finanzas', icon: Wallet },
  { id: 'blog', label: 'Blog', icon: BookOpen },
  { id: 'shop', label: 'Ecommerce', icon: ShoppingBag },
  { id: 'onboarding', label: 'Onboarding', icon: Smartphone },
] as const;

export type PreviewTemplate = (typeof PREVIEW_TEMPLATES)[number]['id'];
export type PreviewPlatform = 'web' | 'app';
type InterfaceTemplate = Exclude<PreviewTemplate, 'components'>;

const DASHBOARD_METRICS = [
  { label: 'Ingresos', value: 24850, style: 'currency', change: 0.124 },
  { label: 'Usuarios', value: 1482, style: 'decimal', change: 0.082 },
  { label: 'Conversión', value: 0.048, style: 'percent', change: 0.6 },
] as const;
const DASHBOARD_MENU = [
  { label: 'Resumen', icon: House },
  { label: 'Informes', icon: ChartNoAxesColumnIncreasing },
  { label: 'Equipo', icon: Users },
  { label: 'Ajustes', icon: Settings },
];
const DASHBOARD_MONTHS = [
  { label: 'Ene', current: 42, previous: 25 },
  { label: 'Feb', current: 61, previous: 37 },
  { label: 'Mar', current: 52, previous: 43 },
  { label: 'Abr', current: 79, previous: 51 },
  { label: 'May', current: 68, previous: 57 },
  { label: 'Jun', current: 93, previous: 70 },
];
const TRANSACTIONS = [
  { label: 'Estudio Norte', date: 'Hoy', amount: 1240, icon: ArrowDownLeft },
  { label: 'Suscripción', date: 'Ayer', amount: -24, icon: CreditCard },
  { label: 'Pago de servicios', date: '22 oct', amount: -92.5, icon: ArrowUpRight },
];
const PRODUCTS = [
  { name: 'Bolso Ágil', price: '$38', shape: 'bag' },
  { name: 'Vaso Duna', price: '$24', shape: 'cup' },
  { name: 'Lámpara Alba', price: '$68', shape: 'lamp' },
];

function formatMoney(locale: Locale, amount: number, decimals: number, signed = false) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    signDisplay: signed ? 'exceptZero' : 'auto',
  }).format(amount);
}

function formatChange(locale: Locale, value: number, style: 'decimal' | 'percent') {
  return new Intl.NumberFormat(locale, { style, signDisplay: 'always', maximumFractionDigits: 1 }).format(value);
}

function Brand({ name }: { name: string }) {
  return (
    <span className="mock-brand">
      <span className="mock-brand-icon"><Layers3 size={14} aria-hidden="true" /></span>
      <span>{name}</span>
    </span>
  );
}

function RevenueChart() {
  const t = useTranslation();
  return (
    <section className="mock-card">
      <h4>{t('Ingresos por mes')}</h4>
      <div className="mock-bars" role="img" aria-label={t('Los ingresos de junio superan a los de enero y a los de junio del periodo anterior')}>
        {DASHBOARD_MONTHS.map(({ label, current, previous }) => (
          <div key={label}>
            <span><i style={{ height: current + '%' }} /><i style={{ height: previous + '%' }} /></span>
            <small>{t(label)}</small>
          </div>
        ))}
      </div>
      <div className="mock-chart-legend"><span>{t('Actual')}</span><span>{t('Anterior')}</span></div>
    </section>
  );
}

function Balance() {
  const t = useTranslation();
  const locale = useLocale();
  return (
    <div className="mock-balance">
      <span>{t('Saldo disponible')}</span>
      <strong>{formatMoney(locale, 8420.5, 2)}</strong>
      <span><span className="mock-balance-chip">USD</span>{' '}{t('Cuenta principal')}</span>
    </div>
  );
}

function TransferActions() {
  const t = useTranslation();
  return (
    <div className="mock-finance-actions">
      <span className="mock-button"><ArrowUpRight size={14} aria-hidden="true" />{' '}{t('Enviar')}</span>
      <span className="mock-button mock-button-outline"><ArrowDownLeft size={14} aria-hidden="true" />{' '}{t('Recibir')}</span>
    </div>
  );
}

function RecentTransactions() {
  const t = useTranslation();
  const locale = useLocale();
  return (
    <section className="mock-card">
      <h4>{t('Actividad reciente')}</h4>
      <ul className="mock-transactions">
        {TRANSACTIONS.map(({ label, date, amount, icon: Icon }) => (
          <li key={label}>
            <span className="mock-item-icon"><Icon size={15} aria-hidden="true" /></span>
            <span><strong>{t(label)}</strong><small>{t(date)}</small></span>
            <b>{formatMoney(locale, amount, 2, true)}</b>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ProductCards({ limit }: { limit?: number }) {
  const t = useTranslation();
  return (
    <div className="mock-products">
      {PRODUCTS.slice(0, limit).map(({ name, price, shape }) => (
        <div key={shape} className="mock-product">
          <div className={`mock-product-art mock-product-art--${shape}`} aria-hidden="true"><i /></div>
          <div><h4>{t(name)}</h4><span>{price}</span></div>
        </div>
      ))}
    </div>
  );
}

function OnboardingStep({ isApp = false }: { isApp?: boolean }) {
  const t = useTranslation();
  const Heading = isApp ? 'h3' : 'h4';
  return (
    <>
      <div className="mock-phone-art" aria-hidden="true"><Sparkles strokeWidth={1.4} /></div>
      <p className="mock-kicker">{t('Paso 1 de 3')}</p>
      <Heading>{t('Tu día, a tu manera')}</Heading>
      <p className="mock-description">{t('Empieza creando una rutina que se adapte a ti.')}</p>
      <div className="mock-phone-progress" aria-hidden="true"><i /><i /><i /></div>
      <span className="mock-button">{t('Continuar')}{' '}<ChevronRight size={14} aria-hidden="true" /></span>
    </>
  );
}

function Landing({ brand }: { brand: string }) {
  const t = useTranslation();
  return (
    <div className="mock-site mock-landing">
      <header className="mock-header">
        <Brand name={brand} />
        <span className="mock-nav">{t('Cursos')}{' '}<span>{t('Comunidad')}</span></span>
        <span className="mock-button mock-button-outline">{t('Ver cursos')}</span>
      </header>
      <div className="mock-landing-hero">
        <div>
          <p className="mock-kicker">{t('Cursos de diseño')}</p>
          <h3 className="mock-display">{t('Diseña con intención.')}</h3>
          <p className="mock-description">{t('Aprende a convertir tus ideas en experiencias que resuelvan problemas reales.')}</p>
          <span className="mock-button">{t('Explorar cursos')}{' '}<ArrowUpRight size={14} aria-hidden="true" /></span>
        </div>
        <div className="mock-landing-art" aria-hidden="true">
          <i /><i /><i /><i /><i /><i />
        </div>
      </div>
      <div className="mock-landing-stats">
        <span><strong>24</strong>{' '}{t('Cursos')}</span>
        <span><strong>12</strong>{' '}{t('Mentores')}</span>
        <span><strong>{t('1,2 mil')}</strong>{' '}{t('Estudiantes')}</span>
      </div>
    </div>
  );
}

function Dashboard({ brand }: { brand: string }) {
  const t = useTranslation();
  const locale = useLocale();
  return (
    <div className="mock-dashboard">
      <aside className="mock-dashboard-rail">
        <Brand name={brand} />
        <ul aria-label={t('Menú de ejemplo')}>
          {DASHBOARD_MENU.map(({ label, icon: Icon }) => (
            <li key={label}><Icon size={15} aria-hidden="true" /><span>{t(label)}</span></li>
          ))}
        </ul>
      </aside>
      <div className="mock-dashboard-body">
        <header className="mock-section-header">
          <h3>{t('Resumen de actividad')}</h3>
          <span className="mock-tag">{t('Últimos 6 meses')}</span>
        </header>
        <div className="mock-metrics">
          {DASHBOARD_METRICS.map(({ label, value, style, change }) => (
            <div className="mock-metric" key={label}>
              <span>{t(label)}</span>
              <strong>{style === 'currency' ? formatMoney(locale, value, 0) : value.toLocaleString(locale, { style, maximumFractionDigits: 1 })}</strong>
              <small>{style === 'percent' ? `${formatChange(locale, change, 'decimal')} pp` : formatChange(locale, change, 'percent')}</small>
            </div>
          ))}
        </div>
        <div className="mock-dashboard-charts">
          <RevenueChart />
          <section className="mock-card">
            <h4>{t('Fuentes de tráfico')}</h4>
            <div className="mock-donut" role="img" aria-label={t('Tráfico directo 62 %, búsqueda 24 % y referidos 14 %')}>
              <strong aria-hidden="true">62 %</strong>
            </div>
            <div className="mock-chart-legend"><span>{t('Directo')}</span><span>{t('Búsqueda')}</span><span>{t('Referidos')}</span></div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Finance({ brand }: { brand: string }) {
  const t = useTranslation();
  return (
    <div className="mock-site">
      <header className="mock-header">
        <Brand name={brand} />
        <span className="mock-nav">{t('Cuentas')}{' '}<span>{t('Movimientos')}</span></span>
        <span className="mock-button mock-button-outline"><CreditCard size={14} aria-hidden="true" />{' '}{t('Mis tarjetas')}</span>
      </header>
      <div className="mock-finance">
        <div>
          <h3>{t('Mis finanzas')}</h3>
          <Balance />
          <TransferActions />
        </div>
        <RecentTransactions />
      </div>
    </div>
  );
}

function Blog({ brand }: { brand: string }) {
  const t = useTranslation();
  return (
    <div className="mock-site">
      <header className="mock-header">
        <Brand name={brand} />
        <span className="mock-nav">{t('Artículos')}{' '}<span>{t('Archivo')}</span></span>
        <span className="mock-button">{t('Suscribirme')}</span>
      </header>
      <div className="mock-blog-feature">
        <div className="mock-blog-art" aria-hidden="true"><i /><i /><i /></div>
        <div className="mock-blog-copy">
          <p className="mock-kicker">{t('Ideas y procesos')}</p>
          <h3 className="mock-display">{t('El color que cuenta una historia.')}</h3>
          <p className="mock-description">{t('Cómo elegir una paleta que comunique lo que tu marca quiere decir.')}</p>
          <span className="mock-read-more">{t('Leer artículo')}{' '}<ArrowRight size={14} aria-hidden="true" /></span>
        </div>
      </div>
      <div className="mock-blog-index">
        <div><p className="mock-kicker">{t('Tipografía')}</p><h4>{t('El ritmo de una buena lectura')}</h4></div>
        <div><p className="mock-kicker">{t('Proceso')}</p><h4>{t('Del boceto al sistema')}</h4></div>
      </div>
    </div>
  );
}

function Shop({ brand }: { brand: string }) {
  const t = useTranslation();
  return (
    <div className="mock-site">
      <header className="mock-header">
        <Brand name={brand} />
        <span className="mock-nav">{t('Tienda')}{' '}<span>{t('Colecciones')}</span></span>
        <span className="mock-button mock-button-outline"><ShoppingBag size={14} aria-hidden="true" />{' '}{t('Bolsa (0)')}</span>
      </header>
      <div className="mock-shop-heading">
        <div>
          <p className="mock-kicker">{t('Colección Esenciales')}</p>
          <h3 className="mock-display">{t('Objetos para el día a día.')}</h3>
        </div>
        <span className="mock-button">{t('Ver colección')}{' '}<ArrowUpRight size={14} aria-hidden="true" /></span>
      </div>
      <ProductCards />
    </div>
  );
}

function Onboarding({ brand }: { brand: string }) {
  const t = useTranslation();
  return (
    <div className="mock-onboarding">
      <div className="mock-onboarding-intro">
        <Brand name={brand} />
        <div>
          <h3 className="mock-display">{t('Encuentra tu ritmo.')}</h3>
          <p className="mock-description">{t('Una app para organizar tu día y hacer espacio para lo que importa.')}</p>
        </div>
      </div>
      <div className="mock-phone">
        <span className="mock-phone-camera" aria-hidden="true" />
        <OnboardingStep />
      </div>
    </div>
  );
}

interface AppDestination {
  label: string;
  icon: LucideIcon;
}

const APP_DESTINATIONS: Record<Exclude<InterfaceTemplate, 'onboarding'>, AppDestination[]> = {
  landing: [{ label: 'Inicio', icon: House }, { label: 'Mis cursos', icon: BookOpen }, { label: 'Perfil', icon: Users }],
  dashboard: DASHBOARD_MENU.slice(0, 3),
  finance: [{ label: 'Inicio', icon: House }, { label: 'Tarjetas', icon: CreditCard }, { label: 'Actividad', icon: ChartNoAxesColumnIncreasing }],
  blog: [{ label: 'Lecturas', icon: BookOpen }, { label: 'Explorar', icon: Search }, { label: 'Guardados', icon: Bookmark }],
  shop: [{ label: 'Tienda', icon: House }, { label: 'Buscar', icon: Search }, { label: 'Bolsa', icon: ShoppingBag }],
};

function AppFrame({ brand, destinations, children }: {
  brand: string;
  destinations?: AppDestination[];
  children: ReactNode;
}) {
  const t = useTranslation();
  return (
    <div className="mock-frame mock-app-frame">
      <div className="mock-app-status" aria-hidden="true">
        <span>9:41</span><i /><span><Wifi size={13} /><BatteryFull size={15} /></span>
      </div>
      <div className="mock-app-top"><Brand name={brand} /></div>
      <div className="mock-app-content">{children}</div>
      {destinations && (
        <ul className="mock-app-nav" aria-label={t('Navegación de ejemplo')}>
          {destinations.map(({ label, icon: Icon }) => (
            <li key={label}><span><Icon size={16} aria-hidden="true" /></span>{t(label)}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function LandingApp() {
  const t = useTranslation();
  return (
    <div className="mock-app-screen">
      <h3>{t('Aprende diseño')}</h3>
      <section className="mock-app-banner">
        <span className="mock-app-badge">{t('Nuevo curso')}</span>
        <h4>{t('Diseña con intención')}</h4>
        <p>{t('De la primera idea a tu primer prototipo.')}</p>
        <span className="mock-button">{t('Empezar')}{' '}<ArrowRight size={14} aria-hidden="true" /></span>
      </section>
      <section className="mock-card mock-app-row">
        <span className="mock-item-icon"><BookOpen size={15} aria-hidden="true" /></span>
        <div><h4>{t('Fundamentos del color')}</h4><small>{t('3 de 8 lecciones')}</small></div>
      </section>
      <section className="mock-card mock-app-row">
        <span className="mock-item-icon"><Layers3 size={15} aria-hidden="true" /></span>
        <div><h4>{t('Diseño de interfaces')}</h4><small>{t('1 de 6 lecciones')}</small></div>
      </section>
    </div>
  );
}

function DashboardApp() {
  const t = useTranslation();
  const locale = useLocale();
  const [income] = DASHBOARD_METRICS;
  return (
    <div className="mock-app-screen">
      <h3>{t('Resumen de actividad')}</h3>
      <section className="mock-app-banner">
        <h4>{t('Ingresos del mes')}</h4>
        <strong className="mock-app-total">{formatMoney(locale, income.value, 0)}</strong>
        <span className="mock-app-badge">{formatChange(locale, income.change, 'percent')}</span>
      </section>
      <RevenueChart />
    </div>
  );
}

function FinanceApp() {
  const t = useTranslation();
  return (
    <div className="mock-app-screen">
      <h3>{t('Mis finanzas')}</h3>
      <Balance />
      <TransferActions />
      <RecentTransactions />
    </div>
  );
}

function BlogApp() {
  const t = useTranslation();
  return (
    <div className="mock-app-screen">
      <h3>{t('Para leer hoy')}</h3>
      <article className="mock-app-article">
        <div className="mock-blog-art" aria-hidden="true"><i /><i /><i /></div>
        <p className="mock-kicker">{t('Ideas y procesos · 5 min')}</p>
        <h4>{t('El color que cuenta una historia')}</h4>
        <span className="mock-button">{t('Leer artículo')}{' '}<ArrowRight size={14} aria-hidden="true" /></span>
      </article>
      <section className="mock-card mock-app-row">
        <span className="mock-item-icon"><Bookmark size={15} aria-hidden="true" /></span>
        <div><h4>{t('El ritmo de una buena lectura')}</h4><small>{t('Tipografía · 4 min')}</small></div>
      </section>
    </div>
  );
}

function ShopApp() {
  const t = useTranslation();
  return (
    <div className="mock-app-screen">
      <h3>{t('Tienda')}</h3>
      <div className="mock-app-search"><Search size={15} aria-hidden="true" />{' '}{t('Buscar productos')}</div>
      <section className="mock-app-screen">
        <h4>{t('Colección Esenciales')}</h4>
        <ProductCards limit={2} />
      </section>
      <span className="mock-button">{t('Ver colección')}{' '}<ArrowRight size={14} aria-hidden="true" /></span>
    </div>
  );
}

function OnboardingApp() {
  return <div className="mock-app-onboarding"><OnboardingStep isApp /></div>;
}

const TEMPLATE_CONTENT = {
  landing: { web: Landing, app: LandingApp },
  dashboard: { web: Dashboard, app: DashboardApp },
  finance: { web: Finance, app: FinanceApp },
  blog: { web: Blog, app: BlogApp },
  shop: { web: Shop, app: ShopApp },
  onboarding: { web: Onboarding, app: OnboardingApp },
};

interface InterfacePreviewProps {
  state: DesignTokenState;
  mode: 'light' | 'dark';
  template: InterfaceTemplate;
  platform: PreviewPlatform;
}

export function InterfacePreview({ state, mode, template, platform }: InterfacePreviewProps) {
  const t = useTranslation();
  const { colors, contrastLevel, geometry, typography } = state;
  const label = PREVIEW_TEMPLATES.find((item) => item.id === template)?.label ?? '';
  const modeLabel = mode === 'light' ? t('Modo claro') : t('Modo oscuro');
  const ModeIcon = mode === 'light' ? Sun : Moon;
  const { web: WebMockup, app: AppMockup } = TEMPLATE_CONTENT[template];
  const isApp = platform === 'app';
  const brand = state.brandName || t('Mi marca');
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [expanded, setExpanded] = useState(false);
  const dialogTitle = useId();

  const theme = useMemo(() => {
    const raw = Object.fromEntries(colors.map(({ role, hex }) => [role, hex])) as Record<ColorRole, string>;
    return deriveSemanticTheme(buildAllScales(colors), raw, mode, contrastLevel);
  }, [colors, mode, contrastLevel]);

  const radii = getRadiusScale(geometry.radiusBase);
  const typeScale = getTypeScale(typography.baseSize, typography.scaleRatio);
  const style = {
    '--mock-canvas': theme.canvas,
    '--mock-surface': theme.surface,
    '--mock-muted': theme.surfaceMuted,
    '--mock-border': theme.border,
    '--mock-text': theme.text,
    '--mock-text-soft': theme.textSecondary,
    '--mock-primary': theme.primary,
    '--mock-on-primary': theme.onPrimary,
    '--mock-secondary': theme.secondary,
    '--mock-on-secondary': theme.onSecondary,
    '--mock-accent': theme.accent,
    '--mock-on-accent': theme.onAccent,
    '--mock-heading-font': `"${typography.headingFont}", sans-serif`,
    '--mock-body-font': `"${typography.bodyFont}", sans-serif`,
    '--mock-mono-font': `"${typography.monoFont}", monospace`,
    '--mock-heading-weight': typography.headingWeight,
    '--mock-tracking': `${typography.headingTracking}em`,
    '--mock-body-weight': typography.bodyWeight,
    '--mock-line-height': typography.lineHeight,
    '--mock-size': `${typeScale.base}px`,
    '--mock-title-size': `${typeScale['4xl']}px`,
    '--mock-radius': `${radii.md}px`,
    '--mock-radius-lg': `${radii.xl}px`,
    '--mock-spacing': `${geometry.spacingUnit}px`,
    '--mock-padding': `${geometry.cardPadding}px`,
    '--mock-gap': `${geometry.elementGap}px`,
    '--mock-shadow': getElevationShadows(geometry.elevationStyle)[mode].lg,
  } as CSSProperties;
  const distribution = [
    { label: '60 % · Base', colors: [{ name: 'Fondo', hex: theme.canvas }] },
    { label: '30 % · Secundario', colors: [{ name: 'Secundario', hex: theme.secondary }] },
    { label: '10 % · Énfasis', colors: [{ name: 'Primario', hex: theme.primary }, { name: 'Acento', hex: theme.accent }] },
  ];

  const preview = (
    <div className={`interface-preview-stage${isApp ? ' interface-preview-stage--app' : ''}`} style={style}>
      {isApp ? (
        <AppFrame brand={brand} destinations={template === 'onboarding' ? undefined : APP_DESTINATIONS[template]}>
          <AppMockup />
        </AppFrame>
      ) : (
        <div className="mock-frame">
          <div className="mock-browser" aria-hidden="true">
            <span className="mock-browser-dots"><i /><i /><i /></span>
            <span className="mock-browser-address"><Globe size={11} /> {t(label)}</span>
          </div>
          <WebMockup brand={brand} />
        </div>
      )}
      <figure className="interface-preview-distribution" aria-label={t('Regla de color 60/30/10')}>
        <div className="interface-preview-ratio" aria-hidden="true"><span /><span /><span /></div>
        <figcaption>
          <ul className="interface-preview-swatches">
            {distribution.map(({ label, colors }) => (
              <li key={label}>
                <small>{t(label)}</small>
                <div className="interface-preview-hexes">
                  {colors.map(({ name, hex }) => (
                    <span key={name} title={t(name)}>
                      <i style={{ backgroundColor: hex }} aria-hidden="true" />
                      <code aria-label={`${t(name)} ${hex}`}>{hex}</code>
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </figcaption>
      </figure>
    </div>
  );

  return (
    <section aria-label={`${t(label)}, ${isApp ? t('app móvil') : 'web'}, ${modeLabel}`} className="interface-preview">
      <header className="interface-preview-header">
        <span><ModeIcon size={15} aria-hidden="true" /> {modeLabel}</span>
        <button
          type="button"
          aria-haspopup="dialog"
          aria-label={t('Ampliar {0} en {1}', t(label), modeLabel.toLowerCase())}
          title={t('Ampliar vista previa')}
          onClick={() => {
            dialogRef.current?.showModal();
            setExpanded(true);
          }}
        >
          <Maximize2 size={16} aria-hidden="true" />
        </button>
      </header>
      {preview}
      <dialog ref={dialogRef} className="interface-preview-dialog" aria-labelledby={dialogTitle} onClose={() => setExpanded(false)}>
        <header className="interface-preview-header">
          <h2 id={dialogTitle}>{t(label)} · {isApp ? t('App móvil') : 'Web'} · {modeLabel}</h2>
          <button type="button" aria-label={t('Cerrar vista ampliada')} onClick={() => dialogRef.current?.close()}>
            <X size={18} aria-hidden="true" />
          </button>
        </header>
        {expanded && preview}
      </dialog>
    </section>
  );
}
