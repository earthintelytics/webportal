// UNUSED (2026-09-29): not imported anywhere in the running app. Kept on purpose, not deleted — see docs/UNUSED_CODE.md in the root repo before reusing or removing.
import React from 'react';
import { Shield, Search } from 'lucide-react';
import { SimpleCard, WorkerActivityTable } from '../../../../components/SharedComponents';

const PlotsSection = ({ plots, columns }) => {
  return (
    <div className="p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-y-auto h-full bg-gray-50/50">
       <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-6">
          <div>
             <h2 className="text-3xl font-black text-gray-900 tracking-tighter italic uppercase">Cluster Analytical Ledger</h2>
             <p className="text-[14px] text-gray-400 font-medium mt-1">Literature-validated remote sensing outputs aggregated per farm cluster</p>
          </div>
          <div className="flex gap-4">
             <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
                <Search size={16} className="text-gray-400" />
                <input type="text" placeholder="Search Cluster ID..." className="outline-none text-[12px] font-bold w-48" />
             </div>
          </div>
       </div>
       <SimpleCard title="Verified Cluster Data" icon={<Shield size={20} />}>
          <WorkerActivityTable data={plots} columns={columns} />
       </SimpleCard>
    </div>
  );
};

export default PlotsSection;
