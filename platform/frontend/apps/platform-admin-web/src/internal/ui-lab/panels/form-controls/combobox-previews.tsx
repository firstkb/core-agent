import { useEffect, useState } from "react";

import { Combobox } from "@platform/ui-kit";

export const comboboxAssessmentTypeOptions = [
  { label: "Satisfactory", searchText: "satisfactory", value: "satisfactory" },
  { label: "Unsatisfactory", searchText: "unsatisfactory", value: "unsatisfactory" },
] as const;

export const comboboxCompanyOptions = [
  {
    description: "Logistics provider",
    label: "Northstar Freight",
    searchText: "northstar freight logistics provider",
    value: "northstar-freight",
  },
  {
    description: "Manufacturing company",
    label: "Aurora Components",
    searchText: "aurora components manufacturing company",
    value: "aurora-components",
  },
  {
    description: "Software vendor",
    label: "Helio Systems",
    searchText: "helio systems software vendor",
    value: "helio-systems",
  },
  {
    description: "Professional services firm",
    label: "Summit Advisory",
    searchText: "summit advisory professional services firm",
    value: "summit-advisory",
  },
  {
    description: "Retail operator",
    label: "Cinder Retail Group",
    searchText: "cinder retail group retail operator",
    value: "cinder-retail-group",
  },
] as const;

const comboboxLargeCompanyTypes = [
  "Logistics provider",
  "Manufacturing company",
  "Software vendor",
  "Professional services firm",
  "Retail operator",
  "Energy supplier",
  "Insurance carrier",
  "Healthcare network",
] as const;

const comboboxLargeCompanyNames = [
  "Northstar",
  "Aurora",
  "Helio",
  "Summit",
  "Cinder",
  "Nova",
  "Vertex",
  "Lattice",
  "Pioneer",
  "Harbor",
] as const;

const comboboxLargeCompanySuffixes = [
  "Holdings",
  "Systems",
  "Group",
  "Logistics",
  "Works",
  "Partners",
  "Industries",
  "Advisory",
] as const;

export const comboboxLargeCompanyDirectory = Array.from({ length: 1000 }, (_, index) => {
  const companyType = comboboxLargeCompanyTypes[index % comboboxLargeCompanyTypes.length];
  const companyName = `${comboboxLargeCompanyNames[index % comboboxLargeCompanyNames.length]} ${
    comboboxLargeCompanySuffixes[index % comboboxLargeCompanySuffixes.length]
  } ${String(index + 1).padStart(3, "0")}`;

  return {
    description: companyType,
    label: companyName,
    searchText: `${companyName} ${companyType}`.toLowerCase(),
    value: `company-${String(index + 1).padStart(4, "0")}`,
  };
});

export function ComboboxSimplePreview() {
  const [value, setValue] = useState<string | null>("satisfactory");
  const selectedOption = comboboxAssessmentTypeOptions.find((option) => option.value === value);

  return (
    <div className="ui-lab-page__stack">
      <Combobox
        id="ui-lab-combobox-preview-type"
        label="Type"
        onValueChange={setValue}
        options={comboboxAssessmentTypeOptions}
        placeholder="Select type"
        searchInputAriaLabel="Search type values"
        searchPlaceholder="Search type..."
        triggerAriaLabel="Type"
        value={value}
      />
      <p className="ui-lab-page__muted">
        Simple enum template renders label only: {selectedOption ? selectedOption.label : "No type selected"}.
      </p>
    </div>
  );
}

export function ComboboxCompanyPreview() {
  const [value, setValue] = useState<string | null>("aurora-components");
  const selectedOption = comboboxCompanyOptions.find((option) => option.value === value);

  return (
    <div className="ui-lab-page__stack">
      <Combobox
        id="ui-lab-combobox-preview-company"
        label="Company"
        onValueChange={setValue}
        options={comboboxCompanyOptions}
        placeholder="Select company"
        searchInputAriaLabel="Search companies"
        searchPlaceholder="Search company..."
        triggerAriaLabel="Company"
        value={value}
      />
      <p className="ui-lab-page__muted">
        Company template stacks the name with the company type below it:{" "}
        {selectedOption ? selectedOption.label : "No company selected"}.
      </p>
    </div>
  );
}

