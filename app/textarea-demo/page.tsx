"use client"

import { useState } from "react"
import { PremiumTextarea } from "@/components/ui/premium-textarea"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Moon, Sun, Palette } from "lucide-react"

export default function TextareaDemoPage() {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [message1, setMessage1] = useState("")
  const [message2, setMessage2] = useState("This textarea is disabled to show the disabled state styling.")
  const [message3, setMessage3] = useState("")
  const [currentHeight, setCurrentHeight] = useState(56)

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
    document.documentElement.classList.toggle("dark")
  }

  return (
    <div className={`min-h-screen transition-colors duration-200 ${isDarkMode ? "dark bg-gray-900" : "bg-gray-50"}`}>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Premium Textarea Component</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Beautiful textarea with ChatGPT-quality styling and smooth animations
            </p>
          </div>
          <Button variant="outline" size="icon" onClick={toggleTheme} className="w-10 h-10 bg-transparent">
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>

        {/* Features Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-purple-500" />
              Key Features
            </CardTitle>
            <CardDescription>Premium styling that matches and exceeds ChatGPT's quality</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <Badge variant="secondary" className="justify-center py-2">
                Auto-resize (56px - 200px)
              </Badge>
              <Badge variant="secondary" className="justify-center py-2">
                Smooth 180ms transitions
              </Badge>
              <Badge variant="secondary" className="justify-center py-2">
                Purple focus states
              </Badge>
              <Badge variant="secondary" className="justify-center py-2">
                Custom scrollbar
              </Badge>
              <Badge variant="secondary" className="justify-center py-2">
                Inset shadows
              </Badge>
              <Badge variant="secondary" className="justify-center py-2">
                Inter font family
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Demo Sections */}
        <div className="space-y-8">
          {/* Default State */}
          <Card>
            <CardHeader>
              <CardTitle>Default State</CardTitle>
              <CardDescription>Standard textarea with auto-resize and focus states</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <PremiumTextarea
                isDarkMode={isDarkMode}
                value={message1}
                onChange={(e) => setMessage1(e.target.value)}
                onHeightChange={setCurrentHeight}
                placeholder="Message Pelican..."
              />
              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>Characters: {message1.length}</span>
                <span>Height: {currentHeight}px</span>
              </div>
            </CardContent>
          </Card>

          {/* Disabled State */}
          <Card>
            <CardHeader>
              <CardTitle>Disabled State</CardTitle>
              <CardDescription>Shows 30% opacity and disabled cursor</CardDescription>
            </CardHeader>
            <CardContent>
              <PremiumTextarea
                isDarkMode={isDarkMode}
                value={message2}
                onChange={(e) => setMessage2(e.target.value)}
                disabled
              />
            </CardContent>
          </Card>

          {/* Long Content */}
          <Card>
            <CardHeader>
              <CardTitle>Auto-resize Demo</CardTitle>
              <CardDescription>Type multiple lines to see smooth height transitions</CardDescription>
            </CardHeader>
            <CardContent>
              <PremiumTextarea
                isDarkMode={isDarkMode}
                value={message3}
                onChange={(e) => setMessage3(e.target.value)}
                placeholder="Type multiple lines here to see the textarea grow smoothly from 56px to 200px max height..."
              />
            </CardContent>
          </Card>

          {/* Styling Details */}
          <Card>
            <CardHeader>
              <CardTitle>Styling Specifications</CardTitle>
              <CardDescription>Technical details of the premium styling</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Core Design</h4>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li>• Background: rgba(255,255,255,0.02) dark / rgba(0,0,0,0.02) light</li>
                    <li>• Border: 1.5px solid rgba(255,255,255,0.08)</li>
                    <li>• Border-radius: 20px</li>
                    <li>• Padding: 18px 20px</li>
                    <li>• Font: Inter, 15px, line-height 1.6</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Focus State</h4>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li>• Border: rgba(139,92,246,0.4)</li>
                    <li>• Box-shadow: 0 0 0 3px rgba(139,92,246,0.1)</li>
                    <li>• Background: rgba(139,92,246,0.02)</li>
                    <li>• Selection: purple with white text</li>
                    <li>• Custom purple scrollbar</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Usage Example */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Usage Example</CardTitle>
            <CardDescription>How to implement the PremiumTextarea component</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto text-sm">
              <code>{`import { PremiumTextarea } from "@/components/ui/premium-textarea"

function MyComponent() {
  const [message, setMessage] = useState("")
  const [isDarkMode, setIsDarkMode] = useState(false)

  return (
    <PremiumTextarea
      isDarkMode={isDarkMode}
      value={message}
      onChange={(e) => setMessage(e.target.value)}
      onHeightChange={(height) => console.log('Height:', height)}
      placeholder="Message Pelican..."
    />
  )
}`}</code>
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
