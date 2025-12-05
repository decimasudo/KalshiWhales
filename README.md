# PolyWhales Platform

**Track Top Polymarket Traders with Real-Time Alerts**

[![Status](https://img.shields.io/badge/Status-Production-green)](https://rtinbdijt8uh.space.minimax.io)
[![License](https://img.shields.io/badge/License-MIT-yellow)]()

##  Live Demo

- **Production URL**: [https://rtinbdijt8uh.space.minimax.io](https://rtinbdijt8uh.space.minimax.io)
- **Telegram Bot**: [@PolyWhales_bot](https://t.me/PolyWhales_bot)

## Overview

PolyWhales adalah platform komprehensif untuk tracking performance trader di Polymarket dengan notifikasi real-time via Telegram bot. Platform menyediakan landing page untuk guest users dan full-featured dashboard untuk authenticated users.

### Key Features

**Guest Experience:**
- Professional landing page
- Sample dashboard preview
- Feature showcase
- Free signup

**Authenticated Features:**
- Track specific wallets
- Browse recommended traders (8+ top performers)
- Create personal watchlist
- Real-time Telegram notifications
- Performance analytics
- Live activity feed

## Tech Stack

- **Frontend**: React 18 + TypeScript + TailwindCSS
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Notifications**: Telegram Bot API
- **Data Source**: Polymarket API

## Quick Start

### Installation

```bash
git clone https://github.com/yourusername/polywhales-platform.git
cd polywhales-platform
pnpm install
cp .env.example .env
# Edit .env dengan your credentials
pnpm run dev
```

Visit `http://localhost:5173`

## Database Schema

### Core Tables

1. **recommended_traders** - Top performing traders
2. **watchlist** - User-specific watchlist
3. **tracked_wallets** - Wallets untuk notifications
4. **betting_activities** - Trading history

All tables implement Row Level Security (RLS) untuk proper data isolation.

## API Documentation

### Edge Functions

1. **telegram-bot-webhook** - Handle Telegram commands
2. **track-wallet-activity-v2** - Cron job (every 5 min)
3. **send-notification** - Send alerts

See full documentation di `docs/API.md`

## Deployment

### Production Build
```bash
pnpm run build
```

### Deploy ke Supabase
```bash
cd supabase
supabase functions deploy
```

## Security

- Email-based authentication
- Row Level Security (RLS)
- Environment variables untuk secrets
- Input validation
- Rate limiting

## Testing

- **Frontend**: 100% pass rate
- **Backend**: All components active
- **Real-time**: WebSocket subscriptions working

## Roadmap

- [x] Landing page
- [x] Authentication
- [x] Recommended traders
- [x] Watchlist functionality
- [ ] Social login
- [ ] Trader profiles
- [ ] Advanced analytics

## Contributing

Contributions welcome! Please open issues atau submit PRs.

## License

MIT License

## Support

- Telegram: [@PolyWhales_bot](https://t.me/PolyWhales_bot)
- Issues: GitHub Issues

---

**Built with passion | Production-Ready | Version 2.0**
