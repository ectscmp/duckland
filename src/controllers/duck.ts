import type { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import type { duckInfo } from "../interfaces/duckInfo.js";
import { Duck } from "../models/duck.js";

type DuckBody = duckInfo;

function invalidIdResponse(res: Response): void {
  res.status(400).json({ error: "Invalid duck id." });
}

async function getAll(_req: Request, res: Response): Promise<void> {
  try {
    const ducks = await Duck.find().lean();
    res.status(200).json(ducks);
  } catch (error) {
    console.error("Error getting ducks:", error);
    res.status(500).json({ error: "Could not get ducks." });
  }
}

async function getById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    invalidIdResponse(res);
    return;
  }

  try {
    const duck = await Duck.findById(id).lean();
    if (!duck) {
      res.status(404).json({ error: "Duck not found." });
      return;
    }
    res.status(200).json(duck);
  } catch (error) {
    console.error("Error getting duck by id:", error);
    res.status(500).json({ error: "Could not get duck." });
  }
}

async function create(req: Request<unknown, unknown, DuckBody>, res: Response): Promise<void> {
  try {
    const duck = await Duck.create(req.body);
    res.status(201).json(duck);
  } catch (error) {
    console.error("Error creating duck:", error);
    res.status(400).json({ error: "Could not create duck. Check request body." });
  }
}

async function update(
  req: Request<{ id: string }, unknown, Partial<DuckBody>>,
  res: Response,
): Promise<void> {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    invalidIdResponse(res);
    return;
  }

  try {
    const duck = await Duck.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    }).lean();

    if (!duck) {
      res.status(404).json({ error: "Duck not found." });
      return;
    }

    res.status(200).json(duck);
  } catch (error) {
    console.error("Error updating duck:", error);
    res.status(400).json({ error: "Could not update duck. Check request body." });
  }
}

async function remove(req: Request<{ id: string }>, res: Response): Promise<void> {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    invalidIdResponse(res);
    return;
  }

  try {
    const duck = await Duck.findByIdAndDelete(id).lean();
    if (!duck) {
      res.status(404).json({ error: "Duck not found." });
      return;
    }
    res.status(200).json({ message: "Duck deleted.", duck });
  } catch (error) {
    console.error("Error deleting duck:", error);
    res.status(500).json({ error: "Could not delete duck." });
  }
}

export { getAll, getById, create, update, remove };
