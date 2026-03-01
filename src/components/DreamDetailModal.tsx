import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import type { DreamEntry } from "./DreamHistoryCard";
import EmojiReactions from "./EmojiReactions";
import DreamComments from "./DreamComments";

const emotionEmoji: Record<string, string> = {
  medo: "😨", alegria: "😊", tristeza: "😢", confusao: "🤔", paz: "😌", ansiedade: "😰",
};

interface DreamDetailModalProps {
  dream: DreamEntry | null;
  onClose: () => void;
}

const DreamDetailModal = ({ dream, onClose }: DreamDetailModalProps) => {
  if (!dream) return null;

  const formattedDate = (() => {
    try {
      return new Date(dream.createdAt).toLocaleDateString("pt-BR", {
        day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
      });
    } catch { return ""; }
  })();

  return (
    <AnimatePresence>
      {dream && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-background/70 backdrop-blur-md"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            className="relative w-[90vw] max-w-2xl h-[90vh] max-h-[90vh] rounded-2xl bg-secondary/40 border border-border/40 backdrop-blur-xl overflow-hidden flex flex-col"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent rounded-full" />

            <button
              onClick={onClose}
              className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-secondary/60 border border-border/40 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex-1 overflow-y-auto p-5 pt-6 space-y-4 scrollbar-thin">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{emotionEmoji[dream.emotion] || "💭"}</span>
                  <span className="text-xs text-muted-foreground/60 capitalize font-display">{dream.emotion}</span>
                  {formattedDate && (
                    <span className="text-xs text-muted-foreground/40 ml-auto">{formattedDate}</span>
                  )}
                </div>
                <h2 className="text-xl md:text-2xl font-display font-bold text-gradient-gold leading-tight">
                  {dream.title}
                </h2>
              </div>

              {/* Reactions */}
              <EmojiReactions dreamId={dream.id} />

              <div className="space-y-1">
                <h3 className="text-xs uppercase tracking-wider text-muted-foreground/50 font-display">📝 Relato</h3>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{dream.dreamText}</p>
              </div>

              <div className="h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />

              <div className="space-y-1">
                <h3 className="text-xs uppercase tracking-wider text-muted-foreground/50 font-display">🌙 Interpretação</h3>
                <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">{dream.interpretation}</p>
              </div>

              {/* Comments */}
              <DreamComments dreamId={dream.id} />

              <div className="h-6" />
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-secondary/40 to-transparent pointer-events-none rounded-b-2xl" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DreamDetailModal;
