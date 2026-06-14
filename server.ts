import express from "express";
import path from "path";
import multer from "multer";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Setup multer for handling STT files in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // limit to 10MB
});

app.use(express.json({ limit: "20mb" }));



/**
 * Endpoint: /api/chat
 * Handles chat prompts using Groq and analyzes sentiment/language.
 * If drawing/image request is detected, it generates an image via Gemini.
 */
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, preferredLanguage, preferredModel } = req.body;
    const groqKey = process.env.GROQ_API_KEY;

    if (!groqKey) {
      return res.status(400).json({
        error: "Missing API Key",
        message: "GROQ_API_KEY is not configured. Please add it to your environment configurations.",
      });
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Invalid messages parameter" });
    }

    const lastMessage = messages[messages.length - 1].content;
    


    // Standard Chat Completion with Groq
    // Selected model (defaults to Llama 3.3 70B for top tier quality)
    const model = preferredModel || "llama-3.3-70b-versatile";
    
    // Construct system instructions explaining the expected structured JSON response format.
    const systemPrompt = `You are a helpful, empathetic, and professional AI chatbot with real-time multilingual capabilities.
The user's native language is specified as: ${preferredLanguage || "en-IN"}. Always match their choice.
You MUST analyze the sentiment of the user's latest text, evaluate their input language, and provide your reply.

CRITICAL: Your entire reply must be formatted strictly as a single, valid JSON object on index 0 of your reply. Do NOT put your JSON in markdown code blocks like \`\`\`json. Return a pure raw JSON string ONLY.
The JSON keys MUST match exactly:
{
  "response": "Your conversational answer in the appropriate, matched language",
  "sentiment": "positive" | "negative" | "neutral",
  "detectedLanguage": "The ISO language code, e.g. 'en', 'hi', 'ta', 'te'"
}

Keep your responses conversational, engaging, and supportive. If the user sent a sad comment, offer consolation (negative sentiment); if they express joy, celebrate (positive sentiment).`;

    const groqMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m: any) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.content || m.text || "",
      })),
    ];

    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: groqMessages,
        temperature: 0.7,
        max_tokens: 1024,
        response_format: { type: "json_object" },
      }),
    });

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      throw new Error(`Groq API returned ${groqResponse.status}: ${errorText}`);
    }

    const groqData = await groqResponse.json();
    const rawContent = groqData.choices[0].message.content.trim();

    try {
      // Parse the structured content
      const parsed = JSON.parse(rawContent);
      return res.json({
        response: parsed.response,
        sentiment: parsed.sentiment || "neutral",
        detectedLanguage: parsed.detectedLanguage || preferredLanguage || "en",
      });
    } catch {
      // Fallback if parsing failed
      return res.json({
        response: rawContent,
        sentiment: "neutral",
        detectedLanguage: preferredLanguage || "en",
      });
    }
  } catch (error: any) {
    console.error("Error in /api/chat:", error);
    res.status(500).json({ error: error.message || "Something went wrong in chat service" });
  }
});

/**
 * Helper to dynamically map various language strings/letters (such as 'en', 'hi', 'english', 'Tamil (தமிழ்)')
 * into the precise standard Indian code format that Sarvam expects (like 'en-IN', 'hi-IN').
 */
function mapToSarvamLanguageCode(lang: string | undefined): string {
  if (!lang) return "en-IN";
  const cleaned = lang.trim().toLowerCase();
  
  if (cleaned.startsWith("en") || cleaned.includes("english")) return "en-IN";
  if (cleaned.startsWith("hi") || cleaned.includes("hindi")) return "hi-IN";
  if (cleaned.startsWith("ta") || cleaned.includes("tamil")) return "ta-IN";
  if (cleaned.startsWith("te") || cleaned.includes("telugu")) return "te-IN";
  if (cleaned.startsWith("bn") || cleaned.includes("bengali")) return "bn-IN";
  if (cleaned.startsWith("gu") || cleaned.includes("gujarati")) return "gu-IN";
  if (cleaned.startsWith("kn") || cleaned.includes("kannada")) return "kn-IN";
  if (cleaned.startsWith("ml") || cleaned.includes("malayalam")) return "ml-IN";
  if (cleaned.startsWith("mr") || cleaned.includes("marathi")) return "mr-IN";
  if (cleaned.startsWith("pa") || cleaned.includes("punjabi")) return "pa-IN";
  
  return "en-IN"; // Default fallback
}

