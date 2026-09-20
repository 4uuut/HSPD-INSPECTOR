import React, { useState, useMemo, useRef } from 'react';
import { 
  Radio, Car, AlertTriangle, ShieldAlert, Plus, CheckCircle2, 
  Trash2, Search, MapPin, Clock, FileText, User, Filter, X,
  ExternalLink, Key, Tag, ShieldCheck, DollarSign, Calendar,
  Send, RefreshCw, AlertCircle, Ticket, Upload, Image as ImageIcon,
  Copy, Check, Eye, Sliders, Smartphone, Camera, CheckSquare
} from 'lucide-react';
import { BoloAlert, ImpoundRecord, TrafficCitationRecord, OfficerProfile, isOfficerHighRank } from '../types';
import { 
  sendBoloAlertToDiscord, 
  getSavedBoloWebhookConfig, 
  sendImpoundRecordToDiscord, 
  getSavedImpoundWebhookConfig,
  sendTrafficCitationToDiscord,
  getSavedTrafficCitationWebhookConfig
} from '../utils/discordWebhook';
import { 
  formatTrafficCitationAsText, 
  formatImpoundAsText, 
  getCurrentIndonesianDayDate, 
  getCurrentIndonesianTimeString 
} from '../utils/trafficCitationStorage';
import { processAndCompressImage } from '../utils/imageCompressor';

interface Props {
  boloList: BoloAlert[];
  impoundList: ImpoundRecord[];
  citationList?: TrafficCitationRecord[];
  currentOfficer: OfficerProfile;
  onSaveBolo: (bolos: BoloAlert[]) => void;
  onSaveImpound: (impounds: ImpoundRecord[]) => void;
  onSaveCitation?: (citations: TrafficCitationRecord[]) => void;
  onOpenWebhookSettings?: () => void;
}

