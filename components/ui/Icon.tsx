import { colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

// Single tintable icon system (replaces every emoji). Names are Ionicons.
export type IconName = React.ComponentProps<typeof Ionicons>['name'];

export function Icon({ name, size = 22, color = colors.text }: { name: IconName; size?: number; color?: string }) {
  return <Ionicons name={name} size={size} color={color} />;
}
