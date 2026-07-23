import Transcript from "../models/transcript.model.js";
import { transcribe } from "../utils/transcribe.js";

export const generateTranscriptForVideo = async (videoId, videoPath) => {
  let transcript = await Transcript.findOne({ video: videoId });

  if (!transcript) {
    transcript = await Transcript.create({
      video: videoId,
      status: "processing",
    });
  }

  try {
    const result = await transcribe(videoPath);

    transcript.language = result.language;
    transcript.text = result.text;
    transcript.segments = result.segments;
    transcript.status = "completed";
    transcript.error = null;

    await transcript.save();

    return transcript;
  } catch (error) {
    transcript.status = "failed";
    transcript.error = error.message || "Transcription failed";

    await transcript.save();

    throw error;
  }
};