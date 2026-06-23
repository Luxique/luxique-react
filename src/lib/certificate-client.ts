'use client'

import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

/**
 * Generate certificate PDF client-side using html2canvas + jsPDF.
 * Renders the certificate HTML template in a hidden off-screen container,
 * captures it as canvas, then wraps it in an A4 landscape PDF.
 */

const TEMPLATE_PATH = '/certificate-template.html'

export type CertificateData = {
  recipientName: string
  courseName: string
  dateStr: string
  certificateId: string
}

async function fetchTemplate(): Promise<string> {
  const res = await fetch(TEMPLATE_PATH)
  if (!res.ok) throw new Error('Could not load certificate template')
  return res.text()
}

function fillTemplate(html: string, data: CertificateData): string {
  const { recipientName, courseName, dateStr, certificateId } = data

  // Auto-shrink long names
  const nameLength = recipientName.length
  let nameStyle = ''
  if (nameLength > 20) {
    const shrink = Math.max(0.55, 1 - (nameLength - 20) * 0.025)
    nameStyle = `<style>.name{font-size:${Math.round(72 * shrink)}px !important}</style>`
  }

  let filled = html
    .replace(/\{\{RECIPIENT_NAME\}\}/g, recipientName)
    .replace(/\{\{COURSE_NAME\}\}/g, courseName)
    .replace(/\{\{DATE\}\}/g, dateStr)
    .replace(/\{\{CERTIFICATE_ID\}\}/g, certificateId)

  if (nameStyle) {
    filled = filled.replace('</head>', `${nameStyle}</head>`)
  }

  return filled
}

export async function generateCertificatePDF(data: CertificateData): Promise<void> {
  // 1. Load and fill template
  const templateHtml = await fetchTemplate()
  const filledHtml = fillTemplate(templateHtml, data)

  // 2. Create off-screen container
  const container = document.createElement('div')
  container.style.cssText = `
    position: fixed;
    left: -9999px;
    top: 0;
    width: 1200px;
    height: 850px;
    z-index: -1;
    pointer-events: none;
  `
  container.innerHTML = filledHtml
  document.body.appendChild(container)

  try {
    // 3. Wait for fonts to be ready (critical for Pinyon Script, Cormorant)
    await (document as any).fonts.ready

    // 3b. Wait for all images to be fully loaded (critical for PNG logos)
    const imgs = Array.from(container.querySelectorAll('img')) as HTMLImageElement[]
    await Promise.all(imgs.map(img => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve()
      return new Promise<void>((resolve) => {
        img.onload = () => resolve()
        img.onerror = () => resolve() // don't block on error
      })
    }))

    await new Promise(r => setTimeout(r, 300))

    // 4. Find the root element to capture
    const captureEl = container.querySelector('.certificate-container') as HTMLElement
      || container.querySelector('body > *') as HTMLElement
      || container

    // 5. Render to canvas at 2x for quality
    const canvas = await html2canvas(captureEl, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: null,
      width: 1200,
      height: 850,
    })

    // 6. Convert to PDF — A4 landscape
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
      compress: true,
    })

    const pdfWidth = 297 // A4 landscape width in mm
    const pdfHeight = 210 // A4 landscape height in mm

    // Fit canvas to PDF page maintaining aspect ratio
    const imgData = canvas.toDataURL('image/jpeg', 0.95)
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight)

    // 7. Save
    pdf.save(`LUXIQUE-Certificate-${data.certificateId}.pdf`)
  } finally {
    document.body.removeChild(container)
  }
}

/**
 * Deterministic certificate ID: LXQ-{year}-{xxxx}
 * Same input always produces same ID.
 */
export function generateCertificateId(userId: string, courseId: string): string {
  // Simple hash — deterministic, no crypto needed client-side
  const input = `${userId}:${courseId}`
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  const num = (Math.abs(hash) % 9999) + 1
  const year = new Date().getFullYear()
  return `LXQ-${year}-${String(num).padStart(4, '0')}`
}

/**
 * Format date as "22 June 2026"
 */
export function formatCertDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}
