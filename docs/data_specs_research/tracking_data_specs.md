# Spesifikasi Data untuk Sistem Wallet Tracking Aktivitas Betting

## Pendahuluan, Lingkup, dan Prinsip Desain Data

Sistem wallet tracking aktivitas betting bertujuan untuk menyajikan gambaran menyeluruh, akurat, dan almost real-time tentang perilaku Dompet, aktivitas on-chain yang relevan, peristiwa pasar, serta status penyelesaian (settlement) dari peristiwa yang dipertaruhkan. Fokus bukan semata-mata “apa yang terjadi”, tetapi “apa maknanya terhadap portofolio, exposure, dan kewajiban pengguna”—baik dari sisi operasional, analitik, maupun kepatuhan. Pada konteks DeFi/prediction market, karakteristik umum meliputi transparansi transaksi, ketahanan terhadap perusakan (tamper-evident), dan instan settlement yang bergantung pada oracle/penyedia hasil event tertentu. Pola arsitektur data dan operasi streaming berperan sentral dalam memastikan sistem dapat mempertahankan latensi rendah, integritas event, dan konsistensi historis lintas rantai[^8][^4].

Lingkup sistem mencakup:
- Alamat Dompet dan integrasi ENS (forward dan reverse), termasuk dukungan L2 dan verifikasi dua arah.
- Data event betting on-chain (minim amount, market/event, position, odds, outcome, status settlement, biaya gas) dan pemetaan ABI/event dari kontrak.
- Kebutuhan data historis (model time-series, reorg handling, retention, heatmaps/alokasi portofolio, laporan pajak).
- Kebutuhan streaming real-time (WebSocket, SSE, Webhook) untuk event, status transaksi, PnL, harga pasar, notifikasi.
- Trigger notifikasi (placed, filled, settled, voided, large movement, oraclized, price/odds threshold, geofence/AML).
- Visualisasi dashboard (ringkasan dompet, charts, heatmap portofolio, exposure/risiko).
- Preferensi pengguna (tema, ukuran font, watchlists, alert threshold, kanal notifikasi, rate limiting, geofencing).
- Persyaratan kepatuhan (AML/KYC, audit trail, geofencing, retention, data privacy/PII off-chain, kemampuan ekspor).

Prinsip desain data:
- Minimisasi PII: Simpan identitas sensitif off-chain; gunakan on-chain hanya untuk data publik (alamat, hash event, status).
- ENS: Verifikasi dua arah (forward dan reverse); gunakan fallback L1; perhatikan propagasi L2 hingga sekitar 6 jam[^1].
- Konsistensi event dan idempotency: Semua ingest events harus idempoten; perlu mekanisme dedup dan state transition yang jelas.
- Indexed filtering: Manfaatkan parameter indexed pada event untuk performa; non-indexed dibaca via fungsi view jika diperlukan[^6][^7].
- Latensi rendah: Gunakan push-based streaming (WebSocket/SSE) untuk event penting; Webhook untuk delive ringkas berbasis trigger[^5][^4].
- Compliance by design: Integrasikan AML/KYC, geofencing, audit trail, dan hak subjek data (akses/hapus) sejak awal[^14][^10].

Informasi yang belum完全確定 (information gaps):
- ABI/event schema spesifik kontrak betting (nama event, parameter indexed/non-indexed).
- Jaringan target (EVM L1/L2, dan dukungan multi-rantai) serta SLA provider (latensi, rate limit).
- Ambang notifikasi default (size/percent change) dan struktur biaya (fee/royalty/kemenangan).
- Detail oracle/penyedia hasil (finality/confirmations) dan standar finalitas blok per jaringan.
- Kebijakan retensi/historical storage per tabel (rokok, biaya, audit) serta kebutuhan laporan pajak per yurisdiksi.
- Preferensi lokalisasi, format tanggal/angka, zona waktu pengguna.

Bagian-bagian berikut mendetailkan blueprint data, model domain, kebutuhan historis, streaming, notifikasi, visualisasi, preferensi, kepatuhan, dan matriks data komprehensif.

---

## Model Data Domain: Wallet, ENS, Transaksi Betting, Event, dan Status

Model domain inti dibangun untuk связывать identitas dompet dan nama ENS, semua event betting on-chain, settlement/result, referensi pasar/event, exposure pengguna, hingga logika akuntabilitas/notifikasi. Pada DeFi/prediction markets, likuiditas, oracle, dan settlement berbasis smart contract adalah komponen sentral yang memengaruhi data yang harus disimpan dan diturunkan[^8].

Gambaran entitas inti:
- Wallet: alamat, label internal, catatan label ENS, chainId, createdAt, updatedAt.
- ENS Name: nama, chainId,coinType, status verifikasi, TTL, fallback L1.
- BettingTransaction: riferensi ke event betting on-chain, nilai, biaya, status, market/event, posisi, odds, outcome, settlement details, referensi txHash/blockNumber.
- Market/Event: kunci pasar/event, kategori, oracle, aturan settlement.
- Position: posisi pengguna per market/event, size, odds, PnL, exposure.
- Settlement/Result: hasil resmi, status finality, блок confirmations.
- Notification: event notifikasi, kanal, status terkirim, idempotencyKey.
- UserPreference: preferensi UI, alert thresholds, kanal notifikasi, geofence, rate limiting.
- Compliance: status AML/KYC, audit trail, retention schedule, export requests.

