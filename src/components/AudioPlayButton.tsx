import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, Pause, Loader2 } from "lucide-react";
import { generateInterpretationAudio } from "@/lib/dreamApi";
import { playClick } from "@/lib/sounds";
import { toast } from "sonner";

interface AudioPlayButtonProps {
  text: string;
  size?: "sm" | "md";
  className?: string;
}

const AudioPlayButton = ({ text, size = "sm", className = "" }: AudioPlayButtonProps) => {
  const [state, setState] = useState<"idle" | "loading" | "playing">("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    playClick();

    if (state === "playing" && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setState("idle");
      return;
    }

    if (state === "loading") return;

    setState("loading");
    try {
      // If we already have a cached URL, reuse it
      if (urlRef.current) {
        const audio = new Audio(urlRef.current);
        audioRef.current = audio;
        audio.onended = () => setState("idle");
        audio.onerror = () => { setState("idle"); toast.error("Erro ao reproduzir áudio"); };
        await audio.play();
        setState("playing");
        return;
      }

      const blob = await generateInterpretationAudio(text);
      const url = URL.createObjectURL(blob);
      urlRef.current = url;
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setState("idle");
      audio.onerror = () => { setState("idle"); toast.error("Erro ao reproduzir áudio"); };
      await audio.play();
      setState("playing");
    } catch (err: any) {
      setState("idle");
      toast.error(err.message || "Não foi possível gerar o áudio");
    }
  };

  const iconSize = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";
  const btnSize = size === "sm" ? "w-8 h-8" : "w-10 h-10";

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={handleClick}
      className={`${btnSize} rounded-full flex items-center justify-center transition-all ${
        state === "playing"
          ? "bg-primary text-primary-foreground"
          : "bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary"
      } border border-border/40 ${className}`}
      title={state === "playing" ? "Pausar" : "Ouvir interpretação"}
    >
      <AnimatePresence mode="wait">
        {state === "loading" && (
          <motion.div key="load" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Loader2 className={`${iconSize} animate-spin`} />
          </motion.div>
        )}
        {state === "playing" && (
          <motion.div key="pause" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
            <Pause className={iconSize} />
          </motion.div>
        )}
        {state === "idle" && (
          <motion.div key="play" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
            <Volume2 className={iconSize} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

export default AudioPlayButton;
