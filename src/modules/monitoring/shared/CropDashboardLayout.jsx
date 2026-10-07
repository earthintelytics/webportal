import { useCallback, useState, useMemo, useEffect, useRef } from 'react';


import * as api from '../../../services/organizationMonitorApi';
import 'leaflet/dist/leaflet.css';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend as ChartLegend,
  Filler
} from 'chart.js';



import { fetchEstates } from '../../../services/estatesApi';

import DataNeededDialog from '../../data/DataNeededDialog';

import { cropPagesFor } from '../cropCatalog';








import NewResultsBanner from './dashboard/NewResultsBanner';
import { UNIT_LABEL, CROP_UNIT } from './dashboard/kpiCatalog';




import { useLayerLegends } from './dashboard/legends/layerLegends';









import { roleLabel } from '../../../pages/org/orgProfile';





import { ANSWER_FORMAT } from '../../assistant/scenarioTemplates';



import { CROP_CONFIG_KEYS } from './dashboard/constants/chartConfig';
import { renderInfoTooltip as renderInfoTooltipImpl, renderFloatingBasemapSelector as renderFloatingBasemapSelectorImpl, renderLegendCard as renderLegendCardImpl, renderLegendCards as renderLegendCardsImpl, colouredPolygon as colouredPolygonImpl, renderIntelPolygons as renderIntelPolygonsImpl, renderHealthPolygons as renderHealthPolygonsImpl, renderMoisturePolygons as renderMoisturePolygonsImpl, renderYieldPolygons as renderYieldPolygonsImpl, renderRestorePolygons as renderRestorePolygonsImpl, renderClimatePolygons as renderClimatePolygonsImpl } from './dashboard/map/mapRenderers';
import { renderMapBottomPanel as renderMapBottomPanelImpl } from './dashboard/map/MapBottomPanel';
import { renderDashboardHeader, renderDashboardSidebar } from './dashboard/layout/DashboardChrome';
import { renderDashboardPages } from './dashboard/layout/DashboardPages';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  ArcElement,
  Title,
  ChartTooltip,
  ChartLegend,
  Filler
);

