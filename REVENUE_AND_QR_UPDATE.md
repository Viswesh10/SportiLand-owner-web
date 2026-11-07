# FieldFinder Turf Owner Web — Revenue period picker + customer QR compatibility

This package contains the **owner frontend only**. The customer application is not included or modified.

## Revenue analytics

The Revenue page includes three selectable views:

- **7 days:** seven daily buckets ending on the selected date. Choose a different end date to inspect another rolling seven-day window.
- **Week:** choose any date in the calendar; the chart snaps to that date's Monday–Sunday week and shows daily paid revenue for each day.
- **Month:** choose a specific month using the month picker; the chart groups that month's paid booking revenue into calendar-week buckets (W1, W2, etc.).

Previous/next period buttons let owners step backward or forward without reopening the picker. The Today button resets the controls to the current date/month.

Values are calculated from the owner frontend's current booking collection. Only paid amounts are included (`amountPaid`, or the existing paid-demo fallback). Rejected bookings and unpaid amounts are excluded. Chart totals, bar heights, highest period and booking counts recalculate from the selected period and refresh when the booking data changes. Bars animate when the selected range or source values change.

The updated visual treatment uses rounded gradient bars, staggered rise-in motion, subtle grid lines, hover/focus emphasis and responsive horizontal scrolling on narrow screens. The linked Dribbble GIF endpoint did not return a viewable preview in the editing environment, so the chart uses a matching animated rounded-bar treatment rather than reproducing individual frames exactly.

## Customer V8 QR compatibility

The scanner accepts the Customer V8 `BookingPassModal` payload:

```json
{
  "type": "FIELDFINDER_BOOKING_PASS",
  "version": 1,
  "bookingId": "FF-1234567",
  "token": "unique-pass-token",
  "customer": "Customer name",
  "venue": "Venue name",
  "area": "Venue area",
  "sport": "Football",
  "date": "YYYY-MM-DD",
  "time": "HH:mm",
  "durationHours": 1,
  "amount": 800,
  "paymentStatus": "Demo payment complete",
  "bookingStatus": "Awaiting owner confirmation"
}
```

The owner camera scanner uses `html5-qrcode`. A manual JSON paste field is available for tests without a camera. The result checks required Customer V8 fields, venue-name match, cancelled/rejected status and duplicate tokens recorded in this browser.

## Frontend-only limitation

The QR scanner can decode the customer pass and record a local demo check-in. It cannot confirm that a pass exists in a shared database, confirm a live payment, or prevent cross-device duplicate check-ins. Those checks require a shared backend and an atomic check-in endpoint.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```


## Revenue chart reference update (7 Nov 2026)
- Replaced the vertical revenue bars with a smooth interactive line chart based on the supplied light-blue reference.
- Daily, weekly and monthly date selection controls remain in place. The line is recalculated from the selected date range and paid booking records.
- Hovering or touching the plot moves the active point, vertical guide and value label; arrow keys also move between data points.
- The customer and owner projects remain separate. The QR scanner implementation and payload compatibility are unchanged.
- This frontend reads existing owner-side booking records; live cross-device updates still require a shared backend.
