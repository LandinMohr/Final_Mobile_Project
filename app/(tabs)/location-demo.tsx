import { LocationSubscription } from "expo-location";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  appendLocationEntry,
  clearLocationLogs,
  loadLocationLogs,
  LocationEntry,
} from "@/lib/location-repo";
import {
  getCurrentLocation,
  requestBackgroundPermission,
  requestForegroundPermission,
  startBackgroundTracking,
  startForegroundTracking,
  stopBackgroundTracking,
} from "@/lib/location-service";

type PermissionStatus = "unknown" | "granted" | "denied";
type TrackingState = "idle" | "active" | "paused";

export default function LocationDemoScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [permissionStatus, setPermissionStatus] =
    useState<PermissionStatus>("unknown");
  const [backgroundGranted, setBackgroundGranted] = useState(false);
  const [trackingState, setTrackingState] = useState<TrackingState>("idle");
  const [currentLocation, setCurrentLocation] = useState<LocationEntry | null>(
    null,
  );
  const [logs, setLogs] = useState<LocationEntry[]>([]);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const subscriptionRef = useRef<LocationSubscription | null>(null);

  // Load persisted logs on mount
  useEffect(() => {
    loadLocationLogs().then(setLogs);
  }, []);

  // Stop tracking and remove subscription on unmount
  useEffect(() => {
    return () => {
      subscriptionRef.current?.remove();
      stopBackgroundTracking().catch(() => {});
    };
  }, []);

  // ── Permission ──────────────────────────────────────────────────────────────

  const ensureForegroundPermission = useCallback(async (): Promise<boolean> => {
    if (permissionStatus === "granted") return true;
    const granted = await requestForegroundPermission();
    setPermissionStatus(granted ? "granted" : "denied");
    return granted;
  }, [permissionStatus]);

  // ── One-shot location ────────────────────────────────────────────────────────

  const handleGetCurrentLocation = useCallback(async () => {
    const ok = await ensureForegroundPermission();
    if (!ok) return;
    setIsLoadingLocation(true);
    try {
      const loc = await getCurrentLocation();
      setCurrentLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        accuracy: loc.coords.accuracy,
        timestamp: loc.timestamp,
      });
    } catch {
      Alert.alert(
        "Error",
        "Failed to retrieve current location. Make sure GPS is enabled.",
      );
    } finally {
      setIsLoadingLocation(false);
    }
  }, [ensureForegroundPermission]);

  // ── Shared update handler ────────────────────────────────────────────────────

  const handleLocationUpdate = useCallback(async (entry: LocationEntry) => {
    setCurrentLocation(entry);
    await appendLocationEntry(entry);
    setLogs((prev) => [...prev, entry].slice(-500));
  }, []);

  // ── Start ────────────────────────────────────────────────────────────────────

  const handleStartTracking = useCallback(async () => {
    const ok = await ensureForegroundPermission();
    if (!ok) return;

    const sub = await startForegroundTracking(handleLocationUpdate);
    subscriptionRef.current = sub;

    const bgGranted = await requestBackgroundPermission();
    setBackgroundGranted(bgGranted);
    if (bgGranted) {
      await startBackgroundTracking().catch((err) =>
        console.warn("Background tracking unavailable:", err),
      );
    }

    setTrackingState("active");
  }, [ensureForegroundPermission, handleLocationUpdate]);

  // ── Pause ────────────────────────────────────────────────────────────────────

  const handlePauseTracking = useCallback(async () => {
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
    await stopBackgroundTracking().catch(() => {});
    setTrackingState("paused");
  }, []);

  // ── Resume ───────────────────────────────────────────────────────────────────

  const handleResumeTracking = useCallback(async () => {
    const sub = await startForegroundTracking(handleLocationUpdate);
    subscriptionRef.current = sub;

    if (backgroundGranted) {
      await startBackgroundTracking().catch((err) =>
        console.warn("Background tracking unavailable:", err),
      );
    }

    setTrackingState("active");
  }, [backgroundGranted, handleLocationUpdate]);

  // ── Stop ─────────────────────────────────────────────────────────────────────

  const handleStopTracking = useCallback(async () => {
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
    await stopBackgroundTracking().catch(() => {});
    setTrackingState("idle");
  }, []);

  // ── Clear logs ───────────────────────────────────────────────────────────────

  const handleClearLogs = useCallback(() => {
    Alert.alert(
      "Clear Location Logs",
      "This will permanently delete all saved coordinates.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete All",
          style: "destructive",
          onPress: async () => {
            await clearLocationLogs();
            setLogs([]);
          },
        },
      ],
    );
  }, []);

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const formatCoords = (entry: LocationEntry) =>
    `${entry.latitude.toFixed(6)},  ${entry.longitude.toFixed(6)}`;

  const formatTime = (ts: number) => new Date(ts).toLocaleTimeString();

  const trackingColor =
    trackingState === "active"
      ? "#2e7d32"
      : trackingState === "paused"
        ? "#e65100"
        : colors.icon;

  const trackingLabel =
    trackingState === "active"
      ? "Active"
      : trackingState === "paused"
        ? "Paused"
        : "Stopped";

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Privacy Notice ───────────────────────────────────────────────── */}
        <View style={[styles.privacyCard, { borderColor: colors.tint }]}>
          <ThemedText type="defaultSemiBold" style={styles.privacyTitle}>
            Privacy Notice
          </ThemedText>
          <ThemedText style={styles.privacyLine}>
            <ThemedText type="defaultSemiBold">What is collected: </ThemedText>
            GPS coordinates (latitude, longitude, accuracy).
          </ThemedText>
          <ThemedText style={styles.privacyLine}>
            <ThemedText type="defaultSemiBold">
              When it is collected:{" "}
            </ThemedText>
            Only while tracking is active — both when the app is open
            (foreground) and minimized (background, if permission is granted).
          </ThemedText>
          <ThemedText style={styles.privacyLine}>
            <ThemedText type="defaultSemiBold">Where it is stored: </ThemedText>
            Locally on this device only. Data is never sent to any server.
          </ThemedText>
          <ThemedText style={styles.privacyLine}>
            <ThemedText type="defaultSemiBold">Your control: </ThemedText>
            Tap <ThemedText type="defaultSemiBold">Pause</ThemedText> to
            temporarily stop recording. Tap{" "}
            <ThemedText type="defaultSemiBold">Stop</ThemedText> to end the
            session. Tap{" "}
            <ThemedText type="defaultSemiBold">Clear Logs</ThemedText> to delete
            all saved data.
          </ThemedText>
        </View>

        {/* ── Permission Denied Banner ─────────────────────────────────────── */}
        {permissionStatus === "denied" && (
          <View style={styles.deniedBanner}>
            <ThemedText style={styles.deniedText}>
              Location access is required to use this feature. Please enable it
              in your device Settings &gt; Privacy &gt; Location Services.
            </ThemedText>
          </View>
        )}

        {/* ── Current Coordinates ──────────────────────────────────────────── */}
        <View style={[styles.coordCard, { borderColor: colors.icon }]}>
          <ThemedText type="subtitle" style={styles.coordTitle}>
            Current Location
          </ThemedText>
          {currentLocation ? (
            <>
              <ThemedText style={[styles.coordValue, { color: colors.text }]}>
                Lat: {currentLocation.latitude.toFixed(6)}
              </ThemedText>
              <ThemedText style={[styles.coordValue, { color: colors.text }]}>
                Lng: {currentLocation.longitude.toFixed(6)}
              </ThemedText>
              {currentLocation.accuracy != null && (
                <ThemedText style={[styles.coordMeta, { color: colors.icon }]}>
                  Accuracy: ±{currentLocation.accuracy.toFixed(0)} m
                </ThemedText>
              )}
              <ThemedText style={[styles.coordMeta, { color: colors.icon }]}>
                {formatTime(currentLocation.timestamp)}
              </ThemedText>
            </>
          ) : (
            <ThemedText style={{ color: colors.icon }}>
              No location yet. Tap "Get Current Location" or start tracking.
            </ThemedText>
          )}
        </View>

        {/* ── Tracking Status ───────────────────────────────────────────────── */}
        <View style={styles.statusRow}>
          <ThemedText type="defaultSemiBold">Tracking: </ThemedText>
          <ThemedText style={{ color: trackingColor, fontWeight: "600" }}>
            {trackingLabel}
          </ThemedText>
          {backgroundGranted && trackingState !== "idle" && (
            <ThemedText style={[styles.bgBadge, { color: colors.icon }]}>
              {" "}
              + background
            </ThemedText>
          )}
        </View>

        {/* ── Action Buttons ───────────────────────────────────────────────── */}
        <Pressable
          style={[
            styles.btn,
            { backgroundColor: colors.tint },
            isLoadingLocation && styles.btnDisabled,
          ]}
          onPress={handleGetCurrentLocation}
          disabled={isLoadingLocation}
          accessibilityRole="button"
          accessibilityLabel="Get current location"
        >
          <ThemedText style={styles.btnText}>
            {isLoadingLocation ? "Locating…" : "Get Current Location"}
          </ThemedText>
        </Pressable>

        {trackingState === "idle" && (
          <Pressable
            style={[styles.btn, styles.btnGreen]}
            onPress={handleStartTracking}
            accessibilityRole="button"
            accessibilityLabel="Start tracking"
          >
            <ThemedText style={styles.btnText}>Start Tracking</ThemedText>
          </Pressable>
        )}

        {trackingState === "active" && (
          <>
            <Pressable
              style={[styles.btn, styles.btnOrange]}
              onPress={handlePauseTracking}
              accessibilityRole="button"
              accessibilityLabel="Pause tracking"
            >
              <ThemedText style={styles.btnText}>Pause Tracking</ThemedText>
            </Pressable>
            <Pressable
              style={[styles.btn, styles.btnRed]}
              onPress={handleStopTracking}
              accessibilityRole="button"
              accessibilityLabel="Stop tracking"
            >
              <ThemedText style={styles.btnText}>Stop Tracking</ThemedText>
            </Pressable>
          </>
        )}

        {trackingState === "paused" && (
          <>
            <Pressable
              style={[styles.btn, styles.btnGreen]}
              onPress={handleResumeTracking}
              accessibilityRole="button"
              accessibilityLabel="Resume tracking"
            >
              <ThemedText style={styles.btnText}>Resume Tracking</ThemedText>
            </Pressable>
            <Pressable
              style={[styles.btn, styles.btnRed]}
              onPress={handleStopTracking}
              accessibilityRole="button"
              accessibilityLabel="Stop tracking"
            >
              <ThemedText style={styles.btnText}>Stop Tracking</ThemedText>
            </Pressable>
          </>
        )}

        {/* ── Location Log ─────────────────────────────────────────────────── */}
        <View style={styles.logsHeader}>
          <ThemedText type="subtitle">
            Location Log{logs.length > 0 ? ` (${logs.length})` : ""}
          </ThemedText>
          {logs.length > 0 && (
            <Pressable
              onPress={handleClearLogs}
              accessibilityRole="button"
              accessibilityLabel="Clear all location logs"
            >
              <ThemedText style={styles.clearBtn}>Clear Logs</ThemedText>
            </Pressable>
          )}
        </View>

        {logs.length === 0 ? (
          <ThemedText style={{ color: colors.icon, marginBottom: 16 }}>
            No location entries recorded yet.
          </ThemedText>
        ) : (
          [...logs]
            .reverse()
            .slice(0, 50)
            .map((entry, i) => (
              <View
                key={`${entry.timestamp}-${i}`}
                style={[styles.logRow, { borderColor: colors.icon }]}
              >
                <ThemedText style={[styles.logCoord, { color: colors.text }]}>
                  {formatCoords(entry)}
                </ThemedText>
                <ThemedText style={[styles.logTime, { color: colors.icon }]}>
                  {formatTime(entry.timestamp)}
                </ThemedText>
              </View>
            ))
        )}
      </ScrollView>
    </ThemedView>
  );
}

