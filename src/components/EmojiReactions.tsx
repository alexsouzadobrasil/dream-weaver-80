import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { playClick } from "@/lib/sounds";

const REACTIONS = [
  { emoji: "❤️", label: "Amor" },
  { emoji: "😢", label: "Triste" },
  { emoji: "😮", label: "Surpreso" },
  { emoji: "🙏", label: "Gratidão" },
  { emoji: "✨", label: "Mágico" },
  { emoji: "😨", label: "Medo" },
];

interface EmojiReactionsProps {
  dreamId: string;
  compact?: boolean;
}

interface ReactionData {
  [emoji: string]: number;
}

const EmojiReactions = ({ dreamId, compact }: EmojiReactionsProps) => {
  const storageKey = `reactions_${dreamId}`;
  const myKey = `my_reactions_${dreamId}`;

  const [reactions, setReactions] = useState<ReactionData>(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "{}");
    } catch { return {}; }
  });

  const [myReactions, setMyReactions] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(myKey) || "[]");
    } catch { return []; }
  });

  const [showBurst, setShowBurst] = useState<string | null>(null);

  const toggleReaction = (emoji: string) => {
    playClick();
    const alreadyReacted = myReactions.includes(emoji);
    const newMy = alreadyReacted ? myReactions.filter(e => e !== emoji) : [...myReactions, emoji];
    const newReactions = { ...reactions };
    newReactions[emoji] = (newReactions[emoji] || 0) + (alreadyReacted ? -1 : 1);
    if (newReactions[emoji] <= 0) delete newReactions[emoji];

    setMyReactions(newMy);
    setReactions(newReactions);
    localStorage.setItem(storageKey, JSON.stringify(newReactions));
    localStorage.setItem(myKey, JSON.stringify(newMy));

    if (!alreadyReacted) {
      setShowBurst(emoji);
      setTimeout(() => setShowBurst(null), 600);
    }
  };

  return (
    <div className={`flex flex-wrap gap-1.5 ${compact ? '' : 'mt-3'}`}>
      {REACTIONS.map(({ emoji, label }) => {
        const count = reactions[emoji] || 0;
        const isActive = myReactions.includes(emoji);
        return (
          <motion.button
            key={emoji}
            type="button"
            whileTap={{ scale: 0.85 }}
            onClick={() => toggleReaction(emoji)}
            className={`relative flex items-center gap-1 px-2.5 py-1.5 rounded-full text-sm transition-all ${
              isActive
                ? 'bg-primary/20 border border-primary/40'
                : 'bg-secondary/50 border border-border/30 hover:border-border/60'
            }`}
            title={label}
          >
            <span className="text-base">{emoji}</span>
            {count > 0 && <span className="text-xs text-muted-foreground">{count}</span>}
            <AnimatePresence>
              {showBurst === emoji && (
                <motion.span
                  className="absolute -top-3 left-1/2 -translate-x-1/2 text-lg pointer-events-none"
                  initial={{ opacity: 1, y: 0, scale: 1 }}
                  animate={{ opacity: 0, y: -16, scale: 1.5 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  {emoji}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        );
      })}
    </div>
  );
};

export default EmojiReactions;
