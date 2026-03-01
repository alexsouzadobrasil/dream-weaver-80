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
import { playMysticAmbient, playTransition, playError, playSuccess } from "@/lib/sounds";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

const Index = () => {
  const [step, setStep] = useState<"hero" | "form" | "loading" | "result">("hero");
  const [interpretation, setInterpretation] = useState<any>(null);
  const [dreamHistory, setDreamHistory] = useState<DreamEntry[]>([]);
  const formRef = useRef<HTMLDivElement>(null);
  const online = useOnlineStatus();

  useEffect(() => {
    const saved = localStorage.getItem("dreamHistory");
    if (saved) {
      try { setDreamHistory(JSON.parse(saved)); } catch {}
    }
    retryPendingAudios();
  }, []);

  useEffect(() => {
    if (online) retryPendingAudios();
  }, [online]);

  const retryPendingAudios = async () => {
    try {
      const pending = await getPendingAudios();
      for (const item of pending) {
        if (item.id && item.retries < 5) {
          try {
            await submitAudio(item.blob);
            await removeAudio(item.id);
            playSuccess();
            toast.success("Um sonho pendente foi reenviado com sucesso!");
          } catch {}
        }
      }
    } catch {}
  };

  const handleStart = () => {
    playMysticAmbient();
    setStep("form");
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const buildWaitingInterpretation = (title: string) => ({
    title,
    emotion: "paz",
    symbols: "",
    emotions: "",
    message: "",
    thumbnailUrl: heroBg,
    isWaiting: true,
  });

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
        dreamId: dreamId.toString(),
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
      playSuccess();
      setStep("result");
    } catch (err: any) {
      // On ANY error during polling, show result screen with waiting state
      playError();
      toast.error("Não foi possível obter a interpretação agora. Tente novamente em breve.", { duration: 5000 });
      const waitingInterp = buildWaitingInterpretation(dreamText.slice(0, 40) + (dreamText.length > 40 ? "..." : ""));
      waitingInterp.title = dreamText.slice(0, 40) + (dreamText.length > 40 ? "..." : "");
      setInterpretation(waitingInterp);
      setStep("result");
    }
  };

  const handleSubmitAudio = async (blob: Blob) => {
    let localId: number | null = null;
    try {
      localId = await saveAudioLocally(blob);
    } catch {}

    playTransition();
    setStep("loading");
    window.scrollTo({ top: 0, behavior: "smooth" });

    if (!online) {
      const offlineInterp = buildWaitingInterpretation("Sonho enviado por áudio");
      setInterpretation(offlineInterp);
      toast.info("Sem conexão. Seu áudio foi salvo e será enviado quando voltar online.", { duration: 6000 });
      setStep("result");
      return;
    }

    try {
      const { dream_id, transcription } = await submitAudio(blob);
      if (localId) { try { await removeAudio(localId); } catch {} }
      const dreamText = transcription || "Sonho enviado por áudio";
      await processDream(dream_id, dreamText);
    } catch (err: any) {
      // Even on fetch failure → go to result with waiting state (audio is safe locally)
      playError();
      toast.info("Seu áudio está salvo localmente e será reenviado automaticamente.", { duration: 6000 });
      const waitingInterp = buildWaitingInterpretation("Sonho enviado por áudio");
      setInterpretation(waitingInterp);
      setStep("result");
    }
  };

  const handleSubmitText = async (text: string) => {
    playTransition();
    setStep("loading");
    window.scrollTo({ top: 0, behavior: "smooth" });

    if (!online) {
      try { localStorage.setItem('pending_text_dream', text); } catch {}
      const offlineInterp = buildWaitingInterpretation(text.slice(0, 40) + "...");
      setInterpretation(offlineInterp);
      toast.info("Sem conexão. Seu sonho foi salvo e será enviado quando voltar online.", { duration: 6000 });
      setStep("result");
      return;
    }

    try {
      const { dream_id } = await submitText(text);
      await processDream(dream_id, text);
    } catch (err: any) {
      // Save text locally on failure and show result with waiting
      try { localStorage.setItem('pending_text_dream', text); } catch {}
      playError();
      toast.info("Seu sonho foi salvo e será enviado assim que possível.", { duration: 6000 });
      const waitingInterp = buildWaitingInterpretation(text.slice(0, 40) + "...");
      setInterpretation(waitingInterp);
      setStep("result");
    }
  };

  const handleNewDream = () => {
    playTransition();
    setStep("form");
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const handleGoHome = () => {
    playTransition();
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
            className="self-start flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-display px-6 pt-6"
          >
            ← Início
          </button>
          <DreamForm onSubmitAudio={handleSubmitAudio} onSubmitText={handleSubmitText} isLoading={false} />
        </div>
      )}
      {step === "loading" && <LoadingOverlay />}
      {step === "result" && interpretation && (
        <DreamResult interpretation={interpretation} onNewDream={handleNewDream} onGoHome={handleGoHome} />
      )}
    </div>
  );
};

export default Index;
