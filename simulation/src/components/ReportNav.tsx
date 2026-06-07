import { Download, FileText, Github, Radar } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { motionTransition } from "../motion/variants";

const NAV_ITEMS = [
  ["ringkasan", "Ringkasan"],
  ["algoritma", "Algoritma"],
  ["simulasi", "Simulasi"],
  ["metode", "Metode"],
  ["hasil", "Hasil"],
  ["makalah", "Makalah"],
] as const;

interface ReportNavProps {
  paperUrl: string;
}

export default function ReportNav({ paperUrl }: ReportNavProps) {
  const reducedMotion = Boolean(useReducedMotion());

  return (
    <motion.header
      className="report-nav"
      initial={reducedMotion ? false : { opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={motionTransition(reducedMotion, 0.45, 0.18)}
    >
      <a className="nav-brand" href="#ringkasan" aria-label="Kembali ke ringkasan">
        <Radar size={19} />
        <span>PROJECT ASA</span>
      </a>

      <nav aria-label="Navigasi laporan">
        {NAV_ITEMS.map(([id, label]) => (
          <a key={id} href={`#${id}`}>
            {label}
          </a>
        ))}
      </nav>

      <div className="nav-actions">
        <a
          className="nav-icon"
          href="https://github.com/myudak/Project-ASA-Analisis-Perbandingan-Path"
          target="_blank"
          rel="noreferrer"
          aria-label="Buka source code di GitHub"
          title="GitHub"
        >
          <Github size={18} />
        </a>
        <a
          className="nav-icon"
          href={paperUrl}
          download
          aria-label="Unduh PDF makalah"
          title="Unduh PDF"
        >
          <Download size={18} />
        </a>
        <a
          className="nav-icon nav-paper"
          href="#makalah"
          aria-label="Baca makalah pada halaman ini"
          title="Baca makalah"
        >
          <FileText size={18} />
        </a>
      </div>
    </motion.header>
  );
}
