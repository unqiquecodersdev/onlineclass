import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

// Ensure the dev server binds to host 0.0.0.0 and port 3000
const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

/**
 * API: Generate Interactive Quizzes
 */
app.post("/api/generate-quizzes", async (req, res) => {
  try {
    const { title, description, discussionMaterial, forRecorded, salt } = req.body;

    const systemInstruction = `You are an AI teacher's assistant specialized in creating high-quality, educational evaluation quizzes. Your output must be a clean, valid JSON array containing standard multiple-choice questions with 4 logical options.`;

    const prompt = `Create a list of 5 interactive, multiple-choice evaluation questions based on the following:
Class Title: ${title || "Introductory Class"}
Class Description: ${description || "General online academic class session."}
Discussion/Outline Document: ${discussionMaterial || "No specific attachment. Generate general academic topics based on the title."}
${forRecorded ? "These are for MISSED students reviewing the recorded session: generate completely alternative, fresh, unique questions so they are tested differently than students in the live call." : "These are for the active live class call."}
${salt ? `Randomization Seed: ${salt}. Use this unique seed as an instruction to create completely unique, freshly conceived, and custom randomized questions that vary significantly from previous sessions or live queries. Challenge students with interesting, diverse angles on this topics!` : ""}

Generate exactly 5 questions. Make sure questions are highly educational, clear, and relevant. Each question must have an array of exactly 4 plausible options, and a valid zero-index correctAnswerIndex pointing to the right option.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          description: "List of multiple-choice questions.",
          items: {
            type: Type.OBJECT,
            required: ["question", "options", "correctAnswerIndex", "category"],
            properties: {
              question: {
                type: Type.STRING,
                description: "The educational quiz question.",
              },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Array of exactly 4 options.",
              },
              correctAnswerIndex: {
                type: Type.INTEGER,
                description: "The standard 0-indexed position of the correct answer.",
              },
              category: {
                type: Type.STRING,
                description: "Quick educational topic or sub-focus.",
              },
            },
          },
        },
      },
    });

    const jsonText = response.text || "[]";
    const parsedQuizzes = JSON.parse(jsonText.trim());
    return res.json({ success: true, quizzes: parsedQuizzes });
  } catch (error: any) {
    console.error("Error generating interactive quizzes:", error);
    // Fallback quizzes to guarantee continuous application operations
    const fallbacks = [
      {
        question: "What is the primary role of critical discussion in an online class?",
        options: [
          "To complete a attendance checklist",
          "To promote structured active learning and recall",
          "To replace individual textbook study entirely",
          "To minimize teacher-student interaction"
        ],
        correctAnswerIndex: 1,
        category: "Learning Methodology"
      },
      {
        question: "How can students maximize attention during virtual meetings?",
        options: [
          "By muting everything and multi-tasking",
          "By engaging in scheduled check-ins and live quizzes",
          "By skipping the live lecture to watch replay on triple-speed",
          "By turning off all screen interactive features"
        ],
        correctAnswerIndex: 1,
        category: "Academic Retention"
      },
      {
        question: "What does an active attendance score of 100% indicate?",
        options: [
          "That the user logged in and closed their browser browser tab immediately",
          "That the student responded positively to all randomized attention prompts and live evaluation checkpoints",
          "That the student had the strongest internet connection speeds",
          "That the teacher marked the entire group as perfect by default"
        ],
        correctAnswerIndex: 1,
        category: "Session Diagnostics"
      }
    ];
    return res.json({ success: false, quizzes: fallbacks, error: error.message });
  }
});

/**
 * API: Generate Live Discussion Quizzes
 */
app.post("/api/generate-live-discussion-quiz", async (req, res) => {
  try {
    const { title, chatMessages, existingDiscussion } = req.body;

    const chatText = (chatMessages || []).map((m: any) => `${m.senderName} (${m.senderRole}): ${m.message}`).join("\n");

    const systemInstruction = `You are an AI teacher's assistant specialized in creating high-quality, real-time evaluation class quizzes based on live chat transcripts and discussion topics. Your output must be a clean, valid JSON object containing exactly 1 standard multiple-choice question with 4 options, indicating correct index.`;

    const prompt = `Based on the active live class titled: "${title || "Interactive Session"}" and this live chat and discussion transcript:
----------------
${chatText || "Teacher: Today we are studying biological cells and how organelles such as mitochondria and chloroplasts cooperate."}
${existingDiscussion ? `Discussion Material: ${existingDiscussion}` : ""}
----------------

Generate exactly 1 high-quality, relevant multiple-choice question that tests student presence and understanding of what was just discussed during the feed above.
The question must have:
- question: a string with the test question
- options: an array of 4 distinct choices (try to base options around the discussed text or biology/lecture context if present)
- correctAnswerIndex: standard 0-indexed correct option (0, 1, 2, or 3)
- category: e.g., "Active Recall" or "Live Concept Check"`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["question", "options", "correctAnswerIndex", "category"],
          properties: {
            question: { type: Type.STRING },
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Array of exactly 4 options.",
            },
            correctAnswerIndex: { type: Type.INTEGER },
            category: { type: Type.STRING },
          },
        },
      },
    });

    const parsedQuiz = JSON.parse(response.text.trim());
    return res.json({ success: true, quiz: parsedQuiz });
  } catch (error: any) {
    console.error("Error generating live discussion quiz:", error);
    // Return a random generated question
    const defaultQuiz = {
      question: `Which activity best demonstrates academic integrity in virtual class meetings?`,
      options: [
        "Keeping multiple background windows active while muted",
        "Engaging with live AI checkpoints and answering interactive quizzes honestly",
        "Sharing meeting credentials with non-registered users",
        "Bypassing camera verifications"
      ],
      correctAnswerIndex: 1,
      category: "Academic Integrity"
    };
    return res.json({ success: false, quiz: defaultQuiz, error: error.message });
  }
});

/**
 * API: Class Summary Generator
 */
app.post("/api/generate-summary", async (req, res) => {
  try {
    const { title, description, discussionMaterial, studentStats } = req.body;

    const statsStr = JSON.stringify(studentStats || []);

    const prompt = `You are a professional educational analytics AI. Synthesize an elegant Class Performance and Engagement Summary based on the session details below.
Class Title: ${title}
Class Details: ${description || "N/A"}
Discussion Material: ${discussionMaterial || "N/A"}
Student Participation Stats:
${statsStr}

Please generate an interactive, beautifully worded overview of:
1. Core Topics covered during this interactive class.
2. Summary level analysis of student participation (average quiz scores, response rate to availability clicks).
3. Pedagogical recommendations for both the high-performers and students needing additional review.

Produce your response in clean Markdown formatting. Keep it inspiring, highly structured, and objective.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return res.json({ success: true, summary: response.text });
  } catch (error: any) {
    console.error("Error generating class summary:", error);
    return res.json({
      success: false,
      summary: `### Class Summary Overview\n\nAI analysis could not compile fully due to key availability. Here is the class diagnostic run:\n\n- **Session:** Current Academic Live Room\n- **Class Details:** Material review completed.\n- **Engagement Metric:** Student participants completed required interactive benchmarks.\n- **Pedagogical Recommendation:** Review interactive class materials and complete independent quiz review.`,
      error: error.message
    });
  }
});

// Bootstrap async start block to handle Vite middleware safely without top-level await in CommonJS
async function startServer() {
  // Configure Vite middleware in development mode to bundle assets instantly
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

  // Start Server on PORT 3000
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`EduClass Meet full-stack server running securely on http://localhost:${PORT}`);
  });
}

startServer();
