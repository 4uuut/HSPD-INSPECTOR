import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Crown,
  Shield,
  FileCheck,
  Building2,
  PenTool,
  Stamp,
  Save,
  Printer,
  Sparkles,
  Award
} from 'lucide-react';
import { OfficialDocument, OfficerProfile, SealType, isRank2OrAbove, isOfficerHighRank } from '../types';
import { OfficialSeal } from './OfficialSeals';

interface Props {
  document: OfficialDocument;
  currentOfficer?: OfficerProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveSignatories: (updatedDoc: OfficialDocument, openPreviewImmediately?: boolean) => void;
}

export const CitizenServiceSignatoryModal: React.FC<Props> = ({
  document,
  currentOfficer,
  isOpen,
  onClose,
  onSaveSignatories,
}) => {
  if (!isOpen) return null;

  const canEdit = isRank2OrAbove(currentOfficer?.rank);
  const isHighCommand = isOfficerHighRank(currentOfficer?.rank) || (currentOfficer?.rank || '').toUpperCase().includes('PRESIDENT');

  // Petugas Pelaksana Signatory State
  const [officerName, setOfficerName] = useState<string>(
    document.officerSignatureName || document.issuerName || currentOfficer?.name || 'Amy Santiago'
  );
  const [officerRank, setOfficerRank] = useState<string>(
    document.officerSignatureRank || document.issuerRank || currentOfficer?.rank || 'POLICE OFFICER II [PO II]'
  );
  const [officerBadge, setOfficerBadge] = useState<string>(
    document.officerSignatureBadge || document.issuerBadge || currentOfficer?.badge || '#215'
  );
  const [officerTitle, setOfficerTitle] = useState<string>(
    document.officerSignatureTitle || document.issuerSignatureTitle || 'Petugas Pelaksana & Pemeriksa Berkas Resmi'
  );
  const [officerSigned, setOfficerSigned] = useState<boolean>(
    document.officerSignatureStatus === 'SIGNED' || Boolean(document.officerSignatureName)
  );

  // Petinggi / Atasan Signatory State
  const [highOfficialName, setHighOfficialName] = useState<string>(
    document.highOfficialSignatureName || document.acknowledgedByName || (document.category === 'IZIN_USAHA' ? 'Momo Hatakeyama' : 'Jackie Xianlao')
  );
  const [highOfficialRank, setHighOfficialRank] = useState<string>(
    document.highOfficialSignatureRank || document.acknowledgedByRank || (document.category === 'IZIN_USAHA' ? 'PRESIDENT [RANK 6]' : 'CHIEF OF POLICE [COP]')
  );
  const [highOfficialBadge, setHighOfficialBadge] = useState<string>(
    document.highOfficialSignatureBadge || (document.category === 'IZIN_USAHA' ? '#GOV-01' : '#001')
  );
  const [highOfficialTitle, setHighOfficialTitle] = useState<string>(
    document.highOfficialSignatureTitle || document.acknowledgedByTitle || (document.category === 'IZIN_USAHA' ? 'Kepala Pemerintahan & Otoritas Perizinan' : 'Kepala Kepolisian Negara HighState')
  );
  const [highOfficialSigned, setHighOfficialSigned] = useState<boolean>(
    document.highOfficialSignatureStatus === 'SIGNED' || Boolean(document.highOfficialSignatureName)
  );
  const [selectedSeal, setSelectedSeal] = useState<SealType>(
    document.primarySeal || (document.category === 'IZIN_USAHA' ? 'PRESIDENTIAL_SEAL' : 'HSPD_OFFICIAL')
  );

  // Document Status & Verification Notes
  const [docStatus, setDocStatus] = useState<'APPROVED' | 'PENDING' | 'REJECTED' | 'REVOKED'>(
    document.documentStatus || 'APPROVED'
  );
  const [notes, setNotes] = useState<string>(
    document.documentVerificationNotes || document.notes || 'Berkas telah diverifikasi lengkap dan memenuhi seluruh persyaratan hukum.'
  );

  // Quick Preset Handlers
  const handleApplyCurrentOfficerAsPetugas = () => {
    if (currentOfficer) {
      setOfficerName(currentOfficer.name);
      setOfficerRank(currentOfficer.rank);
      setOfficerBadge(currentOfficer.badge);
      setOfficerSigned(true);
    }
  };

  const handleSelectPetinggiPreset = (p: { name: string; rank: string; badge: string; title: string; seal: SealType }) => {
    setHighOfficialName(p.name);
    setHighOfficialRank(p.rank);
    setHighOfficialBadge(p.badge);
    setHighOfficialTitle(p.title);
    setSelectedSeal(p.seal);
    setHighOfficialSigned(true);
  };

  const handleSave = (openPrint = false) => {
    const updated: OfficialDocument = {
      ...document,
      // Update Petugas Pelaksana Signatures
      officerSignatureName: officerName.trim(),
      officerSignatureRank: officerRank.trim(),
      officerSignatureBadge: officerBadge.trim(),
      officerSignatureTitle: officerTitle.trim(),
      officerSignatureStatus: officerSigned ? 'SIGNED' : 'UNSIGNED',
      officerSignedAt: officerSigned ? (document.officerSignedAt || Date.now()) : undefined,
      
      // Update High Official Signatures
      highOfficialSignatureName: highOfficialName.trim(),
      highOfficialSignatureRank: highOfficialRank.trim(),
      highOfficialSignatureBadge: highOfficialBadge.trim(),
      highOfficialSignatureTitle: highOfficialTitle.trim(),
      highOfficialSignatureStatus: highOfficialSigned ? 'SIGNED' : 'UNSIGNED',
      highOfficialSignedAt: highOfficialSigned ? (document.highOfficialSignedAt || Date.now()) : undefined,

      // Sync with primary preview doc fields
      issuerName: officerName.trim() || document.issuerName,
      issuerRank: officerRank.trim() || document.issuerRank,
      issuerBadge: officerBadge.trim() || document.issuerBadge,
      issuerSignatureName: officerName.trim(),
      issuerSignatureSubtitle: `${officerRank.trim()} [${officerBadge.trim()}]`,
      
      acknowledgedByName: highOfficialName.trim(),
      acknowledgedByRank: highOfficialRank.trim(),
      acknowledgedByRole: highOfficialTitle.trim(),
      primarySeal: selectedSeal,

      documentStatus: docStatus,
      documentVerificationNotes: notes.trim(),
      updatedAt: Date.now(),
    };

    onSaveSignatories(updated, openPrint);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="bg-[#0E121A] border border-blue-600/40 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col overflow-hidden my-auto max-h-[92vh]">
        
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-950/80 via-[#131926] to-amber-950/40 border-b border-gray-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/20 border border-blue-500/40 rounded-xl text-blue-400">
              <PenTool className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  KELOLA PENANDATANGAN & PENGESAHAN DOKUMEN RESMI
                </h3>
                <span className="text-[10px] font-mono bg-blue-900/60 text-blue-300 border border-blue-700/50 px-2 py-0.5 rounded font-bold">
                  HSPD & PEMERINTAHAN
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Konfigurasi tanda tangan manual petugas pelaksana (Rank 2 s/d Atasan) dan petinggi pengesah negara.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* NOTIFICATION IF RANK < 2 */}
        {!canEdit && (
          <div className="px-5 py-2.5 bg-amber-950/70 border-b border-amber-800/80 flex items-center gap-2 text-xs text-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Perhatian: Akun Anda terdeteksi belum mencapai Rank 2 (Officer II / Staff Ahli). Anda dapat meninjau data penandatangan, namun otoritas pengesahan resmi dianjurkan dilakukan oleh personel Rank 2 ke atas.
            </span>
          </div>
        )}

        {/* MODAL BODY */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {/* DOCUMENT SUMMARY BANNER */}
          <div className="bg-[#141A26] border border-gray-800 rounded-xl p-3.5 sm:p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <span className="text-[10px] text-gray-400 block font-mono">NOMOR BERKAS / SURAT:</span>
              <span className="font-bold font-mono text-blue-300 text-xs truncate block">{document.docNumber}</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 block font-mono">JENIS PERIZINAN / LAYANAN:</span>
              <span className="font-bold text-white text-xs truncate block">{document.title}</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 block font-mono">NAMA PEMOHON / PEMILIK:</span>
              <span className="font-bold text-amber-300 text-xs truncate block">{document.recipientName}</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 block font-mono">NIK / CID / KONTAK:</span>
              <span className="font-mono text-gray-300 text-xs truncate block">
                {document.recipientId || 'CID Terlampir'} • {document.recipientPhone || 'N/A'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            
            {/* ================================================================= */}
            {/* SECTION 1: PENANDATANGAN PETUGAS PELAKSANA (RANK 2 S/D ATASAN) */}
            {/* ================================================================= */}
            <div className="bg-[#111622] border border-blue-900/60 rounded-xl p-4 sm:p-5 space-y-4 shadow-lg">
              <div className="flex items-center justify-between border-b border-gray-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-600/20 border border-blue-500/40 rounded-lg text-blue-400">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs uppercase tracking-wide">
                      1. PENANDATANGAN PETUGAS PELAKSANA
                    </h4>
                    <p className="text-[10px] text-gray-400 font-mono">Bisa Diedit Manual dari Rank 2 sampai Atasan</p>
                  </div>
                </div>

                {currentOfficer && (
                  <button
                    type="button"
                    onClick={handleApplyCurrentOfficerAsPetugas}
                    className="px-2 py-1 bg-blue-950 hover:bg-blue-900 border border-blue-700/60 text-blue-300 rounded text-[10px] font-mono transition"
                    title="Gunakan identitas akun login sekarang"
                  >
                    + Pakai Akun Saya
                  </button>
                )}
              </div>

              {/* QUICK RANK SELECTOR DROPDOWN */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                  Pilihan Cepat Pangkat Dinas (Rank 2 s/d Atasan):
                </label>
                <select
                  value={officerRank}
                  onChange={(e) => setOfficerRank(e.target.value)}
                  className="w-full bg-[#090C12] border border-gray-700 focus:border-blue-500 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none"
                >
                  <optgroup label="Kepolisian HSPD (Rank 2 s/d Atasan)">
                    <option value="POLICE OFFICER II [PO II]">POLICE OFFICER II [PO II] — Rank 2</option>
                    <option value="POLICE OFFICER III [PO III]">POLICE OFFICER III [PO III] — Rank 3</option>
                    <option value="SENIOR LEAD OFFICER [SLO]">SENIOR LEAD OFFICER [SLO] — Rank 4</option>
                    <option value="SERGEANT I [SGT I]">SERGEANT I [SGT I] — Rank 5</option>
                    <option value="SERGEANT II [SGT II]">SERGEANT II [SGT II] — Rank 6</option>
                    <option value="LIEUTENANT [LT]">LIEUTENANT [LT] — Rank 7</option>
                    <option value="CAPTAIN [CPT]">CAPTAIN [CPT] — Rank 8</option>
                    <option value="COMMANDER [CDR]">COMMANDER [CDR] — Rank 9</option>
                    <option value="DEPUTY CHIEF [D/C]">DEPUTY CHIEF [D/C] — Rank 10</option>
                    <option value="CHIEF OF POLICE [COP]">CHIEF OF POLICE [COP] — Rank 12 (Atasan Tertinggi)</option>
                  </optgroup>
                  <optgroup label="Pemerintahan HighState (Rank 2 s/d Atasan)">
                    <option value="HIGH OFFICIALS [RANK 2]">HIGH OFFICIALS / STAFF AHLI [RANK 2]</option>
                    <option value="CABINET / DIRECTORS [RANK 3]">CABINET / KEPALA SEKSI [RANK 3]</option>
                    <option value="SECRETARY OF STATE [RANK 4]">SECRETARY OF STATE / DIRJEN [RANK 4]</option>
                    <option value="VICE PRESIDENT [RANK 5]">VICE PRESIDENT [RANK 5]</option>
                    <option value="PRESIDENT [RANK 6]">PRESIDENT OF HIGHSTATE [RANK 6]</option>
                  </optgroup>
                </select>
              </div>

              {/* MANUAL INPUT FOR PETUGAS NAME */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                  Nama Petugas Penandatangan <span className="text-blue-400 font-mono">(Bisa Diedit Manual)</span>
                </label>
                <input
                  type="text"
                  value={officerName}
                  onChange={(e) => setOfficerName(e.target.value)}
                  placeholder="Contoh: Amy Santiago atau Raymond Holt"
                  className="w-full bg-[#090C12] border border-gray-700 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none"
                  required
                />
              </div>

              {/* MANUAL INPUT FOR BADGE & CUSTOM RANK */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                    Badge / Nomor Registrasi
                  </label>
                  <input
                    type="text"
                    value={officerBadge}
                    onChange={(e) => setOfficerBadge(e.target.value)}
                    placeholder="#215"
                    className="w-full bg-[#090C12] border border-gray-700 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                    Pangkat Kustom (Manual)
                  </label>
                  <input
                    type="text"
                    value={officerRank}
                    onChange={(e) => setOfficerRank(e.target.value)}
                    placeholder="Contoh: PO II, SGT, CPT"
                    className="w-full bg-[#090C12] border border-gray-700 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* JABATAN PENANDATANGAN */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                  Jabatan Penandatangan Petugas (Kop Tanda Tangan)
                </label>
                <input
                  type="text"
                  value={officerTitle}
                  onChange={(e) => setOfficerTitle(e.target.value)}
                  placeholder="Petugas Pelaksana & Pemeriksa Berkas Resmi"
                  className="w-full bg-[#090C12] border border-gray-700 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none"
                />
              </div>

              {/* STATUS TANDA TANGAN TOGGLE */}
              <div className="p-3 bg-[#090C12] border border-gray-800 rounded-lg flex items-center justify-between">
                <div>
                  <span className="font-semibold text-gray-200 block text-xs">Status Tanda Tangan Petugas</span>
                  <span className="text-[10px] text-gray-400">
                    {officerSigned ? '✓ Sudah Dibubuhkan Tanda Tangan Resmi' : '⏳ Belum Ditandatangani Petugas'}
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={officerSigned}
                    onChange={(e) => setOfficerSigned(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            {/* ================================================================= */}
            {/* SECTION 2: PENANDATANGAN PETINGGI / ATASAN PENGESAH */}
            {/* ================================================================= */}
            <div className="bg-[#111622] border border-amber-900/60 rounded-xl p-4 sm:p-5 space-y-4 shadow-lg">
              <div className="flex items-center justify-between border-b border-gray-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-600/20 border border-amber-500/40 rounded-lg text-amber-400">
                    <Crown className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs uppercase tracking-wide">
                      2. PENANDATANGAN PETINGGI / ATASAN PENGESAH
                    </h4>
                    <p className="text-[10px] text-gray-400 font-mono">Bisa Diedit Manual dari Roster Petinggi Tertinggi</p>
                  </div>
                </div>
              </div>

              {/* QUICK ROSTER PETINGGI CHIPS */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-300 mb-1.5">
                  Pilihan Cepat Roster Petinggi Resmi:
                </label>
                <div className="grid grid-cols-2 gap-1.5 max-h-24 overflow-y-auto pr-1">
                  <button
                    type="button"
                    onClick={() => handleSelectPetinggiPreset({
                      name: 'Jackie Xianlao',
                      rank: 'CHIEF OF POLICE [COP]',
                      badge: '#001',
                      title: 'Kepala Kepolisian Negara HighState',
                      seal: 'HSPD_OFFICIAL'
                    })}
                    className="p-1.5 text-left bg-[#090C12] hover:bg-amber-950/40 border border-gray-800 hover:border-amber-600/60 rounded text-[10px] transition"
                  >
                    <div className="font-bold text-white truncate">Jackie Xianlao</div>
                    <div className="text-amber-400 font-mono text-[9px] truncate">CHIEF OF POLICE [COP] #001</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectPetinggiPreset({
                      name: 'Momo Hatakeyama',
                      rank: 'PRESIDENT [RANK 6]',
                      badge: '#GOV-01',
                      title: 'Presiden & Kepala Otoritas Perizinan',
                      seal: 'PRESIDENTIAL_SEAL'
                    })}
                    className="p-1.5 text-left bg-[#090C12] hover:bg-amber-950/40 border border-gray-800 hover:border-amber-600/60 rounded text-[10px] transition"
                  >
                    <div className="font-bold text-white truncate">Momo Hatakeyama</div>
                    <div className="text-amber-400 font-mono text-[9px] truncate">PRESIDENT [RANK 6] #GOV-01</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectPetinggiPreset({
                      name: 'Damz Askara',
                      rank: 'DEPUTY CHIEF [D/C]',
                      badge: '#002',
                      title: 'Wakil Kepala Kepolisian HighState',
                      seal: 'HIGH_COMMAND'
                    })}
                    className="p-1.5 text-left bg-[#090C12] hover:bg-amber-950/40 border border-gray-800 hover:border-amber-600/60 rounded text-[10px] transition"
                  >
                    <div className="font-bold text-white truncate">Damz Askara</div>
                    <div className="text-amber-400 font-mono text-[9px] truncate">DEPUTY CHIEF [D/C] #002</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectPetinggiPreset({
                      name: 'Terry Jeffords',
                      rank: 'COMMANDER [CDR]',
                      badge: '#301',
                      title: 'Komandan Biro Operasional & Pengawasan',
                      seal: 'HSPD_OFFICIAL'
                    })}
                    className="p-1.5 text-left bg-[#090C12] hover:bg-amber-950/40 border border-gray-800 hover:border-amber-600/60 rounded text-[10px] transition"
                  >
                    <div className="font-bold text-white truncate">Terry Jeffords</div>
                    <div className="text-amber-400 font-mono text-[9px] truncate">COMMANDER [CDR] #301</div>
                  </button>
                </div>
              </div>

              {/* MANUAL INPUT FOR PETINGGI NAME */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                  Nama Petinggi / Atasan Pengesah <span className="text-amber-400 font-mono">(Bisa Diedit Manual)</span>
                </label>
                <input
                  type="text"
                  value={highOfficialName}
                  onChange={(e) => setHighOfficialName(e.target.value)}
                  placeholder="Contoh: Jackie Xianlao atau Momo Hatakeyama"
                  className="w-full bg-[#090C12] border border-gray-700 focus:border-amber-500 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none"
                  required
                />
              </div>

              {/* MANUAL INPUT FOR PETINGGI RANK & BADGE */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                    Badge / ID Petinggi
                  </label>
                  <input
                    type="text"
                    value={highOfficialBadge}
                    onChange={(e) => setHighOfficialBadge(e.target.value)}
                    placeholder="#001 atau #GOV-01"
                    className="w-full bg-[#090C12] border border-gray-700 focus:border-amber-500 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                    Pangkat / Jabatan Tinggi
                  </label>
                  <input
                    type="text"
                    value={highOfficialRank}
                    onChange={(e) => setHighOfficialRank(e.target.value)}
                    placeholder="CHIEF OF POLICE [COP]"
                    className="w-full bg-[#090C12] border border-gray-700 focus:border-amber-500 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* JABATAN PENGESAHAN */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                  Judul Otoritas Pengesahan (Kop Pengesah)
                </label>
                <input
                  type="text"
                  value={highOfficialTitle}
                  onChange={(e) => setHighOfficialTitle(e.target.value)}
                  placeholder="Kepala Kepolisian Negara HighState"
                  className="w-full bg-[#090C12] border border-gray-700 focus:border-amber-500 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none"
                />
              </div>

              {/* PILIHAN STEMPEL RESMI */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-300 mb-1.5 flex items-center justify-between">
                  <span>Stempel Cap Dinas Otoritas:</span>
                  <span className="font-mono text-amber-300 text-[10px]">{selectedSeal}</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['HSPD_OFFICIAL', 'PRESIDENTIAL_SEAL', 'HIGH_COMMAND_CREST', 'APPROVED_PASSED'] as SealType[]).map((seal) => (
                    <button
                      key={seal}
                      type="button"
                      onClick={() => setSelectedSeal(seal)}
                      className={`p-2 rounded-lg border flex flex-col items-center justify-center gap-1 transition ${
                        selectedSeal === seal
                          ? 'border-amber-500 bg-amber-950/40 text-amber-300 ring-1 ring-amber-500/50'
                          : 'border-gray-800 bg-[#090C12] text-gray-400 hover:text-white hover:border-gray-700'
                      }`}
                    >
                      <OfficialSeal type={seal} size={36} />
                      <span className="text-[8px] font-mono truncate w-full text-center mt-0.5">
                        {seal.replace('_', ' ')}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* STATUS PENGESAHAN PETINGGI */}
              <div className="p-3 bg-[#090C12] border border-gray-800 rounded-lg flex items-center justify-between">
                <div>
                  <span className="font-semibold text-gray-200 block text-xs">Status Pengesahan Petinggi</span>
                  <span className="text-[10px] text-gray-400">
                    {highOfficialSigned ? '✓ Telah Disahkan Oleh Petinggi / Atasan' : '⏳ Belum Disahkan Petinggi'}
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={highOfficialSigned}
                    onChange={(e) => setHighOfficialSigned(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* STATUS LEGALITAS SURAT & CATATAN */}
          <div className="bg-[#111622] border border-gray-800 rounded-xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-800 pb-3">
              <div>
                <span className="font-bold text-white text-xs block">STATUS KELAYAKAN DOKUMEN (LEGAL STATUS):</span>
                <span className="text-[10px] text-gray-400">Tentukan status hukum dokumen setelah verifikasi berkas</span>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDocStatus('APPROVED')}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition flex items-center gap-1.5 ${
                    docStatus === 'APPROVED'
                      ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/50'
                      : 'bg-gray-900 border-gray-700 text-gray-400 hover:text-white'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>SAH (APPROVED)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDocStatus('PENDING')}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition flex items-center gap-1.5 ${
                    docStatus === 'PENDING'
                      ? 'bg-amber-950/80 border-amber-500 text-amber-300 ring-1 ring-amber-500/50'
                      : 'bg-gray-900 border-gray-700 text-gray-400 hover:text-white'
                  }`}
                >
                  <span>⏳ DALAM PROSES</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDocStatus('REJECTED')}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition flex items-center gap-1.5 ${
                    docStatus === 'REJECTED'
                      ? 'bg-rose-950/80 border-rose-500 text-rose-300 ring-1 ring-rose-500/50'
                      : 'bg-gray-900 border-gray-700 text-gray-400 hover:text-white'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span>DITOLAK (REJECTED)</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                Catatan Verifikasi & Otorisasi Resmi
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Tuliskan catatan verifikasi berkas atau alasan pengesahan..."
                className="w-full bg-[#090C12] border border-gray-700 focus:border-blue-500 rounded-lg p-2.5 text-xs text-white placeholder-gray-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* MODAL FOOTER ACTIONS */}
        <div className="p-4 sm:p-5 bg-[#0A0D14] border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-gray-400 text-xs font-mono">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Perubahan tanda tangan akan langsung tercermin pada cetakan fisik surat resmi.</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-semibold transition"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={() => handleSave(false)}
              className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-lg shadow-blue-900/40"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Penandatangan</span>
            </button>

            <button
              type="button"
              onClick={() => handleSave(true)}
              className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-lg shadow-amber-950/40"
            >
              <Printer className="w-4 h-4" />
              <span>Simpan & Buka Surat Cetak</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
