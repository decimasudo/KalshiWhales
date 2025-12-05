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
    <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 border border-gray-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="bg-indigo-100 p-2 rounded-lg">
            <Wallet className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {wallet.label || 'Unnamed Wallet'}
            </h3>
            <code className="text-sm text-gray-500">{shortAddress}</code>
          </div>
        </div>
        <button
          onClick={() => onDelete(wallet.id)}
          className="text-gray-400 hover:text-red-600 transition-colors"
          title="Stop tracking"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <span className="text-xs text-gray-500">
          Added {new Date(wallet.created_at).toLocaleDateString('en-US')}
        </span>
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-1 text-xs text-indigo-600 hover:text-indigo-700"
        >
          <span>View on Explorer</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
