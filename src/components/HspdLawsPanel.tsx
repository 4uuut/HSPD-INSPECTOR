import React, { useState, useMemo } from 'react';
import { 
  Scale, BookOpen, Radio, ShieldAlert, Search, AlertCircle, 
  CheckCircle2, ChevronRight, FileText, Gavel, Siren, Shield, 
  Volume2, HelpCircle, ArrowRight, Clock, DollarSign, Lock
} from 'lucide-react';
import { getSavedPasalList, OFFENCE_CATEGORIES, getCategoryBadgeColor } from '../data/pasalData';
import { TEN_CODES, RADIO_FREQUENCIES } from '../data/sopData';
import type { PasalItem } from '../types';

interface Props {
  onBackToRecruitment?: () => void;
}

export const HspdLawsPanel: React.FC<Props> = () => {
  const [activeLawTab, setActiveLawTab] = useState<'sop' | 'kuhp' | 'radio' | 'sanctions'>('sop');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('ALL');

  const allPasal = useMemo(() => getSavedPasalList(), []);

  const filteredPasal = useMemo(() => {
    return allPasal.filter(item => {
      const matchCat = selectedCat === 'ALL' || item.cat === selectedCat;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q || 
        item.code.toLowerCase().includes(q) || 
        item.desc.toLowerCase().includes(q) ||
        String(item.fine).includes(q) ||
        String(item.time).includes(q);
      return matchCat && matchQuery;
    });
  }, [allPasal, selectedCat, searchQuery]);

  return (
    <div className="flex flex-col h-full font-mono text-xs">
      {/* Sub-Tabs for Laws & Regulations */}
      <div className="grid grid-cols-4 border-b border-gray-800 bg-[#0A0E17] text-[11px]">
        <button
          type="button"
          onClick={() => setActiveLawTab('sop')}
          className={`py-2.5 px-1.5 flex items-center justify-center gap-1.5 font-bold transition border-b-2 ${
            activeLawTab === 'sop'
              ? 'border-cyan-400 text-cyan-300 bg-[#121724]/60'
              : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/20'
          }`}
        >
          <Scale className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">1. SOP & Hak Miranda</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveLawTab('kuhp')}
          className={`py-2.5 px-1.5 flex items-center justify-center gap-1.5 font-bold transition border-b-2 ${
            activeLawTab === 'kuhp'
              ? 'border-amber-400 text-amber-300 bg-[#121724]/60'
              : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/20'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">2. Kitab Pasal KUHP</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveLawTab('radio')}
          className={`py-2.5 px-1.5 flex items-center justify-center gap-1.5 font-bold transition border-b-2 ${
            activeLawTab === 'radio'
              ? 'border-emerald-400 text-emerald-300 bg-[#121724]/60'
              : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/20'
          }`}
        >
          <Radio className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">3. 10-Codes & Radio</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveLawTab('sanctions')}
          className={`py-2.5 px-1.5 flex items-center justify-center gap-1.5 font-bold transition border-b-2 ${
            activeLawTab === 'sanctions'
              ? 'border-rose-400 text-rose-300 bg-[#121724]/60'
              : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/20'
          }`}
        >
          <Gavel className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">4. Denda & Sanksi</span>
        </button>
      </div>

      {/* Main Content Body */}
      <div className="p-4 sm:p-5 space-y-4 flex-1">
        {/* TAB 1: SOP & HAK MIRANDA */}
        {activeLawTab === 'sop' && (
          <div className="space-y-4">
            {/* Box 1: Hak Miranda Warning */}
            <div className="p-4 bg-gradient-to-br from-[#0c1825] to-[#0d1117] border border-cyan-800/70 rounded-xl space-y-3 relative overflow-hidden shadow-lg shadow-cyan-950/20">
              <div className="flex items-center justify-between border-b border-cyan-900/40 pb-2">
                <div className="flex items-center gap-2 text-cyan-300 font-bold">
                  <Scale className="w-4 h-4 text-cyan-400" />
                  <span className="tracking-wide">HAK MIRANDA (MIRANDA WARNING) • WAJIB DIBACAKAN SAAT PENANGKAPAN</span>
                </div>
                <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-700/60 px-2 py-0.5 rounded font-mono font-bold">
                  SOP PASAL 1
                </span>
              </div>

              <div className="space-y-2 text-xs font-sans text-gray-200 leading-relaxed bg-[#090D14]/80 p-3 rounded-lg border border-cyan-900/30">
                <p className="italic text-cyan-200/90 font-medium">
                  "Anda memiliki hak untuk tetap diam. Segala sesuatu yang Anda katakan dapat dan akan digunakan untuk melawan Anda di pengadilan hukum."
                </p>
                <p className="italic text-cyan-200/90 font-medium">
                  "Anda memiliki hak untuk berbicara dengan penasihat hukum atau pengacara resmi dan didampingi sebelum maupun selama proses interogasi."
                </p>
                <p className="italic text-cyan-200/90 font-medium">
                  "Jika Anda tidak mampu menyewa penasihat hukum pribadi, pengacara negara dapat ditunjuk untuk mendampingi Anda."
                </p>
                <p className="font-bold text-amber-300 pt-1">
                  "Apakah Anda memahami setiap hak yang baru saja dibacakan kepada Anda?"
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-[10px] text-gray-400">
                <span className="inline-flex items-center gap-1 text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">
                  <CheckCircle2 className="w-3 h-3" /> Wajib Dibacakan Sebelum BAP
                </span>
                <span className="inline-flex items-center gap-1 text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/50">
                  <AlertCircle className="w-3 h-3" /> Pelanggaran Miranda = Berkas Gugur di Sidang
                </span>
              </div>
            </div>

            {/* Box 2: Use of Force Continuum (5 Tingkat Eskalasi) */}
            <div className="p-4 bg-[#0D1117] border border-gray-800 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <Shield className="w-4 h-4" />
                <span>TANGGA PENGGUNAAN KEKUATAN & SENJATA (USE OF FORCE CONTINUUM)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 font-mono text-[10px]">
                <div className="p-2.5 bg-[#121824] border border-blue-900/40 rounded-lg text-center space-y-1">
                  <div className="font-bold text-blue-400">LEVEL 1</div>
                  <div className="text-gray-300 font-bold">KEHADIRAN</div>
                  <div className="text-gray-400 text-[9px] leading-tight font-sans">Seragam & Mobil Dinas Siaga</div>
                </div>

                <div className="p-2.5 bg-[#121824] border border-emerald-900/40 rounded-lg text-center space-y-1">
                  <div className="font-bold text-emerald-400">LEVEL 2</div>
                  <div className="text-gray-300 font-bold">VERBAL</div>
                  <div className="text-gray-400 text-[9px] leading-tight font-sans">Komando Suara Tegas & Jelas</div>
                </div>

                <div className="p-2.5 bg-[#121824] border border-amber-900/40 rounded-lg text-center space-y-1">
                  <div className="font-bold text-amber-400">LEVEL 3</div>
                  <div className="text-gray-300 font-bold">BORGOL</div>
                  <div className="text-gray-400 text-[9px] leading-tight font-sans">Kuncian Tangan Kosong & Cuffs</div>
                </div>

                <div className="p-2.5 bg-[#121824] border border-orange-900/40 rounded-lg text-center space-y-1">
                  <div className="font-bold text-orange-400">LEVEL 4</div>
                  <div className="text-gray-300 font-bold">LESS-LETHAL</div>
                  <div className="text-gray-400 text-[9px] leading-tight font-sans">Taser SLC & Tongkat Baton</div>
                </div>

                <div className="p-2.5 bg-[#121824] border border-rose-900/40 rounded-lg text-center space-y-1">
                  <div className="font-bold text-rose-400">LEVEL 5</div>
                  <div className="text-gray-300 font-bold">LETHAL FORCE</div>
                  <div className="text-gray-400 text-[9px] leading-tight font-sans">Senpi Mematikan (Ancaman Nyawa)</div>
                </div>
              </div>
            </div>

            {/* Box 3: SOP Penindakan Jalan Raya (Traffic Stop vs Felony Stop) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-[#0D1117] border border-blue-900/40 rounded-xl space-y-1.5">
                <div className="flex items-center gap-1.5 text-blue-400 font-bold">
                  <Siren className="w-3.5 h-3.5" />
                  <span>10-55: RUTIN TRAFFIC STOP</span>
                </div>
                <p className="text-[11px] text-gray-300 font-sans leading-relaxed">
                  Nyalakan rotator, parkir di belakang pelanggar bersudut 15°, matikan mesin pelanggar, dekati pilar kiri pengemudi, periksa lisensi SIM & STNK.
                </p>
              </div>

              <div className="p-3 bg-[#0D1117] border border-rose-900/40 rounded-xl space-y-1.5">
                <div className="flex items-center gap-1.5 text-rose-400 font-bold">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>10-66: FELONY STOP (RISIKO TINGGI)</span>
                </div>
                <p className="text-[11px] text-gray-300 font-sans leading-relaxed">
                  Wajib backup 2+ unit. Ambil perlindungan pintu mobil patroli, todongkan senjata ke arah tersangka, perintahkan matikan mesin dan keluar angkat tangan.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: KITAB PASAL KUHP */}
        {activeLawTab === 'kuhp' && (
          <div className="space-y-3">
            {/* Search and Category Filter Bar */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Cari pasal, nama pelanggaran, denda, atau penjara (cth: A01, Perampokan, Narkoba, Speeding, SIM)..."
                  className="w-full pl-9 pr-4 py-2 bg-[#080C12] border border-gray-700 focus:border-amber-500 rounded-lg text-xs text-gray-100 placeholder:text-gray-500 outline-none font-mono"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-2 text-gray-400 hover:text-gray-200 text-xs"
                  >
                    × Reset
                  </button>
                )}
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px] scrollbar-thin">
                {OFFENCE_CATEGORIES.map(cat => (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setSelectedCat(cat.key)}
                    className={`px-2.5 py-1 rounded-md shrink-0 font-bold transition border ${
                      selectedCat === cat.key
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-sm'
                        : 'bg-[#0E131C] text-gray-400 hover:text-gray-200 border-gray-800'
                    }`}
                  >
                    {cat.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Pasal Results Count */}
            <div className="flex items-center justify-between text-[10px] text-gray-400 px-1 font-mono">
              <span>Menampilkan <strong>{filteredPasal.length}</strong> dari {allPasal.length} Pasal Terdaftar</span>
              <span className="text-amber-400 font-bold">Standar KUHP High State 2026</span>
            </div>

            {/* List of Pasals */}
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {filteredPasal.length === 0 ? (
                <div className="p-8 text-center text-gray-500 bg-[#0B0F17] rounded-xl border border-gray-800">
                  <AlertCircle className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                  <p>Tidak ada pasal yang cocok dengan kriteria pencarian "{searchQuery}".</p>
                </div>
              ) : (
                filteredPasal.map((item: PasalItem) => (
                  <div
                    key={item.code}
                    className="p-3 bg-[#0D1117] hover:bg-[#121722] border border-gray-800/80 rounded-xl transition flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="flex items-start gap-2.5">
                      <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] shrink-0 ${getCategoryBadgeColor(item.cat)}`}>
                        {item.code}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-gray-200 font-sans">{item.desc}</div>
                        <div className="text-[10px] text-gray-500 font-mono">Kategori: {item.cat} • Kitab Pidana HSPD</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-center font-mono text-[11px]">
                      <div className="text-right">
                        <div className="text-emerald-400 font-bold flex items-center justify-end gap-1">
                          <DollarSign className="w-3 h-3" />
                          <span>${item.fine.toLocaleString()}</span>
                        </div>
                        <div className="text-[9px] text-gray-400">Denda Maksimal</div>
                      </div>

                      <div className="text-right border-l border-gray-800 pl-3">
                        <div className={`font-bold flex items-center justify-end gap-1 ${item.time > 0 ? 'text-amber-400' : 'text-gray-400'}`}>
                          <Clock className="w-3 h-3" />
                          <span>{item.time > 0 ? `${item.time} Bulan/Mnt` : 'Bebas'}</span>
                        </div>
                        <div className="text-[9px] text-gray-400">Waktu Penjara</div>
                      </div>

                      {item.imp > 0 && (
                        <span className="text-[9px] bg-rose-950/80 text-rose-300 border border-rose-800/60 px-2 py-0.5 rounded font-bold">
                          Impound
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: 10-CODES & RADIO */}
        {activeLawTab === 'radio' && (
          <div className="space-y-4">
            {/* Tactical Radio Frequencies Box */}
            <div className="p-3.5 bg-gradient-to-r from-[#0C121E] via-[#0D1525] to-[#0C121E] border border-emerald-900/50 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <Radio className="w-4 h-4" />
                <span>FREKUENSI RESMI RADIO TAKTIS KEPOLISIAN (DISPATCH CHANNELS)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {RADIO_FREQUENCIES.map((rf, i) => (
                  <div key={i} className="p-2.5 bg-[#080C14] border border-gray-800 rounded-lg flex items-start gap-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/60 font-mono font-bold text-[10px]">
                      {rf.freq}
                    </span>
                    <div>
                      <div className="font-bold text-gray-200">{rf.name}</div>
                      <div className="text-[10px] text-gray-400 font-sans">{rf.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Official 10-Codes List */}
            <div className="p-3.5 bg-[#0D1117] border border-gray-800 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <Volume2 className="w-4 h-4" />
                  <span>SEPULUH KODE STANDAR (TEN CODES) KEPOLISIAN</span>
                </div>
                <span className="text-[10px] text-gray-400 font-mono">Kode Protokol Komunikasi</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
                {TEN_CODES.map((tc, idx) => (
                  <div 
                    key={idx} 
                    className={`p-2.5 rounded-lg border text-xs ${
                      tc.code === 'CODE 0' 
                        ? 'bg-rose-950/40 border-rose-800 text-rose-200 font-bold animate-pulse' 
                        : 'bg-[#121620] border-gray-800 text-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-mono font-bold px-1.5 py-0.5 rounded text-[10px] ${
                        tc.code === 'CODE 0' ? 'bg-rose-900 text-rose-100' : 'bg-blue-950 text-blue-300 border border-blue-800/60'
                      }`}>
                        {tc.code}
                      </span>
                    </div>
                    <div className="font-sans text-[11px] font-medium leading-snug">{tc.meaning}</div>
                    {tc.example && (
                      <div className="text-[10px] text-gray-500 font-mono mt-1 italic">
                        Cth: "{tc.example}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SKALA DENDA & SANKSI HUKUM */}
        {activeLawTab === 'sanctions' && (
          <div className="space-y-4">
            {/* Box 1: Aturan Sitaan Barang Bukti */}
            <div className="p-4 bg-gradient-to-br from-[#1b120c] to-[#0d1117] border border-orange-800/60 rounded-xl space-y-2.5">
              <div className="flex items-center gap-2 text-orange-400 font-bold">
                <ShieldAlert className="w-4 h-4" />
                <span>REGULASI PENYITAAN BARANG BUKTI (CONTRABAND CONFISCATION)</span>
              </div>
              <p className="text-[11px] text-gray-300 font-sans leading-relaxed">
                Segala bentuk barang ilegal yang ditemukan dalam tubuh, tas, bagasi, atau kompartemen kendaraan tersangka akan <strong>disita 100% tanpa kompensasi</strong> dan dicatat ke dalam berkas arrest report MDC:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-sans">
                <div className="p-2.5 bg-[#140f0c] border border-orange-900/40 rounded-lg space-y-1">
                  <div className="font-bold text-orange-300">1. Senjata Api & Amunisi Ilegal</div>
                  <div className="text-gray-400 text-[10px]">Pistol, Shotgun, SMG, Rifle, Sniper, dan seluruh clip magazine tanpa lisensi resmi.</div>
                </div>
                <div className="p-2.5 bg-[#140f0c] border border-orange-900/40 rounded-lg space-y-1">
                  <div className="font-bold text-orange-300">2. Narkotika & Tanaman Terlarang</div>
                  <div className="text-gray-400 text-[10px]">Bibit kanabis, daun ganja, joint, serbuk cocain, opium, dan alat pemroses narkoba.</div>
                </div>
                <div className="p-2.5 bg-[#140f0c] border border-orange-900/40 rounded-lg space-y-1">
                  <div className="font-bold text-orange-300">3. Perlengkapan Taktis Ilegal</div>
                  <div className="text-gray-400 text-[10px]">Rompi anti-peluru (body armor/vest) sipil tak berizin, lockpick, drill perampokan ATM.</div>
                </div>
                <div className="p-2.5 bg-[#140f0c] border border-orange-900/40 rounded-lg space-y-1">
                  <div className="font-bold text-orange-300">4. Uang Kotor (Red Money)</div>
                  <div className="text-gray-400 text-[10px]">Hasil perampokan toko/bank/pencucian uang disita langsung masuk ke kas perbendaharaan negara.</div>
                </div>
              </div>
            </div>

            {/* Box 2: Prosedur BAP & Interogasi */}
            <div className="p-4 bg-[#0D1117] border border-gray-800 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-cyan-400 font-bold">
                <FileText className="w-4 h-4" />
                <span>HAK TERSANGKA & PROSEDUR INTEROGASI (BAP)</span>
              </div>
              <div className="space-y-1.5 text-[11px] text-gray-300 font-sans leading-relaxed">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                  <span>Tersangka berhak meminta pengacara hadir mendampingi proses interogasi di Ruang BAP Kantor Polisi.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                  <span>Petugas wajib memberikan perawatan medis darurat terlebih dahulu bila tersangka mengalami cedera atau pingsan saat penangkapan.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                  <span>Sikap kooperatif dapat dipertimbangkan oleh Perwira Penyidik untuk mendapatkan keringanan hukuman kurungan penjara.</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Slide 2 Footer Info Box */}
      <div className="bg-[#0F1319] border-t border-gray-800 p-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-gray-400">
        <div className="flex items-center gap-2">
          <Scale className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>
            Biro Hukum & Advokasi Kepolisian: <strong>Divisi Legal & Pengawasan Internal HSPD</strong>
          </span>
        </div>
        <span className="text-[10px] text-gray-500 font-mono">
          State of HighState Penal Code & SOP System © 2026
        </span>
      </div>
    </div>
  );
};
