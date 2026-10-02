import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { AmbientGlow } from "./clay/AmbientGlow";
import { ClaySurface } from "./clay/ClaySurface";
import { GiftBox3D } from "./clay/GiftBox3D";
import { Pillow } from "./clay/Pillow";
import { PriceDisplay } from "./clay/PriceDisplay";
import { useNavigate } from "react-router-dom";
import { SiteHeader } from "./clay/SiteHeader";
import { useImageFallback } from "../hooks/useImageFallback";
import { useIsMobile } from "../hooks/useIsMobile";
import { buildMatcher } from "../data/similarity";
import type { SimilarityResult } from "../data/similarity";
import {
  setReviewRow,
  useReviewGifts,
  useReviewUnlock,
} from "../data/reviewApi";
import type { ReviewErrorCode, ReviewGift, UnlockState } from "../data/reviewApi";

/**
 * Internal, password-gated catalog review tool at /review. Dalia works
 * through the catalog one gift at a time: approve, reject, and spot
 * redundant near-duplicates via the close-matches panel.
 */

type FilterKey = "needs" | "approved" | "rejected" | "dead" | "retired" | "all";
type SortKey = "sheet" | "redundant" | "notes";
type ActionKind = "approve" | "reject" | "dead";

/** Status each action writes; approve keeps the current status. */
const ACTION_STATUS: Record<Exclude<ActionKind, "approve">, string> = { reject: "Rejected", dead: "Dead" };
const ACTION_TOAST: Record<ActionKind, string> = { approve: "Approved", reject: "Rejected", dead: "Marked dead" };
const TALLY_KEY: Record<ActionKind, keyof Tally> = { approve: "approved", reject: "rejected", dead: "dead" };

type UndoEntry = {
  rowId: string;
  giftName: string;
  action: ActionKind;
  prevStatus: string;
  prevReviewed: boolean;
  nextStatus: string;
  nextReviewed: boolean;
};

type Tally = { approved: number; rejected: number; dead: number };
type ToastState = { id: number; label: string; showUndo: boolean };
type BannerState = { text: string; reloadable: boolean };

function bannerFor(code: ReviewErrorCode): BannerState {
  return { text: errorMessage(code), reloadable: code === "row_moved" || code === "bad_row" };
}

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "needs", label: "Needs review" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "dead", label: "Dead" },
  { key: "retired", label: "Retired" },
  { key: "all", label: "All" },
];

function isLiveStatus(status: string): boolean {
  return status.trim() === "Live";
}

function matchesFilter(g: ReviewGift, filter: FilterKey): boolean {
  const status = g.status.trim();
  switch (filter) {
    case "needs":
      return !g.reviewed;
    case "approved":
      return isLiveStatus(status) && g.reviewed;
    case "rejected":
      return status === "Rejected";
    case "dead":
      return status === "Dead";
    case "retired":
      return status === "Retired";
    case "all":
    default:
      return true;
  }
}

type NoteKind = "done" | "todo" | "decide" | "other";

/** Notes written during the 9/21/26 catalog cleanup start with a verb that says what they are. */
function noteKind(text: string): NoteKind {
  const t = text.trim();
  if (/^(Added|Repaired prior suggestion|Retired|Auto-repaired|Model updated|Fixed|Kept)\b/i.test(t)) return "done";
  if (/^Needs fix\b/i.test(t)) return "todo";
  if (/^(Flagged|Check|User-submitted)\b/i.test(t)) return "decide";
  return "other";
}

const isOpenNote = (text?: string) => !!text && noteKind(text) !== "done";

function computeVisibleIds(
  gifts: ReviewGift[],
  filter: FilterKey,
  searchLower: string,
  sortKey: SortKey,
  matcher: (rowId: string) => SimilarityResult,
): string[] {
  let list = gifts.filter((g) => matchesFilter(g, filter));
  if (searchLower) {
    list = list.filter(
      (g) => g.name.toLowerCase().includes(searchLower) || g.brand.toLowerCase().includes(searchLower),
    );
  }
  if (filter === "needs" && sortKey === "sheet") {
    // Live gifts are what shoppers see, so they lead the queue.
    list = [...list.filter((g) => isLiveStatus(g.status)), ...list.filter((g) => !isLiveStatus(g.status))];
  } else if (sortKey === "redundant") {
    list = [...list].sort((a, b) => {
      const ra = matcher(a.id);
      const rb = matcher(b.id);
      if (rb.count !== ra.count) return rb.count - ra.count;
      const sa = ra.top[0]?.score ?? 0;
      const sb = rb.top[0]?.score ?? 0;
      return sb - sa;
    });
  } else if (sortKey === "notes") {
    const withNotes = list.filter((g) => isOpenNote(g.feedback));
    const withoutNotes = list.filter((g) => !isOpenNote(g.feedback));
    list = [...withNotes, ...withoutNotes];
  }
  return list.map((g) => g.id);
}

