import { afterEach, describe, expect, it, vi } from "vitest";

import type {
  CollectionTableQueryRequest,
  CollectionTableSavedFilterSetCreateInput,
} from "@platform/collection-table";

import { createFormRuntimeCollectionTableClient } from "./form-runtime-collection-table-client";

type FetchMock = ReturnType<typeof vi.fn<typeof fetch>>;

const accessToken = "tenant-token";

function jsonEnvelopeResponse(
  data: unknown,
  options: {
    code?: string;
    message?: string;
    status?: number;
    envelopeStatus?: string;
  } = {},
) {
  const envelope: Record<string, unknown> = {
    status: options.envelopeStatus ?? "ok",
  };

  if (data !== undefined) {
    envelope.data = data;
  }
  if (options.code) {
    envelope.code = options.code;
  }
  if (options.message) {
    envelope.message = options.message;
  }

  return new Response(JSON.stringify(envelope), {
    headers: { "Content-Type": "application/json" },
    status: options.status ?? 200,
  });
}

function createFetchMock(...responses: Response[]) {
  const fetchMock = vi.fn<typeof fetch>();
  responses.forEach((response) => {
    fetchMock.mockResolvedValueOnce(response);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function getFetchRequest(fetchMock: FetchMock, callIndex: number) {
  const call = fetchMock.mock.calls[callIndex];
  if (!call) {
    throw new Error(`Expected fetch call ${callIndex + 1}.`);
  }

  const init = call[1];
  if (!init) {
    throw new Error(`Expected fetch init for call ${callIndex + 1}.`);
  }

  return {
    init,
    url: String(call[0]),
  };
}

function expectTenantRequest(
  fetchMock: FetchMock,
  callIndex: number,
  expected: {
    body?: unknown;
    method: string;
    url: string;
  },
) {
  const request = getFetchRequest(fetchMock, callIndex);
  expect(request.url).toBe(expected.url);
  expect(request.init.method).toBe(expected.method);

  expect(request.init.headers).toBeInstanceOf(Headers);
  const headers = request.init.headers as Headers;
  expect(headers.get("Accept")).toBe("application/json");
  expect(headers.get("Authorization")).toBe(`Bearer ${accessToken}`);

  if (expected.body === undefined) {
    expect(request.init.body).toBeUndefined();
    expect(headers.get("Content-Type")).toBeNull();
  } else {
    expect(request.init.body).toBe(JSON.stringify(expected.body));
    expect(headers.get("Content-Type")).toBe("application/json");
  }
}

const queryRequest: CollectionTableQueryRequest = {
  filters: { active: "true" },
  page: 2,
  pageSize: 25,
  presetId: "view-default",
  quickFilters: [
    {
      fieldId: "status",
      id: "status-open",
      operator: "is_equal_to",
      value: "open",
    },
  ],
  sort: {
    columnId: "name",
    direction: "asc",
  },
};

describe("form runtime collection table client mutation contracts", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends create, update, and finish mutations to runtime record endpoints", async () => {
    const fetchMock = createFetchMock(
      jsonEnvelopeResponse({
        created: true,
        docGuid: "doc-1",
        recordId: 101,
        revision: "rev-1",
        status: "draft",
        values: { name: "Manager" },
      }),
      jsonEnvelopeResponse({
        docGuid: "doc-1",
        revision: "rev-2",
        values: { name: "Lead Manager" },
      }),
      jsonEnvelopeResponse({
        docGuid: "doc-1",
        revision: "rev-3",
        status: "finished",
        values: { name: "Lead Manager" },
      }),
    );
    const client = createFormRuntimeCollectionTableClient({
      baseUrl: "https://tenant-api.local/",
      modelId: "jobtype",
      viewId: "view-default",
    });

    const createInput = {
      clientCreateToken: "create-token-1",
      lookupLabels: {
        manager_id: {
          "user-1": "Manager One",
        },
      },
      values: {
        manager_id: "user-1",
        name: "Manager",
      },
    };
    const updateInput = {
      expectedRevision: "rev-1",
      lookupLabels: {
        manager_id: {
          "user-2": "Manager Two",
        },
      },
      values: {
        manager_id: "user-2",
        name: "Lead Manager",
      },
    };
    const finishInput = {
      expectedRevision: "rev-2",
    };

    await expect(client.createRecord(accessToken, createInput)).resolves.toMatchObject({
      created: true,
      docGuid: "doc-1",
      recordId: 101,
      revision: "rev-1",
      status: "draft",
      values: { name: "Manager" },
    });
    await expect(client.updateRecord(accessToken, "doc-1", updateInput)).resolves.toMatchObject({
      docGuid: "doc-1",
      revision: "rev-2",
      values: { name: "Lead Manager" },
    });
    await expect(client.finishRecord(accessToken, "doc-1", finishInput)).resolves.toMatchObject({
      docGuid: "doc-1",
      revision: "rev-3",
      status: "finished",
      values: { name: "Lead Manager" },
    });

    expectTenantRequest(fetchMock, 0, {
      body: createInput,
      method: "POST",
      url: "https://tenant-api.local/app/forms/jobtype/views/view-default/records",
    });
    expectTenantRequest(fetchMock, 1, {
      body: updateInput,
      method: "PATCH",
      url: "https://tenant-api.local/app/forms/jobtype/views/view-default/records/doc-1",
    });
    expectTenantRequest(fetchMock, 2, {
      body: finishInput,
      method: "POST",
      url: "https://tenant-api.local/app/forms/jobtype/views/view-default/records/doc-1/finish",
    });
  });

  it("sends favorite, saved-filter, and bulk action mutations with encoded runtime paths", async () => {
    const savedFilterInput: CollectionTableSavedFilterSetCreateInput = {
      label: "Open work",
      quickFilters: queryRequest.quickFilters,
    };
    const fetchMock = createFetchMock(
      jsonEnvelopeResponse({ isFavorite: true }),
      jsonEnvelopeResponse({
        id: "filter/open",
        label: "Open work",
        quickFilters: savedFilterInput.quickFilters,
      }),
      jsonEnvelopeResponse(null),
      jsonEnvelopeResponse(null),
    );
    const client = createFormRuntimeCollectionTableClient({
      baseUrl: "https://tenant-api.local/",
      modelId: "job type",
      viewId: "view/default",
    });

    await expect(client.toggleFavorite(accessToken)).resolves.toEqual({ isFavorite: true });
    await expect(client.createSavedFilterSet(accessToken, savedFilterInput)).resolves.toEqual({
      id: "filter/open",
      label: "Open work",
      quickFilters: savedFilterInput.quickFilters,
    });
    await expect(client.deleteSavedFilterSet(accessToken, "filter/open")).resolves.toBeUndefined();
    await expect(client.runBulkAction?.(accessToken, {
      actionId: "finish/work",
      query: queryRequest,
      rowIds: ["doc-1", "doc-2"],
    })).resolves.toBeUndefined();

    const pathPrefix = "https://tenant-api.local/app/forms/job%20type/views/view%2Fdefault";
    expectTenantRequest(fetchMock, 0, {
      method: "POST",
      url: `${pathPrefix}/favorite/toggle`,
    });
    expectTenantRequest(fetchMock, 1, {
      body: savedFilterInput,
      method: "POST",
      url: `${pathPrefix}/saved-filters`,
    });
    expectTenantRequest(fetchMock, 2, {
      method: "DELETE",
      url: `${pathPrefix}/saved-filters/filter%2Fopen`,
    });
    expectTenantRequest(fetchMock, 3, {
      body: {
        query: queryRequest,
        rowIds: ["doc-1", "doc-2"],
      },
      method: "POST",
      url: `${pathPrefix}/bulk-actions/finish%2Fwork`,
    });
  });

  it("sends subform load and record mutations through parent-scoped endpoints", async () => {
    const fetchMock = createFetchMock(
      jsonEnvelopeResponse({
        dataSchema: { rootScope: { fields: [] } },
        docGuid: "child/doc",
        modelId: "site audit",
        recordId: "303",
        revision: "subform-rev-1",
        surfaceId: "form-runtime:site audit:default:subform:contacts/safety",
        title: "Contacts",
        uiSchema: { rootScope: { nodes: [] } },
        values: {
          email: "person@example.com",
        },
        viewId: "default",
      }),
      jsonEnvelopeResponse({
        created: true,
        docGuid: "child/doc",
        recordId: "303",
        revision: "subform-rev-1",
        values: {
          email: "person@example.com",
        },
      }),
      jsonEnvelopeResponse({
        docGuid: "child/doc",
        recordId: "303",
        revision: "subform-rev-2",
        values: {
          email: "updated@example.com",
        },
      }),
      jsonEnvelopeResponse(null),
    );
    const client = createFormRuntimeCollectionTableClient({
      baseUrl: "https://tenant-api.local/",
      modelId: "site audit",
      viewId: "view/default",
    });

    const createInput = {
      clientCreateToken: "child-create-token",
      values: {
        email: "person@example.com",
      },
    };
    const updateInput = {
      expectedRevision: "subform-rev-1",
      values: {
        email: "updated@example.com",
      },
    };

    await expect(client.loadSubform(
      accessToken,
      "parent/doc",
      "contacts/safety",
      "child/doc",
    )).resolves.toMatchObject({
      docGuid: "child/doc",
      modelId: "site audit",
      recordId: "303",
      revision: "subform-rev-1",
      title: "Contacts",
      values: {
        email: "person@example.com",
      },
      viewId: "default",
    });
    await expect(client.createSubformRecord(
      accessToken,
      "parent/doc",
      "contacts/safety",
      createInput,
    )).resolves.toMatchObject({
      created: true,
      docGuid: "child/doc",
      revision: "subform-rev-1",
      values: {
        email: "person@example.com",
      },
    });
    await expect(client.updateSubformRecord(
      accessToken,
      "parent/doc",
      "contacts/safety",
      "child/doc",
      updateInput,
    )).resolves.toMatchObject({
      docGuid: "child/doc",
      revision: "subform-rev-2",
      values: {
        email: "updated@example.com",
      },
    });
    await expect(client.deleteSubformRecord(
      accessToken,
      "parent/doc",
      "contacts/safety",
      "child/doc",
    )).resolves.toBeUndefined();

    const pathPrefix = "https://tenant-api.local/app/forms/site%20audit/views/view%2Fdefault";
    expectTenantRequest(fetchMock, 0, {
      method: "GET",
      url: `${pathPrefix}/records/parent%2Fdoc/subforms/contacts%2Fsafety/records/child%2Fdoc/form`,
    });
    expectTenantRequest(fetchMock, 1, {
      body: createInput,
      method: "POST",
      url: `${pathPrefix}/records/parent%2Fdoc/subforms/contacts%2Fsafety/records`,
    });
    expectTenantRequest(fetchMock, 2, {
      body: updateInput,
      method: "PATCH",
      url: `${pathPrefix}/records/parent%2Fdoc/subforms/contacts%2Fsafety/records/child%2Fdoc`,
    });
    expectTenantRequest(fetchMock, 3, {
      method: "DELETE",
      url: `${pathPrefix}/records/parent%2Fdoc/subforms/contacts%2Fsafety/records/child%2Fdoc`,
    });
  });

  it("sends checklist item updates through source-scoped subform endpoints", async () => {
    const checklistInput = {
      notes: "Requires follow up.",
      value: "No",
      values: {
        risk: "high",
      },
    };
    const fetchMock = createFetchMock(
      jsonEnvelopeResponse({
        item: {
          active: true,
          answerOptions: [
            {
              label: "Yes",
              value: "Yes",
            },
            {
              label: "No",
              styleVariant: "danger",
              value: "No",
            },
          ],
          groupId: "environmental",
          groupTitle: "Environmental",
          label: "Active question",
          notes: "Requires follow up.",
          required: true,
          savedRowDocGuid: "checklist-row-guid",
          sourceGuid: "source/guid",
          sourceValue: "42",
          value: "No",
          values: {
            risk: "high",
          },
        },
        subformId: "checklist/scope",
      }),
    );
    const client = createFormRuntimeCollectionTableClient({
      baseUrl: "https://tenant-api.local/",
      modelId: "sor",
      viewId: "default",
    });

    await expect(client.updateChecklistItem(
      accessToken,
      "parent/doc",
      "checklist/scope",
      "source/guid",
      checklistInput,
    )).resolves.toMatchObject({
      item: {
        active: true,
        groupId: "environmental",
        label: "Active question",
        notes: "Requires follow up.",
        required: true,
        savedRowDocGuid: "checklist-row-guid",
        sourceGuid: "source/guid",
        sourceValue: "42",
        value: "No",
        values: {
          risk: "high",
        },
      },
      subformId: "checklist/scope",
    });
    expectTenantRequest(fetchMock, 0, {
      body: checklistInput,
      method: "PATCH",
      url: "https://tenant-api.local/app/forms/sor/views/default/records/parent%2Fdoc/subforms/checklist%2Fscope/checklist/items/source%2Fguid",
    });
  });

  it("preserves backend mutation error details from response envelopes", async () => {
    const fetchMock = createFetchMock(
      jsonEnvelopeResponse(
        {
          validationErrors: [
            {
              fieldId: "name",
              message: "Name is required.",
            },
          ],
        },
        {
          code: "validation_failed",
          envelopeStatus: "error",
          message: "Form validation failed.",
          status: 422,
        },
      ),
    );
    const client = createFormRuntimeCollectionTableClient({
      baseUrl: "https://tenant-api.local/",
      modelId: "jobtype",
      viewId: "view-default",
    });

    await expect(client.createRecord(accessToken, {
      values: {
        name: "",
      },
    })).rejects.toMatchObject({
      code: "validation_failed",
      message: "Form validation failed.",
      name: "ApiClientError",
      payload: {
        validationErrors: [
          {
            fieldId: "name",
            message: "Name is required.",
          },
        ],
      },
      responseStatus: "error",
      statusCode: 422,
    });
    expectTenantRequest(fetchMock, 0, {
      body: {
        values: {
          name: "",
        },
      },
      method: "POST",
      url: "https://tenant-api.local/app/forms/jobtype/views/view-default/records",
    });
  });
});
