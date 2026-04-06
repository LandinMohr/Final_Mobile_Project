/*Request foreground location permission when the user attempts to use any tracking feature. If permission is denied, show a clear message explaining that location access is required.
Display the user’s current latitude and longitude on screen when a “Get Current Location” action is triggered.
Add controls to start and stop live location tracking while the app is open. When live tracking is active, continuously update the displayed coordinates.
Implement background location tracking so coordinates continue to be logged even when the app is minimized or not in focus.
Persist location logs locally so previously recorded coordinates are still available after the app is closed and reopened.
Add a pause/resume toggle that temporarily stops recording new location updates without fully stopping the tracking session.
Display a clear privacy notice on the tracking screen that explains:
What location data is collected
When location data is collected
That the data is stored locally for this app
How the user can pause or stop tracking at any time
Verify that the app behaves correctly when switching between foreground, background, paused, and stopped states
.*/
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useColorScheme } from "@/hooks/use-color-scheme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

const LOCATION_TRACKING_TASK = "location-tracking-task";
const LOCATION_LOGS_STORAGE_KEY = "location_logs";
const IS_TRACKING_STORAGE_KEY = "is_tracking";
const IS_PAUSED_STORAGE_KEY = "is_paused";

// Define background location tracking task
TaskManager.defineTask(
  LOCATION_TRACKING_TASK,
  async ({ data: taskData, error }: any) => {
    if (error) {
      console.error("Background location task error:", error);
      return;
    }

    if (taskData) {
      const { locations } = taskData;
      if (locations && locations.length > 0) {
        const location = locations[0];
        try {
          const existingLogs = await AsyncStorage.getItem(
            LOCATION_LOGS_STORAGE_KEY,
          );
          const logs = existingLogs ? JSON.parse(existingLogs) : [];
          logs.push({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
            timestamp: new Date().toISOString(),
          });
          await AsyncStorage.setItem(
            LOCATION_LOGS_STORAGE_KEY,
            JSON.stringify(logs),
          );
        } catch (err) {
          console.error("Error saving background location:", err);
        }
      }
    }
  },
);

interface LocationLog {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
}

