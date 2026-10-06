import LayerLegend from '../legends/LayerLegend';
import { ChevronDown, ChevronRight, Layers, X } from 'lucide-react';
import { FitBoundsToPlots, FitToZarrBounds, MapPaneClipSetter, ResizeMap, SwipeSliderOverlay } from '../../dashboard/map/MapHelpers';
import { MapContainer, Pane, TileLayer, ZoomControl } from 'react-leaflet';

/** The weather and climate page of the crop and service dashboard (moved out of CropDashboardLayout). */
export default function WeatherPage({ cropType, basemapAttribution, basemapMaxNativeZoom, basemapUrl, climateAtmExpanded, climateBioExpanded, climateBoundariesOpacity, climateOpExpanded, climatePlotsData, climatePlotsDataA, climatePlotsDataB, climateShowBoundaries, climateShowFlood, climateShowLayers, climateShowLst, climateShowRainfall, climateShowSoilTemp, climateShowVaporDeficit, currentTileUrl, currentTileUrlB, currentTimelineA, currentTimelineB, defaultMapCenter, effectiveSensor, farmBoundary, filterEstate, handleSplitDragStart, isCompareMode, mapOpacity, plotsData, rasterOverlayBounds, renderClimatePolygons, renderFloatingBasemapSelector, renderInfoTooltip, renderMapBottomPanel, selectedIndex, setClimateAtmExpanded, setClimateBioExpanded, setClimateBoundariesOpacity, setClimateOpExpanded, setClimateShowBoundaries, setClimateShowFlood, setClimateShowLayers, setClimateShowLst, setClimateShowRainfall, setClimateShowSoilTemp, setClimateShowVaporDeficit, showRasterLayer, splitPosition, tileRefreshing, zarrBounds }) {
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
                    leftPaneName="left-pane-climate"
                    rightPaneName="right-pane-climate"
                    splitPosition={splitPosition}
                    isCompareMode={isCompareMode}
                  />
                  <Pane name="left-pane-climate" style={{ zIndex: 500 }}>
                    {showRasterLayer && currentTileUrl && (
                      <TileLayer key={`a-${currentTileUrl}`} url={currentTileUrl} opacity={mapOpacity / 100} bounds={rasterOverlayBounds || undefined} maxZoom={22} maxNativeZoom={18} />
                    )}
                    {renderClimatePolygons(climatePlotsDataA, 'left')}
                  </Pane>
                  <Pane name="right-pane-climate" style={{ zIndex: 501 }}>
                    {showRasterLayer && currentTileUrlB && (
                      <TileLayer key={`b-${currentTileUrlB}`} url={currentTileUrlB} opacity={mapOpacity / 100} bounds={rasterOverlayBounds || undefined} maxZoom={22} maxNativeZoom={18} />
                    )}
                    {renderClimatePolygons(climatePlotsDataB, 'right')}
                  </Pane>
                </>
              ) : (
                renderClimatePolygons(climatePlotsData)
              )}
              {null}
              <FitBoundsToPlots plotsData={plotsData} farmBoundary={farmBoundary} refitKey={filterEstate} />
              <FitToZarrBounds zarrBounds={zarrBounds} />
              <ZoomControl position="bottomright" />
              <ResizeMap trigger={climateShowLayers} />
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
              onClick={() => setClimateShowLayers(!climateShowLayers)}
              className={`absolute top-4 right-4 bg-white border p-3 rounded-2xl shadow-xl hover:bg-gray-55 flex items-center gap-2 font-bold text-xs transition-all active:scale-95 ${
                climateShowLayers ? 'text-green-700 border-green-200 bg-green-50 shadow-inner' : 'text-gray-700 border-gray-200 bg-white'
              }`}
              style={{ zIndex: 40000 }}
            >
              <Layers size={16} className={climateShowLayers ? 'text-green-600' : 'text-gray-600'} />
              Map layers
            </button>

            {/* Plot detail panel (over map) */}
            {null}
          </div>

          {/* ═══ RIGHT MAP LAYERS SIDEBAR ═══ */}
          {climateShowLayers && (
            <div className="w-[280px] bg-white border-l border-gray-100 flex flex-col shrink-0 overflow-y-auto z-10 shadow-sm animate-in slide-in-from-right duration-300">
              {/* Header */}
              <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers size={18} className="text-green-600" />
                  <span className="text-base font-bold text-gray-800 font-sans">Map layers</span>
                </div>
                <button onClick={() => setClimateShowLayers(false)} className="p-1 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-gray-655 transition-all">
                  <X size={18} />
                </button>
              </div>

              <div className="p-4 space-y-6">
                {/* OPERATIONAL SECTION */}
                <div className="space-y-3">

                  <div 
                    onClick={() => setClimateOpExpanded(!climateOpExpanded)}
                    className="flex items-center gap-1 text-[11px] font-bold text-gray-600 hover:text-gray-800 cursor-pointer select-none transition-colors"
                  >
                    {climateOpExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />} Operational
                  </div>
                  {climateOpExpanded && (
                    <div className="space-y-3">
                      {/* Farm Boundaries Card */}
                  <div className="border border-gray-100 rounded-xl p-3.5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-gray-700 leading-tight flex items-center gap-1.5">Farm Boundaries {renderInfoTooltip("Farm Boundaries")}</div>
                        <span className="text-[11px] text-gray-600">Plot perimeter outlines</span>
                      </div>
                      <button
                        onClick={() => setClimateShowBoundaries(!climateShowBoundaries)}
                        className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 shrink-0 ${
                          climateShowBoundaries ? 'bg-green-600' : 'bg-gray-200'
                        }`}
                        style={{ backgroundColor: climateShowBoundaries ? "var(--brand-primary)" : "#E5E7EB" }}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white shadow transform transition-transform duration-200 ${
                          climateShowBoundaries ? 'translate-x-4' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>
                    {climateShowBoundaries && (
                      <div className="space-y-2 pt-1 border-t border-gray-50">
                        <div className="flex items-center justify-between text-[11px] text-gray-600 font-bold">
                          <span>Opacity</span>
                          <span>{climateBoundariesOpacity}%</span>
                        </div>
                        <input type="range" min="10" max="100" value={climateBoundariesOpacity}
                          onChange={e => setClimateBoundariesOpacity(parseInt(e.target.value))}
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
                    onClick={() => setClimateBioExpanded(!climateBioExpanded)}
                    className="flex items-center gap-1 text-[11px] font-bold text-gray-600 hover:text-gray-800 cursor-pointer select-none transition-colors"
                  >
                    {climateBioExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />} Biophysical
                  </div>
                  {climateBioExpanded && (
                    <div className="space-y-3">
                  <div className="border border-gray-100 rounded-xl p-3.5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div><div className="text-xs font-bold text-gray-700 leading-tight flex items-center gap-1.5">Rainfall {renderInfoTooltip("Rainfall")}</div><span className="text-[11px] text-gray-600">Accumulated precipitation</span></div>
                      <button onClick={() => setClimateShowRainfall(!climateShowRainfall)} className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 shrink-0 ${climateShowRainfall ? "bg-green-600" : "bg-gray-200"}`}>
                        <div style={{ transform: climateShowRainfall ? 'translateX(16px)' : 'translateX(0)' }} className="w-4 h-4 rounded-full bg-white shadow transition-transform duration-200" />
                      </button>
                    </div>
                    {climateShowRainfall && (
                      <LayerLegend layer="rain" crop={cropType} />
                    )}
                  </div>                        <div className="border border-gray-100 rounded-xl p-3.5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div><div className="text-xs font-bold text-gray-700 leading-tight flex items-center gap-1.5">Soil Temperature {renderInfoTooltip("Soil Temperature")}</div><span className="text-[11px] text-gray-600">Near-surface soil temperature</span></div>
                      <button onClick={() => setClimateShowSoilTemp(!climateShowSoilTemp)} className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 shrink-0 ${climateShowSoilTemp ? "bg-green-600" : "bg-gray-200"}`}>
                        <div style={{ transform: climateShowSoilTemp ? 'translateX(16px)' : 'translateX(0)' }} className="w-4 h-4 rounded-full bg-white shadow transition-transform duration-200" />
                      </button>
                    </div>
                    {climateShowSoilTemp && (
                      <div className="space-y-1.5 pt-1 border-t border-gray-50">
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#dc2626'}}/><span className="text-[11px] font-semibold text-gray-500">&gt;35C Critical</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#f97316'}}/><span className="text-[11px] font-semibold text-gray-500">30-35C High</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#84cc16'}}/><span className="text-[11px] font-semibold text-gray-500">20-30C Optimal</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#1d4ed8'}}/><span className="text-[11px] font-semibold text-gray-500">&lt;20C Cool</span></div>
                      </div>
                    )}
                  </div>
                    </div>
                  )}
                </div>                      <div className="space-y-3">
                  <div
                    onClick={() => setClimateAtmExpanded(!climateAtmExpanded)}
                    className="flex items-center gap-1 text-[11px] font-bold text-gray-600 hover:text-gray-800 cursor-pointer select-none transition-colors"
                  >
                    {climateAtmExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />} Atmospheric
                  </div>
                  {climateAtmExpanded && (
                    <div className="space-y-3">
                  <div className="border border-gray-100 rounded-xl p-3.5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div><div className="text-xs font-bold text-gray-700 leading-tight flex items-center gap-1.5">LST {renderInfoTooltip("LST")}</div><span className="text-[11px] text-gray-600">Land surface temperature</span></div>
                      <button onClick={() => setClimateShowLst(!climateShowLst)} className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 shrink-0 ${climateShowLst ? "bg-green-600" : "bg-gray-200"}`}>
                        <div style={{ transform: climateShowLst ? 'translateX(16px)' : 'translateX(0)' }} className="w-4 h-4 rounded-full bg-white shadow transition-transform duration-200" />
                      </button>
                    </div>
                    {climateShowLst && (
                      <LayerLegend layer="heat" crop={cropType} />
                    )}
                  </div>                        <div className="border border-gray-100 rounded-xl p-3.5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div><div className="text-xs font-bold text-gray-700 leading-tight flex items-center gap-1.5">Vapor Pressure Deficit {renderInfoTooltip("Vapor Pressure Deficit")}</div><span className="text-[11px] text-gray-600">Atmospheric dryness</span></div>
                      <button onClick={() => setClimateShowVaporDeficit(!climateShowVaporDeficit)} className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 shrink-0 ${climateShowVaporDeficit ? "bg-green-600" : "bg-gray-200"}`}>
                        <div style={{ transform: climateShowVaporDeficit ? 'translateX(16px)' : 'translateX(0)' }} className="w-4 h-4 rounded-full bg-white shadow transition-transform duration-200" />
                      </button>
                    </div>
                    {climateShowVaporDeficit && (
                      <div className="space-y-1.5 pt-1 border-t border-gray-50">
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#fbbf24'}}/><span className="text-[11px] font-semibold text-gray-500">&gt;3 kPa High</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#84cc16'}}/><span className="text-[11px] font-semibold text-gray-500">1-3 kPa Moderate</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#1d4ed8'}}/><span className="text-[11px] font-semibold text-gray-500">&lt;1 kPa Low</span></div>
                      </div>
                    )}
                  </div>                        <div className="border border-gray-100 rounded-xl p-3.5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div><div className="text-xs font-bold text-gray-700 leading-tight flex items-center gap-1.5">Flood Risk {renderInfoTooltip("Flood Risk")}</div><span className="text-[11px] text-gray-600">Surface inundation risk</span></div>
                      <button onClick={() => setClimateShowFlood(!climateShowFlood)} className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 shrink-0 ${climateShowFlood ? "bg-green-600" : "bg-gray-200"}`}>
                        <div style={{ transform: climateShowFlood ? 'translateX(16px)' : 'translateX(0)' }} className="w-4 h-4 rounded-full bg-white shadow transition-transform duration-200" />
                      </button>
                    </div>
                    {climateShowFlood && (
                      <div className="space-y-1.5 pt-1 border-t border-gray-50">
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#dc2626'}}/><span className="text-[11px] font-semibold text-gray-500">High risk</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#f97316'}}/><span className="text-[11px] font-semibold text-gray-500">Moderate risk</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#fbbf24'}}/><span className="text-[11px] font-semibold text-gray-500">Low risk</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#15803d'}}/><span className="text-[11px] font-semibold text-gray-500">No risk</span></div>
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
