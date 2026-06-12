# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**smartStack** is a React Native family management app (frontend-only demo, ready for API hookup). Built with Expo SDK 54, Expo Router v6, JavaScript (no TypeScript). All data is currently mocked — no real backend.

## Commands

```bash
npx expo start              # start dev server (Expo Go / dev client)
npx expo start --ios        # run on iOS simulator
npx expo start --android    # run on Android emulator
npx expo start --web        # run in browser
```

> After any `npm install`, the `@expo/cli` symlink breaks. Fix it:
> ```bash
> ln -sf "$(pwd)/node_modules/expo/node_modules/@expo/cli" node_modules/@expo/cli
> ```

## Architecture

### Routing (Expo Router v6 file-based)

```
app/
  _layout.jsx           — Root: GestureHandler → QueryClient → ThemeProvider → Stack
  index.jsx             — Redirects to (auth)/welcome
  (auth)/
    _layout.jsx
    welcome.jsx         — 3-slide onboarding
    login.jsx / signup.jsx
  (app)/
    _layout.jsx         ← MASTER LAYOUT (header + bottom nav + all modals)
    overview/index.jsx  — Home dashboard (default tab)
    overview/family.jsx / children.jsx / member/[id].jsx
    calendar/index.jsx
    services/index.jsx
    profile/index.jsx
    wellbeing/index.jsx + tracking / checkins / sos
    wardrobe/index.jsx + add-item / suggestions
    kitchen/index.jsx + scan / expiry / shopping
    expenses/index.jsx
    tracking/index.jsx
    cctv/index.jsx
    jaap/index.jsx
    emergency/index.jsx
    notifications.jsx
    settings/ privacy / devices / language / help
```

### Master Layout (`app/(app)/_layout.jsx`)

This is the single most important file. It owns:
- **Header** — context-aware: greeting + hamburger + SOS on Home; title + back button on sub-screens
- **Bottom Nav** — changes tabs based on current service context (`getService(pathname)` → `NAV[service]`). Wardrobe and Kitchen have their own tab sets; others share `NAV_BASE`
- **Center FAB** (`+` button) — opens the **InfoPanel** (Family Hub bottom sheet)
- **InfoPanel** — slides down from top; shows live family status, AI suggestions, quick actions, theme toggle
- **NotifPanel** — slides in from right side
- **SettingsDrawer** — slides in from left; shows subscribed services + account settings + logout
- **`getPageConfig(pathname)`** — determines header title and back route for every screen

Screens that **hide the bottom nav**: `jaap`, `cctv`, `tracking`, `expenses` (filtered in render).

### State Management

| Store | File | Purpose |
|---|---|---|
| `useAuthStore` | `src/stores/useAuthStore.js` | `user`, `token`, `isAuthenticated`, `login()`, `logout()` |
| `useFamilyStore` | `src/stores/useFamilyStore.js` | `members[]` — family member list (hardcoded defaults) |
| `useServiceStore` | `src/stores/useServiceStore.js` | `activeService`, `switchService()` |

All stores use **Zustand**. No persistence yet (react-native-mmkv is installed but not wired up).

### Theme System

- `src/lib/theme.js` — exports `COLORS` (light + dark tokens) and `SPACING`
- `src/context/ThemeContext.jsx` — `ThemeProvider` + `useTheme()` hook
- `useTheme()` returns: `{ colors, spacing, isDark, mode, toggleTheme }`
- **Default mode is `'light'`** (not following system — avoids null on first render)
- Color palette: Primary `#6C63FF`, Accent `#FF6B9D`, Success `#4CAF82`, Warning `#FFB347`, Danger `#FF6B6B`

### Shared UI Components (`src/components/ui/`)

- **`GlassCard`** — In light mode: solid white with drop shadow. In dark mode: BlurView (iOS only) + semi-transparent overlay. Always `overflow: 'hidden'` with `borderRadius: 14`. Pass `style` prop for layout overrides.
- **`StatusBadge`** — Colored dot + label chip. Accepts `status` (`done | pending | in-progress | active | on-demand`) or explicit `color`.
- **`PulseButton`** — Animated SOS ring button used in `emergency/index.jsx`.

### Data Layer

React Query (`@tanstack/react-query`) is set up with `staleTime: 60000, retry: 1`. All queries currently return **hardcoded mock data** — ready to swap in real `axios` calls.

- `src/queries/useKitchenQuery.js` — `usePantryQuery(category)`, `useShoppingQuery()`
- `src/queries/useWardrobeQuery.js` — `useWardrobeQuery(category)`

The Expenses AI Advisor (`/(app)/expenses`) calls the Anthropic API directly using a user-supplied key stored via `expo-secure-store`. Model: `claude-opus-4-7`.

### Map / CCTV

- **Tracking screen** — OpenStreetMap tile map rendered inside a `WebView` with custom vanilla JS. Pinch-to-zoom and pan are handled inside the HTML. `window.ReactNativeWebView.postMessage` is used to pass marker taps back to React Native.
- **CCTV screen** — Uses `expo-video` `VideoView` with a local `.mp4` asset. No real camera feed.

## Key Rules & Conventions

- **JavaScript only — no TypeScript, no `.ts`/`.tsx` files**
- **NativeWind v4 is installed but barely used** — most styling is `StyleSheet.create()` inline. Don't introduce className-based styling unless specifically asked.
- **`BlurView` is iOS-only** — always guard with `Platform.OS === 'ios'`, or provide a solid fallback for Android.
- **Reanimated v4**: Do NOT import `Animated` from `react-native-reanimated` directly. Use:
  ```js
  import { createAnimatedComponent, useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
  const AnimatedView = createAnimatedComponent(View);
  ```
  The project mostly uses the built-in React Native `Animated` API — prefer that.
- **`DeviceEventEmitter`** — used for scroll-to-top when the active tab is tapped again. Listener key is `'scrollToTop'`.
- **Header/back navigation** — always go through `getPageConfig()` in `_layout.jsx`. To add a new sub-screen, add its title and `backRoute` there.
- All amounts are in **Indian Rupees (₹)**.

## Services Status

Services defined in `ALL_SERVICES` (in `_layout.jsx`):

| Service | Status |
|---|---|
| Wardrobe, Kitchen, CCTV, Tracking, Calendar, Wellbeing, Expenses | ✅ Screens built |
| Laundry, Pharmacy, Sweet Home, Fitness | 🚧 Placeholder only (no route) |

## TODOs / Pending Work

- **Backend integration** — replace all mock data in stores and query files with real API calls via `axios` to `EXPO_PUBLIC_API_URL`
- **Auth persistence** — save token to `expo-secure-store` / MMKV on login; hydrate on app start
- **Push notifications** — `expo-notifications` is installed; wiring to real server not done
- **Laundry, Pharmacy, Sweet Home, Fitness** — stub screens needed before routes can be added
- **Kitchen barcode scan** — `expo-camera` is installed but the scan screen shows a placeholder UI
- **CCTV** — replace local video with a real RTSP/HLS stream or `expo-camera` feed
- **Real GPS tracking** — `expo-location` is installed; Tracking screen uses static coords
- **`react-native-maps`** is installed but not used — Tracking screen uses a WebView + OpenStreetMap instead
- **Family member addition flow** — UI exists in Profile but `addMember` store action isn't connected to a form
