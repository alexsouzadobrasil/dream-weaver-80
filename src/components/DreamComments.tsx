import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, MessageCircle, Trash2 } from "lucide-react";
import { playClick, playSend } from "@/lib/sounds";
import { fetchComments, postComment, deleteComment, type ApiComment } from "@/lib/dreamApi";
import { toast } from "sonner";

interface DreamCommentsProps {
  dreamId: string;
}

const DreamComments = ({ dreamId }: DreamCommentsProps) => {
  const numericDreamId = parseInt(dreamId, 10);
  const isValidId = !isNaN(numericDreamId);

  const [comments, setComments] = useState<ApiComment[]>([]);
  const [text, setText] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [total, setTotal] = useState(0);

  const loadComments = useCallback(async () => {
    if (!isValidId) return;
    setLoading(true);
    try {
      const result = await fetchComments(numericDreamId);
      setComments(result.comments);
      setTotal(result.total);
    } catch {
      // Silently fail — comments are non-critical
    } finally {
      setLoading(false);
    }
  }, [numericDreamId, isValidId]);

  useEffect(() => {
    if (expanded && isValidId && comments.length === 0) {
      loadComments();
    }
  }, [expanded, isValidId, loadComments]);

  const addComment = async () => {
    if (!text.trim() || submitting || !isValidId) return;
    setSubmitting(true);
    playSend();
    try {
      const newComment = await postComment(numericDreamId, text.trim());
      setComments(prev => [...prev, newComment]);
      setTotal(prev => prev + 1);
      setText("");
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar comentário");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: number) => {
    playClick();
    try {
      await deleteComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      setTotal(prev => Math.max(0, prev - 1));
    } catch (err: any) {
      toast.error(err.message || "Erro ao deletar comentário");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addComment();
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
    } catch { return ""; }
  };

  if (!isValidId) return null;

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => { playClick(); setExpanded(!expanded); }}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
      >
        <MessageCircle className="w-4 h-4" />
        {total > 0 ? `${total} comentário${total > 1 ? 's' : ''}` : 'Comentar'}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 overflow-hidden"
          >
            {loading && (
              <p className="text-xs text-muted-foreground/60 text-center py-2">Carregando...</p>
            )}

            {comments.map((c) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-secondary/30 rounded-lg p-3 border border-border/20"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-foreground/80">{c.author_name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground/50">{formatTime(c.created_at)}</span>
                    {c.is_mine && (
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="text-muted-foreground/40 hover:text-destructive transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{c.comment_text}</p>
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
                disabled={!text.trim() || submitting}
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
