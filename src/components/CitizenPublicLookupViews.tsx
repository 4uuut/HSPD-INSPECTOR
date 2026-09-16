import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, ShieldAlert, AlertTriangle, CheckCircle2, Car, 
  FileText, DollarSign, Calendar, MapPin, User, Shield, 
  Clock, Check, X, Eye, ZoomIn, Lock, HelpCircle, Flame,
  Camera, ChevronRight, RefreshCw, BadgeAlert, AlertOctagon, Scale
} from 'lucide-react';
import { BoloAlert, TrafficCitationRecord, ImpoundRecord, OfficerProfile } from '../types';
import { ErrorBoundary } from './ErrorBoundary';

interface Props {
  viewMode?: 'wanted' | 'citations' | 'impounds';
  activeSubTab?: 'wanted' | 'citations' | 'impounds';
  boloAlerts?: BoloAlert[];
  boloList?: BoloAlert[];
  trafficCitations?: TrafficCitationRecord[];
  citations?: TrafficCitationRecord[];
  impoundRecords?: ImpoundRecord[];
  impounds?: ImpoundRecord[];
  currentOfficer?: OfficerProfile | null;
  onOpenLightbox?: (item: { url: string; title: string; subtitle?: string }) => void;
  onSwitchView?: (mode: 'wanted' | 'citations' | 'impounds') => void;
  onSelectSubTab?: (mode: 'wanted' | 'citations' | 'impounds') => void;
  onNavigateToPasal?: () => void;
}

// Defensive string helper
const safeStr = (val: any, fallback = ''): string => {
  if (val === undefined || val === null) return fallback;
  return String(val);
};

// Defensive number helper
const safeNum = (val: any, fallback = 0): number => {
  const n = Number(val);
  return isNaN(n) ? fallback : n;
};

