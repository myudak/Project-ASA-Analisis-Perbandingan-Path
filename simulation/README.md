# ASA Path Planning Simulation

Interactive React/Vite companion app for the ASA robot path-planning paper. The app compares Brute Force, UCS, GBFS, A*, and RRT* on deterministic obstacle scenarios.

## Run

```powershell
pnpm install
pnpm dev
```

## Build

```powershell
pnpm build
```

## Notes

- Scenario generation follows the same seeded logic as the Python experiment.
- `Paper mode` opens `Sulit` seed `4`, matching the paper's detailed path-comparison figure.
- Runtime in the table is browser runtime, so it can differ from the Python CSV values.
