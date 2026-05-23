const mongoose = require('mongoose');

const withdrawalSchema = new mongoose.Schema({

  user:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amountEur:     { type: Number, required: true },
  amountNaira:   { type: Number },           // converted at time of request
  exchangeRate:  { type: Number },           // rate used
  bankName:      { type: String, required: true },
  accountNumber: { type: String, required: true },
  accountName:   { type: String, required: true },

  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },

  reference:     { type: String, unique: true },
  processedAt:   Date,
  note:          String,                     // admin note

}, { timestamps: true });

module.exports = mongoose.model('Withdrawal', withdrawalSchema);
