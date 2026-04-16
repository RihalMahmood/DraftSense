import { Schema, model, Document } from 'mongoose';
import { Role } from '../types';

//Avoid extending both IChampion + Document simultaneously (TS2320 - `id` conflict).
//Instead, define the shape inline as a Mongoose Document type.
export interface ChampionDocument extends Document {
  championId: string;   //stored as `championId` in DB to avoid collision with Mongoose `id`
  name: string;
  title: string;
  imageUrl: string;
  splashUrl: string;
  roles: Role[];
  tags: string[];
}

const ChampionSchema = new Schema<ChampionDocument>(
  {
    championId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    title: { type: String, default: '' },
    imageUrl: { type: String, required: true },
    splashUrl: { type: String, default: '' },
    roles: {
      type: [String],
      enum: ['top', 'jungle', 'mid', 'bot', 'support'] as Role[],
      required: true,
    },
    tags: { type: [String], default: [] },
  },
  { timestamps: true }
);

const Champion = model<ChampionDocument>('Champion', ChampionSchema);

export default Champion;
