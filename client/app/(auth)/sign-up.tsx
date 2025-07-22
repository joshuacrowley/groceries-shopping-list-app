import * as React from "react";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { View } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { BodyScrollView } from "@/components/ui/BodyScrollView";
import Button from "@/components/ui/button";
import TextInput from "@/components/ui/text-input";
import { isClerkAPIResponseError, useSignUp, useOAuth } from "@clerk/clerk-expo";
import { ClerkAPIError } from "@clerk/types";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
  const router = useRouter();

  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [pendingVerification, setPendingVerification] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [errors, setErrors] = React.useState<ClerkAPIError[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = React.useState(false);

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
        <ThemedText style={{ marginBottom: 12, color: '#666' }}>Or continue with</ThemedText>
        <Button
          onPress={onGoogleSignInPress}
          loading={isGoogleSigningIn}
          disabled={isGoogleSigningIn || isLoading}
          variant="outline"
          style={{ width: '100%' }}
        >
          {isGoogleSigningIn ? 'Signing in...' : 'Continue with Google'}
        </Button>
      </View>
      
      {errors.map((error) => (
        <ThemedText key={error.longMessage} style={{ color: "red" }}>
          {error.longMessage}
        </ThemedText>
      ))}
    </BodyScrollView>
  );
}
