import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  DollarSign, Calculator, Shield, Award, CheckCircle2, AlertTriangle,
  RefreshCw, Copy, Check, Download, Plus, Trash2, X, Settings2,
  FileText, Sparkles, TrendingUp, Package, Car, Flame, Crosshair,
  Printer, ArrowRight, UserCheck, ShieldCheck, ExternalLink, Calendar,
  CreditCard, Landmark, ChevronDown, ChevronRight, Sliders, Eye
} from 'lucide-react';
import { OfficerProfile, OfficerAccount, isSupervisorOrAbove, isOfficerHighRank } from '../types';
import { 
  BonusRateConfig,
  OfficerBonusSummary,
  BonusClaimRecord,
  ArmoryRestockMission,
  getSavedBonusRateConfig,
  saveBonusRateConfig,
  resetBonusRateConfig,
  getSavedRestockMissions,
  addRestockMission,
  deleteRestockMission,
  getSavedBonusClaims,
  addBonusClaim,
  updateBonusClaim,
  deleteBonusClaim,
  calculateBonusSummary,
  pullOfficerDataAndCalculateBonus,
  formatBonusSummaryAsText
} from '../utils/officerBonusStorage';
import { exportElementAsImage } from '../utils/exportDocumentAsImage';
import { HSPD_LOGO_URL } from '../assets/logo';

interface Props {
  currentOfficer: OfficerProfile | null;
  roster?: OfficerAccount[];
  onClose?: () => void;
}

