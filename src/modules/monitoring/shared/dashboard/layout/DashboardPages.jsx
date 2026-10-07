/**
 * The page area: shows the page chosen in the sidebar or header tabs (maps, overview, alerts, reports, assistant, data, smallholder pages).
 * Moved out of CropDashboardLayout.jsx unchanged: each function receives the
 * layout's state and helpers it uses as `ctx`.
 */
import { Activity, Droplets, Sun, TrendingUp, LayoutDashboard, Search, X, RefreshCw, Clock, SlidersHorizontal, Waves, Send } from 'lucide-react';
import { Radar } from 'react-chartjs-2';
import FarmDataPage from '../../../../data/FarmDataPage';
import RegisterPage from '../../../../services/RegisterPage';
import CropGlossary from '../../CropGlossary';
import ReportBuilder from '../../../../reports/ReportBuilder';
import VerificationPage from '../../../../reports/VerificationPage';
import { CheckPage, AdvicePage } from '../../../../services/ServicePages';
import MembersPage from '../../../../smallholder/pages/MembersPage';
import KpiCards from '../KpiCards';
import AlertsPage from '../alerts/AlertsPage';
import DataUsedNote from '../DataUsedNote';
import LastUpdated from '../LastUpdated';
import ParcelMapPage from '../pages/ParcelMapPage';
import CropHealthMapPage from '../pages/CropHealthMapPage';
import YieldMapPage from '../pages/YieldMapPage';
import WaterMapPage from '../pages/WaterMapPage';
import RestorationMapPage from '../pages/RestorationMapPage';
import WeatherPage from '../pages/WeatherPage';
import OverviewCharts from '../charts/OverviewCharts';
import { chartsFor, healthChartsFor, waterChartsFor } from '../charts/chartCatalog';
import GroupCarbonPage from '../../../../smallholder/pages/GroupCarbonPage';
import EudrPassportPage from '../../../../smallholder/pages/EudrPassportPage';
import FormsPage from '../../../../forms/FormsPage';
import SubmissionsPage from '../../../../forms/SubmissionsPage';
import ScenarioBuilder from '../../../../assistant/ScenarioBuilder';

