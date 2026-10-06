import { Download } from 'lucide-react';
import { Card, StatusPill } from '../../../components/page/PageKit';
import { DATASET_DEFINITIONS } from '../../data/datasetDefinitions';
import { templateCsv } from '../../data/tabular';
import { dataForCrop } from '../suitabilityData';

const download = (name, text) => {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv' }));
  Object.assign(document.createElement('a'), { href: url, download: `${name}.csv` }).click();
  URL.revokeObjectURL(url);
};

/**
 * What the client can add to make this crop's analysis better. The client
 * uploads it in Farm data (any of their services); every analysis for their
 * organisation then uses it. Global layers are fetched by the pipeline anyway.
 */
const CropDataPanel = ({ crop }) => {
  const items = dataForCrop(crop.id).map((i) => ({ ...i, def: DATASET_DEFINITIONS.find((d) => d.id === i.dataset) })).filter((i) => i.def);
  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-600 max-w-3xl">
        Every analysis runs on rainfall, temperature, terrain, soil maps, flooding, forest in 2020 and protected areas, fetched by the pipeline.
        The client's own records below make the answer for {crop.name.toLowerCase()} sharper. They upload them in <span className="font-semibold">Farm data</span> in any of their services, in their own column names; the next analysis uses them.
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {items.map(({ def, level, why }) => (
          <Card key={def.id} className="p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display font-semibold text-gray-900">{def.name}</p>
                <p className="text-sm text-gray-600 mt-1">{why}</p>
              </div>
              <span className="shrink-0 whitespace-nowrap"><StatusPill tone={level === 'most' ? 'good' : 'neutral'}>{level === 'most' ? 'Most useful' : 'Helps'}</StatusPill></span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {def.columns.filter((c) => c.required).map((c) => (
                <span key={c.name} className="text-xs px-2 py-0.5 rounded-md bg-gray-100 text-gray-700" title={c.definition}>{c.definition.split(' (')[0]}{c.unit ? ` (${c.unit})` : ''}</span>
              ))}
            </div>
            <button type="button" onClick={() => download(def.id, templateCsv(def.columns))} className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-700 hover:text-green-800">
              <Download size={15} /> Template with our columns
            </button>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CropDataPanel;
