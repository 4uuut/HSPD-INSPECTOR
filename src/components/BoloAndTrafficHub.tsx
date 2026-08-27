import React, { useState, useMemo } from 'react';
import { 
  Radio, Car, AlertTriangle, ShieldAlert, Plus, CheckCircle2, 
  Trash2, Search, MapPin, Clock, FileText, User, Filter, X,
  ExternalLink, Key, Tag, ShieldCheck, DollarSign, Calendar,
  Send, RefreshCw, AlertCircle
} from 'lucide-react';
import { BoloAlert, ImpoundRecord, OfficerProfile, isOfficerHighRank } from '../types';
import { 
  sendBoloAlertToDiscord, 
  getSavedBoloWebhookConfig, 
  sendImpoundRecordToDiscord, 
  getSavedImpoundWebhookConfig 
} from '../utils/discordWebhook';

interface Props {
  boloList: BoloAlert[];
  impoundList: ImpoundRecord[];
  currentOfficer: OfficerProfile;
  onSaveBolo: (bolos: BoloAlert[]) => void;
  onSaveImpound: (impounds: ImpoundRecord[]) => void;
}

export const BoloAndTrafficHub: React.FC<Props> = ({
  boloList,
  impoundList,
  currentOfficer,
  onSaveBolo,
  onSaveImpound
}) => {
  const isHighRank = isOfficerHighRank(currentOfficer.rank);
  const [activeSubTab, setActiveSubTab] = useState<'bolo' | 'impound'>('bolo');

  // Search & Filter States
  const [searchBolo, setSearchBolo] = useState('');
  const [searchImpound, setSearchImpound] = useState('');
  const [discordNotice, setDiscordNotice] = useState<{ success: boolean; message: string } | null>(null);
  const [isSendingDiscord, setIsSendingDiscord] = useState(false);

  // BOLO Modal Form State
  const [isBoloModalOpen, setIsBoloModalOpen] = useState(false);
  const [boloTitle, setBoloTitle] = useState('');
  const [boloType, setBoloType] = useState<any>('VEHICLE');
  const [boloDanger, setBoloDanger] = useState<any>('HIGH');
  const [boloLocation, setBoloLocation] = useState('');
  const [boloDesc, setBoloDesc] = useState('');

  // Impound Modal Form State
  const [isImpoundModalOpen, setIsImpoundModalOpen] = useState(false);
  const [impPlate, setImpPlate] = useState('');
  const [impModel, setImpModel] = useState('');
  const [impColor, setImpColor] = useState('');
  const [impOwner, setImpOwner] = useState('');
  const [impReason, setImpReason] = useState('');
  const [impDays, setImpDays] = useState(3);
  const [impFee, setImpFee] = useState(15000);
  const [impLocation, setImpLocation] = useState('Commerce, Los Santos');

  // Filtered BOLO
  const filteredBolos = useMemo(() => {
    return boloList.filter(b => {
      const q = searchBolo.toLowerCase().trim();
      return !q || b.title.toLowerCase().includes(q) || b.description.toLowerCase().includes(q) || b.lastSeenLocation.toLowerCase().includes(q);
    });
  }, [boloList, searchBolo]);

  // Filtered Impound
  const filteredImpounds = useMemo(() => {
    return impoundList.filter(i => {
      const q = searchImpound.toLowerCase().trim();
      return !q || 
        i.plateNumber.toLowerCase().includes(q) || 
        i.vehicleModel.toLowerCase().includes(q) || 
        i.ownerName.toLowerCase().includes(q) ||
        i.reason.toLowerCase().includes(q);
    });
  }, [impoundList, searchImpound]);

  // Handle Add BOLO
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

    // Auto send BOLO to Discord
    const cfg = getSavedBoloWebhookConfig();
    if (cfg.webhookUrl && cfg.autoSendOnSave) {
      sendBoloAlertToDiscord(newBolo, currentOfficer).then(res => {
        setDiscordNotice(res);
        setTimeout(() => setDiscordNotice(null), 4000);
      }).catch(() => {});
    }
  };

  // Handle Delete / Clear BOLO
  const handleDeleteBolo = (boloId: string) => {
    onSaveBolo(boloList.filter(b => b.id !== boloId));
  };

  // Manual Send BOLO
  const handleManualSendBolo = async (bolo: BoloAlert) => {
    setIsSendingDiscord(true);
    try {
      const res = await sendBoloAlertToDiscord(bolo, currentOfficer);
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

  // Handle Add Impound
  const handleAddImpound = (e: React.FormEvent) => {
    e.preventDefault();
    if (!impPlate.trim() || !impModel.trim()) return;

    const newImp: ImpoundRecord = {
      id: `IMP-${Date.now()}`,
      plateNumber: impPlate.trim().toUpperCase(),
      vehicleModel: impModel.trim(),
      color: impColor.trim() || 'Hitam',
      ownerName: impOwner.trim() || 'Tidak Diketahui / Bodong',
      reason: impReason.trim() || 'Pelanggaran Lalu Lintas & Penyitaan Penegakan Hukum',
      impoundDays: impDays,
      impoundFee: impFee,
      officerName: currentOfficer.name,
      officerBadge: currentOfficer.badge,
      status: 'IMPOUNDED',
      locationFound: impLocation.trim() || 'Los Santos Area',
      timestamp: Date.now()
    };

    onSaveImpound([newImp, ...impoundList]);
    setIsImpoundModalOpen(false);
    setImpPlate('');
    setImpModel('');
    setImpColor('');
    setImpOwner('');
    setImpReason('');

    // Auto send Impound to Discord
    const cfg = getSavedImpoundWebhookConfig();
    if (cfg.webhookUrl && cfg.autoSendOnSave) {
      sendImpoundRecordToDiscord(newImp, currentOfficer).then(res => {
        setDiscordNotice(res);
        setTimeout(() => setDiscordNotice(null), 4000);
      }).catch(() => {});
    }
  };

  // Manual Send Impound
  const handleManualSendImpound = async (imp: ImpoundRecord) => {
    setIsSendingDiscord(true);
    try {
      const res = await sendImpoundRecordToDiscord(imp, currentOfficer);
      setDiscordNotice(res);
      setTimeout(() => setDiscordNotice(null), 4000);
    } catch (err: any) {
      setDiscordNotice({
        success: false,
        message: err.message || 'Gagal mengirim rekor impound ke Discord.'
      });
    } finally {
      setIsSendingDiscord(false);
    }
  };

  // Handle Release Impound
  const handleToggleReleaseImpound = (impId: string) => {
    const updatedList = impoundList.map(i => {
      if (i.id === impId) {
        const updated = {
          ...i,
          status: (i.status === 'IMPOUNDED' ? 'RELEASED' : 'IMPOUNDED') as 'IMPOUNDED' | 'RELEASED',
          releasedAt: i.status === 'IMPOUNDED' ? Date.now() : undefined
        };
        // If auto send, dispatch updated status
        const cfg = getSavedImpoundWebhookConfig();
        if (cfg.webhookUrl && cfg.autoSendOnSave) {
          sendImpoundRecordToDiscord(updated, currentOfficer).catch(() => {});
        }
        return updated;
      }
      return i;
    });
    onSaveImpound(updatedList);
  };

  // Handle Delete Impound
  const handleDeleteImpound = (impId: string) => {
    if (window.confirm('Hapus rekor impound ini?')) {
      onSaveImpound(impoundList.filter(i => i.id !== impId));
    }
  };

  return (
    <div className="space-y-4 font-mono text-xs text-gray-200">
      {/* Top Banner */}
      <div className="bg-[#161B22] border border-emerald-900/60 rounded-xl p-4 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-700/80 flex items-center justify-center text-emerald-400 shrink-0">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-gray-100 font-sans tracking-tight">
                TRAFFIC ENFORCEMENT & BOLO DISPATCH
              </h2>
              <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.5 rounded font-bold">
                HIGHWAY & PATROL
              </span>
            </div>
            <p className="text-[11px] text-gray-400">
              Pusat peringatan BOLO (Be On Look Out) siaga darurat dan pencatatan sitaan kendaraan / Impound Lot SA-MP.
            </p>
          </div>
        </div>

        {/* Action Switcher & Add Button */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="bg-[#0D1117] border border-gray-800 rounded-lg p-0.5 flex items-center">
            <button
              onClick={() => setActiveSubTab('bolo')}
              className={`px-3 py-1.5 rounded-md font-bold transition flex items-center gap-1.5 ${
                activeSubTab === 'bolo'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>BOLO ALERTS ({boloList.length})</span>
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
          </div>

          {activeSubTab === 'bolo' ? (
            <button
              onClick={() => setIsBoloModalOpen(true)}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg transition flex items-center gap-1.5 shadow-md shadow-rose-600/30 text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>TERBITKAN BOLO</span>
            </button>
          ) : (
            <button
              onClick={() => setIsImpoundModalOpen(true)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition flex items-center gap-1.5 shadow-md shadow-emerald-600/30 text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>SITA KENDARAAN</span>
            </button>
          )}
        </div>
      </div>

      {/* Discord Notification Toast */}
      {discordNotice && (
        <div className={`p-3 rounded-lg text-xs flex items-center gap-2 border animate-in fade-in ${
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

      {/* ================= SECTION 1: BOLO ALERTS ================= */}
      {activeSubTab === 'bolo' && (
        <div className="space-y-3">
          <div className="bg-[#11141A] border border-gray-800 rounded-xl p-3 flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchBolo}
                onChange={(e) => setSearchBolo(e.target.value)}
                placeholder="Cari BOLO kendaraan buronan, ciri pelaku..."
                className="w-full pl-9 pr-3 py-1.5 bg-[#0D1117] border border-gray-700 rounded-lg text-xs text-gray-100 placeholder:text-gray-600 outline-none"
              />
            </div>
            <div className="text-[11px] text-gray-400">
              Menampilkan <strong className="text-rose-400">{filteredBolos.length}</strong> Peringatan Aktif
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredBolos.length === 0 ? (
              <div className="col-span-full bg-[#161B22] border border-gray-800 rounded-xl p-8 text-center text-gray-500">
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
                          className="p-1 bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-700/60 rounded transition"
                          title="Kirim BOLO ini ke Discord Webhook"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteBolo(b.id)}
                          className="text-gray-500 hover:text-rose-400 transition p-1"
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

      {/* ================= SECTION 2: IMPOUND LOT ================= */}
      {activeSubTab === 'impound' && (
        <div className="space-y-3">
          <div className="bg-[#11141A] border border-gray-800 rounded-xl p-3 flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchImpound}
                onChange={(e) => setSearchImpound(e.target.value)}
                placeholder="Cari nomor plat, tipe mobil, atau pemilik..."
                className="w-full pl-9 pr-3 py-1.5 bg-[#0D1117] border border-gray-700 rounded-lg text-xs text-gray-100 placeholder:text-gray-600 outline-none"
              />
            </div>
            <div className="text-[11px] text-gray-400">
              Total Kendaraan Disita: <strong className="text-emerald-400">{filteredImpounds.length}</strong> Unit
            </div>
          </div>

          <div className="bg-[#161B22] border border-gray-800 rounded-xl overflow-x-auto shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0D1117] text-gray-400 uppercase text-[10px] border-b border-gray-800">
                <tr>
                  <th className="py-2.5 px-3">Plat & Kendaraan</th>
                  <th className="py-2.5 px-3">Pemilik Terdaftar</th>
                  <th className="py-2.5 px-3">Alasan Penyitaan</th>
                  <th className="py-2.5 px-3">Durasi / Denda Tebus</th>
                  <th className="py-2.5 px-3">Petugas Penyita</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {filteredImpounds.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-500">
                      Belum ada catatan kendaraan impound.
                    </td>
                  </tr>
                ) : (
                  filteredImpounds.map(imp => (
                    <tr key={imp.id} className="hover:bg-[#1c222b] transition">
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

                      <td className="py-2.5 px-3 font-bold text-gray-200">
                        {imp.ownerName}
                      </td>

                      <td className="py-2.5 px-3 text-[11px] text-gray-300 max-w-xs truncate font-sans" title={imp.reason}>
                        {imp.reason}
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="font-bold text-emerald-400">${imp.impoundFee.toLocaleString('id-ID')}</div>
                        <div className="text-[10px] text-gray-500">{imp.impoundDays} Hari Sitaan</div>
                      </td>

                      <td className="py-2.5 px-3 text-[11px] text-gray-300">
                        {imp.officerName} ({imp.officerBadge})
                      </td>

                      <td className="py-2.5 px-3">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                          imp.status === 'IMPOUNDED'
                            ? 'bg-rose-950 text-rose-300 border-rose-700'
                            : 'bg-emerald-950 text-emerald-300 border-emerald-700'
                        }`}>
                          {imp.status === 'IMPOUNDED' ? '🔒 DISITA' : '✅ DITEBUS'}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleManualSendImpound(imp)}
                            disabled={isSendingDiscord}
                            className="p-1 bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 rounded transition"
                            title="Kirim catatan impound ini ke Discord Webhook"
                          >
                            <Send className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleReleaseImpound(imp.id)}
                            className={`px-2 py-1 rounded text-[10px] font-bold border transition ${
                              imp.status === 'IMPOUNDED'
                                ? 'bg-emerald-950 text-emerald-300 border-emerald-700 hover:bg-emerald-900'
                                : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700'
                            }`}
                            title="Ubah Status Tebusan"
                          >
                            {imp.status === 'IMPOUNDED' ? 'Lepas Sitaan' : 'Sita Kembali'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteImpound(imp.id)}
                            className="p-1 text-gray-500 hover:text-rose-400 transition"
                            title="Hapus Rekor"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL TERBITKAN BOLO */}
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
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 rounded text-xs text-gray-100 outline-none"
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

      {/* MODAL SITA KENDARAAN */}
      {isImpoundModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs font-mono text-xs">
          <div className="bg-[#161B22] border border-emerald-600/70 rounded-xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col">
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

            <form onSubmit={handleAddImpound} className="p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Nomor Plat In-Game *</label>
                  <input
                    type="text"
                    value={impPlate}
                    onChange={(e) => setImpPlate(e.target.value)}
                    placeholder="Contoh: LS-8842"
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 rounded text-xs text-amber-300 font-bold outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Model / Tipe Kendaraan *</label>
                  <input
                    type="text"
                    value={impModel}
                    onChange={(e) => setImpModel(e.target.value)}
                    placeholder="Contoh: Sultan / Elegy / Infernus"
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 rounded text-xs text-gray-100 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Warna Kendaraan</label>
                  <input
                    type="text"
                    value={impColor}
                    onChange={(e) => setImpColor(e.target.value)}
                    placeholder="Contoh: Biru Metalik"
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 rounded text-xs text-gray-100 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Nama Pemilik Kendaraan</label>
                  <input
                    type="text"
                    value={impOwner}
                    onChange={(e) => setImpOwner(e.target.value)}
                    placeholder="Contoh: Kenji Sato"
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 rounded text-xs text-gray-100 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Alasan Penyitaan / Pasal Terkait *</label>
                <input
                  type="text"
                  value={impReason}
                  onChange={(e) => setImpReason(e.target.value)}
                  placeholder="Contoh: Pasal E - Balap Liar & Melarikan Diri dari Petugas"
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 rounded text-xs text-gray-100 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Durasi Sitaan (Hari)</label>
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
                  <label className="text-[10px] text-gray-400 block mb-1">Biaya Tebus ($ SA-MP)</label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={impFee}
                    onChange={(e) => setImpFee(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 rounded text-xs text-emerald-400 font-bold outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsImpoundModalOpen(false)}
                  className="px-4 py-2 bg-gray-800 text-gray-300 rounded text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-xs"
                >
                  Daftarkan Sitaan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
