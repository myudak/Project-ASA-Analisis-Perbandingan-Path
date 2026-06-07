# ASA Robot Path Planning

![thumbnail](image.png)
> Proyek Makalah — Analisis dan Strategi Algoritma, Semester Genap 2025/2026  
> Departemen Informatika, Universitas Diponegoro

| | |
|---|---|
| **Nama** | Muchammad Yuda Tri Ananda |
| **NIM** | 24060124110142 |
| **Kelas** | Informatika E |
| **Makalah** | [📄 PDF](paper/) |
| **Video** | [▶ YouTube](https://youtu.be/gWvJh0jpOA?si=Jcxtga3KlfvjNRMc) |
| **Simulasi** | [🌐 Interactive Demo](https://myudak.github.io/Project-ASA-Analisis-Perbandingan-Path/) |

---

## Tentang Proyek

Makalah ini membandingkan lima algoritma pencarian jalur pada simulasi lapangan sepak bola robot humanoid berhalangan (60 × 40 satuan, hambatan lingkaran dan persegi panjang).

| Algoritma | Tipe | Dari Daftar |
|-----------|------|-------------|
| **Brute Force** | Enumerasi waypoint terbatas | ✅ Item (a) |
| **UCS** | Grid 8-arah, prioritas g(n) | ✅ Item (g) |
| **GBFS** | Grid 8-arah, prioritas h(n) | ✅ Item (g) |
| **A\*** | Grid 8-arah, prioritas g(n)+h(n) | ✅ Item (g) |
| **RRT\*** | Sampling kontinu + rewiring | 🔵 Di luar daftar |

Eksperimen dijalankan pada **4 skenario** (Mudah → Padat) × **5 seed acak**, mengukur tingkat keberhasilan, biaya lintasan, waktu eksekusi, dan jumlah node yang diproses.

---

## Struktur Repositori

```
.
├── paper/                  # Makalah final (PDF + DOCX)
├── docs/
│   ├── assignment/         # Deskripsi tugas
│   └── template/           # Template IEEE
├── src/
│   └── asa_path_planning/  # Kode eksperimen Python
├── notebooks/              # Notebook analisis dan penjelasan hasil
├── results/
│   ├── data/               # CSV hasil eksperimen
│   └── figures/            # Gambar output
├── simulation/             # Aplikasi React/Vite interaktif
├── dist/                   # Arsip ZIP untuk submission
└── archive/                # Draft dan aset lama
```

---

## Reproduksi Eksperimen

### Requirements

- Python **3.12+**
- [`uv`](https://docs.astral.sh/uv/) — Python package & project manager

### Instalasi & Menjalankan

```powershell
uv lock
uv run asa-path-planning
```

Output yang dihasilkan secara default:

```
results/data/hasil_eksperimen.csv       ← data mentah per seed
results/data/ringkasan_eksperimen.csv   ← rata-rata & std dev per skenario
results/figures/fig_perbandingan_jalur.png
results/figures/fig_waktu_rata_rata.png
results/figures/fig_processed_grid.png
```

### Custom Output Directory

```powershell
uv run asa-path-planning --data-dir results/data --figures-dir results/figures
```

---

## Notebook Analisis

Notebook menggunakan fungsi dari `src/asa_path_planning/`, sehingga implementasi
algoritma tetap memiliki satu sumber kebenaran.

```powershell
uv sync --extra notebook
uv run --extra notebook jupyter lab notebooks/analisis_path_planning.ipynb
```

Notebook memverifikasi perbandingan UCS dan A*, membahas spike processed A* pada
skenario Sulit, menampilkan visualisasi hasil, dan menyediakan opsi untuk menjalankan
ulang eksperimen penuh.

---

## Simulasi Interaktif

Aplikasi pendamping berbasis React/Vite ada di `simulation/`, dan juga tersedia secara online di **[myudak.github.io/Project-ASA-Analisis-Perbandingan-Path](https://myudak.github.io/Project-ASA-Analisis-Perbandingan-Path/)**.

### Requirements

- [Node.js](https://nodejs.org/) 18+
- [`pnpm`](https://pnpm.io/)

### Development

```powershell
cd simulation
pnpm install
pnpm dev
```

### Production Build

```powershell
cd simulation
pnpm build
```

> **Paper mode** — preset di aplikasi yang membuka skenario `Sulit` seed `4`, identik dengan Figure 1 pada makalah.

---

## Hasil Ringkas

| Skenario | Algoritma Terbaik (Biaya) | Algoritma Tercepat | Catatan |
|----------|--------------------------|-------------------|---------|
| Mudah | Brute Force (53.34) | GBFS (7.4 ms) | Semua berhasil 100% |
| Sedang | A* / UCS (54.49) | GBFS (11.1 ms) | Brute Force 80% |
| Sulit | A* / UCS (70.76) | GBFS (33.8 ms) | Brute Force 20% |
| Padat | A* / UCS (57.56) | GBFS (182.6 ms) | Semua kecuali BF 80% |

**Kesimpulan utama:** A\* adalah pilihan paling seimbang — biaya optimal setara UCS dengan ekspansi node 42.6–87.9% lebih sedikit di seluruh skenario.
