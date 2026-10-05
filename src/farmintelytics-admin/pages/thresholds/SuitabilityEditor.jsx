import { useCallback, useEffect, useState } from 'react';
import { fetchSuitabilityThresholds, saveSuitabilityThreshold } from '../../../services/adminApi';
import { inputCls } from '../../components/formHelpers';
import { Card, CardHeader, Button, Field, Loading, Table, Td } from '../../components/ui';

const ACTIONS = [
  { key: 'slope', label: 'When slope limits the field', placeholder: 'e.g. Terrace or plant along the contour before planting' },
  { key: 'rainfall', label: 'When rainfall or the dry season limits it', placeholder: 'e.g. Plan irrigation or a drought-tolerant variety' },
  { key: 'soil_ph', label: 'When soil acidity or texture limits it', placeholder: 'e.g. Lime after a soil test' },
  { key: 'drainage', label: 'When waterlogging or flooding limits it', placeholder: 'e.g. Open drains before planting' },
];

/**
 * Suitability settings for one crop (team tool): the factor ranges for each
 * class and the advice shown when a factor limits a field.
 */
const SuitabilityEditor = ({ cropType, companyId, onError }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(() => fetchSuitabilityThresholds(cropType, companyId), [cropType, companyId]);
  useEffect(() => {
    let live = true;
    load().then((d) => { if (live) { setData(d); setLoading(false); } }).catch((e) => { if (live) { onError(e.message); setLoading(false); } });
    return () => { live = false; };
  }, [load, onError]);

  const setFactor = (i, field, value) => setData((d) => ({ ...d, factors: d.factors.map((f, j) => (j === i ? { ...f, [field]: value } : f)) }));
  const setAction = (key, value) => setData((d) => ({ ...d, farmer_actions: { ...(d.farmer_actions || {}), [key]: value } }));

  const save = async () => {
    setSaving(true);
    try {
      await saveSuitabilityThreshold({ crop_type: cropType, company_id: companyId, relevance: data.relevance, variants: data.variants, factors: data.factors, farmer_actions: data.farmer_actions, exclusions: data.exclusions });
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch (e) { onError(e.message); } finally { setSaving(false); }
  };

  if (loading) return <Loading>Loading suitability settings…</Loading>;
  if (!data) return null;

  return (
    <Card>
      <CardHeader title="Suitability settings" text="Factor ranges for each class, and the advice shown when a factor limits a field. Used by the crop suitability tool."
        actions={<Button className="!py-2" onClick={save} disabled={saving}>{saved ? 'Saved' : saving ? 'Saving…' : 'Save'}</Button>} />
      <div className="px-6 py-5 space-y-6">
        <Table columns={[{ label: 'Factor' }, { label: 'Unit' }, { label: 'Well suited' }, { label: 'Suited' }, { label: 'Marginal' }, { label: 'Not suited' }]}>
          {(data.factors || []).map((f, i) => (
            <tr key={f.name || i}>
              <Td className="font-semibold text-gray-900">{f.name}</Td>
              <Td className="font-mono text-xs text-gray-500">{f.unit}</Td>
              {['optimal', 'suitable', 'marginal', 'unsuitable'].map((k) => (
                <Td key={k} className="!py-2"><input className={`${inputCls} font-mono`} value={f[k] || ''} onChange={(e) => setFactor(i, k, e.target.value)} /></Td>
              ))}
            </tr>
          ))}
        </Table>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ACTIONS.map((a) => (
            <Field key={a.key} label={a.label}>
              <input className={inputCls} value={data.farmer_actions?.[a.key] || ''} onChange={(e) => setAction(a.key, e.target.value)} placeholder={a.placeholder} />
            </Field>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default SuitabilityEditor;
