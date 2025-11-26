"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { MessageBubble } from "@/components/chat/message-bubble"
import { useStreamingChat } from "@/hooks/use-streaming-chat"
import { generateMessageId } from "@/lib/chat-utils"
import type { Message } from "@/lib/chat-utils"

export default function TestStreamingPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [currentStatus, setCurrentStatus] = useState("")
  
  const { sendMessage, abortStream, isStreaming } = useStreamingChat()

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return

    // Add user message
    const userMessage: Message = {
      id: generateMessageId(),
      role: "user",
      content: input,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMessage])
    setInput("")

    // Create assistant message
    const assistantId = generateMessageId()
    const assistantMessage: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isStreaming: true,
    }
    setMessages(prev => [...prev, assistantMessage])

    // Send streaming request
    await sendMessage(
      input,
      messages.map(msg => ({ role: msg.role, content: msg.content })),
      {
        onChunk: (delta: string) => {
          console.log("[Test] Chunk:", delta)
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantId
                ? { ...msg, content: msg.content + delta }
                : msg
            )
          )
        },
        
        onComplete: (fullResponse: string) => {
          console.log("[Test] Complete:", { fullResponse })
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantId
                ? { ...msg, content: fullResponse, isStreaming: false }
                : msg
            )
          )
          setCurrentStatus("")
        },
        
        onError: (error: Error) => {
          console.error("[Test] Error:", error)
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantId
                ? { 
                    ...msg, 
                    content: `Error: ${error.message}`, 
                    isStreaming: false 
                  }
                : msg
            )
          )
          setCurrentStatus("")
        },
      },
      null, // No conversation ID for test
      [] // No file IDs for test
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-4">Streaming Test Page</h1>
      
      <Card className="p-4 mb-4">
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Test the streaming functionality. Backend must be running with /api/pelican_stream endpoint.
          </div>
          
          {currentStatus && (
            <div className="p-3 bg-muted rounded text-sm">
              Status: {currentStatus}
            </div>
          )}
          
          <div className="space-y-4">
            {messages.map(message => (
              <MessageBubble
                key={message.id}
                message={message}
                isStreaming={message.isStreaming}
              />
            ))}
          </div>
          
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              disabled={isStreaming}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
            />
            {isStreaming ? (
              <Button onClick={abortStream} variant="destructive">
                Cancel
              </Button>
            ) : (
              <Button onClick={handleSend} disabled={!input.trim()}>
                Send
              </Button>
            )}
          </div>
        </div>
      </Card>
      
      <div className="text-sm text-muted-foreground">
        <p>Feature Flag Status: Streaming is currently DISABLED in production.</p>
        <p>This test page directly uses the streaming hook for testing purposes.</p>
      </div>
    </div>
  )
}
