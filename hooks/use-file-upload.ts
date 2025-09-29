"use client"

import { useState, useCallback } from "react"
import type { ChatInputRef } from "@/components/chat/chat-input"
import { ACCEPTED_FILE_TYPES, LIMITS, API_ENDPOINTS } from "@/lib/constants"

const isAcceptedFileType = (file: File) => ACCEPTED_FILE_TYPES.includes(file.type as any)

interface PendingAttachment {
  file: File
  isError?: boolean
  id: string
  fileId?: string
}

interface UseFileUploadOptions {
  sendMessage: (content: string, options?: { guestMode?: boolean; attachments?: any[]; fileIds?: string[] }) => Promise<void>
  addSystemMessage: (content: string, retryAction?: () => void) => string
  guestMode: boolean
  chatInputRef: React.RefObject<ChatInputRef>
}

export function useFileUpload({ sendMessage, addSystemMessage, guestMode, chatInputRef }: UseFileUploadOptions) {
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([])

  const handleFileUpload = useCallback(
    async (file: File) => {
      console.log("[v0] File uploaded:", file.name)

      if (!isAcceptedFileType(file)) {
        const retryAction = () => {
          chatInputRef.current?.focus()
        }
        addSystemMessage(
          `${file.name} is not supported. Please upload Excel (.xlsx, .xls), CSV, PDF, images, or text files.`,
          retryAction,
        )
        setTimeout(() => {
          chatInputRef.current?.focus()
        }, 100)
        return
      }

      const maxSize = LIMITS.FILE_SIZE_MB * 1024 * 1024
      if (file.size > maxSize) {
        const retryAction = () => {
          chatInputRef.current?.focus()
        }
        addSystemMessage(`${file.name} is too large. Maximum file size is ${LIMITS.FILE_SIZE_MB}MB.`, retryAction)
        setTimeout(() => {
          chatInputRef.current?.focus()
        }, 100)
        return
      }

      const attachmentId = crypto.randomUUID()
      const pendingAttachment: PendingAttachment = {
        file,
        id: attachmentId,
      }
      setPendingAttachments((prev) => [...prev, pendingAttachment])

      try {
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch(API_ENDPOINTS.UPLOAD, {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Upload failed")
        }

        const { id: fileId, url, name, type, size } = await response.json()

        console.log("[upload] ok", { name, type, size, url })

        const attachments = [
          {
            type,
            name,
            url,
          },
        ]

        const fileIds = [fileId]

        setPendingAttachments((prev) => prev.filter((a) => a.id !== attachmentId))

        await sendMessage("", { guestMode, attachments, fileIds })

        setTimeout(() => {
          chatInputRef.current?.focus()
        }, 100)
      } catch (error) {
        console.error("[v0] File upload error:", error)

        setPendingAttachments((prev) => prev.map((a) => (a.id === attachmentId ? { ...a, isError: true } : a)))

        const retryAction = () => {
          handleRetryUpload(attachmentId)
        }
        addSystemMessage("Upload failed. Retry?", retryAction)
        setTimeout(() => {
          chatInputRef.current?.focus()
        }, 100)
      }
    },
    [sendMessage, addSystemMessage, guestMode, chatInputRef],
  )

  const handleRetryUpload = useCallback(
    (attachmentId: string) => {
      const attachment = pendingAttachments.find((a) => a.id === attachmentId)
      if (attachment) {
        setPendingAttachments((prev) => prev.filter((a) => a.id !== attachmentId))
        handleFileUpload(attachment.file)
      }
    },
    [pendingAttachments, handleFileUpload],
  )

  const handleRemovePendingAttachment = useCallback((attachmentId: string) => {
    setPendingAttachments((prev) => prev.filter((a) => a.id !== attachmentId))
  }, [])

  const handleMultipleFileUpload = useCallback(
    async (files: File[]) => {
      console.log(
        "[v0] Multiple files uploaded:",
        files.map((f) => f.name),
      )

      const validFiles = files.filter((file) => {
        if (!isAcceptedFileType(file)) {
          addSystemMessage(`${file.name} is not supported and will be skipped.`)
          return false
        }

        const maxSize = LIMITS.FILE_SIZE_MB * 1024 * 1024
        if (file.size > maxSize) {
          addSystemMessage(`${file.name} is too large and will be skipped.`)
          return false
        }

        return true
      })

      if (validFiles.length === 0) {
        setTimeout(() => {
          chatInputRef.current?.focus()
        }, 100)
        return
      }

      const newPendingAttachments = validFiles.map((file) => ({
        file,
        id: crypto.randomUUID(),
      }))
      setPendingAttachments((prev) => [...prev, ...newPendingAttachments])

      try {
        const uploadPromises = newPendingAttachments.map(async (pendingAttachment) => {
          const formData = new FormData()
          formData.append("file", pendingAttachment.file)

          const response = await fetch(API_ENDPOINTS.UPLOAD, {
            method: "POST",
            body: formData,
          })

          if (!response.ok) {
            const error = await response.json()
            setPendingAttachments((prev) =>
              prev.map((a) => (a.id === pendingAttachment.id ? { ...a, isError: true } : a)),
            )
            throw new Error(error.error || "Upload failed")
          }

          const result = await response.json()
          console.log("[v0] File uploaded:", pendingAttachment.file.name, result.url)

          setPendingAttachments((prev) => prev.filter((a) => a.id !== pendingAttachment.id))

          return result
        })

        const results = await Promise.allSettled(uploadPromises)
        const successfulResults = results
          .filter((result): result is PromiseFulfilledResult<any> => result.status === "fulfilled")
          .map((result) => result.value)

        if (successfulResults.length > 0) {
          const attachments = successfulResults.map((result) => ({
            type: result.type,
            name: result.name,
            url: result.url,
          }))

          const fileIds = successfulResults.map((result) => result.id)

          await sendMessage("", { guestMode, attachments, fileIds })
        }

        const failedCount = results.filter((result) => result.status === "rejected").length
        if (failedCount > 0) {
          addSystemMessage(`${failedCount} file(s) failed to upload. You can retry them.`)
        }

        setTimeout(() => {
          chatInputRef.current?.focus()
        }, 100)
      } catch (error) {
        console.error("[v0] Multiple file upload error:", error)
        setTimeout(() => {
          chatInputRef.current?.focus()
        }, 100)
      }
    },
    [sendMessage, addSystemMessage, guestMode, chatInputRef],
  )

  return {
    pendingAttachments,
    handleFileUpload,
    handleMultipleFileUpload,
    handleRetryUpload,
    handleRemovePendingAttachment,
  }
}