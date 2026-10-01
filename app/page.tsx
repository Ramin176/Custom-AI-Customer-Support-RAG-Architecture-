"use client";

import { useState } from "react";
import { Send, Bot, User, Loader2 } from "lucide-react";

export default function Home() {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hello! I am the DocuMind AI Assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await response.json();
      
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: data.response || "Sorry, there was an error processing your request." },
      ]);
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Connection error. Please try again later." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col h-[80vh]">
        
        {/* Header */}
        <div className="bg-blue-600 p-6 text-white text-center">
          <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
            <Bot size={28} />
            DocuMind AI Support
          </h1>
          <p className="text-blue-100 mt-2 text-sm">Strictly answering based on company policies (RAG Architecture)</p>
        </div>

        {/* Chat Box */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`flex gap-3 max-w-[80%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === "user" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}>
                  {msg.role === "user" ? <User size={18} /> : <Bot size={18} />}
                </div>
                <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === "user" ? "bg-blue-600 text-white rounded-tr-none" : "bg-white text-gray-800 border border-gray-100 rounded-tl-none"}`}>
                  {msg.text}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex gap-3 max-w-[80%]">
                <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center">
                  <Bot size={18} />
                </div>
                <div className="p-4 rounded-2xl bg-white border border-gray-100 rounded-tl-none flex items-center gap-2 text-gray-500">
                  <Loader2 size={16} className="animate-spin" /> Thinking...
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Form */}
        <div className="p-4 bg-white border-t border-gray-100">
          <form onSubmit={sendMessage} className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about refund policy, working hours, or pricing..."
              className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={18} />
              Send
            </button>
          </form>
        </div>

      </div>
    </div>
  );
} 