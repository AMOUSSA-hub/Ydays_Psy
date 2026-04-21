import React from 'react';
import { Platform, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WebContainer } from '@/components/ui/web-container';

export default function PhoneScreen() {
  const isWeb = Platform.OS === 'web';
  return (
    <ThemedView 
      className="flex-1"
      style={{ paddingLeft: isWeb ? 90 : 0, paddingTop: 0 }}
    >
      <WebContainer maxWidth={800} className="flex-1 justify-center items-center">
        <ThemedText type="title">Phone Screen</ThemedText>
      </WebContainer>
    </ThemedView>
  );
}