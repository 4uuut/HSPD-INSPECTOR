import React, { useState, useEffect } from 'react';
import { 
  Activity, Zap, RefreshCw, CheckCircle2, AlertCircle, 
  Globe, Bot, Radio, X, Server, Clock, Shield, Wifi, ExternalLink
} from 'lucide-react';
import { sendSystemPingToDiscord } from '../utils/autoChangelogBroadcaster';
import { OfficerProfile } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentOfficer?: OfficerProfile | null;
}

export const SystemPingModal: React.FC<Props> = ({ isOpen, onClose, currentOfficer }) => {
  const [targetChannelId, setTargetChannelId] = useState<string>(() => {
    return localStorage.getItem('hspd_changelog_channel_id') || '1550418868814610433';
  });
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; data?: any } | null>(null);
  const [serverStats, setServerStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [autoPingEnabled, setAutoPingEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('hspd_auto_ping_enabled');
    return saved === null ? true : saved === 'true';
  });

  // Fetch live server health stats on modal open
  const fetchLiveStats = async () => {
    setIsLoadingStats(true);
    try {
      const res = await fetch('/api/discord/ping-status');
      if (res.ok) {
        const data = await res.json();
        setServerStats(data);
      }
    } catch (e) {
      console.warn('Failed to fetch ping status:', e);
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLiveStats();
      const interval = setInterval(fetchLiveStats, 8000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const handleSendPingNow = async () => {
    setIsSending(true);
    setResult(null);
    try {
      localStorage.setItem('hspd_changelog_channel_id', targetChannelId);
      const res = await sendSystemPingToDiscord({
        channelId: targetChannelId || '1550418868814610433',
        triggerBy: `${currentOfficer?.name || 'Petugas'} (${currentOfficer?.badge || 'HSPD'})`,
        websiteUrl: window.location.origin
      });
      setResult(res);
      fetchLiveStats();
    } catch (err: any) {
      setResult({
        success: false,
        message: err.message || 'Gagal mengirim ping status ke Discord'
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleToggleAutoPing = (checked: boolean) => {
    setAutoPingEnabled(checked);
    localStorage.setItem('hspd_auto_ping_enabled', String(checked));
    fetch('/api/discord/bot-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ autoPingEnabled: checked })
    }).catch(() => {});
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0B0E14] border border-blue-600/60 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-blue-950/80 via-[#0E1522] to-[#0B0E14] border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/50 flex items-center justify-center text-blue-400">
              <Activity className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-gray-100 font-sans tracking-tight">
                  MONITORING & PING STATUS SISTEM
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>AKTIF 24/7</span>
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Pemeriksaan status konektivitas website & bot dispatch Discord ke channel <code className="text-blue-300 font-mono">#{targetChannelId}</code>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Jawaban Langsung: Lokasi & Otomatisasi */}
          <div className="p-3.5 bg-blue-950/40 border border-blue-800/70 rounded-xl text-xs space-y-2">
            <div className="font-bold text-blue-200 flex items-center gap-2">
              <Radio className="w-4 h-4 text-blue-400" />
              <span>SISTEM PENGIRIMAN: OTOMATIS & MANUAL</span>
            </div>
            <p className="text-gray-300 leading-relaxed">
              • <strong>Otomatis Kirim:</strong> Sistem sudah disetel <strong>aktif otomatis</strong> mengirimkan ping laporan status ke channel Discord <strong className="text-blue-300 font-mono">1550418868814610433</strong> saat server dimulai dan secara berkala setiap 60 menit.<br />
              • <strong>Manual Kirim (Tombol Instan):</strong> Anda dapat menekan tombol <strong>&quot;⚡ Kirim Ping Status Sekarang&quot;</strong> di bawah ini kapan saja untuk langsung mengirimkan laporan status terbaru ke Discord.
            </p>
          </div>

          {/* Metric Tiles: Website & Bot Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Website Status Card */}
            <div className="p-3.5 bg-[#121620] border border-gray-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-emerald-400" />
                  <span>Status Website CAD/MDT</span>
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>ONLINE</span>
                </span>
              </div>
              <div className="space-y-1 text-[11px] font-mono text-gray-400">
                <div className="flex justify-between">
                  <span>Kecepatan Respon:</span>
                  <span className="text-emerald-400 font-bold">~18 - 25 ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Framework:</span>
                  <span className="text-gray-200">Vite + React 19</span>
                </div>
                <div className="flex justify-between">
                  <span>Backend Engine:</span>
                  <span className="text-gray-200">Express Full-Stack</span>
                </div>
              </div>
            </div>

            {/* Bot Discord Status Card */}
            <div className="p-3.5 bg-[#121620] border border-gray-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                  <Bot className="w-4 h-4 text-blue-400" />
                  <span>Status Bot Discord</span>
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 ${
                  serverStats?.bot?.isOnline 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${serverStats?.bot?.isOnline ? 'bg-emerald-400' : 'bg-blue-400'}`}></span>
                  <span>{serverStats?.bot?.isOnline ? 'ONLINE GATEWAY' : 'AKTIF REST API'}</span>
                </span>
              </div>
              <div className="space-y-1 text-[11px] font-mono text-gray-400">
                <div className="flex justify-between">
                  <span>Username Bot:</span>
                  <span className="text-gray-200">{serverStats?.bot?.botUser?.username || 'HSPD Bot Dispatch'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Target Channel:</span>
                  <span className="text-blue-300 font-bold">#{targetChannelId}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status Token:</span>
                  <span className={serverStats?.bot?.hasToken ? 'text-emerald-400' : 'text-amber-400'}>
                    {serverStats?.bot?.hasToken ? 'Terkonfigurasi ✓' : 'Standby'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Target Channel Configuration */}
          <div className="p-3.5 bg-[#0D1117] border border-gray-800 rounded-xl space-y-2">
            <label className="block text-xs font-bold text-gray-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-blue-400" />
                <span>Channel Discord Tujuan Pengiriman Ping:</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">CHANNEL TARGET RESMI</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={targetChannelId}
                onChange={(e) => {
                  const val = e.target.value.trim();
                  setTargetChannelId(val);
                  localStorage.setItem('hspd_changelog_channel_id', val);
                }}
                placeholder="1550418868814610433"
                className="flex-1 px-3 py-2 bg-[#161B22] border border-gray-700 rounded-lg text-xs font-mono text-gray-100 focus:outline-hidden focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => {
                  setTargetChannelId('1550418868814610433');
                  localStorage.setItem('hspd_changelog_channel_id', '1550418868814610433');
                }}
                className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-mono transition"
                title="Reset ke Channel 1550418868814610433"
              >
                Default 1550418868814610433
              </button>
            </div>
          </div>

          {/* Auto Ping Switch */}
          <div className="p-3 bg-[#0D1117] border border-gray-800 rounded-xl flex items-center justify-between">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoPingEnabled}
                onChange={(e) => handleToggleAutoPing(e.target.checked)}
                className="w-4 h-4 rounded border-gray-700 text-blue-600 focus:ring-blue-500 bg-[#161B22]"
              />
              <div>
                <span className="text-xs font-bold text-gray-200 block">
                  Otomatis Kirim Ping Rutin ke Channel #{targetChannelId} (Setiap 60 Menit)
                </span>
                <span className="text-[10px] text-gray-500 block">
                  Memantau server 24/7 dan memberikan laporan kesehatan otomatis ke Discord
                </span>
              </div>
            </label>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
              autoPingEnabled ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-gray-800 text-gray-400'
            }`}>
              {autoPingEnabled ? 'AUTO ON' : 'AUTO OFF'}
            </span>
          </div>

          {/* Feedback Result Alert */}
          {result && (
            <div className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 ${
              result.success 
                ? 'bg-emerald-950/70 border-emerald-600 text-emerald-300' 
                : 'bg-rose-950/70 border-rose-600 text-rose-300'
            }`}>
              {result.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              )}
              <span className="leading-snug">{result.message}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#0D1117] border-t border-gray-800 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={fetchLiveStats}
            disabled={isLoadingStats}
            className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-mono transition flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingStats ? 'animate-spin' : ''}`} />
            <span>Segarkan Status</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-bold transition"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handleSendPingNow}
              disabled={isSending}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-bold font-mono transition flex items-center gap-2 shadow-lg shadow-emerald-950/50 disabled:opacity-50"
            >
              {isSending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Mengirim Laporan ke Discord...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-yellow-300" />
                  <span>KIRIM PING STATUS SEKARANG</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
