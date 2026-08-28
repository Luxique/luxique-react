'use client'

/* Compact horizontal-scroll nav for mobile and tablet.
   The desktop sidebar takes over at xl widths. */

export type AdminNavItem = {
  label: string
  href?: string        // navigate via <a>
  onClick?: () => void // or button (tab state)
  active?: boolean
  icon?: string        // emoji prefix
}

export default function AdminMobileNav({ items }: { items: AdminNavItem[] }) {
  const cls = (active?: boolean) =>
    `shrink-0 text-[12px] font-medium px-3.5 py-1.5 rounded-full border whitespace-nowrap transition ${
      active
        ? 'bg-[#0C0A07] text-white border-[#0C0A07]'
        : 'border-[#eee] text-[#666] bg-white'
    }`

  return (
    <div className="bg-white border-b border-[#eee] z-20 xl:hidden">
      <div className="flex gap-1.5 overflow-x-auto px-4 py-2.5 admin-no-scrollbar">
        {items.map((it, i) =>
          it.href ? (
            <a key={i} href={it.href} className={cls(it.active)}>
              {it.icon ? `${it.icon} ` : ''}{it.label}
            </a>
          ) : (
            <button key={i} onClick={it.onClick} className={cls(it.active)}>
              {it.icon ? `${it.icon} ` : ''}{it.label}
            </button>
          )
        )}
      </div>
    </div>
  )
}
