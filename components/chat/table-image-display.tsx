"use client"

import React, { useState } from "react"
import { Download, Share2, Check, ExternalLink, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import type { Attachment } from "@/lib/chat-utils"

interface TableImageDisplayProps {
  attachment: Attachment
}

export function TableImageDisplay({ attachment }: TableImageDisplayProps) {
  const [copied, setCopied] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [error, setError] = useState(false)
  const { toast } = useToast()

  const handleDownload = () => {
    try {
      const link = document.createElement("a")
      link.href = attachment.url
      link.download = attachment.name || "pelican_analysis.png"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Downloaded",
        description: "Table image saved successfully",
      })
    } catch (err) {
      console.error("Download failed:", err)
      toast({
        title: "Download failed",
        description: "Could not download the image",
        variant: "destructive",
      })
    }
  }

  const handleShare = async () => {
    try {
      // Convert data URL to blob for sharing
      const response = await fetch(attachment.url)
      const blob = await response.blob()
      const file = new File([blob], attachment.name, { type: "image/png" })

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Pelican Analysis",
          text: "Check out this market analysis from Pelican!",
        })
      } else {
        // Fallback: copy to clipboard
        handleCopyImage()
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        console.error("Share failed:", err)
        toast({
          title: "Share not available",
          description: "Try downloading or copying instead",
          variant: "destructive",
        })
      }
    }
  }

  const handleCopyImage = async () => {
    try {
      const response = await fetch(attachment.url)
      const blob = await response.blob()
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])

      setCopied(true)
      setTimeout(() => setCopied(false), 2000)

      toast({
        title: "Copied!",
        description: "Image copied to clipboard",
      })
    } catch (err) {
      console.error("Failed to copy image:", err)
      // Fallback: open in new tab
      handleOpenInNewTab()
    }
  }

  const handleOpenInNewTab = () => {
    const newWindow = window.open()
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head><title>${attachment.name}</title></head>
          <body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f3f4f6;">
            <img src="${attachment.url}" style="max-width:100%;height:auto;" alt="Pelican Analysis" />
          </body>
        </html>
      `)
    }
  }

  if (error) {
    return (
      <div className="my-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
        <p className="text-destructive text-sm">Failed to load table image</p>
      </div>
    )
  }

  return (
    <div className="pelican-table-container my-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="image-wrapper relative bg-background rounded-lg shadow-lg overflow-hidden border border-border">
        {!imageLoaded && (
          <div className="loading-skeleton h-96 bg-muted animate-pulse flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="text-muted-foreground text-sm">Loading table...</span>
            </div>
          </div>
        )}

        <img
          src={attachment.url}
          alt={attachment.name || "Pelican Analysis Table"}
          className={`w-full h-auto ${!imageLoaded ? "hidden" : ""}`}
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            console.error("Failed to load table image:", attachment.url)
            setError(true)
          }}
          style={{ 
            maxHeight: "800px", 
            maxWidth: "100%",
            objectFit: "contain",
            display: imageLoaded ? "block" : "none"
          }}
        />

        {imageLoaded && (
          <div className="image-actions flex flex-wrap gap-2 p-3 bg-muted/50 border-t border-border">
            <Button onClick={handleDownload} variant="outline" size="sm" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Download</span>
            </Button>

            <Button onClick={handleShare} variant="outline" size="sm" className="flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">Share</span>
            </Button>

            <Button onClick={handleCopyImage} variant="outline" size="sm" className="flex items-center gap-2">
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="hidden sm:inline">Copied!</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Copy</span>
                </>
              )}
            </Button>

            <Button
              onClick={handleOpenInNewTab}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 ml-auto"
            >
              <ExternalLink className="h-4 w-4" />
              <span className="hidden sm:inline">Open</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

