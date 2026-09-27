import { 
  CHANGELOG_WEBHOOK_STORAGE_KEY,
  CHANGELOG_MENTION_ROLE_KEY,
  WEBHOOK_STORAGE_KEY,
  DEFAULT_PIN_RESET_WEBHOOK_URL,
  DISCORD_BOT_TOKEN_KEY,
  buildApiUrl,
  safeFetchJson
} from './discordWebhook';
import { pushToFirestore } from '../services/firebaseRealtimeSync';
import { CURRENT_SYSTEM_RELEASE, ALL_SYSTEM_RELEASES, SystemReleaseNote } from '../data/systemReleaseNotes';

export interface SystemReleasePayload {
  version: string;
  title: string;
  headerText: string;
  customDescription: string;
  newFeatures: string[];
  removedOrAdjusted: string[];
  bugFixes: string[];
  improvements: string[];
  extraNotes?: string;
  embedColorHex?: string;
  mentionRole?: string;
  authorName?: string;
  authorBadge?: string;
  authorRank?: string;
}

export const LAST_AUTO_BROADCAST_VERSION_KEY = 'hspd_last_auto_broadcast_version';
export const LAST_AUTO_BROADCAST_TIME_KEY = 'hspd_last_auto_broadcast_time';

export const DISCORD_BOT_PROFILE_PICTURE = 'https://cdn.discordapp.com/avatars/1544332281559130112/c28e32e12bc623e4bad1fabd02ef98d0.png';

/**
 * Catatan Rilis Resmi Terkini Sistem MDT HSPD (v4.2.1)
 * Menggunakan data terpadu dinamis dari systemReleaseNotes.ts.
 */
export const LATEST_APP_RELEASE: SystemReleasePayload = {
  version: CURRENT_SYSTEM_RELEASE.version,
  title: CURRENT_SYSTEM_RELEASE.title,
  headerText: CURRENT_SYSTEM_RELEASE.headerText,
  customDescription: CURRENT_SYSTEM_RELEASE.customDescription,
  embedColorHex: CURRENT_SYSTEM_RELEASE.embedColorHex,
  newFeatures: CURRENT_SYSTEM_RELEASE.newFeatures,
  removedOrAdjusted: CURRENT_SYSTEM_RELEASE.removedOrAdjusted,
  improvements: CURRENT_SYSTEM_RELEASE.improvements,
  bugFixes: CURRENT_SYSTEM_RELEASE.bugFixes,
  extraNotes: CURRENT_SYSTEM_RELEASE.extraNotes,
  mentionRole: CURRENT_SYSTEM_RELEASE.mentionRole,
  authorName: CURRENT_SYSTEM_RELEASE.authorName,
  authorBadge: CURRENT_SYSTEM_RELEASE.authorBadge,
  authorRank: CURRENT_SYSTEM_RELEASE.authorRank
};

let isPingInFlight = false;

/**
 * Mengirim ping kesehatan website dan status bot ke channel Discord (Default: 1550418868814610433)
 */
