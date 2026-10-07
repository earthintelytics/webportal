import MapLayersPanel from '../map/MapLayersPanel';
import { Layers } from 'lucide-react';
import { FitBoundsToPlots, FitToZarrBounds, MapPaneClipSetter, ResizeMap, SwipeSliderOverlay, ZoomToPlot } from '../../dashboard/map/MapHelpers';
import { MapContainer, Pane, TileLayer, ZoomControl } from 'react-leaflet';
import PlotDetailPanel from '../../PlotDetailPanel';
import PlotSearchSelector from '../../PlotSearchSelector';
import { useState } from 'react';

/** The parcel / intelligence layers map page of the crop and service dashboard (moved out of CropDashboardLayout). */
export default function ParcelMapPage({ alerts, cropType, basemapAttribution, basemapMaxNativeZoom, basemapUrl, currentTileUrl, currentTileUrlB, currentTimelineA, currentTimelineB, dashboardFilterKeys, defaultMapCenter, dynamicFilterValues, farmBoundary, filterEstate, filteredPlotsData, handlePlotClick, handleSplitDragStart, intelBoundariesOpacity, intelShowBoundaries, intelShowLayers, isCompareMode, mapOpacity, pixelTimeseries, plotsData, plotsDataA, plotsDataB, rasterOverlayBounds, renderFloatingBasemapSelector, renderIntelPolygons, renderMapBottomPanel, selectedIndex, selectedPlot, setDynamicFilterValues, setIntelBoundariesOpacity, setIntelShowBoundaries, setIntelShowLayers, setMapOpacity, setSelectedPlot, setShowRasterLayer, showRasterLayer, splitPosition, tileRefreshing, zarrBounds }) {
  const [found, setFound] = useState(null); // block picked in the map search
  return (
      <div className="flex flex-col h-full">

        {/* ── Top area: Map + Right Legend sidebar ── */}
        <div className="flex flex-1 min-h-0">

          {/* ═══ MAP ═══ */}
          <div className="flex-1 relative min-w-0 map-wrapper-pane">
            {tileRefreshing && currentTileUrl && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-1.5 bg-black/60 text-white text-[11px] font-semibold px-3 py-1.5 rounded-full pointer-events-none">
                <svg className="animate-spin h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                Loading the satellite picture…
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
              <FitBoundsToPlots plotsData={filteredPlotsData} farmBoundary={farmBoundary} refitKey={filterEstate} />
              <FitToZarrBounds zarrBounds={zarrBounds} />
              <ZoomControl position="bottomright" />
              <ResizeMap trigger={intelShowLayers} />
              <ZoomToPlot plot={found} />
            </MapContainer>

            {!isCompareMode && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] flex flex-col gap-2 items-center w-[min(420px,calc(100%-2rem))]">
                <PlotSearchSelector plotsData={plotsData} onSelect={(p, lat, lng) => { setFound(p); if (!p.isEstate) handlePlotClick(p, lat, lng); }} />
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
                alerts={alerts}
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

                        <button type="button"
              onClick={() => setIntelShowLayers(!intelShowLayers)}
              aria-pressed={intelShowLayers}
              className={`absolute top-4 right-4 z-[1000] flex items-center gap-2 px-3 py-2 rounded-xl border bg-white text-sm font-semibold ${intelShowLayers ? 'border-green-600 text-green-800' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              <Layers size={16} className="text-green-700" />
              Map layers
            </button>

          </div>

          {/* Map layers */}
          {intelShowLayers && (
            <MapLayersPanel
              onClose={() => setIntelShowLayers(false)}
              cropType={cropType}
              unit="blocks"
              satellite={{ on: showRasterLayer, onChange: setShowRasterLayer, opacity: mapOpacity, setOpacity: setMapOpacity, available: !!currentTileUrl, scale: 'health', text: 'Plant health on the chosen date: green is healthy, red is stressed or bare.' }}
              outlines={{ on: intelShowBoundaries, onChange: setIntelShowBoundaries, opacity: intelBoundariesOpacity, setOpacity: setIntelBoundariesOpacity }}
             />
          )}

        </div>

        {/* ══ BOTTOM PANEL ══ */}
        {renderMapBottomPanel(selectedIndex, null, false)}
      </div>
  );
}
