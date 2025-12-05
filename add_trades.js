import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://bpbtgkunrdzcoyfdhskh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwYnRna3VucmR6Y295ZmRoc2toIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjkyMDM3NSwiZXhwIjoyMDc4NDk2Mzc1fQ.I4fylg77EIIbIRghOQiHvvfBVRYKrr9Df-AiQY7wAOk'
);

async function addMoreTrades() {
  try {
    // Define additional trades for each trader
    const additionalTrades = [
      // fengdubiying trades
      {
        trader_wallet: '0x17db3fcd93ba12d38382a0cade24b200185c5f6d',
        market_name: 'Tesla Q4 2024 earnings beat expectations',
        profit: 45000,
        position: 'BUY',
        amount: 15000,
        trade_date: '2024-10-25'
      },
      {
        trader_wallet: '0x17db3fcd93ba12d38382a0cade24b200185c5f6d',
        market_name: 'Ethereum gas fees below 10 gwei in Q4',
        profit: 32000,
        position: 'BUY',
        amount: 12000,
        trade_date: '2024-10-20'
      },

      // Mayuravarma trades (additional)
      {
        trader_wallet: '0x3657862e57070b82a289b5887ec943a7c2166b14',
        market_name: 'Fed cuts interest rates in December 2024',
        profit: 78000,
        position: 'BUY',
        amount: 25000,
        trade_date: '2024-11-01'
      },
      {
        trader_wallet: '0x3657862e57070b82a289b5887ec943a7c2166b14',
        market_name: 'US GDP growth exceeds 3% in Q3',
        profit: 56000,
        position: 'BUY',
        amount: 18000,
        trade_date: '2024-10-28'
      },

      // swisstony trades (additional)
      {
        trader_wallet: '0x204f72f35326db932158cba6adff0b9a1da95e14',
        market_name: 'NBA champion Lakers vs Warriors finals',
        profit: 67000,
        position: 'BUY',
        amount: 22000,
        trade_date: '2024-11-03'
      },
      {
        trader_wallet: '0x204f72f35326db932158cba6adff0b9a1da95e14',
        market_name: 'FIFA World Cup 2026 ticket sales hit record',
        profit: 41000,
        position: 'BUY',
        amount: 14000,
        trade_date: '2024-10-30'
      },

      // Axios trades (additional)
      {
        trader_wallet: '0x4D8C4aefb2C7e9a1d5c6b8e0f2a3c9d7e8f1b4c2',
        market_name: 'Apple Vision Pro adoption exceeds 1M units',
        profit: 38000,
        position: 'BUY',
        amount: 13000,
        trade_date: '2024-10-22'
      },
      {
        trader_wallet: '0x4D8C4aefb2C7e9a1d5c6b8e0f2a3c9d7e8f1b4c2',
        market_name: 'NVIDIA Q4 revenue beats by 15%',
        profit: 52000,
        position: 'BUY',
        amount: 17000,
        trade_date: '2024-10-26'
      },

      // CryptoKiller trades
      {
        trader_wallet: '0x7F9C8e0a3b5d7f2e8c4a9b1d6e0f3a8c2b5e9f1d',
        market_name: 'DeFi total value locked reaches $200B',
        profit: 29000,
        position: 'BUY',
        amount: 10000,
        trade_date: '2024-10-18'
      },
      {
        trader_wallet: '0x7F9C8e0a3b5d7f2e8c4a9b1d6e0f3a8c2b5e9f1d',
        market_name: 'Polkadot network upgrade success',
        profit: 35000,
        position: 'BUY',
        amount: 12000,
        trade_date: '2024-10-24'
      },

      // AlphaTrader trades
      {
        trader_wallet: '0x2A5C7e9b1d4f8a3c6e9f2b5d8a1c4f7e0b3d6c9f',
        market_name: 'Amazon AWS Q4 revenue growth 25%',
        profit: 44000,
        position: 'BUY',
        amount: 15000,
        trade_date: '2024-10-27'
      },
      {
        trader_wallet: '0x2A5C7e9b1d4f8a3c6e9f2b5d8a1c4f7e0b3d6c9f',
        market_name: 'Microsoft Azure adoption accelerates',
        profit: 31000,
        position: 'BUY',
        amount: 11000,
        trade_date: '2024-10-21'
      },

      // QuantKing trades
      {
        trader_wallet: '0x8B2D4f6c9e0a3b5d8f1c4e7a9b2d5f8c1e4a7b0d',
        market_name: 'Stablecoin market cap exceeds $200B',
        profit: 27000,
        position: 'BUY',
        amount: 9500,
        trade_date: '2024-10-19'
      },
      {
        trader_wallet: '0x8B2D4f6c9e0a3b5d8f1c4e7a9b2d5f8c1e4a7b0d',
        market_name: 'Layer 2 solutions transaction volume 1B',
        profit: 33000,
        position: 'BUY',
        amount: 11500,
        trade_date: '2024-10-23'
      }
    ];

    const { data, error } = await supabase
      .from('trader_top_trades')
      .insert(additionalTrades);

    if (error) {
      console.error('Error inserting trades:', error);
    } else {
      console.log('✅ Successfully added additional trades!');
      console.log(`Inserted ${data.length} trades`);
      
      // Verify final count
      const { count, error: countError } = await supabase
        .from('trader_top_trades')
        .select('*', { count: 'exact', head: true });

      if (!countError) {
        console.log(`Total trades in database: ${count}`);
      }
    }

  } catch (err) {
    console.error('Exception:', err);
  }
}

addMoreTrades();