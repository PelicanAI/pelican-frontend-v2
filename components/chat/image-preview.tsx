"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Eye, Download } from "lucide-react"
import Image from "next/image"

interface ImagePreviewProps {
  file: File
  onRemove: () => void
  className?: string
}

export function ImagePreview({ file, onRemove, className }: ImagePreviewProps) {
  const [imageUrl, setImageUrl] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)

  // Create object URL for preview
  useState(() => {
    const url = URL.createObjectURL(file)
    setImageUrl(url)
    setIsLoading(false)

    return () => URL.revokeObjectURL(url)
  })

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <Card className={`p-3 ${className}`}>
      <div className="flex items-start gap-3">
        {/* Image Preview */}
        <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
          {!isLoading && imageUrl ? (
            <Image src={imageUrl || "/placeholder.svg"} alt={file.name} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Eye className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* File Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {file.type.split("/")[1]?.toUpperCase() || "IMAGE"}
                </Badge>
                <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => {
                  const link = document.createElement("a")
                  link.href = imageUrl
                  link.download = file.name
                  link.click()
                }}
              >
                <Download className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive hover:text-destructive"
                onClick={onRemove}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
