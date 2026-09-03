import React, { useState, useEffect } from 'react';
import { 
  OfficerAccount, OfficerRankLevel, OfficerWarning, DischargeRecord, PromotionRecord, ALL_RANKS, HIGH_COMMAND_RANKS, isOfficerHighRank, isAtasanRank 
} from '../types';
import { 
  Shield, User, Award, ArrowUpRight, ArrowDownRight, Edit3, 
  Search, CheckCircle2, AlertTriangle, KeyRound, 
  Sparkles, ShieldAlert, X, Plus, ShieldCheck, Clock, Lock,
  UserX, Trash2, AlertOctagon, Send, RotateCcw, AlertCircle, FileText, RefreshCw,
  UserPlus, Phone, Sliders, Eye, EyeOff, Radio, Activity, FileSpreadsheet, Download, Archive,
  MessageSquare, Bot, Upload, Image, Palette, Save, Bookmark, Settings, Globe, ExternalLink
} from 'lucide-react';
import { ExportAttendanceModal } from './ExportAttendanceModal';
import { getNextAvailableBadge } from '../utils/badgeHelper';
import { 
  sendOfficerWarningToDiscord, 
  sendOfficerDischargeToDiscord,
  sendPromotionAnnouncementToDiscord,
  sendNewOfficerRegistrationToDiscord,
  sendOfficerLoginCredentialsToDiscord,
  sendOfficerDirectMessageViaBot,
  getSavedWarningWebhookConfig,
  getSavedDischargeWebhookConfig,
  getSavedPromotionWebhookConfig,
  getSavedDiscordBotConfig,
  getDiscordBotGatewayStatus,
  startDiscordBotGateway,
  PRESET_DISCORD_BOT_LOGOS,
  getSavedSuperiorDmMessage,
  saveSuperiorDmMessage,
  getSavedSuperiorDmPresets,
  saveSuperiorDmPresets,
  SuperiorSavedPreset,
  getSavedRosterWebhookConfig,
  saveRosterWebhookConfig,
  testRosterDiscordWebhook,
  getSavedPinResetWebhookConfig,
  savePinResetWebhookConfig,
  WebhookConfig
} from '../utils/discordWebhook';
import { getOfficerDutyState, formatDutyDuration } from '../utils/officerDutyStorage';
import { HSPD_LOGO_URL } from '../assets/logo';
import { 
  syncCollectionWithFirestore, 
  pullLatestFromFirestore, 
  subscribeToSyncStatus, 
  resetQuotaExhausted,
  FirebaseSyncStatus 
} from '../services/firebaseRealtimeSync';
import { mergeWithOfficialRoster, HSPD_OFFICIAL_ROSTER } from '../data/hspdOfficialRoster';
import { updateOfficerPinInRoster, getRosterFromStorage, saveRosterToStorage, isOfficerMatch } from '../utils/pinResetStorage';
import { getDischargedOfficers, restoreDischargedOfficer, DischargedOfficerEntry } from '../utils/dischargeStorage';

interface Props {
  roster: OfficerAccount[];
  currentOfficerRank?: OfficerRankLevel;
  currentOfficerName?: string;
  currentOfficerBadge?: string;
  onUpdateOfficer: (updated: OfficerAccount) => void;
  onRegisterOfficer?: (newAccount: OfficerAccount) => void;
  onDeleteOfficer?: (officerId: string, reason?: string, deletingOfficer?: OfficerAccount) => void;
  onPurgeNonAtasanOfficers?: () => Promise<void> | void;
  onOpenPinResetAudit?: () => void;
  pendingPinResetCount?: number;
  onOpenWebhookModal?: (tab?: string) => void;
  onNavigateToSettings?: (sectionId?: string) => void;
  onClose?: () => void;
}

const PRESET_DIVISIONS = [
  'Field Training Bureau / Patrol',
  'Traffic Enforcement Unit (TEU)',
  'Detective Bureau / CID',
  'Special Weapons and Tactics (SWAT)',
  'K-9 Canine Division',
  'Air Support Division (ASD)',
  'Internal Affairs Division (IAD)',
  'High Command Staff / Executive Office',
  'Police Academy Division',
];

const PRESET_WARNING_REASONS = [
  'Pelanggaran SOP Operasional & Radio Code Lapangan',
  'Penyalahgunaan Senjata Api / Kekerasan Berlebih (Excessive Force)',
  'Insubordinasi / Tidak Mematuhi Instruksi Pimpinan/Supervisor',
  'Lalai / Tidak Tertib dalam Pengisian Laporan Kasus & Denda',
  'Perilaku Tidak Pantas terhadap Warga Sipil / Rekan Seprofesi',
  'Mangkir / Desersi Tugas tanpa Izin Supervisor',
  'Mengabaikan Panggilan Darurat (10-99 / 10-20 Dispatch)',
  'Kerjasama / Membantu Aktivitas Kriminal (Peringatan Keras)',
  'Lainnya (Keterangan Khusus)'
];

const PRESET_DISCHARGE_REASONS = [
  'Akumulasi 3 Surat Peringatan (SP3 / 3 Strikes Disciplinary)',
  'Pelanggaran Kode Etik & Disiplin Berat Kepolisian',
  'Tindakan Korupsi / Kerjasama dengan Kriminal (Dirty Cop)',
  'Inaktif Tanpa Keterangan / Desersi Tugas Lapangan (AWOL)',
  'Penyalahgunaan Wewenang Jabatan & Senjata Api Kepolisian',
  'Gagal Melewati Masa Percobaan / Akademi (Failed Probation)',
  'Pemberhentian Dengan Hormat (Honorable Discharge / Resign)',
  'Mutasi Personel / Restrukturisasi Internal'
];

const PRESET_PROMOTION_REASONS = [
  'Lulus Ujian Kualifikasi / Diklat Kenaikan Pangkat',
  'Prestasi Kinerja, Loyalitas & Jam Terbang Patroli Tinggi',
  'Rekomendasi Resmi Kepala Divisi & Supervisor',
  'Dedikasi Penegakan Hukum & Bebas Pelanggaran Disiplin',
  'Pengangkatan Struktur Kepemimpinan & Komando Unit',
  'Lulus Masa Percobaan / Akademi Kepolisian (Cadet to Officer)',
  'Lainnya (Keterangan Khusus)'
];

