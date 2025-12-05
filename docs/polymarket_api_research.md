# Blueprint Laporan: Polymarket API dan Infrastruktur untuk Tracking Aktivitas Wallet

## Ringkasan Eksekutif

Polymarket menyediakan empat pilar antarmuka untuk akses data dan perdagangan terprogram: (1) CLOB (Central Limit Order Book) API yang menggabungkan REST dan WebSocket (WSS) untuk order book, perdagangan, dan manipulasi order; (2) Data‑API untuk data pengguna seperti posisi, perdagangan, aktivitas on‑chain, holders, dan nilai posisi; (3) Gamma Markets API (read‑only) untuk penemuan pasar, metadata, dan kategorisasi; serta (4) RTDS (Real‑Time Data Socket) untuk streaming non‑trading seperti harga kripto dan komentar. Totok Piping dan tim integrasi dapat memanfaatkan kombinasi ini untuk membangun pipeline real‑time yang andal, aman, dan hemat biaya, dengan detail autentikasi dua tingkat (L1/L2) untuk operasi private, dan opsi langganan channel terverifikasi untuk feed pengguna dan pasar secara terpisah.[^1][^5][^6][^7][^8][^11]

Rekomendasi implementasi tinggi:
- Gunakan Gamma untuk discovery cepat dan catalog metadata; gunakan Data‑API untuk tracking aktivitas wallet (posisi, perdagangan, aktivitas on‑chain, holders, nilai); gunakan CLOB REST/WSS untuk watchlist order book dan pengguna secara terotentikasi; gunakan RTDS untuk feed real‑time non‑trading yang ringan.
- Arsitektur/eventing: kombinasi WebSocket (CLOB WSS dan RTDS) untuk real‑time, dilengkapi REST polling yang singkat (adaptive interval) untuk verifikasi dan backfill; sinkronisasi watermark dan idempotensi berbasis timestamp/transactionHash; cache sekunder dan retry/backoff eksponensial.
- Keamanan: pisahkan kredensial L1/L2, rotasi kunci berkala,HMAC dan pengelolaan passphrase yang tidak disimpan server; batasi privilegios API; auditjejak akses.

Blueprint ini menyajikan peta jalan implementasi end‑to‑end, termasuk pemetaan use‑case ke endpoint, prosedur autentikasi L1/L2, desain ulang‑ulang koneksi WSS, hingga alternatif GraphQL Bitquery bila official API tidak tersedia.

## Arsitektur Data dan Akses Polymarket

Polymarket mengelompokkan akses data dan fungsinya ke empat layanan inti: CLOB (REST/WSS), Data‑API, Gamma (REST), dan RTDS (WebSocket). Masing‑masing memiliki peran spesifik yang saling melengkapi. CLOB menyediakan data order book, harga, dan eksekusi; Data‑API menyediakan data pengguna dan aktivitas on‑chain; Gamma menyajikan indeks pasar dan metadata untuk discovery; RTDS menawarkan feed real‑time ringan seperti harga kripto dan komentar. Diagram logis berikut menggambarkan interaksi tingkat tinggi:

![Diagram arsitektur data Polymarket dan interaksi antar layanan.](assets/images/polymarket/architecture_overview.png)

Secara praktis, Data‑API memetakan kebutuhan tracking aktivitas wallet secara langsung: posisi, perdagangan, aktivitas on‑chain (termasuk splits, merges, redemption), holders per pasar, dan total nilai posisi. Sementara itu, CLOB WSS menyediakan update order book (channel market) dan order/trade pribadi (channel user) secara langsung, dan Gamma REST menyediakan konteks pasar (event, kategori, volume terindeks) untuk fitur discovery, riset, dan dashboards. RTDS menambahkan stream non‑trading seperti harga kripto dan komentar, berguna untuk pengalaman pengguna yang kaya tanpa menambah beban ke kanal CLOB.[^6][^5][^7][^8]

Untuk memperjelas pemilihan layanan per use‑case, Tabel 1 memetakan layanan ke tujuan utama:

