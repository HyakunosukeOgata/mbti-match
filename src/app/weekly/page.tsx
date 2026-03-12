'use client';

import { useApp } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { scenarioQuestions } from '@/lib/mock-data';
import { ScenarioAnswer } from '@/lib/types';
import BottomNav from '@/components/BottomNav';
import { Calendar, CheckCircle, User, Users, ArrowRight } from 'lucide-react';

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
    }
  }, [currentUser, router]);

  if (!currentUser) return null;

  if (nextWeekQuestions.length === 0 || completed) {
    return (
      <div className="min-h-dvh pb-24">
        <div className="px-6 pt-6">
          <h1 className="text-xl font-bold mb-2">每週情境題 📋</h1>
        </div>
        <div className="flex flex-col items-center justify-center py-20 px-6">
          <CheckCircle size={56} className="text-success mb-4" />
          <h2 className="text-lg font-bold mb-2">
            {completed ? '本週題目完成！' : '已完成所有題目！'}
          </h2>
          <p className="text-text-secondary text-sm text-center mb-6">
            {completed
              ? '你的配對將會更加精準，下週會有新的情境題等你！'
              : '每週都會有新的情境題來更新你的配對偏好。'}
          </p>
          <button className="btn-primary" onClick={() => router.push('/home')}>
            回到首頁看配對
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  const question = nextWeekQuestions[currentQ];
  if (!question) {
    // All questions answered — show completed view
    return (
      <div className="min-h-dvh pb-24">
        <div className="px-6 pt-6">
          <h1 className="text-xl font-bold mb-2">每週情境題 📋</h1>
        </div>
        <div className="flex flex-col items-center justify-center py-20 px-6">
          <CheckCircle size={56} className="text-success mb-4" />
          <h2 className="text-lg font-bold mb-2">已完成所有題目！</h2>
          <p className="text-text-secondary text-sm text-center mb-6">
            每週都會有新的情境題來更新你的配對偏好。
          </p>
          <button className="btn-primary" onClick={() => router.push('/home')}>
            回到首頁看配對
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
        <div className="flex items-center gap-2 mb-2">
          <Calendar size={18} className="text-text-secondary" />
          <h1 className="text-xl font-bold">每週情境題</h1>
        </div>
        <div className="flex justify-between items-center">
          <p className="text-sm text-text-secondary">
            填寫更多題目，讓配對更精準
          </p>
          <span className="text-xs text-text-secondary">
            {currentQ + 1} / {nextWeekQuestions.length}
          </span>
        </div>
      </div>

      {/* 角色標示 */}
      <div className="px-6 mb-4">
        <div className="flex items-center gap-2 animate-fade-in" key={phase}>
          {phase === 'my' ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 text-primary-light text-sm font-medium">
              <User size={16} /> 你會怎麼做？
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/20 text-accent-light text-sm font-medium">
              <Users size={16} /> 你希望對方怎麼做？
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 px-6 animate-slide-up" key={`${currentQ}-${phase}`}>
        <div className="card mb-4">
          <p className="text-xs text-text-secondary mb-1">{question.category}</p>
          <h2 className="text-lg font-bold">{question.question}</h2>
          <p className="text-xs text-accent-light mt-2">可複選</p>
        </div>

        <div className="space-y-3">
          {question.options.map((option, idx) => (
            <button
              key={idx}
              className={`option-card flex items-center gap-3 ${selectedValues.includes(idx) ? 'selected' : ''}`}
              onClick={() => toggleOption(idx)}
            >
              <span className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0" style={{
                borderColor: selectedValues.includes(idx) ? 'var(--primary)' : 'var(--border)',
                background: selectedValues.includes(idx) ? 'var(--primary)' : 'transparent',
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
            ? '接下來：你希望對方怎麼做'
            : currentQ < nextWeekQuestions.length - 1
            ? '下一題'
            : '完成本週題目'}
          <ArrowRight size={18} />
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
