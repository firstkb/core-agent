// @vitest-environment happy-dom

import {
  act,
  useRef,
  useState,
} from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import {
  RuntimeFormScaffold,
  validateRuntimeForm,
  type RuntimeFormDefinition,
  type RuntimeFormValue,
  type RuntimeFormValues,
  type RuntimeFormValidationErrors,
} from "@platform/forms";

import { collectRuntimeControlValueChanges } from "./form-runtime-dom-sync";

type MockRuntimeClient = {
  createRecord: ReturnType<typeof vi.fn>;
};

const definition: RuntimeFormDefinition = {
  commitMode: "finish",
  id: "rendered-submit",
  mode: "create",
  sections: [
    {
      id: "main",
      nodes: [
        {
          id: "name",
          label: "Name",
          required: true,
          type: "short_text",
        },
        {
          id: "notes",
          label: "Notes",
          type: "long_text",
        },
      ],
      title: "Main",
    },
  ],
  title: "Rendered submit",
};

function setTextInputValue(input: HTMLInputElement, value: string) {
  const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  valueSetter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

function getFinishButton(container: HTMLElement) {
  const finishButton = Array.from(container.querySelectorAll("button"))
    .find((button) => button.textContent?.trim() === "Finish");

  if (!finishButton) {
    throw new Error("Expected rendered Finish button.");
  }

  return finishButton;
}

function RenderedRuntimeFormSubmitHarness({
  runtimeClient,
}: {
  runtimeClient: MockRuntimeClient;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const latestValuesRef = useRef<RuntimeFormValues>({});
  const [values, setValues] = useState<RuntimeFormValues>({});
  const [errors, setErrors] = useState<RuntimeFormValidationErrors>({});

  latestValuesRef.current = values;

  function handleFieldChange(fieldId: string, value: RuntimeFormValue) {
    setValues((currentValues) => {
      const nextValues = {
        ...currentValues,
        [fieldId]: value,
      };
      latestValuesRef.current = nextValues;
      return nextValues;
    });
  }

  async function handleFinish() {
    const controls = containerRef.current?.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
      "input[data-runtime-field-id], textarea[data-runtime-field-id]",
    ) ?? [];
    const changedValues = collectRuntimeControlValueChanges(definition, controls, latestValuesRef.current);
    const submitValues = {
      ...latestValuesRef.current,
      ...changedValues,
    };
    latestValuesRef.current = submitValues;
    setValues(submitValues);

    const nextErrors = validateRuntimeForm(definition, submitValues);
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      return;
    }

    await runtimeClient.createRecord("tenant-token", {
      clientCreateToken: "rendered-submit-token",
      values: submitValues,
    });
  }

  return (
    <div ref={containerRef}>
      <RuntimeFormScaffold
        definition={definition}
        errors={errors}
        onBack={() => undefined}
        onFieldChange={handleFieldChange}
        onFinish={() => {
          void handleFinish();
        }}
        saveState="dirty"
        values={values}
      />
    </div>
  );
}

describe("rendered runtime form submit", () => {
  let roots: Root[] = [];

  beforeAll(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterEach(async () => {
    await act(async () => {
      roots.forEach((root) => root.unmount());
    });
    roots = [];
    document.body.replaceChildren();
    vi.clearAllMocks();
  });

  it("submits unblurred typed input values through the create mutation payload", async () => {
    const runtimeClient: MockRuntimeClient = {
      createRecord: vi.fn().mockResolvedValue({
        created: true,
        docGuid: "doc-1",
        values: {
          name: "Unblurred Job Type",
        },
      }),
    };
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    roots.push(root);

    await act(async () => {
      root.render(<RenderedRuntimeFormSubmitHarness runtimeClient={runtimeClient} />);
    });

    const nameInput = container.querySelector<HTMLInputElement>("input[data-runtime-field-id='name']");
    if (!nameInput) {
      throw new Error("Expected rendered Name input.");
    }

    await act(async () => {
      setTextInputValue(nameInput, "Unblurred Job Type");
    });
    expect(runtimeClient.createRecord).not.toHaveBeenCalled();

    await act(async () => {
      getFinishButton(container).click();
    });

    expect(runtimeClient.createRecord).toHaveBeenCalledTimes(1);
    expect(runtimeClient.createRecord).toHaveBeenCalledWith("tenant-token", {
      clientCreateToken: "rendered-submit-token",
      values: {
        name: "Unblurred Job Type",
      },
    });
  });
});
