# VAULTRA - Earn Euros from Your Creativity

A full-stack web application where Nigerian creators can earn €2/hour across 6 simultaneous task streams, with a powerful 2-level referral system, Korapay payment integration, and direct bank withdrawals.

## 🎯 Features

✅ **User Authentication** — Signup with referral code capture, signin, JWT-based sessions
✅ **2-Level Referral System** — Earn ₦2,000-₦4,000 per direct referral, ₦400-₦800 per indirect
✅ **Korapay Payment Integration** — Sterling (₦7,000) and Sovereign (₦15,000) plans
✅ **6 Task Streams** — Vault Lifestyle, Realtime, FaceTime, Works, Lingua, Script2Cash
✅ **Bank Account Management** — Add multiple Nigerian bank accounts
✅ **Email Verification** — Resend-powered verification codes for withdrawals
✅ **Real-time Dashboard** — Wallet, referrals, task streams, withdrawal history
✅ **Mobile-Responsive UI** — Dark gold-and-deep-purple theme, fully responsive

## 📋 Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (no frameworks)
- **Backend**: Node.js + Express.js
- **Database**: MongoDB
- **Payments**: Korapay API
- **Email**: Resend API
- **Authentication**: JWT
- **Deployment**: Render, Railway, or Heroku

## 🚀 Quick Start

### Prerequisites

- Node.js 16+
- MongoDB (local or cloud)
- Korapay account (korapay.com)
- Resend account (resend.com)

### Installation

