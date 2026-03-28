'use client';

import { useApp } from '@/lib/store';
import { compressImage } from '@/lib/compressImage';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Flag, ImagePlus, Send, Shield, Sparkles } from 'lucide-react';
import PhotoGallery from '@/components/PhotoGallery';
import { calculateCompatibility, getCompatibilityInsight } from '@/lib/matching';
import { track } from '@/lib/analytics';
import { moderateText } from '@/lib/moderation';
import { supabase } from '@/lib/supabase';

type PhotoConsentStatus = 'none' | 'requested' | 'approved' | 'denied';

function isUuidLike(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export default function ChatClient({ matchId }: { matchId: string }) {
  const { currentUser, authReady, session, matches, sendMessage, removeMatch } = useApp();
  const router = useRouter();
  const [input, setInput] = useState('');
  const [showReport, setShowReport] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'report' | 'leave' | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportToast, setReportToast] = useState('');
  const [moderationWarning, setModerationWarning] = useState('');
  const [sending, setSending] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showPhotoConsent, setShowPhotoConsent] = useState(false);
  const [photoConsentStatus, setPhotoConsentStatus] = useState<PhotoConsentStatus>('none');
  const [photoConsentRequester, setPhotoConsentRequester] = useState<string | null>(null);
  const [dbStarters, setDbStarters] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const REPORT_REASONS = ['不當言行', '假帳號 / 詐騙', '騷擾或威脅', '不雅照片', '未成年', '其他'];

  const match = matches.find((item) => item.id === matchId);
  const isMatchMember = !!match && match.users.includes(currentUser?.id || '');
  const otherUser = match?.otherUser;
  const compat = currentUser && otherUser ? (match?.compatibility || calculateCompatibility(currentUser, otherUser)) : 0;
  const insight = currentUser && otherUser ? getCompatibilityInsight(currentUser, otherUser) : null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [match?.messages.length]);

  useEffect(() => {
    if (!authReady) return;
    if (!currentUser) {
      router.replace('/');
    } else if (!currentUser.onboardingComplete) {
      router.replace(currentUser.aiPersonality ? '/personality' : '/onboarding/ai-chat');
    } else {
      track('page_view', { page: 'chat' });
    }
  }, [authReady, currentUser, router]);

  useEffect(() => {
    if (!currentUser?.dbId || !match || !session?.access_token) return;

    const markRead = async () => {
      await fetch('/api/social/messages', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ matchId, action: 'mark-read' }),
      }).catch(() => undefined);
    };

    void markRead();
  }, [currentUser?.dbId, match, matchId, session?.access_token]);

  const handleBlock = async () => {
    if (!session?.access_token) return;

    const response = await fetch('/api/social/matches', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ matchId, action: 'block' }),
    });

    setConfirmAction(null);
    setShowReport(false);

    if (!response.ok) {
      setReportToast('操作失敗，請稍後再試');
      setTimeout(() => setReportToast(''), 2500);
      return;
    }

    setReportToast('已離開對話');
    setTimeout(() => setReportToast(''), 2500);
    router.push('/matches');
  };

  useEffect(() => {
    if (!currentUser?.dbId || !match) return;

    const loadConsent = async () => {
      const { data } = await supabase
        .from('photo_consents')
        .select('status, requester_id')
        .eq('match_id', matchId)
        .maybeSingle();

      if (!data) {
        setPhotoConsentStatus('none');
        setPhotoConsentRequester(null);
        return;
      }

      setPhotoConsentStatus((data.status as PhotoConsentStatus) || 'none');
      setPhotoConsentRequester(data.requester_id || null);
    };

    void loadConsent();

    const channel = supabase
      .channel(`photo-consent-${matchId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'photo_consents', filter: `match_id=eq.${matchId}` }, () => { void loadConsent(); })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [currentUser?.dbId, match, matchId]);

  // Load AI-generated conversation starters from DB
  useEffect(() => {
    if (!matchId || !isUuidLike(matchId)) return;
    supabase
      .from('conversation_starters')
      .select('starters')
      .eq('match_id', matchId)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.starters && Array.isArray(data.starters) && data.starters.length > 0) {
          setDbStarters(data.starters);
        }
      });
  }, [matchId]);

  if (!isUuidLike(matchId)) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-4">
        <p className="text-text-secondary">找不到這個對話</p>
        <button className="btn-primary !w-auto !px-8" onClick={() => router.push('/matches')}>返回配對列表</button>
      </div>
    );
  }

  if (!authReady || !currentUser) return null;

  if (!match || !isMatchMember || !otherUser) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-4">
        <p className="text-text-secondary">找不到這個對話</p>
        <button className="btn-primary !w-auto !px-8" onClick={() => router.push('/matches')}>返回配對列表</button>
      </div>
    );
  }

  const handleSend = async () => {
    if (!input.trim() || sending || uploadingImage) return;
    const check = moderateText(input.trim());
    if (!check.allowed) {
      setModerationWarning(check.reason || '訊息無法發送');
      setTimeout(() => setModerationWarning(''), 3000);
      return;
    }

    setSending(true);
    await sendMessage(matchId, { text: input.trim() });
    setInput('');
    setSending(false);
  };

  const useStarter = (starter: string) => {
    setInput(starter);
  };

  const handlePickImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file || uploadingImage || sending) return;
    if (!file.type.startsWith('image/')) {
      setReportToast('只能上傳圖片檔');
      setTimeout(() => setReportToast(''), 2500);
      return;
    }

    const caption = input.trim();
    if (caption) {
      const check = moderateText(caption);
      if (!check.allowed) {
        setModerationWarning(check.reason || '圖片說明無法送出');
        setTimeout(() => setModerationWarning(''), 3000);
        return;
      }
    }

    try {
      setUploadingImage(true);
      const imageDataUrl = await compressImage(file, 1280, 0.82);
      await sendMessage(matchId, { text: caption, imageDataUrl });
      setInput('');
    } catch {
      setReportToast('圖片送出失敗，請稍後再試');
      setTimeout(() => setReportToast(''), 2500);
    } finally {
      setUploadingImage(false);
    }
  };

  const submitReport = async () => {
    if (!currentUser.dbId || !otherUser.dbId || !reportReason || !session?.access_token) return;

    try {
      const res = await fetch('/api/social/report', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportedUserDbId: otherUser.dbId,
          matchId,
          reason: reportReason,
        }),
      });

      setConfirmAction(null);
      setShowReport(false);
      setReportReason('');

      if (res.ok) {
        setReportToast('已收到你的檢舉，我們會儘快處理');
        track('report_user', { reportedUserId: otherUser.id, reason: reportReason });
      } else {
        setReportToast('送出檢舉失敗，請稍後再試');
      }
    } catch {
      setConfirmAction(null);
      setShowReport(false);
      setReportReason('');
      setReportToast('送出檢舉失敗，請稍後再試');
    }
    setTimeout(() => setReportToast(''), 3000);
  };

  const requestPhotoConsent = async () => {
    if (!currentUser.dbId) return;

    const { data: existing } = await supabase
      .from('photo_consents')
      .select('id')
      .eq('match_id', matchId)
      .maybeSingle();

    if (existing?.id) {
      await supabase.from('photo_consents').update({ status: 'requested', requester_id: currentUser.dbId }).eq('match_id', matchId);
    } else {
      await supabase.from('photo_consents').insert({ match_id: matchId, requester_id: currentUser.dbId, status: 'requested' });
    }

    setShowPhotoConsent(false);
  };

  const updatePhotoConsent = async (status: 'approved' | 'denied') => {
    await supabase.from('photo_consents').update({ status }).eq('match_id', matchId);
  };

  return (
    <div className="min-h-dvh flex flex-col">
      <div className="flex items-center gap-3 px-4 py-3" style={{ background: '#FFFFFF', backdropFilter: 'blur(20px)', borderBottom: '1px solid #F2E8E0', paddingTop: 'max(12px, env(safe-area-inset-top, 12px))' }}>
        <button aria-label="返回" onClick={() => router.push('/matches')} className="text-text-secondary hover:text-primary p-2.5 -ml-1 rounded-xl transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
          <ArrowLeft size={22} />
        </button>
        <PhotoGallery photos={otherUser.photos} name={otherUser.name} mode="thumbnail" size="w-10 h-10" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-semibold text-[15px] leading-tight truncate">{otherUser.name}</p>
            {otherUser.aiPersonality?.values?.[0] && <span className="personality-badge !text-[10px] !py-0 !px-1.5 shrink-0">{otherUser.aiPersonality.values[0]}</span>}
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
              onClick={() => setConfirmAction('leave')}
            >
              👋 離開對話
            </button>
          </div>
        </div>
      )}

      {confirmAction && (
        <div className="mx-4 mt-2 p-4 rounded-2xl glass-card animate-scale-in" role="dialog" aria-modal="true" aria-label={confirmAction === 'report' ? '檢舉用戶' : '離開對話'}>
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
                  onClick={() => { void submitReport(); }}
                >
                  確認檢舉
                </button>
              </div>
            </>
          ) : confirmAction === 'leave' ? (
            <>
              <p className="text-sm font-medium text-center mb-3">確定要離開這個對話嗎？離開後將不再看到對方，也不會再被推薦。</p>
              <div className="flex gap-2">
                <button className="btn-secondary flex-1 text-sm" onClick={() => { setConfirmAction(null); setShowReport(false); }}>取消</button>
                <button
                  className="btn-primary flex-1 text-sm !bg-red-500"
                  onClick={() => { void handleBlock(); }}
                >
                  確認離開
                </button>
              </div>
            </>
          ) : null}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5" style={{ overscrollBehavior: 'contain', background: '#FFF9F5' }}>
        {/* Topic question + both answers */}
        {match.topic?.text && (
          <div className="mb-4 animate-fade-in">
            <div className="p-4 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(255,140,107,0.08), rgba(255,107,107,0.06))', border: '1px solid rgba(255,140,107,0.12)' }}>
              <p className="text-xs font-semibold text-text-secondary mb-2 flex items-center gap-1">💬 配對話題</p>
              <p className="text-sm font-medium mb-3">{match.topic.text}</p>
              {Object.keys(match.topicAnswers).length > 0 && (
                <div className="space-y-2">
                  {Object.entries(match.topicAnswers).map(([userId, answer]) => {
                    const isMe = userId === currentUser.id;
                    const name = isMe ? '你' : (otherUser?.name || '對方');
                    return (
                      <div key={userId} className="flex gap-2">
                        <span className="text-xs font-semibold shrink-0 mt-0.5" style={{ color: isMe ? 'var(--primary)' : '#6366F1' }}>{name}：</span>
                        <p className="text-xs text-text leading-relaxed">{answer}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {insight && (
          <div className="mb-4 animate-fade-in">
            <div className="p-4 rounded-2xl" style={{ background: '#FFFFFF', border: '1px solid rgba(255,140,107,0.12)' }}>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={14} className="text-primary" />
                <p className="text-xs font-semibold text-text-secondary">默契速覽</p>
              </div>
              <p className="text-sm font-medium mb-3">{insight.summary}</p>
              <div className="space-y-1.5 mb-3">
                {insight.strengths.slice(0, 2).map((item) => (
                  <p key={item} className="text-xs text-text">• {item}</p>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {(dbStarters.length > 0 ? dbStarters : insight.starters).map((starter) => (
                  <button
                    key={starter}
                    type="button"
                    className="pill text-[11px] border-0 cursor-pointer"
                    onClick={() => useStarter(starter)}
                  >
                    {starter}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {match.messages.length === 0 && (
          <div className="animate-fade-in space-y-3 py-2">
            <div className="flex justify-center">
              <div className="chat-bubble system">🎉 配對成功！{insight?.summary || '從今天的話題開始聊聊吧。'}</div>
            </div>
            {(() => { const starters = dbStarters.length > 0 ? dbStarters : (insight?.starters || []); return starters.length > 0; })() && (
              <div className="px-2">
                <p className="text-xs text-text-secondary text-center mb-2">{dbStarters.length > 0 ? '✨ AI 為你準備的開場白：' : '不知道說什麼？試試這些開場：'}</p>
                <div className="space-y-2">
                  {(dbStarters.length > 0 ? dbStarters : (insight?.starters || [])).map((starter) => (
                    <button
                      key={starter}
                      type="button"
                      className="w-full text-left text-sm px-4 py-3 rounded-2xl transition-all active:scale-[0.98]"
                      style={{ background: 'rgba(255,140,107,0.08)', border: '1px solid rgba(255,140,107,0.15)' }}
                      onClick={() => useStarter(starter)}
                    >
                      💬 {starter}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {match.messages.map((msg, index) => {
          const isMe = msg.senderId === currentUser.id;
          const next = match.messages[index + 1];
          const showTime = !next || next.senderId !== msg.senderId || new Date(next.timestamp).getTime() - new Date(msg.timestamp).getTime() > 60000;

          return (
            <div
              key={msg.id}
              className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${isMe ? 'animate-msg-mine' : 'animate-msg-theirs'}`}
            >
              <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`} style={{ maxWidth: '78%' }}>
                <div className={`chat-bubble ${isMe ? 'mine' : 'theirs'} ${msg.type === 'image' ? 'chat-bubble-image' : ''}`}>
                  {msg.type === 'image' && msg.imageUrl && (
                    <a href={msg.imageUrl} target="_blank" rel="noreferrer" className="chat-image-link">
                      <img src={msg.imageUrl} alt={msg.text || '聊天圖片'} className="chat-image" loading="lazy" />
                    </a>
                  )}
                  {msg.type === 'image' ? (msg.text ? <p className="chat-image-caption">{msg.text}</p> : null) : msg.text}
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

      {showPhotoConsent && photoConsentStatus !== 'approved' && (
        <div className="px-4 py-3 animate-fade-in" style={{ background: 'rgba(255, 140, 107, 0.06)', borderTop: '1px solid rgba(255, 140, 107, 0.12)' }}>
          <p className="text-sm text-text mb-2">要向 {otherUser.name} 申請照片交換權限嗎？</p>
          <p className="text-xs text-text-secondary mb-3">雙方同意後，就可以在這個聊天室直接傳送圖片。</p>
          <div className="flex gap-2">
            <button className="btn-secondary flex-1 text-sm" onClick={() => setShowPhotoConsent(false)}>取消</button>
            <button className="btn-primary flex-1 text-sm" onClick={() => { void requestPhotoConsent(); }}>送出請求</button>
          </div>
        </div>
      )}

      {photoConsentStatus === 'requested' && photoConsentRequester && photoConsentRequester !== currentUser.dbId && (
        <div className="px-4 py-3 animate-fade-in" style={{ background: 'rgba(255, 140, 107, 0.06)', borderTop: '1px solid rgba(255, 140, 107, 0.12)' }}>
          <p className="text-sm text-text mb-2">{otherUser.name} 希望開啟照片交換權限</p>
          <p className="text-xs text-text-secondary mb-3">你可以批准或拒絕。批准後，雙方就能在這個聊天室互傳圖片。</p>
          <div className="flex gap-2">
            <button className="btn-secondary flex-1 text-sm" onClick={() => { void updatePhotoConsent('denied'); }}>拒絕</button>
            <button className="btn-primary flex-1 text-sm" onClick={() => { void updatePhotoConsent('approved'); }}>同意</button>
          </div>
        </div>
      )}

      <div className="px-4 pt-3 flex gap-2.5 items-end" style={{ background: '#FFFFFF', borderTop: '1px solid #F2E8E0', paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))' }}>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { void handlePickImage(e); }} />
        <button
          aria-label="照片交換權限"
          onClick={() => {
            if (photoConsentStatus === 'approved') {
              fileInputRef.current?.click();
            } else if (photoConsentStatus === 'requested' && photoConsentRequester === currentUser.dbId) {
              setReportToast('已送出申請，等待對方回應');
              setTimeout(() => setReportToast(''), 2000);
            } else {
              setShowPhotoConsent(true);
            }
          }}
          disabled={uploadingImage || sending}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: photoConsentStatus === 'approved' ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-input)',
          }}
        >
          <ImagePlus size={18} color={photoConsentStatus === 'approved' ? '#10B981' : 'var(--text-secondary)'} />
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
              void handleSend();
            }
          }}
          placeholder={photoConsentStatus === 'approved' ? '可輸入圖片說明或直接送文字...' : '說點什麼吧...'}
          className="flex-1 !text-[15px] !rounded-full !py-2.5 !px-4 !border-[1.5px]"
        />
        <button
          aria-label="送出訊息"
          onClick={() => { void handleSend(); }}
          disabled={!input.trim() || sending || uploadingImage}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: input.trim() ? 'linear-gradient(135deg, #FF8C6B, #FF6B8A)' : '#FFF5EF',
            boxShadow: input.trim() ? '0 3px 10px rgba(255, 140, 107, 0.28)' : 'none',
          }}
        >
          <Send size={17} color={input.trim() ? 'white' : 'var(--text-secondary)'} />
        </button>
      </div>

      {moderationWarning && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-slide-up" role="alert" aria-live="assertive">
          <div className="px-5 py-3 rounded-2xl shadow-lg text-white text-sm font-medium" style={{ background: 'rgba(220, 38, 38, 0.9)' }}>
            ⚠️ {moderationWarning}
          </div>
        </div>
      )}

      {reportToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-slide-up" role="status" aria-live="polite">
          <div className="px-5 py-3 rounded-2xl shadow-lg text-white text-sm font-medium" style={{ background: 'rgba(30,30,30,0.9)' }}>
            {reportToast}
          </div>
        </div>
      )}

      {uploadingImage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-slide-up" role="status" aria-live="polite">
          <div className="px-5 py-3 rounded-2xl shadow-lg text-white text-sm font-medium" style={{ background: 'rgba(30,30,30,0.9)' }}>
            正在上傳圖片...
          </div>
        </div>
      )}
    </div>
  );
}
