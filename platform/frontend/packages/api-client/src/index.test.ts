import { afterEach, describe, expect, it, vi } from "vitest";

import { createAuthClient } from "./index";

describe("api-client auth bootstrap timeouts", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("fails refresh requests that never resolve with a timeout error", async () => {
    vi.useFakeTimers();

    const fetchMock = vi.fn((_input: string, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => {
        reject(new Error("aborted"));
      });
    }));

    vi.stubGlobal("fetch", fetchMock);

    const refreshPromise = createAuthClient("/auth/v1").refresh();
    const refreshAssertion = expect(refreshPromise).rejects.toMatchObject({
      code: "request_timeout",
      message: "Request timed out.",
      name: "ApiClientError",
    });

    await vi.advanceTimersByTimeAsync(8_000);

    await refreshAssertion;
    expect(fetchMock).toHaveBeenCalledWith(
      "/auth/v1/refresh",
      expect.objectContaining({
        credentials: "include",
        method: "POST",
      }),
    );
  });
});
