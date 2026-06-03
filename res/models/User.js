const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Info
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: String,
  niche: { type: String, enum: ['fashion', 'tech', 'vlog', 'beauty', 'lifestyle'], default: 'lifestyle' },

  // Referral System
  referralCode: { type: String, unique: true, sparse: true },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  // Wallet
  balanceEUR: { type: Number, default: 0 },
  balanceNaira: { type: Number, default: 0 },

  // Referral Earnings
  level1Referrals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  level2Referrals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  level1Earnings: { type: Number, default: 0 },
  level2Earnings: { type: Number, default: 0 },

  // Plan Status
  planActivated: { type: Boolean, default: false },
  planType: { type: String, enum: ['sterling', 'sovereign'], default: null },
  planActivatedAt: Date,

  // Task Streams
  unlockedStreams: [
    {
      name: String,
      unlockedAt: Date,
    }
  ],

  // Bank Accounts
  bankAccounts: [
    {
      bankName: String,
      accountNumber: String,
      accountName: String,
      isPrimary: { type: Boolean, default: false },
      addedAt: { type: Date, default: Date.now },
    }
  ],

  // Email Verification
  emailVerified: { type: Boolean, default: false },

  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

// Method to generate referral code
userSchema.methods.generateReferralCode = function() {
  const code = 'VLT' + Math.random().toString(36).substr(2, 9).toUpperCase();
  this.referralCode = code;
  return code;
};

module.exports = mongoose.model('User', userSchema);
