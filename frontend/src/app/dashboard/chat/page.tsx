'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { chatAPI } from '@/lib/api';
import { formatRelativeTime } from '@/lib/utils';
import {
  MessageCircle, Send, Loader2, Sparkles, Trash2, Plus, Clock,
  Bot, User, ChevronLeft, ChevronRight, HelpCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id?: string;
  content: string;
  role: 'user' | 'assistant';
  createdAt?: string;
}

interface Session {
  sessionId: string;
  content: string;
  createdAt: string;
}

const quickPrompts = [
  { label: '🕳️ Report a pothole', prompt: 'How do I report a pothole near my house?' },
  { label: '📊 Track complaint', prompt: 'How can I track the status of my complaint?' },
  { label: '🏆 Earn points', prompt: 'How do I earn points and level up?' },
  { label: '🔍 Find issues', prompt: 'Show me common issues reported in my area' },
  { label: '⚡ Priority levels', prompt: 'What do the different priority levels mean?' },
  { label: '🗳️ Verify reports', prompt: 'How does the community verification system work?' },
];

export default function ChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadSessions = async () => {
    try {
      const { data } = await chatAPI.getSessions();
      setSessions(data || []);
    } catch {
      // ignore
    } finally {
      setLoadingSessions(false);
    }
  };

  const loadSession = async (sid: string) => {
    setSessionId(sid);
    setIsLoading(true);
    try {
      const { data } = await chatAPI.getHistory(sid);
      setMessages(data || []);
    } catch {
      toast.error('Failed to load chat history');
    } finally {
      setIsLoading(false);
      setShowSidebar(false);
    }
  };

  const handleNewChat = () => {
    setSessionId(null);
    setMessages([]);
    setShowSidebar(false);
    inputRef.current?.focus();
  };

  const handleSend = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    const userMessage: Message = { content: text, role: 'user', createdAt: new Date().toISOString() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const { data } = await chatAPI.sendMessage({
        message: text,
        sessionId: sessionId || undefined,
      });

      if (data.sessionId && !sessionId) {
        setSessionId(data.sessionId);
        loadSessions();
      }

      const aiMessage: Message = {
        id: data.messageId,
        content: data.response,
        role: 'assistant',
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to get response');
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleClearHistory = async () => {
    if (!sessionId) return;
    try {
      await chatAPI.clearHistory(sessionId);
      setMessages([]);
      setSessionId(null);
      loadSessions();
      toast.success('Chat history cleared');
    } catch {
      toast.error('Failed to clear history');
    }
  };

  // Simple markdown-ish rendering for AI messages
  const renderContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return <p key={i} className="font-semibold text-foreground">{line.slice(2, -2)}</p>;
      }
      if (line.startsWith('- ') || line.startsWith('• ')) {
        return <p key={i} className="pl-3 before:content-['•'] before:mr-2 before:text-violet-400">{line.slice(2)}</p>;
      }
      if (line.trim() === '') return <br key={i} />;
      return <p key={i}>{line}</p>;
    });
  };

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-8rem)] flex gap-4">
      {/* Sidebar — Sessions */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 glass-strong p-4 transition-transform lg:relative lg:translate-x-0 lg:w-64 lg:shrink-0 lg:rounded-2xl
        ${showSidebar ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Sessions</h3>
          <div className="flex items-center gap-1">
            <button onClick={handleNewChat} className="p-2 rounded-lg hover:bg-accent transition-colors" title="New chat">
              <Plus className="w-4 h-4" />
            </button>
            <button onClick={() => setShowSidebar(false)} className="p-2 rounded-lg hover:bg-accent transition-colors lg:hidden">
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-1 overflow-y-auto max-h-[calc(100%-3rem)]">
          {loadingSessions ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No sessions yet</p>
          ) : (
            sessions.map((session) => (
              <button
                key={session.sessionId}
                onClick={() => loadSession(session.sessionId)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all truncate
                  ${sessionId === session.sessionId
                    ? 'bg-violet-600/20 text-violet-500 border border-violet-500/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'}`}
              >
                <p className="truncate font-medium text-xs">{session.content}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{formatRelativeTime(session.createdAt)}</p>
              </button>
            ))
          )}
        </div>
      </div>

      {showSidebar && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setShowSidebar(false)} />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col glass rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-border">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowSidebar(true)} className="p-1.5 rounded-lg hover:bg-accent lg:hidden">
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">AI Assistant</h2>
              <p className="text-xs text-muted-foreground">Powered by Community Hero AI</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {sessionId && (
              <button onClick={handleClearHistory} className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors" title="Clear history">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 flex items-center justify-center mb-4">
                <Bot className="w-8 h-8 text-violet-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">How can I help you today?</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md">
                Ask me anything about reporting issues, tracking complaints, earning rewards, or navigating Community Hero.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-w-lg">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt.label}
                    onClick={() => handleSend(prompt.prompt)}
                    className="px-3 py-2.5 rounded-xl text-xs font-medium glass hover:bg-accent/50 transition-all text-left"
                  >
                    {prompt.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-slide-up`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold
                  ${msg.role === 'user'
                    ? 'bg-gradient-to-br from-violet-500 to-purple-600'
                    : 'bg-gradient-to-br from-emerald-500 to-teal-600'}`}
                >
                  {msg.role === 'user' ? (user?.name?.charAt(0) || 'U') : <Bot className="w-4 h-4" />}
                </div>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed space-y-1
                  ${msg.role === 'user'
                    ? 'bg-violet-600 text-white rounded-br-md'
                    : 'glass rounded-bl-md text-foreground'}`}
                >
                  {msg.role === 'assistant' ? renderContent(msg.content) : <p>{msg.content}</p>}
                  {msg.createdAt && (
                    <p className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-violet-200' : 'text-muted-foreground'}`}>
                      {formatRelativeTime(msg.createdAt)}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}

          {/* Typing indicator */}
          {isLoading && (
            <div className="flex gap-3 animate-fade-in">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="glass rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Ask anything about Community Hero..."
              disabled={isLoading}
              className="flex-1 px-4 py-3 rounded-xl bg-background border border-input focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm transition-all disabled:opacity-50"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