Tabel 1. Pemetaan Layanan vs Tujuan Utama
| Layanan   | Tujuan Utama                                      | Contoh Kegunaan                                                                 |
|-----------|----------------------------------------------------|----------------------------------------------------------------------------------|
| CLOB      | Order book, harga, manipulasi order                | Market scanner, watchlist L2, eksekusi order, pembatalan batch                   |
| Data‑API  | Data pengguna & aktivitas on‑chain                 | Tracking posisi, trades pengguna, aktivitas splits/merges/redeem, holders, nilai |
| Gamma     | Metadata & discovery (read‑only)                   | Katalog pasar, tag/kategori, event, pencarian, metadata volume                   |
| RTDS      | Streaming non‑trading (WebSocket)                  | Harga kripto real‑time, komentar, pembaruan ringan untuk UI                      |

Kombinasi ini memberi fleksibilitas arsitektural: gunakan RTDS untuk feed ringan dan UX responsif, CLOB WSS untuk data trading yang sensitif dan real‑time, Gamma untuk discovery, dan Data‑API untuk analitik wallet‑level. Hasilnya adalah pipeline yang efisien, terstruktur, dan aman.

## Dokumentasi Resmi dan Endpoints yang Tersedia

Polymarket menandai basis REST CLOB melalui placeholder {clob-endpoint}; Data‑API tersedia di host data-api.polymarket.com; Gamma REST memberi akses metadata pasar; RTDS menyediakan WebSocket di wss://ws-live-data.polymarket.com; dan CLOB WSS beroperasi pada wss://ws-subscriptions-clob.polymarket.com.[^5][^6][^7][^8]

Bagian ini menyajikan ringkasan operasional untuk menghindari kebingungan endpoint di lingkungan eksekusi Anda.

Tabel 2. Ringkasan Endpoint Publik: Base URL, Metode, Autentikasi, Kegunaan
| Layanan  | Base URL/Endpoint                 | Metode Utama         | Autentikasi            | Kegunaan Utama                                         |
|----------|-----------------------------------|----------------------|------------------------|--------------------------------------------------------|
| CLOB     | {clob-endpoint}                   | GET/POST/DELETE      | L1/L2 (según operación)| Books, pricing, spreads, place/cancel orders, account  |
| Data‑API | https://data-api.polymarket.com   | GET                  | Public (read-only)     | Positions, trades, activity, holders, value            |
| Gamma    | {gamma-endpoint} (REST)           | GET                  | Public (read-only)     | Health, sports, tags, events, markets, series, search  |
| RTDS     | wss://ws-live-data.polymarket.com | WebSocket streaming  | Optional ( lihat docs) | Crypto prices, comments, feed non‑trading              |
| CLOB WSS | wss://ws-subscriptions-clob.polymarket.com | WebSocket streaming | L2 untuk user channel | Market channel (publik), user channel (private)        |

Catatan: Di lingkungan production, gunakan base URL resmi yang terverifikasi sesuai dokumentasi Polymarket terbaru, karena placeholder seperti {clob-endpoint} harus diganti dengan host yang benar. Beberapa contoh dan quickstart publik menunjukkan host CLOB produksi (contoh: clob.polymarket.com), namun Anda tetap wajib memastikan pengaturan di lingkungan aktual.[^5][^13][^17]

### CLOB API (REST)

CLOB REST mencakup kategori: Orderbook, Pricing, Spreads, Order Manipulation (place, batch, cancel), serta endpoints untuk get order dan active orders. Autentikasi berbeda‑beda: operasi personal (misalnya, membuat/mengelola kunci API, mengirim/membatalkan order) memerlukan L1 atau L2, sedangkan reads publik tertentu dapat diakses tanpa autentikasi khusus. Dokumentasi menggarisbawahi pemisahan dua tingkat autentikasi dan header yang diperlukan (L1/L2), tetapi halaman kategori tidak memuat detail nilai parameter dan skema respons pada setiap operasi; halaman RTDS/WSS berlaku类似的 catatanketerbatasan.[^5][^4]

### Data‑API

Data‑API menyediakan endpoints: positions, trades, activity, holders, dan value. Pada praktiknya, Data‑API adalah jalur utama untuk pelacakan aktivitas wallet secara agregat dan historis. Endpoint ini biasanya read‑only untuk publik; beberapa filter khusus pengguna (misalnya user address) tetap dapat digunakan tanpa autentikasi yang membebankan karena tidak memengaruhi state transaksi on‑chain. Gist resmi merinci parameter dan field respons untuk setiap endpoint, yang kami ringkas pada bagian struktur data.[^6][^16]

