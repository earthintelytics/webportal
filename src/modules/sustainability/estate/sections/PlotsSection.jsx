// UNUSED (2026-09-29): not imported anywhere in the running app. Kept on purpose, not deleted — see docs/UNUSED_CODE.md in the root repo before reusing or removing.
import React from 'react';
import { Search, Shield } from 'lucide-react';
import { SimpleCard, WorkerActivityTable } from '../../../../components/SharedComponents';

const PlotsSection = ({ carbonData, columns }) => {
  return (
    <div className="p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-y-auto h-full bg-gray-50/50">
       <div className="flex justify-between items-end">
          <div>
             <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">Estate Carbon Inventory</h2>
             <p className="text-[14px] text-gray-400 font-medium">Granular carbon stock analysis per estate block</p>
          </div>
          <div className="flex gap-4">
             <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
                <Search size={16} className="text-gray-400" />
                <input type="text" placeholder="Search Estate ID..." className="outline-none text-[12px] font-bold w-48" />
             </div>
             <button className="bg-gray-900 text-white px-6 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-black transition-all shadow-lg">Report</button>
          </div>
       </div>
       <SimpleCard title="Interactive Estate Ledger" icon={<Shield size={20} />}>
          <WorkerActivityTable data={carbonData} columns={columns} />
       </SimpleCard>
    </div>
  );
};

export default PlotsSection;
