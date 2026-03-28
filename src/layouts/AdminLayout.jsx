/*
 * BLACKTRIBE FASHION — ADMIN LAYOUT v3.5
 *
 * v3.5:
 *   - Nested Suspense around Outlet — admin page transitions
 *     now show lightweight skeleton WITHIN the layout instead
 *     of flashing the full-page PageLoader (which hides sidebar)
 *
 * v3.4:
 *   - AdminNotifications panel (bell icon dropdown)
 *   - Unread count badge on bell
 *
 * v3.3:
 *   - AdminSearch command palette (Ctrl+K / Cmd+K)
 *   - Topbar search button wired to open palette
 *
 * v3.2:
 *   - Sidebar nav items gated by user permissions
 *   - Staff item visible to superadmin only
 *   - Walk-in CTA gated by orders permission
 *   - Mobile bottom tabs gated
 *   - Activity Log recognized as nested page
 *   - Route-change scroll targets .admin-content
 */

import { useEffect, useState, Suspense } from 'react';
import { Outlet, useLocation, useNavigate, NavLink, Link } from 'react-router';
import useAuthStore from '../store/authStore';
import AdminSearch from '../components/admin/AdminSearch';
import AdminNotifications from '../components/admin/AdminNotifications';
import Skeleton from '../components/ui/Skeleton';
import RouteProgressBar from '../components/ui/RouteProgressBar';
import '../styles/admin/admin-layout.css';
import '../styles/admin/admin-tabs.css';
import '../styles/admin/admin-more.css';
import '../styles/admin/admin-shared.css';
import '../styles/admin/admin-tables.css';
import '../styles/admin/admin-forms.css';

/* ═══ ICONS ═══ */

const I = {
  dashboard: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>),
  analytics: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>),
  orders: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 8l-2-4H5L3 8" /><path d="M3 8h18v11a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" /><path d="M12 12v4" /><path d="M8 8v1" /><path d="M16 8v1" /></svg>),
  products: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" /><circle cx="7" cy="7" r="1" fill="currentColor" stroke="none" /></svg>),
  customers: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>),
  collections: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg>),
  discounts: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="19" y1="5" x2="5" y2="19" /><circle cx="6.5" cy="6.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" /></svg>),
  newsletter: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>),
  shipping: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>),
  staff: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>),
  payments: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>),
  settings: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>),
  plus: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>),
  more: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="5" r="1.5" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" /><circle cx="12" cy="19" r="1.5" fill="currentColor" stroke="none" /></svg>),
  collapse: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="15 18 9 12 15 6" /></svg>),
  expand: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="9 18 15 12 9 6" /></svg>),
  store: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>),
  signout: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>),
  search: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>),
  bell: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></svg>),
  back: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>),
};

/* ═══ NAV CONFIG ═══ */

const allSidebarNav = [
  { to: '/admin', icon: I.dashboard, label: 'Dashboard', end: true, perm: null },
  { to: '/admin/analytics', icon: I.analytics, label: 'Analytics', perm: null },
  { to: '/admin/orders', icon: I.orders, label: 'Orders', perm: 'orders' },
  { to: '/admin/payments', icon: I.payments, label: 'Payments', perm: 'orders' },
  { to: '/admin/products', icon: I.products, label: 'Products', perm: 'products' },
  { to: '/admin/customers', icon: I.customers, label: 'Customers', perm: 'customers' },
  { to: '/admin/collections', icon: I.collections, label: 'Collections', perm: 'collections' },
  { to: '/admin/discounts', icon: I.discounts, label: 'Discounts', perm: 'discounts' },
  { to: '/admin/newsletter', icon: I.newsletter, label: 'Newsletter', perm: null },
  { to: '/admin/shipping', icon: I.shipping, label: 'Shipping', perm: 'shipping' },
  { to: '/admin/staff', icon: I.staff, label: 'Staff', perm: 'superadmin' },
];

