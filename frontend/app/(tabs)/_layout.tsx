import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Custom vertical sidebar for web
function WebSidebar({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <View style={sidebarStyles.container}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];

        // Skip hidden tabs (like journal-entry)
        if ((options as any).href === null || route.name === 'journal-entry') return null;

        const label = options.title || route.name;
        const isFocused = state.index === index;
        const color = isFocused ? '#6B5B95' : '#9A8EC1';

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
            style={[
              sidebarStyles.item,
              isFocused && sidebarStyles.itemActive,
            ]}
            activeOpacity={0.7}
          >
            {options.tabBarIcon?.({ color, focused: isFocused, size: 24 })}
            <Text
              style={[
                sidebarStyles.label,
                { color },
                isFocused && sidebarStyles.labelActive,
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const sidebarStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 90,
    backgroundColor: '#F5F3FF',
    borderRightWidth: 1,
    borderRightColor: '#D0D0FF',
    paddingTop: 30,
    alignItems: 'center',
    zIndex: 100,
  },
  item: {
    width: 80,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    marginBottom: 6,
  },
  itemActive: {
    backgroundColor: '#EDE9FE',
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 5,
    textAlign: 'center',
  },
  labelActive: {
    color: '#6B5B95',
  },
});

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();

  const isWeb = Platform.OS === 'web';

  return (
    <Tabs
      tabBar={isWeb ? (props) => <WebSidebar {...props} /> : undefined}
      screenOptions={{
        tabBarActiveTintColor: '#6B5B95',
        tabBarInactiveTintColor: '#9A8EC1',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: isWeb ? { display: 'none' } : {
          backgroundColor: '#EDE9FE',
          borderTopWidth: 1,
          borderTopColor: '#D0D0FF',
          height: 80 + insets.bottom,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          overflow: 'hidden',
          paddingBottom: 12 + insets.bottom,
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
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="book"
        options={{
          title: 'Journal',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="book.closed.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="character"
        options={{
          title: 'Avatar',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="figure.walk" color={color} />,
        }}
      />
      <Tabs.Screen
        name="agenda"
        options={{
          title: 'Agenda',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="checklist" color={color} />,
        }}
      />
      <Tabs.Screen
        name="phone"
        options={{
          title: 'Appel',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="phone.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="journal-entry"
        options={{ href: null }}
      />
    </Tabs>
  );
}