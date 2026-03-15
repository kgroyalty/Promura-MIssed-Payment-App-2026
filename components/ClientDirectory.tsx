
import React, { useState, useMemo } from 'react';
import { Creator, PaymentTrack, DeescalationStage, IssueType, ReliabilityBreakdown } from '../types';
import { Icons, COLORS } from '../constants';

interface ClientDirectoryProps {
  creators: Creator[];
  setCreators: React.Dispatch<React.SetStateAction<Creator[]>>;
  tracks?: PaymentTrack[];
}

const ReliabilityRing: React.FC<{ score: number }> = ({ score }) => {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score > 90 ? COLORS.appleGreen : score > 70 ? COLORS.appleBlue : score > 50 ? COLORS.appleYellow : COLORS.appleRed;

  return (
    <div className="relative flex items-center justify-center w-16 h-16 group-hover:scale-110 transition-transform duration-500">
      <svg className="w-full h-full -rotate-90">
        <circle
          cx="32"
          cy="32"
          r={radius}
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="4"
          fill="transparent"
        />
        <circle
          cx="32"
          cy="32"
          r={radius}
          stroke={color}
          strokeWidth="4"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xs font-black tracking-tighter" style={{ color }}>{score}%</span>
      </div>
    </div>
  );
};

const MetricBar: React.FC<{ label: string, value: number, suffix?: string }> = ({ label, value, suffix = "%" }) => (
  <div className="space-y-1.5">
    <div className="flex justify-between items-center px-1">
      <span className="text-[8px] font-black uppercase tracking-widest text-zinc-600">{label}</span>
      <span className="text-[9px] font-bold text-zinc-400">{value}{suffix}</span>
    </div>
    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
      <div 
        className="h-full bg-blue-500/60 rounded-full transition-all duration-1000 ease-out"
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  </div>
);

