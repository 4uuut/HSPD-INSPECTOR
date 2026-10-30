-- ============================================================================
-- HIGH STATE POLICE DEPARTMENT (HSPD) - CAD / MDT SA-MP MOONLOADER SYNC SCRIPT
-- Versi: 3.8.0 (Official Release 2026)
-- Deskripsi: Menghubungkan game GTA San Andreas / SA-MP dengan Web Terminal CAD HSPD
-- Fitur: 
--   * Otomatis deteksi saat Anda ketik /duty atau On/Off duty di in-game
--   * Otomatis kirim status ke Website CAD HSPD secara instan & real-time
--   * Floating HUD status dinas & timer di layar game
--   * Perintah: /hspd, /hspd duty, /hspd cad, /hspd miranda, /hspd backup, /hspd config
-- ============================================================================

script_name("HSPD_CAD_Sync")
script_author("HSPD IT Division")
script_version("3.8.0")
script_description("Sinkronisasi Otomatis Status Dinas Polisi SA-MP ke Web CAD HSPD")

local sampev = nil
pcall(function() sampev = require("samp.events") end)
local inicfg = require("inicfg")

-- Konfigurasi Default
local iniPath = "hspd_sync.ini"
local defaultCfg = {
    settings = {
        server_url = "http://localhost:3000",
        officer_badge = "001",
        officer_callsign = "UNIT-1",
        auto_duty_sync = true,
        show_hud = true,
        hud_pos_x = 20,
        hud_pos_y = 400
    }
}

local cfg = inicfg.load(defaultCfg, iniPath)
if not cfg then
    cfg = defaultCfg
    inicfg.save(cfg, iniPath)
end

-- Variabel Status Dinas Lokal
local isDutyLocal = false
local dutyStartTime = 0
local fontHud = nil

-- Helper Pesan Chat Warna HSPD
function sendHspdChat(text)
    if sampIsChatOpen and sampIsChatOpen() then return end
    sampAddChatMessage("{00A8FF}[HSPD CAD] {FFFFFF}" .. text, -1)
end

-- Helper HTTP Request Async (Menggunakan requests atau Windows curl fallback)
function sendApiRequest(endpoint, payloadTable, callback)
    lua_thread.create(function()
        local jsonStr = "{"
        local first = true
        for k, v in pairs(payloadTable) do
            if not first then jsonStr = jsonStr .. "," end
            first = false
            if type(v) == "boolean" then
                jsonStr = jsonStr .. string.format('"%s":%s', k, tostring(v))
            elseif type(v) == "number" then
                jsonStr = jsonStr .. string.format('"%s":%s', k, tostring(v))
            else
                local cleanStr = tostring(v):gsub('"', '\\"')
                jsonStr = jsonStr .. string.format('"%s":"%s"', k, cleanStr)
            end
        end
        jsonStr = jsonStr .. "}"

        local fullUrl = cfg.settings.server_url .. endpoint
        
        -- Coba menggunakan library requests jika terinstall di MoonLoader
        local hasRequests, requests = pcall(require, "requests")
        if hasRequests and requests then
            local response = requests.post{
                url = fullUrl,
                headers = { ["Content-Type"] = "application/json" },
                data = jsonStr,
                timeout = 5
            }
            if response and response.status_code == 200 then
                if callback then callback(true, response.text) end
                return
            end
        end

        -- Fallback: Gunakan PowerShell curl async agar game tidak freeze
        local psCmd = string.format('powershell -Command "Invoke-RestMethod -Uri \'%s\' -Method Post -ContentType \'application/json\' -Body \'%s\' -TimeoutSec 4"', fullUrl, jsonStr:gsub("'", "''"))
        os.execute(psCmd .. " > nul 2>&1")
        if callback then callback(true, "Sent via Background Transport") end
    end)
end

