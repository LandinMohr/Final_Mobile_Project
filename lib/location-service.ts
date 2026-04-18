/**
 * Location service — foreground & background tracking.
 *
 * IMPORTANT: This file must be imported near the app root so that
 * TaskManager.defineTask() runs before any background-location wakeup
 * fires (even when the user has not yet visited the tracking screen).
 */
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { Platform } from "react-native";
import { appendLocationEntry } from "./location-repo";

export const BACKGROUND_LOCATION_TASK = "bg-location-task";

// ─── Background task (must be defined at module top-level) ──────────────────

if (Platform.OS !== "web") {
  TaskManager.defineTask(
    BACKGROUND_LOCATION_TASK,
    async ({
      data,
      error,
    }: TaskManager.TaskManagerTaskBody<{
      locations: Location.LocationObject[];
    }>) => {
      if (error) {
        console.warn("[BG Location] error:", error.message);
        return;
      }
      const locations =
        (data as { locations: Location.LocationObject[] })?.locations ?? [];
      for (const loc of locations) {
        await appendLocationEntry({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          accuracy: loc.coords.accuracy,
          timestamp: loc.timestamp,
        }).catch((err) => console.warn("[BG Location] persist error:", err));
      }
    },
  );
}

// ─── Permission helpers ──────────────────────────────────────────────────────

export async function requestForegroundPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === Location.PermissionStatus.GRANTED;
}

export async function requestBackgroundPermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const { status } = await Location.requestBackgroundPermissionsAsync();
  return status === Location.PermissionStatus.GRANTED;
}

// ─── One-shot position ───────────────────────────────────────────────────────

export async function getCurrentLocation(): Promise<Location.LocationObject> {
  return Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });
}

// ─── Foreground continuous tracking ─────────────────────────────────────────

export async function startForegroundTracking(
  onUpdate: (entry: {
    latitude: number;
    longitude: number;
    accuracy: number | null;
    timestamp: number;
  }) => void,
): Promise<Location.LocationSubscription> {
  const sub = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      timeInterval: 5000,
      distanceInterval: 0,
    },
    (loc) => {
      onUpdate({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        accuracy: loc.coords.accuracy,
        timestamp: loc.timestamp,
      });
    },
  );
  return sub;
}

// ─── Background task management ─────────────────────────────────────────────

export async function startBackgroundTracking(): Promise<void> {
  if (Platform.OS === "web") return;
  const isRegistered = await TaskManager.isTaskRegisteredAsync(
    BACKGROUND_LOCATION_TASK,
  );
  if (isRegistered) return;

  const options: Location.LocationTaskOptions = {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 10_000,
    distanceInterval: 0,
    showsBackgroundLocationIndicator: true,
  };

  // Android requires a foreground service notification
  if (Platform.OS === "android") {
    (
      options as Location.LocationTaskOptions & { foregroundService: object }
    ).foregroundService = {
      notificationTitle: "Location Tracking Active",
      notificationBody: "Your location is being recorded in the background.",
      notificationColor: "#0a7ea4",
    };
  }

  await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, options);
}

export async function stopBackgroundTracking(): Promise<void> {
  if (Platform.OS === "web") return;
  const isRegistered = await TaskManager.isTaskRegisteredAsync(
    BACKGROUND_LOCATION_TASK,
  );
  if (isRegistered) {
    await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
  }
}
