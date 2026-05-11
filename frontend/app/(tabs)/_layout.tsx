import { Tabs, Redirect } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Platform, View, TouchableOpacity, StyleSheet, Image } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';
import { useAppBackgroundClass } from '@/hooks/use-app-background';

function TabIcon({ name, color, size, routeName }: { name: string, color: string, size: number, routeName: string }) {
  if (routeName === 'character') {
    return (
      <Image 
        source={require('@/assets/images/figma/monster.png')} 
        style={{ width: size + 10, height: size + 10, resizeMode: 'contain' }}
      />
    );
  }
  
  const iconMap: Record<string, any> = {
    'home': 'house.fill',
    'book': 'book.closed.fill',
    'agenda': 'checklist',
    'phone': 'phone.fill',
    'profile': 'person.fill',
  };

  return <IconSymbol size={size} name={iconMap[routeName] || name} color={color} />;
}

function MobileTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  
  return (
    <View 
      style={[
        styles.mobileContainer, 
        { paddingBottom: insets.bottom + 16 }
      ]}
    >
      <View style={styles.mobileInner}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const allowedRoutes = ['home', 'book', 'character', 'agenda', 'phone', 'profile'];
          if (!allowedRoutes.includes(route.name)) return null;
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
              style={[
                styles.tabButton,
                isFocused && styles.tabButtonActive
              ]}
            >
              <TabIcon 
                routeName={route.name}
                name=""
                color={isFocused ? '#000' : '#666'} 
                size={24} 
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
          
          const allowedRoutes = ['home', 'book', 'character', 'agenda', 'phone', 'profile'];
          if (!allowedRoutes.includes(route.name)) return null;
          if ((options as any).href === null) return null;

          const isFocused = state.index === index;
          const onPress = () => {
            navigation.navigate(route.name);
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={[styles.webItem, isFocused && styles.webItemActive]}
            >
              <TabIcon 
                routeName={route.name}
                name=""
                color={isFocused ? '#000' : '#666'} 
                size={32} 
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
    backgroundColor: '#F2F2F7E6', // More opaque for better readability
    borderRadius: 50,
    padding: 8,
    gap: 8, // Reduced gap from 12
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  tabButton: {
    width: 48, // Reduced from 60
    height: 48, // Reduced from 60
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

export default function TabLayout() {
  const { user, initialized } = useAuth();
  const screenBg = useAppBackgroundClass();
  const insets = useSafeAreaInsets();

  if (!initialized) {
    return (
      <View className={cn('flex-1 items-center justify-center', screenBg)}>
        <ActivityIndicator size="large" color="#8E8CCA" />
      </View>
    );
  }

  if (!user) return <Redirect href="/" />;

  return (
    <View className="flex-1">
      <Tabs
        tabBar={(props) => (Platform.OS === 'web' ? <WebSidebar {...props} /> : <MobileTabBar {...props} />)}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tabs.Screen name="home" />
        <Tabs.Screen name="book" />
        <Tabs.Screen name="character" />
        <Tabs.Screen name="agenda" />
        <Tabs.Screen name="phone" />
        <Tabs.Screen name="profile" />
        <Tabs.Screen name="journal-entry" options={{ href: null }} />
        <Tabs.Screen name="quiz/index" options={{ href: null }} />
        <Tabs.Screen name="quiz/[slug]" options={{ href: null }} />
        <Tabs.Screen name="activities/index" options={{ href: null }} />
        <Tabs.Screen name="activities/[slug]" options={{ href: null }} />
        <Tabs.Screen name="settings" options={{ href: null }} />
        <Tabs.Screen name="privacy" options={{ href: null }} />
      </Tabs>
    </View>
  );
}