### Gamma Markets API (Read‑only)

Gamma menydiakan REST read‑only untuk: Health, Sports, Tags, Events, Markets, Series, Comments, dan Search. Layanan ini cocok untuk discovery pasar, metadata, kategorisasi, serta menyajikan volume terindeks. Hal ini memperkaya fitur katalog dan pencarian, serta menyediakan sinyal konteks untuk analitik downstream.[^7]

### RTDS (Real‑Time Data Socket)

RTDS adalah layanan streaming WebSocket yang menyediakan updates real‑time seperti harga kripto dan komentar. Klien dapat menambah/mengubah/ Menghapus topik langganan tanpa memutuskan koneksi. Protokol membutuhkan ping/pong periodic (disarankan tiap beberapa detik) untuk menjaga koneksi tetap hidup. Polymarket menyediakan klien TypeScript resmi untuk integrasi yang mudah.[^8][^12]

![Ilustrasi topik RTDS dan alur subscribe/unsubscribe.](assets/images/polymarket/rtds_topics.png)

RTDS mendukung komunikasi ringan dengan struktur pesan JSON umum (topic, type, timestamp, payload). Karena pembaruan di topik non‑trading, RTDS cocok untuk menyokong pengalaman UI real‑time yang cepat tanpa harus memproses message order book yang lebih berat dari CLOB WSS.[^8]

### CLOB WebSocket (WSS)

CLOB WSS menyediakan dua channel inti: market (publik, order book level 2) dan user (otentikasi diperlukan). Klien dapat melakukan subscribe/unsubscribe, menjaga koneksi dengan ping berkala, dan menangani error serta reconnection. Dokumentasi quickstart memandu struktur pesan subscribe, sedangkan panduan otentikasi menguraikan kredensial L2 (apiKey, secret, passphrase) yang diperlukan untuk user channel. Contoh production di ekosistem menunjukkan host ws-subscriptions-clob.polymarket.com untuk channel ini.[^9][^10][^13]

![Ilustrasi channel Market dan User pada CLOB WSS.](assets/images/polymarket/wss_channels.png)

Perbedaan praktis antara CLOB WSS dan RTDS: CLOB WSS menangani data trading (liquidity, order book, dan event user), sementara RTDS menyediakan feed ringan non‑trading (misalnya komentar dan harga kripto). Menggabungkan keduanya menyajikan balance yang baik antara kecepatan, kelengkapan, dan beban koneksi.[^8][^9]

## Cara Mengakses Data Betting Activities (Wallet‑centric)

Use‑case utama kita—melacak aktivitas betting per wallet—berumpuk pada Data‑API dan dilengkapi oleh sinyal CLOB WSS untuk real‑time. Tabel 3 memetakan endpoint ke kebutusan spesifik:

Tabel 3. Pemetaan Use‑Case ke Endpoint Data‑API
| Use‑Case                                    | Endpoint Data‑API | Keterangan                                                                                          |
|---------------------------------------------|-------------------|------------------------------------------------------------------------------------------------------|
| Posisi terkini per wallet                   | /positions        | Filter user, market (conditionId), threshold ukuran, redeemable/mergeable, sort/paginate             |
| Riwayat perdagangan pengguna                | /trades           | Filter limit/offset, takerOnly, filterType/Amount, market, user, side (BUY/SELL)                     |
| Aktivitas on‑chain (split/merge/redeem dll) | /activity         | Filter user, market, type (TRADE/SPLIT/MERGE/REDEEM/REWARD/CONVERSION), rentang waktu, side, sort    |
| Top holders pasar                           | /holders          | Wajib parameter market (conditionId), batasi hasil dengan limit                                       |
| Total nilai posisi (USD)                    | /value            | Wajib user, opsional filter market                                                                   |

Filter yang kaya memungkinkan analitik granular: misalnya,筛选 ukuran posisi minimum untuk memicu alertas risiko, atau memantauREDEMPTION dan MERGE sebagai indikator resolusi dan likuidasi posisi. Integrasi dengan CLOB WSS (user channel) memberi tahu perubahan order/trade secara real‑time, yang dapat dicocokkan dengan Data‑API untuk verifikasi dan backfill.[^6][^16]

