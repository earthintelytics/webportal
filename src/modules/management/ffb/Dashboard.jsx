// UNUSED (2026-09-30): showed sample (invented) figures; no longer routed. Kept on purpose, not deleted — see docs/UNUSED_CODE.md before reusing or removing.
import React, { useState } from 'react';
import {
   Package,
   Users,
   Map as MapIcon,
   Zap,
   Activity,
   BarChart4,
   Layers,
   Box,
   Droplets,
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
import WorkersSection from './sections/WorkersSection';
import OverviewSection from './sections/OverviewSection';

const FFBDashboard = ({ activeSection }) => {
   const [activeLayer, setActiveLayer] = useState('plots');

   const carbonData = [
      { id: 'FOR-FFB-01', area: 'Palm Reserve South', type: 'Primary Forest', carbonStock: '312,400 tCO2e', health: '99%', status: 'Verified' },
      { id: 'EST-FFB-09', area: 'Sector A-Block 1', type: 'Industrial Oil Palm', carbonStock: '242,800 tCO2e', health: '95%', status: 'Active' },
   ];

   const harvesterData = [
      { id: 'H-201', name: 'John Musa', plot: 'Block A-1', manualCount: '124', aiCount: '128', variance: '+4', status: 'Verified', location: { lat: 6.5444, lng: 3.3992 }, evidence: '' },
      { id: 'H-188', name: 'Alice Peters', plot: 'Block A-7', manualCount: '86', aiCount: '85', variance: '-1', status: 'Verified', location: { lat: 6.5401, lng: 3.3912 }, evidence: '' },
   ];

   const columns = [
      { key: 'evidence', label: 'Field Evidence', render: (val) => <EvidenceThumbnail src={val} /> },
      { key: 'id', label: 'Harvester ID' },
      { key: 'name', label: 'Name' },
      { key: 'plot', label: 'Plot' },
      { key: 'manualCount', label: 'Manual Count' },
      { key: 'aiCount', label: 'AI Detection', render: (val) => <span className="text-green-600 font-bold">{val}</span> },
      { key: 'location', label: 'GPS Coordinates', render: (val) => <LocationBadge lat={val.lat} lng={val.lng} /> },
      { key: 'status', label: 'Status' },
   ];

   const carbonColumns = [
      { key: 'area', label: 'Carbon Project Area' },
      { key: 'type', label: 'Classification' },
      { key: 'carbonStock', label: 'Est. Carbon Stock', render: (val) => <span className="text-[13px] font-black text-green-600">{val}</span> },
      { key: 'health', label: 'Biomass Health', render: (val) => <span className="text-green-500 font-bold">{val}</span> },
      { key: 'status', label: 'MRV Status' },
   ];

   const renderContent = () => {
      switch (activeSection) {
         case 'sustainability':
            return <SustainabilitySection carbonData={carbonData} carbonColumns={carbonColumns} />;
         case 'geospatial':
            return <GeospatialSection activeLayer={activeLayer} setActiveLayer={setActiveLayer} />;
         case 'workers':
            return <WorkersSection harvesterData={harvesterData} columns={columns} />;
         default:
            return <OverviewSection />;
      }
   };

   return (
      <div className="p-8 space-y-8 max-w-[1700px] mx-auto">
         <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
               <h1 className="text-3xl font-black text-gray-900 tracking-tighter capitalize">{(activeSection || 'dashboard').replace(/-/g, ' ')}</h1>
               <p className="text-[14px] text-gray-500 mt-1 font-medium italic">FFB Intelligence Console · Oil Palm Management</p>
            </div>
         </div>
         {renderContent()}
      </div>
   );
};

export default FFBDashboard;
