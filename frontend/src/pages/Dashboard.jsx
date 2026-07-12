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
    api
      .get('/dashboard/filters')
      .then(({ data }) => setFilters(data))
      .catch(() => {});
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
      <div className="mb-6 flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mono text-[10px] uppercase tracking-widest text-base-400">
            Operations overview
          </p>
          <h1 className="font-display text-2xl font-semibold">
            Welcome back, {user?.name?.split(' ')[0]}
          </h1>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full sm:w-40"
          >
            <option value="">All types</option>
            {filters.types.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>

          <Select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="w-full sm:w-40"
          >
            <option value="">All regions</option>
            {filters.regions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {loading || !kpis ? (
        <p className="text-sm text-base-400">Loading KPIs…</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          <KpiCard label="Active Vehicles" value={kpis.activeVehicles} />
          <KpiCard
            label="Available Vehicles"
            value={kpis.availableVehicles}
            accent="#3fb8af"
          />
          <KpiCard
            label="Vehicles in Maintenance"
            value={kpis.vehiclesInMaintenance}
            accent="#f2a93b"
          />
          <KpiCard
            label="Fleet Utilization"
            value={kpis.fleetUtilization}
            suffix="%"
            accent="#4c8bf5"
          />
          <KpiCard label="Active Trips" value={kpis.activeTrips} accent="#4c8bf5" />
          <KpiCard label="Pending Trips" value={kpis.pendingTrips} />
          <KpiCard
            label="Drivers On Duty"
            value={kpis.driversOnDuty}
            accent="#3fb8af"
          />
          <KpiCard label="Total Drivers" value={kpis.totalDrivers} />
        </div>
      )}

      <div className="mt-6 rounded border border-base-700 bg-base-900 p-4 sm:mt-8 sm:p-5">
        <p className="font-display text-sm font-semibold">Quick guide</p>

        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-base-400">
          <li>Register vehicles and drivers before creating trips.</li>
          <li>Trips move through Draft → Dispatched → Completed, or can be Cancelled.</li>
          <li>Sending a vehicle to Maintenance automatically removes it from dispatch.</li>
          <li>Reports show fuel efficiency, operational cost, and ROI per vehicle.</li>
          <li>Regions are miantained according to the vehicle stocks.</li>
        </ul>
      </div>
    </div>
  );
}