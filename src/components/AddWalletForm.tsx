import { useState } from 'react';
import { X } from 'lucide-react';

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

    // Validate wallet address
    if (!walletAddress.trim()) {
      setError('Please enter a wallet address');
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress.trim())) {
      setError('Invalid Ethereum address format');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(walletAddress.trim(), label.trim() || undefined);
      setWalletAddress('');
      setLabel('');
    } catch (err) {
      setError('Failed to add wallet. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-navy-accent-dark rounded-lg border border-border-moderate">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-h3 font-semibold text-text-primary">Add Wallet to Track</h2>
        <button
          onClick={onCancel}
          className="text-text-tertiary hover:text-text-primary transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="walletAddress" className="block text-body font-medium text-text-primary mb-1">
            Wallet Address <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="walletAddress"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            placeholder="0x..."
            className="w-full px-4 py-2 border border-border-moderate rounded-lg bg-navy-accent-dark text-text-primary focus:ring-2 focus:ring-cyan-electric focus:border-transparent"
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="label" className="block text-body font-medium text-text-primary mb-1">
            Label (Optional)
          </label>
          <input
            type="text"
            id="label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g., Top Trader, Whale #1"
            className="w-full px-4 py-2 border border-border-moderate rounded-lg bg-navy-accent-dark text-text-primary focus:ring-2 focus:ring-cyan-electric focus:border-transparent"
            disabled={loading}
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-body text-red-600">{error}</p>
          </div>
        )}

        <div className="flex items-center space-x-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-cyan-electric text-text-primary px-4 py-2 rounded-lg hover:bg-cyan-electric/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Adding...' : 'Add Wallet'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-navy-accent-dark text-text-tertiary px-4 py-2 rounded-lg hover:bg-navy-accent-dark/80 transition-colors border border-border-subtle"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}