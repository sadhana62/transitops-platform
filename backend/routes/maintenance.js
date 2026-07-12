const express = require('express');
const { Maintenance } = require('../models/Maintenance');
const { Vehicle } = require('../models/Vehicle');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');

const router = express.Router();
router.use(auth);

// GET /api/maintenance - list, optionally by vehicle/status
router.get('/', async (req, res) => {
  try {
    const { vehicle, status } = req.query;
    const filter = {};
    if (vehicle) filter.vehicle = vehicle;
    if (status) filter.status = status;
    const logs = await Maintenance.find(filter)
      .populate('vehicle', 'registrationNumber name type status')
      .sort({ createdAt: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch maintenance logs.', error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const log = await Maintenance.findById(req.params.id).populate('vehicle');
    if (!log) return res.status(404).json({ message: 'Maintenance record not found.' });
    res.json(log);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch maintenance record.', error: err.message });
  }
});

// POST /api/maintenance - FleetManager only. Creating an active record -> vehicle In Shop
router.post('/', rbac('FleetManager'), async (req, res) => {
  try {
    const { vehicle: vehicleId, type, description, cost } = req.body;
    if (!vehicleId || !type) {
      return res.status(400).json({ message: 'Vehicle and maintenance type are required.' });
    }
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found.' });
    if (vehicle.status === 'On Trip') {
      return res.status(400).json({ message: `${vehicle.name} is currently on a trip and cannot be sent to maintenance.` });
    }

    const log = await Maintenance.create({
      vehicle: vehicle._id,
      type,
      description,
      cost: cost || 0,
      status: 'Open',
      openedAt: new Date(),
    });

    // Adding a vehicle to a Maintenance Log automatically switches its status to In Shop
    vehicle.status = 'In Shop';
    await vehicle.save();

    const populated = await log.populate('vehicle');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Could not create maintenance record.', error: err.message });
  }
});

// POST /api/maintenance/:id/close - FleetManager only. Restores vehicle to Available (unless retired)
router.post('/:id/close', rbac('FleetManager'), async (req, res) => {
  try {
    const { cost, retireVehicle } = req.body;
    const log = await Maintenance.findById(req.params.id);
    if (!log) return res.status(404).json({ message: 'Maintenance record not found.' });
    if (log.status === 'Closed') {
      return res.status(400).json({ message: 'This maintenance record is already closed.' });
    }

    log.status = 'Closed';
    log.closedAt = new Date();
    if (cost != null) log.cost = cost;
    if (retireVehicle) log.markVehicleRetired = true;
    await log.save();

    const vehicle = await Vehicle.findById(log.vehicle);
    if (vehicle) {
      vehicle.status = retireVehicle ? 'Retired' : 'Available';
      await vehicle.save();
    }

    const populated = await log.populate('vehicle');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Could not close maintenance record.', error: err.message });
  }
});

// PUT /api/maintenance/:id - update cost/description while open
router.put('/:id', rbac('FleetManager'), async (req, res) => {
  try {
    const log = await Maintenance.findById(req.params.id);
    if (!log) return res.status(404).json({ message: 'Maintenance record not found.' });
    const { type, description, cost } = req.body;
    if (type != null) log.type = type;
    if (description != null) log.description = description;
    if (cost != null) log.cost = cost;
    await log.save();
    const populated = await log.populate('vehicle');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Could not update maintenance record.', error: err.message });
  }
});

module.exports = router;
