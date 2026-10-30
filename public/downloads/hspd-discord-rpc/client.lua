local QBCore = nil
local ESX = nil
local isCop = false
local onDuty = false
local officerName = nil
local officerBadge = nil
local playerJobName = "unemployed"
local playerJobGrade = "Citizen"

-- Inisialisasi Framework otomatis jika diaktifkan
CreateThread(function()
    if Config.UseFrameworkDuty then
        if Config.Framework == 'qbcore' or Config.Framework == 'auto' then
            pcall(function()
                QBCore = exports['qb-core']:GetCoreObject()
            end)
        end

        if not QBCore and (Config.Framework == 'esx' or Config.Framework == 'auto') then
            pcall(function()
                ESX = exports['es_extended']:getSharedObject()
            end)
        end
    end
end)

-- Event listener QBCore job update
RegisterNetEvent('QBCore:Client:OnPlayerLoaded', function()
    if QBCore then
        local PlayerData = QBCore.Functions.GetPlayerData()
        if PlayerData and PlayerData.job then
            playerJobName = PlayerData.job.name
            playerJobGrade = PlayerData.job.grade and PlayerData.job.grade.name or "Officer"
            onDuty = PlayerData.job.onduty or false
            isCop = (playerJobName == 'police' or playerJobName == 'hspd')
            if PlayerData.charinfo then
                officerName = PlayerData.charinfo.firstname .. ' ' .. PlayerData.charinfo.lastname
            end
            if PlayerData.metadata and PlayerData.metadata.callsign then
                officerBadge = '#' .. tostring(PlayerData.metadata.callsign)
            end
        end
    end
end)

RegisterNetEvent('QBCore:Client:OnJobUpdate', function(JobInfo)
    if JobInfo then
        playerJobName = JobInfo.name
        playerJobGrade = JobInfo.grade and JobInfo.grade.name or "Officer"
        onDuty = JobInfo.onduty or false
        isCop = (playerJobName == 'police' or playerJobName == 'hspd')
    end
end)

RegisterNetEvent('QBCore:Client:SetDuty', function(duty)
    onDuty = duty
end)

-- Event listener ESX job update
RegisterNetEvent('esx:playerLoaded', function(xPlayer)
    if xPlayer and xPlayer.job then
        playerJobName = xPlayer.job.name
        playerJobGrade = xPlayer.job.grade_label or "Officer"
        isCop = (playerJobName == 'police' or playerJobName == 'hspd')
        onDuty = isCop
    end
end)

RegisterNetEvent('esx:setJob', function(job)
    if job then
        playerJobName = job.name
        playerJobGrade = job.grade_label or "Officer"
        isCop = (playerJobName == 'police' or playerJobName == 'hspd')
        onDuty = isCop
    end
end)

-- Command manual /duty atau event untuk toggle on/off duty polisi
RegisterCommand('dutyrpc', function(source, args)
    onDuty = not onDuty
    local status = onDuty and "10-8 ON DUTY" or "10-7 OFF DUTY"
    TriggerEvent('chat:addMessage', {
        color = { 20, 184, 166 },
        multiline = true,
        args = { "HSPD RPC", "Status aktivitas Discord diperbarui ke: " .. status }
    })
end, false)

-- Loop Utama Discord Rich Presence
CreateThread(function()
    -- Set Application ID
    SetDiscordAppId(Config.DiscordAppId)

    -- Set Aset Gambar Utama & Kecil
    SetDiscordRichPresenceAsset(Config.LargeAsset)
    SetDiscordRichPresenceAssetText(Config.LargeAssetText)
    SetDiscordRichPresenceAssetSmall(Config.SmallAsset)
    SetDiscordRichPresenceAssetSmallText(Config.SmallAssetText)

    -- Daftarkan Tombol Interaktif Discord (Maksimal 2)
    if Config.Buttons and #Config.Buttons > 0 then
        for _, btn in ipairs(Config.Buttons) do
            if btn.label and btn.url and btn.url ~= '' then
                SetDiscordRichPresenceAction(btn.index, btn.label, btn.url)
            end
        end
    end

    while true do
        local detailsText = Config.DefaultDetails
        local stateText = Config.DefaultState

        -- Ambil total pemain di server
        local playersCount = #GetActivePlayers()
        local maxPlayers = 128 -- Sesuaikan batas slot server Anda (misal 64, 128, 2048)

        -- Jika pemain adalah polisi
        if isCop then
            local badgeStr = officerBadge or "#001"
            local nameStr = officerName or GetPlayerName(PlayerId())
            
            if onDuty then
                detailsText = string.format("HSPD • %s (%s)", nameStr, badgeStr)
                stateText = string.format("🟢 10-8 ON DUTY | %s [👥 %d/%d]", playerJobGrade, playersCount, maxPlayers)
            else
                detailsText = string.format("HSPD • %s (%s)", nameStr, badgeStr)
                stateText = string.format("🔴 10-7 OFF DUTY | Sedang Istirahat [👥 %d/%d]", playersCount, maxPlayers)
            end
        else
            -- Status warga biasa jika bukan polisi
            detailsText = string.format("Warga: %s", GetPlayerName(PlayerId()))
            stateText = string.format("Menjelajah Kota [👥 %d/%d Pemain]", playersCount, maxPlayers)
        end

        -- Terapkan teks status ke Discord
        SetRichPresence(string.format("%s - %s", detailsText, stateText))

        Wait(Config.UpdateInterval or 15000)
    end
end)
