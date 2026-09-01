import React, { useState } from 'react';
import { 
  Shield, Radio, Send, CheckCircle2, AlertCircle, RefreshCw, 
  X, Globe, Settings, Lock, Check, Copy, ExternalLink, Sparkles, Sliders,
  AlertTriangle, UserX, Award, KeyRound, Users, Search, ShieldAlert, Car,
  Landmark, Flame, Hammer, Coins, Palette, FileText, Bot, Eye, EyeOff, MessageSquare,
  Upload, Image
} from 'lucide-react';
import { 
  getSavedWebhookConfig, saveWebhookConfig, 
  getSavedDutyWebhookConfig, saveDutyWebhookConfig, 
  getSavedPromotionWebhookConfig, savePromotionWebhookConfig,
  getSavedWarningWebhookConfig, saveWarningWebhookConfig,
  getSavedDischargeWebhookConfig, saveDischargeWebhookConfig,
  getSavedPinResetWebhookConfig, savePinResetWebhookConfig,
  getSavedRosterWebhookConfig, saveRosterWebhookConfig,
  getSavedDetectiveWebhookConfig, saveDetectiveWebhookConfig,
  getSavedBoloWebhookConfig, saveBoloWebhookConfig,
  getSavedImpoundWebhookConfig, saveImpoundWebhookConfig,
  getSavedVaultWebhookConfig, saveVaultWebhookConfig,
  getSavedDestructionWebhookConfig, saveDestructionWebhookConfig,
  getSavedDocumentWebhookConfig, saveDocumentWebhookConfig,
  getSavedDiscordBotConfig, saveDiscordBotConfig,
  testDiscordBotDirectMessage, DiscordBotConfig, PRESET_DISCORD_BOT_LOGOS,
  testDiscordWebhook, testDutyDiscordWebhook, 
  testPromotionDiscordWebhook,
  testWarningDiscordWebhook, testDischargeDiscordWebhook,
  testPinResetDiscordWebhook, testRosterDiscordWebhook,
  testDetectiveDiscordWebhook, testBoloDiscordWebhook,
  testImpoundDiscordWebhook,
  testVaultDiscordWebhook,
  testDestructionDiscordWebhook,
  testDocumentDiscordWebhook,
  WebhookConfig 
} from '../utils/discordWebhook';
import { OfficerProfile, isOfficerHighRank } from '../types';
import { HSPD_LOGO_URL } from '../assets/logo';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentOfficer?: OfficerProfile | null;
  onSaved?: () => void;
  onOpenBrandingModal?: () => void;
}

