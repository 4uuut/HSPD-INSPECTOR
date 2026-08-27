import { HSPD_LOGO_URL } from '../assets/logo';

export interface DepartmentBrandingConfig {
  id?: string;                  // identifier for sync
  logoUrl: string;
  departmentCode: string;       // e.g. "HSPD", "LSPD", "SAPD", "BCSO"
  departmentName: string;       // e.g. "HIGH STATE POLICE DEPT"
  subTitle: string;             // e.g. "INSPECTOR", "CENTRAL MDT", "CAD SYSTEM"
  cadBadgeText: string;         // e.g. "MDC-CAD", "CAD-POLICE", "HQ-LINK"
  agencyJurisdiction: string;   // e.g. "STATE OF HIGH STATE POLICE DEPARTMENT"
  radioFreq: string;            // e.g. "1111", "911.0", "100.5"
  watermarkText?: string;       // e.g. "CONFIDENTIAL • LAW ENFORCEMENT SENSITIVE"
  accentColor?: string;         // 'amber' | 'blue' | 'emerald' | 'cyan' | 'red' | 'purple'
  customSealUrl?: string;       // Optional custom stamp/seal for official letters
  updatedAt: number;
  updatedBy?: string;
}

export const BRANDING_STORAGE_KEY = 'hspd_custom_branding_v1';
export const BRANDING_UPDATED_EVENT = 'hspd-branding-updated';

export const DEFAULT_BRANDING: DepartmentBrandingConfig = {
  id: 'active_branding',
  logoUrl: HSPD_LOGO_URL,
  departmentCode: 'HSPD',
  departmentName: 'HIGH STATE POLICE DEPT',
  subTitle: 'INSPECTOR',
  cadBadgeText: 'MDC-CAD',
  agencyJurisdiction: 'STATE OF HIGH STATE POLICE DEPARTMENT',
  radioFreq: '1111',
  watermarkText: 'CONFIDENTIAL • LAW ENFORCEMENT SENSITIVE',
  accentColor: 'amber',
  updatedAt: 1700000000000,
  updatedBy: 'Sistem Pusat Kepolisian'
};

export interface PresetLogoItem {
  id: string;
  name: string;
  category: string;
  url: string;
  description: string;
  suggestedCode: string;
  suggestedName: string;
  suggestedJurisdiction: string;
}

export const PRESET_LOGOS: PresetLogoItem[] = [
  {
    id: 'hspd_official',
    name: 'HSPD Official Seal (Original)',
    category: 'High State HQ',
    url: HSPD_LOGO_URL,
    description: 'Lencana resmi Lambang Burung Elang Emas Markas Besar Kepolisian High State',
    suggestedCode: 'HSPD',
    suggestedName: 'HIGH STATE POLICE DEPT',
    suggestedJurisdiction: 'STATE OF HIGH STATE POLICE DEPARTMENT'
  },
  {
    id: 'lspd_metro',
    name: 'LSPD Metropolitan Shield',
    category: 'City Police',
    url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&auto=format&fit=crop&q=80',
    description: 'Perisai Biru Emas Polisi Metropolitan Kota (Los Santos / Metro Police)',
    suggestedCode: 'LSPD',
    suggestedName: 'LOS SANTOS POLICE DEPT',
    suggestedJurisdiction: 'CITY OF LOS SANTOS POLICE DEPARTMENT'
  },
  {
    id: 'bcso_sheriff',
    name: 'Sheriff County 7-Point Star',
    category: 'Sheriff Office',
    url: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=400&auto=format&fit=crop&q=80',
    description: 'Bintang 7 Sudut Emas Lambang Kantor Sheriff Wilayah County & Pedesaan',
    suggestedCode: 'BCSO',
    suggestedName: 'BLAINE COUNTY SHERIFF',
    suggestedJurisdiction: 'BLAINE COUNTY SHERIFF OFFICE'
  },
  {
    id: 'state_trooper',
    name: 'State Highway Patrol (SAHP)',
    category: 'State Police',
    url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&auto=format&fit=crop&q=80',
    description: 'Lencana Patroli Jalan Raya Provinsi / State Trooper Highway Patrol',
    suggestedCode: 'SAHP',
    suggestedName: 'SAN ANDREAS HIGHWAY PATROL',
    suggestedJurisdiction: 'STATE HIGHWAY PATROL DIVISION'
  },
  {
    id: 'tactical_swat',
    name: 'S.W.A.T. Tactical Hawk',
    category: 'Special Ops',
    url: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400&auto=format&fit=crop&q=80',
    description: 'Lambang Elang Malam Pasukan Khusus Taktis Anti-Teror & Penyerbuan Cepat',
    suggestedCode: 'SWAT',
    suggestedName: 'SPECIAL WEAPONS & TACTICS',
    suggestedJurisdiction: 'SPECIAL OPERATIONS DIVISION'
  },
  {
    id: 'detective_cid',
    name: 'CID Detective Bureau Shield',
    category: 'Investigasi',
    url: 'https://images.unsplash.com/photo-1453728013993-6d66e9c9123a?w=400&auto=format&fit=crop&q=80',
    description: 'Perisai Emas Khusus Detektif Kriminal & Biro Investigasi Kasus Berat',
    suggestedCode: 'CID',
    suggestedName: 'CRIMINAL INVESTIGATION DIV',
    suggestedJurisdiction: 'MAJOR CRIMES & DETECTIVE BUREAU'
  }
];

