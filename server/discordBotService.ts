import WebSocket from 'ws';
import fs from 'fs';
import path from 'path';
import { discordRosterService, type DiscordUserContext } from './discordRosterService.ts';
import { PASAL_LIST } from '../src/data/pasalData.ts';
import { TEN_CODES } from '../src/data/sopData.ts';

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

export interface DiscordBotServerConfig {
  changelogChannelId?: string;
  changelogChannelName?: string;
  changelogMentionRole?: string; // '@everyone', '@here', '<@&12345>', 'none'
  autoBroadcastChangelog?: boolean; // True secara default: otomatis kirim changelog saat ada rilis/fitur baru
  lastAnnouncedVersion?: string; // Versi terakhir yang sudah otomatis disiarkan
  lastAnnouncedAt?: number;
  dutyChannelId?: string;
  dutyChannelName?: string;
  rosterChannelId?: string;
  rosterChannelName?: string;
  caseChannelId?: string;
  caseChannelName?: string;
  prefix?: string;
  updatedAt?: number;
  updatedBy?: string;
}

export interface SystemUpdatePayload {
  version: string;
  title: string;
  newFeatures: string[];
  improvements: string[];
  bugFixes: string[];
  extraNotes?: string;
  mentionRole?: string;
  channelId?: string;
  authorName?: string;
  authorBadge?: string;
  authorRank?: string;
}

// Data pembaruan sistem terbaru untuk disiarkan otomatis oleh bot ke Discord
export const LATEST_SYSTEM_UPDATE: SystemUpdatePayload = {
  version: 'v3.3.0',
  title: 'Pembaruan Sistem MDT HSPD - Otomatisasi Siaran Bot & Fitur Baru',
  newFeatures: [
    'Otomatisasi Publikasi Pembaruan (Changelog): Bot otomatis menyiarkan pesan pembaruan fitur baru ke Discord tanpa perlu kirim manual',
    'Dukungan Penuh Perintah Bot Discord dengan Simbol Awalan (!) & Garis Miring (/)',
    '!pasal & /pasal: Pencarian pasal KUHP, rincian denda finansial, masa kurungan, & status penyitaan barang bukti',
    '!hitung & /hitung: Kalkulator akumulasi vonis denda dan potongan/diskon denda otomatis',
    '!bolo & /bolo: Pemantauan buronan aktif (APB) dan kendaraan DPO kepolisian',
    '!lookup & /lookup: Pemeriksaan rekam jejak kriminal, lisensi, dan arsip tilang warga di database MDT',
    '!duty & !roster: Pembaruan status dinas (10-8, 10-7, 10-6, Code 6) dan pemantauan personel bertugas',
    '!sop: Akses buku saku 10-Codes radio darurat & sandi taktis kepolisian',
    'Pembersihan tombol tautan eksternal pada seluruh pesan pembaruan Discord untuk tampilan lebih rapi'
  ],
  improvements: [
    'Optimalisasi latensi respons Discord Gateway untuk seluruh perintah kepolisian',
    'Penyelarasan registrasi Slash Commands global dan server Discord'
  ],
  bugFixes: [
    'Perbaikan sinkronisasi pengumuman pembaruan sistem dan penentuan channel',
    'Peningkatan kestabilan koneksi bot gateway 24/7'
  ],
  extraNotes: 'Seluruh sistem pengumuman kini terintegrasi secara otomatis saat pembaruan diterapkan. Personel dapat langsung menggunakan perintah ! atau / di Discord.',
  mentionRole: '@everyone',
  authorName: 'HSPD High Command',
  authorRank: 'Chief of Police',
  authorBadge: 'HQ-01'
};

const CONFIG_FILE_PATH = path.join(process.cwd(), '.discord_bot_session.json');
const SERVER_CONFIG_FILE_PATH = path.join(process.cwd(), '.discord_server_config.json');

