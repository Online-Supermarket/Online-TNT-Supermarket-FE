# Azure Static Web Apps staging setup for Sprint 1 and 2

TNT Supermarket uses one React frontend. A Free-tier Static Web App named `tnt-frontend-ovindu` exists in the `MyWebApp-RG` resource group. Its URL is `https://gray-rock-0d7c57400.2.azurestaticapps.net`.

## GitHub setup to complete manually

In `Ovindu0812/Online-TNT-Supermarket-FE`, under **Settings → Secrets and variables → Actions → Secrets**, ensure the repository secret is set:

| Secret | Source |
| --- | --- |
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | Azure portal → `tnt-frontend-ovindu` → Overview → Manage deployment token. |

Under **Settings → Secrets and variables → Actions → Variables**, create these **repository variables**:

| Variable | Value |
| --- | --- |
| `AZURE_STATIC_WEB_APPS_URL` | `https://gray-rock-0d7c57400.2.azurestaticapps.net` |
| `VITE_API_BASE_URL` | Not required: the production gateway URL is versioned in `.env.production` and the deploy workflow explicitly supplies it. |

The Vite build embeds `VITE_API_BASE_URL` in browser JavaScript, so it is intentionally a public HTTPS value and must never contain a secret. The production value is `https://tnt-gateway-ovindu.azurewebsites.net/api`. After the workflow changes are pushed, a successful `Frontend CI` run on `main` or `develop` triggers the existing Static Web Apps deployment.

The workflow runs `npm ci`, `npm test`, and `npm run build`, uploads `dist` to the existing Static Web App, then checks its URL. It does not deploy the backend APIs, PostgreSQL, Kafka, or API gateway. Configure gateway CORS to allow the Static Web App origin before enabling deployment.
