import { GoogleGenerativeAI } from '@google/generative-ai';
import { Pinecone } from '@pinecone-database/pinecone';
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY as string });

export async function POST(req: Request) {
  try {
    // گرفتن پیام کاربر از فرانت‌اند
    const { message } = await req.json();

    // مرحله ۱: تبدیل سوال کاربر به کدهای ریاضی (Embeddings)
    const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
    const embedResponse = await embeddingModel.embedContent(message);
    const queryEmbedding = embedResponse.embedding.values;

    // مرحله ۲: جستجو در Pinecone برای پیدا کردن مرتبط‌ترین قوانین شرکت
    const index = pc.index('support-index');
    const searchResults = await index.query({
      vector: queryEmbedding as any,
      topK: 2, // دو تا از نزدیک‌ترین قوانین به سوال کاربر را پیدا کن
      includeMetadata: true,
    });

    // استخراج متن قوانینی که از دیتابیس پیدا شده
    const contextData = searchResults.matches
      .map((match) => match.metadata?.text)
      .join('\n');

    // مرحله ۳: ساخت پرامپت حرفه‌ای و ترکیب قوانین شرکت با سوال کاربر
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

    // ارسال درخواست نهایی به جمینای و دریافت جواب
    const result = await chatModel.generateContent(prompt);
    const aiResponse = result.response.text();

    return NextResponse.json({ response: aiResponse });

  } catch (error: any) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}