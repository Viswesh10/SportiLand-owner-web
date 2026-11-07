# FieldFinder owner QR scanner frontend

This owner frontend update adds a **Scan booking QR** navigation item. The page uses the browser camera to scan a customer's FieldFinder QR pass, decodes the pass details, and offers a demo-only check-in action. Camera access requires localhost or HTTPS and browser permission. The scanner can also accept pasted JSON for a no-camera preview.

## Important frontend-only limitation

This scan is a local decode of the QR contents. It cannot confirm the booking exists, has not been cancelled, belongs to this venue, is paid, or has not been checked in from another device. The demo check-in is saved only in this owner browser.

For production, the QR should contain only an opaque, unguessable pass token. The owner app should send that token to a server endpoint; the server must verify booking status, venue ownership, payment status and prior check-in, then atomically mark it used. Automated WhatsApp notification must also be sent from a server using the WhatsApp Business Platform, not from browser code.

Install dependencies and run:

```bash
npm install
npm run dev
```