function errorMessage(code: ReviewErrorCode): string {
  switch (code) {
    case "row_moved":
      return "This row changed underneath us. Reload the page to keep going.";
    case "bad_row":
      return "That row couldn't be found. Reload the page to keep going.";
    case "bad_value":
      return "That change wasn't accepted by the server.";
    case "unauthorized":
      return "That password stopped working. Lock and unlock again.";
    case "not_configured":
      return "The review password isn't set up on the server yet.";
    case "endpoint_missing":
      return "The review endpoint isn't set up yet. Update the Apps Script with the review handler, then try again.";
    case "network":
    default:
      return "Couldn't reach the server. Check your connection and try again.";
  }
}

/* ------------------------------------------------------------------ *
 * Shared style bits
 * ------------------------------------------------------------------ */

const chipBase: CSSProperties = {
  display: "inline-block",
  padding: "4px 10px",
  borderRadius: 999,
  fontFamily: "Geist, sans-serif",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.02em",
};

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  Live: { bg: "rgba(93,168,110,0.18)", fg: "#2F6B3B" },
  Retired: { bg: "rgba(240,181,82,0.22)", fg: "#8A5A15" },
  Rejected: { bg: "rgba(224,82,76,0.16)", fg: "#A82E2A" },
  Dead: { bg: "rgba(35,20,16,0.08)", fg: "rgba(35,20,16,0.55)" },
  OOS: { bg: "rgba(154,90,140,0.18)", fg: "#6E3563" },
  Draft: { bg: "rgba(35,20,16,0.05)", fg: "rgba(35,20,16,0.45)" },
};

function StatusChip({ status }: { status: string }) {
  const key = status.trim();
  const c = STATUS_COLORS[key] ?? STATUS_COLORS.Draft;
  return <span style={{ ...chipBase, background: c.bg, color: c.fg }}>{key || "Unknown"}</span>;
}

function ReviewChip({ reviewed }: { reviewed: boolean }) {
  const c = reviewed ? STATUS_COLORS.Live : STATUS_COLORS.Retired;
  return <span style={{ ...chipBase, background: c.bg, color: c.fg }}>{reviewed ? "Reviewed" : "Needs review"}</span>;
}

const plainLinkStyle: CSSProperties = {
  fontFamily: "Geist, sans-serif",
  fontSize: 13,
  color: "rgba(35,20,16,0.65)",
  textDecoration: "underline",
  textUnderlineOffset: 3,
};

/* ------------------------------------------------------------------ *
 * Password gate
 * ------------------------------------------------------------------ */

function PasswordGate({ unlock }: { unlock: UnlockState }) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = "Review · GiftPicker";
  }, []);

  const submit = useCallback(async () => {
    const candidate = value.trim();
    if (!candidate || submitting) return;
    setSubmitting(true);
    await unlock.unlock(candidate);
    setSubmitting(false);
  }, [value, submitting, unlock]);

  const autoChecking = unlock.checking && !submitting && !value;

  return (
    <div style={{ background: "#FBF1E1", minHeight: "100vh", position: "relative" }}>
      <AmbientGlow variant="quiz" />
      <div style={{ position: "relative", zIndex: 1, minHeight: "100vh" }}>
        <SiteHeader onLogoClick={() => navigate("/")} />
        <div style={{ maxWidth: 420, margin: "0 auto", padding: isMobile ? "40px 20px" : "88px 20px" }}>
          <ClaySurface tint="cream" style={{ padding: isMobile ? 22 : 32 }}>
            <div
              style={{
                fontFamily: "Geist, sans-serif",
                fontSize: 11,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "rgba(35,20,16,0.55)",
                fontWeight: 600,
                marginBottom: 10,
              }}
            >
              Internal tool
            </div>
            <h1
              style={{
                fontFamily: '"Instrument Serif", serif',
                fontSize: 30,
                fontWeight: 400,
                margin: "0 0 8px",
                color: "#231410",
              }}
            >
              Catalog review
            </h1>
            <p
              style={{
                fontFamily: "Geist, sans-serif",
                fontSize: 14,
                color: "rgba(35,20,16,0.65)",
                lineHeight: 1.5,
                margin: "0 0 20px",
              }}
            >
              {autoChecking ? "Checking your saved session." : "Enter the review password to continue."}
            </p>
            <input
              type="password"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
              placeholder="Password"
              autoFocus
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "12px 14px",
                borderRadius: 12,
                border: "none",
                background: "rgba(35,20,16,0.05)",
                boxShadow: "inset 0 0 0 1.5px rgba(35,20,16,0.1)",
                fontFamily: "Geist, sans-serif",
                fontSize: 15,
                color: "#231410",
                outline: "none",
              }}
            />
            {unlock.error && !autoChecking && (
              <p style={{ fontFamily: "Geist, sans-serif", fontSize: 13, color: "#A82E2A", margin: "10px 0 0" }}>
                {errorMessage(unlock.error)}
              </p>
            )}
            <div style={{ marginTop: 18 }}>
              <Pillow tone="coral" size="md" fullWidth onClick={submit} disabled={submitting || !value.trim()}>
                {submitting ? "Checking…" : "Unlock"}
              </Pillow>
            </div>
          </ClaySurface>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Gift card
 * ------------------------------------------------------------------ */

