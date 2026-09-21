import type { ReactNode } from "react";
import { Wordmark } from "./Wordmark";
import { useIsMobile } from "../../hooks/useIsMobile";

/**
 * Sticky top bar shared by every page, so the logo sits in the same spot at
 * the same size everywhere. Page-specific actions go in `children` (right side).
 */
export function SiteHeader({ onLogoClick, children }: { onLogoClick?: () => void; children?: ReactNode }) {
  const isMobile = useIsMobile();
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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          maxWidth: 1280,
          margin: "0 auto",
          padding: isMobile ? "20px 20px 14px" : "24px 56px 16px",
          minHeight: isMobile ? 36 : 44,
        }}
      >
        <Wordmark size={isMobile ? "md" : "lg"} onClick={onLogoClick} />
        {children && <div style={{ display: "flex", alignItems: "center", gap: 12 }}>{children}</div>}
      </div>
    </header>
  );
}
