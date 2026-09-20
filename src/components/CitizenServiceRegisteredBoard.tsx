import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  FileText,
  Shield,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  Phone,
  MapPin,
  Calendar,
  PenTool,
  Printer,
  Trash2,
  Camera,
  Crown,
  UserCheck,
  ExternalLink,
  ChevronRight,
  PlusCircle,
  RefreshCw,
  Stamp,
  Eye,
  Info,
  FileCheck
} from 'lucide-react';
import { OfficialDocument, OfficerProfile, isRank2OrAbove } from '../types';
import { OfficialSeal } from './OfficialSeals';

interface Props {
  documents: OfficialDocument[];
  currentOfficer?: OfficerProfile | null;
  onOpenSignatoryModal: (doc: OfficialDocument) => void;
  onOpenPrintPreview: (doc: OfficialDocument) => void;
  onOpenLightbox: (item: { url: string; title: string; subtitle?: string }) => void;
  onDeleteDocument: (docId: string) => void;
  onSwitchToCreateForm?: () => void;
  onRefreshData?: () => void;
}

export const CitizenServiceRegisteredBoard: React.FC<Props> = ({
  documents = [],
  currentOfficer,
  onOpenSignatoryModal,
  onOpenPrintPreview,
  onOpenLightbox,
  onDeleteDocument,
  onSwitchToCreateForm,
  onRefreshData
}) => {
  const safeDocs = Array.isArray(documents) ? documents : [];
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'SKCK' | 'IZIN_USAHA' | 'IZIN_SENJATA' | 'SURAT_KETERANGAN' | 'IZIN_KERAMAIAN'>('ALL');
  const [signatureStatusFilter, setSignatureStatusFilter] = useState<'ALL' | 'NEED_OFFICER' | 'NEED_HIGH_OFFICIAL' | 'FULLY_SIGNED' | 'REJECTED'>('ALL');

  // Filtered Documents
  const filteredDocs = useMemo(() => {
    return safeDocs.filter((doc) => {
      // Category filter
      if (categoryFilter !== 'ALL' && doc.category !== categoryFilter) {
        return false;
      }

      // Signature status filter
      const officerSigned = doc.officerSignatureStatus === 'SIGNED' || Boolean(doc.officerSignatureName);
      const highOfficialSigned = doc.highOfficialSignatureStatus === 'SIGNED' || Boolean(doc.highOfficialSignatureName);

      if (signatureStatusFilter === 'NEED_OFFICER' && officerSigned) return false;
      if (signatureStatusFilter === 'NEED_HIGH_OFFICIAL' && highOfficialSigned) return false;
      if (signatureStatusFilter === 'FULLY_SIGNED' && (!officerSigned || !highOfficialSigned)) return false;
      if (signatureStatusFilter === 'REJECTED' && doc.documentStatus !== 'REJECTED') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNumber = doc.docNumber.toLowerCase().includes(q);
        const matchName = doc.recipientName.toLowerCase().includes(q);
        const matchId = (doc.recipientId || '').toLowerCase().includes(q);
        const matchTitle = doc.title.toLowerCase().includes(q);
        const matchPhone = (doc.recipientPhone || '').toLowerCase().includes(q);
        const matchSubject = (doc.subject || '').toLowerCase().includes(q);

        if (!matchNumber && !matchName && !matchId && !matchTitle && !matchPhone && !matchSubject) {
          return false;
        }
      }

      return true;
    });
  }, [safeDocs, categoryFilter, signatureStatusFilter, searchQuery]);

  // Statistics calculation
  const stats = useMemo(() => {
    let total = safeDocs.length;
    let needOfficer = 0;
    let needHighOfficial = 0;
    let fullyApproved = 0;

    safeDocs.forEach((d) => {
      const offSigned = d.officerSignatureStatus === 'SIGNED' || Boolean(d.officerSignatureName);
      const highSigned = d.highOfficialSignatureStatus === 'SIGNED' || Boolean(d.highOfficialSignatureName);

      if (!offSigned) needOfficer++;
      if (!highSigned) needHighOfficial++;
      if (offSigned && highSigned && d.documentStatus !== 'REJECTED') fullyApproved++;
    });

    return { total, needOfficer, needHighOfficial, fullyApproved };
  }, [safeDocs]);

  const canEditSignatures = isRank2OrAbove(currentOfficer?.rank);

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* HEADER HERO NOTICE BANNER */}
      <div className={`bg-gradient-to-r ${
        currentOfficer 
          ? 'from-blue-950/80 via-[#121722] to-amber-950/60 border-blue-800/40' 
          : 'from-slate-900 via-[#111724] to-emerald-950/60 border-emerald-800/40'
      } border rounded-2xl p-5 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4`}>
        <div className="flex items-start gap-3.5">
          <div className={`p-3 ${
            currentOfficer 
              ? 'bg-blue-600/20 border-blue-500/40 text-blue-400' 
              : 'bg-emerald-600/20 border-emerald-500/40 text-emerald-400'
          } border rounded-xl shrink-0`}>
            {currentOfficer ? <Shield className="w-7 h-7" /> : <FileCheck className="w-7 h-7" />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {currentOfficer 
                  ? 'PORTAL VERIFIKASI & PENGESAHAN DOKUMEN WARGA (HSPD & PEMERINTAHAN)' 
                  : 'LACAK STATUS PERMOHONAN & CETAK DOKUMEN RESMI WARGA'}
              </h2>
              <span className={`text-[10px] font-mono ${
                currentOfficer 
                  ? 'bg-blue-900/70 text-blue-300 border-blue-700/60' 
                  : 'bg-emerald-900/70 text-emerald-300 border-emerald-700/60'
              } border px-2 py-0.5 rounded font-bold`}>
                {currentOfficer ? 'PANEL OPERASIONAL PETUGAS' : 'LAYANAN MANDIRI PUBLIK'}
              </span>
            </div>
            <p className="text-xs text-gray-300 mt-1 max-w-3xl leading-relaxed">
              {currentOfficer 
                ? 'Panel khusus personel kepolisian dan aparatur pemerintahan untuk memeriksa surat permohonan warga yang telah didaftarkan, mengunggah pengesahan tanda tangan petugas (Rank 2 s/d Atasan), dan mengotorisasi stempel pimpinan resmi.'
                : 'Layanan mandiri warga sipil untuk mengecek status verifikasi dan pengesahan berkas (SKCK, Izin Usaha, Lisensi Senjata WCL, Kehilangan STLK, atau Izin Acara). Masukkan Nama, NIK, atau Nomor Surat di kolom pencarian untuk mencetak/mengunduh dokumen Anda.'}
            </p>
          </div>
        </div>

        {Boolean(currentOfficer) && onSwitchToCreateForm && (
          <button
            type="button"
            onClick={onSwitchToCreateForm}
            className="shrink-0 px-3.5 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-lg text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-amber-950/50 active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Input Permohonan Walk-In</span>
          </button>
        )}
      </div>

      {/* QUICK STATS CARDS */}
      {currentOfficer ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-[#121622] border border-gray-800 rounded-xl p-3.5 sm:p-4 shadow">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-gray-400">Total Berkas Terdaftar</span>
              <FileText className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-white mt-1.5">{stats.total}</div>
            <span className="text-[10px] text-gray-500 font-mono">Seluruh permohonan masuk</span>
          </div>

          <div className="bg-[#121622] border border-blue-900/50 rounded-xl p-3.5 sm:p-4 shadow">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-blue-300">Menunggu TTD Petugas (Rank 2+)</span>
              <UserCheck className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-blue-400 mt-1.5">{stats.needOfficer}</div>
            <span className="text-[10px] text-blue-400/80 font-mono">Perlu tanda tangan pelaksana</span>
          </div>

          <div className="bg-[#121622] border border-amber-900/50 rounded-xl p-3.5 sm:p-4 shadow">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-amber-300">Menunggu Pengesahan Petinggi</span>
              <Crown className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-amber-400 mt-1.5">{stats.needHighOfficial}</div>
            <span className="text-[10px] text-amber-400/80 font-mono">Perlu otorisasi pimpinan</span>
          </div>

          <div className="bg-[#121622] border border-emerald-900/50 rounded-xl p-3.5 sm:p-4 shadow">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-emerald-300">Disahkan Lengkap & Sah</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-1.5">{stats.fullyApproved}</div>
            <span className="text-[10px] text-emerald-400/80 font-mono">Siap cetak berkekuatan hukum</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-[#121622] border border-gray-800 rounded-xl p-3.5 sm:p-4 shadow">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-gray-400">Total Berkas Terdata</span>
              <FileText className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-white mt-1.5">{stats.total}</div>
            <span className="text-[10px] text-gray-500 font-mono">Arsip resmi tersimpan</span>
          </div>

          <div className="bg-[#121622] border border-emerald-900/50 rounded-xl p-3.5 sm:p-4 shadow">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-emerald-300">Surat Sah & Siap Cetak</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-1.5">{stats.fullyApproved}</div>
            <span className="text-[10px] text-emerald-400/80 font-mono">Dapat langsung Anda unduh/cetak</span>
          </div>

          <div className="bg-[#121622] border border-amber-900/50 rounded-xl p-3.5 sm:p-4 shadow">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-amber-300">Dalam Proses Pengesahan</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-amber-400 mt-1.5">{stats.needOfficer + stats.needHighOfficial}</div>
            <span className="text-[10px] text-amber-400/80 font-mono">Menunggu verifikasi kepolisian/instansi</span>
          </div>
        </div>
      )}

      {/* CITIZEN HELPFUL GUIDANCE BANNER */}
      {!currentOfficer && (
        <div className="bg-gradient-to-r from-blue-950/60 via-[#101726] to-blue-950/60 border border-blue-800/60 rounded-xl p-3.5 flex items-start gap-3 shadow">
          <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-200 leading-relaxed">
            <p className="font-semibold text-blue-100">Petunjuk Pencarian Surat Warga:</p>
            <p className="text-blue-300/90 mt-0.5">
              Gunakan kolom pencarian di bawah untuk mencari dengan <strong>Nama Lengkap Anda</strong>, <strong>NIK (CID)</strong>, atau <strong>Nomor Registrasi Surat</strong>. Jika surat Anda sudah berstatus <span className="text-emerald-300 font-mono font-bold">SAH & DISAHKAN LENGKAP</span>, klik tombol <span className="text-emerald-300 font-bold">Cetak / Unduh</span> untuk menyimpan atau mencetak dokumen dinas Anda.
            </p>
          </div>
        </div>
      )}

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="bg-[#111622] border border-gray-800 rounded-xl p-4 shadow space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          
          {/* SEARCH INPUT */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama warga pemohon, nomor registrasi surat, NIK, kontak, atau nama usaha..."
              className="w-full bg-[#090C12] border border-gray-700 focus:border-blue-500 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* REFRESH BUTTON */}
          {onRefreshData && (
            <button
              type="button"
              onClick={onRefreshData}
              className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-mono flex items-center gap-1.5 transition"
              title="Sinkronisasi Data"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Refresh Data</span>
            </button>
          )}
        </div>

        {/* CATEGORY & SIGNATURE STATUS PILLS */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-800/80 text-xs">
          
          {/* CATEGORY FILTER */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none font-medium">
            <span className="text-gray-400 text-[11px] font-mono mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Jenis:
            </span>
            <button
              type="button"
              onClick={() => setCategoryFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap text-[11px] ${
                categoryFilter === 'ALL'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-[#090C12] text-gray-400 hover:text-white border border-gray-800'
              }`}
            >
              Semua ({documents.length})
            </button>

            <button
              type="button"
              onClick={() => setCategoryFilter('SKCK')}
              className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap text-[11px] ${
                categoryFilter === 'SKCK'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-[#090C12] text-gray-400 hover:text-white border border-gray-800'
              }`}
            >
              SKCK Polisi
            </button>

            <button
              type="button"
              onClick={() => setCategoryFilter('IZIN_USAHA')}
              className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap text-[11px] ${
                categoryFilter === 'IZIN_USAHA'
                  ? 'bg-amber-600 text-white font-bold'
                  : 'bg-[#090C12] text-gray-400 hover:text-white border border-gray-800'
              }`}
            >
              Izin Usaha / NIB
            </button>

            <button
              type="button"
              onClick={() => setCategoryFilter('IZIN_SENJATA')}
              className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap text-[11px] ${
                categoryFilter === 'IZIN_SENJATA'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-[#090C12] text-gray-400 hover:text-white border border-gray-800'
              }`}
            >
              Lisensi WCL Senjata
            </button>

            <button
              type="button"
              onClick={() => setCategoryFilter('SURAT_KETERANGAN')}
              className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap text-[11px] ${
                categoryFilter === 'SURAT_KETERANGAN'
                  ? 'bg-purple-600 text-white font-bold'
                  : 'bg-[#090C12] text-gray-400 hover:text-white border border-gray-800'
              }`}
            >
              Kehilangan STLK
            </button>

            <button
              type="button"
              onClick={() => setCategoryFilter('IZIN_KERAMAIAN')}
              className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap text-[11px] ${
                categoryFilter === 'IZIN_KERAMAIAN'
                  ? 'bg-rose-600 text-white font-bold'
                  : 'bg-[#090C12] text-gray-400 hover:text-white border border-gray-800'
              }`}
            >
              Izin Keramaian
            </button>
          </div>

          {/* SIGNATURE STATUS FILTER */}
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <span className="text-gray-400">Status TTD:</span>
            <select
              value={signatureStatusFilter}
              onChange={(e) => setSignatureStatusFilter(e.target.value as any)}
              className="bg-[#090C12] border border-gray-700 text-gray-200 rounded px-2 py-1 text-[11px] focus:outline-none"
            >
              <option value="ALL">Semua Dokumen</option>
              <option value="NEED_OFFICER">⚠️ Perlu TTD Petugas</option>
              <option value="NEED_HIGH_OFFICIAL">👑 Perlu TTD Petinggi</option>
              <option value="FULLY_SIGNED">✓ TTD Lengkap & Sah</option>
              <option value="REJECTED">✖ Status Ditolak</option>
            </select>
          </div>

        </div>
      </div>

      {/* REGISTERED DATA LISTING */}
      {filteredDocs.length === 0 ? (
        <div className="bg-[#111622] border border-gray-800 rounded-2xl p-10 text-center space-y-3">
          <FileText className="w-12 h-12 text-gray-600 mx-auto" />
          <h3 className="font-bold text-gray-300 text-sm">Tidak Ada Dokumen Yang Sesuai Kriteria Filter</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            {searchQuery 
              ? `Tidak ditemukan berkas pendaftaran dengan kata kunci "${searchQuery}". Coba ubah kata kunci atau bersihkan filter pencarian.` 
              : 'Belum ada surat yang terdaftar dalam kategori ini. Warga dapat mengisi formulir pengajuan melalui portal layanan sipil.'}
          </p>
          {onSwitchToCreateForm && (
            <button
              type="button"
              onClick={onSwitchToCreateForm}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold font-sans inline-flex items-center gap-1.5 mt-2 transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Input Berkas Permohonan Baru</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDocs.map((doc) => {
            const isSkck = doc.category === 'SKCK';
            const isBiz = doc.category === 'IZIN_USAHA';
            const isWcl = doc.category === 'IZIN_SENJATA';
            const isStlk = (doc.category as string) === 'SURAT_KEHILANGAN' || (doc.category as string) === 'SURAT_KETERANGAN';
            const isEvt = doc.category === 'IZIN_KERAMAIAN';

            const officerSigned = doc.officerSignatureStatus === 'SIGNED' || Boolean(doc.officerSignatureName);
            const highOfficialSigned = doc.highOfficialSignatureStatus === 'SIGNED' || Boolean(doc.highOfficialSignatureName);
            const isApproved = doc.documentStatus === 'APPROVED' || (!doc.documentStatus && officerSigned);
            const isRejected = doc.documentStatus === 'REJECTED';

            const offName = doc.officerSignatureName || doc.issuerName || 'Amy Santiago';
            const offRank = doc.officerSignatureRank || doc.issuerRank || 'POLICE OFFICER II [PO II]';
            const offBadge = doc.officerSignatureBadge || doc.issuerBadge || '#215';

            const highName = doc.highOfficialSignatureName || doc.acknowledgedByName || (isBiz ? 'Momo Hatakeyama' : 'Jackie Xianlao');
            const highRank = doc.highOfficialSignatureRank || doc.acknowledgedByRank || (isBiz ? 'PRESIDENT [RANK 6]' : 'CHIEF OF POLICE [COP]');

            // Check if there are attached photos
            const hasSkckPhotos = Boolean(doc.skckPhotos?.statsPhoto || doc.skckPhotos?.ktpPhoto);
            const hasBizPhotos = Boolean(
              doc.businessPhotos?.shopFrontPhoto ||
              doc.businessPhotos?.businessInfoPhoto ||
              doc.businessPhotos?.businessPropertyPhoto ||
              doc.businessPhotos?.ktpPhoto
            );

            return (
              <div
                key={doc.id}
                className="bg-[#111622] border border-gray-800 hover:border-blue-900/80 rounded-xl p-4 sm:p-5 shadow-lg transition-all space-y-4"
              >
                {/* CARD TOP BAR */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-gray-800/80 pb-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded border ${
                      isSkck
                        ? 'bg-blue-950/80 border-blue-700/60 text-blue-300'
                        : isBiz
                        ? 'bg-amber-950/80 border-amber-700/60 text-amber-300'
                        : isWcl
                        ? 'bg-emerald-950/80 border-emerald-700/60 text-emerald-300'
                        : isStlk
                        ? 'bg-purple-950/80 border-purple-700/60 text-purple-300'
                        : 'bg-rose-950/80 border-rose-700/60 text-rose-300'
                    }`}>
                      {doc.category.replace('_', ' ')}
                    </span>

                    <span className="font-mono text-xs font-bold text-gray-200">
                      {doc.docNumber}
                    </span>

                    <span className="text-gray-500 hidden sm:inline">•</span>

                    <span className="text-[11px] text-gray-400 flex items-center gap-1 font-mono">
                      <Calendar className="w-3 h-3 text-gray-500" />
                      {doc.date}
                    </span>
                  </div>

                  {/* OVERALL LEGAL STATUS BADGE */}
                  <div>
                    {isRejected ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-950/80 border border-rose-600 text-rose-300">
                        <AlertTriangle className="w-3 h-3" /> DITOLAK (REJECTED)
                      </span>
                    ) : officerSigned && highOfficialSigned ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-600 text-emerald-300">
                        <CheckCircle2 className="w-3 h-3" /> SAH & DISAHKAN LENGKAP
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-950/80 border border-amber-600 text-amber-300">
                        <Clock className="w-3 h-3" /> MENUNGGU OTORISASI TTD
                      </span>
                    )}
                  </div>
                </div>

                {/* CARD BODY: APPLICANT INFO & SUBJECT */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
                  
                  {/* LEFT: APPLICANT IDENTIFICATION (7 COLS) */}
                  <div className="md:col-span-7 space-y-2">
                    <div className="flex items-baseline gap-2">
                      <h4 className="font-bold text-sm text-white hover:text-blue-400 transition">
                        {doc.title}
                      </h4>
                    </div>

                    <div className="bg-[#0A0D14] border border-gray-800 rounded-lg p-3 space-y-1.5 font-sans">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-[11px]">Nama Warga Pemohon:</span>
                        <span className="font-bold text-amber-300 text-xs flex items-center gap-1">
                          <User className="w-3 h-3 text-amber-400" />
                          {doc.recipientName}
                        </span>
                      </div>

                      <div className="flex items-center justify-between font-mono text-[11px]">
                        <span className="text-gray-400">NIK / CID Pemohon:</span>
                        <span className="text-gray-300">{doc.recipientId || 'CID Terlampir'}</span>
                      </div>

                      {doc.recipientPhone && (
                        <div className="flex items-center justify-between font-mono text-[11px]">
                          <span className="text-gray-400">Kontak Telepon:</span>
                          <span className="text-gray-300 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-gray-500" />
                            {doc.recipientPhone}
                          </span>
                        </div>
                      )}

                      {doc.recipientAddress && (
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-gray-400">Alamat Domisili:</span>
                          <span className="text-gray-300 truncate max-w-[220px]">
                            {doc.recipientAddress}
                          </span>
                        </div>
                      )}

                      <div className="pt-1 border-t border-gray-800 text-[11px] text-gray-300 leading-snug">
                        <span className="text-gray-400">Perihal:</span> {doc.subject}
                      </div>
                    </div>

                    {/* ATTACHED EVIDENCE PHOTOS ROW (ONLY VISIBLE FOR OFFICERS, HIDDEN FOR CITIZENS) */}
                    {Boolean(currentOfficer) && (hasSkckPhotos || hasBizPhotos) && (
                      <div className="pt-1">
                        <span className="text-[10px] font-mono text-gray-400 block mb-1 flex items-center gap-1">
                          <Camera className="w-3 h-3 text-blue-400" />
                          Lampiran Foto Dokumen Warga:
                        </span>

                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {/* SKCK PHOTOS */}
                          {doc.skckPhotos?.statsPhoto && (
                            <div
                              onClick={() => onOpenLightbox({ url: doc.skckPhotos!.statsPhoto!, title: 'Lampiran /stats Pemohon', subtitle: doc.recipientName })}
                              className="group cursor-pointer relative rounded border border-blue-700/60 overflow-hidden bg-black/60 hover:border-blue-400 transition shrink-0 w-20 h-14"
                            >
                              <img src={doc.skckPhotos.statsPhoto} alt="/stats" className="w-full h-full object-cover" />
                              <span className="absolute bottom-0 inset-x-0 bg-black/80 text-[8px] text-center font-mono py-0.5 text-blue-300">
                                /stats
                              </span>
                            </div>
                          )}

                          {doc.skckPhotos?.ktpPhoto && (
                            <div
                              onClick={() => onOpenLightbox({ url: doc.skckPhotos!.ktpPhoto!, title: 'Lampiran KTP Pemohon', subtitle: doc.recipientName })}
                              className="group cursor-pointer relative rounded border border-blue-700/60 overflow-hidden bg-black/60 hover:border-blue-400 transition shrink-0 w-20 h-14"
                            >
                              <img src={doc.skckPhotos.ktpPhoto} alt="KTP" className="w-full h-full object-cover" />
                              <span className="absolute bottom-0 inset-x-0 bg-black/80 text-[8px] text-center font-mono py-0.5 text-blue-300">
                                KTP
                              </span>
                            </div>
                          )}

                          {/* BUSINESS PHOTOS */}
                          {doc.businessPhotos?.shopFrontPhoto && (
                            <div
                              onClick={() => onOpenLightbox({ url: doc.businessPhotos!.shopFrontPhoto!, title: 'Foto Depan Toko', subtitle: doc.recipientName })}
                              className="group cursor-pointer relative rounded border border-amber-700/60 overflow-hidden bg-black/60 hover:border-amber-400 transition shrink-0 w-20 h-14"
                            >
                              <img src={doc.businessPhotos.shopFrontPhoto} alt="Depan Toko" className="w-full h-full object-cover" />
                              <span className="absolute bottom-0 inset-x-0 bg-black/80 text-[8px] text-center font-mono py-0.5 text-amber-300">
                                Depan
                              </span>
                            </div>
                          )}

                          {doc.businessPhotos?.businessInfoPhoto && (
                            <div
                              onClick={() => onOpenLightbox({ url: doc.businessPhotos!.businessInfoPhoto!, title: 'Screenshot /business info', subtitle: doc.recipientName })}
                              className="group cursor-pointer relative rounded border border-amber-700/60 overflow-hidden bg-black/60 hover:border-amber-400 transition shrink-0 w-20 h-14"
                            >
                              <img src={doc.businessPhotos.businessInfoPhoto} alt="Info" className="w-full h-full object-cover" />
                              <span className="absolute bottom-0 inset-x-0 bg-black/80 text-[8px] text-center font-mono py-0.5 text-amber-300">
                                /biz info
                              </span>
                            </div>
                          )}

                          {doc.businessPhotos?.businessPropertyPhoto && (
                            <div
                              onClick={() => onOpenLightbox({ url: doc.businessPhotos!.businessPropertyPhoto!, title: 'Foto Properti Usaha', subtitle: doc.recipientName })}
                              className="group cursor-pointer relative rounded border border-amber-700/60 overflow-hidden bg-black/60 hover:border-amber-400 transition shrink-0 w-20 h-14"
                            >
                              <img src={doc.businessPhotos.businessPropertyPhoto} alt="Properti" className="w-full h-full object-cover" />
                              <span className="absolute bottom-0 inset-x-0 bg-black/80 text-[8px] text-center font-mono py-0.5 text-amber-300">
                                Properti
                              </span>
                            </div>
                          )}

                          {doc.businessPhotos?.ktpPhoto && (
                            <div
                              onClick={() => onOpenLightbox({ url: doc.businessPhotos!.ktpPhoto!, title: 'Foto KTP Pemilik Usaha', subtitle: doc.recipientName })}
                              className="group cursor-pointer relative rounded border border-amber-700/60 overflow-hidden bg-black/60 hover:border-amber-400 transition shrink-0 w-20 h-14"
                            >
                              <img src={doc.businessPhotos.ktpPhoto} alt="KTP Pemilik" className="w-full h-full object-cover" />
                              <span className="absolute bottom-0 inset-x-0 bg-black/80 text-[8px] text-center font-mono py-0.5 text-amber-300">
                                KTP
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* RIGHT: SIGNATORIES STATUS (5 COLS) */}
                  <div className="md:col-span-5 bg-[#0A0D14] border border-gray-800 rounded-xl p-3.5 space-y-3 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-gray-400 block mb-2 uppercase tracking-wide">
                        STATUS OTORISASI PENANDATANGAN
                      </span>

                      {/* 1. PETUGAS PELAKSANA (RANK 2 S/D ATASAN) */}
                      <div className="p-2.5 rounded-lg border border-blue-900/50 bg-blue-950/20 mb-2 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-blue-300 flex items-center gap-1 font-mono">
                            <UserCheck className="w-3.5 h-3.5" />
                            1. PETUGAS PELAKSANA (RANK 2+)
                          </span>
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                            officerSigned 
                              ? 'bg-emerald-950 border-emerald-600 text-emerald-300' 
                              : 'bg-amber-950 border-amber-600 text-amber-300'
                          }`}>
                            {officerSigned ? '✓ DITANDATANGANI' : '⏳ MENUNGGU TTD'}
                          </span>
                        </div>

                        <div className="text-xs font-bold text-white truncate">
                          {offName}
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono truncate">
                          {offRank} [{offBadge}]
                        </div>
                      </div>

                      {/* 2. PETINGGI / ATASAN PENGESAH */}
                      <div className="p-2.5 rounded-lg border border-amber-900/50 bg-amber-950/20 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-amber-300 flex items-center gap-1 font-mono">
                            <Crown className="w-3.5 h-3.5" />
                            2. PETINGGI / ATASAN PENGESAH
                          </span>
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                            highOfficialSigned 
                              ? 'bg-emerald-950 border-emerald-600 text-emerald-300' 
                              : 'bg-amber-950 border-amber-600 text-amber-300'
                          }`}>
                            {highOfficialSigned ? '✓ DISAHKAN' : '⏳ MENUNGGU SAH'}
                          </span>
                        </div>

                        <div className="text-xs font-bold text-white truncate">
                          {highName}
                        </div>
                        <div className="text-[10px] text-amber-400/90 font-mono truncate">
                          {highRank}
                        </div>
                      </div>
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="pt-2 border-t border-gray-800 flex items-center gap-2">
                      {Boolean(currentOfficer) && (
                        <button
                          type="button"
                          onClick={() => onOpenSignatoryModal(doc)}
                          className="flex-1 py-1.5 px-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition shadow"
                          title="Tanda tangan manual nama petugas (Rank 2 s/d Atasan) dan petinggi pengesah"
                        >
                          <PenTool className="w-3.5 h-3.5" />
                          <span>Kelola TTD (Rank 2+)</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onOpenPrintPreview(doc)}
                        className={`${
                          currentOfficer
                            ? 'py-1.5 px-2.5 bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700'
                            : 'flex-1 py-2 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold shadow-md shadow-emerald-950/40 ring-1 ring-emerald-400/40'
                        } rounded-lg text-xs flex items-center justify-center gap-1.5 transition`}
                        title="Lihat fisik surat dinas & cetak"
                      >
                        <Printer className="w-3.5 h-3.5 text-amber-300" />
                        <span>{currentOfficer ? 'Cetak' : '🖨️ Cetak / Unduh Dokumen Resmi'}</span>
                      </button>

                      {Boolean(currentOfficer) && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Yakin ingin menghapus berkas ${doc.docNumber} (${doc.recipientName}) dari database?`)) {
                              onDeleteDocument(doc.id);
                            }
                          }}
                          className="p-1.5 bg-rose-950/40 hover:bg-rose-900 border border-rose-800/60 text-rose-300 rounded-lg transition"
                          title="Hapus Berkas (Khusus Petugas)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
