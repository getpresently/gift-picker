import { Fragment, useEffect, useMemo, useState } from "react";
import type { CSSProperties, MouseEvent, ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AmbientGlow } from "./clay/AmbientGlow";
import { ClaySurface } from "./clay/ClaySurface";
import { Pillow } from "./clay/Pillow";
import { SiteHeader } from "./clay/SiteHeader";
import { FooterBrand } from "./clay/FooterBrand";
import { FooterLinks } from "./clay/FooterLinks";
import { AffiliateDisclosure } from "./clay/AffiliateDisclosure";
import { GiftCard } from "./clay/GiftCard";
import { useIsMobile } from "../hooks/useIsMobile";
import { useImageFallback } from "../hooks/useImageFallback";
import { useGifts } from "../data/giftsApi";
import { track } from "../data/analytics";
import { loadSaved, saveSaved } from "../data/saved";
import { SECONDARY_TONES, type Gift } from "../data/gifts";
import { findPost, formatPostDate, isPendingGift, parseInline, postGiftIds, POSTS, postTitleTag, relatedPosts, segmentHref, type Post } from "../data/posts";

/**
 * The blog: an index at /blog and one page per post at /blog/:slug, with the
 * posts themselves in src/data/posts.ts. Gift mentions link to /gift/:id and
 * render as the usual gift cards. The worker prerenders title, meta, JSON-LD,
 * and a static copy of each post for crawlers (workers-site/index.js).
 */

const SERIF = '"Instrument Serif", serif';
const SANS = "Geist, sans-serif";
const INK = "#231410";
const ACCENT = "#C4477E";
const DIM = "rgba(35,20,16,0.55)";

const LINK: CSSProperties = { color: ACCENT, textDecoration: "underline", textUnderlineOffset: 3 };

/** Live gifts by ID. `live` is null while loading or after a failed load, when links stay as written. */
function useGiftIndex() {
  const { data, loading, error } = useGifts();
  return useMemo(() => {
    const byId = new Map(data.map((g) => [g.id, g]));
    return { byId, loading, live: loading || error ? null : new Set(byId.keys()) };
  }, [data, loading, error]);
}

/** A real link (crawlable, opens in a new tab with a modifier key) that routes in-app on a plain click. */
function AppLink({ to, children, style, onClick }: { to: string; children: ReactNode; style?: CSSProperties; onClick?: () => void }) {
  const navigate = useNavigate();
  const go = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    onClick?.();
    navigate(to);
  };
  return (
    <a href={to} onClick={go} style={style}>
      {children}
    </a>
  );
}

/** Post text with its [label](href) links. A gift link whose gift is no longer live reads as plain text. */
function RichText({ text, live, slug }: { text: string; live: Set<string> | null; slug: string }) {
  return (
    <>
      {parseInline(text).map((s, i) => {
        const href = segmentHref(s, live);
        if (!href) return <Fragment key={i}>{s.text}</Fragment>;
        if (!href.startsWith("/")) {
          return (
            <a key={i} href={href} target="_blank" rel="noopener" style={LINK}>
              {s.text}
            </a>
          );
        }
        const giftId = s.giftId;
        return (
          <AppLink
            key={i}
            to={href}
            style={LINK}
            onClick={giftId ? () => track("blog_gift_open", { slug, gift_id: giftId, from: "text" }) : undefined}
          >
            {s.text}
          </AppLink>
        );
      })}
    </>
  );
}