export const RosterManagement: React.FC<Props> = ({
  roster,
  currentOfficerRank,
  currentOfficerName,
  currentOfficerBadge,
  onUpdateOfficer,
  onRegisterOfficer,
  onDeleteOfficer,
  onPurgeNonAtasanOfficers,
  onOpenPinResetAudit,
  pendingPinResetCount,
  onOpenWebhookModal,
  onNavigateToSettings,
  onClose
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRank, setFilterRank] = useState<'ALL' | 'DUTY' | 'COMMAND' | 'PATROL' | 'WARNED' | 'DISCHARGED'>('ALL');
  const [editingOfficer, setEditingOfficer] = useState<OfficerAccount | null>(null);
  const [showPurgeNonAtasanModal, setShowPurgeNonAtasanModal] = useState(false);
  const [isPurgingNonAtasan, setIsPurgingNonAtasan] = useState(false);

  // Webhook Settings Configuration Modal State (Bisa merubah webhook di Pengaturan Sistem & Otoritas Komando)
  const [isWebhookConfigModalOpen, setIsWebhookConfigModalOpen] = useState(false);
  const [rosterWebhookUrl, setRosterWebhookUrl] = useState('');
  const [rosterBotName, setRosterBotName] = useState('');
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [isSavingWebhook, setIsSavingWebhook] = useState(false);
  const [webhookNotice, setWebhookNotice] = useState<{ success: boolean; message: string } | null>(null);

  const handleOpenWebhookConfigModal = () => {
    const rConfig = getSavedRosterWebhookConfig();
    const pConfig = getSavedPinResetWebhookConfig();
    setRosterWebhookUrl(rConfig.webhookUrl || pConfig.webhookUrl || '');
    setRosterBotName(rConfig.botName || 'HSPD Personnel & Roster Bureau');
    setWebhookNotice(null);
    setIsWebhookConfigModalOpen(true);
  };

  const handleSaveWebhookConfig = () => {
    setIsSavingWebhook(true);
    setWebhookNotice(null);
    try {
      const trimmedUrl = rosterWebhookUrl.trim();
      const trimmedBot = rosterBotName.trim() || 'HSPD Personnel & Roster Bureau';
      
      saveRosterWebhookConfig({
        webhookUrl: trimmedUrl,
        botName: trimmedBot
      });
      savePinResetWebhookConfig({
        webhookUrl: trimmedUrl,
        botName: trimmedBot
      });
      setWebhookNotice({
        success: true,
        message: '✅ URL Webhook berhasil disimpan dan disinkronkan ke Pengaturan Sistem & Otoritas Komando!'
      });
      setTimeout(() => {
        setWebhookNotice(null);
      }, 4000);
    } catch (e: any) {
      setWebhookNotice({
        success: false,
        message: `Gagal menyimpan webhook: ${e.message || 'Error tidak diketahui'}`
      });
    } finally {
      setIsSavingWebhook(false);
    }
  };

  const handleTestWebhookPing = async () => {
    if (!rosterWebhookUrl.trim()) {
      setWebhookNotice({
        success: false,
        message: 'Masukkan URL Webhook Discord terlebih dahulu sebelum melakukan tes ping.'
      });
      return;
    }
    setIsTestingWebhook(true);
    setWebhookNotice(null);
    try {
      const res = await testRosterDiscordWebhook({
        webhookUrl: rosterWebhookUrl.trim(),
        botName: rosterBotName.trim() || 'HSPD Personnel & Roster Bureau',
        botAvatar: 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
        autoSendOnSave: true
      });
      setWebhookNotice({
        success: res.success,
        message: res.message
      });
    } catch (e: any) {
      setWebhookNotice({
        success: false,
        message: `Tes gagal: ${e.message || 'Periksa koneksi internet & URL webhook'}`
      });
    } finally {
      setIsTestingWebhook(false);
    }
  };
  
  // Discharged officers archive state
  const [dischargedList, setDischargedList] = useState<DischargedOfficerEntry[]>(() => getDischargedOfficers());

  React.useEffect(() => {
    const handleDischargedUpdated = () => {
      setDischargedList(getDischargedOfficers());
    };
    window.addEventListener('hspd-discharged-updated', handleDischargedUpdated);
    return () => {
      window.removeEventListener('hspd-discharged-updated', handleDischargedUpdated);
    };
  }, []);

  // Dedicated save state for Discord User ID in PM modal
  const [isSavingTargetDiscordId, setIsSavingTargetDiscordId] = useState(false);
  const [discordIdSaveNotice, setDiscordIdSaveNotice] = useState<string | null>(null);
  
  // Warning Management Modal State
  const [warningOfficer, setWarningOfficer] = useState<OfficerAccount | null>(null);
  const [warningPresetReason, setWarningPresetReason] = useState(PRESET_WARNING_REASONS[0]);
  const [warningDetailReason, setWarningDetailReason] = useState('');
  const [warningSendWebhook, setWarningSendWebhook] = useState(true);
  const [isSubmittingWarning, setIsSubmittingWarning] = useState(false);
  const [warningModalNotice, setWarningModalNotice] = useState('');

  // Discharge / Delete Modal State
  const [deletingOfficer, setDeletingOfficer] = useState<OfficerAccount | null>(null);
  const [deletePresetReason, setDeletePresetReason] = useState(PRESET_DISCHARGE_REASONS[0]);
  const [deleteDetailReason, setDeleteDetailReason] = useState('');
  const [deleteSendWebhook, setDeleteSendWebhook] = useState(true);
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);

  // Edit Officer State
  const [newRank, setNewRank] = useState<OfficerRankLevel>('POLICE OFFICER II [PO II]');
  const [newDivision, setNewDivision] = useState('');
  const [newPin, setNewPin] = useState('');
  const [editDiscordTag, setEditDiscordTag] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [isSendingCredentials, setIsSendingCredentials] = useState(false);
  const [sendingCredentialsId, setSendingCredentialsId] = useState<string | null>(null);
  const [showEditPin, setShowEditPin] = useState(false);
  const [showTablePins, setShowTablePins] = useState(false);
  const [revealedPins, setRevealedPins] = useState<Record<string, boolean>>({});
  const [promotionPresetReason, setPromotionPresetReason] = useState(PRESET_PROMOTION_REASONS[0]);
  const [promotionDetailReason, setPromotionDetailReason] = useState('');
  const [promotionSendWebhook, setPromotionSendWebhook] = useState(true);
  const [isSubmittingRankUpdate, setIsSubmittingRankUpdate] = useState(false);
  const [successNotice, setSuccessNotice] = useState('');
  const [isSyncingRealtime, setIsSyncingRealtime] = useState(false);
  const [isPullingRealtime, setIsPullingRealtime] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isExportAttendanceModalOpen, setIsExportAttendanceModalOpen] = useState(false);
  const [firebaseStatus, setFirebaseStatus] = useState<FirebaseSyncStatus>({
    connected: true,
    lastSyncTime: Date.now(),
    pendingCount: 0,
    error: null
  });

  React.useEffect(() => {
    return subscribeToSyncStatus(st => setFirebaseStatus(st));
  }, []);

  const handleManualSyncDatabase = async () => {
    setIsSyncingRealtime(true);
    resetQuotaExhausted();
    try {
      const merged = mergeWithOfficialRoster(roster);
      localStorage.setItem('hspd_roster_database_v4', JSON.stringify(merged));
      localStorage.setItem('hspd_roster_database_v3', JSON.stringify(merged));
      const ok = await syncCollectionWithFirestore('ROSTER', merged, true);
      if (ok) {
        setSuccessNotice(`⚡ Cloud Firestore Berhasil Disinkronkan! Total ${merged.length} data anggota kepolisian & PIN aktif tersimpan ke Cloud.`);
      } else {
        setSuccessNotice(`✅ Database Lokal Berhasil Disimpan (${merged.length} data anggota).`);
      }
      setTimeout(() => setSuccessNotice(''), 6000);
    } catch (err: any) {
      setSuccessNotice(`✅ Database lokal aktif: ${roster.length} data anggota kepolisian tersimpan.`);
      setTimeout(() => setSuccessNotice(''), 4000);
    } finally {
      setIsSyncingRealtime(false);
    }
  };

  const handlePullCloudDatabase = async () => {
    setIsPullingRealtime(true);
    resetQuotaExhausted();
    try {
      const fresh = await pullLatestFromFirestore<OfficerAccount>('ROSTER');
      if (fresh && fresh.length > 0) {
        setSuccessNotice(`📥 Sukses Menarik Data: Total ${fresh.length} data anggota kepolisian terbaru tersinkronisasi dari Cloud Firestore!`);
      } else {
        setSuccessNotice(`⚡ Verifikasi Cloud selesai: Total ${roster.length} data anggota aktif sinkron.`);
      }
      setTimeout(() => setSuccessNotice(''), 6000);
    } catch (err: any) {
      setSuccessNotice(`⚠️ Gagal menarik data dari cloud: ${err.message || 'Periksa jaringan'}`);
      setTimeout(() => setSuccessNotice(''), 5000);
    } finally {
      setIsPullingRealtime(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    resetQuotaExhausted();
    try {
      const fresh = await pullLatestFromFirestore<OfficerAccount>('ROSTER');
      if (fresh) {
        setSuccessNotice(`🟢 Koneksi Cloud Firestore ONLINE: Terhubung langsung ke Database ID "ai-studio-hspdroleplayassi-2774b304-6286-4462-9d17-823224c7f4fd" (${fresh.length} Personel).`);
      } else {
        setSuccessNotice(`🟢 Database Status: Menggunakan penyimpanan terintegrasi (${roster.length} Personel).`);
      }
      setTimeout(() => setSuccessNotice(''), 6000);
    } catch (e: any) {
      setSuccessNotice(`🔴 Status Koneksi: Offline / Penyimpanan Lokal Aktif.`);
      setTimeout(() => setSuccessNotice(''), 5000);
    } finally {
      setIsTestingConnection(false);
    }
  };

  // Add Officer Modal State (High Command Full Access)
  const [isAddOfficerModalOpen, setIsAddOfficerModalOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [addBadge, setAddBadge] = useState('#');
  const [isManualBadge, setIsManualBadge] = useState(false);
  const [addRank, setAddRank] = useState<OfficerRankLevel>('CADET [CDT]');
  const [addDivision, setAddDivision] = useState(PRESET_DIVISIONS[0]);
  const [addCustomDivision, setAddCustomDivision] = useState('');
  const [addPin, setAddPin] = useState('10-4');
  const [addDiscordTag, setAddDiscordTag] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addPromotedBy, setAddPromotedBy] = useState(() => 
    `SK Pengangkatan oleh ${currentOfficerRank || 'High Command'} ${currentOfficerName || ''}`
  );
  const [addSendWebhook, setAddSendWebhook] = useState(true);
  const [addSendDm, setAddSendDm] = useState(true);
  const [addCustomMessage, setAddCustomMessage] = useState('Selamat bergabung di jajaran Kepolisian HSPD! Harap segera login ke terminal MDT dan patuhi seluruh SOP dinas.');
  const [isBotOnline, setIsBotOnline] = useState<boolean | null>(null);
  const [isConnectingBot, setIsConnectingBot] = useState(false);
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);
  const [addFormError, setAddFormError] = useState('');
  const [addOfficerSuccessMsg, setAddOfficerSuccessMsg] = useState('');
  const [showAddPin, setShowAddPin] = useState(false);

  // Check bot gateway status when Add Officer modal opens
  useEffect(() => {
    if (isAddOfficerModalOpen) {
      getDiscordBotGatewayStatus().then(res => {
        setIsBotOnline(res.isOnline);
      }).catch(() => {
        setIsBotOnline(false);
      });
    }
  }, [isAddOfficerModalOpen]);

  const handleQuickStartBot = async () => {
    setIsConnectingBot(true);
    try {
      const res = await startDiscordBotGateway();
      if (res.success) {
        setIsBotOnline(true);
      }
    } catch {}
    setIsConnectingBot(false);
  };

  // Quick Direct Message (PM via Bot Discord) Modal State
  const [targetDmOfficer, setTargetDmOfficer] = useState<OfficerAccount | null>(null);
  const [targetDmUserId, setTargetDmUserId] = useState('');
  const [targetDmBotName, setTargetDmBotName] = useState('Cek Akun | High State');
  const [targetDmLogoUrl, setTargetDmLogoUrl] = useState('https://cdn-icons-png.flaticon.com/512/1022/1022382.png');
  const [targetDmEmbedTitle, setTargetDmEmbedTitle] = useState('✅ Berhasil!');
  const [targetDmEmbedDescription, setTargetDmEmbedDescription] = useState('Berikut adalah detail dari akun UCP Anda:');
  const [targetDmEmbedColor, setTargetDmEmbedColor] = useState('#00A8FF');
  const [targetDmFooterText, setTargetDmFooterText] = useState('Bot High State');
  const [targetDmCustomNote, setTargetDmCustomNote] = useState('Jangan beritahu informasi ini kepada orang lain!');
  const [targetDmOfficerName, setTargetDmOfficerName] = useState('');
  const [targetDmPin, setTargetDmPin] = useState('');
  const [targetDmBadge, setTargetDmBadge] = useState('');
  const [targetDmRank, setTargetDmRank] = useState('');
  const [targetDmDivision, setTargetDmDivision] = useState('');
  const [targetDmMessageType, setTargetDmMessageType] = useState<'credentials' | 'custom_chat'>('credentials');
  const [targetDmCustomMessage, setTargetDmCustomMessage] = useState<string>(() => getSavedSuperiorDmMessage());
  const [superiorDmPresets, setSuperiorDmPresets] = useState<SuperiorSavedPreset[]>(() => getSavedSuperiorDmPresets());
  const [saveMessageNotice, setSaveMessageNotice] = useState<string | null>(null);
  const [newPresetTitle, setNewPresetTitle] = useState('');
  const [showAddPresetInput, setShowAddPresetInput] = useState(false);
  const [showAdvancedDmSettings, setShowAdvancedDmSettings] = useState(false);
  const [isSendingBotDm, setIsSendingBotDm] = useState(false);
  const [botDmResultNotice, setBotDmResultNotice] = useState<{ success: boolean; message: string } | null>(null);

  // Check if current officer holds one of the 4 High Command ranks
  const isCurrentOfficerCommand = isOfficerHighRank(currentOfficerRank);

  const handleOpenAddModal = () => {
    if (!isCurrentOfficerCommand) {
      alert('Akses Ditolak: Hanya jajaran High Command (Chief of Police, Assistant Chief, Deputy Chief, Commander) yang memiliki hak akses pendaftaran anggota baru.');
      return;
    }
    setAddName('');
    const nextAutoBadge = getNextAvailableBadge(roster, 'CADET [CDT]');
    setAddBadge(nextAutoBadge);
    setIsManualBadge(false);
    setAddRank('CADET [CDT]');
    setAddDivision(PRESET_DIVISIONS[0]);
    setAddCustomDivision('');
    setAddPin('10-4');
    setAddDiscordTag('');
    setAddPhone('');
    setAddPromotedBy(`SK Pengangkatan oleh ${currentOfficerRank || 'High Command'} ${currentOfficerName || ''}`);
    setAddSendWebhook(true);
    setAddSendDm(true);
    setAddFormError('');
    setAddOfficerSuccessMsg('');
    setIsAddOfficerModalOpen(true);
  };

  const handleRankChange = (newRank: OfficerRankLevel) => {
    setAddRank(newRank);
    if (!isManualBadge) {
      const nextBadgeForRank = getNextAvailableBadge(roster, newRank);
      setAddBadge(nextBadgeForRank);
    }
  };

  const handleResetToAutoBadge = () => {
    const nextAutoBadge = getNextAvailableBadge(roster, addRank);
    setAddBadge(nextAutoBadge);
    setIsManualBadge(false);
    setAddFormError('');
  };

  const handleSaveNewOfficer = async (e?: React.FormEvent, addAnother: boolean = false) => {
    if (e) e.preventDefault();
    if (!isCurrentOfficerCommand) return;

    const trimmedName = addName.trim();
    let trimmedBadge = addBadge.trim();
    if (!trimmedBadge.startsWith('#')) {
      trimmedBadge = `#${trimmedBadge}`;
    }
    const trimmedPin = addPin.trim();
    const finalDivision = addDivision === 'CUSTOM' ? (addCustomDivision.trim() || 'Field Patrol') : addDivision;

    if (!trimmedName) {
      setAddFormError('Nama lengkap anggota kepolisian wajib diisi!');
      return;
    }
    if (!trimmedBadge || trimmedBadge === '#') {
      setAddFormError('Nomor badge / lencana wajib diisi!');
      return;
    }
    if (!trimmedPin) {
      setAddFormError('PIN Login awal wajib ditentukan!');
      return;
    }

    // Check duplicate badge
    const duplicateBadge = roster.find(o => o.badge.toLowerCase() === trimmedBadge.toLowerCase());
    if (duplicateBadge) {
      setAddFormError(`Nomor Badge "${trimmedBadge}" sudah digunakan oleh petugas ${duplicateBadge.name}! Gunakan nomor badge lain.`);
      return;
    }

    // Check duplicate name
    const duplicateName = roster.find(o => o.name.toLowerCase() === trimmedName.toLowerCase());
    if (duplicateName) {
      setAddFormError(`Nama "${trimmedName}" sudah terdaftar di Roster (Badge ${duplicateName.badge})!`);
      return;
    }

    setIsSubmittingAdd(true);
    setAddFormError('');
    setAddOfficerSuccessMsg('');

    const newAccount: OfficerAccount = {
      id: `roster-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: trimmedName,
      badge: trimmedBadge,
      rank: addRank,
      division: finalDivision,
      phone: addPhone.trim() || undefined,
      discordTag: addDiscordTag.trim() || undefined,
      pin: trimmedPin,
      registeredAt: Date.now(),
      promotedBy: addPromotedBy.trim() || `SK Pengangkatan oleh ${currentOfficerRank || 'High Command'} ${currentOfficerName || ''}`,
      warnings: []
    };

    try {
      // 1. Send Direct Message (PM / DM) via Discord Bot directly to officer's Discord inbox if requested
      let dmStatusText = '';
      if (addSendDm && addDiscordTag.trim()) {
        try {
          const dmRes = await sendOfficerDirectMessageViaBot({
            discordUserId: addDiscordTag.trim(),
            officerName: trimmedName,
            pin: trimmedPin,
            badge: trimmedBadge,
            rank: addRank,
            division: finalDivision,
            customMessage: addCustomMessage.trim() || undefined,
            note: 'Jangan beritahu informasi ini kepada orang lain!'
          });
          if (dmRes.success) {
            dmStatusText = ' & Kredensial & pesan atasan sukses terkirim ke PM Discord (Bot Online 🟢)!';
          } else {
            dmStatusText = ` (⚠️ Bot PM: ${dmRes.message})`;
          }
        } catch (botErr: any) {
          console.warn('Bot PM dispatch skipped or encountered error:', botErr);
          dmStatusText = ` (⚠️ Bot PM: ${botErr.message || 'Gagal mengirim PM'})`;
        }
      }

      // 2. Send Discord Webhook Announcement & Credential Dispatch if enabled
      if (addSendWebhook) {
        await sendNewOfficerRegistrationToDiscord({
          officerName: trimmedName,
          officerBadge: trimmedBadge,
          officerRank: addRank,
          officerDivision: finalDivision,
          officerPhone: addPhone.trim() || undefined,
          discordTag: addDiscordTag.trim() || undefined,
          initialPin: trimmedPin,
          registeredBy: currentOfficerName || 'High Command',
          registeredByBadge: currentOfficerBadge || '#001',
          registeredByRank: currentOfficerRank || 'HIGH COMMAND',
        });
      }

      // 3. Call handler or update roster
      if (onRegisterOfficer) {
        onRegisterOfficer(newAccount);
      } else {
        onUpdateOfficer(newAccount);
      }

      if (addAnother) {
        // Prepare for the NEXT officer immediately
        const simulatedRoster = [...roster, newAccount];
        const nextSequentialBadge = getNextAvailableBadge(simulatedRoster, addRank);
        setAddBadge(nextSequentialBadge);
        setIsManualBadge(false);
        setAddName('');
        setAddDiscordTag('');
        setAddPhone('');
        setAddOfficerSuccessMsg(`✅ Petugas ${trimmedName} (${trimmedBadge}) sukses didaftarkan!${dmStatusText} Badge otomatis berlanjut ke ${nextSequentialBadge} untuk anggota berikutnya.`);
        setSuccessNotice(`✅ Personel Baru ${trimmedName} (${trimmedBadge}) berhasil ditambahkan ke Roster!${dmStatusText}`);
        setTimeout(() => setSuccessNotice(''), 5000);
      } else {
        setIsAddOfficerModalOpen(false);
        setSuccessNotice(`✅ Personel Baru ${trimmedName} (${trimmedBadge}) pangkat ${addRank} berhasil ditambahkan ke Roster dan disahkan!${dmStatusText}`);
        setTimeout(() => setSuccessNotice(''), 6000);
      }
    } catch (err: any) {
      console.error('Failed to register new officer:', err);
      if (onRegisterOfficer) onRegisterOfficer(newAccount);
      if (addAnother) {
        const simulatedRoster = [...roster, newAccount];
        const nextSequentialBadge = getNextAvailableBadge(simulatedRoster, addRank);
        setAddBadge(nextSequentialBadge);
        setIsManualBadge(false);
        setAddName('');
        setAddDiscordTag('');
        setAddPhone('');
        setAddOfficerSuccessMsg(`✅ Personel ${trimmedName} (${trimmedBadge}) tersimpan di database! Badge baru: ${nextSequentialBadge}.`);
      } else {
        setIsAddOfficerModalOpen(false);
        setSuccessNotice(`✅ Personel Baru ${trimmedName} (${trimmedBadge}) berhasil ditambahkan ke database roster!`);
        setTimeout(() => setSuccessNotice(''), 6000);
      }
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  const filteredRoster = roster.filter(officer => {
    const matchesSearch = 
      officer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      officer.badge.toLowerCase().includes(searchQuery.toLowerCase()) ||
      officer.rank.toLowerCase().includes(searchQuery.toLowerCase()) ||
      officer.division.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (officer.discordTag && officer.discordTag.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (officer.phone && officer.phone.includes(searchQuery)) ||
      (officer.pin && officer.pin.includes(searchQuery));
    
    if (!matchesSearch) return false;
    if (filterRank === 'DUTY') {
      const duty = getOfficerDutyState(officer.badge, roster);
      return duty.isDuty;
    }
    if (filterRank === 'COMMAND') return isOfficerHighRank(officer.rank);
    if (filterRank === 'PATROL') return !isOfficerHighRank(officer.rank);
    if (filterRank === 'WARNED') return (officer.warnings?.length || 0) > 0;
    return true;
  });

  const handleStartEdit = (officer: OfficerAccount) => {
    if (!isCurrentOfficerCommand) {
      alert('Akses Ditolak: Hanya jajaran High Command (Chief of Police, Assistant Chief, Deputy Chief, Commander) yang berhak mengubah pangkat dan PIN anggota.');
      return;
    }
    setEditingOfficer(officer);
    setNewRank(officer.rank);
    setNewDivision(officer.division);
    setNewPin(officer.pin || '10-4');
    setEditDiscordTag(officer.discordTag || '');
    setEditPhone(officer.phone || '');
    setShowEditPin(false);
    setPromotionPresetReason(PRESET_PROMOTION_REASONS[0]);
    setPromotionDetailReason('');
    setPromotionSendWebhook(true);
  };

  const handleStartWarning = (officer: OfficerAccount) => {
    if (!isCurrentOfficerCommand) {
      alert('Akses Ditolak: Hanya jajaran High Command yang berhak menerbitkan Surat Peringatan (SP / Strike) kepada anggota.');
      return;
    }
    setWarningOfficer(officer);
    setWarningPresetReason(PRESET_WARNING_REASONS[0]);
    setWarningDetailReason('');
    setWarningSendWebhook(true);
    setWarningModalNotice('');
  };

  const handleStartDelete = (officer: OfficerAccount) => {
    if (!isCurrentOfficerCommand) {
      alert('Akses Ditolak: Hanya jajaran High Command yang berhak memecat atau menghapus anggota dari roster.');
      return;
    }
    if (currentOfficerName && officer.name.toLowerCase() === currentOfficerName.toLowerCase()) {
      alert('Aksi Dibatalkan: Anda tidak dapat memecat atau menghapus akun Anda sendiri saat sedang aktif login.');
      return;
    }
    setDeletingOfficer(officer);
    
    const strikeCount = officer.warnings?.length || 0;
    if (strikeCount >= 3) {
      setDeletePresetReason('Akumulasi 3 Surat Peringatan (SP3 / 3 Strikes Disciplinary)');
      setDeleteDetailReason('Personel telah mencapai batas maksimal 3 Surat Peringatan atas akumulasi pelanggaran SOP kepolisian.');
    } else {
      setDeletePresetReason(PRESET_DISCHARGE_REASONS[1]);
      setDeleteDetailReason('');
    }
    setDeleteSendWebhook(true);
  };

  // Submit Warning (SP 1, 2, or 3)
  const handleIssueWarning = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!warningOfficer || !isCurrentOfficerCommand) return;

    const currentStrikes = warningOfficer.warnings?.length || 0;
    if (currentStrikes >= 3) {
      alert('Personel ini telah mencapai batas maksimal 3 Surat Peringatan (Strike 3/3). Harap lakukan proses pemecatan.');
      return;
    }

    const nextStrikeLevel = (currentStrikes + 1) as 1 | 2 | 3;
    const finalReason = warningDetailReason.trim() 
      ? `${warningPresetReason}: ${warningDetailReason.trim()}`
      : warningPresetReason;

    const newWarning: OfficerWarning = {
      id: 'WRN-' + Date.now(),
      strikeNumber: nextStrikeLevel,
      reason: finalReason,
      timestamp: Date.now(),
      issuedBy: currentOfficerName || 'High Command',
      issuedByBadge: currentOfficerBadge || 'HC-01',
      issuedByRank: currentOfficerRank || 'HIGH COMMAND'
    };

    const updatedWarnings = [...(warningOfficer.warnings || []), newWarning];
    const updatedOfficer: OfficerAccount = {
      ...warningOfficer,
      warnings: updatedWarnings
    };

    setIsSubmittingWarning(true);

    try {
      // Send Discord Webhook if checked
      if (warningSendWebhook) {
        const webhookConfig = getSavedWarningWebhookConfig();
        if (webhookConfig.webhookUrl) {
          await sendOfficerWarningToDiscord(
            warningOfficer,
            newWarning,
            updatedWarnings.length,
            webhookConfig
          );
        }
      }

      onUpdateOfficer(updatedOfficer);
      setWarningOfficer(updatedOfficer);
      setWarningModalNotice(`✅ Surat Peringatan Ke-${nextStrikeLevel} (SP${nextStrikeLevel}) berhasil diterbitkan dan dicatat!`);
      setSuccessNotice(`⚠️ Berhasil memberikan SP${nextStrikeLevel} kepada ${warningOfficer.name} (${warningOfficer.badge})`);
      setWarningDetailReason('');
      setTimeout(() => setSuccessNotice(''), 5000);
    } catch (err: any) {
      console.error('Failed to issue warning', err);
      setWarningModalNotice('⚠️ SP tercatat di database CAD, namun webhook Discord gagal terkirim.');
    } finally {
      setIsSubmittingWarning(false);
    }
  };

  // Revoke / Pardon a Warning
  const handleRevokeWarning = (warningId: string) => {
    if (!warningOfficer || !isCurrentOfficerCommand) return;
    if (!confirm('Apakah Anda yakin ingin mencabut/membatalkan Surat Peringatan ini dari berkas personel?')) return;

    const filtered = (warningOfficer.warnings || []).filter(w => w.id !== warningId);
    // Re-index strike numbers
    const reindexed = filtered.map((w, idx) => ({
      ...w,
      strikeNumber: (idx + 1) as 1 | 2 | 3
    }));

    const updatedOfficer: OfficerAccount = {
      ...warningOfficer,
      warnings: reindexed
    };

    onUpdateOfficer(updatedOfficer);
    setWarningOfficer(updatedOfficer);
    setWarningModalNotice('✅ Surat Peringatan berhasil dicabut/dibatalkan.');
    setSuccessNotice(`✅ SP berhasil dicabut dari rekam jejak ${warningOfficer.name}`);
    setTimeout(() => setSuccessNotice(''), 4000);
  };

  // Confirm Discharge / Pecat
  const handleConfirmDelete = async () => {
    if (!deletingOfficer || !onDeleteOfficer) return;
    const removedName = deletingOfficer.name;
    const removedBadge = deletingOfficer.badge;
    const finalReason = deleteDetailReason.trim()
      ? `${deletePresetReason} - ${deleteDetailReason.trim()}`
      : deletePresetReason;

    setIsSubmittingDelete(true);

    try {
      // Send Discord Webhook if checked
      if (deleteSendWebhook) {
        const dischargeConfig = getSavedDischargeWebhookConfig();
        if (dischargeConfig.webhookUrl) {
          const dischargeRecord: DischargeRecord = {
            officerId: deletingOfficer.id,
            officerName: deletingOfficer.name,
            officerBadge: deletingOfficer.badge,
            officerRank: deletingOfficer.rank,
            officerDivision: deletingOfficer.division,
            reason: finalReason,
            dischargedBy: currentOfficerName || 'High Command',
            dischargedByBadge: currentOfficerBadge || 'HC-01',
            dischargedByRank: currentOfficerRank || 'HIGH COMMAND',
            warningCountBeforeDischarge: deletingOfficer.warnings?.length || 0,
            timestamp: Date.now()
          };

          await sendOfficerDischargeToDiscord(
            dischargeRecord,
            dischargeConfig
          );
        }
      }

      if (onDeleteOfficer) {
        onDeleteOfficer(deletingOfficer.id || deletingOfficer.badge, finalReason, deletingOfficer);
      }
      setDeletingOfficer(null);
      setDischargedList(getDischargedOfficers());
      setSuccessNotice(`✅ Berhasil memecat dan memberhentikan ${removedName} (${removedBadge}) dari kepolisian. Data diarsipkan permanen.`);
      setTimeout(() => setSuccessNotice(''), 5000);
    } catch (err) {
      console.error('Discharge failed', err);
      if (onDeleteOfficer) {
        onDeleteOfficer(deletingOfficer.id || deletingOfficer.badge, finalReason, deletingOfficer);
      }
      setDeletingOfficer(null);
      setDischargedList(getDischargedOfficers());
    } finally {
      setIsSubmittingDelete(false);
    }
  };

  const handleSaveRankUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOfficer || !isCurrentOfficerCommand) return;

    setIsSubmittingRankUpdate(true);
    const isRankChanged = editingOfficer.rank !== newRank;
    const finalPromotionReason = promotionPresetReason === 'Lainnya (Keterangan Khusus)'
      ? (promotionDetailReason.trim() || 'Keterangan khusus dari High Command')
      : (promotionDetailReason.trim() ? `${promotionPresetReason} - ${promotionDetailReason.trim()}` : promotionPresetReason);

    const promotedByText = isRankChanged 
      ? `Diubah ke ${newRank} oleh ${currentOfficerName || 'Atasan'} (${currentOfficerRank || 'Command'}) pada ${new Date().toLocaleDateString('id-ID')}`
      : editingOfficer.promotedBy;

    const finalPin = newPin.trim() || editingOfficer.pin || '10-4';
    const updated: OfficerAccount = {
      ...editingOfficer,
      rank: newRank,
      division: newDivision || editingOfficer.division,
      pin: finalPin,
      discordTag: editDiscordTag.trim() || undefined,
      phone: editPhone.trim() || undefined,
      promotedBy: promotedByText,
      _updatedAt: Date.now()
    };

    updateOfficerPinInRoster(editingOfficer.badge, finalPin, editingOfficer.name);

    try {
      if (isRankChanged && promotionSendWebhook) {
        const promotionConfig = getSavedPromotionWebhookConfig();
        if (promotionConfig.webhookUrl) {
          const promotionRecord: PromotionRecord = {
            officerId: editingOfficer.id,
            officerName: editingOfficer.name,
            officerBadge: editingOfficer.badge,
            oldRank: editingOfficer.rank,
            newRank: newRank,
            division: newDivision || editingOfficer.division,
            reason: finalPromotionReason,
            promotedBy: currentOfficerName || 'High Command',
            promotedByBadge: currentOfficerBadge || 'HC-01',
            promotedByRank: currentOfficerRank || 'HIGH COMMAND',
            timestamp: Date.now()
          };

          await sendPromotionAnnouncementToDiscord(promotionRecord, promotionConfig);
        }
      }

      onUpdateOfficer(updated);
      setSuccessNotice(`✅ Berhasil memperbarui data, Discord & PIN akun ${editingOfficer.name} (${editingOfficer.badge})!${isRankChanged ? ` SK Promosi ke ${newRank} telah dicatat.` : ''}`);
      setEditingOfficer(null);
      setTimeout(() => setSuccessNotice(''), 5000);
    } catch (err) {
      console.error('Failed to update officer rank/pin', err);
      onUpdateOfficer(updated);
      setEditingOfficer(null);
    } finally {
      setIsSubmittingRankUpdate(false);
    }
  };

  // Direct send login credentials (UCP & PIN Code) to Discord
  const handleSendDirectCredentials = async (officer: OfficerAccount) => {
    try {
      setSendingCredentialsId(officer.id || officer.name);
      const res = await sendOfficerLoginCredentialsToDiscord({
        officerName: officer.name,
        officerBadge: officer.badge,
        officerRank: officer.rank,
        officerDivision: officer.division,
        pin: officer.pin || '10-4',
        discordTag: officer.discordTag,
        sentBy: currentOfficerName || 'High Command',
        sentByBadge: currentOfficerBadge || '#001',
        sentByRank: currentOfficerRank || 'HIGH COMMAND'
      });
      if (res.success) {
        setSuccessNotice(`✅ Kredensial akun login (UCP & PIN) ${officer.name} (${officer.discordTag || 'Akun UCP'}) berhasil dikirim ke Webhook Discord!`);
      } else {
        alert(res.message);
      }
      setTimeout(() => setSuccessNotice(''), 5000);
    } catch (e: any) {
      alert(`Gagal mengirim ke Discord: ${e.message || 'Periksa koneksi webhook'}`);
    } finally {
      setSendingCredentialsId(null);
    }
  };

  // Open Bot DM (Pesan Pribadi) Modal for an officer
  const handleOpenBotDmModal = (officer: OfficerAccount) => {
    setTargetDmOfficer(officer);
    const rawTag = (officer.discordTag || '').trim();
    const digitsOnly = rawTag.replace(/\D/g, '');
    setTargetDmUserId(digitsOnly || rawTag);
    
    const botCfg = getSavedDiscordBotConfig();
    setTargetDmBotName(botCfg.botName || 'Cek Akun | High State');
    setTargetDmLogoUrl(botCfg.botAvatar || 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png');
    setTargetDmEmbedTitle(botCfg.embedTitle || '✅ Berhasil!');
    setTargetDmEmbedDescription(botCfg.embedDescription || 'Berikut adalah detail dari akun UCP Anda:');
    setTargetDmEmbedColor(botCfg.embedColor || '#00A8FF');
    setTargetDmFooterText(botCfg.footerText || 'Bot High State');
    setTargetDmCustomNote(botCfg.defaultNote || 'Jangan beritahu informasi ini kepada orang lain!');
    
    setTargetDmOfficerName(officer.name);
    setTargetDmPin(officer.pin || '10-4');
    setTargetDmBadge(officer.badge);
    setTargetDmRank(officer.rank);
    setTargetDmDivision(officer.division || 'Patrol Bureau');
    setTargetDmMessageType('credentials');
    setTargetDmCustomMessage(getSavedSuperiorDmMessage());
    setSuperiorDmPresets(getSavedSuperiorDmPresets());
    setSaveMessageNotice(null);
    setShowAddPresetInput(false);
    setBotDmResultNotice(null);
    setShowAdvancedDmSettings(false);
  };

  // Save current custom message as default
  const handleSaveCurrentMessageAsDefault = () => {
    saveSuperiorDmMessage(targetDmCustomMessage);
    setSaveMessageNotice('✅ Pesan atasan berhasil disimpan sebagai default! Pesan ini akan otomatis dimuat setiap kali membuka PM Discord.');
    setTimeout(() => setSaveMessageNotice(null), 4500);
  };

  // Add current message as a new named preset
  const handleSaveCurrentMessageAsPreset = () => {
    if (!targetDmCustomMessage.trim()) return;
    const title = newPresetTitle.trim() || `Pesan Atasan (${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })})`;
    const newPreset: SuperiorSavedPreset = {
      id: `preset-${Date.now()}`,
      title,
      text: targetDmCustomMessage.trim(),
      createdAt: Date.now()
    };
    const updated = [...superiorDmPresets, newPreset];
    setSuperiorDmPresets(updated);
    saveSuperiorDmPresets(updated);
    setNewPresetTitle('');
    setShowAddPresetInput(false);
    setSaveMessageNotice(`✅ Template "${title}" berhasil ditambahkan ke daftar template pesan atasan!`);
    setTimeout(() => setSaveMessageNotice(null), 4500);
  };

  // Delete a saved preset
  const handleDeletePreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = superiorDmPresets.filter(p => p.id !== id);
    setSuperiorDmPresets(updated);
    saveSuperiorDmPresets(updated);
  };

  // Explicitly Save Target Discord User ID to Officer Account & Storage
  const handleSaveTargetDiscordUserId = () => {
    if (!targetDmOfficer) return;
    const cleanId = targetDmUserId.trim();
    if (!cleanId) {
      setDiscordIdSaveNotice('⚠️ Masukkan Discord User ID terlebih dahulu sebelum menyimpan!');
      setTimeout(() => setDiscordIdSaveNotice(null), 4000);
      return;
    }

    setIsSavingTargetDiscordId(true);
    try {
      const updatedOfficer: OfficerAccount = {
        ...targetDmOfficer,
        discordTag: cleanId,
        _updatedAt: Date.now()
      };

      setTargetDmOfficer(updatedOfficer);
      onUpdateOfficer(updatedOfficer);

      // Centrally update in storage & broadcast to all keys
      const currentRoster = getRosterFromStorage();
      const nextRoster = currentRoster.map(o => 
        (o.id && o.id === updatedOfficer.id) ||
        isOfficerMatch(o, updatedOfficer.badge) ||
        isOfficerMatch(o, updatedOfficer.name)
          ? { ...o, discordTag: cleanId, _updatedAt: Date.now() }
          : o
      );
      saveRosterToStorage(nextRoster);

      setDiscordIdSaveNotice(`✅ DISCORD USER ID (${cleanId}) BERHASIL DISIMPAN ke akun ${targetDmOfficer.name} (${targetDmOfficer.badge})!`);
      setSuccessNotice(`✅ Discord User ID ${targetDmOfficer.name} (${targetDmOfficer.badge}) berhasil diperbarui: ${cleanId}`);
      setTimeout(() => {
        setDiscordIdSaveNotice(null);
        setSuccessNotice('');
      }, 5000);
    } catch (err: any) {
      setDiscordIdSaveNotice(`❌ Gagal menyimpan Discord User ID: ${err?.message || err}`);
      setTimeout(() => setDiscordIdSaveNotice(null), 5000);
    } finally {
      setIsSavingTargetDiscordId(false);
    }
  };

  // Re-hire / Restore Discharged Officer
  const handleRehireOfficer = (entry: DischargedOfficerEntry) => {
    if (!isCurrentOfficerCommand) return;
    if (!window.confirm(`Pulihkan dan pekerjakan kembali ${entry.name} (${entry.badge}) ke jajaran kepolisian?`)) return;

    restoreDischargedOfficer(entry.badge);
    setDischargedList(getDischargedOfficers());

    // Re-register into active roster
    const restoredAccount: OfficerAccount = {
      id: entry.id,
      name: entry.name,
      badge: entry.badge,
      rank: (entry.rank as OfficerRankLevel) || 'POLICE OFFICER I [PO I]',
      division: entry.division || 'Field Training Bureau / Patrol',
      pin: '10-4',
      registeredAt: Date.now(),
      promotedBy: `Dipulihkan / Direkrut Kembali oleh ${currentOfficerName || 'High Command'}`
    };

    if (onRegisterOfficer) {
      onRegisterOfficer(restoredAccount);
    } else {
      onUpdateOfficer(restoredAccount);
    }

    setSuccessNotice(`✅ Berhasil memulihkan ${entry.name} (${entry.badge}) kembali ke jajaran dinas kepolisian.`);
    setTimeout(() => setSuccessNotice(''), 5000);
  };

  // Execute sending Bot Direct Message (PM / DM)
  const handleExecuteSendBotDm = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!targetDmOfficer) return;
    if (!targetDmUserId.trim()) {
      setBotDmResultNotice({
        success: false,
        message: 'Masukkan Discord User ID anggota target (17-20 digit angka)!'
      });
      return;
    }

    // Always auto-persist the entered Discord User ID
    const cleanUserId = targetDmUserId.trim();
    if (cleanUserId && targetDmOfficer.discordTag !== cleanUserId) {
      const updated = { ...targetDmOfficer, discordTag: cleanUserId, _updatedAt: Date.now() };
      setTargetDmOfficer(updated);
      onUpdateOfficer(updated);
      try {
        const currentRoster = getRosterFromStorage();
        const nextRoster = currentRoster.map(o => 
          (o.id && o.id === updated.id) ||
          isOfficerMatch(o, updated.badge) ||
          isOfficerMatch(o, updated.name)
            ? { ...o, discordTag: cleanUserId, _updatedAt: Date.now() }
            : o
        );
        saveRosterToStorage(nextRoster);
      } catch {}
    }

    setIsSendingBotDm(true);
    setBotDmResultNotice(null);
    try {
      const res = await sendOfficerDirectMessageViaBot({
        discordUserId: targetDmUserId.trim(),
        officerName: targetDmOfficerName.trim() || targetDmOfficer.name,
        pin: targetDmMessageType === 'custom_chat' ? undefined : (targetDmPin.trim() || targetDmOfficer.pin || '10-4'),
        badge: targetDmBadge.trim() || targetDmOfficer.badge,
        rank: targetDmRank.trim() || targetDmOfficer.rank,
        division: targetDmDivision.trim() || targetDmOfficer.division,
        note: targetDmCustomNote.trim() || 'Jangan beritahu informasi ini kepada orang lain!',
        botName: targetDmBotName.trim(),
        botAvatar: targetDmLogoUrl.trim(),
        embedTitle: targetDmEmbedTitle.trim(),
        embedDescription: targetDmEmbedDescription.trim(),
        embedColor: targetDmEmbedColor.trim(),
        footerText: targetDmFooterText.trim(),
        customMessage: targetDmCustomMessage.trim(),
        messageType: targetDmMessageType
      });

      setBotDmResultNotice(res);
      if (res.success) {
        setSuccessNotice(
          targetDmMessageType === 'custom_chat'
            ? `✅ Pesan chat khusus dari atasan berhasil dikirim ke Pesan Pribadi (PM/DM) Discord milik ${targetDmOfficer.name}!`
            : `✅ Kredensial akun login (UCP & PIN) & pesan atasan berhasil dikirim ke Pesan Pribadi (PM/DM) Discord milik ${targetDmOfficer.name}!`
        );
        setTimeout(() => setSuccessNotice(''), 6000);
      }
    } catch (err: any) {
      setBotDmResultNotice({
        success: false,
        message: err.message || 'Gagal mengirim PM via Bot Discord'
      });
    } finally {
      setIsSendingBotDm(false);
    }
  };

  return (
    <div className="bg-[#161B22] border border-gray-800 rounded-xl p-4 sm:p-5 shadow-2xl space-y-4">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-800">
        <div className="flex items-center gap-3.5">
          <div className="relative group shrink-0">
            <img
              src={HSPD_LOGO_URL}
              alt="HSPD Official Seal"
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-full object-contain drop-shadow-md border border-amber-500/40 bg-black/60 p-0.5"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-gray-100 uppercase tracking-tight font-mono">
                Manajemen Anggota & Disiplin Personel Kepolisian
              </h2>
              <span className="text-[10px] font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-800/80 px-2 py-0.5 rounded">
                HIGH COMMAND ONLY
              </span>
            </div>
            <p className="text-[11px] text-gray-400 font-mono">
              Status Dinas Tiap Petugas, Promosi Pangkat, PIN Login, Surat Peringatan (Maks 3 SP), & Pemecatan
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="self-end sm:self-center p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Permission Status Banner */}
      {!isCurrentOfficerCommand ? (
        <div className="p-3 bg-amber-950/30 border border-amber-800/50 rounded-lg text-amber-300 text-xs font-mono flex items-center gap-2">
          <Lock className="w-4 h-4 shrink-0 text-amber-400" />
          <span>
            Mode Hanya Lihat (View-Only). Pangkat Anda ({currentOfficerRank || 'Petugas'}) bukan High Command. Hanya <strong>CHIEF OF POLICE [COP], ASSISTANT CHIEF [A/C], DEPUTY CHIEF [D/C], dan COMMANDER [CDR]</strong> yang dapat mengedit data & PIN anggota.
          </span>
        </div>
      ) : (
        <div className="p-3 bg-blue-950/30 border border-blue-800/50 rounded-lg text-blue-300 text-xs font-mono flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
            <span>Otorisasi High Command Terbuka: Anda login sebagai <strong>{currentOfficerRank}</strong>.</span>
          </div>
          <span className="text-[10px] bg-blue-900/60 text-blue-200 px-2 py-0.5 rounded border border-blue-700">
            FULL DISCIPLINARY ACCESS
          </span>
        </div>
      )}

      {/* Success Notification */}
      {successNotice && (
        <div className="p-3 bg-green-950/40 border border-green-800/60 rounded-lg text-green-300 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-green-400" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Command Actions Bar & Passcode Info Banner */}
      <div className="bg-[#0D1117] border border-amber-900/40 rounded-lg p-3 flex flex-col gap-3 text-xs font-mono">
        {/* Realtime Database Connection Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-gray-800/80">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${firebaseStatus.connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-500'}`} />
            <span className="text-gray-300 font-bold">Status Database:</span>
            <span className={firebaseStatus.connected ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
              {firebaseStatus.connected ? '🟢 Cloud Firestore Online (Realtime Sync)' : '🟡 Mode Lokal / Offline'}
            </span>
            <span className="text-gray-500 text-[11px] hidden md:inline">
              | DB ID: <code className="text-gray-400">ai-studio-hspd...</code>
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-gray-400">
            <Activity className="w-3.5 h-3.5 text-blue-400" />
            <span>Total Anggota: <strong className="text-amber-400">{roster.length} Personel</strong></span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* HIGH COMMAND ONLY: ADD OFFICER BUTTON */}
            <button
              id="btn-add-officer-modal"
              type="button"
              onClick={handleOpenAddModal}
              className={`px-3.5 py-2 rounded-lg font-mono font-bold text-xs flex items-center gap-1.5 transition shadow-md ${
                isCurrentOfficerCommand
                  ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
              }`}
              title={
                isCurrentOfficerCommand
                  ? 'Daftarkan & tambahkan personel baru ke database anggota (Akses Penuh High Command)'
                  : 'Hanya jajaran High Command yang dapat mendaftarkan personel baru'
              }
            >
              <UserPlus className="w-4 h-4" />
              <span>+ TAMBAH ANGGOTA BARU</span>
            </button>

            {/* EXPORT ABSEN MINGGUAN (EXCEL / ZIP / CSV / PDF) */}
            <button
              id="btn-open-export-attendance"
              type="button"
              onClick={() => setIsExportAttendanceModalOpen(true)}
              className="px-3 py-2 bg-gradient-to-r from-emerald-950/90 to-teal-950/90 hover:from-emerald-900 hover:to-teal-900 border border-emerald-500/80 hover:border-emerald-400 text-emerald-200 rounded-lg font-mono font-bold text-xs flex items-center gap-1.5 transition shadow-md shadow-emerald-950/30"
              title="Ekspor Rekapitulasi Absensi & Jam Dinas Mingguan Anggota ke Excel (.xlsx), ZIP Archive, CSV, atau Dokumen Cetak"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>📥 EXPORT ABSEN MINGGUAN</span>
            </button>

            {/* SINKRONKAN DATABASE KE CLOUD FIRESTORE */}
            <button
              id="btn-sync-realtime-roster"
              type="button"
              onClick={handleManualSyncDatabase}
              disabled={isSyncingRealtime}
              className="px-3 py-2 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600/70 hover:border-emerald-400 text-emerald-300 rounded-lg font-mono font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
              title="Kirim dan sinkronkan seluruh 56+ data anggota kepolisian & PIN ke Cloud Firestore"
            >
              <RefreshCw className={`w-4 h-4 text-emerald-400 ${isSyncingRealtime ? 'animate-spin' : ''}`} />
              <span>{isSyncingRealtime ? 'MENYINKRONKAN...' : '⚡ SINKRONKAN KE CLOUD'}</span>
            </button>

            {/* TARIK DATA DARI CLOUD FIRESTORE */}
            <button
              id="btn-pull-cloud-roster"
              type="button"
              onClick={handlePullCloudDatabase}
              disabled={isPullingRealtime}
              className="px-3 py-2 bg-blue-950/80 hover:bg-blue-900 border border-blue-600/70 hover:border-blue-400 text-blue-300 rounded-lg font-mono font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
              title="Tarik pembaruan database anggota kepolisian terbaru dari Cloud Firestore"
            >
              <ArrowDownRight className={`w-4 h-4 text-blue-400 ${isPullingRealtime ? 'animate-bounce' : ''}`} />
              <span>{isPullingRealtime ? 'MENARIK...' : '📥 TARIK DARI CLOUD'}</span>
            </button>

            {/* TES KONEKSI DATABASE */}
            <button
              id="btn-test-cloud-connection"
              type="button"
              onClick={handleTestConnection}
              disabled={isTestingConnection}
              className="px-3 py-2 bg-purple-950/70 hover:bg-purple-900 border border-purple-600/70 hover:border-purple-400 text-purple-300 rounded-lg font-mono font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
              title="Uji komunikasi langsung ke database Cloud Firestore"
            >
              <Activity className={`w-4 h-4 text-purple-400 ${isTestingConnection ? 'animate-spin' : ''}`} />
              <span>{isTestingConnection ? 'MENGUJI...' : '🔄 TES KONEKSI'}</span>
            </button>

            {/* HIGH COMMAND: HAPUS SEMUA AKUN NON-ATASAN */}
            {isCurrentOfficerCommand && onPurgeNonAtasanOfficers && (
              <button
                id="btn-purge-non-atasan"
                type="button"
                onClick={() => setShowPurgeNonAtasanModal(true)}
                className="px-3 py-2 bg-rose-950/80 hover:bg-rose-900 border border-rose-600/70 hover:border-rose-400 text-rose-300 rounded-lg font-mono font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
                title="Hapus seluruh akun anggota selain Atasan dari database CAD dan Cloud Firestore"
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span>🗑️ BERSIHKAN NON-ATASAN</span>
              </button>
            )}

            {/* HIGH COMMAND ONLY: PIN RESET AUDIT & WEBHOOK LOG BUTTON */}
            {onOpenPinResetAudit && (
              <button
                id="btn-open-pin-reset-audit"
                type="button"
                onClick={onOpenPinResetAudit}
                className="px-3 py-2 bg-amber-950/70 hover:bg-amber-900 border border-amber-600/70 hover:border-amber-400 text-amber-300 rounded-lg font-mono font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
                title="Audit & Otorisasi Pengajuan Lupa PIN Login via Discord Webhook"
              >
                <KeyRound className="w-4 h-4 text-amber-400" />
                <span>👑 LOG RESET PIN & WEBHOOK</span>
                {typeof pendingPinResetCount === 'number' && pendingPinResetCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-amber-500 text-black text-[10px] rounded-full font-bold animate-pulse">
                    {pendingPinResetCount}
                  </span>
                )}
              </button>
            )}

            {/* HIGH COMMAND ONLY: PENGATURAN WEBHOOK KOMANDO */}
            {isCurrentOfficerCommand && (
              <button
                id="btn-open-roster-webhook-settings"
                type="button"
                onClick={handleOpenWebhookConfigModal}
                className="px-3 py-2 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-600/70 hover:border-indigo-400 text-indigo-300 rounded-lg font-mono font-bold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                title="Pengaturan & Perubahan Webhook di Pengaturan Sistem & Otoritas Komando"
              >
                <Settings className="w-4 h-4 text-indigo-400" />
                <span>👑 PENGATURAN WEBHOOK</span>
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2 text-[11px]">
              <KeyRound className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-gray-400">Passcode Pendaftaran:</span>
              <span className="text-amber-400 font-bold bg-black/60 px-1.5 py-0.5 rounded border border-amber-800/50">
                10-4 / 911
              </span>
            </div>
            <div className="text-[11px] text-gray-400 flex items-center gap-1.5">
              <span className="text-amber-300 font-bold">⚠️ Max 3 SP</span>
              <span>sebelum pemecatan dinas</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama anggota, nomor badge, pangkat, atau divisi..."
            className="w-full pl-9 pr-3 py-2 bg-[#0D1117] border border-gray-700 focus:border-blue-500 rounded-lg text-xs text-gray-100 placeholder:text-gray-600 outline-none font-mono transition"
          />
        </div>

        <div className="flex items-center gap-1 bg-[#0D1117] p-1 border border-gray-800 rounded-lg text-xs font-mono overflow-x-auto">
          <button
            onClick={() => setFilterRank('ALL')}
            className={`px-2.5 py-1 rounded transition whitespace-nowrap ${filterRank === 'ALL' ? 'bg-blue-600 text-white font-bold' : 'text-gray-400 hover:text-gray-200'}`}
          >
            Semua ({roster.length})
          </button>
          <button
            onClick={() => setFilterRank('DUTY')}
            className={`px-2.5 py-1 rounded transition whitespace-nowrap flex items-center gap-1 ${filterRank === 'DUTY' ? 'bg-emerald-600 text-white font-bold' : 'text-emerald-400 hover:text-emerald-200'}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>On Duty ({roster.filter(r => getOfficerDutyState(r.badge, roster).isDuty).length})</span>
          </button>
          <button
            onClick={() => setFilterRank('PATROL')}
            className={`px-2.5 py-1 rounded transition whitespace-nowrap ${filterRank === 'PATROL' ? 'bg-blue-600 text-white font-bold' : 'text-gray-400 hover:text-gray-200'}`}
          >
            Field Patrol ({roster.filter(r => !isOfficerHighRank(r.rank)).length})
          </button>
          <button
            onClick={() => setFilterRank('COMMAND')}
            className={`px-2.5 py-1 rounded transition whitespace-nowrap ${filterRank === 'COMMAND' ? 'bg-amber-600 text-black font-bold' : 'text-gray-400 hover:text-gray-200'}`}
          >
            High Command ({roster.filter(r => isOfficerHighRank(r.rank)).length})
          </button>
          <button
            onClick={() => setFilterRank('WARNED')}
            className={`px-2.5 py-1 rounded transition whitespace-nowrap ${filterRank === 'WARNED' ? 'bg-rose-600 text-white font-bold' : 'text-gray-400 hover:text-gray-200'}`}
          >
            Kena SP ({roster.filter(r => (r.warnings?.length || 0) > 0).length})
          </button>
          <button
            id="btn-filter-discharged"
            onClick={() => setFilterRank('DISCHARGED')}
            className={`px-2.5 py-1 rounded transition whitespace-nowrap flex items-center gap-1 ${filterRank === 'DISCHARGED' ? 'bg-rose-800 text-white font-bold' : 'text-rose-400 hover:text-rose-200'}`}
            title="Lihat arsip personel yang telah dipecat / diberhentikan dari kepolisian"
          >
            <UserX className="w-3.5 h-3.5" />
            <span>Arsip Dipecat ({dischargedList.length})</span>
          </button>
        </div>
      </div>

      {/* Anggota Table / Grid */}
      <div className="border border-gray-800 rounded-lg overflow-hidden bg-[#0D1117]">
        {filterRank === 'DISCHARGED' ? (
          <div className="overflow-x-auto">
            <div className="p-3 bg-rose-950/40 border-b border-rose-900/60 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-rose-300 font-mono text-xs">
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="font-bold">ARSIP PERSONEL KEPOLISIAN YANG DIBERHENTIKAN / DIPECAT</span>
                <span className="text-gray-400 text-[11px] hidden sm:inline">(Akun dinonaktifkan permanen dan tidak akan masuk kembali ke sistem)</span>
              </div>
              <span className="text-xs font-mono text-rose-400 font-bold">{dischargedList.length} Personel Dipecat</span>
            </div>
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#161B22] border-b border-gray-800 text-gray-400 uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Mantan Personel & Lencana</th>
                  <th className="py-2.5 px-3">Pangkat Terakhir</th>
                  <th className="py-2.5 px-3">Divisi Terakhir</th>
                  <th className="py-2.5 px-3">Waktu Pemecatan</th>
                  <th className="py-2.5 px-3">Alasan Pemecatan Dinas</th>
                  <th className="py-2.5 px-3">Diberhentikan Oleh</th>
                  <th className="py-2.5 px-3 text-right">Tindakan High Command</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 text-gray-300">
                {dischargedList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-500 font-mono">
                      Tidak ada personel yang pernah dipecat atau diberhentikan. Seluruh anggota berstatus aktif.
                    </td>
                  </tr>
                ) : (
                  dischargedList
                    .filter(entry => {
                      if (!searchQuery) return true;
                      const q = searchQuery.toLowerCase();
                      return (
                        entry.name.toLowerCase().includes(q) ||
                        entry.badge.toLowerCase().includes(q) ||
                        (entry.rank && entry.rank.toLowerCase().includes(q)) ||
                        (entry.division && entry.division.toLowerCase().includes(q)) ||
                        (entry.reason && entry.reason.toLowerCase().includes(q))
                      );
                    })
                    .map(entry => (
                      <tr key={entry.id || entry.badge} className="hover:bg-rose-950/20 transition">
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded bg-rose-950 text-rose-400 border border-rose-800/80 flex items-center justify-center font-bold text-[10px] shrink-0">
                              <UserX className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <div className="font-bold text-gray-200 line-through decoration-rose-500">{entry.name}</div>
                              <div className="text-[10px] text-rose-400 font-bold">{entry.badge}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-gray-400">
                          {entry.rank || '-'}
                        </td>
                        <td className="py-2.5 px-3 text-gray-400">
                          {entry.division || '-'}
                        </td>
                        <td className="py-2.5 px-3 text-gray-400 whitespace-nowrap">
                          {entry.dischargedAt ? new Date(entry.dischargedAt).toLocaleString('id-ID') : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-rose-300 font-sans max-w-xs truncate" title={entry.reason}>
                          {entry.reason || 'Diberhentikan dari dinas kepolisian'}
                        </td>
                        <td className="py-2.5 px-3 text-gray-400 whitespace-nowrap">
                          {entry.dischargedBy || 'High Command'}
                          {entry.dischargedByBadge && <span className="text-gray-500 ml-1">({entry.dischargedByBadge})</span>}
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          {isCurrentOfficerCommand ? (
                            <button
                              type="button"
                              onClick={() => handleRehireOfficer(entry)}
                              className="px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 border border-emerald-600 text-emerald-300 rounded text-[11px] font-bold transition flex items-center gap-1 ml-auto shadow-xs"
                              title="Pulihkan dan rekrut kembali personel ini ke jajaran dinas kepolisian"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Pulihkan / Re-Hire</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-gray-500">Hanya Command</span>
                          )}
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#161B22] border-b border-gray-800 text-gray-400 uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Petugas & Lencana</th>
                <th className="py-2.5 px-3">Status Dinas</th>
                <th className="py-2.5 px-3">Pangkat / Rank</th>
                <th className="py-2.5 px-3">Divisi Operasional</th>
                <th className="py-2.5 px-3">
                  <div className="flex items-center gap-1.5">
                    <span>PIN Anggota</span>
                    <button
                      type="button"
                      onClick={() => setShowTablePins(!showTablePins)}
                      className="p-0.5 text-gray-400 hover:text-amber-300 rounded transition"
                      title={showTablePins ? "Sembunyikan semua PIN di tabel" : "Tampilkan semua PIN di tabel"}
                    >
                      {showTablePins ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </th>
                <th className="py-2.5 px-3">Status Disiplin (SP)</th>
                <th className="py-2.5 px-3">Riwayat Promosi</th>
                <th className="py-2.5 px-3 text-right">Tindakan High Command</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 text-gray-300">
              {filteredRoster.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500 font-mono">
                    Tidak ada data personel yang cocok dengan pencarian.
                  </td>
                </tr>
              ) : (
                filteredRoster.map((officer) => {
                  const isHigh = isOfficerHighRank(officer.rank);
                  const isSelf = currentOfficerName && officer.name.toLowerCase() === currentOfficerName.toLowerCase();
                  const warningsCount = officer.warnings?.length || 0;
                  const dutyState = getOfficerDutyState(officer.badge, roster);
                  const dutyDuration = formatDutyDuration(dutyState.isDuty, dutyState.dutyStartTime);

                  return (
                    <tr key={officer.id || officer.name} className="hover:bg-gray-800/30 transition">
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded flex items-center justify-center font-bold text-[10px] ${
                            isHigh ? 'bg-amber-950 text-amber-300 border border-amber-700/60' : 'bg-blue-950 text-blue-300 border border-blue-800/60'
                          }`}>
                            <User className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="font-bold text-gray-100 flex items-center gap-1.5 flex-wrap">
                              <span>{officer.name}</span>
                              {isSelf && (
                                <span className="text-[9px] bg-blue-900/60 text-blue-300 px-1.5 py-0.2 rounded border border-blue-700 font-normal">
                                  Anda
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5 flex-wrap">
                              <span>Badge: <strong className="text-gray-300 font-mono">{officer.badge}</strong></span>
                              {officer.discordTag && (
                                <span className="text-indigo-300 font-mono bg-indigo-950/70 border border-indigo-700/60 px-1.5 py-0.2 rounded text-[9px] flex items-center gap-1" title={`Discord: ${officer.discordTag}`}>
                                  <MessageSquare className="w-2.5 h-2.5 text-indigo-400" />
                                  <span>{officer.discordTag}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Live Individual Officer Duty Status Badge */}
                      <td className="py-2.5 px-3">
                        {dutyState.isDuty ? (
                          <div className="inline-flex flex-col gap-0.5">
                            <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-950/80 text-emerald-300 border border-emerald-700 px-2 py-0.5 rounded font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                              <span>{dutyState.dutyStatus || '10-8'} ON DUTY</span>
                            </span>
                            <span className="text-[9px] text-emerald-400/80 font-mono pl-0.5">
                              ⏱️ {dutyDuration.shortStr}
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-rose-950/50 text-rose-300 border border-rose-800/60 px-2 py-0.5 rounded">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            <span>10-7 OFF DUTY</span>
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          isHigh 
                            ? 'bg-amber-950/60 text-amber-300 border-amber-700/60' 
                            : 'bg-blue-950/50 text-blue-300 border-blue-800/60'
                        }`}>
                          {isHigh && '★ '}{officer.rank}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-gray-400">
                        {officer.division}
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <code className="text-amber-300 font-bold bg-black/60 px-1.5 py-0.5 rounded border border-amber-800/40 min-w-[54px] text-center inline-block">
                            {(showTablePins || revealedPins[officer.id || officer.name]) ? (officer.pin || '10-4') : '••••••'}
                          </code>
                          <button
                            type="button"
                            onClick={() => {
                              const key = officer.id || officer.name;
                              setRevealedPins(prev => ({ ...prev, [key]: !prev[key] }));
                            }}
                            className="p-1 text-gray-500 hover:text-amber-300 rounded transition"
                            title={revealedPins[officer.id || officer.name] ? "Sembunyikan PIN" : "Tampilkan PIN"}
                          >
                            {revealedPins[officer.id || officer.name] ? (
                              <EyeOff className="w-3 h-3 text-amber-400" />
                            ) : (
                              <Eye className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Warnings / Strikes Badge */}
                      <td className="py-2.5 px-3">
                        {warningsCount === 0 ? (
                          <button
                            onClick={() => handleStartWarning(officer)}
                            className="inline-flex items-center gap-1 text-[10px] bg-emerald-950/50 text-emerald-300 border border-emerald-800/50 px-2 py-0.5 rounded hover:bg-emerald-900/50 transition cursor-pointer"
                            title="Klik untuk membuka riwayat / beri SP"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            <span>0/3 Bersih</span>
                          </button>
                        ) : warningsCount === 1 ? (
                          <button
                            onClick={() => handleStartWarning(officer)}
                            className="inline-flex items-center gap-1 text-[10px] bg-amber-950/70 text-amber-300 border border-amber-700/70 px-2 py-0.5 rounded font-bold hover:bg-amber-900/60 transition cursor-pointer"
                            title="Klik untuk melihat SP1 atau tambah SP"
                          >
                            <AlertTriangle className="w-3 h-3 text-amber-400" />
                            <span>1/3 (SP1)</span>
                          </button>
                        ) : warningsCount === 2 ? (
                          <button
                            onClick={() => handleStartWarning(officer)}
                            className="inline-flex items-center gap-1 text-[10px] bg-orange-950/80 text-orange-300 border border-orange-600 px-2 py-0.5 rounded font-bold hover:bg-orange-900/60 transition cursor-pointer"
                            title="Klik untuk melihat SP2 atau tambah SP"
                          >
                            <AlertTriangle className="w-3 h-3 text-orange-400" />
                            <span>2/3 (SP2)</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStartWarning(officer)}
                            className="inline-flex items-center gap-1 text-[10px] bg-rose-950 text-rose-300 border border-rose-600 px-2 py-0.5 rounded font-bold animate-pulse hover:bg-rose-900 transition cursor-pointer"
                            title="Batas Maksimal SP tercapai! Rekomendasi Pemecatan"
                          >
                            <AlertOctagon className="w-3 h-3 text-rose-400" />
                            <span>3/3 (SP3 / REKOMENDASI PECAT)</span>
                          </button>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-[10px] text-gray-400 max-w-[180px] truncate">
                        {officer.promotedBy || 'Terdaftar via Terminal Resmi'}
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isCurrentOfficerCommand ? (
                            <>
                              {/* Send PM via Discord Bot Button */}
                              <button
                                onClick={() => handleOpenBotDmModal(officer)}
                                className="px-2 py-1 bg-sky-950/90 hover:bg-sky-800 text-sky-300 hover:text-white border border-sky-700/80 rounded text-[10px] font-bold transition flex items-center gap-1 shadow-sm"
                                title="Kirim kredensial login (UCP & PIN) langsung ke Pesan Pribadi (PM / DM) Discord anggota"
                              >
                                <Bot className="w-3 h-3 text-sky-400" />
                                <span className="hidden sm:inline">PM BOT</span>
                              </button>

                              {/* Send Discord Webhook Credentials Button with Settings */}
                              <div className="flex items-center -space-x-px">
                                <button
                                  type="button"
                                  onClick={() => handleSendDirectCredentials(officer)}
                                  disabled={sendingCredentialsId === (officer.id || officer.name)}
                                  className="px-2 py-1 bg-indigo-950/90 hover:bg-indigo-800 text-indigo-300 hover:text-white border border-indigo-700/80 rounded-l text-[10px] font-bold transition flex items-center gap-1 shadow-sm disabled:opacity-50 cursor-pointer"
                                  title="Kirim/Broadcast kredensial akun login (UCP, Badge, & PIN) ke Saluran Webhook Discord"
                                >
                                  {sendingCredentialsId === (officer.id || officer.name) ? (
                                    <RefreshCw className="w-3 h-3 animate-spin text-indigo-300" />
                                  ) : (
                                    <Send className="w-3 h-3 text-indigo-400" />
                                  )}
                                  <span className="hidden lg:inline">WEBHOOK</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={handleOpenWebhookConfigModal}
                                  className="px-1.5 py-1 bg-indigo-900/90 hover:bg-indigo-700 text-indigo-300 hover:text-white border border-indigo-700/80 rounded-r text-[10px] font-bold transition flex items-center justify-center shadow-sm cursor-pointer group"
                                  title="Ubah Webhook di Pengaturan Sistem & Otoritas Komando"
                                >
                                  <Settings className="w-3 h-3 text-indigo-300 group-hover:rotate-90 transition-transform duration-300" />
                                </button>
                              </div>

                              {/* Warning Button */}
                              <button
                                onClick={() => handleStartWarning(officer)}
                                className={`px-2 py-1 rounded text-[10px] font-bold transition flex items-center gap-1 shadow-sm ${
                                  warningsCount >= 3
                                    ? 'bg-rose-950 text-rose-300 border border-rose-700 hover:bg-rose-900'
                                    : warningsCount > 0
                                    ? 'bg-amber-950 text-amber-300 border border-amber-700 hover:bg-amber-900'
                                    : 'bg-gray-800 text-gray-300 hover:bg-amber-950 hover:text-amber-300 border border-gray-700'
                                }`}
                                title="Beri Surat Peringatan (Maks 3 SP)"
                              >
                                <AlertTriangle className="w-3 h-3" />
                                <span className="hidden sm:inline">SP ({warningsCount}/3)</span>
                              </button>

                              {/* Edit Button */}
                              <button
                                onClick={() => handleStartEdit(officer)}
                                className="px-2 py-1 bg-blue-600/90 hover:bg-blue-500 text-white rounded text-[10px] font-bold transition flex items-center gap-1 shadow-sm"
                                title="Edit Pangkat & PIN Anggota"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span className="hidden sm:inline">EDIT</span>
                              </button>

                              {/* Discharge / Delete Button */}
                              {onDeleteOfficer && (
                                <button
                                  onClick={() => handleStartDelete(officer)}
                                  disabled={!!isSelf}
                                  className={`px-2 py-1 rounded text-[10px] font-bold transition flex items-center gap-1 shadow-sm ${
                                    isSelf 
                                      ? 'bg-gray-800 text-gray-600 cursor-not-allowed border border-gray-700' 
                                      : 'bg-rose-950/80 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-800 hover:border-rose-500'
                                  }`}
                                  title={isSelf ? 'Anda tidak bisa memecat diri sendiri saat sedang aktif' : 'Pecat / Hapus Anggota dari Kepolisian'}
                                >
                                  <UserX className="w-3 h-3" />
                                  <span className="hidden sm:inline">PECAT</span>
                                </button>
                              )}
                            </>
                          ) : (
                            <span className="text-[10px] text-gray-600 italic">
                              Hanya Command
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {/* DISCIPLINARY / WARNING (SP) MODAL */}
      {warningOfficer && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150 font-mono text-xs">
          <div className="bg-[#161B22] border border-amber-700/80 rounded-xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header Modal */}
            <div className="bg-[#0F1319] border-b border-gray-800 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-600 rounded-lg flex items-center justify-center font-bold text-black shadow-lg shadow-amber-600/30 shrink-0">
                  <AlertTriangle className="w-5 h-5 text-black" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm sm:text-base text-gray-100">
                      Surat Peringatan & Disiplin Personel (SP)
                    </h3>
                    <span className="text-[9px] bg-amber-950 text-amber-300 border border-amber-800 px-1.5 py-0.5 rounded font-bold">
                      MAKS 3 STRIKE
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    {warningOfficer.name} (Badge: {warningOfficer.badge}) • {warningOfficer.rank}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setWarningOfficer(null)}
                className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {warningModalNotice && (
                <div className="p-3 bg-blue-950/80 border border-blue-700 rounded-lg text-blue-200 text-xs flex items-center gap-2 font-bold animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>{warningModalNotice}</span>
                </div>
              )}

              {/* Strikes Counter Meter */}
              <div className="p-3.5 bg-[#0D1117] border border-gray-800 rounded-lg space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400 font-bold uppercase">Akumulasi Strike Saat Ini:</span>
                  <span className={`font-bold px-2 py-0.5 rounded text-xs border ${
                    (warningOfficer.warnings?.length || 0) === 0
                      ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                      : (warningOfficer.warnings?.length || 0) === 1
                      ? 'bg-amber-950/80 text-amber-300 border-amber-700'
                      : (warningOfficer.warnings?.length || 0) === 2
                      ? 'bg-orange-950/80 text-orange-300 border-orange-600'
                      : 'bg-rose-950 text-rose-300 border-rose-600 animate-pulse'
                  }`}>
                    {(warningOfficer.warnings?.length || 0)} / 3 STRIKE
                  </span>
                </div>

                {/* Visual meter blocks */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {[1, 2, 3].map((step) => {
                    const isIssued = (warningOfficer.warnings?.length || 0) >= step;
                    return (
                      <div
                        key={step}
                        className={`p-2.5 rounded-lg border text-center transition ${
                          isIssued
                            ? step === 1
                              ? 'bg-amber-950/70 border-amber-600 text-amber-300'
                              : step === 2
                              ? 'bg-orange-950/70 border-orange-600 text-orange-300'
                              : 'bg-rose-950 border-rose-500 text-rose-300 font-bold'
                            : 'bg-gray-900/40 border-gray-800 text-gray-600'
                        }`}
                      >
                        <div className="text-[10px] font-bold">SP {step}</div>
                        <div className="text-[9px] mt-0.5">
                          {isIssued ? '⚠️ TERBIT' : '⚪ Kosong'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Section 1: Active Warnings History */}
              <div className="space-y-2">
                <div className="text-[11px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <span>Daftar Riwayat Surat Peringatan Personel ({warningOfficer.warnings?.length || 0})</span>
                </div>

                {(!warningOfficer.warnings || warningOfficer.warnings.length === 0) ? (
                  <div className="p-4 bg-[#0D1117] border border-gray-800 rounded-lg text-center text-gray-500 text-xs">
                    Personel ini memiliki rekam jejak bersih (Belum pernah menerima SP).
                  </div>
                ) : (
                  <div className="space-y-2">
                    {warningOfficer.warnings.map((warn, idx) => (
                      <div 
                        key={warn.id || idx}
                        className="p-3 bg-[#0D1117] border border-gray-800 rounded-lg space-y-2 relative group hover:border-gray-700 transition"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              warn.strikeNumber === 1
                                ? 'bg-amber-950 text-amber-300 border-amber-700'
                                : warn.strikeNumber === 2
                                ? 'bg-orange-950 text-orange-300 border-orange-600'
                                : 'bg-rose-950 text-rose-300 border-rose-600'
                            }`}>
                              STRIKE {warn.strikeNumber} (SP{warn.strikeNumber})
                            </span>
                            <span className="text-[10px] text-gray-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(warn.timestamp || Date.now()).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                            </span>
                          </div>

                          {/* Revoke / Pardon button */}
                          <button
                            type="button"
                            onClick={() => handleRevokeWarning(warn.id)}
                            className="text-[10px] text-gray-500 hover:text-rose-400 bg-gray-900 hover:bg-rose-950/60 px-2 py-0.5 rounded border border-gray-800 hover:border-rose-700 transition flex items-center gap-1"
                            title="Cabut Surat Peringatan ini (Pardon)"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Cabut SP</span>
                          </button>
                        </div>

                        <div className="text-gray-200 text-xs bg-black/40 p-2 rounded border border-gray-800/80">
                          {warn.reason}
                        </div>

                        <div className="text-[10px] text-gray-500 flex items-center justify-between">
                          <span>Diterbitkan oleh: <strong className="text-gray-400">{warn.issuedBy} ({warn.issuedByRank})</strong></span>
                          <span>Badge Atasan: <strong className="text-gray-400">{warn.issuedByBadge}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 2: Issue New Warning Form (if < 3 strikes) */}
              {(warningOfficer.warnings?.length || 0) < 3 ? (
                <form onSubmit={handleIssueWarning} className="p-3.5 bg-amber-950/20 border border-amber-800/60 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] uppercase font-bold text-amber-300 flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5" />
                      <span>Terbitkan Surat Peringatan Ke-{(warningOfficer.warnings?.length || 0) + 1} (SP{(warningOfficer.warnings?.length || 0) + 1})</span>
                    </div>
                    <span className="text-[10px] bg-amber-900/60 text-amber-200 border border-amber-700 px-1.5 py-0.5 rounded">
                      Strike {(warningOfficer.warnings?.length || 0) + 1} dari 3
                    </span>
                  </div>

                  {/* Preset Dropdown */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-300 uppercase block">
                      Klasifikasi Pelanggaran:
                    </label>
                    <select
                      value={warningPresetReason}
                      onChange={(e) => setWarningPresetReason(e.target.value)}
                      className="w-full px-3 py-1.5 bg-[#0D1117] border border-gray-700 focus:border-amber-500 rounded text-xs text-gray-100 outline-none"
                    >
                      {PRESET_WARNING_REASONS.map((reason) => (
                        <option key={reason} value={reason}>{reason}</option>
                      ))}
                    </select>
                  </div>

                  {/* Detail Description */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-300 uppercase block">
                      Keterangan & Kronologi Pelanggaran:
                    </label>
                    <textarea
                      rows={2}
                      value={warningDetailReason}
                      onChange={(e) => setWarningDetailReason(e.target.value)}
                      placeholder="Contoh: Tidak merespon panggilan radio 10-20 saat situasi darurat bank robbery, mengabaikan komando supervisor..."
                      className="w-full px-3 py-1.5 bg-[#0D1117] border border-gray-700 focus:border-amber-500 rounded text-xs text-gray-100 placeholder:text-gray-600 outline-none resize-none"
                    />
                  </div>

                  {/* Webhook Option */}
                  <div className="flex items-center justify-between p-2 bg-[#0D1117] border border-gray-800 rounded">
                    <div className="flex items-center gap-2">
                      <Send className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-[11px] text-gray-300">Kirim Notifikasi SP ke Discord Webhook</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={warningSendWebhook}
                      onChange={(e) => setWarningSendWebhook(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-700 text-amber-600 focus:ring-0 cursor-pointer"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingWarning}
                    className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-black font-bold rounded text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-amber-600/30 disabled:opacity-50"
                  >
                    {isSubmittingWarning ? (
                      <span>Memproses Surat Peringatan...</span>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4" />
                        <span>TERBITKAN SP {(warningOfficer.warnings?.length || 0) + 1} / 3 SEKARANG</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* MAX STRIKES REACHED ALERT */
                <div className="p-4 bg-rose-950/60 border border-rose-700 rounded-lg space-y-3 text-rose-200">
                  <div className="flex items-center gap-2 font-bold text-sm text-rose-300">
                    <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0" />
                    <span>BATAS MAKSIMAL 3 STRIKE TERCAPAI (SP3)</span>
                  </div>
                  <p className="text-xs text-rose-300/90 leading-relaxed">
                    Personel ini telah menerima akumulasi 3 Surat Peringatan. Berdasarkan regulasi kedisiplinan kepolisian, personel ini direkomendasikan untuk segera <strong>diberhentikan dari dinas kepolisian (dipecat)</strong>.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const officerToDischarge = warningOfficer;
                      setWarningOfficer(null);
                      handleStartDelete(officerToDischarge);
                    }}
                    className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-rose-600/40"
                  >
                    <UserX className="w-4 h-4" />
                    <span>LANGSUNG PROSES PEMECATAN SEKARANG</span>
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-[#0D1117] border-t border-gray-800 p-4 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setWarningOfficer(null)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded font-bold transition text-xs"
              >
                Tutup Jendela SP
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DISCHARGE / PECAT ANGGOTA CONFIRMATION MODAL */}
      {deletingOfficer && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#161B22] border border-rose-800/80 rounded-xl max-w-lg w-full p-5 shadow-2xl space-y-4 font-mono text-xs">
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-rose-950 border border-rose-600 rounded-lg flex items-center justify-center text-rose-400 shadow-md shadow-rose-950/40">
                  <UserX className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-100 flex items-center gap-2">
                    <span>Surat Keputusan Pemecatan Personel</span>
                  </h3>
                  <p className="text-[11px] text-rose-400">
                    Pemberhentian dinas & pencabutan hak akses sistem kepolisian secara permanen.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDeletingOfficer(null)}
                className="p-1 text-gray-400 hover:text-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Officer Information Card */}
            <div className="p-3.5 bg-[#0D1117] border border-rose-900/50 rounded-lg space-y-2">
              <div className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Identitas Personel yang Diberhentikan:</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-500 block text-[10px]">Nama Petugas:</span>
                  <span className="font-bold text-gray-100">{deletingOfficer.name}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px]">Nomor Lencana / Badge:</span>
                  <span className="font-bold text-gray-200">{deletingOfficer.badge}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px]">Pangkat Terakhir:</span>
                  <span className="font-bold text-amber-300">{deletingOfficer.rank}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px]">Akumulasi SP:</span>
                  <span className="font-bold text-rose-400">
                    {deletingOfficer.warnings?.length || 0} / 3 Strikes
                  </span>
                </div>
              </div>
            </div>

            {/* Reason Selection / Input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-300 uppercase block">
                Alasan Pemecatan / Pemberhentian Dinas:
              </label>
              <select
                value={deletePresetReason}
                onChange={(e) => setDeletePresetReason(e.target.value)}
                className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 focus:border-rose-500 rounded text-xs text-gray-100 outline-none mb-1.5"
              >
                {PRESET_DISCHARGE_REASONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <textarea
                rows={2}
                value={deleteDetailReason}
                onChange={(e) => setDeleteDetailReason(e.target.value)}
                placeholder="Tuliskan keterangan detail / keputusan High Command..."
                className="w-full px-3 py-1.5 bg-[#0D1117] border border-gray-700 focus:border-rose-500 rounded text-xs text-rose-200 outline-none resize-none"
              />
            </div>

            {/* Discord Webhook Toggle */}
            <div className="flex items-center justify-between p-2.5 bg-[#0D1117] border border-gray-800 rounded">
              <div className="flex items-center gap-2">
                <Send className="w-3.5 h-3.5 text-rose-400" />
                <div>
                  <div className="text-[11px] text-gray-200 font-bold">Kirim Surat Pemecatan ke Discord Webhook</div>
                  <div className="text-[10px] text-gray-500">Kirim embed pengumuman resmi pemberhentian personel ke Discord</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={deleteSendWebhook}
                onChange={(e) => setDeleteSendWebhook(e.target.checked)}
                className="w-4 h-4 rounded border-gray-700 text-rose-600 focus:ring-0 cursor-pointer"
              />
            </div>

            {/* Warning Box */}
            <div className="p-3 bg-rose-950/40 border border-rose-800/80 rounded-lg text-rose-300 text-[11px] flex items-start gap-2">
              <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong>Peringatan Tegas High Command:</strong> Akun ini akan segera dihapus dari daftar roster kepolisian. Yang bersangkutan tidak akan dapat login lagi menggunakan PIN sebelumnya ke dalam sistem CAD HSPD.
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-800">
              <button
                type="button"
                onClick={() => setDeletingOfficer(null)}
                disabled={isSubmittingDelete}
                className="px-3.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-xs transition"
              >
                Batalkan
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isSubmittingDelete}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded text-xs transition flex items-center gap-1.5 shadow-lg shadow-rose-600/30 disabled:opacity-50"
              >
                {isSubmittingDelete ? (
                  <span>Memproses Pemecatan...</span>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>KONFIRMASI PECAT & HAPUS DARI ROSTER</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT RANK / PROMOTION MODAL */}
      {editingOfficer && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-[#161B22] border border-amber-700/60 rounded-xl max-w-lg w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-amber-950 border border-amber-600 rounded-lg flex items-center justify-center text-amber-400">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-100">
                    Edit Pangkat & Pengaturan PIN Petugas
                  </h3>
                  <p className="text-[11px] text-gray-400 font-mono">
                    {editingOfficer.name} ({editingOfficer.badge})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingOfficer(null)}
                className="p-1 text-gray-400 hover:text-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRankUpdate} className="space-y-4 font-mono text-xs">
              <div className="p-3 bg-blue-950/20 border border-blue-900/40 rounded-lg text-[11px] text-gray-300">
                <div className="font-bold text-blue-400 mb-1">OTORISASI HIGH COMMAND AKTIF:</div>
                Hanya rank <strong>CHIEF OF POLICE [COP]</strong>, <strong>ASSISTANT CHIEF [A/C]</strong>, <strong>DEPUTY CHIEF [D/C]</strong>, dan <strong>COMMANDER [CDR]</strong> yang memiliki akses penuh untuk promosi, demosi, mutasi divisi, serta mengatur PIN login personal anggota.
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-300 uppercase block mb-1.5">
                  Pangkat / Rank Baru:
                </label>
                <select
                  value={newRank}
                  onChange={(e) => setNewRank(e.target.value as OfficerRankLevel)}
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 focus:border-amber-500 rounded text-xs text-gray-100 outline-none"
                >
                  <optgroup label="👑 HIGH COMMAND (AKSES PENUH)">
                    <option value="CHIEF OF POLICE [COP]">★ CHIEF OF POLICE [COP] (Akses Penuh)</option>
                    <option value="ASSISTANT CHIEF [A/C]">★ ASSISTANT CHIEF [A/C] (Akses Penuh)</option>
                    <option value="DEPUTY CHIEF [D/C]">★ DEPUTY CHIEF [D/C] (Akses Penuh)</option>
                    <option value="COMMANDER [CDR]">★ COMMANDER [CDR] (Akses Penuh)</option>
                  </optgroup>
                  <optgroup label="👮 SUPERVISORY & FIELD PATROL RANKS">
                    <option value="CAPTAIN [CPT]">CAPTAIN [CPT]</option>
                    <option value="LIEUTENANT [LT]">LIEUTENANT [LT]</option>
                    <option value="SERGEANT [SGT]">SERGEANT [SGT]</option>
                    <option value="SENIOR LEAD OFFICER [SLO]">SENIOR LEAD OFFICER [SLO]</option>
                    <option value="POLICE OFFICER III [PO III]">POLICE OFFICER III [PO III]</option>
                    <option value="POLICE OFFICER II [PO II]">POLICE OFFICER II [PO II]</option>
                    <option value="POLICE OFFICER I [PO I]">POLICE OFFICER I [PO I]</option>
                    <option value="CADET [CDT]">CADET [CDT]</option>
                  </optgroup>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-gray-300 uppercase block mb-1.5">
                    Divisi / Unit Penugasan:
                  </label>
                  <select
                    value={newDivision}
                    onChange={(e) => setNewDivision(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 focus:border-amber-500 rounded text-xs text-gray-100 outline-none"
                  >
                    <option value="Patrol Division">Patrol Division (General Patrol)</option>
                    <option value="Traffic Enforcement Division">Traffic Enforcement Division (TED)</option>
                    <option value="Detective Bureau / CID">Detective Bureau / Investigation (CID)</option>
                    <option value="Special Enforcement Bureau (SEB/SWAT)">Special Enforcement Bureau (SEB / SWAT)</option>
                    <option value="Air Support Division (ASD)">Air Support Division (ASD)</option>
                    <option value="High Command Staff">High Command Staff (HQ)</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-bold text-amber-300 uppercase flex items-center gap-1">
                      <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                      <span>PIN Anggota (Diberikan Atasan):</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowEditPin(!showEditPin)}
                      className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-bold bg-amber-950/70 hover:bg-amber-900/70 px-1.5 py-0.5 rounded border border-amber-800/60 transition"
                      title={showEditPin ? "Sembunyikan PIN" : "Tampilkan PIN"}
                    >
                      {showEditPin ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{showEditPin ? 'Hide' : 'Show'}</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showEditPin ? 'text' : 'password'}
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value)}
                      placeholder="Contoh: 8462100 / 30210"
                      className="w-full px-3 py-2 pr-9 bg-[#0D1117] border border-amber-700/60 focus:border-amber-500 rounded text-xs text-amber-200 outline-none font-mono font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => setShowEditPin(!showEditPin)}
                      className="absolute right-2.5 top-2.5 text-gray-400 hover:text-amber-300 transition"
                      title={showEditPin ? "Sembunyikan PIN" : "Tampilkan PIN"}
                    >
                      {showEditPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Discord Tag & No. Telepon / Radio */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-indigo-950/20 border border-indigo-900/50 rounded-lg">
                <div>
                  <label className="text-[11px] font-bold text-indigo-300 uppercase flex items-center gap-1 mb-1">
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Akun / Tag Discord Petugas:</span>
                  </label>
                  <input
                    type="text"
                    value={editDiscordTag}
                    onChange={(e) => setEditDiscordTag(e.target.value)}
                    placeholder="Contoh: @nexia / 842019283719001"
                    className="w-full px-3 py-2 bg-[#0D1117] border border-indigo-700/60 focus:border-indigo-400 rounded text-xs text-indigo-200 outline-none font-mono"
                  />
                  <span className="text-[9px] text-gray-400 mt-0.5 block">
                    Digunakan untuk mention & bot pengirim akun login
                  </span>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-300 uppercase flex items-center gap-1 mb-1">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    <span>No. Kontak / Radio (Opsional):</span>
                  </label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="Contoh: 555-0199 / Freq 1111"
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 focus:border-amber-500 rounded text-xs text-gray-200 outline-none font-mono"
                  />
                  <div className="mt-2 flex flex-wrap items-center justify-end gap-1.5">
                    {/* Bot PM Direct Message Button */}
                    <button
                      type="button"
                      onClick={() => {
                        if (!editingOfficer) return;
                        handleOpenBotDmModal({
                          ...editingOfficer,
                          rank: newRank,
                          division: newDivision || editingOfficer.division,
                          pin: newPin.trim() || editingOfficer.pin,
                          discordTag: editDiscordTag.trim() || editingOfficer.discordTag
                        });
                      }}
                      className="text-[10px] bg-sky-900/80 hover:bg-sky-700 text-sky-200 px-2 py-1 rounded border border-sky-600 transition flex items-center gap-1 font-bold cursor-pointer"
                      title="Kirim kredensial login (UCP & PIN) langsung ke Pesan Pribadi (PM / DM) Discord anggota ini"
                    >
                      <Bot className="w-3 h-3 text-sky-400" />
                      <span>Kirim PM Bot (DM)</span>
                    </button>

                    {/* Webhook Broadcast Button Group with Settings */}
                    <div className="flex items-center -space-x-px">
                      <button
                        type="button"
                        onClick={async () => {
                          if (!editingOfficer) return;
                          setIsSendingCredentials(true);
                          try {
                            const res = await sendOfficerLoginCredentialsToDiscord({
                              officerName: editingOfficer.name,
                              officerBadge: editingOfficer.badge,
                              officerRank: newRank,
                              officerDivision: newDivision || editingOfficer.division,
                              pin: newPin.trim() || editingOfficer.pin || '10-4',
                              discordTag: editDiscordTag.trim() || undefined,
                              sentBy: currentOfficerName || 'High Command',
                              sentByBadge: currentOfficerBadge || '#001',
                              sentByRank: currentOfficerRank || 'HIGH COMMAND'
                            });
                            if (res.success) {
                              setSuccessNotice(`✅ Kredensial login ${editingOfficer.name} berhasil dikirim ke Saluran Webhook Discord!`);
                            } else {
                              alert(res.message);
                            }
                            setTimeout(() => setSuccessNotice(''), 5000);
                          } catch (e: any) {
                            alert(`Gagal mengirim kredensial: ${e.message}`);
                          } finally {
                            setIsSendingCredentials(false);
                          }
                        }}
                        disabled={isSendingCredentials}
                        className="text-[10px] bg-indigo-900/80 hover:bg-indigo-700 text-indigo-200 px-2 py-1 rounded-l border border-indigo-600 transition flex items-center gap-1 font-bold disabled:opacity-50 cursor-pointer"
                        title="Kirim detail akun login (UCP & PIN) ke Saluran Webhook Discord"
                      >
                        {isSendingCredentials ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3 text-indigo-300" />}
                        <span>Kirim ke Webhook</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleOpenWebhookConfigModal}
                        className="p-1 bg-indigo-800/90 hover:bg-indigo-600 text-indigo-200 hover:text-white border-y border-r border-indigo-600 rounded-r text-[10px] font-bold transition flex items-center justify-center shadow-sm cursor-pointer group"
                        title="Ubah Webhook di Pengaturan Sistem & Otoritas Komando"
                      >
                        <Settings className="w-3 h-3 text-indigo-300 group-hover:rotate-90 transition-transform duration-300" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* PROMOTION / RANK CHANGE REASON & WEBHOOK DISPATCH SECTION */}
              {newRank !== editingOfficer.rank ? (
                <div className="p-3.5 bg-amber-950/40 border border-amber-600/70 rounded-lg space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-amber-800/60">
                    <div className="font-bold text-amber-300 flex items-center gap-1.5 text-xs">
                      <Award className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>PERUBAHAN PANGKAT / PROMOSI JABATAN</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-mono bg-black/40 px-2 py-0.5 rounded border border-amber-900/60">
                      <span className="text-gray-400">{editingOfficer.rank}</span>
                      <span className="text-amber-400 font-bold">➔</span>
                      <span className="text-amber-300 font-bold">{newRank}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-300 uppercase block mb-1">
                      Dasar / Alasan Kenaikan Pangkat (SK Kepolisian):
                    </label>
                    <select
                      value={promotionPresetReason}
                      onChange={(e) => setPromotionPresetReason(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-[#0D1117] border border-gray-700 focus:border-amber-500 rounded text-[11px] text-gray-200 outline-none mb-1.5"
                    >
                      {PRESET_PROMOTION_REASONS.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>

                    <input
                      type="text"
                      value={promotionDetailReason}
                      onChange={(e) => setPromotionDetailReason(e.target.value)}
                      placeholder="Catatan tambahan promosi (opsional / nomor SK khusus)..."
                      className="w-full px-2.5 py-1.5 bg-[#0D1117] border border-gray-700 focus:border-amber-500 rounded text-[11px] text-gray-200 outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-[11px] text-amber-200">
                      <input
                        type="checkbox"
                        checked={promotionSendWebhook}
                        onChange={(e) => setPromotionSendWebhook(e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-gray-700 text-amber-600 focus:ring-0 cursor-pointer"
                      />
                      <span>Kirim Pengumuman Kenaikan Pangkat Resmi ke Webhook Discord</span>
                    </label>
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-950 px-1.5 py-0.5 rounded border border-amber-700">
                      📢 SK DISCORD
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 bg-gray-900/60 border border-gray-800 rounded-lg text-[11px] text-gray-400 flex items-center justify-between">
                  <span>Pangkat saat ini tidak berubah ({editingOfficer.rank}).</span>
                  <span className="text-[10px] text-gray-500">Hanya update Divisi/PIN</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setEditingOfficer(null)}
                  disabled={isSubmittingRankUpdate}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-xs transition disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRankUpdate}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-black font-bold rounded text-xs transition flex items-center gap-1.5 shadow-md shadow-amber-600/30 disabled:opacity-50"
                >
                  {isSubmittingRankUpdate ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan & Mengirim Webhook...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>SIMPAN PERUBAHAN PANGKAT & PIN</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL TAMBAH ANGGOTA BARU (HIGH COMMAND FULL ACCESS) ================= */}
      {isAddOfficerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs font-mono text-xs animate-in fade-in duration-150">
          <div className="bg-[#161B22] border border-amber-500/80 rounded-xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="bg-[#0F1319] border-b border-gray-800 px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-amber-950/80 border border-amber-600 rounded-lg text-amber-300">
                  <UserPlus className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-100 uppercase tracking-tight flex items-center gap-2 font-sans">
                    <span>TAMBAH ANGGOTA BARU</span>
                    <span className="text-[9px] font-mono bg-amber-950 text-amber-300 border border-amber-700 px-1.5 py-0.2 rounded font-bold">
                      HIGH COMMAND
                    </span>
                  </h3>
                  <p className="text-[11px] text-gray-400 font-mono">
                    Registrasi personel baru ke Data Anggota & Broadcast Webhook Discord
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddOfficerModalOpen(false)}
                className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Success Notification inside Modal (Consecutive Addition) */}
            {addOfficerSuccessMsg && (
              <div className="bg-emerald-950/90 border-b border-emerald-500 px-4 py-2.5 text-emerald-200 text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{addOfficerSuccessMsg}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAddOfficerSuccessMsg('')}
                  className="text-emerald-400 hover:text-emerald-200 text-[10px] underline"
                >
                  Tutup
                </button>
              </div>
            )}

            {/* Error Notification */}
            {addFormError && (
              <div className="bg-rose-950/90 border-b border-rose-600 px-4 py-2 text-rose-200 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{addFormError}</span>
              </div>
            )}

            {/* Modal Form Body */}
            <form onSubmit={(e) => handleSaveNewOfficer(e, false)} className="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1">
              {/* Nama & Badge Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-7 space-y-1">
                  <label className="text-[10px] font-bold text-gray-300 uppercase block">
                    Nama Lengkap Petugas <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    placeholder="Contoh: Marcus Vance"
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 focus:border-amber-500 rounded-lg text-xs text-gray-100 outline-none font-mono font-bold"
                    required
                    autoFocus
                  />
                </div>

                <div className="sm:col-span-5 space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-gray-300 uppercase block">
                      No. Badge <span className="text-rose-400">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleResetToAutoBadge}
                      title="Klik untuk kalkulasi ulang badge otomatis berurutan"
                      className="text-[9px] text-amber-400 hover:text-amber-300 flex items-center gap-0.5"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                      <span>Auto-Next</span>
                    </button>
                  </div>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={addBadge}
                      onChange={(e) => {
                        setAddBadge(e.target.value);
                        setIsManualBadge(true);
                      }}
                      placeholder="#030"
                      className="w-full px-3 py-2 bg-[#0D1117] border border-amber-500/70 focus:border-amber-400 rounded-lg text-xs text-amber-300 outline-none font-mono font-bold"
                      required
                    />
                  </div>
                  <span className="text-[9px] text-emerald-400/90 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>Otomatis berurutan dari badge terakhir</span>
                  </span>
                </div>
              </div>

              {/* Pangkat / Rank */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-300 uppercase flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span>Pangkat Dilantik <span className="text-rose-400">*</span></span>
                </label>
                <select
                  value={addRank}
                  onChange={(e) => handleRankChange(e.target.value as OfficerRankLevel)}
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 focus:border-amber-500 rounded-lg text-xs text-gray-100 outline-none font-mono"
                  required
                >
                  {ALL_RANKS.map((r) => (
                    <option key={r} value={r}>
                      {isOfficerHighRank(r) ? `★ ${r} [HIGH COMMAND]` : r}
                    </option>
                  ))}
                </select>
              </div>

              {/* Divisi Penugasan */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-300 uppercase flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-blue-400" />
                  <span>Divisi Penugasan Kepolisian</span>
                </label>
                <select
                  value={addDivision}
                  onChange={(e) => setAddDivision(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 focus:border-amber-500 rounded-lg text-xs text-gray-100 outline-none font-mono"
                >
                  {PRESET_DIVISIONS.map((div) => (
                    <option key={div} value={div}>{div}</option>
                  ))}
                  <option value="CUSTOM">+ Divisi Kustom (Input Manual)...</option>
                </select>

                {addDivision === 'CUSTOM' && (
                  <input
                    type="text"
                    value={addCustomDivision}
                    onChange={(e) => setAddCustomDivision(e.target.value)}
                    placeholder="Tuliskan nama divisi kustom..."
                    className="w-full mt-1.5 px-3 py-1.5 bg-[#0D1117] border border-amber-600 focus:border-amber-400 rounded-lg text-xs text-gray-100 outline-none font-mono"
                    required
                  />
                )}
              </div>

              {/* PIN Login Awal */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-amber-300 uppercase flex items-center gap-1">
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    <span>PIN Login Terminal MDT Petugas <span className="text-rose-400">*</span></span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddPin(!showAddPin)}
                    className="text-[10px] text-amber-400 hover:underline flex items-center gap-0.5"
                  >
                    {showAddPin ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showAddPin ? 'Hide' : 'Show'}</span>
                  </button>
                </div>
                <input
                  type={showAddPin ? 'text' : 'password'}
                  value={addPin}
                  onChange={(e) => setAddPin(e.target.value)}
                  placeholder="10-4"
                  className="w-full px-3 py-2 bg-[#0D1117] border border-amber-600/70 focus:border-amber-400 rounded-lg text-xs text-amber-200 outline-none font-mono font-bold"
                  required
                />
                <span className="text-[9px] text-gray-400 block">
                  Default awal: <strong>10-4</strong> (dapat diubah nanti oleh petugas/High Command)
                </span>
              </div>

              {/* Tag Discord & No. Telepon / Radio */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-3 bg-indigo-950/20 border border-indigo-900/60 rounded-lg">
                <div className="sm:col-span-6 space-y-1">
                  <label className="text-[10px] font-bold text-indigo-300 uppercase flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Nama / Discord User ID (Untuk PM Langsung)</span>
                  </label>
                  <input
                    type="text"
                    value={addDiscordTag}
                    onChange={(e) => setAddDiscordTag(e.target.value)}
                    placeholder="Contoh: 842019283719001 / @nexia"
                    className="w-full px-3 py-2 bg-[#0D1117] border border-indigo-700/60 focus:border-indigo-400 rounded-lg text-xs text-indigo-200 placeholder:text-gray-600 outline-none font-mono"
                  />
                  <span className="text-[9px] text-indigo-400/80 block">
                    Gunakan <strong>User ID angka</strong> (Copy ID) agar bot dapat langsung mengirim PM
                  </span>
                </div>

                <div className="sm:col-span-6 space-y-1">
                  <label className="text-[10px] font-bold text-gray-300 uppercase flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    <span>No. Kontak / Radio (Opsional)</span>
                  </label>
                  <input
                    type="text"
                    value={addPhone}
                    onChange={(e) => setAddPhone(e.target.value)}
                    placeholder="Contoh: 555-0199 / Freq 1111"
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 focus:border-amber-500 rounded-lg text-xs text-gray-200 outline-none font-mono"
                  />
                  <span className="text-[9px] text-gray-500 block">
                    Frekuensi radio patroli atau telepon IC
                  </span>
                </div>
              </div>

              {/* Diresmikan Oleh / Dasar SK */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-300 uppercase block">
                  Dasar SK Pengangkatan / Diresmikan Oleh:
                </label>
                <input
                  type="text"
                  value={addPromotedBy}
                  onChange={(e) => setAddPromotedBy(e.target.value)}
                  placeholder="SK Pengangkatan Markas Besar HSPD..."
                  className="w-full px-3 py-1.5 bg-[#0D1117] border border-gray-700 focus:border-amber-500 rounded-lg text-xs text-gray-200 outline-none font-mono"
                />
              </div>

              {/* Discord Delivery Options */}
              <div className="p-3.5 bg-sky-950/30 border border-sky-800/60 rounded-lg space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-[11px] font-bold text-sky-300 flex items-center gap-1.5">
                    <Bot className="w-4 h-4 text-sky-400" />
                    <span>METODE PENGIRIMAN AKUN LOGIN KE ANGGOTA:</span>
                  </div>

                  {/* Live Bot Online Presence Indicator */}
                  {isBotOnline ? (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/60 text-[10px] text-emerald-300 font-bold">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                      </span>
                      <span>BOT ONLINE (MENYALA HIJAU)</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-gray-400">Bot: Offline</span>
                      <button
                        type="button"
                        onClick={handleQuickStartBot}
                        disabled={isConnectingBot}
                        className="px-2 py-0.5 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white rounded text-[10px] font-bold transition flex items-center gap-1"
                      >
                        {isConnectingBot ? (
                          <>
                            <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                            <span>Menyalakan...</span>
                          </>
                        ) : (
                          <span>⚡ Nyalakan Hijau</span>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-2 pl-1">
                  {/* Option 1: Direct Message PM via Bot */}
                  <label className="flex items-start gap-2 text-xs text-sky-200 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={addSendDm}
                      onChange={(e) => setAddSendDm(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-700 text-sky-600 focus:ring-0 cursor-pointer mt-0.5"
                    />
                    <div>
                      <span className="font-bold text-gray-100">✉️ Kirim Kredensial Login Langsung ke Pesan Pribadi (PM / DM) Discord</span>
                      <div className="text-[10px] text-gray-400">
                        Bot <strong className="text-sky-300">Cek Akun | High State</strong> yang online akan mengirimkan pesan embed (UCP & PIN) langsung ke DM akun Discord anggota secara rahasia.
                      </div>
                    </div>
                  </label>

                  {/* Option 2: Channel Webhook */}
                  <label className="flex items-start gap-2 text-xs text-indigo-200 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={addSendWebhook}
                      onChange={(e) => setAddSendWebhook(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-700 text-indigo-600 focus:ring-0 cursor-pointer mt-0.5"
                    />
                    <div>
                      <span className="font-bold text-gray-100">📢 Kirim Pengumuman & Kredensial ke Saluran Webhook Discord</span>
                      <div className="text-[10px] text-gray-400">
                        Mengirim embed pengumuman anggota baru ke saluran Discord Roster / Pendaftaran.
                      </div>
                    </div>
                  </label>
                </div>

                {/* Pesan Khusus Atasan untuk Anggota Baru (Opsional) */}
                {addSendDm && (
                  <div className="pt-2 border-t border-sky-900/40 space-y-1.5">
                    <label className="text-[10px] font-bold text-sky-300 uppercase flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
                        <span>Pesan / Instruksi Tambahan dari Atasan di PM Discord:</span>
                      </span>
                      <span className="text-[9px] text-sky-400 font-normal">Disertakan dalam embed PM</span>
                    </label>
                    <textarea
                      rows={2}
                      value={addCustomMessage}
                      onChange={(e) => setAddCustomMessage(e.target.value)}
                      placeholder="Tuliskan arahan dinas dari atasan, sambutan selamat bertugas, dll..."
                      className="w-full px-3 py-1.5 bg-[#0D1117] border border-sky-800/80 focus:border-sky-400 rounded-lg text-xs text-sky-100 placeholder:text-gray-600 outline-none font-sans resize-none"
                    />
                    <div className="flex flex-wrap items-center gap-1.5 text-[9.5px]">
                      <span className="text-gray-400">Pilihan cepat:</span>
                      <button
                        type="button"
                        onClick={() => setAddCustomMessage('Selamat bergabung di jajaran Kepolisian HSPD! Harap segera login ke terminal MDT dan selalu patuhi Standar Operasional Prosedur (SOP).')}
                        className="px-2 py-0.5 bg-sky-950 hover:bg-sky-900 border border-sky-800/80 rounded text-sky-200 transition"
                      >
                        📋 Sambutan Standar
                      </button>
                      <button
                        type="button"
                        onClick={() => setAddCustomMessage('Selamat atas kelulusan dari Akademi Kepolisian. Segera melapor ke Supervisor divisi untuk pembagian seragam dan jadwal patroli.')}
                        className="px-2 py-0.5 bg-sky-950 hover:bg-sky-900 border border-sky-800/80 rounded text-sky-200 transition"
                      >
                        🎖️ Lulusan Akademi
                      </button>
                      <button
                        type="button"
                        onClick={() => setAddCustomMessage('')}
                        className="px-2 py-0.5 bg-gray-800 hover:bg-gray-700 rounded text-gray-400 transition"
                      >
                        ✕ Kosongkan
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-gray-800 flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOfficerModalOpen(false)}
                  disabled={isSubmittingAdd}
                  className="px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs transition"
                >
                  Tutup / Selesai
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveNewOfficer(undefined, true)}
                  disabled={isSubmittingAdd}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-bold rounded-lg transition text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/20"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Simpan & Tambah Lagi (+)</span>
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdd}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-800 text-black font-bold rounded-lg transition text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                >
                  {isSubmittingAdd ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Mendaftarkan & Mengirim...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Simpan & Selesai</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL QUICK SEND PM BOT DISCORD ================= */}
      {targetDmOfficer && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#161B22] border border-sky-600/80 rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col font-mono text-xs max-h-[92vh]">
            <div className="bg-[#0D1117] border-b border-gray-800 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-sky-400" />
                <h3 className="font-bold text-gray-100 uppercase tracking-wide">
                  Kirim & Kustomisasi Pesan Pribadi (PM / DM) Discord
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setTargetDmOfficer(null)}
                className="text-gray-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteSendBotDm} className="p-4 space-y-4 overflow-y-auto">
              {/* Officer Target Badge Card */}
              <div className="p-3 bg-sky-950/40 border border-sky-800/80 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="text-[10px] text-gray-400 uppercase font-bold">Penerima Pesan:</div>
                  <div className="text-sm font-bold text-gray-100">{targetDmOfficer.name}</div>
                  <div className="text-[11px] text-sky-300">
                    Badge: <strong>{targetDmOfficer.badge}</strong> • Pangkat: <strong>{targetDmOfficer.rank}</strong>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold bg-sky-900/60 text-sky-300 px-2 py-1 rounded border border-sky-700">
                    UCP: {targetDmOfficer.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAdvancedDmSettings(!showAdvancedDmSettings)}
                    className="text-[11px] font-bold px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-sky-300 border border-sky-800 rounded transition flex items-center gap-1.5"
                  >
                    <Palette className="w-3.5 h-3.5" />
                    <span>{showAdvancedDmSettings ? 'Tutup Kustomisasi' : 'Kustomisasi Desain & Logo'}</span>
                  </button>
                </div>
              </div>

              {/* Mode Pengiriman Pesan oleh Atasan */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-gray-300 uppercase">
                  PILIH MODE PENGIRIMAN PESAN:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTargetDmMessageType('credentials');
                      setTargetDmEmbedTitle('✅ Berhasil!');
                      setTargetDmEmbedDescription('Berikut adalah detail dari akun UCP Anda:');
                    }}
                    className={`p-2 rounded-lg border text-left flex items-start gap-2.5 transition ${
                      targetDmMessageType === 'credentials'
                        ? 'bg-sky-950/80 border-sky-500 ring-1 ring-sky-500 text-sky-100'
                        : 'bg-[#0D1117] border-gray-800 hover:border-gray-700 text-gray-400'
                    }`}
                  >
                    <KeyRound className={`w-4 h-4 mt-0.5 shrink-0 ${targetDmMessageType === 'credentials' ? 'text-sky-400' : 'text-gray-500'}`} />
                    <div>
                      <div className="text-xs font-bold">Kredensial Login + Pesan Atasan</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">Kirim UCP, PIN keamanan & pesan khusus dinas</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTargetDmMessageType('custom_chat');
                      setTargetDmEmbedTitle('📢 Pesan Dinas dari Atasan');
                      setTargetDmEmbedDescription('Anda menerima pesan dinas resmi dari jajaran Komando / Atasan:');
                    }}
                    className={`p-2 rounded-lg border text-left flex items-start gap-2.5 transition ${
                      targetDmMessageType === 'custom_chat'
                        ? 'bg-sky-950/80 border-sky-500 ring-1 ring-sky-500 text-sky-100'
                        : 'bg-[#0D1117] border-gray-800 hover:border-gray-700 text-gray-400'
                    }`}
                  >
                    <MessageSquare className={`w-4 h-4 mt-0.5 shrink-0 ${targetDmMessageType === 'custom_chat' ? 'text-sky-400' : 'text-gray-500'}`} />
                    <div>
                      <div className="text-xs font-bold">Chat / Memo Bebas dari Atasan</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">Surat tugas, briefing, panggilan apel, atau evaluasi (tanpa PIN)</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Discord User ID Input */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-gray-200 uppercase">
                    DISCORD USER ID TARGET: <span className="text-rose-400">*</span>
                  </label>
                  <span className="text-[10px] text-sky-400">Numerik 17-20 digit</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={targetDmUserId}
                    onChange={(e) => setTargetDmUserId(e.target.value)}
                    placeholder="Contoh: 842019283719001 (17-20 digit angka)"
                    className="flex-1 px-3 py-2 bg-[#0D1117] border border-gray-700 focus:border-sky-500 rounded text-xs text-sky-200 outline-none font-mono"
                    required
                  />
                  <button
                    id="btn-save-target-discord-user-id"
                    type="button"
                    onClick={handleSaveTargetDiscordUserId}
                    disabled={isSavingTargetDiscordId || !targetDmUserId.trim()}
                    className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded text-xs font-mono font-bold flex items-center gap-1.5 transition shadow-sm whitespace-nowrap cursor-pointer"
                    title="Simpan Discord User ID ini secara permanen ke akun anggota ini di database"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSavingTargetDiscordId ? 'Menyimpan...' : 'Simpan ID Target'}</span>
                  </button>
                </div>
                {discordIdSaveNotice && (
                  <div className={`p-2 rounded text-xs font-mono border ${
                    discordIdSaveNotice.includes('✅')
                      ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                      : 'bg-rose-950/80 border-rose-500 text-rose-300'
                  }`}>
                    {discordIdSaveNotice}
                  </div>
                )}
                <div className="text-[10px] text-gray-400 flex flex-wrap items-center justify-between gap-1">
                  <span>💡 <strong>Cara dapat User ID:</strong> Buka Discord &gt; <em>Settings &gt; Advanced &gt; Aktifkan Developer Mode</em> &gt; Klik kanan profil pengguna &gt; <strong>Copy User ID</strong>.</span>
                  {targetDmOfficer?.discordTag && (
                    <span className="text-sky-300 font-mono text-[10px]">Tersimpan di Akun: {targetDmOfficer.discordTag}</span>
                  )}
                </div>
              </div>

              {/* CHAT / PESAN KHUSUS DARI ATASAN (CUSTOM MESSAGE) */}
              <div className="space-y-2 p-3 bg-sky-950/30 border border-sky-900/60 rounded-lg">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-sky-300 uppercase flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
                    <span>CHAT / PESAN KHUSUS DARI ATASAN (CUSTOM MESSAGE):</span>
                  </label>
                  <span className="text-[10px] text-gray-400">Dapat diedit bebas & disimpan oleh atasan</span>
                </div>
                <textarea
                  value={targetDmCustomMessage}
                  onChange={(e) => setTargetDmCustomMessage(e.target.value)}
                  rows={3}
                  placeholder="Ketik instruksi dinas, pesan tugas, panggilan apel, ucapan promosi, atau catatan kedisiplinan dari atasan..."
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 focus:border-sky-500 rounded text-xs text-gray-100 outline-none resize-y font-sans leading-relaxed"
                />

                {/* TOMBOL SIMPAN PESAN YANG DIBUAT ATASAN */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      id="btn-save-superior-msg-default"
                      onClick={handleSaveCurrentMessageAsDefault}
                      disabled={!targetDmCustomMessage.trim()}
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded text-[11px] font-bold transition flex items-center gap-1.5 shadow-sm shadow-emerald-900/40 active:scale-95 cursor-pointer"
                      title="Simpan pesan saat ini sebagai pesan default yang akan otomatis dimuat untuk PM Discord berikutnya"
                    >
                      <Save className="w-3 h-3" />
                      <span>Simpan Pesan Atasan (Default)</span>
                    </button>

                    <button
                      type="button"
                      id="btn-toggle-add-preset"
                      onClick={() => setShowAddPresetInput(!showAddPresetInput)}
                      disabled={!targetDmCustomMessage.trim()}
                      className="px-2.5 py-1.5 bg-[#161B22] hover:bg-gray-800 disabled:opacity-40 text-sky-300 hover:text-sky-200 border border-sky-800/80 rounded text-[11px] font-bold transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
                      title="Simpan pesan ini sebagai template preset baru dengan judul khusus"
                    >
                      <Bookmark className="w-3 h-3 text-sky-400" />
                      <span>+ Simpan ke Template</span>
                    </button>
                  </div>

                  <span className="text-[10px] text-gray-400 font-mono">
                    {targetDmCustomMessage.length} karakter
                  </span>
                </div>

                {/* Save Feedback Notice */}
                {saveMessageNotice && (
                  <div className="p-2 bg-emerald-950/90 border border-emerald-500/80 rounded text-xs text-emerald-200 flex items-center gap-2 animate-in fade-in duration-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="font-medium text-[11px]">{saveMessageNotice}</span>
                  </div>
                )}

                {/* Form Tambah Template Preset Baru */}
                {showAddPresetInput && (
                  <div className="p-2.5 bg-[#0D1117] border border-sky-700/80 rounded space-y-2 animate-in fade-in duration-200">
                    <div className="text-[10px] font-bold text-sky-300 uppercase">
                      Beri Judul Template Pesan Baru:
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={newPresetTitle}
                        onChange={(e) => setNewPresetTitle(e.target.value)}
                        placeholder="Contoh: Pengarahan Shift Malam / Apel Khusus..."
                        className="flex-1 px-2.5 py-1 bg-[#161B22] border border-gray-700 focus:border-sky-500 rounded text-xs text-gray-200 outline-none"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSaveCurrentMessageAsPreset();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleSaveCurrentMessageAsPreset}
                        className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded text-xs transition"
                      >
                        Simpan
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddPresetInput(false)}
                        className="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-xs transition"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Template Cepat Pesan Atasan */}
                <div className="space-y-1 pt-1 border-t border-sky-900/40">
                  <div className="text-[10px] text-gray-400 font-bold uppercase flex items-center justify-between">
                    <span>Template & Pesan Tersimpan dari Atasan:</span>
                    <span className="text-[9px] text-sky-400/80">Klik untuk memuat pesan</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {superiorDmPresets.map((preset) => {
                      const isCustom = !preset.id.startsWith('preset-');
                      return (
                        <div
                          key={preset.id}
                          className="inline-flex items-center bg-[#161B22] hover:bg-sky-950/80 text-sky-300 hover:text-sky-200 border border-gray-700 hover:border-sky-600 rounded text-[10.5px] transition group overflow-hidden"
                        >
                          <button
                            type="button"
                            onClick={() => setTargetDmCustomMessage(preset.text)}
                            className="px-2 py-1 text-left font-medium truncate max-w-[200px]"
                            title={preset.text}
                          >
                            {preset.title}
                          </button>
                          {isCustom && (
                            <button
                              type="button"
                              onClick={(e) => handleDeletePreset(preset.id, e)}
                              className="px-1.5 py-1 text-gray-500 hover:text-rose-400 hover:bg-rose-950/50 transition border-l border-gray-800"
                              title="Hapus template ini"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => setTargetDmCustomMessage('')}
                      className="text-[10.5px] px-2 py-1 bg-[#161B22] hover:bg-gray-800 text-gray-400 hover:text-gray-200 border border-gray-700 rounded transition"
                    >
                      📝 Kosongkan
                    </button>
                  </div>
                </div>
              </div>

              {/* ADVANCED CUSTOMIZATION: EDIT MESSAGE & LOGO (BY ATASAN / ADMIN) */}
              {showAdvancedDmSettings && (
                <div className="p-3.5 bg-[#0D1117] border border-sky-800/80 rounded-lg space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                    <div className="font-bold text-sky-300 text-xs flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5" />
                      <span>KUSTOMISASI LOGO & KONTEN PESAN OLEH ATASAN:</span>
                    </div>
                    <span className="text-[10px] text-gray-400">Dapat diedit manual sebelum dikirim</span>
                  </div>

                  {/* LOGO CHANGER */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-gray-300 uppercase">
                      PILIH LOGO / AVATAR PESAN BOT:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {PRESET_DISCORD_BOT_LOGOS.map((preset, idx) => {
                        const isSelected = targetDmLogoUrl === preset.url;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setTargetDmLogoUrl(preset.url)}
                            className={`p-1.5 rounded border text-left flex items-center gap-1.5 transition ${
                              isSelected 
                                ? 'bg-sky-950/80 border-sky-500 ring-1 ring-sky-500 text-sky-200' 
                                : 'bg-[#161B22] border-gray-800 hover:border-gray-700 text-gray-400'
                            }`}
                          >
                            <img
                              src={preset.url}
                              alt={preset.name}
                              referrerPolicy="no-referrer"
                              className="w-6 h-6 rounded-full object-cover bg-black/40 p-0.5 border border-gray-700 shrink-0"
                            />
                            <span className="text-[10px] font-bold truncate">{preset.name}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                      <input
                        type="url"
                        value={targetDmLogoUrl}
                        onChange={(e) => setTargetDmLogoUrl(e.target.value)}
                        placeholder="Link URL Logo Kustom..."
                        className="sm:col-span-2 px-2.5 py-1.5 bg-[#161B22] border border-gray-700 focus:border-sky-500 rounded text-xs text-gray-200 outline-none font-mono"
                      />
                      <label className="flex items-center justify-center gap-1 px-2.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 rounded text-[11px] font-bold cursor-pointer transition">
                        <Upload className="w-3 h-3 text-sky-400" />
                        <span>Upload Logo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (loadEvt) => {
                                const dataUrl = loadEvt.target?.result as string;
                                if (dataUrl) setTargetDmLogoUrl(dataUrl);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  {/* EDIT EMBED TITLES & DESCRIPTIONS */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 mb-1">
                        Header Author / Bot:
                      </label>
                      <input
                        type="text"
                        value={targetDmBotName}
                        onChange={(e) => setTargetDmBotName(e.target.value)}
                        placeholder="Cek Akun | High State"
                        className="w-full px-2.5 py-1.5 bg-[#161B22] border border-gray-700 focus:border-sky-500 rounded text-xs text-gray-200 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 mb-1">
                        Judul Pesan Embed:
                      </label>
                      <input
                        type="text"
                        value={targetDmEmbedTitle}
                        onChange={(e) => setTargetDmEmbedTitle(e.target.value)}
                        placeholder="✅ Berhasil!"
                        className="w-full px-2.5 py-1.5 bg-[#161B22] border border-gray-700 focus:border-sky-500 rounded text-xs text-gray-200 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-1">
                      Deskripsi / Sub-Header:
                    </label>
                    <input
                      type="text"
                      value={targetDmEmbedDescription}
                      onChange={(e) => setTargetDmEmbedDescription(e.target.value)}
                      placeholder="Berikut adalah detail dari akun UCP Anda:"
                      className="w-full px-2.5 py-1.5 bg-[#161B22] border border-gray-700 focus:border-sky-500 rounded text-xs text-gray-200 outline-none"
                    />
                  </div>

                  {/* EDIT CREDENTIAL FIELDS & COLORS */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 mb-1">
                        UCP Name:
                      </label>
                      <input
                        type="text"
                        value={targetDmOfficerName}
                        onChange={(e) => setTargetDmOfficerName(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-[#161B22] border border-gray-700 focus:border-sky-500 rounded text-xs text-gray-200 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 mb-1">
                        PIN Code:
                      </label>
                      <input
                        type="text"
                        value={targetDmPin}
                        onChange={(e) => setTargetDmPin(e.target.value)}
                        disabled={targetDmMessageType === 'custom_chat'}
                        className="w-full px-2.5 py-1.5 bg-[#161B22] border border-gray-700 focus:border-sky-500 rounded text-xs text-amber-300 font-bold outline-none disabled:opacity-40"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 mb-1">
                        Warna Embed:
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={targetDmEmbedColor.startsWith('#') ? targetDmEmbedColor : '#00A8FF'}
                          onChange={(e) => setTargetDmEmbedColor(e.target.value)}
                          className="w-7 h-7 rounded border border-gray-700 bg-transparent cursor-pointer shrink-0"
                        />
                        <input
                          type="text"
                          value={targetDmEmbedColor}
                          onChange={(e) => setTargetDmEmbedColor(e.target.value)}
                          placeholder="#00A8FF"
                          className="w-full px-2 py-1.5 bg-[#161B22] border border-gray-700 focus:border-sky-500 rounded text-xs text-gray-200 outline-none font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Note / Catatan Kustom */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-300 uppercase">
                  Catatan Privasi (Footer Note):
                </label>
                <input
                  type="text"
                  value={targetDmCustomNote}
                  onChange={(e) => setTargetDmCustomNote(e.target.value)}
                  placeholder="Jangan beritahu informasi ini kepada orang lain!"
                  className="w-full px-3 py-1.5 bg-[#0D1117] border border-gray-700 focus:border-sky-500 rounded text-xs text-gray-200 outline-none"
                />
              </div>

              {/* Embed Live Preview */}
              <div className="space-y-1.5">
                <div className="text-[10px] font-bold text-gray-400 uppercase flex items-center justify-between">
                  <span>PREVIEW PESAN DISCORD PM (REAL-TIME):</span>
                  <span className="text-[10px] text-sky-400">● Tampilan Sesuai Kustomisasi</span>
                </div>
                <div 
                  className="bg-[#2B2D31] rounded-r-lg p-3.5 space-y-2.5 text-white font-sans text-xs shadow-inner"
                  style={{ borderLeft: `4px solid ${targetDmEmbedColor || '#00A8FF'}` }}
                >
                  <div className="flex items-center gap-1.5">
                    <img
                      src={targetDmLogoUrl || 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png'}
                      alt="Bot Icon"
                      referrerPolicy="no-referrer"
                      className="w-4 h-4 rounded-full object-cover"
                    />
                    <span className="font-bold text-[11px] text-gray-200">
                      {targetDmBotName || 'Cek Akun | High State'}
                    </span>
                  </div>
                  <div>
                    <div className="font-bold text-white text-xs">
                      {targetDmEmbedTitle || (targetDmMessageType === 'custom_chat' ? '📢 Pesan Dinas dari Atasan' : '✅ Berhasil!')}
                    </div>
                    <p className="text-gray-300 text-[11px]">
                      {targetDmEmbedDescription || (targetDmMessageType === 'custom_chat' ? 'Anda menerima pesan dinas resmi dari jajaran Komando / Atasan:' : 'Berikut adalah detail dari akun UCP Anda:')}
                    </p>
                  </div>
                  <div className="space-y-1.5 pt-0.5 font-mono text-[11px]">
                    {targetDmMessageType === 'credentials' ? (
                      <>
                        <div>
                          <div className="text-[9.5px] font-bold text-gray-400 uppercase">UCP</div>
                          <div className="text-gray-100 font-semibold font-sans">
                            {targetDmOfficerName || targetDmOfficer.name}
                          </div>
                        </div>
                        <div>
                          <div className="text-[9.5px] font-bold text-gray-400 uppercase">Pin Code</div>
                          <div className="text-amber-300 font-bold bg-[#1E1F22] px-2 py-0.5 rounded inline-block">
                            {targetDmPin || targetDmOfficer.pin || '10-4'}
                          </div>
                        </div>
                        <div>
                          <div className="text-[9.5px] font-bold text-gray-400 uppercase">No. Badge & Pangkat</div>
                          <div className="text-gray-200 font-sans text-xs">
                            `{targetDmBadge || targetDmOfficer.badge}` • {targetDmRank || targetDmOfficer.rank}
                          </div>
                        </div>
                        <div>
                          <div className="text-[9.5px] font-bold text-gray-400 uppercase">Divisi</div>
                          <div className="text-sky-300 font-sans text-xs">
                            {targetDmDivision || targetDmOfficer.division || 'Patrol Bureau'}
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <div className="text-[9.5px] font-bold text-gray-400 uppercase">Penerima Pesan</div>
                          <div className="text-gray-100 font-semibold font-sans">
                            {targetDmOfficerName || targetDmOfficer.name} (`{targetDmBadge || targetDmOfficer.badge}`)
                          </div>
                        </div>
                        <div>
                          <div className="text-[9.5px] font-bold text-gray-400 uppercase">Pangkat & Divisi</div>
                          <div className="text-gray-200 font-sans text-xs">
                            {targetDmRank || targetDmOfficer.rank} • {targetDmDivision || targetDmOfficer.division || 'Patrol Bureau'}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Highlighted Custom Message from Superior in Embed */}
                    {targetDmCustomMessage.trim() && (
                      <div className="bg-[#1E1F22] p-2.5 rounded border-l-2 border-sky-400 my-1 font-sans">
                        <div className="text-[9.5px] font-bold text-sky-300 uppercase flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          <span>Pesan / Instruksi dari Atasan:</span>
                        </div>
                        <div className="text-gray-100 text-xs mt-1 whitespace-pre-wrap leading-relaxed">
                          {targetDmCustomMessage}
                        </div>
                      </div>
                    )}

                    <div>
                      <div className="text-[9.5px] font-bold text-gray-400 uppercase">Note</div>
                      <div className="text-gray-300 text-[10.5px] font-sans">
                        {targetDmCustomNote || 'Jangan beritahu informasi ini kepada orang lain!'}
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-gray-700/50 pt-1.5 text-[9.5px] text-gray-400 font-sans flex items-center justify-between">
                    <span>{targetDmFooterText || 'Bot High State'} • Hari ini pukul 12:40 AM</span>
                    <img
                      src={targetDmLogoUrl || 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png'}
                      alt="Footer Logo"
                      className="w-3 h-3 rounded-full object-cover"
                    />
                  </div>
                </div>
              </div>

              {/* Result Notice */}
              {botDmResultNotice && (
                <div className={`p-2.5 rounded border text-xs flex items-center gap-2 animate-in fade-in ${
                  botDmResultNotice.success 
                    ? 'bg-emerald-950/80 border-emerald-600 text-emerald-200' 
                    : 'bg-rose-950/80 border-rose-600 text-rose-200'
                }`}>
                  {botDmResultNotice.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  )}
                  <span>{botDmResultNotice.message}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 border-t border-gray-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTargetDmOfficer(null)}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSendingBotDm || !targetDmUserId.trim()}
                  className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded transition flex items-center gap-2 disabled:opacity-40 shadow-lg shadow-sky-600/30"
                >
                  {isSendingBotDm ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Mengirim PM Discord...</span>
                    </>
                  ) : (
                    <>
                      <Bot className="w-3.5 h-3.5" />
                      <span>
                        {targetDmMessageType === 'custom_chat'
                          ? 'KIRIM PESAN CHAT KE PM DISCORD'
                          : 'KIRIM SEKARANG KE PM DISCORD'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS SEMUA AKUN NON-ATASAN */}
      {showPurgeNonAtasanModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#161B22] border border-rose-600/70 rounded-xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-rose-950/80 border border-rose-600 flex items-center justify-center text-rose-400 shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-100 text-sm">Hapus Semua Akun Selain Atasan</h3>
                <p className="text-xs text-gray-400">Pembersihan Total Akun Non-Command dari Database CAD & Cloud</p>
              </div>
            </div>
            <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-lg text-xs text-rose-200 space-y-1 font-mono">
              <p className="font-bold text-rose-300">⚠️ PERINGATAN PEMBERSIHAN DATA:</p>
              <p>Aksi ini akan menghapus seluruh akun personel selain jajaran Atasan (Chief, Assistant Chief, Deputy Chief, Commander, Captain, Lieutenant) dari database lokal dan Cloud Firestore.</p>
              <p className="text-gray-300 text-[11px]">Hanya akun Atasan resmi yang akan dipertahankan di roster. Data yang terhapus dari cloud tidak akan dapat dipulihkan kembali kecuali didaftarkan ulang.</p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPurgeNonAtasanModal(false)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-bold transition font-mono"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isPurgingNonAtasan}
                onClick={async () => {
                  setIsPurgingNonAtasan(true);
                  try {
                    if (onPurgeNonAtasanOfficers) {
                      await onPurgeNonAtasanOfficers();
                    }
                    setShowPurgeNonAtasanModal(false);
                    setSuccessNotice('✅ Seluruh akun personel selain atasan berhasil dibersihkan dari database lokal & cloud!');
                    setTimeout(() => setSuccessNotice(''), 5000);
                  } catch (e) {
                    alert('Gagal membersihkan data non-atasan.');
                  } finally {
                    setIsPurgingNonAtasan(false);
                  }
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 font-mono shadow-md shadow-rose-600/30"
              >
                {isPurgingNonAtasan ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{isPurgingNonAtasan ? 'Membersihkan Cloud...' : 'Ya, Bersihkan Semua Non-Atasan'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXPORT ATTENDANCE MODAL */}
      <ExportAttendanceModal
        isOpen={isExportAttendanceModalOpen}
        onClose={() => setIsExportAttendanceModalOpen(false)}
        roster={roster}
      />

      {/* MODAL PENGATURAN & PERUBAHAN WEBHOOK (PENGATURAN SISTEM & OTORITAS KOMANDO) */}
      {isWebhookConfigModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#121620] border border-indigo-700/80 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-800 bg-indigo-950/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-950 border border-indigo-500/60 flex items-center justify-center text-indigo-400">
                  <Settings className="w-5 h-5 animate-[spin_8s_linear_infinite]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white tracking-tight">
                      PENGATURAN WEBHOOK DISCORD
                    </h3>
                    <span className="text-[10px] bg-indigo-950 text-indigo-300 font-mono px-2 py-0.5 rounded border border-indigo-700 font-bold">
                      OTORITAS KOMANDO
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 font-mono">
                    Kelola & ubah URL Webhook untuk pengiriman akun login, UCP, PIN, dan audit personel
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsWebhookConfigModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-4">
              {/* Status Notice */}
              {webhookNotice && (
                <div className={`p-3 rounded-lg border text-xs flex items-center gap-2 font-mono animate-in fade-in ${
                  webhookNotice.success 
                    ? 'bg-emerald-950/80 border-emerald-500/80 text-emerald-200' 
                    : 'bg-rose-950/80 border-rose-500/80 text-rose-200'
                }`}>
                  {webhookNotice.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>{webhookNotice.message}</span>
                </div>
              )}

              {/* Input Webhook URL */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-indigo-300 uppercase flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-indigo-400" />
                    <span>URL Webhook Discord Petugas & Kredensial:</span>
                  </span>
                  <span className="text-[10px] text-gray-400 lowercase font-mono font-normal">
                    https://discord.com/api/webhooks/...
                  </span>
                </label>
                <input
                  type="url"
                  value={rosterWebhookUrl}
                  onChange={(e) => setRosterWebhookUrl(e.target.value)}
                  placeholder="https://discord.com/api/webhooks/ID/TOKEN"
                  className="w-full px-3.5 py-2.5 bg-[#0D1117] border border-gray-700 focus:border-indigo-500 rounded-lg text-xs text-gray-100 font-mono outline-none"
                />
                <div className="text-[11px] text-gray-400 flex items-center justify-between">
                  <span>Digunakan oleh tombol WEBHOOK di tabel untuk mengirim UCP & PIN login.</span>
                  <span className={rosterWebhookUrl.startsWith('https://discord.com/api/webhooks/') ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                    {rosterWebhookUrl.startsWith('https://discord.com/api/webhooks/') ? '✓ Format Discord Valid' : '⚠️ Format Harus Discord Webhook'}
                  </span>
                </div>
              </div>

              {/* Input Bot Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-300 uppercase flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Nama Bot Webhook (Embed Sender):</span>
                </label>
                <input
                  type="text"
                  value={rosterBotName}
                  onChange={(e) => setRosterBotName(e.target.value)}
                  placeholder="Contoh: HSPD Personnel & Roster Bureau"
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 focus:border-indigo-500 rounded-lg text-xs text-gray-100 font-mono outline-none"
                />
              </div>

              {/* Navigation & Integration shortcuts */}
              <div className="p-3 bg-[#0D1117] rounded-xl border border-gray-800 space-y-2">
                <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                  <span>👑 PINTASAN PENGATURAN SISTEM & OTORITAS KOMANDO</span>
                </span>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Anda dapat berpindah langsung ke menu pengaturan induk Markas Besar HSPD untuk audit lengkap, konfigurasi multi-channel, dan log keamanan:
                </p>
                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  {onNavigateToSettings && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsWebhookConfigModalOpen(false);
                        onNavigateToSettings('section-pin-webhook');
                      }}
                      className="flex-1 py-2 px-3 bg-amber-950/70 hover:bg-amber-900 border border-amber-600 text-amber-300 rounded-lg text-xs font-bold font-mono transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Sliders className="w-3.5 h-3.5 text-amber-400" />
                      <span>Buka di Pengaturan Sistem & Otoritas Komando</span>
                    </button>
                  )}
                  {onOpenWebhookModal && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsWebhookConfigModalOpen(false);
                        onOpenWebhookModal('roster');
                      }}
                      className="py-2 px-3 bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-600 text-indigo-300 rounded-lg text-xs font-bold font-mono transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Settings className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Buka 14 Tab Webhook</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Modal Footer Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-800">
                <button
                  type="button"
                  onClick={handleTestWebhookPing}
                  disabled={isTestingWebhook || !rosterWebhookUrl.trim()}
                  className="px-3.5 py-2 bg-blue-950 hover:bg-blue-900 border border-blue-600 text-blue-300 rounded-lg text-xs font-bold font-mono transition flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
                >
                  {isTestingWebhook ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Tes Ping Webhook</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsWebhookConfigModalOpen(false)}
                    className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-mono transition cursor-pointer"
                  >
                    Tutup
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveWebhookConfig}
                    disabled={isSavingWebhook}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold font-mono transition flex items-center gap-1.5 shadow-md shadow-emerald-950 cursor-pointer"
                  >
                    {isSavingWebhook ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>Simpan Webhook</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
