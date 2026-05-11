import React from 'react';
import { View, Text, Platform, ScrollView } from 'react-native';
import { WebContainer } from '@/components/ui/web-container';
import { useAuth } from '@/contexts/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const mainBg = isDark ? '#6B6588' : '#9896D4';

  return (
    <View style={{ flex: 1, backgroundColor: mainBg, paddingLeft: isWeb ? 100 : 0 }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingTop: isWeb ? 24 : 48, paddingBottom: 16 }}>
        <View style={{ borderRadius: 999, backgroundColor: '#F2F2F7', paddingHorizontal: 40, paddingVertical: 8 }}>
          <Text style={{ fontSize: 20, fontWeight: '900', color: '#000' }}>Mon Profil</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: isWeb ? 48 : 120 + insets.bottom }} showsVerticalScrollIndicator={false}>
        <WebContainer maxWidth={800} className="px-6">
          <View style={{ borderRadius: 40, backgroundColor: '#F2F2F7', padding: 28, borderWidth: 1, borderColor: '#f0f0f0', alignItems: 'center' }}>
            <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 40 }}>🧑</Text>
            </View>
            <Text style={{ fontSize: 24, fontWeight: '900', color: '#000', marginBottom: 8 }}>
              {user ? 'Utilisateur Connecté' : 'Non Connecté'}
            </Text>
            {user && (
              <Text style={{ fontSize: 14, color: '#666', marginBottom: 20 }}>
                ID: {user.id}
              </Text>
            )}
            
            <View style={{ backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 20, padding: 16, width: '100%', marginTop: 20 }}>
              <Text style={{ textAlign: 'center', fontStyle: 'italic', color: '#666' }}>
                Fonctionnalités de profil à venir...
              </Text>
            </View>
          </View>
        </WebContainer>
      </ScrollView>
    </View>
  );
}
