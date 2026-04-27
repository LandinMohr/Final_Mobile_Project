# Deep Link Setup Guide

## Overview

The app now supports deep linking to the Detail screen with dynamic object IDs. You can open the app and navigate directly to a specific object by using deep links.

## Deep Link Schemes

### Custom App Scheme

- **Format**: `finalmobileproject://[id]`
- **Examples**:
  - `finalmobileproject://7` - Opens detail screen for object ID 7
  - `finalmobileproject://1` - Opens detail screen for object ID 1
  - `finalmobileproject://5` - Opens detail screen for object ID 5

## How to Test Deep Links

### On Physical Device or Emulator

1. **Using adb (Android)**:

   ```bash
   adb shell am start -W -a android.intent.action.VIEW -d "finalmobileproject://7" com.yourpackage/
   ```

2. **Using xcrun (iOS)**:

   ```bash
   xcrun simctl openurl booted "finalmobileproject://7"
   ```

3. **From Web/Third-party Apps**:
   - Create a link: `finalmobileproject://7`
   - Click the link on your device

### Testing with Expo CLI

If you're running the app with Expo CLI:

```bash
npx expo start
```

Then use the Expo Go app or simulator to test the deep link by opening a link with the format above.

## Implementation Details

### Files Modified

1. **app/(tabs)/[id].tsx** - Dynamic route that accepts an `id` parameter
   - Fetches data from `https://api.restful-api.dev/objects/{id}`
   - Defaults to ID "7" if no ID is provided
   - Uses `useLocalSearchParams()` to read the ID from the deep link

2. **app/\_layout.tsx** - Updated tab navigation
   - Added `[id]` screen to the Tabs configuration
   - Set `initialParams={{ id: "7" }}` for the default tab behavior

3. **app.json** - Added deep linking configuration
   - Defined `deeplinks` section with scheme `finalmobileproject://`
   - Configured URL prefixes for handling custom scheme links

## How It Works

1. When a deep link like `finalmobileproject://7` is opened:
   - Expo Router intercepts the URL
   - Extracts the ID parameter (7 in this case)
   - Routes to the `[id].tsx` screen and passes the ID
   - The screen uses `useLocalSearchParams()` to read the ID
   - The API call is made with the provided ID instead of the default "7"

2. If no ID is provided in the deep link:
   - The screen defaults to loading ID "7"
   - The initial params set in the tab configuration ensure consistency

## Example Scenarios

- **Via Deep Link**: User clicks `finalmobileproject://12` → App opens Detail screen for object ID 12
- **Via Tab**: User taps the Detail tab → App opens Detail screen for default object ID 7
- **Programmatically**: Use `router.push({ pathname: '/(tabs)/[id]', params: { id: '3' } })` in code
