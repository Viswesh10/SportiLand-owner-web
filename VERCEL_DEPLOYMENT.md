# Vercel deployment – Owner frontend only

## Vercel project settings

| Setting | Value |
|---|---|
| Framework | Vite |
| Root Directory | `./` (repository root) |
| Install Command | `npm install` |
| Build Command | `npm run build` |
| Output Directory | `dist` |

The included `vercel.json` configures these values and an SPA fallback to `/index.html`.

## Public demo preview

Set this Vercel environment variable before deploying:

```text
VITE_DEMO_MODE=true
```

The public demo credentials are:

```text
Owner name: Demo Owner
Password: Owner@123
```

Anyone with the deployment URL can use the demo account. Demo records are local to each visitor's browser and are not shared. This is suitable only for a prototype/demo link.

## Real customer-to-owner booking alerts

Deploy the Spring Boot API separately. Then add:

```text
VITE_API_BASE_URL=https://<your-api-domain>
```

Use a backend-registered owner account (not Demo Owner). The Owner app polls `GET /api/owner/bookings` every 8 seconds and receives scoped requests from `POST /api/bookings/request`. Confirm/reject actions call `PATCH /api/owner/bookings/{bookingId}/status`.

Configure the backend CORS allowlist with the exact Owner Vercel origin and the Customer origin. For cross-site cookie authentication, configure HTTPS secure cookies with `SameSite=None`, `credentials: include`, and CSRF protection.

## Steps

1. Push the extracted project folder contents to a GitHub repository.
2. In Vercel, select **Add New → Project**, then import the repository.
3. Confirm Root Directory is `./`.
4. Add `VITE_DEMO_MODE=true` for preview deployments, or set it false/remove it for production.
5. Click **Deploy**.
6. Copy the public `.vercel.app` URL from the deployment success page.

No Vercel URL is included in the source ZIP; Vercel generates the URL after deployment to the user's account.
