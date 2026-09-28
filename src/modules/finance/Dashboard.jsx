import React, { useState } from 'react';
import { 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  ShieldCheck, 
  History, 
  PieChart, 
  ChevronDown, 
  Search, 
  Filter, 
  Download,
  ArrowLeft,
  DollarSign,
  TrendingUp,
  Landmark,
  FileText,
  UserCheck,
  LogOut
} from 'lucide-react';

import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

import OverviewSection from './sections/OverviewSection';
import LedgerSection from './sections/LedgerSection';

const FinanceDashboard = ({ onSignOut }) => {
  const [activeSection, setActiveSection] = useState('overview');

  const stats = [
    { label: 'Portfolio Value', value: '₦4.2B', unit: 'NGN', color: 'bg-emerald-600', icon: <Landmark size={24} /> },
    { label: 'Worker Payouts', value: '₦182.4M', unit: 'NGN', color: 'bg-blue-600', icon: <UserCheck size={24} /> },
    { label: 'Ledger Accuracy', value: '99.9', unit: 'Ratio', color: 'bg-blue-800', icon: <ShieldCheck size={24} /> },
    { label: 'Pending Batches', value: '14', unit: 'UNITS', color: 'bg-amber-600', icon: <History size={24} /> },
  ];

  const barData = {
    labels: ['Oil Palm', 'Cashew', 'Rice', 'Cocoa', 'Maize', 'Rubber'],
    datasets: [{
      label: 'Revenue (Millions ₦)',
      data: [850, 420, 310, 680, 240, 190],
      backgroundColor: '#16A34A',
      borderRadius: 12,
    }]
  };

  const doughnutData = {
    labels: ['Estate Wages', 'Input Costs', 'Logistics', 'Tax/Levy'],
    datasets: [{
      data: [45, 25, 20, 10],
      backgroundColor: ['#16A34A', '#2563eb', '#F59E0B', '#94A3B8'],
      borderWidth: 0,
    }]
  };

  const transactions = [
    { id: 'TX-82910', p: 'Cluster B1 Settlement', t: 'Wages', a: '₦12.4M', s: 'Settled', date: 'MAY 01' },
    { id: 'TX-82911', p: 'Adebayo Olatunji', t: 'Bonus', a: '₦45.0k', s: 'Settled', date: 'MAY 01' },
    { id: 'TX-82912', p: 'Fertilizer #4 Batch', t: 'Input', a: '₦8.2M', s: 'Pending', date: 'MAY 02' },
    { id: 'TX-82913', p: 'Ogun Cooperatives', t: 'Yield', a: '₦15.2M', s: 'Settled', date: 'APR 28' },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'ledger':
        return <LedgerSection transactions={transactions} />;
      default:
        return (
          <OverviewSection 
            stats={stats} 
            barData={barData} 
            doughnutData={doughnutData} 
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans antialiased text-gray-900">
      <header className="bg-white border-b border-gray-100 px-8 py-5 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-gray-900 rounded-xl">
              <CreditCard size={20} className="text-emerald-500" />
            </div>
            <div>
              <h1 className="text-lg font-black uppercase tracking-tight text-black leading-none">Central Finance Hub</h1>
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400 mt-1">Multi-Crop Settlement Layer</p>
            </div>
          </div>
          <div className="flex gap-2 ml-8">
             {['overview', 'ledger'].map(tab => (
                <button 
                  key={tab} 
                  onClick={() => setActiveSection(tab)}
                  className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeSection === tab ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:bg-gray-100'}`}
                >
                  {tab}
                </button>
             ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={onSignOut} className="flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-50 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all">
             <LogOut size={14} /> Sign Out
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        {renderContent()}
      </main>

      <footer className="mt-auto py-8 border-t border-gray-100 flex flex-col items-center">
         <div className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-200">Powered by Farmintelytics · Secure Settlement Node</div>
      </footer>
    </div>
  );
};

export default FinanceDashboard;
