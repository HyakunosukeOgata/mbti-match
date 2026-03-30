import test from 'node:test';
import assert from 'node:assert/strict';

import {
  enforceChatEnvelope,
  evaluateChatReadiness,
  extractChatEnvelope,
  normalizeAnalysis,
  normalizeGeneratedBio,
  normalizeMessages,
  parseJsonObject,
} from './chat-core.mjs';

test('normalizeMessages keeps valid chat messages and trims noise', () => {
  const messages = normalizeMessages([
    null,
    { role: 'user', content: ' 你好 ' },
    { role: 'assistant', content: ' ' },
    { role: 'admin', content: 'nope' },
    { role: 'assistant', content: '哈囉' },
  ]);

  assert.deepEqual(messages, [
    { role: 'user', content: '你好' },
    { role: 'assistant', content: '哈囉' },
  ]);
});

test('extractChatEnvelope can recover JSON after plain text', () => {
  const parsed = extractChatEnvelope('先聊一下\n{"message":"嗨","readyToAnalyze":true}');
  assert.deepEqual(parsed, { message: '嗨', readyToAnalyze: true });
});

test('evaluateChatReadiness only marks ready when enough substantial coverage exists', () => {
  const ready = evaluateChatReadiness([
    { role: 'user', content: '你好，我剛加入 Mochi' },
    { role: 'assistant', content: '如果朋友臨時約你明天出去玩，你通常會？' },
    { role: 'user', content: '我會看當下累不累。' },
    { role: 'assistant', content: '認識新對象時，你通常會主動還是慢慢來？' },
    { role: 'user', content: '慢慢來，我不喜歡太急。' },
    { role: 'assistant', content: '如果對方已讀不回，你通常會怎麼想？' },
    { role: 'user', content: '我會先等等，不太會追著問。' },
    { role: 'assistant', content: '你現在是想認真找對象，還是先認識看看？' },
    { role: 'user', content: '如果聊得來，我是想認真交往。' },
    { role: 'assistant', content: '有沒有你絕對不能接受的事？' },
    { role: 'user', content: '情緒勒索跟不尊重別人時間都不行。' },
    { role: 'assistant', content: '如果你現在有一整天的空閒，你會怎麼過？' },
    { role: 'user', content: '睡到自然醒，做飯，看電影，傍晚去散步。' },
  ]);

  assert.equal(ready.isReady, true);
  assert.equal(ready.substantialAnswerCount, 7);
  assert.ok(ready.dimensionCount >= 4);

  const notReady = evaluateChatReadiness([
    { role: 'user', content: '你好' },
    { role: 'assistant', content: '如果朋友臨時約你明天出去玩，你通常會？' },
    { role: 'user', content: '都可以' },
    { role: 'assistant', content: '認識新對象時，你通常會主動還是慢慢來？' },
    { role: 'user', content: '不知道' },
  ]);

  assert.equal(notReady.isReady, false);
});

test('enforceChatEnvelope blocks premature completion', () => {
  const guarded = enforceChatEnvelope(
    { message: '我來幫你整理', readyToAnalyze: true },
    [
      { role: 'assistant', content: '如果朋友臨時約你明天出去玩，你通常會？' },
      { role: 'user', content: '都可以' },
    ],
  );

  assert.deepEqual(guarded, { message: '我來幫你整理', readyToAnalyze: false });
});

test('normalizeAnalysis sanitizes fields and preserves required structure', () => {
  const normalized = normalizeAnalysis({
    bio: '  喜歡做飯，也喜歡海邊。  ',
    personality_profile: {
      traits: [
        { name: '慢熱', score: 120, category: 'social' },
        { name: '  ', score: 90, category: 'social' },
      ],
      values: ['舒適', '真誠', '舒適'],
    },
    dating_style: ' 慢慢來比較舒服 ',
    communication_style: ' 不喜歡追問，習慣先等一下。 ',
    relationship_goal: ' 想找能長久相處的人 ',
    red_flags: ['情緒勒索', '情緒勒索'],
    tags: ['慢熱', '#重視空間'],
    scoring_features: {
      attachmentStyle: 'secure',
      socialEnergy: 200,
      conflictStyle: 'avoider',
      loveLanguage: '品質相伴',
      lifePace: 'moderate',
      emotionalDepth: -1,
    },
    chatSummary: '  慢熱、重視節奏，也願意認真交往。 ',
  });

  assert.ok(normalized);
  assert.deepEqual(normalized.personality_profile.traits, [
    { name: '慢熱', score: 100, category: 'social' },
  ]);
  assert.deepEqual(normalized.tags, ['#慢熱', '#重視空間']);
  assert.equal(normalized.scoring_features.socialEnergy, 100);
  assert.equal(normalized.scoring_features.emotionalDepth, 0);
});

test('normalizeAnalysis rejects payloads missing required fields', () => {
  const normalized = normalizeAnalysis({
    bio: '只有摘要',
    personality_profile: { traits: [], values: [] },
  });

  assert.equal(normalized, null);
});

test('normalizeGeneratedBio returns safe trimmed bio text', () => {
  assert.equal(normalizeGeneratedBio({ bio: '  在台北生活，喜歡週末做飯。 ' }), '在台北生活，喜歡週末做飯。');
  assert.equal(normalizeGeneratedBio({ nope: 'x' }), '');
});

test('parseJsonObject accepts fenced json', () => {
  const parsed = parseJsonObject('```json\n{"bio":"hi"}\n```');
  assert.deepEqual(parsed, { bio: 'hi' });
});
