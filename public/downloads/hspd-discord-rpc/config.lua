Config = {}

-- Masukkan Application ID dari Discord Developer Portal (https://discord.com/developers/applications)
Config.DiscordAppId = '123456789012345678' -- Ganti dengan Application ID Discord Anda

-- Pengaturan Aset Gambar (Upload di: Discord Dev Portal -> Rich Presence -> Art Assets)
Config.LargeAsset = 'hspd_logo_large'      -- Nama asset gambar besar yang diupload di Discord
Config.LargeAssetText = 'State of HighState Police Department'
Config.SmallAsset = 'police_badge'        -- Nama asset gambar kecil (misal lencana dinas polisi)
Config.SmallAssetText = 'HSPD Law Enforcement MDT v4.3.0'

-- Teks Default Status (Sebelum login/bertugas)
Config.DefaultDetails = 'State of HighState Police'
Config.DefaultState = 'Warga Kota / Standby'

-- Tombol Interaktif di Profil Discord (Maksimal 2 tombol sesuai aturan Discord)
Config.Buttons = {
    {
        index = 0,
        label = '🚔 Buka CAD/MDT Polisi',
        url = 'https://mdt-hspd-inspector.vercel.app' -- URL MDT Anda
    },
    {
        index = 1,
        label = '🎮 Join Server FiveM',
        url = 'https://cfx.re/join/xxxxxx' -- Link join server FiveM Anda
    }
}

-- Interval pembaruan status (dalam milidetik, rekomendasi 15000 = 15 detik agar tidak kena rate-limit Discord)
Config.UpdateInterval = 15000

-- Integrasi Framework (Otomatis mendeteksi status polisi jika menggunakan ESX atau QBCore)
Config.UseFrameworkDuty = true  -- Set true jika ingin otomatis mengambil Job Polisi & Status On Duty
Config.Framework = 'auto'       -- 'auto', 'esx', 'qbcore', atau 'standalone'
