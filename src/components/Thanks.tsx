import type { MouseEvent } from "react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { LegalShell, linkStyle, paragraphStyle, sectionHeadingStyle } from "./Legal";
import { useGifts } from "../data/giftsApi";
import { formatPostDate, parseInline } from "../data/posts";
import { liveThanks, THANKS_INTRO, THANKS_UPDATED } from "../data/thanks";

/**
 * /thanks: credits for the people and lists that led us to gifts in the
 * catalog (data in src/data/thanks.ts). Only live gifts are listed; a local
 * preview (npm run dev) shows every gift, marking the ones still in review.
 */
export function ThanksPage() {
  const navigate = useNavigate();
  const { data, loading, error } = useGifts();
  const live = useMemo(() => new Set(data.map((g) => g.id)), [data]);
  const preview = import.meta.env.DEV;
  const sources = liveThanks(preview || loading || error ? null : live);
  const openGift = (id: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    navigate(`/gift/${id}`);
  };

  return (
    <LegalShell title="Thanks" updated={formatPostDate(THANKS_UPDATED)}>
      <p style={paragraphStyle}>{THANKS_INTRO}</p>
      {!loading &&
        sources.map((s) => (
          <section key={s.by}>
            <h2 style={sectionHeadingStyle}>{s.by}</h2>
            <p style={paragraphStyle}>
              {parseInline(s.note).map((seg, i) =>
                seg.href ? (
                  <a key={i} href={seg.href} target="_blank" rel="noopener" style={linkStyle}>
                    {seg.text}
                  </a>
                ) : (
                  <span key={i}>{seg.text}</span>
                ),
              )}
            </p>
            <p style={paragraphStyle}>
              Gifts:{" "}
              {s.gifts.map((g, i) => (
                <span key={g.id}>
                  {i > 0 && (s.gifts.length > 2 ? ", " : " ")}
                  {i > 0 && i === s.gifts.length - 1 && "and "}
                  <a href={`/gift/${g.id}`} onClick={openGift(g.id)} style={linkStyle}>
                    {g.label}
                  </a>
                  {preview && !live.has(g.id) && <span style={{ color: "rgba(35,20,16,0.45)" }}> (in review)</span>}
                </span>
              ))}
              .
            </p>
          </section>
        ))}
    </LegalShell>
  );
}
