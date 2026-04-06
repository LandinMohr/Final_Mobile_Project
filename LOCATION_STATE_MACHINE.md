# Location Tracking - State Machine & Flow Diagram

## State Machine Overview

The location tracking system has three independent state dimensions:

### 1. **Tracking State** (is_tracking)

- **Stopped**: No tracking active
- **Started**: Tracking active, recording locations

### 2. **Pause State** (is_paused)

- **Active**: Currently recording locations
- **Paused**: Not recording locations (only valid when is_tracking = true)

### 3. **UI State** (derived from above)

- Determines which buttons are shown
- Provides visual feedback to user

## State Transitions

```
┌─────────────────────────────────────────────────────────────┐
│                    STOPPED STATE                            │
│           (is_tracking=false, is_paused=false)              │
│                                                             │
│  UI: "Start Tracking" button visible                        │
│  Display: "No location data available yet"                  │
│  History: Visible (from previous sessions)                  │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ User taps "Start Tracking"
                          │ (requestPermission checks granted)
                          ↓
                   Permission Check
                    ↙         ↖
              Granted        Denied
                 │               │
                 ↓               ↓
            Continue      Show Error Alert
                 │
                 ↓
┌─────────────────────────────────────────────────────────────┐
│              TRACKING, ACTIVE STATE                         │
│         (is_tracking=true, is_paused=false)                 │
│                                                             │
│  UI: "Pause Tracking" and "Stop Tracking" buttons           │
│  Display: Current coordinates & accuracy                    │
│  Updates: Every 10 seconds                                  │
│  Recording: YES - All locations logged                      │
│  Indicator: Green active light                              │
└─────────────────────────────────────────────────────────────┘
           ↙                        ↖
    "Pause Tracking"          "Stop Tracking"
           │                        │
           ↓                        ↓
┌──────────────────────┐   ┌──────────────────┐
│  TRACKING, PAUSED    │   │    STOPPED       │
│  (is_tracking=true,  │   │                  │
│   is_paused=true)    │   │  Clear current   │
│                      │   │  location display│
│  UI: "Resume" button │   │  Keep history    │
│  Display: Last       │   │                  │
│  coordinate (no new) │   │  is_tracking=F   │
│  Indicator: Orange   │   │  is_paused=F     │
└──────────────────────┘   └──────────────────┘
           ↑                        │
           │                        │
    "Resume Tracking"    "Start Tracking" again
           │                        │
           └────────────────────────┘
```

## Detailed State Behaviors

### STOPPED (Default)

```
State: is_tracking = false, is_paused = false
Foreground: No location updates
Background: Background updates stopped
Storage: Data from previous sessions visible
UI Button: "Start Tracking"
Current Location: Shows "No location data available yet"
Location History: Visible (preserved from last session)
Get Current Location: Works (manual fetch only)
Indicator: Gray (inactive)
```

### TRACKING-ACTIVE (Recording)

```
State: is_tracking = true, is_paused = false
Foreground: Updates every 10 seconds via setInterval
Background: Background task tracking active
Storage: Each update saved to location_logs
UI Buttons: "Pause Tracking", "Stop Tracking"
Current Location: Shows latest coordinates
Location History: Updates in real-time
Get Current Location: Works (added to logs)
Updates: ✓ Foreground ✓ Background ✓ Recording
Indicator: Green (active)
```

### TRACKING-PAUSED (Not Recording)

```
State: is_tracking = true, is_paused = true
Foreground: Updates continue fetching but NOT recorded
Background: Background task runs but locations NOT saved
Storage: No new entries added
UI Buttons: "Resume Tracking", "Stop Tracking"
Current Location: Still shows but with "paused" note
Location History: No new entries added
Get Current Location: Works but NOT logged
Updates: ✓ Foreground (fetched) ✗ Recorded (paused)
Indicator: Orange (paused)
```

## Permission Check Flow

```
User Action: Tap "Start Tracking"
    ↓
Check Foreground Permission
    ├─ GRANTED → Continue
    └─ DENIED/UNDETERMINED → Show Permission Dialog
            ├─ User Grants → Continue
            └─ User Denies → Show Alert:
                "Location Permission Required\n
                 Location access is required to use
                 tracking features. Please enable
                 location permissions in your device
                 settings."
            └─ Return to STOPPED state
    ↓
Request Background Permission (silent)
    ├─ GRANTED → Start background tracking
    └─ DENIED → Foreground only (warning logged)
    ↓
Start Foreground Tracking (setInterval)
    ↓
Start Background Tracking (startLocationUpdatesAsync)
    ↓
Set is_tracking = true, is_paused = false
    ↓
Enter TRACKING-ACTIVE State
```

## Location Update Flow

### In TRACKING-ACTIVE State

**Foreground Updates (every 10 seconds):**

