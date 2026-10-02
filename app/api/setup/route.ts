import { GoogleGenerativeAI } from "@google/generative-ai";
import { Pinecone } from "@pinecone-database/pinecone";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
    const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY as string });
    
    const index = pc.index("support-index");

    const companyData = [
      "DocuMind customer support is available Monday through Friday, from 9 AM to 5 PM EST.",
      "Refund Policy: Users can request a 100% full refund within 14 days of purchasing a subscription if they are not completely satisfied.",
      "Pricing: The Pro subscription costs $29 per month, and the Enterprise plan is $99 per month. We currently do not offer any free tiers."
    ];

    // استفاده از مدل اصلی و پایدار گوگل
    const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const vectors: any[] = [];

    for (let i = 0; i < companyData.length; i++) {
      const text = companyData[i];
      
      // اگر اینجا خطایی رخ دهد، مستقیم روی صفحه چاپ می‌شود
      const response = await embeddingModel.embedContent(text);
      
      if (!response.embedding || !response.embedding.values) {
        throw new Error(`Gemini Error: هیچ عددی برای این متن تولید نشد! پاسخ جمینای: ${JSON.stringify(response)}`);
      }

      vectors.push({
        id: `chunk-${i}`,
        values: response.embedding.values,
        metadata: { text: text }
      });
    }

    if (vectors.length === 0) {
      throw new Error("آرایه بردارها خالی است! مشکلی در تولید Embeddings وجود دارد.");
    }

    // ارسال به پاین‌کن
    await index.upsert(vectors as any);

    return NextResponse.json({ 
      success: true, 
      message: "دیتا با موفقیت در دیتابیس ذخیره شد!",
      dimension_used: vectors[0].values.length
    });

  } catch (error: any) {
    // چاپ دقیق ارور برای ما
    console.error("Setup Error:", error);
    return NextResponse.json({ 
      error: error.message || "خطای ناشناخته رخ داد"
    }, { status: 500 });
  }
}