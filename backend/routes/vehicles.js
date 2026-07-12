const express = require('express');
const { Vehicle, VEHICLE_STATUSES, VEHICLE_TYPES } = require('../models/Vehicle');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');

const router = express.Router();
router.use(auth);

// GET /api/vehicles - list, with filters
router.get('/', async (req, res) => {
  try {
    const { type, status, region, availableForDispatch } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (region) filter.region = region;
    if (availableForDispatch === 'true') {
      // Retired or In Shop vehicles must never appear in dispatch selection
      filter.status = 'Available';
    }
    const vehicles = await Vehicle.find(filter).sort({ createdAt: -1 });
    res.json(vehicles);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch vehicles.', error: err.message });
  }
});

router.get('/meta', (req, res) => {
  res.json({ statuses: VEHICLE_STATUSES, types: VEHICLE_TYPES });
});

router.get('/:id', async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found.' });
    res.json(vehicle);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch vehicle.', error: err.message });
  }
});

// POST /api/vehicles - FleetManager only
router.post('/', rbac('FleetManager'), async (req, res) => {
  try {
    const { registrationNumber, name, type, maxLoadCapacity, odometer, acquisitionCost, region } = req.body;
    if (!registrationNumber || !name || !type || maxLoadCapacity == null || acquisitionCost == null) {
      return res.status(400).json({ message: 'Registration number, name, type, max load capacity, and acquisition cost are required.' });
    }
    const existing = await Vehicle.findOne({ registrationNumber: registrationNumber.toUpperCase() });
    if (existing) {
      return res.status(409).json({ message: 'A vehicle with this registration number already exists.' });
    }
    const vehicle = await Vehicle.create({
      registrationNumber,
      name,
      type,
      maxLoadCapacity,
      odometer: odometer || 0,
      acquisitionCost,
      region,
    });
    res.status(201).json(vehicle);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'A vehicle with this registration number already exists.' });
    }
    res.status(500).json({ message: 'Could not register vehicle.', error: err.message });
  }
});

// PUT /api/vehicles/:id - FleetManager only
router.put('/:id', rbac('FleetManager'), async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found.' });

    const { registrationNumber, name, type, maxLoadCapacity, odometer, acquisitionCost, status, region } = req.body;

    if (registrationNumber && registrationNumber.toUpperCase() !== vehicle.registrationNumber) {
      const dupe = await Vehicle.findOne({ registrationNumber: registrationNumber.toUpperCase() });
      if (dupe) return res.status(409).json({ message: 'A vehicle with this registration number already exists.' });
      vehicle.registrationNumber = registrationNumber;
    }
    if (name != null) vehicle.name = name;
    if (type != null) vehicle.type = type;
    if (maxLoadCapacity != null) vehicle.maxLoadCapacity = maxLoadCapacity;
    if (odometer != null) vehicle.odometer = odometer;
    if (acquisitionCost != null) vehicle.acquisitionCost = acquisitionCost;
    if (region != null) vehicle.region = region;
    if (status != null) {
      if (vehicle.status === 'On Trip' && status !== 'On Trip') {
        return res.status(400).json({ message: 'Vehicle is currently on a trip. Complete or cancel the trip before changing its status manually.' });
      }
      vehicle.status = status;
    }

    await vehicle.save();
    res.json(vehicle);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'A vehicle with this registration number already exists.' });
    }
    res.status(500).json({ message: 'Could not update vehicle.', error: err.message });
  }
});

// DELETE /api/vehicles/:id - FleetManager only
router.delete('/:id', rbac('FleetManager'), async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found.' });
    if (vehicle.status === 'On Trip') {
      return res.status(400).json({ message: 'Cannot delete a vehicle that is currently on a trip.' });
    }
    await vehicle.deleteOne();
    res.json({ message: 'Vehicle deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Could not delete vehicle.', error: err.message });
  }
});

module.exports = router;
