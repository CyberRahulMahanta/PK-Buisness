import { Outlet } from 'react-router-dom'
import Navbar from './Navbar.jsx'
import Footer from './Footer.jsx'
import WhatsAppButton from './WhatsAppButton.jsx'
import GetInTouchModal from './GetInTouchModal.jsx'

function PublicLayout() {
  return (
    <div className="site-shell">
      <Navbar />
      <main className="public-main">
        <Outlet />
      </main>
      <Footer />
      <WhatsAppButton />
      <GetInTouchModal />
    </div>
  )
}

export default PublicLayout
