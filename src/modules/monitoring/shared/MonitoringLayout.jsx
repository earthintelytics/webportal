// UNUSED (2026-09-29): not imported anywhere in the running app. Kept on purpose, not deleted — see docs/UNUSED_CODE.md in the root repo before reusing or removing.
import React, { useState } from "react";
import "./crops.css";
import { Map, LayoutDashboard, Sparkles, FileText, Database, ChevronLeft, LogOut, Sprout, Bell, Search, PanelRight } from "lucide-react";
import { cn } from "./utils/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

export function MonitoringSidebar({ activeTab, setActiveTab, appName, onBack, onSignOut, items }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <TooltipProvider delayDuration={100}>
      <aside className={cn("flex flex-col bg-[#1a1f2e] text-slate-400 border-r border-slate-800 transition-all duration-200 shrink-0", collapsed ? "w-16" : "w-60")}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="size-8 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0">
              <Sprout className="size-5 text-white" />
            </div>
            {!collapsed && <span className="font-semibold text-base text-white truncate">{appName}</span>}
          </div>
          <button onClick={() => setCollapsed(c => !c)} className="text-slate-500 hover:text-white shrink-0">
            <ChevronLeft className={cn("size-4 transition-transform", collapsed && "rotate-180")} />
          </button>
        </div>

        <nav className="flex-1 p-2 space-y-1">
          {items.map(item => {
            const active = activeTab === item.id;
            const Icon = item.icon;
            const link = (
              <button key={item.id} onClick={() => setActiveTab(item.id)}
                className={cn("relative flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors", 
                active ? "bg-slate-800 text-white" : "hover:bg-slate-800/50 hover:text-white")}>
                {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-emerald-500" />}
                <Icon className="size-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
            return collapsed ? (
              <Tooltip key={item.id}><TooltipTrigger asChild>{link}</TooltipTrigger><TooltipContent side="right">{item.label}</TooltipContent></Tooltip>
            ) : <div key={item.id}>{link}</div>;
          })}
        </nav>

        <div className="border-t border-slate-800 p-3">
          <button onClick={onSignOut} className={cn("flex w-full items-center gap-3 rounded-md px-3 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800/50 hover:text-white border border-slate-800/50 transition", collapsed && "justify-center")}>
            <LogOut className="size-4" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </TooltipProvider>
  );
}

export function MonitoringTopBar({ title }) {
  return (
    <header className="h-16 shrink-0 bg-white border-b border-slate-100 flex items-center px-6 gap-4 z-10">
      <h1 className="text-lg font-semibold text-slate-900 shrink-0">{title}</h1>
      <div className="flex-1 max-w-md relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
        <Input placeholder="Search farms, plots, batches..." className="pl-9 h-9 bg-slate-50 border-transparent focus-visible:bg-white" />
      </div>
      <div className="flex items-center gap-2 ml-auto">
        <Button variant="ghost" size="icon" className="relative text-slate-400"><Bell className="size-5" /></Button>
        <Avatar className="size-8"><AvatarFallback className="bg-emerald-500 text-white text-xs font-bold">AO</AvatarFallback></Avatar>
      </div>
    </header>
  );
}

export function MonitoringLayout({ appName, onBack, onSignOut, children, activeTab, setActiveTab, items }) {
  const activeItem = items.find(i => i.id === activeTab);
  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 text-slate-900">
      <MonitoringSidebar activeTab={activeTab} setActiveTab={setActiveTab} appName={appName} onBack={onBack} onSignOut={onSignOut} items={items} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <MonitoringTopBar title={activeItem?.label || "Monitoring"} />
        <div className="flex-1 overflow-hidden relative">{children}</div>
      </div>
    </div>
  );
}
