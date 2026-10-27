import { memo, useEffect, useRef, useState } from 'react';
import { WebView } from 'react-native-webview';
import { routeHtml, routeUpdateScript } from '../lib/route-html';
import type { MapPoint } from '../lib/map';
import type { RoadRoute } from '../lib/directions';

export const RouteMap = memo(function RouteMap({ origin, destination, route }: { origin: MapPoint | null; destination: MapPoint; route: RoadRoute | null }) {
  const [source] = useState(() => ({ html: routeHtml(origin, destination, route) }));
  const view = useRef<WebView<unknown>>(null), ready = useRef(false);
  const script = routeUpdateScript(origin, destination, route), latest = useRef(script);
  useEffect(() => { latest.current = script; if (ready.current) view.current?.injectJavaScript(script); }, [script]);
  return <WebView<unknown> ref={view} accessibilityLabel="Bản đồ tuyến đường TNV đến bệnh nhân" source={source} originWhitelist={['*']} userAgent="EHISNext/0.1 (https://github.com/Hoangcamng03/EHIS-Next)" style={{ height: 350, flex: 0 }} javaScriptEnabled domStorageEnabled={false} mixedContentMode="never" setSupportMultipleWindows={false} onLoadStart={() => { ready.current = false; }} onMessage={event => { if (event.nativeEvent.data === 'ehis-map-ready') { ready.current = true; view.current?.injectJavaScript(latest.current); } }} onShouldStartLoadWithRequest={request => request.url === 'about:blank' || request.url.startsWith('about:blank#')} />;
});
