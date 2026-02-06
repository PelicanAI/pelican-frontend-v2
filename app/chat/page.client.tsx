"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { ConversationSidebar } from "@/components/chat/conversation-sidebar"
import { ChatContainer } from "@/components/chat/chat-container"
import { ChatInput, type ChatInputRef } from "@/components/chat/chat-input"
import { TradingContextPanel } from "@/components/chat/trading-context-panel"
import { ChatErrorBoundary } from "@/components/chat/chat-error-boundary"
import { useChat } from "@/hooks/use-chat"
import { useMarketData } from "@/hooks/use-market-data"
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
import Image from "next/image"
import { cn } from "@/lib/utils"
import { SettingsModal } from "@/components/settings-modal"
import { PaywallGate } from "@/components/paywall-gate"
import { TrialExhaustedModal } from "@/components/trial-exhausted-modal"
import { InsufficientCreditsModal } from "@/components/insufficient-credits-modal"
import { useCreditsContext } from "@/providers/credits-provider"
import { ChartProvider, useChart } from "@/providers/chart-provider"
import { TradingViewChart } from "@/components/chat/TradingViewChart"

// Loading screen component for chat page
function ChatLoadingScreen() {
  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-purple-950/20 via-black to-violet-950/20">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="animate-spin h-12 w-12 border-4 border-purple-500 border-t-transparent rounded-full" />
          <div className="absolute inset-0 animate-ping h-12 w-12 border-4 border-purple-500 border-t-transparent rounded-full opacity-20" />
        </div>
        <span className="text-gray-400 text-sm font-medium">Loading Pelican AI...</span>
      </div>
    </div>
  )
}

// Auto-expand trading panel when a chart is requested
function ChartPanelExpander({ onExpand }: { onExpand: () => void }) {
  const { mode } = useChart()
  useEffect(() => {
    if (mode === "chart") onExpand()
  }, [mode, onExpand])
  return null
}

// Mobile chart sheet — opens on screens below xl when a chart is requested
function MobileChartSheet() {
  const { mode, selectedTicker, closeChart } = useChart()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 1279px)")
    setIsMobile(mql.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mql.addEventListener("change", handler)
    return () => mql.removeEventListener("change", handler)
  }, [])

  if (!isMobile) return null

  return (
    <Sheet open={mode === "chart" && !!selectedTicker} onOpenChange={(open) => { if (!open) closeChart() }}>
      <SheetContent side="bottom" className="h-[70vh] p-0 rounded-t-xl">
        {selectedTicker && (
          <TradingViewChart symbol={selectedTicker} onClose={closeChart} />
        )}
      </SheetContent>
    </Sheet>
  )
}

