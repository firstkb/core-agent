import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useBeforeUnload,
} from "react-router-dom";

declare global {
  interface Window {
    __tenantPlatformStudioLeaveGuard?: () => boolean | Promise<boolean>;
  }
}

type UseFormBuilderLeaveGuardInput = {
  hasUnsavedChanges: boolean;
  onNavigate: (path: string) => void;
};

export function useFormBuilderLeaveGuard({
  hasUnsavedChanges,
  onNavigate,
}: UseFormBuilderLeaveGuardInput) {
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const pendingNavigationPathRef = useRef<string | null>(null);
  const pendingLeaveResolverRef = useRef<((value: boolean) => void) | null>(null);

  useBeforeUnload((event) => {
    if (!hasUnsavedChanges) {
      return;
    }

    event.preventDefault();
    event.returnValue = "";
  });

  useEffect(() => {
    window.__tenantPlatformStudioLeaveGuard = () => {
      if (!hasUnsavedChanges) {
        return true;
      }

      return new Promise<boolean>((resolve) => {
        pendingLeaveResolverRef.current = resolve;
        pendingNavigationPathRef.current = null;
        setLeaveConfirmOpen(true);
      });
    };

    return () => {
      if (window.__tenantPlatformStudioLeaveGuard) {
        delete window.__tenantPlatformStudioLeaveGuard;
      }
    };
  }, [hasUnsavedChanges]);

  const resolveLeaveConfirmation = useCallback((shouldLeave: boolean) => {
    const pendingPath = pendingNavigationPathRef.current;
    const pendingResolver = pendingLeaveResolverRef.current;

    pendingNavigationPathRef.current = null;
    pendingLeaveResolverRef.current = null;
    setLeaveConfirmOpen(false);

    if (pendingResolver) {
      pendingResolver(shouldLeave);
      return;
    }

    if (shouldLeave && pendingPath) {
      onNavigate(pendingPath);
    }
  }, [onNavigate]);

  const requestNavigate = useCallback((nextPath: string) => {
    if (!hasUnsavedChanges) {
      onNavigate(nextPath);
      return;
    }

    pendingNavigationPathRef.current = nextPath;
    pendingLeaveResolverRef.current = null;
    setLeaveConfirmOpen(true);
  }, [hasUnsavedChanges, onNavigate]);

  const onLeaveConfirmOpenChange = useCallback((open: boolean) => {
    if (!open && leaveConfirmOpen) {
      resolveLeaveConfirmation(false);
    }
  }, [leaveConfirmOpen, resolveLeaveConfirmation]);

  return {
    leaveConfirmOpen,
    onLeaveConfirmOpenChange,
    requestNavigate,
    resolveLeaveConfirmation,
  } as const;
}
