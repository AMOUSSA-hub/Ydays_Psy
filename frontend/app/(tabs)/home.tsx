import React from 'react';
import { View, ScrollView, Platform, TouchableOpacity } from 'react-native';
import { WebContainer } from '@/components/ui/web-container';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Reusable Card component with premium styling
function Card({ className, style, children, gradient }: {
  className?: string;
  style?: object;
  children?: React.ReactNode;
  gradient?: boolean;
}) {
  return (
    <View
      className={`bg-white/80 rounded-3xl border border-lavender-300 shadow-sm ${className || ''}`}
      style={[
        style,
        Platform.OS === 'web' ? { backdropFilter: 'blur(10px)' } : {}
      ]}
    >
      {children}
    </View>
  );
}

const DAYS = ["LUN", "MAR", "MER", "JEU", "VEN", "SAM", "DIM"];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';

  return (
    <View className="flex-1 bg-lavender-200" style={isWeb ? { paddingLeft: 90 } : {}}>
      {/* Header Bar */}
      <WebContainer maxWidth={800}>
        <View className={`flex-row items-center justify-between px-6 ${isWeb ? 'py-4' : 'pt-14 pb-4'}`}>
          <TouchableOpacity className="p-2 bg-white/50 rounded-full">
            <IconSymbol name="gearshape.fill" size={22} color="#6B5B95" />
          </TouchableOpacity>
          
          <View className="flex-row items-center rounded-full px-5 py-2 border border-lavender-400 bg-white/60 shadow-sm">
            <ThemedText className="text-base font-bold tracking-tight" lightColor="#4B3F72">
              Ochitsu
            </ThemedText>
          </View>

          <TouchableOpacity className="p-2 bg-white/50 rounded-full">
            <IconSymbol name="person.fill" size={22} color="#6B5B95" />
          </TouchableOpacity>
        </View>
      </WebContainer>

      {/* Main Content */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ 
          flexGrow: 1, 
          paddingBottom: isWeb ? 40 : (110 + insets.bottom), 
          paddingTop: 10
        }}
        showsVerticalScrollIndicator={false}
      >
        <WebContainer maxWidth={800} className="px-5 space-y-6">
          
          {/* Hero Welcome Section */}
          <Card className="p-6 bg-orchid justify-center overflow-hidden" style={{ minHeight: 160 }}>
            <View className="z-10">
              <ThemedText className="text-white/80 text-sm font-medium mb-1">Bonjour amous,</ThemedText>
              <ThemedText className="text-white text-2xl font-bold leading-tight">
                Comment vous sentez-vous aujourd'hui ?
              </ThemedText>
              <TouchableOpacity className="mt-4 bg-white/20 self-start px-4 py-2 rounded-full border border-white/30">
                <ThemedText className="text-white text-xs font-bold">FAIRE LE BILAN</ThemedText>
              </TouchableOpacity>
            </View>
            {/* Subtle background decoration */}
            <View className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full" />
          </Card>

          {/* Week Mood Tracker */}
          <View>
            <View className="flex-row justify-between items-center mb-4 px-1">
              <ThemedText className="font-bold text-lg" lightColor="#4B3F72">Votre semaine</ThemedText>
              <ThemedText className="text-sm text-orchid font-medium">Détails</ThemedText>
            </View>
            <View className="flex-row justify-between">
              {DAYS.map((day, i) => (
                <View key={day} className="items-center" style={{ width: '12%' }}>
                  <Card
                    className={`w-full aspect-[0.7] items-center justify-center mb-2 ${i === 3 ? 'bg-orchid border-orchid' : ''}`}
                    style={i === 3 ? { elevation: 4 } : {}}
                  >
                    <ThemedText
                      className={`text-[10px] font-bold ${i === 3 ? 'text-white' : 'text-lavender-700'}`}
                    >
                      {day}
                    </ThemedText>
                    <View className="mt-2">
                       {i <= 3 ? (
                         <View className={`w-2 h-2 rounded-full ${i === 3 ? 'bg-white' : 'bg-blue-400'}`} />
                       ) : (
                         <View className="w-2 h-2 rounded-full border border-lavender-300" />
                       )}
                    </View>
                  </Card>
                </View>
              ))}
            </View>
          </View>

          {/* Activity Cards Row */}
          <View className="flex-row gap-4" style={{ height: 200 }}>
            {/* Left Main Card */}
            <Card className="flex-1 p-5 justify-between bg-lavender-100">
               <View>
                 <View className="w-10 h-10 bg-orchid/20 rounded-xl items-center justify-center mb-3">
                    <IconSymbol name="calendar" size={20} color="#6B5B95" />
                 </View>
                 <ThemedText className="font-bold text-base" lightColor="#4B3F72">Prochaine séance</ThemedText>
                 <ThemedText className="text-xs text-lavender-700 mt-1">Dr. Martin • 14:30</ThemedText>
               </View>
               <TouchableOpacity className="bg-white px-3 py-2 rounded-xl border border-lavender-300 items-center">
                  <ThemedText className="text-[10px] font-bold text-orchid">REJOINDRE</ThemedText>
               </TouchableOpacity>
            </Card>

            {/* Right Stacked Cards */}
            <View className="flex-1 gap-4">
              <Card className="flex-1 p-4 flex-row items-center bg-white">
                <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-3">
                  <IconSymbol name="book.fill" size={18} color="#5B9BD5" />
                </View>
                <View>
                  <ThemedText className="font-bold text-sm" lightColor="#4B3F72">Note rapide</ThemedText>
                  <ThemedText className="text-[10px] text-lavender-600">3 entrées</ThemedText>
                </View>
              </Card>

              <Card className="flex-1 p-4 flex-row items-center bg-white">
                <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center mr-3">
                  <IconSymbol name="heart.fill" size={18} color="#FF7E67" />
                </View>
                <View>
                  <ThemedText className="font-bold text-sm" lightColor="#4B3F72">Exercices</ThemedText>
                  <ThemedText className="text-[10px] text-lavender-600">Respiration</ThemedText>
                </View>
              </Card>
            </View>
          </View>

        </WebContainer>
      </ScrollView>
    </View>
  );
}