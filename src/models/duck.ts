import { model, Schema } from "mongoose";
import type { duckParts, duckStats, duckInfo } from "../interfaces/duckInfo.js";

const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;

const duckParts: Schema<duckParts> = new Schema({
  head: { type: String, required: true, match: hexColorRegex },
  front1: { type: String, required: true, match: hexColorRegex },
  front2: { type: String, required: true, match: hexColorRegex },
  back1: { type: String, required: true, match: hexColorRegex },
  back2: { type: String, required: true, match: hexColorRegex },
});

const duckStats: Schema<duckStats> = new Schema({
  strength: { type: Number, required: true, default: 1 },
  health: { type: Number, required: true, default: 1 },
  focus: { type: Number, required: true, default: 1 },
  intelligence: { type: Number, required: true, default: 1 },
  kindness: { type: Number, required: true, default: 1 },
});

const duckInfo: Schema<duckInfo> = new Schema({
  name: { type: String, required: true },
  assember: { type: String, required: true },
  adjectives: { type: [String], required: true },
  body: { type: duckParts, required: true },
  derpy: { type: Boolean, required: true, default: false },
  bio: { type: String, required: true },
  date: { type: Date, required: true },
  approved: { type: Boolean, required: true, default: false },
  stats: { type: duckStats, required: true },
});

export const Duck = model<duckInfo>("Duck", duckInfo);
