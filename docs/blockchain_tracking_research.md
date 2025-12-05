# Wallet Tracking Mechanisms di Blockchain untuk Prediction Markets (Fokus: Polymarket)

## Ringkasan Eksekutif

Laporan ini menyajikan blueprint teknis riset untuk membangun sistem pelacakan dompet (wallet tracking) dan analitik on-chain yang dapat diterapkan pada prediction markets, khususnya Polymarket. Tujuan utama adalah menyusun arsitektur end-to-end yang andal untuk ekstraksi data on-chain, pemrosesan real-time, pemantauan transaksi dan peristiwa (event), pengayaan data lewat address clustering, serta optimasi performa dalam konteks laju data tinggi dan kompleksitas operasional seperti chain reorg.

Polymarket memiliki arsitektur hibrida: order book dijalankan secara off-chain sebagai central limit order book (CLOB), sedangkan eksekusi settlement terjadi on-chain dengan memanfaatkan Conditional Tokens Framework (CTF) berbasis ERC‑1155 dan oracle optimistik UMA untuk resolusi pasar. Struktur ini menentukan pendekatan teknis yang tepat untuk memonitor perilaku pasar, dompet, dan kontraknya, karena sebagian besar interaksi pengguna berlangsung off-chain, sedangkan rekonsiliasi, pencetakan, dan pembakaran posisi (positions) terjadi on-chain saat eksekusi dan resolusi pasar.[^1][^2][^3]

Kesimpulan kunci:
- Teknik ekstraksi data paling stabil untuk kebutuhan ini adalah kombinasi streams berbasis push (QuickNode Streams/Filters/Functions), pendengar event via ethers.js atau web3.py, serta WebSocket/Alchemy Notify untuk sinyal pending transaksi. Pipelines berbasis push secara material mengurangi beban polling dan biaya, sekaligus menyediakan jaminan pengiriman dan ordering near-real-time.[^8][^7][^6]
- Arsitektur referensi multi-layer (source → ingestion → processing/enrichment → storage → serving) yang tahan reorg dan meminimalkan duplikasi—menggunakan buffer sekuensial, idempotensi, dan finality checkpoints—memberi keseimbangan antara latensi dan integritas data.[^8]
- Tools yang relevan dan saling melengkapi: Etherscan API (pendekatan alternatif), The Graph (subgraphs/GraphQL), Moralis Streams (webhook multi-kontrak), QuickNode (Streams/Filters/Functions + WSS/HTTP), ethers.js/web3.py, serta providers node seperti Alchemy/QuickNode untuk akses WSS/HTTP. Pilihan bertahap direkomendasikan: mulai dari event listening langsung, lalu tingkatkan dengan streams/filters, dan pada skala besar tambahkan subgraph indexing dan/atau ETL edge functions.[^12][^14][^13][^8][^6][^10][^16]
- Best practices mencakup perancangan filters yang agresif, backpressure control, retries dengan jitter, idempotensi, caching层层, serta batching where suitable—dengan fokus pada minimisasipayload dan biaya, serta manejemen rate limit provider.[^11][^14][^8]

Risiko utama: finality (reorg), pending vs mined semantics, verifikasi signature/ABI, dan skalabilitas (thrashing saat lonjakan event). Mitigasinya adalah penggunaan streams/notify, checkpointing dengan watermarks per block, deduplikasi event, dan pengayaan clustering yang hati-hati dengan validasi silang.[^8][^6][^7]

## Latar Belakang & Ruang Lingkup: Prediction Markets dan On-Chain Tracking

Prediction markets memungkinkan peserta memperdagangkan probabilitas kejadian di masa depan. Di Polymarket, market biner (YA/TIDAK) merepresentasikan dua outcome dengan harga agregat yang mencerminkan probabilitas pasar. Mekanisme ini menggunakan kombinasi order off-chain dan eksekusi on-chain, sehingga tidak semua aktivitas pengguna terekam real-time di blockchain. Eksekusi on-chain terjadi ketika order off-chain dicocokkan dan dikirimkan ke kontrak untuk diproses, sedangkan pencetakan dan pembakaran posisi, resolusi via UMA, serta redemption terjadi on-chain.[^1][^2][^3]

Domain yang relevan untuk tracking dompet di prediction markets meliputi:
- Aktivitas eksekusi trade (direct match, minting via komplementer order, merging via counter-order) pada kontrak bursa.
- Pergerakan posisi (CTF/ERC‑1155) saat pencetakan, transfer, dan pembakaran.
- Pemenuhan collateral (USDC) pada eksekusi dan penyelesaian.
- Aksi UMA Optimistic Oracle (propose, dispute, resolve) yang menentukan hasil akhir market.
- Perilaku dompet besar (whales), patterns Micropattern (beli beruntun, partial fills), serta perubahan probabilitas pasar.

