import { getTrajectoryProgramme } from './trajectory-programme.ts'

const textStyle = 'font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:21px;color:#4a463e;'

export function renderTrajectoryProgrammeHtml(courseId: string | null | undefined, courseName: string): string {
  const programme = getTrajectoryProgramme(courseId, courseName)
  if (!programme) return ''

  const days = programme.days.map((day) => {
    const groups = day.groups.map((group) => `
      ${group.title ? `<div style="${textStyle}font-weight:700;color:#0C0A07;padding:10px 0 2px;">${group.title}</div>` : ''}
      <ul style="${textStyle}margin:5px 0 0;padding-left:20px;">${group.items.map((item) => `<li style="padding:0 0 5px;">${item}</li>`).join('')}</ul>`).join('')

    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e4ddd0;margin-top:16px;">
      <tr><td style="padding-top:18px;font-family:Arial,sans-serif;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;color:#C4A265;">${day.label}</td></tr>
      <tr><td style="font-family:'Cormorant Garamond',Georgia,serif;font-size:23px;line-height:29px;color:#0C0A07;padding:5px 0 6px;">${day.title}</td></tr>
      ${day.description ? `<tr><td style="${textStyle}padding-bottom:5px;">${day.description}</td></tr>` : ''}
      <tr><td>${groups}</td></tr>
    </table>`
  }).join('')

  const warning = programme.modelWarning
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff7e8;border-left:3px solid #C4A265;margin-top:20px;"><tr><td style="padding:16px 18px;">
        <div style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;font-weight:700;color:#9B5B47;padding-bottom:6px;">${programme.modelWarning.title}</div>
        <div style="${textStyle}">${programme.modelWarning.text}</div>
      </td></tr></table>`
    : ''

  const included = programme.included
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e4ddd0;margin-top:20px;"><tr><td style="padding-top:18px;">
        <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:23px;line-height:29px;color:#0C0A07;padding-bottom:6px;">${programme.included.title}</div>
        <ul style="${textStyle}margin:5px 0 0;padding-left:20px;">${programme.included.items.map((item) => `<li style="padding:0 0 5px;">${item}</li>`).join('')}</ul>
      </td></tr></table>`
    : ''

  const investment = programme.investment
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3efe7;border-radius:10px;margin-top:20px;"><tr><td style="padding:20px 22px;">
        <div style="font-family:Arial,sans-serif;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;color:#C4A265;padding-bottom:6px;">${programme.investment.title}</div>
        <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;line-height:34px;color:#0C0A07;">${programme.investment.price}</div>
        <div style="${textStyle}padding-bottom:10px;">${programme.investment.priceLabel}</div>
        <div style="${textStyle}">${programme.investment.certificate}</div>
      </td></tr></table>`
    : ''

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAF8F4;margin:0 0 26px;"><tr><td style="padding:4px 0 0;">
    <div style="font-family:Arial,sans-serif;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;color:#C4A265;text-align:center;padding-bottom:2px;">Dagprogramma</div>
    ${days}${warning}${included}${investment}
  </td></tr></table>`
}
