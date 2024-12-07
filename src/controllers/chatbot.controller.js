import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("AIzaSyCBRd3ax6dfWOSGGZJtYnsSF0SLwCqLorM");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const prompt = "Explain how AI works";

export const chatWithAI = async(req,res)=>{
    try {
        const {prompt} = req.body;
        if(!prompt){
            return res.status(400).json({error: "Prompt is required"});
        }
        const result = await model.generateContent(prompt);
        return res.status(200).json({response: result.response.candidates[0].content.parts[0].text});
    } catch (error) {
        res.status(400).json({'eroor': error});
        
    }
}

// const result = await model.generateContent(prompt);
// console.log('result',result.response.text());

