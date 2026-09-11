# TNT Online Supermarket

A complete responsive React + Vite frontend for a multi-role online supermarket.

## Run locally

```bash
cp .env.example .env
npm install
npm run dev
```

The frontend uses realistic local demo data and is ready for ASP.NET Core APIs configured by `VITE_IDENTITY_API_URL` for authentication and `VITE_API_BASE_URL` / `VITE_API_URL` for the API Gateway.

## Demo sign-ins

Any password works in demo mode.

- Customer: `customer@tnt.com`
- Admin: `admin@tnt.com`
- Staff: `staff@tnt.com`
- Delivery: `delivery@tnt.com`

Cart and authentication state are persisted in local storage.
