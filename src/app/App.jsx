import { BrowserRouter, Routes, Route } from 'react-router';
import { Suspense } from 'react';
import { ToastProvider } from '../components/ui/Toast';
import StoreLayout from '../layouts/StoreLayout';
import Skeleton from '../components/ui/Skeleton';
import {
  Home, NotFound, Shop, ProductDetail, Collections, CollectionDetail,
  Checkout, OrderConfirmation, OrderTracking, PaymentPage,
  Auth, Account,
  About, Contact, Lookbook, FAQ,
  Terms, Privacy, ShippingReturns, RefundPolicy,
  Dashboard, Products, ProductForm, Orders, OrderDetail,
  Customers, Discounts, AdminCollections, Settings,
} from './routes';

function PageLoader() {
  return (
    <div style={{ padding: '80px 20px', maxWidth: 1200, margin: '0 auto' }}>
      <Skeleton type="text" style={{ width: '40%', height: 32, marginBottom: 24 }} />
      <Skeleton type="text" style={{ width: '100%', height: 16, marginBottom: 8 }} />
      <Skeleton type="text" style={{ width: '80%', height: 16 }} />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Store routes */}
            <Route element={<StoreLayout />}>
              <Route index element={<Home />} />
              <Route path="shop" element={<Shop />} />
              <Route path="shop/:category" element={<Shop />} />
              <Route path="product/:slug" element={<ProductDetail />} />
              <Route path="collections" element={<Collections />} />
              <Route path="collections/:slug" element={<CollectionDetail />} />
              <Route path="lookbook" element={<Lookbook />} />
              <Route path="about" element={<About />} />
              <Route path="contact" element={<Contact />} />
              <Route path="faq" element={<FAQ />} />
              <Route path="terms" element={<Terms />} />
              <Route path="privacy" element={<Privacy />} />
              <Route path="shipping-returns" element={<ShippingReturns />} />
              <Route path="refund-policy" element={<RefundPolicy />} />
              <Route path="checkout" element={<Checkout />} />
              <Route path="order-confirmation/:id" element={<OrderConfirmation />} />
              <Route path="pay/:orderNumber" element={<PaymentPage />} />
              <Route path="track" element={<OrderTracking />} />
              <Route path="auth" element={<Auth />} />
              <Route path="account" element={<Account />} />
              <Route path="*" element={<NotFound />} />
            </Route>

            {/* Admin routes — AdminLayout added in Phase 6 */}
            <Route path="admin">
              <Route index element={<Dashboard />} />
              <Route path="products" element={<Products />} />
              <Route path="products/new" element={<ProductForm />} />
              <Route path="products/:id/edit" element={<ProductForm />} />
              <Route path="orders" element={<Orders />} />
              <Route path="orders/:id" element={<OrderDetail />} />
              <Route path="customers" element={<Customers />} />
              <Route path="discounts" element={<Discounts />} />
              <Route path="collections" element={<AdminCollections />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </Suspense>
      </ToastProvider>
    </BrowserRouter>
  );
}
