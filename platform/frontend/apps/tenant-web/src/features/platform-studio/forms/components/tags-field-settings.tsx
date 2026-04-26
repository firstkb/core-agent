import {
  Input,
  Label,
  Select,
} from "@platform/ui-kit";

import { type FormsPlaceholderTagMode } from "../forms-placeholder-data";

type TagsFieldSettingsLabels = {
  maxTags: string;
  tagMode: string;
  tagModeCreateOnly: string;
  tagModeSelectExisting: string;
  tagModeSelectOrCreate: string;
  tags: string;
};

type TagsFieldSettingsProps = {
  labels: TagsFieldSettingsLabels;
  maxTags: number | "";
  onMaxTagsChange: (value: string) => void;
  onTagModeChange: (tagMode: FormsPlaceholderTagMode) => void;
  tagMode: FormsPlaceholderTagMode;
};

export function TagsFieldSettings({
  labels,
  maxTags,
  onMaxTagsChange,
  onTagModeChange,
  tagMode,
}: TagsFieldSettingsProps) {
  return (
    <div className="tenant-web__platform-studio-filter-group">
      <p className="tenant-web__platform-studio-filter-group-title">
        {labels.tags}
      </p>
      <div className="tenant-web__platform-studio-sort-row">
        <div className="tenant-web__platform-studio-form-group">
          <Label htmlFor="tenant-platform-studio-tags-mode">
            {labels.tagMode}
          </Label>
          <Select
            id="tenant-platform-studio-tags-mode"
            onChange={(event) => onTagModeChange(event.target.value as FormsPlaceholderTagMode)}
            value={tagMode}
          >
            <option value="select_existing">{labels.tagModeSelectExisting}</option>
            <option value="select_or_create">{labels.tagModeSelectOrCreate}</option>
            <option value="create_only">{labels.tagModeCreateOnly}</option>
          </Select>
        </div>
        <div className="tenant-web__platform-studio-form-group">
          <Label htmlFor="tenant-platform-studio-tags-max">
            {labels.maxTags}
          </Label>
          <Input
            id="tenant-platform-studio-tags-max"
            min={0}
            onChange={(event) => onMaxTagsChange(event.target.value)}
            type="number"
            value={maxTags}
          />
        </div>
      </div>
    </div>
  );
}
