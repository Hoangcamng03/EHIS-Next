import { Text as NativeText, TextProps } from 'react-native';
export function Text({ style, ...props }: TextProps) {
  return <NativeText {...props} style={[{ fontSize: 16, color: '#123c37' }, style]} />;
}
