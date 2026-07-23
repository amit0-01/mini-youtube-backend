import mongoose from "mongoose";

const transcriptSchema = new mongoose.Schema(
  {
    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
      required: true,
      index: true,
    },

    language: {
      type: String,
      default: "unknown",
    },

    text: {
      type: String,
      default: "",
    },

    segments: [
      {
        start: Number,
        end: Number,
        text: String,
      },
    ],

    status: {
      type: String,
      enum: ["processing", "completed", "failed"],
      default: "processing",
    },

    error: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

transcriptSchema.index({ video: 1, language: 1 }, { unique: true });

export default mongoose.model("Transcript", transcriptSchema);