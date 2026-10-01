# 🤖 Custom AI Customer Support (RAG Architecture)

An enterprise-grade, intelligent Customer Support Chatbot built with **Next.js**, **Google Gemini AI**, and **Pinecone Vector Database**. This project demonstrates the implementation of **Retrieval-Augmented Generation (RAG)** to create an AI assistant that answers user queries *strictly* based on custom, proprietary business data, eliminating AI hallucinations.

## 🌟 The Business Problem It Solves
Standard AI models answer questions based on general internet knowledge. However, businesses need AI to answer questions based on *their specific* refund policies, product catalogs, and internal documentation. This application solves that by embedding business data into a vector database, ensuring the AI only acts as a dedicated company representative.

## ✨ Key Features
- **RAG Architecture Integration:** Connects user queries to specific business context before generating responses.
- **Zero Hallucinations:** The AI is strictly instructed to say "I don't know" if the answer isn't in the provided company data.
- **Vector Embeddings:** Utilizes Gemini Embeddings to convert text chunks into high-dimensional vectors for semantic search.
- **Serverless Edge Computing:** Built on Next.js App Router for blazing-fast API routes and seamless deployment.
- **Modern UI/UX:** Clean, responsive, and professional chat interface built with Tailwind CSS.

## 🛠️ Tech Stack
- **Framework:** Next.js 14+ (App Router, React)
- **AI Engine:** Google Generative AI (Gemini 1.5 Flash & Text Embeddings)
- **Vector Database:** Pinecone
- **Styling:** Tailwind CSS, Lucide React Icons
- **Deployment:** Vercel

## ⚙️ How It Works (The Pipeline)
1. **Ingestion:** Proprietary business text is chunked and converted into vector embeddings using Google's embedding model.
2. **Storage:** These embeddings are stored securely in a Pinecone vector index.
3. **Retrieval:** When a user asks a question, the query is embedded, and Pinecone retrieves the most semantically similar text chunks.
4. **Generation:** The retrieved context + the user's prompt are sent to the Gemini model to generate a highly accurate, context-aware response.

---
*Built as a demonstration of advanced AI engineering and modern full-stack web development.*