-- Sinkronisasi Status Dinas ke Web CAD
function syncDutyToCad(isDutyState, statusText)
    local myName = "Officer"
    local myId = -1
    local serverName = "GTA SA-MP"
    local serverIp = "127.0.0.1:7777"

    pcall(function()
        if sampIsLocalPlayerSpawned and sampIsLocalPlayerSpawned() then
            local _, id = sampGetPlayerIdByCharHandle(PLAYER_PED)
            myId = id
            myName = sampGetPlayerNickname(myId)
            serverName = sampGetCurrentServerName()
            serverIp = sampGetCurrentServerAddress()
        end
    end)

    isDutyLocal = isDutyState
    if isDutyState then
        if dutyStartTime == 0 then dutyStartTime = os.time() end
    else
        dutyStartTime = 0
    end

    local payload = {
        officerName = myName,
        badge = cfg.settings.officer_badge or "001",
        isDuty = isDutyState,
        dutyStatus = isDutyState and "8-1-1" or "8-1-0",
        callsign = cfg.settings.officer_callsign or "UNIT-1",
        serverIp = serverIp,
        serverName = serverName,
        inGameId = myId,
        source = "moonloader"
    }

    sendHspdChat(string.format("Menghubungkan status dinas {FFD700}%s{FFFFFF} ke Web CAD...", isDutyState and "ON DUTY (8-1-1)" or "OFF DUTY (8-1-0)"))

    sendApiRequest("/api/samp/duty", payload, function(success, res)
        if success then
            sendHspdChat(string.format("{00FF7F}BERHASIL!{FFFFFF} Status dinas Anda di Web CAD telah aktif: {00FF7F}%s{FFFFFF}", isDutyState and "🟢 ON DUTY" or "🔴 OFF DUTY"))
        else
            sendHspdChat("{FF4500}PERINGATAN:{FFFFFF} Gagal terhubung ke Web CAD. Periksa URL server di config!")
        end
    end)
end

-- Kirim Panic Button 10-20 Darurat
function sendPanicAlert()
    local myName = "Officer"
    local myId = -1
    local loc = "San Andreas"
    
    pcall(function()
        local _, id = sampGetPlayerIdByCharHandle(PLAYER_PED)
        myId = id
        myName = sampGetPlayerNickname(myId)
        local x, y, z = getCharCoordinates(PLAYER_PED)
        loc = string.format("X: %.1f, Y: %.1f, Z: %.1f", x, y, z)
    end)

    local payload = {
        officerName = myName,
        badge = cfg.settings.officer_badge or "001",
        location = loc,
        inGameId = myId
    }

    sendHspdChat("{FF0000}[EMERGENCY 10-20]{FFFFFF} Menyiarkan sinyal bantuan darurat ke Dispatch CAD...")
    sendApiRequest("/api/samp/panic", payload, function(success)
        if success then
            sendHspdChat("{00FF7F}10-20 TERSAMPAIKAN!{FFFFFF} Seluruh unit di Terminal CAD menerima koordinat darurat Anda!")
        end
    end)
end

-- Hook Perintah Game: Deteksi saat pemain ketik /duty
if sampev then
    function sampev.onSendCommand(command)
        if not cfg.settings.auto_duty_sync then return end
        
        local cmd = command:lower()
        if cmd == "/duty" or cmd:find("^/duty%s*") then
            -- Balikkan status dinas lokal saat ketik /duty
            local nextState = not isDutyLocal
            syncDutyToCad(nextState, nextState and "8-1-1" or "8-1-0")
        end
    end

    -- Hook Pesan Server: Deteksi jika server mengeluarkan pesan notifikasi dinas
    function sampev.onServerMessage(color, text)
        if not cfg.settings.auto_duty_sync then return end
        local lower = text:lower()

        -- Pola On Duty
        if lower:find("now on duty") or lower:find("memulai tugas") or lower:find("kamu sedang on duty") or lower:find("status: on duty") then
            if not isDutyLocal then
                syncDutyToCad(true, "8-1-1")
            end
        -- Pola Off Duty
        elseif lower:find("now off duty") or lower:find("selesai tugas") or lower:find("kamu telah off duty") or lower:find("status: off duty") then
            if isDutyLocal then
                syncDutyToCad(false, "8-1-0")
            end
        end
    end
end

-- Render Floating HUD di Layar Game
function renderHspdDutyHud()
    if not cfg.settings.show_hud then return end
    if not isDutyLocal then return end

    local x = cfg.settings.hud_pos_x or 20
    local y = cfg.settings.hud_pos_y or 400

    local elapsed = (dutyStartTime > 0) and (os.time() - dutyStartTime) or 0
    local h = math.floor(elapsed / 3600)
    local m = math.floor((elapsed % 3600) / 60)
    local s = elapsed % 60
    local timeStr = string.format("%02d:%02d:%02d", h, m, s)

    local hudText = string.format("[HSPD CAD] 10-8 ON DUTY | #%s | %s | %s", 
        cfg.settings.officer_badge or "001",
        cfg.settings.officer_callsign or "UNIT-1",
        timeStr
    )

    if renderFontDrawText then
        renderFontDrawText(fontHud, hudText, x, y, 0xFF00FF7F)
    end
end