Ruang lingkup teknis meliputi extraction (streams, log parsing, storage reads), monitoring transaksi dan event di kontrak spesifik, implementasi event listener yang redundan, address clustering berbasis heuristik dan pola, serta arsitektur real-time end-to-end yang tangguh. Keterbatasan utama adalah intensitas data dan kebutuhan akan pipeline yang efisien untuk mencegah duplikasi dan kehilangan event saat reorg.

Untuk memperjelas pemetaan komponen Polymarket terhadap event/alat tracking, lihat Tabel 1.

Tabel 1. Komponen Polymarket vs Event/Tracer Relevan
| Komponen | Peran/Fungsi | Event On-Chain Kunci | Kegunaan untuk Tracking |
|---|---|---|---|
| CLOB off-order | Pencocokan order | — (off-chain) | Menyediakan konteks harga probabilitas; korelasi dengan eksekusi on-chain saat terjadi settlement |
| CTF (ERC‑1155) | Tokenisasi outcome | Transfer/Position events | Memetakan posisi YA/TIDAK, supply, dan aliran antar alamat |
| UMA Optimistic Oracle | Resolusi pasar | Propose/Dispute/Resolve | Menandai milestone resolusi dan meng触发 redemption |
| Settlement Contracts | Eksekusi on-chain | TradeExec/Fill/OrderSigned | Identifikasi eksekusi, biaya, dan alur USDC |
| Collateral (USDC) | Pembayaran/settlement | ERC‑20 Transfer | Verifikasi arus dana, settlement dana, dan korelasi trader |

Sumber: Arsitektur Polymarket dan dokumentasi UMA.[^1][^2][^3]

### Arsitektur Polymarket (CLOB Hibrida + CTF + UMA)

Polymarket menggabungkan CLOB off-chain dengan eksekusi on-chain. Saat dua order yang komplementer cocok, protokol dapat memicu minting posisi baru (jika seluruh harga mengalun ke $1) atau burning (jika ada Penjual NO saat harga komplementer), atau melakukan settlement langsung pada direct match. CTF merepresentasikan outcome sebagai token ERC‑1155, di setiap market diberi conditionId, collectionId, dan tokenId (positionId) yang eindeut. UMA berfungsi sebagai optimistic oracle: hasil bisa diusulkan; jika tidak ada tantangan dalam jendela waktu yang ditentukan, hasil finality tercapai dan transmite ke kontrak CTF (reportPayouts), setelah itu持有人 dapat menukar posisi ganador dengan redemption dana di USDC.[^1][^3]

Implikasinya untuk tracking: banyak sekali informasi pasar berada di off-chain order book, tetapi bukti on-chain tetap krusial untuk menganalisis likuiditas efektif, suplai posisi, dan cash flow USDC. Baik event CTF/ERC‑1155 maupun sinyal UMA menjadi sumber utama konsistensi data.

## Arsitektur Data On-Chain untuk Tracking: Model, Sumber, dan Pipeline

Model data di cadeia EVM terdiri atas blok, transaksi, receipt, logs/event, dan storage. Logs mengikuti формат dengan topic0 (event signature) dan data bytes yang di-encode ABI. Setiap event dapat dikorelasikan dengan transaksi, receipt, dan blok di mana ia berada, sekaligus membuka peluang filtering yang tajam untuk penggunaan tertentu.[^10][^9]

Sumber data yang disarankan:
- Provider Node (WSS/HTTP) untuk real-time dan historical pulls.
- Streams/Notify untuk event berbasis push; mengurangi polling, menyediakan ordering dan retry semantics.
- Explorer APIs sebagai pelengkap (bukan sumber primer untuk payload berat).
- Subgraphs untuk indexing domain-spesifik; kuat untuk query historis berstruktur GraphQL.

Pipeline end-to-end yang direkomendasikan:
1. Source: provider WSS/HTTP, streams (QuickNode Streams), notify (Alchemy Notify).
2. Ingestion: push ke bus/staging (webhooks, queues), buffering ringan.
3. Processing/Enrichment: parsers, ABI decoding, clustering, dan feature engineering (misalnya, menggabungkan event posisi dengan harga probabilitas dari order book off-chain).
4. Storage: event store + indexed tables; parisi per market/kontrak; metadata reorg.
5. Serving: API internal/denormalized views untuk dashboard, alerting, dan analytics.

QuickNode Streams, Filters, dan Functions efektif untuk menyederhanakan ETL: Streams mengirim data real-time, Filters memangkas payload sesuai kebutuhan, Functions menjalankan transformasi/aggregasi di edge sehingga mengurangi latensi dan beban sistem pusat.[^8] Untuk kebutuhan historis atau query kompleks, The Graph (subgraphs) menyediakan indexing berbasis GraphQL.[^14]

