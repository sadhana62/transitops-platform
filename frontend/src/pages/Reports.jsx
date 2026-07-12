import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import api from '../api/axios';
import KpiCard from '../components/KpiCard';

export default function Reports() {
  const [report, setReport] = useState([]);
  const [utilization, setUtilization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setLoading(true);

    Promise.all([
      api.get('/reports/vehicles'),
      api.get('/reports/fleet-utilization'),
    ])
      .then(([reportResponse, utilizationResponse]) => {
        setReport(reportResponse.data);
        setUtilization(utilizationResponse.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const exportCsv = async () => {
    setExporting(true);

    try {
      const response = await api.get('/reports/export.csv', {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');

      link.href = url;
      link.setAttribute('download', 'transitops-vehicle-report.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } finally {
      setExporting(false);
    }
  };

  const chartData = report.map((item) => ({
    name: item.registrationNumber,
    'Fuel Efficiency (km/L)': item.fuelEfficiencyKmPerLiter,
    'Operational Cost': item.operationalCost,
  }));

  return (
    <div>
      <div className="mb-6 flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mono text-[10px] uppercase tracking-widest text-base-400">
            Reports &amp; Analytics
          </p>
          <h1 className="font-display text-2xl font-semibold">Fleet performance</h1>
        </div>

        <button
          onClick={exportCsv}
          disabled={exporting}
          className="flex w-full items-center justify-center gap-1.5 rounded border border-base-600 px-4 py-2 text-sm text-base-100 hover:border-signal-500 hover:text-signal-500 disabled:opacity-50 sm:w-auto"
        >
          <Download className="h-4 w-4" />
          {exporting ? 'Exporting…' : 'Export CSV'}
        </button>
      </div>

      {utilization && (
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          <KpiCard label="Active Vehicles" value={utilization.activeVehicles} />
          <KpiCard
            label="On Trip Now"
            value={utilization.onTripVehicles}
            accent="#4c8bf5"
          />
          <KpiCard
            label="Fleet Utilization"
            value={utilization.fleetUtilizationPercent}
            suffix="%"
            accent="#f2a93b"
          />
        </div>
      )}

      {!loading && chartData.length > 0 && (
        <div className="mb-6 rounded border border-base-700 bg-base-900 p-4 sm:p-5">
          <p className="mb-4 font-display text-sm font-semibold">
            Fuel efficiency by vehicle (km/L)
          </p>

          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#232b32" />
              <XAxis
                dataKey="name"
                stroke="#75838d"
                fontSize={11}
                interval="preserveStartEnd"
              />
              <YAxis stroke="#75838d" fontSize={11} width={36} />
              <Tooltip
                contentStyle={{
                  background: '#1a2126',
                  border: '1px solid #303a42',
                  fontSize: 12,
                }}
              />
              <Bar
                dataKey="Fuel Efficiency (km/L)"
                fill="#f2a93b"
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="scrollbar-thin overflow-x-auto rounded border border-base-700 bg-base-900">
        <table className="min-w-[1050px] w-full text-sm">
          <thead>
            <tr className="border-b border-base-700 text-left text-[11px] uppercase tracking-wide text-base-400">
              <th className="px-4 py-3">Vehicle</th>
              <th className="px-4 py-3">Trips</th>
              <th className="px-4 py-3">Distance</th>
              <th className="px-4 py-3">Fuel Eff.</th>
              <th className="px-4 py-3">Fuel Cost</th>
              <th className="px-4 py-3">Maint. Cost</th>
              <th className="px-4 py-3">Op. Cost</th>
              <th className="px-4 py-3">Revenue</th>
              <th className="px-4 py-3">ROI</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-base-400">
                  Loading…
                </td>
              </tr>
            ) : report.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-base-400">
                  No data yet.
                </td>
              </tr>
            ) : (
              report.map((item) => (
                <tr
                  key={item.vehicleId}
                  className="border-b border-base-800 last:border-0 hover:bg-base-800/50"
                >
                  <td className="mono px-4 py-3">{item.registrationNumber}</td>
                  <td className="px-4 py-3">{item.totalTrips}</td>
                  <td className="px-4 py-3">{item.totalDistanceKm} km</td>
                  <td className="px-4 py-3">
                    {item.fuelEfficiencyKmPerLiter} km/L
                  </td>
                  <td className="px-4 py-3">{item.totalFuelCost}</td>
                  <td className="px-4 py-3">{item.totalMaintenanceCost}</td>
                  <td className="px-4 py-3">{item.operationalCost}</td>
                  <td className="px-4 py-3">{item.totalRevenue}</td>
                  <td className="px-4 py-3">
                    <span
                      className={item.roi >= 0 ? 'text-ok-500' : 'text-danger-500'}
                    >
                      {(item.roi * 100).toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}