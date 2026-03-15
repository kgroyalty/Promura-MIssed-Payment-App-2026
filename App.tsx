
import React, { useState, useEffect } from 'react';
import { Icons, COLORS } from './constants';
import Dashboard from './components/Dashboard';
import ClientDirectory from './components/ClientDirectory';
import DeescalationMonitor from './components/DeescalationMonitor';
import Analytics from './components/Analytics';
import Settings from './components/Settings';
import AIChatBot from './components/AIChatBot';
import HeaderInsights from './components/HeaderInsights';
import { 
  Creator, 
  PaymentTrack, 
  DeescalationStage, 
  IssueType, 
  ManualPaymentMethod, 
  MelonSyncPayload,
  getStageFromDays
} from './types';
import { geminiService } from './services/geminiService';
import { db } from './firebase'; // Corrected import
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dash' | 'clients' | 'monitor' | 'analytics' | 'settings'>('dash');
  const [isHeaderAIOpen, setIsHeaderAIOpen] = useState(false);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [activeTracks, setActiveTracks] = useState<PaymentTrack[]>([]);
  const [lastSyncedAt, setLastSyncedAt] = useState<string>(new Date().toISOString());
  const [isSyncing, setIsSyncing] = useState(false);

  // REAL-TIME FIRESTORE LISTENERS
  useEffect(() => {
    // 1. Listen for Creators
    const unsubscribeCreators = onSnapshot(collection(db, 'creators'), (snapshot) => {
      setCreators(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Creator[]);
    });

    // 2. Listen for Active Payment Tracks
    const unsubscribeTracks = onSnapshot(collection(db, 'melonPayments'), (snapshot) => {
      setActiveTracks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PaymentTrack[]);
    });

    // 3. Listen for Inbound Webhooks
    const q = query(
      collection(db, 'missedPayments'), 
      where('processed', '==', false)
    );
    
    const unsubscribeWebhooks = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const docs = snapshot.docs.sort((a, b) => {
          const timeA = a.data().server_timestamp || 0;
          const timeB = b.data().server_timestamp || 0;
          return timeB - timeA;
        });
        const latestDoc = docs[0];
        const payload = latestDoc.data() as MelonSyncPayload;
        console.log("Real-time Webhook Detected. Ingesting...");
        processSyncPayload(payload);
        
        // Mark as processed immediately
        updateDoc(doc(db, 'missedPayments', latestDoc.id), { processed: true });
      }
    });

    return () => {
      unsubscribeCreators();
      unsubscribeTracks();
      unsubscribeWebhooks();
    };
  }, []);

  const processSyncPayload = async (payload: MelonSyncPayload) => {
    if (!payload.creators) return;
    setIsSyncing(true);
    try {
      for (const data of payload.creators) {
        let creator = creators.find(c => c.melonSplitId === data.melon_split_id);
        let creatorId = creator?.id;

        if (!creator) {
          creatorId = `c_${Math.random().toString(36).substr(2, 9)}`;
          const newCreator: Partial<Creator> = {
            id: creatorId,
            realName: data.name,
            stageName: data.name.replace(/\s+/g, '_'),
            phoneNumber: 'Pending Verification',
            email: 'Pending Verification',
            reliabilityScore: 100,
            totalPaid: 0,
            totalMissed: 0,
            status: 'active',
            melonSplitId: data.melon_split_id,
            splitPercentage: data.split_percentage,
            bankStatus: data.bank_status,
            lastSuccessfulPaymentDate: data.last_successful_payment_date,
            createdDate: new Date().toISOString(),
            paymentHistory: [],
            recentPayments: data.recent_payments
          };
          await setDoc(doc(db, 'creators', creatorId), newCreator);
        } else {
          await updateDoc(doc(db, 'creators', creatorId!), {
            bankStatus: data.bank_status,
            splitPercentage: data.split_percentage,
            lastSuccessfulPaymentDate: data.last_successful_payment_date,
            recentPayments: data.recent_payments
          });
        }

        if (data.days_since_last_payment > 3) {
          const trackId = `track_${Date.now()}_${creatorId}`;
          const existingTrack = activeTracks.find(t => t.creatorId === creatorId);
          
          if (!existingTrack) {
            const newTrack: PaymentTrack = {
              id: trackId,
              creatorId: creatorId!,
              amountOwed: data.current_balance,
              daysDelayed: data.days_since_last_payment,
              currentStage: getStageFromDays(data.days_since_last_payment),
              issueType: data.bank_status === 'unlinked' ? IssueType.MELON_DISCONNECT : IssueType.INSUFFICIENT_FUNDS,
              logs: [{ id: `log_${Date.now()}`, timestamp: new Date().toISOString(), message: 'Automated Webhook Sync Detection.', type: 'automation' }]
            };
            await setDoc(doc(db, 'melonPayments', trackId), newTrack);
          }
        }
      }
      setLastSyncedAt(new Date().toISOString());
    } catch (error) {
      console.error("Ingestion Error:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const triggerManualSync = () => {
    const mock = {
      creators: creators.map(c => ({
        melon_split_id: c.melonSplitId,
        name: c.realName,
        bank_status: c.bankStatus,
        split_percentage: c.splitPercentage,
        current_balance: 100,
        days_since_last_payment: 5,
        recent_payments: []
      }))
    };
    processSyncPayload(mock as any);
  };

  const handleVerifyPayment = async (trackId: string, method: ManualPaymentMethod) => {
    const track = activeTracks.find(t => t.id === trackId);
    if (!track) return;
    const creator = creators.find(c => c.id === track.creatorId);
    if (creator) {
      await updateDoc(doc(db, 'creators', creator.id), {
        totalPaid: (creator.totalPaid || 0) + track.amountOwed,
        lastSuccessfulPaymentDate: new Date().toISOString()
      });
    }
    await deleteDoc(doc(db, 'melonPayments', trackId));
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dash': return <Dashboard creators={creators} tracks={activeTracks} />;
      case 'clients': return <ClientDirectory creators={creators} setCreators={() => {}} tracks={activeTracks} />;
      case 'monitor': return <DeescalationMonitor tracks={activeTracks} creators={creators} onVerify={handleVerifyPayment} />;
      case 'analytics': return <Analytics creators={creators} tracks={activeTracks} />;
      case 'settings': return <Settings lastSyncedAt={lastSyncedAt} onSyncTrigger={triggerManualSync} isSyncing={isSyncing} />;
      default: return <Dashboard creators={creators} tracks={activeTracks} />;
    }
  };

  return (
    <div className="flex flex-col h-screen max-h-screen w-full bg-black text-white selection:bg-blue-500 overflow-hidden font-['SF Pro Display']">
      <header className="safe-top fixed top-0 w-full z-[100] px-4 pt-4">
        <div className="liquid-glass rounded-[2rem] px-6 py-3 flex items-center justify-between shadow-2xl shadow-blue-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center shadow-lg relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/10 to-indigo-500/10 opacity-50"></div>
              <Icons.Logo className="w-6 h-6 text-[#FF26B9] relative z-10" />
            </div>
            <div>
               <h1 className="text-[10px] font-bold tracking-tight uppercase">Promura Live</h1>
               <div className="flex items-center gap-1.5">
                  <div className={`w-1 h-1 rounded-full ${isSyncing ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`}></div>
                  <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">
                    {isSyncing ? 'Processing Webhook...' : `Synced: ${new Date(lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                  </span>
               </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
             <button onClick={() => setIsHeaderAIOpen(!isHeaderAIOpen)} className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${isHeaderAIOpen ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-white/5 border-white/10 text-zinc-400'}`}>
                <Icons.Sparkles className="w-4 h-4" />
             </button>
             <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-700 to-black flex items-center justify-center border border-white/10 shadow-lg">
                <span className="text-[10px] font-bold">JD</span>
             </div>
          </div>
        </div>
      </header>
      <HeaderInsights creators={creators} tracks={activeTracks} isOpen={isHeaderAIOpen} onClose={() => setIsHeaderAIOpen(false)} />
      <main className="flex-1 overflow-y-auto pt-[100px] pb-[100px] px-4 space-y-6 no-scrollbar">
        {renderContent()}
      </main>
      <AIChatBot creators={creators} tracks={activeTracks} />
      <nav className="ios-tab-bar liquid-glass fixed bottom-0 w-full grid grid-cols-5 pt-4 pb-8 border-t border-white/10 z-[100]">
        {[
          { id: 'dash', label: 'Dash', icon: Icons.Dashboard },
          { id: 'monitor', label: 'Alerts', icon: Icons.Alert },
          { id: 'clients', label: 'Clients', icon: Icons.Users },
          { id: 'analytics', label: 'Stats', icon: Icons.Activity },
          { id: 'settings', label: 'Gear', icon: Icons.Logo }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex flex-col items-center gap-1.5 transition-all ${isActive ? 'text-blue-400' : 'text-zinc-500'}`}>
              <tab.icon className={`w-5 h-5 ${isActive ? 'scale-110' : 'scale-100'}`} />
              <span className="text-[8px] font-black uppercase tracking-[0.1em]">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default App;
