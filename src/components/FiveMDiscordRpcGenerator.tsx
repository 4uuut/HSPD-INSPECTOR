import React, { useState } from 'react';
import { 
  Gamepad2, Copy, Check, Download, ExternalLink, Shield, Code, 
  Sparkles, Users, Clock, FileCode, CheckCircle2, ChevronRight, HelpCircle
} from 'lucide-react';

export const FiveMDiscordRpcGenerator: React.FC = () => {
  const [appId, setAppId] = useState('123456789012345678');
  const [appName, setAppName] = useState('State of HighState Police Department');
  const [officerName, setOfficerName] = useState('Jackie Xianlao');
  const [officerBadge, setOfficerBadge] = useState('#001');
  const [officerRank, setOfficerRank] = useState('Cadet [CDT]');
  const [dutyStatus, setDutyStatus] = useState<'10-8' | '10-7'>('10-8');
  const [mdtUrl, setMdtUrl] = useState('https://mdt-hspd-inspector.vercel.app');
  const [fivemJoinUrl, setFivemJoinUrl] = useState('https://cfx.re/join/xxxxxx');
  const [onlinePlayers, setOnlinePlayers] = useState('160');
  const [maxPlayers, setMaxPlayers] = useState('1311');
  
  const [selectedFileTab, setSelectedFileTab] = useState<'config' | 'client' | 'fxmanifest' | 'readme'>('config');
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  const fxmanifestContent = `fx_version 'cerulean'
game 'gta5'

author 'State of HighState Police Department - Cad/MDT Engineering'
description 'HSPD Discord Rich Presence (RPC) for FiveM - Live Current Activity'
version '1.0.0'

shared_scripts {
    'config.lua'
}

client_scripts {
    'client.lua'
}
`;

  const configContent = `Config = {}

-- Masukkan Application ID dari Discord Developer Portal
Config.DiscordAppId = '${appId}'

-- Pengaturan Aset Gambar (Discord Developer Portal -> Rich Presence -> Art Assets)
Config.LargeAsset = 'hspd_logo_large'
Config.LargeAssetText = '${appName}'
Config.SmallAsset = 'police_badge'
Config.SmallAssetText = 'HSPD Law Enforcement MDT v4.3.0'

-- Teks Default Status
Config.DefaultDetails = '${appName}'
Config.DefaultState = 'Warga Kota / Standby'

-- Tombol Interaktif di Profil Discord (Maksimal 2 tombol)
Config.Buttons = {
    {
        index = 0,
        label = '🚔 Buka CAD/MDT Polisi',
        url = '${mdtUrl}'
    },
    {
        index = 1,
        label = '🎮 Join Server FiveM',
        url = '${fivemJoinUrl}'
    }
}

-- Interval pembaruan status (milidetik)
Config.UpdateInterval = 15000

-- Integrasi Framework (ESX / QBCore / Standalone)
Config.UseFrameworkDuty = true
Config.Framework = 'auto'
`;

  const clientContent = `local QBCore = nil
local ESX = nil
local isCop = false
local onDuty = false
local officerName = nil
local officerBadge = nil
local playerJobName = "unemployed"
local playerJobGrade = "Citizen"

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

RegisterCommand('dutyrpc', function(source, args)
    onDuty = not onDuty
    local status = onDuty and "10-8 ON DUTY" or "10-7 OFF DUTY"
    TriggerEvent('chat:addMessage', {
        color = { 20, 184, 166 },
        multiline = true,
        args = { "HSPD RPC", "Status aktivitas Discord diperbarui ke: " .. status }
    })
end, false)

CreateThread(function()
    SetDiscordAppId(Config.DiscordAppId)
    SetDiscordRichPresenceAsset(Config.LargeAsset)
    SetDiscordRichPresenceAssetText(Config.LargeAssetText)
    SetDiscordRichPresenceAssetSmall(Config.SmallAsset)
    SetDiscordRichPresenceAssetSmallText(Config.SmallAssetText)

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
        local playersCount = #GetActivePlayers()
        local maxPlayers = 128

        if isCop then
            local badgeStr = officerBadge or "${officerBadge}"
            local nameStr = officerName or GetPlayerName(PlayerId())
            
            if onDuty then
                detailsText = string.format("HSPD • %s (%s)", nameStr, badgeStr)
                stateText = string.format("🟢 10-8 ON DUTY | %s [👥 %d/%d]", playerJobGrade, playersCount, maxPlayers)
            else
                detailsText = string.format("HSPD • %s (%s)", nameStr, badgeStr)
                stateText = string.format("🔴 10-7 OFF DUTY | Sedang Istirahat [👥 %d/%d]", playersCount, maxPlayers)
            end
        else
            detailsText = string.format("Warga: %s", GetPlayerName(PlayerId()))
            stateText = string.format("Menjelajah Kota [👥 %d/%d Pemain]", playersCount, maxPlayers)
        end

        SetRichPresence(string.format("%s - %s", detailsText, stateText))
        Wait(Config.UpdateInterval or 15000)
    end
end)
`;

  const readmeContent = `# Panduan Pemasangan FiveM Discord Rich Presence (RPC)
Folder Resource: resources/[hspd]/hspd-discord-rpc

1. Buka https://discord.com/developers/applications
2. Buat New Application bernama: "${appName}"
3. Salin APPLICATION ID -> Masukkan ke config.lua
4. Buka tab "Rich Presence" -> "Art Assets" -> Upload Logo (nama: hspd_logo_large & police_badge)
5. Masukkan folder ini ke server FiveM Anda
6. Di server.cfg, tambahkan:
   ensure hspd-discord-rpc
7. Restart server atau jalankan command 'refresh' lalu 'start hspd-discord-rpc'
`;

  const getActiveCode = () => {
    switch (selectedFileTab) {
      case 'config': return configContent;
      case 'client': return clientContent;
      case 'fxmanifest': return fxmanifestContent;
      case 'readme': return readmeContent;
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(getActiveCode());
    setCopiedFile(selectedFileTab);
    setTimeout(() => setCopiedFile(null), 2500);
  };

  const handleDownloadFile = (fileName: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl border border-indigo-500/40 bg-gradient-to-br from-[#0c0f1d] via-[#090b14] to-[#06080d] space-y-5 text-gray-200 font-sans shadow-xl shadow-black/60">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-indigo-900/60 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-950/80 border border-indigo-500/50 text-indigo-400 shadow-inner">
            <Gamepad2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2 font-mono">
              <span>FIVEM DISCORD RICH PRESENCE (RPC) GENERATOR</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                OPSI B: CURRENT ACTIVITY
              </span>
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Script FiveM otomatis untuk memunculkan status dinas dan bermain langsung di profil Discord pribadi Anda saat berada di dalam game GTA RP.
            </p>
          </div>
        </div>

        <a
          href="https://discord.com/developers/applications"
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-400/40 text-indigo-200 text-xs font-mono font-bold flex items-center gap-1.5 transition shrink-0"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Buka Discord Dev Portal</span>
        </a>
      </div>

      {/* Grid: Live Preview & Config Inputs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Interactive Discord Profile Preview (Styled like Discord Client Modal) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-gray-400">
            <span className="flex items-center gap-1.5 text-indigo-300 font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              SIMULASI TAMPILAN PROFIL DISCORD
            </span>
            <span className="text-[10px] text-gray-500">Live Mockup Sesuai Foto</span>
          </div>

          {/* Discord Card Frame */}
          <div className="rounded-2xl bg-[#111214] border border-[#232428] p-4 text-gray-100 shadow-2xl relative overflow-hidden">
            {/* Discord Header banner */}
            <div className="h-16 bg-gradient-to-r from-indigo-900 via-blue-900 to-slate-900 rounded-xl mb-3 relative flex items-end p-2">
              <span className="text-[10px] font-bold text-indigo-300/80 bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm">
                Activity Status Preview
              </span>
            </div>

            {/* Current Activity Box */}
            <div className="space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 font-mono">
                Current activity
              </div>

              {/* Rich Presence Card Container */}
              <div className="p-3.5 rounded-xl bg-[#1e1f22] border border-[#2b2d31] space-y-3">
                {/* Playing header */}
                <div className="text-xs font-bold text-gray-200 flex items-center justify-between">
                  <span>Playing {appName}</span>
                  <span className="text-gray-500 font-mono text-[10px]">FiveM</span>
                </div>

                {/* Details layout: Image + Texts */}
                <div className="flex items-start gap-3.5">
                  {/* Large and Small Asset Icons */}
                  <div className="relative shrink-0">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-700 to-blue-950 flex items-center justify-center border border-indigo-400/40 text-white shadow-md">
                      <Shield className="w-8 h-8 text-amber-300" />
                    </div>
                    {/* Small badge icon */}
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-900 border-2 border-[#1e1f22] flex items-center justify-center text-[10px] shadow">
                      {dutyStatus === '10-8' ? '🟢' : '🔴'}
                    </div>
                  </div>

                  {/* Activity Lines */}
                  <div className="min-w-0 flex-1 space-y-0.5 text-xs">
                    <div className="font-bold text-white truncate text-sm">
                      {officerName} ({officerBadge})
                    </div>
                    <div className="text-gray-300 truncate text-[11px]">
                      {dutyStatus === '10-8' 
                        ? `🟢 10-8 ON DUTY • ${officerRank}` 
                        : '🔴 10-7 OFF DUTY • Sedang Istirahat'}
                    </div>
                    
                    {/* Stats Pill (Players & Elapsed Timer) */}
                    <div className="flex items-center gap-2 pt-1 text-[11px] text-gray-400 font-mono flex-wrap">
                      <span className="flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded border border-gray-700/60 text-gray-300">
                        <Users className="w-3 h-3 text-sky-400" />
                        <span>{onlinePlayers} of {maxPlayers}</span>
                      </span>
                      <span className="flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded border border-gray-700/60 text-emerald-400 font-bold">
                        <Clock className="w-3 h-3" />
                        <span>01:42:18 elapsed</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Interactive Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <a
                    href={mdtUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-1.5 px-2 bg-[#2b2d31] hover:bg-[#35373c] text-white rounded-lg text-center text-[11px] font-medium border border-gray-700/50 transition flex items-center justify-center gap-1"
                  >
                    <span>🚔 Buka CAD/MDT</span>
                  </a>
                  <a
                    href={fivemJoinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-1.5 px-2 bg-[#2b2d31] hover:bg-[#35373c] text-white rounded-lg text-center text-[11px] font-medium border border-gray-700/50 transition flex items-center justify-center gap-1"
                  >
                    <span>🎮 Join FiveM</span>
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-3 p-2.5 rounded-lg bg-black/40 border border-gray-800 text-[11px] text-gray-400 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                Begitu script FiveM dijalankan, status di atas akan otomatis muncul di profil Discord setiap anggota yang sedang bermain di server.
              </span>
            </div>
          </div>
        </div>

        {/* Right: Customization Form & Code Generator */}
        <div className="lg:col-span-7 space-y-4">
          <div className="text-xs font-mono text-gray-400 flex items-center justify-between">
            <span className="text-indigo-300 font-bold flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5" />
              PENGATURAN SCRIPT & CODE GENERATOR
            </span>
            <span className="text-[10px] text-gray-400">Siap Pasang di FiveM</span>
          </div>

          {/* Quick Input Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-black/40 border border-gray-800 text-xs font-mono">
            <div>
              <label className="text-gray-400 text-[11px] block mb-1">Discord Application ID:</label>
              <input
                type="text"
                value={appId}
                onChange={e => setAppId(e.target.value)}
                placeholder="Misal: 123456789012345678"
                className="w-full px-2.5 py-1.5 bg-[#0a0d14] border border-gray-700 rounded-lg text-white text-xs outline-none focus:border-indigo-400"
              />
            </div>

            <div>
              <label className="text-gray-400 text-[11px] block mb-1">Nama Aplikasi / Server:</label>
              <input
                type="text"
                value={appName}
                onChange={e => setAppName(e.target.value)}
                placeholder="State of HighState Police"
                className="w-full px-2.5 py-1.5 bg-[#0a0d14] border border-gray-700 rounded-lg text-white text-xs outline-none focus:border-indigo-400"
              />
            </div>

            <div>
              <label className="text-gray-400 text-[11px] block mb-1">Nama Petugas Default:</label>
              <input
                type="text"
                value={officerName}
                onChange={e => setOfficerName(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[#0a0d14] border border-gray-700 rounded-lg text-white text-xs outline-none focus:border-indigo-400"
              />
            </div>

            <div>
              <label className="text-gray-400 text-[11px] block mb-1">Badge & Status Dinas:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={officerBadge}
                  onChange={e => setOfficerBadge(e.target.value)}
                  className="w-24 px-2.5 py-1.5 bg-[#0a0d14] border border-gray-700 rounded-lg text-white text-xs outline-none focus:border-indigo-400"
                />
                <button
                  type="button"
                  onClick={() => setDutyStatus(prev => prev === '10-8' ? '10-7' : '10-8')}
                  className={`flex-1 px-2 py-1 rounded-lg font-bold text-xs border transition ${
                    dutyStatus === '10-8' 
                      ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300' 
                      : 'bg-rose-950/80 border-rose-500 text-rose-300'
                  }`}
                >
                  {dutyStatus === '10-8' ? '🟢 10-8 ON DUTY' : '🔴 10-7 OFF DUTY'}
                </button>
              </div>
            </div>
          </div>

          {/* Code Viewer Box with Tabs */}
          <div className="rounded-xl border border-gray-800 bg-[#07090e] overflow-hidden">
            {/* File Switcher Header */}
            <div className="flex items-center justify-between border-b border-gray-800 px-3 py-2 bg-black/60 font-mono text-xs">
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => setSelectedFileTab('config')}
                  className={`px-3 py-1 rounded-md transition ${
                    selectedFileTab === 'config'
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  config.lua
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedFileTab('client')}
                  className={`px-3 py-1 rounded-md transition ${
                    selectedFileTab === 'client'
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  client.lua
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedFileTab('fxmanifest')}
                  className={`px-3 py-1 rounded-md transition ${
                    selectedFileTab === 'fxmanifest'
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  fxmanifest.lua
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedFileTab('readme')}
                  className={`px-3 py-1 rounded-md transition ${
                    selectedFileTab === 'readme'
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  README.md
                </button>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-white rounded-md text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedFile === selectedFileTab ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin File</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const ext = selectedFileTab === 'readme' ? 'md' : 'lua';
                    handleDownloadFile(`${selectedFileTab}.${ext}`, getActiveCode());
                  }}
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  title="Unduh File Langsung"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </div>

            {/* Code Block Content */}
            <div className="p-3.5 max-h-72 overflow-y-auto font-mono text-xs text-indigo-200/90 leading-relaxed bg-[#05070a]">
              <pre className="whitespace-pre-wrap">{getActiveCode()}</pre>
            </div>
          </div>

          {/* Quick Server.cfg installation tip */}
          <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-600/40 text-amber-200 text-xs font-mono flex items-start gap-2.5">
            <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong>Langkah Server:</strong> Simpan ketiga file di atas ke folder server FiveM: <code>resources/[hspd]/hspd-discord-rpc/</code>, lalu tambahkan baris <code>ensure hspd-discord-rpc</code> pada file <code>server.cfg</code> Anda.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
