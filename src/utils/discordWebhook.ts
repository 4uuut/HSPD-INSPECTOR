import { 
  ArrestRecord, DutyLog, OfficerAccount, OfficerWarning, DischargeRecord, PromotionRecord,
  DetectiveCase, BoloAlert, ImpoundRecord, OfficerProfile, VaultAuditLog, DestructionRegistryItem,
  OfficialDocument
} from '../types';
import { dataURLtoBlob } from './imageCompressor';
import { pushToFirestore, syncAllWebhooksToFirestore } from '../services/firebaseRealtimeSync';

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

// Dedicated PIN Reset / Password Security Webhook Keys
export const PIN_RESET_WEBHOOK_STORAGE_KEY = 'hspd_pin_reset_webhook_url';
export const PIN_RESET_BOT_NAME_KEY = 'hspd_pin_reset_bot_name';
export const PIN_RESET_BOT_AVATAR_KEY = 'hspd_pin_reset_bot_avatar';
export const PIN_RESET_AUTO_SEND_KEY = 'hspd_pin_reset_auto_send';
export const DEFAULT_PIN_RESET_WEBHOOK_URL = 'https://discord.com/api/webhooks/1541543930661699658/mIUtFMbg5XlG6PRwV2kydPk-4qaViFaxMoMpmi1tpGee-o4WRAU4WI2nqBC7SJQJ2Xu2';

// Dedicated Roster & Member Info Update Webhook Keys
export const ROSTER_WEBHOOK_STORAGE_KEY = 'hspd_roster_webhook_url';
export const ROSTER_BOT_NAME_KEY = 'hspd_roster_bot_name';
export const ROSTER_BOT_AVATAR_KEY = 'hspd_roster_bot_avatar';
export const ROSTER_AUTO_SEND_KEY = 'hspd_roster_auto_send';

// Dedicated Detective / CID Case Board Webhook Keys
export const DETECTIVE_WEBHOOK_STORAGE_KEY = 'hspd_detective_webhook_url';
export const DETECTIVE_BOT_NAME_KEY = 'hspd_detective_bot_name';
export const DETECTIVE_BOT_AVATAR_KEY = 'hspd_detective_bot_avatar';
export const DETECTIVE_AUTO_SEND_KEY = 'hspd_detective_auto_send';

// Dedicated BOLO Alert Dispatch Webhook Keys
export const BOLO_WEBHOOK_STORAGE_KEY = 'hspd_bolo_webhook_url';
export const BOLO_BOT_NAME_KEY = 'hspd_bolo_bot_name';
export const BOLO_BOT_AVATAR_KEY = 'hspd_bolo_bot_avatar';
export const BOLO_AUTO_SEND_KEY = 'hspd_bolo_auto_send';

// Dedicated Traffic Impound Lot Webhook Keys
export const IMPOUND_WEBHOOK_STORAGE_KEY = 'hspd_impound_webhook_url';
export const IMPOUND_BOT_NAME_KEY = 'hspd_impound_bot_name';
export const IMPOUND_BOT_AVATAR_KEY = 'hspd_impound_bot_avatar';
export const IMPOUND_AUTO_SEND_KEY = 'hspd_impound_auto_send';

// Dedicated Police Vault & Weekly Audit Webhook Keys
export const VAULT_WEBHOOK_STORAGE_KEY = 'hspd_vault_webhook_url';
export const VAULT_BOT_NAME_KEY = 'hspd_vault_bot_name';
export const VAULT_BOT_AVATAR_KEY = 'hspd_vault_bot_avatar';
export const VAULT_AUTO_SEND_KEY = 'hspd_vault_auto_send';

// Dedicated Weapon & Vehicle Destruction / Smelting Webhook Keys
export const DESTRUCTION_WEBHOOK_STORAGE_KEY = 'hspd_destruction_webhook_url';
export const DESTRUCTION_BOT_NAME_KEY = 'hspd_destruction_bot_name';
export const DESTRUCTION_BOT_AVATAR_KEY = 'hspd_destruction_bot_avatar';
export const DESTRUCTION_AUTO_SEND_KEY = 'hspd_destruction_auto_send';

// Dedicated Official Document & Archival Webhook Keys
export const DOCUMENT_WEBHOOK_STORAGE_KEY = 'hspd_document_webhook_url';
export const DOCUMENT_BOT_NAME_KEY = 'hspd_document_bot_name';
export const DOCUMENT_BOT_AVATAR_KEY = 'hspd_document_bot_avatar';
export const DOCUMENT_AUTO_SEND_KEY = 'hspd_document_auto_send';

// Dedicated Discord Bot Token for PM / Direct Messages
export const DISCORD_BOT_TOKEN_KEY = 'hspd_discord_bot_token';
export const DISCORD_BOT_CUSTOM_NAME_KEY = 'hspd_discord_bot_custom_name';
export const DISCORD_BOT_CUSTOM_AVATAR_KEY = 'hspd_discord_bot_custom_avatar';
export const DISCORD_BOT_DEFAULT_NOTE_KEY = 'hspd_discord_bot_default_note';
export const DISCORD_BOT_EMBED_TITLE_KEY = 'hspd_discord_bot_embed_title';
export const DISCORD_BOT_EMBED_DESC_KEY = 'hspd_discord_bot_embed_desc';
export const DISCORD_BOT_EMBED_COLOR_KEY = 'hspd_discord_bot_embed_color';
export const DISCORD_BOT_FOOTER_TEXT_KEY = 'hspd_discord_bot_footer_text';

export const PRESET_DISCORD_BOT_LOGOS = [
  {
    name: 'High State Blue Robot',
    url: 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
    category: 'High State'
  },
  {
    name: 'HSPD Golden Police Star',
    url: 'https://cdn-icons-png.flaticon.com/512/1022/1022331.png',
    category: 'HSPD Official'
  },
  {
    name: 'Police Department Shield',
    url: 'https://cdn-icons-png.flaticon.com/512/942/942748.png',
    category: 'Police Shield'
  },
  {
    name: 'Tactical Cyber Badge',
    url: 'https://cdn-icons-png.flaticon.com/512/2345/2345338.png',
    category: 'Cyber Tactical'
  },
  {
    name: 'Command Star Bureau',
    url: 'https://cdn-icons-png.flaticon.com/512/179/179386.png',
    category: 'High Command'
  },
  {
    name: 'Special Response SWAT',
    url: 'https://cdn-icons-png.flaticon.com/512/1022/1022370.png',
    category: 'Special Operations'
  }
];

export interface DiscordBotConfig {
  botToken: string;
  botName: string;
  botAvatar: string;
  defaultNote: string;
  embedTitle: string;
  embedDescription: string;
  embedColor: string;
  footerText: string;
}

export function getSavedDiscordBotConfig(): DiscordBotConfig {
  try {
    return {
      botToken: localStorage.getItem(DISCORD_BOT_TOKEN_KEY) || '',
      botName: localStorage.getItem(DISCORD_BOT_CUSTOM_NAME_KEY) || 'Cek Akun | High State',
      botAvatar: localStorage.getItem(DISCORD_BOT_CUSTOM_AVATAR_KEY) || 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
      defaultNote: localStorage.getItem(DISCORD_BOT_DEFAULT_NOTE_KEY) || 'Jangan beritahu informasi ini kepada orang lain!',
      embedTitle: localStorage.getItem(DISCORD_BOT_EMBED_TITLE_KEY) || '✅ Berhasil!',
      embedDescription: localStorage.getItem(DISCORD_BOT_EMBED_DESC_KEY) || 'Berikut adalah detail dari akun UCP Anda:',
      embedColor: localStorage.getItem(DISCORD_BOT_EMBED_COLOR_KEY) || '#00A8FF',
      footerText: localStorage.getItem(DISCORD_BOT_FOOTER_TEXT_KEY) || 'Bot High State'
    };
  } catch {
    return {
      botToken: '',
      botName: 'Cek Akun | High State',
      botAvatar: 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
      defaultNote: 'Jangan beritahu informasi ini kepada orang lain!',
      embedTitle: '✅ Berhasil!',
      embedDescription: 'Berikut adalah detail dari akun UCP Anda:',
      embedColor: '#00A8FF',
      footerText: 'Bot High State'
    };
  }
}

export function saveDiscordBotConfig(config: Partial<DiscordBotConfig>) {
  try {
    if (config.botToken !== undefined) localStorage.setItem(DISCORD_BOT_TOKEN_KEY, config.botToken.trim());
    if (config.botName !== undefined) localStorage.setItem(DISCORD_BOT_CUSTOM_NAME_KEY, config.botName.trim());
    if (config.botAvatar !== undefined) localStorage.setItem(DISCORD_BOT_CUSTOM_AVATAR_KEY, config.botAvatar.trim());
    if (config.defaultNote !== undefined) localStorage.setItem(DISCORD_BOT_DEFAULT_NOTE_KEY, config.defaultNote.trim());
    if (config.embedTitle !== undefined) localStorage.setItem(DISCORD_BOT_EMBED_TITLE_KEY, config.embedTitle.trim());
    if (config.embedDescription !== undefined) localStorage.setItem(DISCORD_BOT_EMBED_DESC_KEY, config.embedDescription.trim());
    if (config.embedColor !== undefined) localStorage.setItem(DISCORD_BOT_EMBED_COLOR_KEY, config.embedColor.trim());
    if (config.footerText !== undefined) localStorage.setItem(DISCORD_BOT_FOOTER_TEXT_KEY, config.footerText.trim());
    syncAllWebhooksToFirestore();
  } catch (e) {
    console.error('Failed to save Discord Bot settings', e);
  }
}

export interface WebhookConfig {
  webhookUrl: string;
  botName: string;
  botAvatar: string;
  autoSendOnSave: boolean;
}

export type DiscordWebhookConfig = WebhookConfig;

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

export const getDiscordWebhookConfig = getSavedWebhookConfig;

export function saveWebhookConfig(config: Partial<WebhookConfig>) {
  try {
    if (config.webhookUrl !== undefined) localStorage.setItem(WEBHOOK_STORAGE_KEY, config.webhookUrl);
    if (config.botName !== undefined) localStorage.setItem(BOT_NAME_KEY, config.botName);
    if (config.botAvatar !== undefined) localStorage.setItem(BOT_AVATAR_KEY, config.botAvatar);
    if (config.autoSendOnSave !== undefined) localStorage.setItem(AUTO_WEBHOOK_KEY, config.autoSendOnSave ? 'true' : 'false');
    
    // Sync all webhooks bundle to Firestore
    syncAllWebhooksToFirestore();
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
    syncAllWebhooksToFirestore();
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
    syncAllWebhooksToFirestore();
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
    syncAllWebhooksToFirestore();
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
    syncAllWebhooksToFirestore();
  } catch (e) {
    console.error('Failed to save discharge webhook settings', e);
  }
}

export function getSavedPinResetWebhookConfig(): WebhookConfig {
  try {
    const savedUrl = localStorage.getItem(PIN_RESET_WEBHOOK_STORAGE_KEY);
    const effectiveUrl = (savedUrl && savedUrl.trim()) ? savedUrl : DEFAULT_PIN_RESET_WEBHOOK_URL;
    return {
      webhookUrl: effectiveUrl,
      botName: localStorage.getItem(PIN_RESET_BOT_NAME_KEY) || 'HSPD Security & Credentials HQ',
      botAvatar: localStorage.getItem(PIN_RESET_BOT_AVATAR_KEY) || 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
      autoSendOnSave: localStorage.getItem(PIN_RESET_AUTO_SEND_KEY) !== 'false'
    };
  } catch {
    return {
      webhookUrl: DEFAULT_PIN_RESET_WEBHOOK_URL,
      botName: 'HSPD Security & Credentials HQ',
      botAvatar: 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
      autoSendOnSave: true
    };
  }
}

export function savePinResetWebhookConfig(config: Partial<WebhookConfig>) {
  try {
    if (config.webhookUrl !== undefined) localStorage.setItem(PIN_RESET_WEBHOOK_STORAGE_KEY, config.webhookUrl);
    if (config.botName !== undefined) localStorage.setItem(PIN_RESET_BOT_NAME_KEY, config.botName);
    if (config.botAvatar !== undefined) localStorage.setItem(PIN_RESET_BOT_AVATAR_KEY, config.botAvatar);
    if (config.autoSendOnSave !== undefined) localStorage.setItem(PIN_RESET_AUTO_SEND_KEY, config.autoSendOnSave ? 'true' : 'false');
    syncAllWebhooksToFirestore();
  } catch (e) {
    console.error('Failed to save pin reset webhook settings', e);
  }
}

