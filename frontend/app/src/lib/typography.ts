import { Platform } from 'react-native';
import { webFontStack } from './web-font';
// Local system families include Vietnamese fallback; no font CDN or download at startup.
export const textFamily = Platform.select({ android: 'sans-serif', ios: 'System', default: webFontStack });
