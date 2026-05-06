import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { tenantEnglishMessages } from "../../src/locales/en";
import {
  getPlatformStudioHeaderMeta,
  getPlatformStudioHeaderTitle,
} from "../../src/features/platform-studio/platform-studio-route-meta";
import { installFormsPlaceholderStorage } from "./forms-test-fixtures";

function translate(key: string, options?: Record<string, unknown>) {
  const value = key
    .split(".")
    .reduce<unknown>((currentValue, segment) => {
      if (!currentValue || typeof currentValue !== "object") {
        return undefined;
      }

      return (currentValue as Record<string, unknown>)[segment];
    }, tenantEnglishMessages);

  if (typeof value !== "string") {
    throw new Error(`Missing translation for ${key}`);
  }

  return Object.entries(options ?? {}).reduce(
    (result, [optionKey, optionValue]) => result.replaceAll(`{{${optionKey}}}`, String(optionValue)),
    value,
  );
}

describe("platform studio route meta", () => {
  beforeEach(() => {
    installFormsPlaceholderStorage();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses Form Builder copy for the main forms routes", () => {
    expect(getPlatformStudioHeaderTitle(translate, "/builder/forms")).toBe("Form Builder");
    expect(getPlatformStudioHeaderMeta(translate, "/builder/forms")).toBe("Platform Studio / Form Builder");
    expect(getPlatformStudioHeaderMeta(translate, "/builder/forms/customer-profile")).toBe(
      "Platform Studio / Form Builder / Customer Profile",
    );
  });

  it("uses Navigation Builder copy for the navigation route", () => {
    expect(getPlatformStudioHeaderTitle(translate, "/builder/navigation")).toBe("Navigation Builder");
    expect(getPlatformStudioHeaderMeta(translate, "/builder/navigation")).toBe("Platform Studio / Navigation Builder");
  });

  it("keeps the view title while using Form Builder breadcrumb copy", () => {
    expect(getPlatformStudioHeaderTitle(translate, "/builder/forms/customer-profile/views/intake-form")).toBe("Intake Form");
    expect(getPlatformStudioHeaderMeta(translate, "/builder/forms/customer-profile/views/intake-form")).toBe(
      "Platform Studio / Form Builder / Customer Profile / Intake Form",
    );
  });
});
