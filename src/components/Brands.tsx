import { useEffect, useState } from "react";
import type { CSSProperties, FormEvent, ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AmbientGlow } from "./clay/AmbientGlow";
import { ClaySurface } from "./clay/ClaySurface";
import { FooterLinks } from "./clay/FooterLinks";
import { Pillow } from "./clay/Pillow";
import { PresentlyMark } from "./clay/PresentlyMark";
import { SiteHeader } from "./clay/SiteHeader";
import { Wordmark } from "./clay/Wordmark";
import { useIsMobile } from "../hooks/useIsMobile";
import { track } from "../data/analytics";
import { BRAND_EMAIL, brandMailto, submitBrand, type BrandSubmission, type Placement } from "../data/brandApi";

const SERIF = '"Instrument Serif", serif';
const SANS = "Geist, sans-serif";
const INK = "#231410";

const PLACEMENTS: { v: Placement; title: string; price: string; body: string }[] = [
  {
    v: "editorial",
    title: "Editorial review",
    price: "Free",
    body:
      "Our team reviews your product the same way we review every gift in the catalog. If it's a fit, we add it and match it to the shoppers it suits. Submitting doesn't guarantee a spot.",
  },
  {
    v: "sponsored",
    title: "Sponsored placement",
    price: "Paid",
    body:
      "Once a product passes review, a sponsored placement gives it more visibility in the results it matches. Sponsored gifts are always labeled and only appear for shoppers whose answers they fit. We'll reply with rates.",
  },
];

const EMPTY: Omit<BrandSubmission, "placement"> = {
  brand: "",
  contactName: "",
  email: "",
  website: "",
  product: "",
  productUrl: "",
  price: "",
  giftFor: "",
  notes: "",
};

