const mongoose = require('mongoose');

const DRIVER_STATUSES = ['Available', 'On Trip', 'Off Duty', 'Suspended'];

const driverSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    licenseNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
    licenseCategory: { type: String, required: true, trim: true }, // e.g. LMV, HMV, Motorcycle
    licenseExpiryDate: { type: Date, required: true },
    contactNumber: { type: String, required: true, trim: true },
    safetyScore: { type: Number, default: 100, min: 0, max: 100 },
    status: { type: String, enum: DRIVER_STATUSES, default: 'Available' },
  },
  { timestamps: true }
);

driverSchema.methods.isLicenseExpired = function () {
  return this.licenseExpiryDate < new Date();
};

module.exports = { Driver: mongoose.model('Driver', driverSchema), DRIVER_STATUSES };