Hubungan antartabel secara logis mengikuti alur: Wallet memiliki ENS; Wallet memiliki banyak Transaksi/Event; Transaksi terkait Market/Event; Settlement menutup status Transaksi/Position; Notification mengandalkan event state; Preference mengatur threshold dan kanal; Compliance mencatat semua perubahan penting dan permintaan hukum/pengguna[^8][^10].

Untuk memperjelas struktur data inti, Tabel 1 merangkum entitas, field kunci, tipe, dan indeks yang dibutuhkan.

### Tabel 1. Matriks Entitas-Field-Tipe-Indeks

| Entitas            | Field Kunci                                    | Tipe Data                    | Deskripsi Singkat                                                                 | Indeks/Key                       |
|--------------------|--------------------------------------------------|------------------------------|------------------------------------------------------------------------------------|----------------------------------|
| Wallet             | address                                         | string                       | Alamat EVM dompet                                                                  | PK (address+chainId)             |
|                    | chainId                                         | number                       | ID jaringan EVM                                                                    | Composite idx (address+chainId)  |
|                    | label                                           | string (nullable)            | Label internal untuk dompet                                                         | idx(label)                       |
|                    | createdAt, updatedAt                            | timestamp                    | Waktu buat/perbarui                                                                | idx(updatedAt)                   |
| ENS Name           | name                                            | string                       | Nama ENS                                                                           | idx(name+chainId)                |
|                    | address                                         | string                       | Alamat hasil forward resolution                                                     | idx(address+chainId)             |
|                    | chainId, coinType                               | number, number               | Rantai target dan coinType untuk L2                                                 | idx(chainId+coinType)            |
|                    | verified                                        | boolean                      | Status verifikasi forward match reverse                                            | idx(verified)                    |
|                    | ttl                                             | number (nullable)            | Masa berlaku cache resolver                                                         | —                                |
|                    | isFallbackL1                                    | boolean                      | Gunakan L1 sebagai fallback default                                                 | idx(isFallbackL1)                |
| BettingTransaction | txHash                                          | string                       | Hash transaksi on-chain                                                             | idx(txHash)                      |
|                    | blockNumber                                     | number                       | Blok tempat event terjadi                                                           | idx(blockNumber)                 |
|                    | contractAddress                                 | string                       | Alamat kontrak sumber event                                                         | idx(contractAddress)             |
|                    | eventName                                       | string                       | Nama event betting                                                                  | idx(eventName)                   |
|                    | amount, fee                                     | decimal                      | Jumlah dipertaruhkan dan biaya                                                      | idx(amount), idx(fee)            |
|                    | marketId, eventId                               | string                       | Identitas market/event                                                              | idx(marketId), idx(eventId)      |
|                    | positionSide, odds                              | string, decimal              | Sisi posisi (long/short/yes/no), nilai odds                                         | idx(positionSide), idx(odds)     |
|                    | outcome, status                                 | string, string               | Hasil (jika sudah tersettlement) dan status (placed/filled/settled/voided)          | idx(outcome), idx(status)        |
|                    | settlement.finalityStatus, confirmations        | string, number               | Status finalitas settlement dan jumlah konfirmasi blok                              | idx(settlement.finalityStatus)   |
| Market/Event       | marketId                                        | string                       | Kunci pasar                                                                        | PK                               |
|                    | category, oracle                                | string, string               | Kategori pasar/event dan sumber oracle                                              | idx(category), idx(oracle)       |
|                    | settlementRules                                 | json                         | Aturan settlement (mis. quorum, source)                                             | idx(settlementRules)             |
| Position           | walletAddress, marketId                         | string, string               | Identitas pengguna dan pasar                                                        | Composite idx                    |
|                    | size, entryPrice, odds                          | decimal, decimal, decimal    | Ukuran posisi, harga masuk, odds                                                    | idx(size), idx(entryPrice)       |
|                    | unrealizedPnl, realizedPnl                      | decimal, decimal             | PnL belum/telah terealisasi                                                         | idx(unrealizedPnl), idx(realizedPnl) |
| Settlement/Result  | eventId                                         | string                       | Kunci event                                                                         | idx(eventId)                     |
|                    | resultValue                                     | string/decimal               | Hasil resmi (mis. Ya/Tidak, skor)                                                   | idx(resultValue)                 |
|                    | finalizedAt                                     | timestamp                    | Waktu finalisasi hasil                                                              | idx(finalizedAt)                 |
| Notification       | idempotencyKey                                  | string                       | Kunci dedup untuk mencegah duplikasi                                                 | PK                               |
|                    | eventType                                       | string                       | Jenis event (placed, settled, dll.)                                                 | idx(eventType)                   |
|                    | channel, status                                 | string, string               | Kanal (email/push/webhook/in-app), status terkirim                                   | idx(channel), idx(status)        |
|                    | lastSentAt                                      | timestamp                    | Waktu terkirim terakhir                                                              | idx(lastSentAt)                  |
| UserPreference     | userKey                                         | string                       | Kunci pengguna (off-chain identity)                                                 | PK                               |
|                    | theme, fontSize, highContrast                   | string, number, boolean      | Preferensi UI                                                                      | idx(theme)                       |
|                    | watchlists                                      | json                         | Daftar aset/market yang dipantau                                                     | idx(watchlists)                  |
|                    | alertThresholds                                 | json                         | Ambang size, %, harga/odds, volume                                                  | idx(alertThresholds)             |
|                    | notificationChannels                            | json                         | Kanal aktif (email/push/webhook/in-app/SMS)                                         | idx(notificationChannels)        |
|                    | geofence, rateLimit                             | json, number                 | Preferensi geofencing dan batas notifikasi                                          | idx(geofence), idx(rateLimit)    |
| Compliance         | recordId                                        | string                       | Kunci rekaman audit                                                                 | idx(recordId)                    |
|                    | action, actor                                   | string, string               | Aksi dan actor (sistem/admin/user)                                                  | idx(action), idx(actor)          |
|                    | timestamp                                       | timestamp                    | Waktu aksi                                                                         | idx(timestamp)                   |
|                    | legalBasis, exportId                            | string, string               | Dasar hukum pemrosesan (GDPR/CCPA), ID ekspor data                                   | idx(legalBasis), idx(exportId)   |

