# Hari Associates — Backend API

Node.js + Express + MongoDB REST API for the Hari Associates cement distributor website.

---

## 📁 Project Structure

```
hari-associates-backend/
├── server.js               # App entry point
├── seed.js                 # One-time DB seed script
├── package.json
├── .env.example            # Copy to .env and fill values
├── .gitignore
├── models/
│   ├── Inquiry.js          # Contact/bulk inquiry form data
│   ├── CalculatorResult.js # Saved cement calculator results
│   └── Dealer.js           # Dealer network data
└── routes/
    ├── inquiries.js        # CRUD for form submissions
    ├── calculator.js       # Calculation + save result
    ├── dealers.js          # Dealer CRUD (add/edit/remove)
    └── dashboard.js        # Aggregated admin stats
```

---

## 🚀 Local Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your MongoDB URI
```

### 3. Seed initial dealer data
```bash
npm run seed
```

### 4. Start development server
```bash
npm run dev        # with nodemon (auto-restart)
# or
npm start          # plain node
```

Server runs at: `http://localhost:5000`

---

## ☁️ Deploy to Render (Free Tier)

1. Push this folder to a GitHub repository
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your GitHub repo
4. Set these fields:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Add Environment Variables:
   - `MONGODB_URI` → your MongoDB Atlas connection string
   - `ALLOWED_ORIGINS` → your website domain (e.g. `https://hari-associates.com`)
6. Click **Deploy**

