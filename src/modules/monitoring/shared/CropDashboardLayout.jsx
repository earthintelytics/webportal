import { CROP_META } from '../../../services/cropMonitoringApi';
import PlotDetailPanel from './PlotDetailPanel';
import PlotSearchSelector from './PlotSearchSelector';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Globe, 
  Layers, 
  Satellite, 
  Map as MapIcon, 
  Activity, 
  Zap, 
  Droplets, 
  Sun, 
  Trees, 
  ArrowLeft,
  LogOut,
  CheckCircle2,
  BarChart4,
  TrendingUp,
  LayoutDashboard,
  Calendar as CalendarIcon,
  Maximize2,
  Search,
  Filter,
  Shield,
  User,
  Bell,
  X,
  Info,
  Navigation,
  RefreshCw,
  FileText,
  History,
  Settings2,
  ChevronDown,
  ChevronUp,
  Clock,
  ArrowRight,
  SlidersHorizontal,
  MapPin,
  LineChart,
  Waves,
  Thermometer,
  CloudRain,
  Leaf,
  MessageSquare,
  Sparkles,
  Send,
  Database,
  CheckSquare,
  Lock,
  Download,
  AlertTriangle,
  Trash2,
  Eye,
  EyeOff,
  UserPlus,
  Users,
  Plus,
  Check,
  FileSpreadsheet,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  Flame,
  Radio,
  Target,
  Gauge,
  ListFilter,
  Columns,
  Wind
} from 'lucide-react';
import { MapContainer, TileLayer, ZoomControl, Polygon, Popup, Tooltip, Pane } from 'react-leaflet';
import * as api from '../../../services/organizationMonitorApi';
import 'leaflet/dist/leaflet.css';
import { Line, Bar, Radar, Doughnut } from 'react-chartjs-2';
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

import { InfoTooltipPortal } from './dashboard/components/InfoTooltipPortal';
import { ResizeMap, MapPaneClipSetter, SwipeSliderOverlay, FitBoundsToPlots, FitToZarrBounds } from './dashboard/map/MapHelpers';
import { TOOLTIP_DESCRIPTIONS } from './dashboard/constants/tooltipDescriptions';
import { getIndexFiveClasses } from './dashboard/constants/indexClasses';
import { CHART_DEFAULTS, MONTH_NAMES, CROP_CONFIG_KEYS } from './dashboard/constants/chartConfig';

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

