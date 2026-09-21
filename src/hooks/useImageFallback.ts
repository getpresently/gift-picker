import { useState } from "react";

/**
 * Track an `<img>`'s load state per `src`, so callers can (1) render a
 * fallback (typically the GiftBox3D placeholder) instead of the browser's
 * broken-image icon, and (2) keep a new photo invisible until it has loaded.
 *
 * Usage:
 *
 *   const { failed, onError, loaded, onLoad } = useImageFallback(gift.image);
 *   return gift.image && !failed
 *     ? <img key={gift.image} src={gift.image} onError={onError} onLoad={onLoad}
 *            style={{ opacity: loaded ? 1 : 0 }} />
 *     : <GiftBox3D ... />;
 *
 * The `key` matters: without it React reuses the element and the browser keeps
 * painting the previous gift's photo until the new one arrives. State is keyed
 * by src, so paginating (ProductModal carousel, the review tool) never carries
 * one gift's loaded or failed state over to the next.
 */
export function useImageFallback(src: string | undefined): {
  failed: boolean;
  onError: () => void;
  loaded: boolean;
  onLoad: () => void;
} {
  const [failedSrc, setFailedSrc] = useState<string | undefined>();
  const [loadedSrc, setLoadedSrc] = useState<string | undefined>();
  return {
    failed: !!src && failedSrc === src,
    onError: () => setFailedSrc(src),
    loaded: !!src && loadedSrc === src,
    onLoad: () => setLoadedSrc(src),
  };
}
