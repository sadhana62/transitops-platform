import { useEffect, useState } from 'react';
import { Plus, Fuel as FuelIcon, Receipt } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import { Field, Input, Select, TextArea, Banner, PrimaryButton, SecondaryButton } from '../components/FormField';

const EMPTY_FUEL_FORM = { vehicle: '', liters: '', cost: '', date: '' };
const EMPTY_EXPENSE_FORM = { vehicle: '', category: 'Toll', amount: '', date: '', notes: '' };

export default function FuelExpenses() {
  const { user } = useAuth();
  const canLogFuel = ['FleetManager', 'Driver'].includes(user?.role);
  const canLogExpense = ['FleetManager', 'Driver', 'FinancialAnalyst'].includes(user?.role);
  const canDelete = ['FleetManager', 'FinancialAnalyst'].includes(user?.role);

  const [tab, setTab] = useState('fuel');
  const [fuelLogs, setFuelLogs] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [fuelModalOpen, setFuelModalOpen] = useState(false);
  const [fuelForm, setFuelForm] = useState(EMPTY_FUEL_FORM);
  const [fuelError, setFuelError] = useState('');

  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState(EMPTY_EXPENSE_FORM);
  const [expenseError, setExpenseError] = useState('');

  const loadFuel = () => {
    setLoading(true);
    api.get('/fuel').then(({ data }) => setFuelLogs(data)).finally(() => setLoading(false));
  };
  const loadExpenses = () => {
    setLoading(true);
    api.get('/expenses').then(({ data }) => setExpenses(data)).finally(() => setLoading(false));
  };

  useEffect(() => {
    api.get('/vehicles').then(({ data }) => setVehicles(data));
    api.get('/expenses/meta').then(({ data }) => setExpenseCategories(data.categories));
  }, []);

  useEffect(() => {
    if (tab === 'fuel') loadFuel();
    else loadExpenses();
  }, [tab]);

  const openFuelModal = () => {
    setFuelForm(EMPTY_FUEL_FORM);
    setFuelError('');
    setFuelModalOpen(true);
  };

  const submitFuel = async (e) => {
    e.preventDefault();
    setFuelError('');
    try {
      await api.post('/fuel', {
        ...fuelForm,
        liters: Number(fuelForm.liters),
        cost: Number(fuelForm.cost),
        date: fuelForm.date || undefined,
      });
      setFuelModalOpen(false);
      loadFuel();
    } catch (err) {
      setFuelError(err.response?.data?.message || 'Could not record fuel log.');
    }
  };

  const deleteFuel = async (log) => {
    if (!confirm('Delete this fuel log?')) return;
    await api.delete(`/fuel/${log._id}`);
    loadFuel();
  };

  const openExpenseModal = () => {
    setExpenseForm(EMPTY_EXPENSE_FORM);
    setExpenseError('');
    setExpenseModalOpen(true);
  };

  const submitExpense = async (e) => {
    e.preventDefault();
    setExpenseError('');
    try {
      await api.post('/expenses', {
        ...expenseForm,
        amount: Number(expenseForm.amount),
        date: expenseForm.date || undefined,
      });
      setExpenseModalOpen(false);
      loadExpenses();
    } catch (err) {
      setExpenseError(err.response?.data?.message || 'Could not record expense.');
    }
  };

  const deleteExpense = async (exp) => {
    if (!confirm('Delete this expense?')) return;
    await api.delete(`/expenses/${exp._id}`);
    loadExpenses();
  };

  return (
    <div>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="mono text-[10px] uppercase tracking-widest text-base-400">Fuel & Expenses</p>
          <h1 className="font-display text-2xl font-semibold">Cost tracking</h1>
        </div>
        <div className="flex gap-2">
          {tab === 'fuel' && canLogFuel && (
            <PrimaryButton onClick={openFuelModal} className="flex items-center gap-1.5">
              <Plus className="h-4 w-4" /> Log fuel
            </PrimaryButton>
          )}
          {tab === 'expenses' && canLogExpense && (
            <PrimaryButton onClick={openExpenseModal} className="flex items-center gap-1.5">
              <Plus className="h-4 w-4" /> Log expense
            </PrimaryButton>
          )}
        </div>
      </div>

      <div className="mb-4 flex gap-1 rounded bg-base-800 p-1 w-fit">
        <button onClick={() => setTab('fuel')} className={`flex items-center gap-1.5 rounded px-4 py-1.5 text-sm ${tab === 'fuel' ? 'bg-base-700 text-signal-500' : 'text-base-400'}`}>
          <FuelIcon className="h-3.5 w-3.5" /> Fuel logs
        </button>
        <button onClick={() => setTab('expenses')} className={`flex items-center gap-1.5 rounded px-4 py-1.5 text-sm ${tab === 'expenses' ? 'bg-base-700 text-signal-500' : 'text-base-400'}`}>
          <Receipt className="h-3.5 w-3.5" /> Other expenses
        </button>
      </div>

      {tab === 'fuel' ? (
        <div className="overflow-x-auto rounded border border-base-700 bg-base-900">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-base-700 text-left text-[11px] uppercase tracking-wide text-base-400">
                <th className="px-4 py-3">Vehicle</th>
                <th className="px-4 py-3">Liters</th>
                <th className="px-4 py-3">Cost</th>
                <th className="px-4 py-3">Date</th>
                {canDelete && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-base-400">Loading…</td></tr>
              ) : fuelLogs.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-base-400">No fuel logs yet.</td></tr>
              ) : fuelLogs.map((f) => (
                <tr key={f._id} className="border-b border-base-800 last:border-0 hover:bg-base-800/50">
                  <td className="mono px-4 py-3">{f.vehicle?.registrationNumber}</td>
                  <td className="px-4 py-3">{f.liters} L</td>
                  <td className="px-4 py-3">{f.cost}</td>
                  <td className="px-4 py-3">{new Date(f.date).toLocaleDateString()}</td>
                  {canDelete && (
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => deleteFuel(f)} className="text-base-400 hover:text-danger-500">Delete</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto rounded border border-base-700 bg-base-900">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-base-700 text-left text-[11px] uppercase tracking-wide text-base-400">
                <th className="px-4 py-3">Vehicle</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Notes</th>
                {canDelete && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-base-400">Loading…</td></tr>
              ) : expenses.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-base-400">No expenses logged yet.</td></tr>
              ) : expenses.map((exp) => (
                <tr key={exp._id} className="border-b border-base-800 last:border-0 hover:bg-base-800/50">
                  <td className="mono px-4 py-3">{exp.vehicle?.registrationNumber}</td>
                  <td className="px-4 py-3">{exp.category}</td>
                  <td className="px-4 py-3">{exp.amount}</td>
                  <td className="px-4 py-3">{new Date(exp.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-base-400">{exp.notes || '—'}</td>
                  {canDelete && (
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => deleteExpense(exp)} className="text-base-400 hover:text-danger-500">Delete</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={fuelModalOpen} onClose={() => setFuelModalOpen(false)} title="Log fuel">
        {fuelError && <Banner tone="danger">{fuelError}</Banner>}
        <form onSubmit={submitFuel}>
          <Field label="Vehicle" required>
            <Select value={fuelForm.vehicle} onChange={(e) => setFuelForm({ ...fuelForm, vehicle: e.target.value })} required>
              <option value="">Select vehicle…</option>
              {vehicles.map((v) => <option key={v._id} value={v._id}>{v.registrationNumber} — {v.name}</option>)}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Liters" required>
              <Input type="number" min="0" value={fuelForm.liters} onChange={(e) => setFuelForm({ ...fuelForm, liters: e.target.value })} required />
            </Field>
            <Field label="Cost" required>
              <Input type="number" min="0" value={fuelForm.cost} onChange={(e) => setFuelForm({ ...fuelForm, cost: e.target.value })} required />
            </Field>
          </div>
          <Field label="Date">
            <Input type="date" value={fuelForm.date} onChange={(e) => setFuelForm({ ...fuelForm, date: e.target.value })} />
          </Field>
          <div className="mt-4 flex justify-end gap-2">
            <SecondaryButton type="button" onClick={() => setFuelModalOpen(false)}>Cancel</SecondaryButton>
            <PrimaryButton type="submit">Save fuel log</PrimaryButton>
          </div>
        </form>
      </Modal>

      <Modal open={expenseModalOpen} onClose={() => setExpenseModalOpen(false)} title="Log expense">
        {expenseError && <Banner tone="danger">{expenseError}</Banner>}
        <form onSubmit={submitExpense}>
          <Field label="Vehicle" required>
            <Select value={expenseForm.vehicle} onChange={(e) => setExpenseForm({ ...expenseForm, vehicle: e.target.value })} required>
              <option value="">Select vehicle…</option>
              {vehicles.map((v) => <option key={v._id} value={v._id}>{v.registrationNumber} — {v.name}</option>)}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <Select value={expenseForm.category} onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}>
                {(expenseCategories.length ? expenseCategories : ['Toll', 'Maintenance', 'Parking', 'Fine', 'Other']).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </Field>
            <Field label="Amount" required>
              <Input type="number" min="0" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} required />
            </Field>
          </div>
          <Field label="Date">
            <Input type="date" value={expenseForm.date} onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })} />
          </Field>
          <Field label="Notes">
            <TextArea value={expenseForm.notes} onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })} rows={2} />
          </Field>
          <div className="mt-4 flex justify-end gap-2">
            <SecondaryButton type="button" onClick={() => setExpenseModalOpen(false)}>Cancel</SecondaryButton>
            <PrimaryButton type="submit">Save expense</PrimaryButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
