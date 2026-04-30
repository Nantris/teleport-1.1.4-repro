import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Button, ScrollView, StyleSheet, Text, View } from "react-native";

import type { RootStackParamList } from "../../App";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export function HomeScreen({ navigation }: Props) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>react-native-teleport@1.1.4</Text>
      <Text style={styles.subtitle}>Android Fabric reparent reproduction</Text>

      <Text style={styles.note}>
        IMPORTANT: build in release mode. Bugs do NOT manifest in dev. New
        Architecture (Fabric) must be enabled (it is, in app.json). Verified
        on Android 16, but Bugs 1 and 2 are logic bugs and should affect
        Android in general; Bug 3's specific failure mode is Android 16+.
      </Text>

      <Text style={styles.note}>
        On stock react-native-teleport@1.1.4, ONLY Bug 1 is reachable from
        either scene — it gates the second-mount cycle. Bugs 2 and 3 require
        the corresponding upstream fixes to be applied first.
      </Text>

      <View style={styles.bugCard}>
        <Text style={styles.bugTitle}>Scene A — First-mount race (Bug 1)</Text>
        <Text style={styles.bugBody}>
          A single screen with a button that mounts {"<PortalHost />"} via state.
          The Portal at app root has its children physically attached. Tapping
          "Mount host" registers a new host, which fires onHostAvailable on the
          portal — that path NPEs and crashes the app on stock 1.1.4.
        </Text>
        <Button title="Open Scene A" onPress={() => navigation.navigate("SceneA")} />
      </View>

      <View style={styles.bugCard}>
        <Text style={styles.bugTitle}>Scene B — NativeStack remount (Bugs 2 + 3)</Text>
        <Text style={styles.bugBody}>
          A NativeStack screen that contains {"<PortalHost />"} inline.
          {"\n\n"}
          On stock 1.1.4: pushing this screen crashes immediately with the
          same Bug 1 NPE (the host registers as the screen mounts).
          {"\n\n"}
          After PR #118 is applied: first push works; pop, push again
          → second mount renders empty (Bug 2).
          {"\n\n"}
          After PR #118 + a naive rebind branch: second push throws
          IllegalStateException (Bug 3).
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
