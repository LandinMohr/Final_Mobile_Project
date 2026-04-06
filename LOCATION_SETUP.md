# Location Tracking - Configuration & Setup

## Required Permissions Configuration

### Android Configuration

Add these permissions to `android/app/src/main/AndroidManifest.xml`:

```xml
<!-- Foreground location permissions -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />

<!-- Background location permission (Android 10+) -->
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
```

Note: For Expo projects using `eas build`, these are typically handled automatically through `app.json`.

### iOS Configuration

Ensure `Info.plist` (or `app.json` for Expo) includes:

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>This app uses your location to track your current position while the app is open.</string>

<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>This app uses your location to track your position in the background for continuous monitoring.</string>
```

For Expo projects in `app.json`:

```json
{
  "plugins": [
    [
      "expo-location",
      {
        "locationAlwaysAndWhenInUsePermission": "Allow $(PRODUCT_NAME) to use your location."
      }
    ]
  ]
}
```

### Expo App Configuration (app.json)

Ensure the following is configured:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "The app needs permission to access your location continuously."
        }
      ]
    ]
  }
}
```

## Required Dependencies

The following packages are already included in your `package.json`:

- ✅ `expo-location` - For GPS and location services
- ✅ `expo-task-manager` - For background location tracking
- ✅ `@react-native-async-storage/async-storage` - For persistent storage

If any are missing, install with:

```bash
npm install expo-location expo-task-manager @react-native-async-storage/async-storage
```

## Testing the Implementation

### Expo Go Testing

1. Start the development server:

   ```bash
   npm start
   ```

2. Run on device using Expo Go:
   - Android: QR code in terminal
   - iOS: QR code in terminal (Camera app)

3. Navigate to the "Explore" tab with the location-demo screen

### Creating APK/IPA for Testing

```bash
# Android
eas build --platform android --profile preview

# iOS
eas build --platform ios --profile preview
```

## Simulator/Emulator Testing

### Android Emulator

1. Location is simulated by default
2. Use Android Studio to send mock locations:
   - Click hamburger menu (⋮)
   - Extended controls
   - Location tab
   - Enter latitude/longitude
3. Mock locations will appear in the app

### iOS Simulator

1. Features → Location → varies based on Xcode
2. Or use custom location JSON file
3. Select custom route to simulate movement

## Troubleshooting

### Issue: Permissions not requested

**Solution**:

- Ensure you tap "Start Tracking" to trigger permission request
- Check device permissions settings

### Issue: Background tracking not working

**Solution**:

- Ensure background location permission is separately granted
- Check battery optimization settings on device
- Verify app has background execution enabled

### Issue: Locations not updating

**Solution**:

- Verify GPS signal (need clear sky view)
- Check accuracy setting (High accuracy requires GPS)
- Ensure location services enabled on device

### Issue: Data not persisting

**Solution**:

- Verify AsyncStorage initialization
- Check device storage availability
- Ensure app has write permissions

### Issue: Background task not running

**Solution**:

- iOS: Ensure app has background modes enabled
- Android: Check background app refresh settings
- Verify device hasn't killed background processes

## BuildConfig (Expo Build)

For EAS builds, inherit from Expo defaults. For custom builds:

1. Build Android:

   ```bash
   eas build --platform android --profile production
   ```

2. Build iOS:
   ```bash
   eas build --platform ios --profile production
   ```

## Performance Optimization

### For Long-Term Tracking

Adjust update intervals in `startTracking()`:

- Increase `timeInterval` to 30000 (30 seconds) for less battery drain
- Increase `distanceInterval` to 50 (50 meters) to reduce frequency
- Use `Location.Accuracy.Balanced` or `Reduced` instead of `High`

### For High-Accuracy Requirements

Reduce intervals:

- `timeInterval`: 5000 (5 seconds)
- `distanceInterval`: 5 (5 meters)
- Use `Location.Accuracy.High` (requires GPS lock)

## Testing with Real Devices

### Best Practices

1. **Outdoors**: Always test outdoors for accurate GPS
2. **Clear Sky**: Avoid trees, buildings blocking sky view
3. **Movement**: Walk or drive to generate location changes
4. **Battery**: Plug in device during extended tests
5. **Time Zones**: Verify timestamp accuracy

### Test Scenarios Recommended

- Quick walk around block (foreground tracking)
- Pause and resume during walk
- Put app in background, continue moving
- Stop tracking, verify data persistence
- Reopen app, verify history

## Monitoring Background Tasks

### Android

- Use ADB logcat:
  ```bash
  adb logcat | grep "location-tracking-task"
  ```

### iOS

- Use Xcode Console

## Reset/Clean

To clean location data during development:

1. Clear app data from device settings
2. Or programmatically:
   ```javascript
   await AsyncStorage.removeItem("location_logs");
   await AsyncStorage.removeItem("is_tracking");
   await AsyncStorage.removeItem("is_paused");
   ```

## Next Steps

1. Review [LOCATION_TRACKING_GUIDE.md](./LOCATION_TRACKING_GUIDE.md) for feature details
2. Run through the testing checklist in the guide
3. Test on real device for accurate behavior
4. Adjust update intervals based on your use case
5. Consider adding map visualization for next phase
