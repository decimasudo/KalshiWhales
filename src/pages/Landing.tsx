import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, TrendingUp, Bell, Eye, Users, BarChart3, Zap, Shield, 
  CheckCircle, ArrowRight, X, Terminal, Cpu, Globe, Bot 
} from 'lucide-react';
import { motion, useMotionTemplate, useMotionValue } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

// --- VISUAL UTILITIES (Ported from Enigma Protocol) ---

const SpotlightOverlay = () => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    const handleMouseMove = ({ clientX, clientY }: MouseEvent) => {
      mouseX.set(clientX);
      mouseY.set(clientY);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  const background = useMotionTemplate`
    radial-gradient(
      800px circle at ${mouseX}px ${mouseY}px,
      rgba(0, 224, 208, 0.06),
      transparent 80%
    )
  `;

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-30 transition-opacity duration-300"
      style={{ background }}
    />
  );
};

const CoordinateLabel = ({ x, y, className = "" }: { x: number; y: number; className?: string }) => (
  <div className={`absolute font-mono text-[9px] tracking-[0.2em] text-accent-500/60 pointer-events-none select-none ${className}`}>
    X:{x} <span className="mx-1"></span> Y:{y}
  </div>
);

const GlowLine = ({ vertical = false, delay = 0, duration = 4 }: { vertical?: boolean; delay?: number; duration?: number }) => (
  <div className={`absolute bg-accent-500/10 ${vertical ? 'w-px h-full' : 'h-px w-full'} overflow-hidden pointer-events-none z-0`}>
    <motion.div
      initial={{ [vertical ? 'y' : 'x']: '-100%' }}
      animate={{ [vertical ? 'y' : 'x']: '100%' }}
      transition={{ duration, repeat: Infinity, ease: "linear", delay }}
      className={`absolute bg-accent-500 ${vertical ? 'w-px h-48' : 'h-px w-48'} shadow-[0_0_25px_4px_rgba(0,224,208,0.5)]`}
    />
  </div>
);

// Interactive Card with Teal Glow
const InteractiveCard = ({ children, className = "" }: any) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setOpacity(1);
  };

  const handleMouseLeave = () => setOpacity(0);

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative group bg-[#050A0A] border border-neutral-800 overflow-hidden ${className}`}
    >
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300 z-10"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(0, 224, 208, 0.3), transparent 40%)`,
        }}
      />
      <div className="relative z-20 h-full">
        {children}
      </div>
    </div>
  );
};

const StatTicker = ({ label, value }: { label: string, value: string }) => (
  <div className="flex flex-col justify-center border-r border-neutral-800 p-6 last:border-r-0 hover:bg-accent-500/5 transition-colors group h-full">
    <span className="text-[9px] font-mono text-neutral-500 mb-1 tracking-widest uppercase group-hover:text-accent-400 transition-colors">{label}</span>
    <span className="text-xl md:text-2xl font-display font-medium text-white group-hover:text-accent-500 transition-colors">{value}</span>
  </div>
);

// --- MAIN LANDING COMPONENT ---

interface LandingProps {
  onShowAuth: () => void;
}

