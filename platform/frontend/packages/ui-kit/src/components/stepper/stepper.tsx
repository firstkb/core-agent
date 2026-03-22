import {
  createContext,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
  useContext,
  useId,
  useMemo,
  useRef,
} from "react";

import { cx } from "../../lib/cx";
import { composeEventHandlers } from "../../lib/refs";
import { useControllableState } from "../../lib/use-controllable-state";

export type StepperOrientation = "horizontal" | "vertical";
export type StepperItemState = "active" | "completed" | "inactive";

type StepperContextValue = {
  activeStep: number;
  baseId: string;
  focusFirst: () => void;
  focusLast: () => void;
  focusNext: (step: number) => void;
  focusPrevious: (step: number) => void;
  orientation: StepperOrientation;
  registerTrigger: (step: number, node: HTMLButtonElement | null) => void;
  setActiveStep: (step: number) => void;
};

type StepperItemContextValue = {
  disabled: boolean;
  state: StepperItemState;
  step: number;
};

const StepperContext = createContext<StepperContextValue | null>(null);
const StepperItemContext = createContext<StepperItemContextValue | null>(null);

function useStepperContext() {
  const context = useContext(StepperContext);

  if (!context) {
    throw new Error("Stepper primitives must be used inside a Stepper root.");
  }

  return context;
}

function useStepperItemContext() {
  const context = useContext(StepperItemContext);

  if (!context) {
    throw new Error("Stepper item primitives must be used inside a StepperItem.");
  }

  return context;
}

type TriggerMap = Map<number, HTMLButtonElement | null>;

function getInteractiveSteps(triggerMap: TriggerMap) {
  return Array.from(triggerMap.entries())
    .filter((entry): entry is [number, HTMLButtonElement] => Boolean(entry[1]) && !entry[1]?.disabled)
    .sort((left, right) => left[0] - right[0]);
}

export type StepperProps = {
  children: ReactNode;
  defaultValue?: number;
  onValueChange?: (step: number) => void;
  orientation?: StepperOrientation;
  value?: number;
};

export function Stepper({
  children,
  defaultValue = 1,
  onValueChange,
  orientation = "horizontal",
  value,
}: StepperProps) {
  const baseId = useId();
  const triggerMapRef = useRef<TriggerMap>(new Map());
  const [activeStep, setActiveStep] = useControllableState({
    defaultValue,
    onChange: onValueChange,
    value,
  });

  const contextValue = useMemo<StepperContextValue>(() => {
    function focusNext(step: number) {
      const steps = getInteractiveSteps(triggerMapRef.current);

      if (!steps.length) return;

      const currentIndex = steps.findIndex(([candidateStep]) => candidateStep === step);
      const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % steps.length : 0;
      steps[nextIndex]?.[1].focus();
    }

    function focusPrevious(step: number) {
      const steps = getInteractiveSteps(triggerMapRef.current);

      if (!steps.length) return;

      const currentIndex = steps.findIndex(([candidateStep]) => candidateStep === step);
      const previousIndex = currentIndex >= 0 ? (currentIndex - 1 + steps.length) % steps.length : steps.length - 1;
      steps[previousIndex]?.[1].focus();
    }

    return {
      activeStep,
      baseId,
      focusFirst: () => {
        const [first] = getInteractiveSteps(triggerMapRef.current);
        first?.[1].focus();
      },
      focusLast: () => {
        const steps = getInteractiveSteps(triggerMapRef.current);
        steps.at(-1)?.[1].focus();
      },
      focusNext,
      focusPrevious,
      orientation,
      registerTrigger: (step, node) => {
        triggerMapRef.current.set(step, node);
      },
      setActiveStep,
    };
  }, [activeStep, baseId, orientation, setActiveStep]);

  return (
    <StepperContext.Provider value={contextValue}>
      <div className="ui-stepper" data-orientation={orientation}>
        {children}
      </div>
    </StepperContext.Provider>
  );
}

