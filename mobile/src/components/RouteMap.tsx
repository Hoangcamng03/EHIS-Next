import { useMemo } from 'react';
import { WebView } from 'react-native-webview';
import { routeHtml } from '../lib/route-html';
import type { MapPoint } from '../lib/map';
import type { RoadRoute } from '../lib/directions';

export function RouteMap({ origin, destination, route }: { origin: MapPoint | null; destination: MapPoint; route: RoadRoute | null }) {
  const source = useMemo(() => ({ html: routeHtml(origin, destination, route) }), [origin, destination, route]);
  return <WebView accessibilityLabel="Bản đồ tuyến đường TNV đến bệnh nhân" source={source} originWhitelist={['*']} userAgent="EHISNext/0.1 (https://github.com/Hoangcamng03/EHIS-Next)" style={{ height: 350, flex: 0 }} javaScriptEnabled domStorageEnabled={false} mixedContentMode="never" setSupportMultipleWindows={false} onShouldStartLoadWithRequest={request => request.url === 'about:blank' || request.url.startsWith('about:blank#')} />;
}
