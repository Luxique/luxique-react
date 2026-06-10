import { NextRequest, NextResponse } from 'next/server'
import PDFDocument from 'pdfkit'

export async function POST(request: NextRequest) {
  try {
    const { userId, courseId, courseTitle } = await request.json()
    if (!userId || !courseId || !courseTitle) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Fetch user name from Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    let userName = 'Student'
    try {
      const authRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
      })
      if (authRes.ok) {
        const userData = await authRes.json()
        userName = userData?.user_metadata?.full_name || userData?.email?.split('@')[0] || 'Student'
      }
    } catch {
      // Fallback
    }

    // Generate PDF
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margins: { top: 60, bottom: 60, left: 60, right: 60 },
    })

    const chunks: Buffer[] = []
    doc.on('data', (chunk: Buffer) => chunks.push(chunk))

    const w = doc.page.width
    const h = doc.page.height

    // Background
    doc.rect(0, 0, w, h).fill('#0c100d')

    // Border
    doc.rect(30, 30, w - 60, h - 60).lineWidth(1).strokeColor('#c9a86a').stroke()
    doc.rect(36, 36, w - 72, h - 72).lineWidth(0.5).strokeColor('rgba(201,168,106,0.3)').stroke()

    // Gold accent line at top
    doc.rect(w / 2 - 40, 70, 80, 1.5).fill('#c9a86a')

    // LUXIQUE text
    doc.font('Helvetica').fontSize(10).fillColor('#c9a86a')
      .text('LUXIQUE ACADEMY', 0, 90, { align: 'center', characterSpacing: 4 })

    // Certificate of Completion
    doc.font('Helvetica').fontSize(28).fillColor('#f0ece4')
      .text('CERTIFICAAT', 0, 120, { align: 'center', characterSpacing: 2 })
    doc.font('Helvetica').fontSize(12).fillColor('#8a8578')
      .text('van Voltooiing', 0, 155, { align: 'center' })

    // Decorative line
    doc.rect(w / 2 - 30, 180, 60, 0.5).fill('#c9a86a')

    // "This certifies that"
    doc.font('Helvetica').fontSize(11).fillColor('#8a8578')
      .text('Dit certificeert dat', 0, 200, { align: 'center' })

    // Student name
    doc.font('Helvetica').fontSize(26).fillColor('#f0ece4')
      .text(userName, 0, 225, { align: 'center' })

    // Line under name
    const nameWidth = doc.widthOfString(userName)
    doc.rect(w / 2 - Math.min(nameWidth / 2 + 20, 150), 258, Math.min(nameWidth + 40, 300), 0.5).fill('#c9a86a')

    // "has successfully completed"
    doc.font('Helvetica').fontSize(11).fillColor('#8a8578')
      .text('succesvol heeft afgerond', 0, 275, { align: 'center' })

    // Course title
    doc.font('Helvetica').fontSize(20).fillColor('#c9a86a')
      .text(courseTitle, 0, 300, { align: 'center' })

    // Date
    const dateStr = new Date().toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })
    doc.font('Helvetica').fontSize(10).fillColor('#8a8578')
      .text(dateStr, 0, 345, { align: 'center' })

    // Bottom decorative line
    doc.rect(w / 2 - 40, 380, 80, 0.5).fill('#c9a86a')

    // Footer
    doc.font('Helvetica').fontSize(8).fillColor('#8a8578')
      .text('LUXIQUE Academy · Certificaat van Voltooiing', 0, 400, { align: 'center', characterSpacing: 2 })

    // Certificate ID (bottom left)
    const certId = `LX-${Date.now().toString(36).toUpperCase()}`
    doc.font('Helvetica').fontSize(7).fillColor('rgba(138,133,120,0.5)')
      .text(`ID: ${certId}`, 50, h - 55)

    doc.end()

    const pdfBuffer = await new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)))
    })

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="luxique-certificaat.pdf"',
      },
    })
  } catch (err) {
    console.error('Certificate generation error:', err)
    return NextResponse.json({ error: 'Failed to generate certificate' }, { status: 500 })
  }
}
