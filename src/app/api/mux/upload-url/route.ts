import Mux from '@mux/mux-node'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const isFree = body.is_free === true

    const mux = new Mux({
      tokenId: process.env.MUX_TOKEN_ID!,
      tokenSecret: process.env.MUX_TOKEN_SECRET!,
    })

    // Free preview lessons use public playback, paid content uses signed tokens
    // Required env vars for signed playback:
    //   MUX_SIGNING_KEY_ID — from Mux Dashboard → Settings → API Keys → Signing Keys
    //   MUX_SIGNING_PRIVATE_KEY — the private key file contents (.pem)
    const playbackPolicy: ('public' | 'signed')[] = isFree ? ['public'] : ['signed']

    const upload = await mux.video.uploads.create({
      new_asset_settings: {
        playback_policy: playbackPolicy,
        mp4_support: 'none',
      },
      cors_origin: '*',
    })

    return NextResponse.json({
      upload_url: upload.url,
      upload_id: upload.id,
    })
  } catch (error) {
    console.error('Mux upload error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
