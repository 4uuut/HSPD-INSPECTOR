import React, { useState, useEffect } from 'react';
import { PasalCalculator } from './components/PasalCalculator';
import { MegaphoneStudio } from './components/MegaphoneStudio';
import { RoleplayActions } from './components/RoleplayActions';
import { SopLibrary } from './components/SopLibrary';
import { ArrestHistory } from './components/ArrestHistory';
import { OfficerLogin } from './components/OfficerLogin';
import { RosterManagement } from './components/RosterManagement';
import { DutyControlModal } from './components/DutyControlModal';
import { WebhookSettingsModal } from './components/WebhookSettingsModal';
import { AuthorityPinModal } from './components/AuthorityPinModal';
import { PinResetAuditModal } from './components/PinResetAuditModal';
import { DetectiveCaseBoard } from './components/DetectiveCaseBoard';
import { BoloAndTrafficHub } from './components/BoloAndTrafficHub';
import { VaultAuditBoard } from './components/VaultAuditBoard';
import { DestructionRegistryBoard } from './components/DestructionRegistryBoard';
import { OfficialDocumentStudio } from './components/OfficialDocumentStudio';
import { DivisionBadgeHero } from './components/DivisionBadgeHero';
import { ModuleClearanceGuard } from './components/ModuleClearanceGuard';
import { OtpGeneratorModal } from './components/OtpGeneratorModal';
import { CadDispatchBoard } from './components/CadDispatchBoard';
import { SpecializedDivisionsHub } from './components/SpecializedDivisionsHub';
import { CitizenDmvDatabase } from './components/CitizenDmvDatabase';
import { ForensicsLabBoard } from './components/ForensicsLabBoard';
import { getAuthorityPinConfig, formatRemainingTime, AuthorityPinConfig } from './utils/authorityPin';
import { getPendingPinResetCount } from './utils/pinResetStorage';
import { getSavedDetectiveCases, saveDetectiveCases } from './utils/detectiveCaseStorage';
import { getSavedBoloAlerts, saveBoloAlerts, getSavedImpounds, saveImpounds } from './utils/boloImpoundStorage';
import { getOfficerDutyState, saveOfficerDutyState, formatDutyDuration } from './utils/officerDutyStorage';
import { getDiscordWebhookConfig } from './utils/discordWebhook';
import { 
  ArrestRecord, OfficerProfile, OfficerAccount, isOfficerHighRank, isSupervisorOrAbove,
  DetectiveCase, BoloAlert, ImpoundRecord, getDivisionArchetype, ModuleAccessKey 
} from './types';
import { 
  Shield, Calculator, Megaphone, BookOpen, FileText, 
  Radio, Award, User, LogOut, Lock, Sparkles, BadgeCheck,
  Users, ShieldAlert, KeyRound, Power, Clock, CheckCircle2, Sliders,
  Search, Car, Crosshair, Landmark, Flame, Stamp as StampIcon,
  UserCheck, Microscope, Cloud, Database
} from 'lucide-react';
import { HSPD_LOGO_URL } from './assets/logo';
import { 
  initRealtimeFirebaseSync, 
  subscribeToSyncStatus, 
  pushAllToFirestore, 
  syncCollectionWithFirestore,
  FirebaseSyncStatus 
} from './services/firebaseRealtimeSync';

const STORAGE_KEY = 'hspd_arrest_records_v1';
const OFFICER_STORAGE_KEY = 'hspd_active_officer_v1';
const ROSTER_STORAGE_KEY = 'hspd_roster_database_v4';
const DUTY_STATUS_STORAGE_KEY = 'hspd_is_duty_v1';
const DUTY_START_TIME_KEY = 'hspd_duty_start_time_v1';

const INITIAL_ROSTER: OfficerAccount[] = [
  {
    id: 'roster-leoarnd-neave-001',
    name: 'Leoarnd Neave',
    badge: '#001',
    rank: 'CHIEF OF POLICE [COP]',
    division: 'Executive Office / High Command',
    pin: '8462100',
    registeredAt: Date.now() - 86400000 * 60,
    promotedBy: 'SK Pengangkatan Markas Besar Kepolisian HSPD',
  },
  {
    id: 'roster-holt-401',
    name: 'Raymond Holt',
    badge: '#401',
    rank: 'CAPTAIN [CPT]',
    division: 'High Command Staff',
    pin: '40100',
    registeredAt: Date.now() - 86400000 * 30,
    promotedBy: 'SK Kepolisian HighState / HQ Command',
  },
  {
    id: 'roster-jeffords-302',
    name: 'Terry Jeffords',
    badge: '#302',
    rank: 'SERGEANT [SGT]',
    division: 'Patrol Supervisory',
    pin: '30210',
    registeredAt: Date.now() - 86400000 * 20,
    promotedBy: 'Promosi Lapangan oleh Atasan',
  },
  {
    id: 'roster-peralta-204',
    name: 'Jake Peralta',
    badge: '#204',
    rank: 'POLICE OFFICER III [PO III]',
    division: 'Detective Bureau / CID',
    pin: '20499',
    registeredAt: Date.now() - 86400000 * 14,
    promotedBy: 'Promosi oleh Sergeant Jeffords',
  },
  {
    id: 'roster-santiago-215',
    name: 'Amy Santiago',
    badge: '#215',
    rank: 'POLICE OFFICER II [PO II]',
    division: 'Patrol Division',
    pin: '21588',
    registeredAt: Date.now() - 86400000 * 10,
    promotedBy: 'Selesai Masa Probation PO I',
  },
  {
    id: 'roster-boyle-220',
    name: 'Charles Boyle',
    badge: '#220',
    rank: 'POLICE OFFICER II [PO II]',
    division: 'Patrol Division',
    pin: '22077',
    registeredAt: Date.now() - 86400000 * 8,
    promotedBy: 'Selesai Masa Probation PO I',
  },
  {
    id: 'roster-miller-105',
    name: 'John Miller',
    badge: '#105',
    rank: 'POLICE OFFICER I [PO I]',
    division: 'Patrol Division',
    pin: '10501',
    registeredAt: Date.now() - 86400000 * 2,
    promotedBy: 'Lulus Akademi Kepolisian',
  }
];

