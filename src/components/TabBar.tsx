import { NavLink } from 'react-router-dom'
import './TabBar.css'

const TABS = [
  { to: '/garden', label: '정원', icon: '🌙' },
  { to: '/collection', label: '도감', icon: '📖' },
  { to: '/my', label: '마이', icon: '✨' },
] as const

export function TabBar() {
  return (
    <nav className="tab-bar" aria-label="메인 탭">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) =>
            `tab-bar__item${isActive ? ' tab-bar__item--active' : ''}`
          }
        >
          <span className="tab-bar__icon" aria-hidden="true">
            {tab.icon}
          </span>
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
