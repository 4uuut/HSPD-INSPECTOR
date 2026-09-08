// Vercel Serverless Function: Dedicated Discord Lookup User
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

function getBotToken(customToken?: string): string {
  if (customToken && customToken.trim()) return customToken.trim();
  if (process.env.DISCORD_BOT_TOKEN && process.env.DISCORD_BOT_TOKEN.trim()) {
    return process.env.DISCORD_BOT_TOKEN.trim();
  }
  try {
    const sessionFile = path.join(process.cwd(), '.discord_bot_session.json');
    if (fs.existsSync(sessionFile)) {
      const data = JSON.parse(fs.readFileSync(sessionFile, 'utf-8'));
      if (data.token && typeof data.token === 'string') {
        return data.token.trim();
      }
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

  const queryParam = (req.query?.query as string) || '';
  const body = req.method === 'POST' ? await parseJsonBody(req) : {};
  const query = (queryParam || body.query || body.username || body.userId || '').toString().trim();
  const token = getBotToken(body.botToken || (req.query?.botToken as string));

  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'Bot Token belum dikonfigurasi!'
    });
  }

  if (!query) {
    return res.status(400).json({
      success: false,
      message: 'Parameter query username atau ID Discord tidak boleh kosong.'
    });
  }

  const clean = query.replace(/^@+/, '').trim();
  const numericOnly = clean.replace(/[^0-9]/g, '');

  if (numericOnly.length >= 16 && numericOnly.length <= 22 && /^\d+$/.test(clean)) {
    try {
      const userRes = await fetch(`https://discord.com/api/v10/users/${numericOnly}`, {
        headers: { Authorization: `Bot ${token}` }
      });
      if (userRes.ok) {
        const u = await userRes.json() as any;
        const avatarUrl = u.avatar
          ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png`
          : `https://cdn.discordapp.com/embed/avatars/${(parseInt(u.discriminator || '0', 10) || 0) % 5}.png`;
        return res.status(200).json({
          success: true,
          user: {
            id: u.id,
            username: u.username,
            globalName: u.global_name || null,
            tag: u.discriminator && u.discriminator !== '0' ? `${u.username}#${u.discriminator}` : `@${u.username}`,
            avatarUrl
          }
        });
      }
    } catch {}
  }

  try {
    const guildsRes = await fetch('https://discord.com/api/v10/users/@me/guilds', {
      headers: { Authorization: `Bot ${token}` }
    });
    if (!guildsRes.ok) {
      return res.status(400).json({
        success: false,
        message: 'Gagal mengakses guild Bot Discord. Pastikan token valid.'
      });
    }

    const guilds = await guildsRes.json() as Array<{ id: string; name: string }>;
    for (const g of guilds) {
      const searchRes = await fetch(
        `https://discord.com/api/v10/guilds/${g.id}/members/search?query=${encodeURIComponent(clean)}&limit=5`,
        { headers: { Authorization: `Bot ${token}` } }
      );
      if (searchRes.ok) {
        const members = await searchRes.json() as any[];
        if (members && members.length > 0) {
          const m = members[0];
          const u = m.user;
          const avatarUrl = u.avatar
            ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png`
            : `https://cdn.discordapp.com/embed/avatars/${(parseInt(u.discriminator || '0', 10) || 0) % 5}.png`;
          return res.status(200).json({
            success: true,
            user: {
              id: u.id,
              username: u.username,
              globalName: u.global_name || m.nick || null,
              tag: u.discriminator && u.discriminator !== '0' ? `${u.username}#${u.discriminator}` : `@${u.username}`,
              avatarUrl
            }
          });
        }
      }
    }

    return res.status(404).json({
      success: false,
      message: `User '${query}' tidak ditemukan di server Discord Bot.`
    });
  } catch (e: any) {
    return res.status(500).json({
      success: false,
      message: `Gagal mencari user: ${e.message || e}`
    });
  }
}
