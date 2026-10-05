import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { app as backendApp } from './backend/src/app.ts';
import { initDatabase } from './backend/src/database/connection.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const PORT = parseInt(process.env.PORT || '3000', 10);

async function startServer() {
  // 1. Initialize SQLite Database (backend/data/college-cms.sqlite)
  initDatabase();

  const app = express();

  // 2. Mount backend Express app (handles /api, /api/health, /api/auth, /api/complaints)
  app.use(backendApp);

  // 3. Mount Vite middlewares in dev, or static files in production
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      root: path.resolve(__dirname, 'frontend'),
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = fs.existsSync(path.resolve(__dirname, 'dist'))
      ? path.resolve(__dirname, 'dist')
      : path.resolve(__dirname, 'frontend/dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Full-stack server running on http://0.0.0.0:${PORT}`);
    console.log(`API Health: http://localhost:${PORT}/api/health`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
