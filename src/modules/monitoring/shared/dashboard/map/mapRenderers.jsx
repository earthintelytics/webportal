/**
 * Map helpers of the crop and service dashboard: basemap selector, info tooltips, index legend cards and the block / zone shapes each map page draws.
 * Moved out of CropDashboardLayout.jsx unchanged: each function receives the
 * layout's state and helpers it uses as `ctx`.
 */
import React from 'react';
import { CheckCircle2, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react';
import { Polygon } from 'react-leaflet';
import { InfoTooltipPortal } from '../components/InfoTooltipPortal';
import { classColour } from '../legends/layerLegends';
import { TOOLTIP_DESCRIPTIONS } from '../constants/tooltipDescriptions';

export function renderInfoTooltip(ctx, title) {

    let lookupKey = title;
    const lowerTitle = title.toLowerCase().trim();

    // Explicit mapping of common variants
    if (lowerTitle.includes('agb')) lookupKey = 'SAR AGB Proxy';
    else if (lowerTitle.includes('lulc') || lowerTitle.includes('land cover')) lookupKey = 'LULC Classification';
    else if (lowerTitle.includes('eudr') || lowerTitle.includes('deforestation')) lookupKey = 'EUDR Deforestation';
    else if (lowerTitle.includes('biodiversity')) lookupKey = 'Biodiversity';
    else if (lowerTitle.includes('diversification')) lookupKey = 'Species Diversification';
    else if (lowerTitle.includes('soil carbon offset')) lookupKey = 'Soil Carbon Offset';
    else if (lowerTitle.includes('carbon') || lowerTitle.includes('stabilization')) lookupKey = 'Soil Stabilization';
    else if (lowerTitle.includes('survival')) lookupKey = 'Seedling Survival';
    else if (lowerTitle.includes('growth')) lookupKey = 'Growth Stage';
    else if (lowerTitle.includes('surface temp') || lowerTitle.includes('lst')) lookupKey = 'Surface Temp (LST)';
    else if (lowerTitle.includes('soil moisture') || lowerTitle.includes('smi')) lookupKey = 'Soil Moisture';
    else if (lowerTitle.includes('water stress (ndmi)')) lookupKey = 'Water Stress (NDMI)';
    else if (lowerTitle.includes('water stress') || lowerTitle.includes('lswi') || lowerTitle.includes('ndmi')) lookupKey = 'LSWI (Water Status)';
    else if (lowerTitle.includes('ndre') || lowerTitle.includes('red-edge')) lookupKey = 'Red-Edge NDVI (NDRE)';
    else if (lowerTitle.includes('vegetation health')) lookupKey = 'Vegetation Health';

    // Fallback search in keys
    let info = TOOLTIP_DESCRIPTIONS[lookupKey];
    if (!info) {
      const foundKey = Object.keys(TOOLTIP_DESCRIPTIONS).find(k =>
        k.toLowerCase().includes(lowerTitle) || lowerTitle.includes(k.toLowerCase())
      );
      if (foundKey) info = TOOLTIP_DESCRIPTIONS[foundKey];
    }

    // Use portal-based tooltip — never clipped by any parent overflow or z-index
    const { desc = null, done = null, formula = null } = info || {};
    return <InfoTooltipPortal title={title} desc={desc} done={done} formula={formula} />;
  
}

export function renderFloatingBasemapSelector(ctx) {
  const { activeComposite, basemapDropdownRef, compositeTileUrl, selectedBasemap, setSelectedBasemap, setShowBasemapDropdown, setShowGoogleLabels, showBasemapDropdown, showGoogleLabels } = ctx;

    const BASEMAPS = [
      { id: 'terrain',       label: 'Map',             sub: 'Roads, rivers and terrain', emoji: '' },
      { id: 'google-hybrid', label: 'Satellite (Google)', sub: 'Detailed photo of the area', emoji: '' },
      { id: 'esri-imagery',  label: 'Satellite (Esri)', sub: 'Detailed photo, second source', emoji: '' },
      { id: 'osm-streets',   label: 'Streets',         sub: 'OpenStreetMap roads and places', emoji: '' },
      // Live composites rendered from this tenant's own archive — move with
      // the time slider, unlike the static sources above.
      { id: 'true-color',    label: 'Latest image',    sub: 'Your farms on the chosen date', emoji: '' },
      { id: 'false-color',   label: 'Plant colours',   sub: 'Healthy plants show red',    emoji: '' },
      { id: 'sar-rgb',       label: 'Cloudy-season view', sub: 'Sees through cloud',      emoji: '' },
    ];
    const activeBasemapObj = BASEMAPS.find(b => b.id === selectedBasemap) || BASEMAPS[0];

    return (
      <div className="absolute top-4 left-4 z-[1000]" ref={basemapDropdownRef}>
        <button
          onClick={() => setShowBasemapDropdown(!showBasemapDropdown)}
          className="bg-white border border-gray-200 px-2 py-1.5 rounded-sm shadow-md hover:bg-gray-55 flex items-center gap-1.5 font-bold text-[11px] text-gray-700 transition-all active:scale-95"
        >
          <span className="text-xs">{activeBasemapObj.emoji}</span>
          <span className="truncate max-w-[85px]">{activeBasemapObj.label}</span>
          {activeComposite && !compositeTileUrl && (
            <RefreshCw size={10} className="animate-spin text-gray-600" title="Loading composite tiles…" />
          )}
          <ChevronDown size={11} className={`text-gray-600 transition-transform ${showBasemapDropdown ? 'rotate-180' : ''}`} />
        </button>
        {showBasemapDropdown && (
          <div className="absolute left-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-sm shadow-lg overflow-hidden">
            <div className="p-1 space-y-0.5">
              {BASEMAPS.map(src => (
                <button
                  key={src.id}
                  onClick={() => { setSelectedBasemap(src.id); setShowBasemapDropdown(false); }}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-sm text-left transition-all ${
                    selectedBasemap === src.id ? 'bg-green-50 text-green-700 font-semibold' : 'hover:bg-gray-55 text-gray-700'
                  }`}
                >
                  <span className="text-xs shrink-0">{src.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-bold truncate leading-tight">{src.label}</div>
                    <div className="text-[11px] text-gray-600 mt-0.5">{src.sub}</div>
                  </div>
                  {selectedBasemap === src.id && <CheckCircle2 size={10} className="text-green-600 shrink-0" />}
                </button>
              ))}
              {selectedBasemap === 'google-hybrid' && (
                <button
                  onClick={() => setShowGoogleLabels(v => !v)}
                  className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-sm text-left border-t border-gray-100 mt-0.5 pt-1.5 hover:bg-gray-55"
                >
                  <span className="text-[11px] font-bold text-gray-700">Show place names</span>
                  <span
                    className={`w-7 h-4 rounded-full p-0.5 transition-colors duration-200 shrink-0 ${showGoogleLabels ? 'bg-green-600' : 'bg-gray-300'}`}
                  >
                    <span className={`block w-3 h-3 rounded-full bg-white shadow transform transition-transform duration-200 ${showGoogleLabels ? 'translate-x-3' : 'translate-x-0'}`} />
                  </span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  
}

export function renderLegendCard(ctx, entry) {
  const { expandedLegendKeys, mapOpacity, openGlossary, renderInfoTooltip, selectedIndex, setMapOpacity, setSelectedIndex, setShowRasterLayer, showRasterLayer, toggleLegendKey } = ctx;

        const isSelected = (selectedIndex || '').toLowerCase() === entry.key;
        const isOnMap = isSelected && showRasterLayer;
        const isOpen = isOnMap || expandedLegendKeys.includes(entry.key);
        const handleSwitch = () => {
          if (!entry.hasData) return;
          if (isOnMap) { setShowRasterLayer(false); }
          else { setSelectedIndex(entry.key); setShowRasterLayer(true); }
        };
        return (
          <div key={entry.key} className={`border rounded-xl p-3.5 bg-white space-y-2.5 ${isOnMap ? 'border-green-300 ring-1 ring-green-100' : 'border-gray-100'} ${!entry.hasData ? 'opacity-60' : ''}`}>
            <div className="flex items-center justify-between">
              <div onClick={() => toggleLegendKey(entry.key)} style={{ cursor: 'pointer' }}>
                <div className="text-xs font-bold text-gray-700 leading-tight flex items-center gap-1.5">
                  {entry.title} {renderInfoTooltip(entry.tooltip)}
                  {isOnMap && <span className="text-[11px] font-bold text-green-700 bg-green-50 border border-green-200 rounded-full px-1.5 py-0.5">On map</span>}
                </div>
                <span className="text-[11px] text-gray-600">
                  <button type="button" onClick={(ev) => { ev.stopPropagation(); openGlossary(entry.key); }} className="underline decoration-dotted hover:text-green-700">What is this?</button>{!entry.hasData && <span className="text-gray-500"> · no clear view yet</span>}
                </span>
              </div>
              <button
                onClick={handleSwitch}
                disabled={!entry.hasData}
                title={!entry.hasData ? 'Not available for this farm yet' : isOnMap ? 'Hide from map' : 'Show on map'}
                className="w-9 h-5 rounded-full p-0.5 transition-colors duration-200 shrink-0"
                style={{ backgroundColor: isOnMap ? '#3F8432' : '#E5E7EB', cursor: entry.hasData ? 'pointer' : 'not-allowed' }}
              >
                <div style={{ transform: isOnMap ? 'translateX(16px)' : 'translateX(0)' }} className="w-4 h-4 rounded-full bg-white shadow transition-transform duration-200" />
              </button>
            </div>
            {isOpen && (
              <div className="space-y-1.5 pt-1 border-t border-gray-50">
                {entry.legend.map((cls, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: cls.color }} />
                    <span className="text-[11px] font-semibold text-gray-500">{cls.label} ({cls.range?.[0]} to {cls.range?.[1]})</span>
                  </div>
                ))}
                {entry.legend.length === 0 && entry.ramp && (
                  <span className="text-[11px] text-gray-600">Continuous colour ramp ({entry.ramp[0]} to {entry.ramp[1]})</span>
                )}
                {entry.notes && <p className="text-[11px] text-gray-600 leading-snug pt-1 border-t border-gray-50">{entry.notes}</p>}
                {isOnMap && (
                  <div className="pt-1.5 border-t border-gray-50">
                    <div className="flex items-center justify-between text-[11px] text-gray-600 font-bold">
                      <span>Layer transparency</span>
                      <span>{mapOpacity}%</span>
                    </div>
                    <input type="range" min="10" max="100" value={mapOpacity}
                      onChange={e => setMapOpacity(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-gray-100 rounded-full appearance-none cursor-pointer accent-green-600" />
                  </div>
                )}
              </div>
            )}
          </div>
        );
  
}

export function renderLegendCards(ctx, groupFilter = null) {
  const { emptyLegendMessage, expandedLegendGroups, legendEntries, legendGroups, renderLegendCard, selectedIndex, showRasterLayer, toggleLegendGroup } = ctx;

    const groupNames = Object.keys(legendGroups).filter(g => !groupFilter || groupFilter.includes(g));
    const openGroups = expandedLegendGroups || groupNames.slice(0, 1);
    // Whether *this* card list is exclusively SAR-derived (e.g. Moisture
    // Content's Structure & Moisture group) — was previously keyed off the
    // globally selected index instead, so a SAR-only panel could still show
    // the Sentinel-2/Landsat picker whenever selectedIndex happened to be an
    // optical index from another page.
    return (
      <>
        {/* Sensor choice lives here now instead of a separate toolbar
            dropdown — SAR indices always come from Sentinel-1 (handled by
            isSarIndex/effectiveSensor), so this only matters for optical
            indices, which can come from either Sentinel-2 or Landsat. */}

        {groupNames.map(name => {
          const entries = legendGroups[name];
          const isOpen = openGroups.includes(name);
          const onMapCount = entries.filter(e => (selectedIndex || '').toLowerCase() === e.key && showRasterLayer).length;
          return (
            <div key={name} className="space-y-2.5">
              <div
                onClick={() => toggleLegendGroup(name)}
                className="flex items-center gap-1 text-[11px] font-bold text-gray-600 hover:text-gray-800 cursor-pointer select-none transition-colors"
              >
                {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />} {name}
                <span className="font-semibold normal-case tracking-normal text-gray-500">({entries.length})</span>
                {onMapCount > 0 && <span className="text-[11px] font-bold text-green-700 bg-green-50 border border-green-200 rounded-full px-1.5 py-0.5">On map</span>}
              </div>
              {isOpen && <div className="space-y-3">{entries.map(entry => renderLegendCard(entry))}</div>}
            </div>
          );
        })}
        {legendEntries.length === 0 && (
          <p className="text-[11px] text-gray-600 px-1">{emptyLegendMessage}</p>
        )}
      </>
    );
  
}

export function colouredPolygon(ctx, key, coords, value, layer, opacity, onClick) {
  const { cropType } = ctx;

    const colour = classColour(value, layer, cropType);
    if (!colour || !coords?.length) return null;
    return <Polygon key={key} positions={coords} pathOptions={{ color: colour, weight: 1, fillColor: colour, fillOpacity: opacity / 100 }} eventHandlers={onClick ? { click: onClick } : undefined} />;
  
}

export function renderIntelPolygons(ctx, plots, suffix = '') {
  const { getIntelPlotStyleOutline, handlePlotClick, intelShowBoundaries } = ctx;

    return plots.map(plot => {
      const keyPrefix = `${plot.id}${suffix ? '-' + suffix : ''}`;
      return (
        <React.Fragment key={keyPrefix}>
          {intelShowBoundaries && (
            <Polygon
              positions={plot.coords}
              pathOptions={getIntelPlotStyleOutline()}
              eventHandlers={{ click: (e) => handlePlotClick(plot, e.latlng.lat, e.latlng.lng) }}
            />
          )}
        </React.Fragment>
      );
    });
  
}

export function renderHealthPolygons(ctx, plots, suffix = '') {
  const { getHealthPlotStyleOutline, handlePlotClick, healthShowBoundaries } = ctx;

    return plots.map(plot => {
      const keyPrefix = `${plot.id}${suffix ? '-' + suffix : ''}`;
      return (
        <React.Fragment key={keyPrefix}>
          {healthShowBoundaries && (
            <Polygon
              positions={plot.coords}
              pathOptions={getHealthPlotStyleOutline(plot)}
              eventHandlers={{ click: (e) => handlePlotClick(plot, e.latlng.lat, e.latlng.lng) }}
            />
          )}
        </React.Fragment>
      );
    });
  
}

export function renderMoisturePolygons(ctx, plots, suffix = '') {
  const { handlePlotClick, moistureBoundariesOpacity, moistureShowBoundaries, showRasterLayer } = ctx;

    return plots.map(plot => {
      const keyPrefix = `${plot.id}${suffix ? '-' + suffix : ''}`;
      return (
        <React.Fragment key={keyPrefix}>
          {moistureShowBoundaries && (
            <Polygon
              positions={plot.coords}
              pathOptions={{
                color: '#000000',
                weight: 1.5,
                opacity: (moistureBoundariesOpacity / 100) * 0.9,
                fillColor: plot.color || '#3b82f6',
                fillOpacity: showRasterLayer ? 0.05 : 0.35
              }}
              eventHandlers={{ click: (e) => handlePlotClick(plot, e.latlng.lat, e.latlng.lng) }}
            />
          )}
        </React.Fragment>
      );
    });
  
}

export function renderYieldPolygons(ctx, plots, suffix = '', colourBy = null) {
  const { colouredPolygon, getYieldPlotStyleOutline, handlePlotClick, yieldShowBoundaries } = ctx;

  return (plots.map(plot => (
    <React.Fragment key={`${plot.id}${suffix}`}>
      {colourBy === 'yield' && colouredPolygon(`${plot.id}-yield${suffix}`, plot.coords, plot.yieldValue, 'yield', 70, (e) => handlePlotClick(plot, e.latlng.lat, e.latlng.lng))}
      {yieldShowBoundaries && (
        <Polygon positions={plot.coords} pathOptions={getYieldPlotStyleOutline()} eventHandlers={{ click: (e) => handlePlotClick(plot, e.latlng.lat, e.latlng.lng) }} />
      )}
    </React.Fragment>
  )));

}

export function renderRestorePolygons(ctx, zones, suffix = '', colourBy = null) {
  const { RESTORE_VALUE, colouredPolygon, getRestorePlotStyleOutline, restoreShowBoundaries } = ctx;

  return (zones.map(zone => (
    <React.Fragment key={`${zone.id}${suffix}`}>
      {colourBy && colouredPolygon(`${zone.id}-${colourBy}${suffix}`, zone.coords, zone[RESTORE_VALUE[colourBy]], colourBy, 70)}
      {restoreShowBoundaries && <Polygon positions={zone.coords} pathOptions={getRestorePlotStyleOutline()} />}
    </React.Fragment>
  )));

}

export function renderClimatePolygons(ctx, plots, suffix = '', colourBy = null) {
  const { CLIMATE_VALUE, climateShowBoundaries, colouredPolygon, getClimatePlotStyleOutline, handlePlotClick } = ctx;

  return (plots.map(plot => (
    <React.Fragment key={`${plot.id}${suffix}`}>
      {colourBy && colouredPolygon(`${plot.id}-${colourBy}${suffix}`, plot.coords, plot[CLIMATE_VALUE[colourBy]], colourBy, 70, (e) => handlePlotClick(plot, e.latlng.lat, e.latlng.lng))}
      {climateShowBoundaries && (
        <Polygon positions={plot.coords} pathOptions={getClimatePlotStyleOutline()} eventHandlers={{ click: (e) => handlePlotClick(plot, e.latlng.lat, e.latlng.lng) }} />
      )}
    </React.Fragment>
  )));

}
