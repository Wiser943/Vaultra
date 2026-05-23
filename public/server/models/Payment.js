const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({

  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  plan:        { type: String, enum: ['sterling', 'sovereign'], required: true },

  // Korapay fields
  reference:   { type: String, unique: true, required: true },
  korapayRef:  { type: String },
  amount:      { type: Number, required: true },   // in Naira
  currency:    { type: String, default: 'NGN' },
  channel:     { type: String },                   // card, bank_transfer, etc

  status: {
    type: String,
    enum: ['pending', 'processing', 'success', 'failed'],
    default: 'pending'
  },

  // Webhook payload snapshot
  webhookData: { type: mongoose.Schema.Types.Mixed },
  verifiedAt:  Date,

}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
