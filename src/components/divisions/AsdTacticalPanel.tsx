import React, { useState } from 'react';
import { 
  Radio, Compass, Eye, Zap, Volume2, 
  Copy, Check, ShieldAlert, ArrowUpRight, Plane, Wind, MapPin
} from 'lucide-react';
import { AsdHelicopter, OfficerProfile } from '../../types';
import { saveAsdHelis } from '../../utils/specializedDivisionsStorage';
import { sendDiscordLog, getDiscordWebhookConfig } from '../../utils/discordWebhook';

interface AsdTacticalPanelProps {
  helis: AsdHelicopter[];
  onUpdateHelis: (helis: AsdHelicopter[]) => void;
  currentOfficer: OfficerProfile | null;
}

export const AsdTacticalPanel: React.FC<AsdTacticalPanelProps> = ({
  helis,
  onUpdateHelis,
  currentOfficer
}) => {
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [activeZoom, setActiveZoom] = useState<number>(2);

  // Pursuit 10-Callout Generator state
  const [fleeingVehicle, setFleeingVehicle] = useState('Bravado Buffalo STX');
  const [fleeingColor, setFleeingColor] = useState('Hitam Doff');
  const [fleeingPlate, setFleeingPlate] = useState('LS-889-BB');
  const [headingDirection, setHeadingDirection] = useState('Northbound (Utara)');
  const [fleeingLocation, setFleeingLocation] = useState('Del Perro Freeway Exit 4');
  const [pursuitSpeed, setPursuitSpeed] = useState('125 MPH');
  const [airCalloutResult, setAirCalloutResult] = useState('');

  // LZ Calculator state
  const [lzSurface, setLzSurface] = useState<'ROOFTOP' | 'INTERSECTION' | 'OPEN_FIELD' | 'BEACH' | 'HIGHWAY'>('OPEN_FIELD');
  const [lzWind, setLzWind] = useState('Tenang (5 Knots)');
  const [lzPerimeterSecured, setLzPerimeterSecured] = useState(true);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2500);
  };

  const handleToggleFlir = (heliId: string) => {
    const updated = helis.map(h => {
      if (h.id === heliId) {
        const modes: ('NORMAL' | 'THERMAL_WHITE_HOT' | 'THERMAL_BLACK_HOT' | 'NIGHT_VISION')[] = [
          'NORMAL', 'THERMAL_WHITE_HOT', 'THERMAL_BLACK_HOT', 'NIGHT_VISION'
        ];
        const nextIdx = (modes.indexOf(h.flirThermalMode) + 1) % modes.length;
        return { ...h, flirThermalMode: modes[nextIdx] };
      }
      return h;
    });
    onUpdateHelis(updated);
    saveAsdHelis(updated);
  };

  const handleToggleSearchlight = (heliId: string) => {
    const updated = helis.map(h => h.id === heliId ? { ...h, searchlightActive: !h.searchlightActive } : h);
    onUpdateHelis(updated);
    saveAsdHelis(updated);
  };

  const handleToggleFlightStatus = (heliId: string) => {
    const updated = helis.map(h => {
      if (h.id === heliId) {
        const isAirborne = h.status === 'IN_AIR_PATROL';
        const nextStatus = isAirborne ? 'AVAILABLE' : 'IN_AIR_PATROL';
        return { 
          ...h, 
          status: nextStatus as any, 
          altitudeFeet: isAirborne ? 0 : 1250,
          currentSector: isAirborne ? 'Mission Row Helipad (Standby)' : 'Downtown Metro & Vinewood Corridor'
        };
      }
      return h;
    });
    onUpdateHelis(updated);
    saveAsdHelis(updated);
  };

  const handleGenerateAirCallout = () => {
    const callout = `[AIR-1 ASD PURSUIT CALLOUT] Visual 10-99 on fleeing ${fleeingColor} ${fleeingVehicle} (Plate: ${fleeingPlate || 'UNREGISTERED'}), Heading: ${headingDirection} on ${fleeingLocation}, Speed: ${pursuitSpeed}. Requesting ground units prepare spike strips!`;
    setAirCalloutResult(callout);
  };

  const handleSendAirCalloutDiscord = async () => {
    const cfg = getDiscordWebhookConfig();
    if (!cfg.webhookUrl) {
      alert('Webhook Discord belum disetting.');
      return;
    }
    const success = await sendDiscordLog(cfg.webhookUrl, {
      title: '🚁 ASD AIR-ONE PURSUIT BROADCAST',
      description: airCalloutResult || 'Patroli Udara mengidentifikasi target pengejaran berkecepatan tinggi.',
      color: 0x3b82f6,
      fields: [
        { name: 'Kendaraan', value: `${fleeingColor} ${fleeingVehicle}`, inline: true },
        { name: 'Plat Nomor', value: `\`${fleeingPlate || 'N/A'}\``, inline: true },
        { name: 'Kecepatan & Arah', value: `${pursuitSpeed} • ${headingDirection}`, inline: true },
        { name: 'Lokasi Terakhir', value: fleeingLocation, inline: false },
        { name: 'Petugas ASD', value: `${currentOfficer?.name || 'ASD Pilot'} (${currentOfficer?.badge || '#ASD'})`, inline: true }
      ]
    });
    if (success) {
      alert('✅ Siaran pengejaran ASD berhasil dikirim ke Discord!');
    }
  };

  return (
    <div className="space-y-4 font-sans text-xs">
      {/* Flight Fleet Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {helis.map((heli) => (
          <div
            key={heli.id}
            className="p-4 bg-[#141820] border border-blue-900/60 rounded-2xl space-y-3 relative overflow-hidden"
          >
            {/* Camera Filter Overlay Simulation */}
            {heli.flirThermalMode === 'THERMAL_WHITE_HOT' && (
              <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>
            )}
            {heli.flirThermalMode === 'NIGHT_VISION' && (
              <div className="absolute inset-0 bg-emerald-950/25 pointer-events-none"></div>
            )}
            {heli.flirThermalMode === 'THERMAL_BLACK_HOT' && (
              <div className="absolute inset-0 bg-black/40 pointer-events-none"></div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-950 border border-blue-600/70 flex items-center justify-center text-blue-400 font-bold text-base">
                  🚁
                </div>
                <div>
                  <h3 className="font-bold text-gray-100 text-sm flex items-center gap-2">
                    <span>{heli.tailNumber}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-blue-950 text-blue-300 border border-blue-800">
                      {heli.model}
                    </span>
                  </h3>
                  <p className="text-[11px] text-gray-400 font-mono">Pilot: {heli.pilotName} ({heli.pilotBadge})</p>
                </div>
              </div>

              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono ${
                heli.status === 'IN_AIR_PATROL'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700 animate-pulse'
                  : 'bg-gray-800 text-gray-400 border border-gray-700'
              }`}>
                {heli.status}
              </span>
            </div>

            {/* Flight Metrics */}
            <div className="grid grid-cols-3 gap-2 font-mono">
              <div className="p-2.5 bg-[#0A0D12] rounded-xl border border-gray-800">
                <div className="text-gray-400 text-[10px]">ALTITUDE:</div>
                <div className="font-bold text-amber-300 text-sm mt-0.5">{heli.altitudeFeet} FT</div>
                <div className="text-[9px] text-gray-500 truncate">{heli.currentSector}</div>
              </div>

              <div className="p-2.5 bg-[#0A0D12] rounded-xl border border-gray-800">
                <div className="text-gray-400 text-[10px]">FLIR KAMERA:</div>
                <div className="font-bold text-blue-300 text-xs mt-0.5">{heli.flirThermalMode}</div>
                <div className="text-[9px] text-gray-500">Zoom: {activeZoom}x Optical</div>
              </div>

              <div className="p-2.5 bg-[#0A0D12] rounded-xl border border-gray-800">
                <div className="text-gray-400 text-[10px]">FUEL LEVEL:</div>
                <div className={`font-bold text-xs mt-0.5 ${heli.fuelPercentage > 30 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {heli.fuelPercentage}% AVGAS
                </div>
                <div className="w-full bg-gray-800 h-1.5 rounded-full mt-1 overflow-hidden">
                  <div className="bg-emerald-500 h-full" style={{ width: `${heli.fuelPercentage}%` }}></div>
                </div>
              </div>
            </div>

            {/* Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleToggleFlir(heli.id)}
                  className="px-2.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-xs font-bold transition flex items-center gap-1 border border-gray-700"
                >
                  <Eye className="w-3.5 h-3.5 text-blue-400" />
                  <span>MODE FLIR</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleSearchlight(heli.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 border ${
                    heli.searchlightActive
                      ? 'bg-amber-950 text-amber-300 border-amber-500 shadow-md'
                      : 'bg-gray-800 text-gray-400 border-gray-700'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>SOROT: {heli.searchlightActive ? 'ON' : 'OFF'}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleToggleFlightStatus(heli.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono transition ${
                  heli.status === 'IN_AIR_PATROL'
                    ? 'bg-amber-700 hover:bg-amber-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30'
                }`}
              >
                {heli.status === 'IN_AIR_PATROL' ? '🛬 LANDING / STANDBY' : '🛫 TAKEOFF PATROLI'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Tactical Tools Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Tool 1: Tactical Pursuit Callout Generator */}
        <div className="p-4 bg-[#141820] border border-gray-800 rounded-2xl space-y-3">
          <div className="flex items-center justify-between border-b border-gray-800 pb-2">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-blue-400" />
              <span className="font-bold text-gray-100 text-xs">GENERATOR SIARAN RADIO PENGEJARAN ASD (10-CALLOUT)</span>
            </div>
            <span className="text-[10px] font-mono text-blue-400 bg-blue-950 px-2 py-0.5 rounded border border-blue-800">
              AIR-TO-GROUND
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-gray-400 font-bold block mb-1">Model Kendaraan Buronan</label>
              <input
                type="text"
                value={fleeingVehicle}
                onChange={(e) => setFleeingVehicle(e.target.value)}
                className="w-full bg-[#0A0D12] border border-gray-700 rounded-lg p-2 text-xs text-gray-100"
                placeholder="Contoh: Sultan RS / Comet"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 font-bold block mb-1">Warna Kendaraan</label>
              <input
                type="text"
                value={fleeingColor}
                onChange={(e) => setFleeingColor(e.target.value)}
                className="w-full bg-[#0A0D12] border border-gray-700 rounded-lg p-2 text-xs text-gray-100"
                placeholder="Hitam / Merah / Putih"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-gray-400 font-bold block mb-1">Plat Nomor</label>
              <input
                type="text"
                value={fleeingPlate}
                onChange={(e) => setFleeingPlate(e.target.value)}
                className="w-full bg-[#0A0D12] border border-gray-700 rounded-lg p-2 text-xs text-gray-100 font-mono uppercase"
                placeholder="LS-123"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 font-bold block mb-1">Arah Menuju (Heading)</label>
              <select
                value={headingDirection}
                onChange={(e) => setHeadingDirection(e.target.value)}
                className="w-full bg-[#0A0D12] border border-gray-700 rounded-lg p-2 text-xs text-gray-100"
              >
                <option value="Northbound (Utara)">Northbound (Utara)</option>
                <option value="Southbound (Selatan)">Southbound (Selatan)</option>
                <option value="Eastbound (Timur)">Eastbound (Timur)</option>
                <option value="Westbound (Barat)">Westbound (Barat)</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-gray-400 font-bold block mb-1">Kecepatan</label>
              <input
                type="text"
                value={pursuitSpeed}
                onChange={(e) => setPursuitSpeed(e.target.value)}
                className="w-full bg-[#0A0D12] border border-gray-700 rounded-lg p-2 text-xs text-gray-100 font-mono"
                placeholder="120 MPH"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-gray-400 font-bold block mb-1">Lokasi Terakhir / Rute Jalan</label>
            <input
              type="text"
              value={fleeingLocation}
              onChange={(e) => setFleeingLocation(e.target.value)}
              className="w-full bg-[#0A0D12] border border-gray-700 rounded-lg p-2 text-xs text-gray-100"
              placeholder="Contoh: Del Perro Fwy menuju Vinewood Blvd"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleGenerateAirCallout}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition"
            >
              Generate Callout Radio
            </button>
          </div>

          {airCalloutResult && (
            <div className="p-3 bg-[#0A0D12] border border-blue-700/60 rounded-xl space-y-2 font-mono">
              <div className="text-[10px] text-blue-300 font-bold">HASIL FORMAT SIARAN AIR-ONE:</div>
              <p className="text-xs text-gray-200 select-all leading-relaxed">{airCalloutResult}</p>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleCopy(airCalloutResult, 'callout')}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-xs font-bold flex items-center gap-1"
                >
                  {copiedText === 'callout' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedText === 'callout' ? 'Tersalin!' : 'Salin Teks'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleSendAirCalloutDiscord}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                >
                  <span>Kirim ke Discord</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tool 2: Landing Zone (LZ) Safety Calculator */}
        <div className="p-4 bg-[#141820] border border-gray-800 rounded-2xl space-y-3">
          <div className="flex items-center justify-between border-b border-gray-800 pb-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-gray-100 text-xs">KALKULATOR & PANDUAN PENDARATAN TAKTIS (LZ)</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
              LZ COORDINATOR
            </span>
          </div>

          <div className="space-y-2.5">
            <div>
              <label className="text-[10px] text-gray-400 font-bold block mb-1">Pilih Permukaan / Tipe Zona Pendaratan (LZ)</label>
              <select
                value={lzSurface}
                onChange={(e) => setLzSurface(e.target.value as any)}
                className="w-full bg-[#0A0D12] border border-gray-700 rounded-lg p-2 text-xs text-gray-100"
              >
                <option value="OPEN_FIELD">Lapangan Terbuka / Taman (Open Field - Grade A)</option>
                <option value="ROOFTOP">Atap Gedung Tinggi (Helipad / Rooftop)</option>
                <option value="HIGHWAY">Jalan Tol Freeway (Blokir 2 Jalur)</option>
                <option value="INTERSECTION">Persimpangan Jalan Kota (Street Intersection)</option>
                <option value="BEACH">Pantai Pasir Vespucci (Beach Sand Landing)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-gray-400 font-bold block mb-1">Kecepatan Angin (Wind)</label>
                <input
                  type="text"
                  value={lzWind}
                  onChange={(e) => setLzWind(e.target.value)}
                  className="w-full bg-[#0A0D12] border border-gray-700 rounded-lg p-2 text-xs text-gray-100 font-mono"
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 p-2 bg-[#0A0D12] border border-gray-700 rounded-lg text-xs text-gray-200 cursor-pointer w-full">
                  <input
                    type="checkbox"
                    checked={lzPerimeterSecured}
                    onChange={(e) => setLzPerimeterSecured(e.target.checked)}
                    className="rounded border-gray-700"
                  />
                  <span>Sterilisasi Perimeter (50 FT)</span>
                </label>
              </div>
            </div>

            <div className="p-3 bg-[#0A0D12] rounded-xl border border-gray-800 space-y-1.5 text-xs">
              <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                <Wind className="w-3.5 h-3.5" />
                <span>SOP Pendaratan Helikopter di Sektor:</span>
              </div>
              <ul className="text-gray-300 space-y-1 pl-4 list-disc text-[11px]">
                <li>Unit darat wajib menyalakan <strong>Suar Hijau (Green Flare)</strong> atau strobo patroli di 4 sudut.</li>
                <li>Jarak aman minimum rotor angin adalah <strong>15 meter (50 kaki)</strong> dari kerumunan sipil.</li>
                <li>Dekati helikopter dari <strong>arah depan (arah jarum jam 10:00 - 02:00)</strong> dalam posisi membungkuk, hindari ekor rotor belakang!</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