export const BoloAndTrafficHub: React.FC<Props> = ({
  boloList,
  impoundList,
  citationList = [],
  currentOfficer,
  onSaveBolo,
  onSaveImpound,
  onSaveCitation,
  onOpenWebhookSettings
}) => {
  const isHighRank = isOfficerHighRank(currentOfficer.rank);
  const [activeSubTab, setActiveSubTab] = useState<'tilang' | 'impound' | 'bolo'>('tilang');

  // Search & Filter States
  const [searchCitation, setSearchCitation] = useState('');
  const [searchImpound, setSearchImpound] = useState('');
  const [searchBolo, setSearchBolo] = useState('');
  const [citationStatusFilter, setCitationStatusFilter] = useState<'ALL' | 'PAID' | 'UNPAID'>('ALL');
  const [impoundStatusFilter, setImpoundStatusFilter] = useState<'ALL' | 'IMPOUNDED' | 'RELEASED'>('ALL');

  // General Action Feedback
  const [discordNotice, setDiscordNotice] = useState<{ success: boolean; message: string } | null>(null);
  const [isSendingDiscord, setIsSendingDiscord] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Full Image Modal Preview
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  // =========================================================================
  // 1. MODAL STATE: TERBITKAN TILANG (TRAFFIC CITATION)
  // =========================================================================
  const [isCitationModalOpen, setIsCitationModalOpen] = useState(false);
  const citationFileInputRef = useRef<HTMLInputElement>(null);

  const [citOfficerName, setCitOfficerName] = useState('');
  const [citOfficerBadge, setCitOfficerBadge] = useState('');
  const [citDayDate, setCitDayDate] = useState('');
  const [citTimeString, setCitTimeString] = useState('');
  const [citViolatorName, setCitViolatorName] = useState('');
  const [citLocation, setCitLocation] = useState('Commerce Intersection, Los Santos');
  const [citVehicleModel, setCitVehicleModel] = useState('');
  const [citPlateNumber, setCitPlateNumber] = useState('');
  const [citViolations, setCitViolations] = useState('');
  const [citTotalFine, setCitTotalFine] = useState<number | string>(3000);
  const [citNotes, setCitNotes] = useState('Penindakan tilang resmi di tempat, pengemudi kooperatif.');
  const [citEvidenceImage, setCitEvidenceImage] = useState<string | null>(null);
  const [citEvidenceFileName, setCitEvidenceFileName] = useState<string>('');
  const [citEvidenceSizeKb, setCitEvidenceSizeKb] = useState<number>(0);
  const [isCompressingCitImage, setIsCompressingCitImage] = useState(false);

  const openNewCitationModal = () => {
    setCitOfficerName(currentOfficer.name);
    setCitOfficerBadge(currentOfficer.badge);
    setCitDayDate(getCurrentIndonesianDayDate());
    setCitTimeString(getCurrentIndonesianTimeString());
    setCitViolatorName('');
    setCitLocation('Commerce Intersection, Los Santos');
    setCitVehicleModel('');
    setCitPlateNumber('');
    setCitViolations('');
    setCitTotalFine(3500);
    setCitNotes('Penindakan tilang resmi di tempat.');
    setCitEvidenceImage(null);
    setCitEvidenceFileName('');
    setCitEvidenceSizeKb(0);
    setIsCitationModalOpen(true);
  };

  const handleCitImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressingCitImage(true);
    try {
      const result = await processAndCompressImage(file, 1280, 1280, 0.85);
      setCitEvidenceImage(result.dataUrl);
      setCitEvidenceFileName(result.fileName);
      setCitEvidenceSizeKb(result.sizeKb);
    } catch (err: any) {
      alert(err.message || 'Gagal memproses gambar bukti.');
    } finally {
      setIsCompressingCitImage(false);
    }
  };

  const handleAddCitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!citViolatorName.trim() || !citPlateNumber.trim() || !citVehicleModel.trim()) {
      alert('Mohon lengkapi Nama Pelanggar, Model Kendaraan, dan Plat Nomor.');
      return;
    }

    const fineNumber = typeof citTotalFine === 'number' ? citTotalFine : parseInt(String(citTotalFine).replace(/\D/g, '') || '0', 10);

    const newCitation: TrafficCitationRecord = {
      id: `CIT-${Date.now()}`,
      officerName: citOfficerName.trim() || currentOfficer.name,
      officerBadge: citOfficerBadge.trim() || currentOfficer.badge,
      dayDate: citDayDate.trim() || getCurrentIndonesianDayDate(),
      timeString: citTimeString.trim() || getCurrentIndonesianTimeString(),
      violatorName: citViolatorName.trim(),
      location: citLocation.trim() || 'Commerce, Los Santos',
      vehicleModel: citVehicleModel.trim(),
      plateNumber: citPlateNumber.trim().toUpperCase(),
      violations: citViolations.trim() || 'Pelanggaran Lalu Lintas',
      totalFine: fineNumber,
      notes: citNotes.trim() || 'Penindakan tilang resmi.',
      evidenceImage: citEvidenceImage || undefined,
      hasEvidence: Boolean(citEvidenceImage),
      status: 'UNPAID',
      timestamp: Date.now()
    };

    const updated = [newCitation, ...citationList];
    if (onSaveCitation) {
      onSaveCitation(updated);
    }
    setIsCitationModalOpen(false);

    // Auto send to Discord Webhook if configured
    const cfg = getSavedTrafficCitationWebhookConfig();
    if (cfg.webhookUrl && cfg.autoSendOnSave !== false) {
      setIsSendingDiscord(true);
      sendTrafficCitationToDiscord(newCitation, currentOfficer).then(res => {
        setDiscordNotice(res);
        setTimeout(() => setDiscordNotice(null), 4000);
      }).catch(err => {
        setDiscordNotice({ success: false, message: err.message || 'Gagal kirim webhook' });
      }).finally(() => {
        setIsSendingDiscord(false);
      });
    } else {
      setDiscordNotice({
        success: true,
        message: `Surat Tilang #${newCitation.plateNumber} berhasil diterbitkan dan disimpan!`
      });
      setTimeout(() => setDiscordNotice(null), 3500);
    }
  };

  const handleManualSendCitation = async (c: TrafficCitationRecord) => {
    setIsSendingDiscord(true);
    try {
      const res = await sendTrafficCitationToDiscord(c, currentOfficer);
      setDiscordNotice(res);
      setTimeout(() => setDiscordNotice(null), 4500);
    } catch (err: any) {
      setDiscordNotice({
        success: false,
        message: err.message || 'Gagal mengirim data tilang ke Discord.'
      });
    } finally {
      setIsSendingDiscord(false);
    }
  };

  const handleToggleCitationStatus = (cId: string) => {
    if (!onSaveCitation) return;
    const updated = citationList.map(c => {
      if (c.id === cId) {
        const nextStatus = c.status === 'PAID' ? 'UNPAID' : 'PAID';
        const updatedDoc = { ...c, status: nextStatus as 'PAID' | 'UNPAID' };
        // If auto send active, resend with updated status
        const cfg = getSavedTrafficCitationWebhookConfig();
        if (cfg.webhookUrl && cfg.autoSendOnSave !== false) {
          sendTrafficCitationToDiscord(updatedDoc, currentOfficer).catch(() => {});
        }
        return updatedDoc;
      }
      return c;
    });
    onSaveCitation(updated);
  };

  const handleDeleteCitation = (cId: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus rekor surat tilang ini?')) {
      if (onSaveCitation) {
        onSaveCitation(citationList.filter(c => c.id !== cId));
      }
    }
  };

  const handleCopyCitationText = (c: TrafficCitationRecord) => {
    const text = formatTrafficCitationAsText(c);
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(c.id);
      setTimeout(() => setCopiedId(null), 2500);
    }).catch(() => {
      alert('Gagal menyalin teks ke clipboard.');
    });
  };

  // =========================================================================
  // 2. MODAL STATE: SITA KENDARAAN (IMPOUND LOT) - 2 FOTO BUKTI
  // =========================================================================
  const [isImpoundModalOpen, setIsImpoundModalOpen] = useState(false);
  const impoundFileInputRef = useRef<HTMLInputElement>(null);
  const impoundFileInputRef2 = useRef<HTMLInputElement>(null);

  const [impOfficerName, setImpOfficerName] = useState('');
  const [impOfficerBadge, setImpOfficerBadge] = useState('');
  const [impDayDate, setImpDayDate] = useState('');
  const [impTimeString, setImpTimeString] = useState('');
  const [impPlate, setImpPlate] = useState('');
  const [impModel, setImpModel] = useState('');
  const [impColor, setImpColor] = useState('Hitam Metalik');
  const [impOwner, setImpOwner] = useState('');
  const [impLocation, setImpLocation] = useState('Commerce, Los Santos');
  const [impReason, setImpReason] = useState('');
  const [impDays, setImpDays] = useState(3);
  const [impFee, setImpFee] = useState(15000);
  const [impNotes, setImpNotes] = useState('Penyitaan resmi di Garasi Impound Lot HSPD.');
  
  // Foto Bukti 1 (TKP / Unit Kendaraan)
  const [impEvidenceImage, setImpEvidenceImage] = useState<string | null>(null);
  const [impEvidenceFileName, setImpEvidenceFileName] = useState<string>('');
  const [impEvidenceSizeKb, setImpEvidenceSizeKb] = useState<number>(0);
  const [isCompressingImpImage, setIsCompressingImpImage] = useState(false);

  // Foto Bukti 2 (Kondisi Fisik / Plat Nomor / Tiba di Garasi)
  const [impEvidenceImage2, setImpEvidenceImage2] = useState<string | null>(null);
  const [impEvidenceFileName2, setImpEvidenceFileName2] = useState<string>('');
  const [impEvidenceSizeKb2, setImpEvidenceSizeKb2] = useState<number>(0);
  const [isCompressingImpImage2, setIsCompressingImpImage2] = useState(false);

  const openNewImpoundModal = () => {
    setImpOfficerName(currentOfficer.name);
    setImpOfficerBadge(currentOfficer.badge);
    setImpDayDate(getCurrentIndonesianDayDate());
    setImpTimeString(getCurrentIndonesianTimeString());
    setImpPlate('');
    setImpModel('');
    setImpColor('Hitam Metalik');
    setImpOwner('');
    setImpLocation('Commerce, Los Santos');
    setImpReason('Pasal 24 (Ugal-ugalan) & Pelanggaran Jalur Cepat');
    setImpDays(3);
    setImpFee(15000);
    setImpNotes('Penyitaan resmi di Garasi Impound Lot HSPD.');
    // Reset Foto 1
    setImpEvidenceImage(null);
    setImpEvidenceFileName('');
    setImpEvidenceSizeKb(0);
    // Reset Foto 2
    setImpEvidenceImage2(null);
    setImpEvidenceFileName2('');
    setImpEvidenceSizeKb2(0);
    setIsImpoundModalOpen(true);
  };

  const handleImpImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressingImpImage(true);
    try {
      const result = await processAndCompressImage(file, 1280, 1280, 0.85);
      setImpEvidenceImage(result.dataUrl);
      setImpEvidenceFileName(result.fileName);
      setImpEvidenceSizeKb(result.sizeKb);
    } catch (err: any) {
      alert(err.message || 'Gagal memproses foto bukti 1.');
    } finally {
      setIsCompressingImpImage(false);
    }
  };

  const handleImpImageUpload2 = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressingImpImage2(true);
    try {
      const result = await processAndCompressImage(file, 1280, 1280, 0.85);
      setImpEvidenceImage2(result.dataUrl);
      setImpEvidenceFileName2(result.fileName);
      setImpEvidenceSizeKb2(result.sizeKb);
    } catch (err: any) {
      alert(err.message || 'Gagal memproses foto bukti 2.');
    } finally {
      setIsCompressingImpImage2(false);
    }
  };

  const handleAddImpound = (e: React.FormEvent) => {
    e.preventDefault();
    if (!impPlate.trim() || !impModel.trim()) {
      alert('Mohon isi Nomor Plat dan Model Kendaraan.');
      return;
    }

    const newImp: ImpoundRecord = {
      id: `IMP-${Date.now()}`,
      plateNumber: impPlate.trim().toUpperCase(),
      vehicleModel: impModel.trim(),
      color: impColor.trim() || 'Hitam',
      ownerName: impOwner.trim() || 'Tidak Diketahui / Anonim',
      reason: impReason.trim() || 'Penyitaan Pelanggaran Lalu Lintas',
      violations: impReason.trim() || 'Penyitaan Pelanggaran Lalu Lintas',
      impoundDays: impDays,
      impoundFee: impFee,
      officerName: impOfficerName.trim() || currentOfficer.name,
      officerBadge: impOfficerBadge.trim() || currentOfficer.badge,
      status: 'IMPOUNDED',
      locationFound: impLocation.trim() || 'Commerce, Los Santos',
      dayDate: impDayDate.trim() || getCurrentIndonesianDayDate(),
      timeString: impTimeString.trim() || getCurrentIndonesianTimeString(),
      notes: impNotes.trim() || 'Penyitaan di Garasi Impound Lot',
      evidenceImage: impEvidenceImage || undefined,
      evidenceImage2: impEvidenceImage2 || undefined,
      evidenceFileName: impEvidenceFileName || undefined,
      evidenceFileName2: impEvidenceFileName2 || undefined,
      evidenceSizeKb: impEvidenceSizeKb || undefined,
      evidenceSizeKb2: impEvidenceSizeKb2 || undefined,
      hasEvidence: Boolean(impEvidenceImage || impEvidenceImage2),
      hasEvidence2: Boolean(impEvidenceImage2),
      timestamp: Date.now()
    };

    onSaveImpound([newImp, ...impoundList]);
    setIsImpoundModalOpen(false);

    // Auto send Impound to Discord
    const cfg = getSavedImpoundWebhookConfig();
    if (cfg.webhookUrl && cfg.autoSendOnSave !== false) {
      setIsSendingDiscord(true);
      sendImpoundRecordToDiscord(newImp, 'IMPOUNDED', currentOfficer).then(res => {
        setDiscordNotice(res);
        setTimeout(() => setDiscordNotice(null), 4000);
      }).catch(() => {}).finally(() => {
        setIsSendingDiscord(false);
      });
    } else {
      setDiscordNotice({
        success: true,
        message: `Penyitaan Kendaraan Plat #${newImp.plateNumber} berhasil dicatat!`
      });
      setTimeout(() => setDiscordNotice(null), 3500);
    }
  };

  const handleManualSendImpound = async (imp: ImpoundRecord) => {
    setIsSendingDiscord(true);
    try {
      const res = await sendImpoundRecordToDiscord(imp, imp.status === 'RELEASED' ? 'RELEASED' : 'IMPOUNDED', currentOfficer);
      setDiscordNotice(res);
      setTimeout(() => setDiscordNotice(null), 4500);
    } catch (err: any) {
      setDiscordNotice({
        success: false,
        message: err.message || 'Gagal mengirim rekor impound ke Discord.'
      });
    } finally {
      setIsSendingDiscord(false);
    }
  };

  const handleToggleReleaseImpound = (impId: string) => {
    const updatedList = impoundList.map(i => {
      if (i.id === impId) {
        const nextStatus = i.status === 'IMPOUNDED' ? 'RELEASED' : 'IMPOUNDED';
        const updated: ImpoundRecord = {
          ...i,
          status: nextStatus as 'IMPOUNDED' | 'RELEASED',
          releasedAt: nextStatus === 'RELEASED' ? Date.now() : undefined
        };
        const cfg = getSavedImpoundWebhookConfig();
        if (cfg.webhookUrl && cfg.autoSendOnSave !== false) {
          sendImpoundRecordToDiscord(updated, nextStatus, currentOfficer).catch(() => {});
        }
        return updated;
      }
      return i;
    });
    onSaveImpound(updatedList);
  };

  const handleDeleteImpound = (impId: string) => {
    if (window.confirm('Hapus rekor sitaan impound ini?')) {
      onSaveImpound(impoundList.filter(i => i.id !== impId));
    }
  };

  const handleCopyImpoundText = (imp: ImpoundRecord) => {
    const text = formatImpoundAsText(imp);
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(imp.id);
      setTimeout(() => setCopiedId(null), 2500);
    }).catch(() => {
      alert('Gagal menyalin teks ke clipboard.');
    });
  };

  // =========================================================================
  // 3. MODAL STATE: TERBITKAN BOLO
  // =========================================================================
  const [isBoloModalOpen, setIsBoloModalOpen] = useState(false);
  const [boloTitle, setBoloTitle] = useState('');
  const [boloType, setBoloType] = useState<any>('VEHICLE');
  const [boloDanger, setBoloDanger] = useState<any>('HIGH');
  const [boloLocation, setBoloLocation] = useState('');
  const [boloDesc, setBoloDesc] = useState('');

  const handleAddBolo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!boloTitle.trim()) return;

    const newBolo: BoloAlert = {
      id: `BOLO-${Date.now()}`,
      type: boloType,
      title: boloTitle.trim(),
      description: boloDesc.trim() || 'Buronan aktif dipantau di seluruh sektor.',
      dangerLevel: boloDanger,
      lastSeenLocation: boloLocation.trim() || 'Los Santos Area',
      issuedBy: currentOfficer.name,
      issuedByBadge: currentOfficer.badge,
      active: true,
      timestamp: Date.now()
    };

    onSaveBolo([newBolo, ...boloList]);
    setIsBoloModalOpen(false);
    setBoloTitle('');
    setBoloDesc('');
    setBoloLocation('');

    const cfg = getSavedBoloWebhookConfig();
    if (cfg.webhookUrl && cfg.autoSendOnSave !== false) {
      sendBoloAlertToDiscord(newBolo, 'PUBLISHED', currentOfficer).then(res => {
        setDiscordNotice(res);
        setTimeout(() => setDiscordNotice(null), 4000);
      }).catch(() => {});
    }
  };

  const handleDeleteBolo = (boloId: string) => {
    onSaveBolo(boloList.filter(b => b.id !== boloId));
  };

  const handleManualSendBolo = async (bolo: BoloAlert) => {
    setIsSendingDiscord(true);
    try {
      const res = await sendBoloAlertToDiscord(bolo, 'PUBLISHED', currentOfficer);
      setDiscordNotice(res);
      setTimeout(() => setDiscordNotice(null), 4000);
    } catch (err: any) {
      setDiscordNotice({
        success: false,
        message: err.message || 'Gagal mengirim BOLO ke Discord.'
      });
    } finally {
      setIsSendingDiscord(false);
    }
  };

  // =========================================================================
  // FILTERED LISTS
  // =========================================================================
  const filteredCitations = useMemo(() => {
    return citationList.filter(c => {
      if (citationStatusFilter !== 'ALL' && c.status !== citationStatusFilter) return false;
      const q = searchCitation.toLowerCase().trim();
      if (!q) return true;
      return (
        c.plateNumber.toLowerCase().includes(q) ||
        c.violatorName.toLowerCase().includes(q) ||
        c.vehicleModel.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) ||
        c.violations.toLowerCase().includes(q) ||
        c.officerName.toLowerCase().includes(q)
      );
    });
  }, [citationList, searchCitation, citationStatusFilter]);

  const filteredImpounds = useMemo(() => {
    return impoundList.filter(i => {
      if (impoundStatusFilter !== 'ALL' && i.status !== impoundStatusFilter) return false;
      const q = searchImpound.toLowerCase().trim();
      if (!q) return true;
      return (
        i.plateNumber.toLowerCase().includes(q) || 
        i.vehicleModel.toLowerCase().includes(q) || 
        i.ownerName.toLowerCase().includes(q) ||
        i.reason.toLowerCase().includes(q) ||
        (i.locationFound && i.locationFound.toLowerCase().includes(q))
      );
    });
  }, [impoundList, searchImpound, impoundStatusFilter]);

  const filteredBolos = useMemo(() => {
    return boloList.filter(b => {
      const q = searchBolo.toLowerCase().trim();
      if (!q) return true;
      return (
        b.title.toLowerCase().includes(q) || 
        b.description.toLowerCase().includes(q) || 
        b.lastSeenLocation.toLowerCase().includes(q)
      );
    });
  }, [boloList, searchBolo]);

  // Statistics
  const totalCitationFine = useMemo(() => {
    return citationList.reduce((acc, c) => acc + (typeof c.totalFine === 'number' ? c.totalFine : 0), 0);
  }, [citationList]);

  const totalImpoundFee = useMemo(() => {
    return impoundList.reduce((acc, i) => acc + (i.impoundFee || 0), 0);
  }, [impoundList]);

  return (
    <div className="space-y-4 font-mono text-xs text-gray-200">
      {/* Top Banner & Hub Controls */}
      <div className="bg-[#161B22] border border-amber-900/60 rounded-xl p-4 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-950 border border-amber-600/80 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
            {activeSubTab === 'tilang' ? (
              <Ticket className="w-5 h-5" />
            ) : activeSubTab === 'impound' ? (
              <Car className="w-5 h-5" />
            ) : (
              <Radio className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-bold text-gray-100 font-sans tracking-tight">
                TRAFFIC ENFORCEMENT, TILANG & IMPOUND HUB
              </h2>
              <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-800 px-1.5 py-0.5 rounded font-bold">
                HIGHWAY PATROL
              </span>
            </div>
            <p className="text-[11px] text-gray-400">
              Pusat Penindakan Pelanggaran Lalu Lintas (Surat Tilang), Sitaan Kendaraan (Impound Lot), dan Peringatan Darurat BOLO.
            </p>
          </div>
        </div>

        {/* Action Switcher & Buttons */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* Subtab Buttons */}
          <div className="bg-[#0D1117] border border-gray-800 rounded-lg p-0.5 flex items-center">
            <button
              onClick={() => setActiveSubTab('tilang')}
              className={`px-3 py-1.5 rounded-md font-bold transition flex items-center gap-1.5 ${
                activeSubTab === 'tilang'
                  ? 'bg-amber-600 text-black shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Ticket className="w-3.5 h-3.5" />
              <span>SURAT TILANG ({citationList.length})</span>
            </button>
            <button
              onClick={() => setActiveSubTab('impound')}
              className={`px-3 py-1.5 rounded-md font-bold transition flex items-center gap-1.5 ${
                activeSubTab === 'impound'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              <span>IMPOUND LOT ({impoundList.length})</span>
            </button>
            <button
              onClick={() => setActiveSubTab('bolo')}
              className={`px-3 py-1.5 rounded-md font-bold transition flex items-center gap-1.5 ${
                activeSubTab === 'bolo'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>BOLO ({boloList.length})</span>
            </button>
          </div>

          {/* Webhook Settings Quick Trigger */}
          {onOpenWebhookSettings && (
            <button
              type="button"
              onClick={onOpenWebhookSettings}
              className="p-2 bg-[#0D1117] hover:bg-gray-800 text-gray-300 border border-gray-700 rounded-lg transition"
              title="Buka Pengaturan Webhook Discord (Tilang & Impound)"
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Primary Action Button */}
          {activeSubTab === 'tilang' ? (
            <button
              onClick={openNewCitationModal}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg transition flex items-center gap-1.5 shadow-md shadow-amber-500/20 text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>TERBITKAN TILANG</span>
            </button>
          ) : activeSubTab === 'impound' ? (
            <button
              onClick={openNewImpoundModal}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition flex items-center gap-1.5 shadow-md shadow-emerald-600/30 text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>SITA KENDARAAN</span>
            </button>
          ) : (
            <button
              onClick={() => setIsBoloModalOpen(true)}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg transition flex items-center gap-1.5 shadow-md shadow-rose-600/30 text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>TERBITKAN BOLO</span>
            </button>
          )}
        </div>
      </div>

      {/* Discord Notification Banner */}
      {discordNotice && (
        <div className={`p-3 rounded-lg text-xs flex items-center justify-between gap-2 border animate-in fade-in ${
          discordNotice.success 
            ? 'bg-emerald-950/90 border-emerald-600 text-emerald-200' 
            : 'bg-rose-950/90 border-rose-600 text-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {discordNotice.success ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            )}
            <span className="font-sans">{discordNotice.message}</span>
          </div>
          <button 
            onClick={() => setDiscordNotice(null)} 
            className="text-gray-400 hover:text-white p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 1: SURAT TILANG (TRAFFIC CITATION)                                */}
      {/* ========================================================================= */}
      {activeSubTab === 'tilang' && (
        <div className="space-y-3">
          {/* Quick Metrics & Search Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-3 bg-[#11141A] border border-gray-800 rounded-xl flex flex-col justify-between">
              <span className="text-[10px] text-gray-400 block font-bold">TOTAL SURAT TILANG</span>
              <span className="text-base font-bold text-amber-300">{citationList.length} Berkas</span>
            </div>
            <div className="p-3 bg-[#11141A] border border-gray-800 rounded-xl flex flex-col justify-between">
              <span className="text-[10px] text-gray-400 block font-bold">TOTAL DENDA AKUMULASI</span>
              <span className="text-base font-bold text-emerald-400">${totalCitationFine.toLocaleString('id-ID')}</span>
            </div>
            <div className="p-3 bg-[#11141A] border border-gray-800 rounded-xl flex flex-col justify-between">
              <span className="text-[10px] text-gray-400 block font-bold">DENDA SUDAH LUNAS</span>
              <span className="text-base font-bold text-emerald-300">
                {citationList.filter(c => c.status === 'PAID').length} Lunas
              </span>
            </div>
            <div className="p-3 bg-[#11141A] border border-gray-800 rounded-xl flex flex-col justify-between">
              <span className="text-[10px] text-gray-400 block font-bold">DENDA BELUM LUNAS</span>
              <span className="text-base font-bold text-rose-400">
                {citationList.filter(c => c.status !== 'PAID').length} Tertunggak
              </span>
            </div>
          </div>

          {/* Search & Status Filter */}
          <div className="bg-[#11141A] border border-gray-800 rounded-xl p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchCitation}
                onChange={(e) => setSearchCitation(e.target.value)}
                placeholder="Cari plat nomor, nama pelanggar, model mobil, pasal, TKP..."
                className="w-full pl-9 pr-3 py-1.5 bg-[#0D1117] border border-gray-700 rounded-lg text-xs text-gray-100 placeholder:text-gray-600 outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] text-gray-400">Filter Status:</span>
              <div className="bg-[#0D1117] border border-gray-700 rounded-lg p-0.5 flex">
                <button
                  onClick={() => setCitationStatusFilter('ALL')}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                    citationStatusFilter === 'ALL' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  Semua ({citationList.length})
                </button>
                <button
                  onClick={() => setCitationStatusFilter('PAID')}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                    citationStatusFilter === 'PAID' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-emerald-300'
                  }`}
                >
                  Lunas
                </button>
                <button
                  onClick={() => setCitationStatusFilter('UNPAID')}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                    citationStatusFilter === 'UNPAID' ? 'bg-rose-600 text-white' : 'text-gray-400 hover:text-rose-300'
                  }`}
                >
                  Belum Lunas
                </button>
              </div>
            </div>
          </div>

          {/* Citations Table / Grid */}
          <div className="bg-[#161B22] border border-gray-800 rounded-xl overflow-x-auto shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0D1117] text-gray-400 uppercase text-[10px] border-b border-gray-800">
                <tr>
                  <th className="py-2.5 px-3">Plat & Kendaraan</th>
                  <th className="py-2.5 px-3">Nama Pelanggar</th>
                  <th className="py-2.5 px-3">Waktu & Tempat</th>
                  <th className="py-2.5 px-3">Pasal & Catatan</th>
                  <th className="py-2.5 px-3">Total Denda</th>
                  <th className="py-2.5 px-3">Bukti</th>
                  <th className="py-2.5 px-3">Petugas</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Aksi Penindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {filteredCitations.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-gray-500">
                      <Ticket className="w-8 h-8 mx-auto mb-2 opacity-30 text-amber-400" />
                      Tidak ada catatan surat tilang yang sesuai filter.
                    </td>
                  </tr>
                ) : (
                  filteredCitations.map(cit => {
                    const hasBukti = cit.hasEvidence || (cit.evidenceImage && cit.evidenceImage.length > 0);
                    const isPaid = cit.status === 'PAID';

                    return (
                      <tr key={cit.id} className="hover:bg-[#1c222b] transition">
                        {/* Plat & Vehicle */}
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-amber-300 bg-black/60 px-2 py-0.5 rounded border border-amber-700/60 text-xs">
                              {cit.plateNumber}
                            </span>
                            <div className="font-bold text-gray-100">{cit.vehicleModel}</div>
                          </div>
                        </td>

                        {/* Violator Name */}
                        <td className="py-2.5 px-3 font-bold text-gray-200">
                          {cit.violatorName}
                        </td>

                        {/* Time & Location */}
                        <td className="py-2.5 px-3 text-[11px]">
                          <div className="text-gray-200 font-medium">{cit.dayDate}</div>
                          <div className="text-gray-400 flex items-center gap-1 text-[10px]">
                            <Clock className="w-3 h-3 text-amber-400" />
                            <span>{cit.timeString}</span>
                          </div>
                          <div className="text-gray-400 text-[10px] truncate max-w-[140px]" title={cit.location}>
                            📍 {cit.location}
                          </div>
                        </td>

                        {/* Violations & Notes */}
                        <td className="py-2.5 px-3 text-[11px] max-w-xs font-sans">
                          <div className="font-bold text-rose-300 line-clamp-1" title={cit.violations}>
                            {cit.violations}
                          </div>
                          {cit.notes && (
                            <div className="text-gray-400 text-[10px] line-clamp-1" title={cit.notes}>
                              Catatan: {cit.notes}
                            </div>
                          )}
                        </td>

                        {/* Total Fine */}
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-emerald-400 text-xs">
                            ${(cit.totalFine || 0).toLocaleString('id-ID')}
                          </div>
                        </td>

                        {/* Evidence Upload Preview */}
                        <td className="py-2.5 px-3">
                          {hasBukti ? (
                            cit.evidenceImage ? (
                              <button
                                type="button"
                                onClick={() => setPreviewImage({
                                  url: cit.evidenceImage!,
                                  title: `Bukti Foto Tilang Plat #${cit.plateNumber} - ${cit.violatorName}`
                                })}
                                className="group relative w-10 h-8 rounded border border-emerald-600/80 overflow-hidden shrink-0 block hover:scale-105 transition"
                                title="Klik untuk melihat bukti foto resolusi penuh"
                              >
                                <img 
                                  src={cit.evidenceImage} 
                                  alt="Bukti Tilang" 
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                                  <Eye className="w-3.5 h-3.5 text-white" />
                                </div>
                              </button>
                            ) : (
                              <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700 px-1.5 py-0.5 rounded font-bold">
                                Ada
                              </span>
                            )
                          ) : (
                            <span className="text-[10px] text-gray-500">-</span>
                          )}
                        </td>

                        {/* Officer */}
                        <td className="py-2.5 px-3 text-[11px] text-gray-300">
                          <div>{cit.officerName}</div>
                          <div className="text-[10px] text-gray-500">[{cit.officerBadge}]</div>
                        </td>

                        {/* Status */}
                        <td className="py-2.5 px-3">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                            isPaid
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                              : 'bg-rose-950 text-rose-300 border-rose-700'
                          }`}>
                            {isPaid ? '🟢 LUNAS' : '⚠️ BELUM LUNAS'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Copy formatted text */}
                            <button
                              type="button"
                              onClick={() => handleCopyCitationText(cit)}
                              className={`p-1.5 rounded transition border ${
                                copiedId === cit.id
                                  ? 'bg-emerald-800 text-white border-emerald-600'
                                  : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'
                              }`}
                              title="Salin Format Teks Tilang Resmi"
                            >
                              {copiedId === cit.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-300" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>

                            {/* Manual send to Discord Webhook */}
                            <button
                              type="button"
                              onClick={() => handleManualSendCitation(cit)}
                              disabled={isSendingDiscord}
                              className="p-1.5 bg-amber-950/60 hover:bg-amber-900 text-amber-300 border border-amber-700/60 rounded transition disabled:opacity-50"
                              title="Kirimkan Tilang ini ke Discord Webhook Log Tilang"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>

                            {/* Toggle Paid / Unpaid */}
                            <button
                              type="button"
                              onClick={() => handleToggleCitationStatus(cit.id)}
                              className={`px-2 py-1 rounded text-[10px] font-bold border transition ${
                                isPaid
                                  ? 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700'
                                  : 'bg-emerald-950 text-emerald-300 border-emerald-700 hover:bg-emerald-900'
                              }`}
                              title="Ubah Status Pembayaran Denda"
                            >
                              {isPaid ? 'Batal Lunas' : 'Tandai Lunas'}
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => handleDeleteCitation(cit.id)}
                              className="p-1.5 text-gray-500 hover:text-rose-400 transition"
                              title="Hapus Rekor Surat Tilang"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: IMPOUND LOT (SITAAN KENDARAAN)                                  */}
      {/* ========================================================================= */}
      {activeSubTab === 'impound' && (
        <div className="space-y-3">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-3 bg-[#11141A] border border-gray-800 rounded-xl flex flex-col justify-between">
              <span className="text-[10px] text-gray-400 block font-bold">TOTAL KENDARAAN DISITA</span>
              <span className="text-base font-bold text-emerald-300">{impoundList.length} Unit</span>
            </div>
            <div className="p-3 bg-[#11141A] border border-gray-800 rounded-xl flex flex-col justify-between">
              <span className="text-[10px] text-gray-400 block font-bold">TOTAL BIAYA TEBUSAN</span>
              <span className="text-base font-bold text-emerald-400">${totalImpoundFee.toLocaleString('id-ID')}</span>
            </div>
            <div className="p-3 bg-[#11141A] border border-gray-800 rounded-xl flex flex-col justify-between">
              <span className="text-[10px] text-gray-400 block font-bold">STATUS SEDANG DISITA</span>
              <span className="text-base font-bold text-rose-400">
                {impoundList.filter(i => i.status === 'IMPOUNDED').length} Di Garasi
              </span>
            </div>
            <div className="p-3 bg-[#11141A] border border-gray-800 rounded-xl flex flex-col justify-between">
              <span className="text-[10px] text-gray-400 block font-bold">SUDAH DITEBUS PEMILIK</span>
              <span className="text-base font-bold text-blue-300">
                {impoundList.filter(i => i.status === 'RELEASED').length} Ditebus
              </span>
            </div>
          </div>

          {/* Search & Status Filter */}
          <div className="bg-[#11141A] border border-gray-800 rounded-xl p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchImpound}
                onChange={(e) => setSearchImpound(e.target.value)}
                placeholder="Cari nomor plat, tipe mobil, pemilik, pasal penyitaan..."
                className="w-full pl-9 pr-3 py-1.5 bg-[#0D1117] border border-gray-700 rounded-lg text-xs text-gray-100 placeholder:text-gray-600 outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] text-gray-400">Filter Status:</span>
              <div className="bg-[#0D1117] border border-gray-700 rounded-lg p-0.5 flex">
                <button
                  onClick={() => setImpoundStatusFilter('ALL')}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                    impoundStatusFilter === 'ALL' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  Semua ({impoundList.length})
                </button>
                <button
                  onClick={() => setImpoundStatusFilter('IMPOUNDED')}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                    impoundStatusFilter === 'IMPOUNDED' ? 'bg-rose-600 text-white' : 'text-gray-400 hover:text-rose-300'
                  }`}
                >
                  Disita
                </button>
                <button
                  onClick={() => setImpoundStatusFilter('RELEASED')}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                    impoundStatusFilter === 'RELEASED' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-emerald-300'
                  }`}
                >
                  Ditebus
                </button>
              </div>
            </div>
          </div>

          {/* Impound Table */}
          <div className="bg-[#161B22] border border-gray-800 rounded-xl overflow-x-auto shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0D1117] text-gray-400 uppercase text-[10px] border-b border-gray-800">
                <tr>
                  <th className="py-2.5 px-3">Plat & Kendaraan</th>
                  <th className="py-2.5 px-3">Pemilik Terdaftar</th>
                  <th className="py-2.5 px-3">Waktu & Lokasi Sita</th>
                  <th className="py-2.5 px-3">Pasal / Alasan Sita</th>
                  <th className="py-2.5 px-3">Durasi & Denda Tebus</th>
                  <th className="py-2.5 px-3">Bukti</th>
                  <th className="py-2.5 px-3">Petugas</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Aksi Penindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {filteredImpounds.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-gray-500">
                      <Car className="w-8 h-8 mx-auto mb-2 opacity-30 text-emerald-400" />
                      Belum ada catatan kendaraan impound.
                    </td>
                  </tr>
                ) : (
                  filteredImpounds.map(imp => {
                    const hasBukti = imp.hasEvidence || (imp.evidenceImage && imp.evidenceImage.length > 0) || (imp.evidenceImage2 && imp.evidenceImage2.length > 0);
                    const isImpounded = imp.status === 'IMPOUNDED';
                    const hasFoto1 = Boolean(imp.evidenceImage);
                    const hasFoto2 = Boolean(imp.evidenceImage2);

                    return (
                      <tr key={imp.id} className="hover:bg-[#1c222b] transition">
                        {/* Plate & Vehicle */}
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-amber-300 bg-black/60 px-2 py-0.5 rounded border border-amber-800/60 text-xs">
                              {imp.plateNumber}
                            </span>
                            <div>
                              <div className="font-bold text-gray-100">{imp.vehicleModel}</div>
                              <div className="text-[10px] text-gray-400">{imp.color}</div>
                            </div>
                          </div>
                        </td>

                        {/* Owner Name */}
                        <td className="py-2.5 px-3 font-bold text-gray-200">
                          {imp.ownerName}
                        </td>

                        {/* Date & Location */}
                        <td className="py-2.5 px-3 text-[11px]">
                          <div className="text-gray-200 font-medium">
                            {imp.dayDate || new Date(imp.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                          <div className="text-gray-400 text-[10px] truncate max-w-[140px]" title={imp.locationFound}>
                            📍 {imp.locationFound || 'Commerce, Los Santos'}
                          </div>
                        </td>

                        {/* Reason / Violations */}
                        <td className="py-2.5 px-3 text-[11px] text-gray-300 max-w-xs font-sans" title={imp.violations || imp.reason}>
                          <div className="font-semibold text-gray-200 line-clamp-1">{imp.violations || imp.reason}</div>
                          {imp.notes && (
                            <div className="text-gray-400 text-[10px] line-clamp-1">{imp.notes}</div>
                          )}
                        </td>

                        {/* Fee & Days */}
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-emerald-400">${(imp.impoundFee || 0).toLocaleString('id-ID')}</div>
                          <div className="text-[10px] text-gray-500">{imp.impoundDays} Hari Sitaan</div>
                        </td>

                        {/* Evidence Upload (2 Foto Maks) */}
                        <td className="py-2.5 px-3">
                          {hasBukti ? (
                            <div className="flex items-center gap-1.5">
                              {hasFoto1 && (
                                <button
                                  type="button"
                                  onClick={() => setPreviewImage({
                                    url: imp.evidenceImage!,
                                    title: `Foto 1 (TKP): Sitaan Plat #${imp.plateNumber} - ${imp.vehicleModel}`
                                  })}
                                  className="group relative w-8 h-7 rounded border border-emerald-600/80 overflow-hidden shrink-0 block hover:scale-105 transition"
                                  title="Klik melihat Foto Bukti 1 (TKP/Unit)"
                                >
                                  <img 
                                    src={imp.evidenceImage} 
                                    alt="Foto 1" 
                                    className="w-full h-full object-cover"
                                  />
                                  <span className="absolute bottom-0 right-0 bg-emerald-950/90 text-[8px] font-bold text-emerald-300 px-0.5 leading-none">
                                    1
                                  </span>
                                </button>
                              )}
                              {hasFoto2 && (
                                <button
                                  type="button"
                                  onClick={() => setPreviewImage({
                                    url: imp.evidenceImage2!,
                                    title: `Foto 2 (Kondisi/Plat): Sitaan Plat #${imp.plateNumber} - ${imp.vehicleModel}`
                                  })}
                                  className="group relative w-8 h-7 rounded border border-cyan-600/80 overflow-hidden shrink-0 block hover:scale-105 transition"
                                  title="Klik melihat Foto Bukti 2 (Kondisi/Plat/Garasi)"
                                >
                                  <img 
                                    src={imp.evidenceImage2} 
                                    alt="Foto 2" 
                                    className="w-full h-full object-cover"
                                  />
                                  <span className="absolute bottom-0 right-0 bg-cyan-950/90 text-[8px] font-bold text-cyan-300 px-0.5 leading-none">
                                    2
                                  </span>
                                </button>
                              )}
                              {!hasFoto1 && !hasFoto2 && (
                                <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700 px-1.5 py-0.5 rounded font-bold">
                                  Ada
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] text-gray-500">-</span>
                          )}
                        </td>

                        {/* Officer */}
                        <td className="py-2.5 px-3 text-[11px] text-gray-300">
                          {imp.officerName} ({imp.officerBadge})
                        </td>

                        {/* Status */}
                        <td className="py-2.5 px-3">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                            isImpounded
                              ? 'bg-rose-950 text-rose-300 border-rose-700'
                              : 'bg-emerald-950 text-emerald-300 border-emerald-700'
                          }`}>
                            {isImpounded ? '🔒 DISITA' : '✅ DITEBUS'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Copy formatted text */}
                            <button
                              type="button"
                              onClick={() => handleCopyImpoundText(imp)}
                              className={`p-1.5 rounded transition border ${
                                copiedId === imp.id
                                  ? 'bg-emerald-800 text-white border-emerald-600'
                                  : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'
                              }`}
                              title="Salin Format Teks Sitaan Impound Resmi"
                            >
                              {copiedId === imp.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-300" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>

                            {/* Manual send to Discord Webhook */}
                            <button
                              type="button"
                              onClick={() => handleManualSendImpound(imp)}
                              disabled={isSendingDiscord}
                              className="p-1.5 bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 rounded transition disabled:opacity-50"
                              title="Kirim catatan impound ini ke Discord Webhook Log Impound"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>

                            {/* Toggle Release / Impound */}
                            <button
                              type="button"
                              onClick={() => handleToggleReleaseImpound(imp.id)}
                              className={`px-2 py-1 rounded text-[10px] font-bold border transition ${
                                isImpounded
                                  ? 'bg-emerald-950 text-emerald-300 border-emerald-700 hover:bg-emerald-900'
                                  : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700'
                              }`}
                              title="Ubah Status Tebusan"
                            >
                              {isImpounded ? 'Lepas Sitaan' : 'Sita Kembali'}
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => handleDeleteImpound(imp.id)}
                              className="p-1.5 text-gray-500 hover:text-rose-400 transition"
                              title="Hapus Rekor"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: BOLO ALERTS (BE ON LOOK OUT)                                   */}
      {/* ========================================================================= */}
      {activeSubTab === 'bolo' && (
        <div className="space-y-3">
          <div className="bg-[#11141A] border border-gray-800 rounded-xl p-3 flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchBolo}
                onChange={(e) => setSearchBolo(e.target.value)}
                placeholder="Cari BOLO kendaraan buronan, ciri pelaku, plat..."
                className="w-full pl-9 pr-3 py-1.5 bg-[#0D1117] border border-gray-700 rounded-lg text-xs text-gray-100 placeholder:text-gray-600 outline-none focus:border-rose-500"
              />
            </div>
            <div className="text-[11px] text-gray-400">
              Menampilkan <strong className="text-rose-400">{filteredBolos.length}</strong> Peringatan Aktif
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredBolos.length === 0 ? (
              <div className="col-span-full bg-[#161B22] border border-gray-800 rounded-xl p-12 text-center text-gray-500">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-30 text-rose-400" />
                Tidak ada peringatan BOLO aktif saat ini.
              </div>
            ) : (
              filteredBolos.map(b => (
                <div key={b.id} className="bg-[#161B22] border border-rose-900/60 rounded-xl p-4 space-y-3 relative overflow-hidden shadow-lg flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-700 px-2 py-0.5 rounded flex items-center gap-1 animate-pulse">
                        <span className="w-1.5 h-1.5 bg-rose-400 rounded-full"></span>
                        BOLO [{b.type}]
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleManualSendBolo(b)}
                          disabled={isSendingDiscord}
                          className="p-1.5 bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-700/60 rounded transition"
                          title="Kirim BOLO ini ke Discord Webhook"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteBolo(b.id)}
                          className="text-gray-500 hover:text-rose-400 transition p-1.5"
                          title="Hapus / Tutup BOLO"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-gray-100 text-xs font-sans">
                        {b.title}
                      </h4>
                      <p className="text-[11px] text-gray-300 mt-1 leading-relaxed font-sans">
                        {b.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-800 space-y-1 text-[10px] text-gray-400">
                    <div className="flex items-center gap-1.5 text-gray-300">
                      <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                      <span>{b.lastSeenLocation}</span>
                    </div>
                    <div className="flex items-center justify-between text-gray-500 pt-1">
                      <span>Diterbitkan: {b.issuedBy} ({b.issuedByBadge})</span>
                      <span>{new Date(b.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TERBITKAN SURAT TILANG (TRAFFIC CITATION)                          */}
      {/* ========================================================================= */}
      {isCitationModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs font-mono text-xs overflow-y-auto">
          <div className="bg-[#161B22] border border-amber-500/70 rounded-xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col my-auto max-h-[95vh]">
            <div className="bg-[#0D1117] border-b border-gray-800 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ticket className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold uppercase text-gray-100">
                  FORMULIR PENINDAKAN SURAT TILANG LALU LINTAS
                </h3>
              </div>
              <button onClick={() => setIsCitationModalOpen(false)} className="text-gray-400 hover:text-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCitation} className="p-4 space-y-3 overflow-y-auto">
              {/* Petugas & Waktu */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-2.5 bg-[#0D1117] rounded-lg border border-gray-800">
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Nama Petugas :</label>
                  <input
                    type="text"
                    value={citOfficerName}
                    onChange={(e) => setCitOfficerName(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-[#161B22] border border-gray-700 rounded text-xs text-amber-300 font-bold outline-none focus:border-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Badge / NRP Petugas :</label>
                  <input
                    type="text"
                    value={citOfficerBadge}
                    onChange={(e) => setCitOfficerBadge(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-[#161B22] border border-gray-700 rounded text-xs text-gray-200 outline-none"
                    placeholder="Contoh: 001 / 042"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Hari/Tanggal :</label>
                  <input
                    type="text"
                    value={citDayDate}
                    onChange={(e) => setCitDayDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-[#161B22] border border-gray-700 rounded text-xs text-gray-200 outline-none"
                    placeholder="Jumat, 11 September 2026"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Jam :</label>
                  <input
                    type="text"
                    value={citTimeString}
                    onChange={(e) => setCitTimeString(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-[#161B22] border border-gray-700 rounded text-xs text-gray-200 outline-none"
                    placeholder="14:30 WIB"
                    required
                  />
                </div>
              </div>

              {/* Pelanggar & Lokasi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Nama (Pelanggar / Pengemudi) * :</label>
                  <input
                    type="text"
                    value={citViolatorName}
                    onChange={(e) => setCitViolatorName(e.target.value)}
                    placeholder="Contoh: Dominic Toretto"
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 rounded text-xs text-gray-100 outline-none focus:border-amber-500 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Nama tempat (Lokasi Pelanggaran / TKP) * :</label>
                  <input
                    type="text"
                    value={citLocation}
                    onChange={(e) => setCitLocation(e.target.value)}
                    placeholder="Commerce Intersection, Los Santos"
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 rounded text-xs text-gray-100 outline-none"
                    required
                  />
                </div>
              </div>

              {/* Kendaraan & Plat */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Jenis Kendaraan * :</label>
                  <input
                    type="text"
                    value={citVehicleModel}
                    onChange={(e) => setCitVehicleModel(e.target.value)}
                    placeholder="Contoh: Buffalo S / Sultan / Elegy"
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 rounded text-xs text-gray-100 outline-none focus:border-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Plat Nomor * :</label>
                  <input
                    type="text"
                    value={citPlateNumber}
                    onChange={(e) => setCitPlateNumber(e.target.value.toUpperCase())}
                    placeholder="Contoh: FAST-01 / LS-8821"
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 rounded text-xs text-amber-300 font-bold outline-none focus:border-amber-500"
                    required
                  />
                </div>
              </div>

              {/* Pasal Pelanggaran */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] text-gray-400 block">Pasal Pelanggaran * :</label>
                  <div className="flex gap-1 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setCitViolations(prev => prev ? `${prev}, Speeding` : 'Pasal 18 (Speeding / Batas Kecepatan)')}
                      className="text-[9px] bg-gray-800 hover:bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded border border-gray-700"
                    >
                      + Speeding
                    </button>
                    <button
                      type="button"
                      onClick={() => setCitViolations(prev => prev ? `${prev}, Reckless Driving` : 'Pasal 24 (Reckless Driving / Ugal-ugalan)')}
                      className="text-[9px] bg-gray-800 hover:bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded border border-gray-700"
                    >
                      + Reckless
                    </button>
                    <button
                      type="button"
                      onClick={() => setCitViolations(prev => prev ? `${prev}, Lampu Merah` : 'Pasal 09 (Menerobos Lampu Merah)')}
                      className="text-[9px] bg-gray-800 hover:bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded border border-gray-700"
                    >
                      + Lampu Merah
                    </button>
                    <button
                      type="button"
                      onClick={() => setCitViolations(prev => prev ? `${prev}, Parkir Liar` : 'Pasal 12 (Parkir Liar / Sembarangan)')}
                      className="text-[9px] bg-gray-800 hover:bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded border border-gray-700"
                    >
                      + Parkir Liar
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  value={citViolations}
                  onChange={(e) => setCitViolations(e.target.value)}
                  placeholder="Contoh: Pasal 24 (Ugal-ugalan) & Pasal 18 (Melebihi Batas Kecepatan 140 KM/J)"
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 rounded text-xs text-rose-300 font-bold outline-none focus:border-amber-500"
                  required
                />
              </div>

              {/* Total Denda */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Total Denda ($ SA-MP) * :</label>
                  <input
                    type="number"
                    min={0}
                    step={500}
                    value={citTotalFine}
                    onChange={(e) => setCitTotalFine(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 rounded text-xs text-emerald-400 font-bold outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Status Awal Pelunasan :</label>
                  <div className="px-3 py-2 bg-[#0D1117] border border-gray-700 rounded text-xs text-amber-300 font-bold">
                    ⚠️ BELUM LUNAS (UNPAID)
                  </div>
                </div>
              </div>

              {/* Catatan */}
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Catatan :</label>
                <textarea
                  value={citNotes}
                  onChange={(e) => setCitNotes(e.target.value)}
                  rows={2}
                  placeholder="Catatan penindakan tilang atau perilaku pelanggar..."
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 rounded text-xs text-gray-100 outline-none font-sans"
                />
              </div>

              {/* UPLOAD BUKTI MENGGUNAKAN AKSES GALERI PERANGKAT / DEVICE */}
              <div className="p-3 bg-[#0D1117] rounded-lg border border-gray-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[11px] font-bold text-gray-200">
                      Upload Bukti Penindakan Tilang (1 Foto Galeri / Kamera Perangkat)
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    citEvidenceImage ? 'bg-emerald-950 text-emerald-300 border-emerald-600' : 'bg-gray-800 text-gray-400 border-gray-700'
                  }`}>
                    Bukti : {citEvidenceImage ? 'Ada (1 Foto)' : 'Tidak Ada'}
                  </span>
                </div>

                <input
                  type="file"
                  accept="image/*"
                  ref={citationFileInputRef}
                  onChange={handleCitImageUpload}
                  className="hidden"
                />

                {!citEvidenceImage ? (
                  <button
                    type="button"
                    onClick={() => citationFileInputRef.current?.click()}
                    disabled={isCompressingCitImage}
                    className="w-full py-4 border-2 border-dashed border-gray-700 hover:border-amber-500 rounded-lg text-center flex flex-col items-center justify-center gap-1.5 transition text-gray-400 hover:text-amber-300 group"
                  >
                    <Upload className={`w-5 h-5 ${isCompressingCitImage ? 'animate-bounce text-amber-400' : 'group-hover:scale-110'}`} />
                    <span className="font-bold text-xs">
                      {isCompressingCitImage ? 'Sedang Memproses Foto...' : 'Buka Galeri Perangkat / Pilih Foto Bukti'}
                    </span>
                    <span className="text-[10px] text-gray-500 font-sans">
                      Dukungan JPG, PNG, WebP • Langsung dioptimalkan dan siap dikirim ke Discord
                    </span>
                  </button>
                ) : (
                  <div className="flex items-center justify-between p-2 bg-[#161B22] rounded border border-emerald-700/60">
                    <div className="flex items-center gap-3">
                      <img
                        src={citEvidenceImage}
                        alt="Preview Bukti"
                        className="w-12 h-12 object-cover rounded border border-gray-700 shrink-0"
                      />
                      <div>
                        <span className="text-emerald-300 font-bold text-xs block">
                          ✅ Bukti Foto Tersimpan ({citEvidenceSizeKb} KB)
                        </span>
                        <span className="text-[10px] text-gray-400 truncate max-w-[200px] block">
                          {citEvidenceFileName || 'gambar_bukti_tilang.jpg'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => citationFileInputRef.current?.click()}
                        className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 text-[10px] rounded border border-gray-700"
                      >
                        Ganti Foto
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCitEvidenceImage(null);
                          setCitEvidenceFileName('');
                          setCitEvidenceSizeKb(0);
                        }}
                        className="p-1 text-gray-400 hover:text-rose-400"
                        title="Hapus Bukti"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Form Action Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsCitationModalOpen(false)}
                  className="px-4 py-2 bg-gray-800 text-gray-300 rounded text-xs hover:bg-gray-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSendingDiscord}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded text-xs flex items-center gap-1.5 shadow-lg"
                >
                  {isSendingDiscord ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Ticket className="w-3.5 h-3.5" />
                  )}
                  <span>Terbitkan & Simpan Tilang</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SITA KENDARAAN (IMPOUND LOT FORM)                                  */}
      {/* ========================================================================= */}
      {isImpoundModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs font-mono text-xs overflow-y-auto">
          <div className="bg-[#161B22] border border-emerald-500/70 rounded-xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col my-auto max-h-[95vh]">
            <div className="bg-[#0D1117] border-b border-gray-800 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold uppercase text-gray-100">
                  FORMULIR PENYITAAN KENDARAAN (IMPOUND LOT)
                </h3>
              </div>
              <button onClick={() => setIsImpoundModalOpen(false)} className="text-gray-400 hover:text-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddImpound} className="p-4 space-y-3 overflow-y-auto">
              {/* Petugas & Waktu */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-2.5 bg-[#0D1117] rounded-lg border border-gray-800">
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Nama Petugas :</label>
                  <input
                    type="text"
                    value={impOfficerName}
                    onChange={(e) => setImpOfficerName(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-[#161B22] border border-gray-700 rounded text-xs text-emerald-300 font-bold outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Badge Petugas :</label>
                  <input
                    type="text"
                    value={impOfficerBadge}
                    onChange={(e) => setImpOfficerBadge(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-[#161B22] border border-gray-700 rounded text-xs text-gray-200 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Hari/Tanggal :</label>
                  <input
                    type="text"
                    value={impDayDate}
                    onChange={(e) => setImpDayDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-[#161B22] border border-gray-700 rounded text-xs text-gray-200 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Jam :</label>
                  <input
                    type="text"
                    value={impTimeString}
                    onChange={(e) => setImpTimeString(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-[#161B22] border border-gray-700 rounded text-xs text-gray-200 outline-none"
                    required
                  />
                </div>
              </div>

              {/* Plat & Model */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Plat Nomor * :</label>
                  <input
                    type="text"
                    value={impPlate}
                    onChange={(e) => setImpPlate(e.target.value.toUpperCase())}
                    placeholder="Contoh: LS-8842"
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 rounded text-xs text-amber-300 font-bold outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Jenis Kendaraan / Model * :</label>
                  <input
                    type="text"
                    value={impModel}
                    onChange={(e) => setImpModel(e.target.value)}
                    placeholder="Contoh: Sultan / Elegy / Infernus"
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 rounded text-xs text-gray-100 outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              {/* Warna & Pemilik */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Warna Kendaraan :</label>
                  <input
                    type="text"
                    value={impColor}
                    onChange={(e) => setImpColor(e.target.value)}
                    placeholder="Contoh: Hitam Metalik"
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 rounded text-xs text-gray-100 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Nama (Pemilik Terdaftar) :</label>
                  <input
                    type="text"
                    value={impOwner}
                    onChange={(e) => setImpOwner(e.target.value)}
                    placeholder="Contoh: Kenji Sato / Tidak Diketahui"
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 rounded text-xs text-gray-100 outline-none font-bold"
                  />
                </div>
              </div>

              {/* Nama Tempat */}
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Nama tempat (Lokasi Penyitaan) * :</label>
                <input
                  type="text"
                  value={impLocation}
                  onChange={(e) => setImpLocation(e.target.value)}
                  placeholder="Commerce, Los Santos"
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 rounded text-xs text-gray-100 outline-none"
                  required
                />
              </div>

              {/* Pasal / Alasan */}
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Pasal Pelanggaran / Alasan Penyitaan * :</label>
                <input
                  type="text"
                  value={impReason}
                  onChange={(e) => setImpReason(e.target.value)}
                  placeholder="Contoh: Pasal E - Balap Liar & Melarikan Diri dari Petugas"
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 rounded text-xs text-rose-300 font-bold outline-none focus:border-emerald-500"
                  required
                />
              </div>

              {/* Durasi & Biaya */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Durasi Sitaan (Hari) :</label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={impDays}
                    onChange={(e) => setImpDays(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 rounded text-xs text-gray-100 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Total Denda / Biaya Tebus ($ SA-MP) * :</label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={impFee}
                    onChange={(e) => setImpFee(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 rounded text-xs text-emerald-400 font-bold outline-none"
                    required
                  />
                </div>
              </div>

              {/* Catatan */}
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Catatan :</label>
                <input
                  type="text"
                  value={impNotes}
                  onChange={(e) => setImpNotes(e.target.value)}
                  placeholder="Penyitaan di Garasi Impound Lot HSPD."
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 rounded text-xs text-gray-100 outline-none font-sans"
                />
              </div>

              {/* UPLOAD BUKTI SITAAN MENGGUNAKAN AKSES GALERI PERANGKAT (2 FOTO) */}
              <div className="p-3.5 bg-[#0D1117] rounded-lg border border-gray-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-emerald-400" />
                    <div>
                      <span className="text-xs font-bold text-gray-100 block">
                        Upload Bukti Sitaan Kendaraan (Maks. 2 Foto Galeri)
                      </span>
                      <span className="text-[10px] text-gray-400">
                        Foto 1: Kondisi Unit/TKP • Foto 2: Garasi/Plat/Nomor Rangka
                      </span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    [impEvidenceImage, impEvidenceImage2].filter(Boolean).length === 2
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                      : [impEvidenceImage, impEvidenceImage2].filter(Boolean).length === 1
                        ? 'bg-amber-950 text-amber-300 border-amber-600'
                        : 'bg-gray-800 text-gray-400 border-gray-700'
                  }`}>
                    Bukti : {[impEvidenceImage, impEvidenceImage2].filter(Boolean).length === 2 ? 'Lengkap (2 Foto)' : [impEvidenceImage, impEvidenceImage2].filter(Boolean).length === 1 ? '1 Foto Terlampir' : 'Belum Ada'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* FOTO BUKTI 1 */}
                  <div className="p-2.5 bg-[#161B22] rounded-lg border border-gray-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-emerald-300 flex items-center gap-1">
                        <span>📸 Foto Bukti 1:</span>
                        <span className="text-gray-400 text-[10px] font-normal">Unit Kendaraan / TKP</span>
                      </span>
                      {impEvidenceImage && (
                        <span className="text-[9px] bg-emerald-950 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-800">
                          {impEvidenceSizeKb} KB
                        </span>
                      )}
                    </div>

                    <input
                      type="file"
                      accept="image/*"
                      ref={impoundFileInputRef}
                      onChange={handleImpImageUpload}
                      className="hidden"
                    />

                    {!impEvidenceImage ? (
                      <button
                        type="button"
                        onClick={() => impoundFileInputRef.current?.click()}
                        disabled={isCompressingImpImage}
                        className="w-full py-3.5 border border-dashed border-gray-700 hover:border-emerald-500 rounded-lg text-center flex flex-col items-center justify-center gap-1 transition text-gray-400 hover:text-emerald-300 group bg-[#0D1117]/60"
                      >
                        <Upload className={`w-4 h-4 ${isCompressingImpImage ? 'animate-bounce text-emerald-400' : 'group-hover:scale-110'}`} />
                        <span className="font-bold text-[11px]">
                          {isCompressingImpImage ? 'Memproses Foto 1...' : 'Pilih Foto 1 dari Galeri'}
                        </span>
                        <span className="text-[9px] text-gray-500">
                          Akses galeri HP / file perangkat
                        </span>
                      </button>
                    ) : (
                      <div className="flex items-center justify-between p-1.5 bg-[#0D1117] rounded border border-emerald-700/60">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <img
                            src={impEvidenceImage}
                            alt="Foto 1"
                            className="w-10 h-10 object-cover rounded border border-gray-700 shrink-0"
                          />
                          <div className="truncate">
                            <span className="text-emerald-300 font-bold text-[11px] block truncate">
                              Foto 1 Terpasang
                            </span>
                            <span className="text-[9px] text-gray-400 block truncate">
                              {impEvidenceFileName || 'bukti_unit_tkp.jpg'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => impoundFileInputRef.current?.click()}
                            className="px-2 py-0.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-[10px] rounded border border-gray-700"
                          >
                            Ganti
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setImpEvidenceImage(null);
                              setImpEvidenceFileName('');
                              setImpEvidenceSizeKb(0);
                            }}
                            className="p-1 text-gray-400 hover:text-rose-400"
                            title="Hapus Foto 1"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* FOTO BUKTI 2 */}
                  <div className="p-2.5 bg-[#161B22] rounded-lg border border-gray-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-cyan-300 flex items-center gap-1">
                        <span>📸 Foto Bukti 2:</span>
                        <span className="text-gray-400 text-[10px] font-normal">Plat / Kondisi / Garasi</span>
                      </span>
                      {impEvidenceImage2 && (
                        <span className="text-[9px] bg-cyan-950 text-cyan-300 px-1.5 py-0.2 rounded border border-cyan-800">
                          {impEvidenceSizeKb2} KB
                        </span>
                      )}
                    </div>

                    <input
                      type="file"
                      accept="image/*"
                      ref={impoundFileInputRef2}
                      onChange={handleImpImageUpload2}
                      className="hidden"
                    />

                    {!impEvidenceImage2 ? (
                      <button
                        type="button"
                        onClick={() => impoundFileInputRef2.current?.click()}
                        disabled={isCompressingImpImage2}
                        className="w-full py-3.5 border border-dashed border-gray-700 hover:border-cyan-500 rounded-lg text-center flex flex-col items-center justify-center gap-1 transition text-gray-400 hover:text-cyan-300 group bg-[#0D1117]/60"
                      >
                        <Upload className={`w-4 h-4 ${isCompressingImpImage2 ? 'animate-bounce text-cyan-400' : 'group-hover:scale-110'}`} />
                        <span className="font-bold text-[11px]">
                          {isCompressingImpImage2 ? 'Memproses Foto 2...' : 'Pilih Foto 2 dari Galeri'}
                        </span>
                        <span className="text-[9px] text-gray-500">
                          Akses galeri HP / file perangkat
                        </span>
                      </button>
                    ) : (
                      <div className="flex items-center justify-between p-1.5 bg-[#0D1117] rounded border border-cyan-700/60">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <img
                            src={impEvidenceImage2}
                            alt="Foto 2"
                            className="w-10 h-10 object-cover rounded border border-gray-700 shrink-0"
                          />
                          <div className="truncate">
                            <span className="text-cyan-300 font-bold text-[11px] block truncate">
                              Foto 2 Terpasang
                            </span>
                            <span className="text-[9px] text-gray-400 block truncate">
                              {impEvidenceFileName2 || 'bukti_plat_garasi.jpg'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => impoundFileInputRef2.current?.click()}
                            className="px-2 py-0.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-[10px] rounded border border-gray-700"
                          >
                            Ganti
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setImpEvidenceImage2(null);
                              setImpEvidenceFileName2('');
                              setImpEvidenceSizeKb2(0);
                            }}
                            className="p-1 text-gray-400 hover:text-rose-400"
                            title="Hapus Foto 2"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsImpoundModalOpen(false)}
                  className="px-4 py-2 bg-gray-800 text-gray-300 rounded text-xs hover:bg-gray-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSendingDiscord}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-xs flex items-center gap-1.5 shadow-lg"
                >
                  <Car className="w-3.5 h-3.5" />
                  <span>Daftarkan Sitaan Impound</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TERBITKAN BOLO                                                     */}
      {/* ========================================================================= */}
      {isBoloModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs font-mono text-xs">
          <div className="bg-[#161B22] border border-rose-600/70 rounded-xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col">
            <div className="bg-[#0D1117] border-b border-gray-800 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <h3 className="text-xs font-bold uppercase text-gray-100">
                  TERBITKAN PERINGATAN DARURAT (BOLO)
                </h3>
              </div>
              <button onClick={() => setIsBoloModalOpen(false)} className="text-gray-400 hover:text-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddBolo} className="p-4 space-y-3">
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Judul BOLO / Target Buron *</label>
                <input
                  type="text"
                  value={boloTitle}
                  onChange={(e) => setBoloTitle(e.target.value)}
                  placeholder="Contoh: Sultan Biru Tua Plat #LS-7749 (Perampokan Bank)"
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 rounded text-xs text-gray-100 outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Tipe Target</label>
                  <select
                    value={boloType}
                    onChange={(e) => setBoloType(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 rounded text-xs text-gray-100 outline-none"
                  >
                    <option value="VEHICLE">Kendaraan (Vehicle)</option>
                    <option value="PERSON">Orang / Suspect (Person)</option>
                    <option value="WEAPON">Senjata Api / Bahan Peledak</option>
                    <option value="ALL_POINTS_BULLETIN">All Points Bulletin (Siaga Kota)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Tingkat Bahaya</label>
                  <select
                    value={boloDanger}
                    onChange={(e) => setBoloDanger(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 rounded text-xs text-gray-100 outline-none"
                  >
                    <option value="EXTREME_ARMED_DANGEROUS">🔴 Bersenjata Berat & Ekstrem Bahaya</option>
                    <option value="HIGH">🟠 Tingkat Tinggi (High)</option>
                    <option value="MEDIUM">🟡 Sedang (Medium)</option>
                    <option value="LOW">⚪ Rendah / Informatif</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Lokasi Terakhir Terlihat (Last Seen)</label>
                <input
                  type="text"
                  value={boloLocation}
                  onChange={(e) => setBoloLocation(e.target.value)}
                  placeholder="Contoh: Menuju arah Freeway Las Venturas..."
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 rounded text-xs text-gray-100 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Ciri-Ciri Tambahan / Instruksi Patroli</label>
                <textarea
                  value={boloDesc}
                  onChange={(e) => setBoloDesc(e.target.value)}
                  rows={3}
                  placeholder="Pelaku mengenakan topeng hitam, knalpot bising..."
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 rounded text-xs text-gray-100 outline-none font-sans"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsBoloModalOpen(false)}
                  className="px-4 py-2 bg-gray-800 text-gray-300 rounded text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded text-xs"
                >
                  Kirimkan Siaga BOLO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PREVIEW GAMBAR BUKTI ZOOM RESOLUSI PENUH                          */}
      {/* ========================================================================= */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <div 
            className="bg-[#161B22] border border-gray-700 rounded-xl max-w-3xl w-full overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 bg-[#0D1117] border-b border-gray-800 flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-gray-200 truncate">
                📸 {previewImage.title}
              </span>
              <button 
                onClick={() => setPreviewImage(null)} 
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-2 bg-black flex items-center justify-center max-h-[75vh] overflow-auto">
              <img 
                src={previewImage.url} 
                alt="Bukti Lengkap" 
                className="max-w-full max-h-[70vh] object-contain rounded"
              />
            </div>
            <div className="p-3 bg-[#0D1117] border-t border-gray-800 flex items-center justify-between text-[11px] font-mono text-gray-400">
              <span>Diambil langsung dari galeri perangkat / device petugas.</span>
              <button
                type="button"
                onClick={() => {
                  const win = window.open();
                  if (win) {
                    win.document.write(`<img src="${previewImage.url}" />`);
                  }
                }}
                className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded border border-gray-700 transition"
              >
                Buka di Tab Baru
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
