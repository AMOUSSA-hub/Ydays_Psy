import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  TouchableOpacity,
  View,
  StatusBar,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { WebContainer } from '@/components/ui/web-container';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';

const { width: windowWidth } = Dimensions.get('window');

export default function WelcomeScreen() {
  const { user, initialized, signInAnonymous } = useAuth();
  const isWeb = Platform.OS === 'web';
  
  const cardMaxWidth = isWeb ? 900 : 450;
  const cardWidth = isWeb ? '90%' : '100%';

  useEffect(() => {
    if (initialized && user) {
      router.replace('/(tabs)/home');
    }
  }, [initialized, user]);

  if (!initialized) {
    return (
      <View className="flex-1 items-center justify-center bg-[#9896D4]">
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  if (user) {
    return null;
  }

  return (
    <View className="flex-1 bg-[#9896D4] items-center justify-center">
      <StatusBar barStyle="light-content" />
      
      <WebContainer maxWidth={cardMaxWidth} className="flex-1 w-full items-center justify-center">
        <View 
          className="bg-[#F2F2F7] rounded-[60px] overflow-hidden items-center shadow-2xl"
          style={{
            width: cardWidth,
            minHeight: isWeb ? 550 : 650,
            paddingBottom: 40
          }}
        >
          {/* Top Decorative Element */}
          <View 
            className="bg-[#9896D4] items-center justify-center"
            style={{
              width: '140%',
              height: isWeb ? '35%' : '45%',
              borderBottomLeftRadius: 400,
              borderBottomRightRadius: 400,
              marginTop: -20,
            }}
          >
            <View className="items-center justify-center mt-10">
              <View className="bg-white/20 p-6 rounded-full mb-4">
                <Image 
                  source={require('@/assets/images/figma/monster.png')} 
                  style={{ width: 120, height: 120, resizeMode: 'contain' }}
                />
              </View>
              <ThemedText className="text-white text-4xl font-black tracking-tighter">Ochitsu</ThemedText>
            </View>
          </View>

          <View className="flex-1 w-full px-10 justify-center items-center">
            <ThemedText className="text-center text-2xl font-black text-[#4B3F72] mb-2">Bienvenue</ThemedText>
            <ThemedText className="text-center text-[#4B3F72]/60 mb-10 font-medium">
              Votre sanctuaire de paix intérieure et de bien-être quotidien.
            </ThemedText>

            <View className={cn(
              "w-full gap-4",
              isWeb ? "flex-row" : "flex-col"
            )}>
              <TouchableOpacity
                onPress={() => router.push('/login')}
                activeOpacity={0.8}
                className="flex-1 min-w-[150px] rounded-full bg-[#8E9CCF] py-5 shadow-md"
              >
                <ThemedText className="text-center text-lg font-black text-white uppercase tracking-widest">
                  Connexion
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push('/register')}
                activeOpacity={0.8}
                className="flex-1 min-w-[150px] rounded-full bg-white border border-[#8E9CCF] py-5 shadow-sm"
              >
                <ThemedText className="text-center text-lg font-black text-[#8E9CCF] uppercase tracking-widest">
                  Inscription
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          <View className="items-center gap-6 mt-4">
            <TouchableOpacity
              onPress={() => router.push('/welcome-preauth')}
              className="items-center self-center"
              activeOpacity={0.85}
            >
              <View className="h-16 w-16 items-center justify-center rounded-full bg-[#B2B1E2] shadow-lg border-4 border-white/50">
                <IconSymbol name="arrow.right" size={28} color="#FFFFFF" />
              </View>
              <ThemedText className="mt-2 text-[#4B3F72]/40 font-black text-[10px] uppercase tracking-[3px]">Continuer</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/privacy')}
              className="h-8 w-8 items-center justify-center rounded-full bg-[#9896D4]/20"
            >
              <ThemedText className="text-[#9896D4] font-black text-xs">?</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </WebContainer>
    </View>
  );
}
