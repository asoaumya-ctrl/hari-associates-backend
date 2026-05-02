const mongoose = require('mongoose');

const dealerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Dealer name is required'],
      trim: true,
      maxlength: [150, 'Name cannot exceed 150 characters'],
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
      maxlength: [300, 'Address too long'],
    },
    district: {
      type: String,
      required: [true, 'District is required'],
      enum: ['Gondia', 'Bhandara', 'Nagpur', 'Wardha', 'Chandrapur', 'Other'],
      trim: true,
    },
    pincode: {
      type: String,
      trim: true,
      match: [/^\d{6}$/, 'Pincode must be 6 digits'],
      default: null,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'],
    },
    phone2: {
      type: String,
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit mobile number'],
      default: null,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
      default: null,
    },

    // ── Geo Location ────────────────────────────────────────────────────────────
    location: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },

    // ── Business Details ────────────────────────────────────────────────────────
    brands: {
      type: [String],
      enum: ['Dalmia', 'UltraTech', 'Bangur', 'Chetak', 'JK Lakshmi'],
      default: [],
    },
    isHeadOffice: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [300, 'Notes too long'],
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for district-based filtering (used in dealer locator)
dealerSchema.index({ district: 1, isActive: 1 });

module.exports = mongoose.model('Dealer', dealerSchema);
