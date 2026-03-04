import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import DreamForm from "./DreamForm";
import { playClick } from "@/lib/sounds";

interface DreamFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitAudio: (blob: Blob) => void;
  onSubmitText: (text: string) => void;
  isLoading: boolean;
}

const FloatingParticle = ({ delay, x, y }: { delay: number; x: string; y: string }) => (
  <motion.div
    className="absolute w-1 h-1 rounded-full bg-primary/30"
    style={{ left: x, top: y }}
    animate={{
      y: [0, -30, 0],
      opacity: [0, 0.8, 0],
      scale: [0.5, 1.2, 0.5],
    }}
    transition={{ duration: 3 + Math.random() * 2, repeat: Infinity, delay, ease: "easeInOut" }}
  />
);

const DreamFormModal = ({ isOpen, onClose, onSubmitAudio, onSubmitText, isLoading }: DreamFormModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { playClick(); onClose(); }}
          />

          {/* Modal content */}
          <motion.div
            className="relative w-full max-w-lg mx-auto overflow-hidden rounded-2xl border border-primary/20 shadow-[0_0_60px_hsl(var(--primary)/0.15)]"
            style={{ maxHeight: "90vh" }}
            initial={{ opacity: 0, scale: 0.85, y: 60 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40 }}
            transition={{ type: "spring", damping: 25, stiffness: 300, duration: 0.5 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-mystic" />
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-primary/10" />

            {/* Floating particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {Array.from({ length: 12 }).map((_, i) => (
                <FloatingParticle
                  key={i}
                  delay={i * 0.4}
                  x={`${10 + Math.random() * 80}%`}
                  y={`${20 + Math.random() * 60}%`}
                />
              ))}
            </div>

            {/* Top decorative glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-primary/60 to-transparent rounded-full" />

            {/* Close button */}
            <motion.button
              onClick={() => { playClick(); onClose(); }}
              className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-secondary/80 border border-border/40 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all"
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-4 h-4" />
            </motion.button>

            {/* Sparkle icon */}
            <motion.div
              className="absolute top-4 left-4 z-20"
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles className="w-5 h-5 text-primary/50" />
            </motion.div>

            {/* Scrollable content */}
            <div className="relative z-10 overflow-y-auto" style={{ maxHeight: "90vh" }}>
              <DreamForm
                onSubmitAudio={onSubmitAudio}
                onSubmitText={onSubmitText}
                isLoading={isLoading}
              />
            </div>

            {/* Bottom decorative glow */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent rounded-full" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DreamFormModal;