export function getSavedRosterWebhookConfig(): WebhookConfig {
  try {
    return {
      webhookUrl: localStorage.getItem(ROSTER_WEBHOOK_STORAGE_KEY) || localStorage.getItem(PROMOTION_WEBHOOK_STORAGE_KEY) || localStorage.getItem(WEBHOOK_STORAGE_KEY) || '',
      botName: localStorage.getItem(ROSTER_BOT_NAME_KEY) || 'HSPD Personnel & Roster Bureau',
      botAvatar: localStorage.getItem(ROSTER_BOT_AVATAR_KEY) || 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
      autoSendOnSave: localStorage.getItem(ROSTER_AUTO_SEND_KEY) !== 'false'
    };
  } catch {
    return {
      webhookUrl: '',
      botName: 'HSPD Personnel & Roster Bureau',
      botAvatar: 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
      autoSendOnSave: true
    };
  }
}

export function saveRosterWebhookConfig(config: Partial<WebhookConfig>) {
  try {
    if (config.webhookUrl !== undefined) localStorage.setItem(ROSTER_WEBHOOK_STORAGE_KEY, config.webhookUrl);
    if (config.botName !== undefined) localStorage.setItem(ROSTER_BOT_NAME_KEY, config.botName);
    if (config.botAvatar !== undefined) localStorage.setItem(ROSTER_BOT_AVATAR_KEY, config.botAvatar);
    if (config.autoSendOnSave !== undefined) localStorage.setItem(ROSTER_AUTO_SEND_KEY, config.autoSendOnSave ? 'true' : 'false');
    syncAllWebhooksToFirestore();
  } catch (e) {
    console.error('Failed to save roster webhook settings', e);
  }
}

export function getSavedDetectiveWebhookConfig(): WebhookConfig {
  try {
    return {
      webhookUrl: localStorage.getItem(DETECTIVE_WEBHOOK_STORAGE_KEY) || localStorage.getItem(WEBHOOK_STORAGE_KEY) || '',
      botName: localStorage.getItem(DETECTIVE_BOT_NAME_KEY) || 'HSPD Detective Bureau & CID',
      botAvatar: localStorage.getItem(DETECTIVE_BOT_AVATAR_KEY) || 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
      autoSendOnSave: localStorage.getItem(DETECTIVE_AUTO_SEND_KEY) !== 'false'
    };
  } catch {
    return {
      webhookUrl: '',
      botName: 'HSPD Detective Bureau & CID',
      botAvatar: 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
      autoSendOnSave: true
    };
  }
}

export function saveDetectiveWebhookConfig(config: Partial<WebhookConfig>) {
  try {
    if (config.webhookUrl !== undefined) localStorage.setItem(DETECTIVE_WEBHOOK_STORAGE_KEY, config.webhookUrl);
    if (config.botName !== undefined) localStorage.setItem(DETECTIVE_BOT_NAME_KEY, config.botName);
    if (config.botAvatar !== undefined) localStorage.setItem(DETECTIVE_BOT_AVATAR_KEY, config.botAvatar);
    if (config.autoSendOnSave !== undefined) localStorage.setItem(DETECTIVE_AUTO_SEND_KEY, config.autoSendOnSave ? 'true' : 'false');
    syncAllWebhooksToFirestore();
  } catch (e) {
    console.error('Failed to save detective webhook settings', e);
  }
}

export function getSavedBoloWebhookConfig(): WebhookConfig {
  try {
    return {
      webhookUrl: localStorage.getItem(BOLO_WEBHOOK_STORAGE_KEY) || localStorage.getItem(WEBHOOK_STORAGE_KEY) || '',
      botName: localStorage.getItem(BOLO_BOT_NAME_KEY) || 'HSPD BOLO & Dispatch HQ',
      botAvatar: localStorage.getItem(BOLO_BOT_AVATAR_KEY) || 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
      autoSendOnSave: localStorage.getItem(BOLO_AUTO_SEND_KEY) !== 'false'
    };
  } catch {
    return {
      webhookUrl: '',
      botName: 'HSPD BOLO & Dispatch HQ',
      botAvatar: 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
      autoSendOnSave: true
    };
  }
}

export function saveBoloWebhookConfig(config: Partial<WebhookConfig>) {
  try {
    if (config.webhookUrl !== undefined) localStorage.setItem(BOLO_WEBHOOK_STORAGE_KEY, config.webhookUrl);
    if (config.botName !== undefined) localStorage.setItem(BOLO_BOT_NAME_KEY, config.botName);
    if (config.botAvatar !== undefined) localStorage.setItem(BOLO_BOT_AVATAR_KEY, config.botAvatar);
    if (config.autoSendOnSave !== undefined) localStorage.setItem(BOLO_AUTO_SEND_KEY, config.autoSendOnSave ? 'true' : 'false');
    syncAllWebhooksToFirestore();
  } catch (e) {
    console.error('Failed to save BOLO webhook settings', e);
  }
}

export function getSavedImpoundWebhookConfig(): WebhookConfig {
  try {
    return {
      webhookUrl: localStorage.getItem(IMPOUND_WEBHOOK_STORAGE_KEY) || localStorage.getItem(WEBHOOK_STORAGE_KEY) || '',
      botName: localStorage.getItem(IMPOUND_BOT_NAME_KEY) || 'HSPD Traffic Enforcement & Impound Lot',
      botAvatar: localStorage.getItem(IMPOUND_BOT_AVATAR_KEY) || 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
      autoSendOnSave: localStorage.getItem(IMPOUND_AUTO_SEND_KEY) !== 'false'
    };
  } catch {
    return {
      webhookUrl: '',
      botName: 'HSPD Traffic Enforcement & Impound Lot',
      botAvatar: 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
      autoSendOnSave: true
    };
  }
}

export function saveImpoundWebhookConfig(config: Partial<WebhookConfig>) {
  try {
    if (config.webhookUrl !== undefined) localStorage.setItem(IMPOUND_WEBHOOK_STORAGE_KEY, config.webhookUrl);
    if (config.botName !== undefined) localStorage.setItem(IMPOUND_BOT_NAME_KEY, config.botName);
    if (config.botAvatar !== undefined) localStorage.setItem(IMPOUND_BOT_AVATAR_KEY, config.botAvatar);
    if (config.autoSendOnSave !== undefined) localStorage.setItem(IMPOUND_AUTO_SEND_KEY, config.autoSendOnSave ? 'true' : 'false');
    syncAllWebhooksToFirestore();
  } catch (e) {
    console.error('Failed to save impound webhook settings', e);
  }
}

export function getSavedVaultWebhookConfig(): WebhookConfig {
  try {
    return {
      webhookUrl: localStorage.getItem(VAULT_WEBHOOK_STORAGE_KEY) || localStorage.getItem(WEBHOOK_STORAGE_KEY) || '',
      botName: localStorage.getItem(VAULT_BOT_NAME_KEY) || 'HSPD Vault & Armory Bureau',
      botAvatar: localStorage.getItem(VAULT_BOT_AVATAR_KEY) || 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
      autoSendOnSave: localStorage.getItem(VAULT_AUTO_SEND_KEY) !== 'false'
    };
  } catch {
    return {
      webhookUrl: '',
      botName: 'HSPD Vault & Armory Bureau',
      botAvatar: 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
      autoSendOnSave: true
    };
  }
}

export function saveVaultWebhookConfig(config: Partial<WebhookConfig>) {
  try {
    if (config.webhookUrl !== undefined) localStorage.setItem(VAULT_WEBHOOK_STORAGE_KEY, config.webhookUrl);
    if (config.botName !== undefined) localStorage.setItem(VAULT_BOT_NAME_KEY, config.botName);
    if (config.botAvatar !== undefined) localStorage.setItem(VAULT_BOT_AVATAR_KEY, config.botAvatar);
    if (config.autoSendOnSave !== undefined) localStorage.setItem(VAULT_AUTO_SEND_KEY, config.autoSendOnSave ? 'true' : 'false');
    syncAllWebhooksToFirestore();
  } catch (e) {
    console.error('Failed to save vault webhook settings', e);
  }
}

export function getSavedDestructionWebhookConfig(): WebhookConfig {
  try {
    return {
      webhookUrl: localStorage.getItem(DESTRUCTION_WEBHOOK_STORAGE_KEY) || localStorage.getItem(WEBHOOK_STORAGE_KEY) || '',
      botName: localStorage.getItem(DESTRUCTION_BOT_NAME_KEY) || 'HSPD Evidence & Smelting Registry',
      botAvatar: localStorage.getItem(DESTRUCTION_BOT_AVATAR_KEY) || 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
      autoSendOnSave: localStorage.getItem(DESTRUCTION_AUTO_SEND_KEY) !== 'false'
    };
  } catch {
    return {
      webhookUrl: '',
      botName: 'HSPD Evidence & Smelting Registry',
      botAvatar: 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
      autoSendOnSave: true
    };
  }
}

export function saveDestructionWebhookConfig(config: Partial<WebhookConfig>) {
  try {
    if (config.webhookUrl !== undefined) localStorage.setItem(DESTRUCTION_WEBHOOK_STORAGE_KEY, config.webhookUrl);
    if (config.botName !== undefined) localStorage.setItem(DESTRUCTION_BOT_NAME_KEY, config.botName);
    if (config.botAvatar !== undefined) localStorage.setItem(DESTRUCTION_BOT_AVATAR_KEY, config.botAvatar);
    if (config.autoSendOnSave !== undefined) localStorage.setItem(DESTRUCTION_AUTO_SEND_KEY, config.autoSendOnSave ? 'true' : 'false');
    syncAllWebhooksToFirestore();
  } catch (e) {
    console.error('Failed to save destruction webhook settings', e);
  }
}

export function getSavedDocumentWebhookConfig(): WebhookConfig {
  try {
    return {
      webhookUrl: localStorage.getItem(DOCUMENT_WEBHOOK_STORAGE_KEY) || localStorage.getItem(ROSTER_WEBHOOK_STORAGE_KEY) || localStorage.getItem(WEBHOOK_STORAGE_KEY) || '',
      botName: localStorage.getItem(DOCUMENT_BOT_NAME_KEY) || 'HSPD Document Archives & Legal Bureau',
      botAvatar: localStorage.getItem(DOCUMENT_BOT_AVATAR_KEY) || 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
      autoSendOnSave: localStorage.getItem(DOCUMENT_AUTO_SEND_KEY) !== 'false'
    };
  } catch {
    return {
      webhookUrl: '',
      botName: 'HSPD Document Archives & Legal Bureau',
      botAvatar: 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
      autoSendOnSave: true
    };
  }
}

