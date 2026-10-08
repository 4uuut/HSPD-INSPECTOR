import React, { useState } from 'react';
import { 
  Shield, Plus, Search, Filter, MapPin, Calendar, Clock, 
  Users, AlertTriangle, CheckCircle, Crosshair, Sparkles, 
  Flame, Radio, Send, Eye, Edit3, Trash2, Printer, ExternalLink,
  ChevronRight, Award, Image as ImageIcon
} from 'lucide-react';
import { DivisionCaseFile, OfficerProfile } from '../../types';
import { sendDivisionCaseFileToDiscord } from '../../utils/divisionCaseWebhook';
import { DivisionCaseFileDetailModal } from './DivisionCaseFileDetailModal';
import { CreateDivisionCaseFileModal } from './CreateDivisionCaseFileModal';

interface Props {
  caseFiles: DivisionCaseFile[];
  onUpdateCaseFiles: (cases: DivisionCaseFile[]) => void;
  currentOfficer: OfficerProfile | null;
  activeFilterDivision?: string;
  onFilterDivisionChange?: (div: string) => void;
}

export const DivisionCaseFilesBoard: React.FC<Props> = ({
  caseFiles,
  onUpdateCaseFiles,
  currentOfficer,
  activeFilterDivision = 'ALL',
  onFilterDivisionChange
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDivision, setSelectedDivision] = useState<string>(activeFilterDivision);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Modals state
  const [selectedCaseForDetail, setSelectedCaseForDetail] = useState<DivisionCaseFile | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<DivisionCaseFile | null>(null);
  const [sendingDiscordId, setSendingDiscordId] = useState<string | null>(null);
  const [discordNotification, setDiscordNotification] = useState<string | null>(null);

  // Sync with prop if provided
  const currentDivFilter = onFilterDivisionChange ? activeFilterDivision : selectedDivision;
  const setDivFilter = (div: string) => {
    if (onFilterDivisionChange) onFilterDivisionChange(div);
    setSelectedDivision(div);
  };

  // Filter logic
  const filteredCases = caseFiles.filter(c => {
    if (currentDivFilter !== 'ALL' && c.division !== currentDivFilter) return false;
    if (selectedStatus !== 'ALL' && c.outcomeStatus !== selectedStatus) return false;
    if (selectedCategory !== 'ALL' && c.category !== selectedCategory) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNum = c.caseNumber.toLowerCase().includes(q);
      const matchTitle = c.caseTitle.toLowerCase().includes(q);
      const matchLoc = c.location.toLowerCase().includes(q);
      const matchCmd = c.commanderName.toLowerCase().includes(q) || c.commanderBadge.toLowerCase().includes(q);
      const matchSuspect = (c.suspectAffiliation || '').toLowerCase().includes(q);
      const matchWeap = c.policeWeapons.some(w => w.toLowerCase().includes(q)) || c.suspectWeapons.some(w => w.toLowerCase().includes(q));
      if (!matchNum && !matchTitle && !matchLoc && !matchCmd && !matchSuspect && !matchWeap) return false;
    }

    return true;
  });

  // Calculate Metrics
  const totalCases = caseFiles.length;
  const totalSuccess = caseFiles.filter(c => c.outcomeStatus === 'BERHASIL').length;
  const successRate = totalCases > 0 ? Math.round((totalSuccess / totalCases) * 100) : 100;
  const totalOfficersInvolved = caseFiles.reduce((acc, curr) => acc + (curr.officersCount || 0), 0);
  const totalSuspectsHandled = caseFiles.reduce((acc, curr) => acc + (curr.suspectsCount || 0), 0);

  const getDivisionBadgeColor = (div: string) => {
    switch (div) {
      case 'SWAT': return 'bg-red-600 text-white border-red-500';
      case 'ASD': return 'bg-blue-600 text-white border-blue-500';
      case 'K9': return 'bg-amber-600 text-white border-amber-500';
      case 'TED': return 'bg-sky-600 text-white border-sky-500';
      case 'IAD': return 'bg-purple-600 text-white border-purple-500';
      case 'ACADEMY': return 'bg-emerald-600 text-white border-emerald-500';
      case 'PATROL': return 'bg-indigo-600 text-white border-indigo-500';
      case 'DETECTIVE': return 'bg-teal-600 text-white border-teal-500';
      default: return 'bg-gray-700 text-white border-gray-600';
    }
  };

  const handleSaveCase = (newOrUpdated: DivisionCaseFile) => {
    const idx = caseFiles.findIndex(c => c.id === newOrUpdated.id);
    let updated: DivisionCaseFile[];
    if (idx >= 0) {
      updated = [...caseFiles];
      updated[idx] = newOrUpdated;
    } else {
      updated = [newOrUpdated, ...caseFiles];
    }
    onUpdateCaseFiles(updated);
  };

  const handleDeleteCase = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Apakah Anda yakin ingin menghapus arsip berkas kasus operasional ini?')) {
      const updated = caseFiles.filter(c => c.id !== id);
      onUpdateCaseFiles(updated);
    }
  };

  const handleSendDiscordQuick = async (c: DivisionCaseFile, e: React.MouseEvent) => {
    e.stopPropagation();
    setSendingDiscordId(c.id);
    setDiscordNotification(null);
    try {
      const res = await sendDivisionCaseFileToDiscord(c);
      setDiscordNotification(res.message);
      setTimeout(() => setDiscordNotification(null), 4000);
    } catch (err: any) {
      setDiscordNotification(err?.message || 'Gagal mengirim ke Discord.');
    } finally {
      setSendingDiscordId(null);
    }
  };

  return (
    <div className="space-y-4 font-sans text-xs">
      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 bg-gradient-to-br from-[#101726] to-[#0D121F] rounded-xl border border-blue-900/40 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[10px] text-gray-400 uppercase font-mono font-bold">Total Case Files</div>
            <div className="text-xl font-black text-white font-mono mt-0.5">{totalCases} Berkas</div>
            <div className="text-[10px] text-blue-400">Seluruh Divisi Aktif</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
            📂
          </div>
        </div>

        <div className="p-3 bg-gradient-to-br from-[#101726] to-[#0D121F] rounded-xl border border-emerald-900/40 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[10px] text-gray-400 uppercase font-mono font-bold">Tingkat Keberhasilan</div>
            <div className="text-xl font-black text-emerald-400 font-mono mt-0.5">{successRate}%</div>
            <div className="text-[10px] text-emerald-400/80">{totalSuccess} Kasus Code 4 Tuntas</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-3 bg-gradient-to-br from-[#101726] to-[#0D121F] rounded-xl border border-amber-900/40 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[10px] text-gray-400 uppercase font-mono font-bold">Personel Dikerahkan</div>
            <div className="text-xl font-black text-amber-300 font-mono mt-0.5">{totalOfficersInvolved} Petugas</div>
            <div className="text-[10px] text-gray-400">Tercatat dalam Operasi</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-3 bg-gradient-to-br from-[#101726] to-[#0D121F] rounded-xl border border-rose-900/40 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[10px] text-gray-400 uppercase font-mono font-bold">Suspect Ditindak</div>
            <div className="text-xl font-black text-rose-400 font-mono mt-0.5">{totalSuspectsHandled} Pelaku</div>
            <div className="text-[10px] text-gray-400">Perampokan & Kriminal</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-600/20 text-rose-400 flex items-center justify-center font-bold">
            <Crosshair className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Discord Quick Toast Banner */}
      {discordNotification && (
        <div className="bg-indigo-950 border border-indigo-700/80 text-indigo-200 px-4 py-2 rounded-xl text-xs flex items-center justify-between animate-fadeIn shadow-lg">
          <span>📢 {discordNotification}</span>
          <button onClick={() => setDiscordNotification(null)} className="text-gray-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Interactive Controls & Filters */}
      <div className="p-3.5 bg-[#101522] rounded-xl border border-gray-800 space-y-3 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nomor kasus, judul penanganan, lokasi TKP, senjata, atau nama komandan..."
              className="w-full bg-[#161D2B] border border-gray-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 outline-none focus:border-blue-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-[10px]"
              >
                ✕
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setEditingCase(null);
                setIsCreateModalOpen(true);
              }}
              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>+ Buat Case File Baru</span>
            </button>
          </div>
        </div>

        {/* Division Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          <span className="text-[10px] text-gray-500 uppercase font-mono font-bold mr-1 shrink-0">Divisi:</span>
          {[
            { id: 'ALL', label: '🌐 Semua Divisi' },
            { id: 'SWAT', label: '🛡️ SWAT / Metro' },
            { id: 'ASD', label: '🚁 ASD Air Support' },
            { id: 'K9', label: '🐕 K-9 Canine' },
            { id: 'TED', label: '🚔 TED Satlantas' },
            { id: 'IAD', label: '⚖️ IAD Propam' },
            { id: 'ACADEMY', label: '🎓 Academy FTO' },
            { id: 'PATROL', label: '🚓 Patroli' },
            { id: 'DETECTIVE', label: '🔍 Detective' }
          ].map(tab => {
            const isActive = currentDivFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setDivFilter(tab.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400/50'
                    : 'bg-[#161D2B] text-gray-400 hover:text-gray-200 hover:bg-[#1E2738] border border-gray-800'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-gray-800/60">
          <span className="text-[10px] text-gray-500 uppercase font-mono font-bold mr-1 shrink-0">Status:</span>
          {[
            { id: 'ALL', label: 'Semua Status' },
            { id: 'BERHASIL', label: '✅ Berhasil (Code 4)' },
            { id: 'SEBAGIAN_BERHASIL', label: '⚠️ Sebagian Berhasil' },
            { id: 'GAGAL', label: '❌ Gagal / Code 0' },
            { id: 'DALAM_PENANGANAN', label: '⚡ Dalam Penanganan' }
          ].map(st => {
            const isActive = selectedStatus === st.id;
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => setSelectedStatus(st.id)}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'bg-amber-600 text-white font-bold'
                    : 'bg-[#161D2B] text-gray-400 hover:text-gray-200 border border-gray-800'
                }`}
              >
                {st.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Case Files Cards List */}
      {filteredCases.length === 0 ? (
        <div className="p-12 text-center bg-[#101522] border border-dashed border-gray-800 rounded-2xl space-y-3">
          <div className="text-3xl">📂</div>
          <div className="text-sm font-bold text-gray-300">Tidak Ada Berkas Kasus yang Sesuai Kriteria</div>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            Tidak ditemukan berkas kasus untuk filter "{currentDivFilter}" atau pencarian "{searchQuery}".
          </p>
          <button
            type="button"
            onClick={() => {
              setDivFilter('ALL');
              setSelectedStatus('ALL');
              setSearchQuery('');
            }}
            className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold cursor-pointer"
          >
            Reset Semua Filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredCases.map((c, idx) => {
            return (
              <div
                key={`${c.id}-${idx}`}
                onClick={() => setSelectedCaseForDetail(c)}
                className="bg-[#101522] hover:bg-[#131929] border border-gray-800 hover:border-gray-700 rounded-2xl overflow-hidden p-4 sm:p-5 transition shadow-lg space-y-4 cursor-pointer group"
              >
                {/* Card Header */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-md font-mono font-bold text-[10px] border shadow-xs ${getDivisionBadgeColor(c.division)}`}>
                        {c.division}
                      </span>
                      <span className="font-mono text-amber-400 font-bold text-xs bg-black/40 px-2 py-0.5 rounded border border-gray-800">
                        {c.caseNumber}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        c.outcomeStatus === 'BERHASIL' ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' :
                        c.outcomeStatus === 'SEBAGIAN_BERHASIL' ? 'bg-amber-950 text-amber-300 border border-amber-700' :
                        c.outcomeStatus === 'GAGAL' ? 'bg-rose-950 text-rose-300 border border-rose-700' :
                        'bg-indigo-950 text-indigo-300 border border-indigo-700'
                      }`}>
                        {c.outcomeStatus === 'BERHASIL' ? '✅ CODE 4 (BERHASIL)' : c.outcomeStatus}
                      </span>
                      <span className="text-[10px] text-gray-500 font-mono">
                        🗓️ {c.incidentDate} • ⏰ {c.incidentTime}
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-extrabold text-white group-hover:text-blue-300 transition">
                      {c.caseTitle}
                    </h3>

                    <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span>{c.location}</span>
                    </div>
                  </div>

                  {/* Quick Action Buttons on Card */}
                  <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={(e) => handleSendDiscordQuick(c, e)}
                      disabled={sendingDiscordId === c.id}
                      className="p-2 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-300 transition text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                      title="Kirim ke Webhook Discord"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Discord</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingCase(c);
                        setIsCreateModalOpen(true);
                      }}
                      className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                      title="Edit Berkas"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleDeleteCase(c.id, e)}
                      className="p-2 rounded-lg bg-gray-800 hover:bg-rose-950 text-gray-400 hover:text-rose-400 transition cursor-pointer"
                      title="Hapus Berkas"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 3 BUKTI DOKUMENTASI FOTO PENANGANAN SHOWCASE (Crucial User Requirement) */}
                <div className="space-y-1.5 pt-1 border-t border-gray-800/80">
                  <div className="text-[10px] uppercase font-bold text-gray-400 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                      <span>3 BUKTI DOKUMENTASI FOTO PENANGANAN LAPANGAN:</span>
                    </span>
                    <span className="text-[9px] font-mono text-blue-400">Klik kartu untuk inspeksi zoom</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* Foto 1: Negosiasi */}
                    <div className="bg-[#0A0E17] rounded-xl border border-gray-800/90 overflow-hidden flex flex-col group/img">
                      <div className="relative aspect-video bg-black/60 overflow-hidden">
                        <img
                          src={c.photoNegotiation.url}
                          alt="Foto 1 Negosiasi"
                          className="w-full h-full object-cover group-hover/img:scale-105 transition duration-300"
                        />
                        <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/80 text-blue-300 text-[9px] font-mono font-bold border border-blue-500/50">
                          #1 NEGOSIASI
                        </span>
                      </div>
                      <div className="p-2 text-[10px] space-y-0.5 flex-1 flex flex-col justify-between">
                        <div className="font-bold text-gray-200 line-clamp-1">{c.photoNegotiation.caption || 'Tahap Negosiasi Awal'}</div>
                        <p className="text-gray-400 text-[9.5px] line-clamp-2 leading-tight mt-0.5">{c.photoNegotiation.stageNotes}</p>
                      </div>
                    </div>

                    {/* Foto 2: Penembakan & Barikade */}
                    <div className="bg-[#0A0E17] rounded-xl border border-gray-800/90 overflow-hidden flex flex-col group/img">
                      <div className="relative aspect-video bg-black/60 overflow-hidden">
                        <img
                          src={c.photoSetupShooting.url}
                          alt="Foto 2 Penembakan/Barikade"
                          className="w-full h-full object-cover group-hover/img:scale-105 transition duration-300"
                        />
                        <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/80 text-amber-300 text-[9px] font-mono font-bold border border-amber-500/50">
                          #2 PENEMBAKAN/SETUP
                        </span>
                      </div>
                      <div className="p-2 text-[10px] space-y-0.5 flex-1 flex flex-col justify-between">
                        <div className="font-bold text-gray-200 line-clamp-1">{c.photoSetupShooting.caption || 'Lokasi Setup Barikade'}</div>
                        <p className="text-gray-400 text-[9.5px] line-clamp-2 leading-tight mt-0.5">{c.photoSetupShooting.stageNotes}</p>
                      </div>
                    </div>

                    {/* Foto 3: Selesai Penanganan */}
                    <div className="bg-[#0A0E17] rounded-xl border border-gray-800/90 overflow-hidden flex flex-col group/img">
                      <div className="relative aspect-video bg-black/60 overflow-hidden">
                        <img
                          src={c.photoFinalOutcome.url}
                          alt="Foto 3 Selesai Penanganan"
                          className="w-full h-full object-cover group-hover/img:scale-105 transition duration-300"
                        />
                        <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/80 text-emerald-300 text-[9px] font-mono font-bold border border-emerald-500/50">
                          #3 HASIL AKHIR
                        </span>
                      </div>
                      <div className="p-2 text-[10px] space-y-0.5 flex-1 flex flex-col justify-between">
                        <div className="font-bold text-gray-200 line-clamp-1">{c.photoFinalOutcome.caption || 'Selesai Penanganan'}</div>
                        <p className="text-gray-400 text-[9.5px] line-clamp-2 leading-tight mt-0.5">{c.photoFinalOutcome.stageNotes}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Key Metrics Summary Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-gray-800/80 font-mono text-[11px]">
                  <div className="p-2 rounded-lg bg-[#090D14] border border-gray-800">
                    <span className="text-[9px] text-gray-400 uppercase block">Komandan & Anggota:</span>
                    <span className="font-bold text-blue-300">{c.commanderName}</span>
                    <span className="text-gray-500 text-[10px] block">({c.officersCount} Anggota Ikut)</span>
                  </div>

                  <div className="p-2 rounded-lg bg-[#090D14] border border-gray-800">
                    <span className="text-[9px] text-gray-400 uppercase block">Jumlah Suspect:</span>
                    <span className="font-bold text-rose-400">{c.suspectsCount} Orang</span>
                    <span className="text-gray-400 text-[10px] truncate block">{c.suspectAffiliation || 'N/A'}</span>
                  </div>

                  <div className="p-2 rounded-lg bg-[#090D14] border border-gray-800">
                    <span className="text-[9px] text-gray-400 uppercase block">Sandera Warga:</span>
                    <span className="font-bold text-emerald-400">{c.hostagesCount} Orang</span>
                    <span className="text-emerald-400/80 text-[10px] block">{c.hostageStatus}</span>
                  </div>

                  <div className="p-2 rounded-lg bg-[#090D14] border border-gray-800">
                    <span className="text-[9px] text-gray-400 uppercase block">Uang / Kas Diselamatkan:</span>
                    <span className="font-bold text-amber-300">{c.lootRecovered || 'N/A'}</span>
                    <span className="text-gray-500 text-[10px] block">{c.lootLoss || 'Nihil Kerugian'}</span>
                  </div>
                </div>

                {/* Weapons Pills Preview */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                    <span className="text-gray-500 font-bold uppercase">Senjata Polisi:</span>
                    {c.policeWeapons.slice(0, 3).map((w, wIdx) => (
                      <span key={`${w}-${wIdx}`} className="px-1.5 py-0.5 rounded bg-blue-950/70 border border-blue-800/60 text-blue-300">
                        🛡️ {w.split(' ')[0]}
                      </span>
                    ))}
                    {c.policeWeapons.length > 3 && (
                      <span className="text-gray-500 font-mono">+{c.policeWeapons.length - 3}</span>
                    )}

                    <span className="text-gray-600 mx-1">|</span>

                    <span className="text-gray-500 font-bold uppercase">Senjata Suspect:</span>
                    {c.suspectWeapons.slice(0, 3).map((w, wIdx) => (
                      <span key={`${w}-${wIdx}`} className="px-1.5 py-0.5 rounded bg-rose-950/70 border border-rose-800/60 text-rose-300">
                        💣 {w.split(' ')[0]}
                      </span>
                    ))}
                    {c.suspectWeapons.length > 3 && (
                      <span className="text-gray-500 font-mono">+{c.suspectWeapons.length - 3}</span>
                    )}
                  </div>

                  <div className="text-blue-400 text-xs font-bold flex items-center gap-1 group-hover:translate-x-1 transition">
                    <span>Lihat Dossier Lengkap</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedCaseForDetail && (
        <DivisionCaseFileDetailModal
          caseFile={selectedCaseForDetail}
          onClose={() => setSelectedCaseForDetail(null)}
          onEdit={(c) => {
            setSelectedCaseForDetail(null);
            setEditingCase(c);
            setIsCreateModalOpen(true);
          }}
          currentOfficer={currentOfficer}
        />
      )}

      {/* Create / Edit Modal */}
      {isCreateModalOpen && (
        <CreateDivisionCaseFileModal
          initialData={editingCase}
          defaultDivision={
            currentDivFilter !== 'ALL' && ['SWAT', 'ASD', 'K9', 'TED', 'IAD', 'ACADEMY', 'PATROL', 'DETECTIVE', 'HIGH_COMMAND'].includes(currentDivFilter)
              ? (currentDivFilter as any)
              : 'SWAT'
          }
          currentOfficer={currentOfficer}
          onSave={handleSaveCase}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingCase(null);
          }}
        />
      )}
    </div>
  );
};
