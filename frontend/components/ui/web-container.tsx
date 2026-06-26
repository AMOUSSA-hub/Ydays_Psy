import React from 'react';
import { View, Platform, StyleSheet, ViewStyle } from 'react-native';

interface WebContainerProps {
  children: React.ReactNode;
  maxWidth?: number;
  className?: string;
  style?: ViewStyle;
}

export function WebContainer({ children, maxWidth = 800, className = "", style }: WebContainerProps) {
  if (Platform.OS !== 'web') {
    return <View style={[{ flex: 1 }, style]} className={`w-full ${className}`}>{children}</View>;
  }

  return (
    <View style={styles.outerContainer}>
      <View 
        className={className}
        style={[
          styles.innerContainer, 
          { maxWidth },
          style
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1, // Added flex: 1 to ensure it can fill screen height
    width: '100%',
    alignItems: 'center',
  },
  innerContainer: {
    width: '100%',
  },
});