### Positions (/positions)

Endpoint positions mengembalikan informasi seperti proxyWallet, asset, conditionId, size, avgPrice, initialValue, currentValue, cashPnl, percentPnl, curPrice, redeemable, title, outcome, dan lainnya. Ini sangat cocok untuk laporan posisi aktif, perhitungan PnL, serta deteksi posisi yang mendekati resolusi. Filter meliputi user, market (conditionId CSV), sizeThreshold, redeemable/mergeable, title, limit/offset, sortBy, sortDirection. Analis dapat menerapkan threshold dinamis untuk fokus pada perubahan materiallysignificant.[^16]

### Trades (/trades)

Trades menyediakan riwayat dengan field proxyWallet, side, asset, conditionId, size, price, timestamp, transactionHash, serta metadata pasar dan profil pengguna (title, slug, outcome, name, pseudonym). Filter yang tersedia mencakup limit/offset, takerOnly, filterType/Amount, market, user, side. Integrasi dengan user channel WSS memungkinkan Anda memicu event processing saat eksekusi terjadi, sementara Data‑API berperan sebagai sumber kebenaran historis.[^16][^6]

### Activity (/activity)

Activity memotret peristiwa on‑chain: TRADE, SPLIT, MERGE, REDEEM, REWARD, CONVERSION. Field yang dikembalikan meliputi proxyWallet, timestamp, conditionId, type, size, usdcSize, transactionHash, price, asset, side, outcomeIndex, serta metadata pasar dan profil. Parameter filter meliputi user, limit/offset, market (CSV), type (CSV), start/end, side (untuk TRADE), sortBy (TIMESTAMP/TOKENS/CASH), sortDirection. Endpoint ini ideal untuk menandai peristiwa kritis seperti resolusi pasar (REDEEM) atau konsolidasi posisi (MERGE).[^16]

![Alur event on-chain Polymarket dari split hingga redemption.](assets/images/polymarket/onchain_flow.png)

### Holders (/holders) dan Value (/value)

Holders mengembalikan daftar tokoh teratas per market (berdasarkan conditionId) dengan field proxyWallet, asset, amount, outcomeIndex, name, pseudonym, bio, profileImage, dan displayUsernamePublic. Value mengembalikan total nilai USD posisi seorang pengguna, dengan opsional filter market. Kombinasi keduanya membantu memahami konsentrasi kepemilikan dan menilai bobot posisi relatif terhadap nilai portofolio.[^16]

## Autentikasi, Otorisasi, dan Rate Limits

Polymarket menerapkan dua tingkat autentikasi: L1 (Private Key) dan L2 (API Key). L1 dibutuhkan untuk operasi paling sensitif (misal, menempatkan order, membuat/mencabut API key), sedangkan L2 memadai untuk permintaan personal yang tidak melibatkan pergerakan dana langsung, seperti mengambil data akun dan mengelola kunci yang sudah ada. Aspek keamanan yang menonjol adalah sifat non‑custodial, penggunaan tanda tangan EIP‑712 (L1), HMAC untuk integritas permintaan (L2), serta pengelolaan passphrase yang tidak disimpan server.[^4][^10][^5]

Tabel 4. Perbandingan L1 vs L2
| Aspek                 | L1 (Private Key)                                        | L2 (API Key)                                                                 |
|-----------------------|----------------------------------------------------------|-------------------------------------------------------------------------------|
| Digunakan untuk       | Place/cancel orders, create/delete API keys, actions     | Private reads, user channel WSS, manage existing keys                         |
| Header wajib          | POLY_ADDRESS, POLY_SIGNATURE (EIP‑712), POLY_TIMESTAMP, POLY_NONCE | POLY_ADDRESS, POLY_SIGNATURE (HMAC), POLY_TIMESTAMP, POLY_API_KEY, POLY_PASSPHRASE |
| Keamanan              | Non‑custodial, tanda tangan EIP‑712                      | HMAC, passphrase untuk enkripsi/dekripsi rahasia, tidak disimpan server       |
|ibrary/client support  | Typescript & Python (contoh tersedia)                    | Typescript & Python (contoh tersedia)                                         |

