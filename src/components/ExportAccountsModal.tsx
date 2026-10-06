import React, { useState, useMemo } from 'react';
import { 
  X, FileSpreadsheet, Download, FileText, Printer, 
  Copy, Check, Search, Shield, Filter, KeyRound, 
  Users, AlertTriangle, Eye, EyeOff, Sparkles, Building2,
  Lock, CheckCircle2, ChevronRight, Hash
} from 'lucide-react';
import { OfficerAccount, isAtasanRank } from '../types';
import { 
  exportAccountsToExcel, 
  exportAccountsToCSV, 
  exportAccountsToJSON, 
  formatAccountsToDiscordText, 
  printAccountsDocument 
} from '../utils/accountExport';
import { HSPD_LOGO_URL } from '../assets/logo';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  roster: OfficerAccount[];
  currentOfficerName?: string;
  currentOfficerBadge?: string;
  currentOfficerRank?: string;
  departmentName?: string;
}

export const ExportAccountsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  roster,
  currentOfficerName,
  currentOfficerBadge,
  currentOfficerRank,
  departmentName = 'State of HighState Police Department (HSPD)'
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRankCategory, setSelectedRankCategory] = useState<'all' | 'command' | 'field' | 'supervisor' | 'officer' | 'cadet'>('all');
  const [warnFilter, setWarnFilter] = useState<'all' | 'warn_only' | 'no_warn'>('all');
  const [includePin, setIncludePin] = useState(true);
  const [isCopiedDiscord, setIsCopiedDiscord] = useState(false);

  // Statistics calculation
  const stats = useMemo(() => {
    let total = roster.length;
    let atasanCount = 0;
    let officersCount = 0;
    let cadetCount = 0;
    let warnedCount = 0;

    roster.forEach(o => {
      const r = (o.rank || '').toUpperCase();
      if (isAtasanRank(o.rank) || r.includes('SERGEANT') || r.includes('SGT')) {
        atasanCount++;
      } else if (r.includes('CADET')) {
        cadetCount++;
      } else {
        officersCount++;
      }

      if (Array.isArray(o.warnings) && o.warnings.length > 0) {
        warnedCount++;
      }
    });

    return { total, atasanCount, officersCount, cadetCount, warnedCount };
  }, [roster]);

  // Filtered officers
  const filteredOfficers = useMemo(() => {
    return roster.filter(officer => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const mName = (officer.name || '').toLowerCase().includes(q);
        const mBadge = (officer.badge || '').toLowerCase().includes(q);
        const mRank = (officer.rank || '').toLowerCase().includes(q);
        const mDiv = (officer.division || '').toLowerCase().includes(q);
        if (!mName && !mBadge && !mRank && !mDiv) return false;
      }

      // 2. Rank Category Filter
      const r = (officer.rank || '').toUpperCase();
      if (selectedRankCategory === 'command') {
        if (!r.includes('CHIEF') && !r.includes('COMMANDER')) return false;
      } else if (selectedRankCategory === 'field') {
        if (!r.includes('CAPTAIN') && !r.includes('LIEUTENANT')) return false;
      } else if (selectedRankCategory === 'supervisor') {
        if (!r.includes('SERGEANT') && !r.includes('SGT')) return false;
      } else if (selectedRankCategory === 'officer') {
        if (!r.includes('POLICE OFFICER') && !r.includes('PO ') && !r.includes('LEAD OFFICER') && !r.includes('SLO')) return false;
      } else if (selectedRankCategory === 'cadet') {
        if (!r.includes('CADET')) return false;
      }

      // 3. Warning Filter
      const hasWarn = Array.isArray(officer.warnings) && officer.warnings.length > 0;
      if (warnFilter === 'warn_only' && !hasWarn) return false;
      if (warnFilter === 'no_warn' && hasWarn) return false;

      return true;
    });
  }, [roster, searchQuery, selectedRankCategory, warnFilter]);

  if (!isOpen) return null;

  const exportOptions = {
    includePin,
    departmentName,
    exportedBy: currentOfficerName || 'Atasan / Komando Markas',
    exportedByBadge: currentOfficerBadge || '',
    exportedByRank: currentOfficerRank || ''
  };

  const handleCopyDiscordFormat = () => {
    const text = formatAccountsToDiscordText(filteredOfficers, exportOptions);
    navigator.clipboard.writeText(text);
    setIsCopiedDiscord(true);
    setTimeout(() => setIsCopiedDiscord(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0F1319] border border-amber-500/60 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden text-gray-100 font-sans">
        
        {/* HEADER MODAL */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#17120A] via-[#241B0E] to-[#140F08] border-b border-amber-600/40 flex items-center justify-between relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-64 bg-gradient-to-l from-amber-500/10 to-transparent pointer-events-none"></div>

          <div className="flex items-center gap-3.5 z-10">
            <div className="w-12 h-12 rounded-xl bg-amber-950/80 border border-amber-500/70 p-1.5 flex items-center justify-center shrink-0 shadow-lg shadow-amber-950/50">
              <img src={HSPD_LOGO_URL} alt="HSPD" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-amber-200 tracking-wide font-mono flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-amber-400" />
                  <span>EKSPOR DATA & KREDENSIAL AKUN ANGGOTA</span>
                </h2>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/50 px-2 py-0.5 rounded font-mono font-bold uppercase hidden sm:inline-block">
                  AKSES ATASAN
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5 font-mono">
                Unduh rekapitulasi data anggota, nomor badge, pangkat, divisi, catatan SP, dan kredensial PIN login.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-white transition z-10"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STATISTIK RINGKAS */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-3 sm:p-4 bg-[#0A0D14] border-b border-gray-800 font-mono text-xs">
          <div className="p-2.5 bg-[#161B22] border border-gray-800 rounded-lg">
            <div className="text-[10px] text-gray-400">TOTAL ANGGOTA</div>
            <div className="text-base font-bold text-gray-100 flex items-center gap-1.5 mt-0.5">
              <Users className="w-4 h-4 text-blue-400" />
              <span>{stats.total} Akun</span>
            </div>
          </div>

          <div className="p-2.5 bg-[#161B22] border border-gray-800 rounded-lg">
            <div className="text-[10px] text-amber-400">COMMAND & SPV</div>
            <div className="text-base font-bold text-amber-300 flex items-center gap-1.5 mt-0.5">
              <Shield className="w-4 h-4 text-amber-400" />
              <span>{stats.atasanCount} Personel</span>
            </div>
          </div>

          <div className="p-2.5 bg-[#161B22] border border-gray-800 rounded-lg">
            <div className="text-[10px] text-cyan-400">POLICE OFFICERS</div>
            <div className="text-base font-bold text-cyan-300 flex items-center gap-1.5 mt-0.5">
              <Building2 className="w-4 h-4 text-cyan-400" />
              <span>{stats.officersCount} Personel</span>
            </div>
          </div>

          <div className="p-2.5 bg-[#161B22] border border-gray-800 rounded-lg">
            <div className="text-[10px] text-emerald-400">CADET POLICE</div>
            <div className="text-base font-bold text-emerald-300 flex items-center gap-1.5 mt-0.5">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>{stats.cadetCount} Siswa</span>
            </div>
          </div>

          <div className="p-2.5 bg-[#161B22] border border-gray-800 rounded-lg col-span-2 sm:col-span-1">
            <div className="text-[10px] text-rose-400">DENGAN CATATAN WARN</div>
            <div className="text-base font-bold text-rose-300 flex items-center gap-1.5 mt-0.5">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>{stats.warnedCount} Personel</span>
            </div>
          </div>
        </div>

        {/* TOMBOL AKSI EKSPOR BESAR */}
        <div className="p-3 sm:p-4 bg-[#12161F] border-b border-gray-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-bold text-amber-300 font-mono flex items-center gap-1.5">
              <Download className="w-4 h-4 text-amber-400" />
              <span>PILIH FORMAT EKSPOR DOKUMEN:</span>
            </span>

            {/* TOGGLE PIN KEAMANAN */}
            <button
              type="button"
              onClick={() => setIncludePin(!includePin)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold flex items-center gap-2 transition shadow-sm ${
                includePin
                  ? 'bg-amber-950/80 border-amber-500/80 text-amber-200'
                  : 'bg-gray-800/80 border-gray-700 text-gray-300 hover:text-white'
              }`}
              title="Jika dicentang, file ekspor akan menyertakan kode PIN login asli setiap anggota (Master List Kredensial). Jika tidak dicentang, PIN akan disamarkan sebagai ******."
            >
              {includePin ? (
                <>
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>Kredensial PIN: DISERTAKAN (Master List)</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-gray-400" />
                  <span>Kredensial PIN: DISEMBUNYIKAN (Publik)</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {/* 1. EXCEL (.XLSX) */}
            <button
              type="button"
              onClick={() => exportAccountsToExcel(filteredOfficers, exportOptions)}
              className="p-3 bg-gradient-to-r from-emerald-950/90 to-teal-950/90 hover:from-emerald-900 hover:to-teal-900 border border-emerald-500/80 hover:border-emerald-400 text-emerald-200 rounded-xl font-mono text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition shadow-md shadow-emerald-950/30 group active:scale-95"
            >
              <FileSpreadsheet className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span>EXCEL (.XLSX)</span>
              <span className="text-[10px] text-emerald-400/80 font-normal">Tabel Komplit Spreadsheet</span>
            </button>

            {/* 2. CSV FILE */}
            <button
              type="button"
              onClick={() => exportAccountsToCSV(filteredOfficers, exportOptions)}
              className="p-3 bg-gradient-to-r from-blue-950/90 to-cyan-950/90 hover:from-blue-900 hover:to-cyan-900 border border-blue-500/80 hover:border-blue-400 text-blue-200 rounded-xl font-mono text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition shadow-md shadow-blue-950/30 group active:scale-95"
            >
              <Download className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
              <span>CSV SPREADSHEET</span>
              <span className="text-[10px] text-blue-400/80 font-normal">Format Universal Comma-Separated</span>
            </button>

            {/* 3. JSON BACKUP */}
            <button
              type="button"
              onClick={() => exportAccountsToJSON(filteredOfficers, exportOptions)}
              className="p-3 bg-gradient-to-r from-purple-950/90 to-indigo-950/90 hover:from-purple-900 hover:to-indigo-900 border border-purple-500/80 hover:border-purple-400 text-purple-200 rounded-xl font-mono text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition shadow-md shadow-purple-950/30 group active:scale-95"
            >
              <FileText className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
              <span>BACKUP (.JSON)</span>
              <span className="text-[10px] text-purple-400/80 font-normal">Format Database Roster</span>
            </button>

            {/* 4. DISCORD FORMAT */}
            <button
              type="button"
              onClick={handleCopyDiscordFormat}
              className={`p-3 rounded-xl font-mono text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition shadow-md group active:scale-95 border ${
                isCopiedDiscord
                  ? 'bg-emerald-950 border-emerald-400 text-emerald-200'
                  : 'bg-gradient-to-r from-amber-950/90 to-orange-950/90 hover:from-amber-900 hover:to-orange-900 border-amber-500/80 hover:border-amber-400 text-amber-200 shadow-amber-950/30'
              }`}
            >
              {isCopiedDiscord ? (
                <>
                  <Check className="w-5 h-5 text-emerald-400 animate-bounce" />
                  <span>BERHASIL DISALIN!</span>
                  <span className="text-[10px] text-emerald-400 font-normal">Siap Tempel di Discord</span>
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
                  <span>SALIN DISCORD</span>
                  <span className="text-[10px] text-amber-400/80 font-normal">Markdown Roster Bertingkat</span>
                </>
              )}
            </button>

            {/* 5. CETAK / PDF */}
            <button
              type="button"
              onClick={() => printAccountsDocument(filteredOfficers, exportOptions)}
              className="p-3 bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 border border-gray-600 hover:border-gray-400 text-gray-200 rounded-xl font-mono text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition shadow-md group active:scale-95 col-span-2 sm:col-span-1"
            >
              <Printer className="w-5 h-5 text-gray-300 group-hover:scale-110 transition-transform" />
              <span>CETAK / PDF</span>
              <span className="text-[10px] text-gray-400 font-normal">Lembar Resmi Ber-Kop Surat</span>
            </button>
          </div>
        </div>

        {/* FILTER & PENCARIAN ANGGOTA */}
        <div className="p-3 bg-[#0D1117] border-b border-gray-800 flex flex-wrap items-center gap-2.5 text-xs font-mono">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama, nomor badge, pangkat, atau divisi..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#161B22] border border-gray-700 text-gray-200 text-xs placeholder-gray-500 focus:outline-hidden focus:border-amber-400 font-sans"
            />
          </div>

          <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto">
            <span className="text-gray-500 text-[11px] flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filter:
            </span>
            <select
              value={selectedRankCategory}
              onChange={(e) => setSelectedRankCategory(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-lg bg-[#161B22] border border-gray-700 text-gray-300 text-xs focus:outline-hidden focus:border-amber-400"
            >
              <option value="all">Semua Pangkat</option>
              <option value="command">Command Staff (Rank 6 & 5)</option>
              <option value="field">Field Command (Rank 4)</option>
              <option value="supervisor">Supervisors (Rank 3)</option>
              <option value="officer">Police Officers (Rank 2)</option>
              <option value="cadet">Cadet Police (Rank 1)</option>
            </select>

            <select
              value={warnFilter}
              onChange={(e) => setWarnFilter(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-lg bg-[#161B22] border border-gray-700 text-gray-300 text-xs focus:outline-hidden focus:border-amber-400"
            >
              <option value="all">Semua Status SP</option>
              <option value="warn_only">Hanya yang ada SP / Warn</option>
              <option value="no_warn">Bebas Pelanggaran</option>
            </select>
          </div>

          <div className="ml-auto text-[11px] text-gray-400 shrink-0">
            Menampilkan: <strong className="text-amber-400">{filteredOfficers.length}</strong> dari {roster.length} akun
          </div>
        </div>

        {/* TABEL LIVE PREVIEW DATA AKUN */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-[#0A0D14]">
          <div className="overflow-x-auto rounded-xl border border-gray-800 bg-[#161B22] shadow-inner">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-[#0D1117] text-gray-400 text-[11px] uppercase border-b border-gray-800 sticky top-0 z-10">
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center">No</th>
                  <th className="py-2.5 px-3 w-24">Badge</th>
                  <th className="py-2.5 px-3">Nama Anggota</th>
                  <th className="py-2.5 px-3">Pangkat</th>
                  <th className="py-2.5 px-3">Divisi</th>
                  <th className="py-2.5 px-3 w-28 text-amber-300">
                    <span className="flex items-center gap-1">
                      <KeyRound className="w-3.5 h-3.5" /> PIN Login
                    </span>
                  </th>
                  <th className="py-2.5 px-3 w-28">Telepon</th>
                  <th className="py-2.5 px-3 w-24 text-center">Status SP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 font-sans">
                {filteredOfficers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-gray-500 font-mono text-xs">
                      Tidak ada data akun anggota yang cocok dengan filter atau pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredOfficers.map((officer, idx) => {
                    const hasWarn = Array.isArray(officer.warnings) && officer.warnings.length > 0;
                    const isSuperior = isAtasanRank(officer.rank);

                    return (
                      <tr 
                        key={officer.id ? `${officer.id}-${idx}` : `${officer.badge}-${idx}`}
                        className="hover:bg-gray-800/30 transition-colors"
                      >
                        <td className="py-2 px-3 text-center text-gray-500 font-mono text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3 font-mono font-bold text-amber-400 text-xs">
                          {officer.badge || '-'}
                        </td>
                        <td className="py-2 px-3 font-semibold text-gray-100 text-xs">
                          {officer.name}
                          {officer.discordTag && (
                            <span className="block text-[10px] text-gray-500 font-mono">
                              Discord: {officer.discordTag}
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                            isSuperior
                              ? 'bg-amber-950/70 border-amber-600/70 text-amber-300'
                              : 'bg-blue-950/70 border-blue-600/70 text-blue-300'
                          }`}>
                            {officer.rank || '-'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-xs text-gray-300">
                          {officer.division || 'Patrol Division'}
                        </td>
                        <td className="py-2 px-3 font-mono font-bold text-xs">
                          {includePin ? (
                            <span className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-700/60 text-amber-300">
                              {officer.pin || '10-4'}
                            </span>
                          ) : (
                            <span className="text-gray-500">
                              ••••••
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 font-mono text-gray-400 text-xs">
                          {officer.phone || '-'}
                        </td>
                        <td className="py-2 px-3 text-center font-mono">
                          {hasWarn ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-950/80 border border-rose-700/70 text-rose-300 text-[10px] font-bold">
                              <AlertTriangle className="w-3 h-3" />
                              <span>{officer.warnings!.length} SP</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 text-[10px]">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Bebas</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* FOOTER MODAL */}
        <div className="p-3 sm:p-4 bg-[#0D1117] border-t border-gray-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 text-gray-400 text-[11px]">
            <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              Dokumen ini berisi informasi kredensial resmi kepolisian. Pastikan pendistribusian dilakukan sesuai regulasi SOP internal.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-xs font-bold transition"
            >
              Tutup
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