export function StepperNav({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  const { orientation } = useStepperContext();

  return (
    <div
      {...props}
      aria-orientation={orientation}
      className={cx("ui-stepper__nav", `ui-stepper__nav--${orientation}`, className)}
      role="tablist"
    />
  );
}

export type StepperItemProps = HTMLAttributes<HTMLDivElement> & {
  disabled?: boolean;
  step: number;
};

export function StepperItem({
  children,
  className,
  disabled = false,
  step,
  ...props
}: StepperItemProps) {
  const { activeStep, orientation } = useStepperContext();
  const state: StepperItemState =
    step === activeStep ? "active" : step < activeStep ? "completed" : "inactive";

  const contextValue = useMemo(
    () => ({
      disabled,
      state,
      step,
    }),
    [disabled, state, step],
  );

  return (
    <StepperItemContext.Provider value={contextValue}>
      <div
        {...props}
        className={cx(
          "ui-stepper__item",
          `ui-stepper__item--${orientation}`,
          `ui-stepper__item--${state}`,
          disabled && "ui-stepper__item--disabled",
          className,
        )}
      >
        {children}
      </div>
    </StepperItemContext.Provider>
  );
}

export type StepperTriggerProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type">;

export function StepperTrigger({
  children,
  className,
  disabled,
  onClick,
  onKeyDown,
  ...props
}: StepperTriggerProps) {
  const context = useStepperContext();
  const item = useStepperItemContext();
  const isDisabled = item.disabled || Boolean(disabled);
  const triggerId = `${context.baseId}-trigger-${item.step}`;
  const panelId = `${context.baseId}-panel-${item.step}`;

  return (
    <button
      {...props}
      aria-controls={panelId}
      aria-selected={context.activeStep === item.step}
      className={cx("ui-stepper__trigger", className)}
      disabled={isDisabled}
      id={triggerId}
      onClick={composeEventHandlers(onClick, () => {
        if (!isDisabled) {
          context.setActiveStep(item.step);
        }
      })}
      onKeyDown={composeEventHandlers(onKeyDown, (event) => {
        if (context.orientation === "horizontal") {
          if (event.key === "ArrowRight") {
            event.preventDefault();
            context.focusNext(item.step);
          }

          if (event.key === "ArrowLeft") {
            event.preventDefault();
            context.focusPrevious(item.step);
          }
        } else {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            context.focusNext(item.step);
          }

          if (event.key === "ArrowUp") {
            event.preventDefault();
            context.focusPrevious(item.step);
          }
        }

        if (event.key === "Home") {
          event.preventDefault();
          context.focusFirst();
        }

        if (event.key === "End") {
          event.preventDefault();
          context.focusLast();
        }
      })}
      ref={(node) => context.registerTrigger(item.step, node)}
      role="tab"
      tabIndex={context.activeStep === item.step ? 0 : -1}
      type="button"
    >
      {children}
    </button>
  );
}

export function StepperIndicator({ children, className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  const { state, step } = useStepperItemContext();

  return (
    <span
      {...props}
      aria-hidden="true"
      className={cx("ui-stepper__indicator", `ui-stepper__indicator--${state}`, className)}
    >
      {children ?? (state === "completed" ? "✓" : step)}
    </span>
  );
}

export function StepperTitle({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span {...props} className={cx("ui-stepper__title", className)} />;
}

export function StepperDescription({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span {...props} className={cx("ui-stepper__description", className)} />;
}

export function StepperSeparator({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  const { orientation } = useStepperContext();
  const { state } = useStepperItemContext();

  return (
    <div
      {...props}
      aria-hidden="true"
      className={cx(
        "ui-stepper__separator",
        `ui-stepper__separator--${orientation}`,
        state === "completed" && "ui-stepper__separator--completed",
        className,
      )}
    />
  );
}

export type StepperPanelProps = HTMLAttributes<HTMLDivElement> & {
  forceMount?: boolean;
  step: number;
};

export function StepperPanel({
  children,
  className,
  forceMount = false,
  step,
  ...props
}: StepperPanelProps) {
  const { activeStep, baseId } = useStepperContext();
  const isActive = activeStep === step;

  if (!forceMount && !isActive) {
    return null;
  }

  return (
    <div
      {...props}
      aria-labelledby={`${baseId}-trigger-${step}`}
      className={cx("ui-stepper__panel", className)}
      hidden={!isActive}
      id={`${baseId}-panel-${step}`}
      role="tabpanel"
      tabIndex={0}
    >
      {children}
    </div>
  );
}
