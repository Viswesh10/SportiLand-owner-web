# SportiLand Turf Owner – Terms & Conditions and Login Refresh

This owner-only frontend update includes:

- A Terms & Conditions page with the same seven-section Rain & Weather Refund Policy shown in the SportiLand customer web.
- A Terms & Conditions option in the top-right owner profile dropdown.
- Sports-focused login/register artwork using local turf and cricket facility photographs already included in `public/assets/venues/`.
- Refined animated login/register tabs and primary button hover/press states.
- Responsive auth layout for tablet and mobile widths, including reduced-motion support.

No backend or customer frontend is included in this package. The existing owner revenue analytics, QR scanner, booking and other owner pages are retained.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

The source JSX was transpiled for syntax validation and the referenced photo assets were verified. A full Vite production build was not completed in the preparation environment because dependency installation timed out.
