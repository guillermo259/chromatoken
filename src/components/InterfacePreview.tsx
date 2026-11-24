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
  { label: 'Ingresos', value: '$24.850', change: '+12,4%' },
  { label: 'Usuarios', value: '1.482', change: '+8,2%' },
  { label: 'Conversión', value: '4,8%', change: '+0,6 pp' },
];
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
  { label: 'Estudio Norte', date: 'Hoy', amount: '+$1.240,00', icon: ArrowDownLeft },
  { label: 'Suscripción', date: 'Ayer', amount: '−$24,00', icon: CreditCard },
  { label: 'Pago de servicios', date: '22 oct', amount: '−$92,50', icon: ArrowUpRight },
];
const PRODUCTS = [
  { name: 'Bolso Ágil', price: '$38', shape: 'bag' },
  { name: 'Vaso Duna', price: '$24', shape: 'cup' },
  { name: 'Lámpara Alba', price: '$68', shape: 'lamp' },
];

function Brand({ name }: { name: string }) {
  return (
    <span className="mock-brand">
      <span className="mock-brand-icon"><Layers3 size={14} aria-hidden="true" /></span>
      <span>{name}</span>
    </span>
  );
}

function RevenueChart() {
  return (
    <section className="mock-card">
      <h4>Ingresos por mes</h4>
      <div className="mock-bars" role="img" aria-label="Los ingresos de junio superan a los de enero y a los de junio del periodo anterior">
        {DASHBOARD_MONTHS.map(({ label, current, previous }) => (
          <div key={label}>
            <span><i style={{ height: current + '%' }} /><i style={{ height: previous + '%' }} /></span>
            <small>{label}</small>
          </div>
        ))}
      </div>
      <div className="mock-chart-legend"><span>Actual</span><span>Anterior</span></div>
    </section>
  );
}

function Balance() {
  return (
    <div className="mock-balance">
      <span>Saldo disponible</span>
      <strong>$8.420,50</strong>
      <span><span className="mock-balance-chip">USD</span> Cuenta principal</span>
    </div>
  );
}

function TransferActions() {
  return (
    <div className="mock-finance-actions">
      <span className="mock-button"><ArrowUpRight size={14} aria-hidden="true" /> Enviar</span>
      <span className="mock-button mock-button-outline"><ArrowDownLeft size={14} aria-hidden="true" /> Recibir</span>
    </div>
  );
}

