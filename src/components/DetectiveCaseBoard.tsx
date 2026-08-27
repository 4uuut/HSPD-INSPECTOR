import React, { useState, useMemo, useRef } from 'react';
import { 
  Search, FileText, Plus, Shield, CheckCircle2, Clock, AlertTriangle, 
  User, MapPin, Calendar, Lock, Unlock, Eye, Sparkles, FolderOpen,
  ArrowRight, ExternalLink, Trash2, Edit3, Filter, Tag, Check, X,
  FileCheck, ShieldAlert, ChevronDown, ChevronRight, Image as ImageIcon,
  Send, RefreshCw, AlertCircle, Crown, Star, Target, Users, GitBranch,
  Upload, Camera, ZoomIn, DollarSign, Phone, Skull, Paperclip, Download,
  Printer, Award
} from 'lucide-react';
import { 
  DetectiveCase, 
  CaseStatus, 
  CasePriority, 
  CaseSuspect, 
  CaseEvidence, 
  CaseTimelineEvent,
  OfficerProfile,
  isOfficerHighRank,
  SyndicateRole,
  SuspectStatus,
  EvidenceType
} from '../types';
import { sendDetectiveCaseToDiscord, getSavedDetectiveWebhookConfig } from '../utils/discordWebhook';
import { processAndCompressImage } from '../utils/imageCompressor';
import { exportElementAsImage } from '../utils/exportDocumentAsImage';

interface Props {
  cases: DetectiveCase[];
  currentOfficer: OfficerProfile;
  onSaveCase: (updatedCase: DetectiveCase) => void;
  onCreateCase: (newCase: DetectiveCase) => void;
  onDeleteCase: (caseId: string) => void;
}

