'use client'

import { useState } from 'react'
import { Message, Reaction } from '@/types/database.types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ReactionPicker } from './ReactionPicker'
import { EditMessageDialog } from './EditMessageDialog'
import { formatDate, getInitials } from '@/lib/utils'
import { MoreVertical, Reply, MessageSquare, Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MessageItemProps {
  message: Message
  currentUserId: string
  onReply: (message: Message) => void
  onReact: (messageId: string, emoji: string) => void
  onEdit: (messageId: string, content: string) => void
  onDelete: (messageId: string) => void
  onOpenThread: (message: Message) => void
  isReply?: boolean
}

export function MessageItem({
  message,
  currentUserId,
  onReply,
  onReact,
  onEdit,
  onDelete,
  onOpenThread,
  isReply = false,
}: MessageItemProps) {
  const [showActions, setShowActions] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const isOwn = message.user_id === currentUserId
  const isDeleted = !!message.deleted_at

  const groupedReactions = message.reactions?.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = []
    }
    acc[reaction.emoji].push(reaction)
    return acc
  }, {} as Record<string, Reaction[]>)

  const handleReactionClick = (emoji: string) => {
    const userReaction = message.reactions?.find(
      (r) => r.emoji === emoji && r.user_id === currentUserId
    )
    onReact(message.id, emoji)
  }

  return (
    <div
      className={cn(
        'group relative flex gap-3 px-4 py-2 hover:bg-muted/50 transition-colors',
        isReply && 'pl-12 border-l-2 border-primary/20'
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarImage src={message.profiles?.avatar_url || undefined} />
        <AvatarFallback>
          {getInitials(message.profiles?.username || 'User')}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="font-semibold text-sm">
            {message.profiles?.username || '不明なユーザー'}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatDate(message.created_at)}
          </span>
          {message.edited && !isDeleted && (
            <span className="text-xs text-muted-foreground">(編集済み)</span>
          )}
        </div>

        <div className="text-sm break-words">
          {isDeleted ? (
            <span className="italic text-muted-foreground">
              このメッセージは削除されました
            </span>
          ) : (
            message.content
          )}
        </div>

        {!isDeleted && groupedReactions && Object.keys(groupedReactions).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {Object.entries(groupedReactions).map(([emoji, reactions]) => {
              const hasUserReaction = reactions.some((r) => r.user_id === currentUserId)
              return (
                <Button
                  key={emoji}
                  variant="outline"
                  size="sm"
                  className={cn(
                    'h-7 px-2 text-sm',
                    hasUserReaction && 'bg-primary/10 border-primary'
                  )}
                  onClick={() => handleReactionClick(emoji)}
                >
                  <span className="mr-1">{emoji}</span>
                  <span>{reactions.length}</span>
                </Button>
              )
            })}
          </div>
        )}

        {!isDeleted && message.reply_count !== undefined && message.reply_count > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 h-8 text-xs text-primary"
            onClick={() => onOpenThread(message)}
          >
            <MessageSquare className="h-3 w-3 mr-1" />
            {message.reply_count} 件の返信
          </Button>)}
      </div>

      {!isDeleted && showActions && (
        <div className="absolute right-4 top-2 flex items-center gap-1 bg-background border rounded-md shadow-sm">
          <ReactionPicker onSelect={(emoji) => onReact(message.id, emoji)} />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onReply(message)}
          >
            <Reply className="h-4 w-4" />
          </Button>
          {!isReply && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onOpenThread(message)}
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isOwn && (
                <>
                  <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    編集
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => onDelete(message.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    削除
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <EditMessageDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        initialContent={message.content}
        onSave={(content) => onEdit(message.id, content)}
      />
    </div>
  )
}