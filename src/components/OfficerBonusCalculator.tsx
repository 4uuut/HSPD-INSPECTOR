import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Calculator, DollarSign, Coins, TrendingUp, Shield, ShieldAlert, 
  PackageCheck, FileText, Truck, Boxes, Flame, CheckCircle2, Clock, 
  AlertCircle, X, Plus, Search, Filter, RefreshCw, Download, Printer, 
  Copy, Send, ExternalLink, Calendar, ChevronRight, UserCheck, Lock, 
  Edit3, Trash2, ArrowUpRight, Award, ChevronDown, Check, Building2,
  Wallet, Sparkles, CreditCard, Receipt, FileSpreadsheet, AlertTriangle,
  Layers, Camera
} from 'lucide-react';
import { 
  OfficerAccount, 
  OfficerProfile, 
  OfficerBonusRatesConfig, 
  ArmoryRestockRecord, 
  OfficerBonusClaim, 
  OfficerBonusBreakdown,
  OfficerBonusClaimStatus,
  isOfficerHighRank,
  ArmoryWeaponCategory
} from '../types';
import { 
  getSavedBonusRates, 
  saveBonusRates, 
  resetBonusRatesToDefault,
  getSavedArmoryRestocks, 
  saveArmoryRestock, 
  deleteArmoryRestock,
  getSavedBonusClaims, 
  saveBonusClaim, 
  deleteBonusClaim, 
  updateBonusClaimStatus,
  aggregateOfficerPerformance,
  computeBonusFromPerformance,
  generateBonusSlipMarkdown,
  RawOfficerPerformanceSummary
} from '../utils/officerBonusStorage';
import { 
  sendOfficerBonusClaimToDiscord, 
  getSavedBonusWebhookConfig,
  testBonusClaimWebhook 
} from '../utils/discordWebhook';
import { exportElementAsImage } from '../utils/exportDocumentAsImage';
import { HSPD_LOGO_URL } from '../assets/logo';
import { playSystemNotificationChime } from '../utils/systemNotificationAudio';

interface Props {
  currentOfficer: OfficerProfile | null;
  roster: OfficerAccount[];
}

type PeriodType = 'today' | 'current_week' | 'last_week' | 'current_month' | 'all_time' | 'custom';

