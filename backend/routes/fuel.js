const express = require('express');
const { FuelLog } = require('../models/FuelLog');
const { Vehicle } = require('../models/Vehicle');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');

const router = express.Router();
router.use(auth);

// GET /api/fuel - list, optionally by vehicle
router.get('/', async (req, res) => {
  try {
    const { vehicle } = req.query;
    const filter = {};
    if (vehicle) filter.vehicle = vehicle;
    const logs = await FuelLog.find(filter)
      .populate('vehicle', 'registrationNumber name')
      .sort({ date: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch fuel logs.', error: err.message });
  }
});

// POST /api/fuel - FleetManager or Driver
router.post('/', rbac('FleetManager', 'Driver'), async (req, res) => {
  try {
    const { vehicle: vehicleId, trip, liters, cost, date } = req.body;
    if (!vehicleId || liters == null || cost == null) {
      return res.status(400).json({ message: 'Vehicle, liters, and cost are required.' });
    }
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found.' });

    const log = await FuelLog.create({
      vehicle: vehicleId,
      trip: trip || undefined,
      liters,
      cost,
      date: date || new Date(),
    });
    const populated = await log.populate('vehicle', 'registrationNumber name');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Could not record fuel log.', error: err.message });
  }
});

router.delete('/:id', rbac('FleetManager'), async (req, res) => {
  try {
    const log = await FuelLog.findById(req.params.id);
    if (!log) return res.status(404).json({ message: 'Fuel log not found.' });
    await log.deleteOne();
    res.json({ message: 'Fuel log deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Could not delete fuel log.', error: err.message });
  }
});

module.exports = router;
