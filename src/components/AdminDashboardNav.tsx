'use client'

import AdminMobileNav from '@/components/AdminMobileNav'

export type AdminDashboardNavKey =
  | 'overview'
  | 'customers'
  | 'courses'
  | 'calendar'
  | 'finance'
  | 'klassen'
  | 'knowledge'

const adminDashboardItems: {
  key: AdminDashboardNavKey
  label: string
  href: string
  icon: string
}[] = [
  { key: 'overview', label: 'Overzicht', href: '/admin', icon: '📊' },
  { key: 'customers', label: 'Klanten', href: '/admin/customers', icon: '👥' },
  { key: 'courses', label: 'Cursussen', href: '/admin/courses', icon: '📚' },
  { key: 'calendar', label: 'Agenda', href: '/admin?tab=calendar', icon: '📅' },
  { key: 'finance', label: 'Financiën', href: '/admin?tab=finance', icon: '💶' },
  { key: 'klassen', label: 'Klassen', href: '/admin?tab=klassen', icon: '🎓' },
  { key: 'knowledge', label: 'Kennis', href: '/admin/lux-knowledge', icon: '🤖' },
]

export function AdminDashboardMobileNav({ active }: { active?: AdminDashboardNavKey }) {
  return (
    <AdminMobileNav
      items={adminDashboardItems.map(item => ({
        label: item.label,
        href: item.href,
        icon: item.icon,
        active: item.key === active,
      }))}
    />
  )
}

export function AdminDashboardSidebar({ active }: { active?: AdminDashboardNavKey }) {
  return (
    <div className="hidden w-[220px] shrink-0 xl:block">
      <nav
        aria-label="Admin navigatie"
        className="sticky top-[74px] overflow-hidden rounded-2xl border border-[#eee] bg-white"
      >
        {adminDashboardItems.map(item => (
          <a
            key={item.key}
            href={item.href}
            aria-current={item.key === active ? 'page' : undefined}
            className={`flex w-full items-center gap-3 border-b border-[#f5f5f5] px-5 py-3.5 text-[13px] transition last:border-0 ${
              item.key === active
                ? 'bg-[#0C0A07] text-white'
                : 'text-[#666] hover:bg-[#fafafa]'
            }`}
          >
            <span aria-hidden="true" className="text-[16px]">{item.icon}</span>
            {item.label}
          </a>
        ))}
      </nav>
    </div>
  )
}
