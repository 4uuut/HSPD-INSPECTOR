import React, { useState, useEffect } from 'react';
import { 
  Megaphone, X, ChevronRight, Sparkles, Wrench, Zap, 
  Clock, Shield, Building2, Globe, ExternalLink, CheckCircle2 
} from 'lucide-react';
import { 
  SystemAnnouncement, 
  getActiveBannerAnnouncement, 
  dismissAnnouncementBanner 
} from '../utils/systemAnnouncementStorage';

export const GlobalSystemAnnouncementBanner: React.FC = () => {
  const [activeBanner, setActiveBanner] = useState<SystemAnnouncement | null>(() => getActiveBannerAnnouncement());
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    const handleUpdate = () => {
      setActiveBanner(getActiveBannerAnnouncement());
    };

    window.addEventListener('hspd-system-announcements-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('hspd-system-announcements-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  if (!activeBanner) return null;

  const dateStr = new Date(activeBanner.publishedAt).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <>
      {/* Top Floating Announcement Bar */}
      <div className="relative z-50 bg-gradient-to-r from-[#06140E] via-[#092218] to-[#081822] border-b border-emerald-500/50 shadow-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 flex items-center justify-between gap-3 text-xs">
          <div 
            onClick={() => setIsDetailModalOpen(true)}
            className="flex items-center gap-2.5 overflow-hidden cursor-pointer flex-1 group"
          >
            <span className="flex h-2.5 w-2.5 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>

            <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 font-bold font-mono text-[10px] border border-emerald-600/80 shrink-0">
              {activeBanner.version}
            </span>

            <span className="font-bold text-gray-100 truncate group-hover:text-emerald-300 transition">
              {activeBanner.title}
            </span>

            <span className="hidden md:inline text-gray-400 truncate text-[11px]">
              — {activeBanner.description}
            </span>

            <span className="hidden sm:flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-400 shrink-0 group-hover:underline">
              <span>Rincian</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsDetailModalOpen(true)}
              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-mono font-bold transition sm:hidden cursor-pointer"
            >
              Lihat
            </button>
            <button
              type="button"
              onClick={() => {
                dismissAnnouncementBanner(activeBanner.id);
                setActiveBanner(null);
              }}
              className="p-1 text-gray-400 hover:text-white rounded hover:bg-emerald-900/40 transition cursor-pointer"
              title="Tutup banner pemberitahuan ini"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {isDetailModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[#0B1015] border border-emerald-500/70 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-950 via-[#0E161F] to-black border-b border-emerald-500/40 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg shadow-emerald-500/10">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500 text-black font-black font-mono text-xs">
                      {activeBanner.version}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold font-mono text-[10px] border border-emerald-700">
                      {activeBanner.category}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      {dateStr}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-white tracking-tight">
                    {activeBanner.title}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs font-sans">
              <div className="p-3.5 bg-[#101722] border border-gray-800 rounded-xl text-gray-200 leading-relaxed">
                {activeBanner.description}
              </div>

              {/* Features List */}
              {activeBanner.features && activeBanner.features.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-emerald-400 font-mono flex items-center gap-1.5 uppercase text-xs">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>Fitur & Penambahan Baru:</span>
                  </h4>
                  <ul className="space-y-1.5 pl-1">
                    {activeBanner.features.map((f, i) => (
                      <li key={i} className="text-gray-300 flex items-start gap-2 leading-relaxed">
                        <span className="text-emerald-400 font-bold mt-0.5">•</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Improvements */}
              {activeBanner.improvements && activeBanner.improvements.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-gray-800/80">
                  <h4 className="font-bold text-cyan-400 font-mono flex items-center gap-1.5 uppercase text-xs">
                    <Wrench className="w-4 h-4 text-cyan-400" />
                    <span>Penyempurnaan Sistem:</span>
                  </h4>
                  <ul className="space-y-1.5 pl-1">
                    {activeBanner.improvements.map((imp, i) => (
                      <li key={i} className="text-gray-300 flex items-start gap-2 leading-relaxed">
                        <span className="text-cyan-400 font-bold mt-0.5">•</span>
                        <span>{imp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Bug Fixes */}
              {activeBanner.bugFixes && activeBanner.bugFixes.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-gray-800/80">
                  <h4 className="font-bold text-amber-400 font-mono flex items-center gap-1.5 uppercase text-xs">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>Perbaikan Bug & Optimalisasi:</span>
                  </h4>
                  <ul className="space-y-1.5 pl-1">
                    {activeBanner.bugFixes.map((b, i) => (
                      <li key={i} className="text-gray-300 flex items-start gap-2 leading-relaxed">
                        <span className="text-amber-400 font-bold mt-0.5">•</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-3 border-t border-gray-800 flex items-center justify-between text-[11px] font-mono text-gray-500">
                <span>Diterbitkan oleh: <strong className="text-gray-300">{activeBanner.publishedBy}</strong></span>
                <span>Sasaran: <strong className="text-emerald-400">{activeBanner.targetAudience}</strong></span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 bg-[#090E13] border-t border-gray-800 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs font-mono transition cursor-pointer"
              >
                Saya Mengerti (Tutup)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
