
import React, { useState } from 'react';
import { Icons, COLORS } from '../constants';

interface SettingsProps {
  lastSyncedAt: string;
  onSyncTrigger: () => void;
  isSyncing: boolean;
}

const Settings: React.FC<SettingsProps> = ({ lastSyncedAt, onSyncTrigger, isSyncing }) => {
  const [apifyApiKey, setApifyApiKey] = useState('••••••••••••••••');
  const [syncFrequency, setSyncFrequency] = useState('hourly');

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="px-2">
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-zinc-500 font-medium">Network & System Configuration</p>
      </header>

      <section className="space-y-6">
        <div className="px-2 flex items-center gap-3">
           <Icons.Activity className="w-5 h-5 text-blue-500" />
           <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Sync Ingestion (Apify)</h3>
        </div>

        <div className="glass-card rounded-[2.5rem] p-8 border-white/5 space-y-8">
           <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 px-1">Webhook Endpoint URL</label>
              <div className="p-5 rounded-2xl bg-black/40 border border-white/5 text-xs font-mono text-blue-400 break-all">
                 https://promura-recovery.api/webhooks/melon-ingest
              </div>
              <p className="text-[10px] text-zinc-600 font-medium px-1 italic">Send POST requests to this URL from your Apify Actor payload.</p>
           </div>

           <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 px-1">Apify API Token</label>
              <div className="relative">
                <input 
                  type="password"
                  value={apifyApiKey}
                  onChange={(e) => setApifyApiKey(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
                <button className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-600 uppercase">Update</button>
              </div>
           </div>

           <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                 <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 px-1">Sync Frequency</label>
                 <select 
                   value={syncFrequency}
                   onChange={(e) => setSyncFrequency(e.target.value)}
                   className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-xs font-bold appearance-none"
                 >
                    <option value="hourly">Hourly Pulse</option>
                    <option value="daily">Daily Audit</option>
                    <option value="manual">Manual Only</option>
                 </select>
              </div>
              <div className="space-y-3">
                 <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 px-1">Grace Period</label>
                 <div className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-xs font-bold text-zinc-400 text-center">
                    3 Business Days
                 </div>
              </div>
           </div>

           <button 
             onClick={onSyncTrigger}
             disabled={isSyncing}
             className="w-full py-5 bg-white text-black font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-white/5 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
           >
              {isSyncing ? (
                <>
                  <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                  Syncing Melon Data...
                </>
              ) : (
                <>
                  <Icons.Activity className="w-4 h-4" />
                  Trigger Manual Ingestion
                </>
              )}
           </button>
        </div>
      </section>

      <section className="space-y-6">
        <div className="px-2 flex items-center gap-3">
           <Icons.Alert className="w-5 h-5 text-red-500" />
           <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Escalation Policy</h3>
        </div>

        <div className="glass-card rounded-[2.5rem] p-8 border-white/5 space-y-6">
           {[
             { day: 'Day 4', action: 'Level 1 SMS (Automated)', color: 'text-blue-400' },
             { day: 'Day 6', action: 'Chatter Access Revoked', color: 'text-yellow-400' },
             { day: 'Day 9', action: 'Content Ingestion Halted', color: 'text-orange-400' },
             { day: 'Day 12', action: 'Legal Account Disablement', color: 'text-red-500' }
           ].map((policy, i) => (
             <div key={i} className="flex items-center justify-between border-b border-white/5 pb-4 last:border-0 last:pb-0">
                <span className="text-xs font-black uppercase tracking-widest text-zinc-500">{policy.day}</span>
                <span className={`text-xs font-bold ${policy.color}`}>{policy.action}</span>
             </div>
           ))}
        </div>
      </section>

      <div className="p-8 text-center space-y-2 opacity-30">
         <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Promura Node v1.4.2 (Stable)</p>
         <p className="text-[9px] font-medium text-zinc-700">All data transfers are encrypted via AES-256-GCM</p>
      </div>
    </div>
  );
};

export default Settings;
