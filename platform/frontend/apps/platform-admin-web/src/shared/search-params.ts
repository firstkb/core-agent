const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

type SearchFilterGroup = {
  key: string;
  options: ReadonlyArray<{
    value: string;
  }>;
};

export function readEnumSearchParam<T extends string>(
  searchParams: URLSearchParams,
  key: string,
  allowedValues: ReadonlyArray<T>,
  fallback: T,
) {
  const rawValue = searchParams.get(key);

  if (!rawValue) return fallback;
  return allowedValues.includes(rawValue as T) ? (rawValue as T) : fallback;
}

export function readDateSearchParam(searchParams: URLSearchParams, key: string) {
  const rawValue = searchParams.get(key);
  return rawValue && isoDatePattern.test(rawValue) ? rawValue : "";
}

export function getDefaultFilterState(filterGroups: ReadonlyArray<SearchFilterGroup>) {
  return Object.fromEntries(
    filterGroups.map((group) => [group.key, group.options[0]?.value ?? "all"]),
  ) as Record<string, string>;
}

export function readFilterSearchParams(
  searchParams: URLSearchParams,
  filterGroups: ReadonlyArray<SearchFilterGroup>,
) {
  return Object.fromEntries(
    filterGroups.map((group) => [
      group.key,
      readEnumSearchParam(
        searchParams,
        group.key,
        group.options.map((option) => option.value),
        group.options[0]?.value ?? "all",
      ),
    ]),
  ) as Record<string, string>;
}

export function setSearchParam(
  searchParams: URLSearchParams,
  key: string,
  value: string | null | undefined,
) {
  const nextSearchParams = new URLSearchParams(searchParams);

  if (!value) {
    nextSearchParams.delete(key);
  } else {
    nextSearchParams.set(key, value);
  }

  return nextSearchParams;
}

export function setSearchParamsBatch(
  searchParams: URLSearchParams,
  updates: ReadonlyArray<readonly [key: string, value: string | null | undefined]>,
) {
  const nextSearchParams = new URLSearchParams(searchParams);

  updates.forEach(([key, value]) => {
    if (!value) {
      nextSearchParams.delete(key);
      return;
    }

    nextSearchParams.set(key, value);
  });

  return nextSearchParams;
}

export function toSearchString(searchParams: URLSearchParams) {
  const value = searchParams.toString();
  return value ? `?${value}` : "";
}
