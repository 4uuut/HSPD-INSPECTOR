import { PasalItem, CategoryInfo } from '../types';

export const OFFENCE_CATEGORIES: CategoryInfo[] = [
  { key: 'ALL', title: 'Semua Kategori', badgeColor: 'bg-slate-700 text-slate-200' },
  { key: 'A', title: 'A - Lalu Lintas', badgeColor: 'bg-emerald-700 text-emerald-100', desc: 'Pelanggaran berkendara, marka, lisensi, & kelengkapan' },
  { key: 'B', title: 'B - Kejahatan Individu & Pembunuhan', badgeColor: 'bg-amber-700 text-amber-100', desc: 'Penganiayaan, pembunuhan, penyanderaan, penculikan, & penipuan' },
  { key: 'C', title: 'C - Pencurian & Perampokan', badgeColor: 'bg-orange-700 text-orange-100', desc: 'Pencurian kendaraan & perampokan bersenjata / bank' },
  { key: 'D', title: 'D - Senjata Api & Amunisi Ilegal', badgeColor: 'bg-rose-700 text-rose-100', desc: 'Senpi ilegal, clip/amunisi, penembakan umum, perdagangan senjata' },
  { key: 'E', title: 'E - Narkotika & Benda Ilegal', badgeColor: 'bg-red-700 text-red-100', desc: 'Kanabis, marijuana, joint, cocain, opium, vest, & red money' },
  { key: 'F', title: 'F - Kejahatan Terhadap Petugas', badgeColor: 'bg-purple-700 text-purple-100', desc: 'Melawan petugas, melarikan diri, bribery, penyerangan aparat' },
  { key: 'G', title: 'G - Dokumen, Jabatan & Pemerintah', badgeColor: 'bg-cyan-700 text-cyan-100', desc: 'Pemalsuan dokumen/identitas, korupsi, penyalahgunaan jabatan' },
  { key: 'H', title: 'H - Ketertiban Umum & Kerusuhan', badgeColor: 'bg-indigo-700 text-indigo-100', desc: 'Keributan, perkelahian umum, gangguan publik, & kerusuhan massal' },
  { key: 'I', title: 'I - Terorisme & Kejahatan Berat', badgeColor: 'bg-fuchsia-700 text-fuchsia-100', desc: 'Terorisme, kudeta, kejahatan terorganisir, organisasi kriminal, sandera pejabat' }
];

export const CATEGORY_COLOR_PALETTE: Record<string, string> = {
  A: 'bg-emerald-700 text-emerald-100',
  B: 'bg-amber-700 text-amber-100',
  C: 'bg-orange-700 text-orange-100',
  D: 'bg-rose-700 text-rose-100',
  E: 'bg-red-700 text-red-100',
  F: 'bg-purple-700 text-purple-100',
  G: 'bg-cyan-700 text-cyan-100',
  H: 'bg-indigo-700 text-indigo-100',
  I: 'bg-fuchsia-700 text-fuchsia-100',
  J: 'bg-pink-700 text-pink-100',
  K: 'bg-teal-700 text-teal-100',
  L: 'bg-lime-700 text-lime-100',
  M: 'bg-sky-700 text-sky-100',
  N: 'bg-violet-700 text-violet-100',
  O: 'bg-yellow-700 text-yellow-100',
  P: 'bg-emerald-800 text-emerald-200'
};

export function getCategoryBadgeColor(cat: string): string {
  const c = (cat || '').toUpperCase().trim();
  return CATEGORY_COLOR_PALETTE[c] || 'bg-slate-700 text-slate-200';
}

/**
 * Menghasilkan daftar seluruh kategori secara dinamis dengan menggabungkan
 * kategori default dan setiap kategori tambahan (seperti I, J, K, dst) yang terdapat di pasalList
 */
export function getMergedCategories(customPasalList?: PasalItem[]): CategoryInfo[] {
  const baseMap = new Map<string, CategoryInfo>();
  OFFENCE_CATEGORIES.forEach(c => baseMap.set(c.key, { ...c }));

  if (Array.isArray(customPasalList)) {
    customPasalList.forEach(item => {
      if (item && item.cat) {
        const catKey = String(item.cat).toUpperCase().trim();
        if (catKey && !baseMap.has(catKey)) {
          baseMap.set(catKey, {
            key: catKey,
            title: `${catKey} - Kategori ${catKey}`,
            badgeColor: getCategoryBadgeColor(catKey),
            desc: `Pasal-pasal dalam Kategori ${catKey}`
          });
        }
      }
    });
  }

  const allCat = baseMap.get('ALL') || { key: 'ALL', title: 'Semua Kategori', badgeColor: 'bg-slate-700 text-slate-200' };
  const rest = Array.from(baseMap.values())
    .filter(c => c.key !== 'ALL')
    .sort((a, b) => a.key.localeCompare(b.key));

  return [allCat, ...rest];
}

