'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import Image from 'next/image';
import DOMPurify from 'isomorphic-dompurify';

interface Message {
  type: 'user' | 'bot';
  content: string;
}

interface HelpChatProps {
  logoUrl?: string;
}

export default function HelpChat({ logoUrl = '/pelican-logo-transparent.png' }: HelpChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const sendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { type: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/help-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history: messages
        })
      });

      const data = await response.json();

      if (data.error) {
        setMessages(prev => [...prev, { 
          type: 'bot', 
          content: 'Sorry, something went wrong. Please try again or email support@pelicantrading.ai for help.' 
        }]);
      } else {
        setMessages(prev => [...prev, { type: 'bot', content: data.reply }]);
      }
    } catch {
      setMessages(prev => [...prev, { 
        type: 'bot', 
        content: 'Sorry, I couldn\'t connect. Please try again or email support@pelicantrading.ai for help.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactSupport = () => {
    window.location.href = 'mailto:support@pelicantrading.ai';
  };

  const formatMessage = (content: string) => {
    // Convert email addresses to clickable links
    return content.replace(
      /support@pelicantrading\.ai/g,
      '<a href="mailto:support@pelicantrading.ai" style="color: #a855f7; text-decoration: underline;">support@pelicantrading.ai</a>'
    );
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: '#a855f7',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(168, 85, 247, 0.4)',
          transition: 'all 0.2s ease',
          zIndex: 1055,
          pointerEvents: 'auto',
          visibility: 'visible',
          opacity: 1,
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.boxShadow = '0 6px 30px rgba(168, 85, 247, 0.5)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(168, 85, 247, 0.4)';
        }}
      >
        {isOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0a0b0f" strokeWidth="2.5">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0a0b0f" strokeWidth="2">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '100px',
            right: '24px',
            width: '380px',
            maxWidth: 'calc(100vw - 48px)',
            height: '500px',
            maxHeight: 'calc(100vh - 140px)',
            background: '#12141a',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
            zIndex: 1054,
            fontFamily: "'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px 20px',
              background: '#1a1d24',
              borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <Image
              src={logoUrl}
              alt="Pelican"
              width={32}
              height={32}
              style={{ objectFit: 'contain' }}
            />
            <div>
              <div style={{ 
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: '18px',
                letterSpacing: '0.05em',
                color: '#f1f5f9'
              }}>
                Pelican Help
              </div>
              <div style={{ 
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px',
                color: '#22c55e',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Online
              </div>
            </div>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {/* Welcome message if no messages */}
            {messages.length === 0 && (
              <div
                style={{
                  background: '#1a1d24',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid rgba(148, 163, 184, 0.1)',
                }}
              >
                <div style={{ 
                  fontSize: '14px', 
                  color: '#f1f5f9',
                  marginBottom: '8px'
                }}>
                  👋 Hi! I&apos;m the Pelican assistant.
                </div>
                <div style={{ 
                  fontSize: '13px', 
                  color: '#94a3b8',
                  lineHeight: '1.5'
                }}>
                  Ask me anything about Pelican Trading—features, pricing, data coverage, or how it works.
                </div>
              </div>
            )}

            {/* Message list */}
            {messages.map((msg, index) => (
              <div
                key={index}
                style={{
                  alignSelf: msg.type === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                }}
              >
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: msg.type === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                    background: msg.type === 'user' ? '#a855f7' : '#1a1d24',
                    color: msg.type === 'user' ? '#0a0b0f' : '#f1f5f9',
                    fontSize: '14px',
                    lineHeight: '1.5',
                    border: msg.type === 'user' ? 'none' : '1px solid rgba(148, 163, 184, 0.1)',
                  }}
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(msg.type === 'bot' ? formatMessage(msg.content) : msg.content)
                  }}
                />
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div
                style={{
                  alignSelf: 'flex-start',
                  padding: '12px 16px',
                  borderRadius: '12px 12px 12px 4px',
                  background: '#1a1d24',
                  border: '1px solid rgba(148, 163, 184, 0.1)',
                }}
              >
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#a855f7',
                        animation: 'bounce 1.4s infinite ease-in-out both',
                        animationDelay: `${i * 0.16}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div
            style={{
              padding: '16px',
              borderTop: '1px solid rgba(148, 163, 184, 0.1)',
              background: '#1a1d24',
            }}
          >
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (!isLoading && input.trim()) {
                  sendMessage(e);
                }
              }}
              style={{ display: 'flex', gap: '8px' }}
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about Pelican..."
                disabled={isLoading}
                onContextMenu={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (!isLoading && input.trim()) {
                      sendMessage(e as unknown as FormEvent);
                    }
                  }
                }}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  background: '#12141a',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: '8px',
                  color: '#f1f5f9',
                  fontSize: '14px',
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.5)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.2)';
                }}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                style={{
                  padding: '12px 16px',
                  background: isLoading || !input.trim() ? '#64748b' : '#a855f7',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0a0b0f" strokeWidth="2.5">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
              </button>
            </form>

            {/* Contact support link */}
            <button
              onClick={handleContactSupport}
              style={{
                width: '100%',
                marginTop: '12px',
                padding: '10px',
                background: 'transparent',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                borderRadius: '6px',
                color: '#94a3b8',
                fontSize: '12px',
                fontFamily: "'JetBrains Mono', monospace",
                cursor: 'pointer',
                transition: 'all 0.2s',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(168, 85, 247, 0.1)';
                e.currentTarget.style.borderColor = '#a855f7';
                e.currentTarget.style.color = '#f1f5f9';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.3)';
                e.currentTarget.style.color = '#94a3b8';
              }}
            >
              Contact Support →
            </button>
          </div>
        </div>
      )}

      {/* Animation styles */}
      <style jsx global>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
      `}</style>
    </>
  );
}

