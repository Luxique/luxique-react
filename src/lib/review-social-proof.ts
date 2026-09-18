export const GOOGLE_REVIEWS_PROFILE_URL = 'https://www.google.nl/search?q=Lashed+by+Chiva&si=AL3DRZEsmMGCryMMFSHJ3StBhOdZ2-6yYkXd_doETEE1OR-qOXnNn9cjqmnpbyGwwilPiiFoL9NRN9JMEJIRkgOBDP-1dimnJRkrkciqpSFldaZS9zcFoZM%3D'
export const GOOGLE_REVIEW_WRITE_URL = 'https://search.google.com/local/writereview?placeid=ChIJqwSMZ9Gnx0cR_1laVkvccp0'

export const REVIEW_SOCIAL_PROOF = {
  stars: 5,
  rating: '5.0',
  count: 47,
  avatars: [
    'https://osldoolmbpqayxhgmbum.supabase.co/storage/v1/render/image/public/images/het-werk-1.webp?width=80&quality=75&resize=contain',
    'https://osldoolmbpqayxhgmbum.supabase.co/storage/v1/render/image/public/images/het-werk-2.webp?width=80&quality=75&resize=contain',
    'https://osldoolmbpqayxhgmbum.supabase.co/storage/v1/render/image/public/images/het-werk-3.webp?width=80&quality=75&resize=contain',
  ],
} as const

export function renderEmailReviewProof(): string {
  const avatars = REVIEW_SOCIAL_PROOF.avatars.map((src, index) => `
    <td width="24" style="width:24px; padding:0;">
      <img src="${src}" width="32" height="32" alt="" style="display:block; width:32px; height:32px; border:2px solid #FFFFFF; border-radius:18px; object-fit:cover;${index ? ' margin-left:-8px;' : ''}">
    </td>`).join('')

  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 24px auto; border:1px solid #e4ddd0; border-radius:22px; background-color:#FFFFFF;">
  <tr>
    <td style="padding:7px 10px 7px 12px;">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>${avatars}</tr></table>
    </td>
    <td style="padding:7px 14px 7px 10px; font-family:Arial, Helvetica, sans-serif; white-space:nowrap;">
      <img src="https://www.luxique.nl/google-logo.png" width="14" height="14" alt="Google" style="display:inline-block; width:14px; height:14px; border:0; vertical-align:-2px; margin-right:5px;">
      <span style="font-size:13px; line-height:18px; color:#C4A265; letter-spacing:1px;">${'★'.repeat(REVIEW_SOCIAL_PROOF.stars)}</span><br>
      <span style="font-size:12px; line-height:16px; font-weight:bold; color:#1A1815;">${REVIEW_SOCIAL_PROOF.rating} &middot; ${REVIEW_SOCIAL_PROOF.count} reviews</span>
    </td>
  </tr>
</table>`
}
