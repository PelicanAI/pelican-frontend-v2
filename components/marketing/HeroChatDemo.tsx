'use client';

import { useState, useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import Image from 'next/image';

// ============================================================
// DEMO SCRIPT — Edit this array to change what the demo shows.
// Add more entries, change text — animation handles the rest.
// ============================================================
const DEMO_SCRIPT = [
  {
    prompt: 'Why is NVDA down 4% today?',
    response:
      'NVIDIA is down 4.2% today primarily due to new export restrictions announced for AI chips to China and Southeast Asia. The stock dropped from $892 to $854 in early trading. Volume is 2.3x the 30-day average, suggesting institutional selling. The broader SOX semiconductor index is down 2.1%, but NVDA is leading losses due to its outsized exposure to the Chinese data center market (~22% of revenue).',
  },
  {
    prompt: 'Should I buy the dip?',
    response:
      "Based on the last 5 NVDA pullbacks of 4%+ in the past year, the stock recovered within 8 trading days 4 out of 5 times, with a median bounce of 7.2%. However, export restriction events historically take 2-3 weeks to fully price in. If you're looking to enter, a staged approach — 1/3 now, 1/3 at $840 support, 1/3 on confirmation of recovery — would manage your downside while capturing the bounce.",
  },
];
// ============================================================

// Shared styles
const LOGO = '/pelican-logo-transparent.webp';
const avatarStyle: CSSProperties = { borderRadius: 6, flexShrink: 0, marginTop: 2 };
const msgText: CSSProperties = { flex: 1, minWidth: 0, fontSize: 14, lineHeight: 1.625, color: '#f1f5f9' };
const assistantRow: CSSProperties = { display: 'flex', gap: 10, alignItems: 'flex-start' };
const divider = '1px solid rgba(148,163,184,0.1)';

function AssistantRow({ children }: { children: ReactNode }) {
  return (
    <div style={assistantRow}>
      <Image src={LOGO} alt="" width={24} height={24} style={avatarStyle} />
      {children}
    </div>
  );
}

interface DemoMessage { role: 'user' | 'assistant'; content: string }

function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(new DOMException('Aborted', 'AbortError'));
    const id = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => { clearTimeout(id); reject(new DOMException('Aborted', 'AbortError')); }, { once: true });
  });
}

