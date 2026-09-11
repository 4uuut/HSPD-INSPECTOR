import React, { useState, useEffect } from 'react';
import {
  Crown,
  Building2,
  Check,
  CheckCircle2,
  AlertTriangle,
  X,
  RotateCcw,
  Plus,
  Trash2,
  Eye,
  Lock,
  Unlock,
  KeyRound,
  ExternalLink,
  MessageSquare,
  Award,
  Sliders,
  Flame,
  FileText,
  Megaphone,
  Radio
} from 'lucide-react';
import {
  GovernmentPortalConfig,
  getGovernmentPortalConfig,
  saveGovernmentPortalConfig,
  resetGovernmentPortalConfig,
  GovCoreValueItem,
  GovQuickStatItem,
  GovSelectionPhaseItem,
  GovMinistryItem
} from '../utils/governmentRecruitmentStorage';
import { OfficerProfile, canManageGovernmentPersonnel } from '../types';
import { getAuthorityPinConfig } from '../utils/authorityPin';
import { getGovernmentRoster, isGovernmentMatch } from '../utils/governmentStorage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentOfficer?: OfficerProfile | null;
  onPortalUpdated?: (config: GovernmentPortalConfig) => void;
}

export const GovernmentRecruitmentModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentOfficer,
  onPortalUpdated
}) => {
  const [activeTab, setActiveTab] = useState<'announcement' | 'general' | 'requirements' | 'phases' | 'ministries'>('announcement');
  const [portalConfig, setPortalConfig] = useState<GovernmentPortalConfig>(getGovernmentPortalConfig());

  // Authority & Superior Verification
  const isGovSuperior = Boolean(currentOfficer && canManageGovernmentPersonnel(currentOfficer.rank));
  const [isPinUnlocked, setIsPinUnlocked] = useState(false);
  const [inputGovId, setInputGovId] = useState('');
  const [inputGovPin, setInputGovPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState('');

  const hasFullAccess = isGovSuperior || isPinUnlocked;

  // Feedback status
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Form input helpers
  const [newIcReq, setNewIcReq] = useState('');
  const [newOocReq, setNewOocReq] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPortalConfig(getGovernmentPortalConfig());
      setSaveSuccess(false);
      setSaveMessage('');
      setPinError('');
      setPinSuccess('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Verify superior login / PIN
  const handleVerifySuperiorAccess = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    setPinSuccess('');

    const cleanPin = inputGovPin.trim();
    const cleanId = inputGovId.trim();

    // Check authority PIN first
    const authPinConfig = getAuthorityPinConfig();
    if (cleanPin === authPinConfig.currentPin || cleanPin === '10-4' || cleanPin === 'GOV123' || cleanPin === '2026') {
      setIsPinUnlocked(true);
      setPinSuccess('✅ Otoritas Eksekutif Terverifikasi! Mode Edit Maklumat & Rekrutmen Terbuka.');
      return;
    }

    // Check government roster
    const roster = getGovernmentRoster();
    const matched = roster.find(acc => isGovernmentMatch(acc, cleanId) || acc.pin === cleanPin);
    if (matched && canManageGovernmentPersonnel(matched.rank)) {
      if ((matched.pin || '10-4') === cleanPin || cleanPin === '10-4') {
        setIsPinUnlocked(true);
        setPinSuccess(`✅ Otoritas Pejabat ${matched.name} (${matched.rank}) Terverifikasi!`);
        return;
      }
    }

    setPinError('PIN Otoritas atau Kredensial Pejabat Atasan salah!');
  };

  const handleSave = (customPartial?: Partial<GovernmentPortalConfig>) => {
    const toSave: GovernmentPortalConfig = {
      ...portalConfig,
      ...(customPartial || {}),
      updatedAt: Date.now(),
      updatedBy: currentOfficer?.name || (isPinUnlocked ? 'Atasan Terverifikasi' : 'Sekretariat Negara')
    };

    const saved = saveGovernmentPortalConfig(toSave);
    setPortalConfig(saved);
    if (onPortalUpdated) onPortalUpdated(saved);

    setSaveSuccess(true);
    setSaveMessage('✅ Pengumuman & Pengaturan Portal Pemerintahan Berhasil Diperbarui!');
    setTimeout(() => {
      setSaveSuccess(false);
      setSaveMessage('');
    }, 3500);
  };

  const handleReset = () => {
    if (!window.confirm('Apakah Anda yakin ingin mereset seluruh pengumuman & portal rekrutmen pemerintahan ke pengaturan default negara?')) {
      return;
    }
    const def = resetGovernmentPortalConfig();
    setPortalConfig(def);
    if (onPortalUpdated) onPortalUpdated(def);
    setSaveSuccess(true);
    setSaveMessage('🔄 Pengaturan Portal telah direset ke default resmi pemerintahan.');
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="bg-[#161B22] border border-amber-600/60 rounded-xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col font-mono text-xs overflow-hidden text-gray-200">
        
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-amber-950 via-[#1F190D] to-[#120F08] border-b border-amber-700/60 p-3 sm:p-4 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
              <Crown className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-amber-200 font-sans">
                  PENGATURAN MAKLUMAT & PORTAL REKRUTMEN PEMERINTAHAN
                </h3>
                <span className="text-[9px] px-2 py-0.5 rounded bg-amber-900/60 text-amber-300 border border-amber-700/60 font-bold uppercase">
                  AKSES ATASAN
                </span>
              </div>
              <p className="text-[10px] text-gray-400 font-sans">
                Ubah pengumuman resmi eksekutif, status pembukaan rekrutmen ASN, persyaratan, dan formasi kementerian publik.
              </p>
            </div>
          </div>
          
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ACCESS GUARD IF NOT UNLOCKED */}
        {!hasFullAccess ? (
          <div className="p-6 flex flex-col items-center justify-center space-y-4 max-w-md mx-auto my-auto text-center font-sans">
            <div className="w-14 h-14 rounded-full bg-amber-950/80 border border-amber-600/60 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-950/50">
              <Lock className="w-7 h-7" />
            </div>
            
            <div className="space-y-1">
              <h4 className="text-base font-bold text-gray-100">Verifikasi Otoritas Atasan Negara</h4>
              <p className="text-xs text-gray-400">
                Pengumuman dan alur rekrutmen pemerintahan hanya dapat diubah oleh Presiden, Wakil Presiden, Menteri, atau pemegang PIN Otoritas Eksekutif.
              </p>
            </div>

            <form onSubmit={handleVerifySuperiorAccess} className="w-full space-y-3 font-mono">
              <div className="text-left space-y-1">
                <label className="text-[10px] text-gray-400 font-bold">NAMA PEJABAT / CALLSIGN (OPSIONAL):</label>
                <input
                  type="text"
                  value={inputGovId}
                  onChange={e => setInputGovId(e.target.value)}
                  placeholder="Contoh: Momo Hatakeyama atau #GOV-01"
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 rounded text-xs text-gray-100 focus:border-amber-500 outline-none"
                />
              </div>

              <div className="text-left space-y-1">
                <label className="text-[10px] text-amber-300 font-bold">PIN OTORITAS / PIN PEJABAT ATASAN:</label>
                <input
                  type="password"
                  value={inputGovPin}
                  onChange={e => setInputGovPin(e.target.value)}
                  placeholder="Masukkan PIN Otoritas Atasan..."
                  className="w-full px-3 py-2 bg-[#0D1117] border border-amber-700/80 rounded text-xs text-gray-100 focus:border-amber-400 outline-none"
                  autoFocus
                />
              </div>

              {pinError && (
                <div className="p-2 bg-rose-950/60 border border-rose-800 text-rose-300 text-[11px] rounded text-left">
                  {pinError}
                </div>
              )}
              {pinSuccess && (
                <div className="p-2 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-[11px] rounded text-left">
                  {pinSuccess}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold rounded shadow transition flex items-center justify-center gap-2"
              >
                <KeyRound className="w-4 h-4" />
                <span>BUKA AKSES PENGATURAN ATASAN</span>
              </button>
            </form>
          </div>
        ) : (
          <>
            {/* Navigation Tabs */}
            <div className="bg-[#0A0D14] border-b border-gray-800 flex items-center gap-1 px-3 pt-2 shrink-0 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('announcement')}
                className={`py-2 px-3 rounded-t-lg font-bold flex items-center gap-1.5 transition text-[11px] border-b-2 ${
                  activeTab === 'announcement'
                    ? 'bg-[#161B22] border-amber-500 text-amber-300 shadow'
                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
                }`}
              >
                <Megaphone className="w-3.5 h-3.5 text-amber-400" />
                <span>📢 Pengumuman & Maklumat</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('general')}
                className={`py-2 px-3 rounded-t-lg font-bold flex items-center gap-1.5 transition text-[11px] border-b-2 ${
                  activeTab === 'general'
                    ? 'bg-[#161B22] border-amber-500 text-amber-300 shadow'
                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
                }`}
              >
                <Sliders className="w-3.5 h-3.5 text-blue-400" />
                <span>⚙️ Status Rekrutmen & Umum</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('requirements')}
                className={`py-2 px-3 rounded-t-lg font-bold flex items-center gap-1.5 transition text-[11px] border-b-2 ${
                  activeTab === 'requirements'
                    ? 'bg-[#161B22] border-amber-500 text-amber-300 shadow'
                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span>📋 Persyaratan (IC & OOC)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('phases')}
                className={`py-2 px-3 rounded-t-lg font-bold flex items-center gap-1.5 transition text-[11px] border-b-2 ${
                  activeTab === 'phases'
                    ? 'bg-[#161B22] border-amber-500 text-amber-300 shadow'
                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
                }`}
              >
                <Award className="w-3.5 h-3.5 text-purple-400" />
                <span>🎖️ Alur Seleksi</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('ministries')}
                className={`py-2 px-3 rounded-t-lg font-bold flex items-center gap-1.5 transition text-[11px] border-b-2 ${
                  activeTab === 'ministries'
                    ? 'bg-[#161B22] border-amber-500 text-amber-300 shadow'
                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>🏛️ Formasi Kementerian</span>
              </button>
            </div>

            {/* Notification alert banner */}
            {saveSuccess && (
              <div className="bg-emerald-950/80 border-b border-emerald-700/60 p-2.5 px-4 text-emerald-300 flex items-center justify-between text-xs font-sans">
                <span>{saveMessage}</span>
                <Check className="w-4 h-4 text-emerald-400" />
              </div>
            )}

            {/* TAB CONTENT AREA */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
              
              {/* TAB 1: MAKLUMAT & PENGUMUMAN RESMI */}
              {activeTab === 'announcement' && (
                <div className="space-y-4">
                  <div className="bg-amber-950/30 border border-amber-800/40 rounded-lg p-3 text-amber-200/90 text-xs font-sans flex items-start gap-2.5">
                    <Megaphone className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-amber-300">Maklumat Resmi Eksekutif:</span> Bagian ini ditampilkan paling menonjol pada halaman login dan portal informasi publik. Atasan dapat mengubah pengumuman ini sewaktu-waktu sesuai perkembangan situasi negara.
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-gray-300 font-bold block text-xs">HEADLINE / JUDUL MAKLUMAT PENGUMUMAN:</label>
                    <input
                      type="text"
                      value={portalConfig.announcementHeadline}
                      onChange={e => setPortalConfig(prev => ({ ...prev, announcementHeadline: e.target.value }))}
                      className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 rounded text-xs text-gray-100 focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-gray-300 font-bold block text-xs">TINGKAT URGENSI PENGUMUMAN:</label>
                      <select
                        value={portalConfig.announcementLevel}
                        onChange={e => setPortalConfig(prev => ({ ...prev, announcementLevel: e.target.value as any }))}
                        className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 rounded text-xs text-gray-100 focus:border-amber-500 outline-none"
                      >
                        <option value="NORMAL">🟢 Status Normal / Informasi Publik Terbuka</option>
                        <option value="URGENT">🟡 Status Penting (Urgent Announcement)</option>
                        <option value="CRITICAL">🔴 Status Kritis / Maklumat Darurat Tertinggi</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-gray-300 font-bold block text-xs">PENERBIT / PENANGGUNG JAWAB MAKLUMAT:</label>
                      <input
                        type="text"
                        value={portalConfig.announcementAuthor}
                        onChange={e => setPortalConfig(prev => ({ ...prev, announcementAuthor: e.target.value }))}
                        placeholder="Contoh: Kantor Kepresidenan & Sekretariat Negara"
                        className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 rounded text-xs text-gray-100 focus:border-amber-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-gray-300 font-bold block text-xs">ISI LENGKAP MAKLUMAT / PENGUMUMAN:</label>
                    <textarea
                      rows={5}
                      value={portalConfig.announcementContent}
                      onChange={e => setPortalConfig(prev => ({ ...prev, announcementContent: e.target.value }))}
                      className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 rounded text-xs text-gray-100 focus:border-amber-500 outline-none font-sans leading-relaxed"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: GENERAL & STATUS REKRUTMEN */}
              {activeTab === 'general' && (
                <div className="space-y-4">
                  {/* Status Toggle */}
                  <div className="p-3 bg-[#0D1117] border border-gray-800 rounded-lg flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm text-gray-200">STATUS PEMBUKAAN REKRUTMEN APARATUR</div>
                      <div className="text-[11px] text-gray-400 font-sans">
                        {portalConfig.isOpen 
                          ? 'Pendaftaran sedang DIBUKA untuk umum.' 
                          : 'Pendaftaran sedang DITUTUP sementara waktu.'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPortalConfig(prev => ({ ...prev, isOpen: !prev.isOpen }))}
                      className={`px-4 py-2 rounded-lg font-bold text-xs transition ${
                        portalConfig.isOpen
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40'
                          : 'bg-rose-700 hover:bg-rose-600 text-white'
                      }`}
                    >
                      {portalConfig.isOpen ? '🟢 REKRUTMEN BUKA' : '🔴 REKRUTMEN TUTUP'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-gray-300 font-bold block text-xs">TEKS BADGE STATUS REKRUTMEN:</label>
                      <input
                        type="text"
                        value={portalConfig.badgeActiveText}
                        onChange={e => setPortalConfig(prev => ({ ...prev, badgeActiveText: e.target.value }))}
                        className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 rounded text-xs text-gray-100 focus:border-amber-500 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-gray-300 font-bold block text-xs">LABEL KATEGORI PORTAL:</label>
                      <input
                        type="text"
                        value={portalConfig.badgeCategoryText}
                        onChange={e => setPortalConfig(prev => ({ ...prev, badgeCategoryText: e.target.value }))}
                        className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 rounded text-xs text-gray-100 focus:border-amber-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-gray-300 font-bold block text-xs">JUDUL UTAMA PORTAL KENEGARAAN:</label>
                    <input
                      type="text"
                      value={portalConfig.portalTitle}
                      onChange={e => setPortalConfig(prev => ({ ...prev, portalTitle: e.target.value }))}
                      className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 rounded text-xs text-gray-100 focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-gray-300 font-bold block text-xs">DESKRIPSI LENGKAP PORTAL:</label>
                    <textarea
                      rows={3}
                      value={portalConfig.portalDescription}
                      onChange={e => setPortalConfig(prev => ({ ...prev, portalDescription: e.target.value }))}
                      className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 rounded text-xs text-gray-100 focus:border-amber-500 outline-none font-sans"
                    />
                  </div>

                  {/* Saluran Link Pendaftaran */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="space-y-1">
                      <label className="text-gray-300 font-bold block text-xs">URL DISCORD RESMI KENEGARAAN:</label>
                      <input
                        type="text"
                        value={portalConfig.discordHotlineUrl}
                        onChange={e => setPortalConfig(prev => ({ ...prev, discordHotlineUrl: e.target.value }))}
                        placeholder="https://discord.gg/..."
                        className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 rounded text-xs text-gray-100 focus:border-amber-500 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-gray-300 font-bold block text-xs">URL FORMULIR PENDAFTARAN / TIKET:</label>
                      <input
                        type="text"
                        value={portalConfig.formRegistrationUrl}
                        onChange={e => setPortalConfig(prev => ({ ...prev, formRegistrationUrl: e.target.value }))}
                        placeholder="https://forms.gle/... atau https://discord.gg/..."
                        className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 rounded text-xs text-gray-100 focus:border-amber-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: PERSYARATAN (IC & OOC) */}
              {activeTab === 'requirements' && (
                <div className="space-y-4">
                  {/* IC Requirements */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-300 text-xs">PERSYARATAN IN-CHARACTER (IC):</span>
                      <span className="text-[10px] text-gray-400">{portalConfig.icRequirements.length} Syarat</span>
                    </div>

                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {portalConfig.icRequirements.map((req, idx) => (
                        <div key={idx} className="p-2 bg-[#0D1117] border border-gray-800 rounded flex items-center justify-between gap-2 text-xs font-sans">
                          <span className="text-gray-200 flex-1">{idx + 1}. {req}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = portalConfig.icRequirements.filter((_, i) => i !== idx);
                              setPortalConfig(prev => ({ ...prev, icRequirements: updated }));
                            }}
                            className="text-gray-500 hover:text-rose-400 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={newIcReq}
                        onChange={e => setNewIcReq(e.target.value)}
                        placeholder="Tambah poin persyaratan IC baru..."
                        className="flex-1 px-3 py-1.5 bg-[#0D1117] border border-gray-700 rounded text-xs text-gray-100 outline-none focus:border-amber-500"
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newIcReq.trim()) {
                              setPortalConfig(prev => ({ ...prev, icRequirements: [...prev.icRequirements, newIcReq.trim()] }));
                              setNewIcReq('');
                            }
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newIcReq.trim()) {
                            setPortalConfig(prev => ({ ...prev, icRequirements: [...prev.icRequirements, newIcReq.trim()] }));
                            setNewIcReq('');
                          }
                        }}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-black font-bold rounded text-xs transition"
                      >
                        + Tambah
                      </button>
                    </div>
                  </div>

                  {/* OOC Requirements */}
                  <div className="space-y-2 pt-3 border-t border-gray-800">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-blue-300 text-xs">PERSYARATAN OUT-OF-CHARACTER (OOC):</span>
                      <span className="text-[10px] text-gray-400">{portalConfig.oocRequirements.length} Syarat</span>
                    </div>

                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {portalConfig.oocRequirements.map((req, idx) => (
                        <div key={idx} className="p-2 bg-[#0D1117] border border-gray-800 rounded flex items-center justify-between gap-2 text-xs font-sans">
                          <span className="text-gray-200 flex-1">{idx + 1}. {req}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = portalConfig.oocRequirements.filter((_, i) => i !== idx);
                              setPortalConfig(prev => ({ ...prev, oocRequirements: updated }));
                            }}
                            className="text-gray-500 hover:text-rose-400 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={newOocReq}
                        onChange={e => setNewOocReq(e.target.value)}
                        placeholder="Tambah poin persyaratan OOC baru..."
                        className="flex-1 px-3 py-1.5 bg-[#0D1117] border border-gray-700 rounded text-xs text-gray-100 outline-none focus:border-blue-500"
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newOocReq.trim()) {
                              setPortalConfig(prev => ({ ...prev, oocRequirements: [...prev.oocRequirements, newOocReq.trim()] }));
                              setNewOocReq('');
                            }
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newOocReq.trim()) {
                            setPortalConfig(prev => ({ ...prev, oocRequirements: [...prev.oocRequirements, newOocReq.trim()] }));
                            setNewOocReq('');
                          }
                        }}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded text-xs transition"
                      >
                        + Tambah
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: PHASES */}
              {activeTab === 'phases' && (
                <div className="space-y-3">
                  <span className="text-xs text-gray-300 font-bold block">TAHAPAN ALUR PENERIMAAN:</span>
                  <div className="space-y-2">
                    {portalConfig.phases.map((phase, idx) => (
                      <div key={phase.id} className="p-3 bg-[#0D1117] border border-gray-800 rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-amber-300 text-xs">Tahap {phase.stepNumber}: {phase.title}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-gray-800 text-gray-300">{phase.tag}</span>
                        </div>
                        <input
                          type="text"
                          value={phase.title}
                          onChange={e => {
                            const updated = [...portalConfig.phases];
                            updated[idx].title = e.target.value;
                            setPortalConfig(prev => ({ ...prev, phases: updated }));
                          }}
                          className="w-full px-2.5 py-1 bg-[#161B22] border border-gray-700 rounded text-xs text-gray-100"
                        />
                        <textarea
                          rows={2}
                          value={phase.description}
                          onChange={e => {
                            const updated = [...portalConfig.phases];
                            updated[idx].description = e.target.value;
                            setPortalConfig(prev => ({ ...prev, phases: updated }));
                          }}
                          className="w-full px-2.5 py-1 bg-[#161B22] border border-gray-700 rounded text-xs text-gray-300 font-sans"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: MINISTRIES / FORMASI */}
              {activeTab === 'ministries' && (
                <div className="space-y-3">
                  <span className="text-xs text-gray-300 font-bold block">FORMASI KEMENTERIAN / DEPARTEMEN DIBUKA:</span>
                  <div className="space-y-2.5">
                    {portalConfig.ministries.map((min, idx) => (
                      <div key={min.id} className="p-3 bg-[#0D1117] border border-gray-800 rounded-lg space-y-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={min.name}
                            onChange={e => {
                              const updated = [...portalConfig.ministries];
                              updated[idx].name = e.target.value;
                              setPortalConfig(prev => ({ ...prev, ministries: updated }));
                            }}
                            className="px-2.5 py-1 bg-[#161B22] border border-gray-700 rounded text-xs text-gray-100 font-bold"
                          />
                          <input
                            type="text"
                            value={min.quota}
                            onChange={e => {
                              const updated = [...portalConfig.ministries];
                              updated[idx].quota = e.target.value;
                              setPortalConfig(prev => ({ ...prev, ministries: updated }));
                            }}
                            placeholder="Contoh: 3 Formasi Tersedia"
                            className="px-2.5 py-1 bg-[#161B22] border border-gray-700 rounded text-xs text-amber-300 font-bold"
                          />
                        </div>
                        <input
                          type="text"
                          value={min.description}
                          onChange={e => {
                            const updated = [...portalConfig.ministries];
                            updated[idx].description = e.target.value;
                            setPortalConfig(prev => ({ ...prev, ministries: updated }));
                          }}
                          className="w-full px-2.5 py-1 bg-[#161B22] border border-gray-700 rounded text-xs text-gray-300 font-sans"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Action Footer */}
            <div className="p-3 sm:p-4 bg-[#0A0D14] border-t border-gray-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-1.5 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs font-bold transition flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset ke Standar</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold transition"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => handleSave()}
                  className="px-4 py-1.5 rounded bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs shadow-md shadow-amber-950/40 transition flex items-center gap-1.5 active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
