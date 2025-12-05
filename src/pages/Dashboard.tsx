import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { TrackedWallet, BettingActivity, RecommendedTrader } from '../types';
import WalletCard from '../components/WalletCard';
import AddWalletForm from '../components/AddWalletForm';
import ActivityFeed from '../components/ActivityFeed';
import RecommendedTraderCard from '../components/RecommendedTraderCard';
import { Activity, Wallet, Plus, LogOut, User, TrendingUp, Twitter, Github } from 'lucide-react';

type TabType = 'wallets' | 'recommended';

export default function Dashboard() {
  const { user, signOut } = useAuth();
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

    // Subscribe to real-time updates
    const walletsSubscription = supabase
      .channel('tracked_wallets_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tracked_wallets' }, () => {
        fetchWallets();
      })
      .subscribe();

    const activitiesSubscription = supabase
      .channel('betting_activities_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'betting_activities' }, () => {
        fetchActivities();
      })
      .subscribe();

    return () => {
      walletsSubscription.unsubscribe();
      activitiesSubscription.unsubscribe();
    };
  }, []);

  const fetchWallets = async () => {
    try {
      if (!user) return;
      
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
      if (!user) return;
      
      const { data: userWallets } = await supabase
        .from('tracked_wallets')
        .select('wallet_address')
        .eq('user_id', user.id);

      if (!userWallets || userWallets.length === 0) {
        setActivities([]);
        return;
      }

      const walletAddresses = userWallets.map(w => w.wallet_address);

      const { data, error } = await supabase
        .from('betting_activities')
        .select('*')
        .in('wallet_address', walletAddresses)
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
      if (!user) {
        alert('You must be logged in to add wallets');
        return;
      }

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
      alert('Failed to add wallet. Please try again.');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleDeleteWallet = async (id: string) => {
    if (!confirm('Are you sure you want to stop tracking this wallet?')) return;

    try {
      const { error } = await supabase
        .from('tracked_wallets')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchWallets();
    } catch (error) {
      console.error('Error deleting wallet:', error);
      alert('Failed to delete wallet. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-body text-text-secondary">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="header-dark sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-full">
            <div className="nav-logo">
              <div className="nav-logo-icon">
                <Activity className="h-6 w-6 text-cyan-electric" />
              </div>
              <h1 className="nav-logo-text">PolyWhales</h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4 flex-wrap gap-2">
              <div className="flex items-center space-x-2 text-sm text-text-secondary hidden sm:flex">
                <User className="h-4 w-4" />
                <span className="font-mono">{user?.email}</span>
              </div>
              <span className="text-sm text-text-tertiary hidden sm:inline">
                {wallets.length} wallet{wallets.length !== 1 ? 's' : ''} tracked
              </span>
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center space-x-2 btn-primary"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Wallet</span>
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 text-text-secondary hover:text-text-primary transition-colors"
                title="Sign Out"
              >
                <LogOut className="h-5 w-5" />
              </button>
              <a href="https://x.com/Polywhalesai" target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-cyan-electric transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="https://github.com/Demerzels-lab/polywhales-platform" target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-cyan-electric transition-colors">
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Banner */}
        <div className="bg-navy-elevated border-l-4 border-cyan-electric p-4 mb-8 rounded-r-lg shadow-card">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Wallet className="h-5 w-5 text-cyan-electric" />
            </div>
            <div className="ml-3">
              <p className="text-body text-text-primary">
                Track Polymarket traders and get instant alerts via Telegram bot{' '}
                <a
                  href="https://t.me/PolyWhales_bot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold underline hover:text-cyan-electric transition-colors"
                >
                  @PolyWhales_bot
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="card-dark mb-6">
          <div className="tab-nav">
            <button
              onClick={() => setActiveTab('wallets')}
              className={`tab-button ${activeTab === 'wallets' ? 'data-[active=true]' : ''}`}
              data-active={activeTab === 'wallets'}
            >
              <div className="flex items-center justify-center space-x-2">
                <Wallet className="h-4 w-4" />
                <span>My Wallets</span>
                <span className="bg-navy-accent-dark text-cyan-electric px-2 py-0.5 rounded-full text-xs">
                  {wallets.length}
                </span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('recommended')}
              className={`tab-button ${activeTab === 'recommended' ? 'data-[active=true]' : ''}`}
              data-active={activeTab === 'recommended'}
            >
              <div className="flex items-center justify-center space-x-2">
                <TrendingUp className="h-4 w-4" />
                <span>Recommended Traders</span>
                <span className="bg-navy-accent-dark text-cyan-electric px-2 py-0.5 rounded-full text-xs">
                  {recommendedTraders.length}
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Add Wallet Form Modal */}
        {showAddForm && (
          <div className="modal-overlay" onClick={() => setShowAddForm(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <AddWalletForm
                onSubmit={handleAddWallet}
                onCancel={() => setShowAddForm(false)}
              />
            </div>
          </div>
        )}

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2">
            {/* My Wallets Tab */}
            {activeTab === 'wallets' && (
              <div>
                <h2 className="text-h2 text-text-primary mb-4">Tracked Wallets</h2>
                {wallets.length === 0 ? (
                  <div className="card-dark p-8 text-center">
                    <Wallet className="h-12 w-12 text-text-muted mx-auto mb-4" />
                    <p className="text-body text-text-secondary mb-4">No wallets tracked yet</p>
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="btn-primary inline-flex items-center space-x-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Your First Wallet</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {wallets.map((wallet) => (
                      <WalletCard
                        key={wallet.id}
                        wallet={wallet}
                        onDelete={handleDeleteWallet}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Recommended Traders Tab */}
            {activeTab === 'recommended' && (
              <div>
                <h2 className="text-h2 text-text-primary mb-4">Top Performers</h2>
                <p className="text-body text-text-secondary mb-6">
                  Watch these top-performing traders to get notified about their activities
                </p>
                {recommendedTraders.length === 0 ? (
                  <div className="card-dark p-8 text-center">
                    <TrendingUp className="h-12 w-12 text-text-muted mx-auto mb-4" />
                    <p className="text-body text-text-secondary">No recommended traders available</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recommendedTraders.map((trader) => (
                      <RecommendedTraderCard
                        key={trader.id}
                        trader={trader}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Activity Feed - Always visible */}
          <div className="lg:col-span-1">
            <h2 className="text-h2 text-text-primary mb-4">Recent Activity</h2>
            <ActivityFeed activities={activities} />
          </div>
        </div>
      </main>
    </div>
  );
}