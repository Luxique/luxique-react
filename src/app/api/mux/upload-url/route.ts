import Mux from '@mux/mux-node'
import { NextResponse } from 'next/server'

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
})

export async function POST() {
  try {
    const upload = await mux.video.uploads.create({
      new_asset_settings: {
        playback_policy: ['public'],
        mp4_support: 'none',
      },
      cors_origin: '*',
    })

    console.log('Mux upload created:', upload.id, upload.url)

    return NextResponse.json({
      upload_url: upload.url,
      upload_id: upload.id,
    })
  } catch (error) {
    console.error('Mux upload error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
