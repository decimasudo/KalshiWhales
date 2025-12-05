# Panduan Implementasi WebSocket Polymarket

**Tanggal Ekstraksi:** 12 November 2025  
**Sumber:** https://docs.polymarket.com/developers/CLOB/websocket/  
**Dibuat oleh:** MiniMax Agent

## Ringkasan Eksekutif

Polymarket menyediakan API WebSocket Secure (WSS) untuk Central Limit Order Book (CLOB) yang memungkinkan klien menerima pembaruan real-time tentang pesanan, perdagangan, dan kondisi pasar. Sistem ini menyediakan dua channel utama: `market` (publik) dan `user` (terotentikasi).

## 1. Implementasi WebSocket

### 1.1 Endpoint dan Protokol Koneksi

- **Protocol:** WebSocket Secure (WSS)
- **Base URL:** `wss://ws-subscriptions-clob.polymarket.com`
- **Format Endpoint Lengkap:** `wss://ws-subscriptions-clob.polymarket.com/ws/{channel_type}`
- **Channel Types:**
  - `market` - untuk data pasar publik
  - `user` - untuk data pengguna spesifik (memerlukan autentikasi)

### 1.2 Struktur Koneksi

Koneksi menggunakan WebSocketApp dengan callback functions berikut:
```python
from websocket import WebSocketApp
import json

class WebSocketOrderBook:
    def __init__(self, channel_type, url, data, auth, message_callback, verbose):
        self.channel_type = channel_type
        self.url = url
        self.data = data
        self.auth = auth
        self.message_callback = message_callback
        self.verbose = verbose
        furl = url + "/ws/" + channel_type
        self.ws = WebSocketApp(
            furl,
            on_message=self.on_message,
            on_error=self.on_error,
            on_close=self.on_close,
            on_open=self.on_open,
        )
```

## 2. Persyaratan Autentikasi

### 2.1 Kredensial Diperlukan

Autentikasi hanya diperlukan untuk koneksi ke channel `user`. Kredensial yang diperlukan:

- **apiKey:** API key CLOB dari akun Polygon
- **secret:** Secret API CLOB dari akun Polygon
- **passphrase:** Passphrase API CLOB dari akun Polygon

### 2.2 Derive API Keys

Kredensial dapat diturunkan menggunakan library `py_clob_client`:

```python
from py_clob_client.client import ClobClient

host = "https://clob.polymarket.com"
key = "" # Private Key
chain_id = 137
POLYMARKET_PROXY_ADDRESS = ""

# Untuk Email/Magic account
client = ClobClient(host, key=key, chain_id=chain_id, signature_type=1, funder=POLYMARKET_PROXY_ADDRESS)

# Untuk Browser Wallet (Metamask, Coinbase Wallet)
client = ClobClient(host, key=key, chain_id=chain_id, signature_type=2, funder=POLYMARKET_PROXY_ADDRESS)

# Untuk EOA langsung
client = ClobClient(host, key=key, chain_id=chain_id)

api_credentials = client.derive_api_key()
```

### 2.3 Format Autentikasi

```json
{
  "auth": {
    "apiKey": "your_api_key",
    "secret": "your_api_secret", 
    "passphrase": "your_api_passphrase"
  }
}
```

## 3. Channel Data

### 3.1 Market Channel (Publik)

**Deskripsi:** Channel publik untuk pembaruan data pasar Level 2 price.

**Subscription Method:** 
```
<wss-channel> market
```

**Message Format Subscription:**
```json
{
  "assets_ids": ["asset_id1", "asset_id2"],
  "type": "market"
}
```

### 3.2 User Channel (Terotentikasi)

**Deskripsi:** Channel terotentikasi untuk pembaruan spesifik pengguna terkait orders dan trades.

**Subscription Method:**
```
<wss-channel> user
```

**Message Format Subscription:**
```json
{
  "markets": ["market_id1"],
  "type": "user",
  "auth": {
    "apiKey": "your_api_key",
    "secret": "your_api_secret",
    "passphrase": "your_api_passphrase"
  }
}
```

## 4. Metode Subscription

### 4.1 Proses Subscription

1. **Koneksi:** Establecer koneksi WebSocket ke endpoint yang sesuai
2. **Subscription Message:** Kirim message subscription saat `on_open` callback
3. **Keep-alive:** Kirim "PING" message setiap 10 detik untuk mempertahankan koneksi

### 4.2 Format Subscription Messages

**Market Channel:**
```json
{
  "assets_ids": ["asset_id1", "asset_id2"],
  "type": "market"
}
```

**User Channel:**
```json
{
  "markets": ["market_id1", "market_id2"],
  "type": "user",
  "auth": {
    "apiKey": "your_api_key",
    "secret": "your_api_secret",
    "passphrase": "your_api_passphrase"
  }
}
```

