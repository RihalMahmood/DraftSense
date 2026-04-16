import { Schema, model, Document, Model } from 'mongoose';
import { IMatchup, Role } from '../types';

export interface MatchupDocument extends IMatchup, Document { }

const MatchupSchema = new Schema<MatchupDocument>(
  {
    championId: { type: String, required: true, index: true },
    opponentId: { type: String, required: true, index: true },
    role: {
      type: String,
      enum: ['top', 'jungle', 'mid', 'bot', 'support'] as Role[],
      required: true,
    },
    winRate: { type: Number, required: true, min: 0, max: 1 },
    gamesPlayed: { type: Number, required: true, default: 0 },
    patch: { type: String, required: true },
  },
  { timestamps: true }
);

//Compound index for fast lookup: "how does Vi do vs Hecarim in jungle?"
MatchupSchema.index({ championId: 1, opponentId: 1, role: 1 }, { unique: true });

const Matchup: Model<MatchupDocument> = model<MatchupDocument>(
  'Matchup',
  MatchupSchema
);

export default Matchup;
