import React, { useState } from 'react';
import { 
  Plus, Gauge, Wine, Car, AlertTriangle, 
  Check, Copy, Send, X, FileText, ShieldAlert
} from 'lucide-react';
import { TedTrafficRecord, OfficerProfile } from '../../types';
import { saveTedRecords } from '../../utils/specializedDivisionsStorage';
import { sendDiscordLog, getDiscordWebhookConfig } from '../../utils/discordWebhook';

interface TedTrafficPanelProps {
  tedRecords: TedTrafficRecord[];
  onUpdateRecords: (records: TedTrafficRecord[]) => void;
  currentOfficer: OfficerProfile | null;
}

export const TedTrafficPanel: React.FC<TedTrafficPanelProps> = ({
  tedRecords,
  onUpdateRecords,
  currentOfficer
}) => {
  const [isNewRecordModal, setIsNewRecordModal] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Speed Radar Calculator state
  const [clockedSpeed, setClockedSpeed] = useState<number>(110);
  const [speedLimit, setSpeedLimit] = useState<number>(65);

  // DUI Simulator state
  const [simBac, setSimBac] = useState<number>(0.09);
  const [hgnTestResult, setHgnTestResult] = useState<'CLEAR' | 'NYSTAGMUS_DETECTED'>('NYSTAGMUS_DETECTED');
  const [walkTurnResult, setWalkTurnResult] = useState<'PASSED' | 'FAILED_BALANCE'>('FAILED_BALANCE');

  // Form states for manual traffic ticket
  const [driverName, setDriverName] = useState('');
  const [driverLicense, setDriverLicense] = useState('DL-');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [location, setLocation] = useState('Del Perro Freeway');
  const [actionTaken, setActionTaken] = useState<'WARNING' | 'CITATION_ISSUED' | 'DUI_ARREST' | 'VEHICLE_IMPOUNDED'>('CITATION_ISSUED');

  const excessSpeed = Math.max(0, clockedSpeed - speedLimit);
  const calculatedFine = excessSpeed > 0 ? 500 + excessSpeed * 35 : 0;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2500);
  };

  const handleCreateRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverName.trim() || !vehiclePlate.trim()) return;

    const newRecord: TedTrafficRecord = {
      id: `ted-${Date.now()}`,
      driverName: driverName.trim(),
      driverLicense: driverLicense.trim(),
      vehiclePlate: vehiclePlate.trim().toUpperCase(),
      vehicleModel: vehicleModel.trim() || 'Kendaraan Bermotor',
      clockedSpeedMph: clockedSpeed,
      speedLimitMph: speedLimit,
      bacLevel: simBac,
      violations: [
        excessSpeed > 0 ? `Pasal 104: Pelanggaran Batas Kecepatan (+${excessSpeed} MPH)` : 'Pemeriksaan Rutin Lalu Lintas',
        simBac >= 0.08 ? 'Pasal 112: Mengemudi Bawah Pengaruh Alkohol (DUI BAC ≥ 0.08%)' : ''
      ].filter(Boolean),
      totalFine: calculatedFine,
      officerName: currentOfficer?.name || 'TED Traffic Officer',
      officerBadge: currentOfficer?.badge || '#TED-01',
      actionTaken,
      location: location.trim(),
      timestamp: Date.now()
    };

    const updated = [newRecord, ...tedRecords];
    onUpdateRecords(updated);
    saveTedRecords(updated);
    setIsNewRecordModal(false);

    // Reset
    setDriverName('');
    setVehiclePlate('');
  };

  const handleSendDiscordTed = async (rec: TedTrafficRecord) => {
    const cfg = getDiscordWebhookConfig();
    if (!cfg.webhookUrl) {
      alert('Webhook Discord belum disetting.');
      return;
    }

    const success = await sendDiscordLog(cfg.webhookUrl, {
      title: `🚨 TILANG / PENINDAKAN LALU LINTAS TED: ${rec.vehiclePlate}`,
      description: `Laporan Penindakan Pelanggaran Lalu Lintas Traffic Enforcement Division`,
      color: 0x0284c7,
      fields: [
        { name: 'Pengemudi', value: `**${rec.driverName}** (${rec.driverLicense})`, inline: true },
        { name: 'Plat & Model', value: `\`${rec.vehiclePlate}\` • ${rec.vehicleModel}`, inline: true },
        { name: 'Tindakan Petugas', value: `⚠️ **${rec.actionTaken}**`, inline: true },
        { name: 'Kecepatan Terpantau', value: `${rec.clockedSpeedMph} MPH (Batas: ${rec.speedLimitMph} MPH)`, inline: true },
        { name: 'Kadar Alkohol (BAC)', value: `${rec.bacLevel}%`, inline: true },
        { name: 'Total Denda Tilang', value: `$${rec.totalFine.toLocaleString()}`, inline: true },
        { name: 'Pasal Pelanggaran', value: rec.violations.join('\n') || 'Pelanggaran Lalu Lintas', inline: false },
        { name: 'Lokasi & Petugas', value: `${rec.location} • ${rec.officerName} (${rec.officerBadge})`, inline: false }
      ]
    });

    if (success) {
      alert('✅ Berkas penindakan TED berhasil dikirim ke Webhook Discord!');
    }
  };

  return (
    <div className="space-y-4 font-sans text-xs">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-100 flex items-center gap-2">
            <span>TRAFFIC ENFORCEMENT DIVISION (TED / SATLANTAS)</span>
          </h3>
          <p className="text-[11px] text-gray-400">
            Kalkulator denda radar kecepatan, uji breathalyzer mabuk (DUI / SFST), dan surat penahanan kendaraan (Impound).
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsNewRecordModal(true)}
          className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg text-xs transition flex items-center gap-1.5 shadow-md shadow-sky-600/30"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>+ TERBITKAN TILANG / DUI TIKET</span>
        </button>
      </div>

      {/* Interactive Speed & DUI Calculators */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Tool 1: Speed Radar Calculator */}
        <div className="p-4 bg-[#141820] border border-sky-900/60 rounded-2xl space-y-3 shadow-lg">
          <div className="flex items-center justify-between border-b border-gray-800 pb-2">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-sky-400" />
              <span className="font-bold text-gray-100 text-xs">KALKULATOR RADAR KECEPATAN & DENDA TILANG</span>
            </div>
            <span className="text-[10px] font-mono text-sky-400 bg-sky-950 px-2 py-0.5 rounded border border-sky-800 font-bold">
              RADAR GUN
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-gray-400 font-bold block mb-1">Kecepatan Terbidik Radar (MPH)</label>
              <input
                type="number"
                value={clockedSpeed}
                onChange={(e) => setClockedSpeed(Number(e.target.value))}
                className="w-full bg-[#0A0D12] border border-gray-700 rounded-lg p-2 text-xs text-gray-100 font-mono text-base font-bold text-sky-300"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 font-bold block mb-1">Batas Maksimum Zona Jalan (MPH)</label>
              <select
                value={speedLimit}
                onChange={(e) => setSpeedLimit(Number(e.target.value))}
                className="w-full bg-[#0A0D12] border border-gray-700 rounded-lg p-2 text-xs text-gray-100 font-mono"
              >
                <option value={35}>35 MPH (Area Perumahan / Kota)</option>
                <option value={45}>45 MPH (Boulevard Utama / Downtown)</option>
                <option value={65}>65 MPH (Jalan Tol / Freeway)</option>
              </select>
            </div>
          </div>

          <div className="p-3 bg-[#0A0D12] rounded-xl border border-sky-800/60 flex items-center justify-between font-mono">
            <div>
              <div className="text-[10px] text-gray-400">KELEBIHAN KECEPATAN:</div>
              <div className="text-sm font-bold text-amber-400">+{excessSpeed} MPH Over Limit</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-gray-400">ESTIMASI DENDA:</div>
              <div className="text-base font-bold text-emerald-400">${calculatedFine.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Tool 2: DUI Breathalyzer & SFST Simulator */}
        <div className="p-4 bg-[#141820] border border-amber-900/60 rounded-2xl space-y-3 shadow-lg">
          <div className="flex items-center justify-between border-b border-gray-800 pb-2">
            <div className="flex items-center gap-2">
              <Wine className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-gray-100 text-xs">SIMULATOR TES ALKOHOL (DUI & SFST)</span>
            </div>
            <span className="text-[10px] font-mono text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-800 font-bold">
              BREATHALYZER
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-gray-400 font-bold block mb-1">Kadar Alkohol Darah (BAC %)</label>
              <input
                type="number"
                step="0.01"
                value={simBac}
                onChange={(e) => setSimBac(Number(e.target.value))}
                className="w-full bg-[#0A0D12] border border-gray-700 rounded-lg p-2 text-xs text-gray-100 font-mono text-base font-bold text-amber-300"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 font-bold block mb-1">Uji Keseimbangan (Walk & Turn)</label>
              <select
                value={walkTurnResult}
                onChange={(e) => setWalkTurnResult(e.target.value as any)}
                className="w-full bg-[#0A0D12] border border-gray-700 rounded-lg p-2 text-xs text-gray-100 font-mono"
              >
                <option value="PASSED">LULUS (Stabil 9 Langkah)</option>
                <option value="FAILED_BALANCE">GAGAL (Sempoyongan / Jatuh)</option>
              </select>
            </div>
          </div>

          <div className="p-3 bg-[#0A0D12] rounded-xl border border-amber-800/60 flex items-center justify-between font-mono">
            <div>
              <div className="text-[10px] text-gray-400">STATUS HUKUM DUI:</div>
              <div className={`text-sm font-bold ${simBac >= 0.08 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {simBac >= 0.08 ? 'DUI ARREST WARRANT (BAC ≥ 0.08%)' : 'DI BAWAH AMBANG BATAS LEGAL'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Traffic Enforcement Records List */}
      <div className="space-y-2">
        <div className="font-bold text-gray-300 text-xs">BERKAS PENINDAKAN LALU LINTAS TED TERAKHIR:</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {tedRecords.map((rec) => (
            <div key={rec.id} className="p-3.5 bg-[#141820] border border-gray-800 rounded-2xl space-y-2.5 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs bg-sky-950 text-sky-300 px-2 py-0.5 rounded border border-sky-800">
                    {rec.vehiclePlate}
                  </span>
                  <span className="font-bold text-gray-100 text-xs">{rec.driverName}</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                  rec.actionTaken === 'DUI_ARREST' || rec.actionTaken === 'VEHICLE_IMPOUNDED'
                    ? 'bg-rose-950 text-rose-300 border border-rose-800'
                    : 'bg-amber-950 text-amber-300 border border-amber-800'
                }`}>
                  {rec.actionTaken}
                </span>
              </div>

              <div className="text-[11px] text-gray-400 space-y-0.5">
                <div>🚗 Kendaraan: <strong className="text-gray-200">{rec.vehicleModel}</strong></div>
                <div>⚡ Kecepatan: <span className="font-mono text-amber-300">{rec.clockedSpeedMph} MPH</span> (Limit: {rec.speedLimitMph} MPH)</div>
                <div>🍷 BAC: <span className="font-mono text-purple-300">{rec.bacLevel}%</span> • Denda: <span className="font-mono text-emerald-400 font-bold">${rec.totalFine.toLocaleString()}</span></div>
              </div>

              <div className="flex justify-end gap-2 pt-1 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => handleSendDiscordTed(rec)}
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 font-mono"
                >
                  <Send className="w-3 h-3" />
                  <span>Kirim ke Discord</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* New Traffic Ticket Modal */}
      {isNewRecordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn font-sans">
          <div className="w-full max-w-md bg-[#0F1318] border border-sky-500/60 rounded-2xl p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-gray-800 pb-2">
              <span className="font-bold text-sky-400 text-sm">TERBITKAN TILANG / DUI RECORD</span>
              <button onClick={() => setIsNewRecordModal(false)}><X className="w-4 h-4 text-gray-400" /></button>
            </div>
            <form onSubmit={handleCreateRecord} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-300 font-bold mb-1">Nama Pengemudi *</label>
                  <input
                    type="text"
                    required
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="Nama Lengkap"
                    className="w-full bg-[#141820] border border-gray-700 rounded-lg p-2 text-gray-200"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-bold mb-1">Nomor SIM (Driver License)</label>
                  <input
                    type="text"
                    value={driverLicense}
                    onChange={(e) => setDriverLicense(e.target.value)}
                    placeholder="DL-123"
                    className="w-full bg-[#141820] border border-gray-700 rounded-lg p-2 text-gray-200 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-300 font-bold mb-1">Plat Nomor Kendaraan *</label>
                  <input
                    type="text"
                    required
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value)}
                    placeholder="LS-889"
                    className="w-full bg-[#141820] border border-gray-700 rounded-lg p-2 text-gray-200 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-bold mb-1">Model / Warna Kendaraan</label>
                  <input
                    type="text"
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value)}
                    placeholder="Sultan Hitam"
                    className="w-full bg-[#141820] border border-gray-700 rounded-lg p-2 text-gray-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1">Tindakan Petugas Lapangan</label>
                <select
                  value={actionTaken}
                  onChange={(e) => setActionTaken(e.target.value as any)}
                  className="w-full bg-[#141820] border border-gray-700 rounded-lg p-2 text-gray-200 font-mono"
                >
                  <option value="CITATION_ISSUED">TILANG DENDA RESMI (CITATION ISSUED)</option>
                  <option value="DUI_ARREST">PENANGKAPAN DUI (MABUK BERKENDARA)</option>
                  <option value="VEHICLE_IMPOUNDED">SITA KENDARAAN (IMPOUND ORDER)</option>
                  <option value="WARNING">TEGURAN LISAN / TERTULIS (WARNING)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-800">
                <button type="button" onClick={() => setIsNewRecordModal(false)} className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded-lg">Batal</button>
                <button type="submit" className="px-4 py-1.5 bg-sky-600 text-white font-bold rounded-lg">Simpan Penindakan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
