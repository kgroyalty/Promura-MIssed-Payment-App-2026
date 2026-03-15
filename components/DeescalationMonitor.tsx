
import React, { useState, useMemo, useEffect } from 'react';
import { PaymentTrack, Creator, DeescalationStage, IssueType, getStageFromDays, STAGE_THRESHOLDS, ManualPaymentMethod } from '../types';
import { Icons, COLORS } from '../constants';
import { geminiService } from '../services/geminiService';

interface DeescalationMonitorProps {
  tracks: PaymentTrack[];
  creators: Creator[];
  onVerify: (trackId: string, method: ManualPaymentMethod) => void;
}

const DeescalationMonitor: React.FC<DeescalationMonitorProps> = ({ tracks, creators, onVerify }) => {
  const [filterIssue, setFilterIssue] = useState<IssueType | 'All'>('All');
  const [selectedTrack, setSelectedTrack] = useState<PaymentTrack | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isVoiceLoading, setIsVoiceLoading] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);

  const filteredTracks = useMemo(() => {
    return tracks.filter(t => filterIssue === 'All' || t.issueType === filterIssue);
  }, [tracks, filterIssue]);

  useEffect(() => {
    if (filteredTracks.length > 0) {
      if (!selectedTrack || !filteredTracks.find(t => t.id === selectedTrack.id)) {
        setSelectedTrack(filteredTracks[0]);
      }
    } else {
      setSelectedTrack(null);
    }
  }, [filteredTracks]);

  const getCreator = (id: string) => creators.find(c => c.id === id);

  const handleSendReminder = async (track: PaymentTrack) => {
    setIsGenerating(true);
    const creator = getCreator(track.creatorId);
    if (!creator) return;

    const currentStage = getStageFromDays(track.daysDelayed);
    const msg = await geminiService.generateDeescalationMessage(
      currentStage, 
      track.amountOwed, 
      "Apple Pay (480-565-9837) or Zelle (Beastfitnation1@gmail.com)"
    );
    
    alert(`AI Generated Reminder for ${creator.stageName}:\n\n${msg}\n\n[System would now send this via iMessage/Email]`);
    setIsGenerating(false);
  };

  const handleConfirmVerification = (method: ManualPaymentMethod) => {
    if (!selectedTrack) return;
    onVerify(selectedTrack.id, method);
    setIsVerifyModalOpen(false);
    setSelectedTrack(null);
  };

  // Calculate progress on a 0-14 day scale for visualization
  const getTimelinePosition = (days: number) => {
    return Math.min((days / 14) * 100, 100);
  };

  const selectedStage = useMemo(() => {
    if (!selectedTrack) return DeescalationStage.GRACE_PERIOD;
    return getStageFromDays(selectedTrack.daysDelayed);
  }, [selectedTrack]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="px-2">
        <h2 className="text-3xl font-bold tracking-tight">Recovery Live</h2>
        <p className="text-zinc-500 font-medium">Stage-Based De-escalation</p>
      </header>

      <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar px-2 min-h-[14rem]">
        {filteredTracks.length === 0 ? (
          <div className="flex-1 glass-card rounded-[2.5rem] p-8 flex flex-col items-center justify-center border-dashed border-white/10 min-h-[13rem] animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center mb-4 text-zinc-700">
              <Icons.Activity className="w-6 h-6" />
            </div>
            <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-widest">No active recovery tracks</p>
          </div>
        ) : (
          filteredTracks.map(track => {
            const creator = getCreator(track.creatorId);
            const isSelected = selectedTrack?.id === track.id;
            const progress = (track.daysDelayed / 14) * 100;
            
            return (
              <button 
                key={track.id}
                onClick={() => setSelectedTrack(track)}
                className={`flex-shrink-0 w-44 h-52 rounded-[2.5rem] p-5 flex flex-col justify-between transition-all duration-500 border relative overflow-hidden group ${
                  isSelected 
                    ? 'bg-blue-600/10 border-blue-500 shadow-[0_0_30px_rgba(0,122,255,0.15)]' 
                    : 'glass-card border-white/5'
                }`}
              >
                <div className="relative z-10 flex flex-col h-full justify-between text-left">
                  <div className="flex items-start justify-between">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl transition-colors duration-500 ${
                      isSelected ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      {creator?.stageName.charAt(0)}
                    </div>
                    <div className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg ${isSelected ? 'bg-blue-500/20 text-blue-400' : 'bg-zinc-900 text-zinc-500'}`}>
                      Day {track.daysDelayed}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className={`text-sm font-bold truncate ${isSelected ? 'text-white' : 'text-zinc-300'}`}>{creator?.stageName}</p>
                    </div>
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden relative">
                      <div 
                        className="h-full bg-blue-500 transition-all duration-1000 ease-out"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {selectedTrack && (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
          <div className="glass-card rounded-[3rem] p-8 space-y-12 relative overflow-hidden border-white/10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px]"></div>
            
            <div className="flex items-center justify-between relative z-10">
              <div>
                <h3 className="text-3xl font-bold tracking-tight">{getCreator(selectedTrack.creatorId)?.stageName}</h3>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="font-bold text-xl tracking-tight text-red-500">
                    -${selectedTrack.amountOwed.toLocaleString()}
                  </span>
                  <div className="w-1 h-1 rounded-full bg-zinc-700"></div>
                  <span className="text-zinc-400 text-sm font-medium uppercase tracking-widest">Day {selectedTrack.daysDelayed}</span>
                </div>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center min-w-[110px] backdrop-blur-md">
                 <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mb-1">Status</p>
                 <p className="text-[11px] font-black uppercase tracking-tighter text-blue-400">
                   {selectedStage}
                 </p>
              </div>
            </div>

            <div className="space-y-10 relative z-10 px-1">
              <div className="relative h-2 w-full bg-white/5 rounded-full border border-white/5 shadow-inner">
                <div 
                  className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]"
                  style={{ width: `${getTimelinePosition(selectedTrack.daysDelayed)}%` }}
                />
                {STAGE_THRESHOLDS.map((threshold, i) => {
                  const pos = getTimelinePosition(threshold.day);
                  const isPassed = selectedTrack.daysDelayed >= threshold.day;
                  return (
                    <div 
                      key={i} 
                      className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 transition-all duration-500 ${
                        isPassed ? 'bg-blue-600 border-white/20' : 'bg-zinc-800 border-zinc-700'
                      }`}
                      style={{ left: `${pos}%` }}
                    />
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5 relative z-10 pt-4">
              <button 
                onClick={() => handleSendReminder(selectedTrack)}
                disabled={isGenerating}
                className="py-5 rounded-2xl bg-blue-600 text-white font-black text-xs active:scale-95 transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 group disabled:opacity-50"
              >
                {isGenerating ? 'Processing...' : 'Dispatch Warning'}
              </button>
              <button 
                onClick={() => setIsVerifyModalOpen(true)}
                className="py-5 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-xs active:scale-95 transition-all hover:bg-white/10 flex items-center justify-center shadow-inner"
              >
                Confirm Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Verification Modal */}
      {isVerifyModalOpen && selectedTrack && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="liquid-glass w-full max-w-md rounded-[3rem] p-10 border-white/10 shadow-2xl space-y-8 animate-in zoom-in-95 duration-500">
             <header className="text-center space-y-2">
                <div className="w-16 h-16 rounded-3xl bg-green-500/10 text-green-500 border border-green-500/20 flex items-center justify-center mx-auto mb-4">
                   <Icons.Activity className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold tracking-tight">Verify Payment</h3>
                <p className="text-zinc-500 text-sm font-medium">Select method used for settlement</p>
             </header>

             <div className="space-y-3">
                {Object.values(ManualPaymentMethod).map((method) => (
                  <button 
                    key={method}
                    onClick={() => handleConfirmVerification(method)}
                    className="w-full p-5 rounded-2xl bg-white/5 border border-white/5 text-left hover:bg-white/10 hover:border-blue-500/30 transition-all active:scale-[0.98] group"
                  >
                     <p className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">{method}</p>
                  </button>
                ))}
             </div>

             <button 
               onClick={() => setIsVerifyModalOpen(false)}
               className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-zinc-600 hover:text-white transition-colors"
             >
               Cancel Verification
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeescalationMonitor;
