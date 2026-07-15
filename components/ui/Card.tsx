import { radius, space } from '@/constants/theme';
import { View, type ViewStyle } from 'react-native';
import { useColors } from './theme-context';

// Poptime surface card: light-blue in light mode, raised dark in dark mode. 16px radius.
export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const c = useColors();
  return (
    <View
      style={[
        { backgroundColor: c.surface, borderRadius: radius.lg, padding: space.lg },
        style,
      ]}>
      {children}
    </View>
  );
}
