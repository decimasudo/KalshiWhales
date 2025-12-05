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
    const { wallet_address, activity } = await req.json();

    if (!wallet_address || !activity) {
      throw new Error('Missing required parameters');
    }

    const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!TELEGRAM_BOT_TOKEN || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing environment variables');
    }

    // Get subscriptions for this wallet
    const subsResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/tracked_wallets?wallet_address=eq.${wallet_address}`,
      {
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
        }
      }
    );

    if (!subsResponse.ok) {
      throw new Error('Failed to fetch subscriptions');
    }

    const subscriptions = await subsResponse.json();

    if (subscriptions.length === 0) {
      return new Response(JSON.stringify({ 
        data: { message: 'No subscriptions found', sent: 0 } 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let sentCount = 0;

    // Send notification to each subscriber
    for (const sub of subscriptions) {
      if (sub.telegram_chat_id) {
        const { side, amount, price, outcome, market_title } = activity;
        
        const sideEmoji = side === 'BUY' ? '🟢' : '🔴';
        const message = 
          `${sideEmoji} <b>New Trade Alert</b>\n\n` +
          `<b>Wallet:</b> <code>${wallet_address.substring(0, 10)}...${wallet_address.substring(wallet_address.length - 8)}</code>\n\n` +
          `<b>Market:</b> ${market_title}\n` +
          `<b>Action:</b> ${side}\n` +
          `<b>Outcome:</b> ${outcome}\n` +
          `<b>Size:</b> ${amount}\n` +
          `<b>Price:</b> ${price}\n\n` +
          `Timestamp: ${new Date().toLocaleString('id-ID')}`;

        const telegramResponse = await fetch(
          `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: sub.telegram_chat_id,
              text: message,
              parse_mode: 'HTML'
            })
          }
        );

        if (telegramResponse.ok) {
          sentCount++;
        } else {
          console.error('Failed to send Telegram message:', await telegramResponse.text());
        }
      }
    }

    return new Response(JSON.stringify({ 
      data: { 
        message: 'Notifications sent', 
        sent: sentCount 
      } 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Send notification error:', error);
    return new Response(JSON.stringify({ 
      error: { 
        code: 'SEND_NOTIFICATION_ERROR', 
        message: error.message 
      } 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
