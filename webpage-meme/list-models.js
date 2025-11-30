const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Manually load .env.local because dotenv doesn't load it by default
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("GEMINI_API_KEY not found in environment");
        return;
    }

    console.log("Using API Key:", apiKey.substring(0, 10) + "...");

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Access the model manager to list models
    // Note: In some versions of the SDK, this might be different. 
    // We'll try to use the API directly if SDK helper isn't obvious, 
    // but the SDK usually doesn't expose listModels directly on the main instance easily in older versions.
    // However, let's try a simple generation with a known fallback model first, 
    // or just try to fetch models via REST if SDK fails.
    
    // Actually, let's try to use the SDK to generate content with 'gemini-1.5-flash-001' 
    // which is the specific version, to see if that works.
    // But listing is better.
    
    try {
        // Direct REST call to list models to be sure, as SDK might abstract it
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();
        
        if (data.models) {
            console.log("Available Models:");
            data.models.forEach(m => {
                console.log(`- ${m.name} (${m.displayName}) - Supported methods: ${m.supportedGenerationMethods}`);
            });
        } else {
            console.error("Failed to list models:", data);
        }
    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
