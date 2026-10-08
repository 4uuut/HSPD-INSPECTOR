import React, { useState } from 'react';
import { 
  X, Save, Shield, MapPin, Calendar, Clock, Users, 
  AlertTriangle, Crosshair, Image as ImageIcon, Upload, 
  Sparkles, Check, Send, Plus, Trash2, Camera, RefreshCw
} from 'lucide-react';
import { 
  DivisionCaseFile, 
  DivisionType, 
  CaseFileCategory, 
  CaseOutcomeStatus, 
  OfficerProfile 
} from '../../types';
import { 
  TACTICAL_PHOTO_PRESETS, 
  PRESET_POLICE_WEAPONS, 
  PRESET_SUSPECT_WEAPONS, 
  PRESET_LOCATIONS, 
  PRESET_TACTICAL_VEHICLES 
} from '../../data/divisionCasePresets';
import { processAndCompressImage } from '../../utils/imageCompressor';
import { sendDivisionCaseFileToDiscord } from '../../utils/divisionCaseWebhook';
import { generateNextCaseNumber } from '../../utils/specializedDivisionsStorage';

interface Props {
  initialData?: DivisionCaseFile | null;
  defaultDivision?: DivisionType;
  currentOfficer: OfficerProfile | null;
  onSave: (caseFile: DivisionCaseFile) => void;
  onClose: () => void;
}

const CATEGORY_DEFAULT_TITLES: Record<CaseFileCategory, string> = {
  BANK_ROBBERY_CENTRAL: 'Penanganan Perampokan Bank Pusat Pacific Standard (Armed Hostage Siege)',
  BANK_ROBBERY_RURAL: 'Penanganan Perampokan Bank Pedesaan (Rural Armed Siege & Vault Breach)',
  STORE_ROBBERY: 'Penanganan Perampokan Bersenjata Toko Perhiasan Vangelico / Minimarket',
  HOSTAGE_RESCUE: 'Operasi Taktis Pembebasan Sandera & Barikade Bersenjata',
  HIGH_RISK_RAID: 'Operasi Penggerebekan Markas Kartel & Sindikat Senjata Ilegal',
  HIGH_SPEED_PURSUIT: 'Pengejaran Kecepatan Tinggi (10-80) & Pelacakan Taktis Udara FLIR',
  NARCOTICS_SWEEP: 'Penyisiran Satwa K-9 Sindikat Peredaran Narkotika Pelabuhan',
  TRAFFIC_CRACKDOWN: 'Penindakan Balap Liar Massal & Penyekatan Jalan Tol',
  INTERNAL_INVESTIGATION: 'Investigasi Disiplin & Penegakan Kode Etik Kepolisian',
  TACTICAL_TRAINING: 'Latihan Taktis Gabungan & Uji Kemampuan Kadet Lapangan',
  SPECIAL_OPERATION: 'Operasi Taktis Khusus Gabungan Kepolisian HighState'
};

const CATEGORY_DEFAULT_LOCATIONS: Record<CaseFileCategory, string> = {
  BANK_ROBBERY_CENTRAL: 'Pacific Standard Public Depository, Alta Street & Vinewood Blvd, Los Santos',
  BANK_ROBBERY_RURAL: 'Blaine County Savings Bank (Bank Pedesaan Paleto), Paleto Boulevard, Paleto Bay',
  STORE_ROBBERY: 'Vangelico Jewelers, Portola Drive, Rockford Hills',
  HOSTAGE_RESCUE: 'Gedung Komersial Downtown Vinewood',
  HIGH_RISK_RAID: 'Ocean Docks Container Warehouse Terminal Unit 14B',
  HIGH_SPEED_PURSUIT: 'Del Perro Freeway Exit 4 s/d Jembatan Overpass La Puerta',
  NARCOTICS_SWEEP: 'Ocean Docks Terminal, Gudang Kontainer Unit 14B, South Los Santos',
  TRAFFIC_CRACKDOWN: 'Del Perro Freeway Exit 4 s/d Jembatan Overpass La Puerta',
  INTERNAL_INVESTIGATION: 'Ruang Sidang Komisi Etik Mabes HSPD Mission Row, Los Santos',
  TACTICAL_TRAINING: 'Police Academy Training Ground, San Andreas Boulevard',
  SPECIAL_OPERATION: 'Markas Besar Kepolisian HSPD, Mission Row'
};

