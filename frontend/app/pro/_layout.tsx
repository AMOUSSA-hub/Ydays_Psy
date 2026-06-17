import { Tabs, Redirect } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Platform,
  View,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';
import { useAppBackgroundClass } from '@/hooks/use-app-background';

const ICON_MAP: Record<string, string> = {
  patients: 'person.2.fill',
  agenda: 'calendar',
  profile: 'person.fill',
};

const ALLOWED = ['patients', 'agenda', 'profile'];

function MobileTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.mobileContainer, { paddingBottom: insets.bottom + 16 }]}>
      <View style={styles.mobileInner}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          if (!ALLOWED.includes(route.name)) return null;
          if ((options as any).href === null) return null;

          const isFocused = state.index === index;
          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              activeOpacity={0.8}
              style={[styles.tabButton, isFocused && styles.tabButtonActive]}
            >
              <IconSymbol
                size={24}
                name={(ICON_MAP[route.name] || 'person.fill') as any}
                color={isFocused ? '#000' : '#666'}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function WebSidebar({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.webSidebar}>
      <View style={styles.webSidebarInner}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          if (!ALLOWED.includes(route.name)) return null;
          if ((options as any).href === null) return null;

          const isFocused = state.index === index;
          return (
            <TouchableOpacity
              key={route.key}
              onPress={() => navigation.navigate(route.name)}
              style={[styles.webItem, isFocused && styles.webItemActive]}
            >
              <IconSymbol
                size={32}
                name={(ICON_MAP[route.name] || 'person.fill') as any}
                color={isFocused ? '#000' : '#666'}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mobileContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  mobileInner: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 50,
    padding: 8,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  tabButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  webSidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 100,
    backgroundColor: '#F2F2F7',
    zIndex: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webSidebarInner: {
    height: '80%',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  webItem: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 2,
  },
  webItemActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#9896D4',
  },
});

export default function ProLayout() {
  const { user, initialized, role } = useAuth();
  const screenBg = useAppBackgroundClass();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  if (!initialized) {
    return (
      <View className={cn('flex-1 items-center justify-center', screenBg)}>
        <ActivityIndicator size="large" color="#8E8CCA" />
      </View>
    );
  }

  if (!user) return <Redirect href="/" />;
  // Si l'utilisateur n'a pas choisi l'espace pro, on le renvoie au bon endroit.
  if (role && role !== 'professional') return <Redirect href="/(tabs)/home" />;
  if (!role) return <Redirect href="/" />;

  return (
    <View className="flex-1">
      <Tabs
        tabBar={(props) => (isDesktop ? <WebSidebar {...props} /> : <MobileTabBar {...props} />)}
        screenOptions={{
          headerShown: false,
          sceneStyle: {
            paddingLeft: isDesktop ? 100 : 0,
            paddingBottom: !isDesktop
              ? Platform.OS === 'ios' || Platform.OS === 'android'
                ? 100 + insets.bottom
                : 100
              : 0,
            backgroundColor: '#9896D4',
          },
        }}
      >
        <Tabs.Screen name="patients" />
        <Tabs.Screen name="agenda" />
        <Tabs.Screen name="profile" />
        <Tabs.Screen name="patient/[id]" options={{ href: null }} />
      </Tabs>
    </View>
  );
}
