import { useEffect, useState } from 'react';
import CropDashboardLayout from './shared/CropDashboardLayout';
import { fetchCropIndices } from '../../services/cropMonitoringApi';
import { fetchCropMonitoringConfig } from '../../services/organizationMonitorApi';
import 'leaflet/dist/leaflet.css';

// Module id → crop key used by the backend (api) and by the dashboard (layout).
export const CROP_PORTALS = {
  'rs-ffb': { api: 'ffb', layout: 'oil_palm' },
  'rs-cocoa': { api: 'cocoa', layout: 'cocoa' },
  'rs-rubber': { api: 'rubber', layout: 'rubber' },
  'rs-cashew': { api: 'cashew', layout: 'cashew' },
  'rs-maize': { api: 'maize', layout: 'maize' },
  'rs-rice': { api: 'rice', layout: 'rice' },
  'rs-cassava': { api: 'cassava', layout: 'cassava' },
  'rs-sugarcane': { api: 'sugarcane', layout: 'sugarcane' },
};

/** One crop monitoring portal: the crop's indices and map centre, then the shared dashboard. */
export default function CropPortal({ moduleId, onBack, onSignOut }) {
  const crop = CROP_PORTALS[moduleId];
  const [indices, setIndices] = useState(null);
  const [mapCenter, setMapCenter] = useState(null);

  useEffect(() => {
    let active = true;
    Promise.all([fetchCropIndices(crop.api).catch(() => null), fetchCropMonitoringConfig().catch(() => null)])
      .then(([ind, conf]) => {
        if (!active) return;
        setIndices(ind);
        if (conf?.map_center) setMapCenter(conf.map_center);
      });
    return () => { active = false; };
  }, [crop.api]);

  return (
    <div className="min-h-screen w-full">
      <CropDashboardLayout onBack={onBack} onSignOut={onSignOut} cropType={crop.layout} cropIndices={indices} mapCenter={mapCenter} />
    </div>
  );
}
