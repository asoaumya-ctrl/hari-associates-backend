const mongoose = require('mongoose');

const calculatorSchema = new mongoose.Schema(
  {
    // ── Inputs ──────────────────────────────────────────────────────────────────
    area: {
      type: Number,
      required: [true, 'Area is required'],
      min: [1, 'Area must be at least 1 sq.ft.'],
      max: [1000000, 'Area value too large'],
    },
    thicknessInches: {
      type: Number,
      required: true,
      enum: [4, 5, 6, 8],
    },
    mixRatio: {
      type: String,
      enum: ['M20', 'M25', 'M30'],
      required: true,
    },
    cementType: {
      type: String,
      enum: ['OPC 53', 'PPC'],
      required: true,
    },

    // ── Computed Results ────────────────────────────────────────────────────────
    volumeM3: {
      type: Number,
      required: true,
    },
    cementKg: {
      type: Number,
      required: true,
    },
    bagsRequired: {
      type: Number,
      required: true,
    },

    // ── Optional: Link to inquiry ───────────────────────────────────────────────
    linkedInquiryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inquiry',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for analytics queries (e.g. most popular mix ratio)
calculatorSchema.index({ cementType: 1, mixRatio: 1 });
calculatorSchema.index({ createdAt: -1 });

module.exports = mongoose.model('CalculatorResult', calculatorSchema);