export default function Landing({ onShowAuth }: LandingProps) {
  const navigate = useNavigate();
  const { signIn, signUp, continueAsGuest } = useAuth();
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
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestEntry = () => {
    continueAsGuest();
    navigate('/dashboard');
  };

  const features = [
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: 'WHALE_TRACKING',
      description: 'Real-time surveillance of top Polymarket performers with >70% win rates.',
      code: "0x1"
    },
    {
      icon: <Bell className="h-6 w-6" />,
      title: 'SIGNAL_ALERTS',
      description: 'Instant Telegram notifications when tracked wallets execute new positions.',
      code: "0x2"
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: 'RISK_ANALYSIS',
      description: 'Deep dive analytics into win rates, profit factors, and drawdown metrics.',
      code: "0x3"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: 'SOCIAL_SENTIMENT',
      description: 'Correlate on-chain betting volume with social sentiment signals.',
      code: "0x4"
    }
  ];

  return (
    <div className="bg-[#000202] text-text-primary min-h-screen font-body relative overflow-x-hidden selection:bg-accent-500/30 selection:text-white">
      <SpotlightOverlay />

      {/* --- HEADER --- */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#000202]/80 backdrop-blur-md border-b border-neutral-800">
        <CoordinateLabel x={0} y={0} className="top-2 left-4" />
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3 group cursor-pointer" onClick={() => window.scrollTo(0,0)}>
            <div className="relative">
              <div className="absolute -inset-2 bg-accent-500/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity rounded-full"/>
              <img src="/logo.jpeg" alt="KalshiWhales" className="w-8 h-8 rounded relative z-10" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-white group-hover:text-accent-500 transition-colors">
              KALSHI<span className="text-accent-500">WHALES</span>
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}
              className="text-xs font-mono uppercase tracking-widest text-neutral-400 hover:text-white transition-colors"
            >
              Login
            </button>
            <button
              onClick={() => { setAuthMode('signup'); setShowAuthModal(true); }}
              className="px-6 py-2 bg-accent-500/10 border border-accent-500/50 text-accent-500 rounded-sm font-mono text-xs uppercase tracking-widest hover:bg-accent-500/20 transition-all shadow-[0_0_15px_rgba(0,224,208,0.1)]"
            >
              Sign Up
            </button>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative min-h-screen pt-32 pb-20 border-b border-neutral-800 flex flex-col justify-center overflow-hidden">
        {/* Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,224,208,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,224,208,0.03)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />
        
        {/* Animated Glow Lines */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-[15%] h-full w-px"><GlowLine vertical duration={8} /></div>
          <div className="absolute right-[25%] h-full w-px"><GlowLine vertical delay={4} duration={10} /></div>
          <div className="absolute top-[40%] w-full h-px"><GlowLine delay={2} duration={12} /></div>
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-accent-500/5 border border-accent-500/20 rounded-full mb-8">
              <span className="w-1.5 h-1.5 bg-accent-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-mono text-accent-500 tracking-widest uppercase">System Online • v2.0.4</span>
            </div>

            <h1 className="text-6xl md:text-8xl font-display font-bold tracking-tighter text-white mb-6 leading-none">
              TRACK THE <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-accent-400 to-accent-600 drop-shadow-[0_0_30px_rgba(0,224,208,0.3)]">
                SMART MONEY
              </span>
            </h1>

            <p className="text-lg md:text-xl text-neutral-400 font-light mb-12 max-w-2xl mx-auto leading-relaxed">
              De-anonymize Polymarket whales. Analyze betting patterns, copy-trade top performers, and get <span className="text-accent-500">instant alerts</span> on high-conviction plays.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <button 
                onClick={() => { setAuthMode('signup'); setShowAuthModal(true); }}
                className="group relative px-8 py-4 bg-white text-black font-mono text-xs font-bold uppercase tracking-[0.2em] hover:bg-accent-400 transition-all w-full sm:w-auto"
              >
                <div className="flex items-center gap-3">
                  <Zap className="w-4 h-4" />
                  <span>Start Tracking</span>
                </div>
              </button>

              <button 
                onClick={handleGuestEntry}
                className="group px-8 py-4 bg-transparent border border-neutral-700 text-neutral-300 font-mono text-xs uppercase tracking-[0.2em] hover:border-accent-500 hover:text-accent-500 transition-all w-full sm:w-auto flex items-center justify-center gap-3"
              >
                <span>Enter as Guest</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Ticker at Bottom */}
        <div className="absolute bottom-0 left-0 w-full h-24 border-t border-neutral-800 bg-[#000202]/80 backdrop-blur-md z-20 hidden md:block">
          <div className="container mx-auto h-full grid grid-cols-4">
            <StatTicker label="TRACKED WALLETS" value="500+" />
            <StatTicker label="TOTAL VOLUME" value="$2M+" />
            <StatTicker label="ACTIVE ALERTS" value="10K+" />
            <StatTicker label="SYSTEM STATUS" value="OPERATIONAL" />
          </div>
        </div>
      </section>

      {/* --- FEATURES GRID --- */}
      <section className="py-32 bg-[#000202] relative">
        <CoordinateLabel x={12} y={45} className="top-10 left-10" />
        
        <div className="container mx-auto px-6">
          <div className="mb-16 border-l border-accent-500/30 pl-8">
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
              SYSTEM <span className="text-neutral-600">CAPABILITIES</span>
            </h2>
            <p className="text-neutral-400 font-mono text-xs tracking-widest uppercase">
              // Advanced surveillance tools for prediction markets
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, idx) => (
              <InteractiveCard key={idx} className="min-h-[280px]">
                <div className="p-8 h-full flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-8">
                      <div className="w-12 h-12 bg-accent-500/10 flex items-center justify-center border border-accent-500/20 rounded-sm">
                        <span className="text-accent-500">{feature.icon}</span>
                      </div>
                      <span className="text-[10px] font-mono text-neutral-600 border border-neutral-800 px-2 py-1 rounded bg-[#030505]">
                        {feature.code}
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-bold text-white mb-3 font-display">{feature.title}</h3>
                    <p className="text-neutral-400 text-sm leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </InteractiveCard>
            ))}
          </div>
        </div>
      </section>

      {/* --- SAMPLE DATA PREVIEW --- */}
      <section className="py-24 border-y border-neutral-800 bg-[#050A0A] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,224,208,0.03),transparent_70%)]" />
        
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-center gap-2 mb-12">
            <Terminal className="w-5 h-5 text-accent-500" />
            <span className="text-xs font-mono text-accent-500 tracking-[0.2em] uppercase">Live Data Feed</span>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { name: 'fengdubiying', profit: '+$2.96M', win: '73.5%' },
              { name: 'yatsen', profit: '+$1.85M', win: '68.2%' },
              { name: 'scottilicious', profit: '+$1.46M', win: '71.8%' }
            ].map((trader, i) => (
              <div key={i} className="bg-[#020404] border border-neutral-800 p-6 relative group hover:border-accent-500/50 transition-colors">
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-accent-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 bg-neutral-800 rounded-full flex items-center justify-center text-white font-bold">
                    {trader.name[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="font-display font-bold text-white">{trader.name}</div>
                    <div className="text-[10px] font-mono text-neutral-500">WHALE_ID_0{i+1}</div>
                  </div>
                </div>
                
                <div className="flex justify-between items-end border-t border-neutral-800 pt-4">
                  <div>
                    <div className="text-[10px] text-neutral-500 uppercase font-mono">Profit</div>
                    <div className="text-lg font-bold text-semantic-success">{trader.profit}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-neutral-500 uppercase font-mono">Win Rate</div>
                    <div className="text-accent-500 font-mono">{trader.win}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <p className="text-xs font-mono text-neutral-500 mb-6">PREVIEW_MODE // AUTHENTICATE FOR FULL ACCESS</p>
            <button 
              onClick={handleGuestEntry}
              className="text-white border-b border-accent-500 pb-1 hover:text-accent-500 transition-colors text-sm uppercase tracking-widest"
            >
              Access Dashboard as Guest
            </button>
          </div>
        </div>
      </section>

      {/* --- AUTH MODAL --- */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowAuthModal(false)}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#050A0A] border border-accent-500/30 w-full max-w-md p-8 relative shadow-[0_0_50px_rgba(0,224,208,0.1)]"
            onClick={(e) => e.stopPropagation()}
          >
            <CoordinateLabel x={10} y={10} className="top-2 left-2" />
            <button 
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-2xl font-display font-bold text-white mb-2 uppercase">
              {authMode === 'login' ? 'System Access' : 'Initialize Account'}
            </h2>
            <p className="text-neutral-400 text-xs font-mono mb-8">
              {authMode === 'login' ? 'Enter credentials to decrypt dashboard.' : 'Create a new identity on the protocol.'}
            </p>

            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono text-accent-500 uppercase mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black border border-neutral-800 text-white p-3 font-mono text-sm focus:border-accent-500 focus:outline-none transition-colors placeholder-neutral-700"
                  placeholder="USER@DOMAIN.COM"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-accent-500 uppercase mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black border border-neutral-800 text-white p-3 font-mono text-sm focus:border-accent-500 focus:outline-none transition-colors placeholder-neutral-700"
                  placeholder="••••••••"
                  required
                />
              </div>

              {error && (
                <div className="p-3 bg-red-900/20 border border-red-500/30 text-red-400 text-xs font-mono">
                  ERROR: {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-accent-500 text-black font-bold font-mono text-xs uppercase tracking-widest hover:bg-accent-400 transition-colors flex items-center justify-center gap-2 mt-4"
              >
                {loading ? (
                  <span className="animate-pulse">PROCESSING...</span>
                ) : (
                  <>
                    <span>{authMode === 'login' ? 'Decrypt & Enter' : 'Register Identity'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                className="text-xs font-mono text-neutral-500 hover:text-white transition-colors"
              >
                {authMode === 'login' ? 'NO ACCOUNT? INITIALIZE' : 'ALREADY REGISTERED? LOGIN'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}