import { afterEach, describe, expect, it, vi } from "vitest";

import type { PublishedManifest } from "@platform/platform-studio-core";

import {
  publishedManifestStorageKey,
  readPublishedManifest,
  subscribeToPublishedManifestSource,
} from "../../src/features/published-app/published-manifest-loader";

const seededManifest = readPublishedManifest();

function createStoredManifestRecord(
  overrides: Partial<PublishedManifest> = {},
) {
  const manifest: PublishedManifest = {
    ...seededManifest,
    ...overrides,
  };

  return JSON.stringify([
    {
      id: `record.${manifest.version}`,
      manifest,
      publishedAt: manifest.publishedAt,
    },
  ]);
}

function stubWindow({
  addEventListener = vi.fn(),
  getItem,
  removeEventListener = vi.fn(),
}: {
  addEventListener?: ReturnType<typeof vi.fn>;
  getItem: ReturnType<typeof vi.fn>;
  removeEventListener?: ReturnType<typeof vi.fn>;
}) {
  vi.stubGlobal("window", {
    addEventListener,
    localStorage: {
      getItem,
    },
    removeEventListener,
  } as unknown as Window & typeof globalThis);

  return {
    addEventListener,
    removeEventListener,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("published manifest loader", () => {
  it("reads the neutral published runtime storage key", () => {
    const getItem = vi.fn((key: string) => {
      if (key === publishedManifestStorageKey) {
        return createStoredManifestRecord({
          manifestId: "manifest.primary-runtime",
          version: 4,
        });
      }

      return null;
    });

    stubWindow({ getItem });

    const manifest = readPublishedManifest();

    expect(manifest.manifestId).toBe("manifest.primary-runtime");
    expect(manifest.version).toBe(4);
  });

  it("falls back to the seeded manifest when the runtime storage key is empty", () => {
    const getItem = vi.fn(() => null);

    stubWindow({ getItem });

    const manifest = readPublishedManifest();

    expect(manifest.manifestId).toBe(seededManifest.manifestId);
    expect(manifest.version).toBe(seededManifest.version);
  });

  it("falls back to the seeded manifest when localStorage access throws", () => {
    const getItem = vi.fn(() => {
      throw new Error("localStorage blocked");
    });

    stubWindow({ getItem });

    const manifest = readPublishedManifest();

    expect(manifest.manifestId).toBe(seededManifest.manifestId);
    expect(manifest.version).toBe(seededManifest.version);
  });

  it("subscribes to current, legacy, and clear-all storage events", () => {
    const getItem = vi.fn(() => null);
    const { addEventListener, removeEventListener } = stubWindow({ getItem });
    const listener = vi.fn();

    const unsubscribe = subscribeToPublishedManifestSource(listener);
    const storageListener = addEventListener.mock.calls[0]?.[1] as (
      event: StorageEvent,
    ) => void;

    storageListener({ key: publishedManifestStorageKey } as StorageEvent);
    storageListener({ key: "tenant.unrelated.key" } as StorageEvent);
    storageListener({ key: null } as StorageEvent);

    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();

    expect(removeEventListener).toHaveBeenCalledWith(
      "storage",
      storageListener,
    );
  });
});
