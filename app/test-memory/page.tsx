import { ConversationMemoryTest } from "@/components/test/conversation-memory-test"

export default function TestMemoryPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Conversation Memory System Test</h1>
          <p className="text-gray-600">Verify that the conversation memory and context system is working correctly</p>
        </div>

        <ConversationMemoryTest />

        <div className="mt-8 text-center">
          <a href="/chat" className="text-purple-600 hover:text-purple-700 underline">
            ← Back to Chat
          </a>
        </div>
      </div>
    </div>
  )
}
