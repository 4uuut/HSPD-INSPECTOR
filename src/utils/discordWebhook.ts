import { ArrestRecord, DutyLog, OfficerAccount, OfficerWarning, DischargeRecord, PromotionRecord } from '../types';
import { dataURLtoBlob } from './imageCompressor';

// Case / Arrest Webhook Keys
export const WEBHOOK_STORAGE_KEY = 'hspd_discord_webhook_url';
export const BOT_NAME_KEY = 'hspd_discord_bot_name';
export const BOT_AVATAR_KEY = 'hspd_discord_bot_avatar';
export const AUTO_WEBHOOK_KEY = 'hspd_auto_send_webhook_on_save';

// Dedicated Duty Log Webhook Keys
export const DUTY_WEBHOOK_STORAGE_KEY = 'hspd_duty_webhook_url';
export const DUTY_BOT_NAME_KEY = 'hspd_duty_bot_name';
export const DUTY_BOT_AVATAR_KEY = 'hspd_duty_bot_avatar';
export const DUTY_AUTO_SEND_KEY = 'hspd_duty_auto_send';

// Dedicated Promotion / Kenaikan Pangkat Webhook Keys
export const PROMOTION_WEBHOOK_STORAGE_KEY = 'hspd_promotion_webhook_url';
export const PROMOTION_BOT_NAME_KEY = 'hspd_promotion_bot_name';
export const PROMOTION_BOT_AVATAR_KEY = 'hspd_promotion_bot_avatar';
export const PROMOTION_AUTO_SEND_KEY = 'hspd_promotion_auto_send';

// Dedicated Officer Warning / SP Webhook Keys
export const WARNING_WEBHOOK_STORAGE_KEY = 'hspd_warning_webhook_url';
export const WARNING_BOT_NAME_KEY = 'hspd_warning_bot_name';
export const WARNING_BOT_AVATAR_KEY = 'hspd_warning_bot_avatar';
export const WARNING_AUTO_SEND_KEY = 'hspd_warning_auto_send';

// Dedicated Officer Discharge / Pemecatan Webhook Keys
export const DISCHARGE_WEBHOOK_STORAGE_KEY = 'hspd_discharge_webhook_url';
export const DISCHARGE_BOT_NAME_KEY = 'hspd_discharge_bot_name';
export const DISCHARGE_BOT_AVATAR_KEY = 'hspd_discharge_bot_avatar';
export const DISCHARGE_AUTO_SEND_KEY = 'hspd_discharge_auto_send';

export interface WebhookConfig {
  webhookUrl: string;
  botName: string;
  botAvatar: string;
  autoSendOnSave: boolean;
}

export function getSavedWebhookConfig(): WebhookConfig {
  try {
    return {
      webhookUrl: localStorage.getItem(WEBHOOK_STORAGE_KEY) || '',
      botName: localStorage.getItem(BOT_NAME_KEY) || 'HSPD CAD System',
      botAvatar: localStorage.getItem(BOT_AVATAR_KEY) || 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
      autoSendOnSave: localStorage.getItem(AUTO_WEBHOOK_KEY) !== 'false' // default true if not set
    };
  } catch {
    return {
      webhookUrl: '',
      botName: 'HSPD CAD System',
      botAvatar: 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
      autoSendOnSave: true
    };
  }
}

export function saveWebhookConfig(config: Partial<WebhookConfig>) {
  try {
    if (config.webhookUrl !== undefined) localStorage.setItem(WEBHOOK_STORAGE_KEY, config.webhookUrl);
    if (config.botName !== undefined) localStorage.setItem(BOT_NAME_KEY, config.botName);
    if (config.botAvatar !== undefined) localStorage.setItem(BOT_AVATAR_KEY, config.botAvatar);
    if (config.autoSendOnSave !== undefined) localStorage.setItem(AUTO_WEBHOOK_KEY, config.autoSendOnSave ? 'true' : 'false');
  } catch (e) {
    console.error('Failed to save webhook settings', e);
  }
}

export function getSavedDutyWebhookConfig(): WebhookConfig {
  try {
    return {
      webhookUrl: localStorage.getItem(DUTY_WEBHOOK_STORAGE_KEY) || '',
      botName: localStorage.getItem(DUTY_BOT_NAME_KEY) || 'HSPD Duty Logger',
      botAvatar: localStorage.getItem(DUTY_BOT_AVATAR_KEY) || 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
      autoSendOnSave: localStorage.getItem(DUTY_AUTO_SEND_KEY) !== 'false'
    };
  } catch {
    return {
      webhookUrl: '',
      botName: 'HSPD Duty Logger',
      botAvatar: 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
      autoSendOnSave: true
    };
  }
}

export function saveDutyWebhookConfig(config: Partial<WebhookConfig>) {
  try {
    if (config.webhookUrl !== undefined) localStorage.setItem(DUTY_WEBHOOK_STORAGE_KEY, config.webhookUrl);
    if (config.botName !== undefined) localStorage.setItem(DUTY_BOT_NAME_KEY, config.botName);
    if (config.botAvatar !== undefined) localStorage.setItem(DUTY_BOT_AVATAR_KEY, config.botAvatar);
    if (config.autoSendOnSave !== undefined) localStorage.setItem(DUTY_AUTO_SEND_KEY, config.autoSendOnSave ? 'true' : 'false');
  } catch (e) {
    console.error('Failed to save duty webhook settings', e);
  }
}

export function getSavedPromotionWebhookConfig(): WebhookConfig {
  try {
    return {
      webhookUrl: localStorage.getItem(PROMOTION_WEBHOOK_STORAGE_KEY) || localStorage.getItem(WEBHOOK_STORAGE_KEY) || '',
      botName: localStorage.getItem(PROMOTION_BOT_NAME_KEY) || 'HSPD Promotion Board & HQ',
      botAvatar: localStorage.getItem(PROMOTION_BOT_AVATAR_KEY) || 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
      autoSendOnSave: localStorage.getItem(PROMOTION_AUTO_SEND_KEY) !== 'false'
    };
  } catch {
    return {
      webhookUrl: '',
      botName: 'HSPD Promotion Board & HQ',
      botAvatar: 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
      autoSendOnSave: true
    };
  }
}

