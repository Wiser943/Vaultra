const mongoose = require('mongoose');

const withdrawalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amountEUR: { type: Number, required: true },
  amountNaira: { type: Number, required: true },
  exchangeRate: { type: Number, default: 1600 },
  
  // Bank Details
  bankName: String,
  accountNumber: String,
  accountName: String,
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  
  // Email Verification
  emailVerificationCode: String,
  emailVerificationExpires: Date,
  emailVerified: { type: Boolean, default: false },
  
  // Reference
  reference: { type: String, unique: true },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  completedAt: Date,
});

// Generate unique reference before saving
withdrawalSchema.pre('save', async function(next) {
  if (!this.reference) {
    this.reference = 'WTH' + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Withdrawal', withdrawalSchema);
