import { ChevronDown, ChevronRight, Layers, X } from 'lucide-react';
import { FitBoundsToPlots, FitToZarrBounds, MapPaneClipSetter, ResizeMap, SwipeSliderOverlay } from '../../dashboard/map/MapHelpers';
import { MapContainer, Pane, TileLayer, ZoomControl } from 'react-leaflet';

/** The restoration zones map page of the crop and service dashboard (moved out of CropDashboardLayout). */
export default function RestorationMapPage({ basemapAttribution, basemapMaxNativeZoom, basemapUrl, currentTileUrl, currentTileUrlB, currentTimelineA, currentTimelineB, defaultMapCenter, effectiveSensor, farmBoundary, filterEstate, handleSplitDragStart, isCompareMode, landUseChange, landUseChangeLoading, legendEntries, mapOpacity, plotsData, rasterOverlayBounds, renderFloatingBasemapSelector, renderInfoTooltip, renderLegendCard, renderMapBottomPanel, renderRestorePolygons, restorationPlotsData, restorationPlotsDataA, restorationPlotsDataB, restoreBoundariesOpacity, restoreEcoExpanded, restoreEudrExpanded, restoreLulcExpanded, restoreOpExpanded, restoreShowAgb, restoreShowBiodiversity, restoreShowBoundaries, restoreShowCarbon, restoreShowEudr, restoreShowGedi, restoreShowInSar, restoreShowLayers, restoreShowLulc, restoreShowLulcChange, restoreShowProgress, restoreShowSurvival, selectedIndex, setMapOpacity, setRestoreBoundariesOpacity, setRestoreEcoExpanded, setRestoreEudrExpanded, setRestoreLulcExpanded, setRestoreOpExpanded, setRestoreShowAgb, setRestoreShowBiodiversity, setRestoreShowBoundaries, setRestoreShowCarbon, setRestoreShowEudr, setRestoreShowGedi, setRestoreShowInSar, setRestoreShowLayers, setRestoreShowLulc, setRestoreShowLulcChange, setRestoreShowProgress, setRestoreShowSurvival, setShowRasterLayer, showRasterLayer, splitPosition, tileRefreshing, zarrBounds }) {
  return (
      <div className="flex flex-col h-full">

        {/* ── Top area: Map + Right Legend sidebar ── */}
        <div className="flex flex-1 min-h-0">

          {/* ═══ MAP ═══ */}
          <div className="flex-1 relative min-w-0 map-wrapper-pane">
            {tileRefreshing && currentTileUrl && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-1.5 bg-black/60 text-white text-[11px] font-semibold px-3 py-1.5 rounded-full pointer-events-none">
                <svg className="animate-spin h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                Loading {(selectedIndex || 'NDVI').toUpperCase()} · {effectiveSensor === 'sentinel-1' ? 'S1 SAR' : effectiveSensor === 'landsat' ? 'L9' : 'S2'}…
              </div>
            )}
            <MapContainer preferCanvas={true} center={defaultMapCenter} zoom={13} maxZoom={22}
              style={{ height: '100%', width: '100%', zIndex: 1, position: 'relative', background: 'transparent' }} zoomControl={false}>
              <TileLayer key={basemapUrl} url={basemapUrl} attribution={basemapAttribution} maxZoom={22} maxNativeZoom={basemapMaxNativeZoom} />
    {!isCompareMode && showRasterLayer && currentTileUrl && (
      <TileLayer
        key={currentTileUrl}
        url={currentTileUrl}
        opacity={mapOpacity / 100}
        bounds={rasterOverlayBounds || undefined}
        maxZoom={22}
        maxNativeZoom={18}
      />
    )}

              {isCompareMode ? (
                <>
                  <MapPaneClipSetter
                    leftPaneName="left-pane-restore"
                    rightPaneName="right-pane-restore"
                    splitPosition={splitPosition}
                    isCompareMode={isCompareMode}
                  />
                  <Pane name="left-pane-restore" style={{ zIndex: 500 }}>
                    {showRasterLayer && currentTileUrl && (
                      <TileLayer key={`a-${currentTileUrl}`} url={currentTileUrl} opacity={mapOpacity / 100} bounds={rasterOverlayBounds || undefined} maxZoom={22} maxNativeZoom={18} />
                    )}
                    {renderRestorePolygons(restorationPlotsDataA, 'left')}
                  </Pane>
                  <Pane name="right-pane-restore" style={{ zIndex: 501 }}>
                    {showRasterLayer && currentTileUrlB && (
                      <TileLayer key={`b-${currentTileUrlB}`} url={currentTileUrlB} opacity={mapOpacity / 100} bounds={rasterOverlayBounds || undefined} maxZoom={22} maxNativeZoom={18} />
                    )}
                    {renderRestorePolygons(restorationPlotsDataB, 'right')}
                  </Pane>
                </>
              ) : (
                renderRestorePolygons(restorationPlotsData)
              )}
              {null}
              <FitBoundsToPlots plotsData={plotsData} farmBoundary={farmBoundary} refitKey={filterEstate} />
              <FitToZarrBounds zarrBounds={zarrBounds} />
              <ZoomControl position="bottomright" />
              <ResizeMap trigger={restoreShowLayers} />
            </MapContainer>

            <SwipeSliderOverlay
              isCompareMode={isCompareMode}
              splitPosition={splitPosition}
              currentTimelineA={currentTimelineA}
              currentTimelineB={currentTimelineB}
              handleSplitDragStart={handleSplitDragStart}
            />

            {/* Floating Basemap Selector (Top-Left) */}
            {renderFloatingBasemapSelector()}

            {/* Floating map layers trigger */}
            <button
              onClick={() => setRestoreShowLayers(!restoreShowLayers)}
              className={`absolute top-4 right-4 bg-white border p-3 rounded-2xl shadow-xl hover:bg-gray-50 flex items-center gap-2 font-bold text-xs transition-all active:scale-95 ${
                restoreShowLayers ? 'text-green-700 border-green-200 bg-green-50 shadow-inner' : 'text-gray-700 border-gray-200 bg-white'
              }`}
              style={{ zIndex: 40000 }}
            >
              <Layers size={16} className={restoreShowLayers ? 'text-green-600' : 'text-gray-600'} />
              Map layers
            </button>

            {/* Plot detail panel (over map) */}
            {null}
          </div>

          {/* ═══ RIGHT MAP LAYERS SIDEBAR ═══ */}
          {restoreShowLayers && (
            <div className="w-[280px] bg-white border-l border-gray-100 flex flex-col shrink-0 overflow-y-auto z-10 shadow-sm animate-in slide-in-from-right duration-300">
              {/* Header */}
              <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers size={18} className="text-green-600" />
                  <span className="text-base font-bold text-gray-800 font-sans">Map layers</span>
                </div>
                <button onClick={() => setRestoreShowLayers(false)} className="p-1 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-gray-655 transition-all">
                  <X size={18} />
                </button>
              </div>

              <div className="p-4 space-y-6">
                {/* OPERATIONAL SECTION */}
                <div className="space-y-3">

                  <div 
                    onClick={() => setRestoreOpExpanded(!restoreOpExpanded)}
                    className="flex items-center gap-1 text-[11px] font-bold text-gray-600 hover:text-gray-800 cursor-pointer select-none transition-colors"
                  >
                    {restoreOpExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />} Operational
                  </div>
                  {restoreOpExpanded && (
                    <div className="space-y-3">
                      {/* Satellite Index Raster Card */}
                  <div className="border border-gray-100 rounded-xl p-3.5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-gray-700 leading-tight flex items-center gap-1.5">Satellite index raster</div>
                        <span className="text-[11px] text-gray-600">Raw pixel layer from zarr</span>
                      </div>
                      <button
                        onClick={() => setShowRasterLayer(!showRasterLayer)}
                        className="w-9 h-5 rounded-full p-0.5 transition-colors duration-200 shrink-0"
                        style={{ backgroundColor: showRasterLayer ? '#16A34A' : '#E5E7EB' }}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white shadow transform transition-transform duration-200 ${showRasterLayer ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>
                    {showRasterLayer && (
                      <div className="space-y-2 pt-1 border-t border-gray-50">
                        <div className="flex items-center justify-between text-[11px] text-gray-600 font-bold">
                          <span>Opacity</span>
                          <span>{mapOpacity}%</span>
                        </div>
                        <input type="range" min="10" max="100" value={mapOpacity}
                          onChange={e => setMapOpacity(parseInt(e.target.value))}
                          className="w-full h-1.5 bg-gray-100 rounded-full appearance-none cursor-pointer accent-green-600" />
                      </div>
                    )}
                  </div>
                      {/* Farm Boundaries Card */}
                  <div className="border border-gray-100 rounded-xl p-3.5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-gray-700 leading-tight flex items-center gap-1.5">Farm Boundaries {renderInfoTooltip("Farm Boundaries")}</div>
                        <span className="text-[11px] text-gray-600">Plot perimeter outlines</span>
                      </div>
                      <button
                        onClick={() => setRestoreShowBoundaries(!restoreShowBoundaries)}
                        className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 shrink-0 ${
                          restoreShowBoundaries ? 'bg-green-600' : 'bg-gray-200'
                        }`}
                        style={{ backgroundColor: restoreShowBoundaries ? '#16A34A' : '#E5E7EB' }}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white shadow transform transition-transform duration-200 ${
                          restoreShowBoundaries ? 'translate-x-4' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>
                    {restoreShowBoundaries && (
                      <div className="space-y-2 pt-1 border-t border-gray-50">
                        <div className="flex items-center justify-between text-[11px] text-gray-600 font-bold">
                          <span>Opacity</span>
                          <span>{restoreBoundariesOpacity}%</span>
                        </div>
                        <input type="range" min="10" max="100" value={restoreBoundariesOpacity}
                          onChange={e => setRestoreBoundariesOpacity(parseInt(e.target.value))}
                          className="w-full h-1.5 bg-gray-100 rounded-full appearance-none cursor-pointer accent-green-600" />
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="w-4 h-4 rounded-sm bg-[#000000] shrink-0" />
                          <span className="text-[11px] font-semibold text-gray-500">Block boundary</span>
                        </div>
                      </div>
                    )}
                  </div>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <div
                    onClick={() => setRestoreEcoExpanded(!restoreEcoExpanded)}
                    className="flex items-center gap-1 text-[11px] font-bold text-gray-600 hover:text-gray-800 cursor-pointer select-none transition-colors"
                  >
                    {restoreEcoExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />} Ecological
                  </div>
                  {restoreEcoExpanded && (
                    <div className="space-y-3">
                  <div className="border border-gray-100 rounded-xl p-3.5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div><div className="text-xs font-bold text-gray-700 leading-tight flex items-center gap-1.5">Restoration Progress {renderInfoTooltip("Restoration Progress")}</div><span className="text-[11px] text-gray-600">Area rehabilitation status</span></div>
                      <button onClick={() => setRestoreShowProgress(!restoreShowProgress)} className="w-9 h-5 rounded-full p-0.5 transition-colors duration-200 shrink-0" style={{ backgroundColor: restoreShowProgress ? '#16A34A' : '#E5E7EB' }}>
                        <div style={{ transform: restoreShowProgress ? 'translateX(16px)' : 'translateX(0)' }} className="w-4 h-4 rounded-full bg-white shadow transition-transform duration-200" />
                      </button>
                    </div>
                    {restoreShowProgress && (
                      <div className="space-y-1.5 pt-1 border-t border-gray-50">
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#15803d'}}/><span className="text-[11px] font-semibold text-gray-500">&gt;75% Complete</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#84cc16'}}/><span className="text-[11px] font-semibold text-gray-500">50-75%</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#fbbf24'}}/><span className="text-[11px] font-semibold text-gray-500">25-50%</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#dc2626'}}/><span className="text-[11px] font-semibold text-gray-500">&lt;25%</span></div>
                      </div>
                    )}
                  </div>                        <div className="border border-gray-100 rounded-xl p-3.5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div><div className="text-xs font-bold text-gray-700 leading-tight flex items-center gap-1.5">Survival Rate {renderInfoTooltip("Survival Rate")}</div><span className="text-[11px] text-gray-600">Planted species survival</span></div>
                      <button onClick={() => setRestoreShowSurvival(!restoreShowSurvival)} className="w-9 h-5 rounded-full p-0.5 transition-colors duration-200 shrink-0" style={{ backgroundColor: restoreShowSurvival ? '#16A34A' : '#E5E7EB' }}>
                        <div style={{ transform: restoreShowSurvival ? 'translateX(16px)' : 'translateX(0)' }} className="w-4 h-4 rounded-full bg-white shadow transition-transform duration-200" />
                      </button>
                    </div>
                    {restoreShowSurvival && (
                      <div className="space-y-1.5 pt-1 border-t border-gray-50">
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#15803d'}}/><span className="text-[11px] font-semibold text-gray-500">&gt;85% Survival</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#84cc16'}}/><span className="text-[11px] font-semibold text-gray-500">70-85%</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#fbbf24'}}/><span className="text-[11px] font-semibold text-gray-500">50-70%</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#dc2626'}}/><span className="text-[11px] font-semibold text-gray-500">&lt;50%</span></div>
                      </div>
                    )}
                  </div>                        <div className="border border-gray-100 rounded-xl p-3.5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div><div className="text-xs font-bold text-gray-700 leading-tight flex items-center gap-1.5">Carbon Offset {renderInfoTooltip("Carbon Offset")}</div><span className="text-[11px] text-gray-600">Sequestered carbon stock</span></div>
                      <button onClick={() => setRestoreShowCarbon(!restoreShowCarbon)} className="w-9 h-5 rounded-full p-0.5 transition-colors duration-200 shrink-0" style={{ backgroundColor: restoreShowCarbon ? '#16A34A' : '#E5E7EB' }}>
                        <div style={{ transform: restoreShowCarbon ? 'translateX(16px)' : 'translateX(0)' }} className="w-4 h-4 rounded-full bg-white shadow transition-transform duration-200" />
                      </button>
                    </div>
                    {restoreShowCarbon && (
                      <div className="space-y-1.5 pt-1 border-t border-gray-50">
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#1d4ed8'}}/><span className="text-[11px] font-semibold text-gray-500">&gt;10 t CO2e/ha</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#60a5fa'}}/><span className="text-[11px] font-semibold text-gray-500">5-10 t CO2e/ha</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#fbbf24'}}/><span className="text-[11px] font-semibold text-gray-500">2-5 t CO2e/ha</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#dc2626'}}/><span className="text-[11px] font-semibold text-gray-500">&lt;2 t CO2e/ha</span></div>
                      </div>
                    )}
                  </div>                        <div className="border border-gray-100 rounded-xl p-3.5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div><div className="text-xs font-bold text-gray-700 leading-tight flex items-center gap-1.5">Biodiversity {renderInfoTooltip("Biodiversity")}</div><span className="text-[11px] text-gray-600">Species richness index</span></div>
                      <button onClick={() => setRestoreShowBiodiversity(!restoreShowBiodiversity)} className="w-9 h-5 rounded-full p-0.5 transition-colors duration-200 shrink-0" style={{ backgroundColor: restoreShowBiodiversity ? '#16A34A' : '#E5E7EB' }}>
                        <div style={{ transform: restoreShowBiodiversity ? 'translateX(16px)' : 'translateX(0)' }} className="w-4 h-4 rounded-full bg-white shadow transition-transform duration-200" />
                      </button>
                    </div>
                    {restoreShowBiodiversity && (
                      <div className="space-y-1.5 pt-1 border-t border-gray-50">
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#15803d'}}/><span className="text-[11px] font-semibold text-gray-500">High</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#84cc16'}}/><span className="text-[11px] font-semibold text-gray-500">Moderate</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#fbbf24'}}/><span className="text-[11px] font-semibold text-gray-500">Low</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#dc2626'}}/><span className="text-[11px] font-semibold text-gray-500">Very low</span></div>
                      </div>
                    )}
                  </div>                        <div className="border border-gray-100 rounded-xl p-3.5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div><div className="text-xs font-bold text-gray-700 leading-tight flex items-center gap-1.5">AGB {renderInfoTooltip("AGB")}</div><span className="text-[11px] text-gray-600">Above-Ground Biomass</span></div>
                      <button onClick={() => setRestoreShowAgb(!restoreShowAgb)} className="w-9 h-5 rounded-full p-0.5 transition-colors duration-200 shrink-0" style={{ backgroundColor: restoreShowAgb ? '#16A34A' : '#E5E7EB' }}>
                        <div style={{ transform: restoreShowAgb ? 'translateX(16px)' : 'translateX(0)' }} className="w-4 h-4 rounded-full bg-white shadow transition-transform duration-200" />
                      </button>
                    </div>
                    {restoreShowAgb && (
                      <div className="space-y-1.5 pt-1 border-t border-gray-50">
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#166534'}}/><span className="text-[11px] font-semibold text-gray-500">&gt;200 t/ha</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#22c55e'}}/><span className="text-[11px] font-semibold text-gray-500">100-200 t/ha</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#fbbf24'}}/><span className="text-[11px] font-semibold text-gray-500">50-100 t/ha</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#ef4444'}}/><span className="text-[11px] font-semibold text-gray-500">&lt;50 t/ha</span></div>
                      </div>
                    )}
                  </div>                        <div className="border border-gray-100 rounded-xl p-3.5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div><div className="text-xs font-bold text-gray-700 leading-tight flex items-center gap-1.5">InSAR Coherence {renderInfoTooltip("InSAR Coherence")}</div><span className="text-[11px] text-gray-600">SAR interferometric coherence</span></div>
                      <button onClick={() => setRestoreShowInSar(!restoreShowInSar)} className="w-9 h-5 rounded-full p-0.5 transition-colors duration-200 shrink-0" style={{ backgroundColor: restoreShowInSar ? '#16A34A' : '#E5E7EB' }}>
                        <div style={{ transform: restoreShowInSar ? 'translateX(16px)' : 'translateX(0)' }} className="w-4 h-4 rounded-full bg-white shadow transition-transform duration-200" />
                      </button>
                    </div>
                    {restoreShowInSar && (
                      <div className="space-y-1.5 pt-1 border-t border-gray-50">
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#1d4ed8'}}/><span className="text-[11px] font-semibold text-gray-500">High (0.8-1.0)</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#60a5fa'}}/><span className="text-[11px] font-semibold text-gray-500">Good (0.6-0.8)</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#fbbf24'}}/><span className="text-[11px] font-semibold text-gray-500">Moderate (0.4-0.6)</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#dc2626'}}/><span className="text-[11px] font-semibold text-gray-500">Low ({'<'}0.4)</span></div>
                      </div>
                    )}
                  </div>                        <div className="border border-gray-100 rounded-xl p-3.5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div><div className="text-xs font-bold text-gray-700 leading-tight flex items-center gap-1.5">GEDI Canopy {renderInfoTooltip("GEDI Canopy")}</div><span className="text-[11px] text-gray-600">LiDAR canopy height</span></div>
                      <button onClick={() => setRestoreShowGedi(!restoreShowGedi)} className="w-9 h-5 rounded-full p-0.5 transition-colors duration-200 shrink-0" style={{ backgroundColor: restoreShowGedi ? '#16A34A' : '#E5E7EB' }}>
                        <div style={{ transform: restoreShowGedi ? 'translateX(16px)' : 'translateX(0)' }} className="w-4 h-4 rounded-full bg-white shadow transition-transform duration-200" />
                      </button>
                    </div>
                    {restoreShowGedi && (
                      <div className="space-y-1.5 pt-1 border-t border-gray-50">
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#166534'}}/><span className="text-[11px] font-semibold text-gray-500">&gt;30m</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#22c55e'}}/><span className="text-[11px] font-semibold text-gray-500">20-30m</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#fbbf24'}}/><span className="text-[11px] font-semibold text-gray-500">10-20m</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#ef4444'}}/><span className="text-[11px] font-semibold text-gray-500">&lt;10m</span></div>
                      </div>
                    )}
                  </div>
                    </div>
                  )}
                </div>                      <div className="space-y-3">
                  <div
                    onClick={() => setRestoreLulcExpanded(!restoreLulcExpanded)}
                    className="flex items-center gap-1 text-[11px] font-bold text-gray-600 hover:text-gray-800 cursor-pointer select-none transition-colors"
                  >
                    {restoreLulcExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />} LULC
                  </div>
                  {restoreLulcExpanded && (
                    <div className="space-y-3">
                  {/* Was a static hardcoded legend (High/Moderate/Low/Dry)
                      independent of the real backend classification —
                      same staleness risk as moisture-content's old SMI
                      card. Reuses the real single-index card instead. */}
                  {(() => {
                    const ndwiEntry = legendEntries.find(e => e.key === 'ndwi');
                    return ndwiEntry ? renderLegendCard(ndwiEntry) : null;
                  })()}
                  <div className="border border-gray-100 rounded-xl p-3.5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div><div className="text-xs font-bold text-gray-700 leading-tight flex items-center gap-1.5">LULC {renderInfoTooltip("LULC")}</div><span className="text-[11px] text-gray-600">Land Use / Land Cover</span></div>
                      <button onClick={() => setRestoreShowLulc(!restoreShowLulc)} className="w-9 h-5 rounded-full p-0.5 transition-colors duration-200 shrink-0" style={{ backgroundColor: restoreShowLulc ? '#16A34A' : '#E5E7EB' }}>
                        <div style={{ transform: restoreShowLulc ? 'translateX(16px)' : 'translateX(0)' }} className="w-4 h-4 rounded-full bg-white shadow transition-transform duration-200" />
                      </button>
                    </div>
                    {restoreShowLulc && (
                      <div className="space-y-1.5 pt-1 border-t border-gray-50">
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#15803d'}}/><span className="text-[11px] font-semibold text-gray-500">Forest</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#84cc16'}}/><span className="text-[11px] font-semibold text-gray-500">Cropland</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#fbbf24'}}/><span className="text-[11px] font-semibold text-gray-500">Grassland</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#6b7280'}}/><span className="text-[11px] font-semibold text-gray-500">Urban</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#1d4ed8'}}/><span className="text-[11px] font-semibold text-gray-500">Water</span></div>
                      </div>
                    )}
                  </div>                        <div className="border border-gray-100 rounded-xl p-3.5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div><div className="text-xs font-bold text-gray-700 leading-tight flex items-center gap-1.5">LULC Change {renderInfoTooltip("LULC Change")}</div><span className="text-[11px] text-gray-600">ESA WorldCover, real detected transitions</span></div>
                      <button onClick={() => setRestoreShowLulcChange(!restoreShowLulcChange)} className="w-9 h-5 rounded-full p-0.5 transition-colors duration-200 shrink-0" style={{ backgroundColor: restoreShowLulcChange ? '#16A34A' : '#E5E7EB' }}>
                        <div style={{ transform: restoreShowLulcChange ? 'translateX(16px)' : 'translateX(0)' }} className="w-4 h-4 rounded-full bg-white shadow transition-transform duration-200" />
                      </button>
                    </div>
                    {restoreShowLulcChange && (
                      <div className="space-y-1.5 pt-1 border-t border-gray-50">
                        {landUseChangeLoading ? (
                          <span className="text-[11px] font-semibold text-gray-600">Loading…</span>
                        ) : !landUseChange ? (
                          <span className="text-[11px] font-semibold text-gray-600">No ESA WorldCover coverage available for this farm yet.</span>
                        ) : (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-semibold text-gray-500">{landUseChange.compared_years?.[0]} → {landUseChange.compared_years?.[1]}</span>
                              <span className="text-[11px] font-bold text-gray-700">{landUseChange.changed_pct}% changed</span>
                            </div>
                            {(landUseChange.top_transitions || []).slice(0, 5).map((t, i) => (
                              <div key={i} className="flex items-center justify-between gap-2">
                                <span className="text-[11px] font-semibold text-gray-500 truncate">{t.transition}</span>
                                <span className="text-[11px] font-bold text-gray-600 shrink-0">{t.area_pct}%</span>
                              </div>
                            ))}
                            {(!landUseChange.top_transitions || landUseChange.top_transitions.length === 0) && (
                              <span className="text-[11px] font-semibold text-gray-600">No significant transitions detected.</span>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                    </div>
                  )}
                </div>                      <div className="space-y-3">
                  <div
                    onClick={() => setRestoreEudrExpanded(!restoreEudrExpanded)}
                    className="flex items-center gap-1 text-[11px] font-bold text-gray-600 hover:text-gray-800 cursor-pointer select-none transition-colors"
                  >
                    {restoreEudrExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />} EUDR
                  </div>
                  {restoreEudrExpanded && (
                    <div className="space-y-3">
                  <div className="border border-gray-100 rounded-xl p-3.5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div><div className="text-xs font-bold text-gray-700 leading-tight flex items-center gap-1.5">EUDR Compliance {renderInfoTooltip("EUDR Compliance")}</div><span className="text-[11px] text-gray-600">EU Deforestation Regulation status</span></div>
                      <button onClick={() => setRestoreShowEudr(!restoreShowEudr)} className="w-9 h-5 rounded-full p-0.5 transition-colors duration-200 shrink-0" style={{ backgroundColor: restoreShowEudr ? '#16A34A' : '#E5E7EB' }}>
                        <div style={{ transform: restoreShowEudr ? 'translateX(16px)' : 'translateX(0)' }} className="w-4 h-4 rounded-full bg-white shadow transition-transform duration-200" />
                      </button>
                    </div>
                    {restoreShowEudr && (
                      <div className="space-y-1.5 pt-1 border-t border-gray-50">
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#15803d'}}/><span className="text-[11px] font-semibold text-gray-500">Compliant</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#fbbf24'}}/><span className="text-[11px] font-semibold text-gray-500">At risk</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#dc2626'}}/><span className="text-[11px] font-semibold text-gray-500">Non-Compliant</span></div>
                      </div>
                    )}
                  </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}



        </div>

        {/* ══ BOTTOM PANEL ══ */}
        {renderMapBottomPanel(selectedIndex)}
      </div>
  );
}
