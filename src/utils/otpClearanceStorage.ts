import { 
  OneTimePasscode, 
  ModuleAccessKey, 
  OfficerProfile, 
  isSupervisorOrAbove, 
  isOfficerHighRank, 
  ModuleClearanceRule, 
  getRankHierarchyTier,
  VALID_SUPERVISOR_PASSCODES
} from '../types';

export const OTP_STORAGE_KEY = 'hspd_one_time_passcodes_v1';
export const OTP_ACTIVE_SESSIONS_KEY = 'hspd_otp_active_sessions_v1';

export const MODULE_CLEARANCE_RULES: Record<ModuleAccessKey, ModuleClearanceRule> = {
  VAULT: {
    key: 'VAULT',
    title: 'Brankas & Audit Inventaris Markas (Vault & Evidence)',
    description: 'Akses brankas uang sitaan, audit narkotika, log senjata sitaan, dan pengamanan segel.',
    minimumRankTier: 2, // Captain & Lieutenant or High Command
    directAccessRanks: [
      'CHIEF OF POLICE [COP]',
      'ASSISTANT CHIEF [A/C]',
      'DEPUTY CHIEF [D/C]',
      'COMMANDER [CDR]',
      'CAPTAIN [CPT]',
      'LIEUTENANT [LT]'
    ],
    allowOtpBypass: true,
    iconName: 'Landmark'
  },
  DESTRUCTION: {
    key: 'DESTRUCTION',
    title: 'Peleburan & Pemusnahan Barang Bukti (Destruction Registry)',
    description: 'Peleburan kendaraan sitaan, pemusnahan narkotika, peleburan senjata ilegal, & penerbitan Berita Acara.',
    minimumRankTier: 2, // Lieutenant & Captain or High Command
    directAccessRanks: [
      'CHIEF OF POLICE [COP]',
      'ASSISTANT CHIEF [A/C]',
      'DEPUTY CHIEF [D/C]',
      'COMMANDER [CDR]',
      'CAPTAIN [CPT]',
      'LIEUTENANT [LT]'
    ],
    allowOtpBypass: true,
    iconName: 'Flame'
  },
  OFFICIAL_DOCS: {
    key: 'OFFICIAL_DOCS',
    title: 'Dokumen Resmi & Otorisasi Surat Rahasia / WCL',
    description: 'Penerbitan Surat Perintah Tugas Operasi, Weapon Carry License (WCL), BAP Rahasia, & Izin Intelijen.',
    minimumRankTier: 2, // Lieutenant & above for confidential / WCL docs
    directAccessRanks: [
      'CHIEF OF POLICE [COP]',
      'ASSISTANT CHIEF [A/C]',
      'DEPUTY CHIEF [D/C]',
      'COMMANDER [CDR]',
      'CAPTAIN [CPT]',
      'LIEUTENANT [LT]'
    ],
    allowOtpBypass: true,
    iconName: 'Stamp'
  },
  CASE_HISTORY: {
    key: 'CASE_HISTORY',
    title: 'Arsip Riwayat Kasus & Penindakan Tersangka',
    description: 'Audit log penindakan, ekspor berkas kasus tersangka, cetak Berita Acara & hapus data kasus.',
    minimumRankTier: 2,
    directAccessRanks: [
      'CHIEF OF POLICE [COP]',
      'ASSISTANT CHIEF [A/C]',
      'DEPUTY CHIEF [D/C]',
      'COMMANDER [CDR]',
      'CAPTAIN [CPT]',
      'LIEUTENANT [LT]'
    ],
    allowOtpBypass: true,
    iconName: 'FileText'
  },
  DETECTIVE: {
    key: 'DETECTIVE',
    title: 'Biro Investigasi Kriminal / Detective Case Board (CID)',
    description: 'Pohon hierarki sindikat, bukti balistik rahasia, pengawasan operasi intelijen, & status buronan.',
    minimumRankTier: 3, // Detectives & Sergeants + High Command
    directAccessRanks: [
      'CHIEF OF POLICE [COP]',
      'ASSISTANT CHIEF [A/C]',
      'DEPUTY CHIEF [D/C]',
      'COMMANDER [CDR]',
      'CAPTAIN [CPT]',
      'LIEUTENANT [LT]'
    ],
    allowOtpBypass: true,
    iconName: 'Search'
  },
  IAD: {
    key: 'IAD',
    title: 'Divisi Propam & Disiplin Internal (Internal Affairs Bureau)',
    description: 'Investigasi pelanggaran etik, laporan suap/korupsi, audit tindakan represif, & sidang disiplin personel.',
    minimumRankTier: 2, // Captain, Lieutenant & High Command
    directAccessRanks: [
      'CHIEF OF POLICE [COP]',
      'ASSISTANT CHIEF [A/C]',
      'DEPUTY CHIEF [D/C]',
      'COMMANDER [CDR]',
      'CAPTAIN [CPT]',
      'LIEUTENANT [LT]'
    ],
    allowOtpBypass: true,
    iconName: 'ShieldAlert'
  },
  FORENSICS: {
    key: 'FORENSICS',
    title: 'Laboratorium Forensik & Balistik (Crime Lab)',
    description: 'Uji residu mesiu (GSR), pencocokan alur proyektil senjata (Ballistics), uji kemurnian narkoba, & sidik jari.',
    minimumRankTier: 4, // PO I and above or OTP
    directAccessRanks: [
      'CHIEF OF POLICE [COP]',
      'ASSISTANT CHIEF [A/C]',
      'DEPUTY CHIEF [D/C]',
      'COMMANDER [CDR]',
      'CAPTAIN [CPT]',
      'LIEUTENANT [LT]',
      'SERGEANT [SGT]',
      'SENIOR LEAD OFFICER [SLO]',
      'POLICE OFFICER III [PO III]',
      'POLICE OFFICER II [PO II]',
      'POLICE OFFICER I [PO I]'
    ],
    allowOtpBypass: true,
    iconName: 'Microscope'
  },
  DISPATCH: {
    key: 'DISPATCH',
    title: 'Terminal CAD 911 & Panic Emergency System',
    description: 'Monitoring panggilan darurat warga sipil 911, aktivasi Panic Button 10-99, & tracking pengejaran Code 3.',
    minimumRankTier: 5, // All duty officers
    directAccessRanks: [
      'CHIEF OF POLICE [COP]',
      'ASSISTANT CHIEF [A/C]',
      'DEPUTY CHIEF [D/C]',
      'COMMANDER [CDR]',
      'CAPTAIN [CPT]',
      'LIEUTENANT [LT]',
      'SERGEANT [SGT]',
      'SENIOR LEAD OFFICER [SLO]',
      'POLICE OFFICER III [PO III]',
      'POLICE OFFICER II [PO II]',
      'POLICE OFFICER I [PO I]',
      'CADET [CDT]'
    ],
    allowOtpBypass: true,
    iconName: 'Radio'
  },
  DMV_CITIZEN: {
    key: 'DMV_CITIZEN',
    title: 'Database Sipil & Kendaraan DMV (Citizen Registry)',
    description: 'Pencarian identitas KTP warga, riwayat kepemilikan senjata api (WCL), catatan tilang, & kendaraan terdaftar.',
    minimumRankTier: 4, // PO I and above
    directAccessRanks: [
      'CHIEF OF POLICE [COP]',
      'ASSISTANT CHIEF [A/C]',
      'DEPUTY CHIEF [D/C]',
      'COMMANDER [CDR]',
      'CAPTAIN [CPT]',
      'LIEUTENANT [LT]',
      'SERGEANT [SGT]',
      'SENIOR LEAD OFFICER [SLO]',
      'POLICE OFFICER III [PO III]',
      'POLICE OFFICER II [PO II]',
      'POLICE OFFICER I [PO I]'
    ],
    allowOtpBypass: true,
    iconName: 'UserCheck'
  },
  SPECIAL_DIVISIONS: {
    key: 'SPECIAL_DIVISIONS',
    title: 'Hub Divisi Khusus (Specialized Divisions Headquarters)',
    description: 'Pusat operasi taktis SWAT, Air Support Division (ASD Helo), Unit K-9 Satwa, Propam IAD, & Akademi Kepolisian.',
    minimumRankTier: 4,
    directAccessRanks: [
      'CHIEF OF POLICE [COP]',
      'ASSISTANT CHIEF [A/C]',
      'DEPUTY CHIEF [D/C]',
      'COMMANDER [CDR]',
      'CAPTAIN [CPT]',
      'LIEUTENANT [LT]',
      'SERGEANT [SGT]',
      'SENIOR LEAD OFFICER [SLO]',
      'POLICE OFFICER III [PO III]',
      'POLICE OFFICER II [PO II]',
      'POLICE OFFICER I [PO I]'
    ],
    allowOtpBypass: true,
    iconName: 'Award'
  },
  UNIVERSAL: {
    key: 'UNIVERSAL',
    title: 'Master Otorisasi Sekali Pakai (Universal Clearance)',
    description: 'Dapat digunakan untuk membuka modul manapun yang sedang terkunci dalam satu kali sesi penugasan.',
    minimumRankTier: 1, // Only High Command can issue Universal
    directAccessRanks: [
      'CHIEF OF POLICE [COP]',
      'ASSISTANT CHIEF [A/C]',
      'DEPUTY CHIEF [D/C]',
      'COMMANDER [CDR]'
    ],
    allowOtpBypass: true,
    iconName: 'ShieldAlert'
  }
};

