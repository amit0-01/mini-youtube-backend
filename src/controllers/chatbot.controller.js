import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// simple in-memory context (optional, safe)
const conversationContexts = new Map();

export const chatWithAI = async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const result = await model.generateContent(prompt);

    const aiText = result.response.text();

    return res.status(200).json({
      response: aiText,
    });
  } catch (error) {
    console.error("Gemini API Error:", error);

    return res.status(500).json({
      response:
        "Sorry, I am unable to process your request at the moment. Please try again later.",
    });
  }
};
