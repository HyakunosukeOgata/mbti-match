import { ChatMessage } from './types';

const IMAGE_MESSAGE_PREFIX = '__MOCHI_IMAGE__';

interface StoredImageMessagePayload {
  url: string;
  caption?: string;
}

export function serializeImageMessage(payload: StoredImageMessagePayload): string {
  return `${IMAGE_MESSAGE_PREFIX}${JSON.stringify(payload)}`;
}

export function parseStoredMessage(text: string): Pick<ChatMessage, 'type' | 'text' | 'imageUrl'> {
  if (!text.startsWith(IMAGE_MESSAGE_PREFIX)) {
    return {
      type: 'text',
      text,
      imageUrl: undefined,
    };
  }

  try {
    const payload = JSON.parse(text.slice(IMAGE_MESSAGE_PREFIX.length)) as StoredImageMessagePayload;
    if (typeof payload.url !== 'string' || !payload.url) {
      throw new Error('Missing image URL');
    }

    return {
      type: 'image',
      text: typeof payload.caption === 'string' ? payload.caption : '',
      imageUrl: payload.url,
    };
  } catch {
    return {
      type: 'text',
      text,
      imageUrl: undefined,
    };
  }
}

export function getMessagePreview(message: Pick<ChatMessage, 'type' | 'text'>, isMine = false): string {
  if (message.type === 'image') {
    const prefix = isMine ? '你傳送了' : '傳來了';
    return message.text ? `${prefix}一張照片：${message.text}` : `${prefix}一張照片`;
  }

  return message.text || '';
}
