// UNUSED (2026-09-30): showed sample (invented) figures; no longer routed. Kept on purpose, not deleted — see docs/UNUSED_CODE.md before reusing or removing.
import React, { useState } from 'react';
import { 
  Droplets, 
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
  ThermometerSun,
  LayoutDashboard,
  Leaf,
  Globe,
  Wind,
  Trees
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

const RiceDashboard = ({ activeSection }) => {
  const [activeLayer, setActiveLayer] = useState('plots');

  const carbonData = [
    { id: 'FOR-RICE-01', area: 'Wetland Buffer', type: 'Riparian', carbonStock: '42,400 tCO2e', health: '98%', status: 'Verified' },
    { id: 'EST-RICE-09', area: 'Main Paddies', type: 'Lowland Rice', carbonStock: '62,800 tCO2e', health: '94%', status: 'Active' },
  ];

  const paddyData = [
    { id: 'W-012', name: 'Musa John', task: 'Transplanting', plot: 'P-Rice-01', output: '0.4 HA', status: 'Active', location: { lat: 6.5544, lng: 3.4092 }, evidence: '' },
    { id: 'W-015', name: 'Alice Peters', task: 'Irrigation', plot: 'P-Rice-04', output: 'Verified', status: 'Completed', location: { lat: 6.5501, lng: 3.4012 }, evidence: '' },
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

  const carbonColumns = [
    { key: 'area', label: 'Carbon Project Area' },
    { key: 'type', label: 'Classification' },
    { key: 'carbonStock', label: 'Est. Carbon Stock', render: (val) => <span className="text-[13px] font-black text-teal-600">{val}</span> },
    { key: 'health', label: 'Biomass Health', render: (val) => <span className="text-teal-500 font-bold">{val}</span> },
    { key: 'status', label: 'MRV Status' },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'sustainability':
        return <SustainabilitySection carbonData={carbonData} carbonColumns={carbonColumns} />;
      case 'geospatial':
        return <GeospatialSection activeLayer={activeLayer} setActiveLayer={setActiveLayer} />;
      case 'workers':
        return <WorkforceSection data={paddyData} columns={columns} />;
      default:
        return <OverviewSection />;
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-[1700px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter capitalize">{(activeSection || 'dashboard').replace(/-/g, ' ')}</h1>
          <p className="text-[14px] text-gray-500 mt-1 font-medium italic">Rice Intelligence Node · Paddy Management</p>
        </div>
      </div>
      {renderContent()}
    </div>
  );
};

export default RiceDashboard;
