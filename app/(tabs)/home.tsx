import React from 'react';
import { View, ScrollView } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';

// Custom Card component for the layout
const Card = ({ children, className }: { children?: React.ReactNode; className?: string }) => {
  const cardBg = useThemeColor({ light: '#F0F0F0', dark: '#2C2C2C' }, 'background'); // Light gray for cards
  const borderColor = useThemeColor({ light: '#E0E0E0', dark: '#3A3A3A' }, 'background');
  return (
    <ThemedView
      className={`rounded-xl p-4 border border-[${borderColor}] shadow-sm`}
      style={{ backgroundColor: cardBg }}
    >
      {children}
    </ThemedView>
  );
};

export default function HomeScreen() {
  const headerBg = '#E0E0FF'; // Light purple from image
  const ochitsuPillBg = '#D0D0FF'; // Slightly different purple for the pill
  const ochitsuPillBorder = '#B0B0FF'; // Border for the pill

  return (
    <ThemedView className="flex-1">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4 pt-12" style={{ backgroundColor: headerBg }}>
        <IconSymbol name="gearshape.fill" size={28} color="black" />
        <View className="flex-row items-center rounded-full px-4 py-2 border" style={{ backgroundColor: ochitsuPillBg, borderColor: ochitsuPillBorder }}>
          <ThemedText className="text-lg font-semibold text-black">Ochitsu</ThemedText>
        </View>
        <IconSymbol name="person.fill" size={28} color="black" />
      </View>

      <ScrollView className="flex-1 p-4" contentContainerStyle={{ gap: 16 }}>
        {/* Large rectangular card */}
        <Card className="h-48" />

        {/* Row of smaller pill-shaped cards */}
        <View className="flex-row flex-wrap justify-between gap-2">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="w-[calc(33%-8px)] h-20 rounded-full" />
          ))}
        </View>

        {/* Two larger cards below */}
        <View className="flex-row justify-between gap-4">
          <Card className="flex-1 h-64" />
          <View className="flex-1 gap-4">
            <Card className="h-32" />
            <Card className="h-32" />
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}