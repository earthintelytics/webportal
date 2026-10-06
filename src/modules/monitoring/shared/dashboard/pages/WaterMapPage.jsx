import { ChevronDown, ChevronRight, Layers, X } from 'lucide-react';
import { FitBoundsToPlots, FitToZarrBounds, MapPaneClipSetter, ResizeMap, SwipeSliderOverlay } from '../../dashboard/map/MapHelpers';
import { MapContainer, Pane, TileLayer, ZoomControl } from 'react-leaflet';


/** The water and moisture map page of the crop and service dashboard (moved out of CropDashboardLayout). */
export default function WaterMapPage({ basemapAttribution, basemapMaxNativeZoom, basemapUrl, currentTileUrl, currentTileUrlB, currentTimelineA, currentTimelineB, defaultMapCenter, farmBoundary, filterEstate, handleSplitDragStart, isCompareMode, mapOpacity, moistureBoundariesOpacity, moistureOpExpanded, moisturePlotsData, moisturePlotsDataA, moisturePlotsDataB, moistureShowBoundaries, moistureShowLayers, plotsData, rasterOverlayBounds, renderFloatingBasemapSelector, renderLegendCards, renderMapBottomPanel, renderMoisturePolygons, selectedIndex, setMapOpacity, setMoistureBoundariesOpacity, setMoistureOpExpanded, setMoistureShowBoundaries, setMoistureShowLayers, setShowRasterLayer, showRasterLayer, splitPosition, tileRefreshing, zarrBounds }) {
  return (
    <div className="flex flex-col h-full">

      {/* ── Top area: Map + Right Legend sidebar ── */}
      <div className="flex flex-1 min-h-0">

        {/* ═══ MAP ═══ */}
        <div className="flex-1 relative min-w-0 map-wrapper-pane">
          {tileRefreshing && currentTileUrl && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-1.5 bg-black/60 text-white text-[11px] font-semibold px-3 py-1.5 rounded-full pointer-events-none">
              <svg className="animate-spin h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
              Loading {(selectedIndex || 'SMI').toUpperCase()} · S1 SAR…
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
                  leftPaneName="left-pane-moisture"
                  rightPaneName="right-pane-moisture"
                  splitPosition={splitPosition}
                  isCompareMode={isCompareMode}
                />
                <Pane name="left-pane-moisture" style={{ zIndex: 500 }}>
                  {showRasterLayer && currentTileUrl && (
                    <TileLayer key={`a-${currentTileUrl}`} url={currentTileUrl} opacity={mapOpacity / 100} bounds={rasterOverlayBounds || undefined} maxZoom={22} maxNativeZoom={18} />
                  )}
                  {renderMoisturePolygons(moisturePlotsDataA, 'left')}
                </Pane>
                <Pane name="right-pane-moisture" style={{ zIndex: 501 }}>
                  {showRasterLayer && currentTileUrlB && (
                    <TileLayer key={`b-${currentTileUrlB}`} url={currentTileUrlB} opacity={mapOpacity / 100} bounds={rasterOverlayBounds || undefined} maxZoom={22} maxNativeZoom={18} />
                  )}
                  {renderMoisturePolygons(moisturePlotsDataB, 'right')}
                </Pane>
              </>
            ) : (
              renderMoisturePolygons(moisturePlotsData)
            )}
            <FitBoundsToPlots plotsData={plotsData} farmBoundary={farmBoundary} refitKey={filterEstate} />
            <FitToZarrBounds zarrBounds={zarrBounds} />
            <ZoomControl position="bottomright" />
            <ResizeMap trigger={moistureShowLayers} />
          </MapContainer>

          <SwipeSliderOverlay
            isCompareMode={isCompareMode}
            splitPosition={splitPosition}
            currentTimelineA={currentTimelineA}
            currentTimelineB={currentTimelineB}
            handleSplitDragStart={handleSplitDragStart}
          />

          {renderFloatingBasemapSelector()}

          <button
            onClick={() => setMoistureShowLayers(!moistureShowLayers)}
            className={`absolute top-4 right-4 bg-white border p-3 rounded-2xl shadow-xl hover:bg-gray-55 flex items-center gap-2 font-bold text-xs transition-all active:scale-95 ${
              moistureShowLayers ? 'text-green-700 border-green-200 bg-green-50 shadow-inner' : 'text-gray-700 border-gray-200 bg-white'
            }`}
            style={{ zIndex: 40000 }}
          >
            <Layers size={16} className={moistureShowLayers ? 'text-green-600' : 'text-gray-600'} />
            Map layers
          </button>
        </div>

        {/* ═══ RIGHT MAP LAYERS SIDEBAR ═══ */}
        {moistureShowLayers && (
          <div className="w-[280px] bg-white border-l border-gray-100 flex flex-col shrink-0 overflow-y-auto z-10 shadow-sm animate-in slide-in-from-right duration-300">
            <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers size={18} className="text-green-600" />
                <span className="text-base font-bold text-gray-800 font-sans">Map layers</span>
              </div>
              <button onClick={() => setMoistureShowLayers(false)} className="p-1 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-gray-655 transition-all">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 space-y-6">
              <div className="space-y-3">
                <div 
                  onClick={() => setMoistureOpExpanded(!moistureOpExpanded)}
                  className="flex items-center gap-1 text-[11px] font-bold text-gray-600 hover:text-gray-800 cursor-pointer select-none transition-colors"
                >
                  {moistureOpExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />} Operational
                </div>
                {moistureOpExpanded && (
                  <div className="space-y-3">
                    <div className="border border-gray-100 rounded-xl p-3.5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-gray-700 leading-tight flex items-center gap-1.5">Moisture index raster</div>
                          <span className="text-[11px] text-gray-600">Raw SMI pixels from Zarr</span>
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

                    <div className="border border-gray-100 rounded-xl p-3.5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-gray-700 leading-tight flex items-center gap-1.5">Farm boundaries</div>
                          <span className="text-[11px] text-gray-600">Plot perimeter outlines</span>
                        </div>
                        <button
                          onClick={() => setMoistureShowBoundaries(!moistureShowBoundaries)}
                          className="w-9 h-5 rounded-full p-0.5 transition-colors duration-200 shrink-0"
                          style={{ backgroundColor: moistureShowBoundaries ? '#16A34A' : '#E5E7EB' }}
                        >
                          <div className={`w-4 h-4 rounded-full bg-white shadow transform transition-transform duration-200 ${moistureShowBoundaries ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                      </div>
                      {moistureShowBoundaries && (
                        <div className="space-y-2 pt-1 border-t border-gray-50">
                          <div className="flex items-center justify-between text-[11px] text-gray-600 font-bold">
                            <span>Opacity</span>
                            <span>{moistureBoundariesOpacity}%</span>
                          </div>
                          <input type="range" min="10" max="100" value={moistureBoundariesOpacity}
                            onChange={e => setMoistureBoundariesOpacity(parseInt(e.target.value))}
                            className="w-full h-1.5 bg-gray-100 rounded-full appearance-none cursor-pointer accent-green-600" />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* No outer "SMI Radar Metrics" wrapper — see comment
                  on the crop-health / intelligence-layers sections. */}
              {/* Moisture Content live legend cards grouped into Vegetation Moisture and Ground Moisture */}
              {renderLegendCards(['Vegetation Moisture', 'Ground Moisture'])}
            </div>
          </div>
        )}
      </div>

      {/* ══ BOTTOM PANEL ══ */}
      {renderMapBottomPanel(selectedIndex)}
    </div>
  );
}
