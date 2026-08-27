import React, { useState } from 'react';
import { 
  Flame, Plus, Search, Filter, Calendar, Car, ShieldAlert,
  FileText, Upload, CheckCircle2, AlertTriangle, AlertCircle, Trash2,
  Eye, RefreshCw, X, FileUp, Sparkles, UserCheck, Paperclip, ExternalLink,
  Hammer, DollarSign, Weight, Factory, Award, Printer, ChevronRight, Shield,
  Layers, Package, Check, Download, Camera, Image as ImageIcon
} from 'lucide-react';
import { 
  DestructionRegistryItem, OfficerProfile, isOfficerHighRank,
  DestructionItemType, DestructionStatus, DestructionReason
} from '../types';
import { 
  getSavedDestructionList, saveDestructionItem, deleteDestructionItem,
  getDestructionStats, generateDestructionCertificate
} from '../utils/vaultAndDestructionStorage';
import { sendDestructionRecordToDiscord, getSavedDestructionWebhookConfig } from '../utils/discordWebhook';
import { exportElementAsImage } from '../utils/exportDocumentAsImage';

interface Props {
  currentOfficer: OfficerProfile | null;
}

export const DestructionRegistryBoard: React.FC<Props> = ({ currentOfficer }) => {
  const [items, setItems] = useState<DestructionRegistryItem[]>(() => getSavedDestructionList());
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | DestructionItemType>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | DestructionStatus>('ALL');
  const [selectedItem, setSelectedItem] = useState<DestructionRegistryItem | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState<DestructionRegistryItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExportingImage, setIsExportingImage] = useState<'png' | 'jpeg' | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Function to export Berita Acara to PNG / JPG
  const handleExportCertificateImage = async (format: 'png' | 'jpeg') => {
    if (!showCertificateModal) return;
    setIsExportingImage(format);
    try {
      const res = await exportElementAsImage('destruction-certificate-sheet', {
        fileName: `BERITA_ACARA_PELEBURAN_${showCertificateModal.destructionNumber}_${showCertificateModal.scheduledDate}`,
        format,
        quality: 0.98,
        backgroundColor: '#0F1318',
        scale: 2
      });

      if (res.success) {
        setNotification({
          type: 'success',
          message: `Berhasil mengunduh Berita Acara Peleburan dalam format ${format.toUpperCase()}!`
        });
      } else {
        setNotification({
          type: 'error',
          message: res.error || 'Gagal mengekspor dokumen ke gambar.'
        });
      }
    } catch (e: any) {
      setNotification({
        type: 'error',
        message: e.message || 'Terjadi kesalahan saat memproses gambar.'
      });
    } finally {
      setIsExportingImage(null);
    }
  };

  // Form states
  const [itemType, setItemType] = useState<DestructionItemType>('VEHICLE');
  const [title, setTitle] = useState('');
  const [caseNumber, setCaseNumber] = useState('');
  
  // Vehicle details
  const [vehModel, setVehModel] = useState('');
  const [vehPlate, setVehPlate] = useState('');
  const [vehColor, setVehColor] = useState('');
  const [vehVin, setVehVin] = useState('');
  const [vehOwner, setVehOwner] = useState('');
  const [vehCondition, setVehCondition] = useState('Rusak berat / Bodi hancur');

  // Weapon details
  const [wpnModel, setWpnModel] = useState('');
  const [wpnSerial, setWpnSerial] = useState('');
  const [wpnIsSerialScratched, setWpnIsSerialScratched] = useState(true);
  const [wpnCaliber, setWpnCaliber] = useState('9mm');
  const [wpnFrom, setWpnFrom] = useState('');
  const [wpnQty, setWpnQty] = useState<number>(1);

  // Narcotics details
  const [narcSubstance, setNarcSubstance] = useState('');
  const [narcWeight, setNarcWeight] = useState<number>(100);
  const [narcPackaging, setNarcPackaging] = useState('Kantong Plastik Klip');

  // Destruction Process
  const [destructionReason, setDestructionReason] = useState<DestructionReason>('COURT_ORDER_INKRACHT');
  const [reasonDescription, setReasonDescription] = useState('Putusan Pengadilan & Pemusnahan Sitaan Permanen');
  const [facilityLocation, setFacilityLocation] = useState('Los Santos Junkyard Scrapyard & Metal Smelter');
  const [authorizedBy, setAuthorizedBy] = useState('');
  const [executorOfficer, setExecutorOfficer] = useState('');
  const [courtOrderDocNumber, setCourtOrderDocNumber] = useState('');
  const [status, setStatus] = useState<DestructionStatus>('SMELTED_DESTROYED');
  const [scheduledDate, setScheduledDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [uploadedBeforePhotos, setUploadedBeforePhotos] = useState<{ name: string; dataUrl: string }[]>([]);
  const [uploadedAfterPhotos, setUploadedAfterPhotos] = useState<{ name: string; dataUrl: string }[]>([]);

  const stats = getDestructionStats(items);

  const resetForm = () => {
    setItemType('VEHICLE');
    setTitle('');
    setCaseNumber('');
    setVehModel('');
    setVehPlate('');
    setVehColor('');
    setVehVin('');
    setVehOwner('');
    setVehCondition('Rusak berat / Bodi hancur');
    setWpnModel('');
    setWpnSerial('');
    setWpnIsSerialScratched(true);
    setWpnCaliber('9mm');
    setWpnFrom('');
    setWpnQty(1);
    setNarcSubstance('');
    setNarcWeight(100);
    setNarcPackaging('Kantong Plastik Klip');
    setDestructionReason('COURT_ORDER_INKRACHT');
    setReasonDescription('Putusan Pengadilan & Pemusnahan Sitaan Permanen');
    setFacilityLocation('Los Santos Junkyard Scrapyard & Metal Smelter');
    setAuthorizedBy(currentOfficer ? `[${currentOfficer.rank}] ${currentOfficer.name}` : '');
    setExecutorOfficer(currentOfficer ? `${currentOfficer.name} (${currentOfficer.badge})` : '');
    setCourtOrderDocNumber(`SK-PN/HSPD/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`);
    setStatus('SMELTED_DESTROYED');
    setScheduledDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setUploadedBeforePhotos([]);
    setUploadedAfterPhotos([]);
  };

  const handleBeforeFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      if (file.size > 8 * 1024 * 1024) {
        setNotification({ type: 'error', message: `Foto ${file.name} melebihi batas 8MB` });
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setUploadedBeforePhotos(prev => [...prev, {
          name: file.name,
          dataUrl: result
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAfterFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      if (file.size > 8 * 1024 * 1024) {
        setNotification({ type: 'error', message: `Foto ${file.name} melebihi batas 8MB` });
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setUploadedAfterPhotos(prev => [...prev, {
          name: file.name,
          dataUrl: result
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOfficer) {
      setNotification({ type: 'error', message: 'Anda harus login untuk mencatat data peleburan.' });
      return;
    }

    if (!title.trim()) {
      setNotification({ type: 'error', message: 'Judul / nama barang yang dilebur wajib diisi.' });
      return;
    }

    setIsSubmitting(true);
    setNotification(null);

    try {
      const now = new Date();
      const destructionNumber = `HSPD-${itemType === 'VEHICLE' ? 'CRUSH' : 'SMELT'}-${now.getFullYear().toString().slice(-2)}-${String(Math.floor(100 + Math.random() * 900))}`;
      
      const newItem: DestructionRegistryItem = {
        id: `DEST-${Date.now()}`,
        destructionNumber,
        itemType,
        title: title.trim(),
        caseNumber: caseNumber.trim() || undefined,
        vehicleDetails: itemType === 'VEHICLE' ? {
          model: vehModel.trim() || 'Kendaraan',
          plateNumber: vehPlate.trim() || 'TANPA PLAT',
          color: vehColor.trim() || 'Standard',
          vin: vehVin.trim() || undefined,
          previousOwner: vehOwner.trim() || undefined,
          chassisCondition: vehCondition.trim() || undefined,
        } : undefined,
        weaponDetails: itemType === 'WEAPON' ? {
          weaponModel: wpnModel.trim() || 'Senjata Api',
          serialNumber: wpnSerial.trim() || 'SERIAL DIHAPUS',
          isSerialScratched: wpnIsSerialScratched,
          caliber: wpnCaliber.trim() || '9mm',
          confiscatedFrom: wpnFrom.trim() || undefined,
          quantity: Number(wpnQty) || 1,
        } : undefined,
        narcoticsDetails: itemType === 'NARCOTICS' ? {
          substance: narcSubstance.trim() || 'Narkotika',
          weightGrams: Number(narcWeight) || 0,
          packaging: narcPackaging.trim() || 'Kemasan Plastik',
          burningMethod: 'Incinerator Suhu Tinggi 1500°C'
        } : undefined,
        destructionReason,
        reasonDescription: reasonDescription.trim(),
        facilityLocation: facilityLocation.trim(),
        registeredBy: currentOfficer.name || 'Petugas HSPD',
        registeredByBadge: currentOfficer.badge || '#HQ',
        authorizedBy: authorizedBy.trim() || `[${currentOfficer.rank}] ${currentOfficer.name}`,
        authorizedDate: now.toISOString().split('T')[0],
        executorOfficer: executorOfficer.trim() || `${currentOfficer.name} (${currentOfficer.badge})`,
        courtOrderDocNumber: courtOrderDocNumber.trim() || undefined,
        status,
        scheduledDate: scheduledDate || now.toISOString().split('T')[0],
        executedTimestamp: status === 'SMELTED_DESTROYED' ? Date.now() : undefined,
        beforePhotos: uploadedBeforePhotos.map(p => p.dataUrl),
        afterPhotos: uploadedAfterPhotos.map(p => p.dataUrl),
        notes: notes.trim() || undefined,
        timestamp: Date.now()
      };

      // Save locally
      saveDestructionItem(newItem);
      setItems(getSavedDestructionList());

      // Send to Discord webhook
      const destructionConfig = getSavedDestructionWebhookConfig();
      if (destructionConfig.autoSendOnSave && destructionConfig.webhookUrl) {
        await sendDestructionRecordToDiscord(
          newItem,
          status === 'SMELTED_DESTROYED' ? 'DESTROYED' : status === 'APPROVED_SCHEDULED' ? 'APPROVED' : 'PROPOSED',
          currentOfficer
        );
      }

      setNotification({
        type: 'success',
        message: `Berita Acara Peleburan ${destructionNumber} berhasil disimpan & dikirim ke integrasi Discord!`
      });
      setShowModal(false);
      resetForm();
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Terjadi kesalahan saat menyimpan data peleburan.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    if (!isOfficerHighRank(currentOfficer?.rank)) {
      setNotification({ type: 'error', message: 'Hanya jajaran High Command yang dapat menghapus arsip peleburan.' });
      return;
    }
    if (window.confirm('Yakin ingin menghapus arsip peleburan ini?')) {
      deleteDestructionItem(id);
      setItems(getSavedDestructionList());
      if (selectedItem?.id === id) setSelectedItem(null);
      setNotification({ type: 'success', message: 'Arsip peleburan berhasil dihapus.' });
    }
  };

  const filteredItems = items.filter(item => {
    const matchSearch = 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.destructionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.caseNumber && item.caseNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.vehicleDetails?.plateNumber && item.vehicleDetails.plateNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.weaponDetails?.weaponModel && item.weaponDetails.weaponModel.toLowerCase().includes(searchTerm.toLowerCase())) ||
      item.registeredBy.toLowerCase().includes(searchTerm.toLowerCase());

    const matchType = typeFilter === 'ALL' || item.itemType === typeFilter;
    const matchStatus = statusFilter === 'ALL' || item.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-orange-950/40 via-[#161B22] to-[#0D1117] border border-orange-900/60 rounded-xl p-5 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-orange-900/50 border border-orange-600/60 rounded-lg text-orange-400">
                <Flame className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-gray-100 uppercase tracking-wide">
                Registri Peleburan & Pemusnahan Sitaan (Smelting & Scrapyard)
              </h2>
              <span className="text-[10px] bg-orange-950 text-orange-300 border border-orange-700/80 px-2 py-0.5 rounded font-bold">
                SMELTING & DISPOSAL REGISTRY
              </span>
            </div>
            <p className="text-xs text-gray-400 max-w-2xl">
              Pusat pencatatan resmi pemusnahan kendaraan sitaan tak tertebus, senjata api ilegal tanpa serial, amunisi kadaluarsa, dan penerbitan Berita Acara Resmi peleburan HSPD.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 text-white rounded-lg font-bold text-xs flex items-center gap-2 shadow-lg shadow-orange-600/30 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>CATAT PELEBURAN / PEMUSNAHAN BARU</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#161B22] border border-gray-800 p-4 rounded-xl flex items-center gap-3">
          <div className="p-3 bg-orange-950/60 border border-orange-700/60 rounded-lg text-orange-400">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Total Item Dilebur</div>
            <div className="text-base font-bold text-gray-100">{stats.totalDestroyed} Barang</div>
            <div className="text-[10px] text-gray-500">Telah dimusnahkan tuntas</div>
          </div>
        </div>

        <div className="bg-[#161B22] border border-gray-800 p-4 rounded-xl flex items-center gap-3">
          <div className="p-3 bg-blue-950/60 border border-blue-700/60 rounded-lg text-blue-400">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Kendaraan Dilebur</div>
            <div className="text-base font-bold text-blue-400">{stats.vehiclesDestroyed} Unit</div>
            <div className="text-[10px] text-gray-500">Mobil / Motor / Truk</div>
          </div>
        </div>

        <div className="bg-[#161B22] border border-gray-800 p-4 rounded-xl flex items-center gap-3">
          <div className="p-3 bg-red-950/60 border border-red-700/60 rounded-lg text-red-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Senjata Api Dilebur</div>
            <div className="text-base font-bold text-rose-400">{stats.weaponsDestroyed} Pucuk</div>
            <div className="text-[10px] text-gray-500">Pistol / Senapan / SMG</div>
          </div>
        </div>

        <div className="bg-[#161B22] border border-gray-800 p-4 rounded-xl flex items-center gap-3">
          <div className="p-3 bg-emerald-950/60 border border-emerald-700/60 rounded-lg text-emerald-400">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Nilai Besi Tua / Scrap</div>
            <div className="text-base font-bold text-emerald-400">${stats.totalScrapValue.toLocaleString()}</div>
            <div className="text-[10px] text-gray-400">{stats.totalMetalWeightKg.toLocaleString()} kg Logam Dilebur</div>
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`p-3 rounded-lg border text-xs flex items-center justify-between font-bold animate-in fade-in ${
          notification.type === 'success' 
            ? 'bg-emerald-950/80 border-emerald-600 text-emerald-200' 
            : 'bg-rose-950/80 border-rose-600 text-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-gray-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-[#161B22] p-3 rounded-xl border border-gray-800">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Cari judul, no peleburan, plat, kasus..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-[#0D1117] border border-gray-700 focus:border-orange-500 rounded-lg text-xs text-gray-200 outline-none"
          />
          <Search className="w-4 h-4 text-gray-500 absolute left-2.5 top-2" />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-400">Tipe:</span>
            <select
              value={typeFilter}
              onChange={(e: any) => setTypeFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-[#0D1117] border border-gray-700 rounded-lg text-xs text-gray-200 outline-none"
            >
              <option value="ALL">Semua Kategori</option>
              <option value="VEHICLE">🚗 Kendaraan</option>
              <option value="WEAPON">🔫 Senjata Api</option>
              <option value="NARCOTICS">💊 Narkotika</option>
              <option value="CONTRABAND">📦 Sitaan Lain</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e: any) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-[#0D1117] border border-gray-700 rounded-lg text-xs text-gray-200 outline-none"
            >
              <option value="ALL">Semua Status</option>
              <option value="SMELTED_DESTROYED">🔥 Selesai Dilebur</option>
              <option value="APPROVED_SCHEDULED">📅 Disetujui & Dijadwalkan</option>
              <option value="PROPOSED_PENDING_APPROVAL">⏳ Menunggu Persetujuan</option>
            </select>
          </div>
        </div>
      </div>

      {/* Item List Table */}
      <div className="bg-[#161B22] border border-gray-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <h3 className="font-bold text-sm text-gray-200 flex items-center gap-2">
            <Factory className="w-4 h-4 text-orange-400" />
            <span>Daftar Sitaan yang Dilebur / Dimusnahkan ({filteredItems.length})</span>
          </h3>
          <span className="text-[11px] text-gray-500">Dokumentasi Berita Acara Peleburan</span>
        </div>

        {filteredItems.length === 0 ? (
          <div className="p-12 text-center text-gray-500 space-y-2">
            <Flame className="w-10 h-10 mx-auto text-gray-600" />
            <div className="font-bold text-gray-400">Tidak ada data peleburan yang cocok dengan filter.</div>
            <p className="text-xs">Klik "Catat Peleburan / Pemusnahan Baru" untuk membuat Berita Acara baru.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800/60">
            {filteredItems.map((item) => (
              <div key={item.id} className="p-4 hover:bg-gray-800/30 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-orange-400 bg-orange-950/60 border border-orange-800 px-2 py-0.5 rounded">
                      {item.destructionNumber}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                      item.itemType === 'VEHICLE'
                        ? 'bg-blue-950 text-blue-300 border-blue-700'
                        : item.itemType === 'WEAPON'
                        ? 'bg-red-950 text-red-300 border-red-700'
                        : item.itemType === 'NARCOTICS'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                        : 'bg-purple-950 text-purple-300 border-purple-700'
                    }`}>
                      {item.itemType === 'VEHICLE' ? '🚗 KENDARAAN' : item.itemType === 'WEAPON' ? '🔫 SENJATA API' : item.itemType === 'NARCOTICS' ? '💊 NARKOTIKA' : '📦 BARANG SITAAN'}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                      item.status === 'SMELTED_DESTROYED'
                        ? 'bg-rose-950 text-rose-300 border-rose-700'
                        : item.status === 'APPROVED_SCHEDULED'
                        ? 'bg-blue-950 text-blue-300 border-blue-700'
                        : 'bg-amber-950 text-amber-300 border-amber-700'
                    }`}>
                      {item.status === 'SMELTED_DESTROYED' ? '🔥 SELESAI DILEBUR' : item.status === 'APPROVED_SCHEDULED' ? '📅 DIJADWALKAN' : '⏳ PENDING'}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {item.scheduledDate}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <h4 className="text-sm font-bold text-gray-100">{item.title}</h4>
                    {item.vehicleDetails?.plateNumber && (
                      <span className="text-xs font-mono font-bold text-amber-300 bg-black/50 px-1.5 py-0.5 rounded border border-amber-800/40">
                        Plat: {item.vehicleDetails.plateNumber}
                      </span>
                    )}
                    {item.weaponDetails?.serialNumber && (
                      <span className="text-xs font-mono font-bold text-rose-300 bg-black/50 px-1.5 py-0.5 rounded border border-rose-800/40">
                        SN: {item.weaponDetails.serialNumber}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1 text-gray-400">
                    <div>
                      <span className="text-gray-500 block text-[10px]">LOKASI:</span>
                      <span className="text-gray-300 truncate block">{item.facilityLocation}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[10px]">PENDAFTAR:</span>
                      <span className="text-gray-300">{item.registeredBy} ({item.registeredByBadge})</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[10px]">OTORISASI:</span>
                      <span className="text-gray-300 truncate block">{item.authorizedBy || '-'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[10px]">EKSEKUTOR:</span>
                      <span className="text-gray-300 truncate block">{item.executorOfficer || '-'}</span>
                    </div>
                  </div>

                  {item.reasonDescription && (
                    <div className="text-[11px] text-gray-400 pt-0.5">
                      <strong className="text-gray-300">Alasan:</strong> {item.reasonDescription}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setShowCertificateModal(item)}
                    className="px-3 py-1.5 bg-orange-950/80 hover:bg-orange-900 text-orange-300 border border-orange-700/80 rounded text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    title="Cetak / Lihat Berita Acara Resmi"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Berita Acara</span>
                  </button>

                  <button
                    onClick={() => setSelectedItem(item)}
                    className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 rounded text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-400" />
                    <span>Detail</span>
                  </button>

                  {isOfficerHighRank(currentOfficer?.rank) && (
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 bg-gray-800 hover:bg-rose-900/60 text-gray-400 hover:text-rose-300 border border-gray-700 rounded transition cursor-pointer"
                      title="Hapus Rekaman"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL: FORM CATAT PELEBURAN BARU */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in font-mono text-xs">
          <div className="bg-[#161B22] border border-orange-800/80 rounded-xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="bg-[#0F1319] border-b border-gray-800 px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-orange-900/60 border border-orange-600 rounded-lg text-orange-300">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-100">
                    Formulir Berita Acara Peleburan & Pemusnahan Sitaan
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Pencatatan resmi proses peleburan tungku baja kendaraan & senjata sitaan.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Category & Title */}
              <div className="p-3 bg-[#0D1117] border border-gray-800 rounded-lg space-y-3">
                <div className="font-bold text-orange-400 text-xs flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5" />
                  <span>1. Kategori & Objek Sitaan</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-gray-300 block mb-1">
                      Kategori Objek:
                    </label>
                    <select
                      value={itemType}
                      onChange={(e: any) => setItemType(e.target.value)}
                      className="w-full px-3 py-1.5 bg-[#161B22] border border-gray-700 focus:border-orange-500 rounded text-xs text-gray-200 outline-none font-bold"
                    >
                      <option value="VEHICLE">🚗 Kendaraan (Mobil / Motor / Truk)</option>
                      <option value="WEAPON">🔫 Senjata Api & Amunisi Ilegal</option>
                      <option value="NARCOTICS">💊 Narkotika Sitaan</option>
                      <option value="CONTRABAND">📦 Barang Sitaan Lainnya</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-bold text-gray-300 block mb-1">
                      Judul / Deskripsi Barang:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Peleburan Bravado Buffalo Hitam Modifikasi..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3 py-1.5 bg-[#161B22] border border-gray-700 focus:border-orange-500 rounded text-xs text-gray-200 outline-none"
                    />
                  </div>
                </div>

                {/* Sub-form: Vehicle */}
                {itemType === 'VEHICLE' && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-gray-800">
                    <div>
                      <label className="text-[10px] text-gray-400 block mb-1">Model Mobil:</label>
                      <input
                        type="text"
                        placeholder="Bravado Buffalo S"
                        value={vehModel}
                        onChange={(e) => setVehModel(e.target.value)}
                        className="w-full px-2 py-1 bg-[#161B22] border border-gray-700 rounded text-xs text-gray-200 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 block mb-1">Plat Nomor:</label>
                      <input
                        type="text"
                        placeholder="LS-9912"
                        value={vehPlate}
                        onChange={(e) => setVehPlate(e.target.value)}
                        className="w-full px-2 py-1 bg-[#161B22] border border-gray-700 rounded text-xs text-amber-300 font-mono font-bold outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 block mb-1">Warna Bodi:</label>
                      <input
                        type="text"
                        placeholder="Matte Black"
                        value={vehColor}
                        onChange={(e) => setVehColor(e.target.value)}
                        className="w-full px-2 py-1 bg-[#161B22] border border-gray-700 rounded text-xs text-gray-200 outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Sub-form: Weapon */}
                {itemType === 'WEAPON' && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-gray-800">
                    <div>
                      <label className="text-[10px] text-gray-400 block mb-1">Model Senjata:</label>
                      <input
                        type="text"
                        placeholder="8x Sawed-Off Shotgun"
                        value={wpnModel}
                        onChange={(e) => setWpnModel(e.target.value)}
                        className="w-full px-2 py-1 bg-[#161B22] border border-gray-700 rounded text-xs text-gray-200 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 block mb-1">Nomor Seri:</label>
                      <input
                        type="text"
                        placeholder="SERIAL DIHAPUS"
                        value={wpnSerial}
                        onChange={(e) => setWpnSerial(e.target.value)}
                        className="w-full px-2 py-1 bg-[#161B22] border border-gray-700 rounded text-xs text-rose-300 font-mono outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 block mb-1">Kaliber:</label>
                      <input
                        type="text"
                        placeholder="12 Gauge"
                        value={wpnCaliber}
                        onChange={(e) => setWpnCaliber(e.target.value)}
                        className="w-full px-2 py-1 bg-[#161B22] border border-gray-700 rounded text-xs text-gray-200 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 block mb-1">Jumlah Pucuk:</label>
                      <input
                        type="number"
                        min="1"
                        value={wpnQty}
                        onChange={(e) => setWpnQty(Number(e.target.value))}
                        className="w-full px-2 py-1 bg-[#161B22] border border-gray-700 rounded text-xs text-gray-200 outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Location & Legal Reason */}
              <div className="p-3 bg-[#0D1117] border border-gray-800 rounded-lg space-y-3">
                <div className="font-bold text-orange-400 text-xs flex items-center gap-1.5">
                  <Factory className="w-3.5 h-3.5" />
                  <span>2. Fasilitas & Dasar Pemusnahan</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-gray-300 block mb-1">
                      Alasan Pemusnahan / Peleburan:
                    </label>
                    <select
                      value={destructionReason}
                      onChange={(e: any) => setDestructionReason(e.target.value)}
                      className="w-full px-3 py-1.5 bg-[#161B22] border border-gray-700 focus:border-orange-500 rounded text-xs text-gray-200 outline-none"
                    >
                      <option value="COURT_ORDER_INKRACHT">⚖️ Putusan Pengadilan (Inkracht)</option>
                      <option value="ILLEGAL_SERIAL_ERASED">🚫 Senjata Ilegal Tanpa Serial</option>
                      <option value="UNCLAIMED_IMPOUND_EXPIRED">⏱️ Sitaan Kadaluarsa &gt;30 Hari</option>
                      <option value="TOTAL_WRECK_UNSAFE">💥 Rongsokan Berat Tidak Layak Jalan</option>
                      <option value="CONTRABAND_HAZARDOUS">☣️ Zat Kimia Berbahaya</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-300 block mb-1">
                      Lokasi Fasilitas Peleburan:
                    </label>
                    <input
                      type="text"
                      value={facilityLocation}
                      onChange={(e) => setFacilityLocation(e.target.value)}
                      className="w-full px-3 py-1.5 bg-[#161B22] border border-gray-700 rounded text-xs text-gray-200 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-300 block mb-1">
                    Keterangan Tambahan / Dasar Hukum:
                  </label>
                  <input
                    type="text"
                    value={reasonDescription}
                    onChange={(e) => setReasonDescription(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#161B22] border border-gray-700 rounded text-xs text-gray-200 outline-none"
                  />
                </div>
              </div>

              {/* Photos from Device */}
              <div className="p-3 bg-[#0D1117] border border-gray-800 rounded-lg space-y-3">
                <div className="font-bold text-orange-400 text-xs flex items-center gap-1.5">
                  <FileUp className="w-3.5 h-3.5" />
                  <span>3. Foto Bukti Sebelum & Sesudah Peleburan (Folder Device)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1">Foto Sebelum Dilebur:</label>
                    <div className="border border-dashed border-gray-700 hover:border-orange-500 rounded p-2 text-center relative bg-[#161B22]/60 cursor-pointer">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleBeforeFileUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <Upload className="w-4 h-4 mx-auto text-orange-400 mb-0.5" />
                      <span className="text-[10px] text-gray-300 font-bold block">Pilih Foto Sebelum</span>
                    </div>
                    {uploadedBeforePhotos.length > 0 && (
                      <div className="grid grid-cols-3 gap-1 pt-1">
                        {uploadedBeforePhotos.map((p, i) => (
                          <img key={i} src={p.dataUrl} alt="Before" className="w-full h-12 object-cover rounded border border-gray-700" />
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1">Foto Residu / Setelah Peleburan:</label>
                    <div className="border border-dashed border-gray-700 hover:border-orange-500 rounded p-2 text-center relative bg-[#161B22]/60 cursor-pointer">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleAfterFileUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <Upload className="w-4 h-4 mx-auto text-orange-400 mb-0.5" />
                      <span className="text-[10px] text-gray-300 font-bold block">Pilih Foto Residu</span>
                    </div>
                    {uploadedAfterPhotos.length > 0 && (
                      <div className="grid grid-cols-3 gap-1 pt-1">
                        {uploadedAfterPhotos.map((p, i) => (
                          <img key={i} src={p.dataUrl} alt="After" className="w-full h-12 object-cover rounded border border-gray-700" />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Status & Personnel */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-gray-300 block mb-1">
                    Status Pemusnahan:
                  </label>
                  <select
                    value={status}
                    onChange={(e: any) => setStatus(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#0D1117] border border-gray-700 focus:border-orange-500 rounded text-xs text-gray-200 outline-none"
                  >
                    <option value="SMELTED_DESTROYED">🔥 SMELTED_DESTROYED (Selesai Dilebur / Scrapped)</option>
                    <option value="APPROVED_SCHEDULED">📅 APPROVED_SCHEDULED (Disetujui & Dijadwalkan)</option>
                    <option value="PROPOSED_PENDING_APPROVAL">⏳ PROPOSED_PENDING_APPROVAL (Menunggu Persetujuan)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-300 block mb-1">
                    Otorisasi High Command:
                  </label>
                  <input
                    type="text"
                    value={authorizedBy}
                    onChange={(e) => setAuthorizedBy(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#0D1117] border border-gray-700 rounded text-xs text-gray-200 outline-none"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded font-bold transition"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded shadow-lg shadow-orange-600/30 transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Memproses Berita Acara & Webhook...</span>
                    </>
                  ) : (
                    <>
                      <Flame className="w-4 h-4" />
                      <span>TERBITKAN BERITA ACARA & SIMPAN PELEBURAN</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in font-mono text-xs">
          <div className="bg-[#161B22] border border-orange-700 rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="bg-[#0F1319] border-b border-gray-800 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-400" />
                <h3 className="font-bold text-sm text-gray-100">
                  Detail Rekaman Peleburan [{selectedItem.destructionNumber}]
                </h3>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 overflow-y-auto flex-1">
              <div className="bg-[#0D1117] p-3 rounded border border-gray-800 space-y-1">
                <div className="text-orange-400 font-bold text-sm">{selectedItem.title}</div>
                <div className="text-gray-400 text-xs">{selectedItem.reasonDescription}</div>
              </div>

              {selectedItem.vehicleDetails && (
                <div className="bg-[#0D1117] p-3 rounded border border-gray-800 space-y-1">
                  <div className="text-blue-400 font-bold">Detail Kendaraan:</div>
                  <div className="grid grid-cols-2 gap-1 text-gray-300">
                    <div>Model: <strong>{selectedItem.vehicleDetails.model}</strong></div>
                    <div>Plat: <strong className="text-amber-300">{selectedItem.vehicleDetails.plateNumber}</strong></div>
                    <div>Warna: <strong>{selectedItem.vehicleDetails.color}</strong></div>
                    <div>Kondisi: <strong>{selectedItem.vehicleDetails.chassisCondition || '-'}</strong></div>
                  </div>
                </div>
              )}

              {selectedItem.weaponDetails && (
                <div className="bg-[#0D1117] p-3 rounded border border-gray-800 space-y-1">
                  <div className="text-rose-400 font-bold">Detail Senjata Api:</div>
                  <div className="grid grid-cols-2 gap-1 text-gray-300">
                    <div>Model: <strong>{selectedItem.weaponDetails.weaponModel}</strong></div>
                    <div>Serial: <strong className="text-rose-300">{selectedItem.weaponDetails.serialNumber}</strong></div>
                    <div>Kaliber: <strong>{selectedItem.weaponDetails.caliber}</strong></div>
                    <div>Jumlah: <strong>{selectedItem.weaponDetails.quantity || 1} Pucuk</strong></div>
                  </div>
                </div>
              )}

              <div className="bg-[#0D1117] p-3 rounded border border-gray-800 grid grid-cols-2 gap-2 text-xs">
                <div>Lokasi: <strong className="text-gray-200">{selectedItem.facilityLocation}</strong></div>
                <div>Otorisasi: <strong className="text-amber-300">{selectedItem.authorizedBy || '-'}</strong></div>
                <div>Pendaftar: <strong className="text-gray-200">{selectedItem.registeredBy}</strong></div>
                <div>Eksekutor: <strong className="text-gray-200">{selectedItem.executorOfficer || '-'}</strong></div>
              </div>

              {selectedItem.beforePhotos && selectedItem.beforePhotos.length > 0 && (
                <div className="space-y-1">
                  <div className="text-gray-400 font-bold text-[10px]">Foto Sebelum Peleburan:</div>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedItem.beforePhotos.map((p, i) => (
                      <img key={i} src={p} alt="Before" className="w-full h-28 object-cover rounded border border-gray-700" />
                    ))}
                  </div>
                </div>
              )}

              {selectedItem.afterPhotos && selectedItem.afterPhotos.length > 0 && (
                <div className="space-y-1">
                  <div className="text-gray-400 font-bold text-[10px]">Foto Residu / Scrap:</div>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedItem.afterPhotos.map((p, i) => (
                      <img key={i} src={p} alt="After" className="w-full h-28 object-cover rounded border border-gray-700" />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-[#0F1319] border-t border-gray-800 p-3 flex justify-end">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded font-bold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BERITA ACARA PRINTABLE VIEW */}
      {showCertificateModal && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in font-mono text-xs">
          <div className="bg-[#12151B] border-2 border-orange-600 rounded-xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
            <div className="bg-[#0A0D12] border-b border-gray-800 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-orange-400" />
                <div>
                  <h3 className="font-bold text-sm text-gray-100">
                    LEMBAR RESMI BERITA ACARA PEMUSNAHAN BARANG BUKTI
                  </h3>
                  <p className="text-[10px] text-gray-400">
                    Dapat dicetak langsung atau diunduh otomatis menjadi file gambar PNG / JPG resolusi tinggi.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCertificateModal(null)}
                className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Document Sheet to be exported as Image */}
            <div className="p-4 overflow-y-auto flex-1 bg-black/40">
              <div 
                id="destruction-certificate-sheet"
                className="p-7 space-y-4 bg-[#0F1318] border-2 border-orange-700/80 rounded-xl shadow-2xl relative overflow-hidden text-gray-200 font-mono"
                style={{ minWidth: '550px' }}
              >
                {/* Background Police Seal Watermark */}
                <div className="absolute right-6 top-1/3 opacity-5 pointer-events-none select-none text-white text-9xl font-black rotate-12">
                  HSPD
                </div>

                {/* Header Kop Surat Polisi */}
                <div className="border-b-2 border-orange-600/60 pb-3 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-[11px] tracking-widest uppercase text-amber-400 font-bold flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-amber-400 inline" />
                      <span>HIGH SPEED POLICE DEPARTMENT (HSPD)</span>
                    </div>
                    <div className="text-[9px] text-gray-400 uppercase tracking-wider">
                      DIVISION OF EVIDENCE PRESERVATION, IMPOUND & DISPOSAL FACILITY
                    </div>
                    <div className="text-[8px] text-gray-500 font-mono">
                      HEADQUARTERS STATION 01 • MISSION ROW • LOS SANTOS STATE POLICE
                    </div>
                  </div>
                  <div className="text-right border border-orange-700/60 bg-orange-950/40 px-3 py-1.5 rounded">
                    <div className="text-[8px] uppercase text-orange-300 font-bold">STATUS PEMUSNAHAN</div>
                    <div className="text-[11px] font-bold text-emerald-400">
                      {showCertificateModal.status === 'SMELTED_DESTROYED' ? '✓ SELESAI DILEBUR' : 'TERJADWAL / DISETUJUI'}
                    </div>
                  </div>
                </div>

                {/* Title & Document Number */}
                <div className="text-center py-1 space-y-1">
                  <h2 className="text-base font-black text-gray-100 uppercase tracking-widest">
                    BERITA ACARA PELEBURAN & PEMUSNAHAN SITAAN
                  </h2>
                  <div className="inline-block px-3 py-1 bg-orange-950/60 border border-orange-700 text-orange-300 rounded font-mono text-xs font-bold">
                    NO. REGISTRASI: {showCertificateModal.destructionNumber}
                  </div>
                </div>

                <p className="text-xs text-gray-300 leading-relaxed text-justify">
                  Pada hari ini, tanggal <strong>{showCertificateModal.scheduledDate}</strong>, bertempat di fasilitas <strong>{showCertificateModal.facilityLocation}</strong>, telah resmi dilaksanakan proses peleburan tungku baja dan pemusnahan permanen atas barang sitaan / barang bukti kejahatan berikut:
                </p>

                {/* Detail Data Box */}
                <div className="bg-[#161B22] p-4 rounded-lg border border-gray-700 space-y-2 text-xs">
                  <div className="grid grid-cols-3 gap-1 border-b border-gray-800 pb-1.5">
                    <span className="text-gray-400 font-bold">Judul / Objek Sitaan:</span>
                    <span className="col-span-2 font-bold text-gray-100">{showCertificateModal.title}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-1 border-b border-gray-800 pb-1.5">
                    <span className="text-gray-400 font-bold">Kategori / Tipe:</span>
                    <span className="col-span-2 text-orange-300 font-bold">{showCertificateModal.itemType}</span>
                  </div>

                  {showCertificateModal.vehicleDetails && (
                    <>
                      <div className="grid grid-cols-3 gap-1 border-b border-gray-800 pb-1.5">
                        <span className="text-gray-400 font-bold">Model & Plat Kendaraan:</span>
                        <span className="col-span-2 font-mono font-bold text-amber-300">
                          {showCertificateModal.vehicleDetails.plateNumber} — {showCertificateModal.vehicleDetails.model} ({showCertificateModal.vehicleDetails.color})
                        </span>
                      </div>
                      {showCertificateModal.vehicleDetails.vinNumber && (
                        <div className="grid grid-cols-3 gap-1 border-b border-gray-800 pb-1.5">
                          <span className="text-gray-400">Nomor Rangka / VIN:</span>
                          <span className="col-span-2 font-mono text-gray-300">{showCertificateModal.vehicleDetails.vinNumber}</span>
                        </div>
                      )}
                    </>
                  )}

                  {showCertificateModal.weaponDetails && (
                    <div className="grid grid-cols-3 gap-1 border-b border-gray-800 pb-1.5">
                      <span className="text-gray-400 font-bold">Model & Serial Senpi:</span>
                      <span className="col-span-2 font-mono font-bold text-rose-300">
                        {showCertificateModal.weaponDetails.weaponModel} (SN: {showCertificateModal.weaponDetails.serialNumber}) • Kaliber: {showCertificateModal.weaponDetails.caliber}
                      </span>
                    </div>
                  )}

                  {showCertificateModal.narcoticsDetails && (
                    <div className="grid grid-cols-3 gap-1 border-b border-gray-800 pb-1.5">
                      <span className="text-gray-400 font-bold">Zat & Berat Narkotika:</span>
                      <span className="col-span-2 font-mono font-bold text-purple-300">
                        {showCertificateModal.narcoticsDetails.substanceType} — {showCertificateModal.narcoticsDetails.weightGrams} gram ({showCertificateModal.narcoticsDetails.packaging})
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-1 border-b border-gray-800 pb-1.5">
                    <span className="text-gray-400 font-bold">Alasan Peleburan:</span>
                    <span className="col-span-2 text-gray-300">{showCertificateModal.reasonDescription || 'Pemusnahan barang bukti sitaan tindak pidana & kendaraan bodong.'}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-gray-400 font-bold">Eksekutor Tungku:</span>
                    <span className="col-span-2 text-gray-200">{showCertificateModal.executorOfficer || showCertificateModal.registeredBy}</span>
                  </div>
                </div>

                {/* Residu & scrap note */}
                <div className="p-2.5 bg-[#0D1117] rounded border border-gray-800 text-[10px] text-gray-400 flex items-center justify-between">
                  <div>
                    <span className="text-gray-300 font-bold">METODE PEMUSNAHAN:</span> Peleburan suhu tinggi (&gt;1500°C) hingga mencair menjadi logam daur ulang murni tanpa sisa komponen fungsional.
                  </div>
                  <div className="text-right shrink-0 pl-3 font-mono text-[9px] text-orange-400">
                    CERT-ID: #{showCertificateModal.id.slice(0, 8)}
                  </div>
                </div>

                {/* Signatures and Stamp Block */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t-2 border-gray-800 text-center text-[10px]">
                  {/* Left: Registering Officer */}
                  <div className="space-y-6 flex flex-col justify-between">
                    <div className="text-gray-400">Petugas Pendaftar / Verifikator:</div>
                    <div className="border-t border-gray-700 pt-1 font-bold text-gray-200">
                      <div>{showCertificateModal.registeredBy}</div>
                      <div className="text-[9px] text-gray-400 font-normal">Badge #{showCertificateModal.registeredByBadge} • Divisi Logistik</div>
                    </div>
                  </div>

                  {/* Right: High Command Signature & Official Stamp */}
                  <div className="space-y-4 flex flex-col justify-between relative">
                    {/* STEMPEL BASAH HSPD DISPOSAL */}
                    <div className="absolute right-4 top-1/4 -translate-y-1/2 border-2 border-orange-500/80 rounded-full w-24 h-24 flex items-center justify-center rotate-[-15deg] pointer-events-none opacity-85 text-orange-500 font-bold text-[8px] leading-tight text-center p-1 bg-orange-950/20">
                      <div>
                        ★ HSPD DISPOSAL ★<br/>
                        OFFICIALLY<br/>
                        DESTROYED<br/>
                        {showCertificateModal.scheduledDate}
                      </div>
                    </div>

                    <div className="text-gray-400">Mengetahui & Menyetujui:</div>
                    <div className="border-t border-gray-700 pt-1 font-bold text-amber-300 z-10">
                      <div>{showCertificateModal.authorizedBy || 'CHIEF OF POLICE / HIGH COMMAND'}</div>
                      <div className="text-[9px] text-orange-400 font-bold tracking-wider">HSPD HIGH COMMAND AUTHORIZATION</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Bar with PNG, JPG & Print */}
            <div className="bg-[#0A0D12] border-t border-gray-800 p-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {/* Export PNG */}
                <button
                  onClick={() => handleExportCertificateImage('png')}
                  disabled={isExportingImage !== null}
                  className="px-3 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white rounded font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-emerald-900/30"
                  title="Unduh Lembar Berita Acara sebagai file gambar PNG jernih"
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
                  onClick={() => handleExportCertificateImage('jpeg')}
                  disabled={isExportingImage !== null}
                  className="px-3 py-2 bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white rounded font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-blue-900/30"
                  title="Unduh Lembar Berita Acara sebagai file gambar JPG ringkas"
                >
                  {isExportingImage === 'jpeg' ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ImageIcon className="w-3.5 h-3.5" />
                  )}
                  <span>Unduh JPG</span>
                </button>

                {/* Native Print */}
                <button
                  onClick={() => window.print()}
                  className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-gray-400" />
                  <span>Cetak / PDF</span>
                </button>
              </div>

              <button
                onClick={() => setShowCertificateModal(null)}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded font-bold transition cursor-pointer"
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