export default function ChatPage() {
  const { user, loading: authLoading } = useAuth()
  const { refetch } = useCreditsContext()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('pelican_sidebar_collapsed') === 'true'
    }
    return false
  })
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [showOfflineBanner, setShowOfflineBanner] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [tradingPanelCollapsed, setTradingPanelCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('pelican_trading_panel_collapsed') === 'true'
    }
    return false
  })

  // Handle sidebar toggle with persistence
  const handleSidebarToggle = () => {
    const newCollapsed = !sidebarCollapsed
    setSidebarCollapsed(newCollapsed)
    localStorage.setItem('pelican_sidebar_collapsed', newCollapsed.toString())
  }

  // Handle trading panel toggle with persistence
  const handleTradingPanelToggle = () => {
    const newCollapsed = !tradingPanelCollapsed
    setTradingPanelCollapsed(newCollapsed)
    localStorage.setItem('pelican_trading_panel_collapsed', newCollapsed.toString())
  }

  // Fetch real-time market data
  const { indices, vix, vixChange, sectors, watchlist, isLoading: isLoadingMarketData, refresh: refreshMarketData } = useMarketData({
    refreshInterval: 60000, // Refresh every 60 seconds
    autoRefresh: true,
    watchlistSymbols: ['AAPL', 'TSLA', 'NVDA', 'SPY'] // User's custom watchlist
  })

  // Initialize after mount and monitor network status
  useEffect(() => {
    setMounted(true)

    // Monitor online/offline status
    const handleOnline = () => {
      setIsOnline(true)
      setShowOfflineBanner(false)
    }
    const handleOffline = () => {
      setIsOnline(false)
      setShowOfflineBanner(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [trialExhaustedOpen, setTrialExhaustedOpen] = useState(false)
  const [trialExhaustedMessage, setTrialExhaustedMessage] = useState<string | null>(null)
  const [insufficientCreditsOpen, setInsufficientCreditsOpen] = useState(false)
  const [insufficientCreditsMessage, setInsufficientCreditsMessage] = useState<string | null>(null)
  const [insufficientCreditsRequired, setInsufficientCreditsRequired] = useState<number | null>(null)
  const [insufficientCreditsBalance, setInsufficientCreditsBalance] = useState<number | null>(null)
  const chatInputRef = useRef<ChatInputRef>(null)

  // Get conversation ID from URL
  const conversationIdFromUrl = searchParams.get("conversation")

  const {
    messages,
    isLoading: chatLoading,
    isLoadingMessages,
    sendMessage,
    stopGeneration,
    clearMessages,
    regenerateLastMessage,
    addSystemMessage,
    conversationNotFound,
  } = useChat({
    conversationId: conversationIdFromUrl,
    onError: (error) => {
      // Show offline banner for network errors
      setShowOfflineBanner(true)
    },
    onFinish: async (message) => {
      // Message sent successfully, hide offline banner if it was showing
      setShowOfflineBanner(false)
      messageHandler.handleMessageFinish()
    },
    onConversationCreated: (conversationId: string) => {
      conversationRouter.setCurrentConversationId(conversationId)
    },
    onTrialExhausted: (info) => {
      setTrialExhaustedMessage(
        info.message || 'Your free trial has ended. Subscribe to continue using Pelican.'
      )
      setTrialExhaustedOpen(true)
      refetch()
    },
    onInsufficientCredits: (info) => {
      setInsufficientCreditsMessage(
        info.message || 'Not enough credits to run this query.'
      )
      setInsufficientCreditsRequired(info.required ?? null)
      setInsufficientCreditsBalance(info.balance ?? null)
      setInsufficientCreditsOpen(true)
      refetch()
    },
  })

  const messageHandler = useMessageHandler({
    chatLoading,
    currentConversationId: conversationIdFromUrl,
    sendMessage,
    chatInputRef,
  })

  const conversationRouter = useConversationRouter({
    user,
    chatLoading,
    messages,
    stopGeneration,
    clearMessages,
    clearDraftForConversation: messageHandler.clearDraftForConversation,
  })

  // Update the messageHandler with the current conversation ID
  useEffect(() => {
    messageHandler.setDraftConversationId(conversationRouter.currentConversationId || null)
  }, [conversationRouter.currentConversationId, messageHandler])

  // Clear guest conversation IDs from URL when user loads page
  useEffect(() => {
    if (conversationIdFromUrl && conversationIdFromUrl.startsWith('guest-')) {
      // Guest conversation ID in URL - clear it and redirect
      router.replace('/chat')
    }
  }, [conversationIdFromUrl, router])

  // ✅ FIX: Removed redirect - with API fix, conversationNotFound won't be set for new convos
  // If you see this log, something unexpected happened
  useEffect(() => {
    if (conversationNotFound && conversationIdFromUrl) {
      console.warn('[CHAT] Conversation not found (unexpected):', conversationIdFromUrl)
      // Don't redirect - let user continue or handle gracefully
    }
  }, [conversationNotFound, conversationIdFromUrl])

  const fileUpload = useFileUpload({
    sendMessage,
    addSystemMessage,
    chatInputRef,
  })

  // Clear uploaded files when switching conversations
  const prevConversationRef = useRef(conversationIdFromUrl)
  useEffect(() => {
    if (prevConversationRef.current !== conversationIdFromUrl) {
      fileUpload.clearUploadedFiles()
    }
    prevConversationRef.current = conversationIdFromUrl
  }, [conversationIdFromUrl, fileUpload])

  const handleQuickStart = (message: string) => {
    messageHandler.handleSendMessage(message)
  }

  const handleSendMessageWithFiles = useCallback(async (message: string) => {
    // Get uploaded file IDs and attachments
    const fileIds = fileUpload.getUploadedFileIds()
    const attachments = fileUpload.getUploadedAttachments()
    
    // Send message with files
    await messageHandler.handleSendMessage(message, { 
      fileIds: fileIds.length > 0 ? fileIds : undefined,
      attachments: attachments.length > 0 ? attachments : undefined
    })
    
    // Clear uploaded files after sending
    fileUpload.clearUploadedFiles()
  }, [fileUpload, messageHandler])

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

  // Show loading screen while checking auth
  if (!mounted || authLoading) {
    return <ChatLoadingScreen />
  }

  // Require authentication - redirect to login if no user
  if (!user) {
    router.push('/auth/login')
    return <ChatLoadingScreen />
  }

  return (
    <PaywallGate>
      <ChatErrorBoundary onReset={() => clearMessages()}>
        <ChartProvider>
        <ChartPanelExpander onExpand={() => {
          setTradingPanelCollapsed(false)
          localStorage.setItem('pelican_trading_panel_collapsed', 'false')
        }} />
        <div className="flex h-[100svh] min-h-[100svh] overflow-hidden relative chat-background-gradient">
      {/* Futuristic background effects - only in dark mode */}
      {/* <div className="absolute inset-0 dark:block hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950/10 via-black to-violet-950/10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(124,58,237,0.08),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(139,92,246,0.06),transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(124,58,237,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(124,58,237,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black,transparent)]" />
      </div> */}
      {/* Offline indicator */}
      {showOfflineBanner && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 dark:bg-amber-600 text-white px-4 py-2 text-center text-sm font-medium shadow-lg">
          <div className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
            </svg>
            <span>No internet connection. Your messages won&apos;t send until you&apos;re back online.</span>
          </div>
        </div>
      )}

      {!sidebarCollapsed && (
        <div className="hidden xl:block">
          <ConversationSidebar
            currentConversationId={conversationRouter.currentConversationId || undefined}
            onConversationSelect={handleConversationSelect}
            onNewConversation={handleNewConversation}
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={handleSidebarToggle}
          />
        </div>
      )}

      <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
        <SheetContent
          side="left"
          className={cn(
            "w-[85vw] max-w-[320px] p-0 border-r-border",
            mobileSheetOpen ? "pointer-events-auto" : "pointer-events-none",
          )}
          onOpenAutoFocus={(e) => {
            const target = e.currentTarget as HTMLElement | null
            if (target) {
              const searchInput = target.querySelector('input[placeholder*="Search"]') as HTMLInputElement | null
              if (searchInput) {
                searchInput.focus()
              }
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
        <div className="xl:hidden border-b p-4 flex items-center justify-between bg-background border-border">
          <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-11 w-11 min-h-[44px] min-w-[44px] glow-button glow-ghost"
                aria-label="Open sidebar"
              >
                <Menu className="h-5 w-5 text-foreground" />
              </Button>
            </SheetTrigger>
          </Sheet>
          <div className="flex items-center gap-2">
            <Image src="/pelican-logo-transparent.webp" alt="PelicanAI" width={24} height={24} className="w-6 h-6 object-contain" />
            <span className="font-semibold text-foreground">Pelican AI</span>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>

        {/* Desktop sidebar toggle button - only show when sidebar is collapsed */}
        {sidebarCollapsed && (
          <div className="hidden xl:flex items-center justify-between p-4 border-b border-border bg-background">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSidebarToggle}
              className="glow-button glow-ghost"
            >
              <Menu className="h-4 w-4 text-foreground mr-2" />
              <span className="text-sm font-medium">Show Sidebar</span>
            </Button>
            <div className="flex items-center gap-2">
              <Image src="/pelican-logo-transparent.webp" alt="PelicanAI" width={24} height={24} className="w-6 h-6 object-contain" />
              <span className="font-semibold text-foreground">Pelican AI</span>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto pb-[120px] md:pb-0">
            <div className="max-w-5xl mx-auto w-full px-4 sm:px-6">
              <ChatContainer
                messages={messages}
                isLoading={chatLoading}
                isLoadingHistory={isLoadingMessages}
                onStopGeneration={handleStopGeneration}
                onRegenerateMessage={regenerateLastMessage}
                onQuickStart={handleQuickStart}
                onFileUpload={fileUpload.handleMultipleFileUpload}
                onSettingsClick={handleSettingsClick}
              />
            </div>
          </div>

          <div className={cn(
            "bg-background border-t border-border",
            "fixed bottom-0 left-0 right-0 md:relative md:bottom-auto",
            "safe-bottom md:pb-4",
            "z-40"
          )}>
            <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-3">
              <ChatInput
                ref={chatInputRef}
                onSendMessage={handleSendMessageWithFiles}
                onStopResponse={handleStopGeneration}
                onFileUpload={fileUpload.handleMultipleFileUpload}
                disabled={isLoadingMessages}
                disabledSend={(chatLoading || isLoadingMessages) && !messageHandler.isQueueingMessage}
                canSend={(!chatLoading && !isLoadingMessages) || messageHandler.isQueueingMessage}
                placeholder="Ask Pelican anything..."
                onTypingDuringResponse={messageHandler.handleTypingDuringResponse}
                isAIResponding={chatLoading}
                pendingDraft={messageHandler.pendingDraft}
                attachments={[
                  ...fileUpload.pendingAttachments.map((pa) => ({
                    name: pa.file.name,
                    type: pa.file.type,
                    url: "",
                  })),
                  ...fileUpload.uploadedFiles.map((f) => ({
                    name: f.name,
                    type: f.type,
                    url: f.url,
                  }))
                ]}
                onRemoveAttachment={(index: number) => {
                  const pendingCount = fileUpload.pendingAttachments.length
                  
                  if (index < pendingCount) {
                    // Remove from pending
                    const attachment = fileUpload.pendingAttachments[index]
                    if (attachment) {
                      fileUpload.handleRemovePendingAttachment(attachment.id)
                    }
                  } else {
                    // Remove from uploaded files
                    const uploadedIndex = index - pendingCount
                    fileUpload.removeUploadedFile(uploadedIndex)
                  }
                }}
                pendingAttachments={fileUpload.pendingAttachments}
                onRetryAttachment={fileUpload.handleRetryUpload}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Trading Context Panel - Desktop only */}
      {!tradingPanelCollapsed && (
        <div className="hidden xl:block w-80 h-full overflow-y-auto transition-all duration-300">
          <TradingContextPanel
            collapsed={tradingPanelCollapsed}
            onToggleCollapse={handleTradingPanelToggle}
            indices={indices}
            vix={vix}
            vixChange={vixChange}
            sectors={sectors}
            watchlist={watchlist}
            isLoading={isLoadingMarketData}
            onRefresh={refreshMarketData}
          />
        </div>
      )}

      {/* Show expand button when trading panel is collapsed */}
      {tradingPanelCollapsed && (
        <div className="hidden xl:flex items-start p-2 bg-background border-l border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleTradingPanelToggle}
            className="h-8 px-2"
            title="Show Market Overview"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="ml-1 text-xs">Market</span>
          </Button>
        </div>
      )}

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
      <TrialExhaustedModal
        isOpen={trialExhaustedOpen}
        message={trialExhaustedMessage}
        onClose={() => setTrialExhaustedOpen(false)}
      />
      <InsufficientCreditsModal
        isOpen={insufficientCreditsOpen}
        message={insufficientCreditsMessage}
        required={insufficientCreditsRequired}
        balance={insufficientCreditsBalance}
        onClose={() => setInsufficientCreditsOpen(false)}
      />
      <MobileChartSheet />
        </div>
        </ChartProvider>
      </ChatErrorBoundary>
    </PaywallGate>
  )
}
