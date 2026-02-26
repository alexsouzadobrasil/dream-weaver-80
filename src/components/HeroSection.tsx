import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Moon, Sparkles, Star } from "lucide-react";

// Animated star component
const AnimatedStar = ({ delay, x, y, size }: { delay: number; x: string; y: string; size: number }) => (
  <motion.div
    className="absolute rounded-full bg-foreground"
    style={{ left: x, top: y, width: size, height: size }}
    animate={{ opacity: [0, 1, 0.3, 1, 0], scale: [0.5, 1.3, 0.8, 1.2, 0.5] }}
    transition={{ duration: 4 + Math.random() * 3, delay, repeat: Infinity }}
  />
);

// Shooting star
const ShootingStar = ({ delay }: { delay: number }) => (
  <motion.div
    className="absolute w-1 h-1 bg-primary rounded-full"
    style={{ top: `${Math.random() * 40}%`, left: `${Math.random() * 60 + 20}%` }}
    initial={{ opacity: 0, x: 0, y: 0 }}
    animate={{
      opacity: [0, 1, 1, 0],
      x: [0, -150, -300],
      y: [0, 80, 160],
    }}
    transition={{ duration: 1.5, delay, repeat: Infinity, repeatDelay: 8 + Math.random() * 6 }}
  >
    <div className="w-16 h-[1px] bg-gradient-to-r from-primary/80 to-transparent absolute right-0 top-1/2 -translate-y-1/2" />
  </motion.div>
);

const stars = Array.from({ length: 50 }, (_, i) => ({
  delay: Math.random() * 5,
  x: `${Math.random() * 100}%`,
  y: `${Math.random() * 100}%`,
  size: Math.random() * 3 + 0.5,
}));

// Floating particles (cosmic dust)
const CosmicDust = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {Array.from({ length: 20 }).map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-1 h-1 rounded-full bg-primary/30"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
        }}
        animate={{
          y: [0, -30, 0],
          x: [0, Math.random() * 20 - 10, 0],
          opacity: [0.1, 0.5, 0.1],
        }}
        transition={{
          duration: 5 + Math.random() * 5,
          delay: Math.random() * 5,
          repeat: Infinity,
        }}
      />
    ))}
  </div>
);

// Person sleeping silhouette (SVG-based)
const SleepingSilhouette = () => (
  <motion.div
    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[280px] md:max-w-[320px]"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 2 }}
  >
    {/* Bed / ground */}
    <div className="relative">
      {/* Sleeping person shape */}
      <svg viewBox="0 0 300 120" className="w-full" fill="none">
        {/* Body under blanket */}
        <motion.path
          d="M50 100 Q70 40 130 50 Q180 55 220 70 Q260 82 280 100 Z"
          fill="hsl(var(--secondary))"
          stroke="hsl(var(--border))"
          strokeWidth="1"
          animate={{ d: [
            "M50 100 Q70 40 130 50 Q180 55 220 70 Q260 82 280 100 Z",
            "M50 100 Q70 38 130 48 Q180 53 220 68 Q260 80 280 100 Z",
            "M50 100 Q70 40 130 50 Q180 55 220 70 Q260 82 280 100 Z",
          ]}}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Head */}
        <motion.circle
          cx="70" cy="50" r="22"
          fill="hsl(var(--muted-foreground) / 0.4)"
          animate={{ cy: [50, 48, 50] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Pillow */}
        <ellipse cx="70" cy="72" rx="35" ry="10" fill="hsl(var(--secondary))" stroke="hsl(var(--border))" strokeWidth="1" />
      </svg>

      {/* Zzz animation */}
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="absolute text-primary/60 font-display font-bold"
          style={{ left: `${25 + i * 8}%`, bottom: `${60 + i * 15}%`, fontSize: `${12 + i * 4}px` }}
          animate={{
            opacity: [0, 1, 0],
            y: [0, -20, -40],
            x: [0, 5, 10],
          }}
          transition={{ duration: 2.5, delay: i * 0.8, repeat: Infinity }}
        >
          Z
        </motion.span>
      ))}
    </div>
  </motion.div>
);

