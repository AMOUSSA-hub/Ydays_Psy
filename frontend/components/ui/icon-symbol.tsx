// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps, SymbolView } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, Platform, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'person.fill': 'person', // Added mapping for profile icon
  'gearshape.fill': 'settings', // Added mapping for settings icon
  'arrow.right': 'arrow-right-alt', // Added mapping for arrow icon
  'questionmark.circle.fill': 'help', // Added mapping for question mark icon
  'book.closed.fill': 'menu-book', // For book tab
  'figure.walk': 'accessibility', // Placeholder for character icon, as it's unique
  'checklist': 'checklist', // For checklist tab
  'phone.fill': 'phone', // For phone tab
  'magnifyingglass': 'search',
  'plus': 'add',
  'chevron.left': 'chevron-left',
  'bold': 'format-bold',
  'italic': 'format-italic',
  'underline': 'format-underlined',
  'strikethrough': 'strikethrough-s',
  'textformat.size': 'format-size',
  'paintbrush.fill': 'brush',
  'calendar': 'calendar-today',
  'book.fill': 'book',
  'heart.fill': 'favorite',
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  className, // Use className for Tailwind
  style,
  weight, // Keep weight for iOS specific component
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  className?: string; // Add className prop
  style?: StyleProp<any>;
  weight?: SymbolWeight;
}) {
  if (Platform.OS === 'ios') {
    return (
      <SymbolView
        weight={weight}
        tintColor={color}
        resizeMode="scaleAspectFit"
        name={name}
        style={[
          {
            width: size,
            height: size,
          },
          style as any,
        ]}
      />
    );
  }

  return <MaterialIcons color={color} size={size} name={MAPPING[name]} className={className} style={style as any} />;
}