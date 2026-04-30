export default function ReelsSection() {
  const reels = [
    { title: 'Wispy Set Timelapse', views: '12.4K' },
    { title: 'Eye Mapping Tutorial', views: '8.9K' },
    { title: 'Before & After', views: '15.2K' },
    { title: 'Lash Curl Guide', views: '6.7K' },
  ]

  return (
    <section className="py-24 bg-[var(--bg2)]">
      <div className="max-w-[900px] mx-auto px-6">
        <div className="section-tag text-center">Social</div>
        <h2 className="section-title text-center mb-4">
          Reels & <em>TikTok</em>
        </h2>
        <p className="text-center text-[14px] text-[var(--text2)] max-w-[500px] mx-auto mb-12">
          Volg @lashedbychiva voor tutorials, behind the scenes en tips.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {reels.map((r, i) => (
            <div key={i} className="relative aspect-[9/16] bg-gradient-to-br from-[#1C1812] to-[#2a2218] rounded-2xl overflow-hidden flex items-end border border-white/10 hover:border-[var(--rose)]/30 transition cursor-pointer group">
              {/* Play button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:bg-[var(--rose)]/30 transition">
                  <span className="text-white text-xl ml-1">▶</span>
                </div>
              </div>
              {/* Video placeholder — replace with actual reels */}
              <div className="absolute inset-0 flex items-center justify-center opacity-20">
                <span className="text-white/30 text-[60px]">🎬</span>
              </div>
              <div className="relative z-10 p-4 w-full bg-gradient-to-t from-black/60 to-transparent">
                <p className="text-[12px] text-white font-medium">{r.title}</p>
                <p className="text-[10px] text-white/50">{r.views} views</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <a href="https://instagram.com/lashedbychiva" target="_blank" className="text-[13px] text-[var(--rose)] font-semibold hover:text-[var(--rose-light)] transition">
            Volg op Instagram →
          </a>
        </div>
      </div>
    </section>
  )
}
