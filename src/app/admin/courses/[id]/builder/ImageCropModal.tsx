'use client'

import { useCallback, useState } from 'react'
import Cropper, { type Area } from 'react-easy-crop'

type Props = {
  source: string
  onCancel: () => void
  onConfirm: (blob: Blob) => void
}

async function renderCrop(source: string, crop: Area, width: number, height: number) {
  const image = new Image()
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
  const [aspect, setAspect] = useState(16 / 9)
  const [pixels, setPixels] = useState<Area | null>(null)
  const [width, setWidth] = useState(1200)
  const [busy, setBusy] = useState(false)
  const onCropComplete = useCallback((_area: Area, cropped: Area) => setPixels(cropped), [])

  const confirm = async () => {
    if (!pixels) return
    setBusy(true)
    try {
      const height = Math.max(1, Math.round(width / aspect))
      onConfirm(await renderCrop(source, pixels, width, height))
    } finally { setBusy(false) }
  }

  return <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-label="Foto croppen">
    <div className="w-full max-w-3xl rounded-2xl bg-[#FAF8F4] p-5 shadow-2xl">
      <div className="mb-4 flex items-center justify-between"><h2 className="font-['Cormorant_Garamond'] text-2xl text-[#1E1A14]">Foto croppen en schalen</h2><button onClick={onCancel}>✕</button></div>
      <div className="relative h-[420px] overflow-hidden rounded-xl bg-[#16130f]"><Cropper image={source} crop={crop} zoom={zoom} aspect={aspect} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} /></div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <label className="text-xs text-[#7A7268]">Uitsnede<select value={aspect} onChange={e => setAspect(Number(e.target.value))} className="mt-1 block w-full rounded-lg border p-2"><option value={16/9}>Liggend 16:9</option><option value={4/3}>Liggend 4:3</option><option value={1}>Vierkant 1:1</option><option value={3/4}>Staand 3:4</option></select></label>
        <label className="text-xs text-[#7A7268]">Zoom<input type="range" min={1} max={3} step={0.05} value={zoom} onChange={e => setZoom(Number(e.target.value))} className="mt-3 block w-full" /></label>
        <label className="text-xs text-[#7A7268]">Uitvoerbreedte (px)<input type="number" min={320} max={2400} step={10} value={width} onChange={e => setWidth(Math.max(320, Math.min(2400, Number(e.target.value))))} className="mt-1 block w-full rounded-lg border p-2" /></label>
      </div>
      <div className="mt-5 flex justify-end gap-2"><button onClick={onCancel} className="rounded-full border px-5 py-2 text-sm">Annuleren</button><button disabled={busy} onClick={confirm} className="rounded-full bg-[#C4A265] px-5 py-2 text-sm text-white disabled:opacity-50">{busy ? 'Verwerken…' : 'Crop toepassen'}</button></div>
    </div>
  </div>
}