/**
 * Endpoint: /api/stt
 * Translates speech recordings to text using Sarvam AI STT (Saaras).
 */
app.post("/api/stt", upload.single("file"), async (req, res) => {
  try {
    const sarvamKey = process.env.SARVAM_API_KEY;
    if (!sarvamKey) {
      return res.status(400).json({
        error: "Missing API Key",
        message: "SARVAM_API_KEY is not configured inside server configurations.",
      });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Missing audio file in form data." });
    }

    const languageCode = mapToSarvamLanguageCode(req.body.language_code);

    // Build FormData in memory to send to Sarvam
    const sarvamForm = new FormData();
    const audioBlob = new Blob([req.file.buffer], { type: req.file.mimetype });
    
    sarvamForm.append("file", audioBlob, "audio.webm");
    sarvamForm.append("model", "saaras:v3");
    sarvamForm.append("mode", "transcribe");
    sarvamForm.append("language_code", languageCode);

    console.log(`Sending audio buffer to Sarvam STT containing ${req.file.size} bytes for language: ${languageCode}`);

    const sarvamResponse = await fetch("https://api.sarvam.ai/speech-to-text", {
      method: "POST",
      headers: {
        "api-subscription-key": sarvamKey,
      },
      body: sarvamForm,
    });

    if (!sarvamResponse.ok) {
      const errText = await sarvamResponse.text();
      console.error(`Sarvam STT failed with status ${sarvamResponse.status}:`, errText);
      throw new Error(`Sarvam STT returned ${sarvamResponse.status}: ${errText}`);
    }

    const data = await sarvamResponse.json();
    return res.json({
      transcript: data.transcript || "",
      language_code: data.language_code || languageCode,
    });
  } catch (error: any) {
    console.error("Error in /api/stt proxy:", error);
    res.status(500).json({ error: error.message || "Failed in voice recognition transcription." });
  }
});

/**
 * Endpoint: /api/tts
 * Synthesizes text to voice using Sarvam AI Bulbul TTS.
 */
app.post("/api/tts", async (req, res) => {
  try {
    const sarvamKey = process.env.SARVAM_API_KEY;
    if (!sarvamKey) {
      return res.status(400).json({
        error: "Missing API Key",
        message: "SARVAM_API_KEY is not configured.",
      });
    }

    const { text, languageCode, speaker, model } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Missing transcript text." });
    }

    // Clean up text if too long
    const cleanText = text.length > 500 ? text.substring(0, 500) : text;
    const cleanLanguageCode = mapToSarvamLanguageCode(languageCode);

    const selectedModel = model || "bulbul:v2";
    console.log(`Converting text to speech via Sarvam: "${cleanText}" style speaker: ${speaker || "anushka"} (mapped language: ${cleanLanguageCode}) using model: ${selectedModel}`);

    const sarvamResponse = await fetch("https://api.sarvam.ai/text-to-speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-subscription-key": sarvamKey,
      },
      body: JSON.stringify({
        inputs: [cleanText],
        target_language_code: cleanLanguageCode,
        speaker: speaker || "anushka",
        pace: 1.0,
        speech_format: "mp3",
        model: selectedModel,
      }),
    });

    if (!sarvamResponse.ok) {
      const errText = await sarvamResponse.text();
      console.error(`Sarvam TTS failed with status ${sarvamResponse.status}:`, errText);
      throw new Error(`Sarvam TTS returned ${sarvamResponse.status}: ${errText}`);
    }

    const data = await sarvamResponse.json();
    if (data && data.audios && data.audios.length > 0) {
      return res.json({
        audioBase64: data.audios[0],
      });
    } else {
      throw new Error("No audios returned inside Sarvam payload.");
    }
  } catch (error: any) {
    console.error("Error in /api/tts proxy:", error);
    res.status(500).json({ error: error.message || "Failed to vocalize response text." });
  }
});

// Vite Middleware for Dev, Asset server for production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Application dev-server started on http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
