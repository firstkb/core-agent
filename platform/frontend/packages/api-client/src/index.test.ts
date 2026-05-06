import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ApiClientError,
  createAdminEmployeesClient,
  createAuthClient,
  createTenantBusinessTreeClient,
  createTenantFormBuilderAuthoringClient,
  createTenantFormBuilderDraftClient,
  createTenantNavigationClient,
  getApiClientRequestActivitySnapshot,
  requestWithUnauthorizedRetry,
  subscribeApiClientRequestActivity,
} from "./index";

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
    const fetchMock = vi.fn(async () =>
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

describe("api-client unauthorized recovery", () => {
  it("retries once with a recovered access token", async () => {
    const request = vi.fn(async (accessToken: string) => {
      if (accessToken === "stale-token") {
        throw new ApiClientError("Request failed with status 401.", {
          statusCode: 401,
        });
      }

      return { accessToken };
    });
    const recoverUnauthorized = vi.fn(async () => "fresh-token");

    await expect(
      requestWithUnauthorizedRetry(request, {
        accessToken: "stale-token",
        onUnauthorized: recoverUnauthorized,
      }),
    ).resolves.toEqual({ accessToken: "fresh-token" });

    expect(recoverUnauthorized).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenNthCalledWith(1, "stale-token");
    expect(request).toHaveBeenNthCalledWith(2, "fresh-token");
  });

  it("does not retry for domain-level forbidden errors", async () => {
    const request = vi.fn(async () => {
      throw new ApiClientError("model structure is read-only for this model type", {
        code: "FORM_BUILDER_MODEL_STRUCTURE_READ_ONLY",
        statusCode: 403,
      });
    });
    const recoverUnauthorized = vi.fn(async () => "fresh-token");

    await expect(
      requestWithUnauthorizedRetry(request, {
        accessToken: "stale-token",
        onUnauthorized: recoverUnauthorized,
      }),
    ).rejects.toMatchObject({
      code: "FORM_BUILDER_MODEL_STRUCTURE_READ_ONLY",
      statusCode: 403,
    });

    expect(recoverUnauthorized).not.toHaveBeenCalled();
    expect(request).toHaveBeenCalledTimes(1);
  });
});

describe("api-client tenant business tree", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads lazy tree children from the tenant api", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({
        data: {
          nodes: [
            {
              childCount: 2,
              expandable: true,
              id: "company:7",
              kind: "company",
              label: "General Company @ GDC",
            },
          ],
          parentId: "root",
        },
        status: "ok",
      }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }));

    vi.stubGlobal("fetch", fetchMock);

    const out = await createTenantBusinessTreeClient("/tenant-api").getNodes("token", "root");

    expect(out.parentId).toBe("root");
    expect(out.nodes[0]).toMatchObject({
      childCount: 2,
      expandable: true,
      id: "company:7",
      kind: "company",
      label: "General Company @ GDC",
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/tenant-api/app/pages/business-tree/nodes?parent=root",
      expect.objectContaining({
        headers: expect.any(Headers),
        method: "GET",
      }),
    );
  });
});

