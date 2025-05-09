import Header from './Header'
import Footer from './Footer'
import { Outlet } from 'react-router-dom'

const Layout  = () => {
  return (
    <div className="app-background">
    <Header />
    <Outlet />
  </div>
  )
}

export default Layout

// ({ toggleTheme }: { toggleTheme: () => void }