/**
 * Check whether an officer has direct rank-based clearance for a given module
 */
export const checkDirectRankClearance = (
  moduleKey: ModuleAccessKey,
  officer?: OfficerProfile | null
): { hasClearance: boolean; reason: string; requiredRanks: string[] } => {
  const rule = MODULE_CLEARANCE_RULES[moduleKey] || MODULE_CLEARANCE_RULES.VAULT;
  
  if (!officer) {
    return {
      hasClearance: false,
      reason: 'Petugas belum terautentikasi / belum login.',
      requiredRanks: rule.directAccessRanks
    };
  }

  // Detective module special rule: Detective division members have clearance
  if (moduleKey === 'DETECTIVE') {
    const isDetectiveDiv = (officer.division || '').toLowerCase().includes('detective') || 
                           (officer.division || '').toLowerCase().includes('cid') ||
                           (officer.division || '').toLowerCase().includes('internal affairs') ||
                           (officer.division || '').toLowerCase().includes('ia');
    if (isDetectiveDiv) {
      return {
        hasClearance: true,
        reason: 'Akses Diberikan: Divisi Investigasi Kriminal (Detective Bureau / CID / IA).',
        requiredRanks: rule.directAccessRanks
      };
    }
  }

  // Direct rank check
  const tierInfo = getRankHierarchyTier(officer.rank);
  if (tierInfo.tier <= rule.minimumRankTier) {
    return {
      hasClearance: true,
      reason: `Akses Diberikan Langsung: Pangkat Anda (${officer.rank}) memiliki kewenangan ${tierInfo.label}.`,
      requiredRanks: rule.directAccessRanks
    };
  }

  return {
    hasClearance: false,
    reason: `Pangkat Anda (${officer.rank}) berada di ${tierInfo.label}. Modul ini membutuhkan otorisasi minimal Tier ${rule.minimumRankTier} (Lieutenant / Captain / High Command) atau Kode Akses Sekali Pakai (OTP) dari Atasan.`,
    requiredRanks: rule.directAccessRanks
  };
};