export const PASAL_LIST: PasalItem[] = [
  // PASAL A - Lalu Lintas (15 Pasal)
  { cat: 'A', code: 'A01', desc: 'Berkendara tidak memiliki SIM', fine: 2000, time: 0, imp: 1 },
  { cat: 'A', code: 'A02', desc: 'Berkendara Secara Ugal - Ugalan', fine: 2500, time: 0, imp: 1 },
  { cat: 'A', code: 'A03', desc: 'Parkir Sembarangan', fine: 3000, time: 0, imp: 1 },
  { cat: 'A', code: 'A04', desc: 'Kendaraan tidak memiliki plat nomor', fine: 3000, time: 0, imp: 1 },
  { cat: 'A', code: 'A05', desc: 'Kabur dari Kecelakaan', fine: 4000, time: 5, imp: 1 },
  { cat: 'A', code: 'A06', desc: 'Kecelakaan hingga menimbulkan korban jiwa', fine: 5000, time: 10, imp: 2 },
  { cat: 'A', code: 'A07', desc: 'Mengemudi Melawan Arus', fine: 3000, time: 0, imp: 0 },
  { cat: 'A', code: 'A08', desc: 'Mengangkut Penumpang Lebih dari Kapasitas', fine: 4000, time: 0, imp: 0 },
  { cat: 'A', code: 'A09', desc: 'Menghindar saat diberhentikan petugas', fine: 3500, time: 10, imp: 1 },
  { cat: 'A', code: 'A10', desc: 'Mengemudi sambil mengunakan handphone', fine: 2000, time: 0, imp: 0 },
  { cat: 'A', code: 'A11', desc: 'Modifikasi ilegal (Nitro & Knalpot Api)', fine: 5000, time: 0, imp: 1 },
  { cat: 'A', code: 'A12', desc: 'Balap Liar', fine: 10000, time: 15, imp: 2 },
  { cat: 'A', code: 'A13', desc: 'Menerobos barikade kepolisian', fine: 5000, time: 0, imp: 1 },
  { cat: 'A', code: 'A14', desc: 'Mengemudi dalam keadaan mabuk', fine: 5000, time: 5, imp: 2 },
  { cat: 'A', code: 'A15', desc: 'Mengemudi dengan kecepatan berlebihan', fine: 2000, time: 0, imp: 1 },

  // PASAL B - Kejahatan Individu & Pembunuhan (10 Pasal)
  { cat: 'B', code: 'B01', desc: 'Penganiayaan Ringan (Benda Tumpul)', fine: 5000, time: 10, imp: 0 },
  { cat: 'B', code: 'B02', desc: 'Penganiayaan Berat (Benda Tajam)', fine: 10000, time: 15, imp: 0 },
  { cat: 'B', code: 'B03', desc: 'Percobaan Pembunuhan', fine: 20000, time: 30, imp: 0 },
  { cat: 'B', code: 'B04', desc: 'Pembunuhan Berencana', fine: 40000, time: 50, imp: 0 },
  { cat: 'B', code: 'B05', desc: 'Penyanderaan Warga Sipil', fine: 15000, time: 15, imp: 0 },
  { cat: 'B', code: 'B06', desc: 'Penculikan Warga Sipil', fine: 25000, time: 35, imp: 0 },
  { cat: 'B', code: 'B07', desc: 'Ancaman terhadap Warga', fine: 10000, time: 10, imp: 1 },
  { cat: 'B', code: 'B08-1', desc: 'Penipuan Kelas Rendah (<$100,000)', fine: 50000, time: 15, imp: 1 },
  { cat: 'B', code: 'B08-2', desc: 'Penipuan Kelas Menengah ($100,000 - 500,000)', fine: 250000, time: 30, imp: 0 },
  { cat: 'B', code: 'B08-3', desc: 'Penipuan Kelas Tinggi (>$500,000)', fine: 500000, time: 60, imp: 0 },

  // PASAL C - Pencurian & Perampokan (7 Pasal)
  { cat: 'C', code: 'C01', desc: 'Pencurian Kendaraan Roda 2', fine: 10000, time: 15, imp: 0 },
  { cat: 'C', code: 'C02', desc: 'Pencurian Kendaraan Roda 4', fine: 25000, time: 30, imp: 0 },
  { cat: 'C', code: 'C03', desc: 'Perampokkan', fine: 10000, time: 15, imp: 0 },
  { cat: 'C', code: 'C04', desc: 'Perampokkan Bersenjata', fine: 15000, time: 20, imp: 0 },
  { cat: 'C', code: 'C05', desc: 'Perampokkan ATM', fine: 15000, time: 25, imp: 0 },
  { cat: 'C', code: 'C06', desc: 'Perampokkan Bank Desa', fine: 25000, time: 35, imp: 0 },
  { cat: 'C', code: 'C07', desc: 'Perampokkan Bank Pusat', fine: 35000, time: 45, imp: 0 },

  // PASAL D - Senjata Api & Amunisi Ilegal (9 Pasal)
  { cat: 'D', code: 'D01-1', desc: 'Kepemilikkan Senjata Api Ilegal (First Class)', fine: 15000, time: 10, imp: 0 },
  { cat: 'D', code: 'D01-2', desc: 'Kepemilikkan Senjata Api Ilegal (Second Class)', fine: 20000, time: 15, imp: 0 },
  { cat: 'D', code: 'D01-3', desc: 'Kepemilikkan Senjata Api Ilegal (Third Class)', fine: 25000, time: 20, imp: 0 },
  { cat: 'D', code: 'D02-1', desc: 'Kepemilikan Clip First Class (Pistol Clip)', fine: 5000, time: 15, imp: 0 },
  { cat: 'D', code: 'D02-2', desc: 'Kepemilikan Clip Second Class (SG Clip, SMG Clip)', fine: 7500, time: 15, imp: 0 },
  { cat: 'D', code: 'D02-3', desc: 'Kepemilikan Clip Third Class (AR Clip, Sniper Clip)', fine: 10000, time: 20, imp: 0 },
  { cat: 'D', code: 'D03', desc: 'Menembakkan senjata di tempat umum', fine: 10000, time: 15, imp: 0 },
  { cat: 'D', code: 'D04', desc: 'Perdagangan senjata ilegal', fine: 15000, time: 15, imp: 0 },
  { cat: 'D', code: 'D05', desc: 'Kepemilikan senjata api ilegal dalam jumlah besar', fine: 30000, time: 30, imp: 0 },

  // PASAL E - Narkotika & Benda Ilegal (17 Pasal)
  { cat: 'E', code: 'E01', desc: 'Penanaman Kanabis', fine: 5000, time: 15, imp: 0 },
  { cat: 'E', code: 'E02-1', desc: 'Membawa Bibit Kanabis [1-50 pcs]', fine: 5000, time: 15, imp: 0 },
  { cat: 'E', code: 'E02-2', desc: 'Membawa Bibit Kanabis [>50 pcs] Interogasi', fine: 7500, time: 20, imp: 0 },
  { cat: 'E', code: 'E03-1', desc: 'Membawa Canabis [1-100 pcs]', fine: 7500, time: 15, imp: 0 },
  { cat: 'E', code: 'E03-2', desc: 'Membawa Canabis [>100 pcs] Interogasi', fine: 10000, time: 20, imp: 0 },
  { cat: 'E', code: 'E04-1', desc: 'Membawa Marijuana [1-50 pcs]', fine: 10000, time: 15, imp: 0 },
  { cat: 'E', code: 'E04-2', desc: 'Membawa Marijuana [>50 pcs] Interogasi', fine: 12500, time: 20, imp: 0 },
  { cat: 'E', code: 'E05-1', desc: 'Membawa Joint [1-50 pcs]', fine: 15000, time: 15, imp: 0 },
  { cat: 'E', code: 'E05-2', desc: 'Membawa Joint [>50 pcs] Interogasi', fine: 25000, time: 20, imp: 0 },
  { cat: 'E', code: 'E06-1', desc: 'Membawa Cocain [1-20 pcs]', fine: 15000, time: 15, imp: 0 },
  { cat: 'E', code: 'E06-2', desc: 'Membawa Cocain [>20 pcs] Interogasi', fine: 25000, time: 20, imp: 0 },
  { cat: 'E', code: 'E07-1', desc: 'Membawa Opium [1-20 pcs]', fine: 20000, time: 15, imp: 0 },
  { cat: 'E', code: 'E07-2', desc: 'Membawa Opium [>20 pcs] Interogasi', fine: 30000, time: 20, imp: 0 },
  { cat: 'E', code: 'E08', desc: 'Perdagangan Narkotika', fine: 25000, time: 25, imp: 0 },
  { cat: 'E', code: 'E09', desc: 'Kepemilikkan Vest', fine: 15000, time: 15, imp: 0 },
  { cat: 'E', code: 'E10', desc: 'Kepemilikkan Red Money [1 - 10,000]', fine: 15000, time: 15, imp: 0 },
  { cat: 'E', code: 'E11', desc: 'Kepemilikkan Red Money [> 10,000] Interogasi', fine: 25000, time: 25, imp: 0 },

  // PASAL F - Kejahatan Terhadap Petugas (8 Pasal)
  { cat: 'F', code: 'F01', desc: 'Menghalangi petugas dalam menjalankan tugas', fine: 7500, time: 5, imp: 0 },
  { cat: 'F', code: 'F02', desc: 'Melawan petugas saat penangkapan', fine: 10000, time: 10, imp: 0 },
  { cat: 'F', code: 'F03', desc: 'Melarikan diri dari petugas', fine: 10000, time: 15, imp: 0 },
  { cat: 'F', code: 'F04', desc: 'Penyerangan terhadap petugas', fine: 15000, time: 20, imp: 0 },
  { cat: 'F', code: 'F05', desc: 'Pembunuhan terhadap petugas', fine: 250000, time: 60, imp: 0 },
  { cat: 'F', code: 'F06', desc: 'Penyogokan/bribery terhadap petugas', fine: 50000, time: 30, imp: 0 },
  { cat: 'F', code: 'F07', desc: 'Menyamar sebagai aparat', fine: 15000, time: 20, imp: 0 },
  { cat: 'F', code: 'F08', desc: 'Mengganggu operasi kepolisian', fine: 25000, time: 15, imp: 0 },

  // PASAL G - Dokumen, Jabatan & Pemerintah (5 Pasal)
  { cat: 'G', code: 'G01', desc: 'Pemalsuan dokumen', fine: 10000, time: 15, imp: 0 },
  { cat: 'G', code: 'G02', desc: 'Pemalsuan identitas', fine: 50000, time: 20, imp: 0 },
  { cat: 'G', code: 'G03', desc: 'Korupsi', fine: 150000, time: 60, imp: 0 },
  { cat: 'G', code: 'G04', desc: 'Penyalahgunaan jabatan', fine: 100000, time: 60, imp: 0 },
  { cat: 'G', code: 'G05', desc: 'Membocorkan informasi rahasia pemerintah', fine: 100000, time: 60, imp: 0 },

  // PASAL H - Ketertiban Umum & Kerusuhan (5 Pasal)
  { cat: 'H', code: 'H01', desc: 'Membuat keributan di tempat umum', fine: 15000, time: 5, imp: 0 },
  { cat: 'H', code: 'H02', desc: 'Perkelahian di tempat umum', fine: 10000, time: 10, imp: 0 },
  { cat: 'H', code: 'H03', desc: 'Mengganggu pelayanan publik', fine: 10000, time: 10, imp: 0 },
  { cat: 'H', code: 'H04', desc: 'Memprovokasi kerusuhan', fine: 20000, time: 20, imp: 0 },
  { cat: 'H', code: 'H05', desc: 'Kerusuhan massal', fine: 15000, time: 15, imp: 0 },

  // PASAL I - Terorisme & Kejahatan Berat (5 Pasal)
  { cat: 'I', code: 'I-01', desc: 'Terorisme', fine: 50000, time: 40, imp: 0 },
  { cat: 'I', code: 'I-02', desc: 'Percobaan kudeta', fine: 75000, time: 45, imp: 0 },
  { cat: 'I', code: 'I-03', desc: 'Kejahatan terorganisir', fine: 100000, time: 50, imp: 0 },
  { cat: 'I', code: 'I-04', desc: 'Pembentukan organisasi kriminal', fine: 150000, time: 55, imp: 0 },
  { cat: 'I', code: 'I-05', desc: 'Penyanderaan pejabat negara', fine: 200000, time: 60, imp: 0 }
];

