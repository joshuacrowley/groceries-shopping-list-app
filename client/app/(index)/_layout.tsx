import React from "react";
import { useNetworkState } from "expo-network";
import { Redirect, Tabs } from "expo-router";
import { Alert } from "react-native";
import { ListCreationProvider } from "@/context/ListCreationContext";
import { SignedIn, useUser } from "@clerk/clerk-expo";
import TTTStoreProvider from "@/stores/TTTStore";
import { StatusBar } from "expo-status-bar";

export const unstable_settings = {
  initialRouteName: "index",
};

export default function AppIndexLayout() {
  const { user } = useUser();
  const networkState = useNetworkState();

  React.useEffect(() => {
    if (
      !networkState.isConnected &&
      networkState.isInternetReachable === false
    ) {
      Alert.alert(
        "🔌 You are offline",
        "You can keep using the app! Your changes will be saved locally and synced when you are back online."
      );
    }
  }, [networkState.isConnected, networkState.isInternetReachable]);

  if (!user) {
    return <Redirect href="/(auth)" />;
  }

  return (
    <SignedIn>
      <StatusBar style="auto" animated />
      <TTTStoreProvider>
        <ListCreationProvider>
            <Tabs
              screenOptions={{
                ...(process.env.EXPO_OS !== "ios"
                  ? {}
                  : {
                      headerLargeTitle: true,
                      headerTransparent: true,
                      headerBlurEffect: "systemChromeMaterial",
                      headerLargeTitleShadowVisible: false,
                      headerShadowVisible: true,
                      headerLargeStyle: {
                        // Make the large title transparent to match the background.
                        backgroundColor: "transparent",
                      },
                    }),
                tabBarStyle: { display: "none" }, // Hide the tab bar
              }}
            >
              <Tabs.Screen
                name="list/[listId]/index"
                options={{
                  headerShown: false,
                  href: null,
                }}
              />
              <Tabs.Screen
                name="list/[listId]/edit"
                options={{
                  presentation: "formSheet",
                  sheetAllowedDetents: [0.5, 0.75, 1],
                  sheetGrabberVisible: true,
                  headerLargeTitle: false,
                  headerTitle: "Edit list",
                  href: null,
                }}
              />
              <Tabs.Screen
                name="list/[listId]/product/new"
                options={{
                  presentation: "formSheet",
                  sheetAllowedDetents: [0.8, 1],
                  sheetGrabberVisible: true,
                  headerLargeTitle: false,
                  headerTitle: "Add product",
                  href: null,
                }}
              />
              <Tabs.Screen
                name="list/[listId]/product/[productId]"
                options={{
                  presentation: "formSheet",
                  sheetAllowedDetents: [0.75, 1],
                  sheetGrabberVisible: true,
                  headerLargeTitle: false,
                  headerTitle: "Details",
                  href: null,
                }}
              />
              <Tabs.Screen
                name="list/[listId]/share"
                options={{
                  presentation: "formSheet",
                  sheetGrabberVisible: true,
                  headerLargeTitle: false,
                  headerTitle: "Invite",
                  href: null,
                }}
              />
              <Tabs.Screen
                name="lists"
                options={{
                  headerShown: false
                }}
              />
              <Tabs.Screen
                name="profile"
                options={{
                  presentation: "formSheet",
                  sheetAllowedDetents: [0.75, 1],
                  sheetGrabberVisible: true,
                  headerShown: false,
                  href: null,
                }}
              />
              <Tabs.Screen
                name="emoji-picker"
                options={{
                  presentation: "formSheet",
                  headerLargeTitle: false,
                  headerTitle: "Choose an emoji",
                  sheetAllowedDetents: [0.5, 0.75, 1],
                  sheetGrabberVisible: true,
                  href: null,
                }}
              />
              <Tabs.Screen
                name="color-picker"
                options={{
                  presentation: "formSheet",
                  headerLargeTitle: false,
                  headerTitle: "Choose a color",
                  sheetAllowedDetents: [0.5, 0.75, 1],
                  sheetGrabberVisible: true,
                  href: null,
                }}
              />
              <Tabs.Screen
                name="debug-templates"
                options={{
                  headerShown: false,
                  href: null,
                }}
              />
              <Tabs.Screen
                name="index"
                options={{
                  headerShown: false,
                }}
              />
            </Tabs>
          </ListCreationProvider>
      </TTTStoreProvider>
    </SignedIn>
  );
}
