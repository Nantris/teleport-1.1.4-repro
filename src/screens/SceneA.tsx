import { useState } from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import { PortalHost } from "react-native-teleport";

import { HOST_NAME } from "../../App";

/**
 * Scene A — First-mount race (Bug 1)
 *
 * The Portal at app root has had its children physically attached to PortalView
 * since app boot (no host was registered with the matching name yet). Tapping
 * "Mount host" mounts a <PortalHost /> here, which causes registerHost to fire
 * onHostAvailable on the existing portal. That path NPEs on Android with
 * Fabric enabled:
 *
 *   java.lang.NullPointerException: Attempt to invoke virtual method
 *     'void android.view.View.unFocus(android.view.View)'
 *     at android.view.ViewGroup.removeViewInternal(...)
 *     at android.view.ViewGroup.removeViewAt(...)
 *     at PortalView.extractPhysicalChildren(...)
 *
 * Toggling the host off and back on (after Bug 1 is patched) reproduces
 * Bug 2's silent-empty failure: the second host mount does not receive an
 * onHostAvailable notification because PortalRegistry dropped the pending
 * list after the first one fired.
 */
export function SceneA() {
  const [hostMounted, setHostMounted] = useState(false);
  const [toggleCount, setToggleCount] = useState(0);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        Stock 1.1.4: tap "Mount host" — the app crashes (Bug 1 NPE). That is
        the only bug reachable on stock; Bugs 2 and 3 are gated behind it.
      </Text>
      <Text style={styles.label}>
        After PR #118 is applied: tap "Mount host", "Unmount host", "Mount
        host" again. Expected: second mount renders empty (Bug 2) until
        PR #119 is also applied.
      </Text>

      <Button
        title={hostMounted ? `Unmount host (toggles: ${toggleCount})` : `Mount host (toggles: ${toggleCount})`}
        onPress={() => {
          setHostMounted((v) => !v);
          setToggleCount((c) => c + 1);
        }}
      />

      <View style={styles.hostFrame}>
        <Text style={styles.hostFrameLabel}>
          {hostMounted ? "PortalHost area (host mounted)" : "PortalHost area (host NOT mounted)"}
        </Text>
        {hostMounted && <PortalHost name={HOST_NAME} style={styles.host} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  label: {
    fontSize: 13,
    lineHeight: 18,
  },
  hostFrame: {
    flex: 1,
    borderColor: "#888",
    borderStyle: "dashed",
    borderWidth: 2,
    borderRadius: 8,
    padding: 8,
    minHeight: 200,
  },
  hostFrameLabel: {
    fontSize: 11,
    color: "#666",
    marginBottom: 6,
  },
  host: {
    flex: 1,
  },
});
