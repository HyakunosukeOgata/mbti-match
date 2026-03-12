'use client';

import { useApp } from '@/lib/store';
import { useRouter, useParams } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { mockUsers } from '@/lib/mock-data';
import { ArrowLeft, Send, Shield, Flag } from 'lucide-react';

export default function ChatPage() {
  const { currentUser, matches, sendMessage } = useApp();
  const router = useRouter();
  const params = useParams();
  const matchId = params.id as string;
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showReport, setShowReport] = useState(false);

  const match = matches.find(m => m.id === matchId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [match?.messages.length]);

  useEffect(() => {
    if (!currentUser) {
      router.replace('/');
    }
  }, [currentUser, router]);

  if (!currentUser) return null;

  if (!match) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <p className="text-text-secondary">找不到這個對話</p>
      </div>
    );
  }

  const otherId = match.users.find(id => id !== currentUser.id);
  const otherUser = mockUsers.find(u => u.id === otherId);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(matchId, input.trim());
    setInput('');
  };

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <button onClick={() => router.push('/matches')} className="text-text-secondary hover:text-text">
          <ArrowLeft size={22} />
        </button>
        <img
          src={otherUser?.photos[0]}
          alt={otherUser?.name}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="flex-1">
          <p className="font-bold text-sm">{otherUser?.name}</p>
          <span className="mbti-badge !text-xs !py-0 !px-2">{otherUser?.mbtiCode}</span>
        </div>
        <button
          onClick={() => setShowReport(!showReport)}
          className="text-text-secondary hover:text-danger p-2"
        >
          <Shield size={18} />
        </button>
      </div>

      {/* 檢舉選單 */}
      {showReport && (
        <div className="mx-4 mt-2 p-3 rounded-xl bg-bg-card border border-border animate-fade-in">
          <div className="flex gap-2">
            <button
              className="btn-secondary flex-1 text-sm flex items-center justify-center gap-1 !text-danger !border-danger/30"
              onClick={() => { alert('已檢舉此用戶（Demo）'); setShowReport(false); }}
            >
              <Flag size={14} /> 檢舉
            </button>
            <button
              className="btn-secondary flex-1 text-sm"
              onClick={() => { alert('已封鎖此用戶（Demo）'); setShowReport(false); router.push('/matches'); }}
            >
              🚫 封鎖
            </button>
          </div>
        </div>
      )}

      {/* 話題卡片 */}
      <div className="mx-4 mt-3 p-3 rounded-lg bg-bg-input border border-border">
        <p className="text-xs text-text-secondary mb-1">配對話題</p>
        <p className="text-sm">{match.topic.text}</p>
      </div>

      {/* 訊息列表 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {match.messages.map((msg) => {
          const isMe = msg.senderId === currentUser.id;
          const isSystem = msg.senderId === 'system';

          return (
            <div
              key={msg.id}
              className={`flex ${isSystem ? 'justify-center' : isMe ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`chat-bubble ${isSystem ? 'system' : isMe ? 'mine' : 'theirs'}`}>
                {msg.text}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* 輸入框 */}
      <div className="p-4 border-t border-border flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="輸入訊息..."
          className="flex-1"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{
            background: input.trim() ? 'var(--primary)' : 'var(--bg-input)',
          }}
        >
          <Send size={18} color={input.trim() ? 'white' : 'var(--text-secondary)'} />
        </button>
      </div>
    </div>
  );
}
