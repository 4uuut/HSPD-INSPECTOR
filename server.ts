import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { discordGatewayManager } from './server/discordBotService.ts';
import { apiRouter } from './server/apiRoutes.ts';

dotenv.config();

// Prevent unhandled WebSocket / network events from crashing the server
process.on('uncaughtException', (err: any) => {
  const msg = err?.message || String(err);
  if (msg.includes('WebSocket') || err?.code === 'ECONNRESET' || err?.code === 'ETIMEDOUT') {
    console.warn('[Server Gateway] Suppressed non-fatal WebSocket/network exception:', msg);
    return;
  }
  console.error('[Server] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason: any) => {
  const msg = reason?.message || String(reason);
  console.warn('[Server] Handled unhandled promise rejection:', msg);
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  app.use(express.json({ limit: '15mb' }));

  // Initialize Discord Gateway WebSocket to keep bot ONLINE (Green) 24/7
  discordGatewayManager.init();

  // API routes (both /api and direct router)
  app.use('/api', apiRouter);

  // Vite middleware for dev or Static Files for prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
