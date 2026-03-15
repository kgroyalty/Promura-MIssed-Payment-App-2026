
import React, { useMemo, useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Creator, PaymentTrack, IssueType } from '../types';
import { geminiService } from '../services/geminiService';
import { Icons } from '../constants';

interface AnalyticsProps {
  creators: Creator[];
  tracks: PaymentTrack[];
}

const Analytics: React.FC<AnalyticsProps> = ({ creators, tracks }) => {
  const [insights, setInsights] = useState<Record<string, string>>({});
  const [loadingInsights, setLoadingInsights] = useState(false);

  // Dynamically calculate distribution based on real tracking data
  const issueCategories = useMemo(() => {
    const total = tracks.length || 1;
    return Object.values(IssueType).map(type => {
      const count = tracks.filter(t => t.issueType === type).length;
      const percentage = Math.round((count / total) * 100);
      
      let color = '#8E8E93'; // Default/Other
      if (type === IssueType.MELON_DISCONNECT) color = '#007AFF';
      if (type === IssueType.INSUFFICIENT_FUNDS) color = '#FF3B30';
      if (type === IssueType.SYSTEM_GLITCH) color = '#FFCC00';
      if (type === IssueType.PAYMENT_FAILED) color = '#FF453A';
      if (type === IssueType.PARTIAL_CHARGE) color = '#FF9F0A';
      
      return { category: type, percentage, color };
    });
  }, [tracks]);

  const fetchInsights = async () => {
    if (tracks.length === 0) return;
    setLoadingInsights(true);
    const results = await geminiService.getCategoryInsights(issueCategories);
    const insightMap = results.reduce((acc: any, curr: any) => ({
      ...acc, [curr.category]: curr.recommendation
    }), {});
    setInsights(insightMap);
    setLoadingInsights(false);
  };

  useEffect(() => {
    fetchInsights();
  }, [issueCategories]);

  const data = useMemo(() => [
    { name: 'On Time', value: Math.max(0, creators.length - tracks.length) },
    { name: 'Late', value: tracks.length },
  ], [creators, tracks]);

  const CHART_COLORS = ['#34C759', '#FF3B30'];

  const reliabilityData = creators.map(c => ({
    name: c.stageName,
    score: c.reliabilityScore
  })).sort((a,b) => b.score - a.score);

  const recoveryRate = useMemo(() => {
    if (creators.length === 0) return 0;
    return Math.round(((creators.length - tracks.length) / creators.length) * 100);
  }, [creators, tracks]);

  return (
    <div className="space-y-8 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="px-2 flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Performance</h2>
          <p className="text-zinc-500 font-medium">AI Intelligence Lab</p>
        </div>
        <button 
          onClick={fetchInsights}
          className="p-3 rounded-2xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-all active:scale-90"
          title="Refresh AI Insights"
        >
          <Icons.Sparkles className="w-4 h-4" />
        </button>
      </div>

      {/* Main Portfolio Health Chart */}
      <div className="liquid-glass rounded-[2.5rem] p-8 h-72 flex items-center justify-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-32 h-32 bg-green-500/5 blur-[60px]"></div>
        <div className="flex-1 h-full">
           <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={90}
                paddingAngle={10}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ background: 'rgba(0,0,0,0.9)', border: 'none', borderRadius: '16px', fontSize: '12px', backdropFilter: 'blur(10px)' }}
                itemStyle={{ color: '#fff' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="w-1/3 flex flex-col justify-center gap-6 relative z-10">
          <div>
            <p className="text-3xl font-black text-green-400 tracking-tighter">{recoveryRate}%</p>
            <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mt-1">Healthy</p>
          </div>
          <div>
            <p className="text-3xl font-black text-red-400 tracking-tighter">{100 - recoveryRate}%</p>
            <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mt-1">At Risk</p>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <h3 className="px-4 font-bold text-xl tracking-tight">Reliability Ranking</h3>
        <div className="liquid-glass rounded-[2.5rem] p-8 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={reliabilityData}>
              <XAxis dataKey="name" stroke="#3f3f46" fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#71717a', fontWeight: 'bold'}} />
              <YAxis hide />
              <Tooltip 
                 cursor={{fill: 'rgba(255,255,255,0.03)'}}
                 contentStyle={{ background: 'rgba(0,0,0,0.9)', border: 'none', borderRadius: '16px', fontSize: '12px', backdropFilter: 'blur(10px)' }}
              />
              <Bar dataKey="score" fill="#007AFF" radius={[8, 8, 8, 8]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="space-y-5">
        <div className="flex items-center justify-between px-4">
          <h3 className="font-bold text-xl tracking-tight">Issue Categorizer</h3>
          <div className="flex items-center gap-1.5 py-1.5 px-3 bg-blue-500/10 rounded-full border border-blue-500/20">
             <Icons.Sparkles className="w-3 h-3 text-blue-400" />
             <span className="text-[9px] font-black uppercase tracking-widest text-blue-400">AI Analysis Active</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 px-1">
          {issueCategories.map((issue) => (
            <div key={issue.category} className="liquid-glass rounded-[2rem] p-6 border border-white/5 flex flex-col justify-between h-56 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/[0.01] rounded-full blur-2xl group-hover:bg-blue-500/[0.03] transition-colors duration-700"></div>
              
              <div className="relative z-10">
                <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-1">{issue.category}</p>
                <p className="text-2xl font-black tracking-tighter">{issue.percentage}%</p>
                
                {/* AI Insights - Actionable Recommendation */}
                <div className="mt-4 min-h-[4rem] p-3 rounded-xl bg-white/[0.03] border border-white/5 backdrop-blur-sm group-hover:bg-white/[0.05] transition-all">
                  {loadingInsights ? (
                    <div className="space-y-2 py-1">
                      <div className="h-1.5 w-full bg-white/10 rounded-full animate-pulse"></div>
                      <div className="h-1.5 w-3/4 bg-white/10 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                      <div className="h-1.5 w-1/2 bg-white/10 rounded-full animate-pulse [animation-delay:0.4s]"></div>
                    </div>
                  ) : (
                    <p className="text-[10px] font-bold text-blue-400 leading-[1.4] italic opacity-80 group-hover:opacity-100 transition-opacity">
                      {insights[issue.category] ? `“${insights[issue.category]}”` : (tracks.length > 0 ? "Analyzing patterns..." : "Awaiting data...")}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mt-4 shadow-inner relative">
                <div 
                  className="h-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(255,255,255,0.1)] relative"
                  style={{ backgroundColor: issue.color, width: `${issue.percentage}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