// Soul/spirit rising animation
const SoulRising = () => (
  <motion.div
    className="absolute bottom-[30%] left-1/2 -translate-x-1/2 pointer-events-none"
    initial={{ opacity: 0, y: 40 }}
    animate={{ opacity: [0, 0.6, 0.8, 0.4, 0], y: [40, 0, -60, -140, -250] }}
    transition={{ duration: 6, delay: 3, repeat: Infinity, repeatDelay: 4 }}
  >
    <div className="relative">
      {/* Soul glow */}
      <div className="w-16 h-24 rounded-full bg-primary/20 blur-xl absolute -inset-4" />
      {/* Soul figure */}
      <svg viewBox="0 0 60 90" width="48" height="72" className="opacity-60">
        <ellipse cx="30" cy="18" rx="12" ry="14" fill="hsl(var(--primary) / 0.3)" />
        <path d="M20 30 Q18 50 22 70 Q30 85 38 70 Q42 50 40 30 Z" fill="hsl(var(--primary) / 0.2)" />
      </svg>
    </div>
  </motion.div>
);

// Planet/cosmic object
const CosmicOrb = ({ size, color, x, y, delay }: { size: number; color: string; x: string; y: string; delay: number }) => (
  <motion.div
    className="absolute rounded-full"
    style={{
      width: size, height: size, left: x, top: y,
      background: `radial-gradient(circle at 35% 35%, ${color}, transparent)`,
    }}
    animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.7, 0.4] }}
    transition={{ duration: 5, delay, repeat: Infinity }}
  />
);

interface HeroSectionProps {
  onStart: () => void;
  lastDream?: { title: string; emotion: string } | null;
}

const HeroSection = ({ onStart, lastDream }: HeroSectionProps) => {
  const [scene, setScene] = useState(0);

  // Auto-advance scene for cinematic effect
  useEffect(() => {
    const timer = setInterval(() => {
      setScene((s) => (s + 1) % 3);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-gradient-mystic">
      {/* Star field */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {stars.map((s, i) => (
          <AnimatedStar key={i} {...s} />
        ))}
        <ShootingStar delay={2} />
        <ShootingStar delay={7} />
        <ShootingStar delay={13} />
      </div>

      <CosmicDust />

      {/* Cosmic orbs */}
      <CosmicOrb size={120} color="hsl(260 50% 55% / 0.15)" x="10%" y="15%" delay={0} />
      <CosmicOrb size={80} color="hsl(43 80% 55% / 0.1)" x="75%" y="25%" delay={2} />
      <CosmicOrb size={60} color="hsl(200 60% 50% / 0.1)" x="85%" y="60%" delay={4} />

      {/* Nebula effect */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 10, repeat: Infinity }}
      >
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-accent/5 blur-[100px]" />
        <div className="absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full bg-primary/5 blur-[80px]" />
      </motion.div>

      {/* Moon */}
      <motion.div
        className="absolute top-12 right-8 md:top-20 md:right-1/4"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="relative">
          <div className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-foreground/10 blur-2xl absolute -inset-4" />
          <Moon className="w-14 h-14 md:w-20 md:h-20 text-primary/70" />
        </div>
      </motion.div>

      {/* Sleeping person & soul */}
      <SleepingSilhouette />
      <SoulRising />

      {/* Main content */}
      <div className="relative z-10 text-center px-6 max-w-lg mx-auto mb-32">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2 }}
          className="text-4xl md:text-6xl font-display font-bold text-gradient-gold mb-4"
        >
          Entendo Sonho
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="text-base md:text-lg text-muted-foreground mb-8 leading-relaxed"
        >
          Sua alma viaja enquanto você dorme.
          <br />
          Descubra o que o universo tem a dizer.
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

        {/* Last dream preview */}
        {lastDream && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="mt-8 p-4 rounded-xl bg-secondary/50 border border-border/50 backdrop-blur-sm"
          >
            <p className="text-xs text-muted-foreground mb-1">Último sonho interpretado</p>
            <p className="text-sm text-foreground font-display">{lastDream.title}</p>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default HeroSection;
