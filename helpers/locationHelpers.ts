export const LOCATION_STORAGE_KEY = "pickmeup-selected-location";
export const LOCATION_CHANGE_EVENT = "pickmeup-location-change";

export function getSelectedLocation(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(LOCATION_STORAGE_KEY);
}

export function setSelectedLocation(location: string | null): void {
  if (typeof window === "undefined") {
    return;
  }

  if (location) {
    window.localStorage.setItem(LOCATION_STORAGE_KEY, location);
  } else {
    window.localStorage.removeItem(LOCATION_STORAGE_KEY);
  }

  window.dispatchEvent(
    new CustomEvent(LOCATION_CHANGE_EVENT, {
      detail: { location },
    })
  );
}
