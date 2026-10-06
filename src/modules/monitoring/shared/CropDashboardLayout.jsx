import { CROP_META } from '../../../services/cropMonitoringApi';
import PlotDetailPanel from './PlotDetailPanel';
import PlotSearchSelector from './PlotSearchSelector';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Layers,
  Satellite,
  Map as MapIcon,
  Activity,
  Droplets,
  Sun,
  ArrowLeft,
  LogOut,
  CheckCircle2,
  TrendingUp,
  LayoutDashboard,
  Calendar as CalendarIcon,
  Search,
  Shield,
  Bell,
  X,
  Info,
  RefreshCw,
  FileText,
  Settings2,
  ChevronDown,
  ChevronUp,
  Clock,
  SlidersHorizontal,
  Waves,
  CloudRain,
  Leaf,
  Sparkles,
  Send,
  AlertTriangle,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Columns
} from 'lucide-react';
import { MapContainer, TileLayer, ZoomControl, Polygon, Pane } from 'react-leaflet';
import * as api from '../../../services/organizationMonitorApi';
import 'leaflet/dist/leaflet.css';
import { Radar } from 'react-chartjs-2';
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
import { Upload as UploadIcon, MapPin as EstateIcon } from 'lucide-react';
import { fetchEstates } from '../../../services/estatesApi';
import FarmDataPage from '../../data/FarmDataPage';
import DataNeededDialog from '../../data/DataNeededDialog';
import RegisterPage from '../../services/RegisterPage';
import { CROP_CATALOG, loadCropPages } from '../cropCatalog';
import CropGlossary from './CropGlossary';
import ReportBuilder from '../../reports/ReportBuilder';
import VerificationPage from '../../reports/VerificationPage';
import { CheckPage, AdvicePage } from '../../services/ServicePages';
import { ShieldCheck as CheckIcon, Lightbulb as AdviceIcon } from 'lucide-react';
import { Table2 as RegisterIcon, Users as MembersIcon, FileText as FormsIcon, Inbox as AnswersIcon, Leaf as CarbonIcon, BadgeCheck as PassportIcon } from 'lucide-react';
import MembersPage from '../../smallholder/pages/MembersPage';
import KpiCards from './dashboard/KpiCards';
import NewResultsBanner from './dashboard/NewResultsBanner';
import { UNIT_LABEL, CROP_UNIT } from './dashboard/kpiCatalog';
import { Link } from 'react-router-dom';
import AlertsPage from './dashboard/alerts/AlertsPage';
import OverviewCharts from './dashboard/charts/OverviewCharts';
import { chartsFor, healthChartsFor, waterChartsFor } from './dashboard/charts/chartCatalog';
import { paths } from '../../../routes/paths';
import { roleLabel } from '../../../pages/org/orgProfile';
import GroupCarbonPage from '../../smallholder/pages/GroupCarbonPage';
import EudrPassportPage from '../../smallholder/pages/EudrPassportPage';
import FormsPage from '../../forms/FormsPage';
import SubmissionsPage from '../../forms/SubmissionsPage';
import ScenarioBuilder from '../../assistant/ScenarioBuilder';
import { ANSWER_FORMAT } from '../../assistant/scenarioTemplates';
import { ResizeMap, MapPaneClipSetter, SwipeSliderOverlay, FitBoundsToPlots, FitToZarrBounds } from './dashboard/map/MapHelpers';
import { TOOLTIP_DESCRIPTIONS } from './dashboard/constants/tooltipDescriptions';

