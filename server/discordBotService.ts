import WebSocket from 'ws';
import fs from 'fs';
import path from 'path';
import { discordRosterService, type DiscordUserContext } from './discordRosterService.ts';

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
        // Remove ALL listeners including error before terminating or closing
        socket.removeAllListeners('open');
        socket.removeAllListeners('message');
        socket.removeAllListeners('close');
        socket.removeAllListeners('error');
        // Attach a silent no-op error handler. In ws, if a socket is closed or terminated while still CONNECTING,
        // it emits an 'error' event ("WebSocket was closed before the connection was established").
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
        const msg = err?.message || String(err);
        // Suppress expected transient socket abort / close before connection established
        if (msg.includes('closed before the connection was established') || msg.includes('ECONNRESET') || msg.includes('ETIMEDOUT')) {
          return;
        }
        console.warn('[Discord Gateway] WebSocket error:', msg);
        this.state.lastError = msg;
      });

      ws.on('open', () => {
        console.log('[Discord Gateway] WebSocket connection opened.');
      });

      ws.on('message', (data: WebSocket.RawData) => {
        this.handleMessage(data);
      });

      ws.on('close', (code: number, reason: Buffer) => {
        const reasonStr = reason ? reason.toString() : '';
        if (!this.isExplicitlyStopped && code !== 1000) {
          console.warn(`[Discord Gateway] Closed with code ${code}: ${reasonStr}`);
        }
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
          this.cleanupSocket();
          this.scheduleReconnect();
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
        this.cleanupSocket();
        this.scheduleReconnect();
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
          
          // [ BUTTON: REGISTER ] -> Self-registration is closed! Only Atasan can create accounts via Roster
          if (customId === 'mdt_btn_register') {
            const existingOfficer = await discordRosterService.findOfficer({
              discordId: discordUser.id,
              discordUsername: discordUser.username
            });

            if (existingOfficer) {
              return await sendCallback({
                type: 4, // CHANNEL_MESSAGE_WITH_SOURCE
                data: {
                  flags: 64, // Ephemeral
                  embeds: [
                    {
                      author: {
                        name: 'Sistem Keamanan Personel MDT HSPD',
                        icon_url: 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png'
                      },
                      title: '✅ Anda Sudah Terdaftar di Roster Dinas!',
                      description: `Halo <@${discordUser.id}>, akun Discord Anda **sudah terdaftar resmi** sebagai personel Kepolisian High State.\n\nDetail akun dan PIN login Anda telah otomatis dikirimkan ke **Pesan Pribadi (PM / DM) Discord** saat didaftarkan oleh atasan.`,
                      color: 0x00A8FF,
                      fields: [
                        { name: '👤 Nama Karakter IC', value: `\`${existingOfficer.name}\``, inline: true },
                        { name: '🎖️ Nomor Lencana', value: `\`${existingOfficer.badge}\``, inline: true },
                        { name: '⭐ Pangkat Dinas', value: `\`${existingOfficer.rank}\``, inline: true },
                        { name: '🏢 Divisi Penugasan', value: `\`${existingOfficer.division || 'Patrol Division'}\``, inline: true },
                        { name: '📱 Kontak / No HP', value: `\`${existingOfficer.phone || '-'}\``, inline: true },
                        { name: '💬 Akun Discord', value: `<@${discordUser.id}>`, inline: true },
                        { 
                          name: '💡 Butuh Kredensial / Lupa PIN?', 
                          value: 'Tekan tombol **[ ♻️ Resend Code ]** agar bot mengirimkan kembali salinan PIN & data login langsung ke DM Discord Anda.', 
                          inline: false 
                        }
                      ],
                      footer: {
                        text: 'High State Police Department • Official Personnel System'
                      },
                      timestamp: new Date().toISOString()
                    }
                  ]
                }
              });
            }

            // Reject self-registration: Only Atasan (High Command) can create accounts
            return await sendCallback({
              type: 4,
              data: {
                flags: 64, // Ephemeral
                embeds: [
                  {
                    author: {
                      name: 'Sistem Personel MDT Kepolisian HSPD',
                      icon_url: 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png'
                    },
                    title: '⛔ Pendaftaran Akun Mandiri Telah Ditutup',
                    description: `Halo <@${discordUser.id}>, pendaftaran akun dinas MDT Kepolisian HSPD **saat ini sepenuhnya dilakukan oleh Jajaran Atasan (High Command)** melalui menu **Roster Anggota**.\n\nAkun dinas dan kredensial login (PIN) akan **otomatis dikirimkan langsung oleh Bot ini ke Pesan Pribadi (PM / DM) Discord Anda** begitu akun Anda selesai didaftarkan oleh atasan.\n\nSilakan melapor atau menghubungi pimpinan divisi / atasan Anda untuk proses pembuatan akun dinas.`,
                    color: 0xE11D48,
                    footer: {
                      text: 'High State Police Department • Akun Dibuat Eksklusif oleh Atasan'
                    },
                    timestamp: new Date().toISOString()
                  }
                ]
              }
            });
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
                        { name: '🌐 Akses Terminal MDT Web', value: 'Buka aplikasi web MDT di browser Anda untuk mulai bertugas:\n👉 [Klik di Sini untuk Buka Terminal MDT](https://mdc-hspd-inspector.vercel.app/)', inline: false },
                        { name: 'Note', value: 'Jangan beritahu informasi ini kepada orang lain!\n*Gunakan nama UCP / Badge dan Pin Code di atas untuk login ke Terminal MDT Kepolisian.*', inline: false }
                      ],
                      footer: {
                        text: `Bot High State • ${dateFormatted}`,
                        icon_url: 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png'
                      }
                    }
                  ],
                  components: [
                    {
                      type: 1, // Action Row
                      components: [
                        {
                          type: 2, // Button
                          style: 5, // Link
                          label: 'Akses Terminal MDT Web',
                          url: 'https://mdc-hspd-inspector.vercel.app/',
                          emoji: { name: '🌐' }
                        }
                      ]
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
                  content: `⚠️ **Akun Discord Anda Belum Terdaftar:**\nAkun Discord ${userTag} belum tercatat di Roster Anggota Kepolisian. Pembuatan akun dinas dilakukan secara resmi oleh Jajaran Atasan (High Command) melalui menu **Roster Anggota**. Silakan hubungi atasan dinas Anda untuk didaftarkan.`
                }
              });
            }
          }

          // [ BUTTON: LUPA PASSWORD ] -> Check if registered, then show Modal with new PIN input
          if (customId === 'mdt_btn_forgot_password') {
            const matchedOfficer = await discordRosterService.findOfficer({
              discordId: discordUser.id,
              discordUsername: discordUser.username
            });

            // If account does NOT exist in database, reject and ask to contact High Command
            if (!matchedOfficer) {
              return await sendCallback({
                type: 4, // CHANNEL_MESSAGE_WITH_SOURCE
                data: {
                  flags: 64, // Ephemeral
                  embeds: [
                    {
                      author: {
                        name: 'Sistem Keamanan MDT Kepolisian HSPD',
                        icon_url: 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png'
                      },
                      title: '⚠️ Akun Belum Terdaftar di Roster Dinas!',
                      description: `Halo <@${discordUser.id}>, akun Discord Anda **belum tercatat** di sistem Database & Roster Kepolisian High State.\n\nKarena belum memiliki akun dinas MDT, Anda **tidak dapat mereset PIN**.\n\nPembuatan akun kepolisian saat ini sepenuhnya dilakukan oleh **Jajaran Atasan (High Command)** melalui menu Roster Anggota. Silakan hubungi atasan dinas Anda.`,
                      color: 0xF59E0B, // Amber
                      fields: [
                        { name: '💬 Akun Discord', value: `<@${discordUser.id}>`, inline: true },
                        { name: '📌 Status Roster', value: '`Belum Terdaftar`', inline: true }
                      ],
                      footer: {
                        text: 'High State Police Department • High Command Only'
                      },
                      timestamp: new Date().toISOString()
                    }
                  ]
                }
              });
            }

            // Account exists! Show modal to enter the NEW PIN
            const modalPayload = {
              type: 9, // MODAL
              data: {
                custom_id: 'mdt_modal_forgot_password',
                title: `Reset PIN: ${matchedOfficer.name.substring(0, 24)}`,
                components: [
                  {
                    type: 1,
                    components: [
                      {
                        type: 4,
                        custom_id: 'fp_new_pin',
                        label: 'PIN Baru Akun MDT (4-10 Digit/Karakter)',
                        style: 1, // Short
                        min_length: 4,
                        max_length: 10,
                        placeholder: 'Contoh: 123456 (Hafalkan PIN untuk login MDT)',
                        required: true
                      }
                    ]
                  },
                  {
                    type: 1,
                    components: [
                      {
                        type: 4,
                        custom_id: 'fp_confirm_pin',
                        label: 'Konfirmasi Ulang PIN Baru',
                        style: 1, // Short
                        min_length: 4,
                        max_length: 10,
                        placeholder: 'Ketik ulang PIN baru yang sama persis',
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
                  content: `⚠️ **Belum Terdaftar:**\nAkun Discord Anda belum terdaftar di Roster Kepolisian. Pembuatan akun dinas dilakukan oleh Jajaran Atasan (High Command) melalui menu Roster Anggota.`
                }
              });
            }
          }
        }

        // =========================================================================
        // 2. MODAL SUBMISSIONS (type: 5)
        // =========================================================================
        if (interactionType === 5) {

          // [ MODAL SUBMISSION: REGISTRATION ] -> Self-registration disabled!
          if (customId === 'mdt_modal_register') {
            return await sendCallback({
              type: 4,
              data: {
                flags: 64,
                content: `⛔ **Pendaftaran Akun Mandiri Ditutup:**\nPembuatan akun dinas MDT saat ini sepenuhnya dilakukan oleh Jajaran Atasan (High Command) melalui menu Roster Anggota. Detail kredensial login akan otomatis dikirimkan ke PM Discord Anda oleh Bot setelah dibuatkan oleh atasan.`
              }
            });
          }

          // [ MODAL SUBMISSION: FORGOT PASSWORD -> SET NEW PIN ]
          if (customId === 'mdt_modal_forgot_password') {
            let newPin = '';
            let confirmPin = '';

            if (Array.isArray(data.data?.components)) {
              for (const row of data.data.components) {
                if (Array.isArray(row.components)) {
                  for (const comp of row.components) {
                    if (comp.custom_id === 'fp_new_pin') newPin = comp.value?.trim() || '';
                    if (comp.custom_id === 'fp_confirm_pin') confirmPin = comp.value?.trim() || '';
                  }
                }
              }
            }

            // Validation
            if (!newPin || newPin.length < 4) {
              return await sendCallback({
                type: 4,
                data: {
                  flags: 64, // Ephemeral
                  content: '❌ **Gagal Menyimpan PIN:** PIN baru harus minimal 4 karakter / angka!'
                }
              });
            }

            if (confirmPin && newPin !== confirmPin) {
              return await sendCallback({
                type: 4,
                data: {
                  flags: 64, // Ephemeral
                  content: '❌ **Konfirmasi PIN Tidak Cocok:** Kedua kolom PIN yang Anda masukkan tidak sama. Harap coba lagi dan pastikan PIN sama.'
                }
              });
            }

            const updateRes = await discordRosterService.updateOfficerPin({
              discordId: discordUser.id,
              discordUsername: discordUser.username,
              newPin: newPin
            });

            if (!updateRes.success || !updateRes.officer) {
              return await sendCallback({
                type: 4,
                data: {
                  flags: 64,
                  content: `❌ **Pembaruan PIN Gagal:**\n${updateRes.message}`
                }
              });
            }

            const off = updateRes.officer;

            // 1. Reply with ephemeral embed
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
                    title: '✅ PIN Akun Berhasil Diperbarui!',
                    description: `PIN akun MDT untuk perwira **${off.name}** (${off.badge} - ${off.rank}) telah berhasil diubah dan **langsung aktif** di Database Firestore & Roster Anggota Kepolisian.`,
                    color: 0x10B981, // Emerald Green
                    fields: [
                      { name: '👤 Nama Karakter IC', value: `\`${off.name}\``, inline: true },
                      { name: '🎖️ Nomor Lencana', value: `\`${off.badge}\``, inline: true },
                      { name: '⭐ Pangkat Dinas', value: `\`${off.rank}\``, inline: true },
                      { name: '🏢 Divisi Penugasan', value: `\`${off.division || 'Patrol Division'}\``, inline: true },
                      { name: '💬 Akun Discord', value: `<@${discordUser.id}>`, inline: true },
                      { name: '🔑 PIN Baru MDT', value: `||**${off.pin}**|| *(Klik untuk membuka)*`, inline: false },
                      { 
                        name: '🌐 Status Login MDT', 
                        value: 'PIN baru Anda sudah tersinkronisasi otomatis. Anda kini dapat langsung login ke Terminal MDT Kepolisian menggunakan PIN baru tersebut!', 
                        inline: false 
                      }
                    ],
                    footer: {
                      text: 'High State Police Department • Salinan PIN baru juga dikirim ke DM Discord Anda'
                    },
                    timestamp: new Date().toISOString()
                  }
                ]
              }
            });

            // 2. Send direct message (DM) to officer's Discord inbox
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
                content: `<@${discordUser.id}> Halo! PIN akun MDT Anda telah berhasil direset dan diperbarui:`,
                embeds: [
                  {
                    author: {
                      name: 'Update Kredensial | High State Police',
                      icon_url: 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png'
                    },
                    title: '🔑 PIN Baru Berhasil Ditetapkan!',
                    description: 'Berikut adalah detail akun dinas dan PIN baru Anda:',
                    color: 0x10B981,
                    fields: [
                      { name: 'UCP / Nama IC', value: off.name, inline: false },
                      { name: 'PIN Baru', value: `||${off.pin}||`, inline: false },
                      { name: 'No. Badge & Pangkat', value: `\`${off.badge}\` • ${off.rank}`, inline: false },
                      { name: 'Divisi', value: off.division || 'Patrol Division', inline: false },
                      { name: '🌐 Akses Terminal MDT Web', value: 'Buka aplikasi web MDT di browser Anda untuk mulai bertugas:\n👉 [Klik di Sini untuk Buka Terminal MDT](https://mdc-hspd-inspector.vercel.app/)', inline: false },
                      { name: 'Instruksi', value: 'Gunakan Nama IC / Badge dan PIN baru di atas untuk login ke Terminal MDT Kepolisian.', inline: false }
                    ],
                    footer: {
                      text: `Bot High State • ${dateFormatted}`,
                      icon_url: 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png'
                    }
                  }
                ],
                components: [
                  {
                    type: 1, // Action Row
                    components: [
                      {
                        type: 2, // Button
                        style: 5, // Link
                        label: 'Akses Terminal MDT Web',
                        url: 'https://mdc-hspd-inspector.vercel.app/',
                        emoji: { name: '🌐' }
                      }
                    ]
                  }
                ]
              }).catch((e) => {
                console.warn('[Discord Gateway] Warning sending reset PIN DM to user:', e);
              });
            }

            return;
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
