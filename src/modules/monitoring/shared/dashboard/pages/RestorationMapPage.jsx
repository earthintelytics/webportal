import { useState } from 'react';
import MapLayersPanel from '../map/MapLayersPanel';
import { Layers } from 'lucide-react';
import { FitBoundsToPlots, FitToZarrBounds, MapPaneClipSetter, ResizeMap, SwipeSliderOverlay } from '../../dashboard/map/MapHelpers';
import { MapContainer, Pane, TileLayer, ZoomControl } from 'react-leaflet';

/** The restoration zones map page of the crop and service dashboard (moved out of CropDashboardLayout). */
export default function RestorationMapPage({ cropType, basemapAttribution, basemapMaxNativeZoom, basemapUrl, currentTileUrl, currentTileUrlB, currentTimelineA, currentTimelineB, defaultMapCenter, farmBoundary, filterEstate, handleSplitDragStart, isCompareMode, landUseChange, landUseChangeLoading, mapOpacity, plotsData, rasterOverlayBounds, renderFloatingBasemapSelector, renderMapBottomPanel, renderRestorePolygons, restorationPlotsData, restorationPlotsDataA, restorationPlotsDataB, restoreBoundariesOpacity, restoreShowBoundaries, restoreShowLayers, selectedIndex, setMapOpacity, setRestoreBoundariesOpacity, setRestoreShowBoundaries, setRestoreShowLayers, setShowRasterLayer, showRasterLayer, splitPosition, tileRefreshing, zarrBounds }) {
  const [colourBy, setColourBy] = useState(null);
  // Only results that exist for at least one of the zones are offered.
  const colourOptions = [
    { id: 'restoration_progress', label: 'Progress', layer: 'restoration_progress', field: 'progress', text: 'How much of the target tree cover each zone has reached' },
    { id: 'survival', label: 'Survival', layer: 'survival', field: 'survivalNum', text: 'Share of planted seedlings still alive' },
    { id: 'carbon', label: 'Carbon', layer: 'carbon', field: 'carbonPerHa', text: 'Carbon stored per hectare, from the zone records' },
  ].filter((o) => (restorationPlotsData || []).some((p) => p[o.field] != null));
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
                    leftPaneName="left-pane-restore"
                    rightPaneName="right-pane-restore"
                    splitPosition={splitPosition}
                    isCompareMode={isCompareMode}
                  />
                  <Pane name="left-pane-restore" style={{ zIndex: 500 }}>
                    {showRasterLayer && currentTileUrl && (
                      <TileLayer key={`a-${currentTileUrl}`} url={currentTileUrl} opacity={mapOpacity / 100} bounds={rasterOverlayBounds || undefined} maxZoom={22} maxNativeZoom={18} />
                    )}
                    {renderRestorePolygons(restorationPlotsDataA, 'left', colourBy)}
                  </Pane>
                  <Pane name="right-pane-restore" style={{ zIndex: 501 }}>
                    {showRasterLayer && currentTileUrlB && (
                      <TileLayer key={`b-${currentTileUrlB}`} url={currentTileUrlB} opacity={mapOpacity / 100} bounds={rasterOverlayBounds || undefined} maxZoom={22} maxNativeZoom={18} />
                    )}
                    {renderRestorePolygons(restorationPlotsDataB, 'right', colourBy)}
                  </Pane>
                </>
              ) : (
                renderRestorePolygons(restorationPlotsData, '', colourBy)
              )}
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

                        <button type="button"
              onClick={() => setRestoreShowLayers(!restoreShowLayers)}
              aria-pressed={restoreShowLayers}
              className={`absolute top-4 right-4 z-[1000] flex items-center gap-2 px-3 py-2 rounded-xl border bg-white text-sm font-semibold ${restoreShowLayers ? 'border-green-600 text-green-800' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              <Layers size={16} className="text-green-700" />
              Map layers
            </button>

          </div>

          {/* Map layers */}
          {restoreShowLayers && (
            <MapLayersPanel
              onClose={() => setRestoreShowLayers(false)}
              cropType={cropType}
              unit="zones"
              satellite={{ on: showRasterLayer, onChange: setShowRasterLayer, opacity: mapOpacity, setOpacity: setMapOpacity, text: 'Colours from the satellite image of the selected date' }}
              outlines={{ on: restoreShowBoundaries, onChange: setRestoreShowBoundaries, opacity: restoreBoundariesOpacity, setOpacity: setRestoreBoundariesOpacity }}
              colourBy={{ value: colourBy, onChange: setColourBy, options: colourOptions, empty: 'No restoration results for these zones yet. Add zone records in Farm data to colour the zones.' }}
            >
              <div className="border border-gray-200 rounded-xl p-3.5 space-y-2">
                <p className="text-sm font-semibold text-gray-900">Land cover change</p>
                {landUseChangeLoading ? <p className="text-xs text-gray-500">Loading…</p>
                  : !landUseChange ? <p className="text-xs text-gray-500">No land cover comparison for this farm yet.</p>
                  : (
                    <>
                      <p className="text-xs text-gray-600">{landUseChange.compared_years?.[0]} to {landUseChange.compared_years?.[1]}: <span className="font-semibold text-gray-900">{landUseChange.changed_pct}% changed</span></p>
                      {(landUseChange.top_transitions || []).slice(0, 5).map((t, i) => (
                        <p key={i} className="text-xs text-gray-600">{t.from} to {t.to} · {t.pct ?? t.percent}%</p>
                      ))}
                    </>
                  )}
              </div>
            </MapLayersPanel>
          )}



        </div>

        {/* ══ BOTTOM PANEL ══ */}
        {renderMapBottomPanel(selectedIndex)}
      </div>
  );
}
