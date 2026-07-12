const express = require('express');
const { Vehicle } = require('../models/Vehicle');
const { Driver } = require('../models/Driver');
const { Trip } = require('../models/Trip');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

// GET /api/dashboard/kpis?type=&region=
router.get('/kpis', async (req, res) => {
  try {
    const { type, region } = req.query;
    const vehicleFilter = {};
    if (type) vehicleFilter.type = type;
    if (region) vehicleFilter.region = region;

    const vehicles = await Vehicle.find(vehicleFilter);
    const vehicleIds = vehicles.map((v) => v._id);

    const activeVehicles = vehicles.filter((v) => v.status !== 'Retired').length;
    const availableVehicles = vehicles.filter((v) => v.status === 'Available').length;
    const vehiclesInMaintenance = vehicles.filter((v) => v.status === 'In Shop').length;
    const onTripVehicles = vehicles.filter((v) => v.status === 'On Trip').length;

    const activeTrips = await Trip.countDocuments({ status: 'Dispatched', vehicle: { $in: vehicleIds } });
    const pendingTrips = await Trip.countDocuments({ status: 'Draft', vehicle: { $in: vehicleIds } });

    const drivers = await Driver.find({});
    const driversOnDuty = drivers.filter((d) => d.status === 'On Trip' || d.status === 'Available').length;

    const fleetUtilization = activeVehicles > 0 ? Math.round((onTripVehicles / activeVehicles) * 1000) / 10 : 0;

    res.json({
      activeVehicles,
      availableVehicles,
      vehiclesInMaintenance,
      activeTrips,
      pendingTrips,
      driversOnDuty,
      fleetUtilization, // percentage
      totalDrivers: drivers.length,
      totalVehicles: vehicles.length,
    });
  } catch (err) {
    res.status(500).json({ message: 'Could not compute dashboard KPIs.', error: err.message });
  }
});

// GET /api/dashboard/filters - distinct types/regions for filter dropdowns
router.get('/filters', async (req, res) => {
  try {
    const types = await Vehicle.distinct('type');
    const regions = await Vehicle.distinct('region');
    const statuses = await Vehicle.distinct('status');
    res.json({ types, regions, statuses });
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch filters.', error: err.message });
  }
});

module.exports = router;