const ClientDirectory: React.FC<ClientDirectoryProps> = ({ creators, setCreators, tracks = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'score' | 'status'>('name');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCreator, setEditingCreator] = useState<Creator | null>(null);
  const [formData, setFormData] = useState({
    realName: '',
    stageName: '',
    phoneNumber: '',
    email: '',
    status: 'active' as 'active' | 'inactive',
    notes: '',
    melonSplitId: '',
    splitPercentage: 50,
    bankStatus: 'linked' as 'linked' | 'unlinked' | 'pending',
    onlyFansUsername: ''
  });

  const filteredAndSorted = useMemo(() => {
    return creators
      .filter(c => {
        const matchesSearch = c.stageName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              c.realName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === 'all' || c.status === filterStatus;
        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.stageName.localeCompare(b.stageName);
        if (sortBy === 'score') return b.reliabilityScore - a.reliabilityScore;
        if (sortBy === 'status') return a.status.localeCompare(b.status);
        return 0;
      });
  }, [creators, searchTerm, sortBy, filterStatus]);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleOpenModal = (creator?: Creator, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (creator) {
      setEditingCreator(creator);
      setFormData({
        realName: creator.realName,
        stageName: creator.stageName,
        phoneNumber: creator.phoneNumber,
        email: creator.email,
        status: creator.status,
        notes: creator.notes || '',
        melonSplitId: creator.melonSplitId,
        splitPercentage: creator.splitPercentage,
        bankStatus: creator.bankStatus,
        onlyFansUsername: creator.onlyFansUsername || ''
      });
    } else {
      setEditingCreator(null);
      setFormData({
        realName: '',
        stageName: '',
        phoneNumber: '',
        email: '',
        status: 'active',
        notes: '',
        melonSplitId: `split_${Math.random().toString(36).substr(2, 5)}`,
        splitPercentage: 50,
        bankStatus: 'linked',
        onlyFansUsername: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.stageName || !formData.realName) return;
    
    if (editingCreator) {
      setCreators(prev => prev.map(c => c.id === editingCreator.id ? { ...c, ...formData } : c));
    } else {
      const newCreator: Creator = {
        ...formData,
        id: Math.random().toString(36).substr(2, 9),
        reliabilityScore: 100, 
        totalPaid: 0,
        totalMissed: 0,
        paymentHistory: [],
        lastSuccessfulPaymentDate: null,
        createdDate: new Date().toISOString()
      };
      setCreators(prev => [...prev, newCreator]);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="px-2 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Clients</h2>
          <p className="text-zinc-500 font-medium">{creators.length} Managed Accounts</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center shadow-2xl active:scale-90 hover:shadow-white/20 transition-all"
        >
          <span className="text-2xl font-bold">+</span>
        </button>
      </header>

      <div className="px-2 space-y-5">
        <div className="relative group">
          <input 
            type="text" 
            placeholder="Search clients by name..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white/10 transition-all placeholder:text-zinc-600"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-blue-400 transition-colors">
             <Icons.Search className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredAndSorted.map(creator => {
          const isExpanded = expandedId === creator.id;
          const hasPartialCharge = tracks.some(t => t.creatorId === creator.id && t.issueType === IssueType.PARTIAL_CHARGE);
          
          // Default breakdown if not present
          const breakdown = creator.reliabilityBreakdown || {
            onTimeRate: 85,
            avgDelayDays: 1.4,
            recoveryRatio: 98,
            consistencyScore: 92,
            resolutionSpeed: 75
          };

          return (
            <div 
              key={creator.id} 
              onClick={() => toggleExpand(creator.id)}
              className={`glass-card rounded-[2.5rem] p-7 border transition-all cursor-pointer group relative overflow-hidden ${
                isExpanded ? 'ring-2 ring-blue-500/50 border-blue-500/20 shadow-2xl shadow-blue-500/10' : 'border-white/5 hover:border-white/20'
              }`}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.02] -mr-8 -mt-8 rounded-full blur-3xl group-hover:bg-blue-500/[0.05] transition-colors duration-700"></div>
              
              <div className="flex items-center gap-5 mb-6 relative z-10">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-zinc-800 to-black border border-white/10 flex items-center justify-center text-2xl font-bold shadow-2xl transition-transform group-hover:scale-105 duration-500">
                    {creator.stageName.charAt(0)}
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-xl tracking-tight text-white group-hover:text-blue-400 transition-colors">{creator.stageName}</h3>
                    <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-full border shadow-sm transition-all duration-500 ${
                      creator.status === 'active' 
                        ? 'bg-green-500/10 border-green-500/20 text-green-500 shadow-green-500/10' 
                        : 'bg-red-500/10 border-red-500/20 text-red-500 shadow-red-500/10'
                    }`}>
                      {creator.status}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-500 font-medium tracking-tight mt-0.5">{creator.realName}</p>
                </div>

                <div className="flex flex-col items-center">
                  <ReliabilityRing score={creator.reliabilityScore} />
                  <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-[0.2em] mt-1">Reliability</span>
                </div>
              </div>

              {/* Expanded Details Content */}
              <div className={`overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isExpanded ? 'max-h-[1500px] opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                
                {/* AI Intelligence Audit Breakdown */}
                <div className="mb-8 p-6 rounded-[2rem] bg-white/[0.03] border border-white/5 space-y-5 animate-in slide-in-from-top-4 duration-700 delay-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                       <Icons.Sparkles className="w-4 h-4 text-blue-400" />
                       <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Intelligence Audit Breakdown</h4>
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-blue-500/50">Daily Recalculation Active</span>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <MetricBar label="On-Time Payment Rate" value={breakdown.onTimeRate} />
                    <MetricBar label="Recovery vs Missed Ratio" value={breakdown.recoveryRatio} />
                    <MetricBar label="Pattern Consistency" value={breakdown.consistencyScore} />
                    <MetricBar label="Issue Resolution Speed" value={breakdown.resolutionSpeed} />
                    <div className="pt-2 flex items-center justify-between px-1">
                       <span className="text-[8px] font-black uppercase tracking-widest text-zinc-600">Avg. Delay Intensity</span>
                       <span className="text-[10px] font-bold text-red-400">{breakdown.avgDelayDays} Days</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-8 pt-2 border-t border-white/5 mt-4">
                  {/* Melon & Contract Info Group */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-2">
                      <p className="text-[9px] font-black uppercase tracking-widest text-blue-400">Melon Split</p>
                      <p className="text-xs font-bold text-white truncate">{creator.melonSplitId}</p>
                      <p className="text-[8px] font-bold text-zinc-500 uppercase">{creator.splitPercentage}% Split</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-2">
                      <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Bank Status</p>
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${creator.bankStatus === 'linked' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                        <p className="text-xs font-bold text-white capitalize">{creator.bankStatus}</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <button 
                      onClick={(e) => handleOpenModal(creator, e)}
                      className="flex-1 py-4 rounded-2xl bg-white text-black font-bold text-xs active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl shadow-white/5"
                    >
                      <Icons.Activity className="w-3.5 h-3.5" />
                      Edit Profile
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-7 relative z-10 mt-6">
                 <div className="bg-white/5 p-4 rounded-[1.5rem] border border-white/5 backdrop-blur-sm group-hover:bg-white/[0.08] transition-colors">
                   <div className="flex items-center gap-2 mb-1.5">
                     <Icons.Activity className="w-3 h-3 text-zinc-500" />
                     <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Total Recovery</p>
                   </div>
                   <p className="text-lg font-bold tracking-tight text-white">${creator.totalPaid.toLocaleString()}</p>
                 </div>
                 <div className="bg-white/5 p-4 rounded-[1.5rem] border border-white/5 backdrop-blur-sm group-hover:bg-white/[0.08] transition-colors">
                   <div className="flex items-center gap-2 mb-1.5">
                     <Icons.Alert className="w-3 h-3 text-red-500/50" />
                     <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Risk History</p>
                   </div>
                   <div className="flex items-baseline gap-1">
                     <p className="text-lg font-bold tracking-tight text-red-400">{creator.totalMissed}</p>
                     <span className="text-[10px] text-zinc-600 font-bold uppercase">Incidents</span>
                   </div>
                 </div>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-4 animate-in fade-in duration-300 bg-black/70 backdrop-blur-md">
          <div 
            onClick={(e) => e.stopPropagation()}
            className="liquid-glass w-full max-w-lg rounded-[3rem] p-10 border border-white/10 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-500 max-h-[90vh] overflow-y-auto no-scrollbar"
          >
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full"></div>
            
            <header className="flex items-center justify-between mb-10 sticky top-0 bg-transparent z-20">
              <div>
                <h3 className="text-3xl font-bold tracking-tight">{editingCreator ? 'Profile Edit' : 'New Client'}</h3>
                <p className="text-zinc-500 text-xs font-medium mt-1">Agency Management Portal</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white transition-all border border-white/5">
                <Icons.Close className="w-6 h-6" />
              </button>
            </header>

            <div className="space-y-6 relative z-10">
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 px-1">Stage Name</label>
                  <input 
                    type="text" 
                    value={formData.stageName}
                    onChange={(e) => setFormData({...formData, stageName: e.target.value})}
                    placeholder="e.g. Jess_Luxe"
                    className="w-full bg-white/5 border border-white/10 rounded-[1.25rem] py-4 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 px-1">Real Name</label>
                  <input 
                    type="text" 
                    value={formData.realName}
                    onChange={(e) => setFormData({...formData, realName: e.target.value})}
                    placeholder="e.g. Jessica Lee"
                    className="w-full bg-white/5 border border-white/10 rounded-[1.25rem] py-4 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  />
                </div>
              </div>

              <button 
                onClick={handleSave}
                className="w-full py-5 bg-white text-black font-bold rounded-2xl mt-6 active:scale-95 transition-all shadow-xl shadow-white/5 flex items-center justify-center gap-2 group"
              >
                <span>{editingCreator ? 'Synchronize Updates' : 'Authorize New Client'}</span>
                <Icons.ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDirectory;
