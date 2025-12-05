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

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing environment variables');
    }

    // Get all tracked wallets
    const walletsResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/tracked_wallets`,
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
      return new Response(JSON.stringify({ 
        data: { message: 'No wallets to track', processed: 0 } 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let newActivitiesCount = 0;

    // Process each wallet
    for (const wallet of wallets) {
      try {
        // Fetch trades from Polymarket Data API
        const tradesUrl = `https://data-api.polymarket.com/trades?user=${wallet.wallet_address}&limit=10`;
        const tradesResponse = await fetch(tradesUrl);

        if (!tradesResponse.ok) {
          console.error(`Failed to fetch trades for ${wallet.wallet_address}`);
          continue;
        }

        const trades = await tradesResponse.json();

        // Check for new activities
        for (const trade of trades) {
          // Check if activity already exists
          const checkResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/betting_activities?tx_hash=eq.${trade.transactionHash}`,
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
                  'Prefer': 'return=representation'
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
              newActivitiesCount++;

              // Send notification
              const notifyResponse = await fetch(
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
              );

              if (!notifyResponse.ok) {
                console.error('Failed to send notification:', await notifyResponse.text());
              }
            }
          }
        }

        // Fetch positions from Polymarket Data API
        const positionsUrl = `https://data-api.polymarket.com/positions?user=${wallet.wallet_address}&limit=10`;
        const positionsResponse = await fetch(positionsUrl);

        if (positionsResponse.ok) {
          const positions = await positionsResponse.json();
          console.log(`Wallet ${wallet.wallet_address} has ${positions.length} active positions`);
        }

      } catch (walletError) {
        console.error(`Error processing wallet ${wallet.wallet_address}:`, walletError);
      }
    }

    return new Response(JSON.stringify({ 
      data: { 
        message: 'Wallet tracking completed', 
        processed: wallets.length,
        newActivities: newActivitiesCount
      } 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Track wallet activity error:', error);
    return new Response(JSON.stringify({ 
      error: { 
        code: 'TRACK_WALLET_ERROR', 
        message: error.message 
      } 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
