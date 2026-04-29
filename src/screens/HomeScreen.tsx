import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Button, ScrollView, StyleSheet, Text, View } from "react-native";

import type { RootStackParamList } from "../../App";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export function HomeScreen({ navigation }: Props) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>react-native-teleport@1.1.4</Text>
      <Text style={styles.subtitle}>Android 16 Fabric reparent reproduction</Text>

      <Text style={styles.note}>
        IMPORTANT: build in release mode (`npm run android:release`). Bugs do
        not manifest in dev. Repro device: Galaxy S24 / Android 16. New
        Architecture must be enabled (it is, in app.json).
      </Text>

      <View style={styles.bugCard}>
        <Text style={styles.bugTitle}>Scene A — First-mount race (Bug 1)</Text>
        <Text style={styles.bugBody}>
          A single screen with a button that mounts {"<PortalHost />"} via state.
          The Portal at app root has its children physically attached. Tapping
          the button registers a new host, which fires onHostAvailable on the
          portal — that path NPEs on Android 16.
        </Text>
        <Button title="Open Scene A" onPress={() => navigation.navigate("SceneA")} />
      </View>

      <View style={styles.bugCard}>
        <Text style={styles.bugTitle}>Scene B — Remount cycle (Bugs 2 + 3)</Text>
        <Text style={styles.bugBody}>
          A NativeStack screen that contains {"<PortalHost />"} inline. Push the
          screen (host mounts, content moves in), pop it (host unmounts), push
          it again (silent failure: content is empty). With Bug 2 patched,
          attempting a naive rebind via host.addView throws IllegalStateException.
        </Text>
        <Button title="Open Scene B" onPress={() => navigation.navigate("SceneB")} />
      </View>

      <Text style={styles.footer}>
        The crimson "TELEPORTED CONTENT" box visible above the navigator is the
        Portal's children rendered in their fallback location (inside PortalView
        itself, before any host has registered). Once a host mounts, those
        children should move into the host's area.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
    color: "#555",
  },
  note: {
    fontSize: 12,
    backgroundColor: "#fff3cd",
    padding: 10,
    borderRadius: 6,
    borderColor: "#ffd966",
    borderWidth: 1,
    color: "#664d03",
  },
  bugCard: {
    padding: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    gap: 8,
  },
  bugTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  bugBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    fontSize: 11,
    color: "#666",
    fontStyle: "italic",
  },
});