Tabel 2. Peta Sumber Data vs Kegunaan
| Sumber | Kegunaan Utama | Kelebihan | Keterbatasan |
|---|---|---|---|
| WSS/HTTP Node | Subskripsi real-time, historical pulls | Kontrol penuh, fleksibel | Rate limit, beban polling, reorg handling manual |
| Streams (QuickNode) | Push event, ordering, retry semantics | Minim polling, biaya efisien | Vendor-specific features |
| Notify (Alchemy) | Push khusus (alamat, mined tx) | Ringan, cepat, mudah dipadukan | Cakupan spesifik per use-case |
| Explorer APIs | Akses cepat data dasar | Mudah dipakai | Tidak ideal untuk throughput tinggi |
| Subgraphs (The Graph) | Indexing domain, query historis | GraphQL мощь | Waktu build/ mantenimiento subgraph |

Tabel 3. Komponen Pipeline vs Tugas
| Komponen | Tugas Inti | Best Practice |
|---|---|---|
| Source | Subskripsi WSS, receive webhooks | Multi-provider failover |
| Ingestion | Buffer, checksum ordering | Idempotensi, backpressure |
| Processing | ABI decoding, filters, clustering | Early-filter di edge |
| Storage | Event store, index | Schema per domain market |
| Serving | API, views, alerting | Denormalized tables, cache |

### Model Data: EVM Logs, Topics, dan ABI Decoding

Event logs terdiri atas hash signature (topic0) dan data. Decoding membutuhkan ABI kontrak. Topic0 berguna sebagai filter untuk mengumpulkan event tertentu dari seluruh chain atau alamat spesifik. Pendekatan parsing yang baik adalah membakukan decoded event menjadi skema domain—misalnya, untuk CTF Transfer, simpan dari/ke, tokenId (positionId), value (jumlah), dan block metadata. Ethers.js menyediakan utility decoding yang matang; web3.py memberikan filter/event mekanik yang solid untuk Python ecosystem.[^10][^9]

## Teknik Ekstraksi Data Blockchain

Empat pendekatan inti yang saling melengkapi:

- Direct RPC reads (HTTP/WSS): cocok untuk subscription event spesifik dan historical window. Membutuhkan kontrol rate limit, backoff, dan reorg handling eksplisit. Ethers.js dan web3.py adalah pilihan utama.[^9][^10]
- Streams push-based: QuickNode Streams mengirim data on-chain real-time sesuai filter; dapat disambungkan ke webhook, S3, atau Functions di edge untuk transformasi awal. Menghilangkan kebutuhan polling dan mengurangi biaya ingest data yang tidak relevan.[^8]
- Notify/filtered subscriptions: Alchemy Notify (alamat aktivitas) dan pending tx WebSocket (alchemy_filteredNewFullPendingTransactions) memberi sinyal cepat untuk kegiatan miner/pending. Cocok sebagai pemicu awal proses lebih berat.[^6]
- Indexing via subgraphs: The Graph mengindeks data domain-spesifik (GraphQL), ideal untuk query historis dan dashboard analitik yang stabil.[^14]

Tabel 4. Perbandingan Metode Ekstraksi
| Metode | Mode | Biaya/Overhead | Latensi | Kelebihan | Kekurangan |
|---|---|---|---|---|---|
| RPC Direct | Pull | Tinggi (poll, retry) | Rendah-Msedang | Fleksibel | Berat untuk skala besar |
| Streams | Push | Rendah (hanya data relevan) | Rendah | Minim polling, ordering | Vendor features |
| Notify | Push | Rendah | Sangat rendah (event terarah) | Mudah, cepat | Cakupan event terbatas |
| Subgraphs | Pull (query) | Render cost (indexing) | Sedang | Query historis мощь | Build/maintenance |

### Direct RPC & WebSockets (ethers.js / web3.py)

Dengan WebSocket provider, kita melakukan subscription pada log/event spesifik alamat kontrak untuk memproses event secara real-time. Pendekatan ini ideal untuk listener berlatensi rendah dan kontrol granular terhadap filter dan dekoder ABI.[^9][^10] Namun, beban operasional meningkat saat skala (multi-kontrak, lonjakan pasar), sehingga kombinasi dengan streams/notify disarankan untuk jalur alert cepat.

### Streams & Filters (QuickNode)

QuickNode Streams menyediakan pipeline push-based: event disampaikan dengan ordering dan retry semantics. Filters memungkinkan fungsi JavaScript kustom untuk memangkas payload hanya pada event relevan, sedangkan Functions mengeksekusi transformasi di edge, meminimalkan latensi. IntegrasiWebhook/S3 mempercepat jalur historis, dan pengurusan reorg dapat dikonfigurasi pada Streams.[^8]

