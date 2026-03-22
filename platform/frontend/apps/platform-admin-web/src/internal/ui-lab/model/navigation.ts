import type { UiLabLeafId, UiLabSection, UiLabSectionId } from "./leaf-meta";
import { uiLabLeafMeta, uiLabSections } from "./leaf-meta";
import { shouldShowLeafInMenu } from "./status";

export type UiLabSectionEntry = UiLabSection & {
  visibleLeaves: UiLabLeafId[];
};

function matchesLeaf(id: UiLabLeafId, normalizedQuery: string) {
  if (!normalizedQuery) {
    return true;
  }

  const item = uiLabLeafMeta[id];
  return [item.label, item.title, item.description, item.heroTitle, ...item.breadcrumb]
    .join(" ")
    .toLowerCase()
    .includes(normalizedQuery);
}

function filterLeaves(
  ids: readonly UiLabLeafId[],
  normalizedQuery: string,
  labels: string[] = [],
) {
  const visibleIds = ids.filter((id) => shouldShowLeafInMenu(id));

  if (!normalizedQuery) {
    return [...visibleIds];
  }

  const groupMatch = labels.join(" ").toLowerCase().includes(normalizedQuery);
  if (groupMatch) {
    return [...visibleIds];
  }

  return visibleIds.filter((id) => matchesLeaf(id, normalizedQuery));
}

export function buildSectionEntries(normalizedQuery: string): UiLabSectionEntry[] {
  return uiLabSections
    .map((section) => ({
      ...section,
      visibleLeaves: filterLeaves(section.leaves, normalizedQuery, [section.label, ...section.keywords]),
    }))
    .filter((section) => section.visibleLeaves.length > 0);
}

export function getVisibleLeafIds(sectionEntries: UiLabSectionEntry[]) {
  return sectionEntries.flatMap((section) => section.visibleLeaves);
}

export function getDefaultSectionId(id: UiLabLeafId): UiLabSectionId {
  return uiLabLeafMeta[id].panelId as UiLabSectionId;
}

export { uiLabSections };