## 5. Struktur Data dan Message Types

### 5.1 Market Channel Message Types

#### 5.1.1 Book Message
**Emitted when:** 
- Pertama subscribe ke market
- Ada trade yang mempengaruhi book

**Structure:**
```json
{
  "event_type": "book",
  "asset_id": "65818619657568813474341868652308942079804919287380422192892211131408793125422",
  "market": "0xbd31dc8a20211944f6b70f31557f1001557b59905b7738480ca09bd4532f84af",
  "bids": [
    {"price": ".48", "size": "30"},
    {"price": ".49", "size": "20"}
  ],
  "asks": [
    {"price": ".52", "size": "25"},
    {"price": ".53", "size": "60"}
  ],
  "timestamp": "123456789000",
  "hash": "0x0...."
}
```

#### 5.1.2 Price Change Message
**⚠️ Breaking Change Notice:** Schema message ini akan diupdate pada 15 September 2025 jam 11 PM UTC.

**Emitted when:**
- Order baru ditempatkan
- Order dibatalkan

**Structure:**
```json
{
  "event_type": "price_change",
  "market": "0x5f65177b394277fd294cd75650044e32ba009a95022d88a0c1d565897d72f8f1",
  "price_changes": [
    {
      "asset_id": "71321045679252212594626385532706912750332728571942532289631379312455583992563",
      "price": "0.5",
      "size": "200",
      "side": "BUY",
      "hash": "56621a121a47ed9333273e21c83b660cff37ae50",
      "best_bid": "0.5",
      "best_ask": "1"
    }
  ],
  "timestamp": "1757908892351"
}
```

#### 5.1.3 Tick Size Change Message
**Emitted when:** Minimum tick size market berubah (saat harga mencapai limit: price > 0.96 atau price < 0.04)

**Structure:**
```json
{
  "event_type": "tick_size_change",
  "asset_id": "65818619657568813474341868652308942079804919287380422192892211131408793125422",
  "market": "0xbd31dc8a20211944f6b70f31557f1001557b59905b7738480ca09bd4532f84af",
  "old_tick_size": "0.01",
  "new_tick_size": "0.001",
  "timestamp": "100000000"
}
```

#### 5.1.4 Last Trade Price Message
**Emitted when:** Maker dan taker order cocok menciptakan trade event

**Structure:**
```json
{
  "asset_id": "114122071509644379678018727908709560226618148003371446110114509806601493071694",
  "event_type": "last_trade_price",
  "fee_rate_bps": "0",
  "market": "0x6a67b9d828d53862160e470329ffea5246f338ecfffdf2cab45211ec578b0347",
  "price": "0.456",
  "side": "BUY",
  "size": "219.217767",
  "timestamp": "1750428146322"
}
```

### 5.2 User Channel Message Types

#### 5.2.1 Trade Message
**Emitted when:**
- Market order cocok ('MATCHED')
- Limit order pengguna termasuk dalam trade ('MATCHED')
- Status trade berubah ('MINED', 'CONFIRMED', 'RETRYING', 'FAILED')

**Structure:**
```json
{
  "asset_id": "string",
  "event_type": "trade",
  "id": "string",
  "last_update": "string",
  "maker_orders": [
    {
      "asset_id": "string",
      "matched_amount": "string",
      "order_id": "string",
      "outcome": "string",
      "owner": "string",
      "price": "string"
    }
  ],
  "market": "string",
  "matchtime": "string",
  "outcome": "string",
  "owner": "string",
  "price": "string",
  "side": "BUY or SELL",
  "size": "string",
  "status": "MATCHED|MINED|CONFIRMED|RETRYING|FAILED",
  "taker_order_id": "string",
  "timestamp": "string",
  "trade_owner": "string",
  "type": "TRADE"
}
```

#### 5.2.2 Order Message
**Emitted when:**
- Order ditempatkan ('PLACEMENT')
- Order diupdate (contoh: sebagian cocok) ('UPDATE')
- Order dibatalkan ('CANCELLATION')

**Structure:**
```json
{
  "asset_id": "string",
  "associate_trades": ["string"],
  "event_type": "order",
  "id": "string",
  "market": "string",
  "order_owner": "string",
  "original_size": "string",
  "outcome": "string",
  "owner": "string",
  "price": "string",
  "side": "BUY or SELL",
  "size_matched": "string",
  "timestamp": "string",
  "type": "PLACEMENT|UPDATE|CANCELLATION"
}
```

## 6. Protokol Koneksi

### 6.1 Connection Lifecycle

1. **Establish Connection:** Koneksi ke WSS endpoint
2. **Send Subscription:** Kirim subscription message saat `on_open`
3. **Handle Messages:** Process messages melalui `on_message` callback
4. **Keep-alive:** Kirim PING messages setiap 10 detik
5. **Error Handling:** Handle errors melalui `on_error` callback
6. **Close Connection:** Cleanup melalui `on_close` callback

