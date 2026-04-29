import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { Portal, PortalProvider } from "react-native-teleport";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { HomeScreen } from "./src/screens/HomeScreen";
import { SceneA } from "./src/screens/SceneA";
import { SceneB } from "./src/screens/SceneB";

export type RootStackParamList = {
  Home: undefined;
  SceneA: undefined;
  SceneB: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// HOST_NAME is shared by Scene A and Scene B. The single <Portal> below holds
// the teleported content — its children are physical inside PortalView until a
// <PortalHost name={HOST_NAME} /> mounts somewhere (in Scene A via state, in
// Scene B via screen mount). The Portal lives above NavigationContainer so it
// is NOT unmounted when the user pops a screen — that's required to reproduce
// the second-mount bugs.
export const HOST_NAME = "repro-host";

export default function App() {
  return (
    <SafeAreaProvider>
      <PortalProvider>
        <Portal hostName={HOST_NAME}>
          <View style={styles.teleported}>
            <Text style={styles.teleportedText}>TELEPORTED CONTENT</Text>
            <Text style={styles.teleportedSubtext}>
              (this box should appear inside the host area when one mounts)
            </Text>
          </View>
        </Portal>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="SceneA" component={SceneA} options={{ title: "Scene A: First-mount race" }} />
            <Stack.Screen name="SceneB" component={SceneB} options={{ title: "Scene B: Remount cycle" }} />
          </Stack.Navigator>
        </NavigationContainer>
        <StatusBar style="auto" />
      </PortalProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  teleported: {
    width: 260,
    height: 120,
    backgroundColor: "crimson",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    padding: 12,
  },
  teleportedText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
  teleportedSubtext: {
    color: "white",
    fontSize: 11,
    marginTop: 6,
    textAlign: "center",
  },
});
