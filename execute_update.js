import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const updates = [
  {
    old_name: 'MasterTrader',
    trader_name: 'fengdubiying',
    wallet_address: '0x17db3fcd93ba12d38382a0cade24b200185c5f6d',
    total_profit: 1240000,
    past_month_profit: 185000,
    win_rate: 73.3,
    total_trades: 420,
    best_trade: 45000,
    worst_trade: -8500,
    avg_trade_size: 2952,
    largest_position: 120000,
    risk_level: 'medium'
  },
  {
    old_name: 'DiamondHands',
    trader_name: 'Mayuravarma',
    wallet_address: '0x3657862e57070b82a289b5887ec943a7c2166b14',
    total_profit: 1950000,
    past_month_profit: 245000,
    win_rate: 75.0,
    total_trades: 580,
    best_trade: 68000,
    worst_trade: -12000,
    avg_trade_size: 3362,
    largest_position: 180000,
    risk_level: 'medium'
  },
  {
    old_name: 'BullRunner',
    trader_name: 'swisstony',
    wallet_address: '0x204f72f35326db932158cba6adff0b9a1da95e14',
    total_profit: 1010000,
    past_month_profit: 142000,
    win_rate: 72.0,
    total_trades: 365,
    best_trade: 38000,
    worst_trade: -9200,
    avg_trade_size: 2767,
    largest_position: 95000,
    risk_level: 'medium'
  },
  {
    old_name: 'CryptoKing99',
    trader_name: 'Theo4',
    wallet_address: '0x9BE0C7a8EF8C9cC146c4C05C96E9A5bbf9c1A2B3',
    total_profit: 22000000,
    past_month_profit: 3200000,
    win_rate: 88.9,
    total_trades: 800,
    best_trade: 850000,
    worst_trade: -45000,
    avg_trade_size: 27500,
    largest_position: 2500000,
    risk_level: 'high'
  },
  {
    old_name: 'ProfitMachine',
    trader_name: 'Axios',
    wallet_address: '0x4D8C4aefb2C7e9a1d5c6b8e0f2a3c9d7e8f1b4c2',
    total_profit: 890000,
    past_month_profit: 125000,
    win_rate: 96.0,
    total_trades: 250,
    best_trade: 42000,
    worst_trade: -2800,
    avg_trade_size: 3560,
    largest_position: 110000,
    risk_level: 'low'
  },
  {
    old_name: 'WhaleHunter',
    trader_name: 'CryptoKiller',
    wallet_address: '0x7F9C8e0a3b5d7f2e8c4a9b1d6e0f3a8c2b5e9f1d',
    total_profit: 800000,
    past_month_profit: 115000,
    win_rate: 70.5,
    total_trades: 445,
    best_trade: 35000,
    worst_trade: -10500,
    avg_trade_size: 1798,
    largest_position: 88000,
    risk_level: 'medium'
  },
  {
    old_name: 'CryptoWizard',
    trader_name: 'AlphaTrader',
    wallet_address: '0x2A5C7e9b1d4f8a3c6e9f2b5d8a1c4f7e0b3d6c9f',
    total_profit: 650000,
    past_month_profit: 92000,
    win_rate: 68.0,
    total_trades: 520,
    best_trade: 28000,
    worst_trade: -8800,
    avg_trade_size: 1250,
    largest_position: 72000,
    risk_level: 'medium'
  },
  {
    old_name: 'SpeedTrader',
    trader_name: 'QuantKing',
    wallet_address: '0x8B2D4f6c9e0a3b5d8f1c4e7a9b2d5f8c1e4a7b0d',
    total_profit: 580000,
    past_month_profit: 78000,
    win_rate: 65.0,
    total_trades: 380,
    best_trade: 24000,
    worst_trade: -7500,
    avg_trade_size: 1526,
    largest_position: 65000,
    risk_level: 'medium'
  }
];

console.log('Starting database update...\n');

for (const update of updates) {
  const { old_name, ...updateData } = update;
  
  const { data, error } = await supabase
    .from('recommended_traders')
    .update(updateData)
    .eq('trader_name', old_name)
    .select();
  
  if (error) {
    console.error(`Error updating ${old_name}:`, error);
  } else {
    console.log(`Updated ${old_name} -> ${updateData.trader_name}`);
  }
}

console.log('\nVerifying updates...\n');
const { data: traders, error: fetchError } = await supabase
  .from('recommended_traders')
  .select('trader_name, wallet_address, total_profit, win_rate')
  .order('total_profit', { ascending: false });

if (fetchError) {
  console.error('Error fetching traders:', fetchError);
} else {
  console.log('Current traders in database:');
  traders.forEach((t, i) => {
    console.log(`${i+1}. ${t.trader_name} - $${(t.total_profit/1000000).toFixed(2)}M - ${t.win_rate}%`);
  });
}

console.log('\nUpdate completed!');
