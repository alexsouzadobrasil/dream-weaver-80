import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Moon, Sparkles } from "lucide-react";

const phases = [
  { text: "Adormecendo...", subtitle: "Sua mente se acalma" },
  { text: "A alma desperta", subtitle: "Elevando-se do corpo" },
  { text: "Deixando a Terra...", subtitle: "Viajando além das nuvens" },
  { text: "Navegando pelo cosmos", subtitle: "Entre estrelas e galáxias" },
  { text: "Decifrando seu sonho", subtitle: "Os símbolos se revelam" },
];

// Star field for space phase
const SpaceStars = () => (
  <div className="absolute inset-0 overflow-hidden">
    {Array.from({ length: 80 }).map((_, i) => (
      <motion.div
        key={i}
        className="absolute rounded-full bg-foreground"
        style={{
          width: Math.random() * 2 + 1,
          height: Math.random() * 2 + 1,
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
        }}
        animate={{
          opacity: [0.2, 1, 0.2],
        }}
        transition={{
          duration: 1.5 + Math.random() * 2,
          delay: Math.random() * 2,
          repeat: Infinity,
        }}
      />
    ))}
  </div>
);

// Warp speed lines
const WarpLines = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {Array.from({ length: 20 }).map((_, i) => {
      const angle = (i / 20) * 360;
      const rad = (angle * Math.PI) / 180;
      return (
        <motion.div
          key={i}
          className="absolute bg-primary/20"
          style={{
            width: 1,
            height: 40,
            left: '50%',
            top: '50%',
            transformOrigin: 'center',
            rotate: `${angle}deg`,
          }}
          animate={{
            height: [0, 80, 0],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: 1.5,
            delay: i * 0.1,
            repeat: Infinity,
            repeatDelay: 1,
          }}
        />
      );
    })}
  </div>
);

// Soul figure ascending
const AscendingSoul = ({ phase }: { phase: number }) => (
  <motion.div className="relative w-20 h-28 mx-auto mb-8">
    {/* Glow aura */}
    <motion.div
      className="absolute -inset-6 rounded-full"
      style={{
        background: 'radial-gradient(circle, hsl(var(--primary) / 0.2) 0%, transparent 70%)',
      }}
      animate={{
        scale: [1, 1.3, 1],
        opacity: [0.3, 0.6, 0.3],
      }}
      transition={{ duration: 3, repeat: Infinity }}
    />

    {/* Soul body */}
    <motion.svg viewBox="0 0 60 90" className="w-full h-full" fill="none">
      {/* Head */}
      <motion.circle
        cx="30" cy="20" r="14"
        fill="hsl(var(--primary) / 0.4)"
        stroke="hsl(var(--primary) / 0.6)"
        strokeWidth="1"
        animate={{ r: [14, 15, 14] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      {/* Body - ethereal */}
      <motion.path
        d="M18 32 Q16 50 20 68 Q28 85 40 68 Q44 50 42 32 Z"
        fill="hsl(var(--primary) / 0.2)"
        stroke="hsl(var(--primary) / 0.4)"
        strokeWidth="1"
        animate={{
          d: [
            "M18 32 Q16 50 20 68 Q28 85 40 68 Q44 50 42 32 Z",
            "M17 32 Q14 52 19 70 Q28 88 41 70 Q46 52 43 32 Z",
            "M18 32 Q16 50 20 68 Q28 85 40 68 Q44 50 42 32 Z",
          ],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.svg>

    {/* Floating particles around soul */}
    {Array.from({ length: 6 }).map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-1 h-1 rounded-full bg-primary/50"
        style={{
          left: `${20 + Math.random() * 60}%`,
          top: `${Math.random() * 100}%`,
        }}
        animate={{
          y: [0, -15, 0],
          opacity: [0.2, 0.8, 0.2],
        }}
        transition={{
          duration: 2 + Math.random() * 2,
          delay: Math.random() * 2,
          repeat: Infinity,
        }}
      />
    ))}
  </motion.div>
);

// Earth leaving view
const EarthView = () => (
  <motion.div
    className="absolute bottom-0 left-1/2 -translate-x-1/2"
    initial={{ scale: 1, y: 0 }}
    animate={{ scale: 0.3, y: 100, opacity: 0 }}
    transition={{ duration: 6, ease: "easeIn" }}
  >
    <div className="w-40 h-40 rounded-full bg-gradient-to-b from-accent/20 to-muted/20 blur-sm" />
  </motion.div>
);

// Progress bar
const ProgressBar = ({ progress }: { progress: number }) => (
  <div className="w-48 h-1 rounded-full bg-secondary overflow-hidden mx-auto mt-6">
    <motion.div
      className="h-full rounded-full bg-primary"
      initial={{ width: 0 }}
      animate={{ width: `${progress}%` }}
      transition={{ duration: 0.5 }}
    />
  </div>
);

const LoadingOverlay = () => {
  const [phase, setPhase] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const phaseInterval = setInterval(() => {
      setPhase((p) => {
        if (p >= phases.length - 1) {
          clearInterval(phaseInterval);
          return p;
        }
        return p + 1;
      });
    }, 2500);

    const progressInterval = setInterval(() => {
      setProgress((p) => Math.min(p + 2, 95));
    }, 250);

    return () => {
      clearInterval(phaseInterval);
      clearInterval(progressInterval);
    };
  }, []);

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden bg-gradient-mystic"
    >
      {/* Space background */}
      <SpaceStars />
      
      {/* Warp effect during space phase */}
      {phase >= 2 && <WarpLines />}

      {/* Earth shrinking away */}
      {phase >= 2 && <EarthView />}

      {/* Nebula glow */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 5, repeat: Infinity }}
      >
        <div className="absolute top-1/3 left-1/3 w-48 h-48 rounded-full bg-accent/10 blur-[80px]" />
        <div className="absolute bottom-1/3 right-1/3 w-36 h-36 rounded-full bg-primary/10 blur-[60px]" />
      </motion.div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Soul ascending */}
        <motion.div
          animate={{ y: phase >= 1 ? [0, -10, 0] : 0 }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <AscendingSoul phase={phase} />
        </motion.div>

        {/* Phase text */}
        <AnimatePresence mode="wait">
          <motion.div
            key={phase}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h3 className="text-xl md:text-2xl font-display font-bold text-gradient-gold mb-2">
              {phases[phase]?.text}
            </h3>
            <p className="text-sm text-muted-foreground">
              {phases[phase]?.subtitle}
            </p>
          </motion.div>
        </AnimatePresence>

        <ProgressBar progress={progress} />

        {/* Sparkle */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          className="mt-6"
        >
          <Sparkles className="w-5 h-5 text-primary/40" />
        </motion.div>
      </div>
    </motion.section>
  );
};

export default LoadingOverlay;
