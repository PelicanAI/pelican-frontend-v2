"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { ConversationSidebar } from "@/components/chat/conversation-sidebar"
import { ChatContainer } from "@/components/chat/chat-container"
import { ChatInput, type ChatInputRef } from "@/components/chat/chat-input"
import { TradingContextPanel } from "@/components/chat/trading-context-panel"
import { useChat } from "@/hooks/use-chat"
// import { useMarketData } from "@/hooks/use-market-data"
import { useConversations } from "@/hooks/use-conversations"
import { useMessageHandler } from "@/hooks/use-message-handler"
import { useFileUpload } from "@/hooks/use-file-upload"
import { useConversationRouter } from "@/hooks/use-conversation-router"
import { useAuth } from "@/lib/providers/auth-provider"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { SettingsModal } from "@/components/settings-modal"

export default function ChatPage() {
  const { user, loading: authLoading } = useAuth()
  const { updateConversation } = useConversations()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [guestMode, setGuestMode] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [tradingPanelCollapsed, setTradingPanelCollapsed] = useState(false)

  // TODO: Uncomment when ready to add real market data
  // const { indices, vix, vixChange, sectors, watchlist, isLoading: isLoadingMarketData, refresh: refreshMarketData } = useMarketData({
  //   refreshInterval: 60000, // Refresh every 60 seconds
  //   autoRefresh: true,
  //   watchlistSymbols: ['AAPL', 'TSLA', 'NVDA', 'SPY'] // User's custom watchlist
  // })

  // Initialize after mount
  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('pelican_guest_mode')
    console.log('Guest mode from storage:', stored)
    if (stored === 'true') {
      setGuestMode(true)
    }
  }, [])
  const [settingsOpen, setSettingsOpen] = useState(false)
  const chatInputRef = useRef<ChatInputRef>(null)

  // Get conversation ID from URL
  const conversationIdFromUrl = searchParams.get("conversation")

  const {
    messages,
    isLoading: chatLoading,
    sendMessage,
    stopGeneration,
    clearMessages,
    regenerateLastMessage,
    addSystemMessage,
  } = useChat({
    conversationId: conversationIdFromUrl,
    onError: (error) => {
      setIsOnline(false)
      setTimeout(() => setIsOnline(true), 5000)
    },
    onFinish: async (message) => {
      setIsOnline(true)
      messageHandler.handleMessageFinish()
    },
    onConversationCreated: (conversationId: string) => {
      conversationRouter.setCurrentConversationId(conversationId)
    },
  })

  const messageHandler = useMessageHandler({
    chatLoading,
    currentConversationId: conversationIdFromUrl,
    guestMode,
    sendMessage,
    chatInputRef,
  })

  const conversationRouter = useConversationRouter({
    user,
    guestMode,
    chatLoading,
    messages,
    stopGeneration,
    clearMessages,
    updateConversation,
    clearDraftForConversation: messageHandler.clearDraftForConversation,
  })

  // Update the messageHandler with the current conversation ID
  useEffect(() => {
    messageHandler.draftConversationId = conversationRouter.currentConversationId
  }, [conversationRouter.currentConversationId, messageHandler])

  // Clear guest mode when user logs in
  useEffect(() => {
    if (user && guestMode) {
      localStorage.removeItem('pelican_guest_mode')
      setGuestMode(false)
    }
  }, [user, guestMode])

  const fileUpload = useFileUpload({
    sendMessage,
    addSystemMessage,
    guestMode,
    chatInputRef,
  })

  const handleQuickStart = (message: string) => {
    messageHandler.handleSendMessage(message)
  }

  const handleConversationSelect = (id: string) => {
    conversationRouter.handleConversationSelect(id)
    setMobileSheetOpen(false)
  }

  const handleNewConversation = async () => {
    await conversationRouter.handleNewConversation()
    setMobileSheetOpen(false)
  }

  const handleStopGeneration = () => {
    stopGeneration()
    messageHandler.resetDraftState()
  }

  const handleSettingsClick = () => {
    setSettingsOpen(true)
  }

  if (!user && !guestMode) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6 bg-background">
        <div className="text-center space-y-6 max-w-md">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-foreground">Welcome to Pelican AI</h2>
            <p className="text-lg text-muted-foreground">Your intelligent trading assistant</p>
          </div>

          <div className="space-y-3">
            <Button
              asChild
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 signin-button-custom glow-button glow-primary"
            >
              <Link href="/auth/login" className="signin-button-custom">
                Sign In
              </Link>
            </Button>
            <Button asChild variant="secondary" className="w-full glow-button glow-secondary">
              <Link href="/auth/signup">Create Account</Link>
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or</span>
            </div>
          </div>

          <Button
            onClick={() => {
              localStorage.setItem('pelican_guest_mode', 'true')
              setGuestMode(true)
            }}
            variant="outline"
            className="w-full border-border hover:bg-accent hover:text-accent-foreground"
          >
            Try Demo Mode
          </Button>

          <p className="text-sm text-muted-foreground">
            Demo mode allows you to try Pelican AI without an account. Conversations won't be saved.
          </p>
        </div>
      </div>
    )
  }

  // Don't render anything until mounted (avoids hydration mismatch)
  if (!mounted) {
    return null
  }

  console.log('Render state:', { user, guestMode, authLoading, mounted })

  // If in guest mode, skip auth entirely
  if (guestMode) {
    // Guest mode - show chat interface directly
    console.log('Guest mode active, showing chat')
  } else if (authLoading) {
    // Only show loading for non-guest users waiting for auth
    console.log('Waiting for auth...')
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <div className="hidden md:block">
        <ConversationSidebar
          currentConversationId={conversationRouter.currentConversationId || undefined}
          onConversationSelect={handleConversationSelect}
          onNewConversation={handleNewConversation}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
        <SheetContent
          side="left"
          className={cn(
            "w-[85vw] p-0 border-r-border",
            mobileSheetOpen ? "pointer-events-auto" : "pointer-events-none",
          )}
          onOpenAutoFocus={(e) => {
            const searchInput = e.currentTarget.querySelector('input[placeholder*="Search"]') as HTMLInputElement
            if (searchInput) {
              searchInput.focus()
            }
          }}
          onCloseAutoFocus={() => {
            setTimeout(() => {
              chatInputRef.current?.focus()
            }, 100)
          }}
        >
          <ConversationSidebar
            currentConversationId={conversationRouter.currentConversationId || undefined}
            onConversationSelect={handleConversationSelect}
            onNewConversation={handleNewConversation}
            isCollapsed={false}
            isMobileSheet={true}
          />
        </SheetContent>
      </Sheet>

      <div className="flex-1 flex flex-col h-full min-w-0">
        <div className="md:hidden border-b p-4 flex items-center justify-between bg-background border-border">
          <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="glow-button glow-ghost">
                <Menu className="h-4 w-4 text-foreground" />
              </Button>
            </SheetTrigger>
          </Sheet>
          <div className="flex items-center gap-2">
            <img src="/pelican-logo.png" alt="PelicanAI" className="w-6 h-6 object-contain" />
            <span className="font-semibold text-foreground">Pelican AI</span>
          </div>
          <ThemeToggle />
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto w-full">
              <ChatContainer
                messages={messages}
                isLoading={chatLoading}
                onStopGeneration={handleStopGeneration}
                onRegenerateMessage={regenerateLastMessage}
                onQuickStart={handleQuickStart}
                onFileUpload={fileUpload.handleMultipleFileUpload}
                onSettingsClick={handleSettingsClick}
              />
            </div>
          </div>

          <div className="bg-background border-t border-border pb-4">
            <div className="max-w-3xl mx-auto w-full px-3 py-3">
              <ChatInput
                ref={chatInputRef}
                onSendMessage={messageHandler.handleSendMessage}
                onStopResponse={handleStopGeneration}
                onFileUpload={fileUpload.handleMultipleFileUpload}
                disabled={false}
                disabledSend={chatLoading && !messageHandler.isQueueingMessage}
                canSend={!chatLoading || messageHandler.isQueueingMessage}
                placeholder="Find me a bullish strategy"
                onTypingDuringResponse={messageHandler.handleTypingDuringResponse}
                isAIResponding={chatLoading}
                pendingDraft={messageHandler.pendingDraft}
                onForceQueue={messageHandler.handleForceQueue}
                isQueuing={messageHandler.isQueueingMessage}
                attachments={fileUpload.pendingAttachments.map((pa) => ({
                  name: pa.file.name,
                  type: pa.file.type,
                  url: "",
                }))}
                onRemoveAttachment={fileUpload.handleRemovePendingAttachment}
                pendingAttachments={fileUpload.pendingAttachments}
                onRetryAttachment={fileUpload.handleRetryUpload}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Trading Context Panel - Desktop only */}
      <div className="hidden xl:block w-80 h-full overflow-y-auto">
        <TradingContextPanel
          collapsed={tradingPanelCollapsed}
          // Future: Pass real data props here
          // indices={marketIndices}
          // vix={vixData}
          // sectors={sectorData}
          // watchlist={userWatchlist}
          // isLoading={isLoadingMarketData}
          // onRefresh={refreshMarketData}
        />
      </div>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  )
}