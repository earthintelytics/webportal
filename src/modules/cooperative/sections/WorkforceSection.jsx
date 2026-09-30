// UNUSED (2026-09-30): showed sample (invented) figures; no longer routed. Kept on purpose, not deleted — see docs/UNUSED_CODE.md before reusing or removing.
import React from 'react';
import { FilterBar, SimpleCard, WorkerActivityTable } from '../../../components/SharedComponents';

const WorkforceSection = () => {
  const memberData = [
    { id: 'M-101', name: 'John Doe', role: 'Lead Farmer', activity: 'Training', timestamp: '2h ago', status: 'Active' },
    { id: 'M-102', name: 'Jane Smith', role: 'Field Agent', activity: 'Mapping', timestamp: '5h ago', status: 'Field' },
  ];

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Member Name' },
    { key: 'role', label: 'Designation' },
    { key: 'activity', label: 'Activity' },
    { key: 'status', label: 'Status' },
  ];

  return (
    <div className="p-10 space-y-8 animate-in fade-in duration-500 overflow-y-auto h-full bg-gray-50/50">
      <FilterBar />
      <SimpleCard title="Cooperative Registry" subtitle="Active members and field orchestration data">
        <WorkerActivityTable data={memberData} columns={columns} />
      </SimpleCard>
    </div>
  );
};

export default WorkforceSection;
