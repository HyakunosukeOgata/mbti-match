import type { ScoringFeatures } from '@/lib/types';

export function getAttachmentStyleLabel(value: ScoringFeatures['attachmentStyle']) {
  switch (value) {
    case 'secure':
      return '安心投入型';
    case 'anxious':
      return '敏感確認型';
    case 'avoidant':
      return '慢熟保留型';
    case 'mixed':
    default:
      return '需要觀察型';
  }
}

export function getConflictStyleLabel(value: ScoringFeatures['conflictStyle']) {
  switch (value) {
    case 'collaborator':
      return '一起解決型';
    case 'compromiser':
      return '願意折衷型';
    case 'confronter':
      return '直接面對型';
    case 'avoider':
    default:
      return '先冷靜一下型';
  }
}

export function getLifePaceLabel(value: ScoringFeatures['lifePace']) {
  switch (value) {
    case 'slow':
      return '慢步調';
    case 'fast':
      return '行動派';
    case 'moderate':
    default:
      return '剛剛好';
  }
}
