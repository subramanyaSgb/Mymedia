import { type } from '@/constants/theme';
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { useColors } from './theme-context';

type Variant = keyof typeof type;

type Props = RNTextProps & {
  variant?: Variant;
  color?: string;
  muted?: boolean;
  center?: boolean;
};

// Themed typography. Roboto is the Android system font, so poptime type needs no font loading.
export function Text({ variant = 'body', color, muted, center, style, ...rest }: Props) {
  const c = useColors();
  return (
    <RNText
      style={[
        type[variant],
        {
          color: color ?? (muted ? c.textMuted : c.text),
          ...(center ? { textAlign: 'center' as const } : null),
        },
        style,
      ]}
      {...rest}
    />
  );
}
