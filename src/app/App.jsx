import { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router';
import StoreLayout from '../layouts/StoreLayout';
import {
  Home, Shop, ProductDetail, Collections, CollectionDetail,
  Lookbook, Checkout, OrderConfirmation, OrderTracking,
  Auth, Account, About, Contact, FAQ, Terms, Privacy, NotFound,
  AdminDashboard, AdminProducts, AdminProductForm, AdminOrders,
  AdminOrderDetail, AdminCustomers, AdminDiscounts, AdminCollections,
  AdminSettings,
} from './routes';

function PageLoader() {
  return (
    <div className="page-loader" style={{
      minHeight: '60vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div className="skeleton" style={{
        width: 48,
        height: 48,
        borderRadius: 2,
      }} />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Customer routes — wrapped in StoreLayout (Navbar + Footer) */}
          <Route element={<StoreLayout />}>
            <Route index element={<Home />} />
            <Route path="shop" element={<Shop />} />
            <Route path="shop/:category" element={<Shop />} />
            <Route path="product/:slug" element={<ProductDetail />} />
            <Route path="collections" element={<Collections />} />
            <Route path="collections/:slug" element={<CollectionDetail />} />
            <Route path="lookbook" element={<Lookbook />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="order/:id" element={<OrderConfirmation />} />
            <Route path="track" element={<OrderTracking />} />
            <Route path="auth" element={<Auth />} />
            <Route path="account" element={<Account />} />
            <Route path="about" element={<About />} />
            <Route path="contact" element={<Contact />} />
            <Route path="faq" element={<FAQ />} />
            <Route path="terms" element={<Terms />} />
            <Route path="privacy" element={<Privacy />} />
            <Route path="*" element={<NotFound />} />
          </Route>

          {/* Admin routes — separate layout (built in Phase 6) */}
          <Route path="admin">
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="products/new" element={<AdminProductForm />} />
            <Route path="products/:id/edit" element={<AdminProductForm />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="orders/:id" element={<AdminOrderDetail />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="discounts" element={<AdminDiscounts />} />
            <Route path="collections" element={<AdminCollections />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
