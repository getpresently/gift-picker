import type { CSSProperties, ReactNode } from "react";

export type Tint = "cream" | "rose" | "butter" | "plum" | "sage" | "coral" | "ink";

const tints: Record<Tint, string> = {
  cream:  "linear-gradient(160deg, #FFFCF5 0%, #FBF1E1 100%)",
  rose:   "linear-gradient(160deg, #FFE7DB 0%, #FFC9B9 100%)",
  butter: "linear-gradient(160deg, #FFE9A8 0%, #F7C76A 100%)",
  plum:   "linear-gradient(160deg, #4A2440 0%, #2A1226 100%)",
  sage:   "linear-gradient(160deg, #DDE7C8 0%, #B7C99A 100%)",
  coral:  "linear-gradient(160deg, #FF8166 0%, #E0524C 100%)",
  ink:    "linear-gradient(160deg, #2E1A14 0%, #1A0E0B 100%)",
};

type Props = {
  children?: ReactNode;
  tint?: Tint;
  style?: CSSProperties;
  className?: string;
  id?: string;
  onClick?: () => void;
};

export function ClaySurface({ children, tint = "cream", style, className, id, onClick }: Props) {
  return (
    <div
      id={id}
      className={className}
      onClick={onClick}
      style={{
        background: tints[tint],
        borderRadius: 24,
        boxShadow: `
          inset 0 1.2px 0 rgba(255,255,255,0.7),
          inset 0 -2px 0 rgba(90, 40, 30, 0.06),
          0 18px 36px -16px rgba(80, 30, 30, 0.22),
          0 6px 14px -6px rgba(80, 30, 30, 0.14)
        `,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
