import { useEffect, useState } from "react";

/**
 * Track whether an `<img>` failed to load so the caller can render a
 * fallback (typically the GiftBox3D placeholder) instead of leaving the
 * browser's broken-image icon + alt text visible.
 *
 * Usage:
 *
 *   const { failed, onError } = useImageFallback(gift.image);
 *   return gift.image && !failed
 *     ? <img src={gift.image} onError={onError} ... />
 *     : <GiftBox3D ... />;
 *
 * The failure state resets whenever `src` changes — important for the
 * ProductModal's carousel, where the user can paginate from a broken-
 * image gift to a working one without the next image being suppressed.
 */
export function useImageFallback(src: string | undefined): {
  failed: boolean;
  onError: () => void;
} {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setFailed(false);
  }, [src]);
  return {
    failed,
    onError: () => setFailed(true),
  };
}
