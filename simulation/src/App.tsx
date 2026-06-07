import {
  ArrowDown,
  CheckCircle2,
  Database,
  Download,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Github,
  Grid3X3,
  Lightbulb,
  RadioTower,
  Route,
  ShieldCheck,
  Target,
  TimerReset,
  TriangleAlert,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import AlgorithmOverview from "./components/AlgorithmOverview";
import ArticleToc, { type ArticleSection } from "./components/ArticleToc";
import PaperReader from "./components/PaperReader";
import ReportNav from "./components/ReportNav";
import ResultsExplorer from "./components/ResultsExplorer";
import SimulatorLab from "./components/SimulatorLab";
import {
  motionTransition,
  revealVariants,
  staggerContainerVariants,
  staggerItemVariants,
  VIEWPORT_ONCE,
} from "./motion/variants";

const BASE_URL = import.meta.env.BASE_URL;
const PAPER_TITLE =
  "Analisis Perbandingan UCS, A*, dan RRT* pada Simulasi Pencarian Jalur Robot Sepak Bola Humanoid di Lapangan Berhalangan";
const PAPER_URL = `${BASE_URL}downloads/Makalah_ASA_Robot_Path_Planning_UCS_Astar_RRTstar.pdf`;
const SUMMARY_CSV_URL = `${BASE_URL}downloads/ringkasan_eksperimen.csv`;
const RAW_CSV_URL = `${BASE_URL}downloads/hasil_eksperimen.csv`;
const HERO_IMAGE_URL = `${BASE_URL}images/fig_perbandingan_jalur.png`;
const TIME_FIGURE_URL = `${BASE_URL}images/fig_waktu_rata_rata.png`;
const GITHUB_URL =
  "https://github.com/myudak/Project-ASA-Analisis-Perbandingan-Path";

const ARTICLE_SECTIONS: readonly ArticleSection[] = [
  { id: "ringkasan", label: "Ringkasan" },
  { id: "masalah", label: "Masalah" },
  { id: "algoritma", label: "Algoritma" },
  { id: "simulasi", label: "Simulasi" },
  { id: "metode", label: "Metode" },
  { id: "hasil", label: "Hasil" },
  { id: "kesimpulan", label: "Kesimpulan" },
  { id: "makalah", label: "Makalah PDF" },
] as const;

const SCENARIOS = [
  { name: "Mudah", obstacles: "5 lingkaran", purpose: "Hambatan jarang" },
  {
    name: "Sedang",
    obstacles: "10 lingkaran + 2 dinding",
    purpose: "Celah lintasan",
  },
  {
    name: "Sulit",
    obstacles: "8 lingkaran + 2 dinding",
    purpose: "Belokan jauh",
  },
  {
    name: "Padat",
    obstacles: "19 lingkaran + 2 dinding",
    purpose: "Ruang bebas sempit",
  },
] as const;

const PROCESSED_FINDINGS = [
  { scenario: "Mudah", reduction: "87,9%", cost: "54,82" },
  { scenario: "Sedang", reduction: "87,6%", cost: "54,49" },
  { scenario: "Sulit", reduction: "42,6%", cost: "70,76" },
  { scenario: "Padat", reduction: "67,8%", cost: "57,56" },
] as const;

interface FigureCaptionProps {
  number: string;
  title: string;
  source: string;
}

function FigureCaption({ number, title, source }: FigureCaptionProps) {
  return (
    <figcaption className="editorial-caption">
      <span>Figur {number}</span>
      <p>{title}</p>
      <small>{source}</small>
    </figcaption>
  );
}

export default function App() {
  const reducedMotion = Boolean(useReducedMotion());
  const reveal = revealVariants(reducedMotion);
  const container = staggerContainerVariants(reducedMotion);
  const item = staggerItemVariants(reducedMotion);
  const tap = reducedMotion ? undefined : { scale: 0.98 };

  return (
    <main className="report-shell editorial-report">
      <ReportNav paperUrl={PAPER_URL} />

      <motion.section
        className="hero-section editorial-hero"
        initial="hidden"
        animate="visible"
        variants={container}
      >
        <motion.img
          className="hero-background"
          src={HERO_IMAGE_URL}
          alt=""
          aria-hidden="true"
          initial={reducedMotion ? false : { opacity: 0, scale: 1.035 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={motionTransition(reducedMotion, 0.8)}
        />
        <div className="hero-overlay" />
        <motion.div className="hero-content" variants={container}>
          <motion.div className="hero-meta" variants={item}>
            <span>Makalah interaktif</span>
            <span>ASA 2026-1</span>
            <span>Robot path planning</span>
          </motion.div>

          <motion.div className="hero-copy" variants={container}>
            <motion.p className="hero-kicker" variants={item}>
              Visual essay dan laboratorium algoritma
            </motion.p>
            <motion.h1 variants={item}>{PAPER_TITLE}</motion.h1>
            <motion.p className="hero-lead" variants={item}>
              Sebuah pembacaan visual atas trade-off kualitas jalur, waktu
              komputasi, keberhasilan, dan beban pencarian pada lapangan
              berhalangan.
            </motion.p>
          </motion.div>

          <motion.div className="hero-actions" variants={item}>
            <motion.a className="primary-action" href="#ringkasan" whileTap={tap}>
              Mulai membaca
              <ArrowDown size={18} />
            </motion.a>
            <motion.a className="secondary-action" href="#makalah" whileTap={tap}>
              <FileText size={18} />
              Baca makalah
            </motion.a>
            <motion.a
              className="secondary-action"
              href={PAPER_URL}
              download
              whileTap={tap}
            >
              <Download size={18} />
              Unduh PDF
            </motion.a>
          </motion.div>

          <motion.div className="author-strip" variants={container}>
            <motion.div variants={item}>
              <span>Penulis</span>
              <strong>Muchammad Yuda Tri Ananda</strong>
            </motion.div>
            <motion.div variants={item}>
              <span>NIM</span>
              <strong>2406012410142</strong>
            </motion.div>
            <motion.div variants={item}>
              <span>Program studi</span>
              <strong>Informatika / Kelas E</strong>
            </motion.div>
            <motion.div variants={item}>
              <span>Eksperimen</span>
              <strong>4 skenario / 5 seed</strong>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.section>

      <div className="article-layout">
        <ArticleToc sections={ARTICLE_SECTIONS} />

        <article className="article-body">
          <section id="ringkasan" className="article-section">
            <motion.header
              className="article-opening"
              initial="hidden"
              whileInView="visible"
              viewport={VIEWPORT_ONCE}
              variants={reveal}
            >
              <p className="article-kicker">Ringkasan penelitian</p>
              <h2>
                Jalur terpendek bukan satu-satunya ukuran algoritma yang baik.
              </h2>
              <p className="article-deck">
                Robot juga membutuhkan metode yang konsisten, cukup cepat, dan
                tidak memboroskan eksplorasi ketika ruang bebas semakin sempit.
              </p>
            </motion.header>

            <motion.div
              className="reading-grid"
              initial="hidden"
              whileInView="visible"
              viewport={VIEWPORT_ONCE}
              variants={container}
            >
              <div className="reading-column">
                <motion.p className="drop-cap" variants={item}>
                  Penelitian ini membandingkan lima metode pencarian jalur dalam
                  tiga keluarga strategi: Brute Force sebagai enumerasi kandidat
                  waypoint, UCS/GBFS/A* sebagai pencarian grid, dan RRT* sebagai
                  sampling ruang kontinu. Seluruh metode diuji pada peta,
                  titik awal, titik tujuan, dan aturan tabrakan yang sama.
                </motion.p>
                <motion.p variants={item}>
                  Evaluasi tidak berhenti pada apakah sebuah jalur ditemukan.
                  Setiap run mencatat biaya lintasan, waktu eksekusi, jumlah
                  processed, dan tingkat keberhasilan. Empat tingkat kepadatan
                  hambatan serta lima seed digunakan untuk memperlihatkan
                  performa rata-rata sekaligus variasinya.
                </motion.p>
              </div>
              <motion.aside className="margin-note" variants={item}>
                <span>Cara membaca</span>
                <p>
                  Narasi menjelaskan konteks. Figur interaktif memberi ruang
                  untuk memeriksa klaim dan mengubah parameter sendiri.
                </p>
              </motion.aside>
            </motion.div>

            <motion.aside
              className="research-callout"
              initial="hidden"
              whileInView="visible"
              viewport={VIEWPORT_ONCE}
              variants={reveal}
            >
              <Route size={27} />
              <div>
                <span>Pertanyaan penelitian</span>
                <p>
                  Algoritma mana yang memberi keseimbangan terbaik antara
                  kualitas jalur, waktu komputasi, keberhasilan, dan jumlah
                  processed pada lapangan robot sepak bola berhalangan?
                </p>
              </div>
            </motion.aside>
          </section>

          <section id="masalah" className="article-section article-section-muted">
            <motion.div
              className="article-section-heading"
              initial="hidden"
              whileInView="visible"
              viewport={VIEWPORT_ONCE}
              variants={reveal}
            >
              <p className="article-kicker">01 / Formulasi masalah</p>
              <h2>Dari posisi awal menuju target tanpa menyentuh hambatan.</h2>
            </motion.div>

            <div className="reading-grid">
              <div className="reading-column">
                <p>
                  Masukan eksperimen adalah lapangan dua dimensi berukuran
                  60 × 40 unit, posisi start dan goal, serta kumpulan hambatan
                  lingkaran dan persegi panjang. Keluaran yang diharapkan adalah
                  urutan titik yang membentuk lintasan valid dari start ke goal.
                </p>
                <p>
                  Fungsi objektif meminimalkan total panjang segmen lintasan.
                  Setiap segmen harus tetap berada di dalam lapangan dan bebas
                  irisan dengan hambatan. UCS, GBFS, dan A* bekerja pada grid;
                  Brute Force menguji kombinasi waypoint; RRT* membangun pohon
                  pada koordinat kontinu.
                </p>
              </div>
              <aside className="margin-note">
                <span>Batas penelitian</span>
                <p>
                  Robot dimodelkan sebagai titik, hambatan statis, dan tidak ada
                  kendala orientasi maupun dinamika gerak.
                </p>
              </aside>
            </div>

            <motion.div
              className="problem-spec-grid"
              initial="hidden"
              whileInView="visible"
              viewport={VIEWPORT_ONCE}
              variants={container}
            >
              <motion.article variants={item}>
                <span>Input</span>
                <strong>Peta, start, goal</strong>
                <p>Geometri lapangan dan hambatan yang sama untuk setiap metode.</p>
              </motion.article>
              <motion.article variants={item}>
                <span>Output</span>
                <strong>Lintasan valid</strong>
                <p>Urutan titik yang dapat dilalui tanpa kolisi.</p>
              </motion.article>
              <motion.article variants={item}>
                <span>Objective</span>
                <strong>Minimum cost</strong>
                <p>Jumlah panjang seluruh segmen lintasan.</p>
              </motion.article>
              <motion.article variants={item}>
                <span>Constraint</span>
                <strong>Bebas hambatan</strong>
                <p>Seluruh segmen berada dalam batas dan ruang bebas.</p>
              </motion.article>
            </motion.div>
          </section>

          <section id="algoritma" className="article-section">
            <motion.div
              className="article-section-heading"
              initial="hidden"
              whileInView="visible"
              viewport={VIEWPORT_ONCE}
              variants={reveal}
            >
              <p className="article-kicker">02 / Strategi algoritma</p>
              <h2>Tiga cara berbeda memahami ruang pencarian.</h2>
              <p>
                Perbedaan utama bukan sekadar rumus prioritas, melainkan
                representasi ruang dan informasi yang dipakai untuk memutuskan
                langkah berikutnya.
              </p>
            </motion.div>

            <div className="reading-grid">
              <div className="reading-column">
                <p>
                  Brute Force memperlakukan masalah sebagai kumpulan kandidat
                  rute terbatas. UCS memperluas simpul berdasarkan biaya aktual
                  g(n), GBFS mengikuti estimasi menuju target h(n), sedangkan A*
                  menggabungkan keduanya melalui f(n) = g(n) + h(n). RRT*
                  tidak menelusuri grid; ia menumbuhkan dan memperbaiki pohon
                  sampling di ruang kontinu.
                </p>
              </div>
              <aside className="margin-note">
                <span>Pengelompokan tugas</span>
                <p>
                  UCS, GBFS, dan A* diperlakukan sebagai satu keluarga pencarian
                  graf, tetapi hasil setiap variannya tetap ditampilkan.
                </p>
              </aside>
            </div>

            <div className="article-breakout algorithm-breakout">
              <AlgorithmOverview />
            </div>

            <motion.figure
              className="editorial-figure image-figure"
              initial="hidden"
              whileInView="visible"
              viewport={VIEWPORT_ONCE}
              variants={reveal}
            >
              <img
                src={HERO_IMAGE_URL}
                alt="Perbandingan jalur Brute Force, UCS, GBFS, A*, dan RRT* pada lapangan berhalangan"
              />
              <FigureCaption
                number="01"
                title="Perbandingan jalur yang dihasilkan lima metode pada skenario Sulit, seed 4."
                source="Sumber: hasil eksperimen Python pada makalah."
              />
            </motion.figure>
          </section>

          <section id="simulasi" className="article-section dark-article-section">
            <motion.div
              className="article-section-heading inverse-article-heading"
              initial="hidden"
              whileInView="visible"
              viewport={VIEWPORT_ONCE}
              variants={reveal}
            >
              <p className="article-kicker">03 / Simulasi interaktif</p>
              <h2>Amati cara setiap metode membentuk jalurnya.</h2>
              <p>
                Pilih skenario, seed, dan lapisan visual. Paper mode membuka
                skenario Sulit seed 4 yang digunakan pada figur penelitian.
              </p>
            </motion.div>

            <figure className="article-breakout interactive-figure">
              <SimulatorLab />
              <FigureCaption
                number="02"
                title="Laboratorium browser untuk membandingkan lintasan dan aktivitas pencarian."
                source="Browser runtime adalah pengukuran live dan terpisah dari waktu eksperimen makalah."
              />
            </figure>
          </section>

          <section id="metode" className="article-section dark-article-section methodology-article">
            <motion.div
              className="article-section-heading inverse-article-heading"
              initial="hidden"
              whileInView="visible"
              viewport={VIEWPORT_ONCE}
              variants={reveal}
            >
              <p className="article-kicker">04 / Metodologi</p>
              <h2>Peta yang sama, tetapi representasi tidak identik.</h2>
              <p>
                Desain eksperimen menahan kondisi eksternal tetap sama, lalu
                membaca hasil sesuai karakter internal setiap algoritma.
              </p>
            </motion.div>

            <div className="reading-grid inverse-reading">
              <div className="reading-column">
                <p>
                  Setiap algoritma dijalankan pada empat skenario dan lima seed,
                  menghasilkan 20 kombinasi pengujian per metode. Pencatatan
                  dilakukan secara sistematis untuk status keberhasilan, biaya,
                  waktu, dan processed sebelum dihitung rata-rata serta
                  simpangan bakunya.
                </p>
                <p>
                  Validasi lintasan menggunakan aturan kolisi yang sama.
                  Perbandingan biaya langsung paling kuat dilakukan antara
                  UCS, GBFS, dan A* karena ketiganya berbagi grid. RRT* dan
                  Brute Force tetap relevan sebagai strategi alternatif, tetapi
                  interpretasinya harus mempertimbangkan representasi berbeda.
                </p>
              </div>
              <aside className="margin-note">
                <span>Fairness</span>
                <p>
                  A* optimal pada representasi grid penelitian, bukan klaim
                  optimal global untuk seluruh ruang kontinu.
                </p>
              </aside>
            </div>

            <motion.div
              className="method-grid article-breakout"
              initial="hidden"
              whileInView="visible"
              viewport={VIEWPORT_ONCE}
              variants={container}
            >
              <motion.article className="method-main" variants={item}>
                <div className="method-number">20</div>
                <p>kombinasi eksperimen</p>
                <span>4 skenario × 5 seed</span>
              </motion.article>
              <motion.article variants={item}>
                <Grid3X3 size={23} />
                <h3>Grid 60 × 40</h3>
                <p>UCS, GBFS, dan A* memproses simpul diskret lapangan.</p>
              </motion.article>
              <motion.article variants={item}>
                <ShieldCheck size={23} />
                <h3>Validasi bersama</h3>
                <p>Setiap jalur harus berada dalam batas dan bebas hambatan.</p>
              </motion.article>
              <motion.article variants={item}>
                <Database size={23} />
                <h3>Data per seed</h3>
                <p>Setiap run disimpan sebelum dihitung statistik ringkas.</p>
              </motion.article>
            </motion.div>

            <motion.div
              className="scenario-ledger article-breakout"
              initial="hidden"
              whileInView="visible"
              viewport={VIEWPORT_ONCE}
              variants={container}
            >
              {SCENARIOS.map((scenario, index) => (
                <motion.article key={scenario.name} variants={item}>
                  <span>0{index + 1}</span>
                  <h3>{scenario.name}</h3>
                  <p>{scenario.obstacles}</p>
                  <small>{scenario.purpose}</small>
                </motion.article>
              ))}
            </motion.div>
          </section>

          <section id="hasil" className="article-section results-article">
            <motion.div
              className="article-section-heading"
              initial="hidden"
              whileInView="visible"
              viewport={VIEWPORT_ONCE}
              variants={reveal}
            >
              <p className="article-kicker">05 / Hasil eksperimen</p>
              <h2>A* mempertahankan biaya UCS dengan eksplorasi lebih kecil.</h2>
              <p>
                Gunakan filter untuk memeriksa rata-rata dan simpangan baku
                setiap skenario. Data di bawah berasal dari eksperimen Python,
                bukan simulasi live di browser.
              </p>
            </motion.div>

            <figure className="article-breakout interactive-figure light-figure">
              <ResultsExplorer />
              <FigureCaption
                number="03"
                title="Eksplorasi biaya, waktu, processed, dan tingkat keberhasilan berdasarkan skenario."
                source="Sumber: ringkasan eksperimen, rata-rata lima seed."
              />
            </figure>

            <motion.div
              className="finding-header"
              initial="hidden"
              whileInView="visible"
              viewport={VIEWPORT_ONCE}
              variants={reveal}
            >
              <div>
                <p className="article-kicker">Temuan utama</p>
                <h3>
                  Pengurangan processed terjadi tanpa mengubah biaya optimal grid.
                </h3>
              </div>
              <Target size={30} />
            </motion.div>

            <motion.div
              className="finding-grid"
              initial="hidden"
              whileInView="visible"
              viewport={VIEWPORT_ONCE}
              variants={container}
            >
              {PROCESSED_FINDINGS.map((finding) => (
                <motion.article
                  className="finding-card"
                  key={finding.scenario}
                  variants={item}
                  whileHover={reducedMotion ? undefined : { y: -4 }}
                >
                  <span>{finding.scenario}</span>
                  <strong>{finding.reduction}</strong>
                  <p>lebih sedikit processed daripada UCS</p>
                  <small>Biaya A* = UCS: {finding.cost}</small>
                </motion.article>
              ))}
            </motion.div>

            <div className="reading-grid results-reading">
              <div className="reading-column">
                <h3>Membaca trade-off, bukan memilih pemenang tunggal.</h3>
                <p>
                  Pada skenario Mudah, A* memproses 246 simpul dibandingkan
                  2.041 simpul oleh UCS, atau berkurang sekitar 87,9%, dengan
                  biaya identik 54,82. Pola pengurangan tetap terlihat pada
                  Sedang, Sulit, dan Padat, meskipun besarnya berubah mengikuti
                  geometri ruang bebas.
                </p>
                <p>
                  GBFS menjadi metode tercepat pada seluruh skenario, tetapi
                  kecepatan tersebut dibayar dengan hilangnya jaminan biaya
                  minimum. RRT* mampu bekerja pada ruang kontinu dan menjaga
                  keberhasilan, namun waktu serta jumlah node lebih sensitif
                  terhadap seed. Brute Force paling cepat kehilangan
                  reliabilitas ketika ruang makin kompleks.
                </p>
              </div>
              <aside className="margin-note">
                <span>Unit processed</span>
                <p>
                  Kandidat waypoint, simpul grid, dan node sampling bukan unit
                  fisik yang identik. Bandingkan sebagai beban internal metode.
                </p>
              </aside>
            </div>

            <motion.div
              className="analysis-band article-breakout"
              initial="hidden"
              whileInView="visible"
              viewport={VIEWPORT_ONCE}
              variants={container}
            >
              <motion.article variants={item}>
                <TimerReset size={22} />
                <h3>GBFS paling cepat</h3>
                <p>
                  Heuristik mengarahkan pencarian agresif ke target, tetapi
                  kualitas jalur tidak selalu minimum.
                </p>
              </motion.article>
              <motion.article variants={item}>
                <TriangleAlert size={22} />
                <h3>Brute Force tidak skalabel</h3>
                <p>
                  Keberhasilan turun menjadi 20% pada Sulit dan Padat meski
                  tetap menguji 12.721 kandidat.
                </p>
              </motion.article>
              <motion.article variants={item}>
                <RadioTower size={22} />
                <h3>RRT* lebih variatif</h3>
                <p>
                  Pada Padat, simpangan baku waktu mencapai 157,6 ms karena
                  sifat sampling dan rewiring.
                </p>
              </motion.article>
            </motion.div>

            <motion.aside
              className="fairness-note article-breakout"
              initial="hidden"
              whileInView="visible"
              viewport={VIEWPORT_ONCE}
              variants={reveal}
            >
              <Lightbulb size={24} />
              <div>
                <h3>Batas interpretasi eksperimen</h3>
                <p>
                  Perbedaan representasi membuat perbandingan lintas keluarga
                  tidak sepenuhnya apple-to-apple. Kesimpulan utama karena itu
                  menekankan keseimbangan untuk model penelitian ini, bukan
                  superioritas universal pada semua sistem robot.
                </p>
              </div>
            </motion.aside>
          </section>

          <section id="kesimpulan" className="article-section conclusion-article">
            <motion.div
              className="article-section-heading"
              initial="hidden"
              whileInView="visible"
              viewport={VIEWPORT_ONCE}
              variants={reveal}
            >
              <p className="article-kicker">06 / Kesimpulan</p>
              <h2>A* adalah pilihan paling seimbang untuk model grid ini.</h2>
            </motion.div>

            <div className="reading-grid">
              <div className="reading-column">
                <p className="conclusion-emphasis">
                  A* mempertahankan biaya optimal UCS sambil mengurangi jumlah
                  processed pada seluruh skenario.
                </p>
                <p>
                  RRT* tetap bernilai ketika ruang kontinu dan keluwesan
                  geometri menjadi prioritas. GBFS dapat dipilih ketika respons
                  cepat lebih penting daripada jaminan kualitas. Brute Force
                  berfungsi baik sebagai baseline konseptual, tetapi tidak
                  memadai untuk ruang yang padat dan kompleks.
                </p>
              </div>
              <aside className="margin-note">
                <span>Kelanjutan</span>
                <p>
                  Theta*, D* Lite, Hybrid A*, dan hambatan dinamis menjadi arah
                  eksperimen berikutnya.
                </p>
              </aside>
            </div>

            <motion.div
              className="conclusion-ledger"
              initial="hidden"
              whileInView="visible"
              viewport={VIEWPORT_ONCE}
              variants={container}
            >
              <motion.article variants={item}>
                <span>Rekomendasi utama</span>
                <strong>A*</strong>
                <p>Optimal pada grid dan lebih terarah daripada UCS.</p>
              </motion.article>
              <motion.article variants={item}>
                <span>Alternatif kontinu</span>
                <strong>RRT*</strong>
                <p>Fleksibel, tetapi membutuhkan tuning dan pembacaan variasi.</p>
              </motion.article>
            </motion.div>
          </section>

          <section id="makalah" className="article-section paper-article">
            <motion.div
              className="article-section-heading"
              initial="hidden"
              whileInView="visible"
              viewport={VIEWPORT_ONCE}
              variants={reveal}
            >
              <p className="article-kicker">07 / Makalah lengkap</p>
              <h2>Baca dokumen penelitian tanpa meninggalkan halaman.</h2>
              <p>
                Reader berikut menampilkan PDF final. Gunakan tombol toolbar
                untuk membuka tampilan penuh atau mengunduh dokumen.
              </p>
            </motion.div>
            <div className="article-breakout">
              <PaperReader paperUrl={PAPER_URL} title={PAPER_TITLE} />
            </div>
          </section>

          <motion.section
            className="article-section resource-section editorial-resources"
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT_ONCE}
            variants={container}
          >
            <motion.div className="resource-copy" variants={item}>
              <p className="article-kicker">Arsip penelitian</p>
              <h2>Data, figur, dan implementasi dapat diperiksa kembali.</h2>
            </motion.div>
            <motion.div className="resource-list" variants={container}>
              <motion.a href={PAPER_URL} download variants={item} whileTap={tap}>
                <FileText size={22} />
                <span>
                  <strong>Makalah PDF</strong>
                  <small>Dokumen penelitian final</small>
                </span>
                <Download size={18} />
              </motion.a>
              <motion.a href={SUMMARY_CSV_URL} variants={item} whileTap={tap}>
                <FileSpreadsheet size={22} />
                <span>
                  <strong>Ringkasan eksperimen</strong>
                  <small>Mean dan standar deviasi</small>
                </span>
                <Download size={18} />
              </motion.a>
              <motion.a href={RAW_CSV_URL} variants={item} whileTap={tap}>
                <Database size={22} />
                <span>
                  <strong>Data per seed</strong>
                  <small>Seluruh run eksperimen</small>
                </span>
                <Download size={18} />
              </motion.a>
              <motion.a href={TIME_FIGURE_URL} variants={item} whileTap={tap}>
                <Target size={22} />
                <span>
                  <strong>Figur waktu</strong>
                  <small>Visualisasi statis dari makalah</small>
                </span>
                <Download size={18} />
              </motion.a>
              <motion.a
                href={GITHUB_URL}
                target="_blank"
                rel="noreferrer"
                variants={item}
                whileTap={tap}
              >
                <Github size={22} />
                <span>
                  <strong>Repository GitHub</strong>
                  <small>Python, React, data, dan dokumentasi</small>
                </span>
                <ExternalLink size={18} />
              </motion.a>
            </motion.div>
          </motion.section>
        </article>
      </div>

      <footer className="report-footer">
        <div>
          <CheckCircle2 size={18} />
          ASA 2026-1 / Informatika Universitas Diponegoro
        </div>
        <a href="#ringkasan">
          Kembali ke artikel
          <ArrowDown className="footer-up-arrow" size={17} />
        </a>
      </footer>
    </main>
  );
}
