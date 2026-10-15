import { AppRouter } from './routes'
import { Toast } from './components/Toast'
import './styles/global.css'

export default function App() {
  return (
    <>
      <AppRouter />
      <Toast />
    </>
  )
}
