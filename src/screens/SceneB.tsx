import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Button, StyleSheet, Text, View } from "react-native";
import { PortalHost } from "react-native-teleport";

import type { RootStackParamList } from "../../App";
import { HOST_NAME } from "../../App";

type Props = NativeStackScreenProps<RootStackParamList, "SceneB">;

/**
 * Scene B — NativeStack remount cycle (Bugs 2 + 3)
 *
 * This screen contains an inline <PortalHost />. Mounting/unmounting happens
 * via NativeStack push/pop — which is the production trigger that surfaced
 * these bugs in Recollectr (NativeStack pop unmounted the screen hosting
 * <PortalHost> and a subsequent push remounted a fresh one).
 *
 * Reproduction sequence (stock 1.1.4):
 *
 *   Push from Home → first host mount → Bug 1 NPE on Android 16.
 *
 * Once Bug 1 is patched:
 *
 *   Push → first mount works, content moves into host area.
 *   Pop (back to Home).
 *   Push again → SECOND mount renders empty (Bug 2: pendingPortals[name] was
 *     dropped after the first notification, so the existing portal never
 *     receives onHostAvailable for the new host).
 *
 * Once Bug 2 is patched naively (registry keeps the subscription, but
 * PortalView.onHostAvailable is extended with a re-bind branch that calls
 * host.addView(child) directly):
 *
 *   Second push → IllegalStateException ("child already has a parent") on
 *     Android 16. The orphaned child's mParent still points at the dying old
 *     host; parent.removeView is a no-op on a Fabric-dropped host; reflection
 *     by literal name fails on Android 16 (NoSuchFieldException). The fix in
 *     PR #120 introduces PortalHostView.forceAdoptStuckView which wraps the
 *     protected ViewGroup.addViewInLayout to clear mParent from inside the
 *     framework before adding.
 */
export function SceneB({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        This screen contains a {"<PortalHost />"} inline. Press "Go back to Home",
        then re-open Scene B from Home to exercise the remount cycle.
      </Text>

      <Button title="Go back to Home" onPress={() => navigation.goBack()} />

      <View style={styles.hostFrame}>
        <Text style={styles.hostFrameLabel}>PortalHost area (always mounted while screen is alive)</Text>
        <PortalHost name={HOST_NAME} style={styles.host} />
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
