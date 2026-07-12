const express = require('express');
const { Expense, EXPENSE_CATEGORIES } = require('../models/Expense');
const { Vehicle } = require('../models/Vehicle');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');

const router = express.Router();
router.use(auth);

router.get('/', async (req, res) => {
  try {
    const { vehicle, category } = req.query;
    const filter = {};
    if (vehicle) filter.vehicle = vehicle;
    if (category) filter.category = category;
    const expenses = await Expense.find(filter)
      .populate('vehicle', 'registrationNumber name')
      .sort({ date: -1 });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch expenses.', error: err.message });
  }
});

router.get('/meta', (req, res) => {
  res.json({ categories: EXPENSE_CATEGORIES });
});

router.post('/', rbac('FleetManager', 'Driver', 'FinancialAnalyst'), async (req, res) => {
  try {
    const { vehicle: vehicleId, trip, category, amount, date, notes } = req.body;
    if (!vehicleId || amount == null) {
      return res.status(400).json({ message: 'Vehicle and amount are required.' });
    }
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found.' });

    const expense = await Expense.create({
      vehicle: vehicleId,
      trip: trip || undefined,
      category: category || 'Other',
      amount,
      date: date || new Date(),
      notes,
    });
    const populated = await expense.populate('vehicle', 'registrationNumber name');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Could not record expense.', error: err.message });
  }
});

router.delete('/:id', rbac('FleetManager', 'FinancialAnalyst'), async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ message: 'Expense not found.' });
    await expense.deleteOne();
    res.json({ message: 'Expense deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Could not delete expense.', error: err.message });
  }
});

module.exports = router;
