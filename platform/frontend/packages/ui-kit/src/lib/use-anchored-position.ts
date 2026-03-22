import { useEffect, useState, type CSSProperties, type RefObject } from "react";

export type OverlaySide = "top" | "right" | "bottom" | "left";
export type OverlayAlign = "start" | "center" | "end";

type UseAnchoredPositionOptions = {
  open: boolean;
  anchorRef: RefObject<HTMLElement | null>;
  contentRef: RefObject<HTMLElement | null>;
  side?: OverlaySide;
  align?: OverlayAlign;
  sideOffset?: number;
  viewportPadding?: number;
};

function clamp(value: number, min: number, max: number) {
  if (max < min) {
    return min;
  }

  return Math.min(Math.max(value, min), max);
}

function getOppositeSide(side: OverlaySide): OverlaySide {
  switch (side) {
    case "top":
      return "bottom";
    case "right":
      return "left";
    case "bottom":
      return "top";
    case "left":
      return "right";
    default:
      return "bottom";
  }
}

function fitsPreferredSide(
  side: OverlaySide,
  anchorRect: DOMRect,
  contentRect: DOMRect,
  sideOffset: number,
  viewportPadding: number,
) {
  switch (side) {
    case "top":
      return anchorRect.top - contentRect.height - sideOffset >= viewportPadding;
    case "right":
      return anchorRect.right + contentRect.width + sideOffset <= window.innerWidth - viewportPadding;
    case "bottom":
      return anchorRect.bottom + contentRect.height + sideOffset <= window.innerHeight - viewportPadding;
    case "left":
      return anchorRect.left - contentRect.width - sideOffset >= viewportPadding;
    default:
      return true;
  }
}

function resolvePosition(
  side: OverlaySide,
  align: OverlayAlign,
  anchorRect: DOMRect,
  contentRect: DOMRect,
  sideOffset: number,
  viewportPadding: number,
) {
  let top = 0;
  let left = 0;

  switch (side) {
    case "top":
      top = anchorRect.top - contentRect.height - sideOffset;
      break;
    case "right":
      left = anchorRect.right + sideOffset;
      break;
    case "bottom":
      top = anchorRect.bottom + sideOffset;
      break;
    case "left":
      left = anchorRect.left - contentRect.width - sideOffset;
      break;
    default:
      break;
  }

  if (side === "top" || side === "bottom") {
    switch (align) {
      case "start":
        left = anchorRect.left;
        break;
      case "center":
        left = anchorRect.left + anchorRect.width / 2 - contentRect.width / 2;
        break;
      case "end":
        left = anchorRect.right - contentRect.width;
        break;
      default:
        break;
    }
  } else {
    switch (align) {
      case "start":
        top = anchorRect.top;
        break;
      case "center":
        top = anchorRect.top + anchorRect.height / 2 - contentRect.height / 2;
        break;
      case "end":
        top = anchorRect.bottom - contentRect.height;
        break;
      default:
        break;
    }
  }

  const maxTop = Math.max(viewportPadding, window.innerHeight - contentRect.height - viewportPadding);
  const maxLeft = Math.max(viewportPadding, window.innerWidth - contentRect.width - viewportPadding);

  return {
    top: clamp(top, viewportPadding, maxTop),
    left: clamp(left, viewportPadding, maxLeft),
  };
}

export function useAnchoredPosition({
  open,
  anchorRef,
  contentRef,
  side = "bottom",
  align = "start",
  sideOffset = 8,
  viewportPadding = 12,
}: UseAnchoredPositionOptions) {
  const [style, setStyle] = useState<CSSProperties>({
    left: viewportPadding,
    position: "fixed",
    top: viewportPadding,
  });

  useEffect(() => {
    if (!open || typeof window === "undefined") {
      return;
    }

    function updatePosition() {
      const anchorElement = anchorRef.current;
      const contentElement = contentRef.current;

      if (!anchorElement || !contentElement) {
        return;
      }

      const anchorRect = anchorElement.getBoundingClientRect();
      const contentRect = contentElement.getBoundingClientRect();
      const preferredSide = fitsPreferredSide(
        side,
        anchorRect,
        contentRect,
        sideOffset,
        viewportPadding,
      )
        ? side
        : getOppositeSide(side);
      const nextPosition = resolvePosition(
        preferredSide,
        align,
        anchorRect,
        contentRect,
        sideOffset,
        viewportPadding,
      );

      setStyle({
        left: nextPosition.left,
        position: "fixed",
        top: nextPosition.top,
      });
    }

    updatePosition();

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [align, anchorRef, contentRef, open, side, sideOffset, viewportPadding]);

  return style;
}
