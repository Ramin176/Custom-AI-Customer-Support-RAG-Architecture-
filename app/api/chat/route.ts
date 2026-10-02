import { GoogleGenerativeAI } from '@google/generative-ai';
import { Pinecone } from '@pinecone-database/pinecone';
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY as string });

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    // مدل تبدیل سوال کاربر به عدد (باید دقیقاً gemini-embedding-001 باشد)
    const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
    const embedResponse = await embeddingModel.embedContent(message);
    const queryEmbedding = embedResponse.embedding.values;

    const index = pc.index('support-index');
    const searchResults = await index.query({
      vector: queryEmbedding as any,
      topK: 2,
      includeMetadata: true,
    });

    const contextData = searchResults.matches
      .map((match) => match.metadata?.text)
      .join('\n');

    // مدل اصلی چت (نسخه 1.5)
    const chatModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `
      You are a polite and professional customer support AI for a company named "DocuMind".
      Your ONLY job is to answer the user's question based strictly on the "Company Data" provided below.
      If the user's question cannot be answered using the "Company Data", you must apologize and say "I'm sorry, I don't have information about that in my current database." 
      DO NOT invent answers or use outside knowledge.

      Company Data:
      ${contextData}

      User Question:
      ${message}
    `;

    const result = await chatModel.generateContent(prompt);
    const aiResponse = result.response.text();

    return NextResponse.json({ response: aiResponse });

  } catch (error: any) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}