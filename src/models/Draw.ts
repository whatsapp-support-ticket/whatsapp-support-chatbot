import mongoose from 'mongoose';

interface DrawDocument {
  drawName: string;
  drawDate?: Date | null;
  ticketPrice: number;
  createdAt: Date;
}

const DrawSchema = new mongoose.Schema<DrawDocument>({
  drawName: { type: String, required: true },
  drawDate: { type: Date },
  ticketPrice: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

type DrawModel = mongoose.Model<DrawDocument>;

const existingDrawModel = mongoose.models.Draw as DrawModel | undefined;

if (existingDrawModel) {
  const drawDatePath = existingDrawModel.schema.path('drawDate');
  const drawDateStillRequired =
    drawDatePath &&
    'options' in drawDatePath &&
    Boolean((drawDatePath.options as { required?: boolean }).required);

  if (drawDateStillRequired) {
    delete mongoose.models.Draw;
  }
}

const Draw = (mongoose.models.Draw as DrawModel | undefined) || mongoose.model<DrawDocument>('Draw', DrawSchema);

export default Draw;
