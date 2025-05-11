import Header from './Header'
import Footer from './Footer'
import { Outlet } from 'react-router-dom'
import { useThemeContext } from '../hooks/useThemeContext'
import styled from 'styled-components'

const Layout = () => {
  const { theme } = useThemeContext();

  return (
    <div className={`app-background min-h-screen ${theme}`}>
      <Header />
      <MainContainer>
        <Outlet />
      </MainContainer>
      <Footer />
    </div>
  )
}

const MainContainer = styled.main`
  position: relative;
  min-height: calc(100vh - 200px);
  overflow: hidden;
`;

export default Layout
