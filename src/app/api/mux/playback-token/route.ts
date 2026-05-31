import Mux from '@mux/mux-node';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Get a signed playback token for Mux.
 * For signed (paid) content, requires enrollment verification via user_id + course_id params.
 * For public (free) content, no enrollment check needed.
 *
 * Query params:
 *   playback_id — Mux playback ID (required)
 *   user_id — for enrollment check on signed content
 *   course_id — for enrollment check on signed content
 *   is_free — if "true", skip enrollment check (public asset)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const playbackId = searchParams.get('playback_id');
  if (!playbackId) return NextResponse.json({ error: 'playback_id required' }, { status: 400 });

  const mux = new Mux({
    tokenId: process.env.MUX_TOKEN_ID!,
    tokenSecret: process.env.MUX_TOKEN_SECRET!,
  });

  const keyId = process.env.MUX_SIGNING_KEY_ID;
  const keySecret = process.env.MUX_SIGNING_PRIVATE_KEY;

  if (!keyId || !keySecret) {
    // No signing keys — asset must be public
    return NextResponse.json({ token: null, note: 'No signing keys configured, asset should be public' });
  }

  // Check if this is a free/public asset
  const isFree = searchParams.get('is_free') === 'true';
  if (isFree) {
    // Free lessons don't need signed tokens
    return NextResponse.json({ token: null, note: 'Free content, no signed token needed' });
  }

  // Paid content — verify enrollment
  const userId = searchParams.get('user_id');
  const courseId = searchParams.get('course_id');

  if (!userId || !courseId) {
    return NextResponse.json({ error: 'user_id and course_id required for paid content' }, { status: 403 });
  }

  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .eq('status', 'active')
    .limit(1);

  if (!enrollment || enrollment.length === 0) {
    return NextResponse.json({ error: 'No active enrollment' }, { status: 403 });
  }

  // Generate signed token
  const token = await mux.jwt.signPlaybackId(playbackId, {
    type: 'video',
    expiration: '7d',
    keyId,
    keySecret,
  });

  return NextResponse.json({ token });
}
