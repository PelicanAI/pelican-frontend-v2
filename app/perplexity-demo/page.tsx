"use client"

import { PerplexityChatInput } from "@/components/chat/perplexity-chat-input"
import { useState } from "react"

export default function PerplexityDemoPage() {
  const [inputValue, setInputValue] = useState("")
  const [messages, setMessages] = useState<string[]>([])

  const handleSubmit = (value: string) => {
    setMessages((prev) => [...prev, value])
    console.log("Submitted:", value)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">Perplexity-Style Chat Input</h1>
          <p className="text-gray-600">Clean, modern chat interface with suggestion pills</p>
        </div>

        {/* Messages Display */}
        {messages.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Recent Messages:</h3>
            <div className="space-y-2">
              {messages.map((message, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg text-gray-700">
                  {message}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chat Input */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4">
          <PerplexityChatInput value={inputValue} onChange={setInputValue} onSubmit={handleSubmit} />
        </div>

        {/* Demo States */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 space-y-6">
          <h3 className="font-semibold text-gray-900">Demo States:</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Normal State</label>
              <PerplexityChatInput placeholder="Ask anything..." />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Disabled State</label>
              <PerplexityChatInput placeholder="Disabled input..." disabled />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
