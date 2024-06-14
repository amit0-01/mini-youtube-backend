import mongoose, { Schema } from "mongoose";
import { User } from "./user.model.js";
const subscriptionSchema = new Schema({
    subscriber: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    channel: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }
})

export const Subscription = mongoose.model("Subscription", subscriptionSchema)