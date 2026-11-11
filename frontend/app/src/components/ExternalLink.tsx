import { Linking } from 'react-native';
import { Button } from './ActionButton';
export type ExternalLinkProps = { title: string; href: string; variant?: 'primary' | 'secondary' | 'quiet'; color?: string; onError?: () => void };
export function ExternalLink({ href, onError, ...props }: ExternalLinkProps) {
  return <Button {...props} onPress={() => { Linking.openURL(href).catch(() => onError?.()); }} />;
}
