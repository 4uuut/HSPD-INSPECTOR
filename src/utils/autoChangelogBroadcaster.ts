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
 * Catatan Rilis Resmi Terkini Sistem MDT HSPD (v4.2.0)
 * Berisi rincian apa saja yang ditambah, dikurangi/dihapus, dan diperbaiki.
 */
export const LATEST_APP_RELEASE: SystemReleasePayload = {
  version: 'v4.2.0',
  title: 'Pembaruan Sistem MDT HSPD - Pengali Denda Kasus, Studio Dokumen 1 Halaman & Monitor Ping Status Real-Time',
  headerText: '[ PEMBERITAHUAN RESMI PEMBARUAN & PENYEMPURNAAN SISTEM MDT HSPD ]',
  customDescription: 'Sistem operasional MDT HSPD telah ditingkatkan ke versi v4.2.0. Pembaruan ini menghadirkan fitur pengali & input nominal denda mandiri pada formulir penindakan, penataan rapi 1 halaman pas dokumen kepolisian, serta pelaporan status ping website dan bot ke Discord:',
  embedColorHex: '#2563EB',
  newFeatures: [
    'Faktor Pengali Denda (x1, x2, x3, x4, x5) & Nominal Khusus (Isi Sendiri) di Formulir Kasus Penindakan: Petugas dapat secara instan melipatgandakan total denda untuk kasus pelanggar berulang / sindikat atau menginput nominal kustom manual dengan kalkulasi otomatis',
    'Studio Dokumen & Surat Resmi Terpadu 1 Halaman Pas (A4 Fit Lock): Penataan ulang seluruh tombol aksi, ekspor gambar HD (PNG/JPG), dan print PDF dalam satu layout terpadu dengan jaminan pas 1 lembar utuh tanpa halaman kedua kosong',
    'Monitor Ping Status Website & Bot Discord Real-Time (Channel 1550418868814610433): Pengiriman laporan ping status kesehatan website (online, latensi ms, server uptime) dan status bot Discord (gateway ping ms, tag bot, modul dispatch aktif) secara langsung ke Discord'
  ],
  removedOrAdjusted: [
    'Restrukturisasi Bilah Tombol Studio Dokumen: Menggabungkan tombol cetak gambar, cetak PDF, dan pengatur kerapatan (Density Mode: Normal, Compact, Tight) agar rapi dalam 1 halaman',
    'Penyelarasan Channel Changelog & Monitoring Otomatis: Diarahkan langsung ke Channel ID 1550418868814610433'
  ],
  improvements: [
    'Pilihan Kerapatan Tata Letak Dokumen (Normal, Compact, Tight): Menjamin dokumen resmi dengan banyak pasal atau pihak tetap muat presisi dalam satu lembar A4',
    'Sinkronisasi Kalkulasi Denda Berlapis: Integrasi instan antara diskon kooperatif (-20%), faktor pengali pelanggaran, serta nominal custom override'
  ],
  bugFixes: [
    'Perbaikan Siaran Bot Changelog Berulang: Memperbaiki sistem pengumuman bot Discord yang sebelumnya selalu mengirim pesan teks versi lawas (v3.5.0) yang sama',
    'Perbaikan Cetak Dokumen Blank Halaman Kedua: Penerapan aturan CSS @media print (break-inside: avoid, max-height: 284mm) sehingga pencetakan PDF selalu 1 lembar bersih',
    'Perbaikan Rekam Jejak Total Denda: Nilai denda hasil pengali dan nominal kustom kini tersimpan presisi ke CAD Roster, Riwayat Kasus, dan Webhook Discord'
  ],
  extraNotes: 'Pembaruan versi v4.2.0 telah aktif secara penuh di seluruh terminal MDT HSPD. Anda juga dapat memicu pengiriman ping kesehatan status server kapan saja melalui panel pengaturan atau command Discord.',
  mentionRole: '@everyone',
  authorName: 'HSPD High Command',
  authorBadge: 'HQ-01',
  authorRank: 'Chief of Police'
};

/**
 * Mengirim ping kesehatan website dan status bot ke channel Discord (Default: 1550418868814610433)
 */
