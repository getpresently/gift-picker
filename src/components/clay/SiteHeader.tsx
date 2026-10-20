import type { MouseEvent, ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Wordmark } from "./Wordmark";
import { useIsMobile } from "../../hooks/useIsMobile";

/**
 * Sticky top bar shared by every page, so the logo sits in the same spot at
 * the same size everywhere. Page-specific actions go in `children` (right side).
 * A quiet Blog text link sits before them; pages built around one task (the
 * quiz, results, the review tool) turn it off with `nav={false}`.
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
          {(nav || children) && (
            <nav aria-label="Site" style={{ display: "flex", alignItems: "center", gap: isMobile ? 14 : 22, flexShrink: 0 }}>
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
        </div>
      </div>
    </header>
  );
}
