import { useEffect, useMemo, useState } from "react";
import type { FormEvent, MouseEvent } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Pillow } from "./Pillow";
import { PriceDisplay } from "./PriceDisplay";
import { buyLinkProps } from "./BuyButtons";
import { useImageFallback } from "../../hooks/useImageFallback";
import { useIsMobile } from "../../hooks/useIsMobile";
import { useGifts } from "../../data/giftsApi";
import type { Gift } from "../../data/gifts";
import { primaryBuy } from "../../data/affiliate";
import { toggleSaved, useSavedIds } from "../../data/saved";
import { emailSavedList, isValidEmail, type EmailListResult } from "../../data/emailList";
import { getClientId } from "../../data/feedback";
import { track } from "../../data/analytics";

const SERIF = '"Instrument Serif", serif';
const SANS = "Geist, sans-serif";
const INK = "#231410";
const DIM = "rgba(35,20,16,0.6)";
const PINK = "#C4477E";

function Thumb({ gift }: { gift: Gift }) {
  const { failed, onError, loaded, onLoad } = useImageFallback(gift.image);
  return (
    <div style={{ width: 64, height: 64, flexShrink: 0, borderRadius: 14, overflow: "hidden", background: "linear-gradient(160deg, #FBF1E1, #E8D7B8)" }}>
      {gift.image && !failed && (
        <img
          key={gift.image}
          src={gift.image}
          alt=""
          onError={onError}
          onLoad={onLoad}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: loaded ? 1 : 0, transition: "opacity 200ms ease" }}
        />
      )}
    </div>
  );
}

function SavedRow({ gift, onOpen }: { gift: Gift; onOpen: (id: string) => void }) {
  const buy = primaryBuy(gift);
  const link = buy.url ? buyLinkProps(gift, buy.url, buy.destination, "saved") : null;
  const open = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    onOpen(gift.id);
  };
  return (
    <li style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderTop: "1px solid rgba(35,20,16,0.07)" }}>
      <Thumb gift={gift} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: SANS, fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: DIM }}>{gift.brand}</div>
        <a
          href={`/gift/${gift.id}`}
          onClick={open}
          style={{ display: "block", fontFamily: SANS, fontSize: 15, fontWeight: 600, color: INK, textDecoration: "none", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
        >
          {gift.name}
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
          <PriceDisplay gift={gift} variant="card" />
          {link && (
            <a
              href={link.href}
              target="_blank"
              rel={link.rel}
              onClick={() => link.onClick()}
              style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: PINK, textDecoration: "none" }}
            >
              Buy →
            </a>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={() => {
          toggleSaved(gift.id);
          track("saved_remove", { gift_id: gift.id });
        }}
        aria-label={`Remove ${gift.name} from saved`}
        style={{ width: 36, height: 36, flexShrink: 0, borderRadius: "50%", border: "none", background: "rgba(230,75,69,0.1)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="#E64B45" stroke="#E64B45" strokeWidth={1.6} aria-hidden="true">
          <path d="M8 14s-5-3.2-5-7a3 3 0 0 1 5-2 3 3 0 0 1 5 2c0 3.8-5 7-5 7z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </li>
  );
}

function EmailForm({ ids }: { ids: string[] }) {
  const [email, setEmail] = useState("");
  const [optIn, setOptIn] = useState(false);
  const [hp, setHp] = useState("");
  const [state, setState] = useState<"idle" | "sending" | EmailListResult>("idle");
  const valid = isValidEmail(email);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!valid || state === "sending") return;
    setState("sending");
    const result = await emailSavedList(email, ids, optIn, getClientId(), hp);
    setState(result);
    if (result === "sent") track("saved_email_sent", { gifts: ids.length, opt_in: optIn });
  };

  if (state === "sent") {
    return (
      <p style={{ fontFamily: SANS, fontSize: 14, lineHeight: 1.5, color: INK, margin: 0 }}>
        Sent to <strong>{email.trim()}</strong>. It should be in your inbox in a minute.
      </p>
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      <label htmlFor="saved-email" style={{ display: "block", fontFamily: SERIF, fontSize: 22, color: INK, marginBottom: 10 }}>
        Email this list to yourself
      </label>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input
          id="saved-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (state !== "idle" && state !== "sending") setState("idle");
          }}
          style={{
            flex: "1 1 200px",
            minWidth: 0,
            fontFamily: SANS,
            fontSize: 15,
            padding: "12px 14px",
            borderRadius: 14,
            border: "1px solid rgba(35,20,16,0.15)",
            background: "rgba(255,255,255,0.85)",
            color: INK,
            outline: "none",
          }}
        />
        {/* Honeypot for bots; people never see it. */}
        <input type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" value={hp} onChange={(e) => setHp(e.target.value)} style={{ position: "absolute", left: -9999, width: 1, height: 1, opacity: 0 }} />
        <Pillow tone="coral" size="md" type="submit" disabled={!valid || state === "sending"}>
          {state === "sending" ? "Sending…" : "Email my list"}
        </Pillow>
      </div>
      <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, fontFamily: SANS, fontSize: 13, color: DIM, cursor: "pointer" }}>
        <input type="checkbox" checked={optIn} onChange={(e) => setOptIn(e.target.checked)} style={{ width: 16, height: 16, accentColor: PINK }} />
        Also send me gift ideas now and then
      </label>
      {state === "limit" && (
        <p role="alert" style={{ fontFamily: SANS, fontSize: 13, color: PINK, margin: "10px 0 0" }}>
          That's a lot of emails in a short time. Try again in an hour.
        </p>
      )}
      {state === "error" && (
        <p role="alert" style={{ fontFamily: SANS, fontSize: 13, color: PINK, margin: "10px 0 0" }}>
          We couldn't send it just now. Please try again in a minute.
        </p>
      )}
      <p style={{ fontFamily: SANS, fontSize: 12, color: "rgba(35,20,16,0.45)", margin: "10px 0 0" }}>
        We use your email to send this list{optIn ? " and the occasional gift idea" : ""}. See our{" "}
        <a href="/privacy" style={{ color: "inherit" }}>
          privacy policy
        </a>
        .
      </p>
    </form>
  );
}

