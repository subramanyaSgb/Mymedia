import { colors, fonts, type } from '@/constants/theme';
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

type Variant = keyof typeof type;

type Props = RNTextProps & {
  variant?: Variant;
  color?: string;
  muted?: boolean;
  center?: boolean;
};

// Themed typography. Headings use the display font; everything reads from the type scale.
export function Text({ variant = 'body', color, muted, center, style, ...rest }: Props) {
  const t = type[variant];
  const isHeading = variant === 'display' || variant === 'h1' || variant === 'h2';
  return (
    <RNText
      style={[
        t,
        {
          color: color ?? (muted ? colors.textMuted : colors.text),
          ...(isHeading ? { fontFamily: fonts.display } : null),
          ...(center ? { textAlign: 'center' } : null),
        },
        style,
      ]}
      {...rest}
    />
  );
}
