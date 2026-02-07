import React, { useEffect } from "react";
import * as Haptics from "expo-haptics";
import { Href, useRouter } from "expo-router";
import {
  View,
  StyleSheet,
  Dimensions,
  Image,
  Pressable,
  useColorScheme,
  Linking,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { BodyScrollView } from "@/components/ui/BodyScrollView";
import Button from "@/components/ui/button";
import TextInput from "@/components/ui/text-input";
import {
  isClerkAPIResponseError,
  useSignIn,
  useOAuth,
} from "@clerk/clerk-expo";
import { ClerkAPIError } from "@clerk/types";
import * as WebBrowser from "expo-web-browser";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
  FadeInDown,
} from "react-native-reanimated";
import {
  ShoppingCart,
  Carrot,
  CookingPot,
  ForkKnife,
  EggCrack,
  Coffee,
  Knife,
  Timer,
  CheckCircle,
  Star,
  Leaf,
  Cookie,
  ListChecks,
  Package,
  Basket,
} from "phosphor-react-native";
import { appleBlue, zincColors } from "@/constants/Colors";

WebBrowser.maybeCompleteAuthSession();

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } =
  Dimensions.get("window");

// Floating icon configurations
const ICON_CONFIGS = [
  {
    Icon: ShoppingCart,
    x: 0.05,
    size: 32,
    opacity: 0.09,
    duration: 14000,
    delay: 0,
    sway: 20,
  },
  {
    Icon: Carrot,
    x: 0.85,
    size: 26,
    opacity: 0.07,
    duration: 18000,
    delay: 1000,
    sway: 15,
  },
  {
    Icon: CookingPot,
    x: 0.25,
    size: 34,
    opacity: 0.06,
    duration: 20000,
    delay: 2000,
    sway: 22,
  },
  {
    Icon: ForkKnife,
    x: 0.65,
    size: 28,
    opacity: 0.08,
    duration: 16000,
    delay: 500,
    sway: 18,
  },
  {
    Icon: EggCrack,
    x: 0.45,
    size: 24,
    opacity: 0.06,
    duration: 19000,
    delay: 1500,
    sway: 25,
  },
  {
    Icon: Coffee,
    x: 0.1,
    size: 30,
    opacity: 0.07,
    duration: 15000,
    delay: 2500,
    sway: 12,
  },
  {
    Icon: Knife,
    x: 0.9,
    size: 22,
    opacity: 0.05,
    duration: 22000,
    delay: 3000,
    sway: 20,
  },
  {
    Icon: Timer,
    x: 0.55,
    size: 28,
    opacity: 0.07,
    duration: 13000,
    delay: 3500,
    sway: 16,
  },
  {
    Icon: CheckCircle,
    x: 0.2,
    size: 26,
    opacity: 0.06,
    duration: 21000,
    delay: 4000,
    sway: 14,
  },
  {
    Icon: Star,
    x: 0.75,
    size: 22,
    opacity: 0.07,
    duration: 17000,
    delay: 500,
    sway: 25,
  },
  {
    Icon: Leaf,
    x: 0.02,
    size: 28,
    opacity: 0.06,
    duration: 19500,
    delay: 4500,
    sway: 18,
  },
  {
    Icon: Cookie,
    x: 0.38,
    size: 24,
    opacity: 0.05,
    duration: 16500,
    delay: 5000,
    sway: 20,
  },
  {
    Icon: ListChecks,
    x: 0.58,
    size: 30,
    opacity: 0.07,
    duration: 14500,
    delay: 1500,
    sway: 15,
  },
  {
    Icon: Package,
    x: 0.32,
    size: 26,
    opacity: 0.06,
    duration: 18500,
    delay: 5500,
    sway: 22,
  },
  {
    Icon: Basket,
    x: 0.72,
    size: 32,
    opacity: 0.08,
    duration: 15500,
    delay: 200,
    sway: 17,
  },
];

