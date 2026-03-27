import { describe, expect, it } from "vitest";

import { tenantEnglishMessages } from "../../src/locales/en";
import {
  getPlatformBuilderHeaderMeta,
  getPlatformBuilderHeaderTitle,
} from "../../src/features/platform-builder-v2/platform-builder-route-meta";

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

describe("platform builder route meta", () => {
  it("uses UI Builder copy for the main forms routes", () => {
    expect(getPlatformBuilderHeaderTitle(translate, "/builder/forms")).toBe("UI Builder");
    expect(getPlatformBuilderHeaderMeta(translate, "/builder/forms")).toBe("Platform Builder / UI Builder");
    expect(getPlatformBuilderHeaderMeta(translate, "/builder/forms/customer-profile")).toBe(
      "Platform Builder / UI Builder / Customer Profile",
    );
  });

  it("keeps the screen title while using UI Builder breadcrumb copy", () => {
    expect(getPlatformBuilderHeaderTitle(translate, "/builder/forms/customer-profile/views/intake-form")).toBe("Intake Form");
    expect(getPlatformBuilderHeaderMeta(translate, "/builder/forms/customer-profile/views/intake-form")).toBe(
      "Platform Builder / UI Builder / Customer Profile / Intake Form",
    );
  });
});
