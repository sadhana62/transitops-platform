import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import StatusTag from '../components/StatusTag';
import Modal from '../components/Modal';
import { Field, Input, Select, Banner, PrimaryButton, SecondaryButton } from '../components/FormField';

const EMPTY_FORM = {
  name: '', licenseNumber: '', licenseCategory: '', licenseExpiryDate: '', contactNumber: '', safetyScore: 100, status: 'Available',
};

function isExpired(dateStr) {
  return new Date(dateStr) < new Date();
}

export default function Drivers() {
  const { user } = useAuth();
  const canManage = user?.role === 'FleetManager' || user?.role === 'SafetyOfficer';
  const canDelete = user?.role === 'FleetManager';

  const [drivers, setDrivers] = useState([]);
  const [meta, setMeta] = useState({ statuses: [] });
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    const params = {};
    if (statusFilter) params.status = statusFilter;
    api.get('/drivers', { params }).then(({ data }) => setDrivers(data)).finally(() => setLoading(false));
  };

  useEffect(() => {
    api.get('/drivers/meta').then(({ data }) => setMeta(data));
  }, []);

  useEffect(load, [statusFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError('');
    setModalOpen(true);
  };

  const openEdit = (d) => {
    setEditing(d);
    setForm({
      name: d.name, licenseNumber: d.licenseNumber, licenseCategory: d.licenseCategory,
      licenseExpiryDate: d.licenseExpiryDate?.slice(0, 10) || '', contactNumber: d.contactNumber,
      safetyScore: d.safetyScore, status: d.status,
    });
    setError('');
    setModalOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, safetyScore: Number(form.safetyScore) };
      if (editing) {
        await api.put(`/drivers/${editing._id}`, payload);
      } else {
        await api.post('/drivers', payload);
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save driver.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (d) => {
    if (!confirm(`Delete driver ${d.name}? This cannot be undone.`)) return;
    try {
      await api.delete(`/drivers/${d._id}`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not delete driver.');
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="mono text-[10px] uppercase tracking-widest text-base-400">Driver Management</p>
          <h1 className="font-display text-2xl font-semibold">Driver profiles</h1>
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-36">
            <option value="">All statuses</option>
            {meta.statuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
          {canManage && (
            <PrimaryButton onClick={openCreate} className="flex items-center gap-1.5">
              <Plus className="h-4 w-4" /> Add driver
            </PrimaryButton>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded border border-base-700 bg-base-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-base-700 text-left text-[11px] uppercase tracking-wide text-base-400">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">License No.</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">License Expiry</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Safety Score</th>
              <th className="px-4 py-3">Status</th>
              {canManage && <th className="px-4 py-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-6 text-center text-base-400">Loading…</td></tr>
            ) : drivers.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-6 text-center text-base-400">No drivers registered yet.</td></tr>
            ) : drivers.map((d) => (
              <tr key={d._id} className="border-b border-base-800 last:border-0 hover:bg-base-800/50">
                <td className="px-4 py-3">{d.name}</td>
                <td className="mono px-4 py-3">{d.licenseNumber}</td>
                <td className="px-4 py-3">{d.licenseCategory}</td>
                <td className="px-4 py-3">
                  <span className={isExpired(d.licenseExpiryDate) ? 'flex items-center gap-1 text-danger-500' : ''}>
                    {isExpired(d.licenseExpiryDate) && <AlertTriangle className="h-3.5 w-3.5" />}
                    {new Date(d.licenseExpiryDate).toLocaleDateString()}
                  </span>
                </td>
                <td className="px-4 py-3">{d.contactNumber}</td>
                <td className="px-4 py-3">{d.safetyScore}</td>
                <td className="px-4 py-3"><StatusTag status={d.status} /></td>
                {canManage && (
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(d)} className="text-base-400 hover:text-signal-500"><Pencil className="h-4 w-4" /></button>
                      {canDelete && (
                        <button onClick={() => remove(d)} className="text-base-400 hover:text-danger-500"><Trash2 className="h-4 w-4" /></button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit driver' : 'Add driver'}>
        {error && <Banner tone="danger">{error}</Banner>}
        <form onSubmit={submit}>
          <Field label="Full name" required>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="License number" required>
              <Input value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} required />
            </Field>
            <Field label="License category" required>
              <Input value={form.licenseCategory} onChange={(e) => setForm({ ...form, licenseCategory: e.target.value })} required placeholder="LMV / HMV" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="License expiry date" required>
              <Input type="date" value={form.licenseExpiryDate} onChange={(e) => setForm({ ...form, licenseExpiryDate: e.target.value })} required />
            </Field>
            <Field label="Contact number" required>
              <Input value={form.contactNumber} onChange={(e) => setForm({ ...form, contactNumber: e.target.value })} required />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Safety score (0-100)">
              <Input type="number" min="0" max="100" value={form.safetyScore} onChange={(e) => setForm({ ...form, safetyScore: e.target.value })} />
            </Field>
            {editing && (
              <Field label="Status">
                <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {meta.statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                </Select>
              </Field>
            )}
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <SecondaryButton type="button" onClick={() => setModalOpen(false)}>Cancel</SecondaryButton>
            <PrimaryButton type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save driver'}</PrimaryButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
