import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Send, Bot, User, Zap } from 'lucide-react';
import { aiApi } from '../services/api';
import clsx from 'clsx';

interface Message { role: 'user' | 'assistant'; content: string; }

const SUGGESTIONS = [
  'Summarize all blocked tasks',
  'Which team member has the most tasks?',
  'What tasks are overdue?',
  'Generate a sprint report',
];

export default function AiAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const send = useMutation({
    mutationFn: (message: string) => aiApi.chat(message),
    onSuccess: (data) => {
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply || data.message || 'No response.' }]);
    },
  });

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = (text?: string) => {
    const msg = text ?? input.trim();
    if (!msg) return;
    setMessages((prev) => [...prev, { role: 'user', content: msg }]);
    setInput('');
    send.mutate(msg);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 flex items-center gap-3 px-6 py-4 border-b border-slate-800">
        <div className="w-8 h-8 bg-purple-600/20 border border-purple-600/40 rounded-lg flex items-center justify-center">
          <Zap className="w-4 h-4 text-purple-400" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-white">AI Assistant</h1>
          <p className="text-[11px] text-slate-500">Ask anything about your projects</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-6 pb-10">
            <Bot className="w-16 h-16 text-slate-700" />
            <div className="text-center">
              <p className="text-slate-300 font-medium">How can I help you today?</p>
              <p className="text-slate-600 text-sm mt-1">Ask me anything about your tasks and projects</p>
            </div>
            <div className="grid grid-cols-2 gap-2 w-full max-w-md">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => handleSend(s)} className="text-left p-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-500 text-xs text-slate-300 transition-all">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={clsx('flex gap-3', m.role === 'user' ? 'justify-end' : 'justify-start')}>
            {m.role === 'assistant' && (
              <div className="w-7 h-7 bg-purple-600/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5 text-purple-400" />
              </div>
            )}
            <div className={clsx('max-w-[75%] rounded-2xl px-4 py-3 text-sm', m.role === 'user' ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-sm')}>
              <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
            </div>
            {m.role === 'user' && (
              <div className="w-7 h-7 bg-indigo-600/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <User className="w-3.5 h-3.5 text-indigo-400" />
              </div>
            )}
          </div>
        ))}
        {send.isPending && (
          <div className="flex gap-3">
            <div className="w-7 h-7 bg-purple-600/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Bot className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1">
                {[0,1,2].map((i) => <div key={i} className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="flex-shrink-0 p-4 border-t border-slate-800">
        <div className="flex gap-3">
          <input
            className="input flex-1"
            placeholder="Ask about tasks, projects, team performance…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          />
          <button className="btn-primary px-4" onClick={() => handleSend()} disabled={!input.trim() || send.isPending}>
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