const MONO = Platform.select({ ios: "ui-monospace", default: "monospace" });

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 56,
    paddingBottom: 40,
  },

  // Privacy card
  privacyCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    gap: 6,
  },
  privacyTitle: {
    fontSize: 15,
    marginBottom: 4,
  },
  privacyLine: {
    fontSize: 13,
    lineHeight: 20,
  },

  // Denied banner
  deniedBanner: {
    backgroundColor: "#fdecea",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  deniedText: {
    color: "#b71c1c",
    fontSize: 14,
    lineHeight: 20,
  },

  // Coord card
  coordCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    gap: 4,
  },
  coordTitle: {
    marginBottom: 6,
  },
  coordValue: {
    fontSize: 18,
    fontWeight: "600",
    fontFamily: MONO,
    letterSpacing: 0.5,
  },
  coordMeta: {
    fontSize: 13,
    marginTop: 2,
  },

  // Status row
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  bgBadge: {
    fontSize: 13,
  },

  // Buttons
  btn: {
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 20,
    alignItems: "center",
    marginBottom: 10,
  },
  btnDisabled: {
    opacity: 0.55,
  },
  btnGreen: {
    backgroundColor: "#2e7d32",
  },
  btnOrange: {
    backgroundColor: "#e65100",
  },
  btnRed: {
    backgroundColor: "#b71c1c",
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  // Logs
  logsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 22,
    marginBottom: 10,
  },
  clearBtn: {
    color: "#b71c1c",
    fontSize: 14,
    fontWeight: "600",
  },
  logRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 6,
  },
  logCoord: {
    fontSize: 13,
    fontFamily: MONO,
    flex: 1,
    marginRight: 8,
  },
  logTime: {
    fontSize: 12,
  },
});