Indeks yang disarankan mendukung query latensi rendah: indeks komposit pada Wallet (address+chainId), BettingTransaction (status+blockNumber) untuk monitoring operasional, serta indeks pada ENS (name+chainId) dan (address+chainId) untuk verifikasi cepat. Pemodelan event mengikuti kaidah parameter indexed untuk pemfilteran efisien dan non-indexed untuk nilai detail yang dibaca via fungsi kontrak jika perlu[^6][^7][^8].

### Sub-Entitas: Wallet

Wallet menyimpan address dan chainId sebagai kunci, dengan label internal yang dapat ditetapkan operator/analis untuk memudahkan navigasi data. Keterkaitan dengan ENS dilakukan via entitas ENS Name dan proses reverse/forward resolution. Kolom createdAt/updatedAt membantu audit perubahan label. Labeling ini menurunkan kebingungan saat beberapa dompet memiliki reversed name sama atau berubah dari waktu ke waktu[^1][^2][^3].

### Sub-Entitas: ENS Name & Primary Names

ENS memiliki dua arah resolusi: forward (nama ke alamat) dan reverse (alamat ke nama). Primary name yang valid mensyaratkan kecocokan dua arah antara reverse record dan forward resolution pada chain yang sama. Dukungan L2 memungkinkan reverse di Arbitrum, Base, Linea, OP Mainnet, Scroll; fallback default dapat diatur di L1 jika belum ada reverse spesifik chain. Propagasi perubahan di L2 dapat memakan waktu hingga ~6 jam, sehingga verifikasi forward harus selalu dilakukan untuk mencegah spoofing. Cache resolver (TTL) penting untuk mencegah beban resolusi berulang. Implementasi klien dapat memanfaatkan hooks pustaka untuk mengambil nama dan mengelola cache[^1][^2][^3][^11][^12][^13].

### Sub-Entitas: BettingTransaction

Transaksi betting memuat semua data penting event on-chain: nilai dipertaruhkan, biaya, market/event, posisi dan odds, outcome dan settlement details, serta metadata transaksi (txHash, blockNumber, confirmations). State transition yang umum: placed → filled → settled/voided. Relasi ke Market/Event diperlukan untuk mengambil kategori, sumber oracle, dan aturan settlement. Settlement harus menyimpan finalityStatus (mis. awaiting oracle/confirmed) dan jumlah konfirmasi blok untuk algoritme downstream (alerts, laporan). Distingsi fee/royalty/payout mengikuti praktik platform: simpan komponen biaya secara terpisah dari amount; payout hanya muncul setelah settlement confirmed[^6][^7][^8].

---

## Spesifikasi Data Historis & Reorg Handling

Menyimpan data historis menuntut model time-series dan kemampuan penanganan reorg yang andal. Reorg terjadi ketika blockchain membentuk fork yang menginvalidasi blok-blok sebelumnya; bagi sistem betting, hal ini berdampak langsung pada validitas event, settlement, dan laporan. Model operasi harus memutuskan antara bekerja pada blok “finalized” versus menangani reorg secara real-time dengan operasi rollback di downstream.

Praktik modern menempatkan penyimpanan historis sebagai flat files di penyimpanan cloud (compatible S3), pembundelan blok untuk efisiensi retrieval, dan streaming historis dari height blok tertentu untuk replay. API gRPC mem_PACK data biner secara efisien; system harus dapat mencatat operasi ke tabel History khusus untuk memungkinkan rollback terarah[^10].

### Tabel 2. Skema Tabel Historis