export const HSPD_COMMANDS_LIST = [
  { name: "Cek Invoice", cmd: "/checkinvoice", desc: "Melihat riwayat tagihan/denda pemain" },
  { name: "Berikan Invoice", cmd: "/giveinvoice", desc: "Memberikan denda tilang kepada suspect" },
  { name: "Borgol", cmd: "/cuff", desc: "Memborgol tangan suspect yang sudah tak berdaya" },
  { name: "Buka Borgol", cmd: "/uncuff", desc: "Membuka borgol tahanan" },
  { name: "Cek Kendaraan", cmd: "/checkveh", desc: "Memeriksa kepemilikan dan data kendaraan" },
  { name: "Tazer", cmd: "/tazer", desc: "Menyiapkan senjata kejut listrik (non-lethal)" },
  { name: "Kunci Ban", cmd: "/locktire", desc: "Memasang gembok ban pada kendaraan pelanggar" },
  { name: "Impound", cmd: "/impound", desc: "Menyita kendaraan ke garasi impound polisi" },
  { name: "Hancurkan Tanaman", cmd: "/destroyplant", desc: "Mencabut dan memusnahkan tanaman narkoba" },
  { name: "Lego / Fine Invoice", cmd: "/fineinvoice", desc: "Membayar atau memproses denda" },
  { name: "Berikan SKCK", cmd: "/giveskck", desc: "Menerbitkan surat catatan kepolisian resmi" },
  { name: "Tembakkan Flare", cmd: "/flare", desc: "Memasang flare tanda darurat / perimeter" },
  { name: "Hapus Flare", cmd: "/unflare", desc: "Membersihkan flare dari jalan raya" },
  { name: "Lacak Balap Liar", cmd: "/trackrace", desc: "Mendeteksi sinyal jalur drag/sprint ilegal" },
  { name: "Geledah / Frisk", cmd: "/frisk", desc: "Memeriksa isi kantong dan barang bawaan tersangka" },
  { name: "Penjara / Arrest", cmd: "/arrest", desc: "Memasukkan suspect ke dalam sel tahanan kantor" },
  { name: "Suspect List / MDC", cmd: "/mdc", desc: "Membuka database kriminal komputer kepolisian" },
  { name: "Megaphone", cmd: "/m", desc: "Berbicara dengan pengeras suara mobil patroli" },
  { name: "Radio Polisi", cmd: "/r", desc: "Komunikasi frekuensi internal kepolisian" },
  { name: "Department Radio", cmd: "/d", desc: "Radio antar instansi (HSPD, Medic/FD, Gov)" }
];

