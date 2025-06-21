
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Document, ChatMessage } from '../types';
import { generateTextStream, generateJson, isAIServiceAvailable } from '../services/geminiService';
import Button from './common/Button';
import LoadingSpinner from './common/LoadingSpinner';
import { PaperAirplaneIcon, MicrophoneIcon, LightBulbIcon } from '../constants';

// Manual Type Definitions for Web Speech API
// These are typically provided by lib.dom.d.ts, but declaring them manually can help in environments where it's not picked up.
interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string; // Simplification, actual type is SpeechRecognitionErrorCode
  readonly message: string;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  readonly isFinal: boolean;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
  readonly interpretation?: any;
  readonly emma?: Document;
}

interface SpeechGrammar {
  src: string;
  weight?: number;
}
declare var SpeechGrammar: {
  prototype: SpeechGrammar;
  new(): SpeechGrammar;
};

interface SpeechGrammarList {
  readonly length: number;
  item(index: number): SpeechGrammar;
  [index: number]: SpeechGrammar;
  addFromString(string: string, weight?: number): void;
  addFromURI(src: string, weight?: number): void;
}
declare var SpeechGrammarList: {
  prototype: SpeechGrammarList;
  new(): SpeechGrammarList;
};
interface SpeechRecognitionStatic {
  new(): SpeechRecognition;
}
interface SpeechRecognition extends EventTarget {
  grammars: SpeechGrammarList;
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  serviceURI?: string; // Optional

  onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;

  abort(): void;
  start(): void;
  stop(): void;

  addEventListener<K extends keyof SpeechRecognitionEventMap>(type: K, listener: (this: SpeechRecognition, ev: SpeechRecognitionEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
  removeEventListener<K extends keyof SpeechRecognitionEventMap>(type: K, listener: (this: SpeechRecognition, ev: SpeechRecognitionEventMap[K]) => any, options?: boolean | EventListenerOptions): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
}

declare var SpeechRecognition: SpeechRecognitionStatic;
declare var webkitSpeechRecognition: SpeechRecognitionStatic; // For Chrome


interface SpeechRecognitionEventMap {
  "audiostart": Event;
  "audioend": Event;
  "end": Event;
  "error": SpeechRecognitionErrorEvent; // Use the specific error event type
  "nomatch": SpeechRecognitionEvent;
  "result": SpeechRecognitionEvent;
  "soundstart": Event;
  "soundend": Event;
  "speechstart": Event;
  "speechend": Event;
  "start": Event;
}


interface AIQueryAgentProps {
  documents: Document[];
}

const suggestedPrompts: string[] = [
    "Can you summarize a document for me?",
    "What are the latest updates?",
    "Compare two topics.",
    "Explain a concept in simple terms."
];

const AIQueryAgent: React.FC<AIQueryAgentProps> = ({ documents }) => {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);
  const [speechApiSupported, setSpeechApiSupported] = useState(false);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  useEffect(() => {
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      setSpeechApiSupported(true);
      const recognitionInstance: SpeechRecognition = new SpeechRecognitionAPI();
      recognitionInstance.continuous = true; 
      recognitionInstance.interimResults = true; 

      recognitionInstance.onstart = () => {
        setIsRecording(true);
        setSpeechError(null);
      };

      recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } 
        }
        if (finalTranscript) {
          setCurrentQuestion(prev => (prev.trim() ? prev + ' ' : '') + finalTranscript.trim());
        }
      };

      recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error', event.error);
        if (event.error === 'no-speech') {
          setSpeechError('No speech detected. Please try again.');
        } else if (event.error === 'audio-capture') {
          setSpeechError('Microphone problem. Please check your microphone and permissions.');
        } else if (event.error === 'not-allowed') {
          setSpeechError('Permission to use microphone was denied. Please enable it in your browser settings.');
        } else if (event.error === 'network'){
            setSpeechError('Network error during speech recognition. Please check your connection.');
        }
         else {
          setSpeechError(`Voice input error: ${event.error}`);
        }
        setIsRecording(false);
      };

      recognitionInstance.onend = () => {
        setIsRecording(false);
      };
      speechRecognitionRef.current = recognitionInstance;

    } else {
      setSpeechApiSupported(false);
      setSpeechError("Speech recognition is not supported in this browser.");
    }

    return () => { 
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.onstart = null;
        speechRecognitionRef.current.onresult = null;
        speechRecognitionRef.current.onerror = null;
        speechRecognitionRef.current.onend = null;
        speechRecognitionRef.current.stop();
      }
    };
  }, []);

  const handleToggleRecording = () => {
    if (!speechApiSupported || !speechRecognitionRef.current) {
      setSpeechError(speechApiSupported ? "Speech recognition service not initialized." : "Speech recognition is not supported in this browser.");
      return;
    }
    
    if (isRecording) {
      speechRecognitionRef.current.stop();
    } else {
      setSpeechError(null); 
      try {
        speechRecognitionRef.current.start();
      } catch (e) {
         console.error("Error starting speech recognition:", e);
         if (speechRecognitionRef.current && (e as DOMException).name === 'InvalidStateError') {
            // Already started
         } else {
            setSpeechError("Could not start voice input. Please try again.");
         }
         setIsRecording(false);
      }
    }
  };


  const fetchSourceAttribution = async (userQuery: string, context: string, aiAnswer: string): Promise<string[] | undefined> => {
    if (!aiAnswer.trim() || !isAIServiceAvailable()) return undefined;
    
    try {
      const attributionPrompt = `Given the User Question, the Context from documents, and the AI's Answer, list the names of the original documents from the Context that were most relevant for generating this answer. Only list document names that appear in the provided context. If no specific documents were clearly primary sources, respond with an empty list.

User Question: "${userQuery}"

Context Used:
---
${context}
---

AI Answer: "${aiAnswer}"

Relevant Document Names (as a JSON array of strings, e.g., ["doc1.pdf", "policy_update.docx"]):`;

      const result = await generateJson<string[]>(attributionPrompt);
      if (result && Array.isArray(result)) {
        return result.filter(name => typeof name === 'string'); 
      }
      return undefined;
    } catch (error) {
      console.error("Error fetching source attribution:", error);
      return undefined;
    }
  };


  const handleSendMessage = useCallback(async (message?: string) => {
    const query = message || currentQuestion;

    if (speechRecognitionRef.current && isRecording) {
        speechRecognitionRef.current.stop(); 
    }

    if (!query.trim()) return;
    
    if (!isAIServiceAvailable()) {
        alert("AI Service is not available. Please check API key configuration.");
        return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString() + '_user',
      sender: 'user',
      text: query,
      timestamp: new Date(),
    };
    
    const loadingAiMessageId = Date.now().toString() + '_ai_loading';
    setChatHistory(prev => [...prev, userMessage, {
        id: loadingAiMessageId,
        sender: 'ai',
        text: '',
        timestamp: new Date(),
        isLoading: true,
    }]);
    
    const questionToSubmit = query;
    if (!message) { // Only clear currentQuestion if it wasn't a direct suggestion click
       setCurrentQuestion('');
    }
    setIsLoading(true);

    const contextSnippets = documents
      .filter(doc => doc.contentSnippet || doc.fullContent)
      .slice(0, 5) 
      .map(doc => `Document Name: ${doc.name}\nType: ${doc.type}${doc.sourceUrl ? `\nSource URL: ${doc.sourceUrl}` : ''}\nContent Snippet: ${doc.contentSnippet}${doc.fullContent ? `\nFull Content Hint: ${doc.fullContent.substring(0,100)}...` : '' }`)
      .join("\n\n---\n\n");

    const prompt = `You are a helpful AI assistant for the HEREANDNOW AI RESEARCH INSTITUTE. Your knowledge base consists of the following documents. Answer the user's question based ONLY on this information. If the answer is not found in the provided documents, state that clearly. Do not make up information. Be concise and professional.

Knowledge Base:
${contextSnippets.length > 0 ? contextSnippets : "No documents available in the knowledge base."}

User Question: ${questionToSubmit}

Answer:`;
    
    let accumulatedAnswer = "";
    const finalAiMessageId = Date.now().toString() + '_ai_final';

    generateTextStream(
      prompt,
      (chunk) => { 
        accumulatedAnswer += chunk;
        setChatHistory(prev => prev.map(msg => 
            msg.id === loadingAiMessageId && msg.isLoading ? { ...msg, text: accumulatedAnswer } : msg
        ));
      },
      async (error) => { 
        console.error("Streaming error:", error);
        setChatHistory(prev => prev.map(msg => 
             msg.id === loadingAiMessageId && msg.isLoading ? { ...msg, text: "Sorry, an error occurred while generating the answer.", isLoading: false, id: finalAiMessageId } : msg
        ));
        setIsLoading(false);
      },
      async () => { 
        const sources = await fetchSourceAttribution(questionToSubmit, contextSnippets, accumulatedAnswer);
        setChatHistory(prev => prev.map(msg => 
             msg.id === loadingAiMessageId && msg.isLoading ? { ...msg, text: accumulatedAnswer || "No further response.", isLoading: false, id: finalAiMessageId, sources } : msg
        ));
        setIsLoading(false);
      }
    );

  }, [currentQuestion, documents, fetchSourceAttribution, isRecording]);

  const handleSuggestionClick = (promptText: string) => {
    setCurrentQuestion(promptText); // Set the input field
    handleSendMessage(promptText); // And send it immediately
  };


  return (
    <div className="p-4 sm:p-6 h-full flex flex-col max-h-[calc(100vh-120px)]"> {/* Adjust max-h based on header/footer */}
      <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mb-4">AI Query Agent</h2>
      
      {!isAIServiceAvailable() && (
        <div className="p-4 mb-4 text-sm text-amber-700 bg-amber-100 rounded-lg dark:bg-amber-700/30 dark:text-amber-300" role="alert">
          <span className="font-medium">Warning!</span> AI features are currently unavailable. Please ensure the API key is correctly configured.
        </div>
      )}

      <div ref={chatContainerRef} className="flex-grow overflow-y-auto mb-4 p-4 bg-white dark:bg-slate-800 rounded-lg shadow space-y-4">
        {chatHistory.length === 0 && (
          <p className="text-center text-slate-500 dark:text-slate-400">Ask a question about your documents to get started.</p>
        )}
        {chatHistory.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xl p-3 rounded-lg shadow ${
                msg.sender === 'user' 
                ? 'bg-hnai-teal-500 text-white' 
                : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100'
            }`}>
              {msg.isLoading ? <LoadingSpinner size="sm" color={msg.sender === 'user' ? 'text-white': 'text-hnai-teal-500'} /> : <p className="whitespace-pre-wrap">{msg.text}</p>}
              {msg.sender === 'ai' && !msg.isLoading && msg.sources && msg.sources.length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-300 dark:border-slate-600">
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Potential Sources:</p>
                    <ul className="list-disc list-inside text-xs text-slate-500 dark:text-slate-400">
                        {msg.sources.map((source, idx) => (
                            <li key={idx}>{source}</li>
                        ))}
                    </ul>
                </div>
              )}
              <p className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-right text-teal-100' : 'text-left text-slate-500 dark:text-slate-400'}`}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
      </div>
        
      <div className="mt-auto p-4 bg-white dark:bg-slate-800 rounded-lg shadow">
        <div className="flex items-center gap-2">
            <textarea
            rows={1}
            className="flex-grow p-3 border border-slate-300 dark:border-slate-600 rounded-lg resize-none focus:ring-2 focus:ring-hnai-teal-500 focus:border-hnai-teal-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 disabled:opacity-70"
            placeholder={isAIServiceAvailable() ? (isRecording ? "Listening..." : "Ask something or use mic...") : "AI Service Unavailable"}
            value={currentQuestion}
            onChange={(e) => setCurrentQuestion(e.target.value)}
            onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
                }
            }}
            disabled={!isAIServiceAvailable() || isLoading}
            aria-label="Chat input"
            />
            {speechApiSupported && isAIServiceAvailable() && (
                 <Button 
                    onClick={handleToggleRecording}
                    disabled={isLoading} 
                    variant="ghost"
                    className={`aspect-square !p-3 transition-colors duration-150 rounded-full ${isRecording ? '!bg-red-500 hover:!bg-red-600 focus:ring-red-400 text-white' : 'text-hnai-teal-600 hover:bg-hnai-teal-100 dark:hover:bg-hnai-teal-700 focus:ring-hnai-teal-500'}`}
                    aria-label={isRecording ? "Stop recording" : "Start voice input"}
                >
                    <MicrophoneIcon className="w-5 h-5" />
                </Button>
            )}
            <Button 
                onClick={() => handleSendMessage()}
                disabled={!isAIServiceAvailable() || isLoading || !currentQuestion.trim()}
                className="aspect-square !p-3" 
                aria-label="Send message"
            >
            {isLoading ? <LoadingSpinner size="sm" color="text-white" /> : <PaperAirplaneIcon className="w-5 h-5"/>}
            </Button>
        </div>
        
        {isAIServiceAvailable() && (
            <div className="mt-3">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1.5">Suggested Prompts:</p>
                <div className="flex flex-wrap gap-2">
                    {suggestedPrompts.map((prompt, index) => (
                        <Button
                            key={index}
                            variant="secondary"
                            size="sm"
                            onClick={() => handleSuggestionClick(prompt)}
                            disabled={isLoading}
                            className="!font-normal !text-xs !py-1 !px-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-hnai-teal-700 dark:text-hnai-teal-300 border border-slate-200 dark:border-slate-600"
                            leftIcon={<LightBulbIcon className="w-3.5 h-3.5" />}
                            title={`Use prompt: ${prompt}`}
                        >
                            {prompt}
                        </Button>
                    ))}
                </div>
            </div>
        )}

        {speechError && <p className="text-red-500 text-xs mt-2 text-center">{speechError}</p>}
        {!speechApiSupported && isAIServiceAvailable() && <p className="text-amber-600 dark:text-amber-400 text-xs mt-2 text-center">Voice input is not supported by your browser.</p>}
      </div>
    </div>
  );
};

export default AIQueryAgent;
