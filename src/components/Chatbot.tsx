'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Send, Sparkles, Loader2 } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const INITIAL_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Hi, I\u2019m Meri \u2014 Meridian Digital\u2019s AI assistant. Ask me anything about our websites, pricing, process, or how we can help your local business grow. \ud83d\udc4b",
};

const SUGGESTIONS = [
  'How much does a website cost?',
  'How long does it take to build?',
  'Do I need to write the content?',
  'Can you help my restaurant?',
];

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function Chatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to latest message
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, loading]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setError(null);

    const userMsg: ChatMessage = {
      id: makeId(),
      role: 'user',
      content: trimmed,
    };

    // Build history to send (excluding the welcome bubble)
    const history = messages
      .filter((m) => m.id !== 'welcome')
      .map((m) => ({ role: m.role, content: m.content }));

    const payload = {
      messages: [...history, { role: 'user', content: trimmed }],
    };

    const assistantId = makeId();
    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: assistantId, role: 'assistant', content: '' },
    ]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null);
        throw new Error(
          data?.error ?? 'Sorry \u2014 the assistant is unavailable right now.',
        );
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = '';

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        assistantText += chunk;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: assistantText } : m,
          ),
        );
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Sorry \u2014 something went wrong.';
      setError(message);
      // Remove the empty assistant bubble on failure
      setMessages((prev) => prev.filter((m) => m.id !== assistantId));
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    sendMessage(input);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-navy-700 dark:bg-navy-800">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-4 dark:border-navy-700">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-h3 font-sora text-white">Ask Meri</p>
          <p className="text-small text-blue-100">
            {'AI assistant \u00b7 Instant answers'}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="h-80 overflow-y-auto bg-gray-50 px-5 py-4 dark:bg-navy-900"
        aria-live="polite"
        aria-label="Chat messages"
      >
        <div className="flex flex-col gap-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${
                m.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-small ${
                  m.role === 'user'
                    ? 'rounded-br-sm bg-blue-600 text-white'
                    : 'rounded-bl-sm border border-gray-200 bg-white text-gray-700 dark:border-navy-700 dark:bg-navy-800 dark:text-gray-100'
                }`}
              >
                {m.content || (
                  <span className="inline-flex items-center gap-2 text-gray-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {'Thinking\u2026'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Suggestion chips \u2014 only when no user message yet */}
        {messages.length === 1 && !loading ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => sendMessage(s)}
                className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 transition-colors hover:border-blue-500 hover:text-blue-600 dark:border-navy-700 dark:bg-navy-800 dark:text-gray-200"
              >
                {s}
              </button>
            ))}
          </div>
        ) : null}

        {error ? (
          <p className="mt-3 text-small text-rose-500">{error}</p>
        ) : null}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t border-gray-200 bg-white px-4 py-3 dark:border-navy-700 dark:bg-navy-800"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={'Ask about pricing, process, automation\u2026'}
          disabled={loading}
          maxLength={2000}
          className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-small text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60 dark:border-navy-700 dark:bg-navy-900 dark:text-white"
          aria-label="Your message"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Send message"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </button>
      </form>

      {/* Disclaimer */}
      <p className="border-t border-gray-100 bg-gray-50 px-4 py-2 text-center text-xs text-gray-400 dark:border-navy-700 dark:bg-navy-900">
        {'Powered by Claude \u00b7 Responses may contain mistakes. For anything important, book a real call.'}
      </p>
    </div>
  );
}
