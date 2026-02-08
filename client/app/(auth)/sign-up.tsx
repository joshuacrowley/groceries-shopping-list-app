import * as React from "react";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { View, Pressable, Linking, useColorScheme, Platform } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { BodyScrollView } from "@/components/ui/BodyScrollView";
import Button from "@/components/ui/button";
import TextInput from "@/components/ui/text-input";
import { isClerkAPIResponseError, useSignUp, useOAuth, useSignInWithApple } from "@clerk/clerk-expo";
import { ClerkAPIError } from "@clerk/types";
import * as WebBrowser from "expo-web-browser";
import { appleBlue, zincColors } from "@/constants/Colors";
import * as AppleAuthentication from "expo-apple-authentication";

WebBrowser.maybeCompleteAuthSession();

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const { startOAuthFlow: startGoogleOAuthFlow } = useOAuth({ strategy: "oauth_google" });
  const { startAppleAuthenticationFlow } = useSignInWithApple();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [pendingVerification, setPendingVerification] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [errors, setErrors] = React.useState<ClerkAPIError[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = React.useState(false);
  const [isAppleSigningIn, setIsAppleSigningIn] = React.useState(false);

  const onSignUpPress = async () => {
    if (!isLoaded) return;
    if (process.env.EXPO_OS === "ios") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setIsLoading(true);
    setErrors([]);

    try {
      // Start sign-up process using email and password provided
      await signUp.create({
        emailAddress,
        password,
      });

      // Send user an email with verification code
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });

      // Set 'pendingVerification' to true to display second form
      // and capture OTP code
      setPendingVerification(true);
    } catch (err) {
      if (isClerkAPIResponseError(err)) setErrors(err.errors);
      console.error(JSON.stringify(err, null, 2));
    } finally {
      setIsLoading(false);
    }
  };

  const onGoogleSignInPress = async () => {
    if (process.env.EXPO_OS === "ios") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setIsGoogleSigningIn(true);
    
    try {
      const { createdSessionId, setActive } = await startGoogleOAuthFlow();
      
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
  };

  const onAppleSignInPress = async () => {
    if (process.env.EXPO_OS === "ios") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setIsAppleSigningIn(true);

    try {
      const { createdSessionId, setActive } =
        await startAppleAuthenticationFlow();

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        router.replace("/(index)");
      }
    } catch (err: any) {
      if (err.code === "ERR_REQUEST_CANCELED") return;
      if (isClerkAPIResponseError(err)) setErrors(err.errors);
      console.error("Apple Sign-In error:", JSON.stringify(err, null, 2));
    } finally {
      setIsAppleSigningIn(false);
    }
  };

  // Handle submission of verification form
  const onVerifyPress = async () => {
    if (!isLoaded) return;
    if (process.env.EXPO_OS === "ios") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setIsLoading(true);

    try {
      // Use the code the user provided to attempt verification
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code,
      });

      // If verification was completed, set the session to active
      // and redirect the user
      if (signUpAttempt.status === "complete") {
        await setActive({ session: signUpAttempt.createdSessionId });
        router.replace("/");
      } else {
        // If the status is not complete, check why. User may need to
        // complete further steps.
        console.error(JSON.stringify(signUpAttempt, null, 2));
      }
    } catch (err) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2));
      setErrors(err.errors);
    } finally {
      setIsLoading(false);
    }
  };

  if (pendingVerification) {
    return (
      <BodyScrollView contentContainerStyle={{ padding: 16 }}>
        <TextInput
          value={code}
          label={`Enter the verification code we sent to ${emailAddress}`}
          placeholder="Enter your verification code"
          onChangeText={(code) => setCode(code)}
        />
        <Button
          onPress={onVerifyPress}
          disabled={!code || isLoading}
          loading={isLoading}
        >
          Verify
        </Button>
        {errors.map((error) => (
          <ThemedText key={error.longMessage} style={{ color: "red" }}>
            {error.longMessage}
          </ThemedText>
        ))}
      </BodyScrollView>
    );
  }

  return (
    <BodyScrollView contentContainerStyle={{ padding: 16 }}>
      <TextInput
        autoCapitalize="none"
        value={emailAddress}
        placeholder="Enter email"
        keyboardType="email-address"
        onChangeText={(email) => setEmailAddress(email)}
      />
      <TextInput
        value={password}
        placeholder="Enter password"
        secureTextEntry={true}
        onChangeText={(password) => setPassword(password)}
      />
      <Button
        onPress={onSignUpPress}
        disabled={!emailAddress || !password || isLoading}
        loading={isLoading}
      >
        Continue
      </Button>
      
      <View style={{ marginTop: 16, alignItems: "center" }}>
        <ThemedText style={{ marginBottom: 12, color: isDark ? zincColors[500] : zincColors[400] }}>Or continue with</ThemedText>
        <Button
          onPress={onGoogleSignInPress}
          loading={isGoogleSigningIn}
          disabled={isGoogleSigningIn || isLoading || isAppleSigningIn}
          variant="outline"
          style={{ width: '100%' }}
        >
          {isGoogleSigningIn ? 'Signing in...' : 'Continue with Google'}
        </Button>
        <View style={{ marginTop: 10, width: '100%' }}>
          {Platform.OS === "ios" ? (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
              buttonStyle={
                isDark
                  ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                  : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
              }
              cornerRadius={12}
              style={{ width: "100%", height: 44 }}
              onPress={onAppleSignInPress}
            />
          ) : (
            <Button
              onPress={onAppleSignInPress}
              loading={isAppleSigningIn}
              disabled={isAppleSigningIn || isLoading || isGoogleSigningIn}
              variant="outline"
              style={{ width: '100%' }}
            >
              {isAppleSigningIn ? 'Signing in...' : 'Continue with Apple'}
            </Button>
          )}
        </View>
      </View>
      
      {errors.map((error) => (
        <ThemedText key={error.longMessage} style={{ color: "red" }}>
          {error.longMessage}
        </ThemedText>
      ))}

      <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 24, flexWrap: "wrap" }}>
        <ThemedText style={{ fontSize: 13, color: isDark ? zincColors[500] : zincColors[400] }}>
          By continuing, you agree to our{" "}
        </ThemedText>
        <Pressable
          onPress={() => Linking.openURL("https://tinytalkingtodos.com/privacy")}
          hitSlop={8}
        >
          <ThemedText style={{ fontSize: 13, color: appleBlue, fontWeight: "500", textDecorationLine: "underline" }}>
            Privacy Policy
          </ThemedText>
        </Pressable>
      </View>
    </BodyScrollView>
  );
}