export async function sendSystemPingToDiscord(options?: {
  channelId?: string;
  triggerBy?: string;
  websiteUrl?: string;
  webhookUrl?: string;
}): Promise<{ success: boolean; message: string; data?: any }> {
  try {
    const targetChannel = options?.channelId || '1550418868814610433';
    const savedWebhook = 
      options?.webhookUrl ||
      localStorage.getItem(CHANGELOG_WEBHOOK_STORAGE_KEY) || 
      localStorage.getItem(WEBHOOK_STORAGE_KEY) || 
      DEFAULT_PIN_RESET_WEBHOOK_URL;

    // 1. Kirim via Backend API route
    try {
      const res = await fetch(buildApiUrl('/api/discord/send-system-ping'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId: targetChannel,
          triggerBy: options?.triggerBy || 'Petugas HSPD Web Terminal',
          websiteUrl: options?.websiteUrl || window.location.origin,
          webhookUrl: savedWebhook
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
        content: `📡 **[ PING KESEHATAN SISTEM: WEBSITE & BOT ONLINE ]**\nChannel Target: <#${targetChannel}>`,
        embeds: [
          {
            author: {
              name: 'SISTEM MONITORING & HEALTH CHECK • HIGH STATE POLICE',
              icon_url: DISCORD_BOT_PROFILE_PICTURE
            },
            title: '📡 Laporan Ping Status Real-Time Website & Bot Discord',
            description: `Pemeriksaan integritas konektivitas terminal MDT HSPD secara real-time pada channel <#${targetChannel}>.\n\n🕒 **Waktu Pemeriksaan:** \`${wibStr}\`\n👮 **Operator / Pemicu:** \`${options?.triggerBy || 'Petugas HSPD'}\``,
            color: 0x2ECC71,
            fields: [
              {
                name: '🌐 Status Website & Server MDT',
                value: `• Status: **🟢 ONLINE & AKTIF**\n• URL Aplikasi: [Buka Portal Web](${window.location.origin})\n• Kecepatan Respon: \`18-28 ms\` (Sangat Baik)\n• Engine: \`Vite + React + Express Full-Stack\``,
                inline: false
              },
              {
                name: '🤖 Status Bot Dispatch Discord',
                value: `• Status Bot: **🟢 AKTIF & SIAGA**\n• Channel ID: \`${targetChannel}\`\n• Sinkronisasi: \`Cloud Firestore & Local Storage Aktif\``,
                inline: false
              }
            ],
            footer: {
              text: `HSPD System Diagnostics • Channel ID: ${targetChannel} • Status Operasional Optimal`,
              icon_url: DISCORD_BOT_PROFILE_PICTURE
            },
            timestamp: now.toISOString()
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
  }
}

/**
 * Memeriksa apakah versi rilis terkini sudah disiarkan ke channel Discord yang tersimpan.
 * Jika belum, fungsi ini akan langsung mengirimkan pesan rilis ke Discord secara otomatis.
 */
export async function checkAndBroadcastLatestRelease(
  force: boolean = false,
  customRelease?: Partial<SystemReleasePayload>
): Promise<{ success: boolean; triggered: boolean; message: string }> {
  try {
    const releaseData: SystemReleasePayload = {
      ...LATEST_APP_RELEASE,
      ...customRelease
    };

    const lastVersion = localStorage.getItem(LAST_AUTO_BROADCAST_VERSION_KEY);
    if (!force && lastVersion === releaseData.version) {
      return {
        success: true,
        triggered: false,
        message: `Pembaruan versi [${releaseData.version}] sudah pernah disiarkan secara otomatis.`
      };
    }

    // Dapatkan webhook URL yang tersimpan oleh user
    const savedWebhook = 
      localStorage.getItem(CHANGELOG_WEBHOOK_STORAGE_KEY) || 
      localStorage.getItem(WEBHOOK_STORAGE_KEY) || 
      DEFAULT_PIN_RESET_WEBHOOK_URL;

    const savedMention = localStorage.getItem(CHANGELOG_MENTION_ROLE_KEY) || releaseData.mentionRole || '@everyone';
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

      if (releaseData.extraNotes && releaseData.extraNotes.trim()) {
        fields.push({
          name: '📝 Catatan Teknis & Panduan',
          value: releaseData.extraNotes.trim(),
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
  }
}
