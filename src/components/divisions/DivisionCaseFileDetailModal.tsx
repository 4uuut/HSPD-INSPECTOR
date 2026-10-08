import React, { useState } from 'react';
import { 
  X, Printer, Send, Shield, MapPin, Calendar, Clock, 
  Users, AlertTriangle, CheckCircle, Crosshair, Sparkles, 
  Flame, Radio, Award, Download, Copy, Check, ExternalLink, Image as ImageIcon
} from 'lucide-react';
import { DivisionCaseFile, OfficerProfile } from '../../types';
import { sendDivisionCaseFileToDiscord } from '../../utils/divisionCaseWebhook';

interface Props {
  caseFile: DivisionCaseFile;
  onClose: () => void;
  onEdit?: (caseFile: DivisionCaseFile) => void;
  currentOfficer: OfficerProfile | null;
}

export const DivisionCaseFileDetailModal: React.FC<Props> = ({
  caseFile,
  onClose,
  onEdit,
  currentOfficer
}) => {
  const [activePhotoTab, setActivePhotoTab] = useState<'all' | 'neg' | 'shoot' | 'end'>('all');
  const [isSendingDiscord, setIsSendingDiscord] = useState(false);
  const [discordFeedback, setDiscordFeedback] = useState<string | null>(null);
  const [copiedReport, setCopiedReport] = useState(false);

  const getDivisionColor = (div: string) => {
    switch (div) {
      case 'SWAT': return { bg: 'bg-red-950/60', text: 'text-red-400', border: 'border-red-600/60', badge: 'bg-red-600 text-white' };
      case 'ASD': return { bg: 'bg-blue-950/60', text: 'text-blue-400', border: 'border-blue-600/60', badge: 'bg-blue-600 text-white' };
      case 'K9': return { bg: 'bg-amber-950/60', text: 'text-amber-400', border: 'border-amber-600/60', badge: 'bg-amber-600 text-white' };
      case 'TED': return { bg: 'bg-sky-950/60', text: 'text-sky-400', border: 'border-sky-600/60', badge: 'bg-sky-600 text-white' };
      case 'IAD': return { bg: 'bg-purple-950/60', text: 'text-purple-400', border: 'border-purple-600/60', badge: 'bg-purple-600 text-white' };
      case 'ACADEMY': return { bg: 'bg-emerald-950/60', text: 'text-emerald-400', border: 'border-emerald-600/60', badge: 'bg-emerald-600 text-white' };
      default: return { bg: 'bg-indigo-950/60', text: 'text-indigo-400', border: 'border-indigo-600/60', badge: 'bg-indigo-600 text-white' };
    }
  };

  const divTheme = getDivisionColor(caseFile.division);

  const handleSendDiscord = async () => {
    setIsSendingDiscord(true);
    setDiscordFeedback(null);
    try {
      const res = await sendDivisionCaseFileToDiscord(caseFile);
      setDiscordFeedback(res.message);
    } catch (e: any) {
      setDiscordFeedback(e?.message || 'Gagal mengirim ke Discord.');
    } finally {
      setIsSendingDiscord(false);
    }
  };

  const handleCopyMarkdown = () => {
    const text = [
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `🚨 **BERKAS KASUS OPERASIONAL RESMI HSPD**`,
      `**NOMOR BERKAS:** ${caseFile.caseNumber}`,
      `**JUDUL KASUS:** ${caseFile.caseTitle}`,
      `**DIVISI PENANGGUNG JAWAB:** ${caseFile.division}`,
      `**LOKASI KEJADIAN (TKP):** ${caseFile.location}`,
      `**WAKTU:** ${caseFile.incidentDate} - ${caseFile.incidentTime}`,
      `**KOMANDAN OPERASI (IC):** ${caseFile.commanderName} (${caseFile.commanderBadge}) - ${caseFile.commanderRank}`,
      `**JUMLAH PERSONEL:** ${caseFile.officersCount} Anggota Ikut`,
      `**DAFTAR ANGGOTA:** ${caseFile.participatingOfficers.join(', ')}`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `🎯 **SITUASI SUSPECT & SANDERA:**`,
      `• Suspect: ${caseFile.suspectsCount} Orang (${caseFile.suspectAffiliation || 'N/A'})`,
      `• Status Suspect: ${caseFile.suspectStatusSummary}`,
      `• Sandera: ${caseFile.hostagesCount} Orang (${caseFile.hostageStatus})`,
      `• Korban Polisi: ${caseFile.policeCasualties}`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `🔫 **PERSENJATAAN:**`,
      `• Polisi: ${caseFile.policeWeapons.join(', ')}`,
      `• Suspect: ${caseFile.suspectWeapons.join(', ')}`,
      `• Kendaraan Taktis: ${caseFile.tacticalVehicles.join(', ')}`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `📸 **3 BUKTI DOKUMENTASI FOTO PENANGANAN:**`,
      `1. [FOTO AWAL / SAAT NEGOSIASI]`,
      `   Judul: ${caseFile.photoNegotiation.caption}`,
      `   Rincian: ${caseFile.photoNegotiation.stageNotes}`,
      `   URL: ${caseFile.photoNegotiation.url}`,
      ``,
      `2. [LOKASI PENEMBAKAN & SETUP BARIKADE PERAMPOK]`,
      `   Judul: ${caseFile.photoSetupShooting.caption}`,
      `   Rincian: ${caseFile.photoSetupShooting.stageNotes}`,
      `   URL: ${caseFile.photoSetupShooting.url}`,
      ``,
      `3. [SELESAI PENANGANAN / HASIL AKHIR]`,
      `   Judul: ${caseFile.photoFinalOutcome.caption}`,
      `   Rincian: ${caseFile.photoFinalOutcome.stageNotes}`,
      `   URL: ${caseFile.photoFinalOutcome.url}`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `📊 **HASIL AKHIR PENANGANAN:**`,
      `• Status: ${caseFile.outcomeStatus === 'BERHASIL' ? 'CODE 4 - OPERASI BERHASIL' : caseFile.outcomeStatus}`,
      `• Uang/Kas Terselamatkan: ${caseFile.lootRecovered || 'N/A'}`,
      `• Kerugian: ${caseFile.lootLoss || 'Nihil'}`,
      `• Barang Bukti Sitaan: ${caseFile.confiscatedEvidences ? caseFile.confiscatedEvidences.join('; ') : 'N/A'}`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `📝 **KRONOLOGI OPERASI:**`,
      `${caseFile.chronologySummary}`,
      ``,
      `📋 **EVALUASI TAKTIS PIMPINAN:**`,
      `${caseFile.tacticalEvaluation}`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `*Disahkan oleh Komandan Lapangan: ${caseFile.commanderName} (${caseFile.commanderBadge})*`
    ].join('\n');

    navigator.clipboard.writeText(text);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-[#0B0F17] border border-gray-700/80 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden font-sans text-xs">
        {/* Top Header Bar */}
        <div className={`p-4 border-b ${divTheme.border} ${divTheme.bg} flex items-center justify-between gap-3 shrink-0`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${divTheme.badge} flex items-center justify-center shadow-lg`}>
              <Shield className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-gray-400 text-[10px] tracking-wider uppercase">
                  BERKAS RESMI OPERASI KEPOLISIAN
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${divTheme.badge}`}>
                  DIVISI {caseFile.division}
                </span>
                <span className="font-mono text-gray-300 text-[11px] font-bold bg-black/50 px-2 py-0.5 rounded border border-gray-700">
                  {caseFile.caseNumber}
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-black text-white leading-tight mt-0.5">
                {caseFile.caseTitle}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyMarkdown}
              className="px-2.5 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="Salin Teks Lengkap Laporan"
            >
              {copiedReport ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copiedReport ? 'Tersalin' : 'Salin Laporan'}</span>
            </button>

            <button
              type="button"
              onClick={handleSendDiscord}
              disabled={isSendingDiscord}
              className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              title="Kirim ke Webhook Discord"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isSendingDiscord ? 'Mengirim...' : 'Kirim Discord'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="Cetak Berkas Dossier Resmi"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cetak</span>
            </button>

            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(caseFile)}
                className="px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition cursor-pointer"
              >
                Edit
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Discord Notification banner */}
        {discordFeedback && (
          <div className="bg-indigo-950/80 border-b border-indigo-700/80 px-4 py-2 text-indigo-200 text-xs font-mono flex items-center justify-between">
            <span>📢 {discordFeedback}</span>
            <button onClick={() => setDiscordFeedback(null)} className="text-gray-400 hover:text-white">✕</button>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-gray-200 print:text-black">
          {/* Top Status & Core Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 bg-[#111622] rounded-xl border border-gray-800 space-y-1">
              <div className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Status Penanganan</span>
              </div>
              <div className="font-extrabold text-sm text-emerald-400 font-mono">
                {caseFile.outcomeStatus === 'BERHASIL' ? 'BERHASIL (CODE 4)' : caseFile.outcomeStatus}
              </div>
              <div className="text-[10px] text-gray-400 truncate">
                {caseFile.lootRecovered || 'Operasi Tuntas'}
              </div>
            </div>

            <div className="p-3 bg-[#111622] rounded-xl border border-gray-800 space-y-1">
              <div className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                <span>Lokasi TKP Operasi</span>
              </div>
              <div className="font-bold text-xs text-gray-100 line-clamp-1" title={caseFile.location}>
                {caseFile.location}
              </div>
              <div className="text-[10px] text-gray-400 font-mono">
                {caseFile.incidentDate} • {caseFile.incidentTime}
              </div>
            </div>

            <div className="p-3 bg-[#111622] rounded-xl border border-gray-800 space-y-1">
              <div className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                <span>Kekuatan Personel Polisi</span>
              </div>
              <div className="font-extrabold text-sm text-blue-400 font-mono">
                {caseFile.officersCount} Personel Ikut
              </div>
              <div className="text-[10px] text-gray-400 truncate">
                IC: {caseFile.commanderName} ({caseFile.commanderBadge})
              </div>
            </div>

            <div className="p-3 bg-[#111622] rounded-xl border border-gray-800 space-y-1">
              <div className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Suspect & Sandera</span>
              </div>
              <div className="font-extrabold text-sm text-amber-300 font-mono">
                {caseFile.suspectsCount} Suspect • {caseFile.hostagesCount} Sandera
              </div>
              <div className="text-[10px] text-emerald-400 font-semibold truncate">
                {caseFile.hostageStatus}
              </div>
            </div>
          </div>

          {/* 3 BUKTI DOKUMENTASI FOTO PENANGANAN (Mandatory Showcase) */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-800 pb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">
                    3 BUKTI DOKUMENTASI FOTO PENANGANAN OPERASIONAL
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Bukti foto 3 tahapan operasi: Negosiasi Awal, Lokasi Penembakan & Barikade, serta Selesai Penanganan
                  </p>
                </div>
              </div>

              {/* Photo Filter Tabs */}
              <div className="flex items-center gap-1 bg-[#111622] p-1 rounded-lg border border-gray-800">
                <button
                  type="button"
                  onClick={() => setActivePhotoTab('all')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition ${activePhotoTab === 'all' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}
                >
                  Semua (3 Foto)
                </button>
                <button
                  type="button"
                  onClick={() => setActivePhotoTab('neg')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition ${activePhotoTab === 'neg' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}
                >
                  1. Negosiasi
                </button>
                <button
                  type="button"
                  onClick={() => setActivePhotoTab('shoot')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition ${activePhotoTab === 'shoot' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}
                >
                  2. Penembakan/Barikade
                </button>
                <button
                  type="button"
                  onClick={() => setActivePhotoTab('end')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition ${activePhotoTab === 'end' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}
                >
                  3. Selesai
                </button>
              </div>
            </div>

            {/* Photos Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Photo 1: Negosiasi / Tahap Awal */}
              {(activePhotoTab === 'all' || activePhotoTab === 'neg') && (
                <div className="bg-[#111622] border border-gray-800 rounded-xl overflow-hidden flex flex-col shadow-lg">
                  <div className="relative aspect-video bg-black/60 overflow-hidden group">
                    <img
                      src={caseFile.photoNegotiation.url}
                      alt="Tahap Negosiasi"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-blue-950/90 text-blue-300 border border-blue-600 text-[10px] font-mono font-bold shadow-md">
                      FOTO BUKTI #1: TAHAP NEGOSIASI
                    </div>
                  </div>
                  <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      <div className="font-bold text-gray-100 text-xs flex items-center gap-1.5">
                        <Radio className="w-3.5 h-3.5 text-blue-400" />
                        <span>{caseFile.photoNegotiation.caption || 'Negosiasi Lapangan'}</span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1.5 leading-relaxed bg-[#090D14] p-2 rounded-lg border border-gray-800/80">
                        {caseFile.photoNegotiation.stageNotes}
                      </p>
                    </div>
                    <div className="text-[9px] font-mono text-gray-500 pt-1 border-t border-gray-800/60">
                      STATUS: FOTO RESMI TAHAP AWAL 10-99
                    </div>
                  </div>
                </div>
              )}

              {/* Photo 2: Lokasi Penembakan & Setup Barikade */}
              {(activePhotoTab === 'all' || activePhotoTab === 'shoot') && (
                <div className="bg-[#111622] border border-gray-800 rounded-xl overflow-hidden flex flex-col shadow-lg">
                  <div className="relative aspect-video bg-black/60 overflow-hidden group">
                    <img
                      src={caseFile.photoSetupShooting.url}
                      alt="Lokasi Penembakan & Barikade"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-amber-950/90 text-amber-300 border border-amber-600 text-[10px] font-mono font-bold shadow-md">
                      FOTO BUKTI #2: PENEMBAKAN & BARIKADE
                    </div>
                  </div>
                  <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      <div className="font-bold text-gray-100 text-xs flex items-center gap-1.5">
                        <Crosshair className="w-3.5 h-3.5 text-amber-400" />
                        <span>{caseFile.photoSetupShooting.caption || 'Setup Perimeter & Crossfire'}</span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1.5 leading-relaxed bg-[#090D14] p-2 rounded-lg border border-gray-800/80">
                        {caseFile.photoSetupShooting.stageNotes}
                      </p>
                    </div>
                    <div className="text-[9px] font-mono text-gray-500 pt-1 border-t border-gray-800/60">
                      STATUS: FOTO RESMI TITIK BAKU TEMBAK / SETUP
                    </div>
                  </div>
                </div>
              )}

              {/* Photo 3: Selesai Penanganan & Hasil Akhir */}
              {(activePhotoTab === 'all' || activePhotoTab === 'end') && (
                <div className="bg-[#111622] border border-gray-800 rounded-xl overflow-hidden flex flex-col shadow-lg">
                  <div className="relative aspect-video bg-black/60 overflow-hidden group">
                    <img
                      src={caseFile.photoFinalOutcome.url}
                      alt="Hasil Akhir Penanganan"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-emerald-950/90 text-emerald-300 border border-emerald-600 text-[10px] font-mono font-bold shadow-md">
                      FOTO BUKTI #3: SELESAI PENANGANAN
                    </div>
                  </div>
                  <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      <div className="font-bold text-gray-100 text-xs flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{caseFile.photoFinalOutcome.caption || 'Hasil Penanganan & Evakuasi'}</span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1.5 leading-relaxed bg-[#090D14] p-2 rounded-lg border border-gray-800/80">
                        {caseFile.photoFinalOutcome.stageNotes}
                      </p>
                    </div>
                    <div className="text-[9px] font-mono text-gray-500 pt-1 border-t border-gray-800/60">
                      STATUS: FOTO RESMI OLAH TKP & HASIL AKHIR
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Weapons & Equipment Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Police Weapons */}
            <div className="bg-[#111622] p-4 rounded-xl border border-blue-900/60 space-y-2.5">
              <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-400" />
                  <span className="font-bold text-gray-100 text-xs">PERSENJATAAN KEPOLISIAN</span>
                </div>
                <span className="text-[10px] font-mono text-blue-400 font-bold">
                  {caseFile.policeWeapons.length} Jenis Senjata
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {caseFile.policeWeapons.map((w, idx) => (
                  <span key={`${w}-${idx}`} className="px-2 py-1 rounded bg-blue-950/80 border border-blue-700/60 text-blue-300 text-[11px] font-mono font-semibold">
                    🛡️ {w}
                  </span>
                ))}
              </div>
              {caseFile.tacticalVehicles.length > 0 && (
                <div className="pt-2 border-t border-gray-800/80">
                  <div className="text-[10px] text-gray-400 font-mono font-bold mb-1">KENDARAAN TAKTIS DIKERAHKAN:</div>
                  <div className="text-[11px] text-gray-300 font-medium">
                    {caseFile.tacticalVehicles.join(' • ')}
                  </div>
                </div>
              )}
            </div>

            {/* Suspect Weapons */}
            <div className="bg-[#111622] p-4 rounded-xl border border-rose-900/60 space-y-2.5">
              <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                <div className="flex items-center gap-2">
                  <Crosshair className="w-4 h-4 text-rose-400" />
                  <span className="font-bold text-gray-100 text-xs">PERSENJATAAN PIHAK PELAKU (SUSPECT)</span>
                </div>
                <span className="text-[10px] font-mono text-rose-400 font-bold">
                  {caseFile.suspectWeapons.length} Jenis Senjata
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {caseFile.suspectWeapons.map((w, idx) => (
                  <span key={`${w}-${idx}`} className="px-2 py-1 rounded bg-rose-950/80 border border-rose-700/60 text-rose-300 text-[11px] font-mono font-semibold">
                    💣 {w}
                  </span>
                ))}
              </div>
              <div className="pt-2 border-t border-gray-800/80 text-[11px]">
                <span className="text-gray-400 font-mono font-bold">KONDISI PELAKU: </span>
                <span className="text-rose-300 font-semibold">{caseFile.suspectStatusSummary}</span>
              </div>
            </div>
          </div>

          {/* Personnel Involved List */}
          <div className="bg-[#111622] p-4 rounded-xl border border-gray-800 space-y-2">
            <div className="flex items-center justify-between border-b border-gray-800 pb-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-gray-100 text-xs">DAFTAR PERSONEL KEPOLISIAN YANG IKUT DALAM OPERASI ({caseFile.officersCount})</span>
              </div>
              <span className="text-[10px] text-gray-400 font-mono">Incident Command System (ICS)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
              {caseFile.participatingOfficers.map((officerStr, idx) => (
                <div key={`${officerStr}-${idx}`} className="p-2 rounded-lg bg-[#090D14] border border-gray-800/80 text-gray-300 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-950 text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0 border border-blue-800">
                    {idx + 1}
                  </span>
                  <span className="truncate">{officerStr}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Operational Chronology & Tactical Review */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#111622] p-4 rounded-xl border border-gray-800 space-y-2">
              <h4 className="font-bold text-gray-100 text-xs flex items-center gap-2 border-b border-gray-800 pb-2">
                <span>📝 KRONOLOGI LENGKAP PENANGANAN OPERASI</span>
              </h4>
              <p className="text-xs text-gray-300 leading-relaxed text-justify bg-[#090D14] p-3 rounded-lg border border-gray-800/80">
                {caseFile.chronologySummary}
              </p>
            </div>

            <div className="bg-[#111622] p-4 rounded-xl border border-gray-800 space-y-2">
              <h4 className="font-bold text-gray-100 text-xs flex items-center gap-2 border-b border-gray-800 pb-2">
                <span>📋 EVALUASI TAKTIS & CATATAN PIMPINAN</span>
              </h4>
              <p className="text-xs text-gray-300 leading-relaxed text-justify bg-[#090D14] p-3 rounded-lg border border-gray-800/80">
                {caseFile.tacticalEvaluation}
              </p>
            </div>
          </div>

          {/* Confiscated Evidence Bar */}
          {caseFile.confiscatedEvidences && caseFile.confiscatedEvidences.length > 0 && (
            <div className="bg-[#111622] p-4 rounded-xl border border-amber-900/50 space-y-2">
              <div className="font-bold text-amber-400 text-xs uppercase tracking-wide flex items-center gap-2 border-b border-gray-800 pb-1.5">
                <span>📦 BARANG BUKTI & ASET YANG DISITA KEPOLISIAN</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-xs">
                {caseFile.confiscatedEvidences.map((ev, idx) => (
                  <div key={`${ev}-${idx}`} className="p-2 rounded bg-[#090D14] border border-gray-800 text-amber-200/90 flex items-start gap-2">
                    <span className="text-amber-500 font-bold shrink-0">#{idx + 1}</span>
                    <span>{ev}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Signature & Seal Authorization Card */}
          <div className="p-4 bg-gradient-to-r from-[#0E131E] to-[#121927] rounded-xl border border-gray-700 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-[10px] text-gray-400 uppercase font-mono tracking-wider">
                PENGESAHAN DOKUMEN OPERASIONAL RESMI
              </div>
              <div className="font-bold text-sm text-gray-100">
                KOMANDAN PENANGGUNG JAWAB: {caseFile.commanderName}
              </div>
              <div className="text-xs text-blue-400 font-mono">
                {caseFile.commanderRank} • BADGE ID: {caseFile.commanderBadge}
              </div>
            </div>

            <div className="flex items-center gap-4 text-right">
              <div>
                <div className="text-[10px] text-gray-400 font-mono">STATUS PENGESAHAN:</div>
                <div className="font-mono font-bold text-emerald-400 text-xs">
                  {caseFile.signedByCommander ? '✓ TELAH DIVERIFIKASI & DITANDATANGANI' : 'MENUNGGU VERIFIKASI'}
                </div>
                <div className="text-[10px] text-gray-500 font-mono">
                  TERCATAT DI CLOUD MABES HSPD
                </div>
              </div>

              <div className="w-16 h-16 rounded-full border-2 border-dashed border-amber-500/60 bg-amber-950/30 flex flex-col items-center justify-center text-amber-300 font-serif text-[8px] text-center p-1 leading-tight select-none">
                <span className="font-bold">HSPD</span>
                <span>OFFICIAL</span>
                <span>SEAL</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-[#080B10] border-t border-gray-800 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-gray-500 font-mono">
            ID: {caseFile.id} • Dibuat: {new Date(caseFile.createdAt).toLocaleDateString('id-ID')}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold cursor-pointer"
          >
            Tutup Berkas
          </button>
        </div>
      </div>
    </div>
  );
};
