import { useState } from 'react';
import { Activity, TrendingUp, Bell, Eye, Users, BarChart3, Zap, Shield, CheckCircle, ArrowLeft, Twitter, Github } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Waveform from '../components/Waveform';

interface LandingProps {
  onShowAuth: () => void;
}

export default function Landing({ onShowAuth }: LandingProps) {
  const { signIn, signUp } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (authMode === 'login') {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const sampleTraders = [
    {
      name: 'fengdubiying',
      profit: '$2.96M',
      monthProfit: '+$2.94M',
      winRate: '73.5%',
      isPositive: true
    },
    {
      name: 'yatsen',
      profit: '$1.85M',
      monthProfit: '+$1.82M',
      winRate: '68.2%',
      isPositive: true
    },
    {
      name: 'scottilicious',
      profit: '$1.46M',
      monthProfit: '+$1.40M',
      winRate: '71.8%',
      isPositive: true
    }
  ];

  const features = [
    {
      icon: <TrendingUp className="h-8 w-8" />,
      title: 'Top Trader Insights',
      description: 'Track performance from top performers on Polymarket with real-time metrics'
    },
    {
      icon: <Bell className="h-8 w-8" />,
      title: 'Telegram Alerts',
      description: 'Get instant notifications via Telegram bot for every trader activity'
    },
    {
      icon: <Eye className="h-8 w-8" />,
      title: 'Personal Watchlist',
      description: 'Save and monitor your favorite traders in a personal watchlist'
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: 'Performance Analytics',
      description: 'Analyze win rate, profit trends, and trading patterns in depth'
    }
  ];

  const stats = [
    { label: 'Tracked Traders', value: '500+' },
    { label: 'Total Profit Tracked', value: '$2M+' },
    { label: 'Active Users', value: '1,000+' },
    { label: 'Daily Alerts', value: '10K+' }
  ];

  return (
    <div className="min-h-screen font-primary">
      {/* Header */}
      <header className="header-dark py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-full">
            <div className="nav-logo">
              <img src="/logo.jpeg" alt="PolyWhales Logo" className="h-6 w-6" />
              <h1 className="hidden md:block nav-logo-text">PolyWhales</h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4 flex-wrap gap-y-2">
  <a href="https://x.com/Polywhalesai" target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-cyan-electric transition-colors">
    <Twitter className="h-5 w-5" />
  </a>
  <a href="https://github.com/Demerzels-lab/polywhales-platform" target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-cyan-electric transition-colors">
    <Github className="h-5 w-5" />
  </a>
  <button
    onClick={() => {
      setAuthMode('login');
      setShowAuthModal(true);
    }}
    className="btn-ghost text-sm sm:text-base px-2 sm:px-4"
  >
    Login
  </button>
  <button
    onClick={() => {
      setAuthMode('signup');
      setShowAuthModal(true);
    }}
    className="btn-primary text-sm sm:text-base px-2 sm:px-4"
  >
    Sign Up Free
  </button>
</div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen overflow-hidden">
        <Waveform className="opacity-80" />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-20">
            <div className="text-center">
              <h2 className="text-4xl sm:text-5xl font-bold text-text-primary mb-6">
                Track Whale Wallets on Polymarket
                <span className="block text-cyan-electric mt-2">Get Real-Time Alerts</span>
              </h2>
              <p className="text-lg sm:text-xl text-text-secondary mb-8 max-w-3xl mx-auto">
                Monitor profitable traders, analyze their strategies, and get instant notifications 
                via Telegram. Start making smarter trading decisions today.
              </p>
              <div className="flex justify-center space-x-4 flex-wrap gap-y-4">
                <button
                  onClick={() => {
                    setAuthMode('signup');
                    setShowAuthModal(true);
                  }}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Zap className="h-5 w-5" />
                  <span>Start Tracking Now</span>
                </button>
                <button
                  onClick={() => {
                    const element = document.getElementById('preview');
                    element?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="btn-secondary"
                >
                  View Demo
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mt-8 sm:mt-16">
                {stats.map((stat, index) => (
                  <div key={index} className="bg-navy-accent-dark rounded-lg shadow-md p-4 sm:p-6 border border-border-moderate">
                    <div className="text-2xl sm:text-3xl font-bold text-cyan-electric mb-2">{stat.value}</div>
                    <div className="text-sm text-text-secondary">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="stats-card">
                <div className="stats-value">{stat.value}</div>
                <div className="stats-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-navy-deep">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-h2 text-text-primary mb-4">Why Choose PolyWhales?</h3>
            <p className="text-body-lg text-text-secondary max-w-2xl mx-auto">
              Powerful tools and insights to help you track and learn from top traders
            </p>
          </div>
          <div className="grid-responsive-4">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">
                  {feature.icon}
                </div>
                <h4 className="text-h3 text-text-primary mb-2">{feature.title}</h4>
                <p className="text-body text-text-secondary">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Preview Section */}
      <section id="preview" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="preview-badge mb-4">
              <Shield className="h-4 w-4" />
              <span>PREVIEW MODE - Sample Data</span>
            </div>
            <h3 className="text-h2 text-text-primary mb-4">Sample Dashboard Preview</h3>
            <p className="text-body-lg text-text-secondary">
              See what the complete dashboard looks like with real-time data
            </p>
          </div>

          {/* Sample Traders Grid */}
          <div className="grid-responsive-3 mb-8">
            {sampleTraders.map((trader, index) => (
              <div key={index} className="card-trader">
                <div className="absolute top-4 right-4">
                  <div className="bg-navy-accent-dark text-text-tertiary px-3 py-1 rounded-full text-xs font-medium">
                    Sample
                  </div>
                </div>
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-navy-accent-dark border-2 border-border-moderate flex items-center justify-center">
                    <Users className="h-6 w-6 text-cyan-electric" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-h3 text-text-primary font-semibold">{trader.name}</h4>
                    <p className="text-small text-text-tertiary">Top Performer</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-navy-accent-dark rounded-lg p-3">
                    <span className="text-body text-text-tertiary">Total Profit</span>
                    <span className="text-h3 font-bold text-semantic-success">{trader.profit}</span>
                  </div>
                  <div className="flex justify-between items-center bg-navy-accent-dark rounded-lg p-3">
                    <span className="text-body text-text-tertiary">Past Month</span>
                    <span className="text-h3 font-bold text-semantic-success">{trader.monthProfit}</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-border-subtle">
                    <span className="text-body text-text-tertiary">Win Rate</span>
                    <span className="text-body font-semibold text-text-primary">{trader.winRate}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Call to action */}
          <div className="text-center mt-8 mb-8">
            <p className="text-body text-text-secondary mb-4">Showing 6 of our top recommended traders</p>
            <div className="text-small text-text-tertiary">
              <span className="inline-flex items-center space-x-1 mr-4">
                <span className="w-2 h-2 bg-semantic-success rounded-full"></span>
                <span>Currently profitable</span>
              </span>
              <span className="inline-flex items-center space-x-1">
                <span className="w-2 h-2 bg-cyan-electric rounded-full"></span>
                <span>Real Polymarket data</span>
              </span>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={() => {
                setAuthMode('signup');
                setShowAuthModal(true);
              }}
              className="btn-primary inline-flex items-center space-x-2"
            >
              <CheckCircle className="h-5 w-5" />
              <span>Unlock Full Dashboard</span>
            </button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-navy-deep">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-h2 text-text-primary mb-6">
            Ready to Start Tracking?
          </h3>
          <p className="text-body-lg text-text-secondary mb-8">
            Join thousands of traders who are already using PolyWhales to improve their trading strategies
          </p>
          <button
            onClick={() => {
              setAuthMode('signup');
              setShowAuthModal(true);
            }}
            className="btn-primary text-lg px-12 py-4"
          >
            Create Free Account
          </button>
          <p className="text-small text-text-tertiary mt-4">
            No credit card required. Get started in seconds.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-navy-deepest text-text-tertiary py-12 border-t border-border-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="bg-navy-elevated p-2 rounded-lg shadow-glow-cyan-sm">
                  <Activity className="h-5 w-5 text-cyan-electric" />
                </div>
                <span className="text-text-primary font-bold text-lg">PolyWhales</span>
              </div>
              <p className="text-small">
                Track top Polymarket traders and get real-time alerts via Telegram.
              </p>
            </div>
            
          </div>
          <div className="border-t border-border-subtle mt-8 pt-8 text-center text-small">
            <p>2025 PolyWhales. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="modal-overlay" onClick={() => setShowAuthModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-h2 text-text-primary">
                {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
              </h3>
              <button
                onClick={() => setShowAuthModal(false)}
                className="text-text-tertiary hover:text-text-primary transition-colors p-2"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleAuth} className="space-y-6">
              <div>
                <label className="auth-label">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-dark w-full focus-glow"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <label className="auth-label">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-dark w-full focus-glow"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-semantic-danger/30 text-semantic-danger p-4 rounded-lg text-small">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <div className="loading-spinner"></div>
                ) : null}
                <span>{loading ? 'Processing...' : authMode === 'login' ? 'Login' : 'Sign Up'}</span>
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                className="text-cyan-electric hover:text-cyan-light text-small font-medium transition-colors"
              >
                {authMode === 'login' 
                  ? "Don't have an account? Sign up" 
                  : 'Already have an account? Login'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}