
import Transcript from "../models/transcript.model.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const askThisVideo = async ({ videoId, question }) => {
  const transcript = await Transcript.findOne({
    video: videoId,
    status: "completed",
  });

  if (!transcript) {
    throw new Error("Transcript is not available for this video yet.");
  }

  if (!transcript.segments?.length) {
    throw new Error("Transcript has no segments.");
  }

  const chunks = createTranscriptChunks(transcript.segments);
  const relevantChunks = retrieveRelevantChunks(question, chunks, 5);

  const context = relevantChunks
    .map((chunk, index) => {
      return `
        [${index + 1}]
        Timestamp: ${formatTime(chunk.start)} - ${formatTime(chunk.end)}
        Start: ${chunk.start}
        End: ${chunk.end}
        Text: ${chunk.text}
        `;
            })
            .join("\n");

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
        });

  const prompt = `
You are an AI learning assistant for a video platform.

Your task:
Answer the user's question using ONLY the transcript context below.

Rules:
- Do not use outside knowledge.
- If the answer is not available in the transcript, say:
  "I couldn't find this in the video."
- Include timestamp references.
- Keep the answer clear and beginner-friendly.
- Return JSON only. No markdown.

User question:
${question}

Transcript context:
${context}

Return only this JSON format:
{
  "answer": "your answer here",
  "references": [
    {
      "start": 0,
      "end": 0,
      "timestamp": "0:00",
      "text": "relevant transcript line"
    }
  ]
}
`;

  const result = await model.generateContent(prompt);
  const rawText = result.response.text();

  const parsed = safeJsonParse(rawText);

  if (!parsed) {
    return {
      question,
      answer: rawText,
      references: relevantChunks.map((chunk) => ({
        start: chunk.start,
        end: chunk.end,
        timestamp: formatTime(chunk.start),
        text: chunk.text,
      })),
    };
  }

  return {
    question,
    answer: parsed.answer,
    references:
      parsed.references?.length > 0
        ? parsed.references
        : relevantChunks.map((chunk) => ({
            start: chunk.start,
            end: chunk.end,
            timestamp: formatTime(chunk.start),
            text: chunk.text,
          })),
  };
}


const formatTime = (seconds = 0) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);

  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const normalize = (text = "") =>
  text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);

const createTranscriptChunks = (segments = [], maxChars = 900) => {
  const chunks = [];

  let currentChunk = {
    start: null,
    end: null,
    text: "",
  };

  for (const segment of segments) {
    if (currentChunk.start === null) {
      currentChunk.start = segment.start;
    }

    const nextText = `${currentChunk.text} ${segment.text}`.trim();

    if (nextText.length > maxChars && currentChunk.text) {
      chunks.push(currentChunk);

      currentChunk = {
        start: segment.start,
        end: segment.end,
        text: segment.text,
      };
    } else {
      currentChunk.text = nextText;
      currentChunk.end = segment.end;
    }
  }

  if (currentChunk.text) {
    chunks.push(currentChunk);
  }

  return chunks;
};

const scoreChunk = (question, chunkText) => {
  const questionWords = new Set(normalize(question));
  const chunkWords = normalize(chunkText);

  let score = 0;

  for (const word of chunkWords) {
    if (questionWords.has(word)) {
      score += 1;
    }
  }

  return score;
};

const retrieveRelevantChunks = (question, chunks, limit = 5) => {
  return chunks
    .map((chunk) => ({
      ...chunk,
      score: scoreChunk(question, chunk.text),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
};

const safeJsonParse = (text) => {
  try {
    const cleaned = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(cleaned);
  } catch {
    return null;
  }
};

export {askThisVideo}