Policy rate limits tidak dirinci nilai eksplisit dalam dokumentasi resmi yang tersedia. Beberapa sumber pihak ketiga menyebutkan batas umum (misalnya, 100 permintaan/menit untuk akses dasar), namun angka ini tidak dapat diverifikasi secara resmi. Implementasi harus menggunakan strategi mitigasi: exponential backoff, jitter, circuit breaker, caching respons, serta preferir streaming dari pada polling untuk menekan beban permintaan. Pantau juga changelog resmi untuk kebijakan limit terbaru.[^4][^5][^17]

## Format dan Struktur Data

Semua komunikasi API menggunakan JSON. Pesan WebSocket (RTDS dan CLOB WSS) menyampaikan objek JSON dengan struktur umum: topic, type, timestamp, payload. Pada Data‑API, skema respons setiap endpoint berbeda‑beda namun konsisten dalam penggunaan field metadata pasar dan agregasi nilai.

Tabel 5. Ringkasan Field Utama per Endpoint
| Endpoint     | Field Penting (contoh)                                                                                                             | Deskripsi Singkat                                                                                  |
|--------------|-------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------|
| /positions   | proxyWallet, asset, conditionId, size, avgPrice, initialValue, currentValue, cashPnl, percentPnl, curPrice, redeemable, outcome     | Posisi aktif pengguna dengan metrik nilai dan PnL                                                   |
| /trades      | proxyWallet, side, asset, conditionId, size, price, timestamp, transactionHash, title, slug, outcome, name, pseudonym               | Riwayat perdagangan (taker/maker) dengan metadata pasar dan profil                                  |
| /activity    | proxyWallet, timestamp, conditionId, type, size, usdcSize, transactionHash, price, asset, side, outcomeIndex, title, slug, outcome  | Aktivitas on‑chain: TRADE, SPLIT, MERGE, REDEEM, REWARD, CONVERSION                                 |
| /holders     | token, holders[ proxyWallet, bio, asset, pseudonym, amount, outcomeIndex, name, profileImage ]                                      | Daftar holders teratas per market                                                                   |
| /value       | user, value                                                                                                                         | Total nilai USD posisi pengguna                                                                     |

Skema lengkap tersedia pada gist resmi; untuk批处理 dan produksi, siapkan validasi JSON skema, default value handling, dan pembandingan antar versi. RTDS/CLOB WSS mengirim pesan JSON dengan payload spesifik channel—misalnya, book updates, price changes, tick size changes—yang harus didorong ke skema internal yang seragam (misalnya, menggunakan normalizer) untuk menyederhanakan pemrosesan downstream.[^16][^8][^9]

![Contoh payload JSON RTDS dan CLOB WSS.](assets/images/polymarket/json_payload_samples.png)

Konsistensi skema dan normalisasi adalah fondasi analitik stabil, memudahkan penggabungan sinyal (misalnya, menggabungkan event REDEEM dari /activity dengan spike volume dari /trades).

## Streaming Real‑time: RTDS vs CLOB WSS

Secara arsitektural, RTDS adalah layanan WebSocket ringan yang menyasar feed non‑trading (misalnya, harga kripto dan komentar) dan cocok untuk memperkaya UI tanpa membebani pipeline. CLOB WSS menangani kanal trading dengan pemisahan channel market (publik, order book) dan user (otentikasi, data pribadi). Strategi koneksi harus memasukkan heartbeats, reconnection dengan backoff, dan penanganan error spesifik seperti invalid subscription (yang bisa menutup koneksi) dan auth failures.[^8][^9][^10][^12]

Tabel 6. Perbandingan RTDS vs CLOB WSS
| Kriteria                 | RTDS                                        | CLOB WSS                                                                 |
|--------------------------|---------------------------------------------|---------------------------------------------------------------------------|
| Tujuan                   | Feed non‑trading (kripto, komentar)         | Data trading: order book (market), orders/trades (user)                   |
| Channel                  | Topic‑based (crypto, comments)              | Market (publik), User (otentikasi L2)                                     |
| Autentikasi              | Optional (lihat docs)                       | Wajib L2 untuk user channel                                               |
| Keep‑alive               | PING/PONG periodik                          | PING periodik (contoh tiap 10 detik)                                      |
| Reconnection             | Auto‑reconnect disarankan                   | Reconnection dengan backoff dan idempotensi                               |
| Error handling           | Invalid topic/filter menutup koneksi        | Invalid subscription/auth failure menutup koneksi                         |

