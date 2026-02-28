import { useState, useRef, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import HeroSection from "@/components/HeroSection";
import DreamForm from "@/components/DreamForm";
import DreamResult from "@/components/DreamResult";
import LoadingOverlay from "@/components/LoadingOverlay";
import heroBg from "@/assets/hero-bg.jpg";
import { toast } from "sonner";
import type { DreamEntry } from "@/components/DreamHistoryCard";
import { submitAudio, submitText, pollDreamStatus } from "@/lib/dreamApi";
import { saveAudioLocally, removeAudio, getPendingAudios } from "@/lib/audioStorage";
import { playMysticAmbient } from "@/lib/sounds";

const Index = () => {
  const [step, setStep] = useState<"hero" | "form" | "loading" | "result">("hero");
  const [interpretation, setInterpretation] = useState<any>(null);
  const [dreamHistory, setDreamHistory] = useState<DreamEntry[]>([]);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("dreamHistory");
    if (saved) {
      try { setDreamHistory(JSON.parse(saved)); } catch {}
    }
    // Try resending pending audios on load
    retryPendingAudios();
  }, []);

  const retryPendingAudios = async () => {
    try {
      const pending = await getPendingAudios();
      for (const item of pending) {
        if (item.id && item.retries < 5) {
          try {
            const { dream_id, transcription } = await submitAudio(item.blob);
            await removeAudio(item.id);
            toast.success("Um sonho pendente foi reenviado com sucesso!");
          } catch {
            // Will retry next time
          }
        }
      }
    } catch {}
  };

  const handleStart = () => {
    playMysticAmbient();
    setStep("form");
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const processDream = async (dreamId: number, dreamText: string) => {
    try {
      const result = await pollDreamStatus(dreamId);

      const interp = {
        title: dreamText.slice(0, 40) + (dreamText.length > 40 ? "..." : ""),
        emotion: "paz",
        symbols: result.interpretation || "",
        emotions: "",
        message: "",
        thumbnailUrl: result.image_url || heroBg,
      };
      setInterpretation(interp);

      const entry: DreamEntry = {
        id: dreamId.toString(),
        title: interp.title,
        emotion: interp.emotion,
        dreamText,
        interpretation: result.interpretation || "",
        createdAt: result.created_at || new Date().toISOString(),
      };
      setDreamHistory(prev => {
        const updated = [entry, ...prev].slice(0, 20);
        localStorage.setItem("dreamHistory", JSON.stringify(updated));
        return updated;
      });

      setStep("result");
    } catch (err: any) {
      toast.error(err.message || "Erro ao processar sonho");
      setStep("form");
    }
  };

  const handleSubmitAudio = async (blob: Blob) => {
    // Save audio locally FIRST — before any network call
    let localId: number | null = null;
    try {
      localId = await saveAudioLocally(blob);
    } catch {
      // IndexedDB failed, continue anyway
    }

    setStep("loading");
    window.scrollTo({ top: 0, behavior: "smooth" });

    try {
      const { dream_id, transcription } = await submitAudio(blob);
      // Success — remove from local storage
      if (localId) {
        try { await removeAudio(localId); } catch {}
      }
      const dreamText = transcription || "Sonho enviado por áudio";
      await processDream(dream_id, dreamText);
    } catch (err: any) {
      toast.error(
        "Não foi possível enviar agora. Seu áudio está salvo e será reenviado automaticamente.",
        { duration: 6000 }
      );
      setStep("form");
    }
  };

  const handleSubmitText = async (text: string) => {
    setStep("loading");
    window.scrollTo({ top: 0, behavior: "smooth" });
    try {
      const { dream_id } = await submitText(text);
      await processDream(dream_id, text);
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar sonho");
      setStep("form");
    }
  };

  const handleNewDream = () => {
    setStep("form");
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const handleGoHome = () => {
    setStep("hero");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-gradient-mystic">
      {step === "hero" && <HeroSection onStart={handleStart} dreamHistory={dreamHistory} />}

      {step === "form" && (
        <div ref={formRef} className="min-h-screen flex flex-col">
          <button
            onClick={handleGoHome}
            className="self-start flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-base font-display px-6 pt-6"
          >
            ← Início
          </button>
          <DreamForm onSubmitAudio={handleSubmitAudio} onSubmitText={handleSubmitText} isLoading={false} />
        </div>
      )}

      {step === "loading" && <LoadingOverlay />}

      {step === "result" && interpretation && (
        <DreamResult
          interpretation={interpretation}
          onNewDream={handleNewDream}
          onGoHome={handleGoHome}
        />
      )}
    </div>
  );
};

export default Index;
