"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import type { Suggestion } from "@/components/chat/input-suggestions"

const TICKERS = ["SPY", "QQQ", "AAPL", "MSFT", "NVDA", "TSLA", "AMD", "GOOGL", "META", "AMZN"]

const COMMON_QUERIES = [
  "What's the market outlook for",
  "Analyze my trading strategy",
  "Find bullish options for",
  "Risk management for",
  "What's moving the market today?",
  "Show me high IV stocks",
  "Compare technical indicators for",
  "Explain options strategies for",
]

const RECENT_SEARCHES_KEY = "pelican_recent_searches"
const MAX_RECENT_SEARCHES = 20
const MAX_SUGGESTIONS = 5

interface UseInputSuggestionsOptions {
  onAccept?: (text: string) => void
}

export function useInputSuggestions({ onAccept }: UseInputSuggestionsOptions = {}) {
  const [input, setInput] = useState("")
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [visible, setVisible] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setRecentSearches(Array.isArray(parsed) ? parsed : [])
      }
    } catch (error) {
      console.error("Failed to load recent searches:", error)
    }
  }, [])

  // Save a search to recent searches
  const saveRecentSearch = useCallback((search: string) => {
    if (!search.trim() || search.length < 3) return

    setRecentSearches((prev) => {
      // Remove duplicates and add to front
      const filtered = prev.filter((s) => s.toLowerCase() !== search.toLowerCase())
      const updated = [search, ...filtered].slice(0, MAX_RECENT_SEARCHES)

      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
      } catch (error) {
        console.error("Failed to save recent search:", error)
      }

      return updated
    })
  }, [])

  // Generate suggestions based on input
  const generateSuggestions = useCallback(
    (value: string): Suggestion[] => {
      const trimmed = value.trim()
      const suggestions: Suggestion[] = []

      // Check for ticker autocomplete ($ followed by letters)
      const tickerMatch = trimmed.match(/\$([A-Za-z]+)$/)
      if (tickerMatch && tickerMatch[1]) {
        const query = tickerMatch[1].toUpperCase()
        const matchingTickers = TICKERS.filter((ticker) => ticker.startsWith(query))

        suggestions.push(
          ...matchingTickers.slice(0, MAX_SUGGESTIONS).map((ticker) => ({
            text: `$${ticker}`,
            type: "ticker" as const,
          })),
        )
      }
      // Start of message or after 2+ chars - show common queries and recent
      else if (trimmed.length === 0 || trimmed.length >= 2) {
        const lowerInput = trimmed.toLowerCase()

        // Add matching common queries
        const matchingQueries = COMMON_QUERIES.filter((query) =>
          trimmed.length === 0 ? true : query.toLowerCase().includes(lowerInput),
        )

        suggestions.push(
          ...matchingQueries.slice(0, 3).map((query) => ({
            text: query,
            type: "query" as const,
          })),
        )

        // Add matching recent searches
        if (recentSearches.length > 0) {
          const matchingRecent = recentSearches.filter((search) =>
            trimmed.length === 0 ? true : search.toLowerCase().includes(lowerInput),
          )

          suggestions.push(
            ...matchingRecent.slice(0, 2).map((search) => ({
              text: search,
              type: "recent" as const,
            })),
          )
        }
      }

      return suggestions.slice(0, MAX_SUGGESTIONS)
    },
    [recentSearches],
  )

  // Update suggestions when input changes
  useEffect(() => {
    const newSuggestions = generateSuggestions(input)
    setSuggestions(newSuggestions)
    setSelectedIndex(0)
    setVisible(newSuggestions.length > 0)
  }, [input, generateSuggestions])

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!visible || suggestions.length === 0) return false

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault()
          setSelectedIndex((prev) => (prev + 1) % suggestions.length)
          return true

        case "ArrowUp":
          e.preventDefault()
          setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length)
          return true

        case "Tab":
        case "Enter":
          if (visible && suggestions[selectedIndex]) {
            e.preventDefault()
            const suggestion = suggestions[selectedIndex]
            acceptSuggestion(suggestion)
            return true
          }
          return false

        case "Escape":
          e.preventDefault()
          setVisible(false)
          return true

        default:
          return false
      }
    },
    [visible, suggestions, selectedIndex],
  )

  // Accept a suggestion
  const acceptSuggestion = useCallback(
    (suggestion: Suggestion) => {
      const newText = suggestion.text

      // If it's a ticker, append a space for easy typing
      const finalText = suggestion.type === "ticker" ? `${newText} ` : newText

      setInput(finalText)
      setVisible(false)
      onAccept?.(finalText)
    },
    [onAccept],
  )

  // Update input value
  const updateInput = useCallback((value: string) => {
    setInput(value)
  }, [])

  // Clear suggestions
  const clearSuggestions = useCallback(() => {
    setVisible(false)
    setSuggestions([])
  }, [])

  // Handle hover over suggestion
  const handleSuggestionHover = useCallback((index: number) => {
    setSelectedIndex(index)
  }, [])

  return {
    input,
    updateInput,
    suggestions,
    visible,
    selectedIndex,
    handleKeyDown,
    acceptSuggestion,
    saveRecentSearch,
    clearSuggestions,
    handleSuggestionHover,
  }
}