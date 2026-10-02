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

export async function GET() {
  const setupId = Math.random().toString(36).substring(2, 10);

  console.log("========================================");
  console.log(`[SETUP ${setupId}] Starting setup`);
  console.log("========================================");

  try {
    // --------------------------------------------------
    // 1. Connect to Pinecone
    // --------------------------------------------------

    console.log(
      `[SETUP ${setupId}] Connecting to Pinecone...`
    );

    const index = pc.index("support-index");

    // --------------------------------------------------
    // 2. Company knowledge base
    // --------------------------------------------------

    const companyData = [
      "DocuMind customer support is available Monday through Friday, from 9 AM to 5 PM EST.",

      "Refund Policy: Users can request a 100% full refund within 14 days of purchasing a subscription if they are not completely satisfied.",

      "Pricing: The Pro subscription costs $29 per month, and the Enterprise plan is $99 per month. We currently do not offer any free tiers.",
    ];

    console.log(
      `[SETUP ${setupId}] Company documents:`,
      companyData.length
    );

    // --------------------------------------------------
    // 3. Create embedding model
    // --------------------------------------------------

    console.log(
      `[SETUP ${setupId}] Loading gemini-embedding-001...`
    );

    const embeddingModel = genAI.getGenerativeModel({
      model: "gemini-embedding-001",
    });

    // --------------------------------------------------
    // 4. Create vectors
    // --------------------------------------------------

    const vectors = [];

    for (let i = 0; i < companyData.length; i++) {
      const text = companyData[i];

      console.log(
        `[SETUP ${setupId}] Creating embedding for document ${i}...`
      );

      console.log(
        `[SETUP ${setupId}] Document:`,
        text
      );

      const response = await embeddingModel.embedContent(text);

      const embeddingValues = response.embedding.values;

      console.log(
        `[SETUP ${setupId}] Document ${i} embedding dimension:`,
        embeddingValues.length
      );

      if (
        !embeddingValues ||
        embeddingValues.length === 0
      ) {
        throw new Error(
          `Empty embedding returned for document ${i}`
        );
      }

      const vector = {
        id: `chunk-${i}`,
        values: embeddingValues,
        metadata: {
          text: text,
        },
      };

      console.log(
        `[SETUP ${setupId}] Vector ${i}:`,
        {
          id: vector.id,
          dimension: vector.values.length,
          metadata: vector.metadata,
        }
      );

      vectors.push(vector);
    }

    // --------------------------------------------------
    // 5. Check vector dimensions
    // --------------------------------------------------

    const dimensions = vectors.map(
      (vector) => vector.values.length
    );

    console.log(
      `[SETUP ${setupId}] Vector dimensions:`,
      dimensions
    );

    const firstDimension = dimensions[0];

    const allSameDimension = dimensions.every(
      (dimension) => dimension === firstDimension
    );

    if (!allSameDimension) {
      throw new Error(
        `Embedding dimensions are inconsistent: ${dimensions.join(", ")}`
      );
    }

    // --------------------------------------------------
    // 6. Upsert into Pinecone
    // --------------------------------------------------

    console.log(
      `[SETUP ${setupId}] Upserting vectors into Pinecone...`
    );

  await index.upsert(vectors as any);

    console.log(
      `[SETUP ${setupId}] Pinecone upsert completed successfully`
    );

    // --------------------------------------------------
    // 7. Verify by fetching vectors
    // --------------------------------------------------

    console.log(
      `[SETUP ${setupId}] Verifying stored vectors...`
    );

  const fetchedVectors = await index.fetch({
      ids: [
        "chunk-0",
        "chunk-1",
        "chunk-2",
      ]
    } as any);

    console.log(
      `[SETUP ${setupId}] Stored vector IDs:`,
      Object.keys(fetchedVectors.records || {})
    );

    console.log(
      `[SETUP ${setupId}] Stored records:`,
      fetchedVectors.records
    );

    // --------------------------------------------------
    // 8. Final response
    // --------------------------------------------------

    console.log(
      `[SETUP ${setupId}] Setup completed successfully`
    );

    console.log("========================================");

    return NextResponse.json({
      success: true,

      message:
        "Data successfully embedded and stored in Pinecone.",

      documents: companyData.length,

      embeddingModel:
        "gemini-embedding-001",

      embeddingDimension:
        firstDimension,

      vectorIds: [
        "chunk-0",
        "chunk-1",
        "chunk-2",
      ],
    });
  } catch (error: any) {
    console.error("========================================");
    console.error(`[SETUP ${setupId}] ERROR`);
    console.error("========================================");

    console.error("Error message:", error?.message);
    console.error("Error status:", error?.status);
    console.error("Error statusText:", error?.statusText);
    console.error("Full error:", error);

    return NextResponse.json(
      {
        error:
          error?.message ||
          "An unexpected setup error occurred.",
      },
      {
        status: 500,
      }
    );
  }
}