export function ComboboxLargeCompanyPreview() {
  const [value, setValue] = useState<string | null>("company-0004");

  return (
    <div className="ui-lab-page__stack">
      <Combobox
        id="ui-lab-combobox-preview-large-directory"
        initialVisibleCount={10}
        label="Company"
        loadMoreStep={10}
        onValueChange={setValue}
        options={comboboxLargeCompanyDirectory}
        placeholder="Search 1000 companies"
        searchInputAriaLabel="Search large company directory"
        searchPlaceholder="Search by company name or type..."
        triggerAriaLabel="Large company directory"
        value={value}
      />
      <p className="ui-lab-page__muted">
        Local large-list mode starts with 10 records, loads 10 more on scroll, and search matches any word from company name or company type.
      </p>
    </div>
  );
}

export function ComboboxAsyncPreview() {
  const [value, setValue] = useState<string | null>("company-0004");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState(comboboxLargeCompanyDirectory.slice(0, 12));

  useEffect(() => {
    setLoading(true);

    const timeoutId = window.setTimeout(() => {
      const normalizedQuery = query.trim().toLowerCase();
      const nextOptions = !normalizedQuery
        ? comboboxLargeCompanyDirectory.slice(0, 12)
        : comboboxLargeCompanyDirectory.filter((option) => option.searchText.includes(normalizedQuery)).slice(0, 12);

      setOptions(nextOptions);
      setLoading(false);
    }, 280);

    return () => window.clearTimeout(timeoutId);
  }, [query]);

  const selectedOption = comboboxLargeCompanyDirectory.find((option) => option.value === value);

  return (
    <div className="ui-lab-page__stack">
      <Combobox
        filterMode="none"
        id="ui-lab-combobox-preview-remote"
        label="Remote company search"
        loading={loading}
        loadingLabel="Searching companies…"
        onSearchValueChange={setQuery}
        onValueChange={setValue}
        options={options}
        placeholder="Search companies from server"
        searchInputAriaLabel="Search remote companies"
        searchPlaceholder="Type to search remote companies..."
        triggerAriaLabel="Remote company search"
        value={value}
        searchValue={query}
      />
      <p className="ui-lab-page__muted">
        Ajax-style search remains caller-owned: `ui-kit` receives the query string and current result slice. Current selection:{" "}
        {selectedOption ? selectedOption.label : "None"}.
      </p>
    </div>
  );
}

export function ComboboxMultiCompanyPreview() {
  const [value, setValue] = useState<string[]>(["aurora-components", "helio-systems"]);
  const selectedOptions = comboboxCompanyOptions.filter((option) => value.includes(option.value));

  return (
    <div className="ui-lab-page__stack">
      <Combobox
        id="ui-lab-combobox-preview-company-multi"
        label="Companies"
        onValueChange={setValue}
        options={comboboxCompanyOptions}
        placeholder="Select companies"
        searchInputAriaLabel="Search companies"
        searchPlaceholder="Search companies..."
        selectionMode="multiple"
        triggerAriaLabel="Companies"
        value={value}
      />
      <p className="ui-lab-page__muted">
        Multi-select lookup mode keeps canonical selections inside the combobox surface:{" "}
        {selectedOptions.length > 0 ? selectedOptions.map((option) => option.label).join(", ") : "No companies selected"}.
      </p>
    </div>
  );
}

export function ComboboxMultiLargeDirectoryPreview() {
  const [value, setValue] = useState<string[]>(["company-0004", "company-0012", "company-0090"]);

  return (
    <div className="ui-lab-page__stack">
      <Combobox
        id="ui-lab-combobox-preview-large-directory-multi"
        initialVisibleCount={10}
        label="Company directory"
        loadMoreStep={10}
        onValueChange={setValue}
        options={comboboxLargeCompanyDirectory}
        placeholder="Search and select companies"
        searchInputAriaLabel="Search large company directory"
        searchPlaceholder="Search by company name or type..."
        selectionMode="multiple"
        triggerAriaLabel="Large company directory"
        value={value}
      />
      <p className="ui-lab-page__muted">
        Large local directory still reveals a bounded visible slice while preserving multiple selected companies: {value.length} selected.
      </p>
    </div>
  );
}
