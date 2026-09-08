// Vercel Serverless Catch-All API Handler
// Handles all /api/* requests reliably without relying on Express routing mismatches or persistent WebSockets.

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

// In-memory token cache for serverless invocations
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

function saveBotToken(token: string) {
  if (!token) return;
  cachedBotToken = token.trim();
  try {
    const sessionFile = path.join(process.cwd(), '.discord_bot_session.json');
    fs.writeFileSync(sessionFile, JSON.stringify({ token: cachedBotToken, updatedAt: Date.now() }), 'utf-8');
  } catch {}
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

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1];
      else dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

async function resolveDiscordUser(query: string, token: string) {
  const clean = query.trim();
  const numericOnly = clean.replace(/[^0-9]/g, '');

  if (numericOnly.length >= 16 && numericOnly.length <= 22 && !clean.includes('@') && !clean.includes(' ') && /^\d+$/.test(clean)) {
    try {
      const userRes = await fetch(`https://discord.com/api/v10/users/${numericOnly}`, {
        headers: { Authorization: `Bot ${token}` }
      });
      if (userRes.ok) {
        const u = await userRes.json() as any;
        const avatarUrl = u.avatar
          ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png`
          : `https://cdn.discordapp.com/embed/avatars/${(parseInt(u.discriminator || '0', 10) || 0) % 5}.png`;
        return {
          success: true,
          user: {
            id: u.id,
            username: u.username,
            globalName: u.global_name || null,
            tag: u.discriminator && u.discriminator !== '0' ? `${u.username}#${u.discriminator}` : `@${u.username}`,
            avatarUrl
          }
        };
      }
    } catch {}
    return {
      success: true,
      user: {
        id: numericOnly,
        username: numericOnly,
        globalName: null,
        tag: numericOnly,
        avatarUrl: 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png'
      }
    };
  }

  const stripped = clean.replace(/^@+/, '').trim();
  const [targetUsername] = stripped.split('#');
  const targetLower = targetUsername.toLowerCase().trim();

  try {
    const guildsRes = await fetch('https://discord.com/api/v10/users/@me/guilds', {
      headers: { Authorization: `Bot ${token}` }
    });

    if (!guildsRes.ok) {
      const errJson = await guildsRes.json().catch(() => ({}));
      return { 
        success: false, 
        message: `Gagal mengakses server Discord Bot: ${errJson.message || guildsRes.statusText}. Pastikan Bot Token valid.` 
      };
    }

    const guilds = await guildsRes.json() as Array<{ id: string; name: string }>;
    if (!guilds || guilds.length === 0) {
      return {
        success: false,
        message: 'Bot belum diundang ke server/guild Discord manapun! Undang bot ke server Discord Anda terlebih dahulu.'
      };
    }

    let candidateUser: any = null;

    for (const guild of guilds) {
      try {
        const searchRes = await fetch(
          `https://discord.com/api/v10/guilds/${guild.id}/members/search?query=${encodeURIComponent(targetUsername)}&limit=10`,
          { headers: { Authorization: `Bot ${token}` } }
        );

        if (!searchRes.ok) continue;

        const members = await searchRes.json() as Array<{
          nick?: string;
          user: {
            id: string;
            username: string;
            discriminator?: string;
            global_name?: string;
            avatar?: string;
          }
        }>;

        for (const m of members) {
          const u = m.user;
          const uNameLower = (u.username || '').toLowerCase();
          const gNameLower = (u.global_name || '').toLowerCase();
          const nickLower = (m.nick || '').toLowerCase();

          const isExact = uNameLower === targetLower || gNameLower === targetLower || nickLower === targetLower;
          const avatarUrl = u.avatar
            ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png`
            : `https://cdn.discordapp.com/embed/avatars/${(parseInt(u.discriminator || '0', 10) || 0) % 5}.png`;

          const resolved = {
            id: u.id,
            username: u.username,
            globalName: u.global_name || m.nick || null,
            tag: u.discriminator && u.discriminator !== '0' ? `${u.username}#${u.discriminator}` : `@${u.username}`,
            avatarUrl
          };

          if (isExact) return { success: true, user: resolved };
          if (!candidateUser) candidateUser = resolved;
        }

        // Fallback: list recent members
        if (!candidateUser) {
          const listRes = await fetch(
            `https://discord.com/api/v10/guilds/${guild.id}/members?limit=100`,
            { headers: { Authorization: `Bot ${token}` } }
          );
          if (listRes.ok) {
            const listMembers = await listRes.json() as any[];
            let closestUser: any = null;
            let lowestDist = 999;

            for (const m of listMembers) {
              const u = m.user;
              if (!u) continue;
              const uNameLower = (u.username || '').toLowerCase();
              const gNameLower = (u.global_name || '').toLowerCase();
              const nickLower = (m.nick || '').toLowerCase();

              const avatarUrl = u.avatar
                ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png`
                : `https://cdn.discordapp.com/embed/avatars/${(parseInt(u.discriminator || '0', 10) || 0) % 5}.png`;

              const resUser = {
                id: u.id,
                username: u.username,
                globalName: u.global_name || m.nick || null,
                tag: u.discriminator && u.discriminator !== '0' ? `${u.username}#${u.discriminator}` : `@${u.username}`,
                avatarUrl
              };

              if (uNameLower === targetLower || gNameLower === targetLower || nickLower === targetLower) {
                return { success: true, user: resUser };
              }
              if (uNameLower.includes(targetLower) || targetLower.includes(uNameLower)) {
                if (!candidateUser) candidateUser = resUser;
              }
              const d1 = Math.abs(uNameLower.length - targetLower.length) <= 3 ? levenshtein(uNameLower, targetLower) : 999;
              const d2 = gNameLower ? levenshtein(gNameLower, targetLower) : 999;
              const bestD = Math.min(d1, d2);
              if (bestD <= 2 && bestD < lowestDist) {
                lowestDist = bestD;
                closestUser = resUser;
              }
            }
            if (!candidateUser && closestUser) candidateUser = closestUser;
          }
        }
      } catch (err) {
        console.warn(`[Discord Lookup Vercel] Guild error:`, err);
      }
    }

    if (candidateUser) return { success: true, user: candidateUser };

    return {
      success: false,
      message: `User Discord dengan username '${clean}' tidak ditemukan di server tempat Bot berada. Pastikan akun tersebut sudah berada di server yang sama dengan Bot!`
    };
  } catch (err: any) {
    return { success: false, message: `Gagal mencari user di Discord: ${err.message || err}` };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 2. Resolve request path
  const rawUrl = req.url || '';
  const urlPath = rawUrl.split('?')[0] || '';
  let cleanPath = urlPath;
  if (cleanPath.startsWith('/api/')) cleanPath = cleanPath.substring(4);
  else if (cleanPath === '/api') cleanPath = '/health';

  try {
    // -------------------------------------------------------------
    // HEALTH CHECK
    // -------------------------------------------------------------
    if (cleanPath === '/health' || cleanPath === '/' || cleanPath === '') {
      return res.status(200).json({
        status: 'ok',
        platform: 'vercel',
        service: 'HSPD Discord API Backend',
        time: new Date().toISOString()
      });
    }

    // -------------------------------------------------------------
    // DISCORD BOT STATUS
    // -------------------------------------------------------------
    if (cleanPath === '/discord/bot-status') {
      let queryToken = '';
      try {
        const parsedUrl = new URL(rawUrl, 'http://localhost');
        queryToken = parsedUrl.searchParams.get('token') || parsedUrl.searchParams.get('botToken') || '';
      } catch {}

      const token = getBotToken(queryToken);
      if (!token) {
        return res.status(200).json({
          isOnline: false,
          status: 'offline',
          botUser: null,
          hasToken: false,
          lastError: 'Bot Token belum dikonfigurasi',
          platform: 'vercel'
        });
      }

      try {
        const meRes = await fetch('https://discord.com/api/v10/users/@me', {
          headers: { Authorization: `Bot ${token}` }
        });
        if (meRes.ok) {
          const botUser = await meRes.json();
          saveBotToken(token);
          return res.status(200).json({
            isOnline: true,
            status: 'online',
            botUser,
            hasToken: true,
            uptimeSeconds: 9999,
            platform: 'vercel',
            message: 'Bot Online & Selalu Aktif Otomatis (Vercel Serverless)'
          });
        }
      } catch (err: any) {
        console.warn('Bot status check error:', err?.message);
      }

      return res.status(200).json({
        isOnline: false,
        status: 'offline',
        botUser: null,
        hasToken: Boolean(token),
        lastError: 'Gagal memverifikasi token ke Discord API',
        platform: 'vercel'
      });
    }

    // -------------------------------------------------------------
    // DISCORD BOT START
    // -------------------------------------------------------------
    if (cleanPath === '/discord/bot-start') {
      const body = await parseJsonBody(req);
      const tokenToUse = getBotToken(body.botToken || body.token);

      if (!tokenToUse) {
        return res.status(400).json({
          success: false,
          message: 'Token Bot Discord tidak boleh kosong!'
        });
      }

      try {
        const meRes = await fetch('https://discord.com/api/v10/users/@me', {
          headers: { Authorization: `Bot ${tokenToUse}` }
        });

        if (!meRes.ok) {
          const errJson = await meRes.json().catch(() => ({}));
          return res.status(400).json({
            success: false,
            message: `Token ditolak oleh Discord API: ${errJson.message || meRes.statusText}`
          });
        }

        const botUser = await meRes.json();
        saveBotToken(tokenToUse);

        return res.status(200).json({
          success: true,
          message: `✅ Bot Discord @${botUser.username} berhasil diaktifkan (Online Hijau) & siap mengirim PM!`,
          botUser,
          isOnline: true,
          platform: 'vercel'
        });
      } catch (err: any) {
        return res.status(500).json({
          success: false,
          message: `Gagal menghubungi Discord API: ${err.message || err}`
        });
      }
    }

    // -------------------------------------------------------------
    // DISCORD BOT STOP
    // -------------------------------------------------------------
    if (cleanPath === '/discord/bot-stop') {
      return res.status(200).json({
        success: true,
        message: 'Bot Discord dinonaktifkan.',
        platform: 'vercel'
      });
    }

    // -------------------------------------------------------------
    // DISCORD LOOKUP USER
    // -------------------------------------------------------------
    if (cleanPath === '/discord/lookup-user') {
      const body = await parseJsonBody(req);
      const query = (body.query || body.username || '').toString().trim();
      const token = getBotToken(body.botToken);

      if (!query) {
        return res.status(400).json({ success: false, message: 'Parameter query / username tidak boleh kosong!' });
      }
      if (!token) {
        return res.status(400).json({ success: false, message: 'Bot Token belum dikonfigurasi!' });
      }

      const result = await resolveDiscordUser(query, token);
      return res.status(result.success ? 200 : 400).json(result);
    }

    // -------------------------------------------------------------
    // DISCORD CHANNELS
    // -------------------------------------------------------------
    if (cleanPath === '/discord/channels') {
      const token = getBotToken(req.query.botToken as string);
      if (!token) {
        return res.status(400).json({ success: false, message: 'Bot Token belum dikonfigurasi!' });
      }

      const guildsRes = await fetch('https://discord.com/api/v10/users/@me/guilds', {
        headers: { Authorization: `Bot ${token}` }
      });
      if (!guildsRes.ok) {
        return res.status(400).json({ success: false, message: 'Gagal mengambil server bot.' });
      }
      const guilds = await guildsRes.json() as any[];
      const channelsList: any[] = [];
      for (const g of guilds) {
        const chRes = await fetch(`https://discord.com/api/v10/guilds/${g.id}/channels`, {
          headers: { Authorization: `Bot ${token}` }
        });
        if (chRes.ok) {
          const chs = await chRes.json() as any[];
          for (const c of chs) {
            if (c.type === 0 || c.type === 5) {
              channelsList.push({ id: c.id, name: c.name, guildName: g.name, type: c.type });
            }
          }
        }
      }
      return res.status(200).json({ success: true, channels: channelsList });
    }

    // -------------------------------------------------------------
    // DISCORD SEND BOT DIRECT MESSAGE (PM / DM)
    // -------------------------------------------------------------
    if (cleanPath === '/discord/send-bot-dm') {
      const body = await parseJsonBody(req);
      const {
        botToken,
        userId,
        discordUsername,
        username,
        officerName,
        pin,
        badge,
        rank,
        division,
        customNote,
        botName,
        avatarUrl,
        embedTitle,
        embedDescription,
        embedColor,
        footerText,
        customMessage,
        messageType,
        registeredBy,
        registeredByRank,
        registeredByBadge,
        loginUrl
      } = body;

      const token = getBotToken(botToken);
      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Discord Bot Token belum dikonfigurasi! Harap masukkan Bot Token di menu Pengaturan Bot Discord.'
        });
      }

      const rawTarget = (userId || discordUsername || username || '').toString().trim();
      if (!rawTarget) {
        return res.status(400).json({
          success: false,
          message: 'Username atau User ID Discord tujuan tidak boleh kosong! Masukkan username Discord (contoh: @linuxsamp atau linuxsamp).'
        });
      }

      let cleanUserId = '';
      let resolvedUsernameTag = '';
      const numericCandidate = rawTarget.replace(/[^0-9]/g, '');

      if (numericCandidate.length >= 16 && numericCandidate.length <= 22 && !rawTarget.includes('@') && !rawTarget.includes(' ') && /^\d+$/.test(rawTarget)) {
        cleanUserId = numericCandidate;
        resolvedUsernameTag = `<@${cleanUserId}>`;
      } else {
        const lookup = await resolveDiscordUser(rawTarget, token);
        if (!lookup.success || !lookup.user) {
          return res.status(400).json({
            success: false,
            message: lookup.message || `Tidak dapat menemukan akun Discord '${rawTarget}'. Pastikan akun tersebut berada di server Discord yang sama dengan Bot!`
          });
        }
        cleanUserId = lookup.user.id;
        resolvedUsernameTag = lookup.user.tag;
      }

      // Open Direct Message Channel with target user
      const dmChannelRes = await fetch('https://discord.com/api/v10/users/@me/channels', {
        method: 'POST',
        headers: {
          'Authorization': `Bot ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ recipient_id: cleanUserId })
      });

      if (!dmChannelRes.ok) {
        const dmErr = await dmChannelRes.json().catch(() => ({}));
        let reason = dmErr.message || `HTTP ${dmChannelRes.status}`;
        if (dmErr.code === 50007) {
          reason = `Penerima (${officerName || 'User'}) memblokir DM atau membatasi pesan dari member server. Minta anggota tersebut untuk mengaktifkan 'Allow direct messages from server members'.`;
        } else if (dmErr.code === 10013) {
          reason = `User Discord dengan ID '${cleanUserId}' tidak ditemukan.`;
        }
        return res.status(400).json({
          success: false,
          message: `Gagal membuka kanal PM ke ${resolvedUsernameTag || officerName || 'user'}: ${reason}`
        });
      }

      const dmChannel = await dmChannelRes.json() as any;
      const dmChannelId = dmChannel.id;

      // Color parsing
      let parsedColor = 0x00A8FF;
      if (embedColor) {
        if (typeof embedColor === 'number') {
          parsedColor = Math.min(Math.max(0, embedColor), 0xFFFFFF);
        } else if (typeof embedColor === 'string') {
          const cleanHex = embedColor.replace('#', '').trim();
          const parsed = parseInt(cleanHex, 16);
          if (!isNaN(parsed)) parsedColor = Math.min(Math.max(0, parsed), 0xFFFFFF);
        }
      }

      const safeAvatarUrl = (avatarUrl && typeof avatarUrl === 'string' && (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')))
        ? avatarUrl.trim()
        : 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png';

      const now = new Date();
      const dateFormatted = now.toLocaleDateString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: '2-digit',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });

      const isCustomChatOnly = messageType === 'custom' || (!pin && !badge && customMessage);
      const fields: Array<{ name: string; value: string; inline?: boolean }> = [];

      if (isCustomChatOnly) {
        fields.push({
          name: '👤 Identitas Anggota',
          value: `**${officerName || 'Officer'}** ${badge ? `(\`${badge}\`)` : ''}`,
          inline: true
        });
        if (rank) {
          fields.push({
            name: '🎖️ Pangkat / Jabatan',
            value: `\`${rank}\``,
            inline: true
          });
        }
        fields.push({
          name: '💬 Pesan Perintah / Instruksi Khusus',
          value: `\`\`\`fix\n${customMessage || customNote || 'Tidak ada catatan tambahan.'}\n\`\`\``,
          inline: false
        });
      } else {
        fields.push({
          name: '👤 Nama Karakter IC',
          value: `**${officerName || 'Officer'}**`,
          inline: true
        });
        fields.push({
          name: '🏷️ Badge & Pangkat',
          value: `Badge: **${badge || '#---'}**\nPangkat: **${rank || 'OFFICER'}**`,
          inline: true
        });
        if (division) {
          fields.push({
            name: '🏢 Divisi Dinas',
            value: `**${division}**`,
            inline: true
          });
        }
        fields.push({
          name: '🔑 Kredensial UCP & PIN Anda',
          value: `\`\`\`yaml\nNama UCP: ${officerName || 'Officer'}\nNomor Badge: ${badge || '-'}\nPIN Login MDT: ${pin || '10-4'}\n\`\`\``,
          inline: false
        });
        if (registeredBy) {
          fields.push({
            name: '🎖️ Diresmikan Oleh Atasan',
            value: `**${registeredBy}** ${registeredByRank ? `(${registeredByRank})` : ''} ${registeredByBadge ? `\`${registeredByBadge}\`` : ''}`.trim(),
            inline: true
          });
        }
        const appWebUrl = (loginUrl && loginUrl.trim()) ? loginUrl.trim() : 'https://mdc-hspd-inspector.vercel.app/';
        fields.push({
          name: '🌐 Akses Terminal MDT Web',
          value: `Buka aplikasi web MDT di browser Anda untuk mulai bertugas:\n👉 [Klik di Sini untuk Buka Terminal MDT](${appWebUrl})`,
          inline: false
        });
        if (customMessage) {
          fields.push({
            name: '💬 Pesan / Arahan dari Atasan',
            value: `>>> ${customMessage}`,
            inline: false
          });
        }
        fields.push({
          name: '⚠️ Catatan Keamanan',
          value: customNote || 'Jaga kerahasiaan PIN dan kredensial akun UCP Anda. Jangan pernah membagikan informasi ini kepada siapapun!',
          inline: false
        });
      }

      const appWebUrl = (loginUrl && loginUrl.trim()) ? loginUrl.trim() : 'https://mdc-hspd-inspector.vercel.app/';

      const defaultTitle = isCustomChatOnly 
        ? 'Pesan Resmi Komando Kepolisian' 
        : (registeredBy ? 'Kredensial Akun Dinas Kepolisian HSPD' : 'Kredensial Akun UCP High State');
      const finalTitle = (embedTitle && embedTitle.trim()) ? embedTitle.trim() : defaultTitle;
      
      let defaultDesc = 'Berikut adalah detail dari akun MDT Anda:';
      if (isCustomChatOnly) {
        defaultDesc = 'Anda menerima pesan dinas resmi dari jajaran Komando / Atasan:';
      } else if (registeredBy) {
        defaultDesc = `Halo **${officerName || 'Officer'}**, akun dinas Anda telah resmi didaftarkan oleh Jajaran Atasan (**${registeredByRank || 'High Command'} ${registeredBy}**). Berikut adalah detail akun dan PIN login Terminal MDT Anda:`;
      }
      const finalDescription = (embedDescription && embedDescription.trim()) ? embedDescription.trim() : defaultDesc;

      const embedObj: any = {
        author: {
          name: (botName || 'Cek Akun | High State').trim().substring(0, 256),
          icon_url: safeAvatarUrl
        },
        title: finalTitle.substring(0, 256),
        description: finalDescription.substring(0, 4096),
        color: parsedColor,
        fields,
        footer: {
          text: `${(footerText || 'Bot High State').trim()} • ${dateFormatted}`.substring(0, 2048),
          icon_url: safeAvatarUrl
        }
      };

      const messageContent = isCustomChatOnly
        ? `<@${cleanUserId}> 📨 **Pesan Resmi dari Komando / Atasan HSPD:**`
        : `<@${cleanUserId}> Halo! Berikut adalah detail dari akun MDT Anda:`;

      const messageComponents = [
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 5,
              label: 'Akses Terminal MDT Web',
              url: appWebUrl,
              emoji: { name: '🌐' }
            }
          ]
        }
      ];

      const sendMsgRes = await fetch(`https://discord.com/api/v10/channels/${dmChannelId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bot ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: messageContent,
          embeds: [embedObj],
          components: messageComponents
        })
      });

      if (!sendMsgRes.ok) {
        const sendErrJson = await sendMsgRes.json().catch(() => ({}));
        let reason = sendErrJson.message || `HTTP ${sendMsgRes.status}`;
        if (sendErrJson.code === 50007) {
          reason = `Penerima (${officerName || 'User'}) menonaktifkan DM dari member server atau memblokir bot.`;
        }
        return res.status(400).json({
          success: false,
          message: `Gagal mengirim pesan PM Discord: ${reason}`
        });
      }

      return res.status(200).json({
        success: true,
        message: isCustomChatOnly
          ? `✅ Pesan khusus dari atasan berhasil dikirimkan ke PM Discord ${resolvedUsernameTag || officerName}!`
          : `✅ Kredensial akun UCP & PIN berhasil dikirim ke PM Discord ${resolvedUsernameTag || officerName}!`
      });
    }

    // -------------------------------------------------------------
    // DEFAULT 404
    // -------------------------------------------------------------
    return res.status(404).json({
      success: false,
      message: `API Route not found: ${cleanPath}`,
      platform: 'vercel'
    });

  } catch (err: any) {
    console.error('[Vercel Serverless Error]:', err);
    return res.status(500).json({
      success: false,
      message: `Server Error: ${err?.message || 'Terjadi kesalahan pada serverless function.'}`,
      platform: 'vercel'
    });
  }
}
