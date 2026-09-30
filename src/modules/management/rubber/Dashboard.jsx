// UNUSED (2026-09-30): showed sample (invented) figures; no longer routed. Kept on purpose, not deleted — see docs/UNUSED_CODE.md before reusing or removing.
import React, { useState } from 'react';
import { 
  Droplets, 
  Users, 
  Activity, 
  MapPin, 
  RotateCcw, 
  Map as MapIcon,
  FlaskConical,
  BarChart4,
  Layers,
  Camera,
  Navigation,
  Satellite,
  CheckCircle2,
  AlertCircle,
  Leaf,
  Globe,
  Trees,
  Wind
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

const RubberDashboard = ({ activeSection }) => {
  const [activeLayer, setActiveLayer] = useState('plots');

  const carbonData = [
    { id: 'FOR-RUB-01', area: 'Rubber Buffer Zone', type: 'Secondary Forest', carbonStock: '84,200 tCO2e', health: '96%', status: 'Verified' },
    { id: 'EST-RUB-09', area: 'High-Density Estate', type: 'Industrial Rubber', carbonStock: '142,800 tCO2e', health: '94%', status: 'Active' },
  ];

  const tapperData = [
    { id: 'T-102', name: 'John Musa', block: 'B-12', latex: '12.4 KG', drc: '32%', status: 'Collected', location: { lat: 6.5344, lng: 3.3892 }, evidence: '' },
    { id: 'T-084', name: 'Alice Peters', block: 'A-04', latex: '11.8 KG', drc: '34%', status: 'Collected', location: { lat: 6.5301, lng: 3.3812 }, evidence: '' },
  ];

  const columns = [
    { key: 'evidence', label: 'Field Evidence', render: (val) => <EvidenceThumbnail src={val} /> },
    { key: 'id', label: 'Tapper ID' },
    { key: 'name', label: 'Name' },
    { key: 'block', label: 'Block' },
    { key: 'latex', label: 'Latex (KG)', render: (val) => <span className="text-[13px] font-black text-gray-900">{val}</span> },
    { key: 'drc', label: 'DRC %', render: (val) => <span className="text-[12px] font-bold text-blue-600">{val}</span> },
    { key: 'location', label: 'Tapping GPS', render: (val) => <LocationBadge lat={val.lat} lng={val.lng} /> },
    { key: 'status', label: 'Status' },
  ];

  const carbonColumns = [
    { key: 'area', label: 'Carbon Project Area' },
    { key: 'type', label: 'Classification' },
    { key: 'carbonStock', label: 'Est. Carbon Stock', render: (val) => <span className="text-[13px] font-black text-cyan-600">{val}</span> },
    { key: 'health', label: 'Biomass Health', render: (val) => <span className="text-cyan-500 font-bold">{val}</span> },
    { key: 'status', label: 'MRV Status' },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'sustainability':
        return <SustainabilitySection carbonData={carbonData} carbonColumns={carbonColumns} />;
      case 'geospatial':
        return <GeospatialSection activeLayer={activeLayer} setActiveLayer={setActiveLayer} />;
      case 'workers':
        return <WorkforceSection data={tapperData} columns={columns} />;
      default:
        return <OverviewSection />;
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-[1700px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter capitalize">{(activeSection || 'dashboard').replace(/-/g, ' ')}</h1>
          <p className="text-[14px] text-gray-500 mt-1 font-medium italic">Rubber Intelligence Node · Estate Management</p>
        </div>
      </div>
      {renderContent()}
    </div>
  );
};

export default RubberDashboard;
