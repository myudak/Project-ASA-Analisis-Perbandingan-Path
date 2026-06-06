import { Compass, GitBranch, Network, Route } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import {
  staggerContainerVariants,
  staggerItemVariants,
  VIEWPORT_ONCE,
} from "../motion/variants";

const GROUPS = [
  {
    index: "01",
    title: "Brute Force",
    kicker: "Enumerasi waypoint terbatas",
    description:
      "Menguji kombinasi kandidat waypoint sampai kedalaman tiga. Berguna sebagai baseline konseptual, tetapi jumlah kandidat tumbuh cepat dan tingkat keberhasilannya turun pada ruang sempit.",
    icon: <GitBranch size={24} />,
    facts: ["O(n^d)", "Waypoint", "Baseline"],
    tone: "var(--orange)",
  },
  {
    index: "02",
    title: "UCS / GBFS / A*",
    kicker: "Keluarga pencarian grid",
    description:
      "UCS mengejar biaya aktual, GBFS mengejar heuristik, dan A* menggabungkan keduanya. Kelompok ini memperlihatkan trade-off paling jelas antara optimalitas, arah pencarian, dan beban processed.",
    icon: <Compass size={24} />,
    facts: ["g(n)", "h(n)", "g(n) + h(n)"],
    tone: "var(--cyan)",
  },
  {
    index: "03",
    title: "RRT*",
    kicker: "Sampling ruang kontinu",
    description:
      "Membangun pohon sampling dan melakukan rewiring untuk memperbaiki lintasan. Cocok ketika representasi kontinu penting, tetapi hasilnya lebih sensitif terhadap seed dan parameter.",
    icon: <Network size={24} />,
    facts: ["Sampling", "Rewiring", "Kontinu"],
    tone: "var(--violet)",
  },
] as const;

export default function AlgorithmOverview() {
  const reducedMotion = Boolean(useReducedMotion());
  const container = staggerContainerVariants(reducedMotion);
  const item = staggerItemVariants(reducedMotion);

  return (
    <motion.div
      className="algorithm-overview"
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT_ONCE}
      variants={container}
    >
      {GROUPS.map((group) => (
        <motion.article
          className="algorithm-group"
          key={group.index}
          variants={item}
          whileHover={reducedMotion ? undefined : { y: -4 }}
          transition={{ duration: reducedMotion ? 0 : 0.2 }}
        >
          <div className="algorithm-index">{group.index}</div>
          <div className="algorithm-icon" style={{ color: group.tone }}>
            {group.icon}
          </div>
          <p className="algorithm-kicker">{group.kicker}</p>
          <h3>{group.title}</h3>
          <p>{group.description}</p>
          <div className="algorithm-facts">
            {group.facts.map((fact) => (
              <span key={fact}>{fact}</span>
            ))}
          </div>
        </motion.article>
      ))}

      <motion.aside className="research-question" variants={item}>
        <Route size={26} />
        <div>
          <span>Pertanyaan penelitian</span>
          <p>
            Algoritma mana yang memberi keseimbangan terbaik antara kualitas jalur,
            waktu komputasi, keberhasilan, dan jumlah processed pada lapangan
            berhalangan?
          </p>
        </div>
      </motion.aside>
    </motion.div>
  );
}