| Tabel                         | Primary Key                  | Time Partitioning | Keys/Indexes                                                       | Retensi (policy)       | Keterangan                                       |
|------------------------------|------------------------------|-------------------|--------------------------------------------------------------------|------------------------|--------------------------------------------------|
| wallet_addresses             | address+chainId              | Bulanan           | idx(label), idx(updatedAt)                                         | 5 tahun                | Referensi dompet dan metadata                    |
| ens_names                    | name+chainId                 | Bulanan           | idx(address+chainId), idx(verified), idx(isFallbackL1)             | 5 tahun                | Cache forward/reverse, TTL per chain             |
| betting_events               | txHash                       | Harian            | idx(blockNumber), idx(contractAddress), idx(eventName)             | 7 tahun                | Log event betting on-chain                       |
| event_params_nonindexed      | eventId                      | Harian            | idx(eventId), idx(paramName)                                       | 7 tahun                | Nilai detail non-indexed (via view/functions)    |
| transactions                 | txHash                       | Harian            | idx(blockNumber), idx(status), idx(walletAddress)                  | 7 tahun                | Metadata transaksi, status                       |
| settlements                  | eventId+finalityVersion      | Harian            | idx(resultValue), idx(finalizedAt)                                 | 7 tahun                | Hasil, finality, jumlah konfirmasi               |
| prices_market                | marketId+ts                  | Harian            | idx(marketId+ts), idx(source)                                      | 5 tahun                | Referensi pasar/event; harga/odds jika tersedia  |
| exposures                    | walletAddress+marketId       | Bulanan           | idx(size), idx(entryPrice), idx(unrealizedPnl)                     | 5 tahun                | Posisi pengguna, exposure                        |
| audit_log                    | recordId                     | Bulanan           | idx(action), idx(actor), idx(timestamp)                            | 7 tahun                | Audit trail, perubahan penting                   |
| notifications                | idempotencyKey               | Harian            | idx(eventType), idx(channel), idx(status)                          | 2 tahun                | Log notifikasi terkirim, rate limiting           |
| compliance_events            | recordId                     | Bulanan           | idx(action), idx(legalBasis), idx(exportId)                        | 7 tahun                | Kepatuhan: permintaansubjek data, geofencing    |
| user_preferences             | userKey                      | Bulanan           | idx(theme), idx(alertThresholds), idx(notificationChannels)        | 2 tahun                | Preferensi pengguna dan salinan comply-by-design |

Data historis dipartisi waktu (bulanan/harian) untuk query rentang yang efisien. Retensi dipetakan sesuai kebutuhan audit dan pajak; compress/aggregate strategi dilakukan di archival (mis. downsampling untuk metrics long-term). Reorg handling mengandalkan operation log di tabel History dan dukungan provider streaming untuk notifikasi reorg. Payload event idempoten; downstream consumer harus menerapkan deduplication berdasarkan kunci idempoten[^10][^4].

### Tabel 3. Kebijakan Retensi & Kompresi

| Kategori Data                 | Retensi Aktif | Kompresi/Agregasi           | Tujuan                              |
|-------------------------------|---------------|-----------------------------|--------------------------------------|
| Log event betting/transaksi   | 7 tahun       | Kompresi blok, agregasi daily | Audit dan sengketa                   |
| Settlement/hasil              | 7 tahun       | Simpan finalityVersion      | Bukti hasil final                    |
| Prices/odds referensi         | 5 tahun       | Downsample ke hourly/daily  | Reporting, analitik tren             |
| Audit/compliance              | 7 tahun       | WORM storage (write-once)   | Integritas bukti                     |
| Preferences/notifications     | 2 tahun       | Kompresi ringan             | Optimasi biaya, privasi              |

---

## Kebutuhan Streaming Real-Time & Sumber Data

Event-driven architecture adalah inti kebutuhan real-time. WebSocket menyediakan komunikasi persisten dan latensi rendah; SSE relevan untuk push aliran event berbasis teks satu arah; Webhook menyediakan trigger event yang hemat ресур. Model produksi-konsumsi dengan broker pesan (mis. Kafka) meningkatkan skalabilitas dan resilience, serta memudahkan replay. Strategi retry/exponential backoff, heartbeat/keepalive, dan reorder handling penting untuk keandalan[^4][^5][^6][^7].

### Tabel 4. Perbandingan Webhook vs WebSocket vs SSE vs Polling

| Metode     | Biaya Operasional | Skalabilitas | Keandalan                | Latensi       | Kompleksitas |
|------------|-------------------|--------------|--------------------------|---------------|--------------|
| Webhook    | Rendah (push)     | Tinggi       | Baik dengan retry/sign   | Sangat rendah | Rendah       |
| WebSocket  | Sedang            | Tinggi       | Baik dengan broker       | Sangat rendah | Sedang       |
| SSE        | Rendah            | Sedang       | Baik untuk teks satu arah| Rendah        | Rendah       |
| Polling    | Tinggi (banyak req)| Rendah       | Rendah (missed windows)  | Tinggi        | Rendah       |

### Tabel 5. Endpoint & Topik Streaming

| Sumber                | Protokol     | Topik/Channel                         | Payload Utama                        | Catatan Keamanan              |
|-----------------------|--------------|---------------------------------------|--------------------------------------|-------------------------------|
| Kontrak betting       | WebSocket    | logs (event betting)                  | event data (indexed+non-indexed)     | API keys, OAuth, IP whitelist |
| RPC node (EVM)        | WebSocket    | newHeads/logs                         | header/log blok                       | Rate limit, reconnect         |
| Provider webhook      | HTTPS        | user-specific triggers                | event summary + idempotencyKey       | Signature verification        |
| Stream agregator      | SSE          | public stream                         | event teks ringkas                    | SSL, CORS                     |
| Broker pesan          | —            | topics per domain                     | serialisasi JSON                      | ACL/role, audit               |