export function saveDocumentWebhookConfig(config: Partial<WebhookConfig>) {
  try {
    if (config.webhookUrl !== undefined) localStorage.setItem(DOCUMENT_WEBHOOK_STORAGE_KEY, config.webhookUrl);
    if (config.botName !== undefined) localStorage.setItem(DOCUMENT_BOT_NAME_KEY, config.botName);
    if (config.botAvatar !== undefined) localStorage.setItem(DOCUMENT_BOT_AVATAR_KEY, config.botAvatar);
    if (config.autoSendOnSave !== undefined) localStorage.setItem(DOCUMENT_AUTO_SEND_KEY, config.autoSendOnSave ? 'true' : 'false');
    syncAllWebhooksToFirestore();
  } catch (e) {
    console.error('Failed to save document webhook settings', e);
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
/**
 * Send a Dedicated Duty Report (10-8 On Duty / 10-7 Off Duty / 10-6 Busy) to Duty Discord Webhook with evidence attachments
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

  const dateObj = new Date(duty.timestamp || Date.now());
  const dateFullStr = dateObj.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const dateStr = dateObj.toLocaleString('id-ID', {
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  // Color mapping & Status labels (8-1-1 On Duty / 8-1-0 Off Duty)
  const isOnDuty = duty.status === '8-1-1' || duty.status === '10-8';
  const isOffDuty = duty.status === '8-1-0' || duty.status === '10-7';

  let embedColor = 0x10B981; // 8-1-1 Emerald Green
  let statusBadge = '🟢 8-1-1 ON DUTY';
  let titleIcon = '🟢';
  let titleText = '🟢 [HSPD CAD] LAPORAN MEMULAI DINAS (8-1-1 ON DUTY)';
  let descText = 'Petugas Kepolisian Highstate Roleplay telah resmi mengaktifkan status tugas patroli dan siap siaga menjaga keamanan kota.';

  if (isOffDuty) {
    embedColor = 0xEF4444; // 8-1-0 Red
    statusBadge = '🔴 8-1-0 OFF DUTY';
    titleIcon = '🔴';
    titleText = '🔴 [HSPD CAD] LAPORAN SELESAI DINAS & LEPAS PIKET (8-1-0 OFF DUTY)';
    descText = 'Petugas Kepolisian Highstate Roleplay telah menyelesaikan seluruh rangkaian shift operasional, penyerahan inventaris, dan resmi lepas dinas.';
  } else if (duty.status === '10-6') {
    embedColor = 0xF59E0B; // 10-6 Amber
    statusBadge = '🟡 10-6 BUSY (SEDANG PENANGANAN KASUS)';
    titleIcon = '🟡';
    titleText = '🟡 [HSPD CAD] LAPORAN STATUS PENANGANAN (10-6 BUSY)';
    descText = 'Petugas sedang menangani kasus / sidang / investigasi khusus dan tidak dapat merespons panggilan reguler sementara waktu.';
  } else if (duty.status === '10-97') {
    embedColor = 0x3B82F6; // 10-97 Blue
    statusBadge = '🔵 10-97 ON SCENE (TIBA DI LOKASI)';
    titleIcon = '🔵';
    titleText = '🔵 [HSPD CAD] LAPORAN TIBA DI LOKASI (10-97 ON SCENE)';
    descText = 'Unit kepolisian telah tiba di tempat kejadian perkara (TKP) / titik operasi.';
  }

  // Collect all attached images in order
  const attachedImages: { urlOrData: string; label: string }[] = [];

  if (isOnDuty) {
    if (duty.onDutyPhoneImage && duty.onDutyPhoneImage.trim()) {
      attachedImages.push({ urlOrData: duty.onDutyPhoneImage.trim(), label: 'Foto Layar HP Sebelum On Duty (8-1-1)' });
    }
  } else if (isOffDuty) {
    if (duty.offDutyActivityImage1 && duty.offDutyActivityImage1.trim()) {
      attachedImages.push({ urlOrData: duty.offDutyActivityImage1.trim(), label: 'Foto Dokumentasi Kegiatan 1' });
    }
    if (duty.offDutyActivityImage2 && duty.offDutyActivityImage2.trim()) {
      attachedImages.push({ urlOrData: duty.offDutyActivityImage2.trim(), label: 'Foto Dokumentasi Kegiatan 2' });
    }
    if (duty.offDutyPhoneImage && duty.offDutyPhoneImage.trim()) {
      attachedImages.push({ urlOrData: duty.offDutyPhoneImage.trim(), label: 'Foto Layar HP Selesai Dinas (8-1-0)' });
    }
  }

  // Fallback for general evidence images array if present and attachedImages is empty
  if (attachedImages.length === 0 && duty.evidenceImages && Array.isArray(duty.evidenceImages)) {
    duty.evidenceImages.filter(Boolean).forEach((img, i) => {
      attachedImages.push({ urlOrData: img, label: `Foto Bukti Dinas #${i + 1}` });
    });
  }

  const fields: any[] = [
    {
      name: '👮 Identitas Personel',
      value: `**${duty.officerName}**\nNomor Badge: \`${duty.officerBadge}\`\nPangkat: **${duty.officerRank}**`,
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

  // Specific detail fields
  if (isOffDuty) {
    if (duty.durationFormatted || (duty.durationMinutes !== undefined && duty.durationMinutes >= 0)) {
      fields.push({
        name: '⏱️ Total Durasi Dinas (Shift Duration)',
        value: `**${duty.durationFormatted || `${duty.durationMinutes} Menit`}**`,
        inline: false,
      });
    }

    const startTimeStr = duty.dutyStartTime && duty.dutyStartTime > 0
      ? new Date(duty.dutyStartTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB'
      : '-';

    const endTimeStr = new Date(duty.dutyEndTime || duty.timestamp || Date.now()).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }) + ' WIB';

    fields.push(
      {
        name: '🕒 Mulai Dinas (8-1-1)',
        value: `\`${startTimeStr}\``,
        inline: true,
      },
      {
        name: '🏁 Selesai Dinas (8-1-0)',
        value: `\`${endTimeStr}\``,
        inline: true,
      },
      {
        name: '📅 Tanggal Lepas Piket',
        value: `\`${dateFullStr}\``,
        inline: true,
      }
    );

    // 8-1-0 Evidence Breakdown
    const hasAnyOffDutyPhoto = duty.offDutyActivityImage1 || duty.offDutyActivityImage2 || duty.offDutyPhoneImage || attachedImages.length > 0;
    fields.push({
      name: '📸 Dokumentasi & Berkas Lampiran (3 Foto)',
      value: [
        `1. 🚔 **Foto Kegiatan Patroli #1**: ${duty.offDutyActivityImage1 ? '✅ *Terlampir*' : '⚠️ *Tidak dilampirkan*'}`,
        `2. 🚔 **Foto Kegiatan Patroli #2**: ${duty.offDutyActivityImage2 ? '✅ *Terlampir*' : '⚠️ *Tidak dilampirkan*'}`,
        `3. 📱 **Foto HP Selesai Dinas (8-1-0)**: ${duty.offDutyPhoneImage ? '✅ *Terlampir*' : '⚠️ *Tidak dilampirkan*'}`
      ].join('\n'),
      inline: false,
    });
  } else if (isOnDuty) {
    const startTimeStr = new Date(duty.dutyStartTime || duty.timestamp || Date.now()).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }) + ' WIB';

    fields.push(
      {
        name: '🕒 Jam Mulai Dinas (8-1-1)',
        value: `\`${startTimeStr}\``,
        inline: true,
      },
      {
        name: '📅 Tanggal Dinas',
        value: `\`${dateFullStr}\``,
        inline: true,
      },
      {
        name: '📱 Bukti Layar HP Awal (8-1-1)',
        value: duty.onDutyPhoneImage ? '✅ **Foto HP Sebelum On Duty Terverifikasi**' : '⚠️ *Tidak dilampirkan*',
        inline: true,
      }
    );
  }

  // Include optional fields if provided
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
      name: isOffDuty ? '📋 Activity / Kegiatan Dinas' : '📝 Catatan / Rencana Tugas',
      value: `>>> ${duty.notes}`,
      inline: false,
    });
  }

  const primaryEmbed: any = {
    title: titleText,
    description: descText,
    color: embedColor,
    fields,
    footer: {
      text: `HSPD CAD Duty Dispatch Terminal • Highstate Roleplay • ${dateStr}`,
      icon_url: config.botAvatar.trim() || 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
    },
    timestamp: new Date(duty.timestamp || Date.now()).toISOString(),
  };

  const embeds = [primaryEmbed];

  // Process attachments and multipart upload if any
  const formData = new FormData();
  let hasFileAttachments = false;
  let fileIndex = 0;

  attachedImages.forEach((item, idx) => {
    const imgStr = item.urlOrData;
    if (imgStr.startsWith('data:image/')) {
      hasFileAttachments = true;
      const { blob, extension } = dataURLtoBlob(imgStr);
      const filename = `duty_proof_${idx + 1}_${Date.now()}.${extension}`;
      formData.append(`files[${fileIndex}]`, blob, filename);

      if (idx === 0) {
        primaryEmbed.image = { url: `attachment://${filename}` };
      } else {
        // Multi-image gallery embeds
        embeds.push({
          url: 'https://highstate.roleplay/duty-evidence',
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
          url: 'https://highstate.roleplay/duty-evidence',
          image: { url: imgStr },
          color: embedColor,
        });
      }
    }
  });

  try {
    if (hasFileAttachments) {
      const payload = {
        username: config.botName.trim() || 'HSPD Duty Logger',
        avatar_url: config.botAvatar.trim() || 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
        embeds: embeds.slice(0, 10),
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
        message: `Laporan status dinas [${statusBadge}] atas nama ${duty.officerName} beserta ${attachedImages.length} foto bukti berhasil dikirim ke Discord!`
      };
    } else {
      const payload = {
        username: config.botName.trim() || 'HSPD Duty Logger',
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
        message: `Status dinas [${statusBadge}] atas nama ${duty.officerName} berhasil dikirim ke Webhook Duty Log!`
      };
    }
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
 * Test ping for PIN Reset & Credentials Security Webhook
 */
export async function testPinResetDiscordWebhook(config: WebhookConfig): Promise<{ success: boolean; message: string }> {
  if (!config.webhookUrl || !config.webhookUrl.trim().startsWith('http')) {
    return {
      success: false,
      message: 'Masukkan URL Discord Webhook Reset PIN yang valid (dimulai dengan https://discord.com/api/webhooks/...)'
    };
  }

  const payload = {
    username: config.botName.trim() || 'HSPD Security & Credentials HQ',
    avatar_url: config.botAvatar.trim() || 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
    embeds: [
      {
        title: '🔑 UJI COBA INTEGRASI WEBHOOK RESET PIN & KREDENSIAL',
        description: 'Koneksi laporan permohonan reset password & otorisasi kredensial terminal MDT berhasil terhubung.',
        color: 0x10B981,
        fields: [
          { name: 'Channel Target', value: '🟢 **PIN Reset / Credentials Helpdesk**', inline: true },
          { name: 'Waktu Pengujian', value: new Date().toLocaleString('id-ID'), inline: true },
          { name: 'Status Sistem', value: '🟢 **Ready for PIN & Auth Alerts**', inline: true },
        ],
        footer: {
          text: 'HSPD Security & CAD Headquarters • HighState Roleplay',
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
      message: '✅ Sinyal Webhook Reset PIN & Kredensial Berhasil Terhubung!'
    };
  } catch (err: any) {
    return {
      success: false,
      message: `❌ Gagal terhubung ke Webhook Reset PIN: ${err.message || 'Periksa kembali URL Webhook'}`
    };
  }
}

/**
 * Test ping for Roster & Member Information Webhook
 */
export async function testRosterDiscordWebhook(config: WebhookConfig): Promise<{ success: boolean; message: string }> {
  if (!config.webhookUrl || !config.webhookUrl.trim().startsWith('http')) {
    return {
      success: false,
      message: 'Masukkan URL Discord Webhook Roster / Anggota yang valid (dimulai dengan https://discord.com/api/webhooks/...)'
    };
  }

  const payload = {
    username: config.botName.trim() || 'HSPD Personnel & Roster Bureau',
    avatar_url: config.botAvatar.trim() || 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
    embeds: [
      {
        title: '🛡️ UJI COBA INTEGRASI WEBHOOK ROSTER & INFORMASI ANGGOTA',
        description: 'Koneksi siaran pendaftaran personel baru & pembaruan database anggota kepolisian berhasil terhubung.',
        color: 0x3B82F6,
        fields: [
          { name: 'Channel Target', value: '🟢 **Roster & Personnel Directory**', inline: true },
          { name: 'Waktu Pengujian', value: new Date().toLocaleString('id-ID'), inline: true },
          { name: 'Status Sistem', value: '🟢 **Ready for Roster Announcements**', inline: true },
        ],
        footer: {
          text: 'HSPD Personnel Bureau • HighState Roleplay',
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
      message: '✅ Sinyal Webhook Roster & Personel Berhasil Terhubung!'
    };
  } catch (err: any) {
    return {
      success: false,
      message: `❌ Gagal terhubung ke Webhook Roster: ${err.message || 'Periksa kembali URL Webhook'}`
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
  const config = { ...getSavedPinResetWebhookConfig(), ...params.customConfig };

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
  const config = { ...getSavedPinResetWebhookConfig(), ...params.customConfig };

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
    username: config.botName.trim() || 'HSPD Security & Credentials HQ',
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

/**
 * Send Auto-Granted PIN Reset Announcement to Discord Webhook when Superiors are Offline
 */
export async function sendPinResetAutoGrantedWebhookToDiscord(params: {
  officerName: string;
  officerBadge: string;
  officerRank?: string;
  newPin: string;
  reason?: string;
  customConfig?: Partial<WebhookConfig>;
}): Promise<{ success: boolean; message: string }> {
  const config = { ...getSavedPinResetWebhookConfig(), ...params.customConfig };

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

  const effectiveRank = params.officerRank;
  const fields = [
    {
      name: '👮 PERSONEL KEPOLISIAN',
      value: `Nama: **${params.officerName}**\nBadge: \`${params.officerBadge}\`${effectiveRank ? `\nPangkat: **${effectiveRank}**` : ''}`,
      inline: true,
    },
    {
      name: '⚡ STATUS EKSEKUSI SISTEM',
      value: `🤖 **AUTO-GRANTED (ATASAN OFFLINE)**\n*Diberikan otomatis demi kelancaran tugas patroli*`,
      inline: true,
    },
    {
      name: '🕒 WAKTU PEMBERIAN AKSES',
      value: `${dateStr}`,
      inline: true,
    },
    {
      name: '🔒 PIN BARU YANG DIAKTIFKAN',
      value: `\`${params.newPin}\` *(Telah aktif di database MDT)*`,
      inline: true,
    },
    {
      name: '🛡️ KEBIJAKAN OTOMATISASI',
      value: `✅ **Lolos Verifikasi Identitas Roster**\nSistem mengaktifkan PIN karena seluruh Supervisor/High Command sedang tidak login di website.`,
      inline: false,
    },
    {
      name: '📝 ALASAN PENGAJUAN AWAL',
      value: `>>> *${params.reason || 'Permohonan reset/lupa PIN login terminal MDT CAD.'}*`,
      inline: false,
    }
  ];

  const embedObj = {
    title: `⚡ [SISTEM OTOMATIS] AKSES & RESET PIN DISAHKAN (HIGH COMMAND OFFLINE)`,
    description: `Pemberitahuan Sistem Keamanan MDT: Personel **${params.officerName} (${params.officerBadge})** telah diberikan akses & PIN login baru secara otomatis oleh sistem karena tidak ada Supervisor/High Command yang sedang aktif/login di website.`,
    color: 0x06B6D4, // Cyan / Neon
    fields,
    footer: {
      text: `HSPD Automated Access Control • Highstate Roleplay • ${dateStr}`,
      icon_url: config.botAvatar.trim() || 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
    },
    timestamp: new Date().toISOString(),
  };

  const payload = {
    username: config.botName.trim() || 'HSPD Auto-Dispatch Security',
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
      message: `Notifikasi pemberian akses otomatis untuk ${params.officerName} berhasil dikirim ke Webhook Discord!`
    };
  } catch (err: any) {
    console.error('PIN Auto-Grant Webhook Error:', err);
    return {
      success: false,
      message: `Gagal mengirim notifikasi auto-grant ke Discord: ${err.message || 'Cek koneksi'}`
    };
  }
}

/**
 * Send New Officer Induction / Registration & Login Credentials to Discord Webhook
 */
export async function sendNewOfficerRegistrationToDiscord(params: {
  officerName: string;
  officerBadge: string;
  officerRank: string;
  officerDivision: string;
  officerPhone?: string;
  discordTag?: string;
  initialPin: string;
  registeredBy: string;
  registeredByBadge: string;
  registeredByRank: string;
  customConfig?: Partial<WebhookConfig>;
}): Promise<{ success: boolean; message: string }> {
  const config = { ...getSavedRosterWebhookConfig(), ...params.customConfig };

  if (!config.webhookUrl || !config.webhookUrl.trim().startsWith('http')) {
    return {
      success: false,
      message: 'URL Webhook Discord belum disetting. Silakan atur di Pengaturan Webhook.'
    };
  }

  const now = new Date();
  const dateStr = now.toLocaleDateString('id-ID', {
    month: 'numeric',
    day: 'numeric',
    year: '2-digit'
  }) + ', ' + now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  // Calculate Discord mention string if Discord username / ID is provided
  let mentionContent = '';
  let formattedDiscordValue = '`-`';
  if (params.discordTag && params.discordTag.trim()) {
    const rawTag = params.discordTag.trim();
    if (rawTag.startsWith('<@') && rawTag.endsWith('>')) {
      mentionContent = rawTag;
      formattedDiscordValue = rawTag;
    } else if (/^\d{17,20}$/.test(rawTag)) {
      // Numeric Discord User ID
      mentionContent = `<@${rawTag}>`;
      formattedDiscordValue = `<@${rawTag}> (\`${rawTag}\`)`;
    } else {
      // Discord Username / Tag
      const cleanUsername = rawTag.replace(/^@/, '');
      mentionContent = `@${cleanUsername}`;
      formattedDiscordValue = `\`@${cleanUsername}\``;
    }
  }

  // Primary Embed: Matches the user's requested "Cek Akun | High State" format
  const fields = [
    {
      name: 'UCP',
      value: `${params.officerName}`,
      inline: true,
    },
    {
      name: 'Pin Code',
      value: `\`${params.initialPin}\``,
      inline: true,
    },
    {
      name: 'Badge & Pangkat',
      value: `\`${params.officerBadge}\` • **${params.officerRank}**`,
      inline: true,
    },
    {
      name: 'Discord',
      value: formattedDiscordValue,
      inline: true,
    },
    {
      name: 'Divisi Penugasan',
      value: `${params.officerDivision}`,
      inline: true,
    },
    {
      name: 'Diresmikan Oleh',
      value: `${params.registeredByRank} ${params.registeredBy} (\`${params.registeredByBadge}\`)`,
      inline: true,
    },
    {
      name: 'Note',
      value: 'Jangan beritahu informasi ini kepada orang lain!\n*Gunakan nama UCP / Badge dan Pin Code di atas untuk login ke Terminal MDT Kepolisian.*',
      inline: false,
    }
  ];

  const embedObj = {
    title: `✅ Berhasil!`,
    description: `Berikut adalah detail dari akun UCP Anda:`,
    color: 0x22C55E, // Emerald Green #22C55E
    fields,
    footer: {
      text: `Bot High State • ${dateStr}`,
      icon_url: config.botAvatar.trim() || 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
    },
    timestamp: now.toISOString(),
  };

  const payload: Record<string, any> = {
    username: config.botName.trim() || 'Cek Akun | High State',
    avatar_url: config.botAvatar.trim() || 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
    embeds: [embedObj],
  };

  if (mentionContent) {
    payload.content = `${mentionContent} Halo! Akun UCP Anda telah didaftarkan oleh Atasan Kepolisian:`;
  }

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
      message: `Pemberitahuan akun ${params.officerName} (${params.discordTag || 'Tanpa Discord'}) berhasil dikirim ke Webhook Discord!`
    };
  } catch (err: any) {
    console.error('New Officer Webhook Error:', err);
    return {
      success: false,
      message: `Gagal mengirim ke Discord: ${err.message || 'Cek koneksi'}`
    };
  }
}

/**
 * Send / Resend Officer Login Credentials to Discord
 */
export async function sendOfficerLoginCredentialsToDiscord(params: {
  officerName: string;
  officerBadge: string;
  officerRank: string;
  officerDivision: string;
  pin: string;
  discordTag?: string;
  sentBy: string;
  sentByBadge: string;
  sentByRank: string;
  customConfig?: Partial<WebhookConfig>;
}): Promise<{ success: boolean; message: string }> {
  const config = { ...getSavedRosterWebhookConfig(), ...params.customConfig };

  if (!config.webhookUrl || !config.webhookUrl.trim().startsWith('http')) {
    return {
      success: false,
      message: 'URL Webhook Discord belum disetting. Silakan atur di Pengaturan Webhook.'
    };
  }

  const now = new Date();
  const dateStr = now.toLocaleDateString('id-ID', {
    month: 'numeric',
    day: 'numeric',
    year: '2-digit'
  }) + ', ' + now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  let mentionContent = '';
  let formattedDiscordValue = '`-`';
  if (params.discordTag && params.discordTag.trim()) {
    const rawTag = params.discordTag.trim();
    if (rawTag.startsWith('<@') && rawTag.endsWith('>')) {
      mentionContent = rawTag;
      formattedDiscordValue = rawTag;
    } else if (/^\d{17,20}$/.test(rawTag)) {
      mentionContent = `<@${rawTag}>`;
      formattedDiscordValue = `<@${rawTag}> (\`${rawTag}\`)`;
    } else {
      const cleanUsername = rawTag.replace(/^@/, '');
      mentionContent = `@${cleanUsername}`;
      formattedDiscordValue = `\`@${cleanUsername}\``;
    }
  }

  const fields = [
    {
      name: 'UCP',
      value: `${params.officerName}`,
      inline: true,
    },
    {
      name: 'Pin Code',
      value: `\`${params.pin}\``,
      inline: true,
    },
    {
      name: 'Badge & Pangkat',
      value: `\`${params.officerBadge}\` • **${params.officerRank}**`,
      inline: true,
    },
    {
      name: 'Discord',
      value: formattedDiscordValue,
      inline: true,
    },
    {
      name: 'Divisi Penugasan',
      value: `${params.officerDivision}`,
      inline: true,
    },
    {
      name: 'Note',
      value: 'Jangan beritahu informasi ini kepada orang lain!\n*Gunakan nama UCP / Badge dan Pin Code di atas untuk login ke Terminal MDT Kepolisian.*',
      inline: false,
    }
  ];

  const embedObj = {
    title: `✅ Berhasil!`,
    description: `Berikut adalah detail dari akun UCP Anda:`,
    color: 0x22C55E,
    fields,
    footer: {
      text: `Bot High State • ${dateStr}`,
      icon_url: config.botAvatar.trim() || 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
    },
    timestamp: now.toISOString(),
  };

  const payload: Record<string, any> = {
    username: config.botName.trim() || 'Cek Akun | High State',
    avatar_url: config.botAvatar.trim() || 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
    embeds: [embedObj],
  };

  if (mentionContent) {
    payload.content = `${mentionContent} Halo! Berikut adalah detail kredensial akun UCP Anda yang dikirim oleh Atasan (${params.sentByRank} ${params.sentBy}):`;
  }

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
      message: `Kredensial login akun ${params.officerName} berhasil dikirim ke Webhook Discord!`
    };
  } catch (err: any) {
    console.error('Send Credentials Webhook Error:', err);
    return {
      success: false,
      message: `Gagal mengirim ke Discord: ${err.message || 'Cek koneksi'}`
    };
  }
}

/**
 * Send Direct Message (PM / DM) directly to officer's Discord Inbox via Bot
 */
export async function sendOfficerDirectMessageViaBot(params: {
  userId?: string;
  discordUserId?: string;
  officerName: string;
  pin: string;
  officerBadge?: string;
  badge?: string;
  officerRank?: string;
  rank?: string;
  officerDivision?: string;
  division?: string;
  customNote?: string;
  note?: string;
  customBotToken?: string;
  botName?: string;
  botAvatar?: string;
  avatarUrl?: string;
  embedTitle?: string;
  title?: string;
  embedDescription?: string;
  description?: string;
  embedColor?: string;
  color?: string;
  footerText?: string;
  customMessage?: string;
}): Promise<{ success: boolean; message: string }> {
  const botConfig = getSavedDiscordBotConfig();
  const token = (params.customBotToken || botConfig.botToken || '').trim();
  const rawId = params.discordUserId || params.userId || '';

  // Extract clean numeric digits
  const cleanId = rawId.toString().replace(/[^0-9]/g, '');

  if (!cleanId || cleanId.length < 16) {
    return {
      success: false,
      message: `ID Discord '${rawId || ''}' tidak valid. Untuk mengirim Pesan Pribadi (PM) otomatis via Bot, masukkan Discord User ID numerik (17-20 digit angka, contoh: 842019283719001). Caranya: Aktifkan Developer Mode di Discord Settings -> Advanced -> Klik kanan profil -> Copy User ID.`
    };
  }

  try {
    const res = await fetch('/api/discord/send-bot-dm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        botToken: token,
        userId: cleanId,
        officerName: params.officerName,
        pin: params.pin,
        badge: params.officerBadge || params.badge,
        rank: params.officerRank || params.rank,
        division: params.officerDivision || params.division,
        customNote: params.customNote || params.note || botConfig.defaultNote,
        botName: params.botName || botConfig.botName,
        avatarUrl: params.avatarUrl || params.botAvatar || botConfig.botAvatar,
        embedTitle: params.embedTitle || params.title || botConfig.embedTitle,
        embedDescription: params.embedDescription || params.description || botConfig.embedDescription,
        embedColor: params.embedColor || params.color || botConfig.embedColor,
        footerText: params.footerText || botConfig.footerText,
        customMessage: params.customMessage
      })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        success: false,
        message: data.message || `HTTP ${res.status}: Gagal mengirim PM Discord.`
      };
    }

    return {
      success: true,
      message: data.message || `✅ Pesan Pribadi (PM) berhasil dikirim ke akun Discord ${params.officerName}!`
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Gagal menghubungi server: ${err.message || err}`
    };
  }
}

/**
 * Test Direct Message to an Admin's Discord User ID
 */
export async function testDiscordBotDirectMessage(targetUserId: string, customToken?: string): Promise<{ success: boolean; message: string }> {
  return sendOfficerDirectMessageViaBot({
    userId: targetUserId,
    officerName: 'Test Account / Nexia',
    officerBadge: '#001',
    officerRank: 'HIGH COMMAND',
    officerDivision: 'HQ Command',
    pin: '20857',
    customNote: 'Jangan beritahu informasi ini kepada orang lain!',
    customBotToken: customToken
  });
}


/**
 * Send Officer Profile / Member Information Update to Discord Webhook
 */
export async function sendOfficerProfileUpdateToDiscord(params: {
  officerName: string;
  officerBadge: string;
  officerRank: string;
  updateType: 'DIVISI' | 'KONTAK' | 'PROFIL' | 'MUTASI' | 'KREDENSIAL';
  changes: Array<{ label: string; oldValue?: string; newValue: string }>;
  updatedBy: string;
  updatedByBadge: string;
  updatedByRank: string;
  notes?: string;
  customConfig?: Partial<WebhookConfig>;
}): Promise<{ success: boolean; message: string }> {
  const config = { ...getSavedRosterWebhookConfig(), ...params.customConfig };

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

  const fields: Array<{ name: string; value: string; inline?: boolean }> = [
    {
      name: '👮 PERSONEL KEPOLISIAN',
      value: `Nama: **${params.officerName}**\nBadge: \`${params.officerBadge}\`\nPangkat: **${params.officerRank}**`,
      inline: true,
    },
    {
      name: '👑 DIPERBARUI OLEH',
      value: `Nama: **${params.updatedBy}**\nBadge: \`${params.updatedByBadge}\`\nPangkat: **${params.updatedByRank}**`,
      inline: true,
    },
    {
      name: '🕒 WAKTU PEMBARUAN',
      value: `${dateStr}`,
      inline: true,
    },
  ];

  params.changes.forEach((c) => {
    fields.push({
      name: `📋 PERUBAHAN: ${c.label.toUpperCase()}`,
      value: c.oldValue ? `Sebelum: \`${c.oldValue}\` ➔ **Baru:** \`${c.newValue}\`` : `**Nilai Baru:** \`${c.newValue}\``,
      inline: false,
    });
  });

  if (params.notes) {
    fields.push({
      name: '📝 CATATAN ADMINISTRASI',
      value: `>>> *${params.notes}*`,
      inline: false,
    });
  }

  const embedObj = {
    title: `📋 PEMBARUAN DATA & INFORMASI PERSONEL KEPOLISIAN`,
    description: `Telah dilakukan pembaruan data untuk petugas **${params.officerRank} ${params.officerName}** (\`${params.officerBadge}\`) di database Roster Kepolisian HSPD.`,
    color: 0x6366F1, // Indigo
    fields,
    footer: {
      text: `HSPD Personnel & Roster Bureau • Highstate Roleplay • ${dateStr}`,
      icon_url: config.botAvatar.trim() || 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
    },
    timestamp: new Date().toISOString(),
  };

  const payload = {
    username: config.botName.trim() || 'HSPD Personnel & Roster Bureau',
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
      message: `Pembaruan data ${params.officerName} berhasil dikirim ke Webhook Discord!`
    };
  } catch (err: any) {
    console.error('Officer Update Webhook Error:', err);
    return {
      success: false,
      message: `Gagal mengirim ke Discord: ${err.message || 'Cek koneksi'}`
    };
  }
}

