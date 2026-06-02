const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  planType: { type: String, enum: ['sterling', 'sovereign'], required: true },
  amountNaira: { type: Number, required: true },
  amountEUR: { type: Number, required: true },
  
  // Korapay Details
  korapayReference: String,
  korapayCheckoutUrl: String,
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'success', 'failed', 'cancelled'],
    default: 'pending'
  },
  
  // Webhook Data
  webhookData: mongoose.Schema.Types.Mixed,
  
  // Referral Bonuses Applied
  referralBonusApplied: { type: Boolean, default: false },
  referrerBonusAmount: { type: Number, default: 0 },
  level2BonusAmount: { type: Number, default: 0 },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  completedAt: Date,
});

module.exports = mongoose.model('Payment', paymentSchema);
