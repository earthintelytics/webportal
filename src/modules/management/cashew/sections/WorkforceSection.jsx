// UNUSED (2026-09-30): showed sample (invented) figures; no longer routed. Kept on purpose, not deleted — see docs/UNUSED_CODE.md before reusing or removing.
import React from 'react';
import { Users } from 'lucide-react';
import { SimpleCard, FilterBar, WorkerActivityTable } from '../../../../components/SharedComponents';

const WorkforceSection = ({ workerData, columns }) => {
  return (
    <div className="p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-y-auto h-full bg-gray-50/50">
      <FilterBar filters={[{ label: 'Task Category' }, { label: 'Plot Zone' }]} />
      <SimpleCard title="Worker Management Ledger" icon={<Users size={20} />}>
        <WorkerActivityTable data={workerData} columns={columns} />
      </SimpleCard>
    </div>
  );
};

export default WorkforceSection;
