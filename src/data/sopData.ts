export interface TenCode {
  code: string;
  meaning: string;
  example?: string;
}

export const TEN_CODES: TenCode[] = [
  { code: "10-1", meaning: "Berkumpul di lokasi tertentu / All units assemble", example: "All units, 10-1 at HQ briefing room." },
  { code: "10-2", meaning: "Lokasi saat ini / Current Location", example: "10-2 at Commerce Gas Station." },
  { code: "10-4", meaning: "Dimengerti / Pesan diterima (Copy that / Roger)", example: "10-4, moving in now." },
  { code: "10-5", meaning: "Ulangi pesan terakhir / Repeat last message", example: "10-5 dispatch, audio was unclear." },
  { code: "10-6", meaning: "Dibatalkan / Disregard / Batalkan perintah", example: "10-6 last call, false alarm." },
  { code: "10-8", meaning: "Dalam scene / Sedang menangani situasi aktif", example: "Unit 2 is 10-8 at Idlewood shootout." },
  { code: "10-9", meaning: "Dalam scene penyamaran / Undercover operation", example: "10-9 in Ganton territory." },
  { code: "10-14", meaning: "Meminta jemputan / Request transport unit", example: "Need 10-14 for 2 suspects at Marina." },
  { code: "10-15", meaning: "Membawa tersangka ke sel / Transporting suspect", example: "10-15 heading to Dilimore station." },
  { code: "10-20", meaning: "Lokasi tepat (Spesifik)", example: "What is your 10-20?" },
  { code: "10-21", meaning: "Laporan status unit", example: "Unit 4, give your 10-21." },
  { code: "10-27", meaning: "Berpindah unit kendaraan / Switch patrol vehicle", example: "Unit 1 is 10-27 to Cruiser #4." },
  { code: "10-55", meaning: "Traffic Stop (Pemberhentian lalu lintas rutin)", example: "Conducting 10-55 on black Premier." },
  { code: "10-56", meaning: "Pengecekan komputer / MDC Computer Check", example: "10-56 on license plate LS-4991." },
  { code: "10-57 VICTOR", meaning: "Pengejaran Kendaraan (Vehicle Pursuit)", example: "10-57 VICTOR heading westbound Freeway!" },
  { code: "10-57 FOXTROT", meaning: "Pengejaran Jalan Kaki (Foot Pursuit)", example: "10-57 FOXTROT entering alleyway." },
  { code: "10-60", meaning: "Ciri-ciri kendaraan tersangka", example: "10-60: Red Sultan, dark tinted windows." },
  { code: "10-61", meaning: "Ciri-ciri pakaian / fisik tersangka", example: "10-61: Male, white hoodie, bandanna." },
  { code: "10-66", meaning: "Felony Stop (Pemberhentian risiko tinggi bersenjata)", example: "Initiating 10-66 with firearms drawn." },
  { code: "10-70", meaning: "Membutuhkan bantuan tambahan (Backup Request)", example: "Need backup 10-70: 2 units to Market." },
  { code: "10-80", meaning: "Sedang mengendarai kendaraan patroli", example: "10-80 with Unit 3." },
  { code: "10-85", meaning: "Sedang melakukan patroli rutin di area", example: "10-85 in Los Santos downtown." },
  { code: "10-99", meaning: "Selesai dari aktivitas / Clear status / Siaga kembali", example: "10-99 from robbery scene, available for calls." },
  { code: "CODE 0", meaning: "OFFICER DOWN / KONDISI SANGAT DARURAT - SEMUA UNIT MERAPAT", example: "CODE 0! Officer down at Bank LS!" }
];

export const RADIO_FREQUENCIES = [
  { freq: "1111", name: "Radio Kantor Pusat (HQ Main Freq)", desc: "Radio utama kepolisian seluruh kota dan arahan pimpinan/jenderal." },
  { freq: "1112", name: "Emergency ATM Robbery", desc: "Khusus koordinasi penanganan perampokan mesin ATM." },
  { freq: "1113", name: "Bank Desa Robbery (Rural Banks)", desc: "Khusus penanganan situasi perampokan Bank Palomino / Dilimore / Blueberry." },
  { freq: "1114", name: "Bank Besar Robbery (Central Bank)", desc: "Khusus penanganan insiden Bank Pusat Los Santos (Big Case & SWAT)." }
];

export const WEAPON_RULES_DIVISIONS = [
  { div: "Cadet", weapons: ["SLC (Taser) [WAJIB]", "Colt .45", "Nightstick / Baton"], maxWeapons: 2, notes: "Fokus latihan dan pendampingan perwira" },
  { div: "Officer Non Divisi", weapons: ["SLC (Taser) [WAJIB]", "Colt .45", "Nightstick / Baton"], maxWeapons: 2, notes: "Patroli standar kota" },
  { div: "Patrol Unit", weapons: ["Silenced Taser [WAJIB]", "Desert Eagle", "Shotgun"], maxWeapons: 2, notes: "Respons cepat jalan raya" },
  { div: "Metro Unit", weapons: ["Silenced Taser [WAJIB]", "Desert Eagle", "Shotgun", "MP5"], maxWeapons: 2, notes: "Area rawan kejahatan padat kota" },
  { div: "SWAT", weapons: ["Silenced Taser [WAJIB]", "Desert Eagle", "SPAS-12", "MP5", "M4 Carbine (Big Case)", "Sniper Rifle (Big Case)"], maxWeapons: 2, notes: "Khusus operasi taktis & situasi ancaman tinggi" },
  { div: "FBI / CID", weapons: ["Silenced Taser [WAJIB]", "Desert Eagle", "MP5", "SPAS-12"], maxWeapons: 2, notes: "Investigasi rahasia & kejahatan terorganisir" },
  { div: "PSD (Protection Service)", weapons: ["Silenced Taser [WAJIB]", "Desert Eagle", "MP5", "SPAS-12"], maxWeapons: 2, notes: "Pengawalan VIP dan pejabat tinggi negara" },
  { div: "ECM (Emergency Tactical)", weapons: ["Silenced Taser [WAJIB]", "Desert Eagle", "Shotgun"], maxWeapons: 2, notes: "Pengendalian massa & situasi darurat" }
];
