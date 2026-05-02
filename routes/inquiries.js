const express = require('express');
const router = express.Router();
const Inquiry = require('../models/Inquiry');

// ─── POST /api/inquiries ───────────────────────────────────────────────────────
// Submit a new inquiry (contact form or bulk inquiry popup)
router.post('/', async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      productInterest,
      brand,
      quantity,
      deliveryLocation,
      message,
      source,
    } = req.body;

    // Validate required fields
    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name and phone number are required.',
      });
    }

    const inquiry = await Inquiry.create({
      name,
      phone,
      email: email || null,
      productInterest: productInterest || 'General',
      brand: brand || 'Any',
      quantity: quantity || null,
      deliveryLocation: deliveryLocation || null,
      message: message || null,
      source: source || 'contact_form',
    });

    res.status(201).json({
      success: true,
      message: 'Inquiry submitted successfully! We will contact you within 2 business hours.',
      data: {
        id: inquiry._id,
        name: inquiry.name,
        createdAt: inquiry.createdAt,
      },
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }
    console.error('Inquiry POST error:', err);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

// ─── GET /api/inquiries ────────────────────────────────────────────────────────
// List all inquiries (used by admin dashboard)
// Supports: ?status=new&page=1&limit=20&search=name_or_phone
router.get('/', async (req, res) => {
  try {
    const { status, page = 1, limit = 20, search } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { deliveryLocation: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [inquiries, total] = await Promise.all([
      Inquiry.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Inquiry.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: inquiries,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit),
      },
    });
  } catch (err) {
    console.error('Inquiry GET error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── GET /api/inquiries/:id ────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id).lean();
    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Inquiry not found.' });
    }
    res.json({ success: true, data: inquiry });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── PUT /api/inquiries/:id ────────────────────────────────────────────────────
// Update status / notes / isRead (admin use)
router.put('/:id', async (req, res) => {
  try {
    const { status, notes, isRead } = req.body;
    const updates = {};
    if (status) updates.status = status;
    if (notes !== undefined) updates.notes = notes;
    if (isRead !== undefined) updates.isRead = isRead;

    const inquiry = await Inquiry.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).lean();

    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Inquiry not found.' });
    }
    res.json({ success: true, message: 'Inquiry updated.', data: inquiry });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── DELETE /api/inquiries/:id ─────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const inquiry = await Inquiry.findByIdAndDelete(req.params.id);
    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Inquiry not found.' });
    }
    res.json({ success: true, message: 'Inquiry deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