import { MONTH_NAMES, CROP_CONFIG_KEYS } from './dashboard/constants/chartConfig';

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
  // Page set: a service's catalogue entry, or the crop's (backend catalogue,
  // admin-editable; interim copy from docs/services/*-monitoring.md until it is deployed).
  const [cropPages, setCropPages] = useState(() => (service ? null : CROP_CATALOG[cropType] || null));
  useEffect(() => {
    if (service || mode === 'organization') return undefined;
    let active = true;
    loadCropPages(cropType).then(pgs => { if (active && pgs) setCropPages(pgs); });
    return () => { active = false; };
  }, [cropType, service, mode]);
  const pageSet = service || cropPages;
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
      try {
        // Run independent requests concurrently — previously these awaited
        // sequentially, so one slow endpoint delayed every other panel even
        // though its data had already arrived.
        const [statsRes, plotsRes, zonesRes, alertsRes] = await Promise.all([
          api.fetchDashboardStats(tenant),
          api.fetchPlotsIntelligence(tenant),
          api.fetchRestorationZones(tenant),
          api.fetchAlerts(tenant),
        ]);

        if (active) {
          setStats(statsRes);
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
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data from backend:", err);
        if (active) {
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
        const ndviVal = p.indices?.ndvi ?? 0;
        const ndmiVal = p.indices?.ndmi ?? 0;
        const healthVal = ndviVal > 0.7 ? 'Optimal' : ndviVal > 0.55 ? 'Good' : 'Stressed';
        const colorVal = healthVal === 'Optimal' ? '#15803d' : healthVal === 'Good' ? '#84cc16' : '#dc2626';
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

  // Verification state


  // Chat state
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
  const [restoreShowInSar, setRestoreShowInSar] = useState(false);
  const [restoreShowGedi, setRestoreShowGedi] = useState(false);
  const [restoreShowLulc, setRestoreShowLulc] = useState(false);
  const [restoreShowEudr, setRestoreShowEudr] = useState(false);
  const [restoreLulcExpanded, setRestoreLulcExpanded] = useState(true);
  const [restoreEudrExpanded, setRestoreEudrExpanded] = useState(true);
  const [restoreShowLulcChange, setRestoreShowLulcChange] = useState(false);


  // Alerts Command Center redesigned states

  // Dropdown layout states

  // Intelligence layers new states

  // Crop Health missing layers states

  // Climate missing layers states
  const [climateShowFlood, setClimateShowFlood] = useState(false);
  const climateFloodOpacity = 80;

  // Land Restoration missing layers states
  const [restoreShowAgb, setRestoreShowAgb] = useState(false);

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
  const healthShowRainfall = false;
  const healthRainfallOpacity = 80;

  // Moisture Content map layers states
  const [moistureShowLayers, setMoistureShowLayers] = useState(true);
  const [moistureShowBoundaries, setMoistureShowBoundaries] = useState(true);
  const [moistureBoundariesOpacity, setMoistureBoundariesOpacity] = useState(100);
  const [moistureOpExpanded, setMoistureOpExpanded] = useState(true);

  // The signed-in person, read-only here; it is changed at /org/<tenant>/settings.
  const profileEmail = localStorage.getItem('fi_email') || '';
  const profileName = localStorage.getItem('fi_full_name') || profileEmail.split('@')[0] || 'Account';
  const profileRole = roleLabel(localStorage.getItem('fi_role') || 'admin');
  const profileInitials = profileName.split(/[\s._-]+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';
  const [showNotifications, setShowNotifications] = useState(false);

  // Collapsible sidebar section groups states (collapsed/false by default)
  const [intelOpExpanded, setIntelOpExpanded] = useState(false);

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
                  {isOnMap && <span className="text-[11px] font-bold text-green-700 bg-green-50 border border-green-200 rounded-full px-1.5 py-0.5">On Map</span>}
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
                {onMapCount > 0 && <span className="text-[11px] font-bold text-green-700 bg-green-50 border border-green-200 rounded-full px-1.5 py-0.5">On Map</span>}
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

  const [yieldOpExpanded, setYieldOpExpanded] = useState(false);
  const [yieldProdExpanded, setYieldProdExpanded] = useState(false);
  const [yieldStatExpanded, setYieldStatExpanded] = useState(false);

  const [restoreOpExpanded, setRestoreOpExpanded] = useState(false);
  const [restoreEcoExpanded, setRestoreEcoExpanded] = useState(false);

  const [climateOpExpanded, setClimateOpExpanded] = useState(false);
  const [climateBioExpanded, setClimateBioExpanded] = useState(false);
  const [climateAtmExpanded, setClimateAtmExpanded] = useState(false);




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


  // Crop Yield map layers states
  const [yieldShowLayers, setYieldShowLayers] = useState(true);
  const [yieldShowBoundaries, setYieldShowBoundaries] = useState(true);
  const [yieldBoundariesOpacity, setYieldBoundariesOpacity] = useState(100);
  const [yieldShowYield, setYieldShowYield] = useState(true);
  const [yieldShowBiomass, setYieldShowBiomass] = useState(false);
  const [yieldShowReadiness, setYieldShowReadiness] = useState(false);
  const [yieldShowGrowth, setYieldShowGrowth] = useState(false);

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
  const [climateShowRainfall, setClimateShowRainfall] = useState(true);
  const climateRainfallOpacity = 80;
  const [climateShowSoilTemp, setClimateShowSoilTemp] = useState(false);
  const climateSoilTempOpacity = 70;
  const [climateShowLst, setClimateShowLst] = useState(false);
  const climateLstOpacity = 70;
  const [climateShowVaporDeficit, setClimateShowVaporDeficit] = useState(false);
  const climateVaporDeficitOpacity = 70;

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
  const [restoreShowSurvival, setRestoreShowSurvival] = useState(false);
  const [restoreShowCarbon, setRestoreShowCarbon] = useState(false);
  const [restoreShowBiodiversity, setRestoreShowBiodiversity] = useState(false);

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
      return plots.map((p) => {
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
              style={{ backgroundColor: isCompareMode ? (activeDateSlot === 'A' ? '#3F8432' : '#2563EB') : '#3F8432' }}
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
                    <span key={i} className="text-[11px] font-semibold text-gray-600 h-4 flex items-center justify-center">{d}</span>
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
                      btnStyle = { background: 'linear-gradient(135deg, #3F8432 50%, #2563EB 50%)', color: '#FFFFFF' };
                    } else if (isSelA) {
                      btnStyle = { backgroundColor: '#3F8432', color: '#FFFFFF' };
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
                        <span className="text-[11px] font-semibold text-gray-600 bg-gray-100 px-1 py-0.5 rounded shrink-0">
                          {effectiveSensor === 'sentinel-1' ? 'S1 SAR' : effectiveSensor === 'landsat' ? 'L9' : 'S2'}
                        </span>
                        <span className="text-[11px] text-gray-500 font-mono">{(selectedIndex || 'NDVI').toUpperCase()}</span>
                      </div>
                    )}
                    {currentTimelineB && (
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
                        <span className="text-[11px] font-bold text-gray-700">B: {currentTimelineB.label?.split(',')[0]}</span>
                        <span className="text-[11px] font-semibold text-gray-600 bg-gray-100 px-1 py-0.5 rounded shrink-0">
                          {effectiveSensor === 'sentinel-1' ? 'S1 SAR' : effectiveSensor === 'landsat' ? 'L9' : 'S2'}
                        </span>
                        <span className="text-[11px] text-gray-500 font-mono">{(selectedIndex || 'NDVI').toUpperCase()}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  currentTimeline && (
                    <div className="flex flex-col gap-0.5">
                      <div className="text-[11px] font-semibold text-gray-600">Selected Acquisition Pass</div>
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-[11px] font-bold text-gray-800 tracking-tight">{currentTimeline.label?.split(',')[0]}</span>
                        <span className="text-[11px] font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded-full border border-green-200">
                          {effectiveSensor === 'sentinel-1' ? 'S1 SAR' : effectiveSensor === 'landsat' ? 'L9' : 'S2'}
                        </span>
                        <span className="text-[11px] font-bold text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded-full border border-gray-100">
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


                {/* Recent passes — the calendar already has every real
                    acquisition date; surfacing the last few here lets you
                    jump between them without opening it. */}
                {calendarDates.length > 0 && (
                  <>
                    <div className="h-px bg-gray-100" />
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[11px] font-semibold text-gray-600">Recent Passes</span>
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
      <header className="h-[72px] bg-white border-b border-gray-100 flex items-center justify-between px-8 z-[100] shadow-sm shrink-0">

        {/* Brand */}
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-xl transition-all border border-gray-200 text-gray-500 hover:text-gray-800">
            <ArrowLeft size={17} />
          </button>
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-green-700">
              <Satellite className="text-white" size={21} />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-gray-900 leading-none flex items-center gap-1.5">
                {service ? service.title : `${cropLabel} monitoring`}
              </h1>
              <p className="text-xs font-medium mt-1 leading-none text-gray-500">
                {tenantDisplayName}
              </p>
            </div>
          </div>
          {estateOptions.length >= 2 && (
            <label className="flex items-center gap-2 pl-4 ml-1 border-l border-gray-200">
              <EstateIcon size={16} className="text-green-600" />
              <span className="sr-only">Estate</span>
              <select
                value={estateOptions.includes(filterEstate) ? filterEstate : 'All'}
                onChange={e => handleEstateChange(e.target.value)}
                className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-800 hover:border-gray-300 outline-none cursor-pointer"
                aria-label="Estate"
              >
                <option value="All">All estates ({estateOptions.length})</option>
                {estateOptions.map(name => <option key={name} value={name}>{name}</option>)}
              </select>
            </label>
          )}
        </div>

        {/* ── TOP TABS ── */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
          {pick([
            { id: 'monitor',      label: 'Monitor',      icon: <Activity size={15} /> },
            { id: 'reports',      label: 'Reports',      icon: <FileText size={15} /> },
            { id: 'verification', label: 'Verification', icon: <Shield size={15} /> },
            { id: 'ai-assistant', label: 'Assistant', icon: <Sparkles size={15} /> }
          ], service?.topTabs).map(tab => (
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
                  <div className="text-xs font-bold text-gray-700">Live Alerts Feed</div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${'bg-green-50 text-green-700'}`}>
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
                <div className="text-xs font-medium mt-1 text-gray-500">{profileRole}</div>
              </div>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center font-semibold text-sm border text-green-800 border-green-200 bg-green-50">
                {profileInitials}
              </div>
            </button>
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2.5 w-64 bg-white border border-gray-200 rounded-2xl shadow-2xl z-[500] overflow-hidden">
                <div className="p-4 bg-gray-50/50 flex flex-col items-center text-center border-b border-gray-100">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-semibold text-white text-lg mb-2.5 bg-green-700">
                    {profileInitials}
                  </div>
                  <div className="text-sm font-semibold text-gray-950">{profileName}</div>
                  <div className="text-[11px] font-semibold text-gray-600 mt-0.5">{profileEmail}</div>
                  <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full mt-2 border bg-green-50 text-green-800 border-green-200`}>
                    {profileRole}
                  </span>
                </div>
                <div className="p-1.5 space-y-0.5">
                  {tenant && (
                    <Link
                      to={paths.orgSettings(tenant)}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 rounded-xl"
                    >
                      <Settings2 size={15} className="text-gray-500" />
                      Settings
                    </Link>
                  )}
                  <button
                    onClick={() => { setShowUserMenu(false); onSignOut(); }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 rounded-xl"
                  >
                    <LogOut size={15} className="text-gray-500" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
      {hasSession && <NewResultsBanner />}

      {/* ── MAIN WORKSPACE ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── LEFT SIDEBAR ── */}
        {!isAiOnly && activeTab === 'monitor' && (
          <aside style={{ width: `${sidebarWidth}px` }} className="bg-white border-r border-gray-100 flex flex-col z-50 shadow-sm shrink-0 relative">
            {/* Draggable vertical divider */}
            <div 
              onMouseDown={startSidebarResize} 
              className="absolute right-[-4px] top-0 bottom-0 w-2 cursor-col-resize hover:bg-green-500/50 active:bg-green-500 transition-colors z-50"
            />
            <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8">

              {/* MAIN */}
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-gray-600 px-3 mb-3">Main</div>
                {pick([
                  { id: 'analytics',           label: 'Analytics Hub',       icon: <LayoutDashboard size={17} /> },
                  { id: 'intelligence-layers', label: 'Map',                 icon: <MapIcon size={17} /> },
                  { id: 'crop-health',         label: 'Crop Health',         icon: <Activity size={17} /> },
                  { id: 'crop-yield',          label: 'Crop Yield',          icon: <TrendingUp size={17} /> },
                  { id: 'moisture-content',    label: 'Moisture Content',    icon: <Droplets size={17} /> },
                  { id: 'climate',             label: 'Climate',             icon: <CloudRain size={17} /> },
                  { id: 'land-restoration',    label: 'Land Restoration',    icon: <Leaf size={17} /> },
                  { id: 'alerts',              label: 'Alerts',              icon: <AlertTriangle size={17} />, badge: alerts.filter(a => a.status === 'Active').length },
                  // Service-only page kinds: pick() keeps them only when the service lists them
                  ...(service ? [{ id: 'register', label: 'Register', icon: <RegisterIcon size={17} /> }, { id: 'check', label: 'Check', icon: <CheckIcon size={17} /> }, { id: 'advice', label: 'Advice', icon: <AdviceIcon size={17} /> },
                    { id: 'members', label: 'Members', icon: <MembersIcon size={17} /> }, { id: 'forms', label: 'Forms', icon: <FormsIcon size={17} /> }, { id: 'submissions', label: 'Answers', icon: <AnswersIcon size={17} /> },
                    { id: 'group-carbon', label: 'Group carbon', icon: <CarbonIcon size={17} /> }, { id: 'eudr-passport', label: 'EUDR passport', icon: <PassportIcon size={17} /> }] : []),
                ], pageSet?.sidebar).map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleSidebarClick(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all ${
                      activeSidebarItem === item.id
                        ? 'text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    style={{ backgroundColor: activeSidebarItem === item.id ? ('#3F8432') : undefined }}
                  >
                    <span className={activeSidebarItem === item.id ? 'text-white' : 'text-gray-600'}>
                      {item.icon}
                    </span>
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge > 0 && (
                      <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${activeSidebarItem === item.id ? 'bg-white/25 text-white' : 'bg-green-100 text-green-700'}`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* TOOLS */}
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-gray-600 px-3 mb-3">Tools</div>
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
                    <div className="text-[11px] font-bold text-green-700 px-1">Active Date Slot</div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => setActiveDateSlot('A')}
                        className={`py-2 px-1.5 rounded-lg text-[11px] font-semibold text-center border transition-all ${
                          activeDateSlot === 'A'
                            ? 'bg-green-600 text-white border-green-600 shadow-sm'
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        Left
                      </button>
                      <button
                        onClick={() => setActiveDateSlot('B')}
                        className={`py-2 px-1.5 rounded-lg text-[11px] font-semibold text-center border transition-all ${
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
                <div className="text-[11px] font-bold text-gray-600 px-3 mb-3">Settings</div>
                {[
                  { id: 'farm-data', label: 'Farm data',        icon: <UploadIcon size={17} /> },
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
                    style={{ backgroundColor: activeSidebarItem === item.id ? ('#3F8432') : undefined }}
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
            const ANALYTICS_SUBPAGES = pick([
              { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={15} /> },
              { id: 'vigor-health', label: 'Vigor & Phenology', icon: <TrendingUp size={15} /> },
              { id: 'moisture-et', label: 'Moisture & ET', icon: <Droplets size={15} /> },
              { id: 'et-log', label: 'ET Historical Log', icon: <Clock size={15} /> },
              { id: 'water-management', label: 'Water Management', icon: <Waves size={15} /> },
              { id: 'soil-nutrients', label: 'Soil & Nutrients', icon: <Sun size={15} /> },
            ], pageSet?.analytics);
            return (
              <div className="p-10 space-y-10">
                {/* Page header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight">{pageSet?.overviewTitle || 'Overview'}</h2>
                    <p className="text-sm text-gray-500 font-medium mt-2 max-w-lg">
                      {pageSet?.overviewText || 'How your fields are doing, from the latest satellite passes.'}
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
                      <span className="text-[11px] font-semibold text-gray-600">Estate</span>
                      <select
                        value={filterEstate}
                        onChange={e => handleEstateChange(e.target.value)}
                        className="bg-transparent text-xs font-bold text-gray-700 outline-none cursor-pointer pr-1"
                      >
                        <option value="All">All estates</option>
                        {estateOptions.map(sf => (
                          <option key={sf} value={sf}>{sf}</option>
                        ))}
                      </select>
                    </div>

                    {/* Plot Filter — populated from real plot IDs */}
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                      <span className="text-[11px] font-semibold text-gray-600">Plot</span>
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
                      <span className="text-[11px] font-semibold text-gray-600">Date</span>
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
                    {/* KPI cards: chosen per crop or service (dashboard/kpiCatalog.js) */}
                    <KpiCards serviceId={service?.id} cropType={cropType} ctx={kpiContext} />

                    {/* Charts chosen per crop or service (dashboard/charts/chartCatalog.js) */}
                    <OverviewCharts
                      charts={chartsFor(service?.id, cropType)}
                      trends={overviewTrends}
                      plots={plotsData}
                      classify={kpiContext.classify}
                      valueOf={blockValue}
                      primaryKey={kpiContext.primaryKey}
                      unitLabel={kpiContext.unitLabel}
                    />
                  </div>
                )}

                {activeAnalyticsSubpage === 'vigor-health' && (
                  <OverviewCharts
                    charts={healthChartsFor(service?.id, cropType)}
                    trends={overviewTrends}
                    plots={plotsData}
                    classify={kpiContext.classify}
                    valueOf={blockValue}
                    primaryKey={kpiContext.primaryKey}
                    unitLabel={kpiContext.unitLabel}
                  />
                )}

                {activeAnalyticsSubpage === 'moisture-et' && (
                  <OverviewCharts
                    charts={waterChartsFor(service?.id, cropType)}
                    trends={overviewTrends}
                    plots={plotsData}
                    classify={kpiContext.classify}
                    valueOf={blockValue}
                    primaryKey={kpiContext.primaryKey}
                    unitLabel={kpiContext.unitLabel}
                  />
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
                              <tr className="border-b border-gray-200 text-gray-600 font-semibold text-[11px]">
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
                              <div className="text-[11px] font-bold text-gray-600 mb-1">Avg. Crop Water Demand</div>
                              <div className="text-2xl font-bold text-gray-800">
                                {avgEtc != null ? `${avgEtc.toFixed(2)}` : '—'} <span className="text-xs font-semibold text-gray-600">mm/day</span>
                              </div>
                            </div>
                            <div className="border border-gray-100 rounded-xl p-4 bg-white shadow-sm">
                              <div className="text-[11px] font-bold text-gray-600 mb-1">Cumulative Rainfall</div>
                              <div className="text-2xl font-bold text-gray-800">
                                {farm.cumulative_rainfall_mm != null ? farm.cumulative_rainfall_mm.toFixed(1) : '—'} <span className="text-xs font-semibold text-gray-600">mm</span>
                              </div>
                            </div>
                            <div className="border border-gray-100 rounded-xl p-4 bg-white shadow-sm">
                              <div className="text-[11px] font-bold text-gray-600 mb-1">Irrigation Efficiency</div>
                              <div className="text-2xl font-bold text-gray-800">
                                {farm.irrigation_efficiency != null ? `${(farm.irrigation_efficiency * 100).toFixed(0)}%` : '—'}
                              </div>
                              <div className="text-[11px] text-gray-600 mt-1">Rainfall received / crop water demand over the run period</div>
                            </div>
                          </div>

                          {/* Per-plot ETc table */}
                          <div className="border border-gray-100 rounded-xl bg-white shadow-sm overflow-hidden">
                            <div className="px-4 py-3 border-b border-gray-100 text-xs font-bold text-gray-700">Per-Plot Crop Water Demand</div>
                            <div className="max-h-80 overflow-y-auto">
                              <table className="w-full text-xs">
                                <thead className="bg-gray-50 text-gray-600 text-[11px]">
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
                          Canopy signals {renderInfoTooltip("Nutrient Profiling")}</h3>
                        <p className="text-xs text-gray-500 -mt-2">Satellite signals for the selected date, scaled 0–100. They show canopy condition, not soil nutrients.</p>
                        <div className="h-[320px] flex items-center justify-center">
                          {!nutrientData.hasData ? <div className="text-sm text-gray-500 text-center px-6">No clear satellite image for this date yet. The signals appear once the monitoring pipeline has processed images for this farm.</div> : <Radar
                            data={nutrientData}
                            options={{
                              scales: { r: { angleLines: { display: false }, suggestedMin: 0, suggestedMax: 100, ticks: { display: false }, pointLabels: { font: { size: 11, weight: '600' } } } },
                              plugins: { legend: { display: false } }
                            }}
                          />}
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
                            <h4 className="text-[11px] font-semibold text-gray-600">Diagnostic Metrics</h4>
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
                            <h4 className="text-[11px] font-semibold text-gray-600">Agronomic Recommendations</h4>
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
                    {null}
                    <FitBoundsToPlots plotsData={filteredPlotsData} farmBoundary={farmBoundary} refitKey={filterEstate} />
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
                          className="flex items-center gap-1 text-[11px] font-bold text-gray-600 hover:text-gray-800 cursor-pointer select-none transition-colors"
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
                    {null}
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
                          className="flex items-center gap-1 text-[11px] font-bold text-gray-600 hover:text-gray-800 cursor-pointer select-none transition-colors"
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
                    <FitBoundsToPlots plotsData={plotsData} farmBoundary={farmBoundary} refitKey={filterEstate} />
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
                          className="flex items-center gap-1 text-[11px] font-bold text-gray-600 hover:text-gray-800 cursor-pointer select-none transition-colors"
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
                          className="flex items-center gap-1 text-[11px] font-bold text-gray-600 hover:text-gray-800 cursor-pointer select-none transition-colors"
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
                          className="flex items-center gap-1 text-[11px] font-bold text-gray-600 hover:text-gray-800 cursor-pointer select-none transition-colors"
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
                          className="flex items-center gap-1 text-[11px] font-bold text-gray-600 hover:text-gray-800 cursor-pointer select-none transition-colors"
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
                          className="flex items-center gap-1 text-[11px] font-bold text-gray-600 hover:text-gray-800 cursor-pointer select-none transition-colors"
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
                          className="flex items-center gap-1 text-[11px] font-bold text-gray-600 hover:text-gray-800 cursor-pointer select-none transition-colors"
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
                          className="flex items-center gap-1 text-[11px] font-bold text-gray-600 hover:text-gray-800 cursor-pointer select-none transition-colors"
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
                          className="flex items-center gap-1 text-[11px] font-bold text-gray-600 hover:text-gray-800 cursor-pointer select-none transition-colors"
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
            <AlertsPage
              alerts={alerts}
              places={plotsData}
              serviceId={service?.id}
              cropType={cropType}
              onAcknowledge={handleAcknowledgeAlert}
              onAcknowledgeAll={(ids) => ids.forEach(handleAcknowledgeAlert)}
              onLocate={(plotId) => { setActiveSidebarItem('intelligence-layers'); setSelectedPlot(plotId); }}
            />
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
                          className="flex items-center gap-1 text-[11px] font-bold text-gray-600 hover:text-gray-800 cursor-pointer select-none transition-colors"
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
                          className="flex items-center gap-1 text-[11px] font-bold text-gray-600 hover:text-gray-800 cursor-pointer select-none transition-colors"
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
                          className="flex items-center gap-1 text-[11px] font-bold text-gray-600 hover:text-gray-800 cursor-pointer select-none transition-colors"
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
            <VerificationPage plots={plotsData} serviceId={service?.id} onOpenData={(id) => { setDataFocus(id); setActiveTab('monitor'); setActiveSidebarItem('farm-data'); }} />
          )}

          {((isAiOnly && activeTab === 'reports') || (activeSidebarItem === 'analytics' && activeTab === 'reports')) && (
            <ReportBuilder
              plots={plotsData}
              alerts={alerts}
              estates={estateOptions}
              tenant={tenant}
              orgName={tenantDisplayName}
              subject={service ? `${tenantDisplayName} ${service.title}` : isOrg ? tenantDisplayName : `${tenantDisplayName} ${cropLabel}`}
              cropType={cropType}
            />
          )}

          {/* ══════════════════════════════════════════════════════════════
              AI ASSISTANT
          ══════════════════════════════════════════════════════════════ */}
          {((isAiOnly && activeTab === 'ai-assistant') || (activeSidebarItem === 'analytics' && activeTab === 'ai-assistant')) && (
            <div className="flex flex-col flex-1 h-full bg-white overflow-hidden">
              
              {/* Header */}
              <div className="px-8 py-3.5 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center text-green-700">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-gray-900">Farm AI Advisor</span>
                  </div>
                </div>

                {chatMessages.length > 1 && (
                  <button
                    onClick={() => setChatMessages([{
                      sender: 'assistant',
                      text: "Ask about your crop condition, water or weather, or choose a what-if scenario. Answers use your own monitoring data."
                    }])}
                    className="px-3.5 py-1.5 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-xs font-bold text-gray-700 transition-colors shadow-xs flex items-center gap-1.5"
                  >
                    <SlidersHorizontal size={13} className="text-green-700" />
                    <span>Back to Scenario Modeller</span>
                  </button>
                )}
              </div>

              {/* Main Content Area */}
              <div className="flex-1 overflow-y-auto flex flex-col min-h-0 bg-gray-50/20">
                {chatMessages.length === 1 ? (
                  /* Landing Empty State (Plot layout) */
                  <div className="flex-1 flex flex-col justify-center items-center px-6 py-10">
                    <ScenarioBuilder
                      cropType={isOrg ? null : cropType}
                      serviceId={service?.id}
                      estates={estateOptions}
                      onRun={(text, meta) => handleChatSubmit(text, meta)}
                    />
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

          {activeSidebarItem === 'check' && service?.check && (
            <CheckPage page={service.check} plots={plotsData} onOpenData={() => setActiveSidebarItem('farm-data')} />
          )}
          {activeSidebarItem === 'advice' && service?.advice && (
            <AdvicePage page={service.advice} alerts={alerts} onAsk={(q) => { setActiveSidebarItem('analytics'); setActiveTab('ai-assistant'); handleChatSubmit(q); }} />
          )}

          {activeSidebarItem === 'members' && <MembersPage onOpenForms={() => handleSidebarClick('forms')} onOpenAnswers={() => handleSidebarClick('submissions')} />}
          {activeSidebarItem === 'forms' && <FormsPage onOpenAnswers={(id) => { setAnswersForm(id); setActiveSidebarItem('submissions'); }} />}
          {activeSidebarItem === 'submissions' && <SubmissionsPage key={answersForm || 'all'} formId={answersForm} />}
          {activeSidebarItem === 'group-carbon' && <GroupCarbonPage />}
          {activeSidebarItem === 'eudr-passport' && <EudrPassportPage />}

          {activeSidebarItem === 'register' && service?.register && (
            <RegisterPage register={service.register} plots={plotsData} />
          )}

          {activeSidebarItem === 'farm-data' && (
            <FarmDataPage key={dataFocus || 'data'} cropType={isOrg ? null : cropType} serviceId={service?.id} plots={plots} initialDataset={dataFocus} />
          )}



          {activeSidebarItem === 'help' && (
            <CropGlossary entries={cropProfileEntries} extra={pageSet?.glossary} cropName={service ? service.title : isOrg ? '' : cropLabel} focusKey={glossaryFocus} />
          )}
        </main>
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
