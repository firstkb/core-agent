import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, type ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";

import { PlatformI18nProvider } from "@platform/i18n";

import { CollectionTablePage, type CollectionTableAdapter } from "./index";
import {
  createCollectionTableAdapter,
  createErrorAdapter,
  createLoadingAdapter,
} from "./stories/collection-table-story-adapter";
import { collectionTableStoryResources } from "./stories/collection-table-story-i18n";

type CollectionTableStoryFrameProps = {
  adapter: CollectionTableAdapter;
  focusSearch?: boolean;
  tableId: string;
};

function clearStoryStorage(tableId: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(`collection-table-state:${tableId}`);
  window.sessionStorage.removeItem(`collection-table-suggestions:${tableId}`);
}

function CollectionTableStoryFrame({
  adapter,
  focusSearch = false,
  tableId,
}: CollectionTableStoryFrameProps) {
  clearStoryStorage(tableId);

  useEffect(() => {
    if (!focusSearch) {
      return undefined;
    }

    const focusTimer = window.setTimeout(() => {
      document.querySelector<HTMLInputElement>('input[aria-label="Search records"]')?.focus();
    }, 250);

    return () => {
      window.clearTimeout(focusTimer);
    };
  }, [focusSearch]);

  return (
    <PlatformI18nProvider
      fallbackLocale="en"
      resources={collectionTableStoryResources}
      storageKey={`storybook.collection-table.locale.${tableId}`}
    >
      <MemoryRouter initialEntries={["/storybook"]}>
        <CollectionTableStoryShell>
          <CollectionTablePage
            adapter={adapter}
            getCreatePath={() => "/storybook/new-observation"}
            resolveFrontendRowActionPath={(_action, row) => `/storybook/observations/${row.id}`}
            tableId={tableId}
          />
        </CollectionTableStoryShell>
      </MemoryRouter>
    </PlatformI18nProvider>
  );
}

function CollectionTableStoryShell({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        background: "linear-gradient(180deg, #f8fafc 0%, #eef4f8 100%)",
        boxSizing: "border-box",
        minHeight: "720px",
        padding: "24px",
        width: "100%",
      }}
    >
      {children}
    </div>
  );
}

const meta = {
  parameters: {
    layout: "fullscreen",
  },
  title: "CollectionTable",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  name: "empty",
  render: () => (
    <CollectionTableStoryFrame
      adapter={createCollectionTableAdapter({ rows: [] })}
      tableId="storybook-collection-empty"
    />
  ),
};

export const Loading: Story = {
  name: "loading",
  render: () => (
    <CollectionTableStoryFrame
      adapter={createLoadingAdapter()}
      tableId="storybook-collection-loading"
    />
  ),
};

export const ReadyWithRows: Story = {
  name: "ready with rows",
  render: () => (
    <CollectionTableStoryFrame
      adapter={createCollectionTableAdapter()}
      tableId="storybook-collection-ready"
    />
  ),
};

export const ErrorState: Story = {
  name: "error",
  render: () => (
    <CollectionTableStoryFrame
      adapter={createErrorAdapter()}
      tableId="storybook-collection-error"
    />
  ),
};

export const FiltersOpen: Story = {
  name: "filters open",
  render: () => (
    <CollectionTableStoryFrame
      adapter={createCollectionTableAdapter()}
      focusSearch
      tableId="storybook-collection-filters-open"
    />
  ),
};
