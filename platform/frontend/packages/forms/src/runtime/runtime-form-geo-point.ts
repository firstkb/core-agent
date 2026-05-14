import type {
  RuntimeFormGeoPoint,
} from "./runtime-form-types";

const coordinatePattern = "[+-]?(?:\\d+(?:\\.\\d+)?|\\.\\d+)";
const legacyGeoPointPattern = new RegExp(
  `^\\s*latitude:\\s*(${coordinatePattern})\\s*,\\s*longitude:\\s*(${coordinatePattern})\\s*$`,
  "i",
);
const compactGeoPointPattern = new RegExp(
  `^\\s*(${coordinatePattern})\\s*,\\s*(${coordinatePattern})\\s*$`,
  "i",
);

function isValidGeoPoint(latitude: number, longitude: number) {
  return Number.isFinite(latitude)
    && Number.isFinite(longitude)
    && latitude >= -90
    && latitude <= 90
    && longitude >= -180
    && longitude <= 180;
}

export function parseRuntimeGeoPointValue(value: string | undefined): RuntimeFormGeoPoint | null {
  const text = value?.trim();
  if (!text) {
    return null;
  }

  const match = legacyGeoPointPattern.exec(text) ?? compactGeoPointPattern.exec(text);
  if (!match) {
    return null;
  }

  const latitude = Number(match[1]);
  const longitude = Number(match[2]);
  if (!isValidGeoPoint(latitude, longitude)) {
    return null;
  }

  return {
    latitude,
    longitude,
  };
}

export function formatRuntimeGeoPointValue(point: RuntimeFormGeoPoint) {
  return `Latitude: ${point.latitude.toFixed(6)}, Longitude: ${point.longitude.toFixed(6)}`;
}

export function runtimeGeoPointMapUrl(point: RuntimeFormGeoPoint | null) {
  if (!point) {
    return "";
  }
  return `https://www.google.com/maps/place/${point.latitude},${point.longitude}`;
}
