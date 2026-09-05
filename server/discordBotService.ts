import WebSocket from 'ws';
import fs from 'fs';
import path from 'path';
import { discordRosterService, DiscordUserContext } from './discordRosterService';

interface BotUserInfo {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  bot?: boolean;
}

interface DiscordBotGatewayState {
  isOnline: boolean;
  botUser: BotUserInfo | null;
  startedAt: number | null;
  lastHeartbeatAck: number | null;
  lastError: string | null;
  reconnectAttempts: number;
}

const CONFIG_FILE_PATH = path.join(process.cwd(), '.discord_bot_session.json');

class DiscordGatewayManager {
  private ws: WebSocket | null = null;
  private token: string = '';
  private heartbeatIntervalTimer: NodeJS.Timeout | null = null;
  private heartbeatTimeoutTimer: NodeJS.Timeout | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private lastSequence: number | null = null;
  private sessionId: string | null = null;
  private resumeGatewayUrl: string | null = null;
  private isExplicitlyStopped: boolean = false;
  private state: DiscordBotGatewayState = {
    isOnline: false,
    botUser: null,
    startedAt: null,
    lastHeartbeatAck: null,
    lastError: null,
    reconnectAttempts: 0,
  };

  constructor() {
    this.loadSavedToken();
  }

  private loadSavedToken() {
    try {
      if (process.env.DISCORD_BOT_TOKEN && process.env.DISCORD_BOT_TOKEN.trim()) {
        this.token = process.env.DISCORD_BOT_TOKEN.trim();
        return;
      }
      if (fs.existsSync(CONFIG_FILE_PATH)) {
        const content = fs.readFileSync(CONFIG_FILE_PATH, 'utf-8');
        const parsed = JSON.parse(content);
        if (parsed.token && typeof parsed.token === 'string') {
          this.token = parsed.token.trim();
        }
      }
    } catch (e) {
      console.warn('[Discord Gateway] Failed to read saved session config:', e);
    }
  }

