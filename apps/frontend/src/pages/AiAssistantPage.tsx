import { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Sparkles } from 'lucide-react';
import { aiApi } from '../services/api';

interface Message { role: 'user' | 'assistant'; content: string; }

const SUGGESTIONS = [
  'Show me overdue tasks',
  'Which tasks are blocked?',
  'Summarize in-progress work',
  'Who has the most active tasks?',
];

export default function AiAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hi! I'm your TaskFlow AI assistant. I can help you manage tasks, check team progress, generate test cases, or review code. What would you like to know?" },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  async function send(text?: string) {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', content: msg }]);
    setLoading(true);
    try {
      const { reply } = await aiApi.chat(msg);
      setMessages((m) => [...m, { role: 'assistant', content: reply }]);
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: 'Sorry, I encountered an error. Please check your AI configuration in Settings.' }]);
    } finally { setLoading(false); }
  }

  const isFirst = messages.length === 1;

  return (
    <div className="h-full flex flex-col p-5 overflow-hidden">
      <div className="flex items-center gap-3 mb-4 flex-shrink-0">
        <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-900/50">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">AI Assistant</h1>
          <p className="text-xs text-slate-500">Powered by GPT-4o</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'assistant' ? 'bg-indigo-600' : 'bg-slate-600'}`}>
              {msg.role === 'assistant' ? <Bot className="w-3.5 h-3.5 text-white" /> : <User className="w-3.5 h-3.5 text-white" />}
            </div>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${msg.role === 'assistant' ? 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-sm' : 'bg-indigo-600 text-white rounded-tr-sm'}`}>
              <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1 items-center">
              {[0, 1, 2].map((i) => <div key={i} className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      {isFirst && (
        <div className="flex flex-wrap gap-2 mb-3 flex-shrink-0">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => send(s)} className="text-xs px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-full text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors">{s}</button>
          ))}
        </div>
      )}
      <div className="flex gap-2 flex-shrink-0">
        <input className="input flex-1" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()} placeholder="Ask about tasks, team, or code…" disabled={loading} />
        <button className="btn-primary px-4" onClick={() => send()} disabled={loading || !input.trim()}><Send className="w-4 h-4" /></button>
      </div>
    </div>
  );
}
