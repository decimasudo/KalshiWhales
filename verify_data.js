import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://bpbtgkunrdzcoyfdhskh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwYnRna3VucmR6Y295ZmRoc2toIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5MjAzNzUsImV4cCI6MjA3ODQ5NjM3NX0.ZAtjUoDnIWUOs6Os1NUGKIRUQVOuXDlaCJ4HwQqZu50'
);

async function verifyTradersData() {
  try {
    // Check recommended_traders table
    console.log('=== RECOMMENDED TRADERS DATA ===');
    const { data: traders, error: tradersError } = await supabase
      .from('recommended_traders')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (tradersError) {
      console.error('Error fetching traders:', tradersError);
    } else {
      traders.forEach(trader => {
        console.log(`${trader.trader_name}: ${trader.trader_wallet} - ${trader.description}`);
        console.log(`  Profit: ${trader.total_profit}, Win Rate: ${trader.win_rate}%, Trades: ${trader.total_trades}`);
        console.log('');
      });
      console.log(`Total Active Traders: ${traders.length}`);
    }

    // Check trader_top_trades table
    console.log('\n=== TOP TRADES DATA ===');
    const { data: trades, error: tradesError } = await supabase
      .from('trader_top_trades')
      .select('*')
      .order('profit', { ascending: false });

    if (tradesError) {
      console.error('Error fetching trades:', tradesError);
    } else {
      console.log(`Total trades in database: ${trades.length}`);
      console.log('Sample top profitable trades:');
      trades.slice(0, 5).forEach(trade => {
        console.log(`- ${trade.trader_wallet}: ${trade.market_name} - ${trade.profit > 0 ? '+' : ''}${trade.profit}`);
      });
      
      // Group by trader wallet
      const tradesByTrader = {};
      trades.forEach(trade => {
        if (!tradesByTrader[trade.trader_wallet]) {
          tradesByTrader[trade.trader_wallet] = [];
        }
        tradesByTrader[trade.trader_wallet].push(trade);
      });
      
      console.log(`Traders with trades: ${Object.keys(tradesByTrader).length}`);
      
      // Check if each trader has at least 5 trades
      const tradersWithEnoughTrades = Object.entries(tradesByTrader).filter(([wallet, traderTrades]) => traderTrades.length >= 5);
      console.log(`Traders with 5+ trades: ${tradersWithEnoughTrades.length}`);
    }

  } catch (err) {
    console.error('Exception:', err);
  }
}

verifyTradersData();