Payload约定: gunakan JSON; setiap event menyertakan eventId, eventType, chainId, txHash, blockNumber, timestamp, dan detail spesifik domain. Semua event harus idempoten; consumidor harus menyimpan idempotencyKey untuk dedup. Implementasi WebSocket modern memanfaatkan filter event, maintenance koneksi via periodic block number checks, dan fallback historian melalui queryFilter untuk menjangkau 100 blok terakhir pada startup[^6]. Webhook berguna untuk skenario “jika-ini-maka-itu” dan efisiensi dibanding polling; namun harus diamankan dengan tanda tangan payload dan HTTPS[^5]. Best practices streaming menekankan keamanan (kontrol akses, rate limiting), monitoring anomali, buffering lonjakan, dan pemeriksaan urutan event[^4].

### Strategi Multi-Sumber dan Failover

Gabungkan subscribe langsung ke node RPC (WebSocket) untuk event hoog-priority dengan provider webhook untuk pemicu operasional (mis. settlement confirmed). Pastikan idempotency cross-sumber; jika sumber primario gagal, sumber sekunder mengirim event duplikat yang dapat dieliminasi via idempotencyKey. Gunakan broker pesan untuk decoupling; konsumsi ulang (replay) untuk pemulihan kondisi saat downstream restart[^5][^10].

---

## Model Data Event Betting & ABI Mapping

Event adalah sistem notifikasi asli blockchain; struktur Solidity mengizinkan parameter indexed untuk pemfilteran efisien dan parameter non-indexed untuk payload yang lebih besar. ABI (Application Binary Interface) mendefinisikan antarmuka kontrak (fungsi/event) sehingga aplikasi off-chain dapat membaca event secara konsisten. Pada betting/prediction markets, event umum meliputi BetPlaced, BetFilled, MarketCreated, Settled, Voided. Standar skema belum terversifikasi lintas platform; oleh karena itu, minimal skema harus disepakati untuk interoperabilitas downstream[^6][^7][^8].

### Tabel 6. Skema Log Event (minimal)

| Field           | Tipe        | Wajib | Deskripsi                                         | Indexed |
|-----------------|-------------|-------|---------------------------------------------------|--------|
| eventId         | string      | Ya    | ID unik event (hash tx + logIndex)               | —      |
| eventName       | string      | Ya    | Nama event (mis. BetPlaced)                      | —      |
| chainId         | number      | Ya    | ID jaringan EVM                                  | —      |
| contractAddress | string      | Ya    | Alamat kontrak sumber                            | —      |
| txHash          | string      | Ya    | Hash transaksi                                    | —      |
| blockNumber     | number      | Ya    | Nomor blok                                        | —      |
| timestamp       | number      | Ya    | Epoch timestamp                                   | —      |
| walletAddress   | address     | Ya    | Alamat dompet pengguna                            | Ya     |
| amount          | decimal     | Ya    | Jumlah dipertaruhkan                              | —      |
| fee             | decimal     | Tidak | Biaya/gas terkait                                 | —      |
| marketId        | string      | Ya    | ID market/event                                   | Ya     |
| positionSide    | string      | Tidak | Sisi posisi (mis. yes/no, long/short)             | —      |
| odds            | decimal     | Tidak | Nilai odds saat entry                             | —      |
| outcome         | string      | Tidak | Hasil akhir (jika sudah settle)                   | —      |
| status          | string      | Ya    | placed/filled/settled/voided                      | —      |
| settlement.finalityStatus | string | Tidak | Status finalitas (awaiting/confirmed)             | —      |
| settlement.confirmations  | number | Tidak | Jumlah konfirmasi blok                            | —      |
| eventSignature  | string      | Ya    | Signature event (topic[0])                        | —      |

Kontrak harus memicu event pada state transition kunci; indexed parameters (address, marketId) mempercepat filter di node. Nilai non-indexed (amount, odds) perlu pembacaan via fungsi view jika kontrak tidak memancarkannya lengkap dalam log. Penamaan event dan payload yang konsisten memudahkan konsolidasi lintas platform betting DeFi[^6][^7][^8].

#### Event: BetPlaced

Event ini menandai entry pengguna. Wajib memiliki amount, marketId/eventId, posisi/odds. Status awal placed/filled bergantung pada alur eksekusi kontrak. Odds pada saat penempatan disimpan untuk perhitungan PnL dan settlement.

#### Event: Settled/Voided

Menandai resolusi outcome. Settled menyimpan hasil (mis. Ya/Tidak), payout komponen, dan finality. Voided menandakan pembatalan event (mis. riset oracles gagal atau aturan pasar dilanggar).

---

## Notification Trigger Events & Kebijakan Kanal

Sistem harus mengirim notifikasi ketika kondisi materially relevant tercapai. Prioritas utama adalah state change betting (placed, filled, settled, voided), aktivitas besar (large movement), capaian threshold harga/odds, perubahan oracle/finality, serta sinyal AML/geofence.

