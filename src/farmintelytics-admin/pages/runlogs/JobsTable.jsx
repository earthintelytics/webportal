import { Fragment, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Table, Td, Pill, Empty } from '../../components/ui';
import ErrorBox from './ErrorBox';
import { statusOf, fmtTime } from './logHelpers';

/** Imagery jobs recorded in the database, with details on click. */
const JobsTable = ({ jobs }) => {
  const [open, setOpen] = useState(null);
  if (!jobs.length) return <Empty>No jobs recorded. Jobs appear when imagery is processed for a block.</Empty>;
  return (
    <Table columns={[{ label: 'Job' }, { label: 'Block' }, { label: 'Status' }, { label: 'For date' }, { label: 'Finished' }, { label: 'Result' }, { label: '', className: 'w-10' }]}>
      {jobs.map((job) => {
        const failed = (job.status || '').toLowerCase() === 'failed' || !!job.error;
        const [label, tone] = statusOf(job.status);
        const isOpen = open === job.id;
        return (
          <Fragment key={job.id}>
            <tr onClick={() => setOpen(isOpen ? null : job.id)} className={`cursor-pointer ${failed ? 'bg-red-50/40 hover:bg-red-50' : 'hover:bg-gray-50'}`}>
              <Td className="font-mono text-xs text-gray-500">#{job.id}</Td>
              <Td className="font-semibold text-gray-900">{job.plot_id ? `Block ${job.plot_id}` : '—'}</Td>
              <Td><Pill tone={tone}>{label}</Pill></Td>
              <Td className="text-gray-600">{job.start_date || '—'}</Td>
              <Td className="text-xs text-gray-600">{fmtTime(job.completed_at)}</Td>
              <Td className="max-w-sm">{failed ? <ErrorBox error={job.error} compact /> : <span className="text-sm text-green-800">Processed</span>}</Td>
              <Td className="text-gray-400">{isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}</Td>
            </tr>
            {isOpen && (
              <tr>
                <td colSpan={7} className="px-5 py-4 bg-gray-50 space-y-3">
                  <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[['Created', fmtTime(job.created_at)], ['Finished', fmtTime(job.completed_at)], ['Imagery', job.sensor || '—'], ['Dates', `${job.start_date || '—'} to ${job.end_date || '—'}`]].map(([k, v]) => (
                      <div key={k}><dt className="text-xs text-gray-500">{k}</dt><dd className="text-sm text-gray-900 mt-0.5">{v}</dd></div>
                    ))}
                  </dl>
                  {job.error && <ErrorBox error={job.error} />}
                </td>
              </tr>
            )}
          </Fragment>
        );
      })}
    </Table>
  );
};

export default JobsTable;
