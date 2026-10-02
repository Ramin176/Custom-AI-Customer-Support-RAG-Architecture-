import { GoogleGenerativeAI } from "@google/generative-ai";
import { Pinecone } from "@pinecone-database/pinecone";
import { NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const PINECONE_API_KEY = process.env.PINECONE_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not configured.");
}

if (!PINECONE_API_KEY) {
  throw new Error("PINECONE_API_KEY is not configured.");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const pc = new Pinecone({
  apiKey: PINECONE_API_KEY,
});

export async function POST(req: Request) {
  const requestId = Math.random().toString(36).substring(2, 10);

  console.log("========================================");
  console.log(`[CHAT ${requestId}] New request`);
  console.log("========================================");

  try {
    // --------------------------------------------------
    // 1. Get user message
    // --------------------------------------------------

    const body = await req.json();
    const message = body?.message;

    console.log(`[CHAT ${requestId}] User message:`, message);

    if (!message || typeof message !== "string") {
      console.error(`[CHAT ${requestId}] Invalid message`);

      return NextResponse.json(
        {
          error: "Message is required.",
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------------------------
    // 2. Create query embedding
    // --------------------------------------------------

    console.log(
      `[CHAT ${requestId}] Creating embedding with gemini-embedding-001...`
    );

    const embeddingModel = genAI.getGenerativeModel({
      model: "gemini-embedding-001",
    });

    const embedResponse = await embeddingModel.embedContent(message);

    const queryEmbedding = embedResponse.embedding.values;

    console.log(
      `[CHAT ${requestId}] Embedding created successfully`
    );

    console.log(
      `[CHAT ${requestId}] Embedding dimension:`,
      queryEmbedding.length
    );

    if (!queryEmbedding || queryEmbedding.length === 0) {
      throw new Error("Embedding returned an empty vector.");
    }

    // --------------------------------------------------
    // 3. Connect to Pinecone
    // --------------------------------------------------

    console.log(
      `[CHAT ${requestId}] Connecting to Pinecone index: support-index`
    );

    const index = pc.index("support-index");

    // --------------------------------------------------
    // 4. Query Pinecone
    // --------------------------------------------------

    console.log(
      `[CHAT ${requestId}] Searching Pinecone...`
    );

    const searchResults = await index.query({
      vector: queryEmbedding,
      topK: 3,
      includeMetadata: true,
    });

    console.log(
      `[CHAT ${requestId}] Pinecone query completed`
    );

    console.log(
      `[CHAT ${requestId}] Number of matches:`,
      searchResults.matches?.length ?? 0
    );

    // Log every match separately
    searchResults.matches?.forEach((match, index) => {
      console.log(
        `[CHAT ${requestId}] Match #${index + 1}:`,
        {
          id: match.id,
          score: match.score,
          metadata: match.metadata,
        }
      );
    });

    // --------------------------------------------------
    // 5. Check if Pinecone found anything
    // --------------------------------------------------

    if (
      !searchResults.matches ||
      searchResults.matches.length === 0
    ) {
      console.warn(
        `[CHAT ${requestId}] Pinecone returned ZERO matches`
      );

      return NextResponse.json({
        response:
          "I'm sorry, I don't have information about that in my current database.",
      });
    }

    // --------------------------------------------------
    // 6. Extract metadata
    // --------------------------------------------------

    const contextParts = searchResults.matches
      .map((match) => {
        const text = match.metadata?.text;

        console.log(
          `[CHAT ${requestId}] Extracted metadata text:`,
          text
        );

        return typeof text === "string" ? text : null;
      })
      .filter((text): text is string => Boolean(text));

    const contextData = contextParts.join("\n\n");

    console.log(
      `[CHAT ${requestId}] Final context:`
    );

    console.log(contextData);

    // --------------------------------------------------
    // 7. Check context
    // --------------------------------------------------

    if (!contextData.trim()) {
      console.warn(
        `[CHAT ${requestId}] Pinecone matches exist, but metadata.text is empty`
      );

      return NextResponse.json({
        response:
          "I'm sorry, I don't have information about that in my current database.",
      });
    }

    // --------------------------------------------------
    // 8. Build RAG prompt
    // --------------------------------------------------

    const prompt = `
You are a polite and professional customer support AI for a company named "DocuMind".

Your job is to answer the user's question using ONLY the company information provided below.

IMPORTANT RULES:

1. Use only the provided Company Data.
2. Do not use outside knowledge.
3. Do not invent or assume information.
4. If the answer is available in the Company Data, answer it directly and clearly.
5. If the answer is NOT available in the Company Data, say exactly:
"I'm sorry, I don't have information about that in my current database."

Company Data:
----------------
${contextData}
----------------

User Question:
${message}

Answer:
`;

    console.log(
      `[CHAT ${requestId}] Prompt created`
    );

    // --------------------------------------------------
    // 9. Generate final answer with Gemini
    // --------------------------------------------------

    console.log(
      `[CHAT ${requestId}] Calling Gemini 2.5 Flash...`
    );

    const chatModel = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const result = await chatModel.generateContent(prompt);

    const aiResponse = result.response.text();

    console.log(
      `[CHAT ${requestId}] Gemini response:`,
      aiResponse
    );

    // --------------------------------------------------
    // 10. Return response
    // --------------------------------------------------

    console.log(
      `[CHAT ${requestId}] Request completed successfully`
    );

    console.log("========================================");

    return NextResponse.json({
      response: aiResponse,
    });
  } catch (error: any) {
    console.error("========================================");
    console.error(`[CHAT ${requestId}] ERROR`);
    console.error("========================================");

    console.error("Error message:", error?.message);
    console.error("Error status:", error?.status);
    console.error("Error statusText:", error?.statusText);
    console.error("Full error:", error);

    return NextResponse.json(
      {
        error:
          error?.message ||
          "An unexpected error occurred.",
      },
      {
        status: 500,
      }
    );
  }
}