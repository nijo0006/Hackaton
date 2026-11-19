import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import NotFound from './pages/NotFound'
import DjLayout from './pages/dj/DjLayout'
import DjQueue from './pages/dj/DjQueue'
import DjRecap from './pages/dj/DjRecap'
import GuestHome from './pages/guest/GuestHome'
import GuestLayout from './pages/guest/GuestLayout'
import Search from './pages/guest/Search'
import Sent from './pages/guest/Sent'
import Venue from './pages/venue/Venue'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/club/:clubId" element={<GuestLayout />}>
        <Route index element={<GuestHome />} />
        <Route path="search" element={<Search />} />
        <Route path="sent/:requestId" element={<Sent />} />
      </Route>
      <Route path="/dj/:clubId" element={<DjLayout />}>
        <Route index element={<DjQueue />} />
        <Route path="recap" element={<DjRecap />} />
      </Route>
      <Route path="/venue/:clubId" element={<Venue />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
