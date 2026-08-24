import React, { useState, useMemo, useEffect } from 'react';
import { PASAL_LIST, OFFENCE_CATEGORIES } from '../data/pasalData';
import { PasalItem, ArrestRecord, OfficerProfile, isOfficerHighRank } from '../types';
import { 
  Search, Shield, CheckCircle2, XCircle, Copy, Check, 
  Car, AlertTriangle, FileText, Send, Percent, Sparkles, Plus, Trash2,
  User, BadgeCheck, MapPin, Camera, Package, Link2, Image as ImageIcon, 
  ChevronDown, ChevronUp, Radio, Settings2, Globe, RefreshCw, X, SlidersHorizontal
} from 'lucide-react';
import { EvidenceUploader } from './EvidenceUploader';
import { 
  getSavedWebhookConfig, saveWebhookConfig, sendArrestRecordToDiscord, 
  testDiscordWebhook, WebhookConfig 
} from '../utils/discordWebhook';

interface Props {
  onSaveRecord?: (record: Omit<ArrestRecord, 'id' | 'timestamp'>) => void;
  currentOfficer?: OfficerProfile | null;
}

const OFFICER_NAME_KEY = 'hspd_saved_officer_name';
const OFFICER_BADGE_KEY = 'hspd_saved_officer_badge';
const OFFICER_PARTNER_KEY = 'hspd_saved_officer_partner';

