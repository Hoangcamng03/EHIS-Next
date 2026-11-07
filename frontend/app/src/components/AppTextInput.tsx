import { forwardRef, type ComponentRef } from 'react';
import { TextInput as NativeInput, type TextInputProps } from 'react-native';
import { textFamily } from '../lib/typography';
export const TextInput = forwardRef<ComponentRef<typeof NativeInput>, TextInputProps>(function TextInput({ style, ...props }, ref) {
  return <NativeInput ref={ref} {...props} style={[{ fontFamily: textFamily, fontSize: 16, lineHeight: 24, includeFontPadding: true }, style]} />;
});
