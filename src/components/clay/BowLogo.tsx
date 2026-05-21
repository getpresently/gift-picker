import { useId } from "react";

type Props = { size?: number };

export function BowLogo({ size = 28 }: Props) {
  const uid = useId().replace(/:/g, "");
  const bow = `bow-${uid}`;
  const rib = `rib-${uid}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
      style={{ display: "block", filter: "drop-shadow(0 4px 10px rgba(80,30,30,0.18))" }}
    >
      <defs>
        <linearGradient id={bow} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FF9D81" />
          <stop offset="0.5" stopColor="#E64B45" />
          <stop offset="1" stopColor="#C4477E" />
        </linearGradient>
        <linearGradient id={rib} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFE9A8" />
          <stop offset="1" stopColor="#FFD074" />
        </linearGradient>
      </defs>
      <rect x="6" y="20" width="28" height="16" rx="4" fill={`url(#${bow})`} />
      <rect x="18" y="20" width="4" height="16" fill={`url(#${rib})`} opacity="0.95" />
      <path d="M20 18 C 14 12, 6 13, 7 18 C 8 21, 14 21, 20 18 Z" fill={`url(#${rib})`} />
      <path d="M14 17 C 12 16, 10 16, 8 17 C 9 18, 11 18, 14 18 Z" fill="rgba(120,60,30,0.18)" />
      <path d="M20 18 C 26 12, 34 13, 33 18 C 32 21, 26 21, 20 18 Z" fill={`url(#${rib})`} />
      <path d="M26 17 C 28 16, 30 16, 32 17 C 31 18, 29 18, 26 18 Z" fill="rgba(120,60,30,0.18)" />
      <rect x="17.5" y="16" width="5" height="6" rx="1" fill="#FFD074" stroke="rgba(120,60,30,0.18)" strokeWidth="0.4" />
      <path
        d="M18 22 Q 14 26, 12 30 Q 10 32, 13 33 L 16 30 Q 18 26, 20 24"
        fill="none"
        stroke={`url(#${rib})`}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M22 22 Q 26 26, 28 32 Q 28 35, 26 35 L 25 30 Q 23 26, 21 24"
        fill="none"
        stroke={`url(#${rib})`}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
