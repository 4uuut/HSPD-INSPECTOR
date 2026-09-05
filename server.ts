import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { discordGatewayManager } from './server/discordBotService.ts';
import { discordRosterService } from './server/discordRosterService.ts';

dotenv.config();

// Prevent unhandled WebSocket / network events from crashing the server
process.on('uncaughtException', (err: any) => {
  const msg = err?.message || String(err);
  if (msg.includes('WebSocket') || err?.code === 'ECONNRESET' || err?.code === 'ETIMEDOUT') {
    console.warn('[Server Gateway] Suppressed non-fatal WebSocket/network exception:', msg);
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
  const PORT = 3000;

  app.use(express.json({ limit: '15mb' }));

  // Initialize Discord Gateway WebSocket to keep bot ONLINE (Green) 24/7
  discordGatewayManager.init();

  // Health check API
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Discord Bot Gateway Status API (Cek apakah bot menyala hijau / online)
  app.get('/api/discord/bot-status', (req, res) => {
    const status = discordGatewayManager.getStatus();
    res.json(status);
  });

  // Start / Connect Discord Bot Gateway (Menyalakan bot jadi warna hijau di Discord)
  app.post('/api/discord/bot-start', async (req, res) => {
    try {
      const { botToken } = req.body;
      const result = await discordGatewayManager.startWithToken(botToken);
      if (result.success) {
        return res.json({
          success: true,
          message: result.message,
          botUser: result.botUser,
          status: 'online'
        });
      } else {
        return res.status(400).json({
          success: false,
          message: result.message
        });
      }
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || 'Gagal memulai koneksi Discord Gateway'
      });
    }
  });

  // Stop Discord Bot Gateway
  app.post('/api/discord/bot-stop', (req, res) => {
    discordGatewayManager.stop();
    res.json({ success: true, message: 'Discord Bot Gateway dinonaktifkan (status offline).' });
  });

  // Get all Discord registered officers from database / backup
  app.get('/api/discord/roster', async (req, res) => {
    try {
      const officers = await discordRosterService.getAllOfficers();
      res.json({ success: true, officers });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message, officers: [] });
    }
  });

  // Register officer directly via API (mirrors Discord modal)
  app.post('/api/discord/register-officer', async (req, res) => {
    try {
      const { icName, pin, badge, phone, discordUsername, discordUserId } = req.body;
      const result = await discordRosterService.registerOfficer({
        icName,
        pin,
        badge,
        phone,
        discordUser: {
          id: discordUserId || 'api_user',
          username: discordUsername || 'api_user'
        }
      });
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  // Helper: Resolve Discord Username or User ID to full profile & numeric ID
  interface ResolvedDiscordUser {
    id: string;
    username: string;
    globalName: string | null;
    tag: string;
    avatarUrl: string;
  }

  async function resolveDiscordUser(query: string, token: string): Promise<{ success: boolean; user?: ResolvedDiscordUser; message?: string }> {
    if (!query || !query.trim()) {
      return { success: false, message: 'Username atau ID Discord target tidak boleh kosong!' };
    }

    const clean = query.trim();
    const numericOnly = clean.replace(/[^0-9]/g, '');

    // 1. If it's a numeric ID (17-22 digits, strictly numeric without @ or spaces)
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

    // 2. Query is a username (e.g. "@aguy", "aguy", "aguy#1234")
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

      let candidateUser: ResolvedDiscordUser | null = null;

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

            const resolved: ResolvedDiscordUser = {
              id: u.id,
              username: u.username,
              globalName: u.global_name || m.nick || null,
              tag: u.discriminator && u.discriminator !== '0' ? `${u.username}#${u.discriminator}` : `@${u.username}`,
              avatarUrl
            };

            if (isExact) {
              return { success: true, user: resolved };
            }
            if (!candidateUser) {
              candidateUser = resolved;
            }
          }
        } catch (err) {
          console.warn(`[Discord Lookup] Error searching in guild ${guild.id}:`, err);
        }
      }

      if (candidateUser) {
        return { success: true, user: candidateUser };
      }

      return {
        success: false,
        message: `User Discord dengan username '${clean}' tidak ditemukan di server/guild tempat Bot berada. Pastikan akun tersebut sudah berada di server yang sama dengan Bot!`
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Gagal mencari user di Discord: ${err.message || err}`
      };
    }
  }

  // Lookup Discord User endpoint (Finds by Username or ID)
  app.post('/api/discord/lookup-user', async (req, res) => {
    try {
      const { query, botToken } = req.body;
      const token = (botToken || discordGatewayManager.getActiveToken() || process.env.DISCORD_BOT_TOKEN || '').trim();
      if (!token) {
        return res.status(400).json({ success: false, message: 'Bot token belum dikonfigurasi.' });
      }
      const result = await resolveDiscordUser(query, token);
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message || 'Error mencari user Discord' });
    }
  });

  // Get Discord Guild Channels
  app.get('/api/discord/channels', async (req, res) => {
    try {
      const token = (req.query.botToken as string || discordGatewayManager.getActiveToken() || process.env.DISCORD_BOT_TOKEN || '').trim();
      if (!token) {
        return res.status(400).json({ success: false, message: 'Bot Token belum diisi!' });
      }

      const guildsRes = await fetch('https://discord.com/api/v10/users/@me/guilds', {
        headers: { Authorization: `Bot ${token}` }
      });
      if (!guildsRes.ok) {
        return res.status(400).json({ success: false, message: 'Gagal mengambil daftar server bot.' });
      }
      const guilds = await guildsRes.json() as Array<{ id: string; name: string }>;
      const channelsList: Array<{ id: string; name: string; guildName: string; type: number }> = [];

      for (const g of guilds) {
        const chRes = await fetch(`https://discord.com/api/v10/guilds/${g.id}/channels`, {
          headers: { Authorization: `Bot ${token}` }
        });
        if (chRes.ok) {
          const chs = await chRes.json() as Array<any>;
          for (const c of chs) {
            // Type 0 is GUILD_TEXT, 5 is GUILD_ANNOUNCEMENT
            if (c.type === 0 || c.type === 5) {
              channelsList.push({
                id: c.id,
                name: c.name,
                guildName: g.name,
                type: c.type
              });
            }
          }
        }
      }

      res.json({ success: true, channels: channelsList });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Error fetching channels' });
    }
  });

  // Discord Bot Direct Message (PM / DM) API (Now supports Username directly!)
  app.post('/api/discord/send-bot-dm', async (req, res) => {
    try {
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
        messageType
      } = req.body;

      const token = (botToken || discordGatewayManager.getActiveToken() || process.env.DISCORD_BOT_TOKEN || '').trim();

      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Discord Bot Token belum dikonfigurasi! Harap masukkan Bot Token di menu Pengaturan Bot Discord atau set environment variable DISCORD_BOT_TOKEN.'
        });
      }

      // Automatically keep bot online if not already connected
      if (!discordGatewayManager.getStatus().isOnline) {
        discordGatewayManager.startWithToken(token).catch(e => {
          console.warn('[Server] Auto-connect bot gateway warning:', e);
        });
      }

      const rawTarget = (userId || discordUsername || username || '').toString().trim();
      if (!rawTarget) {
        return res.status(400).json({
          success: false,
          message: 'Username atau User ID Discord tujuan tidak boleh kosong! Masukkan username Discord (contoh: aguy atau @aguy).'
        });
      }

      // Automatically resolve username or extract numeric ID
      let cleanUserId = '';
      let resolvedUsernameTag = '';

      // Check if rawTarget contains a 17-22 digit numeric ID anywhere (e.g. "@user (ID: 1426197728249122957)" or "<@1426197728249122957>")
      const numericMatch = rawTarget.match(/(\d{17,22})/);
      if (numericMatch && numericMatch[1]) {
        cleanUserId = numericMatch[1];
      } else {
        // Target is a username (e.g. "@aguy", "aguy", "aguy#1234") -> Look it up via Bot
        const lookup = await resolveDiscordUser(rawTarget, token);
        if (!lookup.success || !lookup.user) {
          return res.status(400).json({
            success: false,
            message: lookup.message || `Tidak dapat mendeteksi akun Discord untuk '${rawTarget}'. Pastikan akun tersebut sudah berada di server yang sama dengan Bot.`
          });
        }
        cleanUserId = lookup.user.id;
        resolvedUsernameTag = lookup.user.tag || `@${lookup.user.username}`;
      }

      // 1. Create / Open DM Channel with recipient
      const createDmRes = await fetch('https://discord.com/api/v10/users/@me/channels', {
        method: 'POST',
        headers: {
          'Authorization': `Bot ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ recipient_id: cleanUserId })
      });

      if (!createDmRes.ok) {
        const errJson = await createDmRes.json().catch(() => ({}));
        let reason = errJson.message || `HTTP ${createDmRes.status}`;
        if (createDmRes.status === 401) {
          reason = 'Bot Token Discord tidak valid atau salah. Silakan periksa kembali Token di Discord Developer Portal.';
        } else if (createDmRes.status === 404 || errJson.code === 10013) {
          reason = `Akun Discord '${rawTarget}' tidak ditemukan di sistem Discord.`;
        } else if (errJson.code === 50007) {
          reason = `Penerima (${rawTarget}) menutup Pesan Pribadi (DM) atau belum berada di server yang sama dengan bot.`;
        }
        return res.status(400).json({
          success: false,
          message: `Gagal membuka Pesan Pribadi (PM): ${reason}`
        });
      }

      const dmChannel = await createDmRes.json();
      const dmChannelId = dmChannel.id;

      // 2. Build message embed exact to user's reference
      const now = new Date();
      const dateFormatted = now.toLocaleDateString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: '2-digit',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });

      // Sanitize avatar URL: Discord strictly rejects base64 data URIs or non-HTTP(S) links in icon_url
      const DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png';
      let safeAvatarUrl = DEFAULT_AVATAR;
      if (avatarUrl && typeof avatarUrl === 'string') {
        const trimmed = avatarUrl.trim();
        if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
          safeAvatarUrl = trimmed;
        }
      }

      // Color parsing (hex or integer)
      let parsedColor = 0x00A8FF; // Default High State blue
      if (embedColor) {
        if (typeof embedColor === 'number') {
          parsedColor = Math.min(Math.max(0, embedColor), 0xFFFFFF);
        } else if (typeof embedColor === 'string') {
          const cleanHex = embedColor.replace('#', '').trim();
          const parsed = parseInt(cleanHex, 16);
          if (!isNaN(parsed)) {
            parsedColor = Math.min(Math.max(0, parsed), 0xFFFFFF);
          }
        }
      }

      // Assemble embed fields depending on mode
      const isCustomChatOnly = messageType === 'custom_chat';
      const fields: Array<{ name: string; value: string; inline?: boolean }> = [];

      if (isCustomChatOnly) {
        fields.push({
          name: '👤 Penerima Pesan',
          value: officerName ? `\`${officerName}\`` : '-',
          inline: true
        });

        if (badge || rank) {
          fields.push({
            name: '🎖️ No. Badge & Pangkat',
            value: `\`${badge || '-'}\` • ${rank || '-'}`,
            inline: true
          });
        }

        if (division) {
          fields.push({
            name: '🏢 Divisi',
            value: division,
            inline: true
          });
        }

        // Custom Message Content from Superior
        const messageBody = (customMessage || '').trim() || (customNote || '').trim() || 'Tidak ada pesan tertulis dari atasan.';
        fields.push({
          name: '💬 Pesan / Instruksi dari Atasan',
          value: messageBody.length > 1024 ? messageBody.substring(0, 1020) + '...' : messageBody,
          inline: false
        });

        if (customNote && customNote.trim() && customNote !== messageBody) {
          fields.push({
            name: '📌 Catatan Tambahan',
            value: customNote.trim().substring(0, 1024),
            inline: false
          });
        }
      } else {
        // Credentials Mode (Default)
        fields.push(
          {
            name: 'UCP',
            value: officerName || '-',
            inline: false
          },
          {
            name: 'Pin Code',
            value: pin || '10-4',
            inline: false
          }
        );

        if (badge || rank) {
          fields.push({
            name: 'No. Badge & Pangkat',
            value: `\`${badge || '-'}\` • ${rank || '-'}`,
            inline: false
          });
        }

        if (division) {
          fields.push({
            name: 'Divisi',
            value: division,
            inline: false
          });
        }

        // Include Superior's Custom Message if provided
        if (customMessage && customMessage.trim()) {
          const cleanCustomMsg = customMessage.trim();
          fields.push({
            name: '💬 Pesan / Instruksi dari Atasan',
            value: cleanCustomMsg.length > 1024 ? cleanCustomMsg.substring(0, 1020) + '...' : cleanCustomMsg,
            inline: false
          });
        }

        fields.push({
          name: 'Note',
          value: customNote || 'Jangan beritahu informasi ini kepada orang lain!\n*Gunakan nama UCP / Badge dan Pin Code di atas untuk login ke Terminal MDT Kepolisian.*',
          inline: false
        });
      }

      const finalTitle = embedTitle 
        ? embedTitle.trim() 
        : (isCustomChatOnly ? '📢 Pesan Dinas dari Atasan' : '✅ Berhasil!');

      const finalDescription = embedDescription 
        ? embedDescription.trim() 
        : (isCustomChatOnly ? 'Anda menerima pesan dinas resmi dari jajaran Komando / Atasan:' : 'Berikut adalah detail dari akun UCP Anda:');

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
        : `<@${cleanUserId}> Halo! Berikut adalah detail dari akun UCP Anda:`;

      // 3. Send direct message embed with tag in content
      const sendMsgRes = await fetch(`https://discord.com/api/v10/channels/${dmChannelId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bot ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: messageContent,
          embeds: [embedObj]
        })
      });

      if (!sendMsgRes.ok) {
        const sendErrJson = await sendMsgRes.json().catch(() => ({}));
        let reason = sendErrJson.message || `HTTP ${sendMsgRes.status}`;

        if (sendErrJson.code === 50007) {
          reason = `Penerima (${officerName || 'User'}) menonaktifkan DM dari member server atau memblokir bot / belum join server Discord yang sama dengan bot. Minta anggota tersebut untuk membuka DM di Discord Settings -> Privacy & Safety -> 'Allow direct messages from server members'.`;
        } else if (sendErrJson.code === 50035 || sendErrJson.message === 'Invalid Form Body') {
          let extra = '';
          try {
            if (sendErrJson.errors) extra = `: ${JSON.stringify(sendErrJson.errors)}`;
          } catch {}
          reason = `Format pesan/embed ditolak oleh Discord${extra}. Pastikan URL Logo adalah tautan web HTTPS yang valid dan teks pesan tidak melebihi batas karakter Discord.`;
        } else if (sendErrJson.code === 10013) {
          reason = `User ID Discord '${cleanUserId}' tidak ditemukan di sistem Discord. Pastikan memasukkan User ID numerik yang valid.`;
        } else if (sendErrJson.code === 50001) {
          reason = `Bot tidak memiliki izin akses (Missing Access) ke channel DM ini.`;
        }

        return res.status(400).json({
          success: false,
          message: `Gagal mengirim pesan PM Discord: ${reason}`
        });
      }

      return res.json({
        success: true,
        message: isCustomChatOnly
          ? `✅ Pesan khusus dari atasan berhasil dikirimkan ke Pesan Pribadi (PM/DM) Discord milik ${resolvedUsernameTag || officerName || 'anggota'}!`
          : `✅ Kredensial akun UCP & PIN berhasil dikirim ke Pesan Pribadi (PM/DM) Discord milik ${resolvedUsernameTag || officerName || 'anggota'}!`
      });

    } catch (err: any) {
      console.error('Discord Bot Send DM Error:', err);
      return res.status(500).json({
        success: false,
        message: `Terjadi kendala server saat menghubungi Discord API: ${err.message || err}`
      });
    }
  });

  // Discord Bot Registration Panel API (Sends the UCP / MDT login registration embed to a designated channel)
  app.post('/api/discord/send-registration-panel', async (req, res) => {
    try {
      const {
        botToken,
        channelId,
        embedTitle,
        embedDescription,
        embedColor,
        footerText,
        thumbnailUrl,
        registerUrl,
        botName
      } = req.body;

      const token = (botToken || discordGatewayManager.getActiveToken() || process.env.DISCORD_BOT_TOKEN || '').trim();
      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Discord Bot Token belum dikonfigurasi! Harap masukkan Bot Token di menu Pengaturan.'
        });
      }

      if (!channelId || !channelId.toString().trim()) {
        return res.status(400).json({
          success: false,
          message: 'ID Channel Discord tujuan wajib diisi! Masukkan ID Channel Discord (contoh: 1234567890123456789).'
        });
      }

      const cleanChannelId = channelId.toString().replace(/[^0-9]/g, '');
      if (!cleanChannelId || cleanChannelId.length < 16) {
        return res.status(400).json({
          success: false,
          message: `ID Channel '${channelId}' tidak valid! ID Channel Discord harus terdiri dari 17-20 digit angka.`
        });
      }

      // Color parsing
      let parsedColor = 0x00A8FF; // Default High State blue
      if (embedColor) {
        if (typeof embedColor === 'number') {
          parsedColor = Math.min(Math.max(0, embedColor), 0xFFFFFF);
        } else if (typeof embedColor === 'string') {
          const cleanHex = embedColor.replace('#', '').trim();
          const parsed = parseInt(cleanHex, 16);
          if (!isNaN(parsed)) {
            parsedColor = Math.min(Math.max(0, parsed), 0xFFFFFF);
          }
        }
      }

      const DEFAULT_THUMBNAIL = 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png';
      let safeThumbnail = DEFAULT_THUMBNAIL;
      if (thumbnailUrl && typeof thumbnailUrl === 'string') {
        const trimmed = thumbnailUrl.trim();
        if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
          safeThumbnail = trimmed;
        }
      }

      const DEFAULT_DESCRIPTION = 
`Channel ini merupakan tempat dimana kamu dapat mengatur akun UCP kamu sendiri. Terdapat beberapa hal yang harus kamu ketahui, diantaranya:

[ 📄 Register UCP ]
Informasi Sebagaimana dengan judulnya, ini merupakan tombol dimana kamu dapat mengambil Tiket (membuat akun UCP). Sebelum kamu bermain peran di High State maka Tiket adalah kewajiban utama yang harus kamu miliki, disinilah tempatnya!

[ ♻️ Resend Code ]
Informasi Kamu dapat melihat status Tiketmu apakah sudah terverifikasi ataukah belum, kamu juga dapat melihat informasi kode verifikasi melalui ini jikalau kamu belum menerima DM dari BOT @High State Roleplay

[ 🚨 Lupa Password ]
Sesuai dengan namanya, tombol ini merupakan tempat apabila kamu lupa kata sandi atau ingin mengganti kata sandi.

[ ⚙️ Fix Role ]
Informasi ini adalah tempat dimana ketika kalian sudah melakukan register/ambil tiket dan tidak mendapatkan role @unknown-role maka silahkan gunakan Reff Role, dan disini juga tempat dimana ketika kalian tidak sengaja ataupun sengaja keluar dari discord High State dan ingin main lagi di High State maka silahkan gunakan tombol Reff Role untuk mengambil role @unknown-role!

[ ⚠️ Penting ]
Jangan lupa untuk hidupin direct message agar pm bot mengirim ucp bisa masuk! Dan Pastikan Akun Discord kamu sudah dibuat lebih dari 7Hari!`;

      const desc = (embedDescription && embedDescription.trim()) ? embedDescription.trim() : DEFAULT_DESCRIPTION;
      const title = (embedTitle && embedTitle.trim()) ? embedTitle.trim() : 'UCP Panel High State';
      const footer = (footerText && footerText.trim()) ? footerText.trim() : 'Bot High State';
      const authorName = (botName && botName.trim()) ? botName.trim() : 'High State Roleplay';

      const now = new Date();
      const dateFormatted = now.toLocaleDateString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: '2-digit',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });

      // 4 Interactive Buttons matching reference image (Register pops up Discord Modal)
      const registerButton = {
        type: 2,
        style: 2, // SECONDARY (Grey/Dark) exactly matching reference image
        label: 'Register',
        emoji: { name: '📄' },
        custom_id: 'mdt_btn_register'
      };

      const actionRow = {
        type: 1, // ACTION_ROW
        components: [
          registerButton,
          {
            type: 2,
            style: 1, // PRIMARY (Blurple)
            label: 'Resend Code',
            emoji: { name: '♻️' },
            custom_id: 'mdt_btn_resend_code'
          },
          {
            type: 2,
            style: 4, // DANGER (Red)
            label: 'Lupa Password',
            emoji: { name: '⚠️' },
            custom_id: 'mdt_btn_forgot_password'
          },
          {
            type: 2,
            style: 2, // SECONDARY (Grey)
            label: 'Take Role',
            emoji: { name: '⚙️' },
            custom_id: 'mdt_btn_take_role'
          }
        ]
      };

      const embedObj = {
        author: {
          name: authorName.substring(0, 256),
          icon_url: safeThumbnail
        },
        title: title.substring(0, 256),
        description: desc.substring(0, 4096),
        color: parsedColor,
        thumbnail: {
          url: safeThumbnail
        },
        footer: {
          text: `${footer} • ${dateFormatted}`.substring(0, 2048),
          icon_url: safeThumbnail
        }
      };

      const sendRes = await fetch(`https://discord.com/api/v10/channels/${cleanChannelId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bot ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          embeds: [embedObj],
          components: [actionRow]
        })
      });

      if (!sendRes.ok) {
        const errJson = await sendRes.json().catch(() => ({}));
        let reason = errJson.message || `HTTP ${sendRes.status}`;
        if (errJson.code === 50001 || sendRes.status === 403) {
          reason = `Bot tidak memiliki izin akses (Missing Access/Permissions) di Channel ID '${cleanChannelId}'. Pastikan bot sudah diundang ke server dan memiliki izin 'View Channel', 'Send Messages', dan 'Embed Links' di channel tersebut.`;
        } else if (errJson.code === 10003) {
          reason = `Channel dengan ID '${cleanChannelId}' tidak ditemukan di server bot.`;
        }
        return res.status(400).json({
          success: false,
          message: `Gagal mengirim panel ke channel: ${reason}`
        });
      }

      const sentMsg = await sendRes.json();
      return res.json({
        success: true,
        messageId: sentMsg.id,
        channelId: cleanChannelId,
        message: `✅ Panel Registrasi Anggota & Login MDT berhasil dikirim ke Channel Discord (ID: ${cleanChannelId})!`
      });
    } catch (err: any) {
      console.error('Discord Bot Send Registration Panel Error:', err);
      return res.status(500).json({
        success: false,
        message: `Error server saat mengirim panel registrasi: ${err.message || err}`
      });
    }
  });

  // Vite middleware for dev or Static Files for prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