export function savePromotionWebhookConfig(config: Partial<WebhookConfig>) {
  try {
    if (config.webhookUrl !== undefined) localStorage.setItem(PROMOTION_WEBHOOK_STORAGE_KEY, config.webhookUrl);
    if (config.botName !== undefined) localStorage.setItem(PROMOTION_BOT_NAME_KEY, config.botName);
    if (config.botAvatar !== undefined) localStorage.setItem(PROMOTION_BOT_AVATAR_KEY, config.botAvatar);
    if (config.autoSendOnSave !== undefined) localStorage.setItem(PROMOTION_AUTO_SEND_KEY, config.autoSendOnSave ? 'true' : 'false');
  } catch (e) {
    console.error('Failed to save promotion webhook settings', e);
  }
}

export function getSavedWarningWebhookConfig(): WebhookConfig {
  try {
    return {
      webhookUrl: localStorage.getItem(WARNING_WEBHOOK_STORAGE_KEY) || localStorage.getItem(WEBHOOK_STORAGE_KEY) || '',
      botName: localStorage.getItem(WARNING_BOT_NAME_KEY) || 'HSPD Internal Affairs (Discipline)',
      botAvatar: localStorage.getItem(WARNING_BOT_AVATAR_KEY) || 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
      autoSendOnSave: localStorage.getItem(WARNING_AUTO_SEND_KEY) !== 'false'
    };
  } catch {
    return {
      webhookUrl: '',
      botName: 'HSPD Internal Affairs (Discipline)',
      botAvatar: 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
      autoSendOnSave: true
    };
  }
}

export function saveWarningWebhookConfig(config: Partial<WebhookConfig>) {
  try {
    if (config.webhookUrl !== undefined) localStorage.setItem(WARNING_WEBHOOK_STORAGE_KEY, config.webhookUrl);
    if (config.botName !== undefined) localStorage.setItem(WARNING_BOT_NAME_KEY, config.botName);
    if (config.botAvatar !== undefined) localStorage.setItem(WARNING_BOT_AVATAR_KEY, config.botAvatar);
    if (config.autoSendOnSave !== undefined) localStorage.setItem(WARNING_AUTO_SEND_KEY, config.autoSendOnSave ? 'true' : 'false');
  } catch (e) {
    console.error('Failed to save warning webhook settings', e);
  }
}

export function getSavedDischargeWebhookConfig(): WebhookConfig {
  try {
    return {
      webhookUrl: localStorage.getItem(DISCHARGE_WEBHOOK_STORAGE_KEY) || localStorage.getItem(WEBHOOK_STORAGE_KEY) || '',
      botName: localStorage.getItem(DISCHARGE_BOT_NAME_KEY) || 'HSPD High Command Disciplinary',
      botAvatar: localStorage.getItem(DISCHARGE_BOT_AVATAR_KEY) || 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
      autoSendOnSave: localStorage.getItem(DISCHARGE_AUTO_SEND_KEY) !== 'false'
    };
  } catch {
    return {
      webhookUrl: '',
      botName: 'HSPD High Command Disciplinary',
      botAvatar: 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
      autoSendOnSave: true
    };
  }
}

export function saveDischargeWebhookConfig(config: Partial<WebhookConfig>) {
  try {
    if (config.webhookUrl !== undefined) localStorage.setItem(DISCHARGE_WEBHOOK_STORAGE_KEY, config.webhookUrl);
    if (config.botName !== undefined) localStorage.setItem(DISCHARGE_BOT_NAME_KEY, config.botName);
    if (config.botAvatar !== undefined) localStorage.setItem(DISCHARGE_BOT_AVATAR_KEY, config.botAvatar);
    if (config.autoSendOnSave !== undefined) localStorage.setItem(DISCHARGE_AUTO_SEND_KEY, config.autoSendOnSave ? 'true' : 'false');
  } catch (e) {
    console.error('Failed to save discharge webhook settings', e);
  }
}

/**
 * Send an arrest record with up to 10 photos to Discord Webhook
 */
