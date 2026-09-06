import { Router } from 'express';
import { discordGatewayManager } from './discordBotService.ts';
import { discordRosterService } from './discordRosterService.ts';

export const apiRouter = Router();

// CORS Middleware to allow cross-origin requests (e.g., from Vercel frontend to Cloud Run backend)
apiRouter.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
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

  // 1. If it's a numeric ID (16-22 digits)
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

  // 2. Query is a username
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

// Health check API
apiRouter.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Discord Bot Gateway Status API
apiRouter.get('/discord/bot-status', (req, res) => {
  const status = discordGatewayManager.getStatus();
  res.json(status);
});

// Start / Connect Discord Bot Gateway
apiRouter.post('/discord/bot-start', async (req, res) => {
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
apiRouter.post('/discord/bot-stop', (req, res) => {
  discordGatewayManager.stop();
  res.json({ success: true, message: 'Discord Bot Gateway dinonaktifkan (status offline).' });
});

// Get all Discord registered officers from database / backup
apiRouter.get('/discord/roster', async (req, res) => {
  try {
    const officers = await discordRosterService.getAllOfficers();
    res.json({ success: true, officers });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message, officers: [] });
  }
});

// Register officer directly via API (mirrors Discord modal)
apiRouter.post('/discord/register-officer', async (req, res) => {
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

// Lookup Discord User endpoint (Finds by Username or ID)
apiRouter.post('/discord/lookup-user', async (req, res) => {
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
apiRouter.get('/discord/channels', async (req, res) => {
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

// Discord Bot Direct Message (PM / DM) API
apiRouter.post('/discord/send-bot-dm', async (req, res) => {
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
          message: lookup.message || `Tidak dapat menemukan akun Discord dengan identitas '${rawTarget}'. Pastikan akun tersebut sudah berada di server yang sama dengan Bot!`
        });
      }
      cleanUserId = lookup.user.id;
      resolvedUsernameTag = lookup.user.tag;
    }

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

    let parsedColor = 0x00A8FF;
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
        value: `\`\`\`yaml\nNama UCP: ${officerName || 'Officer'}\nPIN MDT: ${pin || '10-4'}\n\`\`\``,
        inline: false
      });
      if (customMessage) {
        fields.push({
          name: '💬 Pesan Tambahan dari Atasan',
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

    const defaultTitle = isCustomChatOnly ? 'Pesan Resmi Komando Kepolisian' : 'Kredensial Akun UCP High State';
    const finalTitle = (embedTitle && embedTitle.trim()) ? embedTitle.trim() : defaultTitle;
    const finalDescription = (embedDescription && embedDescription.trim())
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
        reason = `Penerima (${officerName || 'User'}) menonaktifkan DM dari member server atau memblokir bot / belum join server Discord yang sama dengan bot.`;
      } else if (sendErrJson.code === 50035 || sendErrJson.message === 'Invalid Form Body') {
        let extra = '';
        try {
          if (sendErrJson.errors) extra = `: ${JSON.stringify(sendErrJson.errors)}`;
        } catch {}
        reason = `Format pesan/embed ditolak oleh Discord${extra}.`;
      } else if (sendErrJson.code === 10013) {
        reason = `User ID Discord '${cleanUserId}' tidak ditemukan di sistem Discord.`;
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

// Discord Bot Registration Panel API
apiRouter.post('/discord/send-registration-panel', async (req, res) => {
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

    let parsedColor = 0x00A8FF;
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

    const registerButton = {
      type: 2,
      style: 2,
      label: 'Register',
      emoji: { name: '📄' },
      custom_id: 'mdt_btn_register'
    };

    const actionRow = {
      type: 1,
      components: [
        registerButton,
        {
          type: 2,
          style: 1,
          label: 'Resend Code',
          emoji: { name: '♻️' },
          custom_id: 'mdt_btn_resend_code'
        },
        {
          type: 2,
          style: 4,
          label: 'Lupa Password',
          emoji: { name: '⚠️' },
          custom_id: 'mdt_btn_forgot_password'
        },
        {
          type: 2,
          style: 2,
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