### Tabel 7. Matriks Trigger-Kanal-Payload

| Event Trigger                 | Kondisi阈值                         | Kanal                       | Payload Utama                                  | Idempotency/SLA           |
|------------------------------|-------------------------------------|-----------------------------|------------------------------------------------|---------------------------|
| BetPlaced                    | —                                   | In-app, push                | eventId, amount, marketId, status              | Idempotent; <1s latensi   |
| BetFilled                    | —                                   | In-app, email               | txHash, status                                 | Idempotent; <1s           |
| Settled                      | Finality confirmed                   | Push, webhook               | eventId, outcome, payout, finalityStatus       | Idempotent; retry/backoff |
| Voided                       | Pembatalan event                     | Push, email                 | eventId, reason                                | Idempotent                |
| Large movement               | size/percent threshold               | Push, webhook               | txHash, amount, %change                         | Idempotent; rate-limited  |
| Price/odds threshold         | harga/odds mencapai batas            | In-app, email               | marketId, currentPrice, odds                   | Idempotent; suppress duplicates |
| Oracle/finality change       | status berubah                       | In-app                      | eventId, finalityStatus, confirmations         | Idempotent                |
| AML/geofence                 | rule triggered                       | Email, in-app               | ruleId, action, actor                          | Idempotent; audit         |

Best practices: signature verification untuk webhook, HTTPS, dan rate limiting. Payload harus ringkas dan idempoten; konsumen memverifikasi idempotencyKey dan timestamps untuk dedup. Implementasi hybrid antara streaming dan webhook memastikan latensi rendah dan efisiensi. Prefensi pengguna menentukan kanal aktif dan threshold[^5][^4][^9].

#### State Change: Placed/Filled/Settled/Voided

Setiap event di-publish pada state transition. Settled voided mengakhiri alur. Payload menyertakan eventId, status, outcome (jika applicable), dan finality untuk mendorong tindakan pengguna (mis. menarik payout).

#### Large Movement & Threshold Alerts

Threshold default ditentukan operator; pengguna dapat mengonfigurasi besaran jumlah dan persentase. Notifikasi besar harus tunduk pada rate limiting untuk menghindari spam; suppression policy bisa diterapkan (mis. satu notifikasi per rentang waktu untuk event berulang).

---

## Persyaratan Visualisasi Dashboard

Dashboard menyajikan ringkasan dompet (saldo, exposure, PnL), charts harga/odds, heatmap alokasi portofolio, exposure/risiko per market/event, dan status transaksi real-time. Prinsip UI/UX: kontras tinggi, mode gelap, modular/widget-based layout, responsif, dan jelas. Pola ini ditemukan luas pada pelacak kripto terbaik dan pedoman UI dompet kripto[^16][^17].

### Tabel 8. Matriks Widget-KPI-Query

| Widget                          | KPI                          | Sumber                         | Interval Refresh | Keterangan                          |
|---------------------------------|------------------------------|--------------------------------|------------------|-------------------------------------|
| Ringkasan dompet                | Saldo, total exposure, PnL   | wallet_addresses, exposures    | 1–5s             | Idempotent aggregation               |
| Chart harga/odds                | Harga, odds vs waktu         | prices_market, events          | 1–5s             | SSE/WebSocket push                   |
| Heatmap alokasi portofolio      | Alokasi per aset/market      | exposures                      | 5–10s            | Group by category/marketId           |
| Tabel status transaksi          | placed/filled/settled/voided | transactions, events           | 1–5s             | Live update; idx(status+blockNumber) |
| Peta risiko per market/event    | Unrealized/realized PnL      | exposures, settlements         | 5–10s            | Filter by finality                   |
| Log notifikasi                  | LastSent, status             | notifications                  | 5–10s            | Rate limiting & dedup visibility     |

Pustaka charting dan data grid modern memudahkan implementasi, termasuk data real-time dan interaktif; preferensi pengguna (tema, ukuran font, high contrast) memengaruhi estetika widget. Data konsolidasi all-in-one memudahkan анализ cepat[^16][^15][^17].

---

## Preferensi Pengaturan Pengguna & Kontrol Notifikasi

Preferensi pengguna harus configurable, memengaruhi UI dan behavior sistem. Manajemen watchlists, alert thresholds, kanal notifikasi, rate limiting, dan geofencing harus tersedia secara eksplisit. Privacy dan kepatuhan mewajibkan bahwa preferensi disimpan off-chain dan diakses via kontrol akses ketat[^14][^10].

### Tabel 9. Skema Preferensi

