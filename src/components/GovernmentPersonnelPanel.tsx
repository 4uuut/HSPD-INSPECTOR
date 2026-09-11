import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Crown, 
  Search, 
  Trash2, 
  Edit3, 
  Key, 
  Phone, 
  CheckCircle2, 
  AlertTriangle, 
  Save, 
  X, 
  RefreshCw,
  Building2,
  FileCheck,
  Eye,
  EyeOff
} from 'lucide-react';
import { 
  GovernmentAccount, 
  GovernmentRankLevel, 
  GovernmentDivision, 
  ALL_GOVERNMENT_RANKS, 
  ALL_GOVERNMENT_DIVISIONS,
  OfficerProfile,
  canManageGovernmentPersonnel
} from '../types';
import { 
  getGovernmentRoster, 
  saveGovernmentRoster, 
  addGovernmentAccount, 
  updateGovernmentAccount, 
  deleteGovernmentAccount,
  DEFAULT_GOVERNMENT_ROSTER
} from '../utils/governmentStorage';
import { pullLatestFromFirestore, syncCollectionWithFirestore } from '../services/firebaseRealtimeSync';

interface GovernmentPersonnelPanelProps {
  currentOfficer?: OfficerProfile | null;
  onSelectOfficialForLetter?: (official: GovernmentAccount) => void;
}

