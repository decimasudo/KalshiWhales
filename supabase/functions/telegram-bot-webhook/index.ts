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
    const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!TELEGRAM_BOT_TOKEN || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing environment variables');
    }

    const update = await req.json();
    
    // Extract message info
    const message = update.message || update.edited_message;
    if (!message || !message.text) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const chatId = message.chat.id;
    const text = message.text.trim();
    const username = message.from.username || message.from.first_name || 'User';

    // Helper function to send Telegram message
    const sendTelegramMessage = async (text: string) => {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: 'HTML'
        })
      });
    };

    // Handle commands
    if (text.startsWith('/start')) {
      // Register user
      const checkResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/telegram_subscriptions?telegram_chat_id=eq.${chatId}`,
        {
          headers: {
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
          }
        }
      );

      const existing = await checkResponse.json();

      if (existing.length === 0) {
        await fetch(`${SUPABASE_URL}/rest/v1/telegram_subscriptions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            telegram_chat_id: chatId,
            telegram_username: username,
            is_active: true
          })
        });
      }

      await sendTelegramMessage(
        `Selamat datang di <b>PolyWhales</b>!\n\n` +
        `Saya akan membantu Anda melacak aktivitas trading di Polymarket.\n\n` +
        `<b>Commands yang tersedia:</b>\n` +
        `/track [wallet_address] - Track wallet address\n` +
        `/untrack [wallet_address] - Untrack wallet address\n` +
        `/list - Lihat daftar wallet yang ditrack\n` +
        `/help - Tampilkan bantuan`
      );

    } else if (text.startsWith('/track ')) {
      const walletAddress = text.replace('/track ', '').trim();
      
      if (!walletAddress || walletAddress.length < 10) {
        await sendTelegramMessage('Format tidak valid. Gunakan: /track [wallet_address]');
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Get subscription
      const subResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/telegram_subscriptions?telegram_chat_id=eq.${chatId}`,
        {
          headers: {
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
          }
        }
      );

      const subs = await subResponse.json();
      if (subs.length === 0) {
        await sendTelegramMessage('Silakan gunakan /start terlebih dahulu');
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const userId = subs[0].user_id;

      // Check if wallet already tracked
      const checkWallet = await fetch(
        `${SUPABASE_URL}/rest/v1/tracked_wallets?telegram_chat_id=eq.${chatId}&wallet_address=eq.${walletAddress}`,
        {
          headers: {
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
          }
        }
      );

      const existingWallets = await checkWallet.json();

      if (existingWallets.length > 0) {
        await sendTelegramMessage(`Wallet ${walletAddress} sudah ditrack`);
      } else {
        // Add wallet to tracked_wallets
        await fetch(`${SUPABASE_URL}/rest/v1/tracked_wallets`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            user_id: userId,
            wallet_address: walletAddress,
            telegram_chat_id: chatId
          })
        });

        await sendTelegramMessage(
          `Berhasil tracking wallet:\n<code>${walletAddress}</code>\n\n` +
          `Anda akan menerima notifikasi ketika ada aktivitas trading.`
        );
      }

    } else if (text.startsWith('/untrack ')) {
      const walletAddress = text.replace('/untrack ', '').trim();

      await fetch(
        `${SUPABASE_URL}/rest/v1/tracked_wallets?telegram_chat_id=eq.${chatId}&wallet_address=eq.${walletAddress}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
          }
        }
      );

      await sendTelegramMessage(`Wallet ${walletAddress} berhasil diuntrack`);

    } else if (text === '/list') {
      const walletsResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/tracked_wallets?telegram_chat_id=eq.${chatId}`,
        {
          headers: {
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
          }
        }
      );

      const wallets = await walletsResponse.json();

      if (wallets.length === 0) {
        await sendTelegramMessage('Anda belum tracking wallet apapun. Gunakan /track [wallet_address] untuk mulai tracking.');
      } else {
        let listText = '<b>Daftar Wallet yang Ditrack:</b>\n\n';
        wallets.forEach((w: any, index: number) => {
          listText += `${index + 1}. <code>${w.wallet_address}</code>\n`;
          if (w.label) listText += `   Label: ${w.label}\n`;
        });
        await sendTelegramMessage(listText);
      }

    } else if (text === '/help') {
      await sendTelegramMessage(
        `<b>PolyWhales Bot - Panduan</b>\n\n` +
        `<b>Commands:</b>\n` +
        `/start - Mulai menggunakan bot\n` +
        `/track [wallet_address] - Track wallet Polymarket\n` +
        `/untrack [wallet_address] - Stop tracking wallet\n` +
        `/list - Lihat semua wallet yang ditrack\n` +
        `/help - Tampilkan panduan ini\n\n` +
        `<b>Contoh penggunaan:</b>\n` +
        `/track 0x1234567890abcdef1234567890abcdef12345678`
      );
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Telegram webhook error:', error);
    return new Response(JSON.stringify({ 
      error: { 
        code: 'TELEGRAM_WEBHOOK_ERROR', 
        message: error.message 
      } 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
