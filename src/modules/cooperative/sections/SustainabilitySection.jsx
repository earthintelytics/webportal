// UNUSED (2026-09-30): showed sample (invented) figures; no longer routed. Kept on purpose, not deleted — see docs/UNUSED_CODE.md before reusing or removing.
import React from 'react';
import { MetricTile, SimpleCard, GeospatialPreview, WorkerActivityTable } from '../../../components/SharedComponents';

const SustainabilitySection = () => {
  const complianceData = [
    { id: 'C-001', area: 'Plot 12', carbonStock: 'Verified', health: '98%', landUse: 'Primary', status: 'Compliant' },
    { id: 'C-002', area: 'Plot 45', carbonStock: 'Pending', health: '92%', landUse: 'Agro', status: 'Audit' },
  ];

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'area', label: 'Plot' },
    { key: 'landUse', label: 'Type' },
    { key: 'carbonStock', label: 'MRV' },
    { key: 'status', label: 'Status' },
  ];

  return (
    <div className="p-10 space-y-10 animate-in fade-in duration-500 overflow-y-auto h-full bg-gray-50/50">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <MetricTile label="Group Carbon Verification" value="85" unit="%" color="bg-emerald-600" />
        <MetricTile label="Environmental Score" value="A+" unit="GRADE" color="bg-emerald-500" />
        <MetricTile label="Compliance Alerts" value="0" unit="ISSUES" color="bg-emerald-700" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <SimpleCard title="MRV Spatial Coverage" icon={<GeospatialPreview />}>
          <div className="h-80 rounded-3xl overflow-hidden">
             <GeospatialPreview title="Group Carbon Map" points={[]} full={true} />
          </div>
        </SimpleCard>
        <SimpleCard title="Compliance Ledger">
          <WorkerActivityTable data={complianceData} columns={columns} />
        </SimpleCard>
      </div>
    </div>
  );
};

export default SustainabilitySection;