> **MongoDB Atlas free tier:** [mongodb.com/atlas](https://www.mongodb.com/atlas) — M0 cluster is free forever

---

## 📡 API Reference

**Base URL (local):** `http://localhost:5000/api`  
**Base URL (production):** `https://your-render-app.onrender.com/api`

---

### 🟡 Inquiries

#### Submit an Inquiry
```
POST /api/inquiries
```
**Body:**
```json
{
  "name": "Ramesh Patil",
  "phone": "9876543210",
  "email": "ramesh@example.com",
  "productInterest": "OPC 53",
  "brand": "UltraTech",
  "quantity": "200 bags",
  "deliveryLocation": "Tirora, Gondia",
  "message": "Need for house construction",
  "source": "contact_form"
}
```
> `source` options: `contact_form` | `bulk_inquiry_popup` | `opc_quote` | `ppc_quote` | `calculator`

**Response:**
```json
{
  "success": true,
  "message": "Inquiry submitted successfully!",
  "data": { "id": "...", "name": "Ramesh Patil", "createdAt": "..." }
}
```

---

#### List Inquiries (Admin)
```
GET /api/inquiries?status=new&page=1&limit=20&search=ramesh
```

#### Update Inquiry Status (Admin)
```
PUT /api/inquiries/:id
Body: { "status": "contacted", "notes": "Called at 3pm", "isRead": true }
```
> `status` options: `new` | `contacted` | `in_progress` | `closed`

#### Delete Inquiry
```
DELETE /api/inquiries/:id
```

---

### 🟡 Calculator

#### Calculate + Save
```
POST /api/calculator
```
**Body:**
```json
{
  "area": 1500,
  "thicknessInches": 6,
  "mixRatio": "M25",
  "cementType": "OPC 53"
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "inputs": { "area": 1500, "thicknessInches": 6, "mixRatio": "M25", "cementType": "OPC 53" },
    "results": {
      "volumeM3": 20.99,
      "cementKg": 8396,
      "bagsRequired": 185,
      "bagWeightKg": 50,
      "wastagePercent": 10
    },
    "message": "You need approximately 185 bags of OPC 53 cement..."
  }
}
```

#### Calculator Analytics
```
GET /api/calculator/stats
```

---

### 🟡 Dealers

#### List Dealers (public — used by dealer locator)
```
GET /api/dealers?district=Gondia&brand=UltraTech&search=station
```

#### Add Dealer (Admin)
```
POST /api/dealers
Body:
{
  "name": "New Hardware Store",
  "address": "Main Road, Gondia",
  "district": "Gondia",
  "pincode": "441601",
  "phone": "9876500000",
  "brands": ["UltraTech", "Bangur"],
  "location": { "lat": 21.4626, "lng": 80.1961 }
}
```

#### Update Dealer (Admin)
```
PUT /api/dealers/:id
Body: { "isActive": false }   ← deactivate without deleting
```

#### Delete Dealer (Admin)
```
DELETE /api/dealers/:id
```

---

### 🟡 Dashboard

#### Full Stats Overview
```
GET /api/dashboard
```
Returns: inquiry counts, trends, breakdowns by status/brand/product, dealer counts, calculator stats.

#### Unread Inquiries Badge
```
GET /api/dashboard/inquiries/recent?limit=10
```

---

### 🟢 Health Check
```
GET /health
```
```json
{ "status": "ok", "uptime": 3600, "db": "connected" }
```

---

## 🔌 Frontend Integration

Replace the `submitForm()` and `submitInquiry()` functions in your HTML with these:

### Contact Form
```javascript
async function submitForm() {
  const payload = {
    name:             document.querySelector('[placeholder="Full name"]').value,
    phone:            document.querySelector('[placeholder="Mobile number"]').value,
    productInterest:  document.querySelector('.contact-form select').value,
    quantity:         document.querySelector('[placeholder*="500 bags"]').value,
    deliveryLocation: document.querySelector('[placeholder*="District"]').value,
    message:          document.querySelector('textarea').value,
    source:           'contact_form',
  };

  try {
    const res  = await fetch('https://YOUR-API.onrender.com/api/inquiries', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.success) {
      alert('✅ ' + data.message);
    } else {
      alert('❌ ' + data.message);
    }
  } catch (err) {
    alert('Network error. Please call us directly: 9225236971');
  }
}
```

### Bulk Inquiry Popup
```javascript
async function submitInquiry() {
  const inputs = document.querySelectorAll('.inq-input');
  const payload = {
    name:             inputs[0].value,
    phone:            inputs[1].value,
    quantity:         inputs[2].value + ' tons',
    deliveryLocation: inputs[3].value,
    brand:            inputs[4].value,
    source:           'bulk_inquiry_popup',
  };

  try {
    const res  = await fetch('https://YOUR-API.onrender.com/api/inquiries', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.success) {
      alert('✅ Thank you! We will contact you within 2 hours.\n\nUrgent: 9225236971');
      closeInquiry();
    } else {
      alert('❌ ' + data.message);
    }
  } catch (err) {
    alert('Network error. Please call: 9225236971');
  }
}
```

### Cement Calculator (connect to backend)
```javascript
async function calculateCement() {
  const area      = parseFloat(document.getElementById('calcArea').value);
  const thickness = parseFloat(document.getElementById('calcThickness').value);
  const mix       = document.getElementById('calcMix').value;   // "M20" | "M25" | "M30"
  const typeRaw   = document.getElementById('calcType').value;  // "opc" | "ppc"

  // Map frontend values to API values
  const MIX_MAP  = { '320': 'M20', '400': 'M25', '480': 'M30' };
  const TYPE_MAP = { opc: 'OPC 53', ppc: 'PPC' };

  if (!area || area <= 0) { alert('Enter a valid area.'); return; }

  try {
    const res  = await fetch('https://YOUR-API.onrender.com/api/calculator', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        area,
        thicknessInches: thickness,
        mixRatio:        MIX_MAP[mix],
        cementType:      TYPE_MAP[typeRaw],
      }),
    });
    const data = await res.json();
    if (data.success) {
      document.getElementById('calcBags').textContent = data.data.results.bagsRequired.toLocaleString('en-IN');
      document.getElementById('calcNote').textContent = data.data.message;
      document.getElementById('calcResult').classList.add('show');
    }
  } catch (err) {
    // Fallback to client-side calculation
    calculateCementLocal();
  }
}
```

### Load Dealers from API
```javascript
async function loadDealers(district = '') {
  const url = 'https://YOUR-API.onrender.com/api/dealers' + (district ? `?district=${district}` : '');
  const res  = await fetch(url);
  const data = await res.json();

  const list = document.getElementById('dealerList');
  list.innerHTML = data.data.map(d => `
    <div class="dealer-item">
      <div class="dealer-item-name">${d.name}</div>
      <div class="dealer-item-info">${d.address}</div>
      <div class="dealer-item-dist">📞 ${d.phone}</div>
    </div>
  `).join('');
}

// Call on page load
loadDealers();
```

---

## 🛡️ Security Notes

- Rate limiting: 100 req/15min globally, 10 submissions/hour for forms
- Input validation via Mongoose schema validators
- Helmet.js sets secure HTTP headers
- CORS restricted to your domain in production (set `ALLOWED_ORIGINS`)
- MongoDB injection protected by Mongoose (no raw string queries)

---

## 📦 Dependencies

| Package | Purpose |
|---|---|
| `express` | Web framework |
| `mongoose` | MongoDB ODM |
| `cors` | Cross-origin requests |
| `helmet` | Security HTTP headers |
| `express-rate-limit` | Spam protection |
| `dotenv` | Environment variables |
| `nodemon` | Dev auto-restart |
