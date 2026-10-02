import { useId, useState, type FormEvent } from "react";
import { Pillow } from "./Pillow";
import { postNotify } from "../../data/feedback";
import { track } from "../../data/analytics";
import type { Answers } from "../../data/questions";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Optional one-line email capture shown after a shopper taps "Request more".
 * The request itself is already sent; this only attaches an address so we can
 * send one note when gifts for it are added.
 */
export function NotifyOptIn({ answers, align = "center" }: { answers: Answers; align?: "center" | "flex-start" }) {
  const inputId = useId();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const valid = EMAIL_RE.test(email.trim());

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!valid || sent) return;
    setSent(true);
    track("request_notify_optin");
    void postNotify(answers, email);
  };

  const small = { fontFamily: "Geist, sans-serif", fontSize: 12.5, color: "rgba(35,20,16,0.5)", margin: 0 } as const;

  if (sent) {
    return (
      <p style={{ ...small, fontSize: 14, color: "rgba(35,20,16,0.65)", textAlign: align === "center" ? "center" : "left" }}>
        ✓ We'll email you once when they're added.
      </p>
    );
  }

  return (
    <form
      onSubmit={submit}
      style={{ display: "flex", flexDirection: "column", alignItems: align, gap: 8, maxWidth: 420, margin: align === "center" ? "0 auto" : 0 }}
    >
      <label htmlFor={inputId} style={{ fontFamily: "Geist, sans-serif", fontSize: 14, color: "rgba(35,20,16,0.7)" }}>
        Want a heads-up when they're in?
      </label>
      <div style={{ display: "flex", gap: 8, width: "100%" }}>
        <input
          id={inputId}
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          maxLength={254}
          style={{
            flex: 1,
            minWidth: 0,
            boxSizing: "border-box",
            padding: "10px 14px",
            borderRadius: 12,
            border: "none",
            background: "rgba(35,20,16,0.05)",
            boxShadow: "inset 0 0 0 1.5px rgba(35,20,16,0.1)",
            fontFamily: "Geist, sans-serif",
            fontSize: 14,
            color: "#231410",
            outline: "none",
          }}
        />
        <Pillow tone="ink" size="sm" type="submit" disabled={!valid}>
          Notify me
        </Pillow>
      </div>
      <p style={small}>One email when we add them. Nothing else.</p>
    </form>
  );
}
