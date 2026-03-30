import { supabase } from './supabase';

function dataUrlToBlob(dataUrl: string) {
  const commaIndex = dataUrl.indexOf(',');
  if (commaIndex === -1) {
    throw new Error('Invalid data URL format');
  }
  const header = dataUrl.slice(0, commaIndex);
  const base64 = dataUrl.slice(commaIndex + 1);
  const mimeMatch = header.match(/data:(.*?);base64/);
  const mimeType = mimeMatch?.[1] || 'image/jpeg';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], { type: mimeType });
}

function getExtensionFromMimeType(mimeType: string) {
  switch (mimeType) {
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/gif':
      return 'gif';
    default:
      return 'jpg';
  }
}

export async function uploadChatImage({
  authUserId,
  matchId,
  dataUrl,
}: {
  authUserId: string;
  matchId: string;
  dataUrl: string;
}) {
  const blob = dataUrlToBlob(dataUrl);
  const extension = getExtensionFromMimeType(blob.type);
  const filePath = `${authUserId}/chat/${matchId}/${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from('user-photos')
    .upload(filePath, blob, {
      contentType: blob.type,
      upsert: false,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage.from('user-photos').getPublicUrl(filePath);
  return data.publicUrl;
}
