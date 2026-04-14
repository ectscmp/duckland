import { model, Schema } from "mongoose";
import type { duckParts, duckStats, duckInfo } from "../interfaces/duckInfo.js";

const COLORS = [
  "black",
  "red",
  "blue",
  "green",
  "yellow",
  "white",
  "pink",
  "purple",
];

const duckParts = new Schema({
  head: { type: String, required: true, enum: COLORS },
  frontLeft: { type: String, required: true, enum: COLORS },
  frontRight: { type: String, required: true, enum: COLORS },
  rearLeft: { type: String, required: true, enum: COLORS },
  rearRight: { type: String, required: true, enum: COLORS },
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
  assembler: { type: String, required: true },
  adjectives: { type: [String], required: true },
  body: { type: duckParts, required: true },
  derpy: { type: Boolean, required: true, default: false },
  bio: { type: String, required: true },
  date: { type: Date, required: true },
  approved: { type: Boolean, required: true, default: false },
  stats: { type: duckStats, required: true },
});

export const Duck = model<duckInfo>("Duck", duckInfo);
