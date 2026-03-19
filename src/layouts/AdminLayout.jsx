import { createContext, useContext, useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/* ─── Breadcrumb context ────────────────────────────────── */
export const BreadcrumbCtx = createContext({ setLabel: () => {} });
export function useSetBreadcrumb(label) {
  const { setLabel } = useContext(BreadcrumbCtx);
  useEffect(() => {
    setLabel(label || null);
    return () => setLabel(null);
  }, [label, setLabel]);
}

/* ─── Icons ──────────────────────────────────────────────── */
const Ico = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const IcoOverview   = () => <Ico d="M18 20V10M12 20V4M6 20v-6" />;
const IcoComplaints = () => <Ico d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />;
const IcoUsers      = () => <Ico d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />;
const IcoHalls      = () => <Ico d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5zM9 21V12h6v9" />;
const IcoAssets     = () => <Ico d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16zM12 2v10M2 6.5l10 5.5 10-5.5" />;
const IcoAI         = () => <Ico d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />;
const IcoLogout     = () => <Ico d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />;
const IcoChevron    = () => <Ico d="M9 18l6-6-6-6" size={12} />;

const NAV = [
  { label: 'Overview',      href: '/admin',             Icon: IcoOverview   },
  { label: 'Complaints',    href: '/admin/complaints',  Icon: IcoComplaints },
  { label: 'Users',         href: '/admin/users',       Icon: IcoUsers      },
  { label: 'Halls & Rooms', href: '/admin/halls',       Icon: IcoHalls      },
  { label: 'Assets',        href: '/admin/assets',      Icon: IcoAssets     },
  { label: 'AI Settings',   href: '/admin/ai-settings', Icon: IcoAI         },
];

const SECTION_LABELS = {
  complaints: 'Complaints',
  users:      'Users',
  halls:      'Halls & Rooms',
  assets:     'Assets',
  'ai-settings': 'AI Settings',
};

function buildCrumbs(pathname, dynamicLabel) {
  // Strip /admin prefix, split segments
  const rest = pathname.replace(/^\/admin\/?/, '');
  if (!rest) return [{ label: 'Overview' }];

  const parts = rest.split('/').filter(Boolean);
  const section = SECTION_LABELS[parts[0]];
  if (!section) return [{ label: 'Overview' }];

  if (parts.length === 1) return [{ label: section }];

  // Sub-page (detail)
  return [
    { label: section, href: `/admin/${parts[0]}` },
    { label: dynamicLabel || 'Detail' },
  ];
}

export default function AdminLayout() {
  const { auth, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [dynamicLabel, setDynamicLabel] = useState(null);

  function handleLogout() { logout(); navigate('/login'); }

  const initials = `${auth.user.firstname?.[0] || ''}${auth.user.lastname?.[0] || ''}`.toUpperCase();
  const crumbs = buildCrumbs(location.pathname, dynamicLabel);

  function isActive(href) {
    if (href === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(href);
  }

  return (
    <BreadcrumbCtx.Provider value={{ setLabel: setDynamicLabel }}>
      <div className="flex h-screen bg-slate-50 overflow-hidden" style={{ fontFamily: "'Outfit', sans-serif" }}>

        {/* ── Sidebar ── */}
        <aside className="w-[220px] flex-shrink-0 bg-slate-900 flex flex-col h-full">
          <div className="px-5 pt-6 pb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-900/40">
                <IcoHalls />
              </div>
              <div>
                <p className="text-white text-sm font-bold leading-tight">HMS</p>
                <p className="text-slate-500 text-[10px] font-medium uppercase tracking-widest">Admin Portal</p>
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-700/40 mx-5 mb-3" />

          <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto py-2">
            {NAV.map(({ label, href, Icon }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  to={href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 ${
                    active
                      ? 'bg-brand-600 text-white shadow-sm shadow-brand-900/40'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span className={active ? 'text-white' : 'text-slate-500'}><Icon /></span>
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="px-3 pb-4 mt-2">
            <div className="h-px bg-slate-700/40 mb-3" />
            <div className="flex items-center gap-2.5 px-3 py-2">
              <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-semibold truncate">{auth.user.firstname} {auth.user.lastname}</p>
                <p className="text-slate-500 text-[10px]">Administrator</p>
              </div>
              <button onClick={handleLogout} title="Log out" className="text-slate-500 hover:text-red-400 transition-colors">
                <IcoLogout />
              </button>
            </div>
          </div>
        </aside>

        {/* ── Content ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Breadcrumbs */}
          <div className="bg-white border-b border-gray-100 px-6 py-2.5 flex-shrink-0">
            <nav className="flex items-center gap-1.5 text-xs">
              <Link to="/admin" className="text-slate-400 hover:text-brand-600 transition-colors font-medium">Admin</Link>
              {crumbs.map((crumb, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  <span className="text-slate-300"><IcoChevron /></span>
                  {crumb.href ? (
                    <Link to={crumb.href} className="text-slate-400 hover:text-brand-600 transition-colors font-medium">{crumb.label}</Link>
                  ) : (
                    <span className="text-slate-700 font-semibold">{crumb.label}</span>
                  )}
                </span>
              ))}
            </nav>
          </div>

          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </BreadcrumbCtx.Provider>
  );
}