type Field = keyof typeof EMPTY;
const REQUIRED: Field[] = ["brand", "contactName", "email", "product", "productUrl", "price"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const withScheme = (u: string) => (u && !/^https?:\/\//i.test(u) ? `https://${u}` : u);

type Status = "idle" | "sending" | "sent" | "failed";

export function BrandsPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [params] = useSearchParams();
  const [placement, setPlacement] = useState<Placement>(params.get("placement") === "sponsored" ? "sponsored" : "editorial");
  const [form, setForm] = useState(EMPTY);
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    document.title = "For brands · GiftPicker";
  }, []);

  const set = (k: Field) => (v: string) => setForm((f) => ({ ...f, [k]: v }));
  const invalid = (k: Field) =>
    showErrors && ((REQUIRED.includes(k) && !form[k].trim()) || (k === "email" && !!form.email.trim() && !EMAIL_RE.test(form.email.trim())));
  const submission = (): BrandSubmission => ({
    placement,
    ...Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v.trim()])),
    website: withScheme(form.website.trim()),
    productUrl: withScheme(form.productUrl.trim()),
  } as BrandSubmission);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const missing = REQUIRED.some((k) => !form[k].trim()) || !EMAIL_RE.test(form.email.trim());
    if (missing) {
      setShowErrors(true);
      return;
    }
    if (honeypot) {
      setStatus("sent");
      return;
    }
    setStatus("sending");
    const res = await submitBrand(submission());
    if (res.ok) {
      track("brand_submit", { placement });
      setStatus("sent");
    } else {
      track("brand_submit_failed", { placement, error: res.error });
      setStatus("failed");
    }
  };

  const reset = () => {
    setForm(EMPTY);
    setShowErrors(false);
    setStatus("idle");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const colGap = isMobile ? 0 : 16;

  return (
    <div style={{ background: "#FBF1E1", minHeight: "100vh", position: "relative" }}>
      <div style={{ position: "relative", minHeight: "100vh" }}>
        <AmbientGlow variant="results" />

        <SiteHeader onLogoClick={() => navigate("/")}>
          <Pillow tone="coral" size="sm" onClick={() => navigate("/quiz")}>
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
          <div style={{ maxWidth: 640 }}>
            <div
              style={{
                fontFamily: SANS,
                fontSize: 12,
                letterSpacing: "0.14em",
                color: "rgba(35,20,16,0.62)",
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              For brands
            </div>
            <h1
              style={{
                fontFamily: SERIF,
                fontWeight: 400,
                fontSize: isMobile ? 40 : 56,
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
                color: INK,
                margin: 0,
                textWrap: "balance" as never,
              }}
            >
              Get your product in front of <em style={{ color: "#C4477E", fontStyle: "italic" }}>gift shoppers</em>.
            </h1>
            <p style={{ fontFamily: SANS, fontSize: isMobile ? 16 : 17, lineHeight: 1.6, color: "rgba(35,20,16,0.68)", margin: "18px 0 0" }}>
              GiftPicker matches people to gifts from a hand-curated catalog of more than 560 products across 200+ brands.
              Shoppers arrive knowing who they're buying for, the occasion, and their budget, so the right product reaches
              them when they're ready to buy.
            </p>
          </div>

          <div
            role="radiogroup"
            aria-label="What are you applying for?"
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
              gap: 16,
              marginTop: isMobile ? 32 : 44,
            }}
          >
            {PLACEMENTS.map((p) => {
              const on = placement === p.v;
              return (
                <button
                  key={p.v}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setPlacement(p.v)}
                  style={{
                    textAlign: "left",
                    cursor: "pointer",
                    border: "none",
                    borderRadius: 22,
                    padding: isMobile ? "20px 20px 22px" : "24px 26px 26px",
                    background: on
                      ? "linear-gradient(160deg, #FFFFFC 0%, #FFF4EC 100%)"
                      : "linear-gradient(160deg, rgba(255,252,245,0.7) 0%, rgba(245,231,210,0.7) 100%)",
                    boxShadow: on
                      ? "inset 0 0 0 2px #E64B45, 0 14px 30px -14px rgba(120,40,30,0.35)"
                      : "inset 0 0 0 1px rgba(35,20,16,0.08), inset 0 1px 0 rgba(255,255,255,0.8)",
                    transition: "box-shadow 160ms ease, background 160ms ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontFamily: SERIF, fontSize: isMobile ? 24 : 26, color: INK, lineHeight: 1.1 }}>{p.title}</span>
                    <span
                      style={{
                        fontFamily: SANS,
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: "0.04em",
                        padding: "4px 10px",
                        borderRadius: 999,
                        background: p.v === "sponsored" ? "rgba(196,71,126,0.12)" : "rgba(92,122,78,0.14)",
                        color: p.v === "sponsored" ? "#9A2F62" : "#3F5A33",
                      }}
                    >
                      {p.price}
                    </span>
                    <span
                      aria-hidden
                      style={{
                        marginLeft: "auto",
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        flexShrink: 0,
                        boxShadow: on ? "inset 0 0 0 6px #E64B45" : "inset 0 0 0 1.5px rgba(35,20,16,0.25)",
                        background: "#FFFCF5",
                        transition: "box-shadow 160ms ease",
                      }}
                    />
                  </div>
                  <p style={{ fontFamily: SANS, fontSize: 14, lineHeight: 1.55, color: "rgba(35,20,16,0.68)", margin: "10px 0 0" }}>
                    {p.body}
                  </p>
                </button>
              );
            })}
          </div>

          <ClaySurface tint="cream" style={{ marginTop: 24, padding: isMobile ? "24px 20px" : "36px 40px" }}>
            {status === "sent" ? (
              <div style={{ textAlign: "center", padding: isMobile ? "12px 0" : "24px 0" }}>
                <h2 style={{ fontFamily: SERIF, fontWeight: 400, fontSize: isMobile ? 30 : 36, color: INK, margin: 0 }}>
                  Thanks, we have it.
                </h2>
                <p style={{ fontFamily: SANS, fontSize: 15, lineHeight: 1.6, color: "rgba(35,20,16,0.68)", margin: "10px auto 0", maxWidth: 440 }}>
                  We'll review {form.product.trim() || "your product"} and reply to {form.email.trim() || "you"}
                  {placement === "sponsored" ? " with next steps and rates." : "."}
                </p>
                <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 24, flexWrap: "wrap" }}>
                  <Pillow tone="cream" size="md" onClick={reset}>
                    Submit another product
                  </Pillow>
                  <Pillow tone="coral" size="md" onClick={() => navigate("/")}>
                    Back to GiftPicker
                  </Pillow>
                </div>
              </div>
            ) : (
              <form onSubmit={onSubmit} noValidate>
                <h2 style={{ fontFamily: SERIF, fontWeight: 400, fontSize: isMobile ? 28 : 32, color: INK, margin: "0 0 4px" }}>
                  Submit a product
                </h2>
                <p style={{ fontFamily: SANS, fontSize: 14, color: "rgba(35,20,16,0.6)", margin: "0 0 24px" }}>
                  Applying for {placement === "sponsored" ? "sponsored placement" : "editorial review"}. Fields marked * are required.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", columnGap: colGap, rowGap: 16 }}>
                  <Input label="Brand name" required value={form.brand} onChange={set("brand")} invalid={invalid("brand")} autoComplete="organization" />
                  <Input label="Brand website" value={form.website} onChange={set("website")} placeholder="yourbrand.com" inputMode="url" autoComplete="url" />
                  <Input label="Your name" required value={form.contactName} onChange={set("contactName")} invalid={invalid("contactName")} autoComplete="name" />
                  <Input
                    label="Work email"
                    required
                    type="email"
                    value={form.email}
                    onChange={set("email")}
                    invalid={invalid("email")}
                    hint={invalid("email") && form.email.trim() ? "That email doesn't look right." : undefined}
                    autoComplete="email"
                  />
                  <Input label="Product name" required value={form.product} onChange={set("product")} invalid={invalid("product")} />
                  <Input label="Price (USD)" required value={form.price} onChange={set("price")} invalid={invalid("price")} placeholder="48" inputMode="decimal" />
                  <div style={{ gridColumn: "1 / -1" }}>
                    <Input
                      label="Product link"
                      required
                      value={form.productUrl}
                      onChange={set("productUrl")}
                      invalid={invalid("productUrl")}
                      placeholder="yourbrand.com/products/..."
                      inputMode="url"
                    />
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <Input
                      label="Who is it a great gift for?"
                      value={form.giftFor}
                      onChange={set("giftFor")}
                      placeholder="New parents, coffee people, anyone who travels a lot"
                    />
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <Input
                      label="Anything else we should know?"
                      multiline
                      value={form.notes}
                      onChange={set("notes")}
                      placeholder="Bundles, holiday availability, gift wrap, or anything that makes it a standout gift"
                    />
                  </div>
                </div>

                {/* Bots fill every field; people never see this one. */}
                <input
                  type="text"
                  name="company"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  style={{ position: "absolute", left: -9999, width: 1, height: 1, opacity: 0 }}
                />

                {showErrors && REQUIRED.some((k) => invalid(k)) && (
                  <Notice tone="warn">Please fill in the highlighted fields.</Notice>
                )}
                {status === "failed" && (
                  <Notice tone="warn">
                    We couldn't send this just now. You can{" "}
                    <a href={brandMailto(submission())} style={{ color: "#9A2F62", fontWeight: 600 }}>
                      email it to {BRAND_EMAIL}
                    </a>{" "}
                    instead, with everything you typed filled in.
                  </Notice>
                )}

                <div
                  style={{
                    display: "flex",
                    alignItems: isMobile ? "stretch" : "center",
                    flexDirection: isMobile ? "column" : "row",
                    gap: isMobile ? 14 : 20,
                    marginTop: 24,
                  }}
                >
                  <Pillow tone="coral" size="lg" type="submit" disabled={status === "sending"}>
                    {status === "sending" ? "Sending…" : "Submit for review"}
                  </Pillow>
                  <p style={{ fontFamily: SANS, fontSize: 12, lineHeight: 1.5, color: "rgba(35,20,16,0.62)", margin: 0, maxWidth: 360 }}>
                    We use these details only to reply about your submission. See our{" "}
                    <a
                      href="/privacy"
                      onClick={(e) => {
                        e.preventDefault();
                        navigate("/privacy");
                      }}
                      style={{ color: "inherit", textUnderlineOffset: 2 }}
                    >
                      Privacy Policy
                    </a>
                    .
                  </p>
                </div>
              </form>
            )}
          </ClaySurface>

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
            <Wordmark size="sm" />
            <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <PresentlyMark />
              <FooterLinks />
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

function Notice({ tone, children }: { tone: "warn"; children: ReactNode }) {
  return (
    <div
      role="alert"
      style={{
        marginTop: 20,
        padding: "12px 16px",
        borderRadius: 14,
        background: tone === "warn" ? "rgba(230,75,69,0.08)" : "transparent",
        fontFamily: SANS,
        fontSize: 14,
        lineHeight: 1.5,
        color: INK,
      }}
    >
      {children}
    </div>
  );
}

type InputProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  invalid?: boolean;
  hint?: string;
  placeholder?: string;
  type?: string;
  multiline?: boolean;
  inputMode?: "url" | "decimal" | "email" | "text";
  autoComplete?: string;
};

