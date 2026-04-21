import React from 'react';
import { View, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { WebContainer } from '@/components/ui/web-container';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AgendaScreen() {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const daysLabels = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

  // Generating dummy days for April (starts on Wednesday)
  const calendarDays = [
    null, null, null, { day: 1, cycle: 19, active: true }, { day: 2, cycle: 20 }, { day: 3, cycle: 21 }, { day: 4, cycle: 22 },
    { day: 5, cycle: 23 }, { day: 6, cycle: 24 }, { day: 7, cycle: 25 }, { day: 8, cycle: 26 }, { day: 9, cycle: 27 }, { day: 10, cycle: 28 }, { day: 11, cycle: 1, isSunday: true },
    { day: 12, cycle: 2 }, { day: 13, cycle: 3 }, { day: 14, cycle: 4 }, { day: 15, cycle: 5 }, { day: 16, cycle: 6 }, { day: 17, cycle: 7 }, { day: 18, cycle: 8 },
    { day: 19, cycle: 9, hasIndicator: true }, { day: 20, cycle: 10, hasIndicator: true }, { day: 21, cycle: 11, hasIndicator: true }, { day: 22, cycle: 12, hasIndicator: true }, { day: 23, cycle: 13, hasIndicator: true }, { day: 24, cycle: 14, hasIndicator: true }, { day: 25, cycle: 15, indicatorType: 'purple' },
    { day: 26, cycle: 16, hasIndicator: true }, { day: 27, cycle: 17 }, { day: 28, cycle: 18 }, { day: 29, cycle: 19 }, { day: 30, cycle: 20 }, null, null
  ];

  return (
    <View 
      className="flex-1 bg-lavender-200"
      style={{ paddingLeft: isWeb ? 90 : 0, paddingTop: isWeb ? 0 : insets.top }}
    >
      {/* Header */}
      <WebContainer maxWidth={800}>
        <View className="flex-row items-center justify-between px-6 py-4">
        <TouchableOpacity activeOpacity={0.7}>
          <IconSymbol name="gearshape.fill" size={24} color="#6B5B95" />
        </TouchableOpacity>
        
        <View className="flex-row bg-lavender-700/10 rounded-full p-1 border border-lavender-700/20">
          <View className="bg-lavender-100 px-6 py-1.5 rounded-full shadow-sm border border-lavender-700/10">
            <ThemedText className="font-bold text-sm" lightColor="#6B5B95">Avr.</ThemedText>
          </View>
          <View className="px-6 py-1.5">
            <ThemedText className="font-bold text-sm opacity-40" lightColor="#2D2347">An</ThemedText>
          </View>
        </View>

        <TouchableOpacity activeOpacity={0.7}>
          <IconSymbol name="checklist" size={24} color="#6B5B95" />
        </TouchableOpacity>
        </View>
      </WebContainer>

      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ paddingBottom: isWeb ? 40 : (120 + insets.bottom) }}
        showsVerticalScrollIndicator={false}
      >
        <WebContainer maxWidth={800} className="px-4">
        {/* Day Labels */}
        <View className="flex-row justify-between mb-4 px-2">
          {daysLabels.map(d => (
            <ThemedText key={d} className="text-xs font-bold opacity-30 w-10 text-center" lightColor="#2D2347">{d}</ThemedText>
          ))}
        </View>

        {/* Calendar Grid */}
        <View className="flex-row flex-wrap justify-between">
          {calendarDays.map((d, i) => (
            <View 
              key={i} 
              className={`w-[13.5%] aspect-square mb-1 items-center justify-center rounded-xl border border-lavender-700/5 ${d?.active ? 'bg-lavender-100 border-lavender-700/40 shadow-sm' : 'bg-lavender-100/40'}`}
            >
              {d && (
                <>
                  <View className="flex-row items-start">
                    <ThemedText className={`text-base font-bold ${d.isSunday ? 'text-red-400' : ''}`} lightColor="#2D2347">{d.day}</ThemedText>
                    <ThemedText className="text-[8px] opacity-30 ml-0.5 mt-1" lightColor="#2D2347">{d.cycle}</ThemedText>
                  </View>
                  <View className="absolute bottom-1.5 flex-row gap-0.5">
                    {d.hasIndicator && <View className="w-1 h-1 rounded-full bg-pink-400" />}
                    {d.indicatorType === 'purple' && <View className="w-1 h-1 rounded-full bg-purple-400" />}
                  </View>
                </>
              )}
            </View>
          ))}
        </View>

        {/* Action Button */}
        <View className="mt-8 mb-8">
          <TouchableOpacity 
            activeOpacity={0.8}
            className="bg-lavender-100 border border-lavender-700/30 py-4 rounded-[20px] items-center shadow-sm"
          >
            <ThemedText className="font-bold text-lg" lightColor="#6B5B95">Ajouter une note</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Details Section */}
        <View className="bg-lavender-100/90 rounded-[40px] p-8 border border-lavender-700/10 shadow-sm">
          <View className="flex-row justify-between items-center mb-8">
            <ThemedText className="text-2xl font-bold" lightColor="#2D2347">1 avr.</ThemedText>
            <View className="flex-row items-center bg-lavender-200 px-4 py-2 rounded-full border border-lavender-700/20">
               <ThemedText className="text-xs font-bold mr-2 uppercase tracking-wider" lightColor="#2D2347">Jour du suivi 19</ThemedText>
               <IconSymbol name="questionmark.circle.fill" size={18} color="#6B5B95" />
            </View>
          </View>

          <View className="gap-8">
            <View className="flex-row items-start">
              <View className="w-3 h-3 rounded-full bg-green-400 mt-1.5 mr-4" />
              <View className="flex-1">
                <ThemedText className="text-lg font-bold text-pink-500 mb-1">Prise du traitement</ThemedText>
                <ThemedText className="text-sm font-medium opacity-50" lightColor="#2D2347">Séance de suivi matinale complétée</ThemedText>
              </View>
            </View>

            <View className="flex-row items-center border-t border-lavender-700/5 pt-6">
              <View className="w-3 h-3 rounded-full bg-purple-400 mr-4" />
              <ThemedText className="text-base font-bold flex-1" lightColor="#2D2347">Suivi d'humeur - Anxiété stable</ThemedText>
            </View>
          </View>
          </View>
        </WebContainer>
      </ScrollView>
    </View>
  );
}