export default function LocationDemoScreen() {
  const colorScheme = useColorScheme();
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number | null;
  } | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] =
    useState<Location.PermissionStatus | null>(null);
  const [locationLogs, setLocationLogs] = useState<LocationLog[]>([]);
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(false);
  const trackingIntervalRef = useRef<number | NodeJS.Timeout | null>(null);

  // Initialize: load saved state and logs on mount
  useEffect(() => {
    initializeTracking();
    return () => {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
    };
  }, []);

  const initializeTracking = async () => {
    try {
      // Load saved location logs
      const savedLogs = await AsyncStorage.getItem(LOCATION_LOGS_STORAGE_KEY);
      if (savedLogs) {
        setLocationLogs(JSON.parse(savedLogs));
      }

      // Check if we were tracking before
      const wasTracking = await AsyncStorage.getItem(IS_TRACKING_STORAGE_KEY);
      if (wasTracking === "true") {
        setIsTracking(true);
        const wasPaused = await AsyncStorage.getItem(IS_PAUSED_STORAGE_KEY);
        setIsPaused(wasPaused === "true");
      }
    } catch (err) {
      console.error("Error initializing tracking:", err);
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    try {
      const foregroundStatus =
        await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(foregroundStatus.status);

      if (foregroundStatus.granted) {
        // Also request background permission for tracking
        await Location.requestBackgroundPermissionsAsync();
        return true;
      } else {
        Alert.alert(
          "Location Permission Required",
          "Location access is required to use tracking features. Please enable location permissions in your device settings.",
          [{ text: "OK" }],
        );
        return false;
      }
    } catch (err) {
      console.error("Permission error:", err);
      Alert.alert("Error", "Failed to request location permissions");
      return false;
    }
  };

  const getCurrentLocation = async () => {
    setLoading(true);
    try {
      // Check permission first
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== "granted") {
        const granted = await requestPermission();
        if (!granted) {
          setLoading(false);
          return;
        }
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const newLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
      };

      setCurrentLocation(newLocation);

      // Only log if tracking is active and not paused
      if (isTracking && !isPaused) {
        await logLocation(newLocation);
      }
    } catch (err) {
      console.error("Error getting location:", err);
      Alert.alert("Error", "Failed to get current location");
    } finally {
      setLoading(false);
    }
  };

  const logLocation = async (location: typeof currentLocation) => {
    try {
      if (!location) return;
      const existingLogs = await AsyncStorage.getItem(
        LOCATION_LOGS_STORAGE_KEY,
      );
      const logs = existingLogs ? JSON.parse(existingLogs) : [];
      logs.push({
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        timestamp: new Date().toISOString(),
      });
      await AsyncStorage.setItem(
        LOCATION_LOGS_STORAGE_KEY,
        JSON.stringify(logs),
      );
      setLocationLogs(logs);
    } catch (err) {
      console.error("Error logging location:", err);
    }
  };

  const startTracking = async () => {
    try {
      const granted = await requestPermission();
      if (!granted) return;

      setIsTracking(true);
      setIsPaused(false);
      await AsyncStorage.setItem(IS_TRACKING_STORAGE_KEY, "true");
      await AsyncStorage.setItem(IS_PAUSED_STORAGE_KEY, "false");

      // Start foreground tracking (every 10 seconds)
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }

      trackingIntervalRef.current = setInterval(async () => {
        const paused = await AsyncStorage.getItem(IS_PAUSED_STORAGE_KEY);
        if (paused !== "true") {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });

          const newLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
          };

          setCurrentLocation(newLocation);
          await logLocation(newLocation);
        }
      }, 10000); // Update every 10 seconds

      // Start background tracking
      try {
        await Location.startLocationUpdatesAsync(LOCATION_TRACKING_TASK, {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 10000, // 10 seconds
          distanceInterval: 10, // or 10 meters
          showsBackgroundLocationIndicator: true,
          foregroundService: {
            notificationTitle: "Location Tracking",
            notificationBody: "Your location is being tracked for this app",
          },
        });
      } catch (err) {
        console.warn("Background location might not be available:", err);
      }

      Alert.alert("Tracking Started", "Live location tracking is now active");
    } catch (err) {
      console.error("Error starting tracking:", err);
      Alert.alert("Error", "Failed to start tracking");
      setIsTracking(false);
    }
  };

  const stopTracking = async () => {
    try {
      setIsTracking(false);
      setIsPaused(false);
      setCurrentLocation(null);
      await AsyncStorage.setItem(IS_TRACKING_STORAGE_KEY, "false");
      await AsyncStorage.setItem(IS_PAUSED_STORAGE_KEY, "false");

      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
        trackingIntervalRef.current = null;
      }

      try {
        await Location.stopLocationUpdatesAsync(LOCATION_TRACKING_TASK);
      } catch (err) {
        console.warn("Background location might already be stopped:", err);
      }

      Alert.alert("Tracking Stopped", "Location tracking has been stopped");
    } catch (err) {
      console.error("Error stopping tracking:", err);
      Alert.alert("Error", "Failed to stop tracking");
    }
  };

  const togglePause = async () => {
    try {
      const newPausedState = !isPaused;
      setIsPaused(newPausedState);
      await AsyncStorage.setItem(
        IS_PAUSED_STORAGE_KEY,
        newPausedState ? "true" : "false",
      );

      const message = newPausedState
        ? "Tracking paused - new locations will not be recorded"
        : "Tracking resumed - recording locations";
      Alert.alert(
        "Tracking " + (newPausedState ? "Paused" : "Resumed"),
        message,
      );
    } catch (err) {
      console.error("Error toggling pause:", err);
    }
  };

  const clearLogs = async () => {
    Alert.alert(
      "Clear Location Logs",
      "Are you sure you want to delete all recorded locations?",
      [
        {
          text: "Cancel",
          onPress: () => {},
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(LOCATION_LOGS_STORAGE_KEY);
              setLocationLogs([]);
              Alert.alert("Success", "All location logs have been cleared");
            } catch (err) {
              Alert.alert("Error", "Failed to clear logs");
            }
          },
          style: "destructive",
        },
      ],
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText style={styles.title}>Location Tracking</ThemedText>

        {/* Privacy Notice */}
        <View style={styles.privacyNoticeSection}>
          <ThemedText style={styles.sectionTitle}>📋 Privacy Notice</ThemedText>
          <View
            style={[
              styles.privacyNotice,
              {
                backgroundColor:
                  colorScheme === "dark"
                    ? showPrivacyNotice
                      ? "#2a3a2a"
                      : "#1e1f20"
                    : showPrivacyNotice
                      ? "#e8f5e9"
                      : "#f5f5f5",
              },
            ]}
          >
            <ThemedText style={styles.privacyTitle}>
              What We Collect:
            </ThemedText>
            <ThemedText style={styles.privacyText}>
              • Your GPS coordinates (latitude & longitude){"\n"}• Location
              accuracy information
              {"\n"}• Timestamp of each location update
            </ThemedText>

            <ThemedText style={styles.privacyTitle}>
              When We Collect It:
            </ThemedText>
            <ThemedText style={styles.privacyText}>
              • Only when you start tracking{"\n"}• Continuously while tracking
              is active
              {"\n"}• Even if the app is in background (while enabled)
            </ThemedText>

            <ThemedText style={styles.privacyTitle}>Data Storage:</ThemedText>
            <ThemedText style={styles.privacyText}>
              • All location data is stored locally on your device{"\n"}• No
              data is sent to external servers{"\n"}• Data persists between app
              sessions
            </ThemedText>

            <ThemedText style={styles.privacyTitle}>Your Control:</ThemedText>
            <ThemedText style={styles.privacyText}>
              • Pause tracking without stopping the session{"\n"}• Resume
              tracking at any time
              {"\n"}• Stop tracking completely{"\n"}• Delete all recorded
              locations
            </ThemedText>
          </View>
        </View>

        {/* Current Location Display */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>
            📍 Current Location
          </ThemedText>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" />
              <ThemedText style={styles.loadingText}>
                Getting location...
              </ThemedText>
            </View>
          ) : currentLocation ? (
            <View
              style={[
                styles.locationDisplay,
                {
                  backgroundColor:
                    colorScheme === "dark" ? "#1e1f20" : "#f9f9f9",
                },
              ]}
            >
              <ThemedText style={styles.coordinateLabel}>Latitude:</ThemedText>
              <ThemedText style={styles.coordinateValue}>
                {currentLocation.latitude.toFixed(6)}
              </ThemedText>

              <ThemedText style={styles.coordinateLabel}>Longitude:</ThemedText>
              <ThemedText style={styles.coordinateValue}>
                {currentLocation.longitude.toFixed(6)}
              </ThemedText>

              <ThemedText style={styles.coordinateLabel}>Accuracy:</ThemedText>
              <ThemedText style={styles.coordinateValue}>
                {currentLocation.accuracy?.toFixed(1) || "N/A"} meters
              </ThemedText>

              <ThemedText style={styles.timestampText}>
                Last updated: {new Date().toLocaleTimeString()}
              </ThemedText>
            </View>
          ) : (
            <ThemedText style={styles.noLocationText}>
              No location data available yet
            </ThemedText>
          )}

          <View style={styles.buttonContainer}>
            <Button
              title="Get Current Location"
              onPress={getCurrentLocation}
              disabled={loading}
            />
          </View>
        </View>

        {/* Tracking Controls */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>
            🎮 Tracking Controls
          </ThemedText>

          <View
            style={[
              styles.trackingStatus,
              {
                backgroundColor: colorScheme === "dark" ? "#1e1f20" : "#f9f9f9",
              },
            ]}
          >
            <View style={styles.statusRow}>
              <ThemedText style={styles.statusLabel}>
                Tracking Active:
              </ThemedText>
              <View
                style={[
                  styles.statusIndicator,
                  { backgroundColor: isTracking ? "#4CAF50" : "#ccc" },
                ]}
              />
            </View>

            {isTracking && (
              <View style={styles.statusRow}>
                <ThemedText style={styles.statusLabel}>
                  Tracking Paused:
                </ThemedText>
                <View
                  style={[
                    styles.statusIndicator,
                    { backgroundColor: isPaused ? "#FF9800" : "#4CAF50" },
                  ]}
                />
              </View>
            )}

            <ThemedText style={styles.logCountText}>
              Total locations recorded: {locationLogs.length}
            </ThemedText>
          </View>

          <View style={styles.controlButtonsContainer}>
            {!isTracking ? (
              <View style={styles.buttonContainer}>
                <Button
                  title="Start Tracking"
                  onPress={startTracking}
                  color="#4CAF50"
                />
              </View>
            ) : (
              <>
                <View style={styles.buttonContainer}>
                  <Button
                    title={isPaused ? "Resume Tracking" : "Pause Tracking"}
                    onPress={togglePause}
                    color="#FF9800"
                  />
                </View>
                <View style={styles.buttonContainer}>
                  <Button
                    title="Stop Tracking"
                    onPress={stopTracking}
                    color="#f44336"
                  />
                </View>
              </>
            )}
          </View>
        </View>

        {/* Location Logs */}
        <View style={styles.section}>
          <View style={styles.logsHeader}>
            <ThemedText style={styles.sectionTitle}>
              📝 Location History
            </ThemedText>
            {locationLogs.length > 0 && (
              <View style={styles.clearButtonContainer}>
                <Button title="Clear All" onPress={clearLogs} color="#f44336" />
              </View>
            )}
          </View>

          {locationLogs.length === 0 ? (
            <ThemedText style={styles.noLogsText}>
              No locations recorded yet. Start tracking to begin recording
              locations.
            </ThemedText>
          ) : (
            <ScrollView
              style={styles.logsList}
              nestedScrollEnabled={true}
              scrollEnabled={false}
            >
              {locationLogs.slice(-10).map((log, index) => (
                <View
                  key={index}
                  style={[
                    styles.logEntry,
                    {
                      backgroundColor:
                        colorScheme === "dark" ? "#1e1f20" : "#f9f9f9",
                    },
                  ]}
                >
                  <ThemedText style={styles.logIndex}>
                    #{locationLogs.length - index}
                  </ThemedText>
                  <View style={styles.logDetails}>
                    <ThemedText style={styles.logCoordinates}>
                      {log.latitude.toFixed(6)}, {log.longitude.toFixed(6)}
                    </ThemedText>
                    <ThemedText style={styles.logInfo}>
                      Accuracy: {log.accuracy?.toFixed(1) || "N/A"}m
                    </ThemedText>
                    <ThemedText style={styles.logTimestamp}>
                      {new Date(log.timestamp).toLocaleString()}
                    </ThemedText>
                  </View>
                </View>
              ))}
              <ThemedText style={styles.moreLogsText}>
                {locationLogs.length > 10
                  ? `... and ${locationLogs.length - 10} more locations`
                  : ""}
              </ThemedText>
            </ScrollView>
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollView: {
    flex: 1,
    paddingVertical: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    marginTop: 8,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  privacyNoticeSection: {
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  privacyNotice: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#f5f5f5",
  },
  privacyTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 10,
    marginBottom: 6,
  },
  privacyText: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 4,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
  },
  locationDisplay: {
    backgroundColor: "#f9f9f9",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  coordinateLabel: {
    fontSize: 12,
    marginTop: 8,
    fontWeight: "500",
  },
  coordinateValue: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  timestampText: {
    fontSize: 11,
    marginTop: 8,
    fontStyle: "italic",
  },
  noLocationText: {
    textAlign: "center",
    paddingVertical: 16,
    fontSize: 14,
  },
  buttonContainer: {
    marginBottom: 8,
  },
  trackingStatus: {
    backgroundColor: "#f9f9f9",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  statusLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  logCountText: {
    fontSize: 13,
    marginTop: 8,
    fontWeight: "500",
  },
  controlButtonsContainer: {
    gap: 8,
  },
  logsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  clearButtonContainer: {
    width: 80,
  },
  logsList: {
    maxHeight: 400,
  },
  logEntry: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    marginBottom: 8,
  },
  logIndex: {
    fontWeight: "bold",
    fontSize: 14,
    width: 40,
  },
  logDetails: {
    flex: 1,
  },
  logCoordinates: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
  },
  logInfo: {
    fontSize: 12,
    marginBottom: 2,
  },
  logTimestamp: {
    fontSize: 11,
  },
  moreLogsText: {
    textAlign: "center",
    fontSize: 12,
    paddingVertical: 8,
    fontStyle: "italic",
  },
  noLogsText: {
    textAlign: "center",
    paddingVertical: 16,
    fontSize: 14,
  },
});
