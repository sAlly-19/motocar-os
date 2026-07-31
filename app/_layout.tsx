import { useState } from 'react';
import { Text } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '../src/theme';
import { useAppInitialization } from '../src/hooks/useAppInitialization';
import { SidebarProvider } from '../src/components/SidebarContext';
import { DialogProvider } from '../src/components/DialogContext';
import { SplashScreen } from '../src/components/SplashScreen';
import { AuthGate } from '../src/components/AuthGate';

// Prevent OS-level font scaling from distorting our carefully tuned type scale.
try {
  (Text as any).defaultProps = { allowFontScaling: false };
} catch {}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // Splash is dismissed deterministically by the SplashScreen's `onFinish` callback,
  // which fires when its own animation sequence completes (~1.5s). Meanwhile the
  // store initialization runs in the background gated on `fontsLoaded`.
  const [showSplash, setShowSplash] = useState(true);
  useAppInitialization(fontsLoaded);

  if (showSplash) {
    return (
      <ThemeProvider>
        <SplashScreen onFinish={() => setShowSplash(false)} />
      </ThemeProvider>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <ThemeProvider>
          <SafeAreaProvider>
            <DialogProvider>
                <SidebarProvider>
                  <StatusBar style="auto" />
                  <AuthGate>
                    <Stack
                      screenOptions={{
                        headerShown: false,
                        animation: 'slide_from_right',
                        gestureEnabled: true,
                      }}
                    >
                    <Stack.Screen name="login/index" options={{ animation: 'fade' }} />
                    <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
                    <Stack.Screen name="orders/new" options={{ presentation: 'modal', gestureEnabled: true }} />
                    <Stack.Screen name="customers/new" options={{ presentation: 'modal', gestureEnabled: true }} />
                    <Stack.Screen name="vehicles/new" options={{ presentation: 'modal', gestureEnabled: true }} />
                    <Stack.Screen name="inventory/new-part" options={{ presentation: 'modal', gestureEnabled: true }} />
                    <Stack.Screen name="budgets/index" options={{ gestureEnabled: true }} />
                    <Stack.Screen name="team/index" options={{ gestureEnabled: true }} />
                    <Stack.Screen name="team/new" options={{ presentation: 'modal', gestureEnabled: true }} />
                    <Stack.Screen name="team/[id]" options={{ presentation: 'modal', gestureEnabled: true }} />
                    <Stack.Screen name="customers/index" options={{ gestureEnabled: true }} />
                    <Stack.Screen name="customers/[id]" options={{ presentation: 'modal', gestureEnabled: true }} />
                    <Stack.Screen name="vehicles/index" options={{ gestureEnabled: true }} />
                    <Stack.Screen name="vehicles/[id]" options={{ presentation: 'modal', gestureEnabled: true }} />
                    <Stack.Screen name="inventory/[id]" options={{ presentation: 'modal', gestureEnabled: true }} />
                    <Stack.Screen name="schedule/new" options={{ presentation: 'modal', gestureEnabled: true }} />
                    <Stack.Screen name="billing/index" options={{ gestureEnabled: true }} />
                    <Stack.Screen name="notifications/index" options={{ gestureEnabled: true }} />
                    <Stack.Screen name="reports/index" options={{ gestureEnabled: true }} />
                    <Stack.Screen name="ticket/[id]" options={{ presentation: 'modal', gestureEnabled: true }} />
                    </Stack>
                  </AuthGate>
                </SidebarProvider>
            </DialogProvider>
          </SafeAreaProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