![Diagram koneksi RTDS dan CLOB WSS, включая heartbeats dan reconnection.](assets/images/polymarket/realtime_flow.png)

Dengan arsitektur ini, pipeline real‑time Anda dapat meminimalkan polling REST dan mengandalkan WSS untuk event‑driven updates. Strategi hybrid yang menggabungkan RTDS untuk sinyal ringan dan CLOB WSS untuk event trading memastikan latensi rendah tanpa mengorbankan keandalan.

## Metode Alternatif: GraphQL (Bitquery) dan Scrape/Third‑party

Bila official API tidak tersedia atau memberikan keterbatasan, Bitquery menyediakan GraphQL API yang mengakses data Polymarket langsung dari blockchain Polygon. Bitquery memetakan event smart contract inti—Main Polymarket Contract (condition preparation/resolution, split/merge, redemption), UMA Adapter (Request/Propose/Dispute/Resolved price), serta CTF Exchange (OrderCreated/Filled/Cancelled, LiquidityAdded/Removed)—dengan query yang dapat difilter berdasarkan alamat kontrak, nama event, dan argumen event. Pendekatan ini memberi visibilitas on‑chain granular, cocok untuk analitik transaksi, rekonstruksi order book, dan pemantauan oracle UMA.[^18][^21]

Tabel 7. Kontrak Inti & Event Kunci (Bitquery)
| Kontrak                         | Alamat (contoh)                           | Event Kunci (contoh)                                   | Kegunaan Analitik                                                |
|---------------------------------|-------------------------------------------|--------------------------------------------------------|------------------------------------------------------------------|
| Main Polymarket Contract        | 0x4d9...045                               | ConditionPreparation, ConditionResolution, PositionSplit, PositionsMerge, PayoutRedemption | Deteksi pembuatan/resolusi pasar, aktivitas posisi, redemption   |
| UMA Adapter                     | 0x6507...A7                               | RequestPrice, ProposePrice, DisputePrice, ResolvedPrice| Pemantauan oracle UMA (inersia, sengketa, finalitas)             |
| CTF Exchange                    | 0xC5d5...0a                               | OrderCreated, OrderFilled, OrderCancelled, LiquidityAdded/Removed | Rekonstruksi eksekusi, volume, likuiditas                       |

Bitquery IDE menyediakan query contoh peruse‑case (event terbaru, pasar baru, resolusi terbaru, payout spesifik trader) yang mempercepat onboarding. Namun, pendekatan ini membutuhkan penurunan (downshifting) dari nivel API ke event blockchain, sehingga Anda harus membangun skema, agregasi, dan normalisasi sendiri. Untuk scraping, utilitas pihak ketiga (mis. Apify) menawarkan collectors untuk event pasar, namun legal dan kebijakan penggunaan harus ditinjau dengan hati‑hti sebelum produksi. Integrasi bot trading ekosistem (mis., NautilusTrader) dapat membantu penggunaan langsung pada sinyal production, though typically fokus ke eksekusi live market dan trade adapter.[^18][^22][^24]

![Peta peristiwa Polymarket di blockchain dan kaitan dengan UMA.](assets/images/polymarket/contract_events_map.png)

## Strategi Implementasi: Arsitektur, Scaling, dan Observability

Arsitektur yang direkomendasikan bersifat event‑driven dan menggunakan kombinasi WebSocket + REST:

