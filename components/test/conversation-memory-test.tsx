"use client"

import { useState } from "react"
import { useConversations } from "@/hooks/use-conversations"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Clock } from "lucide-react"

interface TestResult {
  name: string
  status: "pending" | "success" | "error"
  message: string
}

export function ConversationMemoryTest() {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const { conversations, create, remove, user } = useConversations()
  const supabase = createClient()

  const updateTestResult = (name: string, status: "success" | "error", message: string) => {
    setTestResults((prev) => prev.map((test) => (test.name === name ? { ...test, status, message } : test)))
  }

  const runTests = async () => {
    setIsRunning(true)

    // Initialize test results
    const tests = [
      { name: "Database Schema", status: "pending" as const, message: "Checking database tables..." },
      { name: "User Authentication", status: "pending" as const, message: "Verifying user session..." },
      { name: "Create Conversation", status: "pending" as const, message: "Creating test conversation..." },
      { name: "Message Storage", status: "pending" as const, message: "Testing message persistence..." },
      { name: "Conversation Context", status: "pending" as const, message: "Verifying context retrieval..." },
      { name: "Real-time Updates", status: "pending" as const, message: "Testing live updates..." },
    ]
    setTestResults(tests)

    try {
      // Test 1: Database Schema
      const { data: conversationsTable } = await supabase.from("conversations").select("id").limit(1)

      const { data: messagesTable } = await supabase.from("messages").select("id").limit(1)

      if (conversationsTable !== null && messagesTable !== null) {
        updateTestResult("Database Schema", "success", "Tables exist and are accessible")
      } else {
        updateTestResult("Database Schema", "error", "Database tables not found")
        return
      }

      // Test 2: User Authentication
      if (user) {
        updateTestResult("User Authentication", "success", `Authenticated as ${user.email}`)
      } else {
        updateTestResult("User Authentication", "error", "No authenticated user found")
        return
      }

      // Test 3: Create Conversation
      const testConversation = await create("Test Conversation - Memory Check")
      if (testConversation) {
        updateTestResult("Create Conversation", "success", `Created conversation: ${testConversation.id}`)

        // Test 4: Message Storage
        const { error: messageError } = await supabase.from("messages").insert([
          {
            conversation_id: testConversation.id,
            role: "user",
            content: "Test message 1: What is NVDA?",
          },
          {
            conversation_id: testConversation.id,
            role: "assistant",
            content: "NVDA is NVIDIA Corporation, a technology company.",
          },
          {
            conversation_id: testConversation.id,
            role: "user",
            content: "Test message 2: What was my previous question?",
          },
        ])

        if (!messageError) {
          updateTestResult("Message Storage", "success", "Messages saved successfully")

          // Test 5: Conversation Context
          const { data: contextData } = await supabase
            .from("conversations")
            .select(`
              messages (
                role,
                content,
                created_at
              )
            `)
            .eq("id", testConversation.id)
            .single()

          if (contextData?.messages && contextData.messages.length >= 3) {
            updateTestResult(
              "Conversation Context",
              "success",
              `Retrieved ${contextData.messages.length} messages for context`,
            )
          } else {
            updateTestResult("Conversation Context", "error", "Failed to retrieve conversation context")
          }
        } else {
          updateTestResult("Message Storage", "error", `Failed to save messages: ${messageError.message}`)
        }

        // Test 6: Real-time Updates
        setTimeout(async () => {
          const { data: updatedConversation } = await supabase
            .from("conversations")
            .select("message_count, last_message_preview")
            .eq("id", testConversation.id)
            .single()

          if (updatedConversation && updatedConversation.message_count > 0) {
            updateTestResult(
              "Real-time Updates",
              "success",
              `Conversation metadata updated: ${updatedConversation.message_count} messages`,
            )
          } else {
            updateTestResult("Real-time Updates", "error", "Conversation metadata not updated")
          }

          // Clean up test conversation
          await remove(testConversation.id)
        }, 2000)
      } else {
        updateTestResult("Create Conversation", "error", "Failed to create test conversation")
      }
    } catch (error) {
      console.error("Test error:", error)
      updateTestResult("Database Schema", "error", `Test failed: ${error}`)
    } finally {
      setTimeout(() => setIsRunning(false), 3000)
    }
  }

  const getStatusIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-yellow-500 animate-spin" />
    }
  }

  const getStatusBadge = (status: TestResult["status"]) => {
    switch (status) {
      case "success":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Passed
          </Badge>
        )
      case "error":
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="secondary">Running</Badge>
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Conversation Memory System Test
          {isRunning && <Clock className="h-4 w-4 animate-spin" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={runTests} disabled={isRunning} className="bg-purple-600 hover:bg-purple-700">
            {isRunning ? "Running Tests..." : "Run Memory Tests"}
          </Button>
          <div className="text-sm text-gray-600 flex items-center">Current conversations: {conversations.length}</div>
        </div>

        {testResults.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold">Test Results:</h3>
            {testResults.map((test, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  {getStatusIcon(test.status)}
                  <span className="font-medium">{test.name}</span>
                </div>
                <div className="flex items-center gap-2">{getStatusBadge(test.status)}</div>
              </div>
            ))}
          </div>
        )}

        <div className="text-xs text-gray-500 mt-4">
          <p>
            <strong>What this tests:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 mt-1">
            <li>Database schema and table accessibility</li>
            <li>User authentication and session management</li>
            <li>Conversation creation and management</li>
            <li>Message persistence and storage</li>
            <li>Context retrieval for conversation memory</li>
            <li>Real-time updates and triggers</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