/**
 * =========================================================================
 * 1. DETECTIVE BUREAU / CID CASE BOARD WEBHOOK FUNCTIONS
 * =========================================================================
 */
export async function sendDetectiveCaseToDiscord(
  caseItem: DetectiveCase,
  eventType: 'CREATED' | 'UPDATED' | 'WARRANT_ISSUED' | 'SOLVED' | 'EVIDENCE_ADDED',
  actor?: OfficerProfile,
  customConfig?: Partial<WebhookConfig>
): Promise<{ success: boolean; message: string }> {
  const config = { ...getSavedDetectiveWebhookConfig(), ...customConfig };

  if (!config.webhookUrl || !config.webhookUrl.trim().startsWith('http')) {
    return {
      success: false,
      message: 'URL Webhook Discord untuk Kasus Detektif belum disetting.'
    };
  }

  const dateStr = new Date().toLocaleString('id-ID', {
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  // Theme color & event header
  let embedColor = 0x6366F1; // Indigo default
  let eventTitle = `🔍 [CID] BERKAS INVESTIGASI KASUS - ${caseItem.caseNumber}`;
  let eventDesc = `Pembaruan berkas penyelidikan Divisi Reserse Kriminal & Intelijen (Detective Bureau / CID HSPD).`;

  if (eventType === 'CREATED') {
    embedColor = 0x3B82F6; // Blue
    eventTitle = `📂 [CID KASUS BARU] ${caseItem.caseNumber} - ${caseItem.title.toUpperCase()}`;
    eventDesc = `Berkas perkara investigasi baru resmi dibuka oleh Detektif Kepolisian.`;
  } else if (eventType === 'WARRANT_ISSUED' || caseItem.warrantIssued) {
    embedColor = 0xDC2626; // Red
    eventTitle = `⚡ [SURAT PERINTAH / WARRANT] ${caseItem.caseNumber} - ${caseItem.title.toUpperCase()}`;
    eventDesc = `Surat Perintah Penggeledahan / Penangkapan (Search & Arrest Warrant) resmi diterbitkan!`;
  } else if (eventType === 'SOLVED' || caseItem.status === 'SOLVED_CLOSED') {
    embedColor = 0x10B981; // Emerald Green
    eventTitle = `✅ [KASUS TERUNGKAP / SOLVED] ${caseItem.caseNumber} - ${caseItem.title.toUpperCase()}`;
    eventDesc = `Kasus kejahatan telah berhasil diungkap dan ditutup oleh tim penyidik reserse.`;
  } else if (eventType === 'EVIDENCE_ADDED') {
    embedColor = 0x8B5CF6; // Purple
    eventTitle = `📦 [BARANG BUKTI BARU] ${caseItem.caseNumber} - ${caseItem.title.toUpperCase()}`;
    eventDesc = `Barang bukti forensik/balistik baru telah diamankan ke Evidence Locker HSPD.`;
  }

  const fields: Array<{ name: string; value: string; inline?: boolean }> = [
    {
      name: '📁 NOMOR & JUDUL KASUS',
      value: `**${caseItem.title}**\n\`Nomor Berkas: ${caseItem.caseNumber}\``,
      inline: false,
    },
    {
      name: '🕵️ PENYIDIK UTAMA (LEAD DETECTIVE)',
      value: `**${caseItem.leadDetective}** (\`${caseItem.leadDetectiveBadge}\`)\nDivisi: \`${caseItem.division}\``,
      inline: true,
    },
    {
      name: '📊 STATUS & PRIORITAS',
      value: `Status: **${caseItem.status}**\nPrioritas: **${caseItem.priority}**`,
      inline: true,
    },
    {
      name: '📍 LOKASI TKP & TANGGAL KEJADIAN',
      value: `TKP: **${caseItem.location}**\nTanggal: \`${caseItem.incidentDate}\``,
      inline: true,
    }
  ];

  // Suspects info
  if (caseItem.suspects && caseItem.suspects.length > 0) {
    const suspectList = caseItem.suspects.map((s, idx) => {
      const aliasStr = s.alias ? ` ("${s.alias}")` : '';
      const gangStr = s.gangAffiliation ? ` [${s.gangAffiliation}]` : '';
      return `${idx + 1}. **${s.name}**${aliasStr}${gangStr} - \`${s.status}\``;
    }).join('\n');

    fields.push({
      name: `👥 TERSANGKA & TARGET BURON (${caseItem.suspects.length})`,
      value: suspectList.length > 1000 ? `${suspectList.slice(0, 1000)}...` : suspectList,
      inline: false,
    });
  }

  // Evidence info
  if (caseItem.evidences && caseItem.evidences.length > 0) {
    const evidenceList = caseItem.evidences.map((e, idx) => {
      return `${idx + 1}. [**${e.type}**] ${e.title} *(Lokasi: ${e.storageLocation})*`;
    }).join('\n');

    fields.push({
      name: `📦 BARANG BUKTI TERSITA (${caseItem.evidences.length} Item)`,
      value: evidenceList.length > 1000 ? `${evidenceList.slice(0, 1000)}...` : evidenceList,
      inline: false,
    });
  }

  // Warrant Info
  if (caseItem.warrantIssued) {
    fields.push({
      name: '⚡ STATUS SURAT PERINTAH (WARRANT)',
      value: `🚨 **WARRANT AKTIF** - \`${caseItem.warrantNumber || 'ACTIVE-WARRANT'}\`\n*Seluruh unit kepolisian berwenang melakukan penangkapan dan penggeledahan.*`,
      inline: false,
    });
  }

  // Summary
  if (caseItem.summary) {
    fields.push({
      name: '📝 RINGKASAN PERKARA & INTELIJEN',
      value: `>>> ${caseItem.summary}`,
      inline: false,
    });
  }

  // Actor
  if (actor) {
    fields.push({
      name: '👤 PETUGAS PELAPOR',
      value: `**${actor.rank} ${actor.name}** (\`${actor.badge}\`)`,
      inline: true,
    });
  }

  const embedObj = {
    title: eventTitle,
    description: eventDesc,
    color: embedColor,
    fields,
    footer: {
      text: `HSPD Detective Bureau (CID) • Highstate Roleplay • ${dateStr}`,
      icon_url: config.botAvatar.trim() || 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
    },
    timestamp: new Date().toISOString(),
  };

  const payload = {
    username: config.botName.trim() || 'HSPD Detective Bureau & CID',
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
      message: `Berkas kasus ${caseItem.caseNumber} berhasil dikirim ke Webhook Kasus Detektif!`
    };
  } catch (err: any) {
    console.error('Detective Case Webhook Error:', err);
    return {
      success: false,
      message: `Gagal mengirim ke Webhook Kasus Detektif: ${err.message || 'Cek URL Webhook'}`
    };
  }
}

export async function testDetectiveDiscordWebhook(config: WebhookConfig): Promise<{ success: boolean; message: string }> {
  if (!config.webhookUrl || !config.webhookUrl.trim().startsWith('http')) {
    return {
      success: false,
      message: 'Masukkan URL Discord Webhook Kasus Detektif yang valid (dimulai dengan https://discord.com/api/webhooks/...)'
    };
  }

  const payload = {
    username: config.botName.trim() || 'HSPD Detective Bureau & CID',
    avatar_url: config.botAvatar.trim() || 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
    embeds: [
      {
        title: '🔍 UJI COBA INTEGRASI WEBHOOK KASUS DETEKTIF (CID CASEBOARD)',
        description: 'Koneksi log berkas investigasi kasus kriminal & surat perintah penangkapan (Warrant) berhasil terhubung.',
        color: 0x6366F1,
        fields: [
          { name: 'Channel Target', value: '🟢 **Detective Bureau / CID Investigation Channel**', inline: true },
          { name: 'Waktu Pengujian', value: new Date().toLocaleString('id-ID'), inline: true },
          { name: 'Status Sistem', value: '🟢 **Ready for Caseboard Intelligence & Ballistics**', inline: true },
        ],
        footer: {
          text: 'HSPD Detective Bureau • HighState Roleplay',
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
      message: '✅ Sinyal Webhook Kasus Detektif (CID) Berhasil Terhubung!'
    };
  } catch (err: any) {
    return {
      success: false,
      message: `❌ Gagal terhubung ke Webhook Kasus Detektif: ${err.message || 'Periksa kembali URL Webhook'}`
    };
  }
}

/**
 * =========================================================================
 * 2. BOLO ALERTS (BE ON LOOK OUT) DISPATCH WEBHOOK FUNCTIONS
 * =========================================================================
 */
export async function sendBoloAlertToDiscord(
  bolo: BoloAlert,
  eventType: 'PUBLISHED' | 'CLEARED',
  actor?: OfficerProfile,
  customConfig?: Partial<WebhookConfig>
): Promise<{ success: boolean; message: string }> {
  const config = { ...getSavedBoloWebhookConfig(), ...customConfig };

  if (!config.webhookUrl || !config.webhookUrl.trim().startsWith('http')) {
    return {
      success: false,
      message: 'URL Webhook Discord untuk Siaga BOLO belum disetting.'
    };
  }

  const dateStr = new Date().toLocaleString('id-ID', {
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  let embedColor = 0xDC2626; // Red for high danger
  if (eventType === 'CLEARED') {
    embedColor = 0x10B981; // Green
  } else if (bolo.dangerLevel === 'EXTREME_ARMED_DANGEROUS') {
    embedColor = 0x991B1B; // Dark Red
  } else if (bolo.dangerLevel === 'MEDIUM') {
    embedColor = 0xF59E0B; // Amber
  } else if (bolo.dangerLevel === 'LOW') {
    embedColor = 0x3B82F6; // Blue
  }

  const isPublished = eventType === 'PUBLISHED';
  const embedTitle = isPublished
    ? `🚨 [BOLO SIAGA DARURAT] PERINGATAN BURONAN: ${bolo.title.toUpperCase()}`
    : `✅ [BOLO DITUTUP / CLEAR] BURONAN TERTANGKAP: ${bolo.title.toUpperCase()}`;

  const fields: Array<{ name: string; value: string; inline?: boolean }> = [
    {
      name: '🎯 TARGET & JUDUL BOLO',
      value: `**${bolo.title}**`,
      inline: false,
    },
    {
      name: '🏷️ TIPE TARGET',
      value: `\`${bolo.type}\``,
      inline: true,
    },
    {
      name: '⚠️ TINGKAT BAHAYA',
      value: bolo.dangerLevel === 'EXTREME_ARMED_DANGEROUS' 
        ? '🔴 **BERSENJATA BERAT & EKSTREM BAHAYA**' 
        : bolo.dangerLevel === 'HIGH' 
          ? '🟠 **TINGGI (HIGH)**' 
          : bolo.dangerLevel === 'MEDIUM' 
            ? '🟡 **SEDANG (MEDIUM)**' 
            : '⚪ **RENDAH / INFORMATIF**',
      inline: true,
    },
    {
      name: '📍 LOKASI TERAKHIR TERLIHAT (LAST SEEN)',
      value: `**${bolo.lastSeenLocation || 'Los Santos Area'}**`,
      inline: true,
    },
    {
      name: '📝 CIRI-CIRI / INSTRUKSI PATROLI LAPANGAN',
      value: `>>> ${bolo.description || 'Waspadai target saat berpatroli, utamakan keselamatan dan koordinasikan back-up unit.'}`,
      inline: false,
    },
    {
      name: isPublished ? '👮 DITERBITKAN OLEH' : '👮 DISELESAIKAN OLEH',
      value: `**${bolo.issuedBy}** (\`${bolo.issuedByBadge}\`)${actor ? `\nPetugas Penindak: **${actor.rank} ${actor.name}**` : ''}`,
      inline: false,
    }
  ];

  const embedObj = {
    title: embedTitle,
    description: isPublished 
      ? `🚨 **PERHATIAN SELURUH UNIT PATROLI HSPD:** Segera lakukan pemantauan dan siaga terhadap buronan/kendaraan yang terdaftar di bawah ini!` 
      : `Peringatan BOLO ini telah dicabut / diselesaikan karena target telah diamankan atau diproses.`,
    color: embedColor,
    fields,
    footer: {
      text: `HSPD Dispatch & BOLO Alert System • Highstate Roleplay • ${dateStr}`,
      icon_url: config.botAvatar.trim() || 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
    },
    timestamp: new Date().toISOString(),
  };

  const payload = {
    username: config.botName.trim() || 'HSPD BOLO & Dispatch HQ',
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
      message: `Peringatan BOLO "${bolo.title}" berhasil disiarkan ke Webhook Discord!`
    };
  } catch (err: any) {
    console.error('BOLO Webhook Error:', err);
    return {
      success: false,
      message: `Gagal mengirim BOLO ke Webhook Discord: ${err.message || 'Cek URL Webhook'}`
    };
  }
}

export async function testBoloDiscordWebhook(config: WebhookConfig): Promise<{ success: boolean; message: string }> {
  if (!config.webhookUrl || !config.webhookUrl.trim().startsWith('http')) {
    return {
      success: false,
      message: 'Masukkan URL Discord Webhook BOLO yang valid (dimulai dengan https://discord.com/api/webhooks/...)'
    };
  }

  const payload = {
    username: config.botName.trim() || 'HSPD BOLO & Dispatch HQ',
    avatar_url: config.botAvatar.trim() || 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
    embeds: [
      {
        title: '🚨 UJI COBA INTEGRASI WEBHOOK SIAGA BOLO (ALL POINTS BULLETIN)',
        description: 'Koneksi siaran darurat BOLO / buronan kendaraan & suspect berbahaya berhasil terhubung.',
        color: 0xDC2626,
        fields: [
          { name: 'Channel Target', value: '🟢 **BOLO Alerts & Dispatch Channel**', inline: true },
          { name: 'Waktu Pengujian', value: new Date().toLocaleString('id-ID'), inline: true },
          { name: 'Status Sistem', value: '🟢 **Ready for Tactical Broadcast & Pursuit Alerts**', inline: true },
        ],
        footer: {
          text: 'HSPD BOLO & Dispatch HQ • HighState Roleplay',
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
      message: '✅ Sinyal Webhook Siaga BOLO Berhasil Terhubung!'
    };
  } catch (err: any) {
    return {
      success: false,
      message: `❌ Gagal terhubung ke Webhook BOLO: ${err.message || 'Periksa kembali URL Webhook'}`
    };
  }
}

/**
 * =========================================================================
 * 3. TRAFFIC ENFORCEMENT & IMPOUND LOT WEBHOOK FUNCTIONS
 * =========================================================================
 */
export async function sendImpoundRecordToDiscord(
  imp: ImpoundRecord,
  eventType: 'IMPOUNDED' | 'RELEASED' | 'DELETED',
  actor?: OfficerProfile,
  customConfig?: Partial<WebhookConfig>
): Promise<{ success: boolean; message: string }> {
  const config = { ...getSavedImpoundWebhookConfig(), ...customConfig };

  if (!config.webhookUrl || !config.webhookUrl.trim().startsWith('http')) {
    return {
      success: false,
      message: 'URL Webhook Discord untuk Sitaan Kendaraan (Impound) belum disetting.'
    };
  }

  const dateStr = new Date().toLocaleString('id-ID', {
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  const isImpounded = eventType === 'IMPOUNDED';
  const embedColor = isImpounded ? 0x059669 : 0x3B82F6; // Emerald for impounded, Blue for release
  const embedTitle = isImpounded 
    ? `🚗 [IMPOUND LOT] PENYITAAN KENDARAAN - PLAT #${imp.plateNumber}` 
    : `🔓 [IMPOUND RELEASE] KENDARAAN RESMI DITEBUS - PLAT #${imp.plateNumber}`;

  const fields: Array<{ name: string; value: string; inline?: boolean }> = [
    {
      name: '🚗 PLAT & MODEL KENDARAAN',
      value: `Plat: **\`${imp.plateNumber}\`**\nModel: **${imp.vehicleModel}** (${imp.color})`,
      inline: true,
    },
    {
      name: '👤 PEMILIK TERDAFTAR',
      value: `**${imp.ownerName}**`,
      inline: true,
    },
    {
      name: '🔒 STATUS PENYITAAN',
      value: isImpounded ? '🔒 **DISITA DI IMPOUND LOT**' : '✅ **RESMI DITEBUS / DILEPAS**',
      inline: true,
    },
    {
      name: '📜 ALASAN PENYITAAN / PASAL',
      value: `>>> ${imp.reason}`,
      inline: false,
    },
    {
      name: '💰 DURASI & BIAYA TEBUSAN DENDA',
      value: `Durasi Sitaan: **${imp.impoundDays} Hari**\nBiaya Tebus: **$${imp.impoundFee.toLocaleString('id-ID')}** (Uang In-Game)`,
      inline: true,
    },
    {
      name: '📍 LOKASI PENINDAKAN',
      value: `**${imp.locationFound || 'Commerce, Los Santos'}**`,
      inline: true,
    },
    {
      name: '👮 PETUGAS PENYITA',
      value: `**${imp.officerName}** (\`${imp.officerBadge}\`)${actor ? `\nPetugas Pelapor: **${actor.rank} ${actor.name}**` : ''}`,
      inline: false,
    }
  ];

  const embedObj = {
    title: embedTitle,
    description: isImpounded
      ? `Kendaraan berikut telah disita oleh Satuan Lalu Lintas (Traffic Enforcement Unit) dan diamankan di Garasi Impound Lot HSPD.`
      : `Kendaraan telah melunasi denda administrasi atau menyelesaikan masa sitaan dan diserahterimakan kembali ke pemilik.`,
    color: embedColor,
    fields,
    footer: {
      text: `HSPD Traffic Enforcement & Impound Lot • Highstate Roleplay • ${dateStr}`,
      icon_url: config.botAvatar.trim() || 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
    },
    timestamp: new Date().toISOString(),
  };

  const payload = {
    username: config.botName.trim() || 'HSPD Traffic Enforcement & Impound Lot',
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
      message: `Rekor Impound plat ${imp.plateNumber} berhasil dikirim ke Webhook Discord!`
    };
  } catch (err: any) {
    console.error('Impound Webhook Error:', err);
    return {
      success: false,
      message: `Gagal mengirim data Impound ke Webhook Discord: ${err.message || 'Cek URL Webhook'}`
    };
  }
}

export async function testImpoundDiscordWebhook(config: WebhookConfig): Promise<{ success: boolean; message: string }> {
  if (!config.webhookUrl || !config.webhookUrl.trim().startsWith('http')) {
    return {
      success: false,
      message: 'Masukkan URL Discord Webhook Impound yang valid (dimulai dengan https://discord.com/api/webhooks/...)'
    };
  }

  const payload = {
    username: config.botName.trim() || 'HSPD Traffic Enforcement & Impound Lot',
    avatar_url: config.botAvatar.trim() || 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
    embeds: [
      {
        title: '🚗 UJI COBA INTEGRASI WEBHOOK SITAAN KENDARAAN (IMPOUND LOT)',
        description: 'Koneksi log sitaan kendaraan lalu lintas & pembayaran denda tebusan berhasil terhubung.',
        color: 0x059669,
        fields: [
          { name: 'Channel Target', value: '🟢 **Traffic Enforcement & Impound Lot Channel**', inline: true },
          { name: 'Waktu Pengujian', value: new Date().toLocaleString('id-ID'), inline: true },
          { name: 'Status Sistem', value: '🟢 **Ready for Impound Lot Logging & Fee Verification**', inline: true },
        ],
        footer: {
          text: 'HSPD Traffic Enforcement • HighState Roleplay',
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
      message: '✅ Sinyal Webhook Sita Kendaraan (Impound) Berhasil Terhubung!'
    };
  } catch (err: any) {
    return {
      success: false,
      message: `❌ Gagal terhubung ke Webhook Impound: ${err.message || 'Periksa kembali URL Webhook'}`
    };
  }
}

// ==========================================
// 🏦 POLICE VAULT & ARMORY (WEEKLY 1X AUDIT) WEBHOOK
// ==========================================
export async function sendVaultAuditToDiscord(
  audit: VaultAuditLog,
  officer?: OfficerProfile | null
): Promise<{ success: boolean; message: string }> {
  const config = getSavedVaultWebhookConfig();
  if (!config.webhookUrl || !config.webhookUrl.trim().startsWith('http')) {
    return {
      success: false,
      message: 'URL Discord Webhook Brankas & Audit Mingguan belum dikonfigurasi di Pengaturan Webhook!'
    };
  }

  const dateStr = new Date(audit.timestamp).toLocaleString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const nextDueDateStr = new Date(audit.nextAuditDueDate).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const sealStatusMap = {
    INTACT_SECURED: '🟢 **TERSEGEL UTUH & AMAN (INTACT)**',
    SEAL_BROKEN_DISCREPANCY: '🔴 **PERINGATAN: SEGEL RUSAK / ADA SELISIH**',
    UNDER_MAINTENANCE: '🟡 **SEDANG DALAM PERAWATAN SISTEM**'
  };

  const fields: any[] = [
    {
      name: '🗓️ PERIODE & TANGGAL AUDIT MINGGUAN',
      value: `Periode: **${audit.weekLabel}**\nTanggal Pelaksanaan: **${audit.auditDate}**\nJadwal Audit Berikutnya: **${nextDueDateStr}**`,
      inline: false,
    },
    {
      name: '👮 AUDITOR UTAMA & SAKSI',
      value: `Auditor: **${audit.auditorRank} ${audit.auditorName}** (\`${audit.auditorBadge}\`)\nSaksi Pendamping: **${audit.witnessOfficer || 'Petugas Jaga Logistik'}**`,
      inline: true,
    },
    {
      name: '🔒 STATUS SEGEL BRANKAS FISIK',
      value: sealStatusMap[audit.vaultSealStatus] || '🟢 **TERSEGEL UTUH**',
      inline: true,
    },
    {
      name: '💵 KAS BRANKAS KEPOLISIAN',
      value: `Kas Uang Sitaan: **$${audit.cashConfiscated.toLocaleString('id-ID')}**\nKas Operasional Dinas: **$${audit.cleanCashFund.toLocaleString('id-ID')}**\nTotal Kas Tersimpan: **$${(audit.cashConfiscated + audit.cleanCashFund).toLocaleString('id-ID')}**`,
      inline: false,
    },
    {
      name: '🔫 STOK SENJATA INVENTARIS & SITAAN',
      value: `• Handguns / Pistol: **${audit.weaponsSummary.handgunsCount} Unit**\n• Shotguns: **${audit.weaponsSummary.shotgunsCount} Unit**\n• Sub-Machine Guns (SMG): **${audit.weaponsSummary.smgCount} Unit**\n• Assault Rifles (M4/AK): **${audit.weaponsSummary.rifleCount} Unit**\n• Heavy Tactical Weapons: **${audit.weaponsSummary.heavyWeaponsCount} Unit**`,
      inline: true,
    },
    {
      name: '🎯 PERSEDIAAN AMUNISI GUDANG',
      value: `• Pistol 9mm Ammo: **${audit.ammoSummary.pistolAmmo.toLocaleString('id-ID')} Butir**\n• Shotgun Shells 12G: **${audit.ammoSummary.shotgunShells.toLocaleString('id-ID')} Shells**\n• SMG 9mm/45 ACP: **${audit.ammoSummary.smgAmmo.toLocaleString('id-ID')} Butir**\n• Rifle 5.56mm Ammo: **${audit.ammoSummary.rifleAmmo.toLocaleString('id-ID')} Butir**`,
      inline: true,
    },
    {
      name: '💊 REKAPITULASI NARKOTIKA SITAAN',
      value: `• Marijuana / Weed: **${audit.drugsSummary.weedGrams} Gram**\n• Cocaine Murni: **${audit.drugsSummary.cocaineGrams} Gram**\n• Crack Cocaine: **${audit.drugsSummary.crackGrams} Gram**\n• Methamphetamine: **${audit.drugsSummary.methGrams} Gram**\n• Pills / Butir Ekstasi: **${audit.drugsSummary.pillsCount} Butir**`,
      inline: false,
    }
  ];

  if (audit.otherItemsNote) {
    fields.push({
      name: '📦 BARANG SITAAN BERHARGA LAINNYA',
      value: `>>> ${audit.otherItemsNote}`,
      inline: false,
    });
  }

  if (audit.auditNotes) {
    fields.push({
      name: '📝 CATATAN & REKOMENDASI AUDIT',
      value: `>>> ${audit.auditNotes}`,
      inline: false,
    });
  }

  const embedObj: any = {
    title: `🏦 BERITA ACARA AUDIT BRANKAS & GUDANG SENJATA [${audit.auditNumber}]`,
    description: `Laporan resmi pemeriksaan fisik dan stock opname berkala mingguan (1x Seminggu) Brankas Sentral & Armory Departemen Kepolisian HSPD.`,
    color: audit.vaultSealStatus === 'SEAL_BROKEN_DISCREPANCY' ? 0xDC2626 : 0xD97706,
    fields,
    footer: {
      text: `HSPD Central Vault & Armory Bureau • Siklus Audit Mingguan • ${dateStr}`,
      icon_url: config.botAvatar.trim() || 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
    },
    timestamp: new Date(audit.timestamp).toISOString(),
  };

  // Check for image upload
  let firstPhoto = audit.evidencePhotos && audit.evidencePhotos.length > 0 ? audit.evidencePhotos[0] : undefined;

  if (firstPhoto && firstPhoto.startsWith('data:image')) {
    try {
      const { blob } = dataURLtoBlob(firstPhoto);
      const formData = new FormData();
      formData.append('file', blob, 'vault_audit_evidence.jpg');
      
      embedObj.image = { url: 'attachment://vault_audit_evidence.jpg' };

      const payload = {
        username: config.botName.trim() || 'HSPD Vault & Armory Bureau',
        avatar_url: config.botAvatar.trim() || 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
        embeds: [embedObj],
      };

      formData.append('payload_json', JSON.stringify(payload));

      const res = await fetch(config.webhookUrl.trim(), {
        method: 'POST',
        body: formData
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      return { success: true, message: `Laporan Audit Brankas ${audit.auditNumber} berhasil dikirim beserta bukti foto ke Discord!` };
    } catch (err: any) {
      console.warn('Failed to send image blob in vault webhook, falling back to json:', err);
    }
  } else if (firstPhoto && firstPhoto.startsWith('http')) {
    embedObj.image = { url: firstPhoto };
  }

  try {
    const res = await fetch(config.webhookUrl.trim(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: config.botName.trim() || 'HSPD Vault & Armory Bureau',
        avatar_url: config.botAvatar.trim() || 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
        embeds: [embedObj],
      })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return { success: true, message: `Laporan Audit Brankas ${audit.auditNumber} berhasil dikirim ke Webhook Discord!` };
  } catch (err: any) {
    return { success: false, message: `Gagal mengirim Laporan Audit Brankas: ${err.message || 'Cek koneksi'}` };
  }
}

export async function testVaultDiscordWebhook(config: WebhookConfig): Promise<{ success: boolean; message: string }> {
  if (!config.webhookUrl || !config.webhookUrl.trim().startsWith('http')) {
    return {
      success: false,
      message: 'Masukkan URL Discord Webhook Brankas & Audit Mingguan yang valid.'
    };
  }

  const payload = {
    username: config.botName.trim() || 'HSPD Vault & Armory Bureau',
    avatar_url: config.botAvatar.trim() || 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
    embeds: [
      {
        title: '🏦 UJI COBA INTEGRASI WEBHOOK BRANKAS & AUDIT MINGGUAN',
        description: 'Sistem notifikasi berita acara audit mingguan brankas & gudang logistik senjata HSPD berhasil terhubung.',
        color: 0xD97706,
        fields: [
          { name: 'Channel Target', value: '🟢 **Police Vault & Weekly Armory Stock Opname**', inline: true },
          { name: 'Siklus Pembaruan', value: '⏱️ **Wajib Update 1x Seminggu (7 Hari)**', inline: true },
          { name: 'Waktu Pengujian', value: new Date().toLocaleString('id-ID'), inline: false },
        ],
        footer: {
          text: 'HSPD Central Vault Bureau • HighState Roleplay',
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

    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return { success: true, message: '✅ Sinyal Webhook Brankas & Audit Mingguan Berhasil Terhubung!' };
  } catch (err: any) {
    return { success: false, message: `❌ Gagal terhubung ke Webhook Brankas: ${err.message}` };
  }
}

// ==========================================
// 💥 WEAPON & VEHICLE SMELTING / DESTRUCTION REGISTRY WEBHOOK
// ==========================================
export async function sendDestructionRecordToDiscord(
  item: DestructionRegistryItem,
  eventType: 'PROPOSED' | 'APPROVED' | 'DESTROYED',
  officer?: OfficerProfile | null
): Promise<{ success: boolean; message: string }> {
  const config = getSavedDestructionWebhookConfig();
  if (!config.webhookUrl || !config.webhookUrl.trim().startsWith('http')) {
    return {
      success: false,
      message: 'URL Discord Webhook Peleburan Kendaraan / Senjata belum dikonfigurasi di Pengaturan Webhook!'
    };
  }

  const dateStr = new Date(item.timestamp).toLocaleString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const typeLabels = {
    VEHICLE: '🚗 KENDARAAN (PENGHANCURAN / CRUSHING)',
    WEAPON: '🔫 SENJATA API & AMUNISI (PELEBURAN / SMELTING)',
    NARCOTICS: '💊 NARKOTIKA SITAAN (PEMBAKARAN INCINERATOR)',
    CONTRABAND: '📦 BARANG SELUNDUPAN / ILEGAL'
  };

  const reasonLabels = {
    COURT_ORDER_INKRACHT: '⚖️ Putusan Pengadilan Inkracht (Perintah Pemusnahan Resmi)',
    ILLEGAL_SERIAL_ERASED: '🚫 Senjata Ilegal Tanpa Izin & Nomor Seri Dihapus/Digosok',
    UNCLAIMED_IMPOUND_EXPIRED: '⏱️ Masa Sitaan Impound Kadaluarsa (>30 Hari Tidak Ditebus)',
    TOTAL_WRECK_UNSAFE: '💥 Kerusakan Total / Rongsokan Berat Tidak Layak Jalan',
    CONTRABAND_HAZARDOUS: '☣️ Zat Kimia Narkotika Berbahaya Bagi Publik'
  };

  const statusLabels = {
    PROPOSED_PENDING_APPROVAL: '⏳ **MENUNGGU PERSETUJUAN (PENDING HIGH COMMAND)**',
    APPROVED_SCHEDULED: '⚙️ **DISETUJUI & DIJADWALKAN KE TUNGKU PELEBURAN**',
    SMELTED_DESTROYED: '💥 **SELESAI DILEBUR / DIMUSNAHKAN TOTAL (SCRAPPED)**',
    REJECTED_RETAINED: '🛑 **DITOLAK / DITAHAN UNTUK PENYIDIKAN LEBIH LANJUT**'
  };

  const statusColors = {
    PROPOSED_PENDING_APPROVAL: 0xF59E0B, // Amber
    APPROVED_SCHEDULED: 0x3B82F6,        // Blue
    SMELTED_DESTROYED: 0xEF4444,         // Red
    REJECTED_RETAINED: 0x6B7280          // Gray
  };

  const fields: any[] = [
    {
      name: '🏷️ TIPE & JUDUL PELEBURAN',
      value: `Tipe: **${typeLabels[item.itemType]}**\nJudul: **${item.title}**\nNo. Kasus Asal: **${item.caseNumber || 'N/A'}**`,
      inline: false,
    },
    {
      name: '💥 STATUS PELEBURAN / PEMUSNAHAN',
      value: statusLabels[item.status] || '⚙️ **DIJADWALKAN**',
      inline: true,
    },
    {
      name: '📅 JADWAL EKSEKUSI / PELAKSANAAN',
      value: `Tanggal: **${item.scheduledDate}**\nLokasi: **${item.facilityLocation}**`,
      inline: true,
    }
  ];

  // Specific Vehicle Details
  if (item.itemType === 'VEHICLE' && item.vehicleDetails) {
    fields.push({
      name: '🚗 DETAIL KENDARAAN YANG AKAN/TELAH DILEBUR',
      value: `• Model Kendaraan: **${item.vehicleDetails.model}**\n• Plat Nomor: **${item.vehicleDetails.plateNumber}**\n• Warna Bodi: **${item.vehicleDetails.color}**\n• Nomor Sasis / VIN: **${item.vehicleDetails.vin || 'Terhapus'}**\n• Pemilik Terdaftar Sebelumnya: **${item.vehicleDetails.previousOwner || 'Anonim'}**\n• Kondisi Fisik: **${item.vehicleDetails.chassisCondition || 'Rongsokan / Rusak Berat'}**`,
      inline: false,
    });
  }

  // Specific Weapon Details
  if (item.itemType === 'WEAPON' && item.weaponDetails) {
    fields.push({
      name: '🔫 DETAIL SENJATA API YANG DILEBUR KE TUNGKU',
      value: `• Model / Jenis Senjata: **${item.weaponDetails.weaponModel}**\n• Jumlah Unit: **${item.weaponDetails.quantity || 1} Unit**\n• Nomor Seri: **${item.weaponDetails.serialNumber}**\n• Kondisi Serial: **${item.weaponDetails.isSerialScratched ? '⚠️ Nomor Seri Terhapus / Ilegal' : 'Resmi Tercatat'}**\n• Kaliber Senjata: **${item.weaponDetails.caliber}**\n• Asal Sitaan: **${item.weaponDetails.confiscatedFrom || 'Sitaan Lapangan'}**`,
      inline: false,
    });
  }

  // Specific Narcotics Details
  if (item.itemType === 'NARCOTICS' && item.narcoticsDetails) {
    fields.push({
      name: '💊 DETAIL NARKOTIKA YANG DIMUSNAHKAN',
      value: `• Jenis Zat: **${item.narcoticsDetails.substance}**\n• Berat Total: **${item.narcoticsDetails.weightGrams} Gram**\n• Kemasan / Bentuk: **${item.narcoticsDetails.packaging}**\n• Metode Pemusnahan: **${item.narcoticsDetails.burningMethod || 'Insenerator Suhu Tinggi'}**`,
      inline: false,
    });
  }

  // Reason and Legal Basis
  fields.push({
    name: '⚖️ DASAR HUKUM & ALASAN PEMUSNAHAN',
    value: `Dasar: **${reasonLabels[item.destructionReason]}**\nKeterangan: ${item.reasonDescription}\nNo. Surat Keputusan: **${item.courtOrderDocNumber || 'SURAT-PERINTAH-HSPD/2026'}**`,
    inline: false,
  });

  // Personnel details
  fields.push({
    name: '👮 PETUGAS PENDAFTAR & OTORISASI HIGH COMMAND',
    value: `Didaftarkan Oleh: **${item.registeredBy}** (\`${item.registeredByBadge}\`)\nDisetujui Oleh: **${item.authorizedBy || 'Menunggu Otorisasi High Command'}**\nPetugas Eksekutor: **${item.executorOfficer || '-'}**`,
    inline: false,
  });

  const embedObj: any = {
    title: `💥 BERITA ACARA PELEBURAN & PEMUSNAHAN SITAAN [${item.destructionNumber}]`,
    description: `Dokumentasi resmi penghancuran / peleburan barang bukti dan kendaraan sitaan agar tidak dapat disalahgunakan kembali di masyarakat.`,
    color: statusColors[item.status] || 0xEF4444,
    fields,
    footer: {
      text: `HSPD Evidence Disposal & Smelting Registry • HighState Roleplay • ${dateStr}`,
      icon_url: config.botAvatar.trim() || 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
    },
    timestamp: new Date(item.timestamp).toISOString(),
  };

  // Image attachment priority (After photo first if destroyed, else before photo)
  const displayPhoto = (item.afterPhotos && item.afterPhotos.length > 0)
    ? item.afterPhotos[0]
    : (item.beforePhotos && item.beforePhotos.length > 0 ? item.beforePhotos[0] : undefined);

  if (displayPhoto && displayPhoto.startsWith('data:image')) {
    try {
      const { blob } = dataURLtoBlob(displayPhoto);
      const formData = new FormData();
      formData.append('file', blob, 'destruction_evidence.jpg');
      
      embedObj.image = { url: 'attachment://destruction_evidence.jpg' };

      const payload = {
        username: config.botName.trim() || 'HSPD Evidence & Smelting Registry',
        avatar_url: config.botAvatar.trim() || 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
        embeds: [embedObj],
      };

      formData.append('payload_json', JSON.stringify(payload));

      const res = await fetch(config.webhookUrl.trim(), {
        method: 'POST',
        body: formData
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      return { success: true, message: `Data Peleburan ${item.destructionNumber} berhasil dikirim beserta bukti foto ke Discord!` };
    } catch (err: any) {
      console.warn('Failed to send image blob in destruction webhook, falling back to json:', err);
    }
  } else if (displayPhoto && displayPhoto.startsWith('http')) {
    embedObj.image = { url: displayPhoto };
  }

  try {
    const res = await fetch(config.webhookUrl.trim(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: config.botName.trim() || 'HSPD Evidence & Smelting Registry',
        avatar_url: config.botAvatar.trim() || 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
        embeds: [embedObj],
      })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return { success: true, message: `Data Peleburan ${item.destructionNumber} berhasil dikirim ke Webhook Discord!` };
  } catch (err: any) {
    return { success: false, message: `Gagal mengirim data Peleburan: ${err.message || 'Cek koneksi'}` };
  }
}

export async function testDestructionDiscordWebhook(config: WebhookConfig): Promise<{ success: boolean; message: string }> {
  if (!config.webhookUrl || !config.webhookUrl.trim().startsWith('http')) {
    return {
      success: false,
      message: 'Masukkan URL Discord Webhook Peleburan Kendaraan / Senjata yang valid.'
    };
  }

  const payload = {
    username: config.botName.trim() || 'HSPD Evidence & Smelting Registry',
    avatar_url: config.botAvatar.trim() || 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
    embeds: [
      {
        title: '💥 UJI COBA INTEGRASI WEBHOOK PELEBURAN KENDARAAN & SENJATA SITAAN',
        description: 'Sistem pencatatan peleburan scrap kendaraan, tungku peleburan senjata api, dan pemusnahan sitaan terlarang berhasil terhubung.',
        color: 0xEF4444,
        fields: [
          { name: 'Channel Target', value: '🟢 **Evidence Scrapyard & Smelting Disposal Channel**', inline: true },
          { name: 'Waktu Pengujian', value: new Date().toLocaleString('id-ID'), inline: true },
          { name: 'Status Sistem', value: '🟢 **Ready for Vehicle Crushing & Weapon Smelting Logs**', inline: true },
        ],
        footer: {
          text: 'HSPD Evidence Disposal • HighState Roleplay',
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

    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return { success: true, message: '✅ Sinyal Webhook Peleburan Kendaraan & Senjata Berhasil Terhubung!' };
  } catch (err: any) {
    return { success: false, message: `❌ Gagal terhubung ke Webhook Peleburan: ${err.message}` };
  }
}

/**
 * Send an Official Document / Police Letter Record to Discord Webhook
 */
export async function sendOfficialDocumentToDiscord(
  docItem: OfficialDocument,
  customConfig?: Partial<WebhookConfig>
): Promise<{ success: boolean; message: string }> {
  const config = { ...getSavedDocumentWebhookConfig(), ...customConfig };

  if (!config.webhookUrl || !config.webhookUrl.trim().startsWith('http')) {
    return {
      success: false,
      message: 'URL Discord Webhook Arsip Dokumen belum disetting. Silakan atur di menu Konfigurasi Webhook.'
    };
  }

  const isRestricted = docItem.classification === 'RAHASIA' || docItem.classification === 'SANGAT RAHASIA';
  const embedColor = isRestricted ? 0x991B1B : 0x1E3A8A;

  const fields: any[] = [
    {
      name: '👮 Pejabat Penerbit',
      value: `**${docItem.issuerName}**\nBadge: \`#${docItem.issuerBadge}\` | Pangkat: **${docItem.issuerRank}**\nRole: *${docItem.issuerRole || '-'}*`,
      inline: true,
    },
    {
      name: '👤 Pihak Penerima / Subjek',
      value: `**${docItem.recipientName}**\nID/Status: \`${docItem.recipientId || docItem.recipientRoleOrStatus || '-'}\`${docItem.recipientPhone ? `\nTelp: \`${docItem.recipientPhone}\`` : ''}`,
      inline: true,
    },
    {
      name: '📅 Tanggal & Tempat Terbit',
      value: `**${docItem.date}**\n*${docItem.location}*`,
      inline: true,
    },
    {
      name: '🔏 Klasifikasi & Kategori',
      value: `Klasifikasi: \`${docItem.classification}\`\nKategori: **${docItem.category.replace(/_/g, ' ')}**`,
      inline: true,
    },
    {
      name: '⌛ Masa Berlaku',
      value: docItem.validUntil ? `\`${docItem.validUntil}\`` : '*Sesuai Ketentuan Tugas*',
      inline: true,
    },
    {
      name: '🛡️ Cap Stempel Otoritas',
      value: `\`${docItem.primarySeal}\``,
      inline: true,
    }
  ];

  if (docItem.clauses && docItem.clauses.length > 0) {
    const clauseSummary = docItem.clauses.slice(0, 4).map(c => 
      `• **${c.clauseNumber || 'Poin'}:** ${c.title ? `${c.title} - ` : ''}${c.content.slice(0, 120)}${c.content.length > 120 ? '...' : ''}`
    ).join('\n');

    fields.push({
      name: `📜 Ketentuan & Diktum Surat (${docItem.clauses.length} Poin)`,
      value: clauseSummary,
      inline: false,
    });
  }

  if (docItem.notes && docItem.notes.trim()) {
    fields.push({
      name: '📝 Catatan / Klausul Tambahan',
      value: `>>> ${docItem.notes.trim()}`,
      inline: false,
    });
  }

  const embedObj = {
    title: `📄 [ARSIP SURAT RESMI] ${docItem.title.toUpperCase()}`,
    description: `**Nomor Registrasi:** \`${docItem.docNumber}\`\n**Perihal:** ${docItem.subject}\n*Lembar dokumen resmi kepolisian Highstate Roleplay Police Department.*`,
    color: embedColor,
    fields,
    footer: {
      text: `HSPD Legal & Documentation Bureau • Otorisasi: ${docItem.acknowledgedByName || 'Chief of Police'} • ${docItem.date}`,
      icon_url: config.botAvatar.trim() || 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
    },
    timestamp: new Date().toISOString(),
  };

  try {
    const res = await fetch(config.webhookUrl.trim(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: config.botName.trim() || 'HSPD Document Archives & Legal Bureau',
        avatar_url: config.botAvatar.trim() || 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
        embeds: [embedObj],
      })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return {
      success: true,
      message: `Dokumen resmi [${docItem.docNumber}] berhasil diarsipkan ke Webhook Discord!`
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Gagal mengirim dokumen ke Discord: ${err.message || 'Cek koneksi atau URL Webhook'}`
    };
  }
}

/**
 * Test ping for Document Archive Webhook
 */
export async function testDocumentDiscordWebhook(config: WebhookConfig): Promise<{ success: boolean; message: string }> {
  if (!config.webhookUrl || !config.webhookUrl.trim().startsWith('http')) {
    return {
      success: false,
      message: 'Masukkan URL Discord Webhook Arsip Dokumen yang valid (dimulai dengan https://discord.com/api/webhooks/...)'
    };
  }

  const payload = {
    username: config.botName.trim() || 'HSPD Document Archives & Legal Bureau',
    avatar_url: config.botAvatar.trim() || 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
    embeds: [
      {
        title: '📜 UJI COBA INTEGRASI WEBHOOK ARSIP DOKUMEN & SURAT RESMI',
        description: 'Sistem pengarsipan otomatis berkas surat tugas, SKCK, surat peringatan, izin senjata api, dan berita acara kepolisian HSPD berhasil terhubung.',
        color: 0x1E3A8A,
        fields: [
          { name: 'Channel Target', value: '🟢 **Official Documents & Legal Archive Channel**', inline: true },
          { name: 'Waktu Pengujian', value: new Date().toLocaleString('id-ID'), inline: true },
          { name: 'Status Sistem', value: '🟢 **Ready for Official Police Letter Archival**', inline: true },
        ],
        footer: {
          text: 'HSPD Official Document Studio • HighState Roleplay',
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

    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return { success: true, message: '✅ Sinyal Webhook Arsip Dokumen & Surat Resmi Berhasil Terhubung!' };
  } catch (err: any) {
    return { success: false, message: `❌ Gagal terhubung ke Webhook Dokumen: ${err.message || 'Periksa kembali URL Webhook'}` };
  }
}

/**
 * Generic Discord webhook log sender
 */
export async function sendDiscordLog(webhookUrl: string, payload: {
  title: string;
  description: string;
  color?: number;
  fields?: { name: string; value: string; inline?: boolean }[];
}): Promise<boolean> {
  if (!webhookUrl || !webhookUrl.startsWith('http')) return false;

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'HSPD Central CAD & Tactical Network',
        avatar_url: 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
        embeds: [
          {
            title: payload.title,
            description: payload.description,
            color: payload.color || 0x3b82f6,
            fields: payload.fields || [],
            footer: {
              text: `HighState Roleplay Police Dept • ${new Date().toLocaleTimeString('id-ID')}`
            }
          }
        ]
      })
    });
    return res.ok;
  } catch (e) {
    console.error('Error sending Discord log:', e);
    return false;
  }
}




