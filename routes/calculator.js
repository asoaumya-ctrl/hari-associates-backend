const express = require('express');
const router = express.Router();
const CalculatorResult = require('../models/CalculatorResult');

// Mix ratio → kg of cement per m³ of concrete
const MIX_RATIO_MAP = {
  M20: 320,
  M25: 400,
  M30: 480,
};

// Thickness in inches → meters
function inchesToMeters(inches) {
  return (inches * 25.4) / 1000;
}

// sq.ft → sq.m
function sqftToSqm(sqft) {
  return sqft * 0.0929;
}

// ─── POST /api/calculator ──────────────────────────────────────────────────────
// Perform calculation and save result to DB
router.post('/', async (req, res) => {
  try {
    const { area, thicknessInches, mixRatio, cementType } = req.body;

    // Validate inputs
    const validThickness = [4, 5, 6, 8];
    const validMix = ['M20', 'M25', 'M30'];
    const validType = ['OPC 53', 'PPC'];

    if (!area || isNaN(area) || area <= 0 || area > 1000000) {
      return res.status(400).json({ success: false, message: 'Area must be a positive number (max 1,000,000 sq.ft.).' });
    }
    if (!validThickness.includes(Number(thicknessInches))) {
      return res.status(400).json({ success: false, message: 'Invalid thickness. Choose 4, 5, 6, or 8 inches.' });
    }
    if (!validMix.includes(mixRatio)) {
      return res.status(400).json({ success: false, message: 'Invalid mix ratio. Choose M20, M25, or M30.' });
    }
    if (!validType.includes(cementType)) {
      return res.status(400).json({ success: false, message: 'Invalid cement type. Choose OPC 53 or PPC.' });
    }

    // ── Calculation ─────────────────────────────────────────────────────────────
    const areaM2    = sqftToSqm(parseFloat(area));
    const thickM    = inchesToMeters(Number(thicknessInches));
    const volumeM3  = parseFloat((areaM2 * thickM).toFixed(4));
    const cementKg  = parseFloat((volumeM3 * MIX_RATIO_MAP[mixRatio]).toFixed(2));
    const withWaste = cementKg * 1.10;                     // 10% wastage buffer
    const bags      = Math.ceil(withWaste / 50);           // 50 kg bags

    // Save to DB (non-blocking — fire and forget pattern)
    const saved = await CalculatorResult.create({
      area: parseFloat(area),
      thicknessInches: Number(thicknessInches),
      mixRatio,
      cementType,
      volumeM3,
      cementKg,
      bagsRequired: bags,
    });

    res.status(201).json({
      success: true,
      data: {
        id: saved._id,
        inputs: { area: parseFloat(area), thicknessInches: Number(thicknessInches), mixRatio, cementType },
        results: {
          volumeM3,
          cementKg,
          bagsRequired: bags,
          bagWeightKg: 50,
          wastagePercent: 10,
        },
        message: `You need approximately ${bags.toLocaleString('en-IN')} bags of ${cementType} cement (50 kg each, includes 10% wastage).`,
      },
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }
    console.error('Calculator POST error:', err);
    res.status(500).json({ success: false, message: 'Server error during calculation.' });
  }
});

// ─── GET /api/calculator ───────────────────────────────────────────────────────
// Fetch saved calculations (admin / analytics)
// Supports: ?page=1&limit=20
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [results, total] = await Promise.all([
      CalculatorResult.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      CalculatorResult.countDocuments(),
    ]);

    res.json({
      success: true,
      data: results,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── GET /api/calculator/stats ─────────────────────────────────────────────────
// Aggregated stats for dashboard
router.get('/stats', async (req, res) => {
  try {
    const [totalCalcs, byType, byMix, avgBags] = await Promise.all([
      CalculatorResult.countDocuments(),
      CalculatorResult.aggregate([
        { $group: { _id: '$cementType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      CalculatorResult.aggregate([
        { $group: { _id: '$mixRatio', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      CalculatorResult.aggregate([
        { $group: { _id: null, avgBags: { $avg: '$bagsRequired' }, totalBags: { $sum: '$bagsRequired' } } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        totalCalculations: totalCalcs,
        byType,
        byMix,
        avgBagsPerCalc: avgBags[0]?.avgBags ? Math.round(avgBags[0].avgBags) : 0,
        totalBagsEstimated: avgBags[0]?.totalBags || 0,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