export const PasalCalculator: React.FC<Props> = ({ onSaveRecord, currentOfficer }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [isCooperative, setIsCooperative] = useState<boolean>(false);
  
  // Suspect form fields
  const [suspectName, setSuspectName] = useState<string>('');
  const [suspectId, setSuspectId] = useState<string>('');
  
  // Arresting Officer form fields
  const [officerName, setOfficerName] = useState<string>(() => currentOfficer?.name || localStorage.getItem(OFFICER_NAME_KEY) || '');
  const [officerBadge, setOfficerBadge] = useState<string>(() => currentOfficer?.badge || localStorage.getItem(OFFICER_BADGE_KEY) || '');
  const [partnerOfficer, setPartnerOfficer] = useState<string>(() => localStorage.getItem(OFFICER_PARTNER_KEY) || '');

  // Keep synced if currentOfficer changes
  useEffect(() => {
    if (currentOfficer?.name) {
      setOfficerName(currentOfficer.name);
    }
    if (currentOfficer?.badge) {
      setOfficerBadge(currentOfficer.badge);
    }
  }, [currentOfficer]);
  
  // Evidence & Case Details
  const [location, setLocation] = useState<string>('');
  const [evidenceList, setEvidenceList] = useState<string[]>([]); // Holds array of up to 10 photos / links
  const [confiscatedItems, setConfiscatedItems] = useState<string>('');
  const [chronology, setChronology] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [showEvidenceFields, setShowEvidenceFields] = useState<boolean>(true);
  
  // Copied feedback & save status
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [isSendingWebhook, setIsSendingWebhook] = useState<boolean>(false);
  const [webhookNotification, setWebhookNotification] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);

  // Webhook Configuration State
  const [webhookConfig, setWebhookConfig] = useState<WebhookConfig>(() => getSavedWebhookConfig());
  const [showWebhookModal, setShowWebhookModal] = useState<boolean>(false);
  const [isTestingWebhook, setIsTestingWebhook] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Persist officer credentials
  useEffect(() => {
    try {
      if (officerName) localStorage.setItem(OFFICER_NAME_KEY, officerName);
      if (officerBadge) localStorage.setItem(OFFICER_BADGE_KEY, officerBadge);
      if (partnerOfficer) localStorage.setItem(OFFICER_PARTNER_KEY, partnerOfficer);
    } catch (e) {
      console.error(e);
    }
  }, [officerName, officerBadge, partnerOfficer]);

  const filteredPasal = useMemo(() => {
    return PASAL_LIST.filter(item => {
      const matchCat = selectedCategory === 'ALL' || item.cat === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q || item.code.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [selectedCategory, searchQuery]);

  const selectedItems = useMemo(() => {
    return selectedCodes.map(c => PASAL_LIST.find(p => p.code === c)).filter(Boolean) as PasalItem[];
  }, [selectedCodes]);

  const rawDenda = useMemo(() => {
    return selectedItems.reduce((acc, item) => acc + item.fine, 0);
  }, [selectedItems]);

  const finalDenda = useMemo(() => {
    return isCooperative ? Math.floor(rawDenda * 0.8) : rawDenda;
  }, [rawDenda, isCooperative]);

  const totalPenjara = useMemo(() => {
    return selectedItems.reduce((acc, item) => acc + item.time, 0);
  }, [selectedItems]);

  const totalImpound = useMemo(() => {
    return selectedItems.reduce((acc, item) => acc + item.imp, 0);
  }, [selectedItems]);

  const toggleSelect = (code: string) => {
    setSelectedCodes(prev => 
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleReset = () => {
    setSelectedCodes([]);
    setIsCooperative(false);
    setSuspectName('');
    setSuspectId('');
    setLocation('');
    setEvidenceList([]);
    setConfiscatedItems('');
    setChronology('');
    setNotes('');
  };

  // SAVE CASE AND TRIGGER DISCORD WEBHOOK
  const handleSaveToLog = async () => {
    if (selectedCodes.length === 0) return;

    const recordData: Omit<ArrestRecord, 'id' | 'timestamp'> = {
      suspectName: suspectName.trim() || (suspectId ? `Player #${suspectId}` : 'Tersangka Umum'),
      suspectId: suspectId.trim() || (suspectName ? suspectName.replace(/\s+/g, '_') : 'N/A'),
      officerName: officerName.trim() || 'Petugas HSPD',
      officerBadge: officerBadge.trim() || 'UNIT-1',
      partnerOfficer: partnerOfficer.trim() || undefined,
      location: location.trim() || 'Los Santos',
      evidenceUrl: evidenceList.length > 0 ? evidenceList[0] : undefined,
      evidenceUrls: evidenceList.length > 0 ? evidenceList : undefined,
      confiscatedItems: confiscatedItems.trim() || undefined,
      chronology: chronology.trim() || notes.trim() || undefined,
      pasalCodes: selectedCodes,
      totalFine: finalDenda,
      totalJail: totalPenjara,
      totalImpound,
      isCooperative,
      notes: chronology.trim() || notes.trim() || 'Penanganan standar pelanggaran'
    };

    // 1. Save to Local CAD State / Database
    if (onSaveRecord) {
      onSaveRecord(recordData);
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);

    // 2. If Webhook Auto-Send is enabled and Webhook URL is filled, trigger Discord broadcast
    if (webhookConfig.autoSendOnSave && webhookConfig.webhookUrl.trim()) {
      setIsSendingWebhook(true);
      setWebhookNotification({
        type: 'info',
        text: 'Mengirimkan kasus ke Discord Webhook...'
      });

      const fullRecord: ArrestRecord = {
        ...recordData,
        id: `rec-${Date.now()}`,
        timestamp: Date.now()
      };

      try {
        const res = await sendArrestRecordToDiscord(fullRecord, webhookConfig);
        if (res.success) {
          setWebhookNotification({
            type: 'success',
            text: `✅ Kasus [${recordData.suspectName}] berhasil dikirim ke Discord Webhook!`
          });
        } else {
          setWebhookNotification({
            type: 'error',
            text: `⚠️ Kasus tersimpan di CAD, tapi gagal kirim ke Discord: ${res.message}`
          });
        }
      } catch (err: any) {
        setWebhookNotification({
          type: 'error',
          text: `⚠️ Gagal kirim ke Discord: ${err.message || 'Periksa koneksi'}`
        });
      } finally {
        setIsSendingWebhook(false);
        setTimeout(() => setWebhookNotification(null), 6000);
      }
    } else if (!webhookConfig.webhookUrl.trim()) {
      setWebhookNotification({
        type: 'info',
        text: '💡 Kasus tersimpan di CAD. (Atur URL Webhook Discord di panel atas jika ingin auto-post ke Discord).'
      });
      setTimeout(() => setWebhookNotification(null), 5000);
    }
  };

  // Test Webhook Handler
  const handleTestWebhook = async () => {
    setIsTestingWebhook(true);
    setTestResult(null);
    try {
      const res = await testDiscordWebhook(webhookConfig);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Gagal terhubung' });
    } finally {
      setIsTestingWebhook(false);
    }
  };

  const handleSaveWebhookSettings = () => {
    saveWebhookConfig(webhookConfig);
    setShowWebhookModal(false);
    setWebhookNotification({
      type: 'success',
      text: 'Pengaturan Discord Webhook berhasil diperbarui!'
    });
    setTimeout(() => setWebhookNotification(null), 3500);
  };

  // String formats for SAMP
  const pasalString = selectedCodes.join(', ');
  const chatSummary = `Kesalahan Mas/Mam dikenakan Pasal: ${pasalString} | Denda: $${finalDenda.toLocaleString()} | Penjara: ${totalPenjara} Bln${totalImpound > 0 ? ` | Impound: ${totalImpound} Hari` : ''}`;

  return (
    <div id="pasal-calculator-root" className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* LEFT COLUMN: Pasal Browser & Categories */}
      <div id="pasal-browser-column" className="lg:col-span-6 flex flex-col space-y-3">
        {/* Category Pills Header Bar */}
        <div id="pasal-category-filter" className="flex flex-wrap gap-1 p-1.5 bg-[#161B22] border border-gray-800 rounded-md">
          {OFFENCE_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                id={`cat-btn-${cat.key}`}
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition whitespace-nowrap ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                    : 'bg-[#0D0F14] text-gray-400 border border-gray-800 hover:bg-gray-800 hover:text-gray-200'
                }`}
              >
                {cat.title}
              </button>
            );
          })}
        </div>

        {/* High Density Search Box */}
        <div id="pasal-search-box" className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <input
            type="text"
            id="pasal-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kode pasal (A01, B08, F15) atau kata kunci (balap liar, senjata, SIM)..."
            className="w-full pl-9 pr-14 py-1.5 bg-[#161B22] border border-gray-800 focus:border-blue-500 rounded text-xs text-gray-200 placeholder:text-gray-600 outline-none transition font-sans"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 hover:text-gray-200 bg-gray-800 px-1.5 py-0.5 rounded"
            >
              CLEAR
            </button>
          )}
        </div>

        {/* Pasal List Inspector Panel */}
        <div id="pasal-items-container" className="bg-[#161B22] border border-gray-800 rounded-md p-2 flex-1 max-h-[700px] overflow-y-auto space-y-1.5">
          {filteredPasal.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-xs font-mono">
              [NO_MATCH] Tidak ada pasal yang cocok dengan kriteria pencarian "{searchQuery}".
            </div>
          ) : (
            filteredPasal.map((item) => {
              const isChecked = selectedCodes.includes(item.code);
              return (
                <div
                  key={item.code}
                  id={`pasal-row-${item.code}`}
                  onClick={() => toggleSelect(item.code)}
                  className={`p-2 rounded border cursor-pointer transition flex items-center justify-between gap-3 ${
                    isChecked
                      ? 'bg-blue-600/10 border-blue-500 text-gray-100 shadow-inner'
                      : 'bg-[#0D0F14] border-gray-800 hover:border-gray-700 text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-4 h-4 rounded flex items-center justify-center border transition shrink-0 ${
                      isChecked ? 'bg-blue-600 border-blue-500 text-white' : 'border-gray-700 bg-black/40'
                    }`}>
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-[11px] px-1.5 py-0.2 rounded bg-black/50 border border-gray-700 text-blue-400">
                          {item.code}
                        </span>
                        <span className="text-[10px] text-gray-500 uppercase font-mono font-bold">Kategori {item.cat}</span>
                      </div>
                      <p className="text-xs text-gray-200 font-normal mt-0.5 truncate">{item.desc}</p>
                    </div>
                  </div>

                  {/* Badges / Metrics */}
                  <div className="flex items-center gap-1.5 text-right shrink-0">
                    <span className="px-1.5 py-0.5 bg-green-950/40 border border-green-800/60 text-green-400 rounded text-[10px] font-mono font-bold">
                      ${item.fine.toLocaleString()}
                    </span>
                    {item.time > 0 && (
                      <span className="px-1.5 py-0.5 bg-amber-950/40 border border-amber-800/60 text-amber-300 rounded text-[10px] font-mono font-bold">
                        {item.time}m
                      </span>
                    )}
                    {item.imp > 0 && (
                      <span className="px-1.5 py-0.5 bg-red-950/40 border border-red-800/60 text-red-400 rounded text-[10px] font-mono font-bold">
                        {item.imp}d Imp
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Suspect Case Details, Evidence Uploader & Command Summary */}
      <div id="pasal-summary-column" className="lg:col-span-6 flex flex-col space-y-3">
        {/* Case File Form */}
        <div className="bg-[#161B22] border border-gray-800 rounded-md p-3.5 space-y-3">
          
          {/* Header Bar with Webhook Status & Settings */}
          <div className="flex items-center justify-between border-b border-gray-800 pb-2">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-400" />
              <span className="font-bold text-gray-100 text-xs uppercase tracking-wider font-mono">
                FORMULIR KASUS PENINDAKAN
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Webhook Config Quick Button */}
              <button
                type="button"
                onClick={() => setShowWebhookModal(true)}
                className={`px-2 py-1 rounded text-[10px] font-mono font-bold flex items-center gap-1 border transition ${
                  webhookConfig.webhookUrl
                    ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60 hover:bg-emerald-900/60'
                    : 'bg-amber-950/40 text-amber-300 border-amber-800/60 hover:bg-amber-900/60'
                }`}
                title="Atur Discord Webhook Channel"
              >
                <Radio className="w-3 h-3 text-emerald-400" />
                <span className="hidden sm:inline">DISCORD WEBHOOK:</span>
                <span>{webhookConfig.webhookUrl ? '10-8 AKTIF' : 'SETTING'}</span>
              </button>

              <button
                onClick={handleReset}
                className="px-2 py-1 bg-[#0D0F14] hover:bg-rose-950/50 hover:text-rose-300 text-gray-400 text-[10px] font-bold rounded border border-gray-800 transition font-mono"
              >
                RESET
              </button>
            </div>
          </div>

          {/* Webhook Notification Toast / Banner */}
          {webhookNotification && (
            <div className={`p-2.5 rounded text-xs font-mono flex items-center justify-between gap-2 animate-in fade-in duration-150 ${
              webhookNotification.type === 'success'
                ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-200'
                : webhookNotification.type === 'error'
                  ? 'bg-rose-950/60 border border-rose-800 text-rose-200'
                  : 'bg-blue-950/60 border border-blue-800 text-blue-200'
            }`}>
              <div className="flex items-center gap-2">
                {webhookNotification.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                {webhookNotification.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
                {webhookNotification.type === 'info' && <RefreshCw className="w-4 h-4 text-blue-400 shrink-0 animate-spin" />}
                <span>{webhookNotification.text}</span>
              </div>
              <button 
                onClick={() => setWebhookNotification(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* SECTION A: SUSPECT IDENTITY */}
          <div className="bg-[#0D0F14] p-2.5 rounded border border-gray-800 space-y-2">
            <div className="flex items-center justify-between border-b border-gray-800/80 pb-1">
              <span className="text-[10px] font-mono font-bold uppercase text-blue-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                1. Identitas Tersangka (Suspect)
              </span>
              <span className="text-[9px] font-mono text-gray-500">WAJIB DIISI</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <div className="sm:col-span-8">
                <label className="text-[10px] font-bold uppercase text-gray-300 flex items-center gap-1 mb-1">
                  Nama Tersangka / In-Game Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  id="suspect-name-input"
                  value={suspectName}
                  onChange={(e) => setSuspectName(e.target.value)}
                  placeholder="Contoh: Alex Rodriguez, Tyrone Smith..."
                  className="w-full px-2.5 py-1.5 bg-[#161B22] border border-gray-700 focus:border-blue-500 rounded text-xs text-gray-100 placeholder:text-gray-600 outline-none font-semibold"
                />
              </div>

              <div className="sm:col-span-4">
                <label className="text-[10px] font-bold uppercase text-gray-400 flex items-center gap-1 mb-1">
                  ID In-Game (Opsional)
                </label>
                <input
                  type="text"
                  id="suspect-id-input"
                  value={suspectId}
                  onChange={(e) => setSuspectId(e.target.value)}
                  placeholder="Contoh: 24"
                  className="w-full px-2.5 py-1.5 bg-[#161B22] border border-gray-700 focus:border-blue-500 rounded text-xs text-gray-100 placeholder:text-gray-600 outline-none font-mono"
                />
              </div>
            </div>
          </div>

          {/* SECTION B: ARRESTING OFFICER DETAILS */}
          <div className="bg-[#0D0F14] p-2.5 rounded border border-gray-800 space-y-2">
            <div className="flex items-center justify-between border-b border-gray-800/80 pb-1">
              <span className="text-[10px] font-mono font-bold uppercase text-amber-400 flex items-center gap-1.5">
                <BadgeCheck className="w-3.5 h-3.5" />
                2. Petugas Polisi Penindak
              </span>
              <span className="text-[9px] font-mono text-gray-500">TERSIMPAN OTOMATIS</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <div className="sm:col-span-5">
                <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">
                  Nama Petugas Penindak
                </label>
                <input
                  type="text"
                  id="officer-name-input"
                  value={officerName}
                  onChange={(e) => setOfficerName(e.target.value)}
                  placeholder="Contoh: Raymond Holt"
                  className="w-full px-2.5 py-1 bg-[#161B22] border border-gray-700 focus:border-blue-500 rounded text-xs text-gray-200 placeholder:text-gray-600 outline-none"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">
                  Badge / Divisi
                </label>
                <input
                  type="text"
                  id="officer-badge-input"
                  value={officerBadge}
                  onChange={(e) => setOfficerBadge(e.target.value)}
                  placeholder="#401 / PATROL"
                  className="w-full px-2.5 py-1 bg-[#161B22] border border-gray-700 focus:border-blue-500 rounded text-xs text-gray-200 placeholder:text-gray-600 outline-none font-mono"
                />
              </div>

              <div className="sm:col-span-4">
                <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">
                  Partner / Pendamping (Opsional)
                </label>
                <input
                  type="text"
                  id="partner-officer-input"
                  value={partnerOfficer}
                  onChange={(e) => setPartnerOfficer(e.target.value)}
                  placeholder="Contoh: Jake Peralta #204"
                  className="w-full px-2.5 py-1 bg-[#161B22] border border-gray-700 focus:border-blue-500 rounded text-xs text-gray-200 placeholder:text-gray-600 outline-none"
                />
              </div>
            </div>
          </div>

          {/* SECTION C: EVIDENCE, CAMERA UPLOAD & SEIZED ITEMS */}
          <div className="bg-[#0D0F14] p-2.5 rounded border border-gray-800 space-y-2">
            <div className="flex items-center justify-between border-b border-gray-800/80 pb-1">
              <span className="text-[10px] font-mono font-bold uppercase text-emerald-400 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5" />
                3. Bukti Kasus (Foto / Kamera) & Barang Sitaan
              </span>
              <button
                type="button"
                onClick={() => setShowEvidenceFields(prev => !prev)}
                className="text-[10px] font-mono text-gray-400 hover:text-gray-200 flex items-center gap-1"
              >
                {showEvidenceFields ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                <span>{showEvidenceFields ? 'SEMBUNYIKAN' : 'TAMPILKAN'}</span>
              </button>
            </div>

            {showEvidenceFields && (
              <div className="space-y-2.5 pt-1 animate-in fade-in duration-150">
                {/* Scene Location */}
                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-400 flex items-center gap-1 mb-1">
                    <MapPin className="w-3 h-3 text-red-400" />
                    Lokasi Kejadian / TKP
                  </label>
                  <input
                    type="text"
                    id="case-location-input"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Contoh: Idlewood Gas Station, Bank LS, Market, Ganton..."
                    className="w-full px-2.5 py-1.5 bg-[#161B22] border border-gray-700 focus:border-blue-500 rounded text-xs text-gray-200 placeholder:text-gray-600 outline-none"
                  />
                </div>

                {/* Evidence Upload Component (Foto Perangkat / Kamera / Link - Max 10 Foto) */}
                <EvidenceUploader
                  images={evidenceList}
                  onChange={setEvidenceList}
                  label="Ambil Foto Bukti / Upload dari Perangkat (Maksimal 10 Foto)"
                  placeholder="https://i.imgur.com/xxxx.png..."
                />

                {/* Confiscated Contraband Items */}
                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-400 flex items-center gap-1 mb-1">
                    <Package className="w-3 h-3 text-amber-400" />
                    Barang Bukti Sitaan (Contraband / Senjata / Narkoba / Uang)
                  </label>
                  <input
                    type="text"
                    id="case-contraband-input"
                    value={confiscatedItems}
                    onChange={(e) => setConfiscatedItems(e.target.value)}
                    placeholder="Contoh: 1x Desert Eagle (50 ammo), 25g Pot, $10.000 Uang Kotor..."
                    className="w-full px-2.5 py-1 bg-[#161B22] border border-gray-700 focus:border-blue-500 rounded text-xs text-gray-200 placeholder:text-gray-600 outline-none font-mono"
                  />
                </div>

                {/* Incident Chronology / Brief Story */}
                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">
                    Kronologi Singkat / Catatan Penangkapan
                  </label>
                  <textarea
                    rows={2}
                    id="case-chronology-input"
                    value={chronology}
                    onChange={(e) => setChronology(e.target.value)}
                    placeholder="Contoh: Tersangka melarikan diri saat traffic stop 10-57V lalu menabrak tiang dan menyerahkan diri..."
                    className="w-full px-2.5 py-1 bg-[#161B22] border border-gray-700 focus:border-blue-500 rounded text-xs text-gray-200 placeholder:text-gray-600 outline-none resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Selected Pasal Chips */}
          <div>
            <div className="flex justify-between items-center mb-1 text-[10px] uppercase font-bold text-gray-500 tracking-wider">
              <span>Pasal Terpilih Pelanggaran</span>
              <span className="font-mono text-blue-400 font-bold">{selectedCodes.length} Pasal Terpilih</span>
            </div>
            <div id="selected-pasal-chips" className="min-h-[38px] max-h-[85px] overflow-y-auto p-1.5 bg-[#0D0F14] border border-gray-800 rounded flex flex-wrap gap-1">
              {selectedCodes.length === 0 ? (
                <span className="text-[11px] text-gray-600 italic p-1">Klik pasal pada daftar sebelah kiri untuk menghitung denda/penjara...</span>
              ) : (
                selectedCodes.map(code => (
                  <button
                    key={code}
                    onClick={() => toggleSelect(code)}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-900/30 hover:bg-red-950/60 border border-blue-700/50 hover:border-red-700 rounded text-[10px] font-mono text-blue-300 hover:text-red-300 transition"
                  >
                    <span>{code}</span>
                    <XCircle className="w-3 h-3 text-gray-500 hover:text-red-400" />
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Discount Toggle */}
          <div 
            id="cooperative-toggle-box"
            onClick={() => setIsCooperative(!isCooperative)}
            className={`p-2 rounded border cursor-pointer transition flex items-center justify-between ${
              isCooperative
                ? 'bg-green-950/30 border-green-700/60 text-green-300'
                : 'bg-[#0D0F14] border-gray-800 text-gray-400 hover:border-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Percent className="w-3.5 h-3.5 text-green-400" />
              <div>
                <span className="text-[11px] font-bold block text-gray-200">Diskon Kooperatif (-20%)</span>
                <span className="text-[9px] text-gray-500">Suspect mematuhi instruksi penangkapan tanpa perlawanan</span>
              </div>
            </div>
            <div className={`w-4 h-4 rounded flex items-center justify-center border transition ${
              isCooperative ? 'bg-green-600 border-green-500 text-white' : 'border-gray-700 bg-black/40'
            }`}>
              {isCooperative && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
          </div>

          {/* High Density Metric Tiles */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-[#0D0F14] p-2.5 rounded border border-gray-800">
              <div className="text-[9px] text-gray-500 uppercase font-bold">Total Denda</div>
              <div className={`text-base font-mono font-bold leading-tight ${isCooperative ? 'text-green-400' : 'text-blue-400'}`}>
                ${finalDenda.toLocaleString()}
              </div>
              {isCooperative && rawDenda > 0 && (
                <div className="text-[9px] font-mono text-gray-600 line-through">
                  ${rawDenda.toLocaleString()}
                </div>
              )}
            </div>

            <div className="bg-[#0D0F14] p-2.5 rounded border border-gray-800">
              <div className="text-[9px] text-gray-500 uppercase font-bold">Hukuman Sel</div>
              <div className="text-base font-mono font-bold text-amber-400 leading-tight">
                {totalPenjara} <span className="text-[10px] text-gray-500">Bln</span>
              </div>
            </div>

            <div className="bg-[#0D0F14] p-2.5 rounded border border-gray-800">
              <div className="text-[9px] text-gray-500 uppercase font-bold">Impound Sita</div>
              <div className="text-base font-mono font-bold text-red-400 leading-tight">
                {totalImpound} <span className="text-[10px] text-gray-500">Hari</span>
              </div>
            </div>
          </div>

          {/* Webhook Auto-Send Toggle Switch */}
          <div className="p-2 bg-[#0D0F14] rounded border border-gray-800 flex items-center justify-between text-xs font-mono">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={webhookConfig.autoSendOnSave}
                onChange={(e) => {
                  const updated = { ...webhookConfig, autoSendOnSave: e.target.checked };
                  setWebhookConfig(updated);
                  saveWebhookConfig(updated);
                }}
                className="w-3.5 h-3.5 rounded border-gray-700 text-blue-600 focus:ring-0"
              />
              <span className="text-[11px] text-gray-300 flex items-center gap-1">
                <Radio className="w-3 h-3 text-blue-400" />
                Kirim otomatis ke Discord Webhook saat simpan kasus
              </span>
            </label>

            {isOfficerHighRank(currentOfficer?.rank) && (
              <button
                type="button"
                onClick={() => setShowWebhookModal(true)}
                className="text-[10px] text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-1 font-bold"
                title="Atur Discord Webhook (High Command Only)"
              >
                <Settings2 className="w-3 h-3" />
                <span>👑 Setting Webhook</span>
              </button>
            )}
          </div>

          {/* IC Chat Format & Save to Log */}
          <div className="space-y-2 pt-1">
            {/* SAMP Chat Format */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase text-gray-500 block">Format Chat IC / Penjelasan Suspect</span>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  readOnly
                  value={selectedCodes.length > 0 ? chatSummary : 'Pilih pasal terlebih dahulu...'}
                  className="flex-1 px-2.5 py-1 bg-[#090B10] border border-gray-800 rounded text-[11px] font-mono text-gray-300 outline-none select-all"
                />
                <button
                  onClick={() => handleCopy(chatSummary, 'summary')}
                  disabled={selectedCodes.length === 0}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white text-[10px] font-bold rounded flex items-center gap-1 transition shrink-0 font-mono"
                >
                  {copiedKey === 'summary' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'summary' ? 'DISALIN' : 'COPY'}</span>
                </button>
              </div>
            </div>

            {/* Save to Record Button (Auto-sends to Discord Webhook) */}
            {onSaveRecord && (
              <button
                id="btn-save-record"
                onClick={handleSaveToLog}
                disabled={selectedCodes.length === 0 || isSendingWebhook}
                className={`w-full mt-2 py-2.5 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition shadow-lg font-mono ${
                  webhookConfig.webhookUrl && webhookConfig.autoSendOnSave
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
                } disabled:opacity-30`}
              >
                {isSendingWebhook ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>MENGIRIMKAN KASUS KE DISCORD WEBHOOK...</span>
                  </>
                ) : savedSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-green-300" />
                    <span className="text-white">SUKSES TERSIMPAN KE RIWAYAT KASUS & DISCORD!</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 text-white" />
                    <span>
                      {webhookConfig.webhookUrl && webhookConfig.autoSendOnSave
                        ? 'SIMPAN KASUS & KIRIM KE DISCORD WEBHOOK'
                        : 'SIMPAN KASUS KE DATABASE PENANGKAPAN & CAD'}
                    </span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* DISCORD WEBHOOK SETTINGS MODAL */}
      {showWebhookModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#161B22] border border-gray-800 rounded-xl max-w-lg w-full overflow-hidden shadow-2xl space-y-4 p-5 text-gray-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-700/60 flex items-center justify-center text-emerald-400">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-100 font-mono">PENGATURAN DISCORD WEBHOOK</h3>
                  <p className="text-[11px] text-gray-400">Kirim laporan kasus & foto bukti langsung ke channel Discord</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowWebhookModal(false)}
                className="w-7 h-7 rounded bg-gray-800 hover:bg-rose-950/60 text-gray-400 hover:text-rose-300 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-[11px] font-bold uppercase text-gray-300 block mb-1">
                  Discord Webhook URL <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={webhookConfig.webhookUrl}
                  onChange={(e) => setWebhookConfig({ ...webhookConfig, webhookUrl: e.target.value })}
                  placeholder="https://discord.com/api/webhooks/123456789/xxxxxx..."
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 focus:border-blue-500 rounded text-xs text-gray-100 placeholder:text-gray-600 outline-none"
                />
                <p className="text-[10px] text-gray-500 mt-1">
                  Salin dari Discord: <em>Edit Channel → Integrations → Webhooks → Copy Webhook URL</em>.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase text-gray-300 block mb-1">
                    Nama Bot / Sender
                  </label>
                  <input
                    type="text"
                    value={webhookConfig.botName}
                    onChange={(e) => setWebhookConfig({ ...webhookConfig, botName: e.target.value })}
                    placeholder="HSPD CAD System"
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 focus:border-blue-500 rounded text-xs text-gray-100 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase text-gray-300 block mb-1">
                    Avatar URL Bot (Opsional)
                  </label>
                  <input
                    type="text"
                    value={webhookConfig.botAvatar}
                    onChange={(e) => setWebhookConfig({ ...webhookConfig, botAvatar: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 focus:border-blue-500 rounded text-xs text-gray-100 outline-none"
                  />
                </div>
              </div>

              {/* Auto Send Toggle */}
              <div className="p-3 bg-[#0D1117] border border-gray-800 rounded-lg">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={webhookConfig.autoSendOnSave}
                    onChange={(e) => setWebhookConfig({ ...webhookConfig, autoSendOnSave: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-700 text-blue-600 focus:ring-0"
                  />
                  <div>
                    <span className="font-bold text-gray-200 block text-xs">Kirim Otomatis Saat Simpan Kasus Baru</span>
                    <span className="text-[10px] text-gray-500">
                      Setiap kali tombol "Simpan Kasus" diklik, data penindakan beserta foto bukti langsung terkirim ke channel Discord.
                    </span>
                  </div>
                </label>
              </div>

              {/* Test Result Message */}
              {testResult && (
                <div className={`p-2.5 rounded text-xs font-mono flex items-center gap-2 ${
                  testResult.success 
                    ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-200' 
                    : 'bg-rose-950/60 border border-rose-800 text-rose-200'
                }`}>
                  {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
                  <span>{testResult.message}</span>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-800">
              <button
                type="button"
                onClick={handleTestWebhook}
                disabled={isTestingWebhook || !webhookConfig.webhookUrl.trim()}
                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-30 text-gray-200 text-xs font-bold rounded flex items-center gap-1.5 transition font-mono border border-gray-700"
              >
                {isTestingWebhook ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Radio className="w-3.5 h-3.5 text-blue-400" />}
                <span>TES KONEKSI DISCORD</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowWebhookModal(false)}
                  className="px-3 py-1.5 bg-[#0D1117] hover:bg-gray-800 text-gray-400 text-xs font-mono rounded"
                >
                  BATAL
                </button>

                <button
                  type="button"
                  onClick={handleSaveWebhookSettings}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs font-mono rounded-lg transition shadow-md shadow-emerald-600/30 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>SIMPAN PENGATURAN</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
