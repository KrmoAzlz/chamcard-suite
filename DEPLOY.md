# ChamCard Suite - Deploy Notes

This repo contains 4 services:
- API (Node/Express) in `combined/api`
- ChamCard Web in `combined/apps/chamcard`
- Bus Validator Web in `combined/apps/validator`
- Admin Shield Web in `combined/apps/admin`

## API (production env vars)
Set these in your hosting provider (Render/Railway/VPS):

- `ADMIN_TOKEN` : long random string (required in production)
- `ADMIN_ALLOWED_IPS` : comma-separated IPv4 list that can access admin ONLY, e.g. `78.163.119.144`
- `ADMIN_BASIC_USER` : HTTP Basic username for admin pages/APIs
- `ADMIN_BASIC_PASS` : HTTP Basic password (use a strong one)
- `CORS_ORIGINS` : comma-separated list of allowed web origins, e.g.
  - `https://admin.example.com,https://validator.example.com,https://app.example.com`
- `DATA_DIR` : optional, path for JSON DB (default: `./data`)
- `PORT` : provided by host (default 8080)

Public health checks:
- `GET /` -> plain text
- `GET /health` -> JSON
- `GET /api/health` -> JSON

## Frontend apps
Each app uses `VITE_API_BASE` to point to the API URL.
Set it in each app's hosting settings:
- ChamCard: `VITE_API_BASE=https://your-api.example.com`
- Validator: `VITE_API_BASE=https://your-api.example.com`
- Admin: `VITE_API_BASE=https://your-api.example.com`

Admin app also uses:
- `VITE_ADMIN_TOKEN` (must match API `ADMIN_TOKEN`)
- `VITE_ADMIN_USER` (audit log label only)

## Recommended hosting
- API: Render / Railway / VPS
- Frontends: Cloudflare Pages / Netlify

