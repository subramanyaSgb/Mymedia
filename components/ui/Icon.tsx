import { Ionicons } from '@expo/vector-icons';
import { useColors } from './theme-context';

// Single tintable icon system. Names are Ionicons. Default color follows the theme.
export type IconName = React.ComponentProps<typeof Ionicons>['name'];

export function Icon({ name, size = 22, color }: { name: IconName; size?: number; color?: string }) {
  const c = useColors();
  return <Ionicons name={name} size={size} color={color ?? c.text} />;
}
