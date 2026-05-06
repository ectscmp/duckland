import { Router } from "express";
import {
  create,
  getAll,
  getById,
  remove,
  update,
} from "../controllers/duck.js";
import type { Request, Response, NextFunction } from "express";
import { Admin } from "../models/admin.js";

const duckRouter = Router();

async function checkAdmin(_req: Request, res: Response, next: NextFunction) {
  const admin = await Admin.findOne({
    email: _req.session.user?.username as string,
  });
  if (!admin) {
    return res.redirect("/?admin_issue=true");
  } else {
    return next();
  }
}

async function checkUser(_req: Request, res: Response, next: NextFunction) {
  if (!_req.session.user) {
    return res.redirect("/");
  } else {
    return next();
  }
}

duckRouter.get("/", getAll);
duckRouter.get("/:id", getById);
duckRouter.post("/", checkUser, create);
duckRouter.patch("/:id", checkAdmin, update);
duckRouter.delete("/:id", checkAdmin, remove);

export default duckRouter;
