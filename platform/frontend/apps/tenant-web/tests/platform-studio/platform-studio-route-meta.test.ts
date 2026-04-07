import { describe, expect, it } from "vitest";

import { tenantEnglishMessages } from "../../src/locales/en";
import {
  getPlatformStudioHeaderMeta,
  getPlatformStudioHeaderTitle,
} from "../../src/features/platform-studio/platform-studio-route-meta";

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
  it("uses Form Builder copy for the main forms routes", () => {
    expect(getPlatformStudioHeaderTitle(translate, "/builder/forms")).toBe("Form Builder");
    expect(getPlatformStudioHeaderMeta(translate, "/builder/forms")).toBe("Platform Studio / Form Builder");
    expect(getPlatformStudioHeaderMeta(translate, "/builder/forms/customer-profile")).toBe(
      "Platform Studio / Form Builder / Customer Profile",
    );
  });

  it("keeps the view title while using Form Builder breadcrumb copy", () => {
    expect(getPlatformStudioHeaderTitle(translate, "/builder/forms/customer-profile/views/intake-form")).toBe("Intake Form");
    expect(getPlatformStudioHeaderMeta(translate, "/builder/forms/customer-profile/views/intake-form")).toBe(
      "Platform Studio / Form Builder / Customer Profile / Intake Form",
    );
  });
});