export const GovernmentPersonnelPanel: React.FC<GovernmentPersonnelPanelProps> = ({
  currentOfficer,
  onSelectOfficialForLetter
}) => {
  const [roster, setRoster] = useState<GovernmentAccount[]>(getGovernmentRoster);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRank, setFilterRank] = useState<string>('ALL');
  const [filterDivision, setFilterDivision] = useState<string>('ALL');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Modal / Form state for Adding New Member
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newBadge, setNewBadge] = useState('');
  const [newRank, setNewRank] = useState<GovernmentRankLevel>('STAFF [RANK 1]');
  const [newDivision, setNewDivision] = useState<GovernmentDivision>('Government Affairs Official');
  const [newPin, setNewPin] = useState('10-4');
  const [newPhone, setNewPhone] = useState('555-');
  const [newDiscord, setNewDiscord] = useState('@');
  const [showPin, setShowPin] = useState(false);

  // Edit Modal State
  const [editingOfficial, setEditingOfficial] = useState<GovernmentAccount | null>(null);
  const [editPin, setEditPin] = useState('');

  // Determine if current logged-in user has authorization to manage government personnel
  const hasManageAuth = currentOfficer?.accountType === 'GOVERNMENT' 
    ? canManageGovernmentPersonnel(currentOfficer.govRank || currentOfficer.rank)
    : (currentOfficer?.rank?.toUpperCase().includes('CHIEF') || currentOfficer?.rank?.toUpperCase().includes('COMMANDER'));

  // Load and subscribe to real-time changes
  useEffect(() => {
    const handleUpdate = () => {
      setRoster(getGovernmentRoster());
    };
    window.addEventListener('hspd-gov-roster-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    // Initial pull from cloud
    pullLatestFromFirestore<GovernmentAccount>('GOVERNMENT_ROSTER' as any).then((cloud) => {
      if (cloud && Array.isArray(cloud) && cloud.length > 0) {
        saveGovernmentRoster(cloud);
        setRoster(cloud);
      }
    }).catch(() => {});

    return () => {
      window.removeEventListener('hspd-gov-roster-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Compute next suggested badge number
  useEffect(() => {
    if (showAddForm && !newBadge) {
      let maxNum = 1;
      roster.forEach(r => {
        const match = r.badge.match(/#GOV-(\d+)/i);
        if (match && match[1]) {
          const n = parseInt(match[1], 10);
          if (n > maxNum) maxNum = n;
        }
      });
      const nextNum = maxNum + 1;
      setNewBadge(`#GOV-${String(nextNum).padStart(2, '0')}`);
    }
  }, [showAddForm, roster, newBadge]);

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleSyncCloud = async () => {
    setIsSyncing(true);
    try {
      const cloud = await pullLatestFromFirestore<GovernmentAccount>('GOVERNMENT_ROSTER' as any);
      if (cloud && Array.isArray(cloud) && cloud.length > 0) {
        saveGovernmentRoster(cloud);
        setRoster(cloud);
        showFeedback('success', `Berhasil menyinkronkan ${cloud.length} data aparatur dari Cloud Firestore.`);
      } else {
        await syncCollectionWithFirestore('GOVERNMENT_ROSTER' as any, roster, true);
        showFeedback('success', 'Data aparatur pemerintah saat ini berhasil diunggah ke Cloud Firestore.');
      }
    } catch {
      showFeedback('error', 'Gagal menyinkronkan dengan Cloud Firestore.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      showFeedback('error', 'Nama lengkap pejabat wajib diisi!');
      return;
    }
    if (!newBadge.trim()) {
      showFeedback('error', 'Nomor Badge / Callsign pemerintahan wajib diisi!');
      return;
    }

    const result = addGovernmentAccount({
      name: newName.trim(),
      badge: newBadge.trim(),
      rank: newRank,
      division: newDivision,
      pin: newPin.trim() || '10-4',
      phone: newPhone.trim(),
      discordTag: newDiscord.trim(),
      registeredBy: currentOfficer ? `${currentOfficer.name} (${currentOfficer.rank})` : 'Presidential Appointment'
    });

    if (result.success) {
      showFeedback('success', result.message);
      setNewName('');
      setNewBadge('');
      setNewPin('10-4');
      setNewPhone('555-');
      setNewDiscord('@');
      setShowAddForm(false);
      setRoster(getGovernmentRoster());
    } else {
      showFeedback('error', result.message);
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOfficial) return;

    const result = updateGovernmentAccount({
      ...editingOfficial,
      pin: editPin.trim() || editingOfficial.pin
    });

    if (result.success) {
      showFeedback('success', result.message);
      setEditingOfficial(null);
      setRoster(getGovernmentRoster());
    } else {
      showFeedback('error', result.message);
    }
  };

  const handleDelete = (official: GovernmentAccount) => {
    if (official.name.toLowerCase().includes('momo hatakeyama') || official.badge === '#GOV-01') {
      showFeedback('error', 'Jabatan Presiden Negara (Momo Hatakeyama) tidak dapat dihapus dari sistem!');
      return;
    }

    if (!window.confirm(`Yakin ingin menonaktifkan pejabat ${official.name} (${official.badge} - ${official.rank}) dari jajaran pemerintahan?`)) {
      return;
    }

    const res = deleteGovernmentAccount(official.id);
    if (res.success) {
      showFeedback('success', res.message);
      setRoster(getGovernmentRoster());
    } else {
      showFeedback('error', res.message);
    }
  };

  // Filter roster
  const filteredRoster = roster.filter(r => {
    const q = searchQuery.toLowerCase().trim();
    const matchQuery = !q || 
      r.name.toLowerCase().includes(q) || 
      r.badge.toLowerCase().includes(q) || 
      r.division.toLowerCase().includes(q) || 
      r.rank.toLowerCase().includes(q);
    const matchRank = filterRank === 'ALL' || r.rank === filterRank;
    const matchDiv = filterDivision === 'ALL' || r.division === filterDivision;
    return matchQuery && matchRank && matchDiv;
  });

  // Rank badge styling helper
  const getRankBadgeStyle = (rank: string) => {
    if (rank.includes('RANK 6') || rank.includes('PRESIDENT')) {
      return 'bg-amber-950/80 text-amber-300 border-amber-500/80 shadow-sm shadow-amber-900/30';
    }
    if (rank.includes('RANK 5') || rank.includes('VICE')) {
      return 'bg-amber-900/50 text-amber-200 border-amber-600/60';
    }
    if (rank.includes('RANK 4') || rank.includes('SECRETARY')) {
      return 'bg-purple-950/70 text-purple-300 border-purple-700/60';
    }
    if (rank.includes('RANK 3') || rank.includes('CABINET') || rank.includes('DIRECTORS')) {
      return 'bg-blue-950/70 text-blue-300 border-blue-700/60';
    }
    if (rank.includes('RANK 2') || rank.includes('HIGH')) {
      return 'bg-cyan-950/70 text-cyan-300 border-cyan-700/60';
    }
    return 'bg-gray-800 text-gray-300 border-gray-700';
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Action Header */}
      <div className="bg-[#111622] border border-amber-900/50 rounded-xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
        <div className="absolute -right-6 -top-6 w-36 h-36 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-600/30 to-amber-950 border border-amber-500/50 flex items-center justify-center text-2xl shadow-lg shrink-0">
              🏛️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-gray-100 font-sans tracking-tight">
                  Aparatur & Jajaran Pejabat Pemerintahan
                </h2>
                <span className="text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-700/70 px-2 py-0.5 rounded font-bold">
                  STATE GOVERNMENT
                </span>
              </div>
              <p className="text-xs text-gray-400 font-mono mt-0.5">
                Direktori resmi eksekutif, direksi, staf penegakan hukum negara, dan koordinasi dokumen resmi HighState.
              </p>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleSyncCloud}
              disabled={isSyncing}
              className="px-3 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-300 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
              title="Sinkronkan database aparatur pemerintah dengan Cloud Firestore"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Sinkronisasi...' : 'Sinkron Cloud'}</span>
            </button>

            <button
              type="button"
              id="btn-add-gov-member"
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 shadow-lg shadow-amber-950/40 active:scale-95"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{showAddForm ? 'Tutup Formulir' : '+ Angkat Pejabat Baru'}</span>
            </button>
          </div>
        </div>

        {/* Executive Summary Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-4 border-t border-gray-800/80 font-mono text-xs">
          <div className="bg-[#0D1117] border border-gray-800 rounded-lg p-2.5 flex items-center gap-2.5">
            <Crown className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <div className="text-[10px] text-gray-500 uppercase">Presiden & Pimpinan</div>
              <div className="text-sm font-bold text-amber-300">
                {roster.filter(r => r.rank.includes('PRESIDENT') || r.rank.includes('RANK 6') || r.rank.includes('RANK 5')).length} Pejabat
              </div>
            </div>
          </div>

          <div className="bg-[#0D1117] border border-gray-800 rounded-lg p-2.5 flex items-center gap-2.5">
            <Building2 className="w-5 h-5 text-purple-400 shrink-0" />
            <div>
              <div className="text-[10px] text-gray-500 uppercase">Sekretaris & Kabinet</div>
              <div className="text-sm font-bold text-purple-300">
                {roster.filter(r => r.rank.includes('RANK 4') || r.rank.includes('RANK 3')).length} Pejabat
              </div>
            </div>
          </div>

          <div className="bg-[#0D1117] border border-gray-800 rounded-lg p-2.5 flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-blue-400 shrink-0" />
            <div>
              <div className="text-[10px] text-gray-500 uppercase">Pejabat Tinggi & Staf</div>
              <div className="text-sm font-bold text-blue-300">
                {roster.filter(r => r.rank.includes('RANK 2') || r.rank.includes('RANK 1')).length} Pejabat
              </div>
            </div>
          </div>

          <div className="bg-[#0D1117] border border-gray-800 rounded-lg p-2.5 flex items-center gap-2.5">
            <Users className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="text-[10px] text-gray-500 uppercase">Total Seluruh Aparatur</div>
              <div className="text-sm font-bold text-emerald-300">
                {roster.length} Personel
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedbackMsg && (
        <div className={`p-3 rounded-lg text-xs font-mono flex items-center gap-2 animate-fadeIn ${
          feedbackMsg.type === 'success' 
            ? 'bg-emerald-950/80 border border-emerald-500 text-emerald-300' 
            : 'bg-rose-950/80 border border-rose-500 text-rose-300'
        }`}>
          {feedbackMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Collapsible Form for Adding New Government Official */}
      {showAddForm && (
        <div className="bg-[#131823] border-2 border-amber-500/60 rounded-xl p-4 sm:p-5 shadow-2xl animate-fadeIn space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <div className="flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-sm text-gray-100">
                PENGANGKATAN / REGISTRASI PEJABAT PEMERINTAHAN BARU
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-gray-500 hover:text-gray-300 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Field: Nama Pejabat */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-300 block">
                  NAMA LENGKAP KARAKTER PEJABAT <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Contoh: Frank Underwood"
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 focus:border-amber-500 rounded-lg text-xs text-gray-100 outline-none"
                  required
                />
              </div>

              {/* Field: Nomor Badge / Callsign */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-300 block">
                  NOMOR CALLSIGN / BADGE PEMERINTAH <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={newBadge}
                  onChange={(e) => setNewBadge(e.target.value)}
                  placeholder="#GOV-02"
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 focus:border-amber-500 rounded-lg text-xs text-gray-100 outline-none"
                  required
                />
                <span className="text-[10px] text-gray-500">Format standar: #GOV-XX</span>
              </div>

              {/* Field: Pangkat / Rank */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-300 block">
                  PANGKAT / TINGKATAN JABATAN <span className="text-rose-400">*</span>
                </label>
                <select
                  value={newRank}
                  onChange={(e) => setNewRank(e.target.value as GovernmentRankLevel)}
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 focus:border-amber-500 rounded-lg text-xs text-amber-300 font-bold outline-none"
                >
                  {ALL_GOVERNMENT_RANKS.map((rk) => (
                    <option key={rk} value={rk} className="bg-gray-900 text-gray-200">
                      {rk}
                    </option>
                  ))}
                </select>
              </div>

              {/* Field: Devisi / Departemen */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-300 block">
                  DEVISI / DEPARTEMEN TUGAS <span className="text-rose-400">*</span>
                </label>
                <select
                  value={newDivision}
                  onChange={(e) => setNewDivision(e.target.value as GovernmentDivision)}
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 focus:border-amber-500 rounded-lg text-xs text-blue-300 outline-none"
                >
                  {ALL_GOVERNMENT_DIVISIONS.map((div) => (
                    <option key={div} value={div} className="bg-gray-900 text-gray-200">
                      {div}
                    </option>
                  ))}
                </select>
              </div>

              {/* Field: PIN Pribadi */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-300 block">
                  PIN PRIBADI LOGIN <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder="10-4"
                    className="w-full pl-3 pr-9 py-2 bg-[#0D1117] border border-gray-700 focus:border-amber-500 rounded-lg text-xs text-gray-100 outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-2.5 top-2.5 text-gray-500 hover:text-gray-300"
                  >
                    {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <span className="text-[10px] text-gray-500">PIN default untuk login: 10-4</span>
              </div>

              {/* Field: No Telepon & Discord */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-300 block">
                  NO TELEPON & TAG DISCORD
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="555-XXXX"
                    className="w-full px-2 py-2 bg-[#0D1117] border border-gray-700 rounded-lg text-xs text-gray-100 outline-none"
                  />
                  <input
                    type="text"
                    value={newDiscord}
                    onChange={(e) => setNewDiscord(e.target.value)}
                    placeholder="@discord"
                    className="w-full px-2 py-2 bg-[#0D1117] border border-gray-700 rounded-lg text-xs text-gray-100 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Submit & Cancel Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-800">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-bold"
              >
                Batal
              </button>
              <button
                type="submit"
                id="btn-submit-new-gov-official"
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold shadow-lg shadow-amber-950/50 flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Sah Kan Pengangkatan Pejabat</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter and Search Controls */}
      <div className="bg-[#111622] border border-gray-800 rounded-xl p-3 sm:p-4 flex flex-col md:flex-row items-center justify-between gap-3 font-mono text-xs">
        <div className="w-full md:w-80 relative">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama, badge (#GOV), pangkat, divisi..."
            className="w-full pl-9 pr-3 py-2 bg-[#0D1117] border border-gray-700 focus:border-amber-500 rounded-lg text-xs text-gray-100 placeholder:text-gray-600 outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Rank Filter */}
          <select
            value={filterRank}
            onChange={(e) => setFilterRank(e.target.value)}
            className="px-2.5 py-2 bg-[#0D1117] border border-gray-700 text-amber-400 rounded-lg text-xs font-bold outline-none"
          >
            <option value="ALL">Semua Tingkatan Pangkat</option>
            {ALL_GOVERNMENT_RANKS.map(rk => (
              <option key={rk} value={rk}>{rk}</option>
            ))}
          </select>

          {/* Division Filter */}
          <select
            value={filterDivision}
            onChange={(e) => setFilterDivision(e.target.value)}
            className="px-2.5 py-2 bg-[#0D1117] border border-gray-700 text-blue-400 rounded-lg text-xs outline-none"
          >
            <option value="ALL">Semua Devisi Pemerintahan</option>
            {ALL_GOVERNMENT_DIVISIONS.map(div => (
              <option key={div} value={div}>{div}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Roster Table of Officials */}
      <div className="bg-[#111622] border border-gray-800 rounded-xl overflow-hidden shadow-xl font-mono text-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0D1117] border-b border-gray-800 text-[11px] text-gray-400 uppercase tracking-wider">
                <th className="py-3 px-3.5">Callsign</th>
                <th className="py-3 px-3.5">Nama Pejabat</th>
                <th className="py-3 px-3.5">Pangkat / Tingkat</th>
                <th className="py-3 px-3.5">Devisi & Departemen</th>
                <th className="py-3 px-3.5">Kontak</th>
                <th className="py-3 px-3.5">PIN Login</th>
                <th className="py-3 px-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/70">
              {filteredRoster.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500 font-sans text-xs">
                    Tidak ada data pejabat pemerintah yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredRoster.map((official) => {
                  const isPresident = official.name.toLowerCase().includes('momo hatakeyama') || official.badge === '#GOV-01' || official.rank.includes('RANK 6');
                  return (
                    <tr 
                      key={official.id} 
                      className={`hover:bg-gray-800/40 transition ${
                        isPresident ? 'bg-amber-950/20' : ''
                      }`}
                    >
                      {/* Badge / Callsign */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span className="font-bold text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded text-xs">
                          {official.badge}
                        </span>
                      </td>

                      {/* Name */}
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-2">
                          {isPresident && <Crown className="w-4 h-4 text-amber-400 shrink-0" />}
                          <span className={`font-bold text-sm ${isPresident ? 'text-amber-200' : 'text-gray-100'}`}>
                            {official.name}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-500 block">
                          Terdaftar: {new Date(official.registeredAt).toLocaleDateString('id-ID')}
                        </span>
                      </td>

                      {/* Rank */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${getRankBadgeStyle(official.rank)}`}>
                          {official.rank}
                        </span>
                      </td>

                      {/* Division */}
                      <td className="py-3 px-3.5">
                        <div className="text-gray-300 font-medium text-xs">
                          {official.division}
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3 px-3.5 whitespace-nowrap text-[11px] text-gray-400">
                        {official.phone && <div>📞 {official.phone}</div>}
                        {official.discordTag && <div>💬 {official.discordTag}</div>}
                        {!official.phone && !official.discordTag && <span className="text-gray-600">-</span>}
                      </td>

                      {/* PIN Status */}
                      <td className="py-3 px-3.5 whitespace-nowrap text-[11px]">
                        <span className="text-gray-400 font-mono">
                          {official.pin ? '••••' : '10-4'}
                        </span>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {onSelectOfficialForLetter && (
                            <button
                              type="button"
                              onClick={() => onSelectOfficialForLetter(official)}
                              className="p-1.5 bg-blue-950/80 hover:bg-blue-900 border border-blue-700/60 text-blue-300 rounded text-[10px] flex items-center gap-1"
                              title="Tujukan Surat Resmi ke Pejabat Ini"
                            >
                              <FileCheck className="w-3 h-3" />
                              <span className="hidden sm:inline">Surat</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setEditingOfficial(official);
                              setEditPin(official.pin || '10-4');
                            }}
                            className="p-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 rounded"
                            title="Edit Data / Pangkat / PIN Pejabat"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {!isPresident && (
                            <button
                              type="button"
                              onClick={() => handleDelete(official)}
                              className="p-1.5 bg-rose-950/60 hover:bg-rose-900 border border-rose-800/60 text-rose-300 rounded"
                              title="Nonaktifkan Pejabat"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
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

      {/* Edit Official Modal */}
      {editingOfficial && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#131823] border border-amber-500/70 rounded-xl p-5 max-w-lg w-full shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm text-gray-100">
                  EDIT DATA PEJABAT: {editingOfficial.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingOfficial(null)}
                className="text-gray-500 hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3">
              <div>
                <label className="text-gray-400 text-[11px] block mb-1">Nomor Callsign / Badge:</label>
                <input
                  type="text"
                  value={editingOfficial.badge}
                  onChange={(e) => setEditingOfficial({ ...editingOfficial, badge: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 rounded text-gray-100"
                  required
                />
              </div>

              <div>
                <label className="text-gray-400 text-[11px] block mb-1">Pangkat / Tingkat Jabatan:</label>
                <select
                  value={editingOfficial.rank}
                  onChange={(e) => setEditingOfficial({ ...editingOfficial, rank: e.target.value as GovernmentRankLevel })}
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 rounded text-amber-300 font-bold"
                >
                  {ALL_GOVERNMENT_RANKS.map(rk => (
                    <option key={rk} value={rk} className="bg-gray-900 text-gray-100">{rk}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-gray-400 text-[11px] block mb-1">Devisi / Departemen:</label>
                <select
                  value={editingOfficial.division}
                  onChange={(e) => setEditingOfficial({ ...editingOfficial, division: e.target.value as GovernmentDivision })}
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 rounded text-blue-300"
                >
                  {ALL_GOVERNMENT_DIVISIONS.map(div => (
                    <option key={div} value={div} className="bg-gray-900 text-gray-100">{div}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-gray-400 text-[11px] block mb-1">PIN Pribadi Login:</label>
                <input
                  type="text"
                  value={editPin}
                  onChange={(e) => setEditPin(e.target.value)}
                  placeholder="10-4"
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 rounded text-gray-100"
                  required
                />
              </div>

              <div>
                <label className="text-gray-400 text-[11px] block mb-1">No Telepon:</label>
                <input
                  type="text"
                  value={editingOfficial.phone || ''}
                  onChange={(e) => setEditingOfficial({ ...editingOfficial, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 rounded text-gray-100"
                />
              </div>

              <div>
                <label className="text-gray-400 text-[11px] block mb-1">Tag Discord:</label>
                <input
                  type="text"
                  value={editingOfficial.discordTag || ''}
                  onChange={(e) => setEditingOfficial({ ...editingOfficial, discordTag: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 rounded text-gray-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setEditingOfficial(null)}
                  className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded font-bold"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
