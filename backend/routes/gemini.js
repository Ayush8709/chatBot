import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { question } = req.body;
    // console.log('question is...', question);
    if (!question) return res.status(400).json({ error: "question is required" });

    // MCQs generate karne ke liye customized prompt
    const QUESTION_PROMPT = `
      Generate answer in 40 word   "${question}".
      Use simple and easy language.
    `;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "models/gemini-2.5-flash" });

    // Gemini ko prompt bhejo
    const result = await model.generateContent(QUESTION_PROMPT);
    const responseText = await result.response.text();
    console.log('this is responseText', responseText)

    // JSON response me bhej do
    res.json({ answer: responseText });

  } catch (error) {
    console.error("Gemini API error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
