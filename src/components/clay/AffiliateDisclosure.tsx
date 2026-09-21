import { AFFILIATE_DISCLOSURE } from "../../data/affiliate";

/** Footer-only commission disclosure, deliberately small and quiet. */
export function AffiliateDisclosure() {
  return (
    <p
      style={{
        flexBasis: "100%",
        margin: 0,
        fontFamily: "Geist, sans-serif",
        fontSize: 11,
        lineHeight: 1.5,
        color: "rgba(35,20,16,0.34)",
      }}
    >
      {AFFILIATE_DISCLOSURE}
    </p>
  );
}
