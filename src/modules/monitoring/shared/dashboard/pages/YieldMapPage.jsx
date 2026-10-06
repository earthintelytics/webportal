import { ChevronDown, ChevronRight, Layers, X } from 'lucide-react';
import { FitBoundsToPlots, FitToZarrBounds, MapPaneClipSetter, ResizeMap, SwipeSliderOverlay } from '../../dashboard/map/MapHelpers';
import { MapContainer, Pane, TileLayer, ZoomControl } from 'react-leaflet';

/** The yield map page of the crop and service dashboard (moved out of CropDashboardLayout). */
export default function YieldMapPage({ basemapAttribution, basemapMaxNativeZoom, basemapUrl, currentTileUrl, currentTileUrlB, currentTimelineA, currentTimelineB, defaultMapCenter, effectiveSensor, farmBoundary, filterEstate, handleSplitDragStart, isCompareMode, mapOpacity, plotsData, rasterOverlayBounds, renderFloatingBasemapSelector, renderInfoTooltip, renderMapBottomPanel, renderYieldPolygons, selectedIndex, setMapOpacity, setShowRasterLayer, setYieldBoundariesOpacity, setYieldOpExpanded, setYieldProdExpanded, setYieldShowBiomass, setYieldShowBoundaries, setYieldShowGrowth, setYieldShowLayers, setYieldShowReadiness, setYieldShowYield, setYieldStatExpanded, showRasterLayer, splitPosition, tileRefreshing, yieldBoundariesOpacity, yieldOpExpanded, yieldPlotsData, yieldPlotsDataA, yieldPlotsDataB, yieldProdExpanded, yieldShowBiomass, yieldShowBoundaries, yieldShowGrowth, yieldShowLayers, yieldShowReadiness, yieldShowYield, yieldStatExpanded, zarrBounds }) {
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
                    leftPaneName="left-pane-yield"
                    rightPaneName="right-pane-yield"
                    splitPosition={splitPosition}
                    isCompareMode={isCompareMode}
                  />
                  <Pane name="left-pane-yield" style={{ zIndex: 500 }}>
                    {showRasterLayer && currentTileUrl && (
                      <TileLayer key={`a-${currentTileUrl}`} url={currentTileUrl} opacity={mapOpacity / 100} bounds={rasterOverlayBounds || undefined} maxZoom={22} maxNativeZoom={18} />
                    )}
                    {renderYieldPolygons(yieldPlotsDataA, 'left')}
                  </Pane>
                  <Pane name="right-pane-yield" style={{ zIndex: 501 }}>
                    {showRasterLayer && currentTileUrlB && (
                      <TileLayer key={`b-${currentTileUrlB}`} url={currentTileUrlB} opacity={mapOpacity / 100} bounds={rasterOverlayBounds || undefined} maxZoom={22} maxNativeZoom={18} />
                    )}
                    {renderYieldPolygons(yieldPlotsDataB, 'right')}
                  </Pane>
                </>
              ) : (
                renderYieldPolygons(yieldPlotsData)
              )}
              {null}
              <FitBoundsToPlots plotsData={plotsData} farmBoundary={farmBoundary} refitKey={filterEstate} />
              <FitToZarrBounds zarrBounds={zarrBounds} />
              <ZoomControl position="bottomright" />
              <ResizeMap trigger={yieldShowLayers} />
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
              onClick={() => setYieldShowLayers(!yieldShowLayers)}
              className={`absolute top-4 right-4 bg-white border p-3 rounded-2xl shadow-xl hover:bg-gray-50 flex items-center gap-2 font-bold text-xs transition-all active:scale-95 ${
                yieldShowLayers ? 'text-green-700 border-green-200 bg-green-50 shadow-inner' : 'text-gray-700 border-gray-200 bg-white'
              }`}
              style={{ zIndex: 40000 }}
            >
              <Layers size={16} className={yieldShowLayers ? 'text-green-600' : 'text-gray-600'} />
              Map layers
            </button>

            {/* Plot detail panel (over map) */}
            {null}
          </div>

          {/* ═══ RIGHT MAP LAYERS SIDEBAR ═══ */}
          {yieldShowLayers && (
            <div className="w-[280px] bg-white border-l border-gray-100 flex flex-col shrink-0 overflow-y-auto z-10 shadow-sm animate-in slide-in-from-right duration-300">
              {/* Header */}
              <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers size={18} className="text-green-600" />
                  <span className="text-base font-bold text-gray-800 font-sans">Map layers</span>
                </div>
                <button onClick={() => setYieldShowLayers(false)} className="p-1 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-gray-650 transition-all">
                  <X size={18} />
                </button>
              </div>

              <div className="p-4 space-y-6">
                {/* OPERATIONAL SECTION */}
                <div className="space-y-3">

                  <div 
                    onClick={() => setYieldOpExpanded(!yieldOpExpanded)}
                    className="flex items-center gap-1 text-[11px] font-bold text-gray-600 hover:text-gray-800 cursor-pointer select-none transition-colors"
                  >
                    {yieldOpExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />} Operational
                  </div>
                  {yieldOpExpanded && (
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
                        onClick={() => setYieldShowBoundaries(!yieldShowBoundaries)}
                        className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 shrink-0 ${
                          yieldShowBoundaries ? 'bg-green-600' : 'bg-gray-200'
                        }`}
                        style={{ backgroundColor: yieldShowBoundaries ? '#16A34A' : '#E5E7EB' }}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white shadow transform transition-transform duration-200 ${
                          yieldShowBoundaries ? 'translate-x-4' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>
                    {yieldShowBoundaries && (
                      <div className="space-y-2 pt-1 border-t border-gray-50">
                        <div className="flex items-center justify-between text-[11px] text-gray-600 font-bold">
                          <span>Opacity</span>
                          <span>{yieldBoundariesOpacity}%</span>
                        </div>
                        <input type="range" min="10" max="100" value={yieldBoundariesOpacity}
                          onChange={e => setYieldBoundariesOpacity(parseInt(e.target.value))}
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
                    onClick={() => setYieldProdExpanded(!yieldProdExpanded)}
                    className="flex items-center gap-1 text-[11px] font-bold text-gray-600 hover:text-gray-800 cursor-pointer select-none transition-colors"
                  >
                    {yieldProdExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />} Production
                  </div>
                  {yieldProdExpanded && (
                    <div className="space-y-3">
                  <div className="border border-gray-100 rounded-xl p-3.5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div><div className="text-xs font-bold text-gray-700 leading-tight flex items-center gap-1.5">Yield Forecast {renderInfoTooltip("Yield Forecast")}</div><span className="text-[11px] text-gray-600">Predicted harvest volume</span></div>
                      <button onClick={() => setYieldShowYield(!yieldShowYield)} className="w-9 h-5 rounded-full p-0.5 transition-colors duration-200 shrink-0" style={{ backgroundColor: yieldShowYield ? '#16A34A' : '#E5E7EB' }}>
                        <div style={{ transform: yieldShowYield ? 'translateX(16px)' : 'translateX(0)' }} className="w-4 h-4 rounded-full bg-white shadow transition-transform duration-200" />
                      </button>
                    </div>
                    {yieldShowYield && (
                      <div className="space-y-1.5 pt-1 border-t border-gray-50">
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#15803d'}}/><span className="text-[11px] font-semibold text-gray-500">High</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#84cc16'}}/><span className="text-[11px] font-semibold text-gray-500">Good</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#eab308'}}/><span className="text-[11px] font-semibold text-gray-500">Average</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#dc2626'}}/><span className="text-[11px] font-semibold text-gray-500">Below average</span></div>
                      </div>
                    )}
                  </div>                        <div className="border border-gray-100 rounded-xl p-3.5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div><div className="text-xs font-bold text-gray-700 leading-tight flex items-center gap-1.5">Biomass {renderInfoTooltip("Biomass")}</div><span className="text-[11px] text-gray-600">Above-ground biomass (EVI-derived)</span></div>
                      <button onClick={() => setYieldShowBiomass(!yieldShowBiomass)} className="w-9 h-5 rounded-full p-0.5 transition-colors duration-200 shrink-0" style={{ backgroundColor: yieldShowBiomass ? '#16A34A' : '#E5E7EB' }}>
                        <div style={{ transform: yieldShowBiomass ? 'translateX(16px)' : 'translateX(0)' }} className="w-4 h-4 rounded-full bg-white shadow transition-transform duration-200" />
                      </button>
                    </div>
                    {yieldShowBiomass && (
                      <div className="space-y-1.5 pt-1 border-t border-gray-50">
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#15803d'}}/><span className="text-[11px] font-semibold text-gray-500">High</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#84cc16'}}/><span className="text-[11px] font-semibold text-gray-500">Moderate</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#fbbf24'}}/><span className="text-[11px] font-semibold text-gray-500">Low</span></div>
                      </div>
                    )}
                  </div>                        <div className="border border-gray-100 rounded-xl p-3.5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div><div className="text-xs font-bold text-gray-700 leading-tight flex items-center gap-1.5">Harvest Readiness {renderInfoTooltip("Harvest Readiness")}</div><span className="text-[11px] text-gray-600">Crop maturity status</span></div>
                      <button onClick={() => setYieldShowReadiness(!yieldShowReadiness)} className="w-9 h-5 rounded-full p-0.5 transition-colors duration-200 shrink-0" style={{ backgroundColor: yieldShowReadiness ? '#16A34A' : '#E5E7EB' }}>
                        <div style={{ transform: yieldShowReadiness ? 'translateX(16px)' : 'translateX(0)' }} className="w-4 h-4 rounded-full bg-white shadow transition-transform duration-200" />
                      </button>
                    </div>
                    {yieldShowReadiness && (
                      <div className="space-y-1.5 pt-1 border-t border-gray-50">
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#15803d'}}/><span className="text-[11px] font-semibold text-gray-500">Ready to harvest</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#fbbf24'}}/><span className="text-[11px] font-semibold text-gray-500">2-4 Weeks</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#dc2626'}}/><span className="text-[11px] font-semibold text-gray-500">Not ready</span></div>
                      </div>
                    )}
                  </div>
                    </div>
                  )}
                </div>                      <div className="space-y-3">
                  <div
                    onClick={() => setYieldStatExpanded(!yieldStatExpanded)}
                    className="flex items-center gap-1 text-[11px] font-bold text-gray-600 hover:text-gray-800 cursor-pointer select-none transition-colors"
                  >
                    {yieldStatExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />} Statistics
                  </div>
                  {yieldStatExpanded && (
                    <div className="space-y-3">
                  <div className="border border-gray-100 rounded-xl p-3.5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div><div className="text-xs font-bold text-gray-700 leading-tight flex items-center gap-1.5">Growth Stage {renderInfoTooltip("Growth Stage")}</div><span className="text-[11px] text-gray-600">Phenological stage classification</span></div>
                      <button onClick={() => setYieldShowGrowth(!yieldShowGrowth)} className="w-9 h-5 rounded-full p-0.5 transition-colors duration-200 shrink-0" style={{ backgroundColor: yieldShowGrowth ? '#16A34A' : '#E5E7EB' }}>
                        <div style={{ transform: yieldShowGrowth ? 'translateX(16px)' : 'translateX(0)' }} className="w-4 h-4 rounded-full bg-white shadow transition-transform duration-200" />
                      </button>
                    </div>
                    {yieldShowGrowth && (
                      <div className="space-y-1.5 pt-1 border-t border-gray-50">
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#60a5fa'}}/><span className="text-[11px] font-semibold text-gray-500">Germination</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#84cc16'}}/><span className="text-[11px] font-semibold text-gray-500">Vegetative</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#eab308'}}/><span className="text-[11px] font-semibold text-gray-500">Flowering</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#f97316'}}/><span className="text-[11px] font-semibold text-gray-500">Fruiting</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#15803d'}}/><span className="text-[11px] font-semibold text-gray-500">Maturity</span></div>
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
