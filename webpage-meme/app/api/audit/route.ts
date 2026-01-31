import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const caption = formData.get("caption") as string;
        const imageUrl = formData.get("imageUrl") as string;
        const language = formData.get("language") as string || "English/Hindi";
        const sensitivity = formData.get("sensitivity") as string || "Standard";

        if (!file && !imageUrl && !caption) {
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
      Role: You are an expert Content Moderator for the Indian Social Media context.

      Task: Analyze the provided social media post (Image + Caption).
      Caption: "${caption || "[No Caption]"}"
      Context Language: ${language}
      Sensitivity Level: ${sensitivity}

      Check for:
      1. Hate Speech (Religious, Caste-based, Gender-based, Regional).
      2. Harassment or Bullying.
      3. Misinformation or Deepfakes.
      4. Cultural nuances specific to India (e.g., Casteism, Regional stereotypes).

      Output Requirements (JSON ONLY):
      {
        "is_biased": boolean,
        "bias_score": number (0-100), // Score < 80 is safe. Score >= 80 requires changes.
        "flagged_part": "string", // "Caption", "Image", "Both", or null if score < 80
        "category": "string" (e.g., "Casteism", "Sexism", "Safe", "Religious Hate", "Political"),
        "trigger_words": ["word1", "word2"], // Words or phrases in the text that caused the flag
        "explanation": "Brief explanation referencing cultural context if needed.",
        "suggestion": "A neutral rephrasing.",
        "policy_violation": "Yes/No based on Indian IT Rules"
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
        } else if (imageUrl) {
            try {
                const imageResp = await fetch(imageUrl);
                if (!imageResp.ok) throw new Error("Failed to fetch image from URL");
                const arrayBuffer = await imageResp.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                const base64Image = buffer.toString("base64");
                const mimeType = imageResp.headers.get("content-type") || "image/jpeg";

                parts.push({
                    inlineData: {
                        data: base64Image,
                        mimeType: mimeType,
                    },
                });
            } catch (err) {
                console.error("Error fetching image from URL:", err);
                return NextResponse.json({ error: "Failed to download image from URL" }, { status: 400 });
            }
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
