/**
 * Mumbai Hair Salon - AI Chatbot Backend Proxy Server
 * Uses Node.js + Express to securely call the Gemini API.
 * The API key is stored in a .env file and NEVER sent to the browser.
 *
 * HOW TO RUN:
 *   1. cd into this folder: cd chatbot
 *   2. npm install
 *   3. Create a .env file with: GEMINI_API_KEY=your_key_here
 *   4. node server.js  (or: npm start)
 *   Server will run on http://localhost:3001
 */

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// -- Middleware ----------------------------------------------------
app.use(express.json());

// Allow requests ONLY from your website origin.
// Change the origin below to your actual domain when you go live.
app.use(
  cors({
    origin: [
      "http://localhost",
      "http://127.0.0.1",
      "http://localhost:5500",       // VS Code Live Server default
      "http://127.0.0.1:5500",
    ],
  })
);

// -- System Prompt (defines chatbot personality) -------------------
const SYSTEM_PROMPT = `You are "Mumbai Hair Salon Concierge", a warm and professional AI assistant for Mumbai Hair Salon � Mumbai's premier luxury hair salon.

Your personality:
- Warm, friendly, and professional
- Use refined language befitting a premium Mumbai salon brand
- Keep responses concise yet helpful (2�4 sentences max per point)
- Always steer relevant conversations toward booking a session or exploring services

You can help clients with:
1. Information about Mumbai Hair Salon's services: Expert Hair Styling, Hair Spa, Bridal Makeup
2. Pricing packages: Luminous Base (?199+), Modern Signature (?349+), Radiant Royale (?599+)
3. Booking guidance � encourage them to use the booking form on the website
4. General hair care tips and beauty advice aligned with Mumbai Hair Salon's premium philosophy
5. Bridal and special occasion package inquiries

Mumbai Hair Salon contact / booking: Clients should fill the booking form on the website or WhatsApp at +91 89498 53554. Located in Mumbai.

If asked something completely unrelated to beauty, politely redirect: "As the Mumbai Hair Salon Concierge, I'm best suited to assist you with hair, beauty, and our Mumbai salon services."

Never fabricate specific staff names, specific addresses, or real phone numbers not provided.`;

// -- Chat Endpoint -------------------------------------------------
app.post("/api/chat", async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Invalid request: messages array required." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Server configuration error: API key not set." });
  }

  // Build Gemini API request body
  // Convert the conversation history into Gemini's expected format
  const contents = messages.map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }],
  }));

  const geminiBody = {
    system_instruction: {
      parts: [{ text: SYSTEM_PROMPT }],
    },
    contents,
    generationConfig: {
      maxOutputTokens: 512,
      temperature: 0.7,
      topP: 0.9,
    },
  };

  try {
    // Use the native fetch (available in Node.js 18+)
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(geminiBody),
      }
    );

    if (!geminiResponse.ok) {
      const errData = await geminiResponse.json();
      console.error("Gemini API error:", errData);
      return res.status(502).json({ error: "AI service error. Please try again." });
    }

    const data = await geminiResponse.json();
    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "I apologize, I could not generate a response. Please try again.";

    return res.json({ reply });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "Internal server error. Please try again later." });
  }
});

// -- Health check --------------------------------------------------
app.get("/health", (_, res) => res.json({ status: "Mumbai Hair Salon Concierge API is running." }));

// -- Start ---------------------------------------------------------
app.listen(PORT, () => {
  console.log(`\n✨  Mumbai Hair Salon Chatbot Server running at http://localhost:${PORT}`);
  console.log(`   POST /api/chat  � Send chat messages`);
  console.log(`   GET  /health    � Health check\n`);
});
