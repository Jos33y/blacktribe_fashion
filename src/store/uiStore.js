/*
 * BLACKTRIBE FASHION — UI STORE
 * Global UI state: cart drawer, mobile nav, search overlay.
 *
 * StoreLayout currently manages mobileNav + search via useState.
 * This store centralizes all overlay states so any component
 * (Navbar, ProductCard, QuickView) can trigger the cart drawer
 * without prop drilling.
 */

import { create } from 'zustand';

const useUIStore = create((set, get) => ({
  cartDrawerOpen: false,
  mobileNavOpen: false,
  searchOpen: false,

  openCartDrawer: () => set({ cartDrawerOpen: true, mobileNavOpen: false, searchOpen: false }),
  closeCartDrawer: () => set({ cartDrawerOpen: false }),
  toggleCartDrawer: () => set((s) => ({ cartDrawerOpen: !s.cartDrawerOpen, mobileNavOpen: false, searchOpen: false })),

  openMobileNav: () => set({ mobileNavOpen: true, cartDrawerOpen: false, searchOpen: false }),
  closeMobileNav: () => set({ mobileNavOpen: false }),

  openSearch: () => set({ searchOpen: true, cartDrawerOpen: false, mobileNavOpen: false }),
  closeSearch: () => set({ searchOpen: false }),

  /** Close all overlays — called on route change */
  closeAll: () => set({ cartDrawerOpen: false, mobileNavOpen: false, searchOpen: false }),
}));

export default useUIStore;