export const WebhookSettingsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentOfficer,
  onSaved,
  onOpenBrandingModal
}) => {
  const [activeTab, setActiveTab] = useState<'case' | 'duty' | 'promotion' | 'warning' | 'discharge' | 'pinReset' | 'roster' | 'detective' | 'bolo' | 'impound' | 'vault' | 'destruction' | 'document' | 'botDm'>('case');
  
  // Case / Arrest Webhook State
  const [caseConfig, setCaseConfig] = useState<WebhookConfig>(() => getSavedWebhookConfig());
  const [isTestingCase, setIsTestingCase] = useState(false);
  const [caseTestResult, setCaseTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Duty Dispatch Webhook State
  const [dutyConfig, setDutyConfig] = useState<WebhookConfig>(() => getSavedDutyWebhookConfig());
  const [isTestingDuty, setIsTestingDuty] = useState(false);
  const [dutyTestResult, setDutyTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Officer Promotion Webhook State
  const [promotionConfig, setPromotionConfig] = useState<WebhookConfig>(() => getSavedPromotionWebhookConfig());
  const [isTestingPromotion, setIsTestingPromotion] = useState(false);
  const [promotionTestResult, setPromotionTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Officer Warning Webhook State
  const [warningConfig, setWarningConfig] = useState<WebhookConfig>(() => getSavedWarningWebhookConfig());
  const [isTestingWarning, setIsTestingWarning] = useState(false);
  const [warningTestResult, setWarningTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Officer Discharge Webhook State
  const [dischargeConfig, setDischargeConfig] = useState<WebhookConfig>(() => getSavedDischargeWebhookConfig());
  const [isTestingDischarge, setIsTestingDischarge] = useState(false);
  const [dischargeTestResult, setDischargeTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // PIN Reset & Credentials Webhook State
  const [pinResetConfig, setPinResetConfig] = useState<WebhookConfig>(() => getSavedPinResetWebhookConfig());
  const [isTestingPinReset, setIsTestingPinReset] = useState(false);
  const [pinResetTestResult, setPinResetTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Roster & Member Info Webhook State
  const [rosterConfig, setRosterConfig] = useState<WebhookConfig>(() => getSavedRosterWebhookConfig());
  const [isTestingRoster, setIsTestingRoster] = useState(false);
  const [rosterTestResult, setRosterTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Detective / CID Webhook State
  const [detectiveConfig, setDetectiveConfig] = useState<WebhookConfig>(() => getSavedDetectiveWebhookConfig());
  const [isTestingDetective, setIsTestingDetective] = useState(false);
  const [detectiveTestResult, setDetectiveTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // BOLO Alert Webhook State
  const [boloConfig, setBoloConfig] = useState<WebhookConfig>(() => getSavedBoloWebhookConfig());
  const [isTestingBolo, setIsTestingBolo] = useState(false);
  const [boloTestResult, setBoloTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Impound Lot Webhook State
  const [impoundConfig, setImpoundConfig] = useState<WebhookConfig>(() => getSavedImpoundWebhookConfig());
  const [isTestingImpound, setIsTestingImpound] = useState(false);
  const [impoundTestResult, setImpoundTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Vault & Weekly Audit Webhook State
  const [vaultConfig, setVaultConfig] = useState<WebhookConfig>(() => getSavedVaultWebhookConfig());
  const [isTestingVault, setIsTestingVault] = useState(false);
  const [vaultTestResult, setVaultTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Destruction / Smelting Webhook State
  const [destructionConfig, setDestructionConfig] = useState<WebhookConfig>(() => getSavedDestructionWebhookConfig());
  const [isTestingDestruction, setIsTestingDestruction] = useState(false);
  const [destructionTestResult, setDestructionTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Official Documents Archive Webhook State
  const [documentConfig, setDocumentConfig] = useState<WebhookConfig>(() => getSavedDocumentWebhookConfig());
  const [isTestingDocument, setIsTestingDocument] = useState(false);
  const [documentTestResult, setDocumentTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Dedicated Discord Bot (PM / DM Direct Message) State
  const [botConfig, setBotConfig] = useState<DiscordBotConfig>(() => getSavedDiscordBotConfig());
  const [showBotToken, setShowBotToken] = useState(false);
  const [testBotUserId, setTestBotUserId] = useState('');
  const [isTestingBot, setIsTestingBot] = useState(false);
  const [botTestResult, setBotTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string>('');

  if (!isOpen) return null;

  // Authorization check: High Command ranks only
  const isAuthorized = isOfficerHighRank(currentOfficer?.rank);
  if (!isAuthorized) {
    return (
      <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-xs font-mono text-xs">
        <div className="bg-[#161B22] border border-rose-800 rounded-xl max-w-md w-full p-5 shadow-2xl space-y-4 text-center">
          <div className="w-12 h-12 bg-rose-950/80 border border-rose-600 rounded-full flex items-center justify-center text-rose-400 mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-gray-100">Akses Ditolak (High Command Only)</h3>
          <p className="text-gray-400 text-xs">
            Hanya jajaran <strong>High Command</strong> (Chief of Police, Assistant Chief, Deputy Chief, Commander) yang memiliki wewenang untuk mengatur URL Discord Webhook.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded font-bold transition text-xs"
          >
            Tutup
          </button>
        </div>
      </div>
    );
  }

  // Test Case Webhook
  const handleTestCaseWebhook = async () => {
    setIsTestingCase(true);
    setCaseTestResult(null);
    try {
      const res = await testDiscordWebhook(caseConfig);
      setCaseTestResult(res);
    } catch (err: any) {
      setCaseTestResult({
        success: false,
        message: err.message || 'Gagal terhubung ke Discord Webhook'
      });
    } finally {
      setIsTestingCase(false);
    }
  };

  // Test Duty Webhook
  const handleTestDutyWebhook = async () => {
    setIsTestingDuty(true);
    setDutyTestResult(null);
    try {
      const res = await testDutyDiscordWebhook(dutyConfig);
      setDutyTestResult(res);
    } catch (err: any) {
      setDutyTestResult({
        success: false,
        message: err.message || 'Gagal terhubung ke Webhook Duty'
      });
    } finally {
      setIsTestingDuty(false);
    }
  };

  // Test Promotion Webhook
  const handleTestPromotionWebhook = async () => {
    setIsTestingPromotion(true);
    setPromotionTestResult(null);
    try {
      const res = await testPromotionDiscordWebhook(promotionConfig);
      setPromotionTestResult(res);
    } catch (err: any) {
      setPromotionTestResult({
        success: false,
        message: err.message || 'Gagal terhubung ke Webhook Promosi'
      });
    } finally {
      setIsTestingPromotion(false);
    }
  };

  // Test Warning Webhook
  const handleTestWarningWebhook = async () => {
    setIsTestingWarning(true);
    setWarningTestResult(null);
    try {
      const res = await testWarningDiscordWebhook(warningConfig);
      setWarningTestResult(res);
    } catch (err: any) {
      setWarningTestResult({
        success: false,
        message: err.message || 'Gagal terhubung ke Webhook Warning'
      });
    } finally {
      setIsTestingWarning(false);
    }
  };

  // Test Discharge Webhook
  const handleTestDischargeWebhook = async () => {
    setIsTestingDischarge(true);
    setDischargeTestResult(null);
    try {
      const res = await testDischargeDiscordWebhook(dischargeConfig);
      setDischargeTestResult(res);
    } catch (err: any) {
      setDischargeTestResult({
        success: false,
        message: err.message || 'Gagal terhubung ke Webhook Pemecatan'
      });
    } finally {
      setIsTestingDischarge(false);
    }
  };

  // Test PIN Reset Webhook
  const handleTestPinResetWebhook = async () => {
    setIsTestingPinReset(true);
    setPinResetTestResult(null);
    try {
      const res = await testPinResetDiscordWebhook(pinResetConfig);
      setPinResetTestResult(res);
    } catch (err: any) {
      setPinResetTestResult({
        success: false,
        message: err.message || 'Gagal terhubung ke Webhook Reset PIN'
      });
    } finally {
      setIsTestingPinReset(false);
    }
  };

  // Test Roster & Member Webhook
  const handleTestRosterWebhook = async () => {
    setIsTestingRoster(true);
    setRosterTestResult(null);
    try {
      const res = await testRosterDiscordWebhook(rosterConfig);
      setRosterTestResult(res);
    } catch (err: any) {
      setRosterTestResult({
        success: false,
        message: err.message || 'Gagal terhubung ke Webhook Roster'
      });
    } finally {
      setIsTestingRoster(false);
    }
  };

  // Test Detective / CID Webhook
  const handleTestDetectiveWebhook = async () => {
    setIsTestingDetective(true);
    setDetectiveTestResult(null);
    try {
      const res = await testDetectiveDiscordWebhook(detectiveConfig);
      setDetectiveTestResult(res);
    } catch (err: any) {
      setDetectiveTestResult({
        success: false,
        message: err.message || 'Gagal terhubung ke Webhook Kasus Detektif'
      });
    } finally {
      setIsTestingDetective(false);
    }
  };

  // Test BOLO Alert Webhook
  const handleTestBoloWebhook = async () => {
    setIsTestingBolo(true);
    setBoloTestResult(null);
    try {
      const res = await testBoloDiscordWebhook(boloConfig);
      setBoloTestResult(res);
    } catch (err: any) {
      setBoloTestResult({
        success: false,
        message: err.message || 'Gagal terhubung ke Webhook BOLO'
      });
    } finally {
      setIsTestingBolo(false);
    }
  };

  // Test Impound Lot Webhook
  const handleTestImpoundWebhook = async () => {
    setIsTestingImpound(true);
    setImpoundTestResult(null);
    try {
      const res = await testImpoundDiscordWebhook(impoundConfig);
      setImpoundTestResult(res);
    } catch (err: any) {
      setImpoundTestResult({
        success: false,
        message: err.message || 'Gagal terhubung ke Webhook Sitaan Impound'
      });
    } finally {
      setIsTestingImpound(false);
    }
  };

  // Test Vault & Weekly Audit Webhook
  const handleTestVaultWebhook = async () => {
    setIsTestingVault(true);
    setVaultTestResult(null);
    try {
      const res = await testVaultDiscordWebhook(vaultConfig);
      setVaultTestResult(res);
    } catch (err: any) {
      setVaultTestResult({
        success: false,
        message: err.message || 'Gagal terhubung ke Webhook Brankas & Audit Mingguan'
      });
    } finally {
      setIsTestingVault(false);
    }
  };

  // Test Destruction / Smelting Webhook
  const handleTestDestructionWebhook = async () => {
    setIsTestingDestruction(true);
    setDestructionTestResult(null);
    try {
      const res = await testDestructionDiscordWebhook(destructionConfig);
      setDestructionTestResult(res);
    } catch (err: any) {
      setDestructionTestResult({
        success: false,
        message: err.message || 'Gagal terhubung ke Webhook Peleburan Kendaraan & Senjata'
      });
    } finally {
      setIsTestingDestruction(false);
    }
  };

  // Test Official Document Archive Webhook
  const handleTestDocumentWebhook = async () => {
    setIsTestingDocument(true);
    setDocumentTestResult(null);
    try {
      const res = await testDocumentDiscordWebhook(documentConfig);
      setDocumentTestResult(res);
    } catch (err: any) {
      setDocumentTestResult({
        success: false,
        message: err.message || 'Gagal terhubung ke Webhook Arsip Dokumen'
      });
    } finally {
      setIsTestingDocument(false);
    }
  };

  // Test Direct Message via Discord Bot
  const handleTestBotDm = async () => {
    if (!testBotUserId.trim()) {
      setBotTestResult({
        success: false,
        message: 'Masukkan Discord User ID target untuk pengujian!'
      });
      return;
    }
    setIsTestingBot(true);
    setBotTestResult(null);
    try {
      const res = await testDiscordBotDirectMessage(testBotUserId.trim(), botConfig.botToken.trim());
      setBotTestResult(res);
    } catch (err: any) {
      setBotTestResult({
        success: false,
        message: err.message || 'Gagal mengirim Test PM via Bot Discord'
      });
    } finally {
      setIsTestingBot(false);
    }
  };

  // Save All Settings
  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    saveWebhookConfig(caseConfig);
    saveDutyWebhookConfig(dutyConfig);
    savePromotionWebhookConfig(promotionConfig);
    saveWarningWebhookConfig(warningConfig);
    saveDischargeWebhookConfig(dischargeConfig);
    savePinResetWebhookConfig(pinResetConfig);
    saveRosterWebhookConfig(rosterConfig);
    saveDetectiveWebhookConfig(detectiveConfig);
    saveBoloWebhookConfig(boloConfig);
    saveImpoundWebhookConfig(impoundConfig);
    saveVaultWebhookConfig(vaultConfig);
    saveDestructionWebhookConfig(destructionConfig);
    saveDocumentWebhookConfig(documentConfig);
    saveDiscordBotConfig(botConfig);
    setSaveSuccessNotice('✅ Seluruh konfigurasi Discord Webhook & Bot Direct Message (PM) berhasil disimpan!');
    if (onSaved) onSaved();
    setTimeout(() => {
      setSaveSuccessNotice('');
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150 font-mono text-xs">
      <div className="bg-[#161B22] border border-blue-800/80 rounded-xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Modal */}
        <div className="bg-[#0F1319] border-b border-gray-800 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="relative group shrink-0">
              <img
                src={HSPD_LOGO_URL}
                alt="HSPD Official Crest"
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-full object-contain drop-shadow-md border border-amber-500/40 bg-black/60 p-0.5"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-gray-100">
                  Konfigurasi Discord Webhook Integrasi
                </h3>
                <span className="text-[9px] bg-amber-950 text-amber-300 border border-amber-800 px-1.5 py-0.5 rounded font-bold flex items-center gap-1">
                  <span>👑 HIGH COMMAND</span>
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                Pengaturan server channel laporan kasus, dinas, pangkat, SP, pemecatan, PIN, roster, detektif, BOLO, impound, brankas 1x seminggu, peleburan, dan arsip dokumen resmi
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onOpenBrandingModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenBrandingModal();
                }}
                className="px-2.5 py-1.5 bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-600/70 hover:border-amber-400 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                title="Buka Studio Kustomisasi Logo & Background Website"
              >
                <Palette className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">🎨 UBAH LOGO & BACKGROUND</span>
                <span className="sm:hidden">LOGO</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Switcher - 13 Channels */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 lg:grid-cols-13 border-b border-gray-800 bg-[#0D1117] text-[10px]">
          <button
            type="button"
            onClick={() => setActiveTab('case')}
            className={`py-2 px-1 flex items-center justify-center gap-1 font-bold transition border-b-2 ${
              activeTab === 'case'
                ? 'border-blue-500 text-blue-400 bg-[#161B22]'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
            }`}
            title="Laporan Kasus & Tilang"
          >
            <Send className="w-3 h-3 shrink-0" />
            <span className="truncate">1. Kasus</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('duty')}
            className={`py-2 px-1 flex items-center justify-center gap-1 font-bold transition border-b-2 ${
              activeTab === 'duty'
                ? 'border-emerald-500 text-emerald-400 bg-[#161B22]'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
            }`}
            title="Log Dinas & Dispatch"
          >
            <Radio className="w-3 h-3 shrink-0" />
            <span className="truncate">2. Dinas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('promotion')}
            className={`py-2 px-1 flex items-center justify-center gap-1 font-bold transition border-b-2 ${
              activeTab === 'promotion'
                ? 'border-amber-500 text-amber-400 bg-[#161B22]'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
            }`}
            title="Kenaikan Pangkat"
          >
            <Award className="w-3 h-3 shrink-0" />
            <span className="truncate">3. Pangkat</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('warning')}
            className={`py-2 px-1 flex items-center justify-center gap-1 font-bold transition border-b-2 ${
              activeTab === 'warning'
                ? 'border-yellow-500 text-yellow-400 bg-[#161B22]'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
            }`}
            title="Surat Peringatan / SP"
          >
            <AlertTriangle className="w-3 h-3 shrink-0" />
            <span className="truncate">4. SP</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('discharge')}
            className={`py-2 px-1 flex items-center justify-center gap-1 font-bold transition border-b-2 ${
              activeTab === 'discharge'
                ? 'border-rose-500 text-rose-400 bg-[#161B22]'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
            }`}
            title="Pemberhentian / Pemecatan"
          >
            <UserX className="w-3 h-3 shrink-0" />
            <span className="truncate">5. Pecat</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pinReset')}
            className={`py-2 px-1 flex items-center justify-center gap-1 font-bold transition border-b-2 ${
              activeTab === 'pinReset'
                ? 'border-teal-500 text-teal-400 bg-[#161B22]'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
            }`}
            title="Reset PIN & Keamanan"
          >
            <KeyRound className="w-3 h-3 shrink-0" />
            <span className="truncate">6. PIN</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('roster')}
            className={`py-2 px-1 flex items-center justify-center gap-1 font-bold transition border-b-2 ${
              activeTab === 'roster'
                ? 'border-indigo-500 text-indigo-400 bg-[#161B22]'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
            }`}
            title="Data & Pengumuman Anggota"
          >
            <Users className="w-3 h-3 shrink-0" />
            <span className="truncate">7. Anggota</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('detective')}
            className={`py-2 px-1 flex items-center justify-center gap-1 font-bold transition border-b-2 ${
              activeTab === 'detective'
                ? 'border-purple-500 text-purple-400 bg-[#161B22]'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
            }`}
            title="Kasus Detektif / CID Case Board"
          >
            <Search className="w-3 h-3 shrink-0 text-purple-400" />
            <span className="truncate">8. Detektif</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('bolo')}
            className={`py-2 px-1 flex items-center justify-center gap-1 font-bold transition border-b-2 ${
              activeTab === 'bolo'
                ? 'border-red-500 text-red-400 bg-[#161B22]'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
            }`}
            title="Peringatan BOLO (Be On Look Out)"
          >
            <ShieldAlert className="w-3 h-3 shrink-0 text-red-400" />
            <span className="truncate">9. BOLO</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('impound')}
            className={`py-2 px-1 flex items-center justify-center gap-1 font-bold transition border-b-2 ${
              activeTab === 'impound'
                ? 'border-emerald-500 text-emerald-400 bg-[#161B22]'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
            }`}
            title="Sita Kendaraan & Impound Lot"
          >
            <Car className="w-3 h-3 shrink-0 text-emerald-400" />
            <span className="truncate">10. Impound</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('vault')}
            className={`py-2 px-1 flex items-center justify-center gap-1 font-bold transition border-b-2 ${
              activeTab === 'vault'
                ? 'border-amber-500 text-amber-400 bg-[#161B22]'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
            }`}
            title="Brankas & Audit Log Mingguan (1x Seminggu)"
          >
            <Landmark className="w-3 h-3 shrink-0 text-amber-400" />
            <span className="truncate">11. Brankas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('destruction')}
            className={`py-2 px-1 flex items-center justify-center gap-1 font-bold transition border-b-2 ${
              activeTab === 'destruction'
                ? 'border-orange-500 text-orange-400 bg-[#161B22]'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
            }`}
            title="Peleburan & Pemusnahan Kendaraan / Senjata"
          >
            <Flame className="w-3 h-3 shrink-0 text-orange-400" />
            <span className="truncate">12. Peleburan</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('document')}
            className={`py-2 px-1 flex items-center justify-center gap-1 font-bold transition border-b-2 ${
              activeTab === 'document'
                ? 'border-cyan-500 text-cyan-400 bg-[#161B22]'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
            }`}
            title="Arsip Surat & Dokumen Resmi Kepolisian"
          >
            <FileText className="w-3 h-3 shrink-0 text-cyan-400" />
            <span className="truncate">13. Dokumen</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('botDm')}
            className={`py-2 px-1 flex items-center justify-center gap-1 font-bold transition border-b-2 ${
              activeTab === 'botDm'
                ? 'border-sky-500 text-sky-400 bg-[#161B22]'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
            }`}
            title="Bot Discord Pesan Pribadi (PM / DM)"
          >
            <Bot className="w-3 h-3 shrink-0 text-sky-400" />
            <span className="truncate">14. Bot PM (DM)</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {saveSuccessNotice && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-600 rounded-lg text-emerald-200 flex items-center gap-2 text-xs font-bold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{saveSuccessNotice}</span>
            </div>
          )}

          {/* TAB 1: CASE / ARREST WEBHOOK */}
          {activeTab === 'case' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-950/30 border border-blue-900/60 rounded-lg text-[11px] text-blue-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-blue-200">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Channel Laporan Kasus Pidana / Tilang / Penjara</span>
                </div>
                <p className="text-gray-400">
                  Laporan kasus beserta data pelanggar, nominal denda, hukuman penjara, dan foto barang bukti (hingga 10 foto) akan dikirim otomatis ke channel ini.
                </p>
              </div>

              {/* Webhook URL Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-300 uppercase block">
                  URL Discord Webhook Laporan Kasus:
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={caseConfig.webhookUrl}
                    onChange={(e) => setCaseConfig({ ...caseConfig, webhookUrl: e.target.value })}
                    placeholder="https://discord.com/api/webhooks/..."
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 focus:border-blue-500 rounded text-xs text-blue-300 font-mono outline-none"
                  />
                  {caseConfig.webhookUrl && (
                    <button
                      type="button"
                      onClick={() => setCaseConfig({ ...caseConfig, webhookUrl: '' })}
                      className="absolute right-2 top-2 text-gray-500 hover:text-gray-300"
                      title="Bersihkan URL"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <span className="text-[10px] text-gray-500 block">
                  Dapatkan Webhook URL dari Channel Discord &gt; Edit Channel &gt; Integrations &gt; Webhooks.
                </span>
              </div>

              {/* Bot Customization Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-300 uppercase block">
                    Nama Bot Tampilan (Username):
                  </label>
                  <input
                    type="text"
                    value={caseConfig.botName}
                    onChange={(e) => setCaseConfig({ ...caseConfig, botName: e.target.value })}
                    placeholder="HSPD CAD System"
                    className="w-full px-3 py-1.5 bg-[#0D1117] border border-gray-700 focus:border-blue-500 rounded text-xs text-gray-200 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-300 uppercase block">
                    URL Avatar Bot (Icon):
                  </label>
                  <input
                    type="url"
                    value={caseConfig.botAvatar}
                    onChange={(e) => setCaseConfig({ ...caseConfig, botAvatar: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-1.5 bg-[#0D1117] border border-gray-700 focus:border-blue-500 rounded text-xs text-gray-200 outline-none"
                  />
                </div>
              </div>

              {/* Auto Send Toggle */}
              <div className="p-3 bg-[#0D1117] border border-gray-800 rounded-lg flex items-center justify-between">
                <div>
                  <div className="font-bold text-gray-200 text-xs">Kirim Otomatis saat Simpan Kasus</div>
                  <div className="text-[10px] text-gray-400">Otomatis mengirim embed Discord saat petugas menekan tombol &apos;Simpan Kasus&apos;</div>
                </div>
                <input
                  type="checkbox"
                  checked={caseConfig.autoSendOnSave}
                  onChange={(e) => setCaseConfig({ ...caseConfig, autoSendOnSave: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-700 text-blue-600 focus:ring-0 cursor-pointer"
                />
              </div>

              {/* Test Connection Button & Result */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleTestCaseWebhook}
                  disabled={isTestingCase || !caseConfig.webhookUrl.trim()}
                  className="w-full py-2 bg-gray-800 hover:bg-blue-900/40 text-blue-300 border border-blue-700/50 hover:border-blue-500 rounded font-bold transition flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  {isTestingCase ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Menguji Koneksi Webhook Kasus...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>UJI COBA PING WEBHOOK KASUS (TEST EMBED)</span>
                    </>
                  )}
                </button>

                {caseTestResult && (
                  <div className={`p-2.5 rounded border text-xs flex items-center gap-2 ${
                    caseTestResult.success 
                      ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300' 
                      : 'bg-rose-950/60 border-rose-700 text-rose-300'
                  }`}>
                    {caseTestResult.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    )}
                    <span>{caseTestResult.message}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: DUTY LOG WEBHOOK */}
          {activeTab === 'duty' && (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-950/30 border border-emerald-900/60 rounded-lg text-[11px] text-emerald-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-emerald-200">
                  <Radio className="w-3.5 h-3.5" />
                  <span>Channel Log Absensi Dinas Petugas (10-8 / 10-7 / 10-6)</span>
                </div>
                <p className="text-gray-400">
                  Setiap pergantian status dinas (Mulai Patroli 10-8, Selesai Dinas 10-7 dengan durasi shift) akan dikirimkan ke channel Discord ini.
                </p>
              </div>

              {/* Webhook URL Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-300 uppercase block">
                  URL Discord Webhook Log Dinas:
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={dutyConfig.webhookUrl}
                    onChange={(e) => setDutyConfig({ ...dutyConfig, webhookUrl: e.target.value })}
                    placeholder="https://discord.com/api/webhooks/..."
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 focus:border-emerald-500 rounded text-xs text-emerald-300 font-mono outline-none"
                  />
                  {dutyConfig.webhookUrl && (
                    <button
                      type="button"
                      onClick={() => setDutyConfig({ ...dutyConfig, webhookUrl: '' })}
                      className="absolute right-2 top-2 text-gray-500 hover:text-gray-300"
                      title="Bersihkan URL"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <span className="text-[10px] text-gray-500 block">
                  Bisa menggunakan channel terpisah dari Laporan Kasus agar channel terorganisir rapi.
                </span>
              </div>

              {/* Bot Customization Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-300 uppercase block">
                    Nama Bot Log Dinas:
                  </label>
                  <input
                    type="text"
                    value={dutyConfig.botName}
                    onChange={(e) => setDutyConfig({ ...dutyConfig, botName: e.target.value })}
                    placeholder="HSPD Duty Logger"
                    className="w-full px-3 py-1.5 bg-[#0D1117] border border-gray-700 focus:border-emerald-500 rounded text-xs text-gray-200 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-300 uppercase block">
                    URL Avatar Bot:
                  </label>
                  <input
                    type="url"
                    value={dutyConfig.botAvatar}
                    onChange={(e) => setDutyConfig({ ...dutyConfig, botAvatar: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-1.5 bg-[#0D1117] border border-gray-700 focus:border-emerald-500 rounded text-xs text-gray-200 outline-none"
                  />
                </div>
              </div>

              {/* Auto Send Toggle */}
              <div className="p-3 bg-[#0D1117] border border-gray-800 rounded-lg flex items-center justify-between">
                <div>
                  <div className="font-bold text-gray-200 text-xs">Kirim Otomatis saat Ganti Status Tugas</div>
                  <div className="text-[10px] text-gray-400">Otomatis mengirim log dinas saat anggota mengaktifkan 10-8 atau 10-7</div>
                </div>
                <input
                  type="checkbox"
                  checked={dutyConfig.autoSendOnSave}
                  onChange={(e) => setDutyConfig({ ...dutyConfig, autoSendOnSave: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-700 text-emerald-600 focus:ring-0 cursor-pointer"
                />
              </div>

              {/* Test Connection Button & Result */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleTestDutyWebhook}
                  disabled={isTestingDuty || !dutyConfig.webhookUrl.trim()}
                  className="w-full py-2 bg-gray-800 hover:bg-emerald-900/40 text-emerald-300 border border-emerald-700/50 hover:border-emerald-500 rounded font-bold transition flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  {isTestingDuty ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Menguji Koneksi Webhook Duty...</span>
                    </>
                  ) : (
                    <>
                      <Radio className="w-3.5 h-3.5" />
                      <span>UJI COBA PING WEBHOOK LOG DINAS (TEST EMBED)</span>
                    </>
                  )}
                </button>

                {dutyTestResult && (
                  <div className={`p-2.5 rounded border text-xs flex items-center gap-2 ${
                    dutyTestResult.success 
                      ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300' 
                      : 'bg-rose-950/60 border-rose-700 text-rose-300'
                  }`}>
                    {dutyTestResult.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    )}
                    <span>{dutyTestResult.message}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: PROMOTION / KENAIKAN PANGKAT WEBHOOK */}
          {activeTab === 'promotion' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-950/30 border border-amber-900/60 rounded-lg text-[11px] text-amber-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-200">
                  <Award className="w-3.5 h-3.5" />
                  <span>Channel Pengumuman Kenaikan Pangkat & Promosi Jabatan (SK Resmi)</span>
                </div>
                <p className="text-gray-400">
                  Pengumuman resmi kenaikan pangkat (SK Promosi) personel kepolisian oleh jajaran High Command akan disiarkan langsung ke channel Discord ini dengan format embed emas kehormatan.
                </p>
              </div>

              {/* Webhook URL Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-300 uppercase block">
                  URL Discord Webhook Kenaikan Pangkat:
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={promotionConfig.webhookUrl}
                    onChange={(e) => setPromotionConfig({ ...promotionConfig, webhookUrl: e.target.value })}
                    placeholder="https://discord.com/api/webhooks/..."
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 focus:border-amber-500 rounded text-xs text-amber-300 font-mono outline-none"
                  />
                  {promotionConfig.webhookUrl && (
                    <button
                      type="button"
                      onClick={() => setPromotionConfig({ ...promotionConfig, webhookUrl: '' })}
                      className="absolute right-2 top-2 text-gray-500 hover:text-gray-300"
                      title="Bersihkan URL"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <span className="text-[10px] text-gray-500 block">
                  Gunakan channel pengumuman promosi / mutasi jabatan (misal: #announcements atau #promotion-board).
                </span>
              </div>

              {/* Bot Customization Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-300 uppercase block">
                    Nama Bot Promosi:
                  </label>
                  <input
                    type="text"
                    value={promotionConfig.botName}
                    onChange={(e) => setPromotionConfig({ ...promotionConfig, botName: e.target.value })}
                    placeholder="HSPD Promotion Board & HQ"
                    className="w-full px-3 py-1.5 bg-[#0D1117] border border-gray-700 focus:border-amber-500 rounded text-xs text-gray-200 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-300 uppercase block">
                    URL Avatar Bot:
                  </label>
                  <input
                    type="url"
                    value={promotionConfig.botAvatar}
                    onChange={(e) => setPromotionConfig({ ...promotionConfig, botAvatar: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-1.5 bg-[#0D1117] border border-gray-700 focus:border-amber-500 rounded text-xs text-gray-200 outline-none"
                  />
                </div>
              </div>

              {/* Auto Send Toggle */}
              <div className="p-3 bg-[#0D1117] border border-gray-800 rounded-lg flex items-center justify-between">
                <div>
                  <div className="font-bold text-gray-200 text-xs">Kirim Otomatis saat Simpan Perubahan Pangkat</div>
                  <div className="text-[10px] text-gray-400">Otomatis mengirimkan pengumuman promosi ke Discord saat rank personel dinaikkan di CAD</div>
                </div>
                <input
                  type="checkbox"
                  checked={promotionConfig.autoSendOnSave}
                  onChange={(e) => setPromotionConfig({ ...promotionConfig, autoSendOnSave: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-700 text-amber-600 focus:ring-0 cursor-pointer"
                />
              </div>

              {/* Test Connection Button & Result */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleTestPromotionWebhook}
                  disabled={isTestingPromotion || !promotionConfig.webhookUrl.trim()}
                  className="w-full py-2 bg-gray-800 hover:bg-amber-900/40 text-amber-300 border border-amber-700/50 hover:border-amber-500 rounded font-bold transition flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  {isTestingPromotion ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Menguji Koneksi Webhook Kenaikan Pangkat...</span>
                    </>
                  ) : (
                    <>
                      <Award className="w-3.5 h-3.5" />
                      <span>UJI COBA PING WEBHOOK PROMOSI PANGKAT (TEST EMBED)</span>
                    </>
                  )}
                </button>

                {promotionTestResult && (
                  <div className={`p-2.5 rounded border text-xs flex items-center gap-2 ${
                    promotionTestResult.success 
                      ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300' 
                      : 'bg-rose-950/60 border-rose-700 text-rose-300'
                  }`}>
                    {promotionTestResult.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    )}
                    <span>{promotionTestResult.message}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: WARNING / SP WEBHOOK */}
          {activeTab === 'warning' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-950/30 border border-amber-900/60 rounded-lg text-[11px] text-amber-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-200">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Channel Surat Peringatan / Disiplin Anggota (SP1, SP2, SP3)</span>
                </div>
                <p className="text-gray-400">
                  Setiap tindakan pendisiplinan dan pemberian surat peringatan (Strike 1 s/d 3) kepada personel akan dikirimkan secara transparan ke channel Discord ini.
                </p>
              </div>

              {/* Webhook URL Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-300 uppercase block">
                  URL Discord Webhook Surat Peringatan (SP):
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={warningConfig.webhookUrl}
                    onChange={(e) => setWarningConfig({ ...warningConfig, webhookUrl: e.target.value })}
                    placeholder="https://discord.com/api/webhooks/..."
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 focus:border-amber-500 rounded text-xs text-amber-300 font-mono outline-none"
                  />
                  {warningConfig.webhookUrl && (
                    <button
                      type="button"
                      onClick={() => setWarningConfig({ ...warningConfig, webhookUrl: '' })}
                      className="absolute right-2 top-2 text-gray-500 hover:text-gray-300"
                      title="Bersihkan URL"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <span className="text-[10px] text-gray-500 block">
                  Gunakan channel khusus Internal Affairs / Log Disiplin Anggota.
                </span>
              </div>

              {/* Bot Customization Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-300 uppercase block">
                    Nama Bot SP / Warning:
                  </label>
                  <input
                    type="text"
                    value={warningConfig.botName}
                    onChange={(e) => setWarningConfig({ ...warningConfig, botName: e.target.value })}
                    placeholder="HSPD Internal Affairs"
                    className="w-full px-3 py-1.5 bg-[#0D1117] border border-gray-700 focus:border-amber-500 rounded text-xs text-gray-200 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-300 uppercase block">
                    URL Avatar Bot:
                  </label>
                  <input
                    type="url"
                    value={warningConfig.botAvatar}
                    onChange={(e) => setWarningConfig({ ...warningConfig, botAvatar: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-1.5 bg-[#0D1117] border border-gray-700 focus:border-amber-500 rounded text-xs text-gray-200 outline-none"
                  />
                </div>
              </div>

              {/* Auto Send Toggle */}
              <div className="p-3 bg-[#0D1117] border border-gray-800 rounded-lg flex items-center justify-between">
                <div>
                  <div className="font-bold text-gray-200 text-xs">Kirim Otomatis saat Memberi SP / Strike</div>
                  <div className="text-[10px] text-gray-400">Otomatis mengirim embed Discord saat High Command menerbitkan SP ke personel</div>
                </div>
                <input
                  type="checkbox"
                  checked={warningConfig.autoSendOnSave}
                  onChange={(e) => setWarningConfig({ ...warningConfig, autoSendOnSave: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-700 text-amber-600 focus:ring-0 cursor-pointer"
                />
              </div>

              {/* Test Connection Button & Result */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleTestWarningWebhook}
                  disabled={isTestingWarning || !warningConfig.webhookUrl.trim()}
                  className="w-full py-2 bg-gray-800 hover:bg-amber-900/40 text-amber-300 border border-amber-700/50 hover:border-amber-500 rounded font-bold transition flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  {isTestingWarning ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Menguji Koneksi Webhook Warning...</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>UJI COBA PING WEBHOOK SURAT PERINGATAN (TEST EMBED)</span>
                    </>
                  )}
                </button>

                {warningTestResult && (
                  <div className={`p-2.5 rounded border text-xs flex items-center gap-2 ${
                    warningTestResult.success 
                      ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300' 
                      : 'bg-rose-950/60 border-rose-700 text-rose-300'
                  }`}>
                    {warningTestResult.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    )}
                    <span>{warningTestResult.message}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: DISCHARGE / PEMECATAN WEBHOOK */}
          {activeTab === 'discharge' && (
            <div className="space-y-4">
              <div className="p-3 bg-rose-950/30 border border-rose-900/60 rounded-lg text-[11px] text-rose-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-rose-200">
                  <UserX className="w-3.5 h-3.5" />
                  <span>Channel Surat Keputusan Pemberhentian Dinas (Pemecatan)</span>
                </div>
                <p className="text-gray-400">
                  Setiap keputusan pemecatan / pemberhentian dinas anggota oleh High Command akan dipublikasikan ke channel Discord ini beserta alasan dan data pelanggaran.
                </p>
              </div>

              {/* Webhook URL Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-300 uppercase block">
                  URL Discord Webhook Pemecatan Anggota:
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={dischargeConfig.webhookUrl}
                    onChange={(e) => setDischargeConfig({ ...dischargeConfig, webhookUrl: e.target.value })}
                    placeholder="https://discord.com/api/webhooks/..."
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 focus:border-rose-500 rounded text-xs text-rose-300 font-mono outline-none"
                  />
                  {dischargeConfig.webhookUrl && (
                    <button
                      type="button"
                      onClick={() => setDischargeConfig({ ...dischargeConfig, webhookUrl: '' })}
                      className="absolute right-2 top-2 text-gray-500 hover:text-gray-300"
                      title="Bersihkan URL"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <span className="text-[10px] text-gray-500 block">
                  Gunakan channel pengumuman / internal dinas kepolisian.
                </span>
              </div>

              {/* Bot Customization Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-300 uppercase block">
                    Nama Bot Pemecatan:
                  </label>
                  <input
                    type="text"
                    value={dischargeConfig.botName}
                    onChange={(e) => setDischargeConfig({ ...dischargeConfig, botName: e.target.value })}
                    placeholder="HSPD High Command Disciplinary"
                    className="w-full px-3 py-1.5 bg-[#0D1117] border border-gray-700 focus:border-rose-500 rounded text-xs text-gray-200 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-300 uppercase block">
                    URL Avatar Bot:
                  </label>
                  <input
                    type="url"
                    value={dischargeConfig.botAvatar}
                    onChange={(e) => setDischargeConfig({ ...dischargeConfig, botAvatar: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-1.5 bg-[#0D1117] border border-gray-700 focus:border-rose-500 rounded text-xs text-gray-200 outline-none"
                  />
                </div>
              </div>

              {/* Auto Send Toggle */}
              <div className="p-3 bg-[#0D1117] border border-gray-800 rounded-lg flex items-center justify-between">
                <div>
                  <div className="font-bold text-gray-200 text-xs">Kirim Otomatis saat Pemecatan Personel</div>
                  <div className="text-[10px] text-gray-400">Otomatis mengirim surat keputusan pemecatan ke Discord saat tombol pecat dikonfirmasi</div>
                </div>
                <input
                  type="checkbox"
                  checked={dischargeConfig.autoSendOnSave}
                  onChange={(e) => setDischargeConfig({ ...dischargeConfig, autoSendOnSave: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-700 text-rose-600 focus:ring-0 cursor-pointer"
                />
              </div>

              {/* Test Connection Button & Result */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleTestDischargeWebhook}
                  disabled={isTestingDischarge || !dischargeConfig.webhookUrl.trim()}
                  className="w-full py-2 bg-gray-800 hover:bg-rose-900/40 text-rose-300 border border-rose-700/50 hover:border-rose-500 rounded font-bold transition flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  {isTestingDischarge ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Menguji Koneksi Webhook Pemecatan...</span>
                    </>
                  ) : (
                    <>
                      <UserX className="w-3.5 h-3.5" />
                      <span>UJI COBA PING WEBHOOK PEMECATAN (TEST EMBED)</span>
                    </>
                  )}
                </button>

                {dischargeTestResult && (
                  <div className={`p-2.5 rounded border text-xs flex items-center gap-2 ${
                    dischargeTestResult.success 
                      ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300' 
                      : 'bg-rose-950/60 border-rose-700 text-rose-300'
                  }`}>
                    {dischargeTestResult.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    )}
                    <span>{dischargeTestResult.message}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: RESET PIN & OTORISASI KREDENSIAL WEBHOOK */}
          {activeTab === 'pinReset' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-3 bg-teal-950/40 border border-teal-800/80 rounded-lg flex items-start gap-3">
                <KeyRound className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-gray-200 text-xs">Integrasi Webhook Reset PIN & Otorisasi Kredensial MDT</h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Menerima notifikasi seketika saat petugas mengajukan <strong>Lupa / Reset Password</strong> di halaman Login MDT, serta menerbitkan log konfirmasi saat permohonan disetujui & PIN baru diperbarui oleh High Command.
                  </p>
                </div>
              </div>

              {/* Webhook URL Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-300">
                  URL Discord Webhook Channel Reset PIN <span className="text-teal-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={pinResetConfig.webhookUrl}
                    onChange={(e) => setPinResetConfig({ ...pinResetConfig, webhookUrl: e.target.value })}
                    placeholder="https://discord.com/api/webhooks/..."
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 focus:border-teal-500 rounded text-xs text-gray-200 font-mono outline-none"
                  />
                  {pinResetConfig.webhookUrl && (
                    <button
                      type="button"
                      onClick={() => setPinResetConfig({ ...pinResetConfig, webhookUrl: '' })}
                      className="absolute right-2.5 top-2 text-gray-500 hover:text-gray-300"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-gray-400">
                  Contoh channel: <code className="text-teal-400 bg-black/40 px-1 rounded">#mdt-pin-reset</code> atau <code className="text-teal-400 bg-black/40 px-1 rounded">#high-command-security-logs</code>
                </p>
              </div>

              {/* Bot Customization */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-300">
                    Nama Bot Discord (Custom)
                  </label>
                  <input
                    type="text"
                    value={pinResetConfig.botName}
                    onChange={(e) => setPinResetConfig({ ...pinResetConfig, botName: e.target.value })}
                    placeholder="HSPD Security & Credentials HQ"
                    className="w-full px-3 py-1.5 bg-[#0D1117] border border-gray-700 focus:border-teal-500 rounded text-xs text-gray-200 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-300">
                    URL Avatar Bot (Opsional)
                  </label>
                  <input
                    type="url"
                    value={pinResetConfig.botAvatar}
                    onChange={(e) => setPinResetConfig({ ...pinResetConfig, botAvatar: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-1.5 bg-[#0D1117] border border-gray-700 focus:border-teal-500 rounded text-xs text-gray-200 outline-none"
                  />
                </div>
              </div>

              {/* Auto Send Toggle */}
              <div className="p-3 bg-[#0D1117] border border-gray-800 rounded-lg flex items-center justify-between">
                <div>
                  <div className="font-bold text-gray-200 text-xs">Kirim Otomatis saat Permohonan & Otorisasi PIN</div>
                  <div className="text-[10px] text-gray-400">Otomatis mengirimkan embed ke Discord ketika permohonan diajukan atau disetujui oleh Atasan</div>
                </div>
                <input
                  type="checkbox"
                  checked={pinResetConfig.autoSendOnSave}
                  onChange={(e) => setPinResetConfig({ ...pinResetConfig, autoSendOnSave: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-700 text-teal-600 focus:ring-0 cursor-pointer"
                />
              </div>

              {/* Test Connection Button & Result */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleTestPinResetWebhook}
                  disabled={isTestingPinReset || !pinResetConfig.webhookUrl.trim()}
                  className="w-full py-2 bg-gray-800 hover:bg-teal-900/40 text-teal-300 border border-teal-700/50 hover:border-teal-500 rounded font-bold transition flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  {isTestingPinReset ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Menguji Koneksi Webhook Reset PIN...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>UJI COBA PING WEBHOOK RESET PIN (TEST EMBED)</span>
                    </>
                  )}
                </button>

                {pinResetTestResult && (
                  <div className={`p-2.5 rounded border text-xs flex items-center gap-2 ${
                    pinResetTestResult.success 
                      ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300' 
                      : 'bg-rose-950/60 border-rose-700 text-rose-300'
                  }`}>
                    {pinResetTestResult.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    )}
                    <span>{pinResetTestResult.message}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 7: DATA & INFORMASI ANGGOTA WEBHOOK */}
          {activeTab === 'roster' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-3 bg-indigo-950/40 border border-indigo-800/80 rounded-lg flex items-start gap-3">
                <Users className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-gray-200 text-xs">Integrasi Webhook Data & Informasi Anggota</h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Mempublikasikan pengumuman pelantikan anggota baru saat ditambahkan oleh High Command lewat tombol <strong>+ Tambah Anggota</strong>, serta log audit pembaruan data/divisi anggota.
                  </p>
                </div>
              </div>

              {/* Webhook URL Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-300">
                  URL Discord Webhook Channel Data Anggota <span className="text-indigo-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={rosterConfig.webhookUrl}
                    onChange={(e) => setRosterConfig({ ...rosterConfig, webhookUrl: e.target.value })}
                    placeholder="https://discord.com/api/webhooks/..."
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 focus:border-indigo-500 rounded text-xs text-gray-200 font-mono outline-none"
                  />
                  {rosterConfig.webhookUrl && (
                    <button
                      type="button"
                      onClick={() => setRosterConfig({ ...rosterConfig, webhookUrl: '' })}
                      className="absolute right-2.5 top-2 text-gray-500 hover:text-gray-300"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-gray-400">
                  Contoh channel: <code className="text-indigo-400 bg-black/40 px-1 rounded">#hspd-announcements</code>, <code className="text-indigo-400 bg-black/40 px-1 rounded">#anggota-updates</code>, atau <code className="text-indigo-400 bg-black/40 px-1 rounded">#database-personel</code>
                </p>
              </div>

              {/* Bot Customization */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-300">
                    Nama Bot Discord (Custom)
                  </label>
                  <input
                    type="text"
                    value={rosterConfig.botName}
                    onChange={(e) => setRosterConfig({ ...rosterConfig, botName: e.target.value })}
                    placeholder="HSPD Personnel & Anggota Bureau"
                    className="w-full px-3 py-1.5 bg-[#0D1117] border border-gray-700 focus:border-indigo-500 rounded text-xs text-gray-200 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-300">
                    URL Avatar Bot (Opsional)
                  </label>
                  <input
                    type="url"
                    value={rosterConfig.botAvatar}
                    onChange={(e) => setRosterConfig({ ...rosterConfig, botAvatar: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-1.5 bg-[#0D1117] border border-gray-700 focus:border-indigo-500 rounded text-xs text-gray-200 outline-none"
                  />
                </div>
              </div>

              {/* Auto Send Toggle */}
              <div className="p-3 bg-[#0D1117] border border-gray-800 rounded-lg flex items-center justify-between">
                <div>
                  <div className="font-bold text-gray-200 text-xs">Kirim Otomatis saat Registrasi & Update Anggota</div>
                  <div className="text-[10px] text-gray-400">Otomatis mengirim pengumuman anggota baru dan log perubahan data ke channel Discord</div>
                </div>
                <input
                  type="checkbox"
                  checked={rosterConfig.autoSendOnSave}
                  onChange={(e) => setRosterConfig({ ...rosterConfig, autoSendOnSave: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-700 text-indigo-600 focus:ring-0 cursor-pointer"
                />
              </div>

              {/* Test Connection Button & Result */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleTestRosterWebhook}
                  disabled={isTestingRoster || !rosterConfig.webhookUrl.trim()}
                  className="w-full py-2 bg-gray-800 hover:bg-indigo-900/40 text-indigo-300 border border-indigo-700/50 hover:border-indigo-500 rounded font-bold transition flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  {isTestingRoster ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Menguji Koneksi Webhook Data Anggota...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>UJI COBA PING WEBHOOK DATA ANGGOTA (TEST EMBED)</span>
                    </>
                  )}
                </button>

                {rosterTestResult && (
                  <div className={`p-2.5 rounded border text-xs flex items-center gap-2 ${
                    rosterTestResult.success 
                      ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300' 
                      : 'bg-rose-950/60 border-rose-700 text-rose-300'
                  }`}>
                    {rosterTestResult.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    )}
                    <span>{rosterTestResult.message}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 8: DETECTIVE / CID CASE BOARD WEBHOOK */}
          {activeTab === 'detective' && (
            <div className="space-y-4">
              <div className="p-3 bg-purple-950/30 border border-purple-900/60 rounded-lg text-[11px] text-purple-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-purple-200">
                  <Search className="w-3.5 h-3.5" />
                  <span>Channel Berkas Kasus Detektif (Detective Bureau / CID)</span>
                </div>
                <p className="text-gray-400">
                  Notifikasi pembukaan kasus baru, surat perintah penggeledahan/penangkapan (Warrant Issued), pengamanan barang bukti forensik, dan pembaruan berkas investigasi kejahatan terorganisir.
                </p>
              </div>

              {/* Webhook URL Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-300 uppercase block">
                  URL Discord Webhook Kasus Detektif (CID):
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={detectiveConfig.webhookUrl}
                    onChange={(e) => setDetectiveConfig({ ...detectiveConfig, webhookUrl: e.target.value })}
                    placeholder="https://discord.com/api/webhooks/..."
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 focus:border-purple-500 rounded text-xs text-purple-300 font-mono outline-none"
                  />
                  {detectiveConfig.webhookUrl && (
                    <button
                      type="button"
                      onClick={() => setDetectiveConfig({ ...detectiveConfig, webhookUrl: '' })}
                      className="absolute right-2.5 top-2 text-gray-500 hover:text-gray-300"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-gray-400">
                  Contoh channel: <code className="text-purple-400 bg-black/40 px-1 rounded">#cid-caseboard</code>, <code className="text-purple-400 bg-black/40 px-1 rounded">#detective-bureau</code>, atau <code className="text-purple-400 bg-black/40 px-1 rounded">#investigasi-kasus</code>
                </p>
              </div>

              {/* Bot Customization */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-300">
                    Nama Bot Discord (Custom)
                  </label>
                  <input
                    type="text"
                    value={detectiveConfig.botName}
                    onChange={(e) => setDetectiveConfig({ ...detectiveConfig, botName: e.target.value })}
                    placeholder="HSPD Detective Bureau & CID"
                    className="w-full px-3 py-1.5 bg-[#0D1117] border border-gray-700 focus:border-purple-500 rounded text-xs text-gray-200 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-300">
                    URL Avatar Bot (Opsional)
                  </label>
                  <input
                    type="url"
                    value={detectiveConfig.botAvatar}
                    onChange={(e) => setDetectiveConfig({ ...detectiveConfig, botAvatar: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-1.5 bg-[#0D1117] border border-gray-700 focus:border-purple-500 rounded text-xs text-gray-200 outline-none"
                  />
                </div>
              </div>

              {/* Auto Send Toggle */}
              <div className="p-3 bg-[#0D1117] border border-gray-800 rounded-lg flex items-center justify-between">
                <div>
                  <div className="font-bold text-gray-200 text-xs">Kirim Otomatis saat Buka Kasus & Update Berkas</div>
                  <div className="text-[10px] text-gray-400">Otomatis kirim berkas ke Discord saat kasus baru dibuat, warrant diterbitkan, atau bukti ditambahkan</div>
                </div>
                <input
                  type="checkbox"
                  checked={detectiveConfig.autoSendOnSave}
                  onChange={(e) => setDetectiveConfig({ ...detectiveConfig, autoSendOnSave: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-700 text-purple-600 focus:ring-0 cursor-pointer"
                />
              </div>

              {/* Test Connection Button & Result */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleTestDetectiveWebhook}
                  disabled={isTestingDetective || !detectiveConfig.webhookUrl.trim()}
                  className="w-full py-2 bg-gray-800 hover:bg-purple-900/40 text-purple-300 border border-purple-700/50 hover:border-purple-500 rounded font-bold transition flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  {isTestingDetective ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Menguji Koneksi Webhook Kasus Detektif...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-3.5 h-3.5" />
                      <span>UJI COBA PING WEBHOOK DETEKTIF / CID (TEST EMBED)</span>
                    </>
                  )}
                </button>

                {detectiveTestResult && (
                  <div className={`p-2.5 rounded border text-xs flex items-center gap-2 ${
                    detectiveTestResult.success 
                      ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300' 
                      : 'bg-rose-950/60 border-rose-700 text-rose-300'
                  }`}>
                    {detectiveTestResult.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    )}
                    <span>{detectiveTestResult.message}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 9: BOLO (BE ON LOOK OUT) DISPATCH WEBHOOK */}
          {activeTab === 'bolo' && (
            <div className="space-y-4">
              <div className="p-3 bg-red-950/30 border border-red-900/60 rounded-lg text-[11px] text-red-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-red-200">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Channel Siaga Peringatan BOLO (Be On Look Out / APB)</span>
                </div>
                <p className="text-gray-400">
                  Siaran taktis buronan kendaraan, tersangka berbahaya, dan target pencarian aktif ke seluruh unit patroli lapangan kepolisian.
                </p>
              </div>

              {/* Webhook URL Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-300 uppercase block">
                  URL Discord Webhook Siaga BOLO:
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={boloConfig.webhookUrl}
                    onChange={(e) => setBoloConfig({ ...boloConfig, webhookUrl: e.target.value })}
                    placeholder="https://discord.com/api/webhooks/..."
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 focus:border-red-500 rounded text-xs text-red-300 font-mono outline-none"
                  />
                  {boloConfig.webhookUrl && (
                    <button
                      type="button"
                      onClick={() => setBoloConfig({ ...boloConfig, webhookUrl: '' })}
                      className="absolute right-2.5 top-2 text-gray-500 hover:text-gray-300"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-gray-400">
                  Contoh channel: <code className="text-red-400 bg-black/40 px-1 rounded">#bolo-alerts</code>, <code className="text-red-400 bg-black/40 px-1 rounded">#dispatch-darurat</code>, atau <code className="text-red-400 bg-black/40 px-1 rounded">#apb-broadcast</code>
                </p>
              </div>

              {/* Bot Customization */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-300">
                    Nama Bot Discord (Custom)
                  </label>
                  <input
                    type="text"
                    value={boloConfig.botName}
                    onChange={(e) => setBoloConfig({ ...boloConfig, botName: e.target.value })}
                    placeholder="HSPD BOLO & Dispatch HQ"
                    className="w-full px-3 py-1.5 bg-[#0D1117] border border-gray-700 focus:border-red-500 rounded text-xs text-gray-200 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-300">
                    URL Avatar Bot (Opsional)
                  </label>
                  <input
                    type="url"
                    value={boloConfig.botAvatar}
                    onChange={(e) => setBoloConfig({ ...boloConfig, botAvatar: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-1.5 bg-[#0D1117] border border-gray-700 focus:border-red-500 rounded text-xs text-gray-200 outline-none"
                  />
                </div>
              </div>

              {/* Auto Send Toggle */}
              <div className="p-3 bg-[#0D1117] border border-gray-800 rounded-lg flex items-center justify-between">
                <div>
                  <div className="font-bold text-gray-200 text-xs">Kirim Otomatis saat Terbitkan Siaga BOLO</div>
                  <div className="text-[10px] text-gray-400">Otomatis mengirim siaran darurat ke Discord saat petugas menerbitkan peringatan BOLO baru</div>
                </div>
                <input
                  type="checkbox"
                  checked={boloConfig.autoSendOnSave}
                  onChange={(e) => setBoloConfig({ ...boloConfig, autoSendOnSave: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-700 text-red-600 focus:ring-0 cursor-pointer"
                />
              </div>

              {/* Test Connection Button & Result */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleTestBoloWebhook}
                  disabled={isTestingBolo || !boloConfig.webhookUrl.trim()}
                  className="w-full py-2 bg-gray-800 hover:bg-red-900/40 text-red-300 border border-red-700/50 hover:border-red-500 rounded font-bold transition flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  {isTestingBolo ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Menguji Koneksi Webhook BOLO...</span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>UJI COBA PING WEBHOOK SIAGA BOLO (TEST EMBED)</span>
                    </>
                  )}
                </button>

                {boloTestResult && (
                  <div className={`p-2.5 rounded border text-xs flex items-center gap-2 ${
                    boloTestResult.success 
                      ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300' 
                      : 'bg-rose-950/60 border-rose-700 text-rose-300'
                  }`}>
                    {boloTestResult.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    )}
                    <span>{boloTestResult.message}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 10: IMPOUND LOT WEBHOOK */}
          {activeTab === 'impound' && (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-950/30 border border-emerald-900/60 rounded-lg text-[11px] text-emerald-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-emerald-200">
                  <Car className="w-3.5 h-3.5" />
                  <span>Channel Rekor Penyitaan Kendaraan (Traffic Impound Lot)</span>
                </div>
                <p className="text-gray-400">
                  Pencatatan sitaan kendaraan karena pelanggaran lalu lintas berat, durasi sita, nominal biaya tebusan denda in-game, serta status serah terima kendaraan.
                </p>
              </div>

              {/* Webhook URL Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-300 uppercase block">
                  URL Discord Webhook Sita Kendaraan (Impound):
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={impoundConfig.webhookUrl}
                    onChange={(e) => setImpoundConfig({ ...impoundConfig, webhookUrl: e.target.value })}
                    placeholder="https://discord.com/api/webhooks/..."
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 focus:border-emerald-500 rounded text-xs text-emerald-300 font-mono outline-none"
                  />
                  {impoundConfig.webhookUrl && (
                    <button
                      type="button"
                      onClick={() => setImpoundConfig({ ...impoundConfig, webhookUrl: '' })}
                      className="absolute right-2.5 top-2 text-gray-500 hover:text-gray-300"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-gray-400">
                  Contoh channel: <code className="text-emerald-400 bg-black/40 px-1 rounded">#impound-lot</code>, <code className="text-emerald-400 bg-black/40 px-1 rounded">#sitaan-kendaraan</code>, atau <code className="text-emerald-400 bg-black/40 px-1 rounded">#traffic-enforcement</code>
                </p>
              </div>

              {/* Bot Customization */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-300">
                    Nama Bot Discord (Custom)
                  </label>
                  <input
                    type="text"
                    value={impoundConfig.botName}
                    onChange={(e) => setImpoundConfig({ ...impoundConfig, botName: e.target.value })}
                    placeholder="HSPD Traffic Enforcement & Impound Lot"
                    className="w-full px-3 py-1.5 bg-[#0D1117] border border-gray-700 focus:border-emerald-500 rounded text-xs text-gray-200 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-300">
                    URL Avatar Bot (Opsional)
                  </label>
                  <input
                    type="url"
                    value={impoundConfig.botAvatar}
                    onChange={(e) => setImpoundConfig({ ...impoundConfig, botAvatar: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-1.5 bg-[#0D1117] border border-gray-700 focus:border-emerald-500 rounded text-xs text-gray-200 outline-none"
                  />
                </div>
              </div>

              {/* Auto Send Toggle */}
              <div className="p-3 bg-[#0D1117] border border-gray-800 rounded-lg flex items-center justify-between">
                <div>
                  <div className="font-bold text-gray-200 text-xs">Kirim Otomatis saat Sita Kendaraan & Tebus</div>
                  <div className="text-[10px] text-gray-400">Otomatis mengirim data kendaraan yang disita dan status pelunasan tebusan ke channel Discord</div>
                </div>
                <input
                  type="checkbox"
                  checked={impoundConfig.autoSendOnSave}
                  onChange={(e) => setImpoundConfig({ ...impoundConfig, autoSendOnSave: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-700 text-emerald-600 focus:ring-0 cursor-pointer"
                />
              </div>

              {/* Test Connection Button & Result */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleTestImpoundWebhook}
                  disabled={isTestingImpound || !impoundConfig.webhookUrl.trim()}
                  className="w-full py-2 bg-gray-800 hover:bg-emerald-900/40 text-emerald-300 border border-emerald-700/50 hover:border-emerald-500 rounded font-bold transition flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  {isTestingImpound ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Menguji Koneksi Webhook Impound...</span>
                    </>
                  ) : (
                    <>
                      <Car className="w-3.5 h-3.5" />
                      <span>UJI COBA PING WEBHOOK SITAAN IMPOUND (TEST EMBED)</span>
                    </>
                  )}
                </button>

                {impoundTestResult && (
                  <div className={`p-2.5 rounded border text-xs flex items-center gap-2 ${
                    impoundTestResult.success 
                      ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300' 
                      : 'bg-rose-950/60 border-rose-700 text-rose-300'
                  }`}>
                    {impoundTestResult.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    )}
                    <span>{impoundTestResult.message}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 11: VAULT & WEEKLY AUDIT WEBHOOK */}
          {activeTab === 'vault' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-950/30 border border-amber-900/60 rounded-lg text-[11px] text-amber-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-200">
                  <Landmark className="w-3.5 h-3.5" />
                  <span>Channel Audit & Brankas Kepolisian (Update Rutin 1x Seminggu)</span>
                </div>
                <p className="text-gray-400">
                  Notifikasi laporan opname brankas, upload bukti berkas/dokumen mingguan, inventaris sitaan narkotika, senjata, peluru, dan kas operasional HSPD dikirim ke channel ini.
                </p>
              </div>

              {/* Webhook URL Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-300 uppercase block">
                  URL Discord Webhook Brankas & Audit Mingguan:
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={vaultConfig.webhookUrl}
                    onChange={(e) => setVaultConfig({ ...vaultConfig, webhookUrl: e.target.value })}
                    placeholder="https://discord.com/api/webhooks/..."
                    className="w-full pl-8 pr-3 py-2 bg-[#0D1117] border border-gray-700 focus:border-amber-500 rounded text-xs text-gray-200 outline-none"
                  />
                  <Globe className="w-4 h-4 text-gray-500 absolute left-2.5 top-2.5" />
                </div>
              </div>

              {/* Bot Customization */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-300">
                    Nama Bot / Webhook Sender
                  </label>
                  <input
                    type="text"
                    value={vaultConfig.botName}
                    onChange={(e) => setVaultConfig({ ...vaultConfig, botName: e.target.value })}
                    placeholder="HSPD Vault & Armory Audit"
                    className="w-full px-3 py-1.5 bg-[#0D1117] border border-gray-700 focus:border-amber-500 rounded text-xs text-gray-200 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-300">
                    URL Avatar Bot (Opsional)
                  </label>
                  <input
                    type="url"
                    value={vaultConfig.botAvatar}
                    onChange={(e) => setVaultConfig({ ...vaultConfig, botAvatar: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-1.5 bg-[#0D1117] border border-gray-700 focus:border-amber-500 rounded text-xs text-gray-200 outline-none"
                  />
                </div>
              </div>

              {/* Auto Send Toggle */}
              <div className="p-3 bg-[#0D1117] border border-gray-800 rounded-lg flex items-center justify-between">
                <div>
                  <div className="font-bold text-gray-200 text-xs">Kirim Otomatis saat Audit Brankas Disimpan</div>
                  <div className="text-[10px] text-gray-400">Otomatis mengirim rekap saldo kas, daftar sitaan obat/senjata, dan link dokumen audit mingguan</div>
                </div>
                <input
                  type="checkbox"
                  checked={vaultConfig.autoSendOnSave}
                  onChange={(e) => setVaultConfig({ ...vaultConfig, autoSendOnSave: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-700 text-amber-600 focus:ring-0 cursor-pointer"
                />
              </div>

              {/* Test Connection Button & Result */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleTestVaultWebhook}
                  disabled={isTestingVault || !vaultConfig.webhookUrl.trim()}
                  className="w-full py-2 bg-gray-800 hover:bg-amber-900/40 text-amber-300 border border-amber-700/50 hover:border-amber-500 rounded font-bold transition flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  {isTestingVault ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Menguji Koneksi Webhook Brankas...</span>
                    </>
                  ) : (
                    <>
                      <Landmark className="w-3.5 h-3.5" />
                      <span>UJI COBA PING WEBHOOK BRANKAS AUDIT (TEST EMBED)</span>
                    </>
                  )}
                </button>

                {vaultTestResult && (
                  <div className={`p-2.5 rounded border text-xs flex items-center gap-2 ${
                    vaultTestResult.success 
                      ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300' 
                      : 'bg-rose-950/60 border-rose-700 text-rose-300'
                  }`}>
                    {vaultTestResult.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    )}
                    <span>{vaultTestResult.message}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 12: DESTRUCTION / SMELTING REGISTRY WEBHOOK */}
          {activeTab === 'destruction' && (
            <div className="space-y-4">
              <div className="p-3 bg-orange-950/30 border border-orange-900/60 rounded-lg text-[11px] text-orange-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-orange-200">
                  <Flame className="w-3.5 h-3.5" />
                  <span>Channel Berita Acara Peleburan & Pemusnahan Sitaan</span>
                </div>
                <p className="text-gray-400">
                  Setiap kendaraan sitaan yang dilebur / di-scrap atau senjata api & barang bukti ilegal yang dimusnahkan akan dicatat dan dikirimkan Berita Acara resminya ke channel ini.
                </p>
              </div>

              {/* Webhook URL Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-300 uppercase block">
                  URL Discord Webhook Berita Acara Peleburan:
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={destructionConfig.webhookUrl}
                    onChange={(e) => setDestructionConfig({ ...destructionConfig, webhookUrl: e.target.value })}
                    placeholder="https://discord.com/api/webhooks/..."
                    className="w-full pl-8 pr-3 py-2 bg-[#0D1117] border border-gray-700 focus:border-orange-500 rounded text-xs text-gray-200 outline-none"
                  />
                  <Globe className="w-4 h-4 text-gray-500 absolute left-2.5 top-2.5" />
                </div>
              </div>

              {/* Bot Customization */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-300">
                    Nama Bot / Webhook Sender
                  </label>
                  <input
                    type="text"
                    value={destructionConfig.botName}
                    onChange={(e) => setDestructionConfig({ ...destructionConfig, botName: e.target.value })}
                    placeholder="HSPD Smelting & Destruction Registry"
                    className="w-full px-3 py-1.5 bg-[#0D1117] border border-gray-700 focus:border-orange-500 rounded text-xs text-gray-200 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-300">
                    URL Avatar Bot (Opsional)
                  </label>
                  <input
                    type="url"
                    value={destructionConfig.botAvatar}
                    onChange={(e) => setDestructionConfig({ ...destructionConfig, botAvatar: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-1.5 bg-[#0D1117] border border-gray-700 focus:border-orange-500 rounded text-xs text-gray-200 outline-none"
                  />
                </div>
              </div>

              {/* Auto Send Toggle */}
              <div className="p-3 bg-[#0D1117] border border-gray-800 rounded-lg flex items-center justify-between">
                <div>
                  <div className="font-bold text-gray-200 text-xs">Kirim Otomatis saat Pemusnahan / Peleburan Dilakukan</div>
                  <div className="text-[10px] text-gray-400">Otomatis mengirim rincian item, nomor registrasi, saksi, alasan pemusnahan, dan foto dokumentasi</div>
                </div>
                <input
                  type="checkbox"
                  checked={destructionConfig.autoSendOnSave}
                  onChange={(e) => setDestructionConfig({ ...destructionConfig, autoSendOnSave: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-700 text-orange-600 focus:ring-0 cursor-pointer"
                />
              </div>

              {/* Test Connection Button & Result */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleTestDestructionWebhook}
                  disabled={isTestingDestruction || !destructionConfig.webhookUrl.trim()}
                  className="w-full py-2 bg-gray-800 hover:bg-orange-900/40 text-orange-300 border border-orange-700/50 hover:border-orange-500 rounded font-bold transition flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  {isTestingDestruction ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Menguji Koneksi Webhook Peleburan...</span>
                    </>
                  ) : (
                    <>
                      <Flame className="w-3.5 h-3.5" />
                      <span>UJI COBA PING WEBHOOK PELEBURAN (TEST EMBED)</span>
                    </>
                  )}
                </button>

                {destructionTestResult && (
                  <div className={`p-2.5 rounded border text-xs flex items-center gap-2 ${
                    destructionTestResult.success 
                      ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300' 
                      : 'bg-rose-950/60 border-rose-700 text-rose-300'
                  }`}>
                    {destructionTestResult.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    )}
                    <span>{destructionTestResult.message}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 13: OFFICIAL DOCUMENTS ARCHIVE WEBHOOK */}
          {activeTab === 'document' && (
            <div className="space-y-4">
              <div className="p-3 bg-cyan-950/30 border border-cyan-900/60 rounded-lg text-[11px] text-cyan-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-cyan-200">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Channel Berkas & Arsip Dokumen Resmi Kepolisian (Studio Surat)</span>
                </div>
                <p className="text-gray-400">
                  Seluruh surat dinas yang diterbitkan melalui Studio Dokumen (seperti Surat Perintah Tugas, SKCK, Izin Senjata Api, Surat Peringatan Disiplin, Izin Keramaian, Surat Penyitaan, Memo Internal, dan Berita Acara Kepolisian) dapat diarsipkan dan dikirimkan otomatis ke channel Discord ini.
                </p>
              </div>

              {/* Webhook URL Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-300 uppercase block">
                  URL Discord Webhook Arsip Dokumen & Surat Resmi:
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={documentConfig.webhookUrl}
                    onChange={(e) => setDocumentConfig({ ...documentConfig, webhookUrl: e.target.value })}
                    placeholder="https://discord.com/api/webhooks/..."
                    className="w-full pl-8 pr-3 py-2 bg-[#0D1117] border border-gray-700 focus:border-cyan-500 rounded text-xs text-gray-200 outline-none"
                  />
                  <Globe className="w-4 h-4 text-gray-500 absolute left-2.5 top-2.5" />
                </div>
              </div>

              {/* Bot Customization */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-300">
                    Nama Bot / Webhook Sender
                  </label>
                  <input
                    type="text"
                    value={documentConfig.botName}
                    onChange={(e) => setDocumentConfig({ ...documentConfig, botName: e.target.value })}
                    placeholder="HSPD Document Archives & Legal Bureau"
                    className="w-full px-3 py-1.5 bg-[#0D1117] border border-gray-700 focus:border-cyan-500 rounded text-xs text-gray-200 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-300">
                    URL Avatar Bot (Opsional)
                  </label>
                  <input
                    type="url"
                    value={documentConfig.botAvatar}
                    onChange={(e) => setDocumentConfig({ ...documentConfig, botAvatar: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-1.5 bg-[#0D1117] border border-gray-700 focus:border-cyan-500 rounded text-xs text-gray-200 outline-none"
                  />
                </div>
              </div>

              {/* Auto Send Toggle */}
              <div className="p-3 bg-[#0D1117] border border-gray-800 rounded-lg flex items-center justify-between">
                <div>
                  <div className="font-bold text-gray-200 text-xs">Kirim Otomatis saat Surat Resmi Diterbitkan & Disimpan</div>
                  <div className="text-[10px] text-gray-400">Otomatis mengirim nomor registrasi, klasifikasi surat, pejabat penandatangan, subjek penerima, dan ringkasan klausul ke Discord</div>
                </div>
                <input
                  type="checkbox"
                  checked={documentConfig.autoSendOnSave}
                  onChange={(e) => setDocumentConfig({ ...documentConfig, autoSendOnSave: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-700 text-cyan-600 focus:ring-0 cursor-pointer"
                />
              </div>

              {/* Test Connection Button & Result */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleTestDocumentWebhook}
                  disabled={isTestingDocument || !documentConfig.webhookUrl.trim()}
                  className="w-full py-2 bg-gray-800 hover:bg-cyan-950 text-cyan-300 border border-cyan-700/50 hover:border-cyan-500 rounded font-bold transition flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  {isTestingDocument ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Menguji Koneksi Webhook Arsip Dokumen...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-3.5 h-3.5" />
                      <span>UJI COBA PING WEBHOOK ARSIP DOKUMEN (TEST EMBED)</span>
                    </>
                  )}
                </button>

                {documentTestResult && (
                  <div className={`p-2.5 rounded border text-xs flex items-center gap-2 ${
                    documentTestResult.success 
                      ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300' 
                      : 'bg-rose-950/60 border-rose-700 text-rose-300'
                  }`}>
                    {documentTestResult.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    )}
                    <span>{documentTestResult.message}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 14: DISCORD BOT DIRECT MESSAGE (PM / DM) */}
          {activeTab === 'botDm' && (
            <div className="space-y-4">
              {/* Header Info Banner */}
              <div className="p-3.5 bg-sky-950/40 border border-sky-800/80 rounded-lg text-[11px] text-sky-200 space-y-1.5 shadow-sm">
                <div className="flex items-center gap-2 font-bold text-sky-300 text-xs">
                  <Bot className="w-4 h-4 text-sky-400" />
                  <span>INTEGRASI BOT DISCORD — PESAN PRIBADI (PM / DIRECT MESSAGE)</span>
                </div>
                <p className="text-gray-300 leading-relaxed">
                  Fitur ini memungkinkan Bot Discord mengirimkan detail akun UCP & PIN login <strong>langsung ke kotak masuk Pesan Pribadi (PM / DM)</strong> Discord anggota yang didaftarkan, menjaga privasi kredensial login tanpa dibagikan di channel publik server.
                </p>
              </div>

              {/* Bot Token Configuration */}
              <div className="space-y-4 p-4 bg-[#0D1117] border border-gray-800 rounded-lg">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-gray-200">
                      DISCORD BOT TOKEN: <span className="text-rose-400">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowBotToken(!showBotToken)}
                      className="text-[10px] text-sky-400 hover:text-sky-300 flex items-center gap-1 transition"
                    >
                      {showBotToken ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{showBotToken ? 'Sembunyikan Token' : 'Tampilkan Token'}</span>
                    </button>
                  </div>
                  <input
                    type={showBotToken ? 'text' : 'password'}
                    value={botConfig.botToken}
                    onChange={(e) => setBotConfig({ ...botConfig, botToken: e.target.value })}
                    placeholder="Contoh: MTI1MDU1OT..."
                    className="w-full px-3 py-2 bg-[#161B22] border border-gray-700 focus:border-sky-500 rounded text-xs text-gray-200 outline-none font-mono"
                  />
                  <div className="text-[10px] text-gray-400 mt-1 flex items-center justify-between">
                    <span>Diperoleh dari <strong>Discord Developer Portal &gt; Bot &gt; Token</strong>.</span>
                    <a
                      href="https://discord.com/developers/applications"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-400 hover:underline flex items-center gap-1"
                    >
                      <span>Buka Developer Portal</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>

                {/* LOGO & AVATAR CUSTOMIZATION */}
                <div className="p-3 bg-[#161B22] border border-sky-900/60 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Image className="w-4 h-4 text-sky-400" />
                      <span className="font-bold text-xs text-gray-200 uppercase">PILIHAN LOGO / AVATAR BOT & EMBED:</span>
                    </div>
                    <span className="text-[10px] text-sky-300">Bisa dipilih preset atau ganti custom</span>
                  </div>

                  {/* Preset Logo Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {PRESET_DISCORD_BOT_LOGOS.map((preset, idx) => {
                      const isSelected = botConfig.botAvatar === preset.url;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setBotConfig({ ...botConfig, botAvatar: preset.url })}
                          className={`p-2 rounded-lg border text-left flex items-center gap-2 transition ${
                            isSelected 
                              ? 'bg-sky-950/80 border-sky-500 ring-1 ring-sky-500 text-sky-200' 
                              : 'bg-[#0D1117] border-gray-800 hover:border-gray-700 text-gray-400 hover:text-gray-200'
                          }`}
                        >
                          <img
                            src={preset.url}
                            alt={preset.name}
                            referrerPolicy="no-referrer"
                            className="w-7 h-7 rounded-full object-cover bg-black/40 p-0.5 border border-gray-700 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="text-[11px] font-bold truncate">{preset.name}</div>
                            <div className="text-[9px] text-gray-500 truncate">{preset.category}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom URL or Upload File */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 items-center">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-gray-400 mb-1">
                        URL Logo Kustom (PNG / JPG / WebP):
                      </label>
                      <input
                        type="url"
                        value={botConfig.botAvatar}
                        onChange={(e) => setBotConfig({ ...botConfig, botAvatar: e.target.value })}
                        placeholder="https://i.imgur.com/... atau link gambar"
                        className="w-full px-3 py-1.5 bg-[#0D1117] border border-gray-700 focus:border-sky-500 rounded text-xs text-gray-200 outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 mb-1">
                        Upload dari Komputer:
                      </label>
                      <label className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 hover:border-sky-500 rounded text-xs font-bold cursor-pointer transition">
                        <Upload className="w-3.5 h-3.5 text-sky-400" />
                        <span>Pilih Gambar</span>
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
                                if (dataUrl) setBotConfig({ ...botConfig, botAvatar: dataUrl });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Embed Content Customization */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-300 mb-1">
                      Nama Header Bot / Author:
                    </label>
                    <input
                      type="text"
                      value={botConfig.botName}
                      onChange={(e) => setBotConfig({ ...botConfig, botName: e.target.value })}
                      placeholder="Cek Akun | High State"
                      className="w-full px-3 py-1.5 bg-[#161B22] border border-gray-700 focus:border-sky-500 rounded text-xs text-gray-200 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-300 mb-1">
                      Judul Pesan Embed (Title):
                    </label>
                    <input
                      type="text"
                      value={botConfig.embedTitle || '✅ Berhasil!'}
                      onChange={(e) => setBotConfig({ ...botConfig, embedTitle: e.target.value })}
                      placeholder="✅ Berhasil!"
                      className="w-full px-3 py-1.5 bg-[#161B22] border border-gray-700 focus:border-sky-500 rounded text-xs text-gray-200 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-300 mb-1">
                    Deskripsi / Sub-Header Pesan:
                  </label>
                  <input
                    type="text"
                    value={botConfig.embedDescription || 'Berikut adalah detail dari akun UCP Anda:'}
                    onChange={(e) => setBotConfig({ ...botConfig, embedDescription: e.target.value })}
                    placeholder="Berikut adalah detail dari akun UCP Anda:"
                    className="w-full px-3 py-1.5 bg-[#161B22] border border-gray-700 focus:border-sky-500 rounded text-xs text-gray-200 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-300 mb-1">
                      Warna Aksen Embed (Hex):
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={botConfig.embedColor?.startsWith('#') ? botConfig.embedColor : '#00A8FF'}
                        onChange={(e) => setBotConfig({ ...botConfig, embedColor: e.target.value })}
                        className="w-8 h-8 rounded border border-gray-700 bg-transparent cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={botConfig.embedColor || '#00A8FF'}
                        onChange={(e) => setBotConfig({ ...botConfig, embedColor: e.target.value })}
                        placeholder="#00A8FF"
                        className="w-full px-3 py-1.5 bg-[#161B22] border border-gray-700 focus:border-sky-500 rounded text-xs text-gray-200 outline-none font-mono"
                      />
                    </div>
                    {/* Quick Color Presets */}
                    <div className="flex items-center gap-1.5 mt-1.5">
                      {[
                        { name: 'Blue', color: '#00A8FF' },
                        { name: 'Green', color: '#10B981' },
                        { name: 'Gold', color: '#EAB308' },
                        { name: 'Indigo', color: '#6366F1' },
                        { name: 'Red', color: '#EF4444' }
                      ].map((cp, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setBotConfig({ ...botConfig, embedColor: cp.color })}
                          className="w-5 h-5 rounded-full border border-white/20 transition hover:scale-110"
                          style={{ backgroundColor: cp.color }}
                          title={cp.name}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-300 mb-1">
                      Teks Footer Embed:
                    </label>
                    <input
                      type="text"
                      value={botConfig.footerText || 'Bot High State'}
                      onChange={(e) => setBotConfig({ ...botConfig, footerText: e.target.value })}
                      placeholder="Bot High State"
                      className="w-full px-3 py-1.5 bg-[#161B22] border border-gray-700 focus:border-sky-500 rounded text-xs text-gray-200 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-300 mb-1">
                    Catatan Privasi Bawah (Default Note):
                  </label>
                  <input
                    type="text"
                    value={botConfig.defaultNote}
                    onChange={(e) => setBotConfig({ ...botConfig, defaultNote: e.target.value })}
                    placeholder="Jangan beritahu informasi ini kepada orang lain!"
                    className="w-full px-3 py-1.5 bg-[#161B22] border border-gray-700 focus:border-sky-500 rounded text-xs text-gray-200 outline-none"
                  />
                </div>
              </div>

              {/* Live Preview of the Direct Message (Matches User's Reference Screenshot) */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-gray-400 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
                    <span>PREVIEW TAMPILAN PESAN PRIBADI (PM / DM DISCORD REAL-TIME):</span>
                  </div>
                  <span className="text-[10px] text-emerald-400">● Live Dynamic Preview</span>
                </div>

                <div className="bg-[#313338] border border-[#232428] rounded-xl p-4 text-white shadow-xl max-w-xl font-sans text-xs">
                  {/* Discord Chat Header simulation */}
                  <div className="flex items-start gap-3">
                    <img
                      src={botConfig.botAvatar || 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png'}
                      alt="Bot Avatar"
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full bg-black/40 shrink-0 object-cover border border-gray-700"
                    />
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-sm">High State Roleplay</span>
                        <span className="bg-[#5865F2] text-white text-[9px] font-bold px-1.5 py-0.2 rounded font-sans uppercase">
                          APP
                        </span>
                        <span className="text-[10px] text-gray-400">Hari ini pukul 12:40 AM</span>
                      </div>

                      {/* Discord Embed Box */}
                      <div 
                        className="bg-[#2B2D31] rounded-r-lg p-3.5 space-y-2.5 max-w-md shadow-md"
                        style={{ borderLeft: `4px solid ${botConfig.embedColor || '#00A8FF'}` }}
                      >
                        <div className="flex items-center gap-1.5">
                          <img
                            src={botConfig.botAvatar || 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png'}
                            alt="Embed Author"
                            referrerPolicy="no-referrer"
                            className="w-4 h-4 rounded-full object-cover"
                          />
                          <span className="font-bold text-xs text-gray-200">
                            {botConfig.botName || 'Cek Akun | High State'}
                          </span>
                        </div>

                        <div>
                          <div className="font-bold text-white text-sm flex items-center gap-1">
                            <span>{botConfig.embedTitle || '✅ Berhasil!'}</span>
                          </div>
                          <p className="text-gray-300 text-xs mt-0.5">
                            {botConfig.embedDescription || 'Berikut adalah detail dari akun UCP Anda:'}
                          </p>
                        </div>

                        <div className="space-y-2 pt-1 font-mono text-xs">
                          <div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase">UCP</div>
                            <div className="text-gray-100 font-semibold font-sans">Nexia</div>
                          </div>

                          <div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase">Pin Code</div>
                            <div className="text-amber-300 font-bold bg-[#1E1F22] px-2 py-0.5 rounded inline-block">20857</div>
                          </div>

                          <div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase">No. Badge & Pangkat</div>
                            <div className="text-gray-200 font-sans text-xs">
                              `#104` • POLICE OFFICER II [PO II]
                            </div>
                          </div>

                          <div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase">Divisi</div>
                            <div className="text-sky-300 font-sans text-xs">
                              Patrol Bureau
                            </div>
                          </div>

                          <div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase">Note</div>
                            <div className="text-gray-300 text-[11px] font-sans">
                              {botConfig.defaultNote || 'Jangan beritahu informasi ini kepada orang lain!'}
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-gray-700/50 pt-1.5 text-[9.5px] text-gray-400 font-sans flex items-center justify-between">
                          <span>{botConfig.footerText || 'Bot High State'} • Hari ini pukul 12:40 AM</span>
                          <img
                            src={botConfig.botAvatar || 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png'}
                            alt="Footer Icon"
                            className="w-3 h-3 rounded-full object-cover"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step-by-Step Interactive Guide */}
              <div className="p-3.5 bg-gray-900/90 border border-gray-800 rounded-lg space-y-2 text-[11px]">
                <div className="font-bold text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>PANDUAN LENGKAP MEMBUAT BOT & MENGAMBIL USER ID (1 MENIT):</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-gray-300">
                  <div className="bg-[#161B22] p-2.5 rounded border border-gray-800 space-y-1">
                    <div className="font-bold text-sky-300 text-xs">1. Setup Bot di Discord Portal:</div>
                    <ol className="list-decimal list-inside space-y-1 text-[10px] text-gray-400">
                      <li>Buka <a href="https://discord.com/developers/applications" target="_blank" rel="noreferrer" className="text-sky-400 underline">Discord Developer Portal</a> &gt; <strong>New Application</strong>.</li>
                      <li>Klik menu <strong>Bot</strong> &gt; Reset/Copy <strong>Token</strong> lalu tempel di atas.</li>
                      <li>Aktifkan <strong>Privileged Gateway Intents</strong> (centang <em>Server Members Intent</em>).</li>
                      <li>Buka <strong>OAuth2 &gt; URL Generator</strong> &gt; centang <code>bot</code> &gt; invite bot ke Server Discord Anda.</li>
                    </ol>
                  </div>

                  <div className="bg-[#161B22] p-2.5 rounded border border-gray-800 space-y-1">
                    <div className="font-bold text-emerald-300 text-xs">2. Cara Ambil Discord User ID:</div>
                    <ol className="list-decimal list-inside space-y-1 text-[10px] text-gray-400">
                      <li>Buka aplikasi Discord &gt; <strong>User Settings ⚙️</strong> &gt; <strong>Advanced</strong>.</li>
                      <li>Aktifkan toggle <strong>Developer Mode</strong>.</li>
                      <li>Klik kanan pada profil / nama anggota di Discord &gt; klik <strong>Copy User ID</strong> (17-20 digit angka).</li>
                      <li>Masukkan ID tersebut ke data anggota saat mendaftar atau kirim PM.</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Test DM Section */}
              <div className="p-3.5 bg-[#0D1117] border border-sky-800/60 rounded-lg space-y-3">
                <div className="font-bold text-gray-200 text-xs flex items-center gap-2">
                  <Send className="w-3.5 h-3.5 text-sky-400" />
                  <span>UJI COBA KIRIM PESAN PRIBADI (TEST PM / DM LANGSUNG):</span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <input
                    type="text"
                    value={testBotUserId}
                    onChange={(e) => setTestBotUserId(e.target.value)}
                    placeholder="Masukkan Discord User ID Anda (contoh: 842019283719001)"
                    className="w-full sm:flex-1 px-3 py-2 bg-[#161B22] border border-gray-700 focus:border-sky-500 rounded text-xs text-gray-200 outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleTestBotDm}
                    disabled={isTestingBot || !botConfig.botToken.trim()}
                    className="w-full sm:w-auto px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded text-xs transition flex items-center justify-center gap-2 disabled:opacity-40 shrink-0"
                  >
                    {isTestingBot ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Mengirim PM...</span>
                      </>
                    ) : (
                      <>
                        <Bot className="w-3.5 h-3.5" />
                        <span>KIRIM TEST PM</span>
                      </>
                    )}
                  </button>
                </div>

                {botTestResult && (
                  <div className={`p-2.5 rounded border text-xs flex items-center gap-2 animate-in fade-in ${
                    botTestResult.success 
                      ? 'bg-emerald-950/80 border-emerald-600 text-emerald-200' 
                      : 'bg-rose-950/80 border-rose-600 text-rose-200'
                  }`}>
                    {botTestResult.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    )}
                    <span>{botTestResult.message}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Privacy & High Command Security Note */}
          <div className="p-3 bg-gray-900/80 border border-gray-800 rounded-lg text-gray-400 text-[11px] flex items-start gap-2">
            <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-gray-200">Proteksi Keamanan:</strong> Seluruh konfigurasi Webhook ini dilindungi dan disembunyikan sepenuhnya dari tampilan publik/warga. Hanya akun dengan pangkat High Command ({isOfficerHighRank(currentOfficer?.rank) ? currentOfficer?.rank : 'High Command'}) yang dapat melihat dan memodifikasi konfigurasi ini.
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-[#0D1117] border-t border-gray-800 p-4 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded font-bold transition"
          >
            Tutup
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded shadow-lg shadow-blue-600/30 transition flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>SIMPAN SEMUA PENGATURAN WEBHOOK</span>
          </button>
        </div>
      </div>
    </div>
  );
};
