// UNUSED (2026-09-30): showed sample (invented) figures; no longer routed. Kept on purpose, not deleted — see docs/UNUSED_CODE.md before reusing or removing.
import React, { useState } from 'react';
import { 
  Zap, 
  Users, 
  Map as MapIcon, 
  RotateCcw, 
  Truck, 
  Activity,
  User,
  Scale,
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

const SugarcaneDashboard = ({ activeSection }) => {
  const [activeLayer, setActiveLayer] = useState('plots');

  const carbonData = [
    { id: 'FOR-CAN-01', area: 'Riparian Buffer', type: 'Wetland Forest', carbonStock: '62,400 tCO2e', health: '97%', status: 'Verified' },
    { id: 'EST-CAN-09', area: 'Main Cane Fields', type: 'Industrial Sugarcane', carbonStock: '92,800 tCO2e', health: '94%', status: 'Active' },
  ];

  const operatorData = [
    { id: 'OP-401', name: 'John Musa', task: 'Harvesting', plot: 'Plot-92', tonnage: '42.4 MT', status: 'In Transit', location: { lat: 6.5544, lng: 3.4092 }, evidence: '' },
    { id: 'OP-382', name: 'Alice Peters', task: 'Planting', plot: 'Plot-104', tonnage: '--', status: 'Completed', location: { lat: 6.5501, lng: 3.4012 }, evidence: '' },
  ];

  const columns = [
    { key: 'evidence', label: 'Field Evidence', render: (val) => <EvidenceThumbnail src={val} /> },
    { key: 'id', label: 'Operator ID' },
    { key: 'name', label: 'Name' },
    { key: 'task', label: 'Operation' },
    { key: 'tonnage', label: 'Est. Tonnage', render: (val) => <span className="text-[13px] font-black text-gray-900">{val}</span> },
    { key: 'location', label: 'Field GPS', render: (val) => <LocationBadge lat={val.lat} lng={val.lng} /> },
    { key: 'status', label: 'Status' },
  ];

  const carbonColumns = [
    { key: 'area', label: 'Carbon Project Area' },
    { key: 'type', label: 'Classification' },
    { key: 'carbonStock', label: 'Est. Carbon Stock', render: (val) => <span className="text-[13px] font-black text-green-600">{val}</span> },
    { key: 'health', label: 'Biomass Health', render: (val) => <span className="text-emerald-500 font-bold">{val}</span> },
    { key: 'status', label: 'MRV Status' },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'sustainability':
        return <SustainabilitySection carbonData={carbonData} carbonColumns={carbonColumns} />;
      case 'geospatial':
        return <GeospatialSection activeLayer={activeLayer} setActiveLayer={setActiveLayer} />;
      case 'workers':
        return <WorkforceSection data={operatorData} columns={columns} />;
      default:
        return <OverviewSection />;
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-[1700px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter capitalize">{(activeSection || 'dashboard').replace(/-/g, ' ')}</h1>
          <p className="text-[14px] text-gray-500 mt-1 font-medium italic">Sugarcane Logistics Hub · Cane Intelligence</p>
        </div>
      </div>
      {renderContent()}
    </div>
  );
};

export default SugarcaneDashboard;
