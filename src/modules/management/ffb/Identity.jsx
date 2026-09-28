import React from 'react';
import { 
  Users, 
  CheckCircle2, 
  AlertOctagon, 
  Activity, 
  Search, 
  Filter, 
  Plus,
  ArrowUpRight,
  ShieldAlert
} from 'lucide-react';

const KPICard = ({ icon, label, value, delta, deltaType, valueColor }) => (
  <div className="bg-white dark:bg-white/5 p-4 rounded-xl border border-black/5 dark:border-white/5 relative">
    <div className="absolute top-3 right-3 text-gray-300 dark:text-white/10">{icon}</div>
    <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">{label}</div>
    <div className={`text-2xl font-bold ${valueColor || 'text-gray-900 dark:text-white'}`}>{value}</div>
    <div className={`text-[10.5px] mt-1 font-medium flex items-center gap-1 ${
      deltaType === 'up' ? 'text-green-600' : deltaType === 'down' ? 'text-red-600' : 'text-gray-500'
    }`}>
      {delta}
    </div>
  </div>
);

const Identity = () => {
  const workers = [
    { name: 'Adamu Obi', id: 'FI-W001', block: 'F3', biometric: 'Verified', kyc: 'Complete', lastSeen: 'Today 07:12', status: 'Active', initials: 'AO' },
    { name: 'Emeka Musa', id: 'FI-W002', block: 'C3', biometric: 'Verified', kyc: 'Complete', lastSeen: 'Today 06:58', status: 'Active', initials: 'EM' },
    { name: 'Chisom Kalu', id: 'FI-W003', block: 'D2', biometric: 'Pending', kyc: 'Missing docs', lastSeen: 'Yesterday', status: 'Offline', initials: 'CK' },
    { name: 'Fatima Taiwo', id: 'FI-W004', block: 'B1', biometric: 'Flagged', kyc: 'Complete', lastSeen: 'Today 08:34', status: 'Review', initials: 'FT', flagged: true },
    { name: 'Yusuf Umeh', id: 'FI-W005', block: 'A2', biometric: 'Verified', kyc: 'Complete', lastSeen: 'Today 07:45', status: 'Active', initials: 'YU' },
  ];

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={<Users size={18}/>} label="Total Enrolled" value="1,247" delta="↑ 23 this week" deltaType="up" />
        <KPICard icon={<CheckCircle2 size={18}/>} label="KYC Complete" value="94.2%" delta="74 pending docs" />
        <KPICard icon={<ShieldAlert size={18}/>} label="Dedup Rejections" value="7" delta="This month" valueColor="text-red-600" />
        <KPICard icon={<Activity size={18}/>} label="Active Sessions" value="47" delta="Right now" deltaType="up" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-white/5 p-5 rounded-xl border border-black/5 dark:border-white/5">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Users size={16} className="text-[#1A7A4A]" />
              Worker Registry
            </h3>
            <div className="flex gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search workers..." 
                  className="w-full bg-gray-50 dark:bg-black/20 border border-black/5 dark:border-white/5 rounded-lg py-1.5 pl-9 pr-4 text-[12px] focus:outline-none focus:ring-1 focus:ring-[#1A7A4A]"
                />
              </div>
              <button className="p-2 bg-gray-100 dark:bg-white/5 rounded-lg border border-black/5 dark:border-white/5 hover:bg-gray-200 transition-colors">
                <Filter size={14} />
              </button>
              <button className="flex items-center gap-2 bg-[#1A7A4A] text-white px-3 py-1.5 rounded-lg text-[12px] font-medium hover:bg-[#145C37] transition-colors shadow-sm">
                <Plus size={14} />
                Enroll
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12px]">
              <thead>
                <tr className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-black/5 dark:border-white/5">
                  <th className="py-3 px-2">Worker</th>
                  <th className="py-3 px-2">Block</th>
                  <th className="py-3 px-2">Biometric</th>
                  <th className="py-3 px-2">KYC</th>
                  <th className="py-3 px-2">Last Seen</th>
                  <th className="py-3 px-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5">
                {workers.map((worker, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[11px] ${
                          worker.flagged ? 'bg-red-100 text-red-600' : 'bg-green-100 text-[#1A7A4A]'
                        }`}>
                          {worker.initials}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 dark:text-gray-100">{worker.name}</div>
                          <div className="text-[11px] text-gray-500">{worker.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2 font-medium">{worker.block}</td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        worker.biometric === 'Verified' ? 'bg-green-100 text-green-700 dark:bg-green-900/30' :
                        worker.biometric === 'Flagged' ? 'bg-red-100 text-red-700 dark:bg-red-900/30' :
                        'bg-amber-100 text-amber-700 dark:bg-amber-900/30'
                      }`}>
                        {worker.biometric === 'Verified' ? '✓ ' : ''}{worker.biometric}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        worker.kyc === 'Complete' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30' : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30'
                      }`}>
                        {worker.kyc}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-gray-500">{worker.lastSeen}</td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          worker.status === 'Active' ? 'bg-status-good' :
                          worker.status === 'Review' ? 'bg-red-500' : 'bg-gray-400'
                        }`}></span>
                        <span className="font-medium">{worker.status}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 flex gap-2">
            <button className="text-[11px] font-medium text-[#1A7A4A] hover:underline px-2 py-1">Export CSV</button>
            <button className="text-[11px] font-medium text-[#1A7A4A] hover:underline px-2 py-1">Bulk Import</button>
            <button className="text-[11px] font-medium text-[#1A7A4A] hover:underline px-2 py-1">Print ID Cards</button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-white/5 p-5 rounded-xl border border-black/5 dark:border-white/5">
            <h3 className="text-sm font-bold flex items-center gap-2 mb-4 text-red-600">
              <AlertOctagon size={16} />
              Duplicate Alert Queue
            </h3>
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 p-4 rounded-xl">
              <div className="text-[12px] font-bold text-red-600 mb-3">Ghost Worker Attempt — Block C3</div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-white dark:bg-black/20 p-2.5 rounded-lg border border-black/5">
                  <div className="text-[11px] font-bold text-gray-500 uppercase mb-1">Existing</div>
                  <div className="text-[11px] font-bold truncate">Worker #C3-0024</div>
                  <div className="text-[11px] text-gray-500">Block F3 · Verified</div>
                </div>
                <div className="bg-white dark:bg-black/20 p-2.5 rounded-lg border border-black/5">
                  <div className="text-[11px] font-bold text-red-500 uppercase mb-1">New Attempt</div>
                  <div className="text-[11px] font-bold truncate">Worker #C3-0089</div>
                  <div className="text-[11px] text-red-500">AFIS Score: 0.94</div>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 bg-red-600 text-white text-[11px] font-bold py-1.5 rounded-lg hover:bg-red-700 transition-colors">Reject</button>
                <button className="flex-1 bg-white dark:bg-white/5 text-gray-700 dark:text-gray-300 text-[11px] font-bold py-1.5 rounded-lg border border-black/5 hover:bg-gray-50 transition-colors">Investigate</button>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-white/5 p-5 rounded-xl border border-black/5 dark:border-white/5">
             <h3 className="text-sm font-bold flex items-center gap-2 mb-4">
              <Activity size={16} className="text-[#1A7A4A]" />
              Enrollment Analytics
            </h3>
            <div className="h-32 bg-gray-50 dark:bg-black/20 rounded-lg border border-dashed border-gray-300 dark:border-white/10 flex items-center justify-center text-gray-400 text-[11px]">
               [ Enrollment Trend Graph ]
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between items-center text-[11px] py-1.5 border-b border-black/5 dark:border-white/5">
                <span className="text-gray-500">AFIS threshold</span>
                <span className="font-bold">FMR &lt; 0.001%</span>
              </div>
              <div className="flex justify-between items-center text-[11px] py-1.5 border-b border-black/5 dark:border-white/5">
                <span className="text-gray-500">Liveness score</span>
                <span className="font-bold">&gt; 0.75</span>
              </div>
              <div className="flex justify-between items-center text-[11px] py-1.5">
                <span className="text-gray-500">Biometric SDK</span>
                <span className="font-bold">Neurotech AFIS</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Identity;
