import { motion } from "framer-motion";

export interface DreamEntry {
  id: string;
  title: string;
  emotion: string;
  dreamText: string;
  interpretation: string;
  createdAt: string;
}

const emotionColors: Record<string, string> = {
  medo: "hsl(var(--destructive) / 0.25)",
  alegria: "hsl(var(--primary) / 0.25)",
  tristeza: "hsl(200 60% 50% / 0.25)",
  confusao: "hsl(280 50% 55% / 0.25)",
  paz: "hsl(160 50% 45% / 0.25)",
  ansiedade: "hsl(30 70% 50% / 0.25)",
};

const emotionGlow: Record<string, string> = {
  medo: "shadow-[0_0_15px_hsl(var(--destructive)/0.15)]",
  alegria: "shadow-[0_0_15px_hsl(var(--primary)/0.15)]",
  tristeza: "shadow-[0_0_15px_hsl(200_60%_50%/0.15)]",
  confusao: "shadow-[0_0_15px_hsl(280_50%_55%/0.15)]",
  paz: "shadow-[0_0_15px_hsl(160_50%_45%/0.15)]",
  ansiedade: "shadow-[0_0_15px_hsl(30_70%_50%/0.15)]",
};

const emotionEmoji: Record<string, string> = {
  medo: "😨",
  alegria: "😊",
  tristeza: "😢",
  confusao: "🤔",
  paz: "😌",
  ansiedade: "😰",
};

interface DreamHistoryCardProps {
  dream: DreamEntry;
  index: number;
  onClick?: () => void;
  isExiting?: boolean;
}

const DreamHistoryCard = ({ dream, index, onClick, isExiting }: DreamHistoryCardProps) => {
  const blanketColor = emotionColors[dream.emotion] || "hsl(var(--secondary))";

  const formattedDate = (() => {
    try {
      const d = new Date(dream.createdAt);
      return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
    } catch { return ""; }
  })();

  const exitAnim = {
    opacity: 0,
    y: -30,
    scale: 0.95,
    transition: { duration: 0.6, ease: "easeInOut" as const },
  };

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={isExiting ? exitAnim : { opacity: 0, y: -20, transition: { duration: 0.4 } }}
      transition={{ delay: 0.1 * index, duration: 0.5, ease: "easeOut" }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="relative w-full p-4 rounded-2xl bg-secondary/30 border border-border/30 backdrop-blur-md overflow-hidden text-left cursor-pointer transition-shadow duration-200 hover:shadow-[0_0_20px_hsl(var(--primary)/0.12)] hover:border-border/60"
      style={{ willChange: "transform, opacity" }}
    >
      <div className="relative flex items-end gap-3">
        <div className="relative w-20 h-14 flex-shrink-0">
          <svg viewBox="0 0 300 120" className="w-full h-full" fill="none">
            <motion.path
              d="M50 100 Q70 40 130 50 Q180 55 220 70 Q260 82 280 100 Z"
              fill={blanketColor}
              stroke="hsl(var(--border) / 0.4)"
              strokeWidth="1.5"
              animate={{
                d: [
                  "M50 100 Q70 40 130 50 Q180 55 220 70 Q260 82 280 100 Z",
                  "M50 100 Q70 38 130 48 Q180 53 220 68 Q260 80 280 100 Z",
                  "M50 100 Q70 40 130 50 Q180 55 220 70 Q260 82 280 100 Z",
                ],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.circle
              cx="70" cy="50" r="22"
              fill="hsl(var(--muted-foreground) / 0.25)"
              animate={{ cy: [50, 48, 50] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
            <ellipse cx="70" cy="72" rx="35" ry="10" fill="hsl(var(--secondary) / 0.5)" stroke="hsl(var(--border) / 0.2)" strokeWidth="1" />
          </svg>

          {[0, 1].map((i) => (
            <motion.span
              key={i}
              className="absolute text-primary/30 font-display font-bold"
              style={{ left: `${55 + i * 12}%`, bottom: `${50 + i * 20}%`, fontSize: `${8 + i * 2}px` }}
              animate={{ opacity: [0, 0.7, 0], y: [0, -8, -16] }}
              transition={{ duration: 2, delay: i * 0.6, repeat: Infinity }}
            >
              Z
            </motion.span>
          ))}

          {isExiting && (
            <motion.div
              className="absolute left-1/2 -translate-x-1/2 bottom-1/2"
              initial={{ opacity: 0, y: 0 }}
              animate={{ opacity: [0, 0.6, 0.8, 0], y: [0, -10, -25, -45] }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            >
              <div className="w-4 h-6 rounded-full bg-primary/20 blur-sm" />
            </motion.div>
          )}
        </div>

        <div className="flex-1 min-w-0 pb-1">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-base">{emotionEmoji[dream.emotion] || "💭"}</span>
            <span className="text-sm text-muted-foreground/60 capitalize">{dream.emotion}</span>
            {formattedDate && (
              <span className="text-xs text-muted-foreground/40 ml-auto">{formattedDate}</span>
            )}
          </div>
          <p className="text-base text-foreground font-display font-medium truncate">
            {dream.title}
          </p>
        </div>
      </div>
    </motion.button>
  );
};

export default DreamHistoryCard;
