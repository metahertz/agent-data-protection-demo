import { PageWrapper } from '@/components/layout/PageWrapper'
import { ChatInterface } from '@/components/chat/ChatInterface'

export default function ChatPage() {
  return (
    <PageWrapper title="AI Chat Assistant">
      <div className="flex flex-col" style={{ height: 'calc(100vh - 160px)' }}>
        <ChatInterface isPublic={false} />
      </div>
    </PageWrapper>
  )
}
