import * as Updates from "expo-updates";
import * as Application from "expo-application";
import { useRouter } from "expo-router";
import {
  Alert,
  Image,
  View,
  StyleSheet,
  Share,
  Pressable,
  Linking,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { BodyScrollView } from "@/components/ui/BodyScrollView";
import Button from "@/components/ui/button";
import { appleBlue, appleGreen, appleRed } from "@/constants/Colors";
import { useClerk, useUser, useOrganization, useAuth } from "@clerk/clerk-expo";
import { useEffect, useState } from "react";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useStore, useRowIds } from 'tinybase/ui-react';
import Constants from 'expo-constants';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function ProfileScreen() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const { organization } = useOrganization();
  const { getToken } = useAuth();
  const store = useStore();
  const listIds = useRowIds('lists') || [];
  const router = useRouter();
  const [showDebug, setShowDebug] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Theme-aware colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const iconColor = useThemeColor({}, 'icon');
  const sectionBgColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(150, 150, 150, 0.1)';
  const closeButtonBgColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(150, 150, 150, 0.1)';

  const { isUpdateAvailable, isUpdatePending } = Updates.useUpdates();

  useEffect(() => {
    Updates.checkForUpdateAsync();
  }, []);

  useEffect(() => {
    if (isUpdatePending) {
      Updates.reloadAsync();
    }
  }, [isUpdatePending]);

  const handleUpdate = async () => {
    try {
      await Updates.fetchUpdateAsync();
    } catch (error) {
      Alert.alert(
        "Update Failed",
        "Failed to download the update. Please try again."
      );
      console.error(error);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: "Check out Shopping List: Sync & Share on the App Store!",
        url: "https://apps.apple.com/us/app/shopping-list-sync-share/id6739513017",
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleRate = async () => {
    try {
      await Linking.openURL(
        "https://apps.apple.com/us/app/shopping-list-sync-share/id6739513017?action=write-review"
      );
    } catch (error) {
      console.error(error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace("/(auth)");
  };

  const handleDeleteAccount = async () => {
    try {
      Alert.alert(
        "Delete account",
        "Are you sure you want to delete your account? This action is irreversible.",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Delete",
            onPress: async () => {
              await user?.delete();
              router.replace("/(auth)");
            },
            style: "destructive",
          },
        ]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to delete account");
      console.error(error);
    }
  };

  return (
    <BodyScrollView style={{ backgroundColor }} contentContainerStyle={styles.container}>
      <View style={styles.closeButtonContainer}>
        <Pressable onPress={() => router.push('/(index)')} style={[styles.closeButton, { backgroundColor: closeButtonBgColor }]}>
          <IconSymbol name="xmark" size={18} color={iconColor} />
        </Pressable>
      </View>
      <View>
        <View style={styles.header}>
          {user?.imageUrl ? (
            <Image
              source={{ uri: user.imageUrl }}
              style={styles.profileImage}
            />
          ) : null}
          <View style={styles.userInfo}>
            <ThemedText type="defaultSemiBold" style={styles.email}>
              {user?.emailAddresses[0].emailAddress}
            </ThemedText>
            <ThemedText style={styles.joinDate}>
              Joined {user?.createdAt?.toDateString()}
            </ThemedText>
          </View>
        </View>
        <View style={styles.actionButtons}>
          <Pressable onPress={handleShare} style={styles.actionButton}>
            <IconSymbol name="square.and.arrow.up" color={appleBlue} />
            <ThemedText type="defaultSemiBold" style={{ color: appleBlue }}>
              Share app
            </ThemedText>
          </Pressable>
          <Pressable onPress={handleRate} style={styles.actionButton}>
            <IconSymbol name="star" color={appleBlue} />
            <ThemedText type="defaultSemiBold" style={{ color: appleBlue }}>
              Rate app
            </ThemedText>
          </Pressable>
        </View>
      </View>
      <View style={[styles.section, { backgroundColor: sectionBgColor }]}>
        <ThemedText type="defaultSemiBold" style={styles.appTitle}>
          Shopping List: Sync & Share
        </ThemedText>
        <ThemedText type="default" style={styles.version}>
          v{Application.nativeApplicationVersion}
        </ThemedText>
      </View>

      <View style={[styles.section, { backgroundColor: sectionBgColor }]}>
        <View style={styles.infoRow}>
          <ThemedText type="defaultSemiBold">Channel</ThemedText>
          <ThemedText type="defaultSemiBold">{Updates.channel}</ThemedText>
        </View>

        <View style={styles.infoRow}>
          <ThemedText type="defaultSemiBold">Last update</ThemedText>
          <ThemedText type="default">
            {new Date(Updates.createdAt).toDateString()}
          </ThemedText>
        </View>

        <View style={styles.infoRow}>
          <View style={{ flex: 1 }}>
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <ThemedText type="defaultSemiBold">Update ID</ThemedText>
              <ThemedText type="default" style={{ fontSize: 12 }}>
                {Updates.isEmbeddedLaunch ? " (Embedded)" : " (Downloaded)"}
              </ThemedText>
            </View>
            <ThemedText
              type="default"
              style={{ fontSize: 12 }}
              numberOfLines={2}
            >
              {Updates.updateId}
            </ThemedText>
          </View>
        </View>
        {isUpdateAvailable ? (
          <View>
            <ThemedText type="defaultSemiBold" style={styles.updateText}>
              A new update is available!
            </ThemedText>
            <Button variant="ghost" onPress={handleUpdate}>
              Download and install update
            </Button>
          </View>
        ) : (
          <Button
            variant="ghost"
            onPress={() =>
              Alert.alert(
                "✅ All clear!",
                "Even the bugs are taking a day off!"
              )
            }
            textStyle={{ color: appleGreen }}
          >
            No bug fixes available
          </Button>
        )}
      </View>

      <Button
        onPress={handleSignOut}
        variant="ghost"
        textStyle={{ color: appleRed }}
      >
        Sign out
      </Button>

      <Button
        onPress={handleDeleteAccount}
        variant="ghost"
        textStyle={{ color: "gray" }}
      >
        Delete account
      </Button>

      {/* Debug Section */}
      <View style={[styles.section, { backgroundColor: sectionBgColor }]}>
        <Pressable onPress={() => setShowDebug(!showDebug)} style={styles.debugToggle}>
          <ThemedText type="defaultSemiBold" style={[styles.debugToggleText, { color: isDark ? '#999' : '#666' }]}>
            {showDebug ? '▼' : '▶'} Debug Info
          </ThemedText>
        </Pressable>
        
        {showDebug && (
          <View style={styles.debugContent}>
            <View style={styles.debugSection}>
              <ThemedText type="defaultSemiBold" style={styles.debugHeading}>Auth Status</ThemedText>
              <View style={styles.debugRow}>
                <ThemedText>User ID:</ThemedText>
                <ThemedText style={styles.debugValue}>{user?.id || 'None'}</ThemedText>
              </View>
              <View style={styles.debugRow}>
                <ThemedText>Organization:</ThemedText>
                <ThemedText style={styles.debugValue}>{organization?.name || 'None'}</ThemedText>
              </View>
              <View style={styles.debugRow}>
                <ThemedText>Org ID:</ThemedText>
                <ThemedText style={styles.debugValue}>{organization?.id || 'None'}</ThemedText>
              </View>
            </View>
            
            <View style={styles.debugSection}>
              <ThemedText type="defaultSemiBold" style={styles.debugHeading}>TinyBase Store</ThemedText>
              <View style={styles.debugRow}>
                <ThemedText>List Count:</ThemedText>
                <ThemedText style={styles.debugValue}>{listIds.length}</ThemedText>
              </View>
              <View style={styles.debugRow}>
                <ThemedText>List IDs:</ThemedText>
                <ThemedText style={styles.debugValue} numberOfLines={2}>{listIds.join(', ') || 'None'}</ThemedText>
              </View>
            </View>
            
            <View style={styles.debugSection}>
              <ThemedText type="defaultSemiBold" style={styles.debugHeading}>Environment</ThemedText>
              <View style={styles.debugRow}>
                <ThemedText>Server URL:</ThemedText>
                <ThemedText style={styles.debugValue} numberOfLines={2}>
                  {Constants.expoConfig?.extra?.EXPO_PUBLIC_SYNC_SERVER_URL || 'Not set'}
                </ThemedText>
              </View>
              <View style={styles.debugRow}>
                <ThemedText>Environment:</ThemedText>
                <ThemedText style={styles.debugValue}>{process.env.NODE_ENV || 'Not set'}</ThemedText>
              </View>
            </View>
            
            <Button
              variant="ghost"
              onPress={async () => {
                try {
                  const token = await getToken();
                  Alert.alert('Token Status', token ? 'Token is available' : 'No token available');
                } catch (e) {
                  Alert.alert('Error', 'Failed to get token: ' + e.message);
                }
              }}
              textStyle={{ color: appleBlue, fontSize: 14 }}
            >
              Test Authentication Token
            </Button>
          </View>
        )}
      </View>
    </BodyScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingTop: 32,
    gap: 24,
  },
  closeButtonContainer: {
    alignItems: "flex-end",
    marginBottom: -8,
  },
  closeButton: {
    padding: 8,
    borderRadius: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  email: {
    fontSize: 18,
    marginBottom: 4,
  },
  joinDate: {
    opacity: 0.7,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    marginTop: 16,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    paddingVertical: 8,
  },
  appTitle: {
    textAlign: "center",
  },
  version: {
    textAlign: "center",
    opacity: 0.7,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  updateText: {
    color: "#34C759",
  },
  debugToggle: {
    paddingVertical: 8,
  },
  debugToggleText: {
    color: "#666",
    fontSize: 14,
  },
  debugContent: {
    marginTop: 8,
    gap: 16,
  },
  debugSection: {
    gap: 8,
  },
  debugHeading: {
    fontSize: 14,
    color: appleBlue,
    marginBottom: 4,
  },
  debugRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  debugValue: {
    fontSize: 12,
    opacity: 0.7,
    flex: 1,
    textAlign: "right",
  },
});