// Individual animated floating icon
function FloatingIcon({
  Icon,
  x,
  size,
  opacity,
  duration,
  delay,
  sway,
  iconColor,
}: {
  Icon: React.ComponentType<{ size: number; color: string; weight: string }>;
  x: number;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
  sway: number;
  iconColor: string;
}) {
  const translateY = useSharedValue(SCREEN_HEIGHT + 100);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(-10);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withTiming(-100, { duration, easing: Easing.linear }),
        -1,
        false
      )
    );
    translateX.value = withDelay(
      delay,
      withRepeat(
        withTiming(sway, {
          duration: duration / 3,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true
      )
    );
    rotate.value = withDelay(
      delay,
      withRepeat(
        withTiming(10, {
          duration: duration / 2,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  return (
    <Animated.View
      style={[
        { position: "absolute" as const, left: x * SCREEN_WIDTH, opacity },
        animatedStyle,
      ]}
    >
      <Icon size={size} color={iconColor} weight="light" />
    </Animated.View>
  );
}

// Background layer with all floating icons
const FloatingIconsBackground = React.memo(function FloatingIconsBackground({
  isDark,
}: {
  isDark: boolean;
}) {
  const iconColor = isDark ? "#FFD060" : "#E5A800";

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {ICON_CONFIGS.map((config, index) => (
        <FloatingIcon key={index} {...config} iconColor={iconColor} />
      ))}
    </View>
  );
});

export default function SignIn() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isSigningIn, setIsSigningIn] = React.useState(false);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = React.useState(false);
  const [errors, setErrors] = React.useState<ClerkAPIError[]>([]);

  const onSignInPress = React.useCallback(async () => {
    if (!isLoaded) return;

    if (process.env.EXPO_OS === "ios") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setIsSigningIn(true);

    try {
      const signInAttempt = await signIn.create({
        identifier: emailAddress,
        password,
      });

      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace("/(index)");
      } else {
        console.error(JSON.stringify(signInAttempt, null, 2));
      }
    } catch (err) {
      if (isClerkAPIResponseError(err)) setErrors(err.errors);
      console.error(JSON.stringify(err, null, 2));
    } finally {
      setIsSigningIn(false);
    }
  }, [isLoaded, emailAddress, password]);

  const onGoogleSignInPress = React.useCallback(async () => {
    if (process.env.EXPO_OS === "ios") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setIsGoogleSigningIn(true);

    try {
      const { createdSessionId, setActive } = await startOAuthFlow();

      if (createdSessionId) {
        await setActive!({ session: createdSessionId });
        router.replace("/(index)");
      }
    } catch (err) {
      if (isClerkAPIResponseError(err)) setErrors(err.errors);
      console.error("Google OAuth error:", JSON.stringify(err, null, 2));
    } finally {
      setIsGoogleSigningIn(false);
    }
  }, [startOAuthFlow, router]);

  const onNavigatePress = React.useCallback(
    async (path: Href) => {
      if (process.env.EXPO_OS === "ios") {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      router.push(path);
    },
    [router]
  );

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? "#151718" : "#fff" },
      ]}
    >
      <FloatingIconsBackground isDark={isDark} />

      <BodyScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Branding */}
        <Animated.View
          entering={FadeInDown.duration(600).delay(200)}
          style={styles.brandingContainer}
        >
          <Image
            source={require("@/assets/images/adaptive-icon.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <ThemedText style={styles.appName}>Tiny Talking Todos</ThemedText>
          <ThemedText
            style={[
              styles.subtitle,
              { color: isDark ? zincColors[400] : zincColors[500] },
            ]}
          >
            Sign in to your account
          </ThemedText>
        </Animated.View>

        {/* Form */}
        <Animated.View
          entering={FadeInDown.duration(600).delay(400)}
          style={styles.formContainer}
        >
          <TextInput
            autoCapitalize="none"
            value={emailAddress}
            label="Email"
            keyboardType="email-address"
            placeholder="Enter email"
            onChangeText={(emailAddress) => setEmailAddress(emailAddress)}
          />
          <TextInput
            value={password}
            label="Password"
            placeholder="Enter password"
            secureTextEntry={true}
            onChangeText={(password) => setPassword(password)}
          />

          <Pressable
            onPress={() => onNavigatePress("/reset-password")}
            style={styles.forgotPasswordLink}
            hitSlop={8}
          >
            <ThemedText style={styles.forgotPasswordText}>
              Forgot password?
            </ThemedText>
          </Pressable>

          {errors.map((error) => (
            <ThemedText key={error.longMessage} style={styles.errorText}>
              {error.longMessage}
            </ThemedText>
          ))}

          <Button
            onPress={onSignInPress}
            loading={isSigningIn}
            disabled={!emailAddress || !password || isSigningIn}
          >
            Sign in
          </Button>
        </Animated.View>

        {/* Divider */}
        <Animated.View
          entering={FadeInDown.duration(600).delay(600)}
          style={styles.dividerContainer}
        >
          <View
            style={[
              styles.dividerLine,
              {
                backgroundColor: isDark ? zincColors[700] : zincColors[200],
              },
            ]}
          />
          <ThemedText
            style={[
              styles.dividerText,
              { color: isDark ? zincColors[500] : zincColors[400] },
            ]}
          >
            or continue with
          </ThemedText>
          <View
            style={[
              styles.dividerLine,
              {
                backgroundColor: isDark ? zincColors[700] : zincColors[200],
              },
            ]}
          />
        </Animated.View>

        {/* Google Sign In */}
        <Animated.View entering={FadeInDown.duration(600).delay(700)}>
          <Button
            onPress={onGoogleSignInPress}
            loading={isGoogleSigningIn}
            disabled={isGoogleSigningIn || isSigningIn}
            variant="outline"
          >
            {isGoogleSigningIn ? "Signing in..." : "Continue with Google"}
          </Button>
        </Animated.View>

        {/* Sign Up */}
        <Animated.View
          entering={FadeInDown.duration(600).delay(800)}
          style={styles.signUpContainer}
        >
          <ThemedText
            style={[
              styles.signUpText,
              { color: isDark ? zincColors[400] : zincColors[500] },
            ]}
          >
            Don't have an account?{" "}
          </ThemedText>
          <Pressable onPress={() => onNavigatePress("/sign-up")} hitSlop={8}>
            <ThemedText style={styles.signUpLink}>Sign up</ThemedText>
          </Pressable>
        </Animated.View>

        {/* Website Link */}
        <Animated.View
          entering={FadeInDown.duration(600).delay(900)}
          style={styles.websiteContainer}
        >
          <Pressable
            onPress={() => Linking.openURL("https://tinytalkingtodos.com/")}
            hitSlop={8}
          >
            <ThemedText style={styles.websiteLink}>
              tinytalkingtodos.com
            </ThemedText>
          </Pressable>
        </Animated.View>
      </BodyScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 20,
  },
  brandingContainer: {
    alignItems: "center",
    marginBottom: 32,
    marginTop: 8,
  },
  logo: {
    width: 72,
    height: 72,
    marginBottom: 12,
  },
  appName: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
  },
  formContainer: {
    marginBottom: 8,
  },
  forgotPasswordLink: {
    alignSelf: "flex-end",
    marginTop: -8,
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: appleBlue,
    fontSize: 14,
    fontWeight: "500",
  },
  errorText: {
    color: "#E53E3E",
    marginBottom: 8,
    fontSize: 14,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
  },
  signUpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  signUpText: {
    fontSize: 16,
  },
  signUpLink: {
    color: appleBlue,
    fontWeight: "600",
    fontSize: 16,
  },
  websiteContainer: {
    alignItems: "center",
    marginTop: 32,
    marginBottom: 16,
  },
  websiteLink: {
    color: appleBlue,
    fontSize: 14,
    fontWeight: "400",
    textDecorationLine: "underline",
  },
});
