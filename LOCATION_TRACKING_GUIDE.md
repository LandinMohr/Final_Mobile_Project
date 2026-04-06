# Location Tracking Implementation Guide

## Overview

This document provides a comprehensive guide to the location tracking feature implemented in the mobile app.

## Features Implemented

### 1. Permission Request System

**Feature**: Foreground and background location permissions

- **Request Flow**: Permissions are requested when user initiates any tracking action
- **Error Handling**: If permission is denied, users see a clear alert explaining why location access is required
- **Background Permission**: Automatically requested alongside foreground permission for continuous tracking

### 2. Current Location Display

**Feature**: Get and display current GPS coordinates

- **How to Use**: Tap "Get Current Location" button
- **Display Elements**:
  - Latitude (decimal degrees, 6 decimal places)
  - Longitude (decimal degrees, 6 decimal places)
  - Accuracy (in meters)
  - Timestamp of last update
- **Loading State**: Shows activity indicator while fetching location
- **Automatic Logging**: If tracking is active and not paused, location is automatically logged

### 3. Live Foreground Tracking

**Feature**: Continuous location tracking while app is in foreground

- **How to Start**: Tap "Start Tracking" button
- **Update Frequency**: Coordinates updated every 10 seconds
- **Status Indicator**: Green indicator shows when tracking is active
- **Automatic Logging**: Each location is logged to device storage
- **Constraint**: Respects pause/resume state

### 4. Background Location Tracking

**Feature**: Continues tracking when app is minimized or closed

- **Implementation**: Uses `expo-task-manager` and `expo-location.startLocationUpdatesAsync()`
- **Update Frequency**: Updates every 10 seconds or 10 meters (whichever comes first)
- **Status Bar**: Shows "Location Tracking" notification on Android
- **Automatic Logging**: Background locations automatically saved to AsyncStorage
- **Note**: Requires background location permission granted by user

### 5. Persistent Location Logs

**Feature**: Saves location history locally

- **Storage**: Uses AsyncStorage (key: `location_logs`)
- **Data Persisted**: Latitude, longitude, accuracy, timestamp
- **Persistence**: Data survives app closure and restart
- **Display**: Shows last 10 locations in Location History section
- **Counter**: Total location count shown in UI
- **Clear Action**: User can delete all logs via "Clear All" button

### 6. Pause/Resume Functionality

**Feature**: Temporarily stop recording without ending session

- **State**: Independent from tracking on/off state
- **Status Indicator**: Orange indicator shows when tracking is paused
- **Behavior When Paused**:
  - `pauseTracking()` stops recording new locations
  - Background tracking continues but doesn't log data
  - User can resume at any time
- **Storage**: Pause state persisted in AsyncStorage

### 7. Privacy Notice

**Feature**: Transparent privacy information displayed to user

- **Location**: Top of the tracking screen
- **Information Displayed**:
  - **What We Collect**: GPS coordinates, accuracy, timestamps
  - **When We Collect**: Only when tracking active, even in background
  - **Data Storage**: Stored locally on device, not sent to servers
  - **Your Control**: Pause, resume, stop, delete options available
- **Purpose**: Ensures user understands data collection

### 8. State Management & Persistence

**Feature**: Preserves tracking state across app sessions

- **Saved States**:
  - `is_tracking`: Whether user has active tracking session
  - `is_paused`: Whether tracking is temporarily paused
- **Recovery**: When app reopens, previous session state is restored
- **Reset**: User can explicitly stop tracking to clear state

## Testing Checklist

### Test 1: Permission Request

```
1. Launch app at Location Tracking screen
2. Tap "Start Tracking"
3. Verify: Permission dialog appears
4. Grant permission
5. Verify: Tracking starts successfully
6. Revoke permission and try again
7. Verify: Alert shows "Location Permission Required" message
```

### Test 2: Get Current Location

```
1. Tap "Get Current Location" button
2. Verify: Loading spinner appears briefly
3. Verify: Latitude and longitude display (6 decimal places)
4. Verify: Accuracy in meters displayed
5. Verify: Timestamp shows current time
```

### Test 3: Foreground Tracking

```
1. Tap "Start Tracking"
2. Verify: Button changes to "Pause Tracking" and "Stop Tracking"
3. Verify: Green indicator shows "Tracking Active: ●"
4. Change physical location (move device)
5. Verify: Coordinates update every ~10 seconds
6. Verify: Location History shows all recorded points
7. Verify: Location count increases
```

### Test 4: Pause/Resume

```
1. While tracking, tap "Pause Tracking"
2. Verify: Orange indicator shows "Tracking Paused: ●"
3. Verify: Coordinates stop updating (even after 10+ seconds)
4. Move to new location
5. Verify: New location NOT added to history
6. Tap "Resume Tracking"
7. Verify: Green indicator shows tracking resumed
8. Verify: Coordinates update again
9. Verify: New location added to history
```

### Test 5: Stop Tracking

