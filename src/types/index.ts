export interface TrackedWallet {
  id: string;
  user_id?: string;
  wallet_address: string;
  label?: string;
  chain_id: number;
  telegram_chat_id?: number;
  created_at: string;
  updated_at: string;
}

export interface BettingActivity {
  id: string;
  wallet_address: string;
  market_id: string;
  event_type: string;
  side?: string;
  amount?: number;
  price?: number;
  outcome?: string;
  status?: string;
  tx_hash?: string;
  timestamp: string;
  created_at: string;
}

export interface UserPreference {
  id: string;
  user_id: string;
  notification_enabled: boolean;
  alert_threshold: number;
  notification_channels: {
    telegram: boolean;
    email: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface TelegramSubscription {
  id: string;
  user_id?: string;
  telegram_chat_id: number;
  telegram_username?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecommendedTrader {
  id: string;
  trader_wallet: string;
  trader_name: string;
  profile_image_url: string;
  total_profit: number;
  past_month_profit: number;
  win_rate: number;
  total_trades: number;
  description: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Watchlist {
  id: string;
  user_id: string;
  wallet_address: string;
  added_at: string;
  notes?: string;
}
