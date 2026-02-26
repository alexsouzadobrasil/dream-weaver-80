import { motion } from "framer-motion";
import { Moon, Sparkles } from "lucide-react";

const Star = ({ delay, x, y, size }: { delay: number; x: string; y: string; size: number }) => (
  <motion.div
    className="absolute rounded-full bg-foreground"
    style={{ left: x, top: y, width: size, height: size }}
    animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
    transition={{ duration: 3, delay, repeat: Infinity }}
  />
);

const stars = Array.from({ length: 30 }, (_, i) => ({
  delay: Math.random() * 3,
  x: `${Math.random() * 100}%`,
  y: `${Math.random() * 100}%`,
  size: Math.random() * 3 + 1,
}));

const StarField = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {stars.map((s, i) => (
      <Star key={i} {...s} />
    ))}
  </div>
);

interface HeroSectionProps {
  onStart: () => void;
}

const HeroSection = ({ onStart }: HeroSectionProps) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-mystic">
      <StarField />
      
      {/* Moon glow */}
      <div className="absolute top-20 right-1/4 w-32 h-32 rounded-full bg-foreground/10 blur-3xl animate-float" />
      
      <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="mb-6"
        >
          <Moon className="w-16 h-16 mx-auto text-primary mb-4" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="text-5xl md:text-7xl font-display font-bold text-gradient-gold mb-6"
        >
          Entendo Sonho
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed"
        >
          Descubra os significados ocultos dos seus sonhos.
          <br />
          Interpretação profunda com inteligência artificial.
        </motion.p>

        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          onClick={onStart}
          className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-primary text-primary-foreground font-display text-lg font-semibold glow-gold transition-all"
        >
          <Sparkles className="w-5 h-5" />
          Interpretar meu sonho
        </motion.button>
      </div>
    </section>
  );
};

export default HeroSection;
