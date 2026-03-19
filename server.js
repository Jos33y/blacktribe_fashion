import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import compression from 'compression';
import helmet from 'helmet';
import cors from 'cors';
import { validateEnv } from './server/config/env.js';
import { errorHandler } from './server/middleware/errorHandler.js';

// Route imports
import cartRouter from './server/routes/cart.js';
import ordersRouter from './server/routes/orders.js';
import webhooksRouter from './server/routes/webhooks.js';
import authRouter from './server/routes/auth.js';
import wishlistRouter from './server/routes/wishlist.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Validate environment variables
validateEnv();

const app = express();
const PORT = process.env.PORT || 3000;
const isDev = process.env.NODE_ENV !== 'production';

// Middleware
app.use(compression());
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
app.use(cors({
  origin: isDev ? 'http://localhost:5173' : process.env.SITE_URL,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ success: true, timestamp: new Date().toISOString() });
});

app.use('/api/cart', cartRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/webhooks', webhooksRouter);
app.use('/api/auth', authRouter);
app.use('/api/wishlist', wishlistRouter);

// TODO: Mount as built in later phases
// app.use('/api/products', productsRouter);
// app.use('/api/collections', collectionsRouter);
// app.use('/api/newsletter', newsletterRouter);
// app.use('/api/admin', adminRouter);

// Serve static files in production
if (!isDev) {
  app.use(express.static(path.join(__dirname, 'dist')));

  // Express 5: wildcards must be named
  app.get('/{*splat}', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

// Error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[server] Running on port ${PORT} | ${isDev ? 'development' : 'production'}`);
});

export default app;
