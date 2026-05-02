const express = require('express');
const router = express.Router();
const Dealer = require('../models/Dealer');

// ─── GET /api/dealers ──────────────────────────────────────────────────────────
// List dealers — public-facing (used by dealer locator on website)
// Supports: ?district=Gondia&brand=UltraTech&search=station
router.get('/', async (req, res) => {
  try {
    const { district, brand, search, isActive = 'true' } = req.query;

    const filter = {};

    // Only show active dealers to public
    if (isActive !== 'all') filter.isActive = isActive === 'true';

    if (district) filter.district = district;
    if (brand) filter.brands = brand;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
        { pincode: { $regex: search, $options: 'i' } },
      ];
    }

    const dealers = await Dealer.find(filter)
      .sort({ isHeadOffice: -1, name: 1 })
      .lean();

    res.json({ success: true, count: dealers.length, data: dealers });
  } catch (err) {
    console.error('Dealer GET error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── GET /api/dealers/:id ──────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const dealer = await Dealer.findById(req.params.id).lean();
    if (!dealer) return res.status(404).json({ success: false, message: 'Dealer not found.' });
    res.json({ success: true, data: dealer });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── POST /api/dealers ─────────────────────────────────────────────────────────
// Add a new dealer
router.post('/', async (req, res) => {
  try {
    const {
      name, address, district, pincode, phone, phone2,
      email, location, brands, isHeadOffice, notes,
    } = req.body;

    const dealer = await Dealer.create({
      name, address, district, pincode, phone,
      phone2: phone2 || null,
      email: email || null,
      location: location || { lat: null, lng: null },
      brands: brands || [],
      isHeadOffice: isHeadOffice || false,
      notes: notes || null,
    });

    res.status(201).json({
      success: true,
      message: 'Dealer added successfully.',
      data: dealer,
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }
    console.error('Dealer POST error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── PUT /api/dealers/:id ──────────────────────────────────────────────────────
// Update dealer info
router.put('/:id', async (req, res) => {
  try {
    const allowedFields = [
      'name', 'address', 'district', 'pincode', 'phone', 'phone2',
      'email', 'location', 'brands', 'isHeadOffice', 'isActive', 'notes',
    ];
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const dealer = await Dealer.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).lean();

    if (!dealer) return res.status(404).json({ success: false, message: 'Dealer not found.' });

    res.json({ success: true, message: 'Dealer updated.', data: dealer });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── DELETE /api/dealers/:id ───────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const dealer = await Dealer.findByIdAndDelete(req.params.id);
    if (!dealer) return res.status(404).json({ success: false, message: 'Dealer not found.' });
    res.json({ success: true, message: 'Dealer removed.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
