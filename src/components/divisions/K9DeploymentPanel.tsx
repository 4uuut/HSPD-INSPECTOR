import React, { useState } from 'react';
import { 
  Plus, Check, Copy, AlertTriangle, 
  Activity, Shield, X, Heart, Sparkles, Send
} from 'lucide-react';
import { K9Partner, K9DeploymentLog, OfficerProfile } from '../../types';
import { saveK9Partners, saveK9Logs } from '../../utils/specializedDivisionsStorage';
import { sendDiscordLog, getDiscordWebhookConfig } from '../../utils/discordWebhook';

interface K9DeploymentPanelProps {
  k9Partners: K9Partner[];
  k9Logs: K9DeploymentLog[];
  onUpdatePartners: (partners: K9Partner[]) => void;
  onUpdateLogs: (logs: K9DeploymentLog[]) => void;
  currentOfficer: OfficerProfile | null;
}

export const K9DeploymentPanel: React.FC<K9DeploymentPanelProps> = ({
  k9Partners,
  k9Logs,
  onUpdatePartners,
  onUpdateLogs,
  currentOfficer
}) => {
  const [isNewLogModal, setIsNewLogModal] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationLog, setSimulationLog] = useState<string | null>(null);

  // Form states for manual log
  const [selectedDog, setSelectedDog] = useState(k9Partners[0]?.dogName || 'K-9 Zeus');
  const [targetType, setTargetType] = useState<'VEHICLE_SNIFF' | 'BUILDING_SWEEP' | 'FUGITIVE_TRACKING' | 'CROWD_CONTROL'>('VEHICLE_SNIFF');
  const [location, setLocation] = useState('');
  const [resultStatus, setResultStatus] = useState<'POSITIVE_HIT' | 'NEGATIVE_CLEAR' | 'SUSPECT_APPREHENDED'>('POSITIVE_HIT');
  const [findingsSummary, setFindingsSummary] = useState('');

  // Interactive Sniff Simulator states
  const [simTargetMode, setSimTargetMode] = useState<'VEHICLE' | 'BUILDING' | 'FUGITIVE' | 'BITE_TAKEDOWN'>('VEHICLE');
  const [simSubjectDetail, setSimSubjectDetail] = useState('Declasse Granger Hitam (Plat: LS-772-XD)');
  const [simResultOutput, setSimResultOutput] = useState<{ status: string; desc: string; itemFound?: string } | null>(null);

  const handleCreateLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim() || !findingsSummary.trim()) return;

    const newEntry: K9DeploymentLog = {
      id: `k9-log-${Date.now()}`,
      dogName: selectedDog,
      handlerName: currentOfficer ? `${currentOfficer.name} (${currentOfficer.badge})` : 'K-9 Handler Unit',
      location: location.trim(),
      targetType,
      resultStatus,
      findingsSummary: findingsSummary.trim(),
      timestamp: Date.now()
    };

    const updated = [newEntry, ...k9Logs];
    onUpdateLogs(updated);
    saveK9Logs(updated);

    // Update Dog statistics
    const updatedPartners = k9Partners.map(dog => {
      if (dog.dogName === selectedDog) {
        return {
          ...dog,
          totalDeployments: dog.totalDeployments + 1,
          totalFinds: resultStatus === 'POSITIVE_HIT' ? dog.totalFinds + 1 : dog.totalFinds,
          totalBites: resultStatus === 'SUSPECT_APPREHENDED' ? dog.totalBites + 1 : dog.totalBites
        };
      }
      return dog;
    });
    onUpdatePartners(updatedPartners);
    saveK9Partners(updatedPartners);

    setIsNewLogModal(false);
    setLocation('');
    setFindingsSummary('');
  };

  const handleRunSniffSimulation = () => {
    setIsSimulating(true);
    setSimResultOutput(null);

    setTimeout(() => {
      setIsSimulating(false);
      if (simTargetMode === 'VEHICLE') {
        const outcomes = [
          {
            status: 'POSITIVE_HIT',
            desc: '🐕 K-9 mengendus intensif pada area bawah karpet jok penumpang belakang dan memberi respon duduk (Sit Alert).',
            itemFound: 'Ditemukan: 12 Paket Kokain Murni (60g) & 1 Kotak Amunisi 9mm tanpa izin.'
          },
          {
            status: 'NEGATIVE_CLEAR',
            desc: '🐕 K-9 telah menyisir bagasi, kabin mesin, dan seluruh interior kendaraan secara menyeluruh.',
            itemFound: 'Hasil: Nihil zat narkotika maupun bahan peledak (Area Bersih / Clear).'
          },
          {
            status: 'POSITIVE_HIT',
            desc: '🐕 K-9 melolong dan menggaruk panel pintu sebelah kiri pengemudi.',
            itemFound: 'Ditemukan: 1x Senjata Api Glock-19 tak teregistrasi & 500 butir Ekstasi.'
          }
        ];
        const picked = outcomes[Math.floor(Math.random() * outcomes.length)];
        setSimResultOutput(picked);
      } else if (simTargetMode === 'BUILDING') {
        const outcomes = [
          {
            status: 'POSITIVE_HIT',
            desc: '🐕 K-9 mendeteksi jejak bubuk mesiu dan bahan peledak di lemari besi gudang.',
            itemFound: 'Ditemukan: 2x Batang Dinamit & Senapan Serbu AR-15.'
          },
          {
            status: 'NEGATIVE_CLEAR',
            desc: '🐕 Seluruh ruangan lantai 1 dan lantai 2 telah disterilkan K-9.',
            itemFound: 'Hasil: Gedung dinyatakan aman dan steril dari ancaman IED.'
          }
        ];
        const picked = outcomes[Math.floor(Math.random() * outcomes.length)];
        setSimResultOutput(picked);
      } else if (simTargetMode === 'FUGITIVE') {
        const outcomes = [
          {
            status: 'POSITIVE_HIT',
            desc: '🐕 K-9 menangkap jejak aroma keringat pelaku dari gang sempit menuju atap ruko.',
            itemFound: 'Tersangka bersembunyi di balik tangki air dan berhasil dipojokkan.'
          }
        ];
        setSimResultOutput(outcomes[0]);
      } else {
        setSimResultOutput({
          status: 'SUSPECT_APPREHENDED',
          desc: '⚡ K-9 diperintahkan "FAS!" (Bite Command) dan berhasil menerjang lengan kanan tersangka bersenjata tajam.',
          itemFound: 'Tersangka berhasil dijatuhkan dan diborgol oleh Handler tanpa korban jiwa.'
        });
      }
    }, 1000);
  };

  const handleSaveSimulationToLog = () => {
    if (!simResultOutput) return;
    const newEntry: K9DeploymentLog = {
      id: `k9-log-${Date.now()}`,
      dogName: selectedDog,
      handlerName: currentOfficer ? `${currentOfficer.name} (${currentOfficer.badge})` : 'K-9 Unit Handler',
      location: simSubjectDetail || 'Los Santos City Area',
      targetType: simTargetMode === 'VEHICLE' ? 'VEHICLE_SNIFF' : simTargetMode === 'BUILDING' ? 'BUILDING_SWEEP' : simTargetMode === 'FUGITIVE' ? 'FUGITIVE_TRACKING' : 'CROWD_CONTROL',
      resultStatus: simResultOutput.status as any,
      findingsSummary: `${simResultOutput.desc} ${simResultOutput.itemFound || ''}`,
      timestamp: Date.now()
    };

    const updated = [newEntry, ...k9Logs];
    onUpdateLogs(updated);
    saveK9Logs(updated);

    // Update Dog statistics
    const updatedPartners = k9Partners.map(dog => {
      if (dog.dogName === selectedDog) {
        return {
          ...dog,
          totalDeployments: dog.totalDeployments + 1,
          totalFinds: simResultOutput.status === 'POSITIVE_HIT' ? dog.totalFinds + 1 : dog.totalFinds,
          totalBites: simResultOutput.status === 'SUSPECT_APPREHENDED' ? dog.totalBites + 1 : dog.totalBites
        };
      }
      return dog;
    });
    onUpdatePartners(updatedPartners);
    saveK9Partners(updatedPartners);

    alert('✅ Hasil penyisiran K-9 berhasil dimasukkan ke riwayat log!');
  };

  return (
    <div className="space-y-4 font-sans text-xs">
      {/* Top Header & Fast Action */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-100 flex items-center gap-2">
            <span>UNIT SATWA K-9 (CANINE TACTICAL SQUAD)</span>
          </h3>
          <p className="text-[11px] text-gray-400">
            Penyisiran narkotika, pelacakan bahan peledak, pencarian buronan, dan penindakan gigitan taktis.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsNewLogModal(true)}
          className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-black font-bold rounded-lg text-xs transition flex items-center gap-1.5 shadow-md shadow-amber-600/30"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>+ CATAT LOG K-9</span>
        </button>
      </div>

      {/* Canine Roster Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {k9Partners.map((dog) => (
          <div key={dog.id} className="p-3.5 bg-[#141820] border border-gray-800 hover:border-amber-500/50 rounded-2xl space-y-2.5 transition">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 font-bold text-base">
                  🐕
                </div>
                <div>
                  <div className="font-bold text-gray-100 text-sm flex items-center gap-1.5">
                    <span>{dog.dogName}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-700 font-mono font-bold">
                      {dog.healthStatus}
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-400 font-sans">{dog.breed}</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700 font-mono">
                {dog.certificationStatus}
              </span>
            </div>

            <div className="p-2 bg-[#0A0D12] rounded-xl border border-gray-800 space-y-1 text-xs font-sans">
              <div className="text-gray-300">Handler Resmi: <strong className="text-gray-100">{dog.handlerName}</strong> ({dog.handlerBadge})</div>
              <div className="text-amber-400 font-mono text-[10px] font-bold">Spesialisasi: {dog.specialization}</div>
            </div>

            <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-mono">
              <div className="p-1.5 bg-[#0A0D12] rounded-lg border border-gray-800">
                <div className="text-gray-400">Penugasan:</div>
                <div className="font-bold text-gray-200">{dog.totalDeployments}x</div>
              </div>
              <div className="p-1.5 bg-[#0A0D12] rounded-lg border border-gray-800">
                <div className="text-gray-400">Temuan (Hits):</div>
                <div className="font-bold text-emerald-400">{dog.totalFinds} Hit</div>
              </div>
              <div className="p-1.5 bg-[#0A0D12] rounded-lg border border-gray-800">
                <div className="text-gray-400">Bite Takedown:</div>
                <div className="font-bold text-red-400">{dog.totalBites}x</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Deployment & Sniff Simulator */}
      <div className="p-4 bg-[#141820] border border-amber-500/50 rounded-2xl space-y-3 shadow-lg">
        <div className="flex items-center justify-between border-b border-gray-800 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 text-base">🐾</span>
            <span className="font-bold text-gray-100 text-xs uppercase">
              SIMULATOR & ALAT EKSEKUSI PENYISIRAN K-9 LAPANGAN
            </span>
          </div>
          <span className="text-[10px] font-mono bg-amber-950 text-amber-300 px-2 py-0.5 rounded border border-amber-800 font-bold">
            TACTICAL ENGINE
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] text-gray-400 font-bold block mb-1">Pilih Anjing Pelacak</label>
            <select
              value={selectedDog}
              onChange={(e) => setSelectedDog(e.target.value)}
              className="w-full bg-[#0A0D12] border border-gray-700 rounded-lg p-2 text-xs text-gray-100"
            >
              {k9Partners.map(p => (
                <option key={p.id} value={p.dogName}>{p.dogName} - {p.specialization}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-gray-400 font-bold block mb-1">Mode Tindakan Taktis</label>
            <select
              value={simTargetMode}
              onChange={(e) => setSimTargetMode(e.target.value as any)}
              className="w-full bg-[#0A0D12] border border-gray-700 rounded-lg p-2 text-xs text-gray-100"
            >
              <option value="VEHICLE">🚗 Penyisiran Kendaraan (Vehicle Sniff)</option>
              <option value="BUILDING">🏢 Penyisiran Gedung & Gudang (Building/IED)</option>
              <option value="FUGITIVE">🏃 Pelacakan Jejak Aroma Buronan (Fugitive Track)</option>
              <option value="BITE_TAKEDOWN">⚡ Perintah Gigit & Lumpuhkan (Bite Command)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-gray-400 font-bold block mb-1">Target / Kendaraan / Lokasi Objek</label>
            <input
              type="text"
              value={simSubjectDetail}
              onChange={(e) => setSimSubjectDetail(e.target.value)}
              className="w-full bg-[#0A0D12] border border-gray-700 rounded-lg p-2 text-xs text-gray-100"
              placeholder="Contoh: Sultan RS Hitam / Gudang Port 4"
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pt-1">
          <button
            type="button"
            disabled={isSimulating}
            onClick={handleRunSniffSimulation}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-black font-bold rounded-lg text-xs transition flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Activity className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
            <span>{isSimulating ? 'K-9 Sedang Mengendus & Menyisir...' : '🐕 Luncurkan Perintah Penyisiran K-9'}</span>
          </button>
        </div>

        {/* Live Simulation Output Box */}
        {simResultOutput && (
          <div className="p-3.5 bg-[#0A0D12] border border-amber-500/70 rounded-xl space-y-2 font-sans animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                simResultOutput.status === 'POSITIVE_HIT'
                  ? 'bg-rose-950 text-rose-300 border-rose-800'
                  : simResultOutput.status === 'SUSPECT_APPREHENDED'
                  ? 'bg-red-600 text-white border-red-500'
                  : 'bg-emerald-950 text-emerald-300 border-emerald-800'
              }`}>
                HASIL: {simResultOutput.status}
              </span>
              <span className="text-[10px] text-gray-400 font-mono">Handler: {currentOfficer?.name || 'Petugas K-9'}</span>
            </div>

            <p className="text-xs text-gray-100 leading-relaxed font-medium">
              {simResultOutput.desc}
            </p>

            {simResultOutput.itemFound && (
              <div className="p-2 bg-amber-950/40 border border-amber-700/60 rounded-lg text-amber-200 text-xs font-semibold">
                🔍 {simResultOutput.itemFound}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={handleSaveSimulationToLog}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 font-mono"
              >
                <span>💾 Simpan ke Riwayat Log K-9</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Deployment Logs List */}
      <div className="space-y-2">
        <div className="font-bold text-gray-300 text-xs flex items-center justify-between">
          <span>RIWAYAT LOG PENUGASAN & PENYISIRAN K-9:</span>
          <span className="text-gray-500 font-mono text-[10px]">{k9Logs.length} Catatan Berkas</span>
        </div>
        <div className="space-y-2">
          {k9Logs.map((log) => (
            <div key={log.id} className="p-3 bg-[#141820] border border-gray-800 rounded-xl flex items-start justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-bold text-gray-200">
                  <span className="text-amber-400 font-mono">🐕 {log.dogName}</span>
                  <span className="text-gray-400 font-normal text-[11px] font-mono">({log.handlerName})</span>
                  <span className={`text-[9px] px-2 py-0.5 rounded font-mono font-bold ${
                    log.resultStatus === 'POSITIVE_HIT'
                      ? 'bg-rose-950 text-rose-300 border border-rose-800'
                      : log.resultStatus === 'SUSPECT_APPREHENDED'
                      ? 'bg-red-600 text-white'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  }`}>
                    {log.resultStatus}
                  </span>
                </div>
                <p className="text-gray-300 font-sans text-xs">
                  {log.findingsSummary}
                </p>
                <div className="text-[10px] text-gray-500 font-sans flex items-center gap-2">
                  <span>📍 {log.location}</span>
                  <span>•</span>
                  <span>{new Date(log.timestamp).toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Manual Modal Log Input */}
      {isNewLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn font-sans">
          <div className="w-full max-w-md bg-[#0F1318] border border-amber-500/60 rounded-2xl p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-gray-800 pb-2">
              <span className="font-bold text-amber-400 text-sm">CATAT LOG PENUGASAN K-9 MANUAL</span>
              <button onClick={() => setIsNewLogModal(false)}><X className="w-4 h-4 text-gray-400" /></button>
            </div>
            <form onSubmit={handleCreateLogSubmit} className="space-y-3">
              <div>
                <label className="block text-gray-300 font-bold mb-1">Pilih Anjing Pelacak</label>
                <select
                  value={selectedDog}
                  onChange={(e) => setSelectedDog(e.target.value)}
                  className="w-full bg-[#141820] border border-gray-700 rounded-lg p-2 text-gray-200"
                >
                  {k9Partners.map(p => <option key={p.id} value={p.dogName}>{p.dogName} ({p.specialization})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-gray-300 font-bold mb-1">Target Penyisiran</label>
                <select
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value as any)}
                  className="w-full bg-[#141820] border border-gray-700 rounded-lg p-2 text-gray-200"
                >
                  <option value="VEHICLE_SNIFF">Penyisiran Kendaraan (Vehicle Sniff)</option>
                  <option value="BUILDING_SWEEP">Penyisiran Gedung / Rumah (Building Sweep)</option>
                  <option value="FUGITIVE_TRACKING">Pelacakan Jejak Buronan (Fugitive Tracking)</option>
                  <option value="CROWD_CONTROL">Pengendalian Massa / Barikade (Crowd Control)</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-300 font-bold mb-1">Lokasi TKP / Objek *</label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Contoh: Parkiran Pantai Vespucci"
                  className="w-full bg-[#141820] border border-gray-700 rounded-lg p-2 text-gray-200"
                />
              </div>
              <div>
                <label className="block text-gray-300 font-bold mb-1">Hasil Respon Anjing</label>
                <select
                  value={resultStatus}
                  onChange={(e) => setResultStatus(e.target.value as any)}
                  className="w-full bg-[#141820] border border-gray-700 rounded-lg p-2 text-gray-200 font-mono"
                >
                  <option value="POSITIVE_HIT">POSITIVE HIT (Ditemukan Bau Narkoba / Senjata)</option>
                  <option value="NEGATIVE_CLEAR">NEGATIVE CLEAR (Area Bersih / Tidak Ditemukan)</option>
                  <option value="SUSPECT_APPREHENDED">SUSPECT APPREHENDED (Tersangka Dilumpuhkan Gigitan K-9)</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-300 font-bold mb-1">Rincian Temuan & Kronologi *</label>
                <textarea
                  rows={2}
                  required
                  value={findingsSummary}
                  onChange={(e) => setFindingsSummary(e.target.value)}
                  placeholder="Detail zat yang tercium atau respon anjing menggaruk jok..."
                  className="w-full bg-[#141820] border border-gray-700 rounded-lg p-2 text-gray-200"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-800">
                <button type="button" onClick={() => setIsNewLogModal(false)} className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded-lg">Batal</button>
                <button type="submit" className="px-4 py-1.5 bg-amber-600 text-black font-bold rounded-lg">Simpan Log K-9</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
