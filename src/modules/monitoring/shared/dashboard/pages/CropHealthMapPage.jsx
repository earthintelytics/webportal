import MapLayersPanel from '../map/MapLayersPanel';
import { Layers } from 'lucide-react';
import { FitBoundsToPlots, FitToZarrBounds, MapPaneClipSetter, ResizeMap, SwipeSliderOverlay } from '../../dashboard/map/MapHelpers';
import { MapContainer, Pane, TileLayer, ZoomControl } from 'react-leaflet';

/** The crop health map page of the crop and service dashboard (moved out of CropDashboardLayout). */
export default function CropHealthMapPage({ cropType, basemapAttribution, basemapMaxNativeZoom, basemapUrl, currentTileUrl, currentTileUrlB, currentTimelineA, currentTimelineB, defaultMapCenter, farmBoundary, filterEstate, handleSplitDragStart, healthBoundariesOpacity, healthPlotsData, healthPlotsDataA, healthPlotsDataB, healthShowBoundaries, healthShowLayers, isCompareMode, isOrg, mapOpacity, plotsData, rasterOverlayBounds, renderFloatingBasemapSelector, renderHealthPolygons, renderLegendCards, renderMapBottomPanel, selectedIndex, setHealthBoundariesOpacity, setHealthShowBoundaries, setHealthShowLayers, setMapOpacity, setShowRasterLayer, showRasterLayer, splitPosition, tileRefreshing, zarrBounds }) {
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
                    leftPaneName="left-pane-health"
                    rightPaneName="right-pane-health"
                    splitPosition={splitPosition}
                    isCompareMode={isCompareMode}
                  />
                  <Pane name="left-pane-health" style={{ zIndex: 500 }}>
                    {showRasterLayer && currentTileUrl && (
                      <TileLayer key={`a-${currentTileUrl}`} url={currentTileUrl} opacity={mapOpacity / 100} bounds={rasterOverlayBounds || undefined} maxZoom={22} maxNativeZoom={18} />
                    )}
                    {renderHealthPolygons(healthPlotsDataA, 'left')}
                  </Pane>
                  <Pane name="right-pane-health" style={{ zIndex: 501 }}>
                    {showRasterLayer && currentTileUrlB && (
                      <TileLayer key={`b-${currentTileUrlB}`} url={currentTileUrlB} opacity={mapOpacity / 100} bounds={rasterOverlayBounds || undefined} maxZoom={22} maxNativeZoom={18} />
                    )}
                    {renderHealthPolygons(healthPlotsDataB, 'right')}
                  </Pane>
                </>
              ) : (
                renderHealthPolygons(healthPlotsData)
              )}
              <FitBoundsToPlots plotsData={plotsData} farmBoundary={farmBoundary} refitKey={filterEstate} />
              <FitToZarrBounds zarrBounds={zarrBounds} />
              <ZoomControl position="bottomright" />
              <ResizeMap trigger={healthShowLayers} />
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
              onClick={() => setHealthShowLayers(!healthShowLayers)}
              aria-pressed={healthShowLayers}
              className={`absolute top-4 right-4 z-[1000] flex items-center gap-2 px-3 py-2 rounded-xl border bg-white text-sm font-semibold ${healthShowLayers ? 'border-green-600 text-green-800' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              <Layers size={16} className="text-green-700" />
              Map layers
            </button>

          </div>

          {/* Map layers */}
          {healthShowLayers && (
            <MapLayersPanel
              onClose={() => setHealthShowLayers(false)}
              cropType={cropType}
              unit="blocks"
              satellite={{ on: showRasterLayer, onChange: setShowRasterLayer, opacity: mapOpacity, setOpacity: setMapOpacity, text: 'Colours from the satellite image of the selected date' }}
              outlines={{ on: healthShowBoundaries, onChange: setHealthShowBoundaries, opacity: healthBoundariesOpacity, setOpacity: setHealthBoundariesOpacity }}
            >
              {renderLegendCards(isOrg
                ? ['Vegetation Health', 'Nutrient & Chlorophyll']
                : ['Biophysical', 'Nutrient', 'Canopy'])}
            </MapLayersPanel>
          )}

        </div>

        {/* ══ BOTTOM PANEL ══ */}
        {renderMapBottomPanel(selectedIndex)}
      </div>
  );
}
