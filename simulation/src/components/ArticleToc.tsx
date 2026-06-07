import { useEffect, useRef, useState } from "react";

export interface ArticleSection {
  id: string;
  label: string;
}

interface ArticleTocProps {
  sections: readonly ArticleSection[];
}

export default function ArticleToc({ sections }: ArticleTocProps) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");
  const [progress, setProgress] = useState(0);
  const mobileDetails = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const targets = sections
      .map((section) => document.getElementById(section.id))
      .filter((element): element is HTMLElement => element !== null);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio);

        if (visible[0]) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        rootMargin: "-18% 0px -68% 0px",
        threshold: [0, 0.1, 0.35, 0.6],
      },
    );

    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, [sections]);

  useEffect(() => {
    let frame = 0;

    const updateProgress = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const scrollable = document.documentElement.scrollHeight - window.innerHeight;
        setProgress(scrollable > 0 ? Math.min(1, window.scrollY / scrollable) : 0);
      });
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, []);

  const links = sections.map((section, index) => (
    <a
      key={section.id}
      className={activeId === section.id ? "active" : ""}
      href={`#${section.id}`}
      aria-current={activeId === section.id ? "location" : undefined}
      onClick={() => mobileDetails.current?.removeAttribute("open")}
    >
      <span>{String(index + 1).padStart(2, "0")}</span>
      {section.label}
    </a>
  ));

  return (
    <>
      <div className="reading-progress" aria-hidden="true">
        <span style={{ transform: `scaleX(${progress})` }} />
      </div>

      <aside className="article-toc article-toc-desktop" aria-label="Daftar isi artikel">
        <p>Daftar isi</p>
        <nav>{links}</nav>
      </aside>

      <details className="article-toc-mobile" ref={mobileDetails}>
        <summary>
          <span>Daftar isi</span>
          <strong>
            {sections.find((section) => section.id === activeId)?.label ??
              sections[0]?.label}
          </strong>
        </summary>
        <nav>{links}</nav>
      </details>
    </>
  );
}
