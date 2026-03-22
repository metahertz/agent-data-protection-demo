import { ChatInterface } from '@/components/chat/ChatInterface'

export const metadata = {
  title: 'NetGuard Assistant',
  description: 'Network Operations AI Assistant',
}

export default function PublicChatPage() {
  return (
    <div className="flex flex-col h-screen p-4">
      <ChatInterface isPublic={true} />
    </div>
  )
}
