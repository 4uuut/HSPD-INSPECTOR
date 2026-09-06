import express from 'express';
import { apiRouter } from '../server/apiRoutes.ts';

const app = express();

app.use(express.json({ limit: '15mb' }));

// Mount router on /api and root so both /api/... and direct routing works on Vercel
app.use('/api', apiRouter);
app.use('/', apiRouter);

export default app;