const allMoreItems = [
  { to: '/admin/analytics', icon: I.analytics, label: 'Analytics', perm: null },
  { to: '/admin/payments', icon: I.payments, label: 'Payments', perm: 'orders' },
  { to: '/admin/customers', icon: I.customers, label: 'Customers', perm: 'customers' },
  { to: '/admin/collections', icon: I.collections, label: 'Collections', perm: 'collections' },
  { to: '/admin/discounts', icon: I.discounts, label: 'Discounts', perm: 'discounts' },
  { to: '/admin/newsletter', icon: I.newsletter, label: 'Newsletter', perm: null },
  { to: '/admin/shipping', icon: I.shipping, label: 'Shipping', perm: 'shipping' },
  { to: '/admin/staff', icon: I.staff, label: 'Staff', perm: 'superadmin' },
  { to: '/admin/settings', icon: I.settings, label: 'Settings', perm: null },
];

function filterNavItems(items, role, permissions) {
  return items.filter((item) => {
    if (item.perm === null) return true;
    if (item.perm === 'superadmin') return role === 'superadmin';
    if (role === 'superadmin') return true;
    return permissions.includes(item.perm);
  });
}

/* ═══ HELPERS ═══ */

function getPageInfo(pathname) {
  if (pathname === '/admin/orders/new') return { title: 'New Walk-in Order', nested: true, parent: '/admin/orders' };
  if (pathname.match(/^\/admin\/orders\/.+/)) return { title: 'Order Detail', nested: true, parent: '/admin/orders' };
  if (pathname === '/admin/products/new') return { title: 'New Product', nested: true, parent: '/admin/products' };
  if (pathname.match(/^\/admin\/products\/.+\/edit/)) return { title: 'Edit Product', nested: true, parent: '/admin/products' };
  if (pathname === '/admin/categories') return { title: 'Categories', nested: true, parent: '/admin/products' };
  if (pathname === '/admin/activity') return { title: 'Activity Log', nested: true, parent: '/admin/settings' };
  if (pathname === '/admin/messages') return { title: 'Messages', nested: true, parent: '/admin/settings' };
  if (pathname.match(/^\/admin\/customers\/.+/)) return { title: 'Customer Detail', nested: true, parent: '/admin/customers' };

  const map = {
    '/admin': 'Dashboard', '/admin/analytics': 'Analytics', '/admin/orders': 'Orders',
    '/admin/products': 'Products', '/admin/customers': 'Customers', '/admin/collections': 'Collections',
    '/admin/discounts': 'Discounts', '/admin/newsletter': 'Newsletter', '/admin/shipping': 'Shipping',
    '/admin/settings': 'Settings', '/admin/staff': 'Staff', '/admin/payments': 'Payments',
  };
  return { title: map[pathname] || 'Admin', nested: false };
}

/* ═══ ADMIN PAGE SKELETON ═══ */
/* Lightweight skeleton that renders INSIDE the admin layout */
function AdminPageSkeleton() {
  return (
    <div className="admin-page" style={{ opacity: 0.6 }}>
      <Skeleton type="text" style={{ width: '30%', height: 24, marginBottom: 24 }} />
      <Skeleton type="text" style={{ width: '100%', height: 48, marginBottom: 16 }} />
      <Skeleton type="text" style={{ width: '100%', height: 48, marginBottom: 16 }} />
      <Skeleton type="text" style={{ width: '60%', height: 48 }} />
    </div>
  );
}

/* ═══ COMPONENT ═══ */

