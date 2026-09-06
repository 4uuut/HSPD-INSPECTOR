import express from 'express';
import { apiRouter } from '../server/apiRoutes.ts';

const app = express();

// Top-level CORS
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

// Immediate direct health check endpoints
app.get(['/api/health', '/health', '/api'], (req, res) => {
  res.json({
    status: 'ok',
    platform: 'vercel',
    service: 'HSPD Discord API Backend',
    time: new Date().toISOString()
  });
});

// Mount router on /api and root so both /api/... and direct routing works on Vercel
app.use('/api', apiRouter);
app.use('/', apiRouter);

// Global error handler so Vercel never returns raw FUNCTION_INVOCATION_FAILED
app.use((err: any, req: any, res: any, next: any) => {
  console.error('[Vercel Serverless Error]:', err);
  res.status(500).json({
    success: false,
    error: err?.message || 'Internal Server Error',
    platform: 'vercel'
  });
});

export default app;

