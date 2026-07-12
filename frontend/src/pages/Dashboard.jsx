import { useEffect, useState } from 'react';
import api from '../api/axios';
import KpiCard from '../components/KpiCard';
import { Select } from '../components/FormField';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [kpis, setKpis] = useState(null);
  const [filters, setFilters] = useState({ types: [], regions: [] });
  const [type, setType] = useState('');
  const [region, setRegion] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/filters').then(({ data }) => setFilters(data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (type) params.type = type;
    if (region) params.region = region;
    api
      .get('/dashboard/kpis', { params })
      .then(({ data }) => setKpis(data))
      .finally(() => setLoading(false));
  }, [type, region]);

  return (
    <div>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="mono text-[10px] uppercase tracking-widest text-base-400">Operations overview</p>
          <h1 className="font-display text-2xl font-semibold">Welcome back, {user?.name?.split(' ')[0]}</h1>
        </div>
        <div className="flex gap-2">
          <Select value={type} onChange={(e) => setType(e.target.value)} className="w-40">
            <option value="">All types</option>
            {filters.types.map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
          <Select value={region} onChange={(e) => setRegion(e.target.value)} className="w-40">
            <option value="">All regions</option>
            {filters.regions.map((r) => <option key={r} value={r}>{r}</option>)}
          </Select>
        </div>
      </div>

      {loading || !kpis ? (
        <p className="text-sm text-base-400">Loading KPIs…</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiCard label="Active Vehicles" value={kpis.activeVehicles} />
          <KpiCard label="Available Vehicles" value={kpis.availableVehicles} accent="#3fb8af" />
          <KpiCard label="Vehicles in Maintenance" value={kpis.vehiclesInMaintenance} accent="#f2a93b" />
          <KpiCard label="Fleet Utilization" value={kpis.fleetUtilization} suffix="%" accent="#4c8bf5" />
          <KpiCard label="Active Trips" value={kpis.activeTrips} accent="#4c8bf5" />
          <KpiCard label="Pending Trips" value={kpis.pendingTrips} />
          <KpiCard label="Drivers On Duty" value={kpis.driversOnDuty} accent="#3fb8af" />
          <KpiCard label="Total Drivers" value={kpis.totalDrivers} />
        </div>
      )}

      <div className="mt-8 rounded border border-base-700 bg-base-900 p-5">
        <p className="font-display text-sm font-semibold">Quick guide</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-base-400">
          <li>Register vehicles and drivers before creating trips.</li>
          <li>Trips move through Draft → Dispatched → Completed, or can be Cancelled.</li>
          <li>Sending a vehicle to Maintenance automatically removes it from dispatch.</li>
          <li>Reports show fuel efficiency, operational cost, and ROI per vehicle.</li>
        </ul>
      </div>
    </div>
  );
}
