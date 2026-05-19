import Mux from '@mux/mux-node'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    // Mux client BINNEN de functie aanmaken
    const mux = new Mux({
      tokenId: process.env.MUX_TOKEN_ID!,
      tokenSecret: process.env.MUX_TOKEN_SECRET!,
    })

    const upload = await mux.video.uploads.create({
      new_asset_settings: {
        playback_policy: ['public'],
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