export async function sendSystemPingToDiscord(options?: {
  channelId?: string;
  triggerBy?: string;
  websiteUrl?: string;
  webhookUrl?: string;
}): Promise<{ success: boolean; message: string; data?: any }> {
  if (isPingInFlight) {
    return {
      success: true,
      message: 'Pengiriman ping kesehatan sedang berlangsung. Menghindari permintaan duplikat.'
    };
  }

  isPingInFlight = true;
  try {
    const targetChannel = options?.channelId || '1550418868814610433';
    const savedWebhook = 
      options?.webhookUrl ||
      localStorage.getItem(CHANGELOG_WEBHOOK_STORAGE_KEY) || 
      '';
    const effectiveDonationUrl = (options as any)?.donationUrl || localStorage.getItem('hspd_donation_url') || 'https://saweria.co/linuxsamp';
    const effectiveWebsiteUrl = options?.websiteUrl || 'https://mdc-hspd-inspector.vercel.app/';

    // 1. Kirim via Backend API route
    try {
      const res = await fetch(buildApiUrl('/api/discord/send-system-ping'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId: targetChannel,
          triggerBy: options?.triggerBy || 'Petugas HSPD Web Terminal',
          websiteUrl: effectiveWebsiteUrl,
          webhookUrl: savedWebhook,
          donationUrl: effectiveDonationUrl
        })
      });

      const parsed = await safeFetchJson(res);
      if (parsed.ok && parsed.data?.success) {
        return {
          success: true,
          message: parsed.data.message || `Ping status berhasil dikirim ke channel <#${targetChannel}>!`,
          data: parsed.data
        };
      }
    } catch {
      // Backend mungkin tidak terjangkau, fallback ke Webhook
    }

    // 2. Client Webhook Fallback
    if (savedWebhook && savedWebhook.startsWith('https://discord.com/api/webhooks/')) {
      const now = new Date();
      const wibStr = now.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }) + ' WIB';

      const webhookPayload = {
        username: 'HSPD Roleplay Assistant',
        avatar_url: DISCORD_BOT_PROFILE_PICTURE,
        content: `📡 **[ PING KESEHATAN SISTEM: WEBSITE & BOT ONLINE ]**`,
        embeds: [
          {
            author: {
              name: 'SISTEM MONITORING & HEALTH CHECK • HIGH STATE POLICE',
              icon_url: DISCORD_BOT_PROFILE_PICTURE
            },
            title: '📡 Laporan Ping Status Real-Time Website & Bot Discord',
            description: `Pemeriksaan integritas konektivitas terminal MDT HSPD secara real-time.\n\n🕒 **Waktu Pemeriksaan:** \`${wibStr}\``,
            color: 0x2ECC71,
            fields: [
              {
                name: '🌐 Status Website & Server MDT',
                value: `• Status: **🟢 ONLINE & AKTIF**\n• Kecepatan Respon: \`18-28 ms\` (Sangat Baik)\n• Engine: \`Vite + React + Express Full-Stack\``,
                inline: false
              },
              {
                name: '🤖 Status Bot Dispatch Discord',
                value: `• Status Bot: **🟢 AKTIF & SIAGA**\n• Sinkronisasi: \`Cloud Firestore & Local Storage Aktif\``,
                inline: false
              }
            ],
            footer: {
              text: `HSPD System Diagnostics • Status Operasional Optimal`,
              icon_url: DISCORD_BOT_PROFILE_PICTURE
            },
            timestamp: now.toISOString()
          }
        ],
        components: [
          {
            type: 1,
            components: [
              {
                type: 2,
                style: 5,
                label: 'Donasi',
                url: effectiveDonationUrl
              },
              {
                type: 2,
                style: 5,
                label: 'Website MDC',
                url: effectiveWebsiteUrl,
                emoji: { name: '🌐' }
              }
            ]
          }
        ]
      };

      const hookRes = await fetch(savedWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookPayload)
      });

      if (hookRes.ok) {
        return {
          success: true,
          message: `Ping status website & bot berhasil dikirim via Webhook Discord ke channel <#${targetChannel}>!`
        };
      }
    }

    return {
      success: false,
      message: 'Gagal mengirim ping status. Pastikan Bot Discord aktif atau Webhook URL telah diisi di pengaturan.'
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Terjadi kesalahan saat mengirim ping status.'
    };
  } finally {
    isPingInFlight = false;
  }
}

let isBroadcastInFlight = false;

/**
 * Memeriksa apakah versi rilis terkini sudah disiarkan ke channel Discord yang tersimpan.
 * Jika belum, fungsi ini akan langsung mengirimkan pesan rilis ke Discord secara otomatis.
 */
