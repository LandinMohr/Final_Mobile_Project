import { loadJSON, saveJSON } from "./storage";

export interface LocationEntry {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: number; // Unix ms
}

const STORAGE_KEY = "location_logs_v1";
const MAX_ENTRIES = 500;

export async function appendLocationEntry(entry: LocationEntry): Promise<void> {
  const existing = (await loadJSON<LocationEntry[]>(STORAGE_KEY)) ?? [];
  const updated = [...existing, entry].slice(-MAX_ENTRIES);
  await saveJSON(STORAGE_KEY, updated);
}

export async function loadLocationLogs(): Promise<LocationEntry[]> {
  return (await loadJSON<LocationEntry[]>(STORAGE_KEY)) ?? [];
}

export async function clearLocationLogs(): Promise<void> {
  await saveJSON<LocationEntry[]>(STORAGE_KEY, null);
}
