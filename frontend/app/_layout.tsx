import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, router } from 'expo-router';
import { View, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/contexts/auth-context';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import '../global.css';

import { AuthProvider } from '@/contexts/auth-context';
import {
  ThemePreferenceProvider,
  useResolvedColorScheme,
} from '@/contexts/theme-preference-context';

export const unstable_settings = {
  initialRouteName: 'index',
};

function RootNavigation() {
  const colorScheme = useResolvedColorScheme();
  const isDark = colorScheme === 'dark';
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <View className="flex-1">
        <Stack screenOptions={{ headerShown: false }} />
        
        {user && (
          <>
            {/* Persistent Settings Button - Top Right */}
            <TouchableOpacity
              onPress={() => router.push('/settings')}
              activeOpacity={0.7}
              style={{
                position: 'absolute',
                top: Platform.OS === 'web' ? 24 : insets.top + 16,
                right: 20,
                zIndex: 9999,
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: '#FFFFFF',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <IconSymbol name="gearshape.fill" size={24} color="#000" />
            </TouchableOpacity>
          </>
        )}
      </View>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemePreferenceProvider>
        <RootNavigation />
      </ThemePreferenceProvider>
    </AuthProvider>
  );
}
