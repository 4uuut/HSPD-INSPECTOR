import { AuthorityPinConfig, AuthorityPinLog, VALID_SUPERVISOR_PASSCODES } from '../types';
import { pushToFirestore } from '../services/firebaseRealtimeSync';

export type { AuthorityPinConfig, AuthorityPinLog };
export { VALID_SUPERVISOR_PASSCODES };

export const AUTHORITY_PIN_STORAGE_KEY = 'hspd_authority_pin_config_v2';
export const PATROL_UNLOCKED_SESSION_KEY = 'hspd_patrol_archive_unlocked_session_v1';

/**
 * Generate a clean 6-digit numerical PIN (e.g. 748291)
 */
export const generateRandomPin = (): string => {
  return String(Math.floor(100000 + Math.random() * 900000));
};

/**
 * Default fallback initial configuration
 */
export const getDefaultAuthorityPinConfig = (): AuthorityPinConfig => {
  const now = Date.now();
  const initialPin = '849201';
  return {
    currentPin: initialPin,
    generatedAt: now,
    expiresAt: now + 60 * 60 * 1000, // 1 hour from now
    autoRotateHourly: true,
    durationMinutes: 60,
    mode: 'hourly_auto',
    setBy: 'HQ Command Security Auto-Rotate',
    setByBadge: '#001',
    setByRank: 'CHIEF OF POLICE [COP]',
    history: [
      {
        id: `pin-log-${now}`,
        pin: initialPin,
        type: 'hourly_auto',
        generatedAt: now,
        expiresAt: now + 60 * 60 * 1000,
        setBy: 'HQ Command Security Auto-Rotate',
        setByBadge: '#001',
        setByRank: 'CHIEF OF POLICE [COP]',
        notes: 'Inisialisasi PIN Otoritas Pembuka Berkas (Rotasi 1 Jam Sekali)'
      }
    ]
  };
};

/**
 * Load Authority PIN Configuration with auto-expiry & hourly rotation check
 */
export const getAuthorityPinConfig = (): AuthorityPinConfig => {
  try {
    const raw = localStorage.getItem(AUTHORITY_PIN_STORAGE_KEY);
    if (!raw) {
      const initial = getDefaultAuthorityPinConfig();
      saveAuthorityPinConfig(initial);
      return initial;
    }

    const config: AuthorityPinConfig = JSON.parse(raw);
    const now = Date.now();

    // Check if PIN has expired
    if (now >= config.expiresAt) {
      if (config.autoRotateHourly) {
        // Automatically generate a new hourly PIN
        const newPin = generateRandomPin();
        const newExpiresAt = now + 60 * 60 * 1000;
        const newLog: AuthorityPinLog = {
          id: `pin-log-${now}`,
          pin: newPin,
          type: 'hourly_auto',
          generatedAt: now,
          expiresAt: newExpiresAt,
          setBy: 'HQ Auto-Hourly Rotator',
          setByBadge: 'SYSTEM',
          setByRank: 'HIGH COMMAND',
          notes: 'Rotasi Otomatis Berkala (Setiap 1 Jam)'
        };

        const updatedConfig: AuthorityPinConfig = {
          ...config,
          currentPin: newPin,
          generatedAt: now,
          expiresAt: newExpiresAt,
          durationMinutes: 60,
          mode: 'hourly_auto',
          setBy: 'HQ Auto-Hourly Rotator',
          history: [newLog, ...(config.history || [])].slice(0, 15)
        };

        saveAuthorityPinConfig(updatedConfig);
        return updatedConfig;
      }
    }

    return config;
  } catch (err) {
    console.error('Failed to load authority PIN config, resetting to default', err);
    const fallback = getDefaultAuthorityPinConfig();
    saveAuthorityPinConfig(fallback);
    return fallback;
  }
};

/**
 * Save configuration to LocalStorage
 */
