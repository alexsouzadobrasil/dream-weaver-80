import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, MessageCircle } from "lucide-react";
import { playClick, playSend } from "@/lib/sounds";
import EmojiReactions from "./EmojiReactions";

interface Comment {
  id: string;
  text: string;
  author: string;
  createdAt: string;
  reactions?: Record<string, number>;
}

interface DreamCommentsProps {
  dreamId: string;
}

const DreamComments = ({ dreamId }: DreamCommentsProps) => {
  const storageKey = `comments_${dreamId}`;

  const [comments, setComments] = useState<Comment[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "[]");
    } catch { return []; }
  });

  const [text, setText] = useState("");
  const [expanded, setExpanded] = useState(false);

  const addComment = () => {
    if (!text.trim()) return;
    playSend();
    const comment: Comment = {
      id: Date.now().toString(),
      text: text.trim(),
      author: "Você",
      createdAt: new Date().toISOString(),
    };
    const updated = [...comments, comment];
    setComments(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
    setText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addComment();
    }
  };

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
    } catch { return ""; }
  };

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => { playClick(); setExpanded(!expanded); }}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
      >
        <MessageCircle className="w-4 h-4" />
        {comments.length > 0 ? `${comments.length} comentário${comments.length > 1 ? 's' : ''}` : 'Comentar'}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 overflow-hidden"
          >
            {/* Existing comments */}
            {comments.map((c) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-secondary/30 rounded-lg p-3 border border-border/20"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-foreground/80">{c.author}</span>
                  <span className="text-xs text-muted-foreground/50">{formatTime(c.createdAt)}</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{c.text}</p>
                <EmojiReactions dreamId={`comment_${c.id}`} compact />
              </motion.div>
            ))}

            {/* Input */}
            <div className="flex gap-2 items-end">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Compartilhe sua experiência..."
                rows={2}
                className="flex-1 px-3 py-2 rounded-lg bg-secondary/50 border border-border/30 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/40 resize-none"
              />
              <motion.button
                type="button"
                whileTap={{ scale: 0.9 }}
                onClick={addComment}
                disabled={!text.trim()}
                className="p-2.5 rounded-lg bg-primary text-primary-foreground disabled:opacity-30 transition-opacity"
              >
                <Send className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DreamComments;
