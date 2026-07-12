const express = require('express');
const { Driver, DRIVER_STATUSES } = require('../models/Driver');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');

const router = express.Router();
router.use(auth);

// GET /api/drivers - list, with filters
router.get('/', async (req, res) => {
  try {
    const { status, availableForDispatch } = req.query;
    const filter = {};
    if (status) filter.status = status;
    let drivers = await Driver.find(filter).sort({ createdAt: -1 });

    if (availableForDispatch === 'true') {
      drivers = drivers.filter((d) => d.isDispatchable());
    }
    res.json(drivers);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch drivers.', error: err.message });
  }
});

router.get('/meta', (req, res) => {
  res.json({ statuses: DRIVER_STATUSES });
});

router.get('/:id', async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) return res.status(404).json({ message: 'Driver not found.' });
    res.json(driver);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch driver.', error: err.message });
  }
});

// POST /api/drivers - FleetManager or SafetyOfficer
router.post('/', rbac('FleetManager', 'SafetyOfficer'), async (req, res) => {
  try {
    const { name, licenseNumber, licenseCategory, licenseExpiryDate, contactNumber, safetyScore } = req.body;
    if (!name || !licenseNumber || !licenseCategory || !licenseExpiryDate || !contactNumber) {
      return res.status(400).json({ message: 'Name, license number, license category, license expiry date, and contact number are required.' });
    }
    const existing = await Driver.findOne({ licenseNumber: licenseNumber.toUpperCase() });
    if (existing) {
      return res.status(409).json({ message: 'A driver with this license number already exists.' });
    }
    const driver = await Driver.create({
      name,
      licenseNumber,
      licenseCategory,
      licenseExpiryDate,
      contactNumber,
      safetyScore: safetyScore != null ? safetyScore : 100,
    });
    res.status(201).json(driver);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'A driver with this license number already exists.' });
    }
    res.status(500).json({ message: 'Could not register driver.', error: err.message });
  }
});

// PUT /api/drivers/:id - FleetManager or SafetyOfficer
router.put('/:id', rbac('FleetManager', 'SafetyOfficer'), async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) return res.status(404).json({ message: 'Driver not found.' });

    const { name, licenseNumber, licenseCategory, licenseExpiryDate, contactNumber, safetyScore, status } = req.body;

    if (licenseNumber && licenseNumber.toUpperCase() !== driver.licenseNumber) {
      const dupe = await Driver.findOne({ licenseNumber: licenseNumber.toUpperCase() });
      if (dupe) return res.status(409).json({ message: 'A driver with this license number already exists.' });
      driver.licenseNumber = licenseNumber;
    }
    if (name != null) driver.name = name;
    if (licenseCategory != null) driver.licenseCategory = licenseCategory;
    if (licenseExpiryDate != null) driver.licenseExpiryDate = licenseExpiryDate;
    if (contactNumber != null) driver.contactNumber = contactNumber;
    if (safetyScore != null) driver.safetyScore = safetyScore;
    if (status != null) {
      if (driver.status === 'On Trip' && status !== 'On Trip') {
        return res.status(400).json({ message: 'Driver is currently on a trip. Complete or cancel the trip before changing status manually.' });
      }
      driver.status = status;
    }

    await driver.save();
    res.json(driver);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'A driver with this license number already exists.' });
    }
    res.status(500).json({ message: 'Could not update driver.', error: err.message });
  }
});

// DELETE /api/drivers/:id - FleetManager only
router.delete('/:id', rbac('FleetManager'), async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) return res.status(404).json({ message: 'Driver not found.' });
    if (driver.status === 'On Trip') {
      return res.status(400).json({ message: 'Cannot delete a driver that is currently on a trip.' });
    }
    await driver.deleteOne();
    res.json({ message: 'Driver deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Could not delete driver.', error: err.message });
  }
});

module.exports = router;
