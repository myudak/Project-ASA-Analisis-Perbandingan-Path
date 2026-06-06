# ASA Robot Path Planning

Project makalah Analisis dan Strategi Algoritma tentang pencarian jalur robot sepak bola humanoid pada lapangan berhalangan.

Algoritma yang dibandingkan:

- Brute Force berbasis enumerasi waypoint terbatas.
- Kelompok UCS, Greedy Best First Search (GBFS), dan A* berbasis grid.
- RRT* sebagai eksplorasi algoritma di luar daftar.

## Struktur

- `paper/` berisi makalah final dalam format DOCX dan PDF.
- `docs/assignment/` berisi deskripsi tugas.
- `docs/template/` berisi template proyek.
- `src/asa_path_planning/` berisi kode eksperimen.
- `results/data/` berisi CSV hasil eksperimen.
- `results/figures/` berisi gambar hasil eksperimen.
- `simulation/` berisi aplikasi React/Vite interaktif untuk membandingkan jalur.
- `dist/` berisi arsip ZIP untuk lampiran/submission.
- `archive/` berisi draft dan aset lama.

## Reproduksi Eksperimen

Install dan jalankan dengan `uv`:

```powershell
uv lock
uv run asa-path-planning
```

Output default:

- `results/data/hasil_eksperimen.csv`
- `results/data/ringkasan_eksperimen.csv`
- `results/figures/fig_perbandingan_jalur.png`
- `results/figures/fig_waktu_rata_rata.png`

Untuk memakai folder output lain:

```powershell
uv run asa-path-planning --data-dir results/data --figures-dir results/figures
```

## Simulasi Interaktif

Aplikasi pendamping makalah ada di `simulation/` dan memakai `pnpm`.

```powershell
cd simulation
pnpm install
pnpm dev
```

Build produksi:

```powershell
cd simulation
pnpm build
```

Preset `Paper mode` di aplikasi membuka skenario `Sulit` seed `4`, sama seperti figur perbandingan jalur pada makalah.