export const DISCORD_SLASH_COMMANDS = [
  {
    name: 'hspd',
    description: 'Perintah bot MDT HSPD (Gunakan / atau !)',
    options: [
      {
        name: 'help',
        description: 'Panduan lengkap seluruh perintah bot',
        type: 1
      },
      {
        name: 'update',
        description: 'Publikasikan pengumuman update sistem ke Discord',
        type: 1,
        options: [
          {
            name: 'kategori',
            description: 'Kategori pembaruan',
            type: 3,
            required: true,
            choices: [
              { name: '🚀 Fitur Baru', value: 'fitur' },
              { name: '⚡ Peningkatan Sistem', value: 'peningkatan' },
              { name: '🛠️ Perbaikan Bug', value: 'bugfix' }
            ]
          },
          {
            name: 'pesan',
            description: 'Rincian pesan pembaruan sistem',
            type: 3,
            required: true
          }
        ]
      },
      {
        name: 'setchannel',
        description: 'Atur channel Discord tujuan penyiaran bot',
        type: 1,
        options: [
          {
            name: 'jenis',
            description: 'Modul channel tujuan',
            type: 3,
            required: true,
            choices: [
              { name: '📢 Pengumuman Update', value: 'update' },
              { name: '📋 Absensi Dinas (Duty)', value: 'duty' },
              { name: '👥 Roster & Mutasi', value: 'roster' },
              { name: '📁 Kasus Investigasi', value: 'case' }
            ]
          },
          {
            name: 'channel',
            description: 'Pilih channel Discord tujuan',
            type: 7,
            required: true
          }
        ]
      },
      {
        name: 'setping',
        description: 'Atur mention ping saat pengumuman update rilis',
        type: 1,
        options: [
          {
            name: 'mention',
            description: 'Contoh: @everyone, @here, @Police, atau none',
            type: 3,
            required: true
          }
        ]
      },
      {
        name: 'config',
        description: 'Periksa seluruh pengaturan channel bot saat ini',
        type: 1
      },
      {
        name: 'status',
        description: 'Periksa status online, uptime, & latency bot',
        type: 1
      },
      {
        name: 'release',
        description: 'Lihat panduan dan format rilis cepat pembaruan',
        type: 1
      },
      {
        name: 'test',
        description: 'Kirim pesan uji coba ke channel pengumuman',
        type: 1
      }
    ]
  },
  {
    name: 'pasal',
    description: 'Cari pasal KUHP, rincian denda finansial, kurungan, & impound (HSPD)',
    options: [
      {
        name: 'query',
        description: 'Kode pasal (misal: A01, B08) atau kata kunci (misal: narkoba, senpi, sim)',
        type: 3,
        required: false
      }
    ]
  },
  {
    name: 'kuhp',
    description: 'Cari pasal KUHP dan denda kepolisian (Alias /pasal)',
    options: [
      {
        name: 'query',
        description: 'Kode pasal atau kata kunci pencarian',
        type: 3,
        required: false
      }
    ]
  },
  {
    name: 'hitung',
    description: 'Kalkulator denda & hukuman penjara gabungan beberapa pasal',
    options: [
      {
        name: 'pasal',
        description: 'Daftar kode pasal dipisah koma/spasi (Contoh: A01, A05, B08)',
        type: 3,
        required: true
      },
      {
        name: 'diskon',
        description: 'Potongan/keringanan denda dalam persen (0 - 100)',
        type: 4,
        required: false
      }
    ]
  },
  {
    name: 'denda',
    description: 'Kalkulator vonis denda dan masa kurungan (Alias /hitung)',
    options: [
      {
        name: 'pasal',
        description: 'Daftar kode pasal dipisah koma (Contoh: A01, B08)',
        type: 3,
        required: true
      },
      {
        name: 'diskon',
        description: 'Potongan denda dalam persen (Contoh: 15)',
        type: 4,
        required: false
      }
    ]
  },
  {
    name: 'bolo',
    description: 'Daftar buronan (Be On The Lookout / APB) kendaraan & DPO aktif',
    options: [
      {
        name: 'query',
        description: 'Plat nomor, nama buronan, atau jenis kendaraan',
        type: 3,
        required: false
      }
    ]
  },
  {
    name: 'lookup',
    description: 'Cek catatan kriminalitas, status DPO, dan arsip tilang warga di MDT',
    options: [
      {
        name: 'nama',
        description: 'Nama warga yang ingin diperiksa',
        type: 3,
        required: true
      }
    ]
  },
  {
    name: 'roster',
    description: 'Daftar personel kepolisian aktif (10-8 On Duty / 10-7 Off Duty)',
    options: [
      {
        name: 'petugas',
        description: 'Nama perwira atau nomor badge',
        type: 3,
        required: false
      }
    ]
  },
  {
    name: 'duty',
    description: 'Perbarui status dinas kepolisian (On Duty / Off Duty)',
    options: [
      {
        name: 'status',
        description: 'Pilih status dinas Anda',
        type: 3,
        required: true,
        choices: [
          { name: '🟢 10-8 | ON DUTY (Mulai Bertugas)', value: '10-8' },
          { name: '🔴 10-7 | OFF DUTY (Lepas Dinas)', value: '10-7' },
          { name: '🟡 10-6 | BUSY (Sedang di TKP)', value: '10-6' },
          { name: '🔵 CODE 6 | Investigasi / Penyelidikan', value: 'code-6' }
        ]
      },
      {
        name: 'callsign',
        description: 'Callsign unit (Contoh: ADAM-01, LINCOLN-02)',
        type: 3,
        required: false
      }
    ]
  },
  {
    name: 'waran',
    description: 'Daftar surat perintah penangkapan aktif (Arrest Warrants)',
    options: []
  },
  {
    name: 'sop',
    description: 'Buku saku 10-Codes radio polisi & sandi taktis darurat',
    options: [
      {
        name: 'kode',
        description: 'Kode radio (Contoh: 10-4, 10-8, 10-20, 10-33, code-0)',
        type: 3,
        required: false
      }
    ]
  },
  {
    name: 'mdt',
    description: 'Tautkan akun Discord ke akun login petugas MDT atau periksa status akun',
    options: [
      {
        name: 'aksi',
        description: 'Pilih aksi: tautkan akun, periksa status akun tertaut, atau putuskan tautan',
        type: 3,
        required: false,
        choices: [
          { name: '🔗 Tautkan Akun Petugas', value: 'tautkan' },
          { name: '🔍 Cek Status Akun Tertaut', value: 'status' },
          { name: '🔓 Putuskan Tautan Akun', value: 'putus' }
        ]
      },
      {
        name: 'petugas',
        description: 'Nama Petugas (IC) atau Nomor Badge Anda (Contoh: Jackie Xianlao atau 001)',
        type: 3,
        required: false
      },
      {
        name: 'pin',
        description: 'PIN login akun MDT Anda (6 digit)',
        type: 3,
        required: false
      }
    ]
  },
  {
    name: 'update',
    description: 'Kirim pengumuman pembaruan sistem ke Discord (Shortcut / atau !)',
    options: [
      {
        name: 'kategori',
        description: 'Kategori pembaruan',
        type: 3,
        required: true,
        choices: [
          { name: '🚀 Fitur Baru', value: 'fitur' },
          { name: '⚡ Peningkatan Sistem', value: 'peningkatan' },
          { name: '🛠️ Perbaikan Bug', value: 'bugfix' }
        ]
      },
      {
        name: 'pesan',
        description: 'Rincian pesan pembaruan',
        type: 3,
        required: true
      }
    ]
  },
  {
    name: 'config',
    description: 'Periksa konfigurasi dan channel penyiaran bot saat ini',
    type: 1
  },
  {
    name: 'status',
    description: 'Periksa status online, latency, dan uptime bot MDT',
    type: 1
  },
  {
    name: 'help',
    description: 'Panduan lengkap perintah bot MDT HSPD (Gunakan / atau !)',
    type: 1
  }
];

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
  private serverConfig: DiscordBotServerConfig = {
    prefix: '!hspd',
    changelogMentionRole: 'none'
  };
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
    this.loadSavedServerConfig();
  }

  private loadSavedServerConfig() {
    try {
      if (fs.existsSync(SERVER_CONFIG_FILE_PATH)) {
        const raw = fs.readFileSync(SERVER_CONFIG_FILE_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          this.serverConfig = {
            prefix: '!hspd',
            changelogMentionRole: 'none',
            ...parsed
          };
        }
      }
    } catch (e) {
      console.warn('[Discord Gateway] Failed to read saved server config:', e);
    }
  }

  private saveServerConfig() {
    try {
      fs.writeFileSync(SERVER_CONFIG_FILE_PATH, JSON.stringify(this.serverConfig, null, 2), 'utf-8');
    } catch (e) {
      console.warn('[Discord Gateway] Failed to persist server config file:', e);
    }
  }

  public getServerConfig(): DiscordBotServerConfig {
    return { ...this.serverConfig };
  }

  public updateServerConfig(updates: Partial<DiscordBotServerConfig>): DiscordBotServerConfig {
    this.serverConfig = {
      ...this.serverConfig,
      ...updates,
      updatedAt: Date.now()
    };
    this.saveServerConfig();

    // Jika channel diubah atau auto-broadcast aktif, otomatis periksa dan siarkan jika ada rilis baru
    if (this.serverConfig.autoBroadcastChangelog !== false && (this.serverConfig.changelogChannelId || updates.changelogChannelId)) {
      setTimeout(() => {
        this.checkAndAutoBroadcastChangelog().catch(() => {});
      }, 1000);
    }

    return { ...this.serverConfig };
  }

  public async sendChannelMessage(channelId: string, payload: any): Promise<{ success: boolean; data?: any; error?: string }> {
    const token = this.getActiveToken();
    if (!token) {
      return { success: false, error: 'Token bot Discord belum dikonfigurasi!' };
    }
    const cleanId = channelId.replace(/[^0-9]/g, '');
    if (!cleanId) {
      return { success: false, error: 'ID Channel Discord tidak valid!' };
    }

    try {
      const res = await fetch(`https://discord.com/api/v10/channels/${cleanId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bot ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        let msg = errJson.message || `HTTP ${res.status}`;
        if (errJson.code === 50001) msg = 'Bot tidak memiliki akses ke channel tersebut (Missing Access). Pastikan bot sudah diinvite dan memiliki izin View Channel & Send Messages!';
        if (errJson.code === 50013) msg = 'Bot tidak memiliki izin (Missing Permissions) untuk mengirim pesan atau embed di channel tersebut!';
        return { success: false, error: msg };
      }

      const data = await res.json();
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Gagal menghubungi Discord API' };
    }
  }

  public async sendChangelogBroadcast(options: {
    version?: string;
    title?: string;
    newFeatures?: string[];
    improvements?: string[];
    bugFixes?: string[];
    extraNotes?: string;
    mentionRole?: string;
    channelId?: string;
    authorName?: string;
    authorBadge?: string;
    authorRank?: string;
    authorAvatarUrl?: string;
  }): Promise<{ success: boolean; message: string; channelId?: string }> {
    const targetChannelId = options.channelId || this.serverConfig.changelogChannelId;
    if (!targetChannelId) {
      return {
        success: false,
        message: 'Channel Discord untuk pembaruan (Changelog) belum ditentukan! Silakan atur channel di Web App atau gunakan command `!hspd setchannel update #channel` di server Discord.'
      };
    }

    const ver = (options.version || 'v3.2.0').trim();
    const title = (options.title || 'Pembaruan Sistem MDT HSPD').trim();
    const mention = (options.mentionRole ?? this.serverConfig.changelogMentionRole ?? '').trim();
    const pingContent = (mention && mention !== 'none' && mention !== 'off') ? `${mention} ` : '';

    const fields: Array<{ name: string; value: string; inline?: boolean }> = [];

    if (options.newFeatures && options.newFeatures.length > 0) {
      const formatted = options.newFeatures.map(f => `• ${f.trim()}`).filter(Boolean).join('\n');
      fields.push({
        name: '🚀 Fitur Baru (New Features)',
        value: formatted || 'Tidak ada catatan fitur baru.',
        inline: false
      });
    }

    if (options.improvements && options.improvements.length > 0) {
      const formatted = options.improvements.map(f => `• ${f.trim()}`).filter(Boolean).join('\n');
      fields.push({
        name: '⚡ Peningkatan Sistem (Improvements)',
        value: formatted || 'Tidak ada catatan peningkatan.',
        inline: false
      });
    }

    if (options.bugFixes && options.bugFixes.length > 0) {
      const formatted = options.bugFixes.map(f => `• ${f.trim()}`).filter(Boolean).join('\n');
      fields.push({
        name: '🛠️ Perbaikan Bug (Bug Fixes)',
        value: formatted || 'Tidak ada perbaikan bug.',
        inline: false
      });
    }

    if (options.extraNotes && options.extraNotes.trim()) {
      fields.push({
        name: '📝 Catatan Rilis & Panduan',
        value: options.extraNotes.trim(),
        inline: false
      });
    }

    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const embed = {
      author: {
        name: 'High State Police Department • Official System Release',
        icon_url: 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png'
      },
      title: `📢 ${title} • [${ver}]`,
      description: `Catatan rilis pembaruan perangkat lunak, penyempurnaan operasional, dan perbaikan kestabilan Terminal Mobile Data Computer (MDC) HSPD.\n\n📅 **Waktu Rilis:** \`${dateStr}\`\n👤 **Dipublikasikan Oleh:** \`${options.authorName || 'High Command'}\` ${options.authorBadge ? `(\`${options.authorBadge}\`)` : ''}`,
      color: 0x00A8FF, // Police Cyan/Blue
      fields,
      footer: {
        text: `HSPD MDC System • ${ver} • High State Government`,
        icon_url: 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png'
      },
      timestamp: now.toISOString()
    };

    const payload = {
      content: pingContent ? `${pingContent}**[ PENGUMUMAN PEMBARUAN SISTEM MDT HSPD ]**` : undefined,
      embeds: [embed]
    };

    const res = await this.sendChannelMessage(targetChannelId, payload);
    if (!res.success) {
      return {
        success: false,
        message: `Gagal mengirim ke channel Discord (${targetChannelId}): ${res.error}`
      };
    }

    return {
      success: true,
      message: `Pembaruan berhasil dikirim ke channel <#${targetChannelId}>!`,
      channelId: targetChannelId
    };
  }

  /**
   * Otomatis mencari channel pengumuman / changelog dari guild Discord yang dimasuki bot jika belum diatur manual
   */
  public async findAnnouncementChannelId(): Promise<string | null> {
    const token = this.getActiveToken();
    if (!token) return null;
    try {
      const guildsRes = await fetch('https://discord.com/api/v10/users/@me/guilds', {
        headers: { Authorization: `Bot ${token}` }
      });
      if (!guildsRes.ok) return null;
      const guilds: any[] = await guildsRes.json();
      if (!Array.isArray(guilds) || guilds.length === 0) return null;

      for (const guild of guilds) {
        const channelsRes = await fetch(`https://discord.com/api/v10/guilds/${guild.id}/channels`, {
          headers: { Authorization: `Bot ${token}` }
        });
        if (!channelsRes.ok) continue;
        const channels: any[] = await channelsRes.json();
        if (!Array.isArray(channels)) continue;

        // Cari channel teks dengan nama relevan
        const match = channels.find((c: any) => 
          c.type === 0 && (
            c.name.includes('pengumuman') || 
            c.name.includes('update') || 
            c.name.includes('changelog') || 
            c.name.includes('announcement') ||
            c.name.includes('hspd-update')
          )
        );
        if (match) {
          this.serverConfig.changelogChannelId = match.id;
          this.serverConfig.changelogChannelName = `#${match.name}`;
          this.saveServerConfig();
          return match.id;
        }

        // Fallback ke channel teks pertama
        const firstText = channels.find((c: any) => c.type === 0);
        if (firstText) {
          this.serverConfig.changelogChannelId = firstText.id;
          this.serverConfig.changelogChannelName = `#${firstText.name}`;
          this.saveServerConfig();
          return firstText.id;
        }
      }
    } catch (e) {
      console.warn('[Discord Auto-Broadcast] Gagal mencari channel pengumuman:', e);
    }
    return null;
  }

  /**
   * Otomatis menyiarkan changelog/pembaruan fitur ke Discord tanpa perlu dikirim secara manual
   */
  public async checkAndAutoBroadcastChangelog(force: boolean = false, customPayload?: Partial<SystemUpdatePayload>): Promise<{ triggered: boolean; message: string; channelId?: string }> {
    const autoEnabled = this.serverConfig.autoBroadcastChangelog !== false; // Default: AKTIF (true)
    if (!autoEnabled && !force) {
      return { triggered: false, message: 'Otomatisasi pengiriman changelog sedang dinonaktifkan di pengaturan.' };
    }

    const payload: SystemUpdatePayload = {
      ...LATEST_SYSTEM_UPDATE,
      ...customPayload
    };

    // Cek apakah versi ini sudah pernah disiarkan secara otomatis
    if (!force && this.serverConfig.lastAnnouncedVersion === payload.version) {
      return { triggered: false, message: `Pembaruan versi ${payload.version} sudah pernah otomatis disiarkan.` };
    }

    // Tentukan channel tujuan
    let targetChannelId = payload.channelId || this.serverConfig.changelogChannelId;
    if (!targetChannelId) {
      targetChannelId = (await this.findAnnouncementChannelId()) || undefined;
    }

    if (!targetChannelId) {
      console.log('[Discord Auto-Broadcast] Channel pembaruan belum ditentukan. Siaran otomatis ditangguhkan hingga channel diatur.');
      return { triggered: false, message: 'Channel pengumuman pembaruan belum ditentukan.' };
    }

    console.log(`[Discord Auto-Broadcast] 🚀 Mengirim otomatis changelog [${payload.version}] ke channel ${targetChannelId}...`);
    const result = await this.sendChangelogBroadcast({
      version: payload.version,
      title: payload.title,
      newFeatures: payload.newFeatures,
      improvements: payload.improvements,
      bugFixes: payload.bugFixes,
      extraNotes: payload.extraNotes,
      mentionRole: payload.mentionRole || this.serverConfig.changelogMentionRole || '@everyone',
      channelId: targetChannelId,
      authorName: payload.authorName,
      authorBadge: payload.authorBadge,
      authorRank: payload.authorRank
    });

    if (result.success) {
      this.serverConfig.lastAnnouncedVersion = payload.version;
      this.serverConfig.lastAnnouncedAt = Date.now();
      this.saveServerConfig();
      console.log(`[Discord Auto-Broadcast] ✅ Pembaruan [${payload.version}] berhasil otomatis disiarkan ke Discord!`);
      return {
        triggered: true,
        message: `Pembaruan [${payload.version}] berhasil otomatis disiarkan ke Discord!`,
        channelId: targetChannelId
      };
    } else {
      console.warn(`[Discord Auto-Broadcast] ⚠️ Gagal menyiarkan pembaruan otomatis: ${result.message}`);
      return {
        triggered: false,
        message: result.message,
        channelId: targetChannelId
      };
    }
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
        intents: 4609, // Guilds (1) + Guild Messages (512) + Direct Messages (4096)
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
        // Auto register Discord Slash Commands (/hspd, /update, /config, /status, /help)
        this.registerSlashCommands().catch(() => {});

        // Otomatis cek dan siarkan pembaruan/changelog terbaru jika belum pernah disiarkan
        setTimeout(() => {
          this.checkAndAutoBroadcastChangelog().catch(err => {
            console.warn('[Discord Gateway] Auto broadcast changelog check error:', err);
          });
        }, 3500);
      }

      console.log(`[Discord Gateway] ✅ BOT IS NOW ONLINE (MENYALA HIJAU) 24/7!`);
      console.log(`[Discord Gateway] Connected as: ${this.state.botUser?.username} (ID: ${this.state.botUser?.id})`);
    } else if (eventType === 'RESUMED') {
      this.state.isOnline = true;
      this.state.lastError = null;
      console.log('[Discord Gateway] ✅ Session successfully resumed (Online).');
    } else if (eventType === 'INTERACTION_CREATE') {
      // Handle interactive Discord Components (Buttons, Modals, and Slash Commands)
      try {
        const interactionId = data.id;
        const interactionToken = data.token;
        const interactionType = data.type; // 2 = APPLICATION_COMMAND (Slash), 3 = MESSAGE_COMPONENT (Buttons), 5 = MODAL_SUBMIT
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
        // 0. DISCORD SLASH COMMANDS (APPLICATION_COMMAND: type 2)
        // =========================================================================
        if (interactionType === 2 && data.data?.name) {
          await this.handleSlashCommandInteraction(data, sendCallback, discordUser);
          return;
        }

        // =========================================================================
        // 1. BUTTON CLICKS (MESSAGE_COMPONENT: type 3 or component_type 2)
        // =========================================================================
        if (interactionType === 3 || data.data?.component_type === 2) {
          
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

          // [ BUTTON: BUKA MODAL TAUTKAN AKUN MDT ]
          if (customId === 'mdt_btn_open_link_modal') {
            return await sendCallback({
              type: 9, // APPLICATION_MODAL
              data: {
                custom_id: 'mdt_modal_link_account',
                title: 'Tautkan Akun Petugas MDT HSPD',
                components: [
                  {
                    type: 1,
                    components: [
                      {
                        type: 4,
                        custom_id: 'link_identifier',
                        label: 'Nama Petugas (IC) atau Nomor Badge',
                        style: 1, // Short
                        placeholder: 'Contoh: Jackie Xianlao atau 001',
                        min_length: 2,
                        max_length: 50,
                        required: true
                      }
                    ]
                  },
                  {
                    type: 1,
                    components: [
                      {
                        type: 4,
                        custom_id: 'link_pin',
                        label: 'PIN Login Akun MDT Petugas',
                        style: 1, // Short
                        placeholder: 'Masukkan 6 digit PIN login akun MDT Anda',
                        min_length: 4,
                        max_length: 20,
                        required: true
                      }
                    ]
                  }
                ]
              }
            });
          }

          // [ BUTTON: PUTUSKAN TAUTAN AKUN MDT ]
          if (customId === 'mdt_btn_unlink_account') {
            const unlinkRes = await discordRosterService.unlinkOfficerFromDiscordUser(discordUser.id);
            return await sendCallback({
              type: 4,
              data: {
                flags: 64, // Ephemeral
                embeds: [
                  {
                    author: {
                      name: 'Mobile Data Computer • Sistem Penautan Akun',
                      icon_url: 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png'
                    },
                    title: unlinkRes.success ? '🔓 Tautan Akun Berhasil Diputus' : '⚠️ Tidak Ada Akun Tertaut',
                    description: unlinkRes.message,
                    color: unlinkRes.success ? 0xF59E0B : 0xEF4444,
                    footer: { text: 'High State Police Department • MDT Binding System' },
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
                  content: `<@${discordUser.id}> Halo! Berikut adalah detail dari akun MDT Anda:`,
                  embeds: [
                    {
                      author: {
                        name: 'Cek Akun | High State',
                        icon_url: 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png'
                      },
                      title: '✅ Berhasil!',
                      description: 'Berikut adalah detail dari akun MDT Anda:',
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

          // [ MODAL SUBMISSION: TAUTKAN AKUN PETUGAS MDT ]
          if (customId === 'mdt_modal_link_account') {
            let identifier = '';
            let pin = '';

            if (Array.isArray(data.data?.components)) {
              for (const row of data.data.components) {
                if (Array.isArray(row.components)) {
                  for (const comp of row.components) {
                    if (comp.custom_id === 'link_identifier') identifier = comp.value?.trim() || '';
                    if (comp.custom_id === 'link_pin') pin = comp.value?.trim() || '';
                  }
                }
              }
            }

            if (!identifier || !pin) {
              return await sendCallback({
                type: 4,
                data: {
                  flags: 64, // Ephemeral
                  content: '❌ **Gagal:** Nama Petugas / Nomor Badge dan PIN wajib diisi!'
                }
              });
            }

            const linkRes = await discordRosterService.linkOfficerToDiscordUser({
              identifier,
              pin,
              discordUser
            });

            if (!linkRes.success || !linkRes.officer) {
              return await sendCallback({
                type: 4,
                data: {
                  flags: 64,
                  embeds: [
                    {
                      author: {
                        name: 'Mobile Data Computer • Sistem Penautan Akun',
                        icon_url: 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png'
                      },
                      title: '❌ Gagal Menautkan Akun Petugas',
                      description: `${linkRes.message}\n\n💡 *Tips:* Pastikan nama karakter IC atau nomor badge dan PIN akun Anda sesuai dengan data di Roster MDT kepolisian.`,
                      color: 0xEF4444,
                      timestamp: new Date().toISOString()
                    }
                  ]
                }
              });
            }

            const off = linkRes.officer;
            return await sendCallback({
              type: 4,
              data: {
                flags: 64,
                embeds: [
                  {
                    author: {
                      name: 'Mobile Data Computer • Sistem Penautan Akun',
                      icon_url: 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png'
                    },
                    title: '✅ AKUN MDT BERHASIL DITAUTKAN!',
                    description: `Selamat <@${discordUser.id}>, akun Discord Anda **resmi terhubung** dengan akun login petugas kepolisian:\n\n👤 **Nama Petugas (IC):** \`${off.name}\`\n🎖️ **Nomor Lencana:** \`#${off.badge}\`\n⭐ **Pangkat Dinas:** \`${off.rank}\`\n🏢 **Divisi Penugasan:** \`${off.division || 'Patrol Division'}\`\n\nSekarang Anda dapat menggunakan perintah \`/duty\`, \`/roster\`, serta login dan monitoring dinas langsung dari Discord!`,
                    color: 0x10B981,
                    footer: { text: 'High State Police Department • Akun Personel Terverifikasi' },
                    timestamp: new Date().toISOString()
                  }
                ]
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
    } else if (eventType === 'MESSAGE_CREATE') {
      try {
        if (data.author?.bot) return;

        const rawContent = (data.content || '').trim();
        const currentChannelId = data.channel_id;
        const author = data.author || {};
        const member = data.member;
        const botUser = this.state.botUser;
        const botMention1 = botUser ? `<@${botUser.id}>` : null;
        const botMention2 = botUser ? `<@!${botUser.id}>` : null;

        let isBotMentioned = false;
        let commandText = rawContent;

        if (botMention1 && rawContent.startsWith(botMention1)) {
          isBotMentioned = true;
          commandText = rawContent.slice(botMention1.length).trim();
        } else if (botMention2 && rawContent.startsWith(botMention2)) {
          isBotMentioned = true;
          commandText = rawContent.slice(botMention2.length).trim();
        }

        const isDM = !data.guild_id;

        // Supported standalone commands that can be invoked directly with '!' or '/'
        // Examples: !update, /update, !pasal, /pasal, !hitung, /hitung, !config, /config, !status, /status, !help, /help
        const DIRECT_COMMANDS = new Set([
          'update', 'fitur', 'peningkatan', 'bugfix', 'fix',
          'changelog', 'release', 'rilis',
          'setchannel', 'set-channel', 'channel',
          'setping', 'ping',
          'config', 'settings', 'setting', 'konfig',
          'status', 'info',
          'test', 'tes', 'uji',
          'cek', 'profile', 'me',
          'panel',
          'pasal', 'kuhp',
          'hitung', 'denda', 'kalkulator',
          'bolo', 'apb',
          'lookup', 'suspect', 'warga',
          'roster', 'officer',
          'duty', 'dinas',
          'waran', 'warrant',
          'sop', '10code', '10codes',
          'mdt',
          'help', 'cmd', 'bantuan'
        ]);

        let isPrefixed = false;
        let body = '';

        if (isBotMentioned) {
          isPrefixed = true;
          body = commandText;
        } else if (commandText.startsWith('!') || commandText.startsWith('/')) {
          // Supports BOTH '!' and '/' as command triggers!
          const withoutSymbol = commandText.slice(1).trim();
          const firstWord = (withoutSymbol.split(/\s+/)[0] || '').toLowerCase();

          // 1. Namespace prefix: !hspd, /hspd, !mdt, /mdt, !bot, /bot
          if (firstWord === 'hspd' || firstWord === 'mdt' || firstWord === 'bot') {
            isPrefixed = true;
            body = withoutSymbol.slice(firstWord.length).trim();
          } 
          // 2. Direct command with ! or /: e.g. !update, /update, !fitur, /fitur, !config, /config
          else if (DIRECT_COMMANDS.has(firstWord)) {
            isPrefixed = true;
            body = withoutSymbol;
          } 
          // 3. Custom prefix check if configured
          else {
            const customPrefix = (this.serverConfig.prefix || '!hspd').toLowerCase().replace(/^[\/!]/, '');
            if (firstWord === customPrefix) {
              isPrefixed = true;
              body = withoutSymbol.slice(firstWord.length).trim();
            }
          }
        } else if (isDM) {
          isPrefixed = true;
          const firstWord = (commandText.split(/\s+/)[0] || '').toLowerCase();
          if (firstWord === 'hspd' || firstWord === 'mdt' || firstWord === 'bot') {
            body = commandText.slice(firstWord.length).trim();
          } else {
            body = commandText;
          }
        }

        if (!isPrefixed && !isDM) {
          return;
        }

        if (!body) {
          body = 'help';
        }

        const tokens = body.split(/\s+/).filter(Boolean);
        const command = (tokens[0] || 'help').toLowerCase();
        const args = tokens.slice(1);
        const fullArgs = body.slice(command.length).trim();

        // Check Permissions
        const perms = BigInt(member?.permissions || '0');
        const isAdmin = (perms & BigInt(0x8)) !== BigInt(0) || // ADMINISTRATOR
                        (perms & BigInt(0x20)) !== BigInt(0) || // MANAGE_GUILD
                        (perms & BigInt(0x10)) !== BigInt(0); // MANAGE_CHANNELS

        let isOfficerAtasan = false;
        let matchedOfficer: any = null;
        try {
          matchedOfficer = await discordRosterService.findOfficer({ discordId: author.id, discordUsername: author.username });
          if (matchedOfficer) {
            const r = (matchedOfficer.rank || '').toUpperCase();
            if (r.includes('CHIEF') || r.includes('COMMANDER') || r.includes('CAPTAIN') || r.includes('LIEUTENANT') || r.includes('SERGEANT') || r.includes('ATASAN')) {
              isOfficerAtasan = true;
            }
          }
        } catch {}

        const canConfigure = isAdmin || isOfficerAtasan || isDM;

        // -------------------------------------------------------------
        // CMD: HELP / BANTUAN
        // -------------------------------------------------------------
        if (command === 'help' || command === 'cmd' || command === 'bantuan') {
          await this.sendChannelMessage(currentChannelId, {
            message_reference: { message_id: data.id },
            embeds: [this.generateHelpEmbed(author.id)]
          });
          return;
        }

        // -------------------------------------------------------------
        // CMD: STATUS / INFO
        // -------------------------------------------------------------
        if (command === 'status' || command === 'info') {
          await this.sendChannelMessage(currentChannelId, {
            message_reference: { message_id: data.id },
            embeds: [this.generateStatusEmbed()]
          });
          return;
        }

        // -------------------------------------------------------------
        // CMD: CONFIG / SETTINGS
        // -------------------------------------------------------------
        if (command === 'config' || command === 'settings' || command === 'setting' || command === 'konfig') {
          await this.sendChannelMessage(currentChannelId, {
            message_reference: { message_id: data.id },
            embeds: [this.generateConfigEmbed()]
          });
          return;
        }

        // -------------------------------------------------------------
        // CMD: SETCHANNEL / SET-CHANNEL
        // -------------------------------------------------------------
        if (command === 'setchannel' || command === 'set-channel' || command === 'channel') {
          if (!canConfigure) {
            await this.sendChannelMessage(currentChannelId, {
              message_reference: { message_id: data.id },
              embeds: [{
                title: '⛔ Akses Ditolak',
                description: 'Anda memerlukan izin **Administrator / Kelola Server** Discord atau pangkat **Pimpinan / Atasan Kepolisian** untuk mengubah pengaturan channel bot.',
                color: 0xEF4444
              }]
            });
            return;
          }

          const targetType = (args[0] || '').toLowerCase();
          const rawTargetChannel = args[1] || currentChannelId;
          const targetChannelId = rawTargetChannel.replace(/[^0-9]/g, '');

          if (!targetType) {
            await this.sendChannelMessage(currentChannelId, {
              message_reference: { message_id: data.id },
              embeds: [{
                title: '❓ Format Perintah Salah',
                description: 'Format yang benar:\n`!hspd setchannel <update|duty|roster|case> #channel`\n\nContoh:\n`!hspd setchannel update #pengumuman-mdt`\n`!hspd setchannel update 123456789012345678`',
                color: 0xF59E0B
              }]
            });
            return;
          }

          if (!targetChannelId) {
            await this.sendChannelMessage(currentChannelId, {
              message_reference: { message_id: data.id },
              embeds: [{
                title: '❌ Channel Tidak Ditemukan',
                description: 'Harap mention channel (contoh: `#changelog`) atau masukkan ID channel Discord yang valid.',
                color: 0xEF4444
              }]
            });
            return;
          }

          let typeLabel = '';
          if (targetType === 'update' || targetType === 'changelog' || targetType === 'pembaruan') {
            this.updateServerConfig({
              changelogChannelId: targetChannelId,
              updatedBy: `${author.username} (${author.id})`
            });
            typeLabel = '📢 Pembaruan & Changelog (Fitur Baru, Peningkatan, Bugfix)';
          } else if (targetType === 'duty' || targetType === 'absen') {
            this.updateServerConfig({
              dutyChannelId: targetChannelId,
              updatedBy: `${author.username} (${author.id})`
            });
            typeLabel = '📋 Log Absensi Dinas (Duty & Patroli)';
          } else if (targetType === 'roster' || targetType === 'anggota') {
            this.updateServerConfig({
              rosterChannelId: targetChannelId,
              updatedBy: `${author.username} (${author.id})`
            });
            typeLabel = '👥 Mutasi & Roster Personel';
          } else if (targetType === 'case' || targetType === 'kasus') {
            this.updateServerConfig({
              caseChannelId: targetChannelId,
              updatedBy: `${author.username} (${author.id})`
            });
            typeLabel = '📁 Berkas Kasus & Investigasi';
          } else {
            await this.sendChannelMessage(currentChannelId, {
              message_reference: { message_id: data.id },
              embeds: [{
                title: '❓ Tipe Channel Tidak Dikenal',
                description: 'Pilihan tipe yang didukung: `update`, `duty`, `roster`, `case`.\nContoh: `!hspd setchannel update #changelog`',
                color: 0xF59E0B
              }]
            });
            return;
          }

          await this.sendChannelMessage(currentChannelId, {
            message_reference: { message_id: data.id },
            embeds: [{
              author: {
                name: 'Pengaturan Bot Diperbarui',
                icon_url: 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png'
              },
              title: '✅ Channel Berhasil Ditetapkan!',
              description: `Channel untuk **${typeLabel}** telah berhasil disetel ke <#${targetChannelId}>.\n\nSemua pengumuman dan penyiaran otomatis untuk modul ini sekarang akan langsung dikirimkan ke channel tersebut.`,
              color: 0x10B981,
              fields: [
                { name: '📍 Target Channel', value: `<#${targetChannelId}> (\`${targetChannelId}\`)`, inline: true },
                { name: '👤 Diperbarui Oleh', value: `<@${author.id}>`, inline: true }
              ],
              footer: {
                text: 'High State Police Department • Bot Configuration'
              },
              timestamp: new Date().toISOString()
            }]
          });
          return;
        }

        // -------------------------------------------------------------
        // CMD: SETPING
        // -------------------------------------------------------------
        if (command === 'setping' || command === 'ping-role') {
          if (!canConfigure) {
            await this.sendChannelMessage(currentChannelId, {
              message_reference: { message_id: data.id },
              embeds: [{
                title: '⛔ Akses Ditolak',
                description: 'Anda memerlukan izin Administrator atau Atasan untuk mengubah pengaturan mention ping.',
                color: 0xEF4444
              }]
            });
            return;
          }

          const roleArg = (args[0] || '').trim();
          if (!roleArg) {
            await this.sendChannelMessage(currentChannelId, {
              message_reference: { message_id: data.id },
              embeds: [{
                title: '❓ Format Perintah Salah',
                description: 'Format yang benar:\n`!hspd setping @everyone`\n`!hspd setping @here`\n`!hspd setping @NamaRole`\n`!hspd setping none` *(untuk mematikan ping)*',
                color: 0xF59E0B
              }]
            });
            return;
          }

          let cleanRole = roleArg;
          if (roleArg.toLowerCase() === 'off' || roleArg.toLowerCase() === 'none' || roleArg.toLowerCase() === 'disable') {
            cleanRole = 'none';
          }

          this.updateServerConfig({
            changelogMentionRole: cleanRole,
            updatedBy: `${author.username} (${author.id})`
          });

          await this.sendChannelMessage(currentChannelId, {
            message_reference: { message_id: data.id },
            embeds: [{
              title: '✅ Mention Ping Berhasil Diubah!',
              description: `Pengaturan mention untuk rilis pembaruan kini telah diubah menjadi: \`${cleanRole}\`\n\nSetiap pengumuman pembaruan yang dikirim akan secara otomatis menyertakan mention ini.`,
              color: 0x10B981
            }]
          });
          return;
        }

        // -------------------------------------------------------------
        // CMD: UPDATE / FITUR / PENINGKATAN / BUGFIX
        // -------------------------------------------------------------
        const isUpdateCmd = command === 'update' || command === 'rilis';
        const isFiturCmd = command === 'fitur' || (isUpdateCmd && (args[0] || '').toLowerCase() === 'fitur');
        const isPeningkatanCmd = command === 'peningkatan' || (isUpdateCmd && (args[0] || '').toLowerCase() === 'peningkatan');
        const isBugfixCmd = command === 'bugfix' || command === 'fix' || (isUpdateCmd && ((args[0] || '').toLowerCase() === 'bugfix' || (args[0] || '').toLowerCase() === 'fix'));

        if (isFiturCmd || isPeningkatanCmd || isBugfixCmd || isUpdateCmd) {
          if (!canConfigure) {
            await this.sendChannelMessage(currentChannelId, {
              message_reference: { message_id: data.id },
              embeds: [{
                title: '⛔ Akses Ditolak',
                description: 'Hanya personel dengan hak **Administrator Server** atau jajaran **Pimpinan / Atasan Kepolisian** yang dapat mempublikasikan pembaruan resmi.',
                color: 0xEF4444
              }]
            });
            return;
          }

          let updateType: 'fitur' | 'peningkatan' | 'bugfix' | 'umum' = 'umum';
          let messageContent = '';

          if (isFiturCmd) {
            updateType = 'fitur';
            messageContent = command === 'fitur' ? fullArgs : args.slice(1).join(' ');
          } else if (isPeningkatanCmd) {
            updateType = 'peningkatan';
            messageContent = command === 'peningkatan' ? fullArgs : args.slice(1).join(' ');
          } else if (isBugfixCmd) {
            updateType = 'bugfix';
            messageContent = (command === 'bugfix' || command === 'fix') ? fullArgs : args.slice(1).join(' ');
          } else {
            messageContent = fullArgs;
          }

          if (!messageContent || messageContent.trim().length < 3) {
            await this.sendChannelMessage(currentChannelId, {
              message_reference: { message_id: data.id },
              embeds: [{
                title: '❓ Isi Pesan Pembaruan Kosong',
                description: 'Harap masukkan rincian perubahan yang ingin dipublikasikan!\n\n**Contoh Penggunaan:**\n• `!hspd update fitur Menambahkan tombol edit, tambah, dan hapus pasal untuk atasan`\n• `!hspd update peningkatan Optimalisasi kecepatan sinkronisasi Firestore CAD & Dispatch`\n• `!hspd update bugfix Memperbaiki bug kalkulator denda dan login PIN Leoarnd Xianlao`\n• `!hspd changelog v3.2.0 | Fitur Baru: ... | Peningkatan: ... | Bug Fix: ...`',
                color: 0xF59E0B
              }]
            });
            return;
          }

          const targetChannelId = this.serverConfig.changelogChannelId || currentChannelId;
          const mention = (this.serverConfig.changelogMentionRole && this.serverConfig.changelogMentionRole !== 'none') 
            ? `${this.serverConfig.changelogMentionRole} ` 
            : '';

          let embedTitle = '';
          let embedColor = 0x00A8FF;
          let categoryName = '';
          let categoryIcon = '';

          if (updateType === 'fitur') {
            embedTitle = '🚀 [FITUR BARU] PEMBARUAN SISTEM MDT HSPD';
            embedColor = 0x10B981; // Emerald Green
            categoryName = '🚀 Fitur Baru (New Features)';
            categoryIcon = '🚀';
          } else if (updateType === 'peningkatan') {
            embedTitle = '⚡ [PENINGKATAN] OPTIMALISASI SISTEM MDT HSPD';
            embedColor = 0xF59E0B; // Amber Gold
            categoryName = '⚡ Peningkatan Sistem (Improvements)';
            categoryIcon = '⚡';
          } else if (updateType === 'bugfix') {
            embedTitle = '🛠️ [PERBAIKAN BUG] PEMBENAHAN SISTEM MDT HSPD';
            embedColor = 0xEF4444; // Crimson Red
            categoryName = '🛠️ Perbaikan Bug (Bug Fixes)';
            categoryIcon = '🛠️';
          } else {
            embedTitle = '📢 [PEMBARUAN RESMI] SISTEM MDT HSPD';
            embedColor = 0x00A8FF;
            categoryName = '📋 Rincian Pembaruan';
            categoryIcon = '📢';
          }

          // Split multi-line items if user used newlines or dashes
          const lines = messageContent.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
          const formattedItems = lines.map(l => l.startsWith('•') || l.startsWith('-') ? l : `• ${l}`).join('\n');

          const now = new Date();
          const dateStr = now.toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });

          const officerDisplay = matchedOfficer 
            ? `\`${matchedOfficer.name}\` (\`${matchedOfficer.badge}\` - ${matchedOfficer.rank})`
            : `<@${author.id}>`;

          const updateEmbed = {
            author: {
              name: 'High State Police Department • Sistem Pengumuman Pembaruan',
              icon_url: 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png'
            },
            title: embedTitle,
            description: `Pemberitahuan pembaruan sistem dan operasional kepolisian telah resmi dirilis ke server.\n\n📅 **Waktu Rilis:** \`${dateStr}\`\n👤 **Dipublikasikan Oleh:** ${officerDisplay}`,
            color: embedColor,
            fields: [
              {
                name: categoryName,
                value: formattedItems,
                inline: false
              }
            ],
            footer: {
              text: 'High State Police Department • Terminal Mobile Data Computer',
              icon_url: 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png'
            },
            timestamp: now.toISOString()
          };

          const postPayload = {
            content: mention ? `${mention}**[ PENGUMUMAN SISTEM MDT HSPD ]**` : undefined,
            embeds: [updateEmbed]
          };

          const postRes = await this.sendChannelMessage(targetChannelId, postPayload);
          if (!postRes.success) {
            await this.sendChannelMessage(currentChannelId, {
              message_reference: { message_id: data.id },
              embeds: [{
                title: '❌ Gagal Mengirim Pembaruan',
                description: `Terjadi kendala saat mengirimkan pesan ke channel <#${targetChannelId}>:\n\`${postRes.error}\``,
                color: 0xEF4444
              }]
            });
            return;
          }

          // Reply in current channel confirming dispatch
          if (targetChannelId !== currentChannelId) {
            await this.sendChannelMessage(currentChannelId, {
              message_reference: { message_id: data.id },
              embeds: [{
                title: '✅ Pembaruan Berhasil Dipublikasikan!',
                description: `Pesan rilis ${categoryIcon} **${categoryName}** telah berhasil dikirimkan ke channel <#${targetChannelId}>.`,
                color: 0x10B981
              }]
            });
          }
          return;
        }

        // -------------------------------------------------------------
        // CMD: CHANGELOG
        // -------------------------------------------------------------
        if (command === 'changelog') {
          if (!canConfigure) {
            await this.sendChannelMessage(currentChannelId, {
              message_reference: { message_id: data.id },
              embeds: [{
                title: '⛔ Akses Ditolak',
                description: 'Hanya Administrator atau Atasan yang dapat mempublikasikan changelog resmi.',
                color: 0xEF4444
              }]
            });
            return;
          }

          const rawChangelog = fullArgs;
          if (!rawChangelog || !rawChangelog.includes('|')) {
            await this.sendChannelMessage(currentChannelId, {
              message_reference: { message_id: data.id },
              embeds: [{
                title: '❓ Format Changelog',
                description: 'Gunakan pemisah tanda pipa (`|`) untuk membagi kategori:\n\n`!hspd changelog v3.2.0 | Fitur Baru: Tambah/Edit pasal, portal warga | Peningkatan: CAD responsif | Bugfix: Fix port Cloud Run`',
                color: 0xF59E0B
              }]
            });
            return;
          }

          const parts = rawChangelog.split('|').map(p => p.trim()).filter(Boolean);
          const version = parts[0] || 'v3.2.0';
          const newFeatures: string[] = [];
          const improvements: string[] = [];
          const bugFixes: string[] = [];

          for (let i = 1; i < parts.length; i++) {
            const p = parts[i];
            const lower = p.toLowerCase();
            if (lower.startsWith('fitur') || lower.startsWith('new') || lower.startsWith('baru')) {
              newFeatures.push(p.replace(/^(fitur\s*baru|fitur|baru|new\s*features?):\s*/i, ''));
            } else if (lower.startsWith('peningkatan') || lower.startsWith('improvement') || lower.startsWith('optimasi')) {
              improvements.push(p.replace(/^(peningkatan\s*sistem|peningkatan|improvements?):\s*/i, ''));
            } else if (lower.startsWith('bugfix') || lower.startsWith('bug') || lower.startsWith('fix') || lower.startsWith('perbaikan')) {
              bugFixes.push(p.replace(/^(perbaikan\s*bug|perbaikan|bugfix|bug|fix):\s*/i, ''));
            } else {
              newFeatures.push(p);
            }
          }

          const broadcastRes = await this.sendChangelogBroadcast({
            version,
            title: `Pembaruan Sistem MDT HSPD ${version}`,
            newFeatures,
            improvements,
            bugFixes,
            channelId: this.serverConfig.changelogChannelId || currentChannelId,
            authorName: matchedOfficer?.name || author.username,
            authorBadge: matchedOfficer?.badge
          });

          if (!broadcastRes.success) {
            await this.sendChannelMessage(currentChannelId, {
              message_reference: { message_id: data.id },
              embeds: [{
                title: '❌ Gagal Mengirim Changelog',
                description: broadcastRes.message,
                color: 0xEF4444
              }]
            });
            return;
          }

          await this.sendChannelMessage(currentChannelId, {
            message_reference: { message_id: data.id },
            embeds: [{
              title: '✅ Changelog Resmi Berhasil Dipublikasikan!',
              description: `Changelog versi **${version}** telah dikirim ke channel <#${broadcastRes.channelId}>!`,
              color: 0x10B981
            }]
          });
          return;
        }

        // -------------------------------------------------------------
        // CMD: RELEASE (PANDUAN CEPAT TEMPLATE RILIS)
        // -------------------------------------------------------------
        if (command === 'release') {
          await this.sendChannelMessage(currentChannelId, {
            message_reference: { message_id: data.id },
            embeds: [this.generateReleaseTemplateEmbed()]
          });
          return;
        }

        // -------------------------------------------------------------
        // CMD: TEST / TEST-UPDATE
        // -------------------------------------------------------------
        if (command === 'test' || command === 'test-update') {
          const targetChannelId = this.serverConfig.changelogChannelId || currentChannelId;
          const testRes = await this.sendChannelMessage(targetChannelId, {
            embeds: [{
              author: {
                name: 'Uji Coba Penyiaran Bot MDT HSPD',
                icon_url: 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png'
              },
              title: '🧪 TES PENGIRIMAN PENGUMUMAN BERHASIL!',
              description: `Pesan uji coba ini menandakan bahwa **Bot Discord HSPD** memiliki izin lengkap untuk mengirimkan pesan embed dan berinteraksi di channel <#${targetChannelId}>.\n\nSemua rilis pembaruan, peningkatan, dan bug fix siap disiarkan!`,
              color: 0x10B981,
              fields: [
                { name: '📡 Status Bot', value: '`ONLINE 24/7` 🟢', inline: true },
                { name: '📍 Channel Tujuan', value: `<#${targetChannelId}>`, inline: true },
                { name: '👤 Penguji', value: `<@${author.id}>`, inline: true }
              ],
              footer: {
                text: 'High State Police Department • Diagnostic Test Passed'
              },
              timestamp: new Date().toISOString()
            }]
          });

          if (!testRes.success) {
            await this.sendChannelMessage(currentChannelId, {
              message_reference: { message_id: data.id },
              embeds: [{
                title: '❌ Uji Coba Gagal',
                description: `Bot gagal mengirim ke channel <#${targetChannelId}>:\n\`${testRes.error}\``,
                color: 0xEF4444
              }]
            });
            return;
          }

          if (targetChannelId !== currentChannelId) {
            await this.sendChannelMessage(currentChannelId, {
              message_reference: { message_id: data.id },
              embeds: [{
                title: '✅ Uji Coba Berhasil Dikirim',
                description: `Pesan uji coba telah terkirim ke channel <#${targetChannelId}>!`,
                color: 0x10B981
              }]
            });
          }
          return;
        }

        // -------------------------------------------------------------
        // CMD: CEK (CEK DATA PETUGAS)
        // -------------------------------------------------------------
        if (command === 'cek' || command === 'profil' || command === 'check') {
          const query = fullArgs || author.username;
          const found = await discordRosterService.findOfficer({
            discordId: author.id,
            discordUsername: query,
            name: query,
            badge: query
          });

          if (!found) {
            await this.sendChannelMessage(currentChannelId, {
              message_reference: { message_id: data.id },
              embeds: [{
                title: '❌ Petugas Tidak Ditemukan',
                description: `Tidak ditemukan personel kepolisian dengan kriteria pencarian: \`${query}\`.\nPastikan nama IC atau nomor lencana sesuai dengan yang terdaftar di Roster Dinas.`,
                color: 0xEF4444
              }]
            });
            return;
          }

          await this.sendChannelMessage(currentChannelId, {
            message_reference: { message_id: data.id },
            embeds: [{
              author: {
                name: 'Data Personel Kepolisian High State',
                icon_url: 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png'
              },
              title: `👮 ${found.name}`,
              color: 0x00A8FF,
              fields: [
                { name: '🎖️ Nomor Lencana', value: `\`${found.badge}\``, inline: true },
                { name: '⭐ Pangkat Dinas', value: `\`${found.rank}\``, inline: true },
                { name: '🏢 Divisi', value: `\`${found.division || 'Patrol Division'}\``, inline: true },
                { name: '📱 Kontak / HP', value: `\`${found.phone || '-'}\``, inline: true },
                { name: '💬 Akun Discord', value: found.discordTag || `<@${author.id}>`, inline: true }
              ],
              footer: {
                text: 'High State Police Department • Official Personnel Record'
              }
            }]
          });
          return;
        }

        // -------------------------------------------------------------
        // CMD: PANEL (PANEL LAYANAN PERSONEL)
        // -------------------------------------------------------------
        if (command === 'panel') {
          if (!canConfigure) {
            await this.sendChannelMessage(currentChannelId, {
              message_reference: { message_id: data.id },
              embeds: [{
                title: '⛔ Akses Ditolak',
                description: 'Anda memerlukan hak akses Administrator untuk memposting panel layanan di channel ini.',
                color: 0xEF4444
              }]
            });
            return;
          }

          await this.sendChannelMessage(currentChannelId, {
            embeds: [{
              author: {
                name: 'MDT Panel High State Police Department',
                icon_url: 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png'
              },
              title: 'Pusat Otorisasi & Layanan Personel MDT HSPD',
              description: 'Selamat datang di Pusat Layanan Personel Kepolisian High State.\n\nSilakan gunakan tombol interaktif di bawah untuk memeriksa status akun dinas Anda atau mengajukan pemulihan PIN login ke Terminal MDT:',
              color: 0x00A8FF,
              fields: [
                {
                  name: '♻️ Resend Code / Cek Akun',
                  value: 'Periksa status nomor lencana, pangkat dinas, dan kirimkan salinan kredensial dinas langsung ke Pesan Pribadi (PM / DM) Discord Anda.',
                  inline: false
                },
                {
                  name: '🔑 Lupa Password / Reset PIN',
                  value: 'Ajukan permintaan reset PIN login dinas secara mandiri jika Anda lupa kata sandi.',
                  inline: false
                },
                {
                  name: '🌐 Akses Terminal MDT Web',
                  value: 'Buka sistem kepolisian langsung di browser:\n👉 [Klik di Sini untuk Membuka MDT](https://mdc-hspd-inspector.vercel.app/)',
                  inline: false
                }
              ],
              footer: {
                text: 'High State Police Department • Akun dibuat resmi oleh Jajaran Atasan',
                icon_url: 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png'
              }
            }],
            components: [
              {
                type: 1,
                components: [
                  {
                    type: 2,
                    custom_id: 'mdt_btn_resend_code',
                    label: 'Resend Code / Cek Status Akun',
                    style: 1, // Primary
                    emoji: { name: '♻️' }
                  },
                  {
                    type: 2,
                    custom_id: 'mdt_btn_forgot_password',
                    label: 'Lupa Password / Reset PIN',
                    style: 2, // Secondary
                    emoji: { name: '🔑' }
                  }
                ]
              }
            ]
          });
          return;
        }

        // -------------------------------------------------------------
        // CMD: PASAL / KUHP (Cari KUHP & Denda)
        // -------------------------------------------------------------
        if (command === 'pasal' || command === 'kuhp') {
          const embed = this.generatePasalEmbed(fullArgs);
          await this.sendChannelMessage(currentChannelId, {
            message_reference: { message_id: data.id },
            embeds: [embed],
            components: [
              {
                type: 1,
                components: [
                  {
                    type: 2,
                    style: 5,
                    label: 'Buka Web MDT',
                    url: 'https://mdc-hspd-inspector.vercel.app/',
                    emoji: { name: '🌐' }
                  }
                ]
              }
            ]
          });
          return;
        }

        // -------------------------------------------------------------
        // CMD: HITUNG / DENDA (Kalkulator Hukuman Gabungan)
        // -------------------------------------------------------------
        if (command === 'hitung' || command === 'denda' || command === 'kalkulator') {
          let diskon = 0;
          let pasalText = fullArgs;
          const diskonMatch = fullArgs.match(/(?:diskon|potongan|discount)[:=]?\s*(\d+)/i);
          if (diskonMatch) {
            diskon = parseInt(diskonMatch[1], 10) || 0;
            pasalText = fullArgs.replace(diskonMatch[0], '').trim();
          } else if (args.length > 1 && /^\d+$/.test(args[args.length - 1])) {
            diskon = parseInt(args[args.length - 1], 10) || 0;
            pasalText = args.slice(0, -1).join(' ');
          }

          const embed = this.generateHitungEmbed(pasalText, diskon);
          await this.sendChannelMessage(currentChannelId, {
            message_reference: { message_id: data.id },
            embeds: [embed],
            components: [
              {
                type: 1,
                components: [
                  {
                    type: 2,
                    style: 5,
                    label: 'Kalkulator Web MDT',
                    url: 'https://mdc-hspd-inspector.vercel.app/',
                    emoji: { name: '⚖️' }
                  }
                ]
              }
            ]
          });
          return;
        }

        // -------------------------------------------------------------
        // CMD: BOLO / APB (Daftar Buronan & DPO)
        // -------------------------------------------------------------
        if (command === 'bolo' || command === 'apb') {
          const embed = this.generateBoloEmbed(fullArgs);
          await this.sendChannelMessage(currentChannelId, {
            message_reference: { message_id: data.id },
            embeds: [embed]
          });
          return;
        }

        // -------------------------------------------------------------
        // CMD: LOOKUP / SUSPECT / WARGA (Riwayat Kriminalitas Warga)
        // -------------------------------------------------------------
        if (command === 'lookup' || command === 'suspect' || command === 'warga') {
          const embed = this.generateLookupEmbed(fullArgs || author.username);
          await this.sendChannelMessage(currentChannelId, {
            message_reference: { message_id: data.id },
            embeds: [embed]
          });
          return;
        }

        // -------------------------------------------------------------
        // CMD: ROSTER / OFFICER (Personel Kepolisian)
        // -------------------------------------------------------------
        if (command === 'roster' || command === 'officer') {
          const embed = await this.generateRosterEmbed(fullArgs);
          await this.sendChannelMessage(currentChannelId, {
            message_reference: { message_id: data.id },
            embeds: [embed]
          });
          return;
        }

        // -------------------------------------------------------------
        // CMD: DUTY / DINAS (Status On Duty 10-8 / Off Duty 10-7)
        // -------------------------------------------------------------
        if (command === 'duty' || command === 'dinas') {
          const status = (args[0] || '10-8').toLowerCase();
          const callsign = args.slice(1).join(' ');
          const embed = await this.handleDutyToggle(
            { id: author.id, username: author.username },
            status,
            callsign,
            currentChannelId
          );
          await this.sendChannelMessage(currentChannelId, {
            message_reference: { message_id: data.id },
            embeds: [embed]
          });
          return;
        }

        // -------------------------------------------------------------
        // CMD: WARAN / WARRANT (Surat Perintah Penangkapan)
        // -------------------------------------------------------------
        if (command === 'waran' || command === 'warrant') {
          const embed = this.generateWaranEmbed();
          await this.sendChannelMessage(currentChannelId, {
            message_reference: { message_id: data.id },
            embeds: [embed]
          });
          return;
        }

        // -------------------------------------------------------------
        // CMD: SOP / 10CODE / 10CODES (Buku Saku Sandi Polisi)
        // -------------------------------------------------------------
        if (command === 'sop' || command === '10code' || command === '10codes') {
          const embed = this.generateSopEmbed(fullArgs);
          await this.sendChannelMessage(currentChannelId, {
            message_reference: { message_id: data.id },
            embeds: [embed]
          });
          return;
        }

        // -------------------------------------------------------------
        // CMD: MDT / LINK / TAUTKAN (Penautan & Status Akun Login MDT)
        // -------------------------------------------------------------
        if (command === 'mdt' || command === 'link' || command === 'tautkan') {
          const subCmd = (args[0] || '').toLowerCase();
          let aksi = 'status';
          let petugas = '';
          let pin = '';

          if (subCmd === 'link' || subCmd === 'taut' || subCmd === 'tautkan') {
            aksi = 'tautkan';
            petugas = args[1] || '';
            pin = args[2] || '';
          } else if (subCmd === 'putus' || subCmd === 'unlink' || subCmd === 'lepas') {
            aksi = 'putus';
          } else if (args.length >= 2) {
            aksi = 'tautkan';
            petugas = args[0];
            pin = args[1];
          }

          const userCtx: DiscordUserContext = {
            id: author.id,
            username: author.username,
            discriminator: author.discriminator || '0',
            avatarUrl: author.avatar
              ? `https://cdn.discordapp.com/avatars/${author.id}/${author.avatar}.png`
              : undefined
          };

          const mdtResponse = await this.generateMdtLinkResponse(userCtx, {
            aksi,
            petugas,
            pin
          });

          await this.sendChannelMessage(currentChannelId, {
            message_reference: { message_id: data.id },
            embeds: mdtResponse.embeds,
            components: mdtResponse.components
          });
          return;
        }

      } catch (cmdErr) {
        console.error('[Discord Gateway] Error processing MESSAGE_CREATE command:', cmdErr);
      }
    }
  }

  // =========================================================================
  // HELPER METHODS: EMBEDS, SLASH COMMANDS, AND BROADCASTS
  // =========================================================================

  public generateHelpEmbed(userId: string) {
    return {
      author: {
        name: 'Terminal Bot HSPD & MDC Command Center',
        icon_url: 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png'
      },
      title: '⚡ PANDUAN LENGKAP PERINTAH (CMD) DISCORD BOT',
      description: `Halo <@${userId}>! Bot kepolisian kini mendukung pemanggilan perintah penuh menggunakan slash command **\`/\`** atau awalan **\`!\`** (contoh: \`/pasal\`, \`/hitung\`, \`/duty\`, \`/roster\`, \`/update\`).\n\nBerikut adalah ringkasan seluruh perintah resmi kepolisian:`,
      color: 0x00A8FF,
      fields: [
        {
          name: '⚖️ 1. KUHP & Penegakan Hukum (Law & Penal)',
          value: [
            '`/pasal <kode/kata kunci>` • Cari pasal KUHP, rincian denda, kurungan, & impound',
            '`/hitung <pasal> [diskon]` • Kalkulator denda & masa penjara gabungan (misal: `/hitung pasal:A01, B08 diskon:10`)',
            '`/bolo [query]` • Cek daftar buronan (BOLO / APB) kendaraan & tersangka DPO',
            '`/lookup <nama>` • Cek rekam jejak kriminalitas warga & riwayat tahanan',
            '`/waran` • Cek surat perintah penangkapan aktif (Arrest Warrants) resmi'
          ].join('\n'),
          inline: false
        },
        {
          name: '👮 2. Operasional & Dinas Kepolisian',
          value: [
            '`/duty <status> [callsign]` • Perbarui status dinas kepolisian (10-8 On Duty / 10-7 Off Duty)',
            '`/roster [petugas]` • Lihat status personel aktif, pangkat, badge, & telepon',
            '`/sop [kode]` • Buku saku 10-Codes radio polisi & sandi taktis darurat',
            '`/mdt` • Tautkan akun Discord ke akun login petugas MDT & periksa status akun'
          ].join('\n'),
          inline: false
        },
        {
          name: '📢 3. Pengumuman Rilis & Changelog',
          value: [
            '`/update <kategori> <pesan>` • Publikasikan pengumuman update sistem ke Discord',
            '`/release` • Lihat template dan format rilis cepat',
            '`/test` • Kirim pesan uji coba ke channel pembaruan'
          ].join('\n'),
          inline: false
        },
        {
          name: '⚙️ 4. Pengaturan Server & Konfigurasi Bot',
          value: [
            '`!hspd setchannel update #channel` • Atur channel pengumuman rilis',
            '`!hspd setchannel duty #channel` • Atur channel log absensi dinas',
            '`!hspd setchannel roster #channel` • Atur channel log mutasi & roster',
            '`!hspd config` atau `/config` • Tampilkan ringkasan konfigurasi bot saat ini',
            '`!hspd status` atau `/status` • Periksa status online, latency, & performa bot'
          ].join('\n'),
          inline: false
        },
        {
          name: '💡 Fleksibilitas Awalan (! atau /)',
          value: 'Semua perintah dapat dipanggil menggunakan awalan **`/`** (Slash Command menu) atau **`!`** di chat server Discord!',
          inline: false
        }
      ],
      footer: {
        text: 'High State Police Department • Mendukung Prefix ! dan /',
        icon_url: 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png'
      },
      timestamp: new Date().toISOString()
    };
  }

  public generateStatusEmbed() {
    const uptimeSec = this.state.startedAt ? Math.floor((Date.now() - this.state.startedAt) / 1000) : 0;
    const hours = Math.floor(uptimeSec / 3600);
    const mins = Math.floor((uptimeSec % 3600) / 60);
    const secs = uptimeSec % 60;
    const uptimeStr = `${hours}j ${mins}m ${secs}d`;

    const updateCh = this.serverConfig.changelogChannelId ? `<#${this.serverConfig.changelogChannelId}>` : '`Belum diatur`';

    return {
      author: {
        name: 'Status Bot MDT HSPD',
        icon_url: 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png'
      },
      title: '🟢 BOT AKTIF & SIAGA ONLINE 24/7',
      color: 0x10B981,
      fields: [
        { name: '🤖 Nama Bot', value: `\`${this.state.botUser?.username || 'HSPD Bot'}\``, inline: true },
        { name: '⚡ Gateway Status', value: this.state.isOnline ? '`Connected (Online)` 🟢' : '`Connecting...` 🟡', inline: true },
        { name: '⏱️ Uptime Sesi', value: `\`${uptimeStr}\``, inline: true },
        { name: '📢 Channel Pembaruan', value: updateCh, inline: true },
        { name: '🔔 Mention Ping', value: `\`${this.serverConfig.changelogMentionRole || 'none'}\``, inline: true },
        { name: '🏷️ Mode Perintah', value: '`!` atau `/` *(Keduanya aktif)*', inline: true }
      ],
      footer: {
        text: 'High State Police Department • Sistem Cloud Realtime'
      },
      timestamp: new Date().toISOString()
    };
  }

  public generateConfigEmbed() {
    return {
      author: {
        name: 'Pengaturan Bot Server Discord',
        icon_url: 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png'
      },
      title: '⚙️ KONFIGURASI BOT DISCORD SAAT INI',
      description: 'Berikut adalah daftar channel penyiaran dan pengaturan yang aktif di server ini (Mendukung `!` dan `/`):',
      color: 0x00A8FF,
      fields: [
        { 
          name: '📢 Channel Update & Changelog', 
          value: this.serverConfig.changelogChannelId ? `<#${this.serverConfig.changelogChannelId}> (\`${this.serverConfig.changelogChannelId}\`)` : '`Belum diatur` *(Ketik: `!hspd setchannel update #channel` atau `/hspd setchannel ...`)*', 
          inline: false 
        },
        { 
          name: '🔔 Mention Ping Default', 
          value: '`' + (this.serverConfig.changelogMentionRole || 'none') + '` *(Ubah: `!hspd setping @everyone` atau `/hspd setping ...`)*', 
          inline: false 
        },
        { 
          name: '📋 Channel Absensi Dinas (Duty)', 
          value: this.serverConfig.dutyChannelId ? `<#${this.serverConfig.dutyChannelId}>` : '`Gunakan Webhook / Belum diatur`', 
          inline: true 
        },
        { 
          name: '👥 Channel Roster & Mutasi', 
          value: this.serverConfig.rosterChannelId ? `<#${this.serverConfig.rosterChannelId}>` : '`Gunakan Webhook / Belum diatur`', 
          inline: true 
        },
        { 
          name: '📁 Channel Kasus & Investigasi', 
          value: this.serverConfig.caseChannelId ? `<#${this.serverConfig.caseChannelId}>` : '`Gunakan Webhook / Belum diatur`', 
          inline: true 
        }
      ],
      footer: {
        text: 'Gunakan perintah !hspd setchannel atau /hspd setchannel untuk mengubah channel.'
      },
      timestamp: new Date().toISOString()
    };
  }

  public generateReleaseTemplateEmbed() {
    return {
      author: {
        name: 'Pusat Template Rilis MDT HSPD',
        icon_url: 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png'
      },
      title: '📋 CONTOH & FORMAT CEPAT RILIS PEMBARUAN',
      description: 'Salin salah satu format perintah di bawah (bisa pakai `!` atau `/`) untuk mengirimkan pengumuman:',
      color: 0x00A8FF,
      fields: [
        {
          name: '🚀 1. Rilis Fitur Baru',
          value: '```!hspd update fitur Menambahkan tombol penambahan pasal baru & penghapusan pasal untuk atasan```\n*atau:*\n```/update fitur Menambahkan tombol penambahan pasal baru & penghapusan pasal untuk atasan```',
          inline: false
        },
        {
          name: '⚡ 2. Rilis Peningkatan',
          value: '```!hspd update peningkatan Optimalisasi performa database Firestore dan konektivitas WebSocket 24/7```\n*atau:*\n```/update peningkatan Optimalisasi performa database Firestore dan konektivitas WebSocket 24/7```',
          inline: false
        },
        {
          name: '🛠️ 3. Rilis Perbaikan Bug',
          value: '```!hspd update bugfix Memperbaiki kalkulasi total denda di portal warga dan kegagalan deploy Cloud Run```\n*atau:*\n```/update bugfix Memperbaiki kalkulasi total denda di portal warga dan kegagalan deploy Cloud Run```',
          inline: false
        },
        {
          name: '📦 4. Rilis Changelog Lengkap',
          value: '```!hspd changelog v3.2.0 | Fitur: Tombol edit pasal atasan | Peningkatan: Respons CAD | Bugfix: Fix port deploy 8080```',
          inline: false
        }
      ],
      footer: {
        text: 'High State Police Department • Mendukung Prefix ! dan /'
      }
    };
  }

  public getCategoryLabel(cat?: string): string {
    const map: Record<string, string> = {
      A: 'A - Lalu Lintas',
      B: 'B - Pidana Umum',
      C: 'C - Properti',
      D: 'D - Narkotika',
      E: 'E - Senjata Api & Ilegal',
      F: 'F - Kriminal Berat',
      G: 'G - Ekonomi',
      H: 'H - Khusus / Lain-lain'
    };
    return (cat && map[cat.toUpperCase()]) || (cat ? `Kategori ${cat}` : 'Umum');
  }

  public getCategoryColor(cat?: string): number {
    const map: Record<string, number> = {
      A: 0x10B981, // Emerald Green
      B: 0xF59E0B, // Amber Gold
      C: 0xF97316, // Orange
      D: 0xE11D48, // Rose
      E: 0xDC2626, // Red
      F: 0x7C3AED, // Purple
      G: 0x06B6D4, // Cyan
      H: 0x4F46E5  // Indigo
    };
    return (cat && map[cat.toUpperCase()]) || 0x00A8FF;
  }

  public generatePasalEmbed(query: string) {
    const cleanQuery = (query || '').trim();
    if (!cleanQuery) {
      return {
        author: {
          name: 'Kitab Undang-Undang Hukum Pidana • HSPD MDC',
          icon_url: 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png'
        },
        title: '📜 Kitab Undang-Undang Hukum Pidana (KUHP) HSPD',
        description: 'Masukkan kode pasal (misal: `/pasal query: A01`) atau kata kunci pencarian (misal: `/pasal query: narkoba`).\n\n**Daftar Kategori KUHP:**\n• **A** - Pelanggaran Lalu Lintas & Jalan Raya\n• **B** - Pidana Ringan & Gangguan Ketertiban Umum\n• **C** - Kejahatan Terhadap Properti & Pencurian\n• **D** - Narkotika & Zat Terlarang\n• **E** - Senjata Api, Bahan Peledak, & Benda Ilegal\n• **F** - Kriminal Berat, Pembunuhan, & Terorisme\n• **G** - Kejahatan Finansial, Penipuan, & Korupsi\n• **H** - Kejahatan Khusus & Ketentuan Tambahan',
        color: 0x00A8FF,
        footer: { text: 'Gunakan /hitung untuk menjumlahkan denda & hukuman gabungan' }
      };
    }

    const qLower = cleanQuery.toLowerCase();
    const qUpper = cleanQuery.toUpperCase();

    // 1. Exact code match
    const exact = PASAL_LIST.find(p => p.code.toUpperCase() === qUpper);
    if (exact) {
      return {
        author: {
          name: 'Kitab Undang-Undang Hukum Pidana • HSPD MDC',
          icon_url: 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png'
        },
        title: `📜 Pasal ${exact.code}: ${exact.desc}`,
        description: `Informasi regulasi hukum resmi dari Divisi Hukum & Operasional High State Police Department.`,
        color: this.getCategoryColor(exact.cat),
        fields: [
          { name: '🏷️ Kategori', value: `\`${this.getCategoryLabel(exact.cat)}\``, inline: true },
          { name: '💵 Denda Finansial', value: `**$${exact.fine.toLocaleString('en-US')}**`, inline: true },
          { name: '⏳ Masa Tahanan', value: `**${exact.time > 0 ? `${exact.time} Bulan Penjara` : 'Tidak Ada Penjara'}**`, inline: true },
          { name: '🚗 Sitaan Kendaraan', value: `**${exact.imp > 0 ? `${exact.imp} Hari Impound` : 'Tidak Disita'}**`, inline: true },
          { name: '⚖️ Dasar Hukum & SOP Eksekusi', value: `Pelanggaran pasal ini wajib diproses melalui investigasi atau tilang resmi di tempat. Jika tersangka kooperatif (roleplay baik), petugas dapat memberikan keringanan denda maksimal 20%.`, inline: false }
        ],
        footer: {
          text: `Gunakan /hitung pasal:${exact.code} untuk kalkulasi cepat di lapangan`
        },
        timestamp: new Date().toISOString()
      };
    }

    // 2. Keyword Search
    const matches = PASAL_LIST.filter(p => 
      p.code.toLowerCase().includes(qLower) || 
      p.desc.toLowerCase().includes(qLower) ||
      this.getCategoryLabel(p.cat).toLowerCase().includes(qLower)
    );

    if (matches.length === 0) {
      return {
        author: { name: 'Pencarian KUHP HSPD', icon_url: 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png' },
        title: `🔍 Pasal Tidak Ditemukan: "${cleanQuery}"`,
        description: `Tidak ditemukan pasal KUHP yang cocok dengan kata kunci tersebut.\n\n💡 **Tips:**\n• Coba cari dengan kode pasal seperti \`A01\`, \`A12\`, \`B08\`, \`E01\`.\n• Atau cari dengan kata kunci umum seperti \`sim\`, \`curanmor\`, \`senpi\`, \`narkoba\`, \`begal\`, \`suap\`.`,
        color: 0xEF4444
      };
    }

    if (matches.length === 1) {
      return this.generatePasalEmbed(matches[0].code);
    }

    // Multiple matches list (up to 8)
    const displayList = matches.slice(0, 8);
    const fields = displayList.map(p => ({
      name: `📌 [${p.code}] ${p.desc}`,
      value: `💵 **$${p.fine.toLocaleString('en-US')}** • ⏳ **${p.time} Bln** • 🚗 **${p.imp} Hari Impound** (${this.getCategoryLabel(p.cat)})`,
      inline: false
    }));

    return {
      author: { name: 'Hasil Pencarian KUHP HSPD', icon_url: 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png' },
      title: `🔍 Ditemukan ${matches.length} Pasal untuk "${cleanQuery}"`,
      description: `Ketik \`/pasal query:<kode>\` untuk melihat rincian pasal tertentu secara lengkap:`,
      color: 0x00A8FF,
      fields,
      footer: {
        text: matches.length > 8 ? `Menampilkan 8 dari total ${matches.length} pasal yang cocok` : 'HSPD Mobile Data Computer'
      }
    };
  }

  public generateHitungEmbed(pasalStr: string, diskon: number = 0) {
    const rawCodes = (pasalStr || '')
      .split(/[,;\s+]+/)
      .map(s => s.trim().toUpperCase())
      .filter(Boolean);

    if (rawCodes.length === 0) {
      return {
        author: {
          name: 'Kalkulator Penegakan Hukum • HSPD MDC',
          icon_url: 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png'
        },
        title: '⚖️ Kalkulator Denda & Hukuman Penjara HSPD',
        description: 'Masukkan daftar kode pasal yang dilanggar tersangka.\n\n**Contoh Penggunaan:**\n`/hitung pasal: A01, A05, B08`\n`/hitung pasal: A12, E01 diskon: 15`',
        color: 0xF59E0B
      };
    }

    const applied: Array<{ item: any; code: string }> = [];
    const notFound: string[] = [];

    for (const code of rawCodes) {
      const found = PASAL_LIST.find(p => p.code.toUpperCase() === code);
      if (found) {
        applied.push({ item: found, code: found.code });
      } else {
        notFound.push(code);
      }
    }

    if (applied.length === 0) {
      return {
        author: {
          name: 'Kalkulator Penegakan Hukum • HSPD MDC',
          icon_url: 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png'
        },
        title: '❌ Kode Pasal Tidak Valid',
        description: `Tidak ada kode pasal yang dikenali dari input: \`${pasalStr}\`\n\nPastikan menggunakan kode resmi seperti: \`A01\`, \`A05\`, \`B08\`, \`E01\`, \`F01\`.`,
        color: 0xEF4444
      };
    }

    const subtotalFine = applied.reduce((sum, a) => sum + a.item.fine, 0);
    const validDiskon = Math.max(0, Math.min(100, Number(diskon) || 0));
    const discountAmount = Math.floor(subtotalFine * (validDiskon / 100));
    const totalFine = subtotalFine - discountAmount;
    const totalTime = applied.reduce((sum, a) => sum + a.item.time, 0);
    const totalImp = applied.reduce((sum, a) => sum + a.item.imp, 0);

    const codesFormatted = applied.map(a => a.code).join(', ');

    const breakdownLines = applied.map(a => 
      `• **[${a.code}]** ${a.item.desc.slice(0, 36)}${a.item.desc.length > 36 ? '...' : ''}\n  └ 💵 $${a.item.fine.toLocaleString('en-US')} | ⏳ ${a.item.time} Bln | 🚗 ${a.item.imp} Hari`
    ).join('\n');

    const rpDialog = `Kesalahan Mas/Mbak dikenakan Pasal [${codesFormatted}] dengan total denda $${totalFine.toLocaleString('en-US')}${validDiskon > 0 ? ` (Keringanan ${validDiskon}%)` : ''} dan masa tahanan ${totalTime} bulan${totalImp > 0 ? `, serta sita kendaraan ${totalImp} hari` : ''}.`;

    const fields: Array<{ name: string; value: string; inline?: boolean }> = [
      { name: '📋 Rincian Pasal Dilanggar', value: breakdownLines, inline: false },
      { name: '💵 Total Denda Akhir', value: validDiskon > 0 ? `~~$${subtotalFine.toLocaleString('en-US')}~~ ➔ **$${totalFine.toLocaleString('en-US')}**\n*(Potongan ${validDiskon}%: -$${discountAmount.toLocaleString('en-US')})*` : `**$${totalFine.toLocaleString('en-US')}**`, inline: true },
      { name: '⏳ Total Penjara', value: `**${totalTime} Bulan**`, inline: true },
      { name: '🚗 Total Impound', value: `**${totalImp} Hari Sitaan**`, inline: true },
      {
        name: '💬 Teks Chat RP Tersangka (Bisa Langsung Di-Copy)',
        value: `\`\`\`${rpDialog}\`\`\``,
        inline: false
      }
    ];

    if (notFound.length > 0) {
      fields.push({
        name: '⚠️ Kode Tidak Ditemukan',
        value: `Kode berikut dilewati karena tidak terdaftar di KUHP: \`${notFound.join(', ')}\``,
        inline: false
      });
    }

    return {
      author: {
        name: 'Kalkulator Penegakan Hukum • HSPD MDC',
        icon_url: 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png'
      },
      title: `⚖️ Hasil Kalkulasi: ${applied.length} Pasal Terpilih`,
      description: `Rekapitulasi vonis hukum dan penetapan hukuman berdasarkan KUHP High State Police Department:`,
      color: 0x10B981,
      fields,
      footer: {
        text: 'HSPD MDC System • Kalkulator Vonis Resmi'
      },
      timestamp: new Date().toISOString()
    };
  }

  public generateBoloEmbed(query?: string) {
    const q = (query || '').trim();
    return {
      author: {
        name: 'Divisi Intelijen & APB • High State Police Dept',
        icon_url: 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png'
      },
      title: q ? `🚨 BOLO / APB: Pencarian "${q}"` : '🚨 DAFTAR BOLO & DPO AKTIF (Be On The Lookout)',
      description: q 
        ? `Menampilkan status pencarian kendaraan atau tersangka buronan dengan parameter \`${q}\`:`
        : `Daftar kendaraan dan orang yang sedang dicari aktif oleh seluruh unit kepolisian di lapangan:`,
      color: 0xEF4444,
      fields: [
        {
          name: '🔴 [KENDARAAN] Sultan Hitam Kaca Gelap',
          value: '• Plat: `LS-8821-XP`\n• Kasus: Pembegalan ATM & Penembakan Petugas\n• Lokasi Terakhir: Jefferson & East Los Santos\n• Tingkat Bahaya: **CODE RED (Bersenjata Api)**',
          inline: false
        },
        {
          name: '🟡 [KENDARAAN] Buffalo Merah',
          value: '• Plat: `LS-4412-BB`\n• Kasus: Balap Liar & Menabrak Petugas (Hit and Run)\n• Lokasi Terakhir: Vinewood Hills\n• Tingkat Bahaya: **MODERAT**',
          inline: false
        },
        {
          name: '🔴 [TERSANGKA DPO] Marcus "Ghost" Vance',
          value: '• Ciri: Jaket kulit hitam, tato naga di leher\n• Kasus: Perampokan Bersenjata Toko Perhiasan\n• Status Waran: **AKTIF (Diterbitkan Pengadilan)**',
          inline: false
        }
      ],
      footer: {
        text: 'Hubungi Dispatch 911 jika melihat kendaraan atau subjek di atas'
      },
      timestamp: new Date().toISOString()
    };
  }

  public generateLookupEmbed(nama: string) {
    const cleanName = (nama || '').trim();
    if (!cleanName) {
      return {
        author: {
          name: 'Database Catatan Kriminal Warga • HSPD MDC',
          icon_url: 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png'
        },
        title: '🔍 Pencarian Catatan Warga & Kriminalitas MDT',
        description: 'Masukkan nama warga yang ingin diperiksa, contoh: `/lookup nama: Michael Corleone`',
        color: 0x00A8FF
      };
    }

    return {
      author: {
        name: 'Database Catatan Kriminal Warga • HSPD MDC',
        icon_url: 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png'
      },
      title: `👤 Catatan Profil: ${cleanName}`,
      description: `Hasil verifikasi database kependudukan & riwayat kriminalitas Departemen Kepolisian High State:`,
      color: 0x3B82F6,
      fields: [
        { name: '🆔 Status Kependudukan', value: '`WARGA TERDAFTAR RESMI`', inline: true },
        { name: '⚠️ Status Buronan (DPO)', value: '`BERSIH / TIDAK ADA DPO` 🟢', inline: true },
        { name: '📜 Surat Perintah (Warrant)', value: '`0 Surat Perintah Aktif`', inline: true },
        { name: '📋 Riwayat Penangkapan', value: '• **12/08/2026** - Tilang Pelanggaran Marka (Pasal A02)\n• **28/08/2026** - Pertikaian Ringan di Tempat Umum (Pasal B06)', inline: false },
        { name: '💳 Total Denda Tercatat', value: '$2,950 (LUNAS)', inline: true },
        { name: '🚗 Kepemilikan Kendaraan', value: '2 Kendaraan (Sentinel & Faggio)', inline: true }
      ],
      footer: {
        text: 'Buka Web MDT untuk detail berkas forensik dan sidik jari lengkap'
      },
      timestamp: new Date().toISOString()
    };
  }

  public async generateRosterEmbed(query?: string) {
    const q = (query || '').trim().toLowerCase();
    try {
      const officers = await discordRosterService.getAllOfficers();
      if (officers.length === 0) {
        return {
          title: '👥 Roster Dinas Kepolisian HSPD',
          description: 'Belum ada data anggota di roster dinas kepolisian.',
          color: 0x00A8FF
        };
      }

      if (q) {
        const matched = officers.filter(o => 
          o.badge.toLowerCase().includes(q) || 
          o.name.toLowerCase().includes(q) ||
          (o.rank && o.rank.toLowerCase().includes(q))
        );

        if (matched.length === 0) {
          return {
            title: `🔍 Personel Tidak Ditemukan: "${query}"`,
            description: `Tidak ada anggota di roster dengan lencana atau nama \`${query}\`.`,
            color: 0xEF4444
          };
        }

        const o = matched[0];
        return {
          author: { name: 'Profil Personel Kepolisian • HSPD', icon_url: 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png' },
          title: `👮 [${o.badge}] ${o.name}`,
          color: 0x10B981,
          fields: [
            { name: '🎖️ Pangkat (Rank)', value: `\`${o.rank || 'Officer'}\``, inline: true },
            { name: '🛡️ Divisi', value: `\`${o.division || 'Patrol'}\``, inline: true },
            { name: '📡 Status Dinas', value: o.isDuty ? '🟢 `10-8 ON DUTY`' : '🔴 `10-7 OFF DUTY`', inline: true },
            { name: '💬 Discord', value: o.discordTag ? `@${o.discordTag}` : (o.discordUsername ? `@${o.discordUsername}` : '—'), inline: true },
            { name: '📞 Nomor Telepon', value: o.phone || '—', inline: true }
          ],
          footer: { text: `Total hasil cocok: ${matched.length} personel` },
          timestamp: new Date().toISOString()
        };
      }

      // Display active roster summary
      const onDuty = officers.filter(o => o.isDuty);
      const offDuty = officers.filter(o => !o.isDuty);

      const onDutyList = onDuty.length > 0 
        ? onDuty.map(o => `🟢 **[${o.badge}]** ${o.name} *(${o.rank || 'Officer'})*`).slice(0, 10).join('\n')
        : '*Tidak ada perwira yang sedang bertugas.*';

      return {
        author: { name: 'Roster Dinas Kepolisian High State', icon_url: 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png' },
        title: `👥 STATUS ROSTER KEPOLISIAN (${officers.length} PERSONEL)`,
        description: `Berikut adalah ringkasan status personel di lapangan saat ini:`,
        color: 0x00A8FF,
        fields: [
          { name: `🟢 Sedang Dinas 10-8 (${onDuty.length} Personel)`, value: onDutyList, inline: false },
          { name: `🔴 Lepas Dinas 10-7 (${offDuty.length} Personel)`, value: `${offDuty.length} personel sedang tidak bertugas (off duty).`, inline: false }
        ],
        footer: { text: 'Gunakan /roster petugas:<nama/badge> untuk cek detail spesifik' },
        timestamp: new Date().toISOString()
      };
    } catch {
      return {
        title: '👥 Roster Dinas HSPD',
        description: 'Gagal memuat data roster kepolisian dari database.',
        color: 0xEF4444
      };
    }
  }

  public async handleDutyToggle(discordUser: DiscordUserContext, status: string, callsign?: string, currentChannelId?: string) {
    const is108 = status === '10-8';
    const isBusy = status === '10-6';
    const isCode6 = status === 'code-6';

    let statusText = '10-7 OFF DUTY (Lepas Dinas)';
    let color = 0xEF4444;

    if (is108) {
      statusText = '10-8 ON DUTY (Mulai Bertugas)';
      color = 0x10B981;
    } else if (isBusy) {
      statusText = '10-6 BUSY (Sedang Menangani TKP)';
      color = 0xF59E0B;
    } else if (isCode6) {
      statusText = 'CODE 6 (Observasi / Penyelidikan)';
      color = 0x3B82F6;
    }

    let officerName = discordUser.username;
    let badge = 'HSPD';
    let rank = 'Officer';

    try {
      const officer = await discordRosterService.findOfficer({ discordId: discordUser.id, discordUsername: discordUser.username });
      if (officer) {
        officerName = officer.name;
        badge = officer.badge;
        rank = officer.rank;
      }
    } catch {}

    const embed = {
      author: { name: 'Sistem Absensi & Log Dinas • HSPD MDC', icon_url: 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png' },
      title: `📡 STATUS DINAS PERWIRA DIKIRIM`,
      description: `<@${discordUser.id}> telah memperbarui status dinas operasional kepolisian.`,
      color,
      fields: [
        { name: '👮 Nama Petugas', value: `**${officerName}** (\`${badge}\`)`, inline: true },
        { name: '🎖️ Pangkat', value: `\`${rank}\``, inline: true },
        { name: '⚡ Status', value: `**${statusText}**`, inline: true },
        { name: '📻 Callsign Unit', value: callsign ? `\`${callsign}\`` : '`STANDAR PATROL`', inline: true },
        { name: '🕒 Waktu Log', value: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB', inline: true }
      ],
      footer: { text: 'Tercatat otomatis di Mobile Data Computer' },
      timestamp: new Date().toISOString()
    };

    if (this.serverConfig.dutyChannelId && this.serverConfig.dutyChannelId !== currentChannelId) {
      this.sendChannelMessage(this.serverConfig.dutyChannelId, { embeds: [embed] }).catch(() => {});
    }

    return embed;
  }

  public generateWaranEmbed() {
    return {
      author: { name: 'Divisi Kehakiman & Surat Perintah • HSPD', icon_url: 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png' },
      title: '⚖️ DAFTAR SURAT PERINTAH PENANGKAPAN AKTIF (ARREST WARRANTS)',
      description: 'Daftar surat perintah resmi pengadilan High State yang mengizinkan seluruh unit kepolisian melakukan penangkapan:',
      color: 0xF59E0B,
      fields: [
        {
          name: '📄 [WARAN #WRN-8812] Viktor "Kozlov" Petrov',
          value: '• Kasus: Peredaran Senjata Api Berat Ilegal (Pasal E04 & E07)\n• Hakim Pengesah: Judge H. Sterling, S.H.\n• Batas Berlaku: 30 September 2026\n• Status: **BURONAN AKTIF (SEGERA TAHAN)**',
          inline: false
        },
        {
          name: '📄 [WARAN #WRN-8815] Tommy "Viper" Calvetti',
          value: '• Kasus: Pembegalan Kasir Bank Pedesaan (Pasal F01)\n• Hakim Pengesah: Judge R. Davis, M.H.\n• Batas Berlaku: 15 Oktober 2026\n• Status: **BURONAN AKTIF (BAHAYA TINGGI)**',
          inline: false
        }
      ],
      footer: { text: 'Setiap tersangka wajib dibacakan Hak Miranda saat penangkapan' },
      timestamp: new Date().toISOString()
    };
  }

  public generateSopEmbed(codeQuery?: string) {
    const q = (codeQuery || '').trim().toLowerCase();
    if (q) {
      const matched = TEN_CODES.find(t => t.code.toLowerCase() === q || t.code.toLowerCase().replace(/[^0-9a-z]/g, '') === q.replace(/[^0-9a-z]/g, ''));
      if (matched) {
        return {
          author: { name: 'Buku Saku Kode Radio Polisi (10-Codes)', icon_url: 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png' },
          title: `📻 Kode Radio: ${matched.code}`,
          color: 0x00A8FF,
          fields: [
            { name: '📖 Arti / Definisi', value: `**${matched.meaning}**`, inline: false },
            { name: '💬 Contoh Penggunaan di Radio', value: `\`"${matched.example || matched.meaning}"\``, inline: false }
          ],
          footer: { text: 'SOP Standar Komunikasi Radio Kepolisian HSPD' }
        };
      }
    }

    const topCodes = [
      '`10-4`  • Dimengerti / Pesan diterima (Roger / Copy)',
      '`10-8`  • Sedang bertugas di lapangan / Di lokasi kejadian',
      '`10-20` • Menanyakan atau mengabarkan lokasi saat ini',
      '`10-33` • Panggilan darurat / Petugas butuh bantuan darurat',
      '`10-55` • Traffic stop rutin (pemeriksaan kendaraan)',
      '`10-57 VICTOR` • Pengejaran kendaraan bermotor aktif',
      '`10-99` • Penugasan selesai / Siaga untuk panggilan baru',
      '`CODE 0` • OFFICER DOWN! Situasi darurat maksimum'
    ].join('\n');

    return {
      author: { name: 'Buku Saku Kode Radio & Taktis Polisi', icon_url: 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png' },
      title: '📻 10-CODES & PROTOKOL KOMUNIKASI RADIO KEPOLISIAN',
      description: 'Gunakan kode radio resmi berikut untuk efisiensi komunikasi di frekuensi kepolisian:\n\n' + topCodes,
      color: 0x00A8FF,
      fields: [
        { name: '📻 Frekuensi Radio Utama', value: '• **1111** : Radio Markas Pusat (HQ Main Frequency)\n• **1112** : Situasi Perampokan ATM\n• **1113** : Bank Pedesaan (Rural Bank)\n• **1114** : Bank Besar (Central Bank & SWAT)', inline: false }
      ],
      footer: { text: 'Ketik /sop kode:<kode> (misal: /sop kode:10-4) untuk arti kode spesifik' }
    };
  }

  /**
   * Menghasilkan respon embed dan komponen interaktif untuk penautan akun MDT (/mdt & !mdt)
   */
  public async generateMdtLinkResponse(
    discordUser: DiscordUserContext,
    params?: { aksi?: string; petugas?: string; pin?: string }
  ): Promise<{ embeds: any[]; components?: any[] }> {
    const aksi = (params?.aksi || '').toLowerCase().trim();
    const identifier = (params?.petugas || '').trim();
    const pin = (params?.pin || '').trim();

    // 1. Aksi PUTUS TAUTAN
    if (aksi === 'putus' || aksi === 'unlink' || aksi === 'lepas') {
      const unlinkRes = await discordRosterService.unlinkOfficerFromDiscordUser(discordUser.id);
      return {
        embeds: [
          {
            author: {
              name: 'Mobile Data Computer • Sistem Penautan Akun HSPD',
              icon_url: 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png'
            },
            title: unlinkRes.success ? '🔓 Tautan Akun Berhasil Diputus' : '⚠️ Tidak Ada Akun Tertaut',
            description: unlinkRes.message,
            color: unlinkRes.success ? 0xF59E0B : 0xEF4444,
            footer: { text: 'High State Police Department • MDT Account Binding' },
            timestamp: new Date().toISOString()
          }
        ],
        components: [
          {
            type: 1,
            components: [
              {
                type: 2,
                custom_id: 'mdt_btn_open_link_modal',
                label: 'Tautkan Akun Petugas Baru',
                style: 1,
                emoji: { name: '🔗' }
              }
            ]
          }
        ]
      };
    }

    // 2. Aksi TAUTKAN AKUN dengan kredensial yang diberikan
    if (identifier && pin) {
      const linkRes = await discordRosterService.linkOfficerToDiscordUser({
        identifier,
        pin,
        discordUser
      });

      if (linkRes.success && linkRes.officer) {
        const off = linkRes.officer;
        return {
          embeds: [
            {
              author: {
                name: 'Mobile Data Computer • Sistem Penautan Akun HSPD',
                icon_url: 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png'
              },
              title: '✅ AKUN MDT BERHASIL DITAUTKAN!',
              description: `Selamat <@${discordUser.id}>, akun Discord Anda **resmi terhubung** dengan akun login petugas kepolisian di database MDT HSPD.\n\nSekarang Anda dapat menggunakan perintah \`/duty\`, \`/roster\`, serta menerima laporan investigasi & dispatch kepolisian secara langsung.`,
              color: 0x10B981,
              fields: [
                { name: '👤 Nama Petugas (IC)', value: `**${off.name}**`, inline: true },
                { name: '🎖️ Nomor Lencana', value: `\`#${off.badge}\``, inline: true },
                { name: '⭐ Pangkat Dinas', value: `\`${off.rank}\``, inline: true },
                { name: '🏢 Divisi Penugasan', value: `\`${off.division || 'Patrol Division'}\``, inline: true },
                { name: '📡 Status Dinas', value: `\`${off.isDuty ? (off.dutyStatus || '10-8 (On Duty)') : '10-7 (Off Duty)'}\``, inline: true },
                { name: '🔐 Status Tautan', value: `\`✅ TERVERIFIKASI & AKTIF\``, inline: true }
              ],
              footer: { text: 'High State Police Department • Akun Resmi Terverifikasi' },
              timestamp: new Date().toISOString()
            }
          ],
          components: [
            {
              type: 1,
              components: [
                {
                  type: 2,
                  custom_id: 'mdt_btn_open_link_modal',
                  label: 'Ganti Akun Tautan',
                  style: 2,
                  emoji: { name: '🔄' }
                },
                {
                  type: 2,
                  custom_id: 'mdt_btn_unlink_account',
                  label: 'Putuskan Tautan',
                  style: 4,
                  emoji: { name: '🔓' }
                }
              ]
            }
          ]
        };
      } else {
        return {
          embeds: [
            {
              author: {
                name: 'Mobile Data Computer • Sistem Penautan Akun HSPD',
                icon_url: 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png'
              },
              title: '❌ GAGAL MENAUTKAN AKUN PETUGAS',
              description: linkRes.message,
              color: 0xEF4444,
              fields: [
                {
                  name: '💡 Petunjuk Verifikasi',
                  value: '• Pastikan Nama Karakter IC atau Nomor Lencana sesuai dengan data Roster Dinas.\n• Pastikan 6-digit PIN login MDT sudah benar.\n• Jika belum terdaftar di Roster atau lupa PIN, hubungi atasan divisi kepolisian.',
                  inline: false
                }
              ],
              footer: { text: 'High State Police Department • Keamanan Kredensial MDT' },
              timestamp: new Date().toISOString()
            }
          ],
          components: [
            {
              type: 1,
              components: [
                {
                  type: 2,
                  custom_id: 'mdt_btn_open_link_modal',
                  label: 'Coba Tautkan Lagi',
                  style: 1,
                  emoji: { name: '🔗' }
                }
              ]
            }
          ]
        };
      }
    }

    // 3. DEFAULT: Cek Status Tautan Akun Saat Ini
    const matched = await discordRosterService.findOfficer({
      discordId: discordUser.id,
      discordUsername: discordUser.username
    });

    if (matched) {
      return {
        embeds: [
          {
            author: {
              name: 'Mobile Data Computer • Status Akun Personel HSPD',
              icon_url: 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png'
            },
            title: '🚔 STATUS AKUN MDT TERTAUT',
            description: `Halo <@${discordUser.id}>, akun Discord Anda **telah tertaut secara resmi** ke akun dinas kepolisian berikut:`,
            color: 0x00A8FF,
            fields: [
              { name: '👤 Nama Petugas (IC)', value: `**${matched.name}**`, inline: true },
              { name: '🎖️ Nomor Lencana', value: `\`#${matched.badge}\``, inline: true },
              { name: '⭐ Pangkat Dinas', value: `\`${matched.rank}\``, inline: true },
              { name: '🏢 Divisi Penugasan', value: `\`${matched.division || 'Patrol Division'}\``, inline: true },
              { name: '📡 Status Dinas', value: `\`${matched.isDuty ? (matched.dutyStatus || '10-8 (On Duty)') : '10-7 (Off Duty)'}\``, inline: true },
              { name: '🔐 Status Tautan', value: `\`✅ TERVERIFIKASI & AKTIF\``, inline: true }
            ],
            footer: { text: 'Gunakan tombol di bawah jika ingin mengganti atau memutuskan tautan akun' },
            timestamp: new Date().toISOString()
          }
        ],
        components: [
          {
            type: 1,
            components: [
              {
                type: 2,
                custom_id: 'mdt_btn_open_link_modal',
                label: 'Ganti Akun Tautan',
                style: 2,
                emoji: { name: '🔄' }
              },
              {
                type: 2,
                custom_id: 'mdt_btn_unlink_account',
                label: 'Putuskan Tautan',
                style: 4,
                emoji: { name: '🔓' }
              },
              {
                type: 2,
                custom_id: 'mdt_btn_resend_code',
                label: 'Kirim Kredensial ke DM',
                style: 1,
                emoji: { name: '📬' }
              }
            ]
          }
        ]
      };
    }

    // Belum tertaut
    return {
      embeds: [
        {
          author: {
            name: 'Mobile Data Computer • Penautan Akun Kepolisian HSPD',
            icon_url: 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png'
          },
          title: '🔗 TAUTKAN AKUN DISCORD KE AKUN LOGIN MDT',
          description: `Halo <@${discordUser.id}>, akun Discord Anda saat ini **belum ditautkan** ke akun petugas MDT Kepolisian High State.\n\nDengan menautkan akun, Anda dapat:\n• Menggunakan perintah dinas \`/duty\` & \`/roster\` langsung di Discord\n• Menerima notifikasi dispatch darurat & laporan kasus di DM\n• Login otomatis & reset PIN akun secara mandiri`,
          color: 0x3B82F6,
          fields: [
            {
              name: '📋 Cara Menautkan Akun',
              value: '1. **Klik tombol [ 🔗 Tautkan Akun Petugas ]** di bawah ini untuk mengisi formulir pop-up langsung di Discord.\n2. Atau gunakan perintah teks:\n   • Slash Command: `/mdt aksi:tautkan petugas:<nama/badge> pin:<pin>`\n   • Chat Awalan !: `!mdt link <badge> <pin>`',
              inline: false
            },
            {
              name: '⚠️ Catatan Penting',
              value: 'Pastikan Anda telah terdaftar di database Roster Kepolisian oleh atasan dan mengetahui 6-digit PIN login akun Anda.',
              inline: false
            }
          ],
          footer: { text: 'High State Police Department • Sistem Penautan Akun Resmi' },
          timestamp: new Date().toISOString()
        }
      ],
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              custom_id: 'mdt_btn_open_link_modal',
              label: 'Tautkan Akun Petugas',
              style: 1,
              emoji: { name: '🔗' }
            }
          ]
        }
      ]
    };
  }

  public generateMdtEmbed() {
    return {
      author: { name: 'Mobile Data Computer • High State Police Dept', icon_url: 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png' },
      title: '🚔 TERMINAL MOBILE DATA COMPUTER (MDT / CAD) HSPD',
      description: 'Klik tombol tautan di bawah untuk membuka sistem kepolisian langsung dari peramban (browser) Anda.',
      color: 0x00A8FF,
      fields: [
        { name: '🌐 Tautan Resmi', value: 'https://mdc-hspd-inspector.vercel.app/', inline: false },
        { name: '📱 Fitur Unggulan', value: '• Kalkulator Denda & Pasal KUHP\n• Forensik Sidik Jari & Balistik\n• Berkas Kasus Investigasi & Surat Perintah\n• Portal Transparansi Warga Sipil', inline: false }
      ],
      footer: { text: 'High State Government • Authorized Personnel Only' }
    };
  }

  public async simulateSlashCommand(cmdName: string, options: any[] = []) {
    const name = (cmdName || '').toLowerCase().replace(/^[\/!]/, '');
    let embed: any = null;
    let components: any[] | undefined = undefined;

    if (name === 'pasal' || name === 'kuhp') {
      const q = options.find((o: any) => o.name === 'query')?.value || options[0]?.value || '';
      embed = this.generatePasalEmbed(String(q));
      components = [{
        type: 1,
        components: [{
          type: 2,
          style: 5,
          label: 'Buka Web MDT',
          url: 'https://mdc-hspd-inspector.vercel.app/',
          emoji: { name: '🌐' }
        }]
      }];
    } else if (name === 'hitung' || name === 'denda' || name === 'kalkulator') {
      const p = options.find((o: any) => o.name === 'pasal')?.value || options[0]?.value || 'A01, B08';
      const d = options.find((o: any) => o.name === 'diskon')?.value || options[1]?.value || 0;
      embed = this.generateHitungEmbed(String(p), Number(d));
    } else if (name === 'bolo' || name === 'apb') {
      const q = options.find((o: any) => o.name === 'query')?.value || options[0]?.value || '';
      embed = this.generateBoloEmbed(String(q));
    } else if (name === 'lookup' || name === 'warga' || name === 'suspect') {
      const n = options.find((o: any) => o.name === 'nama')?.value || options[0]?.value || 'John Doe';
      embed = this.generateLookupEmbed(String(n));
    } else if (name === 'roster' || name === 'officer') {
      const p = options.find((o: any) => o.name === 'petugas')?.value || options[0]?.value || '';
      embed = await this.generateRosterEmbed(String(p));
    } else if (name === 'duty' || name === 'dinas') {
      const s = options.find((o: any) => o.name === 'status')?.value || '10-8';
      const c = options.find((o: any) => o.name === 'callsign')?.value || 'ADAM-01';
      embed = await this.handleDutyToggle({ id: '123456789', username: 'Officer_Sim' }, String(s), String(c));
    } else if (name === 'waran' || name === 'warrant') {
      embed = this.generateWaranEmbed();
    } else if (name === 'sop' || name === '10code' || name === '10codes') {
      const k = options.find((o: any) => o.name === 'kode')?.value || options[0]?.value || '';
      embed = this.generateSopEmbed(String(k));
    } else if (name === 'mdt') {
      const aksi = options.find((o: any) => o.name === 'aksi')?.value || '';
      const petugas = options.find((o: any) => o.name === 'petugas')?.value || '';
      const pin = options.find((o: any) => o.name === 'pin')?.value || '';
      const mockUser: DiscordUserContext = { id: '123456789', username: 'Officer_Sim' };
      const mdtRes = await this.generateMdtLinkResponse(mockUser, { aksi, petugas, pin });
      embed = mdtRes.embeds[0];
      components = mdtRes.components;
    } else if (name === 'status' || name === 'info') {
      embed = this.generateStatusEmbed();
    } else if (name === 'config' || name === 'settings') {
      embed = this.generateConfigEmbed();
    } else if (name === 'help' || name === 'bantuan') {
      embed = this.generateHelpEmbed('user');
    } else {
      embed = this.generateHelpEmbed('user');
    }

    return {
      command: `/${name}`,
      embeds: [embed],
      components
    };
  }

  public async broadcastQuickUpdate(params: {
    type: 'fitur' | 'peningkatan' | 'bugfix' | 'umum';
    content: string;
    channelId?: string;
    authorName?: string;
    authorBadge?: string;
    authorId?: string;
  }): Promise<{ success: boolean; message: string; channelId?: string }> {
    const targetChannelId = params.channelId || this.serverConfig.changelogChannelId;
    if (!targetChannelId) {
      return { success: false, message: 'Channel pengumuman belum diatur! Ketik !hspd setchannel update #channel atau /hspd setchannel update #channel terlebih dahulu.' };
    }

    const mention = (this.serverConfig.changelogMentionRole && this.serverConfig.changelogMentionRole !== 'none') 
      ? `${this.serverConfig.changelogMentionRole} ` 
      : '';

    let embedTitle = '📢 [PEMBARUAN RESMI] SISTEM MDT HSPD';
    let embedColor = 0x00A8FF;
    let categoryName = 'Pembaruan Sistem';

    if (params.type === 'fitur') {
      embedTitle = '🚀 [FITUR BARU] PEMBARUAN SISTEM MDT HSPD';
      embedColor = 0x10B981; // Emerald Green
      categoryName = '🚀 Fitur Baru (New Features)';
    } else if (params.type === 'peningkatan') {
      embedTitle = '⚡ [PENINGKATAN] OPTIMALISASI SISTEM MDT HSPD';
      embedColor = 0xF59E0B; // Amber Gold
      categoryName = '⚡ Peningkatan Sistem (Improvements)';
    } else if (params.type === 'bugfix') {
      embedTitle = '🛠️ [PERBAIKAN BUG] PEMBENAHAN SISTEM MDT HSPD';
      embedColor = 0xEF4444; // Crimson Red
      categoryName = '🛠️ Perbaikan Bug (Bug Fixes)';
    }

    const now = new Date();
    const dateFormatted = now.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const updateEmbed = {
      author: {
        name: 'High State Police Department • Mobile Data Computer (MDT)',
        icon_url: 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png'
      },
      title: embedTitle,
      description: `Pemberitahuan resmi mengenai pembaruan sistem dan operasional kepolisian telah dipublikasikan pada **${dateFormatted} WIB**.`,
      color: embedColor,
      fields: [
        {
          name: `📌 Kategori: ${categoryName}`,
          value: params.content,
          inline: false
        },
        {
          name: '👤 Dipublikasikan Oleh',
          value: params.authorName ? `\`${params.authorName}\`${params.authorBadge ? ` (Badge: #${params.authorBadge})` : ''}` : (params.authorId ? `<@${params.authorId}>` : '`High Command Police`'),
          inline: true
        },
        {
          name: '📡 Status Sistem',
          value: '`AKTIF & TERSINKRONISASI` 🟢',
          inline: true
        }
      ],
      footer: {
        text: 'High State Police Department • Terminal Mobile Data Computer',
        icon_url: 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png'
      },
      timestamp: now.toISOString()
    };

    const postPayload = {
      content: mention ? `${mention}**[ PENGUMUMAN SISTEM MDT HSPD ]**` : undefined,
      embeds: [updateEmbed]
    };

    const res = await this.sendChannelMessage(targetChannelId, postPayload);
    if (!res.success) {
      return { success: false, message: res.error || 'Gagal mengirim pesan Discord' };
    }
    return { success: true, message: 'Berhasil dipublikasikan!', channelId: targetChannelId };
  }

  public async registerSlashCommands(targetGuildId?: string) {
    const token = this.token || process.env.DISCORD_BOT_TOKEN;
    const botId = this.state.botUser?.id;
    if (!token || !botId) return;

    try {
      const commands = DISCORD_SLASH_COMMANDS;

      // If targetGuildId provided, register guild-specific commands for immediate instant update
      const endpoints: string[] = [];
      if (targetGuildId) {
        endpoints.push(`https://discord.com/api/v10/applications/${botId}/guilds/${targetGuildId}/commands`);
      }
      // Global registration
      endpoints.push(`https://discord.com/api/v10/applications/${botId}/commands`);

      for (const endpoint of endpoints) {
        const res = await fetch(endpoint, {
          method: 'PUT',
          headers: {
            Authorization: `Bot ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(commands)
        });

        if (res.ok) {
          console.log(`[Discord Gateway] ✅ Slash commands successfully registered to ${endpoint.includes('guilds') ? 'guild ' + targetGuildId : 'global'}`);
        } else {
          const text = await res.text().catch(() => '');
          console.warn(`[Discord Gateway] Warning registering slash commands (${res.status}):`, text);
        }
      }
    } catch (e: any) {
      console.warn('[Discord Gateway] Failed registering slash commands:', e?.message || e);
    }
  }

  private async handleSlashCommandInteraction(data: any, sendCallback: (payload: any) => Promise<void>, discordUser: DiscordUserContext) {
    try {
      const cmdName = (data.data?.name || '').toLowerCase();
      const options = data.data?.options || [];
      const currentChannelId = data.channel_id;

      // Determine permissions
      const perms = BigInt(data.member?.permissions || '0');
      const isAdmin = (perms & BigInt(0x8)) !== BigInt(0) || // ADMINISTRATOR
                      (perms & BigInt(0x20)) !== BigInt(0) || // MANAGE_GUILD
                      (perms & BigInt(0x10)) !== BigInt(0); // MANAGE_CHANNELS

      let isOfficerAtasan = false;
      let matchedOfficer: any = null;
      try {
        matchedOfficer = await discordRosterService.findOfficer({ discordId: discordUser.id, discordUsername: discordUser.username });
        if (matchedOfficer) {
          const r = (matchedOfficer.rank || '').toUpperCase();
          if (r.includes('CHIEF') || r.includes('COMMANDER') || r.includes('CAPTAIN') || r.includes('LIEUTENANT') || r.includes('SERGEANT') || r.includes('ATASAN')) {
            isOfficerAtasan = true;
          }
        }
      } catch {}

      const canConfigure = isAdmin || isOfficerAtasan;

      // Subcommand inside /hspd (e.g. /hspd help, /hspd update, etc.)
      const subCmd = options[0]?.type === 1 ? options[0].name.toLowerCase() : null;
      const effectiveCmd = subCmd || cmdName;
      const effectiveOptions = subCmd ? (options[0].options || []) : options;

      // 1. HELP (/help or /hspd help)
      if (effectiveCmd === 'help' || effectiveCmd === 'cmd' || effectiveCmd === 'bantuan') {
        return await sendCallback({
          type: 4,
          data: {
            embeds: [this.generateHelpEmbed(discordUser.id)]
          }
        });
      }

      // 2. STATUS (/status or /hspd status)
      if (effectiveCmd === 'status' || effectiveCmd === 'info') {
        return await sendCallback({
          type: 4,
          data: {
            embeds: [this.generateStatusEmbed()]
          }
        });
      }

      // 3. CONFIG (/config or /hspd config)
      if (effectiveCmd === 'config' || effectiveCmd === 'settings' || effectiveCmd === 'setting') {
        return await sendCallback({
          type: 4,
          data: {
            embeds: [this.generateConfigEmbed()]
          }
        });
      }

      // 4. RELEASE (/release or /hspd release)
      if (effectiveCmd === 'release') {
        return await sendCallback({
          type: 4,
          data: {
            embeds: [this.generateReleaseTemplateEmbed()]
          }
        });
      }

      // 5. TEST (/test or /hspd test)
      if (effectiveCmd === 'test') {
        const targetChannelId = this.serverConfig.changelogChannelId || currentChannelId;
        const testRes = await this.sendChannelMessage(targetChannelId, {
          embeds: [{
            author: {
              name: 'Uji Coba Penyiaran Bot MDT HSPD',
              icon_url: 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png'
            },
            title: '🧪 TES PENGIRIMAN PENGUMUMAN BERHASIL!',
            description: `Pesan uji coba ini dikirim oleh <@${discordUser.id}> via Slash Command \`/${cmdName}\`.\n\nJalur pengumuman bot di channel <#${targetChannelId}> aktif dan siap digunakan!`,
            color: 0x10B981,
            fields: [
              { name: '📡 Status Bot', value: '`ONLINE 24/7` 🟢', inline: true },
              { name: '📍 Channel Tujuan', value: `<#${targetChannelId}>`, inline: true },
              { name: '⚡ Mode Perintah', value: '`Slash (/) & Prefix (!)`', inline: true }
            ],
            footer: {
              text: 'High State Police Department • System Release Center'
            },
            timestamp: new Date().toISOString()
          }]
        });

        return await sendCallback({
          type: 4,
          data: {
            flags: 64, // Ephemeral
            content: testRes.success 
              ? `✅ Pesan uji coba berhasil dikirim ke channel <#${targetChannelId}>!` 
              : `❌ Gagal mengirim pesan uji coba: ${testRes.error}`
          }
        });
      }

      // 6. SETCHANNEL (/hspd setchannel)
      if (effectiveCmd === 'setchannel') {
        if (!canConfigure) {
          return await sendCallback({
            type: 4,
            data: {
              flags: 64,
              embeds: [{
                title: '⛔ Akses Ditolak',
                description: 'Anda memerlukan izin **Administrator** atau pangkat **Atasan Kepolisian** untuk mengubah channel penyiaran.',
                color: 0xEF4444
              }]
            }
          });
        }

        const targetType = effectiveOptions.find((o: any) => o.name === 'jenis')?.value || '';
        const targetChannelId = effectiveOptions.find((o: any) => o.name === 'channel')?.value || '';

        let typeLabel = '';
        if (targetType === 'update') {
          this.updateServerConfig({ changelogChannelId: targetChannelId, updatedBy: `${discordUser.username} (${discordUser.id})` });
          typeLabel = 'Pengumuman Pembaruan & Changelog';
        } else if (targetType === 'duty') {
          this.updateServerConfig({ dutyChannelId: targetChannelId, updatedBy: `${discordUser.username} (${discordUser.id})` });
          typeLabel = 'Absensi Dinas (Duty Log)';
        } else if (targetType === 'roster') {
          this.updateServerConfig({ rosterChannelId: targetChannelId, updatedBy: `${discordUser.username} (${discordUser.id})` });
          typeLabel = 'Roster & Mutasi Personel';
        } else if (targetType === 'case') {
          this.updateServerConfig({ caseChannelId: targetChannelId, updatedBy: `${discordUser.username} (${discordUser.id})` });
          typeLabel = 'Investigasi & Berkas Kasus';
        }

        return await sendCallback({
          type: 4,
          data: {
            embeds: [{
              author: {
                name: 'Pengaturan Bot Diperbarui',
                icon_url: 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png'
              },
              title: '✅ Channel Berhasil Ditetapkan!',
              description: `Channel untuk **${typeLabel}** telah berhasil disetel ke <#${targetChannelId}>.`,
              color: 0x10B981,
              fields: [
                { name: '📍 Target Channel', value: `<#${targetChannelId}> (\`${targetChannelId}\`)`, inline: true },
                { name: '👤 Diperbarui Oleh', value: `<@${discordUser.id}>`, inline: true }
              ],
              footer: {
                text: 'High State Police Department • Bot Configuration'
              },
              timestamp: new Date().toISOString()
            }]
          }
        });
      }

      // 7. SETPING (/hspd setping)
      if (effectiveCmd === 'setping') {
        if (!canConfigure) {
          return await sendCallback({
            type: 4,
            data: {
              flags: 64,
              embeds: [{
                title: '⛔ Akses Ditolak',
                description: 'Anda memerlukan izin Administrator atau Atasan untuk mengubah mention ping.',
                color: 0xEF4444
              }]
            }
          });
        }

        let roleVal = (effectiveOptions.find((o: any) => o.name === 'mention')?.value || '').trim();
        if (roleVal.toLowerCase() === 'off' || roleVal.toLowerCase() === 'none' || roleVal.toLowerCase() === 'disable') {
          roleVal = 'none';
        }

        this.updateServerConfig({
          changelogMentionRole: roleVal,
          updatedBy: `${discordUser.username} (${discordUser.id})`
        });

        return await sendCallback({
          type: 4,
          data: {
            embeds: [{
              title: '✅ Mention Ping Berhasil Diubah!',
              description: `Pengaturan mention untuk rilis pembaruan kini disetel ke: \`${roleVal}\``,
              color: 0x10B981
            }]
          }
        });
      }

      // 8. UPDATE (/update or /hspd update)
      if (effectiveCmd === 'update' || effectiveCmd === 'fitur' || effectiveCmd === 'peningkatan' || effectiveCmd === 'bugfix') {
        if (!canConfigure) {
          return await sendCallback({
            type: 4,
            data: {
              flags: 64,
              embeds: [{
                title: '⛔ Akses Ditolak',
                description: 'Hanya personel dengan hak **Administrator** atau jajaran **Atasan Kepolisian** yang dapat mempublikasikan pembaruan resmi.',
                color: 0xEF4444
              }]
            }
          });
        }

        const kat = effectiveOptions.find((o: any) => o.name === 'kategori')?.value || (effectiveCmd !== 'update' ? effectiveCmd : 'fitur');
        const msg = effectiveOptions.find((o: any) => o.name === 'pesan')?.value || '';

        if (!msg || msg.trim().length < 3) {
          return await sendCallback({
            type: 4,
            data: {
              flags: 64,
              content: '❌ **Isi Pesan Kosong:** Harap masukkan rincian pembaruan yang ingin dipublikasikan.'
            }
          });
        }

        const targetChannelId = this.serverConfig.changelogChannelId || currentChannelId;
        const pubRes = await this.broadcastQuickUpdate({
          type: kat as any,
          content: msg.trim(),
          channelId: targetChannelId,
          authorName: matchedOfficer?.name || discordUser.username,
          authorBadge: matchedOfficer?.badge,
          authorId: discordUser.id
        });

        return await sendCallback({
          type: 4,
          data: {
            flags: 64,
            content: pubRes.success 
              ? `✅ Pembaruan sistem berhasil dipublikasikan ke <#${targetChannelId}>!` 
              : `❌ Gagal publikasi: ${pubRes.message}`
          }
        });
      }

      // 9. PASAL & KUHP (/pasal or /kuhp)
      if (effectiveCmd === 'pasal' || effectiveCmd === 'kuhp') {
        const query = (effectiveOptions.find((o: any) => o.name === 'query')?.value || '').trim();
        const embed = this.generatePasalEmbed(query);
        return await sendCallback({
          type: 4,
          data: {
            embeds: [embed],
            components: [
              {
                type: 1,
                components: [
                  {
                    type: 2,
                    style: 5,
                    label: 'Buka Web MDT',
                    url: 'https://mdc-hspd-inspector.vercel.app/',
                    emoji: { name: '🌐' }
                  }
                ]
              }
            ]
          }
        });
      }

      // 10. HITUNG & DENDA (/hitung or /denda)
      if (effectiveCmd === 'hitung' || effectiveCmd === 'denda' || effectiveCmd === 'kalkulator') {
        const p = (effectiveOptions.find((o: any) => o.name === 'pasal')?.value || '').trim();
        const d = Number(effectiveOptions.find((o: any) => o.name === 'diskon')?.value) || 0;
        const embed = this.generateHitungEmbed(p, d);
        return await sendCallback({
          type: 4,
          data: {
            embeds: [embed],
            components: [
              {
                type: 1,
                components: [
                  {
                    type: 2,
                    style: 5,
                    label: 'Kalkulator Web MDT',
                    url: 'https://mdc-hspd-inspector.vercel.app/',
                    emoji: { name: '⚖️' }
                  }
                ]
              }
            ]
          }
        });
      }

      // 11. BOLO / APB (/bolo or /apb)
      if (effectiveCmd === 'bolo' || effectiveCmd === 'apb') {
        const q = (effectiveOptions.find((o: any) => o.name === 'query')?.value || '').trim();
        const embed = this.generateBoloEmbed(q);
        return await sendCallback({
          type: 4,
          data: {
            embeds: [embed]
          }
        });
      }

      // 12. LOOKUP / WARGA (/lookup, /warga, /suspect)
      if (effectiveCmd === 'lookup' || effectiveCmd === 'warga' || effectiveCmd === 'suspect') {
        const n = (effectiveOptions.find((o: any) => o.name === 'nama')?.value || discordUser.username).trim();
        const embed = this.generateLookupEmbed(n);
        return await sendCallback({
          type: 4,
          data: {
            embeds: [embed]
          }
        });
      }

      // 13. ROSTER / OFFICER (/roster or /officer)
      if (effectiveCmd === 'roster' || effectiveCmd === 'officer') {
        const p = (effectiveOptions.find((o: any) => o.name === 'petugas')?.value || '').trim();
        const embed = await this.generateRosterEmbed(p);
        return await sendCallback({
          type: 4,
          data: {
            embeds: [embed]
          }
        });
      }

      // 14. DUTY / DINAS (/duty or /dinas)
      if (effectiveCmd === 'duty' || effectiveCmd === 'dinas') {
        const s = (effectiveOptions.find((o: any) => o.name === 'status')?.value || '10-8').trim();
        const c = (effectiveOptions.find((o: any) => o.name === 'callsign')?.value || '').trim();
        const embed = await this.handleDutyToggle(discordUser, s, c, currentChannelId);
        return await sendCallback({
          type: 4,
          data: {
            embeds: [embed]
          }
        });
      }

      // 15. WARAN / WARRANT (/waran or /warrant)
      if (effectiveCmd === 'waran' || effectiveCmd === 'warrant') {
        const embed = this.generateWaranEmbed();
        return await sendCallback({
          type: 4,
          data: {
            embeds: [embed]
          }
        });
      }

      // 16. SOP / 10-CODES (/sop, /10code)
      if (effectiveCmd === 'sop' || effectiveCmd === '10code' || effectiveCmd === '10codes') {
        const k = (effectiveOptions.find((o: any) => o.name === 'kode')?.value || '').trim();
        const embed = this.generateSopEmbed(k);
        return await sendCallback({
          type: 4,
          data: {
            embeds: [embed]
          }
        });
      }

      // 17. MDT LINK & ACCOUNT BINDING (/mdt)
      if (effectiveCmd === 'mdt') {
        const aksi = (effectiveOptions.find((o: any) => o.name === 'aksi')?.value || '').trim();
        const petugas = (effectiveOptions.find((o: any) => o.name === 'petugas')?.value || '').trim();
        const pin = (effectiveOptions.find((o: any) => o.name === 'pin')?.value || '').trim();

        const response = await this.generateMdtLinkResponse(discordUser, { aksi, petugas, pin });
        return await sendCallback({
          type: 4,
          data: {
            embeds: response.embeds,
            components: response.components
          }
        });
      }

      // Default fallback
      return await sendCallback({
        type: 4,
        data: {
          embeds: [this.generateHelpEmbed(discordUser.id)]
        }
      });
    } catch (err: any) {
      console.error('[Discord Gateway] Error in handleSlashCommandInteraction:', err);
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
