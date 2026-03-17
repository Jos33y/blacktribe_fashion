import { lazy } from 'react';

// Top-level pages
export const Home = lazy(() => import('../pages/Home'));
export const NotFound = lazy(() => import('../pages/NotFound'));

// Shop pages
export const Shop = lazy(() => import('../pages/shop/Shop'));
export const ProductDetail = lazy(() => import('../pages/shop/ProductDetail'));
export const Collections = lazy(() => import('../pages/shop/Collections'));
export const CollectionDetail = lazy(() => import('../pages/shop/CollectionDetail'));

// Checkout pages
export const Checkout = lazy(() => import('../pages/checkout/Checkout'));
export const OrderConfirmation = lazy(() => import('../pages/checkout/OrderConfirmation'));
export const OrderTracking = lazy(() => import('../pages/checkout/OrderTracking'));
export const PaymentPage = lazy(() => import('../pages/checkout/PaymentPage'));

// Auth pages
export const Auth = lazy(() => import('../pages/auth/Auth'));
export const Account = lazy(() => import('../pages/auth/Account'));

// Brand pages
export const About = lazy(() => import('../pages/brand/About'));
export const Contact = lazy(() => import('../pages/brand/Contact'));
export const Lookbook = lazy(() => import('../pages/brand/Lookbook'));
export const FAQ = lazy(() => import('../pages/brand/FAQ'));

// Legal pages
export const Terms = lazy(() => import('../pages/legal/Terms'));
export const Privacy = lazy(() => import('../pages/legal/Privacy'));
export const ShippingReturns = lazy(() => import('../pages/legal/ShippingReturns'));
export const RefundPolicy = lazy(() => import('../pages/legal/RefundPolicy'));

// Admin pages
export const Dashboard = lazy(() => import('../pages/admin/Dashboard'));
export const Products = lazy(() => import('../pages/admin/Products'));
export const ProductForm = lazy(() => import('../pages/admin/ProductForm'));
export const Orders = lazy(() => import('../pages/admin/Orders'));
export const OrderDetail = lazy(() => import('../pages/admin/OrderDetail'));
export const Customers = lazy(() => import('../pages/admin/Customers'));
export const Discounts = lazy(() => import('../pages/admin/Discounts'));
export const AdminCollections = lazy(() => import('../pages/admin/AdminCollections'));
export const Settings = lazy(() => import('../pages/admin/Settings'));
