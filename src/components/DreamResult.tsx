import { motion } from "framer-motion";
import { Sparkles, Heart, MessageCircle, Eye } from "lucide-react";

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
}

const DreamResult = ({ interpretation, onNewDream }: DreamResultProps) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="py-20 px-4"
    >
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-display font-bold text-gradient-gold text-center mb-10">
          ✨ Sua interpretação
        </h2>

        {/* Thumbnail */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl overflow-hidden mb-8 glow-purple"
        >
          <img
            src={interpretation.thumbnailUrl}
            alt={interpretation.title}
            className="w-full aspect-video object-cover"
          />
        </motion.div>

        <h3 className="text-2xl font-display font-semibold text-foreground mb-6 text-center">
          {interpretation.title}
        </h3>

        <div className="space-y-6">
          {/* Symbols */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-card rounded-xl p-6 border border-border"
          >
            <div className="flex items-center gap-2 mb-3">
              <Eye className="w-5 h-5 text-primary" />
              <h4 className="font-display font-semibold text-foreground">Significados Simbólicos</h4>
            </div>
            <p className="text-muted-foreground leading-relaxed">{interpretation.symbols}</p>
          </motion.div>

          {/* Emotions */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-card rounded-xl p-6 border border-border"
          >
            <div className="flex items-center gap-2 mb-3">
              <Heart className="w-5 h-5 text-mystic" />
              <h4 className="font-display font-semibold text-foreground">Emoções</h4>
            </div>
            <p className="text-muted-foreground leading-relaxed">{interpretation.emotions}</p>
          </motion.div>

          {/* Message */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-gradient-card rounded-xl p-6 border border-border"
          >
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle className="w-5 h-5 text-gold-light" />
              <h4 className="font-display font-semibold text-foreground">Possível Mensagem</h4>
            </div>
            <p className="text-muted-foreground leading-relaxed">{interpretation.message}</p>
          </motion.div>
        </div>

        <div className="text-center mt-10">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={onNewDream}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-secondary text-foreground font-display text-lg font-semibold border border-border hover:border-primary/50 transition-all"
          >
            <Sparkles className="w-5 h-5 text-primary" />
            Interpretar outro sonho
          </motion.button>
        </div>
      </div>
    </motion.section>
  );
};

export default DreamResult;
