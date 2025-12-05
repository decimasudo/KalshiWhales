import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { TrackedWallet, BettingActivity, RecommendedTrader } from '../types';
import WalletCard from '../components/WalletCard';
import AddWalletForm from '../components/AddWalletForm';
import ActivityFeed from '../components/ActivityFeed';
import RecommendedTraderCard from '../components/RecommendedTraderCard';
import { Activity, Wallet, Plus, LogOut, User, TrendingUp, Twitter, Github, Terminal } from 'lucide-react';

type TabType = 'wallets' | 'recommended';

// Enigma Design System Components
const CoordinateLabel = ({ x, y }: { x: number; y: number }) => (
  <div className="absolute text-[9px] font-mono text-accent-500/40 tracking-widest pointer-events-none select-none">
    X:{x} Y:{y}
  </div>
);

export default function Dashboard() {
  const { user, signOut, isGuest } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('wallets');
  const [wallets, setWallets] = useState<TrackedWallet[]>([]);
  const [activities, setActivities] = useState<BettingActivity[]>([]);
  const [recommendedTraders, setRecommendedTraders] = useState<RecommendedTrader[]>([]);

  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetchWallets();
    fetchActivities();
    fetchRecommendedTraders();

    const walletsSubscription = supabase
      .channel('tracked_wallets_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tracked_wallets' }, () => fetchWallets())
      .subscribe();

    const activitiesSubscription = supabase
      .channel('betting_activities_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'betting_activities' }, () => fetchActivities())
      .subscribe();

    return () => {
      walletsSubscription.unsubscribe();
      activitiesSubscription.unsubscribe();
    };
  }, [user]);

  const fetchWallets = async () => {
    try {
      if (!user) {
        setWallets([]); 
        return;
      }
      const { data, error } = await supabase
        .from('tracked_wallets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setWallets(data || []);
    } catch (error) {
      console.error('Error fetching wallets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivities = async () => {
    try {
      // For guests, we can show generic activities or empty state
      // For simplicity in this pivot, we will show activities related to recommended traders if user has no wallets
      const { data, error } = await supabase
        .from('betting_activities')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(20);

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  const fetchRecommendedTraders = async () => {
    try {
      const { data, error } = await supabase
        .from('recommended_traders')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      if (error) throw error;
      setRecommendedTraders(data || []);
    } catch (error) {
      console.error('Error fetching recommended traders:', error);
    }
  };

  const handleAddWallet = async (walletAddress: string, label?: string) => {
    try {
      if (isGuest) {
        alert('GUEST_MODE_RESTRICTION: Please login to track specific wallets.');
        return;
      }
      if (!user) return;

      const { error } = await supabase
        .from('tracked_wallets')
        .insert([{
          user_id: user.id,
          wallet_address: walletAddress,
          label: label,
          chain_id: 137
        }]);

      if (error) throw error;
      setShowAddForm(false);
      fetchWallets();
    } catch (error) {
      console.error('Error adding wallet:', error);
      alert('Failed to add wallet.');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleDeleteWallet = async (id: string) => {
    if (!confirm('CONFIRM DELETION: Terminate tracking for this target?')) return;
    try {
      const { error } = await supabase
        .from('tracked_wallets')
        .delete()
        .eq('id', id);
      if (error) throw error;
      fetchWallets();
    } catch (error) {
      console.error('Error deleting wallet:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#000202] flex items-center justify-center">
        <div className="text-accent-500 font-mono text-xs animate-pulse">SYSTEM_LOADING...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#000202] text-text-primary font-body pb-12 relative">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,224,208,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,224,208,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none fixed" />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#000202]/90 backdrop-blur-md border-b border-neutral-800 h-16">
        <div className="container mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-accent-500/10 flex items-center justify-center rounded-sm border border-accent-500/20">
              <Terminal className="w-4 h-4 text-accent-500" />
            </div>
            <h1 className="font-display font-bold text-lg tracking-tight text-white">
              KALSHI<span className="text-accent-500">WHALES</span>
              <span className="text-[10px] font-mono text-neutral-500 ml-2">DASHBOARD_V2</span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-[10px] font-mono text-neutral-500 border-r border-neutral-800 pr-4">
              <User className="w-3 h-3" />
              <span>{isGuest ? 'GUEST_SESSION' : user?.email}</span>
            </div>
            
            {!isGuest && (
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-accent-500/10 border border-accent-500/30 text-accent-500 text-[10px] font-mono uppercase hover:bg-accent-500/20 transition-all"
              >
                <Plus className="w-3 h-3" />
                <span>Add Target</span>
              </button>
            )}

            <button onClick={handleSignOut} className="text-neutral-500 hover:text-white transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 relative z-10">
        <CoordinateLabel x={10} y={120} />

        {/* Guest Banner */}
        {isGuest && (
          <div className="mb-8 p-4 border border-accent-500/30 bg-accent-500/5 rounded-sm flex items-start gap-3">
            <Activity className="w-5 h-5 text-accent-500 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-white font-display uppercase">Restricted Access Mode</h3>
              <p className="text-xs text-neutral-400 mt-1">
                You are viewing the dashboard as a guest. Personal wallet tracking is disabled. 
                <button onClick={handleSignOut} className="text-accent-500 hover:underline ml-1">Login to upgrade.</button>
              </p>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-800 mb-8">
          <button
            onClick={() => setActiveTab('wallets')}
            className={`px-6 py-3 text-xs font-mono uppercase tracking-widest border-b-2 transition-all ${
              activeTab === 'wallets' 
                ? 'border-accent-500 text-accent-500 bg-accent-500/5' 
                : 'border-transparent text-neutral-500 hover:text-white'
            }`}
          >
            My Targets [{wallets.length}]
          </button>
          <button
            onClick={() => setActiveTab('recommended')}
            className={`px-6 py-3 text-xs font-mono uppercase tracking-widest border-b-2 transition-all ${
              activeTab === 'recommended' 
                ? 'border-accent-500 text-accent-500 bg-accent-500/5' 
                : 'border-transparent text-neutral-500 hover:text-white'
            }`}
          >
            Top Alpha [{recommendedTraders.length}]
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* LEFT: MAIN CONTENT */}
          <div className="lg:col-span-2">
            {activeTab === 'wallets' && (
              <div className="space-y-4">
                {wallets.length === 0 ? (
                  <div className="border border-dashed border-neutral-800 p-12 text-center bg-[#050A0A]">
                    <Wallet className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
                    <p className="text-neutral-500 font-mono text-xs uppercase mb-4">No targets initialized</p>
                    {!isGuest && (
                      <button onClick={() => setShowAddForm(true)} className="text-accent-500 hover:underline text-xs font-mono uppercase">
                        + Initialize Tracker
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {wallets.map((wallet) => (
                      <WalletCard key={wallet.id} wallet={wallet} onDelete={handleDeleteWallet} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'recommended' && (
              <div className="grid md:grid-cols-2 gap-4">
                {recommendedTraders.map((trader) => (
                  <RecommendedTraderCard key={trader.id} trader={trader} />
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: ACTIVITY FEED */}
          <div className="lg:col-span-1">
            <ActivityFeed activities={activities} />
          </div>
        </div>
      </main>

      {/* Add Wallet Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <AddWalletForm onSubmit={handleAddWallet} onCancel={() => setShowAddForm(false)} />
        </div>
      )}
    </div>
  );
}