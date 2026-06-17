import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Mux from '@mux/mux-node';

/**
 * Get a signed playback token for a Mux asset.
 *
 * SECURITY:
 * 1. User is verified SERVER-SIDE via Bearer token (Supabase session).
 * 2. Admin (role_level >= 100) gets tokens without enrollment check.
 * 3. Free lessons: only require login (no enrollment).
 * 4. Paid lessons: require login AND active enrollment.
 * 5. user_id is NEVER trusted from query params — always from the verified session.
 *
 * Query params:
 *   playback_id — Mux playback ID (required)
 *   course_id — for enrollment check on paid content
 *   is_free — if "true", skip enrollment check (still requires login)
 */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const playbackId = searchParams.get('playback_id');
  if (!playbackId) {
    return NextResponse.json({ error: 'playback_id required' }, { status: 400 });
  }

  // ── STEP 1: Verify session SERVER-SIDE via Bearer token ──
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
  const accessToken = authHeader.replace('Bearer ', '');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Verify the JWT belongs to a real user
  const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
  if (authError || !user) {
    return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
  }

  // ── STEP 2: Check if user is admin (server-side) ──
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, role_level')
    .eq('id', user.id)
    .single();

  const isAdmin = (profile?.role_level >= 100) || (profile?.role === 'admin');

  // ── STEP 3: Determine access ──
  const isFree = searchParams.get('is_free') === 'true';
  const courseId = searchParams.get('course_id');

  if (!isAdmin && !isFree && courseId) {
    // Paid lesson — check enrollment using verified user.id
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .eq('status', 'active')
      .limit(1);

    if (!enrollment || enrollment.length === 0) {
      return NextResponse.json({ error: 'No active enrollment for this course' }, { status: 403 });
    }
  }

  // ── STEP 4: Check for signing keys ──
  const keyId = process.env.MUX_SIGNING_KEY_ID;
  const keySecret = process.env.MUX_SIGNING_PRIVATE_KEY;

  if (!keyId || !keySecret) {
    console.error('[playback-token] MUX_SIGNING_KEY_ID or MUX_SIGNING_PRIVATE_KEY not configured');
    return NextResponse.json({ error: 'Signing keys not configured' }, { status: 500 });
  }

  // ── STEP 5: Generate signed token via Mux SDK ──
  try {
    const mux = new Mux({
      tokenId: process.env.MUX_TOKEN_ID!,
      tokenSecret: process.env.MUX_TOKEN_SECRET!,
    });

    const token = await mux.jwt.signPlaybackId(playbackId, {
      type: 'video',
      expiration: '2h',
      keyId,
      keySecret,
    });

    return NextResponse.json({ token });
  } catch (err) {
    console.error('[playback-token] Token generation failed:', err);
    return NextResponse.json({ error: 'Token generation failed' }, { status: 500 });
  }
}
