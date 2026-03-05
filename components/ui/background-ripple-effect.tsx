"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const GRID_SIZE = 44;
const SPOTLIGHT_SIZE = 300;
const SPOTLIGHT_INNER = SPOTLIGHT_SIZE / 4;
const BASE_MASK =
  "radial-gradient(circle at 50% 0%, black 0%, black 55%, transparent 78%)";

interface BackgroundRippleEffectProps {
  className?: string;
  showAccentGridReveal?: boolean;
}

export function BackgroundRippleEffect({
  className = "absolute inset-0",
  showAccentGridReveal = true,
}: BackgroundRippleEffectProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isDesktopPointer, setIsDesktopPointer] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [grid, setGrid] = useState({ cols: 1, rows: 1 });
  const [mousePosition, setMousePosition] = useState({ x: -9999, y: -9999 });
  const [clickedCell, setClickedCell] = useState<{
    row: number;
    col: number;
  } | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(hover: hover) and (pointer: fine)");
    const motionMedia = window.matchMedia("(prefers-reduced-motion: reduce)");

    const onChange = () => {
      const desktop = media.matches;
      setIsDesktopPointer(desktop);
      setPrefersReducedMotion(motionMedia.matches);
    };

    onChange();
    media.addEventListener("change", onChange);
    motionMedia.addEventListener("change", onChange);
    return () => {
      media.removeEventListener("change", onChange);
      motionMedia.removeEventListener("change", onChange);
    };
  }, []);

  useEffect(() => {
    const target = ref.current;
    if (!target) return;

    const updateGrid = () => {
      const rect = target.getBoundingClientRect();
      setGrid({
        cols: Math.max(1, Math.ceil(rect.width / GRID_SIZE)),
        rows: Math.max(1, Math.ceil(rect.height / GRID_SIZE)),
      });
    };

    updateGrid();
    const observer = new ResizeObserver(updateGrid);
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isDesktopPointer) return;

    const onMove = (event: MouseEvent) => {
      const rect = ref.current?.getBoundingClientRect();
      if (!rect) return;

      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
        setMousePosition({ x: -9999, y: -9999 });
        return;
      }

      setMousePosition({ x, y });
    };

    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [isDesktopPointer]);

  useEffect(() => {
    if (!isDesktopPointer || prefersReducedMotion) return;

    const onPointerDown = (event: PointerEvent) => {
      const rect = ref.current?.getBoundingClientRect();
      if (!rect) return;

      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
        return;
      }

      const col = Math.floor(x / GRID_SIZE);
      const row = Math.floor(y / GRID_SIZE);
      setClickedCell({ row, col });
    };

    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [isDesktopPointer, prefersReducedMotion]);

  const cellCount = grid.cols * grid.rows;
  const isInteractive = isDesktopPointer && !prefersReducedMotion;
  const spotlightLeft = mousePosition.x - SPOTLIGHT_SIZE / 2;
  const spotlightTop = mousePosition.y - SPOTLIGHT_SIZE / 2;

  return (
    <div ref={ref} className={className}>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right, hsl(0 0% 100% / 0.06) 1px, transparent 1px), linear-gradient(to bottom, hsl(0 0% 100% / 0.06) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: BASE_MASK,
          WebkitMaskImage: BASE_MASK,
        }}
      />

      {isInteractive && showAccentGridReveal ? (
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            maskImage: BASE_MASK,
            WebkitMaskImage: BASE_MASK,
          }}
        >
          <div
            className="absolute"
            style={{
              left: mousePosition.x,
              top: mousePosition.y,
              width: SPOTLIGHT_SIZE,
              height: SPOTLIGHT_SIZE,
              transform: "translate(-50%, -50%)",
              backgroundImage:
                "linear-gradient(to right, hsl(210 72% 62% / 0.5) 1px, transparent 1px), linear-gradient(to bottom, hsl(210 72% 62% / 0.5) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
              // Lock reveal grid lines to the same origin as the base grid.
              backgroundPosition: `${-spotlightLeft}px ${-spotlightTop}px`,
              maskImage: `radial-gradient(${SPOTLIGHT_INNER}px circle at center, white, transparent)`,
              WebkitMaskImage: `radial-gradient(${SPOTLIGHT_INNER}px circle at center, white, transparent)`,
            }}
          />
        </div>
      ) : null}

      {isInteractive ? (
        <div
          className="absolute inset-0 z-20 grid"
          style={{
            gridTemplateColumns: `repeat(${grid.cols}, ${GRID_SIZE}px)`,
            gridAutoRows: `${GRID_SIZE}px`,
            maskImage: BASE_MASK,
            WebkitMaskImage: BASE_MASK,
          }}
        >
          {Array.from({ length: cellCount }, (_, index) => {
            const row = Math.floor(index / grid.cols);
            const col = index % grid.cols;
            const distance = clickedCell
              ? Math.sqrt(
                  Math.pow(clickedCell.row - row, 2) +
                    Math.pow(clickedCell.col - col, 2),
                )
              : null;
            const clickPeakOpacity =
              distance === null ? 0 : Math.max(0, 1 - distance * 0.1);
            const clickDuration =
              distance === null ? 0.1 : Math.max(0.15, distance * 0.2);

            return (
              <div key={index} className="overflow-hidden">
                <motion.div
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: [0, 1, 0.5] }}
                  transition={{ duration: 0.5, ease: "backOut" }}
                  animate={
                    clickedCell
                      ? {
                          opacity: [0, clickPeakOpacity, 0],
                          transition: { duration: clickDuration },
                        }
                      : { opacity: 0 }
                  }
                  className="h-full w-full bg-[rgba(14,165,233,0.2)]"
                />
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export const SubtleBackgroundGrid = BackgroundRippleEffect;
