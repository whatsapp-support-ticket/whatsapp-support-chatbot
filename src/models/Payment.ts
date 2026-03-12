import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema({
  phoneNumber: { type: String, required: true },
  drawId: { type: mongoose.Schema.Types.ObjectId, ref: 'Draw' },
  ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' },
  ticketNumber: { type: String, required: true },
  screenshotUrl: { type: String },
  utrNumber: { type: String },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  reviewedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

PaymentSchema.index({ status: 1, createdAt: -1 });
PaymentSchema.index({ phoneNumber: 1, createdAt: -1 });
PaymentSchema.index({ ticketNumber: 1, createdAt: -1 });

export default mongoose.models.Payment || mongoose.model('Payment', PaymentSchema);
