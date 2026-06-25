'use client'

import { useTranslations } from 'next-intl'

interface Props {
  theme?: 'light' | 'dark'
  features?: string[]
  colLxq?: string
  colStandard?: string
  titlePre?: string
  titleAccent?: string
  introText?: string
  footerPre?: string
  footerEm?: string
  footerPost?: string
}

export default function ComparisonTable({ theme = 'light', features: featuresProp, colLxq: colLxqProp, colStandard: colStandardProp, titlePre: titlePreProp, titleAccent: titleAccentProp, introText: introTextProp, footerPre: footerPreProp, footerEm: footerEmProp, footerPost: footerPostProp }: Props) {
  const t = useTranslations('Vergelijking')

  const defaultFeatures = [
    t('row1'), t('row2'), t('row3'), t('row4'), t('row5'),
    t('row6'), t('row7'), t('row8'), t('row9'),
  ]
  
  const features = featuresProp || defaultFeatures
  const colLxq = colLxqProp || t('colLxq')
  const colStandard = colStandardProp || t('colStandard')
  const footerPre = footerPreProp || `${t('footerPre')} <em>${t('footerEm1')}</em> ${t('footerMid')}`
  const footerEm = footerEmProp || t('footerEm2')
  const footerPost = footerPostProp || t('footerPost')
  const footerText = `${footerPre} <em>${footerEm}</em> ${footerPost}`
  const titlePre = titlePreProp || t('title1')
  const titleAccent = titleAccentProp || t('title2')
  const introText = introTextProp || t('subtitle')

  const checkSVG = (
    <svg viewBox="0 0 100 100" width="14" height="14">
      <path d="M96.975 24.985 36.627 85.332c-.702.7-1.839.7-2.542 0L3.025 54.27c-.7-.703-.7-1.84 0-2.542l7.775-7.775c.703-.7 1.84-.7 2.542 0L35.358 65.97l51.3-51.3c.703-.7 1.84-.7 2.542 0l7.775 7.774c.7.703.7 1.84 0 2.542z" fill="#9E7E45"/>
    </svg>
  )

  const isDark = theme === 'dark'

  return (
    <section className={isDark ? 'comp-section' : 'comp-section'}>
      <div className="comp-page-width">
        <div className="comp-grid">
          <div className={isDark ? 'comp-content comp-content-dark' : 'comp-content'}>
            <p className="comp-eyebrow">{t('eyebrow')}</p>
            <h2 className={isDark ? 'comp-title comp-title-dark' : 'comp-title'}>
              {titlePre} <em>{titleAccent}</em>
            </h2>
            <div className="comp-desc">
              <p className={isDark ? 'comp-desc-dark' : ''}>
                {introText}
              </p>
            </div>
          </div>

          <div className="comp-features">
            <div className="comp-header-row">
              <div className="comp-header comp-header-spacer" />
              <div className="comp-header comp-header-lxq">
                <span className="comp-spark">✦</span>
                <span className="comp-col-name">{colLxq}</span>
              </div>
              <div className="comp-header comp-header-std">
                <span className="comp-col-name-std">{colStandard}</span>
              </div>
            </div>

            <div className="comp-body-row">
              <div className={isDark ? 'comp-features-list comp-features-list-dark' : 'comp-features-list'}>
                {features.map((f, i) => (
                  <div key={i} className={isDark ? 'comp-feature-item comp-feature-item-dark' : 'comp-feature-item'}>{f}</div>
                ))}
              </div>

              <div className="comp-check-col">
                {features.map((_, i) => (
                  <div key={i} className="comp-check-item">
                    <span className="comp-check-circle">{checkSVG}</span>
                  </div>
                ))}
              </div>

              <div className={isDark ? 'comp-cross-col comp-cross-col-dark' : 'comp-cross-col'}>
                {features.map((_, i) => (
                  <div key={i} className="comp-check-item">
                    <span className={isDark ? 'comp-cross-circle-dark' : 'comp-cross-circle'}>
                      <span className={isDark ? 'comp-cross-mark-dark' : 'comp-cross-mark'}>✕</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <p className={isDark ? 'comp-closing comp-closing-dark' : 'comp-closing'}
          dangerouslySetInnerHTML={{ __html: footerText }}
        />
      </div>

      <style jsx>{`
        .comp-section { position:relative; overflow:hidden; padding:90px 0 70px; }
        .comp-page-width { margin:0 auto; width:100%; max-width:1180px; padding:0 40px; }
        .comp-grid { display:grid; grid-template-columns:1fr 1.05fr; gap:64px; align-items:center; }

        .comp-content { max-width:520px; }
        .comp-content-dark { max-width:520px; }
        .comp-eyebrow { font-family:'Outfit',sans-serif; font-size:12px; font-weight:600; letter-spacing:.32em; text-transform:uppercase; color:#C4A265; margin:0 0 22px; }
        .comp-title { font-family:'Cormorant Garamond',serif; font-size:64px; font-weight:500; line-height:1.04; margin:0 0 28px; color:#0C0A07; letter-spacing:-.01em; }
        .comp-title em { font-style:italic; color:#C4A265; }
        .comp-title-dark { color:#EDE7DB !important; }
        .comp-title-dark em { color:#E4C98A !important; }
        .comp-desc p { font-family:'Cormorant Garamond',serif; font-size:21px; font-style:italic; line-height:1.5; color:#2C2A25; margin:0; max-width:430px; }
        .comp-desc-dark { color:#C9BFB2 !important; }

        .comp-features { display:flex; flex-direction:column; width:100%; position:relative; }
        .comp-header-row { display:grid; grid-template-columns:2fr 1fr 1fr; gap:14px; align-items:end; }
        .comp-header { padding:20px 12px 18px; display:flex; align-items:center; justify-content:center; flex-direction:column; gap:6px; border-radius:16px 16px 0 0; width:100%; text-align:center; }
        .comp-header-spacer { background:transparent; padding:0; }
        .comp-header-lxq { background:linear-gradient(180deg,#E4C98A,#C4A265); margin-top:-26px; padding-top:30px; box-shadow:0 -14px 40px rgba(196,162,101,.35); position:relative; }
        .comp-dark .comp-header-lxq { box-shadow:0 -14px 50px rgba(196,162,101,.5); }
        .comp-spark { font-size:14px; color:rgba(255,255,255,.9); line-height:1; margin-bottom:2px; }
        .comp-col-name { font-family:'Outfit',sans-serif; font-weight:600; font-size:14px; line-height:1.25; color:#fff; letter-spacing:.02em; }
        .comp-header-std { background:transparent; }
        .comp-col-name-std { font-family:'Outfit',sans-serif; font-weight:600; font-size:11px; line-height:1.3; letter-spacing:.18em; text-transform:uppercase; color:#9a958b; }

        .comp-body-row { display:grid; grid-template-columns:2fr 1fr 1fr; gap:14px; }

        /* Features list */
        .comp-features-list { background:#F2EEE6; border-radius:18px; overflow:hidden; border:1px solid rgba(12,10,7,.08); }
        .comp-features-list-dark { background:linear-gradient(180deg,#211A11,#1A150E) !important; border-color:rgba(228,201,138,.10) !important; }
        .comp-feature-item { padding:0 26px; height:74px; display:flex; align-items:center; border-bottom:1px solid rgba(12,10,7,.08); font-size:16px; font-weight:400; line-height:1.35; color:#2C2A25; font-family:'Outfit',sans-serif; }
        .comp-feature-item:last-child { border-bottom:none; }
        .comp-feature-item-dark { color:#EDE7DB !important; border-bottom-color:rgba(228,201,138,.10) !important; }

        /* Check column (LXQ) */
        .comp-check-col { background:linear-gradient(180deg,#E4C98A,#9E7E45); border-radius:0 0 18px 18px; overflow:hidden; margin-bottom:-26px; padding-bottom:26px; box-shadow:0 24px 50px rgba(196,162,101,.3); }
        .comp-dark .comp-check-col { box-shadow:0 24px 60px rgba(196,162,101,.4); }
        .comp-check-item { height:74px; display:flex; align-items:center; justify-content:center; border-bottom:1px solid rgba(255,255,255,.16); }
        .comp-check-item:last-child { border-bottom:none; }
        .comp-check-circle { width:30px; height:30px; border-radius:50%; background:#fff; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 6px rgba(0,0,0,.12); }

        /* Cross column (Standaard) */
        .comp-cross-col { background:#fff; border:1px solid rgba(12,10,7,.08); border-radius:0 0 18px 18px; overflow:hidden; }
        .comp-cross-col-dark { background:linear-gradient(180deg,#1C1610,#141009) !important; border-color:rgba(228,201,138,.10) !important; }
        .comp-cross-col .comp-check-item { border-bottom:1px solid rgba(12,10,7,.08); }
        .comp-cross-col-dark .comp-check-item { border-bottom-color:rgba(228,201,138,.10) !important; }
        .comp-cross-circle { width:30px; height:30px; border-radius:50%; border:1.5px solid rgba(12,10,7,.12); display:flex; align-items:center; justify-content:center; }
        .comp-cross-mark { color:#C77; font-size:13px; font-weight:400; }
        .comp-cross-circle-dark { width:30px; height:30px; border-radius:50%; border:1.5px solid rgba(181,99,92,.4); background:rgba(181,99,92,.12); display:flex; align-items:center; justify-content:center; }
        .comp-cross-mark-dark { color:#C97B72; font-size:13px; font-weight:600; }

        /* Closing */
        .comp-closing { max-width:680px; margin:54px auto 0; text-align:center; font-family:'Cormorant Garamond',serif; font-style:italic; font-size:23px; line-height:1.5; color:#2C2A25; }
        .comp-closing em { color:#C4A265; font-style:italic; font-weight:600; }
        .comp-closing-dark { color:#C9BFB2 !important; }
        .comp-closing-dark em { color:#E4C98A !important; }

        /* RESPONSIVE — 1024 */
        @media (max-width:1024px) {
          .comp-grid { grid-template-columns:1fr; gap:44px; }
          .comp-content, .comp-content-dark { max-width:100%; text-align:center; }
          .comp-title, .comp-title-dark { text-align:center; font-size:54px; }
          .comp-desc p, .comp-desc-dark { margin:0 auto; }
          .comp-features { max-width:720px; margin:0 auto; width:100%; }
        }
        /* RESPONSIVE — 768 */
        @media (max-width:768px) {
          .comp-section { padding:56px 0 44px; }
          .comp-page-width { padding:0 20px; }
          .comp-title, .comp-title-dark { font-size:34px; }
          .comp-desc p { font-size:18px; }
          .comp-header-row { grid-template-columns:minmax(140px,2fr) minmax(64px,1fr) minmax(64px,1fr); gap:8px; }
          .comp-body-row { grid-template-columns:minmax(140px,2fr) minmax(64px,1fr) minmax(64px,1fr); gap:8px; }
          .comp-feature-item, .comp-feature-item-dark { height:60px; padding:0 16px; font-size:13px; }
          .comp-check-item { height:60px; }
          .comp-check-circle, .comp-cross-circle, .comp-cross-circle-dark { width:26px; height:26px; }
          .comp-header { padding:14px 6px 12px; border-radius:12px 12px 0 0; }
          .comp-header-lxq { margin-top:-18px; padding-top:20px; }
          .comp-col-name { font-size:12px; }
          .comp-check-col { margin-bottom:-18px; padding-bottom:18px; }
          .comp-closing, .comp-closing-dark { font-size:19px; margin-top:38px; }
        }
        /* RESPONSIVE — 480 */
        @media (max-width:480px) {
          .comp-header-row { gap:5px; }
          .comp-body-row { gap:5px; }
          .comp-feature-item, .comp-feature-item-dark { padding:0 12px; font-size:12px; }
          .comp-col-name-std { font-size:10px; letter-spacing:.1em; }
        }
      `}</style>
    </section>
  )
}
