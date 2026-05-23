# VAULTRA — Full Setup & Deployment Guide
> Where Creativity Meets Wealth

---

## 📁 Project Structure

```
vaultra/
├── server/
│   ├── index.js              ← Express app entry point
│   ├── models/
│   │   ├── User.js           ← User schema (plans, wallet, referrals)
│   │   ├── Payment.js        ← Korapay payment records
│   │   └── Withdrawal.js     ← Withdrawal requests
│   ├── routes/
│   │   ├── auth.js           ← Signup, signin, signout
│   │   ├── payments.js       ← Korapay initiate + webhook
│   │   ├── user.js           ← Dashboard, bank, withdraw
│   │   └── admin.js          ← Manual verification panel
│   └── middleware/
│       └── auth.js           ← JWT protect, adminOnly
├── public/
│   ├── index.html            ← Landing page
│   ├── signin.html           ← Sign in
│   ├── signup.html           ← Sign up
│   ├── dashboard.html        ← User dashboard
│   ├── about.html            ← About page
│   ├── css/
│   │   ├── styles.css
│   │   ├── dashboard.css
│   │   └── auth.css
│   └── js/
│       ├── api.js            ← API client (all fetch calls)
│       ├── auth.js           ← Signup/signin form logic
│       ├── dashboard.js      ← Dashboard logic
│       └── main.js           ← Landing page JS
├── config/
│   └── db.js                 ← MongoDB connection
├── .env.example              ← Environment variables template
├── .gitignore
├── package.json
├── render.yaml               ← Render deployment config
└── README.md
```

---

## ⚙️ STEP 1 — MongoDB Atlas Setup

1. Go to **https://cloud.mongodb.com**
2. Sign in → click your cluster → **Connect**
3. Choose **Drivers** → Node.js
4. Copy the connection string — looks like:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/
   ```
5. Replace `<password>` with your actual password
6. Add `/vaultra` before the `?` so it becomes:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/vaultra?retryWrites=true&w=majority
   ```
7. In Atlas → **Network Access** → **Add IP Address** → choose **Allow Access from Anywhere** (0.0.0.0/0) — required for Render

---

## 💳 STEP 2 — Korapay Setup

1. Go to **https://merchant.korapay.com**
2. Sign in → **Settings** → **API Keys**
3. Copy:
   - **Public Key** (starts with `pk_live_...`)
   - **Secret Key** (starts with `sk_live_...`)
   - **Encryption Key**
4. Go to **Settings** → **Webhooks**
5. Add webhook URL:
   ```
   https://vaultra.onrender.com/api/payments/webhook
   ```
6. Select event: `charge.success`
7. Save

---

## 💻 STEP 3 — Local Setup (on your phone/computer)

### Install Node.js
If not installed: **https://nodejs.org** → download LTS version

### Clone / create project folder
```bash
# If using GitHub (recommended):
git clone https://github.com/YOUR_USERNAME/vaultra.git
cd vaultra

# Or just create the folder and paste all files in
```

### Install dependencies
```bash
npm install
```

### Create your .env file
```bash
# Copy the example file
cp .env.example .env
```
Then open `.env` and fill in your real values:
```
MONGODB_URI=mongodb+srv://...your actual string...
JWT_SECRET=any-long-random-string-minimum-32-chars
KORAPAY_PUBLIC_KEY=pk_live_...
KORAPAY_SECRET_KEY=sk_live_...
KORAPAY_ENCRYPTION_KEY=...
APP_URL=http://localhost:3000
ADMIN_SECRET=your-admin-password
```

### Run locally
```bash
npm run dev
```
Open browser: **http://localhost:3000**

---

## 🚀 STEP 4 — GitHub Setup

> This is how you get code from your phone to Render

### First time
```bash
git init
git add .
git commit -m "Initial VAULTRA commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/vaultra.git
git push -u origin main
```