export const OfficerBonusCalculator: React.FC<Props> = ({ currentOfficer, roster }) => {
  const isHighCommand = isOfficerHighRank(currentOfficer?.rank);

  // Core Data States
  const [rates, setRates] = useState<OfficerBonusRatesConfig>(() => getSavedBonusRates());
  const [restocks, setRestocks] = useState<ArmoryRestockRecord[]>(() => getSavedArmoryRestocks());
  const [claims, setClaims] = useState<OfficerBonusClaim[]>(() => getSavedBonusClaims());

  // Filter & Selection States
  const [selectedBadge, setSelectedBadge] = useState<string>(() => currentOfficer?.badge || (roster[0]?.badge || '#001'));
  const [periodType, setPeriodType] = useState<PeriodType>('current_week');
  const [customStart, setCustomStart] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [customEnd, setCustomEnd] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // Mode: Auto Database Aggregation vs Manual Simulation
  const [calcMode, setCalcMode] = useState<'AUTO_DATABASE' | 'MANUAL_SIMULATOR'>('AUTO_DATABASE');

  // Manual Overrides for Simulator
  const [manualArrestCount, setManualArrestCount] = useState<number>(0);
  const [manualEvidenceCount, setManualEvidenceCount] = useState<number>(0);
  const [manualCitationCount, setManualCitationCount] = useState<number>(0);
  const [manualCitationFine, setManualCitationFine] = useState<number>(0);
  const [manualImpoundCount, setManualImpoundCount] = useState<number>(0);
  const [manualImpoundFee, setManualImpoundFee] = useState<number>(0);
  const [manualRestockCount, setManualRestockCount] = useState<number>(0);
  const [manualSmeltingCount, setManualSmeltingCount] = useState<number>(0);

  // Active Main Tab
  const [activeTab, setActiveTab] = useState<'CALCULATOR' | 'CLAIMS_HISTORY' | 'ARMORY_RESTOCK'>('CALCULATOR');

  // Modals
  const [isRatesModalOpen, setIsRatesModalOpen] = useState(false);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);
  const [activeClaimSlip, setActiveClaimSlip] = useState<OfficerBonusClaim | null>(null);
  const [selectedDetailCategory, setSelectedDetailCategory] = useState<string | null>(null);

  // Notifications & Loaders
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [isExportingImage, setIsExportingImage] = useState<'png' | 'jpeg' | null>(null);
  const [isSendingDiscord, setIsSendingDiscord] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Sync Listeners
  useEffect(() => {
    const handleRatesSync = () => setRates(getSavedBonusRates());
    const handleRestockSync = () => setRestocks(getSavedArmoryRestocks());
    const handleClaimsSync = () => setClaims(getSavedBonusClaims());

    window.addEventListener('hspd-bonus-rates-updated', handleRatesSync);
    window.addEventListener('hspd-armory-restock-updated', handleRestockSync);
    window.addEventListener('hspd-bonus-claims-updated', handleClaimsSync);

    return () => {
      window.removeEventListener('hspd-bonus-rates-updated', handleRatesSync);
      window.removeEventListener('hspd-armory-restock-updated', handleRestockSync);
      window.removeEventListener('hspd-bonus-claims-updated', handleClaimsSync);
    };
  }, []);

  // Selected Officer Profile from Roster
  const selectedOfficerAccount = useMemo(() => {
    const norm = selectedBadge.toLowerCase().replace(/#/g, '').trim();
    return roster.find(o => (o.badge || '').toLowerCase().replace(/#/g, '').trim() === norm) || null;
  }, [selectedBadge, roster]);

  const officerDisplayName = selectedOfficerAccount?.name || currentOfficer?.name || 'Petugas HSPD';
  const officerDisplayRank = selectedOfficerAccount?.rank || currentOfficer?.rank || 'POLICE OFFICER';
  const officerDisplayDivision = selectedOfficerAccount?.division || currentOfficer?.division || 'Patrol Division';
  const officerBankAccount = selectedOfficerAccount?.bankAccountNumber || (selectedOfficerAccount as any)?.bankAccount || '9841-XXX-XXXX';

  // Calculate Start & End Timestamps from Period
  const { startMs, endMs, periodLabel } = useMemo(() => {
    const now = new Date();
    let s = new Date(now);
    let e = new Date(now);

    if (periodType === 'today') {
      s.setHours(0, 0, 0, 0);
      e.setHours(23, 59, 59, 999);
      const label = `Hari Ini (${s.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })})`;
      return { startMs: s.getTime(), endMs: e.getTime(), periodLabel: label };
    }

    if (periodType === 'current_week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      s = new Date(now.setDate(diff));
      s.setHours(0, 0, 0, 0);
      e = new Date();
      e.setHours(23, 59, 59, 999);
      const weekNum = Math.ceil(now.getDate() / 7);
      const label = `Minggu ke-${weekNum} (${s.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })})`;
      return { startMs: s.getTime(), endMs: e.getTime(), periodLabel: label };
    }

    if (periodType === 'last_week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1) - 7;
      s = new Date(now.setDate(diff));
      s.setHours(0, 0, 0, 0);
      e = new Date(s);
      e.setDate(e.getDate() + 6);
      e.setHours(23, 59, 59, 999);
      const label = `Minggu Lalu (${s.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - ${e.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })})`;
      return { startMs: s.getTime(), endMs: e.getTime(), periodLabel: label };
    }

    if (periodType === 'current_month') {
      s = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      e = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      const label = `Bulan ${s.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`;
      return { startMs: s.getTime(), endMs: e.getTime(), periodLabel: label };
    }

    if (periodType === 'all_time') {
      s = new Date(2024, 0, 1, 0, 0, 0, 0);
      e = new Date(2030, 11, 31, 23, 59, 59, 999);
      return { startMs: s.getTime(), endMs: e.getTime(), periodLabel: 'Seluruh Riwayat (All Time)' };
    }

    // Custom
    s = new Date(customStart + 'T00:00:00');
    e = new Date(customEnd + 'T23:59:59');
    const startStr = s.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
    const endStr = e.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    return { startMs: s.getTime(), endMs: e.getTime(), periodLabel: `${startStr} - ${endStr}` };
  }, [periodType, customStart, customEnd]);

  // Aggregate Raw Performance Data from Real Database
  const rawPerformance: RawOfficerPerformanceSummary = useMemo(() => {
    return aggregateOfficerPerformance(selectedBadge, officerDisplayName, startMs, endMs);
  }, [selectedBadge, officerDisplayName, startMs, endMs, restocks]);

  // Auto-fill manual simulator values when switching or updating
  useEffect(() => {
    if (calcMode === 'MANUAL_SIMULATOR') {
      setManualArrestCount(rawPerformance.arrestCasesCount);
      setManualEvidenceCount(rawPerformance.evidenceItemsCount);
      setManualCitationCount(rawPerformance.citationsCount);
      setManualCitationFine(rawPerformance.citationsTotalFine);
      setManualImpoundCount(rawPerformance.impoundsCount);
      setManualImpoundFee(rawPerformance.impoundsTotalFee);
      setManualRestockCount(rawPerformance.weaponRestocksCount);
      setManualSmeltingCount(rawPerformance.weaponSmeltingsCount);
    }
  }, [calcMode, rawPerformance]);

  // Effective Performance Data (either from DB or Manual Simulator)
  const effectivePerformance: RawOfficerPerformanceSummary = useMemo(() => {
    if (calcMode === 'MANUAL_SIMULATOR') {
      return {
        arrestCasesCount: manualArrestCount,
        evidenceItemsCount: manualEvidenceCount,
        citationsCount: manualCitationCount,
        citationsTotalFine: manualCitationFine,
        impoundsCount: manualImpoundCount,
        impoundsTotalFee: manualImpoundFee,
        weaponRestocksCount: manualRestockCount,
        weaponSmeltingsCount: manualSmeltingCount,
        arrestDetails: rawPerformance.arrestDetails,
        citationDetails: rawPerformance.citationDetails,
        impoundDetails: rawPerformance.impoundDetails,
        restockDetails: rawPerformance.restockDetails,
        smeltingDetails: rawPerformance.smeltingDetails
      };
    }
    return rawPerformance;
  }, [
    calcMode, rawPerformance, manualArrestCount, manualEvidenceCount,
    manualCitationCount, manualCitationFine, manualImpoundCount,
    manualImpoundFee, manualRestockCount, manualSmeltingCount
  ]);

  // Compute Bonus Breakdown & Totals
  const { breakdown, totalGrossBonus, deductions, totalNetBonus } = useMemo(() => {
    return computeBonusFromPerformance(effectivePerformance, rates);
  }, [effectivePerformance, rates]);

  // Current Generated Claim Object
  const currentCalculatedClaim: OfficerBonusClaim = useMemo(() => {
    const claimNum = `HSPD-BONUS-26-${selectedBadge.replace(/#/g, '')}-${Date.now().toString().slice(-4)}`;
    return {
      id: `BONUS-${Date.now()}`,
      claimNumber: claimNum,
      officerBadge: selectedBadge,
      officerName: officerDisplayName,
      officerRank: officerDisplayRank,
      officerDivision: officerDisplayDivision,
      bankAccountNumber: officerBankAccount,
      periodLabel,
      periodStart: startMs,
      periodEnd: endMs,
      breakdown,
      totalGrossBonus,
      deductions,
      totalNetBonus,
      status: 'DRAFT',
      submittedAt: Date.now()
    };
  }, [
    selectedBadge, officerDisplayName, officerDisplayRank, 
    officerDisplayDivision, officerBankAccount, periodLabel, 
    startMs, endMs, breakdown, totalGrossBonus, deductions, totalNetBonus
  ]);

  // Handlers
  const handleOpenSlip = (claim?: OfficerBonusClaim) => {
    setActiveClaimSlip(claim || currentCalculatedClaim);
    setIsSlipModalOpen(true);
  };

  const handleSubmitClaim = () => {
    const claimToSave: OfficerBonusClaim = {
      ...currentCalculatedClaim,
      id: `BONUS-${Date.now()}`,
      status: isHighCommand ? 'APPROVED' : 'PENDING_APPROVAL',
      submittedAt: Date.now(),
      approvedBy: isHighCommand ? `${currentOfficer?.name || 'High Command'} (${currentOfficer?.badge || '#001'})` : undefined,
      approvedAt: isHighCommand ? Date.now() : undefined
    };

    saveBonusClaim(claimToSave);
    playSystemNotificationChime('IMPORTANT');

    setNotification({
      type: 'success',
      message: isHighCommand 
        ? `✅ Berkas klaim bonus ${claimToSave.claimNumber} berhasil disetujui & dicatat ke sistem!` 
        : `✅ Berkas klaim bonus ${claimToSave.claimNumber} berhasil diajukan! Menunggu otorisasi High Command.`
    });

    // Auto open slip
    handleOpenSlip(claimToSave);
  };

  const handleCopyDiscordSlip = (claim: OfficerBonusClaim) => {
    const text = generateBonusSlipMarkdown(claim);
    navigator.clipboard.writeText(text);
    setCopyFeedback(true);
    playSystemNotificationChime('INFO');
    setTimeout(() => setCopyFeedback(false), 2500);
    setNotification({
      type: 'info',
      message: '📋 Format rekapitulasi bonus berhasil disalin ke clipboard! Siap di-paste ke channel Discord.'
    });
  };

  const handleSendToDiscordWebhook = async (claim: OfficerBonusClaim) => {
    setIsSendingDiscord(true);
    try {
      const res = await sendOfficerBonusClaimToDiscord(claim);
      if (res.success) {
        // Mark claim as dispatched
        claim.discordDispatched = true;
        saveBonusClaim(claim);
        playSystemNotificationChime('IMPORTANT');
        setNotification({
          type: 'success',
          message: res.message
        });
      } else {
        setNotification({
          type: 'error',
          message: res.message
        });
      }
    } catch (e: any) {
      setNotification({
        type: 'error',
        message: e?.message || 'Gagal mengirim sinyal Discord Webhook.'
      });
    } finally {
      setIsSendingDiscord(false);
    }
  };

  const handleExportSlipImage = async (format: 'png' | 'jpeg') => {
    if (!activeClaimSlip) return;
    setIsExportingImage(format);
    try {
      const res = await exportElementAsImage('hspd-bonus-slip-render', {
        fileName: `SLIP_BONUS_HSPD_${activeClaimSlip.officerBadge.replace(/#/g, '')}_${activeClaimSlip.claimNumber}`,
        format,
        quality: 0.98,
        backgroundColor: '#0A0E14',
        scale: 2
      });

      if (res.success) {
        setNotification({
          type: 'success',
          message: `Berhasil mengunduh Slip Bonus Resmi dalam format ${format.toUpperCase()}!`
        });
      } else {
        setNotification({
          type: 'error',
          message: res.error || 'Gagal mengekspor slip ke gambar.'
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

  // Form State for New Armory Restock Record
  const [restockLoc, setRestockLoc] = useState('Gudang Logistik Pusat Persenjataan HSPD HQ (Lt. B2)');
  const [restockSupplier, setRestockSupplier] = useState('Depot Logistik Persenjataan Pusat Los Santos');
  const [restockWeaponsList, setRestockWeaponsList] = useState<string>('Glock 19 Gen 5 (10 Unit)\nRemington 870 Shotgun (4 Unit)\nColt M4A1 Carbine (2 Unit)');
  const [restockAmmoCount, setRestockAmmoCount] = useState<number>(5000);
  const [restockGearCount, setRestockGearCount] = useState<number>(10);
  const [restockProofUrl, setRestockProofUrl] = useState('');
  const [restockWitness, setRestockWitness] = useState(`${currentOfficer?.name || 'Supervisor'} (${currentOfficer?.badge || '#001'})`);
  const [restockNotes, setRestockNotes] = useState('Operasi pengawalan logistik persenjataan tiba di armory dan disahkan tanpa selisih barang.');

  const handleSaveNewRestock = (e: React.FormEvent) => {
    e.preventDefault();

    const lines = restockWeaponsList.split('\n').filter(l => l.trim().length > 0);
    const parsedItems = lines.map(line => {
      let cat: ArmoryWeaponCategory = 'HANDGUN';
      const low = line.toLowerCase();
      if (low.includes('shotgun')) cat = 'SHOTGUN';
      else if (low.includes('m4') || low.includes('rifle') || low.includes('carbine')) cat = 'RIFLE';
      else if (low.includes('smg') || low.includes('mp5') || low.includes('uzi')) cat = 'SMG';
      else if (low.includes('ammo') || low.includes('peluru')) cat = 'AMMO';
      else if (low.includes('taser') || low.includes('vest') || low.includes('kevlar')) cat = 'TACTICAL';

      // extract quantity if in brackets e.g. (10 Unit)
      const match = line.match(/\((\d+)/);
      const qty = match ? parseInt(match[1], 10) : 1;

      return {
        name: line.trim(),
        quantity: qty,
        category: cat
      };
    });

    const totalWeapons = parsedItems.reduce((acc, it) => acc + (it.category !== 'AMMO' && it.category !== 'TACTICAL' ? it.quantity : 0), 0);

    const newRecord: ArmoryRestockRecord = {
      id: `RESTOCK-${Date.now()}`,
      restockNumber: `HSPD-ARM-26-${Math.floor(100 + Math.random() * 900)}`,
      officerName: officerDisplayName,
      officerBadge: selectedBadge,
      officerRank: officerDisplayRank,
      date: new Date().toISOString().split('T')[0],
      armoryLocation: restockLoc,
      supplierSource: restockSupplier,
      weaponsRestocked: parsedItems,
      totalWeaponsCount: totalWeapons || 1,
      ammoRoundsCount: restockAmmoCount,
      tacticalGearCount: restockGearCount,
      status: 'SUCCESS_VERIFIED',
      witnessSupervisor: restockWitness,
      notes: restockNotes,
      proofPhotos: restockProofUrl ? [restockProofUrl] : ['https://images.unsplash.com/photo-1595590424283-b8f17842773f?w=600&auto=format&fit=crop&q=80'],
      timestamp: Date.now()
    };

    saveArmoryRestock(newRecord);
    playSystemNotificationChime('IMPORTANT');
    setIsRestockModalOpen(false);
    setNotification({
      type: 'success',
      message: `✅ Berita Acara Restok Persenjataan ${newRecord.restockNumber} berhasil dicatat dan masuk hitungan bonus!`
    });
  };

  const fmtCurrency = (val: number) => `$${(val || 0).toLocaleString('id-ID')}`;

  return (
    <div className="w-full space-y-6 pb-12">
      {/* 1. TOP HEADER BANNER */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#0B121E] via-[#0D1829] to-[#0A101D] border border-blue-900/40 p-5 md:p-7 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start md:items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-blue-600 p-0.5 shadow-lg shadow-emerald-500/20 shrink-0">
              <div className="w-full h-full bg-[#0A0F18] rounded-[14px] flex items-center justify-center">
                <Coins className="w-8 h-8 text-emerald-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-wider font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  HSPD PAYROLL & INCENTIVE SYSTEM
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-300 border border-blue-500/20">
                  v4.3 OPERATIONAL
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-black text-white tracking-wide flex items-center gap-2">
                Kalkulator & Rekapitulasi Bonus Kinerja Petugas
              </h1>
              <p className="text-xs md:text-sm text-gray-300 mt-1 max-w-3xl">
                Sistem otomatisasi perhitungan kompensasi 6 pilar operasional HSPD: <strong className="text-white font-semibold">Kasus Penindakan</strong>, <strong className="text-white font-semibold">Pemasukan Efiden</strong>, <strong className="text-white font-semibold">Pemasukan Tilang</strong>, <strong className="text-white font-semibold">Pemasukan Impound</strong>, <strong className="text-white font-semibold">Sukses Restok Senjata</strong>, dan <strong className="text-white font-semibold">Peleburan Senjata</strong>.
              </p>
            </div>
          </div>

          {/* Action buttons header */}
          <div className="flex items-center gap-2.5 flex-wrap self-end md:self-center">
            {isHighCommand && (
              <button
                type="button"
                id="btn-open-rates-modal"
                onClick={() => setIsRatesModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-2 transition hover:scale-[1.02] shadow-sm"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Atur Tarif HSPD</span>
              </button>
            )}

            <button
              type="button"
              id="btn-open-restock-modal"
              onClick={() => setIsRestockModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-300 text-xs font-semibold flex items-center gap-2 transition hover:scale-[1.02] shadow-sm"
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>+ Catat Restok Senjata</span>
            </button>
          </div>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="relative z-10 mt-6 pt-4 border-t border-gray-800/80 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 bg-[#080D16]/80 p-1 rounded-xl border border-gray-800">
            <button
              type="button"
              onClick={() => setActiveTab('CALCULATOR')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'CALCULATOR'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Kalkulator & Rekapitulasi</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('CLAIMS_HISTORY')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'CLAIMS_HISTORY'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Daftar Klaim & Pencairan ({claims.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ARMORY_RESTOCK')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'ARMORY_RESTOCK'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>Log Restok Persenjataan ({restocks.length})</span>
            </button>
          </div>

          {/* Bank Account Pill of selected officer */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
            <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-gray-400">Rekening Tujuan:</span>
            <span className="font-bold text-emerald-200">{officerBankAccount}</span>
          </div>
        </div>
      </div>

      {/* NOTIFICATION TOAST */}
      {notification && (
        <div className={`p-4 rounded-xl border flex items-center justify-between text-xs animate-in fade-in duration-300 ${
          notification.type === 'success'
            ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
            : notification.type === 'error'
              ? 'bg-rose-950/60 border-rose-500/40 text-rose-200'
              : 'bg-blue-950/60 border-blue-500/40 text-blue-200'
        }`}>
          <div className="flex items-center gap-2.5">
            {notification.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {notification.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            {notification.type === 'info' && <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />}
            <span>{notification.message}</span>
          </div>
          <button 
            type="button"
            onClick={() => setNotification(null)}
            className="text-gray-400 hover:text-white text-xs px-2 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. TAB CONTENT 1: CALCULATOR & REKAPITULASI */}
      {activeTab === 'CALCULATOR' && (
        <div className="space-y-6">
          {/* Controls Bar: Officer Selector, Period, and Calculation Mode */}
          <div className="p-4 md:p-5 rounded-2xl bg-[#0C111C] border border-gray-800 shadow-lg space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Petugas Selector */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                  <span>Pilih Personel / Anggota Roster</span>
                </label>
                <select
                  id="select-officer-bonus"
                  value={selectedBadge}
                  onChange={(e) => setSelectedBadge(e.target.value)}
                  className="w-full bg-[#121927] border border-gray-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium"
                >
                  {roster.map((o) => (
                    <option key={o.badge} value={o.badge}>
                      {o.badge} • {o.name} ({o.rank})
                    </option>
                  ))}
                </select>
              </div>

              {/* Periode Selector */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-teal-400" />
                  <span>Periode Analisis Kinerja</span>
                </label>
                <select
                  id="select-period-bonus"
                  value={periodType}
                  onChange={(e) => setPeriodType(e.target.value as PeriodType)}
                  className="w-full bg-[#121927] border border-gray-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
                >
                  <option value="today">Hari Ini</option>
                  <option value="current_week">Minggu Ini (Current Week)</option>
                  <option value="last_week">Minggu Lalu (Last Week)</option>
                  <option value="current_month">Bulan Ini</option>
                  <option value="all_time">Seluruh Riwayat (All Time)</option>
                  <option value="custom">Rentang Tanggal Kustom</option>
                </select>
              </div>

              {/* Calculation Mode Selector */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Sumber Data Perhitungan</span>
                </label>
                <div className="grid grid-cols-2 gap-1.5 bg-[#121927] p-1 rounded-xl border border-gray-700">
                  <button
                    type="button"
                    onClick={() => setCalcMode('AUTO_DATABASE')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      calcMode === 'AUTO_DATABASE'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Tarik Data Riil</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalcMode('MANUAL_SIMULATOR')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      calcMode === 'MANUAL_SIMULATOR'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Mode Simulator</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Custom Date Range Picker if selected */}
            {periodType === 'custom' && (
              <div className="pt-3 border-t border-gray-800 flex items-center gap-3 flex-wrap">
                <span className="text-xs text-gray-400">Dari:</span>
                <input
                  type="date"
                  value={customStart}
                  onChange={e => setCustomStart(e.target.value)}
                  className="bg-[#121927] border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
                <span className="text-xs text-gray-400">Sampai:</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={e => setCustomEnd(e.target.value)}
                  className="bg-[#121927] border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>
            )}
          </div>

          {/* 3. THE 6 OPERATIONAL BONUS COMPONENT CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* CARD 1: KASUS PENINDAKAN */}
            <div className="rounded-2xl bg-[#0D131F] border border-blue-900/40 p-5 relative overflow-hidden shadow-md hover:border-blue-700/60 transition group">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold text-blue-400 tracking-wider">KOMPONEN 1</span>
                    <h3 className="text-sm font-bold text-white">Kasus Penindakan</h3>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-gray-400 bg-[#121927] px-2 py-0.5 rounded border border-gray-800">
                  {fmtCurrency(rates.arrestCaseRate)} / kasus
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-800/80 flex items-end justify-between">
                <div>
                  <span className="text-[11px] text-gray-400 block mb-0.5">Penanganan Berkas</span>
                  {calcMode === 'AUTO_DATABASE' ? (
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-black text-white font-mono">{effectivePerformance.arrestCasesCount}</span>
                      <span className="text-xs text-gray-400">Kasus</span>
                    </div>
                  ) : (
                    <input
                      type="number"
                      min={0}
                      value={manualArrestCount}
                      onChange={e => setManualArrestCount(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-20 bg-[#141E2F] border border-blue-500/40 rounded px-2 py-1 text-sm font-mono text-white font-bold"
                    />
                  )}
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-gray-400 block mb-0.5">Bonus Diterima</span>
                  <span className="text-lg font-black text-emerald-400 font-mono">
                    {fmtCurrency(breakdown.arrestCasesBonus)}
                  </span>
                </div>
              </div>

              {rawPerformance.arrestDetails.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedDetailCategory('ARREST')}
                  className="mt-3 w-full py-1.5 rounded-lg bg-blue-950/30 hover:bg-blue-900/40 border border-blue-800/30 text-[11px] text-blue-300 font-medium flex items-center justify-center gap-1 transition"
                >
                  <span>Lihat {rawPerformance.arrestDetails.length} Berkas Perkara</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* CARD 2: PEMASUKAN EFIDEN */}
            <div className="rounded-2xl bg-[#0D131F] border border-emerald-900/40 p-5 relative overflow-hidden shadow-md hover:border-emerald-700/60 transition group">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <PackageCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold text-emerald-400 tracking-wider">KOMPONEN 2</span>
                    <h3 className="text-sm font-bold text-white">Pemasukan Efiden</h3>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-gray-400 bg-[#121927] px-2 py-0.5 rounded border border-gray-800">
                  {fmtCurrency(rates.evidenceItemRate)} / item
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-800/80 flex items-end justify-between">
                <div>
                  <span className="text-[11px] text-gray-400 block mb-0.5">Barang Bukti Sitaan</span>
                  {calcMode === 'AUTO_DATABASE' ? (
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-black text-white font-mono">{effectivePerformance.evidenceItemsCount}</span>
                      <span className="text-xs text-gray-400">Item / Foto</span>
                    </div>
                  ) : (
                    <input
                      type="number"
                      min={0}
                      value={manualEvidenceCount}
                      onChange={e => setManualEvidenceCount(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-20 bg-[#141E2F] border border-emerald-500/40 rounded px-2 py-1 text-sm font-mono text-white font-bold"
                    />
                  )}
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-gray-400 block mb-0.5">Bonus Diterima</span>
                  <span className="text-lg font-black text-emerald-400 font-mono">
                    {fmtCurrency(breakdown.evidenceBonus)}
                  </span>
                </div>
              </div>

              <div className="mt-3 py-1.5 px-2.5 rounded-lg bg-emerald-950/20 border border-emerald-900/30 text-[10px] text-emerald-300 flex items-center justify-between">
                <span>Rantai Pengawasan (Chain of Custody)</span>
                <span className="font-bold">Brankas & Lab Terverifikasi</span>
              </div>
            </div>

            {/* CARD 3: PEMASUKAN TILANG */}
            <div className="rounded-2xl bg-[#0D131F] border border-amber-900/40 p-5 relative overflow-hidden shadow-md hover:border-amber-700/60 transition group">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold text-amber-400 tracking-wider">KOMPONEN 3</span>
                    <h3 className="text-sm font-bold text-white">Pemasukan Tilang</h3>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-gray-400 bg-[#121927] px-2 py-0.5 rounded border border-gray-800">
                  {rates.trafficBonusMode === 'PERCENTAGE' ? `${rates.trafficCitationPercentage}% Denda` : `${fmtCurrency(rates.trafficCitationRate)}/tilang`}
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-800/80 flex items-end justify-between">
                <div>
                  <span className="text-[11px] text-gray-400 block mb-0.5">Total Denda Ditagih</span>
                  {calcMode === 'AUTO_DATABASE' ? (
                    <div>
                      <div className="text-lg font-black text-white font-mono">{fmtCurrency(effectivePerformance.citationsTotalFine)}</div>
                      <span className="text-[10px] text-gray-400">({effectivePerformance.citationsCount} Surat Tilang)</span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <input
                        type="number"
                        min={0}
                        placeholder="Denda ($)"
                        value={manualCitationFine}
                        onChange={e => setManualCitationFine(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-24 bg-[#141E2F] border border-amber-500/40 rounded px-2 py-1 text-xs font-mono text-white font-bold"
                      />
                      <input
                        type="number"
                        min={0}
                        placeholder="Qty"
                        value={manualCitationCount}
                        onChange={e => setManualCitationCount(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-16 ml-1 bg-[#141E2F] border border-amber-500/40 rounded px-2 py-1 text-xs font-mono text-white font-bold"
                      />
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-gray-400 block mb-0.5">Bonus Diterima</span>
                  <span className="text-lg font-black text-emerald-400 font-mono">
                    {fmtCurrency(breakdown.citationsBonus)}
                  </span>
                </div>
              </div>

              {rawPerformance.citationDetails.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedDetailCategory('CITATION')}
                  className="mt-3 w-full py-1.5 rounded-lg bg-amber-950/30 hover:bg-amber-900/40 border border-amber-800/30 text-[11px] text-amber-300 font-medium flex items-center justify-center gap-1 transition"
                >
                  <span>Lihat {rawPerformance.citationDetails.length} Rekap Surat Tilang</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* CARD 4: PEMASUKAN IMPOUND */}
            <div className="rounded-2xl bg-[#0D131F] border border-purple-900/40 p-5 relative overflow-hidden shadow-md hover:border-purple-700/60 transition group">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold text-purple-400 tracking-wider">KOMPONEN 4</span>
                    <h3 className="text-sm font-bold text-white">Pemasukan Impound</h3>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-gray-400 bg-[#121927] px-2 py-0.5 rounded border border-gray-800">
                  {rates.impoundBonusMode === 'PERCENTAGE' ? `${rates.impoundPercentage}% Biaya` : `${fmtCurrency(rates.impoundRate)}/unit`}
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-800/80 flex items-end justify-between">
                <div>
                  <span className="text-[11px] text-gray-400 block mb-0.5">Total Biaya Sitaan</span>
                  {calcMode === 'AUTO_DATABASE' ? (
                    <div>
                      <div className="text-lg font-black text-white font-mono">{fmtCurrency(effectivePerformance.impoundsTotalFee)}</div>
                      <span className="text-[10px] text-gray-400">({effectivePerformance.impoundsCount} Kendaraan)</span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <input
                        type="number"
                        min={0}
                        placeholder="Fee ($)"
                        value={manualImpoundFee}
                        onChange={e => setManualImpoundFee(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-24 bg-[#141E2F] border border-purple-500/40 rounded px-2 py-1 text-xs font-mono text-white font-bold"
                      />
                      <input
                        type="number"
                        min={0}
                        placeholder="Qty"
                        value={manualImpoundCount}
                        onChange={e => setManualImpoundCount(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-16 ml-1 bg-[#141E2F] border border-purple-500/40 rounded px-2 py-1 text-xs font-mono text-white font-bold"
                      />
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-gray-400 block mb-0.5">Bonus Diterima</span>
                  <span className="text-lg font-black text-emerald-400 font-mono">
                    {fmtCurrency(breakdown.impoundsBonus)}
                  </span>
                </div>
              </div>

              {rawPerformance.impoundDetails.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedDetailCategory('IMPOUND')}
                  className="mt-3 w-full py-1.5 rounded-lg bg-purple-950/30 hover:bg-purple-900/40 border border-purple-800/30 text-[11px] text-purple-300 font-medium flex items-center justify-center gap-1 transition"
                >
                  <span>Lihat {rawPerformance.impoundDetails.length} Kendaraan Impound</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* CARD 5: SUKSES RESTOK PERSENJATAAN */}
            <div className="rounded-2xl bg-[#0D131F] border border-teal-900/40 p-5 relative overflow-hidden shadow-md hover:border-teal-700/60 transition group">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                    <Boxes className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold text-teal-400 tracking-wider">KOMPONEN 5</span>
                    <h3 className="text-sm font-bold text-white">Sukses Restok Senjata</h3>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-gray-400 bg-[#121927] px-2 py-0.5 rounded border border-gray-800">
                  {fmtCurrency(rates.weaponRestockSuccessRate)} / misi
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-800/80 flex items-end justify-between">
                <div>
                  <span className="text-[11px] text-gray-400 block mb-0.5">Operasi Logistik Sukses</span>
                  {calcMode === 'AUTO_DATABASE' ? (
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-black text-white font-mono">{effectivePerformance.weaponRestocksCount}</span>
                      <span className="text-xs text-gray-400">Restok Terverifikasi</span>
                    </div>
                  ) : (
                    <input
                      type="number"
                      min={0}
                      value={manualRestockCount}
                      onChange={e => setManualRestockCount(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-20 bg-[#141E2F] border border-teal-500/40 rounded px-2 py-1 text-sm font-mono text-white font-bold"
                    />
                  )}
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-gray-400 block mb-0.5">Bonus Diterima</span>
                  <span className="text-lg font-black text-emerald-400 font-mono">
                    {fmtCurrency(breakdown.weaponRestocksBonus)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsRestockModalOpen(true)}
                className="mt-3 w-full py-1.5 rounded-lg bg-teal-950/30 hover:bg-teal-900/40 border border-teal-800/30 text-[11px] text-teal-300 font-medium flex items-center justify-center gap-1 transition"
              >
                <span>+ Catat Restok Senjata Baru</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {/* CARD 6: PELEBURAN SENJATA */}
            <div className="rounded-2xl bg-[#0D131F] border border-rose-900/40 p-5 relative overflow-hidden shadow-md hover:border-rose-700/60 transition group">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                    <Flame className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold text-rose-400 tracking-wider">KOMPONEN 6</span>
                    <h3 className="text-sm font-bold text-white">Peleburan Senjata</h3>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-gray-400 bg-[#121927] px-2 py-0.5 rounded border border-gray-800">
                  {fmtCurrency(rates.weaponSmeltingRate)} / pucuk
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-800/80 flex items-end justify-between">
                <div>
                  <span className="text-[11px] text-gray-400 block mb-0.5">Senpi Ilegal Dilebur</span>
                  {calcMode === 'AUTO_DATABASE' ? (
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-black text-white font-mono">{effectivePerformance.weaponSmeltingsCount}</span>
                      <span className="text-xs text-gray-400">Pucuk Senjata</span>
                    </div>
                  ) : (
                    <input
                      type="number"
                      min={0}
                      value={manualSmeltingCount}
                      onChange={e => setManualSmeltingCount(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-20 bg-[#141E2F] border border-rose-500/40 rounded px-2 py-1 text-sm font-mono text-white font-bold"
                    />
                  )}
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-gray-400 block mb-0.5">Bonus Diterima</span>
                  <span className="text-lg font-black text-emerald-400 font-mono">
                    {fmtCurrency(breakdown.weaponSmeltingsBonus)}
                  </span>
                </div>
              </div>

              {rawPerformance.smeltingDetails.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedDetailCategory('SMELTING')}
                  className="mt-3 w-full py-1.5 rounded-lg bg-rose-950/30 hover:bg-rose-900/40 border border-rose-800/30 text-[11px] text-rose-300 font-medium flex items-center justify-center gap-1 transition"
                >
                  <span>Lihat {rawPerformance.smeltingDetails.length} Senpi Dilebur</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* 4. GRAND TOTAL SUMMARY & SUBMISSION BAR */}
          <div className="rounded-2xl bg-gradient-to-r from-[#0C1628] via-[#0E1F30] to-[#0A1724] border-2 border-emerald-500/40 p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    REKAPITULASI RESMI
                  </span>
                  <span className="text-xs text-gray-400">• Periode: <strong className="text-gray-200">{periodLabel}</strong></span>
                </div>
                <div className="text-sm font-bold text-gray-200">
                  Penerima: <span className="text-white font-extrabold">{officerDisplayName}</span> ({selectedBadge}) • {officerDisplayRank}
                </div>
                <div className="text-xs text-emerald-300 font-mono flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Transfer ke Rekening Bank Dinas:</span>
                  <span className="font-bold underline text-white">{officerBankAccount}</span>
                </div>
              </div>

              {/* Total Values */}
              <div className="flex items-center gap-6 flex-wrap">
                <div className="text-right">
                  <span className="text-xs text-gray-400 block">Total Gross Bonus</span>
                  <span className="text-lg font-mono font-bold text-gray-300">{fmtCurrency(totalGrossBonus)}</span>
                </div>

                {deductions > 0 && (
                  <div className="text-right">
                    <span className="text-xs text-rose-400 block">Potongan Kas ({rates.departmentTaxPercentage}%)</span>
                    <span className="text-lg font-mono font-bold text-rose-400">-{fmtCurrency(deductions)}</span>
                  </div>
                )}

                <div className="px-5 py-3 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-right shadow-inner">
                  <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider block">Total Net Bonus Cair</span>
                  <span className="text-2xl md:text-3xl font-black font-mono text-emerald-400">
                    {fmtCurrency(totalNetBonus)}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Actions Button Group */}
            <div className="mt-6 pt-5 border-t border-gray-800/80 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  id="btn-preview-slip"
                  onClick={() => handleOpenSlip()}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/30 transition hover:scale-[1.02]"
                >
                  <Receipt className="w-4 h-4" />
                  <span>Lihat & Ekspor Slip Resmi</span>
                </button>

                <button
                  type="button"
                  id="btn-copy-discord-slip"
                  onClick={() => handleCopyDiscordSlip(currentCalculatedClaim)}
                  className="px-3.5 py-2.5 rounded-xl bg-[#131F33] hover:bg-[#1A2A44] border border-blue-500/30 text-blue-300 text-xs font-bold flex items-center gap-2 transition hover:scale-[1.02]"
                >
                  {copyFeedback ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copyFeedback ? 'Tersalin!' : 'Salin Format Discord'}</span>
                </button>

                <button
                  type="button"
                  id="btn-send-discord-claim"
                  disabled={isSendingDiscord}
                  onClick={() => handleSendToDiscordWebhook(currentCalculatedClaim)}
                  className="px-3.5 py-2.5 rounded-xl bg-[#131F33] hover:bg-[#1A2A44] border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2 transition hover:scale-[1.02]"
                >
                  <Send className={`w-4 h-4 ${isSendingDiscord ? 'animate-spin' : ''}`} />
                  <span>Kirim ke Discord</span>
                </button>
              </div>

              <button
                type="button"
                id="btn-submit-bonus-claim"
                onClick={handleSubmitClaim}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black tracking-wider uppercase flex items-center gap-2 shadow-xl shadow-emerald-600/30 transition hover:scale-[1.02]"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isHighCommand ? 'Setujui & Catat Klaim' : 'Ajukan Klaim Bonus Resmi'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. TAB CONTENT 2: CLAIMS HISTORY & PAYROLL REGISTER */}
      {activeTab === 'CLAIMS_HISTORY' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[#0D131F] border border-gray-800 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-400" />
                <span>Daftar Pengajuan & Riwayat Pembayaran Bonus ({claims.length})</span>
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Pengarsipan status verifikasi dan pencairan bonus ke rekening dinas anggota kepolisian.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('CALCULATOR')}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Hitung Bonus Baru</span>
            </button>
          </div>

          {claims.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[#0C111C] border border-gray-800 text-gray-400">
              <Coins className="w-12 h-12 mx-auto text-gray-600 mb-3" />
              <p className="text-sm font-medium">Belum ada berkas klaim bonus yang tersimpan.</p>
              <p className="text-xs text-gray-500 mt-1">Gunakan tab Kalkulator untuk menghitung dan mengajukan bonus operasional.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {claims.map((claim) => {
                const b = claim.breakdown;
                const statusStyles: Record<OfficerBonusClaimStatus, string> = {
                  DRAFT: 'bg-gray-800 text-gray-300 border-gray-700',
                  PENDING_APPROVAL: 'bg-amber-950/60 text-amber-300 border-amber-600/40',
                  APPROVED: 'bg-emerald-950/60 text-emerald-300 border-emerald-600/40',
                  DISBURSED_PAID: 'bg-cyan-950/60 text-cyan-300 border-cyan-600/40',
                  REJECTED: 'bg-rose-950/60 text-rose-300 border-rose-600/40'
                };

                return (
                  <div 
                    key={claim.id}
                    className="p-4 md:p-5 rounded-2xl bg-[#0C121D] border border-gray-800 hover:border-gray-700 transition shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-blue-400">{claim.claimNumber}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${statusStyles[claim.status] || ''}`}>
                          {claim.status.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs text-gray-500">• {new Date(claim.submittedAt).toLocaleDateString('id-ID')}</span>
                      </div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>{claim.officerName} ({claim.officerBadge})</span>
                        <span className="text-xs font-normal text-gray-400">• {claim.officerRank} • {claim.officerDivision}</span>
                      </h4>
                      <div className="text-xs text-gray-400 flex items-center gap-3 flex-wrap">
                        <span>Periode: <strong className="text-gray-300">{claim.periodLabel}</strong></span>
                        <span>Rekening: <strong className="text-emerald-300 font-mono">{claim.bankAccountNumber}</strong></span>
                        {claim.approvedBy && <span>Disetujui: <strong className="text-blue-300">{claim.approvedBy}</strong></span>}
                      </div>
                    </div>

                    {/* Breakdown mini badges */}
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-center text-[10px] font-mono">
                      <div className="bg-[#121927] p-1.5 rounded border border-gray-800">
                        <span className="text-gray-500 block">Kasus</span>
                        <span className="text-blue-400 font-bold">{b.arrestCasesCount}x</span>
                      </div>
                      <div className="bg-[#121927] p-1.5 rounded border border-gray-800">
                        <span className="text-gray-500 block">Efiden</span>
                        <span className="text-emerald-400 font-bold">{b.evidenceCount}x</span>
                      </div>
                      <div className="bg-[#121927] p-1.5 rounded border border-gray-800">
                        <span className="text-gray-500 block">Tilang</span>
                        <span className="text-amber-400 font-bold">{b.citationsCount}x</span>
                      </div>
                      <div className="bg-[#121927] p-1.5 rounded border border-gray-800">
                        <span className="text-gray-500 block">Impound</span>
                        <span className="text-purple-400 font-bold">{b.impoundsCount}x</span>
                      </div>
                      <div className="bg-[#121927] p-1.5 rounded border border-gray-800">
                        <span className="text-gray-500 block">Restok</span>
                        <span className="text-teal-400 font-bold">{b.weaponRestocksCount}x</span>
                      </div>
                      <div className="bg-[#121927] p-1.5 rounded border border-gray-800">
                        <span className="text-gray-500 block">Lebur</span>
                        <span className="text-rose-400 font-bold">{b.weaponSmeltingsCount}x</span>
                      </div>
                    </div>

                    {/* Net Total & Action Buttons */}
                    <div className="flex items-center gap-3 justify-between lg:justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-gray-800">
                      <div className="text-left lg:text-right">
                        <span className="text-[10px] text-gray-500 block">Net Bonus</span>
                        <span className="text-base font-black text-emerald-400 font-mono">
                          {fmtCurrency(claim.totalNetBonus)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenSlip(claim)}
                          title="Lihat Slip Dokumen"
                          className="p-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 transition"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopyDiscordSlip(claim)}
                          title="Salin Teks Discord"
                          className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        {isHighCommand && claim.status === 'PENDING_APPROVAL' && (
                          <button
                            type="button"
                            onClick={() => {
                              updateBonusClaimStatus(claim.id, 'APPROVED', currentOfficer?.name || 'Chief of Police');
                              setNotification({ type: 'success', message: `✅ Klaim ${claim.claimNumber} disetujui!` });
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition"
                          >
                            Setujui
                          </button>
                        )}

                        {isHighCommand && claim.status === 'APPROVED' && (
                          <button
                            type="button"
                            onClick={() => {
                              updateBonusClaimStatus(claim.id, 'DISBURSED_PAID', currentOfficer?.name || 'Chief of Police');
                              setNotification({ type: 'success', message: `💸 Klaim ${claim.claimNumber} ditandai telah dicairkan ke rekening!` });
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition"
                          >
                            Cairkan
                          </button>
                        )}

                        {isHighCommand && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Hapus berkas klaim ${claim.claimNumber}?`)) {
                                deleteBonusClaim(claim.id);
                              }
                            }}
                            title="Hapus Klaim"
                            className="p-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-800/40 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 2. TAB CONTENT 3: ARMORY RESTOCK RECORDS */}
      {activeTab === 'ARMORY_RESTOCK' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[#0D131F] border border-gray-800 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Boxes className="w-4 h-4 text-teal-400" />
                <span>Pencatatan Berita Acara Sukses Perestokan Persenjataan ({restocks.length})</span>
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Setiap operasi perestokan senjata, amunisi, dan perlengkapan dinas yang sukses diverifikasi berhak mendapatkan insentif {fmtCurrency(rates.weaponRestockSuccessRate)} / operasi.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsRestockModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-md shadow-teal-600/30"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Catat Restok Senjata Baru</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {restocks.map((res) => (
              <div 
                key={res.id}
                className="p-5 rounded-2xl bg-[#0C121D] border border-gray-800 hover:border-teal-800/50 transition shadow-md space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono text-teal-400 font-bold block">{res.restockNumber}</span>
                    <h3 className="text-sm font-bold text-white mt-0.5">{res.armoryLocation}</h3>
                    <p className="text-xs text-gray-400">Sumber: {res.supplierSource}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-950 text-teal-300 border border-teal-600/40">
                    SUKSES VERIFIED
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#121927] border border-gray-800/80 space-y-1.5 text-xs">
                  <div className="text-gray-300 font-semibold mb-1">Rincian Barang yang Direstok:</div>
                  {res.weaponsRestocked.map((w, idx) => (
                    <div key={idx} className="flex items-center justify-between text-gray-400 text-[11px] font-mono">
                      <span>• {w.name}</span>
                      <span className="text-teal-300 font-bold">{w.quantity} Unit</span>
                    </div>
                  ))}
                  <div className="pt-2 mt-2 border-t border-gray-800 flex items-center justify-between font-mono text-xs">
                    <span className="text-gray-400">Amunisi Ditambah:</span>
                    <span className="text-emerald-400 font-bold">{res.ammoRoundsCount.toLocaleString()} Butir</span>
                  </div>
                </div>

                <div className="text-xs text-gray-400 flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-gray-800/60">
                  <div>
                    Petugas: <strong className="text-gray-200">{res.officerName} ({res.officerBadge})</strong>
                  </div>
                  <div className="text-gray-500 font-mono text-[11px]">
                    {res.date}
                  </div>
                </div>

                {isHighCommand && (
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Hapus berita acara restok ${res.restockNumber}?`)) {
                          deleteArmoryRestock(res.id);
                        }
                      }}
                      className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Hapus Catatan</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. MODAL SLIP BONUS RESMI & EKSPOR GAMBAR (PNG / JPEG)  */}
      {/* ======================================================== */}
      {isSlipModalOpen && activeClaimSlip && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 overflow-y-auto">
          <div className="w-full max-w-3xl bg-[#080D15] rounded-3xl border border-gray-700 shadow-2xl overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="bg-[#0D1420] border-b border-gray-800 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Slip Bukti Rekapitulasi Bonus Resmi HSPD</h3>
                  <span className="text-[11px] font-mono text-gray-400">{activeClaimSlip.claimNumber}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSlipModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            {/* PRINT / EXPORT CANVAS SHEET */}
            <div className="p-6 overflow-x-auto">
              <div 
                id="hspd-bonus-slip-render"
                className="bg-[#0A0E17] border-2 border-[#1E293B] rounded-2xl p-6 md:p-8 text-white max-w-2xl mx-auto shadow-2xl relative overflow-hidden font-sans"
              >
                {/* Background Watermark */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
                  <img src={HSPD_LOGO_URL} alt="Watermark" className="w-[450px] h-[450px] object-contain" />
                </div>

                {/* Slip Header */}
                <div className="relative z-10 flex items-center justify-between border-b-2 border-emerald-500/40 pb-5">
                  <div className="flex items-center gap-3.5">
                    <img src={HSPD_LOGO_URL} alt="HSPD Seal" className="w-14 h-14 object-contain shrink-0" />
                    <div>
                      <h4 className="text-base font-black text-white tracking-wider uppercase">LOS SANTOS POLICE DEPARTMENT</h4>
                      <p className="text-[11px] font-mono text-emerald-400 font-bold">CENTRAL HEADQUARTERS • COMPENSATION & REWARD BUREAU</p>
                      <p className="text-[10px] text-gray-400">Berita Acara Pembayaran Insentif & Kompensasi Operasional</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-gray-400 block">NOMOR DOKUMEN:</span>
                    <span className="text-xs font-mono font-bold text-white bg-gray-900 px-2.5 py-1 rounded border border-gray-700">
                      {activeClaimSlip.claimNumber}
                    </span>
                  </div>
                </div>

                {/* Officer & Period Info Box */}
                <div className="relative z-10 grid grid-cols-2 gap-4 mt-5 p-4 rounded-xl bg-[#111726]/80 border border-gray-800 text-xs">
                  <div>
                    <span className="text-[10px] font-mono text-gray-400 block mb-0.5">IDENTITAS ANGGOTA POLISI</span>
                    <div className="font-bold text-sm text-white">{activeClaimSlip.officerName}</div>
                    <div className="text-gray-300 font-mono text-[11px]">Badge: {activeClaimSlip.officerBadge} • {activeClaimSlip.officerRank}</div>
                    <div className="text-gray-400 text-[11px] mt-0.5">Divisi: {activeClaimSlip.officerDivision}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-gray-400 block mb-0.5">PERIODE KINERJA & PENCAIRAN</span>
                    <div className="font-bold text-sm text-emerald-300">{activeClaimSlip.periodLabel}</div>
                    <div className="text-gray-300 font-mono text-[11px] mt-0.5">
                      No. Rekening Bank: <span className="font-bold text-white underline">{activeClaimSlip.bankAccountNumber}</span>
                    </div>
                    <div className="text-gray-400 text-[11px] mt-0.5">
                      Status: <strong className="text-teal-300 font-mono">{activeClaimSlip.status.replace(/_/g, ' ')}</strong>
                    </div>
                  </div>
                </div>

                {/* The 6 Items Table */}
                <div className="relative z-10 mt-5">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-gray-700 text-gray-400 font-mono text-[10px] uppercase">
                        <th className="py-2 px-2">No</th>
                        <th className="py-2 px-3">Komponen Kinerja</th>
                        <th className="py-2 px-3 text-center">Realisasi</th>
                        <th className="py-2 px-3 text-right">Nominal Bonus</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/80 font-mono text-xs">
                      <tr>
                        <td className="py-2.5 px-2 text-gray-500">1</td>
                        <td className="py-2.5 px-3">
                          <strong className="text-white">Kasus Penindakan</strong>
                          <span className="text-[10px] text-gray-400 block">Penanganan berkas perkara tersangka</span>
                        </td>
                        <td className="py-2.5 px-3 text-center text-gray-300">{activeClaimSlip.breakdown.arrestCasesCount} Kasus</td>
                        <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">{fmtCurrency(activeClaimSlip.breakdown.arrestCasesBonus)}</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-2 text-gray-500">2</td>
                        <td className="py-2.5 px-3">
                          <strong className="text-white">Pemasukan Efiden / Barang Bukti</strong>
                          <span className="text-[10px] text-gray-400 block">Penyerahan fisik ke brankas bukti & lab forensik</span>
                        </td>
                        <td className="py-2.5 px-3 text-center text-gray-300">{activeClaimSlip.breakdown.evidenceCount} Item/Foto</td>
                        <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">{fmtCurrency(activeClaimSlip.breakdown.evidenceBonus)}</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-2 text-gray-500">3</td>
                        <td className="py-2.5 px-3">
                          <strong className="text-white">Pemasukan Tilang</strong>
                          <span className="text-[10px] text-gray-400 block">Denda ditagih: {fmtCurrency(activeClaimSlip.breakdown.citationsTotalFine)}</span>
                        </td>
                        <td className="py-2.5 px-3 text-center text-gray-300">{activeClaimSlip.breakdown.citationsCount} Tilang</td>
                        <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">{fmtCurrency(activeClaimSlip.breakdown.citationsBonus)}</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-2 text-gray-500">4</td>
                        <td className="py-2.5 px-3">
                          <strong className="text-white">Pemasukan Impound Kendaraan</strong>
                          <span className="text-[10px] text-gray-400 block">Biaya impound sitaan: {fmtCurrency(activeClaimSlip.breakdown.impoundsTotalFee)}</span>
                        </td>
                        <td className="py-2.5 px-3 text-center text-gray-300">{activeClaimSlip.breakdown.impoundsCount} Unit</td>
                        <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">{fmtCurrency(activeClaimSlip.breakdown.impoundsBonus)}</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-2 text-gray-500">5</td>
                        <td className="py-2.5 px-3">
                          <strong className="text-white">Sukses Perestokan Persenjataan</strong>
                          <span className="text-[10px] text-gray-400 block">Pengawalan logistik senjata & amunisi armory</span>
                        </td>
                        <td className="py-2.5 px-3 text-center text-gray-300">{activeClaimSlip.breakdown.weaponRestocksCount} Operasi</td>
                        <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">{fmtCurrency(activeClaimSlip.breakdown.weaponRestocksBonus)}</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-2 text-gray-500">6</td>
                        <td className="py-2.5 px-3">
                          <strong className="text-white">Peleburan Senjata ke Tungku Smelter</strong>
                          <span className="text-[10px] text-gray-400 block">Pemusnahan resmi senpi ilegal & rakitan</span>
                        </td>
                        <td className="py-2.5 px-3 text-center text-gray-300">{activeClaimSlip.breakdown.weaponSmeltingsCount} Pucuk</td>
                        <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">{fmtCurrency(activeClaimSlip.breakdown.weaponSmeltingsBonus)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Grand Total Row */}
                <div className="relative z-10 mt-5 pt-4 border-t-2 border-gray-700 space-y-1.5 font-mono text-xs">
                  <div className="flex justify-between text-gray-400">
                    <span>Subtotal Gross Bonus Operasional:</span>
                    <span className="text-white font-bold">{fmtCurrency(activeClaimSlip.totalGrossBonus)}</span>
                  </div>
                  {activeClaimSlip.deductions > 0 && (
                    <div className="flex justify-between text-rose-400">
                      <span>Potongan Kas Dinas HSPD:</span>
                      <span>-{fmtCurrency(activeClaimSlip.deductions)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-sm font-bold bg-[#101A29] p-3 rounded-xl border border-emerald-500/40 text-emerald-400">
                    <span className="uppercase tracking-wider">TOTAL NET BONUS DICAIRKAN:</span>
                    <span className="text-xl font-black text-emerald-300">{fmtCurrency(activeClaimSlip.totalNetBonus)}</span>
                  </div>
                </div>

                {/* Signatures & Approvals */}
                <div className="relative z-10 grid grid-cols-2 gap-8 mt-8 pt-4 border-t border-gray-800 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-gray-400 block mb-8">Penerima Insentif:</span>
                    <div className="font-bold text-white border-b border-gray-600 pb-1 max-w-[180px] mx-auto">{activeClaimSlip.officerName}</div>
                    <span className="text-[10px] text-gray-400 font-mono">Badge: {activeClaimSlip.officerBadge}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block mb-8">Diverifikasi & Disetujui:</span>
                    <div className="font-bold text-emerald-400 border-b border-emerald-600 pb-1 max-w-[180px] mx-auto">
                      {activeClaimSlip.approvedBy || 'HIGH COMMAND HSPD'}
                    </div>
                    <span className="text-[10px] text-gray-400 font-mono">Chief of Police / Board</span>
                  </div>
                </div>

                {/* Footer seal notice */}
                <div className="relative z-10 text-center mt-6 pt-3 border-t border-gray-800/60 text-[9px] text-gray-500 font-mono">
                  DOKUMEN RESMI DEPARTEMEN KEPOLISIAN LOS SANTOS • DILINDUNGI HUKUM NEGARA • HAK KEPEMILIKAN HSPD
                </div>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="bg-[#0D1420] border-t border-gray-800 px-6 py-4 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="btn-download-slip-png"
                  disabled={Boolean(isExportingImage)}
                  onClick={() => handleExportSlipImage('png')}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 transition disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isExportingImage === 'png' ? 'Memproses PNG...' : 'Download PNG'}</span>
                </button>

                <button
                  type="button"
                  id="btn-download-slip-jpg"
                  disabled={Boolean(isExportingImage)}
                  onClick={() => handleExportSlipImage('jpeg')}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 transition disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isExportingImage === 'jpeg' ? 'Memproses JPG...' : 'Download JPG'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopyDiscordSlip(activeClaimSlip)}
                  className="px-3.5 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold flex items-center gap-2 transition"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Discord</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsSlipModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. MODAL FORM: CATAT RESTOK PERSENJATAAN BARU           */}
      {/* ======================================================== */}
      {isRestockModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 overflow-y-auto">
          <div className="w-full max-w-xl bg-[#090E17] rounded-3xl border border-teal-500/40 shadow-2xl overflow-hidden my-auto">
            <div className="bg-[#0E1724] border-b border-gray-800 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                  <Boxes className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Catat Berita Acara Sukses Restok Senjata</h3>
                  <p className="text-[11px] text-gray-400">Pengawalan & Register Logistik Armory HSPD</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRestockModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNewRestock} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 font-medium mb-1">Petugas Pelaksana</label>
                  <input
                    type="text"
                    disabled
                    value={`${officerDisplayName} (${selectedBadge})`}
                    className="w-full bg-[#121927] border border-gray-700 rounded-xl px-3 py-2 text-white font-medium"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 font-medium mb-1">Saksi Supervisor / Atasan</label>
                  <input
                    type="text"
                    required
                    value={restockWitness}
                    onChange={e => setRestockWitness(e.target.value)}
                    className="w-full bg-[#121927] border border-gray-700 rounded-xl px-3 py-2 text-white font-medium focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 font-medium mb-1">Lokasi Armory Penerima</label>
                <input
                  type="text"
                  required
                  value={restockLoc}
                  onChange={e => setRestockLoc(e.target.value)}
                  className="w-full bg-[#121927] border border-gray-700 rounded-xl px-3 py-2 text-white font-medium focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-gray-400 font-medium mb-1">Depot / Sumber Suplai</label>
                <input
                  type="text"
                  required
                  value={restockSupplier}
                  onChange={e => setRestockSupplier(e.target.value)}
                  className="w-full bg-[#121927] border border-gray-700 rounded-xl px-3 py-2 text-white font-medium focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-gray-400 font-medium mb-1">Daftar Senjata & Taktis (Pisahkan per baris)</label>
                <textarea
                  rows={3}
                  required
                  value={restockWeaponsList}
                  onChange={e => setRestockWeaponsList(e.target.value)}
                  placeholder="Glock 19 Gen 5 (10 Unit)&#10;Remington 870 Shotgun (4 Unit)"
                  className="w-full bg-[#121927] border border-gray-700 rounded-xl px-3 py-2 text-white font-mono text-[11px] focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 font-medium mb-1">Total Amunisi (Butir)</label>
                  <input
                    type="number"
                    min={0}
                    value={restockAmmoCount}
                    onChange={e => setRestockAmmoCount(parseInt(e.target.value) || 0)}
                    className="w-full bg-[#121927] border border-gray-700 rounded-xl px-3 py-2 text-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 font-medium mb-1">Rompi / Taktis (Unit)</label>
                  <input
                    type="number"
                    min={0}
                    value={restockGearCount}
                    onChange={e => setRestockGearCount(parseInt(e.target.value) || 0)}
                    className="w-full bg-[#121927] border border-gray-700 rounded-xl px-3 py-2 text-white font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 font-medium mb-1">Foto Bukti / Dokumentasi Restok (URL Image)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={restockProofUrl}
                  onChange={e => setRestockProofUrl(e.target.value)}
                  className="w-full bg-[#121927] border border-gray-700 rounded-xl px-3 py-2 text-white font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-gray-400 font-medium mb-1">Catatan Berita Acara</label>
                <textarea
                  rows={2}
                  value={restockNotes}
                  onChange={e => setRestockNotes(e.target.value)}
                  className="w-full bg-[#121927] border border-gray-700 rounded-xl px-3 py-2 text-white text-xs"
                />
              </div>

              <div className="pt-4 border-t border-gray-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsRestockModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-teal-600/30"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan & Sahkan Restok Senjata</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. MODAL PENGATURAN TARIF BONUS STANDAR HSPD (HIGH COMMAND) */}
      {/* ======================================================== */}
      {isRatesModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 overflow-y-auto">
          <div className="w-full max-w-xl bg-[#090E17] rounded-3xl border border-amber-500/40 shadow-2xl overflow-hidden my-auto">
            <div className="bg-[#0E1724] border-b border-gray-800 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Konfigurasi Tarif Bonus Operasional HSPD</h3>
                  <p className="text-[11px] text-gray-400">Otoritas Komando & Keputusan Kepala Kepolisian</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRatesModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              {/* 1. Kasus Penindakan Rate */}
              <div>
                <label className="block text-gray-300 font-bold mb-1">
                  1. Bonus Kasus Penindakan ($ / Kasus Tersangka)
                </label>
                <input
                  type="number"
                  min={0}
                  value={rates.arrestCaseRate}
                  onChange={e => setRates({ ...rates, arrestCaseRate: Math.max(0, parseInt(e.target.value) || 0) })}
                  className="w-full bg-[#121927] border border-gray-700 rounded-xl px-3 py-2 text-white font-mono font-bold"
                />
              </div>

              {/* 2. Efiden Rate */}
              <div>
                <label className="block text-gray-300 font-bold mb-1">
                  2. Bonus Pemasukan Efiden / Barang Bukti ($ / Item / Batch)
                </label>
                <input
                  type="number"
                  min={0}
                  value={rates.evidenceItemRate}
                  onChange={e => setRates({ ...rates, evidenceItemRate: Math.max(0, parseInt(e.target.value) || 0) })}
                  className="w-full bg-[#121927] border border-gray-700 rounded-xl px-3 py-2 text-white font-mono font-bold"
                />
              </div>

              {/* 3. Tilang Rate & Mode */}
              <div className="p-3 rounded-xl bg-[#121927] border border-gray-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-gray-300 font-bold">3. Skema Bonus Tilang</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setRates({ ...rates, trafficBonusMode: 'PERCENTAGE' })}
                      className={`px-2 py-1 rounded text-[10px] font-bold ${rates.trafficBonusMode === 'PERCENTAGE' ? 'bg-amber-600 text-white' : 'bg-gray-800 text-gray-400'}`}
                    >
                      Persentase (% Denda)
                    </button>
                    <button
                      type="button"
                      onClick={() => setRates({ ...rates, trafficBonusMode: 'FLAT' })}
                      className={`px-2 py-1 rounded text-[10px] font-bold ${rates.trafficBonusMode === 'FLAT' ? 'bg-amber-600 text-white' : 'bg-gray-800 text-gray-400'}`}
                    >
                      Flat Rate ($/Surat)
                    </button>
                  </div>
                </div>

                {rates.trafficBonusMode === 'PERCENTAGE' ? (
                  <div>
                    <span className="text-gray-400 text-[11px] block mb-1">Persentase Komisi dari Denda Tilang (%)</span>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={rates.trafficCitationPercentage}
                      onChange={e => setRates({ ...rates, trafficCitationPercentage: Math.max(1, parseInt(e.target.value) || 1) })}
                      className="w-full bg-[#0C121D] border border-gray-700 rounded-xl px-3 py-2 text-white font-mono font-bold"
                    />
                  </div>
                ) : (
                  <div>
                    <span className="text-gray-400 text-[11px] block mb-1">Nominal Flat per Surat Tilang ($)</span>
                    <input
                      type="number"
                      min={0}
                      value={rates.trafficCitationRate}
                      onChange={e => setRates({ ...rates, trafficCitationRate: Math.max(0, parseInt(e.target.value) || 0) })}
                      className="w-full bg-[#0C121D] border border-gray-700 rounded-xl px-3 py-2 text-white font-mono font-bold"
                    />
                  </div>
                )}
              </div>

              {/* 4. Impound Rate & Mode */}
              <div className="p-3 rounded-xl bg-[#121927] border border-gray-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-gray-300 font-bold">4. Skema Bonus Impound Kendaraan</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setRates({ ...rates, impoundBonusMode: 'PERCENTAGE' })}
                      className={`px-2 py-1 rounded text-[10px] font-bold ${rates.impoundBonusMode === 'PERCENTAGE' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400'}`}
                    >
                      Persentase (% Biaya)
                    </button>
                    <button
                      type="button"
                      onClick={() => setRates({ ...rates, impoundBonusMode: 'FLAT' })}
                      className={`px-2 py-1 rounded text-[10px] font-bold ${rates.impoundBonusMode === 'FLAT' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400'}`}
                    >
                      Flat Rate ($/Unit)
                    </button>
                  </div>
                </div>

                {rates.impoundBonusMode === 'PERCENTAGE' ? (
                  <div>
                    <span className="text-gray-400 text-[11px] block mb-1">Persentase Komisi dari Biaya Derek Impound (%)</span>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={rates.impoundPercentage}
                      onChange={e => setRates({ ...rates, impoundPercentage: Math.max(1, parseInt(e.target.value) || 1) })}
                      className="w-full bg-[#0C121D] border border-gray-700 rounded-xl px-3 py-2 text-white font-mono font-bold"
                    />
                  </div>
                ) : (
                  <div>
                    <span className="text-gray-400 text-[11px] block mb-1">Nominal Flat per Kendaraan Impound ($)</span>
                    <input
                      type="number"
                      min={0}
                      value={rates.impoundRate}
                      onChange={e => setRates({ ...rates, impoundRate: Math.max(0, parseInt(e.target.value) || 0) })}
                      className="w-full bg-[#0C121D] border border-gray-700 rounded-xl px-3 py-2 text-white font-mono font-bold"
                    />
                  </div>
                )}
              </div>

              {/* 5. Restok Senjata Rate */}
              <div>
                <label className="block text-gray-300 font-bold mb-1">
                  5. Bonus Sukses Perestokan Persenjataan ($ / Misi Restok Sukses)
                </label>
                <input
                  type="number"
                  min={0}
                  value={rates.weaponRestockSuccessRate}
                  onChange={e => setRates({ ...rates, weaponRestockSuccessRate: Math.max(0, parseInt(e.target.value) || 0) })}
                  className="w-full bg-[#121927] border border-gray-700 rounded-xl px-3 py-2 text-white font-mono font-bold"
                />
              </div>

              {/* 6. Peleburan Senjata Rate */}
              <div>
                <label className="block text-gray-300 font-bold mb-1">
                  6. Bonus Peleburan Senjata Sitaan ($ / Pucuk Senjata ke Tungku Smelter)
                </label>
                <input
                  type="number"
                  min={0}
                  value={rates.weaponSmeltingRate}
                  onChange={e => setRates({ ...rates, weaponSmeltingRate: Math.max(0, parseInt(e.target.value) || 0) })}
                  className="w-full bg-[#121927] border border-gray-700 rounded-xl px-3 py-2 text-white font-mono font-bold"
                />
              </div>

              {/* Potongan Kas Dinas */}
              <div>
                <label className="block text-gray-300 font-bold mb-1">
                  Potongan Kas Dinas HSPD / Retribusi (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={rates.departmentTaxPercentage}
                  onChange={e => setRates({ ...rates, departmentTaxPercentage: Math.max(0, parseInt(e.target.value) || 0) })}
                  className="w-full bg-[#121927] border border-gray-700 rounded-xl px-3 py-2 text-white font-mono font-bold"
                />
              </div>

              <div className="pt-4 border-t border-gray-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    const def = resetBonusRatesToDefault();
                    setRates(def);
                    setNotification({ type: 'info', message: 'Tarif bonus dikembalikan ke standar awal HSPD.' });
                  }}
                  className="text-xs text-gray-400 hover:text-white underline"
                >
                  Reset Default HSPD
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRatesModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold"
                  >
                    Tutup
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      saveBonusRates(rates);
                      setIsRatesModalOpen(false);
                      setNotification({ type: 'success', message: '✅ Tarif bonus operasional HSPD berhasil diperbarui!' });
                    }}
                    className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-amber-600/30"
                  >
                    <Check className="w-4 h-4" />
                    <span>Terapkan Tarif Baru</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 7. MODAL POPUP: DETAIL LIST ITEMS                       */}
      {/* ======================================================== */}
      {selectedDetailCategory && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 overflow-y-auto">
          <div className="w-full max-w-xl bg-[#090E17] rounded-3xl border border-gray-700 shadow-2xl overflow-hidden my-auto">
            <div className="bg-[#0E1724] border-b border-gray-800 px-6 py-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                {selectedDetailCategory === 'ARREST' && '📁 Rincian Kasus Penindakan Petugas'}
                {selectedDetailCategory === 'CITATION' && '📄 Rincian Surat Tilang Petugas'}
                {selectedDetailCategory === 'IMPOUND' && '🚗 Rincian Kendaraan Impound'}
                {selectedDetailCategory === 'SMELTING' && '🔥 Rincian Senjata Dilebur ke Tungku'}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedDetailCategory(null)}
                className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-2 text-xs">
              {selectedDetailCategory === 'ARREST' && (
                rawPerformance.arrestDetails.map(a => (
                  <div key={a.id} className="p-3 rounded-xl bg-[#121927] border border-gray-800 flex justify-between items-center">
                    <div>
                      <span className="font-mono text-[10px] text-blue-400">{a.id}</span>
                      <div className="font-bold text-white text-sm">{a.suspect}</div>
                      <span className="text-gray-400 text-[11px]">{a.date} • {a.evidenceCount} foto bukti</span>
                    </div>
                    <span className="text-emerald-400 font-bold font-mono">{fmtCurrency(a.fine)}</span>
                  </div>
                ))
              )}

              {selectedDetailCategory === 'CITATION' && (
                rawPerformance.citationDetails.map(c => (
                  <div key={c.id} className="p-3 rounded-xl bg-[#121927] border border-gray-800 flex justify-between items-center">
                    <div>
                      <span className="font-mono text-[10px] text-amber-400">{c.id}</span>
                      <div className="font-bold text-white text-sm">{c.violator}</div>
                      <span className="text-gray-400 text-[11px]">{c.date}</span>
                    </div>
                    <span className="text-amber-400 font-bold font-mono">{fmtCurrency(c.fine)}</span>
                  </div>
                ))
              )}

              {selectedDetailCategory === 'IMPOUND' && (
                rawPerformance.impoundDetails.map(i => (
                  <div key={i.id} className="p-3 rounded-xl bg-[#121927] border border-gray-800 flex justify-between items-center">
                    <div>
                      <span className="font-mono text-[10px] text-purple-400">{i.id}</span>
                      <div className="font-bold text-white text-sm">{i.model}</div>
                      <span className="text-gray-400 font-mono text-[11px]">Plat: {i.plate}</span>
                    </div>
                    <span className="text-purple-400 font-bold font-mono">{fmtCurrency(i.fee)}</span>
                  </div>
                ))
              )}

              {selectedDetailCategory === 'SMELTING' && (
                rawPerformance.smeltingDetails.map(d => (
                  <div key={d.id} className="p-3 rounded-xl bg-[#121927] border border-gray-800 flex justify-between items-center">
                    <div>
                      <span className="font-mono text-[10px] text-rose-400">{d.id}</span>
                      <div className="font-bold text-white text-sm">{d.weaponModel}</div>
                      <span className="text-gray-400 text-[11px]">{d.date}</span>
                    </div>
                    <span className="text-rose-400 font-bold font-mono">{d.quantity} Pucuk Dilebur</span>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 bg-[#0E1724] border-t border-gray-800 text-right">
              <button
                type="button"
                onClick={() => setSelectedDetailCategory(null)}
                className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
