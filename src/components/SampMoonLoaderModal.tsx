import React, { useState, useEffect } from 'react';
import { 
  Gamepad2, Download, Check, Copy, Terminal, Radio, Shield, 
  ExternalLink, Play, RefreshCw, AlertTriangle, Zap, CheckCircle2, 
  Wifi, HelpCircle, X, ChevronRight, Laptop, MonitorSmartphone, Bell
} from 'lucide-react';
import { OfficerProfile } from '../types';
import { buildApiUrl } from '../utils/discordWebhook';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentOfficer: OfficerProfile | null;
  onDutyStatusChanged?: (newDutyState: boolean, newDutyStartTime: number, statusCode?: string) => void;
}

export const SampMoonLoaderModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentOfficer,
  onDutyStatusChanged
}) => {
  const [activeTab, setActiveTab] = useState<'guide' | 'tester' | 'code' | 'commands'>('guide');
  const [copied, setCopied] = useState(false);
  
  // Connection tester states
  const [isTestingPing, setIsTestingPing] = useState(false);
  const [pingResult, setPingResult] = useState<{ online: boolean; latency: number; time?: string; details?: any } | null>(null);
  
  // Simulation states
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationLog, setSimulationLog] = useState<string[]>([]);
  
  // Live in-game officers list from API
  const [liveOfficers, setLiveOfficers] = useState<any[]>([]);
  const [isLoadingLiveOfficers, setIsLoadingLiveOfficers] = useState(false);

  // Get current web origin for display in config
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const downloadUrl = buildApiUrl('/api/samp/download/moonloader');

  // Test Ping Gateway on mount or modal open
  useEffect(() => {
    if (isOpen) {
      testGatewayPing();
      fetchLiveOfficers();
    }
  }, [isOpen]);

  const testGatewayPing = async () => {
    setIsTestingPing(true);
    const start = performance.now();
    try {
      const res = await fetch(buildApiUrl('/api/samp/test-ping'), { method: 'GET' });
      const latency = Math.round(performance.now() - start);
      if (res.ok) {
        const data = await res.json();
        setPingResult({ online: true, latency, time: data.serverTime, details: data });
      } else {
        setPingResult({ online: false, latency, time: new Date().toISOString() });
      }
    } catch {
      const latency = Math.round(performance.now() - start);
      setPingResult({ online: false, latency, time: new Date().toISOString() });
    } finally {
      setIsTestingPing(false);
    }
  };

  const fetchLiveOfficers = async () => {
    setIsLoadingLiveOfficers(true);
    try {
      const res = await fetch(buildApiUrl('/api/samp/live-officers'));
      if (res.ok) {
        const data = await res.json();
        setLiveOfficers(data.officers || []);
      }
    } catch (e) {
      console.warn('Failed to load live SA-MP officers', e);
    } finally {
      setIsLoadingLiveOfficers(false);
    }
  };

  const handleSimulateDuty = async (isDutyState: boolean) => {
    if (!currentOfficer) return;
    setIsSimulating(true);
    const logTime = new Date().toLocaleTimeString('id-ID');
    const actionLabel = isDutyState ? '🟢 ON DUTY (8-1-1)' : '🔴 OFF DUTY (8-1-0)';
    
    try {
      const payload = {
        officerName: currentOfficer.name,
        badge: currentOfficer.badge,
        isDuty: isDutyState,
        dutyStatus: isDutyState ? '8-1-1' : '8-1-0',
        callsign: 'UNIT-1',
        serverIp: '127.0.0.1:7777',
        serverName: 'State of High State RP [TEST SIMULATOR]',
        inGameId: Math.floor(Math.random() * 100) + 1,
        source: 'moonloader'
      };

      const res = await fetch(buildApiUrl('/api/samp/duty'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setSimulationLog(prev => [
          `[${logTime}] ✅ BERHASIL: SA-MP MoonLoader mengirim sinyal ${actionLabel}. Web CAD status terbarui!`,
          ...prev.slice(0, 7)
        ]);

        if (onDutyStatusChanged) {
          onDutyStatusChanged(isDutyState, isDutyState ? Date.now() : 0, isDutyState ? '8-1-1' : '8-1-0');
        }
        fetchLiveOfficers();
      } else {
        setSimulationLog(prev => [
          `[${logTime}] ❌ GAGAL: Server merespon status ${res.status}`,
          ...prev.slice(0, 7)
        ]);
      }
    } catch (err: any) {
      setSimulationLog(prev => [
        `[${logTime}] ⚠️ ERROR KONEKSI: ${err.message || 'Gagal menghubungi API'}`,
        ...prev.slice(0, 7)
      ]);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleSimulatePanic = async () => {
    if (!currentOfficer) return;
    const logTime = new Date().toLocaleTimeString('id-ID');
    try {
      const res = await fetch(buildApiUrl('/api/samp/panic'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          officerName: currentOfficer.name,
          badge: currentOfficer.badge,
          location: 'Commerce, Los Santos (Dekat City Hall / HQ)',
          inGameId: 44
        })
      });
      if (res.ok) {
        setSimulationLog(prev => [
          `[${logTime}] 🚨 PANIC 10-20 DISIARKAN: Sinyal darurat in-game terkirim ke Web CAD Dispatch!`,
          ...prev.slice(0, 7)
        ]);
      }
    } catch {}
  };

  const copyLuaCode = () => {
    const code = `-- ============================================================================
-- HIGH STATE POLICE DEPARTMENT (HSPD) - CAD / MDT SA-MP MOONLOADER SYNC SCRIPT
-- Download lengkap via tombol 'Download HSPD_CAD_Sync.lua' di terminal web.
-- Konfigurasi tersimpan di: GTA San Andreas/moonloader/config/hspd_sync.ini
-- ============================================================================
-- Jalankan /hspd di chat game SA-MP untuk melihat panduan interaktif.`;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-sans">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-[#0A0D14] border border-cyan-500/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-gray-200">
        
        {/* MODAL HEADER */}
        <div className="px-6 py-4 bg-[#0d121d] border-b border-cyan-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-400/50 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-950/50">
              <Gamepad2 className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white tracking-wide uppercase font-mono">
                  GTA SA-MP & MoonLoader Gateway
                </h2>
                <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
                  v3.8 SYNC ENGINE
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Sinkronisasi status dinas polisi otomatis antara Game GTA SA-MP dan Web CAD/MDT
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex border-b border-gray-800 bg-[#070A0F] px-6 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('guide')}
            className={`pb-2.5 px-3 text-xs font-bold transition flex items-center gap-2 border-b-2 ${
              activeTab === 'guide'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>1. Panduan Cepat (3 Langkah)</span>
          </button>

          <button
            onClick={() => setActiveTab('tester')}
            className={`pb-2.5 px-3 text-xs font-bold transition flex items-center gap-2 border-b-2 ${
              activeTab === 'tester'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Play className="w-4 h-4" />
            <span>2. Live Tester & Simulasi</span>
          </button>

          <button
            onClick={() => setActiveTab('code')}
            className={`pb-2.5 px-3 text-xs font-bold transition flex items-center gap-2 border-b-2 ${
              activeTab === 'code'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>3. Unduh Script (.LUA)</span>
          </button>

          <button
            onClick={() => setActiveTab('commands')}
            className={`pb-2.5 px-3 text-xs font-bold transition flex items-center gap-2 border-b-2 ${
              activeTab === 'commands'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>4. Perintah In-Game</span>
          </button>
        </div>

        {/* TAB CONTENTS */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: PANDUAN CEPAT */}
          {activeTab === 'guide' && (
            <div className="space-y-6">
              {/* How it works summary banner */}
              <div className="p-4 bg-gradient-to-r from-cyan-950/60 to-blue-950/40 border border-cyan-500/40 rounded-xl flex items-start gap-3 shadow-lg">
                <Zap className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-cyan-200">
                    Bagaimana Sistem Mengetahui Anda Sedang Dinas di GTA SA-MP?
                  </h4>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    Dengan memasang script <strong>HSPD_CAD_Sync.lua</strong> di folder <code>GTA San Andreas\moonloader\</code>, setiap kali Anda mengetik <code>/duty</code> di game atau server mengirim pesan <em>&quot;You are now on duty&quot;</em>, script akan langsung mengirim sinyal HTTP terenkripsi ke Web CAD HSPD. Status dinas di website langsung berubah ke <strong>🟢 10-8 ON DUTY</strong> lengkap dengan waktu mulai dinas dan callsign Anda!
                  </p>
                </div>
              </div>

              {/* 3 Steps */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-[#0d121d] border border-gray-800 rounded-xl space-y-3 relative overflow-hidden">
                  <div className="w-7 h-7 rounded-lg bg-cyan-900/60 border border-cyan-500/50 flex items-center justify-center font-mono font-bold text-xs text-cyan-300">
                    1
                  </div>
                  <h5 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-cyan-400" />
                    <span>Unduh File Lua</span>
                  </h5>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Unduh file resmi <strong>HSPD_CAD_Sync.lua</strong> dari tab &quot;Unduh Script&quot; atau klik tombol di bawah. File sudah otomatis mengonfigurasi alamat server web ini.
                  </p>
                  <a
                    href={downloadUrl}
                    download="HSPD_CAD_Sync.lua"
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold font-mono transition shadow-md shadow-cyan-900/40"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh Script</span>
                  </a>
                </div>

                <div className="p-4 bg-[#0d121d] border border-gray-800 rounded-xl space-y-3 relative overflow-hidden">
                  <div className="w-7 h-7 rounded-lg bg-blue-900/60 border border-blue-500/50 flex items-center justify-center font-mono font-bold text-xs text-blue-300">
                    2
                  </div>
                  <h5 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Laptop className="w-4 h-4 text-blue-400" />
                    <span>Pasang ke GTA</span>
                  </h5>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Salin file <code>HSPD_CAD_Sync.lua</code> ke dalam folder:
                  </p>
                  <div className="p-2 bg-black/60 border border-gray-800 rounded text-[11px] font-mono text-cyan-300 break-all">
                    GTA San Andreas\moonloader\
                  </div>
                  <p className="text-[11px] text-gray-500">
                    *Pastikan GTA Anda sudah terpasang MoonLoader v0.26+.
                  </p>
                </div>

                <div className="p-4 bg-[#0d121d] border border-gray-800 rounded-xl space-y-3 relative overflow-hidden">
                  <div className="w-7 h-7 rounded-lg bg-emerald-900/60 border border-emerald-500/50 flex items-center justify-center font-mono font-bold text-xs text-emerald-300">
                    3
                  </div>
                  <h5 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Ketik /duty di Game</span>
                  </h5>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Buka game GTA SA-MP, sambungkan ke server favorit Anda. Cukup ketik <code>/duty</code> di chat in-game!
                  </p>
                  <div className="p-2 bg-emerald-950/40 border border-emerald-500/30 rounded text-[11px] font-mono text-emerald-300">
                    [HSPD CAD] 🟢 ON DUTY Sync Active
                  </div>
                </div>
              </div>

              {/* Requirement details */}
              <div className="p-4 bg-[#0d121d] border border-gray-800 rounded-xl space-y-3">
                <h5 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                  <Shield className="w-4 h-4 text-cyan-400" />
                  <span>Kebutuhan Minimum Modding GTA San Andreas</span>
                </h5>
                <ul className="text-xs text-gray-400 space-y-2 list-disc pl-5">
                  <li><strong>GTA San Andreas (v1.0 US Hoodlum)</strong> atau instalasi GTA SA-MP standar.</li>
                  <li><strong>CLEO 4</strong> dan <strong>SAMPFUNCS 5.4.1+</strong>.</li>
                  <li><strong>MoonLoader v0.26 atau v0.27</strong> (tersedia gratis di blast.hk).</li>
                  <li>Koneksi internet aktif untuk berkomunikasi dengan REST API CAD HSPD.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 2: LIVE TESTER & SIMULATOR */}
          {activeTab === 'tester' && (
            <div className="space-y-6">
              {/* Ping & Gateway Status */}
              <div className="p-4 bg-[#0d121d] border border-gray-800 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3.5 h-3.5 rounded-full ${pingResult?.online ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                  <div>
                    <div className="text-xs font-bold text-white font-mono flex items-center gap-2">
                      <span>GATEWAY STATUS:</span>
                      <span className={pingResult?.online ? 'text-emerald-400' : 'text-rose-400'}>
                        {pingResult?.online ? '🟢 ONLINE & READY' : '🔴 OFFLINE'}
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-400 mt-0.5">
                      Endpoint: <code className="text-cyan-300">/api/samp/duty</code> | Latency:{' '}
                      <strong className="text-white">{pingResult?.latency || 0} ms</strong>
                    </div>
                  </div>
                </div>
                <button
                  onClick={testGatewayPing}
                  disabled={isTestingPing}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold rounded-lg transition flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTestingPing ? 'animate-spin' : ''}`} />
                  <span>Cek Ulang</span>
                </button>
              </div>

              {/* Action Simulator */}
              <div className="p-5 bg-[#0d121d] border border-cyan-500/30 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                      <Gamepad2 className="w-4 h-4 text-cyan-400" />
                      <span>Simulasi Event In-Game SA-MP</span>
                    </h4>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Uji coba respons sistem seolah-olah Anda sedang bermain di dalam game GTA SA-MP:
                    </p>
                  </div>
                  {currentOfficer && (
                    <span className="text-xs font-mono bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 px-2.5 py-1 rounded-lg">
                      Petugas: {currentOfficer.name} (#{currentOfficer.badge})
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => handleSimulateDuty(true)}
                    disabled={isSimulating || !currentOfficer}
                    className="p-3 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/60 rounded-xl text-emerald-200 text-xs font-bold flex flex-col items-center gap-1.5 transition active:scale-98 shadow-md"
                  >
                    <div className="flex items-center gap-1.5">
                      <Play className="w-4 h-4 text-emerald-400" />
                      <span>Simulasi /duty [ON]</span>
                    </div>
                    <span className="text-[10px] text-gray-400">Aktifkan 8-1-1 On Duty</span>
                  </button>

                  <button
                    onClick={() => handleSimulateDuty(false)}
                    disabled={isSimulating || !currentOfficer}
                    className="p-3 bg-rose-950/80 hover:bg-rose-900 border border-rose-500/60 rounded-xl text-rose-200 text-xs font-bold flex flex-col items-center gap-1.5 transition active:scale-98 shadow-md"
                  >
                    <div className="flex items-center gap-1.5">
                      <Radio className="w-4 h-4 text-rose-400" />
                      <span>Simulasi /duty [OFF]</span>
                    </div>
                    <span className="text-[10px] text-gray-400">Selesai 8-1-0 Off Duty</span>
                  </button>

                  <button
                    onClick={handleSimulatePanic}
                    disabled={!currentOfficer}
                    className="p-3 bg-amber-950/80 hover:bg-amber-900 border border-amber-500/60 rounded-xl text-amber-200 text-xs font-bold flex flex-col items-center gap-1.5 transition active:scale-98 shadow-md"
                  >
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span>Simulasi /hspd backup</span>
                    </div>
                    <span className="text-[10px] text-gray-400">Kirim 10-20 Panic Button</span>
                  </button>
                </div>

                {/* Simulation Logs */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-gray-400 font-mono uppercase">
                    Log Respon Terminal Simulasi:
                  </span>
                  <div className="p-3 bg-black/70 border border-gray-800 rounded-xl font-mono text-[11px] space-y-1 min-h-[90px] max-h-[140px] overflow-y-auto">
                    {simulationLog.length === 0 ? (
                      <span className="text-gray-500 italic">
                        Belum ada simulasi. Klik salah satu tombol di atas untuk mengetes.
                      </span>
                    ) : (
                      simulationLog.map((log, idx) => (
                        <div key={idx} className="text-gray-300">
                          {log}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Connected SA-MP Officers */}
              <div className="p-4 bg-[#0d121d] border border-gray-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider font-mono flex items-center gap-2">
                    <MonitorSmartphone className="w-4 h-4 text-cyan-400" />
                    <span>Petugas yang Tersinkron dari SA-MP ({liveOfficers.length})</span>
                  </h4>
                  <button
                    onClick={fetchLiveOfficers}
                    disabled={isLoadingLiveOfficers}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoadingLiveOfficers ? 'animate-spin' : ''}`} />
                    <span>Segarkan</span>
                  </button>
                </div>

                {liveOfficers.length === 0 ? (
                  <div className="p-4 text-center text-xs text-gray-500 bg-black/40 rounded-lg">
                    Belum ada petugas yang mengirim sinyal dinas dari game SA-MP.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {liveOfficers.map((off, idx) => (
                      <div key={idx} className="p-2.5 bg-black/50 border border-gray-800 rounded-lg flex items-center justify-between text-xs font-mono">
                        <div className="flex items-center gap-2.5">
                          <span className={`w-2.5 h-2.5 rounded-full ${off.isDuty ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          <div>
                            <span className="font-bold text-white">{off.officerName}</span>{' '}
                            <span className="text-cyan-400">(#{off.badge})</span>
                            <div className="text-[10px] text-gray-400">
                              Server: {off.serverName || 'SA-MP'} • Callsign: {off.callsign || 'UNIT-1'}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            off.isDuty ? 'bg-emerald-950 text-emerald-300 border border-emerald-600' : 'bg-rose-950 text-rose-300 border border-rose-600'
                          }`}>
                            {off.isDuty ? '🟢 10-8 ON DUTY' : '🔴 10-7 OFF DUTY'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: UNDUH & KODE LUA */}
          {activeTab === 'code' && (
            <div className="space-y-5">
              <div className="p-4 bg-[#0d121d] border border-cyan-500/40 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                    <Download className="w-4 h-4 text-cyan-400" />
                    <span>Download Script Otomatis (HSPD_CAD_Sync.lua)</span>
                  </h4>
                  <p className="text-xs text-gray-400 mt-1">
                    Script otomatis terkonfigurasi untuk website ini: <code className="text-cyan-300">{currentOrigin}</code>
                  </p>
                </div>
                <a
                  href={downloadUrl}
                  download="HSPD_CAD_Sync.lua"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold font-mono transition flex items-center gap-2 shadow-lg shadow-cyan-900/50"
                >
                  <Download className="w-4 h-4" />
                  <span>Download .LUA</span>
                </a>
              </div>

              {/* INI Configuration info */}
              <div className="p-4 bg-[#0d121d] border border-gray-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-300 font-mono">
                    📁 Lokasi File Konfigurasi di Komputer Anda:
                  </span>
                  <span className="text-[10px] text-cyan-400 font-mono">Auto-generated</span>
                </div>
                <div className="p-3 bg-black/60 border border-gray-800 rounded-lg font-mono text-xs text-amber-300">
                  GTA San Andreas/moonloader/config/hspd_sync.ini
                </div>
                <pre className="p-3 bg-black/80 border border-gray-800 rounded-lg text-[11px] font-mono text-gray-300 overflow-x-auto">
{`[settings]
server_url = "${currentOrigin}"
officer_badge = "${currentOfficer?.badge || '001'}"
officer_callsign = "UNIT-1"
auto_duty_sync = true
show_hud = true
hud_pos_x = 20
hud_pos_y = 400`}
                </pre>
              </div>

              {/* Source code preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-300 font-mono uppercase">
                    Preview Cuplikan Kode Lua:
                  </span>
                  <button
                    onClick={copyLuaCode}
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Tersalin!' : 'Salin Header'}</span>
                  </button>
                </div>
                <div className="p-3 bg-black/80 border border-gray-800 rounded-xl text-[11px] font-mono text-gray-300 max-h-52 overflow-y-auto leading-relaxed">
{`-- Hook Perintah Game: Deteksi saat pemain ketik /duty
if sampev then
    function sampev.onSendCommand(command)
        if not cfg.settings.auto_duty_sync then return end
        local cmd = command:lower()
        if cmd == "/duty" or cmd:find("^/duty%s*") then
            local nextState = not isDutyLocal
            syncDutyToCad(nextState, nextState and "8-1-1" or "8-1-0")
        end
    end

    function sampev.onServerMessage(color, text)
        local lower = text:lower()
        if lower:find("now on duty") or lower:find("memulai tugas") then
            syncDutyToCad(true, "8-1-1")
        elseif lower:find("now off duty") or lower:find("selesai tugas") then
            syncDutyToCad(false, "8-1-0")
        end
    end
end`}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PERINTAH IN-GAME */}
          {activeTab === 'commands' && (
            <div className="space-y-4">
              <div className="text-xs text-gray-400">
                Berikut adalah daftar perintah praktis yang dapat Anda ketik di kolom chat GTA SA-MP setelah memasang script:
              </div>

              <div className="border border-gray-800 rounded-xl overflow-hidden divide-y divide-gray-800">
                <div className="p-3 bg-[#0d121d] flex items-start gap-4">
                  <div className="font-mono text-xs font-bold text-cyan-400 w-36 shrink-0">
                    /duty
                  </div>
                  <div className="text-xs text-gray-300 space-y-0.5">
                    <div className="font-bold text-white">Deteksi Otomatis Dinas Polisi</div>
                    <div className="text-gray-400">
                      Otomatis mendeteksi saat Anda on duty atau off duty dan mengirimkan status ke website CAD HSPD secara langsung.
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-[#0a0d14] flex items-start gap-4">
                  <div className="font-mono text-xs font-bold text-cyan-400 w-36 shrink-0">
                    /hspd
                  </div>
                  <div className="text-xs text-gray-300 space-y-0.5">
                    <div className="font-bold text-white">Menu Bantuan & Status CAD</div>
                    <div className="text-gray-400">
                      Menampilkan status dinas saat ini, durasi menit patroli, dan petunjuk perintah di chat game.
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-[#0d121d] flex items-start gap-4">
                  <div className="font-mono text-xs font-bold text-cyan-400 w-36 shrink-0">
                    /hspd duty [on/off]
                  </div>
                  <div className="text-xs text-gray-300 space-y-0.5">
                    <div className="font-bold text-white">Manual Force Sync Duty</div>
                    <div className="text-gray-400">
                      Sinkronkan status dinas secara manual jika server game menggunakan custom dialog atau sistem non-standar.
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-[#0a0d14] flex items-start gap-4">
                  <div className="font-mono text-xs font-bold text-cyan-400 w-36 shrink-0">
                    /hspd cad
                  </div>
                  <div className="text-xs text-gray-300 space-y-0.5">
                    <div className="font-bold text-white">Buka Website CAD di Browser</div>
                    <div className="text-gray-400">
                      Membuka Google Chrome / browser default Anda langsung ke Terminal MDT HSPD tanpa perlu mengetik ulang link.
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-[#0d121d] flex items-start gap-4">
                  <div className="font-mono text-xs font-bold text-amber-400 w-36 shrink-0">
                    /hspd miranda
                  </div>
                  <div className="text-xs text-gray-300 space-y-0.5">
                    <div className="font-bold text-white">Pembacaan SOP Hak Miranda Otomatis</div>
                    <div className="text-gray-400">
                      Membacakan pasal & hak tersangka di chat in-game (<code>/s [HSPD] Anda berhak untuk tetap diam...</code>) dengan jeda waktu realistis.
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-[#0a0d14] flex items-start gap-4">
                  <div className="font-mono text-xs font-bold text-rose-400 w-36 shrink-0">
                    /hspd backup
                  </div>
                  <div className="text-xs text-gray-300 space-y-0.5">
                    <div className="font-bold text-white">Panic Button 10-20 Darurat</div>
                    <div className="text-gray-400">
                      Menyiarkan sinyal darurat beserta koordinat lokasi Anda ke seluruh operator Terminal CAD & Discord HSPD.
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-[#0d121d] flex items-start gap-4">
                  <div className="font-mono text-xs font-bold text-cyan-400 w-36 shrink-0">
                    /hspd hud
                  </div>
                  <div className="text-xs text-gray-300 space-y-0.5">
                    <div className="font-bold text-white">Toggle Floating Tactical HUD</div>
                    <div className="text-gray-400">
                      Menampilkan atau menyembunyikan teks indikator dinas & timer melayang di pojok layar game.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-6 py-3.5 bg-[#070A0F] border-t border-gray-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-gray-400">
            <Wifi className="w-4 h-4 text-cyan-400" />
            <span>HSPD CAD Realtime Sync Engine • Compatible with SA-MP v0.3.7-R1 / R3 / R4 / R5 & Open.mp</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-bold transition"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
