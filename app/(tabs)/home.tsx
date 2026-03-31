import React from 'react';
import { View, ScrollView } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';

// Reusable Card component
function Card({ className, style, children }: {
  className?: string;
  style?: object;
  children?: React.ReactNode;
}) {
  return (
    <View
      className={`bg-lavender-100 rounded-2xl border border-lavender-400 ${className || ''}`}
      style={style}
    >
      {children}
    </View>
  );
}

export default function HomeScreen() {
  return (
    <View className="flex-1 bg-lavender-200">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-14 pb-4">
        <IconSymbol name="gearshape.fill" size={26} color="#6B5B95" />
        <View className="flex-row items-center rounded-full px-6 py-2 border border-lavender-700 bg-lavender-100">
          <ThemedText
            className="text-base font-semibold"
            lightColor="#2D2347"
            darkColor="#EDE9FE"
          >
            Ochitsu
          </ThemedText>
        </View>
        <IconSymbol name="person.fill" size={26} color="#6B5B95" />
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 100, gap: 12 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Large hero card */}
        <Card className="h-28" />

        {/* Row of 6 small rounded pill cards */}
        <View className="flex-row flex-wrap gap-2 justify-between">
          {[...Array(6)].map((_, i) => (
            <Card
              key={i}
              className="rounded-xl"
              style={{ width: '15%', aspectRatio: 1 }}
            />
          ))}
        </View>

        {/* Two large cards side by side */}
        <View className="flex-row gap-3">
          {/* Left tall card */}
          <Card className="flex-1 h-56" />
          {/* Right column — 2 stacked cards */}
          <View className="flex-1 gap-3">
            <Card className="flex-1" />
            <Card className="flex-1" />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}