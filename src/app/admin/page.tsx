'use client';

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { getMessagePreview } from '@/lib/chat-message';
import { UserProfile, Match, LikeAction, DailyCard, ChatMessage } from '@/lib/types';
import {
  Shield, Users, MessageCircle, Heart, BarChart3, Search, Eye, ChevronLeft,
  ArrowLeft, Clock, User, Activity, TrendingUp, AlertTriangle, RefreshCw, Flag,
} from 'lucide-react';

interface AnalyticsEvent {
  id: string;
  name: string;
  props?: Record<string, string | number | boolean>;
  ts: string;
}

interface Report {
  id: string;
  reporterUserId: string;
  reporterName: string;
  reportedUserId: string;
  reportedName: string;
  reason: string;
  matchId: string;
  timestamp: string;
  status: 'pending' | 'reviewed' | 'dismissed';
}

interface AdminData {
  users: UserProfile[];
  matches: Match[];
  likes: LikeAction[];
  dailyCards: DailyCard[];
  events: AnalyticsEvent[];
  reports: Report[];
}

function tsToStr(ts: number | string) {
  const d = typeof ts === 'number' ? new Date(ts) : new Date(ts);
  return d.toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });
}

function findUserName(id: string, users: UserProfile[]): string {
  const user = users.find((item) => item.id === id);
  if (user) return user.name;
  if (id === 'system') return '系統';
  return id;
}

