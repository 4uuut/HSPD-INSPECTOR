# HSPD FiveM Discord Rich Presence (RPC) v1.0.0
Panduan Pemasangan Status Aktivitas Discord Profil untuk Server FiveM HighState Police Department (HSPD).

---

## 📋 Langkah 1: Buat Discord Application & Dapatkan Application ID
1. Buka browser dan pergi ke **[Discord Developer Portal](https://discord.com/developers/applications)**.
2. Klik tombol **"New Application"** di pojok kanan atas.
3. Beri nama aplikasi Anda, misalnya: `State of HighState Police Department` (Nama ini yang akan muncul sebagai *"Playing [Nama Aplikasi]"* di profil Discord Anda).
4. Klik **Create**.
5. Pada tab **General Information**, salin **APPLICATION ID** (angka 18-19 digit).

---

## 🎨 Langkah 2: Upload Gambar Logo & Lencana (Art Assets)
1. Di menu sebelah kiri Developer Portal, klik **Rich Presence** -> **Art Assets**.
2. Di bagian **Rich Presence Assets**, klik **Add Image(s)**:
   - Upload Logo Besar server / kepolisian, lalu beri nama asset: `hspd_logo_large`
   - Upload Logo Lencana Polisi kecil, lalu beri nama asset: `police_badge`
3. Klik tombol hijau **Save Changes** di bagian bawah.

---

## ⚙️ Langkah 3: Konfigurasi di FiveM Server
1. Masukkan folder `hspd-discord-rpc` ini ke direktori resources server FiveM Anda:
   ```
   [server-data]/resources/[hspd]/hspd-discord-rpc/
   ```
2. Buka file `config.lua`:
   - Ganti `Config.DiscordAppId = '123456789012345678'` dengan Application ID asli dari Langkah 1.
   - Periksa nama asset `Config.LargeAsset` dan `Config.SmallAsset` agar sama dengan nama yang diupload di Discord Dev Portal.
   - Ganti tautan tombol `Config.Buttons` dengan link MDT polisi Anda dan link join server FiveM Anda (`cfx.re/join/xxxxxx`).
3. Buka file `server.cfg` server FiveM Anda dan tambahkan baris berikut:
   ```cfg
   ensure hspd-discord-rpc
   ```
4. Restart server FiveM atau jalankan command console: `refresh` lalu `start hspd-discord-rpc`.

---

## 🎮 Uji Coba di Game
1. Buka aplikasi Discord Desktop di komputer Anda (pastikan pengaturan **User Settings -> Activity Privacy -> Display current activity as a status message** aktif).
2. Masuk ke server FiveM Anda.
3. Buka profil Discord Anda, status *"Playing State of HighState Police Department"* akan langsung muncul lengkap dengan nama karakter, badge, status 10-8 On Duty, jumlah pemain, dan tombol menuju CAD/MDT!
