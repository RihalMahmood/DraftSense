import { Schema, model, Document } from 'mongoose';
import { IBuild, IRunePage, IItemBuild, IRune, IItem, Role } from '../types';

//Sub-schemas

const RuneSchema = new Schema<IRune>(
  {
    id: { type: Number, required: true },
    key: { type: String, required: true },
    name: { type: String, required: true },
    iconUrl: { type: String, required: true },
    description: { type: String },
  },
  { _id: false }
);

const RunePageSchema = new Schema<IRunePage>(
  {
    primaryTree: { type: String, required: true },
    primaryTreeId: { type: Number, required: true },
    primary: { type: [RuneSchema], required: true },
    secondaryTree: { type: String, required: true },
    secondaryTreeId: { type: Number, required: true },
    secondary: { type: [RuneSchema], required: true },
    shards: { type: [RuneSchema], required: true },
  },
  { _id: false }
);

const ItemSchema = new Schema<IItem>(
  {
    id: { type: Number, required: true },
    name: { type: String, required: true },
    iconUrl: { type: String, required: true },
  },
  { _id: false }
);

const ItemBuildSchema = new Schema<IItemBuild>(
  {
    starter: { type: [ItemSchema], default: [] },
    core: { type: [ItemSchema], required: true },
    situational: { type: [ItemSchema], default: [] },
  },
  { _id: false }
);

//Main schema

export interface BuildDocument extends IBuild, Document { }

const BuildSchema = new Schema<BuildDocument>(
  {
    championId: { type: String, required: true, index: true },
    role: {
      type: String,
      enum: ['top', 'jungle', 'mid', 'bot', 'support'] as Role[],
      required: true,
    },
    patch: { type: String, required: true },
    runes: { type: RunePageSchema, required: true },
    itemBuild: { type: ItemBuildSchema, required: true },
    skillOrder: { type: [String], required: true },
    tips: { type: [String], default: [] },
  },
  { timestamps: true }
);

BuildSchema.index({ championId: 1, role: 1 }, { unique: true });

const Build = model<BuildDocument>('Build', BuildSchema);

export default Build;
