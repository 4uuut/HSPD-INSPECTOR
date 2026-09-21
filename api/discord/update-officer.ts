// Dedicated Vercel Serverless Function: Update Officer (Atomic update without duplicates)
import type { IncomingMessage, ServerResponse } from 'http';
import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, collection, doc, setDoc, getDocs, deleteDoc } from 'firebase/firestore';

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
    const { originalBadge, originalName, originalId, officer } = body || {};

    if (!officer || !officer.name || !officer.badge) {
      return res.status(400).json({ success: false, message: 'Data petugas tidak lengkap.' });
    }

    const backupPath = path.join(process.cwd(), '.discord_registered_officers.json');
    let localOfficers: any[] = [];
    try {
      if (fs.existsSync(backupPath)) {
        localOfficers = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));
      }
    } catch {}

    const targetBadge = (originalBadge || officer.badge || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase().trim();
    const targetName = (originalName || officer.name || '').toLowerCase().trim();
    const targetId = (originalId || officer.id || '').trim();

    let existingIndex = -1;
    for (let i = 0; i < localOfficers.length; i++) {
      const o = localOfficers[i];
      const oBadge = (o.badge || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase().trim();
      const oName = (o.name || '').toLowerCase().trim();
      const oId = (o.id || '').trim();

      if (targetId && oId && targetId === oId) {
        existingIndex = i;
        break;
      }
      if (targetBadge && oBadge && targetBadge === oBadge) {
        existingIndex = i;
        break;
      }
      if (targetName && oName && targetName === oName) {
        existingIndex = i;
        break;
      }
    }

    const now = Date.now();
    const cleanUpdatedOfficer = {
      ...officer,
      id: (existingIndex >= 0 && localOfficers[existingIndex].id) || officer.id || `roster-${now}-${Math.random().toString(36).substring(2, 6)}`,
      _updatedAt: now
    };

    if (existingIndex >= 0) {
      localOfficers[existingIndex] = {
        ...localOfficers[existingIndex],
        ...cleanUpdatedOfficer
      };
    } else {
      localOfficers.unshift(cleanUpdatedOfficer);
    }

    try {
      fs.writeFileSync(backupPath, JSON.stringify(localOfficers, null, 2), 'utf-8');
    } catch {}

    // Firestore sync
    const db = getServerDb();
    if (db) {
      try {
        const targetDocId = cleanUpdatedOfficer.id;
        const targetDocRef = doc(db, 'roster', targetDocId);
        await setDoc(targetDocRef, cleanUpdatedOfficer, { merge: true });

        // Clean up old stale documents if badge/id changed
        if (originalId && originalId !== targetDocId) {
          try {
            await deleteDoc(doc(db, 'roster', originalId));
          } catch {}
        }
      } catch (e: any) {
        console.warn('[Vercel update-officer] Firestore write warning (using local backup):', e?.message || e);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Data petugas ${cleanUpdatedOfficer.name} (${cleanUpdatedOfficer.badge}) berhasil diperbarui!`,
      officer: cleanUpdatedOfficer
    });

  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: `Gagal memperbarui data petugas: ${err?.message || err}`
    });
  }
}
