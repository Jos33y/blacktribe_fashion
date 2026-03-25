import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import useAuth from '../../hooks/useAuth';
import useAuthStore from '../../store/authStore';
import { useToast } from '../../components/ui/Toast';
import CollectionGallery from '../../components/account/CollectionGallery';
import OrderList from '../../components/account/OrderList';
import WishlistGrid from '../../components/account/WishlistGrid';
import AccountSettings from '../../components/account/AccountSettings';
import { setPageMeta, clearPageMeta } from '../../utils/pageMeta';
import '../../styles/pages/Account.css';

const TABS = [
  { id: 'collection', label: 'Your Collection' },
  { id: 'orders', label: 'Orders' },
  { id: 'wishlist', label: 'Wishlist' },
  { id: 'settings', label: 'Settings' },
];

export default function Account() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated, loading, user, profile } = useAuth();
  const { addToast } = useToast();

  /* ─── Tab state from URL ─── */
  const tabParam = searchParams.get('tab');
  const activeTab = TABS.find((t) => t.id === tabParam)?.id || 'collection';

  const setActiveTab = (tabId) => {
    if (tabId === 'collection') {
      setSearchParams({});
    } else {
      setSearchParams({ tab: tabId });
    }
  };

  /* ─── Page meta ─── */
  useEffect(() => {
    setPageMeta({
      title: 'Your Tribe. BlackTribe Fashion.',
      description: 'Your collection, orders, and wishlist.',
      path: '/account',
    });
    return () => clearPageMeta();
  }, []);

  /* ─── Auth guard ─── */
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/auth', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  /* ─── Greeting name ─── */
  const displayName = profile?.full_name || user?.email?.split('@')[0] || '';

  /* ─── Member since (formatted: "March 2026") ─── */
  const memberSince = useMemo(() => {
    if (!user?.created_at) return '';
    const date = new Date(user.created_at);
    return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  }, [user?.created_at]);

  /* ─── Email verification status ─── */
  const emailVerified = !!user?.email_confirmed_at;

  if (loading) return null;
  if (!isAuthenticated) return null;

  return (
    <div className="account page-enter">

      {/* ═══ Hero — Editorial membership header ═══ */}
      <div className="account__hero">
        <div className="account__hero-inner">

          {/* Email verification nudge (non-blocking) */}
          {!emailVerified && (
            <div className="account__verify-nudge">
              <p>Your email is not verified. You may not receive order updates.</p>
              <button
                type="button"
                className="account__verify-link"
                onClick={() => setActiveTab('settings')}
              >
                Verify now
              </button>
            </div>
          )}

          <span className="account__eyebrow">Your Tribe</span>
          <h1 className="account__greeting">
            Welcome back, {displayName}.
          </h1>
          {memberSince && (
            <span className="account__member-since">Member since {memberSince}</span>
          )}

          {/* Tabs live inside the hero */}
          <div className="account__tabs" role="tablist" aria-label="Account sections">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`account__tab ${activeTab === tab.id ? 'account__tab--active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ Tab content ═══ */}
      <div className="account__content" role="tabpanel">
        <div className="account__content-inner">
          {activeTab === 'collection' && <CollectionGallery />}
          {activeTab === 'orders' && <OrderList />}
          {activeTab === 'wishlist' && <WishlistGrid />}
          {activeTab === 'settings' && <AccountSettings />}
        </div>
      </div>

    </div>
  );
}
