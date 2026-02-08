import { useRouter } from "expo-router";
import { Image, View, StyleSheet, Pressable, Linking, Alert } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { BodyScrollView } from "@/components/ui/BodyScrollView";
import Button from "@/components/ui/button";
import { appleBlue, appleRed, zincColors } from "@/constants/Colors";
import { useClerk, useUser } from "@clerk/clerk-expo";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useThemePreference, type ThemePreference } from '@/context/ThemeContext';

export default function ProfileScreen() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { themePreference, setThemePreference } = useThemePreference();
  
  // Theme-aware colors
  const backgroundColor = useThemeColor({}, 'background');
  const iconColor = useThemeColor({}, 'icon');
  const closeButtonBgColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(150, 150, 150, 0.1)';

  const handleSignOut = async () => {
    await signOut();
    router.replace("/(auth)");
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This will permanently delete your account and all your data. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Account",
          style: "destructive",
          onPress: async () => {
            try {
              await user?.delete();
              router.replace("/(auth)");
            } catch (err) {
              Alert.alert("Error", "Failed to delete account. Please try again.");
              console.error(err);
            }
          },
        },
      ]
    );
  };

  // Get user's display name or fall back to email
  const displayName = user?.firstName 
    ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ''}`
    : user?.emailAddresses[0]?.emailAddress;

  return (
    <BodyScrollView style={{ backgroundColor }} contentContainerStyle={styles.container}>
      <View style={styles.closeButtonContainer}>
        <Pressable onPress={() => router.push('/(index)')} style={[styles.closeButton, { backgroundColor: closeButtonBgColor }]}>
          <IconSymbol name="xmark" size={18} color={iconColor} />
        </Pressable>
      </View>
      
      <View style={styles.header}>
        {user?.imageUrl ? (
          <Image
            source={{ uri: user.imageUrl }}
            style={styles.profileImage}
          />
        ) : null}
        <View style={styles.userInfo}>
          <ThemedText type="defaultSemiBold" style={styles.name}>
            {displayName}
          </ThemedText>
          <ThemedText style={styles.email}>
            {user?.emailAddresses[0]?.emailAddress}
          </ThemedText>
        </View>
      </View>

      {/* Appearance */}
      <View style={styles.section}>
        <ThemedText style={[styles.sectionTitle, { color: isDark ? zincColors[400] : zincColors[500] }]}>
          Appearance
        </ThemedText>
        <View style={[styles.segmentedControl, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]}>
          {(["system", "light", "dark"] as ThemePreference[]).map((option) => {
            const isSelected = themePreference === option;
            return (
              <Pressable
                key={option}
                onPress={() => setThemePreference(option)}
                style={[
                  styles.segmentedOption,
                  isSelected && [
                    styles.segmentedOptionSelected,
                    { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.15)' : '#fff' },
                  ],
                ]}
              >
                <ThemedText
                  style={[
                    styles.segmentedOptionText,
                    isSelected && styles.segmentedOptionTextSelected,
                    { color: isSelected
                      ? (isDark ? '#fff' : '#000')
                      : (isDark ? zincColors[400] : zincColors[500])
                    },
                  ]}
                >
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Legal */}
      <View style={styles.section}>
        <ThemedText style={[styles.sectionTitle, { color: isDark ? zincColors[400] : zincColors[500] }]}>
          Legal
        </ThemedText>
        <Button
          onPress={() => Linking.openURL("https://tinytalkingtodos.com/privacy")}
          variant="ghost"
          textStyle={{ color: appleBlue }}
        >
          Privacy Policy
        </Button>
      </View>

      {__DEV__ && (
        <Button
          onPress={() => router.push('/(index)/debug-templates')}
          variant="ghost"
          textStyle={{ color: appleBlue }}
        >
          Template Preview (Debug)
        </Button>
      )}

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
        textStyle={{ color: appleRed }}
      >
        Delete Account
      </Button>
    </BodyScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingTop: 32,
    gap: 32,
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
  name: {
    fontSize: 20,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    opacity: 0.7,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginLeft: 4,
  },
  segmentedControl: {
    flexDirection: "row",
    borderRadius: 10,
    padding: 3,
  },
  segmentedOption: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  segmentedOptionSelected: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentedOptionText: {
    fontSize: 14,
    fontWeight: "500",
  },
  segmentedOptionTextSelected: {
    fontWeight: "600",
  },
});
