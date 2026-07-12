import { useEffect, useState } from 'react';
import { Plus, Send, CheckCircle2, XCircle } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import StatusTag from '../components/StatusTag';
import Modal from '../components/Modal';
import { Field, Input, Select, Banner, PrimaryButton, SecondaryButton } from '../components/FormField';

const EMPTY_TRIP_FORM = {
  source: '', destination: '', vehicle: '', driver: '', cargoWeight: '', plannedDistance: '', revenue: '',
};
const EMPTY_COMPLETE_FORM = { finalOdometer: '', fuelConsumed: '', fuelCost: '' };

export default function Trips() {
  const { user } = useAuth();
  const canCreate = user?.role === 'FleetManager' || user?.role === 'Driver';

  const [trips, setTrips] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [availableDrivers, setAvailableDrivers] = useState([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_TRIP_FORM);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [completeTrip, setCompleteTrip] = useState(null);
  const [completeForm, setCompleteForm] = useState(EMPTY_COMPLETE_FORM);
  const [completeError, setCompleteError] = useState('');

  const loadDispatchOptions = async () => {
    const [vehiclesRes, driversRes] = await Promise.all([
      api.get('/vehicles', { params: { availableForDispatch: true } }),
      api.get('/drivers', { params: { availableForDispatch: true } }),
    ]);

    setAvailableVehicles(vehiclesRes.data);
    setAvailableDrivers(driversRes.data);
  };

  const load = () => {
    setLoading(true);
    const params = {};
    if (statusFilter) params.status = statusFilter;
    api.get('/trips', { params }).then(({ data }) => setTrips(data)).finally(() => setLoading(false));
  };

  useEffect(load, [statusFilter]);

  const openCreate = () => {
    setForm(EMPTY_TRIP_FORM);
    setError('');
    setCreateOpen(true);
  };

  useEffect(() => {
    if (!createOpen) return;

    loadDispatchOptions().catch((err) => {
      setAvailableVehicles([]);
      setAvailableDrivers([]);
      setError(err.response?.data?.message || 'Could not load dispatch options.');
    });
  }, [createOpen]);

  const submitCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/trips', {
        ...form,
        cargoWeight: Number(form.cargoWeight),
        plannedDistance: Number(form.plannedDistance),
        revenue: form.revenue ? Number(form.revenue) : 0,
      });
      setCreateOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create trip.');
    } finally {
      setSaving(false);
    }
  };

  const dispatch = async (trip) => {
    try {
      await api.post(`/trips/${trip._id}/dispatch`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not dispatch trip.');
    }
  };

  const cancel = async (trip) => {
    if (!confirm('Cancel this trip?')) return;
    try {
      await api.post(`/trips/${trip._id}/cancel`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not cancel trip.');
    }
  };

  const openComplete = (trip) => {
    setCompleteTrip(trip);
    setCompleteForm({ finalOdometer: trip.vehicle?.odometer || '', fuelConsumed: '', fuelCost: '' });
    setCompleteError('');
  };

  const submitComplete = async (e) => {
    e.preventDefault();
    setCompleteError('');
    try {
      await api.post(`/trips/${completeTrip._id}/complete`, {
        finalOdometer: Number(completeForm.finalOdometer),
        fuelConsumed: completeForm.fuelConsumed ? Number(completeForm.fuelConsumed) : undefined,
        fuelCost: completeForm.fuelCost ? Number(completeForm.fuelCost) : undefined,
      });
      setCompleteTrip(null);
      load();
    } catch (err) {
      setCompleteError(err.response?.data?.message || 'Could not complete trip.');
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="mono text-[10px] uppercase tracking-widest text-base-400">Trip Management</p>
          <h1 className="font-display text-2xl font-semibold">Dispatch board</h1>
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-36">
            <option value="">All statuses</option>
            <option value="Draft">Draft</option>
            <option value="Dispatched">Dispatched</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </Select>
          {canCreate && (
            <PrimaryButton onClick={openCreate} className="flex items-center gap-1.5">
              <Plus className="h-4 w-4" /> New trip
            </PrimaryButton>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded border border-base-700 bg-base-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-base-700 text-left text-[11px] uppercase tracking-wide text-base-400">
              <th className="px-4 py-3">Route</th>
              <th className="px-4 py-3">Vehicle</th>
              <th className="px-4 py-3">Driver</th>
              <th className="px-4 py-3">Cargo</th>
              <th className="px-4 py-3">Distance</th>
              <th className="px-4 py-3">Status</th>
              {canCreate && <th className="px-4 py-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-base-400">Loading…</td></tr>
            ) : trips.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-base-400">No trips yet.</td></tr>
            ) : trips.map((t) => (
              <tr key={t._id} className="border-b border-base-800 last:border-0 hover:bg-base-800/50">
                <td className="px-4 py-3">{t.source} → {t.destination}</td>
                <td className="mono px-4 py-3">{t.vehicle?.registrationNumber}</td>
                <td className="px-4 py-3">{t.driver?.name}</td>
                <td className="px-4 py-3">{t.cargoWeight} kg</td>
                <td className="px-4 py-3">{t.plannedDistance} km</td>
                <td className="px-4 py-3"><StatusTag status={t.status} /></td>
                {canCreate && (
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-3">
                      {t.status === 'Draft' && (
                        <button onClick={() => dispatch(t)} title="Dispatch" className="flex items-center gap-1 text-active-500 hover:opacity-80">
                          <Send className="h-4 w-4" />
                        </button>
                      )}
                      {t.status === 'Dispatched' && (
                        <button onClick={() => openComplete(t)} title="Complete" className="flex items-center gap-1 text-ok-500 hover:opacity-80">
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                      )}
                      {['Draft', 'Dispatched'].includes(t.status) && (
                        <button onClick={() => cancel(t)} title="Cancel" className="flex items-center gap-1 text-danger-500 hover:opacity-80">
                          <XCircle className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create trip">
        {error && <Banner tone="danger">{error}</Banner>}
        <form onSubmit={submitCreate}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Source" required>
              <Input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} required />
            </Field>
            <Field label="Destination" required>
              <Input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} required />
            </Field>
          </div>
          <Field label="Vehicle" required>
            <Select value={form.vehicle} onChange={(e) => setForm({ ...form, vehicle: e.target.value })} required>
              <option value="">Select an available vehicle…</option>
              {availableVehicles.map((v) => (
                <option key={v._id} value={v._id}>{v.registrationNumber} — {v.name} (max {v.maxLoadCapacity}kg)</option>
              ))}
            </Select>
          </Field>
          <Field label="Driver" required>
            <Select value={form.driver} onChange={(e) => setForm({ ...form, driver: e.target.value })} required>
              <option value="">Select an available driver…</option>
              {availableDrivers.map((d) => (
                <option key={d._id} value={d._id}>{d.name} — {d.licenseNumber}</option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cargo weight (kg)" required>
              <Input type="number" min="0" value={form.cargoWeight} onChange={(e) => setForm({ ...form, cargoWeight: e.target.value })} required />
            </Field>
            <Field label="Planned distance (km)" required>
              <Input type="number" min="0" value={form.plannedDistance} onChange={(e) => setForm({ ...form, plannedDistance: e.target.value })} required />
            </Field>
          </div>
          <Field label="Expected revenue">
            <Input type="number" min="0" value={form.revenue} onChange={(e) => setForm({ ...form, revenue: e.target.value })} placeholder="Optional — used for ROI reporting" />
          </Field>
          <div className="mt-4 flex justify-end gap-2">
            <SecondaryButton type="button" onClick={() => setCreateOpen(false)}>Cancel</SecondaryButton>
            <PrimaryButton type="submit" disabled={saving}>{saving ? 'Creating…' : 'Create trip'}</PrimaryButton>
          </div>
        </form>
      </Modal>

      <Modal open={!!completeTrip} onClose={() => setCompleteTrip(null)} title="Complete trip">
        {completeError && <Banner tone="danger">{completeError}</Banner>}
        <form onSubmit={submitComplete}>
          <Field label="Final odometer (km)" required>
            <Input type="number" min="0" value={completeForm.finalOdometer} onChange={(e) => setCompleteForm({ ...completeForm, finalOdometer: e.target.value })} required />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Fuel consumed (L)">
              <Input type="number" min="0" value={completeForm.fuelConsumed} onChange={(e) => setCompleteForm({ ...completeForm, fuelConsumed: e.target.value })} />
            </Field>
            <Field label="Fuel cost">
              <Input type="number" min="0" value={completeForm.fuelCost} onChange={(e) => setCompleteForm({ ...completeForm, fuelCost: e.target.value })} />
            </Field>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <SecondaryButton type="button" onClick={() => setCompleteTrip(null)}>Cancel</SecondaryButton>
            <PrimaryButton type="submit">Mark completed</PrimaryButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
