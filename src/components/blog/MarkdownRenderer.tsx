import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { renderMarkdown } from "@/lib/markdown";

type PreviewImage = {
  src: string;
  alt: string;
};

type PreviewPan = {
  x: number;
  y: number;
};

type PreviewDrag = {
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
};

const MIN_PREVIEW_SCALE = 0.5;
const MAX_PREVIEW_SCALE = 4;
const PREVIEW_SCALE_STEP = 0.16;

function clampPreviewScale(value: number) {
  return Math.min(MAX_PREVIEW_SCALE, Math.max(MIN_PREVIEW_SCALE, value));
}

function pointerDist(
  a: { clientX: number; clientY: number },
  b: { clientX: number; clientY: number },
) {
  return Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
}

export function MarkdownRenderer({
  markdown,
  className = "prose-blog",
  headingIds = false,
}: {
  markdown: string;
  className?: string;
  headingIds?: boolean;
}) {
  const [previewImage, setPreviewImage] = useState<PreviewImage | null>(null);
  const [previewScale, setPreviewScale] = useState(1);
  const [previewPan, setPreviewPan] = useState<PreviewPan>({ x: 0, y: 0 });
  const [isDraggingPreview, setIsDraggingPreview] = useState(false);
  const previewDrag = useRef<PreviewDrag | null>(null);
  const activePointers = useRef<Map<number, { clientX: number; clientY: number }>>(new Map());
  const pinchBase = useRef<{ distance: number; scale: number } | null>(null);
  const hasMoved = useRef(false);
  const html = useMemo(() => renderMarkdown(markdown, { headingIds }), [headingIds, markdown]);

  const openPreview = useCallback((target: EventTarget | null) => {
    if (!(target instanceof HTMLImageElement)) return;
    if (target.dataset.markdownImage !== "true") return;
    setPreviewScale(1);
    setPreviewPan({ x: 0, y: 0 });
    previewDrag.current = null;
    setIsDraggingPreview(false);
    setPreviewImage({
      src: target.currentSrc || target.src,
      alt: target.alt || "Blog image",
    });
  }, []);

  const closePreview = useCallback(() => {
    setPreviewImage(null);
    setPreviewScale(1);
    setPreviewPan({ x: 0, y: 0 });
    previewDrag.current = null;
    pinchBase.current = null;
    activePointers.current.clear();
    hasMoved.current = false;
    setIsDraggingPreview(false);
  }, []);

  const zoomPreview = useCallback((delta: number) => {
    setPreviewScale((current) => clampPreviewScale(current + delta));
  }, []);

  useEffect(() => {
    if (!previewImage) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePreview();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [closePreview, previewImage]);

  return (
    <>
      <div
        className={className}
        onClick={(event) => openPreview(event.target)}
        onKeyDown={(event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          if (!(event.target instanceof HTMLImageElement)) return;
          event.preventDefault();
          openPreview(event.target);
        }}
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {previewImage ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/78 px-4 py-6 backdrop-blur-sm sm:px-8"
          role="dialog"
          aria-modal="true"
          aria-label={previewImage.alt ? `Image preview: ${previewImage.alt}` : "Image preview"}
          onClick={closePreview}
          onWheel={(event) => {
            event.preventDefault();
            zoomPreview(event.deltaY < 0 ? PREVIEW_SCALE_STEP : -PREVIEW_SCALE_STEP);
          }}
        >
          <div className="absolute left-4 top-4 z-10 rounded-full border border-white/25 bg-black/30 px-3 py-2 text-xs tabular-nums text-white sm:left-6 sm:top-6">
            {Math.round(previewScale * 100)}%
          </div>
          <button
            type="button"
            className="absolute right-4 top-4 z-10 inline-flex h-10 min-w-10 items-center justify-center rounded-full border border-white/30 bg-black/30 px-3 text-sm text-white transition-colors hover:bg-white/15 focus-visible:outline-white sm:right-6 sm:top-6"
            onClick={closePreview}
            aria-label="Close image preview"
          >
            Close
          </button>
          <div
            className="touch-none select-none"
            style={{
              cursor: isDraggingPreview ? "grabbing" : previewScale > 1 ? "grab" : "zoom-in",
              transform: `translate3d(${previewPan.x}px, ${previewPan.y}px, 0) scale(${previewScale})`,
              transition: isDraggingPreview ? "none" : "transform 100ms ease",
            }}
            onClick={(event) => event.stopPropagation()}
            onDoubleClick={(event) => {
              event.stopPropagation();
              setPreviewScale((current) => {
                if (current > 1) {
                  setPreviewPan({ x: 0, y: 0 });
                  return 1;
                }
                return 2;
              });
            }}
            onPointerDown={(event) => {
              activePointers.current.set(event.pointerId, {
                clientX: event.clientX,
                clientY: event.clientY,
              });

              if (activePointers.current.size === 2) {
                // Two fingers → start pinch
                const [a, b] = [...activePointers.current.values()];
                pinchBase.current = {
                  distance: pointerDist(a, b),
                  scale: previewScale,
                };
                previewDrag.current = null;
                setIsDraggingPreview(false);
                return;
              }

              // Single pointer → prepare drag or tap
              event.currentTarget.setPointerCapture(event.pointerId);
              hasMoved.current = false;
              previewDrag.current = {
                pointerId: event.pointerId,
                startX: event.clientX,
                startY: event.clientY,
                originX: previewPan.x,
                originY: previewPan.y,
              };
              setIsDraggingPreview(true);
            }}
            onPointerMove={(event) => {
              // Update tracked pointer position
              if (activePointers.current.has(event.pointerId)) {
                activePointers.current.set(event.pointerId, {
                  clientX: event.clientX,
                  clientY: event.clientY,
                });
              }

              // Pinch zoom
              if (activePointers.current.size === 2 && pinchBase.current) {
                const [a, b] = [...activePointers.current.values()];
                const dist = pointerDist(a, b);
                const scale =
                  pinchBase.current.scale * (dist / pinchBase.current.distance);
                setPreviewScale(clampPreviewScale(scale));
                return;
              }

              // Single pointer pan
              const drag = previewDrag.current;
              if (!drag || drag.pointerId !== event.pointerId) return;
              const dx = event.clientX - drag.startX;
              const dy = event.clientY - drag.startY;
              if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasMoved.current = true;
              setPreviewPan({
                x: drag.originX + dx,
                y: drag.originY + dy,
              });
            }}
            onPointerUp={(event) => {
              activePointers.current.delete(event.pointerId);

              const drag = previewDrag.current;
              // Tap detection: single pointer, no movement, no pinch
              if (
                drag?.pointerId === event.pointerId &&
                !hasMoved.current &&
                !pinchBase.current
              ) {
                event.currentTarget.releasePointerCapture(event.pointerId);
                previewDrag.current = null;
                setIsDraggingPreview(false);
                closePreview();
                return;
              }

              // End drag
              if (drag?.pointerId === event.pointerId) {
                event.currentTarget.releasePointerCapture(event.pointerId);
                previewDrag.current = null;
                setIsDraggingPreview(false);
              }

              // End pinch when fewer than 2 pointers remain
              if (activePointers.current.size < 2) {
                pinchBase.current = null;
              }
            }}
            onPointerCancel={(event) => {
              activePointers.current.delete(event.pointerId);
              if (activePointers.current.size < 2) pinchBase.current = null;
              if (previewDrag.current?.pointerId === event.pointerId) {
                previewDrag.current = null;
                setIsDraggingPreview(false);
              }
            }}
            onWheel={(event) => {
              event.preventDefault();
              event.stopPropagation();
              zoomPreview(event.deltaY < 0 ? PREVIEW_SCALE_STEP : -PREVIEW_SCALE_STEP);
            }}
          >
            <img
              src={previewImage.src}
              alt={previewImage.alt}
              className="block max-h-[88vh] max-w-[96vw] rounded-lg object-contain shadow-2xl"
              draggable={false}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
