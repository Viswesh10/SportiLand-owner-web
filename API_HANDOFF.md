# SportiLand Turf Owner Frontend – Backend Handoff

## Current frontend status

This is a frontend implementation and integration handoff, not a production deployment. The demo workspace persists owner accounts, slots, bookings, event records and uploaded demo state in browser storage. Demo credentials are for local preview only. Do not use browser storage as the source of truth for real customer data, payments, booking concurrency or access control.

## Demo access

- Owner name: `Demo Owner`
- Password: `Owner@123`
- Venue: `Jaypal Sports Center`

## Implemented owner workflows

- Required owner login / registration screen.
- Overview metrics and revenue chart.
- Daily and weekly slot management.
- Add, edit, block and reopen slots (overlapping slots are rejected).
- Walk-in / counter booking from an available slot. Captures customer name, phone, optional email, amount received and notes. The selected slot becomes `Booked`; the booking appears in Bookings and revenue views.
- Booked slot cards show customer name, phone, booking source, time range, amount received, total amount and payment state.
- Online booking request review, confirmation and rejection.
- Turf profile and game selection.
- Showcase media upload UI and owner-created events / treks with packages, itinerary and registration roster.

## Suggested backend API contract

All owner endpoints must derive `ownerId` from the authenticated server session/token. Never trust an owner ID supplied by the browser. Use server-side authorization on every read and write.

### Authentication

Existing frontend service currently calls:

- `GET /api/auth/csrf`
- `POST /api/auth/login` with `{ username, password, role: "owner" }`
- `POST /api/auth/register/owner`
- `POST /api/auth/logout`
- `GET /api/owner/turf`

Recommended: secure HttpOnly session cookie, CSRF validation for state-changing requests, rate limiting, password hashing, account verification and server-side session expiry.

### Slots

Recommended endpoints:

- `GET /api/owner/slots?from=YYYY-MM-DD&to=YYYY-MM-DD`
- `POST /api/owner/slots`
- `PATCH /api/owner/slots/{slotId}`
- `POST /api/owner/slots/{slotId}/block`
- `POST /api/owner/slots/{slotId}/reopen`

Suggested slot fields: `id`, `venueId`, `date`, `startTime`, `durationMinutes`, `pricePerHour`, `status` (`AVAILABLE | BOOKED | BLOCKED`), `bookingId`, `version`.

### Bookings and walk-ins

Recommended endpoints:

- `GET /api/owner/bookings?from=&to=&status=&search=`
- `POST /api/owner/bookings/walk-in`
- `POST /api/owner/bookings/{bookingId}/confirm`
- `POST /api/owner/bookings/{bookingId}/reject`
- `GET /api/owner/bookings/{bookingId}`

Walk-in request example:

```json
{
  "slotId": "slot-id",
  "customerName": "Customer Name",
  "phone": "+91XXXXXXXXXX",
  "email": "optional@example.com",
  "amountReceived": 800,
  "notes": "Counter booking"
}
```

The server must validate slot ownership, availability, date/time overlap and amount received, then atomically create the booking and mark the slot booked in one database transaction. Add an idempotency key to prevent duplicate submissions. Return the authoritative booking and slot state. Payment status should be derived server-side (`PAID`, `PARTIAL`, `PENDING`); do not accept it as a trusted client field.

Suggested booking fields: `id`, `venueId`, `slotId`, `customerName`, `phone`, `email`, `source` (`ONLINE | WALK_IN`), `bookingDate`, `startTime`, `durationMinutes`, `totalAmount`, `amountReceived`, `amountDue`, `paymentStatus`, `bookingStatus`, `notes`, `createdAt`, `updatedAt`.

### Revenue

Recommended endpoint: `GET /api/owner/revenue/summary?from=&to=`. Return totals and daily aggregates from persisted payment transactions, not from booking UI state. Refunds and reversals should be represented as ledger entries.

### Events and treks

Recommended endpoints:

- `GET /api/owner/events`
- `POST /api/owner/events`
- `PATCH /api/owner/events/{eventId}`
- `DELETE /api/owner/events/{eventId}` or archive endpoint
- `GET /api/owner/events/{eventId}/registrations`

Event registration should be a separate customer-facing workflow. Enforce capacity and package price on the server, prevent duplicate/over-capacity registrations transactionally, and expose only appropriate participant information to the owner.

### Games and media

Existing frontend service uses:

- `GET /api/owner/content`
- `PUT /api/owner/content/sports`
- `POST /api/owner/content/media` (multipart)
- `DELETE /api/owner/content/media/{mediaId}`

Validate media MIME type and size server-side, store files in object storage, and serve controlled URLs. Do not rely on browser object URLs or local storage for published media.

## Frontend integration notes

- `src/services/sharedContentApi.js` centralizes fetch, CSRF and credentials.
- Replace demo `localStorage` reads/writes for bookings, slots and events with API queries/mutations once the backend endpoints are ready.
- Refresh authoritative slot/booking data after every mutation.
- Use optimistic UI only with rollback on API failure.
- Add loading, empty, validation and server-error states for every endpoint.
- Keep the demo account disabled in production builds (e.g. `VITE_DEMO_MODE=false`).
- Never store real passwords in local storage. Current local demo account is deliberately for preview only.

## Run

```bash
npm install
npm run dev
```

Default Vite port: `5175`.

## Production/demo feature flag

- Demo credentials and local-only registration are enabled in Vite development mode for local preview.
- In a production build, `import.meta.env.DEV` is false and demo login/local fallback are disabled unless `VITE_DEMO_MODE=true` is explicitly set.
- Keep `VITE_DEMO_MODE` unset/false for production deployment. Do not ship the demo password or demo account in a public production build.

## Online Customer booking notifications (added)

Customer requests for registered owner-published turfs are created through `POST /api/bookings/request` after customer authentication. The backend binds the request to the numeric `turfId` published by `GET /api/public/turfs`; it does not accept an owner ID or price from the browser.

The owner frontend polls `GET /api/owner/bookings` on an authenticated owner session. The response is scoped to the turf owned by that session and includes `bookingId`, customer name/email/phone, sport, booking date, start time, duration, server-calculated amount, payment status, request status and source. New pending items show an in-app notification badge and toast in the Owner portal.

Owners confirm or reject using `PATCH /api/owner/bookings/{bookingId}/status` with `{ "status": "CONFIRMED" }` or `{ "status": "REJECTED" }`. An owner cannot read or update another owner's booking. Requests are created as `PENDING_OWNER_CONFIRMATION` and `NOT_COLLECTED`; this feature does not charge customers.

The Customer API client and Owner API client must both set `VITE_API_BASE_URL` to the deployed Spring Boot API origin. For cross-domain Vercel + API deployments configure secure HTTPS cookies with SameSite=None and exact CORS origins; see the root `VERCEL_DEPLOYMENT.md`.
