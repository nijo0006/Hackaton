import { Link } from 'react-router-dom'
import { Logo } from '../components/ui'

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center p-6 text-center">
      <div className="space-y-4">
        <div className="flex justify-center">
          <Logo />
        </div>
        <p className="text-muted">Siden findes ikke.</p>
        <Link to="/" className="inline-block rounded-xl bg-lime px-5 py-3 font-bold text-bg">
          Til forsiden
        </Link>
      </div>
    </div>
  )
}
