'use client';

import { useApp } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { scenarioQuestions } from '@/lib/mock-data';
import { ScenarioAnswer } from '@/lib/types';
import BottomNav from '@/components/BottomNav';
import { CheckCircle, User, Users } from 'lucide-react';
import { track } from '@/lib/analytics';

export default function WeeklyPage() {
  const { currentUser, updateProfile } = useApp();
  const router = useRouter();

  // 判斷目前是第幾週
  const answeredIds = new Set(currentUser?.scenarioAnswers.map(a => a.questionId) || []);
  const unanswered = scenarioQuestions.filter(q => !answeredIds.has(q.id));
  const nextWeekQuestions = unanswered.slice(0, 4); // 每週4題

  const [currentQ, setCurrentQ] = useState(0);
  const [phase, setPhase] = useState<'my' | 'partner'>('my');
  const [myAnswer, setMyAnswer] = useState<number[]>([]);
  const [partnerAnswer, setPartnerAnswer] = useState<number[]>([]);
  const [weeklyAnswers, setWeeklyAnswers] = useState<ScenarioAnswer[]>([]);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      router.replace('/');
    } else {
      track('page_view', { page: 'weekly' });
    }
  }, [currentUser, router]);

  if (!currentUser) return null;

  if (nextWeekQuestions.length === 0 || completed) {
    return (
      <div className="min-h-dvh pb-24">
        <div className="px-6 pt-6">
          <h1 className="text-2xl font-extrabold mb-2">
            <span className="gradient-text">每週情境題</span> ✨
          </h1>
        </div>
        <div className="flex flex-col items-center justify-center py-20 px-6 animate-scale-in">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
            <CheckCircle size={40} className="text-success" />
          </div>
          <h2 className="text-xl font-bold mb-2">
            {completed ? '本週完成！🎉' : '全部完成！🏆'}
          </h2>
          <p className="text-text-secondary text-sm text-center mb-6">
            {completed
              ? '配對會更精準了，下週有新題目等你！'
              : '每週都會有新的情境題來優化你的配對。'}
          </p>
          <button className="btn-primary !w-auto !px-8" onClick={() => router.push('/home')}>
            回去探索 →
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  const question = nextWeekQuestions[currentQ];
  if (!question) {
    return (
      <div className="min-h-dvh pb-24">
        <div className="px-6 pt-6">
          <h1 className="text-2xl font-extrabold mb-2">
            <span className="gradient-text">每週情境題</span> ✨
          </h1>
        </div>
        <div className="flex flex-col items-center justify-center py-20 px-6 animate-scale-in">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
            <CheckCircle size={40} className="text-success" />
          </div>
          <h2 className="text-xl font-bold mb-2">全部完成！🏆</h2>
          <p className="text-text-secondary text-sm text-center mb-6">
            每週都會有新的情境題來優化你的配對。
          </p>
          <button className="btn-primary !w-auto !px-8" onClick={() => router.push('/home')}>
            回去探索 →
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  const selectedValues = phase === 'my' ? myAnswer : partnerAnswer;

  const toggleOption = (idx: number) => {
    if (phase === 'my') {
      setMyAnswer(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);
    } else {
      setPartnerAnswer(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);
    }
  };

  const handleNext = () => {
    if (phase === 'my' && myAnswer.length > 0) {
      setPhase('partner');
      return;
    }
    if (phase === 'partner' && partnerAnswer.length > 0 && myAnswer.length > 0) {
      const newAnswer: ScenarioAnswer = {
        questionId: question.id,
        myAnswer,
        partnerAnswer,
      };
      const updated = [...weeklyAnswers, newAnswer];
      setWeeklyAnswers(updated);

      if (currentQ < nextWeekQuestions.length - 1) {
        setCurrentQ(currentQ + 1);
        setPhase('my');
        setMyAnswer([]);
        setPartnerAnswer([]);
      } else {
        // 完成本週
        const allAnswers = [...(currentUser.scenarioAnswers || []), ...updated];
        updateProfile({ scenarioAnswers: allAnswers });
        setCompleted(true);
      }
    }
  };

  return (
    <div className="min-h-dvh flex flex-col pb-24">
      <div className="px-6 pt-6 pb-4">
        <h1 className="text-2xl font-extrabold mb-1">
          <span className="gradient-text">每週情境題</span> ✨
        </h1>
        <div className="flex justify-between items-center">
          <p className="text-sm text-text-secondary">
            填寫更多題目，讓配對更精準
          </p>
          <span className="pill text-xs">
            {currentQ + 1} / {nextWeekQuestions.length}
          </span>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${((currentQ + (phase === 'partner' ? 0.5 : 0)) / nextWeekQuestions.length) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* 角色標示 */}
      <div className="px-6 mb-4">
        <div className="flex items-center gap-2 animate-fade-in" key={phase}>
          {phase === 'my' ? (
            <div className="pill flex items-center gap-2 text-sm font-medium">
              <User size={16} /> 🙋 你的選擇
            </div>
          ) : (
            <div className="pill flex items-center gap-2 text-sm font-medium" style={{ background: 'rgba(244, 63, 94, 0.12)', color: 'var(--accent)' }}>
              <Users size={16} /> 💕 你希望對方的選擇
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 px-6 animate-slide-up" key={`${currentQ}-${phase}`}>
        <div className="card mb-4" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.06), rgba(244,63,94,0.06))', border: 'none' }}>
          <p className="text-xs text-text-secondary mb-1">{question.category}</p>
          <h2 className="text-lg font-bold">{question.question}</h2>
          <p className="text-xs mt-2" style={{ color: 'var(--accent)' }}>可複選 ✅</p>
        </div>

        <div className="space-y-3">
          {question.options.map((option, idx) => (
            <button
              key={idx}
              className={`option-card flex items-center gap-3 ${selectedValues.includes(idx) ? 'selected' : ''}`}
              onClick={() => toggleOption(idx)}
            >
              <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{
                border: selectedValues.includes(idx) ? 'none' : '2px solid var(--border)',
                background: selectedValues.includes(idx) ? 'linear-gradient(135deg, var(--primary), var(--accent))' : 'transparent',
              }}>
                {selectedValues.includes(idx) && <span className="text-white text-xs">✓</span>}
              </span>
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 pt-4">
        <button
          className="btn-primary flex items-center justify-center gap-2"
          onClick={handleNext}
          disabled={selectedValues.length === 0}
        >
          {phase === 'my'
            ? '接下來：對方的理想選擇 →'
            : currentQ < nextWeekQuestions.length - 1
            ? '下一題 →'
            : '完成本週題目 🎉'}
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
