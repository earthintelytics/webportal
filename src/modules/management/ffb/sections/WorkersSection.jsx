// UNUSED (2026-09-30): showed sample (invented) figures; no longer routed. Kept on purpose, not deleted — see docs/UNUSED_CODE.md before reusing or removing.
import React from 'react';
import { Users } from 'lucide-react';
import { SimpleCard, FilterBar, WorkerActivityTable } from '../../../../components/SharedComponents';

const WorkersSection = ({ harvesterData, columns }) => {
   return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
         <FilterBar filters={[{ label: 'Harvester Group' }, { label: 'Variance Type' }]} />
         <SimpleCard title="Harvester Activity & Presence" icon={<Users size={20} />}>
            <WorkerActivityTable data={harvesterData} columns={columns} />
         </SimpleCard>
      </div>
   );
};

export default WorkersSection;
