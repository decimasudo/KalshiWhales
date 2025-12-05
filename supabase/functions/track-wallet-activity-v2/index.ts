// Improved version with queue system and better error handling
Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing environment variables');
    return new Response(JSON.stringify({ 
      error: { code: 'CONFIG_ERROR', message: 'Missing configuration' } 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const stats = {
    processed: 0,
    newActivities: 0,
    errors: 0,
    skipped: 0
  };

  try {
    // Get all tracked wallets
    const walletsResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/tracked_wallets?select=*`,
      {
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
        }
      }
    );

    if (!walletsResponse.ok) {
      throw new Error('Failed to fetch tracked wallets');
    }

    const wallets = await walletsResponse.json();

    if (wallets.length === 0) {
      console.log('No wallets to track');
      return new Response(JSON.stringify({ 
        data: { 
          message: 'No wallets to track', 
          stats 
        } 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Processing ${wallets.length} wallets...`);

    // Process wallets in batches to avoid timeout
    const BATCH_SIZE = 5;
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 1000; // 1 second

    for (let i = 0; i < wallets.length; i += BATCH_SIZE) {
      const batch = wallets.slice(i, i + BATCH_SIZE);
      
      await Promise.all(
        batch.map(wallet => processWalletWithRetry(wallet, MAX_RETRIES, RETRY_DELAY))
      );
    }

    console.log('Processing completed:', stats);

    return new Response(JSON.stringify({ 
      data: { 
        message: 'Wallet tracking completed', 
        stats 
      } 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Track wallet activity error:', error);
    return new Response(JSON.stringify({ 
      error: { 
        code: 'TRACK_WALLET_ERROR', 
        message: error.message,
        stats
      } 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Helper function: Retry with exponential backoff
  async function processWalletWithRetry(wallet: any, maxRetries: number, baseDelay: number) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        await processWallet(wallet);
        stats.processed++;
        return;
      } catch (error) {
        console.error(`Error processing wallet ${wallet.wallet_address} (attempt ${attempt + 1}):`, error);
        
        if (attempt < maxRetries - 1) {
          // Exponential backoff
          const delay = baseDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          stats.errors++;
          console.error(`Failed to process wallet ${wallet.wallet_address} after ${maxRetries} attempts`);
        }
      }
    }
  }

  async function processWallet(wallet: any) {
    try {
      // Fetch trades from Polymarket Data API with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const tradesUrl = `https://data-api.polymarket.com/trades?user=${wallet.wallet_address}&limit=10`;
      const tradesResponse = await fetch(tradesUrl, { 
        signal: controller.signal 
      });

      clearTimeout(timeoutId);

      if (!tradesResponse.ok) {
        // Check for rate limiting
        if (tradesResponse.status === 429) {
          console.warn(`Rate limited for wallet ${wallet.wallet_address}, will retry later`);
          stats.skipped++;
          return;
        }
        throw new Error(`API returned ${tradesResponse.status}`);
      }

      const trades = await tradesResponse.json();

      if (!Array.isArray(trades) || trades.length === 0) {
        return;
      }

      // Process trades
      for (const trade of trades) {
        try {
          if (!trade.transactionHash) continue;

          // Check if activity already exists
          const checkResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/betting_activities?tx_hash=eq.${trade.transactionHash}&select=id`,
            {
              headers: {
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
              }
            }
          );

          const existing = await checkResponse.json();

          if (existing.length === 0) {
            // New activity - insert into database
            const insertResponse = await fetch(
              `${SUPABASE_URL}/rest/v1/betting_activities`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                  'apikey': SUPABASE_SERVICE_ROLE_KEY,
                  'Content-Type': 'application/json',
                  'Prefer': 'return=minimal'
                },
                body: JSON.stringify({
                  wallet_address: wallet.wallet_address,
                  market_id: trade.conditionId || trade.market,
                  event_type: 'TRADE',
                  side: trade.side,
                  amount: parseFloat(trade.size || 0),
                  price: parseFloat(trade.price || 0),
                  outcome: trade.outcome || '',
                  status: 'COMPLETED',
                  tx_hash: trade.transactionHash,
                  timestamp: new Date(trade.timestamp * 1000).toISOString()
                })
              }
            );

            if (insertResponse.ok) {
              stats.newActivities++;

              // Send notification (fire and forget, don't wait)
              fetch(
                `${SUPABASE_URL}/functions/v1/send-notification`,
                {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    wallet_address: wallet.wallet_address,
                    activity: {
                      side: trade.side,
                      amount: trade.size,
                      price: trade.price,
                      outcome: trade.outcome,
                      market_title: trade.title || 'Unknown Market'
                    }
                  })
                }
              ).catch(err => console.error('Notification error:', err));
            }
          }
        } catch (tradeError) {
          console.error(`Error processing trade:`, tradeError);
          // Continue processing other trades
        }
      }

    } catch (walletError) {
      // If it's an abort error, it's a timeout
      if (walletError.name === 'AbortError') {
        console.error(`Timeout processing wallet ${wallet.wallet_address}`);
        stats.errors++;
      }
      throw walletError;
    }
  }
});