export const DetectiveCaseBoard: React.FC<Props> = ({
  cases,
  currentOfficer,
  onSaveCase,
  onCreateCase,
  onDeleteCase
}) => {
  const isHighRank = isOfficerHighRank(currentOfficer.rank);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [selectedCase, setSelectedCase] = useState<DetectiveCase | null>(cases[0] || null);
  const [isCreatingModal, setIsCreatingModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'suspects' | 'evidences' | 'timeline'>('overview');
  const [suspectViewMode, setSuspectViewMode] = useState<'tree' | 'tiers'>('tree');
  const [showDossierModal, setShowDossierModal] = useState(false);
  const [isExportingImage, setIsExportingImage] = useState<'png' | 'jpeg' | null>(null);
  const [discordNotice, setDiscordNotice] = useState<{ success: boolean; message: string } | null>(null);
  const [isSendingDiscord, setIsSendingDiscord] = useState(false);

  // Export Detective Dossier to PNG / JPG
  const handleExportDossierImage = async (format: 'png' | 'jpeg') => {
    if (!selectedCase) return;
    setIsExportingImage(format);
    try {
      const res = await exportElementAsImage('detective-dossier-sheet', {
        fileName: `BERKAS_INVESTIGASI_${selectedCase.caseNumber}_${selectedCase.title.replace(/\s+/g, '_')}`,
        format,
        quality: 0.98,
        backgroundColor: '#0F1318',
        scale: 2
      });

      if (res.success) {
        setDiscordNotice({
          success: true,
          message: `Berhasil mengunduh Berkas Perkara & Bagan Sindikat Kasus dalam format ${format.toUpperCase()}!`
        });
        setTimeout(() => setDiscordNotice(null), 4000);
      } else {
        setDiscordNotice({
          success: false,
          message: res.error || 'Gagal mengekspor berkas kasus ke gambar.'
        });
      }
    } catch (e: any) {
      setDiscordNotice({
        success: false,
        message: e.message || 'Terjadi kesalahan saat memproses gambar.'
      });
    } finally {
      setIsExportingImage(null);
    }
  };

  // New Case Form State
  const [newTitle, setNewTitle] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newPriority, setNewPriority] = useState<CasePriority>('MEDIUM');
  const [newLocation, setNewLocation] = useState('');
  const [newIncidentDate, setNewIncidentDate] = useState(new Date().toISOString().split('T')[0]);

  // Suspect Modal / Edit State
  const [isSuspectModalOpen, setIsSuspectModalOpen] = useState(false);
  const [editingSuspectId, setEditingSuspectId] = useState<string | null>(null);
  const [suspName, setSuspName] = useState('');
  const [suspAlias, setSuspAlias] = useState('');
  const [suspGang, setSuspGang] = useState('');
  const [suspRole, setSuspRole] = useState<SyndicateRole>('SOLDIER');
  const [suspCustomTitle, setSuspCustomTitle] = useState('');
  const [suspParentId, setSuspParentId] = useState<string>('');
  const [suspStatus, setSuspStatus] = useState<SuspectStatus>('SUSPECT');
  const [suspMugshot, setSuspMugshot] = useState('');
  const [suspPhone, setSuspPhone] = useState('');
  const [suspBounty, setSuspBounty] = useState<string>('');
  const [suspNotes, setSuspNotes] = useState('');
  const [suspCharges, setSuspCharges] = useState('');
  const [isUploadingMugshot, setIsUploadingMugshot] = useState(false);

  // Evidence Form State
  const [isAddingEvidence, setIsAddingEvidence] = useState(false);
  const [evTitle, setEvTitle] = useState('');
  const [evType, setEvType] = useState<EvidenceType>('BALLISTICS');
  const [evDesc, setEvDesc] = useState('');
  const [evLoc, setEvLoc] = useState('Evidence Locker HSPD');
  const [evUrl, setEvUrl] = useState('');
  const [evFileName, setEvFileName] = useState('');
  const [evFileSize, setEvFileSize] = useState('');
  const [isUploadingEvidenceFile, setIsUploadingEvidenceFile] = useState(false);
  const [evidenceMode, setEvidenceMode] = useState<'device' | 'url'>('device');

  // Preview Lightbox
  const [lightboxUrl, setLightboxUrl] = useState<{ url: string; title: string } | null>(null);

  // Timeline State
  const [timelineDesc, setTimelineDesc] = useState('');

  // Refs for Device File Pickers
  const suspectFileRef = useRef<HTMLInputElement>(null);
  const evidenceFileRef = useRef<HTMLInputElement>(null);

  // Filtered cases
  const filteredCases = useMemo(() => {
    return cases.filter(c => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        c.title.toLowerCase().includes(q) || 
        c.caseNumber.toLowerCase().includes(q) ||
        c.leadDetective.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) ||
        c.suspects.some(s => s.name.toLowerCase().includes(q) || (s.alias && s.alias.toLowerCase().includes(q)) || (s.customRoleTitle && s.customRoleTitle.toLowerCase().includes(q)));
      
      const matchStatus = selectedStatus === 'ALL' || c.status === selectedStatus;
      const matchPriority = selectedPriority === 'ALL' || c.priority === selectedPriority;

      return matchSearch && matchStatus && matchPriority;
    });
  }, [cases, searchQuery, selectedStatus, selectedPriority]);

  // Hierarchy role info helper
  const getRoleConfig = (role?: SyndicateRole, level?: number) => {
    const finalRole = role || (level === 1 ? 'BOSS' : level === 2 ? 'UNDERBOSS' : level === 3 ? 'CAPTAIN' : level === 4 ? 'SOLDIER' : 'ASSOCIATE');
    switch (finalRole) {
      case 'BOSS':
        return {
          title: 'Atasan Tertinggi / Boss (Kingpin)',
          short: 'BOSS / KINGPIN',
          level: 1,
          icon: Crown,
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/60',
          cardBorder: 'border-amber-500/80 bg-gradient-to-b from-amber-950/30 to-[#0D1117]',
          glow: 'shadow-amber-500/20'
        };
      case 'UNDERBOSS':
        return {
          title: 'Wakil Ketua / Underboss / Penasihat',
          short: 'UNDERBOSS',
          level: 2,
          icon: Shield,
          badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/60',
          cardBorder: 'border-purple-600/70 bg-[#0D1117]',
          glow: 'shadow-purple-500/20'
        };
      case 'CAPTAIN':
        return {
          title: 'Letnan / Captain / Koordinator Lapangan',
          short: 'CAPTAIN / LETNAN',
          level: 3,
          icon: Star,
          badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/60',
          cardBorder: 'border-blue-600/70 bg-[#0D1117]',
          glow: 'shadow-blue-500/20'
        };
      case 'SOLDIER':
        return {
          title: 'Anggota Inti / Soldier / Eksekutor / Kurir',
          short: 'SOLDIER / ANGGOTA',
          level: 4,
          icon: Target,
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60',
          cardBorder: 'border-emerald-600/60 bg-[#0D1117]',
          glow: 'shadow-emerald-500/20'
        };
      case 'ASSOCIATE':
      default:
        return {
          title: 'Informan / Associate / Binaan / Street Hustler',
          short: 'INFORMAN / ASOSIASI',
          level: 5,
          icon: Eye,
          badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60',
          cardBorder: 'border-gray-700 bg-[#0D1117]',
          glow: 'shadow-gray-500/10'
        };
    }
  };

  const getSuspectStatusBadge = (status: SuspectStatus) => {
    switch (status) {
      case 'WARRANT_ACTIVE':
        return <span className="bg-rose-950 text-rose-300 border border-rose-700 px-1.5 py-0.5 rounded font-bold animate-pulse text-[9px]">🔴 BURON / DPO</span>;
      case 'SUSPECT':
        return <span className="bg-amber-950 text-amber-300 border border-amber-700 px-1.5 py-0.5 rounded text-[9px]">🟡 TERSANGKA</span>;
      case 'ARRESTED':
        return <span className="bg-emerald-950 text-emerald-300 border border-emerald-700 px-1.5 py-0.5 rounded font-bold text-[9px]">🟢 TERTANGKAP (IN JAIL)</span>;
      case 'DECEASED':
        return <span className="bg-neutral-900 text-neutral-400 border border-neutral-700 px-1.5 py-0.5 rounded text-[9px]">💀 TEWAS</span>;
      case 'CLEARED':
        return <span className="bg-blue-950 text-blue-300 border border-blue-700 px-1.5 py-0.5 rounded text-[9px]">🕊️ BEBAS / DICABUT</span>;
      case 'PERSON_OF_INTEREST':
      default:
        return <span className="bg-gray-800 text-gray-300 border border-gray-700 px-1.5 py-0.5 rounded text-[9px]">⚪ SAKSI / POI</span>;
    }
  };

  // Handle Mugshot file upload from device folder
  const handleMugshotDeviceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith('image/')) {
      alert('Silakan pilih file gambar (JPG, PNG, WEBP) untuk foto tersangka.');
      return;
    }
    setIsUploadingMugshot(true);
    try {
      const compressed = await processAndCompressImage(file, 800, 800, 0.85);
      setSuspMugshot(compressed.dataUrl);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploadingMugshot(false);
      e.target.value = '';
    }
  };

  // Handle Evidence file upload from device folder
  const handleEvidenceDeviceUpload = async (e: React.ChangeEvent<HTMLInputElement> | { target: { files: FileList | null } }) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    setIsUploadingEvidenceFile(true);

    const sizeFormatted = file.size > 1024 * 1024 
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
      : `${Math.round(file.size / 1024)} KB`;

    setEvFileName(file.name);
    setEvFileSize(sizeFormatted);
    if (!evTitle) {
      setEvTitle(file.name.replace(/\.[^/.]+$/, ''));
    }

    try {
      if (file.type.startsWith('image/')) {
        const compressed = await processAndCompressImage(file, 1400, 1400, 0.85);
        setEvUrl(compressed.dataUrl);
      } else {
        // For other files (documents/audio), read as Data URL
        const reader = new FileReader();
        reader.onload = (loadEv) => {
          if (loadEv.target?.result) {
            setEvUrl(loadEv.target.result as string);
          }
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploadingEvidenceFile(false);
    }
  };

  // Handle create new case
  const handleCreateNewCaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const caseNum = `HSPD-DB-26-${String(cases.length + 1).padStart(3, '0')}`;
    const newCaseItem: DetectiveCase = {
      id: `CASE-${Date.now()}`,
      caseNumber: caseNum,
      title: newTitle.trim(),
      summary: newSummary.trim() || 'Penyelidikan kasus baru dibuka.',
      leadDetective: currentOfficer.name,
      leadDetectiveBadge: currentOfficer.badge,
      assistingDetectives: [],
      division: currentOfficer.division || 'Detective Bureau / CID',
      status: 'UNDER_INVESTIGATION',
      priority: newPriority,
      incidentDate: newIncidentDate,
      location: newLocation.trim() || 'Los Santos Area',
      suspects: [],
      evidences: [],
      timeline: [
        {
          id: `tl-${Date.now()}`,
          timestamp: Date.now(),
          dateFormatted: new Date().toISOString().replace('T', ' ').substring(0, 16),
          officer: `${currentOfficer.name} (${currentOfficer.badge})`,
          description: `Kasus dibuka secara resmi oleh ${currentOfficer.name}.`
        }
      ],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    onCreateCase(newCaseItem);
    setSelectedCase(newCaseItem);
    setIsCreatingModal(false);
    setNewTitle('');
    setNewSummary('');
    setNewLocation('');

    const cfg = getSavedDetectiveWebhookConfig();
    if (cfg.webhookUrl && cfg.autoSendOnSave) {
      sendDetectiveCaseToDiscord(newCaseItem, 'CREATED', currentOfficer).then(res => {
        setDiscordNotice(res);
        setTimeout(() => setDiscordNotice(null), 4000);
      }).catch(() => {});
    }
  };

  // Open modal for add or edit suspect
  const handleOpenSuspectModal = (suspectToEdit?: CaseSuspect) => {
    if (suspectToEdit) {
      setEditingSuspectId(suspectToEdit.id);
      setSuspName(suspectToEdit.name);
      setSuspAlias(suspectToEdit.alias || '');
      setSuspGang(suspectToEdit.gangAffiliation || '');
      setSuspRole(suspectToEdit.role || 'SOLDIER');
      setSuspCustomTitle(suspectToEdit.customRoleTitle || '');
      setSuspParentId(suspectToEdit.parentId || '');
      setSuspStatus(suspectToEdit.status || 'SUSPECT');
      setSuspMugshot(suspectToEdit.mugshotUrl || '');
      setSuspPhone(suspectToEdit.phone || '');
      setSuspBounty(suspectToEdit.bountyReward ? String(suspectToEdit.bountyReward) : '');
      setSuspNotes(suspectToEdit.notes || '');
      setSuspCharges(suspectToEdit.charges ? suspectToEdit.charges.join(', ') : '');
    } else {
      setEditingSuspectId(null);
      setSuspName('');
      setSuspAlias('');
      setSuspGang(selectedCase?.suspects[0]?.gangAffiliation || '');
      setSuspRole('SOLDIER');
      setSuspCustomTitle('');
      setSuspParentId(selectedCase?.suspects[0]?.id || '');
      setSuspStatus('SUSPECT');
      setSuspMugshot('');
      setSuspPhone('');
      setSuspBounty('');
      setSuspNotes('');
      setSuspCharges('');
    }
    setIsSuspectModalOpen(true);
  };

  // Save suspect (Add or Edit) in Crime Family Tree
  const handleSaveSuspect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase || !suspName.trim()) return;

    const roleConfig = getRoleConfig(suspRole);
    const parsedBounty = suspBounty ? parseInt(suspBounty.replace(/[^0-9]/g, ''), 10) : undefined;
    const parsedCharges = suspCharges ? suspCharges.split(',').map(s => s.trim()).filter(Boolean) : undefined;

    let updatedSuspects: CaseSuspect[];

    if (editingSuspectId) {
      updatedSuspects = selectedCase.suspects.map(s => {
        if (s.id === editingSuspectId) {
          return {
            ...s,
            name: suspName.trim(),
            alias: suspAlias.trim() || undefined,
            gangAffiliation: suspGang.trim() || undefined,
            role: suspRole,
            customRoleTitle: suspCustomTitle.trim() || undefined,
            hierarchyLevel: roleConfig.level,
            parentId: suspParentId || undefined,
            status: suspStatus,
            mugshotUrl: suspMugshot.trim() || undefined,
            phone: suspPhone.trim() || undefined,
            bountyReward: parsedBounty,
            charges: parsedCharges,
            notes: suspNotes.trim() || undefined
          };
        }
        return s;
      });
    } else {
      const newSusp: CaseSuspect = {
        id: `susp-${Date.now()}`,
        name: suspName.trim(),
        alias: suspAlias.trim() || undefined,
        gangAffiliation: suspGang.trim() || 'Organized Crime Group',
        role: suspRole,
        customRoleTitle: suspCustomTitle.trim() || undefined,
        hierarchyLevel: roleConfig.level,
        parentId: suspParentId || undefined,
        status: suspStatus,
        mugshotUrl: suspMugshot.trim() || undefined,
        phone: suspPhone.trim() || undefined,
        bountyReward: parsedBounty,
        charges: parsedCharges,
        notes: suspNotes.trim() || undefined
      };
      updatedSuspects = [...selectedCase.suspects, newSusp];
    }

    const updated: DetectiveCase = {
      ...selectedCase,
      suspects: updatedSuspects,
      timeline: [
        ...selectedCase.timeline,
        {
          id: `tl-${Date.now()}`,
          timestamp: Date.now(),
          dateFormatted: new Date().toISOString().replace('T', ' ').substring(0, 16),
          officer: `${currentOfficer.name} (${currentOfficer.badge})`,
          description: editingSuspectId 
            ? `Memperbarui profil hirarki tersangka: ${suspName} (${roleConfig.short})`
            : `Menambahkan anggota/target sindikat baru: ${suspName} [Tingkat: ${roleConfig.short}]`
        }
      ],
      updatedAt: Date.now()
    };

    onSaveCase(updated);
    setSelectedCase(updated);
    setIsSuspectModalOpen(false);
  };

  // Delete suspect
  const handleDeleteSuspect = (suspectId: string, suspectName: string) => {
    if (!selectedCase) return;
    if (!window.confirm(`Hapus "${suspectName}" dari bagan sindikat kasus ini?`)) return;

    // Reset parentId of subordinates if any
    const updatedSuspects = selectedCase.suspects
      .filter(s => s.id !== suspectId)
      .map(s => s.parentId === suspectId ? { ...s, parentId: undefined } : s);

    const updated: DetectiveCase = {
      ...selectedCase,
      suspects: updatedSuspects,
      timeline: [
        ...selectedCase.timeline,
        {
          id: `tl-${Date.now()}`,
          timestamp: Date.now(),
          dateFormatted: new Date().toISOString().replace('T', ' ').substring(0, 16),
          officer: `${currentOfficer.name} (${currentOfficer.badge})`,
          description: `Menghapus tersangka ${suspectName} dari berkas investigasi.`
        }
      ],
      updatedAt: Date.now()
    };

    onSaveCase(updated);
    setSelectedCase(updated);
  };

  // Quick Status change for suspect
  const handleQuickSuspectStatusChange = (suspectId: string, newStatus: SuspectStatus) => {
    if (!selectedCase) return;
    const target = selectedCase.suspects.find(s => s.id === suspectId);
    if (!target) return;

    const updatedSuspects = selectedCase.suspects.map(s => s.id === suspectId ? { ...s, status: newStatus } : s);
    const updated: DetectiveCase = {
      ...selectedCase,
      suspects: updatedSuspects,
      timeline: [
        ...selectedCase.timeline,
        {
          id: `tl-${Date.now()}`,
          timestamp: Date.now(),
          dateFormatted: new Date().toISOString().replace('T', ' ').substring(0, 16),
          officer: `${currentOfficer.name} (${currentOfficer.badge})`,
          description: `Memperbarui status tersangka ${target.name} menjadi [${newStatus}]`
        }
      ],
      updatedAt: Date.now()
    };
    onSaveCase(updated);
    setSelectedCase(updated);
  };

  // Add evidence to selected case
  const handleAddEvidenceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase || !evTitle.trim()) return;

    const newEv: CaseEvidence = {
      id: `ev-${Date.now()}`,
      type: evType,
      title: evTitle.trim(),
      description: evDesc.trim() || 'Barang bukti diamankan dari TKP / Perangkat.',
      collectedBy: `${currentOfficer.name} (${currentOfficer.badge})`,
      collectedDate: new Date().toISOString().split('T')[0],
      imageUrl: evUrl.trim() || undefined,
      fileName: evFileName.trim() || undefined,
      fileSize: evFileSize.trim() || undefined,
      storageLocation: evLoc.trim() || 'Evidence Locker HSPD'
    };

    const updated: DetectiveCase = {
      ...selectedCase,
      evidences: [...selectedCase.evidences, newEv],
      timeline: [
        ...selectedCase.timeline,
        {
          id: `tl-${Date.now()}`,
          timestamp: Date.now(),
          dateFormatted: new Date().toISOString().replace('T', ' ').substring(0, 16),
          officer: `${currentOfficer.name} (${currentOfficer.badge})`,
          description: `Mengamankan barang bukti: [${evType}] ${evTitle} ${evFileName ? `(${evFileName})` : ''}`
        }
      ],
      updatedAt: Date.now()
    };

    onSaveCase(updated);
    setSelectedCase(updated);
    setIsAddingEvidence(false);
    setEvTitle('');
    setEvDesc('');
    setEvUrl('');
    setEvFileName('');
    setEvFileSize('');

    const cfg = getSavedDetectiveWebhookConfig();
    if (cfg.webhookUrl && cfg.autoSendOnSave) {
      sendDetectiveCaseToDiscord(updated, 'EVIDENCE_ADDED', currentOfficer).catch(() => {});
    }
  };

  // Delete evidence
  const handleDeleteEvidence = (evId: string, evTitle: string) => {
    if (!selectedCase) return;
    if (!window.confirm(`Hapus barang bukti "${evTitle}" dari berkas perkara?`)) return;

    const updated: DetectiveCase = {
      ...selectedCase,
      evidences: selectedCase.evidences.filter(e => e.id !== evId),
      timeline: [
        ...selectedCase.timeline,
        {
          id: `tl-${Date.now()}`,
          timestamp: Date.now(),
          dateFormatted: new Date().toISOString().replace('T', ' ').substring(0, 16),
          officer: `${currentOfficer.name} (${currentOfficer.badge})`,
          description: `Menghapus catatan barang bukti: ${evTitle}`
        }
      ],
      updatedAt: Date.now()
    };

    onSaveCase(updated);
    setSelectedCase(updated);
  };

  // Add timeline note
  const handleAddTimelineLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase || !timelineDesc.trim()) return;

    const updated: DetectiveCase = {
      ...selectedCase,
      timeline: [
        ...selectedCase.timeline,
        {
          id: `tl-${Date.now()}`,
          timestamp: Date.now(),
          dateFormatted: new Date().toISOString().replace('T', ' ').substring(0, 16),
          officer: `${currentOfficer.name} (${currentOfficer.badge})`,
          description: timelineDesc.trim()
        }
      ],
      updatedAt: Date.now()
    };

    onSaveCase(updated);
    setSelectedCase(updated);
    setTimelineDesc('');
  };

  // Change Case Status
  const handleStatusChange = (newStatus: CaseStatus) => {
    if (!selectedCase) return;
    const updated: DetectiveCase = {
      ...selectedCase,
      status: newStatus,
      timeline: [
        ...selectedCase.timeline,
        {
          id: `tl-${Date.now()}`,
          timestamp: Date.now(),
          dateFormatted: new Date().toISOString().replace('T', ' ').substring(0, 16),
          officer: `${currentOfficer.name} (${currentOfficer.badge})`,
          description: `Mengubah status penyelidikan menjadi [${newStatus}]`
        }
      ],
      updatedAt: Date.now()
    };
    onSaveCase(updated);
    setSelectedCase(updated);

    const cfg = getSavedDetectiveWebhookConfig();
    if (cfg.webhookUrl && cfg.autoSendOnSave) {
      const evType = newStatus === 'SOLVED_CLOSED' ? 'SOLVED' : newStatus === 'WARRANT_ISSUED' ? 'WARRANT_ISSUED' : 'UPDATED';
      sendDetectiveCaseToDiscord(updated, evType, currentOfficer).then(res => {
        setDiscordNotice(res);
        setTimeout(() => setDiscordNotice(null), 4000);
      }).catch(() => {});
    }
  };

  // Toggle Warrant Issued
  const handleToggleWarrant = () => {
    if (!selectedCase) return;
    const newWarrantState = !selectedCase.warrantIssued;
    const warrantNum = newWarrantState ? `SW-${new Date().getFullYear().toString().slice(-2)}-${Math.floor(10 + Math.random() * 90)}` : undefined;
    
    const updated: DetectiveCase = {
      ...selectedCase,
      warrantIssued: newWarrantState,
      warrantNumber: warrantNum,
      timeline: [
        ...selectedCase.timeline,
        {
          id: `tl-${Date.now()}`,
          timestamp: Date.now(),
          dateFormatted: new Date().toISOString().replace('T', ' ').substring(0, 16),
          officer: `${currentOfficer.name} (${currentOfficer.badge})`,
          description: newWarrantState 
            ? `Surat Perintah Penggeledahan / Penangkapan resmi diterbitkan: ${warrantNum}`
            : `Surat Perintah dibatalkan/ditutup.`
        }
      ],
      updatedAt: Date.now()
    };
    onSaveCase(updated);
    setSelectedCase(updated);

    const cfg = getSavedDetectiveWebhookConfig();
    if (cfg.webhookUrl && cfg.autoSendOnSave) {
      sendDetectiveCaseToDiscord(updated, newWarrantState ? 'WARRANT_ISSUED' : 'UPDATED', currentOfficer).then(res => {
        setDiscordNotice(res);
        setTimeout(() => setDiscordNotice(null), 4000);
      }).catch(() => {});
    }
  };

  // Manual Send Case to Discord
  const handleManualSendDiscord = async () => {
    if (!selectedCase) return;
    setIsSendingDiscord(true);
    try {
      const res = await sendDetectiveCaseToDiscord(
        selectedCase, 
        selectedCase.warrantIssued ? 'WARRANT_ISSUED' : selectedCase.status === 'SOLVED_CLOSED' ? 'SOLVED' : 'UPDATED',
        currentOfficer
      );
      setDiscordNotice(res);
      setTimeout(() => setDiscordNotice(null), 4000);
    } catch (err: any) {
      setDiscordNotice({
        success: false,
        message: err.message || 'Gagal mengirim berkas kasus ke Discord.'
      });
    } finally {
      setIsSendingDiscord(false);
    }
  };

  const getStatusBadge = (status: CaseStatus) => {
    switch (status) {
      case 'UNDER_INVESTIGATION':
        return <span className="bg-indigo-950 text-indigo-300 border border-indigo-700/60 px-2 py-0.5 rounded font-bold">🔍 UNDER INVESTIGATION</span>;
      case 'WARRANT_ISSUED':
        return <span className="bg-amber-950 text-amber-300 border border-amber-600 px-2 py-0.5 rounded font-bold animate-pulse">⚡ WARRANT ISSUED</span>;
      case 'COLD_CASE':
        return <span className="bg-gray-800 text-gray-400 border border-gray-700 px-2 py-0.5 rounded">❄️ COLD CASE</span>;
      case 'SOLVED_CLOSED':
        return <span className="bg-emerald-950 text-emerald-300 border border-emerald-700/60 px-2 py-0.5 rounded font-bold">✅ SOLVED / CLOSED</span>;
      default:
        return <span className="bg-blue-950 text-blue-300 border border-blue-700/60 px-2 py-0.5 rounded">📂 OPEN</span>;
    }
  };

  const getPriorityBadge = (priority: CasePriority) => {
    switch (priority) {
      case 'CRITICAL':
        return <span className="bg-red-950 text-red-300 border border-red-700 px-1.5 py-0.5 rounded font-bold">🔴 CRITICAL</span>;
      case 'HIGH':
        return <span className="bg-orange-950 text-orange-300 border border-orange-700 px-1.5 py-0.5 rounded font-bold">🟠 HIGH</span>;
      case 'MEDIUM':
        return <span className="bg-yellow-950 text-yellow-300 border border-yellow-800 px-1.5 py-0.5 rounded">🟡 MEDIUM</span>;
      default:
        return <span className="bg-gray-800 text-gray-400 border border-gray-700 px-1.5 py-0.5 rounded">⚪ LOW</span>;
    }
  };

  // Group suspects by hierarchy tiers
  const groupedTiers = useMemo(() => {
    if (!selectedCase) return { tier1: [], tier2: [], tier3: [], tier4: [], tier5: [] };
    const tier1 = selectedCase.suspects.filter(s => (s.role === 'BOSS' || s.hierarchyLevel === 1));
    const tier2 = selectedCase.suspects.filter(s => (s.role === 'UNDERBOSS' || s.hierarchyLevel === 2));
    const tier3 = selectedCase.suspects.filter(s => (s.role === 'CAPTAIN' || s.hierarchyLevel === 3));
    const tier4 = selectedCase.suspects.filter(s => (s.role === 'SOLDIER' || s.hierarchyLevel === 4));
    const tier5 = selectedCase.suspects.filter(s => (s.role === 'ASSOCIATE' || s.hierarchyLevel === 5 || (!s.role && !s.hierarchyLevel)));
    return { tier1, tier2, tier3, tier4, tier5 };
  }, [selectedCase]);

  return (
    <div className="space-y-4 font-mono text-xs text-gray-200">
      {/* Top Action Header */}
      <div className="bg-[#161B22] border border-indigo-900/60 rounded-xl p-4 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-950 border border-indigo-700/80 flex items-center justify-center text-indigo-400 shrink-0">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-gray-100 font-sans tracking-tight">
                DETECTIVE BUREAU & CASE MANAGEMENT
              </h2>
              <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800 px-1.5 py-0.5 rounded font-bold">
                SA-MP CID HUD
              </span>
            </div>
            <p className="text-[11px] text-gray-400">
              Sistem manajemen berkas investigasi kriminal, struktur pohon keluarga sindikat kejahatan, dan upload barang bukti device.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsCreatingModal(true)}
          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition flex items-center gap-1.5 shadow-md shadow-indigo-600/30 text-xs shrink-0 font-sans"
        >
          <Plus className="w-4 h-4" />
          <span>BUKA KASUS INVESTIGASI BARU</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#11141A] border border-gray-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari judul kasus, nomor berkas, nama tersangka, alias, atau lokasi..."
              className="w-full pl-9 pr-3 py-1.5 bg-[#0D1117] border border-gray-700 focus:border-indigo-500 rounded-lg text-xs text-gray-100 placeholder:text-gray-600 outline-none transition"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 bg-[#0D1117] border border-gray-700 rounded-lg text-xs text-gray-200 outline-none"
          >
            <option value="ALL">Semua Status Kasus</option>
            <option value="UNDER_INVESTIGATION">Under Investigation</option>
            <option value="WARRANT_ISSUED">Warrant Issued</option>
            <option value="SOLVED_CLOSED">Solved / Closed</option>
            <option value="COLD_CASE">Cold Case</option>
          </select>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-2.5 py-1.5 bg-[#0D1117] border border-gray-700 rounded-lg text-xs text-gray-200 outline-none"
          >
            <option value="ALL">Semua Prioritas</option>
            <option value="CRITICAL">🔴 Critical</option>
            <option value="HIGH">🟠 High</option>
            <option value="MEDIUM">🟡 Medium</option>
            <option value="LOW">⚪ Low</option>
          </select>
        </div>
      </div>

      {/* Main Split Interface: Left = Case List, Right = Interactive Case Board */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* ================= LEFT COLUMN: CASE LIST (4 Cols) ================= */}
        <div className="lg:col-span-4 space-y-2.5">
          <div className="text-[11px] font-bold text-gray-400 uppercase flex items-center justify-between px-1">
            <span>Daftar Berkas Penyelidikan ({filteredCases.length})</span>
            <span className="text-indigo-400">Pilih untuk Buka Berkas</span>
          </div>

          <div className="space-y-2 max-h-[750px] overflow-y-auto pr-1">
            {filteredCases.length === 0 ? (
              <div className="bg-[#161B22] border border-gray-800 rounded-xl p-6 text-center text-gray-500">
                Tidak ada kasus investigasi yang sesuai kriteria pencarian.
              </div>
            ) : (
              filteredCases.map(c => {
                const isSelected = selectedCase?.id === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedCase(c);
                      setActiveTab('overview');
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition flex flex-col gap-2 ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500/80 shadow-lg shadow-indigo-950/30'
                        : 'bg-[#161B22] border-gray-800 hover:border-gray-700 hover:bg-[#1c222b]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 w-full">
                      <span className="text-[10px] font-bold font-mono text-indigo-400 bg-indigo-950 px-1.5 py-0.5 rounded border border-indigo-800/60">
                        {c.caseNumber}
                      </span>
                      {getPriorityBadge(c.priority)}
                    </div>

                    <div>
                      <h4 className="font-bold text-xs text-gray-100 line-clamp-1 font-sans">
                        {c.title}
                      </h4>
                      <p className="text-[10px] text-gray-400 line-clamp-2 mt-0.5">
                        {c.summary}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1 border-t border-gray-800/60 w-full">
                      <span className="flex items-center gap-1 text-gray-400">
                        <User className="w-3 h-3 text-amber-400" />
                        {c.leadDetective} ({c.leadDetectiveBadge})
                      </span>
                      <span className="text-amber-400/90 font-bold">{c.suspects.length} Target & Anggota</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ================= RIGHT COLUMN: INTERACTIVE CASEBOARD (8 Cols) ================= */}
        <div className="lg:col-span-8">
          {selectedCase ? (
            <div className="bg-[#161B22] border border-indigo-900/60 rounded-xl shadow-2xl overflow-hidden flex flex-col">
              {/* Caseboard Header */}
              <div className="bg-[#0D1117] border-b border-gray-800 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold font-mono bg-indigo-900/60 text-indigo-300 px-2 py-0.5 rounded border border-indigo-700">
                      {selectedCase.caseNumber}
                    </span>
                    {getStatusBadge(selectedCase.status)}
                    {getPriorityBadge(selectedCase.priority)}
                    {selectedCase.warrantIssued && (
                      <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-600 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                        <FileCheck className="w-3 h-3 text-amber-400" />
                        {selectedCase.warrantNumber}
                      </span>
                    )}
                  </div>

                  {/* Actions for High Command & Lead Detective */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Cetak Berkas Kasus Dokumen (PNG/JPG/PDF) */}
                    <button
                      type="button"
                      onClick={() => setShowDossierModal(true)}
                      className="px-2.5 py-1 rounded text-[11px] font-bold border border-emerald-700 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 transition flex items-center gap-1 shadow-sm shadow-emerald-950"
                      title="Cetak dan ekspor Berkas Kasus & Bagan Hierarki Tersangka ke format PNG / JPG"
                    >
                      <FileText className="w-3 h-3 text-emerald-400" />
                      <span>Cetak Berkas (PNG/JPG)</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleManualSendDiscord}
                      disabled={isSendingDiscord}
                      className="px-2.5 py-1 rounded text-[11px] font-bold border border-purple-700 bg-purple-950/60 hover:bg-purple-900 text-purple-300 transition flex items-center gap-1 disabled:opacity-50"
                      title="Kirim atau sinkronkan data kasus ini ke Discord Webhook CID"
                    >
                      {isSendingDiscord ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <Send className="w-3 h-3" />
                      )}
                      <span>Kirim ke Discord</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleToggleWarrant}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold border transition flex items-center gap-1 ${
                        selectedCase.warrantIssued
                          ? 'bg-rose-950 text-rose-300 border-rose-700 hover:bg-rose-900'
                          : 'bg-amber-950 text-amber-300 border-amber-600 hover:bg-amber-900'
                      }`}
                      title="Terbitkan / Cabut Surat Perintah Penangkapan & Penggeledahan (Warrant)"
                    >
                      <ShieldAlert className="w-3 h-3" />
                      <span>{selectedCase.warrantIssued ? 'Cabut Warrant' : 'Terbitkan Warrant'}</span>
                    </button>

                    {isHighRank && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Hapus kasus "${selectedCase.title}" dari database?`)) {
                            onDeleteCase(selectedCase.id);
                            setSelectedCase(null);
                          }
                        }}
                        className="p-1.5 text-gray-500 hover:text-rose-400 rounded transition"
                        title="Hapus Kasus (High Command Only)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {discordNotice && (
                  <div className={`p-2 rounded text-xs flex items-center gap-2 border animate-in fade-in ${
                    discordNotice.success 
                      ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300' 
                      : 'bg-rose-950/80 border-rose-700 text-rose-300'
                  }`}>
                    {discordNotice.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    )}
                    <span>{discordNotice.message}</span>
                  </div>
                )}

                <div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-100 font-sans">
                    {selectedCase.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-400 mt-1">
                    <span className="flex items-center gap-1 text-gray-300">
                      <User className="w-3.5 h-3.5 text-amber-400" />
                      Lead: <strong className="text-gray-100">{selectedCase.leadDetective}</strong> ({selectedCase.leadDetectiveBadge})
                    </span>
                    <span className="text-gray-600">•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-400" />
                      {selectedCase.location}
                    </span>
                    <span className="text-gray-600">•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-blue-400" />
                      TKP: {selectedCase.incidentDate}
                    </span>
                  </div>
                </div>

                {/* Sub-tabs within case */}
                <div className="flex items-center gap-1 border-t border-gray-800 pt-2 text-xs overflow-x-auto">
                  {[
                    { id: 'overview', label: 'Ringkasan & Status', icon: FolderOpen },
                    { id: 'suspects', label: `Pohon Sindikat & Target (${selectedCase.suspects.length})`, icon: GitBranch },
                    { id: 'evidences', label: `Barang Bukti & File (${selectedCase.evidences.length})`, icon: FileText },
                    { id: 'timeline', label: `Linimasa Progres (${selectedCase.timeline.length})`, icon: Clock },
                  ].map(t => {
                    const Icon = t.icon;
                    const isActive = activeTab === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setActiveTab(t.id as any)}
                        className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition whitespace-nowrap ${
                          isActive
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Caseboard Body Content */}
              <div className="p-4 sm:p-5 space-y-4 min-h-[420px]">
                {/* 1. TAB OVERVIEW */}
                {activeTab === 'overview' && (
                  <div className="space-y-4">
                    <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-4 space-y-2">
                      <div className="text-[11px] font-bold text-indigo-400 uppercase">
                        Ringkasan Perkara / Kronologi Awal Penyelidikan:
                      </div>
                      <p className="text-xs text-gray-200 leading-relaxed whitespace-pre-wrap font-sans">
                        {selectedCase.summary}
                      </p>
                    </div>

                    {/* Status Changer Widget */}
                    <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-4 space-y-2">
                      <div className="text-[11px] font-bold text-gray-300 uppercase flex items-center gap-1.5">
                        <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                        Perbarui Status Investigasi Kasus Ini:
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                        {[
                          { id: 'UNDER_INVESTIGATION', label: 'Under Investigation', color: 'border-indigo-600 hover:bg-indigo-950' },
                          { id: 'WARRANT_ISSUED', label: 'Warrant Issued', color: 'border-amber-600 hover:bg-amber-950' },
                          { id: 'SOLVED_CLOSED', label: 'Solved / Closed', color: 'border-emerald-600 hover:bg-emerald-950' },
                          { id: 'COLD_CASE', label: 'Cold Case', color: 'border-gray-600 hover:bg-gray-800' },
                        ].map(st => (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => handleStatusChange(st.id as CaseStatus)}
                            className={`px-2.5 py-2 rounded-lg border text-center font-bold transition text-xs ${st.color} ${
                              selectedCase.status === st.id ? 'bg-indigo-900/60 ring-2 ring-indigo-400 text-white' : 'text-gray-400'
                            }`}
                          >
                            {st.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-3 text-center">
                        <div className="text-[10px] text-gray-500 uppercase">Target & Hirarki Sindikat</div>
                        <div className="text-lg font-bold text-amber-400">{selectedCase.suspects.length} Tersangka</div>
                      </div>
                      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-3 text-center">
                        <div className="text-[10px] text-gray-500 uppercase">Barang Bukti & File Disita</div>
                        <div className="text-lg font-bold text-blue-400">{selectedCase.evidences.length} Item</div>
                      </div>
                      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-3 text-center">
                        <div className="text-[10px] text-gray-500 uppercase">Log Perkembangan Kasus</div>
                        <div className="text-lg font-bold text-emerald-400">{selectedCase.timeline.length} Entri</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. TAB SUSPECTS: POHON KELUARGA / HIRARKI SINDIKAT KEJAHATAN */}
                {activeTab === 'suspects' && (
                  <div className="space-y-4">
                    {/* Header with View Toggle & Add Button */}
                    <div className="flex flex-wrap items-center justify-between gap-2 bg-[#0D1117] p-3 rounded-xl border border-gray-800">
                      <div>
                        <div className="text-xs font-bold text-gray-200 uppercase flex items-center gap-1.5">
                          <GitBranch className="w-4 h-4 text-amber-400" />
                          <span>Pohon Hirarki Organisasi & Sindikat Kriminal</span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          Struktur keluarga kejahatan dari Pimpinan Tertinggi (Boss) hingga Anggota & Informan.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* View Mode Switcher */}
                        <div className="flex items-center bg-[#161B22] p-0.5 rounded-lg border border-gray-700 text-[10px]">
                          <button
                            type="button"
                            onClick={() => setSuspectViewMode('tree')}
                            className={`px-2.5 py-1 rounded font-bold flex items-center gap-1 transition ${
                              suspectViewMode === 'tree' ? 'bg-amber-600 text-black shadow-sm' : 'text-gray-400 hover:text-gray-200'
                            }`}
                          >
                            <GitBranch className="w-3 h-3" />
                            <span>Bagan Pohon (Tree)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSuspectViewMode('tiers')}
                            className={`px-2.5 py-1 rounded font-bold flex items-center gap-1 transition ${
                              suspectViewMode === 'tiers' ? 'bg-amber-600 text-black shadow-sm' : 'text-gray-400 hover:text-gray-200'
                            }`}
                          >
                            <Users className="w-3 h-3" />
                            <span>Daftar Tingkatan (Tiers)</span>
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleOpenSuspectModal()}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-black font-bold rounded-lg text-xs flex items-center gap-1.5 transition shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Tambah Anggota / Target</span>
                        </button>
                      </div>
                    </div>

                    {selectedCase.suspects.length === 0 ? (
                      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-8 text-center text-gray-500 space-y-2">
                        <Users className="w-10 h-10 mx-auto text-gray-600" />
                        <div className="text-xs font-bold text-gray-400">Belum Ada Struktur Sindikat / Tersangka</div>
                        <p className="text-[11px] max-w-md mx-auto">
                          Mulai bangun pohon organisasi kejahatan dengan menambahkan Boss (Atasan Tertinggi), Wakil, Letnan, dan Anggota sindikat.
                        </p>
                        <button
                          type="button"
                          onClick={() => handleOpenSuspectModal()}
                          className="mt-2 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-black font-bold rounded text-xs inline-flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Tambah Target Pertama</span>
                        </button>
                      </div>
                    ) : (
                      /* Render Tiers: Boss -> Underboss -> Captains -> Soldiers -> Associates */
                      <div className="space-y-6">
                        {[
                          { tierKey: 'tier1', label: '👑 TIER 1: ATASAN TERTINGGI / BOSS / KINGPIN', data: groupedTiers.tier1, color: 'text-amber-400 border-amber-600/40 bg-amber-950/20' },
                          { tierKey: 'tier2', label: '🛡️ TIER 2: WAKIL KETUA / UNDERBOSS / PENASIHAT', data: groupedTiers.tier2, color: 'text-purple-400 border-purple-600/40 bg-purple-950/20' },
                          { tierKey: 'tier3', label: '⭐ TIER 3: LETNAN / CAPTAIN / KOORDINATOR LAPANGAN', data: groupedTiers.tier3, color: 'text-blue-400 border-blue-600/40 bg-blue-950/20' },
                          { tierKey: 'tier4', label: '🔫 TIER 4: ANGGOTA INTI / SOLDIER / EKSEKUTOR / KURIR', data: groupedTiers.tier4, color: 'text-emerald-400 border-emerald-600/40 bg-emerald-950/20' },
                          { tierKey: 'tier5', label: '👁️ TIER 5: INFORMAN / ASOSIASI / BINAAN / STREET HUSTLER', data: groupedTiers.tier5, color: 'text-cyan-400 border-cyan-600/40 bg-cyan-950/20' },
                        ].map((tierGroup, tIdx) => {
                          if (tierGroup.data.length === 0) return null;
                          return (
                            <div key={tierGroup.tierKey} className="space-y-2.5">
                              <div className={`px-3 py-1.5 rounded-lg border flex items-center justify-between text-[11px] font-bold uppercase ${tierGroup.color}`}>
                                <span>{tierGroup.label} ({tierGroup.data.length})</span>
                                <span className="text-[10px] opacity-75 font-normal">Tingkat Hirarki #{tIdx + 1}</span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {tierGroup.data.map(suspect => {
                                  const roleCfg = getRoleConfig(suspect.role, suspect.hierarchyLevel);
                                  const RoleIcon = roleCfg.icon;
                                  const parentSuspect = suspect.parentId ? selectedCase.suspects.find(s => s.id === suspect.parentId) : null;
                                  const subordinatesCount = selectedCase.suspects.filter(s => s.parentId === suspect.id).length;

                                  return (
                                    <div 
                                      key={suspect.id} 
                                      className={`rounded-xl border p-3.5 space-y-3 transition shadow-lg relative ${roleCfg.cardBorder} hover:border-indigo-500`}
                                    >
                                      {/* Top Row: Mugshot + Name + Status */}
                                      <div className="flex items-start justify-between gap-2.5">
                                        <div className="flex items-start gap-3">
                                          {/* Mugshot Image / Avatar with preview trigger */}
                                          <div 
                                            className="w-12 h-12 rounded-lg bg-black/80 border border-gray-700 overflow-hidden shrink-0 relative group cursor-pointer"
                                            onClick={() => suspect.mugshotUrl && setLightboxUrl({ url: suspect.mugshotUrl, title: `Mugshot: ${suspect.name}` })}
                                          >
                                            {suspect.mugshotUrl ? (
                                              <>
                                                <img 
                                                  src={suspect.mugshotUrl} 
                                                  alt={suspect.name} 
                                                  className="w-full h-full object-cover group-hover:scale-110 transition"
                                                  referrerPolicy="no-referrer"
                                                />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition">
                                                  <ZoomIn className="w-3.5 h-3.5" />
                                                </div>
                                              </>
                                            ) : (
                                              <div className="w-full h-full flex items-center justify-center text-gray-500">
                                                <User className="w-6 h-6" />
                                              </div>
                                            )}
                                          </div>

                                          <div>
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                              <h4 className="font-bold text-xs text-gray-100 font-sans">
                                                {suspect.name}
                                              </h4>
                                              {suspect.alias && (
                                                <span className="text-[11px] text-amber-400 font-bold">
                                                  "{suspect.alias}"
                                                </span>
                                              )}
                                            </div>

                                            <div className="text-[10px] text-gray-400 flex items-center gap-1.5 mt-0.5">
                                              <span className={`px-1.5 py-0.2 rounded font-bold border ${roleCfg.badgeColor} flex items-center gap-1 text-[9px]`}>
                                                <RoleIcon className="w-2.5 h-2.5" />
                                                <span>{suspect.customRoleTitle || roleCfg.short}</span>
                                              </span>
                                            </div>

                                            {suspect.gangAffiliation && (
                                              <div className="text-[10px] text-rose-300/90 font-mono mt-0.5">
                                                🏴 Sindikat: <strong>{suspect.gangAffiliation}</strong>
                                              </div>
                                            )}
                                          </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-1">
                                          {getSuspectStatusBadge(suspect.status)}
                                          {suspect.bountyReward && suspect.bountyReward > 0 && (
                                            <span className="bg-amber-950/80 text-amber-300 border border-amber-600 px-1.5 py-0.2 rounded text-[9px] font-bold flex items-center gap-0.5">
                                              <DollarSign className="w-2.5 h-2.5" />
                                              <span>Bounty: ${suspect.bountyReward.toLocaleString('id-ID')}</span>
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      {/* Hierarchy Connections (Lapor Ke / Subordinates) */}
                                      <div className="bg-black/40 rounded-lg p-2 border border-gray-800/80 flex flex-wrap items-center justify-between gap-1.5 text-[10px]">
                                        <div className="flex items-center gap-1 text-gray-300">
                                          <span className="text-gray-500">⬆️ Atasan / Lapor Ke:</span>
                                          {parentSuspect ? (
                                            <strong className="text-amber-300 font-mono bg-amber-950/50 px-1.5 py-0.2 rounded border border-amber-800/50">
                                              {parentSuspect.name} {parentSuspect.alias ? `("${parentSuspect.alias}")` : ''}
                                            </strong>
                                          ) : (
                                            <span className="text-gray-500 italic">Pimpinan Tertinggi / Mandiri</span>
                                          )}
                                        </div>

                                        {subordinatesCount > 0 && (
                                          <div className="text-emerald-400 font-bold bg-emerald-950/50 px-1.5 py-0.2 rounded border border-emerald-800/50">
                                            ⬇️ {subordinatesCount} Bawahan Langsung
                                          </div>
                                        )}
                                      </div>

                                      {/* Charges and Notes */}
                                      {suspect.charges && suspect.charges.length > 0 && (
                                        <div className="text-[10px] space-y-0.5">
                                          <div className="text-gray-400 font-bold">Pasal / Tuduhan:</div>
                                          <div className="flex flex-wrap gap-1">
                                            {suspect.charges.map((chg, cIdx) => (
                                              <span key={cIdx} className="bg-rose-950/60 text-rose-300 border border-rose-800/60 px-1.5 py-0.2 rounded text-[9px]">
                                                {chg}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {suspect.notes && (
                                        <p className="text-[11px] text-gray-300 bg-[#161B22] p-2 rounded border border-gray-800 font-sans leading-relaxed">
                                          {suspect.notes}
                                        </p>
                                      )}

                                      {/* In-Card Quick Controls */}
                                      <div className="flex items-center justify-between pt-1 border-t border-gray-800/80 text-[10px]">
                                        {/* Status Quick Changer Dropdown */}
                                        <div className="flex items-center gap-1">
                                          <span className="text-gray-500">Status:</span>
                                          <select
                                            value={suspect.status}
                                            onChange={(e) => handleQuickSuspectStatusChange(suspect.id, e.target.value as SuspectStatus)}
                                            className="bg-[#161B22] border border-gray-700 rounded px-1.5 py-0.5 text-[10px] text-gray-200 outline-none"
                                          >
                                            <option value="WARRANT_ACTIVE">🔴 Buron (DPO)</option>
                                            <option value="SUSPECT">🟡 Tersangka</option>
                                            <option value="ARRESTED">🟢 Tertangkap (In Jail)</option>
                                            <option value="PERSON_OF_INTEREST">⚪ Saksi / POI</option>
                                            <option value="DECEASED">💀 Tewas</option>
                                            <option value="CLEARED">🕊️ Bebas</option>
                                          </select>
                                        </div>

                                        <div className="flex items-center gap-1">
                                          <button
                                            type="button"
                                            onClick={() => handleOpenSuspectModal(suspect)}
                                            className="px-2 py-0.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded transition flex items-center gap-1"
                                          >
                                            <Edit3 className="w-3 h-3 text-indigo-400" />
                                            <span>Edit Hirarki</span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteSuspect(suspect.id, suspect.name)}
                                            className="p-1 text-gray-500 hover:text-rose-400 rounded transition"
                                            title="Hapus Tersangka"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. TAB EVIDENCES & DEVICE FILE UPLOAD */}
                {activeTab === 'evidences' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between bg-[#0D1117] p-3 rounded-xl border border-gray-800">
                      <div>
                        <div className="text-xs font-bold text-blue-300 uppercase flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-blue-400" />
                          <span>Barang Bukti, Berkas Forensik & File Device</span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          Unggah foto TKP, dokumen sitaan, atau rekaman CCTV langsung dari folder perangkat komputer/HP Anda.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsAddingEvidence(true)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition shadow-md shadow-blue-600/30"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Sita Barang Bukti / Upload File</span>
                      </button>
                    </div>

                    {/* Hidden Device Evidence File Input */}
                    <input 
                      type="file" 
                      ref={evidenceFileRef}
                      onChange={handleEvidenceDeviceUpload}
                      className="hidden"
                      id="evidence-file-device-picker"
                    />

                    {/* Add Evidence Form */}
                    {isAddingEvidence && (
                      <form onSubmit={handleAddEvidenceSubmit} className="bg-[#0D1117] border border-blue-600/80 rounded-xl p-4 space-y-3.5 shadow-xl animate-in fade-in">
                        <div className="text-xs font-bold text-blue-300 uppercase flex items-center justify-between border-b border-gray-800 pb-2">
                          <span className="flex items-center gap-1.5">
                            <Upload className="w-4 h-4" />
                            <span>Pencatatan & Upload Barang Bukti Baru</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsAddingEvidence(false)}
                            className="text-gray-400 hover:text-gray-200"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Mode Selector: Device File Picker vs Link URL */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setEvidenceMode('device')}
                            className={`px-3 py-1 rounded-lg font-bold text-xs flex items-center gap-1.5 transition ${
                              evidenceMode === 'device' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-gray-200'
                            }`}
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Pilih Berkas Dari Folder Device</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setEvidenceMode('url')}
                            className={`px-3 py-1 rounded-lg font-bold text-xs flex items-center gap-1.5 transition ${
                              evidenceMode === 'url' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-gray-200'
                            }`}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Link URL Gambar</span>
                          </button>
                        </div>

                        {/* File Upload Dropzone / Picker */}
                        {evidenceMode === 'device' ? (
                          <div 
                            onClick={() => evidenceFileRef.current?.click()}
                            className="border-2 border-dashed border-blue-600/60 hover:border-blue-500 bg-[#161B22] hover:bg-blue-950/20 rounded-xl p-4 text-center cursor-pointer transition space-y-2"
                          >
                            {isUploadingEvidenceFile ? (
                              <div className="flex items-center justify-center gap-2 py-3 text-blue-400">
                                <RefreshCw className="w-5 h-5 animate-spin" />
                                <span>Memproses file dari perangkat...</span>
                              </div>
                            ) : evUrl ? (
                              <div className="flex items-center justify-between gap-3 bg-black/40 p-2.5 rounded-lg border border-gray-700">
                                <div className="flex items-center gap-3">
                                  {evUrl.startsWith('data:image') ? (
                                    <img src={evUrl} alt="Preview" className="w-12 h-12 object-cover rounded border border-gray-600" />
                                  ) : (
                                    <div className="w-12 h-12 rounded bg-blue-950 border border-blue-800 flex items-center justify-center text-blue-400">
                                      <FileText className="w-6 h-6" />
                                    </div>
                                  )}
                                  <div className="text-left">
                                    <div className="font-bold text-xs text-gray-100">{evFileName || 'Berkas Terlampir'}</div>
                                    <div className="text-[10px] text-gray-400">{evFileSize || 'Siap Disimpan'}</div>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    evidenceFileRef.current?.click();
                                  }}
                                  className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded text-[10px] font-bold"
                                >
                                  Ganti File
                                </button>
                              </div>
                            ) : (
                              <>
                                <div className="w-10 h-10 rounded-full bg-blue-950 border border-blue-700/80 flex items-center justify-center text-blue-400 mx-auto">
                                  <Upload className="w-5 h-5" />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-gray-100">
                                    Klik untuk Membuka Folder Device & Pilih File Barang Bukti
                                  </p>
                                  <p className="text-[10px] text-gray-400 mt-0.5">
                                    Mendukung Foto TKP, Dokumen PDF, Selongsong Balistik, Rekaman CCTV
                                  </p>
                                </div>
                              </>
                            )}
                          </div>
                        ) : (
                          <div>
                            <label className="text-[10px] text-gray-400 block mb-1">URL Gambar Bukti</label>
                            <input
                              type="url"
                              value={evUrl}
                              onChange={(e) => setEvUrl(e.target.value)}
                              placeholder="https://images.unsplash.com/... atau link imgur"
                              className="w-full px-3 py-1.5 bg-[#161B22] border border-gray-700 rounded text-xs text-gray-100 outline-none"
                            />
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] text-gray-400 block mb-1">Judul / Nama Barang Bukti *</label>
                            <input
                              type="text"
                              value={evTitle}
                              onChange={(e) => setEvTitle(e.target.value)}
                              placeholder="Contoh: Selongsong Peluru 9mm Tokarev"
                              className="w-full px-3 py-1.5 bg-[#161B22] border border-gray-700 rounded text-xs text-gray-100 outline-none"
                              required
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-400 block mb-1">Kategori Forensik</label>
                            <select
                              value={evType}
                              onChange={(e) => setEvType(e.target.value as EvidenceType)}
                              className="w-full px-3 py-1.5 bg-[#161B22] border border-gray-700 rounded text-xs text-gray-100 outline-none"
                            >
                              <option value="BALLISTICS">Balistik & Selongsong Peluru</option>
                              <option value="NARCOTICS">Narkotika & Zat Terlarang</option>
                              <option value="PHOTO">Foto TKP / Dokumentasi</option>
                              <option value="SURVEILLANCE_FOOTAGE">Rekaman CCTV / Dashcam</option>
                              <option value="FINGERPRINT">Sidik Jari / DNA</option>
                              <option value="VEHICLE">Kendaraan Sitaan</option>
                              <option value="DOCUMENT">Dokumen & Rekening</option>
                              <option value="AUDIO">Rekaman Audio / Wiretap</option>
                              <option value="OTHER">Lainnya</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] text-gray-400 block mb-1">Deskripsi & Temuan Analisis Laboratorium</label>
                          <textarea
                            value={evDesc}
                            onChange={(e) => setEvDesc(e.target.value)}
                            rows={2}
                            placeholder="Ditemukan di dekat tong sampah gang Ganton, terdapat goresan laras khusus..."
                            className="w-full px-3 py-1.5 bg-[#161B22] border border-gray-700 rounded text-xs text-gray-100 outline-none font-sans"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-gray-400 block mb-1">Lokasi Penyimpanan Fisik / Locker</label>
                          <input
                            type="text"
                            value={evLoc}
                            onChange={(e) => setEvLoc(e.target.value)}
                            placeholder="Contoh: Evidence Locker #B-12 atau HSPD Secure Vault"
                            className="w-full px-3 py-1.5 bg-[#161B22] border border-gray-700 rounded text-xs text-gray-100 outline-none"
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-gray-800">
                          <button
                            type="button"
                            onClick={() => setIsAddingEvidence(false)}
                            className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded text-xs"
                          >
                            Batal
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded text-xs"
                          >
                            Simpan Barang Bukti
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Evidence Cards Grid */}
                    {selectedCase.evidences.length === 0 ? (
                      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-8 text-center text-gray-500 space-y-2">
                        <FileText className="w-10 h-10 mx-auto text-gray-600" />
                        <div className="text-xs font-bold text-gray-400">Belum Ada Barang Bukti Terlampir</div>
                        <p className="text-[11px] max-w-sm mx-auto">
                          Tambahkan selongsong peluru, foto TKP, sampel narkotika, atau file dokumen dari folder perangkat Anda.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {selectedCase.evidences.map(ev => (
                          <div key={ev.id} className="bg-[#0D1117] border border-gray-800 rounded-xl p-3.5 space-y-2.5 hover:border-blue-700/80 transition shadow-md">
                            {/* Evidence Image / File Attachment Thumbnail */}
                            {ev.imageUrl && (
                              <div 
                                className="relative rounded-lg overflow-hidden border border-gray-700/80 aspect-[16/9] bg-black cursor-pointer group"
                                onClick={() => setLightboxUrl({ url: ev.imageUrl!, title: ev.title })}
                              >
                                <img 
                                  src={ev.imageUrl} 
                                  alt={ev.title} 
                                  className="w-full h-full object-cover group-hover:scale-105 transition"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition">
                                  <ZoomIn className="w-6 h-6 drop-shadow" />
                                </div>
                                {ev.fileName && (
                                  <div className="absolute bottom-1.5 left-1.5 bg-black/75 backdrop-blur-xs text-[9px] text-white px-2 py-0.5 rounded border border-gray-700 flex items-center gap-1 font-mono">
                                    <Paperclip className="w-3 h-3 text-blue-400" />
                                    <span>{ev.fileName}</span>
                                    {ev.fileSize && <span className="text-gray-400">({ev.fileSize})</span>}
                                  </div>
                                )}
                              </div>
                            )}

                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800 px-2 py-0.5 rounded">
                                {ev.type}
                              </span>
                              <span className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                                <Lock className="w-3 h-3 text-amber-400" />
                                {ev.storageLocation}
                              </span>
                            </div>

                            <div>
                              <h4 className="font-bold text-xs text-gray-100 font-sans">{ev.title}</h4>
                              <p className="text-[11px] text-gray-300 font-sans mt-0.5 leading-relaxed">
                                {ev.description}
                              </p>
                            </div>

                            <div className="flex items-center justify-between text-[10px] text-gray-500 pt-2 border-t border-gray-800">
                              <span>Petugas: <strong className="text-gray-300">{ev.collectedBy}</strong></span>
                              <button
                                type="button"
                                onClick={() => handleDeleteEvidence(ev.id, ev.title)}
                                className="text-rose-400 hover:text-rose-300 flex items-center gap-1"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Hapus</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 4. TAB TIMELINE */}
                {activeTab === 'timeline' && (
                  <div className="space-y-4">
                    <div className="text-xs font-bold text-gray-300 uppercase">
                      Linimasa Investigasi Kasus & Catatan Lapangan:
                    </div>

                    {/* Quick Add Timeline Input */}
                    <form onSubmit={handleAddTimelineLog} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={timelineDesc}
                        onChange={(e) => setTimelineDesc(e.target.value)}
                        placeholder="Tulis perkembangan terbaru (Contoh: Menemukan safehouse pelaku di Ganton)..."
                        className="flex-1 px-3 py-2 bg-[#0D1117] border border-gray-700 focus:border-indigo-500 rounded-lg text-xs text-gray-100 placeholder:text-gray-600 outline-none"
                        required
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs shrink-0"
                      >
                        + Catat Log
                      </button>
                    </form>

                    <div className="space-y-2.5 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-gray-800 pl-6">
                      {selectedCase.timeline.map((tl, idx) => (
                        <div key={tl.id || idx} className="relative bg-[#0D1117] border border-gray-800/80 rounded-xl p-3 space-y-1">
                          <div className="absolute -left-[19px] top-3.5 w-2 h-2 rounded-full bg-indigo-500 ring-4 ring-[#161B22]"></div>
                          <div className="flex items-center justify-between text-[10px] text-gray-400">
                            <span className="font-bold text-indigo-400">{tl.dateFormatted}</span>
                            <span className="text-gray-500">{tl.officer}</span>
                          </div>
                          <p className="text-xs text-gray-200 font-sans leading-relaxed">
                            {tl.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-[#161B22] border border-gray-800 rounded-xl p-12 text-center text-gray-500 space-y-2">
              <FolderOpen className="w-10 h-10 mx-auto text-gray-600" />
              <div className="text-sm font-bold text-gray-400">Pilih Berkas Kasus di Samping</div>
              <p className="text-xs max-w-sm mx-auto">
                Klik salah satu berkas penyelidikan pada kolom kiri untuk meninjau barang bukti, status surat penangkapan, dan linimasa.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ================= MODAL: TAMBAH / EDIT TARGET & HIRARKI SINDIKAT ================= */}
      {isSuspectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs font-mono text-xs">
          <div className="bg-[#161B22] border border-amber-500/80 rounded-xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="bg-[#0D1117] border-b border-gray-800 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold uppercase text-gray-100">
                  {editingSuspectId ? 'EDIT PROFIL HIRARKI TARGET SINDIKAT' : 'TAMBAH ANGGOTA / TARGET POHON SINDIKAT'}
                </h3>
              </div>
              <button
                onClick={() => setIsSuspectModalOpen(false)}
                className="text-gray-400 hover:text-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Hidden Mugshot Device File Picker */}
            <input 
              type="file"
              ref={suspectFileRef}
              accept="image/*"
              onChange={handleMugshotDeviceUpload}
              className="hidden"
            />

            <form onSubmit={handleSaveSuspect} className="p-4 space-y-3.5 overflow-y-auto">
              {/* Mugshot Section with Device Upload */}
              <div className="bg-[#0D1117] p-3 rounded-lg border border-gray-800 flex items-center gap-3">
                <div 
                  onClick={() => suspectFileRef.current?.click()}
                  className="w-16 h-16 rounded-lg bg-black/70 border border-dashed border-amber-600/70 hover:border-amber-400 overflow-hidden shrink-0 flex flex-col items-center justify-center text-center cursor-pointer transition"
                >
                  {isUploadingMugshot ? (
                    <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
                  ) : suspMugshot ? (
                    <img src={suspMugshot} alt="Mugshot" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <Camera className="w-4 h-4 text-amber-400" />
                      <span className="text-[8px] text-gray-400 mt-0.5">Upload Foto</span>
                    </>
                  )}
                </div>

                <div className="flex-1 space-y-1.5">
                  <div className="text-[10px] font-bold text-gray-300">Foto Tersangka / Mugshot</div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => suspectFileRef.current?.click()}
                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-black font-bold rounded text-[10px] flex items-center gap-1 transition"
                    >
                      <Upload className="w-3 h-3" />
                      <span>Pilih Dari Folder Device</span>
                    </button>
                    {suspMugshot && (
                      <button
                        type="button"
                        onClick={() => setSuspMugshot('')}
                        className="text-[10px] text-rose-400 hover:text-rose-300"
                      >
                        Hapus Foto
                      </button>
                    )}
                  </div>
                  <input
                    type="url"
                    value={suspMugshot}
                    onChange={(e) => setSuspMugshot(e.target.value)}
                    placeholder="Atau masukkan link URL gambar..."
                    className="w-full px-2.5 py-1 bg-[#161B22] border border-gray-700 rounded text-[10px] text-gray-200 outline-none font-mono"
                  />
                </div>
              </div>

              {/* Name & Alias */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-300 block mb-1">
                    Nama Karakter In-Game <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={suspName}
                    onChange={(e) => setSuspName(e.target.value)}
                    placeholder="Contoh: Salvatore Falcone"
                    className="w-full px-3 py-1.5 bg-[#0D1117] border border-gray-700 focus:border-amber-500 rounded text-xs text-gray-100 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-300 block mb-1">
                    Nama Panggilan / Alias
                  </label>
                  <input
                    type="text"
                    value={suspAlias}
                    onChange={(e) => setSuspAlias(e.target.value)}
                    placeholder="Contoh: The Godfather / El Diablo"
                    className="w-full px-3 py-1.5 bg-[#0D1117] border border-gray-700 rounded text-xs text-gray-100 outline-none"
                  />
                </div>
              </div>

              {/* Syndicate Role (Hierarchy Level) & Superior (Parent in Tree) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-amber-400 block mb-1">
                    Tingkat Hirarki / Peran Sindikat <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={suspRole}
                    onChange={(e) => setSuspRole(e.target.value as SyndicateRole)}
                    className="w-full px-3 py-1.5 bg-[#0D1117] border border-amber-600 rounded text-xs text-gray-100 outline-none font-bold"
                  >
                    <option value="BOSS">👑 Tier 1: Atasan Tertinggi / Boss (Kingpin)</option>
                    <option value="UNDERBOSS">🛡️ Tier 2: Wakil Ketua / Underboss / Penasihat</option>
                    <option value="CAPTAIN">⭐ Tier 3: Letnan / Captain / Koordinator</option>
                    <option value="SOLDIER">🔫 Tier 4: Anggota Inti / Soldier / Eksekutor / Kurir</option>
                    <option value="ASSOCIATE">👁️ Tier 5: Informan / Associate / Street Hustler</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-amber-400 block mb-1">
                    ⬆️ Atasan Langsung (Lapor Ke Siapa)
                  </label>
                  <select
                    value={suspParentId}
                    onChange={(e) => setSuspParentId(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#0D1117] border border-gray-700 rounded text-xs text-gray-100 outline-none"
                  >
                    <option value="">(Tidak Ada - Puncak Pimpinan / Mandiri)</option>
                    {selectedCase?.suspects
                      .filter(s => s.id !== editingSuspectId)
                      .map(s => {
                        const rCfg = getRoleConfig(s.role, s.hierarchyLevel);
                        return (
                          <option key={s.id} value={s.id}>
                            [{rCfg.short}] {s.name} {s.alias ? `("${s.alias}")` : ''}
                          </option>
                        );
                      })}
                  </select>
                </div>
              </div>

              {/* Custom Role Title & Gang Affiliation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-300 block mb-1">
                    Jabatan / Peran Spesifik (Opsional)
                  </label>
                  <input
                    type="text"
                    value={suspCustomTitle}
                    onChange={(e) => setSuspCustomTitle(e.target.value)}
                    placeholder="Contoh: Kepala Keuangan & Cuci Uang"
                    className="w-full px-3 py-1.5 bg-[#0D1117] border border-gray-700 rounded text-xs text-gray-100 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-300 block mb-1">
                    Nama Sindikat / Geng / Keluarga
                  </label>
                  <input
                    type="text"
                    value={suspGang}
                    onChange={(e) => setSuspGang(e.target.value)}
                    placeholder="Contoh: Falcone Cartel / Los Santos Vagos"
                    className="w-full px-3 py-1.5 bg-[#0D1117] border border-gray-700 rounded text-xs text-gray-100 outline-none"
                  />
                </div>
              </div>

              {/* Status & Bounty Reward */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-300 block mb-1">
                    Status Hukum
                  </label>
                  <select
                    value={suspStatus}
                    onChange={(e) => setSuspStatus(e.target.value as SuspectStatus)}
                    className="w-full px-3 py-1.5 bg-[#0D1117] border border-gray-700 rounded text-xs text-gray-100 outline-none"
                  >
                    <option value="WARRANT_ACTIVE">🔴 Buron (Warrant Active)</option>
                    <option value="SUSPECT">🟡 Tersangka (Suspect)</option>
                    <option value="ARRESTED">🟢 Tertangkap (In Jail)</option>
                    <option value="PERSON_OF_INTEREST">⚪ Saksi / Person of Interest</option>
                    <option value="DECEASED">💀 Tewas (Deceased)</option>
                    <option value="CLEARED">🕊️ Bebas (Cleared)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-300 block mb-1">
                    Hadiah Sayembara / Bounty ($)
                  </label>
                  <input
                    type="number"
                    value={suspBounty}
                    onChange={(e) => setSuspBounty(e.target.value)}
                    placeholder="Contoh: 50000"
                    className="w-full px-3 py-1.5 bg-[#0D1117] border border-gray-700 rounded text-xs text-gray-100 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-300 block mb-1">
                    Nomor Telepon In-Game
                  </label>
                  <input
                    type="text"
                    value={suspPhone}
                    onChange={(e) => setSuspPhone(e.target.value)}
                    placeholder="Contoh: 555-0182"
                    className="w-full px-3 py-1.5 bg-[#0D1117] border border-gray-700 rounded text-xs text-gray-100 outline-none"
                  />
                </div>
              </div>

              {/* Charges */}
              <div>
                <label className="text-[10px] font-bold uppercase text-gray-300 block mb-1">
                  Pasal / Tuduhan Kriminal (Pisahkan dengan koma)
                </label>
                <input
                  type="text"
                  value={suspCharges}
                  onChange={(e) => setSuspCharges(e.target.value)}
                  placeholder="Contoh: Pasal C - Senjata Berat, Pasal F - Sindikat Kriminal"
                  className="w-full px-3 py-1.5 bg-[#0D1117] border border-gray-700 rounded text-xs text-gray-100 outline-none"
                />
              </div>

              {/* Intelligence Notes */}
              <div>
                <label className="text-[10px] font-bold uppercase text-gray-300 block mb-1">
                  Catatan Intelijen & Ciri Fisik
                </label>
                <textarea
                  value={suspNotes}
                  onChange={(e) => setSuspNotes(e.target.value)}
                  rows={3}
                  placeholder="Kendaraan yang sering dipakai, safehouse persembunyian, kontak darurat..."
                  className="w-full px-3 py-1.5 bg-[#0D1117] border border-gray-700 rounded text-xs text-gray-100 outline-none font-sans"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsSuspectModalOpen(false)}
                  className="px-4 py-2 bg-gray-800 text-gray-300 rounded text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-black font-bold rounded text-xs shadow-md"
                >
                  {editingSuspectId ? 'Simpan Perubahan Hirarki' : 'Tambahkan ke Pohon Sindikat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: BUKA KASUS BARU ================= */}
      {isCreatingModal && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs font-mono text-xs">
          <div className="bg-[#161B22] border border-indigo-600/70 rounded-xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-[#0D1117] border-b border-gray-800 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-bold uppercase text-gray-100">
                  BUKA BERKAS INVESTIGASI DETEKTIF BARU
                </h3>
              </div>
              <button
                onClick={() => setIsCreatingModal(false)}
                className="text-gray-400 hover:text-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewCaseSubmit} className="p-4 space-y-3.5 overflow-y-auto">
              <div>
                <label className="text-[11px] font-bold uppercase text-gray-300 block mb-1">
                  Judul Kasus / Operasi Penyelidikan <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Contoh: Operasi Sindikat Peredaran Senjata Ilegal Ganton"
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 focus:border-indigo-500 rounded-lg text-xs text-gray-100 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase text-gray-300 block mb-1">
                    Tingkat Prioritas
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as CasePriority)}
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 rounded-lg text-xs text-gray-100 outline-none"
                  >
                    <option value="CRITICAL">🔴 Critical (Perampokan/Baku Tembak)</option>
                    <option value="HIGH">🟠 High (Senjata/Narkoba Besar)</option>
                    <option value="MEDIUM">🟡 Medium (Kasus Penipuan/Pencurian)</option>
                    <option value="LOW">⚪ Low (Kasus Ringan)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase text-gray-300 block mb-1">
                    Tanggal Kejadian / TKP
                  </label>
                  <input
                    type="date"
                    value={newIncidentDate}
                    onChange={(e) => setNewIncidentDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 rounded-lg text-xs text-gray-100 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-gray-300 block mb-1">
                  Lokasi TKP / Wilayah Operasi
                </label>
                <input
                  type="text"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="Contoh: Idlewood Motel & Ganton Gas Station"
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 rounded-lg text-xs text-gray-100 outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-gray-300 block mb-1">
                  Ringkasan Awal & Modus Operandi
                </label>
                <textarea
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  rows={4}
                  placeholder="Tuliskan latar belakang kejadian perkara, saksi awal, dan target yang diburu..."
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 rounded-lg text-xs text-gray-100 outline-none font-sans"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsCreatingModal(false)}
                  className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs"
                >
                  Buat Berkas Kasus
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL LIGHTBOX / FULL IMAGE PREVIEW ================= */}
      {lightboxUrl && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in"
          onClick={() => setLightboxUrl(null)}
        >
          <div 
            className="relative max-w-4xl w-full bg-[#161B22] border border-gray-800 rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 bg-[#0D1117] border-b border-gray-800 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-200 font-mono flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-blue-400" />
                {lightboxUrl.title}
              </span>
              <button
                type="button"
                onClick={() => setLightboxUrl(null)}
                className="w-7 h-7 rounded bg-gray-800 hover:bg-rose-900/60 text-gray-300 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-2 bg-black flex items-center justify-center max-h-[80vh] overflow-hidden">
              <img 
                src={lightboxUrl.url} 
                alt="Full View" 
                className="max-w-full max-h-[75vh] object-contain rounded"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL CETAK BERKAS KASUS RESMI (PNG / JPG / PRINT) ================= */}
      {showDossierModal && selectedCase && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in font-mono text-xs">
          <div className="bg-[#12151B] border-2 border-indigo-600 rounded-xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
            {/* Header */}
            <div className="bg-[#0A0D12] border-b border-gray-800 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="font-bold text-sm text-gray-100">
                    LEMBAR BERKAS PERKARA INVESTIGASI DETEKTIF HSPD
                  </h3>
                  <p className="text-[10px] text-gray-400">
                    Dokumen resmi intelijen, bagan sindikat kejahatan, daftar target, dan barang bukti perkara.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDossierModal(false)}
                className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Document sheet that gets captured to PNG / JPG */}
            <div className="p-4 overflow-y-auto flex-1 bg-black/40">
              <div 
                id="detective-dossier-sheet"
                className="p-7 space-y-4 bg-[#0F1318] border-2 border-indigo-700/80 rounded-xl shadow-2xl relative overflow-hidden text-gray-200 font-mono"
                style={{ minWidth: '600px' }}
              >
                {/* Background Police Seal Watermark */}
                <div className="absolute right-6 top-1/3 opacity-5 pointer-events-none select-none text-white text-9xl font-black rotate-12">
                  CID
                </div>

                {/* Kop Surat Polisi */}
                <div className="border-b-2 border-indigo-600/60 pb-3 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-[11px] tracking-widest uppercase text-indigo-400 font-bold flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-indigo-400 inline" />
                      <span>HIGH SPEED POLICE DEPARTMENT (HSPD)</span>
                    </div>
                    <div className="text-[9px] text-gray-400 uppercase tracking-wider">
                      CRIMINAL INVESTIGATION DIVISION (CID) • DETECTIVE BUREAU
                    </div>
                    <div className="text-[8px] text-gray-500 font-mono">
                      SPECIAL INVESTIGATION SECTION • MISSION ROW HEADQUARTERS
                    </div>
                  </div>
                  <div className="text-right border border-indigo-700/60 bg-indigo-950/40 px-3 py-1.5 rounded">
                    <div className="text-[8px] uppercase text-indigo-300 font-bold">STATUS PERKARA</div>
                    <div className="text-[11px] font-bold text-indigo-400">
                      {selectedCase.status} • {selectedCase.priority}
                    </div>
                  </div>
                </div>

                {/* Title & Document Number */}
                <div className="text-center py-1 space-y-1">
                  <h2 className="text-base font-black text-gray-100 uppercase tracking-widest">
                    BERKAS PERKARA PIDANA & INTELIJEN SINDIKAT
                  </h2>
                  <div className="inline-block px-3 py-1 bg-indigo-950/60 border border-indigo-700 text-indigo-300 rounded font-mono text-xs font-bold">
                    KASUS NO: {selectedCase.caseNumber} • JUDUL: {selectedCase.title}
                  </div>
                </div>

                {/* Metadata */}
                <div className="bg-[#161B22] p-3 rounded-lg border border-gray-700 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-400 block text-[10px]">LEAD DETECTIVE:</span>
                    <span className="text-indigo-300 font-bold">{selectedCase.leadDetective} (Badge #{selectedCase.leadDetectiveBadge})</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">TANGGAL KEJADIAN / REGISTER:</span>
                    <span className="text-gray-100 font-bold">{selectedCase.incidentDate}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">LOKASI / WILAYAH OPERASI:</span>
                    <span className="text-amber-300 font-bold">{selectedCase.location || 'Kota Los Santos & Sekitarnya'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">SURAT PERINTAH (WARRANT):</span>
                    <span className={selectedCase.warrantIssued ? 'text-rose-400 font-bold' : 'text-gray-400'}>
                      {selectedCase.warrantIssued ? `AKTIF (${selectedCase.warrantNumber})` : 'TIDAK DITERBITKAN'}
                    </span>
                  </div>
                </div>

                {/* Summary / Modus Operandi */}
                <div className="bg-[#161B22] p-3 rounded-lg border border-gray-700 space-y-1 text-xs">
                  <div className="text-indigo-400 font-bold">RINGKASAN PERKARA & MODUS OPERANDI:</div>
                  <p className="text-gray-300 leading-relaxed">{selectedCase.summary}</p>
                </div>

                {/* Suspect Syndicate Hierarchy Tree / Roster */}
                <div className="bg-[#161B22] p-3 rounded-lg border border-gray-700 space-y-2 text-xs">
                  <div className="text-amber-400 font-bold flex items-center justify-between border-b border-gray-800 pb-1">
                    <span>BAGAN STRUKTUR POHON KELUARGA / SINDIKAT TERSANGKA:</span>
                    <span className="text-gray-400 font-mono text-[10px]">{selectedCase.suspects.length} Target Teridentifikasi</span>
                  </div>

                  <div className="space-y-2 pt-1">
                    {/* Level 1: Boss / Leader */}
                    {groupedTiers.tier1.length > 0 && (
                      <div className="border border-red-800/80 bg-red-950/30 p-2 rounded-lg">
                        <div className="text-[10px] font-bold text-red-400 uppercase mb-1">👑 TIER 1: PEMIMPIN TERTINGGI / BOSS / ATASAN</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {groupedTiers.tier1.map(s => (
                            <div key={s.id} className="flex items-center gap-2 bg-[#0D1117] p-2 rounded border border-red-900/60">
                              {s.photoUrl ? (
                                <img src={s.photoUrl} alt={s.name} className="w-10 h-10 object-cover rounded border border-red-600" />
                              ) : (
                                <div className="w-10 h-10 rounded bg-red-950 flex items-center justify-center text-red-400 font-bold">👑</div>
                              )}
                              <div className="text-[10px] space-y-0.5">
                                <div className="font-bold text-gray-100">{s.name} {s.alias ? `("${s.alias}")` : ''}</div>
                                <div className="text-red-400 font-bold">STATUS: {s.status}</div>
                                {s.description && <div className="text-gray-400 text-[9px] line-clamp-1">{s.description}</div>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Level 2: Underboss / Wakil */}
                    {groupedTiers.tier2.length > 0 && (
                      <div className="border border-orange-800/80 bg-orange-950/30 p-2 rounded-lg">
                        <div className="text-[10px] font-bold text-orange-400 uppercase mb-1">⭐ TIER 2: WAKIL / UNDERBOSS / ORANG KEPERCAYAAN</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {groupedTiers.tier2.map(s => (
                            <div key={s.id} className="flex items-center gap-2 bg-[#0D1117] p-2 rounded border border-orange-900/60">
                              {s.photoUrl ? (
                                <img src={s.photoUrl} alt={s.name} className="w-10 h-10 object-cover rounded border border-orange-600" />
                              ) : (
                                <div className="w-10 h-10 rounded bg-orange-950 flex items-center justify-center text-orange-400 font-bold">⭐</div>
                              )}
                              <div className="text-[10px] space-y-0.5">
                                <div className="font-bold text-gray-100">{s.name} {s.alias ? `("${s.alias}")` : ''}</div>
                                <div className="text-orange-400 font-bold">STATUS: {s.status}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Level 3: Captain / Komandan */}
                    {groupedTiers.tier3.length > 0 && (
                      <div className="border border-yellow-800/80 bg-yellow-950/30 p-2 rounded-lg">
                        <div className="text-[10px] font-bold text-yellow-400 uppercase mb-1">🎖️ TIER 3: KAPTIEN / MANDOR LAPANGAN</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {groupedTiers.tier3.map(s => (
                            <div key={s.id} className="flex items-center gap-2 bg-[#0D1117] p-2 rounded border border-yellow-900/60">
                              {s.photoUrl ? (
                                <img src={s.photoUrl} alt={s.name} className="w-9 h-9 object-cover rounded border border-yellow-600" />
                              ) : (
                                <div className="w-9 h-9 rounded bg-yellow-950 flex items-center justify-center text-yellow-400 font-bold">🎖️</div>
                              )}
                              <div className="text-[10px]">
                                <div className="font-bold text-gray-100">{s.name} {s.alias ? `("${s.alias}")` : ''}</div>
                                <div className="text-yellow-400">STATUS: {s.status}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Level 4 & 5: Soldiers & Associates */}
                    {(groupedTiers.tier4.length > 0 || groupedTiers.tier5.length > 0) && (
                      <div className="border border-blue-900/80 bg-blue-950/20 p-2 rounded-lg">
                        <div className="text-[10px] font-bold text-blue-400 uppercase mb-1">👥 TIER 4 & 5: ANGGOTA / PRAJURIT / REKANAN</div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {[...groupedTiers.tier4, ...groupedTiers.tier5].map(s => (
                            <div key={s.id} className="bg-[#0D1117] p-1.5 rounded border border-gray-800 text-[9px]">
                              <div className="font-bold text-gray-200">{s.name}</div>
                              <div className="text-gray-400">{s.role || 'ANGGOTA'} • <span className="text-blue-300 font-bold">{s.status}</span></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Evidence List Summary */}
                {selectedCase.evidences && selectedCase.evidences.length > 0 && (
                  <div className="bg-[#161B22] p-3 rounded-lg border border-gray-700 space-y-1.5 text-xs">
                    <div className="text-emerald-400 font-bold flex items-center justify-between border-b border-gray-800 pb-1">
                      <span>DAFTAR BARANG BUKTI TERSIMPAN:</span>
                      <span className="text-gray-400 font-mono text-[10px]">{selectedCase.evidences.length} Barang Bukti</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {selectedCase.evidences.map((ev, i) => (
                        <div key={ev.id || i} className="bg-[#0D1117] p-2 rounded border border-gray-800 text-[10px] space-y-0.5">
                          <div className="font-bold text-gray-200 flex items-center gap-1">
                            <Paperclip className="w-3 h-3 text-emerald-400" />
                            <span>[{ev.type}] {ev.title}</span>
                          </div>
                          {ev.fileName && (
                            <div className="text-emerald-300 font-mono text-[9px]">File: {ev.fileName} ({ev.fileSize || 'Local'})</div>
                          )}
                          <div className="text-gray-400 text-[9px]">{ev.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Signatures and Stamp Block */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t-2 border-gray-800 text-center text-[10px]">
                  {/* Left: Lead Detective */}
                  <div className="space-y-6 flex flex-col justify-between">
                    <div className="text-gray-400">Penyidik Utama / Lead Detective:</div>
                    <div className="border-t border-gray-700 pt-1 font-bold text-gray-200">
                      <div>{selectedCase.leadDetective}</div>
                      <div className="text-[9px] text-gray-400 font-normal">Badge #{selectedCase.leadDetectiveBadge} • CID Detective Division</div>
                    </div>
                  </div>

                  {/* Right: Stamp & High Command */}
                  <div className="space-y-4 flex flex-col justify-between relative">
                    {/* STEMPEL BASAH HSPD CID */}
                    <div className="absolute right-4 top-1/4 -translate-y-1/2 border-2 border-indigo-500/80 rounded-full w-24 h-24 flex items-center justify-center rotate-[-12deg] pointer-events-none opacity-85 text-indigo-400 font-bold text-[8px] leading-tight text-center p-1 bg-indigo-950/20">
                      <div>
                        ★ HSPD CID ★<br/>
                        SPECIAL CASE<br/>
                        CLASSIFIED<br/>
                        {new Date().toLocaleDateString('id-ID')}
                      </div>
                    </div>

                    <div className="text-gray-400">Mengetahui & Mengesahkan:</div>
                    <div className="border-t border-gray-700 pt-1 font-bold text-indigo-300 z-10">
                      <div>COMMANDER OF CID / CHIEF OF POLICE</div>
                      <div className="text-[9px] text-indigo-400 font-bold tracking-wider">HSPD DETECTIVE BUREAU</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons: PNG / JPG / Print */}
            <div className="bg-[#0A0D12] border-t border-gray-800 p-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {/* Export PNG */}
                <button
                  onClick={() => handleExportDossierImage('png')}
                  disabled={isExportingImage !== null}
                  className="px-3 py-2 bg-indigo-700 hover:bg-indigo-600 disabled:opacity-50 text-white rounded font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-indigo-900/30"
                  title="Unduh Berkas Kasus & Pohon Tersangka sebagai file PNG HD"
                >
                  {isExportingImage === 'png' ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Camera className="w-3.5 h-3.5" />
                  )}
                  <span>Unduh PNG (HD)</span>
                </button>

                {/* Export JPG */}
                <button
                  onClick={() => handleExportDossierImage('jpeg')}
                  disabled={isExportingImage !== null}
                  className="px-3 py-2 bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white rounded font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-blue-900/30"
                  title="Unduh Berkas Kasus & Pohon Tersangka sebagai file JPG"
                >
                  {isExportingImage === 'jpeg' ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ImageIcon className="w-3.5 h-3.5" />
                  )}
                  <span>Unduh JPG</span>
                </button>

                {/* Print */}
                <button
                  onClick={() => window.print()}
                  className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-gray-400" />
                  <span>Cetak / PDF</span>
                </button>
              </div>

              <button
                onClick={() => setShowDossierModal(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold transition cursor-pointer"
              >
                Selesai / Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
