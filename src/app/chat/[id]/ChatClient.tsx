'use client';

import { useApp } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { mockUsers } from '@/lib/mock-data';
import { ArrowLeft, Send, Shield, Flag, Zap } from 'lucide-react';
import { calculateCompatibility, getSharedAnswers } from '@/lib/matching';
import { track } from '@/lib/analytics';
import { moderateText } from '@/lib/moderation';

export default function ChatClient({ matchId }: { matchId: string }) {
  const { currentUser, matches, sendMessage, removeMatch } = useApp();
  const router = useRouter();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showReport, setShowReport] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'report' | 'block' | null>(null);
  const [reportToast, setReportToast] = useState('');
  const [moderationWarning, setModerationWarning] = useState('');

  const match = matches.find(m => m.id === matchId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [match?.messages.length]);

  useEffect(() => {
    if (!currentUser) {
      router.replace('/');
    } else {
      track('page_view', { page: 'chat' });
    }
  }, [currentUser, router]);

  if (!currentUser) return null;

  if (!match) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-4">
        <p className="text-text-secondary">找不到這個對話</p>
        <button className="btn-primary !w-auto !px-8" onClick={() => router.push('/matches')}>返回配對列表</button>
      </div>
    );
  }

  const otherId = match.users.find(id => id !== currentUser.id);
  const otherUser = mockUsers.find(u => u.id === otherId);
  const compat = otherUser ? calculateCompatibility(currentUser, otherUser) : 0;
  const shared = otherUser ? getSharedAnswers(currentUser, otherUser) : [];

  const handleSend = () => {
    if (!input.trim()) return;
    const check = moderateText(input.trim());
    if (!check.allowed) {
      setModerationWarning(check.reason || '訊息無法發送');
      setTimeout(() => setModerationWarning(''), 3000);
      return;
    }
    sendMessage(matchId, input.trim());
    setInput('');
  };

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3" style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)' }}>
        <button aria-label="返回" onClick={() => router.push('/matches')} className="text-text-secondary hover:text-primary p-1 rounded-xl transition-colors">
          <ArrowLeft size={22} />
        </button>
        <div className="w-10 h-10 rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(124, 58, 237, 0.15)' }}>
          <img
            src={otherUser?.photos[0]}
            alt={otherUser?.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1">
          <p className="font-bold text-sm">{otherUser?.name}</p>
          <span className="mbti-badge !text-[10px] !py-0 !px-2">{otherUser?.mbtiCode}</span>
        </div>
        <button
          aria-label="安全選項"
          onClick={() => setShowReport(!showReport)}
          className="text-text-secondary hover:text-danger p-2 rounded-xl transition-colors"
        >
          <Shield size={18} />
        </button>
      </div>

      {showReport && !confirmAction && (
        <div className="mx-4 mt-2 p-3 rounded-2xl glass-card animate-scale-in">
          <div className="flex gap-2">
            <button
              className="btn-secondary flex-1 text-sm flex items-center justify-center gap-1 !text-danger !border-danger/30"
              onClick={() => setConfirmAction('report')}
            >
              <Flag size={14} /> 檢舉
            </button>
            <button
              className="btn-secondary flex-1 text-sm"
              onClick={() => setConfirmAction('block')}
            >
              🚫 封鎖
            </button>
          </div>
        </div>
      )}

      {confirmAction && (
        <div className="mx-4 mt-2 p-4 rounded-2xl glass-card animate-scale-in">
          <p className="text-sm font-medium text-center mb-3">
            {confirmAction === 'report' ? '確定要檢舉此用戶嗎？' : '確定要封鎖此用戶嗎？封鎖後將無法聯繫。'}
          </p>
          <div className="flex gap-2">
            <button className="btn-secondary flex-1 text-sm" onClick={() => { setConfirmAction(null); setShowReport(false); }}>取消</button>
            <button
              className="btn-primary flex-1 text-sm !bg-red-500"
              onClick={() => {
                const action = confirmAction;
                setConfirmAction(null);
                setShowReport(false);
                if (action === 'block') {
                  removeMatch(matchId);
                  router.push('/matches');
                } else {
                  setReportToast('✅ 已收到你的檢舉，我們會儘快處理');
                  setTimeout(() => setReportToast(''), 3000);
                }
              }}
            >
              {confirmAction === 'report' ? '確認檢舉' : '確認封鎖'}
            </button>
          </div>
        </div>
      )}

      {/* Topic card + partner info */}
      <div className="mx-4 mt-3 p-4 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.06), rgba(244, 63, 94, 0.04))' }}>
        <div className="flex items-center gap-2 mb-2">
          <Zap size={14} className="text-primary" />
          <span className="text-xs font-bold text-primary">契合度 {compat}%</span>
        </div>
        <p className="text-xs font-semibold text-primary mb-1">💬 配對話題</p>
        <p className="text-sm font-medium mb-2">{match.topic.text}</p>
        {shared.length > 0 && (
          <div className="pt-2 border-t border-border/50">
            <p className="text-[10px] text-text-secondary mb-1.5">✨ 你們的共同點</p>
            <div className="flex flex-wrap gap-1.5">
              {shared.slice(0, 3).map((s, i) => (
                <span key={i} className="pill text-[10px]">{s.category}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {match.messages.map((msg) => {
          const isMe = msg.senderId === currentUser.id;
          const isSystem = msg.senderId === 'system';

          return (
            <div
              key={msg.id}
              className={`flex ${isSystem ? 'justify-center' : isMe ? 'justify-end' : 'justify-start'} animate-fade-in`}
            >
              <div>
                <div className={`chat-bubble ${isSystem ? 'system' : isMe ? 'mine' : 'theirs'}`}>
                  {msg.text}
                </div>
                {!isSystem && (
                  <p className={`text-[10px] text-text-secondary mt-0.5 ${isMe ? 'text-right' : 'text-left'} px-1 opacity-60`}>
                    {new Date(msg.timestamp).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 flex gap-3" style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', borderTop: '1px solid var(--border)' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="說點什麼吧..."
          className="flex-1"
        />
        <button
          aria-label="送出訊息"
          onClick={handleSend}
          disabled={!input.trim()}
          className="w-11 h-11 rounded-2xl flex items-center justify-center transition-all"
          style={{
            background: input.trim() ? 'linear-gradient(135deg, #7C3AED, #F43F5E)' : 'var(--bg-input)',
            boxShadow: input.trim() ? '0 4px 12px rgba(124, 58, 237, 0.3)' : 'none',
          }}
        >
          <Send size={18} color={input.trim() ? 'white' : 'var(--text-secondary)'} />
        </button>
      </div>

      {/* Moderation warning */}
      {moderationWarning && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
          <div className="px-5 py-3 rounded-2xl shadow-lg text-white text-sm font-medium" style={{ background: 'rgba(220, 38, 38, 0.9)' }}>
            ⚠️ {moderationWarning}
          </div>
        </div>
      )}

      {/* Report toast */}
      {reportToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
          <div className="px-5 py-3 rounded-2xl shadow-lg text-white text-sm font-medium" style={{ background: 'rgba(30,30,30,0.9)' }}>
            {reportToast}
          </div>
        </div>
      )}
    </div>
  );
}
