import { afterEach, describe, expect, it, vi } from "vitest";

import { createAdminEmployeesClient, createAuthClient } from "./index";

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

describe("api-client admin employees", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads employee detail from the admin employees endpoint", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({
        data: {
          user: {
            createdAt: "2026-04-06T12:00:00Z",
            email: "admin@platform.local",
            id: "11111111-1111-1111-1111-111111111111",
            isCurrentUser: false,
            name: "Platform Admin",
            phone: "5551001",
            role: "admin",
            status: "active",
          },
        },
        status: "ok",
      }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }));

    vi.stubGlobal("fetch", fetchMock);

    const out = await createAdminEmployeesClient("/admin-api").getEmployee(
      "token",
      "11111111-1111-1111-1111-111111111111",
    );

    expect(out.user.id).toBe("11111111-1111-1111-1111-111111111111");
    expect(out.user.createdAt).toBe("2026-04-06T12:00:00Z");
    expect(fetchMock).toHaveBeenCalledWith(
      "/admin-api/app/admin/employees/11111111-1111-1111-1111-111111111111",
      expect.objectContaining({
        headers: expect.any(Headers),
        method: "GET",
      }),
    );
  });

  it("updates employee detail through the admin employees endpoint", async () => {
    const fetchMock = vi.fn(async (_input: string, init?: RequestInit) =>
      new Response(JSON.stringify({
        data: {
          user: {
            email: "admin@platform.local",
            id: "11111111-1111-1111-1111-111111111111",
            name: "Updated Admin",
            phone: "5551002",
            status: "disabled",
          },
        },
        status: "ok",
      }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }));

    vi.stubGlobal("fetch", fetchMock);

    const out = await createAdminEmployeesClient("/admin-api").updateEmployee(
      "token",
      "11111111-1111-1111-1111-111111111111",
      {
        name: "Updated Admin",
        phone: "5551002",
        status: "disabled",
      },
    );

    expect(out.user.name).toBe("Updated Admin");
    expect(out.user.status).toBe("disabled");
    expect(fetchMock).toHaveBeenCalledWith(
      "/admin-api/app/admin/employees/11111111-1111-1111-1111-111111111111",
      expect.objectContaining({
        body: JSON.stringify({
          name: "Updated Admin",
          phone: "5551002",
          status: "disabled",
        }),
        headers: expect.any(Headers),
        method: "PUT",
      }),
    );
  });
});
