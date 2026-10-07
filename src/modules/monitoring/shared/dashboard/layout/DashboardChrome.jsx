/**
 * The dashboard frame: header (service, header tabs, notifications, account) and the sidebar of pages and tools.
 * Moved out of CropDashboardLayout.jsx unchanged: each function receives the
 * layout's state and helpers it uses as `ctx`.
 */
import { Satellite, Map as MapIcon, Activity, Droplets, ArrowLeft, LogOut, TrendingUp, LayoutDashboard, Calendar as CalendarIcon, Shield, Bell, Info, FileText, Settings2, SlidersHorizontal, CloudRain, Leaf, Sparkles, AlertTriangle, Columns } from 'lucide-react';
import { Upload as UploadIcon, MapPin as EstateIcon } from 'lucide-react';
import { ShieldCheck as CheckIcon, Lightbulb as AdviceIcon } from 'lucide-react';
import { Table2 as RegisterIcon, Users as MembersIcon, FileText as FormsIcon, Inbox as AnswersIcon, Leaf as CarbonIcon, BadgeCheck as PassportIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { paths } from '../../../../../routes/paths';

export function renderDashboardHeader(ctx) {
  const { activeTab, alerts, cropLabel, estateOptions, filterEstate, handleEstateChange, handleTopNavTabClick, onBack, onSignOut, pick, profileEmail, profileInitials, profileName, profileRole, service, setShowNotifications, setShowUserMenu, showNotifications, showUserMenu, tenant, tenantDisplayName, userMenuRef } = ctx;
  return (
<header className="h-[72px] bg-white border-b border-gray-100 flex items-center justify-between px-8 z-[100] shadow-sm shrink-0">

        {/* Brand */}
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-xl transition-all border border-gray-200 text-gray-500 hover:text-gray-800">
            <ArrowLeft size={17} />
          </button>
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-green-700">
              <Satellite className="text-white" size={21} />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-gray-900 leading-none flex items-center gap-1.5">
                {service ? service.title : `${cropLabel} monitoring`}
              </h1>
              <p className="text-xs font-medium mt-1 leading-none text-gray-500">
                {tenantDisplayName}
              </p>
            </div>
          </div>
          {estateOptions.length >= 2 && (
            <label className="flex items-center gap-2 pl-4 ml-1 border-l border-gray-200">
              <EstateIcon size={16} className="text-green-600" />
              <span className="sr-only">Estate</span>
              <select
                value={estateOptions.includes(filterEstate) ? filterEstate : 'All'}
                onChange={e => handleEstateChange(e.target.value)}
                className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-800 hover:border-gray-300 outline-none cursor-pointer"
                aria-label="Estate"
              >
                <option value="All">All estates ({estateOptions.length})</option>
                {estateOptions.map(name => <option key={name} value={name}>{name}</option>)}
              </select>
            </label>
          )}
        </div>

        {/* ── TOP TABS ── */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
          {pick([
            { id: 'monitor',      label: 'Monitor',      icon: <Activity size={15} /> },
            { id: 'reports',      label: 'Reports',      icon: <FileText size={15} /> },
            { id: 'verification', label: 'Verification', icon: <Shield size={15} /> },
            { id: 'ai-assistant', label: 'Assistant', icon: <Sparkles size={15} /> }
          ], service?.topTabs).map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTopNavTabClick(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-green-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-white/50'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* User area */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <button 
              onClick={() => { setShowNotifications(n => !n); setShowUserMenu(false); }}
              className={`p-2.5 rounded-xl transition-all border relative ${showNotifications ? 'bg-green-50 text-green-700 border-green-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-800'}`}
            >
              <Bell size={17} />
              {alerts.filter(a => a.status === 'Active').length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full border-2 border-white" style={{ backgroundColor: '#EF4444' }}></span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl z-[500] overflow-hidden">
                <div className="px-4 py-3.5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <div className="text-xs font-bold text-gray-700">Live alerts feed</div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${'bg-green-50 text-green-700'}`}>
                    {alerts.filter(a => a.status === 'Active').length} Active
                  </span>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
                  {/* Real alerts from the backend feed — no canned notifications */}
                  {alerts.slice(0, 6).map(a => (
                    <div key={a.id} className="p-3 hover:bg-gray-50 transition-colors flex gap-2.5">
                      <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${a.severity === 'Critical' ? 'bg-status-critical' : a.severity === 'Warning' ? 'bg-status-warning' : 'bg-status-good'}`} />
                      <div>
                        <div className="text-[11px] font-bold text-gray-900">{a.category} — {a.plot}</div>
                        <div className="text-[11px] text-gray-600 mt-0.5">{a.desc}</div>
                        <div className="text-[11px] text-gray-500 mt-0.5">{a.date} {a.time}</div>
                      </div>
                    </div>
                  ))}
                  {alerts.length === 0 && (
                    <div className="p-5 text-center">
                      <div className="text-[11px] font-bold text-gray-500">No active alerts</div>
                      <div className="text-[11px] text-gray-600 mt-0.5">Alerts from the monitoring pipeline appear here.</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="w-px h-8 bg-gray-200"></div>
          {/* Clickable user avatar with sign-out dropdown */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => { setShowUserMenu(s => !s); setShowNotifications(false); }}
              className="flex items-center gap-3 hover:opacity-80 transition-all"
            >
              <div className="text-right">
                <div className="text-sm font-bold text-gray-900 leading-none">{profileName}</div>
                <div className="text-xs font-medium mt-1 text-gray-500">{profileRole}</div>
              </div>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center font-semibold text-sm border text-green-800 border-green-200 bg-green-50">
                {profileInitials}
              </div>
            </button>
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2.5 w-64 bg-white border border-gray-200 rounded-2xl shadow-xl z-[500] overflow-hidden">
                <div className="p-4 bg-gray-50/50 flex flex-col items-center text-center border-b border-gray-100">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-semibold text-white text-lg mb-2.5 bg-green-700">
                    {profileInitials}
                  </div>
                  <div className="text-sm font-semibold text-gray-950">{profileName}</div>
                  <div className="text-[11px] font-semibold text-gray-600 mt-0.5">{profileEmail}</div>
                  <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full mt-2 border bg-green-50 text-green-800 border-green-200`}>
                    {profileRole}
                  </span>
                </div>
                <div className="p-1.5 space-y-0.5">
                  {tenant && (
                    <Link
                      to={paths.orgSettings(tenant)}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 rounded-xl"
                    >
                      <Settings2 size={15} className="text-gray-500" />
                      Settings
                    </Link>
                  )}
                  <button
                    onClick={() => { setShowUserMenu(false); onSignOut(); }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 rounded-xl"
                  >
                    <LogOut size={15} className="text-gray-500" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
  );
}

export function renderDashboardSidebar(ctx) {
  const { TIMELINE_DATA, activeDateSlot, activeSidebarItem, alerts, compareTimelineIndex, handleSidebarClick, isCompareMode, pageSet, pick, selectedTimelineIndex, service, setActiveDateSlot, setCompareTimelineIndex, setIsCompareMode, setShowCalendarTool, setShowTimeSliderTool, showCalendarTool, showTimeSliderTool, sidebarWidth, startSidebarResize } = ctx;
  return (
<aside style={{ width: `${sidebarWidth}px` }} className="bg-white border-r border-gray-100 flex flex-col z-50 shadow-sm shrink-0 relative">
            {/* Draggable vertical divider */}
            <div 
              onMouseDown={startSidebarResize} 
              className="absolute right-[-4px] top-0 bottom-0 w-2 cursor-col-resize hover:bg-green-500/50 active:bg-green-500 transition-colors z-50"
            />
            <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8">

              {/* MAIN */}
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-gray-600 px-3 mb-3">Main</div>
                {pick([
                  { id: 'analytics',           label: 'Analytics hub',       icon: <LayoutDashboard size={17} /> },
                  { id: 'intelligence-layers', label: 'Map',                 icon: <MapIcon size={17} /> },
                  { id: 'crop-health',         label: 'Crop health',         icon: <Activity size={17} /> },
                  { id: 'crop-yield',          label: 'Crop yield',          icon: <TrendingUp size={17} /> },
                  { id: 'moisture-content',    label: 'Moisture content',    icon: <Droplets size={17} /> },
                  { id: 'climate',             label: 'Climate',             icon: <CloudRain size={17} /> },
                  { id: 'land-restoration',    label: 'Land restoration',    icon: <Leaf size={17} /> },
                  { id: 'alerts',              label: 'Alerts',              icon: <AlertTriangle size={17} />, badge: alerts.filter(a => a.status === 'Active').length },
                  // Service-only page kinds: pick() keeps them only when the service lists them
                  ...(service ? [{ id: 'register', label: 'Register', icon: <RegisterIcon size={17} /> }, { id: 'check', label: 'Check', icon: <CheckIcon size={17} /> }, { id: 'advice', label: 'Advice', icon: <AdviceIcon size={17} /> },
                    { id: 'members', label: 'Members', icon: <MembersIcon size={17} /> }, { id: 'forms', label: 'Forms', icon: <FormsIcon size={17} /> }, { id: 'submissions', label: 'Answers', icon: <AnswersIcon size={17} /> },
                    { id: 'group-carbon', label: 'Group carbon', icon: <CarbonIcon size={17} /> }, { id: 'eudr-passport', label: 'EUDR passport', icon: <PassportIcon size={17} /> }] : []),
                ], pageSet?.sidebar).map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleSidebarClick(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all ${
                      activeSidebarItem === item.id
                        ? 'text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    style={{ backgroundColor: activeSidebarItem === item.id ? ('#3F8432') : undefined }}
                  >
                    <span className={activeSidebarItem === item.id ? 'text-white' : 'text-gray-600'}>
                      {item.icon}
                    </span>
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge > 0 && (
                      <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${activeSidebarItem === item.id ? 'bg-white/25 text-white' : 'bg-green-100 text-green-700'}`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* TOOLS */}
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-gray-600 px-3 mb-3">Tools</div>
                {[
                  { id: 'calendar-tool', label: 'Calendar',     icon: <CalendarIcon size={17} />, active: showCalendarTool, toggle: () => setShowCalendarTool(!showCalendarTool) },
                  { id: 'slider-tool',   label: 'Time slider',  icon: <SlidersHorizontal size={17} />, active: showTimeSliderTool, toggle: () => setShowTimeSliderTool(!showTimeSliderTool) },
                  { id: 'compare-tool',  label: 'Split comparison', icon: <Columns size={17} />, active: isCompareMode, toggle: () => {
                    const nextVal = !isCompareMode;
                    setIsCompareMode(nextVal);
                    if (nextVal) {
                      if (compareTimelineIndex === selectedTimelineIndex) {
                        setCompareTimelineIndex((selectedTimelineIndex + 1) % TIMELINE_DATA.length);
                      }
                      setActiveDateSlot('B');
                    } else {
                      setActiveDateSlot('A');
                    }
                  } }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={item.toggle}
                    className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-sm font-semibold transition-all ${
                      item.active
                        ? 'bg-green-50 text-green-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={item.active ? 'text-green-600' : 'text-gray-600'}>
                        {item.icon}
                      </span>
                      {item.label}
                    </div>
                    {item.active && (
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    )}
                  </button>
                ))}

                {isCompareMode && (
                  <div className="px-3 py-2.5 bg-green-50/40 rounded-xl mt-1.5 space-y-2 border border-green-100/50">
                    <div className="text-[11px] font-bold text-green-700 px-1">Active date slot</div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => setActiveDateSlot('A')}
                        className={`py-2 px-1.5 rounded-lg text-[11px] font-semibold text-center border transition-all ${
                          activeDateSlot === 'A'
                            ? 'bg-green-600 text-white border-green-600 shadow-sm'
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        Left
                      </button>
                      <button
                        onClick={() => setActiveDateSlot('B')}
                        className={`py-2 px-1.5 rounded-lg text-[11px] font-semibold text-center border transition-all ${
                          activeDateSlot === 'B'
                            ? 'bg-green-600 text-white border-green-600 shadow-sm'
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        Right
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* SETTINGS */}
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-gray-600 px-3 mb-3">Settings</div>
                {[
                  { id: 'farm-data', label: 'Farm data',        icon: <UploadIcon size={17} /> },
                  { id: 'help',      label: 'Glossary',         icon: <Info size={17} /> }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleSidebarClick(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all ${
                      activeSidebarItem === item.id
                        ? 'text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    style={{ backgroundColor: activeSidebarItem === item.id ? ('#3F8432') : undefined }}
                  >
                    <span className={activeSidebarItem === item.id ? 'text-white' : 'text-gray-600'}>
                      {item.icon}
                    </span>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

          </aside>
  );
}