export default function HeroChatDemo() {
  const [messages, setMessages] = useState<DemoMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [streamingText, setStreamingText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [cursorX, setCursorX] = useState(82);
  const [cursorY, setCursorY] = useState(15);
  const [cursorVisible, setCursorVisible] = useState(false);
  const [cursorClicked, setCursorClicked] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, streamingText, isTyping]);

  useEffect(() => {
    const ac = new AbortController();
    const s = ac.signal;
    (async () => {
      try {
        await wait(1200, s);
        while (true) { // eslint-disable-line no-constant-condition
          for (const entry of DEMO_SCRIPT) {
            // Cursor: appear top-right, glide to input
            setCursorX(82); setCursorY(15); setCursorVisible(true);
            await wait(120, s);
            setCursorX(42); setCursorY(90);
            await wait(850, s);
            // Click
            setCursorClicked(true); setInputFocused(true);
            await wait(180, s);
            setCursorClicked(false);
            await wait(180, s);
            setCursorVisible(false);
            await wait(200, s);
            // Type prompt
            for (let i = 1; i <= entry.prompt.length; i++) {
              setInputText(entry.prompt.slice(0, i));
              await wait(42 + Math.random() * 28, s);
              if (i % (8 + Math.floor(Math.random() * 7)) === 0) await wait(90, s);
            }
            await wait(550, s);
            // Send
            const userMsg = entry.prompt;
            setMessages(p => [...p, { role: 'user', content: userMsg }]);
            setInputText(''); setInputFocused(false);
            await wait(350, s);
            // Typing indicator
            setIsTyping(true); await wait(1200, s); setIsTyping(false);
            // Stream response
            const words = entry.response.split(' ');
            for (let i = 1; i <= words.length; i++) {
              setStreamingText(words.slice(0, i).join(' '));
              await wait(28 + Math.random() * 24, s);
            }
            const fullResponse = entry.response;
            setMessages(p => [...p, { role: 'assistant', content: fullResponse }]);
            setStreamingText('');
            await wait(2500, s);
          }
          // Clear and restart
          await wait(3000, s);
          setMessages([]); setStreamingText(''); setInputText('');
          setIsTyping(false); setInputFocused(false);
          await wait(800, s);
        }
      } catch { /* aborted */ }
    })();
    return () => ac.abort();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{
      position: 'relative', width: '100%', maxWidth: 480, margin: '0 auto',
      borderRadius: 16, overflow: 'hidden', background: '#0a0b0f',
      border: '1px solid rgba(168,85,247,0.25)',
      boxShadow: '0 0 80px rgba(168,85,247,0.12), 0 25px 50px rgba(0,0,0,0.5)',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    }}>
      {/* Cursor */}
      <div style={{
        position: 'absolute', left: `${cursorX}%`, top: `${cursorY}%`, zIndex: 50,
        pointerEvents: 'none', opacity: cursorVisible ? 1 : 0,
        transform: cursorClicked ? 'scale(0.8)' : 'scale(1)',
        transition: 'left 0.7s cubic-bezier(0.4,0,0.2,1), top 0.7s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease, transform 0.12s ease',
        willChange: 'left, top, opacity, transform',
      }}>
        <svg width="16" height="20" viewBox="0 0 16 22" fill="none">
          <path d="M1.5 1L1.5 16.5L5.5 12L9.5 20L12 18.5L8 11L14 11L1.5 1Z" fill="white" stroke="#1a1a2e" strokeWidth="1" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: divider, background: '#12141a' }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <Image src={LOGO} alt="Pelican" width={28} height={28} style={{ borderRadius: 8 }} />
          <div style={{ position: 'absolute', bottom: -2, right: -2, width: 10, height: 10, borderRadius: '50%', background: '#22c55e', border: '2px solid #12141a' }} />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9', lineHeight: 1.2 }}>Pelican AI</div>
          <div style={{ fontSize: 11, color: '#22c55e', letterSpacing: '0.04em' }}>Online</div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="hero-chat-scroll" style={{
        height: 340, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 16,
        scrollbarWidth: 'thin', scrollbarColor: 'rgba(148,163,184,0.2) transparent',
      }}>
        {messages.map((msg, i) =>
          msg.role === 'user' ? (
            <div key={i} style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ maxWidth: '85%', fontSize: 14, lineHeight: 1.625, color: '#f1f5f9' }}>{msg.content}</div>
            </div>
          ) : (
            <AssistantRow key={i}><div style={msgText}>{msg.content}</div></AssistantRow>
          ),
        )}
        {isTyping && (
          <AssistantRow>
            <div style={{ display: 'flex', gap: 4, padding: '8px 0' }}>
              {[0, 1, 2].map(d => (
                <div key={d} style={{
                  width: 7, height: 7, borderRadius: '50%', background: '#a855f7',
                  animation: 'heroDotBounce 0.6s infinite ease-in-out', animationDelay: `${d * 0.15}s`,
                }} />
              ))}
            </div>
          </AssistantRow>
        )}
        {streamingText && (
          <AssistantRow><div style={msgText}>{streamingText}</div></AssistantRow>
        )}
      </div>

      {/* Input */}
      <div style={{ padding: '12px 16px 16px', borderTop: divider }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
          background: 'rgba(26,29,36,0.8)', borderRadius: 16, minHeight: 48,
          border: inputFocused ? '1px solid rgba(168,85,247,0.5)' : '1px solid rgba(148,163,184,0.15)',
          boxShadow: inputFocused ? '0 0 0 3px rgba(168,85,247,0.1), 0 2px 8px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.2)',
          transition: 'border-color 0.2s, box-shadow 0.2s',
        }}>
          <div style={{ flex: 1, fontSize: 14, lineHeight: 1.5, color: inputText ? '#f1f5f9' : '#64748b', minHeight: 22, display: 'flex', alignItems: 'center', wordBreak: 'break-word' as const }}>
            {inputText || 'Ask anything about markets...'}
          </div>
          <div style={{
            width: 36, height: 36, borderRadius: '50%', flexShrink: 0, transition: 'background 0.2s',
            background: inputText ? '#a855f7' : 'rgba(148,163,184,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={inputText ? '#0a0b0f' : '#64748b'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" />
            </svg>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes heroDotBounce {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-6px) scale(1.1); }
        }
        .hero-chat-scroll::-webkit-scrollbar { width: 4px; }
        .hero-chat-scroll::-webkit-scrollbar-track { background: transparent; }
        .hero-chat-scroll::-webkit-scrollbar-thumb { background: rgba(148,163,184,0.2); border-radius: 2px; }
      `}</style>
    </div>
  );
}