// ============================
// Admin Page
// ============================
type Tab = 'overview' | 'users' | 'matches' | 'analytics' | 'reports';

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('overview');
  const [adminCode, setAdminCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AdminData | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  const refresh = useCallback(async (overrideCode?: string) => {
    const effectiveCode = overrideCode || adminCode;
    if (!effectiveCode) return;

    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'x-admin-code': effectiveCode,
        },
      });

      if (!response.ok) {
        setAuthed(false);
        setData(null);
        setError(response.status === 401 ? '存取碼錯誤' : '載入後台資料失敗');
        return;
      }

      const nextData = await response.json() as AdminData;
      setAdminCode(effectiveCode);
      setAuthed(true);
      setData(nextData);
    } catch {
      setError('載入後台資料失敗');
    } finally {
      setLoading(false);
    }
  }, [adminCode]);

  useEffect(() => {
    if (authed && adminCode) {
      void refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed]);

  // Reset detail views when changing tab
  useEffect(() => {
    setSelectedUser(null);
    setSelectedMatch(null);
  }, [tab]);

  // ============================
  // Login Gate
  // ============================
  if (!authed) {
    return (
      <div style={styles.loginContainer}>
        <div style={styles.loginCard}>
          <Shield size={40} color="#FF8C6B" />
          <h1 style={styles.loginTitle}>Mochi 管理後台</h1>
          <p style={styles.loginSubtitle}>請輸入管理員存取碼</p>
          <input
            type="password"
            value={code}
            onChange={e => { setCode(e.target.value); setError(''); }}
            onKeyDown={async e => {
              if (e.key === 'Enter') {
                void refresh(code);
              }
            }}
            placeholder="存取碼"
            style={styles.loginInput}
            autoFocus
          />
          {error && <p style={styles.error}>{error}</p>}
          <button
            onClick={() => {
              void refresh(code);
            }}
            style={styles.loginBtn}
            disabled={loading}
          >
            {loading ? '載入中...' : '進入後台'}
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { users, matches, likes, dailyCards, events, reports } = data;
  const totalMessages = matches.reduce((n, m) => n + m.messages.length, 0);
  const newestUser = users[0] || null;

  // ============================
  // Tab renderers
  // ============================

  const renderOverview = () => (
    <div>
      <div style={styles.statsGrid}>
        <StatCard icon={<Users size={22} />} label="系統用戶" value={users.length} color="#FF8C6B" />
        <StatCard icon={<Heart size={22} />} label="送出喜歡" value={likes.length} color="#FF6B6B" />
        <StatCard icon={<MessageCircle size={22} />} label="配對數" value={matches.length} color="#0D9668" />
        <StatCard icon={<Activity size={22} />} label="訊息總數" value={totalMessages} color="#B27D00" />
        <StatCard icon={<BarChart3 size={22} />} label="分析事件" value={events.length} color="#6366F1" />
        <StatCard icon={<TrendingUp size={22} />} label="今日卡片" value={dailyCards.length} color="#FFB088" />
      </div>

      {newestUser && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>最新註冊用戶</h3>
          <div style={styles.infoCard}>
            <div style={styles.infoRow}><strong>名稱：</strong>{newestUser.name}</div>
            <div style={styles.infoRow}><strong>ID：</strong><span style={styles.mono}>{newestUser.id}</span></div>
            <div style={styles.infoRow}><strong>AI 個性：</strong>{newestUser.aiPersonality ? newestUser.aiPersonality.values.slice(0, 3).join('、') : '尚未分析'}</div>
            <div style={styles.infoRow}><strong>性別：</strong>{genderLabel(newestUser.gender)}</div>
            <div style={styles.infoRow}><strong>年齡：</strong>{newestUser.age}</div>
            <div style={styles.infoRow}><strong>地區：</strong>{newestUser.preferences.region}</div>
            <div style={styles.infoRow}><strong>Onboarding：</strong>{newestUser.onboardingComplete ? '✅ 完成' : '⏳ 未完成'}</div>
            <div style={styles.infoRow}><strong>註冊時間：</strong>{newestUser.createdAt}</div>
          </div>
        </div>
      )}

      {!newestUser && (
        <div style={{ ...styles.infoCard, textAlign: 'center' as const, padding: 32 }}>
          <AlertTriangle size={32} color="#B27D00" />
          <p style={{ margin: '12px 0 0', color: '#6B6190' }}>目前沒有任何用戶資料</p>
        </div>
      )}

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>檢舉概況</h3>
        <div style={styles.statsGrid}>
          <StatCard icon={<Flag size={22} />} label="總檢舉" value={reports.length} color="#FF5A5A" />
          <StatCard icon={<Clock size={22} />} label="待處理" value={reports.filter((report) => report.status === 'pending').length} color="#F5A623" />
          <StatCard icon={<Eye size={22} />} label="已審核" value={reports.filter((report) => report.status === 'reviewed').length} color="#0D9668" />
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>最近活動</h3>
        {events.length === 0 ? (
          <p style={styles.emptyText}>尚無分析事件</p>
        ) : (
          <div style={styles.activityList}>
            {events.slice(-10).reverse().map((ev, i) => (
              <div key={i} style={styles.activityItem}>
                <span style={styles.activityDot} />
                <span style={styles.activityName}>{ev.name}</span>
                {ev.props && <span style={styles.activityProps}>{JSON.stringify(ev.props)}</span>}
                <span style={styles.activityTime}>{tsToStr(ev.ts)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderUsers = () => {
    if (selectedUser) return renderUserDetail(selectedUser);

    return (
      <div>
        <h3 style={styles.sectionTitle}>所有用戶 ({users.length})</h3>
        <div style={styles.userList}>
          {users.map(user => (
            <div
              key={user.id}
              style={styles.userRow}
              onClick={() => setSelectedUser(user)}
            >
              <div style={styles.userAvatar}>
                {user.photos[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.photos[0]} alt={user.name} style={styles.avatarImg} />
                ) : (
                  <div style={styles.avatarPlaceholder}>{user.name[0]}</div>
                )}
              </div>
              <div style={styles.userInfo}>
                <div style={styles.userName}>
                  {user.name}
                  {user.onboardingComplete && <span style={styles.youBadge}>已完成</span>}
                </div>
                <div style={styles.userMeta}>
                  <span style={styles.badge}>{user.aiPersonality?.values?.[0] || '—'}</span>
                  <span>{genderLabel(user.gender)}</span>
                  <span>{user.age}歲</span>
                  <span>{user.preferences.region}</span>
                </div>
              </div>
              <Eye size={18} color="#F4B183" />
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderUserDetail = (user: UserProfile) => (
    <div>
      <button style={styles.backBtn} onClick={() => setSelectedUser(null)}>
        <ArrowLeft size={18} /> 返回用戶列表
      </button>
      <div style={styles.infoCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          {user.photos[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.photos[0]} alt={user.name} style={{ ...styles.avatarImg, width: 64, height: 64 }} />
          ) : (
            <div style={{ ...styles.avatarPlaceholder, width: 64, height: 64, fontSize: 28 }}>{user.name[0]}</div>
          )}
          <div>
            <h2 style={{ margin: 0, fontSize: 20 }}>{user.name}</h2>
            <span style={styles.badge}>{user.aiPersonality?.values?.[0] || '尚未分析'}</span>
          </div>
        </div>

        <div style={styles.detailGrid}>
          <DetailItem label="ID" value={user.id} mono />
          <DetailItem label="性別" value={genderLabel(user.gender)} />
          <DetailItem label="年齡" value={`${user.age}歲`} />
          <DetailItem label="職業" value={user.occupation || '—'} />
          <DetailItem label="學歷" value={user.education || '—'} />
          <DetailItem label="地區" value={user.preferences.region} />
          <DetailItem label="Onboarding" value={user.onboardingComplete ? '✅ 完成' : '⏳ 未完成'} />
          <DetailItem label="註冊時間" value={user.createdAt} />
        </div>

        {user.bio && (
          <div style={styles.detailSection}>
            <h4 style={styles.detailLabel}>自我介紹</h4>
            <p style={styles.bioText}>{user.bio}</p>
          </div>
        )}

        <div style={styles.detailSection}>
          <h4 style={styles.detailLabel}>照片 ({user.photos.length})</h4>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
            {user.photos.map((p, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={p} alt={`照片${i + 1}`} style={{ width: 80, height: 80, borderRadius: 12, objectFit: 'cover' as const }} />
            ))}
            {user.photos.length === 0 && <span style={styles.emptyText}>無照片</span>}
          </div>
        </div>

        <div style={styles.detailSection}>
          <h4 style={styles.detailLabel}>AI 個性標籤</h4>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
            {user.aiPersonality?.traits?.map(t => (
              <div key={t.name} style={styles.traitChip}>
                <strong>{t.name}</strong>
                <span style={{ fontSize: 11, color: '#6B6190' }}>{t.score}%</span>
              </div>
            )) || <span style={styles.emptyText}>尚未完成 AI 聊天</span>}
          </div>
        </div>

        <div style={styles.detailSection}>
          <h4 style={styles.detailLabel}>配對偏好</h4>
          <div style={styles.detailGrid}>
            <DetailItem label="年齡範圍" value={`${user.preferences.ageMin}–${user.preferences.ageMax}歲`} />
            <DetailItem label="性別偏好" value={user.preferences.genderPreference.map(genderLabel).join('、')} />
            <DetailItem label="地區" value={user.preferences.region} />
          </div>
        </div>

        <div style={styles.detailSection}>
          <h4 style={styles.detailLabel}>AI 個性分析</h4>
          {!user.aiPersonality ? (
            <span style={styles.emptyText}>尚未完成 AI 聊天</span>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
              <div style={styles.scenarioRow}>
                <span>價值觀: {user.aiPersonality.values.join('、')}</span>
              </div>
              <div style={styles.scenarioRow}>
                <span>溝通風格: {user.aiPersonality.communicationStyle}</span>
              </div>
              <div style={styles.scenarioRow}>
                <span>感情期待: {user.aiPersonality.relationshipGoal}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderMatches = () => {
    if (selectedMatch) return renderChatDetail(selectedMatch);

    return (
      <div>
        <h3 style={styles.sectionTitle}>
          配對列表 ({matches.length})
          {matches.length === 0 && <span style={{ fontWeight: 400, fontSize: 14, color: '#6B6190' }}> — 尚無配對</span>}
        </h3>

        {matches.length > 0 && (
          <div style={styles.userList}>
            {matches.map(match => {
              const [userA, userB] = match.users;
              const userAName = findUserName(userA, users);
              const userBName = findUserName(userB, users);
              const msgCount = match.messages.length;
              const lastMsg = match.messages[match.messages.length - 1];
              return (
                <div key={match.id} style={styles.userRow} onClick={() => setSelectedMatch(match)}>
                  <div style={{ ...styles.avatarPlaceholder, width: 44, height: 44 }}>💬</div>
                  <div style={styles.userInfo}>
                    <div style={styles.userName}>
                      {`${userAName} ↔ ${userBName}`}
                    </div>
                    <div style={styles.userMeta}>
                      <span>{msgCount} 則訊息</span>
                      <span>主題：{match.topic.text.slice(0, 20)}...</span>
                    </div>
                    {lastMsg && (
                      <div style={{ fontSize: 12, color: '#6B6190', marginTop: 2 }}>
                        最後：{getMessagePreview(lastMsg).slice(0, 30)}...
                      </div>
                    )}
                  </div>
                  <Eye size={18} color="#F4B183" />
                </div>
              );
            })}
          </div>
        )}

        <div style={{ ...styles.section, marginTop: 24 }}>
          <h3 style={styles.sectionTitle}>喜歡記錄 ({likes.length})</h3>
          {likes.length === 0 ? (
            <p style={styles.emptyText}>尚無喜歡記錄</p>
          ) : (
            <div style={styles.userList}>
              {likes.map((like, i) => (
                <div key={i} style={{ ...styles.userRow, cursor: 'default' }}>
                  <Heart size={20} color="#FF6B6B" fill="#FF6B6B" />
                  <div style={styles.userInfo}>
                    <div style={styles.userName}>
                      {findUserName(like.fromUserId, users)} → {findUserName(like.toUserId, users)}
                    </div>
                    <div style={styles.userMeta}>
                      <span>{tsToStr(like.timestamp)}</span>
                    </div>
                    {like.topicAnswer && (
                      <div style={{ fontSize: 12, color: '#6B6190', marginTop: 2 }}>
                        回答：{like.topicAnswer}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ ...styles.section, marginTop: 24 }}>
          <h3 style={styles.sectionTitle}>今日配對卡片 ({dailyCards.length})</h3>
          {dailyCards.length === 0 ? (
            <p style={styles.emptyText}>尚無今日卡片</p>
          ) : (
            <div style={styles.userList}>
              {dailyCards.map((card, i) => (
                <div key={i} style={{ ...styles.userRow, cursor: 'default' }}>
                  <div style={{ ...styles.avatarPlaceholder, width: 44, height: 44 }}>{card.user.name[0]}</div>
                  <div style={styles.userInfo}>
                    <div style={styles.userName}>{card.user.name}</div>
                    <div style={styles.userMeta}>
                      <span style={styles.badge}>{card.user.aiPersonality?.values?.[0] || '—'}</span>
                      <span>相容度 {card.compatibility}%</span>
                      <span>{card.liked ? '❤️ 已喜歡' : card.skipped ? '⏭ 已跳過' : '🔲 未操作'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderChatDetail = (match: Match) => {
    const [userA, userB] = match.users;
    const userAName = findUserName(userA, users);
    const userBName = findUserName(userB, users);

    return (
      <div>
        <button style={styles.backBtn} onClick={() => setSelectedMatch(null)}>
          <ArrowLeft size={18} /> 返回配對列表
        </button>

        <div style={styles.infoCard}>
          <h3 style={{ margin: '0 0 8px' }}>
            {`${userAName} ↔ ${userBName}`}
          </h3>
          <div style={styles.detailGrid}>
            <DetailItem label="配對 ID" value={match.id} mono />
            <DetailItem label="狀態" value={match.status === 'active' ? '🟢 活躍' : match.status === 'removed' ? '⚪ 已移除' : '🔴 過期'} />
            <DetailItem label="建立時間" value={match.createdAt} />
            <DetailItem label="話題" value={match.topic.text} />
          </div>

          <div style={styles.detailSection}>
            <h4 style={styles.detailLabel}>話題回答</h4>
            {Object.entries(match.topicAnswers).map(([userId, answer]) => (
              <div key={userId} style={{ fontSize: 13, marginBottom: 4 }}>
                <strong>{findUserName(userId, users)}：</strong>{answer}
              </div>
            ))}
          </div>
        </div>

        <div style={{ ...styles.section, marginTop: 16 }}>
          <h3 style={styles.sectionTitle}>聊天記錄 ({match.messages.length} 則)</h3>
          <div style={styles.chatContainer}>
            {match.messages.map(msg => (
              <div key={msg.id} style={{
                ...styles.chatBubble,
                ...(msg.senderId === 'system' ? styles.chatSystem :
                  msg.senderId === userA ? styles.chatMine : styles.chatTheirs),
              }}>
                <div style={styles.chatSender}>{findUserName(msg.senderId, users)}</div>
                {msg.type === 'image' && msg.imageUrl ? (
                  <div>
                    <a href={msg.imageUrl} target="_blank" rel="noreferrer">
                      <img
                        src={msg.imageUrl}
                        alt={msg.text || '聊天圖片'}
                        style={{ width: 180, maxWidth: '100%', borderRadius: 12, display: 'block', marginBottom: msg.text ? 8 : 0 }}
                      />
                    </a>
                    {msg.text && <div style={styles.chatText}>{msg.text}</div>}
                  </div>
                ) : (
                  <div style={styles.chatText}>{msg.text}</div>
                )}
                <div style={styles.chatTime}>{tsToStr(msg.timestamp)}</div>
              </div>
            ))}
            {match.messages.length === 0 && <p style={styles.emptyText}>無聊天訊息</p>}
          </div>
        </div>
      </div>
    );
  };

  const renderAnalytics = () => {
    const now = Date.now();
    const today = events.filter((event) => now - new Date(event.ts).getTime() < 86400000);
    const week = events.filter((event) => now - new Date(event.ts).getTime() < 604800000);
    const funnelCount = (eventName: string) => week.filter((event) => event.name === eventName).length;
    const funnel = [
      { label: '開始 onboarding', value: funnelCount('onboarding_start') },
      { label: '完成 AI 聊天', value: funnelCount('ai_chat_complete') },
      { label: '完成個資', value: funnelCount('onboarding_profile_completed') },
      { label: '完成 onboarding', value: funnelCount('onboarding_complete') },
      { label: '推薦載入', value: funnelCount('recommendations_loaded') },
      { label: '送出喜歡', value: funnelCount('card_like') },
      { label: '成功配對', value: funnelCount('match_created') },
      { label: '首則訊息', value: funnelCount('first_message_sent') },
    ];

    const countByName = (list: AnalyticsEvent[]) => {
      const map: Record<string, number> = {};
      list.forEach(e => { map[e.name] = (map[e.name] || 0) + 1; });
      return Object.entries(map).sort((a, b) => b[1] - a[1]);
    };

    return (
      <div>
        <div style={styles.statsGrid}>
          <StatCard icon={<Clock size={22} />} label="今日事件" value={today.length} color="#FF8C6B" />
          <StatCard icon={<TrendingUp size={22} />} label="本週事件" value={week.length} color="#0D9668" />
          <StatCard icon={<BarChart3 size={22} />} label="總事件" value={events.length} color="#6366F1" />
        </div>

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>核心漏斗（本週）</h3>
          <div style={styles.statsGrid}>
            {funnel.map((item) => (
              <StatCard key={item.label} icon={<TrendingUp size={22} />} label={item.label} value={item.value} color="#FF8C6B" />
            ))}
          </div>
        </div>

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>事件分布（本週）</h3>
          {countByName(week).length === 0 ? (
            <p style={styles.emptyText}>本週無事件</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
              {countByName(week).map(([name, count]) => (
                <div key={name} style={styles.barRow}>
                  <span style={styles.barLabel}>{name}</span>
                  <div style={styles.barTrack}>
                    <div style={{
                      ...styles.barFill,
                      width: `${Math.min(100, (count / Math.max(...countByName(week).map(x => x[1]))) * 100)}%`,
                    }} />
                  </div>
                  <span style={styles.barCount}>{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>完整事件記錄（最新 50 筆）</h3>
          {events.length === 0 ? (
            <p style={styles.emptyText}>尚無事件</p>
          ) : (
            <div style={styles.eventTable}>
              <div style={styles.tableHeader}>
                <span style={{ flex: 1 }}>事件</span>
                <span style={{ flex: 2 }}>參數</span>
                <span style={{ flex: 1 }}>時間</span>
              </div>
              {events.slice(-50).reverse().map((ev, i) => (
                <div key={i} style={styles.tableRow}>
                  <span style={{ flex: 1, fontWeight: 500 }}>{ev.name}</span>
                  <span style={{ flex: 2, fontSize: 11, color: '#6B6190', fontFamily: 'monospace' }}>
                    {ev.props ? JSON.stringify(ev.props) : '—'}
                  </span>
                  <span style={{ flex: 1, fontSize: 11, color: '#6B6190' }}>{tsToStr(ev.ts)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ============================
  // Main layout
  // ============================
  const renderReports = () => {
    const updateReportStatus = async (reportId: string, status: 'reviewed' | 'dismissed') => {
      const response = await fetch('/api/admin/dashboard', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-code': adminCode,
        },
        body: JSON.stringify({ reportId, status }),
      });

      if (!response.ok) {
        setError('更新檢舉狀態失敗');
        return;
      }

      await refresh();
    };

    return (
      <div>
        <div style={styles.statsGrid}>
          <StatCard icon={<Flag size={22} />} label="總檢舉" value={reports.length} color="#FF5A5A" />
          <StatCard icon={<Clock size={22} />} label="待處理" value={reports.filter(r => r.status === 'pending').length} color="#F5A623" />
          <StatCard icon={<Eye size={22} />} label="已審核" value={reports.filter(r => r.status === 'reviewed').length} color="#0D9668" />
          <StatCard icon={<AlertTriangle size={22} />} label="已駁回" value={reports.filter(r => r.status === 'dismissed').length} color="#8B7355" />
        </div>

        {reports.length === 0 ? (
          <div style={{ ...styles.infoCard, textAlign: 'center' as const, padding: 40 }}>
            <Shield size={40} color="#0D9668" />
            <p style={{ margin: '12px 0 0', color: '#3D2C1E', fontWeight: 600 }}>沒有任何檢舉 🎉</p>
            <p style={{ margin: '4px 0 0', color: '#8B7355', fontSize: 13 }}>目前一切正常</p>
          </div>
        ) : (
          <div style={styles.userList}>
            {reports.map((report, i) => {
              const status = report.status;
              const statusLabel = status === 'pending' ? '🟡 待處理' : status === 'reviewed' ? '🟢 已審核' : '⚪ 已駁回';
              const statusColor = status === 'pending' ? '#B27D00' : status === 'reviewed' ? '#0D9668' : '#8B7355';
              return (
                <div key={report.id} style={{ ...styles.userRow, cursor: 'default', flexDirection: 'column' as const, alignItems: 'stretch' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ ...styles.avatarPlaceholder, width: 44, height: 44, background: 'linear-gradient(135deg,#FF5A5A,#FF8C6B)' }}>🚨</div>
                    <div style={styles.userInfo}>
                      <div style={styles.userName}>
                        被檢舉：{report.reportedName}
                        <span style={{ ...styles.badge, background: `${statusColor}15`, color: statusColor, marginLeft: 8 }}>{statusLabel}</span>
                      </div>
                      <div style={styles.userMeta}>
                        <span>檢舉人：{report.reporterName}</span>
                        <span>原因：{report.reason}</span>
                        <span>配對 ID：{report.matchId ? `${report.matchId.slice(0, 12)}...` : '—'}</span>
                      </div>
                      <div style={{ fontSize: 11, color: '#8B7355', marginTop: 2 }}>
                        {tsToStr(report.timestamp)}
                      </div>
                    </div>
                  </div>
                  {status === 'pending' && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 12, paddingTop: 12, borderTop: '1px solid #FFF5EB' }}>
                      <button
                        style={{ flex: 1, padding: '8px 0', borderRadius: 10, border: 'none', background: '#FF5A5A', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
                        onClick={() => { void updateReportStatus(report.id, 'reviewed'); }}
                      >
                        ⚠️ 標記已審核
                      </button>
                      <button
                        style={{ flex: 1, padding: '8px 0', borderRadius: 10, border: '1.5px solid #E8DDD4', background: '#fff', color: '#8B7355', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
                        onClick={() => { void updateReportStatus(report.id, 'dismissed'); }}
                      >
                        駁回
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const tabs: { key: Tab; label: string; icon: ReactNode }[] = [
    { key: 'overview', label: '概覽', icon: <BarChart3 size={18} /> },
    { key: 'users', label: '用戶', icon: <Users size={18} /> },
    { key: 'matches', label: '配對聊天', icon: <MessageCircle size={18} /> },
    { key: 'reports', label: '檢舉', icon: <Flag size={18} /> },
    { key: 'analytics', label: '分析', icon: <Activity size={18} /> },
  ];

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <Shield size={24} color="#fff" />
          <h1 style={styles.headerTitle}>Mochi 管理後台</h1>
        </div>
        <button onClick={() => { void refresh(); }} style={styles.refreshBtn} title="重新載入資料">
          <RefreshCw size={18} />
        </button>
      </header>

      <nav style={styles.tabBar}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={tab === t.key ? { ...styles.tab, ...styles.tabActive } : styles.tab}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </nav>

      <main style={styles.main}>
        {tab === 'overview' && renderOverview()}
        {tab === 'users' && renderUsers()}
        {tab === 'matches' && renderMatches()}
        {tab === 'reports' && renderReports()}
        {tab === 'analytics' && renderAnalytics()}
      </main>
    </div>
  );
}

// ============================
// Sub-components
// ============================
function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div style={styles.statCard}>
      <div style={{ ...styles.statIcon, backgroundColor: `${color}15`, color }}>{icon}</div>
      <div style={styles.statValue}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  );
}

function DetailItem({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={styles.detailItem}>
      <span style={styles.detailItemLabel}>{label}</span>
      <span style={mono ? styles.mono : undefined}>{value}</span>
    </div>
  );
}

function genderLabel(g: string) {
  return g === 'male' ? '👨 男' : g === 'female' ? '👩 女' : '🌈 其他';
}

// ============================
// Inline styles (no extra CSS file needed)
// ============================
const styles: Record<string, React.CSSProperties> = {
  // Login
  loginContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100dvh', background: '#FFF8F0', padding: 20 },
  loginCard: { background: '#fff', borderRadius: 20, padding: 40, textAlign: 'center', maxWidth: 360, width: '100%', boxShadow: '0 4px 24px rgba(255,140,107,0.08)' },
  loginTitle: { fontSize: 22, fontWeight: 700, margin: '16px 0 4px', color: '#3D2C1E' },
  loginSubtitle: { fontSize: 14, color: '#8B7355', margin: '0 0 20px' },
  loginInput: { width: '100%', padding: '12px 16px', border: '2px solid #F0E6D8', borderRadius: 12, fontSize: 16, textAlign: 'center', outline: 'none' },
  loginBtn: { width: '100%', padding: '12px 0', marginTop: 16, background: 'linear-gradient(135deg,#FF8C6B,#FFB088)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 600, cursor: 'pointer' },
  error: { color: '#E55B5B', fontSize: 13, margin: '8px 0 0' },

  // Layout
  container: { minHeight: '100dvh', background: '#FFF3E8' },
  header: { background: 'linear-gradient(135deg,#FF8C6B,#E06B48)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 700, margin: 0 },
  refreshBtn: { background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer', color: '#fff', display: 'flex' },
  tabBar: { display: 'flex', background: '#fff', borderBottom: '1px solid #F0E6D8', overflowX: 'auto' },
  tab: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '12px 8px', fontSize: 13, fontWeight: 500, color: '#8B7355', border: 'none', borderBottom: '3px solid transparent', background: 'none', cursor: 'pointer', whiteSpace: 'nowrap' },
  tabActive: { color: '#FF8C6B', borderBottomColor: '#FF8C6B', fontWeight: 700 },
  main: { padding: 16, maxWidth: 800, margin: '0 auto' },

  // Stats
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, marginBottom: 20 },
  statCard: { background: '#fff', borderRadius: 16, padding: 16, textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
  statIcon: { width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' },
  statValue: { fontSize: 28, fontWeight: 800, color: '#3D2C1E' },
  statLabel: { fontSize: 12, color: '#8B7355', marginTop: 2 },

  // Sections
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 700, color: '#3D2C1E', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 },

  // Info card
  infoCard: { background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
  infoRow: { fontSize: 14, padding: '6px 0', borderBottom: '1px solid #FFF5EB', color: '#3D2C1E' },

  // User list
  userList: { display: 'flex', flexDirection: 'column', gap: 8 },
  userRow: { display: 'flex', alignItems: 'center', gap: 12, background: '#fff', borderRadius: 14, padding: '12px 16px', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', transition: 'box-shadow 0.2s' },
  userAvatar: { flexShrink: 0 },
  avatarImg: { width: 44, height: 44, borderRadius: 12, objectFit: 'cover' },
  avatarPlaceholder: { width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#F4B183,#FF6B6B)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18, flexShrink: 0 },
  userInfo: { flex: 1, minWidth: 0 },
  userName: { fontSize: 15, fontWeight: 600, color: '#3D2C1E', display: 'flex', alignItems: 'center', gap: 8 },
  userMeta: { fontSize: 12, color: '#8B7355', display: 'flex', gap: 8, marginTop: 2, flexWrap: 'wrap' },
  youBadge: { fontSize: 10, background: '#FF8C6B', color: '#fff', padding: '2px 8px', borderRadius: 6, fontWeight: 600 },

  // Detail
  backBtn: { display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#FF8C6B', fontSize: 14, fontWeight: 600, cursor: 'pointer', padding: '8px 0', marginBottom: 12 },
  detailGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginTop: 12 },
  detailItem: { display: 'flex', flexDirection: 'column', gap: 2 },
  detailItemLabel: { fontSize: 11, color: '#8B7355', fontWeight: 600, textTransform: 'uppercase' },
  detailSection: { marginTop: 20, paddingTop: 16, borderTop: '1px solid #FFF5EB' },
  detailLabel: { fontSize: 14, fontWeight: 600, color: '#3D2C1E', margin: '0 0 8px' },
  bioText: { fontSize: 14, color: '#3D2C1E', lineHeight: 1.6, margin: 0, background: '#FFF5EB', padding: 12, borderRadius: 10 },
  scenarioRow: { display: 'flex', gap: 12, fontSize: 12, color: '#8B7355', padding: '6px 10px', background: '#FAFAFA', borderRadius: 8 },

  // Trait chip
  traitChip: { display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#FFF5EB', borderRadius: 10, padding: '8px 16px', minWidth: 56 },

  // Badge
  badge: { background: '#FFF5EB', color: '#FF8C6B', padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600 },
  mono: { fontFamily: 'monospace', fontSize: 12, color: '#8B7355', wordBreak: 'break-all' },
  emptyText: { color: '#F4B183', fontSize: 13, fontStyle: 'italic' },

  // Chat
  chatContainer: { display: 'flex', flexDirection: 'column', gap: 8, background: '#F9F6FF', borderRadius: 16, padding: 16, maxHeight: 500, overflowY: 'auto' },
  chatBubble: { maxWidth: '85%', borderRadius: 16, padding: '10px 14px' },
  chatSystem: { alignSelf: 'center', background: '#F0E6D8', color: '#8B7355', textAlign: 'center', fontSize: 13, borderRadius: 12, maxWidth: '90%' },
  chatMine: { alignSelf: 'flex-end', background: '#FF8C6B', color: '#fff' },
  chatTheirs: { alignSelf: 'flex-start', background: '#fff', color: '#3D2C1E', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  chatSender: { fontSize: 11, fontWeight: 600, marginBottom: 2, opacity: 0.7 },
  chatText: { fontSize: 14, lineHeight: 1.5, wordBreak: 'break-word' },
  chatTime: { fontSize: 10, marginTop: 4, opacity: 0.6, textAlign: 'right' },

  // Activity
  activityList: { display: 'flex', flexDirection: 'column', gap: 6 },
  activityItem: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, padding: '8px 12px', background: '#fff', borderRadius: 10 },
  activityDot: { width: 8, height: 8, borderRadius: '50%', background: '#FF8C6B', flexShrink: 0 },
  activityName: { fontWeight: 600, color: '#3D2C1E' },
  activityProps: { fontSize: 11, color: '#8B7355', fontFamily: 'monospace', flex: 1 },
  activityTime: { fontSize: 11, color: '#F4B183', whiteSpace: 'nowrap' },

  // Analytics bars
  barRow: { display: 'flex', alignItems: 'center', gap: 10 },
  barLabel: { width: 140, fontSize: 13, fontWeight: 500, color: '#3D2C1E', textAlign: 'right' },
  barTrack: { flex: 1, height: 20, background: '#FFF5EB', borderRadius: 6, overflow: 'hidden' },
  barFill: { height: '100%', background: 'linear-gradient(90deg,#FF8C6B,#FFB088)', borderRadius: 6, transition: 'width 0.3s' },
  barCount: { width: 30, fontSize: 13, fontWeight: 700, color: '#3D2C1E' },

  // Event table
  eventTable: { background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' },
  tableHeader: { display: 'flex', padding: '10px 16px', background: '#FFF5EB', fontSize: 12, fontWeight: 700, color: '#8B7355' },
  tableRow: { display: 'flex', padding: '8px 16px', borderBottom: '1px solid #F8F5FF', fontSize: 13, alignItems: 'center' },
};
