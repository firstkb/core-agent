import type { ReactNode } from "react";

import { useAuth } from "./auth-provider";

type AuthGuardProps = {
  authenticated: ReactNode;
  pending?: ReactNode;
  unauthenticated?: ReactNode;
};

type RequireAuthProps = {
  children: ReactNode;
  fallback?: ReactNode;
  pending?: ReactNode;
};

export function AuthGuard({
  authenticated,
  pending = null,
  unauthenticated = null,
}: AuthGuardProps) {
  const { status } = useAuth();

  if (status === "unknown") {
    return pending;
  }

  if (status === "authenticated") {
    return authenticated;
  }

  return unauthenticated;
}

export function RequireAuth({
  children,
  fallback = null,
  pending = null,
}: RequireAuthProps) {
  const { status } = useAuth();

  if (status === "unknown") {
    return pending;
  }

  if (status !== "authenticated") {
    return fallback;
  }

  return children;
}

export type { AuthGuardProps, RequireAuthProps };
