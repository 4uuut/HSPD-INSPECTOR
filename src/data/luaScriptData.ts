export const LUA_SCRIPT_V2 = `-- ==============================================================================
-- HIGHSTATE ROLEPLAY - HSPD ASSISTANT V2.5 (ENHANCED EDITION)
-- Modul: Pasal Menu, Kalkulator Denda, Hak Miranda, Megaphone, SOP, & RP Actions
-- Original Author: Michael Caldwell | Supporter: Jackie Xianlao
-- Enhanced Edition: Hak Miranda Auto-Reader, Command Builder (/arrest, /giveinvoice),
--                  Panic Button (Code 0), Quick RP Actions (/me & /do), F3 Hotkey
-- ==============================================================================

local imgui = require 'mimgui'
local encoding = require 'encoding'
local ffi = require 'ffi'
local vkeys = require 'vkeys'

encoding.default = 'CP1251'
local u8 = encoding.UTF8

-- State Windows & Popups
local window_state = imgui.new.bool(false)
local show_regulasi_popup = imgui.new.bool(false)
local show_megaphone_popup = imgui.new.bool(false)
local show_HSPD_cmd_popup = imgui.new.bool(false)
local show_sop_hspd_popup = imgui.new.bool(false)
local show_kode_etik_popup = imgui.new.bool(false)
local show_sop_radio_popup = imgui.new.bool(false)
local show_sop_pursuit_popup = imgui.new.bool(false)
local show_sop_persenjataan_popup = imgui.new.bool(false)
local show_miranda_popup = imgui.new.bool(false)
local show_rp_action_popup = imgui.new.bool(false)
local show_command_builder = imgui.new.bool(false)

-- State Diskon & Suspect Data
local is_cooperative = imgui.new.bool(false)
local suspect_id_input = ffi.new("char[16]", "")
local suspect_name_input = ffi.new("char[64]", "")
local custom_reason_input = ffi.new("char[128]", "")

-- Data Megaphone Custom Input
local mega_veh_name = ffi.new("char[32]", "Sultan")
local mega_veh_color = ffi.new("char[32]", "Hitam")
local mega_veh_plate = ffi.new("char[32]", "LS-1234")
local mega_bank_name = ffi.new("char[32]", "Bank Pusat Los Santos")
local mega_tab_selected = imgui.new.int(0)

-- Data Kalkulasi
local total_denda, total_penjara, total_impound = 0, 0, 0
local list_kode_pasal = {}
local selected_category = "ALL" 
local search_text = ffi.new("char[128]", "")

-- DAFTAR PERINTAH LENGKAP HSPD
local HSPD_COMMANDS = {
    { name = "Cek Invoice", cmd = "/checkinvoice" },
    { name = "Berikan Invoice", cmd = "/giveinvoice" },
    { name = "Borgol Suspect", cmd = "/cuff" },
    { name = "Buka Borgol", cmd = "/uncuff" },
    { name = "Geledah Tubuh", cmd = "/frisk" },
    { name = "Cek Kendaraan", cmd = "/checkveh" },
    { name = "Tazer Siaga", cmd = "/tazer" },
    { name = "Kunci Gembok Ban", cmd = "/locktire" },
    { name = "Sita Impound", cmd = "/impound" },
    { name = "Hancurkan Tanaman", cmd = "/destroyplant" },
    { name = "Lego Denda", cmd = "/fineinvoice" },
    { name = "Terbitkan SKCK", cmd = "/giveskck" },
    { name = "Tembak Flare Darurat", cmd = "/flare" },
    { name = "Bersihkan Flare", cmd = "/unflare" },
    { name = "Lacak Balap Liar", cmd = "/trackrace" },
    { name = "Buka Database MDC", cmd = "/mdc" },
    { name = "Radio Internal", cmd = "/r" },
    { name = "Radio Antar Instansi", cmd = "/d" },
    { name = "Pengeras Suara / Megaphone", cmd = "/m" },
    { name = "Tahan ke Sel Penjara", cmd = "/arrest" }
}

-- DAFTAR PASAL HIGHSTATE RP (A - H)
local ALL_DATA = {
    -- PASAL A (Lalu Lintas)
    {cat = 'A', code = 'A01', desc = 'Berkendara tidak memiliki SIM', fine = 1000, time = 0, imp = 1},
    {cat = 'A', code = 'A02', desc = 'Berkendara Secara Ugal - Ugalan', fine = 1200, time = 0, imp = 1},
    {cat = 'A', code = 'A03', desc = 'Parkir Sembarangan', fine = 1500, time = 0, imp = 1},
    {cat = 'A', code = 'A04', desc = 'Kendaraan tidak memiliki plat nomor', fine = 1300, time = 0, imp = 1},
    {cat = 'A', code = 'A05', desc = 'Kabur dari Kecelakaan', fine = 1800, time = 5, imp = 1},
    {cat = 'A', code = 'A06', desc = 'Kecelakaan hingga menimbulkan korban jiwa', fine = 5000, time = 10, imp = 2},
    {cat = 'A', code = 'A07', desc = 'Mengemudi Melawan Arus', fine = 1400, time = 0, imp = 0},
    {cat = 'A', code = 'A08', desc = 'Mengangkut Penumpang Lebih dari Kapasitas', fine = 2000, time = 0, imp = 0},
    {cat = 'A', code = 'A09', desc = 'Menghindar saat diberhentikan petugas', fine = 1700, time = 10, imp = 1},
    {cat = 'A', code = 'A10', desc = 'Menabrak Rambu Lalu Lintas', fine = 1200, time = 0, imp = 0},
    {cat = 'A', code = 'A11', desc = 'Modifikasi Ilegal (Nitro & Knalpot Api)', fine = 1500, time = 0, imp = 1},
    {cat = 'A', code = 'A12', desc = 'Balap Liar', fine = 4500, time = 15, imp = 2},
    {cat = 'A', code = 'A13', desc = 'Menerobos barikade kepolisian', fine = 2500, time = 0, imp = 1},
    {cat = 'A', code = 'A14', desc = 'Mengemudi dalam keadaan mabuk', fine = 2500, time = 5, imp = 2},
    {cat = 'A', code = 'A15', desc = 'Mengemudi dengan kecepatan berlebihan', fine = 1000, time = 0, imp = 1},
    {cat = 'A', code = 'A16', desc = 'Tidak memberikan prioritas kepada pejalan kaki', fine = 2200, time = 0, imp = 0},
    {cat = 'A', code = 'A17', desc = 'Menggunakan ponsel saat mengemudi', fine = 1500, time = 0, imp = 0},
    {cat = 'A', code = 'A18', desc = 'Tidak menggunakan sabuk pengaman', fine = 1500, time = 0, imp = 0},
    {cat = 'A', code = 'A19', desc = 'Melanggar lampu lalu lintas', fine = 1500, time = 0, imp = 1},
    {cat = 'A', code = 'A20', desc = 'Tidak memberikan lampu sen saat berbelok', fine = 1000, time = 0, imp = 0},

    -- PASAL B (Pidana Umum)
    {cat = 'B', code = 'B01', desc = 'Kekerasan Ringan', fine = 2500, time = 10, imp = 0},
    {cat = 'B', code = 'B02', desc = 'Memasuki zona merah polisi', fine = 1500, time = 5, imp = 0},
    {cat = 'B', code = 'B03', desc = 'Buang air kecil/besar sembarangan', fine = 1000, time = 5, imp = 0},
    {cat = 'B', code = 'B04', desc = 'Mengganggu / menipu petugas', fine = 1600, time = 8, imp = 0},
    {cat = 'B', code = 'B05', desc = 'Ujaran buruk individu/kelompok', fine = 3000, time = 12, imp = 0},
    {cat = 'B', code = 'B06', desc = 'Berkelahi di tempat umum', fine = 1750, time = 15, imp = 0},
    {cat = 'B', code = 'B07', desc = 'Gangguan Ketertiban Umum', fine = 1900, time = 10, imp = 1},
    {cat = 'B', code = 'B08', desc = 'Pencurian', fine = 3000, time = 18, imp = 1},
    {cat = 'B', code = 'B09', desc = 'Vandalisme', fine = 2500, time = 13, imp = 0},
    {cat = 'B', code = 'B10', desc = 'Atribut instansi ilegal', fine = 1750, time = 8, imp = 0},
    {cat = 'B', code = 'B11', desc = 'Menyamar sebagai petugas', fine = 1800, time = 10, imp = 0},
    {cat = 'B', code = 'B12', desc = 'Percobaan suap terhadap petugas', fine = 1800, time = 12, imp = 0},
    {cat = 'B', code = 'B13', desc = 'Informasi palsu kepada petugas', fine = 1500, time = 12, imp = 0},
    {cat = 'B', code = 'B14', desc = 'Memiliki hewan dilindungi', fine = 5500, time = 13, imp = 0},
    {cat = 'B', code = 'B15', desc = 'Memperjualbelikan hewan dilindungi', fine = 7000, time = 15, imp = 0},
    {cat = 'B', code = 'B16', desc = 'Mengumpulkan massa/kekacauan', fine = 9500, time = 25, imp = 0},
    {cat = 'B', code = 'B17', desc = 'Ikut kerusuhan', fine = 10000, time = 20, imp = 0},
    {cat = 'B', code = 'B18', desc = 'Menolak membubarkan diri', fine = 2000, time = 8, imp = 0},
    {cat = 'B', code = 'B19', desc = 'Penghakiman sepihak', fine = 8500, time = 20, imp = 0},
    {cat = 'B', code = 'B20', desc = 'Pemburuan tanpa lisensi', fine = 6500, time = 15, imp = 0},
    {cat = 'B', code = 'B21', desc = 'Melanggar jam malam', fine = 1100, time = 5, imp = 0},
    {cat = 'B', code = 'B22', desc = 'Suara keras/mengganggu', fine = 1150, time = 8, imp = 0},
    {cat = 'B', code = 'B23', desc = 'Menghina simbol negara', fine = 7500, time = 15, imp = 0},
    {cat = 'B', code = 'B24', desc = 'Menolak perintah petugas', fine = 8500, time = 10, imp = 0},
    {cat = 'B', code = 'B25', desc = 'Tindakan asusila di umum', fine = 9500, time = 12, imp = 0},
    {cat = 'B', code = 'B26', desc = 'Mencoba melarikan diri', fine = 1900, time = 10, imp = 0},

    -- PASAL C (Properti)
    {cat = 'C', code = 'C01', desc = 'Masuk properti pribadi tanpa izin', fine = 1300, time = 10, imp = 0},
    {cat = 'C', code = 'C02', desc = 'Masuk properti pemerintah tanpa izin', fine = 1500, time = 11, imp = 0},
    {cat = 'C', code = 'C03', desc = 'Merusak properti', fine = 3500, time = 15, imp = 0},
    {cat = 'C', code = 'C04', desc = 'Membakar properti', fine = 3200, time = 25, imp = 0},
    {cat = 'C', code = 'C05', desc = 'Properti tempat barang ilegal', fine = 3900, time = 30, imp = 0},
    {cat = 'C', code = 'C06', desc = 'Membobol properti (niat curi)', fine = 4000, time = 23, imp = 0},
    {cat = 'C', code = 'C07', desc = 'Graffiti tanpa izin', fine = 3300, time = 8, imp = 0},
    {cat = 'C', code = 'C08', desc = 'Poster/spanduk tanpa izin', fine = 2900, time = 5, imp = 0},
    {cat = 'C', code = 'C09', desc = 'Mengganggu properti bersama', fine = 2700, time = 12, imp = 0},
    {cat = 'C', code = 'C10', desc = 'Mengubah fungsi properti', fine = 5000, time = 20, imp = 0},

    -- PASAL D (Narkotika)
    {cat = 'D', code = 'D01', desc = 'Berada di tempat narkotika', fine = 2000, time = 15, imp = 0},
    {cat = 'D', code = 'D02', desc = 'Terlibat pembuatan narkotika', fine = 7000, time = 20, imp = 0},
    {cat = 'D', code = 'D03', desc = 'Menjual/distribusi narkotika', fine = 8000, time = 30, imp = 0},
    {cat = 'D', code = 'D04-1', desc = 'Kanabis [1-10 pcs]', fine = 1000, time = 15, imp = 0},
    {cat = 'D', code = 'D04-2', desc = 'Kanabis [11-25 pcs]', fine = 1500, time = 16, imp = 0},
    {cat = 'D', code = 'D04-3', desc = 'Kanabis [>25 pcs]', fine = 2500, time = 20, imp = 0},
    {cat = 'D', code = 'D05-1', desc = 'Marijuana [1-5 pcs]', fine = 3000, time = 25, imp = 0},
    {cat = 'D', code = 'D05-2', desc = 'Marijuana [6-10 pcs]', fine = 3500, time = 30, imp = 0},
    {cat = 'D', code = 'D05-3', desc = 'Marijuana [>10 pcs]', fine = 4000, time = 35, imp = 0},
    {cat = 'D', code = 'D06', desc = 'Alat konsumsi narkotika', fine = 2200, time = 12, imp = 0},
    {cat = 'D', code = 'D07', desc = 'Transport kimia narkotika', fine = 5500, time = 25, imp = 0},
    {cat = 'D', code = 'D08', desc = 'Resep palsu narkotika', fine = 4700, time = 18, imp = 0},
    {cat = 'D', code = 'D09', desc = 'Pencabutan Kanabis', fine = 2500, time = 15, imp = 0},
    {cat = 'D', code = 'D10', desc = 'Kepemilikan Srimulat', fine = 1000, time = 10, imp = 0},
    {cat = 'D', code = 'D11', desc = 'Kepemilikan Sabu', fine = 1000, time = 13, imp = 0},
    {cat = 'D', code = 'D12', desc = 'Narkotika di bagasi', fine = 1500, time = 13, imp = 0},

    -- PASAL E (Senjata)
    {cat = 'E', code = 'E01', desc = 'Senjata tajam ilegal', fine = 6000, time = 10, imp = 0},
    {cat = 'E', code = 'E02-1', desc = 'Senpi ilegal (Class 1)', fine = 6500, time = 12, imp = 0},
    {cat = 'E', code = 'E02-2', desc = 'Senpi ilegal (Class 2)', fine = 7500, time = 15, imp = 0},
    {cat = 'E', code = 'E02-3', desc = 'Senpi ilegal (Class 3)', fine = 8500, time = 20, imp = 0},
    {cat = 'E', code = 'E03', desc = 'Kepemilikan Vest', fine = 3500, time = 10, imp = 0},
    {cat = 'E', code = 'E04', desc = 'Kepemilikan Opium', fine = 2000, time = 8, imp = 0},
    {cat = 'E', code = 'E05', desc = 'Bahan peledak ilegal', fine = 10000, time = 30, imp = 0},
    {cat = 'E', code = 'E06', desc = 'Senjata menakut-nakuti', fine = 2500, time = 15, imp = 0},
    {cat = 'E', code = 'E07', desc = 'Clip Class 1', fine = 1500, time = 15, imp = 0},
    {cat = 'E', code = 'E08', desc = 'Clip Class 2', fine = 1800, time = 15, imp = 0},
    {cat = 'E', code = 'E09', desc = 'Clip Class 3', fine = 2000, time = 20, imp = 0},
    {cat = 'E', code = 'E10', desc = 'Uang Merah (5k-20k)', fine = 3000, time = 15, imp = 0},
    {cat = 'E', code = 'E11', desc = 'Uang Merah (20k-999k)', fine = 4000, time = 20, imp = 0},
    {cat = 'E', code = 'E12', desc = 'Barang tindak kriminal', fine = 1500, time = 15, imp = 0},

    -- PASAL F (Kriminal Berat)
    {cat = 'F', code = 'F01', desc = 'Pembegalan', fine = 5000, time = 15, imp = 2},
    {cat = 'F', code = 'F02', desc = 'Perampokan Warung', fine = 5500, time = 17, imp = 2},
    {cat = 'F', code = 'F03', desc = 'Pencurian Mobil', fine = 4000, time = 12, imp = 0},
    {cat = 'F', code = 'F04', desc = 'Penyerangan instansi', fine = 2600, time = 10, imp = 0},
    {cat = 'F', code = 'F05', desc = 'Penyanderaan', fine = 7000, time = 15, imp = 0},
    {cat = 'F', code = 'F06', desc = 'War antar kelompok', fine = 7500, time = 25, imp = 0},
    {cat = 'F', code = 'F07', desc = 'Pencurian dengan kekerasan', fine = 8500, time = 20, imp = 0},
    {cat = 'F', code = 'F08', desc = 'Pembunuhan', fine = 10000, time = 30, imp = 0},
    {cat = 'F', code = 'F09', desc = 'Penyerangan fasilitas penting', fine = 6000, time = 18, imp = 0},
    {cat = 'F', code = 'F10', desc = 'Pemerasan dengan ancaman', fine = 8500, time = 16, imp = 0},
    {cat = 'F', code = 'F11', desc = 'Terorisme', fine = 10000, time = 30, imp = 0},
    {cat = 'F', code = 'F12', desc = 'Penyanderaan Massal', fine = 10000, time = 30, imp = 0},
    {cat = 'F', code = 'F13', desc = 'Perampokan ATM', fine = 6000, time = 30, imp = 0},
    {cat = 'F', code = 'F14', desc = 'Perampokan Bank Desa', fine = 8000, time = 35, imp = 0},
    {cat = 'F', code = 'F15', desc = 'Perampokan Bank Besar', fine = 10000, time = 45, imp = 0},
    {cat = 'F', code = 'F16', desc = 'Penembakan', fine = 3500, time = 40, imp = 0},

    -- PASAL G (Ekonomi)
    {cat = 'G', code = 'G01', desc = 'Pencucian uang', fine = 10000, time = 20, imp = 0},
    {cat = 'G', code = 'G02', desc = 'Penipuan bisnis', fine = 2000, time = 15, imp = 0},
    {cat = 'G', code = 'G03', desc = 'Pemalsuan dokumen keuangan', fine = 1500, time = 18, imp = 0},
    {cat = 'G', code = 'G04', desc = 'Penghindaran pajak', fine = 1300, time = 12, imp = 0},
    {cat = 'G', code = 'G05', desc = 'Perdagangan ilegal', fine = 3400, time = 22, imp = 0},
    {cat = 'G', code = 'G06', desc = 'Penyelundupan barang', fine = 4500, time = 20, imp = 0},

    -- PASAL H (Lain-lain)
    {cat = 'H', code = 'H01', desc = 'Membahayakan diri sendiri', fine = 3000, time = 5, imp = 0},
    {cat = 'H', code = 'H02', desc = 'Penyalahgunaan info pribadi', fine = 2000, time = 8, imp = 0},
    {cat = 'H', code = 'H03', desc = 'Penyerangan tanpa motif', fine = 8500, time = 15, imp = 0},
    {cat = 'H', code = 'H04', desc = 'Kendaraan sebagai senjata', fine = 9500, time = 12, imp = 1},
    {cat = 'H', code = 'H05', desc = 'Tindakan provokatif', fine = 5500, time = 3, imp = 0},
    {cat = 'H', code = 'H06', desc = 'Tindakan curang', fine = 4500, time = 18, imp = 0}
}

local OFFENCE_DATA = {
    {key = 'A', title = 'Lalu Lintas'}, {key = 'B', title = 'Pidana Umum'},
    {key = 'C', title = 'Properti'}, {key = 'D', title = 'Narkotika'},
    {key = 'E', title = 'Senjata'}, {key = 'F', title = 'Kriminal Berat'},
    {key = 'G', title = 'Ekonomi'}, {key = 'H', title = 'Lain-lain'}
}

-- HELPER FUNCTIONS
local function copyToClipboard(text)
    if text == nil or text == "" then return end
    pcall(function() setClipboardText(text) end)
    printStringNow("~g~Teks Berhasil Disalin ke Clipboard!", 2000)
end

local function executeCommand(command)
    if sampSendChat then
        sampSendChat(command)
        printStringNow("~g~Menjalankan: ~w~" .. command, 1500)
    end
end

local function sendMegaphoneText(text)
    if sampSetChatInputText then
        sampSetChatInputText("/m " .. text)
        printStringNow("~g~Megaphone Siap Diisi!", 2000)
    end
end

local function sendChatMessage(msg)
    if sampSendChat then
        sampSendChat(msg)
    end
end

-- PANIC BUTTON (CODE 0 / 10-99 BROADCAST)
local function triggerPanicButton()
    lua_thread.create(function()
        local posX, posY, posZ = getCharCoordinates(PLAYER_PED)
        local zone = calculatePathZoneName(posX, posY, posZ) or "Lokasi Saat Ini"
        sampSendChat(string.format("/d [EMERGENCY 10-99] CODE 0! OFFICER DOWN AT %s! NEED ALL UNITS BACKUP!", string.upper(zone)))
        sampSendChat(string.format("/r [PANIC ALERT] Code 0 triggered at %s! Koordinat X: %.1f Y: %.1f", zone, posX, posY))
        printStringNow("~r~PANIC BUTTON AKTIF! CODE 0 DIKIRIM!", 3000)
    end)
end

-- AUTO READ MIRANDA RIGHTS
local function readMirandaRights(lang)
    lua_thread.create(function()
        printStringNow("~y~Membacakan Hak Miranda...", 3000)
        if lang == "ID" then
            sampSendChat("Anda memiliki hak untuk tetap diam.")
            wait(1200)
            sampSendChat("Apapun yang Anda katakan dapat dan akan digunakan untuk melawan Anda di pengadilan.")
            wait(1200)
            sampSendChat("Anda berhak didampingi oleh penasihat hukum / pengacara saat diinterogasi.")
            wait(1200)
            sampSendChat("Jika Anda tidak mampu menyewa pengacara, negara dapat menyediakannya untuk Anda.")
            wait(1200)
            sampSendChat("Apakah Anda memahami hak-hak yang telah saya bacakan?")
            wait(1000)
            sampSendChat("/do Apakah suspect memahami seluruh hak Miranda yang dibacakan? (( Suspect ))")
        else
            sampSendChat("You have the right to remain silent.")
            wait(1200)
            sampSendChat("Anything you say can and will be used against you in a court of law.")
            wait(1200)
            sampSendChat("You have the right to talk to a lawyer and have him present with you while being questioned.")
            wait(1200)
            sampSendChat("If you cannot afford a lawyer, one will be appointed to represent you before questioning.")
            wait(1200)
            sampSendChat("Do you understand each of these rights as I have explained to you?")
            wait(1000)
            sampSendChat("/do Does the suspect understand their Miranda rights? (( Suspect ))")
        end
    end)
end

local function isPasalSelected(code)
    for _, v in ipairs(list_kode_pasal) do
        if v == code then return true end
    end
    return false
end

local function getItemByCode(code)
    for _, item in ipairs(ALL_DATA) do
        if item.code == code then return item end
    end
    return nil
end

local function removePasal(item)
    for i, code in ipairs(list_kode_pasal) do
        if code == item.code then
            table.remove(list_kode_pasal, i)
            total_denda = math.max(0, total_denda - item.fine)
            total_penjara = math.max(0, total_penjara - item.time)
            total_impound = math.max(0, total_impound - item.imp)
            break
        end
    end
end

-- ==============================================================================
-- MAIN IMGUI RENDER FRAME
-- ==============================================================================
imgui.OnFrame(function() return window_state[0] end, function()
    imgui.PushStyleColor(imgui.Col.WindowBg, imgui.ImVec4(0.06, 0.09, 0.14, 0.98))
    imgui.PushStyleColor(imgui.Col.ChildBg, imgui.ImVec4(0.04, 0.06, 0.10, 1.0))
    imgui.PushStyleColor(imgui.Col.HeaderHovered, imgui.ImVec4(0.12, 0.35, 0.65, 0.5))
    imgui.PushStyleColor(imgui.Col.Header, imgui.ImVec4(0.12, 0.35, 0.65, 0.8))

    imgui.SetNextWindowSize(imgui.ImVec2(1040, 560), imgui.Cond.FirstUseEver)
    imgui.Begin(u8("HIGHSTATE ROLEPLAY - HSPD POLICE ASSISTANT V2.5"), window_state, imgui.WindowFlags.NoCollapse)

    -- Tab Kategori Utama
    if imgui.Button(u8("ALL"), imgui.ImVec2(0, 25)) then selected_category = "ALL" end
    for _, group in ipairs(OFFENCE_DATA) do
        imgui.SameLine()
        if imgui.Button(u8(group.title), imgui.ImVec2(0, 25)) then selected_category = group.key end
    end
    
    -- Tombol Menu Modul Tambahan
    imgui.SameLine()
    imgui.PushStyleColor(imgui.Col.Button, imgui.ImVec4(0.7, 0.2, 0.2, 0.9))
    if imgui.Button(u8("HAK MIRANDA"), imgui.ImVec2(0, 25)) then
        show_miranda_popup[0] = true
    end
    imgui.PopStyleColor(1)

    imgui.SameLine()
    imgui.PushStyleColor(imgui.Col.Button, imgui.ImVec4(0.2, 0.5, 0.3, 0.9))
    if imgui.Button(u8("RP ACTIONS (/me)"), imgui.ImVec2(0, 25)) then
        show_rp_action_popup[0] = true
    end
    imgui.PopStyleColor(1)

    imgui.SameLine()
    if imgui.Button(u8("PERINTAH HSPD"), imgui.ImVec2(0, 25)) then
        show_HSPD_cmd_popup[0] = true
    end

    imgui.SameLine()
    if imgui.Button(u8("SOP HSPD"), imgui.ImVec2(0, 25)) then
        show_sop_hspd_popup[0] = true
    end

    imgui.SameLine()
    if imgui.Button(u8("LAYANAN APB"), imgui.ImVec2(0, 25)) then
        show_regulasi_popup[0] = true
    end

    imgui.SameLine()
    if imgui.Button(u8("MEGAPHONE"), imgui.ImVec2(0, 25)) then
        show_megaphone_popup[0] = true
    end

    imgui.Spacing(); imgui.Separator(); imgui.Spacing()

    imgui.Columns(2, "main_layout", true)
    imgui.SetColumnWidth(0, 580)

    -- Panel Kiri (Daftar & Search Pasal)
    imgui.BeginChild("ListChild", imgui.ImVec2(0, 440), true)
    
    imgui.PushItemWidth(-1)
    imgui.InputTextWithHint("##search", u8("Search Pasal atau Deskripsi..."), search_text, 128)
    imgui.PopItemWidth()
    
    local filter = ffi.string(search_text):lower()
    
    imgui.Spacing(); imgui.Separator(); imgui.Spacing()
    
    for _, item in ipairs(ALL_DATA) do
        local match_cat = (selected_category == "ALL" or item.cat == selected_category)
        local match_text = (filter == "" or item.desc:lower():find(filter, 1, true) or item.code:lower():find(filter, 1, true))
        
        if match_cat and match_text then
            local is_selected = isPasalSelected(item.code)
            
            if imgui.Selectable(u8(item.code .. " - " .. item.desc .. " ($" .. item.fine .. " | " .. item.time .. "bln | " .. item.imp .. "imp)"), is_selected) then
                if is_selected then
                    removePasal(item)
                else
                    total_denda = total_denda + item.fine
                    total_penjara = total_penjara + item.time
                    total_impound = total_impound + item.imp
                    table.insert(list_kode_pasal, item.code)
                end
            end
        end
    end
    imgui.EndChild()

    -- Panel Kanan (Ringkasan & Input Suspect ID)
    imgui.NextColumn()
    imgui.TextColored(imgui.ImVec4(0.4, 0.7, 1.0, 1), u8("RINGKASAN DENDA & STATUS SUSPECT"))
    imgui.Separator()
    
    local cp = table.concat(list_kode_pasal, ", ")
    
    imgui.Text(u8("Pasal Terpilih (Klik [X] untuk hapus):"))
    imgui.PushStyleColor(imgui.Col.ChildBg, imgui.ImVec4(0.02, 0.04, 0.07, 1.0))
    imgui.BeginChild("SelectedListChild", imgui.ImVec2(0, 65), true)
    if #list_kode_pasal == 0 then
        imgui.TextDisabled(u8("Belum ada pasal terpilih"))
    else
        for _, code in ipairs(list_kode_pasal) do
            local item = getItemByCode(code)
            if item then
                if imgui.SmallButton(u8("[X] " .. code)) then
                    removePasal(item)
                end
                imgui.SameLine()
            end
        end
    end
    imgui.EndChild()
    imgui.PopStyleColor(1)

    imgui.Spacing()

    -- Input Suspect ID untuk Quick Command Generator
    imgui.PushItemWidth(80)
    imgui.InputText(u8("ID Player Suspect"), suspect_id_input, 16)
    imgui.PopItemWidth()

    imgui.Spacing()

    -- Box Total & Checkbox Diskon
    imgui.PushStyleColor(imgui.Col.ChildBg, imgui.ImVec4(0.08, 0.12, 0.18, 1.0))
    imgui.BeginChild("SummaryBox", imgui.ImVec2(0, 95), true)
        imgui.Checkbox(u8("Diskon Kooperatif (-20%)"), is_cooperative)
        imgui.Separator()

        local final_denda = total_denda
        if is_cooperative[0] then
            final_denda = math.floor(total_denda * 0.8)
        end

        if is_cooperative[0] and total_denda > 0 then
            imgui.TextColored(imgui.ImVec4(0.2, 0.9, 0.4, 1.0), u8("Total Denda    : $ " .. final_denda .. " (-20% Diskon)"))
        else
            imgui.Text(u8("Total Denda    : $ " .. final_denda))
        end

        imgui.Text(u8("Total Penjara  : " .. total_penjara .. " bulan"))
        imgui.Text(u8("Total Impound  : " .. total_impound .. " hari"))
    imgui.EndChild()
    imgui.PopStyleColor(1)

    imgui.Spacing()

    local final_denda = is_cooperative[0] and math.floor(total_denda * 0.8) or total_denda
    local s_id = ffi.string(suspect_id_input)

    -- Tombol Cepat Berikan Invoice / Arrest
    if s_id ~= "" and cp ~= "" then
        imgui.PushStyleColor(imgui.Col.Button, imgui.ImVec4(0.1, 0.6, 0.3, 0.9))
        if imgui.Button(u8(string.format("KIRIM /giveinvoice %s %d", s_id, final_denda)), imgui.ImVec2(-1, 24)) then
            executeCommand(string.format("/giveinvoice %s %d %s", s_id, final_denda, cp))
        end
        imgui.PopStyleColor(1)

        if total_penjara > 0 then
            imgui.PushStyleColor(imgui.Col.Button, imgui.ImVec4(0.7, 0.3, 0.1, 0.9))
            if imgui.Button(u8(string.format("KIRIM /arrest %s %d %d", s_id, total_penjara, final_denda)), imgui.ImVec2(-1, 24)) then
                executeCommand(string.format("/arrest %s %d %d %s", s_id, total_penjara, final_denda, cp))
            end
            imgui.PopStyleColor(1)
        end
    end

    if imgui.Button(u8("COPY PASAL"), imgui.ImVec2(-1, 23)) then copyToClipboard(cp) end
    if imgui.Button(u8("COPY DENDA"), imgui.ImVec2(-1, 23)) then copyToClipboard(tostring(final_denda)) end

    imgui.PushStyleColor(imgui.Col.Button, imgui.ImVec4(0.1, 0.4, 0.7, 0.9))
    if imgui.Button(u8("MASUKKAN FORMAT KE CHATBAR"), imgui.ImVec2(-1, 23)) then
        if cp ~= "" then
            local str = string.format("Kesalahan Mas/Mam dikenakan Pasal: %s | Denda: $%d | Penjara: %d Bln", cp, final_denda, total_penjara)
            if sampSetChatInputText then
                sampSetChatInputText(str)
                printStringNow("~g~Teks Siap di Chat Input!", 2000)
            end
        end
    end
    imgui.PopStyleColor(1)

    imgui.PushStyleColor(imgui.Col.Button, imgui.ImVec4(0.6, 0.1, 0.1, 0.9))
    if imgui.Button(u8("RESET SEMUA"), imgui.ImVec2(-1, 23)) then
        total_denda, total_penjara, total_impound = 0, 0, 0
        list_kode_pasal = {}
        is_cooperative[0] = false
    end
    imgui.PopStyleColor(1)

    -- Panic Button Bar
    imgui.Spacing()
    imgui.PushStyleColor(imgui.Col.Button, imgui.ImVec4(0.85, 0.05, 0.05, 1.0))
    if imgui.Button(u8("PANIC BUTTON / CODE 0 (DARURAT)"), imgui.ImVec2(-1, 26)) then
        triggerPanicButton()
    end
    imgui.PopStyleColor(1)

    imgui.Columns(1)

    -- POPUP HAK MIRANDA
    if show_miranda_popup[0] then
        imgui.SetNextWindowSize(imgui.ImVec2(520, 360), imgui.Cond.FirstUseEver)
        if imgui.Begin(u8("PEMBACAAN HAK MIRANDA (MIRANDA WARNING)"), show_miranda_popup, imgui.WindowFlags.NoCollapse) then
            imgui.TextColored(imgui.ImVec4(1.0, 0.8, 0.2, 1.0), u8("Pilih Metode Pembacaan Hak Miranda:"))
            imgui.Separator(); imgui.Spacing()

            imgui.TextWrapped(u8("Hak Miranda wajib dibacakan saat tersangka telah diborgol dan sebelum dilakukan proses interogasi."))
            imgui.Spacing()

            imgui.PushStyleColor(imgui.Col.Button, imgui.ImVec4(0.15, 0.5, 0.8, 0.9))
            if imgui.Button(u8("AUTO-BACA MIRANDA (BAHASA INDONESIA)"), imgui.ImVec2(-1, 32)) then
                readMirandaRights("ID")
            end
            imgui.PopStyleColor(1)

            imgui.PushStyleColor(imgui.Col.Button, imgui.ImVec4(0.15, 0.6, 0.4, 0.9))
            if imgui.Button(u8("AUTO-BACA MIRANDA (ENGLISH VERSION)"), imgui.ImVec2(-1, 32)) then
                readMirandaRights("EN")
            end
            imgui.PopStyleColor(1)

            imgui.Spacing(); imgui.Separator(); imgui.Spacing()

            if imgui.Button(u8("Salin Naskah Miranda (ID)"), imgui.ImVec2(-1, 26)) then
                copyToClipboard("Anda memiliki hak untuk tetap diam. Apapun yang Anda katakan dapat dan akan digunakan untuk melawan Anda di pengadilan. Anda berhak didampingi pengacara.")
            end

            imgui.Spacing()
            if imgui.Button(u8("Tutup"), imgui.ImVec2(-1, 26)) then
                show_miranda_popup[0] = false
            end
            imgui.End()
        end
    end

    -- POPUP QUICK ROLEPLAY ACTIONS (/me & /do)
    if show_rp_action_popup[0] then
        imgui.SetNextWindowSize(imgui.ImVec2(540, 420), imgui.Cond.FirstUseEver)
        if imgui.Begin(u8("QUICK ROLEPLAY ACTIONS (/me & /do)"), show_rp_action_popup, imgui.WindowFlags.NoCollapse) then
            imgui.TextColored(imgui.ImVec4(0.2, 0.8, 1.0, 1.0), u8("Klik tombol untuk langsung mengirim pesan Roleplay ke chat:"))
            imgui.Separator(); imgui.Spacing()

            if imgui.Button(u8("RP 1: Memborgol Suspect"), imgui.ImVec2(-1, 28)) then
                sendChatMessage("/me mengambil borgol dari utility belt lalu memborgol kedua pergelangan tangan suspect.")
                sendChatMessage("/do Kedua tangan suspect terkunci dengan borgol. Ada perlawanan? (( Suspect ))")
            end

            if imgui.Button(u8("RP 2: Membuka Borgol"), imgui.ImVec2(-1, 28)) then
                sendChatMessage("/me mengambil kunci borgol dari saku rompi lalu membuka kaitan borgol tersangka.")
            end

            if imgui.Button(u8("RP 3: Geledah Tubuh (Frisk)"), imgui.ImVec2(-1, 28)) then
                sendChatMessage("/me mengenakan sarung tangan latex lalu memeriksa dan meraba seluruh saku celana serta rompi suspect.")
                sendChatMessage("/do Dimana letak barang ilegal atau senjata tersangka disimpan? (( Suspect ))")
            end

            if imgui.Button(u8("RP 4: Tempel Stiker Impound"), imgui.ImVec2(-1, 28)) then
                sendChatMessage("/me menempelkan formulir dan stiker segel impound pada kaca depan kendaraan.")
                sendChatMessage("/me menghubungi mobil derek kepolisian untuk mengangkut kendaraan ke impound lot.")
            end

            if imgui.Button(u8("RP 5: Cabut & Siapkan Tazer"), imgui.ImVec2(-1, 28)) then
                sendChatMessage("/me mencabut Taser X26P dari holster dan mengarahkannya ke arah suspect.")
                sendChatMessage("TIARAP SEKARANG JUGA ATAU SAYA TEMBAKKAN TASER!")
            end

            imgui.Spacing(); imgui.Separator(); imgui.Spacing()
            if imgui.Button(u8("Tutup"), imgui.ImVec2(-1, 26)) then
                show_rp_action_popup[0] = false
            end
            imgui.End()
        end
    end

    -- POPUP STANDAR OPERASIONAL PROSEDUR (SOP)
    if show_sop_hspd_popup[0] then
        imgui.SetNextWindowSize(imgui.ImVec2(480, 320), imgui.Cond.FirstUseEver)
        if imgui.Begin(u8("STANDAR OPERASIONAL PROSEDUR (SOP) HSPD"), show_sop_hspd_popup, imgui.WindowFlags.NoCollapse) then
            imgui.TextColored(imgui.ImVec4(0.2, 0.8, 1.0, 1.0), u8("Pilih SOP untuk dibaca atau dipelajari:"))
            imgui.Spacing(); imgui.Separator(); imgui.Spacing()

            imgui.PushStyleColor(imgui.Col.Button, imgui.ImVec4(0.2, 0.7, 0.3, 0.9))
            if imgui.Button(u8("SOP PERSENJATAAN"), imgui.ImVec2(-1, 30)) then show_sop_persenjataan_popup[0] = true end
            imgui.PopStyleColor(1)

            imgui.PushStyleColor(imgui.Col.Button, imgui.ImVec4(0.9, 0.2, 0.2, 0.9))
            if imgui.Button(u8("SOP PURSUIT (PENGEJARAN)"), imgui.ImVec2(-1, 30)) then show_sop_pursuit_popup[0] = true end
            imgui.PopStyleColor(1)

            imgui.PushStyleColor(imgui.Col.Button, imgui.ImVec4(0.1, 0.6, 0.8, 0.9))
            if imgui.Button(u8("SOP RADIO DAN TEN-CODES"), imgui.ImVec2(-1, 30)) then show_sop_radio_popup[0] = true end
            imgui.PopStyleColor(1)

            imgui.PushStyleColor(imgui.Col.Button, imgui.ImVec4(0.8, 0.5, 0.1, 0.9))
            if imgui.Button(u8("KODE ETIK KEPOLISIAN"), imgui.ImVec2(-1, 30)) then show_kode_etik_popup[0] = true end
            imgui.PopStyleColor(1)

            imgui.Spacing()
            if imgui.Button(u8("Tutup"), imgui.ImVec2(-1, 28)) then show_sop_hspd_popup[0] = false end
            imgui.End()
        end
    end

    -- POPUP MEGAPHONE QUICK-ACTION
    if show_megaphone_popup[0] then
        imgui.SetNextWindowSize(imgui.ImVec2(520, 440), imgui.Cond.FirstUseEver)
        if imgui.Begin(u8("MEGAPHONE POLISI / PATROLI"), show_megaphone_popup, imgui.WindowFlags.NoCollapse) then
            if mega_tab_selected[0] == 0 then imgui.PushStyleColor(imgui.Col.Button, imgui.ImVec4(0.2, 0.5, 0.8, 1.0)) else imgui.PushStyleColor(imgui.Col.Button, imgui.ImVec4(0.15, 0.2, 0.3, 0.8)) end
            if imgui.Button(u8("Patroli / Menepi"), imgui.ImVec2(0, 25)) then mega_tab_selected[0] = 0 end
            imgui.PopStyleColor(1)

            imgui.SameLine()
            if mega_tab_selected[0] == 1 then imgui.PushStyleColor(imgui.Col.Button, imgui.ImVec4(0.2, 0.5, 0.8, 1.0)) else imgui.PushStyleColor(imgui.Col.Button, imgui.ImVec4(0.15, 0.2, 0.3, 0.8)) end
            if imgui.Button(u8("Perampokan Bank"), imgui.ImVec2(0, 25)) then mega_tab_selected[0] = 1 end
            imgui.PopStyleColor(1)

            imgui.SameLine()
            if mega_tab_selected[0] == 2 then imgui.PushStyleColor(imgui.Col.Button, imgui.ImVec4(0.2, 0.5, 0.8, 1.0)) else imgui.PushStyleColor(imgui.Col.Button, imgui.ImVec4(0.15, 0.2, 0.3, 0.8)) end
            if imgui.Button(u8("Negosiasi Sandera"), imgui.ImVec2(0, 25)) then mega_tab_selected[0] = 2 end
            imgui.PopStyleColor(1)

            imgui.Spacing(); imgui.Separator(); imgui.Spacing()

            if mega_tab_selected[0] == 0 then
                imgui.TextColored(imgui.ImVec4(0.9, 0.6, 0.1, 1.0), u8("Pengaturan Kendaraan Target:"))
                imgui.InputText(u8("Model Kendaraan"), mega_veh_name, 32)
                imgui.InputText(u8("Warna Kendaraan"), mega_veh_color, 32)
                
                local v_name = ffi.string(mega_veh_name)
                local v_color = ffi.string(mega_veh_color)

                if imgui.Button(u8("1. Suruh Menepi (Sisi Kiri)"), imgui.ImVec2(-1, 26)) then
                    sendMegaphoneText(string.format("Kepada pengemudi %s berwarna %s, harap segera menepi ke sisi kiri jalan!", v_name, v_color))
                end
                if imgui.Button(u8("2. PERINGATAN 1 (Matikan Mesin)"), imgui.ImVec2(-1, 26)) then
                    sendMegaphoneText(string.format("[PERINGATAN 1] Pengemudi %s %s, segera matikan mesin kendaraan anda dan tetap berada di dalam!", v_name, v_color))
                end
                if imgui.Button(u8("3. PERINGATAN 2 (Tindakan Tegas)"), imgui.ImVec2(-1, 26)) then
                    sendMegaphoneText(string.format("[PERINGATAN 2] Kendaraan %s %s, menepi sekarang juga atau kami akan melakukan tindakan tegas!", v_name, v_color))
                end
                imgui.PushStyleColor(imgui.Col.Button, imgui.ImVec4(0.8, 0.1, 0.1, 0.9))
                if imgui.Button(u8("4. PERINGATAN TERAKHIR (Tembakan)"), imgui.ImVec2(-1, 26)) then
                    sendMegaphoneText(string.format("[PERINGATAN TERAKHIR] Pengemudi %s %s, ini peringatan terakhir! Menepi atau kami akan membuka tembakan!", v_name, v_color))
                end
                imgui.PopStyleColor(1)

            elseif mega_tab_selected[0] == 1 then
                imgui.TextColored(imgui.ImVec4(0.9, 0.6, 0.1, 1.0), u8("Pengaturan Lokasi Robbery:"))
                imgui.InputText(u8("Nama Lokasi/Bank"), mega_bank_name, 32)
                local b_name = ffi.string(mega_bank_name)

                if imgui.Button(u8("1. Sterilisasi Area (Warga Sipil)"), imgui.ImVec2(-1, 26)) then
                    sendMegaphoneText(string.format("Diberitahukan kepada seluruh warga di sekitar %s, harap segera menjauh dan meninggalkan area demi keselamatan!", b_name))
                end
                if imgui.Button(u8("2. Pengepungan / Peringatan Keluar"), imgui.ImVec2(-1, 26)) then
                    sendMegaphoneText(string.format("[PERINGATAN KEPOLISIAN] Seluruh perampok di dalam %s, area ini sudah dikepung! Angkat tangan dan keluar satu per satu!", b_name))
                end
                if imgui.Button(u8("3. Larangan Menembak / Pertumpahan Darah"), imgui.ImVec2(-1, 26)) then
                    sendMegaphoneText("Kepada perampok di dalam, letakkan senjata anda! Jangan melakukan tindakan bodoh yang membahayakan nyawa anda!")
                end
                imgui.PushStyleColor(imgui.Col.Button, imgui.ImVec4(0.8, 0.1, 0.1, 0.9))
                if imgui.Button(u8("4. Peringatan Penggerebekan Paksa"), imgui.ImVec2(-1, 26)) then
                    sendMegaphoneText(string.format("[PERINGATAN TERAKHIR] Kami berikan waktu 30 detik untuk menyerahkan diri atau kami akan melakukan penyerbuan paksa ke %s!", b_name))
                end
                imgui.PopStyleColor(1)

            elseif mega_tab_selected[0] == 2 then
                imgui.TextColored(imgui.ImVec4(0.2, 0.8, 1.0, 1.0), u8("Prosedur Khusus Kasus Sandera:"))
                if imgui.Button(u8("1. Inisiasi Negosiasi Sandera"), imgui.ImVec2(-1, 26)) then
                    sendMegaphoneText("Kami dari Kepolisian ingin berbicara dengan pimpinan di dalam! Tunjukkan bahwa sandera dalam keadaan selamat!")
                end
                if imgui.Button(u8("2. Permintaan Barter / Tuntutan"), imgui.ImVec2(-1, 26)) then
                    sendMegaphoneText("Kami siap mendengarkan tuntutan anda, pastikan tidak ada cedera pada sandera!")
                end
                if imgui.Button(u8("3. Larangan Menyakiti Sandera"), imgui.ImVec2(-1, 26)) then
                    sendMegaphoneText("[PERINGATAN] Jangan menyakiti sandera! Jika sandera terluka, kami tidak akan melakukan negosiasi lagi!")
                end
                imgui.PushStyleColor(imgui.Col.Button, imgui.ImVec4(0.8, 0.1, 0.1, 0.9))
                if imgui.Button(u8("4. Peringatan Pelepasan Sandera"), imgui.ImVec2(-1, 26)) then
                    sendMegaphoneText("Bebaskan sandera terlebih dahulu sebelum anda meninggalkan area lokasi!")
                end
                imgui.PopStyleColor(1)
            end

            imgui.Spacing(); imgui.Separator(); imgui.Spacing()
            if imgui.Button(u8("Tutup"), imgui.ImVec2(-1, 25)) then show_megaphone_popup[0] = false end
            imgui.End()
        end
    end

    -- POPUP PERINTAH CEPAT HSPD
    if show_HSPD_cmd_popup[0] then
        imgui.SetNextWindowSize(imgui.ImVec2(500, 420), imgui.Cond.FirstUseEver)
        if imgui.Begin(u8("HSPD - PERINTAH KEPOLISIAN"), show_HSPD_cmd_popup, imgui.WindowFlags.NoCollapse) then
            imgui.TextColored(imgui.ImVec4(0.2, 0.8, 1.0, 1.0), u8("Klik tombol untuk langsung menjalankan perintah:"))
            imgui.Spacing(); imgui.Separator(); imgui.Spacing()

            imgui.Columns(2, "cmd_grid", true)
            for i, item in ipairs(HSPD_COMMANDS) do
                imgui.PushStyleColor(imgui.Col.Button, imgui.ImVec4(0.12, 0.28, 0.48, 0.9))
                local btn_text = string.format("%s (%s)", item.name, item.cmd)
                if imgui.Button(u8(btn_text), imgui.ImVec2(-1, 28)) then
                    executeCommand(item.cmd)
                end
                imgui.PopStyleColor(1)
                imgui.NextColumn()
            end
            imgui.Columns(1)

            imgui.Spacing(); imgui.Separator(); imgui.Spacing()
            if imgui.Button(u8("Tutup"), imgui.ImVec2(-1, 26)) then show_HSPD_cmd_popup[0] = false end
            imgui.End()
        end
    end

    -- POPUP REGULASI & BIAYA LAYANAN
    if show_regulasi_popup[0] then
        imgui.SetNextWindowSize(imgui.ImVec2(450, 420), imgui.Cond.FirstUseEver)
        if imgui.Begin(u8("BIAYA LAYANAN ADMINISTRASI KEPOLISIAN"), show_regulasi_popup, imgui.WindowFlags.NoCollapse) then
            imgui.TextColored(imgui.ImVec4(0.2, 0.8, 1.0, 1.0), u8("Surat Keterangan Catatan Kepolisian (SKCK)"))
            imgui.Text(u8("  - SKCK: $10,000 (Masa berlaku 7 hari)"))
            imgui.Text(u8("  - Pemutihan SKCK: $25,000 (Masa berlaku 7 hari)"))
            
            imgui.Spacing(); imgui.Separator(); imgui.Spacing()
            
            imgui.TextColored(imgui.ImVec4(0.2, 0.8, 1.0, 1.0), u8("Pengambilan IMPOUND Kendaraan"))
            imgui.Text(u8("  Biaya Administrasi:"))
            imgui.Text(u8("  - Roda 4 : $5,000"))
            imgui.Text(u8("  - Roda 2 : $3,500"))
            
            imgui.Spacing(); imgui.Separator(); imgui.Spacing()
            
            imgui.TextColored(imgui.ImVec4(0.2, 0.8, 1.0, 1.0), u8("Surat Izin Keramaian"))
            imgui.Text(u8("  - Harga: $25,000 (Masa berlaku 3 hari)"))
            
            imgui.Spacing(); imgui.Separator(); imgui.Spacing()
            
            imgui.TextColored(imgui.ImVec4(1.0, 0.3, 0.3, 1.0), u8("CATATAN / NOTE:"))
            imgui.TextWrapped(u8("(-) Harga bisa berubah mengikuti perekonomian kota."))
            imgui.TextWrapped(u8("(-) Semua pembayaran wajib melalui invoice resmi kepolisian."))
            
            imgui.Spacing(); imgui.Spacing()
            if imgui.Button(u8("Tutup"), imgui.ImVec2(-1, 28)) then show_regulasi_popup[0] = false end
            imgui.End()
        end
    end

    -- POPUP SOP PERSENJATAAN
    if show_sop_persenjataan_popup[0] then
        imgui.SetNextWindowSize(imgui.ImVec2(520, 380), imgui.Cond.FirstUseEver)
        if imgui.Begin(u8("SOP PERSENJATAAN KEPOLISIAN"), show_sop_persenjataan_popup, imgui.WindowFlags.NoCollapse) then
            imgui.TextColored(imgui.ImVec4(0.2, 0.8, 1.0, 1.0), u8("Ketentuan Senjata Standar Berdasarkan Divisi:"))
            imgui.Separator(); imgui.Spacing()
            imgui.TextColored(imgui.ImVec4(0.9, 0.7, 0.2, 1.0), u8("[PATROL]: Silenced/Tazer, Deagle, Shotgun (Max 2 Senjata)"))
            imgui.TextColored(imgui.ImVec4(0.9, 0.7, 0.2, 1.0), u8("[TRAFFIC]: Silenced/Tazer, Deagle, MP5 (Max 2 Senjata)"))
            imgui.TextColored(imgui.ImVec4(0.9, 0.7, 0.2, 1.0), u8("[DETECTIVE]: Silenced/Tazer, Deagle Concealed (Max 2 Senjata)"))
            imgui.TextColored(imgui.ImVec4(0.9, 0.7, 0.2, 1.0), u8("[SWAT / TACTICAL]: Silenced/Tazer, M4, Shotgun, Sniper (Izin Khusus)"))
            imgui.Spacing(); imgui.Separator(); imgui.Spacing()
            imgui.Text(u8("ON-DUTY: Maksimal 20 clip amunisi cadangan."))
            imgui.Text(u8("OFF-DUTY: Hanya bawa 1 senjata dinas (Colt/Deagle) + 5 clip cadangan."))
            imgui.Spacing()
            if imgui.Button(u8("Tutup"), imgui.ImVec2(-1, 26)) then show_sop_persenjataan_popup[0] = false end
            imgui.End()
        end
    end

    -- POPUP SOP PURSUIT & VCB
    if show_sop_pursuit_popup[0] then
        imgui.SetNextWindowSize(imgui.ImVec2(520, 360), imgui.Cond.FirstUseEver)
        if imgui.Begin(u8("SOP PURSUIT & VCB (10-57 VICTOR)"), show_sop_pursuit_popup, imgui.WindowFlags.NoCollapse) then
            imgui.TextColored(imgui.ImVec4(1.0, 0.4, 0.4, 1.0), u8("Prosedur Pengejaran & Eskalasi Tindakan:"))
            imgui.Separator(); imgui.Spacing()
            imgui.Text(u8("1. Megaphone Stage: Peringatan 1 (Menit 0-5), Peringatan 2 (Menit 5-10), Peringatan 3 (Menit 10)."))
            imgui.Text(u8("2. Drive-By & PIT: Diizinkan HANYA setelah Peringatan ke-3. Tembakan HANYA ke ban mobil!"))
            imgui.Text(u8("3. Visual Broken (VCB): Waktu pencarian 10-15 menit. Jika ditemukan kembali, 2 menit pertama polisi berhak langsung tembak ban."))
            imgui.Spacing(); imgui.Separator(); imgui.Spacing()
            if imgui.Button(u8("Tutup"), imgui.ImVec2(-1, 26)) then show_sop_pursuit_popup[0] = false end
            imgui.End()
        end
    end

    -- POPUP SOP RADIO & FREKUENSI
    if show_sop_radio_popup[0] then
        imgui.SetNextWindowSize(imgui.ImVec2(500, 360), imgui.Cond.FirstUseEver)
        if imgui.Begin(u8("SOP RADIO & FREKUENSI OPERASI"), show_sop_radio_popup, imgui.WindowFlags.NoCollapse) then
            imgui.TextColored(imgui.ImVec4(0.2, 0.8, 1.0, 1.0), u8("Daftar Frekuensi Radio Khusus:"))
            imgui.Separator(); imgui.Spacing()
            imgui.Text(u8("  - 911.1 MHz : Radio Patroli Reguler"))
            imgui.Text(u8("  - 911.2 MHz : Radio Khusus Traffic Division"))
            imgui.Text(u8("  - 911.3 MHz : Tactical Ops / Penyerbuan"))
            imgui.Text(u8("  - 911.4 MHz : SWAT / High Risk Raid"))
            imgui.Spacing(); imgui.Separator(); imgui.Spacing()
            imgui.TextWrapped(u8("Dilarang keras trolling, spam, atau berbicara hal OOC di frekuensi radio IC."))
            imgui.Spacing()
            if imgui.Button(u8("Tutup"), imgui.ImVec2(-1, 26)) then show_sop_radio_popup[0] = false end
            imgui.End()
        end
    end

    -- POPUP KODE ETIK
    if show_kode_etik_popup[0] then
        imgui.SetNextWindowSize(imgui.ImVec2(500, 340), imgui.Cond.FirstUseEver)
        if imgui.Begin(u8("KODE ETIK & INTEGRITAS KEPOLISIAN"), show_kode_etik_popup, imgui.WindowFlags.NoCollapse) then
            imgui.TextColored(imgui.ImVec4(0.9, 0.7, 0.2, 1.0), u8("Prinsip Utama Aparat Penegak Hukum:"))
            imgui.Separator(); imgui.Spacing()
            imgui.Text(u8("1. Integritas: Tidak menyalahgunakan wewenang dan senjata dinas."))
            imgui.Text(u8("2. Netralitas: Tidak memihak dalam konflik antar faksi/kelompok."))
            imgui.Text(u8("3. Kesopanan: Tetap profesional dan tidak arogan saat razia warga."))
            imgui.Text(u8("4. Kerahasiaan: Menjaga kerahasiaan taktis penyerbuan dari radio umum."))
            imgui.Spacing(); imgui.Separator(); imgui.Spacing()
            if imgui.Button(u8("Tutup"), imgui.ImVec2(-1, 26)) then show_kode_etik_popup[0] = false end
            imgui.End()
        end
    end

    imgui.End()
    imgui.PopStyleColor(4)
end)

-- ==============================================================================
-- MAIN SCRIPT LOOP & HOTKEY REGISTER
-- ==============================================================================
function main()
    while not isSampAvailable() do wait(100) end

    -- Command Chat
    sampRegisterChatCommand("pasal", function() 
        window_state[0] = not window_state[0] 
    end)

    sampRegisterChatCommand("miranda", function()
        show_miranda_popup[0] = not show_miranda_popup[0]
    end)

    sampRegisterChatCommand("panic", function()
        triggerPanicButton()
    end)

    sampRegisterChatCommand("mego", function()
        show_megaphone_popup[0] = not show_megaphone_popup[0]
    end)

    sampRegisterChatCommand("hspd", function()
        show_HSPD_cmd_popup[0] = not show_HSPD_cmd_popup[0]
    end)

    sampAddChatMessage("{0088FF}[HSPD-Assistant]{FFFFFF} Script v2.5 Enhanced loaded! Tekan {FFFF00}F3{FFFFFF} atau ketik {FFFF00}/pasal", -1)
    printStringNow("~b~HSPD Assistant v2.5 ~w~Loaded! Tekan ~y~F3 ~w~atau ketik ~y~/pasal", 4000)

    while true do
        wait(0)
        -- Hotkey F3 untuk Buka/Tutup Menu Cepat tanpa mengetik
        if wasKeyPressed(vkeys.VK_F3) and not sampIsChatInputActive() and not sampIsDialogActive() then
            window_state[0] = not window_state[0]
        end

        imgui.Process = window_state[0]
    end
end
`;
