import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const ChatMessage = ({ message, isOwn, showAvatar = true, onReply, onDelete }) => {
  const bubbleBg = isOwn
    ? 'bg-emerald-500 text-white'
    : 'bg-slate-800 text-slate-200 dark:bg-[#0b1220] dark:text-slate-200';
  const bubbleBorder = isOwn ? 'border-emerald-600' : 'border-border/70 dark:border-white/10';

  return (
    <div className={cn('group mb-3 flex items-end gap-3', isOwn ? 'justify-end' : 'justify-start')}>
      {!isOwn && showAvatar && (
        <Avatar className="mb-1 h-10 w-10 border border-border/70 shadow-sm">
          <AvatarImage src={message.sender?.avatar} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">{(message.sender?.fullName || 'U').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}</AvatarFallback>
        </Avatar>
      )}

      <div className={cn('relative max-w-[78%]') }>
        <div className={cn('rounded-2xl px-4 py-3 shadow-sm border', bubbleBorder, bubbleBg)}>
          {message.replyTo && (
            <div className="mb-2 rounded-xl border border-primary/15 bg-primary/5 px-3 py-2 text-xs">
              <div className="font-medium text-primary">Replying to @{message.replyTo?.sender?.userName || 'user'}</div>
              <div className="mt-1 line-clamp-2 text-muted-foreground">{message.replyTo?.isDeleted ? 'Deleted message' : message.replyTo?.content}</div>
            </div>
          )}

          {message.image && (
            <img src={message.image} alt="Shared" className="mb-2 max-h-60 w-full rounded-[0.9rem] object-cover" />
          )}

          {message.isDeleted ? (
            <p className="text-sm italic opacity-70">Message deleted</p>
          ) : (
            message.content && <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>
          )}
        </div>

        {/* tail */}
        <div
          aria-hidden
          className={cn(
            'absolute -bottom-1 w-3 h-3 rotate-45',
            isOwn
              ? 'right-2 bg-emerald-500 border-emerald-600'
              : 'left-3 bg-slate-800 border-border/70 dark:bg-[#0b1220] dark:border-white/10'
          )}
          style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.02) inset' }}
        />

        <div className={cn('mt-1 flex items-center gap-2 text-[11px] text-muted-foreground', isOwn && 'justify-end') }>
          <span>{formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}</span>
          {isOwn && !message.isDeleted && <span className="text-xs opacity-80">✓✓</span>}
          {!message.isDeleted && (
            <button onClick={() => onReply?.(message)} className="opacity-0 group-hover:opacity-100 hover:text-primary">Reply</button>
          )}
          {isOwn && !message.isDeleted && (
            <button onClick={() => onDelete?.(message._id)} className="opacity-0 group-hover:opacity-100 hover:text-destructive">Delete</button>
          )}
        </div>
      </div>

      {isOwn && (
        <div className="shrink-0" style={{ width: 40 }} />
      )}
    </div>
  );
};

export default ChatMessage;
