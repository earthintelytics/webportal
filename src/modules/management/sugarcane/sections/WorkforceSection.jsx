// UNUSED (2026-09-30): showed sample (invented) figures; no longer routed. Kept on purpose, not deleted — see docs/UNUSED_CODE.md before reusing or removing.
import React from 'react';
import { Users } from 'lucide-react';
import { FilterBar, SimpleCard, WorkerActivityTable } from '../../../../components/SharedComponents';

const WorkforceSection = ({ data, columns }) => {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-y-auto h-full bg-gray-50/50 p-10">
       <FilterBar filters={[{ label: 'Operator Type' }, { label: 'Mill Queue' }]} />
       <SimpleCard title="Operator Activity & Presence" icon={<Users size={20} />}>
          <WorkerActivityTable data={data} columns={columns} />
       </SimpleCard>
    </div>
  );
};

export default WorkforceSection;
