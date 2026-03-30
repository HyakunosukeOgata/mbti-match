import { evaluateChatReadiness, enforceChatEnvelope } from './src/lib/ai/chat-core.mjs';

// Real Chinese conversation matching the AI chat flow
const msgs = [
  { role: 'assistant', content: '嗨！平常週末你都怎麼過？在家還是出去玩？' },
  { role: 'user', content: '我通常週末會去爬山或騎腳踏車' },
  { role: 'assistant', content: '你的個性是什麼？朋友怎麼形容你？喜歡獨處還是社交？' },
  { role: 'user', content: '他們說我很有上進心而且很誠實' },
  { role: 'assistant', content: '感情方面，你覺得交往節奏怎樣比較舒服？' },
  { role: 'user', content: '慢慢來比較好，不喜歡太快進入關係' },
  { role: 'assistant', content: '意見不合或吵架的時候你通常怎麼溝通？' },
  { role: 'user', content: '我會先冷靜一下再好好溝通' },
  { role: 'assistant', content: '你人生中最重要的價值觀是什麼？' },
  { role: 'user', content: '家人跟健康吧，還有不斷成長' },
  { role: 'assistant', content: '有什麼不能接受的地雷嗎？' },
  { role: 'user', content: '不尊重個人空間的人，還有不誠實' },
  { role: 'assistant', content: '理想的交往狀態是什麼樣？' },
  { role: 'user', content: '互相獨立但偶爾會給驚喜' },
];

console.log('=== Chinese conversation (7 user msgs, 6 dimensions) ===');
const r = evaluateChatReadiness(msgs);
console.log('substantialAnswerCount:', r.substantialAnswerCount);
console.log('dimensionCount:', r.dimensionCount);
console.log('isReady:', r.isReady);

const env = enforceChatEnvelope({ message: 'OK', readyToAnalyze: true }, msgs);
console.log('envelope readyToAnalyze:', env?.readyToAnalyze);
