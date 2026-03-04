import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, Send, Trash2, Play, Pause, PenLine, MicIcon } from "lucide-react";
import { playStartRecord, playStopRecord, playSend, playClick } from "@/lib/sounds";

interface DreamFormProps {
  onSubmitAudio: (blob: Blob) => void;
  onSubmitText: (text: string) => void;
  isLoading: boolean;
}

const MAX_SIZE_MB = 25;
const MAX_TEXT_LENGTH = 5000;

type InputMode = "audio" | "text";
type AudioState = "idle" | "recording" | "recorded" | "playing";

const DreamForm = ({ onSubmitAudio, onSubmitText, isLoading }: DreamFormProps) => {
  const [inputMode, setInputMode] = useState<InputMode>("audio");
  const [audioState, setAudioState] = useState<AudioState>("idle");
  const [recordingTime, setRecordingTime] = useState(0);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [dreamText, setDreamText] = useState("");
  const [textSubmitting, setTextSubmitting] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (audioPlayerRef.current) audioPlayerRef.current.pause();
    };
  }, [audioUrl]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        if (blob.size > MAX_SIZE_MB * 1024 * 1024) {
          alert('Áudio excede 25MB. Tente gravar um áudio mais curto.');
          setAudioState("idle");
          return;
        }
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setAudioState("recorded");
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorder.start();
      setAudioState("recording");
      setRecordingTime(0);
      setAudioBlob(null);
      if (audioUrl) { URL.revokeObjectURL(audioUrl); setAudioUrl(null); }
      playStartRecord();

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch {
      alert('Não foi possível acessar o microfone. Verifique as permissões.');
    }
  }, [audioUrl]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    playStopRecord();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleMainButton = () => {
    if (audioState === "idle") {
      startRecording();
    } else if (audioState === "recording") {
      stopRecording();
    } else if (audioState === "recorded") {
      handlePlayPause();
    } else if (audioState === "playing") {
      handlePlayPause();
    }
  };

  const handleDelete = () => {
    playClick();
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
    if (progressRef.current) { clearInterval(progressRef.current); progressRef.current = null; }
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setPlaybackProgress(0);
    setAudioState("idle");
  };

  const handlePlayPause = () => {
    if (!audioUrl) return;
    playClick();

    if (audioState === "playing" && audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      if (progressRef.current) { clearInterval(progressRef.current); progressRef.current = null; }
      setAudioState("recorded");
      return;
    }

    const audio = new Audio(audioUrl);
    audioPlayerRef.current = audio;
    setAudioState("playing");
    setPlaybackProgress(0);

    audio.onended = () => {
      setAudioState("recorded");
      setPlaybackProgress(0);
      if (progressRef.current) { clearInterval(progressRef.current); progressRef.current = null; }
    };
    audio.onerror = () => {
      setAudioState("recorded");
      if (progressRef.current) { clearInterval(progressRef.current); progressRef.current = null; }
    };

    audio.play();
    progressRef.current = setInterval(() => {
      if (audio.duration) {
        setPlaybackProgress((audio.currentTime / audio.duration) * 100);
      }
    }, 100);
  };

  const handleSendAudio = () => {
    if (audioBlob) {
      playSend();
      onSubmitAudio(audioBlob);
    }
  };

  const handleSendText = () => {
    const trimmed = dreamText.trim();
    if (!trimmed || textSubmitting) return;
    if (trimmed.length < 10) {
      alert("Descreva seu sonho com pelo menos 10 caracteres.");
      return;
    }
    setTextSubmitting(true);
    playSend();
    onSubmitText(trimmed);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const PulseRings = () => (
    <>
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="absolute inset-0 rounded-full border-2 border-primary/30"
          animate={{ scale: [1, 1.5 + i * 0.3], opacity: [0.6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.4, ease: "easeOut" }}
        />
      ))}
    </>
  );

  const showSendButton = audioState === "recorded";

  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="py-12 px-4 flex-1 flex items-center justify-center safe-area-bottom"
      id="dream-form"
    >
      <div className="max-w-md mx-auto w-full text-center">
        <h2 className="text-3xl md:text-4xl font-display font-bold text-gradient-gold mb-3">
          Conte seu sonho
        </h2>
        <p className="text-muted-foreground mb-6 text-base md:text-lg leading-relaxed">
          {inputMode === "audio"
            ? audioState === "idle"
              ? "Toque no botão e conte seu sonho em voz alta"
              : audioState === "recording"
              ? "Gravando... toque novamente para parar"
              : "Ouça sua gravação antes de enviar"
            : "Descreva seu sonho com detalhes"}
        </p>

        {/* Mode toggle */}
        {audioState === "idle" && (
          <div className="flex justify-center gap-2 mb-8">
            <button
              onClick={() => { playClick(); setInputMode("audio"); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-display font-semibold transition-all ${
                inputMode === "audio"
                  ? "bg-primary text-primary-foreground shadow-[0_0_15px_hsl(var(--primary)/0.3)]"
                  : "bg-secondary text-muted-foreground border border-border/40 hover:text-foreground"
              }`}
            >
              <MicIcon className="w-4 h-4" />
              Enviar áudio
            </button>
            <button
              onClick={() => { playClick(); setInputMode("text"); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-display font-semibold transition-all ${
                inputMode === "text"
                  ? "bg-primary text-primary-foreground shadow-[0_0_15px_hsl(var(--primary)/0.3)]"
                  : "bg-secondary text-muted-foreground border border-border/40 hover:text-foreground"
              }`}
            >
              <PenLine className="w-4 h-4" />
              Enviar texto
            </button>
          </div>
        )}

        {/* ─── AUDIO MODE ─── */}
        {inputMode === "audio" && (
          <div className="flex flex-col items-center gap-6">
            {/* Main button */}
            <div className="relative flex items-center justify-center">
              {audioState === "recording" && <PulseRings />}
              <motion.button
                type="button"
                disabled={isLoading}
                onClick={handleMainButton}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`relative z-10 w-28 h-28 md:w-32 md:h-32 rounded-full flex items-center justify-center transition-all duration-300 ${
                  audioState === "recording"
                    ? 'bg-destructive shadow-[0_0_40px_hsl(var(--destructive)/0.5)]'
                    : audioState === "playing"
                    ? 'bg-primary shadow-[0_0_30px_hsl(var(--primary)/0.4)]'
                    : audioState === "recorded"
                    ? 'bg-secondary border-2 border-primary/40'
                    : 'bg-primary glow-gold'
                }`}
              >
                {audioState === "recording" ? (
                  <Square className="w-9 h-9 text-destructive-foreground" />
                ) : audioState === "playing" ? (
                  <Pause className="w-9 h-9 text-primary-foreground" />
                ) : audioState === "recorded" ? (
                  <Play className="w-9 h-9 text-primary ml-1" />
                ) : (
                  <Mic className="w-10 h-10 text-primary-foreground" />
                )}
              </motion.button>
            </div>

            {/* Status / timer */}
            <div className="h-8 flex items-center justify-center">
              {audioState === "recording" && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="text-destructive font-display font-semibold text-xl">
                  {formatTime(recordingTime)}
                </motion.p>
              )}
              {audioState === "recorded" && (
                <p className="text-muted-foreground text-sm font-display">
                  {formatTime(recordingTime)} gravados — toque para ouvir
                </p>
              )}
              {audioState === "playing" && (
                <p className="text-primary text-sm font-display font-semibold">
                  Reproduzindo...
                </p>
              )}
            </div>

            {/* Playback progress bar */}
            {(audioState === "playing" || audioState === "recorded") && (
              <div className="w-full max-w-xs">
                <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${playbackProgress}%` }}
                    transition={{ duration: 0.1 }}
                  />
                </div>

                {/* Waveform */}
                <div className="flex items-end justify-center gap-[3px] h-8 mt-3">
                  {Array.from({ length: 30 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-1 rounded-full bg-primary/40"
                      animate={audioState === "playing" ? {
                        height: [4, 8 + Math.random() * 20, 4],
                      } : { height: 4 + Math.sin(i * 0.5) * 12 }}
                      transition={audioState === "playing" ? {
                        duration: 0.4 + Math.random() * 0.3,
                        repeat: Infinity,
                        repeatType: "reverse",
                      } : { duration: 0 }}
                      style={{ height: 4 + Math.sin(i * 0.5) * 12 }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Actions after recording */}
            <AnimatePresence>
              {(audioState === "recorded" || audioState === "playing") && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="w-full max-w-xs space-y-3"
                >
                  {showSendButton && (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSendAudio}
                      disabled={isLoading}
                      className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-display font-semibold text-base flex items-center justify-center gap-2 glow-gold disabled:opacity-50"
                    >
                      <Send className="w-5 h-5" />
                      Enviar
                    </motion.button>
                  )}
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleDelete}
                    className="w-full py-3 rounded-xl bg-secondary text-foreground font-display text-sm border border-border/40 flex items-center justify-center gap-2 hover:border-destructive/40 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Regravar
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ─── TEXT MODE ─── */}
        {inputMode === "text" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full space-y-4"
          >
            <div className="relative">
              <textarea
                value={dreamText}
                onChange={(e) => setDreamText(e.target.value.slice(0, MAX_TEXT_LENGTH))}
                placeholder="Descreva seu sonho com o máximo de detalhes possível..."
                rows={6}
                className="w-full rounded-xl bg-secondary/80 border border-border/40 text-foreground placeholder:text-muted-foreground/60 p-4 text-base font-body resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all"
              />
              <span className={`absolute bottom-3 right-3 text-xs font-display ${
                dreamText.length > MAX_TEXT_LENGTH * 0.9
                  ? 'text-destructive'
                  : 'text-muted-foreground/60'
              }`}>
                {dreamText.length}/{MAX_TEXT_LENGTH}
              </span>
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSendText}
              disabled={isLoading || textSubmitting || dreamText.trim().length < 10}
              className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-display font-semibold text-base flex items-center justify-center gap-2 glow-gold disabled:opacity-50 transition-all"
            >
              <Send className="w-5 h-5" />
              Enviar texto
            </motion.button>
          </motion.div>
        )}
      </div>
    </motion.section>
  );
};

export default DreamForm;