const CropDashboardLayout = ({ mode = 'crop', service = null, cropType, cropIndices, mapCenter, onBack, onSignOut }) => {
  useLayerLegends(); // map colours follow the admin's classes once loaded
  const isOrg = mode === 'organization' || Boolean(service);
  const isAiOnly = Boolean(service?.isAiOnly);
  // Service portals (sustainability, field advisory, finance) reuse this
  // exact layout; the service config only picks and names the sub-pages.
  // pick(defaults, list): keep the service's entries, in its order, with
  // its labels, and the default icon for each id.
  // A service that lists nothing shows nothing: it never falls back to the crop pages.
  const pick = (defaults, list) => !list ? (service ? [] : defaults) : list
    .map(s => { const d = defaults.find(x => x.id === s.id); return d ? { ...d, label: s.label || d.label } : null; })
    .filter(Boolean);
  const cropLabel = isOrg ? '' : (CROP_CONFIG_KEYS[cropType] || cropType);
  // Tenant identity comes strictly from the authenticated session — no default
  // organization. Without a session, bounce straight back to login.
  const tenant = localStorage.getItem('fi_tenant');
  const hasSession = Boolean(tenant && localStorage.getItem('fi_token'));
  useEffect(() => {
    if (!hasSession && onSignOut) onSignOut();
  }, [hasSession]);
  // Display name comes from the organization's TenantConfig (stored at login)
  const tenantDisplayName = localStorage.getItem('fi_display_name')
    || (tenant ? tenant.charAt(0).toUpperCase() + tenant.slice(1) : '');
  // Map center comes from TenantConfig: the mapCenter prop (fetched live) first,
  // then the copy stored at login, then a neutral default.
  let storedMapCenter = null;
  try { storedMapCenter = JSON.parse(localStorage.getItem('fi_map_center') || 'null'); } catch { storedMapCenter = null; }
  const defaultMapCenter = mapCenter
    || (Array.isArray(storedMapCenter) && storedMapCenter.length === 2 ? storedMapCenter : [6.436, 5.273]);

  // Extract numeric farm ID from real plot IDs like PLOT-042 → '42', or fall back to '1'
  const getBackendFarmId = (plotId) => {
    if (!plotId) return '1';
    const match = plotId.match(/\d+/);
    return match ? match[0] : '1';
  };

  const [sliderData, setSliderData] = useState(null);
  const [pixelTimeseries, setPixelTimeseries] = useState(null);
  const [farmBoundary, setFarmBoundary] = useState(null); // GeoJSON Feature for tenants with no plot polygons


  const [activeSidebarItem, setActiveSidebarItem] = useState(service?.sidebar?.[0]?.id || 'analytics');
  const [answersForm, setAnswersForm] = useState(null);
  // Estate selector (organisations with several estates): 'All' or an estate
  // name. Lives in the URL (?estate=) so a link or refresh keeps the choice.
  const [filterEstate, setFilterEstate] = useState(() => new URLSearchParams(window.location.search).get('estate') || 'All');
  const [estates, setEstates] = useState([]); // from GET /estates when the backend has it
  useEffect(() => {
    let active = true;
    fetchEstates().then(list => { if (active && Array.isArray(list)) setEstates(list); }).catch(() => {});
    return () => { active = false; };
  }, []);
  useEffect(() => {
    const url = new URL(window.location.href);
    if (filterEstate && filterEstate !== 'All') url.searchParams.set('estate', filterEstate); else url.searchParams.delete('estate');
    window.history.replaceState(window.history.state, '', url);
  }, [filterEstate]);
  // Settings → Farm data: which dataset to open (set by the sign-in "Data needed" dialog)
  const [dataFocus, setDataFocus] = useState(null);
  // Page set: the service's catalogue entry, or the crop's (cropCatalog.js).
  const pageSet = service || cropPagesFor(cropType);
  // Glossary entry to open (links from farmer words on screen)
  const [glossaryFocus, setGlossaryFocus] = useState(null);
  const openGlossary = (key) => { setGlossaryFocus(key); setActiveTab('monitor'); setActiveSidebarItem('help'); };
  const [activeTab, setActiveTab] = useState(() => isAiOnly ? 'ai-assistant' : 'monitor');
  const [activeAnalyticsSubpage, setActiveAnalyticsSubpage] = useState('overview');

  useEffect(() => {
    if (isAiOnly) {
      setActiveTab('ai-assistant');
      setActiveSidebarItem('analytics');
    }
  }, [isAiOnly, service?.id]);

  // Reports, Verification and Assistant cover the whole portal, so they open
  // from any page; choosing a sidebar page returns to Monitor.
  const handleTopNavTabClick = (tabId) => {
    if (tabId !== 'monitor') setActiveSidebarItem('analytics');
    setActiveTab(tabId);
  };

  const [waterDemandData, setWaterDemandData] = useState(null);
  const [waterDemandLoading, setWaterDemandLoading] = useState(false);

  const [plotsTelemetry, setPlotsTelemetry] = useState(null);

  // Real farm-average trend series for the Analytics Hub Overview charts —
  // fetched independently of whichever index is on the map, since Overview
  // shows NDVI/NDMI/EVI/LST all at once. Each entry's "mean" comes straight
  // from /timeseries/slider (a true per-date average over the raster), not
  // from /plots/intelligence's indices field — that field is a single
  // latest-value scalar per plot, not a {date: value} map, so indexing it
  // by date (as the old chart-building code did) was always undefined and
  // every chart point silently rendered as 0.
  const [overviewTrends, setOverviewTrends] = useState({ ndvi: [], ndmi: [], evi: [], lst: [], rvi: [] });
  useEffect(() => {
    const relevantSubpage = activeAnalyticsSubpage === 'overview' || activeAnalyticsSubpage === 'vigor-health' || activeAnalyticsSubpage === 'moisture-et';
    if (!(activeSidebarItem === 'analytics' && activeTab === 'monitor' && relevantSubpage)) return;
    let active = true;
    const windowEnd = new Date();
    const windowStart = new Date();
    windowStart.setMonth(windowStart.getMonth() - 6);
    const isoDate = (d) => d.toISOString().slice(0, 10);
    async function loadOverviewTrends() {
      const specs = [
        { key: 'ndvi', sensor: undefined },
        { key: 'ndmi', sensor: undefined },
        { key: 'evi', sensor: undefined },
        { key: 'lst', sensor: 'landsat' },
        { key: 'rvi', sensor: 'sentinel-1' },
      ];
      const results = await Promise.all(specs.map(s =>
        api.fetchTimeseriesSlider({
          farm: tenant || 'farm_1', index: s.key, sensor: s.sensor,
          start: isoDate(windowStart), end: isoDate(windowEnd), cropType,
        }).catch(err => { console.error(`Failed to fetch ${s.key} trend:`, err); return null; })
      ));
      if (!active) return;
      const next = {};
      specs.forEach((s, i) => {
        next[s.key] = (results[i]?.timeline || []).filter(t => t.mean != null);
      });
      setOverviewTrends(next);
    }
    loadOverviewTrends();
    return () => { active = false; };
  }, [activeSidebarItem, activeTab, activeAnalyticsSubpage, tenant, cropType]);

  const [stats, setStats] = useState(null);
  const [plots, setPlots] = useState([]);
  const [restorationZones, setRestorationZones] = useState([]);
  // Data that could not be loaded, shown in one note instead of an empty page.
  const [loadIssues, setLoadIssues] = useState([]);
  const noteLoadIssue = useCallback((what, err) => {
    console.warn(`Could not load ${what}:`, err);
    setLoadIssues((l) => (l.includes(what) ? l : [...l, what]));
  }, []);
  const [alerts, setAlerts] = useState([]);
  const [landUseChange, setLandUseChange] = useState(null);
  const [landUseChangeLoading, setLandUseChangeLoading] = useState(false);

  // Same live backend data as the organization view — the crop pages must render
  // the identical experience (map, splits, calendar, charts, alerts, boundary).
  // Crop-specific narrowing (index profiles, legends) layers on top via cropType.
  useEffect(() => {
    if (!hasSession) return; // no authenticated session — redirect effect handles it
    let active = true;
    async function loadBackendData() {
      // Each part loads on its own: one refused or failed request (e.g. restoration
      // zones for an organisation without that service) never blanks the others.
      const [statsRes, plotsRes, zonesRes, alertsRes] = await Promise.allSettled([
        api.fetchDashboardStats(tenant),
        api.fetchPlotsIntelligence(tenant),
        api.fetchRestorationZones(tenant),
        api.fetchAlerts(tenant),
      ]);
      if (!active) return;
      const ok = (r, what, optional = false) => {
        if (r.status === 'fulfilled') return r.value;
        // A service this organisation does not have is not a failure to report.
        if (!(optional && /\b403\b/.test(String(r.reason?.message)))) noteLoadIssue(what, r.reason);
        return null;
      };
      const statsVal = ok(statsRes, 'summary figures');
      if (statsVal) setStats(statsVal);
      const plotsVal = ok(plotsRes, 'blocks');
      if (plotsVal) setPlots(plotsVal);
      setRestorationZones(ok(zonesRes, 'restoration zones', true) || []);
      const alertsVal = ok(alertsRes, 'alerts');
      try {
        const boundary = await api.fetchFarmBoundary();
        if (active && boundary && boundary.geometry) setFarmBoundary(boundary);
      } catch (e) {
        noteLoadIssue('farm outline', e);
      }
      if (alertsVal) {
        // Workflow status from the server: seen, scout sent, resolved or dismissed all count as handled.
        const handled = (a) => a.acknowledged || ['scout_assigned', 'resolved', 'dismissed'].includes(a.status);
        setAlerts((alertsVal.feed || []).map(a => ({
          id: a.alert_id,
          plot: a.plot_id,
          category: a.type,
          severity: a.severity,
          desc: a.message,
          date: (a.timestamp || '').split(' ')[0],
          time: (a.timestamp || '').split(' ')[1] || '',
          status: handled(a) ? 'Acknowledged' : 'Active',
          workflow: a.status || 'open',
          module: a.module || '',
        })));
      }
    }
    loadBackendData();
    return () => { active = false; };
  }, [tenant, noteLoadIssue]);
  const [selectedBasemap, setSelectedBasemap] = useState('esri-imagery'); // satellite by default
  // Google's hybrid tile layer (lyrs=y) bakes place-name/road labels into the
  // imagery; lyrs=s is the same satellite imagery with no labels. Only
  // relevant when Google is the active basemap.
  const [showGoogleLabels, setShowGoogleLabels] = useState(true);
  // Basemap ids that are live composites rendered from the tenant's own
  // archive (as opposed to static external imagery like Google/ESRI) — these
  // change with the time slider, same as the NDVI/NDMI overlay.
  const COMPOSITE_BASEMAP_IDS = { 'true-color': 'true_color', 'false-color': 'false_color', 'sar-rgb': 'sar_rgb' };
  const activeComposite = COMPOSITE_BASEMAP_IDS[selectedBasemap] || null;
  const [compositeSliderData, setCompositeSliderData] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState('ndvi');
  const [mapOpacity, setMapOpacity] = useState(80);
  const [showRasterLayer, setShowRasterLayer] = useState(true);
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [availableIndices, setAvailableIndices] = useState([]);
  // Boundary-property keys the admin picked at onboarding to show as
  // dashboard filter dropdowns (empty = no extra filters). Values are
  // filtered client-side from plotsData's own .filters, already populated
  // by get_plots_intelligence — no separate fetch per filter value.
  const [dashboardFilterKeys, setDashboardFilterKeys] = useState([]);
  const [dynamicFilterValues, setDynamicFilterValues] = useState({});

  // Enumerate available zarr indices for the active tenant
  useEffect(() => {
    async function loadIndices() {
      try {
        const data = await api.fetchRasterIndices();
        if (data?.indices?.length) setAvailableIndices(data.indices);
      } catch (err) {
        noteLoadIssue('satellite layers', err);
      }
    }
    loadIndices();
  }, [tenant, noteLoadIssue]);

  useEffect(() => {
    async function loadFilterConfig() {
      try {
        const cfg = await api.fetchCropMonitoringConfig();
        setDashboardFilterKeys(cfg?.dashboard_filter_keys || []);
      } catch (err) {
        noteLoadIssue('dashboard settings', err);
      }
    }
    loadFilterConfig();
  }, [tenant, noteLoadIssue]);

  // Fetch the composite's own timeline + tile URLs (same {date: url} shape as
  // the index slider) whenever a composite basemap is selected. Cleared when
  // switching away so a stale composite tile never lingers under a static
  // basemap.
  useEffect(() => {
    if (!activeComposite) { setCompositeSliderData(null); return; }
    let active = true;
    async function loadCompositeSlider() {
      try {
        const data = await api.fetchCompositeSlider({ farm: tenant || 'farm_1', composite: activeComposite });
        if (active) setCompositeSliderData(data);
      } catch (err) {
        noteLoadIssue('satellite pictures', err);
        if (active) setCompositeSliderData(null);
      }
    }
    loadCompositeSlider();
    return () => { active = false; };
  }, [activeComposite, tenant, noteLoadIssue]);

  // ── Water Management (FAO-56 ETc + irrigation efficiency) ────────────────
  // Fetched only while that sidebar section is open — same real-data-only
  // contract as every other panel (nulls when the pipeline hasn't run yet).
  useEffect(() => {
    const onMonitorTab = activeSidebarItem === 'analytics' && activeTab === 'monitor';
    const needsWaterDemand = onMonitorTab && (activeAnalyticsSubpage === 'et-log' || activeAnalyticsSubpage === 'water-management');
    if (!needsWaterDemand) return;
    let active = true;
    async function loadWaterDemand() {
      setWaterDemandLoading(true);
      try {
        const data = await api.fetchPlotsWaterDemand({});
        if (active) setWaterDemandData(data);
      } catch (err) {
        noteLoadIssue('water figures', err);
        if (active) setWaterDemandData(null);
      } finally {
        if (active) setWaterDemandLoading(false);
      }
    }
    loadWaterDemand();
    return () => { active = false; };
  }, [activeSidebarItem, activeTab, activeAnalyticsSubpage, tenant, noteLoadIssue]);

  // ── Climate telemetry (real per-plot LST from the Landsat thermal band;
  // soil temp/rainfall/VPD have no real per-plot source and stay null —
  // see get_plots_telemetry) — fetched only while Climate is open. ────────
  useEffect(() => {
    if (activeSidebarItem !== 'climate') return;
    let active = true;
    async function loadTelemetry() {
      try {
        const data = await api.fetchPlotsTelemetry({});
        if (active) setPlotsTelemetry(data);
      } catch (err) {
        noteLoadIssue('weather per block', err);
        if (active) setPlotsTelemetry(null);
      }
    }
    loadTelemetry();
    return () => { active = false; };
  }, [activeSidebarItem, tenant, noteLoadIssue]);

  // ── ESA WorldCover land-use-change (Land Restoration tab) ────────────────
  useEffect(() => {
    if (activeSidebarItem !== 'land-restoration') return;
    let active = true;
    async function loadLandUseChange() {
      setLandUseChangeLoading(true);
      try {
        const data = await api.fetchLandUseChange();
        if (active) setLandUseChange(data && Object.keys(data).length ? data : null);
      } catch (err) {
        noteLoadIssue('land cover change', err);
        if (active) setLandUseChange(null);
      } finally {
        if (active) setLandUseChangeLoading(false);
      }
    }
    loadLandUseChange();
    return () => { active = false; };
  }, [activeSidebarItem, tenant, noteLoadIssue]);

  // ── Crop-specific index profile (from /crop-monitoring/indices) ──────────
  // Ordered by agronomic priority, each entry carries the crop-specific label,
  // notes and legend classification for this crop's interpretation.
  const cropProfileEntries = useMemo(() => cropIndices?.indices || [], [cropIndices]);
  const cropPrimaryIndex = cropIndices?.primary_index || null;

  // Block colours follow the admin's interpretation: the block's real value for
  // that index, classified with the legend classes the superadmin set for this
  // crop (Crop thresholds, served with the crop's indices). The fixed table is
  // only a fallback when no admin legend exists. No value -> no colour (never
  // a value borrowed from another index).
  const blockValue = (plot, key) => {
    const v = plot.indices?.[key] ?? (key === 'ndvi' ? plot.ndvi : key === 'ndmi' ? plot.ndmi : key === 'lswi' ? (plot.indices?.lswi ?? plot.ndmi) : null);
    return v == null || Number.isNaN(Number(v)) ? null : Number(v);
  };

  // Start on the crop's primary index once data is available (once only)
  const primaryAppliedRef = useRef(false);
  useEffect(() => {
    if (primaryAppliedRef.current || !cropPrimaryIndex || !availableIndices.length) return;
    const exists = availableIndices.some(i => String(i.index).toLowerCase() === cropPrimaryIndex);
    if (exists) setSelectedIndex(cropPrimaryIndex);
    primaryAppliedRef.current = true;
  }, [cropPrimaryIndex, availableIndices]);

  // Declared here (not near their other timeline/calendar state below) because
  // the slider- and timeline-building effects that follow reference their
  // setters — declaring them after those effects put the setters in the
  // temporal dead zone at the point of use (only safe because effects run
  // post-render, but fragile and flagged by react-hooks/immutability).
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [zarrBounds, setZarrBounds] = useState(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear,  setCalendarYear]  = useState(new Date().getFullYear());
  // Tracks whether the mini-calendar's month has been auto-positioned to the
  // active pass at least once — after that, only an explicit date pick
  // should move it; a background data refresh should not undo the user's
  // own prev/next-month navigation.
  const calendarInitializedRef = useRef(false);
  const [selectedTimelineIndex, setSelectedTimelineIndex] = useState(2);

  const [refreshSlider, setRefreshSlider] = useState(0);
  const [selectedSensor, setSelectedSensor] = useState('sentinel-2'); // 'sentinel-2' | 'landsat'
  // Set right before a sensor/index switch triggered by picking a specific
  // calendar date (see selectDateWithSensor below) — consumed once the
  // resulting TIMELINE_DATA reload lands, so the slider jumps to that exact
  // date instead of always defaulting to the most recent acquisition.
  const pendingCalendarDateRef = useRef(null);
  // { date, sensors } while a calendar day with imagery from more than one
  // satellite is awaiting the user's choice of which one to view.
  const [satellitePicker, setSatellitePicker] = useState(null);

  const SAR_INDICES = new Set(['rvi', 'dprvi', 'smi', 'flood_mask', 'sar_rvi', 'sar_dprvi', 'sar_smi']);
  const isSarIndex = SAR_INDICES.has((selectedIndex || '').toLowerCase());
  // SAR indices are always Sentinel-1; optical defaults to user-chosen sensor
  const effectiveSensor = isSarIndex ? 'sentinel-1' : selectedSensor;

  // Jumps the map to a specific calendar date on a specific satellite. If
  // that satellite isn't already the active one, switches sensor/index first
  // (via pendingCalendarDateRef, resolved once TIMELINE_DATA reloads);
  // otherwise the date is already in the current timeline, so it applies
  // immediately with no reload needed.
  const selectDateWithSensor = (dateStr, sensor) => {
    const alreadyActive = sensor === 'sentinel-1' ? isSarIndex : (!isSarIndex && sensor === selectedSensor);
    if (alreadyActive) {
      const idx = TIMELINE_DATA.findIndex(t => t.date === dateStr);
      if (idx !== -1) setSelectedTimelineIndex(idx);
      return;
    }
    pendingCalendarDateRef.current = dateStr;
    if (sensor === 'sentinel-1') {
      setSelectedIndex('rvi');
    } else {
      if (isSarIndex) setSelectedIndex('ndvi');
      setSelectedSensor(sensor);
    }
  };

  // Fetch timeseries slider and pre-rendered raster overlays.
  // The previous tiles/timeline stay on screen while the new data loads —
  // clearing them upfront caused the whole map to blink blank on every refetch.
  useEffect(() => {
    async function loadSliderData() {
      setTimelineLoading(true);
      try {
        const indexName = (selectedIndex || 'ndvi').toLowerCase();
        const sensorParam = isSarIndex ? 'sentinel-1' : selectedSensor;
        // Rolling 6-month window ending today — a fixed Jan–Mar 2026 range
        // stopped showing any new imagery the moment that quarter passed.
        const windowEnd = new Date();
        const windowStart = new Date();
        windowStart.setMonth(windowStart.getMonth() - 6);
        const isoDate = (d) => d.toISOString().slice(0, 10);
        const data = await api.fetchTimeseriesSlider({
          farm: tenant || 'farm_1',
          index: indexName,
          start: isoDate(windowStart),
          end: isoDate(windowEnd),
          sensor: sensorParam,
          // Crop mode: tiles are coloured with this crop's legend classes.
          // Org mode: cropType is undefined, so no crop_type is sent and the
          // tile server falls back to the generic classes — matching the
          // generic legends shown in this mode.
          cropType,
        });
        setSliderData(data);
        // Keep zarr bounds in sync when index changes (SAR vs optical extents may differ)
        if (data?.zarr_bounds) setZarrBounds(data.zarr_bounds);
      } catch (err) {
        noteLoadIssue('satellite dates', err);
      } finally {
        setTimelineLoading(false);
      }
    }
    loadSliderData();
    // NOTE: selectedPlot is deliberately NOT a dependency — clicking a plot
    // fetches its pixel timeseries separately and must not reload (and blink)
    // the whole farm raster.
  }, [selectedIndex, tenant, refreshSlider, selectedSensor, noteLoadIssue]);

  // Click handler to fetch Zarr pixel timeseries
  const handlePlotClick = async (plot, lat, lng) => {
    setSelectedPlot(plot);
    try {
      const farmId = getBackendFarmId(plot.id);
      const indexName = (selectedIndex || 'ndvi').toLowerCase();
      const data = await api.fetchPixelTimeseries({
        farm: `farm_${farmId}`,
        index: indexName,
        lat,
        lon: lng
      });
      if (data && data.series) {
        setPixelTimeseries(data.series);
      } else {
        setPixelTimeseries(null);
      }
    } catch (err) {
      noteLoadIssue("the block's history", err);
      setPixelTimeseries(null);
    }
  };

  // Real timeline loaded from backend zarr/TIF data — no mock values
  const [TIMELINE_DATA, setTIMELINE_DATA] = useState([]);
  const [tileRefreshing, setTileRefreshing] = useState(false);
  // Full imagery coverage across every sensor — independent of whichever
  // single sensor+index is currently selected on the map, so the calendar
  // shows everything the archive actually has, not just today's selection.
  const [calendarDates, setCalendarDates] = useState([]);
  useEffect(() => {
    let active = true;
    async function loadCalendarDates() {
      try {
        const data = await api.fetchTimeseriesCalendar({ farm: tenant || 'farm_1' });
        if (active) setCalendarDates(data?.dates || []);
      } catch (err) {
        noteLoadIssue('the image calendar', err);
      }
    }
    loadCalendarDates();
    return () => { active = false; };
  }, [tenant, noteLoadIssue]);
  const SENSOR_DOT_COLOR = { 'sentinel-2': '#16a34a', 'landsat': '#d97706', 'sentinel-1': '#2563eb' };
  // (timelineLoading, zarrBounds, calendarMonth, calendarYear, selectedTimelineIndex
  // are declared earlier — see note above the slider-fetching effect)

  // Build TIMELINE_DATA from sliderData — single source of truth, no separate NDVI fetch.
  // This guarantees currentTimeline.date always matches sliderData.tiles keys.
  useEffect(() => {
    if (!sliderData) return;
    setTimelineLoading(false);
    if (!sliderData.timeline?.length) {
      setTIMELINE_DATA([]);
      return;
    }
    const entries = sliderData.timeline.map((t) => {
      let sumNdvi = 0, countNdvi = 0;
      let sumNdmi = 0, countNdmi = 0;
      let sumEvi = 0, countEvi = 0;
      let sumChl = 0, countChl = 0;
      let sumNdwi = 0, countNdwi = 0;

      if (plots && plots.length > 0) {
        plots.forEach(p => {
          if (p.indices) {
            if (p.indices.ndvi && p.indices.ndvi[t.date] != null) { sumNdvi += p.indices.ndvi[t.date]; countNdvi++; }
            if (p.indices.ndmi && p.indices.ndmi[t.date] != null) { sumNdmi += p.indices.ndmi[t.date]; countNdmi++; }
            if (p.indices.evi && p.indices.evi[t.date] != null) { sumEvi += p.indices.evi[t.date]; countEvi++; }
            if (p.indices.cvi && p.indices.cvi[t.date] != null) { sumChl += p.indices.cvi[t.date]; countChl++; }
            if (p.indices.ndwi && p.indices.ndwi[t.date] != null) { sumNdwi += p.indices.ndwi[t.date]; countNdwi++; }
          }
        });
      }

      return {
        date: t.date,
        label: t.label,
        satellite: t.satellite || null,
        quality: '—',
        ndvi: countNdvi > 0 ? sumNdvi / countNdvi : (t.ndvi ?? 0),
        ndmi: countNdmi > 0 ? sumNdmi / countNdmi : (t.ndmi ?? 0),
        evi: countEvi > 0 ? sumEvi / countEvi : 0,
        chlorophyll: countChl > 0 ? sumChl / countChl : 0,
        ndwi: countNdwi > 0 ? sumNdwi / countNdwi : 0,
        color: '#16A34A',
        tileUrl: (sliderData.tiles || {})[t.date] || null,
      };
    });
    setTIMELINE_DATA(entries);
    if (entries.length > 0) {
      // If the user just picked a specific date from the calendar (possibly
      // triggering a sensor/index switch first), land on THAT date once this
      // reload lands, instead of always jumping to the most recent one.
      const pending = pendingCalendarDateRef.current;
      pendingCalendarDateRef.current = null;
      const pendingIdx = pending ? entries.findIndex(e => e.date === pending) : -1;
      const targetIdx = pendingIdx !== -1 ? pendingIdx : entries.length - 1;
      const target = entries[targetIdx].date;
      setSelectedTimelineIndex(targetIdx);
      // Only snap the mini-calendar's displayed month to the active pass on
      // an explicit date pick or the very first load — this effect re-runs
      // on every sliderData/plots refresh (index switch, tenant reload,
      // periodic polling, ...), and unconditionally resetting
      // calendarMonth/Year here undid the user's own prev/next-month
      // navigation moments after they clicked it, making "Passes This
      // Month" look permanently stuck on whatever month the active pass
      // is in.
      if (pendingIdx !== -1 || !calendarInitializedRef.current) {
        const d = new Date(target);
        setCalendarMonth(d.getMonth());
        setCalendarYear(d.getFullYear());
      }
      calendarInitializedRef.current = true;
    }
  }, [sliderData, plots]);

  const [isCompareMode, setIsCompareMode] = useState(false);
  const [compareTimelineIndex, setCompareTimelineIndex] = useState(3);

  // activeTimelineIndex drives map tile rendering — debounced briefly after
  // slider/calendar stops moving, so dragging doesn't fire a tile request
  // per frame. selectedTimelineIndex updates instantly for slider position feedback.
  const [activeTimelineIndex, setActiveTimelineIndex] = useState(2);
  const [activeCompareTimelineIndex, setActiveCompareTimelineIndex] = useState(3);
  const [sliderPending, setSliderPending] = useState(false);
  const sliderTimerA = useRef(null);
  const sliderTimerB = useRef(null);

  useEffect(() => {
    setSliderPending(true);
    clearTimeout(sliderTimerA.current);
    sliderTimerA.current = setTimeout(() => {
      setActiveTimelineIndex(selectedTimelineIndex);
      setSliderPending(false);
    }, 400);
    return () => clearTimeout(sliderTimerA.current);
  }, [selectedTimelineIndex]);

  useEffect(() => {
    clearTimeout(sliderTimerB.current);
    sliderTimerB.current = setTimeout(() => {
      setActiveCompareTimelineIndex(compareTimelineIndex);
    }, 400);
    return () => clearTimeout(sliderTimerB.current);
  }, [compareTimelineIndex]);

  const clampedTimelineIndex = Math.min(activeTimelineIndex, TIMELINE_DATA.length - 1);
  const currentTimelineA = TIMELINE_DATA[clampedTimelineIndex >= 0 ? clampedTimelineIndex : 0];
  const clampedCompareTimelineIndex = Math.min(activeCompareTimelineIndex, TIMELINE_DATA.length - 1);
  const currentTimelineB = TIMELINE_DATA[clampedCompareTimelineIndex >= 0 ? clampedCompareTimelineIndex : 0];
  const currentTimeline = currentTimelineA;

  const plotsDataA = useMemo(() => {
    if (plots && plots.length > 0) {
      return plots.map(p => {
        let coords = [];
        if (p.boundary && p.boundary.coordinates && p.boundary.coordinates[0]) {
          coords = api.geoJsonToLeaflet(p.boundary.coordinates[0]);
        } else {
          coords = [];
        }
        const ndviVal = p.indices?.ndvi ?? null; // null until the first satellite result: never counted as stressed
        const ndmiVal = p.indices?.ndmi ?? null;
        const healthVal = ndviVal == null ? 'No data' : ndviVal > 0.7 ? 'Optimal' : ndviVal > 0.55 ? 'Good' : 'Stressed';
        const colorVal = healthVal === 'Optimal' ? '#15803d' : healthVal === 'Good' ? '#84cc16' : healthVal === 'Stressed' ? '#dc2626' : '#9CA3AF';
        return { id: p.plot_id, name: p.name || p.plot_id, area: p.area_ha != null ? `${p.area_ha} HA` : null, health: healthVal, ndvi: ndviVal, ndmi: ndmiVal, color: colorVal, coords, indices: p.indices, subfarm: p.subfarm || p.division || null, division: p.division || null, blocId: p.bloc_id || null, filters: p.filters || {}, farmId: p.farm_id || null };
      });
    }
    return [];
  }, [plots, currentTimelineA]);

  const plotsDataB = useMemo(() => {
    if (plots && plots.length > 0) {
      return plots.map(p => {
        let coords = [];
        if (p.boundary && p.boundary.coordinates && p.boundary.coordinates[0]) {
          coords = api.geoJsonToLeaflet(p.boundary.coordinates[0]);
        } else {
          coords = [];
        }
        const ndviVal = p.indices?.ndvi ?? null; // null until the first satellite result: never counted as stressed
        const ndmiVal = p.indices?.ndmi ?? null;
        const healthVal = ndviVal == null ? 'No data' : ndviVal > 0.7 ? 'Optimal' : ndviVal > 0.55 ? 'Good' : 'Stressed';
        const colorVal = healthVal === 'Optimal' ? '#15803d' : healthVal === 'Good' ? '#84cc16' : healthVal === 'Stressed' ? '#dc2626' : '#9CA3AF';
        return { id: p.plot_id, name: p.name || p.plot_id, area: p.area_ha != null ? `${p.area_ha} HA` : null, health: healthVal, ndvi: ndviVal, ndmi: ndmiVal, color: colorVal, coords, indices: p.indices, subfarm: p.subfarm || p.division || null, division: p.division || null, blocId: p.bloc_id || null, filters: p.filters || {}, farmId: p.farm_id || null };
      });
    }
    return [];
  }, [plots, currentTimelineB]);

  // Estates: registered estates from the backend, else the estate names the
  // plots carry (boundary property). The selector only shows with 2 or more.
  const estateOptions = useMemo(() => {
    if (estates.length) return estates.map(e => e.name).filter(Boolean);
    return [...new Set(plotsDataA.map(p => p.subfarm).filter(Boolean))].sort();
  }, [estates, plotsDataA]);
  // Every page reads plotsData, so scoping it to the chosen estate scopes the
  // maps, charts and tables together.
  const plotsData = useMemo(() => {
    if (!filterEstate || filterEstate === 'All') return plotsDataA;
    const est = estates.find(e => e.name === filterEstate);
    return plotsDataA.filter(p => p.subfarm === filterEstate || (est && p.farmId === est.farm_id));
  }, [plotsDataA, filterEstate, estates]);

  // Admin-configured dashboard filters (Super Admin onboarding) narrowed to
  // just the intelligence-layers map view — other tabs/charts keep reading
  // the full plotsData so this doesn't risk breaking aggregate stats.
  const filteredPlotsData = useMemo(() => {
    const activeFilters = Object.entries(dynamicFilterValues).filter(([, v]) => v && v !== 'All');
    if (activeFilters.length === 0) return plotsData;
    return plotsData.filter(p => activeFilters.every(([key, val]) => String(p.filters?.[key]) === val));
  }, [plotsData, dynamicFilterValues]);

  const currentTileUrl = useMemo(() => {
    if (!currentTimeline) return null;
    // sliderData is loaded with selectedIndex — always use it first so index changes take effect
    if (sliderData?.tiles?.[currentTimeline.date]) return sliderData.tiles[currentTimeline.date];
    // fallback: NDVI tile baked into the timeline entry
    if (currentTimeline.tileUrl) return currentTimeline.tileUrl;
    return null;
  }, [sliderData, currentTimeline]);

  // Compare Mode's slot B raster — sliderData.tiles already holds every date
  // in the timeline (not just the one currently selected), so slot B's tile
  // just needs its own date looked up in the same map. Previously there was
  // no second tile at all: the swipe divider and Left/Right date badges
  // rendered, but both sides showed the exact same (or no) raster, since
  // only slot A ever had a TileLayer.
  const currentTileUrlB = useMemo(() => {
    if (!currentTimelineB) return null;
    if (sliderData?.tiles?.[currentTimelineB.date]) return sliderData.tiles[currentTimelineB.date];
    if (currentTimelineB.tileUrl) return currentTimelineB.tileUrl;
    return null;
  }, [sliderData, currentTimelineB]);

  // The composite basemap (true colour / false colour / SAR RGB) is keyed to
  // the SAME acquisition date as the index overlay, so both move together
  // under one time slider.
  const compositeTileUrl = useMemo(() => {
    if (!activeComposite || !currentTimeline || !compositeSliderData?.tiles) return null;
    return compositeSliderData.tiles[currentTimeline.date] || null;
  }, [activeComposite, compositeSliderData, currentTimeline]);

  // Brief flash to signal tile refresh to user when tile URL changes
  useEffect(() => {
    if (!currentTileUrl) return;
    setTileRefreshing(true);
    const t = setTimeout(() => setTileRefreshing(false), 1800);
    return () => clearTimeout(t);
  }, [currentTileUrl]);

  const activePlotBounds = useMemo(() => {
    // For the raster overlay we want full-farm coverage, not a single plot.
    // Priority: all-plots bbox → farm boundary bbox → single plot fallback.
    if (plotsData && plotsData.length > 0) {
      const allLats = plotsData.flatMap(p => (p.coords || []).map(c => c[0]));
      const allLngs = plotsData.flatMap(p => (p.coords || []).map(c => c[1]));
      if (allLats.length > 0) {
        return [
          [Math.min(...allLats), Math.min(...allLngs)],
          [Math.max(...allLats), Math.max(...allLngs)],
        ];
      }
    }
    if (farmBoundary?.properties?.bbox) {
      const { min_lat, max_lat, min_lng, max_lng } = farmBoundary.properties.bbox;
      return [[min_lat, min_lng], [max_lat, max_lng]];
    }
    // Last resort: single selected/first plot
    const activePlot = selectedPlot || (plotsData && plotsData[0]);
    if (!activePlot || !activePlot.coords) return null;
    const lats = activePlot.coords.map(c => c[0]);
    const lngs = activePlot.coords.map(c => c[1]);
    return [
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)],
    ];
  }, [selectedPlot, plotsData, farmBoundary]);

  // Bounds used for the raster ImageOverlay: prefer zarr-derived bounds (exact pixel coverage)
  // over GeoJSON-derived bounds which may differ from the zarr spatial extent.
  const rasterOverlayBounds = useMemo(() => {
    if (zarrBounds) return zarrBounds;
    return activePlotBounds;
  }, [zarrBounds, activePlotBounds]);

  const renderInfoTooltip = (...args) => renderInfoTooltipImpl({  }, ...args);


  // Layout Resizing States
  const [sidebarWidth, setSidebarWidth] = useState(240);
  // Was 175 — too cramped for the calendar's satellite-coverage dots and the
  // multi-satellite picker that can appear underneath it. Still user-resizable.
  const [bottomPanelHeight, setBottomPanelHeight] = useState(260);
  const [isBottomPanelMinimized, setIsBottomPanelMinimized] = useState(true); // collapsed until opened
  const [activeResizeType, setActiveResizeType] = useState(null); // 'sidebar', 'bottom', or null

  const startSidebarResize = (e) => {
    e.preventDefault();
    setActiveResizeType('sidebar');
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const doDrag = (moveEvent) => {
      const newWidth = Math.max(180, Math.min(360, startWidth + (moveEvent.clientX - startX)));
      setSidebarWidth(newWidth);
    };

    const stopDrag = () => {
      setActiveResizeType(null);
      document.removeEventListener('mousemove', doDrag);
      document.removeEventListener('mouseup', stopDrag);
    };

    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', stopDrag);
  };

  const startBottomPanelResize = (e) => {
    e.preventDefault();
    setActiveResizeType('bottom');
    const startY = e.clientY;
    const startHeight = bottomPanelHeight;

    const doDrag = (moveEvent) => {
      const newHeight = Math.max(120, Math.min(500, startHeight - (moveEvent.clientY - startY)));
      setBottomPanelHeight(newHeight);
    };

    const stopDrag = () => {
      setActiveResizeType(null);
      document.removeEventListener('mousemove', doDrag);
      document.removeEventListener('mouseup', stopDrag);
    };

    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', stopDrag);
  };

  const [activeDateSlot, setActiveDateSlot] = useState('A');
  const [splitPosition, setSplitPosition] = useState(50);
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);

  // Handle Split Dragging
  const handleSplitDragStart = (e) => {
    e.preventDefault();
    setIsDraggingSplit(true);
  };

  useEffect(() => {
    if (!isDraggingSplit) return;

    const handleMove = (e) => {
      const mapContainer = document.querySelector('.map-wrapper-pane');
      if (!mapContainer) return;

      const rect = mapContainer.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const relativeX = clientX - rect.left;
      let percentage = (relativeX / rect.width) * 100;
      
      if (percentage < 0) percentage = 0;
      if (percentage > 100) percentage = 100;
      
      setSplitPosition(percentage);
    };

    const handleDragEnd = () => {
      setIsDraggingSplit(false);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleDragEnd);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleDragEnd);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [isDraggingSplit]);


  const [showBasemapDropdown, setShowBasemapDropdown] = useState(false);
  const basemapDropdownRef = useRef(null);

  // Close basemap dropdown on outside click
  useEffect(() => {
    const handler = e => {
      if (basemapDropdownRef.current && !basemapDropdownRef.current.contains(e.target)) {
        setShowBasemapDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const renderFloatingBasemapSelector = (...args) => renderFloatingBasemapSelectorImpl({ activeComposite, basemapDropdownRef, compositeTileUrl, selectedBasemap, setSelectedBasemap, setShowBasemapDropdown, setShowGoogleLabels, showBasemapDropdown, showGoogleLabels }, ...args);

  // Reports state

  // Verification state


  // Chat state
  const [scenarioFormOpen, setScenarioFormOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { sender: 'assistant', text: "Ask about your fields: crop condition, water, weather or alerts. Answers use your own monitoring data." }
  ]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef(null);

  // Map play / calendar / user menu
  const [isPlaying, setIsPlaying]       = useState(false);
  const [showUserMenu,  setShowUserMenu]  = useState(false);
  const userMenuRef = useRef(null);

  // Dashboard filter states
  const [filterPlot, setFilterPlot] = useState('All');
  const [filterDate, setFilterDate] = useState('All');


  // Land Restoration new layers states


  // Alerts Command Center redesigned states

  // Dropdown layout states

  // Intelligence layers new states

  // Crop Health missing layers states

  // Climate missing layers states

  // Land Restoration missing layers states

  // Land Restoration states

  // Crop Yield states

  // Crop Health states

  // Climate map states

  // Intelligence Layers map layers states
  const [intelShowLayers, setIntelShowLayers] = useState(true);
  const [intelShowBoundaries, setIntelShowBoundaries] = useState(true);
  const [intelBoundariesOpacity, setIntelBoundariesOpacity] = useState(100);

  // Left sidebar Tools states
  const [showCalendarTool, setShowCalendarTool] = useState(true);
  const [showTimeSliderTool, setShowTimeSliderTool] = useState(true);

  // Settings and User Management States — only the real logged-in account,
  // no fabricated team roster. Additional members appear when invited.

  // User Management Invite Form States

  // Configuration API Keys States

  // Help Topics States

  // Crop Health map layers states
  const [healthShowLayers, setHealthShowLayers] = useState(true);
  const [healthShowBoundaries, setHealthShowBoundaries] = useState(true);
  const [healthBoundariesOpacity, setHealthBoundariesOpacity] = useState(100);

  // Moisture Content map layers states
  const [moistureShowLayers, setMoistureShowLayers] = useState(true);
  const [moistureShowBoundaries, setMoistureShowBoundaries] = useState(true);
  const [moistureBoundariesOpacity, setMoistureBoundariesOpacity] = useState(100);

  // The signed-in person, read-only here; it is changed at /org/<tenant>/settings.
  const profileEmail = localStorage.getItem('fi_email') || '';
  const profileName = localStorage.getItem('fi_full_name') || profileEmail.split('@')[0] || 'Account';
  const profileRole = roleLabel(localStorage.getItem('fi_role') || 'admin');
  const profileInitials = profileName.split(/[\s._-]+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';
  const [showNotifications, setShowNotifications] = useState(false);

  // Collapsible sidebar section groups states (collapsed/false by default)

  // Crop legend cards: which index legends are manually expanded
  // (the index currently rendered on the map is always expanded)
  const [expandedLegendKeys, setExpandedLegendKeys] = useState([]);
  const toggleLegendKey = (key) => setExpandedLegendKeys(prev =>
    prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);

  // ── Legend cards ────────────────────────────────────────────────────────
  // Both modes render the same card; only the source of the entries differs:
  //   crop mode — the crop's index profile, with crop-specific class
  //               breakpoints and agronomic wording (indices absent from the
  //               archive are shown disabled as "(No data)").
  //   org  mode — every index actually present in the tenant's archive, with
  //               the generic scientific classes.
  // Normalising here means one card implementation, not two.
  // Org mode has no crop context, so indices are grouped from their
  // crop-agnostic INDEX_REGISTRY tags rather than the crop-specific
  // crop_group the backend computes for crop mode (see below).
  const groupFromTags = (tags = [], key = '') => {
    const t = tags.map(x => String(x).toLowerCase());
    const k = String(key).toLowerCase();
    
    // Ground Moisture: Soil moisture, SAR SMI, thermal soil moisture, NDTI
    if (k === 'smi' || k === 'smi_landsat' || k === 'ndti' || t.some(x => ['soil-water', 'soil-moisture', 'ground-moisture', 'thermal-moisture'].includes(x))) {
      return 'Ground Moisture';
    }
    // Vegetation Moisture: Optical canopy moisture & water status (NDMI, NDWI, LSWI, MSI, WDI)
    if (k === 'ndmi' || k === 'ndwi' || k === 'lswi' || k === 'msi' || k === 'wdi' || t.some(x => ['water', 'moisture', 'water-stress', 'canopy-water', 'flood', 'paddy', 'irrigation', 'drought', 'evapotranspiration', 'canopy-moisture'].includes(x))) {
      return 'Vegetation Moisture';
    }
    if (t.some(x => ['chlorophyll', 'nitrogen', 'nutrient', 'phenology'].includes(x))) {
      return 'Nutrient & Chlorophyll';
    }
    return 'Vegetation Health';
  };

  const legendEntries = useMemo(() => {
    if (isOrg) {
      return availableIndices.map(ix => {
        const key = String(ix.index).toLowerCase();
        const title = ix.label || key.toUpperCase();
        return {
          key,
          title,
          tooltip: title,
          subtitle: ix.full || title,
          legend: ix.legend || [],
          notes: '',
          hasData: true,
          ramp: [ix.lo, ix.hi],
          group: groupFromTags(ix.tags, key),
        };
      });
    }
    return cropProfileEntries.map(entry => ({
      key: entry.key,
      title: entry.crop_label || entry.label,
      tooltip: entry.label,
      subtitle: entry.full || entry.label,
      legend: entry.legend || [],
      notes: entry.notes || '',
      hasData: availableIndices.some(i => String(i.index).toLowerCase() === entry.key),
      ramp: null,
      group: groupFromTags(entry.tags || [], entry.key),
    }));
  }, [isOrg, availableIndices, cropProfileEntries]);

  const legendGroups = useMemo(() => {
    const groups = {};
    legendEntries.forEach(entry => {
      const g = entry.group || 'General';
      (groups[g] = groups[g] || []).push(entry);
    });
    return groups;
  }, [legendEntries]);

  // Group headers collapsed by default except the first, so the panel
  // isn't a wall of text on first open.
  const [expandedLegendGroups, setExpandedLegendGroups] = useState(null);
  const toggleLegendGroup = (name) => setExpandedLegendGroups(prev => {
    const current = prev || Object.keys(legendGroups).slice(0, 1);
    return current.includes(name) ? current.filter(g => g !== name) : [...current, name];
  });

  // Plain empty state (docs/INFORMATION_PRESENTATION.md, section 5)
  const emptyLegendMessage = "We're preparing your first satellite views. They usually appear within a few days of setup.";

  // Reused by every map section's Map Layers sidebar. The switch puts that
  // index's raster ON the map — one raster at a time. Cards are grouped
  // under a named category (Vegetation Health, Water & Moisture, Nutrient &
  // Chlorophyll, Structure & Moisture, ...) instead of one flat list — see
  // legendGroups above, sourced from crop_group (crop mode) or INDEX_REGISTRY
  // tags (org mode).
  const renderLegendCard = (...args) => renderLegendCardImpl({ expandedLegendKeys, mapOpacity, openGlossary, renderInfoTooltip, selectedIndex, setMapOpacity, setSelectedIndex, setShowRasterLayer, showRasterLayer, toggleLegendKey }, ...args);

  // groupFilter narrows which legend groups a page shows — e.g. Crop Health
  // only needs vegetation-vigor indicators, not the whole catalog (SAR,
  // water/moisture, etc). Omit it (as Map Analytics does) to show
  // everything — that page is the one deliberate "see the full archive"
  // view; every other page should show a distinct, non-overlapping slice
  // rather than repeating the same full index list.
  const renderLegendCards = (...args) => renderLegendCardsImpl({ emptyLegendMessage, expandedLegendGroups, legendEntries, legendGroups, renderLegendCard, selectedIndex, showRasterLayer, toggleLegendGroup }, ...args);








  const getHealthPlotStyleOutline = () => {
    const color = '#000000'; // block outlines are always black
    
    return {
      color: healthShowBoundaries ? color : 'transparent',
      weight: healthShowBoundaries ? 2.5 : 0,
      opacity: healthBoundariesOpacity / 100,
      // Outlines only: blocks are never filled (results show in charts and block details).
      fillColor: 'transparent',
      fillOpacity: 0
    };
  };


  // Crop Yield map layers states
  const [yieldShowLayers, setYieldShowLayers] = useState(true);
  const [yieldShowBoundaries, setYieldShowBoundaries] = useState(true);
  const [yieldBoundariesOpacity, setYieldBoundariesOpacity] = useState(100);

  const getYieldPlotStyleOutline = () => ({
    color: yieldShowBoundaries ? '#000000' : 'transparent',
    weight: yieldShowBoundaries ? 2.5 : 0,
    opacity: yieldBoundariesOpacity / 100,
    fillColor: 'transparent',
    fillOpacity: 0
  });


  // Climate map layers states
  const [climateShowLayers, setClimateShowLayers] = useState(true);
  const [climateShowBoundaries, setClimateShowBoundaries] = useState(true);
  const [climateBoundariesOpacity, setClimateBoundariesOpacity] = useState(100);

  const getClimatePlotStyleOutline = () => ({
    color: climateShowBoundaries ? '#000000' : 'transparent',
    weight: climateShowBoundaries ? 2.5 : 0,
    opacity: climateBoundariesOpacity / 100,
    fillColor: 'transparent',
    fillOpacity: 0
  });


  // Land Restoration map layers states
  const [restoreShowLayers, setRestoreShowLayers] = useState(true);
  const [restoreShowBoundaries, setRestoreShowBoundaries] = useState(true);
  const [restoreBoundariesOpacity, setRestoreBoundariesOpacity] = useState(100);

  // Layer independent toggle handlers for each page (allowing concurrent layers)





  const getRestorePlotStyleOutline = () => ({
    color: restoreShowBoundaries ? '#000000' : 'transparent',
    weight: restoreShowBoundaries ? 2.5 : 0,
    opacity: restoreBoundariesOpacity / 100,
    fillColor: 'transparent',
    fillOpacity: 0
  });


  const getIntelPlotStyleOutline = () => ({
    color: intelShowBoundaries ? '#000000' : 'transparent',
    weight: intelShowBoundaries ? 2.5 : 0,
    opacity: intelBoundariesOpacity / 100,
    fillColor: 'transparent',
    fillOpacity: 0
  });



  // Helper methods to render overlapping active layers

  const renderIntelPolygons = (...args) => renderIntelPolygonsImpl({ getIntelPlotStyleOutline, handlePlotClick, intelShowBoundaries }, ...args);

  const renderHealthPolygons = (...args) => renderHealthPolygonsImpl({ getHealthPlotStyleOutline, handlePlotClick, healthShowBoundaries }, ...args);

  const renderMoisturePolygons = (...args) => renderMoisturePolygonsImpl({ handlePlotClick, moistureBoundariesOpacity, moistureShowBoundaries, showRasterLayer }, ...args);

  // A block or zone filled by the "Colour by" choice of its map page, with
  // the same classes as the panel's legend (dashboard/legends/layerLegends.js).
  const colouredPolygon = (...args) => colouredPolygonImpl({ cropType }, ...args);

  const renderYieldPolygons = (...args) => renderYieldPolygonsImpl({ colouredPolygon, getYieldPlotStyleOutline, handlePlotClick, yieldShowBoundaries }, ...args);

  const RESTORE_VALUE = { restoration_progress: 'progress', survival: 'survivalNum', carbon: 'carbonPerHa' };
  const renderRestorePolygons = (...args) => renderRestorePolygonsImpl({ RESTORE_VALUE, colouredPolygon, getRestorePlotStyleOutline, restoreShowBoundaries }, ...args);

  const CLIMATE_VALUE = { rain: 'rainfall', heat: 'lst' };
  const renderClimatePolygons = (...args) => renderClimatePolygonsImpl({ CLIMATE_VALUE, climateShowBoundaries, colouredPolygon, getClimatePlotStyleOutline, handlePlotClick }, ...args);

  const handleEstateChange = (val) => {
    setFilterEstate(val);
    setFilterPlot('All');
    // Estate filter now uses real subfarm names from plotsData
  };

  const handlePlotChange = (val) => {
    setFilterPlot(val);
  };

  const handleSidebarClick = (item) => {
    setActiveSidebarItem(item);
    setActiveTab('monitor');
    // selectedIndex/showRasterLayer are shared across every section's map —
    // switching sections used to leave whatever raster the previous section
    // had on (e.g. Moisture Content's SMI/SAR) still showing on the next
    // one, with that section's own legend panel not indicating anything as
    // active. A freshly opened section should show only the plot boundary
    // until the user explicitly turns a raster on — so showRasterLayer
    // always resets to false on entry; selectedIndex still gets a sensible
    // per-section default so that if they do turn it on, it's not blank.
    if (item === 'analytics') {
      setActiveTab('monitor');
    } else if (item === 'moisture-content') {
      setSelectedIndex('smi');
    } else if (item === 'crop-health' || item === 'crop-yield' || item === 'intelligence-layers') {
      setSelectedIndex('ndvi');
    } else if (item === 'land-restoration') {
      setSelectedIndex('ndwi');
    }
    setShowRasterLayer(false);
    // Which legend groups/cards were expanded is per-section UI state —
    // left as component-wide state, it carried over between pages (e.g.
    // Crop Health's "Vegetation Health" group left expanded would show as
    // expanded on Moisture Content too, whose own groups are unrelated),
    // making it look like group selection was "stuck" on whatever was last
    // opened instead of responding to the section actually being viewed.
    setExpandedLegendGroups(null);
    setExpandedLegendKeys([]);
  };


  const handlePlotFilterChange = (plotId) => {
    setFilterPlot(plotId);
    handlePlotChange(plotId);
  };

  const handleAcknowledgeAlert = (alertId) => {
    // Optimistic update, reverted if the backend call fails — previously
    // this only mutated local state, so acknowledgements never persisted
    // and reappeared as "Active" after a refresh.
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: 'Acknowledged' } : a));
    api.acknowledgeAlert(alertId).catch(err => {
      console.error('Failed to acknowledge alert:', err);
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: 'Active' } : a));
    });
  };





  const healthPlotsDataA = useMemo(() => {
    if (plots && plots.length > 0) {
      return plots.map(p => {
        let coords = [];
        if (p.boundary && p.boundary.coordinates && p.boundary.coordinates[0]) {
          coords = api.geoJsonToLeaflet(p.boundary.coordinates[0]);
        } else {
          coords = [];
        }
        const ndviVal = p.indices?.ndvi ?? null; // null until the first satellite result: never counted as stressed
        const healthVal = ndviVal == null ? 'No data' : ndviVal > 0.7 ? 'Optimal' : ndviVal > 0.55 ? 'Good' : 'Stressed';
        return {
          id: p.plot_id,
          name: p.name || p.plot_id,
          area: p.area_ha != null ? `${p.area_ha} ha` : null,
          health: healthVal,
          ndvi: ndviVal,
          savi: p.indices?.savi ?? null,
          ndwi: p.indices?.ndwi ?? null,
          cumulative_rainfall_14d: p.indices?.cumulative_rainfall_14d ?? null,
          chlorophyll: p.indices?.chlorophyll ?? null,
          waterStress: p.indices?.ndmi ?? null,
          pestRisk: p.indices?.uas_anomaly_score > 0.4 ? 'High Risk' : p.indices?.uas_anomaly_score > 0.15 ? 'Moderate Risk' : 'Low Risk',
          coords
        };
      });
    }
    return [];
  }, [plots, currentTimelineA]);

  const healthPlotsDataB = useMemo(() => {
    if (plots && plots.length > 0) {
      return plots.map(p => {
        let coords = [];
        if (p.boundary && p.boundary.coordinates && p.boundary.coordinates[0]) {
          coords = api.geoJsonToLeaflet(p.boundary.coordinates[0]);
        } else {
          coords = [];
        }
        const ndviVal = p.indices?.ndvi ?? null; // null until the first satellite result: never counted as stressed
        const healthVal = ndviVal == null ? 'No data' : ndviVal > 0.7 ? 'Optimal' : ndviVal > 0.55 ? 'Good' : 'Stressed';
        return {
          id: p.plot_id,
          name: p.name || p.plot_id,
          area: p.area_ha != null ? `${p.area_ha} ha` : null,
          health: healthVal,
          ndvi: ndviVal,
          savi: p.indices?.savi ?? null,
          ndwi: p.indices?.ndwi ?? null,
          cumulative_rainfall_14d: p.indices?.cumulative_rainfall_14d ?? null,
          chlorophyll: p.indices?.chlorophyll ?? null,
          waterStress: p.indices?.ndmi ?? null,
          pestRisk: p.indices?.uas_anomaly_score > 0.4 ? 'High Risk' : p.indices?.uas_anomaly_score > 0.15 ? 'Moderate Risk' : 'Low Risk',
          coords
        };
      });
    }
    return [];
  }, [plots, currentTimelineB]);

  const healthPlotsData = healthPlotsDataA;

  const moisturePlotsDataA = useMemo(() => {
    if (plots && plots.length > 0) {
      return plots.map(p => {
        let coords = [];
        if (p.boundary && p.boundary.coordinates && p.boundary.coordinates[0]) {
          coords = api.geoJsonToLeaflet(p.boundary.coordinates[0]);
        }
        const ndmiVal = p.indices?.ndmi ?? null;
        const ndwiVal = p.indices?.ndwi ?? null;
        const lswiVal = p.indices?.lswi ?? null;
        const smiVal = p.indices?.smi ?? null;
        const msiVal = p.indices?.msi ?? null;

        let activeVal = ndmiVal;
        if (selectedIndex === 'ndwi') activeVal = ndwiVal;
        else if (selectedIndex === 'lswi') activeVal = lswiVal;
        else if (selectedIndex === 'smi') activeVal = smiVal;
        else if (selectedIndex === 'msi') activeVal = msiVal;

        let status = 'Adequate';
        let color = '#60a5fa';
        if (activeVal != null) {
          if (selectedIndex === 'smi') {
            status = activeVal > 5 ? 'Wet Soil' : activeVal > 2 ? 'Adequate' : 'Dry Soil';
            color = activeVal > 5 ? '#1d4ed8' : activeVal > 2 ? '#60a5fa' : '#dc2626';
          } else {
            status = activeVal > 0.35 ? 'Well-Hydrated' : activeVal > 0.15 ? 'Adequate' : activeVal > -0.05 ? 'Mild Deficit' : 'Severe Deficit';
            color = activeVal > 0.35 ? '#1d4ed8' : activeVal > 0.15 ? '#60a5fa' : activeVal > -0.05 ? '#fbbf24' : '#dc2626';
          }
        }
        return {
          id: p.plot_id,
          name: p.name || p.plot_id,
          area: p.area_ha != null ? `${p.area_ha} ha` : null,
          ndmi: ndmiVal,
          ndwi: ndwiVal,
          lswi: lswiVal,
          smi: smiVal,
          msi: msiVal,
          activeVal,
          moistureStatus: status,
          color,
          coords
        };
      });
    }
    return [];
  }, [plots, currentTimelineA, selectedIndex]);

  const moisturePlotsDataB = useMemo(() => {
    if (plots && plots.length > 0) {
      return plots.map(p => {
        let coords = [];
        if (p.boundary && p.boundary.coordinates && p.boundary.coordinates[0]) {
          coords = api.geoJsonToLeaflet(p.boundary.coordinates[0]);
        }
        const ndmiVal = p.indices?.ndmi ?? null;
        const ndwiVal = p.indices?.ndwi ?? null;
        const lswiVal = p.indices?.lswi ?? null;
        const smiVal = p.indices?.smi ?? null;
        const msiVal = p.indices?.msi ?? null;

        let activeVal = ndmiVal;
        if (selectedIndex === 'ndwi') activeVal = ndwiVal;
        else if (selectedIndex === 'lswi') activeVal = lswiVal;
        else if (selectedIndex === 'smi') activeVal = smiVal;
        else if (selectedIndex === 'msi') activeVal = msiVal;

        let status = 'Adequate';
        let color = '#60a5fa';
        if (activeVal != null) {
          if (selectedIndex === 'smi') {
            status = activeVal > 5 ? 'Wet Soil' : activeVal > 2 ? 'Adequate' : 'Dry Soil';
            color = activeVal > 5 ? '#1d4ed8' : activeVal > 2 ? '#60a5fa' : '#dc2626';
          } else {
            status = activeVal > 0.35 ? 'Well-Hydrated' : activeVal > 0.15 ? 'Adequate' : activeVal > -0.05 ? 'Mild Deficit' : 'Severe Deficit';
            color = activeVal > 0.35 ? '#1d4ed8' : activeVal > 0.15 ? '#60a5fa' : activeVal > -0.05 ? '#fbbf24' : '#dc2626';
          }
        }
        return {
          id: p.plot_id,
          name: p.name || p.plot_id,
          area: p.area_ha != null ? `${p.area_ha} ha` : null,
          ndmi: ndmiVal,
          ndwi: ndwiVal,
          lswi: lswiVal,
          smi: smiVal,
          msi: msiVal,
          activeVal,
          moistureStatus: status,
          color,
          coords
        };
      });
    }
    return [];
  }, [plots, currentTimelineB, selectedIndex]);

  const moisturePlotsData = moisturePlotsDataA;

  const yieldPlotsDataA = useMemo(() => {
    if (plots && plots.length > 0) {
      return plots.map(p => {
        let coords = [];
        if (p.boundary && p.boundary.coordinates && p.boundary.coordinates[0]) {
          coords = api.geoJsonToLeaflet(p.boundary.coordinates[0]);
        } else {
          coords = [];
        }
        return {
          id: p.plot_id,
          name: p.name || p.plot_id,
          area: p.area_ha != null ? `${p.area_ha} ha` : null,
          // From harvest records (Farm data); empty until they are uploaded.
          yieldValue: p.yield_t_ha ?? null,
          coords
        };
      });
    }
    return [];
  }, [plots, currentTimelineA]);

  const yieldPlotsDataB = useMemo(() => {
    if (plots && plots.length > 0) {
      return plots.map(p => {
        let coords = [];
        if (p.boundary && p.boundary.coordinates && p.boundary.coordinates[0]) {
          coords = api.geoJsonToLeaflet(p.boundary.coordinates[0]);
        } else {
          coords = [];
        }
        return {
          id: p.plot_id,
          name: p.name || p.plot_id,
          area: p.area_ha != null ? `${p.area_ha} ha` : null,
          // From harvest records (Farm data); empty until they are uploaded.
          yieldValue: p.yield_t_ha ?? null,
          coords
        };
      });
    }
    return [];
  }, [plots, currentTimelineB]);

  const yieldPlotsData = yieldPlotsDataA;

  const climatePlotsDataA = useMemo(() => {
    if (plots && plots.length > 0) {
      return plots.map((p) => {
        let coords = [];
        if (p.boundary && p.boundary.coordinates && p.boundary.coordinates[0]) {
          coords = api.geoJsonToLeaflet(p.boundary.coordinates[0]);
        } else {
          coords = [];
        }
        // Rain and surface heat per block from /plots/telemetry; null when
        // the run had no reading, never invented.
        const telemetry = (plotsTelemetry || []).find(t => t.plot_id === p.plot_id);
        return {
          id: p.plot_id,
          name: p.name || p.plot_id,
          area: p.area_ha != null ? `${p.area_ha} ha` : null,
          rainfall: telemetry?.rainfall_mm ?? null,
          lst: telemetry?.surface_lst_celsius ?? null,
          coords
        };
      });
    }
    return [];
  }, [plots, currentTimelineA, selectedTimelineIndex, plotsTelemetry]);

  const climatePlotsDataB = useMemo(() => {
    if (plots && plots.length > 0) {
      return plots.map((p) => {
        let coords = [];
        if (p.boundary && p.boundary.coordinates && p.boundary.coordinates[0]) {
          coords = api.geoJsonToLeaflet(p.boundary.coordinates[0]);
        } else {
          coords = [];
        }
        const telemetry = (plotsTelemetry || []).find(t => t.plot_id === p.plot_id);
        return {
          id: p.plot_id,
          name: p.name || p.plot_id,
          area: p.area_ha != null ? `${p.area_ha} ha` : null,
          rainfall: telemetry?.rainfall_mm ?? null,
          lst: telemetry?.surface_lst_celsius ?? null,
          coords
        };
      });
    }
    return [];
  }, [plots, currentTimelineB, compareTimelineIndex, plotsTelemetry]);

  const climatePlotsData = climatePlotsDataA;

  const restorationPlotsDataA = useMemo(() => {
    if (restorationZones && restorationZones.length > 0) {
      return restorationZones.map(z => {
        let coords = [];
        if (z.boundary && z.boundary.coordinates && z.boundary.coordinates[0]) {
          coords = api.geoJsonToLeaflet(z.boundary.coordinates[0]);
        } else {
          coords = [];
        }
        return {
          id: z.zone_id,
          name: z.name,
          area: z.area_ha != null ? `${z.area_ha} ha` : null,
          carbonPerHa: z.carbon_offset_tco2e != null && z.area_ha ? z.carbon_offset_tco2e / z.area_ha : null,
          type: z.project_type ?? null,
          progress: z.progress_pct ?? null,
          survival: z.survival_rate_pct != null ? `${z.survival_rate_pct}%` : '—',
          trees: z.tree_count != null ? z.tree_count.toLocaleString() : '—',
          carbon: z.carbon_offset_tco2e != null ? `${z.carbon_offset_tco2e} tCO2e` : '—',
          status: z.status ?? null,
          coords,
          manager: z.manager ?? null,
          survivalNum: z.survival_rate_pct ?? null
        };
      });
    }
    return [];
  }, [restorationZones, currentTimelineA]);

  const restorationPlotsDataB = useMemo(() => {
    if (restorationZones && restorationZones.length > 0) {
      return restorationZones.map(z => {
        let coords = [];
        if (z.boundary && z.boundary.coordinates && z.boundary.coordinates[0]) {
          coords = api.geoJsonToLeaflet(z.boundary.coordinates[0]);
        } else {
          coords = [];
        }
        return {
          id: z.zone_id,
          name: z.name,
          area: z.area_ha != null ? `${z.area_ha} ha` : null,
          carbonPerHa: z.carbon_offset_tco2e != null && z.area_ha ? z.carbon_offset_tco2e / z.area_ha : null,
          type: z.project_type ?? null,
          progress: z.progress_pct ?? null,
          survival: z.survival_rate_pct != null ? `${z.survival_rate_pct}%` : '—',
          trees: z.tree_count != null ? z.tree_count.toLocaleString() : '—',
          carbon: z.carbon_offset_tco2e != null ? `${z.carbon_offset_tco2e} tCO2e` : '—',
          status: z.status ?? null,
          coords,
          manager: z.manager ?? null,
          survivalNum: z.survival_rate_pct ?? null
        };
      });
    }
    return [];
  }, [restorationZones, currentTimelineB]);

  const restorationPlotsData = restorationPlotsDataA;




  const renderMapBottomPanel = (...args) => renderMapBottomPanelImpl({ canPrevCal, canNextCal, SENSOR_DOT_COLOR, TIMELINE_DATA, activeDateSlot, bottomPanelHeight, calDaysInMonth, calFirstDay, calTrailing, calendarDates, calendarMonth, calendarYear, compareTimelineIndex, currentTimeline, currentTimelineA, currentTimelineB, effectiveSensor, isBottomPanelMinimized, isCompareMode, isPlaying, nextCalMonth, prevCalMonth, satellitePicker, selectDateWithSensor, selectedIndex, selectedTimelineIndex, setCompareTimelineIndex, setIsBottomPanelMinimized, setRefreshSlider, setSatellitePicker, setSelectedTimelineIndex, showCalendarTool, showTimeSliderTool, sliderPending, startBottomPanelResize, timelineLoading, togglePlay }, ...args);

  // Dynamic Dashboard Calculations — real data only, no mock fallback

  // Inputs for the Overview KPI cards. Condition classes come from the
  // admin's map classes for the index: best = highest class, worst = lowest.
  const kpiContext = useMemo(() => {
    const classify = (plot, key) => {
      const v = blockValue(plot, key);
      const legend = cropProfileEntries.find(e => e.key === key)?.legend;
      if (v == null || !Array.isArray(legend) || !legend.length) return null;
      const sorted = [...legend].filter(l => Array.isArray(l.range)).sort((x, y) => Number(x.range[0]) - Number(y.range[0]));
      const cls = sorted.find(l => v >= l.range[0] && v <= l.range[1]);
      if (!cls) return null;
      const i = sorted.indexOf(cls);
      return { label: cls.label, rank: i === sorted.length - 1 ? 'best' : i === 0 ? 'worst' : 'middle' };
    };
    const keys = cropProfileEntries.map(e => e.key);
    return {
      plots: plotsData,
      stats,
      alerts,
      classify,
      primaryKey: cropPrimaryIndex || keys[0] || null,
      waterKey: ['ndmi', 'lswi', 'smi'].find(k => keys.includes(k)) || null,
      unitLabel: UNIT_LABEL[service?.id] || (service ? null : CROP_UNIT[cropType]) || 'blocks',
      latestPass: currentTimeline?.label || null,
    };
  }, [plotsData, stats, alerts, cropProfileEntries, cropPrimaryIndex, service, cropType, currentTimeline]);








  const nutrientData = useMemo(() => {
    // Derive radar axes from real zarr index values via currentTimeline
    // Missing values stay null (never drawn as 0); the card shows an empty state instead
    const ndvi  = currentTimeline?.ndvi  ?? null;
    const ndmi  = currentTimeline?.ndmi  ?? null;
    const evi   = currentTimeline?.evi   ?? null;
    const reci  = currentTimeline?.reci  ?? null;
    const ndre  = currentTimeline?.ndre  ?? null;
    const lswi  = currentTimeline?.lswi  ?? null;
    // Normalise each index to 0-100 using known physical ranges
    const norm = (v, lo, hi) => (v == null ? null : Math.min(100, Math.max(0, Math.round(((v - lo) / (hi - lo)) * 100))));
    return {
      hasData: [ndvi, ndre, ndmi, evi, reci, lswi].some(v => v != null),
      labels: ['Crop health', 'Leaf greenness', 'Leaf water', 'Canopy density', 'Leaf colour', 'Canopy water'],
      datasets: [{
        label: 'Farm index profile',
        data: [
          norm(ndvi,  -0.2, 1.0),
          norm(ndre,  -0.1, 0.8),
          norm(ndmi,  -0.6, 0.8),
          norm(evi,   -0.2, 1.0),
          norm(reci,   0.0, 5.0),
          norm(lswi,  -0.6, 0.8),
        ],
        backgroundColor: 'rgba(22, 163, 74, 0.15)',
        borderColor: '#16A34A',
        pointBackgroundColor: '#16A34A',
        borderWidth: 2.5,
      }]
    };
  }, [currentTimeline]);







  // Static fallback (ESRI World Imagery) shown while a composite's own tiles
  // are still loading, so the basemap never goes blank mid-fetch.
  const STATIC_BASEMAP_FALLBACK = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
  // ESRI's World_Terrain_Base has real global satellite coverage but
  // genuinely sparse terrain-relief coverage over much of Africa — at the
  // farm's actual location and zoom level it returned a literal "Map data
  // not yet available" placeholder tile instead of a 404, so it looked
  // broken rather than missing. OpenTopoMap (OSM + SRTM-derived, no API
  // key) has real, complete tiles at the same coordinates and zoom.
  const TERRAIN_BASEMAP_URL = 'https://a.tile.opentopomap.org/{z}/{x}/{y}.png';
  const basemapUrl = useMemo(() => {
    if (activeComposite) return compositeTileUrl || STATIC_BASEMAP_FALLBACK;
    if (selectedBasemap === 'terrain') return TERRAIN_BASEMAP_URL;
    if (selectedBasemap === 'osm-streets') return 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
    if (selectedBasemap === 'esri-imagery') return STATIC_BASEMAP_FALLBACK;
    if (selectedBasemap === 'google-hybrid') {
      // lyrs=y = satellite + labels, lyrs=s = satellite only
      return `https://mt1.google.com/vt/lyrs=${showGoogleLabels ? 'y' : 's'}&x={x}&y={y}&z={z}`;
    }
    return STATIC_BASEMAP_FALLBACK;
  }, [selectedBasemap, activeComposite, compositeTileUrl, showGoogleLabels]);
  // OpenTopoMap's real (non-upscaled) tiles top out at z17 — the shared
  // maxNativeZoom={18} that worked fine for satellite sources requested
  // tiles one level past what terrain actually has.
  // Credit for whichever background is showing (docs/DATA_SOURCES.md, credits).
  const basemapAttribution = activeComposite ? `Contains modified Copernicus Sentinel data ${new Date().getFullYear()}`
    : selectedBasemap === 'google-hybrid' ? 'Imagery © Google'
      : selectedBasemap === 'terrain' ? 'Map data © OpenStreetMap contributors, SRTM · Map style © OpenTopoMap (CC-BY-SA)'
        : selectedBasemap === 'osm-streets' ? '© OpenStreetMap contributors'
          : 'Imagery © Esri, Maxar, Earthstar Geographics';
  const basemapMaxNativeZoom = (selectedBasemap === 'terrain' || selectedBasemap === 'osm-streets') && !activeComposite ? (selectedBasemap === 'terrain' ? 17 : 19) : 18;


  // Reset timeline selection to middle index when changing month/year
  useEffect(() => {
    setSelectedTimelineIndex(2);
  }, [calendarMonth, calendarYear]);

  const [chatLoading, setChatLoading] = useState(false);

  // One AI agent endpoint for questions and what-if scenarios. The chat shows
  // the readable question; the agent also gets the portal context and, for
  // scenarios, the advisor answer layout.
  const handleChatSubmit = async (textToSend, scenarioMeta = null) => {
    const query = textToSend || chatInput;
    if (!query.trim() || chatLoading) return;
    setChatMessages(prev => [...prev, { sender: 'user', text: query, scenario: scenarioMeta?.scenario || null }]);
    if (!textToSend) setChatInput('');
    setChatLoading(true);
    const context = [
      `Organisation: ${tenantDisplayName}`,
      service ? `Service: ${service.title}` : (!isOrg && cropLabel ? `Crop: ${cropLabel}` : null),
      filterEstate && filterEstate !== 'All' ? `Estate: ${filterEstate}` : null,
    ].filter(Boolean).join('. ');
    const agentQuery = scenarioMeta
      ? `[Scenario ${scenarioMeta.scenario}] ${query}

Context: ${context}.
${ANSWER_FORMAT}`
      : `${query}

Context: ${context}.`;
    try {
      const result = await api.queryAiAgent(agentQuery);
      const reply = result?.response || "No response from AI agent.";
      setChatMessages(prev => [...prev, { sender: 'assistant', text: reply, sources: result?.sources }]);
    } catch {
      setChatMessages(prev => [...prev, { sender: 'assistant', text: "Sorry, the AI assistant is unavailable right now. Please try again." }]);
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    if (selectedPlot) {
      const updated = plotsData.find(p => p.id === selectedPlot.id);
      if (updated) setSelectedPlot(updated);
    }
  }, [plotsData]);

  // Play auto-advance
  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => {
      if (isCompareMode) {
        if (activeDateSlot === 'A') {
          setSelectedTimelineIndex(prev => {
            if (prev >= TIMELINE_DATA.length - 1) { setIsPlaying(false); return prev; }
            return prev + 1;
          });
        } else {
          setCompareTimelineIndex(prev => {
            if (prev >= TIMELINE_DATA.length - 1) { setIsPlaying(false); return prev; }
            return prev + 1;
          });
        }
      } else {
        setSelectedTimelineIndex(prev => {
          if (prev >= TIMELINE_DATA.length - 1) { setIsPlaying(false); return prev; }
          return prev + 1;
        });
      }
    }, 10000);
    return () => clearInterval(id);
  }, [isPlaying, isCompareMode, activeDateSlot, TIMELINE_DATA.length]);

  // Stop playing when leaving map view
  useEffect(() => {
    if (!['crop-health', 'crop-yield', 'climate', 'land-restoration'].includes(activeSidebarItem)) {
      setIsPlaying(false);
    }
  }, [activeSidebarItem]);

  // Close user menu on outside click
  useEffect(() => {
    const handler = e => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const togglePlay = () => setIsPlaying(p => !p);






  // The calendar stays between the oldest image we hold and this month: no
  // future months, and no empty months before the data starts.
  const calMonthKey = calendarYear * 12 + calendarMonth;
  const nowMonthKey = new Date().getFullYear() * 12 + new Date().getMonth();
  const oldestMonthKey = useMemo(() => {
    const dates = [...(calendarDates || []).map(d => d.date), ...(TIMELINE_DATA || []).map(t => t.date)].filter(Boolean).sort();
    if (!dates.length) return nowMonthKey;
    const [y, m] = dates[0].split('-').map(Number);
    return y * 12 + (m - 1);
  }, [calendarDates, TIMELINE_DATA, nowMonthKey]);
  const canPrevCal = calMonthKey > oldestMonthKey;
  const canNextCal = calMonthKey < nowMonthKey;
  const prevCalMonth = () => {
    if (!canPrevCal) return;
    if (calendarMonth === 0) { setCalendarMonth(11); setCalendarYear(y => y - 1); }
    else setCalendarMonth(m => m - 1);
  };
  const nextCalMonth = () => {
    if (!canNextCal) return;
    if (calendarMonth === 11) { setCalendarMonth(0); setCalendarYear(y => y + 1); }
    else setCalendarMonth(m => m + 1);
  };

  // Calendar computed values
  const calFirstDay    = new Date(calendarYear, calendarMonth, 1).getDay();
  const calDaysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const calTrailing    = 42 - calFirstDay - calDaysInMonth;

  // ─── Health badge helper ────────────────────────────────────────────────

  return (
    <div className="h-screen flex flex-col bg-gray-50 text-gray-900 font-sans antialiased overflow-hidden">
      {hasSession && (
        <DataNeededDialog
          cropType={isOrg ? null : cropType}
          serviceId={service?.id}
          onFill={(id) => { setActiveTab('monitor'); setActiveSidebarItem('farm-data'); setDataFocus(id); }}
        />
      )}
      {/* ── TOP HEADER BAR ─────────────────────────────────────────────────── */}
      {renderDashboardHeader({ activeTab, alerts, cropLabel, estateOptions, filterEstate, handleEstateChange, handleTopNavTabClick, onBack, onSignOut, pick, profileEmail, profileInitials, profileName, profileRole, service, setShowNotifications, setShowUserMenu, showNotifications, showUserMenu, tenant, tenantDisplayName, userMenuRef })}
      {hasSession && <NewResultsBanner />}

      {/* ── MAIN WORKSPACE ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── LEFT SIDEBAR ── */}
        {!isAiOnly && activeTab === 'monitor' && (
          renderDashboardSidebar({ TIMELINE_DATA, activeDateSlot, activeSidebarItem, alerts, compareTimelineIndex, handleSidebarClick, isCompareMode, pageSet, pick, selectedTimelineIndex, service, setActiveDateSlot, setCompareTimelineIndex, setIsCompareMode, setShowCalendarTool, setShowTimeSliderTool, showCalendarTool, showTimeSliderTool, sidebarWidth, startSidebarResize })
        )}

        {/* ── WORKSPACE CONTENT ── */}
        {renderDashboardPages({ TIMELINE_DATA, activeAnalyticsSubpage, activeSidebarItem, activeTab, alerts, answersForm, basemapAttribution, basemapMaxNativeZoom, basemapUrl, blockValue, chatEndRef, chatInput, chatLoading, chatMessages, climateBoundariesOpacity, climatePlotsData, climatePlotsDataA, climatePlotsDataB, climateShowBoundaries, climateShowLayers, cropLabel, cropProfileEntries, cropType, currentTileUrl, currentTileUrlB, currentTimelineA, currentTimelineB, dashboardFilterKeys, dataFocus, defaultMapCenter, dynamicFilterValues, estateOptions, farmBoundary, filterDate, filterEstate, filterPlot, filteredPlotsData, glossaryFocus, handleAcknowledgeAlert, handleChatSubmit, handleEstateChange, handlePlotClick, handlePlotFilterChange, handleSidebarClick, handleSplitDragStart, healthBoundariesOpacity, healthPlotsData, healthPlotsDataA, healthPlotsDataB, healthShowBoundaries, healthShowLayers, intelBoundariesOpacity, intelShowBoundaries, intelShowLayers, isAiOnly, isCompareMode, isOrg, kpiContext, landUseChange, landUseChangeLoading, loadIssues, mapOpacity, moistureBoundariesOpacity, moisturePlotsData, moisturePlotsDataA, moisturePlotsDataB, moistureShowBoundaries, moistureShowLayers, nutrientData, overviewTrends, pageSet, pick, pixelTimeseries, plots, plotsData, plotsDataA, plotsDataB, rasterOverlayBounds, renderClimatePolygons, renderFloatingBasemapSelector, renderHealthPolygons, renderInfoTooltip, renderIntelPolygons, renderLegendCards, renderMapBottomPanel, renderMoisturePolygons, renderRestorePolygons, renderYieldPolygons, restorationPlotsData, restorationPlotsDataA, restorationPlotsDataB, restoreBoundariesOpacity, restoreShowBoundaries, restoreShowLayers, scenarioFormOpen, selectedIndex, selectedPlot, service, setActiveAnalyticsSubpage, setActiveSidebarItem, setActiveTab, setAnswersForm, setChatInput, setChatMessages, setClimateBoundariesOpacity, setClimateShowBoundaries, setClimateShowLayers, setDataFocus, setDynamicFilterValues, setFilterDate, setFilterEstate, setFilterPlot, setHealthBoundariesOpacity, setHealthShowBoundaries, setHealthShowLayers, setIntelBoundariesOpacity, setIntelShowBoundaries, setIntelShowLayers, setLoadIssues, setMapOpacity, setMoistureBoundariesOpacity, setMoistureShowBoundaries, setMoistureShowLayers, setRestoreBoundariesOpacity, setRestoreShowBoundaries, setRestoreShowLayers, setScenarioFormOpen, setSelectedPlot, setShowRasterLayer, setYieldBoundariesOpacity, setYieldShowBoundaries, setYieldShowLayers, showRasterLayer, splitPosition, tenant, tenantDisplayName, tileRefreshing, waterDemandData, waterDemandLoading, yieldBoundariesOpacity, yieldPlotsData, yieldPlotsDataA, yieldPlotsDataB, yieldShowBoundaries, yieldShowLayers, zarrBounds })}
      </div>

      {/* Resizing and dragging overlay helper */}
      {(activeResizeType || isDraggingSplit) && (
        <div 
          className={`fixed inset-0 z-[999999] bg-transparent select-none ${
            activeResizeType === 'sidebar' || isDraggingSplit ? 'cursor-col-resize' : 'cursor-row-resize'
          }`}
        />
      )}

    </div>
  );
};

export default CropDashboardLayout;
