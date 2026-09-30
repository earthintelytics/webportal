// UNUSED (2026-09-30): showed sample (invented) figures; no longer routed. Kept on purpose, not deleted — see docs/UNUSED_CODE.md before reusing or removing.
import React, { useState } from 'react';
import { 
  Download,
  Calendar,
  User,
  Target,
  ChevronLeft,
  Grid,
  LayoutDashboard,
  Users,
  Map as MapIcon,
  Leaf
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
import { Line, Radar, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  RadialLinearScale
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  RadialLinearScale
);

import OverviewSection from './sections/OverviewSection';
import WorkforceSection from './sections/WorkforceSection';
import GeospatialSection from './sections/GeospatialSection';
import SustainabilitySection from './sections/SustainabilitySection';

const CashewDashboard = ({ activeSection, onBack }) => {
  const [activeLayer, setActiveLayer] = useState('plots');

  const carbonData = [
    { id: 'FOR-CAS-01', area: 'Forestry Reserve', type: 'High Density', carbonStock: '124,200 tCO2e', health: '98%', status: 'Verified' },
    { id: 'EST-CAS-09', area: 'Main Estate Cluster', type: 'Industrial', carbonStock: '185,400 tCO2e', health: '95%', status: 'Verified' },
  ];

  const workerData = [
    { id: 'W-092', name: 'Samuel Obi', task: 'Pruning', plot: 'Block A-12', output: '42 Trees', status: 'In Progress', location: { lat: 6.5244, lng: 3.3792 }, evidence: '' },
    { id: 'W-045', name: 'Grace John', task: 'Harvesting', plot: 'Block B-04', output: '1.2 MT RCN', status: 'Completed', location: { lat: 6.5201, lng: 3.3812 }, evidence: '' },
  ];

  const columns = [
    { key: 'evidence', label: 'Field Evidence', render: (val) => <EvidenceThumbnail src={val} /> },
    { key: 'id', label: 'Worker ID' },
    { key: 'name', label: 'Name' },
    { key: 'task', label: 'Operation' },
    { key: 'output', label: 'Work Output', render: (val) => <span className="text-[13px] font-bold text-gray-900">{val}</span> },
    { key: 'location', label: 'Field GPS', render: (val) => <LocationBadge lat={val.lat} lng={val.lng} /> },
    { key: 'status', label: 'Status' },
  ];

  const carbonColumns = [
    { key: 'area', label: 'Carbon Project Area' },
    { key: 'type', label: 'Classification' },
    { key: 'carbonStock', label: 'Est. Carbon Stock', render: (val) => <span className="text-[13px] font-bold text-emerald-600">{val}</span> },
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
        return <WorkforceSection workerData={workerData} columns={columns} />;
      default:
        return <OverviewSection workerData={workerData} />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 text-gray-900 overflow-hidden font-sans antialiased">
       <main className="flex-1 flex flex-col relative overflow-hidden bg-gray-50">
          <div className="p-8">
             <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div>
                   <h1 className="text-3xl font-black text-gray-900 tracking-tighter capitalize">{(activeSection || 'dashboard').replace(/-/g, ' ')}</h1>
                   <p className="text-[14px] text-gray-500 mt-1 font-medium italic">Cashew Intelligence Console · Rivers Cluster Estate</p>
                </div>
             </div>
             {renderContent()}
          </div>
       </main>
    </div>
  );
};

export default CashewDashboard;
