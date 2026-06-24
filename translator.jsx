import { useState } from "react";
import { ArrowLeftRight, Copy, Check, Volume2, Loader2, Send, Languages } from "lucide-react";

const LANGUAGES = [
  { name: "English", code: "en", speech: "en-US" },
  { name: "Spanish", code: "es", speech: "es-ES" },
  { name: "French", code: "fr", speech: "fr-FR" },
  { name: "German", code: "de", speech: "de-DE" },
  { name: "Italian", code: "it", speech: "it-IT" },
  { name: "Portuguese", code: "pt", speech: "pt-PT" },
  { name: "Russian", code: "ru", speech: "ru-RU" },
  { name: "Chinese (Simplified)", code: "zh", speech: "zh-CN" },
  { name: "Japanese", code: "ja", speech: "ja-JP" },
  { name: "Korean", code: "ko", speech: "ko-KR" },
  { name: "Arabic", code: "ar", speech: "ar-SA" },
  { name: "Hindi", code: "hi", speech: "hi-IN" },
  { name: "Bengali", code: "bn", speech: "bn-IN" },
  { name: "Telugu", code: "te", speech: "te-IN" },
  { name: "Tamil", code: "ta", speech: "ta-IN" },
  { name: "Marathi", code: "mr", speech: "mr-IN" },
  { name: "Urdu", code: "ur", speech: "ur-IN" },
  { name: "Gujarati", code: "gu", speech: "gu-IN" },
  { name: "Kannada", code: "kn", speech: "kn-IN" },
  { name: "Malayalam", code: "ml", speech: "ml-IN" },
  { name: "Punjabi", code: "pa", speech: "pa-IN" },
  { name: "Dutch", code: "nl", speech: "nl-NL" },
  { name: "Turkish", code: "tr", speech: "tr-TR" },
  { name: "Vietnamese", code: "vi", speech: "vi-VN" },
  { name: "Thai", code: "th", speech: "th-TH" },
  { name: "Indonesian", code: "id", speech: "id-ID" },
  { name: "Polish", code: "pl", speech: "pl-PL" },
  { name: "Swedish", code: "sv", speech: "sv-SE" },
  { name: "Greek", code: "el", speech: "el-GR" },
  { name: "Hebrew", code: "he", speech: "he-IL" },
];

const stripeBorder = {
  backgroundImage:
    "repeating-linear-gradient(135deg, #1d4ed8 0px, #1d4ed8 14px, #fafaf9 14px, #fafaf9 20px, #b91c1c 20px, #b91c1c 34px, #fafaf9 34px, #fafaf9 40px)",
};

