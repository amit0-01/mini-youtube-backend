import { GoogleGenerativeAI } from "@google/generative-ai";
import {WEBSITE_CONTEXT} from '../constant.js'
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);


export const chatWithAI = async (req, res) => {
    try {
      const { prompt } = req.body;
  
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }
  
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
      });
  
      // 🔥 Website-specific prompt
      const finalPrompt = `
        ${WEBSITE_CONTEXT}
        
        User question:
        ${prompt}
        `;
  
      const result = await model.generateContent(finalPrompt);
  
      return res.status(200).json({
        response: result.response.text(),
      });
    } catch (error) {
      console.error("Gemini API Error:", error);
  
      return res.status(500).json({
        response:
          "Sorry, I am unable to process your request at the moment. Please try again later.",
      });
    }
  };
  
