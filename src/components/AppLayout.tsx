import { Outlet } from 'react-router-dom'
import { TabBar } from './TabBar'

export function AppLayout() {
  return (
    <div className="app-shell">
      <Outlet />
      <TabBar />
    </div>
  )
}