/**
 * Retrieve current active branding configuration from storage.
 */
export function getCustomBranding(): DepartmentBrandingConfig {
  try {
    const raw = localStorage.getItem(BRANDING_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          ...DEFAULT_BRANDING,
          ...parsed,
          logoUrl: parsed.logoUrl || DEFAULT_BRANDING.logoUrl,
          departmentCode: parsed.departmentCode || DEFAULT_BRANDING.departmentCode,
          departmentName: parsed.departmentName || DEFAULT_BRANDING.departmentName,
          subTitle: parsed.subTitle || DEFAULT_BRANDING.subTitle,
          cadBadgeText: parsed.cadBadgeText || DEFAULT_BRANDING.cadBadgeText,
          agencyJurisdiction: parsed.agencyJurisdiction || DEFAULT_BRANDING.agencyJurisdiction,
          radioFreq: parsed.radioFreq || DEFAULT_BRANDING.radioFreq
        };
      }
    }
  } catch (e) {
    console.error('Failed to parse branding from storage:', e);
  }
  return { ...DEFAULT_BRANDING };
}

/**
 * Save customized department branding to storage & broadcast update event.
 */
export function saveCustomBranding(config: Partial<DepartmentBrandingConfig>, updatedBy?: string): DepartmentBrandingConfig {
  const current = getCustomBranding();
  const updated: DepartmentBrandingConfig = {
    ...current,
    ...config,
    id: 'active_branding',
    updatedAt: Date.now(),
    updatedBy: updatedBy || current.updatedBy || 'Petugas Kepolisian'
  };

  try {
    localStorage.setItem(BRANDING_STORAGE_KEY, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(BRANDING_UPDATED_EVENT, { detail: updated }));
    }
  } catch (e) {
    console.error('Failed to save custom branding:', e);
  }

  return updated;
}

/**
 * Reset branding to default official HSPD logo and titles.
 */
export function resetCustomBranding(): DepartmentBrandingConfig {
  try {
    localStorage.setItem(BRANDING_STORAGE_KEY, JSON.stringify(DEFAULT_BRANDING));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(BRANDING_UPDATED_EVENT, { detail: DEFAULT_BRANDING }));
    }
  } catch (e) {
    console.error('Failed to reset custom branding:', e);
  }
  return { ...DEFAULT_BRANDING };
}

/**
 * React hook or listener helper for branding changes across components.
 */
export function subscribeToBranding(callback: (config: DepartmentBrandingConfig) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleUpdate = (e: any) => {
    if (e && e.detail) {
      callback(e.detail);
    } else {
      callback(getCustomBranding());
    }
  };

  window.addEventListener(BRANDING_UPDATED_EVENT, handleUpdate);
  window.addEventListener('storage', (e) => {
    if (e.key === BRANDING_STORAGE_KEY) {
      callback(getCustomBranding());
    }
  });

  return () => {
    window.removeEventListener(BRANDING_UPDATED_EVENT, handleUpdate);
  };
}
