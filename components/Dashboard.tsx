
import React, { useState } from 'react';
import { Creator, PaymentTrack, MelonPaymentRecord, IssueType } from '../types';
import { COLORS, Icons } from '../constants';
import { geminiService } from '../services/geminiService';

interface DashboardProps {
  creators: Creator[];
  tracks: PaymentTrack[];
}

const Dashboard: React.FC<DashboardProps> = ({ creators, tracks }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const activeIssues = tracks.length;
  const totalRecovered = creators.reduce((acc, c) => acc + c.totalPaid, 0);
  const totalPending = tracks.reduce((acc, t) => acc + t.amountOwed, 0);

  // Flatten nested payments for the feed
  const melonRecords = creators.flatMap(c => 
    (c.recentPayments || []).map(p => ({ ...p, creatorName: c.stageName }))
  ).sort((a, b) => new Date(b.payout_date).getTime() - new Date(a.payout_date).getTime());

  const handleDailySync = async () => {
    setIsSyncing(true);
    for (const creator of creators) {
      const history = creator.paymentHistory || [];
      const auditResult = await geminiService.recalculateReliabilityScore(creator, history);
      console.log(`Syncing ${creator.stageName}: Score is now ${auditResult.overallScore}`);
    }
    setTimeout(() => {
      setIsSyncing(false);
      alert("System Audit Complete.");
    }, 1000);
  };

  const getIssueIcon = (type?: IssueType) => {
    switch (type) {
      case IssueType.MELON_DISCONNECT: return <Icons.Activity className="w-3.5 h-3.5" />;
      case IssueType.INSUFFICIENT_FUNDS: return <Icons.Alert className="w-3.5 h-3.5" />;
      default: return <Icons.Activity className="w-3.5 h-3.5" />;
    }
  };

  const getIssueColor = (type?: IssueType) => {
    switch (type) {
      case IssueType.INSUFFICIENT_FUNDS: return 'text-red-400 border-red-500/20 bg-red-500/10 shadow-red-500/10';
      case IssueType.MELON_DISCONNECT: return 'text-blue-400 border-blue-500/20 bg-blue-500/10 shadow-blue-500/10';
      default: return 'text-zinc-400 border-white/5 bg-white/5';
    }
  };

  return (
    <div className="space-y-8 pb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <section className="space-y-6">
        <header className="px-2">
          <h2 className="text-3xl font-bold tracking-tight">Overview</h2>
          <p className="text-zinc-500 font-medium">System Health & Recovery</p>
        </header>

        <div className="grid grid-cols-2 gap-4">
          <div className="glass-card rounded-[2.5rem] p-6 flex flex-col justify-between h-48 relative overflow-hidden group">
            <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-blue-600/10 blur-3xl rounded-full group-hover:bg-blue-600/20 transition-all duration-700"></div>
            <div className="p-3 w-fit rounded-2xl bg-blue-500/10 text-blue-400">
               <Icons.Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Recovered</p>
              <p className="text-3xl font-bold tracking-tighter">${totalRecovered.toLocaleString()}</p>
            </div>
          </div>

          <div className="glass-card rounded-[2.5rem] p-6 flex flex-col justify-between h-48 relative overflow-hidden group border-red-500/10">
            <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-red-600/10 blur-3xl rounded-full group-hover:bg-red-600/20 transition-all duration-700"></div>
            <div className="p-3 w-fit rounded-2xl bg-red-500/10 text-red-400">
               <Icons.Alert className="w-6 h-6" />
            </div>
            <div>
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Risk Capital</p>
              <p className="text-3xl font-bold tracking-tighter text-red-500/90">${totalPending.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-2xl font-bold tracking-tight">Melon Feed</h2>
          <div className="flex items-center gap-1.5 py-1 px-3 bg-white/5 rounded-full border border-white/10">
             <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
             <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Live Payout Log</span>
          </div>
        </div>

        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 px-1">
          {melonRecords.length === 0 ? (
            <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest px-4">No recent sync records found.</p>
          ) : (
            melonRecords.map((record, idx) => (
              <div key={idx} className="flex-shrink-0 w-64 glass-card rounded-[2rem] p-5 border border-white/5 space-y-4 relative overflow-hidden group">
                 <div className="flex items-center justify-between">
                   <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                      record.status === 'PROCESSED' ? 'bg-green-500/10 text-green-400 border border-green-500/10' :
                      record.status === 'PROCESSING' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/10' :
                      'bg-red-500/10 text-red-400 border border-red-500/10'
                   }`}>
                     {record.status}
                   </span>
                   <span className="text-[9px] font-bold text-zinc-600">{new Date(record.payout_date).toLocaleDateString([], {month: 'short', day: 'numeric'})}</span>
                 </div>
                 
                 <div>
                   <h4 className="font-bold text-white group-hover:text-blue-400 transition-colors">{record.creatorName}</h4>
                 </div>

                 <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                    <div>
                      <p className="text-[8px] font-black uppercase text-zinc-600">Agency</p>
                      <p className="text-xs font-bold text-white">${record.agency_earnings.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] font-black uppercase text-zinc-600">Initiator</p>
                      <p className="text-xs font-bold text-zinc-400">${record.initiator_paid.toLocaleString()}</p>
                    </div>
                 </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-2xl font-bold tracking-tight">Active Automation</h2>
          <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 rounded-full border border-red-500/20">
             <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
             <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">
              {activeIssues} Priority
             </span>
          </div>
        </div>
        
        <div className="space-y-4">
          {tracks.length === 0 ? (
            <div className="glass-card rounded-[2.5rem] p-12 text-center border-dashed border-white/10">
              <p className="text-zinc-500 font-medium">Portfolio is fully synchronized.</p>
            </div>
          ) : (
            tracks.map(track => {
              const creator = creators.find(c => c.id === track.creatorId);
              const issueStyling = getIssueColor(track.issueType);
              
              return (
                <div key={track.id} className={`glass-card rounded-[2rem] p-5 flex items-center justify-between hover:bg-white/5 transition-all border group cursor-pointer ${
                  track.issueType === IssueType.INSUFFICIENT_FUNDS ? 'border-red-500/20 shadow-lg shadow-red-500/5' : 'border-white/5'
                }`}>
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-zinc-800 to-black flex items-center justify-center font-bold text-xl border border-white/10 group-hover:scale-105 transition-transform">
                      {creator?.stageName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-lg tracking-tight">{creator?.stageName}</p>
                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[8px] font-black uppercase tracking-widest ${issueStyling}`}>
                          {getIssueIcon(track.issueType)}
                          {track.issueType?.split(' ')[0]}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                         <span className="text-xs text-zinc-500 font-medium">{track.currentStage}</span>
                         <span className={`text-xs font-bold ${track.issueType === IssueType.INSUFFICIENT_FUNDS ? 'text-red-400' : 'text-zinc-400'}`}>
                           -${track.amountOwed.toLocaleString()}
                         </span>
                      </div>
                    </div>
                  </div>
                  <div className="p-2 rounded-full bg-white/5">
                    <Icons.ChevronRight className="text-zinc-600" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      <section className="glass-card rounded-[2.5rem] p-8 border-blue-500/10">
        <h3 className="font-bold text-xl mb-2 tracking-tight text-blue-400">Intelligent Auditor</h3>
        <p className="text-zinc-500 text-sm leading-relaxed mb-6 font-medium">
          Recalculate reliability scores based on weighted factors: On-time rate, Average delays, Recovery ratios, and Resolution speeds.
        </p>
        <button 
          onClick={handleDailySync}
          disabled={isSyncing}
          className="w-full py-4 bg-white text-black font-bold rounded-2xl shadow-xl shadow-white/5 flex items-center justify-center gap-2"
        >
          {isSyncing ? 'Synchronizing...' : 'Perform Global Recalculation'}
        </button>
      </section>
    </div>
  );
};

export default Dashboard;
