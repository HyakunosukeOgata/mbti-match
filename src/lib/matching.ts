import { UserProfile, ScenarioAnswer } from './types';
import { scenarioQuestions } from './mock-data';

/**
 * 計算兩個使用者的配對分數 (0-100)
 * 基於：情境題匹配 + MBTI 相容度
 */
export function calculateCompatibility(me: UserProfile, other: UserProfile): number {
  const scenarioScore = calculateScenarioMatch(me, other);
  const mbtiScore = calculateMBTICompatibility(me, other);
  
  // 情境題佔 70%，MBTI 佔 30%
  return Math.round(scenarioScore * 0.7 + mbtiScore * 0.3);
}

/**
 * 情境題配對：
 * 我希望對方怎麼做 vs 對方實際怎麼做
 * 對方希望我怎麼做 vs 我實際怎麼做
 */
function calculateScenarioMatch(me: UserProfile, other: UserProfile): number {
  const myAnswers = me.scenarioAnswers;
  const otherAnswers = other.scenarioAnswers;
  
  if (myAnswers.length === 0 || otherAnswers.length === 0) return 50;
  
  let totalScore = 0;
  let matchedQuestions = 0;
  
  for (const myAns of myAnswers) {
    const otherAns = otherAnswers.find(a => a.questionId === myAns.questionId);
    if (!otherAns) continue;
    
    matchedQuestions++;
    
    // 防禦：確保是陣列（舊資料可能是 number）
    const myPartner = Array.isArray(myAns.partnerAnswer) ? myAns.partnerAnswer : [myAns.partnerAnswer];
    const myMy = Array.isArray(myAns.myAnswer) ? myAns.myAnswer : [myAns.myAnswer];
    const otherPartner = Array.isArray(otherAns.partnerAnswer) ? otherAns.partnerAnswer : [otherAns.partnerAnswer];
    const otherMy = Array.isArray(otherAns.myAnswer) ? otherAns.myAnswer : [otherAns.myAnswer];

    // 我希望對方 = 對方實際（複選交集比例）
    const forwardOverlap = myPartner.filter(v => otherMy.includes(v)).length;
    const forwardMax = Math.max(myPartner.length, 1);
    const forward = (forwardOverlap / forwardMax) * 50;
    // 對方希望我 = 我實際（複選交集比例）
    const backwardOverlap = otherPartner.filter(v => myMy.includes(v)).length;
    const backwardMax = Math.max(otherPartner.length, 1);
    const backward = (backwardOverlap / backwardMax) * 50;
    
    totalScore += forward + backward;
  }
  
  if (matchedQuestions === 0) return 50;
  return totalScore / matchedQuestions;
}

/**
 * MBTI 相容度計算
 * 基於心理學理論的互補/相似配對
 */
function calculateMBTICompatibility(me: UserProfile, other: UserProfile): number {
  const m = me.mbti;
  const o = other.mbti;
  
  let score = 0;
  
  // E/I - 互補或相似都可以，但強度接近加分
  const eiDiff = Math.abs(
    (m.EI.type === 'E' ? m.EI.strength : -m.EI.strength) -
    (o.EI.type === 'E' ? o.EI.strength : -o.EI.strength)
  );
  score += Math.max(0, 25 - eiDiff / 8);
  
  // S/N - 相似加分  
  if (m.SN.type === o.SN.type) {
    score += 25;
  } else {
    score += 10;
  }
  
  // T/F - 互補加分
  if (m.TF.type !== o.TF.type) {
    score += 25;
  } else {
    score += 15;
  }
  
  // J/P - 互補加分
  if (m.JP.type !== o.JP.type) {
    score += 25;
  } else {
    score += 15;
  }
  
  return score;
}

/**
 * 基本篩選：年齡、性別偏好、地區
 */
export function passesBasicFilters(me: UserProfile, other: UserProfile): boolean {
  // 性別偏好
  if (!me.preferences.genderPreference.includes(other.gender)) return false;
  
  // 年齡範圍
  if (other.age < me.preferences.ageMin || other.age > me.preferences.ageMax) return false;
  
  return true;
}

/**
 * 取得兩人的共同選擇（你們都選了哪些一樣的選項）
 */
export interface SharedAnswer {
  category: string;
  question: string;
  sharedOptions: string[];
}

export function getSharedAnswers(me: UserProfile, other: UserProfile): SharedAnswer[] {
  const results: SharedAnswer[] = [];

  for (const myAns of me.scenarioAnswers) {
    const otherAns = other.scenarioAnswers.find(a => a.questionId === myAns.questionId);
    if (!otherAns) continue;

    const question = scenarioQuestions.find(q => q.id === myAns.questionId);
    if (!question) continue;

    const myMy = Array.isArray(myAns.myAnswer) ? myAns.myAnswer : [myAns.myAnswer];
    const otherMy = Array.isArray(otherAns.myAnswer) ? otherAns.myAnswer : [otherAns.myAnswer];

    const shared = myMy.filter(v => otherMy.includes(v));
    if (shared.length > 0) {
      results.push({
        category: question.category,
        question: question.question,
        sharedOptions: shared.map(idx => question.options[idx]).filter(Boolean),
      });
    }
  }

  return results;
}

/**
 * 從候選人中選出今日 5 張卡片
 */
export function getDailyMatches(me: UserProfile, candidates: UserProfile[]): UserProfile[] {
  const eligible = candidates
    .filter(c => c.id !== me.id && c.onboardingComplete && passesBasicFilters(me, c))
    .map(c => ({
      user: c,
      score: calculateCompatibility(me, c)
    }))
    .sort((a, b) => b.score - a.score);
  
  // 取前 5 名
  return eligible.slice(0, 5).map(e => e.user);
}
