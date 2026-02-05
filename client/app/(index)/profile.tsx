import { useRouter } from "expo-router";
import { Image, View, StyleSheet, Pressable } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { BodyScrollView } from "@/components/ui/BodyScrollView";
import Button from "@/components/ui/button";
import { appleRed } from "@/constants/Colors";
import { useClerk, useUser } from "@clerk/clerk-expo";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function ProfileScreen() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Theme-aware colors
  const backgroundColor = useThemeColor({}, 'background');
  const iconColor = useThemeColor({}, 'icon');
  const closeButtonBgColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(150, 150, 150, 0.1)';

  const handleSignOut = async () => {
    await signOut();
    router.replace("/(auth)");
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

      <Button
        onPress={handleSignOut}
        variant="ghost"
        textStyle={{ color: appleRed }}
      >
        Sign out
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
});
