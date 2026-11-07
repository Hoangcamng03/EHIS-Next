import { StyleSheet, Text as NativeText, TextProps } from 'react-native';
import { textFamily } from '../lib/typography';
export function Text({ style, ...props }: TextProps) {
  const size = StyleSheet.flatten(style)?.fontSize ?? 16;
  return <NativeText {...props} style={[{ fontFamily: textFamily, fontSize: 16, lineHeight: Math.ceil(size * 1.5), includeFontPadding: true, color: '#123c37' }, style]} />;
}
