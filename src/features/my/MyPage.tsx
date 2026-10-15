import { useAuthStore } from '../../stores/authStore'
import { OhangBadge } from '../../components/OhangBadge'
import { Link } from 'react-router-dom'
import type { OhangType } from '../../constants/strings'
import './MyPage.css'

export function MyPage() {
  const ohangType = useAuthStore((s) => s.ohangType) as OhangType | null

  return (
    <div className="my page">
      {ohangType && (
        <div className="my__ohang-card">
          <OhangBadge type={ohangType} />
          <span>나의 오행 기질</span>
        </div>
      )}

      <Link to="/my/subscribe" className="my__banner">
        <span>프리미엄으로 더 깊은 이야기를</span>
        <span className="my__banner-cta">구독 안내 →</span>
      </Link>

      <nav className="my__menu" aria-label="설정 메뉴">
        <span className="my__menu-item my__menu-item--disabled">알림 설정</span>
        <span className="my__menu-item my__menu-item--disabled">프로필 수정</span>
        <span className="my__menu-item my__menu-item--disabled">공지 · 문의</span>
        <span className="my__menu-item my__menu-item--disabled">계정 관리</span>
      </nav>

      <p className="my__version">v0.0.0 (목업)</p>
    </div>
  )
}
