import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Trash2, Eye, Activity, Search } from 'lucide-react';
import { fetchOrganizations, fetchFarms, fetchMinioInventory, syncDatabaseWithMinio, deleteMinioObject, fetchMinioObjectContent } from '../../services/adminApi';
import { useConfirm } from '../components/ConfirmProvider';
import ErrorBanner from '../components/ErrorBanner';
import { inputCls } from '../components/formHelpers';
import { Page, Card, CardHeader, Button, IconButton, Field, Pill, Tabs, Table, Td, Empty, Loading, Note, Stat, Modal } from '../components/ui';
import { isViewable, isExecutionLog, formatSize, TYPE_COLOURS, typeShares, SYNC_STATUS, registryVsStorage } from './inventory/inventoryHelpers';
import { copyText } from '../../utils/copyText';

/**
 * Storage: what the pipeline and onboarding have written to object storage,
 * checked against the estate registry, with a file explorer for clean-up.
 */
const Inventory = () => {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [orgs, setOrgs] = useState([]);
  const [farms, setFarms] = useState([]);
  const [files, setFiles] = useState([]);
  const [org, setOrg] = useState('');
  const [farm, setFarm] = useState('');
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('registry');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [viewing, setViewing] = useState(null);

  const load = async () => {
    setLoading(true); setError('');
    try {
      const [o, f, m] = await Promise.all([fetchOrganizations(), fetchFarms(), fetchMinioInventory(org, farm)]);
      setOrgs(Array.isArray(o) ? o : o?.items || []); setFarms(f); setFiles(m.items || []);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [org, farm]); // eslint-disable-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps

  const sync = async () => {
    setSyncing(true); setError(''); setNotice('');
    try { const res = await syncDatabaseWithMinio(); setNotice(res.message || 'Registry brought in step with storage.'); await load(); } catch (e) { setError(e.message); } finally { setSyncing(false); }
  };
  const remove = async (key) => {
    if (!(await confirm(`Delete this file from storage permanently?\n\n${key}\n\nIf it is an estate boundary, the registry is updated.`))) return;
    try { await deleteMinioObject(key); setNotice(`Deleted ${key.split('/').pop()}.`); await load(); } catch (e) { setError(e.message); }
  };

  const shares = useMemo(() => typeShares(files), [files]);
  const q = search.toLowerCase();
  const registryRows = useMemo(() => registryVsStorage(
    farms.filter((f) => (!org || f.company_id === org) && (!farm || f.farm_id === farm) && (!q || `${f.farm_name} ${f.farm_id}`.toLowerCase().includes(q))),
    files,
  ), [farms, files, org, farm, q]);
  const fileRows = useMemo(() => files.filter((f) => !q || `${f.key} ${f.file_type}`.toLowerCase().includes(q)), [files, q]);
  const problems = registryRows.filter((r) => r.status === 'missing' || r.status === 'orphan').length;

  return (
    <Page
      wide
      eyebrow="Operations"
      title="Storage"
      text="What is stored for each organisation and estate, whether it matches the estate registry, and the files themselves."
      actions={<>
        <Button variant="secondary" onClick={load} disabled={loading}><RefreshCw size={15} className={loading ? 'animate-spin' : ''} />Refresh</Button>
        <Button onClick={sync} disabled={syncing}><RefreshCw size={15} className={syncing ? 'animate-spin' : ''} />{syncing ? 'Bringing in step…' : 'Bring registry in step'}</Button>
      </>}
    >
      <ErrorBanner message={error} onDismiss={() => setError('')} onRetry={load} />
      {notice && <Note tone="good">{notice}</Note>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Files in storage" value={files.length.toLocaleString()} />
        <Stat label="Space used" value={formatSize(shares.total)} />
        <Stat label="Estates in the registry" value={farms.length} sub={problems ? `${problems} not in step with storage` : 'All in step'} />
        <Stat label="Organisations" value={orgs.length} />
      </div>

      {files.length > 0 && (
        <Card>
          <CardHeader title="Space by kind of file" text={`${formatSize(shares.total)} in total`} />
          <div className="px-6 py-5 space-y-4">
            <div className="flex h-4 w-full rounded-full overflow-hidden bg-gray-100">
              {shares.list.filter((t) => t.pct > 0).map((t) => <div key={t.type} className={TYPE_COLOURS[t.type] || TYPE_COLOURS.Other} style={{ width: `${t.pct}%` }} title={`${t.type}: ${t.pct.toFixed(1)}%`} />)}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {shares.list.map((t) => (
                <div key={t.type} className="flex items-start gap-2 text-sm">
                  <span className={`mt-1.5 w-2.5 h-2.5 rounded-full ${TYPE_COLOURS[t.type] || TYPE_COLOURS.Other}`} />
                  <div><p className="text-gray-900">{t.type}</p><p className="text-xs text-gray-500">{t.count} file{t.count === 1 ? '' : 's'} · {formatSize(t.size)} · {t.pct.toFixed(1)}%</p></div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="Organisation">
          <select className={inputCls} value={org} onChange={(e) => { setOrg(e.target.value); setFarm(''); }}>
            <option value="">All organisations</option>
            {orgs.map((o) => <option key={o.schema_name} value={o.schema_name}>{o.display_name}</option>)}
          </select>
        </Field>
        <Field label="Estate">
          <select className={inputCls} value={farm} onChange={(e) => setFarm(e.target.value)}>
            <option value="">All estates</option>
            {farms.filter((f) => !org || f.company_id === org).map((f) => <option key={f.farm_id} value={f.farm_id}>{f.farm_name}</option>)}
          </select>
        </Field>
        <Field label="Search">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className={`${inputCls} pl-10`} value={search} onChange={(e) => setSearch(e.target.value)} placeholder={tab === 'registry' ? 'Estate name or id' : 'File path or kind'} />
          </div>
        </Field>
      </div>

      <Tabs value={tab} onChange={(t) => { setTab(t); setSearch(''); }} tabs={[
        { id: 'registry', label: 'Registry and storage', count: registryRows.length },
        { id: 'files', label: 'Files', count: fileRows.length },
      ]} />

      {loading ? <Loading /> : tab === 'registry' ? (
        registryRows.length === 0 ? <Empty>No estates match.</Empty> : (
          <Table columns={[{ label: 'Estate' }, { label: 'Organisation' }, { label: 'Boundary' }, { label: 'Storage' }, { label: 'File' }, { label: 'Size' }, { label: 'Changed' }]}>
            {registryRows.map(({ farm: f, status, path, size, modified }) => {
              const [label, tone] = SYNC_STATUS[status];
              return (
                <tr key={`${f.company_id}-${f.farm_id}`}>
                  <Td><p className="font-semibold text-gray-900">{f.farm_name}</p><p className="text-xs text-gray-500 font-mono">{f.farm_id}</p></Td>
                  <Td className="text-gray-700">{orgs.find((o) => o.schema_name === f.company_id)?.display_name || f.company_id}</Td>
                  <Td><Pill tone={f.boundary_uploaded ? 'good' : 'neutral'}>{f.boundary_uploaded ? 'Uploaded' : 'Not uploaded'}</Pill></Td>
                  <Td><Pill tone={tone}>{label}</Pill></Td>
                  <Td className="text-xs font-mono text-gray-600 max-w-xs truncate" title={path}>{path}</Td>
                  <Td className="text-gray-700 font-mono">{size}</Td>
                  <Td className="text-gray-600 text-xs">{modified}</Td>
                </tr>
              );
            })}
          </Table>
        )
      ) : fileRows.length === 0 ? <Empty>No files match.</Empty> : (
        <Table columns={[{ label: 'File' }, { label: 'Kind' }, { label: 'Size' }, { label: 'Changed' }, { label: '', className: 'w-28' }]}>
          {fileRows.map((file) => (
            <tr key={file.key}>
              <Td className="text-xs font-mono text-gray-800 max-w-md break-all">{file.key}</Td>
              <Td><Pill>{file.file_type}</Pill></Td>
              <Td className="font-mono text-gray-700">{formatSize(file.size_bytes)}</Td>
              <Td className="text-xs text-gray-600">{new Date(file.last_modified).toLocaleString()}</Td>
              <Td>
                <div className="flex justify-end gap-1">
                  {isExecutionLog(file.key)
                    ? <IconButton label="Open on the Logs page" onClick={() => navigate('/admin/logs', { state: { tab: 'pipeline', highlightKey: file.key } })}><Activity size={15} /></IconButton>
                    : isViewable(file.key) && <IconButton label="View" onClick={() => setViewing(file)}><Eye size={15} /></IconButton>}
                  <IconButton label="Delete" danger onClick={() => remove(file.key)}><Trash2 size={15} /></IconButton>
                </div>
              </Td>
            </tr>
          ))}
        </Table>
      )}

      {viewing && <FileViewer file={viewing} onClose={() => setViewing(null)} />}
    </Page>
  );
};

function FileViewer({ file, onClose }) {
  const [content, setContent] = useState('');
  const [state, setState] = useState('loading');
  const [error, setError] = useState('');
  useEffect(() => {
    let live = true;
    fetchMinioObjectContent(file.key)
      .then((res) => {
        let text = res.content;
        if (/\.(geo)?json$/i.test(file.key)) { try { text = JSON.stringify(JSON.parse(res.content), null, 2); } catch { /* show as stored */ } }
        if (live) { setContent(text); setState('ready'); }
      })
      .catch((e) => { if (live) { setError(e.message); setState('error'); } });
    return () => { live = false; };
  }, [file.key]);
  return (
    <Modal size="xl" title={file.key.split('/').pop()} text={file.key} onClose={onClose}
      footer={<><Button variant="secondary" onClick={() => copyText(content)} disabled={!content}>Copy</Button><Button onClick={onClose}>Close</Button></>}>
      {state === 'loading' && <Loading />}
      {state === 'error' && <p className="text-sm text-red-800">{error}</p>}
      {state === 'ready' && <pre className="text-xs font-mono text-gray-800 bg-gray-50 border border-gray-200 rounded-xl p-4 max-h-[60vh] overflow-auto whitespace-pre-wrap">{content}</pre>}
    </Modal>
  );
}

export default Inventory;
