import { Router } from "express";
import { create, getAll, getById, remove, update } from "../controllers/duck.js";

const duckRouter = Router();

duckRouter.get("/", getAll);
duckRouter.get("/:id", getById);
duckRouter.post("/", create);
duckRouter.patch("/:id", update);
duckRouter.delete("/:id", remove);

export default duckRouter;
