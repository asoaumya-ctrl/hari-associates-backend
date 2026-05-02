/**
 * Seed script — run once to populate initial data
 * Usage: node seed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Dealer = require('./models/Dealer');
const Inquiry = require('./models/Inquiry');

const DEALERS = [
  {
    name: 'Shree Hari Building Materials',
    address: 'Jogalekar Ward, Govindpur, Gondia',
    district: 'Gondia',
    pincode: '441601',
    phone: '9225236971',
    phone2: '9421930799',
    email: 'asoaumya@gmail.com',
    location: { lat: 21.4626, lng: 80.1961 },
    brands: ['Dalmia', 'UltraTech', 'Bangur', 'Chetak', 'JK Lakshmi'],
    isHeadOffice: true,
    isActive: true,
    notes: 'Head office and main stockist.',
  },
  {
    name: 'Gondia Cement & Hardware',
    address: 'Station Road, Gondia',
    district: 'Gondia',
    pincode: '441601',
    phone: '9876543210',
    brands: ['UltraTech', 'Bangur'],
    isHeadOffice: false,
    isActive: true,
  },
  {
    name: 'Sai Construction Supplies',
    address: 'Tirora Naka, Gondia',
    district: 'Gondia',
    pincode: '441601',
    phone: '9988776655',
    brands: ['Dalmia', 'Chetak'],
    isHeadOffice: false,
    isActive: true,
  },
  {
    name: 'Mahalaxmi Building Center',
    address: 'Amgaon Road, Bhandara',
    district: 'Bhandara',
    pincode: '441904',
    phone: '9876501234',
    brands: ['UltraTech', 'JK Lakshmi'],
    isHeadOffice: false,
    isActive: true,
  },
];

const SAMPLE_INQUIRY = {
  name: 'Ramesh Patil',
  phone: '9876543210',
  email: 'ramesh@example.com',
  productInterest: 'OPC 53',
  brand: 'UltraTech',
  quantity: '200 bags',
  deliveryLocation: 'Tirora, Gondia',
  message: 'Need cement for house construction next month.',
  source: 'contact_form',
};

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Dealer.deleteMany({});
    await Inquiry.deleteMany({});
    console.log('🧹 Cleared existing data');

    // Insert dealers
    const dealers = await Dealer.insertMany(DEALERS);
    console.log(`✅ Inserted ${dealers.length} dealers`);

    // Insert sample inquiry
    await Inquiry.create(SAMPLE_INQUIRY);
    console.log('✅ Inserted sample inquiry');

    console.log('\n🎉 Seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
}

seed();