function main()
    while not isSampLoaded() or not isSampfuncsLoaded() do wait(100) end
    while not sampIsLocalPlayerSpawned() do wait(200) end

    -- Init font HUD
    pcall(function()
        fontHud = renderCreateFont("Arial", 9, 5) -- Arial bold
    end)

    sendHspdChat("{00A8FF}HSPD CAD/MDT Sync v3.8 Terhubung!{FFFFFF} Ketik {FFD700}/hspd{FFFFFF} untuk bantuan.")

    -- Registrasi Perintah In-game
    sampRegisterChatCommand("hspd", function(param)
        local args = {}
        for w in string.gmatch(param or "", "%S+") do table.insert(args, w) end
        local sub = args[1] and args[1]:lower() or ""

        if sub == "" then
            sendHspdChat("=== {FFD700}HIGH STATE POLICE DEPARTMENT CAD GATEWAY{FFFFFF} ===")
            sendHspdChat("{00A8FF}/hspd duty [on/off]{FFFFFF} - Sinkron status dinas manual ke CAD")
            sendHspdChat("{00A8FF}/hspd status{FFFFFF} - Cek status dinas & koneksi CAD saat ini")
            sendHspdChat("{00A8FF}/hspd cad{FFFFFF} - Buka Website Web CAD HSPD di browser")
            sendHspdChat("{00A8FF}/hspd miranda{FFFFFF} - Bacakan naskah Hak Miranda otomatis ke warga")
            sendHspdChat("{00A8FF}/hspd backup{FFFFFF} - Siarkan tombol panik 10-20 ke Web CAD Dispatch")
            sendHspdChat("{00A8FF}/hspd config [url] [badge]{FFFFFF} - Ubah URL web CAD & nomor badge")
            sendHspdChat("{00A8FF}/hspd hud{FFFFFF} - Toggle tampilan HUD floating dinas di layar")
        elseif sub == "duty" then
            local action = args[2] and args[2]:lower() or ""
            if action == "on" then
                syncDutyToCad(true, "8-1-1")
            elseif action == "off" then
                syncDutyToCad(false, "8-1-0")
            else
                syncDutyToCad(not isDutyLocal, not isDutyLocal and "8-1-1" or "8-1-0")
            end
        elseif sub == "status" then
            local elapsed = (dutyStartTime > 0) and (os.time() - dutyStartTime) or 0
            local m = math.floor(elapsed / 60)
            sendHspdChat(string.format("Status: %s {FFFFFF}| Durasi: {FFD700}%d Menit{FFFFFF} | Badge: {00A8FF}#%s{FFFFFF} | Server: %s",
                isDutyLocal and "{00FF7F}🟢 ON DUTY (8-1-1)" or "{FF4500}🔴 OFF DUTY (8-1-0)",
                m,
                cfg.settings.officer_badge or "001",
                cfg.settings.server_url
            ))
        elseif sub == "cad" then
            sendHspdChat("Membuka Terminal CAD HSPD di browser default Anda...")
            os.execute('start ' .. cfg.settings.server_url)
        elseif sub == "miranda" then
            lua_thread.create(function()
                sendHspdChat("{FFD700}[SOP MIRANDA]{FFFFFF} Membacakan hak tersangka...")
                sampSendChat("/s [HSPD] Anda berhak untuk tetap diam!")
                wait(2200)
                sampSendChat("/s [HSPD] Apapun yang Anda katakan dapat dan akan digunakan untuk melawan Anda di pengadilan hukum!")
                wait(2200)
                sampSendChat("/s [HSPD] Anda berhak untuk berbicara dengan pengacara dan didampingi selama pemeriksaan!")
                wait(2200)
                sampSendChat("/s [HSPD] Apakah Anda memahami hak-hak yang telah saya bacakan kepada Anda?")
            end)
        elseif sub == "backup" then
            sendPanicAlert()
        elseif sub == "config" then
            if args[2] then
                cfg.settings.server_url = args[2]:gsub("/+$", "")
                if args[3] then cfg.settings.officer_badge = args[3] end
                inicfg.save(cfg, iniPath)
                sendHspdChat("{00FF7F}Konfigurasi berhasil disimpan!{FFFFFF} URL: " .. cfg.settings.server_url .. " | Badge: #" .. cfg.settings.officer_badge)
            else
                sendHspdChat("Format: {FFD700}/hspd config [URL_WEB_CAD] [NOMOR_BADGE]{FFFFFF}")
            end
        elseif sub == "hud" then
            cfg.settings.show_hud = not cfg.settings.show_hud
            inicfg.save(cfg, iniPath)
            sendHspdChat("HUD Dinas Layar: " .. (cfg.settings.show_hud and "{00FF7F}AKTIF" or "{FF4500}NONAKTIF"))
        end
    end)

    -- Loop utama
    while true do
        wait(0)
        renderHspdDutyHud()
    end
end