| Field                   | Tipe     | Default           | Validasi                            | Dampak                                        |
|-------------------------|----------|-------------------|-------------------------------------|-----------------------------------------------|
| theme                   | string   | system            | {system,dark,light}                 | UI tema                                       |
| fontSize                | number   | 14                | 12–20                                | Aksesibilitas                                  |
| highContrast            | boolean  | false             | boolean                              | Aksesibilitas                                  |
| watchlists              | json     | []                | array marketId/assetId               | Fokus pantauan                                 |
| alertThresholds.size    | decimal  | operator default  | ≥0                                   | Large movement                                 |
| alertThresholds.pct     | decimal  | operator default  | 0–100                                | % change                                       |
| alertThresholds.price   | decimal  | operator default  | ≥0                                   | Harga threshold                                |
| alertThresholds.odds    | decimal  | operator default  | ≥0                                   | Odds threshold                                 |
| notificationChannels    | json     | {push:true}       | subset of {email,push,webhook,in-app,SMS} | Kanal aktif                            |
| geofence                | json     | {}                | ISO country codes/regions            | Kepatuhan geografis                            |
| rateLimit               | number   | 60/min            | 1–600                                | Mencegah spam notifikasi                       |
| dataRetentionPreference | string   | standard          | {standard,extended}                  | Preferensi retensi (dukung compliance)         |

Rate limiting disepakati untuk menghindari kebosanan dan penyalahgunaan; geofence memengaruhi ketersediaan fitur sesuai yurisdiksi. Preferensi UI/UX mengikuti prinsip dompet kripto modern (mode gelap, kontras tinggi, susunan menu modular)[^17][^14][^10].

---

## Kepatuhan & Keamanan Data (Compliance by Design)

Regulator worldwide bergerak menuju aturan yang lebih ketat dan terstandardisasi. Kerangka utama mencakup Uni Eropa MiCA, OECD CARF, dan IRS AS (Form 1099-DA). Implikasinya bagi data: sistem harus mendukung AML/KYC, audit trail, geofencing, retensi, dan perlindungan data (GDPR/CCPA). Praktik teknis: PII off-chain terenkripsi, logging akses, encryption at rest/in transit, kontrol role-based, hak subjek data (akses/hapus), serta audit keamanan smart contract. Ke depan, modularitas compliance dan kemampuan konfigurasi cepat menjadi keharusan[^14].

### Tabel 10. Matriks Kepatuhan

| Kerangka           | Persyaratan Data Utama                       | Field Minimum                         | Kontrol Teknis                           | Retensi              |
|--------------------|-----------------------------------------------|---------------------------------------|------------------------------------------|----------------------|
| EU MiCA            | Perizinan, whitepaper, cadangan stablecoin    | recordId, action, timestamp           | RBAC, audit log, geofencing              | ≥7 tahun             |
| OECD CARF          | Pelaporan lintas batas                       | userKey (off-chain), exportId         | Export terstruktur, enkripsi             | ≥7 tahun             |
| US 1099-DA         | Pelaporan pajak detail transaksi              | txHash, eventId, amount, fee          | Audit log, data integrity, bisa ZKPs     | ≥7 tahun             |
| GDPR/CCPA          | Privasi, hak subjek data                      | legalBasis, exportId, userKey         | Enkripsi, akses terkontrol, delete/export| ≥2 tahun (preferensi)|

Audit trail menyimpan perubahan penting: setting preferensi, status settlement, trigger notifikasi, dan akses data sensitif. PII disimpan off-chain; on-chain cukup hash/pointer. Hashing atau ZKP dapat digunakan untuk verifikasi tanpa pengungkapan data mentah[^14][^10].

---

## Matriks Data Komprehensif & Alur End-to-End

Untuk memastikan sistem mencapai kualitas, latensi, dan konsistensi data yang diharapkan, Matriks Data (Tabel 11) memetakan entitas, field kunci, sumber, akurasi, metode ingest, SLA latensi, dan prosedur koreksi.瘦作 ini adalah “single source of truth” bagi tim data/engineering untuk mengoperasionalkan sistem.

### Tabel 11. Matriks Data

| Entitas            | Field Kunci                       | Sumber            | Akurasi       | Metode Ingest                | SLA Latensi       | Prosedur Koreksi                   |
|--------------------|-----------------------------------|-------------------|---------------|------------------------------|-------------------|------------------------------------|
| Wallet             | address+chainId                   | UI/admin, on-chain| High          | WebSocket + REST             | <1s (update UI)   | label correction via admin         |
| ENS Name           | name, address, chainId            | ENS resolver      | High          | WebSocket + REST (resolve)   | <1s (cache 5–60m) | re-verify forward/reverse[^1][^2] |
| BettingTransaction | txHash, eventName, status         | Contract logs     | High          | WebSocket (logs)             | <1s               | dedup via idempotencyKey           |
| Event params       | non-indexed values                | Contract view     | Medium        | REST (contract call)         | <2s               | fallback to queryFilter[^6]        |
| Settlement         | eventId, resultValue, finality    | Contract logs     | High          | WebSocket + webhook          | <1s               | reorg rollback (History table)[^10]|
| Prices/odds        | marketId+ts                       | Market feed       | Medium        | SSE + REST                   | <1s               | reconcile dengan streaming         |
| Position           | walletAddress+marketId            | Derived           | High          | Stream processing            | <1s               | recompute upon settlement          |
| Notification       | eventType, channel, status        | Notifier          | High          | Webhook + broker             | <1s               | retry/backoff, dedup[^5]           |
| UserPreference     | theme, thresholds, channels       | UI                | High          | REST (server-side)           | <1s               | audit log, enforce policy[^14]     |
| Compliance         | recordId, action, legalBasis      | Compliance engine | High          | REST + audit log             | <1s               | re-audit, export by request        |

