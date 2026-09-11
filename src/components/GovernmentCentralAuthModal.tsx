import React, { useState, useEffect } from 'react';
import {
  Crown,
  Lock,
  Globe,
  Send,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Building2,
  ShieldAlert,
  Radio,
  DollarSign,
  Scale,
  Sparkles,
  X,
  ExternalLink,
  Upload,
  PenTool,
  Check,
  RefreshCw,
  Sliders,
  Shield,
  Stamp as StampIcon,
  HelpCircle
} from 'lucide-react';
import { OfficialDocument, OfficerProfile, SealType } from '../types';
import { 
  getSavedGovDocumentWebhookConfig, 
  saveGovDocumentWebhookConfig, 
  testGovDocumentDiscordWebhook,
  sendGovOfficialDocumentToDiscord,
  getSavedGovRosterWebhookConfig,
  testGovRosterDiscordWebhook,
  getSavedGovPinResetWebhookConfig,
  testGovPinResetDiscordWebhook
} from '../utils/discordWebhook';
import { getStateSecurityStatus, StateSecurityStatus } from '../utils/governmentOperationsStorage';
import { DOCUMENT_PRESET_TEMPLATES } from '../data/documentTemplates';

interface GovernmentCentralAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentOfficer: OfficerProfile | null;
  activeDoc?: OfficialDocument;
  onUpdateDoc?: (updater: (prev: OfficialDocument) => OfficialDocument) => void;
  onNavigateToExecutiveHub?: () => void;
  onNavigateToRoster?: () => void;
  onOpenSignaturePad?: (target: 'acknowledged') => void;
}

