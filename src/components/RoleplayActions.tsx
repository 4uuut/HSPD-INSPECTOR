import React, { useState } from 'react';
import { MIRANDA_WARNINGS, RP_PRESETS } from '../data/rpActionsData';
import { ShieldAlert, Copy, Check, BookOpen, UserCheck, Flame, Radio } from 'lucide-react';

export const RoleplayActions: React.FC = () => {
  const [selectedLang, setSelectedLang] = useState<'indonesia' | 'english'>('indonesia');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const copyFullMiranda = () => {
    const lines = MIRANDA_WARNINGS[selectedLang].join('\n');
    handleCopy(lines, 'full-miranda');
  };

  return (
    <div id="roleplay-actions-root" className="space-y-4">
      {/* SECTION 1: Hak Miranda */}
      <div className="bg-[#161B22] border border-gray-800 rounded-md p-3.5 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-gray-100 uppercase tracking-tight">Pembacaan Hak Miranda (Miranda Warning)</h2>
              <p className="text-[10px] text-gray-500 font-mono">Wajib dibacakan setelah pemborgolan (/cuff) sebelum interogasi</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSelectedLang('indonesia')}
              className={`px-2.5 py-1 rounded text-[10px] font-bold transition font-mono ${
                selectedLang === 'indonesia'
                  ? 'bg-amber-600 text-white shadow-sm shadow-amber-500/20'
                  : 'bg-[#0D0F14] text-gray-400 border border-gray-800 hover:text-gray-200'
              }`}
            >
              ID (INDONESIA)
            </button>
            <button
              onClick={() => setSelectedLang('english')}
              className={`px-2.5 py-1 rounded text-[10px] font-bold transition font-mono ${
                selectedLang === 'english'
                  ? 'bg-amber-600 text-white shadow-sm shadow-amber-500/20'
                  : 'bg-[#0D0F14] text-gray-400 border border-gray-800 hover:text-gray-200'
              }`}
            >
              EN (ENGLISH)
            </button>
            <button
              onClick={copyFullMiranda}
              className="px-2.5 py-1 bg-[#0D0F14] hover:bg-gray-800 text-gray-200 text-[10px] font-bold rounded flex items-center gap-1 border border-gray-700 transition font-mono"
            >
              {copiedKey === 'full-miranda' ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-gray-400" />}
              <span>{copiedKey === 'full-miranda' ? 'DISALIN!' : 'COPY ALL'}</span>
            </button>
          </div>
        </div>

        {/* Lines */}
        <div className="grid grid-cols-1 gap-1.5">
          {MIRANDA_WARNINGS[selectedLang].map((line, i) => (
            <div
              key={i}
              className="p-2 bg-[#0D0F14] border border-gray-800 rounded flex items-center justify-between gap-3 hover:border-gray-700 transition"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-5 h-5 rounded bg-black/50 border border-gray-700 text-gray-400 flex items-center justify-center text-[10px] font-mono font-bold shrink-0">
                  {i + 1}
                </span>
                <span className="text-xs text-gray-200 font-medium truncate">{line}</span>
              </div>
              <button
                onClick={() => handleCopy(line, `miranda-line-${i}`)}
                className="px-2 py-0.5 bg-[#161B22] hover:bg-gray-700 text-gray-300 text-[10px] font-mono font-bold rounded shrink-0 flex items-center gap-1 border border-gray-700 transition"
              >
                {copiedKey === `miranda-line-${i}` ? <Check className="w-2.5 h-2.5 text-green-400" /> : <Copy className="w-2.5 h-2.5" />}
                <span>{copiedKey === `miranda-line-${i}` ? 'DONE' : 'COPY'}</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: Roleplay Action Presets */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-400" />
            <h2 className="text-xs font-bold text-gray-100 uppercase tracking-tight">Katalog Preset Tindakan Roleplay (/me & /do)</h2>
          </div>
          <span className="text-[10px] font-mono text-gray-500 uppercase">{RP_PRESETS.length} PRESETS</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {RP_PRESETS.map((preset) => {
            const allText = preset.commands.map(c => {
              if (c.type === 'me') return `/me ${c.text}`;
              if (c.type === 'do') return `/do ${c.text}`;
              if (c.type === 'say') return c.text;
              return c.text;
            }).join('\n');

            return (
              <div
                key={preset.id}
                className="bg-[#161B22] border border-gray-800 rounded-md p-3 flex flex-col justify-between space-y-2 hover:border-gray-700 transition"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#0D0F14] border border-gray-800 text-blue-400 font-mono">
                      {preset.category}
                    </span>
                    <button
                      onClick={() => handleCopy(allText, preset.id)}
                      className="text-[10px] font-mono font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition"
                    >
                      {copiedKey === preset.id ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === preset.id ? 'DISALIN!' : 'COPY ALL FLOW'}</span>
                    </button>
                  </div>
                  <h3 className="text-xs font-bold text-gray-100">{preset.title}</h3>
                </div>

                <div className="space-y-1 p-2 bg-[#090B10] border border-gray-800/80 rounded">
                  {preset.commands.map((cmd, cIdx) => (
                    <div key={cIdx} className="flex items-start justify-between gap-1.5 text-[11px] font-mono">
                      <div className="flex items-start gap-1.5 min-w-0">
                        <span className={`px-1 py-0.2 rounded font-bold uppercase shrink-0 text-[9px] ${
                          cmd.type === 'me' ? 'bg-purple-950 text-purple-300 border border-purple-800/60' :
                          cmd.type === 'do' ? 'bg-green-950 text-green-300 border border-green-800/60' :
                          cmd.type === 'cmd' ? 'bg-amber-950 text-amber-300 border border-amber-800/60' :
                          'bg-blue-950 text-blue-300 border border-blue-800/60'
                        }`}>
                          {cmd.type === 'cmd' ? 'CMD' : `/${cmd.type}`}
                        </span>
                        <span className="text-gray-300 leading-snug break-all">
                          {cmd.type === 'me' ? `/me ${cmd.text}` : cmd.type === 'do' ? `/do ${cmd.text}` : cmd.text}
                        </span>
                      </div>
                      <button
                        onClick={() => handleCopy(cmd.type === 'me' ? `/me ${cmd.text}` : cmd.type === 'do' ? `/do ${cmd.text}` : cmd.text, `${preset.id}-${cIdx}`)}
                        className="text-gray-500 hover:text-gray-200 shrink-0 p-0.5"
                        title="Copy baris ini"
                      >
                        {copiedKey === `${preset.id}-${cIdx}` ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