Alur end-to-end:
1. Resolusi ENS forward/reverse untuk dompet pada chain terkait; verifikasi dua arah; cache resolver (TTL) untuk efisiensi[^1][^2][^3].
2. Subscribe event kontrak via WebSocket; filter indexed; gunakan queryFilter untuk historis singkat saat startup; maintenance koneksi via block number ping[^6][^7].
3. Parsing event ke skema minimal; penyimpanan idempoten; dedup berdasarkan idempotencyKey; flag reorg dan perbaikan via History table[^10][^4].
4. Settlement update finality; kalkulasi payout dan PnL; publikasi notifikasi via kanal yang diaktifkan pengguna (push/email/webhook/in-app)[^5].
5. Visualisasi update real-time; watchlist dan threshold pengguna mempengaruhi highlight widget; rate limiting mencegah spam[^17].
6. Audit trail mencatat seluruh state change dan akses sensitif; preferensi pengguna disimpan off-chain; geofencing membatasi fitur sesuai yurisdiksi[^14].

---

## Lampiran: Implementasi Client & Keandalan Streaming

- Client WebSocket: gunakan provider dengan WebSocket support; inisialisasi kontrak dengan ABI; buat filter event pada address dan signature event; maintenance koneksi via periodic block number check (contoh: setiap 30 detik); reconnect dengan backoff; gunakan queryFilter untuk mengambil rentang blok terakhir (mis. 100 blok) pada startup untuk sinkronisasi historis ringan[^6][^7].
- Struktur event Solidity dan ABI: deklarasikan event dengan parameter indexed untuk address/marketId; nilai non-indexed disimpan di log atau diambil via fungsi view; emit event saat state transition kunci (bet placed, filled, settled, voided); pastikan eventName konstan untuk interoperabilitas[^6][^7].
- Keandalan: implementasi idempotency di seluruh pipeline; periksa urutan event dan_BUFFER lonjakan; gunakan broker pesan (Kafka) untuk decoupling dan replay; monitor latensi dan throughput; rotasi kredensial, kontrol akses, dan rate limiting untuk keamanan[^4][^10].
- Historical streaming & reorg: manfaatkan arsitektur yang mendukung streaming dari height blok tertentu; notifikasi reorg; simpan operasi ke History untuk rollback; gunakan API efisien (gRPC) untuk pengambilan batch blok[^10].

---

## Referensi

[^1]: Primary Names | ENS Docs. https://docs.ens.domains/web/reverse/  
[^2]: Address Lookup | ENS Docs. https://docs.ens.domains/web/resolution/  
[^3]: Resolution | ENS Docs. https://docs.ens.domains/resolution/  
[^4]: Streaming API: Real-Time Data Delivery Explained (2025 Guide). https://videosdk.live/developer-hub/websocket/streaming-api  
[^5]: Blockchain Webhooks: Notifications for Anything - Tatum.io. https://tatum.io/blog/blockchain-webhooks-how-to  
[^6]: Listening to Blockchain Events (WebSocket) - Somnia Docs. https://docs.somnia.network/developer/building-dapps/data-indexing-and-querying/listening-to-blockchain-events-websocket  
[^7]: Part 4: Real-time Blockchain Updates — Listening for Smart Contract Events with web3py. https://dev.to/divine_igbinoba_fb6de7207/part-4-real-time-blockchain-updates-listening-for-smart-contract-events-with-web3py-32dl  
[^8]: DeFi Prediction Market | Coinmonks - Medium. https://medium.com/coinmonks/defi-prediction-market-67a0cac43012  
[^9]: 8 Best Crypto Alerts Apps in 2025 - Coindive. https://coindive.app/blog/8-best-crypto-alerts-apps-in-2025  
[^10]: A Deep Dive into How to Index Blockchain Data - RockNBlock. https://rocknblock.io/blog/a-deep-dive-into-how-to-index-blockchain-data  
[^11]: ENS API — web3.py 7.14.0 documentation. https://web3py.readthedocs.io/en/stable/ens.html  
[^12]: How to Resolve ENS Domains Given a Wallet Address | Alchemy Docs. https://www.alchemy.com/docs/how-to-resolve-ens-domains-given-a-wallet-address  
[^13]: Get ENS Domain by Address | Moralis API Documentation. https://docs.moralis.com/web3-data-api/evm/reference/wallet-api/resolve-address  
[^14]: The Ultimate 2025 Crypto Compliance Checklist for Developers. https://www.blockchainappfactory.com/blog/2025-compliance-checklist-for-crypto-project-developers/  
[^15]: How to Build a Crypto Dashboard Using an API (Step-by-Step Guide). https://www.tokenmetrics.com/blog/create-powerful-crypto-dashboard-using-apis?74e29fd5_page=64  
[^16]: The 10 Best Crypto Portfolio Trackers in 2025. https://cryptopotato.com/best-crypto-portfolio-tracker/  
[^17]: User Interface (UI) for Crypto Wallets: Principles for Designing User-Friendly Wallets. https://graphicdesignjunction.com/2025/01/user-interface-ui-for-crypto-wallets-principles-for-designing-user-friendly-wallets/