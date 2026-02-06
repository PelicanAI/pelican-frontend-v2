import type { Metadata } from "next"
import ChatPageClient from "./page.client"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function ChatPage() {
  return <ChatPageClient />
}
