import React, { useState, useEffect } from 'react';
import { 
  UserCheck, Search, ShieldAlert, Car, Award, 
  FileText, AlertTriangle, CheckCircle2, User, 
  CreditCard, Plus, Shield, Check, Copy, X, ArrowRight,
  Filter, Phone, MapPin
} from 'lucide-react';
import { OfficerProfile, CitizenProfile, DriverLicenseStatus, GunLicenseStatus } from '../types';
import { getSavedCitizens, saveCitizens } from '../utils/citizenDmvStorage';

interface Props {
  currentOfficer: OfficerProfile | null;
}

export const CitizenDmvDatabase: React.FC<Props> = ({ currentOfficer }) => {
  const [citizens, setCitizens] = useState<CitizenProfile[]>(() => getSavedCitizens());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLicense, setFilterLicense] = useState<string>('ALL');
  const [filterGunLicense, setFilterGunLicense] = useState<string>('ALL');
  const [onlyBolo, setOnlyBolo] = useState(false);
  const [selectedCitizen, setSelectedCitizen] = useState<CitizenProfile | null>(null);

  // New Citizen Modal State
  const [isNewCitizenModal, setIsNewCitizenModal] = useState(false);
  const [newCitName, setNewCitName] = useState('');
  const [newCitDob, setNewCitDob] = useState('1995-01-01');
  const [newCitGender, setNewCitGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [newCitPhone, setNewCitPhone] = useState('555-');
  const [newCitAddress, setNewCitAddress] = useState('');
  const [newCitDriverStatus, setNewCitDriverStatus] = useState<DriverLicenseStatus>('VALID');
  const [newCitGunStatus, setNewCitGunStatus] = useState<GunLicenseStatus>('NONE');
  const [newCitVehPlate, setNewCitVehPlate] = useState('');
  const [newCitVehModel, setNewCitVehModel] = useState('');
  const [newCitNotes, setNewCitNotes] = useState('');

  // Add Prior Arrest to Selected Citizen
  const [isAddArrestModal, setIsAddArrestModal] = useState(false);
  const [arrestCharges, setArrestCharges] = useState('');
  const [arrestJailTime, setArrestJailTime] = useState(15);
  const [arrestFine, setArrestFine] = useState(5000);

  // Sync listener
  useEffect(() => {
    const handleSync = () => setCitizens(getSavedCitizens());
    window.addEventListener('hspd-citizens-updated', handleSync);
    return () => window.removeEventListener('hspd-citizens-updated', handleSync);
  }, []);

  // Filter citizens
  const filteredCitizens = citizens.filter(c => {
    const query = searchQuery.toLowerCase();
    const matchSearch = (
      c.fullName.toLowerCase().includes(query) ||
      c.citizenId.toLowerCase().includes(query) ||
      c.phoneNumber.includes(query) ||
      c.registeredVehicles.some(v => v.plate.toLowerCase().includes(query) || v.model.toLowerCase().includes(query))
    );
    const matchLicense = filterLicense === 'ALL' || c.driverLicenseStatus === filterLicense;
    const matchGun = filterGunLicense === 'ALL' || c.gunLicenseStatus === filterGunLicense;
    const matchBolo = !onlyBolo || c.isWantedBolo;

    return matchSearch && matchLicense && matchGun && matchBolo;
  });

  // Create citizen
  const handleCreateCitizen = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCitName.trim()) return;

    const citId = `LS-${Math.floor(10000 + Math.random() * 90000)}`;
    const newProfile: CitizenProfile = {
      id: `cit-${Date.now()}`,
      citizenId: citId,
      fullName: newCitName.trim(),
      dateOfBirth: newCitDob,
      gender: newCitGender,
      phoneNumber: newCitPhone.trim(),
      address: newCitAddress.trim() || 'Los Santos City Area',
      driverLicenseStatus: newCitDriverStatus,
      driverPoints: 0,
      gunLicenseStatus: newCitGunStatus,
      isWantedBolo: false,
      registeredVehicles: newCitVehPlate.trim() ? [
        {
          plate: newCitVehPlate.toUpperCase().trim(),
          model: newCitVehModel.trim() || 'Standar Cruiser',
          color: 'Hitam',
          status: 'ACTIVE'
        }
      ] : [],
      priorArrests: [],
      notes: newCitNotes.trim() || 'Data kependudukan terdaftar pada database kepolisian HSPD.'
    };

    const updated = [newProfile, ...citizens];
    setCitizens(updated);
    saveCitizens(updated);

    setSelectedCitizen(newProfile);
    setIsNewCitizenModal(false);
    setNewCitName('');
    setNewCitVehPlate('');
    setNewCitVehModel('');
  };

  // Toggle BOLO / Wanted
  const handleToggleBolo = (citizenId: string) => {
    const updated = citizens.map(c => {
      if (c.id === citizenId) {
        const nextBolo = !c.isWantedBolo;
        return {
          ...c,
          isWantedBolo: nextBolo,
          wantedReason: nextBolo ? '10-99 BOLO BURONAN: DPO Kepolisian Aktif' : undefined
        };
      }
      return c;
    });
    setCitizens(updated);
    saveCitizens(updated);
    if (selectedCitizen?.id === citizenId) {
      setSelectedCitizen(updated.find(c => c.id === citizenId) || null);
    }
  };

  // Add Arrest Record
  const handleAddArrestRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCitizen || !arrestCharges.trim()) return;

    const recordId = `ARR-${new Date().getFullYear()}-${String(selectedCitizen.priorArrests.length + 1).padStart(3, '0')}`;
    const newRecord = {
      recordId,
      charges: arrestCharges.trim(),
      jailSentenceMinutes: Number(arrestJailTime),
      fineAmount: Number(arrestFine),
      arrestingOfficer: `${currentOfficer?.name || 'Officer'} (${currentOfficer?.badge || '#000'})`,
      timestamp: Date.now()
    };

    const updated = citizens.map(c => {
      if (c.id === selectedCitizen.id) {
        return {
          ...c,
          priorArrests: [newRecord, ...c.priorArrests]
        };
      }
      return c;
    });

    setCitizens(updated);
    saveCitizens(updated);
    setSelectedCitizen(updated.find(c => c.id === selectedCitizen.id) || null);

    setArrestCharges('');
    setIsAddArrestModal(false);
  };

  return (
    <div className="space-y-4 font-mono text-xs text-gray-200">
      
      {/* Header Banner */}
      <div className="p-4 bg-gradient-to-r from-blue-950/50 via-[#121620] to-[#121A24] border border-blue-500/40 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/50 flex items-center justify-center text-blue-400 shrink-0 shadow-lg shadow-blue-950/50">
            <UserCheck className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800 uppercase tracking-wider">
                CIVILIAN & DMV REGISTRY
              </span>
              <span className="text-[10px] text-gray-400 font-sans">
                {citizens.length} Warga Terdaftar • {citizens.filter(c => c.isWantedBolo).length} Status BOLO
              </span>
            </div>
            <h2 className="text-lg font-bold text-gray-100 mt-0.5 tracking-tight">
              Database Sipil, Kepemilikan Senjata (WCL) & Kendaraan DMV
            </h2>
            <p className="text-[11px] text-gray-400 font-sans">
              Pencarian identitas KTP, verifikasi lisensi senjata api, riwayat penahanan tersangka, dan registrasi plat nomor DMV.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsNewCitizenModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition flex items-center gap-1.5 shadow-md shadow-blue-950/50 self-start md:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ REGISTRASI DATA WARGA</span>
        </button>
      </div>

      {/* Main Grid: Search & List on Left, Detail Card on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Side: Filters & List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          {/* Search & Filters Box */}
          <div className="p-3 bg-[#141820] border border-gray-800 rounded-xl space-y-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama, No KTP (LS-...), Plat nomor..."
                className="w-full bg-[#0A0D12] border border-gray-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 font-sans"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <select
                value={filterLicense}
                onChange={(e) => setFilterLicense(e.target.value)}
                className="bg-[#0A0D12] border border-gray-700 rounded-lg p-1.5 text-gray-300 focus:outline-none"
              >
                <option value="ALL">Semua SIM</option>
                <option value="VALID">SIM Valid</option>
                <option value="SUSPENDED">SIM Suspended</option>
                <option value="REVOKED">SIM Dicabut</option>
              </select>

              <select
                value={filterGunLicense}
                onChange={(e) => setFilterGunLicense(e.target.value)}
                className="bg-[#0A0D12] border border-gray-700 rounded-lg p-1.5 text-gray-300 focus:outline-none"
              >
                <option value="ALL">Semua Izin Senjata</option>
                <option value="VALID_WCL">WCL Resmi</option>
                <option value="VALID_CCW">CCW Khusus</option>
                <option value="NONE">Tanpa Izin</option>
                <option value="REVOKED">Izin Dicabut</option>
              </select>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-gray-800">
              <label className="flex items-center gap-1.5 cursor-pointer text-rose-300 font-bold text-[11px]">
                <input
                  type="checkbox"
                  checked={onlyBolo}
                  onChange={(e) => setOnlyBolo(e.target.checked)}
                  className="rounded border-rose-600 text-rose-600 focus:ring-0"
                />
                <span>Hanya Tampilkan DPO / BOLO (Wanted)</span>
              </label>
              <span className="text-[10px] text-gray-500">{filteredCitizens.length} hasil</span>
            </div>
          </div>

          {/* Citizens List */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredCitizens.map((cit) => {
              const isSelected = selectedCitizen?.id === cit.id;
              return (
                <div
                  key={cit.id}
                  onClick={() => setSelectedCitizen(cit)}
                  className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-blue-950/40 border-blue-500 shadow-md'
                      : cit.isWantedBolo
                        ? 'bg-rose-950/20 border-rose-800/80 hover:border-rose-600'
                        : 'bg-[#141820] border-gray-800 hover:border-gray-700'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-100 text-xs">{cit.fullName}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/40 border border-gray-700 font-mono text-gray-400">
                        {cit.citizenId}
                      </span>
                    </div>

                    <div className="text-[11px] text-gray-400 font-sans flex items-center gap-2">
                      <span>📞 {cit.phoneNumber}</span>
                      <span>• Kendaraan: {cit.registeredVehicles.length} Unit</span>
                    </div>
                  </div>

                  <div className="text-right space-y-1 shrink-0">
                    {cit.isWantedBolo ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white animate-pulse">
                        🚨 WANTED BOLO
                      </span>
                    ) : (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        cit.driverLicenseStatus === 'VALID'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}>
                        SIM: {cit.driverLicenseStatus}
                      </span>
                    )}
                    <div className="text-[10px] text-gray-500 font-mono">
                      {cit.priorArrests.length} Riwayat Tilang/Sel
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Detailed Profile View (7 cols) */}
        <div className="lg:col-span-7">
          {selectedCitizen ? (
            <div className="p-4 bg-[#141820] border border-gray-800 rounded-2xl space-y-4">
              
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold text-lg">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-gray-100">{selectedCitizen.fullName}</h3>
                      <span className="px-2 py-0.2 rounded bg-[#0A0D12] text-gray-300 border border-gray-700 font-mono text-[10px]">
                        ID: {selectedCitizen.citizenId}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 font-sans mt-0.5 flex items-center gap-2">
                      <span>DOB: {selectedCitizen.dateOfBirth} ({selectedCitizen.gender})</span>
                      <span>• Telp: {selectedCitizen.phoneNumber}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleBolo(selectedCitizen.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border ${
                      selectedCitizen.isWantedBolo
                        ? 'bg-rose-950 text-rose-300 border-rose-700 hover:bg-rose-900'
                        : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-rose-300'
                    }`}
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>{selectedCitizen.isWantedBolo ? 'CABUT BOLO DPO' : 'SET STATUS BOLO (WANTED)'}</span>
                  </button>
                </div>
              </div>

              {/* BOLO Alert Box if Wanted */}
              {selectedCitizen.isWantedBolo && (
                <div className="p-3 bg-rose-950/60 border border-rose-600 rounded-xl space-y-1 text-rose-200">
                  <div className="font-bold flex items-center gap-1.5 text-xs text-white">
                    <AlertTriangle className="w-4 h-4 text-rose-400 animate-bounce" />
                    <span>PERINGATAN BURONAN POLISI (CODE RED WANTED)</span>
                  </div>
                  <p className="text-xs text-rose-300 font-sans">
                    {selectedCitizen.wantedReason || 'Tersangka masuk dalam daftar pencarian orang (DPO) aktif.'}
                  </p>
                </div>
              )}

              {/* Badges Grid: Licenses & Address */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-sans">
                <div className="p-2.5 bg-[#0A0D12] rounded-xl border border-gray-800">
                  <div className="text-[10px] text-gray-400 font-mono">STATUS SURAT IZIN MENGEMUDI:</div>
                  <div className="font-bold text-gray-200 mt-1 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-blue-400" />
                    <span>SIM: {selectedCitizen.driverLicenseStatus}</span>
                  </div>
                  <div className="text-[10px] text-amber-400 font-mono mt-0.5">
                    Poin Tilang: {selectedCitizen.driverPoints} / 12 Poin
                  </div>
                </div>

                <div className="p-2.5 bg-[#0A0D12] rounded-xl border border-gray-800">
                  <div className="text-[10px] text-gray-400 font-mono">IZIN SENJATA API (WCL/CCW):</div>
                  <div className="font-bold text-gray-200 mt-1 flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-purple-400" />
                    <span>{selectedCitizen.gunLicenseStatus}</span>
                  </div>
                  <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                    {selectedCitizen.gunLicenseStatus === 'VALID_WCL' ? 'Senjata Legal Terdaftar' : 'Belum Ada Lisensi'}
                  </div>
                </div>

                <div className="p-2.5 bg-[#0A0D12] rounded-xl border border-gray-800">
                  <div className="text-[10px] text-gray-400 font-mono">ALAMAT DOMISILI KTP:</div>
                  <div className="font-medium text-gray-300 mt-1 text-[11px] leading-tight">
                    {selectedCitizen.address}
                  </div>
                </div>
              </div>

              {/* Registered Vehicles DMV */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-300 text-xs flex items-center gap-1.5">
                    <Car className="w-3.5 h-3.5 text-blue-400" />
                    <span>KENDARAAN TERDAFTAR DMV ({selectedCitizen.registeredVehicles.length})</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedCitizen.registeredVehicles.map((veh, i) => (
                    <div key={i} className="p-2.5 bg-[#0A0D12] rounded-xl border border-gray-800 flex items-center justify-between">
                      <div>
                        <div className="font-mono font-bold text-amber-300 text-xs">
                          PLAT: {veh.plate}
                        </div>
                        <div className="text-[11px] text-gray-300 font-sans">
                          {veh.model} ({veh.color})
                        </div>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                        veh.status === 'ACTIVE' 
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : veh.status === 'STOLEN'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800 animate-pulse'
                            : 'bg-gray-800 text-gray-400'
                      }`}>
                        {veh.status}
                      </span>
                    </div>
                  ))}
                  {selectedCitizen.registeredVehicles.length === 0 && (
                    <div className="p-3 bg-[#0A0D12] rounded-xl border border-gray-800 text-gray-500 text-xs italic col-span-2">
                      Tidak ada kendaraan yang terdaftar atas nama warga ini.
                    </div>
                  )}
                </div>
              </div>

              {/* Prior Arrests & Charges History */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-300 text-xs flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-rose-400" />
                    <span>CATATAN KRIMINAL & PENAHANAN ({selectedCitizen.priorArrests.length})</span>
                  </span>
                  <button
                    onClick={() => setIsAddArrestModal(true)}
                    className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-[11px] font-bold transition flex items-center gap-1 border border-gray-700"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ Catat Dakwaan/Tilang</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {selectedCitizen.priorArrests.map((arr, i) => (
                    <div key={i} className="p-2.5 bg-[#0A0D12] rounded-xl border border-gray-800 space-y-1 text-xs font-sans">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-blue-300 text-[11px]">{arr.recordId}</span>
                        <span className="text-[10px] text-gray-500 font-mono">
                          {new Date(arr.timestamp).toLocaleDateString('id-ID')}
                        </span>
                      </div>
                      <div className="text-gray-200 font-medium">
                        {arr.charges}
                      </div>
                      <div className="text-[11px] text-gray-400 flex items-center gap-3">
                        <span>Hukuman: <strong>{arr.jailSentenceMinutes} Menit Penjara</strong></span>
                        <span>Denda: <strong className="text-emerald-400">${arr.fineAmount.toLocaleString()}</strong></span>
                        <span>Petugas: {arr.arrestingOfficer}</span>
                      </div>
                    </div>
                  ))}
                  {selectedCitizen.priorArrests.length === 0 && (
                    <div className="p-3 bg-[#0A0D12] rounded-xl border border-gray-800 text-emerald-400 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Catatan Bersih: Tidak memiliki riwayat kriminal atau penahanan sebelumnya.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div className="p-2.5 bg-[#0A0D12] rounded-xl border border-gray-800 space-y-1">
                <span className="text-[10px] text-gray-500 font-mono">CATATAN PETUGAS / INTEL:</span>
                <p className="text-xs text-gray-300 font-sans">
                  {selectedCitizen.notes}
                </p>
              </div>

            </div>
          ) : (
            <div className="p-12 text-center bg-[#141820] border border-gray-800 rounded-2xl space-y-3">
              <UserCheck className="w-12 h-12 text-gray-600 mx-auto" />
              <h3 className="text-base font-bold text-gray-300">Pilih Profil Warga untuk Melihat Rincian</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto font-sans">
                Klik salah satu nama warga dari daftar di sebelah kiri atau gunakan kolom pencarian untuk mengecek identitas KTP dan kepemilikan senjata.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* MODAL: CREATE CITIZEN */}
      {isNewCitizenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn font-sans">
          <div className="w-full max-w-lg bg-[#0F1318] border border-blue-500/60 rounded-2xl p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-gray-800 pb-2">
              <span className="font-bold text-blue-400 text-sm">REGISTRASI DATA WARGA & KENDARAAN DMV</span>
              <button onClick={() => setIsNewCitizenModal(false)}><X className="w-4 h-4 text-gray-400" /></button>
            </div>
            <form onSubmit={handleCreateCitizen} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-300 font-bold mb-1">Nama Lengkap *</label>
                  <input
                    type="text"
                    required
                    value={newCitName}
                    onChange={(e) => setNewCitName(e.target.value)}
                    placeholder="Contoh: Marcus Holloway"
                    className="w-full bg-[#141820] border border-gray-700 rounded-lg p-2 text-gray-200"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-bold mb-1">Tanggal Lahir (DOB)</label>
                  <input
                    type="date"
                    value={newCitDob}
                    onChange={(e) => setNewCitDob(e.target.value)}
                    className="w-full bg-[#141820] border border-gray-700 rounded-lg p-2 text-gray-200 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-300 font-bold mb-1">Jenis Kelamin</label>
                  <select
                    value={newCitGender}
                    onChange={(e) => setNewCitGender(e.target.value as any)}
                    className="w-full bg-[#141820] border border-gray-700 rounded-lg p-2 text-gray-200"
                  >
                    <option value="MALE">Laki-Laki (Male)</option>
                    <option value="FEMALE">Perempuan (Female)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-300 font-bold mb-1">Nomor Telepon</label>
                  <input
                    type="text"
                    value={newCitPhone}
                    onChange={(e) => setNewCitPhone(e.target.value)}
                    placeholder="555-0123"
                    className="w-full bg-[#141820] border border-gray-700 rounded-lg p-2 text-gray-200 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1">Alamat Domisili KTP</label>
                <input
                  type="text"
                  value={newCitAddress}
                  onChange={(e) => setNewCitAddress(e.target.value)}
                  placeholder="Contoh: Spanish Ave, Vinewood #201"
                  className="w-full bg-[#141820] border border-gray-700 rounded-lg p-2 text-gray-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-300 font-bold mb-1">Status SIM (Driver License)</label>
                  <select
                    value={newCitDriverStatus}
                    onChange={(e) => setNewCitDriverStatus(e.target.value as any)}
                    className="w-full bg-[#141820] border border-gray-700 rounded-lg p-2 text-gray-200"
                  >
                    <option value="VALID">VALID (Aktif Resmi)</option>
                    <option value="SUSPENDED">SUSPENDED (Ditangguhkan)</option>
                    <option value="REVOKED">REVOKED (Dicabut)</option>
                    <option value="NONE">NONE (Tidak Punya SIM)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-300 font-bold mb-1">Status Izin Senjata Api</label>
                  <select
                    value={newCitGunStatus}
                    onChange={(e) => setNewCitGunStatus(e.target.value as any)}
                    className="w-full bg-[#141820] border border-gray-700 rounded-lg p-2 text-gray-200"
                  >
                    <option value="NONE">NONE (Tanpa Izin)</option>
                    <option value="VALID_WCL">VALID WCL (Weapon Carry License)</option>
                    <option value="VALID_CCW">VALID CCW (Concealed Carry Weapon)</option>
                    <option value="REVOKED">REVOKED (Dicabut Pidana)</option>
                  </select>
                </div>
              </div>

              <div className="p-2.5 bg-[#0A0D12] rounded-xl border border-gray-800 space-y-2">
                <span className="font-bold text-gray-300 text-xs">Kendaraan Awal Terdaftar DMV:</span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newCitVehPlate}
                    onChange={(e) => setNewCitVehPlate(e.target.value)}
                    placeholder="Plat Nomor (Contoh: 88ABC12)"
                    className="bg-[#141820] border border-gray-700 rounded-lg p-1.5 text-gray-200 font-mono uppercase"
                  />
                  <input
                    type="text"
                    value={newCitVehModel}
                    onChange={(e) => setNewCitVehModel(e.target.value)}
                    placeholder="Model Mobil (Contoh: Sultan RS)"
                    className="bg-[#141820] border border-gray-700 rounded-lg p-1.5 text-gray-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1">Catatan Intel / Tambahan</label>
                <textarea
                  rows={2}
                  value={newCitNotes}
                  onChange={(e) => setNewCitNotes(e.target.value)}
                  placeholder="Keterangan khusus, pekerjaan, riwayat medik..."
                  className="w-full bg-[#141820] border border-gray-700 rounded-lg p-2 text-gray-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-800">
                <button type="button" onClick={() => setIsNewCitizenModal(false)} className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded-lg">Batal</button>
                <button type="submit" className="px-4 py-1.5 bg-blue-600 text-white font-bold rounded-lg">Simpan Data Warga</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD ARREST / CHARGES RECORD */}
      {isAddArrestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn font-sans">
          <div className="w-full max-w-md bg-[#0F1318] border border-rose-500/60 rounded-2xl p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-gray-800 pb-2">
              <span className="font-bold text-rose-400 text-sm">INPUT DAKWAAN HUKUM & TILANG</span>
              <button onClick={() => setIsAddArrestModal(false)}><X className="w-4 h-4 text-gray-400" /></button>
            </div>
            <form onSubmit={handleAddArrestRecord} className="space-y-3">
              <div>
                <label className="block text-gray-300 font-bold mb-1">Pasal / Dakwaan Pidana *</label>
                <textarea
                  rows={2}
                  required
                  value={arrestCharges}
                  onChange={(e) => setArrestCharges(e.target.value)}
                  placeholder="Contoh: Pasal 2.1 (Speeding Jalan Tol) & Pasal 3.4 (Membawa Senjata Ilegal)"
                  className="w-full bg-[#141820] border border-gray-700 rounded-lg p-2 text-gray-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-300 font-bold mb-1">Masa Penjara (Menit)</label>
                  <input
                    type="number"
                    min="0"
                    value={arrestJailTime}
                    onChange={(e) => setArrestJailTime(Number(e.target.value))}
                    className="w-full bg-[#141820] border border-gray-700 rounded-lg p-2 text-gray-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-bold mb-1">Denda ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={arrestFine}
                    onChange={(e) => setArrestFine(Number(e.target.value))}
                    className="w-full bg-[#141820] border border-gray-700 rounded-lg p-2 text-gray-200 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-800">
                <button type="button" onClick={() => setIsAddArrestModal(false)} className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded-lg">Batal</button>
                <button type="submit" className="px-4 py-1.5 bg-rose-600 text-white font-bold rounded-lg">Catat ke Rekam Medis & Pidana</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
