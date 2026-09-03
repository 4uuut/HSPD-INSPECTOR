import React, { useState, useEffect, useRef } from 'react';
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
import { PinResetRealtimeNotifier } from './components/PinResetRealtimeNotifier';
import { DetectiveCaseBoard } from './components/DetectiveCaseBoard';
import { BoloAndTrafficHub } from './components/BoloAndTrafficHub';
import { VaultAuditBoard } from './components/VaultAuditBoard';
import { DestructionRegistryBoard } from './components/DestructionRegistryBoard';
import { OfficialDocumentStudio } from './components/OfficialDocumentStudio';
import { DivisionBadgeHero } from './components/DivisionBadgeHero';
import { ModuleClearanceGuard } from './components/ModuleClearanceGuard';
import { OtpGeneratorModal } from './components/OtpGeneratorModal';
import { SpecializedDivisionsHub } from './components/SpecializedDivisionsHub';
import { CitizenDmvDatabase } from './components/CitizenDmvDatabase';
import { ForensicsLabBoard } from './components/ForensicsLabBoard';
import { CustomBrandingModal } from './components/CustomBrandingModal';
import { RecruitmentPortalSettingsModal } from './components/RecruitmentPortalSettingsModal';
import { AndroidMdtView } from './components/AndroidMdtView';
import { ExportAttendanceModal } from './components/ExportAttendanceModal';
import { SettingsView } from './components/SettingsView';
import { getAuthorityPinConfig, formatRemainingTime, AuthorityPinConfig } from './utils/authorityPin';
import { getPendingPinResetCount, touchSuperiorHeartbeat, isOfficerMatch, saveRosterToStorage, updateOfficerPinInRoster } from './utils/pinResetStorage';
import { getSavedDetectiveCases, saveDetectiveCases } from './utils/detectiveCaseStorage';
import { getSavedBoloAlerts, saveBoloAlerts, getSavedImpounds, saveImpounds } from './utils/boloImpoundStorage';
import { getOfficerDutyState, saveOfficerDutyState, formatDutyDuration } from './utils/officerDutyStorage';
import { getDiscordWebhookConfig, getSavedDiscordBotConfig, startDiscordBotGateway } from './utils/discordWebhook';
import { getCustomBranding, subscribeToBranding, DepartmentBrandingConfig } from './utils/brandingStorage';
import { checkDirectRankClearance, hasActiveUnlockedSession } from './utils/otpClearanceStorage';
import { 
  ArrestRecord, OfficerProfile, OfficerAccount, isOfficerHighRank, isSupervisorOrAbove, isAtasanRank,
  DetectiveCase, BoloAlert, ImpoundRecord, getDivisionArchetype, ModuleAccessKey 
} from './types';
import { 
  Shield, Calculator, Megaphone, BookOpen, FileText, 
  Radio, Award, User, LogOut, Lock, Sparkles, BadgeCheck,
  Users, ShieldAlert, KeyRound, Power, Clock, CheckCircle2, Sliders,
  Search, Car, Crosshair, Landmark, Flame, Stamp as StampIcon,
  UserCheck, Microscope, Cloud, Database, Palette, Smartphone, Monitor, Settings
} from 'lucide-react';
import { HSPD_LOGO_URL } from './assets/logo';
import { 
  initRealtimeFirebaseSync, 
  subscribeToSyncStatus, 
  pushToFirestore,
  pushAllToFirestore, 
  syncCollectionWithFirestore,
  deleteFromFirestore,
  purgeOfficerFromCloud,
  purgeAllNonAtasanFromCloud,
  FirebaseSyncStatus 
} from './services/firebaseRealtimeSync';

import { HSPD_OFFICIAL_ROSTER, mergeWithOfficialRoster } from './data/hspdOfficialRoster';
import { recordOfficerDischarge, isOfficerDischarged } from './utils/dischargeStorage';

const STORAGE_KEY = 'hspd_arrest_records_v1';
const OFFICER_STORAGE_KEY = 'hspd_active_officer_v1';
const ROSTER_STORAGE_KEY = 'hspd_roster_database_v4';
const DUTY_STATUS_STORAGE_KEY = 'hspd_is_duty_v1';
const DUTY_START_TIME_KEY = 'hspd_duty_start_time_v1';

