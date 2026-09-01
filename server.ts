import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '15mb' }));

  // Health check API
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
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
        customMessage
      } = req.body;

      const token = (botToken || process.env.DISCORD_BOT_TOKEN || '').trim();

      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Discord Bot Token belum dikonfigurasi! Masukkan Bot Token di Pengaturan Bot Discord atau set environment variable DISCORD_BOT_TOKEN.'
        });
      }

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'Discord User ID tujuan tidak boleh kosong! Harap masukkan User ID Discord (angka).'
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
          reason = `Akun Discord dengan ID ${cleanUserId} tidak ditemukan.`;
        } else if (errJson.code === 50007) {
          reason = `User menutup Pesan Pribadi (DM tertutup) atau belum berada di server yang sama dengan bot.`;
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

      const fields: Array<{ name: string; value: string; inline?: boolean }> = [
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
      ];

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

      fields.push({
        name: 'Note',
        value: customNote || 'Jangan beritahu informasi ini kepada orang lain!',
        inline: false
      });

      // Color parsing (hex or integer)
      let parsedColor = 0x00A8FF; // Default High State blue
      if (embedColor) {
        if (typeof embedColor === 'number') {
          parsedColor = embedColor;
        } else if (typeof embedColor === 'string') {
          const cleanHex = embedColor.replace('#', '').trim();
          const parsed = parseInt(cleanHex, 16);
          if (!isNaN(parsed)) parsedColor = parsed;
        }
      }

      const embedObj: any = {
        author: {
          name: botName || 'Cek Akun | High State',
          icon_url: avatarUrl || 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png'
        },
        title: embedTitle || '✅ Berhasil!',
        description: customMessage || embedDescription || 'Berikut adalah detail dari akun UCP Anda:',
        color: parsedColor,
        fields,
        footer: {
          text: `${footerText || 'Bot High State'} • ${dateFormatted}`,
          icon_url: avatarUrl || undefined
        }
      };

      // 3. Send direct message embed
      const sendMsgRes = await fetch(`https://discord.com/api/v10/channels/${dmChannelId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bot ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          embeds: [embedObj]
        })
      });

      if (!sendMsgRes.ok) {
        const sendErrJson = await sendMsgRes.json().catch(() => ({}));
        let reason = sendErrJson.message || `HTTP ${sendMsgRes.status}`;
        if (sendErrJson.code === 50007) {
          reason = `Penerima (${officerName}) menonaktifkan DM dari member server atau memblokir bot. Minta anggota tersebut untuk membuka DM di Server Settings -> Privacy -> Allow Direct Messages.`;
        }
        return res.status(400).json({
          success: false,
          message: `Gagal mengirim pesan PM Discord: ${reason}`
        });
      }

      return res.json({
        success: true,
        message: `✅ Kredensial akun UCP & PIN berhasil dikirim ke Pesan Pribadi (PM/DM) Discord milik ${officerName}!`
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
