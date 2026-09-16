'use client'

import { useCallback, useEffect, useState } from 'react'
import Cropper, { type Area } from 'react-easy-crop'

type Props = {
  source: string
  onCancel: () => void
  onConfirm: (blob: Blob) => Promise<void>
}

type AspectOption = 'original' | '16:9' | '4:3' | '1:1' | '3:4'

const ASPECTS: Record<Exclude<AspectOption, 'original'>, number> = {
  '16:9': 16 / 9,
  '4:3': 4 / 3,
  '1:1': 1,
  '3:4': 3 / 4,
}

async function renderCrop(source: string, crop: Area, width: number, height: number) {
  const image = new Image()
  // Stored course images are served from Supabase. Without anonymous CORS the
  // browser lets the image render, but taints the canvas and blocks toBlob().
  if (!source.startsWith('blob:') && !source.startsWith('data:')) {
    image.crossOrigin = 'anonymous'
  }
  image.src = source
  await image.decode()
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas is niet beschikbaar.')
  context.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, width, height)
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Foto verwerken mislukt.')), 'image/webp', 0.9)
  })
}

export default function ImageCropModal({ source, onCancel, onConfirm }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [aspectOption, setAspectOption] = useState<AspectOption>('original')
  const [pixels, setPixels] = useState<Area | null>(null)
  const [busy, setBusy] = useState(false)
  const [imageReady, setImageReady] = useState(false)
  const [error, setError] = useState('')
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 })
  const aspect = aspectOption === 'original'
    ? (naturalSize.width && naturalSize.height ? naturalSize.width / naturalSize.height : 1)
    : ASPECTS[aspectOption]
  const onCropComplete = useCallback((_area: Area, cropped: Area) => setPixels(cropped), [])

  useEffect(() => {
    let active = true
    setImageReady(false)
    setPixels(null)
    setError('')

    const image = new Image()
    if (!source.startsWith('blob:') && !source.startsWith('data:')) {
      image.crossOrigin = 'anonymous'
    }
    image.onload = () => {
      if (active) {
        setNaturalSize({ width: image.naturalWidth, height: image.naturalHeight })
        setImageReady(true)
      }
    }
    image.onerror = () => { if (active) setError('De foto kon niet worden geladen. Probeer het bestand opnieuw.') }
    image.src = source

    return () => { active = false }
  }, [source])

  const confirm = async () => {
    if (!pixels || !imageReady || busy) return
    setBusy(true)
    setError('')
    try {
      const outputWidth = Math.max(1, Math.round(pixels.width))
      const outputHeight = Math.max(1, Math.round(pixels.height))
      await onConfirm(await renderCrop(source, pixels, outputWidth, outputHeight))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Foto verwerken mislukt.')
    } finally {
      setBusy(false)
    }
  }

  return <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-label="Foto croppen">
    <div className="w-full max-w-3xl rounded-2xl bg-[#FAF8F4] p-5 shadow-2xl">
      <div className="mb-4 flex items-center justify-between"><h2 className="font-['Cormorant_Garamond'] text-2xl text-[#1E1A14]">Foto croppen en schalen</h2><button onClick={onCancel}>✕</button></div>
      <div className="relative h-[420px] overflow-hidden rounded-xl bg-[#16130f]">
        {!imageReady && !error && <div className="absolute inset-0 flex items-center justify-center text-sm text-white/70">Foto laden…</div>}
        {imageReady && <Cropper key={source} image={source} crop={crop} zoom={zoom} aspect={aspect} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} />}
      </div>
      {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="text-xs text-[#7A7268]">Uitsnede<select value={aspectOption} onChange={e => { setAspectOption(e.target.value as AspectOption); setCrop({ x: 0, y: 0 }); setZoom(1) }} className="mt-1 block w-full rounded-lg border p-2"><option value="original">Originele afmetingen</option><option value="16:9">Liggend 16:9</option><option value="4:3">Liggend 4:3</option><option value="1:1">Vierkant 1:1</option><option value="3:4">Staand 3:4</option></select></label>
        <label className="text-xs text-[#7A7268]">Zoom<input type="range" min={1} max={3} step={0.05} value={zoom} onChange={e => setZoom(Number(e.target.value))} className="mt-3 block w-full" /></label>
      </div>
      <div className="mt-5 flex justify-end gap-2"><button disabled={busy} onClick={onCancel} className="rounded-full border px-5 py-2 text-sm disabled:opacity-50">Annuleren</button><button disabled={busy || !imageReady || !pixels} onClick={confirm} className="rounded-full bg-[#C4A265] px-5 py-2 text-sm text-white disabled:opacity-50">{busy ? 'Verwerken…' : 'Crop toepassen'}</button></div>
    </div>
  </div>
}