```
Time: T, T+10s, T+20s, ...
    ↓
Get current location (Balanced accuracy)
    ↓
Update UI: currentLocation state
    ↓
Log to storage: locationLogs array
    ↓
UI re-renders with new coordinates
```

**Background Updates (periodic):**

```
Background Task Triggered (every 10s or 10m)
    ↓
Task Manager: LOCATION_TRACKING_TASK
    ↓
Get location from locations array
    ↓
Read current location_logs from storage
    ↓
Append new location
    ↓
Save back to storage
    ↓
(No UI update - app not visible)
```

### In TRACKING-PAUSED State

**Foreground Updates (every 10 seconds):**

```
Time: T, T+10s, T+20s, ...
    ↓
Check is_paused state → TRUE
    ↓
Get current location (Balanced accuracy)
    ↓
Update UI: currentLocation state
    ↓
Skip storage logging ← DIFFERS FROM ACTIVE
    ↓
UI shows location but NOT recorded
```

**Background Updates:**

```
Background Task Triggered
    ↓
Save location to temporary memory
    ↓
Skip AsyncStorage write ← PAUSED
```

## Data Persistence Flow

### Saving On App Close (any state)

```
User closes app (is_tracking may be true)
    ↓
Save current state:
  - AsyncStorage.setItem('is_tracking', 'true/false')
  - AsyncStorage.setItem('is_paused', 'true/false')
  - location_logs saved (automatic from background task)
```

### Recovery On App Reopen

```
App initializes
    ↓
initializeTracking() called
    ↓
Read location_logs from storage → setState(locationLogs)
    ↓
Read is_tracking → setState(isTracking)
    ↓
Read is_paused → setState(isPaused)
    ↓
If was_tracking = true:
  ├─ Set isTracking = true
  ├─ Set isPaused = was_paused_state
  ├─ Restart foreground interval
  └─ Restart background tracking
Else:
  ├─ Set isTracking = false
  ├─ Set isPaused = false
  └─ No tracking active
```

## UI State Matrix

| is_tracking | is_paused | Buttons Shown | Current Loc | History   | Indicator |
| ----------- | --------- | ------------- | ----------- | --------- | --------- |
| false       | false     | Start         | Empty       | ✓         | Gray      |
| true        | false     | Pause, Stop   | Updated     | ✓ Growing | Green     |
| true        | true      | Resume, Stop  | Frozen      | ✓ Static  | Orange    |

## Error States

### Permission Denied

```
is_tracking → false (stays false)
is_paused → stays as is
Show Alert: "Location Permission Required"
UI → Returns to STOPPED state
User must retry with permission granted
```

### Background Location Unavailable

```
is_tracking → true (foreground works)
Background tracking skipped (warning in console)
Foreground continues recording normally
Message: "Background location might not be available" (console only)
```

### Storage Write Error

```
is_tracking → true (tracking continues)
is_paused → true (if paused)
Current location → Shows on screen
Location not saved (silently fails, logged to console)
"Error logging location" in console
```

## Cleanup Flow

### When User Stops Tracking

```
User taps "Stop Tracking"
    ↓
Set is_tracking = false
Set is_paused = false
Clear currentLocation display
Stop foreground setInterval
Stop background updates
Save state to storage
Show Alert: "Tracking Stopped"
    ↓
Return to STOPPED state
```

### When App Receives "Stop" Signal

```
App minimized → Normal (tracking may continue)
App killed → Save state automatically
    ↓ On restart
Restore previous state
If was_tracking=true: Resume automatically
```

## Testing State Transitions

### Test All 4 Possible Transitions From TRACKING-ACTIVE

1. **Active → Paused**: "Pause" button
2. **Active → Stopped**: "Stop" button
3. **Paused → Active**: "Resume" button
4. **Paused → Stopped**: "Stop" button

### Test Recovery From Each State

1. **From STOPPED**: Close/reopen app → Stay stopped
2. **From ACTIVE**: Close/reopen app → Resume active
3. **From PAUSED**: Close/reopen app → Resume paused state

Each state transition should be verified with:

- ✓ UI buttons change correctly
- ✓ Indicators show correct color
- ✓ currentLocation shows/hides appropriately
- ✓ Logging behavior matches state
- ✓ Storage reflects new state

## Performance Implications by State

### STOPPED

- CPU: Minimal
- Memory: Small (UI only)
- Battery: Negligible
- Storage I/O: None

### TRACKING-ACTIVE

- CPU: 10% (every 10 seconds)
- Memory: ~1MB (logs in memory)
- Battery: High (GPS + CPU)
- Storage I/O: Every 10 seconds

### TRACKING-PAUSED

- CPU: 10% (every 10 seconds, reading only)
- Memory: ~1MB
- Battery: High (GPS active, CPU low)
- Storage I/O: None (reading only)
