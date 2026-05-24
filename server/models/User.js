const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const { nanoid } = require('nanoid');

const userSchema = new mongoose.Schema({

  // ── Basic Info ────────────────────────────────────────────
  fullName:  { type: String, required: true, trim: true },
  email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone:     { type: String, trim: true },
  password:  { type: String, required: true, minlength: 8, select: false },
  niche:     { type: String, enum: ['fashion','tech','vlog','beauty','lifestyle'], default: 'lifestyle' },

  // ── Plan & Status ─────────────────────────────────────────
  plan: {
    type: String,
    enum: ['none', 'sterling', 'sovereign'],
    default: 'none'
  },
  status: {
    type: String,
    enum: ['locked', 'verification', 'verified'],
    default: 'locked'
  },

  // ── Referral System ───────────────────────────────────────
  referralCode:       { type: String, unique: true, default: () => 'VLT' + nanoid(7).toUpperCase() },
  referredBy:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  referredByLevel2:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  directReferrals:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // ── Wallet / Earnings ─────────────────────────────────────
  wallet: {
    balanceEur:       { type: Number, default: 0 },   // available to withdraw
    totalEarned:      { type: Number, default: 0 },   // lifetime total
    pendingEur:       { type: Number, default: 0 },   // awaiting verification
    referralNaira:    { type: Number, default: 0 },   // referral bonuses in ₦
    vaultRewardNaira: { type: Number, default: 0 },   // ₦7k/₦15k welcome bonus
    totalWithdrawn:   { type: Number, default: 0 }
  },

  // ── Bank Account ──────────────────────────────────────────
  bankAccounts: [{
    bankName:      String,
    accountNumber: String,
    accountName:   String,
    isPrimary:     { type: Boolean, default: false }
  }],

  // ── Misc ──────────────────────────────────────────────────
  isAdmin:      { type: Boolean, default: false },
  lastLoginAt:  Date,
  activatedAt:  Date,

}, { timestamps: true });

// ── Hash password before save ─────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ── Compare password ──────────────────────────────────────
userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// ── Safe user object (no password) ───────────────────────
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
