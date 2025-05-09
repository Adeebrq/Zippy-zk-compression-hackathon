import { useState, useEffect } from 'react';
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import CreatorPage from './pages/CreatorPage';

import './App.css';
import Layout from './layout/Layout';

function App() {
  // const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // useEffect(() => {
  //   document.body.className = theme;
  // }, [theme]);

  // const toggleTheme = () => {
  //   setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  // };

  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<CreatorPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