export default function App() {
  // Active Roster Database
  const [roster, setRoster] = useState<OfficerAccount[]>(() => {
    try {
      let saved = localStorage.getItem(ROSTER_STORAGE_KEY);
      if (!saved) {
        saved = localStorage.getItem('hspd_roster_database_v3') || localStorage.getItem('hspd_roster_database_v2');
      }
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const hasLeoarnd = parsed.some((p: OfficerAccount) => 
            p.name.toLowerCase().includes('leoarnd') || p.badge === '#001'
          );
          if (!hasLeoarnd) {
            return [INITIAL_ROSTER[0], ...parsed];
          } else {
            return parsed.map((p: OfficerAccount) => {
              if (p.name.toLowerCase().includes('leoarnd') || p.badge === '#001') {
                return { ...p, name: 'Leoarnd Neave', pin: '8462100', rank: 'CHIEF OF POLICE [COP]' };
              }
              return p;
            });
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_ROSTER;
  });

  // Current logged in officer
  const [currentOfficer, setCurrentOfficer] = useState<OfficerProfile | null>(() => {
    try {
      const saved = localStorage.getItem(OFFICER_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Duty State per logged in officer
  const [isDuty, setIsDuty] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(OFFICER_STORAGE_KEY);
      const officer: OfficerProfile | null = saved ? JSON.parse(saved) : null;
      if (officer?.badge) {
        return getOfficerDutyState(officer.badge).isDuty;
      }
      return false;
    } catch {
      return false;
    }
  });

  const [dutyStartTime, setDutyStartTime] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(OFFICER_STORAGE_KEY);
      const officer: OfficerProfile | null = saved ? JSON.parse(saved) : null;
      if (officer?.badge) {
        return getOfficerDutyState(officer.badge).dutyStartTime;
      }
      return 0;
    } catch {
      return 0;
    }
  });

  // Ticker for real-time duty duration and auto-sync
  const [, setTimeTicker] = useState<number>(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setTimeTicker(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const [isDutyModalOpen, setIsDutyModalOpen] = useState(false);
  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState(false);
  const [isAuthorityPinModalOpen, setIsAuthorityPinModalOpen] = useState(false);
  const [isPinResetAuditModalOpen, setIsPinResetAuditModalOpen] = useState(false);
  const [isOtpGeneratorModalOpen, setIsOtpGeneratorModalOpen] = useState(false);
  const [otpModalDefaultModule, setOtpModalDefaultModule] = useState<ModuleAccessKey>('VAULT');
  const [pendingPinCount, setPendingPinCount] = useState<number>(() => getPendingPinResetCount());
  const [authorityPinConfig, setAuthorityPinConfig] = useState<AuthorityPinConfig>(() => getAuthorityPinConfig());
  const [pinTimeRemaining, setPinTimeRemaining] = useState(() => formatRemainingTime(authorityPinConfig.expiresAt));

  // Sync pending PIN reset requests count
  useEffect(() => {
    const updateCount = () => {
      setPendingPinCount(getPendingPinResetCount());
    };
    updateCount();
    const interval = setInterval(updateCount, 2500);
    window.addEventListener('storage', updateCount);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', updateCount);
    };
  }, []);

  // Sync authority PIN config on timer tick
  useEffect(() => {
    const fresh = getAuthorityPinConfig();
    setAuthorityPinConfig(fresh);
    setPinTimeRemaining(formatRemainingTime(fresh.expiresAt));

    const interval = setInterval(() => {
      const current = getAuthorityPinConfig();
      setAuthorityPinConfig(current);
      setPinTimeRemaining(formatRemainingTime(current.expiresAt));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const [activeNav, setActiveNav] = useState<'calc' | 'dispatch' | 'dmv' | 'divisions' | 'forensics' | 'documents' | 'detective' | 'traffic' | 'vault' | 'destruction' | 'megaphone' | 'rp' | 'sop' | 'history' | 'roster'>('calc');
  const [records, setRecords] = useState<ArrestRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Detective Cases State
  const [detectiveCases, setDetectiveCases] = useState<DetectiveCase[]>(() => getSavedDetectiveCases());

  // BOLO Alerts State
  const [boloList, setBoloList] = useState<BoloAlert[]>(() => getSavedBoloAlerts());

  // Impound Records State
  const [impoundList, setImpoundList] = useState<ImpoundRecord[]>(() => getSavedImpounds());

  // Persist detective cases
  const handleSaveDetectiveCase = (updatedCase: DetectiveCase) => {
    setDetectiveCases(prev => {
      const updated = prev.map(c => c.id === updatedCase.id ? updatedCase : c);
      saveDetectiveCases(updated);
      return updated;
    });
  };

  const handleCreateDetectiveCase = (newCase: DetectiveCase) => {
    setDetectiveCases(prev => {
      const updated = [newCase, ...prev];
      saveDetectiveCases(updated);
      return updated;
    });
  };

  const handleDeleteDetectiveCase = (caseId: string) => {
    setDetectiveCases(prev => {
      const updated = prev.filter(c => c.id !== caseId);
      saveDetectiveCases(updated);
      return updated;
    });
  };

  // Persist BOLO alerts
  const handleSaveBoloAlerts = (newList: BoloAlert[]) => {
    setBoloList(newList);
    saveBoloAlerts(newList);
  };

  // Persist Impound records
  const handleSaveImpoundRecords = (newList: ImpoundRecord[]) => {
    setImpoundList(newList);
    saveImpounds(newList);
  };

  // Persist roster and sync to Firestore
  useEffect(() => {
    try {
      localStorage.setItem(ROSTER_STORAGE_KEY, JSON.stringify(roster));
      localStorage.setItem('hspd_roster_database_v3', JSON.stringify(roster));
      localStorage.setItem('hspd_roster_database_v2', JSON.stringify(roster));
      if (roster && roster.length > 0) {
        syncCollectionWithFirestore('ROSTER', roster).catch(console.error);
      }
    } catch (e) {
      console.error('Failed to persist roster database', e);
    }
  }, [roster]);

  // Firebase Cloud Database live sync status
  const [firebaseSync, setFirebaseSync] = useState<FirebaseSyncStatus>({
    connected: false,
    lastSyncTime: null,
    pendingCount: 0,
    error: null
  });

  // Init Firebase Realtime Engine on app load
  useEffect(() => {
    initRealtimeFirebaseSync();
    const unsub = subscribeToSyncStatus((status) => {
      setFirebaseSync(status);
    });

    // Listen to real-time events triggered by Firestore sync
    const handleRemoteRoster = (e: any) => {
      try {
        if (e && e.detail && Array.isArray(e.detail) && e.detail.length > 0) {
          const detailStr = JSON.stringify(e.detail);
          setRoster(prev => (JSON.stringify(prev) === detailStr ? prev : e.detail));
        } else {
          const raw = localStorage.getItem(ROSTER_STORAGE_KEY) || localStorage.getItem('hspd_roster_database_v3');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setRoster(prev => (JSON.stringify(prev) === raw ? prev : parsed));
            }
          }
        }
      } catch (e) {}
    };

    const handleRemoteRecords = (e: any) => {
      try {
        if (e && e.detail && Array.isArray(e.detail)) {
          const detailStr = JSON.stringify(e.detail);
          setRecords(prev => (JSON.stringify(prev) === detailStr ? prev : e.detail));
        } else {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              setRecords(prev => (JSON.stringify(prev) === raw ? prev : parsed));
            }
          }
        }
      } catch (e) {}
    };

    const handleRemoteCases = () => {
      const fresh = getSavedDetectiveCases();
      setDetectiveCases(prev => (JSON.stringify(prev) === JSON.stringify(fresh) ? prev : fresh));
    };

    const handleRemoteBolo = () => {
      const fresh = getSavedBoloAlerts();
      setBoloList(prev => (JSON.stringify(prev) === JSON.stringify(fresh) ? prev : fresh));
    };

    const handleRemoteImpound = () => {
      const fresh = getSavedImpounds();
      setImpoundList(prev => (JSON.stringify(prev) === JSON.stringify(fresh) ? prev : fresh));
    };

    window.addEventListener('hspd-roster-updated', handleRemoteRoster);
    window.addEventListener('hspd-records-updated', handleRemoteRecords);
    window.addEventListener('hspd-detective-cases-updated', handleRemoteCases);
    window.addEventListener('hspd-bolo-updated', handleRemoteBolo);
    window.addEventListener('hspd-impound-updated', handleRemoteImpound);

    return () => {
      unsub();
      window.removeEventListener('hspd-roster-updated', handleRemoteRoster);
      window.removeEventListener('hspd-records-updated', handleRemoteRecords);
      window.removeEventListener('hspd-detective-cases-updated', handleRemoteCases);
      window.removeEventListener('hspd-bolo-updated', handleRemoteBolo);
      window.removeEventListener('hspd-impound-updated', handleRemoteImpound);
    };
  }, []);

  // Persist arrest records and sync to Firestore
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
      if (records && records.length > 0) {
        syncCollectionWithFirestore('ARREST_RECORDS', records).catch(console.error);
      }
    } catch (e) {
      console.error('Failed to persist arrest records', e);
    }
  }, [records]);

  // Live synchronizer for multi-officer duty changes
  useEffect(() => {
    const handleDutyEvent = () => {
      if (currentOfficer) {
        const fresh = getOfficerDutyState(currentOfficer.badge, roster, currentOfficer.name);
        setIsDuty(fresh.isDuty);
        setDutyStartTime(fresh.dutyStartTime);
      }
    };
    window.addEventListener('hspd-officer-duty-changed', handleDutyEvent);
    window.addEventListener('storage', handleDutyEvent);
    return () => {
      window.removeEventListener('hspd-officer-duty-changed', handleDutyEvent);
      window.removeEventListener('storage', handleDutyEvent);
    };
  }, [currentOfficer, roster]);

  // Save duty state strictly isolated per officer (other officers remain unaffected)
  const handleDutyStatusChanged = (newDutyState: boolean, newDutyStartTime: number, statusCode?: string) => {
    setIsDuty(newDutyState);
    setDutyStartTime(newDutyStartTime);
    if (currentOfficer) {
      saveOfficerDutyState(
        currentOfficer.badge, 
        newDutyState, 
        newDutyStartTime, 
        statusCode,
        currentOfficer.name
      );
      const updatedOfficer: OfficerProfile = {
        ...currentOfficer,
        isDuty: newDutyState,
        dutyStartTime: newDutyStartTime,
        dutyStatus: statusCode || (newDutyState ? '10-8' : '10-7')
      };
      setCurrentOfficer(updatedOfficer);
      try {
        localStorage.setItem(OFFICER_STORAGE_KEY, JSON.stringify(updatedOfficer));
      } catch (e) {
        console.error(e);
      }

      // Also update in-memory roster for THIS officer only
      setRoster(prev => prev.map(a => {
        if (a.badge.toLowerCase() === currentOfficer.badge.toLowerCase() || a.name.toLowerCase() === currentOfficer.name.toLowerCase()) {
          return {
            ...a,
            isDuty: newDutyState,
            dutyStartTime: newDutyStartTime,
            dutyStatus: statusCode || (newDutyState ? '10-8' : '10-7')
          };
        }
        return a;
      }));
    }
  };

  // Save officer to localStorage and load their individual duty state
  const handleLogin = (officer: OfficerProfile) => {
    const dutyState = getOfficerDutyState(officer.badge, roster, officer.name);
    setIsDuty(dutyState.isDuty);
    setDutyStartTime(dutyState.dutyStartTime);
    const enrichedOfficer: OfficerProfile = {
      ...officer,
      isDuty: dutyState.isDuty,
      dutyStartTime: dutyState.dutyStartTime,
      dutyStatus: dutyState.dutyStatus
    };
    setCurrentOfficer(enrichedOfficer);
    try {
      localStorage.setItem(OFFICER_STORAGE_KEY, JSON.stringify(enrichedOfficer));
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    setCurrentOfficer(null);
    setIsDuty(false);
    setDutyStartTime(0);
    try {
      localStorage.removeItem(OFFICER_STORAGE_KEY);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRegisterOfficer = (newAccount: OfficerAccount) => {
    setRoster(prev => {
      const exists = prev.some(a => a.badge.toLowerCase() === newAccount.badge.toLowerCase());
      if (exists) {
        return prev.map(a => a.badge.toLowerCase() === newAccount.badge.toLowerCase() ? newAccount : a);
      }
      return [newAccount, ...prev];
    });
  };

  const handleUpdateOfficerPin = (badgeOrName: string, newPin: string): boolean => {
    let updated = false;
    const cleanIdent = badgeOrName.trim().toLowerCase();
    const cleanBadge = cleanIdent.startsWith('#') ? cleanIdent : `#${cleanIdent}`;

    setRoster(prev => {
      return prev.map(a => {
        if (
          a.badge.toLowerCase() === cleanIdent ||
          a.badge.toLowerCase() === cleanBadge ||
          a.name.toLowerCase() === cleanIdent ||
          a.name.toLowerCase().includes(cleanIdent)
        ) {
          updated = true;
          return { ...a, pin: newPin };
        }
        return a;
      });
    });
    return updated;
  };

  const handleUpdateOfficer = (updated: OfficerAccount) => {
    setRoster(prev => prev.map(a => a.id === updated.id ? updated : a));
    
    // If updated officer is the currently logged in officer, sync state
    if (currentOfficer && currentOfficer.badge.toLowerCase() === updated.badge.toLowerCase()) {
      const synced: OfficerProfile = {
        ...currentOfficer,
        rank: updated.rank,
        division: updated.division
      };
      setCurrentOfficer(synced);
      try {
        localStorage.setItem(OFFICER_STORAGE_KEY, JSON.stringify(synced));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleDeleteOfficer = (officerId: string, reason?: string) => {
    setRoster(prev => prev.filter(a => a.id !== officerId));
  };

  const handleSaveRecord = (newRecord: Omit<ArrestRecord, 'id' | 'timestamp'>) => {
    const record: ArrestRecord = {
      ...newRecord,
      id: `arr-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: Date.now()
    };
    setRecords(prev => [record, ...prev]);
  };

  const handleDeleteRecord = (id: string) => {
    setRecords(prev => prev.filter(r => r.id !== id));
  };

  const handleClearAllRecords = () => {
    if (window.confirm('Hapus seluruh riwayat penindakan yang tersimpan?')) {
      setRecords([]);
    }
  };

  const handleImportRecords = (importedRecords: ArrestRecord[]) => {
    setRecords(prev => {
      const existingIds = new Set(prev.map(r => r.id));
      const newItems = importedRecords.filter(r => !existingIds.has(r.id));
      return [...newItems, ...prev];
    });
  };

  // If no officer logged in, show Login / Register Portal
  if (!currentOfficer) {
    return (
      <OfficerLogin 
        onLogin={handleLogin} 
        roster={roster}
        onRegisterOfficer={handleRegisterOfficer}
        onUpdateOfficerPin={handleUpdateOfficerPin}
      />
    );
  }

  const isHighRank = isOfficerHighRank(currentOfficer.rank);

  // Time on duty formatted
  const elapsedDutyMinutes = (isDuty && dutyStartTime > 0) ? Math.floor((Date.now() - dutyStartTime) / 60000) : 0;
  const elapsedDutyHours = Math.floor(elapsedDutyMinutes / 60);
  const remMinutes = elapsedDutyMinutes % 60;
  const dutyDurationStr = `${elapsedDutyHours > 0 ? `${elapsedDutyHours}j ` : ''}${remMinutes}m`;

  return (
    <div className="min-h-screen bg-[#0D0F14] text-gray-300 font-sans text-xs flex flex-col antialiased selection:bg-blue-600 selection:text-white">
      {/* Top High-Density Police Header Bar */}
      <header id="main-header" className="h-14 border-b border-gray-800 flex items-center px-4 justify-between bg-[#161B22] sticky top-0 z-40 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="relative group shrink-0">
            <img
              src={HSPD_LOGO_URL}
              alt="HSPD Official Crest"
              referrerPolicy="no-referrer"
              className="w-9 h-9 rounded-full object-contain drop-shadow-md border border-amber-500/40 bg-black/60 p-0.5"
            />
          </div>
          <div className="flex items-center gap-2">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-gray-100 text-sm tracking-tight">HSPD <span className="text-amber-400">INSPECTOR</span></span>
                <span className="text-[9px] text-amber-300 font-mono bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/60 font-bold">MDC-CAD</span>
              </div>
              <div className="text-[9px] text-gray-400 font-mono hidden sm:block">
                STATE OF HIGH STATE POLICE DEPARTMENT
              </div>
            </div>
          </div>

          <div className="hidden lg:flex h-6 w-[1px] bg-gray-800 mx-1"></div>

          <div className="hidden xl:flex gap-2 text-[10px] uppercase tracking-wider font-semibold text-gray-500 items-center font-mono">
            <span>FREQ: <strong className="text-green-400">1111</strong></span>
            <span className="text-gray-700">•</span>
            <span>ROSTER: <strong className="text-amber-400">{roster.length} Personel</strong></span>
          </div>
        </div>

        {/* Header Right Actions: Duty Toggle Button & Officer Badge */}
        <div className="flex items-center gap-2 text-xs">
          {/* REALTIME FIREBASE CLOUD DATABASE STATUS BADGE */}
          <div 
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-[#0A0D12] border border-cyan-500/40 rounded-lg text-[10px] font-mono text-cyan-300 shadow-sm"
            title="Database Firestore Cloud Terkoneksi Real-time: Setiap input data baru otomatis tersinkronisasi"
          >
            <Cloud className={`w-3.5 h-3.5 ${firebaseSync.connected ? 'text-cyan-400' : 'text-gray-500'}`} />
            <span className="font-bold">DATABASE CLOUD</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[9px] text-emerald-400 font-bold">AUTO-SYNC</span>
          </div>

          {/* SUPERVISOR & HIGH COMMAND: OTP CLEARANCE DISPOSITION BUTTON */}
          {isSupervisorOrAbove(currentOfficer.rank) && (
            <button
              id="btn-open-otp-disposition-header"
              onClick={() => {
                setOtpModalDefaultModule('VAULT');
                setIsOtpGeneratorModalOpen(true);
              }}
              className="px-2.5 py-1.5 bg-gradient-to-r from-amber-950/80 to-amber-900/80 hover:from-amber-900 hover:to-amber-800 text-amber-300 border border-amber-500/70 hover:border-amber-400 rounded-lg text-xs font-bold font-mono transition flex items-center gap-1.5 shadow-sm shadow-amber-950/50"
              title="Disposisi Kode Akses Sekali Pakai (OTP) untuk Petugas Lapangan membuka modul sensitif"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="hidden md:inline">🔑 DISPOSISI OTP</span>
              <span className="md:hidden">OTP</span>
            </button>
          )}

          {/* HIGH RANK ONLY: AUTHORITY PIN MANAGEMENT BUTTON */}
          {isHighRank && (
            <button
              id="btn-open-authority-pin-settings"
              onClick={() => setIsAuthorityPinModalOpen(true)}
              className="px-2.5 py-1.5 bg-amber-950/70 hover:bg-amber-900/90 text-amber-300 border border-amber-600/70 hover:border-amber-400 rounded-lg text-xs font-bold font-mono transition flex items-center gap-1.5 shadow-sm shadow-amber-950/40"
              title="Kelola PIN Otoritas Pembuka Berkas (Rotasi Otomatis 1 Jam / Manual)"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">👑 PIN OTORITAS: <strong className="text-amber-200">{authorityPinConfig.currentPin}</strong></span>
              <span className="md:hidden">PIN [{authorityPinConfig.currentPin}]</span>
              <span className="hidden lg:inline text-[9px] bg-black/40 px-1 py-0.5 rounded text-amber-300/80 border border-amber-800/40 font-normal">
                {pinTimeRemaining.text}
              </span>
            </button>
          )}

          {/* HIGH RANK ONLY: SETTING WEBHOOK BUTTON */}
          {isHighRank && (
            <button
              id="btn-open-webhook-settings"
              onClick={() => setIsWebhookModalOpen(true)}
              className="px-2.5 py-1.5 bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-700/60 hover:border-amber-500 rounded-lg text-xs font-bold font-mono transition flex items-center gap-1.5 shadow-sm shadow-amber-950/40"
              title="Pengaturan Integrasi Discord Webhook (Hanya High Command)"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">👑 WEBHOOK</span>
              <span className="sm:hidden">DC</span>
            </button>
          )}

          {/* HIGH RANK ONLY: PIN RESET AUDIT & WEBHOOK LOG BUTTON */}
          {isHighRank && (
            <button
              id="btn-open-pin-reset-audit-header"
              onClick={() => setIsPinResetAuditModalOpen(true)}
              className="px-2.5 py-1.5 bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-700/60 hover:border-amber-500 rounded-lg text-xs font-bold font-mono transition flex items-center gap-1.5 shadow-sm shadow-amber-950/40"
              title="Audit Log Permohonan Reset PIN & Otorisasi Webhook Discord (High Command)"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">👑 LOG PIN</span>
              <span className="sm:hidden">PIN</span>
              {pendingPinCount > 0 && (
                <span className="px-1.5 py-0.2 bg-amber-500 text-black text-[9px] rounded-full font-bold animate-pulse">
                  {pendingPinCount}
                </span>
              )}
            </button>
          )}

          {/* ON/OFF DUTY DISPATCH TOGGLE BUTTON */}
          <button
            id="duty-dispatch-toggle-btn"
            onClick={() => setIsDutyModalOpen(true)}
            className={`px-3 py-1.5 rounded-lg border font-mono text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
              isDuty
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 hover:bg-emerald-900/80 ring-1 ring-emerald-500/50'
                : 'bg-rose-950/80 border-rose-500 text-rose-300 hover:bg-rose-900/80 ring-1 ring-rose-500/50'
            }`}
            title="Klik untuk ubah status tugas & kirim report duty ke Discord Webhook"
          >
            <Power className="w-3.5 h-3.5" />
            <span>{isDuty ? '🟢 10-8 ON DUTY' : '🔴 10-7 OFF DUTY'}</span>
            {isDuty && (
              <span className="text-[9px] bg-black/50 px-1.5 py-0.2 rounded border border-emerald-700/60 hidden sm:inline text-emerald-200">
                {dutyDurationStr}
              </span>
            )}
          </button>

          {/* Active Officer Identity Badge & Change PIN Button */}
          <div className={`hidden sm:flex items-center gap-2 px-2 py-1.5 rounded-lg border font-mono transition ${
            isHighRank
              ? 'bg-amber-950/30 border-amber-800/60 text-amber-300'
              : 'bg-[#0D1117] border-gray-800 text-gray-200'
          }`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold shrink-0 ${
              isHighRank ? 'bg-amber-900/60 border border-amber-700/60 text-amber-300' : 'bg-blue-900/60 border border-blue-700/60 text-blue-300'
            }`}>
              <User className="w-3.5 h-3.5" />
            </div>
            <div className="text-left leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-gray-100 text-[11px] truncate max-w-[120px] lg:max-w-[160px]">
                  {currentOfficer.name}
                </span>
                <span className="text-[9px] bg-black/50 px-1.5 py-0.2 rounded border border-gray-700 text-gray-300">
                  {currentOfficer.badge}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[9px]">
                {isHighRank ? (
                  <span className="text-amber-400 font-bold flex items-center gap-0.5">
                    ★ {currentOfficer.rank}
                  </span>
                ) : (
                  <span className="text-gray-400">
                    {currentOfficer.rank}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Logout / Switch Button */}
          <button
            onClick={handleLogout}
            className="px-2.5 py-1.5 bg-gray-800 hover:bg-rose-900/60 text-gray-300 hover:text-rose-200 border border-gray-700 hover:border-rose-700 rounded-lg text-[10px] font-bold font-mono transition flex items-center gap-1"
            title="Keluar / Ganti Akun Petugas"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">GANTI AKUN</span>
          </button>
        </div>
      </header>

      {/* High Density Sub-Navigation Strip */}
      <div className="bg-[#11141A] border-b border-gray-800 px-4 py-1.5 flex items-center justify-between overflow-x-auto no-scrollbar">
        <nav className="flex items-center gap-1 text-[11px] font-medium">
          {[
            { id: 'calc', label: 'Kalkulator Pasal', icon: Calculator, code: 'CALC' },
            { id: 'dispatch', label: '📻 CAD 911 & Panic', icon: Radio, code: 'CAD' },
            { id: 'dmv', label: '👤 Sipil & DMV', icon: UserCheck, code: 'DMV' },
            { id: 'divisions', label: '🎖️ Divisi Khusus', icon: Award, code: 'DIV' },
            { id: 'forensics', label: '🔬 Lab Forensik', icon: Microscope, code: 'LAB' },
            { id: 'documents', label: '📄 Surat & Dokumen Resmi', icon: StampIcon, code: 'DOC' },
            { id: 'detective', label: `🔍 Kasus Detektif (${detectiveCases.length})`, icon: Search, code: 'DB' },
            { id: 'traffic', label: `🚗 BOLO & Sitaan (${boloList.length})`, icon: Car, code: 'BOLO' },
            { id: 'vault', label: '🏦 Brankas & Audit (1x/Mgg)', icon: Landmark, code: 'VAULT' },
            { id: 'destruction', label: '💥 Peleburan Sitaan', icon: Flame, code: 'LEBUR' },
            { id: 'megaphone', label: 'Megaphone Studio', icon: Megaphone, code: '/M' },
            { id: 'rp', label: 'Hak Miranda & RP', icon: BookOpen, code: 'RP' },
            { id: 'sop', label: 'SOP & Ten-Codes', icon: Radio, code: 'SOP' },
            { 
              id: 'history', 
              label: isHighRank ? `👑 Riwayat Kasus (${records.length})` : `🔒 Riwayat Kasus (${records.length})`, 
              icon: FileText, 
              code: 'LOG',
              isHighRankOnly: true
            },
            ...(isHighRank ? [
              {
                id: 'roster',
                label: `👑 Manajemen Roster (${roster.length})`,
                icon: Users,
                code: 'ROSTER',
                isHighRankOnly: true
              }
            ] : []),
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeNav === tab.id;
            return (
              <button
                key={tab.id}
                id={`nav-btn-${tab.id}`}
                onClick={() => setActiveNav(tab.id as any)}
                className={`px-3 py-1.5 rounded flex items-center gap-1.5 transition whitespace-nowrap text-xs ${
                  isActive
                    ? 'bg-blue-600 text-white font-bold shadow-sm shadow-blue-600/30'
                    : tab.isHighRankOnly && !isHighRank
                      ? 'text-amber-400/80 hover:text-amber-200 hover:bg-amber-950/20'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="hidden md:flex items-center gap-2 text-[10px] font-mono text-gray-500">
          <span>STATUS: <strong className={isDuty ? 'text-emerald-400' : 'text-rose-400'}>{isDuty ? '10-8 ON DUTY' : '10-7 OFF DUTY'}</strong></span>
          <span className="text-gray-700">|</span>
          <span>CLEARANCE: <strong className={isHighRank ? 'text-amber-400' : 'text-blue-400'}>{isHighRank ? 'HIGH COMMAND (AKSES PENUH)' : 'PATROL'}</strong></span>
        </div>
      </div>

      {/* Main Content Body */}
      <main className="max-w-7xl mx-auto px-3 sm:px-5 py-4 flex-1 w-full">
        {/* Dynamic Division & Rank Badge Hero Banner */}
        <DivisionBadgeHero
          currentOfficer={currentOfficer}
          totalCases={detectiveCases.length}
          totalRecords={records.length}
          totalRoster={roster.length}
          activeBoloCount={boloList.filter(b => b.active).length}
        />

        {activeNav === 'calc' && (
          <PasalCalculator 
            onSaveRecord={handleSaveRecord} 
            currentOfficer={currentOfficer}
          />
        )}
        {activeNav === 'dispatch' && (
          <ModuleClearanceGuard
            moduleKey="DISPATCH"
            currentOfficer={currentOfficer}
            roster={roster}
          >
            <CadDispatchBoard
              currentOfficer={currentOfficer}
            />
          </ModuleClearanceGuard>
        )}
        {activeNav === 'dmv' && (
          <ModuleClearanceGuard
            moduleKey="DMV_CITIZEN"
            currentOfficer={currentOfficer}
            roster={roster}
          >
            <CitizenDmvDatabase
              currentOfficer={currentOfficer}
            />
          </ModuleClearanceGuard>
        )}
        {activeNav === 'divisions' && (
          <ModuleClearanceGuard
            moduleKey="SPECIAL_DIVISIONS"
            currentOfficer={currentOfficer}
            roster={roster}
          >
            <SpecializedDivisionsHub
              currentOfficer={currentOfficer}
              roster={roster}
            />
          </ModuleClearanceGuard>
        )}
        {activeNav === 'forensics' && (
          <ModuleClearanceGuard
            moduleKey="FORENSICS"
            currentOfficer={currentOfficer}
            roster={roster}
          >
            <ForensicsLabBoard
              currentOfficer={currentOfficer}
            />
          </ModuleClearanceGuard>
        )}
        {activeNav === 'documents' && (
          <OfficialDocumentStudio
            currentOfficer={currentOfficer}
            webhookConfig={getDiscordWebhookConfig()}
          />
        )}
        {activeNav === 'detective' && (
          <DetectiveCaseBoard
            cases={detectiveCases}
            currentOfficer={currentOfficer}
            onSaveCase={handleSaveDetectiveCase}
            onCreateCase={handleCreateDetectiveCase}
            onDeleteCase={handleDeleteDetectiveCase}
          />
        )}
        {activeNav === 'traffic' && (
          <BoloAndTrafficHub
            boloList={boloList}
            impoundList={impoundList}
            currentOfficer={currentOfficer}
            onSaveBolo={handleSaveBoloAlerts}
            onSaveImpound={handleSaveImpoundRecords}
          />
        )}
        {activeNav === 'vault' && (
          <ModuleClearanceGuard
            moduleKey="VAULT"
            currentOfficer={currentOfficer}
            roster={roster}
          >
            <VaultAuditBoard
              currentOfficer={currentOfficer}
            />
          </ModuleClearanceGuard>
        )}
        {activeNav === 'destruction' && (
          <ModuleClearanceGuard
            moduleKey="DESTRUCTION"
            currentOfficer={currentOfficer}
            roster={roster}
          >
            <DestructionRegistryBoard
              currentOfficer={currentOfficer}
            />
          </ModuleClearanceGuard>
        )}
        {activeNav === 'megaphone' && <MegaphoneStudio />}
        {activeNav === 'rp' && <RoleplayActions />}
        {activeNav === 'sop' && <SopLibrary />}
        {activeNav === 'history' && (
          <ArrestHistory
            records={records}
            onDeleteRecord={handleDeleteRecord}
            onClearAll={handleClearAllRecords}
            onImportRecords={handleImportRecords}
            currentOfficer={currentOfficer}
            onSwitchOfficer={handleLogout}
          />
        )}
        {activeNav === 'roster' && isHighRank && (
          <RosterManagement
            roster={roster}
            currentOfficerRank={currentOfficer.rank}
            currentOfficerName={currentOfficer.name}
            currentOfficerBadge={currentOfficer.badge}
            onUpdateOfficer={handleUpdateOfficer}
            onRegisterOfficer={handleRegisterOfficer}
            onDeleteOfficer={handleDeleteOfficer}
            onOpenPinResetAudit={() => setIsPinResetAuditModalOpen(true)}
            pendingPinResetCount={pendingPinCount}
          />
        )}
      </main>

      {/* Duty Dispatch Modal */}
      <DutyControlModal
        isOpen={isDutyModalOpen}
        onClose={() => setIsDutyModalOpen(false)}
        currentOfficer={currentOfficer}
        isDuty={isDuty}
        dutyStartTime={dutyStartTime}
        onDutyStatusChanged={handleDutyStatusChanged}
      />

      {/* Discord Webhook Settings Modal (High Command Only) */}
      <WebhookSettingsModal
        isOpen={isWebhookModalOpen}
        onClose={() => setIsWebhookModalOpen(false)}
        currentOfficer={currentOfficer}
      />

      {/* Authority PIN Modal (High Command & Hourly Auto-Rotation) */}
      <AuthorityPinModal
        isOpen={isAuthorityPinModalOpen}
        onClose={() => setIsAuthorityPinModalOpen(false)}
        currentOfficer={currentOfficer}
        onPinUpdated={(newConf) => {
          setAuthorityPinConfig(newConf);
          setPinTimeRemaining(formatRemainingTime(newConf.expiresAt));
        }}
      />

      {/* PIN Reset Request Audit & Authorization Modal (High Command Only) */}
      <PinResetAuditModal
        isOpen={isPinResetAuditModalOpen}
        onClose={() => {
          setIsPinResetAuditModalOpen(false);
          setPendingPinCount(getPendingPinResetCount());
        }}
        currentOfficer={currentOfficer}
        roster={roster}
        onUpdateOfficerPin={handleUpdateOfficerPin}
      />

      {/* OTP Clearance & Disposition Generator Modal (Supervisor & High Command) */}
      <OtpGeneratorModal
        isOpen={isOtpGeneratorModalOpen}
        onClose={() => setIsOtpGeneratorModalOpen(false)}
        currentOfficer={currentOfficer}
        roster={roster}
        defaultModule={otpModalDefaultModule}
      />

      {/* High Density Footer Status Line */}
      <footer className="border-t border-gray-800 bg-[#161B22] py-2 px-4 text-[11px] text-gray-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-400">HIGHSTATE ROLEPLAY POLICE DEPT</span>
            <span className="text-gray-700">•</span>
            <span className="font-mono text-[10px]">MDC-CAD-AUTHORIZED</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[10px]">
            <span>STATUS: <strong className={isDuty ? 'text-emerald-400' : 'text-rose-400'}>{isDuty ? '🟢 10-8 ON DUTY' : '🔴 10-7 OFF DUTY'}</strong></span>
            <span className="text-gray-700">|</span>
            <span>PETUGAS: <strong className="text-gray-300">{currentOfficer.name} ({currentOfficer.badge})</strong></span>
            <span className="text-gray-700">|</span>
            <span>RANK: <strong className={isHighRank ? 'text-amber-400' : 'text-gray-300'}>{currentOfficer.rank}</strong></span>
          </div>
        </div>
      </footer>
    </div>
  );
}
