# react-native-teleport@1.1.4 — Android Fabric reparent reproduction

Minimal Expo app that reproduces three Android-only bugs in
`react-native-teleport@1.1.4` on the Fabric (New Architecture) reparent path.
Bugs 1 and 2 are pure logic / order-of-operations issues that should affect
Android in general when New Architecture is enabled. Bug 3's specific failure
mode is Android 16+ (the `View.mParent` field was renamed/restricted there,
breaking the usual reflection workaround).

## Reproducible bugs

1. **NPE in `PortalView.extractPhysicalChildren`** during host registration.
   Triggered the first time a `<PortalHost>` mounts after a `<Portal>` with
   physical children already exists. (Upstream PR #118.)
2. **Silent failure on second `<PortalHost>` mount** with the same name.
   `PortalRegistry.registerHost` drops `pendingPortals[name]` after the first
   notification, so the existing portal never receives `onHostAvailable` for
   subsequent hosts. (Upstream PR #119.)
3. **`IllegalStateException` on rebind** once Bug 2 is patched naively. The
   orphaned child's `mParent` still points at the dying old host;
   `parent.removeView` is a no-op on a Fabric-dropped host and `View.mParent`
   reflection fails on Android 16. (Upstream PR #120.)

## Critical preconditions

The bugs do **NOT manifest** unless ALL of these hold:

- Build is **release / production** (`expo run:android --variant release` or
  equivalent). Dev builds work fine.
- **New Architecture is enabled** (`newArchEnabled: true` in `app.json` —
  already set).
- Hermes JS engine (already set).
- Android device. Verified on Android 16 / Samsung One UI 8. Bugs 1 and 2 are
  pure logic bugs and should affect Android in general; Bug 3's specific
  observable (`IllegalStateException` plus reflection-NoSuchFieldException) is
  Android 16+, since older versions still expose `View.mParent` to reflection.

## How to build

```sh
# 1. Install deps
npm install
# (or: yarn install / bun install)

# 2. Generate the native Android project
npx expo prebuild --platform android --clean

# 3. Build a release APK and install on a connected Android device (verified on Android 16)
npx expo run:android --variant release
```

The first prebuild + release build can take 5-15 minutes depending on machine.

## What each scene does

The app boots with a single `<Portal hostName="repro-host">` mounted **above**
the navigator (so it survives screen pop/push). Its child is a crimson box
labelled "TELEPORTED CONTENT" — visible at the top of the app until a host
with the matching name registers.

### Scene A — First-mount race (Bug 1)

A single screen with a `Mount host` / `Unmount host` toggle button. The host
is rendered conditionally via `useState` (no navigation involved).

- **Step 1**: tap "Mount host". On stock 1.1.4, the app **NPEs** in
  `PortalView.extractPhysicalChildren` during the host's
  `registerHost` → `onHostAvailable` callback.
- **Step 2** (after Bug 1 is patched, e.g. by applying PR #118): tap "Unmount
  host", then "Mount host" again. On stock 1.1.4 + PR #118 only, the second
  mount renders **empty** (Bug 2 silent failure). Apply PR #119 + PR #120 to
  rebind correctly.

### Scene B — NativeStack remount cycle (Bugs 2 + 3)

A `NativeStack` screen that contains a `<PortalHost />` inline. Push the
screen, pop it (host unmounts with the screen), push it again (a fresh host
mounts). This matches the production trigger sequence in Recollectr.

- **First push**: on stock 1.1.4, NPEs identically to Scene A's first toggle
  (Bug 1).
- **Pop, then push again** (after Bug 1 is patched): the second mount renders
  empty (Bug 2 silent failure) — content stays orphaned in the previous,
  now-destroyed host's view tree.
- **With Bug 2 patched naively** (registry keeps subscription + `onHostAvailable`
  attempts `host.addView(child)` directly): second push throws
  `IllegalStateException("child already has a parent")` — Bug 3.

## Expected production stack traces

### Bug 1

```
java.lang.NullPointerException: Attempt to invoke virtual method 'void android.view.View.unFocus(android.view.View)' on a null object reference
	at android.view.ViewGroup.removeViewInternal(ViewGroup.java:5864)
	at android.view.ViewGroup.removeViewAt(ViewGroup.java:5827)
	at com.teleport.portal.PortalView.extractPhysicalChildren(...)
	at com.teleport.portal.PortalView.setHostName(...)
	at com.teleport.host.PortalHostView.setName(...)
	at com.facebook.react.fabric.mounting.SurfaceMountingManager.createViewUnsafe(...)
```

### Bug 3

```
java.lang.IllegalStateException: The specified child already has a parent. You must call removeView() on the child's parent first.
	at android.view.ViewGroup.addViewInner(ViewGroup.java:5539)
	at android.view.ViewGroup.addView(ViewGroup.java:5358)
	at com.teleport.portal.PortalView.onHostAvailable(...)  // re-bind branch
	at com.teleport.host.PortalHostView.setName(...)
	at com.facebook.react.fabric.mounting.SurfaceMountingManager.createViewUnsafe(...)
```

Bug 2 is silent — diagnosed via `adb logcat` lifecycle traces, no crash.

## Versions

Pinned to match the production environment where these bugs were observed:

| Package                            | Version         |
| ---------------------------------- | --------------- |
| `expo`                             | `~52.0.40`      |
| `react-native`                     | `0.76.7`        |
| `react`                            | `18.3.1`        |
| `react-native-screens`             | `~4.4.0`        |
| `react-native-safe-area-context`   | `4.12.0`        |
| `@react-navigation/native`         | `^7.0.18`       |
| `@react-navigation/native-stack`   | `^7.3.2`        |
| `react-native-teleport`            | `1.1.4` (exact) |

## Related upstream PRs

- [#118](https://github.com/kirillzyusko/react-native-teleport/pull/118) — Bug 1
- [#119](https://github.com/kirillzyusko/react-native-teleport/pull/119) — Bug 2
- [#120](https://github.com/kirillzyusko/react-native-teleport/pull/120) — Bug 3