describe("api-client tenant navigation", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads Navigation Builder config from the tenant api", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({
        data: {
          configKey: "default",
          definition: {
            appMenu: [
              {
                active: true,
                children: [],
                id: "nav.title.operations",
                label: "Operations",
                type: "menu_title",
              },
            ],
            schemaVersion: 1,
            utilityRail: [],
          },
          validationSummary: {
            canSave: true,
            errors: [],
            warnings: [],
          },
          version: 1,
        },
        status: "ok",
      }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }));

    vi.stubGlobal("fetch", fetchMock);

    const out = await createTenantNavigationClient("/tenant-api").loadConfig("token");

    expect(out.definition.appMenu[0]).toMatchObject({
      id: "nav.title.operations",
      label: "Operations",
      type: "menu_title",
    });
    expect(out.version).toBe(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "/tenant-api/app/platform-studio/navigation",
      expect.objectContaining({
        headers: expect.any(Headers),
        method: "GET",
      }),
    );
  });

  it("saves Navigation Builder config with optimistic version", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({
        data: {
          configKey: "default",
          definition: {
            appMenu: [],
            schemaVersion: 1,
            utilityRail: [],
          },
          validationSummary: {
            canSave: true,
            errors: [],
            warnings: [],
          },
          version: 2,
        },
        status: "ok",
      }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }));

    vi.stubGlobal("fetch", fetchMock);

    const out = await createTenantNavigationClient("/tenant-api").saveConfig("token", {
      definition: {
        appMenu: [],
        schemaVersion: 1,
        utilityRail: [],
      },
      expectedVersion: 1,
    });

    expect(out.version).toBe(2);
    expect(fetchMock).toHaveBeenCalledWith(
      "/tenant-api/app/platform-studio/navigation",
      expect.objectContaining({
        body: JSON.stringify({
          definition: {
            appMenu: [],
            schemaVersion: 1,
            utilityRail: [],
          },
          expectedVersion: 1,
        }),
        headers: expect.any(Headers),
        method: "PUT",
      }),
    );
  });

  it("loads runtime sidebar navigation from the tenant api", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({
        data: {
          items: [
            {
              breadcrumb: ["Safety", "Inspections"],
              children: [],
              id: "nav.entry.safety.inspections",
              label: "Inspections",
              path: "/app/forms/sor/views/view-default",
              targetType: "form_view",
              type: "form_view",
            },
          ],
        },
        status: "ok",
      }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }));

    vi.stubGlobal("fetch", fetchMock);

    const out = await createTenantNavigationClient("/tenant-api").getRuntimeNavigation("token");

    expect(out.items[0]).toMatchObject({
      breadcrumb: ["Safety", "Inspections"],
      id: "nav.entry.safety.inspections",
      path: "/app/forms/sor/views/view-default",
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/tenant-api/app/navigation",
      expect.objectContaining({
        headers: expect.any(Headers),
        method: "GET",
      }),
    );
  });
});

describe("api-client tenant form builder draft", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads a form builder draft from the tenant api", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({
        data: {
          draft: {
            model: {
              id: "safety-incident",
            },
            view: {
              viewTitle: "Incident Intake",
            },
          },
          publishState: {
            hasUnpublishedChanges: true,
            modelPublishedVersion: 0,
            modelVersion: 2,
            viewPublishedVersion: 0,
            viewVersion: 3,
          },
          validationSummary: {
            canPublish: false,
            canSave: true,
            errors: [],
            warnings: [],
          },
        },
        status: "ok",
      }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }));

    vi.stubGlobal("fetch", fetchMock);

    const out = await createTenantFormBuilderDraftClient("/tenant-api").loadDraft(
      "token",
      "safety-incident",
      "default-view",
    );

    expect(out.draft.model.id).toBe("safety-incident");
    expect(out.publishState.viewVersion).toBe(3);
    expect(fetchMock).toHaveBeenCalledWith(
      "/tenant-api/app/platform-studio/forms/models/safety-incident/views/default-view/authoring",
      expect.objectContaining({
        headers: expect.any(Headers),
        method: "GET",
      }),
    );
  });

  it("saves a form builder draft through the tenant api", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({
        data: {
          draft: {
            model: {
              id: "safety-incident",
            },
            view: {
              viewTitle: "Incident Intake",
            },
          },
          publishState: {
            hasUnpublishedChanges: true,
            modelPublishedVersion: 0,
            modelVersion: 4,
            viewPublishedVersion: 0,
            viewVersion: 6,
          },
          validationSummary: {
            canPublish: false,
            canSave: true,
            errors: [],
            warnings: [],
          },
        },
        status: "ok",
      }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }));

    vi.stubGlobal("fetch", fetchMock);

    const out = await createTenantFormBuilderDraftClient("/tenant-api").saveDraft(
      "token",
      "safety-incident",
      "default-view",
      {
        draft: {
          model: { id: "safety-incident" },
          view: { viewTitle: "Incident Intake" },
        },
        expectedVersions: {
          model: 3,
          view: 5,
        },
      },
    );

    expect(out.publishState.modelVersion).toBe(4);
    expect(fetchMock).toHaveBeenCalledWith(
      "/tenant-api/app/platform-studio/forms/models/safety-incident/views/default-view/authoring",
      expect.objectContaining({
        body: JSON.stringify({
          draft: {
            model: { id: "safety-incident" },
            view: { viewTitle: "Incident Intake" },
          },
          expectedVersions: {
            model: 3,
            view: 5,
          },
        }),
        headers: expect.any(Headers),
        method: "PUT",
      }),
    );
  });
});