/**
 * Generate a clean, realistic OTP code string
 * e.g., "OTP-BRK-7492", "OTP-LBR-1823", "OTP-DOC-9041", "OTP-ALL-5510"
 */
export const generateOtpCode = (module: ModuleAccessKey): string => {
  const prefixMap: Record<ModuleAccessKey, string> = {
    VAULT: 'OTP-BRK',
    DESTRUCTION: 'OTP-LBR',
    OFFICIAL_DOCS: 'OTP-DOC',
    CASE_HISTORY: 'OTP-CAS',
    DETECTIVE: 'OTP-CID',
    IAD: 'OTP-IAD',
    FORENSICS: 'OTP-LAB',
    DISPATCH: 'OTP-CAD',
    DMV_CITIZEN: 'OTP-DMV',
    SPECIAL_DIVISIONS: 'OTP-DIV',
    UNIVERSAL: 'OTP-ALL'
  };

  const prefix = prefixMap[module] || 'OTP-HSPD';
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${randomDigits}`;
};

/**
 * Retrieve saved OTP list from LocalStorage
 */
export const getSavedOtps = (): OneTimePasscode[] => {
  try {
    const raw = localStorage.getItem(OTP_STORAGE_KEY);
    if (!raw) return getInitialDemoOtps();
    const list: OneTimePasscode[] = JSON.parse(raw);
    const now = Date.now();

    // Auto-update expired items
    return list.map(item => {
      if (item.status === 'ACTIVE' && item.expiresAt > 0 && now > item.expiresAt) {
        return { ...item, status: 'EXPIRED' as const };
      }
      return item;
    });
  } catch (e) {
    console.error('Failed to parse OTP list', e);
    return getInitialDemoOtps();
  }
};

/**
 * Initial Demo OTPs for realistic preview
 */
export const getInitialDemoOtps = (): OneTimePasscode[] => {
  const now = Date.now();
  return [
    {
      id: 'otp-demo-vault-001',
      code: 'OTP-BRK-8492',
      module: 'VAULT',
      moduleLabel: 'Brankas & Audit Inventaris',
      issuedToOfficerName: 'Semua Personel (General Disposisi)',
      issuedToBadge: '#ALL',
      issuedByOfficerName: 'Leoarnd Neave',
      issuedByBadge: '#001',
      issuedByRank: 'CHIEF OF POLICE [COP]',
      purpose: 'Perintah Audit Inventaris & Brankas Mingguan Markas',
      createdAt: now - 15 * 60 * 1000,
      expiresAt: now + 45 * 60 * 1000,
      durationMinutes: 60,
      maxUsage: 1,
      usageCount: 0,
      status: 'ACTIVE'
    },
    {
      id: 'otp-demo-destr-002',
      code: 'OTP-LBR-3819',
      module: 'DESTRUCTION',
      moduleLabel: 'Peleburan & Pemusnahan Sitaan',
      issuedToOfficerName: 'Amy Santiago',
      issuedToBadge: '#215',
      issuedByOfficerName: 'Raymond Holt',
      issuedByBadge: '#401',
      issuedByRank: 'CAPTAIN [CPT]',
      purpose: 'Disposisi Pemusnahan Narkotika Sitaan Kasus #294',
      createdAt: now - 30 * 60 * 1000,
      expiresAt: now + 30 * 60 * 1000,
      durationMinutes: 60,
      maxUsage: 1,
      usageCount: 0,
      status: 'ACTIVE'
    },
    {
      id: 'otp-demo-doc-003',
      code: 'OTP-DOC-7721',
      module: 'OFFICIAL_DOCS',
      moduleLabel: 'Surat & Dokumen Resmi',
      issuedToOfficerName: 'Charles Boyle',
      issuedToBadge: '#220',
      issuedByOfficerName: 'Leoarnd Neave',
      issuedByBadge: '#001',
      issuedByRank: 'CHIEF OF POLICE [COP]',
      purpose: 'Otorisasi Penerbitan Surat Izin Senjata (WCL) & Surat Perintah',
      createdAt: now - 10 * 60 * 1000,
      expiresAt: now + 50 * 60 * 1000,
      durationMinutes: 60,
      maxUsage: 1,
      usageCount: 0,
      status: 'ACTIVE'
    }
  ];
};

/**
 * Save OTP list to LocalStorage
 */
export const saveOtpList = (list: OneTimePasscode[]): void => {
  try {
    localStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event('hspd-otp-updated'));
  } catch (e) {
    console.error('Failed to save OTP list', e);
  }
};

/**
 * Create and save a new OTP
 */
export const createNewOtp = (params: {
  module: ModuleAccessKey;
  issuedToOfficerName: string;
  issuedToBadge?: string;
  issuedByOfficer: OfficerProfile;
  purpose: string;
  durationMinutes: number; // 0 = single use only (burn immediately), or 15, 30, 60, 120
  customCode?: string;
}): OneTimePasscode => {
  const now = Date.now();
  const rule = MODULE_CLEARANCE_RULES[params.module] || MODULE_CLEARANCE_RULES.VAULT;
  const code = params.customCode?.trim().toUpperCase() || generateOtpCode(params.module);
  const duration = params.durationMinutes > 0 ? params.durationMinutes : 30; // default 30 mins window
  const expiresAt = now + duration * 60 * 1000;

  const newOtp: OneTimePasscode = {
    id: `otp-${now}-${Math.random().toString(36).substr(2, 5)}`,
    code,
    module: params.module,
    moduleLabel: rule.title,
    issuedToOfficerName: params.issuedToOfficerName.trim() || 'Semua Personel (General Disposisi)',
    issuedToBadge: params.issuedToBadge?.trim() || undefined,
    issuedByOfficerName: params.issuedByOfficer.name,
    issuedByBadge: params.issuedByOfficer.badge,
    issuedByRank: params.issuedByOfficer.rank,
    purpose: params.purpose.trim() || 'Disposisi Mandat Khusus dari Atasan',
    createdAt: now,
    expiresAt,
    durationMinutes: params.durationMinutes,
    maxUsage: 1,
    usageCount: 0,
    status: 'ACTIVE'
  };

  const currentList = getSavedOtps();
  const updatedList = [newOtp, ...currentList].slice(0, 50); // keep last 50
  saveOtpList(updatedList);
  return newOtp;
};

/**
 * Revoke / Cancel an OTP
 */
export const revokeOtp = (otpId: string, revoker: OfficerProfile): boolean => {
  const list = getSavedOtps();
  const target = list.find(o => o.id === otpId);
  if (!target) return false;

  const updated = list.map(o => {
    if (o.id === otpId) {
      return {
        ...o,
        status: 'REVOKED' as const,
        purpose: `${o.purpose} [DIBATALKAN OLEH ${revoker.name} (${revoker.rank})]`
      };
    }
    return o;
  });

  saveOtpList(updated);
  return true;
};

// ==========================================
// 🔓 TEMPORARY ACTIVE SESSION MANAGEMENT
// ==========================================
export interface ActiveOtpSession {
  module: ModuleAccessKey;
  officerBadge: string;
  officerName: string;
  otpCode: string;
  unlockedAt: number;
  expiresAt: number;
  authorizedBy: string;
  authorizedByRank: string;
}

export const getActiveOtpSessions = (): ActiveOtpSession[] => {
  try {
    const raw = localStorage.getItem(OTP_ACTIVE_SESSIONS_KEY);
    if (!raw) return [];
    const list: ActiveOtpSession[] = JSON.parse(raw);
    const now = Date.now();
    // Return only non-expired
    return list.filter(s => s.expiresAt > now);
  } catch (e) {
    return [];
  }
};

export const saveActiveOtpSessions = (sessions: ActiveOtpSession[]): void => {
  try {
    localStorage.setItem(OTP_ACTIVE_SESSIONS_KEY, JSON.stringify(sessions));
    window.dispatchEvent(new Event('hspd-active-session-changed'));
  } catch (e) {
    console.error(e);
  }
};

/**
 * Check if the officer has an active unlocked session for the target module
 */
export const hasActiveUnlockedSession = (
  moduleKey: ModuleAccessKey,
  officerBadge?: string
): ActiveOtpSession | null => {
  if (!officerBadge) return null;
  const sessions = getActiveOtpSessions();
  const now = Date.now();

  const found = sessions.find(s => {
    const isModuleMatch = s.module === moduleKey || s.module === 'UNIVERSAL';
    const isBadgeMatch = s.officerBadge.toLowerCase() === officerBadge.toLowerCase() || s.officerBadge === '#ALL';
    const isValid = s.expiresAt > now;
    return isModuleMatch && isBadgeMatch && isValid;
  });

  return found || null;
};

/**
 * Grant a temporary unlocked session to an officer
 */
export const grantUnlockedSession = (
  moduleKey: ModuleAccessKey,
  officer: OfficerProfile,
  otp: OneTimePasscode
): ActiveOtpSession => {
  const now = Date.now();
  // Session duration: if single use, keep active for 30 minutes in browser; else use durationMinutes
  const duration = (otp.durationMinutes && otp.durationMinutes > 0) ? otp.durationMinutes : 30;
  const expiresAt = now + duration * 60 * 1000;

  const session: ActiveOtpSession = {
    module: moduleKey,
    officerBadge: officer.badge,
    officerName: officer.name,
    otpCode: otp.code,
    unlockedAt: now,
    expiresAt,
    authorizedBy: otp.issuedByOfficerName,
    authorizedByRank: otp.issuedByRank
  };

  const existing = getActiveOtpSessions().filter(s => 
    !(s.module === moduleKey && s.officerBadge.toLowerCase() === officer.badge.toLowerCase())
  );

  saveActiveOtpSessions([session, ...existing]);
  return session;
};

/**
 * Revoke / Lock current session
 */
export const clearUnlockedSession = (moduleKey: ModuleAccessKey, officerBadge: string): void => {
  const existing = getActiveOtpSessions().filter(s => 
    !( (s.module === moduleKey || s.module === 'UNIVERSAL') && s.officerBadge.toLowerCase() === officerBadge.toLowerCase() )
  );
  saveActiveOtpSessions(existing);
};

/**
 * Validate given input OTP code and consume it if valid
 */
export const validateAndConsumeOtp = (
  inputCode: string,
  targetModule: ModuleAccessKey,
  currentOfficer: OfficerProfile
): {
  valid: boolean;
  message: string;
  otp?: OneTimePasscode;
  isEmergencyMaster?: boolean;
} => {
  if (!inputCode) {
    return { valid: false, message: 'Harap masukkan Kode Akses Sekali Pakai (OTP).' };
  }

  const clean = inputCode.trim().toUpperCase();

  // Check emergency High Command Supervisor Passcodes (e.g. 10-4, 911, HSPD-HQ)
  if (VALID_SUPERVISOR_PASSCODES.some(c => c.toUpperCase() === clean)) {
    const dummyOtp: OneTimePasscode = {
      id: `otp-emergency-${Date.now()}`,
      code: clean,
      module: targetModule,
      moduleLabel: MODULE_CLEARANCE_RULES[targetModule]?.title || targetModule,
      issuedToOfficerName: currentOfficer.name,
      issuedToBadge: currentOfficer.badge,
      issuedByOfficerName: 'HIGH COMMAND EMERGENCY CLEARANCE',
      issuedByBadge: '#001',
      issuedByRank: 'CHIEF OF POLICE [COP]',
      purpose: 'Otorisasi Master Passcode HQ Darurat',
      createdAt: Date.now(),
      expiresAt: Date.now() + 60 * 60 * 1000,
      durationMinutes: 60,
      maxUsage: 999,
      usageCount: 1,
      status: 'ACTIVE'
    };

    grantUnlockedSession(targetModule, currentOfficer, dummyOtp);
    return {
      valid: true,
      message: 'Otorisasi Master Passcode HQ Diterima! Akses modul berhasil dibuka.',
      otp: dummyOtp,
      isEmergencyMaster: true
    };
  }

  const list = getSavedOtps();
  const now = Date.now();

  const matched = list.find(o => o.code.toUpperCase() === clean);

  if (!matched) {
    return {
      valid: false,
      message: 'Kode OTP tidak ditemukan! Pastikan kode yang dimasukkan sesuai dengan yang diberikan oleh Atasan.'
    };
  }

  if (matched.status === 'REVOKED') {
    return {
      valid: false,
      message: 'Kode OTP ini telah DIBATALKAN / DICABUT oleh pihak Atasan.'
    };
  }

  if (matched.status === 'EXPIRED' || (matched.expiresAt > 0 && now > matched.expiresAt)) {
    return {
      valid: false,
      message: 'Kode OTP ini telah KEDALUWARSA. Silakan minta kode baru dari Atasan / Supervisor Anda.'
    };
  }

  if (matched.status === 'USED' && matched.usageCount >= matched.maxUsage) {
    return {
      valid: false,
      message: `Kode OTP ini sudah PERNAH DIGUNAKAN oleh ${matched.usedByOfficerName || 'Petugas Lain'} pada ${matched.usedAt ? new Date(matched.usedAt).toLocaleTimeString('id-ID') : 'waktu sebelumnya'} (Sekali Pakai).`
    };
  }

  // Module check (allow if OTP is for this module OR if OTP is UNIVERSAL)
  if (matched.module !== targetModule && matched.module !== 'UNIVERSAL') {
    const targetRule = MODULE_CLEARANCE_RULES[targetModule];
    const otpRule = MODULE_CLEARANCE_RULES[matched.module];
    return {
      valid: false,
      message: `Kode OTP ini diterbitkan khusus untuk modul "${otpRule?.title || matched.module}", bukan untuk "${targetRule?.title || targetModule}".`
    };
  }

  // Check designated recipient officer if specified
  if (matched.issuedToBadge && matched.issuedToBadge !== '#ALL') {
    if (matched.issuedToBadge.toLowerCase() !== currentOfficer.badge.toLowerCase()) {
      return {
        valid: false,
        message: `Kode OTP ini diterbitkan khusus untuk Petugas ${matched.issuedToOfficerName} (${matched.issuedToBadge}). Badge Anda (${currentOfficer.badge}) tidak cocok.`
      };
    }
  }

  // OTP IS VALID! Mark as used / increment usage count
  const updatedOtp: OneTimePasscode = {
    ...matched,
    usageCount: matched.usageCount + 1,
    status: 'USED',
    usedByOfficerName: currentOfficer.name,
    usedByBadge: currentOfficer.badge,
    usedAt: now
  };

  const updatedList = list.map(o => o.id === matched.id ? updatedOtp : o);
  saveOtpList(updatedList);

  // Grant session to officer
  grantUnlockedSession(targetModule, currentOfficer, updatedOtp);

  return {
    valid: true,
    message: `Otorisasi Berhasil! Akses dibuka atas mandat dari ${matched.issuedByRank} ${matched.issuedByOfficerName}.`,
    otp: updatedOtp
  };
};

/**
 * Generate formatted Radio / Discord RP message for copying to chat or in-game radio
 */
export const formatOtpRadioBroadcast = (otp: OneTimePasscode): string => {
  const durationText = otp.durationMinutes > 0 
    ? `${otp.durationMinutes} Menit` 
    : '1x Pakai (Langsung Hangus Setelah Diakses)';

  return `📢 **[HSPD HIGH COMMAND - DISPOSISI KODE AKSES SEKALI PAKAI]**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔐 **KODE OTP AKSES:** \`${otp.code}\`
🎯 **MODUL OTORISASI:** ${otp.moduleLabel}
👮 **PENERIMA MANDAT:** ${otp.issuedToOfficerName} ${otp.issuedToBadge ? `(${otp.issuedToBadge})` : ''}
📋 **TUJUAN PENUGASAN:** ${otp.purpose}
⏳ **MASA BERLAKU:** ${durationText}
🎖️ **ATASAN PEMBERI MANDAT:** ${otp.issuedByRank} ${otp.issuedByOfficerName} (${otp.issuedByBadge})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*Petugas penerima silakan masukkan kode OTP di atas pada panel MDT untuk membuka akses modul yang ditugaskan.*`;
};

/**
 * Generate formatted request message for junior officers asking supervisors for OTP
 */
export const formatOtpRequestRadioMessage = (
  moduleKey: ModuleAccessKey,
  officer: OfficerProfile,
  reason?: string
): string => {
  const rule = MODULE_CLEARANCE_RULES[moduleKey] || MODULE_CLEARANCE_RULES.VAULT;
  return `📻 **[RADIO 1111 / DISPATCH - PERMOHONAN KODE DISPOSISI OTP]**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👮 **PEMOHON:** ${officer.rank} ${officer.name} (${officer.badge})
🏢 **DIVISI:** ${officer.division}
🔒 **MODUL DITUJU:** ${rule.title}
📝 **KEPERLUAN:** ${reason || 'Permohonan akses penugasan / penginputan data resmi di MDT'}
👑 **DITUJUKAN KEPADA:** Seluruh Supervisor / High Command bertugas (Lieutenant ke atas)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*Mohon izin kepada Atasan untuk menerbitkan Kode Akses Sekali Pakai (OTP) melalui panel MDT.*`;
};
