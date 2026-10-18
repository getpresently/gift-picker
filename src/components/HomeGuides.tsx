import type { MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "../hooks/useIsMobile";
import { track } from "../data/analytics";
import { formatPostDate, POSTS } from "../data/posts";

/**
 * A low-key "Gift guides" row for the bottom of the homepage: the three newest
 * posts as plain text links, with no buttons, so the quiz stays the main call
 * to action. It is self-contained; removing it means deleting the one
 * <HomeGuides /> line (and its import) in Landing.tsx.
 */
export function HomeGuides() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const go = (to: string, slug?: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    track("home_guide_open", { slug: slug ?? "index" });
    navigate(to);
  };
  const posts = POSTS.slice(0, 3);
  if (!posts.length) return null;

  return (
    <section id="gift-guides" style={{ marginTop: isMobile ? 48 : 72 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: 16,
          marginBottom: isMobile ? 14 : 18,
        }}
      >
        <div
          style={{
            fontFamily: "Geist, sans-serif",
            fontSize: 12,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "rgba(35,20,16,0.55)",
          }}
        >
          Gift guides
        </div>
        <a
          href="/blog"
          onClick={go("/blog")}
          style={{ fontFamily: "Geist, sans-serif", fontSize: 13, color: "rgba(35,20,16,0.6)", textDecoration: "none", whiteSpace: "nowrap" }}
        >
          All gift guides →
        </a>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))",
          gap: isMobile ? 16 : 28,
        }}
      >
        {posts.map((p) => (
          <a
            key={p.slug}
            href={`/blog/${p.slug}`}
            onClick={go(`/blog/${p.slug}`, p.slug)}
            style={{ textDecoration: "none", color: "inherit", display: "block" }}
          >
            <div style={{ fontFamily: "Geist, sans-serif", fontSize: 12, color: "rgba(35,20,16,0.5)" }}>
              {formatPostDate(p.published)}
            </div>
            <div
              style={{
                fontFamily: '"Instrument Serif", serif',
                fontSize: isMobile ? 21 : 23,
                lineHeight: 1.2,
                color: "#231410",
                marginTop: 4,
                textWrap: "pretty" as never,
              }}
            >
              {p.title}
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
