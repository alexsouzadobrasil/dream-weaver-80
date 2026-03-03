import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { playClick } from "@/lib/sounds";
import { toggleReaction, fetchReactions } from "@/lib/dreamApi";

interface EmojiReactionsProps {
  dreamId: string;
  compact?: boolean;
}

const EmojiReactions = ({ dreamId, compact }: EmojiReactionsProps) => {
  const numericId = parseInt(dreamId, 10);
  const isValid = !isNaN(numericId);

  const [totalReactions, setTotalReactions] = useState(0);
  const [positiveReactions, setPositiveReactions] = useState(0);
  const [myReaction, setMyReaction] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isValid) return;
    fetchReactions(numericId)
      .then(data => {
        setTotalReactions(data.total_reactions);
        setPositiveReactions(data.positive_reactions);
        setMyReaction(data.my_reaction);
      })
      .catch(() => {});
  }, [numericId, isValid]);

  const handleToggle = async (type: 'like' | 'dislike') => {
    if (!isValid || loading) return;
    playClick();
    setLoading(true);
    try {
      const result = await toggleReaction(numericId, type);
      setTotalReactions(result.total_reactions);
      setPositiveReactions(result.positive_reactions);
      setMyReaction(result.my_reaction);
    } catch {}
    setLoading(false);
  };

  if (!isValid) return null;

  const negativeReactions = totalReactions - positiveReactions;

  return (
    <div className={`flex items-center gap-2 ${compact ? '' : 'mt-3'}`}>
      <motion.button
        type="button"
        whileTap={{ scale: 0.85 }}
        onClick={() => handleToggle('like')}
        disabled={loading}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all ${
          myReaction === 'like'
            ? 'bg-primary/20 border border-primary/40 text-primary'
            : 'bg-secondary/50 border border-border/30 hover:border-border/60 text-muted-foreground'
        }`}
      >
        <ThumbsUp className="w-4 h-4" />
        {positiveReactions > 0 && <span className="text-xs">{positiveReactions}</span>}
      </motion.button>

      <motion.button
        type="button"
        whileTap={{ scale: 0.85 }}
        onClick={() => handleToggle('dislike')}
        disabled={loading}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all ${
          myReaction === 'dislike'
            ? 'bg-destructive/20 border border-destructive/40 text-destructive'
            : 'bg-secondary/50 border border-border/30 hover:border-border/60 text-muted-foreground'
        }`}
      >
        <ThumbsDown className="w-4 h-4" />
        {negativeReactions > 0 && <span className="text-xs">{negativeReactions}</span>}
      </motion.button>
    </div>
  );
};

export default EmojiReactions;
