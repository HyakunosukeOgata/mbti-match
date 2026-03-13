'use client';

import { useApp } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { scenarioQuestions } from '@/lib/mock-data';
import { ScenarioAnswer } from '@/lib/types';
import { ArrowRight, User, Users } from 'lucide-react';
import { track } from '@/lib/analytics';

export default function ScenariosPage() {
  const { currentUser, updateProfile, setOnboardingStep } = useApp();
  const router = useRouter();

  const week1Questions = scenarioQuestions.filter(q => q.week === 1);
  const [currentQ, setCurrentQ] = useState(0);
  const [phase, setPhase] = useState<'my' | 'partner'>('my');
  const [answers, setAnswers] = useState<ScenarioAnswer[]>([]);
  const [myAnswer, setMyAnswer] = useState<number[]>([]);
  const [partnerAnswer, setPartnerAnswer] = useState<number[]>([]);

  useEffect(() => {
    if (!currentUser) {
      router.replace('/');
    }
  }, [currentUser, router]);

  useEffect(() => {
    if (currentUser && currentQ >= week1Questions.length) {
      router.push('/onboarding/profile');
    }
  }, [currentQ, currentUser, router, week1Questions.length]);

  if (!currentUser) return null;

  const question = week1Questions[currentQ];
  if (!question) {
    return null;
  }

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
      const updatedAnswers = [...answers, newAnswer];
      setAnswers(updatedAnswers);

      if (currentQ < week1Questions.length - 1) {
        setCurrentQ(currentQ + 1);
        setPhase('my');
        setMyAnswer([]);
        setPartnerAnswer([]);
      } else {
        // 完成情境題
        updateProfile({ scenarioAnswers: updatedAnswers });
        setOnboardingStep(3);
        router.push('/onboarding/profile');
      }
    }
  };

  const selectedValues = phase === 'my' ? myAnswer : partnerAnswer;

  const progress = ((currentQ * 2 + (phase === 'partner' ? 1 : 0)) / (week1Questions.length * 2)) * 33 + 33;

  return (
    <div className="min-h-dvh flex flex-col px-6 py-8">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <p className="text-sm font-medium text-text-secondary">💭 步驟 2/3 · 情境題</p>
          <span className="pill pill-primary">
            {currentQ + 1} / {week1Questions.length}
          </span>
        </div>
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Phase indicator */}
      <div className="flex items-center gap-2 mb-4 animate-fade-in" key={phase}>
        {phase === 'my' ? (
          <div className="pill pill-primary flex items-center gap-2 !py-2 !px-4">
            <User size={16} />
            🙋 你的選擇
          </div>
        ) : (
          <div className="pill pill-accent flex items-center gap-2 !py-2 !px-4">
            <Users size={16} />
            💕 你希望對方的選擇
          </div>
        )}
      </div>

      {/* Question */}
      <div className="flex-1 animate-slide-up" key={`${currentQ}-${phase}`}>
        <div className="card mb-4 !border-none" style={{ background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.06), rgba(244, 63, 94, 0.04))' }}>
          <p className="text-xs font-semibold text-primary mb-1">{question.category}</p>
          <h2 className="text-lg font-bold">{question.question}</h2>
          <p className="text-xs text-accent mt-2">可複選 ✨</p>
        </div>

        <div className="space-y-3">
          {question.options.map((option, idx) => (
            <button
              key={idx}
              className={`option-card flex items-center gap-3 ${selectedValues.includes(idx) ? 'selected' : ''}`}
              onClick={() => toggleOption(idx)}
            >
              <span className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all" style={{
                borderColor: selectedValues.includes(idx) ? 'var(--primary)' : 'var(--border)',
                background: selectedValues.includes(idx) ? 'linear-gradient(135deg, #7C3AED, #F43F5E)' : 'transparent',
              }}>
                {selectedValues.includes(idx) && <span className="text-white text-xs">✓</span>}
              </span>
              {option}
            </button>
          ))}
        </div>
      </div>

      <button
        className="btn-primary flex items-center justify-center gap-2 mt-6"
        onClick={handleNext}
        disabled={selectedValues.length === 0}
      >
        {phase === 'my' ? '接下來：對方的理想選擇 →' : currentQ < week1Questions.length - 1 ? '下一題 →' : '完成情境題 ✅'}
      </button>
    </div>
  );
}
