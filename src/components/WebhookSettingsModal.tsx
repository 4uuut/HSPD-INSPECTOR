import React, { useState } from 'react';
import { 
  Shield, Radio, Send, CheckCircle2, AlertCircle, RefreshCw, 
  X, Globe, Settings, Lock, Check, Copy, ExternalLink, Sparkles, Sliders,
  AlertTriangle, UserX, Award
} from 'lucide-react';
import { 
  getSavedWebhookConfig, saveWebhookConfig, 
  getSavedDutyWebhookConfig, saveDutyWebhookConfig, 
  getSavedPromotionWebhookConfig, savePromotionWebhookConfig,
  getSavedWarningWebhookConfig, saveWarningWebhookConfig,
  getSavedDischargeWebhookConfig, saveDischargeWebhookConfig,
  testDiscordWebhook, testDutyDiscordWebhook, 
  testPromotionDiscordWebhook,
  testWarningDiscordWebhook, testDischargeDiscordWebhook,
  WebhookConfig 
} from '../utils/discordWebhook';
import { OfficerProfile, isOfficerHighRank } from '../types';
import { HSPD_LOGO_URL } from '../assets/logo';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentOfficer?: OfficerProfile | null;
  onSaved?: () => void;
}

export const WebhookSettingsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentOfficer,
  onSaved
}) => {
  const [activeTab, setActiveTab] = useState<'case' | 'duty' | 'promotion' | 'warning' | 'discharge'>('case');
  
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

  // Save All Settings
  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    saveWebhookConfig(caseConfig);
    saveDutyWebhookConfig(dutyConfig);
    savePromotionWebhookConfig(promotionConfig);
    saveWarningWebhookConfig(warningConfig);
    saveDischargeWebhookConfig(dischargeConfig);
    setSaveSuccessNotice('✅ Seluruh konfigurasi Discord Webhook berhasil disimpan!');
    if (onSaved) onSaved();
    setTimeout(() => {
      setSaveSuccessNotice('');
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150 font-mono text-xs">
      <div className="bg-[#161B22] border border-blue-800/80 rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
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
                Pengaturan server channel laporan kasus, log dinas, kenaikan pangkat, SP warning, dan pemecatan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher - 5 Channels */}
        <div className="grid grid-cols-2 sm:grid-cols-5 border-b border-gray-800 bg-[#0D1117] text-[11px]">
          <button
            type="button"
            onClick={() => setActiveTab('case')}
            className={`py-2.5 px-2 flex items-center justify-center gap-1.5 font-bold transition border-b-2 ${
              activeTab === 'case'
                ? 'border-blue-500 text-blue-400 bg-[#161B22]'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
            }`}
          >
            <Send className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">1. Kasus</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('duty')}
            className={`py-2.5 px-2 flex items-center justify-center gap-1.5 font-bold transition border-b-2 ${
              activeTab === 'duty'
                ? 'border-emerald-500 text-emerald-400 bg-[#161B22]'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
            }`}
          >
            <Radio className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">2. Log Dinas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('promotion')}
            className={`py-2.5 px-2 flex items-center justify-center gap-1.5 font-bold transition border-b-2 ${
              activeTab === 'promotion'
                ? 'border-amber-500 text-amber-400 bg-[#161B22]'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
            }`}
          >
            <Award className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">3. Kenaikan Pangkat</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('warning')}
            className={`py-2.5 px-2 flex items-center justify-center gap-1.5 font-bold transition border-b-2 ${
              activeTab === 'warning'
                ? 'border-yellow-500 text-yellow-400 bg-[#161B22]'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">4. SP / Warning</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('discharge')}
            className={`py-2.5 px-2 flex items-center justify-center gap-1.5 font-bold transition border-b-2 ${
              activeTab === 'discharge'
                ? 'border-rose-500 text-rose-400 bg-[#161B22]'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
            }`}
          >
            <UserX className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">5. Pemecatan</span>
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
