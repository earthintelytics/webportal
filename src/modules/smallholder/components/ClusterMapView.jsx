import React, { useState, useMemo, useEffect } from 'react';
import { 
  Layers, 
  AlertTriangle, 
  CheckCircle2, 
  Compass, 
  ShieldAlert, 
  Sparkles, 
  User, 
  MapPin,
  Radio,
  Maximize2,
  SlidersHorizontal,
  Trees,
  CloudRain,
  ShieldCheck
} from 'lucide-react';
import { MapContainer, TileLayer, Polygon, Popup, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import * as api from '../../../services/organizationMonitorApi';

const CLUSTERS = [
  { id: 'alpha', name: 'Cluster Alpha (Ovia North)', members: 184, area: 680.0, avg_vigor: '91%', rvi: '0.78 (Optimal)' },
  { id: 'beta', name: 'Cluster Beta (Iguobazuwa)', members: 142, area: 540.0, avg_vigor: '78%', rvi: '0.64 (Moderate)' },
  { id: 'delta', name: 'Cluster Delta (Siluko Basin)', members: 154, area: 620.0, avg_vigor: '84%', rvi: '0.72 (Good)' },
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
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 16 });
      } catch {
        // Safe fallback
      }
    }
  }, [bounds, map]);
  return null;
};

