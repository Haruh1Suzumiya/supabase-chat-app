'use client'

import { useEffect, useState } from 'react'
import { Message } from '@/types/database.types'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { MessageItem } from './MessageItem'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { supabase } from '@/lib/supabase'

interface ThreadViewProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  parentMessage: Message | null
  currentUserId: string
  onReply: (message: Message) => void
  onReact: (messageId: string, emoji: string) => void
  onEdit: (messageId: string, content: string) => void
  onDelete: (messageId: string) => void
}

export function ThreadView({
  open,
  onOpenChange,
  parentMessage,
  currentUserId,
  onReply,
  onReact,
  onEdit,
  onDelete,
}: ThreadViewProps) {
  const [threadMessages, setThreadMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && parentMessage) {
      loadThreadMessages()
      subscribeToThread()
    }
  }, [open, parentMessage])

  const loadThreadMessages = async () => {
    if (!parentMessage) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          profiles (*),
          reactions (
            *,
            profiles (*)
          )
        `)
        .eq('parent_id', parentMessage.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: true })

      if (error) throw error
      setThreadMessages(data || [])
    } catch (error) {
      console.error('Error loading thread messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const subscribeToThread = () => {
    if (!parentMessage) return

    const channel = supabase
      .channel(`thread:${parentMessage.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `parent_id=eq.${parentMessage.id}`,
        },
        () => {
          loadThreadMessages()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const handleSendReply = async (content: string) => {
    if (!parentMessage) return

    try {
      const { error } = await supabase.from('messages').insert({
        content,
        user_id: currentUserId,
        parent_id: parentMessage.id,
        thread_id: parentMessage.thread_id || parentMessage.id,
      })

      if (error) throw error
    } catch (error) {
      console.error('Error sending reply:', error)
    }
  }

  if (!parentMessage) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle>スレッド</SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="px-4 py-4 border-b bg-muted/30">
            <MessageItem
              message={parentMessage}
              currentUserId={currentUserId}
              onReply={onReply}
              onReact={onReact}
              onEdit={onEdit}
              onDelete={onDelete}
              onOpenThread={() => {}}
              isReply={false}
            />
          </div>

          <div className="flex flex-col">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">読み込み中...</p>
              </div>
            ) : threadMessages.length > 0 ? (
              threadMessages.map((message) => (
                <MessageItem
                  key={message.id}
                  message={message}
                  currentUserId={currentUserId}
                  onReply={onReply}
                  onReact={onReact}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onOpenThread={() => {}}
                  isReply={true}
                />
              ))
            ) : (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <p>返信はまだありません</p>
              </div>
            )}
          </div>
        </ScrollArea>

        <MessageInput
          onSend={handleSendReply}
          placeholder="返信を入力..."
        />
      </SheetContent>
    </Sheet>
  )
}