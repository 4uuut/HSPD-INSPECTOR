import React, { useState, useEffect } from 'react';
import { 
  KeyRound, Shield, ShieldAlert, Sparkles, Copy, Check, X,
  Clock, User, Landmark, Flame, FileText, Stamp, Search,
  Radio, CheckCircle2, AlertTriangle, AlertCircle, RefreshCw,
  Plus, Users, Trash2, ArrowRight, Ban, Award, FileSpreadsheet
} from 'lucide-react';
import { 
  OfficerProfile, 
  OfficerAccount, 
  ModuleAccessKey, 
  OneTimePasscode,
  isSupervisorOrAbove,
  getRankHierarchyTier
} from '../types';
import { 
  getSavedOtps, 
  createNewOtp, 
  revokeOtp, 
  formatOtpRadioBroadcast,
  MODULE_CLEARANCE_RULES
} from '../utils/otpClearanceStorage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentOfficer: OfficerProfile | null;
  roster: OfficerAccount[];
  defaultModule?: ModuleAccessKey;
}

export const OtpGeneratorModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentOfficer,
  roster,
  defaultModule = 'VAULT'
}) => {
  const [activeTab, setActiveTab] = useState<'GENERATE' | 'LIST' | 'RANKS_MATRIX'>('GENERATE');
  const [otps, setOtps] = useState<OneTimePasscode[]>(() => getSavedOtps());
  
  // Form states
  const [targetModule, setTargetModule] = useState<ModuleAccessKey>(defaultModule);
  const [recipientType, setRecipientType] = useState<'SPECIFIC' | 'GENERAL'>('SPECIFIC');
  const [selectedRosterOfficer, setSelectedRosterOfficer] = useState<string>('');
  const [manualOfficerName, setManualOfficerName] = useState<string>('');
  const [manualOfficerBadge, setManualOfficerBadge] = useState<string>('');
  const [durationMinutes, setDurationMinutes] = useState<number>(30); // 0 = single use only, 15, 30, 60, 120
  const [purpose, setPurpose] = useState<string>('Disposisi Tugas Lapangan & Akses Data Resmi');
  
  // Result state
  const [createdOtp, setCreatedOtp] = useState<OneTimePasscode | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedBroadcast, setCopiedBroadcast] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Sync defaultModule when prop changes
  useEffect(() => {
    if (defaultModule) {
      setTargetModule(defaultModule);
    }
  }, [defaultModule, isOpen]);

  // Sync OTPs on open
  useEffect(() => {
    if (isOpen) {
      setOtps(getSavedOtps());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isSupervisor = isSupervisorOrAbove(currentOfficer?.rank);

  // Quick Preset Reasons
  const PRESET_REASONS = [
    { label: '🏦 Audit Brankas Mingguan', module: 'VAULT' as ModuleAccessKey, text: 'Disposisi Perintah Audit & Penghitungan Brankas Barang Bukti Mingguan' },
    { label: '💥 Peleburan Sitaan Operasi', module: 'DESTRUCTION' as ModuleAccessKey, text: 'Mandat Pemusnahan Sitaan Narkotika & Peleburan Kendaraan Hasil Sitaan' },
    { label: '📄 Otorisasi Surat Rahasia / WCL', module: 'OFFICIAL_DOCS' as ModuleAccessKey, text: 'Otorisasi Penerbitan Izin Senjata Api (WCL) & Surat Perintah Operasi' },
    { label: '📂 Buka Berkas Penindakan', module: 'CASE_HISTORY' as ModuleAccessKey, text: 'Izin Pembukaan dan Pencetakan Riwayat Berkas Penindakan Tersangka' },
    { label: '🔍 Investigasi Kriminal CID', module: 'DETECTIVE' as ModuleAccessKey, text: 'Akses Berkas Khusus Investigasi Intelijen / Pohon Hierarki Sindikat' },
    { label: '🚗 Akses BOLO & Sitaan PU', module: 'BOLO' as ModuleAccessKey, text: 'Otorisasi Akses Sistem BOLO & Sitaan Kendaraan Impound Patrol Unit' },
    { label: '🔬 Disposisi Lab Forensik', module: 'FORENSICS' as ModuleAccessKey, text: 'Disposisi Pemeriksaan Laboratorium Forensik, Uji Balistik & Residu Mesiu' },
    { label: '🛡️ Audit Disiplin Internal IAD', module: 'IAD' as ModuleAccessKey, text: 'Izin Penyelidikan Disiplin Internal & Audit Pelanggaran Etik Personel' },
    { label: '🌐 Universal Master Clearance', module: 'UNIVERSAL' as ModuleAccessKey, text: 'Disposisi Otorisasi Penuh Segala Modul untuk Penugasan Khusus' },
  ];

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOfficer) return;

    let targetName = 'Semua Personel (General Disposisi)';
    let targetBadge = '#ALL';

    if (recipientType === 'SPECIFIC') {
      if (selectedRosterOfficer) {
        const found = roster.find(r => r.id === selectedRosterOfficer);
        if (found) {
          targetName = `${found.name} (${found.rank})`;
          targetBadge = found.badge;
        }
      } else if (manualOfficerName.trim()) {
        targetName = manualOfficerName.trim();
        targetBadge = manualOfficerBadge.trim() || '#---';
      }
    }

    const newOtp = createNewOtp({
      module: targetModule,
      issuedToOfficerName: targetName,
      issuedToBadge: targetBadge,
      issuedByOfficer: currentOfficer,
      purpose,
      durationMinutes
    });

    setCreatedOtp(newOtp);
    setOtps(getSavedOtps());
    setActionSuccess(`Kode OTP berhasil diterbitkan: ${newOtp.code}`);
  };

  const handleRevoke = (otpId: string) => {
    if (!currentOfficer) return;
    if (window.confirm('Batalkan / Cabut kode OTP ini? Petugas tidak akan bisa menggunakannya lagi.')) {
      revokeOtp(otpId, currentOfficer);
      setOtps(getSavedOtps());
      setActionSuccess('Kode OTP berhasil dicabut.');
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyBroadcast = (otp: OneTimePasscode) => {
    const text = formatOtpRadioBroadcast(otp);
    navigator.clipboard.writeText(text);
    setCopiedBroadcast(true);
    setTimeout(() => setCopiedBroadcast(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0F1318] border border-amber-500/40 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl shadow-amber-950/50 overflow-hidden font-sans text-gray-200">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#181D26] via-[#151922] to-[#12161F] border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-gray-100 flex items-center gap-2">
                  DISPOSISI KODE AKSES SEKALI PAKAI (OTP)
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded font-bold">
                  HIGH COMMAND & SUPERVISOR
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Otorisasi akses mandat untuk Petugas Lapangan membuka modul Brankas, Peleburan, Surat Resmi, & Kasus Rahasia.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs inside Modal */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-gray-800 bg-[#0B0E13]">
          <button
            onClick={() => setActiveTab('GENERATE')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'GENERATE'
                ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Buat Kode OTP Baru</span>
          </button>
          <button
            onClick={() => setActiveTab('LIST')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'LIST'
                ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Log & Riwayat OTP ({otps.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('RANKS_MATRIX')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'RANKS_MATRIX'
                ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Matriks Akses Pangkat Kepolisian</span>
          </button>
        </div>

        {/* Notification Banner */}
        {actionSuccess && (
          <div className="mx-5 mt-3 p-2.5 bg-emerald-950/80 border border-emerald-500/60 rounded-lg text-emerald-300 text-xs flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{actionSuccess}</span>
            </div>
            <button onClick={() => setActionSuccess(null)} className="text-emerald-400 hover:text-emerald-200">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Modal Body Content */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 custom-scrollbar space-y-4">
          
          {/* TAB 1: GENERATE NEW OTP */}
          {activeTab === 'GENERATE' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              
              {/* Left Column: Form */}
              <form onSubmit={handleGenerate} className="lg:col-span-7 space-y-4">
                
                {/* Module Selector */}
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase tracking-wider">
                    1. Pilih Modul yang Diotorisasi
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { key: 'DETECTIVE' as ModuleAccessKey, label: '🔍 Kasus Detektif', desc: 'Investigasi CID' },
                      { key: 'BOLO' as ModuleAccessKey, label: '🚗 BOLO & Sitaan', desc: 'Patrol Unit & Tilang' },
                      { key: 'VAULT' as ModuleAccessKey, label: '🏦 Brankas & Audit', desc: 'Uang & Bukti Sitaan' },
                      { key: 'DESTRUCTION' as ModuleAccessKey, label: '💥 Peleburan Sitaan', desc: 'Kendaraan & Narkoba' },
                      { key: 'OFFICIAL_DOCS' as ModuleAccessKey, label: '📄 Surat & Dokumen', desc: 'WCL & Surat Perintah' },
                      { key: 'CASE_HISTORY' as ModuleAccessKey, label: '📁 Riwayat Kasus', desc: 'Arsip Penindakan' },
                      { key: 'FORENSICS' as ModuleAccessKey, label: '🔬 Lab Forensik', desc: 'Uji Balistik & GSR' },
                      { key: 'IAD' as ModuleAccessKey, label: '🛡️ Propam IAD', desc: 'Disiplin Internal' },
                      { key: 'UNIVERSAL' as ModuleAccessKey, label: '🌐 Universal Master', desc: 'Semua Modul Terkunci' },
                    ].map(mod => {
                      const isSelected = targetModule === mod.key;
                      return (
                        <button
                          type="button"
                          key={mod.key}
                          onClick={() => setTargetModule(mod.key)}
                          className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                            isSelected
                              ? 'bg-amber-500/20 border-amber-400 text-amber-200 ring-1 ring-amber-400/40 shadow-sm shadow-amber-950/50'
                              : 'bg-[#141820] border-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
                          }`}
                        >
                          <span className="font-bold text-xs">{mod.label}</span>
                          <span className="text-[10px] text-gray-400 mt-0.5">{mod.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Recipient Officer Selection */}
                <div className="bg-[#141820] p-3.5 rounded-xl border border-gray-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                      2. Petugas Penerima Mandat
                    </label>
                    <div className="flex items-center gap-2 text-xs">
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="recipientType"
                          checked={recipientType === 'SPECIFIC'}
                          onChange={() => setRecipientType('SPECIFIC')}
                          className="text-amber-500 focus:ring-amber-500"
                        />
                        <span className={recipientType === 'SPECIFIC' ? 'text-amber-300 font-bold' : 'text-gray-400'}>Pilih dari Roster</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="recipientType"
                          checked={recipientType === 'GENERAL'}
                          onChange={() => setRecipientType('GENERAL')}
                          className="text-amber-500 focus:ring-amber-500"
                        />
                        <span className={recipientType === 'GENERAL' ? 'text-amber-300 font-bold' : 'text-gray-400'}>Semua Petugas (#ALL)</span>
                      </label>
                    </div>
                  </div>

                  {recipientType === 'SPECIFIC' ? (
                    <div className="space-y-2">
                      <select
                        value={selectedRosterOfficer}
                        onChange={(e) => {
                          setSelectedRosterOfficer(e.target.value);
                          setManualOfficerName('');
                          setManualOfficerBadge('');
                        }}
                        className="w-full bg-[#0D1117] border border-gray-700 focus:border-amber-400 rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none"
                      >
                        <option value="">-- Pilih Petugas dari Roster HSPD ({roster.length} Personel) --</option>
                        {roster.map(officer => (
                          <option key={officer.id} value={officer.id}>
                            {officer.badge} - {officer.name} ({officer.rank}) • {officer.division}
                          </option>
                        ))}
                      </select>

                      <div className="text-[11px] text-gray-500 flex items-center gap-1.5">
                        <span>Atau input manual:</span>
                        <input
                          type="text"
                          placeholder="Nama Petugas"
                          value={manualOfficerName}
                          onChange={(e) => {
                            setManualOfficerName(e.target.value);
                            setSelectedRosterOfficer('');
                          }}
                          className="bg-[#0D1117] border border-gray-700 px-2 py-1 rounded text-xs text-gray-300 focus:outline-none focus:border-amber-400 flex-1"
                        />
                        <input
                          type="text"
                          placeholder="Badge #"
                          value={manualOfficerBadge}
                          onChange={(e) => setManualOfficerBadge(e.target.value)}
                          className="bg-[#0D1117] border border-gray-700 px-2 py-1 rounded text-xs text-gray-300 focus:outline-none focus:border-amber-400 w-20 font-mono"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="p-2.5 bg-amber-950/30 border border-amber-800/40 rounded-lg text-amber-300 text-xs flex items-center gap-2">
                      <Shield className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Kode OTP ini dapat dipakai oleh petugas mana pun yang bertugas di lapangan.</span>
                    </div>
                  )}
                </div>

                {/* Duration & Validity */}
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase tracking-wider">
                    3. Masa Berlaku Kode OTP
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { val: 0, label: '1x Pakai', desc: 'Hangus Seketika' },
                      { val: 15, label: '15 Menit', desc: 'Tugas Cepat' },
                      { val: 30, label: '30 Menit', desc: 'Standar Disposisi' },
                      { val: 60, label: '1 Jam', desc: 'Shift Penuh' },
                    ].map(d => (
                      <button
                        type="button"
                        key={d.val}
                        onClick={() => setDurationMinutes(d.val)}
                        className={`p-2 rounded-xl border text-center transition ${
                          durationMinutes === d.val
                            ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                            : 'bg-[#141820] border-gray-800 text-gray-400 hover:text-gray-200'
                        }`}
                      >
                        <div className="text-xs font-mono">{d.label}</div>
                        <div className="text-[9px] text-gray-400">{d.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Purpose & Presets */}
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase tracking-wider">
                    4. Dasar / Alasan Disposisi Penugasan
                  </label>
                  <input
                    type="text"
                    required
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="Contoh: Disposisi Perintah Audit Brankas Mingguan Markas"
                    className="w-full bg-[#141820] border border-gray-700 focus:border-amber-400 rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none"
                  />

                  {/* Preset quick buttons */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {PRESET_REASONS.map((p, idx) => (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => {
                          setTargetModule(p.module);
                          setPurpose(p.text);
                        }}
                        className="text-[10px] bg-gray-800/80 hover:bg-gray-700 border border-gray-700 text-gray-300 px-2 py-0.5 rounded-full transition"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-black font-bold text-xs rounded-xl shadow-lg shadow-amber-950/60 transition flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>TERBITKAN KODE AKSES SEKALI PAKAI (GENERATE OTP)</span>
                </button>
              </form>

              {/* Right Column: Live Generated Result Box */}
              <div className="lg:col-span-5 flex flex-col space-y-4">
                <div className="bg-[#141820] border border-amber-500/40 rounded-2xl p-4 sm:p-5 flex flex-col justify-between flex-1 relative overflow-hidden shadow-inner">
                  
                  {/* Decorative background glow */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>

                  <div>
                    <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-3">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-amber-400" />
                        <span className="font-bold text-xs text-amber-300">KARTU OTORISASI DISPOSISI</span>
                      </div>
                      <span className="text-[10px] font-mono text-gray-500">MDC-CAD DISPATCH</span>
                    </div>

                    {createdOtp ? (
                      <div className="space-y-3">
                        <div className="text-center py-4 bg-[#0A0D12] border border-amber-500/50 rounded-xl">
                          <div className="text-[10px] text-gray-400 uppercase tracking-widest font-mono mb-1">
                            KODE OTP RESMI DAPAT DIGUNAKAN
                          </div>
                          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-amber-400 tracking-wider flex items-center justify-center gap-2">
                            <span>{createdOtp.code}</span>
                          </div>
                          <div className="text-[10px] text-emerald-400 font-bold mt-1 flex items-center justify-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>STATUS: AKTIF & SIAP PAKAI</span>
                          </div>
                        </div>

                        <div className="space-y-1.5 text-[11px] bg-[#0E1218] p-3 rounded-lg border border-gray-800">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Modul Tujuan:</span>
                            <strong className="text-gray-200">{createdOtp.moduleLabel}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Penerima Mandat:</span>
                            <strong className="text-amber-300">{createdOtp.issuedToOfficerName}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Atasan Penerbit:</span>
                            <span className="text-gray-300">{createdOtp.issuedByRank} {createdOtp.issuedByOfficerName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Masa Berlaku:</span>
                            <span className="text-emerald-400 font-mono">
                              {createdOtp.durationMinutes > 0 ? `${createdOtp.durationMinutes} Menit` : '1x Akses Saja'}
                            </span>
                          </div>
                          <div className="pt-1.5 border-t border-gray-800 text-[10px] text-gray-400">
                            <strong>Dasar Disposisi:</strong> {createdOtp.purpose}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-10 px-4 text-gray-500 space-y-2">
                        <KeyRound className="w-8 h-8 mx-auto text-gray-600 animate-pulse" />
                        <p className="text-xs">Isi formulir di sebelah kiri lalu klik tombol terbitkan untuk men-generate kode OTP.</p>
                      </div>
                    )}
                  </div>

                  {/* Actions for generated OTP */}
                  {createdOtp && (
                    <div className="space-y-2 mt-4 pt-3 border-t border-gray-800">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopyCode(createdOtp.code)}
                          className="py-2 px-3 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-xs font-bold font-mono transition flex items-center justify-center gap-1.5 border border-gray-700"
                        >
                          {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
                          <span>{copiedCode ? 'TERSALIN!' : 'SALIN KODE'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyBroadcast(createdOtp)}
                          className="py-2 px-3 bg-amber-950/80 hover:bg-amber-900 text-amber-300 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 border border-amber-700/60"
                          title="Salin teks roleplay radio 1111 / Discord broadcast"
                        >
                          {copiedBroadcast ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Radio className="w-3.5 h-3.5 text-amber-400" />}
                          <span>{copiedBroadcast ? 'FORMAT SALIN!' : 'FORMAT RADIO'}</span>
                        </button>
                      </div>
                      <p className="text-[10px] text-gray-400 text-center">
                        Kirimkan kode OTP ini kepada petugas bersangkutan via in-game chat atau radio 1111.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: OTP AUDIT LOGS & HISTORY */}
          {activeTab === 'LIST' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                  <span>Daftar Kode OTP Terbit & Riwayat Penggunaan</span>
                  <span className="text-amber-400 font-mono">({otps.length} Entri)</span>
                </h3>
                <button
                  onClick={() => setOtps(getSavedOtps())}
                  className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-xs flex items-center gap-1 transition"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Segarkan</span>
                </button>
              </div>

              {otps.length === 0 ? (
                <div className="text-center py-12 text-gray-500 bg-[#141820] rounded-xl border border-gray-800">
                  <ShieldAlert className="w-8 h-8 mx-auto text-gray-600 mb-2" />
                  <p className="text-xs">Belum ada kode OTP yang diterbitkan.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {otps.map((otp) => {
                    const isExpired = otp.status === 'EXPIRED' || (otp.expiresAt > 0 && Date.now() > otp.expiresAt);
                    const isUsed = otp.status === 'USED';
                    const isRevoked = otp.status === 'REVOKED';
                    const isActive = otp.status === 'ACTIVE' && !isExpired;

                    return (
                      <div
                        key={otp.id}
                        className={`p-3 rounded-xl border transition flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                          isActive
                            ? 'bg-[#141820] border-amber-500/40 text-gray-200'
                            : isUsed
                              ? 'bg-[#0E1217] border-gray-800 text-gray-400'
                              : isRevoked
                                ? 'bg-rose-950/20 border-rose-900/40 text-rose-300/80'
                                : 'bg-[#0E1217] border-gray-800 text-gray-500'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                            isActive 
                              ? 'bg-amber-500/20 border border-amber-400 text-amber-300' 
                              : isUsed 
                                ? 'bg-emerald-950/50 border border-emerald-800 text-emerald-400' 
                                : isRevoked 
                                  ? 'bg-rose-950/50 border border-rose-800 text-rose-400'
                                  : 'bg-gray-800 text-gray-500'
                          }`}>
                            <KeyRound className="w-4 h-4" />
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-bold text-sm text-amber-300">{otp.code}</span>
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-950 text-blue-300 border border-blue-800">
                                {otp.moduleLabel}
                              </span>
                              {isActive && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                                  AKTIF & SIAP PAKAI
                                </span>
                              )}
                              {isUsed && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                                  TERPAKAI OLEH {otp.usedByOfficerName || 'Petugas'} ({otp.usedByBadge})
                                </span>
                              )}
                              {isRevoked && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                                  DICABUT / DIBATALKAN
                                </span>
                              )}
                              {isExpired && !isUsed && !isRevoked && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-gray-800 text-gray-400 border border-gray-700">
                                  KEDALUWARSA
                                </span>
                              )}
                            </div>

                            <div className="text-xs text-gray-300 flex items-center gap-2 flex-wrap">
                              <span>Penerima: <strong className="text-amber-200">{otp.issuedToOfficerName}</strong></span>
                              <span className="text-gray-600">•</span>
                              <span>Penerbit: <strong>{otp.issuedByRank} {otp.issuedByOfficerName}</strong></span>
                              <span className="text-gray-600">•</span>
                              <span>Dibuat: {new Date(otp.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>

                            <div className="text-[10px] text-gray-400">
                              <em>"{otp.purpose}"</em>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isActive && (
                            <>
                              <button
                                onClick={() => handleCopyCode(otp.code)}
                                className="px-2.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded text-xs font-mono flex items-center gap-1 border border-gray-700"
                                title="Salin Kode OTP"
                              >
                                <Copy className="w-3 h-3 text-amber-400" />
                                <span>Salin</span>
                              </button>
                              <button
                                onClick={() => handleCopyBroadcast(otp)}
                                className="px-2.5 py-1.5 bg-amber-950/60 hover:bg-amber-900 text-amber-300 rounded text-xs flex items-center gap-1 border border-amber-800/60"
                                title="Salin format radio 1111"
                              >
                                <Radio className="w-3 h-3 text-amber-400" />
                                <span>Radio</span>
                              </button>
                              <button
                                onClick={() => handleRevoke(otp.id)}
                                className="px-2.5 py-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 rounded text-xs flex items-center gap-1 border border-rose-800/60"
                                title="Batalkan / Cabut OTP"
                              >
                                <Ban className="w-3 h-3 text-rose-400" />
                                <span>Cabut</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: RANKS & CLEARANCE MATRIX */}
          {activeTab === 'RANKS_MATRIX' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-gradient-to-r from-blue-950/40 via-blue-900/20 to-transparent border border-blue-800/40 rounded-xl text-xs space-y-1">
                <div className="flex items-center gap-2 text-blue-300 font-bold">
                  <Award className="w-4 h-4 text-blue-400" />
                  <span>STRUKTUR KEWENANGAN AKSES & DISPOSISI KEPOLISIAN HSPD</span>
                </div>
                <p className="text-gray-400">
                  Berikut adalah panduan resmi pembagian hak akses langsung berdasarkan pangkat jabatan kepolisian serta modul yang memerlukan otorisasi Kode Akses Sekali Pakai (OTP).
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                
                {/* Tier 1 */}
                <div className="p-3.5 bg-[#141820] border border-amber-500/40 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      TIER 1 - HIGH COMMAND
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">AKSES PENUH SEMUA MODUL</span>
                  </div>
                  <div className="text-xs font-bold text-gray-200">
                    Chief of Police [COP], Assistant Chief [A/C], Deputy Chief [D/C], Commander [CDR]
                  </div>
                  <ul className="text-[11px] text-gray-400 space-y-1 list-disc list-inside">
                    <li>Akses langsung tanpa batas ke <strong>Brankas & Audit</strong>, <strong>Peleburan Sitaan</strong>, <strong>Dokumen Rahasia / WCL</strong>, <strong>Riwayat Kasus</strong>, & <strong>Manajemen Roster</strong>.</li>
                    <li>Dapat menerbitkan <strong>Kode Akses Sekali Pakai (OTP)</strong> & Master Universal untuk bawahan.</li>
                  </ul>
                </div>

                {/* Tier 2 */}
                <div className="p-3.5 bg-[#141820] border border-blue-500/40 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                      TIER 2 - COMMAND STAFF & SUPERVISOR
                    </span>
                    <span className="text-[10px] font-mono text-blue-400 font-bold">AKSES LANGSUNG & PEMBERI OTP</span>
                  </div>
                  <div className="text-xs font-bold text-gray-200">
                    Captain [CPT], Lieutenant [LT]
                  </div>
                  <ul className="text-[11px] text-gray-400 space-y-1 list-disc list-inside">
                    <li>Akses langsung ke <strong>Brankas</strong>, <strong>Peleburan Sitaan</strong>, <strong>Surat Rahasia</strong>, <strong>Riwayat Kasus</strong>, & <strong>Biro Investigasi Kriminal (CID)</strong>.</li>
                    <li>Memiliki hak menerbitkan <strong>Kode Akses Sekali Pakai (OTP)</strong> untuk anggota patroli (PO I–III, SGT, Cadet).</li>
                  </ul>
                </div>

                {/* Tier 3 */}
                <div className="p-3.5 bg-[#141820] border border-purple-500/40 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                      TIER 3 - FIELD SUPERVISOR & CID
                    </span>
                    <span className="text-[10px] font-mono text-purple-300">AKSES LAPANGAN + OTP ATASAN</span>
                  </div>
                  <div className="text-xs font-bold text-gray-200">
                    Sergeant [SGT], Senior Lead Officer [SLO], Anggota Detective Bureau / CID
                  </div>
                  <ul className="text-[11px] text-gray-400 space-y-1 list-disc list-inside">
                    <li>Akses langsung ke Kalkulator Pasal, Megaphone, Hak Miranda, BOLO & Sitaan, serta Kasus Detektif (khusus divisi CID).</li>
                    <li>Untuk membuka <strong>Brankas & Peleburan</strong>: Memerlukan <strong>Kode OTP Sekali Pakai</strong> dari Lieutenant / Captain / High Command.</li>
                  </ul>
                </div>

                {/* Tier 4 & 5 */}
                <div className="p-3.5 bg-[#141820] border border-emerald-500/40 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      TIER 4 & 5 - PATROL OFFICER & CADET
                    </span>
                    <span className="text-[10px] font-mono text-amber-450 text-amber-300">WAJIB KODE OTP DARI ATASAN</span>
                  </div>
                  <div className="text-xs font-bold text-gray-200">
                    Police Officer III, II, I [PO I-III] & Cadet [CDT]
                  </div>
                  <ul className="text-[11px] text-gray-400 space-y-1 list-disc list-inside">
                    <li>Dapat menerbitkan Surat & Dokumen Biasa (SKCK, Laporan Polisi, Tilang Umum).</li>
                    <li>Modul Sensitif (Brankas, Peleburan, Surat Rahasia/WCL, Riwayat Kasus) <strong>TERKUNCI SECARA AMAN</strong> dan dapat dibuka jika diberikan <strong>Kode OTP dari Atasan</strong>.</li>
                  </ul>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-[#11141A] border-t border-gray-800 flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <span>Petugas Aktif: <strong className="text-gray-200">{currentOfficer?.name}</strong> ({currentOfficer?.rank})</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-bold transition"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
