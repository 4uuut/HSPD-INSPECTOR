import WebSocket from 'ws';
import fs from 'fs';
import path from 'path';

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
      try {
        this.ws.removeAllListeners();
        this.ws.close(1000, 'Shutting down');
      } catch {}
      this.ws = null;
    }
  }

  private connect() {
    if (this.isExplicitlyStopped || !this.token) return;

    this.cleanupSocket();

    const gatewayEndpoint = this.resumeGatewayUrl 
      ? `${this.resumeGatewayUrl}?v=10&encoding=json` 
      : 'wss://gateway.discord.gg/?v=10&encoding=json';

    try {
      this.ws = new WebSocket(gatewayEndpoint);

      this.ws.on('open', () => {
        console.log('[Discord Gateway] WebSocket connection opened.');
      });

      this.ws.on('message', (data: WebSocket.RawData) => {
        this.handleMessage(data);
      });

      this.ws.on('close', (code: number, reason: Buffer) => {
        const reasonStr = reason.toString();
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

      this.ws.on('error', (err: Error) => {
        console.error('[Discord Gateway] WebSocket error:', err.message);
        this.state.lastError = err.message;
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
          this.ws?.close(1012, 'Service Restart');
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
        this.ws?.close(4000, 'Heartbeat ACK timeout');
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

  private handleDispatch(eventType: string, data: any) {
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