export const CreateDivisionCaseFileModal: React.FC<Props> = ({
  initialData,
  defaultDivision,
  currentOfficer,
  onSave,
  onClose
}) => {
  const isEditing = Boolean(initialData);

  // Form States - Automatically generated sequential case number
  const initialDivision: DivisionType = initialData?.division || defaultDivision || 'SWAT';
  const [division, setDivision] = useState<DivisionType>(initialDivision);
  const [category, setCategory] = useState<CaseFileCategory>(initialData?.category || 'BANK_ROBBERY_CENTRAL');
  const [caseNumber, setCaseNumber] = useState<string>(
    initialData?.caseNumber || generateNextCaseNumber(initialDivision)
  );
  const [caseTitle, setCaseTitle] = useState<string>(
    initialData?.caseTitle || 'Penanganan Perampokan Bank Pusat Pacific Standard (Armed Hostage Siege)'
  );
  const [location, setLocation] = useState<string>(
    initialData?.location || 'Pacific Standard Public Depository, Alta Street & Vinewood Blvd, Los Santos'
  );
  const [incidentDate, setIncidentDate] = useState<string>(
    initialData?.incidentDate || new Date().toISOString().slice(0, 10)
  );
  const [incidentTime, setIncidentTime] = useState<string>(
    initialData?.incidentTime || `${new Date().getHours().toString().padStart(2, '0')}:${new Date().getMinutes().toString().padStart(2, '0')} WIB`
  );

  // Commander & Officers
  const [commanderName, setCommanderName] = useState<string>(
    initialData?.commanderName || currentOfficer?.name || 'David Miller'
  );
  const [commanderBadge, setCommanderBadge] = useState<string>(
    initialData?.commanderBadge || currentOfficer?.badge || '#045'
  );
  const [commanderRank, setCommanderRank] = useState<string>(
    initialData?.commanderRank || currentOfficer?.rank || 'COMMANDER [CDR]'
  );
  const [officersCount, setOfficersCount] = useState<number>(initialData?.officersCount || 6);
  const [participatingOfficersText, setParticipatingOfficersText] = useState<string>(
    initialData?.participatingOfficers ? initialData.participatingOfficers.join('\n') : 
    `${currentOfficer?.name || 'David Miller'} (${currentOfficer?.badge || '#045'})\nAlex Mercer (#199)\nMarcus Vance (#102)\nTommy Ross (#142)\nFrank Sinatra (#210)\nElena Rostova (#088)`
  );

  // Vehicles
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>(
    initialData?.tacticalVehicles || ['Brute SWAT Bearcat (Armored Heavy Transport)', '2x Vapid Stanier Cruiser (Perimeter Barricade)']
  );
  const [customVehicle, setCustomVehicle] = useState('');

  // Suspects & Hostages
  const [suspectsCount, setSuspectsCount] = useState<number>(initialData?.suspectsCount || 4);
  const [suspectAffiliation, setSuspectAffiliation] = useState<string>(
    initialData?.suspectAffiliation || 'Sindikat Bersenjata Topeng Badut (The Clowns Heist Crew)'
  );
  const [suspectStatusSummary, setSuspectStatusSummary] = useState<string>(
    initialData?.suspectStatusSummary || '3 Tersangka Dilumpuhkan Fatal saat Baku Tembak, 1 Tersangka Menyerah Hidup-Hidup'
  );
  const [hostagesCount, setHostagesCount] = useState<number>(initialData?.hostagesCount || 2);
  const [hostageStatus, setHostageStatus] = useState<string>(
    initialData?.hostageStatus || '2 Sandera Dievakuasi Selamat 100% Tanpa Cidera Fisik'
  );
  const [policeCasualties, setPoliceCasualties] = useState<string>(
    initialData?.policeCasualties || 'Nihil Korban Jiwa; 1 Anggota Luka Ringan Peluru Rebound (Stabil)'
  );

  // Weapons
  const [policeWeapons, setPoliceWeapons] = useState<string[]>(
    initialData?.policeWeapons || ['Carbine Rifle Mk II (5.56x45mm NATO)', 'Tactical Shotgun 12-Gauge Drum', 'Flashbang Grenade M84 (Stun)']
  );
  const [customPoliceWeapon, setCustomPoliceWeapon] = useState('');

  const [suspectWeapons, setSuspectWeapons] = useState<string[]>(
    initialData?.suspectWeapons || ['Assault Rifle AK-47 (7.62x39mm)', 'Micro SMG Uzi (9mm Automatic)', 'Alat Las Thermite Bor C4 (Pemotong Brankas)']
  );
  const [customSuspectWeapon, setCustomSuspectWeapon] = useState('');

  // 3 Photos
  const [photo1Url, setPhoto1Url] = useState<string>(
    initialData?.photoNegotiation?.url || 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800&auto=format&fit=crop&q=80'
  );
  const [photo1Caption, setPhoto1Caption] = useState<string>(
    initialData?.photoNegotiation?.caption || 'Negosiator SWAT Berdialog dengan Perampok di Pintu Utama'
  );
  const [photo1Notes, setPhoto1Notes] = useState<string>(
    initialData?.photoNegotiation?.stageNotes || 'Negosiator membuka saluran dialog 10-99 via pengeras suara. Pelaku menuntut mobil pelarian dan menolak melepas sandera.'
  );

  const [photo2Url, setPhoto2Url] = useState<string>(
    initialData?.photoSetupShooting?.url || 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=800&auto=format&fit=crop&q=80'
  );
  const [photo2Caption, setPhoto2Caption] = useState<string>(
    initialData?.photoSetupShooting?.caption || 'Setup Posisi Sniper Rooftop & Barikade Baku Tembak Mobil Suspect'
  );
  const [photo2Notes, setPhoto2Notes] = useState<string>(
    initialData?.photoSetupShooting?.stageNotes || 'Pelaku mulai menembaki perimeter luar saat membawa tas uang. Tim sniper atap melancarkan tembakan presisi melumpuhkan tersangka.'
  );

  const [photo3Url, setPhoto3Url] = useState<string>(
    initialData?.photoFinalOutcome?.url || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=80'
  );
  const [photo3Caption, setPhoto3Caption] = useState<string>(
    initialData?.photoFinalOutcome?.caption || 'Operasi Selesai (Code 4), Sandera Aman, Pelaku Diborgol & Uang Disita'
  );
  const [photo3Notes, setPhoto3Notes] = useState<string>(
    initialData?.photoFinalOutcome?.stageNotes || 'Tim breacher menyerbu dari pintu samping. Pelaku menyerah, sandera dievakuasi, dan seluruh uang tunai brankas berhasil diamankan.'
  );

  // Outcome & Narratives
  const [outcomeStatus, setOutcomeStatus] = useState<CaseOutcomeStatus>(
    initialData?.outcomeStatus || 'BERHASIL'
  );
  const [lootRecovered, setLootRecovered] = useState<string>(
    initialData?.lootRecovered || '$750,000 Uang Tunai Brankas Bank (100% Terselamatkan)'
  );
  const [lootLoss, setLootLoss] = useState<string>(
    initialData?.lootLoss || 'Nihil Kerugian Finansial'
  );
  const [confiscatedText, setConfiscatedText] = useState<string>(
    initialData?.confiscatedEvidences ? initialData.confiscatedEvidences.join('\n') :
    '4 Pucuk Senjata Api Otomatis Suspect\n1 Unit Mesin Thermite Bor C4\n3 Tas Duffle Berisi Uang Tunai\n1 Unit Mobil Pelarian Declasse Sultan'
  );
  const [chronologySummary, setChronologySummary] = useState<string>(
    initialData?.chronologySummary || 'Alarm silent bank berbunyi. Unit taktis tiba membentuk perimeter tertutup. Negosiasi berlangsung alot hingga pelaku memulai kontak tembak keluar gedung. Petugas membalas dengan tembakan terukur melumpuhkan pelaku dan mengamankan seluruh sandera.'
  );
  const [tacticalEvaluation, setTacticalEvaluation] = useState<string>(
    initialData?.tacticalEvaluation || 'Respon cepat perimeter dan penempatan posisi sniper rooftop sangat menentukan dalam menetralisir ancaman senjata otomatis perampok tanpa menimbulkan korban jiwa dari pihak warga sandera.'
  );

  const [autoSendDiscord, setAutoSendDiscord] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Image Upload Handlers
  const handleFileUpload = async (file: File, setter: (url: string) => void) => {
    try {
      const compressed = await processAndCompressImage(file, 1200, 800, 0.8);
      setter(compressed.dataUrl);
    } catch (e) {
      console.error('Failed to compress image:', e);
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) setter(ev.target.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTogglePoliceWeapon = (w: string) => {
    if (policeWeapons.includes(w)) {
      setPoliceWeapons(policeWeapons.filter(item => item !== w));
    } else {
      setPoliceWeapons([...policeWeapons, w]);
    }
  };

  const handleAddCustomPoliceWeapon = () => {
    if (customPoliceWeapon.trim() && !policeWeapons.includes(customPoliceWeapon.trim())) {
      setPoliceWeapons([...policeWeapons, customPoliceWeapon.trim()]);
      setCustomPoliceWeapon('');
    }
  };

  const handleToggleSuspectWeapon = (w: string) => {
    if (suspectWeapons.includes(w)) {
      setSuspectWeapons(suspectWeapons.filter(item => item !== w));
    } else {
      setSuspectWeapons([...suspectWeapons, w]);
    }
  };

  const handleAddCustomSuspectWeapon = () => {
    if (customSuspectWeapon.trim() && !suspectWeapons.includes(customSuspectWeapon.trim())) {
      setSuspectWeapons([...suspectWeapons, customSuspectWeapon.trim()]);
      setCustomSuspectWeapon('');
    }
  };

  const handleToggleVehicle = (v: string) => {
    if (selectedVehicles.includes(v)) {
      setSelectedVehicles(selectedVehicles.filter(item => item !== v));
    } else {
      setSelectedVehicles([...selectedVehicles, v]);
    }
  };

  const handleAddCustomVehicle = () => {
    if (customVehicle.trim() && !selectedVehicles.includes(customVehicle.trim())) {
      setSelectedVehicles([...selectedVehicles, customVehicle.trim()]);
      setCustomVehicle('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const officersList = participatingOfficersText
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    const evidencesList = confiscatedText
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    const newCaseFile: DivisionCaseFile = {
      id: initialData?.id || `case-${division.toLowerCase()}-${Date.now()}`,
      caseNumber: caseNumber.trim() || generateNextCaseNumber(division),
      caseTitle: caseTitle.trim(),
      division,
      category,
      location: location.trim(),
      incidentDate,
      incidentTime,
      commanderName: commanderName.trim(),
      commanderBadge: commanderBadge.trim(),
      commanderRank: commanderRank.trim(),
      officersCount: Number(officersCount) || officersList.length || 1,
      participatingOfficers: officersList,
      tacticalVehicles: selectedVehicles,
      suspectsCount: Number(suspectsCount) || 0,
      suspectAffiliation: suspectAffiliation.trim(),
      suspectStatusSummary: suspectStatusSummary.trim(),
      hostagesCount: Number(hostagesCount) || 0,
      hostageStatus: hostageStatus.trim(),
      policeCasualties: policeCasualties.trim(),
      policeWeapons,
      suspectWeapons,
      photoNegotiation: {
        url: photo1Url.trim(),
        caption: photo1Caption.trim(),
        stageNotes: photo1Notes.trim()
      },
      photoSetupShooting: {
        url: photo2Url.trim(),
        caption: photo2Caption.trim(),
        stageNotes: photo2Notes.trim()
      },
      photoFinalOutcome: {
        url: photo3Url.trim(),
        caption: photo3Caption.trim(),
        stageNotes: photo3Notes.trim()
      },
      outcomeStatus,
      lootRecovered: lootRecovered.trim(),
      lootLoss: lootLoss.trim(),
      confiscatedEvidences: evidencesList,
      chronologySummary: chronologySummary.trim(),
      tacticalEvaluation: tacticalEvaluation.trim(),
      signedByCommander: true,
      signedTimestamp: Date.now(),
      createdAt: initialData?.createdAt || Date.now(),
      updatedAt: Date.now()
    };

    onSave(newCaseFile);

    if (autoSendDiscord) {
      sendDivisionCaseFileToDiscord(newCaseFile).catch(err => {
        console.warn('Auto Discord send failed:', err);
      });
    }

    setIsSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-[#0D121B] border border-gray-700/80 rounded-2xl w-full max-w-4xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden font-sans text-xs">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-[#111724] via-[#161F30] to-[#111724] border-b border-gray-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/50 flex items-center justify-center text-blue-400">
              <Shield className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">
                {isEditing ? 'EDIT BERKAS KASUS OPERASIONAL' : 'BUAT CASE FILE OPERASIONAL DIVISI BARU'}
              </h2>
              <p className="text-[11px] text-gray-400">
                Pencatatan penanganan misi taktis kepolisian dengan 3 bukti dokumentasi foto dan rincian lengkap
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-gray-200">
          {/* SECTION 1: IDENTITAS & DIVISI */}
          <div className="space-y-3">
            <div className="text-[11px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-800 pb-1.5">
              <span>1. DIVISI KEPOLISIAN & INFORMASI KASUS</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-300 mb-1">
                  Divisi Penanggung Jawab <span className="text-rose-400">*</span>
                </label>
                <select
                  value={division}
                  onChange={(e) => {
                    const newDiv = e.target.value as DivisionType;
                    setDivision(newDiv);
                    if (!isEditing) {
                      setCaseNumber(generateNextCaseNumber(newDiv));
                    }
                  }}
                  className="w-full bg-[#161D2A] border border-gray-700 rounded-lg p-2 text-xs text-white font-bold outline-none focus:border-blue-500"
                >
                  <option value="SWAT">🛡️ SWAT / METRO (Special Weapons & Tactics)</option>
                  <option value="ASD">🚁 ASD (Air Support Division)</option>
                  <option value="K9">🐕 K-9 (Canine Unit Squad)</option>
                  <option value="TED">🚔 TED (Satlantas / Traffic Enforcement)</option>
                  <option value="IAD">⚖️ IAD (Propam / Internal Affairs)</option>
                  <option value="ACADEMY">🎓 POLICE ACADEMY / FTO</option>
                  <option value="PATROL">🚓 PATROLI REGULER & HIGHWAY</option>
                  <option value="DETECTIVE">🔍 DETECTIVE BUREAU / CID</option>
                  <option value="HIGH_COMMAND">👑 HIGH COMMAND MABES</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-300 mb-1">
                  Kategori Penanganan Kasus <span className="text-rose-400">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => {
                    const newCat = e.target.value as CaseFileCategory;
                    setCategory(newCat);
                    if (!isEditing) {
                      if (CATEGORY_DEFAULT_TITLES[newCat]) {
                        setCaseTitle(CATEGORY_DEFAULT_TITLES[newCat]);
                      }
                      if (CATEGORY_DEFAULT_LOCATIONS[newCat]) {
                        setLocation(CATEGORY_DEFAULT_LOCATIONS[newCat]);
                      }
                    }
                  }}
                  className="w-full bg-[#161D2A] border border-gray-700 rounded-lg p-2 text-xs text-white font-medium outline-none focus:border-blue-500"
                >
                  <option value="BANK_ROBBERY_CENTRAL">🏦 Perampokan Bank Pusat (Pacific Standard)</option>
                  <option value="BANK_ROBBERY_RURAL">🏪 Perampokan Bank Pedesaan (Paleto / Fleeca)</option>
                  <option value="STORE_ROBBERY">💎 Perampokan Toko / Minimarket / Vangelico</option>
                  <option value="HOSTAGE_RESCUE">🚨 Pembebasan Sandera (Hostage Situation)</option>
                  <option value="HIGH_RISK_RAID">💣 Penggerebekan Markas Kartel / Senjata Ilegal</option>
                  <option value="HIGH_SPEED_PURSUIT">🏎️ Pengejaran Kecepatan Tinggi (10-80 Airborne)</option>
                  <option value="NARCOTICS_SWEEP">💊 Penyisiran Narkotika Satwa K-9</option>
                  <option value="TRAFFIC_CRACKDOWN">🏁 Penindakan Balap Liar / Razia Satlantas</option>
                  <option value="INTERNAL_INVESTIGATION">⚖️ Investigasi Disiplin & Pelanggaran Etik</option>
                  <option value="TACTICAL_TRAINING">🎯 Latihan Taktis Gabungan & Uji Kadet</option>
                  <option value="SPECIAL_OPERATION">⭐ Operasi Khusus Gabungan Lainnya</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-gray-300 flex items-center gap-1.5">
                    <span>Nomor Berkas Kasus</span>
                    <span className="text-rose-400">*</span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-950/90 border border-emerald-600/80 text-emerald-400 font-mono text-[9px] font-bold flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
                      ✓ Otomatis Terisi
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setCaseNumber(generateNextCaseNumber(division))}
                    className="text-[10px] text-blue-400 hover:text-blue-300 font-mono flex items-center gap-1 cursor-pointer transition active:scale-95 bg-blue-950/50 hover:bg-blue-900/60 px-2 py-0.5 rounded border border-blue-800/60"
                    title="Generate ulang nomor urut otomatis sesuai urutan kasus divisi"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Generate Ulang</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={caseNumber}
                    onChange={(e) => setCaseNumber(e.target.value)}
                    className="w-full bg-[#161D2A] border border-gray-700 rounded-lg p-2 pr-28 text-xs text-amber-300 font-mono font-bold outline-none focus:border-blue-500"
                    placeholder={`Contoh: CASE-${division}-2026-003`}
                    required
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/90 border border-emerald-700/60 text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="w-2.5 h-2.5" /> AUTO-NUM
                    </span>
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1 font-mono">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Otomatis mengikuti nomor urut berkas divisi {division} (Format: CASE-{division}-{new Date().getFullYear()}-00X). Anda dapat mengeditnya jika diperlukan.</span>
                </p>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-300 mb-1">
                Judul Berkas Operasi Penanganan <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={caseTitle}
                onChange={(e) => setCaseTitle(e.target.value)}
                placeholder="Contoh: Penanganan Perampokan Bank Pusat Pacific Standard"
                className="w-full bg-[#161D2A] border border-gray-700 rounded-lg p-2 text-xs text-white font-bold outline-none focus:border-blue-500"
                required
              />
            </div>

            {/* Location & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-gray-300 mb-1">
                  Lokasi Kejadian (TKP) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-[#161D2A] border border-gray-700 rounded-lg p-2 text-xs text-white outline-none focus:border-blue-500"
                  required
                />
                {/* Location Quick Presets */}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  <span className="text-[10px] text-gray-500">Pilihan Cepat:</span>
                  {PRESET_LOCATIONS.slice(0, 4).map((loc, idx) => (
                    <button
                      key={`${loc}-${idx}`}
                      type="button"
                      onClick={() => setLocation(loc)}
                      className="text-[9px] px-1.5 py-0.5 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 transition"
                    >
                      {loc.split(',')[0]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-gray-300 mb-1">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    value={incidentDate}
                    onChange={(e) => setIncidentDate(e.target.value)}
                    className="w-full bg-[#161D2A] border border-gray-700 rounded-lg p-2 text-xs text-white outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-300 mb-1">
                    Jam
                  </label>
                  <input
                    type="text"
                    value={incidentTime}
                    onChange={(e) => setIncidentTime(e.target.value)}
                    placeholder="14:30 WIB"
                    className="w-full bg-[#161D2A] border border-gray-700 rounded-lg p-2 text-xs text-white font-mono outline-none"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: PERSONEL & TIM PENANGANAN */}
          <div className="space-y-3">
            <div className="text-[11px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-800 pb-1.5">
              <span>2. KEKUATAN PERSONEL & KENDARAAN TAKTIS</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-300 mb-1">
                  Komandan Lapangan (IC)
                </label>
                <input
                  type="text"
                  value={commanderName}
                  onChange={(e) => setCommanderName(e.target.value)}
                  className="w-full bg-[#161D2A] border border-gray-700 rounded-lg p-2 text-xs text-white font-bold outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-300 mb-1">
                  Badge Komandan
                </label>
                <input
                  type="text"
                  value={commanderBadge}
                  onChange={(e) => setCommanderBadge(e.target.value)}
                  className="w-full bg-[#161D2A] border border-gray-700 rounded-lg p-2 text-xs text-amber-300 font-mono font-bold outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-300 mb-1">
                  Pangkat Komandan
                </label>
                <input
                  type="text"
                  value={commanderRank}
                  onChange={(e) => setCommanderRank(e.target.value)}
                  className="w-full bg-[#161D2A] border border-gray-700 rounded-lg p-2 text-xs text-white outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-300 mb-1">
                  Jumlah Anggota Ikut
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={officersCount}
                  onChange={(e) => setOfficersCount(Number(e.target.value))}
                  className="w-full bg-[#161D2A] border border-gray-700 rounded-lg p-2 text-xs text-blue-400 font-mono font-bold outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-300 mb-1">
                  Daftar Personel yang Terlibat (1 baris per nama/badge)
                </label>
                <textarea
                  rows={3}
                  value={participatingOfficersText}
                  onChange={(e) => setParticipatingOfficersText(e.target.value)}
                  placeholder="Contoh:&#10;David Miller (#045 - Commander)&#10;Alex Mercer (#199 - SWAT Lead)&#10;Marcus Vance (#102)"
                  className="w-full bg-[#161D2A] border border-gray-700 rounded-lg p-2 text-xs text-white font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-300 mb-1">
                  Kendaraan Taktis Dikerahkan
                </label>
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1 bg-[#161D2A] border border-gray-700 rounded-lg">
                  {PRESET_TACTICAL_VEHICLES.map((veh, idx) => {
                    const isSelected = selectedVehicles.includes(veh);
                    return (
                      <button
                        key={`${veh}-${idx}`}
                        type="button"
                        onClick={() => handleToggleVehicle(veh)}
                        className={`text-[10px] px-2 py-0.5 rounded transition ${isSelected ? 'bg-blue-600 text-white font-bold' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                      >
                        {isSelected ? '✓ ' : '+ '}{veh.split(' ')[0]} {veh.split(' ')[1] || ''}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: SITUASI SUSPECT, SANDERA & SENJATA */}
          <div className="space-y-3">
            <div className="text-[11px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-800 pb-1.5">
              <span>3. SITUASI SUSPECT, SANDERA & PERSENJATAAN</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-300 mb-1">
                  Jumlah Suspect / Pelaku <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={suspectsCount}
                  onChange={(e) => setSuspectsCount(Number(e.target.value))}
                  className="w-full bg-[#161D2A] border border-gray-700 rounded-lg p-2 text-xs text-rose-400 font-mono font-bold outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-300 mb-1">
                  Afiliasi / Ciri-Ciri Suspect
                </label>
                <input
                  type="text"
                  value={suspectAffiliation}
                  onChange={(e) => setSuspectAffiliation(e.target.value)}
                  placeholder="Contoh: Sindikat Los Santos Vagos / Topeng Badut"
                  className="w-full bg-[#161D2A] border border-gray-700 rounded-lg p-2 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-300 mb-1">
                  Jumlah Sandera Warga
                </label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={hostagesCount}
                  onChange={(e) => setHostagesCount(Number(e.target.value))}
                  className="w-full bg-[#161D2A] border border-gray-700 rounded-lg p-2 text-xs text-amber-300 font-mono font-bold outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-300 mb-1">
                  Status Akhir Pelaku
                </label>
                <input
                  type="text"
                  value={suspectStatusSummary}
                  onChange={(e) => setSuspectStatusSummary(e.target.value)}
                  placeholder="3 Dilumpuhkan Fatal, 1 Menyerah Hidup-hidup"
                  className="w-full bg-[#161D2A] border border-gray-700 rounded-lg p-2 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-300 mb-1">
                  Kondisi Sandera
                </label>
                <input
                  type="text"
                  value={hostageStatus}
                  onChange={(e) => setHostageStatus(e.target.value)}
                  placeholder="2 Sandera Selamat Tanpa Cidera"
                  className="w-full bg-[#161D2A] border border-gray-700 rounded-lg p-2 text-xs text-emerald-400 font-semibold outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-300 mb-1">
                  Korban dari Pihak Polisi
                </label>
                <input
                  type="text"
                  value={policeCasualties}
                  onChange={(e) => setPoliceCasualties(e.target.value)}
                  placeholder="Nihil Korban Jiwa; 1 Anggota Luka Ringan"
                  className="w-full bg-[#161D2A] border border-gray-700 rounded-lg p-2 text-xs text-white outline-none"
                />
              </div>
            </div>

            {/* Weapons Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Police Weapons */}
              <div className="p-3 bg-[#111724] rounded-xl border border-blue-900/60 space-y-2">
                <div className="font-bold text-blue-400 text-[11px] uppercase flex items-center justify-between">
                  <span>Senjata Pihak Polisi (Centang yang Digunakan):</span>
                  <span className="font-mono text-[10px]">{policeWeapons.length} Dipilih</span>
                </div>
                <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto p-1 bg-[#090D14] rounded-lg border border-gray-800">
                  {PRESET_POLICE_WEAPONS.map((pw, idx) => {
                    const isSelected = policeWeapons.includes(pw);
                    return (
                      <button
                        key={`${pw}-${idx}`}
                        type="button"
                        onClick={() => handleTogglePoliceWeapon(pw)}
                        className={`text-[10px] px-2 py-0.5 rounded transition ${isSelected ? 'bg-blue-600 text-white font-bold' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                      >
                        {isSelected ? '✓ ' : '+ '}{pw.split(' ')[0]} {pw.split(' ')[1] || ''}
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-1 pt-1">
                  <input
                    type="text"
                    value={customPoliceWeapon}
                    onChange={(e) => setCustomPoliceWeapon(e.target.value)}
                    placeholder="Tambah senjata polisi lain..."
                    className="flex-1 bg-[#161D2A] border border-gray-700 rounded px-2 py-1 text-xs text-white outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomPoliceWeapon}
                    className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold"
                  >
                    Tambah
                  </button>
                </div>
              </div>

              {/* Suspect Weapons */}
              <div className="p-3 bg-[#111724] rounded-xl border border-rose-900/60 space-y-2">
                <div className="font-bold text-rose-400 text-[11px] uppercase flex items-center justify-between">
                  <span>Senjata Pihak Pelaku (Centang yang Digunakan):</span>
                  <span className="font-mono text-[10px]">{suspectWeapons.length} Dipilih</span>
                </div>
                <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto p-1 bg-[#090D14] rounded-lg border border-gray-800">
                  {PRESET_SUSPECT_WEAPONS.map((sw, idx) => {
                    const isSelected = suspectWeapons.includes(sw);
                    return (
                      <button
                        key={`${sw}-${idx}`}
                        type="button"
                        onClick={() => handleToggleSuspectWeapon(sw)}
                        className={`text-[10px] px-2 py-0.5 rounded transition ${isSelected ? 'bg-rose-600 text-white font-bold' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                      >
                        {isSelected ? '✓ ' : '+ '}{sw.split(' ')[0]} {sw.split(' ')[1] || ''}
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-1 pt-1">
                  <input
                    type="text"
                    value={customSuspectWeapon}
                    onChange={(e) => setCustomSuspectWeapon(e.target.value)}
                    placeholder="Tambah senjata pelaku lain..."
                    className="flex-1 bg-[#161D2A] border border-gray-700 rounded px-2 py-1 text-xs text-white outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSuspectWeapon}
                    className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-bold"
                  >
                    Tambah
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: 3 BUKTI DOKUMENTASI FOTO PENANGANAN (Mandatory User Requirement) */}
          <div className="space-y-4 p-4 bg-gradient-to-br from-[#121824] to-[#0A0E17] rounded-2xl border border-amber-600/50 shadow-inner">
            <div className="flex items-center gap-2 border-b border-gray-800 pb-2">
              <div className="p-1 rounded bg-amber-500 text-black font-black text-xs">
                3 FOTO
              </div>
              <div>
                <h3 className="text-xs font-black text-white uppercase tracking-wider">
                  4. TIGA BUKTI DOKUMENTASI FOTO PENANGANAN OPERASIONAL (WAJIB)
                </h3>
                <p className="text-[11px] text-gray-400">
                  Sertakan foto Negosiasi Awal, Lokasi Penembakan/Barikade, dan Selesai Penanganan
                </p>
              </div>
            </div>

            {/* FOTO 1: TAHAP NEGOSIASI */}
            <div className="p-3 bg-[#0A0E17] rounded-xl border border-blue-900/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-blue-400 text-xs">
                  📸 FOTO BUKTI #1: TAHAP AWAL / SAAT NEGOSIASI
                </span>
                <span className="text-[10px] text-gray-400">Tahap Negosiasi 10-99</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
                <div className="relative aspect-video bg-black/60 rounded-lg overflow-hidden border border-gray-800 flex items-center justify-center">
                  {photo1Url ? (
                    <img src={photo1Url} alt="Foto 1 Negosiasi" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-500 text-[10px]">Preview Foto Kosong</span>
                  )}
                </div>

                <div className="sm:col-span-2 space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={photo1Url}
                      onChange={(e) => setPhoto1Url(e.target.value)}
                      placeholder="Masukkan URL Gambar..."
                      className="flex-1 bg-[#161D2A] border border-gray-700 rounded-lg p-1.5 text-xs text-white outline-none"
                      required
                    />
                    <label className="px-2.5 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 flex items-center gap-1 cursor-pointer shrink-0">
                      <Upload className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold">Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, setPhoto1Url);
                        }}
                      />
                    </label>
                  </div>

                  <input
                    type="text"
                    value={photo1Caption}
                    onChange={(e) => setPhoto1Caption(e.target.value)}
                    placeholder="Judul / Keterangan Singkat Foto 1"
                    className="w-full bg-[#161D2A] border border-gray-700 rounded-lg p-1.5 text-xs text-white outline-none font-bold"
                  />

                  <textarea
                    rows={2}
                    value={photo1Notes}
                    onChange={(e) => setPhoto1Notes(e.target.value)}
                    placeholder="Catatan rincian kejadian saat negosiasi..."
                    className="w-full bg-[#161D2A] border border-gray-700 rounded-lg p-1.5 text-[11px] text-gray-300 outline-none"
                  />

                  {/* Quick Presets for Photo 1 */}
                  <div className="flex flex-wrap gap-1">
                    <span className="text-[9px] text-gray-500">Preset Foto Cepat:</span>
                    {TACTICAL_PHOTO_PRESETS.filter(p => p.stage === 'NEGOTIATION').map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setPhoto1Url(p.url);
                          setPhoto1Caption(p.suggestedCaption);
                          setPhoto1Notes(p.suggestedNotes);
                        }}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-blue-950/80 border border-blue-800/80 text-blue-300 hover:bg-blue-900 transition"
                      >
                        {p.title}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* FOTO 2: LOKASI PENEMBAKAN / SETUP BARIKADE */}
            <div className="p-3 bg-[#0A0E17] rounded-xl border border-amber-900/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-amber-400 text-xs">
                  📸 FOTO BUKTI #2: LOKASI PENEMBAKAN / SETUP BARIKADE PERAMPOK
                </span>
                <span className="text-[10px] text-gray-400">Tahap Kontak Taktis</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
                <div className="relative aspect-video bg-black/60 rounded-lg overflow-hidden border border-gray-800 flex items-center justify-center">
                  {photo2Url ? (
                    <img src={photo2Url} alt="Foto 2 Penembakan" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-500 text-[10px]">Preview Foto Kosong</span>
                  )}
                </div>

                <div className="sm:col-span-2 space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={photo2Url}
                      onChange={(e) => setPhoto2Url(e.target.value)}
                      placeholder="Masukkan URL Gambar..."
                      className="flex-1 bg-[#161D2A] border border-gray-700 rounded-lg p-1.5 text-xs text-white outline-none"
                      required
                    />
                    <label className="px-2.5 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 flex items-center gap-1 cursor-pointer shrink-0">
                      <Upload className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold">Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, setPhoto2Url);
                        }}
                      />
                    </label>
                  </div>

                  <input
                    type="text"
                    value={photo2Caption}
                    onChange={(e) => setPhoto2Caption(e.target.value)}
                    placeholder="Judul / Keterangan Singkat Foto 2"
                    className="w-full bg-[#161D2A] border border-gray-700 rounded-lg p-1.5 text-xs text-white outline-none font-bold"
                  />

                  <textarea
                    rows={2}
                    value={photo2Notes}
                    onChange={(e) => setPhoto2Notes(e.target.value)}
                    placeholder="Catatan rincian lokasi penembakan & barikade..."
                    className="w-full bg-[#161D2A] border border-gray-700 rounded-lg p-1.5 text-[11px] text-gray-300 outline-none"
                  />

                  {/* Quick Presets for Photo 2 */}
                  <div className="flex flex-wrap gap-1">
                    <span className="text-[9px] text-gray-500">Preset Foto Cepat:</span>
                    {TACTICAL_PHOTO_PRESETS.filter(p => p.stage === 'SHOOTING_SETUP').map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setPhoto2Url(p.url);
                          setPhoto2Caption(p.suggestedCaption);
                          setPhoto2Notes(p.suggestedNotes);
                        }}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-800/80 text-amber-300 hover:bg-amber-900 transition"
                      >
                        {p.title}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* FOTO 3: SELESAI PENANGANAN / HASIL AKHIR */}
            <div className="p-3 bg-[#0A0E17] rounded-xl border border-emerald-900/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-emerald-400 text-xs">
                  📸 FOTO BUKTI #3: SELESAI PENANGANAN (HASIL AKHIR BERHASIL/TIDAK)
                </span>
                <span className="text-[10px] text-gray-400">Tahap Akhir / Code 4</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
                <div className="relative aspect-video bg-black/60 rounded-lg overflow-hidden border border-gray-800 flex items-center justify-center">
                  {photo3Url ? (
                    <img src={photo3Url} alt="Foto 3 Selesai" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-500 text-[10px]">Preview Foto Kosong</span>
                  )}
                </div>

                <div className="sm:col-span-2 space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={photo3Url}
                      onChange={(e) => setPhoto3Url(e.target.value)}
                      placeholder="Masukkan URL Gambar..."
                      className="flex-1 bg-[#161D2A] border border-gray-700 rounded-lg p-1.5 text-xs text-white outline-none"
                      required
                    />
                    <label className="px-2.5 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 flex items-center gap-1 cursor-pointer shrink-0">
                      <Upload className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold">Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, setPhoto3Url);
                        }}
                      />
                    </label>
                  </div>

                  <input
                    type="text"
                    value={photo3Caption}
                    onChange={(e) => setPhoto3Caption(e.target.value)}
                    placeholder="Judul / Keterangan Singkat Foto 3"
                    className="w-full bg-[#161D2A] border border-gray-700 rounded-lg p-1.5 text-xs text-white outline-none font-bold"
                  />

                  <textarea
                    rows={2}
                    value={photo3Notes}
                    onChange={(e) => setPhoto3Notes(e.target.value)}
                    placeholder="Catatan rincian hasil penanganan, evakuasi, dan status berhasil/tidaknya..."
                    className="w-full bg-[#161D2A] border border-gray-700 rounded-lg p-1.5 text-[11px] text-gray-300 outline-none"
                  />

                  {/* Quick Presets for Photo 3 */}
                  <div className="flex flex-wrap gap-1">
                    <span className="text-[9px] text-gray-500">Preset Foto Cepat:</span>
                    {TACTICAL_PHOTO_PRESETS.filter(p => p.stage === 'FINAL_OUTCOME').map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setPhoto3Url(p.url);
                          setPhoto3Caption(p.suggestedCaption);
                          setPhoto3Notes(p.suggestedNotes);
                        }}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 hover:bg-emerald-900 transition"
                      >
                        {p.title}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 5: HASIL AKHIR & KRONOLOGI */}
          <div className="space-y-3">
            <div className="text-[11px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-800 pb-1.5">
              <span>5. HASIL AKHIR, SITAAN & KRONOLOGI OPERASI</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-300 mb-1">
                  Status Keberhasilan Operasi <span className="text-rose-400">*</span>
                </label>
                <select
                  value={outcomeStatus}
                  onChange={(e) => setOutcomeStatus(e.target.value as CaseOutcomeStatus)}
                  className="w-full bg-[#161D2A] border border-gray-700 rounded-lg p-2 text-xs text-emerald-400 font-extrabold outline-none"
                >
                  <option value="BERHASIL">✅ BERHASIL (CODE 4 - SANDERA AMAN & SUSPECT DILUMPUHKAN)</option>
                  <option value="SEBAGIAN_BERHASIL">⚠️ SEBAGIAN BERHASIL (ADA CATATAN/DAMPAK)</option>
                  <option value="GAGAL">❌ GAGAL / CODE 0 (SUSPECT KABUR / KORBAN JIWA)</option>
                  <option value="DALAM_PENANGANAN">⚡ DALAM PENANGANAN AKTIF (CODE 3 IN-PROGRESS)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-300 mb-1">
                  Uang/Kas yang Diselamatkan
                </label>
                <input
                  type="text"
                  value={lootRecovered}
                  onChange={(e) => setLootRecovered(e.target.value)}
                  placeholder="$750,000 Uang Tunai Bank (100% Utuh)"
                  className="w-full bg-[#161D2A] border border-gray-700 rounded-lg p-2 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-300 mb-1">
                  Kerugian Operasi / Finansial
                </label>
                <input
                  type="text"
                  value={lootLoss}
                  onChange={(e) => setLootLoss(e.target.value)}
                  placeholder="Nihil Kerugian Finansial"
                  className="w-full bg-[#161D2A] border border-gray-700 rounded-lg p-2 text-xs text-white outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-300 mb-1">
                Daftar Barang Bukti Sitaan (1 baris per item)
              </label>
              <textarea
                rows={2}
                value={confiscatedText}
                onChange={(e) => setConfiscatedText(e.target.value)}
                placeholder="4 Pucuk Senjata Api Otomatis Suspect&#10;1 Mesin Bor Thermite&#10;3 Tas Uang Tunai"
                className="w-full bg-[#161D2A] border border-gray-700 rounded-lg p-2 text-xs text-white font-mono outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-300 mb-1">
                  Kronologi Lengkap Penanganan Operasi
                </label>
                <textarea
                  rows={4}
                  value={chronologySummary}
                  onChange={(e) => setChronologySummary(e.target.value)}
                  className="w-full bg-[#161D2A] border border-gray-700 rounded-lg p-2 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-300 mb-1">
                  Evaluasi Taktis & Catatan Pimpinan
                </label>
                <textarea
                  rows={4}
                  value={tacticalEvaluation}
                  onChange={(e) => setTacticalEvaluation(e.target.value)}
                  className="w-full bg-[#161D2A] border border-gray-700 rounded-lg p-2 text-xs text-white outline-none"
                />
              </div>
            </div>

            <div className="p-3 bg-[#111724] rounded-xl border border-gray-800 flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSendDiscord}
                  onChange={(e) => setAutoSendDiscord(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 bg-gray-900 border-gray-700 focus:ring-0"
                />
                <span className="font-semibold text-xs text-gray-200">
                  Kirim Otomatis ke Webhook Discord Saluran Operasi setelah Disimpan
                </span>
              </label>
              <span className="text-[10px] text-gray-400 font-mono">
                Menyertakan 3 foto bukti & rincian senjata
              </span>
            </div>
          </div>

          {/* Footer Submit Buttons */}
          <div className="pt-4 border-t border-gray-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold text-xs transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Menyimpan Berkas...' : isEditing ? 'Simpan Perubahan Berkas' : 'Simpan & Sahkan Case File'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
