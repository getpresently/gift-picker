import { useEffect, useState } from "react";
import { SHOWCASE_IDS, type ShowcaseGift } from "../../data/showcase";

/** Seconds each tile takes to cross its own width. The rows differ so they drift out of step. */
const ROW_SECONDS_PER_TILE = [3.2, 4.1];

/**
 * The showcase gifts from /api/showcase. Falls back to filtering the full
 * catalog (local dev before the endpoint is deployed, or if it errors).
 */
async function loadShowcase(): Promise<ShowcaseGift[]> {
  try {
    const r = await fetch("/api/showcase");
    if (r.ok && (r.headers.get("content-type") ?? "").includes("application/json")) {
      const { gifts } = (await r.json()) as { gifts?: ShowcaseGift[] };
      if (Array.isArray(gifts) && gifts.length) return gifts;
    }
  } catch {
    // fall through to the full catalog
  }
  const r = await fetch("/api/gifts");
  const { data } = (await r.json()) as { data?: Record<string, unknown>[] };
  const byId = new Map((data ?? []).map((row) => [String(row.row_id ?? ""), row]));
  return SHOWCASE_IDS.flatMap((id) => {
    const row = byId.get(id);
    const image = String(row?.PhotoAddress ?? "");
    return row && image ? [{ id, name: String(row.Gift ?? ""), brand: String(row.Brand ?? ""), image }] : [];
  });
}

/**
 * One photo tile. It shows the small copy in public/showcase (made by
 * scripts/make-showcase-images.py) and falls back to the brand's own photo,
 * then hides itself if neither loads. Tiles are pictures only: the section's
 * buttons lead to the quiz and the gift guides.
 */
function Tile({ gift, size, hidden, eager }: { gift: ShowcaseGift; size: number; hidden?: boolean; eager?: boolean }) {
  const [src, setSrc] = useState(`/showcase/${gift.id}.webp`);
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <div
      style={{
        flexShrink: 0,
        width: size,
        height: size,
        marginRight: 14,
        borderRadius: 22,
        overflow: "hidden",
        background: "#FFF8EE",
        boxShadow: "0 16px 30px -18px rgba(90,20,20,0.45), 0 4px 10px -6px rgba(90,20,20,0.25)",
      }}
    >
      <img
        src={src}
        alt={hidden ? "" : gift.brand ? `${gift.name} by ${gift.brand}` : gift.name}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        onError={() => (src === gift.image ? setFailed(true) : setSrc(gift.image))}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
    </div>
  );
}

function Row({ gifts, size, row }: { gifts: ShowcaseGift[]; size: number; row: number }) {
  const seconds = gifts.length * ROW_SECONDS_PER_TILE[row];
  return (
    <div
      className="gift-marquee"
      style={{
        display: "flex",
        width: "max-content",
        animationDuration: `${seconds}s`,
        // Start the second row partway through its loop so the two rows never line up.
        animationDelay: row ? `-${seconds * 0.37}s` : undefined,
        marginLeft: row ? -size / 2 : 0,
      }}
    >
      {gifts.map((g, i) => (
        <Tile key={g.id} gift={g} size={size} eager={i < 10} />
      ))}
      {/* The same tiles again, so the loop has no seam. Hidden from screen readers. */}
      {gifts.map((g) => (
        <Tile key={`${g.id}-loop`} gift={g} size={size} hidden />
      ))}
    </div>
  );
}

/**
 * Two full-width rows of gift photos drifting slowly left on a loop, out of
 * step with each other. Hovering pauses them; with reduced motion they are
 * still rows you can scroll (styles in index.css). The gifts alternate
 * between the rows, so neighbors in SHOWCASE_IDS never sit side by side.
 */
export function GiftCarousel({ isMobile }: { isMobile: boolean }) {
  const [gifts, setGifts] = useState<ShowcaseGift[]>([]);
  useEffect(() => {
    let cancelled = false;
    loadShowcase()
      .then((g) => {
        if (!cancelled) setGifts(g);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const size = isMobile ? 104 : 148;
  const rows = [gifts.filter((_, i) => i % 2 === 0), gifts.filter((_, i) => i % 2 === 1)];
  return (
    <div
      className="gift-marquee-wrap"
      aria-label="A few gifts from the GiftPicker catalog"
      style={{
        // Full bleed: break out of the page column to the window edges.
        width: "100vw",
        marginLeft: "calc(50% - 50vw)",
        minHeight: size * 2 + 14 + 24,
        padding: "12px 0",
        overflow: "hidden",
        display: "grid",
        rowGap: 14,
        WebkitMaskImage: "linear-gradient(to right, transparent, #000 7%, #000 93%, transparent)",
        maskImage: "linear-gradient(to right, transparent, #000 7%, #000 93%, transparent)",
      }}
    >
      {gifts.length > 0 && rows.map((r, i) => <Row key={i} gifts={r} size={size} row={i} />)}
    </div>
  );
}
