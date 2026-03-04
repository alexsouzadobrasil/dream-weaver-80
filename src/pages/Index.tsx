import { useState, useRef, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import HeroSection from "@/components/HeroSection";
import DreamFormModal from "@/components/DreamFormModal";
import DreamResult from "@/components/DreamResult";
import LoadingOverlay from "@/components/LoadingOverlay";
import heroBg from "@/assets/hero-bg.jpg";
import { toast } from "sonner";
import type { DreamEntry } from "@/components/DreamHistoryCard";
import { submitAudio, submitText, pollDreamStatus, apiAssetUrl } from "@/lib/dreamApi";
import { saveAudioLocally, removeAudio, getPendingAudios } from "@/lib/audioStorage";
import { playMysticAmbient, playTransition, playError, playSuccess } from "@/lib/sounds";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

const FAKE_DREAMS: DreamEntry[] = [
  {
    id: "fake-1",
    title: "Voando sobre montanhas douradas",
    emotion: "paz",
    dreamText: "Eu estava voando sobre montanhas enormes cobertas de ouro. O vento era quente e eu sentia uma paz imensa. Abaixo de mim, um rio brilhava como prata e eu podia ouvir uma melodia suave vindo de algum lugar distante.",
    interpretation: "Voar em sonhos representa liberdade e transcendência. As montanhas douradas simbolizam conquistas e prosperidade que estão ao seu alcance. O rio prateado é o fluxo da sua intuição — você está em harmonia com seu caminho. A melodia distante é a voz do seu eu superior, guiando você para um propósito maior. Este sonho revela que você está em um momento de expansão espiritual e emocional.",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "fake-2",
    title: "O labirinto de espelhos infinitos",
    emotion: "confusao",
    dreamText: "Eu estava preso dentro de um labirinto feito de espelhos. Cada reflexo mostrava uma versão diferente de mim — mais jovem, mais velho, feliz, triste. Tentei encontrar a saída mas cada corredor levava a outro. No final, quebrei um espelho e encontrei um jardim.",
    interpretation: "O labirinto de espelhos representa sua jornada de autoconhecimento. As diferentes versões de você são aspectos da sua personalidade que pedem integração — o Jung chamaria isso de encontro com a Sombra. A confusão é natural quando estamos em processo de transformação interior. Quebrar o espelho simboliza coragem para enfrentar verdades difíceis. O jardim que surge é a promessa de renovação: após o caos interior, floresce uma nova fase de sua vida.",
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: "fake-3",
    title: "A baleia cantando no céu estrelado",
    emotion: "alegria",
    dreamText: "Uma baleia enorme flutuava no céu noturno entre as estrelas. Ela cantava uma música que fazia as constelações dançarem. Eu estava em cima dela, segurando em sua barbatana, rindo de felicidade enquanto viajávamos pelo cosmos.",
    interpretation: "A baleia é um símbolo ancestral de sabedoria profunda e conexão com o inconsciente coletivo. Ela cantando no céu representa a união entre o mundo emocional (oceano) e o espiritual (cosmos). Você montando nela indica que está em sintonia com forças maiores que guiam sua vida. As constelações dançando mostram que o universo celebra sua jornada. Este sonho é um presente: ele diz que você é amado pelo cosmos e que sua alegria é genuína e merecida.",
    createdAt: new Date(Date.now() - 259200000).toISOString(),
  },
];

const Index = () => {
  const [step, setStep] = useState<"hero" | "form" | "loading" | "result">("hero");
  const [interpretation, setInterpretation] = useState<any>(null);
  const [dreamHistory, setDreamHistory] = useState<DreamEntry[]>([]);
  
  const online = useOnlineStatus();

  useEffect(() => {
    const saved = localStorage.getItem("dreamHistory");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length === 0) {
          setDreamHistory(FAKE_DREAMS);
          localStorage.setItem("dreamHistory", JSON.stringify(FAKE_DREAMS));
        } else {
          setDreamHistory(parsed);
        }
      } catch {
        setDreamHistory(FAKE_DREAMS);
        localStorage.setItem("dreamHistory", JSON.stringify(FAKE_DREAMS));
      }
    } else {
      setDreamHistory(FAKE_DREAMS);
      localStorage.setItem("dreamHistory", JSON.stringify(FAKE_DREAMS));
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
      const displayText = result.dream_text || result.transcription || dreamText;
      const interp = {
        title: displayText.slice(0, 40) + (displayText.length > 40 ? "..." : ""),
        emotion: "paz",
        symbols: result.interpretation || "",
        emotions: "",
        message: "",
        thumbnailUrl: result.image_path ? apiAssetUrl(result.image_path) : heroBg,
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
      playError();
      toast.error("Não foi possível obter a interpretação agora. Tente novamente em breve.", { duration: 5000 });
      const waitingInterp = buildWaitingInterpretation(dreamText.slice(0, 40) + (dreamText.length > 40 ? "..." : ""));
      setInterpretation(waitingInterp);
      setStep("result");
    }
  };

  const handleSubmitAudio = async (blob: Blob) => {
    let localId: number | null = null;
    try { localId = await saveAudioLocally(blob); } catch {}

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
  };

  const handleGoHome = () => {
    playTransition();
    setStep("hero");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const APP_VERSION = '1.2.0';
  const BUILD_DATE  = '2026-03-03';

  return (
    <div className="min-h-screen bg-gradient-mystic">
      {(step === "hero" || step === "form") && (
        <>
          <HeroSection onStart={handleStart} dreamHistory={dreamHistory} />
          <footer className="fixed bottom-2 right-3 z-50 pointer-events-none">
            <span className="text-[10px] text-white/20 font-mono select-none">
              v{APP_VERSION} · {BUILD_DATE}
            </span>
          </footer>
        </>
      )}

      {/* Dream Form Modal */}
      <DreamFormModal
        isOpen={step === "form"}
        onClose={handleGoHome}
        onSubmitAudio={handleSubmitAudio}
        onSubmitText={handleSubmitText}
        isLoading={false}
      />

      {step === "loading" && <LoadingOverlay />}
      {step === "result" && interpretation && (
        <DreamResult interpretation={interpretation} onNewDream={handleNewDream} onGoHome={handleGoHome} />
      )}
    </div>
  );
};

export default Index;
