import { motion } from "framer-motion";
import { Sparkles, Heart, MessageCircle, Eye, Home, ArrowLeft } from "lucide-react";

interface DreamInterpretation {
  title: string;
  emotion: string;
  symbols: string;
  emotions: string;
  message: string;
  thumbnailUrl: string;
}

interface DreamResultProps {
  interpretation: DreamInterpretation;
  onNewDream: () => void;
  onGoHome: () => void;
}

const DreamResult = ({ interpretation, onNewDream, onGoHome }: DreamResultProps) => {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className="min-h-screen py-12 px-4 bg-gradient-mystic relative"
    >
      {/* Subtle star bg */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-foreground"
            style={{
              width: Math.random() * 2 + 0.5,
              height: Math.random() * 2 + 0.5,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{ opacity: [0.1, 0.5, 0.1] }}
            transition={{ duration: 3 + Math.random() * 3, delay: Math.random() * 3, repeat: Infinity }}
          />
        ))}
      </div>

      <div className="max-w-lg mx-auto relative z-10">
        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={onGoHome}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 text-sm font-display"
        >
          <ArrowLeft className="w-4 h-4" />
          Início
        </motion.button>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl md:text-3xl font-display font-bold text-gradient-gold text-center mb-6"
        >
          ✨ Sua interpretação
        </motion.h2>

        {/* Thumbnail */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl overflow-hidden mb-6 glow-purple"
        >
          <img
            src={interpretation.thumbnailUrl}
            alt={interpretation.title}
            className="w-full aspect-video object-cover"
          />
        </motion.div>

        <h3 className="text-xl font-display font-semibold text-foreground mb-5 text-center">
          {interpretation.title}
        </h3>

        <div className="space-y-4">
          {/* Symbols */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-card rounded-xl p-5 border border-border"
          >
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-4 h-4 text-primary" />
              <h4 className="font-display font-semibold text-foreground text-sm">Significados Simbólicos</h4>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{interpretation.symbols}</p>
          </motion.div>

          {/* Emotions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-card rounded-xl p-5 border border-border"
          >
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-4 h-4 text-mystic" />
              <h4 className="font-display font-semibold text-foreground text-sm">Emoções</h4>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{interpretation.emotions}</p>
          </motion.div>

          {/* Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-gradient-card rounded-xl p-5 border border-border"
          >
            <div className="flex items-center gap-2 mb-2">
              <MessageCircle className="w-4 h-4 text-gold-light" />
              <h4 className="font-display font-semibold text-foreground text-sm">Possível Mensagem</h4>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{interpretation.message}</p>
          </motion.div>
        </div>

        <div className="flex gap-3 mt-8">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={onGoHome}
            className="flex-1 py-3 rounded-lg bg-secondary text-foreground font-display text-sm font-semibold border border-border hover:border-primary/30 transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Voltar ao início
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={onNewDream}
            className="flex-1 py-3 rounded-lg bg-primary text-primary-foreground font-display text-sm font-semibold glow-gold transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Novo sonho
          </motion.button>
        </div>
      </div>
    </motion.section>
  );
};

export default DreamResult;