export const GovernmentCentralAuthModal: React.FC<GovernmentCentralAuthModalProps> = ({
  isOpen,
  onClose,
  currentOfficer,
  activeDoc,
  onUpdateDoc,
  onNavigateToExecutiveHub,
  onNavigateToRoster,
  onOpenSignaturePad
}) => {
  const [activeTab, setActiveTab] = useState<'AUTH' | 'WEBHOOK' | 'FEATURES'>('AUTH');

  // Webhook State
  const [govDocWebhookUrl, setGovDocWebhookUrl] = useState('');
  const [govDocBotName, setGovDocBotName] = useState('Arsip & Dokumen Resmi Kenegaraan');
  const [govDocBotAvatar, setGovDocBotAvatar] = useState('https://cdn-icons-png.flaticon.com/512/3135/3135715.png');
  const [govDocAutoSend, setGovDocAutoSend] = useState(true);

  // Status & Feedback
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMsg, setTestMsg] = useState<string | null>(null);
  const [sendDocStatus, setSendDocStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [sendDocMsg, setSendDocMsg] = useState<string | null>(null);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  // Security Status from State
  const [securityStatus, setSecurityStatus] = useState<StateSecurityStatus>(getStateSecurityStatus);

  // Load saved configurations
  useEffect(() => {
    if (isOpen) {
      const cfg = getSavedGovDocumentWebhookConfig();
      setGovDocWebhookUrl(cfg.webhookUrl || '');
      setGovDocBotName(cfg.botName || 'Arsip & Dokumen Resmi Kenegaraan');
      setGovDocBotAvatar(cfg.botAvatar || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png');
      setGovDocAutoSend(cfg.autoSendOnSave !== false);
      setSecurityStatus(getStateSecurityStatus());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const showNotification = (msg: string) => {
    setFeedbackNotice(msg);
    setTimeout(() => setFeedbackNotice(null), 3500);
  };

  // Save Government Webhook settings
  const handleSaveWebhookConfig = () => {
    saveGovDocumentWebhookConfig({
      webhookUrl: govDocWebhookUrl,
      botName: govDocBotName,
      botAvatar: govDocBotAvatar,
      autoSendOnSave: govDocAutoSend
    });
    showNotification('✅ Pengaturan Discord Webhook Dokumen Kenegaraan berhasil disimpan!');
  };

  // Test Document Webhook
  const handleTestGovDocWebhook = async () => {
    setTestStatus('testing');
    setTestMsg(null);
    try {
      const res = await testGovDocumentDiscordWebhook({
        webhookUrl: govDocWebhookUrl,
        botName: govDocBotName,
        botAvatar: govDocBotAvatar,
        autoSendOnSave: govDocAutoSend
      });
      if (res.success) {
        setTestStatus('success');
        setTestMsg(res.message);
      } else {
        setTestStatus('error');
        setTestMsg(res.message);
      }
    } catch (e: any) {
      setTestStatus('error');
      setTestMsg(e.message || 'Gagal menguji webhook.');
    }
    setTimeout(() => {
      setTestStatus('idle');
    }, 5000);
  };

  // Send Current Active Document to Discord Webhook
  const handleSendActiveDocToGovWebhook = async () => {
    if (!activeDoc) {
      alert('Tidak ada dokumen aktif yang dapat dikirim.');
      return;
    }
    if (!govDocWebhookUrl.trim()) {
      alert('⚠️ Silakan masukkan URL Discord Webhook Dokumen Kenegaraan terlebih dahulu.');
      return;
    }

    setSendDocStatus('sending');
    setSendDocMsg(null);
    try {
      const res = await sendGovOfficialDocumentToDiscord(activeDoc, {
        webhookUrl: govDocWebhookUrl,
        botName: govDocBotName,
        botAvatar: govDocBotAvatar
      });
      if (res.success) {
        setSendDocStatus('success');
        setSendDocMsg(res.message);
        showNotification(`🚀 Dokumen "${activeDoc.title}" berhasil diarsip ke Discord Pemerintah!`);
      } else {
        setSendDocStatus('error');
        setSendDocMsg(res.message);
      }
    } catch (e: any) {
      setSendDocStatus('error');
      setSendDocMsg(e.message || 'Gagal mengirim dokumen.');
    }
    setTimeout(() => {
      setSendDocStatus('idle');
    }, 6000);
  };

  // Apply Quick Otorisasi Presets
  const applyAuthPreset = (preset: {
    title: string;
    name: string;
    rank: string;
    role: string;
    statusText: string;
    seal?: SealType;
    style?: 'formal' | 'handwriting1' | 'blank';
  }) => {
    if (!onUpdateDoc) return;
    onUpdateDoc(prev => ({
      ...prev,
      showAcknowledgedBySignature: true,
      acknowledgedByTitle: preset.title,
      acknowledgedByName: preset.name,
      acknowledgedByRank: preset.rank,
      acknowledgedByRole: preset.role,
      acknowledgedCustomStatus: preset.statusText,
      acknowledgedSignatureType: preset.style === 'blank' ? 'blank' : 'font',
      acknowledgedSignatureStyle: preset.style || 'formal',
      acknowledgedSignatureImage: undefined,
      ...(preset.seal ? { secondarySeal: preset.seal } : {})
    }));
    showNotification(`👑 Otorisasi Pusat berhasil diterapkan: ${preset.name} (${preset.rank})`);
  };

  // Clear Otorisasi
  const clearAuth = () => {
    if (!onUpdateDoc) return;
    onUpdateDoc(prev => ({
      ...prev,
      showAcknowledgedBySignature: false,
      acknowledgedByTitle: '',
      acknowledgedByName: '',
      acknowledgedByRank: '',
      acknowledgedByRole: '',
      acknowledgedCustomStatus: '',
      acknowledgedSignatureImage: undefined,
      acknowledgedSignatureType: 'blank',
      acknowledgedSignatureStyle: 'blank'
    }));
    showNotification('🗑️ Pengesahan Otorisasi Pusat telah dikosongkan.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-[#0D1117] border border-amber-500/70 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl shadow-amber-950/60 overflow-hidden text-gray-200 font-sans">
        
        {/* MODAL HEADER */}
        <div className="p-4 bg-gradient-to-r from-amber-950 via-yellow-950/80 to-[#161B22] border-b border-amber-600/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/60 flex items-center justify-center text-amber-300 shadow-md">
              <Crown className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-amber-200 tracking-wide uppercase font-mono">
                  OTORISASI PUSAT & INTEGRASI FITUR PEMERINTAHAN
                </h2>
                <span className="px-2 py-0.5 rounded bg-amber-500 text-black font-black text-[9px] font-mono">
                  EKSEKUTIF PUSAT
                </span>
              </div>
              <p className="text-xs text-amber-100/70 mt-0.5">
                Otorisasi Lembaran Kenegaraan, Webhook Discord Pemerintah & Akses Terpadu
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FEEDBACK BANNER */}
        {feedbackNotice && (
          <div className="bg-emerald-950 border-b border-emerald-600/70 text-emerald-200 px-4 py-2 text-xs font-mono flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedbackNotice}</span>
          </div>
        )}

        {/* SUB-TABS NAVIGATION */}
        <div className="flex items-center justify-between border-b border-gray-800 bg-[#161B22] px-4 pt-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('AUTH')}
              className={`px-4 py-2 text-xs font-bold font-mono rounded-t-lg transition flex items-center gap-2 border-t border-x ${
                activeTab === 'AUTH'
                  ? 'bg-[#0D1117] text-amber-300 border-amber-500/60 shadow-inner'
                  : 'text-gray-400 border-transparent hover:text-gray-200 hover:bg-gray-800/50'
              }`}
            >
              <Crown className="w-4 h-4 text-amber-400" />
              <span>👑 Otorisasi Dokumen</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('WEBHOOK')}
              className={`px-4 py-2 text-xs font-bold font-mono rounded-t-lg transition flex items-center gap-2 border-t border-x ${
                activeTab === 'WEBHOOK'
                  ? 'bg-[#0D1117] text-blue-300 border-blue-500/60 shadow-inner'
                  : 'text-gray-400 border-transparent hover:text-gray-200 hover:bg-gray-800/50'
              }`}
            >
              <Globe className="w-4 h-4 text-blue-400" />
              <span>🌐 Webhook Discord Pemerintah</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('FEATURES')}
              className={`px-4 py-2 text-xs font-bold font-mono rounded-t-lg transition flex items-center gap-2 border-t border-x ${
                activeTab === 'FEATURES'
                  ? 'bg-[#0D1117] text-emerald-300 border-emerald-500/60 shadow-inner'
                  : 'text-gray-400 border-transparent hover:text-gray-200 hover:bg-gray-800/50'
              }`}
            >
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span>🏛️ Fitur Eksekutif Kenegaraan</span>
            </button>
          </div>

          <div className="pb-2 text-[10px] font-mono text-gray-400 flex items-center gap-2">
            <span>Pejabat: <strong className="text-white">{currentOfficer?.name || 'Sipil'}</strong></span>
            <span className="text-amber-400">({currentOfficer?.rank || 'GOVERNMENT'})</span>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* ========================================================================= */}
          {/* TAB 1: OTORISASI PUSAT & PENGESAHAN DOKUMEN                               */}
          {/* ========================================================================= */}
          {activeTab === 'AUTH' && (
            <div className="space-y-4">
              {/* CURRENT STATUS PREVIEW */}
              <div className="p-3 bg-gradient-to-r from-black/70 to-amber-950/30 border border-amber-500/40 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
                <div>
                  <span className="text-gray-400 text-[10px] block mb-0.5">STATUS OTORISASI PADA DOKUMEN AKTIF:</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {activeDoc?.showAcknowledgedBySignature !== false && (!!activeDoc?.acknowledgedByName || !!activeDoc?.acknowledgedByRank) ? (
                      <>
                        <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-600 text-emerald-300 font-bold text-[10px] flex items-center gap-1">
                          <Check className="w-3 h-3" /> AKTIF TERCETAK
                        </span>
                        <span className="text-gray-300">
                          {activeDoc.acknowledgedByTitle || 'Otorisasi Pusat:'}{' '}
                          <strong className="text-white">{activeDoc.acknowledgedByName || 'Pemerintah Pusat'}</strong>{' '}
                          <span className="text-amber-300">({activeDoc.acknowledgedByRank || 'PRESIDENT'})</span>
                        </span>
                      </>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-gray-800 border border-gray-700 text-gray-400 text-[10px]">
                        DISEMBUNYIKAN / KOSONG
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={clearAuth}
                    className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-xs font-mono border border-gray-600 transition"
                  >
                    Kosongkan
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      applyAuthPreset({
                        title: 'Otorisasi Pusat:',
                        name: 'Momo Hatakeyama',
                        rank: 'PRESIDENT [RANK 6]',
                        role: 'Kepala Negara & Pemerintahan HighState',
                        statusText: 'DISAHKAN OLEH PEMERINTAH PUSAT & KANTOR KEPRESIDENAN',
                        seal: 'PRESIDENTIAL_SEAL',
                        style: 'formal'
                      });
                    }}
                    className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-black font-bold rounded text-xs font-mono shadow transition flex items-center gap-1"
                  >
                    <Crown className="w-3 h-3" />
                    <span>Presiden Momo</span>
                  </button>
                </div>
              </div>

              {/* QUICK PRESET SELECTION */}
              <div>
                <label className="block text-gray-300 text-xs font-bold font-mono mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>PILIHAN PRESET OTORISASI PUSAT (1-KLIK PASANG):</span>
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {/* Preset 1: Presiden Momo */}
                  <div 
                    onClick={() => applyAuthPreset({
                      title: 'Otorisasi Pusat:',
                      name: 'Momo Hatakeyama',
                      rank: 'PRESIDENT [RANK 6]',
                      role: 'Kepala Negara & Pemerintahan HighState',
                      statusText: 'DISAHKAN OLEH PEMERINTAH PUSAT & KANTOR KEPRESIDENAN',
                      seal: 'PRESIDENTIAL_SEAL',
                      style: 'formal'
                    })}
                    className="p-3 bg-[#161B22] hover:bg-amber-950/40 border border-amber-600/40 hover:border-amber-400 rounded-xl cursor-pointer transition group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-amber-300 font-bold text-xs flex items-center gap-1">
                        <Crown className="w-3.5 h-3.5" /> 👑 Presiden Negara HighState
                      </span>
                      <span className="text-[10px] text-amber-400 font-mono group-hover:underline">Pasang</span>
                    </div>
                    <p className="text-white text-xs font-bold font-mono">Momo Hatakeyama</p>
                    <p className="text-gray-400 text-[11px]">PRESIDENT [RANK 6] • Kepala Negara & Pemerintahan</p>
                    <p className="text-gray-400 text-[10px] mt-1 italic">
                      Cap: 👑 Presidential Seal • Status: Disahkan Kantor Kepresidenan
                    </p>
                  </div>

                  {/* Preset 2: Pejabat Login Saat Ini */}
                  <div 
                    onClick={() => applyAuthPreset({
                      title: 'Otorisasi Pusat:',
                      name: currentOfficer?.name || 'Pejabat Eksekutif',
                      rank: currentOfficer?.rank || 'DEWAN EKSEKUTIF',
                      role: currentOfficer?.division || 'Kantor Pemerintahan Negara',
                      statusText: 'DISAHKAN & DIAKREDITASI OLEH PEMERINTAHAN PUSAT',
                      seal: 'GOVERNMENT_SEAL',
                      style: 'formal'
                    })}
                    className="p-3 bg-[#161B22] hover:bg-blue-950/40 border border-blue-600/40 hover:border-blue-400 rounded-xl cursor-pointer transition group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-blue-300 font-bold text-xs flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" /> 🏛️ Pejabat Aktif Login ({currentOfficer?.name || 'Anda'})
                      </span>
                      <span className="text-[10px] text-blue-400 font-mono group-hover:underline">Pasang</span>
                    </div>
                    <p className="text-white text-xs font-bold font-mono">{currentOfficer?.name || 'Pejabat Eksekutif'}</p>
                    <p className="text-gray-400 text-[11px]">{currentOfficer?.rank || 'PEJABAT NEGARA'} • {currentOfficer?.division || 'Pemerintahan'}</p>
                    <p className="text-gray-400 text-[10px] mt-1 italic">
                      Cap: 🏛️ State Government Seal
                    </p>
                  </div>

                  {/* Preset 3: Sekretaris Negara / Kabinet */}
                  <div 
                    onClick={() => applyAuthPreset({
                      title: 'Otorisasi Pusat:',
                      name: 'State Secretariat',
                      rank: 'CABINET MINISTER [RANK 4]',
                      role: 'Biro Hukum & Tata Usaha Kenegaraan',
                      statusText: 'TERDAFTAR DALAM LEMBARAN NEGARA RESMI',
                      seal: 'GOVERNMENT_SEAL',
                      style: 'formal'
                    })}
                    className="p-3 bg-[#161B22] hover:bg-emerald-950/40 border border-emerald-600/40 hover:border-emerald-400 rounded-xl cursor-pointer transition group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-emerald-300 font-bold text-xs flex items-center gap-1">
                        <Scale className="w-3.5 h-3.5" /> ⚖️ Sekretariat Kabinet & Biro Hukum
                      </span>
                      <span className="text-[10px] text-emerald-400 font-mono group-hover:underline">Pasang</span>
                    </div>
                    <p className="text-white text-xs font-bold font-mono">State Secretariat of HighState</p>
                    <p className="text-gray-400 text-[11px]">CABINET MINISTER • Biro Hukum & Perundang-undangan</p>
                    <p className="text-gray-400 text-[10px] mt-1 italic">
                      Cap: 🏛️ Government Seal • Status: Lembaran Negara
                    </p>
                  </div>

                  {/* Preset 4: Chief of Police (Markas Besar) */}
                  <div 
                    onClick={() => applyAuthPreset({
                      title: 'Otorisasi Pusat:',
                      name: 'Leoarnd Neave',
                      rank: 'CHIEF OF POLICE [COP]',
                      role: 'Kepala Kepolisian HighState',
                      statusText: 'DISAHKAN & DIAKREDITASI OLEH MARKAS BESAR',
                      seal: 'HIGH_COMMAND',
                      style: 'formal'
                    })}
                    className="p-3 bg-[#161B22] hover:bg-yellow-950/40 border border-yellow-600/40 hover:border-yellow-400 rounded-xl cursor-pointer transition group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-yellow-300 font-bold text-xs flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5" /> 🛡️ Markas Besar Kepolisian (HSPD HQ)
                      </span>
                      <span className="text-[10px] text-yellow-400 font-mono group-hover:underline">Pasang</span>
                    </div>
                    <p className="text-white text-xs font-bold font-mono">Leoarnd Neave</p>
                    <p className="text-gray-400 text-[11px]">CHIEF OF POLICE [COP] • Kepala Kepolisian HighState</p>
                    <p className="text-gray-400 text-[10px] mt-1 italic">
                      Cap: 🟡 High Command Seal • Status: Markas Besar
                    </p>
                  </div>
                </div>
              </div>

              {/* DETAILED MANUAL EDITING FIELDS */}
              {activeDoc && onUpdateDoc && (
                <div className="p-3 bg-[#11141A] border border-gray-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-200 font-mono flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-amber-400" />
                      <span>RINCIAN TEKS OTORISASI DOKUMEN:</span>
                    </span>
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-mono">
                      <input
                        type="checkbox"
                        checked={activeDoc.showAcknowledgedBySignature !== false && (!!activeDoc.acknowledgedByName || !!activeDoc.acknowledgedByRank)}
                        onChange={(e) => onUpdateDoc(prev => ({ ...prev, showAcknowledgedBySignature: e.target.checked }))}
                        className="rounded border-gray-700 text-amber-500 accent-amber-500 cursor-pointer"
                      />
                      <span className="text-gray-300">Tampilkan pada Cetak Dokumen</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="flex items-center justify-between mb-1 text-[10px] font-mono text-gray-400">
                        <span>LABEL AWALAN:</span>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => onUpdateDoc(prev => ({ ...prev, acknowledgedByTitle: 'Otorisasi Pusat:' }))}
                            className="text-amber-400 hover:underline"
                          >
                            [Default]
                          </button>
                          <button
                            type="button"
                            onClick={() => onUpdateDoc(prev => ({ ...prev, acknowledgedByTitle: 'Mengetahui & Menyetujui,' }))}
                            className="text-blue-400 hover:underline"
                          >
                            [Mengetahui]
                          </button>
                          <button
                            type="button"
                            onClick={() => onUpdateDoc(prev => ({ ...prev, acknowledgedByTitle: '' }))}
                            className="text-gray-400 hover:underline"
                          >
                            [Kosongkan]
                          </button>
                        </div>
                      </div>
                      <input
                        type="text"
                        value={activeDoc.acknowledgedByTitle ?? 'Otorisasi Pusat:'}
                        onChange={(e) => onUpdateDoc(prev => ({ ...prev, acknowledgedByTitle: e.target.value }))}
                        className="w-full bg-[#161B22] border border-gray-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:border-amber-500 focus:outline-none"
                        placeholder="Otorisasi Pusat: / Mengetahui,"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1 text-[10px] font-mono text-gray-400">
                        <span>NAMA PENGESAH:</span>
                        <button
                          type="button"
                          onClick={() => onUpdateDoc(prev => ({ ...prev, acknowledgedByName: currentOfficer?.name || 'Momo Hatakeyama' }))}
                          className="text-amber-400 hover:underline"
                        >
                          [Pakai Nama Pejabat]
                        </button>
                      </div>
                      <input
                        type="text"
                        value={activeDoc.acknowledgedByName || ''}
                        onChange={(e) => onUpdateDoc(prev => ({ ...prev, acknowledgedByName: e.target.value }))}
                        className="w-full bg-[#161B22] border border-gray-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:border-amber-500 focus:outline-none"
                        placeholder="Momo Hatakeyama / Leoarnd Neave"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1 text-[10px] font-mono text-gray-400">
                        <span>PANGKAT & JABATAN:</span>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => onUpdateDoc(prev => ({ ...prev, acknowledgedByRank: 'PRESIDENT [RANK 6]' }))}
                            className="text-amber-400 hover:underline"
                          >
                            [President]
                          </button>
                          <button
                            type="button"
                            onClick={() => onUpdateDoc(prev => ({ ...prev, acknowledgedByRank: 'CHIEF OF POLICE [COP]' }))}
                            className="text-yellow-400 hover:underline"
                          >
                            [COP]
                          </button>
                        </div>
                      </div>
                      <input
                        type="text"
                        value={activeDoc.acknowledgedByRank || ''}
                        onChange={(e) => onUpdateDoc(prev => ({ ...prev, acknowledgedByRank: e.target.value }))}
                        className="w-full bg-[#161B22] border border-gray-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:border-amber-500 focus:outline-none"
                        placeholder="PRESIDENT [RANK 6] / CHIEF OF POLICE"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1 text-[10px] font-mono text-gray-400">
                        <span>TEKS STATUS PENGESAHAN KENEGARAAN:</span>
                        <button
                          type="button"
                          onClick={() => onUpdateDoc(prev => ({ ...prev, acknowledgedCustomStatus: 'DISAHKAN & DIAKREDITASI OLEH PEMERINTAHAN PUSAT' }))}
                          className="text-emerald-400 hover:underline"
                        >
                          [Pemerintah Pusat]
                        </button>
                      </div>
                      <input
                        type="text"
                        value={activeDoc.acknowledgedCustomStatus ?? 'DISAHKAN & DIAKREDITASI OLEH PEMERINTAHAN PUSAT'}
                        onChange={(e) => onUpdateDoc(prev => ({ ...prev, acknowledgedCustomStatus: e.target.value }))}
                        className="w-full bg-[#161B22] border border-gray-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:border-amber-500 focus:outline-none"
                        placeholder="DISAHKAN & DIAKREDITASI OLEH PEMERINTAHAN PUSAT"
                      />
                    </div>
                  </div>

                  {/* Format Tanda Tangan Mode */}
                  <div className="pt-2 border-t border-gray-800 flex items-center justify-between flex-wrap gap-2">
                    <span className="text-[11px] font-mono text-gray-400">FORMAT TTD PIMPINAN:</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onUpdateDoc(prev => ({
                          ...prev,
                          acknowledgedSignatureType: 'font',
                          acknowledgedSignatureStyle: 'formal',
                          acknowledgedSignatureImage: undefined
                        }))}
                        className={`px-2.5 py-1 rounded text-xs font-mono font-bold border transition ${
                          activeDoc.acknowledgedSignatureType === 'font' && !activeDoc.acknowledgedSignatureImage
                            ? 'bg-amber-600 text-black border-amber-400'
                            : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'
                        }`}
                      >
                        ✍️ Font Formal
                      </button>

                      <button
                        type="button"
                        onClick={() => onUpdateDoc(prev => ({
                          ...prev,
                          acknowledgedSignatureType: 'blank',
                          acknowledgedSignatureStyle: 'blank',
                          acknowledgedSignatureImage: undefined
                        }))}
                        className={`px-2.5 py-1 rounded text-xs font-mono font-bold border transition ${
                          activeDoc.acknowledgedSignatureType === 'blank' || activeDoc.acknowledgedSignatureStyle === 'blank'
                            ? 'bg-amber-600 text-black border-amber-400'
                            : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'
                        }`}
                        title="Tanda tangan dikosongkan (hanya garis kosong untuk tanda tangan basah)"
                      >
                        📄 Garis Kosongan
                      </button>

                      {onOpenSignaturePad && (
                        <button
                          type="button"
                          onClick={() => {
                            onOpenSignaturePad('acknowledged');
                            onClose();
                          }}
                          className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-blue-900/60 hover:bg-blue-800 text-blue-200 border border-blue-600 transition flex items-center gap-1"
                        >
                          <PenTool className="w-3 h-3" />
                          <span>Gambar TTD</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: WEBHOOK DISCORD PEMERINTAH                                         */}
          {/* ========================================================================= */}
          {activeTab === 'WEBHOOK' && (
            <div className="space-y-4">
              {/* STATUS CARD */}
              <div className="p-3 bg-gradient-to-r from-blue-950/40 via-[#161B22] to-black/60 border border-blue-500/40 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400 flex items-center justify-center text-blue-300">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-blue-200 font-mono">INTEGRASI WEBHOOK DISCORD LEMBARAN NEGARA</h4>
                    <p className="text-[11px] text-gray-400">
                      Publikasi otomatis arsip surat keputusan, izin usaha, dan dekrit presiden ke channel Discord Kenegaraan.
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                  govDocWebhookUrl.trim()
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                    : 'bg-amber-950 text-amber-300 border-amber-600'
                }`}>
                  {govDocWebhookUrl.trim() ? '🟢 TERKONFIGURASI' : '⚠️ BELUM DIATUR'}
                </span>
              </div>

              {/* WEBHOOK INPUT FORM */}
              <div className="p-4 bg-[#11141A] border border-gray-800 rounded-xl space-y-3 font-mono text-xs">
                <div>
                  <label className="block text-gray-300 font-bold mb-1 flex items-center justify-between">
                    <span>URL DISCORD WEBHOOK DOKUMEN & ARSIP KENEGARAAN:</span>
                    <span className="text-[10px] text-blue-400 font-normal">Channel Rekomendasi: #arsip-lembaran-negara</span>
                  </label>
                  <input
                    type="url"
                    value={govDocWebhookUrl}
                    onChange={(e) => setGovDocWebhookUrl(e.target.value)}
                    placeholder="https://discord.com/api/webhooks/123456789/token..."
                    className="w-full bg-[#0D1117] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 font-mono text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-300 font-bold mb-1">NAMA BOT WEBHOOK:</label>
                    <input
                      type="text"
                      value={govDocBotName}
                      onChange={(e) => setGovDocBotName(e.target.value)}
                      placeholder="Arsip & Dokumen Resmi Kenegaraan"
                      className="w-full bg-[#0D1117] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 font-mono text-xs focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 font-bold mb-1">AVATAR URL BOT:</label>
                    <input
                      type="url"
                      value={govDocBotAvatar}
                      onChange={(e) => setGovDocBotAvatar(e.target.value)}
                      placeholder="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
                      className="w-full bg-[#0D1117] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 font-mono text-xs focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={govDocAutoSend}
                      onChange={(e) => setGovDocAutoSend(e.target.checked)}
                      className="rounded border-gray-700 text-blue-500 accent-blue-500 cursor-pointer"
                    />
                    <span className="text-gray-300 text-xs">Kirim otomatis ke Discord saat Dokumen Disimpan</span>
                  </label>

                  <button
                    type="button"
                    onClick={handleSaveWebhookConfig}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition flex items-center gap-1.5 shadow"
                  >
                    <span>Simpan Pengaturan</span>
                  </button>
                </div>
              </div>

              {/* ACTION BUTTONS: TEST & SEND ACTIVE DOCUMENT */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Test Connection Button */}
                <div className="p-3 bg-[#161B22] border border-gray-800 rounded-xl flex flex-col justify-between">
                  <div>
                    <span className="font-bold text-xs text-gray-200 block mb-1">1. Uji Koneksi Sinyal Webhook</span>
                    <p className="text-[11px] text-gray-400">
                      Kirim embed uji coba ke Discord untuk memastikan bot dan webhook channel terhubung.
                    </p>
                  </div>
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={handleTestGovDocWebhook}
                      disabled={testStatus === 'testing' || !govDocWebhookUrl.trim()}
                      className="w-full py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-gray-200 border border-gray-600 rounded-lg text-xs font-mono font-bold transition flex items-center justify-center gap-1.5"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${testStatus === 'testing' ? 'animate-spin' : ''}`} />
                      <span>{testStatus === 'testing' ? 'Menguji Sinyal...' : '🧪 Uji Coba Webhook Dokumen'}</span>
                    </button>
                    {testMsg && (
                      <p className={`text-[11px] font-mono mt-1.5 ${testStatus === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {testMsg}
                      </p>
                    )}
                  </div>
                </div>

                {/* Send Active Document Button */}
                <div className="p-3 bg-gradient-to-r from-amber-950/40 to-[#161B22] border border-amber-500/40 rounded-xl flex flex-col justify-between">
                  <div>
                    <span className="font-bold text-xs text-amber-200 block mb-1">2. Kirim Dokumen Ini Sekarang</span>
                    <p className="text-[11px] text-gray-400">
                      {activeDoc ? `Publikasikan surat "${activeDoc.title}" langsung ke Discord.` : 'Tidak ada dokumen terbuka.'}
                    </p>
                  </div>
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={handleSendActiveDocToGovWebhook}
                      disabled={sendDocStatus === 'sending' || !govDocWebhookUrl.trim() || !activeDoc}
                      className="w-full py-2 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 disabled:opacity-50 text-black font-mono font-bold rounded-lg text-xs shadow-md transition flex items-center justify-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{sendDocStatus === 'sending' ? 'Mengirim Lembaran...' : '🚀 Kirim Dokumen ke Webhook'}</span>
                    </button>
                    {sendDocMsg && (
                      <p className={`text-[11px] font-mono mt-1.5 ${sendDocStatus === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {sendDocMsg}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* OTHER GOVERNMENT WEBHOOKS SUMMARY */}
              <div className="p-3 bg-[#11141A] border border-gray-800 rounded-xl space-y-2 text-xs font-mono">
                <span className="text-gray-400 text-[10px] block font-bold">STATUS WEBHOOK PEMERINTAH LAINNYA:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 bg-[#161B22] rounded border border-gray-800 flex items-center justify-between">
                    <div>
                      <span className="text-amber-300 font-bold block">Webhook Roster Pejabat</span>
                      <span className="text-gray-400 text-[10px]">
                        {getSavedGovRosterWebhookConfig().webhookUrl ? '🟢 Terkonfigurasi' : '⚠️ Belum Diatur'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        const res = await testGovRosterDiscordWebhook(getSavedGovRosterWebhookConfig());
                        alert(res.message);
                      }}
                      className="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded text-[10px] border border-gray-700"
                    >
                      Uji Sinyal
                    </button>
                  </div>

                  <div className="p-2 bg-[#161B22] rounded border border-gray-800 flex items-center justify-between">
                    <div>
                      <span className="text-emerald-300 font-bold block">Webhook Audit PIN Pejabat</span>
                      <span className="text-gray-400 text-[10px]">
                        {getSavedGovPinResetWebhookConfig().webhookUrl ? '🟢 Terkonfigurasi' : '⚠️ Belum Diatur'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        const res = await testGovPinResetDiscordWebhook(getSavedGovPinResetWebhookConfig());
                        alert(res.message);
                      }}
                      className="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded text-[10px] border border-gray-700"
                    >
                      Uji Sinyal
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: FITUR-FITUR TERPADU KENEGARAAN                                      */}
          {/* ========================================================================= */}
          {activeTab === 'FEATURES' && (
            <div className="space-y-4">
              {/* STATE SECURITY STATUS */}
              <div className="p-3 bg-[#161B22] border border-gray-800 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-200 font-mono flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    <span>STATUS KEAMANAN NEGARA SAAT INI (STATE SECURITY LEVEL):</span>
                  </span>
                  <span className={`px-2.5 py-0.5 rounded font-mono font-bold text-xs border ${
                    securityStatus.level === 'NORMAL' ? 'bg-emerald-950 text-emerald-300 border-emerald-600' :
                    securityStatus.level === 'ELEVATED' ? 'bg-yellow-950 text-yellow-300 border-yellow-600' :
                    securityStatus.level === 'HIGH' ? 'bg-orange-950 text-orange-300 border-orange-600' :
                    'bg-rose-950 text-rose-300 border-rose-600 animate-pulse'
                  }`}>
                    LEVEL: {securityStatus.level}
                  </span>
                </div>
                <p className="text-xs text-gray-300 mb-1">{securityStatus.details}</p>
                <p className="text-[10px] text-gray-400 font-mono">
                  Ditetapkan oleh: <strong className="text-white">{securityStatus.updatedBy}</strong> • Terakhir diperbarui: {securityStatus.lastUpdated}
                </p>
                {onUpdateDoc && activeDoc && (
                  <div className="mt-2 pt-2 border-t border-gray-800 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateDoc(prev => ({
                          ...prev,
                          notes: `${prev.notes ? `${prev.notes}\n\n` : ''}[STATUS KEAMANAN NEGARA: LEVEL ${securityStatus.level}]\nKeterangan Operasional: ${securityStatus.details}`
                        }));
                        showNotification('✅ Catatan Status Keamanan Negara ditambahkan ke dokumen!');
                      }}
                      className="text-[10px] text-amber-400 hover:text-amber-300 font-mono underline"
                    >
                      + Cantumkan Status Keamanan ini ke Catatan Surat Aktif
                    </button>
                  </div>
                )}
              </div>

              {/* STEMPEL RESMI KENEGARAAN CEPAT */}
              <div className="p-3 bg-[#11141A] border border-gray-800 rounded-xl space-y-2">
                <span className="text-xs font-bold text-gray-200 font-mono flex items-center gap-1.5">
                  <StampIcon className="w-3.5 h-3.5 text-amber-400" />
                  <span>PASANG CAP STEMPEL KENEGARAAN:</span>
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => {
                      if (onUpdateDoc) onUpdateDoc(prev => ({ ...prev, secondarySeal: 'PRESIDENTIAL_SEAL' }));
                      showNotification('👑 Cap Stempel Kepresidenan berhasil dipasang!');
                    }}
                    className="p-2.5 bg-[#161B22] hover:bg-amber-950/50 border border-amber-600/40 rounded-lg text-left transition flex items-center gap-2"
                  >
                    <span className="text-lg">👑</span>
                    <div>
                      <strong className="text-amber-300 block text-xs">Presidential Seal</strong>
                      <span className="text-[9px] text-gray-400">Cap Emas/Merah Presiden</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (onUpdateDoc) onUpdateDoc(prev => ({ ...prev, secondarySeal: 'GOVERNMENT_SEAL' }));
                      showNotification('🏛️ Cap Stempel Dewan Pemerintahan berhasil dipasang!');
                    }}
                    className="p-2.5 bg-[#161B22] hover:bg-blue-950/50 border border-blue-600/40 rounded-lg text-left transition flex items-center gap-2"
                  >
                    <span className="text-lg">🏛️</span>
                    <div>
                      <strong className="text-blue-300 block text-xs">Government Seal</strong>
                      <span className="text-[9px] text-gray-400">Cap Resmi Pemerintah</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (onUpdateDoc) onUpdateDoc(prev => ({ ...prev, secondarySeal: 'HIGH_COMMAND' }));
                      showNotification('🟡 Cap Stempel High Command berhasil dipasang!');
                    }}
                    className="p-2.5 bg-[#161B22] hover:bg-yellow-950/50 border border-yellow-600/40 rounded-lg text-left transition flex items-center gap-2"
                  >
                    <span className="text-lg">🟡</span>
                    <div>
                      <strong className="text-yellow-300 block text-xs">High Command Seal</strong>
                      <span className="text-[9px] text-gray-400">Cap Emas Pimpinan</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* DOKUMEN PRESET EKSEKUTIF PEMERINTAHAN */}
              <div className="p-3 bg-[#11141A] border border-gray-800 rounded-xl space-y-2">
                <span className="text-xs font-bold text-gray-200 font-mono flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <span>TEMPLATE DOKUMEN RESMI PEMERINTAHAN:</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {DOCUMENT_PRESET_TEMPLATES.filter(t => 
                    t.category === 'IZIN_USAHA' ||
                    t.category === 'MAKLUMAT_DARURAT' ||
                    t.category === 'GRASI_PRESIDEN' ||
                    t.category === 'ANGGARAN_DINAS' ||
                    t.id === 'sk-presiden-01' ||
                    t.id === 'permohonan-tanda-tangan-pemerintah'
                  ).map(t => (
                    <div
                      key={t.id}
                      onClick={() => {
                        if (onUpdateDoc) {
                          onUpdateDoc(() => ({
                            ...t.defaultDoc,
                            id: `doc_${Date.now()}`,
                            createdAt: Date.now(),
                            updatedAt: Date.now()
                          }));
                          showNotification(`📄 Template "${t.name}" berhasil dimuat ke editor!`);
                        }
                      }}
                      className="p-2.5 bg-[#161B22] hover:bg-gray-800 border border-gray-700/80 rounded-lg cursor-pointer transition flex items-start gap-2 group"
                    >
                      <span className="text-base mt-0.5">📜</span>
                      <div>
                        <strong className="text-gray-100 group-hover:text-amber-300 transition block text-xs">
                          {t.name}
                        </strong>
                        <p className="text-[10px] text-gray-400 line-clamp-1">{t.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SHORTCUTS TO EXECUTIVE HUB */}
              <div className="p-3 bg-gradient-to-r from-amber-950/30 to-black border border-amber-600/30 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-amber-400" />
                  <div>
                    <strong className="text-xs text-amber-200 block">PORTAL UTAMA EKSEKUTIF PEMERINTAHAN</strong>
                    <span className="text-[10px] text-gray-400">Kelola Perizinan Usaha, Maklumat Darurat, Roster Pejabat & APBN Negara</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {onNavigateToRoster && (
                    <button
                      type="button"
                      onClick={() => {
                        onNavigateToRoster();
                        onClose();
                      }}
                      className="px-2.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 rounded-lg text-xs font-mono font-bold transition"
                    >
                      Roster Pejabat
                    </button>
                  )}
                  {onNavigateToExecutiveHub && (
                    <button
                      type="button"
                      onClick={() => {
                        onNavigateToExecutiveHub();
                        onClose();
                      }}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-black font-bold rounded-lg text-xs font-mono transition flex items-center gap-1 shadow"
                    >
                      <span>Buka Eksekutif Hub</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-3 bg-[#161B22] border-t border-gray-800 flex items-center justify-between text-xs font-mono">
          <span className="text-[10px] text-gray-400 flex items-center gap-1">
            <Lock className="w-3 h-3 text-amber-400" />
            <span>Otoritas Resmi Markas Besar & Kantor Kepresidenan HighState</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg font-bold transition"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