### Notify & Pending Tx Subscriptions (Alchemy)

Alchemy Notify memicu webhook untuk aktivitas alamat, sementara endpoint pending transaksi (alchemy_filteredNewFullPendingTransactions) memungkinkan subscription terhadap transaksi masuk yang targeting alamat tertentu. Pendekatan ini efektif sebagai “first-mile” alert untuk menandai peristiwa penting yang kemudian diikuti pemrosesan lengkap via streams atau RPC read.[^6]

### Indexing via Subgraphs (The Graph)

Subgraphs mengindeks data domain dan mengekspor GraphQL endpoints. Cocok untuk query historis, rekonstruksi state, dan analitik relatif kompleks. Trade-off-nya adalah waktu build, maintenance, dan sinkronisasi saat ada perubahan skema/event baru.[^14]

## Transaction Monitoring untuk Kontrak Spesifik

Untuk Polymarket, kita perlu memantau aktivitas pada bursa/settlement (mis. CTFExchange), kontrak posisi (CTF/ERC‑1155), dan collateral (USDC), serta event oracle UMA yang menyelesaikan market. Filter dapat dipusatkan pada alamat kontrak, topic0 event, dan range blok. Strategi multi-provider—menggunakan WSS dari beberapa vendor dan fallback HTTP—menjaga reliabilitas saat lonjakan tráfico atau perbaikan node. Kriteria monitoring yang relevan mencakup ukuran transaksi, gas, status (success/revert), dan nilai transfer USDC.

Tabel 5. Event/Method Kunci Polymarket dan Use-Case
| Target | Event/Method | Use-Case Analitik |
|---|---|---|
| CTF Exchange | TradeExec/Fill/OrderSigned | Melacak eksekusi, biaya, pola order flow |
| CTF (ERC‑1155) | Transfer/PositionChanged | Menelusuri suplai dan aliran posisi YA/TIDAK |
| USDC (ERC‑20) | Transfer | Verifikasi settlement, arus dana ke/dari exchange |
| UMA Oracle | Propose/Dispute/Resolve | Menandai resolusi pasar dan memprediksi redemption |
| Market Registry | MarketCreated/Resolved | Lifecycle pasar, stempel waktu resolusi |

Sumber: Arsitektur Polymarket dan dokumentasi UMA.[^1][^3]

Tabel 6. Strategi Filter & Endpoint
| Filter | Endpoint | Tujuan |
|---|---|---|
| toAddress = kontrak bursa | WSS eth_subscribe (filtered logs) | Menyaring event eksekusi |
| topic0 = Transfer (CTF/USDC) | Streams/Notify | Menangkap pergerakan posisi/collateral |
| block range | RPC Historical | Backfill, rekonstruksi state |
| pending tx toAddress | alchemy_filteredNewFullPendingTransactions | Early warning lonjakan order |

### Pending vs Mined: Deteksi Dini vs Konfirmasi

Pending memberi sinyal dini tentang aktivitas alamat kontrak; mined memberi konfirmasi final. Implementasi efektif biasanya menggabungkan keduanya: gunakan pending sebagai trigger untuk pre-processing (misalnya, pre-decode event berdasarkan ABI dan alamat), lalu konfirmasi dan persist saat mined, dengan perawatan reorg dan idempotensi. Alchemy menyediakan mekanisme untuk keduanya dan dapat diintegrasikan dengan webhook dan WebSocket untuk memberikan jalur notifikasi yang ringan.[^6]

## Event Listening & Log Parsing

Event listening dilakukan dengan WebSocket provider pada kontrak tertentu, декодиing payload menggunakan ABI, dan normalisasi event menjadi skema domain. Untuk redundansi, gunakan multiple providers dan desain fallback bila satu koneksi terputus; listener harus anti-duplikasi dan memiliki backpressure handling.

web3.py menyediakan filter/event yang matang untuk Python, sementara ethers.js memberikan API event listening yang ringkas dan stabil di JavaScript/TypeScript ecosystem.[^10][^9] Sebagai alternatif, Moralis Streams mengalirkan event on-chain via webhook dan mendukung filter multi-kontrak; ini mengurangi beban maintain listener giant dan mempercepat time-to-value.[^7] Untuk chain lain, EthVigil menyediakan WebSocket streaming yang komplementer.[^15] Redundancy listener ethers/web3.js diuraikan secara praktik oleh Chainstack.[^18]

