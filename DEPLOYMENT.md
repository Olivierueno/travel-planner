# Travel Planner - Deployment & Future Notes

## Deployment (Vercel)

1. Import repo from GitHub
2. Add environment variables:
   - `TRIP_PASSWORD` - shared access password
   - `AUTH_SECRET` - random string for JWT signing (`openssl rand -hex 32`)
   - `NEXT_PUBLIC_GOOGLE_MAPS_KEY` - Google Maps API key (Embed + Distance Matrix APIs enabled)
3. Create a Vercel KV store and link it to the project
4. Deploy

### Google Cloud Console Setup

Enable these APIs (same project, same key):
- Maps Embed API (free)
- Distance Matrix API ($200/mo free credit)

Restrict the API key:
- HTTP referrers: your Vercel domain + localhost:3000
- API restrictions: Maps Embed API + Distance Matrix API only

## Future Upgrades

### Payments / Billing
- Stripe Checkout or credit pack system for usage-based billing
- Google Maps API costs per trip are ~$0.10 (tiny)
- Stripe's 30c per-transaction fee makes micro-charges impractical
- Recommended: prepaid credit packs ($5/$10/$20) or monthly invoicing
- Accumulate usage, charge monthly to minimize transaction fees
- Apple Pay / Google Pay supported automatically through Stripe

### Features
- Real-time collaboration (Supabase or WebSocket for live sync)
- User accounts (replace shared password with individual logins)
- Multiple trips per account
- Dark mode
- Offline support (service worker)
- JR Pass calculator
- Packing checklist
- Weather forecasts for travel dates

### Infrastructure
- Rate limiting on API routes
- CDN caching for Wikipedia images
- Database migration from JSON/KV to Postgres for multi-trip support
- Monitoring and error tracking (Sentry)