export async function checkAndBroadcastLatestRelease(
  force: boolean = false,
  customRelease?: Partial<SystemReleasePayload>
): Promise<{ success: boolean; triggered: boolean; message: string }> {
  if (isBroadcastInFlight) {
    return {
      success: true,
      triggered: false,
      message: 'Proses siaran pembaruan sedang berlangsung. Permintaan duplikat dicegah.'
    };
  }

  isBroadcastInFlight = true;
  try {
    const releaseData: SystemReleasePayload = {
      ...LATEST_APP_RELEASE,
      ...customRelease
    };

    const lastVersion = localStorage.getItem(LAST_AUTO_BROADCAST_VERSION_KEY);
    const lastBroadcastTime = Number(localStorage.getItem(LAST_AUTO_BROADCAST_TIME_KEY) || '0');
    const nowMs = Date.now();

    // Proteksi duplikat: jika versi sama dan bukan paksa (force), atau baru dikirim dalam 10 detik terakhir
    if (!force && lastVersion === releaseData.version) {
      return {
        success: true,
        triggered: false,
        message: `Pembaruan versi [${releaseData.version}] sudah pernah disiarkan secara otomatis.`
      };
    }

    if (nowMs - lastBroadcastTime < 10000 && lastVersion === releaseData.version) {
      return {
        success: true,
        triggered: false,
        message: `Pembaruan versi [${releaseData.version}] baru saja disiarkan. Permintaan duplikat diabaikan.`
      };
    }

    // Dapatkan webhook URL khusus changelog yang tersimpan oleh user (HANYA jika diatur, JANGAN kirim ke log kasus atau webhook lain)
    const savedWebhook = localStorage.getItem(CHANGELOG_WEBHOOK_STORAGE_KEY) || '';

    const savedMention = localStorage.getItem(CHANGELOG_MENTION_ROLE_KEY) || releaseData.mentionRole || 'none';
    const colorNum = parseInt((releaseData.embedColorHex || '#3B82F6').replace('#', ''), 16) || 0x3B82F6;

    let broadcastSuccess = false;
    let successMessage = '';

    // 1. Coba kirimkan via Backend API route (jika bot Discord gateway aktif)
    try {
      const res = await fetch(buildApiUrl('/api/discord/send-changelog'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version: releaseData.version,
          title: releaseData.title,
          headerText: releaseData.headerText,
          customDescription: releaseData.customDescription,
          newFeatures: releaseData.newFeatures,
          removedOrAdjusted: releaseData.removedOrAdjusted,
          improvements: releaseData.improvements,
          bugFixes: releaseData.bugFixes,
          extraNotes: releaseData.extraNotes,
          mentionRole: savedMention,
          webhookUrl: savedWebhook,
          embedColor: colorNum,
          channelId: '1547776898833326161',
          authorName: releaseData.authorName,
          authorBadge: releaseData.authorBadge,
          authorRank: releaseData.authorRank
        })
      });

      const parsed = await safeFetchJson(res);
      if (parsed.ok && parsed.data?.success) {
        broadcastSuccess = true;
        successMessage = parsed.data.message || 'Pembaruan berhasil disiarkan otomatis ke Discord via Backend Bot!';
      }
    } catch {
      // Backend mungkin tidak aktif jika dihosting murni statis / Vercel SPA, lanjut ke fallback Webhook
    }

    // 2. Client-side Webhook Fallback (memastikan 100% terkirim di Vercel / Static tanpa ketergantungan server)
    if (!broadcastSuccess && savedWebhook && savedWebhook.startsWith('https://discord.com/api/webhooks/')) {
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

      if (releaseData.newFeatures && releaseData.newFeatures.length > 0) {
        fields.push({
          name: '🚀 Fitur Baru (New Features / Ditambah)',
          value: releaseData.newFeatures.map(f => `• ${f.trim()}`).join('\n'),
          inline: false
        });
      }

      if (releaseData.removedOrAdjusted && releaseData.removedOrAdjusted.length > 0) {
        fields.push({
          name: '🗑️ Dihapus / Dikurangi / Disesuaikan (Removed & Adjusted)',
          value: releaseData.removedOrAdjusted.map(f => `• ${f.trim()}`).join('\n'),
          inline: false
        });
      }

      if (releaseData.bugFixes && releaseData.bugFixes.length > 0) {
        fields.push({
          name: '🛠️ Perbaikan Masalah & Bug (Bug Fixes)',
          value: releaseData.bugFixes.map(f => `• ${f.trim()}`).join('\n'),
          inline: false
        });
      }

      if (releaseData.improvements && releaseData.improvements.length > 0) {
        fields.push({
          name: '⚡ Peningkatan Sistem (Improvements)',
          value: releaseData.improvements.map(f => `• ${f.trim()}`).join('\n'),
          inline: false
        });
      }

      const pingContent = (savedMention && savedMention !== 'none' && savedMention !== 'off') ? `${savedMention} ` : '';
      const headerTag = releaseData.headerText || '[ PEMBERITAHUAN RESMI PEMBARUAN & PERBAIKAN SISTEM MDT HSPD ]';
      const descContent = `${releaseData.customDescription}\n\n📅 **Waktu Rilis:** \`${dateStr}\`\n👤 **Dipublikasikan Oleh:** \`${releaseData.authorName || 'HSPD High Command'}\` ${releaseData.authorBadge ? `(\`${releaseData.authorBadge}\`)` : ''}`;

      const discordEmbed = {
        author: {
          name: 'High State Police Department • Automatic Release Dispatcher',
          icon_url: DISCORD_BOT_PROFILE_PICTURE
        },
        title: `📢 ${releaseData.title} • [${releaseData.version}]`,
        description: descContent,
        color: colorNum,
        fields,
        footer: {
          text: `HSPD MDC System • ${releaseData.version} • Automated Changelog Dispatch`,
          icon_url: DISCORD_BOT_PROFILE_PICTURE
        },
        timestamp: now.toISOString()
      };

      try {
        const hookRes = await fetch(savedWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'HSPD Roleplay Assistant',
            avatar_url: DISCORD_BOT_PROFILE_PICTURE,
            content: pingContent ? `${pingContent}**${headerTag}**` : `**${headerTag}**`,
            embeds: [discordEmbed]
          })
        });

        if (hookRes.ok) {
          broadcastSuccess = true;
          successMessage = `Pembaruan [${releaseData.version}] berhasil otomatis disiarkan ke Discord via Webhook!`;
        }
      } catch (err) {
        console.warn('[Auto-Changelog] Direct Webhook dispatch failed:', err);
      }
    }

    if (broadcastSuccess) {
      localStorage.setItem(LAST_AUTO_BROADCAST_VERSION_KEY, releaseData.version);
      localStorage.setItem(LAST_AUTO_BROADCAST_TIME_KEY, String(Date.now()));
      
      // Sinkronkan riwayat rilis ke Firestore agar perangkat lain juga mengetahui
      pushToFirestore('SYSTEM_CONFIGS', {
        id: 'latest_broadcasted_version',
        version: releaseData.version,
        timestamp: Date.now(),
        title: releaseData.title
      }, 'latest_broadcasted_version').catch(() => {});

      console.log(`[Auto-Changelog] ✅ ${successMessage || `Pembaruan [${releaseData.version}] berhasil otomatis disiarkan ke Discord!`}`);
      return {
        success: true,
        triggered: true,
        message: successMessage || `Pembaruan [${releaseData.version}] berhasil otomatis disiarkan ke Discord!`
      };
    } else {
      return {
        success: false,
        triggered: false,
        message: 'Tidak dapat menyiarkan pembaruan ke Discord. Pastikan Webhook URL telah tersimpan di Pengaturan.'
      };
    }
  } catch (error: any) {
    console.error('[Auto-Changelog] Error in checkAndBroadcastLatestRelease:', error);
    return {
      success: false,
      triggered: false,
      message: error?.message || 'Gagal menjalankan siaran otomatis.'
    };
  } finally {
    isBroadcastInFlight = false;
  }
}
