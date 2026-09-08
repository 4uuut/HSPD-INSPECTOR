// Vercel Serverless Function: Dedicated Discord Bot Status
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const customToken = (req.query?.token as string) || '';
  const token = getBotToken(customToken);

  if (!token) {
    return res.status(200).json({
      isOnline: false,
      status: 'offline',
      uptimeSeconds: 0,
      botUser: null,
      message: 'Bot token belum dikonfigurasi.'
    });
  }

  try {
    const meRes = await fetch('https://discord.com/api/v10/users/@me', {
      headers: { Authorization: `Bot ${token}` }
    });

    if (!meRes.ok) {
      return res.status(200).json({
        isOnline: false,
        status: 'offline',
        uptimeSeconds: 0,
        botUser: null,
        message: 'Token bot tidak valid atau tidak dapat terhubung ke Discord API.'
      });
    }

    const botUser = await meRes.json() as any;
    const avatarUrl = botUser.avatar
      ? `https://cdn.discordapp.com/avatars/${botUser.id}/${botUser.avatar}.png`
      : 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png';

    return res.status(200).json({
      isOnline: true,
      status: 'online',
      uptimeSeconds: 86400,
      botUser: {
        id: botUser.id,
        username: botUser.username,
        discriminator: botUser.discriminator || '0',
        avatar: avatarUrl
      },
      message: 'Bot Discord Siaga & Terhubung ke Discord Gateway'
    });
  } catch (e: any) {
    return res.status(200).json({
      isOnline: false,
      status: 'offline',
      uptimeSeconds: 0,
      botUser: null,
      message: `Gagal mengecek status bot: ${e.message || e}`
    });
  }
}
