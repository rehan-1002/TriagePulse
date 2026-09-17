"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export interface UseVoiceAssistantOptions {
  onTranscriptEnd?: (transcript: string) => void;
  language?: "hi-IN" | "en-IN" | "en-US";
}

export function useVoiceAssistant(options: UseVoiceAssistantOptions = {}) {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>("");
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setIsSupported(true);
      }
      if ("speechSynthesis" in window) {
        synthesisRef.current = window.speechSynthesis;
      }
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(
    (lang: "hi-IN" | "en-IN" | "en-US" = options.language || "hi-IN") => {
      setVoiceError(null);
      if (!isSupported) {
        setVoiceError("Voice recognition not supported in this browser.");
        return;
      }

      if (isListening) {
        stopListening();
        return;
      }

      try {
        const SpeechRecognition =
          (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;

        recognition.lang = lang;
        recognition.continuous = false;
        recognition.interimResults = true;

        recognition.onstart = () => {
          setIsListening(true);
          setTranscript("");
        };

        recognition.onresult = (event: any) => {
          const current = Array.from(event.results)
            .map((result: any) => result[0].transcript)
            .join(" ");
          setTranscript(current);

          if (event.results[0]?.isFinal) {
            if (options.onTranscriptEnd) {
              options.onTranscriptEnd(current);
            }
          }
        };

        recognition.onerror = (event: any) => {
          console.warn("Voice Recognition error:", event.error);
          setIsListening(false);
          setVoiceError(event.error === "no-speech" ? "No speech detected" : "Microphone error");
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.start();
      } catch (err: any) {
        console.error("Speech init error:", err);
        setIsListening(false);
        setVoiceError("Failed to access microphone.");
      }
    },
    [isSupported, isListening, options, stopListening]
  );

  const speak = useCallback(
    (text: string, lang: "hi-IN" | "en-IN" | "en-US" = "hi-IN", rate = 0.95) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        return;
      }

      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = rate;

        // Try to pick a natural regional voice if available
        const voices = window.speechSynthesis.getVoices();
        const targetVoice = voices.find(
          (v) => v.lang.toLowerCase() === lang.toLowerCase() || v.lang.includes(lang.split("-")[0])
        );
        if (targetVoice) {
          utterance.voice = targetVoice;
        }

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn("Speech synthesis error:", e);
        setIsSpeaking(false);
      }
    },
    []
  );

  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return {
    isListening,
    transcript,
    setTranscript,
    isSpeaking,
    isSupported,
    voiceError,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  };
}
