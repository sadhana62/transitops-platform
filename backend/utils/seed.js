const mongoose = require('mongoose');
const { User } = require('../models/User');
const { Vehicle } = require('../models/Vehicle');
const { Driver } = require('../models/Driver');
const { loadBackendEnv } = require('./env');

const MONGO_URI = loadBackendEnv();

const demoUsers = [
  { name: 'Fiona Mercer', email: 'fleet.manager@transitops.demo', password: 'password123', role: 'FleetManager' },
  { name: 'Deepak Rao', email: 'driver@transitops.demo', password: 'password123', role: 'Driver' },
  { name: 'Sana Iyer', email: 'safety.officer@transitops.demo', password: 'password123', role: 'SafetyOfficer' },
  { name: 'Victor Lin', email: 'analyst@transitops.demo', password: 'password123', role: 'FinancialAnalyst' },
];

const demoVehicles = [
  { registrationNumber: 'DL-01-AB-1234', name: 'Tata Ace Gold', type: 'Mini Truck', maxLoadCapacity: 750, odometer: 12500, acquisitionCost: 650000, status: 'Available', region: 'North' },
  { registrationNumber: 'DL-02-CD-5678', name: 'Mahindra Bolero Pickup', type: 'Truck', maxLoadCapacity: 1500, odometer: 34200, acquisitionCost: 950000, status: 'Available', region: 'North' },
  { registrationNumber: 'MH-04-EF-4321', name: 'Force Traveller', type: 'Van', maxLoadCapacity: 500, odometer: 8900, acquisitionCost: 1200000, status: 'Available', region: 'West' },
  { registrationNumber: 'KA-05-GH-9876', name: 'Ashok Leyland Dost', type: 'Mini Truck', maxLoadCapacity: 1000, odometer: 51000, acquisitionCost: 780000, status: 'In Shop', region: 'South' },
  { registrationNumber: 'DL-01-XY-0007', name: 'Old Van-05', type: 'Van', maxLoadCapacity: 500, odometer: 98000, acquisitionCost: 400000, status: 'Retired', region: 'North' },
];

const demoDrivers = [
  { name: 'Alex Fernandes', licenseNumber: 'DL0120230001', licenseCategory: 'LMV', licenseExpiryDate: new Date('2027-06-01'), contactNumber: '9810000001', safetyScore: 95, status: 'Available' },
  { name: 'Priya Menon', licenseNumber: 'DL0120230002', licenseCategory: 'HMV', licenseExpiryDate: new Date('2026-12-01'), contactNumber: '9810000002', safetyScore: 88, status: 'Available' },
  { name: 'Ravi Kumar', licenseNumber: 'DL0120230003', licenseCategory: 'HMV', licenseExpiryDate: new Date('2025-01-01'), contactNumber: '9810000003', safetyScore: 70, status: 'Available' }, // expired license
  { name: 'Neha Joshi', licenseNumber: 'DL0120230004', licenseCategory: 'LMV', licenseExpiryDate: new Date('2027-03-01'), contactNumber: '9810000004', safetyScore: 60, status: 'Suspended' },
];

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected. Seeding...');

  await Promise.all([User.deleteMany({}), Vehicle.deleteMany({}), Driver.deleteMany({})]);

  for (const u of demoUsers) {
    await User.create(u);
  }
  await Vehicle.insertMany(demoVehicles);
  await Driver.insertMany(demoDrivers);

  console.log('Seed complete. Demo logins (password: password123):');
  demoUsers.forEach((u) => console.log(`  ${u.role}: ${u.email}`));

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
