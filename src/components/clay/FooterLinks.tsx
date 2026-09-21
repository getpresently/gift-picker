import { Fragment } from "react";
import { useNavigate } from "react-router-dom";

const LINKS: { label: string; to: string }[] = [
  { label: "For brands", to: "/brands" },
  { label: "Privacy", to: "/privacy" },
  { label: "Terms", to: "/terms" },
];

export function FooterLinks() {
  const navigate = useNavigate();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {LINKS.map((l, i) => (
        <Fragment key={l.to}>
          {i > 0 && (
            <span aria-hidden style={{ fontFamily: "Geist, sans-serif", fontSize: 11, color: "rgba(35,20,16,0.35)" }}>
              ·
            </span>
          )}
          <a
            href={l.to}
            onClick={(e) => {
              e.preventDefault();
              navigate(l.to);
            }}
            onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
            onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
            style={{
              fontFamily: "Geist, sans-serif",
              fontSize: 11,
              color: "rgba(35,20,16,0.62)",
              textDecoration: "none",
              textUnderlineOffset: 3,
            }}
          >
            {l.label}
          </a>
        </Fragment>
      ))}
    </div>
  );
}
