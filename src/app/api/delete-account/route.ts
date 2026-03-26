import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  // Get the user's access token from Authorization header
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: '未授權' }, { status: 401 });
  }
  const token = authHeader.slice(7);

  // Verify the token and get user
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const userClient = createClient(supabaseUrl, supabaseAnonKey);
  const { data: { user }, error: userError } = await userClient.auth.getUser(token);

  if (userError || !user) {
    return NextResponse.json({ error: '無效的 token' }, { status: 401 });
  }

  const adminClient = createServerClient();

  const { data: profile } = await adminClient
    .from('users')
    .select('id')
    .eq('auth_id', user.id)
    .maybeSingle();

  // Delete profile data FIRST, then auth user LAST
  // This ensures no orphaned data if auth deletion succeeds but data deletion fails
  if (profile?.id) {
    await adminClient.from('likes').delete().eq('from_user_id', profile.id);
    await adminClient.from('likes').delete().eq('to_user_id', profile.id);
    await adminClient.from('reports').delete().eq('reporter_id', profile.id);
    await adminClient.from('reports').delete().eq('reported_user_id', profile.id);
    await adminClient.from('notifications').delete().eq('user_id', profile.id);
    await adminClient.from('messages').delete().eq('sender_id', profile.id);
    await adminClient.from('matches').delete().eq('user1_id', profile.id);
    await adminClient.from('matches').delete().eq('user2_id', profile.id);
    await adminClient.from('daily_cards').delete().eq('user_id', profile.id);
    await adminClient.from('daily_cards').delete().eq('target_user_id', profile.id);
    await adminClient.from('skipped_users').delete().eq('user_id', profile.id);
    await adminClient.from('skipped_users').delete().eq('skipped_user_id', profile.id);
    await adminClient.from('blocked_users').delete().eq('blocker_id', profile.id);
    await adminClient.from('blocked_users').delete().eq('blocked_id', profile.id);
    await adminClient.from('photo_consents').delete().eq('requester_id', profile.id);
  }

  // Delete user row from `users` table
  await adminClient.from('users').delete().eq('auth_id', user.id);

  // Delete user photos from storage
  const { data: photos } = await adminClient.storage
    .from('user-photos')
    .list(user.id);
  if (photos && photos.length > 0) {
    await adminClient.storage
      .from('user-photos')
      .remove(photos.map(p => `${user.id}/${p.name}`));
  }

  // Delete auth user LAST — only after all data is cleaned up
  const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);
  if (deleteError) {
    return NextResponse.json({ error: '刪除失敗' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
