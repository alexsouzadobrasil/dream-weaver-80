import { useState, useRef, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import HeroSection from "@/components/HeroSection";
import DreamForm from "@/components/DreamForm";
import DreamResult from "@/components/DreamResult";
import LoadingOverlay from "@/components/LoadingOverlay";
import LoginPrompt from "@/components/LoginPrompt";
import heroBg from "@/assets/hero-bg.jpg";
import { toast } from "sonner";
import type { DreamEntry } from "@/components/DreamHistoryCard";
import { submitAudio, submitText, pollDreamStatus } from "@/lib/dreamApi";

const Index = () => {
  const [step, setStep] = useState<"hero" | "form" | "loading" | "result">("hero");
  const [interpretation, setInterpretation] = useState<any>(null);
  const [dreamHistory, setDreamHistory] = useState<DreamEntry[]>([]);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("dreamHistory");
    if (saved) {
      try { setDreamHistory(JSON.parse(saved)); } catch {}
    }
  }, []);

  const handleStart = () => {
    setStep("form");
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const processDream = async (dreamId: number, dreamText: string) => {
    setStep("loading");
    window.scrollTo({ top: 0, behavior: "smooth" });

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
      setTimeout(() => setShowLoginPrompt(true), 2000);
    } catch (err: any) {
      toast.error(err.message || "Erro ao processar sonho");
      setStep("form");
    }
  };

  const handleSubmitAudio = async (blob: Blob) => {
    setStep("loading");
    window.scrollTo({ top: 0, behavior: "smooth" });
    try {
      const { dream_id, transcription } = await submitAudio(blob);
      const dreamText = transcription || "Sonho enviado por áudio";
      await processDream(dream_id, dreamText);
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar áudio");
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
    setShowLoginPrompt(false);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const handleGoHome = () => {
    setStep("hero");
    setShowLoginPrompt(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLogin = () => {
    toast.info("Login será implementado em breve!", {
      description: "Em breve você poderá criar sua conta.",
    });
    setShowLoginPrompt(false);
  };

  return (
    <div className="min-h-screen bg-gradient-mystic">
      {step === "hero" && <HeroSection onStart={handleStart} dreamHistory={dreamHistory} />}

      {step === "form" && (
        <div ref={formRef} className="min-h-screen flex flex-col">
          <button
            onClick={handleGoHome}
            className="self-start flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-display px-6 pt-6"
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

      <AnimatePresence>
        {showLoginPrompt && (
          <LoginPrompt onClose={() => setShowLoginPrompt(false)} onLogin={handleLogin} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