export function renderDashboardPages(ctx) {
  const { TIMELINE_DATA, activeAnalyticsSubpage, activeSidebarItem, activeTab, alerts, answersForm, basemapAttribution, basemapMaxNativeZoom, basemapUrl, blockValue, chatEndRef, chatInput, chatLoading, chatMessages, climateBoundariesOpacity, climatePlotsData, climatePlotsDataA, climatePlotsDataB, climateShowBoundaries, climateShowLayers, cropLabel, cropProfileEntries, cropType, currentTileUrl, currentTileUrlB, currentTimelineA, currentTimelineB, dashboardFilterKeys, dataFocus, defaultMapCenter, dynamicFilterValues, estateOptions, farmBoundary, filterDate, filterEstate, filterPlot, filteredPlotsData, glossaryFocus, handleAcknowledgeAlert, handleChatSubmit, handleEstateChange, handlePlotClick, handlePlotFilterChange, handleSidebarClick, handleSplitDragStart, healthBoundariesOpacity, healthPlotsData, healthPlotsDataA, healthPlotsDataB, healthShowBoundaries, healthShowLayers, intelBoundariesOpacity, intelShowBoundaries, intelShowLayers, isAiOnly, isCompareMode, isOrg, kpiContext, landUseChange, landUseChangeLoading, loadIssues, mapOpacity, moistureBoundariesOpacity, moisturePlotsData, moisturePlotsDataA, moisturePlotsDataB, moistureShowBoundaries, moistureShowLayers, nutrientData, overviewTrends, pageSet, pick, pixelTimeseries, plots, plotsData, plotsDataA, plotsDataB, rasterOverlayBounds, renderClimatePolygons, renderFloatingBasemapSelector, renderHealthPolygons, renderInfoTooltip, renderIntelPolygons, renderLegendCards, renderMapBottomPanel, renderMoisturePolygons, renderRestorePolygons, renderYieldPolygons, restorationPlotsData, restorationPlotsDataA, restorationPlotsDataB, restoreBoundariesOpacity, restoreShowBoundaries, restoreShowLayers, scenarioFormOpen, selectedIndex, selectedPlot, service, setActiveAnalyticsSubpage, setActiveSidebarItem, setActiveTab, setAnswersForm, setChatInput, setChatMessages, setClimateBoundariesOpacity, setClimateShowBoundaries, setClimateShowLayers, setDataFocus, setDynamicFilterValues, setFilterDate, setFilterEstate, setFilterPlot, setHealthBoundariesOpacity, setHealthShowBoundaries, setHealthShowLayers, setIntelBoundariesOpacity, setIntelShowBoundaries, setIntelShowLayers, setLoadIssues, setMapOpacity, setMoistureBoundariesOpacity, setMoistureShowBoundaries, setMoistureShowLayers, setRestoreBoundariesOpacity, setRestoreShowBoundaries, setRestoreShowLayers, setScenarioFormOpen, setSelectedPlot, setShowRasterLayer, setYieldBoundariesOpacity, setYieldShowBoundaries, setYieldShowLayers, showRasterLayer, splitPosition, tenant, tenantDisplayName, tileRefreshing, waterDemandData, waterDemandLoading, yieldBoundariesOpacity, yieldPlotsData, yieldPlotsDataA, yieldPlotsDataB, yieldShowBoundaries, yieldShowLayers, zarrBounds } = ctx;
  return (
<main className={`flex-1 flex flex-col relative bg-gray-50 ${['intelligence-layers', 'crop-health', 'crop-yield', 'moisture-content', 'climate', 'land-restoration'].includes(activeSidebarItem) ? 'overflow-hidden' : 'overflow-y-auto'}`}>
          {loadIssues.length > 0 && (
            <div role="alert" className="shrink-0 mx-4 mt-3 px-4 py-2.5 rounded-xl border border-amber-200 bg-amber-50 text-sm text-amber-900 flex items-center justify-between gap-3 z-[1100]">
              <span>Could not load {loadIssues.join(', ')}. What is shown may be incomplete.</span>
              <span className="flex gap-2 shrink-0">
                <button type="button" onClick={() => window.location.reload()} className="font-semibold underline">Try again</button>
                <button type="button" onClick={() => setLoadIssues([])} className="font-semibold">Close</button>
              </span>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              DASHBOARD — MONITOR
          ══════════════════════════════════════════════════════════════ */}
          {activeSidebarItem === 'analytics' && activeTab === 'monitor' && (() => {
            const ANALYTICS_SUBPAGES = pick([
              { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={15} /> },
              { id: 'vigor-health', label: 'Vigor & phenology', icon: <TrendingUp size={15} /> },
              { id: 'moisture-et', label: 'Moisture & ET', icon: <Droplets size={15} /> },
              { id: 'et-log', label: 'ET Historical Log', icon: <Clock size={15} /> },
              { id: 'water-management', label: 'Water management', icon: <Waves size={15} /> },
              { id: 'soil-nutrients', label: 'Soil & nutrients', icon: <Sun size={15} /> },
            ], pageSet?.analytics);
            return (
              <div className="p-10 space-y-10">
                {/* Page header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight">{pageSet?.overviewTitle || 'Overview'}</h2>
                    <p className="text-sm text-gray-500 font-medium mt-2 max-w-lg">
                      {pageSet?.overviewText || 'How your fields are doing, from the latest satellite passes.'}
                    </p>
                  </div>
                  <LastUpdated newestImageDate={TIMELINE_DATA.length ? TIMELINE_DATA[TIMELINE_DATA.length - 1].date : null} />
                </div>

                {/* Subtabs Menu */}
                <div className="flex border-b border-gray-200">
                  {ANALYTICS_SUBPAGES.map(sub => (
                    <button
                      key={sub.id}
                      onClick={() => setActiveAnalyticsSubpage(sub.id)}
                      className={`flex items-center gap-2 px-6 py-3 border-b-2 font-bold text-sm transition-all outline-none ${
                        activeAnalyticsSubpage === sub.id
                          ? 'border-green-600 text-green-600'
                          : 'border-transparent text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      {sub.icon}
                      {sub.label}
                    </button>
                  ))}
                </div>

                {/* Search & Filters */}
                <div className="bg-white px-6 py-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-4 lg:flex-row lg:items-center justify-between">
                  <div className="relative flex-1 max-w-md w-full">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                    <input
                      type="text"
                      placeholder="Search blocks, parameters, anomalies..."
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-11 pr-4 text-sm font-medium outline-none focus:border-green-500 focus:bg-white transition-all text-gray-700"
                    />
                  </div>
                  
                  {/* Active Filter Dropdowns */}
                  <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                    {/* Estate Filter */}
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                      <span className="text-[11px] font-semibold text-gray-600">Estate</span>
                      <select
                        value={filterEstate}
                        onChange={e => handleEstateChange(e.target.value)}
                        className="bg-transparent text-xs font-bold text-gray-700 outline-none cursor-pointer pr-1"
                      >
                        <option value="All">All estates</option>
                        {estateOptions.map(sf => (
                          <option key={sf} value={sf}>{sf}</option>
                        ))}
                      </select>
                    </div>

                    {/* Plot Filter — populated from real plot IDs */}
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                      <span className="text-[11px] font-semibold text-gray-600">Plot</span>
                      <select
                        value={filterPlot}
                        onChange={e => handlePlotFilterChange(e.target.value)}
                        className="bg-transparent text-xs font-bold text-gray-700 outline-none cursor-pointer pr-1"
                      >
                        <option value="All">All plots</option>
                        {plotsData.slice(0, 50).map(p => (
                          <option key={p.id} value={p.id}>{p.id}</option>
                        ))}
                      </select>
                    </div>

                    {/* Date Filter */}
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                      <span className="text-[11px] font-semibold text-gray-600">Date</span>
                      <select
                        value={filterDate}
                        onChange={e => setFilterDate(e.target.value)}
                        className="bg-transparent text-xs font-bold text-gray-700 outline-none cursor-pointer pr-1"
                      >
                        <option value="All">All pass dates</option>
                        {TIMELINE_DATA.map(t => (
                          <option key={t.date} value={t.date}>{t.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Clear Button */}
                    {(filterEstate !== 'All' || filterPlot !== 'All' || filterDate !== 'All') && (
                      <button
                        onClick={() => { setFilterEstate('All'); setFilterPlot('All'); setFilterDate('All'); }}
                        className="text-xs font-bold text-green-700 hover:text-green-800 transition-colors flex items-center gap-1.5 px-3 py-2 bg-green-50 hover:bg-green-100/70 rounded-xl"
                      >
                        <X size={14} /> Clear filters
                      </button>
                    )}
                  </div>
                </div>

                {/* Subpage Contents */}
                {activeAnalyticsSubpage === 'overview' && (
                  <div className="space-y-10">
                    {/* KPI cards: chosen per crop or service (dashboard/kpiCatalog.js) */}
                    <KpiCards serviceId={service?.id} cropType={cropType} ctx={kpiContext} />

                    {/* Charts chosen per crop or service (dashboard/charts/chartCatalog.js) */}
                    <OverviewCharts
                      charts={chartsFor(service?.id, cropType)}
                      trends={overviewTrends}
                      plots={plotsData}
                      classify={kpiContext.classify}
                      valueOf={blockValue}
                      primaryKey={kpiContext.primaryKey}
                      unitLabel={kpiContext.unitLabel}
                    />
                    <DataUsedNote serviceId={service?.id} />
                  </div>
                )}

                {activeAnalyticsSubpage === 'vigor-health' && (
                  <OverviewCharts
                    charts={healthChartsFor(service?.id, cropType)}
                    trends={overviewTrends}
                    plots={plotsData}
                    classify={kpiContext.classify}
                    valueOf={blockValue}
                    primaryKey={kpiContext.primaryKey}
                    unitLabel={kpiContext.unitLabel}
                  />
                )}

                {activeAnalyticsSubpage === 'moisture-et' && (
                  <OverviewCharts
                    charts={waterChartsFor(service?.id, cropType)}
                    trends={overviewTrends}
                    plots={plotsData}
                    classify={kpiContext.classify}
                    valueOf={blockValue}
                    primaryKey={kpiContext.primaryKey}
                    unitLabel={kpiContext.unitLabel}
                  />
                )}

                {activeAnalyticsSubpage === 'et-log' && (
                  <div className="space-y-10">
                    {/* Was a hardcoded table — fake dates (May 24-30, never
                        actually the current period) with every value as a
                        placeholder dash. No backend endpoint provides a
                        day-by-day ETo/Kc/ETa/deficit/soil-moisture history
                        (the water-demand endpoint only returns each plot's
                        current snapshot — see Water Management). Left as an
                        honest empty state rather than real-looking fake
                        rows until that endpoint exists. */}
                    <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-5">
                      <h3 className="text-base font-bold text-gray-900 flex items-center gap-2.5">
                        <Clock size={18} className="text-gray-600" />
                        7-Day Evapotranspiration Historical Log {renderInfoTooltip("7-Day Evapotranspiration Historical Log")}</h3>
                      {waterDemandData && waterDemandData.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-gray-200 text-gray-600 font-semibold text-[11px]">
                                <th className="py-3 px-4">Plot</th>
                                <th className="py-3 px-4">Area (ha)</th>
                                <th className="py-3 px-4">Demand ETc (mm/day)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                              {waterDemandData.map(p => (
                                <tr key={p.plot_id} className="hover:bg-gray-50/50">
                                  <td className="py-3 px-4 font-bold">{p.name}</td>
                                  <td className="py-3 px-4">{p.area_ha != null ? p.area_ha.toFixed(2) : '—'}</td>
                                  <td className="py-3 px-4">{p.etc_mm_day != null ? p.etc_mm_day.toFixed(2) : '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <div className="text-[11px] text-gray-600 mt-3">
                            Shows each plot's current ETc snapshot — day-by-day ETo/Kc/ETa/deficit/soil-moisture history requires a backend endpoint that doesn't exist yet.
                          </div>
                        </div>
                      ) : (
                        <div className="border border-gray-100 rounded-xl p-6 text-sm text-gray-600 text-center">
                          No water demand data available yet — run the pipeline with ETc enabled to populate this panel.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeAnalyticsSubpage === 'water-management' && (
                  <div className="space-y-6">
                    {waterDemandLoading && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 font-semibold">
                        <RefreshCw size={14} className="animate-spin" /> Loading water demand data…
                      </div>
                    )}

                    {!waterDemandLoading && (!waterDemandData || waterDemandData.length === 0) && (
                      <div className="border border-gray-100 rounded-xl p-6 bg-white text-sm text-gray-600 text-center">
                        No water demand data available yet — run the pipeline with ETc enabled to populate this panel.
                      </div>
                    )}

                    {!waterDemandLoading && waterDemandData && waterDemandData.length > 0 && (() => {
                      const withEtc = waterDemandData.filter(p => p.etc_mm_day != null);
                      const avgEtc = withEtc.length
                        ? withEtc.reduce((sum, p) => sum + p.etc_mm_day, 0) / withEtc.length
                        : null;
                      const farm = waterDemandData[0];
                      return (
                        <>
                          {/* KPI cards */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="border border-gray-100 rounded-xl p-4 bg-white shadow-sm">
                              <div className="text-[11px] font-bold text-gray-600 mb-1">Avg. Crop Water Demand</div>
                              <div className="text-2xl font-bold text-gray-800">
                                {avgEtc != null ? `${avgEtc.toFixed(2)}` : '—'} <span className="text-xs font-semibold text-gray-600">mm/day</span>
                              </div>
                            </div>
                            <div className="border border-gray-100 rounded-xl p-4 bg-white shadow-sm">
                              <div className="text-[11px] font-bold text-gray-600 mb-1">Cumulative rainfall</div>
                              <div className="text-2xl font-bold text-gray-800">
                                {farm.cumulative_rainfall_mm != null ? farm.cumulative_rainfall_mm.toFixed(1) : '—'} <span className="text-xs font-semibold text-gray-600">mm</span>
                              </div>
                            </div>
                            <div className="border border-gray-100 rounded-xl p-4 bg-white shadow-sm">
                              <div className="text-[11px] font-bold text-gray-600 mb-1">Irrigation efficiency</div>
                              <div className="text-2xl font-bold text-gray-800">
                                {farm.irrigation_efficiency != null ? `${(farm.irrigation_efficiency * 100).toFixed(0)}%` : '—'}
                              </div>
                              <div className="text-[11px] text-gray-600 mt-1">Rainfall received / crop water demand over the run period</div>
                            </div>
                          </div>

                          {/* Per-plot ETc table */}
                          <div className="border border-gray-100 rounded-xl bg-white shadow-sm overflow-hidden">
                            <div className="px-4 py-3 border-b border-gray-100 text-xs font-bold text-gray-700">Per-Plot Crop Water Demand</div>
                            <div className="max-h-80 overflow-y-auto">
                              <table className="w-full text-xs">
                                <thead className="bg-gray-50 text-gray-600 text-[11px]">
                                  <tr>
                                    <th className="text-left px-4 py-2">Plot</th>
                                    <th className="text-left px-4 py-2">Area (ha)</th>
                                    <th className="text-left px-4 py-2">ETc (mm/day)</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {waterDemandData.map(p => (
                                    <tr key={p.plot_id} className="border-t border-gray-50">
                                      <td className="px-4 py-2 font-semibold text-gray-700">{p.name}</td>
                                      <td className="px-4 py-2 text-gray-500">{p.area_ha != null ? p.area_ha.toFixed(2) : '—'}</td>
                                      <td className="px-4 py-2 text-gray-500">{p.etc_mm_day != null ? p.etc_mm_day.toFixed(2) : '—'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          <div className="text-[11px] text-gray-600 px-1">
                            ETc is also available as a map layer — select "ETc" from the index picker on Intelligence Layers to view it with the time slider.
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}

                {activeAnalyticsSubpage === 'soil-nutrients' && (
                  <div className="space-y-10">
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                      {/* Nutrient Profiling (Radar) */}
                      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-5 xl:col-span-1">
                        <h3 className="text-base font-bold text-gray-900 flex items-center gap-2.5">
                          <Sun size={18} className="text-green-600" />
                          Canopy signals {renderInfoTooltip("Nutrient Profiling")}</h3>
                        <p className="text-xs text-gray-500 -mt-2">Satellite signals for the selected date, scaled 0–100. They show canopy condition, not soil nutrients.</p>
                        <div className="h-[320px] flex items-center justify-center">
                          {!nutrientData.hasData ? <div className="text-sm text-gray-500 text-center px-6">No clear satellite image for this date yet. The signals appear once the monitoring pipeline has processed images for this farm.</div> : <Radar
                            data={nutrientData}
                            options={{
                              scales: { r: { angleLines: { display: false }, suggestedMin: 0, suggestedMax: 100, ticks: { display: false }, pointLabels: { font: { size: 11, weight: '600' } } } },
                              plugins: { legend: { display: false } }
                            }}
                          />}
                        </div>
                      </div>

                      {/* Detailed Soil Chemistry Diagnostics */}
                      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-5 xl:col-span-2">
                        <h3 className="text-base font-bold text-gray-900 flex items-center gap-2.5">
                          <Activity size={18} className="text-green-600" />
                          Detailed Soil Chemistry Diagnostics {renderInfoTooltip("Detailed Soil Chemistry Diagnostics")}</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                          {/* Parameters Table/List */}
                          <div className="space-y-3">
                            <h4 className="text-[11px] font-semibold text-gray-600">Diagnostic metrics</h4>
                            {[
                              { name: 'Soil pH', value: '—', status: '—', color: 'text-gray-500' },
                              { name: 'Organic Carbon', value: '—', status: '—', color: 'text-gray-500' },
                              { name: 'Total Nitrogen (N)', value: '—', status: '—', color: 'text-gray-500' },
                              { name: 'Available Phosphorus (P)', value: '—', status: '—', color: 'text-gray-500' },
                              { name: 'Exchangeable Potassium (K)', value: '—', status: '—', color: 'text-gray-500' }
                            ].map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                                <span className="text-xs font-bold text-gray-500">{item.name}</span>
                                <span className={`text-xs font-bold ${item.color}`}>{item.value}</span>
                              </div>
                            ))}
                          </div>

                          {/* Actionable Recommendations */}
                          <div className="space-y-3">
                            <h4 className="text-[11px] font-semibold text-gray-600">Agronomic recommendations</h4>
                            <div className="bg-green-50/50 border border-green-100 p-4 rounded-xl space-y-3">
                              <p className="text-xs text-gray-500 font-semibold leading-relaxed">
                                Soil chemistry data not yet connected. Upload soil sample results to generate agronomic recommendations for this plot.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ══════════════════════════════════════════════════════════════
              MAP ANALYTICS
          ══════════════════════════════════════════════════════════════ */}
          {activeSidebarItem === 'intelligence-layers' && (
            <ParcelMapPage cropType={cropType} basemapAttribution={basemapAttribution} basemapMaxNativeZoom={basemapMaxNativeZoom} basemapUrl={basemapUrl} currentTileUrl={currentTileUrl} currentTileUrlB={currentTileUrlB} currentTimelineA={currentTimelineA} currentTimelineB={currentTimelineB} dashboardFilterKeys={dashboardFilterKeys} defaultMapCenter={defaultMapCenter} dynamicFilterValues={dynamicFilterValues} farmBoundary={farmBoundary} filterEstate={filterEstate} filteredPlotsData={filteredPlotsData} handlePlotClick={handlePlotClick} handleSplitDragStart={handleSplitDragStart} intelBoundariesOpacity={intelBoundariesOpacity} intelShowBoundaries={intelShowBoundaries} intelShowLayers={intelShowLayers} isCompareMode={isCompareMode} mapOpacity={mapOpacity} pixelTimeseries={pixelTimeseries} plotsData={plotsData} plotsDataA={plotsDataA} plotsDataB={plotsDataB} rasterOverlayBounds={rasterOverlayBounds} renderFloatingBasemapSelector={renderFloatingBasemapSelector} renderIntelPolygons={renderIntelPolygons} renderMapBottomPanel={renderMapBottomPanel} selectedIndex={selectedIndex} selectedPlot={selectedPlot} setDynamicFilterValues={setDynamicFilterValues} setIntelBoundariesOpacity={setIntelBoundariesOpacity} setIntelShowBoundaries={setIntelShowBoundaries} setIntelShowLayers={setIntelShowLayers} setMapOpacity={setMapOpacity} setSelectedPlot={setSelectedPlot} setShowRasterLayer={setShowRasterLayer} showRasterLayer={showRasterLayer} splitPosition={splitPosition} tileRefreshing={tileRefreshing} zarrBounds={zarrBounds} />
          )}

          {activeSidebarItem === 'crop-health' && (
            <CropHealthMapPage cropType={cropType} basemapAttribution={basemapAttribution} basemapMaxNativeZoom={basemapMaxNativeZoom} basemapUrl={basemapUrl} currentTileUrl={currentTileUrl} currentTileUrlB={currentTileUrlB} currentTimelineA={currentTimelineA} currentTimelineB={currentTimelineB} defaultMapCenter={defaultMapCenter} farmBoundary={farmBoundary} filterEstate={filterEstate} handleSplitDragStart={handleSplitDragStart} healthBoundariesOpacity={healthBoundariesOpacity} healthPlotsData={healthPlotsData} healthPlotsDataA={healthPlotsDataA} healthPlotsDataB={healthPlotsDataB} healthShowBoundaries={healthShowBoundaries} healthShowLayers={healthShowLayers} isCompareMode={isCompareMode} isOrg={isOrg} mapOpacity={mapOpacity} plotsData={plotsData} rasterOverlayBounds={rasterOverlayBounds} renderFloatingBasemapSelector={renderFloatingBasemapSelector} renderHealthPolygons={renderHealthPolygons} renderLegendCards={renderLegendCards} renderMapBottomPanel={renderMapBottomPanel} selectedIndex={selectedIndex} setHealthBoundariesOpacity={setHealthBoundariesOpacity} setHealthShowBoundaries={setHealthShowBoundaries} setHealthShowLayers={setHealthShowLayers} setMapOpacity={setMapOpacity} setShowRasterLayer={setShowRasterLayer} showRasterLayer={showRasterLayer} splitPosition={splitPosition} tileRefreshing={tileRefreshing} zarrBounds={zarrBounds} />
          )}

          {/* ══════════════════════════════════════════════════════════════
              CROP YIELD MAP VIEW
          ══════════════════════════════════════════════════════════════ */}
          {activeSidebarItem === 'crop-yield' && (
            <YieldMapPage cropType={cropType} basemapAttribution={basemapAttribution} basemapMaxNativeZoom={basemapMaxNativeZoom} basemapUrl={basemapUrl} currentTileUrl={currentTileUrl} currentTileUrlB={currentTileUrlB} currentTimelineA={currentTimelineA} currentTimelineB={currentTimelineB} defaultMapCenter={defaultMapCenter} farmBoundary={farmBoundary} filterEstate={filterEstate} handleSplitDragStart={handleSplitDragStart} isCompareMode={isCompareMode} mapOpacity={mapOpacity} plotsData={plotsData} rasterOverlayBounds={rasterOverlayBounds} renderFloatingBasemapSelector={renderFloatingBasemapSelector} renderMapBottomPanel={renderMapBottomPanel} renderYieldPolygons={renderYieldPolygons} selectedIndex={selectedIndex} setMapOpacity={setMapOpacity} setShowRasterLayer={setShowRasterLayer} setYieldBoundariesOpacity={setYieldBoundariesOpacity} setYieldShowBoundaries={setYieldShowBoundaries} setYieldShowLayers={setYieldShowLayers} showRasterLayer={showRasterLayer} splitPosition={splitPosition} tileRefreshing={tileRefreshing} yieldBoundariesOpacity={yieldBoundariesOpacity} yieldPlotsData={yieldPlotsData} yieldPlotsDataA={yieldPlotsDataA} yieldPlotsDataB={yieldPlotsDataB} yieldShowBoundaries={yieldShowBoundaries} yieldShowLayers={yieldShowLayers} zarrBounds={zarrBounds} />
          )}

          {activeSidebarItem === 'moisture-content' && (
            <WaterMapPage cropType={cropType} basemapAttribution={basemapAttribution} basemapMaxNativeZoom={basemapMaxNativeZoom} basemapUrl={basemapUrl} currentTileUrl={currentTileUrl} currentTileUrlB={currentTileUrlB} currentTimelineA={currentTimelineA} currentTimelineB={currentTimelineB} defaultMapCenter={defaultMapCenter} farmBoundary={farmBoundary} filterEstate={filterEstate} handleSplitDragStart={handleSplitDragStart} isCompareMode={isCompareMode} mapOpacity={mapOpacity} moistureBoundariesOpacity={moistureBoundariesOpacity} moisturePlotsData={moisturePlotsData} moisturePlotsDataA={moisturePlotsDataA} moisturePlotsDataB={moisturePlotsDataB} moistureShowBoundaries={moistureShowBoundaries} moistureShowLayers={moistureShowLayers} plotsData={plotsData} rasterOverlayBounds={rasterOverlayBounds} renderFloatingBasemapSelector={renderFloatingBasemapSelector} renderLegendCards={renderLegendCards} renderMapBottomPanel={renderMapBottomPanel} renderMoisturePolygons={renderMoisturePolygons} selectedIndex={selectedIndex} setMapOpacity={setMapOpacity} setMoistureBoundariesOpacity={setMoistureBoundariesOpacity} setMoistureShowBoundaries={setMoistureShowBoundaries} setMoistureShowLayers={setMoistureShowLayers} setShowRasterLayer={setShowRasterLayer} showRasterLayer={showRasterLayer} splitPosition={splitPosition} tileRefreshing={tileRefreshing} zarrBounds={zarrBounds} />
          )}

          {activeSidebarItem === 'land-restoration' && (
            <RestorationMapPage cropType={cropType} basemapAttribution={basemapAttribution} basemapMaxNativeZoom={basemapMaxNativeZoom} basemapUrl={basemapUrl} currentTileUrl={currentTileUrl} currentTileUrlB={currentTileUrlB} currentTimelineA={currentTimelineA} currentTimelineB={currentTimelineB} defaultMapCenter={defaultMapCenter} farmBoundary={farmBoundary} filterEstate={filterEstate} handleSplitDragStart={handleSplitDragStart} isCompareMode={isCompareMode} landUseChange={landUseChange} landUseChangeLoading={landUseChangeLoading} mapOpacity={mapOpacity} plotsData={plotsData} rasterOverlayBounds={rasterOverlayBounds} renderFloatingBasemapSelector={renderFloatingBasemapSelector} renderMapBottomPanel={renderMapBottomPanel} renderRestorePolygons={renderRestorePolygons} restorationPlotsData={restorationPlotsData} restorationPlotsDataA={restorationPlotsDataA} restorationPlotsDataB={restorationPlotsDataB} restoreBoundariesOpacity={restoreBoundariesOpacity} restoreShowBoundaries={restoreShowBoundaries} restoreShowLayers={restoreShowLayers} selectedIndex={selectedIndex} setMapOpacity={setMapOpacity} setRestoreBoundariesOpacity={setRestoreBoundariesOpacity} setRestoreShowBoundaries={setRestoreShowBoundaries} setRestoreShowLayers={setRestoreShowLayers} setShowRasterLayer={setShowRasterLayer} showRasterLayer={showRasterLayer} splitPosition={splitPosition} tileRefreshing={tileRefreshing} zarrBounds={zarrBounds} />
          )}

          {/* ══════════════════════════════════════════════════════════════
              ALERTS COMMAND CENTER
          ══════════════════════════════════════════════════════════════ */}
          {activeSidebarItem === 'alerts' && (
            <AlertsPage
              alerts={alerts}
              places={plotsData}
              serviceId={service?.id}
              cropType={cropType}
              onAcknowledge={handleAcknowledgeAlert}
              onAcknowledgeAll={(ids) => ids.forEach(handleAcknowledgeAlert)}
              onLocate={(plotId) => { setActiveSidebarItem('intelligence-layers'); setSelectedPlot(plotId); }}
            />
          )}

          {/* ══════════════════════════════════════════════════════════════
              CLIMATE
          ══════════════════════════════════════════════════════════════ */}
          {/* ══════════════════════════════════════════════════════════════
              CLIMATE MAP VIEW
          ══════════════════════════════════════════════════════════════ */}
          {activeSidebarItem === 'climate' && (
            <WeatherPage setShowRasterLayer={setShowRasterLayer} setMapOpacity={setMapOpacity} cropType={cropType} basemapAttribution={basemapAttribution} basemapMaxNativeZoom={basemapMaxNativeZoom} basemapUrl={basemapUrl} climateBoundariesOpacity={climateBoundariesOpacity} climatePlotsData={climatePlotsData} climatePlotsDataA={climatePlotsDataA} climatePlotsDataB={climatePlotsDataB} climateShowBoundaries={climateShowBoundaries} climateShowLayers={climateShowLayers} currentTileUrl={currentTileUrl} currentTileUrlB={currentTileUrlB} currentTimelineA={currentTimelineA} currentTimelineB={currentTimelineB} defaultMapCenter={defaultMapCenter} farmBoundary={farmBoundary} filterEstate={filterEstate} handleSplitDragStart={handleSplitDragStart} isCompareMode={isCompareMode} mapOpacity={mapOpacity} plotsData={plotsData} rasterOverlayBounds={rasterOverlayBounds} renderClimatePolygons={renderClimatePolygons} renderFloatingBasemapSelector={renderFloatingBasemapSelector} renderMapBottomPanel={renderMapBottomPanel} selectedIndex={selectedIndex} setClimateBoundariesOpacity={setClimateBoundariesOpacity} setClimateShowBoundaries={setClimateShowBoundaries} setClimateShowLayers={setClimateShowLayers} showRasterLayer={showRasterLayer} splitPosition={splitPosition} tileRefreshing={tileRefreshing} zarrBounds={zarrBounds} />
          )}

          {/* ══════════════════════════════════════════════════════════════
              VERIFICATION
          ══════════════════════════════════════════════════════════════ */}
          {activeSidebarItem === 'analytics' && activeTab === 'verification' && (
            <VerificationPage plots={plotsData} serviceId={service?.id} onOpenData={(id) => { setDataFocus(id); setActiveTab('monitor'); setActiveSidebarItem('farm-data'); }} />
          )}

          {((isAiOnly && activeTab === 'reports') || (activeSidebarItem === 'analytics' && activeTab === 'reports')) && (
            <ReportBuilder
              plots={plotsData}
              alerts={alerts}
              estates={estateOptions}
              tenant={tenant}
              orgName={tenantDisplayName}
              subject={service ? `${tenantDisplayName} ${service.title}` : isOrg ? tenantDisplayName : `${tenantDisplayName} ${cropLabel}`}
              cropType={cropType}
            />
          )}

          {/* ══════════════════════════════════════════════════════════════
              AI ASSISTANT
          ══════════════════════════════════════════════════════════════ */}
          {((isAiOnly && activeTab === 'ai-assistant') || (activeSidebarItem === 'analytics' && activeTab === 'ai-assistant')) && (
            <div className="flex flex-col flex-1 h-full bg-white overflow-hidden">
              {/* In a conversation: one slim bar to start again (the page title is the header tab). */}
              {chatMessages.length > 1 && (
                <div className="px-6 py-3 border-b border-gray-100 flex items-center justify-between shrink-0">
                  <span className="text-sm font-semibold text-gray-700">Conversation</span>
                  <button type="button"
                    onClick={() => setChatMessages([{ sender: 'assistant', text: "Ask about your crop condition, water or weather, or choose a what-if scenario. Answers use your own monitoring data." }])}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                    <SlidersHorizontal size={14} className="text-green-700" />New question
                  </button>
                </div>
              )}

              {/* Main Content Area */}
              <div className="flex-1 overflow-y-auto flex flex-col min-h-0 bg-gray-50/20">
                {chatMessages.length === 1 ? (
                  /* Start page: what-ifs, scrolls from the top so nothing is cut off */
                  <div className="w-full max-w-4xl mx-auto px-6 py-8">
                    <ScenarioBuilder
                      cropType={isOrg ? null : cropType}
                      serviceId={service?.id}
                      estates={estateOptions}
                      onRun={(text, meta) => handleChatSubmit(text, meta)}
                      onFormOpen={setScenarioFormOpen}
                    />
                  </div>
                ) : (
                  /* Active Message History */
                  <div className="flex-1 overflow-y-auto px-6 py-8">
                    <div className="max-w-3xl mx-auto space-y-6">
                      {chatMessages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] rounded-2xl text-sm leading-relaxed ${
                            msg.sender === 'user'
                              ? 'bg-green-700 text-white rounded-tr-none px-5 py-3.5'
                              : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none px-5 py-3.5'
                          }`}>
                            <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                            {msg.sources && msg.sources.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-gray-100 flex flex-wrap gap-1">
                                {msg.sources.map((src, si) => (
                                  <span key={si} className="text-xs bg-green-50 text-green-700 border border-green-100 rounded-full px-2 py-0.5 font-medium">{src}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {chatLoading && (
                        <div className="flex justify-start">
                          <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-none px-5 py-3.5 flex items-center gap-2 text-sm text-gray-600" aria-label="The Assistant is writing">
                            <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Input Area (hidden while a what-if form, which has its own button, is open) */}
              {!(scenarioFormOpen && chatMessages.length === 1) && (
              <div className="bg-white px-6 py-4 border-t border-gray-100 shrink-0">
                <div className="max-w-3xl mx-auto">
                  <form
                    onSubmit={(e) => { e.preventDefault(); handleChatSubmit(); }}
                    className="relative flex flex-col"
                  >
                    <textarea
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      disabled={chatLoading}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleChatSubmit();
                        }
                      }}
                      placeholder="Ask about your farm, e.g. Which blocks are short of water this month?"
                      rows={3}
                      aria-label="Your question"
                      className="w-full bg-white border border-gray-300 focus:border-green-700 rounded-2xl py-3.5 pl-4 pr-16 text-sm outline-none text-gray-900 placeholder-gray-400 resize-none disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={chatLoading}
                      className="absolute right-3 bottom-3 w-10 h-10 bg-green-700 hover:bg-green-800 text-white rounded-xl flex items-center justify-center shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Send"
                    >
                      <Send size={18} />
                    </button>
                  </form>
                </div>
              </div>
              )}

            </div>
          )}

          {activeSidebarItem === 'check' && service?.check && (
            <CheckPage page={service.check} plots={plotsData} onOpenData={() => setActiveSidebarItem('farm-data')} />
          )}
          {activeSidebarItem === 'advice' && service?.advice && (
            <AdvicePage page={service.advice} alerts={alerts} onAsk={(q) => { setActiveSidebarItem('analytics'); setActiveTab('ai-assistant'); handleChatSubmit(q); }} />
          )}

          {activeSidebarItem === 'members' && <MembersPage onOpenForms={() => handleSidebarClick('forms')} onOpenAnswers={() => handleSidebarClick('submissions')} />}
          {activeSidebarItem === 'forms' && <FormsPage onOpenAnswers={(id) => { setAnswersForm(id); setActiveSidebarItem('submissions'); }} />}
          {activeSidebarItem === 'submissions' && <SubmissionsPage key={answersForm || 'all'} formId={answersForm} />}
          {activeSidebarItem === 'group-carbon' && <GroupCarbonPage />}
          {activeSidebarItem === 'eudr-passport' && <EudrPassportPage />}

          {activeSidebarItem === 'register' && service?.register && (
            <RegisterPage register={service.register} plots={plotsData} />
          )}

          {activeSidebarItem === 'farm-data' && (
            <FarmDataPage key={dataFocus || 'data'} cropType={isOrg ? null : cropType} serviceId={service?.id} plots={plots} initialDataset={dataFocus} />
          )}



          {activeSidebarItem === 'help' && (
            <CropGlossary entries={cropProfileEntries} extra={pageSet?.glossary} cropName={service ? service.title : isOrg ? '' : cropLabel} focusKey={glossaryFocus} />
          )}
        </main>
  );
}
