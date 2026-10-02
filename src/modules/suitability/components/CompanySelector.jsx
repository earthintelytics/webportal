import React from 'react';
import { Building2, Plus, ChevronDown, Check } from 'lucide-react';

const CompanySelector = ({ companies, selectedCompanyId, onSelectCompany, onTriggerOnboarding }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const currentCompany = companies.find(c => c.company_id === selectedCompanyId) || companies[0];

  return (
    <div className="relative flex items-center gap-3">
      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider hidden sm:inline">Organisation:</span>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2.5 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-xs hover:border-emerald-500 transition-all font-medium text-sm text-slate-800"
        >
          <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
            <Building2 size={14} />
          </div>
          <span>{currentCompany?.company_name || 'Select Organisation'}</span>
          <ChevronDown size={14} className="text-slate-400 ml-1" />
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setIsOpen(false)} />
            <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 py-2">
              <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                Onboarded Organisations
              </div>
              <div className="max-h-60 overflow-y-auto px-1">
                {companies.map((comp) => {
                  const isSelected = comp.company_id === selectedCompanyId;
                  return (
                    <button
                      key={comp.company_id}
                      onClick={() => {
                        onSelectCompany(comp.company_id);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-left transition-colors ${
                        isSelected ? 'bg-emerald-50 text-emerald-800' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <div className="font-semibold text-slate-800">{comp.company_name}</div>
                        <div className="text-[11px] text-slate-400">{comp.country} • {comp.estates?.[0]?.name || 'Estate'}</div>
                      </div>
                      {isSelected && <Check size={14} className="text-emerald-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              <div className="border-t border-slate-100 mt-2 pt-1 px-1">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onTriggerOnboarding();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
                >
                  <Plus size={14} />
                  <span>Onboard New Organisation</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CompanySelector;