function TagRow({ label, values }: { label: string; values: string[] }) {
  if (!values.length) return null;
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
      <span
        style={{
          fontFamily: "Geist, sans-serif",
          fontSize: 11,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "rgba(35,20,16,0.45)",
          fontWeight: 600,
          minWidth: 68,
          paddingTop: 4,
        }}
      >
        {label}
      </span>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, flex: 1, minWidth: 0 }}>
        {values.map((v) => (
          <span
            key={v}
            style={{
              padding: "4px 10px",
              borderRadius: 999,
              background: "rgba(35,20,16,0.06)",
              fontFamily: "Geist, sans-serif",
              fontSize: 12,
              color: "rgba(35,20,16,0.7)",
            }}
          >
            {v}
          </span>
        ))}
      </div>
    </div>
  );
}

const NOTE_STYLES: Record<NoteKind, { label: string; bg: string; ring: string; fg: string }> = {
  done: { label: "Already done", bg: "rgba(92,122,78,0.09)", ring: "rgba(92,122,78,0.22)", fg: "#3F5A33" },
  todo: { label: "Suggested fix, not done yet", bg: "rgba(230,75,69,0.08)", ring: "rgba(230,75,69,0.25)", fg: "#B23A35" },
  decide: { label: "Your call: Approve keeps it, Reject removes it", bg: "rgba(196,71,126,0.08)", ring: "rgba(196,71,126,0.2)", fg: "#C4477E" },
  other: { label: "Note", bg: "rgba(35,20,16,0.05)", ring: "rgba(35,20,16,0.12)", fg: "#5A3F36" },
};

function FeedbackNote({ text }: { text: string }) {
  const st = NOTE_STYLES[noteKind(text)];
  return (
    <div
      style={{
        padding: 14,
        borderRadius: 14,
        background: st.bg,
        boxShadow: `inset 0 0 0 1px ${st.ring}`,
      }}
    >
      <div
        style={{
          fontFamily: "Geist, sans-serif",
          fontSize: 11,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: st.fg,
          fontWeight: 600,
          marginBottom: 6,
        }}
      >
        {st.label}
      </div>
      <div style={{ fontFamily: "Geist, sans-serif", fontSize: 13, lineHeight: 1.5, color: "#231410" }}>{text}</div>
    </div>
  );
}

