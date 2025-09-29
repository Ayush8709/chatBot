import React, { useState, useEffect } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { useSpeechSynthesis } from "react-speech-kit";

const VoiceBot = () => {
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isAutoTriggered, setIsAutoTriggered] = useState(false);

  const { speak } = useSpeechSynthesis();

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
  } = useSpeechRecognition();

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  const startListening = () => {
    console.log(" Trying to start listening...");

    if (!browserSupportsSpeechRecognition) {
      setErrorMsg(" Your browser does not support speech recognition.");
      console.error("Speech recognition not supported.");
      return;
    }

    if (!isMicrophoneAvailable) {
      setErrorMsg(" Microphone not available or permission denied.");
      console.error("Microphone not available or permission denied.");
      return;
    }

    try {
      setErrorMsg("");
      setAnswer("");
      resetTranscript();
      setIsAutoTriggered(false);

      SpeechRecognition.startListening({
        continuous: true,
        language: "en-IN",
      });

      console.log("🎧 Listening started...");
    } catch (err) {
      console.error(" Error starting SpeechRecognition:", err);
      setErrorMsg(" Failed to start microphone: " + err.message);
    }
  };


  const stopAndAsk = async () => {
    SpeechRecognition.stopListening();

    if (!transcript.trim()) {
      setErrorMsg(" You didn't say anything.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const response = await fetch(`${BACKEND_URL}/api/gemini`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: transcript }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Error ${response.status}: ${text}`);
      }

      const data = await response.json();

      if (!data.answer) {
        throw new Error(" No answer received from backend.");
      }

      setAnswer(data.answer);
      speak({ text: data.answer });
    } catch (error) {
      setErrorMsg(error.message || " Something went wrong.");
    } finally {
      setLoading(false);
      resetTranscript();
    }
  };

  // Auto-stop and ask after 2s of silence
  useEffect(() => {
    if (!listening || isAutoTriggered) return;

    const timer = setTimeout(() => {
      if (transcript.trim()) {
        setIsAutoTriggered(true);
        stopAndAsk();
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [transcript, listening]);

  return (
    <div className="max-w-lg mx-auto mt-16 p-8 bg-white rounded-xl shadow-lg text-gray-800 space-y-6">
      <h1 className="text-3xl font-bold text-center">Ask Anything</h1>

      <div className="text-center">
        <button
          onClick={startListening}
          disabled={listening || loading}
          className={`px-6 py-3 rounded-lg text-lg font-medium transition-all duration-200 ${listening
            ? "bg-gray-400 cursor-not-allowed text-white"
            : "bg-purple-600 hover:bg-purple-700 text-white"
            }`}
        >
          {listening ? " Listening..." : " Ask"}
        </button>
      </div>

      <div className="space-y-2 text-sm">
        {errorMsg && (
          <p className="text-red-600 bg-red-100 p-2 rounded"> {errorMsg}</p>
        )}
        <p>
          <span className="font-semibold text-gray-600"> Status:</span>{" "}
          {listening ? "Listening..." : "Not Listening"}
        </p>
        <p>
          <span className="font-semibold text-gray-600"> You Said:</span>{" "}
          <span className="italic">{transcript || "---"}</span>
        </p>
        <p>
          <span className="font-semibold text-gray-600"> Ai Says:</span>
        </p>
        <div className="bg-green-100 p-4 rounded text-gray-800 min-h-[60px]">
          {loading ? "Thinking..." : answer || "---"}
        </div>
      </div>
    </div>
  );
};

export default VoiceBot;
