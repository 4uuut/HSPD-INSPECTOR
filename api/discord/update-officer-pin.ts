// Dedicated Vercel Serverless Function: Update Officer PIN
import type { IncomingMessage, ServerResponse } from 'http';
import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, collection, doc, setDoc, getDocs } from 'firebase/firestore';

interface VercelRequest extends IncomingMessage {
  query: Record<string, string | string[]>;
  cookies: Record<string, string>;
  body: any;
}

interface VercelResponse extends ServerResponse {
  status: (code: number) => VercelResponse;
  json: (data: any) => void;
  send: (data: any) => void;
}

let serverFirestoreDb: any = null;
function getServerDb() {
  if (serverFirestoreDb) return serverFirestoreDb;
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      const app = getApps().length === 0 ? initializeApp(config) : getApp();
      const dbId = config.firestoreDatabaseId || '(default)';
      serverFirestoreDb = initializeFirestore(app, {
        experimentalForceLongPolling: true,
        ignoreUndefinedProperties: true,
      }, dbId);
      return serverFirestoreDb;
    }
  } catch (err) {
    console.warn('[Vercel API] Failed to initialize Firestore:', err);
  }
  return null;
}

async function parseJsonBody(req: VercelRequest): Promise<any> {
  if (req.body && typeof req.body === 'object') return req.body;
  if (req.body && typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Hanya metode POST yang didukung' });
  }

  try {
    const body = await parseJsonBody(req);
    const { name, badge, newPin, pin } = body || {};
    const finalPin = (newPin || pin || '').toString().trim();

    if (!finalPin) {
      return res.status(400).json({ success: false, message: 'PIN baru wajib diisi.' });
    }

    const backupPath = path.join(process.cwd(), '.discord_registered_officers.json');
    let localOfficers: any[] = [];
    try {
      if (fs.existsSync(backupPath)) {
        localOfficers = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));
      }
    } catch {}

    const cleanBadge = (badge || '').replace(/[^0-9a-zA-Z]/g, '').toLowerCase().trim();
    const cleanName = (name || '').toLowerCase().trim();

    let matched: any = null;
    for (let i = 0; i < localOfficers.length; i++) {
      const o = localOfficers[i];
      const oBadge = (o.badge || '').replace(/[^0-9a-zA-Z]/g, '').toLowerCase().trim();
      const oName = (o.name || '').toLowerCase().trim();

      if ((cleanBadge && oBadge === cleanBadge) || (cleanName && oName === cleanName)) {
        matched = o;
        localOfficers[i] = {
          ...o,
          pin: finalPin,
          _updatedAt: Date.now()
        };
        break;
      }
    }

    try {
      fs.writeFileSync(backupPath, JSON.stringify(localOfficers, null, 2), 'utf-8');
    } catch {}

    // Firestore sync
    const db = getServerDb();
    if (db && matched) {
      try {
        const docKey = matched.id || String(matched.badge).replace(/[^a-zA-Z0-9_-]/g, '_');
        await setDoc(doc(db, 'roster', docKey), {
          pin: finalPin,
          _updatedAt: Date.now()
        }, { merge: true });
      } catch (e: any) {
        console.warn('[Vercel update-officer-pin] Firestore write warning:', e?.message || e);
      }
    }

    return res.status(200).json({
      success: true,
      message: `PIN Petugas ${name || badge || ''} berhasil diperbarui menjadi ${finalPin}.`
    });

  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: `Gagal memperbarui PIN: ${err?.message || err}`
    });
  }
}
