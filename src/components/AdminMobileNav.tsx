'use client'

import type { ReactNode } from 'react'

/* Compact horizontal-scroll nav for mobile and tablet.
   The desktop sidebar takes over at xl widths. */

export type AdminNavItem = {
  label: string
  href?: string        // navigate via <a>
  onClick?: () => void // or button (tab state)
  active?: boolean
  icon?: string        // emoji prefix
}

export default function AdminMobileNav({ items, belowNav }: { items: AdminNavItem[]; belowNav?: ReactNode }) {
  const cls = (active?: boolean) =>
    `flex min-h-10 shrink-0 items-center text-[12px] font-medium px-3.5 py-2 rounded-full border whitespace-nowrap transition ${
      active
        ? 'bg-[#0C0A07] text-white border-[#0C0A07]'
        : 'border-[#eee] text-[#666] bg-white'
    }`

  return (
    <div className="relative z-20 mt-3 border-y border-[#eee] bg-white xl:hidden">
      <div className="admin-no-scrollbar flex gap-2 overflow-x-auto px-3 py-2.5 sm:px-4">
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
      {belowNav}
    </div>
  )
}
