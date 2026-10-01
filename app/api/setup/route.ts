import { GoogleGenerativeAI } from '@google/generative-ai';
import { Pinecone } from '@pinecone-database/pinecone';
import { NextResponse } from 'next/server';

// استفاده از پکیج پایدار و اصلی گوگل
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY as string });

export async function GET() {
  try {
    const index = pc.index('support-index');

    const companyData = [
      "DocuMind customer support is available Monday through Friday, from 9 AM to 5 PM EST.",
      "Refund Policy: Users can request a 100% full refund within 14 days of purchasing a subscription if they are not completely satisfied.",
      "Pricing: The Pro subscription costs $29 per month, and the Enterprise plan is $99 per month. We currently do not offer any free tiers."
    ];

    const vectors: any[] = [];
    
    // فراخوانی مدل پایدار text-embedding-004
const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
    for (let i = 0; i < companyData.length; i++) {
      const text = companyData[i];
      
      // تبدیل متن به بردار (اعداد)
      const response = await embeddingModel.embedContent(text);
      const embeddingValues = response.embedding.values;

      if (embeddingValues) {
        vectors.push({
          id: `chunk-${i}`,
          values: embeddingValues,
          metadata: { text: text } 
        });
      }
    }

    await index.upsert(vectors as any);

    return NextResponse.json({ 
      success: true, 
      message: "Data successfully embedded and stored in Pinecone!" 
    });

  } catch (error: any) {
    console.error("Setup Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}