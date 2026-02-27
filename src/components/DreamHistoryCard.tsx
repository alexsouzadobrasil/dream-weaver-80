import { motion } from "framer-motion";

interface DreamHistoryCardProps {
  title: string;
  emotion: string;
  index: number;
  onClick?: () => void;
}

const emotionColors: Record<string, string> = {
  medo: "hsl(var(--destructive) / 0.3)",
  alegria: "hsl(var(--primary) / 0.3)",
  tristeza: "hsl(200 60% 50% / 0.3)",
  confusao: "hsl(280 50% 55% / 0.3)",
  paz: "hsl(160 50% 45% / 0.3)",
  ansiedade: "hsl(30 70% 50% / 0.3)",
};

const emotionEmoji: Record<string, string> = {
  medo: "😨",
  alegria: "😊",
  tristeza: "😢",
  confusao: "🤔",
  paz: "😌",
  ansiedade: "😰",
};

const DreamHistoryCard = ({ title, emotion, index, onClick }: DreamHistoryCardProps) => {
  const blanketColor = emotionColors[emotion] || "hsl(var(--secondary))";

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 * index, duration: 0.5 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className="relative w-full p-3 rounded-2xl bg-secondary/40 border border-border/40 backdrop-blur-sm overflow-hidden text-left"
    >
      {/* Mini sleeping silhouette */}
      <div className="relative flex items-end gap-3">
        <div className="relative w-20 h-14 flex-shrink-0">
          <svg viewBox="0 0 300 120" className="w-full h-full" fill="none">
            <motion.path
              d="M50 100 Q70 40 130 50 Q180 55 220 70 Q260 82 280 100 Z"
              fill={blanketColor}
              stroke="hsl(var(--border) / 0.5)"
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
              cx="70"
              cy="50"
              r="22"
              fill="hsl(var(--muted-foreground) / 0.3)"
              animate={{ cy: [50, 48, 50] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
            <ellipse
              cx="70"
              cy="72"
              rx="35"
              ry="10"
              fill="hsl(var(--secondary) / 0.6)"
              stroke="hsl(var(--border) / 0.3)"
              strokeWidth="1"
            />
          </svg>

          {/* Mini Zzz */}
          {[0, 1].map((i) => (
            <motion.span
              key={i}
              className="absolute text-primary/40 font-display font-bold"
              style={{
                left: `${55 + i * 12}%`,
                bottom: `${50 + i * 20}%`,
                fontSize: `${7 + i * 2}px`,
              }}
              animate={{
                opacity: [0, 0.8, 0],
                y: [0, -8, -16],
              }}
              transition={{ duration: 2, delay: i * 0.6, repeat: Infinity }}
            >
              Z
            </motion.span>
          ))}
        </div>

        <div className="flex-1 min-w-0 pb-1">
          <p className="text-xs text-muted-foreground/70 mb-0.5 flex items-center gap-1">
            <span>{emotionEmoji[emotion] || "💭"}</span>
            <span className="capitalize">{emotion}</span>
          </p>
          <p className="text-sm text-foreground font-display font-medium truncate">
            {title}
          </p>
        </div>
      </div>
    </motion.button>
  );
};

export default DreamHistoryCard;