export const OfficerBonusHub: React.FC<Props> = ({ currentOfficer, roster = [], onClose }) => {
  const isHighCommand = currentOfficer?.rank ? isSupervisorOrAbove(currentOfficer.rank) || isOfficerHighRank(currentOfficer.rank) : false;

  // Selected Target Officer (defaults to currently logged in officer)
  const [selectedBadge, setSelectedBadge] = useState<string>(() => currentOfficer?.badge || '#001');
  const [selectedName, setSelectedName] = useState<string>(() => currentOfficer?.name || 'Petugas HSPD');
  const [selectedRank, setSelectedRank] = useState<string>(() => currentOfficer?.rank || 'POLICE OFFICER');
  const [selectedDivision, setSelectedDivision] = useState<string>(() => currentOfficer?.division || 'PATROL DIVISION');
  const [bankAccount, setBankAccount] = useState<string>(() => (currentOfficer as any)?.bankAccount || '');

  // Mode: 'AUTO_SYNC' (tarik riil dari database) vs 'MANUAL_SIMULATOR' (kalkulator bebas input)
  const [calcMode, setCalcMode] = useState<'AUTO_SYNC' | 'MANUAL_SIMULATOR'>('AUTO_SYNC');

  // Active Main SubTab
  const [activeTab, setActiveTab] = useState<'calculator' | 'restock_manager' | 'claims_history' | 'rate_settings'>('calculator');

  // Rates Configuration State
  const [rates, setRates] = useState<BonusRateConfig>(() => getSavedBonusRateConfig());

  // Interactive Form Inputs (for manual simulator mode)
  const [manualCasesCount, setManualCasesCount] = useState<number>(3);
  const [manualCasesFine, setManualCasesFine] = useState<number>(35000);
  const [manualCasesCoop, setManualCasesCoop] = useState<number>(2);

  const [manualEvPhotos, setManualEvPhotos] = useState<number>(6);
  const [manualEvWeapons, setManualEvWeapons] = useState<number>(3);
  const [manualEvDrugs, setManualEvDrugs] = useState<number>(150);
  const [manualEvCash, setManualEvCash] = useState<number>(12500);

  const [manualCitCount, setManualCitCount] = useState<number>(5);
  const [manualCitFine, setManualCitFine] = useState<number>(14000);

  const [manualImpCount, setManualImpCount] = useState<number>(2);
  const [manualImpFee, setManualImpFee] = useState<number>(3500);

  const [manualRestockMissions, setManualRestockMissions] = useState<number>(1);
  const [manualRestockWeapons, setManualRestockWeapons] = useState<number>(12);
  const [manualRestockAmmo, setManualRestockAmmo] = useState<number>(25);

  const [manualSmeltWeapons, setManualSmeltWeapons] = useState<number>(5);
  const [manualSmeltCerts, setManualSmeltCerts] = useState<number>(2);

  // Restock Missions State
  const [restockMissions, setRestockMissions] = useState<ArmoryRestockMission[]>(() => getSavedRestockMissions());
  const [showAddRestockModal, setShowAddRestockModal] = useState<boolean>(false);

  // New Restock Form
  const [newRestockTitle, setNewRestockTitle] = useState('Restok Logistik Patroli & Divisi');
  const [newRestockWeapons, setNewRestockWeapons] = useState([
    { model: 'Combat Pistol 9mm', quantity: 10 },
    { model: 'Pump Shotgun 12-Gauge', quantity: 4 }
  ]);
  const [newRestockAmmo, setNewRestockAmmo] = useState<number>(20);
  const [newRestockArmors, setNewRestockArmors] = useState<number>(15);
  const [newRestockNotes, setNewRestockNotes] = useState('Suplai resmi gudang persenjataan negara telah tersimpan di brankas divisi.');

  // Claims History State
  const [claims, setClaims] = useState<BonusClaimRecord[]>(() => getSavedBonusClaims());

  // Feedback notifications & action feedback
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<'png' | 'jpeg' | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Auto-sync listener across tabs
  useEffect(() => {
    const handleRatesSync = () => setRates(getSavedBonusRateConfig());
    const handleRestockSync = () => setRestockMissions(getSavedRestockMissions());
    const handleClaimsSync = () => setClaims(getSavedBonusClaims());

    window.addEventListener('hspd-bonus-rates-updated', handleRatesSync);
    window.addEventListener('hspd-restock-missions-updated', handleRestockSync);
    window.addEventListener('hspd-bonus-claims-updated', handleClaimsSync);

    return () => {
      window.removeEventListener('hspd-bonus-rates-updated', handleRatesSync);
      window.removeEventListener('hspd-restock-missions-updated', handleRestockSync);
      window.removeEventListener('hspd-bonus-claims-updated', handleClaimsSync);
    };
  }, []);

  // When selected officer changes in dropdown, auto-update related fields
  const handleSelectOfficer = (badge: string) => {
    const found = roster.find(o => o.badge === badge);
    if (found) {
      setSelectedBadge(found.badge);
      setSelectedName(found.name);
      setSelectedRank(found.rank);
      setSelectedDivision(found.division || 'HSPD');
      setBankAccount(found.bankAccount || '');
    }
  };

  // Compute Bonus Summary based on active mode
  const bonusSummary: OfficerBonusSummary = useMemo(() => {
    if (calcMode === 'AUTO_SYNC') {
      return pullOfficerDataAndCalculateBonus(
        selectedBadge,
        selectedName,
        selectedRank,
        selectedDivision,
        bankAccount,
        { rates }
      );
    } else {
      return calculateBonusSummary({
        officerName: selectedName,
        officerBadge: selectedBadge,
        officerRank: selectedRank,
        division: selectedDivision,
        bankAccount,
        periodLabel: 'Simulasi Perhitungan Bebas',
        rates,
        casesCount: manualCasesCount,
        casesTotalFine: manualCasesFine,
        casesCooperativeCount: manualCasesCoop,
        evidencePhotoCount: manualEvPhotos,
        evidenceWeaponCount: manualEvWeapons,
        evidenceDrugGrams: manualEvDrugs,
        evidenceCashAmount: manualEvCash,
        citationsCount: manualCitCount,
        citationsTotalFine: manualCitFine,
        impoundsCount: manualImpCount,
        impoundsTotalFee: manualImpFee,
        restockMissionsCount: manualRestockMissions,
        restockWeaponsCount: manualRestockWeapons,
        restockAmmoBoxesCount: manualRestockAmmo,
        smeltWeaponsCount: manualSmeltWeapons,
        smeltCertsCount: manualSmeltCerts
      });
    }
  }, [
    calcMode,
    selectedBadge,
    selectedName,
    selectedRank,
    selectedDivision,
    bankAccount,
    rates,
    manualCasesCount,
    manualCasesFine,
    manualCasesCoop,
    manualEvPhotos,
    manualEvWeapons,
    manualEvDrugs,
    manualEvCash,
    manualCitCount,
    manualCitFine,
    manualImpCount,
    manualImpFee,
    manualRestockMissions,
    manualRestockWeapons,
    manualRestockAmmo,
    manualSmeltWeapons,
    manualSmeltCerts
  ]);

  // Action: Copy text slip
  const handleCopyTextSlip = () => {
    const txt = formatBonusSummaryAsText(bonusSummary);
    navigator.clipboard.writeText(txt);
    setCopyFeedback(true);
    setNotice({
      type: 'success',
      message: '✅ Rincian slip bonus berhasil disalin ke clipboard! Siap dipaste ke Discord atau WhatsApp.'
    });
    setTimeout(() => {
      setCopyFeedback(false);
      setNotice(null);
    }, 3500);
  };

  // Action: Export image
  const handleExportImageSlip = async (format: 'png' | 'jpeg') => {
    setExportingFormat(format);
    try {
      const res = await exportElementAsImage('official-bonus-slip-certificate', {
        fileName: `SLIP_BONUS_${bonusSummary.officerBadge.replace(/#/g, '')}_${new Date().toISOString().split('T')[0]}`,
        format,
        quality: 0.98,
        backgroundColor: '#0A0E14',
        scale: 2
      });

      if (res.success) {
        setNotice({
          type: 'success',
          message: `✅ Berhasil mengunduh Slip Bonus Resmi dalam format ${format.toUpperCase()}!`
        });
      } else {
        setNotice({
          type: 'error',
          message: res.error || 'Gagal mengekspor dokumen slip ke gambar.'
        });
      }
    } catch (e: any) {
      setNotice({
        type: 'error',
        message: e?.message || 'Terjadi kesalahan saat memproses gambar.'
      });
    } finally {
      setExportingFormat(null);
      setTimeout(() => setNotice(null), 4000);
    }
  };

  // Action: Submit Claim
  const handleSubmitBonusClaim = () => {
    if (bonusSummary.grandTotalBonus <= 0) {
      setNotice({
        type: 'error',
        message: '⚠️ Total bonus dinas saat ini $0. Lakukan aktivitas penindakan terlebih dahulu untuk mengajukan klaim.'
      });
      setTimeout(() => setNotice(null), 4000);
      return;
    }

    const claimId = `CLAIM-BN-${Date.now().toString().slice(-6)}`;
    const newClaim: BonusClaimRecord = {
      id: claimId,
      claimNumber: `HSPD-CLAIM-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
      officerName: bonusSummary.officerName,
      officerBadge: bonusSummary.officerBadge,
      officerRank: bonusSummary.officerRank,
      division: bonusSummary.division,
      bankAccount: bonusSummary.bankAccount,
      periodLabel: bonusSummary.periodLabel,
      summary: bonusSummary,
      status: 'PENDING_APPROVAL',
      submittedAt: Date.now(),
      notes: `Pengajuan klaim insentif prestasi operasional 6 kategori dinas.`
    };

    addBonusClaim(newClaim);
    setClaims(getSavedBonusClaims());
    setNotice({
      type: 'success',
      message: `✅ Berhasil mengajukan klaim bonus #${newClaim.claimNumber} sebesar $${bonusSummary.grandTotalBonus.toLocaleString()}! Status: Menunggu Persetujuan High Command.`
    });
    setTimeout(() => setNotice(null), 5000);
  };

  // High Command approve claim
  const handleApproveClaim = (claim: BonusClaimRecord) => {
    const updated: BonusClaimRecord = {
      ...claim,
      status: 'APPROVED',
      approvedBy: currentOfficer?.name || 'High Command',
      approvedByRank: currentOfficer?.rank || 'CHIEF OF POLICE',
      approvedAt: Date.now()
    };
    updateBonusClaim(updated);
    setClaims(getSavedBonusClaims());
    setNotice({
      type: 'success',
      message: `✅ Klaim #${claim.claimNumber} telah disetujui!`
    });
    setTimeout(() => setNotice(null), 3000);
  };

  // High Command disburse/pay claim
  const handleDisburseClaim = (claim: BonusClaimRecord) => {
    const updated: BonusClaimRecord = {
      ...claim,
      status: 'DISBURSED_PAID',
      disbursedBy: currentOfficer?.name || 'Bendahara Dinas',
      disbursedAt: Date.now()
    };
    updateBonusClaim(updated);
    setClaims(getSavedBonusClaims());
    setNotice({
      type: 'success',
      message: `💰 Klaim #${claim.claimNumber} sebesar $${claim.summary.grandTotalBonus.toLocaleString()} telah dicairkan ke rekening ${claim.bankAccount || 'Dinas'}!`
    });
    setTimeout(() => setNotice(null), 3500);
  };

  // High Command save rates
  const handleSaveRates = (e: React.FormEvent) => {
    e.preventDefault();
    saveBonusRateConfig(rates);
    setNotice({
      type: 'success',
      message: '✅ Konfigurasi tarif reward bonus resmi dinas berhasil diperbarui!'
    });
    setTimeout(() => setNotice(null), 3500);
  };

  // Handle Add Restock Mission
  const handleCreateRestockMission = (e: React.FormEvent) => {
    e.preventDefault();
    const newMission: ArmoryRestockMission = {
      id: `restock-${Date.now()}`,
      missionCode: `RESTOCK-ARM-${new Date().getFullYear() % 100}-${Math.floor(100 + Math.random() * 900)}`,
      title: newRestockTitle.trim() || 'Restok Persenjataan & Amunisi Dinas',
      conductedBy: selectedName,
      conductedBadge: selectedBadge,
      conductedRank: selectedRank,
      division: selectedDivision,
      weaponsRestocked: newRestockWeapons.filter(w => w.quantity > 0),
      ammoBoxes: newRestockAmmo,
      bodyArmors: newRestockArmors,
      status: 'SUCCESS_VERIFIED',
      authorizedBy: currentOfficer ? `${currentOfficer.name} (${currentOfficer.badge})` : 'High Command',
      authorizedRank: currentOfficer?.rank || 'SUPERVISOR',
      timestamp: Date.now(),
      dateFormatted: new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
      notes: newRestockNotes.trim()
    };

    addRestockMission(newMission);
    setRestockMissions(getSavedRestockMissions());
    setShowAddRestockModal(false);
    setNotice({
      type: 'success',
      message: `✅ Misi restok persenjataan #${newMission.missionCode} berhasil diverifikasi dan dicatat ke brankas gudang!`
    });
    setTimeout(() => setNotice(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* ================= HERO HEADER ================= */}
      <div className="bg-gradient-to-r from-[#0C121A] via-[#101A24] to-[#0A0F15] border border-amber-500/40 rounded-2xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider bg-amber-950/80 text-amber-300 border border-amber-500/60 flex items-center gap-1 shadow">
                <Sparkles className="w-3 h-3 text-amber-400" />
                MODUL BONUS OPERASIONAL RESMI • 6 KATEGORI
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/80 text-emerald-300 border border-emerald-600/60 font-bold">
                KOMPUTASI REALTIME
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Landmark className="w-7 h-7 text-amber-400" />
              KALKULATOR & PUSAT PERHITUNGAN BONUS DINAS HSPD
            </h1>
            <p className="text-xs sm:text-sm text-gray-300 max-w-3xl leading-relaxed">
              Perhitungan insentif komisi prestasi dinas kepolisian: <strong>Kasus Penindakan</strong>, <strong>Pemasukan Efiden</strong>, <strong>Pemasukan Tilang</strong>, <strong>Pemasukan Impound</strong>, <strong>Sukses Perestokan Persenjataan</strong>, dan <strong>Peleburan Senjata</strong>.
            </p>
          </div>

          {/* Grand Total Highlight Badge */}
          <div className="bg-[#070B0F]/90 border border-amber-500/50 rounded-2xl p-4 sm:p-5 flex flex-col justify-between items-end min-w-[240px] shadow-xl">
            <span className="text-[11px] font-mono font-bold text-gray-400 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-amber-400" /> ESTIMASI TOTAL BONUS:
            </span>
            <div className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-emerald-300 font-mono">
              ${bonusSummary.grandTotalBonus.toLocaleString()}
            </div>
            <span className="text-[10px] text-gray-400 font-mono mt-1">
              {calcMode === 'AUTO_SYNC' ? '⚡ Tersinkron Otomatis dari Database' : '🧮 Mode Simulasi Interaktif'}
            </span>
          </div>
        </div>

        {/* Global Notification */}
        {notice && (
          <div className={`mt-4 p-3 rounded-xl border text-xs font-mono flex items-center justify-between gap-2 animate-in fade-in ${
            notice.type === 'success' 
              ? 'bg-emerald-950/80 border-emerald-600 text-emerald-200' 
              : notice.type === 'error'
              ? 'bg-rose-950/80 border-rose-600 text-rose-200'
              : 'bg-blue-950/80 border-blue-600 text-blue-200'
          }`}>
            <div className="flex items-center gap-2">
              {notice.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
              <span>{notice.message}</span>
            </div>
            <button onClick={() => setNotice(null)} className="p-0.5 hover:bg-white/10 rounded cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* ================= SUB-NAVIGATION BAR ================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-800 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          <button
            type="button"
            onClick={() => setActiveTab('calculator')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold font-mono transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'calculator'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-950'
                : 'bg-[#121620] hover:bg-[#18202F] text-gray-300 border border-gray-800'
            }`}
          >
            <Calculator className="w-4 h-4" />
            Kalkulator 6 Bonus
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('restock_manager')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold font-mono transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'restock_manager'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-950'
                : 'bg-[#121620] hover:bg-[#18202F] text-gray-300 border border-gray-800'
            }`}
          >
            <Crosshair className="w-4 h-4" />
            Misi Restok Senjata ({restockMissions.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('claims_history')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold font-mono transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'claims_history'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-950'
                : 'bg-[#121620] hover:bg-[#18202F] text-gray-300 border border-gray-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            Riwayat Klaim ({claims.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rate_settings')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold font-mono transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'rate_settings'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-950'
                : 'bg-[#121620] hover:bg-[#18202F] text-gray-300 border border-gray-800'
            }`}
          >
            <Settings2 className="w-4 h-4" />
            Tarif & Regulasi Reward
          </button>
        </div>

        {/* Quick Close Button if embedded in modal */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
          >
            <X className="w-4 h-4" /> Tutup
          </button>
        )}
      </div>

      {/* ================= TAB 1: KALKULATOR 6 BONUS ================= */}
      {activeTab === 'calculator' && (
        <div className="space-y-6">
          {/* Controls: Target Officer Selector & Mode Toggle */}
          <div className="bg-[#0E131A] border border-gray-800 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-gray-400 uppercase flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-amber-400" /> Personel Terpilih:
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedBadge}
                    onChange={(e) => handleSelectOfficer(e.target.value)}
                    className="bg-[#141A24] border border-gray-700 rounded-xl px-3 py-1.5 text-xs font-bold text-white font-mono focus:border-amber-400 outline-none cursor-pointer"
                  >
                    {roster.map((o) => (
                      <option key={o.badge} value={o.badge}>
                        {o.badge} - {o.name} ({o.rank})
                      </option>
                    ))}
                    {!roster.some(r => r.badge === selectedBadge) && (
                      <option value={selectedBadge}>{selectedBadge} - {selectedName}</option>
                    )}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-gray-400 uppercase flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-400" /> Rekening Bank:
                </label>
                <input
                  type="text"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  placeholder="Contoh: 104-982-114"
                  className="bg-[#141A24] border border-gray-700 rounded-xl px-3 py-1.5 text-xs text-emerald-300 font-mono font-bold focus:border-emerald-400 outline-none w-40"
                />
              </div>
            </div>

            {/* Mode Switcher */}
            <div className="flex items-center gap-2 bg-[#090D12] p-1.5 rounded-xl border border-gray-800">
              <button
                type="button"
                onClick={() => setCalcMode('AUTO_SYNC')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition flex items-center gap-1.5 cursor-pointer ${
                  calcMode === 'AUTO_SYNC'
                    ? 'bg-amber-500 text-black shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Tarik otomatis dari catatan kasus, tilang, impound, restok, dan peleburan senjata di sistem"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Tarik Data Sistem (Auto)
              </button>

              <button
                type="button"
                onClick={() => setCalcMode('MANUAL_SIMULATOR')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition flex items-center gap-1.5 cursor-pointer ${
                  calcMode === 'MANUAL_SIMULATOR'
                    ? 'bg-amber-500 text-black shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Input bebas untuk simulasi dan perhitungan fleksibel"
              >
                <Sliders className="w-3.5 h-3.5" />
                Simulasi Bebas (Manual)
              </button>
            </div>
          </div>

          {/* ================= THE 6 CALCULATION CARDS ================= */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* 1. KASUS PENINDAKAN */}
            <div className="bg-[#0D1219] border border-amber-500/40 rounded-2xl p-4 flex flex-col justify-between space-y-3 shadow-lg relative overflow-hidden group hover:border-amber-400 transition">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
                      <Shield className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <div>
                      <h3 className="text-xs font-extrabold text-white font-mono">1. KASUS PENINDAKAN</h3>
                      <p className="text-[10px] text-gray-400 font-mono">Penanganan Kasus & BAP</p>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-600/50 font-bold font-mono">
                    +{rates.caseFinePercent}% Denda
                  </span>
                </div>

                {calcMode === 'MANUAL_SIMULATOR' ? (
                  <div className="space-y-2 text-xs font-mono pt-1">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-[11px]">Jumlah Kasus:</span>
                      <input
                        type="number"
                        min="0"
                        value={manualCasesCount}
                        onChange={(e) => setManualCasesCount(parseInt(e.target.value, 10) || 0)}
                        className="w-20 bg-black/50 border border-gray-700 rounded px-2 py-1 text-right text-white font-bold"
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-[11px]">Total Denda ($):</span>
                      <input
                        type="number"
                        min="0"
                        value={manualCasesFine}
                        onChange={(e) => setManualCasesFine(parseInt(e.target.value, 10) || 0)}
                        className="w-24 bg-black/50 border border-gray-700 rounded px-2 py-1 text-right text-amber-300 font-bold"
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-[11px]">Tersangka Kooperatif:</span>
                      <input
                        type="number"
                        min="0"
                        value={manualCasesCoop}
                        onChange={(e) => setManualCasesCoop(parseInt(e.target.value, 10) || 0)}
                        className="w-20 bg-black/50 border border-gray-700 rounded px-2 py-1 text-right text-emerald-300 font-bold"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 bg-black/40 rounded-xl space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-400">Total Kasus Riil:</span>
                      <span className="text-white font-bold">{bonusSummary.caseStats.count} Kasus</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-400">Total Denda Pidana:</span>
                      <span className="text-amber-300 font-bold">${bonusSummary.caseStats.totalFine.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-400">Kasus Kooperatif:</span>
                      <span className="text-emerald-300 font-bold">{bonusSummary.caseStats.cooperativeCount} Kali</span>
                    </div>
                  </div>
                )}

                {/* Subtotal Breakdown */}
                <div className="text-[10px] text-gray-400 font-mono space-y-0.5 pt-1">
                  <div>• Reward Dasar: ${rates.caseBaseReward.toLocaleString()}/kasus</div>
                  <div>• Bonus Kooperatif: +${rates.caseCooperativeBonus}/tersangka</div>
                </div>
              </div>

              <div className="p-2.5 bg-[#080D12] border border-amber-500/30 rounded-xl flex items-center justify-between">
                <span className="text-[11px] font-mono text-gray-400">Subtotal Kasus:</span>
                <span className="text-base font-black text-amber-300 font-mono">
                  ${bonusSummary.caseStats.subtotal.toLocaleString()}
                </span>
              </div>
            </div>

            {/* 2. PEMASUKAN EFIDEN */}
            <div className="bg-[#0D1219] border border-emerald-500/40 rounded-2xl p-4 flex flex-col justify-between space-y-3 shadow-lg relative overflow-hidden group hover:border-emerald-400 transition">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
                      <Package className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <div>
                      <h3 className="text-xs font-extrabold text-white font-mono">2. PEMASUKAN EFIDEN</h3>
                      <p className="text-[10px] text-gray-400 font-mono">Setoran Bukti ke Brankas</p>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-600/50 font-bold font-mono">
                    Evidence Intake
                  </span>
                </div>

                {calcMode === 'MANUAL_SIMULATOR' ? (
                  <div className="space-y-2 text-xs font-mono pt-1">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-[11px]">Foto Bukti Sah:</span>
                      <input
                        type="number"
                        min="0"
                        value={manualEvPhotos}
                        onChange={(e) => setManualEvPhotos(parseInt(e.target.value, 10) || 0)}
                        className="w-20 bg-black/50 border border-gray-700 rounded px-2 py-1 text-right text-white font-bold"
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-[11px]">Senpi Sitaan:</span>
                      <input
                        type="number"
                        min="0"
                        value={manualEvWeapons}
                        onChange={(e) => setManualEvWeapons(parseInt(e.target.value, 10) || 0)}
                        className="w-20 bg-black/50 border border-gray-700 rounded px-2 py-1 text-right text-red-300 font-bold"
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-[11px]">Narkoba (Gram):</span>
                      <input
                        type="number"
                        min="0"
                        value={manualEvDrugs}
                        onChange={(e) => setManualEvDrugs(parseInt(e.target.value, 10) || 0)}
                        className="w-20 bg-black/50 border border-gray-700 rounded px-2 py-1 text-right text-purple-300 font-bold"
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-[11px]">Kas Sitaan ($):</span>
                      <input
                        type="number"
                        min="0"
                        value={manualEvCash}
                        onChange={(e) => setManualEvCash(parseInt(e.target.value, 10) || 0)}
                        className="w-24 bg-black/50 border border-gray-700 rounded px-2 py-1 text-right text-emerald-300 font-bold"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 bg-black/40 rounded-xl space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-400">Foto Bukti Terverifikasi:</span>
                      <span className="text-white font-bold">{bonusSummary.evidenceStats.photoCount} Lembar</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-400">Senpi Ilegal Disetor:</span>
                      <span className="text-red-300 font-bold">{bonusSummary.evidenceStats.weaponCount} Unit</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-400">Narkotika Disetor:</span>
                      <span className="text-purple-300 font-bold">{bonusSummary.evidenceStats.drugGrams} Gram</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-400">Uang Kas Sitaan:</span>
                      <span className="text-emerald-300 font-bold">${bonusSummary.evidenceStats.cashSeized.toLocaleString()}</span>
                    </div>
                  </div>
                )}

                <div className="text-[10px] text-gray-400 font-mono space-y-0.5 pt-1">
                  <div>• Senpi: ${rates.evidenceWeaponReward}/unit | Foto: ${rates.evidencePhotoReward}</div>
                  <div>• Narkoba: ${rates.evidenceDrugGramReward}/g | Uang: {rates.evidenceCashPercent}%</div>
                </div>
              </div>

              <div className="p-2.5 bg-[#080D12] border border-emerald-500/30 rounded-xl flex items-center justify-between">
                <span className="text-[11px] font-mono text-gray-400">Subtotal Efiden:</span>
                <span className="text-base font-black text-emerald-300 font-mono">
                  ${bonusSummary.evidenceStats.subtotal.toLocaleString()}
                </span>
              </div>
            </div>

            {/* 3. PEMASUKAN TILANG */}
            <div className="bg-[#0D1219] border border-blue-500/40 rounded-2xl p-4 flex flex-col justify-between space-y-3 shadow-lg relative overflow-hidden group hover:border-blue-400 transition">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-400">
                      <FileText className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <div>
                      <h3 className="text-xs font-extrabold text-white font-mono">3. PEMASUKAN TILANG</h3>
                      <p className="text-[10px] text-gray-400 font-mono">Traffic Citations & Fines</p>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-600/50 font-bold font-mono">
                    +{rates.citationFinePercent}% Denda
                  </span>
                </div>

                {calcMode === 'MANUAL_SIMULATOR' ? (
                  <div className="space-y-2 text-xs font-mono pt-1">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-[11px]">Tiket Tilang:</span>
                      <input
                        type="number"
                        min="0"
                        value={manualCitCount}
                        onChange={(e) => setManualCitCount(parseInt(e.target.value, 10) || 0)}
                        className="w-20 bg-black/50 border border-gray-700 rounded px-2 py-1 text-right text-white font-bold"
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-[11px]">Total Denda Tilang ($):</span>
                      <input
                        type="number"
                        min="0"
                        value={manualCitFine}
                        onChange={(e) => setManualCitFine(parseInt(e.target.value, 10) || 0)}
                        className="w-24 bg-black/50 border border-gray-700 rounded px-2 py-1 text-right text-blue-300 font-bold"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 bg-black/40 rounded-xl space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-400">Surat Tilang Terbit:</span>
                      <span className="text-white font-bold">{bonusSummary.citationStats.count} Lembar</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-400">Total Denda Tilang:</span>
                      <span className="text-blue-300 font-bold">${bonusSummary.citationStats.totalFine.toLocaleString()}</span>
                    </div>
                  </div>
                )}

                <div className="text-[10px] text-gray-400 font-mono space-y-0.5 pt-1">
                  <div>• Reward per lembar: ${rates.citationFlatReward}</div>
                  <div>• Komisi denda masuk: {rates.citationFinePercent}%</div>
                </div>
              </div>

              <div className="p-2.5 bg-[#080D12] border border-blue-500/30 rounded-xl flex items-center justify-between">
                <span className="text-[11px] font-mono text-gray-400">Subtotal Tilang:</span>
                <span className="text-base font-black text-blue-300 font-mono">
                  ${bonusSummary.citationStats.subtotal.toLocaleString()}
                </span>
              </div>
            </div>

            {/* 4. PEMASUKAN IMPOUND */}
            <div className="bg-[#0D1219] border border-cyan-500/40 rounded-2xl p-4 flex flex-col justify-between space-y-3 shadow-lg relative overflow-hidden group hover:border-cyan-400 transition">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400">
                      <Car className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <div>
                      <h3 className="text-xs font-extrabold text-white font-mono">4. PEMASUKAN IMPOUND</h3>
                      <p className="text-[10px] text-gray-400 font-mono">Derek & Sitaan Kendaraan</p>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-600/50 font-bold font-mono">
                    +{rates.impoundFeePercent}% Fee
                  </span>
                </div>

                {calcMode === 'MANUAL_SIMULATOR' ? (
                  <div className="space-y-2 text-xs font-mono pt-1">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-[11px]">Unit Kendaraan:</span>
                      <input
                        type="number"
                        min="0"
                        value={manualImpCount}
                        onChange={(e) => setManualImpCount(parseInt(e.target.value, 10) || 0)}
                        className="w-20 bg-black/50 border border-gray-700 rounded px-2 py-1 text-right text-white font-bold"
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-[11px]">Total Fee Derek ($):</span>
                      <input
                        type="number"
                        min="0"
                        value={manualImpFee}
                        onChange={(e) => setManualImpFee(parseInt(e.target.value, 10) || 0)}
                        className="w-24 bg-black/50 border border-gray-700 rounded px-2 py-1 text-right text-cyan-300 font-bold"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 bg-black/40 rounded-xl space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-400">Kendaraan Masuk Pool:</span>
                      <span className="text-white font-bold">{bonusSummary.impoundStats.count} Unit</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-400">Total Tarif Denda Sita:</span>
                      <span className="text-cyan-300 font-bold">${bonusSummary.impoundStats.totalFee.toLocaleString()}</span>
                    </div>
                  </div>
                )}

                <div className="text-[10px] text-gray-400 font-mono space-y-0.5 pt-1">
                  <div>• Reward per unit derek: ${rates.impoundFlatReward}</div>
                  <div>• Komisi tarif impound: {rates.impoundFeePercent}%</div>
                </div>
              </div>

              <div className="p-2.5 bg-[#080D12] border border-cyan-500/30 rounded-xl flex items-center justify-between">
                <span className="text-[11px] font-mono text-gray-400">Subtotal Impound:</span>
                <span className="text-base font-black text-cyan-300 font-mono">
                  ${bonusSummary.impoundStats.subtotal.toLocaleString()}
                </span>
              </div>
            </div>

            {/* 5. SUKSES PERESTOKAN PERSENJATAAN */}
            <div className="bg-[#0D1219] border border-violet-500/40 rounded-2xl p-4 flex flex-col justify-between space-y-3 shadow-lg relative overflow-hidden group hover:border-violet-400 transition">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-violet-500/20 border border-violet-400/40 flex items-center justify-center text-violet-400">
                      <Crosshair className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <div>
                      <h3 className="text-xs font-extrabold text-white font-mono">5. RESTOK PERSENJATAAN</h3>
                      <p className="text-[10px] text-gray-400 font-mono">Logistik Senjata & Amunisi</p>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-violet-950/80 text-violet-300 border border-violet-600/50 font-bold font-mono">
                    Armory Restock
                  </span>
                </div>

                {calcMode === 'MANUAL_SIMULATOR' ? (
                  <div className="space-y-2 text-xs font-mono pt-1">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-[11px]">Misi Sukses:</span>
                      <input
                        type="number"
                        min="0"
                        value={manualRestockMissions}
                        onChange={(e) => setManualRestockMissions(parseInt(e.target.value, 10) || 0)}
                        className="w-20 bg-black/50 border border-gray-700 rounded px-2 py-1 text-right text-white font-bold"
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-[11px]">Senpi Logistik:</span>
                      <input
                        type="number"
                        min="0"
                        value={manualRestockWeapons}
                        onChange={(e) => setManualRestockWeapons(parseInt(e.target.value, 10) || 0)}
                        className="w-20 bg-black/50 border border-gray-700 rounded px-2 py-1 text-right text-violet-300 font-bold"
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-[11px]">Peti Amunisi:</span>
                      <input
                        type="number"
                        min="0"
                        value={manualRestockAmmo}
                        onChange={(e) => setManualRestockAmmo(parseInt(e.target.value, 10) || 0)}
                        className="w-20 bg-black/50 border border-gray-700 rounded px-2 py-1 text-right text-violet-300 font-bold"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 bg-black/40 rounded-xl space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-400">Misi Pengawalan Sukses:</span>
                      <span className="text-white font-bold">{bonusSummary.restockStats.missionCount} Misi</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-400">Senpi Disediakan:</span>
                      <span className="text-violet-300 font-bold">{bonusSummary.restockStats.weaponsCount} Unit</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-400">Peti Amunisi Direstock:</span>
                      <span className="text-violet-300 font-bold">{bonusSummary.restockStats.ammoBoxesCount} Peti</span>
                    </div>
                  </div>
                )}

                <div className="text-[10px] text-gray-400 font-mono space-y-0.5 pt-1">
                  <div>• Bonus Misi: ${rates.restockMissionReward.toLocaleString()}</div>
                  <div>• Per Senpi: ${rates.restockWeaponUnitReward} | Amunisi: ${rates.restockAmmoBoxReward}/peti</div>
                </div>
              </div>

              <div className="p-2.5 bg-[#080D12] border border-violet-500/30 rounded-xl flex items-center justify-between">
                <span className="text-[11px] font-mono text-gray-400">Subtotal Restok:</span>
                <span className="text-base font-black text-violet-300 font-mono">
                  ${bonusSummary.restockStats.subtotal.toLocaleString()}
                </span>
              </div>
            </div>

            {/* 6. PELEBURAN SENJATA */}
            <div className="bg-[#0D1219] border border-rose-500/40 rounded-2xl p-4 flex flex-col justify-between space-y-3 shadow-lg relative overflow-hidden group hover:border-rose-400 transition">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-rose-400">
                      <Flame className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <div>
                      <h3 className="text-xs font-extrabold text-white font-mono">6. PELEBURAN SENJATA</h3>
                      <p className="text-[10px] text-gray-400 font-mono">Smelter & Pemusnahan Sitaan</p>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-600/50 font-bold font-mono">
                    Scrap Smelting
                  </span>
                </div>

                {calcMode === 'MANUAL_SIMULATOR' ? (
                  <div className="space-y-2 text-xs font-mono pt-1">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-[11px]">Senpi Dilebur:</span>
                      <input
                        type="number"
                        min="0"
                        value={manualSmeltWeapons}
                        onChange={(e) => setManualSmeltWeapons(parseInt(e.target.value, 10) || 0)}
                        className="w-20 bg-black/50 border border-gray-700 rounded px-2 py-1 text-right text-white font-bold"
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-[11px]">Berita Acara (BA):</span>
                      <input
                        type="number"
                        min="0"
                        value={manualSmeltCerts}
                        onChange={(e) => setManualSmeltCerts(parseInt(e.target.value, 10) || 0)}
                        className="w-20 bg-black/50 border border-gray-700 rounded px-2 py-1 text-right text-rose-300 font-bold"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 bg-black/40 rounded-xl space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-400">Senpi Berhasil Dilebur:</span>
                      <span className="text-white font-bold">{bonusSummary.smeltStats.weaponCount} Unit Senjata</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-400">Eksekusi Berita Acara:</span>
                      <span className="text-rose-300 font-bold">{bonusSummary.smeltStats.certCount} Dokumen</span>
                    </div>
                  </div>
                )}

                <div className="text-[10px] text-gray-400 font-mono space-y-0.5 pt-1">
                  <div>• Scrap Besi Tua: ${rates.smeltWeaponReward}/senpi lebur</div>
                  <div>• Eksekutor Berita Acara: ${rates.smeltCertReward}/BA</div>
                </div>
              </div>

              <div className="p-2.5 bg-[#080D12] border border-rose-500/30 rounded-xl flex items-center justify-between">
                <span className="text-[11px] font-mono text-gray-400">Subtotal Peleburan:</span>
                <span className="text-base font-black text-rose-300 font-mono">
                  ${bonusSummary.smeltStats.subtotal.toLocaleString()}
                </span>
              </div>
            </div>

          </div>

          {/* ================= OFFICIAL CERTIFICATE / SLIP BONUSES ================= */}
          <div className="bg-[#0B0F15] border border-gray-800 rounded-2xl p-5 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800 pb-4">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-white font-mono flex items-center gap-2">
                  <Landmark className="w-5 h-5 text-amber-400" />
                  SLIP BERITA ACARA BONUS OPERASIONAL DINAS RESMI
                </h3>
                <p className="text-xs text-gray-400 font-mono">
                  Dokumen rincian komputasi gaji tambahan untuk verifikasi bendahara & pencairan APBN
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleCopyTextSlip}
                  className="px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold font-mono transition flex items-center gap-1.5 cursor-pointer shadow"
                >
                  {copyFeedback ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  {copyFeedback ? 'Tersalin!' : 'Salin Teks'}
                </button>

                <button
                  type="button"
                  onClick={() => handleExportImageSlip('png')}
                  disabled={exportingFormat !== null}
                  className="px-3 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600 text-emerald-200 text-xs font-bold font-mono transition flex items-center gap-1.5 cursor-pointer shadow"
                >
                  <Download className="w-4 h-4" />
                  {exportingFormat === 'png' ? 'Memproses...' : 'Unduh Gambar (PNG)'}
                </button>

                <button
                  type="button"
                  onClick={handleSubmitBonusClaim}
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black text-xs font-black font-mono transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-950"
                >
                  <Award className="w-4 h-4 stroke-[2.5]" />
                  Ajukan Klaim Resmi
                </button>
              </div>
            </div>

            {/* Printable & Exportable Slip Canvas Sheet */}
            <div
              id="official-bonus-slip-certificate"
              className="bg-[#0A0D13] border-2 border-amber-500/40 rounded-2xl p-6 sm:p-8 space-y-6 text-white font-mono shadow-2xl relative"
            >
              {/* Watermark / Logo background */}
              <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                <img src={HSPD_LOGO_URL} alt="HSPD Seal" className="w-96 h-96 object-contain" />
              </div>

              {/* Header Slip */}
              <div className="flex items-center justify-between border-b-2 border-amber-500/30 pb-4 relative z-10">
                <div className="flex items-center gap-3">
                  <img src={HSPD_LOGO_URL} alt="HSPD Logo" className="w-14 h-14 object-contain drop-shadow" />
                  <div>
                    <h2 className="text-base sm:text-lg font-black tracking-wider text-amber-300">
                      HIGH STATE POLICE DEPARTMENT
                    </h2>
                    <p className="text-[11px] text-gray-300">OFFICIAL OPERATIONAL INCENTIVE & BONUS STATEMENT</p>
                    <p className="text-[10px] text-gray-400 font-mono">Kode Arsip: HSPD-BONUS-{new Date().getFullYear()}-{bonusSummary.officerBadge.replace(/#/g, '')}</p>
                  </div>
                </div>

                <div className="text-right text-[11px] space-y-0.5">
                  <div className="text-gray-400">Tanggal Komputasi:</div>
                  <div className="font-bold text-white">{new Date(bonusSummary.calculatedAt).toLocaleDateString('id-ID', { dateStyle: 'full' })}</div>
                  <span className="inline-block px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-600 text-[10px] font-bold">
                    VERIFIKASI SISTEM SAH
                  </span>
                </div>
              </div>

              {/* Officer Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-black/60 border border-gray-800 rounded-xl text-xs relative z-10">
                <div>
                  <span className="text-[10px] text-gray-400">NAMA LENGKAP:</span>
                  <p className="font-extrabold text-white truncate">{bonusSummary.officerName}</p>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400">BADGE & PANGKAT:</span>
                  <p className="font-extrabold text-amber-300 truncate">{bonusSummary.officerBadge} • {bonusSummary.officerRank}</p>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400">PENUGASAN DIVISI:</span>
                  <p className="font-extrabold text-blue-300 truncate">{bonusSummary.division || 'Markas Pusat'}</p>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400">REKENING BANK PENCAIRAN:</span>
                  <p className="font-extrabold text-emerald-300 truncate">{bonusSummary.bankAccount || 'Kasir Keuangan Dinas'}</p>
                </div>
              </div>

              {/* Detailed Breakdown Table */}
              <div className="overflow-x-auto relative z-10">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-gray-800 text-[11px] text-gray-400 bg-white/5">
                      <th className="py-2.5 px-3">KATEGORI PRESTASI OPERASIONAL</th>
                      <th className="py-2.5 px-3">VOLUME / FREKUENSI</th>
                      <th className="py-2.5 px-3">NILAI KASUS / TRANSAKSI</th>
                      <th className="py-2.5 px-3 text-right">TOTAL BONUS BERSIH</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60">
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-white flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-amber-400" />
                        1. Kasus Penindakan & BAP
                      </td>
                      <td className="py-2.5 px-3">{bonusSummary.caseStats.count} Kasus ({bonusSummary.caseStats.cooperativeCount} Kooperatif)</td>
                      <td className="py-2.5 px-3 text-amber-300">${bonusSummary.caseStats.totalFine.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-amber-300">${bonusSummary.caseStats.subtotal.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-white flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-emerald-400" />
                        2. Pemasukan Efiden ke Brankas
                      </td>
                      <td className="py-2.5 px-3">{bonusSummary.evidenceStats.photoCount} Foto, {bonusSummary.evidenceStats.weaponCount} Senpi, {bonusSummary.evidenceStats.drugGrams}g Narkoba</td>
                      <td className="py-2.5 px-3 text-emerald-300">Uang Sitaan: ${bonusSummary.evidenceStats.cashSeized.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-300">${bonusSummary.evidenceStats.subtotal.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-white flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-blue-400" />
                        3. Pemasukan Tilang (Citations)
                      </td>
                      <td className="py-2.5 px-3">{bonusSummary.citationStats.count} Lembar Tiket</td>
                      <td className="py-2.5 px-3 text-blue-300">${bonusSummary.citationStats.totalFine.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-blue-300">${bonusSummary.citationStats.subtotal.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-white flex items-center gap-1.5">
                        <Car className="w-3.5 h-3.5 text-cyan-400" />
                        4. Pemasukan Derek & Impound
                      </td>
                      <td className="py-2.5 px-3">{bonusSummary.impoundStats.count} Unit Kendaraan</td>
                      <td className="py-2.5 px-3 text-cyan-300">${bonusSummary.impoundStats.totalFee.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-cyan-300">${bonusSummary.impoundStats.subtotal.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-white flex items-center gap-1.5">
                        <Crosshair className="w-3.5 h-3.5 text-violet-400" />
                        5. Sukses Perestokan Persenjataan
                      </td>
                      <td className="py-2.5 px-3">{bonusSummary.restockStats.missionCount} Misi ({bonusSummary.restockStats.weaponsCount} Senpi, {bonusSummary.restockStats.ammoBoxesCount} Peti)</td>
                      <td className="py-2.5 px-3 text-violet-300">Suplai Amunisi & Senjata</td>
                      <td className="py-2.5 px-3 text-right font-bold text-violet-300">${bonusSummary.restockStats.subtotal.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-white flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-rose-400" />
                        6. Peleburan Senjata Sitaan
                      </td>
                      <td className="py-2.5 px-3">{bonusSummary.smeltStats.weaponCount} Senpi Dilebur ({bonusSummary.smeltStats.certCount} BA)</td>
                      <td className="py-2.5 px-3 text-rose-300">Scrap Metal Smelter</td>
                      <td className="py-2.5 px-3 text-right font-bold text-rose-300">${bonusSummary.smeltStats.subtotal.toLocaleString()}</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-amber-500/40 bg-amber-950/30">
                      <td colSpan={3} className="py-3 px-3 text-right font-extrabold text-sm text-gray-200">
                        TOTAL HAK BONUS DINAS DITERIMA:
                      </td>
                      <td className="py-3 px-3 text-right font-black text-lg text-amber-300">
                        ${bonusSummary.grandTotalBonus.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Signatures & Accreditation Footer */}
              <div className="pt-4 border-t border-gray-800 grid grid-cols-2 sm:grid-cols-3 gap-4 text-center text-xs relative z-10">
                <div className="space-y-6">
                  <p className="text-[10px] text-gray-400 uppercase font-mono">Personel Penerima Bonus,</p>
                  <div className="font-extrabold text-white underline decoration-gray-600 underline-offset-4">
                    {bonusSummary.officerName}
                  </div>
                  <p className="text-[9px] text-gray-400 font-mono">{bonusSummary.officerBadge} • {bonusSummary.officerRank}</p>
                </div>

                <div className="space-y-6 hidden sm:block">
                  <p className="text-[10px] text-gray-400 uppercase font-mono">Bendahara Keuangan Dinas,</p>
                  <div className="font-extrabold text-emerald-400 underline decoration-gray-600 underline-offset-4">
                    HIGHSTATE TREASURY
                  </div>
                  <p className="text-[9px] text-gray-400 font-mono">Otorisasi APBN & Tunjangan Operasional</p>
                </div>

                <div className="space-y-6">
                  <p className="text-[10px] text-gray-400 uppercase font-mono">Mengetahui & Menyetujui,</p>
                  <div className="font-extrabold text-amber-300 underline decoration-gray-600 underline-offset-4">
                    {currentOfficer?.name || 'Raymond Holt'}
                  </div>
                  <p className="text-[9px] text-gray-400 font-mono">{currentOfficer?.rank || 'CHIEF OF POLICE [COP]'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: RESTOCK PERSENJATAAN MANAGER ================= */}
      {activeTab === 'restock_manager' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0E131A] border border-gray-800 rounded-2xl p-4 sm:p-5">
            <div>
              <h2 className="text-base font-extrabold text-white font-mono flex items-center gap-2">
                <Crosshair className="w-5 h-5 text-violet-400" />
                LOGISTIK & MISI PERESTOKAN PERSENJATAAN RESMI
              </h2>
              <p className="text-xs text-gray-400 font-mono">
                Catatan resmi misi pengadaan dan pengawalan senjata dinas, peti amunisi, dan rompi balistik markas
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAddRestockModal(true)}
              className="px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-black font-mono transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-violet-950 active:scale-95"
            >
              <Plus className="w-4 h-4" /> Catat Misi Restok Baru
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {restockMissions.map((m) => {
              const totalWpns = m.weaponsRestocked.reduce((acc, w) => acc + w.quantity, 0);
              return (
                <div
                  key={m.id}
                  className="bg-[#0B1015] border border-violet-500/30 hover:border-violet-400/60 rounded-2xl p-4 space-y-3 shadow-lg transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-violet-300 bg-violet-950/80 px-2.5 py-0.5 rounded border border-violet-500/50">
                      #{m.missionCode}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-600 font-bold">
                      VERIFIKASI SUKSES
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-extrabold text-white">{m.title}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{m.notes}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 p-2 bg-black/40 rounded-xl text-xs font-mono text-center">
                    <div>
                      <span className="text-[10px] text-gray-500">SENPI:</span>
                      <p className="font-extrabold text-violet-300">{totalWpns} Unit</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500">PETI AMUNISI:</span>
                      <p className="font-extrabold text-amber-300">{m.ammoBoxes} Box</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500">ROMPI BALISTIK:</span>
                      <p className="font-extrabold text-emerald-300">{m.bodyArmors} Pcs</p>
                    </div>
                  </div>

                  {/* Weapon Models Breakdown */}
                  <div className="text-[11px] font-mono text-gray-300 space-y-1">
                    <span className="text-[10px] text-gray-500 uppercase font-bold">Rincian Senjata:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {m.weaponsRestocked.map((w, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded bg-gray-800/80 border border-gray-700 text-[10px] text-gray-200">
                          {w.model}: <strong>{w.quantity}x</strong>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-800 flex items-center justify-between text-[10px] text-gray-400 font-mono">
                    <span>Pelaksana: <strong>{m.conductedBy} ({m.conductedBadge})</strong></span>
                    <span>{m.dateFormatted}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= TAB 3: RIWAYAT KLAIM BONUS ================= */}
      {activeTab === 'claims_history' && (
        <div className="space-y-4">
          <div className="bg-[#0E131A] border border-gray-800 rounded-2xl p-4 sm:p-5 flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-white font-mono flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                RIWAYAT PENGAJUAN & PENCAIRAN KLAIM BONUS DINAS
              </h2>
              <p className="text-xs text-gray-400 font-mono">
                Daftar berkas klaim komisi prestasi personel kepolisian dan status persetujuan High Command
              </p>
            </div>
          </div>

          {claims.length === 0 ? (
            <div className="p-12 text-center bg-[#0B0F15] border border-gray-800 rounded-2xl space-y-2 font-mono">
              <Award className="w-10 h-10 text-gray-600 mx-auto" />
              <p className="text-sm font-bold text-gray-300">Belum Ada Riwayat Klaim Bonus</p>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                Ajukan klaim bonus dinas melalui tombol "Ajukan Klaim Resmi" pada tab Kalkulator setelah meninjau rincian 6 kategori bonus Anda.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {claims.map((c) => (
                <div
                  key={c.id}
                  className="bg-[#0B0F15] border border-gray-800 hover:border-amber-500/40 rounded-2xl p-4 space-y-3 shadow-lg transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-800/80 pb-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-xs text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-600/50">
                        #{c.claimNumber}
                      </span>
                      <span className="text-xs font-extrabold text-white font-mono">
                        {c.officerName} ({c.officerBadge}) • {c.officerRank}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">
                        {new Date(c.submittedAt).toLocaleString('id-ID')}
                      </span>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                        c.status === 'DISBURSED_PAID'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                          : c.status === 'APPROVED'
                          ? 'bg-blue-950 text-blue-300 border-blue-500'
                          : c.status === 'REJECTED'
                          ? 'bg-rose-950 text-rose-300 border-rose-500'
                          : 'bg-amber-950 text-amber-300 border-amber-500 animate-pulse'
                      }`}>
                        {c.status === 'DISBURSED_PAID' && '💰 DICAIRKAN & LUNAS'}
                        {c.status === 'APPROVED' && '🟢 DISETUJUI HIGH COMMAND'}
                        {c.status === 'PENDING_APPROVAL' && '⏳ MENUNGGU PERSETUJUAN'}
                        {c.status === 'REJECTED' && '❌ DITOLAK'}
                      </span>

                      <span className="text-base font-black text-amber-300 font-mono">
                        ${c.summary.grandTotalBonus.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Quick Breakdown 6 Categories */}
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-[10px] font-mono bg-black/40 p-2.5 rounded-xl border border-gray-800">
                    <div>
                      <span className="text-gray-500">1. KASUS:</span>
                      <p className="font-bold text-amber-300">${c.summary.caseStats.subtotal.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">2. EFIDEN:</span>
                      <p className="font-bold text-emerald-300">${c.summary.evidenceStats.subtotal.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">3. TILANG:</span>
                      <p className="font-bold text-blue-300">${c.summary.citationStats.subtotal.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">4. IMPOUND:</span>
                      <p className="font-bold text-cyan-300">${c.summary.impoundStats.subtotal.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">5. RESTOK:</span>
                      <p className="font-bold text-violet-300">${c.summary.restockStats.subtotal.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">6. LEBUR:</span>
                      <p className="font-bold text-rose-300">${c.summary.smeltStats.subtotal.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Actions for High Command */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-gray-400 font-mono">
                      Rek. Bank: <strong className="text-emerald-300">{c.bankAccount || 'Kasir Keuangan'}</strong>
                    </span>

                    {isHighCommand && (
                      <div className="flex items-center gap-2">
                        {c.status === 'PENDING_APPROVAL' && (
                          <button
                            type="button"
                            onClick={() => handleApproveClaim(c)}
                            className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold font-mono transition cursor-pointer"
                          >
                            Setujui Klaim
                          </button>
                        )}
                        {(c.status === 'APPROVED' || c.status === 'PENDING_APPROVAL') && (
                          <button
                            type="button"
                            onClick={() => handleDisburseClaim(c)}
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold font-mono transition cursor-pointer"
                          >
                            Cairkan Dana
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            deleteBonusClaim(c.id);
                            setClaims(getSavedBonusClaims());
                          }}
                          className="p-1 rounded text-gray-500 hover:text-rose-400 hover:bg-rose-950/40 cursor-pointer"
                          title="Hapus Arsip Klaim"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 4: PENGATURAN TARIF & REWARD (HIGH COMMAND) ================= */}
      {activeTab === 'rate_settings' && (
        <form onSubmit={handleSaveRates} className="bg-[#0B0F15] border border-gray-800 rounded-2xl p-5 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800 pb-4">
            <div>
              <h2 className="text-base font-extrabold text-white font-mono flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-amber-400" />
                KONFIGURASI TARIF & REGULASI REWARD 6 BONUS
              </h2>
              <p className="text-xs text-gray-400 font-mono">
                Pengaturan parameter reward nominal ($) dan persentase (%) untuk komputasi bonus seluruh personel kepolisian
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRates(resetBonusRateConfig())}
                className="px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-mono font-bold cursor-pointer"
              >
                Reset Default
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-mono font-black shadow-lg shadow-amber-950 cursor-pointer active:scale-95"
              >
                Simpan Konfigurasi
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-xs font-mono">
            {/* 1. Kasus Penindakan */}
            <div className="p-4 bg-black/40 border border-amber-500/30 rounded-xl space-y-3">
              <h3 className="font-extrabold text-amber-300 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-amber-400" /> 1. KASUS PENINDAKAN
              </h3>
              <div className="space-y-2">
                <div>
                  <label className="text-gray-400 text-[10px]">Reward Dasar per Kasus BAP ($):</label>
                  <input
                    type="number"
                    min="0"
                    value={rates.caseBaseReward}
                    onChange={(e) => setRates({ ...rates, caseBaseReward: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-black/60 border border-gray-700 rounded px-3 py-1.5 text-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-[10px]">Persentase Denda Kasus (%):</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={rates.caseFinePercent}
                    onChange={(e) => setRates({ ...rates, caseFinePercent: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-black/60 border border-gray-700 rounded px-3 py-1.5 text-amber-300 font-bold"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-[10px]">Bonus Tersangka Kooperatif ($):</label>
                  <input
                    type="number"
                    min="0"
                    value={rates.caseCooperativeBonus}
                    onChange={(e) => setRates({ ...rates, caseCooperativeBonus: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-black/60 border border-gray-700 rounded px-3 py-1.5 text-emerald-300 font-bold"
                  />
                </div>
              </div>
            </div>

            {/* 2. Pemasukan Efiden */}
            <div className="p-4 bg-black/40 border border-emerald-500/30 rounded-xl space-y-3">
              <h3 className="font-extrabold text-emerald-300 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-emerald-400" /> 2. PEMASUKAN EFIDEN
              </h3>
              <div className="space-y-2">
                <div>
                  <label className="text-gray-400 text-[10px]">Reward per Foto Bukti ($):</label>
                  <input
                    type="number"
                    min="0"
                    value={rates.evidencePhotoReward}
                    onChange={(e) => setRates({ ...rates, evidencePhotoReward: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-black/60 border border-gray-700 rounded px-3 py-1.5 text-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-[10px]">Reward per Senpi Sitaan ($):</label>
                  <input
                    type="number"
                    min="0"
                    value={rates.evidenceWeaponReward}
                    onChange={(e) => setRates({ ...rates, evidenceWeaponReward: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-black/60 border border-gray-700 rounded px-3 py-1.5 text-red-300 font-bold"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-[10px]">Reward Narkoba per Gram ($):</label>
                  <input
                    type="number"
                    min="0"
                    value={rates.evidenceDrugGramReward}
                    onChange={(e) => setRates({ ...rates, evidenceDrugGramReward: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-black/60 border border-gray-700 rounded px-3 py-1.5 text-purple-300 font-bold"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-[10px]">Persentase Kas Sitaan (%):</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={rates.evidenceCashPercent}
                    onChange={(e) => setRates({ ...rates, evidenceCashPercent: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-black/60 border border-gray-700 rounded px-3 py-1.5 text-emerald-300 font-bold"
                  />
                </div>
              </div>
            </div>

            {/* 3. Pemasukan Tilang */}
            <div className="p-4 bg-black/40 border border-blue-500/30 rounded-xl space-y-3">
              <h3 className="font-extrabold text-blue-300 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-400" /> 3. PEMASUKAN TILANG
              </h3>
              <div className="space-y-2">
                <div>
                  <label className="text-gray-400 text-[10px]">Persentase Denda Tiket Tilang (%):</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={rates.citationFinePercent}
                    onChange={(e) => setRates({ ...rates, citationFinePercent: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-black/60 border border-gray-700 rounded px-3 py-1.5 text-blue-300 font-bold"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-[10px]">Reward Flat per Lembar Tiket ($):</label>
                  <input
                    type="number"
                    min="0"
                    value={rates.citationFlatReward}
                    onChange={(e) => setRates({ ...rates, citationFlatReward: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-black/60 border border-gray-700 rounded px-3 py-1.5 text-white font-bold"
                  />
                </div>
              </div>
            </div>

            {/* 4. Pemasukan Impound */}
            <div className="p-4 bg-black/40 border border-cyan-500/30 rounded-xl space-y-3">
              <h3 className="font-extrabold text-cyan-300 flex items-center gap-1.5">
                <Car className="w-4 h-4 text-cyan-400" /> 4. PEMASUKAN IMPOUND
              </h3>
              <div className="space-y-2">
                <div>
                  <label className="text-gray-400 text-[10px]">Persentase Tarif Denda Derek (%):</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={rates.impoundFeePercent}
                    onChange={(e) => setRates({ ...rates, impoundFeePercent: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-black/60 border border-gray-700 rounded px-3 py-1.5 text-cyan-300 font-bold"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-[10px]">Reward Flat per Unit Kendaraan ($):</label>
                  <input
                    type="number"
                    min="0"
                    value={rates.impoundFlatReward}
                    onChange={(e) => setRates({ ...rates, impoundFlatReward: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-black/60 border border-gray-700 rounded px-3 py-1.5 text-white font-bold"
                  />
                </div>
              </div>
            </div>

            {/* 5. Sukses Perestokan Persenjataan */}
            <div className="p-4 bg-black/40 border border-violet-500/30 rounded-xl space-y-3">
              <h3 className="font-extrabold text-violet-300 flex items-center gap-1.5">
                <Crosshair className="w-4 h-4 text-violet-400" /> 5. RESTOK PERSENJATAAN
              </h3>
              <div className="space-y-2">
                <div>
                  <label className="text-gray-400 text-[10px]">Reward per Misi Logistik Sukses ($):</label>
                  <input
                    type="number"
                    min="0"
                    value={rates.restockMissionReward}
                    onChange={(e) => setRates({ ...rates, restockMissionReward: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-black/60 border border-gray-700 rounded px-3 py-1.5 text-violet-300 font-bold"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-[10px]">Reward per Unit Senpi Dinas ($):</label>
                  <input
                    type="number"
                    min="0"
                    value={rates.restockWeaponUnitReward}
                    onChange={(e) => setRates({ ...rates, restockWeaponUnitReward: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-black/60 border border-gray-700 rounded px-3 py-1.5 text-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-[10px]">Reward per Peti Amunisi ($):</label>
                  <input
                    type="number"
                    min="0"
                    value={rates.restockAmmoBoxReward}
                    onChange={(e) => setRates({ ...rates, restockAmmoBoxReward: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-black/60 border border-gray-700 rounded px-3 py-1.5 text-amber-300 font-bold"
                  />
                </div>
              </div>
            </div>

            {/* 6. Peleburan Senjata */}
            <div className="p-4 bg-black/40 border border-rose-500/30 rounded-xl space-y-3">
              <h3 className="font-extrabold text-rose-300 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-rose-400" /> 6. PELEBURAN SENJATA
              </h3>
              <div className="space-y-2">
                <div>
                  <label className="text-gray-400 text-[10px]">Nilai Scrap per Senpi Dilebur ($):</label>
                  <input
                    type="number"
                    min="0"
                    value={rates.smeltWeaponReward}
                    onChange={(e) => setRates({ ...rates, smeltWeaponReward: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-black/60 border border-gray-700 rounded px-3 py-1.5 text-rose-300 font-bold"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-[10px]">Reward Eksekutor Berita Acara ($):</label>
                  <input
                    type="number"
                    min="0"
                    value={rates.smeltCertReward}
                    onChange={(e) => setRates({ ...rates, smeltCertReward: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-black/60 border border-gray-700 rounded px-3 py-1.5 text-white font-bold"
                  />
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ================= MODAL TAMBAH MISI RESTOK PERSENJATAAN ================= */}
      {showAddRestockModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[#0D1219] border border-violet-500/60 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95 font-mono">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <Crosshair className="w-5 h-5 text-violet-400" />
                <h3 className="text-sm font-extrabold text-white">CATAT MISI RESTOK PERSENJATAAN BARU</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddRestockModal(false)}
                className="text-gray-400 hover:text-white p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRestockMission} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[10px] text-gray-400">Judul Operasi Restok:</label>
                <input
                  type="text"
                  required
                  value={newRestockTitle}
                  onChange={(e) => setNewRestockTitle(e.target.value)}
                  className="w-full bg-black/60 border border-gray-700 rounded-lg px-3 py-2 text-white font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-400">Daftar Senjata Direstock:</label>
                <div className="space-y-2 mt-1">
                  {newRestockWeapons.map((w, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={w.model}
                        onChange={(e) => {
                          const updated = [...newRestockWeapons];
                          updated[idx].model = e.target.value;
                          setNewRestockWeapons(updated);
                        }}
                        className="flex-1 bg-black/60 border border-gray-700 rounded px-2.5 py-1.5 text-white"
                      />
                      <input
                        type="number"
                        min="0"
                        value={w.quantity}
                        onChange={(e) => {
                          const updated = [...newRestockWeapons];
                          updated[idx].quantity = parseInt(e.target.value, 10) || 0;
                          setNewRestockWeapons(updated);
                        }}
                        className="w-20 bg-black/60 border border-gray-700 rounded px-2.5 py-1.5 text-right text-violet-300 font-bold"
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setNewRestockWeapons([...newRestockWeapons, { model: 'Carbine Rifle 5.56', quantity: 2 }])}
                    className="text-[11px] text-violet-400 hover:text-violet-300 flex items-center gap-1 cursor-pointer font-bold"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Tipe Senjata
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-gray-400">Peti Amunisi (Boxes):</label>
                  <input
                    type="number"
                    min="0"
                    value={newRestockAmmo}
                    onChange={(e) => setNewRestockAmmo(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-black/60 border border-gray-700 rounded-lg px-3 py-1.5 text-amber-300 font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400">Rompi Balistik (Pcs):</label>
                  <input
                    type="number"
                    min="0"
                    value={newRestockArmors}
                    onChange={(e) => setNewRestockArmors(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-black/60 border border-gray-700 rounded-lg px-3 py-1.5 text-emerald-300 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-gray-400">Catatan Gudang Persenjataan:</label>
                <textarea
                  rows={2}
                  value={newRestockNotes}
                  onChange={(e) => setNewRestockNotes(e.target.value)}
                  className="w-full bg-black/60 border border-gray-700 rounded-lg p-2.5 text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowAddRestockModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-bold cursor-pointer"
                >
                  Verifikasi Misi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