export const PASAL_STORAGE_KEY = 'hspd_custom_pasal_list_v2';

/**
 * Mengurutkan daftar pasal KUHP & SOP secara rapi berdasarkan Kategori dan Nomor Kode / Badge
 * Contoh: A01, A02 ... A15, B08-1, I-01
 */
export function sortPasalByBadgeCode(list: PasalItem[]): PasalItem[] {
  return [...list].sort((a, b) => {
    // 1. Kategori (A, B, C, D, E, F, G, H, I, dst)
    if (a.cat !== b.cat) return (a.cat || '').localeCompare(b.cat || '');
    // 2. Natural sort pada kode
    return (a.code || '').localeCompare(b.code || '', undefined, { numeric: true, sensitivity: 'base' });
  });
}

export function getSavedPasalList(): PasalItem[] {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      // Hapus cache v1 agar master list terbaru langsung aktif
      if (localStorage.getItem('hspd_custom_pasal_list_v1')) {
        localStorage.removeItem('hspd_custom_pasal_list_v1');
      }
      const raw = localStorage.getItem(PASAL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const valid = parsed.filter(item => item && item.code && item.desc);
          return sortPasalByBadgeCode(valid);
        }
      }
    }
  } catch (e) {
    console.error('Failed reading custom pasal list:', e);
  }
  return sortPasalByBadgeCode([...PASAL_LIST]);
}

export function savePasalList(list: PasalItem[]): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const sorted = sortPasalByBadgeCode(list);
      localStorage.setItem(PASAL_STORAGE_KEY, JSON.stringify(sorted));
      window.dispatchEvent(new CustomEvent('hspd-pasal-updated', { detail: sorted }));
    }
  } catch (e) {
    console.error('Failed saving custom pasal list:', e);
  }
}

export function resetPasalList(): PasalItem[] {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(PASAL_STORAGE_KEY);
      localStorage.removeItem('hspd_custom_pasal_list_v1');
      const sortedDefault = sortPasalByBadgeCode([...PASAL_LIST]);
      window.dispatchEvent(new CustomEvent('hspd-pasal-updated', { detail: sortedDefault }));
    }
  } catch (e) {
    console.error('Failed resetting pasal list:', e);
  }
  return sortPasalByBadgeCode([...PASAL_LIST]);
}
