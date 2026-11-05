# FieldFinder Turf Owner Web

Standalone React + Vite frontend for the FieldFinder Turf Owner workspace.

## Demo login

- Owner name: `Demo Owner`
- Password: `Owner@123`
- Demo venue: Jaypal Sports Center

The demo account is for preview only. It is stored in the browser and does not represent a verified owner account.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:5175`.

## Deploy this Owner frontend to Vercel

This ZIP contains **only the Owner frontend**. It does not contain the Customer frontend or Spring Boot backend.

1. Extract this ZIP. The extracted folder itself is the Vite project root (it contains `package.json`, `src/`, `public/` and `vercel.json`).
2. Create a GitHub repository, for example `fieldfinder-owner-web`.
3. Upload/push the contents of this extracted folder to the repository root. Do not put them inside an extra nested `owner-web/owner-web` folder.
4. Sign in to Vercel and choose **Add New → Project**.
5. Import the GitHub repository.
6. Use these project settings:
   - Framework Preset: **Vite**
   - Root Directory: `./` (repository root)
   - Install Command: `npm install`
   - Build Command: `npm run build`
   - Output Directory: `dist`
7. For a shareable demo preview, add this environment variable under **Settings → Environment Variables**:

   ```text
   VITE_DEMO_MODE=true
   ```

   This exposes the demo credentials in the deployed app. Anyone who has the URL can sign in as Demo Owner. Do not use this setting for real business data or a production launch.

8. Click **Deploy**. When the deployment completes, Vercel displays the public URL (usually `https://<project-name>.vercel.app`). Copy that URL to share the Owner frontend.
9. After changing environment variables, trigger a new deployment so Vite includes the updated values in the build.

### Production authentication

For a real deployment, remove `VITE_DEMO_MODE` or set it to `false`. Set `VITE_API_BASE_URL` to the HTTPS origin of the deployed Spring Boot backend and redeploy. The backend must implement owner registration/login, CSRF/session handling and the owner endpoints described in `API_HANDOFF.md`.

## Customer booking notifications

The Owner frontend is wired to poll the authenticated endpoint `GET /api/owner/bookings` every 8 seconds. A new pending online request produces an in-app notification badge and toast. Each request displays customer name, email, phone, sport, date, start time, duration, amount and payment/request status. Owners can confirm or reject using `PATCH /api/owner/bookings/{bookingId}/status`.

For this to work across separate Customer and Owner websites:

- The Spring Boot backend must be deployed and use a persistent database.
- The Customer frontend must submit authenticated requests to `POST /api/bookings/request`.
- The Customer and Owner frontends must point `VITE_API_BASE_URL` to the same backend origin.
- Backend CORS must allow the exact Customer and Owner HTTPS origins.
- Cross-site auth cookies must use `Secure` and `SameSite=None`, with credentials enabled and CSRF protection maintained.

The demo owner account does not receive real online bookings. Use a backend-registered Owner account for shared booking notifications.

## Included Owner features

- Required Owner login and registration UI, with browser-only Demo Owner for preview.
- Dashboard overview and animated revenue chart.
- Daily/weekly availability with add, edit, block and reopen actions.
- Walk-in booking form; records customer details, amount received, payment state and source.
- Online booking request notification badge/toast and confirm/reject actions when connected to the shared backend.
- Bookings table with customer contact, date/time, duration, amount and source.
- Turf profile and sport selection, with an Add game dropdown that excludes already-selected games.
- Venue photo/video showcase interface and Jaypal Sports Center image.
- Events & Treks creation with packages, itinerary, capacity and participant-roster preview.
- Fixed desktop sidebar and responsive mobile navigation.
- Replayable scroll reveal effects and reduced-motion support.

## Data and production limitations

- Demo accounts, local slots, walk-in demo bookings and event drafts use browser storage. They are not shared across devices.
- Online booking notifications are backend-backed only after a real backend owner session is established.
- Media must be stored in persistent object storage by the backend before production use. Do not depend on local backend disk for durable uploads.
- The demo login is not a security boundary. Disable demo mode before using real customer information.