```
1. While tracking, tap "Stop Tracking"
2. Verify: UI returns to "Start Tracking" state
3. Verify: Pause indicator disappears
4. Verify: Current location clears
5. Verify: Location History remains (data not deleted)
6. Verify: AsyncStorage state updated (is_tracking = false)
```

### Test 6: Background Tracking

```
1. Start tracking
2. Verify: "Location Tracking" notification appears (Android)
3. Minimize app (press Home/Back button)
4. Keep app minimized for 2-3 minutes
5. Reopen app
6. Verify: Location count increased (background tracking worked)
7. Verify: New locations in history have timestamps while app was in background
```

### Test 7: Persistence

```
1. Start tracking, let it run for ~30 seconds
2. Verify: Location count > 0
3. Force close the app (kill process)
4. Reopen app
5. Verify: Location history still present
6. Verify: Tracking state shows device is still tracking
7. Verify: Can see locations recorded when app was closed
```

### Test 8: Clear Logs

```
1. Record several tracking points
2. Verify: Location count > 0
3. Tap "Clear All" button
4. Verify: Confirmation dialog appears
5. Tap "Delete"
6. Verify: All locations cleared, count = 0
7. Verify: History shows "No locations recorded yet"
8. Reopen app
9. Verify: Data is gone (not just UI)
```

### Test 9: State Transitions

```
1. Stopped → Start Tracking (verify green indicator)
2. Tracking → Pause (verify orange indicator)
3. Paused → Resume (verify green indicator)
4. Tracking → Stop (verify back to initial state)
5. Stop → Start (verify clean start with any previous logs intact)
```

### Test 10: Multiple Sessions

```
1. Start tracking, record 5 locations
2. Stop tracking
3. Wait 10 seconds
4. Start tracking again
5. Verify: Previous 5 locations still in history
6. Verify: New locations start adding (total count increases)
7. Verify: Timestamps show correct sequence
```

## Implementation Details

### Storage Keys

- `location_logs`: Array of LocationLog objects
- `is_tracking`: Boolean flag ("true"/"false")
- `is_paused`: Boolean flag ("true"/"false")

### Location Log Object

```typescript
interface LocationLog {
  latitude: number; // -90 to 90
  longitude: number; // -180 to 180
  accuracy: number; // in meters
  timestamp: string; // ISO 8601 format
}
```

### Update Intervals

- **Foreground**: 10 seconds
- **Background**: 10 seconds or 10 meters (distance-based)
- **Manual**: On-demand via "Get Current Location"

### Accuracy Levels

- **Get Current Location**: `Location.Accuracy.High`
- **Foreground Tracking**: `Location.Accuracy.Balanced`
- **Background Tracking**: `Location.Accuracy.Balanced`

## Platform-Specific Notes

### Android

- Requires `android.permission.ACCESS_FINE_LOCATION`
- Requires `android.permission.ACCESS_COARSE_LOCATION`
- Requires `android.permission.ACCESS_BACKGROUND_LOCATION` (API 29+)
- Foreground service notification required for background tracking

### iOS

- Requires `NSLocationWhenInUseUsageDescription` in Info.plist
- Requires `NSLocationAlwaysAndWhenInUseUsageDescription` in Info.plist
- Background mode: "Location updates" must be enabled in Xcode capabilities

## Error Handling

### Common Issues

1. **"Failed to request location permissions"**
   - Cause: Device settings issue
   - Fix: Restart device, try again

2. **"Background location might not be available"**
   - Cause: Device doesn't support background tracking
   - Fix: Check device settings, update OS

3. **Location not updating**
   - Cause: GPS not locked, accuracy issues
   - Fix: Ensure clear sky view, move outside if indoors

4. **Data not persisting**
   - Cause: AsyncStorage not initialized
   - Fix: Ensure app has storage permissions

## Debugging

### Viewing Raw Logs (Development Only)

```javascript
// In console:
const logs = await AsyncStorage.getItem("location_logs");
console.log(JSON.parse(logs));
```

### Checking Tracking State

```javascript
const isTracking = await AsyncStorage.getItem("is_tracking");
const isPaused = await AsyncStorage.getItem("is_paused");
console.log({ isTracking, isPaused });
```

### Testing Permission States

```javascript
const foreground = await Location.getForegroundPermissionsAsync();
const background = await Location.getBackgroundPermissionsAsync();
console.log({ foreground, background });
```

## Performance Considerations

- **Memory**: Location logs persist in memory and storage; clear periodically for long-term tracking
- **Battery**: Continuous GPS usage drains battery; adjust timeInterval if needed
- **Network**: No network required (all local storage)
- **Storage**: Each location ~100 bytes; 1000 locations = ~100KB

## Future Enhancements

1. Export location data as CSV/KML
2. Map visualization of tracked route
3. Distance and speed calculations
4. Geofencing capabilities
5. Location filtering (duplicate removal)
6. Custom update intervals
