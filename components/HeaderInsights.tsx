
import React, { useState, useEffect } from 'react';
import { geminiService } from '../services/geminiService';
import { Creator, PaymentTrack } from '../types';
import { Icons, COLORS } from '../constants';

interface HeaderInsightsProps {
  creators: Creator[];
  tracks: PaymentTrack[];
  isOpen: boolean;
  onClose: () => void;
}

interface StructuredSummary {
  briefing: string;
  quickWin: string;
  priorityLevel: string;
}

const HeaderInsights: React.FC<HeaderInsightsProps> = ({ creators, tracks, isOpen, onClose }) => {
  const [data, setData] = useState<StructuredSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && !data) {
      fetchSummary();
    }
  }, [isOpen]);

  const fetchSummary = async () => {
    setIsLoading(true);
    const result = await geminiService.getQuickSummary({ creators, tracks });
    setData(result);
    setIsLoading(false);
  };

  if (!isOpen) return null;

  const priorityColor = data?.priorityLevel === 'CRITICAL' ? 'text-red-400' : data?.priorityLevel === 'ELEVATED' ? 'text-orange-400' : 'text-green-400';

  return (
    <div className="absolute top-[80px] right-4 left-4 z-[101] animate-in slide-in-from-top-4 fade-in duration-500">
      <div className="liquid-glass rounded-[2.5rem] p-8 shadow-2xl shadow-blue-500/20 border-white/10 max-w-lg ml-auto relative overflow-hidden ring-1 ring-white/10">
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/5 blur-[80px]"></div>
        
        <header className="flex items-center justify-between mb-8 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Icons.Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Executive Briefing</span>
              <div className="flex items-center gap-2 mt-0.5">
                <div className={`w-1.5 h-1.5 rounded-full bg-current ${isLoading ? 'animate-pulse text-blue-400' : priorityColor}`}></div>
                <h4 className={`text-[10px] font-bold uppercase tracking-widest ${isLoading ? 'text-blue-400' : priorityColor}`}>
                  {isLoading ? 'ANALYZING...' : (data?.priorityLevel || 'ANALYZING...')}
                </h4>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-zinc-500">
            <Icons.Close className="w-5 h-5" />
          </button>
        </header>

        <div className="relative z-10 space-y-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-8 relative overflow-hidden rounded-3xl">
              {/* Pulsating background glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-blue-600/10 rounded-full blur-[60px] animate-pulse"></div>
              
              {/* Spinning Intelligence Hub */}
              <div className="relative group">
                <div className="w-20 h-20 rounded-3xl bg-zinc-900 border border-white/10 flex items-center justify-center shadow-2xl relative overflow-hidden animate-float">
                  <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-indigo-500/20 opacity-50"></div>
                  <Icons.Logo className="w-10 h-10 text-[#FF26B9] relative z-10 drop-shadow-[0_0_8px_rgba(255,38,185,0.4)] animate-spin duration-[3000ms]" />
                </div>
                {/* Secondary glow ring */}
                <div className="absolute -inset-2 border border-blue-500/10 rounded-[2rem] animate-ping opacity-20"></div>
              </div>

              <div className="text-center space-y-3 relative z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400 animate-pulse">Synchronizing Data Nodes</p>
                <div className="flex flex-col gap-1">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600">Accessing Network API...</p>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600">Calculating Risk Matrix...</p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <p className="text-lg font-bold tracking-tight text-white leading-tight">
                  Briefing Summary
                </p>
                <p className="text-sm font-medium leading-relaxed text-zinc-400">
                  {data?.briefing}
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-blue-600/10 border border-blue-500/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-400/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                <div className="flex items-center gap-2 mb-3">
                   <Icons.Activity className="w-4 h-4 text-blue-400" />
                   <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Primary Strategic Action</span>
                </div>
                <p className="text-sm font-bold leading-relaxed text-white">
                  {data?.quickWin}
                </p>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-white/5">
                <button 
                  onClick={fetchSummary}
                  className="flex items-center gap-2 py-3 px-6 bg-white text-black hover:bg-zinc-200 rounded-2xl text-xs font-bold transition-all shadow-xl active:scale-95"
                >
                  <Icons.Activity className="w-3.5 h-3.5" />
                  Regenerate Strategy
                </button>
                <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                  Live Intelligence
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default HeaderInsights;
