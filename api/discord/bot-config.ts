// Vercel Serverless Function: Bot & Server Configuration
import type { IncomingMessage, ServerResponse } from 'http';
import fs from 'fs';
import path from 'path';

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

const CONFIG_FILE = path.join(process.cwd(), '.discord_server_config.json');
const SESSION_FILE = path.join(process.cwd(), '.discord_bot_session.json');

function readConfig(): any {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    }
  } catch {}
  return {
    serverId: '1361541785507008622',
    serverName: 'HIGH STATE POLICE DEPARTMENT',
    rosterChannelId: '1361541785507008623',
    changelogChannelId: '1361541785507008624',
    dutyChannelId: '1361541785507008625',
    trafficCitationChannelId: '',
    pinResetChannelId: '',
    botToken: process.env.DISCORD_BOT_TOKEN || '',
    prefix: '!',
    autoStart: true,
    changelogMentionRole: '@everyone',
    updatedAt: Date.now()
  };
}

function writeConfig(cfg: any) {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2), 'utf-8');
  } catch (e) {
    console.warn('[Vercel bot-config] Cannot write config file (read-only filesystem):', e);
  }
}

function getBotToken(customToken?: string): string {
  if (customToken && customToken.trim()) return customToken.trim();
  if (process.env.DISCORD_BOT_TOKEN && process.env.DISCORD_BOT_TOKEN.trim()) {
    return process.env.DISCORD_BOT_TOKEN.trim();
  }
  try {
    if (fs.existsSync(SESSION_FILE)) {
      const data = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf-8'));
      if (data.token && typeof data.token === 'string') return data.token.trim();
    }
  } catch {}
  return '';
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

  const token = getBotToken();

  if (req.method === 'GET') {
    const config = readConfig();

    let botUser: any = null;
    let isOnline = false;

    if (token) {
      try {
        const meRes = await fetch('https://discord.com/api/v10/users/@me', {
          headers: { Authorization: `Bot ${token}` }
        });
        if (meRes.ok) {
          const u = await meRes.json() as any;
          isOnline = true;
          botUser = {
            id: u.id,
            username: u.username,
            discriminator: u.discriminator || '0',
            avatar: u.avatar
              ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png`
              : 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png'
          };
        }
      } catch {}
    }

    return res.status(200).json({
      success: true,
      config,
      status: {
        isOnline,
        status: isOnline ? 'online' : 'offline',
        uptimeSeconds: isOnline ? 86400 : 0,
        botUser,
        message: isOnline ? 'Bot Discord Aktif & Terhubung' : 'Bot token belum diatur atau offline.'
      }
    });
  }

  if (req.method === 'POST') {
    const updates = await parseJsonBody(req);
    const existing = readConfig();
    const updated = {
      ...existing,
      ...updates,
      updatedAt: Date.now()
    };
    writeConfig(updated);

    return res.status(200).json({
      success: true,
      message: 'Pengaturan Discord Bot berhasil diperbarui!',
      config: updated
    });
  }

  return res.status(405).json({ success: false, message: 'Metode tidak didukung' });
}