Tabel 7. Pendekatan Event Listening
| Library/Service | Kekuatan | Trade-off |
|---|---|---|
| ethers.js | DX matang, TypeScript, luas ekosistem | Beban listener saat skala tinggi |
| web3.py | Integrasi Python/ML, filter event | Ekosistem JS lebih besar |
| Moralis Streams | Webhook multi-kontrak, filter canggih | Vendor lock-in, biaya |
| EthVigil WSS | Alternatif WSS multi-chain | Cakupan event vs kebutuhan |
| QuickNode Streams | Push-based + edge Functions | Vendor features, konfigurasi |

### ABI Decoding & Normalisasi

Gunakan ABI untuk decode topic0 dan data, lalu map ke skema domain (mis. CTFPositionEvent: from, to, tokenId, value, blockNumber). Pastikan handling nilai byte32/hex ke tipe yang akurat (alamat, uint256, bytes32). Ethers.js menyediakan utilitas decoding yang matang; pola ini dapat distandarkan di validator transformasi sebelum persist.[^9]

## Address Clustering & Pattern Recognition

Address clustering mengelompokkan alamat-alamat yang kemungkinan dikendalikan oleh entitas yang sama. Pada Cardano, model EUTXO memungkinkan heuristik powerful seperti multi-input heuristic (alamat yang muncul sebagai input dalam satu transaksi diasumsikan milik satu entitas) dan staking heuristic (alamat pembayaran yang delegr ke kunci stake yang sama diasumsikan milik satu entitas). Studi di Cardano menunjukkan hasil yang konsisten dengan distribusi power law dan karakteristik entitas besar (superclusters) yang meliputi aktivitas signifikan, termasuk minting NFT/FT.[^5]

Pada EVM, heuristik yang relevan meliputi multi-input/co-spend (meski lebih terbatas dalam account model), address change patterns, interaksi dengan kontrak tertentu (mis. exchange yang sama berulang), serta fitur perilaku seperti partial fills dan recurring buys/celebrations. Metode ML/graph (GNN, clustering) dapat dipakai untuk augmentasi heuristik, tetapi akurasi harus dikalibrasi terhadap bias data dan false positives. Umum dipakai: BACH (Bitcoin Address Clustering based on multiple Heuristics), Union-Find/DBSCAN/K-means dalam pipeline clustering. Studi sistematis ML pada data blockchain menunjukkan benefit dan keterbatasan pendekatan berbasis pembelajaran.[^17][^5]

Tabel 8. Heuristik Clustering vs适用 EVM
| Heuristik | Domain |适用 EVM | Kelebihan | Risiko |
|---|---|---|---|---|
| Multi-input/co-spend | UTXO | Terbatas | Sederhana, kuat di UTXO | Bias dompet intensif |
| Address change | UTXO/EVM | Sedang | Menangkap address perubahan | False positive |
| Staking linkage | Cardano/EUTXO | Rendah | Jaringan delegasi kuat | Tidak aplicable umum |
| Contract interaction patterns | EVM | Tinggi | Dominan pada dapps | Domain-specific |
| Pattern behavior (partial fills, recurring buys) | EVM | Tinggi | Menangkap поведение | Memerlukan data off-chain |

Tabel 9. Algoritme Clustering & Dataset
| Algoritme | Basis Data | Biaya Komputasi | Akurasi Relatif |
|---|---|---|---|
| Union-Find | Graph UTXO/Cardano | Rendah-Sedang | Tinggi di UTXO |
| DBSCAN | Graph perilaku | Sedang | Baik untuk noise |
| K-means | Fitur perilaku | Sedang-B tinggi | Bergantung fitur |
| GNN | Graph transaksi | Tinggi | Potensi tinggi, perlu data besar |

### Studi Kasus Cardano (TransferLessons ke EVM)

Heuristik multi-input Cardano memanfaatkan sifat UTXO, di mana transaksi dengan banyak input sering kali berasal dari dompet yang sama. Di EVM, heuristic ini tidak berlaku langsung, namun pola interaksi kontrak, reuse alamat, dan perilaku transaksi dapat dijadikan proksi yang berguna. Hasil empiris Cardano menampilkan distribusi entitas yang power-law, dengan sejumlah kecil entitas besar yang mengominasi aktivitas; implikasinya untuk EVM adalah perlunya normalisasi yang hati-hati, pembobotan fitur, dan validasi silang untuk mengurangi over-attribution.[^5]

## Implementasi Real-Time Monitoring

