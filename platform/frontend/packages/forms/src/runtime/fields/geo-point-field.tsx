import {
  Input,
  InputGroup,
} from "@platform/ui-kit";

import {
  parseRuntimeGeoPointValue,
  runtimeGeoPointMapUrl,
} from "../runtime-form-geo-point";
import {
  cx,
  getStringValue,
} from "../runtime-form-utils";
import type { RuntimeFieldControlProps } from "./field-types";

export function GeoPointField({
  controlId,
  disabled,
  error,
  field,
  isResolvingGeoPoint,
  labels,
  value,
}: RuntimeFieldControlProps) {
  const textValue = getStringValue(value);
  const parsedValue = parseRuntimeGeoPointValue(textValue);
  const mapUrl = runtimeGeoPointMapUrl(parsedValue);
  const locating = Boolean(isResolvingGeoPoint);

  return (
    <InputGroup className="platform-runtime-form__geo-point">
      <Input
        aria-invalid={error ? "true" : undefined}
        data-runtime-field-id={field.id}
        disabled={disabled}
        id={controlId}
        invalid={Boolean(error)}
        placeholder={field.placeholder ?? labels.geoPointPlaceholder}
        readOnly
        type="text"
        value={textValue}
      />
      <a
        aria-disabled={!mapUrl || locating ? "true" : undefined}
        aria-label={`${String(labels.geoPointMap)} ${field.label}`}
        className={cx(
          "ui-input-addon",
          "ui-input-addon--md",
          "platform-runtime-form__geo-map-link",
          (!mapUrl || locating) && "platform-runtime-form__geo-map-link--disabled",
        )}
        href={mapUrl || undefined}
        rel="noreferrer"
        tabIndex={mapUrl && !locating ? undefined : -1}
        target="_blank"
      >
        {locating ? labels.geoPointLocating : labels.geoPointMap}
      </a>
    </InputGroup>
  );
}