/**
 * The saved-gifts sheet opened from the header: every hearted gift on this
 * device, newest first, with a buy link and a heart to remove it, and a form
 * that emails the list to the shopper.
 */
export function SavedSheet({ onClose }: { onClose: () => void }) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const ids = useSavedIds();
  const { data, loading } = useGifts();
  const byId = useMemo(() => new Map(data.map((g) => [g.id, g])), [data]);
  const gifts = ids.map((id) => byId.get(id)).filter((g): g is Gift => !!g);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const openGift = (id: string) => {
    onClose();
    navigate(`/gift/${id}`);
  };

  return createPortal(
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Saved gifts"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(35,20,16,0.38)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        alignItems: isMobile ? "flex-end" : "center",
        justifyContent: "center",
        padding: isMobile ? 0 : 24,
        animation: "fbFade 180ms ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 560,
          maxHeight: isMobile ? "92vh" : "88vh",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(160deg, #FFFCF5 0%, #FBF1E1 100%)",
          borderRadius: isMobile ? "24px 24px 0 0" : 24,
          boxShadow: "inset 0 1.2px 0 rgba(255,255,255,0.8), 0 40px 80px -20px rgba(30,15,10,0.5)",
          overflow: "hidden",
          animation: isMobile ? "fbSheetUp 260ms cubic-bezier(.22,1.4,.4,1)" : "fbPop 220ms cubic-bezier(.22,1.4,.4,1)",
        }}
      >
        <div style={{ padding: isMobile ? "20px 20px 6px" : "26px 28px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ margin: 0, fontFamily: SERIF, fontWeight: 400, fontSize: isMobile ? 28 : 32, color: INK }}>
            Saved gifts{gifts.length > 0 && <span style={{ color: DIM }}> ({gifts.length})</span>}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{ width: 34, height: 34, borderRadius: "50%", border: "none", background: "rgba(35,20,16,0.06)", cursor: "pointer", fontSize: 18, color: INK }}
          >
            ×
          </button>
        </div>

        <div style={{ flex: "1 1 auto", minHeight: 0, overflowY: "auto", padding: isMobile ? "0 20px" : "0 28px" }}>
          {loading ? (
            <p style={{ fontFamily: SANS, fontSize: 14, color: DIM }}>Loading your gifts…</p>
          ) : gifts.length === 0 ? (
            <p style={{ fontFamily: SANS, fontSize: 15, lineHeight: 1.6, color: DIM, margin: "8px 0 20px" }}>
              Nothing saved yet. Tap the heart on any gift to keep it here.
            </p>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {gifts.map((g) => (
                <SavedRow key={g.id} gift={g} onOpen={openGift} />
              ))}
            </ul>
          )}
        </div>

        {gifts.length > 0 && (
          <div
            style={{
              flexShrink: 0,
              padding: isMobile ? "16px 20px calc(20px + env(safe-area-inset-bottom))" : "20px 28px 28px",
              borderTop: "1px solid rgba(35,20,16,0.08)",
              background: "rgba(255,255,255,0.45)",
            }}
          >
            <EmailForm ids={gifts.map((g) => g.id)} />
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
