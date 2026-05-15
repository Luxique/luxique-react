import Mux from '@mux/mux-node';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const playbackId = searchParams.get('playback_id');
  if (!playbackId) return NextResponse.json({ error: 'playback_id required' }, { status: 400 });

  const mux = new Mux({
    tokenId: process.env.MUX_TOKEN_ID!,
    tokenSecret: process.env.MUX_TOKEN_SECRET!,
  });

  // Check if signing keys exist in env
  const keyId = process.env.MUX_SIGNING_KEY_ID;
  const keySecret = process.env.MUX_SIGNING_PRIVATE_KEY;

  if (keyId && keySecret) {
    // Generate signed token
    const token = await mux.jwt.signPlaybackId(playbackId, {
      type: 'video',
      expiration: '7d',
      keyId,
      keySecret,
    });
    return NextResponse.json({ token });
  }

  // No signing keys — asset should be public
  return NextResponse.json({ token: null, note: 'No signing keys configured, asset should be public' });
}