1) Ingestion: Subscribe RTDS untuk feed ringan dan CLOB WSS untuk market/user data. Terapkan heartbeats dan reconnection dengan backoff eksponensial dan jitter.  
2) Normalization: Mapping payload ke skema internal konsisten; gunakan idempotency keys berbasis timestamp/transactionHash untuk mencegah duplikasi.  
3) Persistence: Simpan event ke storage berpartisi (mis. time‑series atau columnar) dengan index pada conditionId, user, dan timestamp.  
4) Enrichment: Gabungkan Data‑API untuk backfill historis, variasi agregasi PnL, dan konsolidasi aktivitas (mis. /activity untuk redemption).  
5) Caching & Backoff: Implementasikan cache sekunder (mis. LRU atau distributed cache) untuk respons REST yang sering; gunakan exponential backoff dengan circuit breaker saat overload atau error berulang.  
6) Observability:monitor metrik seperti drop rate WebSocket, latency end‑to‑end, error rate per channel, backlog queue, serta coverage stream vs REST.

![Arsitektur pipeline data Polymarket end‑to-end.](assets/images/polymarket/pipeline_architecture.png)

Tabel 8. Checklists Implementasi
| Area                  | Item Utama                                                                                   |
|-----------------------|-----------------------------------------------------------------------------------------------|
| Security              | Pisahkan kredensial L1/L2; rotasi kunci berkala; enkripsi at‑rest; strict IAM; audit akses   |
| Resilience            | Reconnection dengan backoff + jitter; idempotency keys; retry bounded; circuit breaker        |
| Data Quality          | Schema validation; deduplication; watermarking (last seen timestamp); cross‑check WSS vs REST |
| Performance           | Adaptive polling interval; batching permintaan; prefetch untuk watchlist; resource quotas     |
| Compliance            | Tinjau ToS; rate limit monitoring; kebijakan scraping/scraping third‑party                     |

Strategi ini selaras dengan praktik integrasi resmi Polymarket dan ekosistem CLOB, serta didukung klien WebSocket resmi untuk memperkokoh koneksi dan subscription. Gunakan tool integrasi yang ada (mis., real‑time data client) untuk mempercepat implementasi.[^8][^9][^12][^5]

## Risiko, Kepatuhan, dan Best Practices

- Rate limits dan perubahan API: Tidak ada nilai limit eksplisit di dokumentasi resmi yang tersedia; watch changelog dan siapkan mitigasi adaptif (backoff, jitter, circuit breaker).  
- Kepatuhan dan ToS: Pastikan penggunaan Data‑API dan CLOB sesuai syarat layanan; hindari scraping yang melanggar kebijakan; audit legal untuk third‑party tools.  
- Keamanan kredensial: Simpan secret/passphrase di KMS atau secret manager; jangan hardcode; batasi privilege; gunakan HMAC dan EIP‑712 sesuai docs; rotasi kunci berkala.  
- Standar blockchain: Pahami peran UMA sebagai optimistic oracle, finalitas resolusi berdasarkan jendela sengketa, dan standar ERC‑1155 untuk token hasil. Aktivitas redemption bisa intensif gas; خطط accordingly untuk biaya operasional.[^4][^17][^19][^20]

## Lampiran Teknis

Contoh header L1 dan L2:
- L1 (Private Key): POLY_ADDRESS, POLY_SIGNATURE (EIP‑712), POLY_TIMESTAMP, POLY_NONCE.  
- L2 (API Key): POLY_ADDRESS, POLY_SIGNATURE (HMAC), POLY_TIMESTAMP, POLY_API_KEY, POLY_PASSPHRASE.[^4]

Contoh subscription message (CLOB WSS, user channel):
```
{
  "action": "subscribe",
  "subscriptions": [
    {
      "type": "user",
      "markets": ["<conditionId_1>", "<conditionId_2>"],
      "auth": {
        "key": "<apiKey>",
        "secret": "<apiSecret>",
        "passphrase": "<apiPassphrase>"
      }
    }
  ]
}
```
Contoh RTDS subscribe (topik crypto prices):
```
{
  "action": "subscribe",
  "subscriptions": [
    {
      "topic": "crypto_prices",
      "type": "price_update",
      "filters": "symbol=ETH;interval=5s"
    }
  ]
}
```

