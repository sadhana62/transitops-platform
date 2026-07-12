const express = require('express');
const { Vehicle } = require('../models/Vehicle');
const { Trip } = require('../models/Trip');
const { Maintenance } = require('../models/Maintenance');
const { FuelLog } = require('../models/FuelLog');
const { Expense } = require('../models/Expense');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

async function buildVehicleReport() {
  const vehicles = await Vehicle.find({});
  const report = [];

  for (const vehicle of vehicles) {
    const completedTrips = await Trip.find({ vehicle: vehicle._id, status: 'Completed' });
    const fuelLogs = await FuelLog.find({ vehicle: vehicle._id });
    const maintenanceLogs = await Maintenance.find({ vehicle: vehicle._id });
    const expenses = await Expense.find({ vehicle: vehicle._id });

    const totalDistance = completedTrips.reduce((sum, t) => sum + (t.plannedDistance || 0), 0);
    const totalFuelLiters = fuelLogs.reduce((sum, f) => sum + (f.liters || 0), 0);
    const totalFuelCost = fuelLogs.reduce((sum, f) => sum + (f.cost || 0), 0);
    const totalMaintenanceCost = maintenanceLogs.reduce((sum, m) => sum + (m.cost || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalRevenue = completedTrips.reduce((sum, t) => sum + (t.revenue || 0), 0);

    const fuelEfficiency = totalFuelLiters > 0 ? Math.round((totalDistance / totalFuelLiters) * 100) / 100 : 0;
    const operationalCost = totalFuelCost + totalMaintenanceCost;
    const roi = vehicle.acquisitionCost > 0
      ? Math.round(((totalRevenue - operationalCost) / vehicle.acquisitionCost) * 1000) / 1000
      : 0;

    report.push({
      vehicleId: vehicle._id,
      registrationNumber: vehicle.registrationNumber,
      name: vehicle.name,
      type: vehicle.type,
      status: vehicle.status,
      totalTrips: completedTrips.length,
      totalDistanceKm: totalDistance,
      totalFuelLiters,
      totalFuelCost,
      totalMaintenanceCost,
      totalExpenses,
      totalRevenue,
      operationalCost,
      fuelEfficiencyKmPerLiter: fuelEfficiency,
      roi,
    });
  }

  return report;
}

// GET /api/reports/vehicles - full per-vehicle analytics
router.get('/vehicles', async (req, res) => {
  try {
    const report = await buildVehicleReport();
    res.json(report);
  } catch (err) {
    res.status(500).json({ message: 'Could not build vehicle report.', error: err.message });
  }
});

// GET /api/reports/fleet-utilization
router.get('/fleet-utilization', async (req, res) => {
  try {
    const vehicles = await Vehicle.find({});
    const active = vehicles.filter((v) => v.status !== 'Retired').length;
    const onTrip = vehicles.filter((v) => v.status === 'On Trip').length;
    const utilization = active > 0 ? Math.round((onTrip / active) * 1000) / 10 : 0;
    res.json({ activeVehicles: active, onTripVehicles: onTrip, fleetUtilizationPercent: utilization });
  } catch (err) {
    res.status(500).json({ message: 'Could not compute fleet utilization.', error: err.message });
  }
});

// GET /api/reports/export.csv - CSV export of the vehicle report
router.get('/export.csv', async (req, res) => {
  try {
    const report = await buildVehicleReport();
    const headers = [
      'Registration Number', 'Name', 'Type', 'Status', 'Total Trips', 'Total Distance (km)',
      'Total Fuel (L)', 'Fuel Cost', 'Maintenance Cost', 'Other Expenses', 'Revenue',
      'Operational Cost', 'Fuel Efficiency (km/L)', 'ROI',
    ];
    const rows = report.map((r) => [
      r.registrationNumber, r.name, r.type, r.status, r.totalTrips, r.totalDistanceKm,
      r.totalFuelLiters, r.totalFuelCost, r.totalMaintenanceCost, r.totalExpenses, r.totalRevenue,
      r.operationalCost, r.fuelEfficiencyKmPerLiter, r.roi,
    ]);

    const escapeCsv = (val) => {
      const str = String(val ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csv = [headers, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="transitops-vehicle-report.csv"');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ message: 'Could not export report.', error: err.message });
  }
});

module.exports = router;