### 6.2 Keep-alive Protocol

```python
def ping(self, ws):
    while True:
        ws.send("PING")
        time.sleep(10)
```

### 6.3 Full Implementation Example

```python
from websocket import WebSocketApp
import json
import time
import threading

MARKET_CHANNEL = "market"
USER_CHANNEL = "user"

class WebSocketOrderBook:
    def __init__(self, channel_type, url, data, auth, message_callback, verbose):
        self.channel_type = channel_type
        self.url = url
        self.data = data
        self.auth = auth
        self.message_callback = message_callback
        self.verbose = verbose
        furl = url + "/ws/" + channel_type
        self.ws = WebSocketApp(
            furl,
            on_message=self.on_message,
            on_error=self.on_error,
            on_close=self.on_close,
            on_open=self.on_open,
        )
        self.orderbooks = {}

    def on_message(self, ws, message):
        print(message)
        # Implement custom message processing logic
        data = json.loads(message)
        if data.get("event_type") == "book":
            # Process order book data
            pass
        elif data.get("event_type") == "trade":
            # Process trade data
            pass

    def on_error(self, ws, error):
        print("Error: ", error)
        exit(1)

    def on_close(self, ws, close_status_code, close_msg):
        print("closing")
        exit(0)

    def on_open(self, ws):
        if self.channel_type == MARKET_CHANNEL:
            ws.send(json.dumps({"assets_ids": self.data, "type": MARKET_CHANNEL}))
        elif self.channel_type == USER_CHANNEL and self.auth:
            ws.send(
                json.dumps(
                    {"markets": self.data, "type": USER_CHANNEL, "auth": self.auth}
                )
            )
        else:
            exit(1)

        thr = threading.Thread(target=self.ping, args=(ws,))
        thr.start()

    def ping(self, ws):
        while True:
            ws.send("PING")
            time.sleep(10)

    def run(self):
        self.ws.run_forever()

# Usage Example
if __name__ == "__main__":
    url = "wss://ws-subscriptions-clob.polymarket.com"
    
    # Your API credentials (export from client)
    api_key = "your_api_key"
    api_secret = "your_api_secret"
    api_passphrase = "your_api_passphrase"

    asset_ids = [
        "109681959945973300464568698402968596289258214226684818748321941747028805721376",
    ]
    condition_ids = []

    auth = {"apiKey": api_key, "secret": api_secret, "passphrase": api_passphrase}

    # Connect to Market Channel
    market_connection = WebSocketOrderBook(
        MARKET_CHANNEL, url, asset_ids, auth, None, True
    )
    
    # Connect to User Channel
    user_connection = WebSocketOrderBook(
        USER_CHANNEL, url, condition_ids, auth, None, True
    )

    market_connection.run()
    # user_connection.run()
```

## 7. Migration dan Breaking Changes

### 7.1 Price Change Message Schema Update
- **Tanggal:** 15 September 2025, 11 PM UTC
- **Impact:** Schema message `price_change` akan diupdate
- **Referensi:** Market Channel Migration Guide
- **Action Required:** Update kode untuk kompatibilitas dengan schema baru

## 8. Links dan Resources

- **Dokumentasi Utama:** https://docs.polymarket.com/developers/CLOB/websocket/
- **WSS Overview:** /developers/CLOB/websocket/wss-overview
- **WSS Authentication:** /developers/CLOB/websocket/wss-auth
- **User Channel:** /developers/CLOB/websocket/user-channel
- **Market Channel:** /developers/CLOB/websocket/market-channel
- **Quickstart Guide:** /quickstart/websocket/WSS-Quickstart
- **Migration Guide:** /developers/CLOB/websocket/market-channel-migration-guide

## 9. Kesimpulan

Polymarket WebSocket API menyediakan solusi komprehensif untuk mendapatkan data real-time dari Central Limit Order Book. Sistem ini mendukung dua tipe channel dengan mekanisme autentikasi yang fleksibel, memungkinkan developers untuk mengakses data pasar publik atau informasi pengguna spesifik sesuai kebutuhan aplikasi mereka.

**Key Points:**
- Channel `market` publik tanpa autentikasi
- Channel `user` memerlukan autentikasi dengan API credentials
- Message types komprehensif untuk order book, price changes, trades, dan order updates
- Keep-alive mechanism dengan PING messages setiap 10 detik
- Migration schedule untuk breaking changes

**Recommendations:**
1. Implement error handling yang robust
2. Monitor breaking change schedule untuk price_change message
3. Gunakan library `py_clob_client` untuk manajemen API credentials
4. Test koneksi dan message processing secara menyeluruh sebelum production deployment
