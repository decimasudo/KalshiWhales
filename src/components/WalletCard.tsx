import { TrackedWallet } from '../types';
import { Wallet, Trash2, ExternalLink } from 'lucide-react';

interface WalletCardProps {
  wallet: TrackedWallet;
  onDelete: (id: string) => void;
}

export default function WalletCard({ wallet, onDelete }: WalletCardProps) {
  const shortAddress = `${wallet.wallet_address.substring(0, 6)}...${wallet.wallet_address.substring(wallet.wallet_address.length - 4)}`;
  const explorerUrl = `https://polygonscan.com/address/${wallet.wallet_address}`;

  return (
    <div className="bg-[#050A0A] border border-neutral-800 p-6 group hover:border-accent-500/50 transition-colors relative overflow-hidden">
      {/* Decorative Corner */}
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-accent-500/0 group-hover:border-accent-500/50 transition-all" />

      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-accent-500/10 border border-accent-500/20">
            <Wallet className="h-5 w-5 text-accent-500" />
          </div>
          <div>
            <h3 className="font-bold text-white font-display tracking-wide uppercase text-sm">
              {wallet.label || 'UNKNOWN_TARGET'}
            </h3>
            <code className="text-xs text-neutral-500 font-mono">{shortAddress}</code>
          </div>
        </div>
        <button
          onClick={() => onDelete(wallet.id)}
          className="text-neutral-600 hover:text-semantic-danger transition-colors p-1"
          title="Terminate Tracking"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
        <span className="text-[10px] font-mono text-neutral-600 uppercase">
          INIT: {new Date(wallet.created_at).toLocaleDateString('en-US')}
        </span>
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-1 text-[10px] font-mono text-accent-500/80 hover:text-accent-400 uppercase"
        >
          <span>Scan_Explorer</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}