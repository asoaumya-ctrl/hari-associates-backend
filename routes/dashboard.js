const express = require('express');
const router = express.Router();
const Inquiry = require('../models/Inquiry');
const CalculatorResult = require('../models/CalculatorResult');
const Dealer = require('../models/Dealer');

// ─── GET /api/dashboard ────────────────────────────────────────────────────────
// Single endpoint that returns all key stats for the admin dashboard
router.get('/', async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOf30Days = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const startOf7Days  = new Date(now - 7  * 24 * 60 * 60 * 1000);

    // Run all aggregations in parallel
    const [
      totalInquiries,
      newInquiries,
      todayInquiries,
      last7Inquiries,
      last30Inquiries,
      inquiriesByStatus,
      inquiriesBySource,
      inquiriesByProduct,
      inquiriesByBrand,
      recentInquiries,
      totalDealers,
      activeDealers,
      dealersByDistrict,
      totalCalcs,
      last30Calcs,
      calcsByType,
    ] = await Promise.all([

      // ── Inquiry counts ─────────────────────────────────────────────────────────
      Inquiry.countDocuments(),
      Inquiry.countDocuments({ status: 'new' }),
      Inquiry.countDocuments({ createdAt: { $gte: startOfToday } }),
      Inquiry.countDocuments({ createdAt: { $gte: startOf7Days } }),
      Inquiry.countDocuments({ createdAt: { $gte: startOf30Days } }),

      // ── Breakdowns ─────────────────────────────────────────────────────────────
      Inquiry.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Inquiry.aggregate([
        { $group: { _id: '$source', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Inquiry.aggregate([
        { $group: { _id: '$productInterest', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Inquiry.aggregate([
        { $group: { _id: '$brand', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // ── Recent 5 inquiries ─────────────────────────────────────────────────────
      Inquiry.find({ isRead: false })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name phone productInterest quantity deliveryLocation source status createdAt')
        .lean(),

      // ── Dealer stats ───────────────────────────────────────────────────────────
      Dealer.countDocuments(),
      Dealer.countDocuments({ isActive: true }),
      Dealer.aggregate([
        { $group: { _id: '$district', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // ── Calculator stats ───────────────────────────────────────────────────────
      CalculatorResult.countDocuments(),
      CalculatorResult.countDocuments({ createdAt: { $gte: startOf30Days } }),
      CalculatorResult.aggregate([
        { $group: { _id: '$cementType', count: { $sum: 1 } } },
      ]),
    ]);

    // ── Inquiry trend: last 7 days (grouped by date) ───────────────────────────
    const inquiryTrend = await Inquiry.aggregate([
      { $match: { createdAt: { $gte: startOf7Days } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      data: {
        inquiries: {
          total: totalInquiries,
          new: newInquiries,
          today: todayInquiries,
          last7Days: last7Inquiries,
          last30Days: last30Inquiries,
          byStatus: inquiriesByStatus,
          bySource: inquiriesBySource,
          byProduct: inquiriesByProduct,
          byBrand: inquiriesByBrand,
          trend: inquiryTrend,
          unreadRecent: recentInquiries,
        },
        dealers: {
          total: totalDealers,
          active: activeDealers,
          byDistrict: dealersByDistrict,
        },
        calculator: {
          total: totalCalcs,
          last30Days: last30Calcs,
          byType: calcsByType,
        },
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ success: false, message: 'Failed to load dashboard data.' });
  }
});

// ─── GET /api/dashboard/inquiries/recent ──────────────────────────────────────
// Quick endpoint for "new inquiries" notification badge
router.get('/inquiries/recent', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const inquiries = await Inquiry.find({ status: 'new' })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .select('name phone productInterest quantity source createdAt')
      .lean();

    const count = await Inquiry.countDocuments({ status: 'new', isRead: false });

    res.json({ success: true, unreadCount: count, data: inquiries });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
