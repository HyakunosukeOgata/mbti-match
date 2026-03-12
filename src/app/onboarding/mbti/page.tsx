'use client';

import { useApp } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { MBTIProfile, MBTIStrength } from '@/lib/types';
import { ArrowRight } from 'lucide-react';

const dimensions = [
  {
    key: 'EI' as const,
    left: { code: 'E', label: '外向', desc: '從社交中獲得能量，喜歡互動' },
    right: { code: 'I', label: '內向', desc: '從獨處中獲得能量，喜歡深度思考' },
  },
  {
    key: 'SN' as const,
    left: { code: 'S', label: '實感', desc: '注重實際和細節，相信經驗' },
    right: { code: 'N', label: '直覺', desc: '注重可能性和未來，相信靈感' },
  },
  {
    key: 'TF' as const,
    left: { code: 'T', label: '思考', desc: '用邏輯分析做決定' },
    right: { code: 'F', label: '情感', desc: '用價值觀和感受做決定' },
  },
  {
    key: 'JP' as const,
    left: { code: 'J', label: '判斷', desc: '喜歡計劃和條理，追求確定性' },
    right: { code: 'P', label: '感知', desc: '喜歡彈性和開放，享受即興' },
  },
];

const strengths: MBTIStrength[] = [50, 75, 100];

export default function MBTIPage() {
  const { currentUser, updateProfile, setOnboardingStep } = useApp();
  const router = useRouter();
  const [currentDim, setCurrentDim] = useState(0);
  const [mbti, setMbti] = useState<MBTIProfile>(
    currentUser?.mbti || {
      EI: { type: 'E', strength: 50 },
      SN: { type: 'S', strength: 50 },
      TF: { type: 'T', strength: 50 },
      JP: { type: 'J', strength: 50 },
    }
  );

  useEffect(() => {
    if (!currentUser) {
      router.replace('/');
    }
  }, [currentUser, router]);

  if (!currentUser) return null;

  const dim = dimensions[currentDim];
  const currentValue = mbti[dim.key];

  const selectType = (type: string) => {
    setMbti(prev => ({
      ...prev,
      [dim.key]: { ...prev[dim.key], type },
    }));
  };

  const selectStrength = (strength: MBTIStrength) => {
    setMbti(prev => ({
      ...prev,
      [dim.key]: { ...prev[dim.key], strength },
    }));
  };

  const handleNext = () => {
    if (currentDim < 3) {
      setCurrentDim(currentDim + 1);
    } else {
      // 完成 MBTI 設定
      updateProfile({ mbti });
      setOnboardingStep(2);
      router.push('/onboarding/scenarios');
    }
  };

  const handleBack = () => {
    if (currentDim > 0) {
      setCurrentDim(currentDim - 1);
    }
  };

  const mbtiCode = mbti.EI.type + mbti.SN.type + mbti.TF.type + mbti.JP.type;

  return (
    <div className="min-h-dvh flex flex-col px-6 py-8">
      {/* 進度條 */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm text-text-secondary">步驟 1/3 — MBTI 人格</p>
          <span className="mbti-badge">{mbtiCode}</span>
        </div>
        <div className="w-full h-2 bg-bg-card rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300 bg-accent"
            style={{
              width: `${((currentDim + 1) / 4) * 33}%`,
            }}
          />
        </div>
      </div>

      {/* 維度選擇 */}
      <div className="flex-1 animate-slide-up" key={currentDim}>
        <h2 className="text-xl font-bold mb-1">
          第 {currentDim + 1} 維度
        </h2>
        <p className="text-text-secondary text-sm mb-6">
          你覺得自己比較偏向哪一邊？
        </p>

        {/* 類型選擇 */}
        <div className="space-y-3 mb-8">
          <button
            className={`option-card flex items-start gap-3 ${currentValue.type === dim.left.code ? 'selected' : ''}`}
            onClick={() => selectType(dim.left.code)}
          >
            <span className="text-2xl font-bold text-accent">{dim.left.code}</span>
            <div>
              <p className="font-semibold">{dim.left.label}</p>
              <p className="text-sm text-text-secondary">{dim.left.desc}</p>
            </div>
          </button>

          <button
            className={`option-card flex items-start gap-3 ${currentValue.type === dim.right.code ? 'selected' : ''}`}
            onClick={() => selectType(dim.right.code)}
          >
            <span className="text-2xl font-bold text-accent-light">{dim.right.code}</span>
            <div>
              <p className="font-semibold">{dim.right.label}</p>
              <p className="text-sm text-text-secondary">{dim.right.desc}</p>
            </div>
          </button>
        </div>

        {/* 強度選擇 */}
        <div>
          <p className="text-sm text-text-secondary mb-3">
            你有多確定？（偏向程度）
          </p>
          <div className="flex gap-3 justify-center">
            {strengths.map((s) => (
              <button
                key={s}
                className={`strength-btn ${currentValue.strength === s ? 'active' : ''}`}
                onClick={() => selectStrength(s)}
              >
                {s}%
              </button>
            ))}
          </div>
          <p className="text-xs text-text-secondary text-center mt-2">
            {currentValue.strength === 50 && '有點偏向，但不太確定'}
            {currentValue.strength === 75 && '蠻確定的'}
            {currentValue.strength === 100 && '非常確定！'}
          </p>
        </div>
      </div>

      {/* 導航按鈕 */}
      <div className="flex gap-3 mt-6">
        {currentDim > 0 && (
          <button className="btn-secondary flex-1" onClick={handleBack}>
            上一步
          </button>
        )}
        <button className="btn-primary flex-1 flex items-center justify-center gap-2" onClick={handleNext}>
          {currentDim < 3 ? '下一個維度' : '完成 MBTI'}
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
