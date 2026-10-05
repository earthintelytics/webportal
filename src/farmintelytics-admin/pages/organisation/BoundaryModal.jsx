import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchMinioObjectContent } from '../../../services/adminApi';
import { Modal } from '../../components/ui';

const FitToBounds = ({ data }) => {
  const map = useMap();
  useEffect(() => { const t = setTimeout(() => map.invalidateSize(), 150); return () => clearTimeout(t); }, [map]);
  useEffect(() => {
    try { const b = L.geoJSON(data).getBounds(); if (b.isValid()) map.fitBounds(b, { padding: [24, 24] }); } catch { /* leave the world view */ }
  }, [data, map]);
  return null;
};

/** The boundary the pipeline uses for an estate, read from storage. */
const BoundaryModal = ({ farm, onClose }) => {
  const [geo, setGeo] = useState(null);
  const [error, setError] = useState('');
  const [seconds, setSeconds] = useState(0);
  const loading = !geo && !error;

  useEffect(() => {
    if (!loading) return undefined;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [loading]);
  useEffect(() => {
    let live = true;
    fetchMinioObjectContent(farm.boundary_minio_path)
      .then((res) => { if (live) setGeo(JSON.parse(res.content)); })
      .catch((e) => { if (live) setError(e.message); });
    return () => { live = false; };
  }, [farm.boundary_minio_path]);

  return (
    <Modal size="lg" title={`${farm.farm_name}: boundary`} text={farm.boundary_minio_path} onClose={onClose}>
      <div className="h-[420px] rounded-xl overflow-hidden border border-gray-200 bg-gray-50 relative">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-sm text-gray-600 text-center px-6">
            <span>Loading the boundary… {seconds}s</span>
            {seconds >= 8 && <span className="text-xs text-gray-500">Boundaries with many blocks take a while on slow connections.</span>}
          </div>
        )}
        {error && <div className="absolute inset-0 flex items-center justify-center text-sm text-red-700 px-6 text-center">{error}</div>}
        {geo && (
          <MapContainer preferCanvas center={[0, 0]} zoom={2} className="h-full w-full">
            <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution="Esri" />
            <GeoJSON data={geo} style={{ color: '#ffffff', weight: 2, fillOpacity: 0.12 }} />
            <FitToBounds data={geo} />
          </MapContainer>
        )}
      </div>
    </Modal>
  );
};

export default BoundaryModal;
