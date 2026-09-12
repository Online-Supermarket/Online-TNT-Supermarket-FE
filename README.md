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

## Store Management

The admin Store Management feature lives under `/admin/stores` and is guarded by the existing auth flow plus the `ADMIN` role route guard. API calls go through the gateway at `/api/stores`.

### Structure

```text
src/features/stores/
  api/stores.js
  components/ActivateDeactivateConfirmDialog.jsx
  components/StoreDetails.jsx
  components/StoreForm.jsx
  components/StoreList.jsx
  hooks/useStores.js
  pages/StoreCreatePage.jsx
  pages/StoreDetailsPage.jsx
  pages/StoreEditPage.jsx
  pages/StoreListPage.jsx
  utils/storeApiErrors.js
  utils/storeData.js
```

### Routes

- `/admin/stores` renders the paginated store list with search, active/inactive filter, details, edit, and activate/deactivate actions.
- `/admin/stores/:id` renders store details.
- `/admin/stores/new` renders the create form and submits `POST /api/stores`.
- `/admin/stores/:id/edit` renders the edit form and submits `PUT /api/stores/:id`.

### Environment

```bash
VITE_STORE_API_BASE_URL=http://localhost:8080
```

`VITE_STORE_API_BASE_URL` should point at the API gateway base URL. If omitted, the store client falls back to `VITE_API_URL` / `VITE_API_BASE_URL`.

### Assumed Store API Contract

- `GET /api/stores?page=1&pageSize=10&search=colombo&isActive=true`
- `GET /api/stores/:id`
- `POST /api/stores`
- `PUT /api/stores/:id`
- `PATCH /api/stores/:id/activate`
- `PATCH /api/stores/:id/deactivate`

Store payload:

```json
{
  "storeCode": "TNT-CMB-001",
  "storeName": "TNT Colombo",
  "address": {
    "line1": "No. 10 Main Street",
    "line2": "Level 1",
    "city": "Colombo",
    "postalCode": "00100",
    "country": "Sri Lanka"
  },
  "contactNumber": "+94112345678",
  "email": "colombo@tnt.com",
  "isActive": true
}
```

List responses may be either an array or an object containing `items`, `data`, or `stores`, plus `total` / `totalCount`. The frontend normalizes common camelCase, PascalCase, and `storeId` variants from the Store service.
