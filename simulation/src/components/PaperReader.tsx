import { Download, ExternalLink, FileText } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { revealVariants, VIEWPORT_ONCE } from "../motion/variants";

interface PaperReaderProps {
  paperUrl: string;
  title: string;
}

export default function PaperReader({ paperUrl, title }: PaperReaderProps) {
  const reducedMotion = Boolean(useReducedMotion());

  return (
    <motion.figure
      className="paper-reader"
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT_ONCE}
      variants={revealVariants(reducedMotion, 22)}
    >
      <div className="paper-reader-toolbar">
        <div>
          <FileText size={20} />
          <span>
            <small>Dokumen lengkap</small>
            <strong>{title}</strong>
          </span>
        </div>
        <div className="paper-reader-actions">
          <a href={paperUrl} target="_blank" rel="noreferrer">
            <ExternalLink size={17} />
            Buka tab baru
          </a>
          <a href={paperUrl} download>
            <Download size={17} />
            Unduh PDF
          </a>
        </div>
      </div>

      <object
        className="paper-reader-frame"
        data={`${paperUrl}#view=FitH`}
        type="application/pdf"
        aria-label={`Pembaca PDF: ${title}`}
      >
        <div className="paper-reader-fallback">
          <FileText size={34} />
          <p>
            Browser ini tidak dapat menampilkan PDF secara langsung. Dokumen
            tetap dapat dibuka melalui tautan berikut.
          </p>
          <a href={paperUrl} target="_blank" rel="noreferrer">
            Buka makalah PDF
          </a>
        </div>
      </object>

      <figcaption>
        <span>Dokumen 01</span>
        Versi PDF makalah yang menjadi dasar narasi, data, dan simulasi pada
        halaman ini.
      </figcaption>
    </motion.figure>
  );
}
