import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { discordGatewayManager } from './server/discordBotService.ts';

dotenv.config();

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

  // Discord Bot Direct Message (PM / DM) API
  app.post('/api/discord/send-bot-dm', async (req, res) => {
    try {
      const { 
        botToken, 
        userId, 
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

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'Discord User ID tujuan tidak boleh kosong! Harap masukkan User ID Discord (angka 17-20 digit).'
        });
      }

      // Extract numeric Discord User ID
      const cleanUserId = userId.toString().replace(/[^0-9]/g, '');
      if (!cleanUserId || cleanUserId.length < 16) {
        return res.status(400).json({
          success: false,
          message: `ID Discord '${userId}' tidak valid. Pastikan menggunakan Discord User ID numerik (17-20 digit angka, contoh: 842019283719001). Caranya: Aktifkan Developer Mode di Discord Settings -> Advanced -> Klik kanan profil -> Copy User ID.`
        });
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
          reason = `Akun Discord dengan ID ${cleanUserId} tidak ditemukan di sistem Discord.`;
        } else if (errJson.code === 50007) {
          reason = `Penerima (${officerName || 'User'}) menutup Pesan Pribadi (DM) atau belum berada di server yang sama dengan bot.`;
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
          value: customNote || 'Jangan beritahu informasi ini kepada orang lain!',
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

      // 3. Send direct message embed with tag in content
      const sendMsgRes = await fetch(`https://discord.com/api/v10/channels/${dmChannelId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bot ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: `<@${cleanUserId}> 📨 **Pesan Resmi dari Komando / Atasan HSPD:**`,
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
          ? `✅ Pesan khusus dari atasan berhasil dikirimkan ke Pesan Pribadi (PM/DM) Discord milik ${officerName || 'anggota'}!`
          : `✅ Kredensial akun UCP & PIN berhasil dikirim ke Pesan Pribadi (PM/DM) Discord milik ${officerName || 'anggota'}!`
      });

    } catch (err: any) {
      console.error('Discord Bot Send DM Error:', err);
      return res.status(500).json({
        success: false,
        message: `Terjadi kendala server saat menghubungi Discord API: ${err.message || err}`
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