### Every update after
```bash
git add .
git commit -m "describe what you changed"
git push
```
Render will **auto-deploy** every time you push to GitHub.

---

## 🌐 STEP 5 — Deploy on Render

1. Go to **https://render.com** → Sign in
2. Click **New** → **Web Service**
3. Connect your GitHub → select the **vaultra** repo
4. Fill in:
   - **Name**: `vaultra`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free
5. Scroll to **Environment Variables** → add each one:
   ```
   NODE_ENV          = production
   MONGODB_URI       = (your Atlas string)
   JWT_SECRET        = (your secret)
   KORAPAY_PUBLIC_KEY = (your key)
   KORAPAY_SECRET_KEY = (your key)
   KORAPAY_ENCRYPTION_KEY = (your key)
   KORAPAY_BASE_URL  = https://api.korapay.com/merchant/api/v1
   APP_URL           = https://vaultra.onrender.com
   ADMIN_SECRET      = (your admin password)
   STERLING_PRICE_KOBO = 700000
   SOVEREIGN_PRICE_KOBO = 1500000
   ```
6. Click **Create Web Service**
7. Wait ~3 minutes for first deploy
8. Your site is live at: **https://vaultra.onrender.com**

---

## 👑 STEP 6 — Create Your Admin Account

After deploying, sign up normally on the site, then run this **once** in MongoDB Atlas → Collections → Users:

Find your user document and update:
```json
{ "$set": { "isAdmin": true } }
```

Or use MongoDB Compass if you prefer a GUI.

---

## 🔑 Admin Panel API

All admin routes require your account to have `isAdmin: true`.

| Method | Route | What it does |
|--------|-------|--------------|
| GET  | `/api/admin/stats` | Platform stats |
| GET  | `/api/admin/users` | All users (filter by status/plan) |
| POST | `/api/admin/verify/:userId` | Manually activate a user |
| GET  | `/api/admin/payments` | All payment records |
| GET  | `/api/admin/withdrawals` | Pending withdrawals |
| POST | `/api/admin/withdrawals/:id/process` | Mark withdrawal done |

Example — manually verify a user:
```bash
curl -X POST https://vaultra.onrender.com/api/admin/verify/USER_ID \
  -H "Content-Type: application/json" \
  -H "Cookie: vaultra_token=YOUR_ADMIN_TOKEN" \
  -d '{"plan":"sterling"}'
```

---

## 💰 Referral Commission Structure

Currently set in `server/routes/payments.js`:

```js
const REFERRAL_BONUS = {
  direct: { sterling: 2000,  sovereign: 4000  },  // ₦ Level 1 (direct referral)
  level2: { sterling: 400,   sovereign: 800   },  // ₦ Level 2 (indirect)
};
```

**Update these numbers** once you confirm your percentages.

---

## 🛠️ Common Issues

**"Cannot connect to MongoDB"**
→ Check your MONGODB_URI is correct and Atlas Network Access allows 0.0.0.0/0

**"Payment webhook not firing"**
→ Make sure your Render URL is saved in Korapay webhook settings exactly as:
`https://vaultra.onrender.com/api/payments/webhook`

**"Site sleeping on Render free tier"**
→ Free Render services sleep after 15 mins of inactivity. Use **UptimeRobot** (free) to ping your site every 10 minutes:
1. Go to https://uptimerobot.com
2. Add monitor → HTTP → `https://vaultra.onrender.com`
3. Set interval: 5 minutes

**JWT token issues**
→ Make sure JWT_SECRET is the same value across all deployments

---

## 📞 Support Flow

When a user pays manually and needs verification:
1. They send payment proof to your WhatsApp/Telegram
2. You find their user ID in MongoDB Atlas
3. Call `POST /api/admin/verify/:userId` with `{ "plan": "sterling" }` or `"sovereign"`
4. Their account activates instantly

---

*VAULTRA — Where Creativity Meets Wealth* 🔱