const ClusterMapView = ({ members = [] }) => {
  const [activeLayer, setActiveLayer] = useState('vigor'); // 'vigor' | 'sar_rvi' | 'eudr'
  const [activeBasemap, setActiveBasemap] = useState('hybrid');
  const [selectedCluster, setSelectedCluster] = useState('alpha');
  const [selectedPlotId, setSelectedPlotId] = useState(members[0]?.id || null);
  const [layerOpacity, setLayerOpacity] = useState(85);

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
    return [6.436, 5.273];
  }, []);

  // Map outgrower member parcels to realistic coordinates
  const mappedMembers = useMemo(() => {
    const centerLat = storedCenter[0];
    const centerLng = storedCenter[1];

    return members.map((member, idx) => {
      const offsetStep = 0.007;
      const cols = 2;
      const row = Math.floor(idx / cols);
      const col = idx % cols;

      const baseLat = centerLat + (row - 0.5) * offsetStep;
      const baseLng = centerLng + (col - 0.5) * offsetStep;
      const w = 0.0055;
      const h = 0.0045;

      const coords = [
        [baseLat - h / 2, baseLng - w / 2],
        [baseLat - h / 2, baseLng + w / 2],
        [baseLat + h / 2, baseLng + w / 2],
        [baseLat + h / 2, baseLng - w / 2]
      ];

      return {
        ...member,
        coords
      };
    });
  }, [members, storedCenter]);

  const selectedPlot = mappedMembers.find(m => m.id === selectedPlotId) || mappedMembers[0] || null;

  const allBounds = useMemo(() => {
    const pts = [];
    mappedMembers.forEach(m => {
      if (Array.isArray(m.coords)) {
        m.coords.forEach(pt => pts.push(pt));
      }
    });
    return pts.length > 0 ? pts : [storedCenter];
  }, [mappedMembers, storedCenter]);

  const getMemberFillColor = (m, layer) => {
    if (layer === 'sar_rvi') {
      const rvi = m.sar_rvi ? parseFloat(m.sar_rvi) : 0.75;
      return rvi >= 0.7 ? '#0284c7' : rvi >= 0.5 ? '#38bdf8' : '#eab308';
    }
    if (layer === 'eudr') {
      return m.eudr_cleared ? '#10b981' : '#e11d48';
    }
    // Default: Vigor / status
    if (m.status === 'Needs Scouting') return '#eab308';
    return '#16a34a';
  };

  const selectedBasemapObj = BASEMAP_OPTIONS.find(b => b.id === activeBasemap) || BASEMAP_OPTIONS[0];

  return (
    <div className="space-y-4">
      {/* Cluster Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {CLUSTERS.map(cl => (
          <div
            key={cl.id}
            onClick={() => setSelectedCluster(cl.id)}
            className={`bg-white border rounded-2xl p-4 cursor-pointer transition-all ${
              selectedCluster === cl.id
                ? 'border-emerald-600 shadow-md ring-1 ring-emerald-500/20'
                : 'border-slate-200 hover:border-slate-300 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-900 text-sm">{cl.name}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                {cl.members} Plots
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
              <div>
                <span className="text-slate-400 block text-[10px]">Total Area</span>
                <span className="font-semibold text-slate-800">{cl.area} ha</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Canopy Vigor</span>
                <span className="font-semibold text-emerald-700">{cl.avg_vigor}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Geospatial Map Canvas */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs flex flex-col">
        {/* Layer Pill Bar */}
        <div className="bg-slate-900 text-white px-5 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Compass size={16} className="text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Outgrower Cluster Layers:</span>
          </div>

          <div className="flex items-center gap-2">
            {[
              { id: 'vigor', label: 'Parcel Vigor & Ranking' },
              { id: 'sar_rvi', label: 'Sentinel-1 Radar RVI (Cloud-Free)' },
              { id: 'eudr', label: '2020 Forest Baseline Screening' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveLayer(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  activeLayer === tab.id
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Basemap Selection */}
          <div className="flex items-center gap-2">
            <select
              value={activeBasemap}
              onChange={(e) => setActiveBasemap(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 font-medium focus:outline-none focus:border-emerald-500"
            >
              {BASEMAP_OPTIONS.map(bm => (
                <option key={bm.id} value={bm.id}>{bm.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Leaflet Map Canvas */}
        <div className="relative h-[540px] w-full bg-slate-950">
          <MapContainer
            center={storedCenter}
            zoom={14}
            zoomControl={false}
            scrollWheelZoom={true}
            className="w-full h-full z-0"
          >
            <TileLayer
              url={selectedBasemapObj.url}
              attribution='&copy; <a href="https://earthintelytics.com">EarthIntelytics</a> Outgrower Ecosystem'
              maxZoom={19}
            />

            <FitBoundsHandler bounds={allBounds} />

            {mappedMembers.map(member => {
              const isSelected = selectedPlot?.id === member.id;
              const fillColor = getMemberFillColor(member, activeLayer);

              return (
                <Polygon
                  key={member.id}
                  positions={member.coords}
                  eventHandlers={{
                    click: () => setSelectedPlotId(member.id)
                  }}
                  pathOptions={{
                    color: isSelected ? '#ffffff' : '#00000044',
                    weight: isSelected ? 3.5 : 1.5,
                    fillColor: fillColor,
                    fillOpacity: (layerOpacity / 100) * (isSelected ? 0.9 : 0.7)
                  }}
                >
                  <Tooltip permanent direction="center" className="bg-transparent border-0 shadow-none">
                    <div className="text-center pointer-events-none drop-shadow-md">
                      <div className="text-[11px] font-bold text-white leading-tight bg-slate-900/80 px-1.5 py-0.5 rounded backdrop-blur-xs">
                        {member.name}
                      </div>
                      <div className="text-[9px] font-semibold text-emerald-200">
                        {member.area_ha} ha • {member.primary_crop}
                      </div>
                    </div>
                  </Tooltip>

                  <Popup className="cluster-popup">
                    <div className="p-2 space-y-1 text-xs">
                      <div className="font-bold text-slate-900">{member.name} ({member.id})</div>
                      <div className="text-slate-600">Crop: {member.primary_crop} • Area: {member.area_ha} ha</div>
                      <div className="text-slate-600">SAR RVI: {member.sar_rvi} • Status: {member.status}</div>
                    </div>
                  </Popup>
                </Polygon>
              );
            })}
          </MapContainer>

          {/* Selected Plot Detail Card */}
          {selectedPlot && (
            <div className="absolute top-5 right-5 bg-white/95 backdrop-blur-md p-5 rounded-2xl border border-slate-200 text-slate-900 text-xs shadow-2xl max-w-sm w-full z-[400] space-y-3 animate-in fade-in slide-in-from-right-4 duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div>
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <User size={14} className="text-emerald-600" />
                    <span>{selectedPlot.name}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">{selectedPlot.id}</div>
                </div>
                <span className="px-2.5 py-1 rounded-lg font-bold text-[10px] bg-emerald-100 text-emerald-800 shadow-xs">
                  {selectedPlot.primary_crop}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/60">
                  <span className="text-slate-400 block text-[10px]">Registered Area</span>
                  <span className="font-bold text-slate-800">{selectedPlot.area_ha} ha</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/60">
                  <span className="text-slate-400 block text-[10px]">Vigor Percentile</span>
                  <span className="font-bold text-emerald-700">Top {100 - selectedPlot.vigor_percentile}%</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/60">
                  <span className="text-slate-400 block text-[10px]">SAR Radar RVI</span>
                  <span className="font-bold text-sky-700">{selectedPlot.sar_rvi} (Cloud-Free)</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/60">
                  <span className="text-slate-400 block text-[10px]">Certification</span>
                  <span className="font-bold text-slate-800">{selectedPlot.certification}</span>
                </div>
              </div>

              <div className="bg-slate-900 text-slate-200 p-3 rounded-xl text-[11px] leading-relaxed space-y-1">
                <span className="font-bold text-emerald-400 text-[10px] uppercase tracking-wider flex items-center gap-1">
                  <Sparkles size={12} />
                  <span>Agronomic Guidance:</span>
                </span>
                <p className="text-slate-300">
                  {selectedPlot.status === 'Needs Scouting'
                    ? 'Outlier distress detected. Dispatch extension agronomist to check for localized nutrient deficit or drainage blockage.'
                    : 'Canopy density optimal. Proceed with standard scheduled harvesting.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClusterMapView;
