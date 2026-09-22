# Azure Static Web Apps staging setup for Sprint 1 and 2

TNT Supermarket uses one React frontend for both sprints. A Free-tier Static Web App named `tnt-supermarket-web` exists in the `rg-tnt-supermarket-staging` resource group. Its URL is `https://agreeable-smoke-05b34df00.5.azurestaticapps.net`. It was created without a GitHub connection so the repository setup can be completed manually. It currently has no application deployment.

## GitHub setup to complete manually

In `Ovindu0812/Online-TNT-Supermarket-FE`, open **Settings → Environments** and create an environment named exactly `staging`. Limit deployments to `main`. Add one **environment secret**:

| Secret | Source |
| --- | --- |
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | Azure portal → `tnt-supermarket-web` → Overview → Manage deployment token. Copy it directly to GitHub; do not paste it into the repository or share it in chat. |

Under **Settings → Secrets and variables → Actions → Variables**, create these **repository variables**:

| Variable | Value |
| --- | --- |
| `AZURE_STATIC_WEB_APPS_URL` | `https://agreeable-smoke-05b34df00.5.azurestaticapps.net` |
| `VITE_API_BASE_URL` | `https://tnt-supermarket-gateway.azurewebsites.net/api` |
| `AZURE_STATIC_WEB_APPS_DEPLOY_ENABLED` | `false` until the backend APIs and gateway are healthy |

The Vite build embeds `VITE_API_BASE_URL` in browser JavaScript, so use a public HTTPS address and never place a secret in this variable. After the workflow changes are pushed, a successful `Frontend CI` run on `main` triggers deployment when the enable variable is `true`. The manual deployment trigger was removed so CI cannot be bypassed.

The workflow runs `npm ci`, `npm test`, and `npm run build`, uploads `dist` to the existing Static Web App, then checks its URL. It does not deploy the backend APIs, PostgreSQL, Kafka, or API gateway. Configure gateway CORS to allow the Static Web App origin before enabling deployment.
