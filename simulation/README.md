# ASA Interactive Research Report

Interactive React/Vite research report for the ASA robot path-planning paper. It combines the paper narrative, CSV-based experiment charts, downloadable research artifacts, and the deterministic browser simulator.

## Run

```powershell
pnpm install
pnpm dev
```

## Build

```powershell
pnpm build
```

## SEO Assets

Regenerate the favicon, application icons, and social preview with Python and Pillow:

```powershell
pnpm generate:seo
```

## Notes

- Scenario generation follows the same seeded logic as the Python experiment.
- `Paper mode` opens `Sulit` seed `4`, matching the paper's detailed path-comparison figure.
- Runtime in the table is browser runtime, so it can differ from the Python CSV values.
- Research charts use the bundled `ringkasan_eksperimen.csv`, not live browser timing.
- Static research downloads are copied into `public/downloads/`.
- Report and chart transitions use Motion for React and respect reduced-motion preferences.
- Production is deployed from `main` to GitHub Pages through `.github/workflows/deploy-pages.yml`.
