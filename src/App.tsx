import { useState, useEffect } from 'react';
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { ThemeProvider as CustomThemeProvider, useThemeContext } from './components/useThemeContext.tsx';
import { lightTheme, darkTheme } from './components/theme';
import CreatorPage from './pages/CreatorPage';

import './App.css';
import Layout from './layout/Layout';

// Wrapper component to handle theme switching
const AppWithTheme = () => {
  const { theme } = useThemeContext();

  return (
    <StyledThemeProvider theme={theme === 'light' ? lightTheme : darkTheme}>
     <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<CreatorPage />} />
        </Route>
      </Routes>
    </Router>
    </StyledThemeProvider>
  );
};


function App() {

  return (
    <CustomThemeProvider>
    <AppWithTheme />
  </CustomThemeProvider>
  );
}

export default App;
