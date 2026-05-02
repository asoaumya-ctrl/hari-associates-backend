const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema(
  {
    // ── Submitter Info ──────────────────────────────────────────────────────────
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
      default: null,
    },

    // ── Order Details ───────────────────────────────────────────────────────────
    productInterest: {
      type: String,
      enum: ['OPC 43', 'OPC 53', 'PPC', 'Both OPC & PPC', 'Dealership Inquiry', 'General'],
      default: 'General',
    },
    brand: {
      type: String,
      enum: ['Dalmia', 'UltraTech', 'Bangur', 'Chetak', 'JK Lakshmi', 'Any', null],
      default: 'Any',
    },
    quantity: {
      type: String,   // Free text: "500 bags", "25 tons"
      trim: true,
      maxlength: [100, 'Quantity field too long'],
      default: null,
    },
    deliveryLocation: {
      type: String,
      trim: true,
      maxlength: [200, 'Delivery location too long'],
      default: null,
    },
    message: {
      type: String,
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
      default: null,
    },

    // ── Source Tracking ─────────────────────────────────────────────────────────
    source: {
      type: String,
      enum: ['contact_form', 'bulk_inquiry_popup', 'opc_quote', 'ppc_quote', 'calculator'],
      default: 'contact_form',
    },

    // ── Admin Fields ────────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: ['new', 'contacted', 'in_progress', 'closed'],
      default: 'new',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,   // createdAt + updatedAt auto-managed
  }
);

// Index for dashboard queries
inquirySchema.index({ status: 1, createdAt: -1 });
inquirySchema.index({ phone: 1 });

module.exports = mongoose.model('Inquiry', inquirySchema);