export const saveAuthorityPinConfig = (config: AuthorityPinConfig): void => {
  try {
    localStorage.setItem(AUTHORITY_PIN_STORAGE_KEY, JSON.stringify(config));
    pushToFirestore('SYSTEM_CONFIGS', { id: 'authority_pin', ...config }, 'authority_pin').catch(console.error);
  } catch (err) {
    console.error('Failed to save authority PIN config', err);
  }
};

/**
 * Rotate Authority PIN to a fresh random 6-digit PIN (Hourly mode)
 */
export const rotateAuthorityPinHourly = (
  officer?: { name: string; badge: string; rank: string }
): AuthorityPinConfig => {
  const currentConfig = getAuthorityPinConfig();
  const now = Date.now();
  const newPin = generateRandomPin();
  const newExpiresAt = now + 60 * 60 * 1000;

  const newLog: AuthorityPinLog = {
    id: `pin-log-${now}`,
    pin: newPin,
    type: 'hourly_auto',
    generatedAt: now,
    expiresAt: newExpiresAt,
    setBy: officer ? `${officer.name}` : 'High Command',
    setByBadge: officer?.badge || '#001',
    setByRank: officer?.rank || 'COMMAND',
    notes: officer ? `Dibuat ulang (Refresh) oleh ${officer.name} (${officer.rank})` : 'Rotasi 1 Jam Otomatis'
  };

  const updated: AuthorityPinConfig = {
    ...currentConfig,
    currentPin: newPin,
    generatedAt: now,
    expiresAt: newExpiresAt,
    autoRotateHourly: true,
    durationMinutes: 60,
    mode: 'hourly_auto',
    setBy: officer ? `${officer.name}` : 'High Command',
    setByBadge: officer?.badge || '#001',
    setByRank: officer?.rank || 'COMMAND',
    history: [newLog, ...(currentConfig.history || [])].slice(0, 15)
  };

  saveAuthorityPinConfig(updated);
  return updated;
};

/**
 * Set a manual custom Authority PIN with chosen duration
 */
export const setManualAuthorityPin = (
  customPin: string,
  durationMinutes: number, // 0 = permanent/no expiration until next change
  officer?: { name: string; badge: string; rank: string },
  notes?: string
): AuthorityPinConfig => {
  const currentConfig = getAuthorityPinConfig();
  const now = Date.now();
  const cleanPin = customPin.trim().toUpperCase();
  const newExpiresAt = durationMinutes > 0 ? now + durationMinutes * 60 * 1000 : now + 365 * 24 * 60 * 60 * 1000;

  const newLog: AuthorityPinLog = {
    id: `pin-log-${now}`,
    pin: cleanPin,
    type: 'manual',
    generatedAt: now,
    expiresAt: newExpiresAt,
    setBy: officer ? `${officer.name}` : 'Atasan',
    setByBadge: officer?.badge || '#001',
    setByRank: officer?.rank || 'HIGH COMMAND',
    notes: notes || `PIN Manual dibuat oleh ${officer?.name || 'Atasan'} (Durasi: ${durationMinutes === 0 ? 'Permanen' : `${durationMinutes} Menit`})`
  };

  const updated: AuthorityPinConfig = {
    ...currentConfig,
    currentPin: cleanPin,
    generatedAt: now,
    expiresAt: newExpiresAt,
    autoRotateHourly: false, // Turned off when manually forced, unless re-enabled
    durationMinutes: durationMinutes || 60,
    mode: 'manual',
    setBy: officer ? `${officer.name}` : 'Atasan',
    setByBadge: officer?.badge || '#001',
    setByRank: officer?.rank || 'HIGH COMMAND',
    history: [newLog, ...(currentConfig.history || [])].slice(0, 15)
  };

  saveAuthorityPinConfig(updated);
  return updated;
};

/**
 * Toggle auto-rotate hourly
 */
