"use client"

import { motion } from "framer-motion"
import { AttachmentChip } from "../attachment-chip"
import { TableImageDisplay } from "../table-image-display"
import type { Attachment } from "@/lib/chat-utils"

interface AttachmentDisplayProps {
  attachments: Attachment[] | undefined
}

export function AttachmentDisplay({ attachments }: AttachmentDisplayProps) {
  if (!attachments || attachments.length === 0) return null

  return (
    <div className="attachments-container my-4">
      {attachments.map((attachment, index) => {
        const isImage =
          attachment.type?.toLowerCase().includes("image") ||
          attachment.type === "image/png" ||
          attachment.type === "image/jpeg" ||
          attachment.type === "image/jpg" ||
          attachment.type === "image/gif" ||
          attachment.type === "image/webp" ||
          attachment.name?.toLowerCase().match(/\.(png|jpg|jpeg|gif|webp)$/i)

        const isPelicanTable =
          isImage &&
          (attachment.type === "image/png" ||
            attachment.name?.toLowerCase().includes("pelican_analysis") ||
            attachment.name?.toLowerCase().includes("pelican_table") ||
            attachment.name?.toLowerCase().includes("table"))

        if (isPelicanTable) {
          return <TableImageDisplay key={index} attachment={attachment} />
        } else if (isImage) {
          return (
            <motion.div
              key={index}
              className="my-3"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <div className="relative group bg-background rounded-lg border border-border shadow-sm overflow-hidden max-w-full">
                <img
                  src={attachment.url || "/placeholder.svg"}
                  alt={attachment.name || "Attachment"}
                  className="w-full h-auto max-w-full cursor-pointer"
                  style={{ maxHeight: "600px", objectFit: "contain" }}
                  onClick={() => window.open(attachment.url, "_blank")}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = "/placeholder.svg"
                  }}
                  loading="lazy"
                />
                {attachment.name && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs sm:text-xs px-2 sm:px-3 py-1.5 sm:py-2 opacity-0 group-hover:opacity-100 transition-opacity truncate">
                    {attachment.name}
                  </div>
                )}
              </div>
            </motion.div>
          )
        }

        return (
          <motion.div
            key={index}
            className="flex flex-wrap gap-2 mb-3"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <AttachmentChip
              name={attachment.name || "Attachment"}
              type={attachment.type || "application/octet-stream"}
              onClick={() => window.open(attachment.url, "_blank")}
            />
          </motion.div>
        )
      })}
    </div>
  )
}
