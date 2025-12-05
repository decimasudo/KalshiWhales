import { useState } from 'react';
import { X, Plus, Shield } from 'lucide-react';

interface AddWalletFormProps {
  onSubmit: (walletAddress: string, label?: string) => Promise<void>;
  onCancel: () => void;
}

export default function AddWalletForm({ onSubmit, onCancel }: AddWalletFormProps) {
  const [walletAddress, setWalletAddress] = useState('');
  const [label, setLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!walletAddress.trim()) {
      setError('MISSING_TARGET_ADDRESS');
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress.trim())) {
      setError('INVALID_ETH_FORMAT');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(walletAddress.trim(), label.trim() || undefined);
      setWalletAddress('');
      setLabel('');
    } catch (err) {
      setError('EXECUTION_FAILED');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-[#0A0F0F] border border-accent-500/30 w-full max-w-md relative shadow-[0_0_50px_rgba(0,224,208,0.1)]">
      <div className="flex items-center justify-between mb-6 border-b border-neutral-800 pb-4">
        <h2 className="text-lg font-display font-bold text-white flex items-center gap-2">
          <Shield className="w-4 h-4 text-accent-500" />
          NEW_TARGET_TRACKING
        </h2>
        <button
          onClick={onCancel}
          className="text-neutral-500 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[10px] font-mono text-accent-500 uppercase mb-2">
            Target Address <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            placeholder="0x..."
            className="w-full bg-black border border-neutral-800 text-white p-3 font-mono text-sm focus:border-accent-500 focus:outline-none transition-colors"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-[10px] font-mono text-accent-500 uppercase mb-2">
            Designation Label
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. WHALE_ALPHA_01"
            className="w-full bg-black border border-neutral-800 text-white p-3 font-mono text-sm focus:border-accent-500 focus:outline-none transition-colors"
            disabled={loading}
          />
        </div>

        {error && (
          <div className="bg-red-900/10 border border-red-500/30 p-3 text-xs font-mono text-red-400">
            ERROR: {error}
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 border border-neutral-700 text-neutral-400 font-mono text-xs uppercase hover:bg-neutral-800 transition-colors"
          >
            Abort
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 bg-accent-500 text-black font-bold font-mono text-xs uppercase hover:bg-accent-400 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? 'Initializing...' : (
              <>
                <Plus className="w-3 h-3" />
                <span>Engage Tracker</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}