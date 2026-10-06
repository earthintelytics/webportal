import { useState } from 'react';
import MapLayersPanel from '../map/MapLayersPanel';
import { Layers } from 'lucide-react';
import { FitBoundsToPlots, FitToZarrBounds, MapPaneClipSetter, ResizeMap, SwipeSliderOverlay } from '../../dashboard/map/MapHelpers';
import { MapContainer, Pane, TileLayer, ZoomControl } from 'react-leaflet';

/** The weather and climate page of the crop and service dashboard (moved out of CropDashboardLayout). */
export default function WeatherPage({ setShowRasterLayer, setMapOpacity, cropType, basemapAttribution, basemapMaxNativeZoom, basemapUrl, climateBoundariesOpacity, climatePlotsData, climatePlotsDataA, climatePlotsDataB, climateShowBoundaries, climateShowLayers, currentTileUrl, currentTileUrlB, currentTimelineA, currentTimelineB, defaultMapCenter, farmBoundary, filterEstate, handleSplitDragStart, isCompareMode, mapOpacity, plotsData, rasterOverlayBounds, renderClimatePolygons, renderFloatingBasemapSelector, renderMapBottomPanel, selectedIndex, setClimateBoundariesOpacity, setClimateShowBoundaries, setClimateShowLayers, showRasterLayer, splitPosition, tileRefreshing, zarrBounds }) {
  const [colourBy, setColourBy] = useState(null);
  // Only results that exist for at least one of the blocks are offered.
  const colourOptions = [
    { id: 'rain', label: 'Rain', layer: 'rain', field: 'rainfall', text: 'Rain over the last month' },
    { id: 'heat', label: 'Surface heat', layer: 'heat', field: 'lst', text: 'Ground surface temperature from the latest satellite pass' },
  ].filter((o) => (climatePlotsData || []).some((p) => p[o.field] != null));
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
                    leftPaneName="left-pane-climate"
                    rightPaneName="right-pane-climate"
                    splitPosition={splitPosition}
                    isCompareMode={isCompareMode}
                  />
                  <Pane name="left-pane-climate" style={{ zIndex: 500 }}>
                    {showRasterLayer && currentTileUrl && (
                      <TileLayer key={`a-${currentTileUrl}`} url={currentTileUrl} opacity={mapOpacity / 100} bounds={rasterOverlayBounds || undefined} maxZoom={22} maxNativeZoom={18} />
                    )}
                    {renderClimatePolygons(climatePlotsDataA, 'left', colourBy)}
                  </Pane>
                  <Pane name="right-pane-climate" style={{ zIndex: 501 }}>
                    {showRasterLayer && currentTileUrlB && (
                      <TileLayer key={`b-${currentTileUrlB}`} url={currentTileUrlB} opacity={mapOpacity / 100} bounds={rasterOverlayBounds || undefined} maxZoom={22} maxNativeZoom={18} />
                    )}
                    {renderClimatePolygons(climatePlotsDataB, 'right', colourBy)}
                  </Pane>
                </>
              ) : (
                renderClimatePolygons(climatePlotsData, '', colourBy)
              )}
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

                        <button type="button"
              onClick={() => setClimateShowLayers(!climateShowLayers)}
              aria-pressed={climateShowLayers}
              className={`absolute top-4 right-4 z-[1000] flex items-center gap-2 px-3 py-2 rounded-xl border bg-white text-sm font-semibold ${climateShowLayers ? 'border-green-600 text-green-800' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              <Layers size={16} className="text-green-700" />
              Map layers
            </button>

          </div>

          {/* Map layers */}
          {climateShowLayers && (
            <MapLayersPanel
              onClose={() => setClimateShowLayers(false)}
              cropType={cropType}
              unit="blocks"
              satellite={{ on: showRasterLayer, onChange: setShowRasterLayer, opacity: mapOpacity, setOpacity: setMapOpacity, text: 'Colours from the satellite image of the selected date' }}
              outlines={{ on: climateShowBoundaries, onChange: setClimateShowBoundaries, opacity: climateBoundariesOpacity, setOpacity: setClimateBoundariesOpacity }}
              colourBy={{ value: colourBy, onChange: setColourBy, options: colourOptions, empty: 'No weather readings per block yet. They appear after the next monitoring run.' }}
             />
          )}

        </div>

        {/* ══ BOTTOM PANEL ══ */}
        {renderMapBottomPanel(selectedIndex)}
      </div>
  );
}
