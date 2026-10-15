import { TOAST } from '../constants/strings'
import './PlaceholderPage.css'

interface PlaceholderPageProps {
  title: string
  description?: string
}

export function PlaceholderPage({ title, description = TOAST.comingSoon }: PlaceholderPageProps) {
  return (
    <div className="placeholder page">
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  )
}
