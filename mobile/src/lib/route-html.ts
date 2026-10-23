import { validPoint, type RoadRoute } from './directions';
import type { MapPoint } from './map';

export function routeHtml(origin: MapPoint | null, destination: MapPoint, route: RoadRoute | null) {
  if (!validPoint(destination) || (origin && !validPoint(origin))) throw new Error('invalid-location');
  // Only validated numeric coordinates enter this document; no names, phone or IDs.
  const payload = JSON.stringify({ origin, destination, coordinates: route?.coordinates ?? [] }).replace(/</g, '\\u003c');
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="strict-origin-when-cross-origin">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="">
<style>html,body,#map{height:100%;width:100%;margin:0;font-family:Arial,sans-serif}#status{position:absolute;z-index:1000;top:8px;left:50px;right:8px;background:white;padding:8px;border-radius:8px;font-size:12px}.pin{border:3px solid white;border-radius:50%;color:white;text-align:center;font:bold 14px/28px Arial;box-shadow:0 1px 6px #333}</style></head>
<body><div id="status" role="status">Đang tải bản đồ…</div><div id="map" aria-label="Bản đồ tuyến đường TNV đến bệnh nhân"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
<script>
if(!window.L){document.getElementById('status').textContent='Chưa tải được bản đồ. Kiểm tra Internet hoặc mở Google Maps.';}else{
const data=${payload};const map=L.map('map',{scrollWheelZoom:false});
const tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>'}).addTo(map);
tiles.on('tileerror',()=>{document.getElementById('status').textContent='Một phần bản đồ chưa tải được. Có thể mở Google Maps.';});
tiles.on('load',()=>{document.getElementById('status').textContent='A: TNV · B: Bệnh nhân · Tuyến ô tô tham khảo';});
function pin(point,label,color,text){return L.marker([point.latitude,point.longitude],{icon:L.divIcon({className:'',html:'<div class="pin" style="background:'+color+'">'+label+'</div>',iconSize:[34,34],iconAnchor:[17,17]})}).addTo(map).bindTooltip(text);}
let a=null,b=null,line=null,previousTarget='',hadRoute=false;
window.ehisUpdate=function(next){
const bounds=[[next.destination.latitude,next.destination.longitude]],target=next.destination.latitude+','+next.destination.longitude;
if(b)b.setLatLng(bounds[0]);else b=pin(next.destination,'B','#ca3b32','Bệnh nhân');
if(next.origin){const pos=[next.origin.latitude,next.origin.longitude];if(a)a.setLatLng(pos);else a=pin(next.origin,'A','#1677c8','TNV');bounds.push(pos);}
const points=next.coordinates.map(p=>[p[1],p[0]]);
if(points.length){if(line)line.setLatLngs(points);else line=L.polyline(points,{color:'#1677c8',weight:6,opacity:.85}).addTo(map);bounds.push(...points);}else if(line){map.removeLayer(line);line=null;}
if(!previousTarget||previousTarget!==target||(!hadRoute&&points.length))map.fitBounds(L.latLngBounds(bounds),{padding:[35,45],maxZoom:17});
previousTarget=target;hadRoute=points.length>0;
};window.ehisUpdate(data);
new ResizeObserver(()=>map.invalidateSize()).observe(document.getElementById('map'));
if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage('ehis-map-ready');
}
</script></body></html>`;
}

export function routeUpdateScript(origin: MapPoint | null, destination: MapPoint, route: RoadRoute | null) {
  if (!validPoint(destination) || (origin && !validPoint(origin)) || (route && !route.coordinates.every(pair => pair.length === 2 && validPoint({ latitude: pair[1], longitude: pair[0] })))) throw new Error('invalid-location');
  const payload = JSON.stringify({ origin, destination, coordinates: route?.coordinates ?? [] }).replace(/</g, '\\u003c');
  return `if(window.ehisUpdate)window.ehisUpdate(${payload});true;`;
}