1. **Clone/Extract the project**
   ```bash
   cd vaultra-vanilla
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create `.env` file**
   ```bash
   cp .env.example .env
   ```

4. **Update `.env` with your credentials**
   ```
   MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/vaultra
   JWT_SECRET=your-super-secret-key
   KORAPAY_PUBLIC_KEY=your-korapay-public-key
   KORAPAY_SECRET_KEY=your-korapay-secret-key
   RESEND_API_KEY=your-resend-api-key
   BACKEND_URL=http://localhost:3000
   FRONTEND_URL=http://localhost:5000
   ```

5. **Start the server**
   ```bash
   npm run dev
   ```

6. **Open in browser**
   ```
   http://localhost:3000
   ```

## 📁 Project Structure

```
vaultra-vanilla/
├── server.js                 # Main Express server
├── models/
│   ├── User.js              # User schema with referrals
│   ├── Payment.js           # Payment records
│   └── Withdrawal.js        # Withdrawal requests
├── routes/
│   ├── auth.js              # Authentication endpoints
│   ├── payments.js          # Payment & Korapay integration
│   ├── withdrawals.js       # Withdrawal & bank management
│   ├── dashboard.js         # Dashboard stats
│   └── webhook.js           # Korapay webhook handler
├── middleware/
│   └── auth.js              # JWT authentication
├── utils/
│   └── email.js             # Resend email service
├── public/
│   ├── index.html           # Single-page app
│   ├── css/
│   │   └── style.css        # Dark gold-purple theme
│   └── js/
│       └── app.js           # Frontend logic
└── .env.example             # Environment template
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/signup` — Create account with referral code
- `POST /api/auth/signin` — Login with email/password
- `GET /api/auth/profile` — Get user profile

### Payments
- `POST /api/payments/initiate` — Start Korapay checkout
- `POST /api/payments/verify/:reference` — Verify payment
- `POST /api/payments/webhook` — Korapay callback

### Withdrawals
- `POST /api/withdrawals/initiate` — Start withdrawal with email verification
- `POST /api/withdrawals/verify` — Verify email code and process withdrawal
- `GET /api/withdrawals/history` — Get withdrawal history
- `POST /api/withdrawals/add-bank` — Add bank account

### Dashboard
- `GET /api/dashboard/stats` — Get wallet, referrals, streams, withdrawals

## 💰 Payment Plans

| Plan | Amount | Welcome Bonus | L1 Referral | L2 Referral |
|------|--------|---------------|-------------|-------------|
| **Sterling** | ₦7,000 | ₦7,000 | ₦2,000 | ₦400 |
| **Sovereign** | ₦15,000 | ₦15,000 | ₦4,000 | ₦800 |

## 🤝 Referral System

- **Level 1**: Direct referrals you invite
- **Level 2**: Referrals of your Level 1 referrals
- Bonuses credited **instantly** upon payment completion
- Track earnings in real-time on dashboard

## 🏦 Withdrawal Flow

1. User initiates withdrawal with EUR amount
2. Verification code sent to email via Resend
3. User enters code to confirm
4. Balance deducted, withdrawal marked "processing"
5. Processed to bank account within 24-48 hours

## 🔐 Security

- Passwords hashed with bcryptjs
- JWT tokens for session management
- Email verification for withdrawals
- Bank account validation
- CORS protection
- Environment variables for secrets

## 🎨 UI/UX

- **Color Scheme**: Deep Purple (#1a0f2e) + Dark Gold (#c9a84c) + Emerald Green (#10b981)
- **Mobile-First**: Fully responsive design
- **Animations**: Smooth transitions and hover effects
- **Accessibility**: Semantic HTML, keyboard navigation

## 📱 Pages

1. **Landing Page** — Hero, features, pricing
2. **Signup** — Create account with referral code
3. **Signin** — Login with email/password
4. **Dashboard** — Wallet, referrals, streams, withdrawals
5. **Payment** — Choose and activate plan
6. **Withdrawal** — Initiate withdrawal with email verification
7. **Bank Management** — Add and manage bank accounts

## 🚀 Deployment

### Render

1. Push code to GitHub
2. Create new Web Service on Render
3. Connect GitHub repository
4. Set environment variables
5. Deploy

### Railway

1. Connect GitHub
2. Create new project
3. Add MongoDB plugin
4. Set environment variables
5. Deploy

### Heroku

```bash
heroku create vaultra-app
heroku config:set MONGODB_URI=your-mongodb-uri
heroku config:set JWT_SECRET=your-secret
heroku config:set KORAPAY_SECRET_KEY=your-key
git push heroku main
```

## 🔧 Environment Variables

```
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/vaultra
JWT_SECRET=your-super-secret-jwt-key
KORAPAY_PUBLIC_KEY=your-korapay-public-key
KORAPAY_SECRET_KEY=your-korapay-secret-key
RESEND_API_KEY=your-resend-api-key
BACKEND_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5000
```

## 📊 Database Schema

### Users
- Basic info (name, email, phone, niche)
- Referral tracking (code, referredBy, level1/2 referrals)
- Wallet (EUR and Naira balances)
- Referral earnings (level 1 & 2)
- Plan status and unlocked streams
- Bank accounts

### Payments
- User reference
- Plan type and amounts
- Korapay reference and checkout URL
- Status and webhook data
- Referral bonus tracking

### Withdrawals
- User and amount
- Bank details
- Email verification code
- Status (pending → processing → completed)
- Reference number

## 🧪 Testing

### Manual Testing Checklist

- [ ] Signup with referral code
- [ ] Signin with credentials
- [ ] Select and activate plan (Sterling/Sovereign)
- [ ] Verify payment with Korapay
- [ ] Check referral bonuses credited
- [ ] Add bank account
- [ ] Initiate withdrawal
- [ ] Verify email code
- [ ] Check withdrawal history
- [ ] Copy referral link
- [ ] Mobile responsiveness

## 🐛 Troubleshooting

**MongoDB Connection Error**
- Ensure MongoDB is running or connection string is correct
- Check network access if using MongoDB Atlas

**Korapay Payment Failed**
- Verify API keys are correct
- Check webhook URL is accessible
- Ensure BACKEND_URL is set correctly

**Email Not Sending**
- Verify Resend API key is valid
- Check email domain is verified in Resend
- Review email logs in Resend dashboard

**Frontend Not Loading**
- Ensure server is running on port 3000
- Check browser console for errors
- Verify CORS is enabled

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review API logs
3. Check MongoDB for data integrity
4. Verify all environment variables are set

## 📄 License

MIT License - feel free to use and modify

## 🙏 Credits

Built with Node.js, Express, MongoDB, Korapay, and Resend.

---

**Ready to launch?** Follow the deployment guide above and go live! 🚀
