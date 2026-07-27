"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Paperclip, Send } from "lucide-react";
import type { Comment, CommentReaction, Profile } from "@/types";
import { addCommentAction, addReactionAction } from "@/services/actions";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { formatRelative } from "@/lib/dates";
import { cn } from "@/lib/utils";

export function DiscussionPanel({
  itemId,
  comments,
  reactions,
  profiles,
  highlightFirstPartner = false,
}: {
  itemId: string;
  comments: Comment[];
  reactions: CommentReaction[];
  profiles: Profile[];
  highlightFirstPartner?: boolean;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const profileMap = Object.fromEntries(profiles.map((p) => [p.id, p]));
  const roots = comments.filter((c) => !c.parent_id);
  const partnerId = profiles[1]?.id;

  const submit = () => {
    if (!body.trim()) return;
    startTransition(async () => {
      await addCommentAction(itemId, body.trim(), replyTo ?? undefined);
      setBody("");
      setReplyTo(null);
      router.refresh();
    });
  };

  return (
    <aside className="flex h-full flex-col rounded-[22px] border border-border bg-card shadow-[0_1px_2px_rgba(36,53,45,0.04)]">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 className="font-display text-2xl text-ink">Discussion</h2>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        {roots.length === 0 ? (
          <p className="text-sm text-muted">No comments yet. Start the conversation.</p>
        ) : (
          roots.map((comment) => {
            const author = profileMap[comment.user_id];
            const replies = comments.filter((c) => c.parent_id === comment.id);
            const commentReactions = reactions.filter((r) => r.comment_id === comment.id);
            const highlight =
              highlightFirstPartner && partnerId && comment.user_id === partnerId;
            return (
              <div key={comment.id} className="space-y-3">
                <CommentBubble
                  authorName={author?.full_name ?? "Partner"}
                  body={comment.body}
                  createdAt={comment.created_at}
                  edited={Boolean(comment.edited_at)}
                  highlight={Boolean(highlight)}
                  reactions={commentReactions}
                  onReply={() => setReplyTo(comment.id)}
                  onReact={(emoji) =>
                    startTransition(async () => {
                      await addReactionAction(comment.id, emoji, itemId);
                      router.refresh();
                    })
                  }
                />
                {replies.map((reply) => {
                  const replyAuthor = profileMap[reply.user_id];
                  return (
                    <div key={reply.id} className="ml-8">
                      <CommentBubble
                        authorName={replyAuthor?.full_name ?? "Partner"}
                        body={reply.body}
                        createdAt={reply.created_at}
                        edited={Boolean(reply.edited_at)}
                        reactions={reactions.filter((r) => r.comment_id === reply.id)}
                        onReply={() => setReplyTo(reply.id)}
                        onReact={(emoji) =>
                          startTransition(async () => {
                            await addReactionAction(reply.id, emoji, itemId);
                            router.refresh();
                          })
                        }
                      />
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </div>

      <div className="border-t border-border p-4">
        {replyTo ? (
          <p className="mb-2 text-xs text-muted">
            Replying…{" "}
            <button type="button" className="text-clay underline" onClick={() => setReplyTo(null)}>
              Cancel
            </button>
          </p>
        ) : null}
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Share your thoughts, ask a question, or @partner…"
          className="min-h-[88px]"
        />
        <div className="mt-3 flex items-center justify-between gap-2">
          <Button variant="secondary" size="sm" type="button" disabled>
            <Paperclip className="h-4 w-4" />
            Attach
          </Button>
          <Button size="sm" onClick={submit} disabled={pending || !body.trim()}>
            <Send className="h-4 w-4" />
            Post comment
          </Button>
        </div>
      </div>
    </aside>
  );
}

function CommentBubble({
  authorName,
  body,
  createdAt,
  edited,
  highlight,
  reactions,
  onReply,
  onReact,
}: {
  authorName: string;
  body: string;
  createdAt: string;
  edited: boolean;
  highlight?: boolean;
  reactions: CommentReaction[];
  onReply: () => void;
  onReact: (emoji: string) => void;
}) {
  const grouped = reactions.reduce<Record<string, number>>((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className={cn("rounded-[16px] p-3", highlight ? "bg-pale-sage/70" : "bg-transparent")}>
      <div className="flex items-start gap-3">
        <Avatar name={authorName} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-sm font-semibold text-ink">{authorName}</span>
            <span className="text-xs text-muted">{formatRelative(createdAt)}</span>
            {edited ? <span className="text-xs text-muted">(edited)</span> : null}
          </div>
          <p className="mt-1 text-[15px] leading-relaxed text-ink">{body}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {Object.entries(grouped).map(([emoji, count]) => (
              <button
                key={emoji}
                type="button"
                onClick={() => onReact(emoji)}
                className="rounded-full bg-page px-2 py-0.5 text-xs"
              >
                {emoji} {count}
              </button>
            ))}
            <button
              type="button"
              className="text-xs text-muted hover:text-ink"
              onClick={() => onReact("❤️")}
            >
              ❤️
            </button>
            <button
              type="button"
              className="text-xs text-muted hover:text-ink"
              onClick={() => onReact("👍")}
            >
              👍
            </button>
            <button type="button" className="text-xs font-medium text-clay" onClick={onReply}>
              Reply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
