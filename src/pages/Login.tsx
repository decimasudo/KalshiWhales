import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Activity, LogIn, ArrowRight, Shield, Terminal } from 'lucide-react';

// Enigma Design Component
const CoordinateLabel = ({ x, y }: { x: number; y: number }) => (
  <div className="absolute top-4 left-4 text-[9px] font-mono text-accent-500/40 tracking-widest pointer-events-none select-none">
    X:{x} Y:{y}
  </div>
);

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const { signIn, signUp, continueAsGuest } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (isSignUp) {
        await signUp(email, password);
        setMessage('IDENTITY_CREATED: Check transmission logs (email) for verification.');
        setEmail('');
        setPassword('');
      } else {
        await signIn(email, password);
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'ACCESS_DENIED');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestAccess = () => {
    continueAsGuest();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#000202] text-text-primary font-body flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,224,208,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,224,208,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      
      <div className="w-full max-w-md bg-[#050A0A] border border-accent-500/30 relative z-10 shadow-[0_0_50px_rgba(0,224,208,0.1)] p-8">
        <CoordinateLabel x={12} y={88} />

        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-accent-500/10 flex items-center justify-center rounded-sm border border-accent-500/20 mb-4">
            <Terminal className="w-6 h-6 text-accent-500" />
          </div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">
            KALSHI<span className="text-accent-500">WHALES</span>
          </h1>
          <p className="text-xs font-mono text-neutral-500 mt-2 uppercase tracking-widest">
            Restricted Access Terminal
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] font-mono text-accent-500 uppercase mb-2">Identifier (Email)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black border border-neutral-800 text-white p-3 font-mono text-sm focus:border-accent-500 focus:outline-none transition-colors placeholder-neutral-700"
              placeholder="OPERATOR@SYSTEM"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono text-accent-500 uppercase mb-2">Access Key (Password)</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black border border-neutral-800 text-white p-3 font-mono text-sm focus:border-accent-500 focus:outline-none transition-colors placeholder-neutral-700"
              placeholder="••••••••"
              required
              minLength={6}
              disabled={loading}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-900/20 border border-red-500/30 text-red-400 text-xs font-mono">
              ERROR: {error}
            </div>
          )}

          {message && (
            <div className="p-3 bg-green-900/20 border border-green-500/30 text-green-400 text-xs font-mono">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-accent-500 text-black font-bold font-mono text-xs uppercase tracking-widest hover:bg-accent-400 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="animate-pulse">AUTHENTICATING...</span>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>{isSignUp ? 'INITIALIZE IDENTITY' : 'DECRYPT SESSION'}</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 flex flex-col gap-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-neutral-800"></span></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#050A0A] px-2 text-neutral-600 font-mono">Alternative Access</span></div>
          </div>

          <button
            onClick={handleGuestAccess}
            className="w-full py-3 border border-neutral-700 text-neutral-300 font-mono text-xs uppercase tracking-widest hover:border-accent-500 hover:text-accent-500 transition-colors flex items-center justify-center gap-2"
          >
            <Shield className="w-4 h-4" />
            <span>Enter as Guest</span>
          </button>

          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
              setMessage('');
            }}
            className="text-xs font-mono text-neutral-500 hover:text-white transition-colors text-center mt-2"
          >
            {isSignUp
              ? 'ALREADY REGISTERED? LOGIN'
              : 'NO CREDENTIALS? SIGN UP'}
          </button>
        </div>
      </div>
    </div>
  );
}