# Azure Static Web Apps setup for Sprint 1 and 2

The React application is one frontend deployment for both Sprint 1 and Sprint 2:

| Sprint | Frontend capability |
| --- | --- |
| Sprint 1 | Customer registration/sign-in, Catalog browse/search, staff product management and inventory reporting. |
| Sprint 2 | Customer addresses, basket, checkout, order history, staff cancellation and sales reporting. |

Create one Azure Static Web App connected to this frontend repository. In the GitHub `staging` environment, configure:

```text
Secret: AZURE_STATIC_WEB_APPS_API_TOKEN
Variable: VITE_API_BASE_URL=https://<public-api-gateway>/api
Variable: AZURE_STATIC_WEB_APPS_URL=https://<your-static-web-app>.azurestaticapps.net
Variable: AZURE_STATIC_WEB_APPS_DEPLOY_ENABLED=true
```

`VITE_API_BASE_URL` is embedded in the browser build, so it must be the public HTTPS gateway address and must not contain a secret. It cannot use Docker Compose host names such as `gateway`, `identity-api`, `catalog-api` or `order-api`.

The workflow builds the Vite application with `npm ci` and `npm run build`, then deploys `dist` through `Azure/static-web-apps-deploy`. It does not deploy the .NET APIs, PostgreSQL, Kafka or the API gateway. Configure the backend CORS allow-list with the Static Web App URL before using the deployed site.

Keep automatic deployment disabled until the Static Web App token, frontend URL, API gateway URL, TLS and CORS configuration are verified. You can still run the workflow manually from GitHub Actions after adding the two required variables and token.
