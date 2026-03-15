import React, { useState, useRef, useEffect } from 'react';
import { Icons, COLORS } from '../constants';
import { geminiService } from '../services/geminiService';
import { Creator, PaymentTrack } from '../types';
import { Chat, GenerateContentResponse } from "@google/genai";

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface AIChatBotProps {
  creators: Creator[];
  tracks: PaymentTrack[];
}

const AIChatBot: React.FC<AIChatBotProps> = ({ creators, tracks }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "Ready to optimize your recovery strategy. How can I assist you with Promura today?" }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // Explicit typing for the chat instance reference.
  const chatInstance = useRef<Chat | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const toggleChat = () => {
    if (!isOpen && !chatInstance.current) {
      chatInstance.current = geminiService.createChat({ creators, tracks });
    }
    setIsOpen(!isOpen);
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMsg = inputValue;
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      if (!chatInstance.current) {
        chatInstance.current = geminiService.createChat({ creators, tracks });
      }
      
      // Use proper type annotation and text property access
      const result: GenerateContentResponse = await chatInstance.current.sendMessage({ message: userMsg });
      setMessages(prev => [...prev, { role: 'model', text: result.text || "No response generated." }]);
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "I encountered an error connecting to the Promura intelligence system." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button 
        onClick={toggleChat}
        className={`fixed bottom-24 right-6 w-14 h-14 rounded-2xl flex items-center justify-center z-[110] transition-all duration-500 shadow-2xl active:scale-90 ${
          isOpen ? 'bg-zinc-800 rotate-90' : 'bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-blue-500/30'
        }`}
      >
        {isOpen ? <Icons.Close className="text-white" /> : <Icons.Chat className="text-white" />}
      </button>

      {/* Chat Interface */}
      {isOpen && (
        <div className="fixed inset-0 z-[105] bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="absolute bottom-40 right-6 left-6 max-w-lg mx-auto liquid-glass rounded-[2.5rem] h-[60vh] flex flex-col shadow-[0_0_50px_rgba(0,122,255,0.1)] border-white/10 overflow-hidden animate-in slide-in-from-bottom-10 duration-500">
            {/* Header */}
            <header className="p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <Icons.Chat className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-tight uppercase">Promura AI</h3>
                  <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Advanced Intelligence</p>
                </div>
              </div>
            </header>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar"
            >
              {messages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                >
                  <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user' 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/10' 
                    : 'bg-white/5 text-zinc-200 border border-white/5'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex gap-1">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-6 bg-white/5 border-t border-white/5">
              <div className="relative group">
                <input 
                  type="text" 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask for strategy or insights..."
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-5 pr-14 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-zinc-600"
                />
                <button 
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isLoading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white active:scale-90 transition-all disabled:opacity-50"
                >
                  <Icons.Send />
                </button>
              </div>
              <p className="text-[9px] text-zinc-600 text-center mt-3 uppercase font-bold tracking-widest">
                Powered by Gemini 3 Pro Elite
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChatBot;