// UNUSED (2026-09-30): showed sample (invented) figures; no longer routed. Kept on purpose, not deleted — see docs/UNUSED_CODE.md before reusing or removing.
import React, { useState } from 'react';
import { 
  Users, 
  Activity, 
  MapPin, 
  Map as MapIcon,
  BarChart4,
  Layers,
  Camera,
  Navigation,
  Satellite,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Zap,
  LayoutDashboard
} from 'lucide-react';
import { 
  SimpleCard, 
  MetricTile, 
  WorkerActivityTable, 
  GeospatialPreview, 
  FilterBar,
  EvidenceThumbnail,
  LocationBadge
} from '../../../components/SharedComponents';

import SustainabilitySection from './sections/SustainabilitySection';
import GeospatialSection from './sections/GeospatialSection';
import WorkforceSection from './sections/WorkforceSection';
import OverviewSection from './sections/OverviewSection';

const MaizeDashboard = ({ activeSection }) => {
  const [activeLayer, setActiveLayer] = useState('plots');

  const maizeData = [
    { id: 'W-092', name: 'Musa John', task: 'Fertilizing', plot: 'P-Maize-01', output: '1.2 HA', status: 'Active', location: { lat: 6.5844, lng: 3.4392 }, evidence: '' },
    { id: 'W-095', name: 'Alice Peters', task: 'Harvesting', plot: 'P-Maize-04', output: '2.4 MT', status: 'Completed', location: { lat: 6.5801, lng: 3.4312 }, evidence: '' },
  ];

  const columns = [
    { key: 'evidence', label: 'Evidence', render: (val) => <EvidenceThumbnail src={val} /> },
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Worker Name' },
    { key: 'task', label: 'Specific Task' },
    { key: 'plot', label: 'Assigned Plot' },
    { key: 'output', label: 'Work Output', render: (val) => <span className="text-[13px] font-black text-gray-900 italic">{val}</span> },
    { key: 'location', label: 'Field GPS', render: (val) => <LocationBadge lat={val.lat} lng={val.lng} /> },
    { key: 'status', label: 'Status' },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'geospatial':
        return <GeospatialSection activeLayer={activeLayer} setActiveLayer={setActiveLayer} />;
      case 'workers':
        return <WorkforceSection data={maizeData} columns={columns} />;
      case 'sustainability':
        return <SustainabilitySection />;
      default:
        return <OverviewSection />;
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-[1700px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter capitalize">{(activeSection || 'dashboard').replace(/-/g, ' ')}</h1>
          <p className="text-[14px] text-gray-500 mt-1 font-medium italic">Maize Intelligence Node · Grain Management</p>
        </div>
      </div>
      {renderContent()}
    </div>
  );
};

export default MaizeDashboard;
