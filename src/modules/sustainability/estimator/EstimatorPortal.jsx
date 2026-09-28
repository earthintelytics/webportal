import React, { useState, useEffect } from 'react';
import SustainabilityPortal from '../SustainabilityPortal';
import { 
  Calculator, 
  TrendingUp, 
  Download,
  Settings,
  History,
  Play,
  Database
} from 'lucide-react';
import { calculateStockIPCC, estimateSequestrationRate, CARBON_FRACTION } from '../utils/carbonModels';
import {
  HUDPanel,
  LayerSwitcher,
  TimelineSlider,
  FloatingMetric,
  GISSidebar,
  TabPlaceholder
} from '../shared/GISComponents';

const EstimatorPortal = (props) => {
  const [inputs, setInputs] = useState({
    area: 50,
    category: 'FOREST',
    subCategory: 'TROPICAL_MOIST',
    practice: 'STANDARD',
    years: 10
  });

  const [results, setResults] = useState({
    currentStock: 0,
    projectedSequestration: 0,
    totalAtEnd: 0
  });

  const [currentYear, setCurrentYear] = useState(2026);

  useEffect(() => {
    const stock = calculateStockIPCC(inputs.area, inputs.category, inputs.subCategory);
    const rate = estimateSequestrationRate(inputs.category, 5, inputs.practice);
    const projected = inputs.area * rate * inputs.years;
    
    setResults({
      currentStock: stock,
      projectedSequestration: projected,
      totalAtEnd: stock + projected
    });
  }, [inputs]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputs(prev => ({ ...prev, [name]: name === 'area' || name === 'years' ? Number(value) : value }));
  };

  const sidebarItems = [
    { id: 'overview', label: 'Estimator Tool', icon: <Calculator size={18}/> },
    { id: 'scenarios', label: 'Saved Scenarios', icon: <History size={18}/> },
  ];

  return (
    <SustainabilityPortal 
      {...props} 
      title="Analytical Estimator" 
      type="Simulation"
      sidebarItems={sidebarItems}
    >
      {(activeTab) => activeTab === 'scenarios' ? (
        <TabPlaceholder icon={<History size={22} />} label="Saved Scenarios" />
      ) : (
        <div className="w-full h-full relative pointer-events-none">
          {/* Floating HUD Elements */}
          <TimelineSlider currentYear={currentYear} onChange={setCurrentYear} />

          <div className="absolute right-8 top-32 z-[1050] pointer-events-auto flex flex-col gap-6">
            <GISSidebar title="Simulator Controls" icon={<Settings size={18} />}>
               <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Target Area (HA)</label>
                    <input 
                      type="number" 
                      name="area"
                      value={inputs.area}
                      onChange={handleChange}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-black text-[13px] text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Ecosystem Class</label>
                    <select 
                      name="category"
                      value={inputs.category}
                      onChange={handleChange}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-black text-[13px] text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                      <option value="FOREST" className="bg-gray-900">Forest Land</option>
                      <option value="CROPLAND" className="bg-gray-900">Cropland</option>
                      <option value="GRASSLAND" className="bg-gray-900">Grassland</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Management Protocol</label>
                    <select 
                      name="practice"
                      value={inputs.practice}
                      onChange={handleChange}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-black text-[13px] text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                      <option value="STANDARD" className="bg-gray-900">Standard Practice</option>
                      <option value="REGENERATIVE" className="bg-gray-900">Regenerative (+25%)</option>
                      <option value="LOW_INPUT" className="bg-gray-900">Low Input (-10%)</option>
                    </select>
                  </div>

                  <div className="pt-4">
                     <button className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-3">
                        <Play size={16} fill="currentColor" /> Run Simulation
                     </button>
                  </div>
               </div>
            </GISSidebar>
          </div>

          <div className="absolute left-8 bottom-32 z-[1050] pointer-events-auto">
             <div className="flex flex-col gap-6">
                <FloatingMetric label="Baseline Stock" value={Math.round(results.currentStock).toLocaleString()} unit="tCO2e" icon={<Database size={16}/>} />
                <div className="gis-glass p-8 rounded-[2rem] w-80">
                   <div className="flex items-center justify-between mb-6">
                      <span className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.2em]">Projection Outcome</span>
                      <Download size={14} className="text-gray-500" />
                   </div>
                   <h3 className="text-4xl font-black text-white tracking-tighter">
                      {Math.round(results.totalAtEnd).toLocaleString()} <span className="text-lg text-gray-500">t</span>
                   </h3>
                   <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest mt-2">Total Carbon in {inputs.years} Years</p>
                   
                   <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
                      <div className="flex justify-between">
                         <span className="text-[11px] font-bold text-gray-400 uppercase">Annual Gain</span>
                         <span className="text-[12px] font-black text-emerald-500">+{Math.round(results.projectedSequestration / inputs.years).toLocaleString()} t/yr</span>
                      </div>
                      <div className="flex justify-between">
                         <span className="text-[11px] font-bold text-gray-400 uppercase">Carbon Fraction</span>
                         <span className="text-[12px] font-black text-white">{CARBON_FRACTION}</span>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}
    </SustainabilityPortal>
  );
};


export default EstimatorPortal;
