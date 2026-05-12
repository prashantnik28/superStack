---
name: smartStack Project Context
description: React Native + Expo family management app, JavaScript-only, Expo SDK 54, Expo Router v6, glassmorphism design, dark/light theme, port 8082
type: project
---

## Project: smartStack

Expo SDK 54, Expo Router v6, JavaScript (no TypeScript), Metro on **port 8082**.

**Why:** Frontend-only demo app with real UI polish. Uses mock data, ready for a real API.

**How to apply:** No TypeScript, no new abstraction layers unless requested.

## Critical Infrastructure Issues (solved)

- `package.json` main: `"expo-router/entry"` — NOT index.js
- `@expo/cli` lives at `node_modules/expo/node_modules/@expo/cli` (v54.0.24). A top-level symlink is required: `ln -sf /absolute/path/.../expo/node_modules/@expo/cli node_modules/@expo/cli`. **npm install BREAKS this symlink — recreate it after every npm install.**
- `babel-preset-expo` must be in devDependencies (~54.0.0) at top level — not just nested inside expo.
- `global.css` must be imported at top of `app/_layout.jsx` for NativeWind to work.
- NativeWind v4 needs tailwindcss **v3** (not v4).

## Reanimated v4 Fix

Do NOT use the default `Animated` import from reanimated — it breaks. Use `createAnimatedComponent`:
```js
import { createAnimatedComponent, useSharedValue, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';
const AnimatedView = createAnimatedComponent(View);
```

## Design System

- Primary: #6C63FF, Accent: #FF6B9D, Success: #4CAF82, Warning: #FFB347, Danger: #FF6B6B
- Light bg: #F7F4FF, Dark bg: #0D0D1A
- GlassCard: **solid white in light mode** (#FFFFFF) — BlurView was removed for contrast reliability
- ThemeContext defaults to 'light' (useColorScheme can return null on first render)

## Navigation Architecture

- 4 visible tabs: Home → `dashboard/index`, Calendar → `calendar/index`, Services → `wellbeing/index`, Profile → `profile/index`
- All service sub-screens hidden with `{ href: null }` in Tabs.Screen declarations
- ServiceDrawer = **bottom sheet** Modal (slides from bottom, NOT top-drop)
- Sub-tabs inside services use a horizontal ScrollView at the top of each screen

## All Screens (complete as of May 2026)

Auth: welcome (3 slides), login, signup  
App: dashboard, wellbeing (index/tracking/checkins/sos), wardrobe (index/add-item/suggestions), kitchen (index/scan/expiry/shopping), calendar, profile

Profile screen: hero card with stats, weekly activity bar chart, family status cards, subscription plan panel, categorised settings with toggles, logout.
