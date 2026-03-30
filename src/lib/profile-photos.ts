import { supabase } from './supabase';

function dataUrlToBlob(dataUrl: string) {
  const commaIndex = dataUrl.indexOf(',');
  if (commaIndex === -1) throw new Error('Invalid data URL');
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

function extractStoragePath(url: string) {
  const marker = '/storage/v1/object/public/user-photos/';
  const markerIndex = url.indexOf(marker);
  if (markerIndex === -1) return null;
  return decodeURIComponent(url.slice(markerIndex + marker.length));
}

export async function loadProfilePhotos(userDbId: string) {
  const { data, error } = await supabase
    .from('user_photos')
    .select('url, sort_order')
    .eq('user_id', userDbId)
    .order('sort_order', { ascending: true });

  if (error || !data) return [];
  return data.map((photo) => photo.url);
}

export async function syncProfilePhotos({
  authUserId,
  userDbId,
  photos,
}: {
  authUserId: string;
  userDbId: string;
  photos: string[];
}) {
  const { data: existingRows } = await supabase
    .from('user_photos')
    .select('url')
    .eq('user_id', userDbId);

  const keptUrls = photos.filter((photo) => !photo.startsWith('data:'));
  const removedUrls = (existingRows || [])
    .map((row) => row.url)
    .filter((url) => !keptUrls.includes(url));

  if (removedUrls.length > 0) {
    const pathsToRemove = removedUrls
      .map(extractStoragePath)
      .filter((path): path is string => !!path);
    if (pathsToRemove.length > 0) {
      await supabase.storage.from('user-photos').remove(pathsToRemove);
    }
  }

  const uploadedUrls: string[] = [];
  for (let index = 0; index < photos.length; index += 1) {
    const photo = photos[index];
    if (!photo.startsWith('data:')) continue;

    const blob = dataUrlToBlob(photo);
    const extension = getExtensionFromMimeType(blob.type);
    const filePath = `${authUserId}/${Date.now()}-${index}.${extension}`;

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
    uploadedUrls.push(data.publicUrl);
  }

  const finalUrls = photos.map((photo) => {
    if (!photo.startsWith('data:')) return photo;
    return uploadedUrls.shift() || photo;
  });

  // Delete old rows then insert new ones
  await supabase.from('user_photos').delete().eq('user_id', userDbId);

  if (finalUrls.length > 0) {
    const { error: insertError } = await supabase.from('user_photos').insert(
      finalUrls.map((url, sortOrder) => ({
        user_id: userDbId,
        url,
        sort_order: sortOrder,
      }))
    );
    if (insertError) throw insertError;
  }

  return finalUrls;
}