/** Header, glow, and footer shared by the index and the post pages. */
function BlogShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  return (
    <div style={{ background: "#FBF1E1", minHeight: "100vh", position: "relative" }}>
      <div style={{ position: "relative", minHeight: "100vh" }}>
        <AmbientGlow variant="results" />

        <SiteHeader onLogoClick={() => navigate("/")}>
          <Pillow tone="coral" size="sm" href="/quiz" onClick={() => navigate("/quiz")}>
            Find a gift →
          </Pillow>
        </SiteHeader>

        <div
          style={{
            position: "relative",
            zIndex: 1,
            padding: isMobile ? "28px 20px 48px" : "48px 56px 64px",
            maxWidth: 980,
            margin: "0 auto",
          }}
        >
          <main>
          {children}

          </main>
          <footer
            style={{
              marginTop: isMobile ? 40 : 56,
              paddingTop: 24,
              borderTop: "1px solid rgba(35,20,16,0.08)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <FooterBrand />
            <FooterLinks />
            <AffiliateDisclosure />
          </footer>
        </div>
      </div>
    </div>
  );
}

function Thumb({ gift, size }: { gift?: Gift; size: number }) {
  const { failed, onError } = useImageFallback(gift?.image);
  return (
    <div
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: 14,
        overflow: "hidden",
        background: "linear-gradient(160deg, #FFE9A8, #F7C76A)",
        boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.04)",
      }}
    >
      {gift?.image && !failed && (
        <img src={gift.image} alt={gift.brand ? `${gift.name} by ${gift.brand}` : gift.name} onError={onError} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      )}
    </div>
  );
}

/** Three photos from the gifts a post recommends, for its card on /blog. */
function PostThumbs({ post, byId, size }: { post: Post; byId: Map<string, Gift>; size: number }) {
  const gifts = postGiftIds(post)
    .map((id) => byId.get(id))
    .filter((g): g is Gift => !!g?.image)
    .slice(0, 3);
  return (
    <div style={{ display: "flex", gap: 8 }}>
      {[0, 1, 2].map((i) => (
        <Thumb key={gifts[i]?.id ?? i} gift={gifts[i]} size={size} />
      ))}
    </div>
  );
}

