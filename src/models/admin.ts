import { model, Schema } from "mongoose";
import type {adminInfo} from "../interfaces/admininfo.js";


const adminInfo = new Schema({
    id: {type: Number, required: true},
    email: {type: String, required: true}
})


export const Admin = model<adminInfo>("Admin", adminInfo);