Arsitektur referensi end-to-end:
1. Source Layer: multi-provider WSS (Alchemy/QuickNode), QuickNode Streams (filters + webhook/S3), Alchemy Notify untuk pemicu cepat.
2. Processing Layer: parsers (ethers.js/web3.py), ABI decoding, event normalization, early filters; Functions/edge untuk transformasi yang butuh latensi minimal.
3. Enrichment: clustering (Union-Find/DBSCAN), graph features, label entrenador (mis. “whale”, “arb bot”), dan blending off-chain CLOB signals untuk konteks probabilitas harga.
4. Storage: event store yang idempotent, indexed tables per domain (CTF transfers, UMA resolves, USDC transfers), watermarking per blok.
5. Serving: API internal, dashboard analitik, alert rules (mis. lonjakan volume posisi, alamat besar aktif, resolusi pasar).

QuickNode Streams/Filters/Functions mengurangi kompleksitas ingestion dan menyediakan push-based data dengan ordering semantics dan kemampuan refills historis. Moralis Streams menyediakan jalur webhook multi-kontrak yang cepat. Alchemy Notify menambahkan jalur notifikasi ringan; Tenderly membantu monitoring/alerting operasional.[^8][^7][^6][^20]

Tabel 10. Pemetaan Layer ke Alat
| Layer | Alat | Tugas |
|---|---|---|
| Source | Alchemy WSS, QuickNode Streams, Notify | Event real-time, pending tx, webhook |
| Processing | ethers.js, web3.py, Filters/Functions | Decoding, filtering, transform edge |
| Enrichment | Clustering engine, graph DB | Label, fitur perilaku |
| Storage | Event store, indexed tables | Idempotensi, watermark blok |
| Serving | API internal, dashboard | Query cepat, alert, laporan |

### Reorg Handling & Finality

Reorg menyebabkan perubahan urutan event. Strategi yang disarankan: wait-for-N-blocks, gunakan watermark dan idempotensi pada persist. Streams membantu pengiriman sesuai urutan finality, namun pipeline harus tetap memvalidasi blockNumber/hash untuk menghindari double-persist. QuickNode membahas reorg dan praktik pemrosesan data push yang tepat, yang harus dikombinasikan dengan checkpointing di storage.[^8]

## Tools & Libraries: Etherscan API, The Graph, Moralis, QuickNode, ethers.js/web3.py, Provider Nodes

Peran dan pemilihan:
- Etherscan API: alternatif untuk akses cepat data dasar; cocok untuk non-throughput tinggi atau sebagai verifikasi ringan.
- The Graph: indexing subgraph/GraphQL, kuat untuk query domain dan historis.
- Moralis: Streams (webhook multi-kontrak), pembaruan real-time yang menyederhanakan pipeline listener besar.
- QuickNode: endpoints WSS/HTTP dan ETL Streams/Filters/Functions; ideal untuk push-based ingestion dan komputasi di edge.
- Ethers.js/Web3.js: library utama untuk interaksi kontrak/event; DX matang dan luas ekosistem.
- Web3.py: alternatif Python untuk filter/event; cocok untuk pipeline yang memerlukan integrasi ML/analitik Python.
- Providers (Alchemy/QuickNode): WSS/HTTP, Notify, rate limit serta throughput yang beragam; gunakan multi-provider untuk redundansi dan scale.

Tabel 11. Perbandingan Tools
| Tool | Fungsi | Kekuatan | Trade-off |
|---|---|---|---|
| Etherscan API | Explorer REST | Mudah, cepat | Tidak ideal untuk throughput tinggi |
| The Graph | Indexing GraphQL | Query historis мощь | Build/maintenance overhead |
| Moralis Streams | Webhook multi-kontrak | cepat, andal | Vendor lock-in |
| QuickNode Streams/Filters/Functions | ETL push/edge | Minim polling, edge compute | Vendor features |
| ethers.js/web3.js | Event listening | DX, TypeScript/JS | Beban listener skala |
| Web3.py | Python event | Integrasi ML | Ekosistem JS lebih besar |
| Alchemy/QuickNode (providers) | WSS/HTTP, Notify | Throughput, rate limit | Berbeda per tier |

### Trade-offs & Pemilihan Tool

DX vs kontrol granular: ethers.js/web3.py memberi kontrol penuh tetapi membutuhkan listener yang dirancang seksama; streams (QuickNode/Moralis) mempercepat time-to-value dengan filter dan webhook, mengurangi kompleksitas di sisi konsumen. Biaya vs skalabilitas: streams mengurangi biaya ingest data, tetapi vendor features menuntut penilaian atas lock-in dan fleksibilitas di masa depan. Praktik terbaik adalah kombinasi: gunakan streams/notify untuk first-mile dan listener langsung untuk kontrol spesifik, lalu tambah subgraph/edge functions saat kebutuhan analitik meningkat.[^12][^8]

## Best Practices: Rate Limit, Throughput, Idempotensi, dan Skalabilitas