export default function App() {
  // Active Roster Database with official Command / Atasan personnel
  const [roster, setRoster] = useState<OfficerAccount[]>(() => {
    try {
      let saved = localStorage.getItem(ROSTER_STORAGE_KEY) || 
                  localStorage.getItem('hspd_roster_database_v3') || 
                  localStorage.getItem('hspd_roster_database_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const merged = mergeWithOfficialRoster(parsed);
          localStorage.setItem(ROSTER_STORAGE_KEY, JSON.stringify(merged));
          return merged;
        }
      }
    } catch (e) {
      console.error(e);
    }
    const initial = mergeWithOfficialRoster(HSPD_OFFICIAL_ROSTER);
    try {
      localStorage.setItem(ROSTER_STORAGE_KEY, JSON.stringify(initial));
    } catch {}
    return initial;
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

  // Auto-connect Discord bot gateway on startup if token is configured (keeps bot online & green 24/7)
  useEffect(() => {
    try {
      const botCfg = getSavedDiscordBotConfig();
      if (botCfg.botToken && botCfg.botToken.trim()) {
        startDiscordBotGateway(botCfg.botToken.trim()).catch(() => {});
      }
    } catch {}
  }, []);

  const [isDutyModalOpen, setIsDutyModalOpen] = useState(false);
  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState(false);
  const [webhookModalInitialTab, setWebhookModalInitialTab] = useState<'case' | 'duty' | 'promotion' | 'warning' | 'discharge' | 'pinReset' | 'roster' | 'detective' | 'bolo' | 'impound' | 'vault' | 'destruction' | 'document' | 'botDm'>('case');
  const [isAuthorityPinModalOpen, setIsAuthorityPinModalOpen] = useState(false);
  const [isPinResetAuditModalOpen, setIsPinResetAuditModalOpen] = useState(false);
  const [isOtpGeneratorModalOpen, setIsOtpGeneratorModalOpen] = useState(false);
  const [otpModalDefaultModule, setOtpModalDefaultModule] = useState<ModuleAccessKey>('VAULT');
  const [pendingPinCount, setPendingPinCount] = useState<number>(() => getPendingPinResetCount());
  const [authorityPinConfig, setAuthorityPinConfig] = useState<AuthorityPinConfig>(() => getAuthorityPinConfig());
  const [pinTimeRemaining, setPinTimeRemaining] = useState(() => formatRemainingTime(authorityPinConfig.expiresAt));

  // Dynamic Website Logo & Department Identity Branding
  const [branding, setBranding] = useState<DepartmentBrandingConfig>(() => getCustomBranding());
  const [isBrandingModalOpen, setIsBrandingModalOpen] = useState(false);
  const [isRecruitmentPortalModalOpen, setIsRecruitmentPortalModalOpen] = useState(false);
  const [isExportAttendanceModalOpen, setIsExportAttendanceModalOpen] = useState(false);

  // Dedicated Android / Mobile View Mode State & Auto-detection
  const [isAndroidMode, setIsAndroidMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('hspd_preferred_view_mode_v1');
      if (saved === 'android') return true;
      if (saved === 'desktop') return false;
      if (typeof window !== 'undefined') {
        const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isNarrow = window.innerWidth <= 768;
        return isMobileUA || isNarrow;
      }
    } catch {}
    return false;
  });

  const handleToggleViewMode = () => {
    setIsAndroidMode(prev => {
      const next = !prev;
      try {
        localStorage.setItem('hspd_preferred_view_mode_v1', next ? 'android' : 'desktop');
      } catch {}
      return next;
    });
  };

  useEffect(() => {
    return subscribeToBranding(cfg => setBranding(cfg));
  }, []);

  // Keep superior heartbeat active so other sessions / requests know superior is online
  useEffect(() => {
    if (currentOfficer && isSupervisorOrAbove(currentOfficer.rank)) {
      touchSuperiorHeartbeat(currentOfficer);
      const interval = setInterval(() => {
        touchSuperiorHeartbeat(currentOfficer);
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [currentOfficer]);

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

  const [activeNav, setActiveNav] = useState<'calc' | 'dmv' | 'divisions' | 'forensics' | 'documents' | 'detective' | 'traffic' | 'vault' | 'destruction' | 'megaphone' | 'rp' | 'sop' | 'history' | 'roster' | 'settings'>('calc');
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
    deleteFromFirestore('DETECTIVE_CASES', caseId).catch(() => {});
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

  // Track initial mount to avoid spamming Firestore writes on page load
  const isRosterFirstMount = useRef(true);
  const isRecordsFirstMount = useRef(true);

  // Persist roster and sync to Firestore
  useEffect(() => {
    try {
      localStorage.setItem(ROSTER_STORAGE_KEY, JSON.stringify(roster));
      localStorage.setItem('hspd_roster_database_v3', JSON.stringify(roster));
      localStorage.setItem('hspd_roster_database_v2', JSON.stringify(roster));
      
      if (roster && roster.length > 0) {
        const timeout = setTimeout(() => {
          syncCollectionWithFirestore('ROSTER', roster).catch(() => {});
        }, isRosterFirstMount.current ? 1200 : 500);
        isRosterFirstMount.current = false;
        return () => clearTimeout(timeout);
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
          const merged = mergeWithOfficialRoster(e.detail);
          const detailStr = JSON.stringify(merged);
          setRoster(prev => (JSON.stringify(prev) === detailStr ? prev : merged));
        } else {
          const raw = localStorage.getItem(ROSTER_STORAGE_KEY) || localStorage.getItem('hspd_roster_database_v3');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const merged = mergeWithOfficialRoster(parsed);
              setRoster(prev => (JSON.stringify(prev) === JSON.stringify(merged) ? prev : merged));
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
      if (isRecordsFirstMount.current) {
        isRecordsFirstMount.current = false;
        return;
      }
      const timeout = setTimeout(() => {
        syncCollectionWithFirestore('ARREST_RECORDS', records || []).catch(() => {});
      }, 500);
      return () => clearTimeout(timeout);
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
    const trimmedPin = newPin.trim();
    if (!trimmedPin) return false;

    setRoster(prev => {
      const nextRoster = prev.map(a => {
        if (isOfficerMatch(a, badgeOrName)) {
          updated = true;
          return { ...a, pin: trimmedPin, _updatedAt: Date.now() };
        }
        return a;
      });

      if (updated) {
        try {
          const serialized = JSON.stringify(nextRoster);
          localStorage.setItem(ROSTER_STORAGE_KEY, serialized);
          localStorage.setItem('hspd_roster_database_v3', serialized);
          localStorage.setItem('hspd_roster_database_v2', serialized);
          localStorage.setItem('hspd_roster_accounts_v1', serialized);
        } catch (e) {}
      }

      return nextRoster;
    });

    return updated;
  };

  const handleUpdateOfficer = (updated: OfficerAccount) => {
    setRoster(prev => {
      let isFound = false;
      const nextRoster = prev.map(a => {
        if (
          (updated.id && a.id === updated.id) ||
          isOfficerMatch(a, updated.badge) ||
          isOfficerMatch(a, updated.name)
        ) {
          isFound = true;
          return {
            ...a,
            ...updated,
            pin: updated.pin ? updated.pin.trim() : a.pin,
            _updatedAt: Date.now()
          };
        }
        return a;
      });

      const finalRoster = isFound ? nextRoster : [updated, ...nextRoster];
      saveRosterToStorage(finalRoster);
      return finalRoster;
    });

    if (updated.pin && updated.pin.trim()) {
      updateOfficerPinInRoster(updated.badge, updated.pin.trim(), updated.name);
    }
    
    // If updated officer is the currently logged in officer, sync state
    if (currentOfficer && (
      currentOfficer.badge.toLowerCase() === updated.badge.toLowerCase() ||
      isOfficerMatch(updated, currentOfficer.badge) ||
      isOfficerMatch(updated, currentOfficer.name)
    )) {
      const synced: OfficerProfile = {
        ...currentOfficer,
        name: updated.name || currentOfficer.name,
        badge: updated.badge || currentOfficer.badge,
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

  const handleDeleteOfficer = (officerId: string, reason?: string, deletingOfficerObj?: OfficerAccount) => {
    // 1. Find the officer object to get full details (id, badge, name, rank, division)
    const target = deletingOfficerObj || roster.find(a => 
      (officerId && a.id === officerId) || 
      isOfficerMatch(a, officerId)
    );

    const badge = target?.badge || officerId;
    const name = target?.name || officerId;
    const rank = target?.rank;
    const division = target?.division;

    // 2. Persist to Discharged Officers registry so mergeWithOfficialRoster NEVER resurrects them
    recordOfficerDischarge({
      id: target?.id || officerId || `discharged_${Date.now()}`,
      badge,
      name,
      rank,
      division,
      reason: reason || 'Diberhentikan dari dinas kepolisian (dipecat)',
      dischargedAt: Date.now(),
      dischargedBy: currentOfficer?.name || 'High Command',
      dischargedByBadge: currentOfficer?.badge || '#001',
      dischargedByRank: currentOfficer?.rank || 'HIGH COMMAND'
    });

    // 3. Remove officer from state
    let nextRoster: OfficerAccount[] = [];
    setRoster(prev => {
      const next = prev.filter(a => {
        if (officerId && a.id === officerId) return false;
        if (target?.id && a.id === target.id) return false;
        if (badge && isOfficerMatch(a, badge)) return false;
        if (name && isOfficerMatch(a, name)) return false;
        return true;
      });
      nextRoster = next;
      try {
        const serialized = JSON.stringify(next);
        localStorage.setItem(ROSTER_STORAGE_KEY, serialized);
        localStorage.setItem('hspd_roster_database_v5', serialized);
        localStorage.setItem('hspd_roster_database_v4', serialized);
        localStorage.setItem('hspd_roster_database_v3', serialized);
        localStorage.setItem('hspd_roster_database_v2', serialized);
      } catch {}
      return next;
    });

    // 4. Thoroughly purge officer from Cloud Firestore across all document IDs, aliases, and duty registries
    purgeOfficerFromCloud({
      id: target?.id || officerId,
      badge,
      name
    }).catch(() => {});

    // Force push the remaining roster to Cloud Firestore immediately to overwrite cloud state
    setTimeout(() => {
      syncCollectionWithFirestore('ROSTER', nextRoster, true).catch(() => {});
    }, 120);

    // 5. If this was the current logged in officer, log them out immediately
    if (currentOfficer && (
      (officerId && currentOfficer.id === officerId) ||
      (target?.id && currentOfficer.id === target.id) ||
      (badge && isOfficerMatch(currentOfficer as any, badge)) ||
      (name && isOfficerMatch(currentOfficer as any, name))
    )) {
      handleLogout();
    }
  };

  // Purge all non-atasan officers from CAD database and Cloud Firestore
  const handlePurgeNonAtasanOfficers = async () => {
    const atasanOnly = roster.filter(o => isAtasanRank(o.rank));
    const merged = mergeWithOfficialRoster(atasanOnly.length > 0 ? atasanOnly : HSPD_OFFICIAL_ROSTER);
    setRoster(merged);
    try {
      const serialized = JSON.stringify(merged);
      localStorage.setItem(ROSTER_STORAGE_KEY, serialized);
      localStorage.setItem('hspd_roster_database_v5', serialized);
      localStorage.setItem('hspd_roster_database_v4', serialized);
      localStorage.setItem('hspd_roster_database_v3', serialized);
      localStorage.setItem('hspd_roster_database_v2', serialized);
      localStorage.setItem('hspd_atasan_only_purged_v2', 'true');
    } catch {}

    await purgeAllNonAtasanFromCloud();
    await syncCollectionWithFirestore('ROSTER', merged, true);
  };

  const handleSaveRecord = (newRecord: Omit<ArrestRecord, 'id' | 'timestamp'>) => {
    const record: ArrestRecord = {
      ...newRecord,
      id: `arr-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: Date.now()
    };
    setRecords(prev => [record, ...prev]);
    pushToFirestore('ARREST_RECORDS', record).catch(() => {});
  };

  const handleDeleteRecord = (id: string) => {
    setRecords(prev => prev.filter(r => r.id !== id));
    deleteFromFirestore('ARREST_RECORDS', id).catch(() => {});
  };

  const handleClearAllRecords = () => {
    if (window.confirm('Hapus seluruh riwayat penindakan yang tersimpan?')) {
      setRecords([]);
      syncCollectionWithFirestore('ARREST_RECORDS', [], true).catch(() => {});
    }
  };

  const handleImportRecords = (importedRecords: ArrestRecord[]) => {
    setRecords(prev => {
      const existingIds = new Set(prev.map(r => r.id));
      const newItems = importedRecords.filter(r => !existingIds.has(r.id));
      return [...newItems, ...prev];
    });
  };

  // Guard: if current logged-in officer is not high rank, ensure activeNav is not 'roster' or 'settings'
  useEffect(() => {
    if (currentOfficer && !isOfficerHighRank(currentOfficer.rank)) {
      if (activeNav === 'settings' || activeNav === 'roster') {
        setActiveNav('calc');
      }
    }
  }, [currentOfficer, activeNav]);

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
  const isSupervisor = isSupervisorOrAbove(currentOfficer.rank);
  const hasFullAccess = isHighRank || isSupervisor;

  // Time on duty formatted
  const elapsedDutyMinutes = (isDuty && dutyStartTime > 0) ? Math.floor((Date.now() - dutyStartTime) / 60000) : 0;
  const elapsedDutyHours = Math.floor(elapsedDutyMinutes / 60);
  const remMinutes = elapsedDutyMinutes % 60;
  const dutyDurationStr = `${elapsedDutyHours > 0 ? `${elapsedDutyHours}j ` : ''}${remMinutes}m`;

  return (
    <div className="min-h-screen bg-[#0D0F14] text-gray-300 font-sans text-xs flex flex-col antialiased selection:bg-blue-600 selection:text-white relative">
      {/* Dynamic Background Wallpaper with Custom Opacity and Blur */}
      {branding.backgroundWallpaper && (
        <div
          id="app-dynamic-wallpaper"
          className="fixed inset-0 pointer-events-none z-0 transition-all duration-300"
          style={{
            backgroundImage: `url(${branding.backgroundWallpaper})`,
            backgroundSize: branding.backgroundStyle === 'tile' ? 'auto' : (branding.backgroundStyle || 'cover'),
            backgroundRepeat: branding.backgroundStyle === 'tile' ? 'repeat' : 'no-repeat',
            backgroundPosition: 'center',
            opacity: branding.backgroundOpacity ?? 0.25,
            filter: branding.backgroundBlur ? `blur(${branding.backgroundBlur}px)` : 'none'
          }}
        />
      )}

      {/* Top Header & Navigation: Android MDT Mode vs Desktop Mode */}
      {isAndroidMode ? (
        <AndroidMdtView
          currentOfficer={currentOfficer}
          roster={roster}
          isDuty={isDuty}
          dutyStartTime={dutyStartTime}
          activeNav={activeNav}
          setActiveNav={setActiveNav}
          branding={branding}
          firebaseSync={firebaseSync}
          pendingPinCount={pendingPinCount}
          authorityPin={authorityPinConfig.currentPin}
          onOpenDutyModal={() => setIsDutyModalOpen(true)}
          onOpenBrandingModal={() => setIsBrandingModalOpen(true)}
          onOpenOtpModal={() => {
            setOtpModalDefaultModule('VAULT');
            setIsOtpGeneratorModalOpen(true);
          }}
          onOpenAuthorityPinModal={() => setIsAuthorityPinModalOpen(true)}
          onOpenWebhookModal={() => setIsWebhookModalOpen(true)}
          onOpenPinAuditModal={() => setIsPinResetAuditModalOpen(true)}
          onOpenExportAttendanceModal={() => setIsExportAttendanceModalOpen(true)}
          onOpenRecruitmentPortalModal={() => setIsRecruitmentPortalModalOpen(true)}
          onLogout={handleLogout}
          viewMode={isAndroidMode ? 'android' : 'desktop'}
          onToggleViewMode={handleToggleViewMode}
          totalRecordsCount={records.length}
          totalDetectiveCasesCount={detectiveCases.length}
          totalBoloCount={boloList.length}
        />
      ) : (
        <>
          {/* Top High-Density Police Header Bar */}
          <header id="main-header" className="h-14 border-b border-gray-800 flex items-center px-4 justify-between bg-[#161B22]/95 backdrop-blur-md sticky top-0 z-40 shadow-xl">
            <div className="flex items-center gap-3">
              <div 
                className={`relative shrink-0 ${hasFullAccess ? 'cursor-pointer group' : ''}`}
                onClick={() => {
                  if (hasFullAccess) {
                    setIsBrandingModalOpen(true);
                  }
                }} 
                title={hasFullAccess ? "Pengaturan Logo & Background (Full Access)" : `${branding.departmentName} Official Crest`}
              >
                <img
                  src={branding.logoUrl || HSPD_LOGO_URL}
                  alt={`${branding.departmentName} Official Crest`}
                  referrerPolicy="no-referrer"
                  className={`w-9 h-9 rounded-full object-contain drop-shadow-md border border-amber-500/40 bg-black/60 p-0.5 ${hasFullAccess ? 'group-hover:scale-105 transition' : ''}`}
                  onError={e => {
                    (e.target as HTMLImageElement).src = HSPD_LOGO_URL;
                  }}
                />
                {hasFullAccess && (
                  <div className="absolute -bottom-1 -right-1 z-20 bg-amber-500 text-black p-0.5 rounded-full border border-black text-[9px] group-hover:block transition">
                    <Palette className="w-2 h-2" />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-gray-100 text-sm tracking-tight">{branding.departmentCode} <span className="text-amber-400">{branding.subTitle}</span></span>
                    <span className="text-[9px] text-amber-300 font-mono bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/60 font-bold">{branding.cadBadgeText}</span>
                  </div>
                  <div className="text-[9px] text-gray-400 font-mono hidden sm:block">
                    {branding.agencyJurisdiction}
                  </div>
                </div>
              </div>

              <div className="hidden lg:flex h-6 w-[1px] bg-gray-800 mx-1"></div>

              <div className="hidden xl:flex gap-2 text-[10px] uppercase tracking-wider font-semibold text-gray-500 items-center font-mono">
                <span>FREQ: <strong className="text-green-400">{branding.radioFreq}</strong></span>
                <span className="text-gray-700">•</span>
                <span>ROSTER: <strong className="text-amber-400">{roster.length} Personel</strong></span>
              </div>
            </div>

            {/* Header Right Actions: Duty Toggle Button & Officer Badge */}
            <div className="flex items-center gap-2 text-xs">
              {/* SWITCH TO ANDROID VIEW MODE BUTTON */}
              <button
                id="btn-switch-to-android-mode"
                type="button"
                onClick={handleToggleViewMode}
                className="px-2.5 py-1.5 bg-gradient-to-r from-emerald-950/80 to-teal-950/80 hover:from-emerald-900 hover:to-teal-900 text-emerald-300 border border-emerald-500/70 hover:border-emerald-400 rounded-lg text-xs font-bold font-mono transition flex items-center gap-1.5 shadow-sm shadow-emerald-950/40"
                title="Beralih ke Tampilan Khusus Android / Mobile Tactical MDT"
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden md:inline">📱 MODE ANDROID</span>
                <span className="md:hidden">ANDROID</span>
              </button>

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

              {/* ON/OFF DUTY DISPATCH TOGGLE BUTTON */}
              <button
                id="duty-dispatch-toggle-btn"
                onClick={() => setIsDutyModalOpen(true)}
                className={`px-3 py-1.5 rounded-lg border font-mono text-xs font-bold transition flex items-center gap-1.5 shadow-sm shrink-0 ${
                  isDuty
                    ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 hover:bg-emerald-900/80 ring-1 ring-emerald-500/50'
                    : 'bg-rose-950/80 border-rose-500 text-rose-300 hover:bg-rose-900/80 ring-1 ring-rose-500/50'
                }`}
                title="Klik untuk ubah status tugas & kirim report duty ke Discord Webhook"
              >
                <Power className="w-3.5 h-3.5" />
                <span>{isDuty ? '🟢 8-1-1 ON DUTY' : '🔴 8-1-0 OFF DUTY'}</span>
                {isDuty && (
                  <span className="text-[9px] bg-black/50 px-1.5 py-0.2 rounded border border-emerald-700/60 hidden sm:inline text-emerald-200">
                    {dutyDurationStr}
                  </span>
                )}
              </button>

              {/* Active Officer Identity Badge */}
              <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border font-mono transition shrink-0 ${
                isHighRank
                  ? 'bg-amber-950/40 border-amber-700/70 text-amber-300 shadow-sm'
                  : 'bg-[#0D1117] border-gray-800 text-gray-200'
              }`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold shrink-0 ${
                  isHighRank ? 'bg-amber-900/80 border border-amber-500/80 text-amber-300' : 'bg-blue-900/60 border border-blue-700/60 text-blue-300'
                }`}>
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="text-left leading-tight">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-gray-100 text-[11px] truncate max-w-[130px] lg:max-w-[180px]">
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

              {/* Logout / Switch Account Button */}
              <button
                id="btn-logout-officer"
                type="button"
                onClick={handleLogout}
                className="px-3 py-1.5 bg-rose-950/70 hover:bg-rose-900 text-rose-200 hover:text-white border border-rose-700 hover:border-rose-500 rounded-lg text-xs font-bold font-mono transition flex items-center gap-1.5 shadow-sm shrink-0 active:scale-95"
                title="Keluar / Ganti Akun Petugas"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span>GANTI AKUN</span>
              </button>
            </div>
          </header>

          {/* High Density Sub-Navigation Strip */}
          <div className="bg-[#11141A] border-b border-gray-800 px-4 py-1.5 flex items-center justify-between overflow-x-auto no-scrollbar">
            <nav className="flex items-center gap-1 text-[11px] font-medium">
              {[
                { id: 'calc', label: 'Kalkulator Pasal', icon: Calculator, code: 'CALC', moduleKey: undefined },
                { id: 'dmv', label: '👤 Sipil & DMV', icon: UserCheck, code: 'DMV', moduleKey: 'DMV_CITIZEN' as ModuleAccessKey },
                { id: 'divisions', label: '🎖️ Divisi Khusus', icon: Award, code: 'DIV', moduleKey: 'SPECIAL_DIVISIONS' as ModuleAccessKey },
                { id: 'forensics', label: '🔬 Lab Forensik', icon: Microscope, code: 'LAB', moduleKey: 'FORENSICS' as ModuleAccessKey },
                { id: 'documents', label: '📄 Surat & Dokumen', icon: StampIcon, code: 'DOC', moduleKey: 'OFFICIAL_DOCS' as ModuleAccessKey },
                { id: 'detective', label: `🔍 Kasus Detektif (${detectiveCases.length})`, icon: Search, code: 'DB', moduleKey: 'DETECTIVE' as ModuleAccessKey },
                { id: 'traffic', label: `🚗 BOLO & Sitaan (${boloList.length})`, icon: Car, code: 'BOLO', moduleKey: 'BOLO' as ModuleAccessKey },
                { id: 'vault', label: '🏦 Brankas & Audit', icon: Landmark, code: 'VAULT', moduleKey: 'VAULT' as ModuleAccessKey },
                { id: 'destruction', label: '💥 Peleburan Sitaan', icon: Flame, code: 'LEBUR', moduleKey: 'DESTRUCTION' as ModuleAccessKey },
                { id: 'megaphone', label: 'Megaphone Studio', icon: Megaphone, code: '/M', moduleKey: undefined },
                { id: 'rp', label: 'Hak Miranda & RP', icon: BookOpen, code: 'RP', moduleKey: undefined },
                { id: 'sop', label: 'SOP & Ten-Codes', icon: Radio, code: 'SOP', moduleKey: undefined },
                { 
                  id: 'history', 
                  label: `📁 Riwayat Kasus (${records.length})`, 
                  icon: FileText, 
                  code: 'LOG',
                  moduleKey: 'CASE_HISTORY' as ModuleAccessKey,
                  isHighRankOnly: true
                },
                ...(isHighRank ? [
                  {
                    id: 'roster',
                    label: `👑 Roster Anggota (${roster.length})`,
                    icon: Users,
                    code: 'ROSTER',
                    moduleKey: undefined,
                    isHighRankOnly: true
                  },
                  {
                    id: 'settings',
                    label: 'Setting & Otoritas',
                    icon: Settings,
                    code: 'CFG',
                    moduleKey: undefined,
                    isHighRankOnly: true
                  }
                ] : []),
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeNav === tab.id;
                
                // Calculate real-time clearance status
                let isLocked = false;
                let hasOtpActive = false;
                if (tab.moduleKey) {
                  const clearance = checkDirectRankClearance(tab.moduleKey, currentOfficer);
                  hasOtpActive = Boolean(hasActiveUnlockedSession(tab.moduleKey, currentOfficer?.badge));
                  isLocked = !clearance.hasClearance && !hasOtpActive;
                }

                return (
                  <button
                    key={tab.id}
                    id={`nav-btn-${tab.id}`}
                    onClick={() => setActiveNav(tab.id as any)}
                    className={`px-2.5 py-1.5 rounded flex items-center gap-1.5 transition whitespace-nowrap text-xs ${
                      isActive
                        ? 'bg-blue-600 text-white font-bold shadow-sm shadow-blue-600/30 ring-1 ring-blue-400/40'
                        : isLocked
                          ? 'text-gray-400 hover:text-amber-300 hover:bg-amber-950/20 border border-transparent hover:border-amber-700/40'
                          : hasOtpActive
                            ? 'text-emerald-300 hover:text-emerald-200 hover:bg-emerald-950/30'
                            : 'text-gray-300 hover:text-gray-100 hover:bg-gray-800/60'
                    }`}
                    title={isLocked ? 'Memerlukan Otorisasi Pangkat / Divisi atau Kode OTP Atasan' : undefined}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isLocked ? 'text-gray-500' : hasOtpActive ? 'text-emerald-400' : ''}`} />
                    <span>{tab.label}</span>
                    {isLocked && (
                      <span className="text-[9px] bg-gray-800/90 text-amber-400 px-1 py-0.2 rounded border border-amber-800/50 flex items-center gap-0.5">
                        <Lock className="w-2.5 h-2.5 inline" />
                      </span>
                    )}
                    {hasOtpActive && !isLocked && (
                      <span className="text-[9px] bg-emerald-950 text-emerald-300 px-1 py-0.2 rounded border border-emerald-700/60 font-mono">
                        OTP
                      </span>
                    )}
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
        </>
      )}

      {/* Main Content Body */}
      <main className={`max-w-7xl mx-auto px-2.5 sm:px-5 py-3 sm:py-4 flex-1 w-full ${isAndroidMode ? 'pb-24 sm:pb-28' : ''}`}>
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
          <ModuleClearanceGuard
            moduleKey="OFFICIAL_DOCS"
            currentOfficer={currentOfficer}
            roster={roster}
          >
            <OfficialDocumentStudio
              currentOfficer={currentOfficer}
              webhookConfig={getDiscordWebhookConfig()}
            />
          </ModuleClearanceGuard>
        )}
        {activeNav === 'detective' && (
          <ModuleClearanceGuard
            moduleKey="DETECTIVE"
            currentOfficer={currentOfficer}
            roster={roster}
          >
            <DetectiveCaseBoard
              cases={detectiveCases}
              currentOfficer={currentOfficer}
              onSaveCase={handleSaveDetectiveCase}
              onCreateCase={handleCreateDetectiveCase}
              onDeleteCase={handleDeleteDetectiveCase}
            />
          </ModuleClearanceGuard>
        )}
        {activeNav === 'traffic' && (
          <ModuleClearanceGuard
            moduleKey="BOLO"
            currentOfficer={currentOfficer}
            roster={roster}
          >
            <BoloAndTrafficHub
              boloList={boloList}
              impoundList={impoundList}
              currentOfficer={currentOfficer}
              onSaveBolo={handleSaveBoloAlerts}
              onSaveImpound={handleSaveImpoundRecords}
            />
          </ModuleClearanceGuard>
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
          <ModuleClearanceGuard
            moduleKey="CASE_HISTORY"
            currentOfficer={currentOfficer}
            roster={roster}
          >
            <ArrestHistory
              records={records}
              onDeleteRecord={handleDeleteRecord}
              onClearAll={handleClearAllRecords}
              onImportRecords={handleImportRecords}
              currentOfficer={currentOfficer}
              onSwitchOfficer={handleLogout}
            />
          </ModuleClearanceGuard>
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
            onPurgeNonAtasanOfficers={handlePurgeNonAtasanOfficers}
            onOpenPinResetAudit={() => setIsPinResetAuditModalOpen(true)}
            onOpenWebhookModal={(tab) => {
              setWebhookModalInitialTab((tab as any) || 'roster');
              setIsWebhookModalOpen(true);
            }}
            onNavigateToSettings={(sectionId) => {
              setActiveNav('settings');
              if (sectionId) {
                setTimeout(() => {
                  const el = document.getElementById(sectionId);
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }, 150);
              }
            }}
            pendingPinResetCount={pendingPinCount}
          />
        )}
        {activeNav === 'settings' && isHighRank && (
          <SettingsView
            currentOfficer={currentOfficer}
            roster={roster}
            branding={branding}
            authorityPinConfig={authorityPinConfig}
            pinTimeRemaining={pinTimeRemaining}
            pendingPinCount={pendingPinCount}
            onOpenBrandingModal={() => setIsBrandingModalOpen(true)}
            onOpenOtpModal={() => {
              setOtpModalDefaultModule('VAULT');
              setIsOtpGeneratorModalOpen(true);
            }}
            onOpenAuthorityPinModal={() => setIsAuthorityPinModalOpen(true)}
            onOpenWebhookModal={() => {
              setWebhookModalInitialTab('case');
              setIsWebhookModalOpen(true);
            }}
            onOpenPinAuditModal={() => setIsPinResetAuditModalOpen(true)}
            onOpenExportAttendanceModal={() => setIsExportAttendanceModalOpen(true)}
            onOpenRecruitmentPortalModal={() => setIsRecruitmentPortalModalOpen(true)}
            onToggleViewMode={handleToggleViewMode}
            isAndroidMode={isAndroidMode}
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
        onOpenBrandingModal={() => setIsBrandingModalOpen(true)}
        initialTab={webhookModalInitialTab}
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
        onOpenWebhookSettings={() => setIsWebhookModalOpen(true)}
      />

      {/* Realtime Alert & Quick-Accept Banner for Online Supervisors */}
      <PinResetRealtimeNotifier
        currentOfficer={currentOfficer}
        roster={roster}
        onUpdateOfficerPin={handleUpdateOfficerPin}
        onOpenAuditModal={() => setIsPinResetAuditModalOpen(true)}
      />

      {/* OTP Clearance & Disposition Generator Modal (Supervisor & High Command) */}
      <OtpGeneratorModal
        isOpen={isOtpGeneratorModalOpen}
        onClose={() => setIsOtpGeneratorModalOpen(false)}
        currentOfficer={currentOfficer}
        roster={roster}
        defaultModule={otpModalDefaultModule}
      />

      {/* Custom Website Logo & Department Branding Modal */}
      <CustomBrandingModal
        isOpen={isBrandingModalOpen}
        onClose={() => setIsBrandingModalOpen(false)}
        currentOfficer={currentOfficer}
        onBrandingUpdated={cfg => setBranding(cfg)}
      />

      {/* Recruitment & Academy Information Settings Modal (High Command / Supervisor) */}
      <RecruitmentPortalSettingsModal
        isOpen={isRecruitmentPortalModalOpen}
        onClose={() => setIsRecruitmentPortalModalOpen(false)}
        currentOfficer={currentOfficer}
      />

      {/* Export Absen Mingguan Modal (Excel / ZIP / CSV / Print) */}
      <ExportAttendanceModal
        isOpen={isExportAttendanceModalOpen}
        onClose={() => setIsExportAttendanceModalOpen(false)}
        roster={roster}
        departmentName={branding.departmentName}
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
