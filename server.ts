import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { discordGatewayManager } from './server/discordBotService.ts';
import { apiRouter } from './server/apiRoutes.ts';

dotenv.config();

// Prevent unhandled WebSocket / network events from crashing the server
process.on('uncaughtException', (err: any) => {
  const msg = err?.message || String(err);
  if (msg.includes('WebSocket') || err?.code === 'ECONNRESET' || err?.code === 'ETIMEDOUT' || err?.code === 'EADDRINUSE') {
    console.warn('[Server Gateway] Suppressed non-fatal exception:', msg);
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
  const DEFAULT_PORT = 3000;

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
  try {
    discordGatewayManager.init();
  } catch (botErr) {
    console.warn('[Server] Discord Gateway init warning:', botErr);
  }

  // Health check endpoints for Cloud Run & container orchestration probes
  app.get(['/health', '/api/health', '/_healthz'], (req, res) => {
    res.status(200).json({ status: 'ok', time: new Date().toISOString() });
  });

  // API routes (both /api and direct router)
  app.use('/api', apiRouter);

  // Vite middleware for dev or Static Files for prod
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = fs.existsSync(path.join(process.cwd(), 'dist'))
      ? path.join(process.cwd(), 'dist')
      : (fs.existsSync(path.join(__dirname, 'index.html')) ? __dirname : path.join(process.cwd(), 'dist'));
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(200).send('<!DOCTYPE html><html><head><title>MDC HSPD</title></head><body>Application starting...</body></html>');
      }
    });
  }

  // Primary listener on port 3000 (standard dev environment & internal reverse proxy)
  const primaryServer = app.listen(DEFAULT_PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${DEFAULT_PORT}`);
  });
  primaryServer.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${DEFAULT_PORT} already in use; secondary port listener will handle traffic.`);
    } else {
      console.warn(`Primary port listener warning:`, err.message);
    }
  });

  // Cloud Run sets the PORT environment variable (commonly 8080) for ingress traffic
  const envPort = process.env.PORT ? parseInt(process.env.PORT, 10) : null;
  if (envPort && envPort !== DEFAULT_PORT && !isNaN(envPort)) {
    try {
      const secondaryServer = app.listen(envPort, '0.0.0.0', () => {
        console.log(`Cloud Run container ingress listening on http://0.0.0.0:${envPort}`);
      });
      secondaryServer.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          console.log(`Port ${envPort} already bound (e.g. dev reverse proxy). Port ${DEFAULT_PORT} remains active.`);
        } else {
          console.warn(`Additional port listener warning:`, err.message);
        }
      });
    } catch (err: any) {
      console.warn(`Could not start secondary port listener:`, err.message);
    }
  }
}

startServer();
