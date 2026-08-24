import React, { useState } from 'react';
import { TEN_CODES, RADIO_FREQUENCIES, WEAPON_RULES_DIVISIONS } from '../data/sopData';
import { HSPD_COMMANDS_LIST } from '../data/pasalData';
import { 
  ShieldCheck, Crosshair, Radio, BookOpen, DollarSign, 
  Terminal, Search, Copy, Check, AlertTriangle 
} from 'lucide-react';

export const SopLibrary: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'weapons' | 'pursuit' | 'radio' | 'ethics' | 'fees' | 'commands'>('weapons');
  const [searchTenCode, setSearchTenCode] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const filteredTenCodes = TEN_CODES.filter(tc => {
    const q = searchTenCode.toLowerCase().trim();
    return !q || tc.code.toLowerCase().includes(q) || tc.meaning.toLowerCase().includes(q);
  });

  return (
    <div id="sop-library-root" className="space-y-3">
      {/* Sub Navigation */}
      <div className="flex flex-wrap gap-1 border-b border-gray-800 pb-2">
        {[
          { id: 'weapons', label: 'SOP Persenjataan', icon: Crosshair },
          { id: 'pursuit', label: 'SOP Pursuit & VCB', icon: AlertTriangle },
          { id: 'radio', label: 'Radio & Ten-Codes', icon: Radio },
          { id: 'ethics', label: 'Kode Etik Kepolisian', icon: ShieldCheck },
          { id: 'fees', label: 'Biaya Layanan & SKCK', icon: DollarSign },
          { id: 'commands', label: 'Daftar Perintah HSPD', icon: Terminal },
        ].map(tab => {
          const Icon = tab.icon;
          const isCurrent = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded text-[11px] font-bold tracking-tight transition flex items-center gap-1.5 ${
                isCurrent
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'bg-[#161B22] border border-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: SOP PERSENJATAAN */}
      {activeTab === 'weapons' && (
        <div className="space-y-3">
          <div className="bg-[#161B22] border border-gray-800 rounded-md p-3.5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-gray-100 uppercase tracking-tight flex items-center gap-1.5">
                <Crosshair className="w-4 h-4 text-emerald-400" />
                Ketentuan Senjata Standar Berdasarkan Divisi
              </h2>
              <span className="text-[10px] font-mono font-bold text-amber-400 px-2 py-0.5 rounded bg-[#0D0F14] border border-gray-800">
                MAX 2 SENJATA / PERSONIL
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {WEAPON_RULES_DIVISIONS.map((div, i) => (
                <div key={i} className="p-2.5 bg-[#0D0F14] border border-gray-800 rounded space-y-1.5">
                  <span className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-wider block">
                    {div.div}
                  </span>
                  <ul className="space-y-0.5 text-[11px] text-gray-300 font-mono">
                    {div.weapons.map((w, wIdx) => (
                      <li key={wIdx} className="flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-blue-500"></span>
                        <span className={w.includes('[WAJIB]') ? 'text-amber-300 font-semibold' : ''}>{w}</span>
                      </li>
                    ))}
                  </ul>
                  <span className="text-[9px] text-gray-500 block pt-1 border-t border-gray-800/80">
                    {div.notes}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 bg-[#161B22] border border-gray-800 rounded-md space-y-1.5">
              <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-1 font-mono">
                [8-1-1] ON-DUTY PROTOCOL
              </h3>
              <p className="text-xs text-gray-300 leading-relaxed font-mono text-[11px]">
                • Maksimal membawa 20 clip amunisi.<br />
                • Wajib membawa SLC / Silenced Taser sebagai senjata non-lethal standar.<br />
                • Pengambilan senjata wajib seizin Perwira atau dipandu langsung oleh Perwira.
              </p>
            </div>
            <div className="p-3 bg-[#161B22] border border-gray-800 rounded-md space-y-1.5">
              <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wide flex items-center gap-1 font-mono">
                [8-1-0] OFF-DUTY PROTOCOL
              </h3>
              <p className="text-xs text-gray-300 leading-relaxed font-mono text-[11px]">
                • Hanya diperbolehkan membawa 1 senjata dinas (Colt / Deagle).<br />
                • Maksimal membawa 5 clip amunisi cadangan.<br />
                • Dilarang keras menggunakan seragam dan atribut taktis kepolisian saat off-duty.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SOP PURSUIT & VCB */}
      {activeTab === 'pursuit' && (
        <div className="bg-[#161B22] border border-gray-800 rounded-md p-3.5 shadow-xl space-y-3">
          <div>
            <h2 className="text-xs font-bold text-gray-100 uppercase tracking-tight flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Standar Operasional Prosedur Pengejaran (10-57 VICTOR)
            </h2>
            <p className="text-[10px] text-gray-500 font-mono mt-0.5">
              Pursuit adalah tindakan pengejaran kendaraan tersangka tindak kriminal dengan eskalasi terukur.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            <div className="p-3 bg-[#0D0F14] border border-gray-800 rounded space-y-1.5">
              <span className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-wide block">1. Megaphone Stage</span>
              <p className="text-xs text-gray-300 leading-relaxed font-mono text-[11px]">
                • <strong>Warn 1:</strong> Menit 0–5 awal pengejaran.<br />
                • <strong>Warn 2:</strong> Menit ke-5 berikutnya.<br />
                • <strong>Warn 3:</strong> Menit ke-10 (Otorisasi eskalasi).
              </p>
            </div>

            <div className="p-3 bg-[#0D0F14] border border-gray-800 rounded space-y-1.5">
              <span className="text-[10px] font-mono font-bold text-rose-400 uppercase tracking-wide block">2. Drive-By & PIT</span>
              <p className="text-xs text-gray-300 leading-relaxed font-mono text-[11px]">
                • <strong>Drive-By:</strong> Otorisasi setelah Warn 3. <em>HANYA TEMBAK BAN</em>.<br />
                • <strong>PIT Maneuver:</strong> Otorisasi setelah Warn 3 dan hanya di <em>FREEWAY / HIGHWAY</em>.
              </p>
            </div>

            <div className="p-3 bg-[#0D0F14] border border-gray-800 rounded space-y-1.5">
              <span className="text-[10px] font-mono font-bold text-purple-400 uppercase tracking-wide block">3. Visual Broken (VCB)</span>
              <p className="text-xs text-gray-300 leading-relaxed font-mono text-[11px]">
                • Search window: 10–15 menit di area terakhir.<br />
                • Bila VCB kontak kembali: Personil berhak langsung drive-by ban 2 menit pertama.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RADIO & TEN-CODES */}
      {activeTab === 'radio' && (
        <div className="space-y-3">
          {/* Radio Frequencies */}
          <div className="bg-[#161B22] border border-gray-800 rounded-md p-3 shadow-xl space-y-2">
            <h2 className="text-xs font-bold text-gray-100 uppercase tracking-tight flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-blue-400" />
              Frekuensi Radio Khusus Operasi (TACTICAL COMM)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {RADIO_FREQUENCIES.map((rf, idx) => (
                <div key={idx} className="p-2.5 bg-[#0D0F14] border border-gray-800 rounded space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-blue-400">{rf.freq} MHz</span>
                    <span className="text-[9px] font-mono text-gray-600">SECURE</span>
                  </div>
                  <h4 className="text-xs font-bold text-gray-200">{rf.name}</h4>
                  <p className="text-[10px] text-gray-500 font-mono">{rf.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Ten-Codes Search & List */}
          <div className="bg-[#161B22] border border-gray-800 rounded-md p-3 shadow-xl space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="text-xs font-bold text-gray-100 uppercase tracking-tight">Daftar Ten-Codes Kepolisian</h2>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                <input
                  type="text"
                  value={searchTenCode}
                  onChange={(e) => setSearchTenCode(e.target.value)}
                  placeholder="Cari kode (cth: 10-57, 10-99)..."
                  className="w-full pl-8 pr-2.5 py-1 bg-[#0D0F14] border border-gray-800 focus:border-blue-500 rounded text-xs text-gray-200 outline-none font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[440px] overflow-y-auto pr-1">
              {filteredTenCodes.map((tc, idx) => (
                <div
                  key={idx}
                  className="p-2 bg-[#0D0F14] border border-gray-800 rounded flex flex-col justify-between hover:border-gray-700 transition"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-[10px] px-1.5 py-0.2 rounded bg-blue-950/80 text-blue-300 border border-blue-800/60">
                        {tc.code}
                      </span>
                      <button
                        onClick={() => handleCopy(tc.code, `tc-${idx}`)}
                        className="text-gray-500 hover:text-gray-200 p-0.5"
                        title="Copy Code"
                      >
                        {copiedKey === `tc-${idx}` ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-200 font-medium">{tc.meaning}</p>
                  </div>
                  {tc.example && (
                    <span className="text-[10px] font-mono text-gray-500 italic pt-1 mt-1 border-t border-gray-800/60 truncate">
                      "{tc.example}"
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: KODE ETIK */}
      {activeTab === 'ethics' && (
        <div className="bg-[#161B22] border border-gray-800 rounded-md p-3.5 shadow-xl space-y-3">
          <h2 className="text-xs font-bold text-gray-100 uppercase tracking-tight flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            Kode Etik & Integritas Kepolisian (HSPD Code of Conduct)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            <div className="p-3 bg-[#0D0F14] border border-gray-800 rounded space-y-1">
              <h3 className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-wide">I. Etika Tugas dan Tanggung Jawab</h3>
              <p className="text-xs text-gray-300 leading-relaxed font-mono text-[11px]">
                1. Menjalankan tugas berdasarkan hukum dan SOP resmi.<br />
                2. Menjaga netralitas dan tidak berpihak dalam konflik antarfaksi.<br />
                3. Tidak menyalahgunakan fasilitas/senjata dinas untuk kepentingan pribadi.<br />
                4. Dilarang keras melakukan pungli atau korupsi denda tilang.
              </p>
            </div>

            <div className="p-3 bg-[#0D0F14] border border-gray-800 rounded space-y-1">
              <h3 className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wide">II. Etika Berperilaku & Warga</h3>
              <p className="text-xs text-gray-300 leading-relaxed font-mono text-[11px]">
                1. Berpakaian rapi dan menjaga kesopanan serta wibawa aparat.<br />
                2. Tidak bersikap arogan atau merendahkan warga saat razia/traffic stop.<br />
                3. Menghindari ucapan atau tindakan yang menyinggung unsur SARA.<br />
                4. Menjaga sikap mengayomi dan melindungi masyarakat.
              </p>
            </div>

            <div className="p-3 bg-[#0D0F14] border border-gray-800 rounded space-y-1">
              <h3 className="text-[10px] font-mono font-bold text-purple-400 uppercase tracking-wide">III. Etika Komunikasi Radio</h3>
              <p className="text-xs text-gray-300 leading-relaxed font-mono text-[11px]">
                1. Komunikasi radio harus singkat, padat, dan menggunakan ten-codes resmi.<br />
                2. Dilarang spam radio, trolling, atau berbicara OOC di frekuensi IC.<br />
                3. Menjaga kerahasiaan rencana taktis dan operasi penyerbuan dari radio umum.
              </p>
            </div>

            <div className="p-3 bg-[#0D0F14] border border-gray-800 rounded space-y-1">
              <h3 className="text-[10px] font-mono font-bold text-rose-400 uppercase tracking-wide">IV. Etika Sosial & Moral</h3>
              <p className="text-xs text-gray-300 leading-relaxed font-mono text-[11px]">
                1. Tidak berjudi, mabuk-mabukan saat berseragam, atau menggunakan narkoba.<br />
                2. Menjadi teladan bagi anggota baru dan masyarakat kota.<br />
                3. Setiap pelanggaran SOP akan ditindak tegas dengan SP hingga pemecatan.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: BIAYA LAYANAN */}
      {activeTab === 'fees' && (
        <div className="bg-[#161B22] border border-gray-800 rounded-md p-3.5 shadow-xl space-y-3">
          <h2 className="text-xs font-bold text-gray-100 uppercase tracking-tight flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            Biaya Layanan Administrasi & Regulasi
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            <div className="p-3 bg-[#0D0F14] border border-gray-800 rounded space-y-1 text-center">
              <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">Penerbitan SKCK</span>
              <p className="text-xl font-mono font-bold text-emerald-400">$10,000</p>
              <span className="text-[10px] text-gray-500 block font-mono">Masa berlaku: 7 Hari</span>
              <span className="text-[10px] text-gray-600 block font-mono">Pemutihan SKCK: $25,000</span>
            </div>

            <div className="p-3 bg-[#0D0F14] border border-gray-800 rounded space-y-1 text-center">
              <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">Pengambilan Impound</span>
              <p className="text-xl font-mono font-bold text-blue-400">$5,000 / $3,500</p>
              <span className="text-[10px] text-gray-500 block font-mono">Roda 4: $5,000 | Roda 2: $3,500</span>
              <span className="text-[10px] text-gray-600 block font-mono">Biaya administrasi penebusan</span>
            </div>

            <div className="p-3 bg-[#0D0F14] border border-gray-800 rounded space-y-1 text-center">
              <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">Surat Izin Keramaian</span>
              <p className="text-xl font-mono font-bold text-amber-400">$25,000</p>
              <span className="text-[10px] text-gray-500 block font-mono">Masa berlaku: 3 Hari</span>
              <span className="text-[10px] text-gray-600 block font-mono">Untuk event / konser / pesta</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: DAFTAR PERINTAH HSPD */}
      {activeTab === 'commands' && (
        <div className="bg-[#161B22] border border-gray-800 rounded-md p-3.5 shadow-xl space-y-3">
          <h2 className="text-xs font-bold text-gray-100 uppercase tracking-tight flex items-center gap-1.5">
            <Terminal className="w-4 h-4 text-blue-400" />
            Katalog Perintah In-Game HSPD (/cmd)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {HSPD_COMMANDS_LIST.map((c, i) => (
              <div key={i} className="p-2 bg-[#0D0F14] border border-gray-800 rounded flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="font-mono font-bold text-xs text-blue-400">{c.cmd}</span>
                  <h4 className="text-xs font-bold text-gray-200 truncate">{c.name}</h4>
                  <p className="text-[10px] text-gray-500 font-mono truncate">{c.desc}</p>
                </div>
                <button
                  onClick={() => handleCopy(c.cmd, `cmd-${i}`)}
                  className="p-1 bg-[#161B22] hover:bg-gray-700 text-gray-300 rounded border border-gray-700 transition shrink-0"
                >
                  {copiedKey === `cmd-${i}` ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
