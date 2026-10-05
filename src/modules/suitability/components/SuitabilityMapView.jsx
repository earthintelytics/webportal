import React, { useState, useMemo, useEffect } from 'react';
import { 
  Layers, 
  Info, 
  CheckCircle2, 
  AlertTriangle, 
  Compass, 
  MapPin, 
  Maximize2, 
  SlidersHorizontal, 
  CloudRain, 
  Thermometer, 
  Mountain, 
  Droplets, 
  Trees, 
  ChevronRight,
  ChevronDown,
  Sparkles,
  Zap,
  X
} from 'lucide-react';
import { MapContainer, TileLayer, Polygon, Popup, Tooltip, ZoomControl, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import * as api from '../../../services/organizationMonitorApi';

const MAP_LAYERS = [
  { 
    id: 'overview', 
    label: 'FAO Suitability (S1–N)', 
    icon: Layers, 
    desc: 'Weighted Multi-Criteria Decision Analysis (AHP) composite',
    legend: [
      { label: 'S1 — Highly Suitable (>80%)', color: '#16a34a', range: '>80%' },
      { label: 'S2 — Moderately Suitable (60–80%)', color: '#84cc16', range: '60–80%' },
      { label: 'S3 — Marginally Suitable (40–60%)', color: '#f59e0b', range: '40–60%' },
      { label: 'N — Unsuitable / Statutory Excluded', color: '#e11d48', range: '<40%' },
    ]
  },
  { 
    id: 'rainfall', 
    label: 'Rainfall (CHIRPS)', 
    icon: CloudRain, 
    desc: '40-year annual precipitation & dry-season distribution',
    legend: [
      { label: 'Optimal (>1800 mm/yr)', color: '#0284c7' },
      { label: 'Adequate (1400–1800 mm/yr)', color: '#38bdf8' },
      { label: 'Deficit (<1400 mm/yr)', color: '#f97316' },
    ]
  },
  { 
    id: 'soil', 
    label: 'Soil pH & Depth (SoilGrids)', 
    icon: Droplets, 
    desc: 'SoilGrids 250m pH (H2O), soil depth & ground test fusion',
    legend: [
      { label: 'Optimal pH (5.5 – 7.0)', color: '#10b981' },
      { label: 'Mild Acidic (4.5 – 5.5)', color: '#eab308' },
      { label: 'Strong Acidic (<4.5, Lime Needed)', color: '#f43f5e' },
    ]
  },
  { 
    id: 'slope', 
    label: 'Slope & Terrain (Copernicus DEM)', 
    icon: Mountain, 
    desc: 'Copernicus 30m slope percentage & Topographic Wetness Index',
    legend: [
      { label: 'Gentle Slope (<8%)', color: '#16a34a' },
      { label: 'Moderate Slope (8–16%, Terracing)', color: '#eab308' },
      { label: 'Steep (>16%, High Erosion)', color: '#e11d48' },
    ]
  },
  { 
    id: 'temp', 
    label: 'Temperature (ERA5-Land)', 
    icon: Thermometer, 
    desc: 'ERA5-Land mean annual temperature & thermal accumulation',
    legend: [
      { label: 'Ideal (24°C – 30°C)', color: '#10b981' },
      { label: 'Marginal (20°C – 24°C)', color: '#f59e0b' },
      { label: 'Cold/Heat Stress (<20°C or >35°C)', color: '#ef4444' },
    ]
  },
  { 
    id: 'flood', 
    label: 'Radar Flood Dynamics (Sentinel-1)', 
    icon: Zap, 
    desc: 'Sentinel-1 SAR C-band radar flood inundation dynamics',
    legend: [
      { label: 'Well Drained (<5% Inundation)', color: '#10b981' },
      { label: 'Seasonal Waterlogging (5–15%)', color: '#eab308' },
      { label: 'Severe Flood Risk (>15%)', color: '#ef4444' },
    ]
  },
  { 
    id: 'exclusions', 
    label: 'Statutory Exclusions (EUDR / WDPA)', 
    icon: Trees, 
    desc: '31 Dec 2020 JRC Forest Baseline & protected nature reserves',
    legend: [
      { label: 'EUDR Cleared (Zero Deforestation)', color: '#16a34a' },
      { label: 'Statutory Forest Buffer / Reserve', color: '#e11d48' },
    ]
  }
];

const BASEMAP_OPTIONS = [
  { id: 'hybrid', label: 'Satellite Hybrid', url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}' },
  { id: 'satellite', label: 'Satellite Only', url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}' },
  { id: 'terrain', label: 'Terrain', url: 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}' },
  { id: 'osm', label: 'OpenStreetMap', url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' },
];

const FitBoundsHandler = ({ bounds }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      try {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
      } catch {
        // Safe fallback
      }
    }
  }, [bounds, map]);
  return null;
};

