import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, Send, Trash2, Play, Pause } from "lucide-react";
import { playStartRecord, playStopRecord, playSend, playClick } from "@/lib/sounds";

interface DreamFormProps {
  onSubmitAudio: (blob: Blob) => void;
  isLoading: boolean;
}

const MAX_SIZE_MB = 25;

const DreamForm = ({ onSubmitAudio, isLoading }: DreamFormProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

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
          return;
        }
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
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
    setIsRecording(false);
    playStopRecord();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleDelete = () => {
    playClick();
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setIsPlaying(false);
  };

  const handlePlayPause = () => {
    if (!audioUrl) return;
    playClick();

    if (isPlaying && audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
      return;
    }

    const audio = new Audio(audioUrl);
    audioPlayerRef.current = audio;
    audio.onended = () => setIsPlaying(false);
    audio.onerror = () => setIsPlaying(false);
    audio.play();
    setIsPlaying(true);
  };

  const handleSendAudio = () => {
    if (audioBlob) {
      playSend();
      onSubmitAudio(audioBlob);
    }
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

  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="py-20 px-4 flex-1 flex items-center justify-center"
      id="dream-form"
    >
      <div className="max-w-md mx-auto w-full text-center">
        <h2 className="text-3xl md:text-4xl font-display font-bold text-gradient-gold mb-3">
          Conte seu sonho
        </h2>
        <p className="text-muted-foreground mb-12 text-lg">
          {audioBlob ? "Ouça sua gravação antes de enviar" : "Pressione o botão e conte seu sonho em voz alta"}
        </p>

        <div className="flex flex-col items-center gap-8">
          {/* Main record button — only show when no audio recorded */}
          {!audioBlob && (
            <div className="relative flex items-center justify-center">
              {isRecording && <PulseRings />}
              <motion.button
                type="button"
                disabled={isLoading}
                onMouseDown={!isRecording ? startRecording : undefined}
                onMouseUp={isRecording ? stopRecording : undefined}
                onTouchStart={!isRecording ? (e) => { e.preventDefault(); startRecording(); } : undefined}
                onTouchEnd={isRecording ? (e) => { e.preventDefault(); stopRecording(); } : undefined}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`relative z-10 w-32 h-32 md:w-36 md:h-36 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isRecording
                    ? 'bg-destructive shadow-[0_0_40px_hsl(var(--destructive)/0.5)]'
                    : 'bg-primary glow-gold'
                }`}
              >
                {isRecording ? (
                  <Square className="w-10 h-10 text-destructive-foreground" />
                ) : (
                  <Mic className="w-12 h-12 text-primary-foreground" />
                )}
              </motion.button>
            </div>
          )}

          {/* Status text */}
          <div className="h-10 flex items-center justify-center">
            {isRecording && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-destructive font-display font-semibold text-xl"
              >
                Gravando... {formatTime(recordingTime)}
              </motion.p>
            )}
            {!isRecording && !audioBlob && (
              <p className="text-muted-foreground text-base">
                Segure para gravar
              </p>
            )}
          </div>

          {/* Audio preview — after recording */}
          <AnimatePresence>
            {audioBlob && !isRecording && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full max-w-xs space-y-5"
              >
                {/* Playback card */}
                <div className="bg-gradient-card rounded-2xl p-5 border border-border/40 space-y-4">
                  <div className="flex items-center gap-4">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={handlePlayPause}
                      className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                        isPlaying
                          ? 'bg-primary text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.4)]'
                          : 'bg-secondary text-foreground border border-border/40'
                      }`}
                    >
                      {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                    </motion.button>
                    <div className="flex-1 text-left">
                      <p className="text-foreground font-display font-semibold text-base">Seu sonho</p>
                      <p className="text-muted-foreground text-sm">{formatTime(recordingTime)} gravados</p>
                    </div>
                  </div>

                  {/* Waveform placeholder */}
                  <div className="flex items-end justify-center gap-[3px] h-8">
                    {Array.from({ length: 30 }).map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-1 rounded-full bg-primary/40"
                        animate={isPlaying ? {
                          height: [4, 8 + Math.random() * 20, 4],
                        } : { height: 4 + Math.sin(i * 0.5) * 12 }}
                        transition={isPlaying ? {
                          duration: 0.4 + Math.random() * 0.3,
                          repeat: Infinity,
                          repeatType: "reverse",
                        } : { duration: 0 }}
                        style={{ height: 4 + Math.sin(i * 0.5) * 12 }}
                      />
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleDelete}
                    className="flex-1 py-4 rounded-xl bg-secondary text-foreground font-display font-semibold text-base border border-border/40 flex items-center justify-center gap-2 hover:border-destructive/40 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                    Regravar
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSendAudio}
                    disabled={isLoading}
                    className="flex-1 py-4 rounded-xl bg-primary text-primary-foreground font-display font-semibold text-base flex items-center justify-center gap-2 glow-gold disabled:opacity-50"
                  >
                    <Send className="w-5 h-5" />
                    Enviar
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.section>
  );
};

export default DreamForm;