export async function sendArrestRecordToDiscord(
  record: ArrestRecord,
  customConfig?: Partial<WebhookConfig>
): Promise<{ success: boolean; message: string }> {
  const config = { ...getSavedWebhookConfig(), ...customConfig };

  if (!config.webhookUrl || !config.webhookUrl.trim().startsWith('http')) {
    return {
      success: false,
      message: 'URL Webhook Discord belum disetting. Silakan masukkan Webhook URL di pengaturan.'
    };
  }

  const dateStr = new Date(record.timestamp || Date.now()).toLocaleString('id-ID', {
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  const embedColor = record.isCooperative ? 0x10B981 : 0x2563EB; // Emerald for coop, Police Blue for regular

  // Gather all photos (up to 10)
  const allImages: string[] = [];
  if (record.evidenceUrls && Array.isArray(record.evidenceUrls) && record.evidenceUrls.length > 0) {
    allImages.push(...record.evidenceUrls.filter(Boolean));
  } else if (record.evidenceUrl) {
    allImages.push(record.evidenceUrl);
  }
  const cappedImages = allImages.slice(0, 10);

  const fields: any[] = [
    {
      name: '👤 Nama Tersangka (Suspect)',
      value: `**${record.suspectName}**\n\`ID In-Game: ${record.suspectId}\``,
      inline: true,
    },
    {
      name: '👮 Petugas Polisi Penindak',
      value: `**${record.officerName}** (\`${record.officerBadge}\`)${record.partnerOfficer ? `\nPartner: **${record.partnerOfficer}**` : ''}`,
      inline: true,
    },
    {
      name: '⚖️ Status Pelanggar',
      value: record.isCooperative ? '✅ **Kooperatif (-20% Denda)**' : '⚠️ **Reguler / Non-Kooperatif**',
      inline: true,
    },
    {
      name: '📍 Lokasi Kejadian (TKP)',
      value: `**${record.location || 'Los Santos'}**`,
      inline: true,
    },
    {
      name: '📦 Barang Bukti Sitaan',
      value: `\`${record.confiscatedItems || 'Tidak ada barang disita'}\``,
      inline: true,
    },
    {
      name: '📜 Pasal Pelanggaran',
      value: record.pasalCodes && record.pasalCodes.length > 0 
        ? record.pasalCodes.map(c => `\`${c}\``).join(' • ')
        : '*(Tidak ada pasal terdaftar)*',
      inline: false,
    },
    {
      name: '💵 Total Denda',
      value: `**$${record.totalFine.toLocaleString()}**`,
      inline: true,
    },
    {
      name: '⛓️ Hukuman Sel',
      value: `**${record.totalJail} Bulan**`,
      inline: true,
    },
    {
      name: '🚗 Sita Kendaraan',
      value: `**${record.totalImpound} Hari**`,
      inline: true,
    },
    {
      name: '📝 Kronologi / Catatan Penangkapan',
      value: record.chronology || record.notes ? `>>> ${record.chronology || record.notes}` : '*Tidak ada catatan tambahan.*',
      inline: false,
    },
    {
      name: '⚡ Perintah In-Game (Copypaste)',
      value: `\`/giveinvoice ${record.suspectId || record.suspectName.replace(/\s+/g, '_')} ${record.totalFine} ${record.pasalCodes.join(',')}\`\n\`/arrest ${record.suspectId || record.suspectName.replace(/\s+/g, '_')} ${record.totalJail} ${record.totalFine} ${record.pasalCodes.join(',')}\``,
      inline: false,
    }
  ];

  if (cappedImages.length > 0) {
    fields.push({
      name: `📷 Bukti Terlampir (${cappedImages.length}/10 Foto)`,
      value: `Tercatat ${cappedImages.length} bukti visual dalam berkas perkara.`,
      inline: false,
    });
  }

  const primaryEmbed: any = {
    title: `🚨 LAPORAN PENINDAKAN KASUS BARU - ${record.suspectName.toUpperCase()}`,
    description: `Laporan penindakan resmi personel Kepolisian Highstate Roleplay (HSPD MDC CAD).`,
    color: embedColor,
    fields,
    footer: {
      text: `HSPD MDC CAD Terminal • Highstate Roleplay • ${dateStr}`,
      icon_url: config.botAvatar.trim() || 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
    },
    timestamp: new Date(record.timestamp || Date.now()).toISOString(),
  };

  const embeds = [primaryEmbed];

  // Process attachments
  const formData = new FormData();
  let hasFileAttachments = false;
  let fileIndex = 0;

  cappedImages.forEach((imgStr, idx) => {
    if (imgStr.startsWith('data:image/')) {
      hasFileAttachments = true;
      const { blob, extension } = dataURLtoBlob(imgStr);
      const filename = `evidence_${idx + 1}_${Date.now()}.${extension}`;
      formData.append(`files[${fileIndex}]`, blob, filename);

      if (idx === 0) {
        primaryEmbed.image = { url: `attachment://${filename}` };
      } else {
        // Additional embeds for gallery display
        embeds.push({
          url: 'https://highstate.roleplay/case-evidence',
          image: { url: `attachment://${filename}` },
          color: embedColor,
        });
      }
      fileIndex++;
    } else if (imgStr.startsWith('http')) {
      if (idx === 0) {
        primaryEmbed.image = { url: imgStr };
      } else {
        embeds.push({
          url: 'https://highstate.roleplay/case-evidence',
          image: { url: imgStr },
          color: embedColor,
        });
      }
    }
  });

  try {
    if (hasFileAttachments) {
      const payload = {
        username: config.botName.trim() || 'HSPD CAD System',
        avatar_url: config.botAvatar.trim() || 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
        embeds: embeds.slice(0, 10), // Discord max 10 embeds
      };

      formData.append('payload_json', JSON.stringify(payload));

      const res = await fetch(config.webhookUrl.trim(), {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      return {
        success: true,
        message: `Laporan kasus [${record.suspectName}] beserta ${cappedImages.length} foto bukti berhasil dikirim ke Discord!`
      };
    } else {
      const payload = {
        username: config.botName.trim() || 'HSPD CAD System',
        avatar_url: config.botAvatar.trim() || 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
        embeds: embeds.slice(0, 10),
      };

      const res = await fetch(config.webhookUrl.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      return {
        success: true,
        message: `Laporan kasus [${record.suspectName}] berhasil dikirim ke Discord Webhook!`
      };
    }
  } catch (err: any) {
    console.error('Discord Webhook Error:', err);
    return {
      success: false,
      message: `Gagal mengirim ke Webhook Discord: ${err.message || 'Cek URL Webhook atau koneksi'}`
    };
  }
}

/**
 * Send a Dedicated Duty Report (10-8 On Duty / 10-7 Off Duty / 10-6 Busy) to Duty Discord Webhook
 */
export async function sendDutyReportToDiscord(
  duty: DutyLog,
  customConfig?: Partial<WebhookConfig>
): Promise<{ success: boolean; message: string }> {
  const config = { ...getSavedDutyWebhookConfig(), ...customConfig };

  if (!config.webhookUrl || !config.webhookUrl.trim().startsWith('http')) {
    return {
      success: false,
      message: 'URL Webhook Discord Duty Log belum disetting. Silakan isi Webhook Duty Log di pengaturan.'
    };
  }

  const dateStr = new Date(duty.timestamp || Date.now()).toLocaleString('id-ID', {
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  // Color mapping
  let embedColor = 0x10B981; // 10-8 Emerald Green
  let statusBadge = '🟢 10-8 ON DUTY';
  let titleIcon = '🟢';

  if (duty.status === '10-7') {
    embedColor = 0xEF4444; // 10-7 Red
    statusBadge = '🔴 10-7 OFF DUTY';
    titleIcon = '🔴';
  } else if (duty.status === '10-6') {
    embedColor = 0xF59E0B; // 10-6 Amber
    statusBadge = '🟡 10-6 BUSY / PENANGANAN';
    titleIcon = '🟡';
  } else if (duty.status === '10-97') {
    embedColor = 0x3B82F6; // 10-97 Blue
    statusBadge = '🔵 10-97 ON SCENE';
    titleIcon = '🔵';
  }

  const fields: any[] = [
    {
      name: '👮 Petugas Kepolisian',
      value: `**${duty.officerName}** (\`${duty.officerBadge}\`)\nRank: **${duty.officerRank}**`,
      inline: true,
    },
    {
      name: '🏢 Divisi Penugasan',
      value: `**${duty.division || 'Patrol Division'}**`,
      inline: true,
    },
    {
      name: '📋 Status Operasional',
      value: `**${statusBadge}**`,
      inline: true,
    }
  ];

  // Specific highlight for 10-7 OFF DUTY: Full shift duration recap
  if (duty.status === '10-7') {
    if (duty.durationFormatted || (duty.durationMinutes !== undefined && duty.durationMinutes >= 0)) {
      fields.push({
        name: '⏱️ Total Durasi Dinas (Shift Duration)',
        value: `**${duty.durationFormatted || `${duty.durationMinutes} Menit`}**`,
        inline: false,
      });
    }

    if (duty.dutyStartTime && duty.dutyStartTime > 0) {
      const startTimeStr = new Date(duty.dutyStartTime).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      fields.push({
        name: '🕒 Waktu Mulai Dinas (10-8)',
        value: `\`${startTimeStr} WIB\``,
        inline: true,
      });
    }

    const endTimeStr = new Date(duty.dutyEndTime || duty.timestamp || Date.now()).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    fields.push({
      name: '🏁 Waktu Selesai Dinas (10-7)',
      value: `\`${endTimeStr} WIB\``,
      inline: true,
    });
  } else if (duty.status === '10-8') {
    const startTimeStr = new Date(duty.dutyStartTime || duty.timestamp || Date.now()).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    fields.push({
      name: '🕒 Waktu Mulai Dinas (10-8)',
      value: `\`${startTimeStr} WIB\``,
      inline: true,
    });
  }

  // Include optional fields only if they exist
  if (duty.callsign && duty.callsign !== 'UNIT-1' && duty.callsign.trim()) {
    fields.push({
      name: '📻 Callsign Unit',
      value: `\`${duty.callsign}\``,
      inline: true,
    });
  }

  if (duty.partner && duty.partner.trim()) {
    fields.push({
      name: '👥 Rekan Patroli',
      value: `**${duty.partner}**`,
      inline: true,
    });
  }

  if (duty.notes && duty.notes.trim()) {
    fields.push({
      name: '📝 Catatan Dinas',
      value: `>>> ${duty.notes}`,
      inline: false,
    });
  }

  const embedObj = {
    title: `${titleIcon} LAPORAN STATUS DINAS: ${statusBadge}`,
    description: duty.status === '10-7' 
      ? `Petugas telah menyelesaikan shift dinas dan resmi lepas piket (**10-7 OFF DUTY**).` 
      : duty.status === '10-8'
        ? `Petugas telah mengaktifkan status dinas dan siap bertugas di lapangan (**10-8 ON DUTY**).`
        : `Update status operasional personel Kepolisian Highstate Roleplay (HSPD MDC CAD).`,
    color: embedColor,
    fields,
    footer: {
      text: `HSPD Duty Logger • Highstate Roleplay • ${dateStr}`,
      icon_url: config.botAvatar.trim() || 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
    },
    timestamp: new Date(duty.timestamp || Date.now()).toISOString(),
  };

  const payload = {
    username: config.botName.trim() || 'HSPD Duty Logger',
    avatar_url: config.botAvatar.trim() || 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
    embeds: [embedObj],
  };

  try {
    const res = await fetch(config.webhookUrl.trim(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    return {
      success: true,
      message: `Status dinas [${statusBadge}] atas nama ${duty.officerName} berhasil dikirim ke Webhook Duty Log!`
    };
  } catch (err: any) {
    console.error('Duty Webhook Error:', err);
    return {
      success: false,
      message: `Gagal mengirim Duty Log ke Discord: ${err.message || 'Cek URL Webhook'}`
    };
  }
}

/**
 * Send a quick test ping to the Discord Webhook
 */
export async function testDiscordWebhook(config: WebhookConfig): Promise<{ success: boolean; message: string }> {
  if (!config.webhookUrl || !config.webhookUrl.trim().startsWith('http')) {
    return {
      success: false,
      message: 'Masukkan URL Discord Webhook yang valid (dimulai dengan https://discord.com/api/webhooks/...)'
    };
  }

  const payload = {
    username: config.botName.trim() || 'HSPD CAD System',
    avatar_url: config.botAvatar.trim() || 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
    embeds: [
      {
        title: '📡 KONEKSI TERMINAL HSPD CAD TERHUBUNG',
        description: 'Uji coba sinyal integrasi Webhook Discord berhasil terhubung dengan sistem MDC Kepolisian Highstate Roleplay.',
        color: 0x10B981,
        fields: [
          { name: 'Status Sinyal', value: '🟢 **10-8 Connected (Aktif)**', inline: true },
          { name: 'Waktu Pengujian', value: new Date().toLocaleString('id-ID'), inline: true },
          { name: 'Protokol', value: 'Discord Webhook API v10', inline: true },
        ],
        footer: {
          text: 'HSPD MDC CAD System • HighState Roleplay',
        }
      }
    ]
  };

  try {
    const res = await fetch(config.webhookUrl.trim(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    return {
      success: true,
      message: '✅ Sinyal Webhook Discord Berhasil Terhubung!'
    };
  } catch (err: any) {
    return {
      success: false,
      message: `❌ Gagal terhubung ke Discord: ${err.message || 'Periksa kembali URL Webhook Anda'}`
    };
  }
}

/**
 * Test ping for Dedicated Duty Webhook
 */
export async function testDutyDiscordWebhook(config: WebhookConfig): Promise<{ success: boolean; message: string }> {
  if (!config.webhookUrl || !config.webhookUrl.trim().startsWith('http')) {
    return {
      success: false,
      message: 'Masukkan URL Discord Duty Webhook yang valid (dimulai dengan https://discord.com/api/webhooks/...)'
    };
  }

  const payload = {
    username: config.botName.trim() || 'HSPD Duty Logger',
    avatar_url: config.botAvatar.trim() || 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
    embeds: [
      {
        title: '📻 UJI COBA INTEGRASI WEBHOOK DUTY LOG',
        description: 'Koneksi log kehadiran dinas (10-8 / 10-7 / 10-6) Kepolisian Highstate Roleplay berhasil terhubung.',
        color: 0x3B82F6,
        fields: [
          { name: 'Channel Target', value: '🟢 **Duty Log Channel**', inline: true },
          { name: 'Waktu', value: new Date().toLocaleString('id-ID'), inline: true },
          { name: 'Status', value: '🟢 **Ready for Dispatch**', inline: true },
        ],
        footer: {
          text: 'HSPD Duty Logger • HighState Roleplay',
        }
      }
    ]
  };

  try {
    const res = await fetch(config.webhookUrl.trim(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    return {
      success: true,
      message: '✅ Sinyal Webhook Duty Log Berhasil Terhubung!'
    };
  } catch (err: any) {
    return {
      success: false,
      message: `❌ Gagal terhubung ke Webhook Duty Log: ${err.message || 'Periksa kembali URL Webhook'}`
    };
  }
}

/**
 * Send an official Officer Warning / Strike / SP Disciplinary notification to Discord
 */
export async function sendOfficerWarningToDiscord(
  officer: OfficerAccount,
  warning: OfficerWarning,
  totalStrikes: number,
  customConfig?: Partial<WebhookConfig>
): Promise<{ success: boolean; message: string }> {
  const config = { ...getSavedWarningWebhookConfig(), ...customConfig };

  if (!config.webhookUrl || !config.webhookUrl.trim().startsWith('http')) {
    return {
      success: false,
      message: 'URL Webhook Discord untuk Surat Peringatan (SP) belum dikonfigurasi.'
    };
  }

  const dateStr = new Date(warning.timestamp || Date.now()).toLocaleString('id-ID', {
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  // Embed Color based on Strike Level
  // Strike 1: Amber (0xF59E0B), Strike 2: Orange (0xEA580C), Strike 3: Intense Red (0xDC2626)
  const embedColor = warning.strikeNumber === 1 
    ? 0xF59E0B 
    : warning.strikeNumber === 2 
      ? 0xEA580C 
      : 0xDC2626;

  const strikeTitle = warning.strikeNumber === 1
    ? '⚠️ SURAT PERINGATAN TINGKAT 1 (SP1 - TEGURAN LISAN / RINGAN)'
    : warning.strikeNumber === 2
      ? '⚠️ SURAT PERINGATAN TINGKAT 2 (SP2 - TEGURAN TERTULIS & PENANGGUHAN)'
      : '🚨 SURAT PERINGATAN TINGKAT 3 (SP3 - MAKSIMAL / REKOMENDASI PECAT)';

  const fields: any[] = [
    {
      name: '👮 Personel yang Diberi Tindakan Disiplin',
      value: `**${officer.name}**\nBadge: \`${officer.badge}\`\nPangkat: **${officer.rank}**\nDivisi: \`${officer.division}\``,
      inline: false,
    },
    {
      name: '📊 Status Akumulasi Pelanggaran Disiplin',
      value: `**Strike Ke-${warning.strikeNumber} dari Maksimal 3**\nTotal Aktif: \`${totalStrikes} / 3 Strikes\` ${totalStrikes >= 3 ? '🚨 **(MAKSIMAL - SIAP DILEPAS DARI DINAS)**' : ''}`,
      inline: true,
    },
    {
      name: '👑 Dikeluarkan / Ditetapkan Oleh',
      value: `**${warning.issuedBy}**\n\`${warning.issuedByRank || 'High Command'}\` (\`${warning.issuedByBadge || 'HQ'}\`)`,
      inline: true,
    },
    {
      name: '📋 Rincian & Keterangan Pelanggaran Kode Etik / SOP',
      value: `>>> **${warning.reason}**`,
      inline: false,
    },
    {
      name: '⚖️ Konsekuensi & Catatan Divisi Internal Affairs',
      value: warning.strikeNumber === 1
        ? 'Personel diberikan peringatan pertama untuk memperbaiki kedisiplinan dan kepatuhan SOP operasional.'
        : warning.strikeNumber === 2
          ? 'Penangguhan promosi jabatan sementara dan penempatan dalam pengawasan ketat atasan.'
          : '🚨 Personel telah mencapai batas toleransi pelanggaran disiplin (3/3). High Command dapat melakukan **Pemberhentian Tidak Dengan Hormat (Dishonorable Discharge)**.',
      inline: false,
    }
  ];

  const embedObj = {
    title: strikeTitle,
    description: `Tindakan pendisiplinan resmi personel Kepolisian Highstate Roleplay (HSPD Internal Affairs).`,
    color: embedColor,
    fields,
    footer: {
      text: `HSPD Disciplinary System • Highstate Roleplay • ${dateStr}`,
      icon_url: config.botAvatar.trim() || 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
    },
    timestamp: new Date(warning.timestamp || Date.now()).toISOString(),
  };

  const payload = {
    username: config.botName.trim() || 'HSPD Internal Affairs (Discipline)',
    avatar_url: config.botAvatar.trim() || 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
    embeds: [embedObj],
  };

  try {
    const res = await fetch(config.webhookUrl.trim(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    return {
      success: true,
      message: `Surat Peringatan (Strike ${warning.strikeNumber}/3) untuk ${officer.name} berhasil dikirim ke Discord!`
    };
  } catch (err: any) {
    console.error('Warning Webhook Error:', err);
    return {
      success: false,
      message: `Gagal mengirim Warning ke Discord: ${err.message || 'Cek URL Webhook'}`
    };
  }
}

/**
 * Send an official Officer Discharge / Termination / Pemecatan notification to Discord
 */
export async function sendOfficerDischargeToDiscord(
  discharge: DischargeRecord,
  customConfig?: Partial<WebhookConfig>
): Promise<{ success: boolean; message: string }> {
  const config = { ...getSavedDischargeWebhookConfig(), ...customConfig };

  if (!config.webhookUrl || !config.webhookUrl.trim().startsWith('http')) {
    return {
      success: false,
      message: 'URL Webhook Discord untuk Pemecatan Anggota belum disetting.'
    };
  }

  const dateStr = new Date(discharge.timestamp || Date.now()).toLocaleString('id-ID', {
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  const fields: any[] = [
    {
      name: '👤 Identitas Personel yang Diberhentikan',
      value: `Nama: **${discharge.officerName}**\nNomor Lencana: \`${discharge.officerBadge}\`\nPangkat Terakhir: **${discharge.officerRank}**\nDivisi Terakhir: \`${discharge.officerDivision}\``,
      inline: false,
    },
    {
      name: '🚫 Status Keanggotaan Kepolisian',
      value: '❌ **RESMI DIBERHENTIKAN DARI DINAS (DISCHARGED)**\n*(Seluruh akses login CAD & wewenang kepolisian dicabut)*',
      inline: false,
    },
    {
      name: '📋 Alasan Pemecatan / Pemberhentian',
      value: `>>> **${discharge.reason}**`,
      inline: false,
    },
    {
      name: '📊 Riwayat Warning Sebelumnya',
      value: `\`${discharge.warningCountBeforeDischarge} / 3 Strikes Terakumulasi\``,
      inline: true,
    },
    {
      name: '👑 Ditetapkan Oleh (High Command)',
      value: `**${discharge.dischargedBy}**\n\`${discharge.dischargedByRank || 'High Command'}\` (\`${discharge.dischargedByBadge || 'HQ'}\`)`,
      inline: true,
    }
  ];

  const embedObj = {
    title: `🚫 SURAT KEPUTUSAN PEMBERHENTIAN DINAS (PEMECATAN ANGGOTA)`,
    description: `Berdasarkan evaluasi kedisiplinan dan instruksi High Command, personel berikut resmi diberhentikan dari dinas Kepolisian Highstate Roleplay.`,
    color: 0x991B1B, // Dark Crimson Red
    fields,
    footer: {
      text: `HSPD High Command HQ • Highstate Roleplay • ${dateStr}`,
      icon_url: config.botAvatar.trim() || 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
    },
    timestamp: new Date(discharge.timestamp || Date.now()).toISOString(),
  };

  const payload = {
    username: config.botName.trim() || 'HSPD High Command Disciplinary',
    avatar_url: config.botAvatar.trim() || 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
    embeds: [embedObj],
  };

  try {
    const res = await fetch(config.webhookUrl.trim(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    return {
      success: true,
      message: `Surat Pemecatan untuk ${discharge.officerName} berhasil dikirim ke Webhook Discord!`
    };
  } catch (err: any) {
    console.error('Discharge Webhook Error:', err);
    return {
      success: false,
      message: `Gagal mengirim Surat Pemecatan ke Discord: ${err.message || 'Cek URL Webhook'}`
    };
  }
}

/**
 * Test ping for Warning Webhook
 */
export async function testWarningDiscordWebhook(config: WebhookConfig): Promise<{ success: boolean; message: string }> {
  if (!config.webhookUrl || !config.webhookUrl.trim().startsWith('http')) {
    return {
      success: false,
      message: 'Masukkan URL Discord Webhook Warning yang valid (dimulai dengan https://discord.com/api/webhooks/...)'
    };
  }

  const payload = {
    username: config.botName.trim() || 'HSPD Internal Affairs (Discipline)',
    avatar_url: config.botAvatar.trim() || 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
    embeds: [
      {
        title: '⚠️ UJI COBA INTEGRASI WEBHOOK SURAT PERINGATAN (SP)',
        description: 'Koneksi log pendisiplinan & surat peringatan anggota HSPD berhasil terhubung.',
        color: 0xF59E0B,
        fields: [
          { name: 'Channel Target', value: '🟢 **Internal Affairs / Discipline Channel**', inline: true },
          { name: 'Waktu Pengujian', value: new Date().toLocaleString('id-ID'), inline: true },
          { name: 'Status Sistem', value: '🟢 **Ready for Disciplinary Logging (Max 3 Strikes)**', inline: true },
        ],
        footer: {
          text: 'HSPD Internal Affairs • HighState Roleplay',
        }
      }
    ]
  };

  try {
    const res = await fetch(config.webhookUrl.trim(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    return {
      success: true,
      message: '✅ Sinyal Webhook Surat Peringatan (SP) Berhasil Terhubung!'
    };
  } catch (err: any) {
    return {
      success: false,
      message: `❌ Gagal terhubung ke Webhook Warning: ${err.message || 'Periksa kembali URL Webhook'}`
    };
  }
}

/**
 * Test ping for Discharge Webhook
 */
export async function testDischargeDiscordWebhook(config: WebhookConfig): Promise<{ success: boolean; message: string }> {
  if (!config.webhookUrl || !config.webhookUrl.trim().startsWith('http')) {
    return {
      success: false,
      message: 'Masukkan URL Discord Webhook Pemecatan yang valid (dimulai dengan https://discord.com/api/webhooks/...)'
    };
  }

  const payload = {
    username: config.botName.trim() || 'HSPD High Command Disciplinary',
    avatar_url: config.botAvatar.trim() || 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
    embeds: [
      {
        title: '🚫 UJI COBA INTEGRASI WEBHOOK PEMECATAN ANGGOTA',
        description: 'Koneksi pengumuman pemberhentian dinas / pemecatan resmi personel HSPD berhasil terhubung.',
        color: 0x991B1B,
        fields: [
          { name: 'Channel Target', value: '🟢 **Discharge / Termination Announcement**', inline: true },
          { name: 'Waktu Pengujian', value: new Date().toLocaleString('id-ID'), inline: true },
          { name: 'Status Sistem', value: '🟢 **Ready for High Command Decisions**', inline: true },
        ],
        footer: {
          text: 'HSPD High Command HQ • HighState Roleplay',
        }
      }
    ]
  };

  try {
    const res = await fetch(config.webhookUrl.trim(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    return {
      success: true,
      message: '✅ Sinyal Webhook Pemecatan Anggota Berhasil Terhubung!'
    };
  } catch (err: any) {
    return {
      success: false,
      message: `❌ Gagal terhubung ke Webhook Pemecatan: ${err.message || 'Periksa kembali URL Webhook'}`
    };
  }
}

/**
 * Send an Official Promotion / Rank Advancement Announcement to Discord Webhook
 */
export async function sendPromotionAnnouncementToDiscord(
  promotion: PromotionRecord,
  customConfig?: Partial<WebhookConfig>
): Promise<{ success: boolean; message: string }> {
  const config = { ...getSavedPromotionWebhookConfig(), ...customConfig };

  if (!config.webhookUrl || !config.webhookUrl.trim().startsWith('http')) {
    return {
      success: false,
      message: 'URL Webhook Discord Pengumuman Kenaikan Pangkat belum disetting.'
    };
  }

  const dateStr = new Date(promotion.timestamp || Date.now()).toLocaleString('id-ID', {
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  const fields = [
    {
      name: '👮 PERSONEL POLISI',
      value: `**${promotion.officerName}**\nBadge: \`#${promotion.officerBadge}\``,
      inline: true,
    },
    {
      name: '🔰 PANGKAT SEBELUMNYA',
      value: `\`${promotion.oldRank}\``,
      inline: true,
    },
    {
      name: '🎖️ PANGKAT BARU (RESMI)',
      value: `🌟 **${promotion.newRank}**`,
      inline: true,
    },
    {
      name: '🏢 DIVISI / UNIT PENUGASAN',
      value: `${promotion.division || 'Patrol Division'}`,
      inline: true,
    },
    {
      name: '👑 DITETAPKAN OLEH',
      value: `**${promotion.promotedBy}**\n\`${promotion.promotedByRank || 'High Command'}\` [${promotion.promotedByBadge || 'HC'}]`,
      inline: true,
    },
    {
      name: '📅 TANGGAL SK PENETAPAN',
      value: `${dateStr}`,
      inline: true,
    },
    {
      name: '📜 DASAR & CATATAN PROMOSI',
      value: `> *${promotion.reason?.trim() || 'Kinerja teladan, loyalitas tanpa batas, dedikasi tinggi dalam tugas patroli, serta integritas kode etik kepolisian.'}*`,
      inline: false,
    },
    {
      name: '📢 AMANAT HIGH COMMAND',
      value: 'Selamat atas kenaikan pangkat baru. Emban amanah dan wewenang dengan penuh integritas serta lindungi masyarakat dengan adil dan profesional.',
      inline: false,
    }
  ];

  const embedObj = {
    title: `🎖️ PENGUMUMAN RESMI KENAIKAN PANGKAT & JABATAN`,
    description: `Markas Besar Kepolisian Highstate Roleplay secara resmi mengumumkan kenaikan pangkat dan penugasan baru bagi personel berikut:`,
    color: 0xD97706, // Amber Gold
    fields,
    footer: {
      text: `HSPD High Command Promotion Board • Highstate Roleplay • ${dateStr}`,
      icon_url: config.botAvatar.trim() || 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
    },
    timestamp: new Date(promotion.timestamp || Date.now()).toISOString(),
  };

  const payload = {
    username: config.botName.trim() || 'HSPD Promotion Board & HQ',
    avatar_url: config.botAvatar.trim() || 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
    embeds: [embedObj],
  };

  try {
    const res = await fetch(config.webhookUrl.trim(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    return {
      success: true,
      message: `Pengumuman Kenaikan Pangkat untuk ${promotion.officerName} (${promotion.newRank}) berhasil dikirim ke Webhook Discord!`
    };
  } catch (err: any) {
    console.error('Promotion Webhook Error:', err);
    return {
      success: false,
      message: `Gagal mengirim Pengumuman Kenaikan Pangkat ke Discord: ${err.message || 'Cek URL Webhook'}`
    };
  }
}

/**
 * Test ping for Promotion Webhook
 */
export async function testPromotionDiscordWebhook(config: WebhookConfig): Promise<{ success: boolean; message: string }> {
  if (!config.webhookUrl || !config.webhookUrl.trim().startsWith('http')) {
    return {
      success: false,
      message: 'Masukkan URL Discord Webhook Kenaikan Pangkat yang valid (dimulai dengan https://discord.com/api/webhooks/...)'
    };
  }

  const payload = {
    username: config.botName.trim() || 'HSPD Promotion Board & HQ',
    avatar_url: config.botAvatar.trim() || 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
    embeds: [
      {
        title: '🎖️ UJI COBA INTEGRASI WEBHOOK PENGUMUMAN KENAIKAN PANGKAT',
        description: 'Koneksi siaran pengumuman promosi & SK kenaikan pangkat personel HSPD berhasil terhubung.',
        color: 0xD97706,
        fields: [
          { name: 'Channel Target', value: '🟢 **Promotion Announcement / Kenaikan Pangkat**', inline: true },
          { name: 'Waktu Pengujian', value: new Date().toLocaleString('id-ID'), inline: true },
          { name: 'Status Sistem', value: '🟢 **Ready for Promotion Broadcasts**', inline: true },
        ],
        footer: {
          text: 'HSPD High Command Promotion Board • HighState Roleplay',
        }
      }
    ]
  };

  try {
    const res = await fetch(config.webhookUrl.trim(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    return {
      success: true,
      message: '✅ Sinyal Webhook Pengumuman Kenaikan Pangkat Berhasil Terhubung!'
    };
  } catch (err: any) {
    return {
      success: false,
      message: `❌ Gagal terhubung ke Webhook Kenaikan Pangkat: ${err.message || 'Periksa kembali URL Webhook'}`
    };
  }
}

/**
 * Send an Officer PIN Reset / Change Request to Discord Webhook
 */
export async function sendPinResetRequestToDiscord(params: {
  officerName: string;
  officerBadge: string;
  rank?: string;
  reason: string;
  requestedNewPin?: string;
  discordTag?: string;
  customConfig?: Partial<WebhookConfig>;
}): Promise<{ success: boolean; message: string }> {
  const config = { ...getSavedWebhookConfig(), ...params.customConfig };

  if (!config.webhookUrl || !config.webhookUrl.trim().startsWith('http')) {
    return {
      success: false,
      message: 'URL Webhook Discord belum disetting di sistem. Silakan laporkan langsung kepada Pihak Atasan / High Command di Discord.'
    };
  }

  const dateStr = new Date().toLocaleString('id-ID', {
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  const fields = [
    {
      name: '👮 IDENTITAS PETUGAS',
      value: `Nama: **${params.officerName}**\nNomor Badge: \`${params.officerBadge}\`${params.rank ? `\nPangkat: **${params.rank}**` : ''}`,
      inline: true,
    },
    {
      name: '📋 JENIS PENGAJUAN',
      value: `🔑 **PERMINTAAN RESET / UBAH PIN CAD**`,
      inline: true,
    },
    {
      name: '🕒 WAKTU PENGAJUAN',
      value: `${dateStr}`,
      inline: true,
    },
    {
      name: '📝 ALASAN / KETERANGAN PETUGAS',
      value: `>>> *${params.reason || 'Petugas lupa PIN login atau mengajukan pembaruan kode keamanan akun.'}*`,
      inline: false,
    }
  ];

  if (params.discordTag && params.discordTag.trim()) {
    fields.push({
      name: '💬 KONTAK DISCORD ANGGOTA',
      value: `\`${params.discordTag.trim()}\``,
      inline: true,
    });
  }

  if (params.requestedNewPin && params.requestedNewPin.trim()) {
    fields.push({
      name: '🔒 PIN BARU YANG DIAJUKAN',
      value: `\`${params.requestedNewPin.trim()}\``,
      inline: true,
    });
  }

  fields.push({
    name: '👑 TINDAKAN UNTUK HIGH COMMAND / SUPERVISOR',
    value: 'Silakan verifikasi identitas personel, kemudian buka menu **Roster Management (Super Admin)** pada MDT CAD untuk memperbarui PIN akun anggota.',
    inline: false,
  });

  const embedObj = {
    title: `🚨 TIKET PENGAJUAN PERUBAHAN / RESET PIN LOGIN PETUGAS`,
    description: `Terdapat permohonan pembaruan kredensial PIN login terminal MDT oleh personel kepolisian.`,
    color: 0x3B82F6, // Blue / Amber
    fields,
    footer: {
      text: `HSPD Security & CAD Helpdesk • Highstate Roleplay • ${dateStr}`,
      icon_url: config.botAvatar.trim() || 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
    },
    timestamp: new Date().toISOString(),
  };

  const payload = {
    username: config.botName.trim() || 'HSPD CAD Security Center',
    avatar_url: config.botAvatar.trim() || 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
    embeds: [embedObj],
  };

  try {
    const res = await fetch(config.webhookUrl.trim(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    return {
      success: true,
      message: `Permintaan reset/ganti PIN untuk ${params.officerName} (${params.officerBadge}) berhasil diteruskan ke Discord Atasan!`
    };
  } catch (err: any) {
    console.error('PIN Request Webhook Error:', err);
    return {
      success: false,
      message: `Gagal mengirim ke Webhook Discord: ${err.message || 'Cek koneksi/Webhook URL'}`
    };
  }
}

/**
 * Send PIN Reset Confirmation / Resolution by High Command to Discord Webhook
 */
export async function sendPinResetResolvedWebhookToDiscord(params: {
  officerName: string;
  officerBadge: string;
  officerRank?: string;
  newPin: string;
  resolvedBy: string;
  resolvedByBadge: string;
  resolvedByRank: string;
  notes?: string;
  customConfig?: Partial<WebhookConfig>;
}): Promise<{ success: boolean; message: string }> {
  const config = { ...getSavedWebhookConfig(), ...params.customConfig };

  if (!config.webhookUrl || !config.webhookUrl.trim().startsWith('http')) {
    return {
      success: false,
      message: 'URL Webhook Discord belum disetting.'
    };
  }

  const dateStr = new Date().toLocaleString('id-ID', {
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  const fields = [
    {
      name: '👮 PERSONEL KEPOLISIAN',
      value: `Nama: **${params.officerName}**\nBadge: \`${params.officerBadge}\`${params.officerRank ? `\nPangkat: **${params.officerRank}**` : ''}`,
      inline: true,
    },
    {
      name: '👑 ATASAN PENGESAH (HIGH COMMAND)',
      value: `Nama: **${params.resolvedBy}**\nBadge: \`${params.resolvedByBadge}\`\nPangkat: **${params.resolvedByRank}**`,
      inline: true,
    },
    {
      name: '🕒 WAKTU PENGESAHAN',
      value: `${dateStr}`,
      inline: true,
    },
    {
      name: '🔒 PIN LOGIN BARU (STATUS AKTIF)',
      value: `\`${params.newPin}\` *(Telah diperbarui di database MDT)*`,
      inline: true,
    },
    {
      name: '📋 STATUS VERIFIKASI',
      value: `✅ **DISETUJUI & SELESAI (RESOLVED)**`,
      inline: true,
    },
    {
      name: '📝 CATATAN ATASAN',
      value: `>>> *${params.notes || 'Kredensial PIN login telah diverifikasi dan diperbarui oleh High Command. Petugas dapat login kembali ke terminal MDT.'}*`,
      inline: false,
    }
  ];

  const embedObj = {
    title: `✅ LAPORAN OTORISASI: PIN LOGIN MDT TELAH DIPERBARUI OLEH ATASAN`,
    description: `Permohonan lupa/reset password untuk petugas **${params.officerName} (${params.officerBadge})** telah disetujui dan diperbarui langsung oleh jajaran High Command.`,
    color: 0x10B981, // Emerald Green
    fields,
    footer: {
      text: `HSPD Security & CAD Headquarters • Highstate Roleplay • ${dateStr}`,
      icon_url: config.botAvatar.trim() || 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
    },
    timestamp: new Date().toISOString(),
  };

  const payload = {
    username: config.botName.trim() || 'HSPD CAD Security Center',
    avatar_url: config.botAvatar.trim() || 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
    embeds: [embedObj],
  };

  try {
    const res = await fetch(config.webhookUrl.trim(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    return {
      success: true,
      message: `Konfirmasi pembaruan PIN ${params.officerName} berhasil dikirim ke Webhook Discord!`
    };
  } catch (err: any) {
    console.error('PIN Resolved Webhook Error:', err);
    return {
      success: false,
      message: `Gagal mengirim konfirmasi ke Discord: ${err.message || 'Cek koneksi'}`
    };
  }
}