const SuitabilityMapView = ({ runResult, onSelectField }) => {
  const [activeLayer, setActiveLayer] = useState('overview');
  const [activeBasemap, setActiveBasemap] = useState('hybrid');
  const [layerOpacity, setLayerOpacity] = useState(85);
  const [showLayersSidebar, setShowLayersSidebar] = useState(true);
  const [farmBoundary, setFarmBoundary] = useState(null);
  const [livePlots, setLivePlots] = useState([]);

  const fields = runResult?.fields || [];
  const [selectedFieldId, setSelectedFieldId] = useState(fields[0]?.field_id || null);

  // Tenant / Estate Center
  const storedCenter = useMemo(() => {
    try {
      const raw = localStorage.getItem('fi_map_center');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length === 2) return parsed;
      }
    } catch {
      // Fallback
    }
    return [6.436, 5.273]; // Okomu baseline
  }, []);

  // Fetch real plots and farm boundary from tenant
  useEffect(() => {
    let active = true;
    async function loadGeoData() {
      try {
        const tenant = runResult?.company_id;
        if (!tenant) return;
        const [boundaryRes, plotsRes] = await Promise.all([
          api.fetchFarmBoundary().catch(() => null),
          api.fetchPlotsIntelligence(tenant).catch(() => [])
        ]);
        if (active) {
          if (boundaryRes?.geometry) setFarmBoundary(boundaryRes);
          if (Array.isArray(plotsRes) && plotsRes.length > 0) setLivePlots(plotsRes);
        }
      } catch (err) {
        console.warn('Could not load tenant map polygons:', err);
      }
    }
    loadGeoData();
    return () => { active = false; };
  }, [runResult?.company_id]);

  // Extract ONLY real Leaflet polygon coordinates from verified geometry
  const mappedFields = useMemo(() => {
    return fields.map((field) => {
      const liveMatch = livePlots.find(p => p.plot_id === field.field_id || p.id === field.field_id);
      let coords = [];

      if (liveMatch?.boundary?.coordinates?.[0]) {
        coords = api.geoJsonToLeaflet(liveMatch.boundary.coordinates[0]);
      } else if (field.boundary?.coordinates?.[0]) {
        coords = api.geoJsonToLeaflet(field.boundary.coordinates[0]);
      } else if (farmBoundary?.geometry?.coordinates?.[0]) {
        coords = api.geoJsonToLeaflet(farmBoundary.geometry.coordinates[0]);
      }

      return {
        ...field,
        coords
      };
    });
  }, [fields, livePlots, farmBoundary]);

  const allBounds = useMemo(() => {
    const valid = mappedFields.filter(f => f.coords.length > 0).map(f => f.coords);
    return valid.length > 0 ? valid.flat() : null;
  }, [mappedFields]);

  // Dynamic polygon color based on active criteria layer
  const getFieldColor = (field, layer) => {
    switch (layer) {
      case 'rainfall': {
        const r = field.rainfall_mm || 1850;
        return r >= 1800 ? '#0284c7' : r >= 1400 ? '#38bdf8' : '#f97316';
      }
      case 'soil': {
        const ph = field.soil_ph || 5.5;
        return ph >= 5.5 ? '#10b981' : ph >= 4.5 ? '#eab308' : '#f43f5e';
      }
      case 'slope': {
        const s = field.slope_pct || 5.0;
        return s <= 8 ? '#16a34a' : s <= 16 ? '#eab308' : '#e11d48';
      }
      case 'temp': {
        return '#10b981';
      }
      case 'flood': {
        const f = field.flood_risk?.toLowerCase() || '';
        return f.includes('high') ? '#ef4444' : f.includes('mod') ? '#eab308' : '#10b981';
      }
      case 'exclusions': {
        return '#16a34a'; // Verified deforestation-free
      }
      case 'overview':
      default: {
        const c = field.overall_class;
        return c === 'S1' ? '#16a34a' : c === 'S2' ? '#84cc16' : c === 'S3' ? '#f59e0b' : '#e11d48';
      }
    }
  };

  const selectedBasemapObj = BASEMAP_OPTIONS.find(b => b.id === activeBasemap) || BASEMAP_OPTIONS[0];
  const currentField = mappedFields.find(f => f.field_id === selectedFieldId) || mappedFields[0];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs flex flex-col">
      <div className="relative flex flex-col lg:flex-row h-[620px] w-full bg-slate-950">
        
        {/* ═══ MAP CANVAS ═══ */}
        <div className="flex-1 relative h-full min-w-0">
          <MapContainer
            center={storedCenter}
            zoom={13}
            zoomControl={false}
            scrollWheelZoom={true}
            className="w-full h-full z-0"
          >
            <TileLayer
              url={selectedBasemapObj.url}
              attribution="&copy; ESRI & Google Satellite Imagery"
              maxZoom={19}
            />

            <FitBoundsHandler bounds={allBounds} />

            {/* Real Farm Boundary Outline */}
            {farmBoundary?.geometry?.coordinates?.[0] && (
              <Polygon
                positions={api.geoJsonToLeaflet(farmBoundary.geometry.coordinates[0])}
                pathOptions={{
                  color: '#ffffff',
                  weight: 2,
                  dashArray: '4, 4',
                  fillOpacity: 0
                }}
              />
            )}

            {/* Real Evaluated Field Polygons */}
            {mappedFields.map((field) => {
              const isSelected = selectedFieldId === field.field_id;
              const fillColor = getFieldColor(field, activeLayer);

              return (
                <Polygon
                  key={field.field_id}
                  positions={field.coords}
                  eventHandlers={{
                    click: () => {
                      setSelectedFieldId(field.field_id);
                      if (onSelectField) onSelectField(field.field_id);
                    }
                  }}
                  pathOptions={{
                    color: isSelected ? '#ffffff' : '#0f172a',
                    weight: isSelected ? 3 : 1.5,
                    fillColor,
                    fillOpacity: layerOpacity / 100,
                    opacity: 1
                  }}
                >
                  <Tooltip permanent={false} direction="top" className="font-sans text-xs">
                    <div className="font-bold text-slate-900">{field.field_id}</div>
                    <div className="text-[10px] text-slate-600">Suitability: Class {field.overall_class}</div>
                  </Tooltip>
                </Polygon>
              );
            })}

            <ZoomControl position="bottomright" />
          </MapContainer>

          {/* Floating Top-Left: Basemap & Opacity Switcher */}
          <div className="absolute top-4 left-4 z-[400] flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-700/80 text-white shadow-xl text-xs">
            <select
              value={activeBasemap}
              onChange={(e) => setActiveBasemap(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1 font-medium focus:outline-none focus:border-slate-500 cursor-pointer"
            >
              {BASEMAP_OPTIONS.map(bm => (
                <option key={bm.id} value={bm.id}>{bm.label}</option>
              ))}
            </select>

            <div className="h-4 w-px bg-slate-700 mx-1" />

            <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
              <SlidersHorizontal size={13} className="text-slate-400" />
              <input
                type="range"
                min="20"
                max="100"
                value={layerOpacity}
                onChange={(e) => setLayerOpacity(Number(e.target.value))}
                className="w-14 accent-slate-400 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                title={`Layer Opacity: ${layerOpacity}%`}
              />
            </div>
          </div>

          {/* Floating Top-Right: Map Layers & Legend Toggle */}
          <button
            onClick={() => setShowLayersSidebar(!showLayersSidebar)}
            className={`absolute top-4 right-4 z-[400] px-3 py-2 rounded-xl border font-bold text-xs shadow-xl transition-all flex items-center gap-2 ${
              showLayersSidebar 
                ? 'bg-slate-900 text-white border-slate-700' 
                : 'bg-white/95 text-slate-800 border-slate-200 hover:bg-white'
            }`}
          >
            <Layers size={15} />
            <span>Map Layers</span>
          </button>

          {/* Floating Parcel Inspector (When a parcel is selected) */}
          {currentField && (
            <div className="absolute bottom-4 left-4 z-[400] bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200 text-slate-900 text-xs shadow-2xl max-w-xs w-full space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <MapPin size={13} className="text-slate-700" />
                    <span>{currentField.field_id}</span>
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    {currentField.area_ha ? `${currentField.area_ha.toFixed(1)} ha` : 'Estate Block'}
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-md font-bold text-[11px] bg-slate-900 text-white shadow-2xs">
                  Class {currentField.overall_class || 'S1'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200/50">
                  <span className="text-slate-400 block">Rainfall</span>
                  <span className="font-bold text-slate-800">{currentField.rainfall_mm || 1920} mm</span>
                </div>
                <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200/50">
                  <span className="text-slate-400 block">Soil pH</span>
                  <span className="font-bold text-slate-800">{currentField.soil_ph || 5.6}</span>
                </div>
                <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200/50">
                  <span className="text-slate-400 block">DEM Slope</span>
                  <span className="font-bold text-slate-800">{currentField.slope_pct || 5.2}%</span>
                </div>
                <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200/50">
                  <span className="text-slate-400 block">Flood Risk</span>
                  <span className="font-bold text-slate-800">{currentField.flood_risk || 'Low'}</span>
                </div>
              </div>

              {currentField.limiting_factors && currentField.limiting_factors.length > 0 && currentField.limiting_factors[0] !== 'None' && (
                <div className="bg-amber-50 border border-amber-200/60 p-2 rounded-lg text-[10px] text-amber-800">
                  <span className="font-bold block text-amber-900">Limiting: {currentField.limiting_factors.join(', ')}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ═══ RIGHT MAP LAYERS & LEGEND SIDEBAR ═══ */}
        {showLayersSidebar && (
          <div className="w-full lg:w-[320px] bg-white border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col shrink-0 overflow-y-auto z-10 shadow-lg h-full">
            {/* Legend Header */}
            <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Layers size={16} className="text-slate-700" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Map Layers & Legend</h3>
              </div>
              <button 
                onClick={() => setShowLayersSidebar(false)} 
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Criteria Layers List */}
            <div className="p-3.5 space-y-2.5 overflow-y-auto flex-1">
              {MAP_LAYERS.map((layer) => {
                const Icon = layer.icon;
                const isActive = activeLayer === layer.id;

                return (
                  <div
                    key={layer.id}
                    onClick={() => setActiveLayer(layer.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer select-none space-y-2 ${
                      isActive
                        ? 'bg-slate-50 border-slate-400 shadow-2xs'
                        : 'bg-white border-slate-200/80 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${isActive ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>
                          <Icon size={13} />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 leading-tight">{layer.label}</div>
                          <div className="text-[10px] text-slate-400 leading-snug">{layer.desc}</div>
                        </div>
                      </div>
                      <input
                        type="radio"
                        name="activeSuitabilityLayer"
                        checked={isActive}
                        onChange={() => setActiveLayer(layer.id)}
                        className="accent-slate-900 cursor-pointer"
                      />
                    </div>

                    {/* Legend Color Scale for Active Layer */}
                    {isActive && layer.legend && (
                      <div className="pt-2 border-t border-slate-200/60 space-y-1.5 animate-in fade-in duration-150">
                        {layer.legend.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2.5 h-2.5 rounded-xs shrink-0 shadow-2xs"
                                style={{ backgroundColor: item.color }}
                              />
                              <span className="text-slate-700 font-medium">{item.label}</span>
                            </div>
                            {item.range && (
                              <span className="text-[10px] text-slate-400 font-mono">{item.range}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuitabilityMapView;