Strategi inti:
- Filter agresif di sumber: topik event, alamat kontrak, dan range blok; gunakan filters di Streams untuk menekan payload.[^14]
- Batching dan caching: cache hasil query berulang (mis. ABI decoding caches, mapping tokenId→market), batch persistence untuk mengurangi I/O.
- Retries dengan jitter/backoff: mitigasi rate limit dan glitch temporer provider.
- Idempotensi: gunakan composite keys (txHash+logIndex) dan watermark blok untuk mencegah duplikasi saat reorg.
- Backpressure dan kontrol lonjakan: queue dengan rate limiting dan auto-scaling pada processor/consumer; firmaAlerts yang menghindari “alert fatigue”.
- Minimisasi payload: decouple heavy enrichment; lakukan transformasi di edge (Functions) untuk payload yang harus diolah cepat.[^8]

Tabel 12. Strategi Optimasi vs Use-Case
| Strategi | Use-Case | Dampak |
|---|---|---|
| Early filters | High-volume contracts | Menurunkan biaya dan beban CPU |
| Idempotensi key | Reorg risk | Mencegah double-persist |
| Edge transform | Low-latency alerts | Latensi turun, throughput naik |
| Caching | ABI/token mapping | Mengurangi call berulang |
| Batching | Event bursts | Stabilkan I/O, turun overhead |
| Multi-provider | Provider outage | Reliabilitas meningkat |

### Robustness & Observability

Observabilitas yang baik mencakup health checks listener, monitoring lag vs block number, throughput, dan drop rates. Instrumentation pada deduplikasi dan reorg counters membantu mendeteksi anomaly. Alerting operasional dapat依托 Tenderly dan dashboard provider; mitigasi lonjakan event dilakukan dengan auto-scaling, backpressure, dan sampling adaptif saat terjadi flood.[^20]

## Studi Kasus: Tracking di Polymarket

Event target utama:
- OutcomeToken (CTF/ERC‑1155): Transfer/Permissioned events yang merepresentasikan perubahan kepemilikan posisi YA/TIDAK.
- USDC: Transfer/Approval sebagai indikator settlement dan arus dana.
- UMA: Propose/Dispute/Resolve sebagai penanda resolusi pasar dan kesiapan redemption.
- Exchange: TradeExec/Fill/OrderSigned, mencerminkan eksekusi on-chain yang pada gilirannya terkait pencetakan/pembakaran posisi atau transfer langsung.

Signals utama:
- Wallet clustering untuk mengenali entitas besar (whales), mengidentifikasi pola perilaku (misal, partial fills yang berulang), dan mendeteksi early signals perubahan probabilitas.
- Latensi event: memanfaatkan pending untuk pemicu cepat dan mined untuk konfirmasi; pada lonjakan pasar (mis. election), pipeline harus skala untuk menghindari thrashing.

Tabel 13. Polymarket Events → Signals → Rules
| Event | Signal | Rule |
|---|---|---|
| Transfer CTF (YA/NO) | Perubahan posisi | Alert jika besar (> X) atau>from cluster whale |
| USDC Transfer | Settlement | Alert jika ke/dari exchange dalam Y menit |
| UMA Resolve | Resolusi | Tandai market “resolved”, trigger redemption |
| TradeExec/Fill | Eksekusi | Hitung biaya rata-rata, deteksi pola partial fill |

Sumber: Arsitektur Polymarket dan dokumentasi UMA.[^1][^3]

### Skalabilitas dan Keadilan Analisis

Saat event volume melonjak (mis. saat pasar besar), sistem harus mencegah thrashing dan menjaga fairness: sampling adaptif untuk event kecil, prioritisasi event besar/bernilai tinggi, dan kontrol backpressure pada consumer. Policies harus memastikan bahwa enrichment berat (clustering, graph features) tidak memblokir jalur event kritikal; gunakan queue terpisah untuk enrichment asynchronous.

## Evaluasi, Validasi, dan Roadmap

Metrik evaluasi:
- Latensi end-to-end (dari event on-chain sampai alert/dashboard).
- Data loss/dedup error rate (harus sangat rendah; idempsi garant).
- Throughput峰值 dan stabilitas saat lonjakan.
- Alert accuracy (false positives/negatives) dan noise.

Validasi:
- Unit tests untuk parsers dan ABI decoders.
- Replay pada block ranges untuk validasi konsistensi event vs ground truth subgraph/Explorer.
- A/B comparison listener (listener langsung vs streams) untuk menilai latensi dan biaya.

Roadmap:
- POC: listener langsung pada kontrak kunci (CTF/USDC/UMA) + pending alerts.
- Pilot: integrasi Streams/Filters + Functions untuk push ingestion dan edge transform; definisikan skema domain event store; aktivasi alerting operasional.
- Production: multi-provider WSS, redundancy listener, subgraph untuk historis, clustering pipeline, observability lengkap dan SLO.