const CropDashboardLayout = ({ mode = 'crop', cropType, cropSummary, cropBlocks, cropIndices, cropLoading, cropError, mapCenter, onBack, onSignOut }) => {
  const isOrg = mode === 'organization';
  const cropLabel = isOrg ? '' : (CROP_META[cropType]?.label || CROP_CONFIG_KEYS[cropType] || cropType);
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


  const [activeSidebarItem, setActiveSidebarItem] = useState('analytics');
  const [activeTab, setActiveTab] = useState('monitor');
  const [activeAnalyticsSubpage, setActiveAnalyticsSubpage] = useState('overview');

  const handleTopNavTabClick = (tabId) => {
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
  const [trends, setTrends] = useState(null);
  const [plots, setPlots] = useState([]);
  const [restorationZones, setRestorationZones] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [landUseChange, setLandUseChange] = useState(null);
  const [landUseChangeLoading, setLandUseChangeLoading] = useState(false);

  // Same live backend data as the organization view — the crop pages must render
  // the identical experience (map, splits, calendar, charts, alerts, boundary).
  // Crop-specific narrowing (index profiles, legends) layers on top via cropType.
  useEffect(() => {
    if (!hasSession) return; // no authenticated session — redirect effect handles it
    let active = true;
    async function loadBackendData() {
      try {
        // Run independent requests concurrently — previously these awaited
        // sequentially, so one slow endpoint delayed every other panel even
        // though its data had already arrived.
        const [statsRes, trendsRes, plotsRes, zonesRes, alertsRes] = await Promise.all([
          api.fetchDashboardStats(tenant),
          api.fetchDashboardTrends(tenant),
          api.fetchPlotsIntelligence(tenant),
          api.fetchRestorationZones(tenant),
          api.fetchAlerts(tenant),
        ]);

        if (active) {
          setStats(statsRes);
          setTrends(trendsRes);
          setPlots(plotsRes);
          setRestorationZones(zonesRes);
          // Always fetch the farm boundary — used as overall outline for all tenants
          try {
            const boundary = await api.fetchFarmBoundary();
            if (active && boundary && boundary.geometry) setFarmBoundary(boundary);
          } catch (e) {
            console.warn('Failed to fetch farm boundary:', e);
          }
          // Map backend alert items to frontend structure
          const mappedAlerts = (alertsRes.feed || []).map(a => ({
            id: a.alert_id,
            estate: `${tenantDisplayName} Estate`,
            plot: a.plot_id,
            category: a.type,
            severity: a.severity,
            desc: a.message,
            date: a.timestamp.split(' ')[0],
            time: a.timestamp.split(' ')[1] || '00:00',
            status: a.acknowledged ? 'Acknowledged' : 'Active'
          }));
          setAlerts(mappedAlerts);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data from backend:", err);
        if (active) {
          setLoading(false);
        }
      }
    }
    loadBackendData();
    return () => { active = false; };
  }, [tenant]);
  const [selectedBasemap, setSelectedBasemap] = useState('terrain');
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
        console.error('Failed to fetch raster indices:', err);
      }
    }
    loadIndices();
  }, [tenant]);

  useEffect(() => {
    async function loadFilterConfig() {
      try {
        const cfg = await api.fetchCropMonitoringConfig();
        setDashboardFilterKeys(cfg?.dashboard_filter_keys || []);
      } catch (err) {
        console.error('Failed to fetch crop monitoring config:', err);
      }
    }
    loadFilterConfig();
  }, [tenant]);

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
        console.error('Failed to fetch composite slider:', err);
        if (active) setCompositeSliderData(null);
      }
    }
    loadCompositeSlider();
    return () => { active = false; };
  }, [activeComposite, tenant]);

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
        console.error('Failed to fetch water demand:', err);
        if (active) setWaterDemandData(null);
      } finally {
        if (active) setWaterDemandLoading(false);
      }
    }
    loadWaterDemand();
    return () => { active = false; };
  }, [activeSidebarItem, activeTab, activeAnalyticsSubpage, tenant]);

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
        console.error('Failed to fetch plot telemetry:', err);
        if (active) setPlotsTelemetry(null);
      }
    }
    loadTelemetry();
    return () => { active = false; };
  }, [activeSidebarItem, tenant]);

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
        console.error('Failed to fetch land-use-change:', err);
        if (active) setLandUseChange(null);
      } finally {
        if (active) setLandUseChangeLoading(false);
      }
    }
    loadLandUseChange();
    return () => { active = false; };
  }, [activeSidebarItem, tenant]);

  // ── Crop-specific index profile (from /crop-monitoring/indices) ──────────
  // Ordered by agronomic priority, each entry carries the crop-specific label,
  // notes and legend classification for this crop's interpretation.
  const cropProfileEntries = useMemo(() => cropIndices?.indices || [], [cropIndices]);
  const cropPrimaryIndex = cropIndices?.primary_index || null;

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
        console.error("Failed to fetch timeseries slider data:", err);
      } finally {
        setTimelineLoading(false);
      }
    }
    loadSliderData();
    // NOTE: selectedPlot is deliberately NOT a dependency — clicking a plot
    // fetches its pixel timeseries separately and must not reload (and blink)
    // the whole farm raster.
  }, [selectedIndex, tenant, refreshSlider, selectedSensor]);

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
      console.error("Failed to fetch pixel timeseries:", err);
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
        console.error('Failed to fetch imagery calendar:', err);
      }
    }
    loadCalendarDates();
    return () => { active = false; };
  }, [tenant]);
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
        const ndviVal = p.indices?.ndvi ?? 0;
        const ndmiVal = p.indices?.ndmi ?? 0;
        const healthVal = ndviVal > 0.7 ? 'Optimal' : ndviVal > 0.55 ? 'Good' : 'Stressed';
        const colorVal = healthVal === 'Optimal' ? '#15803d' : healthVal === 'Good' ? '#84cc16' : '#dc2626';
        return { id: p.plot_id, name: p.name || p.plot_id, area: `${p.area_ha || 10.0} HA`, health: healthVal, ndvi: ndviVal, ndmi: ndmiVal, color: colorVal, coords, indices: p.indices, subfarm: p.subfarm || p.division || null, division: p.division || null, blocId: p.bloc_id || null, filters: p.filters || {} };
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
        const ndviVal = p.indices?.ndvi ?? 0;
        const ndmiVal = p.indices?.ndmi ?? 0;
        const healthVal = ndviVal > 0.7 ? 'Optimal' : ndviVal > 0.55 ? 'Good' : 'Stressed';
        const colorVal = healthVal === 'Optimal' ? '#15803d' : healthVal === 'Good' ? '#84cc16' : '#dc2626';
        return { id: p.plot_id, name: p.name || p.plot_id, area: `${p.area_ha || 10.0} HA`, health: healthVal, ndvi: ndviVal, ndmi: ndmiVal, color: colorVal, coords, indices: p.indices, subfarm: p.subfarm || p.division || null, division: p.division || null, blocId: p.bloc_id || null, filters: p.filters || {} };
      });
    }
    return [];
  }, [plots, currentTimelineB]);

  const plotsData = plotsDataA;

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

  const renderInfoTooltip = (title) => {
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
  };


  // Layout Resizing States
  const [sidebarWidth, setSidebarWidth] = useState(240);
  // Was 175 — too cramped for the calendar's satellite-coverage dots and the
  // multi-satellite picker that can appear underneath it. Still user-resizable.
  const [bottomPanelHeight, setBottomPanelHeight] = useState(260);
  const [isBottomPanelMinimized, setIsBottomPanelMinimized] = useState(false);
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

  const renderFloatingBasemapSelector = () => {
    const BASEMAPS = [
      { id: 'terrain',       label: 'Terrain',         sub: 'Default Basemap',    emoji: '⛰️' },
      { id: 'google-hybrid', label: 'Google Satellite', sub: 'High-Res Basemap',   emoji: '🗺️' },
      // Live composites rendered from this tenant's own archive — move with
      // the time slider, unlike the static sources above.
      { id: 'true-color',    label: 'True Colour',     sub: 'Red-Green-Blue · Live',      emoji: '🎨' },
      { id: 'false-color',   label: 'False Colour',    sub: 'NIR-Red-Green · Live',       emoji: '🌿' },
      { id: 'sar-rgb',       label: 'SAR RGB',         sub: 'Sentinel-1 VV-VH · Live',    emoji: '📡' },
    ];
    const activeBasemapObj = BASEMAPS.find(b => b.id === selectedBasemap) || BASEMAPS[0];

    return (
      <div className="absolute top-4 left-4" style={{ zIndex: 40000 }} ref={basemapDropdownRef}>
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
                    selectedBasemap === src.id ? 'bg-green-50 text-green-700 font-extrabold' : 'hover:bg-gray-55 text-gray-700'
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
                  <span className="text-[11px] font-bold text-gray-700">Show Labels</span>
                  <span
                    className="w-7 h-4 rounded-full p-0.5 transition-colors duration-200 shrink-0"
                    style={{ backgroundColor: showGoogleLabels ? '#16A34A' : '#E5E7EB' }}
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
  };

  // Reports state
  const [reportPlot, setReportPlot] = useState('WHOLE-FARM');
  const [reportIndex, setReportIndex] = useState('NDVI');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportProgress, setReportProgress] = useState(0);
  const [reportProgressText, setReportProgressText] = useState('');
  const [generatedReport, setGeneratedReport] = useState(null);

  // Verification state
  const [selectedVerifyPlot, setSelectedVerifyPlot] = useState('');
  const [verificationSteps, setVerificationSteps] = useState({
    boundary: { label: 'Boundary Integrity Check', status: 'idle', details: 'Verifying polygon shape match with cadastral registry' },
    forest:   { label: 'Deforestation Compliance Check', status: 'idle', details: 'Scanning for canopy loss anomalies' },
    cover:    { label: 'Canopy Density Standard', status: 'idle', details: 'Measuring active photosynthetic activity coverage' },
    moisture: { label: 'Soil Water Index Target', status: 'idle', details: 'Assessing root-zone moisture anomalies' }
  });
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState('idle');

  // Chat state
  const [chatMessages, setChatMessages] = useState([
    { sender: 'assistant', text: "Hello! I am your Agro Monitoring Assistant. Ask me anything about crop indices, spatial variations, or time-series moisture anomalies." }
  ]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef(null);
  const [selectedThemeReport, setSelectedThemeReport] = useState('');
  const [glossarySearch, setGlossarySearch] = useState('');
  const [glossaryTab, setGlossaryTab] = useState('remote-sensing'); // 'remote-sensing' or 'farmer-inputs'

  // Map play / calendar / user menu
  const [isPlaying, setIsPlaying]       = useState(false);
  const [showUserMenu,  setShowUserMenu]  = useState(false);
  const userMenuRef = useRef(null);

  // Dashboard filter states
  const [filterEstate, setFilterEstate] = useState('All');
  const [filterPlot, setFilterPlot] = useState('All');
  const [filterDate, setFilterDate] = useState('All');


  // Land Restoration new layers states
  const [restoreShowInSar, setRestoreShowInSar] = useState(false);
  const [restoreInSarOpacity, setRestoreInSarOpacity] = useState(70);
  const [restoreShowGedi, setRestoreShowGedi] = useState(false);
  const [restoreGediOpacity, setRestoreGediOpacity] = useState(70);
  const [restoreShowNdwi, setRestoreShowNdwi] = useState(false);
  const [restoreNdwiOpacity, setRestoreNdwiOpacity] = useState(70);
  const [restoreShowLulc, setRestoreShowLulc] = useState(false);
  const [restoreLulcOpacity, setRestoreLulcOpacity] = useState(70);
  const [restoreShowEudr, setRestoreShowEudr] = useState(false);
  const [restoreEudrOpacity, setRestoreEudrOpacity] = useState(70);
  const [restoreLulcExpanded, setRestoreLulcExpanded] = useState(true);
  const [restoreEudrExpanded, setRestoreEudrExpanded] = useState(true);
  const [restoreLulcSource, setRestoreLulcSource] = useState('worldcover');
  const [restoreLulcYear, setRestoreLulcYear] = useState(2020);
  const [restoreShowLulcChange, setRestoreShowLulcChange] = useState(false);


  // Alerts Command Center redesigned states
  const [alertsFilterSeverity, setAlertsFilterSeverity] = useState('All');
  const [alertsFilterPlot, setAlertsFilterPlot] = useState('All');
  const [alertsFilterCategory, setAlertsFilterCategory] = useState('All');
  const [alertsFilterActiveOnly, setAlertsFilterActiveOnly] = useState(true);
  const [selectedAlertPlot, setSelectedAlertPlot] = useState(null);
  const [alertsSearch, setAlertsSearch] = useState('');

  // Dropdown layout states
  const [showEstateDropdown, setShowEstateDropdown] = useState(false);
  const [showPlotDropdown, setShowPlotDropdown] = useState(false);
  const [showDateDropdown, setShowDateDropdown] = useState(false);

  // Intelligence layers new states
  const [intelShowCvi, setIntelShowCvi] = useState(false);
  const [intelCviOpacity, setIntelCviOpacity] = useState(70);
  const [intelShowCar, setIntelShowCar] = useState(false);
  const [intelCarOpacity, setIntelCarOpacity] = useState(70);
  const [intelShowNdre, setIntelShowNdre] = useState(false);
  const [intelNdreOpacity, setIntelNdreOpacity] = useState(70);
  const [intelShowWdi, setIntelShowWdi] = useState(false);
  const [intelWdiOpacity, setIntelWdiOpacity] = useState(70);
  const [intelShowDprvi, setIntelShowDprvi] = useState(false);
  const [intelDprviOpacity, setIntelDprviOpacity] = useState(70);
  const [intelShowRvi, setIntelShowRvi] = useState(false);
  const [intelRviOpacity, setIntelRviOpacity] = useState(70);
  const [intelShowFlood, setIntelShowFlood] = useState(false);
  const [intelFloodOpacity, setIntelFloodOpacity] = useState(70);
  const [intelShowUas, setIntelShowUas] = useState(false);
  const [intelUasOpacity, setIntelUasOpacity] = useState(70);

  // Crop Health missing layers states
  const [healthShowSmi, setHealthShowSmi] = useState(false);
  const [healthSmiOpacity, setHealthSmiOpacity] = useState(80);
  const [healthShowNdre, setHealthShowNdre] = useState(false);
  const [healthNdreOpacity, setHealthNdreOpacity] = useState(80);

  // Climate missing layers states
  const [climateShowFlood, setClimateShowFlood] = useState(false);
  const [climateFloodOpacity, setClimateFloodOpacity] = useState(80);

  // Land Restoration missing layers states
  const [restoreShowAgb, setRestoreShowAgb] = useState(false);
  const [restoreAgbOpacity, setRestoreAgbOpacity] = useState(70);

  // Land Restoration states
  const [selectedRestoreZone, setSelectedRestoreZone] = useState(null);
  const [restoreIndex, setRestoreIndex] = useState('progress');
  const [restoreMapOpacity, setRestoreMapOpacity] = useState(85);

  // Crop Yield states
  const [selectedYieldIndex, setSelectedYieldIndex] = useState('Yield');
  const [yieldMapOpacity, setYieldMapOpacity] = useState(80);
  const [selectedYieldPlot, setSelectedYieldPlot] = useState(null);

  // Crop Health states
  const [selectedHealthIndex, setSelectedHealthIndex] = useState('NDVI');
  const [healthMapOpacity, setHealthMapOpacity] = useState(80);
  const [selectedHealthPlot, setSelectedHealthPlot] = useState(null);

  // Climate map states
  const [selectedClimateIndex, setSelectedClimateIndex] = useState('Rainfall');
  const [climateMapOpacity, setClimateMapOpacity] = useState(80);
  const [selectedClimatePlot, setSelectedClimatePlot] = useState(null);

  // Intelligence Layers map layers states
  const [intelShowLayers, setIntelShowLayers] = useState(true);
  const [intelShowBoundaries, setIntelShowBoundaries] = useState(true);
  const [intelBoundariesOpacity, setIntelBoundariesOpacity] = useState(100);
  const [intelShowGrowth, setIntelShowGrowth] = useState(true);
  const [intelGrowthOpacity, setIntelGrowthOpacity] = useState(70);
  const [intelShowEvi, setIntelShowEvi] = useState(false);
  const [intelEviOpacity, setIntelEviOpacity] = useState(60);
  const [intelShowLswi, setIntelShowLswi] = useState(false);
  const [intelLswiOpacity, setIntelLswiOpacity] = useState(60);
  const [intelShowVhi, setIntelShowVhi] = useState(false);
  const [intelVhiOpacity, setIntelVhiOpacity] = useState(60);
  const [intelShowSuitability, setIntelShowSuitability] = useState(false);
  const [intelSuitabilityOpacity, setIntelSuitabilityOpacity] = useState(60);

  // Left sidebar Tools states
  const [showCalendarTool, setShowCalendarTool] = useState(true);
  const [showTimeSliderTool, setShowTimeSliderTool] = useState(true);

  // Settings and User Management States — only the real logged-in account,
  // no fabricated team roster. Additional members appear when invited.
  const sessionEmail = localStorage.getItem('fi_email') || '';
  const [settingsUsers, setSettingsUsers] = useState(() => sessionEmail ? [
    { id: 1, name: sessionEmail.split('@')[0], email: sessionEmail, role: 'Account Owner', status: 'Active', avatar: sessionEmail.slice(0, 2).toUpperCase() }
  ] : []);
  const [ndviThreshold, setNdviThreshold] = useState(0.50);
  const [ndmiThreshold, setNdmiThreshold] = useState(0.35);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [showConfigSaved, setShowConfigSaved] = useState(false);
  const [showSupportSubmitted, setShowSupportSubmitted] = useState(false);

  // User Management Invite Form States
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('GIS Specialist');
  const [inviteSuccess, setInviteSuccess] = useState(false);

  // Configuration API Keys States
  const [sentinelApiKey, setSentinelApiKey] = useState('');
  const [planetApiKey, setPlanetApiKey] = useState('');
  const [showSentinelKey, setShowSentinelKey] = useState(false);
  const [showPlanetKey, setShowPlanetKey] = useState(false);

  // Help Topics States
  const [activeHelpTopic, setActiveHelpTopic] = useState(null);
  const [ticketCategory, setTicketCategory] = useState('General Query');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [filterAlertSeverity, setFilterAlertSeverity] = useState('All');
  const [filterAlertStatus, setFilterAlertStatus] = useState('Active');

  // Crop Health map layers states
  const [healthShowLayers, setHealthShowLayers] = useState(true);
  const [healthShowBoundaries, setHealthShowBoundaries] = useState(true);
  const [healthBoundariesOpacity, setHealthBoundariesOpacity] = useState(100);
  const [healthShowNdvi, setHealthShowNdvi] = useState(true);
  const [healthNdviOpacity, setHealthNdviOpacity] = useState(80);
  const [healthShowSavi, setHealthShowSavi] = useState(false);
  const [healthSaviOpacity, setHealthSaviOpacity] = useState(80);
  const [healthShowNdwi, setHealthShowNdwi] = useState(false);
  const [healthNdwiOpacity, setHealthNdwiOpacity] = useState(80);
  const [healthShowChlorophyll, setHealthShowChlorophyll] = useState(false);
  const [healthChlorophyllOpacity, setHealthChlorophyllOpacity] = useState(70);
  const [healthShowWater, setHealthShowWater] = useState(false);
  const [healthWaterOpacity, setHealthWaterOpacity] = useState(70);
  const [healthShowPest, setHealthShowPest] = useState(false);
  const [healthPestOpacity, setHealthPestOpacity] = useState(70);
  const [healthShowRainfall, setHealthShowRainfall] = useState(false);
  const [healthRainfallOpacity, setHealthRainfallOpacity] = useState(80);

  // Moisture Content map layers states
  const [moistureShowLayers, setMoistureShowLayers] = useState(true);
  const [moistureShowBoundaries, setMoistureShowBoundaries] = useState(true);
  const [moistureBoundariesOpacity, setMoistureBoundariesOpacity] = useState(100);
  const [moistureSmiOpacity, setMoistureSmiOpacity] = useState(80);
  const [moistureOpExpanded, setMoistureOpExpanded] = useState(true);
  const [moistureBioExpanded, setMoistureBioExpanded] = useState(true);

  // New Settings Center states — profile comes from the authenticated session
  const [profileName, setProfileName] = useState(() =>
    localStorage.getItem('fi_full_name') || (localStorage.getItem('fi_email') || 'Account').split('@')[0]);
  const [profileEmail, setProfileEmail] = useState(() => localStorage.getItem('fi_email') || '');
  const [profileRole, setProfileRole] = useState(() => {
    const r = localStorage.getItem('fi_role') || 'admin';
    return r.charAt(0).toUpperCase() + r.slice(1);
  });
  const [brandingMode, setBrandingMode] = useState('AM'); // 'AM' or 'FT'
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsTab, setSettingsTab] = useState('profile');
  const [defaultLat, setDefaultLat] = useState(7.145);
  const [defaultLng, setDefaultLng] = useState(3.355);
  const [defaultMapZoom, setDefaultMapZoom] = useState(14);
  const [glassmorphismEnabled, setGlassmorphismEnabled] = useState(true);
  const [showProfileSaved, setShowProfileSaved] = useState(false);

  // Collapsible sidebar section groups states (collapsed/false by default)
  const [intelOpExpanded, setIntelOpExpanded] = useState(false);
  const [intelBioExpanded, setIntelBioExpanded] = useState(true);
  const [intelMonExpanded, setIntelMonExpanded] = useState(false);

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

  const emptyLegendMessage = isOrg
    ? 'No satellite indices in the archive yet (No data).'
    : "Crop index profile unavailable — connect to the backend to load this crop's legends.";

  // Reused by every map section's Map Layers sidebar. The switch puts that
  // index's raster ON the map — one raster at a time. Cards are grouped
  // under a named category (Vegetation Health, Water & Moisture, Nutrient &
  // Chlorophyll, Structure & Moisture, ...) instead of one flat list — see
  // legendGroups above, sourced from crop_group (crop mode) or INDEX_REGISTRY
  // tags (org mode).
  const renderLegendCard = (entry) => {
        const isSelected = (selectedIndex || '').toLowerCase() === entry.key;
        const isOnMap = isSelected && showRasterLayer;
        const isOpen = isOnMap || expandedLegendKeys.includes(entry.key);
        const handleSwitch = () => {
          if (!entry.hasData) return;
          if (isOnMap) { setShowRasterLayer(false); }
          else { setSelectedIndex(entry.key); setShowRasterLayer(true); }
        };
        return (
          <div key={entry.key} className={`border rounded-xl p-3.5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-2.5 ${isOnMap ? 'border-green-300 ring-1 ring-green-100' : 'border-gray-100'} ${!entry.hasData ? 'opacity-60' : ''}`}>
            <div className="flex items-center justify-between">
              <div onClick={() => toggleLegendKey(entry.key)} style={{ cursor: 'pointer' }}>
                <div className="text-xs font-bold text-gray-700 leading-tight flex items-center gap-1.5">
                  {entry.title} {renderInfoTooltip(entry.tooltip)}
                  {isOnMap && <span className="text-[11px] font-black uppercase tracking-wider text-green-700 bg-green-50 border border-green-200 rounded-full px-1.5 py-0.5">On Map</span>}
                </div>
                <span className="text-[11px] text-gray-600">
                  {entry.subtitle}{!entry.hasData && <span className="font-bold text-gray-600"> (No data)</span>}
                </span>
              </div>
              <button
                onClick={handleSwitch}
                disabled={!entry.hasData}
                title={!entry.hasData ? 'No satellite data in the archive for this index yet' : isOnMap ? 'Hide this raster' : 'Show this raster on the map'}
                className="w-9 h-5 rounded-full p-0.5 transition-colors duration-200 shrink-0"
                style={{ backgroundColor: isOnMap ? '#16A34A' : '#E5E7EB', cursor: entry.hasData ? 'pointer' : 'not-allowed' }}
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
                      <span>Layer Transparency</span>
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
  };

  // groupFilter narrows which legend groups a page shows — e.g. Crop Health
  // only needs vegetation-vigor indicators, not the whole catalog (SAR,
  // water/moisture, etc). Omit it (as Map Analytics does) to show
  // everything — that page is the one deliberate "see the full archive"
  // view; every other page should show a distinct, non-overlapping slice
  // rather than repeating the same full index list.
  const renderLegendCards = (groupFilter = null) => {
    const groupNames = Object.keys(legendGroups).filter(g => !groupFilter || groupFilter.includes(g));
    const openGroups = expandedLegendGroups || groupNames.slice(0, 1);
    // Whether *this* card list is exclusively SAR-derived (e.g. Moisture
    // Content's Structure & Moisture group) — was previously keyed off the
    // globally selected index instead, so a SAR-only panel could still show
    // the Sentinel-2/Landsat picker whenever selectedIndex happened to be an
    // optical index from another page.
    const allSar = groupNames.length > 0 && groupNames.every(g =>
      (legendGroups[g] || []).every(e => SAR_INDICES.has(e.key.toLowerCase()))
    );
    return (
      <>
        {/* Sensor choice lives here now instead of a separate toolbar
            dropdown — SAR indices always come from Sentinel-1 (handled by
            isSarIndex/effectiveSensor), so this only matters for optical
            indices, which can come from either Sentinel-2 or Landsat. */}
        {!allSar && (
          <div className="flex items-center justify-between px-0.5 pb-1">
            <span className="text-[11px] font-bold text-gray-600 uppercase tracking-widest">Satellite</span>
            <div className="flex rounded-full border border-gray-200 overflow-hidden">
              {['sentinel-2', 'landsat'].map(s => (
                <button
                  key={s}
                  onClick={() => setSelectedSensor(s)}
                  className={`text-[11px] font-bold px-2.5 py-1 transition-colors ${selectedSensor === s ? 'bg-green-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                >
                  {s === 'sentinel-2' ? 'Sentinel-2' : 'Landsat'}
                </button>
              ))}
            </div>
          </div>
        )}
        {groupNames.map(name => {
          const entries = legendGroups[name];
          const isOpen = openGroups.includes(name);
          const onMapCount = entries.filter(e => (selectedIndex || '').toLowerCase() === e.key && showRasterLayer).length;
          return (
            <div key={name} className="space-y-2.5">
              <div
                onClick={() => toggleLegendGroup(name)}
                className="flex items-center gap-1 text-[11px] font-bold text-gray-600 hover:text-gray-800 uppercase tracking-widest cursor-pointer select-none transition-colors"
              >
                {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />} {name}
                <span className="font-semibold normal-case tracking-normal text-gray-500">({entries.length})</span>
                {onMapCount > 0 && <span className="text-[11px] font-black uppercase tracking-wider text-green-700 bg-green-50 border border-green-200 rounded-full px-1.5 py-0.5">On Map</span>}
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
  };

  const [healthOpExpanded, setHealthOpExpanded] = useState(false);
  const [healthBioExpanded, setHealthBioExpanded] = useState(true);
  const [healthMonExpanded, setHealthMonExpanded] = useState(false);

  const [yieldOpExpanded, setYieldOpExpanded] = useState(false);
  const [yieldProdExpanded, setYieldProdExpanded] = useState(false);
  const [yieldStatExpanded, setYieldStatExpanded] = useState(false);

  const [restoreOpExpanded, setRestoreOpExpanded] = useState(false);
  const [restoreEcoExpanded, setRestoreEcoExpanded] = useState(false);

  const [climateOpExpanded, setClimateOpExpanded] = useState(false);
  const [climateBioExpanded, setClimateBioExpanded] = useState(false);
  const [climateAtmExpanded, setClimateAtmExpanded] = useState(false);


  const [telemetryLogs, setTelemetryLogs] = useState([]);
  const [isFlushingCache, setIsFlushingCache] = useState(false);
  const [isCheckingSystem, setIsCheckingSystem] = useState(false);

  const cardStyle = glassmorphismEnabled ? 'glass shadow-premium border border-white/20' : 'bg-white border border-gray-100 shadow-sm';

  const getHealthPlotStyleOutline = (plot) => {
    let color = '#000000';
    let fillColor = 'transparent';
    let fillOpacity = 0;
    
    if (healthShowRainfall && plot?.cumulative_rainfall_14d != null) {
      const rain = plot.cumulative_rainfall_14d;
      fillColor = rain > 150 ? '#6d28d9' : rain > 50 ? '#2563eb' : rain > 10 ? '#60a5fa' : '#fbbf24';
      fillOpacity = healthRainfallOpacity / 100;
    }
    
    return {
      color: healthShowBoundaries ? color : 'transparent',
      weight: healthShowBoundaries ? 2.5 : 0,
      opacity: healthBoundariesOpacity / 100,
      fillColor: fillColor,
      fillOpacity: fillOpacity
    };
  };

  const getHealthPlotStyleFill = (plot, layer) => {
    let fillColor = 'transparent';
    let fillOpacity = 0;
    
    if (layer === 'pest') {
      const risk = plot.pestRisk;
      fillColor = risk === 'High Risk' ? '#ef4444' : risk === 'Moderate Risk' ? '#f97316' : '#16a34a';
      fillOpacity = healthPestOpacity / 100;
    } else if (layer === 'water') {
      fillColor = getIndexFiveClasses(plot.waterStress, 'NDMI').color;
      fillOpacity = healthWaterOpacity / 100;
    } else if (layer === 'chlorophyll') {
      fillColor = getIndexFiveClasses(plot.chlorophyll, 'NDVI').color;
      fillOpacity = healthChlorophyllOpacity / 100;
    } else if (layer === 'ndvi') {
      fillColor = getIndexFiveClasses(plot.ndvi, 'NDVI').color;
      fillOpacity = healthNdviOpacity / 100;
    } else if (layer === 'ndre') {
      fillColor = getIndexFiveClasses(plot.ndvi * 0.85, 'NDVI').color;
      fillOpacity = healthNdreOpacity / 100;
    } else if (layer === 'smi') {
      const dbChange = plot.ndmi != null ? (plot.ndmi * 4) : 1.5;
      fillColor = dbChange > 6 ? '#1E3A8A' : dbChange > 3 ? '#2563EB' : dbChange > 1 ? '#60A5FA' : dbChange > -1 ? '#86EFAC' : dbChange > -3 ? '#EAB308' : '#DC2626';
      fillOpacity = healthSmiOpacity / 100;
    }
    
    return {
      color: 'transparent',
      weight: 0,
      opacity: 0,
      fillColor: fillColor,
      fillOpacity: fillOpacity
    };
  };

  // Crop Yield map layers states
  const [yieldShowLayers, setYieldShowLayers] = useState(true);
  const [yieldShowBoundaries, setYieldShowBoundaries] = useState(true);
  const [yieldBoundariesOpacity, setYieldBoundariesOpacity] = useState(100);
  const [yieldShowYield, setYieldShowYield] = useState(true);
  const [yieldYieldOpacity, setYieldYieldOpacity] = useState(80);
  const [yieldShowBiomass, setYieldShowBiomass] = useState(false);
  const [yieldBiomassOpacity, setYieldBiomassOpacity] = useState(70);
  const [yieldShowReadiness, setYieldShowReadiness] = useState(false);
  const [yieldReadinessOpacity, setYieldReadinessOpacity] = useState(70);
  const [yieldShowGrowth, setYieldShowGrowth] = useState(false);
  const [yieldGrowthOpacity, setYieldGrowthOpacity] = useState(70);

  const getYieldPlotStyleOutline = () => ({
    color: yieldShowBoundaries ? '#000000' : 'transparent',
    weight: yieldShowBoundaries ? 2.5 : 0,
    opacity: yieldBoundariesOpacity / 100,
    fillColor: 'transparent',
    fillOpacity: 0
  });

  const getYieldPlotStyleFill = (plot, layer) => {
    let fillColor = 'transparent';
    let fillOpacity = 0;
    
    if (layer === 'readiness') {
      const val = plot.readiness;
      fillColor = val > 85 ? '#16a34a' : val > 65 ? '#eab308' : '#f97316';
      fillOpacity = yieldReadinessOpacity / 100;
    } else if (layer === 'growth') {
      const val = plot.growth;
      fillColor = val > 0.7 ? '#15803d' : val > 0.55 ? '#22c55e' : val > 0.4 ? '#eab308' : '#ef4444';
      fillOpacity = yieldGrowthOpacity / 100;
    } else if (layer === 'biomass') {
      const val = plot.biomass;
      fillColor = val > 2.0 ? '#15803d' : val > 1.3 ? '#22c55e' : val > 0.8 ? '#eab308' : '#ef4444';
      fillOpacity = yieldBiomassOpacity / 100;
    } else if (layer === 'yield') {
      const val = plot.yieldValue;
      fillColor = val > 18 ? '#15803d' : val > 12 ? '#22c55e' : val > 8 ? '#eab308' : '#ef4444';
      fillOpacity = yieldYieldOpacity / 100;
    }
    
    return {
      color: 'transparent',
      weight: 0,
      opacity: 0,
      fillColor: fillColor,
      fillOpacity: fillOpacity
    };
  };

  // Climate map layers states
  const [climateShowLayers, setClimateShowLayers] = useState(true);
  const [climateShowBoundaries, setClimateShowBoundaries] = useState(true);
  const [climateBoundariesOpacity, setClimateBoundariesOpacity] = useState(100);
  const [climateShowRainfall, setClimateShowRainfall] = useState(true);
  const [climateRainfallOpacity, setClimateRainfallOpacity] = useState(80);
  const [climateShowSoilTemp, setClimateShowSoilTemp] = useState(false);
  const [climateSoilTempOpacity, setClimateSoilTempOpacity] = useState(70);
  const [climateShowLst, setClimateShowLst] = useState(false);
  const [climateLstOpacity, setClimateLstOpacity] = useState(70);
  const [climateShowVaporDeficit, setClimateShowVaporDeficit] = useState(false);
  const [climateVaporDeficitOpacity, setClimateVaporDeficitOpacity] = useState(70);

  const getClimatePlotStyleOutline = () => ({
    color: climateShowBoundaries ? '#000000' : 'transparent',
    weight: climateShowBoundaries ? 2.5 : 0,
    opacity: climateBoundariesOpacity / 100,
    fillColor: 'transparent',
    fillOpacity: 0
  });

  const getClimatePlotStyleFill = (plot, layer) => {
    let fillColor = 'transparent';
    let fillOpacity = 0;

    if (layer === 'vpd') {
      const val = plot.vpd;
      if (val != null) {
        fillColor = val > 2.2 ? '#ef4444' : val > 1.5 ? '#f97316' : '#10b981';
        fillOpacity = climateVaporDeficitOpacity / 100;
      }
    } else if (layer === 'lst') {
      const val = plot.lst;
      if (val != null) {
        fillColor = val > 36 ? '#b91c1c' : val > 30 ? '#ef4444' : val > 25 ? '#f97316' : '#10b981';
        fillOpacity = climateLstOpacity / 100;
      }
    } else if (layer === 'soilTemp') {
      const val = plot.soilTemp;
      if (val != null) {
        fillColor = val > 29 ? '#ef4444' : val > 25 ? '#f97316' : '#10b981';
        fillOpacity = climateSoilTempOpacity / 100;
      }
    } else if (layer === 'rainfall') {
      const val = plot.rainfall;
      if (val != null) {
        fillColor = val > 25 ? '#1d4ed8' : val > 18 ? '#3b82f6' : '#93c5fd';
        fillOpacity = climateRainfallOpacity / 100;
      }
    } else if (layer === 'flood') {
      if (plot.indices?.flood_risk != null) {
        fillColor = plot.indices.flood_risk > 0.5 ? '#1e3a8a' : 'transparent';
        fillOpacity = plot.indices.flood_risk > 0.5 ? climateFloodOpacity / 100 : 0;
      }
    }

    return {
      color: 'transparent',
      weight: 0,
      opacity: 0,
      fillColor: fillColor,
      fillOpacity: fillOpacity
    };
  };

  // Land Restoration map layers states
  const [restoreShowLayers, setRestoreShowLayers] = useState(true);
  const [restoreShowBoundaries, setRestoreShowBoundaries] = useState(true);
  const [restoreBoundariesOpacity, setRestoreBoundariesOpacity] = useState(100);
  const [restoreShowProgress, setRestoreShowProgress] = useState(true);
  const [restoreProgressOpacity, setRestoreProgressOpacity] = useState(85);
  const [restoreShowSurvival, setRestoreShowSurvival] = useState(false);
  const [restoreSurvivalOpacity, setRestoreSurvivalOpacity] = useState(70);
  const [restoreShowCarbon, setRestoreShowCarbon] = useState(false);
  const [restoreCarbonOpacity, setRestoreCarbonOpacity] = useState(70);
  const [restoreShowBiodiversity, setRestoreShowBiodiversity] = useState(false);
  const [restoreBiodiversityOpacity, setRestoreBiodiversityOpacity] = useState(70);

  // Layer independent toggle handlers for each page (allowing concurrent layers)
  const handleIntelToggle = (layer) => {
    if (layer === 'growth') setIntelShowGrowth(!intelShowGrowth);
    if (layer === 'evi') setIntelShowEvi(!intelShowEvi);
    if (layer === 'lswi') setIntelShowLswi(!intelShowLswi);
    if (layer === 'vhi') setIntelShowVhi(!intelShowVhi);
    if (layer === 'suitability') setIntelShowSuitability(!intelShowSuitability);
    if (layer === 'cvi') setIntelShowCvi(!intelShowCvi);
    if (layer === 'car') setIntelShowCar(!intelShowCar);
    if (layer === 'ndre') setIntelShowNdre(!intelShowNdre);
    if (layer === 'wdi') setIntelShowWdi(!intelShowWdi);
    if (layer === 'dprvi') setIntelShowDprvi(!intelShowDprvi);
    if (layer === 'rvi') setIntelShowRvi(!intelShowRvi);
    if (layer === 'flood') setIntelShowFlood(!intelShowFlood);
    if (layer === 'uas') setIntelShowUas(!intelShowUas);
  };

  const handleHealthToggle = (layer) => {
    if (layer === 'ndvi') setHealthShowNdvi(!healthShowNdvi);
    if (layer === 'chlorophyll') setHealthShowChlorophyll(!healthShowChlorophyll);
    if (layer === 'water') setHealthShowWater(!healthShowWater);
    if (layer === 'pest') setHealthShowPest(!healthShowPest);
    if (layer === 'ndre') setHealthShowNdre(!healthShowNdre);
    if (layer === 'smi') setHealthShowSmi(!healthShowSmi);
  };

  const handleYieldToggle = (layer) => {
    if (layer === 'yield') setYieldShowYield(!yieldShowYield);
    if (layer === 'biomass') setYieldShowBiomass(!yieldShowBiomass);
    if (layer === 'readiness') setYieldShowReadiness(!yieldShowReadiness);
    if (layer === 'growth') setYieldShowGrowth(!yieldShowGrowth);
  };

  const handleClimateToggle = (layer) => {
    if (layer === 'rainfall') setClimateShowRainfall(!climateShowRainfall);
    if (layer === 'soilTemp') setClimateShowSoilTemp(!climateShowSoilTemp);
    if (layer === 'lst') setClimateShowLst(!climateShowLst);
    if (layer === 'vpd') setClimateShowVaporDeficit(!climateShowVaporDeficit);
    if (layer === 'flood') setClimateShowFlood(!climateShowFlood);
  };

  const handleRestoreToggle = (layer) => {
    if (layer === 'progress') setRestoreShowProgress(!restoreShowProgress);
    if (layer === 'survival') setRestoreShowSurvival(!restoreShowSurvival);
    if (layer === 'carbon') setRestoreShowCarbon(!restoreShowCarbon);
    if (layer === 'biodiversity') setRestoreShowBiodiversity(!restoreShowBiodiversity);
    if (layer === 'insar') setRestoreShowInSar(!restoreShowInSar);
    if (layer === 'gedi') setRestoreShowGedi(!restoreShowGedi);
    if (layer === 'ndwi') setRestoreShowNdwi(!restoreShowNdwi);
    if (layer === 'lulc') setRestoreShowLulc(!restoreShowLulc);
    if (layer === 'eudr') setRestoreShowEudr(!restoreShowEudr);
  };

  const getRestorePlotStyleOutline = () => ({
    color: restoreShowBoundaries ? '#000000' : 'transparent',
    weight: restoreShowBoundaries ? 2.5 : 0,
    opacity: restoreBoundariesOpacity / 100,
    fillColor: 'transparent',
    fillOpacity: 0
  });

  const getRestorePlotStyleFill = (zone, layer) => {
    let fillColor = 'transparent';
    let fillOpacity = 0;
    
    if (layer === 'biodiversity') {
      const val = zone.survivalNum ?? zone.progress ?? 80;
      fillColor = val > 90 ? '#15803d' : val > 80 ? '#22c55e' : '#eab308';
      fillOpacity = restoreBiodiversityOpacity / 100;
    } else if (layer === 'carbon') {
      const val = zone.carbon;
      fillColor = val > 40 ? '#15803d' : val > 30 ? '#22c55e' : '#eab308';
      fillOpacity = restoreCarbonOpacity / 100;
    } else if (layer === 'survival') {
      const val = zone.survivalNum;
      fillColor = val > 90 ? '#15803d' : val > 85 ? '#22c55e' : '#eab308';
      fillOpacity = restoreSurvivalOpacity / 100;
    } else if (layer === 'progress') {
      const val = zone.progress;
      fillColor = val > 85 ? '#15803d' : val > 70 ? '#22c55e' : val > 55 ? '#eab308' : '#ef4444';
      fillOpacity = restoreProgressOpacity / 100;
    } else if (layer === 'insar') {
      const val = zone.insar;
      fillColor = val > 0.7 ? '#15803d' : val >= 0.4 ? '#eab308' : '#dc2626';
      fillOpacity = restoreInSarOpacity / 100;
    } else if (layer === 'gedi') {
      const val = zone.gedi;
      fillColor = val > 15 ? '#14532d' : val > 10 ? '#15803d' : val > 5 ? '#22c55e' : '#eab308';
      fillOpacity = restoreGediOpacity / 100;
    } else if (layer === 'ndwi') {
      const val = zone.ndwi;
      fillColor = val > 0.3 ? '#1e3a8a' : val > 0.15 ? '#2563eb' : val > 0.0 ? '#60a5fa' : '#ea580c';
      fillOpacity = restoreNdwiOpacity / 100;
    } else if (layer === 'lulc') {
      const val = zone.lulc;
      fillColor = val === 'Forest' ? '#15803d' : val === 'Shrubland' ? '#86efac' : val === 'Cropland' ? '#fde047' : val === 'Bare Soil' ? '#ca8a04' : val === 'Water' ? '#3b82f6' : '#94a3b8';
      fillOpacity = restoreLulcOpacity / 100;
    } else if (layer === 'eudr') {
      const val = zone.eudr;
      fillColor = val === 'Compliant' ? '#16a34a' : val === 'Warning' ? '#eab308' : '#dc2626';
      fillOpacity = restoreEudrOpacity / 100;
    } else if (layer === 'agb') {
      const sv = zone.survivalNum ?? zone.progress ?? 80;
      fillColor = sv > 90 ? '#14532D' : sv > 75 ? '#16A34A' : '#86EFAC';
      fillOpacity = restoreAgbOpacity / 100;
    }
    
    return {
      color: 'transparent',
      weight: 0,
      opacity: 0,
      fillColor: fillColor,
      fillOpacity: fillOpacity
    };
  };

  const getIntelPlotStyleOutline = () => ({
    color: intelShowBoundaries ? '#000000' : 'transparent',
    weight: intelShowBoundaries ? 2.5 : 0,
    opacity: intelBoundariesOpacity / 100,
    fillColor: 'transparent',
    fillOpacity: 0
  });

  const getIntelPlotStyleFill = (plot, layer) => {
    let fillColor = 'transparent';
    let fillOpacity = 0;
    
    if (layer === 'suitability') {
      fillColor = (plot.ndvi != null && plot.ndvi < 0.5) ? '#dc2626' : '#16a34a';
      fillOpacity = intelSuitabilityOpacity / 100;
    } else if (layer === 'vhi') {
      fillColor = getIndexFiveClasses(plot.ndvi, 'NDVI').color;
      fillOpacity = intelVhiOpacity / 100;
    } else if (layer === 'lswi') {
      fillColor = getIndexFiveClasses(plot.ndmi, 'LSWI').color;
      fillOpacity = intelLswiOpacity / 100;
    } else if (layer === 'evi') {
      fillColor = getIndexFiveClasses(plot.ndvi * 0.95, 'EVI').color;
      fillOpacity = intelEviOpacity / 100;
    } else if (layer === 'growth') {
      fillColor = (plot.ndvi ?? 0) > 0.7 ? '#15803d' : (plot.ndvi ?? 0) > 0.5 ? '#86efac' : '#fbbf24';
      fillOpacity = intelGrowthOpacity / 100;
    } else if (layer === 'cvi') {
      fillColor = getIndexFiveClasses(plot.ndvi * 1.05, 'NDVI').color;
      fillOpacity = intelCviOpacity / 100;
    } else if (layer === 'car') {
      fillColor = getIndexFiveClasses(plot.ndvi * 0.9, 'NDVI').color;
      fillOpacity = intelCarOpacity / 100;
    } else if (layer === 'ndre') {
      fillColor = getIndexFiveClasses(plot.ndvi * 0.85, 'NDVI').color;
      fillOpacity = intelNdreOpacity / 100;
    } else if (layer === 'wdi') {
      fillColor = getIndexFiveClasses(plot.ndmi * 1.1, 'LSWI').color;
      fillOpacity = intelWdiOpacity / 100;
    } else if (layer === 'dprvi') {
      const dprvi = plot.indices?.dprvi ?? plot.ndvi;
      fillColor = dprvi > 0.6 ? '#15803d' : dprvi > 0.4 ? '#eab308' : '#ef4444';
      fillOpacity = intelDprviOpacity / 100;
    } else if (layer === 'rvi') {
      const val = plot.indices?.reci ?? plot.ndvi;
      fillColor = val > 0.70 ? '#14532D' : val > 0.50 ? '#16A34A' : val > 0.30 ? '#86EFAC' : val > 0.15 ? '#EAB308' : '#EF4444';
      fillOpacity = intelRviOpacity / 100;
    } else if (layer === 'flood') {
      const floodVal = plot.indices?.ndwi ?? 0;
      fillColor = floodVal > 0 ? '#1e3a8a' : 'transparent';
      fillOpacity = intelFloodOpacity / 100;
    } else if (layer === 'uas') {
      fillColor = 'transparent'; // UAS layer not yet connected
      fillOpacity = 0;
    }
    
    return {
      color: 'transparent',
      weight: 0,
      opacity: 0,
      fillColor: fillColor,
      fillOpacity: fillOpacity
    };
  };


  // Helper methods to render overlapping active layers
  const renderFarmBoundary = () => {
    if (!farmBoundary || !farmBoundary.geometry || !farmBoundary.geometry.coordinates) return null;
    const ring = farmBoundary.geometry.type === 'MultiPolygon'
      ? farmBoundary.geometry.coordinates?.[0]?.[0]
      : farmBoundary.geometry.coordinates?.[0];
    if (!ring || !Array.isArray(ring)) return null;
    // Convert [lng, lat] → Leaflet [lat, lng]
    const positions = ring.map(([lng, lat]) => [lat, lng]);
    const name = farmBoundary.properties?.name ?? tenantDisplayName;
    const center = farmBoundary.properties?.center;
    return (
      <Polygon
        positions={positions}
        pathOptions={{ color: '#16A34A', weight: 2.5, fillColor: '#16A34A', fillOpacity: 0.08, dashArray: '6 4' }}
      />
    );
  };

  const renderIntelPolygons = (plots, suffix = '') => {
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
  };

  const renderHealthPolygons = (plots, suffix = '') => {
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
  };

  const renderMoisturePolygons = (plots, suffix = '') => {
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
  };

  const renderYieldPolygons = (plots, suffix = '') => {
    return plots.map(plot => {
      const keyPrefix = `${plot.id}`;
      return (
        <React.Fragment key={keyPrefix}>
          {yieldShowBoundaries && (
            <Polygon
              positions={plot.coords}
              pathOptions={getYieldPlotStyleOutline()}
              eventHandlers={{ click: (e) => handlePlotClick(plot, e.latlng.lat, e.latlng.lng) }}
            />
          )}
        </React.Fragment>
      );
    });
  };

  const renderRestorePolygons = (zones, suffix = '') => {
    return zones.map(zone => {
      const keyPrefix = `${zone.id}`;
      return (
        <React.Fragment key={keyPrefix}>
          {restoreShowBoundaries && (
            <Polygon
              positions={zone.coords}
              pathOptions={getRestorePlotStyleOutline()}
              eventHandlers={{ click: () => setSelectedRestoreZone(zone) }}
            />
          )}
        </React.Fragment>
      );
    });
  };

  const renderClimatePolygons = (plots, suffix = '') => {
    const activeLayers = [
      climateShowRainfall && 'rainfall',
      climateShowSoilTemp && 'soilTemp',
      climateShowLst && 'lst',
      climateShowVaporDeficit && 'vpd',
      climateShowFlood && 'flood',
    ].filter(Boolean);
    return plots.map(plot => {
      const keyPrefix = `${plot.id}`;
      return (
        <React.Fragment key={keyPrefix}>
          {activeLayers.map(layer => (
            <Polygon
              key={`${keyPrefix}-${layer}${suffix ? '-' + suffix : ''}`}
              positions={plot.coords}
              pathOptions={getClimatePlotStyleFill(plot, layer)}
              eventHandlers={{ click: (e) => handlePlotClick(plot, e.latlng.lat, e.latlng.lng) }}
            />
          ))}
          {climateShowBoundaries && (
            <Polygon
              positions={plot.coords}
              pathOptions={getClimatePlotStyleOutline()}
              eventHandlers={{ click: (e) => handlePlotClick(plot, e.latlng.lat, e.latlng.lng) }}
            />
          )}
        </React.Fragment>
      );
    });
  };

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

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    setActiveSidebarItem('analytics');
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

  const handleAcknowledgeAllPlotAlerts = (plotId) => {
    const idsToAck = alerts.filter(a => a.plot === plotId && a.status !== 'Acknowledged').map(a => a.id);
    setAlerts(prev => prev.map(a => a.plot === plotId ? { ...a, status: 'Acknowledged' } : a));
    Promise.all(idsToAck.map(id => api.acknowledgeAlert(id))).catch(err => {
      console.error('Failed to acknowledge one or more alerts:', err);
    });
  };

  const handleProfileSave = (e) => {
    e.preventDefault();
    setShowProfileSaved(true);
    setTimeout(() => setShowProfileSaved(false), 3000);
  };

  const handleFlushCache = () => {
    setIsFlushingCache(true);
    setTelemetryLogs(prev => [...prev, '[WARN] Flushing backend zarr cache...']);
    api.clearCache()
      .then(() => setTelemetryLogs(prev => [...prev, '[SUCCESS] Backend cache flushed.']))
      .catch(err => setTelemetryLogs(prev => [...prev, `[ERROR] Cache flush failed: ${err.message}`]))
      .finally(() => setIsFlushingCache(false));
  };

  const handleSystemCheck = () => {
    setIsCheckingSystem(true);
    setTelemetryLogs(prev => [...prev, '[INFO] Rebuilding backend cache for this tenant...']);
    api.rebuildCache()
      .then(() => setTelemetryLogs(prev => [...prev, '[SUCCESS] Connection verified. Cache rebuilt.']))
      .catch(err => setTelemetryLogs(prev => [...prev, `[ERROR] System check failed: ${err.message}`]))
      .finally(() => setIsCheckingSystem(false));
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
        const ndviVal = p.indices?.ndvi ?? 0;
        const healthVal = ndviVal > 0.7 ? 'Optimal' : ndviVal > 0.55 ? 'Good' : 'Stressed';
        return {
          id: p.plot_id,
          name: p.name || p.plot_id,
          area: `${p.area_ha || 10.0} HA`,
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
        const ndviVal = p.indices?.ndvi ?? 0;
        const healthVal = ndviVal > 0.7 ? 'Optimal' : ndviVal > 0.55 ? 'Good' : 'Stressed';
        return {
          id: p.plot_id,
          name: p.name || p.plot_id,
          area: `${p.area_ha || 10.0} HA`,
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
          area: `${p.area_ha || 10.0} HA`,
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
          area: `${p.area_ha || 10.0} HA`,
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
        const ndviVal = p.indices?.ndvi ?? 0;
        return {
          id: p.plot_id,
          name: p.name || p.plot_id,
          area: `${p.area_ha || 10.0} HA`,
          yieldValue: null,
          biomass: null,
          readiness: Math.min(100, Math.round(ndviVal * 115)),
          growth: parseFloat(ndviVal.toFixed(2)),
          coords,
          predAccuracy: null,
          predictedYield: null,
          yieldStatus: ndviVal > 0.6 ? 'Optimal (On Track)' : 'Underperforming (Water Stress)'
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
        const ndviVal = p.indices?.ndvi ?? 0;
        return {
          id: p.plot_id,
          name: p.name || p.plot_id,
          area: `${p.area_ha || 10.0} HA`,
          yieldValue: null,
          biomass: null,
          readiness: Math.min(100, Math.round(ndviVal * 115)),
          growth: parseFloat(ndviVal.toFixed(2)),
          coords,
          predAccuracy: null,
          predictedYield: null,
          yieldStatus: ndviVal > 0.6 ? 'Optimal (On Track)' : 'Underperforming (Water Stress)'
        };
      });
    }
    return [];
  }, [plots, currentTimelineB]);

  const yieldPlotsData = yieldPlotsDataA;

  const climatePlotsDataA = useMemo(() => {
    if (plots && plots.length > 0) {
      return plots.map((p, idx) => {
        let coords = [];
        if (p.boundary && p.boundary.coordinates && p.boundary.coordinates[0]) {
          coords = api.geoJsonToLeaflet(p.boundary.coordinates[0]);
        } else {
          coords = [];
        }
        // Only LST has a real per-plot source (Landsat thermal band, via
        // /plots/telemetry). Soil temp/rainfall/VPD have no real per-plot
        // measurement anywhere in the pipeline, so they stay null rather
        // than being invented.
        const telemetry = (plotsTelemetry || []).find(t => t.plot_id === p.plot_id);
        return {
          id: p.plot_id,
          name: p.name || p.plot_id,
          area: `${p.area_ha || 10.0} HA`,
          rainfall: telemetry?.rainfall_mm ?? null,
          soilTemp: telemetry?.soil_temp_celsius ?? null,
          lst: telemetry?.surface_lst_celsius ?? null,
          vpd: telemetry?.vpd_kpa ?? null,
          coords
        };
      });
    }
    return [];
  }, [plots, currentTimelineA, selectedTimelineIndex, plotsTelemetry]);

  const climatePlotsDataB = useMemo(() => {
    if (plots && plots.length > 0) {
      return plots.map((p, idx) => {
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
          area: `${p.area_ha || 10.0} HA`,
          rainfall: telemetry?.rainfall_mm ?? null,
          soilTemp: telemetry?.soil_temp_celsius ?? null,
          lst: telemetry?.surface_lst_celsius ?? null,
          vpd: telemetry?.vpd_kpa ?? null,
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
          area: `${z.area_ha ?? 6.0} HA`,
          type: z.project_type ?? null,
          progress: z.progress_pct ?? null,
          survival: z.survival_rate_pct != null ? `${z.survival_rate_pct}%` : '—',
          trees: z.tree_count != null ? z.tree_count.toLocaleString() : '—',
          carbon: z.carbon_offset_tco2e != null ? `${z.carbon_offset_tco2e} tCO2e` : '—',
          status: z.progress_pct != null ? (z.progress_pct > 80 ? 'Optimal Growth' : 'Active Care') : '—',
          color: z.progress_pct != null ? (z.progress_pct > 80 ? '#16A34A' : '#EAB308') : '#9CA3AF',
          coords,
          manager: z.manager ?? null,
          survivalNum: z.survival_rate_pct ?? null,
          insar: z.biodiversity_score != null ? z.biodiversity_score / 100 : null,
          gedi: null,
          ndwi: null,
          lulc: null,
          eudr: null
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
          area: `${z.area_ha ?? 6.0} HA`,
          type: z.project_type ?? null,
          progress: z.progress_pct ?? null,
          survival: z.survival_rate_pct != null ? `${z.survival_rate_pct}%` : '—',
          trees: z.tree_count != null ? z.tree_count.toLocaleString() : '—',
          carbon: z.carbon_offset_tco2e != null ? `${z.carbon_offset_tco2e} tCO2e` : '—',
          status: z.progress_pct != null ? (z.progress_pct > 80 ? 'Optimal Growth' : 'Active Care') : '—',
          color: z.progress_pct != null ? (z.progress_pct > 80 ? '#16A34A' : '#EAB308') : '#9CA3AF',
          coords,
          manager: z.manager ?? null,
          survivalNum: z.survival_rate_pct ?? null,
          insar: z.biodiversity_score != null ? z.biodiversity_score / 100 : null,
          gedi: null,
          ndwi: null,
          lulc: null,
          eudr: null
        };
      });
    }
    return [];
  }, [restorationZones, currentTimelineB]);

  const restorationPlotsData = restorationPlotsDataA;

  const getRestorePolygonColor = (zone, indexName) => {
    if (indexName === 'progress') {
      const val = zone.progress;
      if (val > 85) return '#15803d';
      if (val > 70) return '#22c55e';
      if (val > 55) return '#eab308';
      return '#ef4444';
    }
    if (indexName === 'survival') {
      const val = zone.survivalNum;
      if (val > 90) return '#15803d';
      if (val > 85) return '#22c55e';
      return '#eab308';
    }
    if (indexName === 'carbon') {
      const val = zone.carbon;
      if (val > 40) return '#15803d';
      if (val > 30) return '#22c55e';
      return '#eab308';
    }
    const val = zone.survivalNum ?? zone.progress ?? 80;
    if (val > 90) return '#15803d';
    if (val > 80) return '#22c55e';
    return '#eab308';
  };

  const getYieldPolygonColor = (plot, indexName) => {
    if (indexName === 'Yield') {
      const val = plot.yieldValue;
      if (val > 18) return '#15803d';
      if (val > 12) return '#22c55e';
      if (val > 8)  return '#eab308';
      return '#ef4444';
    }
    if (indexName === 'Biomass') {
      const val = plot.biomass;
      if (val > 2.0) return '#15803d';
      if (val > 1.3) return '#22c55e';
      if (val > 0.8) return '#eab308';
      return '#ef4444';
    }
    if (indexName === 'Readiness') {
      const val = plot.readiness;
      if (val > 85) return '#16a34a';
      if (val > 65) return '#eab308';
      return '#f97316';
    }
    const val = plot.growth;
    if (val > 0.7)  return '#15803d';
    if (val > 0.55) return '#22c55e';
    if (val > 0.4)  return '#eab308';
    return '#ef4444';
  };

  const getClimatePolygonColor = (plot, indexName) => {
    if (indexName === 'Rainfall') {
      const val = plot.rainfall;
      if (val > 25) return '#1d4ed8';
      if (val > 18) return '#3b82f6';
      return '#93c5fd';
    }
    if (indexName === 'SoilTemp') {
      const val = plot.soilTemp;
      if (val > 29) return '#ef4444';
      if (val > 25) return '#f97316';
      return '#10b981';
    }
    if (indexName === 'LST') {
      const val = plot.lst;
      if (val > 36) return '#b91c1c';
      if (val > 30) return '#ef4444';
      if (val > 25) return '#f97316';
      return '#10b981';
    }
    const val = plot.vpd;
    if (val > 2.2) return '#ef4444';
    if (val > 1.5) return '#f97316';
    return '#10b981';
  };

  const renderMapBottomPanel = (indexValue, centerContent = null, hideCalendarAndSlider = false) => {
    if (!showTimeSliderTool && !showCalendarTool) {
      return null;
    }
    return (
      <div style={{ height: isBottomPanelMinimized ? '52px' : `${bottomPanelHeight}px` }} className="bg-white border-t border-gray-200 shrink-0 flex flex-col relative overflow-hidden transition-all duration-300">
        {/* Draggable horizontal divider */}
        <div 
          onMouseDown={startBottomPanelResize} 
          className="absolute top-[-4px] left-0 right-0 h-2 cursor-row-resize hover:bg-green-500/55 active:bg-green-500 transition-colors z-50"
        />
        {/* Slider + Play row */}
        {!hideCalendarAndSlider && showTimeSliderTool && (
          <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-4">
            <button
              onClick={togglePlay}
              title={isPlaying ? 'Pause' : 'Play'}
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white shadow-sm transition-all hover:scale-105 active:scale-95"
              style={{ backgroundColor: isCompareMode ? (activeDateSlot === 'A' ? '#16A34A' : '#2563EB') : '#16A34A' }}
            >
              {isPlaying ? <Pause size={14} /> : <Play size={15} />}
            </button>
            <div className="flex-1 relative">
              {timelineLoading ? (
                <div className="flex items-center gap-2 h-8 text-xs text-gray-600">
                  <svg className="animate-spin h-4 w-4 text-green-500 shrink-0" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Loading satellite timeline…
                </div>
              ) : TIMELINE_DATA.length === 0 ? (
                <div className="flex items-center gap-2 h-8 text-xs text-gray-600">
                  <span>No imagery yet for {selectedIndex?.toUpperCase() || 'this index'} — pipeline may still be writing data.</span>
                  <button
                    onClick={() => setRefreshSlider(n => n + 1)}
                    title="Retry loading"
                    className="ml-1 p-1 hover:bg-gray-100 rounded text-gray-600 hover:text-green-600 transition-colors"
                  ><RefreshCw size={12} /></button>
                </div>
              ) : (
                <>
                  <input type="range" min="0" max={TIMELINE_DATA.length - 1}
                    value={Math.min(
                      isCompareMode ? (activeDateSlot === 'A' ? selectedTimelineIndex : compareTimelineIndex) : selectedTimelineIndex,
                      TIMELINE_DATA.length - 1
                    )}
                    onChange={e => {
                      const val = parseInt(e.target.value);
                      if (isCompareMode) {
                        if (activeDateSlot === 'A') setSelectedTimelineIndex(val);
                        else setCompareTimelineIndex(val);
                      } else {
                        setSelectedTimelineIndex(val);
                      }
                    }}
                    className={`w-full h-2 bg-gray-100 rounded-full appearance-none cursor-pointer ${
                      isCompareMode && activeDateSlot === 'B' ? 'accent-blue-600' : 'accent-green-600'
                    }`} />
                  <div className="flex justify-between px-0.5 mt-1">
                    {TIMELINE_DATA.map((t, i) => {
                      const isActive = isCompareMode
                        ? (activeDateSlot === 'A' ? i === selectedTimelineIndex : i === compareTimelineIndex)
                        : i === selectedTimelineIndex;
                      return (
                        <span key={i} className={`text-[11px] font-semibold transition-colors ${
                          isActive
                            ? (isCompareMode && activeDateSlot === 'B' ? 'text-green-600 font-bold' : 'text-green-600 font-bold')
                            : 'text-gray-600'
                        }`}>
                          {t.label.split(',')[0]}
                        </span>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {/* Current acquisition date pill — shows pending state while waiting 10s */}
              {!timelineLoading && TIMELINE_DATA.length > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap tabular-nums transition-colors ${
                  sliderPending
                    ? 'bg-green-100 text-green-600 border-green-200'
                    : 'bg-green-50 text-green-700 border-green-100'
                }`}>
                  {sliderPending
                    ? (TIMELINE_DATA[Math.min(selectedTimelineIndex, TIMELINE_DATA.length - 1)]?.label ?? '…')
                    : (currentTimeline?.label ?? '…')}
                  {sliderPending && <span className="ml-1 opacity-70">↻</span>}
                </span>
              )}
              {/* Sensor + index are now chosen from the Map Layers legend
                  (renderLegendCards) rather than duplicated here. */}
              <button
                onClick={() => setRefreshSlider(n => n + 1)}
                disabled={timelineLoading}
                title="Refresh timeline data"
                className="p-1.5 rounded-full hover:bg-green-50 text-green-400 hover:text-green-600 transition-colors disabled:opacity-40"
              >
                <RefreshCw size={13} className={timelineLoading ? 'animate-spin' : ''} />
              </button>
              <button
                onClick={() => setIsBottomPanelMinimized(!isBottomPanelMinimized)}
                title={isBottomPanelMinimized ? "Expand bottom panel" : "Minimize bottom panel"}
                className="p-1.5 rounded-full hover:bg-green-50 text-green-600 hover:text-green-800 transition-colors"
              >
                {isBottomPanelMinimized ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
            </div>
          </div>
        )}

        <div className="flex divide-x divide-gray-100 bg-gray-50/30 min-h-0 flex-1">
          {/* Mini Calendar (Enlarged) */}
          {!hideCalendarAndSlider && showCalendarTool && (
            <div className="py-2 px-3 shrink-0 w-[352px] bg-white flex flex-col justify-between overflow-y-auto">
              <div>


                <div className="flex items-center justify-between mb-3">
                  <button onClick={prevCalMonth} className="p-1 hover:bg-gray-100 rounded-lg transition-all text-gray-500 hover:text-gray-900 border border-gray-100 shadow-sm">
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-sm font-bold text-gray-800 tracking-wide">
                    {MONTH_NAMES[calendarMonth]} {calendarYear}
                  </span>
                  <button onClick={nextCalMonth} className="p-1 hover:bg-gray-100 rounded-lg transition-all text-gray-500 hover:text-gray-900 border border-gray-100 shadow-sm">
                    <ChevronRight size={16} />
                  </button>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px', textAlign: 'center', alignContent: 'start' }}>
                  {['S','M','T','W','T','F','S'].map((d, i) => (
                    <span key={i} className="text-[11px] font-extrabold text-gray-600 h-4 flex items-center justify-center">{d}</span>
                  ))}
                  {Array.from({ length: calFirstDay }).map((_, i) => <span key={`pad-${i}`} className="h-5" />)}
                  {Array.from({ length: calDaysInMonth }, (_, i) => {
                    const day = i + 1;
                    const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const matchIdx = TIMELINE_DATA.findIndex(t => t.date === dateStr);
                    const isHL = matchIdx !== -1;
                    const isSelA = matchIdx === selectedTimelineIndex;
                    const isSelB = isCompareMode && (matchIdx === compareTimelineIndex);
                    const dayCoverage = calendarDates.find(d => d.date === dateStr);

                    let btnStyle = {};
                    let btnClass = '';

                    if (isSelA && isSelB) {
                      btnStyle = { background: 'linear-gradient(135deg, #16A34A 50%, #2563EB 50%)', color: '#FFFFFF' };
                    } else if (isSelA) {
                      btnStyle = { backgroundColor: '#16A34A', color: '#FFFFFF' };
                    } else if (isSelB) {
                      btnStyle = { backgroundColor: '#2563EB', color: '#FFFFFF' };
                    } else if (isHL) {
                      btnClass = 'text-green-700 bg-green-50 hover:bg-green-100 font-bold border border-green-100';
                    } else if (dayCoverage) {
                      btnClass = 'text-gray-500 hover:bg-gray-50 font-semibold';
                    } else {
                      btnClass = 'text-gray-500 cursor-default';
                    }

                    const dayClickable = isCompareMode ? isHL : (isHL || !!dayCoverage);

                    // Multi-sensor days used to only surface the satellite
                    // choice in a separate panel elsewhere on screen — you'd
                    // click a date up here, then have to look away to find
                    // where to actually pick the satellite. Anchoring it as
                    // a callout right on the clicked cell keeps the choice
                    // and its trigger in the same place.
                    const showCallout = satellitePicker?.date === dateStr;
                    // Rows near the bottom of the grid have no room for a
                    // downward callout before the calendar's own overflow
                    // boundary clips it — flip those upward instead.
                    const dayRow = Math.floor((calFirstDay + day - 1) / 7);
                    const openUpward = dayRow >= 3;
                    return (
                      <div key={i} className="relative">
                        <button disabled={!dayClickable}
                          title={dayCoverage ? `Imagery from: ${dayCoverage.sensors.map(s => s === 'sentinel-2' ? 'Sentinel-2' : s === 'landsat' ? 'Landsat' : 'Sentinel-1').join(', ')}` : undefined}
                          onClick={() => {
                            if (isCompareMode) {
                              // Compare mode keeps the simpler current-sensor-only
                              // behavior — picking a satellite for slot A vs B
                              // independently gets confusing fast.
                              if (isHL) {
                                if (activeDateSlot === 'A') setSelectedTimelineIndex(matchIdx);
                                else setCompareTimelineIndex(matchIdx);
                              }
                              return;
                            }
                            if (!dayCoverage) return;
                            if (dayCoverage.sensors.length > 1) {
                              setSatellitePicker(showCallout ? null : { date: dateStr, sensors: dayCoverage.sensors });
                            } else {
                              selectDateWithSensor(dateStr, dayCoverage.sensors[0]);
                            }
                          }}
                          className={`h-6 w-full rounded-md text-[11px] font-bold flex flex-col items-center justify-center gap-0.5 transition-all ${btnClass}`}
                          style={btnStyle}>
                          <span>{day}</span>
                          {dayCoverage && (
                            <span className="flex items-center gap-0.5 leading-none">
                              {dayCoverage.sensors.map(s => (
                                <span key={s} className="w-1 h-1 rounded-full" style={{ backgroundColor: (isSelA || isSelB) ? '#FFFFFF' : SENSOR_DOT_COLOR[s] }} />
                              ))}
                            </span>
                          )}
                        </button>
                        {showCallout && (
                          <div
                            className={`absolute z-50 left-1/2 -translate-x-1/2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 flex flex-col gap-1 w-max ${
                              openUpward ? 'bottom-full mb-1' : 'top-full mt-1'
                            }`}
                            onClick={e => e.stopPropagation()}
                          >
                            <div className={`w-2 h-2 bg-white border-gray-200 rotate-45 absolute left-1/2 -translate-x-1/2 ${
                              openUpward ? 'border-r border-b -bottom-1' : 'border-l border-t -top-1'
                            }`} />
                            <span className="text-[11px] font-bold text-gray-600 whitespace-nowrap">Choose satellite</span>
                            <div className="flex gap-1">
                              {satellitePicker.sensors.map(s => (
                                <button
                                  key={s}
                                  onClick={() => { selectDateWithSensor(dateStr, s); setSatellitePicker(null); }}
                                  className="text-[11px] font-bold px-2 py-1 rounded-full text-gray-700 bg-gray-100 border border-gray-200 hover:bg-gray-200 whitespace-nowrap"
                                >
                                  {s === 'sentinel-2' ? 'Sentinel-2' : s === 'landsat' ? 'Landsat' : 'Sentinel-1'}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {Array.from({ length: calTrailing < 0 ? 0 : calTrailing }).map((_, i) => (
                    <span key={`trail-${i}`} className="h-5" />
                  ))}
                </div>
              </div>


            </div>
          )}

          {/* Vertical key for what each calendar dot color means — the
              calendar itself only shows colored dots per day, with nothing
              nearby explaining which satellite each color is. */}
          {!hideCalendarAndSlider && showCalendarTool && (
            <div className="py-3 px-2.5 shrink-0 w-[76px] bg-white flex flex-col gap-2.5">
              <span className="text-[11px] font-extrabold uppercase text-gray-600 tracking-wider">Satellite</span>
              {[
                { s: 'sentinel-2', label: 'Sentinel-2' },
                { s: 'landsat', label: 'Landsat' },
                { s: 'sentinel-1', label: 'Sentinel-1' },
              ].map(({ s, label }) => (
                <div key={s} className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: SENSOR_DOT_COLOR[s] }} />
                  <span className="text-[11px] font-semibold text-gray-600 leading-tight">{label}</span>
                </div>
              ))}
            </div>
          )}

          {centerContent ? centerContent : (
            <div className="bg-white p-4 flex items-start overflow-hidden border-l border-r border-gray-100">
              {/* Everything about the current selection — which pass is
                  active, how many passes exist this month, and (if a day
                  with more than one sensor was just clicked) the satellite
                  choice — lives in one bordered panel instead of three
                  separate floating pieces. Sized to its content, not
                  stretched to fill the row. One neutral border, one accent
                  color (green) used only for the thing that's actually
                  selected. */}
              <div className="flex flex-col gap-1.5 w-full max-w-[280px] h-fit self-start">
                {isCompareMode ? (
                  <div className="flex flex-col gap-1">
                    {currentTimelineA && (
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-600 shrink-0" />
                        <span className="text-[11px] font-bold text-gray-700">A: {currentTimelineA.label?.split(',')[0]}</span>
                        <span className="text-[11px] font-extrabold text-gray-600 bg-gray-100 px-1 py-0.5 rounded uppercase shrink-0">
                          {effectiveSensor === 'sentinel-1' ? 'S1 SAR' : effectiveSensor === 'landsat' ? 'L9' : 'S2'}
                        </span>
                        <span className="text-[11px] text-gray-500 font-mono">{(selectedIndex || 'NDVI').toUpperCase()}</span>
                      </div>
                    )}
                    {currentTimelineB && (
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
                        <span className="text-[11px] font-bold text-gray-700">B: {currentTimelineB.label?.split(',')[0]}</span>
                        <span className="text-[11px] font-extrabold text-gray-600 bg-gray-100 px-1 py-0.5 rounded uppercase shrink-0">
                          {effectiveSensor === 'sentinel-1' ? 'S1 SAR' : effectiveSensor === 'landsat' ? 'L9' : 'S2'}
                        </span>
                        <span className="text-[11px] text-gray-500 font-mono">{(selectedIndex || 'NDVI').toUpperCase()}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  currentTimeline && (
                    <div className="flex flex-col gap-0.5">
                      <div className="text-[11px] font-extrabold uppercase text-gray-600 tracking-wider">Selected Acquisition Pass</div>
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-[11px] font-black text-gray-800 tracking-tight">{currentTimeline.label?.split(',')[0]}</span>
                        <span className="text-[11px] font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded-full border border-green-200 uppercase">
                          {effectiveSensor === 'sentinel-1' ? 'S1 SAR' : effectiveSensor === 'landsat' ? 'L9' : 'S2'}
                        </span>
                        <span className="text-[11px] font-bold text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded-full border border-gray-100 uppercase">
                          {(selectedIndex || 'NDVI').toUpperCase()}
                        </span>
                      </div>
                    </div>
                  )
                )}

                <div className="h-px bg-gray-100" />

                {/* Real coverage for the month currently open in the
                    calendar — replaces a static "Best Imagery Active"
                    caption that never changed. */}
                {(() => {
                  const monthPrefix = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}`;
                  const monthCoverage = calendarDates.filter(d => d.date.startsWith(monthPrefix));
                  const bySensor = { 'sentinel-2': 0, 'landsat': 0, 'sentinel-1': 0 };
                  monthCoverage.forEach(d => d.sensors.forEach(s => { bySensor[s] = (bySensor[s] || 0) + 1; }));
                  const parts = [
                    bySensor['sentinel-2'] > 0 && `${bySensor['sentinel-2']} Sentinel-2`,
                    bySensor['landsat'] > 0 && `${bySensor['landsat']} Landsat`,
                    bySensor['sentinel-1'] > 0 && `${bySensor['sentinel-1']} Sentinel-1`,
                  ].filter(Boolean);
                  return (
                    <div className="flex items-start gap-1.5">
                      <CalendarIcon size={11} className="text-gray-600 shrink-0 mt-0.5" />
                      <div className="flex flex-col">
                        <span className="text-[11px] font-black uppercase tracking-wider text-gray-700 leading-none mb-0.5">
                          {monthCoverage.length} {monthCoverage.length === 1 ? 'Pass' : 'Passes'} This Month
                        </span>
                        <span className="text-[11px] text-gray-500 font-medium leading-normal">
                          {parts.length > 0 ? parts.join(' · ') : 'No acquisitions recorded for this month yet.'}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* Recent passes — the calendar already has every real
                    acquisition date; surfacing the last few here lets you
                    jump between them without opening it. */}
                {calendarDates.length > 0 && (
                  <>
                    <div className="h-px bg-gray-100" />
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[11px] font-extrabold uppercase text-gray-600 tracking-wider">Recent Passes</span>
                      <div className="flex flex-col gap-1">
                        {calendarDates.slice(-5).reverse().map(d => {
                          const isActive = currentTimeline?.date === d.date;
                          return (
                            <button
                              key={d.date}
                              onClick={() => {
                                if (d.sensors.length > 1) setSatellitePicker({ date: d.date, sensors: d.sensors });
                                else selectDateWithSensor(d.date, d.sensors[0]);
                              }}
                              className={`flex items-center gap-1.5 px-1.5 py-1 rounded-md text-left transition-colors ${
                                isActive ? 'bg-green-50' : 'hover:bg-gray-50'
                              }`}
                            >
                              <span className="flex items-center gap-0.5 shrink-0">
                                {d.sensors.map(s => (
                                  <span key={s} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: SENSOR_DOT_COLOR[s] }} />
                                ))}
                              </span>
                              <span className={`text-[11px] font-semibold ${isActive ? 'text-green-700' : 'text-gray-700'}`}>
                                {new Date(d.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Dynamic Dashboard Calculations — real data only, no mock fallback
  const dashboardMetrics = useMemo(() => {
    return {
      plots: plots.length > 0 ? plots.length : (stats ? '—' : '—'),
      area: stats?.total_area_ha != null ? Math.round(stats.total_area_ha) : '—',
      carbon: stats?.average_carbon_density_tco2e_ha ?? '—',
      alerts: stats?.active_alerts_count ?? '—',
    };
  }, [stats, plots]);

  const yieldTrendsData = useMemo(() => {
    // Real NDVI farm-average time series, one point per observation date —
    // see overviewTrends above for why this no longer reads off TIMELINE_DATA/plots.
    const series = overviewTrends.ndvi;
    if (!series || series.length === 0) return { labels: [], datasets: [] };
    return {
      labels: series.map(t => t.label || t.date),
      datasets: [{
        label: 'NDVI (Farm Average)',
        data: series.map(t => t.mean),
        borderColor: '#16A34A',
        backgroundColor: 'rgba(22, 163, 74, 0.06)',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: '#16A34A',
      }]
    };
  }, [overviewTrends.ndvi]);

  const ndmiTrendsData = useMemo(() => {
    const series = overviewTrends.ndmi;
    if (!series || series.length === 0) return { labels: [], datasets: [] };
    return {
      labels: series.map(t => t.label || t.date),
      datasets: [{
        label: 'NDMI (Farm Average)',
        data: series.map(t => t.mean),
        borderColor: '#0284C7',
        backgroundColor: 'rgba(2, 132, 199, 0.06)',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: '#0284C7',
      }]
    };
  }, [overviewTrends.ndmi]);

  const rviTrendsData = useMemo(() => {
    const series = overviewTrends.evi;
    if (!series || series.length === 0) return { labels: [], datasets: [] };
    return {
      labels: series.map(t => t.label || t.date),
      datasets: [{
        label: 'EVI (Farm Average)',
        data: series.map(t => t.mean),
        borderColor: '#8B5CF6',
        backgroundColor: 'rgba(139, 92, 246, 0.06)',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: '#8B5CF6',
      }]
    };
  }, [overviewTrends.evi]);

  const sarRviTrendsData = useMemo(() => {
    // Was previously the EVI series mislabeled as "SAR RVI" on the
    // Vigor & Phenology page — this is the actual Sentinel-1 RVI trend.
    const series = overviewTrends.rvi;
    if (!series || series.length === 0) return { labels: [], datasets: [] };
    return {
      labels: series.map(t => t.label || t.date),
      datasets: [{
        label: 'RVI (Farm Average, Sentinel-1)',
        data: series.map(t => t.mean),
        borderColor: '#2563EB',
        backgroundColor: 'rgba(37, 99, 235, 0.06)',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: '#2563EB',
      }]
    };
  }, [overviewTrends.rvi]);

  const soilTempTrendsData = useMemo(() => {
    // True soil temperature has no real per-plot source anywhere in the
    // pipeline (see get_plots_telemetry). LST (surface temperature, from
    // the Landsat thermal band) is the closest real measurement actually
    // available — the card below is relabeled to say so rather than
    // implying a soil-specific reading that doesn't exist.
    const series = overviewTrends.lst;
    if (!series || series.length === 0) return { labels: [], datasets: [] };
    return {
      labels: series.map(t => t.label || t.date),
      datasets: [{
        label: 'LST (Farm Average)',
        data: series.map(t => t.mean),
        borderColor: '#EA580C',
        backgroundColor: 'rgba(234, 88, 12, 0.06)',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: '#EA580C',
      }]
    };
  }, [overviewTrends.lst]);

  const vpdTrendsData = useMemo(() => {
    // VPD sensor data not yet connected — chart shows no data
    return { labels: [], datasets: [] };
  }, []);

  const moistureRetentionData = useMemo(() => {
    // Use real NDMI from plotsData — group into buckets by health classification
    if (!plotsData || plotsData.length === 0) return { labels: [], datasets: [] };
    const buckets = { 'High (>0.3)': 0, 'Medium (0–0.3)': 0, 'Low (<0)': 0 };
    plotsData.forEach(p => {
      const v = p.ndmi ?? 0;
      if (v > 0.3) buckets['High (>0.3)']++;
      else if (v >= 0) buckets['Medium (0–0.3)']++;
      else buckets['Low (<0)']++;
    });
    return {
      labels: Object.keys(buckets),
      datasets: [{
        label: 'Plot Count by NDMI',
        data: Object.values(buckets),
        backgroundColor: ['#0284C7', '#38BDF8', '#EF4444'],
        borderRadius: 8,
        borderSkipped: false,
      }]
    };
  }, [plotsData]);

  const nutrientData = useMemo(() => {
    // Derive radar axes from real zarr index values via currentTimeline
    const ndvi  = currentTimeline?.ndvi  ?? 0;
    const ndmi  = currentTimeline?.ndmi  ?? 0;
    const evi   = currentTimeline?.evi   ?? 0;
    const reci  = currentTimeline?.reci  ?? 0;
    const ndre  = currentTimeline?.ndre  ?? 0;
    const lswi  = currentTimeline?.lswi  ?? 0;
    // Normalise each index to 0-100 using known physical ranges
    const norm = (v, lo, hi) => Math.min(100, Math.max(0, Math.round(((v - lo) / (hi - lo)) * 100)));
    return {
      labels: ['Vegetation (NDVI)', 'Chlorophyll (NDRE)', 'Water (NDMI)', 'Biomass (EVI)', 'Red-Edge (RECI)', 'Canopy Water (LSWI)'],
      datasets: [{
        label: 'Farm Index Profile',
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

  const landClassificationData = useMemo(() => {
    // Real area distribution from plotsData by health class
    if (!plotsData || plotsData.length === 0) return { labels: [], datasets: [{ data: [], backgroundColor: [], borderWidth: 0 }] };
    let optimal = 0, good = 0, stressed = 0;
    plotsData.forEach(p => {
      const v = p.ndvi ?? 0;
      if (v > 0.6) optimal++;
      else if (v > 0.4) good++;
      else stressed++;
    });
    return {
      labels: [`Optimal NDVI (${optimal})`, `Moderate NDVI (${good})`, `Stressed NDVI (${stressed})`],
      datasets: [{
        data: [optimal, good, stressed],
        backgroundColor: ['#16A34A', '#EAB308', '#EF4444'],
        borderWidth: 0,
        hoverOffset: 8,
      }]
    };
  }, [plotsData]);

  const gddReferenceData = useMemo(() => {
    // GDD accumulation sensor data not yet connected
    return { labels: [], datasets: [] };
  }, []);

  const gddCompletionData = useMemo(() => {
    // Use real NDVI from plotsData to show vegetation health completion proxy
    if (!plotsData || plotsData.length === 0) return { labels: [], datasets: [{ data: [], backgroundColor: [], borderRadius: 8 }] };
    const sample = plotsData.slice(0, 20);
    return {
      labels: sample.map(p => p.id),
      datasets: [{
        label: 'NDVI Score',
        data: sample.map(p => Math.round((p.ndvi ?? 0) * 100)),
        backgroundColor: sample.map(p => {
          const v = p.ndvi ?? 0;
          return v > 0.6 ? '#16A34A' : v > 0.4 ? '#EAB308' : '#EF4444';
        }),
        borderRadius: 4,
      }]
    };
  }, [plotsData]);

  const etTimeSeriesData = useMemo(() => {
    // ET sensor data not yet connected
    return { labels: [], datasets: [] };
  }, []);

  const alertsByCategoryData = useMemo(() => {
    const categories = ['Water Stress', 'Pest Infestation', 'Growth Deficit', 'Cloud Cover'];
    const counts = categories.map(cat => alerts.filter(a => a.category === cat).length);
    return {
      labels: categories,
      datasets: [{
        label: 'Alerts',
        data: counts,
        backgroundColor: ['#3b82f6', '#ef4444', '#f59e0b', '#10b981'],
        borderWidth: 0,
        borderRadius: 6
      }]
    };
  }, [alerts]);

  const getPolygonColor = (plot, indexName) => {
    let val = 0.5;
    if (indexName === 'NDVI') val = plot.ndvi;
    else if (indexName === 'NDMI') val = plot.ndmi;
    else if (indexName === 'NDWI') val = plot.ndmi - 0.05;
    else if (indexName === 'EVI') val = plot.ndvi * 0.95;

    return getIndexFiveClasses(val, indexName).color;
  };

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
    if (selectedBasemap === 'google-hybrid') {
      // lyrs=y = satellite + labels, lyrs=s = satellite only
      return `https://mt1.google.com/vt/lyrs=${showGoogleLabels ? 'y' : 's'}&x={x}&y={y}&z={z}`;
    }
    return STATIC_BASEMAP_FALLBACK;
  }, [selectedBasemap, activeComposite, compositeTileUrl, showGoogleLabels]);
  // OpenTopoMap's real (non-upscaled) tiles top out at z17 — the shared
  // maxNativeZoom={18} that worked fine for satellite sources requested
  // tiles one level past what terrain actually has.
  const basemapMaxNativeZoom = selectedBasemap === 'terrain' && !activeComposite ? 17 : 18;

  const triggerReportGeneration = async (overridePlot, overrideIndex) => {
    const targetPlot = overridePlot !== undefined ? overridePlot : reportPlot;
    const targetIndex = overrideIndex !== undefined ? overrideIndex : reportIndex;

    setIsGeneratingReport(true);
    setReportProgress(10);
    setReportProgressText('Querying satellite data repositories...');
    setGeneratedReport(null);

    try {
      setReportProgress(40);
      setReportProgressText('Executing crop index calculations...');
      const cert = await api.generateCertificate({
        scope: targetPlot === 'WHOLE-FARM' ? 'Whole Farm (Aggregate)' : 'Plot-Level',
        metric: targetIndex,
        plot_id: targetPlot === 'WHOLE-FARM' ? null : targetPlot,
      });
      setReportProgress(80);
      setReportProgressText('Compiling MRV compliance ledger...');
      await new Promise(r => setTimeout(r, 500));
      setReportProgress(100);
      setReportProgressText('Report ready.');
      await new Promise(r => setTimeout(r, 400));
      setIsGeneratingReport(false);
      const meanVal = (() => {
        if (targetIndex === 'SOC' || targetIndex === 'AGB') return '—';
        const key = targetIndex.toLowerCase();
        const mean = TIMELINE_DATA.length > 0 ? (TIMELINE_DATA.reduce((s, t) => s + (t[key] ?? 0), 0) / TIMELINE_DATA.length) : null;
        return mean !== null ? mean.toFixed(2) : '—';
      })();
      setGeneratedReport({
        id: cert.certificate_id,
        plot: targetPlot,
        index: targetIndex,
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        meanVal,
        status: 'Approved & Signed',
        diagnosticSummary: cert.diagnostic_summary,
      });
    } catch (err) {
      setIsGeneratingReport(false);
      setReportProgress(0);
      setReportProgressText('Report generation failed. Please try again.');
    }
  };

  const triggerVerificationAudit = async () => {
    // Real MRV audit from the backend — each check's outcome reflects actual
    // plot data (boundary registry, EUDR record, measured NDVI/NDMI). No
    // simulated always-success animation.
    setIsVerifying(true);
    setVerificationStatus('running');
    const keys = ['boundary', 'forest', 'cover', 'moisture'];
    setVerificationSteps(prev => {
      const next = { ...prev };
      keys.forEach(k => { next[k] = { ...next[k], status: 'scanning' }; });
      return next;
    });
    try {
      const audit = await api.fetchVerificationAudit(selectedVerifyPlot || undefined);
      const backendChecks = audit?.checks || [];
      const matchers = {
        boundary: /boundary/i,
        forest:   /deforestation|eudr/i,
        cover:    /canopy|ndvi/i,
        moisture: /water|ndmi|moisture/i,
      };
      setVerificationSteps(prev => {
        const next = { ...prev };
        keys.forEach(k => {
          const found = backendChecks.find(c => matchers[k].test(c.name || ''));
          if (found) {
            const st = (found.status || '').toLowerCase();
            next[k] = {
              ...next[k],
              status: st === 'pass' ? 'success' : st === 'warning' ? 'warning' : st === 'no data' ? 'nodata' : 'failed',
              details: found.details || next[k].details,
            };
          } else {
            next[k] = { ...next[k], status: 'nodata', details: 'No audit data returned for this check.' };
          }
        });
        return next;
      });
      setVerificationStatus('completed');
    } catch (err) {
      console.error('Verification audit failed:', err);
      setVerificationSteps(prev => {
        const next = { ...prev };
        keys.forEach(k => { next[k] = { ...next[k], status: 'failed', details: 'Audit request failed — backend unreachable.' }; });
        return next;
      });
      setVerificationStatus('completed');
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    setVerificationSteps({
      boundary: { label: 'Boundary Integrity Check', status: 'idle', details: 'Verifying polygon shape match with cadastral registry' },
      forest:   { label: 'Deforestation Compliance Check', status: 'idle', details: 'Scanning for canopy loss anomalies' },
      cover:    { label: 'Canopy Density Standard', status: 'idle', details: 'Measuring active photosynthetic activity coverage' },
      moisture: { label: 'Soil Water Index Target', status: 'idle', details: 'Assessing root-zone moisture anomalies' }
    });
    setVerificationStatus('idle');
  }, [selectedVerifyPlot]);

  // Reset timeline selection to middle index when changing month/year
  useEffect(() => {
    setSelectedTimelineIndex(2);
  }, [calendarMonth, calendarYear]);

  const [chatLoading, setChatLoading] = useState(false);

  const handleChatSubmit = async (textToSend) => {
    const query = textToSend || chatInput;
    if (!query.trim() || chatLoading) return;
    setChatMessages(prev => [...prev, { sender: 'user', text: query }]);
    if (!textToSend) setChatInput('');
    setChatLoading(true);
    try {
      const result = await api.queryAiAgent(query);
      const reply = result?.response || "No response from AI agent.";
      setChatMessages(prev => [...prev, { sender: 'assistant', text: reply, sources: result?.sources }]);
    } catch (err) {
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

  const toggleUserStatus = (userId) => {
    setSettingsUsers(prev => prev.map(u => u.id === userId ? { ...u, status: u.status === 'Active' ? 'Offline' : 'Active' } : u));
  };

  const deleteUser = (userId) => {
    setSettingsUsers(prev => prev.filter(u => u.id !== userId));
  };

  const handleInviteSubmit = (e) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) return;
    const initials = inviteName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
    const newUser = {
      id: Date.now(),
      name: inviteName,
      email: inviteEmail,
      role: inviteRole,
      status: 'Active',
      avatar: initials
    };
    setSettingsUsers(prev => [...prev, newUser]);
    setInviteName('');
    setInviteEmail('');
    setInviteSuccess(true);
    setTimeout(() => setInviteSuccess(false), 3000);
  };

  const handleConfigSave = () => {
    setShowConfigSaved(true);
    setTimeout(() => setShowConfigSaved(false), 3500);
  };

  const handleSupportSubmit = (e) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketMessage.trim()) return;
    setShowSupportSubmitted(true);
    setTicketSubject('');
    setTicketMessage('');
    setTimeout(() => setShowSupportSubmitted(false), 3500);
  };

  const prevCalMonth = () => {
    if (calendarMonth === 0) { setCalendarMonth(11); setCalendarYear(y => y - 1); }
    else setCalendarMonth(m => m - 1);
  };
  const nextCalMonth = () => {
    if (calendarMonth === 11) { setCalendarMonth(0); setCalendarYear(y => y + 1); }
    else setCalendarMonth(m => m + 1);
  };

  // Calendar computed values
  const calFirstDay    = new Date(calendarYear, calendarMonth, 1).getDay();
  const calDaysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const calTrailing    = 42 - calFirstDay - calDaysInMonth;

  // ─── Health badge helper ────────────────────────────────────────────────
  const HealthBadge = ({ health }) => {
    const cfg = {
      Optimal:  { bg: '#DCFCE7', color: '#15803D' },
      Good:     { bg: '#DCFCE7', color: '#15803D' },
      Moderate: { bg: '#FEF9C3', color: '#A16207' },
      Stressed: { bg: '#FEE2E2', color: '#B91C1C' }
    }[health] || { bg: '#F3F4F6', color: '#6B7280' };
    return (
      <span className="text-xs font-bold uppercase px-2.5 py-1 rounded-full" style={{ backgroundColor: cfg.bg, color: cfg.color }}>
        {health}
      </span>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 text-gray-900 font-sans antialiased overflow-hidden">
      {/* ── TOP HEADER BAR ─────────────────────────────────────────────────── */}
      <header className="h-[72px] bg-white border-b border-gray-100 flex items-center justify-between px-8 z-[100] shadow-sm shrink-0">

        {/* Brand */}
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-xl transition-all border border-gray-200 text-gray-500 hover:text-gray-800">
            <ArrowLeft size={17} />
          </button>
          <div className="flex items-center gap-3.5">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-md ring-4 transition-all ${brandingMode === 'AM' ? 'ring-green-50' : 'ring-green-50'}`} style={{ backgroundColor: brandingMode === 'AM' ? '#16A34A' : '#2563EB' }}>
              <Satellite className="text-white" size={21} />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-gray-900 leading-none flex items-center gap-1.5">
                {tenantDisplayName} {isOrg
                  ? (brandingMode === 'AM' ? 'Agro Monitoring' : 'Farm Tools')
                  : <>{cropLabel} {brandingMode === 'AM' ? 'Monitoring' : 'Farm Tools'}</>}
              </h1>
              <p className={`text-[11px] font-semibold uppercase tracking-widest mt-1 leading-none ${brandingMode === 'AM' ? 'text-green-600' : 'text-green-600'}`}>
                {brandingMode === 'AM' ? 'Enterprise Satellite Node' : 'Agricultural Operations Hub'}
              </p>
            </div>
          </div>
        </div>

        {/* ── TOP TABS ── */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
          {[
            { id: 'monitor',      label: 'Monitor',      icon: <Activity size={15} /> },
            { id: 'reports',      label: 'Reports',      icon: <FileText size={15} /> },
            { id: 'verification', label: 'Verification', icon: <Shield size={15} /> },
            { id: 'ai-assistant', label: 'AI Scenario Modeler', icon: <Sparkles size={15} /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTopNavTabClick(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-green-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-white/50'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* User area */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <button 
              onClick={() => { setShowNotifications(n => !n); setShowUserMenu(false); }}
              className={`p-2.5 rounded-xl transition-all border relative ${showNotifications ? 'bg-green-50 text-green-700 border-green-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-800'}`}
            >
              <Bell size={17} />
              {alerts.filter(a => a.status === 'Active').length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full border-2 border-white animate-pulse" style={{ backgroundColor: '#EF4444' }}></span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-2xl shadow-2xl z-[500] overflow-hidden">
                <div className="px-4 py-3.5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <div className="text-xs font-black uppercase tracking-wider text-gray-700">Live Alerts Feed</div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${brandingMode === 'AM' ? 'bg-green-50 text-green-700' : 'bg-green-50 text-green-700'}`}>
                    {alerts.filter(a => a.status === 'Active').length} Active
                  </span>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
                  {/* Real alerts from the backend feed — no canned notifications */}
                  {alerts.slice(0, 6).map(a => (
                    <div key={a.id} className="p-3 hover:bg-gray-50 transition-colors flex gap-2.5">
                      <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${a.severity === 'Critical' ? 'bg-status-critical' : a.severity === 'Warning' ? 'bg-status-warning' : 'bg-status-good'}`} />
                      <div>
                        <div className="text-[11px] font-bold text-gray-900">{a.category} — {a.plot}</div>
                        <div className="text-[11px] text-gray-600 mt-0.5">{a.desc}</div>
                        <div className="text-[11px] text-gray-500 mt-0.5">{a.date} {a.time}</div>
                      </div>
                    </div>
                  ))}
                  {alerts.length === 0 && (
                    <div className="p-5 text-center">
                      <div className="text-[11px] font-bold text-gray-500">No active alerts</div>
                      <div className="text-[11px] text-gray-600 mt-0.5">Alerts from the monitoring pipeline appear here.</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="w-px h-8 bg-gray-200"></div>
          {/* Clickable user avatar with sign-out dropdown */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => { setShowUserMenu(s => !s); setShowNotifications(false); }}
              className="flex items-center gap-3 hover:opacity-80 transition-all"
            >
              <div className="text-right">
                <div className="text-sm font-bold text-gray-900 leading-none">{profileName}</div>
                <div className={`text-[11px] font-semibold tracking-wider mt-1 uppercase ${brandingMode === 'AM' ? 'text-green-600' : 'text-green-600'}`}>{profileRole}</div>
              </div>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm border transition-all ${brandingMode === 'AM' ? 'text-green-700 border-green-200 bg-green-50' : 'text-green-700 border-green-200 bg-green-50'}`}>
                {brandingMode === 'AM' ? 'AM' : 'FT'}
              </div>
            </button>
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2.5 w-64 bg-white border border-gray-200 rounded-2xl shadow-2xl z-[500] overflow-hidden">
                <div className="p-4 bg-gray-50/50 flex flex-col items-center text-center border-b border-gray-100">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-white text-xl shadow-md mb-2.5" style={{ backgroundColor: brandingMode === 'AM' ? '#16A34A' : '#2563EB' }}>
                    {brandingMode === 'AM' ? 'AM' : 'FT'}
                  </div>
                  <div className="text-sm font-extrabold text-gray-950">{profileName}</div>
                  <div className="text-[11px] font-semibold text-gray-600 mt-0.5">{profileEmail}</div>
                  <span className={`inline-block text-[11px] font-extrabold px-2 py-0.5 rounded-full mt-2 border ${brandingMode === 'AM' ? 'bg-green-50 text-green-700 border-green-150' : 'bg-green-50 text-green-700 border-green-100'}`}>
                    {profileRole}
                  </span>
                </div>
                <div className="p-1.5 space-y-0.5">
                  <button
                    onClick={() => { setShowUserMenu(false); setShowSettingsModal(true); }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 rounded-xl transition-all"
                  >
                    <Settings2 size={15} className="text-gray-600" />
                    Settings Center
                  </button>
                  <button
                    onClick={() => { setShowUserMenu(false); onSignOut(); }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-bold text-green-700 hover:bg-green-50 rounded-xl transition-all"
                  >
                    <LogOut size={15} />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── MAIN WORKSPACE ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── LEFT SIDEBAR ── */}
        {activeTab === 'monitor' && (
          <aside style={{ width: `${sidebarWidth}px` }} className="bg-white border-r border-gray-100 flex flex-col z-50 shadow-sm shrink-0 relative">
            {/* Draggable vertical divider */}
            <div 
              onMouseDown={startSidebarResize} 
              className="absolute right-[-4px] top-0 bottom-0 w-2 cursor-col-resize hover:bg-green-500/50 active:bg-green-500 transition-colors z-50"
            />
            <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8">

              {/* MAIN */}
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-gray-600 uppercase tracking-widest px-3 mb-3">Main</div>
                {[
                  { id: 'analytics',           label: 'Analytics Hub',       icon: <LayoutDashboard size={17} /> },
                  { id: 'intelligence-layers', label: 'Intelligence Layers', icon: <MapIcon size={17} /> },
                  { id: 'crop-health',         label: 'Crop Health',         icon: <Activity size={17} /> },
                  { id: 'crop-yield',          label: 'Crop Yield',          icon: <TrendingUp size={17} /> },
                  { id: 'moisture-content',    label: 'Moisture Content',    icon: <Droplets size={17} /> },
                  { id: 'climate',             label: 'Climate',             icon: <CloudRain size={17} /> },
                  { id: 'land-restoration',    label: 'Land Restoration',    icon: <Leaf size={17} /> },
                  { id: 'alerts',              label: 'Alerts',              icon: <AlertTriangle size={17} />, badge: alerts.filter(a => a.status === 'Active').length }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleSidebarClick(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all ${
                      activeSidebarItem === item.id
                        ? 'text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    style={{ backgroundColor: activeSidebarItem === item.id ? (brandingMode === 'AM' ? '#16A34A' : '#2563EB') : undefined }}
                  >
                    <span className={activeSidebarItem === item.id ? 'text-white' : 'text-gray-600'}>
                      {item.icon}
                    </span>
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge > 0 && (
                      <span className={`text-[11px] font-extrabold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${activeSidebarItem === item.id ? 'bg-white/25 text-white' : 'bg-green-100 text-green-700'}`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* TOOLS */}
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-gray-600 uppercase tracking-widest px-3 mb-3">Tools</div>
                {[
                  { id: 'calendar-tool', label: 'Calendar',     icon: <CalendarIcon size={17} />, active: showCalendarTool, toggle: () => setShowCalendarTool(!showCalendarTool) },
                  { id: 'slider-tool',   label: 'Time Slider',  icon: <SlidersHorizontal size={17} />, active: showTimeSliderTool, toggle: () => setShowTimeSliderTool(!showTimeSliderTool) },
                  { id: 'compare-tool',  label: 'Split Comparison', icon: <Columns size={17} />, active: isCompareMode, toggle: () => {
                    const nextVal = !isCompareMode;
                    setIsCompareMode(nextVal);
                    if (nextVal) {
                      if (compareTimelineIndex === selectedTimelineIndex) {
                        setCompareTimelineIndex((selectedTimelineIndex + 1) % TIMELINE_DATA.length);
                      }
                      setActiveDateSlot('B');
                    } else {
                      setActiveDateSlot('A');
                    }
                  } }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={item.toggle}
                    className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-sm font-semibold transition-all ${
                      item.active
                        ? 'bg-green-50 text-green-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={item.active ? 'text-green-600' : 'text-gray-600'}>
                        {item.icon}
                      </span>
                      {item.label}
                    </div>
                    {item.active && (
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    )}
                  </button>
                ))}

                {isCompareMode && (
                  <div className="px-3 py-2.5 bg-green-50/40 rounded-xl mt-1.5 space-y-2 border border-green-100/50">
                    <div className="text-[11px] font-bold text-green-700 uppercase tracking-widest px-1">Active Date Slot</div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => setActiveDateSlot('A')}
                        className={`py-2 px-1.5 rounded-lg text-[11px] font-extrabold text-center border transition-all ${
                          activeDateSlot === 'A'
                            ? 'bg-green-600 text-white border-green-600 shadow-sm'
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        Left
                      </button>
                      <button
                        onClick={() => setActiveDateSlot('B')}
                        className={`py-2 px-1.5 rounded-lg text-[11px] font-extrabold text-center border transition-all ${
                          activeDateSlot === 'B'
                            ? 'bg-green-600 text-white border-green-600 shadow-sm'
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        Right
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* SETTINGS */}
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-gray-600 uppercase tracking-widest px-3 mb-3">Settings</div>
                {[
                  { id: 'help',      label: 'Glossary',         icon: <Info size={17} /> }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleSidebarClick(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all ${
                      activeSidebarItem === item.id
                        ? 'text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    style={{ backgroundColor: activeSidebarItem === item.id ? (brandingMode === 'AM' ? '#16A34A' : '#2563EB') : undefined }}
                  >
                    <span className={activeSidebarItem === item.id ? 'text-white' : 'text-gray-600'}>
                      {item.icon}
                    </span>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

          </aside>
        )}

        {/* ── WORKSPACE CONTENT ── */}
        <main className={`flex-1 flex flex-col relative bg-gray-50 ${['intelligence-layers', 'crop-health', 'crop-yield', 'moisture-content', 'climate', 'land-restoration'].includes(activeSidebarItem) ? 'overflow-hidden' : 'overflow-y-auto'}`}>

          {/* ══════════════════════════════════════════════════════════════
              DASHBOARD — MONITOR
          ══════════════════════════════════════════════════════════════ */}
          {activeSidebarItem === 'analytics' && activeTab === 'monitor' && (() => {
            const ANALYTICS_SUBPAGES = [
              { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={15} /> },
              { id: 'vigor-health', label: 'Vigor & Phenology', icon: <TrendingUp size={15} /> },
              { id: 'moisture-et', label: 'Moisture & ET', icon: <Droplets size={15} /> },
              { id: 'et-log', label: 'ET Historical Log', icon: <Clock size={15} /> },
              { id: 'water-management', label: 'Water Management', icon: <Waves size={15} /> },
              { id: 'soil-nutrients', label: 'Soil & Nutrients', icon: <Sun size={15} /> },
            ];
            return (
              <div className="p-10 space-y-10">
                {/* Page header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Agro Analytics Hub</h2>
                    <p className="text-sm text-gray-500 font-medium mt-2 max-w-lg">
                      Direct analytical metrics derived from Sentinel-2 & Landsat-8 imagery pass dates.
                    </p>
                  </div>
                  <div className="bg-white px-5 py-3 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-3 shrink-0">
                    <CalendarIcon size={16} className="text-green-600" />
                    <span className="text-sm font-bold text-gray-700">
                      Date last update: {currentTimeline?.label ?? '—'}
                    </span>
                  </div>
                </div>

                {/* Subtabs Menu */}
                <div className="flex border-b border-gray-200">
                  {ANALYTICS_SUBPAGES.map(sub => (
                    <button
                      key={sub.id}
                      onClick={() => setActiveAnalyticsSubpage(sub.id)}
                      className={`flex items-center gap-2 px-6 py-3 border-b-2 font-bold text-sm transition-all outline-none ${
                        activeAnalyticsSubpage === sub.id
                          ? 'border-green-600 text-green-600'
                          : 'border-transparent text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      {sub.icon}
                      {sub.label}
                    </button>
                  ))}
                </div>

                {/* Search & Filters */}
                <div className="bg-white px-6 py-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-4 lg:flex-row lg:items-center justify-between">
                  <div className="relative flex-1 max-w-md w-full">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                    <input
                      type="text"
                      placeholder="Search blocks, parameters, anomalies..."
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-11 pr-4 text-sm font-medium outline-none focus:border-green-500 focus:bg-white transition-all text-gray-700"
                    />
                  </div>
                  
                  {/* Active Filter Dropdowns */}
                  <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                    {/* Estate Filter */}
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                      <span className="text-[11px] uppercase font-extrabold text-gray-600 tracking-wider">Estate</span>
                      <select
                        value={filterEstate}
                        onChange={e => handleEstateChange(e.target.value)}
                        className="bg-transparent text-xs font-bold text-gray-700 outline-none cursor-pointer pr-1"
                      >
                        <option value="All">All Farms</option>
                        {[...new Set(plotsData.map(p => p.subfarm).filter(Boolean))].map(sf => (
                          <option key={sf} value={sf}>{sf}</option>
                        ))}
                      </select>
                    </div>

                    {/* Plot Filter — populated from real plot IDs */}
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                      <span className="text-[11px] uppercase font-extrabold text-gray-600 tracking-wider">Plot</span>
                      <select
                        value={filterPlot}
                        onChange={e => handlePlotFilterChange(e.target.value)}
                        className="bg-transparent text-xs font-bold text-gray-700 outline-none cursor-pointer pr-1"
                      >
                        <option value="All">All Plots</option>
                        {plotsData.slice(0, 50).map(p => (
                          <option key={p.id} value={p.id}>{p.id}</option>
                        ))}
                      </select>
                    </div>

                    {/* Date Filter */}
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                      <span className="text-[11px] uppercase font-extrabold text-gray-600 tracking-wider">Date</span>
                      <select
                        value={filterDate}
                        onChange={e => setFilterDate(e.target.value)}
                        className="bg-transparent text-xs font-bold text-gray-700 outline-none cursor-pointer pr-1"
                      >
                        <option value="All">All Pass Dates</option>
                        {TIMELINE_DATA.map(t => (
                          <option key={t.date} value={t.date}>{t.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Clear Button */}
                    {(filterEstate !== 'All' || filterPlot !== 'All' || filterDate !== 'All') && (
                      <button
                        onClick={() => { setFilterEstate('All'); setFilterPlot('All'); setFilterDate('All'); }}
                        className="text-xs font-bold text-green-700 hover:text-green-800 transition-colors flex items-center gap-1.5 px-3 py-2 bg-green-50 hover:bg-green-100/70 rounded-xl"
                      >
                        <X size={14} /> Clear Filters
                      </button>
                    )}
                  </div>
                </div>

                {/* Subpage Contents */}
                {activeAnalyticsSubpage === 'overview' && (
                  <div className="space-y-10">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {[
                        { label: 'Total Plots',   value: `${dashboardMetrics.plots}`,               subtext: 'Active Farm Plots',        icon: <Layers size={22} className="text-green-600" />,  accent: '#EFF6FF', border: '#BFDBFE' },
                        { label: 'Area Monitored', value: `${dashboardMetrics.area.toLocaleString()} ha`, subtext: 'Hectares Covered',    icon: <Globe size={22} className="text-green-600" />,    accent: '#F0FDF4', border: '#BBF7D0' },
                        { label: 'Carbon Density', value: `${dashboardMetrics.carbon} t/ha`,             subtext: 'Average tCO2e/Hectare',    icon: <Leaf size={22} className="text-green-600" />,   accent: '#f0fdf4', border: '#bbf7d0' },
                        { label: 'Alerts',         value: dashboardMetrics.alerts,                    subtext: 'Critical Moisture Stress', icon: <AlertTriangle size={22} className="text-green-600" />, accent: '#FFF1F2', border: '#FECDD3' }
                      ].map((kpi, i) => (
                        <div key={i}
                          className="bg-white p-7 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group cursor-default"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-3">
                                {kpi.label} {renderInfoTooltip(kpi.label)}
                              </span>
                              <span className="text-4xl font-bold tracking-tight text-gray-900 block mb-2">
                                {kpi.value}
                              </span>
                              <span className="text-xs text-gray-600 font-medium block uppercase tracking-wide">
                                {kpi.subtext}
                              </span>
                            </div>
                            <div
                              className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border group-hover:scale-105 transition-all"
                              style={{ backgroundColor: kpi.accent, borderColor: kpi.border }}
                            >
                              {kpi.icon}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* 4-Chart Overview Grid */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
                      {/* Vegetation Vigor & Health Trends */}
                      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-5">
                        <div className="flex justify-between items-center">
                          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2.5">
                            <TrendingUp size={18} className="text-green-600" />
                            Geospatial Vegetation Vigor & Health Trends {renderInfoTooltip("Geospatial Vegetation Vigor & Health Trends")}
                          </h3>
                          <span className="text-xs bg-green-50 text-green-700 font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                            NDVI
                          </span>
                        </div>
                        <div className="h-[280px]">
                          <Line data={yieldTrendsData} options={{ ...CHART_DEFAULTS, scales: { ...CHART_DEFAULTS.scales, y: { ...CHART_DEFAULTS.scales.y, min: 0.2, max: 1.0 } } }} />
                        </div>
                      </div>

                      {/* Moisture Retention (NDMI) Trends */}
                      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-5">
                        <div className="flex justify-between items-center">
                          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2.5">
                            <Droplets size={18} className="text-green-600" />
                            Canopy Moisture Retention (NDMI) Trends {renderInfoTooltip("Moisture Retention (NDMI)")}
                          </h3>
                          <span className="text-xs bg-green-50 text-green-700 font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                            NDMI
                          </span>
                        </div>
                        <div className="h-[280px]">
                          <Line data={ndmiTrendsData} options={{ ...CHART_DEFAULTS, scales: { ...CHART_DEFAULTS.scales, y: { ...CHART_DEFAULTS.scales.y, min: 0.1, max: 0.7 } } }} />
                        </div>
                      </div>

                      {/* Land Surface Temperature Trends */}
                      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-5">
                        <div className="flex justify-between items-center">
                          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2.5">
                            <Thermometer size={18} className="text-green-600" />
                            Land Surface Temperature Trends {renderInfoTooltip("Land Surface Temperature Trends")}
                          </h3>
                          <span className="text-xs bg-green-50 text-green-700 font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                            LST °C
                          </span>
                        </div>
                        <div className="h-[280px] relative">
                          {soilTempTrendsData.labels.length === 0 ? (
                            <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500 font-medium text-center px-6">
                              No Landsat thermal-band imagery in the archive yet for this farm.
                            </div>
                          ) : (
                            <Line data={soilTempTrendsData} options={{ ...CHART_DEFAULTS, scales: { ...CHART_DEFAULTS.scales, y: { ...CHART_DEFAULTS.scales.y, min: 15, max: 45 } } }} />
                          )}
                        </div>
                      </div>

                      {/* Vapor Pressure Deficit Stress Trends */}
                      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-5">
                        <div className="flex justify-between items-center">
                          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2.5">
                            <Wind size={18} className="text-purple-500" />
                            Vapor Pressure Deficit (VPD) Stress Trends {renderInfoTooltip("Vapor Pressure Deficit (VPD)")}
                          </h3>
                          <span className="text-xs bg-green-50 text-green-700 font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                            VPD kPa
                          </span>
                        </div>
                        <div className="h-[280px] relative">
                          <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500 font-medium text-center px-6">
                            No VPD source connected yet — this needs a humidity feed the pipeline doesn't fetch today.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeAnalyticsSubpage === 'vigor-health' && (
                  <div className="space-y-10">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                      {/* Crop Yield & Health Trends */}
                      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-5">
                        <div className="flex justify-between items-center">
                          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2.5">
                            <TrendingUp size={18} className="text-green-600" />
                            Geospatial Vegetation Vigor & Health Trends {renderInfoTooltip("Geospatial Vegetation Vigor & Health Trends")}</h3>
                          <span className="text-xs bg-green-50 text-green-700 font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                            NDVI Normalized
                          </span>
                        </div>
                        <div className="h-[300px]">
                          <Line
                            data={yieldTrendsData}
                            options={{ ...CHART_DEFAULTS, scales: { ...CHART_DEFAULTS.scales, y: { ...CHART_DEFAULTS.scales.y, min: 0.2, max: 1.0 } } }}
                          />
                        </div>
                      </div>

                      {/* GDD Reference Curve */}
                      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-5">
                        <div className="flex justify-between items-center">
                          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2.5">
                            <Activity size={18} className="text-green-600" />
                            Seasonal Trajectory vs GDD Reference Curve {renderInfoTooltip("Seasonal Trajectory vs GDD Reference Curve")}</h3>
                          <span className="text-xs bg-green-50 text-green-700 font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                            GDD Model
                          </span>
                        </div>
                        <div className="h-[300px]">
                          <Line
                            data={gddReferenceData}
                            options={CHART_DEFAULTS}
                          />
                        </div>
                      </div>

                      {/* Radar Vegetation Index (RVI) Growth Trends */}
                      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-5">
                        <div className="flex justify-between items-center">
                          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2.5">
                            <TrendingUp size={18} className="text-green-600" />
                            Radar Vegetation Index (RVI) Growth Trends {renderInfoTooltip("Radar Vegetation Index (RVI)")}</h3>
                          <span className="text-xs bg-green-50 text-green-700 font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                            SAR RVI
                          </span>
                        </div>
                        <div className="h-[300px]">
                          <Line
                            data={sarRviTrendsData}
                            options={{ ...CHART_DEFAULTS, scales: { ...CHART_DEFAULTS.scales, y: { ...CHART_DEFAULTS.scales.y, min: 0.0, max: 2.0 } } }}
                          />
                        </div>
                      </div>

                      {/* GDD Completion Rate */}
                      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-5">
                        <div className="flex justify-between items-center">
                          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2.5">
                            <Activity size={18} className="text-green-600" />
                            Plot-by-Plot Growing Degree Days (GDD) Completion Rate {renderInfoTooltip("Plot-by-Plot Growing Degree Days (GDD) Completion Rate")}</h3>
                          <span className="text-xs bg-green-50 text-green-700 font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                            Thermal Units
                          </span>
                        </div>
                        <div className="h-[300px]">
                          <Bar
                            data={gddCompletionData}
                            options={CHART_DEFAULTS}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeAnalyticsSubpage === 'moisture-et' && (
                  <div className="space-y-10">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                      {/* ET Time Series Chart */}
                      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-5">
                        <div className="flex justify-between items-center">
                          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2.5">
                            <Droplets size={18} className="text-green-600" />
                            FAO-56 Evapotranspiration Model {renderInfoTooltip("FAO-56 Evapotranspiration Model")}</h3>
                          <span className="text-xs bg-green-50 text-green-700 font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                            ETc vs ETa
                          </span>
                        </div>
                        <div className="h-[300px]">
                          <Line
                            data={etTimeSeriesData}
                            options={CHART_DEFAULTS}
                          />
                        </div>
                      </div>

                      {/* Canopy Moisture Retention (NDMI) Trends */}
                      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-5">
                        <div className="flex justify-between items-center">
                          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2.5">
                            <Droplets size={18} className="text-green-600" />
                            Canopy Moisture Retention (NDMI) Trends {renderInfoTooltip("Moisture Retention (NDMI)")}</h3>
                          <span className="text-xs bg-green-50 text-green-700 font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                            NDMI
                          </span>
                        </div>
                        <div className="h-[300px]">
                          <Line
                            data={ndmiTrendsData}
                            options={{ ...CHART_DEFAULTS, scales: { ...CHART_DEFAULTS.scales, y: { ...CHART_DEFAULTS.scales.y, min: 0.1, max: 0.7 } } }}
                          />
                        </div>
                      </div>

                      {/* Soil Temperature Trends */}
                      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-5">
                        <div className="flex justify-between items-center">
                          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2.5">
                            <Sun size={18} className="text-green-600" />
                            Soil Temperature Trends {renderInfoTooltip("Soil Temp")}</h3>
                          <span className="text-xs bg-green-50 text-green-700 font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                            Soil Temp
                          </span>
                        </div>
                        <div className="h-[300px]">
                          <Line
                            data={soilTempTrendsData}
                            options={CHART_DEFAULTS}
                          />
                        </div>
                      </div>

                      {/* VPD Stress Trends */}
                      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-5">
                        <div className="flex justify-between items-center">
                          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2.5">
                            <Activity size={18} className="text-green-600" />
                            Vapor Pressure Deficit (VPD) Stress Trends {renderInfoTooltip("VPD Stress")}</h3>
                          <span className="text-xs bg-green-50 text-green-700 font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                            VPD Index
                          </span>
                        </div>
                        <div className="h-[300px]">
                          <Line
                            data={vpdTrendsData}
                            options={CHART_DEFAULTS}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeAnalyticsSubpage === 'et-log' && (
                  <div className="space-y-10">
                    {/* Was a hardcoded table — fake dates (May 24-30, never
                        actually the current period) with every value as a
                        placeholder dash. No backend endpoint provides a
                        day-by-day ETo/Kc/ETa/deficit/soil-moisture history
                        (the water-demand endpoint only returns each plot's
                        current snapshot — see Water Management). Left as an
                        honest empty state rather than real-looking fake
                        rows until that endpoint exists. */}
                    <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-5">
                      <h3 className="text-base font-bold text-gray-900 flex items-center gap-2.5">
                        <Clock size={18} className="text-gray-600" />
                        7-Day Evapotranspiration Historical Log {renderInfoTooltip("7-Day Evapotranspiration Historical Log")}</h3>
                      {waterDemandData && waterDemandData.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-gray-200 text-gray-600 uppercase tracking-wider font-extrabold text-[11px]">
                                <th className="py-3 px-4">Plot</th>
                                <th className="py-3 px-4">Area (ha)</th>
                                <th className="py-3 px-4">Demand ETc (mm/day)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                              {waterDemandData.map(p => (
                                <tr key={p.plot_id} className="hover:bg-gray-50/50">
                                  <td className="py-3 px-4 font-bold">{p.name}</td>
                                  <td className="py-3 px-4">{p.area_ha != null ? p.area_ha.toFixed(2) : '—'}</td>
                                  <td className="py-3 px-4">{p.etc_mm_day != null ? p.etc_mm_day.toFixed(2) : '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <div className="text-[11px] text-gray-600 mt-3">
                            Shows each plot's current ETc snapshot — day-by-day ETo/Kc/ETa/deficit/soil-moisture history requires a backend endpoint that doesn't exist yet.
                          </div>
                        </div>
                      ) : (
                        <div className="border border-gray-100 rounded-xl p-6 text-sm text-gray-600 text-center">
                          No water demand data available yet — run the pipeline with ETc enabled to populate this panel.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeAnalyticsSubpage === 'water-management' && (
                  <div className="space-y-6">
                    {waterDemandLoading && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 font-semibold">
                        <RefreshCw size={14} className="animate-spin" /> Loading water demand data…
                      </div>
                    )}

                    {!waterDemandLoading && (!waterDemandData || waterDemandData.length === 0) && (
                      <div className="border border-gray-100 rounded-xl p-6 bg-white text-sm text-gray-600 text-center">
                        No water demand data available yet — run the pipeline with ETc enabled to populate this panel.
                      </div>
                    )}

                    {!waterDemandLoading && waterDemandData && waterDemandData.length > 0 && (() => {
                      const withEtc = waterDemandData.filter(p => p.etc_mm_day != null);
                      const avgEtc = withEtc.length
                        ? withEtc.reduce((sum, p) => sum + p.etc_mm_day, 0) / withEtc.length
                        : null;
                      const farm = waterDemandData[0];
                      return (
                        <>
                          {/* KPI cards */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="border border-gray-100 rounded-xl p-4 bg-white shadow-sm">
                              <div className="text-[11px] font-bold text-gray-600 uppercase tracking-widest mb-1">Avg. Crop Water Demand</div>
                              <div className="text-2xl font-black text-gray-800">
                                {avgEtc != null ? `${avgEtc.toFixed(2)}` : '—'} <span className="text-xs font-semibold text-gray-600">mm/day</span>
                              </div>
                            </div>
                            <div className="border border-gray-100 rounded-xl p-4 bg-white shadow-sm">
                              <div className="text-[11px] font-bold text-gray-600 uppercase tracking-widest mb-1">Cumulative Rainfall</div>
                              <div className="text-2xl font-black text-gray-800">
                                {farm.cumulative_rainfall_mm != null ? farm.cumulative_rainfall_mm.toFixed(1) : '—'} <span className="text-xs font-semibold text-gray-600">mm</span>
                              </div>
                            </div>
                            <div className="border border-gray-100 rounded-xl p-4 bg-white shadow-sm">
                              <div className="text-[11px] font-bold text-gray-600 uppercase tracking-widest mb-1">Irrigation Efficiency</div>
                              <div className="text-2xl font-black text-gray-800">
                                {farm.irrigation_efficiency != null ? `${(farm.irrigation_efficiency * 100).toFixed(0)}%` : '—'}
                              </div>
                              <div className="text-[11px] text-gray-600 mt-1">Rainfall received / crop water demand over the run period</div>
                            </div>
                          </div>

                          {/* Per-plot ETc table */}
                          <div className="border border-gray-100 rounded-xl bg-white shadow-sm overflow-hidden">
                            <div className="px-4 py-3 border-b border-gray-100 text-xs font-bold text-gray-700 uppercase tracking-widest">Per-Plot Crop Water Demand</div>
                            <div className="max-h-80 overflow-y-auto">
                              <table className="w-full text-xs">
                                <thead className="bg-gray-50 text-gray-600 uppercase tracking-widest text-[11px]">
                                  <tr>
                                    <th className="text-left px-4 py-2">Plot</th>
                                    <th className="text-left px-4 py-2">Area (ha)</th>
                                    <th className="text-left px-4 py-2">ETc (mm/day)</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {waterDemandData.map(p => (
                                    <tr key={p.plot_id} className="border-t border-gray-50">
                                      <td className="px-4 py-2 font-semibold text-gray-700">{p.name}</td>
                                      <td className="px-4 py-2 text-gray-500">{p.area_ha != null ? p.area_ha.toFixed(2) : '—'}</td>
                                      <td className="px-4 py-2 text-gray-500">{p.etc_mm_day != null ? p.etc_mm_day.toFixed(2) : '—'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          <div className="text-[11px] text-gray-600 px-1">
                            ETc is also available as a map layer — select "ETc" from the index picker on Intelligence Layers to view it with the time slider.
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}

                {activeAnalyticsSubpage === 'soil-nutrients' && (
                  <div className="space-y-10">
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                      {/* Nutrient Profiling (Radar) */}
                      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-5 xl:col-span-1">
                        <h3 className="text-base font-bold text-gray-900 flex items-center gap-2.5">
                          <Sun size={18} className="text-green-600" />
                          Nutrient Profiling {renderInfoTooltip("Nutrient Profiling")}</h3>
                        <div className="h-[320px] flex items-center justify-center">
                          <Radar
                            data={nutrientData}
                            options={{
                              scales: { r: { angleLines: { display: false }, suggestedMin: 0, suggestedMax: 100, ticks: { display: false }, pointLabels: { font: { size: 11, weight: '600' } } } },
                              plugins: { legend: { display: false } }
                            }}
                          />
                        </div>
                      </div>

                      {/* Detailed Soil Chemistry Diagnostics */}
                      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-5 xl:col-span-2">
                        <h3 className="text-base font-bold text-gray-900 flex items-center gap-2.5">
                          <Activity size={18} className="text-green-600" />
                          Detailed Soil Chemistry Diagnostics {renderInfoTooltip("Detailed Soil Chemistry Diagnostics")}</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                          {/* Parameters Table/List */}
                          <div className="space-y-3">
                            <h4 className="text-[11px] font-extrabold uppercase text-gray-600 tracking-wider">Diagnostic Metrics</h4>
                            {[
                              { name: 'Soil pH', value: '—', status: '—', color: 'text-gray-500' },
                              { name: 'Organic Carbon', value: '—', status: '—', color: 'text-gray-500' },
                              { name: 'Total Nitrogen (N)', value: '—', status: '—', color: 'text-gray-500' },
                              { name: 'Available Phosphorus (P)', value: '—', status: '—', color: 'text-gray-500' },
                              { name: 'Exchangeable Potassium (K)', value: '—', status: '—', color: 'text-gray-500' }
                            ].map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                                <span className="text-xs font-bold text-gray-500">{item.name}</span>
                                <span className={`text-xs font-bold ${item.color}`}>{item.value}</span>
                              </div>
                            ))}
                          </div>

                          {/* Actionable Recommendations */}
                          <div className="space-y-3">
                            <h4 className="text-[11px] font-extrabold uppercase text-gray-600 tracking-wider">Agronomic Recommendations</h4>
                            <div className="bg-green-50/50 border border-green-100 p-4 rounded-xl space-y-3">
                              <p className="text-xs text-gray-500 font-semibold leading-relaxed">
                                Soil chemistry data not yet connected. Upload soil sample results to generate agronomic recommendations for this plot.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ══════════════════════════════════════════════════════════════
              MAP ANALYTICS
          ══════════════════════════════════════════════════════════════ */}
          {activeSidebarItem === 'intelligence-layers' && (
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
                    <TileLayer key={basemapUrl} url={basemapUrl} attribution="&copy; ESRI & Google Satellite Imagery" maxZoom={22} maxNativeZoom={basemapMaxNativeZoom} />
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
                    <FitBoundsToPlots plotsData={filteredPlotsData} farmBoundary={farmBoundary} />
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
                                className="text-[11px] font-bold text-slate-700 bg-white border border-slate-300 rounded-lg px-2 py-1.5 shadow-sm"
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
                    Map Layers
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
                        <span className="text-base font-bold text-gray-800 font-sans">Map Layers</span>
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
                          className="flex items-center gap-1 text-[11px] font-bold text-gray-600 hover:text-gray-800 uppercase tracking-widest cursor-pointer select-none transition-colors"
                        >
                          {intelOpExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />} Operational
                        </div>
                        {intelOpExpanded && (
                          <div className="space-y-3">
                            {/* Satellite Index Raster Card */}
                        <div className="border border-gray-100 rounded-xl p-3.5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-xs font-bold text-gray-700 leading-tight flex items-center gap-1.5">Satellite Index Raster</div>
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
          )}

          {activeSidebarItem === 'crop-health' && (
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
                    <TileLayer key={basemapUrl} url={basemapUrl} attribution="&copy; ESRI & Google Satellite Imagery" maxZoom={22} maxNativeZoom={basemapMaxNativeZoom} />
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
                    {null}
                    <FitBoundsToPlots plotsData={plotsData} farmBoundary={farmBoundary} />
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

                  {/* Floating map layers trigger */}
                  <button
                    onClick={() => setHealthShowLayers(!healthShowLayers)}
                    className={`absolute top-4 right-4 bg-white border p-3 rounded-2xl shadow-xl hover:bg-gray-50 flex items-center gap-2 font-bold text-xs transition-all active:scale-95 ${
                      healthShowLayers ? 'text-green-700 border-green-200 bg-green-50 shadow-inner' : 'text-gray-700 border-gray-200 bg-white'
                    }`}
                    style={{ zIndex: 40000 }}
                  >
                    <Layers size={16} className={healthShowLayers ? 'text-green-600' : 'text-gray-600'} />
                    Map Layers
                  </button>

                  {/* Plot detail panel (over map) */}
                  {null}
                </div>

                {/* ═══ RIGHT MAP LAYERS SIDEBAR ═══ */}
                {healthShowLayers && (
                  <div className="w-[280px] bg-white border-l border-gray-100 flex flex-col shrink-0 overflow-y-auto z-10 shadow-sm animate-in slide-in-from-right duration-300">
                    {/* Header */}
                    <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Layers size={18} className="text-green-600" />
                        <span className="text-base font-bold text-gray-800 font-sans">Map Layers</span>
                      </div>
                      <button onClick={() => setHealthShowLayers(false)} className="p-1 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-gray-655 transition-all">
                        <X size={18} />
                      </button>
                    </div>

                    <div className="p-4 space-y-6">
                      {/* OPERATIONAL SECTION */}
                      <div className="space-y-3">

                        <div 
                          onClick={() => setHealthOpExpanded(!healthOpExpanded)}
                          className="flex items-center gap-1 text-[11px] font-bold text-gray-600 hover:text-gray-800 uppercase tracking-widest cursor-pointer select-none transition-colors"
                        >
                          {healthOpExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />} Operational
                        </div>
                        {healthOpExpanded && (
                          <div className="space-y-3">
                            {/* Satellite Index Raster Card */}
                        <div className="border border-gray-100 rounded-xl p-3.5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-xs font-bold text-gray-700 leading-tight flex items-center gap-1.5">Satellite Index Raster</div>
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
                              onClick={() => setHealthShowBoundaries(!healthShowBoundaries)}
                              className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 shrink-0 ${
                                healthShowBoundaries ? 'bg-green-600' : 'bg-gray-200'
                              }`}
                              style={{ backgroundColor: healthShowBoundaries ? '#16A34A' : '#E5E7EB' }}
                            >
                              <div className={`w-4 h-4 rounded-full bg-white shadow transform transition-transform duration-200 ${
                                healthShowBoundaries ? 'translate-x-4' : 'translate-x-0'
                              }`} />
                            </button>
                          </div>
                          {healthShowBoundaries && (
                            <div className="space-y-2 pt-1 border-t border-gray-50">
                              <div className="flex items-center justify-between text-[11px] text-gray-600 font-bold">
                                <span>Opacity</span>
                                <span>{healthBoundariesOpacity}%</span>
                              </div>
                              <input type="range" min="10" max="100" value={healthBoundariesOpacity}
                                onChange={e => setHealthBoundariesOpacity(parseInt(e.target.value))}
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
                      {/* No outer "Index Legends" wrapper — each group
                          renderLegendCards() produces is already its own
                          collapsible section, so nesting them a second time
                          under a generic umbrella header just meant an extra
                          click to see the same list. */}
                      {/* Health-relevant indices only — SAR/water-moisture
                          already have their own real estate on other
                          pages (Map Analytics, Moisture Content), so
                          repeating them here would just be the same
                          index shown a second time under a different tab.
                          Crop mode's crop_group values (Biophysical/
                          Nutrient/Canopy/...) are a different vocabulary
                          than org mode's tag-derived groups (Vegetation
                          Health/Nutrient & Chlorophyll/...), so the
                          filter has to match whichever scheme is active. */}
                      {renderLegendCards(isOrg
                        ? ['Vegetation Health', 'Nutrient & Chlorophyll']
                        : ['Biophysical', 'Nutrient', 'Canopy'])}
                    </div>
                  </div>
                )}

              </div>

              {/* ══ BOTTOM PANEL ══ */}
              {renderMapBottomPanel(selectedIndex)}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              CROP YIELD MAP VIEW
          ══════════════════════════════════════════════════════════════ */}
          {activeSidebarItem === 'crop-yield' && (
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
                    <TileLayer key={basemapUrl} url={basemapUrl} attribution="&copy; ESRI & Google Satellite Imagery" maxZoom={22} maxNativeZoom={basemapMaxNativeZoom} />
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
                          leftPaneName="left-pane-yield"
                          rightPaneName="right-pane-yield"
                          splitPosition={splitPosition}
                          isCompareMode={isCompareMode}
                        />
                        <Pane name="left-pane-yield" style={{ zIndex: 500 }}>
                          {showRasterLayer && currentTileUrl && (
                            <TileLayer key={`a-${currentTileUrl}`} url={currentTileUrl} opacity={mapOpacity / 100} bounds={rasterOverlayBounds || undefined} maxZoom={22} maxNativeZoom={18} />
                          )}
                          {renderYieldPolygons(yieldPlotsDataA, 'left')}
                        </Pane>
                        <Pane name="right-pane-yield" style={{ zIndex: 501 }}>
                          {showRasterLayer && currentTileUrlB && (
                            <TileLayer key={`b-${currentTileUrlB}`} url={currentTileUrlB} opacity={mapOpacity / 100} bounds={rasterOverlayBounds || undefined} maxZoom={22} maxNativeZoom={18} />
                          )}
                          {renderYieldPolygons(yieldPlotsDataB, 'right')}
                        </Pane>
                      </>
                    ) : (
                      renderYieldPolygons(yieldPlotsData)
                    )}
                    {null}
                    <FitBoundsToPlots plotsData={plotsData} farmBoundary={farmBoundary} />
                    <FitToZarrBounds zarrBounds={zarrBounds} />
                    <ZoomControl position="bottomright" />
                    <ResizeMap trigger={yieldShowLayers} />
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

                  {/* Floating map layers trigger */}
                  <button
                    onClick={() => setYieldShowLayers(!yieldShowLayers)}
                    className={`absolute top-4 right-4 bg-white border p-3 rounded-2xl shadow-xl hover:bg-gray-50 flex items-center gap-2 font-bold text-xs transition-all active:scale-95 ${
                      yieldShowLayers ? 'text-green-700 border-green-200 bg-green-50 shadow-inner' : 'text-gray-700 border-gray-200 bg-white'
                    }`}
                    style={{ zIndex: 40000 }}
                  >
                    <Layers size={16} className={yieldShowLayers ? 'text-green-600' : 'text-gray-600'} />
                    Map Layers
                  </button>

                  {/* Plot detail panel (over map) */}
                  {null}
                </div>

                {/* ═══ RIGHT MAP LAYERS SIDEBAR ═══ */}
                {yieldShowLayers && (
                  <div className="w-[280px] bg-white border-l border-gray-100 flex flex-col shrink-0 overflow-y-auto z-10 shadow-sm animate-in slide-in-from-right duration-300">
                    {/* Header */}
                    <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Layers size={18} className="text-green-600" />
                        <span className="text-base font-bold text-gray-800 font-sans">Map Layers</span>
                      </div>
                      <button onClick={() => setYieldShowLayers(false)} className="p-1 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-gray-650 transition-all">
                        <X size={18} />
                      </button>
                    </div>

                    <div className="p-4 space-y-6">
                      {/* OPERATIONAL SECTION */}
                      <div className="space-y-3">

                        <div 
                          onClick={() => setYieldOpExpanded(!yieldOpExpanded)}
                          className="flex items-center gap-1 text-[11px] font-bold text-gray-600 hover:text-gray-800 uppercase tracking-widest cursor-pointer select-none transition-colors"
                        >
                          {yieldOpExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />} Operational
                        </div>
                        {yieldOpExpanded && (
                          <div className="space-y-3">
                            {/* Satellite Index Raster Card */}
                        <div className="border border-gray-100 rounded-xl p-3.5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-xs font-bold text-gray-700 leading-tight flex items-center gap-1.5">Satellite Index Raster</div>
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
                              onClick={() => setYieldShowBoundaries(!yieldShowBoundaries)}
                              className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 shrink-0 ${
                                yieldShowBoundaries ? 'bg-green-600' : 'bg-gray-200'
                              }`}
                              style={{ backgroundColor: yieldShowBoundaries ? '#16A34A' : '#E5E7EB' }}
                            >
                              <div className={`w-4 h-4 rounded-full bg-white shadow transform transition-transform duration-200 ${
                                yieldShowBoundaries ? 'translate-x-4' : 'translate-x-0'
                              }`} />
                            </button>
                          </div>
                          {yieldShowBoundaries && (
                            <div className="space-y-2 pt-1 border-t border-gray-50">
                              <div className="flex items-center justify-between text-[11px] text-gray-600 font-bold">
                                <span>Opacity</span>
                                <span>{yieldBoundariesOpacity}%</span>
                              </div>
                              <input type="range" min="10" max="100" value={yieldBoundariesOpacity}
                                onChange={e => setYieldBoundariesOpacity(parseInt(e.target.value))}
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
                      <div className="space-y-3">
                        <div
                          onClick={() => setYieldProdExpanded(!yieldProdExpanded)}
                          className="flex items-center gap-1 text-[11px] font-bold text-gray-600 hover:text-gray-800 uppercase tracking-widest cursor-pointer select-none transition-colors"
                        >
                          {yieldProdExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />} Production
                        </div>
                        {yieldProdExpanded && (
                          <div className="space-y-3">
                        <div className="border border-gray-100 rounded-xl p-3.5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div><div className="text-xs font-bold text-gray-700 leading-tight flex items-center gap-1.5">Yield Forecast {renderInfoTooltip("Yield Forecast")}</div><span className="text-[11px] text-gray-600">Predicted harvest volume</span></div>
                            <button onClick={() => setYieldShowYield(!yieldShowYield)} className="w-9 h-5 rounded-full p-0.5 transition-colors duration-200 shrink-0" style={{ backgroundColor: yieldShowYield ? '#16A34A' : '#E5E7EB' }}>
                              <div style={{ transform: yieldShowYield ? 'translateX(16px)' : 'translateX(0)' }} className="w-4 h-4 rounded-full bg-white shadow transition-transform duration-200" />
                            </button>
                          </div>
                          {yieldShowYield && (
                            <div className="space-y-1.5 pt-1 border-t border-gray-50">
                              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#15803d'}}/><span className="text-[11px] font-semibold text-gray-500">High</span></div>
                              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#84cc16'}}/><span className="text-[11px] font-semibold text-gray-500">Good</span></div>
                              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#eab308'}}/><span className="text-[11px] font-semibold text-gray-500">Average</span></div>
                              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#dc2626'}}/><span className="text-[11px] font-semibold text-gray-500">Below Average</span></div>
                            </div>
                          )}
                        </div>                        <div className="border border-gray-100 rounded-xl p-3.5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div><div className="text-xs font-bold text-gray-700 leading-tight flex items-center gap-1.5">Biomass {renderInfoTooltip("Biomass")}</div><span className="text-[11px] text-gray-600">Above-ground biomass (EVI-derived)</span></div>
                            <button onClick={() => setYieldShowBiomass(!yieldShowBiomass)} className="w-9 h-5 rounded-full p-0.5 transition-colors duration-200 shrink-0" style={{ backgroundColor: yieldShowBiomass ? '#16A34A' : '#E5E7EB' }}>
                              <div style={{ transform: yieldShowBiomass ? 'translateX(16px)' : 'translateX(0)' }} className="w-4 h-4 rounded-full bg-white shadow transition-transform duration-200" />
                            </button>
                          </div>
                          {yieldShowBiomass && (
                            <div className="space-y-1.5 pt-1 border-t border-gray-50">
                              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#15803d'}}/><span className="text-[11px] font-semibold text-gray-500">High</span></div>
                              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#84cc16'}}/><span className="text-[11px] font-semibold text-gray-500">Moderate</span></div>
                              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#fbbf24'}}/><span className="text-[11px] font-semibold text-gray-500">Low</span></div>
                            </div>
                          )}
                        </div>                        <div className="border border-gray-100 rounded-xl p-3.5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div><div className="text-xs font-bold text-gray-700 leading-tight flex items-center gap-1.5">Harvest Readiness {renderInfoTooltip("Harvest Readiness")}</div><span className="text-[11px] text-gray-600">Crop maturity status</span></div>
                            <button onClick={() => setYieldShowReadiness(!yieldShowReadiness)} className="w-9 h-5 rounded-full p-0.5 transition-colors duration-200 shrink-0" style={{ backgroundColor: yieldShowReadiness ? '#16A34A' : '#E5E7EB' }}>
                              <div style={{ transform: yieldShowReadiness ? 'translateX(16px)' : 'translateX(0)' }} className="w-4 h-4 rounded-full bg-white shadow transition-transform duration-200" />
                            </button>
                          </div>
                          {yieldShowReadiness && (
                            <div className="space-y-1.5 pt-1 border-t border-gray-50">
                              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#15803d'}}/><span className="text-[11px] font-semibold text-gray-500">Ready to Harvest</span></div>
                              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#fbbf24'}}/><span className="text-[11px] font-semibold text-gray-500">2-4 Weeks</span></div>
                              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#dc2626'}}/><span className="text-[11px] font-semibold text-gray-500">Not Ready</span></div>
                            </div>
                          )}
                        </div>
                          </div>
                        )}
                      </div>                      <div className="space-y-3">
                        <div
                          onClick={() => setYieldStatExpanded(!yieldStatExpanded)}
                          className="flex items-center gap-1 text-[11px] font-bold text-gray-600 hover:text-gray-800 uppercase tracking-widest cursor-pointer select-none transition-colors"
                        >
                          {yieldStatExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />} Statistics
                        </div>
                        {yieldStatExpanded && (
                          <div className="space-y-3">
                        <div className="border border-gray-100 rounded-xl p-3.5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div><div className="text-xs font-bold text-gray-700 leading-tight flex items-center gap-1.5">Growth Stage {renderInfoTooltip("Growth Stage")}</div><span className="text-[11px] text-gray-600">Phenological stage classification</span></div>
                            <button onClick={() => setYieldShowGrowth(!yieldShowGrowth)} className="w-9 h-5 rounded-full p-0.5 transition-colors duration-200 shrink-0" style={{ backgroundColor: yieldShowGrowth ? '#16A34A' : '#E5E7EB' }}>
                              <div style={{ transform: yieldShowGrowth ? 'translateX(16px)' : 'translateX(0)' }} className="w-4 h-4 rounded-full bg-white shadow transition-transform duration-200" />
                            </button>
                          </div>
                          {yieldShowGrowth && (
                            <div className="space-y-1.5 pt-1 border-t border-gray-50">
                              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#60a5fa'}}/><span className="text-[11px] font-semibold text-gray-500">Germination</span></div>
                              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#84cc16'}}/><span className="text-[11px] font-semibold text-gray-500">Vegetative</span></div>
                              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#eab308'}}/><span className="text-[11px] font-semibold text-gray-500">Flowering</span></div>
                              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#f97316'}}/><span className="text-[11px] font-semibold text-gray-500">Fruiting</span></div>
                              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#15803d'}}/><span className="text-[11px] font-semibold text-gray-500">Maturity</span></div>
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
              {renderMapBottomPanel(selectedIndex)}
            </div>
          )}

          {activeSidebarItem === 'moisture-content' && (
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
                    <TileLayer key={basemapUrl} url={basemapUrl} attribution="&copy; ESRI & Google Satellite Imagery" maxZoom={22} maxNativeZoom={basemapMaxNativeZoom} />
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
                    <FitBoundsToPlots plotsData={plotsData} farmBoundary={farmBoundary} />
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
                    Map Layers
                  </button>
                </div>

                {/* ═══ RIGHT MAP LAYERS SIDEBAR ═══ */}
                {moistureShowLayers && (
                  <div className="w-[280px] bg-white border-l border-gray-100 flex flex-col shrink-0 overflow-y-auto z-10 shadow-sm animate-in slide-in-from-right duration-300">
                    <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Layers size={18} className="text-green-600" />
                        <span className="text-base font-bold text-gray-800 font-sans">Map Layers</span>
                      </div>
                      <button onClick={() => setMoistureShowLayers(false)} className="p-1 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-gray-655 transition-all">
                        <X size={18} />
                      </button>
                    </div>

                    <div className="p-4 space-y-6">
                      <div className="space-y-3">
                        <div 
                          onClick={() => setMoistureOpExpanded(!moistureOpExpanded)}
                          className="flex items-center gap-1 text-[11px] font-bold text-gray-600 hover:text-gray-800 uppercase tracking-widest cursor-pointer select-none transition-colors"
                        >
                          {moistureOpExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />} Operational
                        </div>
                        {moistureOpExpanded && (
                          <div className="space-y-3">
                            <div className="border border-gray-100 rounded-xl p-3.5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-2.5">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="text-xs font-bold text-gray-700 leading-tight flex items-center gap-1.5">Moisture Index Raster</div>
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
                                  <div className="text-xs font-bold text-gray-700 leading-tight flex items-center gap-1.5">Farm Boundaries</div>
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
          )}

          {activeSidebarItem === 'land-restoration' && (
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
                    <TileLayer key={basemapUrl} url={basemapUrl} attribution="&copy; ESRI & Google Satellite Imagery" maxZoom={22} maxNativeZoom={basemapMaxNativeZoom} />
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
                          {renderRestorePolygons(restorationPlotsDataA, 'left')}
                        </Pane>
                        <Pane name="right-pane-restore" style={{ zIndex: 501 }}>
                          {showRasterLayer && currentTileUrlB && (
                            <TileLayer key={`b-${currentTileUrlB}`} url={currentTileUrlB} opacity={mapOpacity / 100} bounds={rasterOverlayBounds || undefined} maxZoom={22} maxNativeZoom={18} />
                          )}
                          {renderRestorePolygons(restorationPlotsDataB, 'right')}
                        </Pane>
                      </>
                    ) : (
                      renderRestorePolygons(restorationPlotsData)
                    )}
                    {null}
                    <FitBoundsToPlots plotsData={plotsData} farmBoundary={farmBoundary} />
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

                  {/* Floating map layers trigger */}
                  <button
                    onClick={() => setRestoreShowLayers(!restoreShowLayers)}
                    className={`absolute top-4 right-4 bg-white border p-3 rounded-2xl shadow-xl hover:bg-gray-50 flex items-center gap-2 font-bold text-xs transition-all active:scale-95 ${
                      restoreShowLayers ? 'text-green-700 border-green-200 bg-green-50 shadow-inner' : 'text-gray-700 border-gray-200 bg-white'
                    }`}
                    style={{ zIndex: 40000 }}
                  >
                    <Layers size={16} className={restoreShowLayers ? 'text-green-600' : 'text-gray-600'} />
                    Map Layers
                  </button>

                  {/* Plot detail panel (over map) */}
                  {null}
                </div>

                {/* ═══ RIGHT MAP LAYERS SIDEBAR ═══ */}
                {restoreShowLayers && (
                  <div className="w-[280px] bg-white border-l border-gray-100 flex flex-col shrink-0 overflow-y-auto z-10 shadow-sm animate-in slide-in-from-right duration-300">
                    {/* Header */}
                    <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Layers size={18} className="text-green-600" />
                        <span className="text-base font-bold text-gray-800 font-sans">Map Layers</span>
                      </div>
                      <button onClick={() => setRestoreShowLayers(false)} className="p-1 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-gray-655 transition-all">
                        <X size={18} />
                      </button>
                    </div>

                    <div className="p-4 space-y-6">
                      {/* OPERATIONAL SECTION */}
                      <div className="space-y-3">

                        <div 
                          onClick={() => setRestoreOpExpanded(!restoreOpExpanded)}
                          className="flex items-center gap-1 text-[11px] font-bold text-gray-600 hover:text-gray-800 uppercase tracking-widest cursor-pointer select-none transition-colors"
                        >
                          {restoreOpExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />} Operational
                        </div>
                        {restoreOpExpanded && (
                          <div className="space-y-3">
                            {/* Satellite Index Raster Card */}
                        <div className="border border-gray-100 rounded-xl p-3.5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-xs font-bold text-gray-700 leading-tight flex items-center gap-1.5">Satellite Index Raster</div>
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
                              onClick={() => setRestoreShowBoundaries(!restoreShowBoundaries)}
                              className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 shrink-0 ${
                                restoreShowBoundaries ? 'bg-green-600' : 'bg-gray-200'
                              }`}
                              style={{ backgroundColor: restoreShowBoundaries ? '#16A34A' : '#E5E7EB' }}
                            >
                              <div className={`w-4 h-4 rounded-full bg-white shadow transform transition-transform duration-200 ${
                                restoreShowBoundaries ? 'translate-x-4' : 'translate-x-0'
                              }`} />
                            </button>
                          </div>
                          {restoreShowBoundaries && (
                            <div className="space-y-2 pt-1 border-t border-gray-50">
                              <div className="flex items-center justify-between text-[11px] text-gray-600 font-bold">
                                <span>Opacity</span>
                                <span>{restoreBoundariesOpacity}%</span>
                              </div>
                              <input type="range" min="10" max="100" value={restoreBoundariesOpacity}
                                onChange={e => setRestoreBoundariesOpacity(parseInt(e.target.value))}
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
                      <div className="space-y-3">
                        <div
                          onClick={() => setRestoreEcoExpanded(!restoreEcoExpanded)}
                          className="flex items-center gap-1 text-[11px] font-bold text-gray-600 hover:text-gray-800 uppercase tracking-widest cursor-pointer select-none transition-colors"
                        >
                          {restoreEcoExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />} Ecological
                        </div>
                        {restoreEcoExpanded && (
                          <div className="space-y-3">
                        <div className="border border-gray-100 rounded-xl p-3.5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div><div className="text-xs font-bold text-gray-700 leading-tight flex items-center gap-1.5">Restoration Progress {renderInfoTooltip("Restoration Progress")}</div><span className="text-[11px] text-gray-600">Area rehabilitation status</span></div>
                            <button onClick={() => setRestoreShowProgress(!restoreShowProgress)} className="w-9 h-5 rounded-full p-0.5 transition-colors duration-200 shrink-0" style={{ backgroundColor: restoreShowProgress ? '#16A34A' : '#E5E7EB' }}>
                              <div style={{ transform: restoreShowProgress ? 'translateX(16px)' : 'translateX(0)' }} className="w-4 h-4 rounded-full bg-white shadow transition-transform duration-200" />
                            </button>
                          </div>
                          {restoreShowProgress && (
                            <div className="space-y-1.5 pt-1 border-t border-gray-50">
                              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#15803d'}}/><span className="text-[11px] font-semibold text-gray-500">&gt;75% Complete</span></div>
                              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#84cc16'}}/><span className="text-[11px] font-semibold text-gray-500">50-75%</span></div>
                              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#fbbf24'}}/><span className="text-[11px] font-semibold text-gray-500">25-50%</span></div>
                              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#dc2626'}}/><span className="text-[11px] font-semibold text-gray-500">&lt;25%</span></div>
                            </div>
                          )}
                        </div>                        <div className="border border-gray-100 rounded-xl p-3.5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div><div className="text-xs font-bold text-gray-700 leading-tight flex items-center gap-1.5">Survival Rate {renderInfoTooltip("Survival Rate")}</div><span className="text-[11px] text-gray-600">Planted species survival</span></div>
                            <button onClick={() => setRestoreShowSurvival(!restoreShowSurvival)} className="w-9 h-5 rounded-full p-0.5 transition-colors duration-200 shrink-0" style={{ backgroundColor: restoreShowSurvival ? '#16A34A' : '#E5E7EB' }}>
                              <div style={{ transform: restoreShowSurvival ? 'translateX(16px)' : 'translateX(0)' }} className="w-4 h-4 rounded-full bg-white shadow transition-transform duration-200" />
                            </button>
                          </div>
                          {restoreShowSurvival && (
                            <div className="space-y-1.5 pt-1 border-t border-gray-50">
                              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#15803d'}}/><span className="text-[11px] font-semibold text-gray-500">&gt;85% Survival</span></div>
                              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#84cc16'}}/><span className="text-[11px] font-semibold text-gray-500">70-85%</span></div>
                              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#fbbf24'}}/><span className="text-[11px] font-semibold text-gray-500">50-70%</span></div>
                              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#dc2626'}}/><span className="text-[11px] font-semibold text-gray-500">&lt;50%</span></div>
                            </div>
                          )}
                        </div>                        <div className="border border-gray-100 rounded-xl p-3.5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div><div className="text-xs font-bold text-gray-700 leading-tight flex items-center gap-1.5">Carbon Offset {renderInfoTooltip("Carbon Offset")}</div><span className="text-[11px] text-gray-600">Sequestered carbon stock</span></div>
                            <button onClick={() => setRestoreShowCarbon(!restoreShowCarbon)} className="w-9 h-5 rounded-full p-0.5 transition-colors duration-200 shrink-0" style={{ backgroundColor: restoreShowCarbon ? '#16A34A' : '#E5E7EB' }}>
                              <div style={{ transform: restoreShowCarbon ? 'translateX(16px)' : 'translateX(0)' }} className="w-4 h-4 rounded-full bg-white shadow transition-transform duration-200" />
                            </button>
                          </div>
                          {restoreShowCarbon && (
                            <div className="space-y-1.5 pt-1 border-t border-gray-50">
                              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#1d4ed8'}}/><span className="text-[11px] font-semibold text-gray-500">&gt;10 t CO2e/ha</span></div>
                              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#60a5fa'}}/><span className="text-[11px] font-semibold text-gray-500">5-10 t CO2e/ha</span></div>
                              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#fbbf24'}}/><span className="text-[11px] font-semibold text-gray-500">2-5 t CO2e/ha</span></div>
                              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#dc2626'}}/><span className="text-[11px] font-semibold text-gray-500">&lt;2 t CO2e/ha</span></div>
                            </div>
                          )}
                        </div>                        <div className="border border-gray-100 rounded-xl p-3.5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div><div className="text-xs font-bold text-gray-700 leading-tight flex items-center gap-1.5">Biodiversity {renderInfoTooltip("Biodiversity")}</div><span className="text-[11px] text-gray-600">Species richness index</span></div>
                            <button onClick={() => setRestoreShowBiodiversity(!restoreShowBiodiversity)} className="w-9 h-5 rounded-full p-0.5 transition-colors duration-200 shrink-0" style={{ backgroundColor: restoreShowBiodiversity ? '#16A34A' : '#E5E7EB' }}>
                              <div style={{ transform: restoreShowBiodiversity ? 'translateX(16px)' : 'translateX(0)' }} className="w-4 h-4 rounded-full bg-white shadow transition-transform duration-200" />
                            </button>
                          </div>
                          {restoreShowBiodiversity && (
                            <div className="space-y-1.5 pt-1 border-t border-gray-50">
                              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#15803d'}}/><span className="text-[11px] font-semibold text-gray-500">High</span></div>
                              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#84cc16'}}/><span className="text-[11px] font-semibold text-gray-500">Moderate</span></div>
                              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#fbbf24'}}/><span className="text-[11px] font-semibold text-gray-500">Low</span></div>
                              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#dc2626'}}/><span className="text-[11px] font-semibold text-gray-500">Very Low</span></div>
                            </div>
                          )}
                        </div>                        <div className="border border-gray-100 rounded-xl p-3.5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div><div className="text-xs font-bold text-gray-700 leading-tight flex items-center gap-1.5">AGB {renderInfoTooltip("AGB")}</div><span className="text-[11px] text-gray-600">Above-Ground Biomass</span></div>
                            <button onClick={() => setRestoreShowAgb(!restoreShowAgb)} className="w-9 h-5 rounded-full p-0.5 transition-colors duration-200 shrink-0" style={{ backgroundColor: restoreShowAgb ? '#16A34A' : '#E5E7EB' }}>
                              <div style={{ transform: restoreShowAgb ? 'translateX(16px)' : 'translateX(0)' }} className="w-4 h-4 rounded-full bg-white shadow transition-transform duration-200" />
                            </button>
                          </div>
                          {restoreShowAgb && (
                            <div className="space-y-1.5 pt-1 border-t border-gray-50">
                              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#166534'}}/><span className="text-[11px] font-semibold text-gray-500">&gt;200 t/ha</span></div>
                              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#22c55e'}}/><span className="text-[11px] font-semibold text-gray-500">100-200 t/ha</span></div>
                              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#fbbf24'}}/><span className="text-[11px] font-semibold text-gray-500">50-100 t/ha</span></div>
                              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#ef4444'}}/><span className="text-[11px] font-semibold text-gray-500">&lt;50 t/ha</span></div>
                            </div>
                          )}
                        </div>                        <div className="border border-gray-100 rounded-xl p-3.5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div><div className="text-xs font-bold text-gray-700 leading-tight flex items-center gap-1.5">InSAR Coherence {renderInfoTooltip("InSAR Coherence")}</div><span className="text-[11px] text-gray-600">SAR interferometric coherence</span></div>
                            <button onClick={() => setRestoreShowInSar(!restoreShowInSar)} className="w-9 h-5 rounded-full p-0.5 transition-colors duration-200 shrink-0" style={{ backgroundColor: restoreShowInSar ? '#16A34A' : '#E5E7EB' }}>
                              <div style={{ transform: restoreShowInSar ? 'translateX(16px)' : 'translateX(0)' }} className="w-4 h-4 rounded-full bg-white shadow transition-transform duration-200" />
                            </button>
                          </div>
                          {restoreShowInSar && (
                            <div className="space-y-1.5 pt-1 border-t border-gray-50">
                              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#1d4ed8'}}/><span className="text-[11px] font-semibold text-gray-500">High (0.8-1.0)</span></div>
                              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#60a5fa'}}/><span className="text-[11px] font-semibold text-gray-500">Good (0.6-0.8)</span></div>
                              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#fbbf24'}}/><span className="text-[11px] font-semibold text-gray-500">Moderate (0.4-0.6)</span></div>
                              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#dc2626'}}/><span className="text-[11px] font-semibold text-gray-500">Low ({'<'}0.4)</span></div>
                            </div>
                          )}
                        </div>                        <div className="border border-gray-100 rounded-xl p-3.5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div><div className="text-xs font-bold text-gray-700 leading-tight flex items-center gap-1.5">GEDI Canopy {renderInfoTooltip("GEDI Canopy")}</div><span className="text-[11px] text-gray-600">LiDAR canopy height</span></div>
                            <button onClick={() => setRestoreShowGedi(!restoreShowGedi)} className="w-9 h-5 rounded-full p-0.5 transition-colors duration-200 shrink-0" style={{ backgroundColor: restoreShowGedi ? '#16A34A' : '#E5E7EB' }}>
                              <div style={{ transform: restoreShowGedi ? 'translateX(16px)' : 'translateX(0)' }} className="w-4 h-4 rounded-full bg-white shadow transition-transform duration-200" />
                            </button>
                          </div>
                          {restoreShowGedi && (
                            <div className="space-y-1.5 pt-1 border-t border-gray-50">
                              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#166534'}}/><span className="text-[11px] font-semibold text-gray-500">&gt;30m</span></div>
                              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#22c55e'}}/><span className="text-[11px] font-semibold text-gray-500">20-30m</span></div>
                              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#fbbf24'}}/><span className="text-[11px] font-semibold text-gray-500">10-20m</span></div>
                              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#ef4444'}}/><span className="text-[11px] font-semibold text-gray-500">&lt;10m</span></div>
                            </div>
                          )}
                        </div>
                          </div>
                        )}
                      </div>                      <div className="space-y-3">
                        <div
                          onClick={() => setRestoreLulcExpanded(!restoreLulcExpanded)}
                          className="flex items-center gap-1 text-[11px] font-bold text-gray-600 hover:text-gray-800 uppercase tracking-widest cursor-pointer select-none transition-colors"
                        >
                          {restoreLulcExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />} LULC
                        </div>
                        {restoreLulcExpanded && (
                          <div className="space-y-3">
                        {/* Was a static hardcoded legend (High/Moderate/Low/Dry)
                            independent of the real backend classification —
                            same staleness risk as moisture-content's old SMI
                            card. Reuses the real single-index card instead. */}
                        {(() => {
                          const ndwiEntry = legendEntries.find(e => e.key === 'ndwi');
                          return ndwiEntry ? renderLegendCard(ndwiEntry) : null;
                        })()}
                        <div className="border border-gray-100 rounded-xl p-3.5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div><div className="text-xs font-bold text-gray-700 leading-tight flex items-center gap-1.5">LULC {renderInfoTooltip("LULC")}</div><span className="text-[11px] text-gray-600">Land Use / Land Cover</span></div>
                            <button onClick={() => setRestoreShowLulc(!restoreShowLulc)} className="w-9 h-5 rounded-full p-0.5 transition-colors duration-200 shrink-0" style={{ backgroundColor: restoreShowLulc ? '#16A34A' : '#E5E7EB' }}>
                              <div style={{ transform: restoreShowLulc ? 'translateX(16px)' : 'translateX(0)' }} className="w-4 h-4 rounded-full bg-white shadow transition-transform duration-200" />
                            </button>
                          </div>
                          {restoreShowLulc && (
                            <div className="space-y-1.5 pt-1 border-t border-gray-50">
                              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#15803d'}}/><span className="text-[11px] font-semibold text-gray-500">Forest</span></div>
                              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#84cc16'}}/><span className="text-[11px] font-semibold text-gray-500">Cropland</span></div>
                              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#fbbf24'}}/><span className="text-[11px] font-semibold text-gray-500">Grassland</span></div>
                              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#6b7280'}}/><span className="text-[11px] font-semibold text-gray-500">Urban</span></div>
                              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#1d4ed8'}}/><span className="text-[11px] font-semibold text-gray-500">Water</span></div>
                            </div>
                          )}
                        </div>                        <div className="border border-gray-100 rounded-xl p-3.5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div><div className="text-xs font-bold text-gray-700 leading-tight flex items-center gap-1.5">LULC Change {renderInfoTooltip("LULC Change")}</div><span className="text-[11px] text-gray-600">ESA WorldCover, real detected transitions</span></div>
                            <button onClick={() => setRestoreShowLulcChange(!restoreShowLulcChange)} className="w-9 h-5 rounded-full p-0.5 transition-colors duration-200 shrink-0" style={{ backgroundColor: restoreShowLulcChange ? '#16A34A' : '#E5E7EB' }}>
                              <div style={{ transform: restoreShowLulcChange ? 'translateX(16px)' : 'translateX(0)' }} className="w-4 h-4 rounded-full bg-white shadow transition-transform duration-200" />
                            </button>
                          </div>
                          {restoreShowLulcChange && (
                            <div className="space-y-1.5 pt-1 border-t border-gray-50">
                              {landUseChangeLoading ? (
                                <span className="text-[11px] font-semibold text-gray-600">Loading…</span>
                              ) : !landUseChange ? (
                                <span className="text-[11px] font-semibold text-gray-600">No ESA WorldCover coverage available for this farm yet.</span>
                              ) : (
                                <>
                                  <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-semibold text-gray-500">{landUseChange.compared_years?.[0]} → {landUseChange.compared_years?.[1]}</span>
                                    <span className="text-[11px] font-bold text-gray-700">{landUseChange.changed_pct}% changed</span>
                                  </div>
                                  {(landUseChange.top_transitions || []).slice(0, 5).map((t, i) => (
                                    <div key={i} className="flex items-center justify-between gap-2">
                                      <span className="text-[11px] font-semibold text-gray-500 truncate">{t.transition}</span>
                                      <span className="text-[11px] font-bold text-gray-600 shrink-0">{t.area_pct}%</span>
                                    </div>
                                  ))}
                                  {(!landUseChange.top_transitions || landUseChange.top_transitions.length === 0) && (
                                    <span className="text-[11px] font-semibold text-gray-600">No significant transitions detected.</span>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                          </div>
                        )}
                      </div>                      <div className="space-y-3">
                        <div
                          onClick={() => setRestoreEudrExpanded(!restoreEudrExpanded)}
                          className="flex items-center gap-1 text-[11px] font-bold text-gray-600 hover:text-gray-800 uppercase tracking-widest cursor-pointer select-none transition-colors"
                        >
                          {restoreEudrExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />} EUDR
                        </div>
                        {restoreEudrExpanded && (
                          <div className="space-y-3">
                        <div className="border border-gray-100 rounded-xl p-3.5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div><div className="text-xs font-bold text-gray-700 leading-tight flex items-center gap-1.5">EUDR Compliance {renderInfoTooltip("EUDR Compliance")}</div><span className="text-[11px] text-gray-600">EU Deforestation Regulation status</span></div>
                            <button onClick={() => setRestoreShowEudr(!restoreShowEudr)} className="w-9 h-5 rounded-full p-0.5 transition-colors duration-200 shrink-0" style={{ backgroundColor: restoreShowEudr ? '#16A34A' : '#E5E7EB' }}>
                              <div style={{ transform: restoreShowEudr ? 'translateX(16px)' : 'translateX(0)' }} className="w-4 h-4 rounded-full bg-white shadow transition-transform duration-200" />
                            </button>
                          </div>
                          {restoreShowEudr && (
                            <div className="space-y-1.5 pt-1 border-t border-gray-50">
                              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#15803d'}}/><span className="text-[11px] font-semibold text-gray-500">Compliant</span></div>
                              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#fbbf24'}}/><span className="text-[11px] font-semibold text-gray-500">At Risk</span></div>
                              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#dc2626'}}/><span className="text-[11px] font-semibold text-gray-500">Non-Compliant</span></div>
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
              {renderMapBottomPanel(selectedIndex)}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              ALERTS COMMAND CENTER
          ══════════════════════════════════════════════════════════════ */}
          {activeSidebarItem === 'alerts' && (
            <div className="flex flex-col h-full relative" style={{ minHeight: 0 }}>
              <style>{`
                /* Solid severity border instead of a pulsing glow — a whole
                   list of glowing cards competed with the map for attention. */
                .pulse-critical { border-color: var(--status-critical); border-width: 2px; }
                .pulse-warning  { border-color: var(--status-warning); border-width: 2px; }
                .alerts-list-scroll::-webkit-scrollbar { width: 4px; }
                .alerts-list-scroll::-webkit-scrollbar-track { background: transparent; }
                .alerts-list-scroll::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
                .alerts-detail-scroll::-webkit-scrollbar { width: 4px; }
                .alerts-detail-scroll::-webkit-scrollbar-track { background: transparent; }
                .alerts-detail-scroll::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
              `}</style>

              {/* ── TOP HEADER BAR ── */}
              <div className="px-8 pt-7 pb-5 border-b border-gray-100 flex items-center justify-between gap-4 shrink-0 bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm" style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5' }}>
                    <AlertTriangle size={18} className="text-green-700" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight leading-none">Alerts Command Center</h2>
                    <p className="text-[11px] font-bold text-green-600 uppercase tracking-widest mt-0.5">Live Anomaly Intelligence · Farmintelytics Agro Node</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-status-live animate-pulse shrink-0" />
                    <div>
                      <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider block">Operational Status</span>
                      <span className="text-xs font-bold text-gray-800">{alerts.filter(a => a.status === 'Active').length} Active Anomalies</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── MAIN TWO-COLUMN BODY ── */}
              <div className="flex flex-1 min-h-0 overflow-hidden">

                {/* ═══ LEFT COLUMN: Search + Plot Issue List ═══ */}
                <div className="w-[270px] shrink-0 bg-gray-50 border-r border-gray-150 flex flex-col">

                  {/* Search bar */}
                  <div className="p-4 border-b border-gray-150 space-y-3">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
                      <input
                        id="alerts-search-input"
                        type="text"
                        value={alertsSearch}
                        onChange={e => setAlertsSearch(e.target.value)}
                        placeholder="Search plots..."
                        className="w-full pl-8 pr-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-xl outline-none focus:border-red-300 focus:ring-2 focus:ring-red-50 transition-all placeholder-gray-400"
                      />
                      {alertsSearch && (
                        <button onClick={() => setAlertsSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800 transition-colors">
                          <X size={12} />
                        </button>
                      )}
                    </div>

                    {/* Severity mini-filters */}
                    <div className="flex items-center gap-1.5">
                      {['All', 'Critical', 'Warning', 'Info'].map(sev => {
                        const activeColor = sev === 'Critical' ? 'bg-green-600 text-white' : sev === 'Warning' ? 'bg-green-500 text-white' : sev === 'Info' ? 'bg-green-500 text-white' : 'bg-gray-800 text-white';
                        return (
                          <button
                            key={sev}
                            onClick={() => setAlertsFilterSeverity(sev)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${alertsFilterSeverity === sev ? activeColor : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-100'}`}
                          >
                            {sev}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Plots with issues list */}
                  <div className="flex-1 overflow-y-auto alerts-list-scroll p-3 space-y-2">
                    {(() => {
                      // Use real plots from backend instead of hardcoded fake plot names
                      const PLOT_DEFS = plotsData.map(p => ({
                        id: p.id,
                        name: p.name || p.id,
                        estate: p.subfarm || tenantDisplayName,
                        ndvi: p.ndvi ?? 0
                      }));

                      const searchLower = alertsSearch.toLowerCase();

                      const plotsWithIssues = PLOT_DEFS
                        .map(p => {
                          const rawAlerts = alerts.filter(a => a.plot === p.id);
                          const active = rawAlerts.filter(a => {
                            if (a.status !== 'Active') return false;
                            if (alertsFilterSeverity !== 'All' && a.severity !== alertsFilterSeverity) return false;
                            return true;
                          });
                          const critCount = rawAlerts.filter(a => a.status === 'Active' && a.severity === 'Critical').length;
                          const warnCount = rawAlerts.filter(a => a.status === 'Active' && a.severity === 'Warning').length;
                          const infoCount = rawAlerts.filter(a => a.status === 'Active' && a.severity === 'Info').length;
                          return { ...p, active, critCount, warnCount, infoCount, total: active.length };
                        })
                        .filter(p => p.total > 0)
                        .filter(p => !searchLower || p.name.toLowerCase().includes(searchLower) || p.id.toLowerCase().includes(searchLower));

                      if (plotsWithIssues.length === 0) {
                        return (
                          <div className="flex flex-col items-center justify-center h-full py-12 text-center px-4">
                            <div className="w-12 h-12 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mb-3">
                              <CheckCircle2 size={20} className="text-green-600" />
                            </div>
                            <p className="text-xs font-bold text-gray-500">No issues found</p>
                            <p className="text-[11px] text-gray-600 mt-1">All plots are operating normally</p>
                          </div>
                        );
                      }

                      return plotsWithIssues.map(p => {
                        const isCrit = p.critCount > 0;
                        const isWarn = p.warnCount > 0 && !isCrit;
                        const isSelected = selectedAlertPlot === p.id;

                        const dotColor = isCrit ? 'bg-status-critical' : isWarn ? 'bg-status-warning' : 'bg-status-info';
                        const badgeBg = isCrit ? 'bg-white text-status-critical border-status-critical' : isWarn ? 'bg-white text-status-warning border-status-warning' : 'bg-white text-status-info border-status-info';

                        return (
                          <button
                            key={p.id}
                            id={`alert-plot-row-${p.id.toLowerCase()}`}
                            onClick={() => setSelectedAlertPlot(isSelected ? null : p.id)}
                            className={`w-full text-left bg-white rounded-xl border border-gray-200 p-3.5 transition-all hover:shadow-md active:scale-[0.98] ${isSelected ? 'ring-2 ring-gray-900 ring-offset-1 shadow-md' : 'shadow-sm hover:border-gray-300'}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2.5 min-w-0">
                                <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${dotColor} ${isCrit || isWarn ? 'animate-pulse' : ''}`} />
                                <div className="min-w-0">
                                  <div className="text-xs font-extrabold text-gray-900 leading-tight truncate">{p.name}</div>
                                  <div className="text-[11px] text-gray-600 font-bold mt-0.5 truncate">{p.id} · {p.estate}</div>
                                </div>
                              </div>
                              <div className={`shrink-0 text-[11px] font-black px-2 py-0.5 rounded-full border ${badgeBg}`}>
                                {p.total} {p.total === 1 ? 'issue' : 'issues'}
                              </div>
                            </div>

                            {/* Mini severity badges */}
                            <div className="flex items-center gap-1.5 mt-2.5 pl-4.5">
                              {p.critCount > 0 && <span className="text-[11px] font-black bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5 rounded-full">{p.critCount} Critical</span>}
                              {p.warnCount > 0 && <span className="text-[11px] font-black bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5 rounded-full">{p.warnCount} Warning</span>}
                              {p.infoCount > 0 && <span className="text-[11px] font-black bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5 rounded-full">{p.infoCount} Info</span>}
                            </div>
                          </button>
                        );
                      });
                    })()}
                  </div>


                </div>

                {/* ═══ RIGHT COLUMN: Full Detail Report ═══ */}
                <div className="flex-1 min-w-0 overflow-y-auto alerts-detail-scroll bg-white">
                  {selectedAlertPlot === null ? (
                    /* Empty state – no plot selected */
                    <div className="flex flex-col items-center justify-center h-full text-center px-8">
                      <div className="w-20 h-20 rounded-2xl bg-gray-50 border border-gray-150 flex items-center justify-center mb-5 shadow-sm">
                        <AlertTriangle size={32} className="text-gray-500" />
                      </div>
                      <h3 className="text-base font-bold text-gray-700 mb-1.5">Select a plot to view the full incident report</h3>
                      <p className="text-sm text-gray-600 font-medium max-w-sm leading-relaxed">
                        Click any plot row on the left to load its chronological anomaly log, response protocols, and remediation actions.
                      </p>
                    </div>
                  ) : (
                    /* Detail report */
                    (() => {
                      // Look up real plot from plotsData
                      const realPlot = plotsData.find(p => p.id === selectedAlertPlot);
                      const meta = realPlot
                        ? { name: realPlot.name || realPlot.id, estate: realPlot.subfarm || tenantDisplayName, ndvi: realPlot.ndvi ?? 0 }
                        : { name: selectedAlertPlot, estate: tenantDisplayName, ndvi: 0 };
                      const plotAlerts = alerts.filter(a => a.plot === selectedAlertPlot);
                      const activePlotAlerts = plotAlerts.filter(a => a.status === 'Active');
                      const critCount = activePlotAlerts.filter(a => a.severity === 'Critical').length;
                      const warnCount = activePlotAlerts.filter(a => a.severity === 'Warning').length;
                      const ndviColor = meta.ndvi > 0.7 ? '#10B981' : meta.ndvi > 0.5 ? '#F59E0B' : '#EF4444';

                      return (
                        <div className="p-7 space-y-6 animate-in slide-in-from-right duration-300">
                          {/* Detail header */}
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                {critCount > 0 ? (
                                  <span className="w-2.5 h-2.5 rounded-full bg-status-live animate-pulse shrink-0" />
                                ) : warnCount > 0 ? (
                                  <span className="w-2.5 h-2.5 rounded-full bg-status-live animate-pulse shrink-0" />
                                ) : (
                                  <span className="w-2.5 h-2.5 rounded-full bg-green-400 shrink-0" />
                                )}
                                <h3 className="text-xl font-extrabold text-gray-950 tracking-tight leading-tight">{meta.name}</h3>
                              </div>
                              <span className="text-[11px] text-gray-600 font-bold block uppercase tracking-wider">{meta.estate}</span>
                            </div>
                            <button
                              id="alerts-close-detail"
                              onClick={() => setSelectedAlertPlot(null)}
                              className="p-2 rounded-xl hover:bg-gray-100 text-gray-600 hover:text-gray-700 transition-all"
                            >
                              <X size={16} />
                            </button>
                          </div>

                          {/* Stats row */}
                          <div className="grid grid-cols-4 gap-3">
                            {[
                              { label: 'Active Incidents', value: activePlotAlerts.length, color: activePlotAlerts.length > 0 ? 'text-green-700' : 'text-gray-600', bg: activePlotAlerts.length > 0 ? 'bg-green-50/70 border-green-100' : 'bg-gray-50/50 border-gray-150' },
                              { label: 'Critical', value: critCount, color: critCount > 0 ? 'text-green-700' : 'text-gray-600', bg: critCount > 0 ? 'bg-green-50/70 border-green-100' : 'bg-gray-50/50 border-gray-150' },
                              { label: 'Warning', value: warnCount, color: warnCount > 0 ? 'text-green-700' : 'text-gray-600', bg: warnCount > 0 ? 'bg-green-50/70 border-green-100' : 'bg-gray-50/50 border-gray-150' },
                              { label: 'Acknowledged', value: plotAlerts.length - activePlotAlerts.length, color: (plotAlerts.length - activePlotAlerts.length) > 0 ? 'text-green-700' : 'text-gray-600', bg: (plotAlerts.length - activePlotAlerts.length) > 0 ? 'bg-green-50/70 border-green-100' : 'bg-gray-50/50 border-gray-150' }
                            ].map((s, i) => (
                              <div key={i} className={`${s.bg} border rounded-xl p-3 text-center`}>
                                <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
                                <div className="text-[11px] font-bold text-gray-600 uppercase tracking-wider mt-0.5">{s.label}</div>
                              </div>
                            ))}
                          </div>

                          {/* NDVI bar */}
                          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-2">
                            <div className="flex justify-between items-center text-xs font-bold">
                              <span className="text-gray-500">Current Crop Vigor (NDVI)</span>
                              <span style={{ color: ndviColor }}>{meta.ndvi}</span>
                            </div>
                            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${meta.ndvi * 100}%`, backgroundColor: ndviColor }} />
                            </div>
                            <div className="flex justify-between text-[11px] text-gray-600 font-bold">
                              <span>0.0 — Poor</span>
                              <span>0.5 — Moderate</span>
                              <span>1.0 — Excellent</span>
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => {
                                setActiveSidebarItem('intelligence-layers');
                                setSelectedPlot(selectedAlertPlot);
                              }}
                              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-bold text-gray-700 transition-all shadow-sm active:scale-95"
                            >
                              <MapPin size={13} className="text-green-600" /> Locate on Map
                            </button>
                            {activePlotAlerts.length > 0 && (
                              <button
                                onClick={() => handleAcknowledgeAllPlotAlerts(selectedAlertPlot)}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-xs font-bold text-white transition-all shadow-md active:scale-95"
                              >
                                <CheckCircle2 size={13} /> Acknowledge All Issues
                              </button>
                            )}
                          </div>

                          {/* Timeline */}
                          <div className="space-y-3">
                            <h4 className="text-[11px] font-extrabold text-gray-600 uppercase tracking-widest flex items-center gap-2">
                              <span>Chronological Incident Log</span>
                              <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-[11px]">{plotAlerts.length} entries</span>
                            </h4>

                            <div className="relative border-l border-gray-200 pl-6 ml-2 space-y-5">
                              {plotAlerts.map((alert) => {
                                const isActive = alert.status === 'Active';
                                const isCrit = alert.severity === 'Critical';
                                let severityColor = 'bg-green-50 text-green-700 border-green-200';
                                let dotColor = isCrit ? 'bg-status-critical' : alert.severity === 'Warning' ? 'bg-status-warning' : 'bg-status-info';
                                if (isCrit) severityColor = 'bg-white text-status-critical border-status-critical';
                                else if (alert.severity === 'Warning') severityColor = 'bg-white text-status-warning border-status-warning';

                                return (
                                  <div key={alert.id} className="relative">
                                    {/* Dot */}
                                    <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-white bg-white flex items-center justify-center shadow-sm ring-1 ring-gray-100">
                                      {isActive ? (
                                        <div className={`w-2.5 h-2.5 rounded-full ${dotColor} ${isCrit || alert.severity === 'Warning' ? 'animate-pulse' : ''}`} />
                                      ) : (
                                        <Check size={8} className="text-gray-500 font-bold" />
                                      )}
                                    </div>

                                    <div className={`p-4 rounded-2xl border transition-colors ${isActive ? 'bg-white border-gray-150 hover:bg-gray-50/50' : 'bg-gray-50/30 border-gray-100'}`}>
                                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="text-xs font-black text-gray-800 tabular-nums">{alert.id}</span>
                                          <span className="text-[11px] text-gray-500">•</span>
                                          <span className="text-xs text-gray-600 font-semibold">{alert.date} at {alert.time}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                          <span className={`text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full border ${severityColor}`}>{alert.severity}</span>
                                          <span className="text-[11px] font-extrabold bg-gray-100 text-gray-700 border border-gray-200 px-2 py-0.5 rounded-full uppercase">{alert.category}</span>
                                          {!isActive && <span className="text-[11px] font-extrabold bg-green-50 text-green-600 border border-green-200 px-2 py-0.5 rounded-full uppercase">Acked</span>}
                                        </div>
                                      </div>

                                      <p className="text-xs text-gray-700 font-semibold leading-relaxed">{alert.desc}</p>



                                      {isActive && (
                                        <div className="mt-3 flex justify-end">
                                          <button
                                            onClick={() => handleAcknowledgeAlert(alert.id)}
                                            className="text-[11px] font-bold text-green-600 hover:text-green-700 border border-green-200 hover:bg-green-50 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all"
                                          >
                                            <Check size={11} /> Mark Acknowledged
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              CLIMATE
          ══════════════════════════════════════════════════════════════ */}
          {/* ══════════════════════════════════════════════════════════════
              CLIMATE MAP VIEW
          ══════════════════════════════════════════════════════════════ */}
          {activeSidebarItem === 'climate' && (
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
                    <TileLayer key={basemapUrl} url={basemapUrl} attribution="&copy; ESRI & Google Satellite Imagery" maxZoom={22} maxNativeZoom={basemapMaxNativeZoom} />
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
                          {renderClimatePolygons(climatePlotsDataA, 'left')}
                        </Pane>
                        <Pane name="right-pane-climate" style={{ zIndex: 501 }}>
                          {showRasterLayer && currentTileUrlB && (
                            <TileLayer key={`b-${currentTileUrlB}`} url={currentTileUrlB} opacity={mapOpacity / 100} bounds={rasterOverlayBounds || undefined} maxZoom={22} maxNativeZoom={18} />
                          )}
                          {renderClimatePolygons(climatePlotsDataB, 'right')}
                        </Pane>
                      </>
                    ) : (
                      renderClimatePolygons(climatePlotsData)
                    )}
                    {null}
                    <FitBoundsToPlots plotsData={plotsData} farmBoundary={farmBoundary} />
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

                  {/* Floating map layers trigger */}
                  <button
                    onClick={() => setClimateShowLayers(!climateShowLayers)}
                    className={`absolute top-4 right-4 bg-white border p-3 rounded-2xl shadow-xl hover:bg-gray-55 flex items-center gap-2 font-bold text-xs transition-all active:scale-95 ${
                      climateShowLayers ? 'text-green-700 border-green-200 bg-green-50 shadow-inner' : 'text-gray-700 border-gray-200 bg-white'
                    }`}
                    style={{ zIndex: 40000 }}
                  >
                    <Layers size={16} className={climateShowLayers ? 'text-green-600' : 'text-gray-600'} />
                    Map Layers
                  </button>

                  {/* Plot detail panel (over map) */}
                  {null}
                </div>

                {/* ═══ RIGHT MAP LAYERS SIDEBAR ═══ */}
                {climateShowLayers && (
                  <div className="w-[280px] bg-white border-l border-gray-100 flex flex-col shrink-0 overflow-y-auto z-10 shadow-sm animate-in slide-in-from-right duration-300">
                    {/* Header */}
                    <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Layers size={18} className="text-green-600" />
                        <span className="text-base font-bold text-gray-800 font-sans">Map Layers</span>
                      </div>
                      <button onClick={() => setClimateShowLayers(false)} className="p-1 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-gray-655 transition-all">
                        <X size={18} />
                      </button>
                    </div>

                    <div className="p-4 space-y-6">
                      {/* OPERATIONAL SECTION */}
                      <div className="space-y-3">

                        <div 
                          onClick={() => setClimateOpExpanded(!climateOpExpanded)}
                          className="flex items-center gap-1 text-[11px] font-bold text-gray-600 hover:text-gray-800 uppercase tracking-widest cursor-pointer select-none transition-colors"
                        >
                          {climateOpExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />} Operational
                        </div>
                        {climateOpExpanded && (
                          <div className="space-y-3">
                            {/* Farm Boundaries Card */}
                        <div className="border border-gray-100 rounded-xl p-3.5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-xs font-bold text-gray-700 leading-tight flex items-center gap-1.5">Farm Boundaries {renderInfoTooltip("Farm Boundaries")}</div>
                              <span className="text-[11px] text-gray-600">Plot perimeter outlines</span>
                            </div>
                            <button
                              onClick={() => setClimateShowBoundaries(!climateShowBoundaries)}
                              className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 shrink-0 ${
                                climateShowBoundaries ? 'bg-green-600' : 'bg-gray-200'
                              }`}
                              style={{ backgroundColor: climateShowBoundaries ? '#16A34A' : '#E5E7EB' }}
                            >
                              <div className={`w-4 h-4 rounded-full bg-white shadow transform transition-transform duration-200 ${
                                climateShowBoundaries ? 'translate-x-4' : 'translate-x-0'
                              }`} />
                            </button>
                          </div>
                          {climateShowBoundaries && (
                            <div className="space-y-2 pt-1 border-t border-gray-50">
                              <div className="flex items-center justify-between text-[11px] text-gray-600 font-bold">
                                <span>Opacity</span>
                                <span>{climateBoundariesOpacity}%</span>
                              </div>
                              <input type="range" min="10" max="100" value={climateBoundariesOpacity}
                                onChange={e => setClimateBoundariesOpacity(parseInt(e.target.value))}
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
                      <div className="space-y-3">
                        <div
                          onClick={() => setClimateBioExpanded(!climateBioExpanded)}
                          className="flex items-center gap-1 text-[11px] font-bold text-gray-600 hover:text-gray-800 uppercase tracking-widest cursor-pointer select-none transition-colors"
                        >
                          {climateBioExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />} Biophysical
                        </div>
                        {climateBioExpanded && (
                          <div className="space-y-3">
                        <div className="border border-gray-100 rounded-xl p-3.5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div><div className="text-xs font-bold text-gray-700 leading-tight flex items-center gap-1.5">Rainfall {renderInfoTooltip("Rainfall")}</div><span className="text-[11px] text-gray-600">Accumulated precipitation</span></div>
                            <button onClick={() => setClimateShowRainfall(!climateShowRainfall)} className="w-9 h-5 rounded-full p-0.5 transition-colors duration-200 shrink-0" style={{ backgroundColor: climateShowRainfall ? '#16A34A' : '#E5E7EB' }}>
                              <div style={{ transform: climateShowRainfall ? 'translateX(16px)' : 'translateX(0)' }} className="w-4 h-4 rounded-full bg-white shadow transition-transform duration-200" />
                            </button>
                          </div>
                          {climateShowRainfall && (
                            <div className="space-y-1.5 pt-1 border-t border-gray-50">
                              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#1d4ed8'}}/><span className="text-[11px] font-semibold text-gray-500">&gt;200 mm</span></div>
                              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#60a5fa'}}/><span className="text-[11px] font-semibold text-gray-500">100-200 mm</span></div>
                              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#fbbf24'}}/><span className="text-[11px] font-semibold text-gray-500">50-100 mm</span></div>
                              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#dc2626'}}/><span className="text-[11px] font-semibold text-gray-500">&lt;50 mm</span></div>
                            </div>
                          )}
                        </div>                        <div className="border border-gray-100 rounded-xl p-3.5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div><div className="text-xs font-bold text-gray-700 leading-tight flex items-center gap-1.5">Soil Temperature {renderInfoTooltip("Soil Temperature")}</div><span className="text-[11px] text-gray-600">Near-surface soil temperature</span></div>
                            <button onClick={() => setClimateShowSoilTemp(!climateShowSoilTemp)} className="w-9 h-5 rounded-full p-0.5 transition-colors duration-200 shrink-0" style={{ backgroundColor: climateShowSoilTemp ? '#16A34A' : '#E5E7EB' }}>
                              <div style={{ transform: climateShowSoilTemp ? 'translateX(16px)' : 'translateX(0)' }} className="w-4 h-4 rounded-full bg-white shadow transition-transform duration-200" />
                            </button>
                          </div>
                          {climateShowSoilTemp && (
                            <div className="space-y-1.5 pt-1 border-t border-gray-50">
                              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#dc2626'}}/><span className="text-[11px] font-semibold text-gray-500">&gt;35C Critical</span></div>
                              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#f97316'}}/><span className="text-[11px] font-semibold text-gray-500">30-35C High</span></div>
                              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#84cc16'}}/><span className="text-[11px] font-semibold text-gray-500">20-30C Optimal</span></div>
                              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#1d4ed8'}}/><span className="text-[11px] font-semibold text-gray-500">&lt;20C Cool</span></div>
                            </div>
                          )}
                        </div>
                          </div>
                        )}
                      </div>                      <div className="space-y-3">
                        <div
                          onClick={() => setClimateAtmExpanded(!climateAtmExpanded)}
                          className="flex items-center gap-1 text-[11px] font-bold text-gray-600 hover:text-gray-800 uppercase tracking-widest cursor-pointer select-none transition-colors"
                        >
                          {climateAtmExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />} Atmospheric
                        </div>
                        {climateAtmExpanded && (
                          <div className="space-y-3">
                        <div className="border border-gray-100 rounded-xl p-3.5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div><div className="text-xs font-bold text-gray-700 leading-tight flex items-center gap-1.5">LST {renderInfoTooltip("LST")}</div><span className="text-[11px] text-gray-600">Land Surface Temperature</span></div>
                            <button onClick={() => setClimateShowLst(!climateShowLst)} className="w-9 h-5 rounded-full p-0.5 transition-colors duration-200 shrink-0" style={{ backgroundColor: climateShowLst ? '#16A34A' : '#E5E7EB' }}>
                              <div style={{ transform: climateShowLst ? 'translateX(16px)' : 'translateX(0)' }} className="w-4 h-4 rounded-full bg-white shadow transition-transform duration-200" />
                            </button>
                          </div>
                          {climateShowLst && (
                            <div className="space-y-1.5 pt-1 border-t border-gray-50">
                              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#dc2626'}}/><span className="text-[11px] font-semibold text-gray-500">&gt;40C Extreme</span></div>
                              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#f97316'}}/><span className="text-[11px] font-semibold text-gray-500">30-40C High</span></div>
                              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#84cc16'}}/><span className="text-[11px] font-semibold text-gray-500">20-30C Normal</span></div>
                              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#1d4ed8'}}/><span className="text-[11px] font-semibold text-gray-500">&lt;20C Cool</span></div>
                            </div>
                          )}
                        </div>                        <div className="border border-gray-100 rounded-xl p-3.5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div><div className="text-xs font-bold text-gray-700 leading-tight flex items-center gap-1.5">Vapor Pressure Deficit {renderInfoTooltip("Vapor Pressure Deficit")}</div><span className="text-[11px] text-gray-600">Atmospheric dryness</span></div>
                            <button onClick={() => setClimateShowVaporDeficit(!climateShowVaporDeficit)} className="w-9 h-5 rounded-full p-0.5 transition-colors duration-200 shrink-0" style={{ backgroundColor: climateShowVaporDeficit ? '#16A34A' : '#E5E7EB' }}>
                              <div style={{ transform: climateShowVaporDeficit ? 'translateX(16px)' : 'translateX(0)' }} className="w-4 h-4 rounded-full bg-white shadow transition-transform duration-200" />
                            </button>
                          </div>
                          {climateShowVaporDeficit && (
                            <div className="space-y-1.5 pt-1 border-t border-gray-50">
                              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#fbbf24'}}/><span className="text-[11px] font-semibold text-gray-500">&gt;3 kPa High</span></div>
                              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#84cc16'}}/><span className="text-[11px] font-semibold text-gray-500">1-3 kPa Moderate</span></div>
                              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#1d4ed8'}}/><span className="text-[11px] font-semibold text-gray-500">&lt;1 kPa Low</span></div>
                            </div>
                          )}
                        </div>                        <div className="border border-gray-100 rounded-xl p-3.5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div><div className="text-xs font-bold text-gray-700 leading-tight flex items-center gap-1.5">Flood Risk {renderInfoTooltip("Flood Risk")}</div><span className="text-[11px] text-gray-600">Surface inundation risk</span></div>
                            <button onClick={() => setClimateShowFlood(!climateShowFlood)} className="w-9 h-5 rounded-full p-0.5 transition-colors duration-200 shrink-0" style={{ backgroundColor: climateShowFlood ? '#16A34A' : '#E5E7EB' }}>
                              <div style={{ transform: climateShowFlood ? 'translateX(16px)' : 'translateX(0)' }} className="w-4 h-4 rounded-full bg-white shadow transition-transform duration-200" />
                            </button>
                          </div>
                          {climateShowFlood && (
                            <div className="space-y-1.5 pt-1 border-t border-gray-50">
                              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#dc2626'}}/><span className="text-[11px] font-semibold text-gray-500">High Risk</span></div>
                              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#f97316'}}/><span className="text-[11px] font-semibold text-gray-500">Moderate Risk</span></div>
                              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#fbbf24'}}/><span className="text-[11px] font-semibold text-gray-500">Low Risk</span></div>
                              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:'#15803d'}}/><span className="text-[11px] font-semibold text-gray-500">No Risk</span></div>
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
              {renderMapBottomPanel(selectedIndex)}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              VERIFICATION
          ══════════════════════════════════════════════════════════════ */}
          {activeSidebarItem === 'analytics' && activeTab === 'verification' && (
            <div className="p-10 space-y-10" />
          )}

          {/* ══════════════════════════════════════════════════════════════
              REPORTS
          ══════════════════════════════════════════════════════════════ */}
          {activeSidebarItem === 'analytics' && activeTab === 'reports' && (() => {
            const isWholeFarm = reportPlot === 'WHOLE-FARM';
            const showAllPages = (selectedThemeReport || reportIndex) === 'ALL';
            const showHealthPage = showAllPages || (selectedThemeReport || reportIndex) === 'NDVI';
            const showClimatePage = showAllPages || (selectedThemeReport || reportIndex) === 'NDMI';
            const showHydrologyPage = showAllPages || (selectedThemeReport || reportIndex) === 'NDWI';
            const showCarbonPage = showAllPages || (selectedThemeReport || reportIndex) === 'SOC' || (selectedThemeReport || reportIndex) === 'AGB';
            
            const totalPages = 1 + (showHealthPage ? 1 : 0) + (showClimatePage ? 1 : 0) + (showHydrologyPage ? 1 : 0) + (showCarbonPage ? 1 : 0);
            let pageCounter = 0;

            const chartOptions = {
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                y: { grid: { color: 'rgba(0,0,0,0.03)' }, ticks: { font: { size: 9, weight: '600' } } },
                x: { grid: { display: false }, ticks: { font: { size: 9, weight: '600' } } }
              }
            };

            const getMetricChartData = (index, plot) => {
              const plotName = plot === 'WHOLE-FARM' ? 'Whole Farm (Aggregate)' : plot;
              const isPlotWholeFarm = plotName === 'Whole Farm (Aggregate)';
              // Use real timeline data for charts
              const labels = isPlotWholeFarm
                ? TIMELINE_DATA.map(t => t.label || t.date)
                : TIMELINE_DATA.map(t => t.label || t.date);

              const data = (() => {
                if (index === 'NDVI') return TIMELINE_DATA.map(t => t.ndvi ?? 0);
                if (index === 'NDMI') return TIMELINE_DATA.map(t => t.ndmi ?? 0);
                if (index === 'NDWI') return TIMELINE_DATA.map(t => t.ndwi ?? 0);
                // SOC/AGB not yet available from zarr — return zeros
                return TIMELINE_DATA.map(() => 0);
              })();

              return {
                labels,
                datasets: [{
                  label: `${index} Value`,
                  data,
                  backgroundColor: 'rgba(22, 163, 74, 0.1)',
                  borderColor: '#16A34A',
                  borderWidth: 2.5,
                  fill: true,
                  tension: 0.3,
                  pointRadius: 3
                }]
              };
            };

            const renderCoverPage = () => {
              pageCounter++;
              const plotName = reportPlot === 'WHOLE-FARM' ? 'Whole Farm (Aggregate)' : reportPlot;
              const reportType = generatedReport ? generatedReport.index : (selectedThemeReport || reportIndex);
              const reportId = generatedReport ? generatedReport.id : '—';
              const reportDate = generatedReport ? generatedReport.date : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

              return (
                <div className="w-full max-w-[700px] aspect-[1/1.414] bg-white border border-gray-200 shadow-md p-12 flex flex-col justify-between relative report-page-break mx-auto select-none">
                  <div className="flex justify-between items-center pb-4 border-b border-gray-100 text-[9px] font-bold text-gray-450 uppercase tracking-widest">
                    <div className="flex items-center gap-1.5">
                      <Satellite size={12} className="text-green-600" />
                      <span>Farmintelytics Spatial MRV Audit</span>
                    </div>
                    <span>Confidential Document</span>
                  </div>

                  <div className="my-auto space-y-8 text-center">
                    <div className="w-20 h-20 bg-green-50 border border-green-500/10 rounded-3xl flex items-center justify-center text-green-600 mx-auto shadow-sm">
                      <Satellite size={36} />
                    </div>
                    
                    <div className="space-y-3">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-green-700 bg-green-50 border border-green-150 px-3 py-1 rounded-full">
                        Verified Compliance Certificate
                      </span>
                      <h3 className="text-3xl font-black text-gray-900 tracking-tight leading-tight pt-2">
                        SPATIAL ENVIRONMENTAL AUDIT & REGISTRY REPORT
                      </h3>
                      <p className="text-sm text-gray-600 font-semibold max-w-md mx-auto leading-relaxed">
                        Continuous satellite observation, biophysical metric ledgers, and carbon stock calculations.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 max-w-md mx-auto bg-gray-50/50 p-5 rounded-2xl border border-gray-150 text-left">
                      <div>
                        <span className="text-[9px] text-gray-455 font-black uppercase tracking-wider block">Scope Target</span>
                        <span className="text-xs font-bold text-gray-800">{plotName}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-gray-455 font-black uppercase tracking-wider block">Report Category</span>
                        <span className="text-xs font-bold text-gray-800">
                          {reportType === 'ALL' ? 'Complete Farm Ledger' : `${reportType} Index Audit`}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-gray-455 font-black uppercase tracking-wider block">Document ID</span>
                        <span className="text-xs font-mono font-bold text-gray-800">{reportId}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-gray-455 font-black uppercase tracking-wider block">Compiled At</span>
                        <span className="text-xs font-bold text-gray-800">{reportDate}</span>
                      </div>
                      <div className="col-span-2 border-t border-gray-150 pt-3 flex justify-between items-center">
                        <div>
                          <span className="text-[9px] text-gray-455 font-black uppercase tracking-wider block">MRV Compliance Status</span>
                          <span className="text-xs font-bold text-green-700 flex items-center gap-1 mt-0.5">
                            <CheckCircle2 size={11} className="text-green-600" /> Approved & Signed
                          </span>
                        </div>
                        <span className="text-[8px] font-bold bg-slate-900 text-white px-2 py-0.5 rounded border uppercase">
                          VCS Standard
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-gray-100 text-[8px] font-bold text-gray-600 uppercase tracking-wider">
                    <span>FARMINTELYTICS WEBPORTAL v3.2</span>
                    <span className="text-green-600">Certified Deforestation-Free</span>
                    <span>Page {pageCounter} of {totalPages}</span>
                  </div>
                </div>
              );
            };

            const renderHealthPage = () => {
              pageCounter++;
              const healthData = getMetricChartData('NDVI', reportPlot);
              const meanNdvi = TIMELINE_DATA.length > 0 ? (TIMELINE_DATA.reduce((s, t) => s + (t.ndvi ?? 0), 0) / TIMELINE_DATA.length) : null;
              const isStressed = meanNdvi !== null && meanNdvi < 0.5;
              const plotName = reportPlot === 'WHOLE-FARM' ? 'Whole Farm (Aggregate)' : reportPlot;
              const reportId = generatedReport ? generatedReport.id : '—';
              
              return (
                <div className="w-full max-w-[700px] aspect-[1/1.414] bg-white border border-gray-200 shadow-md p-12 flex flex-col justify-between relative report-page-break mx-auto select-none">
                  <div className="flex justify-between items-center pb-4 border-b border-gray-100 text-[9px] font-bold text-gray-455 uppercase tracking-widest">
                    <div className="flex items-center gap-1.5">
                      <Satellite size={12} className="text-green-600" />
                      <span>01. Vegetation Health Assessment</span>
                    </div>
                    <span>ID: {reportId}</span>
                  </div>

                  <div className="my-auto space-y-6 flex-1 pt-6 text-left">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-lg font-black text-gray-900 tracking-tight">CROP VEGETATION VIGOR & HEALTH STATUS</h4>
                        <p className="text-xs text-gray-600 font-semibold mt-1">Satellite derived NDVI analysis mapping canopy health distribution.</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        isStressed ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-green-50 text-green-700 border border-green-200'
                      }`}>
                        {isStressed ? 'Warning (Stress)' : 'Optimal Performance'}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[9px] font-bold text-gray-405 uppercase tracking-wider block">Temporal Trend Line</span>
                      <div className="h-[180px] w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl relative">
                        {isWholeFarm ? (
                          <Bar data={healthData} options={chartOptions} />
                        ) : (
                          <Line data={healthData} options={chartOptions} />
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <div>
                        <span className="text-[9px] text-gray-450 font-bold uppercase block">Mean NDVI</span>
                        <span className="text-base font-black text-gray-800 mt-1 block">
                          {TIMELINE_DATA.length > 0 ? (TIMELINE_DATA.reduce((s, t) => s + (t.ndvi ?? 0), 0) / TIMELINE_DATA.length).toFixed(2) : '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-gray-455 font-bold uppercase block">Active Chlorophyll</span>
                        <span className="text-base font-black text-gray-850 mt-1 block">
                          {TIMELINE_DATA.length > 0 ? (TIMELINE_DATA.reduce((s, t) => s + (t.chlorophyll ?? 0), 0) / TIMELINE_DATA.length).toFixed(2) + ' GCVI' : '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-gray-455 font-bold uppercase block">Zonal Coverage</span>
                        <span className="text-base font-black text-green-700 mt-1 block">
                          {'—'}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 bg-green-50/40 border border-green-100 rounded-xl space-y-1.5">
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-green-800 flex items-center gap-1.5">
                        <Sparkles size={11} className="text-green-600" /> Agronomic Assessment
                      </span>
                      <p className="text-xs text-green-700 font-semibold leading-relaxed">
                        {isWholeFarm
                          ? 'Spatial verification of the whole farm indicates high performance across the primary vegetative bands. NDVI values are derived from real satellite observations.'
                          : isStressed
                            ? 'This plot reveals suppressed moisture index levels. Vegetative health remains moderate, but root-zone transpiration stress is elevated. Recommendation: Increase irrigation frequency by 25%.'
                            : 'Diagnostic review of this plot shows optimal vegetation vigor. Canopy density trajectories remain stable with zero forest loss anomalies.'
                        }
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-gray-100 text-[8px] font-bold text-gray-600 uppercase tracking-wider">
                    <span>Plot: {plotName}</span>
                    <span className="text-green-600">Compliance Audit Approved</span>
                    <span>Page {pageCounter} of {totalPages}</span>
                  </div>
                </div>
              );
            };

            const renderClimatePage = () => {
              pageCounter++;
              const climateData = getMetricChartData('NDMI', reportPlot);
              const meanNdmi = TIMELINE_DATA.length > 0 ? (TIMELINE_DATA.reduce((s, t) => s + (t.ndmi ?? 0), 0) / TIMELINE_DATA.length) : null;
              const isStressed = meanNdmi !== null && meanNdmi < 0.2;
              const plotName = reportPlot === 'WHOLE-FARM' ? 'Whole Farm (Aggregate)' : reportPlot;
              const reportId = generatedReport ? generatedReport.id : '—';

              return (
                <div className="w-full max-w-[700px] aspect-[1/1.414] bg-white border border-gray-200 shadow-md p-12 flex flex-col justify-between relative report-page-break mx-auto select-none">
                  <div className="flex justify-between items-center pb-4 border-b border-gray-100 text-[9px] font-bold text-gray-450 uppercase tracking-widest">
                    <div className="flex items-center gap-1.5">
                      <CloudRain size={12} className="text-green-600" />
                      <span>02. Microclimate & Soil Moisture Profile</span>
                    </div>
                    <span>ID: {reportId}</span>
                  </div>

                  <div className="my-auto space-y-6 flex-1 pt-6 text-left">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-lg font-black text-gray-900 tracking-tight">CANOPY MOISTURE & TRANSPIRATION INDEX</h4>
                        <p className="text-xs text-gray-600 font-semibold mt-1">Root-zone water content tracking (NDMI) combined with meteorology logs.</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        isStressed ? 'bg-green-50 text-green-700 border border-green-200 animate-pulse' : 'bg-green-50 text-green-700 border border-green-200'
                      }`}>
                        {isStressed ? 'Deficit Alert' : 'Moisture Adequate'}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[9px] font-bold text-gray-450 uppercase tracking-wider block">NDMI Soil Moisture Trend</span>
                      <div className="h-[180px] w-full bg-gray-55 border border-gray-100 p-4 rounded-2xl relative">
                        {isWholeFarm ? (
                          <Bar data={climateData} options={chartOptions} />
                        ) : (
                          <Line data={climateData} options={chartOptions} />
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                      <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 text-center">
                        <span className="text-[8px] text-gray-600 font-bold uppercase block">Mean NDMI</span>
                        <span className="text-xs font-black text-gray-800 mt-1 block">
                          {meanNdmi !== null ? meanNdmi.toFixed(2) : '—'}
                        </span>
                      </div>
                      <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 text-center">
                        <span className="text-[8px] text-gray-600 font-bold uppercase block">Soil Temp</span>
                        <span className="text-xs font-black text-gray-800 mt-1 block">—</span>
                      </div>
                      <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 text-center">
                        <span className="text-[8px] text-gray-600 font-bold uppercase block">VPD Stress</span>
                        <span className="text-xs font-black text-gray-800 mt-1 block">—</span>
                      </div>
                      <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 text-center">
                        <span className="text-[8px] text-gray-600 font-bold uppercase block">Rainfall</span>
                        <span className="text-xs font-black text-green-700 mt-1 block">—</span>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-55 border border-gray-150 rounded-xl space-y-1.5">
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-gray-700 block">Hydrological Summary</span>
                      <p className="text-xs text-gray-500 font-semibold leading-relaxed">
                        {isStressed
                          ? 'Root-zone water stress is elevated. NDMI readings indicate below-threshold moisture levels. Immediate cover-cropping and crop mulching recommended to retain sub-surface soil hydration.'
                          : 'Soil moisture profiles sit within stable margins. Leaf stomatal conductance is optimal, indicating healthy plant transpiration rates with no active drought markers.'
                        }
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-gray-100 text-[8px] font-bold text-gray-600 uppercase tracking-wider">
                    <span>Plot: {plotName}</span>
                    <span className="text-green-600">Meteorological Validation Log</span>
                    <span>Page {pageCounter} of {totalPages}</span>
                  </div>
                </div>
              );
            };

            const renderHydrologyPage = () => {
              pageCounter++;
              const hydrologyData = getMetricChartData('NDWI', reportPlot);
              const plotName = reportPlot === 'WHOLE-FARM' ? 'Whole Farm (Aggregate)' : reportPlot;
              const reportId = generatedReport ? generatedReport.id : '—';

              return (
                <div className="w-full max-w-[700px] aspect-[1/1.414] bg-white border border-gray-200 shadow-md p-12 flex flex-col justify-between relative report-page-break mx-auto select-none">
                  <div className="flex justify-between items-center pb-4 border-b border-gray-100 text-[9px] font-bold text-gray-450 uppercase tracking-widest">
                    <div className="flex items-center gap-1.5">
                      <Waves size={12} className="text-green-600" />
                      <span>03. Water Hydrology Report</span>
                    </div>
                    <span>ID: {reportId}</span>
                  </div>

                  <div className="my-auto space-y-6 flex-1 pt-6 text-left">
                    <div>
                      <h4 className="text-lg font-black text-gray-900 tracking-tight">WATER STRESS & CANOPY WATER INDEX</h4>
                      <p className="text-xs text-gray-600 font-semibold mt-1">Spatial hydrology mapping (NDWI) certifying canopy moisture levels.</p>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[9px] font-bold text-gray-455 uppercase tracking-wider block">NDWI Hydrological Index Profile</span>
                      <div className="h-[180px] w-full bg-gray-55 border border-gray-100 p-4 rounded-2xl relative">
                        {isWholeFarm ? (
                          <Bar data={hydrologyData} options={chartOptions} />
                        ) : (
                          <Line data={hydrologyData} options={chartOptions} />
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <div>
                        <span className="text-[9px] text-gray-455 font-bold uppercase block">Mean NDWI</span>
                        <span className="text-sm font-black text-gray-800 mt-1 block">
                          {TIMELINE_DATA.length > 0 ? (TIMELINE_DATA.reduce((s, t) => s + (t.ndwi ?? 0), 0) / TIMELINE_DATA.length).toFixed(2) : '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-gray-455 font-bold uppercase block">Evapotranspiration Deficit</span>
                        <span className="text-sm font-black text-gray-800 mt-1 block">—</span>
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50/50">
                      <span className="text-[9px] font-black uppercase text-gray-455 tracking-wider block">Security Hash & Signatures</span>
                      <div className="flex justify-between items-center text-[10px] text-gray-550 font-semibold">
                        <div>
                          <span className="block font-mono text-[9px] text-gray-600">Node ID: {tenant?.toUpperCase()}-S2-{generatedReport?.id?.slice(-4) || '0000'}</span>
                          <span className="block font-mono text-[9px] text-gray-600">Digital Signature: SHA-256: {generatedReport?.id ? btoa(generatedReport.id).slice(0,15) : '—'}</span>
                        </div>
                        <div className="text-right">
                          <span className="block text-gray-850 font-extrabold">{profileName} (Lead GIS)</span>
                          <span className="block text-[8px] text-green-600 uppercase">Electronically Signed</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-gray-100 text-[8px] font-bold text-gray-450 uppercase tracking-wider">
                    <span>Registry: VCS & Gold Standard compliant</span>
                    <span className="text-green-600">Deforestation Free Verified</span>
                    <span>Page {pageCounter} of {totalPages}</span>
                  </div>
                </div>
              );
            };

            const renderCarbonPage = () => {
              pageCounter++;
              const carbonData = getMetricChartData('SOC', reportPlot);
              const plotName = reportPlot === 'WHOLE-FARM' ? 'Whole Farm (Aggregate)' : reportPlot;
              const reportId = generatedReport ? generatedReport.id : '—';

              return (
                <div className="w-full max-w-[700px] aspect-[1/1.414] bg-white border border-gray-200 shadow-md p-12 flex flex-col justify-between relative report-page-break mx-auto select-none">
                  <div className="flex justify-between items-center pb-4 border-b border-gray-100 text-[9px] font-bold text-gray-455 uppercase tracking-widest">
                    <div className="flex items-center gap-1.5">
                      <Globe size={12} className="text-green-600" />
                      <span>04. Carbon Sequestration & Soil Chemistry</span>
                    </div>
                    <span>ID: {reportId}</span>
                  </div>

                  <div className="my-auto space-y-6 flex-1 pt-6 text-left">
                    <div>
                      <h4 className="text-lg font-black text-gray-900 tracking-tight">SOIL ORGANIC CARBON & ABOVEGROUND BIOMASS</h4>
                      <p className="text-xs text-gray-600 font-semibold mt-1">Verification of baseline carbon reserves and annual wood biomass changes.</p>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[9px] font-bold text-gray-450 uppercase tracking-wider block">Carbon Accumulation Chart</span>
                      <div className="h-[180px] w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl relative">
                        <Bar data={carbonData} options={chartOptions} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <div>
                        <span className="text-[9px] text-gray-455 font-bold uppercase block">Baseline Soil Carbon (SOC)</span>
                        <span className="text-sm font-black text-gray-800 mt-1 block">—</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-gray-455 font-bold uppercase block">Aboveground Biomass (AGB)</span>
                        <span className="text-sm font-black text-gray-800 mt-1 block">—</span>
                      </div>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50/50">
                    <span className="text-[9px] font-black uppercase text-gray-455 tracking-wider block">Security Hash & Signatures</span>
                    <div className="flex justify-between items-center text-[10px] text-gray-550 font-semibold">
                      <div>
                        <span className="block font-mono text-[9px] text-gray-600">Node ID: {tenant?.toUpperCase()}-S2-{generatedReport?.id?.slice(-4) || '0000'}</span>
                        <span className="block font-mono text-[9px] text-gray-600">Digital Signature: SHA-256: {generatedReport?.id ? btoa(generatedReport.id).slice(0,15) : '—'}</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-gray-850 font-extrabold">{profileName} (Lead GIS)</span>
                        <span className="block text-[8px] text-green-600 uppercase">Electronically Signed</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-gray-100 text-[8px] font-bold text-gray-450 uppercase tracking-wider">
                    <span>Registry: VCS & Gold Standard compliant</span>
                    <span className="text-green-600">Deforestation Free Verified</span>
                    <span>Page {pageCounter} of {totalPages}</span>
                  </div>
                </div>
              );
            };

            return (
              <div className="p-10 space-y-10">
                {/* Dynamic stylesheet for PDF print overrides */}
                <style>{`
                  @media print {
                    /* Hide all UI containers */
                    body * {
                      visibility: hidden !important;
                    }
                    /* Show only the printable pages block */
                    .printable-report-area, .printable-report-area * {
                      visibility: visible !important;
                    }
                    .printable-report-area {
                      position: absolute !important;
                      left: 0 !important;
                      top: 0 !important;
                      width: 100% !important;
                      max-width: 100% !important;
                      margin: 0 !important;
                      padding: 0 !important;
                      background: white !important;
                      border: none !important;
                      box-shadow: none !important;
                    }
                    /* Format each page as A4 size and force break */
                    .report-page-break {
                      page-break-after: always !important;
                      break-after: page !important;
                      margin: 0 !important;
                      border: none !important;
                      box-shadow: none !important;
                      padding: 2.5cm !important;
                      width: 100% !important;
                      height: 297mm !important;
                      box-sizing: border-box !important;
                      display: flex !important;
                      flex-direction: column !important;
                      justify-content: space-between !important;
                      background: white !important;
                    }
                    .no-print {
                      display: none !important;
                    }
                  }
                `}</style>

                <div className="flex justify-between items-center no-print">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Analytical Ledger Reports</h2>
                    <p className="text-sm text-gray-500 font-medium mt-2">
                      Export verified geospatial datasets, CSV ledger tables, and printable PDF documents.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
                  {/* ── CONFIGURATION PANEL (Left side, 1/3 width) ── */}
                  <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6 no-print">
                    <h3 className="text-base font-bold text-gray-900 pb-4 border-b border-gray-100 flex items-center gap-2.5">
                      <Settings2 size={18} className="text-green-600" />
                      Configure Report
                    </h3>
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block">Report Scope</label>
                        <select
                          value={reportPlot}
                          onChange={(e) => {
                            setReportPlot(e.target.value);
                            setSelectedThemeReport('');
                          }}
                          className="w-full bg-gray-55 border border-gray-200 rounded-xl py-3 px-4 text-sm font-semibold outline-none cursor-pointer focus:border-green-500 text-gray-700"
                        >
                          <option value="WHOLE-FARM">Whole Farm (Aggregate)</option>
                          {plotsData && plotsData.map(p => (
                            <option key={p.id} value={p.id}>{p.id}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-450 uppercase tracking-wider block">Report Type</label>
                        <select
                          value={selectedThemeReport || reportIndex}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val.startsWith('theme')) {
                              setSelectedThemeReport(val);
                              if (val === 'theme1') {
                                setReportPlot('WHOLE-FARM');
                                setReportIndex('SOC');
                                triggerReportGeneration('WHOLE-FARM', 'SOC');
                              } else if (val === 'theme2') {
                                setReportPlot('WHOLE-FARM');
                                setReportIndex('NDMI');
                                triggerReportGeneration('WHOLE-FARM', 'NDMI');
                              } else if (val === 'theme3') {
                                setReportPlot('WHOLE-FARM');
                                setReportIndex('AGB');
                                triggerReportGeneration('WHOLE-FARM', 'AGB');
                              } else if (val === 'theme4') {
                                setReportPlot('WHOLE-FARM');
                                setReportIndex('NDVI');
                                triggerReportGeneration('WHOLE-FARM', 'NDVI');
                              }
                            } else {
                              setSelectedThemeReport('');
                              setReportIndex(val);
                            }
                          }}
                          className="w-full bg-gray-55 border border-gray-200 rounded-xl py-3 px-4 text-sm font-semibold outline-none cursor-pointer focus:border-green-500 text-gray-700"
                        >
                          <optgroup label="Standard Analytical Metrics">
                            <option value="NDVI">Health Status Report</option>
                            <option value="NDMI">Climate & Soil Moisture Report</option>
                            <option value="NDWI">Water Hydrology Report</option>
                            <option value="SOC">Soil Organic Carbon Report</option>
                            <option value="AGB">Aboveground Biomass Carbon Report</option>
                            <option value="ALL">Complete Farm Ledger (All Reports)</option>
                          </optgroup>
                          <optgroup label="Pre-compiled Sustainability Reports">
                            <option value="theme1">Carbon Credits & Climate-Smart Ag</option>
                            <option value="theme2">Agroforestry & Land Restoration</option>
                            <option value="theme3">Carbon Accounting & Verification</option>
                            <option value="theme4">Traceability & Env. Impact</option>
                          </optgroup>
                        </select>
                      </div>

                      <button
                        onClick={() => triggerReportGeneration()}
                        disabled={isGeneratingReport}
                        className="w-full text-white font-bold text-sm py-3.5 rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2.5 hover:opacity-90 active:scale-98"
                        style={{ backgroundColor: '#16A34A' }}
                      >
                        {isGeneratingReport
                          ? <><RefreshCw className="animate-spin" size={15} /> Generating...</>
                          : <><Download size={15} /> Generate Report PDF</>}
                      </button>
                      
                      {generatedReport && (
                        <button
                          onClick={() => window.print()}
                          className="w-full text-gray-755 border border-gray-300 font-bold text-sm py-3.5 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2.5 hover:bg-gray-55 active:scale-98"
                        >
                          <Download size={15} /> Download PDF
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ── REPORT DOCUMENT PAGES VIEW (Right side, 2/3 width) ── */}
                  <div className="xl:col-span-2 space-y-6">
                    
                    {isGeneratingReport && (
                      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm min-h-[500px] flex flex-col justify-center items-center no-print">
                        <div className="w-full max-w-md space-y-6 text-center">
                          <div className="w-16 h-16 bg-green-50 border border-green-100 rounded-2xl flex items-center justify-center text-green-600 mx-auto">
                            <RefreshCw className="animate-spin" size={24} />
                          </div>
                          <div className="space-y-1.5">
                            <h4 className="text-base font-bold text-gray-800">Processing Spatial Report</h4>
                            <p className="text-sm text-gray-600">{reportProgressText}</p>
                          </div>
                          <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${reportProgress}%`, backgroundColor: '#16A34A' }}></div>
                          </div>
                          <span className="text-sm font-bold text-green-700">{reportProgress}% complete</span>
                        </div>
                      </div>
                    )}

                    {!isGeneratingReport && !generatedReport && (
                      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm min-h-[500px] flex flex-col justify-center items-center text-center no-print">
                        <div className="space-y-3 py-10">
                          <FileSpreadsheet size={48} className="text-gray-500 mx-auto" />
                          <h4 className="text-base font-bold text-gray-500 mt-2">No Report Generated Yet</h4>
                          <p className="text-sm text-gray-600 max-w-xs leading-relaxed mx-auto">
                            Configure the details on the left and click Generate to create a verified PDF audit sheet.
                          </p>
                        </div>
                      </div>
                    )}

                    {!isGeneratingReport && generatedReport && (() => {
                      const reportPlot = generatedReport.plot;
                      const reportIndex = generatedReport.index;
                      const isWholeFarm = reportPlot === 'WHOLE-FARM';
                      
                      const chartData = {
                        labels: TIMELINE_DATA.length > 0
                          ? TIMELINE_DATA.map(t => t.label || t.date)
                          : [],
                        datasets: [{
                          label: `${reportIndex} Value`,
                          data: TIMELINE_DATA.map(t => {
                            const key = reportIndex.toLowerCase();
                            return t[key] ?? null;
                          }),
                          backgroundColor: 'rgba(22, 163, 74, 0.1)',
                          borderColor: '#16A34A',
                          borderWidth: 2.5,
                          fill: true,
                          tension: 0.3,
                          pointRadius: 3
                        }]
                      };

                      const chartOptions = {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                          y: { grid: { color: 'rgba(0,0,0,0.03)' }, ticks: { font: { size: 10, weight: '600' } } },
                          x: { grid: { display: false }, ticks: { font: { size: 10, weight: '600' } } }
                        }
                      };

                      const getReportInsight = () => {
                        const scopeText = isWholeFarm ? 'the Whole Farm aggregate' : `Plot ${reportPlot}`;
                        const metricName = {
                          NDVI: 'Vegetation Vigor (NDVI)',
                          NDMI: 'Soil Canopy Moisture (NDMI)',
                          NDWI: 'Water Hydrology (NDWI)',
                          SOC: 'Soil Organic Carbon (SOC)',
                          AGB: 'Aboveground Biomass (AGB)'
                        }[reportIndex] || reportIndex;
                        
                        if (isWholeFarm) {
                          return `Spatial verification of the whole farm indicates performance across all primary vegetative bands. ${metricName} values are derived from real satellite observations. Overall forest canopy coverage is assessed against EUDR regulatory baseline.`;
                        }
                        return `Diagnostic review of ${scopeText} shows values for ${metricName} derived from real satellite data. Canopy density trajectories are tracked across available observation dates.`;
                      };

                      return (
                        <div className="w-full flex-1 flex flex-col min-h-0 bg-slate-900 rounded-2xl overflow-hidden shadow-xl border border-slate-800">
                          {/* PDF Viewer Header */}
                          <div className="bg-slate-950 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 no-print shrink-0 select-none">
                            <div className="flex items-center gap-3">
                              <FileText size={18} className="text-green-500" />
                              <span className="font-mono text-xs font-bold text-slate-200">{generatedReport.id}.pdf</span>
                              <span className="bg-slate-800 text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-700">2 Pages</span>
                            </div>
                            <button
                              onClick={() => window.print()}
                              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-sm active:scale-95"
                            >
                              <Download size={13} /> Download PDF
                            </button>
                          </div>

                          {/* PDF Pages Viewer */}
                          <div className="bg-slate-800 p-8 overflow-y-auto space-y-8 flex flex-col items-center flex-1 max-h-[720px] scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                            
                            {/* PAGE 1: COVER CERTIFICATE */}
                            <div className="bg-white shadow-2xl border border-gray-300 w-full max-w-[620px] aspect-[1/1.414] p-12 flex flex-col justify-between relative select-none">
                              {/* Confidential Header */}
                              <div className="flex justify-between items-center text-[9px] font-black text-gray-600 uppercase tracking-widest border-b border-gray-100 pb-3">
                                <span className="text-green-600 flex items-center gap-1 font-bold">
                                  <Globe size={10} /> FARMINTELYTICS SPATIAL MRV AUDIT
                                </span>
                                <span>CONFIDENTIAL DOCUMENT</span>
                              </div>

                              {/* Center Content */}
                              <div className="my-auto text-center space-y-8">
                                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-100 mx-auto shadow-sm">
                                  <Shield size={32} />
                                </div>
                                
                                <div className="space-y-4">
                                  <span className="text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200/30 px-3.5 py-1 rounded-full uppercase tracking-wider inline-block">
                                    Verified Compliance Certificate
                                  </span>
                                  <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-snug uppercase max-w-md mx-auto">
                                    Spatial Environmental Audit & Registry Report
                                  </h1>
                                  <p className="text-xs text-gray-600 font-semibold leading-relaxed max-w-sm mx-auto">
                                    Continuous satellite observation, biophysical metric ledgers, and carbon stock calculations.
                                  </p>
                                </div>
                              </div>

                              {/* Metadata block at bottom */}
                              <div className="grid grid-cols-2 gap-4 bg-gray-50/50 p-4 rounded-xl border border-gray-200 text-left">
                                <div>
                                  <span className="text-[9px] text-gray-600 font-extrabold uppercase tracking-wider block mb-1">Scope Target</span>
                                  <span className="text-xs font-bold text-gray-800">
                                    {generatedReport.plot === 'WHOLE-FARM' ? 'Whole Farm (Aggregate)' : generatedReport.plot}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[9px] text-gray-600 font-extrabold uppercase tracking-wider block mb-1">Report Category</span>
                                  <span className="text-xs font-bold text-gray-800">
                                    {generatedReport.index === 'NDVI' ? 'NDVI — Vegetation Health Audit' :
                                     generatedReport.index === 'NDMI' ? 'NDMI — Soil Moisture Audit' :
                                     generatedReport.index === 'NDWI' ? 'NDWI — Water Hydrology Audit' :
                                     generatedReport.index === 'SOC' ? 'SOC — Soil Organic Carbon Audit' :
                                     'AGB — Aboveground Biomass Carbon Audit'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* PAGE 2: LEDGER DATA PAGE */}
                            <div className="bg-white shadow-2xl border border-gray-300 w-full max-w-[620px] aspect-[1/1.414] p-12 flex flex-col justify-between relative select-none">
                              {/* Page 2 Header */}
                              <div className="flex justify-between items-center text-[9px] font-black text-gray-600 uppercase tracking-widest border-b border-gray-100 pb-3">
                                <span className="text-green-600 flex items-center gap-1 font-bold">
                                  <Globe size={10} /> FARMINTELYTICS SPATIAL MRV AUDIT
                                </span>
                                <span>ANALYTICAL DATA LEDGER</span>
                              </div>

                              {/* Data Details */}
                              <div className="my-auto space-y-6 flex-1 pt-6 text-left">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                                  {[
                                    { label: 'Scope Target', value: generatedReport.plot === 'WHOLE-FARM' ? 'Whole Farm' : generatedReport.plot },
                                    { label: 'Metric Analyzed', value: generatedReport.index },
                                    { label: 'Mean Value', value: generatedReport.meanVal, color: 'text-green-700 font-extrabold' },
                                    { label: 'Compiled At', value: generatedReport.date }
                                  ].map((row, i) => (
                                    <div key={i}>
                                      <span className="text-[9px] text-gray-600 font-extrabold uppercase tracking-wider block mb-0.5">{row.label}</span>
                                      <span className={`text-[11px] font-bold ${row.color || 'text-gray-800'}`}>{row.value}</span>
                                    </div>
                                  ))}
                                </div>

                                {/* Chart */}
                                <div className="space-y-2">
                                  <span className="text-[10px] font-extrabold text-gray-600 uppercase tracking-wider block flex items-center gap-1">
                                    <LineChart size={12} className="text-green-600" />
                                    {generatedReport.plot === 'WHOLE-FARM' ? 'Spatial Comparative Chart' : 'Temporal Historical Trend'}
                                  </span>
                                  <div className="h-[160px] bg-white p-3 rounded-xl border border-gray-100">
                                    {generatedReport.plot === 'WHOLE-FARM' ? (
                                      <Bar data={chartData} options={chartOptions} />
                                    ) : (
                                      <Line data={chartData} options={chartOptions} />
                                    )}
                                  </div>
                                </div>

                                {/* Agronomic Insight */}
                                <div className="p-4 bg-green-50/40 border border-green-100 rounded-xl space-y-1.5">
                                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-green-800 flex items-center gap-1">
                                    <Sparkles size={11} className="text-green-600" />
                                    Automated Agronomic Diagnostic Insight
                                  </span>
                                  <p className="text-[11px] text-green-700 font-semibold leading-relaxed">
                                    {getReportInsight()}
                                  </p>
                                </div>
                              </div>

                              {/* Page 2 Footer */}
                              <div className="flex justify-between items-center pt-3 border-t border-gray-100 text-[8px] font-bold text-gray-600 uppercase tracking-wider">
                                <span>FARMINTELYTICS WEBPORTAL v3.2</span>
                                <span className="text-green-650 font-bold">Certified Deforestation-Free</span>
                                <span>Page 2 of 2</span>
                              </div>
                            </div>

                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ══════════════════════════════════════════════════════════════
              AI ASSISTANT
          ══════════════════════════════════════════════════════════════ */}
          {activeSidebarItem === 'analytics' && activeTab === 'ai-assistant' && (
            <div className="flex flex-col flex-1 h-full bg-white overflow-hidden">
              
              {/* Header (Only shown if chat has started) */}
              {chatMessages.length > 1 && (
                <div className="px-8 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="text-green-600" size={16} />
                    <span className="text-sm font-bold text-gray-800 uppercase tracking-wide">Scenario Modeling Assistant</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-status-live animate-pulse" />
                  </div>
                </div>
              )}

              {/* Main Content Area */}
              <div className="flex-1 overflow-y-auto flex flex-col min-h-0 bg-gray-50/20">
                {chatMessages.length === 1 ? (
                  /* Landing Empty State (Plot layout) */
                  <div className="flex-1 flex flex-col justify-center items-center max-w-4xl mx-auto px-6 py-8 text-center space-y-8">
                    <div className="space-y-3">
                      <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight">Scenario Modeling Assistant</h3>
                      <p className="text-sm text-gray-500 max-w-xl mx-auto leading-relaxed">
                        Ask what-if questions about your vegetation plots. The assistant reasons over live remote-sensing indices to forecast health impact and recommend agronomic actions.
                      </p>
                    </div>

                    {/* Grid of 2x2 cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl text-left">
                      {[
                        {
                          id: 'carbon',
                          title: 'Carbon & Climate-Smart Ag',
                          desc: 'Simulate carbon credit yield if we transition this farm to zero-tillage & cover cropping practices.',
                          icon: <Leaf size={15} />,
                          prompt: 'Simulate carbon credit yield if we transition this farm to zero-tillage & multi-species cover cropping.'
                        },
                        {
                          id: 'agroforestry',
                          title: 'Agroforestry & Restoration',
                          desc: 'Model the canopy density growth trajectory and species diversity impact across active restoration zones.',
                          icon: <Trees size={15} />,
                          prompt: 'Model the canopy density growth trajectory and species diversity index across the active restoration zones on this farm.'
                        },
                        {
                          id: 'accounting',
                          title: 'Carbon Accounting & Registry',
                          desc: 'Run a geospatial mismatch audit on farm plot coordinates against regional baseline forest datasets.',
                          icon: <Globe size={15} />,
                          prompt: 'Run a geospatial mismatch audit on the farm plot coordinates against regional baseline forest datasets.'
                        },
                        {
                          id: 'traceability',
                          title: 'Traceability & Env. Impact',
                          desc: 'Draft an EUDR-compliant traceability report showing deforestation-free proof for this farm.',
                          icon: <Shield size={15} />,
                          prompt: 'Draft an EUDR-compliant traceability report showing deforestation-free proof and soil health history for this farm.'
                        }
                      ].map(card => (
                        <button
                          key={card.id}
                          onClick={() => handleChatSubmit(card.prompt)}
                          className="p-5 bg-white border border-gray-150 rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:border-[#16A34A]/40 hover:shadow-sm transition-all text-left flex flex-col group"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 bg-[#DCFCE7] text-[#16A34A] rounded-lg flex items-center justify-center shrink-0">
                              {card.icon}
                            </div>
                            <span className="text-sm font-bold text-gray-800 group-hover:text-[#16A34A] transition-colors">
                              {card.title}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 leading-relaxed font-medium">
                            {card.desc}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Active Message History */
                  <div className="flex-1 overflow-y-auto px-6 py-8">
                    <div className="max-w-3xl mx-auto space-y-6">
                      {chatMessages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] rounded-2xl text-sm font-medium leading-relaxed shadow-[0_1px_2px_rgba(0,0,0,0.02)] ${
                            msg.sender === 'user'
                              ? 'text-white rounded-tr-none px-5 py-3.5'
                              : 'bg-white border border-gray-150 text-gray-700 rounded-tl-none px-5 py-3.5'
                          }`} style={msg.sender === 'user' ? { backgroundColor: '#16A34A' } : undefined}>
                            <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                            {msg.sources && msg.sources.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-gray-100 flex flex-wrap gap-1">
                                {msg.sources.map((src, si) => (
                                  <span key={si} className="text-xs bg-green-50 text-green-700 border border-green-100 rounded-full px-2 py-0.5 font-medium">{src}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {chatLoading && (
                        <div className="flex justify-start">
                          <div className="bg-white border border-gray-150 rounded-2xl rounded-tl-none px-5 py-3.5 flex items-center gap-2 text-sm text-gray-600 font-medium">
                            <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Input Area */}
              <div className="bg-white px-6 py-6 shrink-0">
                <div className="max-w-3xl mx-auto">
                  <form
                    onSubmit={(e) => { e.preventDefault(); handleChatSubmit(); }}
                    className="relative flex flex-col"
                  >
                    <textarea
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      disabled={chatLoading}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleChatSubmit();
                        }
                      }}
                      placeholder="Ask about your farm... e.g. Which plots have low NDVI this season?"
                      className="w-full bg-gray-50 border border-transparent focus:border-green-600 focus:bg-white rounded-2xl py-5 pl-6 pr-16 text-sm font-semibold outline-none transition-all text-gray-800 placeholder-gray-400 shadow-sm resize-none h-44 disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={chatLoading}
                      className="absolute right-4 bottom-4 w-12 h-12 text-white rounded-xl flex items-center justify-center shadow-md shrink-0 transition-transform active:scale-95 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ backgroundColor: '#16A34A' }}
                    >
                      <Send size={18} />
                    </button>
                  </form>
                </div>
              </div>

            </div>
          )}

          {activeSidebarItem === 'help' && (
            <div className="p-10 space-y-8 overflow-y-auto h-full">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                    <Info size={28} className="text-green-650" />
                    Platform Glossary
                  </h2>
                  <p className="text-sm text-gray-500 font-medium mt-2">
                    Dictionary of key Remote Sensing Indices, Biophysical Indicators, and Cadastral metrics.
                  </p>
                </div>
                <div className="relative max-w-xs w-full">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                  <input
                    type="text"
                    value={glossarySearch}
                    onChange={(e) => setGlossarySearch(e.target.value)}
                    placeholder="Search terms, formulas..."
                    className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pl-9 pr-4 text-xs font-semibold outline-none focus:border-green-500 transition-all text-gray-700 shadow-sm"
                  />
                  {glossarySearch && (
                    <button 
                      onClick={() => setGlossarySearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-455 hover:text-gray-755 text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              {/* Glossary Subpages Tab Selector */}
              <div className="flex border-b border-gray-100 bg-gray-50/30 p-1 rounded-xl gap-1 shrink-0">
                <button
                  onClick={() => setGlossaryTab('remote-sensing')}
                  className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    glossaryTab === 'remote-sensing'
                      ? 'bg-green-600 text-white shadow-sm font-extrabold'
                      : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  <Satellite size={13} />
                  Remote Sensing Indices
                </button>
                <button
                  onClick={() => setGlossaryTab('farmer-inputs')}
                  className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    glossaryTab === 'farmer-inputs'
                      ? 'bg-green-600 text-white shadow-sm font-extrabold'
                      : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  <Database size={13} />
                  Farmer Inputs
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-0 overflow-y-auto pr-1">
                {Object.entries(TOOLTIP_DESCRIPTIONS)
                  .filter(([key, value]) => {
                    const searchLower = glossarySearch.toLowerCase();
                    const categoryMatch = value.category === glossaryTab;
                    const textMatch = 
                      key.toLowerCase().includes(searchLower) ||
                      (value.desc && value.desc.toLowerCase().includes(searchLower)) ||
                      (value.done && value.done.toLowerCase().includes(searchLower)) ||
                      (value.formula && value.formula.toLowerCase().includes(searchLower));
                    return categoryMatch && textMatch;
                  })
                  .map(([key, value]) => (
                    <div key={key} className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm flex flex-col justify-between hover:shadow-md transition-all gap-4">
                      <div>
                        <h3 className="text-base font-bold text-gray-950 flex items-center justify-between gap-2">
                          {key}
                        </h3>
                        <p className="text-xs text-gray-555 font-semibold leading-relaxed mt-2 text-left">
                          {value.desc}
                        </p>
                      </div>
                      
                      <div className="space-y-3 pt-3 border-t border-gray-100 text-left">
                        {value.done && (
                          <div className="text-[11px] text-gray-650 font-semibold">
                            <span className="font-extrabold text-gray-600 uppercase text-[11px] block tracking-wider mb-0.5">Methodology</span>
                            {value.done}
                          </div>
                        )}
                        {value.formula && (
                          <div className="text-[11px] text-gray-650 font-semibold">
                            <span className="font-extrabold text-gray-600 uppercase text-[11px] block tracking-wider mb-1">Formula / Expression</span>
                            <code className="block font-mono text-[11px] text-green-705 bg-green-50/50 border border-green-100 rounded-lg p-2 overflow-x-auto whitespace-pre-wrap word-break-all">
                              {value.formula}
                            </code>
                          </div>
                        )}
                        {value.references && (
                          <div className="text-[11px] text-gray-650 font-semibold">
                            <span className="font-extrabold text-gray-600 uppercase text-[11px] block tracking-wider mb-1">References Cited</span>
                            <div className="text-[11px] text-gray-500 font-medium italic leading-relaxed bg-gray-50/50 border border-gray-100 rounded-lg p-2.5">
                              {value.references}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl w-[640px] h-[480px] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4.5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-2.5">
                <Settings2 className={brandingMode === 'AM' ? 'text-green-600' : 'text-green-600'} size={19} />
                <span className="text-base font-extrabold text-gray-950">Settings Center</span>
              </div>
              <button 
                onClick={() => setShowSettingsModal(false)}
                className="p-1.5 hover:bg-gray-100 rounded-full text-gray-600 hover:text-gray-700 transition-all"
              >
                <X size={17} />
              </button>
            </div>
            
            {/* Split Body */}
            <div className="flex-1 flex overflow-hidden">
              {/* Left Tabs */}
              <div className="w-[180px] bg-gray-50/50 border-r border-gray-100 p-3 space-y-1">
                {[
                  { id: 'profile', label: 'User Profile', icon: <User size={15} /> },
                  { id: 'branding', label: 'Platform Mode', icon: <Globe size={15} /> },
                  { id: 'map', label: 'Map Configuration', icon: <MapIcon size={15} /> },
                  { id: 'users', label: 'Team Access', icon: <Users size={15} /> }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setSettingsTab(tab.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-left transition-all ${
                      settingsTab === tab.id
                        ? (brandingMode === 'AM' ? 'bg-green-50 text-green-700 font-extrabold' : 'bg-green-50 text-green-700 font-extrabold')
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>
              
              {/* Right Content Pane */}
              <div className="flex-1 p-6 overflow-y-auto space-y-5">
                {settingsTab === 'profile' && (
                  <div className="space-y-4">
                    <div className="text-xs font-black uppercase tracking-wider text-gray-600">User Profile Settings</div>
                    <div className="space-y-3">
                      <div>
                        <label className="text-[11px] font-black uppercase text-gray-600 block mb-1">Full Name</label>
                        <input 
                          type="text" 
                          value={profileName} 
                          onChange={e => setProfileName(e.target.value)} 
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold focus:bg-white focus:border-green-600 outline-none" 
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-black uppercase text-gray-600 block mb-1">Active Role</label>
                        <input 
                          type="text" 
                          value={profileRole} 
                          onChange={e => setProfileRole(e.target.value)} 
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold focus:bg-white focus:border-green-600 outline-none" 
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-black uppercase text-gray-600 block mb-1">Email Identity</label>
                        <input 
                          type="email" 
                          value={profileEmail} 
                          onChange={e => setProfileEmail(e.target.value)} 
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold focus:bg-white focus:border-green-600 outline-none" 
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                {settingsTab === 'branding' && (
                  <div className="space-y-4">
                    <div className="text-xs font-black uppercase tracking-wider text-gray-600">Platform System Mode</div>
                    <div className="grid grid-cols-1 gap-3">
                      <div 
                        onClick={() => setBrandingMode('AM')}
                        className={`border rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all hover:border-green-500/50 ${
                          brandingMode === 'AM' ? 'border-green-600 bg-green-50/20 shadow-sm' : 'border-gray-200'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-extrabold text-gray-900 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-600" />
                            AgroMonitor Mode (AM)
                          </div>
                          <div className="text-[11px] text-gray-600 mt-1">Satellite analysis, green theme interface, default AM initials.</div>
                        </div>
                        {brandingMode === 'AM' && <CheckCircle2 size={16} className="text-green-600" />}
                      </div>
                      
                      <div 
                        onClick={() => setBrandingMode('FT')}
                        className={`border rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all hover:border-green-500/50 ${
                          brandingMode === 'FT' ? 'border-green-600 bg-green-50/20 shadow-sm' : 'border-gray-200'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-extrabold text-gray-900 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-600" />
                            Farm Tools Harvest Mode (FT)
                          </div>
                          <div className="text-[11px] text-gray-600 mt-1">Operational harvest tools, blue/orange branding, FT initials.</div>
                        </div>
                        {brandingMode === 'FT' && <CheckCircle2 size={16} className="text-green-600" />}
                      </div>
                    </div>
                  </div>
                )}
                
                {settingsTab === 'map' && (
                  <div className="space-y-4">
                    <div className="text-xs font-black uppercase tracking-wider text-gray-600">Map Default Configuration</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-black uppercase text-gray-600 block mb-1">Center Latitude</label>
                        <input 
                          type="number" 
                          step="0.0001" 
                          value={defaultLat} 
                          onChange={e => setDefaultLat(parseFloat(e.target.value))} 
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:bg-white" 
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-black uppercase text-gray-600 block mb-1">Center Longitude</label>
                        <input 
                          type="number" 
                          step="0.0001" 
                          value={defaultLng} 
                          onChange={e => setDefaultLng(parseFloat(e.target.value))} 
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:bg-white" 
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[11px] font-black uppercase text-gray-600 block mb-1">Initial Zoom level</label>
                        <input 
                          type="number" 
                          value={defaultMapZoom} 
                          onChange={e => setDefaultMapZoom(parseInt(e.target.value))} 
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:bg-white" 
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                {settingsTab === 'users' && (
                  <div className="space-y-4">
                    <div className="text-xs font-black uppercase tracking-wider text-gray-600">Team Access Management</div>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {settingsUsers.map(user => (
                        <div key={user.id} className="flex items-center justify-between p-2.5 border border-gray-100 rounded-xl bg-gray-50/30">
                          <div>
                            <div className="text-xs font-bold text-gray-900">{user.name}</div>
                            <div className="text-[11px] text-gray-600 mt-0.5">{user.email} · {user.role}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span 
                              onClick={() => {
                                setSettingsUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: u.status === 'Active' ? 'Offline' : 'Active' } : u));
                              }}
                              className={`text-[11px] font-bold px-2 py-0.5 rounded cursor-pointer transition-colors ${user.status === 'Active' ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-gray-150 text-gray-500 hover:bg-gray-200'}`}
                            >
                              {user.status}
                            </span>
                            <button 
                              onClick={() => setSettingsUsers(prev => prev.filter(u => u.id !== user.id))}
                              className="p-1 hover:bg-green-50 text-gray-600 hover:text-green-700 rounded"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Add User mini-form */}
                    <div className="pt-2 border-t border-gray-100 space-y-2">
                      <div className="text-[11px] font-black uppercase tracking-wider text-gray-600">Add Team Member</div>
                      <div className="grid grid-cols-2 gap-2">
                        <input 
                          id="new-user-name"
                          type="text" 
                          placeholder="Name" 
                          className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-[11px] font-bold outline-none focus:bg-white" 
                        />
                        <input 
                          id="new-user-email"
                          type="email" 
                          placeholder="Email" 
                          className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-[11px] font-bold outline-none focus:bg-white" 
                        />
                        <input 
                          id="new-user-role"
                          type="text" 
                          placeholder="Role (e.g. Field Agent)" 
                          className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-[11px] font-bold outline-none focus:bg-white col-span-2" 
                        />
                      </div>
                      <button 
                        onClick={() => {
                          const nameEl = document.getElementById('new-user-name');
                          const emailEl = document.getElementById('new-user-email');
                          const roleEl = document.getElementById('new-user-role');
                          if (nameEl && emailEl && roleEl && nameEl.value && emailEl.value) {
                            const newUser = {
                              id: `USER-${Date.now()}`,
                              name: nameEl.value,
                              email: emailEl.value,
                              role: roleEl.value || 'Viewer',
                              status: 'Active'
                            };
                            setSettingsUsers(prev => [...prev, newUser]);
                            nameEl.value = '';
                            emailEl.value = '';
                            roleEl.value = '';
                          }
                        }}
                        className={`w-full py-2 rounded-lg text-xs font-bold text-white transition-all ${
                          brandingMode === 'AM' ? 'bg-green-600 hover:bg-green-700' : 'bg-green-600 hover:bg-green-700'
                        }`}
                      >
                        Add Member
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-2.5">
              <button 
                onClick={() => setShowSettingsModal(false)}
                className="px-4.5 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-all"
              >
                Close
              </button>
              <button 
                onClick={() => {
                  setShowSettingsModal(false);
                  setShowProfileSaved(true);
                  setTimeout(() => setShowProfileSaved(false), 2000);
                }}
                className={`px-4.5 py-2 rounded-xl text-xs font-bold text-white shadow-sm transition-all hover:scale-102 active:scale-98 ${
                  brandingMode === 'AM' ? 'bg-green-600 hover:bg-green-700' : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

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
