import React, { useState, useEffect } from 'react';
import { 
  Landmark, Plus, Search, Filter, Calendar, DollarSign, Shield,
  FileText, Upload, CheckCircle2, AlertTriangle, AlertCircle, Clock,
  Eye, Trash2, Send, Download, RefreshCw, X, FileUp, Sparkles, UserCheck,
  Paperclip, ExternalLink, Archive, ChevronDown, ChevronRight, Lock, Printer,
  ShieldAlert, Layers, Pill, Crosshair, Camera, Image as ImageIcon, Award
} from 'lucide-react';
import { VaultAuditLog, OfficerProfile, isOfficerHighRank } from '../types';
import { 
  getSavedVaultAuditLogs, saveVaultAudit, deleteVaultAudit,
  getWeeklyAuditStatus, generateAuditReportSummary, WeeklyAuditStatus
} from '../utils/vaultAndDestructionStorage';
import { sendVaultAuditToDiscord, getSavedVaultWebhookConfig } from '../utils/discordWebhook';
import { exportElementAsImage } from '../utils/exportDocumentAsImage';

interface Props {
  currentOfficer: OfficerProfile | null;
}

export const VaultAuditBoard: React.FC<Props> = ({ currentOfficer }) => {
  const [audits, setAudits] = useState<VaultAuditLog[]>(() => getSavedVaultAuditLogs());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAudit, setSelectedAudit] = useState<VaultAuditLog | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExportingImage, setIsExportingImage] = useState<'png' | 'jpeg' | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Sync listener
  useEffect(() => {
    const handleSync = () => setAudits(getSavedVaultAuditLogs());
    window.addEventListener('hspd-vault-updated', handleSync);
    return () => window.removeEventListener('hspd-vault-updated', handleSync);
  }, []);

  // Export Vault Audit Document to PNG / JPG
  const handleExportAuditImage = async (format: 'png' | 'jpeg') => {
    if (!selectedAudit) return;
    setIsExportingImage(format);
    try {
      const res = await exportElementAsImage('vault-audit-certificate-sheet', {
        fileName: `BERITA_ACARA_AUDIT_BRANKAS_${selectedAudit.auditNumber}_${selectedAudit.auditDate}`,
        format,
        quality: 0.98,
        backgroundColor: '#0F1318',
        scale: 2
      });

      if (res.success) {
        setNotification({
          type: 'success',
          message: `Berhasil mengunduh Berita Acara Audit Brankas dalam format ${format.toUpperCase()}!`
        });
      } else {
        setNotification({
          type: 'error',
          message: res.error || 'Gagal mengekspor dokumen audit ke gambar.'
        });
      }
    } catch (e: any) {
      setNotification({
        type: 'error',
        message: e.message || 'Terjadi kesalahan saat memproses gambar.'
      });
    } finally {
      setIsExportingImage(null);
    }
  };

  // Form states
  const [weekLabel, setWeekLabel] = useState(`Minggu ke-${Math.ceil(new Date().getDate() / 7)} (${new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' })})`);
  const [witnessOfficer, setWitnessOfficer] = useState('');
  const [cashConfiscated, setCashConfiscated] = useState<number>(350000);
  const [cleanCashFund, setCleanCashFund] = useState<number>(50000);

  // Drugs breakdown
  const [weedGrams, setWeedGrams] = useState<number>(1200);
  const [cocaineGrams, setCocaineGrams] = useState<number>(650);
  const [crackGrams, setCrackGrams] = useState<number>(250);
  const [methGrams, setMethGrams] = useState<number>(400);
  const [pillsCount, setPillsCount] = useState<number>(100);

  // Weapons breakdown
  const [handgunsCount, setHandgunsCount] = useState<number>(30);
  const [shotgunsCount, setShotgunsCount] = useState<number>(12);
  const [smgCount, setSmgCount] = useState<number>(16);
  const [rifleCount, setRifleCount] = useState<number>(10);
  const [heavyWeaponsCount, setHeavyWeaponsCount] = useState<number>(2);

  // Ammo breakdown
  const [pistolAmmo, setPistolAmmo] = useState<number>(2500);
  const [shotgunShells, setShotgunShells] = useState<number>(600);
  const [smgAmmo, setSmgAmmo] = useState<number>(1500);
  const [rifleAmmo, setRifleAmmo] = useState<number>(1200);

  // Status & notes
  const [otherItemsNote, setOtherItemsNote] = useState('');
  const [vaultSealStatus, setVaultSealStatus] = useState<'INTACT_SECURED' | 'SEAL_BROKEN_DISCREPANCY' | 'UNDER_MAINTENANCE'>('INTACT_SECURED');
  const [auditNotes, setAuditNotes] = useState('');
  const [uploadedPhotos, setUploadedPhotos] = useState<{ name: string; dataUrl: string }[]>([]);

  // Weekly Audit Status calculation
  const weeklyStatus: WeeklyAuditStatus = getWeeklyAuditStatus(audits);

  const resetForm = () => {
    setWeekLabel(`Minggu ke-${Math.ceil(new Date().getDate() / 7)} (${new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' })})`);
    setWitnessOfficer('');
    setCashConfiscated(350000);
    setCleanCashFund(50000);
    setWeedGrams(1200);
    setCocaineGrams(650);
    setCrackGrams(250);
    setMethGrams(400);
    setPillsCount(100);
    setHandgunsCount(30);
    setShotgunsCount(12);
    setSmgCount(16);
    setRifleCount(10);
    setHeavyWeaponsCount(2);
    setPistolAmmo(2500);
    setShotgunShells(600);
    setSmgAmmo(1500);
    setRifleAmmo(1200);
    setOtherItemsNote('');
    setVaultSealStatus('INTACT_SECURED');
    setAuditNotes('');
    setUploadedPhotos([]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      if (file.size > 8 * 1024 * 1024) {
        setNotification({ type: 'error', message: `Foto ${file.name} melebihi batas 8MB` });
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setUploadedPhotos(prev => [...prev, {
          name: file.name,
          dataUrl: result
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeUploadedPhoto = (index: number) => {
    setUploadedPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOfficer) {
      setNotification({ type: 'error', message: 'Anda harus login untuk melakukan audit brankas.' });
      return;
    }

    setIsSubmitting(true);
    setNotification(null);

    try {
      const now = new Date();
      const auditNumber = `HSPD-VAULT-${now.getFullYear().toString().slice(-2)}-W${String(Math.ceil(now.getDate() / 7)).padStart(2, '0')}-${String(Math.floor(100 + Math.random() * 900))}`;
      
      const newAudit: VaultAuditLog = {
        id: `VAULT-${Date.now()}`,
        auditNumber,
        weekLabel: weekLabel.trim() || `Minggu ${now.toLocaleDateString('id-ID')}`,
        auditDate: now.toISOString().split('T')[0],
        auditorName: currentOfficer.name || 'Petugas HSPD',
        auditorBadge: currentOfficer.badge || '#HQ',
        auditorRank: currentOfficer.rank || 'Officer',
        witnessOfficer: witnessOfficer.trim() || undefined,
        cashConfiscated: Number(cashConfiscated) || 0,
        cleanCashFund: Number(cleanCashFund) || 0,
        drugsSummary: {
          weedGrams: Number(weedGrams) || 0,
          cocaineGrams: Number(cocaineGrams) || 0,
          crackGrams: Number(crackGrams) || 0,
          methGrams: Number(methGrams) || 0,
          pillsCount: Number(pillsCount) || 0
        },
        weaponsSummary: {
          handgunsCount: Number(handgunsCount) || 0,
          shotgunsCount: Number(shotgunsCount) || 0,
          smgCount: Number(smgCount) || 0,
          rifleCount: Number(rifleCount) || 0,
          heavyWeaponsCount: Number(heavyWeaponsCount) || 0
        },
        ammoSummary: {
          pistolAmmo: Number(pistolAmmo) || 0,
          shotgunShells: Number(shotgunShells) || 0,
          smgAmmo: Number(smgAmmo) || 0,
          rifleAmmo: Number(rifleAmmo) || 0
        },
        otherItemsNote: otherItemsNote.trim() || undefined,
        vaultSealStatus,
        auditNotes: auditNotes.trim() || 'Stock opname mingguan disetujui sesuai catatan fisik logistik.',
        evidencePhotos: uploadedPhotos.map(p => p.dataUrl),
        timestamp: Date.now(),
        nextAuditDueDate: Date.now() + 7 * 24 * 60 * 60 * 1000
      };

      // Save locally
      saveVaultAudit(newAudit);
      setAudits(getSavedVaultAuditLogs());

      // Discord webhook auto-send
      const vaultConfig = getSavedVaultWebhookConfig();
      if (vaultConfig.autoSendOnSave && vaultConfig.webhookUrl) {
        await sendVaultAuditToDiscord(newAudit, currentOfficer);
      }

      setNotification({
        type: 'success',
        message: `Laporan Audit Mingguan Brankas (${auditNumber}) berhasil disimpan dan disinkronkan ke Discord!`
      });
      setShowModal(false);
      resetForm();
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Terjadi kesalahan saat menyimpan audit brankas.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    if (!isOfficerHighRank(currentOfficer?.rank)) {
      setNotification({ type: 'error', message: 'Hanya jajaran High Command yang dapat menghapus data audit brankas.' });
      return;
    }
    if (window.confirm('Yakin ingin menghapus berkas audit brankas ini?')) {
      deleteVaultAudit(id);
      setAudits(getSavedVaultAuditLogs());
      if (selectedAudit?.id === id) setSelectedAudit(null);
      setNotification({ type: 'success', message: 'Berkas audit brankas berhasil dihapus.' });
    }
  };

  const filteredAudits = audits.filter(a => {
    return (
      a.auditNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.weekLabel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.auditorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.otherItemsNote && a.otherItemsNote.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-950/40 via-[#161B22] to-[#0D1117] border border-amber-900/60 rounded-xl p-5 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-900/50 border border-amber-600/60 rounded-lg text-amber-400">
                <Landmark className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-gray-100 uppercase tracking-wide">
                Manajemen Brankas & Gudang Sitaan (Central Vault & Armory)
              </h2>
              <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-700/80 px-2 py-0.5 rounded font-bold">
                AUDIT MINGGUAN (1X SEMINGGU)
              </span>
            </div>
            <p className="text-xs text-gray-400 max-w-2xl">
              Sistem pencatatan stock opname wajib setiap 7 hari sekali untuk memverifikasi total uang sitaan, narkotika, amunisi, dan senjata api di brankas baja markas HSPD.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-lg font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-600/30 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>CATAT AUDIT MINGGUAN BARU</span>
            </button>
          </div>
        </div>
      </div>

      {/* Weekly Cycle Status Alert */}
      <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${weeklyStatus.statusBadgeColor}`}>
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 shrink-0" />
          <div>
            <div className="font-bold text-xs">{weeklyStatus.statusBadgeText}</div>
            <div className="text-[11px] opacity-90">{weeklyStatus.message}</div>
          </div>
        </div>
        <div className="text-right text-xs font-mono shrink-0">
          <div>Terakhir Diaudit: <strong>{weeklyStatus.lastAudit ? `${weeklyStatus.daysSinceLastAudit} hari lalu` : 'Belum pernah'}</strong></div>
          <div className="text-[10px] opacity-75">Siklus berikutnya: <strong>{weeklyStatus.daysRemainingUntilNext} hari lagi</strong></div>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`p-3 rounded-lg border text-xs flex items-center justify-between font-bold animate-in fade-in ${
          notification.type === 'success' 
            ? 'bg-emerald-950/80 border-emerald-600 text-emerald-200' 
            : 'bg-rose-950/80 border-rose-600 text-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-gray-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Search & Audit Table */}
      <div className="bg-[#161B22] border border-gray-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Cari no audit, nama auditor, catatan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#0D1117] border border-gray-700 focus:border-amber-500 rounded-lg text-xs text-gray-200 outline-none"
            />
            <Search className="w-4 h-4 text-gray-500 absolute left-2.5 top-2" />
          </div>
          <div className="text-xs text-gray-400">
            Total Berkas Audit: <strong className="text-amber-400">{audits.length} Siklus</strong>
          </div>
        </div>

        {filteredAudits.length === 0 ? (
          <div className="p-12 text-center text-gray-500 space-y-2">
            <Landmark className="w-10 h-10 mx-auto text-gray-600" />
            <div className="font-bold text-gray-400">Tidak ada riwayat audit brankas yang ditemukan.</div>
            <p className="text-xs">Lakukan audit mingguan pertama Anda sekarang.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800/60">
            {filteredAudits.map((item) => (
              <div key={item.id} className="p-4 hover:bg-gray-800/30 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-amber-400 bg-amber-950/60 border border-amber-800 px-2 py-0.5 rounded">
                      {item.auditNumber}
                    </span>
                    <span className="text-xs text-gray-300 font-bold bg-gray-900 px-2 py-0.5 rounded border border-gray-800">
                      {item.weekLabel}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                      item.vaultSealStatus === 'INTACT_SECURED'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                        : item.vaultSealStatus === 'SEAL_BROKEN_DISCREPANCY'
                        ? 'bg-rose-950 text-rose-300 border-rose-700'
                        : 'bg-amber-950 text-amber-300 border-amber-700'
                    }`}>
                      {item.vaultSealStatus === 'INTACT_SECURED' ? '🔒 SEGEL AMAN (SESUAI)' : item.vaultSealStatus === 'SEAL_BROKEN_DISCREPANCY' ? '⚠️ SELISIH / RUSAK' : '⚙️ PERAWATAN'}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {item.auditDate}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1 text-gray-400">
                    <div>
                      <span className="text-gray-500 block text-[10px]">KAS SITAAN:</span>
                      <span className="font-bold text-emerald-400">${item.cashConfiscated.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[10px]">TOTAL NARKOTIKA:</span>
                      <span className="font-bold text-rose-400">
                        {((item.drugsSummary.weedGrams || 0) + (item.drugsSummary.cocaineGrams || 0) + (item.drugsSummary.methGrams || 0)).toLocaleString()}g
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[10px]">SENPI DI GUDANG:</span>
                      <span className="font-bold text-blue-400">
                        {((item.weaponsSummary.handgunsCount || 0) + (item.weaponsSummary.shotgunsCount || 0) + (item.weaponsSummary.smgCount || 0) + (item.weaponsSummary.rifleCount || 0))} Pucuk
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[10px]">AUDITOR:</span>
                      <span className="text-gray-200">{item.auditorName} ({item.auditorBadge})</span>
                    </div>
                  </div>

                  {item.auditNotes && (
                    <div className="text-[11px] text-gray-400 pt-0.5 truncate">
                      <strong className="text-gray-300">Catatan:</strong> {item.auditNotes}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setSelectedAudit(item)}
                    className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 rounded text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-amber-400" />
                    <span>Lihat Detail</span>
                  </button>

                  {isOfficerHighRank(currentOfficer?.rank) && (
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 bg-gray-800 hover:bg-rose-900/60 text-gray-400 hover:text-rose-300 border border-gray-700 rounded transition cursor-pointer"
                      title="Hapus Berkas Audit"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL: FORM CATAT AUDIT BARU */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in font-mono text-xs">
          <div className="bg-[#161B22] border border-amber-800/80 rounded-xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="bg-[#0F1319] border-b border-gray-800 px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-900/60 border border-amber-600 rounded-lg text-amber-300">
                  <Landmark className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-100">
                    Formulir Stock Opname & Audit Mingguan Brankas HSPD
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Pencatatan wajib setiap 7 hari sekali untuk transparansi dan akuntabilitas kepolisian.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Header Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#0D1117] p-3 rounded-lg border border-gray-800">
                <div>
                  <label className="text-[11px] font-bold text-gray-300 block mb-1">
                    Label Siklus Audit:
                  </label>
                  <input
                    type="text"
                    required
                    value={weekLabel}
                    onChange={(e) => setWeekLabel(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#161B22] border border-gray-700 focus:border-amber-500 rounded text-xs text-gray-200 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-300 block mb-1">
                    Saksi Pendamping Audit:
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Amy Santiago (#215)"
                    value={witnessOfficer}
                    onChange={(e) => setWitnessOfficer(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#161B22] border border-gray-700 rounded text-xs text-gray-200 outline-none"
                  />
                </div>
              </div>

              {/* Financial Assets */}
              <div className="bg-[#0D1117] p-3 rounded-lg border border-gray-800 space-y-2">
                <div className="font-bold text-emerald-400 text-xs flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>1. Kas Keuangan & Dana Brankas ($)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-gray-400 block mb-1">
                      Uang Sitaan Kasus (Dirty / Confiscated Cash):
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={cashConfiscated}
                      onChange={(e) => setCashConfiscated(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-[#161B22] border border-gray-700 focus:border-emerald-500 rounded text-xs text-emerald-300 font-bold outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-gray-400 block mb-1">
                      Kas Operasional Resmi (Clean Fund):
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={cleanCashFund}
                      onChange={(e) => setCleanCashFund(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-[#161B22] border border-gray-700 rounded text-xs text-gray-200 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Narcotics Storage */}
              <div className="bg-[#0D1117] p-3 rounded-lg border border-gray-800 space-y-2">
                <div className="font-bold text-rose-400 text-xs flex items-center gap-1.5">
                  <Pill className="w-3.5 h-3.5" />
                  <span>2. Rincian Narkotika Sitaan di Lemari Khusus Forensik (Gram / Butir)</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1">Marijuana (g):</label>
                    <input
                      type="number"
                      min="0"
                      value={weedGrams}
                      onChange={(e) => setWeedGrams(Number(e.target.value))}
                      className="w-full px-2 py-1 bg-[#161B22] border border-gray-700 rounded text-xs text-gray-200 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1">Cocaine (g):</label>
                    <input
                      type="number"
                      min="0"
                      value={cocaineGrams}
                      onChange={(e) => setCocaineGrams(Number(e.target.value))}
                      className="w-full px-2 py-1 bg-[#161B22] border border-gray-700 rounded text-xs text-gray-200 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1">Crack (g):</label>
                    <input
                      type="number"
                      min="0"
                      value={crackGrams}
                      onChange={(e) => setCrackGrams(Number(e.target.value))}
                      className="w-full px-2 py-1 bg-[#161B22] border border-gray-700 rounded text-xs text-gray-200 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1">Meth (g):</label>
                    <input
                      type="number"
                      min="0"
                      value={methGrams}
                      onChange={(e) => setMethGrams(Number(e.target.value))}
                      className="w-full px-2 py-1 bg-[#161B22] border border-gray-700 rounded text-xs text-gray-200 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1">Pills / Ekstasi:</label>
                    <input
                      type="number"
                      min="0"
                      value={pillsCount}
                      onChange={(e) => setPillsCount(Number(e.target.value))}
                      className="w-full px-2 py-1 bg-[#161B22] border border-gray-700 rounded text-xs text-gray-200 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Weapons & Armory Stock */}
              <div className="bg-[#0D1117] p-3 rounded-lg border border-gray-800 space-y-2">
                <div className="font-bold text-blue-400 text-xs flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>3. Senjata Api di Gudang Persenjataan & Brankas (Pucuk)</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1">Handgun / Pistol:</label>
                    <input
                      type="number"
                      min="0"
                      value={handgunsCount}
                      onChange={(e) => setHandgunsCount(Number(e.target.value))}
                      className="w-full px-2 py-1 bg-[#161B22] border border-gray-700 rounded text-xs text-gray-200 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1">Shotgun:</label>
                    <input
                      type="number"
                      min="0"
                      value={shotgunsCount}
                      onChange={(e) => setShotgunsCount(Number(e.target.value))}
                      className="w-full px-2 py-1 bg-[#161B22] border border-gray-700 rounded text-xs text-gray-200 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1">SMG / Micro:</label>
                    <input
                      type="number"
                      min="0"
                      value={smgCount}
                      onChange={(e) => setSmgCount(Number(e.target.value))}
                      className="w-full px-2 py-1 bg-[#161B22] border border-gray-700 rounded text-xs text-gray-200 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1">Assault Rifle:</label>
                    <input
                      type="number"
                      min="0"
                      value={rifleCount}
                      onChange={(e) => setRifleCount(Number(e.target.value))}
                      className="w-full px-2 py-1 bg-[#161B22] border border-gray-700 rounded text-xs text-gray-200 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1">Heavy / Senjata Berat:</label>
                    <input
                      type="number"
                      min="0"
                      value={heavyWeaponsCount}
                      onChange={(e) => setHeavyWeaponsCount(Number(e.target.value))}
                      className="w-full px-2 py-1 bg-[#161B22] border border-gray-700 rounded text-xs text-gray-200 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Upload Foto Fisik dari Device */}
              <div className="bg-[#0D1117] p-3 rounded-lg border border-gray-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-amber-400 text-xs flex items-center gap-1.5">
                    <FileUp className="w-3.5 h-3.5" />
                    <span>4. Foto Bukti Fisik Brankas & Segel (Folder Device)</span>
                  </div>
                  <span className="text-[10px] text-gray-500">Pilih file foto dari device</span>
                </div>

                <div className="border-2 border-dashed border-gray-700 hover:border-amber-500/80 rounded-lg p-3 text-center cursor-pointer transition relative bg-[#161B22]/50">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <Upload className="w-5 h-5 mx-auto text-amber-400 mb-1" />
                  <p className="text-xs font-bold text-gray-300">
                    Klik untuk memilih foto dari folder device Anda
                  </p>
                  <p className="text-[10px] text-gray-500">
                    Foto fisik tumpukan kas, segel baja nomor seri, atau lemari senjata
                  </p>
                </div>

                {uploadedPhotos.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    {uploadedPhotos.map((p, i) => (
                      <div key={i} className="relative group bg-black/60 rounded border border-gray-700 overflow-hidden">
                        <img src={p.dataUrl} alt={p.name} className="w-full h-16 object-cover" />
                        <button
                          type="button"
                          onClick={() => removeUploadedPhoto(i)}
                          className="absolute top-1 right-1 p-1 bg-red-600/90 text-white rounded hover:bg-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Status Segel & Catatan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-gray-300 block mb-1">
                    Kondisi Segel & Keamanan:
                  </label>
                  <select
                    value={vaultSealStatus}
                    onChange={(e: any) => setVaultSealStatus(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#0D1117] border border-gray-700 focus:border-amber-500 rounded text-xs text-gray-200 outline-none"
                  >
                    <option value="INTACT_SECURED">🔒 INTACT_SECURED (Segel Utuh & Sesuai)</option>
                    <option value="SEAL_BROKEN_DISCREPANCY">⚠️ SEAL_BROKEN_DISCREPANCY (Segel Rusak / Selisih)</option>
                    <option value="UNDER_MAINTENANCE">⚙️ UNDER_MAINTENANCE (Sedang Perawatan / Kalibrasi)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-300 block mb-1">
                    Barang Berharga Lainnya (Emas / Dokumen):
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 4 Batang Emas Sitaan..."
                    value={otherItemsNote}
                    onChange={(e) => setOtherItemsNote(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#0D1117] border border-gray-700 rounded text-xs text-gray-200 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-300 block mb-1">
                  Catatan Evaluasi & Kesimpulan Audit:
                </label>
                <textarea
                  rows={2}
                  placeholder="Catatan hasil verifikasi fisik..."
                  value={auditNotes}
                  onChange={(e) => setAuditNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 rounded text-xs text-gray-200 outline-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded font-bold transition"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded shadow-lg shadow-amber-600/30 transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Menyimpan & Mengirim Webhook...</span>
                    </>
                  ) : (
                    <>
                      <Landmark className="w-4 h-4" />
                      <span>SIMPAN AUDIT MINGGUAN & KIRIM KE DISCORD</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL: BERITA ACARA AUDIT FISIK BRANKAS */}
      {selectedAudit && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in font-mono text-xs">
          <div className="bg-[#12151B] border-2 border-amber-600 rounded-xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
            <div className="bg-[#0A0D12] border-b border-gray-800 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-sm text-gray-100">
                    LEMBAR BERITA ACARA STOCK OPNAME BRANKAS HSPD
                  </h3>
                  <p className="text-[10px] text-gray-400">
                    Dokumen audit fisik berkala barang sitaan, amunisi, senjata, dan kas negara.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAudit(null)}
                className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Document sheet that gets exported as PNG / JPG */}
            <div className="p-4 overflow-y-auto flex-1 bg-black/40">
              <div 
                id="vault-audit-certificate-sheet"
                className="p-7 space-y-4 bg-[#0F1318] border-2 border-amber-700/80 rounded-xl shadow-2xl relative overflow-hidden text-gray-200 font-mono"
                style={{ minWidth: '550px' }}
              >
                {/* Background Police Seal Watermark */}
                <div className="absolute right-6 top-1/3 opacity-5 pointer-events-none select-none text-white text-9xl font-black rotate-12">
                  HSPD
                </div>

                {/* Header Kop Surat Polisi */}
                <div className="border-b-2 border-amber-600/60 pb-3 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-[11px] tracking-widest uppercase text-amber-400 font-bold flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-amber-400 inline" />
                      <span>HIGH SPEED POLICE DEPARTMENT (HSPD)</span>
                    </div>
                    <div className="text-[9px] text-gray-400 uppercase tracking-wider">
                      INTERNAL AUDIT, EVIDENCE LOCKER & CENTRAL VAULT DIVISION
                    </div>
                    <div className="text-[8px] text-gray-500 font-mono">
                      HEADQUARTERS STATION 01 • MISSION ROW • LOS SANTOS STATE POLICE
                    </div>
                  </div>
                  <div className="text-right border border-amber-700/60 bg-amber-950/40 px-3 py-1.5 rounded">
                    <div className="text-[8px] uppercase text-amber-300 font-bold">STATUS AUDIT</div>
                    <div className="text-[11px] font-bold text-emerald-400">
                      ✓ VERIFIED & LOGGED
                    </div>
                  </div>
                </div>

                {/* Title & Document Number */}
                <div className="text-center py-1 space-y-1">
                  <h2 className="text-base font-black text-gray-100 uppercase tracking-widest">
                    BERITA ACARA AUDIT FISIK BRANKAS & GUDANG SITAAN
                  </h2>
                  <div className="inline-block px-3 py-1 bg-amber-950/60 border border-amber-700 text-amber-300 rounded font-mono text-xs font-bold">
                    NO. AUDIT: {selectedAudit.auditNumber}
                  </div>
                </div>

                {/* Meta details */}
                <div className="bg-[#161B22] p-3 rounded-lg border border-gray-700 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-400 block text-[10px]">PERIODE MINGGUAN:</span>
                    <span className="text-amber-300 font-bold">{selectedAudit.weekLabel}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">TANGGAL AUDIT:</span>
                    <span className="text-gray-100 font-bold">{selectedAudit.auditDate}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">AUDITOR / PETUGAS:</span>
                    <span className="text-gray-200 font-bold">{selectedAudit.auditorName} (Badge #{selectedAudit.auditorBadge})</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">SAKSI PENDAMPING:</span>
                    <span className="text-gray-200">{selectedAudit.witnessOfficer || 'Petugas Jaga Internal'}</span>
                  </div>
                </div>

                {/* Section 1: Cash */}
                <div className="bg-[#161B22] p-3 rounded-lg border border-gray-700 space-y-1.5 text-xs">
                  <div className="text-emerald-400 font-bold flex items-center gap-1.5 border-b border-gray-800 pb-1">
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>1. SALDO KEUANGAN & KAS SITAAN</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>Kas Sitaan Tindak Pidana: <strong className="text-emerald-300">${selectedAudit.cashConfiscated.toLocaleString()}</strong></div>
                    <div>Kas Operasional Bersih: <strong className="text-gray-100">${selectedAudit.cleanCashFund.toLocaleString()}</strong></div>
                  </div>
                </div>

                {/* Section 2: Drugs */}
                <div className="bg-[#161B22] p-3 rounded-lg border border-gray-700 space-y-1.5 text-xs">
                  <div className="text-rose-400 font-bold flex items-center gap-1.5 border-b border-gray-800 pb-1">
                    <Pill className="w-3.5 h-3.5" />
                    <span>2. STOK NARKOTIKA & ZAT TERLARANG SITAAN</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] text-gray-300">
                    <div>Marijuana: <strong className="text-gray-100">{selectedAudit.drugsSummary.weedGrams}g</strong></div>
                    <div>Cocaine: <strong className="text-gray-100">{selectedAudit.drugsSummary.cocaineGrams}g</strong></div>
                    <div>Crack: <strong className="text-gray-100">{selectedAudit.drugsSummary.crackGrams}g</strong></div>
                    <div>Methamphetamine: <strong className="text-gray-100">{selectedAudit.drugsSummary.methGrams}g</strong></div>
                    <div>Pills / Ekstasi: <strong className="text-gray-100">{selectedAudit.drugsSummary.pillsCount} butir</strong></div>
                  </div>
                </div>

                {/* Section 3: Weapons */}
                <div className="bg-[#161B22] p-3 rounded-lg border border-gray-700 space-y-1.5 text-xs">
                  <div className="text-blue-400 font-bold flex items-center gap-1.5 border-b border-gray-800 pb-1">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>3. GUDANG SENJATA API & AMUNISI</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] text-gray-300">
                    <div>Handgun: <strong className="text-gray-100">{selectedAudit.weaponsSummary.handgunsCount} pucuk</strong></div>
                    <div>Shotgun: <strong className="text-gray-100">{selectedAudit.weaponsSummary.shotgunsCount} pucuk</strong></div>
                    <div>SMG: <strong className="text-gray-100">{selectedAudit.weaponsSummary.smgCount} pucuk</strong></div>
                    <div>Assault Rifle: <strong className="text-gray-100">{selectedAudit.weaponsSummary.rifleCount} pucuk</strong></div>
                    <div>Heavy Weapon: <strong className="text-gray-100">{selectedAudit.weaponsSummary.heavyWeaponsCount} pucuk</strong></div>
                    <div>Total Butir Peluru: <strong className="text-amber-300">{(selectedAudit.ammoSummary.pistolAmmo + selectedAudit.ammoSummary.rifleAmmo + selectedAudit.ammoSummary.smgAmmo + selectedAudit.ammoSummary.shotgunShells).toLocaleString()} rds</strong></div>
                  </div>
                </div>

                {/* Photos if any */}
                {selectedAudit.evidencePhotos && selectedAudit.evidencePhotos.length > 0 && (
                  <div className="bg-[#161B22] p-3 rounded-lg border border-gray-700 space-y-1.5 text-xs">
                    <div className="text-amber-400 font-bold">4. DOKUMENTASI FISIK BRANKAS TERLAMPIR:</div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      {selectedAudit.evidencePhotos.map((photo, i) => (
                        <img key={i} src={photo} alt={`Bukti ${i}`} className="w-full h-24 object-cover rounded border border-gray-700" />
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div className="text-xs text-gray-300 bg-[#161B22] p-3 rounded-lg border border-gray-700">
                  <strong className="text-amber-400 block mb-1">Catatan Hasil Pemeriksaan:</strong>
                  {selectedAudit.auditNotes || 'Brankas dalam kondisi tersegel baik. Jumlah barang bukti sesuai dengan pembukuan sistem.'}
                </div>

                {/* Signatures and Stamp Block */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t-2 border-gray-800 text-center text-[10px]">
                  {/* Left: Auditor */}
                  <div className="space-y-6 flex flex-col justify-between">
                    <div className="text-gray-400">Petugas Auditor / Pemeriksa:</div>
                    <div className="border-t border-gray-700 pt-1 font-bold text-gray-200">
                      <div>{selectedAudit.auditorName}</div>
                      <div className="text-[9px] text-gray-400 font-normal">Badge #{selectedAudit.auditorBadge} • Divisi Logistik</div>
                    </div>
                  </div>

                  {/* Right: Stamp and High Command */}
                  <div className="space-y-4 flex flex-col justify-between relative">
                    {/* STEMPEL BASAH HSPD AUDIT */}
                    <div className="absolute right-4 top-1/4 -translate-y-1/2 border-2 border-amber-500/80 rounded-full w-24 h-24 flex items-center justify-center rotate-[-12deg] pointer-events-none opacity-85 text-amber-400 font-bold text-[8px] leading-tight text-center p-1 bg-amber-950/20">
                      <div>
                        ★ HSPD AUDIT ★<br/>
                        OFFICIALLY<br/>
                        AUDITED & SEALED<br/>
                        {selectedAudit.auditDate}
                      </div>
                    </div>

                    <div className="text-gray-400">Mengetahui & Menyetujui:</div>
                    <div className="border-t border-gray-700 pt-1 font-bold text-amber-300 z-10">
                      <div>{selectedAudit.witnessOfficer || 'CHIEF OF POLICE / HIGH COMMAND'}</div>
                      <div className="text-[9px] text-amber-400 font-bold tracking-wider">HSPD AUDIT COMMISSION</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Bar with PNG, JPG & Print */}
            <div className="bg-[#0A0D12] border-t border-gray-800 p-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {/* Export PNG */}
                <button
                  onClick={() => handleExportAuditImage('png')}
                  disabled={isExportingImage !== null}
                  className="px-3 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white rounded font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-emerald-900/30"
                  title="Unduh Berita Acara Audit sebagai gambar PNG jernih"
                >
                  {isExportingImage === 'png' ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Camera className="w-3.5 h-3.5" />
                  )}
                  <span>Unduh PNG (HD)</span>
                </button>

                {/* Export JPG */}
                <button
                  onClick={() => handleExportAuditImage('jpeg')}
                  disabled={isExportingImage !== null}
                  className="px-3 py-2 bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white rounded font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-blue-900/30"
                  title="Unduh Berita Acara Audit sebagai gambar JPG"
                >
                  {isExportingImage === 'jpeg' ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ImageIcon className="w-3.5 h-3.5" />
                  )}
                  <span>Unduh JPG</span>
                </button>

                {/* Native Print */}
                <button
                  onClick={() => window.print()}
                  className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-gray-400" />
                  <span>Cetak / PDF</span>
                </button>
              </div>

              <button
                onClick={() => setSelectedAudit(null)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-black rounded font-bold transition cursor-pointer"
              >
                Selesai / Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