Pendekatan ini memanfaatkan guided indexing via Streams untuk mempercepat implementasi indexing dan definisi skema, sambil mempertahankan fleksibilitas terhadap perubahan event di masa depan.[^8]

## Keterbatasan Informasi dan Riset Lanjutan

Sejumlah informasi masih terbatas dan memerlukan riset lanjutan:
- ABI/resmi event signatures Polymarket belum terverifikasi; mapping event names perlu konfirmasi dokumentasi internal.
- Detail spesifik endpoint/versi API The Graph (subgraph Polymarket) tidak tersedia di konteks saat ini.
- Data historis volume pasar Polymarket untuk validasi empiris belum tersedia di kumpulan referensi ini.
- Batasan rate limit/throughput per tier provider (Alchemy/QuickNode/Moralis) tidak dirinci; perlu verifikasi langsung ke dokumentasi/pricing terbaru.
- Guid heuristik clustering EVM yang terverifikasi langsung pada dompet Ethereum (bukan Cardano/Bitcoin) belum tercakup; perlu studi Domain-specific.
- Skema log peristiwa UMA pada Polymarket (nama event, field, dan konteks reorg) perlu penyesuaian dengan implementasi aktual.
- Implementasi konkret reorg handling (finality wait, N-blocks confirmation) perlu menegaskan parameter operasional dan dampak pada latensi alert.

Penanganan informasi yang belum lengkap harus dilakukan melalui fase discovery tambahan, pengujian POC, dan validasi langsung dengan sumber primer (dokumentasi Polymarket/UMA, provider APIs, subgraph), sebelum scale ke produksi.

---

## References

[^1]: RockNBlock. How Polymarket Works | The Tech Behind Prediction Markets. https://rocknblock.io/blog/how-polymarket-works-the-tech-behind-prediction-markets  
[^2]: Polymarket Documentation. What is Polymarket? https://docs.polymarket.com/  
[^3]: Polymarket Documentation. How Are Markets Resolved? https://docs.polymarket.com/polymarket-learn/markets/how-are-markets-resolved  
[^4]: Polymarket | The World's Largest Prediction Market. https://polymarket.com/  
[^5]: Heuristic-Based Address Clustering in Cardano Blockchain. arXiv. https://arxiv.org/html/2503.09327v1  
[^6]: Alchemy Docs. How to Track Mined and Pending Ethereum Transactions. https://www.alchemy.com/docs/how-to-track-mined-and-pending-ethereum-transactions  
[^7]: Moralis. How to Listen to Smart Contract Events Using Ethers.js. https://moralis.com/how-to-listen-to-smart-contract-events-using-ethers-js/  
[^8]: QuickNode Blog. Mastering Web3 Data With Blockchain ETL — Streams, Filters, and Functions. https://blog.quicknode.com/web3-data-challenges/  
[^9]: Ethers.js v6 Documentation. Getting Started. https://docs.ethers.org/v6/getting-started/  
[^10]: web3.py documentation. Events and Logs — Filters. https://web3py.readthedocs.io/en/stable/filters.html  
[^11]: QuickNode Docs. Ethereum API Endpoints. https://www.quicknode.com/docs/ethereum/endpoints  
[^12]: Coinmonks (Medium). Top 6 Etherscan API Alternatives. https://medium.com/coinmonks/top-6-etherscan-api-alternatives-52480c61bcd3  
[^13]: Moralis. Web3.py vs Web3.js — Ultimate Comparison. https://moralis.com/web3-py-vs-web3-js-ultimate-comparison-of-two-leading-web3-libraries/  
[^14]: CoinCodeCap. Top 10 Blockchain Indexing Services. https://coincodecap.com/top-10-blockchain-indexing-services  
[^15]: EthVigil. Real-time Ethereum streams with WebSockets. https://ethvigil.com/docs/websocket_api  
[^16]: QuickNode Core API — Blockchain RPC API. https://www.quicknode.com/core-api  
[^17]: BACH: A Tool for Analyzing Blockchain Transactions Using Address Clustering (MDPI). https://www.mdpi.com/2078-2489/15/10/589  
[^18]: Chainstack Docs. BUIDLing a redundant event listener with ethers and web3.js. https://docs.chainstack.com/docs/ethereum-redundant-event-llstener-ethers-web3js  
[^19]: Ethereum StackExchange. Listen for all the events of a smart contract with ethers.js (Polygon). https://ethereum.stackexchange.com/questions/135301/listen-for-all-the-events-of-a-smart-contract-with-ethers-js-polygon  
[^20]: Tenderly. Real-Time Blockchain Monitoring & Alerting. https://tenderly.co/monitoring