function GiftCard({ gift, isMobile }: { gift: ReviewGift; isMobile: boolean }) {
  const { failed, onError, loaded, onLoad } = useImageFallback(gift.image);

  return (
    <ClaySurface tint="cream" style={{ padding: isMobile ? 18 : 28, overflow: "hidden" }}>
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: isMobile ? 18 : 28 }}>
        <div style={{ width: isMobile ? "100%" : 260, flexShrink: 0 }}>
          <div
            style={{
              position: "relative",
              aspectRatio: "1/1",
              borderRadius: 18,
              overflow: "hidden",
              background: "linear-gradient(160deg, #FFE9A8, #F7C76A)",
            }}
          >
            {gift.image && !failed ? (
              <img
                key={gift.image}
                src={gift.image}
                alt={gift.name}
                onError={onError}
                onLoad={onLoad}
                style={{ opacity: loaded ? 1 : 0, transition: "opacity 160ms ease", position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <GiftBox3D size={isMobile ? 120 : 150} color="butter" rotate={-10} ribbonColor="#FF8166" />
              </div>
            )}
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <StatusChip status={gift.status} />
            <ReviewChip reviewed={gift.reviewed} />
          </div>

          {gift.brand && (
            <div
              style={{
                fontFamily: "Geist, sans-serif",
                fontSize: 11,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "rgba(35,20,16,0.55)",
                fontWeight: 600,
              }}
            >
              {gift.brand}
            </div>
          )}

          <h2
            style={{
              fontFamily: '"Instrument Serif", serif',
              fontWeight: 400,
              fontSize: isMobile ? 26 : 32,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              color: "#231410",
              margin: 0,
            }}
          >
            {gift.name}
          </h2>

          <PriceDisplay gift={gift} variant="modal" />

          {gift.feedback && <FeedbackNote text={gift.feedback} />}

          {gift.description && (
            <p style={{ fontFamily: "Geist, sans-serif", fontSize: 14, lineHeight: 1.6, color: "rgba(35,20,16,0.78)", margin: 0 }}>
              {gift.description}
            </p>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <TagRow label="Age" values={gift.ages} />
            <TagRow label="Relation" values={gift.relations} />
            <TagRow label="Type" values={gift.types} />
            <TagRow label="Interests" values={gift.interests} />
            <TagRow label="Occasion" values={gift.occasions} />
          </div>

          <div style={{ display: "flex", gap: 18, flexWrap: "wrap", marginTop: 4 }}>
            {gift.link && (
              <a href={gift.link} target="_blank" rel="noopener" style={plainLinkStyle}>
                Product page
              </a>
            )}
            {gift.amazonLink && (
              <a href={gift.amazonLink} target="_blank" rel="noopener" style={plainLinkStyle}>
                Amazon
              </a>
            )}
          </div>
        </div>
      </div>
    </ClaySurface>
  );
}

/* ------------------------------------------------------------------ *
 * Close matches panel
 * ------------------------------------------------------------------ */

function MatchThumb({ gift }: { gift: ReviewGift }) {
  const { failed, onError, loaded, onLoad } = useImageFallback(gift.image);
  return (
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: 10,
        overflow: "hidden",
        flexShrink: 0,
        background: "linear-gradient(160deg, #FFE9A8, #F7C76A)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {gift.image && !failed ? (
        <img
          key={gift.image}
          src={gift.image}
          alt={gift.name}
          onError={onError}
          onLoad={onLoad}
          style={{ opacity: loaded ? 1 : 0, transition: "opacity 160ms ease", width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <GiftBox3D size={30} color="butter" rotate={-8} ribbonColor="#FF8166" />
      )}
    </div>
  );
}

const matchRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: 10,
  borderRadius: 14,
  background: "rgba(255,255,255,0.55)",
  border: "none",
  cursor: "pointer",
  textAlign: "left",
  width: "100%",
  boxShadow: "inset 0 0 0 1px rgba(35,20,16,0.06)",
};

function ClosestMatchesPanel({
  gift,
  matcher,
  giftById,
  onJump,
}: {
  gift: ReviewGift;
  matcher: (rowId: string) => SimilarityResult;
  giftById: Map<string, ReviewGift>;
  onJump: (rowId: string) => void;
}) {
  const result = matcher(gift.id);

  return (
    <ClaySurface tint="cream" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontFamily: "Geist, sans-serif", fontSize: 13, fontWeight: 600, color: "#231410" }}>
        {result.count} close match{result.count === 1 ? "" : "es"}
      </div>
      {result.top.length === 0 ? (
        <p style={{ fontFamily: "Geist, sans-serif", fontSize: 13, color: "rgba(35,20,16,0.55)", margin: 0 }}>
          Nothing else in the live catalog looks like this one.
        </p>
      ) : (
        result.top.map((m) => {
          const mg = giftById.get(m.rowId);
          if (!mg) return null;
          return (
            <button key={m.rowId} type="button" onClick={() => onJump(m.rowId)} style={matchRowStyle}>
              <MatchThumb gift={mg} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: "Geist, sans-serif",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#231410",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {mg.name}
                </div>
                <div style={{ fontFamily: "Geist, sans-serif", fontSize: 11, color: "rgba(35,20,16,0.55)", marginBottom: 4 }}>
                  {mg.brand}
                </div>
                <PriceDisplay gift={mg} variant="card" />
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
                <span style={{ fontFamily: '"Instrument Serif", serif', fontSize: 16, color: "#C4477E" }}>
                  {Math.round(m.score * 100)}%
                </span>
                <StatusChip status={mg.status} />
              </div>
            </button>
          );
        })
      )}
    </ClaySurface>
  );
}

/* ------------------------------------------------------------------ *
 * Action bar, toast, banner
 * ------------------------------------------------------------------ */

function Key({ k, dark }: { k: string; dark?: boolean }) {
  return (
    <kbd
      style={{
        marginLeft: 8,
        padding: "1px 6px",
        borderRadius: 6,
        fontFamily: "Geist, sans-serif",
        fontSize: 11,
        fontWeight: 600,
        background: dark ? "rgba(35,20,16,0.08)" : "rgba(255,255,255,0.22)",
        color: "inherit",
      }}
    >
      {k}
    </kbd>
  );
}

