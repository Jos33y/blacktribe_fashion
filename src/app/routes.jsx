import { lazy } from 'react';

// Top-level pages
export const Home = lazy(() => import('../pages/Home'));
export const NotFound = lazy(() => import('../pages/NotFound'));

// Shop
export const Shop = lazy(() => import('../pages/shop/Shop'));
export const ProductDetail = lazy(() => import('../pages/shop/ProductDetail'));
export const Collections = lazy(() => import('../pages/shop/Collections'));
export const CollectionDetail = lazy(() => import('../pages/shop/CollectionDetail'));

// Checkout
export const Checkout = lazy(() => import('../pages/checkout/Checkout'));
export const OrderConfirmation = lazy(() => import('../pages/checkout/OrderConfirmation'));
export const OrderTracking = lazy(() => import('../pages/checkout/OrderTracking'));

// Auth
export const Auth = lazy(() => import('../pages/auth/Auth'));
export const Account = lazy(() => import('../pages/auth/Account'));

// Brand
export const About = lazy(() => import('../pages/brand/About'));
export const Contact = lazy(() => import('../pages/brand/Contact'));
export const Lookbook = lazy(() => import('../pages/brand/Lookbook'));
export const FAQ = lazy(() => import('../pages/brand/FAQ'));

// Legal
export const Terms = lazy(() => import('../pages/legal/Terms'));
export const Privacy = lazy(() => import('../pages/legal/Privacy'));

// Admin
export const AdminDashboard = lazy(() => import('../pages/admin/Dashboard'));
export const AdminProducts = lazy(() => import('../pages/admin/Products'));
export const AdminProductForm = lazy(() => import('../pages/admin/ProductForm'));
export const AdminOrders = lazy(() => import('../pages/admin/Orders'));
export const AdminOrderDetail = lazy(() => import('../pages/admin/OrderDetail'));
export const AdminCustomers = lazy(() => import('../pages/admin/Customers'));
export const AdminDiscounts = lazy(() => import('../pages/admin/Discounts'));
export const AdminCollections = lazy(() => import('../pages/admin/AdminCollections'));
export const AdminSettings = lazy(() => import('../pages/admin/Settings'));