describe("api-client tenant form builder authoring", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("lists form builder models from the tenant api", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({
        data: {
          items: [
            {
              canEditViewsOnly: false,
              displayName: "Site Audit",
              id: "site-audit",
              isStructureLocked: false,
              key: "site-audit",
              modelStructureVersion: 3,
              name: "Site Audit",
              storageKey: "site_audit",
              title: "Site Audit",
              version: 4,
            },
          ],
        },
        status: "ok",
      }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }));

    vi.stubGlobal("fetch", fetchMock);

    const out = await createTenantFormBuilderAuthoringClient("/tenant-api").listModels("token");

    expect(out).toEqual([
      expect.objectContaining({
        displayName: "Site Audit",
        id: "site-audit",
        key: "site-audit",
        modelStructureVersion: 3,
      }),
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      "/tenant-api/app/platform-studio/forms/models",
      expect.objectContaining({
        headers: expect.any(Headers),
        method: "GET",
      }),
    );
  });

  it("creates a model and returns the selected first view", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({
        data: {
          canEditViewsOnly: false,
          displayName: "Customer Profile",
          fields: [],
          id: "customer-profile",
          isStructureLocked: false,
          key: "customer-profile",
          modelStructureVersion: 1,
          name: "Customer Profile",
          selectedViewId: "view_customer_profile_default",
          storageKey: "customer_profile",
          title: "Customer Profile",
          version: 1,
          views: [
            {
              displayName: "Customer Profile",
              id: "view_customer_profile_default",
              isActive: true,
              isDefault: true,
              isViewLocked: false,
              key: "default",
              kind: "form",
              lastAlignedModelStructureVersion: 1,
              modelId: "customer-profile",
              name: "Customer Profile",
              title: "Customer Profile",
              version: 1,
            },
          ],
        },
        status: "ok",
      }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }));

    vi.stubGlobal("fetch", fetchMock);

    const out = await createTenantFormBuilderAuthoringClient("/tenant-api").createModel("token", {
      title: "Customer Profile",
    });

    expect(out.selectedViewId).toBe("view_customer_profile_default");
    expect(out.views[0]?.id).toBe("view_customer_profile_default");
    expect(out.views[0]?.key).toBe("default");
    expect(fetchMock).toHaveBeenCalledWith(
      "/tenant-api/app/platform-studio/forms/models",
      expect.objectContaining({
        body: JSON.stringify({
          title: "Customer Profile",
        }),
        headers: expect.any(Headers),
        method: "POST",
      }),
    );
  });
});

describe("api-client request activity", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("tracks inflight api requests until the last concurrent request finishes", async () => {
    function createDeferredResponse() {
      let resolve!: (response: Response) => void;
      const promise = new Promise<Response>((nextResolve) => {
        resolve = nextResolve;
      });

      return { promise, resolve };
    }

    const firstRequestResponse = createDeferredResponse();
    const secondRequestResponse = createDeferredResponse();

    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => firstRequestResponse.promise)
      .mockImplementationOnce(() => secondRequestResponse.promise);

    vi.stubGlobal("fetch", fetchMock);

    const activityCounts: number[] = [];
    const unsubscribe = subscribeApiClientRequestActivity(() => {
      activityCounts.push(getApiClientRequestActivitySnapshot().activeRequestCount);
    });

    const client = createTenantFormBuilderAuthoringClient("/tenant-api");
    const firstRequest = client.getModel("token", "first-model");
    const secondRequest = client.getModel("token", "second-model");

    expect(getApiClientRequestActivitySnapshot().activeRequestCount).toBe(2);

    firstRequestResponse.resolve(new Response(JSON.stringify({
      data: {
        canEditViewsOnly: false,
        displayName: "First model",
        fields: [],
        id: "first-model",
        isStructureLocked: false,
        key: "first-model",
        modelStructureVersion: 1,
        name: "First model",
        storageKey: "first_model",
        title: "First model",
        version: 1,
        views: [],
      },
      status: "ok",
    }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    }));

    await firstRequest;
    expect(getApiClientRequestActivitySnapshot().activeRequestCount).toBe(1);

    secondRequestResponse.resolve(new Response(JSON.stringify({
      data: {
        canEditViewsOnly: false,
        displayName: "Second model",
        fields: [],
        id: "second-model",
        isStructureLocked: false,
        key: "second-model",
        modelStructureVersion: 1,
        name: "Second model",
        storageKey: "second_model",
        title: "Second model",
        version: 1,
        views: [],
      },
      status: "ok",
    }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    }));

    await secondRequest;

    unsubscribe();

    expect(getApiClientRequestActivitySnapshot().activeRequestCount).toBe(0);
    expect(activityCounts).toEqual([1, 2, 1, 0]);
  });
});
