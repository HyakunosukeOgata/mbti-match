'use client';

import { useApp } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { mockUsers } from '@/lib/mock-data';
import { ArrowLeft, Send, Shield, Flag } from 'lucide-react';
import PhotoGallery from '@/components/PhotoGallery';
import { calculateCompatibility } from '@/lib/matching';
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
  const [reportReason, setReportReason] = useState('');
  const REPORT_REASONS = ['不當言行', '假帳號 / 詐騙', '騷擾或威脅', '不雅照片', '未成年', '其他'];

  const match = matches.find(m => m.id === matchId);
  const [showSuggestions, setShowSuggestions] = useState(true);

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
      <div className="flex items-center gap-3 px-4 py-3" style={{ background: 'var(--bg-card-alpha)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)', paddingTop: 'max(12px, env(safe-area-inset-top, 12px))' }}>
        <button aria-label="返回" onClick={() => router.push('/matches')} className="text-text-secondary hover:text-primary p-2.5 -ml-1 rounded-xl transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
          <ArrowLeft size={22} />
        </button>
        <PhotoGallery photos={otherUser?.photos || []} name={otherUser?.name || ''} mode="thumbnail" size="w-10 h-10" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-semibold text-[15px] leading-tight truncate">{otherUser?.name}</p>
            <span className="mbti-badge !text-[10px] !py-0 !px-1.5 shrink-0">{otherUser?.mbtiCode}</span>
          </div>
          <p className="text-[11px] text-text-secondary leading-tight mt-0.5">契合度 {compat}%</p>
        </div>
        <button
          aria-label="安全選項"
          onClick={() => setShowReport(!showReport)}
          className="text-text-secondary hover:text-danger p-2.5 -mr-1 rounded-xl transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
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
        <div className="mx-4 mt-2 p-4 rounded-2xl glass-card animate-scale-in" role="dialog" aria-modal="true" aria-label={confirmAction === 'report' ? '檢舉用戶' : '封鎖用戶'}>
          {confirmAction === 'report' ? (
            <>
              <p className="text-sm font-medium text-center mb-3">請選擇檢舉原因</p>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {REPORT_REASONS.map((reason) => (
                  <button
                    key={reason}
                    className={`text-xs py-3 px-3 rounded-xl border transition-all min-h-[44px] ${reportReason === reason ? 'border-danger bg-red-50 text-danger font-bold' : 'border-border text-text-secondary hover:border-danger/30'}`}
                    onClick={() => setReportReason(reason)}
                  >
                    {reason}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button className="btn-secondary flex-1 text-sm" onClick={() => { setConfirmAction(null); setShowReport(false); setReportReason(''); }}>取消</button>
                <button
                  className="btn-primary flex-1 text-sm !bg-red-500"
                  disabled={!reportReason}
                  onClick={() => {
                    // Store report in localStorage
                    if (otherId) {
                      try {
                        const raw = localStorage.getItem('mochi_reports');
                        const reports = raw ? JSON.parse(raw) : [];
                        reports.push({
                          reportedUserId: otherId,
                          reportedName: otherUser?.name || otherId,
                          reason: reportReason,
                          matchId,
                          timestamp: new Date().toISOString(),
                        });
                        localStorage.setItem('mochi_reports', JSON.stringify(reports));
                      } catch { /* ignore */ }
                    }
                    setConfirmAction(null);
                    setShowReport(false);
                    setReportReason('');
                    setReportToast('✅ 已收到你的檢舉，我們會儘快處理');
                    setTimeout(() => setReportToast(''), 3000);
                    track('report_user', { reportedUserId: otherId || '', reason: reportReason });
                  }}
                >
                  確認檢舉
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-center mb-3">確定要封鎖此用戶嗎？封鎖後將無法聯繫。</p>
              <div className="flex gap-2">
                <button className="btn-secondary flex-1 text-sm" onClick={() => { setConfirmAction(null); setShowReport(false); }}>取消</button>
                <button
                  className="btn-primary flex-1 text-sm !bg-red-500"
                  onClick={() => {
                    setConfirmAction(null);
                    setShowReport(false);
                    if (otherId) {
                      try {
                        const raw = localStorage.getItem('mochi_blocked_users');
                        const blocked: string[] = raw ? JSON.parse(raw) : [];
                        if (!blocked.includes(otherId)) {
                          blocked.push(otherId);
                          localStorage.setItem('mochi_blocked_users', JSON.stringify(blocked));
                        }
                        const namesRaw = localStorage.getItem('mochi_blocked_names');
                        const names: Record<string, string> = namesRaw ? JSON.parse(namesRaw) : {};
                        names[otherId] = otherUser?.name || otherId;
                        localStorage.setItem('mochi_blocked_names', JSON.stringify(names));
                      } catch { /* ignore */ }
                    }
                    removeMatch(matchId);
                    router.push('/matches');
                  }}
                >
                  確認封鎖
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1" style={{ overscrollBehavior: 'contain' }}>
        {match.messages.map((msg, index) => {
          const isMe = msg.senderId === currentUser.id;
          const isSystem = msg.senderId === 'system';

          if (isSystem) {
            return (
              <div key={msg.id} className="flex justify-center animate-fade-in py-2">
                <div className="chat-bubble system">{msg.text}</div>
              </div>
            );
          }

          // Only show timestamp on last message in a consecutive group from same sender within 1 minute
          const next = match.messages[index + 1];
          const showTime = !next
            || next.senderId !== msg.senderId
            || next.senderId === 'system'
            || new Date(next.timestamp).getTime() - new Date(msg.timestamp).getTime() > 60000;

          return (
            <div
              key={msg.id}
              className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${isMe ? 'animate-msg-mine' : 'animate-msg-theirs'}`}
            >
              <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`} style={{ maxWidth: '72%' }}>
                <div className={`chat-bubble ${isMe ? 'mine' : 'theirs'}`}>
                  {msg.text}
                </div>
                {showTime && (
                  <p className="text-[11px] text-text-secondary mt-1 px-1 opacity-60">
                    {new Date(msg.timestamp).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick-reply suggestions */}
      {showSuggestions && match.messages.filter(m => m.senderId === currentUser.id).length === 0 && (
        <div className="px-4 pt-2 pb-3 animate-fade-in">
          <p className="text-[11px] text-text-secondary mb-2 font-medium">💡 開場建議</p>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {[
              `哈囉！${match.topic.text.substring(0, 15)}...你覺得呢？`,
              `嗨～看到我們的契合度是 ${compat}%，好開心！`,
              '你好呀 👋 很高興配對到你！',
            ].map((text, i) => (
              <button
                key={i}
                className="text-[13px] px-4 py-2.5 rounded-full transition-all active:scale-95 whitespace-nowrap shrink-0 min-h-[44px]"
                style={{
                  background: 'linear-gradient(135deg, rgba(232, 132, 44, 0.06), rgba(255, 107, 107, 0.04))',
                  border: '1.5px solid rgba(232, 132, 44, 0.18)',
                  color: 'var(--primary)',
                }}
                onClick={() => {
                  setInput(text);
                  setShowSuggestions(false);
                }}
              >
                {text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-4 pt-3 flex gap-2.5 items-end" style={{ background: 'var(--bg-card-alpha)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderTop: '1px solid var(--border)', paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && handleSend()}
          placeholder="說點什麼吧..."
          className="flex-1 !text-[15px] !rounded-full !py-2.5 !px-4 !border-[1.5px]"
        />
        <button
          aria-label="送出訊息"
          onClick={handleSend}
          disabled={!input.trim()}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: input.trim() ? 'linear-gradient(135deg, #E8842C, #FF6B6B)' : 'var(--bg-input)',
            boxShadow: input.trim() ? '0 3px 10px rgba(232, 132, 44, 0.28)' : 'none',
          }}
        >
          <Send size={17} color={input.trim() ? 'white' : 'var(--text-secondary)'} />
        </button>
      </div>

      {/* Moderation warning */}
      {moderationWarning && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-slide-up" role="alert" aria-live="assertive">
          <div className="px-5 py-3 rounded-2xl shadow-lg text-white text-sm font-medium" style={{ background: 'rgba(220, 38, 38, 0.9)' }}>
            ⚠️ {moderationWarning}
          </div>
        </div>
      )}

      {/* Report toast */}
      {reportToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-slide-up" role="status" aria-live="polite">
          <div className="px-5 py-3 rounded-2xl shadow-lg text-white text-sm font-medium" style={{ background: 'rgba(30,30,30,0.9)' }}>
            {reportToast}
          </div>
        </div>
      )}
    </div>
  );
}
