import mongoose from 'mongoose';

const DrawSchema = new mongoose.Schema({
  drawName: { type: String, required: true },
  drawDate: { type: Date, required: true },
  ticketPrice: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Draw || mongoose.model('Draw', DrawSchema);