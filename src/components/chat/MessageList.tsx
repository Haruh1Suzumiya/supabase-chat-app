'use client'

import { useEffect, useRef } from 'react'
import { Message } from '@/types/database.types'
import { MessageItem } from './MessageItem'
import { ScrollArea } from '@/components/ui/scroll-area'

interface MessageListProps {
  messages: Message[]
  currentUserId: string
  onReply: (message: Message) => void
  onReact: (messageId: string, emoji: string) => void
  onEdit: (messageId: string, content: string) => void
  onDelete: (messageId: string) => void
  onOpenThread: (message: Message) => void
  isThread?: boolean
}

export function MessageList({
  messages,
  currentUserId,
  onReply,
  onReact,
  onEdit,
  onDelete,
  onOpenThread,
  isThread = false,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const lastMessageRef = useRef<string>()

  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage.id !== lastMessageRef.current) {
        lastMessageRef.current = lastMessage.id
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <p>メッセージはまだありません</p>
      </div>
    )
  }

  return (
    <ScrollArea className="flex-1">
      <div className="flex flex-col">
        {messages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            currentUserId={currentUserId}
            onReply={onReply}
            onReact={onReact}
            onEdit={onEdit}
            onDelete={onDelete}
            onOpenThread={onOpenThread}
            isReply={isThread}
          />
        ))}
        <div ref={scrollRef} />
      </div>
    </ScrollArea>
  )
}