function ActionBar({
  isMobile,
  disabled,
  canUndo,
  onApprove,
  onReject,
  onDead,
  onSkip,
  onBack,
  onUndo,
}: {
  isMobile: boolean;
  disabled: boolean;
  canUndo: boolean;
  onApprove: () => void;
  onReject: () => void;
  onDead: () => void;
  onSkip: () => void;
  onBack: () => void;
  onUndo: () => void;
}) {
  if (!isMobile) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <Pillow tone="coral" size="md" onClick={onApprove} disabled={disabled} style={{ flex: 1 }}>
            Approve
            <Key k="A" />
          </Pillow>
          <Pillow tone="plum" size="md" onClick={onReject} disabled={disabled} style={{ flex: 1 }}>
            Reject
            <Key k="R" />
          </Pillow>
          <Pillow tone="cream" size="md" onClick={onDead} disabled={disabled} style={{ flex: 0.7 }}>
            Dead
            <Key k="D" dark />
          </Pillow>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Pillow tone="ink" size="sm" onClick={onBack} disabled={disabled} style={{ flex: 1 }}>
            Back
            <Key k="←" />
          </Pillow>
          <Pillow tone="ink" size="sm" onClick={onSkip} disabled={disabled} style={{ flex: 1 }}>
            Skip
            <Key k="S" />
          </Pillow>
          <Pillow tone="cream" size="sm" onClick={onUndo} disabled={!canUndo} style={{ flex: 1 }}>
            Undo
            <Key k="U" dark />
          </Pillow>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 40,
        display: "flex",
        gap: 8,
        padding: "10px 14px",
        background: "rgba(251,241,225,0.95)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderTop: "1px solid rgba(35,20,16,0.08)",
        overflowX: "auto",
      }}
    >
      <Pillow tone="coral" size="sm" onClick={onApprove} disabled={disabled}>
        Approve
      </Pillow>
      <Pillow tone="plum" size="sm" onClick={onReject} disabled={disabled}>
        Reject
      </Pillow>
      <Pillow tone="cream" size="sm" onClick={onDead} disabled={disabled}>
        Dead
      </Pillow>
      <Pillow tone="ink" size="sm" onClick={onSkip} disabled={disabled}>
        Skip
      </Pillow>
      <Pillow tone="ink" size="sm" onClick={onBack} disabled={disabled}>
        Back
      </Pillow>
      <Pillow tone="cream" size="sm" onClick={onUndo} disabled={!canUndo}>
        Undo last
      </Pillow>
    </div>
  );
}

function Toast({ toast, onUndo }: { toast: ToastState; onUndo: () => void }) {
  return (
    <div
      style={{
        position: "fixed",
        left: "50%",
        transform: "translateX(-50%)",
        bottom: 90,
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "10px 18px",
        borderRadius: 999,
        background: "rgba(35,20,16,0.92)",
        boxShadow: "0 12px 24px -8px rgba(30,15,10,0.5)",
        animation: "fbPop 200ms cubic-bezier(.22,1.4,.4,1)",
      }}
    >
      <span style={{ fontFamily: "Geist, sans-serif", fontSize: 13, fontWeight: 600, color: "#FFF8EE" }}>
        {toast.label}
        {toast.showUndo && " · "}
      </span>
      {toast.showUndo && (
        <button
          type="button"
          onClick={onUndo}
          style={{
            background: "transparent",
            border: "none",
            padding: 0,
            color: "#FFD98C",
            fontFamily: "Geist, sans-serif",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            textDecoration: "underline",
            textUnderlineOffset: 3,
          }}
        >
          Undo
        </button>
      )}
    </div>
  );
}

function ErrorBanner({ text, reloadable, onDismiss }: { text: string; reloadable: boolean; onDismiss: () => void }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        padding: "12px 16px",
        borderRadius: 14,
        background: "rgba(224,82,76,0.12)",
        boxShadow: "inset 0 0 0 1px rgba(224,82,76,0.3)",
        marginBottom: 18,
      }}
    >
      <span style={{ fontFamily: "Geist, sans-serif", fontSize: 13, color: "#A82E2A" }}>{text}</span>
      <div style={{ display: "flex", gap: 16, flexShrink: 0, alignItems: "center" }}>
        {reloadable && (
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "#A82E2A",
              fontFamily: "Geist, sans-serif",
              fontSize: 13,
              fontWeight: 700,
              textDecoration: "underline",
              textUnderlineOffset: 3,
            }}
          >
            Reload
          </button>
        )}
        <button
          type="button"
          onClick={onDismiss}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "#A82E2A",
            fontFamily: "Geist, sans-serif",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Main tool
 * ------------------------------------------------------------------ */