function Input({ label, value, onChange, required, invalid, hint, placeholder, type = "text", multiline, inputMode, autoComplete }: InputProps) {
  const isMobile = useIsMobile();
  const style: CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 14px",
    borderRadius: 12,
    border: "none",
    outline: "none",
    background: "rgba(255,255,255,0.72)",
    boxShadow: invalid ? "inset 0 0 0 2px rgba(230,75,69,0.75)" : "inset 0 0 0 1.5px rgba(35,20,16,0.1)",
    fontFamily: SANS,
    fontSize: isMobile ? 16 : 15,
    color: INK,
    transition: "box-shadow 140ms ease, background 140ms ease",
    resize: multiline ? "vertical" : undefined,
    minHeight: multiline ? 96 : undefined,
    lineHeight: 1.45,
  };
  return (
    <label style={{ display: "block" }}>
      <span style={{ display: "block", fontFamily: SANS, fontSize: 13, fontWeight: 600, color: "#5A3F36", marginBottom: 6 }}>
        {label}
        {required && <span style={{ color: "#C4477E" }}> *</span>}
      </span>
      {multiline ? (
        <textarea className="gp-field" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={4} maxLength={1500} style={style} />
      ) : (
        <input
          className="gp-field"
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          inputMode={inputMode}
          autoComplete={autoComplete}
          required={required}
          maxLength={300}
          aria-invalid={invalid || undefined}
          style={style}
        />
      )}
      {hint && <span style={{ display: "block", fontFamily: SANS, fontSize: 12, color: "#B23A35", marginTop: 6 }}>{hint}</span>}
    </label>
  );
}
