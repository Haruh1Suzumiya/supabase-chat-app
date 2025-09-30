'use client'

import { useEffect, useState } from 'react'
import { Message } from '@/types/database.types'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { ThreadView } from './ThreadView'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { supabase, signOut } from '@/lib/supabase'
import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ChatContainerProps {
  userId: string
  username: string
}

export function ChatContainer({ userId, username }: ChatContainerProps) {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [threadOpen, setThreadOpen] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)

  useEffect(() => {
    loadMessages()
    subscribeToMessages()
  }, [])

  const loadMessages = async () => {
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
        .is('parent_id', null)
        .is('deleted_at', null)
        .order('created_at', { ascending: true })

      if (error) throw error

      // Get reply counts for each message
      const messagesWithCounts = await Promise.all(
        (data || []).map(async (message) => {
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('parent_id', message.id)
            .is('deleted_at', null)

          return { ...message, reply_count: count || 0 }
        })
      )

      setMessages(messagesWithCounts)
    } catch (error) {
      console.error('Error loading messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const subscribeToMessages = () => {
    const channel = supabase
      .channel('public:messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        () => {
          loadMessages()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reactions',
        },
        () => {
          loadMessages()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const handleSendMessage = async (content: string) => {
    try {
      const messageData: any = {
        content,
        user_id: userId,
      }

      if (replyingTo) {
        messageData.parent_id = replyingTo.id
        messageData.thread_id = replyingTo.thread_id || replyingTo.id
      }

      const { error } = await supabase.from('messages').insert(messageData)

      if (error) throw error
      setReplyingTo(null)
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const handleReact = async (messageId: string, emoji: string) => {
    try {
      // Check if user already reacted with this emoji
      const { data: existing } = await supabase
        .from('reactions')
        .select('id')
        .eq('message_id', messageId)
        .eq('user_id', userId)
        .eq('emoji', emoji)
        .single()

      if (existing) {
        // Remove reaction
        const { error } = await supabase
          .from('reactions')
          .delete()
          .eq('id', existing.id)

        if (error) throw error
      } else {
        // Add reaction
        const { error } = await supabase.from('reactions').insert({
          message_id: messageId,
          user_id: userId,
          emoji,
        })

        if (error) throw error
      }
    } catch (error) {
      console.error('Error reacting to message:', error)
    }
  }

  const handleEdit = async (messageId: string, content: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({
          content,
          edited: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', messageId)
        .eq('user_id', userId)

      if (error) throw error
    } catch (error) {
      console.error('Error editing message:', error)
    }
  }

  const handleDelete = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({
          deleted_at: new Date().toISOString(),
        })
        .eq('id', messageId)
        .eq('user_id', userId)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting message:', error)
    }
  }

  const handleReply = (message: Message) => {
    setReplyingTo(message)
  }

  const handleOpenThread = (message: Message) => {
    setSelectedMessage(message)
    setThreadOpen(true)
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <div className="h-screen flex flex-col">
      <header className="border-b bg-background px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">チャット</h1>
          <p className="text-sm text-muted-foreground">
            ログイン中: {username}
          </p>
        </div>
        <Button variant="outline" onClick={handleSignOut}>
          <LogOut className="h-4 w-4 mr-2" />
          ログアウト
        </Button>
      </header>

      <div className="flex-1 flex flex-col overflow-hidden">
        {replyingTo && (
          <div className="px-4 py-2 bg-muted/50 border-b flex items-center justify-between">
            <div className="text-sm">
              <span className="text-muted-foreground">返信先: </span>
              <span className="font-medium">{replyingTo.profiles?.username}</span>
              <span className="ml-2 text-muted-foreground">
                {replyingTo.content.substring(0, 50)}
                {replyingTo.content.length > 50 ? '...' : ''}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyingTo(null)}
            >
              キャンセル
            </Button>
          </div>
        )}

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">読み込み中...</p>
          </div>
        ) : (
          <MessageList
            messages={messages}
            currentUserId={userId}
            onReply={handleReply}
            onReact={handleReact}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onOpenThread={handleOpenThread}
          />
        )}

        <MessageInput
          onSend={handleSendMessage}
          placeholder={
            replyingTo
              ? `${replyingTo.profiles?.username} に返信...`
              : 'メッセージを入力...'
          }
        />
      </div>

      <ThreadView
        open={threadOpen}
        onOpenChange={setThreadOpen}
        parentMessage={selectedMessage}
        currentUserId={userId}
        onReply={handleReply}
        onReact={handleReact}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  )
}