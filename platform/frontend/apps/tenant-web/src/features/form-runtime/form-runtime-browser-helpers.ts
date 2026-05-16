import type { RuntimeFormGeoPoint } from "@platform/forms";

export const AUTOSAVE_DELAY_MS = 350;

function isValidRuntimeGeoPoint(latitude: number, longitude: number) {
  return Number.isFinite(latitude)
    && Number.isFinite(longitude)
    && latitude >= -90
    && latitude <= 90
    && longitude >= -180
    && longitude <= 180;
}

function getBrowserGeoPoint(): Promise<RuntimeFormGeoPoint> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Browser geolocation is not available."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        if (!isValidRuntimeGeoPoint(latitude, longitude)) {
          reject(new Error("Browser geolocation returned invalid coordinates."));
          return;
        }
        resolve({ latitude, longitude });
      },
      (error) => reject(error),
      {
        enableHighAccuracy: true,
        maximumAge: 60_000,
        timeout: 8_000,
      },
    );
  });
}

async function getIpGeoPoint(): Promise<RuntimeFormGeoPoint | null> {
  try {
    const response = await fetch("https://ipapi.co/json/");
    if (!response.ok) {
      return null;
    }
    const data = await response.json() as { latitude?: unknown; longitude?: unknown };
    const latitude = typeof data.latitude === "number" ? data.latitude : Number(data.latitude);
    const longitude = typeof data.longitude === "number" ? data.longitude : Number(data.longitude);
    return isValidRuntimeGeoPoint(latitude, longitude) ? { latitude, longitude } : null;
  } catch {
    return null;
  }
}

export async function resolveRuntimeGeoPoint(): Promise<RuntimeFormGeoPoint | null> {
  try {
    return await getBrowserGeoPoint();
  } catch {
    return getIpGeoPoint();
  }
}

export function createClientCreateToken() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (placeholder) => {
    const randomValue = Math.floor(Math.random() * 16);
    const value = placeholder === "x" ? randomValue : (randomValue & 0x3) | 0x8;
    return value.toString(16);
  });
}

export function getRuntimeControlId(definitionId: string, fieldId: string) {
  return `runtime-form-${definitionId}-${fieldId}`;
}

export function getRuntimeOptionControl(controlId: string) {
  return Array.from(document.querySelectorAll<HTMLElement>("[id]")).find((element) =>
    element.id.startsWith(`${controlId}-`),
  ) ?? null;
}
