import React from 'react';
import { MetricTile, SimpleCard } from '../../../components/SharedComponents';

const OverviewSection = () => {
  return (
    <div className="p-10 space-y-10 animate-in fade-in duration-500 overflow-y-auto h-full bg-gray-50/50">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricTile label="Registered Smallholders" value="1,240" unit="FARMERS" color="bg-emerald-600" />
        <MetricTile label="Active Clusters" value="42" unit="GROUPS" color="bg-blue-600" />
        <MetricTile label="Total Land Area" value="3,850" unit="HA" color="bg-emerald-700" />
        <MetricTile label="Yield Projection" value="12.4k" unit="MT" color="bg-blue-800" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <SimpleCard title="Cluster Distribution" subtitle="Farmer concentration across geographic regions">
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-100 rounded-3xl">
             <p className="text-gray-400 font-bold uppercase text-[11px] tracking-widest">Cluster Analytics Visualization</p>
          </div>
        </SimpleCard>
        <SimpleCard title="Onboarding Velocity" subtitle="New member registration trends">
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-100 rounded-3xl">
             <p className="text-gray-400 font-bold uppercase text-[11px] tracking-widest">Growth Trend Analysis</p>
          </div>
        </SimpleCard>
      </div>
    </div>
  );
};

export default OverviewSection;
