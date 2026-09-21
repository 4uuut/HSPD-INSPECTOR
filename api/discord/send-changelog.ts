// Vercel Serverless Function: Dedicated Send Changelog / Announcement
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

let cachedBotToken = process.env.DISCORD_BOT_TOKEN || '';

function getBotToken(customToken?: string): string {
  if (customToken && customToken.trim()) {
    cachedBotToken = customToken.trim();
    return cachedBotToken;
  }
  if (cachedBotToken) return cachedBotToken;
  if (process.env.DISCORD_BOT_TOKEN && process.env.DISCORD_BOT_TOKEN.trim()) {
    cachedBotToken = process.env.DISCORD_BOT_TOKEN.trim();
    return cachedBotToken;
  }
  try {
    const sessionFile = path.join(process.cwd(), '.discord_bot_session.json');
    if (fs.existsSync(sessionFile)) {
      const data = JSON.parse(fs.readFileSync(sessionFile, 'utf-8'));
      if (data.token && typeof data.token === 'string') {
        cachedBotToken = data.token.trim();
        return cachedBotToken;
      }
    }
  } catch {}
  return '';
}

function getServerConfig(): any {
  try {
    const cfgPath = path.join(process.cwd(), '.discord_server_config.json');
    if (fs.existsSync(cfgPath)) {
      return JSON.parse(fs.readFileSync(cfgPath, 'utf-8'));
    }
  } catch {}
  return {};
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
    const {
      version,
      title,
      newFeatures,
      improvements,
      bugFixes,
      extraNotes,
      mentionRole,
      channelId,
      webhookUrl,
      authorName,
      authorBadge,
      authorRank,
      headerText,
      customDescription,
      embedColor,
      botToken
    } = body || {};

    const cleanFeatures: string[] = Array.isArray(newFeatures)
      ? newFeatures.filter((f: any) => typeof f === 'string' && f.trim().length > 0)
      : [];
    const cleanImprovements: string[] = Array.isArray(improvements)
      ? improvements.filter((f: any) => typeof f === 'string' && f.trim().length > 0)
      : [];
    const cleanBugFixes: string[] = Array.isArray(bugFixes)
      ? bugFixes.filter((f: any) => typeof f === 'string' && f.trim().length > 0)
      : [];

    if (cleanFeatures.length === 0 && cleanImprovements.length === 0 && cleanBugFixes.length === 0 && !extraNotes) {
      return res.status(400).json({
        success: false,
        message: 'Harap isi minimal satu poin perubahan (Fitur Baru, Peningkatan, atau Perbaikan Bug)!'
      });
    }

    const now = new Date();
    const dateFormatted = now.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const fields: Array<{ name: string; value: string; inline?: boolean }> = [];
    if (cleanFeatures.length > 0) {
      fields.push({
        name: '🚀 Fitur Baru (New Features)',
        value: cleanFeatures.map(f => `• ${f.trim()}`).join('\n'),
        inline: false
      });
    }
    if (cleanImprovements.length > 0) {
      fields.push({
        name: '⚡ Peningkatan Sistem (Improvements)',
        value: cleanImprovements.map(f => `• ${f.trim()}`).join('\n'),
        inline: false
      });
    }
    if (cleanBugFixes.length > 0) {
      fields.push({
        name: '🛠️ Perbaikan Bug (Bug Fixes)',
        value: cleanBugFixes.map(f => `• ${f.trim()}`).join('\n'),
        inline: false
      });
    }
    if (extraNotes && String(extraNotes).trim()) {
      fields.push({
        name: '📝 Catatan Rilis & Panduan',
        value: String(extraNotes).trim(),
        inline: false
      });
    }

    const effectiveMention = (mentionRole && mentionRole !== 'none' && mentionRole !== 'off')
      ? `${mentionRole} `
      : '';
    const headerTag = headerText?.trim() || '[ PENGUMUMAN PEMBARUAN SISTEM MDT HSPD ]';
    const finalTitle = `📢 ${title || 'Pembaruan Sistem MDT HSPD'} • [${version || 'v3.4.0'}]`;
    const defaultDesc = `Catatan rilis pembaruan perangkat lunak, penyempurnaan operasional, dan perbaikan kestabilan Terminal Mobile Data Computer (MDC) HSPD.\n\n📅 **Waktu Rilis:** \`${dateFormatted}\`\n👤 **Dipublikasikan Oleh:** \`${authorName || 'High Command'}\` ${authorBadge ? `(\`${authorBadge}\`)` : ''}`;
    const finalDesc = customDescription?.trim()
      ? `${customDescription.trim()}\n\n📅 **Waktu Rilis:** \`${dateFormatted}\`\n👤 **Dipublikasikan Oleh:** \`${authorName || 'High Command'}\` ${authorBadge ? `(\`${authorBadge}\`)` : ''}`
      : defaultDesc;

    let parsedColor = 0x00A8FF;
    if (typeof embedColor === 'number') {
      parsedColor = embedColor;
    } else if (typeof embedColor === 'string') {
      const cleanHex = embedColor.replace('#', '').trim();
      const num = parseInt(cleanHex, 16);
      if (!isNaN(num)) parsedColor = num;
    }

    const embedPayload = {
      author: {
        name: 'High State Police Department • Official System Release',
        icon_url: 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png'
      },
      title: finalTitle.substring(0, 256),
      description: finalDesc.substring(0, 4096),
      color: parsedColor,
      fields,
      footer: {
        text: `HSPD MDC System • ${version || 'v3.4.0'} • High State Government`,
        icon_url: 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png'
      },
      timestamp: now.toISOString()
    };

    const messageContent = effectiveMention ? `${effectiveMention}**${headerTag}**` : `**${headerTag}**`;

    // 1. Try sending via Discord Bot REST API if Bot Token is available
    const token = getBotToken(botToken);
    const srvConfig = getServerConfig();
    const targetChannel = channelId || srvConfig.changelogChannelId;

    if (token && targetChannel) {
      try {
        const botSendRes = await fetch(`https://discord.com/api/v10/channels/${targetChannel}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bot ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            content: messageContent,
            embeds: [embedPayload]
          })
        });

        if (botSendRes.ok) {
          return res.status(200).json({
            success: true,
            message: `Pembaruan [${version || 'v3.4.0'}] berhasil disiarkan ke Discord channel <#${targetChannel}> via Bot!`,
            channelId: targetChannel,
            method: 'discord_bot'
          });
        }
      } catch (err: any) {
        console.warn('[Vercel send-changelog] Failed via bot channel, trying webhook fallback:', err?.message);
      }
    }

    // 2. Fallback to Discord Webhook
    const targetWebhook = (webhookUrl && typeof webhookUrl === 'string' && webhookUrl.startsWith('https://discord.com/api/webhooks/'))
      ? webhookUrl.trim()
      : srvConfig.changelogWebhookUrl;

    if (targetWebhook) {
      try {
        const hookRes = await fetch(targetWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: messageContent,
            embeds: [embedPayload]
          })
        });

        if (hookRes.ok) {
          return res.status(200).json({
            success: true,
            message: `Pembaruan [${version || 'v3.4.0'}] berhasil dipublikasikan ke Discord melalui Webhook!`,
            method: 'discord_webhook'
          });
        }

        const hookErr = await hookRes.json().catch(() => ({}));
        return res.status(400).json({
          success: false,
          message: `Discord Webhook menolak permintaan: ${hookErr.message || hookRes.statusText}`
        });
      } catch (err: any) {
        return res.status(500).json({
          success: false,
          message: `Gagal mengirim ke Webhook Discord: ${err?.message || err}`
        });
      }
    }

    // If neither bot token+channel nor webhook is available
    return res.status(400).json({
      success: false,
      message: 'Channel Discord Bot belum diatur dan Webhook URL Pembaruan belum dikonfigurasi. Silakan isi Webhook URL di pengaturan atau atur channel bot.'
    });

  } catch (err: any) {
    console.error('[Vercel send-changelog Error]:', err);
    return res.status(500).json({
      success: false,
      message: `Terjadi kesalahan saat memproses pengumuman: ${err?.message || err}`
    });
  }
}
