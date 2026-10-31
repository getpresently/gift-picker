import { useCallback, useState } from "react";
import type { MouseEvent, ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Wordmark } from "./Wordmark";
import { SavedSheet } from "./SavedSheet";
import { useIsMobile } from "../../hooks/useIsMobile";
import { useSavedIds } from "../../data/saved";
import { track } from "../../data/analytics";

/**
 * Sticky top bar shared by every page, so the logo sits in the same spot at
 * the same size everywhere. Page-specific actions go in `children` (right side).
 * A quiet Blog text link sits before them; pages built around one task (the
 * quiz, results, the review tool) turn it off with `nav={false}`. Once the
 * shopper hearts a gift, a "3 saved" pill opens their saved gifts on every
 * page except the quiz and the review tool.
 */
export function SiteHeader({
  onLogoClick,
  children,
  nav = true,
}: {
  onLogoClick?: () => void;
  children?: ReactNode;
  nav?: boolean;
}) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const onBlog = pathname === "/blog" || pathname.startsWith("/blog/");
  const savedIds = useSavedIds();
  const [savedOpen, setSavedOpen] = useState(false);
  const closeSaved = useCallback(() => setSavedOpen(false), []);
  const showSaved = savedIds.length > 0 && !pathname.startsWith("/quiz") && !pathname.startsWith("/review");
  const goBlog = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    navigate("/blog");
  };
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(251, 241, 225, 0.82)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderBottom: "1px solid rgba(35,20,16,0.06)",
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: isMobile ? "20px 20px 14px" : "24px 56px 16px" }}>
        {/* Fixed row height: the logo must not shift with whatever sits on the right. */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            height: isMobile ? 38 : 44,
          }}
        >
          <Wordmark size={isMobile ? "md" : "lg"} onClick={onLogoClick} href={onLogoClick ? "/" : undefined} />
          {(nav || children || showSaved) && (
            <nav aria-label="Site" style={{ display: "flex", alignItems: "center", gap: isMobile ? 14 : 22, flexShrink: 0 }}>
              {showSaved && (
                <button
                  type="button"
                  aria-haspopup="dialog"
                  aria-label={`${savedIds.length} saved ${savedIds.length === 1 ? "gift" : "gifts"}`}
                  onClick={() => {
                    setSavedOpen(true);
                    track("saved_open", { count: savedIds.length });
                  }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: isMobile ? "6px 10px" : "7px 12px",
                    borderRadius: 999,
                    border: "none",
                    background: "rgba(196,71,126,0.12)",
                    color: "#C4477E",
                    fontFamily: "Geist, sans-serif",
                    fontSize: isMobile ? 12 : 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="#C4477E" aria-hidden="true">
                    <path d="M8 14s-5-3.2-5-7a3 3 0 0 1 5-2 3 3 0 0 1 5 2c0 3.8-5 7-5 7z" />
                  </svg>
                  {isMobile ? savedIds.length : `${savedIds.length} saved`}
                </button>
              )}
              {nav && !isMobile && (
                // A full page load on purpose: /gift-swap is GiftSwapper's page,
                // served by the worker from the swap app, not by this app's router.
                // Hidden on phones, where the header has no room; the homepage
                // section links there instead.
                <a
                  href="/gift-swap"
                  onClick={() => track("gift_swap_click", { from: "header" })}
                  style={{
                    fontFamily: "Geist, sans-serif",
                    fontSize: isMobile ? 14 : 15,
                    fontWeight: 500,
                    color: "rgba(35,20,16,0.62)",
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  Gift swap
                </a>
              )}
              {nav && (
                <a
                  href="/blog"
                  onClick={goBlog}
                  aria-current={onBlog ? "page" : undefined}
                  style={{
                    fontFamily: "Geist, sans-serif",
                    fontSize: isMobile ? 14 : 15,
                    fontWeight: onBlog ? 600 : 500,
                    color: onBlog ? "#231410" : "rgba(35,20,16,0.62)",
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  Blog
                </a>
              )}
              {children}
            </nav>
          )}
          {savedOpen && <SavedSheet onClose={closeSaved} />}
        </div>
      </div>
    </header>
  );
}
