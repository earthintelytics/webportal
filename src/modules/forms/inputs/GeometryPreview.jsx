import { useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const IMAGERY = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const GREEN = '#3F8432';

function Fit({ geometry }) {
  const map = useMap();
  useEffect(() => {
    const b = L.geoJSON(geometry).getBounds();
    if (b.isValid()) map.fitBounds(b, { padding: [16, 16], maxZoom: 18 });
  }, [geometry, map]);
  return null;
}

/** A drawn, walked or uploaded answer on a small satellite map, for reviewers. */
const GeometryPreview = ({ geometry }) => (
  <div className="h-48 rounded-lg overflow-hidden border border-gray-200 mt-2 relative z-0">
    <MapContainer center={[0, 0]} zoom={2} maxZoom={19} style={{ height: '100%', width: '100%' }} attributionControl={false} zoomControl={false}>
      <TileLayer url={IMAGERY} maxZoom={19} />
      <GeoJSON data={geometry} style={{ color: GREEN, weight: 3, fillOpacity: 0.2 }}
        pointToLayer={(_, latlng) => L.circleMarker(latlng, { radius: 7, color: '#fff', weight: 2, fillColor: GREEN, fillOpacity: 1 })} />
      <Fit geometry={geometry} />
    </MapContainer>
  </div>
);

export default GeometryPreview;
