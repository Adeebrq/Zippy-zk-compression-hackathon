import { useState } from 'react'
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom'
import CreatorPage from './pages/CreatorPage'

import './App.css'

function App() {

  return (

    <Router>
     <Routes>
          <Route path="/" element={<CreatorPage />} />
  </Routes>
  </Router>

  )
}

export default App