Contoh GraphQL (Bitquery) untuk mengambil event “OrderFilled” pada CTF Exchange:
```
{
  EVM(
    dataset: realtime,
    network: matic
  ) {
    Events(
      orderBy: { descending: Block_Time }
      limit: { count: 50 }
      where: {
        Log: {
          Signature: { Name: { is: "OrderFilled" } }
          Header: { Address: { is: "0xC5d563A36AE78145C45a50134d48A1215220f80a" } }
        }
      }
    ) {
      Block { Time Number Hash }
      Receipt { ContractAddress }
      Transaction { Hash }
      Log {
        Arguments {
          Name
          Value {
            ... on EVM_ABI_Address_Value_Arg { address }
            ... on EVM_ABI_Integer_Value_Arg { integer }
            ... on EVM_ABI_String_Value_Arg { string }
            ... on EVM_ABI_Boolean_Value_Arg { bool }
          }
        }
      }
    }
  }
}
```

Contoh Data‑API requests:
- GET /positions?user=<wallet>&sortBy=TOKENS&sortDirection=DESC&limit=100  
- GET /trades?user=<wallet>&side=BUY&limit=100  
- GET /activity?user=<wallet>&type=REDEEM,SPLIT,MERGE&sortBy=TIMESTAMP&sortDirection=DESC  
- GET /holders?market=<conditionId>&limit=50  
- GET /value?user=<wallet>[&market=<conditionId>]

![Contoh request/response Data‑API dan WSS.](assets/images/polymarket/request_response_samples.png)

## Informasi yang Belum Tersedia (Information Gaps)

- Nilai spesifik rate limits resmi tidak tercantum pada halaman dokumentasi yang tersedia.  
- Skema payload lengkap per message type CLOB WSS dan RTDS tidak diekstrak secara penuh dari semua sub‑halaman.  
- Daftar endpoint REST CLOB detail (termasuk parameter wajib/opsional dan contoh respons) tidak lengkap pada halaman ringkasan.  
- Kebijakan legal/ToS mengenai scraping sites produksi tidak dirinci; perlu review manual.  
- Detail stabilitas host produksi dan versi (misalnya perubahan host WSS/RTDS) memerlukan verifikasi environment aktual.

## Referensi

[^1]: Polymarket Documentation: What is Polymarket? — https://docs.polymarket.com/  
[^4]: Authentication — Polymarket CLOB — https://docs.polymarket.com/developers/CLOB/authentication  
[^5]: Endpoints — Polymarket CLOB — https://docs.polymarket.com/developers/CLOB/endpoints  
[^6]: Polymarket Data API Docs — GitHub Gist — https://gist.github.com/shaunlebron/0dd3338f7dea06b8e9f8724981bb13bf  
[^7]: Overview — Gamma Markets API — Polymarket — https://docs.polymarket.com/developers/gamma-markets-api/overview  
[^8]: Real Time Data Socket (RTDS) — Overview — https://docs.polymarket.com/developers/RTDS/RTDS-overview  
[^9]: WSS Quickstart — Polymarket — https://docs.polymarket.com/quickstart/websocket/WSS-Quickstart  
[^10]: WSS Authentication — Polymarket — https://docs.polymarket.com/developers/CLOB/websocket/wss-auth  
[^11]: CLOB Introduction — Polymarket — https://docs.polymarket.com/developers/CLOB/introduction  
[^12]: Polymarket/real-time-data-client — GitHub — https://github.com/Polymarket/real-time-data-client  
[^13]: WSS Overview — Polymarket — https://docs.polymarket.com/developers/CLOB/websocket/wss-overview  
[^16]: Get User Positions (Data‑API) — Polymarket — https://docs.polymarket.com/developers/misc-endpoints/data-api-get-positions  
[^17]: Polymarket Changelog — https://docs.polymarket.com/changelog/changelog  
[^18]: Polymarket API Documentation — Bitquery — https://docs.bitquery.io/docs/examples/polymarket-api/  
[^19]: UMA Documentation — https://docs.umaproject.org/  
[^20]: Conditional Token Framework — Gnosis Docs — https://docs.gnosis.io/conditionaltokens/  
[^21]: Querying Blockchain Data from Polymarket — The Graph Docs — https://thegraph.com/docs/es/subgraphs/guides/polymarket/  
[^22]: Polymarket Markets Scraper API — Apify — https://apify.com/louisdeconinck/polymarket-events-scraper/api  
[^24]: Polymarket | NautilusTrader Documentation — https://nautilustrader.io/docs/nightly/integrations/polymarket/