import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // API routes FIRST
  app.post("/api/ai/organize", async (req, res) => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const { files } = req.body;
      
      const prompt = `I have the following list of files. Suggest a better folder organization for them. Group them logically by type, project, or date if applicable. Respond in markdown with a suggested tree structure and a brief explanation.
      
Files:
${files.slice(0, 500).map((f: any) => `- ${f.relative_path} (${f.size_bytes} bytes)`).join('\n')}`;

      let response;
      let retries = 3;
      let delay = 1000;

      while (retries > 0) {
        try {
          response = await ai.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: prompt
          });
          break;
        } catch (error: any) {
          if (error?.status === 503 || error?.message?.includes('503') || error?.status === 'UNAVAILABLE') {
            retries--;
            if (retries === 0) throw error;
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2;
          } else {
            throw error;
          }
        }
      }

      res.json({ suggestion: response?.text });
    } catch (error: any) {
      console.error(error);
      if (error?.status === 429 || error?.message?.includes('429')) {
        res.status(429).json({ error: "AI API quota exceeded or rate limited. Please check your billing cap or try again later." });
      } else if (error?.status === 503 || error?.message?.includes('503') || error?.status === 'UNAVAILABLE') {
        res.status(503).json({ error: "The AI model is currently experiencing high demand. Please try again in a few moments." });
      } else {
        res.status(500).json({ error: error?.message || "Failed to generate AI suggestion." });
      }
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
