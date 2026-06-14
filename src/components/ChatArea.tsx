import React, { useState, useRef, useEffect } from "react";
import { 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  CornerDownLeft, 
  AlertCircle,
  HelpCircle,
  User,
  Check,
  Languages,
  Loader2,
  Image as ImageIcon,
  Key
} from "lucide-react";
import { MessageLine, UserProfile, SUPPORTED_LANGUAGES, SARVAM_SPEAKERS } from "@/src/types";

interface ChatAreaProps {
  activeSessionTitle: string;
  messages: MessageLine[];
  profile: UserProfile;
  isSending: boolean;
  onSendMessage: (text: string) => void;
  onPlayTTSComplete?: (messageId: string, audioBase64: string) => void;
}

export default function ChatArea({
  activeSessionTitle,
  messages,
  profile,
  isSending,
  onSendMessage,
  onPlayTTSComplete,
}: ChatAreaProps) {
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedDuration, setRecordedDuration] = useState<number>(0);
  const [activePlayId, setActivePlayId] = useState<string | null>(null);
  const [playingAudio, setPlayingAudio] = useState<HTMLAudioElement | null>(null);
  const [sttLoading, setSttLoading] = useState(false);
  const [sttError, setSttError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Speakers toggle settings
  const [activeSpeaker, setActiveSpeaker] = useState("anushka");

  // TTS Engine selection for speed vs quality preferences (bulbul:v2 for conversational speed, bulbul:v3 for High-Fidelity/HD)
  const [ttsSpeedModel, setTtsSpeedModel] = useState<"bulbul:v2" | "bulbul:v3">("bulbul:v2");

  // Prefetch TTS sounds for the latest bot messages in the background to achieve near-instantaneous play speed
  useEffect(() => {
    if (messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.sender === "bot" && !lastMsg.audioBase64) {
      const prefetch = async () => {
        try {
          const res = await fetch("/api/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: lastMsg.text,
              languageCode: lastMsg.detectedLanguage || profile.preferredLanguage,
              speaker: activeSpeaker,
              model: ttsSpeedModel,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.audioBase64 && onPlayTTSComplete) {
              onPlayTTSComplete(lastMsg.messageId, data.audioBase64);
            }
          }
        } catch (e) {
          console.warn("Silent background TTS prefetch failed", e);
        }
      };
      prefetch();
    }
  }, [messages.length, activeSpeaker, ttsSpeedModel]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const playingAudioRef = useRef<HTMLAudioElement | null>(null);
  const activePlayIdRef = useRef<string | null>(null);
  const recordingSecondsRef = useRef<number>(0);
  const voiceContainerRef = useRef<HTMLDivElement>(null);

  // Auto scroll to latest bubble
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending, sttLoading]);

  // Audio timer handler
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          const next = prev + 1;
          recordingSecondsRef.current = next;
          return next;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setRecordingSeconds(0);
      recordingSecondsRef.current = 0;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  useEffect(() => {
    return () => {
      if (playingAudioRef.current) {
        playingAudioRef.current.pause();
        playingAudioRef.current = null;
      }
    };
  }, []);

  // Autofocus the Voice Note Container once recording completes so Enter/Escape immediately work
  useEffect(() => {
    if (recordedBlob && voiceContainerRef.current) {
      voiceContainerRef.current.focus();
    }
  }, [recordedBlob]);

  // Format record timer
  const formatSeconds = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  /**
   * Voice Recognition (STT): Starts capturing microphone stream
   */
  const startRecording = async () => {
    setSttError(null);
    setRecordedBlob(null);
    setRecordedDuration(0);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setRecordedBlob(audioBlob);
        setRecordedDuration(recordingSecondsRef.current);
        
        // Stop all track streams to release microphone
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setIsRecording(true);
    } catch (err: any) {
      console.error("Microphone capture failed:", err);
      setSttError("Microphone permission denied or unsupported in this device/iframe.");
    }
  };

  /**
   * Stops voice recording and triggers transcription
   */
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Blur active element so subsequent Enter presses do not trigger click on the Stop/Mic button
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }
  };

  /**
   * Cancels the recorded voice note
   */
  const handleCancelVoiceNote = () => {
    setRecordedBlob(null);
    setRecordedDuration(0);
    setSttError(null);
  };

  /**
   * Transcribes and sends the recorded voice note
   */
  const handleSendVoiceNote = async () => {
    if (!recordedBlob || isSending || sttLoading) return;

    setSttLoading(true);
    setSttError(null);

    try {
      const formData = new FormData();
      formData.append("file", recordedBlob);
      formData.append("language_code", profile.preferredLanguage);

      const res = await fetch("/api/stt", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || data.error || "STT Transcription failed");
      }

      const result = await res.json();
      if (result.transcript && result.transcript.trim()) {
        const transcriptText = result.transcript.trim();
        // Clear voice state first
        setRecordedBlob(null);
        setRecordedDuration(0);
        // Send
        onSendMessage(transcriptText);
      } else {
        setSttError("No speech detected. Please try recording again speaking clearly.");
      }
    } catch (err: any) {
      console.error("STT Voice Note send failed:", err);
      setSttError(err.message || "Failed to parse audio transcription. Check your SARVAM_API_KEY.");
    } finally {
      setSttLoading(false);
    }
  };

  /**
   * Posts binary audio to server STT wrapper
   */
  const handleSTTTranscribe = async (audioBlob: Blob) => {
    setSttLoading(true);
    setSttError(null);

    try {
      const formData = new FormData();
      formData.append("file", audioBlob);
      formData.append("language_code", profile.preferredLanguage);

      const res = await fetch("/api/stt", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || data.error || "STT Transcription failed");
      }

      const result = await res.json();
      if (result.transcript) {
        setInputText((prev) => {
          const space = prev ? " " : "";
          return prev + space + result.transcript;
        });
      } else {
        setSttError("No speech detected. Please try speaking clearly closer to the mic.");
      }
    } catch (err: any) {
      console.error("STT Error:", err);
      setSttError(err.message || "Failed to parse audio transcription. Check your SARVAM_API_KEY.");
    } finally {
      setSttLoading(false);
    }
  };

  /**
   * Audio Text-to-Speech (TTS): Requests vocal synthesis from Bulbul model with precise single-voice execution.
   */
  const playTTS = async (message: MessageLine) => {
    // If already playing this message, stop it
    if (activePlayIdRef.current === message.messageId) {
      if (playingAudioRef.current) {
        playingAudioRef.current.pause();
        playingAudioRef.current = null;
      }
      activePlayIdRef.current = null;
      setActivePlayId(null);
      setPlayingAudio(null);
      return;
    }

    // Stop currently playing audio if any
    if (playingAudioRef.current) {
      playingAudioRef.current.pause();
      playingAudioRef.current = null;
    }

    activePlayIdRef.current = message.messageId;
    setActivePlayId(message.messageId);

    try {
      let base64 = message.audioBase64;

      if (!base64) {
        // Request fresh vocalization from server proxy
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: message.text,
            languageCode: message.detectedLanguage || profile.preferredLanguage,
            speaker: activeSpeaker,
            model: ttsSpeedModel,
          }),
        });

        // Ensure user hasn't cancelled or clicked another voice while we fetched
        if (activePlayIdRef.current !== message.messageId) {
          return;
        }

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || errData.error || "Speech synthesis failed");
        }

        const data = await res.json();
        base64 = data.audioBase64;

        if (base64 && onPlayTTSComplete) {
          onPlayTTSComplete(message.messageId, base64);
        }
      }

      // Check one more time before playing
      if (activePlayIdRef.current !== message.messageId) {
        return;
      }

      if (base64) {
        const audioUrl = `data:audio/mp3;base64,${base64}`;
        const audio = new Audio(audioUrl);
        
        // Stop any intermediate audio
        if (playingAudioRef.current) {
          playingAudioRef.current.pause();
        }

        playingAudioRef.current = audio;
        setPlayingAudio(audio);
        
        audio.onended = () => {
          if (activePlayIdRef.current === message.messageId) {
            activePlayIdRef.current = null;
            setActivePlayId(null);
            setPlayingAudio(null);
            playingAudioRef.current = null;
          }
        };

        await audio.play();
      }
    } catch (err: any) {
      console.error("TTS output failed:", err);
      if (activePlayIdRef.current === message.messageId) {
        setErrorMessage(err.message || "Text-to-Speech synthesis failed. Verify SARVAM_API_KEY.");
        activePlayIdRef.current = null;
        setActivePlayId(null);
        setPlayingAudio(null);
        playingAudioRef.current = null;
      }
    }
  };

  const handleSend = () => {
    if (!inputText.trim() || isSending) return;
    onSendMessage(inputText.trim());
    setInputText("");
    setErrorMessage(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Helper mapping sentiment to visual badges
  const renderSentimentIndicator = (sentiment: "positive" | "neutral" | "negative") => {
    const configurations = {
      positive: {
        dotClass: "bg-emerald-500",
        text: "Sentiment: Positive",
        textClass: "text-emerald-600 dark:text-emerald-400",
      },
      neutral: {
        dotClass: "bg-slate-400",
        text: "Sentiment: Neutral",
        textClass: "text-slate-500 dark:text-slate-400",
      },
      negative: {
        dotClass: "bg-rose-500",
        text: "Sentiment: Negative",
        textClass: "text-rose-600 dark:text-rose-400",
      },
    };

    const choice = configurations[sentiment] || configurations.neutral;

    return (
      <div className="flex items-center gap-1.5 px-1 py-0.5 select-none opacity-85 hover:opacity-100">
        <div className={`w-1.5 h-1.5 rounded-full ${choice.dotClass} shrink-0`} />
        <span className={`text-[10px] font-semibold uppercase tracking-wider font-mono ${choice.textClass} leading-none`}>
          {choice.text}
        </span>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 font-sans transition-all duration-300 relative">
      
      {/* Dynamic Error banners */}
      {errorMessage && (
        <div className="bg-rose-500 text-white text-xs px-4 py-3 flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-2">
            <AlertCircle size={16} />
            <span className="font-medium">{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="font-bold underline cursor-pointer text-[10px]">
            Dismiss
          </button>
        </div>
      )}

      {/* Top Section Nav info */}
      <div className="h-16 border-b border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-900 px-8 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">
              {activeSessionTitle}
            </h2>
            <p className="text-[10px] text-slate-400 mt-0.5 font-semibold leading-none">
              Engine: {profile.preferredModel.split("-")[0].toUpperCase()}
            </p>
          </div>
        </div>

        {/* Audio status badge */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 px-2 py-0.5 bg-emerald-50 dark:bg-slate-900 border border-emerald-100 dark:border-emerald-950 rounded-lg text-emerald-700 dark:text-emerald-400 font-bold text-[10px]">
            <span className="relative flex h-1.5 w-1.5 mr-0.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            Bulbul Voice Live
          </div>
        </div>
      </div>

      {/* Message Chat Bubble stream */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto">
            <div className="p-4 bg-indigo-500/10 rounded-2xl text-indigo-600 dark:text-indigo-400 mb-4 animate-bounce">
              <Sparkles size={32} />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              AI Sentiment-Aware Consultation
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs leading-relaxed">
              Speak or type a message! Our systems will reply, evaluate your vocal sentiment, translate seamlessly, and vocalize using premium Sarvam AI voices.
            </p>
            <div className="mt-5 text-[11px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl text-slate-400 text-left space-y-1 w-full shadow-sm">
              <p className="font-semibold text-slate-500 dark:text-slate-300">💡 Special commands:</p>
              <p>• Type <span className="font-semibold text-indigo-500">"/image standard yellow flower"</span> to generate custom art via Gemini Imagen 3!</p>
              <p>• Click the <span className="font-semibold text-indigo-500">Mic</span> button to speak naturally in Hindi, Tamil, Telugu or English!</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isBot = msg.sender === "bot";
            const isPlaying = activePlayId === msg.messageId;
            return (
              <div
                key={msg.messageId}
                className={`flex max-w-[85%] flex-col space-y-2 ${
                  isBot ? "self-start" : "self-end items-end ml-auto"
                }`}
              >
                {/* Visual bubble container */}
                <div
                  className={`p-4 px-5 rounded-2xl shadow-sm text-sm border leading-relaxed break-words relative overflow-hidden group ${
                    isBot
                      ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-100 dark:border-slate-800 rounded-tl-none"
                      : "bg-indigo-600 text-white border-indigo-500 dark:bg-indigo-600 shadow-indigo-500/5 rounded-tr-none"
                  }`}
                >
                  {/* Image render node */}
                  {msg.imageUrl && (
                    <div className="mb-3 max-w-[500px] bg-slate-150 dark:bg-slate-850 p-2 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm">
                      <div className="relative aspect-video rounded-xl bg-slate-200 dark:bg-slate-800 overflow-hidden flex items-center justify-center border border-slate-300 dark:border-slate-700/60">
                        <img
                          src={msg.imageUrl}
                          alt="AI Generation"
                          className="w-full h-full object-cover select-none"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute bottom-2 left-3 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded text-[9px] font-mono tracking-widest text-white uppercase font-bold">
                          Generated Canvas
                        </div>
                      </div>
                    </div>
                  )}

                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>

                {/* Sub-label Metadata row (Sentiment, Play buttons) */}
                <div className="flex items-center gap-3.5 flex-wrap">
                  {/* Sentiment tag badge */}
                  {renderSentimentIndicator(msg.sentiment)}

                  {/* Detection native language labels */}
                  {msg.detectedLanguage && (
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono select-none">
                      {msg.detectedLanguage}
                    </span>
                  )}

                  {/* Speech syntesizer sound button for bot entries */}
                  {isBot && (
                    <button
                      onClick={() => playTTS(msg)}
                      className={`py-1 px-2 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-all flex items-center space-x-1 text-[10px] font-semibold ${
                        isPlaying
                          ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/40"
                          : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-800"
                      }`}
                      title={isPlaying ? "Stop speech" : "Vocalize with Sarvam Bulbul"}
                    >
                      {isPlaying ? (
                        <>
                          <VolumeX size={11} className="mr-0.5 text-indigo-500" />
                          <span className="animate-pulse">Stop Voice</span>
                        </>
                      ) : (
                        <>
                          <Volume2 size={11} className="mr-0.5 text-slate-400 dark:text-slate-500" />
                          <span>TTS Vocal</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Loading chat bubble typing indicator */}
        {isSending && (
          <div className="flex flex-col space-y-1.5 self-start max-w-[80%]">
            <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-sm rounded-tl-none">
              <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                <Loader2 size={14} className="animate-spin text-indigo-500" />
                <span className="font-medium animate-pulse">Analyzing sentiment & thinking...</span>
              </div>
            </div>
          </div>
        )}

        {/* Visual STT listening overlay indicator inside streams */}
        {sttLoading && (
          <div className="flex flex-col space-y-1.5 self-end ml-auto max-w-[80%]">
            <div className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-150 dark:border-indigo-900/40 p-4 rounded-2xl shadow-sm rounded-tr-none">
              <div className="flex items-center space-x-1.5 text-xs">
                <Loader2 size={14} className="animate-spin text-indigo-500" />
                <span className="font-semibold animate-pulse">Sarvam AI transcribing your voice...</span>
              </div>
            </div>
          </div>
        )}

        {/* Ref dummy to support scroll view anchor */}
        <div ref={scrollRef} />
      </div>

      {/* Mic error/alert banners */}
      {sttError && (
        <div className="mx-6 mb-3 p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs flex items-center space-x-2 border border-rose-100 dark:border-rose-900/30">
          <AlertCircle size={14} className="shrink-0" />
          <span>{sttError}</span>
        </div>
      )}

      {/* Input Message panel */}
      <div className="p-8 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800/60 shrink-0">
        <div className="max-w-4xl mx-auto relative antialiased">
          
          {/* Microphone controls button position on top-left inside wrapper */}
          <div className="absolute left-3.5 top-2.5 z-10">
            <button
              onClick={
                isRecording 
                  ? stopRecording 
                  : (recordedBlob ? handleCancelVoiceNote : startRecording)
              }
              onKeyDown={(e) => {
                // If a voice note is ready, pressing Enter or Space while focusing on the Mic button should send it
                if (recordedBlob && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  handleSendVoiceNote();
                }
              }}
              disabled={sttLoading || isSending}
              className={`p-2 rounded-xl transition cursor-pointer flex items-center justify-center hover:scale-105 active:scale-95 duration-100 ${
                isRecording
                  ? "bg-rose-500 text-white animate-pulse shadow-md"
                  : recordedBlob
                    ? "text-rose-500 hover:text-white bg-rose-500/10 hover:bg-rose-500"
                    : "text-slate-400 hover:text-indigo-500 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-900"
              }`}
              title={
                isRecording 
                  ? "Stop voice transcription" 
                  : recordedBlob 
                    ? "Cancel recorded voice note" 
                    : "Record voice with Sarvam Saaras STT"
              }
            >
              {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
          </div>

          {/* Styled Area input terminal */}
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl relative transition-all duration-300 flex flex-col overflow-hidden">
            {isRecording ? (
              <div className="w-full flex items-center justify-between p-3.5 pr-4 pl-12 min-h-[48px] text-rose-600 dark:text-rose-400 animate-pulse bg-rose-500/5 rounded-2xl select-none">
                <span className="text-xs font-semibold uppercase tracking-wider font-mono">
                  Listening Dialogue Track ({formatSeconds(recordingSeconds)})
                </span>
                <span className="text-[10px] font-semibold text-rose-500/70">
                  Speak clearly in your native tongue
                </span>
              </div>
            ) : recordedBlob ? (
              <div 
                ref={voiceContainerRef}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSendVoiceNote();
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    handleCancelVoiceNote();
                  }
                }}
                className="w-full flex items-center justify-between p-3.5 pr-4 pl-12 min-h-[48px] bg-indigo-50 dark:bg-slate-950 text-indigo-700 dark:text-indigo-400 rounded-2xl select-none border border-indigo-200 dark:border-indigo-800/80 outline-none focus:ring-2 focus:ring-indigo-500 cursor-default"
              >
                <div className="flex items-center space-x-2.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider font-mono">
                    Voice Note Ready ({formatSeconds(recordedDuration)})
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleCancelVoiceNote}
                    className="p-1 px-2.5 text-[11px] font-bold text-rose-600 hover:text-white bg-white dark:bg-slate-900 hover:bg-rose-500 border border-rose-200 dark:border-rose-900/40 rounded-lg cursor-pointer transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendVoiceNote}
                    disabled={isSending || sttLoading}
                    className="p-1 px-3 text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-500 border border-indigo-500 rounded-lg cursor-pointer transition-all flex items-center space-x-1"
                  >
                    {sttLoading ? (
                      <>
                        <Loader2 size={12} className="animate-spin mr-0.5" />
                        <span>Transcribing...</span>
                      </>
                    ) : (
                      <>
                        <Send size={11} className="mr-0.5" />
                        <span>Send (Enter)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  placeholder={
                    sttLoading ? "Transcribing speech..." : "Ask anything..."
                  }
                  disabled={sttLoading}
                  className="w-full pl-12 pr-12 py-3.5 bg-transparent text-sm focus:outline-none text-slate-900 dark:text-slate-100 resize-none min-h-[48px] max-h-24 scrollbar-none font-sans leading-relaxed border-none outline-none"
                />

                {/* Sub-textbox Control Toolbar inside textbox */}
                <div className="flex items-center justify-between px-4 py-2 border-t border-slate-150 dark:border-slate-800/60 bg-slate-100/40 dark:bg-slate-950/40 select-none">
                  {/* Left: Engine Mode Select with speed configurations */}
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                      Voice Engine Mode:
                    </span>
                    <select
                      value={ttsSpeedModel}
                      onChange={(e) => setTtsSpeedModel(e.target.value as "bulbul:v2" | "bulbul:v3")}
                      className="p-1 px-2 text-[10px] font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-350 rounded-lg outline-none cursor-pointer hover:border-indigo-400/80 transition-all shadow-sm"
                      title="Select conversion engine style (Fast is standard)"
                    >
                      <option value="bulbul:v2">⚡ Low Latency (Fast)</option>
                      <option value="bulbul:v3">🎵 High Fidelity (HD)</option>
                    </select>
                  </div>

                  {/* Right: Language Indicator and Send button */}
                  <div className="flex items-center space-x-3.5">
                    <div className="flex items-center space-x-1 opacity-70">
                      <span className="text-[9px] uppercase font-mono tracking-wider font-bold text-slate-400">
                        {SUPPORTED_LANGUAGES.find(l => l.code === profile.preferredLanguage)?.code.split("-")[0].toUpperCase() || "EN"}
                      </span>
                      <span className="text-xs">
                        {SUPPORTED_LANGUAGES.find(l => l.code === profile.preferredLanguage)?.flag || "🇮🇳"}
                      </span>
                    </div>

                    <button
                      onClick={handleSend}
                      disabled={!inputText.trim() || isSending || sttLoading}
                      className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition duration-150 cursor-pointer disabled:opacity-35 disabled:hover:scale-100 flex items-center justify-center shadow-sm"
                      title="Send message"
                    >
                      <Send size={12} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

        </div>

        {/* Interactive bottom tagging specs */}
        <div className="max-w-4xl mx-auto mt-4 flex justify-center gap-6 select-none flex-wrap">
          <div className="flex items-center gap-1.5 text-[9px] text-slate-400 dark:text-slate-500 font-semibold tracking-wider font-mono">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
            SECURE CLOUD SYNC
          </div>
          <div className="flex items-center gap-1.5 text-[9px] text-slate-400 dark:text-slate-500 font-semibold tracking-wider font-mono">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
            FIREBASE AUTH ACTIVE
          </div>
          <div className="flex items-center gap-1.5 text-[9px] text-slate-400 dark:text-slate-500 font-semibold tracking-wider font-mono">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
            END-TO-END ENCRYPTED
          </div>
        </div>
      </div>

    </div>
  );
}
