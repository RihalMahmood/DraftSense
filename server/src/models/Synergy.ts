import { Schema, model, Document, Model } from 'mongoose';
import { ISynergy } from '../types';

export interface SynergyDocument extends ISynergy, Document { }

const SynergySchema = new Schema<SynergyDocument>(
  {
    championId: { type: String, required: true, index: true },
    allyId: { type: String, required: true, index: true },
    winRate: { type: Number, required: true, min: 0, max: 1 },
    gamesPlayed: { type: Number, required: true, default: 0 },
    patch: { type: String, required: true },
  },
  { timestamps: true }
);

//Compound index for fast synergy lookup
SynergySchema.index({ championId: 1, allyId: 1 }, { unique: true });

const Synergy: Model<SynergyDocument> = model<SynergyDocument>(
  'Synergy',
  SynergySchema
);

export default Synergy;
