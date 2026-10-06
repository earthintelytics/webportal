import { ChevronDown, ChevronRight, Layers, X } from 'lucide-react';
import { FitBoundsToPlots, FitToZarrBounds, MapPaneClipSetter, ResizeMap, SwipeSliderOverlay } from '../../dashboard/map/MapHelpers';
import { MapContainer, Pane, TileLayer, ZoomControl } from 'react-leaflet';
import PlotDetailPanel from '../../PlotDetailPanel';
import PlotSearchSelector from '../../PlotSearchSelector';

/** The parcel / intelligence layers map page of the crop and service dashboard (moved out of CropDashboardLayout). */
export default function ParcelMapPage({ basemapAttribution, basemapMaxNativeZoom, basemapUrl, currentTileUrl, currentTileUrlB, currentTimelineA, currentTimelineB, dashboardFilterKeys, defaultMapCenter, dynamicFilterValues, effectiveSensor, farmBoundary, filterEstate, filteredPlotsData, handlePlotClick, handleSplitDragStart, intelBoundariesOpacity, intelOpExpanded, intelShowBoundaries, intelShowLayers, isCompareMode, mapOpacity, pixelTimeseries, plotsData, plotsDataA, plotsDataB, rasterOverlayBounds, renderFloatingBasemapSelector, renderInfoTooltip, renderIntelPolygons, renderMapBottomPanel, selectedIndex, selectedPlot, setDynamicFilterValues, setIntelBoundariesOpacity, setIntelOpExpanded, setIntelShowBoundaries, setIntelShowLayers, setMapOpacity, setSelectedPlot, setShowRasterLayer, showRasterLayer, splitPosition, tileRefreshing, zarrBounds }) {
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
                    leftPaneName="left-pane-intel"
                    rightPaneName="right-pane-intel"
                    splitPosition={splitPosition}
                    isCompareMode={isCompareMode}
                  />
                  <Pane name="left-pane-intel" style={{ zIndex: 500 }}>
                    {showRasterLayer && currentTileUrl && (
                      <TileLayer key={`a-${currentTileUrl}`} url={currentTileUrl} opacity={mapOpacity / 100} bounds={rasterOverlayBounds || undefined} maxZoom={22} maxNativeZoom={18} />
                    )}
                    {renderIntelPolygons(plotsDataA, 'left')}
                  </Pane>
                  <Pane name="right-pane-intel" style={{ zIndex: 501 }}>
                    {showRasterLayer && currentTileUrlB && (
                      <TileLayer key={`b-${currentTileUrlB}`} url={currentTileUrlB} opacity={mapOpacity / 100} bounds={rasterOverlayBounds || undefined} maxZoom={22} maxNativeZoom={18} />
                    )}
                    {renderIntelPolygons(plotsDataB, 'right')}
                  </Pane>
                </>
              ) : (
                renderIntelPolygons(filteredPlotsData)
              )}
              {null}
              <FitBoundsToPlots plotsData={filteredPlotsData} farmBoundary={farmBoundary} refitKey={filterEstate} />
              <FitToZarrBounds zarrBounds={zarrBounds} />
              <ZoomControl position="bottomright" />
              <ResizeMap trigger={intelShowLayers} />
            </MapContainer>

            {!isCompareMode && (
              <div className="absolute top-2 left-2 z-[1000] flex flex-col gap-2 items-start">
                <PlotSearchSelector plotsData={plotsData} onSelect={handlePlotClick} />
                {dashboardFilterKeys.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {dashboardFilterKeys.map(key => {
                      const options = [...new Set(plotsData.map(p => p.filters?.[key]).filter(v => v != null && v !== ''))];
                      if (options.length === 0) return null;
                      return (
                        <select
                          key={key}
                          value={dynamicFilterValues[key] || 'All'}
                          onChange={e => setDynamicFilterValues(v => ({ ...v, [key]: e.target.value }))}
                          className="text-[11px] font-bold text-gray-700 bg-white border border-gray-300 rounded-lg px-2 py-1.5 shadow-sm"
                        >
                          <option value="All">{key}: All</option>
                          {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            {!isCompareMode && selectedPlot && (
              <PlotDetailPanel
                plot={selectedPlot}
                series={pixelTimeseries}
                indexLabel={selectedIndex}
                dashboardFilterKeys={dashboardFilterKeys}
                onClose={() => setSelectedPlot(null)}
              />
            )}

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
              onClick={() => setIntelShowLayers(!intelShowLayers)}
              className={`absolute top-4 right-4 bg-white border p-3 rounded-2xl shadow-xl hover:bg-gray-50 flex items-center gap-2 font-bold text-xs transition-all active:scale-95 ${
                intelShowLayers ? 'text-green-700 border-green-200 bg-green-50 shadow-inner' : 'text-gray-700 border-gray-200 bg-white'
              }`}
              style={{ zIndex: 40000 }}
            >
              <Layers size={16} className={intelShowLayers ? 'text-green-600' : 'text-gray-600'} />
              Map layers
            </button>

            {/* Plot detail panel (over map) */}
            {null}
          </div>

          {/* ═══ RIGHT MAP LAYERS SIDEBAR ═══ */}
          {intelShowLayers && (
            <div className="w-[280px] bg-white border-l border-gray-100 flex flex-col shrink-0 overflow-y-auto z-10 shadow-sm">
              {/* Header */}
              <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers size={18} className="text-green-600" />
                  <span className="text-base font-bold text-gray-800 font-sans">Map layers</span>
                </div>
                <button onClick={() => setIntelShowLayers(false)} className="p-1 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-gray-650 transition-all">
                  <X size={18} />
                </button>
              </div>

              <div className="p-4 space-y-6">
                {/* OPERATIONAL SECTION */}
                <div className="space-y-3">

                  <div 
                    onClick={() => setIntelOpExpanded(!intelOpExpanded)}
                    className="flex items-center gap-1 text-[11px] font-bold text-gray-600 hover:text-gray-800 cursor-pointer select-none transition-colors"
                  >
                    {intelOpExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />} Operational
                  </div>
                  {intelOpExpanded && (
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
                        onClick={() => setIntelShowBoundaries(!intelShowBoundaries)}
                        className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 shrink-0 ${
                          intelShowBoundaries ? 'bg-green-600' : 'bg-gray-200'
                        }`}
                        style={{ backgroundColor: intelShowBoundaries ? '#16A34A' : '#E5E7EB' }}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white shadow transform transition-transform duration-200 ${
                          intelShowBoundaries ? 'translate-x-4' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>
                    {intelShowBoundaries && (
                      <div className="space-y-2 pt-1 border-t border-gray-50">
                        <div className="flex items-center justify-between text-[11px] text-gray-600 font-bold">
                          <span>Opacity</span>
                          <span>{intelBoundariesOpacity}%</span>
                        </div>
                        <input type="range" min="10" max="100" value={intelBoundariesOpacity}
                          onChange={e => setIntelBoundariesOpacity(parseInt(e.target.value))}
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
              </div>
            </div>
          )}

        </div>

        {/* ══ BOTTOM PANEL ══ */}
        {renderMapBottomPanel(selectedIndex, null, false)}
      </div>
  );
}
