import { useState, useRef, useEffect } from 'react';
import { Bot, Send, User } from 'lucide-react';
import { aiApi } from '../services/api';

interface Message { role: 'user' | 'assistant'; content: string; }

export default function AiAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([{ role: 'assistant', content: "Hello! I'm TaskFlow AI. I can help you manage tasks, check on team progress, review code, or generate test cases." }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function send() {
    if (!input.trim() || loading) return;
    const msg = input.trim(); setInput('');
    setMessages((m) => [...m, { role: 'user', content: msg }]);
    setLoading(true);
    try {
      const { reply } = await aiApi.chat(msg);
      setMessages((m) => [...m, { role: 'assistant', content: reply }]);
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: 'Error — please try again.' }]);
    } finally { setLoading(false); }
  }

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-8rem)]">
      <div className="mb-4"><h1 className="text-xl font-bold text-white">AI Assistant</h1></div>
      <div className="card flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'assistant' ? 'bg-indigo-600' : 'bg-slate-600'}`}>
                {msg.role === 'assistant' ? <Bot className="w-4 h-4 text-white" /> : <User className="w-4 h-4 text-white" />}
              </div>
              <div className={`max-w-[75%] rounded-xl px-4 py-2 text-sm ${msg.role === 'assistant' ? 'bg-slate-700 text-slate-200' : 'bg-indigo-600 text-white'}`}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {loading && <div className="flex gap-3"><div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center"><Bot className="w-4 h-4 text-white" /></div><div className="bg-slate-700 rounded-xl px-4 py-3 flex gap-1">{[0,1,2].map(i=><div key={i} className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{animationDelay:`${i*0.15}s`}}/>)}</div></div>}
          <div ref={bottomRef} />
        </div>
        <div className="flex gap-2 pt-4 border-t border-slate-700">
          <input className="input flex-1" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()} placeholder="Ask anything about your tasks or team…" />
          <button className="btn-primary px-3" onClick={send} disabled={loading || !input.trim()}><Send className="w-4 h-4" /></button>
        </div>
      </div>
    </div>
  );
}
