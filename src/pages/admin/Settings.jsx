/*
 * BLACKTRIBE FASHION — ADMIN SETTINGS v3
 *
 * Permission-gated items. Staff + Activity Log for superadmin.
 * Live counts. Store info card.
 */

import { Link } from 'react-router';
import { useEffect, useState } from 'react';
import useAuthStore from '../../store/authStore';
import '../../styles/admin/admin-settings.css';

const icons = {
  categories: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>),
  collections: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>),
  discounts: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>),
  shipping: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>),
  newsletter: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>),
  customers: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>),
  analytics: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>),
  staff: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>),
  activity: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>),
  messages: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>),
  store: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>),
  chevron: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="9 18 15 12 9 6"/></svg>),
};

/*
 * Permission gating:
 *   perm: null = visible to all admins
 *   perm: 'superadmin' = superadmin only
 *   perm: string = requires that specific permission
 */
const allSections = [
  {
    title: 'Catalog',
    items: [
      { to: '/admin/categories', icon: icons.categories, label: 'Categories', desc: 'Manage product categories', perm: 'collections' },
      { to: '/admin/collections', icon: icons.collections, label: 'Collections', desc: 'Manage collections and drops', perm: 'collections' },
    ],
  },
  {
    title: 'Sales',
    items: [
      { to: '/admin/discounts', icon: icons.discounts, label: 'Discount Codes', desc: 'Create and manage discount codes', perm: 'discounts' },
      { to: '/admin/shipping', icon: icons.shipping, label: 'Shipping Zones', desc: 'State and international shipping rates', perm: 'shipping' },
    ],
  },
  {
    title: 'Marketing',
    items: [
      { to: '/admin/newsletter', icon: icons.newsletter, label: 'Newsletter', desc: 'Subscriber list and exports', perm: null },
    ],
  },
  {
    title: 'Support',
    items: [
      { to: '/admin/messages', icon: icons.messages, label: 'Messages', desc: 'Contact form submissions', perm: 'orders' },
    ],
  },
  {
    title: 'Team',
    items: [
      { to: '/admin/staff', icon: icons.staff, label: 'Staff', desc: 'Manage admin accounts and permissions', perm: 'superadmin' },
      { to: '/admin/activity', icon: icons.activity, label: 'Activity Log', desc: 'Audit trail of all admin actions', perm: 'superadmin' },
    ],
  },
  {
    title: 'Data',
    items: [
      { to: '/admin/customers', icon: icons.customers, label: 'Customers', desc: 'Customer list and order history', perm: 'customers' },
      { to: '/admin/analytics', icon: icons.analytics, label: 'Analytics', desc: 'Revenue, conversions, and insights', perm: null },
    ],
  },
];

const storeInfo = [
  { label: 'Brand', value: 'BlackTribe Fashion' },
  { label: 'Domain', value: 'blacktribefashion.com', mono: true },
  { label: 'Support', value: 'support@blacktribefashion.com', mono: true },
  { label: 'Currency', value: '₦ Nigerian Naira' },
  { label: 'Payments', value: 'Paystack (launch)' },
  { label: 'Email', value: 'Resend SMTP' },
];

export default function AdminSettings() {
  const [counts, setCounts] = useState({});
  const profile = useAuthStore((s) => s.profile);
  const role = profile?.role || 'admin';
  const permissions = profile?.permissions || [];

  useEffect(() => { document.title = 'Settings. BlackTribe Admin.'; fetchCounts(); }, []);

  function hasPerm(perm) {
    if (perm === null) return true;
    if (perm === 'superadmin') return role === 'superadmin';
    if (role === 'superadmin') return true;
    return permissions.includes(perm);
  }

  async function fetchCounts() {
    try {
      const { default: store } = await import('../../store/authStore');
      const token = await store.getState().getAccessToken();
      const headers = { Authorization: `Bearer ${token}` };
      const [catRes, colRes, discRes, shipRes, newsRes, msgRes] = await Promise.allSettled([
        fetch('/api/admin/categories', { headers }).then((r) => r.json()),
        fetch('/api/admin/collections', { headers }).then((r) => r.json()),
        fetch('/api/admin/discounts', { headers }).then((r) => r.json()),
        fetch('/api/admin/shipping', { headers }).then((r) => r.json()),
        fetch('/api/admin/newsletter', { headers }).then((r) => r.json()),
        fetch('/api/contact/messages?status=unread&limit=1', { headers }).then((r) => r.json()),
      ]);
      const c = {};
      if (catRes.status === 'fulfilled' && catRes.value.data) c.categories = catRes.value.data.length;
      if (colRes.status === 'fulfilled' && colRes.value.data) c.collections = colRes.value.data.length;
      if (discRes.status === 'fulfilled' && discRes.value.data) c.discounts = discRes.value.data.length;
      if (shipRes.status === 'fulfilled' && shipRes.value.data) c.shipping = shipRes.value.data.length;
      if (newsRes.status === 'fulfilled') { const n = newsRes.value; c.newsletter = n.count ?? n.data?.length ?? 0; }
      if (msgRes.status === 'fulfilled') { c.messages = msgRes.value.total ?? 0; }
      setCounts(c);
    } catch { /* */ }
  }

  function getCount(label) {
    const map = { 'Categories': counts.categories, 'Collections': counts.collections, 'Discount Codes': counts.discounts, 'Shipping Zones': counts.shipping, 'Newsletter': counts.newsletter, 'Messages': counts.messages };
    return map[label];
  }

  /* Filter sections by permissions */
  const sections = allSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => hasPerm(item.perm)),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div className="admin-page-header__info">
          <h2 className="admin-page-header__title">Settings</h2>
          <p className="admin-page-header__desc">Store configuration and management.</p>
        </div>
      </div>

      <div className="settings-sections">
        {sections.map((section) => (
          <div key={section.title} className="settings-section">
            <h3 className="settings-section__title">{section.title}</h3>
            <div className="settings-list">
              {section.items.map((item) => {
                const count = getCount(item.label);
                return (
                  <Link key={item.to} to={item.to} className="settings-list__item">
                    <span className="settings-list__icon">{item.icon}</span>
                    <div className="settings-list__info"><span className="settings-list__name">{item.label}</span><span className="settings-list__meta">{item.desc}</span></div>
                    <div className="settings-list__right">
                      {count !== undefined && <span className="settings-list__count">{count}</span>}
                      <span className="settings-list__chevron">{icons.chevron}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="settings-store">
        <div className="settings-store__header"><span className="settings-store__icon">{icons.store}</span><h3 className="settings-store__title">Store Information</h3></div>
        <div className="settings-store__grid">
          {storeInfo.map((item) => (<div key={item.label} className="settings-store__field"><span className="settings-store__label">{item.label}</span><span className={`settings-store__value ${item.mono ? 'settings-store__value--mono' : ''}`}>{item.value}</span></div>))}
        </div>
      </div>
    </div>
  );
}