export default function Translator() {
  const [sourceLang, setSourceLang] = useState("en");
  const [targetLang, setTargetLang] = useState("hi");
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [detectedLanguage, setDetectedLanguage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const nameFor = (code) => LANGUAGES.find((l) => l.code === code)?.name || code;
  const speechFor = (code) => LANGUAGES.find((l) => l.code === code)?.speech || "en-US";

  async function translateText() {
    if (!sourceText.trim() || isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      const sourceDescription =
        sourceLang === "auto" ? "an unspecified language (detect it)" : nameFor(sourceLang);
      const targetDescription = nameFor(targetLang);

      const prompt = `Translate the text between the triple quotes from ${sourceDescription} into ${targetDescription}. Preserve tone and meaning; do not add explanations.

Text:
"""${sourceText}"""

Respond with ONLY valid JSON, no markdown fences, no commentary, in exactly this shape:
{"translation": "<translated text>", "detectedLanguage": "<name of the detected source language, or empty string if source language was already specified>"}`;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!response.ok) throw new Error("Request failed");
      const data = await response.json();
      const textBlock = data.content.find((b) => b.type === "text");
      if (!textBlock) throw new Error("No response");

      let raw = textBlock.text.trim();
      raw = raw.replace(/^```(json)?\s*/i, "").replace(/```\s*$/i, "").trim();

      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = { translation: raw, detectedLanguage: "" };
      }

      setTranslatedText(parsed.translation || "");
      setDetectedLanguage(parsed.detectedLanguage || "");
    } catch (err) {
      setError("Couldn't reach the translator. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      translateText();
    }
  }

  function handleSwap() {
    if (sourceLang === "auto") return;
    const newSource = targetLang;
    const newTarget = sourceLang;
    setSourceLang(newSource);
    setTargetLang(newTarget);
    setSourceText(translatedText);
    setTranslatedText(sourceText);
    setDetectedLanguage("");
    setError(null);
  }

  async function handleCopy() {
    if (!translatedText) return;
    try {
      await navigator.clipboard.writeText(translatedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard unavailable; ignore silently
    }
  }

  function handleSpeak() {
    if (!translatedText || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(translatedText);
    utter.lang = speechFor(targetLang);
    utter.onstart = () => setIsSpeaking(true);
    utter.onend = () => setIsSpeaking(false);
    utter.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utter);
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-8 bg-stone-200">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@500&display=swap');
        .font-display { font-family: 'Roboto Slab', serif; }
        .font-body { font-family: 'IBM Plex Sans', sans-serif; }
        .font-mono { font-family: 'IBM Plex Mono', monospace; }
      `}</style>

      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="w-11 h-11 rounded-full border-2 border-dashed border-blue-700 text-blue-700 flex items-center justify-center shrink-0">
            <Languages size={20} />
          </div>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
              Translate
            </h1>
            <p className="font-mono text-xs tracking-widest uppercase text-slate-500">
              par avion · delivered instantly
            </p>
          </div>
        </div>

        {/* Striped frame */}
        <div style={{ ...stripeBorder, padding: "7px", borderRadius: "12px" }}>
          <div className="rounded-lg p-5 sm:p-7 bg-stone-50">
            {/* Language row */}
            <div className="flex items-center gap-3 mb-5">
              <select
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
                className="flex-1 min-w-0 font-mono text-sm border border-stone-300 rounded-sm px-3 py-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-blue-700"
              >
                <option value="auto">Auto-detect</option>
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.name}
                  </option>
                ))}
              </select>

              <button
                onClick={handleSwap}
                disabled={sourceLang === "auto"}
                title={sourceLang === "auto" ? "Pick a source language to swap" : "Swap languages"}
                className="shrink-0 w-10 h-10 rounded-full border-2 border-dashed border-slate-400 text-slate-600 flex items-center justify-center hover:border-blue-700 hover:text-blue-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-slate-400 disabled:hover:text-slate-600"
              >
                <ArrowLeftRight size={16} />
              </button>

              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="flex-1 min-w-0 font-mono text-sm border border-stone-300 rounded-sm px-3 py-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-blue-700"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Two panes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative">
              <div
                className="hidden md:block absolute left-1/2 top-0 bottom-0 border-l border-dashed border-stone-300"
                aria-hidden="true"
              />

              {/* Source */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs uppercase tracking-widest text-blue-700">
                    Source
                  </span>
                  <span className="font-mono text-xs text-slate-400">{sourceText.length} chars</span>
                </div>
                <textarea
                  value={sourceText}
                  onChange={(e) => setSourceText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type or paste text to translate..."
                  className="w-full h-48 md:h-56 font-body text-base border border-stone-300 rounded-sm p-3 resize-none bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-blue-700"
                />
              </div>

              {/* Target */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs uppercase tracking-widest text-red-700">
                    Target
                    {detectedLanguage && (
                      <span className="text-slate-400 normal-case tracking-normal">
                        {" "}
                        · detected {detectedLanguage}
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleSpeak}
                      disabled={!translatedText}
                      title="Listen"
                      className="p-1.5 rounded-sm text-slate-500 hover:text-blue-700 hover:bg-stone-100 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-500 transition-colors"
                    >
                      <Volume2 size={15} className={isSpeaking ? "animate-pulse" : ""} />
                    </button>
                    <button
                      onClick={handleCopy}
                      disabled={!translatedText}
                      title="Copy"
                      className="p-1.5 rounded-sm text-slate-500 hover:text-blue-700 hover:bg-stone-100 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-500 transition-colors"
                    >
                      {copied ? <Check size={15} className="text-blue-700" /> : <Copy size={15} />}
                    </button>
                  </div>
                </div>
                <div className="w-full h-48 md:h-56 font-body text-base border border-stone-300 rounded-sm p-3 bg-stone-100 overflow-y-auto whitespace-pre-wrap">
                  {isLoading ? (
                    <span className="flex items-center gap-2 text-slate-400">
                      <Loader2 size={16} className="animate-spin" />
                      Translating...
                    </span>
                  ) : error ? (
                    <span className="text-red-700">{error}</span>
                  ) : translatedText ? (
                    <span className="text-slate-800">{translatedText}</span>
                  ) : (
                    <span className="text-slate-400">Translation appears here</span>
                  )}
                </div>
              </div>
            </div>

            {/* Action */}
            <div className="mt-6 flex flex-col items-center gap-2">
              <button
                onClick={translateText}
                disabled={isLoading || !sourceText.trim()}
                className="font-mono text-sm uppercase tracking-wide px-7 py-2.5 rounded-sm text-white bg-blue-700 hover:bg-blue-800 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-blue-700 transition-colors"
              >
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
                {isLoading ? "Translating" : "Translate"}
              </button>
              <p className="font-mono text-xs text-slate-400">⌘ / Ctrl + Enter to send</p>
            </div>
          </div>
        </div>

        <p className="text-center font-mono text-xs text-slate-400 mt-4">
          Translations powered by Claude
        </p>
      </div>
    </div>
  );
}
