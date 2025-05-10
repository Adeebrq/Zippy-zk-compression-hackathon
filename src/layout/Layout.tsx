import Header from './Header'
import Footer from './Footer'
import { Outlet } from 'react-router-dom'
import { useThemeContext } from '../components/useThemeContext'

const Layout = () => {
  const { theme } = useThemeContext();

  return (
    <div className={`app-background min-h-screen ${theme}`}>
    <Header />
      <main className="container mx-auto px-4 py-8">
    <Outlet />
      </main>
      <Footer />
  </div>
  )
}

export default Layout
