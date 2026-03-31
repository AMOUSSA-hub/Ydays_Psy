import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#6B5B95',
        tabBarInactiveTintColor: '#9A8EC1',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: '#EDE9FE',
          borderTopWidth: 1,
          borderTopColor: '#D0D0FF',
          height: 80,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          overflow: 'hidden',
          paddingBottom: 12,
          elevation: 8,
          shadowColor: '#6B5B95',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarItemStyle: {
          paddingTop: 8,
        },
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="book"
        options={{
          title: 'Journal',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="book.closed.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="character"
        options={{
          title: 'Avatar',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="figure.walk" color={color} />,
        }}
      />
      <Tabs.Screen
        name="checklist"
        options={{
          title: 'Agenda',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="checklist" color={color} />,
        }}
      />
      <Tabs.Screen
        name="phone"
        options={{
          title: 'Appel',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="phone.fill" color={color} />,
        }}
      />
      {/* Hidden tabs */}
      <Tabs.Screen
        name="index"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="explore"
        options={{ href: null }}
      />
    </Tabs>
  );
}