export default function AdminLayout() {
  const session = useAuthStore((s) => s.session);
  const profile = useAuthStore((s) => s.profile);
  const loading = useAuthStore((s) => s.loading);
  const signOut = useAuthStore((s) => s.signOut);
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('bt-admin-sidebar') === 'collapsed'; } catch { return false; }
  });
  const [moreOpen, setMoreOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (loading) return;
    if (!session) { navigate(`/auth?returnTo=${encodeURIComponent(location.pathname)}`, { replace: true }); return; }
    if (profile && profile.role !== 'admin' && profile.role !== 'superadmin') { navigate('/', { replace: true }); }
  }, [loading, session, profile, navigate, location.pathname]);

  useEffect(() => { setMoreOpen(false); setNotifOpen(false); const el = document.querySelector('.admin-content'); if (el) el.scrollTop = 0; }, [location.pathname]);
  useEffect(() => { try { localStorage.setItem('bt-admin-sidebar', collapsed ? 'collapsed' : 'expanded'); } catch { } }, [collapsed]);
  useEffect(() => { if (!moreOpen) return; const h = (e) => { if (e.key === 'Escape') setMoreOpen(false); }; document.addEventListener('keydown', h); return () => document.removeEventListener('keydown', h); }, [moreOpen]);

  /* Ctrl+K / Cmd+K to open search */
  useEffect(() => {
    function handleGlobalKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    }
    document.addEventListener('keydown', handleGlobalKey);
    return () => document.removeEventListener('keydown', handleGlobalKey);
  }, []);

  if (loading) return (<div className="admin-loading"><img src="/logo_white.png" alt="" className="admin-loading__logo" /><span className="admin-loading__label">ADMIN</span></div>);
  if (!session || !profile || (profile.role !== 'admin' && profile.role !== 'superadmin')) return null;

  const displayName = profile.full_name || session.user?.email?.split('@')[0] || 'Admin';
  const role = profile.role;
  const permissions = profile.permissions || [];
  const initial = displayName.charAt(0).toUpperCase();
  const page = getPageInfo(location.pathname);
  const hasPerm = (p) => role === 'superadmin' || permissions.includes(p);

  const sidebarNav = filterNavItems(allSidebarNav, role, permissions);
  const moreItems = filterNavItems(allMoreItems, role, permissions);

  const handleSignOut = async () => { await signOut(); navigate('/', { replace: true }); };

  return (
    <div className={`admin ${collapsed ? 'admin--collapsed' : ''}`}>
      <aside className="admin-sidebar" aria-label="Admin navigation">
        <div className="admin-sidebar__logo-row">
          <Link to="/admin" className="admin-sidebar__logo"><img src="/logo_white.png" alt="BlackTribe" className="admin-sidebar__mask" /><span className="admin-sidebar__wordmark">BLACKTRIBE</span></Link>
          <button className="admin-sidebar__collapse-btn" onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>{collapsed ? I.expand : I.collapse}</button>
        </div>
        {hasPerm('orders') && (<div className="admin-sidebar__cta"><NavLink to="/admin/orders/new" className="admin-sidebar__walkin">{I.plus}<span className="admin-sidebar__walkin-label">New Walk-in</span></NavLink></div>)}
        <nav className="admin-sidebar__nav">
          {sidebarNav.map((item) => (<NavLink key={item.to} to={item.to} end={item.end || false} className={({ isActive }) => `admin-nav-item ${isActive ? 'admin-nav-item--active' : ''}`} title={collapsed ? item.label : undefined}><span className="admin-nav-item__icon">{item.icon}</span><span className="admin-nav-item__label">{item.label}</span></NavLink>))}
        </nav>
        <div className="admin-sidebar__footer">
          <NavLink to="/admin/settings" className={({ isActive }) => `admin-nav-item ${isActive ? 'admin-nav-item--active' : ''}`} title={collapsed ? 'Settings' : undefined}><span className="admin-nav-item__icon">{I.settings}</span><span className="admin-nav-item__label">Settings</span></NavLink>
          <div className="admin-sidebar__user"><div className="admin-sidebar__avatar">{initial}</div><div className="admin-sidebar__user-info"><span className="admin-sidebar__user-name">{displayName}</span><span className="admin-sidebar__user-role">{role}</span></div></div>
          <div className="admin-sidebar__links"><Link to="/" className="admin-sidebar__link">{I.store}<span className="admin-nav-item__label">Back to Store</span></Link><button className="admin-sidebar__link" onClick={handleSignOut}>{I.signout}<span className="admin-nav-item__label">Sign Out</span></button></div>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar__left">
            {page.nested && (<button className="admin-topbar__back" onClick={() => navigate(page.parent)} aria-label="Go back">{I.back}</button>)}
            <div className="admin-topbar__mobile-brand">{page.nested ? (<span className="admin-topbar__mobile-title">{page.title}</span>) : (<><span className="admin-topbar__mobile-wordmark">BLACKTRIBE</span><span className="admin-topbar__badge">ADMIN</span></>)}</div>
            <h1 className="admin-topbar__desktop-title">{page.title}</h1>
          </div>
          <div className="admin-topbar__right">
            <button className="admin-topbar__btn" onClick={() => setSearchOpen(true)} aria-label="Search" title="Search (Ctrl+K)">{I.search}</button>
            <button className="admin-topbar__btn admin-topbar__bell" onClick={() => setNotifOpen(!notifOpen)} aria-label="Notifications" aria-expanded={notifOpen}>{I.bell}{unreadCount > 0 && <span className="admin-topbar__badge-dot" />}</button>
            <Link to="/" className="admin-topbar__store-link" title="Back to store">{I.store}<span>Store</span></Link>
            <div className="admin-topbar__user" title={`${displayName} (${role})`}>{initial}</div>
          </div>
          <AdminNotifications isOpen={notifOpen} onClose={() => setNotifOpen(false)} onUnreadCount={setUnreadCount} />
        </header>
        <RouteProgressBar />
        <div className="admin-content">
          <Suspense fallback={<AdminPageSkeleton />}>
            <Outlet />
          </Suspense>
        </div>
      </div>

      <nav className="admin-tabs" aria-label="Admin navigation">
        <NavLink to="/admin" end className={({ isActive }) => `admin-tab ${isActive ? 'admin-tab--active' : ''}`}>{I.dashboard}<span>Home</span></NavLink>
        {hasPerm('orders') && (<NavLink to="/admin/orders" className={({ isActive }) => `admin-tab ${isActive ? 'admin-tab--active' : ''}`}>{I.orders}<span>Orders</span></NavLink>)}
        {hasPerm('orders') && (<NavLink to="/admin/orders/new" className="admin-tab__fab" aria-label="New walk-in order">{I.plus}</NavLink>)}
        {hasPerm('products') && (<NavLink to="/admin/products" className={({ isActive }) => `admin-tab ${isActive ? 'admin-tab--active' : ''}`}>{I.products}<span>Products</span></NavLink>)}
        <button className={`admin-tab ${moreOpen ? 'admin-tab--active' : ''}`} onClick={() => setMoreOpen(!moreOpen)} aria-expanded={moreOpen} aria-label="More">{I.more}<span>More</span></button>
      </nav>

      {moreOpen && <div className="admin-more-backdrop" onClick={() => setMoreOpen(false)} />}
      <div className={`admin-more ${moreOpen ? 'admin-more--open' : ''}`} role="dialog" aria-label="More options">
        <div className="admin-more__handle" />
        <nav className="admin-more__nav">{moreItems.map((item) => (<NavLink key={item.to} to={item.to} className={({ isActive }) => `admin-more__item ${isActive ? 'admin-more__item--active' : ''}`} onClick={() => setMoreOpen(false)}><span className="admin-more__icon">{item.icon}</span>{item.label}</NavLink>))}</nav>
        <div className="admin-more__divider" />
        <div className="admin-more__user-row"><div className="admin-more__avatar">{initial}</div><div><div className="admin-more__name">{displayName}</div><div className="admin-more__role">{role}</div></div></div>
        <div className="admin-more__actions"><Link to="/" className="admin-more__action" onClick={() => setMoreOpen(false)}>{I.store} Back to Store</Link><button className="admin-more__action" onClick={handleSignOut}>{I.signout} Sign Out</button></div>
      </div>

      {/* Search Command Palette */}
      <AdminSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}