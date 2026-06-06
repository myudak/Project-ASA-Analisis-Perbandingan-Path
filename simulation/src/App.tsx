import {
  ArrowDown,
  ArrowRight,
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
  ShieldCheck,
  Target,
  TimerReset,
  TriangleAlert,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import AlgorithmOverview from "./components/AlgorithmOverview";
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
const PAPER_URL = `${BASE_URL}downloads/Makalah_ASA_Robot_Path_Planning_UCS_Astar_RRTstar.pdf`;
const SUMMARY_CSV_URL = `${BASE_URL}downloads/ringkasan_eksperimen.csv`;
const RAW_CSV_URL = `${BASE_URL}downloads/hasil_eksperimen.csv`;
const HERO_IMAGE_URL = `${BASE_URL}images/fig_perbandingan_jalur.png`;
const TIME_FIGURE_URL = `${BASE_URL}images/fig_waktu_rata_rata.png`;
const GITHUB_URL =
  "https://github.com/myudak/Project-ASA-Analisis-Perbandingan-Path";

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

export default function App() {
  const reducedMotion = Boolean(useReducedMotion());
  const reveal = revealVariants(reducedMotion);
  const container = staggerContainerVariants(reducedMotion);
  const item = staggerItemVariants(reducedMotion);
  const tap = reducedMotion ? undefined : { scale: 0.98 };

  return (
    <main className="report-shell">
      <ReportNav paperUrl={PAPER_URL} />

      <motion.section
        id="ringkasan"
        className="hero-section"
        initial="hidden"
        animate="visible"
        variants={container}
      >
        <motion.img
          className="hero-background"
          src={HERO_IMAGE_URL}
          alt=""
          aria-hidden="true"
          initial={
            reducedMotion ? false : { opacity: 0, scale: 1.035 }
          }
          animate={{ opacity: 1, scale: 1 }}
          transition={motionTransition(reducedMotion, 0.8)}
        />
        <div className="hero-overlay" />
        <motion.div className="hero-content" variants={container}>
          <motion.div className="hero-meta" variants={item}>
            <span>Analisis dan Strategi Algoritma</span>
            <span>2026-1</span>
            <span>Eksperimen path planning</span>
          </motion.div>

          <motion.div className="hero-copy" variants={container}>
            <motion.p className="hero-kicker" variants={item}>
              Makalah interaktif / robot sepak bola humanoid
            </motion.p>
            <motion.h1 variants={item}>
              Analisis Perbandingan UCS, A*, dan RRT* pada Simulasi Pencarian
              Jalur Robot Sepak Bola Humanoid di Lapangan Berhalangan
            </motion.h1>
            <motion.p className="hero-lead" variants={item}>
              Membandingkan kualitas jalur, waktu komputasi, keberhasilan, dan
              beban processed melalui Brute Force, keluarga pencarian grid, serta
              RRT* pada empat tingkat kepadatan lapangan.
            </motion.p>
          </motion.div>

          <motion.div className="hero-actions" variants={item}>
            <motion.a className="primary-action" href="#simulasi" whileTap={tap}>
              Buka simulasi
              <ArrowDown size={18} />
            </motion.a>
            <motion.a className="secondary-action" href={PAPER_URL} whileTap={tap}>
              <FileText size={18} />
              Unduh makalah
            </motion.a>
            <motion.a
              className="secondary-action"
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              whileTap={tap}
            >
              <Github size={18} />
              Source code
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
              <span>Ruang eksperimen</span>
              <strong>60 x 40 / 5 seed</strong>
            </motion.div>
          </motion.div>
        </motion.div>
        <motion.a
          className="hero-scroll"
          href="#algoritma"
          aria-label="Lanjut ke algoritma"
          variants={item}
        >
          <span>Eksplorasi laporan</span>
          <ArrowDown size={17} />
        </motion.a>
      </motion.section>

      <section id="algoritma" className="report-section light-section">
        <motion.div
          className="section-heading"
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
          variants={reveal}
        >
          <div>
            <p className="section-index">01 / ALGORITMA</p>
            <h2>Tiga strategi, satu tujuan lintasan.</h2>
          </div>
          <p>
            Perbandingan dirancang untuk memperlihatkan bagaimana enumerasi,
            pencarian graf berheuristik, dan sampling kontinu bereaksi terhadap
            geometri hambatan yang sama.
          </p>
        </motion.div>
        <AlgorithmOverview />
      </section>

      <section id="simulasi" className="report-section simulator-section">
        <motion.div
          className="section-heading inverse-heading"
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
          variants={reveal}
        >
          <div>
            <p className="section-index">02 / SIMULASI INTERAKTIF</p>
            <h2>Lihat strategi pencarian bekerja.</h2>
          </div>
          <p>
            Pilih skenario, seed, dan lapisan visual. Preset Paper mode membuka
            skenario Sulit seed 4 yang digunakan pada figur perbandingan jalur.
          </p>
        </motion.div>
        <SimulatorLab />
      </section>

      <section id="hasil" className="report-section results-section">
        <motion.div
          className="section-heading"
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
          variants={reveal}
        >
          <div>
            <p className="section-index">03 / HASIL EKSPERIMEN</p>
            <h2>Angka makalah, dibuka untuk dibandingkan.</h2>
          </div>
          <p>
            Grafik memakai rata-rata lima seed dari eksperimen Python. Garis
            vertikal pada setiap batang menunjukkan simpangan baku, bukan runtime
            simulasi browser.
          </p>
        </motion.div>

        <ResultsExplorer />

        <motion.div
          className="finding-header"
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
          variants={reveal}
        >
          <div>
            <p className="section-index">TEMUAN UTAMA</p>
            <h3>A* mengurangi eksplorasi tanpa mengubah biaya optimal grid.</h3>
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

        <motion.div
          className="analysis-band"
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
          variants={container}
        >
          <motion.article variants={item}>
            <TimerReset size={22} />
            <h3>GBFS paling cepat</h3>
            <p>
              GBFS mencatat waktu rata-rata terendah pada keempat skenario, tetapi
              mengejar heuristik tanpa jaminan biaya minimum.
            </p>
          </motion.article>
          <motion.article variants={item}>
            <TriangleAlert size={22} />
            <h3>Brute Force tidak skalabel</h3>
            <p>
              Keberhasilan turun dari 100% pada Mudah menjadi 20% pada Sulit dan
              Padat, sambil tetap menguji 12.721 kandidat.
            </p>
          </motion.article>
          <motion.article variants={item}>
            <RadioTower size={22} />
            <h3>RRT* lebih variatif</h3>
            <p>
              Pada skenario Padat, simpangan baku waktu mencapai 157,6 ms dan
              processed 206,8 node akibat sifat sampling.
            </p>
          </motion.article>
        </motion.div>
      </section>

      <section className="report-section methodology-section">
        <motion.div
          className="section-heading inverse-heading"
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
          variants={reveal}
        >
          <div>
            <p className="section-index">04 / METODOLOGI</p>
            <h2>Perbandingan yang sama peta, bukan sama representasi.</h2>
          </div>
          <p>
            Semua metode dijalankan pada perangkat, peta, start-goal, dan
            validasi tabrakan yang sama. Namun, arti processed mengikuti model
            internal masing-masing algoritma.
          </p>
        </motion.div>

        <motion.div
          className="method-grid"
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
          variants={container}
        >
          <motion.article className="method-main" variants={item}>
            <div className="method-number">20</div>
            <p>kombinasi eksperimen</p>
            <span>4 skenario x 5 seed</span>
          </motion.article>
          <motion.article variants={item}>
            <Grid3X3 size={23} />
            <h3>Grid 60 x 40</h3>
            <p>UCS, GBFS, dan A* memproses simpul pada diskretisasi lapangan.</p>
          </motion.article>
          <motion.article variants={item}>
            <ShieldCheck size={23} />
            <h3>Validasi bersama</h3>
            <p>Setiap jalur harus berada dalam batas dan tidak memotong hambatan.</p>
          </motion.article>
          <motion.article variants={item}>
            <Database size={23} />
            <h3>Data per seed</h3>
            <p>Biaya, waktu, processed, dan status disimpan sebelum diringkas.</p>
          </motion.article>
        </motion.div>

        <motion.div
          className="scenario-ledger"
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

        <motion.div
          className="fairness-note"
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
          variants={reveal}
        >
          <Lightbulb size={24} />
          <div>
            <h3>Batas interpretasi processed</h3>
            <p>
              Angka processed adalah kandidat waypoint untuk Brute Force, simpul
              grid untuk UCS/GBFS/A*, dan node sampling untuk RRT*. Nilainya
              berguna sebagai indikator beban internal, tetapi tidak boleh
              dianggap sebagai satuan fisik yang sepenuhnya identik.
            </p>
          </div>
        </motion.div>
      </section>

      <motion.section
        id="kesimpulan"
        className="report-section conclusion-section"
        initial="hidden"
        whileInView="visible"
        viewport={VIEWPORT_ONCE}
        variants={container}
      >
        <motion.div className="conclusion-lead" variants={item}>
          <p className="section-index">05 / KESIMPULAN</p>
          <h2>A* adalah pilihan paling seimbang untuk model grid penelitian ini.</h2>
          <p>
            A* mempertahankan biaya optimal UCS sambil mengurangi processed pada
            seluruh skenario. RRT* tetap relevan saat ruang kontinu dan keluwesan
            geometri lebih penting, sedangkan GBFS berguna ketika kecepatan lebih
            diprioritaskan daripada jaminan kualitas jalur.
          </p>
        </motion.div>

        <motion.div className="recommendation-stack" variants={container}>
          <motion.article variants={item}>
            <span>Rekomendasi utama</span>
            <strong>A*</strong>
            <p>Optimal pada grid, lebih terarah daripada UCS.</p>
          </motion.article>
          <motion.article variants={item}>
            <span>Alternatif kontinu</span>
            <strong>RRT*</strong>
            <p>Fleksibel, tetapi membutuhkan tuning dan pembacaan variasi.</p>
          </motion.article>
        </motion.div>

        <motion.div className="future-work" variants={item}>
          <h3>Kelanjutan penelitian</h3>
          <div>
            <span>Theta*</span>
            <span>D* Lite</span>
            <span>Hybrid A*</span>
            <span>Hambatan dinamis</span>
          </div>
        </motion.div>
      </motion.section>

      <motion.section
        className="report-section resource-section"
        initial="hidden"
        whileInView="visible"
        viewport={VIEWPORT_ONCE}
        variants={container}
      >
        <motion.div className="resource-copy" variants={item}>
          <p className="section-index">ARSIP PENELITIAN</p>
          <h2>Periksa makalah, data mentah, dan implementasinya.</h2>
        </motion.div>
        <motion.div className="resource-list" variants={container}>
          <motion.a href={PAPER_URL} variants={item} whileTap={tap}>
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
              <small>Visualisasi dari makalah</small>
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
              <small>Python, React, dan dokumentasi</small>
            </span>
            <ExternalLink size={18} />
          </motion.a>
        </motion.div>
      </motion.section>

      <footer className="report-footer">
        <div>
          <CheckCircle2 size={18} />
          ASA 2026-1 / Informatika Universitas Diponegoro
        </div>
        <a href="#ringkasan">
          Kembali ke atas
          <ArrowRight size={17} />
        </a>
      </footer>
    </main>
  );
}