export const CitizenPublicLookupViews: React.FC<Props> = ({
  viewMode,
  activeSubTab,
  boloAlerts,
  boloList,
  trafficCitations,
  citations,
  impoundRecords,
  impounds,
  currentOfficer,
  onOpenLightbox,
  onSwitchView,
  onSelectSubTab,
  onNavigateToPasal
}) => {
  // Local active subtab state with sync from prop
  const [internalMode, setInternalMode] = useState<'wanted' | 'citations' | 'impounds'>(
    activeSubTab || viewMode || 'wanted'
  );

  useEffect(() => {
    if (activeSubTab) setInternalMode(activeSubTab);
    else if (viewMode) setInternalMode(viewMode);
  }, [activeSubTab, viewMode]);

  const currentMode = activeSubTab || internalMode;
  const effectiveBoloAlerts = (boloAlerts || boloList || []).filter(Boolean);
  const effectiveCitations = (trafficCitations || citations || []).filter(Boolean);
  const effectiveImpounds = (impoundRecords || impounds || []).filter(Boolean);

  const handleSwitchView = (mode: 'wanted' | 'citations' | 'impounds') => {
    setInternalMode(mode);
    if (onSelectSubTab) onSelectSubTab(mode);
    if (onSwitchView) onSwitchView(mode);
  };
  // Search queries
  const [wantedQuery, setWantedQuery] = useState('');
  const [hasSearchedWanted, setHasSearchedWanted] = useState(false);

  const [citationQuery, setCitationQuery] = useState('');
  const [hasSearchedCitation, setHasSearchedCitation] = useState(false);

  const [impoundQuery, setImpoundQuery] = useState('');
  const [impoundFilter, setImpoundFilter] = useState<'ALL' | 'WEAPON' | 'ROBBERY'>('ALL');

  // Helper to check if an impound is related to illegal weapon
  const isWeaponRelatedImpound = (rec: ImpoundRecord) => {
    if (!rec) return false;
    const text = `${safeStr(rec.reason)} ${safeStr(rec.notes)} ${safeStr(rec.violations)}`.toLowerCase();
    return (
      text.includes('senjata') ||
      text.includes('weapon') ||
      text.includes('firearm') ||
      text.includes('pistol') ||
      text.includes('smg') ||
      text.includes('shotgun') ||
      text.includes('rifle') ||
      text.includes('ak-47') ||
      text.includes('amunisi') ||
      text.includes('ilegal')
    );
  };

  // Helper to check if an impound is related to robbery / bekas merampok
  const isRobberyRelatedImpound = (rec: ImpoundRecord) => {
    if (!rec) return false;
    const text = `${safeStr(rec.reason)} ${safeStr(rec.notes)} ${safeStr(rec.violations)}`.toLowerCase();
    return (
      text.includes('rampok') ||
      text.includes('merampok') ||
      text.includes('perampokan') ||
      text.includes('robbery') ||
      text.includes('fleeca') ||
      text.includes('bank') ||
      text.includes('vangelico') ||
      text.includes('jewelry') ||
      text.includes('baku tembak') ||
      text.includes('getaway') ||
      text.includes('pencurian dengan kekerasan')
    );
  };

  // -------------------------------------------------------------
  // 1. WANTED / BURONAN CALCULATION
  // -------------------------------------------------------------
  const wantedResults = useMemo(() => {
    if (!wantedQuery.trim()) return [];
    const q = wantedQuery.toLowerCase().trim();
    return effectiveBoloAlerts.filter(b => {
      if (!b) return false;
      const matchTitle = safeStr(b.title).toLowerCase().includes(q);
      const matchDesc = safeStr(b.description).toLowerCase().includes(q);
      return matchTitle || matchDesc;
    });
  }, [wantedQuery, effectiveBoloAlerts]);

  const isExactWantedFound = wantedResults.length > 0;

  // Active DPO list (all person-type or robbery active BOLOs)
  const allActiveDpoList = useMemo(() => {
    return effectiveBoloAlerts.filter(b => Boolean(b && b.active));
  }, [effectiveBoloAlerts]);

  // -------------------------------------------------------------
  // 2. CITATIONS CALCULATION
  // -------------------------------------------------------------
  const citationResults = useMemo(() => {
    if (!citationQuery.trim()) return [];
    const q = citationQuery.toLowerCase().trim();
    return effectiveCitations.filter(c => {
      if (!c) return false;
      const matchName = safeStr(c.violatorName).toLowerCase().includes(q);
      const matchPlate = safeStr(c.plateNumber).toLowerCase().includes(q);
      return matchName || matchPlate;
    });
  }, [citationQuery, effectiveCitations]);

  const totalCitationFine = useMemo(() => {
    return citationResults.reduce((acc, c) => acc + safeNum(c?.totalFine, 0), 0);
  }, [citationResults]);

  const unpaidCitationsCount = useMemo(() => {
    return citationResults.filter(c => Boolean(c && c.status === 'UNPAID')).length;
  }, [citationResults]);

  // -------------------------------------------------------------
  // 3. IMPOUND CALCULATION
  // -------------------------------------------------------------
  const filteredImpounds = useMemo(() => {
    let list = effectiveImpounds.filter(Boolean);

    if (impoundFilter === 'WEAPON') {
      list = list.filter(isWeaponRelatedImpound);
    } else if (impoundFilter === 'ROBBERY') {
      list = list.filter(isRobberyRelatedImpound);
    }

    if (impoundQuery.trim()) {
      const q = impoundQuery.toLowerCase().trim();
      list = list.filter(r => 
        safeStr(r?.plateNumber).toLowerCase().includes(q) ||
        safeStr(r?.vehicleModel).toLowerCase().includes(q) ||
        safeStr(r?.ownerName).toLowerCase().includes(q) ||
        safeStr(r?.reason).toLowerCase().includes(q) ||
        safeStr(r?.locationFound).toLowerCase().includes(q)
      );
    }

    return list;
  }, [effectiveImpounds, impoundFilter, impoundQuery]);

  const weaponImpoundsCount = useMemo(() => effectiveImpounds.filter(isWeaponRelatedImpound).length, [effectiveImpounds]);
  const robberyImpoundsCount = useMemo(() => effectiveImpounds.filter(isRobberyRelatedImpound).length, [effectiveImpounds]);

  return (
    <ErrorBoundary fallbackTitle="Kendala Memuat Direktori Warga" fallbackMessage="Terjadi kendala saat memproses daftar data warga. Silakan coba buka kembali.">
      <div className="space-y-6">
      {/* TOP VIEW SWITCHER QUICK TABS */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#111622] border border-gray-800 p-2.5 rounded-xl shadow-lg">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <button
            type="button"
            onClick={() => handleSwitchView('wanted')}
            className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition ${
              currentMode === 'wanted'
                ? 'bg-red-600 text-white shadow-lg shadow-red-900/50 ring-1 ring-red-400 font-bold'
                : 'text-red-300 hover:text-white hover:bg-red-950/50 border border-red-900/40'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>🚨 Cek Status Buronan (DPO / BOLO)</span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchView('citations')}
            className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition ${
              currentMode === 'citations'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/50 ring-1 ring-amber-400 font-bold'
                : 'text-amber-300 hover:text-white hover:bg-amber-950/50 border border-amber-900/40'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>🚦 Cek Nama Kena Tilang</span>
            <span className="text-[10px] font-mono bg-amber-950 px-1.5 py-0.5 rounded border border-amber-800">
              {effectiveCitations.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchView('impounds')}
            className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition ${
              currentMode === 'impounds'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50 ring-1 ring-blue-400 font-bold'
                : 'text-blue-300 hover:text-white hover:bg-blue-950/50 border border-blue-900/40'
            }`}
          >
            <Car className="w-4 h-4" />
            <span>🚗 Kendaraan Impound (Senjata / Rampok)</span>
            <span className="text-[10px] font-mono bg-blue-950 px-1.5 py-0.5 rounded border border-blue-800">
              {effectiveImpounds.length}
            </span>
          </button>
        </div>

        <div className="text-[11px] text-gray-400 font-mono hidden sm:flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>HighState Live CAD Database Sync</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. VIEW MODE: WANTED / CEK STATUS BURONAN (DPO / BOLO)                    */}
      {/* ========================================================================= */}
      {currentMode === 'wanted' && (
        <div className="space-y-6 animate-fadeIn">
          {/* BANNER */}
          <div className="bg-gradient-to-r from-red-950/80 via-[#131118] to-red-950/80 border border-red-800/60 rounded-xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-3 bg-red-600/20 border border-red-500/40 rounded-xl text-red-400 shrink-0">
                <AlertOctagon className="w-7 h-7 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    PENGECEKAN STATUS BURONAN & DAFTAR PENCARIAN ORANG (DPO)
                  </h2>
                  <span className="text-[10px] font-mono bg-red-900/80 text-red-200 border border-red-600/60 px-2 py-0.5 rounded font-bold">
                    HSPD BOLO SYSTEM
                  </span>
                </div>
                <p className="text-xs text-gray-300 mt-1 max-w-2xl leading-relaxed">
                  Cari nama warga untuk memastikan apakah nama tersebut berstatus DPO / Buronan aktif kepolisian HighState Police Department. Sistem mencari data secara real-time pada direktori BOLO (Be On the Lookout).
                </p>
              </div>
            </div>
          </div>

          {/* SEARCH BOX */}
          <div className="bg-[#131823] border border-gray-800 rounded-xl p-5 shadow-xl space-y-3">
            <label className="block text-xs font-bold text-gray-200 uppercase tracking-wider font-mono">
              Masukkan Nama Lengkap Warga yang Ingin Diperiksa:
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={wantedQuery}
                  onChange={(e) => {
                    setWantedQuery(e.target.value);
                    setHasSearchedWanted(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setHasSearchedWanted(true);
                  }}
                  placeholder="Ketik Nama Warga (Contoh: Trevor Philips, Antonio Morales, Franklin Clinton)..."
                  className="w-full bg-[#0D1117] border border-gray-700 focus:border-red-500 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none pl-10"
                />
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
                {wantedQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setWantedQuery('');
                      setHasSearchedWanted(false);
                    }}
                    className="absolute right-3 top-3 text-gray-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setHasSearchedWanted(true)}
                className="px-5 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-950/50 transition"
              >
                <Search className="w-4 h-4" />
                <span>Cek Status Buronan</span>
              </button>
            </div>

            {/* QUICK PRESET CHIPS */}
            <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[11px] text-gray-400 font-mono">Uji Coba Cepat:</span>
              <button
                type="button"
                onClick={() => {
                  setWantedQuery('Franklin Clinton');
                  setHasSearchedWanted(true);
                }}
                className="px-2.5 py-1 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 rounded text-xs font-mono transition"
              >
                Franklin Clinton (Bukan Buronan)
              </button>
              <button
                type="button"
                onClick={() => {
                  setWantedQuery('Trevor Philips');
                  setHasSearchedWanted(true);
                }}
                className="px-2.5 py-1 bg-red-950/80 hover:bg-red-900 border border-red-700 text-red-300 rounded text-xs font-mono transition"
              >
                Trevor Philips (DPO Buronan)
              </button>
              <button
                type="button"
                onClick={() => {
                  setWantedQuery('Antonio Morales');
                  setHasSearchedWanted(true);
                }}
                className="px-2.5 py-1 bg-red-950/80 hover:bg-red-900 border border-red-700 text-red-300 rounded text-xs font-mono transition"
              >
                Antonio Morales (DPO Buronan)
              </button>
            </div>
          </div>

          {/* SEARCH RESULTS FEEDBACK */}
          {hasSearchedWanted && wantedQuery.trim() && (
            <div className="space-y-4">
              {isExactWantedFound ? (
                /* RED ALERT: BURONAN / DPO */
                <div className="bg-red-950/60 border-2 border-red-600 rounded-xl p-5 shadow-2xl space-y-4 animate-fadeIn">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-red-600 text-white rounded-xl shadow-lg shadow-red-900/80 animate-bounce">
                        <AlertTriangle className="w-8 h-8" />
                      </div>
                      <div>
                        <span className="text-[11px] font-mono bg-red-900 text-red-100 font-bold px-2 py-0.5 rounded border border-red-500 uppercase tracking-wider">
                          PERINGATAN RESMI HSPD: STATUS BURONAN (DPO 10-99)
                        </span>
                        <h3 className="text-xl font-extrabold text-white mt-1">
                          WASPADA! NAMA "{wantedQuery}" TERDAFTAR SEBAGAI BURONAN AKTIF
                        </h3>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-full uppercase tracking-wider shrink-0">
                      WANTED / DPO
                    </span>
                  </div>

                  <p className="text-xs text-red-200 leading-relaxed bg-black/40 p-3.5 rounded-lg border border-red-800/80">
                    <strong>Pemberitahuan Publik:</strong> Warga dengan nama tersebut berstatus tersangka berbahaya yang sedang dalam pengejaran aparat kepolisian. 
                    Masyarakat diimbau untuk <strong>TIDAK MENDEKATI</strong> atau mengambil tindakan sendiri. Segera hubungi saluran darurat 911 jika melihat orang bersangkutan.
                  </p>

                  {/* DETAILS OF THE MATCHED BOLO */}
                  <div className="space-y-3 pt-1">
                    {wantedResults.map((bolo) => (
                      <div key={bolo.id} className="bg-[#0B0D13] border border-red-800/80 rounded-xl p-4 space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-bold text-sm text-red-300 flex items-center gap-2">
                            <BadgeAlert className="w-4 h-4 text-red-500" />
                            {bolo.title}
                          </span>
                          <span className="text-[10px] font-mono bg-red-950 text-red-400 border border-red-700 px-2 py-0.5 rounded font-bold">
                            TINGKAT BAHAYA: {bolo.dangerLevel}
                          </span>
                        </div>

                        <p className="text-xs text-gray-300 leading-relaxed">
                          {bolo.description}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono text-gray-400 pt-2 border-t border-gray-800">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-red-400" />
                            <span>Lokasi Terakhir: <strong className="text-white">{bolo.lastSeenLocation || 'Tidak diketahui'}</strong></span>
                          </div>
                          <div className="flex items-center gap-1.5 sm:justify-end">
                            <Shield className="w-3.5 h-3.5 text-blue-400" />
                            <span>Diterbitkan oleh: <strong className="text-white">{bolo.issuedBy} [{bolo.issuedByBadge}]</strong></span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* GREEN CARD: NOT WANTED / BERSIH */
                <div className="bg-emerald-950/40 border-2 border-emerald-500/70 rounded-xl p-5 shadow-2xl space-y-3 animate-fadeIn">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-900/60">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div>
                      <span className="text-[11px] font-mono bg-emerald-900 text-emerald-200 font-bold px-2 py-0.5 rounded border border-emerald-600 uppercase tracking-wider">
                        STATUS AMAN: TIDAK TERDAFTAR SEBAGAI BURONAN
                      </span>
                      <h3 className="text-lg font-bold text-white mt-1">
                        Nama "{wantedQuery}" BUKAN Buronan / DPO Kepolisian
                      </h3>
                    </div>
                  </div>

                  <p className="text-xs text-emerald-200/90 leading-relaxed bg-black/40 p-3.5 rounded-lg border border-emerald-800/80">
                    Berdasarkan pemindaian basis data BOLO (Be On the Lookout) HighState Police Department per tanggal hari ini, 
                    nama <strong>"{wantedQuery}"</strong> tidak memiliki surat perintah penangkapan aktif (DPO/Wanted), tidak terlibat sindikat buron, dan berstatus sebagai warga bebas berkegiatan normal.
                  </p>

                  <div className="flex items-center gap-2 text-[11px] text-gray-400 font-mono pt-1">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Hasil pemindaian diverifikasi sistem CAD/MDT kepolisian HighState.</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* LIST OF CURRENT PUBLIC DPO (WARGA BISA MELIHAT DAFTAR BURONAN YANG DICARI) */}
          <div className="bg-[#131823] border border-gray-800 rounded-xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                  DAFTAR BURONAN & BOLO AKTIF TERBUKA KEPOLISIAN (PUBLIC LIST)
                </h3>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Daftar terduga pelaku kejahatan dan buronan yang sedang aktif dicari oleh HighState Police Department.
                </p>
              </div>
              <span className="text-xs font-mono bg-red-950 text-red-300 border border-red-800 px-2 py-0.5 rounded font-bold">
                {allActiveDpoList.length} DPO Aktif
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {allActiveDpoList.map((bolo) => (
                <div 
                  key={bolo.id}
                  className="p-3.5 bg-[#0A0D14] border border-gray-800 hover:border-red-600/70 rounded-xl transition space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-xs text-white line-clamp-1">{bolo.title}</span>
                    <span className="text-[9px] font-mono bg-red-950 text-red-400 border border-red-800 px-1.5 py-0.5 rounded uppercase shrink-0 font-semibold">
                      {bolo.dangerLevel}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">
                    {bolo.description}
                  </p>
                  <div className="flex items-center justify-between text-[10px] font-mono text-gray-500 pt-1.5 border-t border-gray-900">
                    <span className="text-red-400/90 truncate max-w-[200px]">
                      📍 {bolo.lastSeenLocation || 'Area Los Santos'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setWantedQuery(bolo.title.split('-')[0].trim());
                        setHasSearchedWanted(true);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="text-blue-400 hover:underline flex items-center gap-0.5 shrink-0"
                    >
                      <span>Detail</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. VIEW MODE: CITATIONS / CARI NAMA ORANG YANG KENA TILANG                */}
      {/* ========================================================================= */}
      {currentMode === 'citations' && (
        <div className="space-y-6 animate-fadeIn">
          {/* BANNER */}
          <div className="bg-gradient-to-r from-amber-950/80 via-[#14120E] to-amber-950/80 border border-amber-800/60 rounded-xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-3 bg-amber-600/20 border border-amber-500/40 rounded-xl text-amber-400 shrink-0">
                <FileText className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    PENCARIAN DATA SURAT TILANG & DENDA LALU LINTAS (TRAFFIC CITATIONS)
                  </h2>
                  <span className="text-[10px] font-mono bg-amber-900/80 text-amber-200 border border-amber-600/60 px-2 py-0.5 rounded font-bold">
                    PORTAL TILANG HSPD
                  </span>
                </div>
                <p className="text-xs text-gray-300 mt-1 max-w-2xl leading-relaxed">
                  Cari nama pelanggar atau nomor plat kendaraan untuk mengecek status surat tilang aktif, pasal pelanggaran lalu lintas, rincian biaya denda, dan bukti penilangan resmi dari petugas patroli.
                </p>
              </div>
            </div>
          </div>

          {/* SEARCH BOX */}
          <div className="bg-[#131823] border border-gray-800 rounded-xl p-5 shadow-xl space-y-3">
            <label className="block text-xs font-bold text-gray-200 uppercase tracking-wider font-mono">
              Cari Berdasarkan Nama Orang yang Kena Tilang atau Plat Nomor:
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={citationQuery}
                  onChange={(e) => {
                    setCitationQuery(e.target.value);
                    setHasSearchedCitation(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setHasSearchedCitation(true);
                  }}
                  placeholder="Ketik Nama Pelanggar (Contoh: Carl Johnson, Dominic Toretto) atau Plat Nomor..."
                  className="w-full bg-[#0D1117] border border-gray-700 focus:border-amber-500 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none pl-10"
                />
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
                {citationQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setCitationQuery('');
                      setHasSearchedCitation(false);
                    }}
                    className="absolute right-3 top-3 text-gray-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setHasSearchedCitation(true)}
                className="px-5 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-950/50 transition"
              >
                <Search className="w-4 h-4" />
                <span>Cari Riwayat Tilang</span>
              </button>
            </div>

            {/* QUICK PRESET CITIZENS */}
            <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[11px] text-gray-400 font-mono">Pilihan Nama Contoh:</span>
              <button
                type="button"
                onClick={() => {
                  setCitationQuery('Carl Johnson');
                  setHasSearchedCitation(true);
                }}
                className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-xs font-mono transition"
              >
                Carl Johnson (Tilang Unpaid)
              </button>
              <button
                type="button"
                onClick={() => {
                  setCitationQuery('Dominic Toretto');
                  setHasSearchedCitation(true);
                }}
                className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-xs font-mono transition"
              >
                Dominic Toretto (Tilang Paid)
              </button>
              <button
                type="button"
                onClick={() => {
                  setCitationQuery('Franklin Clinton');
                  setHasSearchedCitation(true);
                }}
                className="px-2.5 py-1 bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 rounded text-xs font-mono transition"
              >
                Franklin Clinton (Bebas Tilang)
              </button>
            </div>
          </div>

          {/* SEARCH RESULTS */}
          {hasSearchedCitation && citationQuery.trim() && (
            <div className="space-y-4">
              {citationResults.length > 0 ? (
                <div className="space-y-4 animate-fadeIn">
                  {/* SUMMARY CARDS */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-[#131823] border border-gray-800 p-3.5 rounded-xl">
                      <span className="text-[10px] font-mono text-gray-400 block">TOTAL SURAT TILANG</span>
                      <span className="text-xl font-bold text-white mt-1 block">
                        {citationResults.length} Berkas
                      </span>
                    </div>
                    <div className="bg-[#131823] border border-gray-800 p-3.5 rounded-xl">
                      <span className="text-[10px] font-mono text-gray-400 block">TOTAL NOMINAL DENDA</span>
                      <span className="text-xl font-bold text-amber-400 mt-1 block font-mono">
                        ${totalCitationFine.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="bg-[#131823] border border-gray-800 p-3.5 rounded-xl">
                      <span className="text-[10px] font-mono text-gray-400 block">STATUS DENDA</span>
                      <span className={`text-base font-bold mt-1 block ${
                        unpaidCitationsCount > 0 ? 'text-red-400' : 'text-emerald-400'
                      }`}>
                        {unpaidCitationsCount > 0 ? `${unpaidCitationsCount} Belum Lunas (Unpaid)` : 'Semua Lunas (Paid)'}
                      </span>
                    </div>
                  </div>

                  {/* CITATION CARDS */}
                  <div className="space-y-3">
                    {citationResults.map((cit) => (
                      <div 
                        key={cit.id}
                        className="bg-[#131823] border border-amber-900/60 rounded-xl p-5 shadow-xl space-y-3"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2 border-b border-gray-800 pb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
                                {cit.id}
                              </span>
                              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                                cit.status === 'PAID'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                                  : 'bg-red-950 text-red-300 border border-red-700 animate-pulse'
                              }`}>
                                {cit.status === 'PAID' ? '✓ DENDA LUNAS' : '⚠️ BELUM LUNAS (UNPAID)'}
                              </span>
                            </div>
                            <h4 className="text-base font-bold text-white mt-1.5">
                              Pelanggar: <span className="text-amber-300">{cit.violatorName}</span>
                            </h4>
                          </div>

                          <div className="text-right font-mono">
                            <span className="text-[10px] text-gray-400 block">TOTAL DENDA</span>
                            <span className="text-lg font-bold text-amber-400">
                              ${typeof cit.totalFine === 'number' ? cit.totalFine.toLocaleString('id-ID') : cit.totalFine}
                            </span>
                          </div>
                        </div>

                        {/* DETAILS GRID */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                          <div className="bg-[#090C11] p-2.5 rounded border border-gray-800">
                            <span className="text-[10px] text-gray-400 block font-mono">KENDARAAN & PLAT</span>
                            <span className="text-white font-semibold">{cit.vehicleModel}</span>
                            <span className="block font-mono text-amber-300 text-[11px] font-bold">[{cit.plateNumber}]</span>
                          </div>
                          <div className="bg-[#090C11] p-2.5 rounded border border-gray-800">
                            <span className="text-[10px] text-gray-400 block font-mono">LOKASI & WAKTU</span>
                            <span className="text-gray-200">{cit.location}</span>
                            <span className="block text-[11px] text-gray-400 font-mono">{cit.dayDate}, {cit.timeString}</span>
                          </div>
                          <div className="bg-[#090C11] p-2.5 rounded border border-gray-800">
                            <span className="text-[10px] text-gray-400 block font-mono">PETUGAS PENILANG</span>
                            <span className="text-blue-300 font-semibold">{cit.officerName}</span>
                            <span className="block text-[11px] text-gray-400 font-mono">Lencana #{cit.officerBadge}</span>
                          </div>
                        </div>

                        {/* VIOLATIONS & NOTES */}
                        <div className="bg-[#090C11] p-3 rounded-lg border border-gray-800 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-mono text-amber-400 font-semibold block">PASAL PELANGGARAN:</span>
                            {onNavigateToPasal && (
                              <button
                                type="button"
                                onClick={onNavigateToPasal}
                                className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 hover:underline"
                                title="Lihat daftar pasal & kalkulator denda resmi"
                              >
                                <Scale className="w-3.5 h-3.5 text-cyan-400" />
                                <span>Cek Detail di KUHP Warga</span>
                              </button>
                            )}
                          </div>
                          <p className="text-gray-200 font-medium">{cit.violations}</p>
                          {cit.notes && (
                            <div className="pt-1 text-gray-400 text-[11px]">
                              <span className="font-semibold text-gray-300">Catatan Petugas: </span>
                              {cit.notes}
                            </div>
                          )}
                        </div>

                        {/* EVIDENCE PHOTO IF AVAILABLE */}
                        {cit.evidenceImage && (
                          <div className="pt-1 flex items-center justify-between">
                            <span className="text-[11px] text-gray-400 font-mono flex items-center gap-1.5">
                              <Camera className="w-3.5 h-3.5 text-amber-400" />
                              Foto Bukti Penilangan Terlampir
                            </span>
                            <button
                              type="button"
                              onClick={() => onOpenLightbox && onOpenLightbox({
                                url: cit.evidenceImage!,
                                title: `Foto Bukti Tilang - ${cit.violatorName}`,
                                subtitle: `${cit.violations} (${cit.plateNumber})`
                              })}
                              className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-white rounded text-xs flex items-center gap-1 transition"
                            >
                              <ZoomIn className="w-3.5 h-3.5" />
                              <span>Lihat Bukti Foto</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* NO CITATIONS FOUND */
                <div className="bg-emerald-950/40 border border-emerald-600/70 rounded-xl p-5 shadow-xl space-y-2 text-center animate-fadeIn">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <h4 className="text-base font-bold text-white">
                    TIDAK ADA SURAT TILANG AKTIF UNTUK NAMA "{citationQuery}"
                  </h4>
                  <p className="text-xs text-gray-300 max-w-lg mx-auto leading-relaxed">
                    Warga bersangkutan tidak memiliki catatan pelanggaran lalu lintas aktif atau denda yang belum diselesaikan pada kepolisian HighState Police Department.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ALL CITATIONS TABLE OVERVIEW */}
          <div className="bg-[#131823] border border-gray-800 rounded-xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-gray-800 pb-2.5">
              <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-amber-400" />
                Daftar Seluruh Penindakan Tilang HSPD ({effectiveCitations.length} Catatan)
              </h3>
              <span className="text-[10px] text-gray-400 font-mono">Data Terintegrasi</span>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {effectiveCitations.map((cit) => (
                <div 
                  key={cit.id}
                  onClick={() => {
                    setCitationQuery(cit.violatorName);
                    setHasSearchedCitation(true);
                  }}
                  className="p-3 bg-[#0A0D14] border border-gray-800 hover:border-amber-600/60 rounded-lg cursor-pointer transition flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs">{cit.violatorName}</span>
                      <span className="text-[10px] font-mono text-amber-300 font-bold">[{cit.plateNumber}]</span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${
                        cit.status === 'PAID' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-red-950 text-red-300 border border-red-800'
                      }`}>
                        {cit.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 truncate max-w-md mt-0.5">{cit.violations}</p>
                  </div>
                  <div className="text-right sm:self-center shrink-0">
                    <span className="text-xs font-bold font-mono text-amber-400">
                      ${typeof cit.totalFine === 'number' ? cit.totalFine.toLocaleString('id-ID') : cit.totalFine}
                    </span>
                    <span className="block text-[10px] text-gray-500 font-mono">{cit.dayDate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. VIEW MODE: IMPOUND / KENDARAAN KENA IMPOUND (SENJATA ILEGAL / MERAMPOK)*/}
      {/* ========================================================================= */}
      {currentMode === 'impounds' && (
        <div className="space-y-6 animate-fadeIn">
          {/* BANNER */}
          <div className="bg-gradient-to-r from-blue-950/80 via-[#10141F] to-blue-950/80 border border-blue-800/60 rounded-xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-3 bg-blue-600/20 border border-blue-500/40 rounded-xl text-blue-400 shrink-0">
                <Car className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    DATA SITAAN KENDARAAN KENA IMPOUND (SENJATA ILEGAL & BEKAS MERAMPOK)
                  </h2>
                  <span className="text-[10px] font-mono bg-blue-900/80 text-blue-200 border border-blue-600/60 px-2 py-0.5 rounded font-bold">
                    HSPD IMPOUND LOT
                  </span>
                </div>
                <p className="text-xs text-gray-300 mt-1 max-w-2xl leading-relaxed">
                  Pencarian kendaraan yang disita ke Impound Yard kepolisian, secara khusus kendaraan yang disita dikarenakan <strong>ditemukan senjata ilegal di dalam kendaraan</strong> atau <strong>kendaraan bekas merampok (getaway vehicle)</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* FILTER BUTTONS & SEARCH BAR */}
          <div className="bg-[#131823] border border-gray-800 rounded-xl p-5 shadow-xl space-y-4">
            {/* SPECIAL CATEGORY FILTER BUTTONS */}
            <div>
              <label className="block text-xs font-bold text-gray-200 uppercase tracking-wider font-mono mb-2">
                Pilih Kategori Alasan Penyitaan:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setImpoundFilter('ALL')}
                  className={`p-3 rounded-lg border text-xs font-bold flex items-center justify-between transition ${
                    impoundFilter === 'ALL'
                      ? 'bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-950/50'
                      : 'bg-[#0A0D14] text-gray-300 border-gray-800 hover:border-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4" />
                    <span>Semua Kendaraan Sitaan</span>
                  </div>
                  <span className="text-[10px] font-mono bg-black/40 px-2 py-0.5 rounded">
                    {effectiveImpounds.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setImpoundFilter('WEAPON')}
                  className={`p-3 rounded-lg border text-xs font-bold flex items-center justify-between transition ${
                    impoundFilter === 'WEAPON'
                      ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white border-red-400 shadow-lg shadow-red-950/50'
                      : 'bg-[#0A0D14] text-red-300 border-red-900/40 hover:border-red-600/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-400" />
                    <span>💥 Ada Senjata Ilegal di Kendaraan</span>
                  </div>
                  <span className="text-[10px] font-mono bg-black/40 px-2 py-0.5 rounded text-orange-300">
                    {weaponImpoundsCount} Unit
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setImpoundFilter('ROBBERY')}
                  className={`p-3 rounded-lg border text-xs font-bold flex items-center justify-between transition ${
                    impoundFilter === 'ROBBERY'
                      ? 'bg-gradient-to-r from-amber-600 to-red-600 text-white border-amber-400 shadow-lg shadow-amber-950/50'
                      : 'bg-[#0A0D14] text-amber-300 border-amber-900/40 hover:border-amber-600/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    <span>🚨 Bekas Merampok / Perampokan</span>
                  </div>
                  <span className="text-[10px] font-mono bg-black/40 px-2 py-0.5 rounded text-amber-300">
                    {robberyImpoundsCount} Unit
                  </span>
                </button>
              </div>
            </div>

            {/* SEARCH INPUT */}
            <div className="pt-2 border-t border-gray-800">
              <label className="block text-xs font-bold text-gray-200 uppercase tracking-wider font-mono mb-2">
                Cari Berdasarkan Plat Nomor, Nama Pemilik, atau Model Mobil:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={impoundQuery}
                  onChange={(e) => setImpoundQuery(e.target.value)}
                  placeholder="Ketik Plat Nomor (Contoh: LS-8831, LS-7749) atau Nama Pemilik / Model Kendaraan..."
                  className="w-full bg-[#0D1117] border border-gray-700 focus:border-blue-500 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none pl-10 font-mono"
                />
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
                {impoundQuery && (
                  <button
                    type="button"
                    onClick={() => setImpoundQuery('')}
                    className="absolute right-3 top-3 text-gray-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* RESULTS GRID */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-mono text-gray-400">
              <span>
                Menampilkan: <strong className="text-white">{filteredImpounds.length}</strong> Kendaraan Sitaan
                {impoundFilter === 'WEAPON' && ' (Kategori: Senjata Ilegal)'}
                {impoundFilter === 'ROBBERY' && ' (Kategori: Bekas Merampok)'}
              </span>
              <span className="text-blue-400">Lokasi: Los Santos Police Impound Yard</span>
            </div>

            {filteredImpounds.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredImpounds.map((rec, index) => {
                  if (!rec) return null;
                  const hasWeapon = isWeaponRelatedImpound(rec);
                  const hasRobbery = isRobberyRelatedImpound(rec);
                  const fee = safeNum(rec.impoundFee, 0);
                  const days = safeNum(rec.impoundDays, 7);
                  const plate = safeStr(rec.plateNumber, 'TANPA PLAT');
                  const model = safeStr(rec.vehicleModel, 'Kendaraan');
                  const color = safeStr(rec.color, 'Standar');
                  const owner = safeStr(rec.ownerName, 'Tidak Diketahui / Anonim');
                  const reason = safeStr(rec.reason, 'Penyitaan resmi kepolisian');
                  const status = safeStr(rec.status, 'IMPOUNDED');
                  const officerName = safeStr(rec.officerName, 'Petugas HSPD');
                  const officerBadge = safeStr(rec.officerBadge, '-');
                  const location = safeStr(rec.locationFound, '');
                  const evidence = safeStr(rec.evidenceImage || rec.evidenceUrl, '');

                  return (
                    <div
                      key={rec.id || `impound-item-${index}`}
                      className={`p-5 rounded-xl border shadow-xl space-y-3.5 transition-all ${
                        hasWeapon
                          ? 'bg-gradient-to-b from-[#180E10] to-[#0E0F16] border-red-700/80 hover:border-red-500'
                          : hasRobbery
                          ? 'bg-gradient-to-b from-[#18130E] to-[#0E0F16] border-amber-700/80 hover:border-amber-500'
                          : 'bg-[#131823] border-gray-800 hover:border-blue-700/60'
                      }`}
                    >
                      {/* CARD HEADER */}
                      <div className="flex items-start justify-between gap-3 border-b border-gray-800 pb-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            {/* LICENSE PLATE STYLING */}
                            <span className="font-mono text-xs font-extrabold text-black bg-yellow-400 px-2.5 py-1 rounded shadow tracking-widest border border-yellow-500">
                              {plate}
                            </span>
                            <span className="text-xs font-bold text-white font-mono">
                              {model}
                            </span>
                            <span className="text-[11px] text-gray-400">({color})</span>
                          </div>

                          {/* SPECIAL REASON TAGS */}
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {hasWeapon && (
                              <span className="text-[10px] font-mono bg-red-950 text-red-300 border border-red-600 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                                <Flame className="w-3 h-3 text-red-400" />
                                SITAAN SENJATA ILEGAL
                              </span>
                            )}
                            {hasRobbery && (
                              <span className="text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-600 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                                <ShieldAlert className="w-3 h-3 text-amber-400" />
                                KENDARAAN BEKAS MERAMPOK
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                            status === 'IMPOUNDED'
                              ? 'bg-red-950 text-red-300 border border-red-700 animate-pulse'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                          }`}>
                            {status === 'IMPOUNDED' ? 'DI SITA (IMPOUNDED)' : status}
                          </span>
                        </div>
                      </div>

                      {/* OWNER & REASON */}
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between text-[11px] text-gray-300">
                          <span>Pemilik Terdaftar: <strong className="text-white font-semibold">{owner}</strong></span>
                          <span className="text-gray-400 font-mono">Masa Sita: {days} Hari</span>
                        </div>

                        {/* REASON BOX */}
                        <div className="p-3 bg-black/60 rounded-lg border border-gray-800/90 text-xs">
                          <span className="text-[10px] font-mono text-amber-400 font-bold block mb-1">
                            ALASAN RESMI PENYITAAN PETUGAS:
                          </span>
                          <p className="text-gray-200 leading-relaxed font-medium">
                            {reason}
                          </p>
                        </div>
                      </div>

                      {/* FOOTER STATS */}
                      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-2 border-t border-gray-800">
                        <div>
                          <span className="text-gray-400 block text-[10px]">BIAYA TEBUS / DENDA SITA:</span>
                          <span className="text-sm font-bold text-amber-400">
                            ${fee.toLocaleString('id-ID')}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-gray-400 block text-[10px]">PETUGAS PENYITA:</span>
                          <span className="text-blue-300 font-semibold truncate block">
                            {officerName} [{officerBadge}]
                          </span>
                        </div>
                      </div>

                      {/* LOCATION FOUND */}
                      {location && (
                        <div className="text-[10px] font-mono text-gray-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-red-400" />
                          <span>TKP Penyitaan: {location}</span>
                        </div>
                      )}

                      {/* EVIDENCE PHOTOS IF AVAILABLE */}
                      {evidence && (
                        <div className="pt-2 border-t border-gray-800 flex items-center justify-between">
                          <span className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                            <Camera className="w-3 h-3 text-blue-400" />
                            Foto Barang Bukti Mobil Sitaan
                          </span>
                          <button
                            type="button"
                            onClick={() => onOpenLightbox && onOpenLightbox({
                              url: evidence,
                              title: `Bukti Sitaan - ${model} [${plate}]`,
                              subtitle: reason
                            })}
                            className="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-white rounded text-[11px] flex items-center gap-1 transition"
                          >
                            <ZoomIn className="w-3 h-3" />
                            <span>Lihat Foto</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-[#131823] border border-gray-800 rounded-xl p-8 text-center text-gray-500 space-y-2">
                <Car className="w-8 h-8 mx-auto opacity-40" />
                <p className="text-xs">Tidak ditemukan kendaraan sitaan yang sesuai dengan kriteria pencarian.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
    </ErrorBoundary>
  );
};
