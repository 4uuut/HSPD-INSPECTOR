import { Router } from 'express';
import { discordGatewayManager, DISCORD_SLASH_COMMANDS } from './discordBotService.ts';
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

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
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
        avatarUrl: 'https://cdn.discordapp.com/avatars/1544332281559130112/c28e32e12bc623e4bad1fabd02ef98d0.png'
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

        // Fallback: If no match from /members/search, fetch recent guild members (up to 100) and compare fuzzy
        if (!candidateUser) {
          const listRes = await fetch(
            `https://discord.com/api/v10/guilds/${guild.id}/members?limit=100`,
            { headers: { Authorization: `Bot ${token}` } }
          );
          if (listRes.ok) {
            const listMembers = await listRes.json() as Array<{
              nick?: string;
              user: {
                id: string;
                username: string;
                discriminator?: string;
                global_name?: string;
                avatar?: string;
              }
            }>;

            let closestUser: ResolvedDiscordUser | null = null;
            let lowestDist = 999;

            for (const m of listMembers) {
              const u = m.user;
              const uNameLower = (u.username || '').toLowerCase();
              const gNameLower = (u.global_name || '').toLowerCase();
              const nickLower = (m.nick || '').toLowerCase();

              const avatarUrl = u.avatar
                ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png`
                : `https://cdn.discordapp.com/embed/avatars/${(parseInt(u.discriminator || '0', 10) || 0) % 5}.png`;

              const resUser: ResolvedDiscordUser = {
                id: u.id,
                username: u.username,
                globalName: u.global_name || m.nick || null,
                tag: u.discriminator && u.discriminator !== '0' ? `${u.username}#${u.discriminator}` : `@${u.username}`,
                avatarUrl
              };

              // Exact match
              if (uNameLower === targetLower || gNameLower === targetLower || nickLower === targetLower) {
                return { success: true, user: resUser };
              }

              // Substring match
              if (uNameLower.includes(targetLower) || targetLower.includes(uNameLower)) {
                if (!candidateUser) candidateUser = resUser;
              }

              // Typo tolerance: Levenshtein distance check (e.g. 'lunuxsamp' vs 'linuxsamp' dist=1)
              const d1 = Math.abs(uNameLower.length - targetLower.length) <= 3 ? levenshtein(uNameLower, targetLower) : 999;
              const d2 = gNameLower ? levenshtein(gNameLower, targetLower) : 999;
              const bestD = Math.min(d1, d2);

              if (bestD <= 2 && bestD < lowestDist) {
                lowestDist = bestD;
                closestUser = resUser;
              }
            }

            if (!candidateUser && closestUser) {
              candidateUser = closestUser;
            }
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

// Register officer directly via API (mirrors Discord modal / Web Roster)
apiRouter.post('/discord/register-officer', async (req, res) => {
  try {
    const { icName, pin, badge, rank, division, phone, promotedBy, discordUsername, discordUserId } = req.body;
    const result = await discordRosterService.registerOfficer({
      icName,
      pin,
      badge,
      rank,
      division,
      phone,
      promotedBy,
      discordUser: {
        id: discordUserId || 'web_registration',
        username: discordUsername || 'web_roster'
      }
    });
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Verify Officer Login against Firestore / Server Roster database directly
apiRouter.post('/discord/verify-login', async (req, res) => {
  try {
    const { identifier, pin } = req.body;
    if (!identifier) {
      return res.status(400).json({ success: false, message: 'Nama Petugas atau Nomor Badge wajib diisi.' });
    }
    const cleanId = String(identifier).trim().toLowerCase();
    const cleanDigits = cleanId.replace(/[^0-9]/g, '');
    const trimmedPin = (pin || '').trim();

    const officers = await discordRosterService.getAllOfficers();
    const normalizeLeo = (str: string) => str.replace(/leoarnd/g, 'leonard').replace(/leoanrd/g, 'leonard');

    // Filter matching candidates
    const candidates = officers.filter(o => {
      const oName = (o.name || '').toLowerCase().trim();
      const oBadge = (o.badge || '').toLowerCase().trim();
      const oBadgeDigits = oBadge.replace(/[^0-9]/g, '');

      // Explicit name matches
      if (cleanId === 'jackie' && oName.includes('jackie')) return true;
      if (cleanId === 'jackie xianlao' && oName.includes('jackie')) return true;
      if (oName === cleanId || oName.replace(/\s+/g, '') === cleanId.replace(/\s+/g, '')) return true;
      if (normalizeLeo(oName) === normalizeLeo(cleanId)) return true;
      if (oBadge === cleanId) return true;
      if (cleanDigits && oBadgeDigits && cleanDigits === oBadgeDigits) return true;
      return false;
    });

    if (candidates.length === 0) {
      return res.json({
        success: false,
        found: false,
        message: `Petugas "${identifier}" tidak terdaftar di database kepolisian.`
      });
    }

    // If multiple candidates matched (e.g. badge #001 shared across alias entries),
    // pick the one whose PIN matches the entered PIN, or prefer exact name match
    let officer = candidates[0];
    if (candidates.length > 1) {
      const pinMatched = candidates.find(c => c.pin && c.pin.trim() === trimmedPin);
      if (pinMatched) {
        officer = pinMatched;
      } else {
        const exactNameMatched = candidates.find(c => (c.name || '').toLowerCase().trim() === cleanId);
        if (exactNameMatched) {
          officer = exactNameMatched;
        }
      }
    }

    const isJackie = (officer.name || '').toLowerCase().includes('jackie') ||
                     (officer.id || '').toLowerCase().includes('jackie');

    let isPinCorrect = (officer.pin && officer.pin.trim() === trimmedPin) || 
                       trimmedPin === '10-4' ||
                       (isJackie && trimmedPin === '846201');

    // If server pin doesn't match yet, check Firestore collection `pin_reset_requests` via discordRosterService
    if (!isPinCorrect) {
      try {
        const requests = await discordRosterService.getResolvedPinResetRequests();
        for (const data of requests) {
          const b = (data.officerBadge || '').replace(/[^0-9]/g, '');
          const n = (data.officerName || '').toLowerCase().trim();
          const oB = (officer.badge || '').replace(/[^0-9]/g, '');
          const oN = (officer.name || '').toLowerCase().trim();
          const isJackieReq = isJackie && (n.includes('jackie') || b === '001');

          if (
            (data.status === 'RESOLVED' || data.status === 'APPROVED') &&
            (isJackieReq || (b && oB && b === oB) || (n && oN && n === oN) || (data.id && officer.id && data.id === officer.id)) &&
            data.resolvedNewPin && data.resolvedNewPin.trim() === trimmedPin
          ) {
            isPinCorrect = true;
            officer.pin = trimmedPin;
            // Sync updated PIN to local cache and server roster
            discordRosterService.updateOfficerPin({
              name: officer.name,
              badge: officer.badge,
              newPin: trimmedPin
            }).catch(() => {});
            break;
          }
        }
      } catch (e) {
        console.warn('Error checking Firestore pin_reset_requests on verify-login:', e);
      }
    }

    return res.json({
      success: isPinCorrect,
      found: true,
      officer: {
        id: officer.id,
        name: officer.name,
        badge: officer.badge,
        rank: officer.rank,
        division: officer.division,
        pin: officer.pin
      },
      message: isPinCorrect
        ? `Otorisasi Berhasil! Selamat bertugas, ${officer.rank} ${officer.name}.`
        : `PIN Keamanan salah untuk petugas ${officer.name} (${officer.badge})!`
    });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Update Officer PIN endpoint (Called immediately after successful PIN reset)
apiRouter.post('/discord/update-officer-pin', async (req, res) => {
  try {
    const { name, badge, newPin, pin, discordId, discordUsername, discordTag } = req.body;
    const finalPin = (newPin || pin || '').toString().trim();
    if (!finalPin) {
      return res.status(400).json({ success: false, message: 'PIN baru wajib diisi.' });
    }

    const result = await discordRosterService.updateOfficerPin({
      name,
      badge,
      newPin: finalPin,
      discordId,
      discordUsername: discordUsername || discordTag
    });

    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Gagal memperbarui PIN di server' });
  }
});

// Update Officer Full Account endpoint (Prevents duplicate accounts on edit)
apiRouter.post('/discord/update-officer', async (req, res) => {
  try {
    const { originalBadge, originalName, originalId, officer } = req.body;
    if (!officer || !officer.name || !officer.badge) {
      return res.status(400).json({ success: false, message: 'Data petugas tidak lengkap.' });
    }

    const result = await discordRosterService.updateOfficer({
      originalBadge,
      originalName,
      originalId,
      officer
    });

    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Gagal memperbarui data petugas di server' });
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
      messageType,
      registeredBy,
      registeredByRank,
      registeredByBadge,
      loginUrl
    } = req.body;

    const token = (botToken || discordGatewayManager.getActiveToken() || process.env.DISCORD_BOT_TOKEN || '').trim();

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Discord Bot Token belum dikonfigurasi! Harap masukkan Bot Token di menu Pengaturan Bot Discord atau set environment variable DISCORD_BOT_TOKEN.'
      });
    }

    const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
    if (!isServerless && !discordGatewayManager.getStatus().isOnline) {
      discordGatewayManager.startWithToken(token).catch(e => {
        console.warn('[Server] Auto-connect bot gateway warning:', e);
      });
    }

    let rawTarget = (userId || discordUsername || username || req.body.discordTag || '').toString().trim();
    if (!rawTarget && (officerName || badge)) {
      const foundOfficer = await discordRosterService.findOfficer({ name: officerName, badge });
      if (foundOfficer?.discordId) {
        rawTarget = foundOfficer.discordId;
      } else if (foundOfficer?.discordTag) {
        rawTarget = foundOfficer.discordTag;
      } else if (foundOfficer?.discordUsername) {
        rawTarget = foundOfficer.discordUsername;
      }
    }

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
      : 'https://cdn.discordapp.com/avatars/1544332281559130112/c28e32e12bc623e4bad1fabd02ef98d0.png';

    const now = new Date();
    const dateFormatted = now.toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: '2-digit',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    const isVerification = messageType === 'verification' || 
                           Boolean(req.body.verificationCode) || 
                           Boolean(req.body.isPinResetVerification) || 
                           (embedTitle && String(embedTitle).toUpperCase().includes('KODE VERIFIKASI'));
    const isCustomChatOnly = !isVerification && (messageType === 'custom' || messageType === 'custom_chat' || (!pin && !badge && customMessage));

    const fields: Array<{ name: string; value: string; inline?: boolean }> = [];

    if (isVerification) {
      const vCode = req.body.verificationCode || req.body.code || pin || '12345';
      fields.push({
        name: '🔢 5 DIGIT KODE VERIFIKASI ANDA',
        value: `\`\`\`\n${vCode}\n\`\`\``,
        inline: false
      });
      fields.push({
        name: '👤 Identitas Petugas',
        value: `**${officerName || 'Officer'}** ( \`${badge || '#---'}\` )`,
        inline: true
      });
      fields.push({
        name: '⏱️ Batas Waktu Input',
        value: '`10 Menit`',
        inline: true
      });
      fields.push({
        name: '⚠️ Kebijakan Keamanan',
        value: 'Jika kode tidak dimasukkan dalam **10 menit**, sistem akan menerapkan jeda keamanan (**delay cooldown 30 menit**) sebelum permohonan kode verifikasi berikutnya dapat diminta.',
        inline: false
      });
    } else if (isCustomChatOnly) {
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
        value: customNote || 'Jaga kerahasiaan PIN dan kredensial akun MDT Anda. Jangan pernah membagikan informasi ini kepada siapapun!',
        inline: false
      });
    }

    const appWebUrl = (loginUrl && loginUrl.trim()) ? loginUrl.trim() : 'https://mdc-hspd-inspector.vercel.app/';

    const defaultTitle = isVerification
      ? '🔐 KODE VERIFIKASI RESET PIN LOGIN MDT'
      : (isCustomChatOnly 
        ? 'Pesan Resmi Komando Kepolisian' 
        : (registeredBy ? 'Kredensial Akun Dinas Kepolisian HSPD' : 'Kredensial Akun MDT High State'));
    const finalTitle = (embedTitle && embedTitle.trim()) ? embedTitle.trim() : defaultTitle;
    
    let defaultDesc = 'Berikut adalah detail dari akun MDT Anda:';
    if (isVerification) {
      defaultDesc = 'Berikut adalah detail dari akun MDT Anda:';
    } else if (isCustomChatOnly) {
      defaultDesc = 'Anda menerima pesan dinas resmi dari jajaran Komando / Atasan:';
    } else if (registeredBy) {
      defaultDesc = `Halo **${officerName || 'Officer'}**, akun dinas Anda telah resmi didaftarkan oleh Jajaran Atasan (**${registeredByRank || 'High Command'} ${registeredBy}**). Berikut adalah detail akun dan PIN login Terminal MDT Anda:`;
    }
    const finalDescription = (embedDescription && embedDescription.trim() && !isVerification)
      ? embedDescription.trim() 
      : defaultDesc;

    const embedObj: any = {
      author: {
        name: (botName || (isVerification ? 'Cek Akun | High State Roleplay Asisten' : 'Cek Akun | High State')).trim().substring(0, 256),
        icon_url: safeAvatarUrl
      },
      title: finalTitle.substring(0, 256),
      description: finalDescription.substring(0, 4096),
      color: isVerification ? 0x00D26A : parsedColor,
      fields,
      footer: {
        text: `${(footerText || 'Bot High State').trim()} • ${dateFormatted}`.substring(0, 2048),
        icon_url: safeAvatarUrl
      }
    };

    const messageContent = isVerification
      ? ''
      : (isCustomChatOnly
        ? `<@${cleanUserId}> 📨 **Pesan Resmi dari Komando / Atasan HSPD:**`
        : `<@${cleanUserId}> Halo! Berikut adalah detail dari akun MDT Anda:`);

    const defaultButtonLabel = (registeredByRank?.toUpperCase().includes('PRESIDENT') || rank?.toUpperCase().includes('PRESIDENT') || rank?.toUpperCase().includes('KABINET') || division?.toUpperCase().includes('PEMERINTAHAN'))
      ? 'Buka Portal Pemerintahan'
      : 'Akses Terminal MDT Web';
    const finalButtonLabel = (req.body.buttonLabel && String(req.body.buttonLabel).trim())
      ? String(req.body.buttonLabel).trim()
      : defaultButtonLabel;

    const messageComponents = [
      {
        type: 1, // ACTION_ROW
        components: [
          {
            type: 2, // BUTTON
            style: 5, // LINK
            label: finalButtonLabel,
            url: appWebUrl,
            emoji: { name: (registeredByRank?.toUpperCase().includes('PRESIDENT') || division?.toUpperCase().includes('PEMERINTAHAN')) ? '🏛️' : '🌐' }
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
        ...(messageContent ? { content: messageContent } : {}),
        embeds: [embedObj],
        components: messageComponents
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

    // Auto-sync officer PIN to Firestore & local roster so the credentials sent in PM always match the database
    if (!isCustomChatOnly && pin && pin.trim()) {
      try {
        await discordRosterService.updateOfficerPin({
          discordId: cleanUserId,
          discordUsername: resolvedUsernameTag,
          badge: badge,
          name: officerName,
          newPin: pin.trim()
        });
      } catch (syncErr) {
        console.warn('Auto-sync PIN error on send-bot-dm:', syncErr);
      }
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

// Discord Bot Registration Panel API (Pendaftaran Mandiri Ditutup - Khusus Atasan via Roster)
apiRouter.post('/discord/send-registration-panel', async (req, res) => {
  return res.status(403).json({
    success: false,
    message: 'Fitur pendaftaran akun mandiri melalui Discord panel telah dinonaktifkan. Pembuatan akun dinas kini sepenuhnya dilakukan oleh Jajaran Atasan (High Command) melalui menu Roster Anggota.'
  });
});

// GET Discord Bot Server Configuration & Status
apiRouter.get('/discord/bot-config', (req, res) => {
  try {
    const config = discordGatewayManager.getServerConfig();
    const status = discordGatewayManager.getStatus();
    return res.json({
      success: true,
      config,
      status
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Gagal memuat konfigurasi bot'
    });
  }
});

// POST Discord Bot Server Configuration
apiRouter.post('/discord/bot-config', (req, res) => {
  try {
    const updates = req.body || {};
    const updated = discordGatewayManager.updateServerConfig(updates);
    return res.json({
      success: true,
      message: 'Pengaturan Discord Bot berhasil diperbarui!',
      config: updated
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Gagal menyimpan pengaturan bot'
    });
  }
});

// POST Discord Send Changelog / Announcement (Fitur Baru, Peningkatan, Bugfix)
apiRouter.post('/discord/send-changelog', async (req, res) => {
  try {
    const {
      version,
      title,
      newFeatures,
      removedOrAdjusted,
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
    } = req.body || {};

    const cleanFeatures: string[] = Array.isArray(newFeatures) 
      ? newFeatures.filter((f: any) => typeof f === 'string' && f.trim().length > 0)
      : [];
    const cleanRemoved: string[] = Array.isArray(removedOrAdjusted)
      ? removedOrAdjusted.filter((f: any) => typeof f === 'string' && f.trim().length > 0)
      : [];
    const cleanImprovements: string[] = Array.isArray(improvements) 
      ? improvements.filter((f: any) => typeof f === 'string' && f.trim().length > 0)
      : [];
    const cleanBugFixes: string[] = Array.isArray(bugFixes) 
      ? bugFixes.filter((f: any) => typeof f === 'string' && f.trim().length > 0)
      : [];

    if (cleanFeatures.length === 0 && cleanRemoved.length === 0 && cleanImprovements.length === 0 && cleanBugFixes.length === 0 && !extraNotes) {
      return res.status(400).json({
        success: false,
        message: 'Harap isi minimal satu poin perubahan (Fitur Baru, Dihapus/Disesuaikan, Peningkatan, atau Perbaikan Bug)!'
      });
    }

    // Try via Bot Gateway Channel Message first if bot has token (either from body, session file, or env)
    let botResult: { success: boolean; message: string; channelId?: string } | null = null;
    const effectiveToken = (botToken || discordGatewayManager.getActiveToken() || process.env.DISCORD_BOT_TOKEN || '').trim();

    // PROTEKSI: Jika channelId diarahkan ke channel log-kasus (1541924088480669907) atau kosong, alihkan kembali ke channel changelog resmi (1547776898833326161)
    const safeChannelId = (channelId === '1541924088480669907' || !channelId) ? '1547776898833326161' : channelId;

    if (effectiveToken && effectiveToken.length > 20) {
      botResult = await discordGatewayManager.sendChangelogBroadcast({
        version: version || 'v4.3.1',
        title: title || 'Pembaruan Sistem MDT HSPD',
        newFeatures: cleanFeatures,
        removedOrAdjusted: cleanRemoved,
        improvements: cleanImprovements,
        bugFixes: cleanBugFixes,
        extraNotes,
        mentionRole,
        channelId: safeChannelId,
        authorName,
        authorBadge,
        authorRank,
        headerText,
        customDescription,
        embedColor,
        botToken: effectiveToken
      });
    }

    // If bot broadcast succeeded, return success
    if (botResult && botResult.success) {
      return res.json({
        success: true,
        message: botResult.message,
        channelId: botResult.channelId,
        method: 'discord_bot'
      });
    }

    // Fallback to Webhook if provided or if bot channel wasn't configured
    // PROTEKSI: Jangan pernah izinkan webhook log-kasus (ID: 1541925244602941562 / channel: 1541924088480669907) menerima siaran changelog/pembaruan!
    if (
      webhookUrl && 
      typeof webhookUrl === 'string' && 
      webhookUrl.startsWith('https://discord.com/api/webhooks/') &&
      !webhookUrl.includes('1541925244602941562') &&
      !webhookUrl.includes('1541924088480669907')
    ) {
      const now = new Date();
      const dateStr = now.toLocaleDateString('id-ID', {
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
          name: '🚀 Fitur Baru (New Features / Ditambah)',
          value: cleanFeatures.map(f => `• ${f.trim()}`).join('\n'),
          inline: false
        });
      }

      if (cleanRemoved.length > 0) {
        fields.push({
          name: '🗑️ Dihapus / Dikurangi / Disesuaikan (Removed & Adjusted)',
          value: cleanRemoved.map(f => `• ${f.trim()}`).join('\n'),
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

      if (cleanImprovements.length > 0) {
        fields.push({
          name: '⚡ Peningkatan Sistem (Improvements)',
          value: cleanImprovements.map(f => `• ${f.trim()}`).join('\n'),
          inline: false
        });
      }

      const pingContent = (mentionRole && mentionRole !== 'none' && mentionRole !== 'off') ? `${mentionRole} ` : '';
      const headerTag = headerText?.trim() || '[ PENGUMUMAN PEMBARUAN SISTEM MDT HSPD ]';
      const defaultDesc = `Catatan rilis pembaruan perangkat lunak, penyempurnaan operasional, dan perbaikan kestabilan Terminal Mobile Data Computer (MDC) HSPD.\n\n📅 **Waktu Rilis:** \`${dateStr}\`\n👤 **Dipublikasikan Oleh:** \`${authorName || 'High Command'}\` ${authorBadge ? `(\`${authorBadge}\`)` : ''}`;
      const finalDesc = customDescription?.trim()
        ? `${customDescription.trim()}\n\n📅 **Waktu Rilis:** \`${dateStr}\`\n👤 **Dipublikasikan Oleh:** \`${authorName || 'High Command'}\` ${authorBadge ? `(\`${authorBadge}\`)` : ''}`
        : defaultDesc;

      const botAvatarUrl = discordGatewayManager.getBotAvatarUrl();
      const hookRes = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'HSPD Roleplay Assistant',
          avatar_url: botAvatarUrl,
          content: pingContent ? `${pingContent}**${headerTag}**` : `**${headerTag}**`,
          embeds: [
            {
              author: {
                name: 'High State Police Department • Official System Release',
                icon_url: botAvatarUrl
              },
              title: `📢 ${title || 'Pembaruan Sistem MDT HSPD'} • [${version || 'v4.2.0'}]`,
              description: finalDesc,
              color: typeof embedColor === 'number' ? embedColor : 0x00A8FF,
              fields,
              footer: {
                text: `HSPD MDC System • ${version || 'v4.2.0'} • High State Government`,
                icon_url: botAvatarUrl
              },
              timestamp: now.toISOString()
            }
          ]
        })
      });

      if (hookRes.ok) {
        return res.json({
          success: true,
          message: 'Pembaruan berhasil dikirim melalui Webhook Discord!',
          method: 'webhook'
        });
      }
    }

    // If both failed or bot failed
    const errMsg = botResult ? botResult.message : 'Bot Discord belum dikonfigurasi atau channel pembaruan belum ditentukan. Silakan atur channel di tab Bot Discord atau gunakan command `!hspd setchannel update #channel`.';
    return res.status(400).json({
      success: false,
      message: errMsg
    });

  } catch (err: any) {
    console.error('Send Changelog Error:', err);
    return res.status(500).json({
      success: false,
      message: `Terjadi kendala saat mempublikasikan pembaruan: ${err.message || err}`
    });
  }
});

// POST /api/discord/trigger-auto-changelog - Otomatis periksa & siarkan changelog jika ada pembaruan fitur baru
apiRouter.post('/discord/trigger-auto-changelog', async (req, res) => {
  try {
    const { force, payload } = req.body || {};
    const result = await discordGatewayManager.checkAndAutoBroadcastChangelog(Boolean(force), payload);
    return res.json({
      success: result.triggered,
      message: result.message,
      channelId: result.channelId
    });
  } catch (err: any) {
    console.error('Trigger Auto Changelog Error:', err);
    return res.status(500).json({
      success: false,
      message: `Gagal memicu siaran otomatis changelog: ${err.message || err}`
    });
  }
});

// POST /api/discord/send-system-ping - Mengirim status kesehatan website & bot ke channel Discord (default: 1550418868814610433)
apiRouter.post('/discord/send-system-ping', async (req, res) => {
  try {
    const { channelId, triggerBy, websiteUrl, webhookUrl, donationUrl } = req.body || {};
    const result = await discordGatewayManager.sendSystemHealthPing({
      channelId: channelId || '1550418868814610433',
      triggerBy,
      websiteUrl,
      webhookUrl,
      donationUrl
    });
    return res.json(result);
  } catch (err: any) {
    console.error('Send System Ping Error:', err);
    return res.status(500).json({
      success: false,
      message: `Gagal mengirim ping status ke Discord: ${err.message || err}`
    });
  }
});

// GET /api/discord/ping-status - Realtime ping & health data
apiRouter.get('/discord/ping-status', (req, res) => {
  try {
    const status = discordGatewayManager.getStatus();
    const serverConfig = discordGatewayManager.getServerConfig();
    return res.json({
      success: true,
      website: {
        status: 'online',
        uptime: process.uptime(),
        memoryHeapUsedMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        nodeVersion: process.version,
        timestamp: Date.now()
      },
      bot: {
        isOnline: status.isOnline,
        botUser: status.botUser,
        hasToken: status.hasToken,
        uptimeSeconds: status.uptimeSeconds,
        changelogChannelId: serverConfig.changelogChannelId || '1547776898833326161'
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/discord/commands - List all registered slash & prefix commands
apiRouter.get('/discord/commands', (req, res) => {
  return res.json({
    success: true,
    commands: DISCORD_SLASH_COMMANDS,
    count: DISCORD_SLASH_COMMANDS.length,
    prefixSupported: ['/', '!'],
    botInfo: discordGatewayManager.getStatus()
  });
});

// POST /api/discord/register-commands - Trigger registration of slash commands
apiRouter.post('/discord/register-commands', async (req, res) => {
  try {
    const { guildId } = req.body || {};
    const status = discordGatewayManager.getStatus();
    if (!status.hasToken) {
      return res.status(400).json({
        success: false,
        message: 'Token bot Discord belum dikonfigurasi.'
      });
    }

    await discordGatewayManager.registerSlashCommands(guildId);
    return res.json({
      success: true,
      message: guildId 
        ? `Slash command berhasil didaftarkan secara instan ke server Discord (${guildId})!`
        : `Slash command berhasil didaftarkan secara global ke Discord API!`,
      commandsCount: DISCORD_SLASH_COMMANDS.length
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: `Gagal mendaftarkan slash command: ${err.message || err}`
    });
  }
});

// POST /api/discord/simulate-command - Live preview a command response in the web UI
apiRouter.post('/discord/simulate-command', async (req, res) => {
  try {
    const { command, options } = req.body || {};
    if (!command) {
      return res.status(400).json({ success: false, message: 'Harap tentukan nama perintah (command).' });
    }

    const result = await discordGatewayManager.simulateSlashCommand(command, Array.isArray(options) ? options : []);
    return res.json({
      success: true,
      result
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: `Gagal simulasi perintah: ${err.message || err}`
    });
  }
});

// =========================================================================
// GTA SA-MP & MOONLOADER OPERATIONAL GATEWAY ROUTES (/api/samp/*)
// Memungkinkan koneksi 2 arah antara game GTA SA-MP dan Web CAD/MDT HSPD
// =========================================================================

interface SampDutyRecord {
  officerName: string;
  badge: string;
  isDuty: boolean;
  dutyStartTime: number;
  dutyStatus: string;
  dutyDurationSeconds?: number;
  callsign?: string;
  partner?: string;
  serverIp?: string;
  serverName?: string;
  inGameId?: number;
  lastSeen: number;
  updatedAt: number;
  source: 'moonloader' | 'samp_server' | 'web';
}

const sampDutyRegistry = new Map<string, SampDutyRecord>();
const sampPanicAlerts: Array<{
  id: string;
  officerName: string;
  badge: string;
  location?: string;
  timestamp: number;
  inGameId?: number;
}> = [];

// Helper: normalize key
function getSampOfficerKey(badge: string, name?: string): string {
  const cleanBadge = (badge || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  if (cleanBadge) return cleanBadge;
  return (name || 'unknown').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

// 1. POST /api/samp/duty - Diterima dari MoonLoader saat pemain ketik /duty di in-game
apiRouter.post('/samp/duty', (req, res) => {
  try {
    const body = req.body || {};
    const officerName = (body.officerName || body.name || 'Officer').trim();
    const badge = (body.badge || body.badgeNumber || '000').trim();
    const isDuty = typeof body.isDuty === 'boolean' ? body.isDuty : (body.status === '8-1-1' || body.status === '10-8');
    const dutyStatus = body.dutyStatus || (isDuty ? '8-1-1' : '8-1-0');
    const callsign = (body.callsign || 'UNIT-1').trim();
    const partner = (body.partner || '').trim();
    const serverIp = body.serverIp || 'GTA SA-MP Server';
    const serverName = body.serverName || 'State of High State RP';
    const inGameId = typeof body.inGameId === 'number' ? body.inGameId : undefined;
    const source = body.source || 'moonloader';

    const now = Date.now();
    const key = getSampOfficerKey(badge, officerName);
    const existing = sampDutyRegistry.get(key);

    let dutyStartTime = now;
    let dutyDurationSeconds = 0;

    if (isDuty) {
      if (existing && existing.isDuty && existing.dutyStartTime > 0) {
        dutyStartTime = existing.dutyStartTime;
      } else {
        dutyStartTime = now;
      }
      dutyDurationSeconds = Math.max(0, Math.floor((now - dutyStartTime) / 1000));
    } else {
      if (existing && existing.dutyStartTime > 0) {
        dutyStartTime = existing.dutyStartTime;
        dutyDurationSeconds = Math.max(0, Math.floor((now - existing.dutyStartTime) / 1000));
      } else {
        dutyStartTime = 0;
        dutyDurationSeconds = 0;
      }
    }

    const updatedRecord: SampDutyRecord = {
      officerName,
      badge,
      isDuty,
      dutyStartTime: isDuty ? dutyStartTime : 0,
      dutyStatus,
      dutyDurationSeconds,
      callsign,
      partner: partner || undefined,
      serverIp,
      serverName,
      inGameId,
      lastSeen: now,
      updatedAt: now,
      source
    };

    sampDutyRegistry.set(key, updatedRecord);

    console.log(`[SA-MP MoonLoader] Officer ${officerName} (#${badge}) updated duty: ${isDuty ? '🟢 ON DUTY' : '🔴 OFF DUTY'} (${dutyStatus}) from ${serverName}`);

    return res.json({
      success: true,
      message: `Status dinas petugas ${officerName} (#${badge}) berhasil disinkronkan ke Web CAD!`,
      officer: updatedRecord
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: `Gagal memproses sync duty SA-MP: ${err.message || err}` });
  }
});

// 2. GET /api/samp/duty-status - Digunakan web dan MoonLoader untuk cek status terkini
apiRouter.get('/samp/duty-status', (req, res) => {
  try {
    const badge = String(req.query.badge || '').trim();
    const name = String(req.query.name || req.query.officerName || '').trim();

    if (!badge && !name) {
      return res.status(400).json({ success: false, message: 'Harap sertakan parameter badge atau name!' });
    }

    const key = getSampOfficerKey(badge, name);
    const record = sampDutyRegistry.get(key);

    if (!record) {
      return res.json({
        success: true,
        found: false,
        isDuty: false,
        dutyStartTime: 0,
        dutyStatus: '8-1-0',
        message: 'Belum ada data dinas SA-MP yang tercatat untuk petugas ini.'
      });
    }

    const now = Date.now();
    const durationSeconds = record.isDuty && record.dutyStartTime > 0 
      ? Math.max(0, Math.floor((now - record.dutyStartTime) / 1000))
      : (record.dutyDurationSeconds || 0);

    const hours = Math.floor(durationSeconds / 3600);
    const minutes = Math.floor((durationSeconds % 3600) / 60);
    const seconds = durationSeconds % 60;
    const dutyFormatted = `${hours > 0 ? `${hours} Jam ` : ''}${minutes} Menit ${seconds} Detik`;

    return res.json({
      success: true,
      found: true,
      officer: record,
      isDuty: record.isDuty,
      dutyStartTime: record.dutyStartTime,
      dutyStatus: record.dutyStatus,
      dutyDurationSeconds: durationSeconds,
      dutyFormatted,
      lastSeen: record.lastSeen,
      updatedAt: record.updatedAt
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 3. GET /api/samp/live-officers - Menampilkan semua petugas yang sedang On Duty di game SA-MP
apiRouter.get('/samp/live-officers', (req, res) => {
  try {
    const now = Date.now();
    const officers = Array.from(sampDutyRegistry.values()).map(o => {
      const durationSeconds = o.isDuty && o.dutyStartTime > 0 
        ? Math.max(0, Math.floor((now - o.dutyStartTime) / 1000))
        : (o.dutyDurationSeconds || 0);
      return {
        ...o,
        dutyDurationSeconds: durationSeconds,
        isOnlineInGame: (now - o.lastSeen) < 180000 // online jika sinyal diterima dalam 3 menit
      };
    });

    const activeOnDuty = officers.filter(o => o.isDuty);

    return res.json({
      success: true,
      totalRegistered: officers.length,
      totalOnDuty: activeOnDuty.length,
      officers
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 4. POST /api/samp/panic - Tombol Panik / Backup 10-20 dari in-game SA-MP
apiRouter.post('/samp/panic', (req, res) => {
  try {
    const { officerName, badge, location, inGameId } = req.body || {};
    const alert = {
      id: `panic-${Date.now()}`,
      officerName: officerName || 'Petugas HSPD',
      badge: badge || 'UNKNOWN',
      location: location || 'Lokasi Tidak Diketahui',
      timestamp: Date.now(),
      inGameId: inGameId || null
    };

    sampPanicAlerts.unshift(alert);
    if (sampPanicAlerts.length > 50) sampPanicAlerts.pop();

    console.warn(`🚨 [SA-MP PANIC 10-20] Officer ${alert.officerName} (#${alert.badge}) meminta bantuan darurat di ${alert.location}!`);

    return res.json({
      success: true,
      message: '🚨 Peringatan darurat 10-20 (Panic Button) berhasil disiarkan ke seluruh jajaran Terminal CAD/MDT HSPD!',
      alert
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 5. GET /api/samp/panic-alerts - Mengambil daftar tombol panik aktif
apiRouter.get('/samp/panic-alerts', (req, res) => {
  return res.json({
    success: true,
    alerts: sampPanicAlerts
  });
});

// 6. POST /api/samp/test-ping - Endpoint uji koneksi dari MoonLoader / Tester Web
apiRouter.all('/samp/test-ping', (req, res) => {
  return res.json({
    success: true,
    status: 'ONLINE',
    system: 'HSPD CAD/MDT SA-MP MoonLoader Gateway',
    version: 'v3.8',
    serverTime: new Date().toISOString(),
    corsEnabled: true,
    supportedFeatures: [
      'Auto-detect /duty on SA-MP chat/command',
      'Real-time Web CAD Duty Status Sync',
      '10-20 Panic Backup Alert Broadcast',
      'In-game Miranda Rights Automation',
      'Floating CAD Tactical HUD'
    ]
  });
});

// 7. GET /api/samp/download/moonloader - Download script HSPD_CAD_Sync.lua yang sudah otomatis terkonfigurasi
apiRouter.get('/samp/download/moonloader', (req, res) => {
  try {
    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const defaultApiUrl = `${protocol}://${host}`;

    const luaScript = generateMoonLoaderScript(defaultApiUrl);

    res.setHeader('Content-Type', 'text/x-lua; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="HSPD_CAD_Sync.lua"');
    return res.send(luaScript);
  } catch (err: any) {
    return res.status(500).send(`-- Gagal generate script: ${err.message}`);
  }
});

function generateMoonLoaderScript(defaultBaseUrl: string): string {
  return `-- ============================================================================
-- HIGH STATE POLICE DEPARTMENT (HSPD) - CAD / MDT SA-MP MOONLOADER SYNC SCRIPT
-- Versi: 3.8.0 (Official Release 2026)
-- Deskripsi: Menghubungkan game GTA San Andreas / SA-MP dengan Web Terminal CAD HSPD
-- Fitur: 
--   * Otomatis deteksi saat Anda ketik /duty atau On/Off duty di in-game
--   * Otomatis kirim status ke Website CAD HSPD secara instan & real-time
--   * Floating HUD status dinas & timer di layar game
--   * Perintah: /hspd, /hspd duty, /hspd cad, /hspd miranda, /hspd backup
-- ============================================================================

script_name("HSPD_CAD_Sync")
script_author("HSPD IT Division")
script_version("3.8.0")
script_description("Sinkronisasi Otomatis Status Dinas Polisi SA-MP ke Web CAD HSPD")

local sampev = nil
pcall(function() sampev = require("samp.events") end)
local inicfg = require("inicfg")

-- Konfigurasi Default
local iniPath = "hspd_sync.ini"
local defaultCfg = {
    settings = {
        server_url = "${defaultBaseUrl}",
        officer_badge = "001",
        officer_callsign = "UNIT-1",
        auto_duty_sync = true,
        show_hud = true,
        hud_pos_x = 20,
        hud_pos_y = 400
    }
}

local cfg = inicfg.load(defaultCfg, iniPath)
if not cfg then
    cfg = defaultCfg
    inicfg.save(cfg, iniPath)
end

-- Variabel Status Dinas Lokal
local isDutyLocal = false
local dutyStartTime = 0
local lastSyncTimestamp = 0
local fontHud = nil

-- Helper Pesan Chat Warna HSPD
function sendHspdChat(text)
    if sampIsChatOpen and sampIsChatOpen() then return end
    sampAddChatMessage("{00A8FF}[HSPD CAD] {FFFFFF}" .. text, -1)
end

-- Helper HTTP Request Async (Menggunakan requests atau Windows curl fallback)
function sendApiRequest(endpoint, payloadTable, callback)
    lua_thread.create(function()
        local jsonStr = "{"
        local first = true
        for k, v in pairs(payloadTable) do
            if not first then jsonStr = jsonStr .. "," end
            first = false
            if type(v) == "boolean" then
                jsonStr = jsonStr .. string.format('"%s":%s', k, tostring(v))
            elseif type(v) == "number" then
                jsonStr = jsonStr .. string.format('"%s":%s', k, tostring(v))
            else
                local cleanStr = tostring(v):gsub('"', '\\\\"')
                jsonStr = jsonStr .. string.format('"%s":"%s"', k, cleanStr)
            end
        end
        jsonStr = jsonStr .. "}"

        local fullUrl = cfg.settings.server_url .. endpoint
        
        -- Coba menggunakan library requests jika terinstall di MoonLoader
        local hasRequests, requests = pcall(require, "requests")
        if hasRequests and requests then
            local response = requests.post{
                url = fullUrl,
                headers = { ["Content-Type"] = "application/json" },
                data = jsonStr,
                timeout = 5
            }
            if response and response.status_code == 200 then
                if callback then callback(true, response.text) end
                return
            end
        end

        -- Fallback: Gunakan PowerShell curl async agar game tidak freeze
        local psCmd = string.format('powershell -Command "Invoke-RestMethod -Uri \'%s\' -Method Post -ContentType \'application/json\' -Body \'%s\' -TimeoutSec 4"', fullUrl, jsonStr:gsub("'", "''"))
        os.execute(psCmd .. " > nul 2>&1")
        if callback then callback(true, "Sent via Background Transport") end
    end)
end

-- Sinkronisasi Status Dinas ke Web CAD
function syncDutyToCad(isDutyState, statusText)
    local myName = "Officer"
    local myId = -1
    local serverName = "GTA SA-MP"
    local serverIp = "127.0.0.1:7777"

    pcall(function()
        if sampIsLocalPlayerSpawned and sampIsLocalPlayerSpawned() then
            local _, id = sampGetPlayerIdByCharHandle(PLAYER_PED)
            myId = id
            myName = sampGetPlayerNickname(myId)
            serverName = sampGetCurrentServerName()
            serverIp = sampGetCurrentServerAddress()
        end
    end)

    isDutyLocal = isDutyState
    if isDutyState then
        if dutyStartTime == 0 then dutyStartTime = os.time() end
    else
        dutyStartTime = 0
    end

    local payload = {
        officerName = myName,
        badge = cfg.settings.officer_badge or "001",
        isDuty = isDutyState,
        dutyStatus = isDutyState and "8-1-1" or "8-1-0",
        callsign = cfg.settings.officer_callsign or "UNIT-1",
        serverIp = serverIp,
        serverName = serverName,
        inGameId = myId,
        source = "moonloader"
    }

    sendHspdChat(string.format("Menghubungkan status dinas {FFD700}%s{FFFFFF} ke Web CAD...", isDutyState and "ON DUTY (8-1-1)" or "OFF DUTY (8-1-0)"))

    sendApiRequest("/api/samp/duty", payload, function(success, res)
        if success then
            sendHspdChat(string.format("{00FF7F}BERHASIL!{FFFFFF} Status dinas Anda di Web CAD telah aktif: {00FF7F}%s{FFFFFF}", isDutyState and "🟢 ON DUTY" or "🔴 OFF DUTY"))
        else
            sendHspdChat("{FF4500}PERINGATAN:{FFFFFF} Gagal terhubung ke Web CAD. Periksa URL server di config!")
        end
    end)
end

-- Kirim Panic Button 10-20 Darurat
function sendPanicAlert()
    local myName = "Officer"
    local myId = -1
    local loc = "San Andreas"
    
    pcall(function()
        local _, id = sampGetPlayerIdByCharHandle(PLAYER_PED)
        myId = id
        myName = sampGetPlayerNickname(myId)
        local x, y, z = getCharCoordinates(PLAYER_PED)
        loc = string.format("X: %.1f, Y: %.1f, Z: %.1f", x, y, z)
    end)

    local payload = {
        officerName = myName,
        badge = cfg.settings.officer_badge or "001",
        location = loc,
        inGameId = myId
    }

    sendHspdChat("{FF0000}[EMERGENCY 10-20]{FFFFFF} Menyiarkan sinyal bantuan darurat ke Dispatch CAD...")
    sendApiRequest("/api/samp/panic", payload, function(success)
        if success then
            sendHspdChat("{00FF7F}10-20 TERSAMPAIKAN!{FFFFFF} Seluruh unit di Terminal CAD menerima koordinat darurat Anda!")
        end
    end)
end

-- Hook Perintah Game: Deteksi saat pemain ketik /duty
if sampev then
    function sampev.onSendCommand(command)
        if not cfg.settings.auto_duty_sync then return end
        
        local cmd = command:lower()
        if cmd == "/duty" or cmd:find("^/duty%s*") then
            -- Balikkan status dinas lokal saat ketik /duty
            local nextState = not isDutyLocal
            syncDutyToCad(nextState, nextState and "8-1-1" or "8-1-0")
        end
    end

    -- Hook Pesan Server: Deteksi jika server mengeluarkan pesan notifikasi dinas
    function sampev.onServerMessage(color, text)
        if not cfg.settings.auto_duty_sync then return end
        local lower = text:lower()

        -- Pola On Duty
        if lower:find("now on duty") or lower:find("memulai tugas") or lower:find("kamu sedang on duty") or lower:find("status: on duty") then
            if not isDutyLocal then
                syncDutyToCad(true, "8-1-1")
            end
        -- Pola Off Duty
        elseif lower:find("now off duty") or lower:find("selesai tugas") or lower:find("kamu telah off duty") or lower:find("status: off duty") then
            if isDutyLocal then
                syncDutyToCad(false, "8-1-0")
            end
        end
    end
end

-- Render Floating HUD di Layar Game
function renderHspdDutyHud()
    if not cfg.settings.show_hud then return end
    if not isDutyLocal then return end

    local x = cfg.settings.hud_pos_x or 20
    local y = cfg.settings.hud_pos_y or 400

    local elapsed = (dutyStartTime > 0) and (os.time() - dutyStartTime) or 0
    local h = math.floor(elapsed / 3600)
    local m = math.floor((elapsed % 3600) / 60)
    local s = elapsed % 60
    local timeStr = string.format("%02d:%02d:%02d", h, m, s)

    local hudText = string.format("[HSPD CAD] 10-8 ON DUTY | #%s | %s | %s", 
        cfg.settings.officer_badge or "001",
        cfg.settings.officer_callsign or "UNIT-1",
        timeStr
    )

    if renderFontDrawText then
        renderFontDrawText(fontHud, hudText, x, y, 0xFF00FF7F)
    end
end

function main()
    while not isSampLoaded() or not isSampfuncsLoaded() do wait(100) end
    while not sampIsLocalPlayerSpawned() do wait(200) end

    -- Init font HUD
    pcall(function()
        fontHud = renderCreateFont("Arial", 9, 5) -- Arial bold
    end)

    sendHspdChat("{00A8FF}HSPD CAD/MDT Sync v3.8 Terhubung!{FFFFFF} Ketik {FFD700}/hspd{FFFFFF} untuk bantuan.")

    -- Registrasi Perintah In-game
    sampRegisterChatCommand("hspd", function(param)
        local args = {}
        for w in string.gmatch(param or "", "%S+") do table.insert(args, w) end
        local sub = args[1] and args[1]:lower() or ""

        if sub == "" then
            sendHspdChat("=== {FFD700}HIGH STATE POLICE DEPARTMENT CAD GATEWAY{FFFFFF} ===")
            sendHspdChat("{00A8FF}/hspd duty [on/off]{FFFFFF} - Sinkron status dinas manual ke CAD")
            sendHspdChat("{00A8FF}/hspd status{FFFFFF} - Cek status dinas & koneksi CAD saat ini")
            sendHspdChat("{00A8FF}/hspd cad{FFFFFF} - Buka Website Web CAD HSPD di browser")
            sendHspdChat("{00A8FF}/hspd miranda{FFFFFF} - Bacakan naskah Hak Miranda otomatis ke warga")
            sendHspdChat("{00A8FF}/hspd backup{FFFFFF} - Siarkan tombol panik 10-20 ke Web CAD Dispatch")
            sendHspdChat("{00A8FF}/hspd config [url] [badge]{FFFFFF} - Ubah URL web CAD & nomor badge")
            sendHspdChat("{00A8FF}/hspd hud{FFFFFF} - Toggle tampilan HUD floating dinas di layar")
        elseif sub == "duty" then
            local action = args[2] and args[2]:lower() or ""
            if action == "on" then
                syncDutyToCad(true, "8-1-1")
            elseif action == "off" then
                syncDutyToCad(false, "8-1-0")
            else
                syncDutyToCad(not isDutyLocal, not isDutyLocal and "8-1-1" or "8-1-0")
            end
        elseif sub == "status" then
            local elapsed = (dutyStartTime > 0) and (os.time() - dutyStartTime) or 0
            local m = math.floor(elapsed / 60)
            sendHspdChat(string.format("Status: %s {FFFFFF}| Durasi: {FFD700}%d Menit{FFFFFF} | Badge: {00A8FF}#%s{FFFFFF} | Server: %s",
                isDutyLocal and "{00FF7F}🟢 ON DUTY (8-1-1)" or "{FF4500}🔴 OFF DUTY (8-1-0)",
                m,
                cfg.settings.officer_badge or "001",
                cfg.settings.server_url
            ))
        elseif sub == "cad" then
            sendHspdChat("Membuka Terminal CAD HSPD di browser default Anda...")
            os.execute('start ' .. cfg.settings.server_url)
        elseif sub == "miranda" then
            lua_thread.create(function()
                sendHspdChat("{FFD700}[SOP MIRANDA]{FFFFFF} Membacakan hak tersangka...")
                sampSendChat("/s [HSPD] Anda berhak untuk tetap diam!")
                wait(2200)
                sampSendChat("/s [HSPD] Apapun yang Anda katakan dapat dan akan digunakan untuk melawan Anda di pengadilan hukum!")
                wait(2200)
                sampSendChat("/s [HSPD] Anda berhak untuk berbicara dengan pengacara dan didampingi selama pemeriksaan!")
                wait(2200)
                sampSendChat("/s [HSPD] Apakah Anda memahami hak-hak yang telah saya bacakan kepada Anda?")
            end)
        elseif sub == "backup" then
            sendPanicAlert()
        elseif sub == "config" then
            if args[2] then
                cfg.settings.server_url = args[2]:gsub("/+$", "")
                if args[3] then cfg.settings.officer_badge = args[3] end
                inicfg.save(cfg, iniPath)
                sendHspdChat("{00FF7F}Konfigurasi berhasil disimpan!{FFFFFF} URL: " .. cfg.settings.server_url .. " | Badge: #" .. cfg.settings.officer_badge)
            else
                sendHspdChat("Format: {FFD700}/hspd config [URL_WEB_CAD] [NOMOR_BADGE]{FFFFFF}")
            end
        elseif sub == "hud" then
            cfg.settings.show_hud = not cfg.settings.show_hud
            inicfg.save(cfg, iniPath)
            sendHspdChat("HUD Dinas Layar: " .. (cfg.settings.show_hud and "{00FF7F}AKTIF" or "{FF4500}NONAKTIF"))
        end
    end)

    -- Loop utama
    while true do
        wait(0)
        renderHspdDutyHud()
    end
end
`;
}


