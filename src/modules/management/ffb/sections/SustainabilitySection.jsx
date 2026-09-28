import React from 'react';
import { Globe, BarChart4, Wind, Activity } from 'lucide-react';
import { MetricTile, SimpleCard, GeospatialPreview, WorkerActivityTable } from '../../../../components/SharedComponents';

const SustainabilitySection = ({ carbonData, carbonColumns }) => {
   return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricTile label="Total Sequestered" value="555k" unit="tCO2e" color="bg-green-600" />
            <MetricTile label="High-Carbon Stocks" value="312" unit="kT" color="bg-green-600" />
            <MetricTile label="POME Capture" value="98" unit="%" color="bg-green-600" />
            <MetricTile label="RSPO Compliance" value="100" unit="%" color="bg-emerald-500" />
         </div>
         <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:w-2/3 space-y-6">
               <SimpleCard title="Conservation Monitoring" icon={<Globe size={20} />}>
                  <div className="h-[400px] relative">
                     <GeospatialPreview title="Oil Palm Biomass Intel" points={[]} full={true} />
                  </div>
               </SimpleCard>
               <SimpleCard title="Carbon Inventory" icon={<BarChart4 size={20} />}>
                  <WorkerActivityTable data={carbonData} columns={carbonColumns} />
               </SimpleCard>
            </div>
            <div className="lg:w-1/3 space-y-6">
               <SimpleCard title="Effluent Management" icon={<Wind size={20} />}>
                  <div className="p-8 text-center bg-emerald-50/50 rounded-3xl border border-emerald-100">
                     <div className="text-5xl font-black text-emerald-600 mb-2">98.2<span className="text-xl">%</span></div>
                     <div className="text-[11px] font-black text-emerald-700 uppercase tracking-widest">Biogas Capture Efficiency</div>
                  </div>
               </SimpleCard>
            </div>
         </div>
      </div>
   );
};

export default SustainabilitySection;