  private saveToken(token: string) {
    try {
      fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify({ token, savedAt: Date.now() }, null, 2), 'utf-8');
    } catch (e) {
      console.warn('[Discord Gateway] Failed to persist token file:', e);
    }
  }

  public getActiveToken(): string {
    return this.token;
  }

  public getStatus() {
    const uptimeSeconds = this.state.startedAt ? Math.floor((Date.now() - this.state.startedAt) / 1000) : 0;
    return {
      isOnline: this.state.isOnline,
      botUser: this.state.botUser,
      status: this.state.isOnline ? 'online' : 'offline',
      uptimeSeconds,
      lastError: this.state.lastError,
      hasToken: Boolean(this.token && this.token.length > 20),
    };
  }

  public async startWithToken(newToken?: string): Promise<{ success: boolean; message: string; botUser?: BotUserInfo }> {
    const tokenToUse = (newToken || this.token || process.env.DISCORD_BOT_TOKEN || '').trim();

    if (!tokenToUse) {
      this.state.lastError = 'Token bot tidak boleh kosong!';
      return { success: false, message: 'Token bot belum diisi!' };
    }

    // Validate token via Discord REST API first
    try {
      const meRes = await fetch('https://discord.com/api/v10/users/@me', {
        headers: { Authorization: `Bot ${tokenToUse}` }
      });
      if (!meRes.ok) {
        const errJson = await meRes.json().catch(() => ({}));
        const errMsg = errJson.message || `HTTP ${meRes.status} Unauthorized`;
        this.state.lastError = `Token Discord tidak valid: ${errMsg}`;
        this.state.isOnline = false;
        return { success: false, message: `Token bot ditolak oleh Discord: ${errMsg}` };
      }
      const meData = await meRes.json() as BotUserInfo;
      this.state.botUser = meData;
    } catch (err: any) {
      console.warn('[Discord Gateway] Warning checking user @me:', err.message);
    }

    this.token = tokenToUse;
    this.saveToken(tokenToUse);
    this.isExplicitlyStopped = false;
    this.state.lastError = null;

    // Connect WebSocket
    this.connect();

    return {
      success: true,
      message: 'Koneksi ke Discord Gateway dimulai. Bot akan segera menyala online (hijau)!',
      botUser: this.state.botUser || undefined,
    };
  }

  public stop() {
    this.isExplicitlyStopped = true;
    this.cleanupSocket();
    this.state.isOnline = false;
    this.state.startedAt = null;
  }

  private cleanupSocket() {
    if (this.heartbeatIntervalTimer) {
      clearInterval(this.heartbeatIntervalTimer);
      this.heartbeatIntervalTimer = null;
    }
    if (this.heartbeatTimeoutTimer) {
      clearTimeout(this.heartbeatTimeoutTimer);
      this.heartbeatTimeoutTimer = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      const socket = this.ws;
      this.ws = null;
      try {
        // Remove normal operational listeners so we don't handle messages or close events twice
        socket.removeAllListeners('open');
        socket.removeAllListeners('message');
        socket.removeAllListeners('close');
        // ALWAYS attach a no-op error handler. In ws, if a socket is closed while still CONNECTING,
        // it emits an 'error' event ("WebSocket was closed before the connection was established").
        // Without an active error listener, Node's EventEmitter crashes with "Unhandled 'error' event".
        socket.on('error', () => {});

        if (socket.readyState === WebSocket.OPEN) {
          socket.close(1000, 'Shutting down');
        } else {
          socket.terminate();
        }
      } catch {}
    }
  }

  private connect() {
    if (this.isExplicitlyStopped || !this.token) return;

    this.cleanupSocket();

    const gatewayEndpoint = this.resumeGatewayUrl 
      ? `${this.resumeGatewayUrl}?v=10&encoding=json` 
      : 'wss://gateway.discord.gg/?v=10&encoding=json';

    try {
      const ws = new WebSocket(gatewayEndpoint);
      this.ws = ws;

      // Attach 'error' handler IMMEDIATELY to prevent unhandled 'error' event crashes
      ws.on('error', (err: Error) => {
        console.warn('[Discord Gateway] WebSocket error:', err?.message || err);
        this.state.lastError = err?.message || 'WebSocket error';
      });

      ws.on('open', () => {
        console.log('[Discord Gateway] WebSocket connection opened.');
      });

      ws.on('message', (data: WebSocket.RawData) => {
        this.handleMessage(data);
      });

      ws.on('close', (code: number, reason: Buffer) => {
        const reasonStr = reason ? reason.toString() : '';
        console.warn(`[Discord Gateway] Closed with code ${code}: ${reasonStr}`);
        this.state.isOnline = false;

        // Specific fatal Discord Gateway close codes
        if (code === 4004) {
          this.state.lastError = 'Authentication failed: Token Discord Bot tidak valid.';
          console.error('[Discord Gateway] Fatal: Invalid Bot Token.');
          return;
        }
        if (code === 4013) {
          this.state.lastError = 'Invalid intents specified.';
          return;
        }
        if (code === 4014) {
          this.state.lastError = 'Disallowed intent(s). Please enable intents in Discord Developer Portal.';
          return;
        }

        // Auto-reconnect for transient errors
        if (!this.isExplicitlyStopped) {
          this.scheduleReconnect();
        }
      });

    } catch (e: any) {
      console.error('[Discord Gateway] Error initiating WebSocket:', e);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer || this.isExplicitlyStopped) return;
    this.state.reconnectAttempts += 1;
    const delay = Math.min(this.state.reconnectAttempts * 3000, 15000);
    console.log(`[Discord Gateway] Reconnecting in ${delay}ms (attempt #${this.state.reconnectAttempts})...`);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  private handleMessage(rawData: WebSocket.RawData) {
    try {
      const payload = JSON.parse(rawData.toString());
      const { op, d, s, t } = payload;

      if (s !== null && s !== undefined) {
        this.lastSequence = s;
      }

      switch (op) {
        // Opcode 10: Hello
        case 10: {
          const heartbeatInterval = d.heartbeat_interval;
          console.log(`[Discord Gateway] Received Hello. Heartbeat interval: ${heartbeatInterval}ms`);
          this.startHeartbeat(heartbeatInterval);

          // If we have sessionId and lastSequence, attempt Resume (Opcode 6)
          if (this.sessionId && this.lastSequence) {
            this.sendResume();
          } else {
            // Send Identify (Opcode 2)
            this.sendIdentify();
          }
          break;
        }

        // Opcode 11: Heartbeat ACK
        case 11: {
          this.state.lastHeartbeatAck = Date.now();
          if (this.heartbeatTimeoutTimer) {
            clearTimeout(this.heartbeatTimeoutTimer);
            this.heartbeatTimeoutTimer = null;
          }
          break;
        }

        // Opcode 1: Heartbeat requested by Discord
        case 1: {
          this.sendHeartbeat();
          break;
        }

        // Opcode 7: Reconnect requested by Discord
        case 7: {
          console.log('[Discord Gateway] Discord requested Reconnect (Opcode 7).');
          if (this.ws) {
            try {
              if (this.ws.readyState === WebSocket.OPEN) {
                this.ws.close(1012, 'Service Restart');
              } else {
                this.ws.terminate();
              }
            } catch {}
          }
          break;
        }

        // Opcode 9: Invalid Session
        case 9: {
          console.warn('[Discord Gateway] Invalid Session (Opcode 9). Resending Identify.');
          const canResume = d === true;
          if (canResume && this.sessionId) {
            this.sendResume();
          } else {
            this.sessionId = null;
            this.lastSequence = null;
            setTimeout(() => this.sendIdentify(), 2500);
          }
          break;
        }

        // Opcode 0: Dispatch Events
        case 0: {
          this.handleDispatch(t, d);
          break;
        }

        default:
          break;
      }
    } catch (err) {
      console.error('[Discord Gateway] Error parsing payload:', err);
    }
  }

  private startHeartbeat(interval: number) {
    if (this.heartbeatIntervalTimer) clearInterval(this.heartbeatIntervalTimer);

    // Initial jitter
    const firstJitter = Math.floor(Math.random() * interval * 0.5);
    setTimeout(() => {
      this.sendHeartbeat();

      this.heartbeatIntervalTimer = setInterval(() => {
        this.sendHeartbeat();
      }, interval);
    }, firstJitter);
  }

  private sendHeartbeat() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    try {
      this.ws.send(JSON.stringify({
        op: 1,
        d: this.lastSequence
      }));

      // Set watchdog timeout for ACK
      if (this.heartbeatTimeoutTimer) clearTimeout(this.heartbeatTimeoutTimer);
      this.heartbeatTimeoutTimer = setTimeout(() => {
        console.warn('[Discord Gateway] Heartbeat ACK timed out (zombie connection). Reconnecting...');
        if (this.ws) {
          try {
            if (this.ws.readyState === WebSocket.OPEN) {
              this.ws.close(4000, 'Heartbeat ACK timeout');
            } else {
              this.ws.terminate();
            }
          } catch {}
        }
      }, 15000);
    } catch (e) {
      console.warn('[Discord Gateway] Failed to send heartbeat:', e);
    }
  }

  private sendIdentify() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    console.log('[Discord Gateway] Sending Identify to establish Online (Green) presence...');
    const identifyPayload = {
      op: 2,
      d: {
        token: this.token,
        intents: 513, // Guilds (1) + Guild Messages (512)
        properties: {
          os: 'linux',
          browser: 'HSPD_Police_MDT',
          device: 'HSPD_Police_MDT'
        },
        presence: {
          activities: [
            {
              name: 'HSPD MDT Hub | Siaga 24/7',
              type: 0, // 0 = Playing ("Playing HSPD MDT Hub | Siaga 24/7")
              state: 'Patroli & Dispatch Aktif'
            }
          ],
          status: 'online', // Makes the bot icon light up BRIGHT GREEN (Online)!
          afk: false
        }
      }
    };

    try {
      this.ws.send(JSON.stringify(identifyPayload));
    } catch (e) {
      console.error('[Discord Gateway] Error sending identify:', e);
    }
  }

  private sendResume() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.sessionId) {
      this.sendIdentify();
      return;
    }

    console.log('[Discord Gateway] Resuming session:', this.sessionId);
    const resumePayload = {
      op: 6,
      d: {
        token: this.token,
        session_id: this.sessionId,
        seq: this.lastSequence
      }
    };

    try {
      this.ws.send(JSON.stringify(resumePayload));
    } catch {
      this.sendIdentify();
    }
  }

  private async handleDispatch(eventType: string, data: any) {
    if (eventType === 'READY') {
      this.sessionId = data.session_id;
      this.resumeGatewayUrl = data.resume_gateway_url || null;
      this.state.isOnline = true;
      this.state.startedAt = Date.now();
      this.state.reconnectAttempts = 0;
      this.state.lastError = null;

      if (data.user) {
        this.state.botUser = {
          id: data.user.id,
          username: data.user.username,
          discriminator: data.user.discriminator || '0',
          avatar: data.user.avatar || null,
          bot: true
        };
      }

      console.log(`[Discord Gateway] ✅ BOT IS NOW ONLINE (MENYALA HIJAU) 24/7!`);
      console.log(`[Discord Gateway] Connected as: ${this.state.botUser?.username} (ID: ${this.state.botUser?.id})`);
    } else if (eventType === 'RESUMED') {
      this.state.isOnline = true;
      this.state.lastError = null;
      console.log('[Discord Gateway] ✅ Session successfully resumed (Online).');
    } else if (eventType === 'INTERACTION_CREATE') {
      // Handle interactive Discord Components (Buttons and Modals)
      try {
        const interactionId = data.id;
        const interactionToken = data.token;
        const interactionType = data.type; // 2 = MESSAGE_COMPONENT, 5 = MODAL_SUBMIT
        const customId = data.data?.custom_id;
        
        const rawUser = data.member?.user || data.user || {};
        const discordUser: DiscordUserContext = {
          id: rawUser.id || 'unknown',
          username: rawUser.username || 'user',
          globalName: rawUser.global_name || null,
          discriminator: rawUser.discriminator || '0',
          avatarUrl: rawUser.avatar 
            ? `https://cdn.discordapp.com/avatars/${rawUser.id}/${rawUser.avatar}.png`
            : 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png'
        };

        const userTag = `<@${discordUser.id}>`;

        // Helper: send interaction callback response to Discord
        const sendCallback = async (payload: any) => {
          try {
            await fetch(`https://discord.com/api/v10/interactions/${interactionId}/${interactionToken}/callback`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
          } catch (e: any) {
            console.warn('[Discord Gateway] Failed to send interaction callback:', e?.message || e);
          }
        };

        // =========================================================================
        // 1. BUTTON CLICKS (type: 2)
        // =========================================================================
        if (interactionType === 2 || data.data?.component_type === 2) {
          
          // [ BUTTON: REGISTER ] -> Open Modal Form in Discord!
          if (customId === 'mdt_btn_register') {
            const modalPayload = {
              type: 9, // MODAL
              data: {
                custom_id: 'mdt_modal_register',
                title: 'Pendaftaran Akun MDT Kepolisian',
                components: [
                  {
                    type: 1, // Action Row
                    components: [
                      {
                        type: 4, // Text Input
                        custom_id: 'reg_ic_name',
                        label: 'Nama IC Karakter (Firstname Lastname)',
                        style: 1, // Short
                        min_length: 3,
                        max_length: 40,
                        placeholder: 'Contoh: Alex_Vance atau John Walker',
                        required: true
                      }
                    ]
                  },
                  {
                    type: 1, // Action Row
                    components: [
                      {
                        type: 4, // Text Input
                        custom_id: 'reg_pin',
                        label: 'PIN Keamanan Akun MDT (4-8 Digit)',
                        style: 1, // Short
                        min_length: 4,
                        max_length: 10,
                        placeholder: 'Contoh: 123456 (Hafalkan PIN untuk login)',
                        required: true
                      }
                    ]
                  }
                ]
              }
            };
            return await sendCallback(modalPayload);
          }

          // [ BUTTON: RESEND CODE / CEK STATUS ]
          if (customId === 'mdt_btn_resend_code') {
            const matchedOfficer = await discordRosterService.findOfficer({
              discordId: discordUser.id,
              discordUsername: discordUser.username
            });

            if (matchedOfficer) {
              const now = new Date();
              const dateFormatted = now.toLocaleDateString('en-US', {
                month: 'numeric',
                day: 'numeric',
                year: '2-digit',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              });

              // Send DM directly to the officer's Discord inbox
              const botToken = this.token || process.env.DISCORD_BOT_TOKEN || '';
              if (botToken) {
                await discordRosterService.sendDirectMessageToUser(botToken, discordUser.id, {
                  content: `<@${discordUser.id}> Halo! Berikut adalah detail dari akun UCP Anda:`,
                  embeds: [
                    {
                      author: {
                        name: 'Cek Akun | High State',
                        icon_url: 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png'
                      },
                      title: '✅ Berhasil!',
                      description: 'Berikut adalah detail dari akun UCP Anda:',
                      color: 0x00A8FF,
                      fields: [
                        { name: 'UCP', value: matchedOfficer.name, inline: false },
                        { name: 'Pin Code', value: matchedOfficer.pin || '10-4', inline: false },
                        { name: 'No. Badge & Pangkat', value: `\`${matchedOfficer.badge || '-'}\` • ${matchedOfficer.rank || '-'}`, inline: false },
                        { name: 'Divisi', value: matchedOfficer.division || 'Patrol Division', inline: false },
                        { name: 'Note', value: 'Jangan beritahu informasi ini kepada orang lain!\n*Gunakan nama UCP / Badge dan Pin Code di atas untuk login ke Terminal MDT Kepolisian.*', inline: false }
                      ],
                      footer: {
                        text: `Bot High State • ${dateFormatted}`,
                        icon_url: 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png'
                      }
                    }
                  ]
                });
              }

              return await sendCallback({
                type: 4,
                data: {
                  flags: 64, // Ephemeral
                  content: `♻️ **Informasi Akun Ditemukan!**\nDetail kredensial untuk **${matchedOfficer.name}** (${matchedOfficer.badge} - ${matchedOfficer.rank}) telah dikirimkan ke **Pesan Pribadi (DM) Discord** Anda!\n\n📋 **Salinan Kredensial Langsung:**\n• **Nama UCP:** \`${matchedOfficer.name}\`\n• **Lencana & Pangkat:** \`${matchedOfficer.badge}\` • ${matchedOfficer.rank}\n• **PIN Login:** ||**${matchedOfficer.pin}**|| *(Klik untuk membuka)*`
                }
              });
            } else {
              return await sendCallback({
                type: 4,
                data: {
                  flags: 64,
                  content: `⚠️ **Akun Discord Anda Belum Terdaftar:**\nAkun Discord ${userTag} belum tercatat di database personel kepolisian. Silakan klik tombol **[ 📄 Register ]** untuk membuat akun UCP / MDT baru.`
                }
              });
            }
          }

          // [ BUTTON: LUPA PASSWORD ] -> Open Modal
          if (customId === 'mdt_btn_forgot_password') {
            const modalPayload = {
              type: 9, // MODAL
              data: {
                custom_id: 'mdt_modal_forgot_password',
                title: 'Permohonan Lupa Password / PIN',
                components: [
                  {
                    type: 1,
                    components: [
                      {
                        type: 4,
                        custom_id: 'fp_ic_name',
                        label: 'Nama IC Karakter Anda',
                        style: 1,
                        min_length: 3,
                        max_length: 40,
                        placeholder: 'Masukkan nama IC karakter Anda yang terdaftar',
                        required: true
                      }
                    ]
                  },
                  {
                    type: 1,
                    components: [
                      {
                        type: 4,
                        custom_id: 'fp_reason',
                        label: 'Alasan / Keterangan Permohonan Reset',
                        style: 2, // Paragraph
                        min_length: 5,
                        max_length: 300,
                        placeholder: 'Jelaskan kendala login Anda (misal: Lupa PIN lama / ganti nomor PIN baru)',
                        required: true
                      }
                    ]
                  }
                ]
              }
            };
            return await sendCallback(modalPayload);
          }

          // [ BUTTON: TAKE ROLE ]
          if (customId === 'mdt_btn_take_role') {
            const matchedOfficer = await discordRosterService.findOfficer({
              discordId: discordUser.id,
              discordUsername: discordUser.username
            });

            if (matchedOfficer) {
              return await sendCallback({
                type: 4,
                data: {
                  flags: 64,
                  content: `⚙️ **Status Dinas Terverifikasi:**\nAkun Anda tercatat sebagai personel resmi: **${matchedOfficer.name}** (${matchedOfficer.badge} - ${matchedOfficer.rank}). Role operasional Anda aktif di server kepolisian!`
                }
              });
            } else {
              return await sendCallback({
                type: 4,
                data: {
                  flags: 64,
                  content: `⚠️ **Belum Terdaftar:**\nAnda belum memiliki akun MDT terdaftar. Harap klik **[ 📄 Register ]** terlebih dahulu untuk membuat akun dinas baru.`
                }
              });
            }
          }
        }

        // =========================================================================
        // 2. MODAL SUBMISSIONS (type: 5)
        // =========================================================================
        if (interactionType === 5) {

          // [ MODAL SUBMISSION: REGISTRATION ]
          if (customId === 'mdt_modal_register') {
            let icName = '';
            let pin = '';
            let badge = '';
            let phone = '';

            if (Array.isArray(data.data?.components)) {
              for (const row of data.data.components) {
                if (Array.isArray(row.components)) {
                  for (const comp of row.components) {
                    if (comp.custom_id === 'reg_ic_name') icName = comp.value?.trim() || '';
                    if (comp.custom_id === 'reg_pin') pin = comp.value?.trim() || '';
                    if (comp.custom_id === 'reg_badge') badge = comp.value?.trim() || '';
                    if (comp.custom_id === 'reg_phone') phone = comp.value?.trim() || '';
                  }
                }
              }
            }

            console.log(`[Discord Gateway] Received Registration Modal Submit from @${discordUser.username}: IC="${icName}", Badge="${badge}"`);

            const regResult = await discordRosterService.registerOfficer({
              icName,
              pin,
              badge,
              phone,
              discordUser
            });

            if (!regResult.success) {
              return await sendCallback({
                type: 4,
                data: {
                  flags: 64, // Ephemeral
                  content: `❌ **Pendaftaran Gagal:**\n${regResult.message}`
                }
              });
            }

            const off = regResult.officer!;

            // 1. Respond immediately with Ephemeral Embed in Channel
            await sendCallback({
              type: 4,
              data: {
                flags: 64,
                embeds: [
                  {
                    author: {
                      name: 'MDT Panel High State Police Department',
                      icon_url: 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png'
                    },
                    title: '✅ Registrasi Akun MDT Kepolisian Berhasil!',
                    description: `Selamat datang di jajaran kepolisian, **Cadet ${off.name}**!\nAkun dinas Anda telah berhasil dibuat dan otomatis langsung tersimpan di database resmi & Roster Anggota Kepolisian High State.`,
                    color: 0x00A8FF,
                    fields: [
                      { name: '📄 Nama IC Karakter', value: `\`${off.name}\``, inline: true },
                      { name: '🎖️ Nomor Lencana', value: `\`${off.badge}\``, inline: true },
                      { name: '⭐ Pangkat Dinas', value: `\`${off.rank}\``, inline: true },
                      { name: '🏢 Divisi Penugasan', value: `\`${off.division}\``, inline: true },
                      { name: '📱 Kontak / HP IC', value: `\`${off.phone || '-'}\``, inline: true },
                      { name: '💬 Akun Discord', value: `${userTag}`, inline: true },
                      { name: '🔒 PIN Keamanan Login', value: `||**${off.pin}**|| *(Klik untuk melihat PIN)*`, inline: false }
                    ],
                    footer: {
                      text: 'Pemberitahuan resmi • Salinan akun juga dikirimkan ke DM Anda'
                    },
                    timestamp: new Date().toISOString()
                  }
                ]
              }
            });

            // 2. Also send permanent copy via DM to the user
            const botToken = this.token || process.env.DISCORD_BOT_TOKEN || '';
            if (botToken) {
              const now = new Date();
              const dateFormatted = now.toLocaleDateString('en-US', {
                month: 'numeric',
                day: 'numeric',
                year: '2-digit',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              });

              discordRosterService.sendDirectMessageToUser(botToken, discordUser.id, {
                content: `<@${discordUser.id}> Halo! Berikut adalah detail dari akun UCP Anda:`,
                embeds: [
                  {
                    author: {
                      name: 'Cek Akun | High State',
                      icon_url: 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png'
                    },
                    title: '✅ Berhasil!',
                    description: 'Berikut adalah detail dari akun UCP Anda:',
                    color: 0x00A8FF,
                    fields: [
                      { name: 'UCP', value: off.name, inline: false },
                      { name: 'Pin Code', value: off.pin || '10-4', inline: false },
                      { name: 'No. Badge & Pangkat', value: `\`${off.badge}\` • ${off.rank}`, inline: false },
                      { name: 'Divisi', value: off.division || 'Patrol Division', inline: false },
                      { name: 'Note', value: 'Jangan beritahu informasi ini kepada orang lain!\n*Gunakan nama UCP / Badge dan Pin Code di atas untuk login ke Terminal MDT Kepolisian.*', inline: false }
                    ],
                    footer: {
                      text: `Bot High State • ${dateFormatted}`,
                      icon_url: 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png'
                    }
                  }
                ]
              }).catch((e) => {
                console.warn('[Discord Gateway] Warning sending registration DM to user:', e);
              });
            }

            return;
          }

          // [ MODAL SUBMISSION: FORGOT PASSWORD ]
          if (customId === 'mdt_modal_forgot_password') {
            let icName = '';
            let reason = '';

            if (Array.isArray(data.data?.components)) {
              for (const row of data.data.components) {
                if (Array.isArray(row.components)) {
                  for (const comp of row.components) {
                    if (comp.custom_id === 'fp_ic_name') icName = comp.value?.trim() || '';
                    if (comp.custom_id === 'fp_reason') reason = comp.value?.trim() || '';
                  }
                }
              }
            }

            const ticketRes = await discordRosterService.submitPinResetTicket({
              icName,
              reason,
              discordUser
            });

            return await sendCallback({
              type: 4,
              data: {
                flags: 64,
                embeds: [
                  {
                    title: '🚨 Permohonan Reset PIN Diterima',
                    description: `Permohonan reset PIN untuk karakter **${icName}** telah diteruskan ke jajaran High Command / Atasan Divisi Kepolisian.\n\nAtasan akan memverifikasi permohonan Anda dan menghubungi Anda via Discord ${userTag}.`,
                    color: 0xEF4444,
                    footer: { text: 'Tiket Permohonan Login • High State MDT' },
                    timestamp: new Date().toISOString()
                  }
                ]
              }
            });
          }
        }

      } catch (err) {
        console.error('[Discord Gateway] Error processing INTERACTION_CREATE:', err);
      }
    }
  }

  public init() {
    if (this.token && this.token.length > 20) {
      console.log('[Discord Gateway] Found configured bot token. Starting online gateway service...');
      this.startWithToken(this.token).catch(err => {
        console.warn('[Discord Gateway] Background startup issue:', err.message);
      });
    } else {
      console.log('[Discord Gateway] No bot token configured yet. Bot gateway waiting for token.');
    }
  }
}

export const discordGatewayManager = new DiscordGatewayManager();
