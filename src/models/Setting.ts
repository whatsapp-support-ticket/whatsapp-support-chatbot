import mongoose from 'mongoose';

const SettingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  qrCodeUrl: { type: String },
  paymentInstructions: { type: String },
  activeDrawId: { type: mongoose.Schema.Types.ObjectId, ref: 'Draw' },
  updatedAt: { type: Date, default: Date.now },
});

SettingSchema.index({ key: 1 }, { unique: true });

export default mongoose.models.Setting || mongoose.model('Setting', SettingSchema);
