---
name: Native Apple Sign-In
overview: Upgrade @clerk/clerk-expo from 2.13.0 to latest and switch the Apple sign-in implementation from web-based useOAuth to the native useSignInWithApple() hook for a proper iOS experience.
todos:
  - id: upgrade-clerk
    content: Upgrade @clerk/clerk-expo from 2.13.0 to latest (2.19.22) for useSignInWithApple support
    status: pending
  - id: refactor-signin
    content: Refactor sign-in screen to use useSignInWithApple() with useOAuth fallback for non-iOS
    status: pending
  - id: refactor-signup
    content: Refactor sign-up screen to use useSignInWithApple() with useOAuth fallback for non-iOS
    status: pending
  - id: lint-check
    content: Run linter to verify no errors introduced
    status: pending
isProject: false
---

# Switch to Native Sign in with Apple

The current Apple sign-in uses `useOAuth({ strategy: "oauth_apple" })` which opens a **web browser redirect**. Clerk's Expo SDK (v2.14+) provides a dedicated `useSignInWithApple()` hook that uses the **native iOS Apple Sign In sheet** -- faster, no browser, and what Apple reviewers expect.

The hook has platform-specific behavior:

- **iOS**: Native Apple Sign In sheet via `expo-apple-authentication` (file: `useSignInWithApple.ios.js`)
- **Non-iOS**: Stub that throws (file: `useSignInWithApple.js`), recommends `useOAuth`/`useSSO` fallback

---

## Steps for YOU (manual, in Clerk Dashboard)

1. **Add your Native Application** in Clerk Dashboard at [Native Applications](https://dashboard.clerk.com/~/native-applications):
  - **App ID Prefix (Team ID)**: `L58BK45YGQ` (already in your `app.json`)
    - **Bundle ID**: `com.joshuacrowley.tinytalkingtodos`
2. **Enable Apple as a social connection** at [SSO Connections](https://dashboard.clerk.com/~/user-authentication/sso-connections):
  - Select **Add connection** > **For all users** > **Apple**
  - Toggle **Enable for sign-up and sign-in** on
  - For development: no custom credentials needed (Clerk provides shared ones)
  - For production: you'll need Apple Services ID, Private Key, Team ID, Key ID from the Apple Developer portal guide you already have

---

## Steps for ME (code changes)

### 1. Upgrade `@clerk/clerk-expo` to latest

The installed version (`2.13.0`) does not have `useSignInWithApple`. The latest (`2.19.22`) does. Peer dependencies are all compatible with the current project.

```bash
cd client && bun add @clerk/clerk-expo@latest
```

### 2. Refactor [client/app/(auth)/index.tsx](client/app/(auth)/index.tsx)

Replace the web-based Apple OAuth with the native hook:

- Remove: `useOAuth({ strategy: "oauth_apple" })`
- Add: `useSignInWithApple()` from `@clerk/clerk-expo`
- Update `onAppleSignInPress` to call `startAppleAuthenticationFlow()` instead of `startAppleOAuthFlow()`
- Keep the `AppleAuthenticationButton` UI from `expo-apple-authentication` for the native button appearance
- On non-iOS platforms, keep the existing `useOAuth` fallback since `useSignInWithApple` throws on non-iOS

```tsx
import { useSignInWithApple } from "@clerk/clerk-expo";

// Inside component:
const { startAppleAuthenticationFlow } = useSignInWithApple();

const onAppleSignInPress = React.useCallback(async () => {
  if (process.env.EXPO_OS === "ios") {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }
  setIsAppleSigningIn(true);
  try {
    const { createdSessionId, setActive } = await startAppleAuthenticationFlow();
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
}, [startAppleAuthenticationFlow, router]);
```

Since `useSignInWithApple` handles the sign-up/sign-in transfer flow automatically, the same code works for both screens. On non-iOS, we conditionally render the `useOAuth` fallback button instead.

### 3. Refactor [client/app/(auth)/sign-up.tsx](client/app/(auth)/sign-up.tsx)

Same changes as the sign-in screen -- replace `useOAuth({ strategy: "oauth_apple" })` with `useSignInWithApple()` and update the handler.

### 4. Create native build for testing

Apple Authentication does **not** work in Expo Go. You'll need:

```bash
eas build --platform ios
# or for local testing:
npx expo prebuild && npx expo run:ios --device
```

