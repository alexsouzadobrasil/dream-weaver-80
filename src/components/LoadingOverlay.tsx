import { motion } from "framer-motion";
import { Loader2, Moon, Sparkles, Stars } from "lucide-react";

const messages = [
  "Conectando com o mundo dos sonhos...",
  "Analisando símbolos ocultos...",
  "Decifrando significados...",
  "Gerando sua interpretação...",
];

const LoadingOverlay = () => {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="py-32 px-4 flex flex-col items-center justify-center"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        className="mb-8"
      >
        <Moon className="w-16 h-16 text-primary" />
      </motion.div>

      <div className="space-y-4 text-center">
        {messages.map((msg, i) => (
          <motion.p
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 1, 0] }}
            transition={{
              duration: 3,
              delay: i * 3,
              repeat: Infinity,
              repeatDelay: messages.length * 3 - 3,
            }}
            className="text-muted-foreground font-body text-lg absolute"
            style={{ position: i === 0 ? "relative" : "absolute" }}
          >
            {msg}
          </motion.p>
        ))}
      </div>

      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="mt-8"
      >
        <Sparkles className="w-6 h-6 text-primary/60" />
      </motion.div>
    </motion.section>
  );
};

export default LoadingOverlay;