export const toggleAutoRotateHourly = (enabled: boolean): AuthorityPinConfig => {
  const currentConfig = getAuthorityPinConfig();
  const now = Date.now();

  let updated: AuthorityPinConfig;
  if (enabled) {
    // If enabling auto-rotate, ensure fresh 1 hour expiration
    const newExpiresAt = now + 60 * 60 * 1000;
    updated = {
      ...currentConfig,
      autoRotateHourly: true,
      mode: 'hourly_auto',
      expiresAt: Math.max(currentConfig.expiresAt, newExpiresAt),
      durationMinutes: 60
    };
  } else {
    updated = {
      ...currentConfig,
      autoRotateHourly: false,
      mode: 'manual'
    };
  }

  saveAuthorityPinConfig(updated);
  return updated;
};

/**
 * Validate given input PIN
 */
export const validateAuthorityPin = (
  inputPin: string
): { valid: boolean; message: string; isSupervisorEmergency?: boolean } => {
  if (!inputPin) {
    return { valid: false, message: 'Harap masukkan PIN Otoritas pembuka berkas.' };
  }

  const clean = inputPin.trim().toUpperCase();
  const config = getAuthorityPinConfig();
  const now = Date.now();

  // 1. Check exact match with active Authority PIN
  if (clean === config.currentPin.toUpperCase()) {
    if (now > config.expiresAt && !config.autoRotateHourly) {
      return {
        valid: false,
        message: 'PIN Otoritas ini telah kedaluwarsa. Silakan minta PIN baru dari pihak Atasan/High Command.'
      };
    }
    return { valid: true, message: 'Otorisasi PIN Berhasil! Berkas kasus dibuka.' };
  }

  // 2. Check emergency High Command supervisor passcodes (10-4, 911, HSPD-HQ, etc)
  const isEmergencySupervisor = VALID_SUPERVISOR_PASSCODES.some(
    code => code.toUpperCase() === clean
  );

  if (isEmergencySupervisor) {
    return {
      valid: true,
      message: 'Otorisasi Master Passcode HQ Diterima.',
      isSupervisorEmergency: true
    };
  }

  return {
    valid: false,
    message: 'PIN Otoritas salah atau telah kedaluwarsa! Hubungi Atasan / High Command untuk mendapatkan PIN aktif.'
  };
};

/**
 * Format remaining time to MM:SS or HH:MM:SS
 */
export const formatRemainingTime = (expiresAt: number): { text: string; percentRemaining: number; isExpired: boolean } => {
  const now = Date.now();
  const diffMs = expiresAt - now;

  if (diffMs <= 0) {
    return { text: 'Kedaluwarsa (00:00)', percentRemaining: 0, isExpired: true };
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  // Assuming a 60-minute window for progress calculation
  const totalWindowMs = 60 * 60 * 1000;
  const percent = Math.min(100, Math.max(0, Math.round((diffMs / totalWindowMs) * 100)));

  if (hours > 0) {
    return {
      text: `${hours} jam ${minutes} menit ${seconds} dtk`,
      percentRemaining: percent,
      isExpired: false
    };
  }

  const padMin = String(minutes).padStart(2, '0');
  const padSec = String(seconds).padStart(2, '0');
  return {
    text: `${padMin}:${padSec}`,
    percentRemaining: percent,
    isExpired: false
  };
};

/**
 * Generate formatted Radio/Discord broadcast message for High Command to share
 */
export const formatAuthorityPinBroadcast = (
  config: AuthorityPinConfig,
  currentOfficerName?: string
): string => {
  const remaining = formatRemainingTime(config.expiresAt);
  return `📢 **[HSPD HIGH COMMAND - KEAMANAN BERKAS INVESTIGASI]**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔐 **PIN Otoritas Pembuka Berkas Kasus:** \`${config.currentPin}\`
⏳ **Status:** Aktif (Masa berlaku: ${remaining.text})
⚙️ **Mode:** ${config.mode === 'hourly_auto' ? 'Rotasi Otomatis Setiap 1 Jam' : 'Ditetapkan Manual oleh Atasan'}
🎖️ **Diterbitkan Oleh:** ${config.setBy} (${config.setByRank || 'HIGH COMMAND'} ${config.setByBadge || ''})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*Catatan: Petugas lapangan wajib memasukkan PIN ini untuk membuka, membaca, atau mengekspor arsip berkas kasus tersangka.*`;
};
