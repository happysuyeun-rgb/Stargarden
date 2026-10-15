import { AppRouter } from './routes'
import { OfflineBanner } from './components/OfflineBanner'
import { Toast } from './components/Toast'
import './styles/global.css'

export default function App() {
  return (
    <>
      <OfflineBanner />
      <AppRouter />
      <Toast />
    </>
  )
}
