import mongoose, {Schema} from "mongoose";

const viewSchema = new Schema ({
    video :{
        type: Schema.Types.ObjectId,
        ref: 'Video',
        required: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    viewedAt: {
        type: Date,
        default: Date.now(),
    }
}, {timestamps: true});

export const View = mongoose.model('View', viewSchema)