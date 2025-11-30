import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const caption = formData.get("caption") as string;

        if (!file && !caption) {
            return NextResponse.json({ error: "Please provide an image or caption" }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite-preview-09-2025" });

        const parts = [];

        // Add text prompt
        const prompt = `
      Analyze the following social media post (Image + Caption) for social bias (gender, caste, religion, race, etc.).
      
      Caption: "${caption || "[No Caption]"}"
      
      Task:
      1. Determine if the content is "Biased" or "Neutral".
      2. If biased, explain WHY it is biased (e.g., stereotypes, slurs).
      3. Assign a "Bias Score" from 0 (Safe) to 100 (Highly Offensive).
      4. Suggest a neutral, inclusive alternative for the caption.
      
      Return the result in this JSON format:
      {
        "is_biased": boolean,
        "bias_score": number,
        "explanation": "string",
        "suggestion": "string"
      }
      Return ONLY valid JSON.
    `;
        parts.push(prompt);

        // Add image if present
        if (file) {
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const base64Image = buffer.toString("base64");

            parts.push({
                inlineData: {
                    data: base64Image,
                    mimeType: file.type,
                },
            });
        }

        const result = await model.generateContent(parts);
        const response = await result.response;
        const responseText = response.text();

        const cleanText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();

        try {
            const jsonResponse = JSON.parse(cleanText);
            return NextResponse.json(jsonResponse);
        } catch (e) {
            console.error("JSON Parse Error:", responseText);
            return NextResponse.json({ error: "Failed to parse model response", raw: responseText }, { status: 500 });
        }

    } catch (error) {
        console.error("Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
