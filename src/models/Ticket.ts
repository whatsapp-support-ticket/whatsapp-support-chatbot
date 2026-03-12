import mongoose from 'mongoose';

const TicketSchema = new mongoose.Schema({
  ticketNumber: { type: String, required: true },
  drawId: { type: mongoose.Schema.Types.ObjectId, ref: 'Draw', required: true },
  status: { type: String, enum: ['available', 'reserved', 'sold'], default: 'available' },
  reservedBy: { type: String }, // phone number
  reservedAt: { type: Date },
  soldTo: { type: String },
  soldAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

TicketSchema.index({ drawId: 1, status: 1 });
TicketSchema.index({ drawId: 1, ticketNumber: 1 }, { unique: true });
TicketSchema.index({ status: 1, reservedAt: 1 });
TicketSchema.index({ reservedBy: 1, status: 1 });

export default mongoose.models.Ticket || mongoose.model('Ticket', TicketSchema);
