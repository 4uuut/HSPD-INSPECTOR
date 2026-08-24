import React, { useState } from 'react';
import { MEGAPHONE_CATEGORIES } from '../data/rpActionsData';
import { Megaphone, Copy, Check, Radio, AlertOctagon, Car, Building2, UserX } from 'lucide-react';

export const MegaphoneStudio: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('traffic');
  const [vehicleName, setVehicleName] = useState<string>('Sultan');
  const [vehicleColor, setVehicleColor] = useState<string>('Hitam');
  const [vehiclePlate, setVehiclePlate] = useState<string>('LS-4921');
  const [locationName, setLocationName] = useState<string>('Bank Pusat Los Santos');
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  const activeCategory = MEGAPHONE_CATEGORIES.find(c => c.id === activeTab) || MEGAPHONE_CATEGORIES[0];

  const formatText = (template: string) => {
    return template
      .replace(/{VEHICLE}/g, vehicleName || 'Kendaraan')
      .replace(/{COLOR}/g, vehicleColor || 'Warna')
      .replace(/{PLATE}/g, vehiclePlate || 'Plat')
      .replace(/{LOCATION}/g, locationName || 'Lokasi');
  };

  const handleCopy = (text: string, id: string) => {
    const formatted = `/m ${formatText(text)}`;
    navigator.clipboard.writeText(formatted);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div id="megaphone-studio-root" className="space-y-3">
      {/* Tab Selectors */}
      <div className="flex flex-wrap gap-1 border-b border-gray-800 pb-2">
        {MEGAPHONE_CATEGORIES.map((cat) => {
          const isCurrent = activeTab === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`px-3 py-1.5 rounded text-[11px] font-bold tracking-tight transition flex items-center gap-1.5 ${
                isCurrent
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                  : 'bg-[#161B22] border border-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-800'
              }`}
            >
              {cat.id === 'traffic' && <Car className="w-3.5 h-3.5" />}
              {cat.id === 'pursuit' && <AlertOctagon className="w-3.5 h-3.5" />}
              {cat.id === 'robbery' && <Building2 className="w-3.5 h-3.5" />}
              {cat.id === 'hostage' && <UserX className="w-3.5 h-3.5" />}
              <span>{cat.title}</span>
            </button>
          );
        })}
      </div>

      {/* Target Parameters Bar */}
      <div className="bg-[#161B22] border border-gray-800 rounded-md p-3 shadow-xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-blue-400" />
            Parameter Variabel Megaphone (/m)
          </span>
          <span className="text-[9px] font-mono text-gray-600">DYNAMIC_REPLACE</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {activeTab === 'traffic' || activeTab === 'pursuit' ? (
            <>
              <div>
                <label className="text-[10px] font-bold uppercase text-gray-500 block mb-1">Model Kendaraan</label>
                <input
                  type="text"
                  value={vehicleName}
                  onChange={(e) => setVehicleName(e.target.value)}
                  placeholder="Sultan, Premier, Sanchez..."
                  className="w-full px-2.5 py-1 bg-[#0D0F14] border border-gray-800 focus:border-blue-500 rounded text-xs text-gray-200 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-gray-500 block mb-1">Warna Kendaraan</label>
                <input
                  type="text"
                  value={vehicleColor}
                  onChange={(e) => setVehicleColor(e.target.value)}
                  placeholder="Hitam, Merah, Biru..."
                  className="w-full px-2.5 py-1 bg-[#0D0F14] border border-gray-800 focus:border-blue-500 rounded text-xs text-gray-200 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-gray-500 block mb-1">Nomor Plat (Opsional)</label>
                <input
                  type="text"
                  value={vehiclePlate}
                  onChange={(e) => setVehiclePlate(e.target.value)}
                  placeholder="LS-1234..."
                  className="w-full px-2.5 py-1 bg-[#0D0F14] border border-gray-800 focus:border-blue-500 rounded text-xs text-gray-200 outline-none font-mono"
                />
              </div>
            </>
          ) : (
            <div className="lg:col-span-3">
              <label className="text-[10px] font-bold uppercase text-gray-500 block mb-1">Nama Lokasi / Bank / Area</label>
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="Bank Pusat Los Santos, Palomino Bank, Toko 24/7..."
                className="w-full px-2.5 py-1 bg-[#0D0F14] border border-gray-800 focus:border-blue-500 rounded text-xs text-gray-200 outline-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* Preset List */}
      <div className="grid grid-cols-1 gap-2.5">
        {activeCategory.presets.map((preset, idx) => {
          const formatted = formatText(preset.text);
          const fullCmd = `/m ${formatted}`;
          const isCopied = copiedIndex === `${activeTab}-${idx}`;

          return (
            <div
              key={idx}
              className="bg-[#161B22] border border-gray-800 rounded-md p-3 space-y-2 hover:border-gray-700 transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#0D0F14] border border-gray-800 text-blue-400">
                    {preset.level}
                  </span>
                </div>
                <button
                  onClick={() => handleCopy(preset.text, `${activeTab}-${idx}`)}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition ${
                    isCopied
                      ? 'bg-green-600 text-white'
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-500/20'
                  }`}
                >
                  {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{isCopied ? 'DISALIN (/M)' : 'SALIN /M'}</span>
                </button>
              </div>

              <div className="p-2.5 bg-[#090B10] border border-gray-800/80 rounded font-mono text-xs text-gray-200 leading-relaxed select-all">
                {fullCmd}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
