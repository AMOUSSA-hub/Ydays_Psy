import React from 'react';
import { View, Platform, StyleSheet } from 'react-native';

interface WebContainerProps {
  children: React.ReactNode;
  maxWidth?: number;
  className?: string;
}

export function WebContainer({ children, maxWidth = 800, className = "" }: WebContainerProps) {
  if (Platform.OS !== 'web') {
    return <View className={`w-full ${className}`}>{children}</View>;
  }

  return (
    <View style={styles.outerContainer}>
      <View 
        className={className}
        style={[
          styles.innerContainer, 
          { maxWidth }
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    alignItems: 'center',
  },
  innerContainer: {
    width: '100%',
  },
});