export function BlogIndex() {
  const isMobile = useIsMobile();
  const { byId } = useGiftIndex();

  useEffect(() => {
    document.title = "Gift guides · GiftPicker";
  }, []);

  return (
    <BlogShell>
      <div style={{ maxWidth: 680, marginBottom: isMobile ? 28 : 40 }}>
        <h1
          style={{
            fontFamily: SERIF,
            fontWeight: 400,
            fontSize: isMobile ? 44 : 60,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            color: INK,
            margin: 0,
          }}
        >
          Gift guides
        </h1>
        <p style={{ fontFamily: SANS, fontSize: isMobile ? 16 : 18, lineHeight: 1.6, color: "rgba(35,20,16,0.68)", margin: "14px 0 0" }}>
          Practical advice for choosing a gift, with picks from the GiftPicker catalog.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 16 : 20 }}>
        {POSTS.map((post) => (
          <AppLink key={post.slug} to={`/blog/${post.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
            <ClaySurface
              tint="cream"
              style={{
                padding: isMobile ? 18 : "26px 28px",
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                alignItems: isMobile ? "stretch" : "center",
                gap: isMobile ? 14 : 28,
              }}
            >
              {isMobile && <PostThumbs post={post} byId={byId} size={72} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: SANS, fontSize: 12, color: DIM }}>{formatPostDate(post.published)}</div>
                <h2
                  style={{
                    fontFamily: SERIF,
                    fontWeight: 400,
                    fontSize: isMobile ? 26 : 32,
                    lineHeight: 1.12,
                    letterSpacing: "-0.015em",
                    color: INK,
                    margin: "6px 0 8px",
                  }}
                >
                  {post.title}
                </h2>
                <p style={{ fontFamily: SANS, fontSize: 15, lineHeight: 1.55, color: "rgba(35,20,16,0.68)", margin: 0 }}>
                  {post.description}
                </p>
                <div style={{ fontFamily: SANS, fontSize: 14, fontWeight: 600, color: ACCENT, marginTop: 12 }}>Read the guide →</div>
              </div>
              {!isMobile && <PostThumbs post={post} byId={byId} size={96} />}
            </ClaySurface>
          </AppLink>
        ))}
      </div>
    </BlogShell>
  );
}

/** Desktop columns for a card row: up to four, laid out so the last row isn't a lone card. */
function rowColumns(count: number): number {
  if (count <= 4) return count;
  return count % 4 === 0 || count % 4 === 3 ? 4 : 3;
}

/** A post's card row: up to four across on desktop, two on phones. */
function GiftRow({
  ids,
  slug,
  byId,
  loading,
  saved,
  onToggleSave,
}: {
  ids: string[];
  slug: string;
  byId: Map<string, Gift>;
  loading: boolean;
  saved: Set<string>;
  onToggleSave: (id: string) => void;
}) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  // Every gift that is live gets a card, including pending ones Dalia has since
  // approved; while loading, only established gifts get a placeholder tile.
  const gifts = ids.map((id) => byId.get(id)).filter((g): g is Gift => !!g);
  const settled = ids.filter((id) => !isPendingGift(id));
  const count = loading ? settled.length : gifts.length;
  if (!count) return null;
  const cols = isMobile ? 2 : rowColumns(count);
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        gap: isMobile ? 12 : 16,
        // Cards keep a gift-card width, so a row of four steps out past the text column.
        maxWidth: isMobile ? undefined : cols * 216 + (cols - 1) * 16,
        margin: isMobile ? "20px 0 28px" : "24px auto 36px",
      }}
    >
      {loading
        ? settled.map((id) => (
            <ClaySurface key={id} tint="cream" style={{ padding: 16 }}>
              <div style={{ aspectRatio: "1/1", borderRadius: 16, background: "linear-gradient(160deg, #FBF1E1, #E8D7B8)" }} />
              <div style={{ height: 52 }} />
            </ClaySurface>
          ))
        : gifts.map((g, i) => (
            <GiftCard
              key={g.id}
              gift={g}
              tone={SECONDARY_TONES[i % SECONDARY_TONES.length]}
              saved={saved.has(g.id)}
              onToggleSave={onToggleSave}
              isMobile={isMobile}
              href={`/gift/${g.id}`}
              onOpenDetails={() => {
                track("blog_gift_open", { slug, gift_id: g.id, from: "card" });
                navigate(`/gift/${g.id}`);
              }}
            />
          ))}
    </div>
  );
}

export function BlogPostPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const post = findPost(slug);
  const { byId, loading, live } = useGiftIndex();

  useEffect(() => {
    document.title = post ? postTitleTag(post) : "Article not found · GiftPicker";
  }, [post]);

  return <BlogPostView post={post} byId={byId} loading={loading} live={live} />;
}

/**
 * A post page drawn from its data, with no fetching of its own, so
 * scripts/check-posts.mjs can render every post against the live catalog.
 */
export function BlogPostView({
  post,
  byId,
  loading,
  live,
}: {
  post: Post | undefined;
  byId: Map<string, Gift>;
  loading: boolean;
  live: Set<string> | null;
}) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [saved, setSaved] = useState<Set<string>>(() => loadSaved());
  const toggleSave = (id: string) => {
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveSaved(next);
      track("gift_save_toggle", { gift_id: id, saved: next.has(id), source: "blog" });
      return next;
    });
  };

  if (!post) {
    return (
      <BlogShell>
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <h1 style={{ fontFamily: SERIF, fontSize: isMobile ? 32 : 44, fontWeight: 400, color: INK, margin: "0 0 12px" }}>
            We couldn't find that article.
          </h1>
          <p style={{ fontFamily: SANS, fontSize: 15, color: "rgba(35,20,16,0.6)", margin: "0 0 24px" }}>
            It may have moved. The rest of our gift guides are one click away.
          </p>
          <Pillow tone="coral" size="lg" href="/blog" onClick={() => navigate("/blog")}>
            See all gift guides
          </Pillow>
        </div>
      </BlogShell>
    );
  }

  const text: CSSProperties = {
    fontFamily: SANS,
    fontSize: isMobile ? 16 : 17,
    lineHeight: 1.7,
    color: "rgba(35,20,16,0.8)",
    margin: "0 0 18px",
  };
  const others = relatedPosts(post);

  return (
    <BlogShell>
      <article>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <AppLink to="/blog" style={{ fontFamily: SANS, fontSize: 13, color: DIM, textDecoration: "none" }}>
            ← All gift guides
          </AppLink>
          <h1
            style={{
              fontFamily: SERIF,
              fontWeight: 400,
              fontSize: isMobile ? 38 : 54,
              lineHeight: 1.06,
              letterSpacing: "-0.02em",
              color: INK,
              margin: isMobile ? "16px 0 12px" : "20px 0 14px",
              textWrap: "balance" as never,
            }}
          >
            {post.title}
          </h1>
          <div style={{ fontFamily: SANS, fontSize: 13, color: DIM, marginBottom: isMobile ? 22 : 30 }}>
            By GiftPicker · <time dateTime={post.published}>{formatPostDate(post.published)}</time>
            {post.updated && post.updated !== post.published && (
              <>
                {" "}· Updated <time dateTime={post.updated}>{formatPostDate(post.updated)}</time>
              </>
            )}
          </div>
          {post.intro.map((p, i) => (
            <p key={i} style={{ ...text, fontSize: isMobile ? 18 : 20, lineHeight: 1.6, color: "rgba(35,20,16,0.78)" }}>
              <RichText text={p} live={live} slug={post.slug} />
            </p>
          ))}
        </div>

        {post.body.map((b, i) => {
          if (b.kind === "gifts") {
            return (
              <GiftRow key={i} ids={b.ids} slug={post.slug} byId={byId} loading={loading} saved={saved} onToggleSave={toggleSave} />
            );
          }
          return (
            <div key={i} style={{ maxWidth: 680, margin: "0 auto" }}>
              {b.kind === "h2" && (
                <h2
                  style={{
                    fontFamily: SERIF,
                    fontWeight: 400,
                    fontSize: isMobile ? 28 : 34,
                    lineHeight: 1.12,
                    letterSpacing: "-0.015em",
                    color: INK,
                    margin: isMobile ? "30px 0 12px" : "40px 0 14px",
                  }}
                >
                  {b.text}
                </h2>
              )}
              {b.kind === "p" && (
                <p style={text}>
                  <RichText text={b.text} live={live} slug={post.slug} />
                </p>
              )}
              {b.kind === "list" && (
                <ul style={{ ...text, listStyle: "disc", paddingLeft: 22 }}>
                  {b.items.map((item, j) => (
                    <li key={j} style={{ marginBottom: 8, paddingLeft: 4 }}>
                      <RichText text={item} live={live} slug={post.slug} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}

        <ClaySurface
          tint="rose"
          style={{
            maxWidth: 680,
            margin: isMobile ? "36px auto 0" : "48px auto 0",
            padding: isMobile ? "24px 20px" : "32px 36px",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontFamily: SERIF,
              fontSize: isMobile ? 24 : 28,
              lineHeight: 1.25,
              color: INK,
              margin: "0 auto 18px",
              maxWidth: 520,
              textWrap: "balance" as never,
            }}
          >
            {post.cta}
          </p>
          <Pillow
            tone="coral"
            size="lg"
            href="/quiz"
            onClick={() => {
              track("blog_quiz_click", { slug: post.slug });
              navigate("/quiz");
            }}
          >
            Take the quiz →
          </Pillow>
        </ClaySurface>
      </article>

      {others.length > 0 && (
        <section style={{ maxWidth: 680, margin: isMobile ? "44px auto 0" : "60px auto 0" }}>
          <div
            style={{
              fontFamily: SANS,
              fontSize: 12,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(35,20,16,0.5)",
              marginBottom: 14,
            }}
          >
            More gift guides
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {others.map((p) => (
              <AppLink
                key={p.slug}
                to={`/blog/${p.slug}`}
                style={{ fontFamily: SERIF, fontSize: isMobile ? 21 : 24, lineHeight: 1.25, color: INK, textDecoration: "none" }}
              >
                {p.title} <span style={{ color: ACCENT }}>→</span>
              </AppLink>
            ))}
          </div>
        </section>
      )}
    </BlogShell>
  );
}
