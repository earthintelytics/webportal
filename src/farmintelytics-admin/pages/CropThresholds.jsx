import { useCallback, useEffect, useState } from 'react';
import { fetchCropThresholds, fetchOrganizations } from '../../services/adminApi';
import ErrorBanner from '../components/ErrorBanner';
import { ALL_CROPS, inputCls } from '../components/formHelpers';
import { CROP_LABELS } from '../components/orgConstants';
import { Page, Field, Chip, Tabs, Loading, Empty } from '../components/ui';
import LegendEditor from './thresholds/LegendEditor';
import SuitabilityEditor from './thresholds/SuitabilityEditor';

/**
 * Interpretation settings, owned by the FarmIntelytics team: map classes
 * (the words, colours and advice clients see) for the satellite pictures and
 * for the results blocks are coloured by (rain, heat, harvest, restoration),
 * and the crop suitability factors. Set for every organisation, or for one.
 */
const CropThresholds = () => {
  const [tab, setTab] = useState('map');
  const [crop, setCrop] = useState('ffb');
  const [companyId, setCompanyId] = useState('');
  const [orgs, setOrgs] = useState([]);
  const [items, setItems] = useState([]);
  const [layers, setLayers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCropThresholds(crop, companyId);
      const list = data.indices || [];
      const lay = data.layers || [];
      setItems(list);
      setLayers(lay);
      const all = [...list, ...lay];
      setSelected((prev) => (all.some((i) => i.index_key === prev) ? prev : all[0]?.index_key || null));
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }, [crop, companyId]);

  useEffect(() => { if (tab === 'map') load(); }, [load, tab]); // eslint-disable-line react-hooks/set-state-in-effect
  useEffect(() => { fetchOrganizations().then((o) => setOrgs(Array.isArray(o) ? o : o?.items || [])).catch(() => {}); }, []);

  const item = [...items, ...layers].find((i) => i.index_key === selected) || null;
  const group = (title, text, list) => list.length > 0 && (
    <div className="space-y-2">
      <div><p className="text-sm font-semibold text-gray-900">{title}</p><p className="text-xs text-gray-500">{text}</p></div>
      <div className="flex flex-wrap gap-2">
        {list.map((i) => <Chip key={i.index_key} on={i.index_key === selected} onClick={() => setSelected(i.index_key)}>{i.label}{i.calibrated ? ' ·' : ''}</Chip>)}
      </div>
    </div>
  );

  return (
    <Page
      eyebrow="Interpretation"
      title="Map classes and suitability"
      text="What clients see on their maps (class words, colours, value ranges and advice) and how land suitability is judged. Set for every organisation or for one. A dot after a name means it was changed from the default."
    >
      <Tabs value={tab} onChange={(t) => { if (t !== 'map' && crop === 'all') setCrop('ffb'); setTab(t); }} tabs={[{ id: 'map', label: 'Map classes' }, { id: 'suitability', label: 'Suitability' }]} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
        <Field label="Crop">
          <select className={inputCls} value={crop} onChange={(e) => setCrop(e.target.value)}>
            {ALL_CROPS.map((c) => <option key={c} value={c}>{CROP_LABELS[c] || c}</option>)}
            {tab === 'map' && <option value="all">Every crop and service (restoration, weather)</option>}
          </select>
        </Field>
        <Field label="Applies to">
          <select className={inputCls} value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
            <option value="">Every organisation (platform default)</option>
            {orgs.map((o) => <option key={o.schema_name} value={o.schema_name}>{o.display_name} only</option>)}
          </select>
        </Field>
      </div>

      <ErrorBanner message={error} onDismiss={() => setError('')} onRetry={load} />

      {tab === 'map' ? (
        loading ? <Loading /> : items.length + layers.length === 0 ? <Empty>No map classes for this crop.</Empty> : (
          <>
            {group('Satellite pictures', 'The colours of the satellite picture on the map pages.', items)}
            {group('Results on the map', 'The colours blocks and zones get from “Colour by” on the map pages. A crop’s own classes come before “Every crop and service”.', layers)}
            {item && <LegendEditor key={`${crop}-${companyId}-${item.index_key}`} item={item} cropType={crop} companyId={companyId} onSaved={load} onError={setError} />}
          </>
        )
      ) : (
        <SuitabilityEditor key={`${crop}-${companyId}`} cropType={crop} companyId={companyId} onError={setError} />
      )}
    </Page>
  );
};

export default CropThresholds;