function RecentTransactions() {
  return (
    <section className="mock-card">
      <h4>Actividad reciente</h4>
      <ul className="mock-transactions">
        {TRANSACTIONS.map(({ label, date, amount, icon: Icon }) => (
          <li key={label}>
            <span className="mock-item-icon"><Icon size={15} aria-hidden="true" /></span>
            <span><strong>{label}</strong><small>{date}</small></span>
            <b>{amount}</b>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ProductCards({ limit }: { limit?: number }) {
  return (
    <div className="mock-products">
      {PRODUCTS.slice(0, limit).map(({ name, price, shape }) => (
        <div key={shape} className="mock-product">
          <div className={`mock-product-art mock-product-art--${shape}`} aria-hidden="true"><i /></div>
          <div><h4>{name}</h4><span>{price}</span></div>
        </div>
      ))}
    </div>
  );
}

function OnboardingStep({ isApp = false }: { isApp?: boolean }) {
  const Heading = isApp ? 'h3' : 'h4';
  return (
    <>
      <div className="mock-phone-art" aria-hidden="true"><Sparkles strokeWidth={1.4} /></div>
      <p className="mock-kicker">Paso 1 de 3</p>
      <Heading>Tu día, a tu manera</Heading>
      <p className="mock-description">Empieza creando una rutina que se adapte a ti.</p>
      <div className="mock-phone-progress" aria-hidden="true"><i /><i /><i /></div>
      <span className="mock-button">Continuar <ChevronRight size={14} aria-hidden="true" /></span>
    </>
  );
}

function Landing({ brand }: { brand: string }) {
  return (
    <div className="mock-site mock-landing">
      <header className="mock-header">
        <Brand name={brand} />
        <span className="mock-nav">Cursos <span>Comunidad</span></span>
        <span className="mock-button mock-button-outline">Ver cursos</span>
      </header>
      <div className="mock-landing-hero">
        <div>
          <p className="mock-kicker">Cursos de diseño</p>
          <h3 className="mock-display">Diseña con intención.</h3>
          <p className="mock-description">Aprende a convertir tus ideas en experiencias que resuelvan problemas reales.</p>
          <span className="mock-button">Explorar cursos <ArrowUpRight size={14} aria-hidden="true" /></span>
        </div>
        <div className="mock-landing-art" aria-hidden="true">
          <i /><i /><i /><i /><i /><i />
        </div>
      </div>
      <div className="mock-landing-stats">
        <span><strong>24</strong> Cursos</span>
        <span><strong>12</strong> Mentores</span>
        <span><strong>1,2 mil</strong> Estudiantes</span>
      </div>
    </div>
  );
}

function Dashboard({ brand }: { brand: string }) {
  return (
    <div className="mock-dashboard">
      <aside className="mock-dashboard-rail">
        <Brand name={brand} />
        <ul aria-label="Menú de ejemplo">
          {DASHBOARD_MENU.map(({ label, icon: Icon }) => (
            <li key={label}><Icon size={15} aria-hidden="true" /><span>{label}</span></li>
          ))}
        </ul>
      </aside>
      <div className="mock-dashboard-body">
        <header className="mock-section-header">
          <h3>Resumen de actividad</h3>
          <span className="mock-tag">Últimos 6 meses</span>
        </header>
        <div className="mock-metrics">
          {DASHBOARD_METRICS.map(({ label, value, change }) => (
            <div className="mock-metric" key={label}>
              <span>{label}</span><strong>{value}</strong><small>{change}</small>
            </div>
          ))}
        </div>
        <div className="mock-dashboard-charts">
          <RevenueChart />
          <section className="mock-card">
            <h4>Fuentes de tráfico</h4>
            <div className="mock-donut" role="img" aria-label="Tráfico directo 62 %, búsqueda 24 % y referidos 14 %">
              <strong aria-hidden="true">62 %</strong>
            </div>
            <div className="mock-chart-legend"><span>Directo</span><span>Búsqueda</span><span>Referidos</span></div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Finance({ brand }: { brand: string }) {
  return (
    <div className="mock-site">
      <header className="mock-header">
        <Brand name={brand} />
        <span className="mock-nav">Cuentas <span>Movimientos</span></span>
        <span className="mock-button mock-button-outline"><CreditCard size={14} aria-hidden="true" /> Mis tarjetas</span>
      </header>
      <div className="mock-finance">
        <div>
          <h3>Mis finanzas</h3>
          <Balance />
          <TransferActions />
        </div>
        <RecentTransactions />
      </div>
    </div>
  );
}

function Blog({ brand }: { brand: string }) {
  return (
    <div className="mock-site">
      <header className="mock-header">
        <Brand name={brand} />
        <span className="mock-nav">Artículos <span>Archivo</span></span>
        <span className="mock-button">Suscribirme</span>
      </header>
      <div className="mock-blog-feature">
        <div className="mock-blog-art" aria-hidden="true"><i /><i /><i /></div>
        <div className="mock-blog-copy">
          <p className="mock-kicker">Ideas y procesos</p>
          <h3 className="mock-display">El color que cuenta una historia.</h3>
          <p className="mock-description">Cómo elegir una paleta que comunique lo que tu marca quiere decir.</p>
          <span className="mock-read-more">Leer artículo <ArrowRight size={14} aria-hidden="true" /></span>
        </div>
      </div>
      <div className="mock-blog-index">
        <div><p className="mock-kicker">Tipografía</p><h4>El ritmo de una buena lectura</h4></div>
        <div><p className="mock-kicker">Proceso</p><h4>Del boceto al sistema</h4></div>
      </div>
    </div>
  );
}

function Shop({ brand }: { brand: string }) {
  return (
    <div className="mock-site">
      <header className="mock-header">
        <Brand name={brand} />
        <span className="mock-nav">Tienda <span>Colecciones</span></span>
        <span className="mock-button mock-button-outline"><ShoppingBag size={14} aria-hidden="true" /> Bolsa (0)</span>
      </header>
      <div className="mock-shop-heading">
        <div>
          <p className="mock-kicker">Colección Esenciales</p>
          <h3 className="mock-display">Objetos para el día a día.</h3>
        </div>
        <span className="mock-button">Ver colección <ArrowUpRight size={14} aria-hidden="true" /></span>
      </div>
      <ProductCards />
    </div>
  );
}

function Onboarding({ brand }: { brand: string }) {
  return (
    <div className="mock-onboarding">
      <div className="mock-onboarding-intro">
        <Brand name={brand} />
        <div>
          <h3 className="mock-display">Encuentra tu ritmo.</h3>
          <p className="mock-description">Una app para organizar tu día y hacer espacio para lo que importa.</p>
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
  return (
    <div className="mock-frame mock-app-frame">
      <div className="mock-app-status" aria-hidden="true">
        <span>9:41</span><i /><span><Wifi size={13} /><BatteryFull size={15} /></span>
      </div>
      <div className="mock-app-top"><Brand name={brand} /></div>
      <div className="mock-app-content">{children}</div>
      {destinations && (
        <ul className="mock-app-nav" aria-label="Navegación de ejemplo">
          {destinations.map(({ label, icon: Icon }) => (
            <li key={label}><span><Icon size={16} aria-hidden="true" /></span>{label}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function LandingApp() {
  return (
    <div className="mock-app-screen">
      <h3>Aprende diseño</h3>
      <section className="mock-app-banner">
        <span className="mock-app-badge">Nuevo curso</span>
        <h4>Diseña con intención</h4>
        <p>De la primera idea a tu primer prototipo.</p>
        <span className="mock-button">Empezar <ArrowRight size={14} aria-hidden="true" /></span>
      </section>
      <section className="mock-card mock-app-row">
        <span className="mock-item-icon"><BookOpen size={15} aria-hidden="true" /></span>
        <div><h4>Fundamentos del color</h4><small>3 de 8 lecciones</small></div>
      </section>
      <section className="mock-card mock-app-row">
        <span className="mock-item-icon"><Layers3 size={15} aria-hidden="true" /></span>
        <div><h4>Diseño de interfaces</h4><small>1 de 6 lecciones</small></div>
      </section>
    </div>
  );
}

function DashboardApp() {
  const [income] = DASHBOARD_METRICS;
  return (
    <div className="mock-app-screen">
      <h3>Resumen de actividad</h3>
      <section className="mock-app-banner">
        <h4>{income.label} del mes</h4>
        <strong className="mock-app-total">{income.value}</strong>
        <span className="mock-app-badge">{income.change}</span>
      </section>
      <RevenueChart />
    </div>
  );
}

function FinanceApp() {
  return (
    <div className="mock-app-screen">
      <h3>Mis finanzas</h3>
      <Balance />
      <TransferActions />
      <RecentTransactions />
    </div>
  );
}

function BlogApp() {
  return (
    <div className="mock-app-screen">
      <h3>Para leer hoy</h3>
      <article className="mock-app-article">
        <div className="mock-blog-art" aria-hidden="true"><i /><i /><i /></div>
        <p className="mock-kicker">Ideas y procesos · 5 min</p>
        <h4>El color que cuenta una historia</h4>
        <span className="mock-button">Leer artículo <ArrowRight size={14} aria-hidden="true" /></span>
      </article>
      <section className="mock-card mock-app-row">
        <span className="mock-item-icon"><Bookmark size={15} aria-hidden="true" /></span>
        <div><h4>El ritmo de una buena lectura</h4><small>Tipografía · 4 min</small></div>
      </section>
    </div>
  );
}

function ShopApp() {
  return (
    <div className="mock-app-screen">
      <h3>Tienda</h3>
      <div className="mock-app-search"><Search size={15} aria-hidden="true" /> Buscar productos</div>
      <section className="mock-app-screen">
        <h4>Colección Esenciales</h4>
        <ProductCards limit={2} />
      </section>
      <span className="mock-button">Ver colección <ArrowRight size={14} aria-hidden="true" /></span>
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
  const { colors, contrastLevel, geometry, typography } = state;
  const label = PREVIEW_TEMPLATES.find((item) => item.id === template)?.label;
  const modeLabel = mode === 'light' ? 'Modo claro' : 'Modo oscuro';
  const ModeIcon = mode === 'light' ? Sun : Moon;
  const { web: WebMockup, app: AppMockup } = TEMPLATE_CONTENT[template];
  const isApp = platform === 'app';
  const brand = state.brandName || 'Mi marca';
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
            <span className="mock-browser-address"><Globe size={11} /> {label}</span>
          </div>
          <WebMockup brand={brand} />
        </div>
      )}
      <figure className="interface-preview-distribution" aria-label="Regla de color 60/30/10">
        <div className="interface-preview-ratio" aria-hidden="true"><span /><span /><span /></div>
        <figcaption>
          <ul className="interface-preview-swatches">
            {distribution.map(({ label, colors }) => (
              <li key={label}>
                <small>{label}</small>
                <div className="interface-preview-hexes">
                  {colors.map(({ name, hex }) => (
                    <span key={name} title={name}>
                      <i style={{ backgroundColor: hex }} aria-hidden="true" />
                      <code aria-label={`${name} ${hex}`}>{hex}</code>
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
    <section aria-label={`${label}, ${isApp ? 'app móvil' : 'web'}, ${modeLabel}`} className="interface-preview">
      <header className="interface-preview-header">
        <span><ModeIcon size={15} aria-hidden="true" /> {modeLabel}</span>
        <button
          type="button"
          aria-haspopup="dialog"
          aria-label={`Ampliar ${label} en ${modeLabel.toLowerCase()}`}
          title="Ampliar vista previa"
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
          <h2 id={dialogTitle}>{label} · {isApp ? 'App móvil' : 'Web'} · {modeLabel}</h2>
          <button type="button" aria-label="Cerrar vista ampliada" onClick={() => dialogRef.current?.close()}>
            <X size={18} aria-hidden="true" />
          </button>
        </header>
        {expanded && preview}
      </dialog>
    </section>
  );
}
