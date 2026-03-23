import {
  useSyncExternalStore,
  type CSSProperties,
  type HTMLAttributes,
} from "react";

import { cx } from "../../lib/cx";

export type TopLoaderTone = "brand" | "success" | "warning" | "danger" | "neutral";
export type TopLoaderPhase = "idle" | "running" | "finishing";

export type TopLoaderSnapshot = {
  phase: TopLoaderPhase;
  progress: number;
  visible: boolean;
};

export type TopLoaderController = {
  done: () => void;
  getSnapshot: () => TopLoaderSnapshot;
  inc: (amount?: number) => void;
  reset: () => void;
  set: (value: number) => void;
  start: () => void;
  subscribe: (listener: () => void) => () => void;
};

export type TopLoaderControllerOptions = {
  finishDelay?: number;
  minimum?: number;
  trickleInterval?: number;
  trickleMaximum?: number;
};

export type TopLoaderProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  controller: TopLoaderController;
  insetBlockStart?: CSSProperties["top"];
  tone?: TopLoaderTone;
  zIndex?: number;
};

function clampProgress(value: number) {
  return Math.min(Math.max(value, 0), 1);
}

function getNextTrickleProgress(progress: number, trickleMaximum: number) {
  if (progress >= trickleMaximum) {
    return trickleMaximum;
  }

  const remaining = trickleMaximum - progress;
  return Math.min(progress + Math.max(remaining * 0.08, 0.01), trickleMaximum);
}

export function createTopLoaderController({
  finishDelay = 180,
  minimum = 0.08,
  trickleInterval = 260,
  trickleMaximum = 0.92,
}: TopLoaderControllerOptions = {}): TopLoaderController {
  const listeners = new Set<() => void>();
  const safeMinimum = clampProgress(minimum);
  const safeTrickleMaximum = Math.max(safeMinimum, clampProgress(trickleMaximum));

  let trickleTimer: ReturnType<typeof setInterval> | null = null;
  let finishTimer: ReturnType<typeof setTimeout> | null = null;
  let snapshot: TopLoaderSnapshot = {
    phase: "idle",
    progress: 0,
    visible: false,
  };

  function emit() {
    listeners.forEach((listener) => listener());
  }

  function setSnapshot(nextSnapshot: TopLoaderSnapshot) {
    snapshot = nextSnapshot;
    emit();
  }

  function clearTrickleTimer() {
    if (!trickleTimer) {
      return;
    }

    clearInterval(trickleTimer);
    trickleTimer = null;
  }

  function clearFinishTimer() {
    if (!finishTimer) {
      return;
    }

    clearTimeout(finishTimer);
    finishTimer = null;
  }

  function ensureTrickling() {
    if (trickleTimer) {
      return;
    }

    trickleTimer = setInterval(() => {
      if (snapshot.phase !== "running") {
        return;
      }

      setSnapshot({
        phase: "running",
        progress: getNextTrickleProgress(snapshot.progress, safeTrickleMaximum),
        visible: true,
      });
    }, trickleInterval);
  }

  function reset() {
    clearTrickleTimer();
    clearFinishTimer();
    setSnapshot({
      phase: "idle",
      progress: 0,
      visible: false,
    });
  }

  function start() {
    clearFinishTimer();

    const nextProgress =
      snapshot.phase === "finishing"
        ? safeMinimum
        : snapshot.progress > 0
          ? Math.min(snapshot.progress, safeTrickleMaximum)
          : safeMinimum;

    setSnapshot({
      phase: "running",
      progress: nextProgress,
      visible: true,
    });

    ensureTrickling();
  }

  function set(value: number) {
    clearFinishTimer();
    clearTrickleTimer();

    const nextProgress = clampProgress(value);

    if (nextProgress >= 1) {
      setSnapshot({
        phase: "finishing",
        progress: 1,
        visible: true,
      });

      finishTimer = setTimeout(() => {
        reset();
      }, finishDelay);

      return;
    }

    setSnapshot({
      phase: "running",
      progress: Math.max(nextProgress, safeMinimum),
      visible: true,
    });

    ensureTrickling();
  }

  function inc(amount?: number) {
    const nextAmount =
      typeof amount === "number" ? amount : Math.max((safeTrickleMaximum - snapshot.progress) * 0.12, 0.02);

    if (snapshot.phase === "idle") {
      start();
    }

    set(Math.min(snapshot.progress + nextAmount, safeTrickleMaximum));
  }

  function done() {
    if (snapshot.phase === "idle" && !snapshot.visible) {
      return;
    }

    clearTrickleTimer();
    clearFinishTimer();

    setSnapshot({
      phase: "finishing",
      progress: 1,
      visible: true,
    });

    finishTimer = setTimeout(() => {
      reset();
    }, finishDelay);
  }

  return {
    done,
    getSnapshot: () => snapshot,
    inc,
    reset,
    set,
    start,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export function TopLoader({
  className,
  controller,
  insetBlockStart = 0,
  style,
  tone = "brand",
  zIndex = 1100,
  ...props
}: TopLoaderProps) {
  const snapshot = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  );

  return (
    <div
      {...props}
      aria-hidden="true"
      className={cx(
        "ui-top-loader",
        snapshot.visible && "ui-top-loader--visible",
        snapshot.phase === "finishing" && "ui-top-loader--finishing",
        className,
      )}
      style={{
        ...style,
        insetBlockStart,
        zIndex,
      }}
    >
      <div className="ui-top-loader__track">
        <div
          className={cx("ui-top-loader__indicator", `ui-top-loader__indicator--${tone}`)}
          style={{ transform: `scaleX(${snapshot.progress})` }}
        />
      </div>
    </div>
  );
}