function ReviewTool({ unlock }: { unlock: UnlockState }) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useReviewGifts();

  const [overrides, setOverrides] = useState<Record<string, { status: string; reviewed: boolean }>>({});
  const [filter, setFilter] = useState<FilterKey>("needs");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("sheet");
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [undoStack, setUndoStack] = useState<UndoEntry[]>([]);
  const [tally, setTally] = useState<Tally>({ approved: 0, rejected: 0, dead: 0 });
  const [toast, setToast] = useState<ToastState | null>(null);
  const [banner, setBanner] = useState<BannerState | null>(null);
  const [caughtUp, setCaughtUp] = useState(false);

  const toastTimer = useRef<number | null>(null);
  const toastCounter = useRef(0);

  const searchLower = search.trim().toLowerCase();

  // The matcher is built once per fetch (from the raw, un-overridden rows)
  // so a session's worth of approve/reject clicks never re-triggers the
  // O(n squared) similarity pass.
  const matcher = useMemo(() => buildMatcher(data), [data]);

  const merged: ReviewGift[] = useMemo(() => {
    if (!Object.keys(overrides).length) return data;
    return data.map((g) => {
      const o = overrides[g.id];
      return o ? { ...g, status: o.status, reviewed: o.reviewed } : g;
    });
  }, [data, overrides]);

  const giftById = useMemo(() => new Map(merged.map((g) => [g.id, g])), [merged]);

  const counts = useMemo(() => {
    const c: Record<FilterKey, number> = { needs: 0, approved: 0, rejected: 0, dead: 0, retired: 0, all: merged.length };
    for (const g of merged) {
      if (matchesFilter(g, "needs")) c.needs++;
      if (matchesFilter(g, "approved")) c.approved++;
      if (matchesFilter(g, "rejected")) c.rejected++;
      if (matchesFilter(g, "dead")) c.dead++;
      if (matchesFilter(g, "retired")) c.retired++;
    }
    return c;
  }, [merged]);

  const filteredIds = useMemo(
    () => computeVisibleIds(merged, filter, searchLower, sortKey, matcher),
    [merged, filter, searchLower, sortKey, matcher],
  );

  // Seed the first selection once the initial fetch resolves.
  useEffect(() => {
    if (!loading && currentId === null && filteredIds.length > 0) {
      setCurrentId(filteredIds[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  // Once nothing is left to review, carry on through the full catalog.
  useEffect(() => {
    if (loading || error || !merged.length || filter !== "needs" || counts.needs > 0) return;
    const ids = computeVisibleIds(merged, "all", searchLower, sortKey, matcher);
    setFilter("all");
    setCurrentId(ids[0] ?? null);
    setCaughtUp(true);
  }, [loading, error, merged, filter, counts.needs, searchLower, sortKey, matcher]);

  const applyFilter = useCallback(
    (f: FilterKey) => {
      setFilter(f);
      const ids = computeVisibleIds(merged, f, searchLower, sortKey, matcher);
      setCurrentId(ids[0] ?? null);
    },
    [merged, searchLower, sortKey, matcher],
  );

  const applySearch = useCallback(
    (value: string) => {
      setSearch(value);
      const lower = value.trim().toLowerCase();
      const ids = computeVisibleIds(merged, filter, lower, sortKey, matcher);
      setCurrentId(ids[0] ?? null);
    },
    [merged, filter, sortKey, matcher],
  );

  const applySort = useCallback(
    (s: SortKey) => {
      setSortKey(s);
      const ids = computeVisibleIds(merged, filter, searchLower, s, matcher);
      setCurrentId(ids[0] ?? null);
    },
    [merged, filter, searchLower, matcher],
  );

  const showToast = useCallback((label: string, showUndo: boolean) => {
    toastCounter.current += 1;
    setToast({ id: toastCounter.current, label, showUndo });
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2800);
  }, []);

  const jumpTo = useCallback((rowId: string) => setCurrentId(rowId), []);

  const skip = useCallback(() => {
    if (!currentId) return;
    const idx = filteredIds.indexOf(currentId);
    const nextId = idx >= 0 && idx + 1 < filteredIds.length ? filteredIds[idx + 1] : currentId;
    setCurrentId(nextId);
  }, [currentId, filteredIds]);

  const back = useCallback(() => {
    if (!currentId) return;
    const idx = filteredIds.indexOf(currentId);
    const prevId = idx > 0 ? filteredIds[idx - 1] : currentId;
    setCurrentId(prevId);
  }, [currentId, filteredIds]);

  const performAction = useCallback(
    (action: ActionKind) => {
      if (!currentId || !unlock.secret) return;
      const gift = giftById.get(currentId);
      if (!gift) return;

      const prevStatus = gift.status;
      const prevReviewed = gift.reviewed;
      const nextStatus = action === "approve" ? prevStatus : ACTION_STATUS[action];
      const nextReviewed = true;
      const tallyKey = TALLY_KEY[action];

      setOverrides((o) => ({ ...o, [currentId]: { status: nextStatus, reviewed: nextReviewed } }));
      setTally((t) => ({ ...t, [tallyKey]: t[tallyKey] + 1 }));
      setUndoStack((s) => [...s, { rowId: currentId, giftName: gift.name, action, prevStatus, prevReviewed, nextStatus, nextReviewed }]);
      showToast(ACTION_TOAST[action], true);

      const idx = filteredIds.indexOf(currentId);
      const nextId = idx >= 0 && idx + 1 < filteredIds.length ? filteredIds[idx + 1] : null;
      setCurrentId(nextId);

      setReviewRow({
        secret: unlock.secret,
        rowId: currentId,
        gift: gift.name,
        ...(action === "approve" ? {} : { status: ACTION_STATUS[action] }),
        reviewed: true,
      }).then((res) => {
        if (res.ok) return;
        setOverrides((o) => ({ ...o, [currentId]: { status: prevStatus, reviewed: prevReviewed } }));
        setTally((t) => ({ ...t, [tallyKey]: Math.max(0, t[tallyKey] - 1) }));
        setUndoStack((s) => s.filter((e) => !(e.rowId === currentId && e.action === action && e.nextStatus === nextStatus)));
        setBanner(bannerFor(res.error));
      });
    },
    [currentId, giftById, unlock.secret, filteredIds, showToast],
  );

  const undoLast = useCallback(() => {
    const entry = undoStack[undoStack.length - 1];
    if (!entry || !unlock.secret) return;
    const tallyKey = TALLY_KEY[entry.action];

    setUndoStack((s) => s.slice(0, -1));
    setOverrides((o) => ({ ...o, [entry.rowId]: { status: entry.prevStatus, reviewed: entry.prevReviewed } }));
    setTally((t) => ({ ...t, [tallyKey]: Math.max(0, t[tallyKey] - 1) }));
    setCurrentId(entry.rowId);
    showToast("Undone", false);

    setReviewRow({
      secret: unlock.secret,
      rowId: entry.rowId,
      gift: entry.giftName,
      status: entry.prevStatus,
      reviewed: entry.prevReviewed,
    }).then((res) => {
      if (res.ok) return;
      setOverrides((o) => ({ ...o, [entry.rowId]: { status: entry.nextStatus, reviewed: entry.nextReviewed } }));
      setTally((t) => ({ ...t, [tallyKey]: t[tallyKey] + 1 }));
      setUndoStack((s) => [...s, entry]);
      setBanner(bannerFor(res.error));
    });
  }, [undoStack, unlock.secret, showToast]);

  useEffect(() => {
    document.title = "Review · GiftPicker";
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Cmd+R must stay "refresh"; only bare, non-repeating keys count.
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) return;
      const key = e.key.toLowerCase();
      if (key === "a") {
        e.preventDefault();
        performAction("approve");
      } else if (key === "r") {
        e.preventDefault();
        performAction("reject");
      } else if (key === "d") {
        e.preventDefault();
        performAction("dead");
      } else if (key === "s" || e.key === "ArrowRight") {
        e.preventDefault();
        skip();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        back();
      } else if (key === "u") {
        e.preventDefault();
        undoLast();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [performAction, skip, back, undoLast]);

  const currentGift = currentId ? giftById.get(currentId) ?? null : null;

  return (
    <div style={{ background: "#FBF1E1", minHeight: "100vh", position: "relative" }}>
      <div style={{ position: "relative", minHeight: "100vh" }}>
        <AmbientGlow variant="results" />

        <SiteHeader onLogoClick={() => navigate("/")}>
          <span style={{ fontFamily: "Geist, sans-serif", fontSize: 13, color: "rgba(35,20,16,0.6)", whiteSpace: "nowrap" }}>
            {tally.approved} approved, {tally.rejected} rejected{tally.dead ? `, ${tally.dead} dead` : ""}
          </span>
          <Pillow tone="ink" size="sm" onClick={unlock.lock}>
            Lock
          </Pillow>
        </SiteHeader>

        <div
          style={{
            position: "relative",
            zIndex: 1,
            padding: isMobile ? "20px 16px 120px" : "28px 56px 64px",
            maxWidth: 1120,
            margin: "0 auto",
          }}
        >
          {banner && (
            <ErrorBanner text={banner.text} reloadable={banner.reloadable} onDismiss={() => setBanner(null)} />
          )}

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
            {FILTERS.map((f) => {
              const active = filter === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => applyFilter(f.key)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 999,
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "Geist, sans-serif",
                    fontSize: 13,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    background: active ? "linear-gradient(180deg, #FF8C71 0%, #E64B45 100%)" : "rgba(35,20,16,0.06)",
                    color: active ? "#FFF8EE" : "#231410",
                  }}
                >
                  {f.label} <span style={{ opacity: active ? 0.85 : 0.55 }}>{counts[f.key]}</span>
                </button>
              );
            })}
          </div>

          <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
            <input
              value={search}
              onChange={(e) => applySearch(e.target.value)}
              placeholder="Search by name or brand"
              style={{
                flex: "1 1 220px",
                minWidth: 180,
                padding: "10px 14px",
                borderRadius: 12,
                border: "none",
                background: "rgba(35,20,16,0.05)",
                boxShadow: "inset 0 0 0 1.5px rgba(35,20,16,0.08)",
                fontFamily: "Geist, sans-serif",
                fontSize: 14,
                color: "#231410",
                outline: "none",
              }}
            />
            <select
              value={sortKey}
              onChange={(e) => applySort(e.target.value as SortKey)}
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                border: "none",
                background: "rgba(35,20,16,0.05)",
                boxShadow: "inset 0 0 0 1.5px rgba(35,20,16,0.08)",
                fontFamily: "Geist, sans-serif",
                fontSize: 14,
                color: "#231410",
                outline: "none",
              }}
            >
              <option value="sheet">Sheet order</option>
              <option value="redundant">Most redundant first</option>
              <option value="notes">Open notes first</option>
            </select>
          </div>

          {caughtUp && filter === "all" && !loading && (
            <div
              style={{
                marginBottom: 16,
                padding: "12px 16px",
                borderRadius: 14,
                background: "rgba(92,122,78,0.12)",
                fontFamily: "Geist, sans-serif",
                fontSize: 14,
                lineHeight: 1.5,
                color: "#2F4526",
              }}
            >
              Every gift has been reviewed. You're now going through the full catalog in sheet order.
            </div>
          )}

          {loading && (
            <ClaySurface tint="cream" style={{ padding: 48, textAlign: "center" }}>
              <div
                style={{
                  display: "inline-block",
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  border: "3px solid rgba(35,20,16,0.12)",
                  borderTopColor: "#E64B45",
                  animation: "spin 0.9s linear infinite",
                  marginBottom: 14,
                }}
              />
              <p style={{ fontFamily: "Geist, sans-serif", fontSize: 14, color: "rgba(35,20,16,0.6)", margin: 0 }}>
                Loading the catalog. This can take up to ten seconds.
              </p>
            </ClaySurface>
          )}

          {!loading && error && (
            <ClaySurface tint="cream" style={{ padding: 40, textAlign: "center" }}>
              <p style={{ fontFamily: "Geist, sans-serif", fontSize: 14, color: "rgba(35,20,16,0.65)", margin: "0 0 16px" }}>
                Couldn't load the catalog: {error}
              </p>
              <Pillow tone="ink" size="md" onClick={reload}>
                Try again
              </Pillow>
            </ClaySurface>
          )}

          {!loading && !error && !currentGift && (
            <ClaySurface tint="cream" style={{ padding: 40, textAlign: "center" }}>
              <p style={{ fontFamily: "Geist, sans-serif", fontSize: 14, color: "rgba(35,20,16,0.65)", margin: 0 }}>
                Nothing in this filter right now.
              </p>
            </ClaySurface>
          )}

          {!loading && !error && currentGift && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr",
                gap: isMobile ? 20 : 24,
                alignItems: "start",
              }}
            >
              <GiftCard gift={currentGift} isMobile={isMobile} />
              <div>
                {!isMobile && (
                  <ActionBar
                    isMobile={false}
                    disabled={!currentGift}
                    canUndo={undoStack.length > 0}
                    onApprove={() => performAction("approve")}
                    onReject={() => performAction("reject")}
                    onDead={() => performAction("dead")}
                    onSkip={skip}
                    onBack={back}
                    onUndo={undoLast}
                  />
                )}
                <ClosestMatchesPanel gift={currentGift} matcher={matcher} giftById={giftById} onJump={jumpTo} />
              </div>
            </div>
          )}

        </div>

        {isMobile && (
          <ActionBar
            isMobile
            disabled={!currentGift}
            canUndo={undoStack.length > 0}
            onApprove={() => performAction("approve")}
            onReject={() => performAction("reject")}
                    onDead={() => performAction("dead")}
            onSkip={skip}
            onBack={back}
            onUndo={undoLast}
          />
        )}

        {toast && <Toast toast={toast} onUndo={undoLast} />}
      </div>
    </div>
  );
}

export function Review() {
  const unlock = useReviewUnlock();

  useEffect(() => {
    document.title = "Review · GiftPicker";
  }, []);

  if (!unlock.unlocked) {
    return <PasswordGate unlock={unlock} />;
  }
  return <ReviewTool unlock={unlock} />;
}
